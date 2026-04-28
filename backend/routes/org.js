const express = require('express');
const db = require('../database');
const resolveOrg = require('../middleware/resolveOrg');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── Constants ───────────────────────────────────────────────────────────────
const TRIAL_ENROLLMENT_LIMIT = 5; // also used by enrollments route

// ─── Public: branding/config for current org ─────────────────────────────────
router.get('/', resolveOrg, (req, res) => {
  const { id, name, slug, logo_url, primary_color, accent_color, tagline, directors_name, plan, trial_ends_at } = req.org;
  res.json({ id, name, slug, logo_url, primary_color, accent_color, tagline, directors_name, plan, trial_ends_at, trial_enrollment_limit: TRIAL_ENROLLMENT_LIMIT });
});

// ─── Admin: update org settings ──────────────────────────────────────────────
router.patch('/', authenticate, requireAdmin, resolveOrg, (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.org_id !== req.org.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const isTrial = req.org.plan === 'trial';
  const { name, logo_url, primary_color, accent_color, tagline, directors_name } = req.body;

  // Trial orgs may only change name and tagline — branding is a paid feature
  if (isTrial && (logo_url || primary_color || accent_color)) {
    return res.status(403).json({
      error: 'Custom branding (logo, colors) is not available on the Trial plan. Upgrade to Starter or Pro to unlock.',
      upgrade_required: true,
    });
  }

  db.prepare(`
    UPDATE organizations
    SET name           = COALESCE(?, name),
        tagline        = COALESCE(?, tagline),
        directors_name = COALESCE(?, directors_name),
        logo_url       = CASE WHEN ? IS NOT NULL THEN ? ELSE logo_url END,
        primary_color  = CASE WHEN ? IS NOT NULL THEN ? ELSE primary_color END,
        accent_color   = CASE WHEN ? IS NOT NULL THEN ? ELSE accent_color END
    WHERE id = ?
  `).run(
    name           || null,
    tagline        || null,
    directors_name || null,
    logo_url      || null, logo_url      || null,
    primary_color || null, primary_color || null,
    accent_color  || null, accent_color  || null,
    req.org.id,
  );

  const updated = db.prepare(
    'SELECT id, name, slug, logo_url, primary_color, accent_color, tagline, directors_name, plan, trial_ends_at FROM organizations WHERE id = ?'
  ).get(req.org.id);

  res.json({ ...updated, trial_enrollment_limit: TRIAL_ENROLLMENT_LIMIT });
});

module.exports = router;
module.exports.TRIAL_ENROLLMENT_LIMIT = TRIAL_ENROLLMENT_LIMIT;
