const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { sendOrgWelcome, sendPlanUpgrade } = require('../services/email');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

// List all organizations with enrollment counts
router.get('/orgs', (req, res) => {
  const orgs = db.prepare(`
    SELECT o.*,
      COUNT(DISTINCT e.id) AS enrollment_count,
      COUNT(DISTINCT u.id) AS user_count
    FROM organizations o
    LEFT JOIN enrollments e ON e.org_id = o.id
    LEFT JOIN users u ON u.org_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orgs);
});

// Get single org
router.get('/orgs/:id', (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

// Create a new org + seed its first admin account
router.post('/orgs', (req, res) => {
  const { name, slug, owner_email, owner_password, owner_name, primary_color, tagline, plan } = req.body;

  if (!name || !slug || !owner_email || !owner_password) {
    return res.status(400).json({ error: 'name, slug, owner_email, and owner_password are required' });
  }

  const existing = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(slug);
  if (existing) return res.status(409).json({ error: 'Slug already taken' });

  const chosenPlan = plan || 'trial';
  const orgResult = db.prepare(`
    INSERT INTO organizations (name, slug, owner_email, primary_color, tagline, plan, trial_ends_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    owner_email,
    primary_color || '#f97316',
    tagline || null,
    chosenPlan,
    chosenPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  );

  const orgId = orgResult.lastInsertRowid;
  const hash = bcrypt.hashSync(owner_password, 12);
  db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(orgId, owner_email.toLowerCase().trim(), hash, owner_name || name + ' Admin');

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);

  // Fire-and-forget welcome email to the new daycare admin
  const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
  sendOrgWelcome({
    to:        owner_email.toLowerCase().trim(),
    adminName: owner_name || name + ' Admin',
    org,
    loginUrl:  `https://${org.slug}.${appDomain}/login`,
  });

  res.status(201).json(org);
});

// Update org (plan, branding, status)
router.patch('/orgs/:id', (req, res) => {
  const { name, slug, primary_color, accent_color, tagline, plan, logo_url } = req.body;

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  // Manage trial_ends_at when plan changes:
  //   trial → paid:  clear it (unlimited time on paid plan)
  //   paid  → trial: set a fresh 14-day window from now
  //   no change:     leave it alone
  let trialEndsAt = undefined; // undefined = don't touch the column
  if (plan && plan !== org.plan) {
    if (plan === 'trial') {
      trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      trialEndsAt = null; // clear for paid / inactive plans
    }
  }

  db.prepare(`
    UPDATE organizations
    SET name          = COALESCE(?, name),
        slug          = COALESCE(?, slug),
        primary_color = COALESCE(?, primary_color),
        accent_color  = COALESCE(?, accent_color),
        tagline       = COALESCE(?, tagline),
        plan          = COALESCE(?, plan),
        logo_url      = COALESCE(?, logo_url),
        trial_ends_at = CASE WHEN ? THEN ? ELSE trial_ends_at END
    WHERE id = ?
  `).run(
    name||null, slug||null, primary_color||null, accent_color||null,
    tagline||null, plan||null, logo_url||null,
    trialEndsAt !== undefined ? 1 : 0, trialEndsAt !== undefined ? trialEndsAt : null,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);

  // Send upgrade email when plan changes from trial/lower to a paid plan
  const PAID_PLANS = ['starter', 'pro'];
  if (plan && plan !== org.plan && PAID_PLANS.includes(plan)) {
    const adminUser = db.prepare(
      "SELECT email, full_name FROM users WHERE org_id = ? AND role = 'admin' LIMIT 1"
    ).get(req.params.id);

    if (adminUser) {
      const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
      sendPlanUpgrade({
        to:        adminUser.email,
        adminName: adminUser.full_name,
        org:       updated,
        oldPlan:   org.plan,
        loginUrl:  `https://${updated.slug}.${appDomain}/login`,
      });
    }
  }

  res.json(updated);
});

// Platform-wide stats
router.get('/stats', (req, res) => {
  res.json({
    orgs:        db.prepare("SELECT COUNT(*) AS n FROM organizations").get().n,
    active_orgs: db.prepare("SELECT COUNT(*) AS n FROM organizations WHERE plan != 'inactive'").get().n,
    users:       db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'parent'").get().n,
    enrollments: db.prepare("SELECT COUNT(*) AS n FROM enrollments").get().n,
    submitted:   db.prepare("SELECT COUNT(*) AS n FROM enrollments WHERE status = 'submitted'").get().n,
    approved:    db.prepare("SELECT COUNT(*) AS n FROM enrollments WHERE status = 'approved'").get().n,
  });
});

module.exports = router;
