'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const resolveOrg = require('../middleware/resolveOrg');
const { sendWelcome, sendOrgWelcome, sendEmailVerification } = require('../services/email');

const router = express.Router();

// Reserved slugs that can't be used as subdomains
const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'ftp', 'ssh',
  'blog', 'help', 'support', 'docs', 'status', 'enrollpack', 'default',
  'signup', 'login', 'register', 'verify', 'dashboard', 'billing', 'static',
]);

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Check slug availability (public) ────────────────────────────────────────
router.get('/check-slug', (req, res) => {
  const slug = (req.query.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!slug || slug.length < 2) return res.json({ available: false, reason: 'Too short' });
  if (slug.length > 30)        return res.json({ available: false, reason: 'Too long' });
  if (RESERVED_SLUGS.has(slug)) return res.json({ available: false, reason: 'Reserved' });

  const taken = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(slug);
  res.json({ available: !taken, slug });
});

// ─── Self-service org signup (public) ────────────────────────────────────────
router.post('/org-signup', (req, res) => {
  const { org_name, slug, admin_name, email, password } = req.body;

  if (!org_name || !slug || !admin_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (cleanSlug.length < 2)         return res.status(400).json({ error: 'Subdomain must be at least 2 characters.' });
  if (cleanSlug.length > 30)        return res.status(400).json({ error: 'Subdomain must be 30 characters or fewer.' });
  if (RESERVED_SLUGS.has(cleanSlug)) return res.status(400).json({ error: 'That subdomain is reserved. Please choose another.' });

  if (db.prepare('SELECT id FROM organizations WHERE slug = ?').get(cleanSlug)) {
    return res.status(409).json({ error: 'That subdomain is already taken.' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ? AND role = ?').get(email.toLowerCase().trim(), 'admin')) {
    return res.status(409).json({ error: 'An admin account with this email already exists.' });
  }

  // Create the org on trial
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const orgResult = db.prepare(`
    INSERT INTO organizations (name, slug, owner_email, plan, trial_ends_at)
    VALUES (?, ?, ?, 'trial', ?)
  `).run(org_name.trim(), cleanSlug, email.toLowerCase().trim(), trialEndsAt);

  const orgId = orgResult.lastInsertRowid;

  // Create the admin user — unverified until email is confirmed
  const hash  = bcrypt.hashSync(password, 12);
  const token = generateToken();
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 h

  db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role,
                       email_verified, verification_token, verification_token_expires_at)
    VALUES (?, ?, ?, ?, 'admin', 0, ?, ?)
  `).run(orgId, email.toLowerCase().trim(), hash, admin_name.trim(), token, tokenExpires);

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
  const verifyUrl = `https://${appDomain}/verify-email?token=${token}`;

  // Fire-and-forget verification email
  sendEmailVerification({
    to: email.toLowerCase().trim(),
    adminName: admin_name.trim(),
    org,
    verifyUrl,
  });

  res.status(201).json({
    message: 'Account created. Please check your email to verify your address before logging in.',
    slug: cleanSlug,
  });
});

// ─── Verify email (public) ───────────────────────────────────────────────────
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Verification token is required.' });

  const user = db.prepare(
    'SELECT * FROM users WHERE verification_token = ?'
  ).get(token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or already used verification link.' });
  }
  if (new Date(user.verification_token_expires_at) < new Date()) {
    return res.status(400).json({ error: 'This verification link has expired. Please request a new one.', expired: true, email: user.email });
  }

  db.prepare(`
    UPDATE users
    SET email_verified = 1, verification_token = NULL, verification_token_expires_at = NULL
    WHERE id = ?
  `).run(user.id);

  // Fetch org so we can return the slug for the frontend redirect
  const org = db.prepare('SELECT slug, name FROM organizations WHERE id = ?').get(user.org_id);

  // Fire-and-forget org welcome email now that they're verified
  if (org) {
    const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
    const fullOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(user.org_id);
    sendOrgWelcome({
      to: user.email,
      adminName: user.full_name,
      org: fullOrg,
      loginUrl: `https://${org.slug}.${appDomain}/login`,
    });
  }

  res.json({
    message: 'Email verified! You can now log in.',
    slug: org?.slug || null,
    org_name: org?.name || null,
  });
});

