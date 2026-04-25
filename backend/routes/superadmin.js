const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

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

  const orgResult = db.prepare(`
    INSERT INTO organizations (name, slug, owner_email, primary_color, tagline, plan)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    owner_email,
    primary_color || '#f97316',
    tagline || null,
    plan || 'trial',
  );

  const orgId = orgResult.lastInsertRowid;
  const hash = bcrypt.hashSync(owner_password, 12);
  db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(orgId, owner_email.toLowerCase().trim(), hash, owner_name || name + ' Admin');

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  res.status(201).json(org);
});

// Update org (plan, branding, status)
router.patch('/orgs/:id', (req, res) => {
  const { name, slug, primary_color, accent_color, tagline, plan, logo_url } = req.body;

  const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  db.prepare(`
    UPDATE organizations
    SET name          = COALESCE(?, name),
        slug          = COALESCE(?, slug),
        primary_color = COALESCE(?, primary_color),
        accent_color  = COALESCE(?, accent_color),
        tagline       = COALESCE(?, tagline),
        plan          = COALESCE(?, plan),
        logo_url      = COALESCE(?, logo_url)
    WHERE id = ?
  `).run(name||null, slug||null, primary_color||null, accent_color||null, tagline||null, plan||null, logo_url||null, req.params.id);

  res.json(db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id));
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
