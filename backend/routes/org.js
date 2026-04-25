const express = require('express');
const db = require('../database');
const resolveOrg = require('../middleware/resolveOrg');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public — returns branding/config for the current org (no auth needed)
router.get('/', resolveOrg, (req, res) => {
  const { id, name, slug, logo_url, primary_color, accent_color, tagline, plan } = req.org;
  res.json({ id, name, slug, logo_url, primary_color, accent_color, tagline, plan });
});

// Admin — update org branding (must belong to this org)
router.patch('/', authenticate, requireAdmin, resolveOrg, (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.org_id !== req.org.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { name, logo_url, primary_color, accent_color, tagline } = req.body;
  db.prepare(`
    UPDATE organizations
    SET name = COALESCE(?, name),
        logo_url = COALESCE(?, logo_url),
        primary_color = COALESCE(?, primary_color),
        accent_color = COALESCE(?, accent_color),
        tagline = COALESCE(?, tagline)
    WHERE id = ?
  `).run(name || null, logo_url || null, primary_color || null, accent_color || null, tagline || null, req.org.id);

  const updated = db.prepare('SELECT id, name, slug, logo_url, primary_color, accent_color, tagline, plan FROM organizations WHERE id = ?').get(req.org.id);
  res.json(updated);
});

module.exports = router;