// ─── Resend verification email (public) ──────────────────────────────────────
router.post('/resend-verification', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = db.prepare(
    "SELECT * FROM users WHERE email = ? AND role = 'admin' AND email_verified = 0"
  ).get(email.toLowerCase().trim());

  // Always return 200 to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If that email is registered and unverified, you will receive a new link shortly.' });
  }

  const token      = generateToken();
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    UPDATE users SET verification_token = ?, verification_token_expires_at = ? WHERE id = ?
  `).run(token, tokenExpires, user.id);

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(user.org_id);
  const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
  sendEmailVerification({
    to: user.email,
    adminName: user.full_name,
    org,
    verifyUrl: `https://${appDomain}/verify-email?token=${token}`,
  });

  res.json({ message: 'If that email is registered and unverified, you will receive a new link shortly.' });
});

// ─── Superadmin login — no org context required ──────────────────────────────
router.post('/superadmin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare(
    "SELECT * FROM users WHERE email = ? AND role = 'superadmin' LIMIT 1"
  ).get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name, org_id: null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, org_id: null },
  });
});

// ─── Register a new parent — scoped to the current org ───────────────────────
router.post('/register', resolveOrg, (req, res) => {
  const { email, password, full_name, phone } = req.body;
  const orgId = req.org.id;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare(
    'SELECT id FROM users WHERE org_id = ? AND email = ?'
  ).get(orgId, email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const hash   = bcrypt.hashSync(password, 12);
  const result = db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role, phone, email_verified)
    VALUES (?, ?, ?, ?, 'parent', ?, 1)
  `).run(orgId, email.toLowerCase().trim(), hash, full_name.trim(), phone || null);

  const token = jwt.sign(
    { id: result.lastInsertRowid, email: email.toLowerCase().trim(), role: 'parent', full_name: full_name.trim(), org_id: orgId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Fire-and-forget welcome email
  const appDomain  = process.env.APP_DOMAIN || 'enrollpack.com';
  const dashboardUrl = `https://${req.org.slug}.${appDomain}/dashboard`;
  sendWelcome({ to: email.toLowerCase().trim(), parentName: full_name.trim(), org: req.org, dashboardUrl });

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, email, full_name, role: 'parent', org_id: orgId },
  });
});

// ─── Login — scoped to org; superadmin can log in from any context ────────────
router.post('/login', resolveOrg, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const orgId = req.org.id;
  const user  = db.prepare(`
    SELECT * FROM users
    WHERE email = ? AND (org_id = ? OR role = 'superadmin')
    LIMIT 1
  `).get(email.toLowerCase().trim(), orgId);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Block unverified org admins
  if (user.role === 'admin' && !user.email_verified) {
    return res.status(403).json({
      error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      email_unverified: true,
      email: user.email,
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name, org_id: user.org_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, org_id: user.org_id },
  });
});

// ─── Forgot password — scoped to org ─────────────────────────────────────────
router.post('/forgot-password', resolveOrg, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = db.prepare(
    'SELECT * FROM users WHERE email = ? AND org_id = ?'
  ).get(email.toLowerCase().trim(), req.org.id);

  // Always respond 200 to prevent email enumeration
  if (user) {
    const token      = generateToken();
    const expires    = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    db.prepare(
      'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?'
    ).run(token, expires, user.id);

    const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
    const resetUrl  = `https://${req.org.slug}.${appDomain}/reset-password?token=${token}`;
    const { sendPasswordReset } = require('../services/email');
    sendPasswordReset({ to: user.email, userName: user.full_name, org: req.org, resetUrl });
  }

  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

// ─── Reset password ───────────────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });
  if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or already used reset link.' });
  }
  if (new Date(user.reset_token_expires_at) < new Date()) {
    return res.status(400).json({ error: 'This reset link has expired. Please request a new one.', expired: true });
  }

  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?'
  ).run(hash, user.id);

  res.json({ message: 'Password updated successfully. You can now log in.' });
});

// ─── Current user profile ─────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, org_id, email, full_name, role, phone, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
