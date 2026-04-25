const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const resolveOrg = require('../middleware/resolveOrg');
const { sendWelcome } = require('../services/email');

const router = express.Router();

// Register a new parent — scoped to the current org
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

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role, phone)
    VALUES (?, ?, ?, ?, 'parent', ?)
  `).run(orgId, email.toLowerCase().trim(), hash, full_name.trim(), phone || null);

  const token = jwt.sign(
    { id: result.lastInsertRowid, email: email.toLowerCase().trim(), role: 'parent', full_name: full_name.trim(), org_id: orgId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Fire-and-forget welcome email
  const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
  const dashboardUrl = `https://${req.org.slug}.${appDomain}/dashboard`;
  sendWelcome({
    to: email.toLowerCase().trim(),
    parentName: full_name.trim(),
    orgName: req.org.name,
    orgColor: req.org.primary_color || '#f97316',
    dashboardUrl,
  });

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, email, full_name, role: 'parent', org_id: orgId },
  });
});

// Login — scoped to org; superadmin can log in from any org context
router.post('/login', resolveOrg, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const orgId = req.org.id;
  const user = db.prepare(`
    SELECT * FROM users
    WHERE email = ? AND (org_id = ? OR role = 'superadmin')
    LIMIT 1
  `).get(email.toLowerCase().trim(), orgId);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
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

// Current user profile
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, org_id, email, full_name, role, phone, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
