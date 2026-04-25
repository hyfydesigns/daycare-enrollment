const db = require('../database');

/**
 * Resolves the current organization from:
 *   1. X-Org-Slug request header (sent by the React frontend)
 *   2. The first subdomain segment of the Host header (production)
 *   3. Falls back to 'default'
 *
 * Attaches `req.org` to the request.
 */
function resolveOrg(req, res, next) {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.');

  const slug =
    req.headers['x-org-slug'] ||
    (!isLocalhost && subdomain) ||
    'default';

  // Try the derived slug first, then fall back to 'default' (handles platform
  // hostnames like daycare-app.up.railway.app where the prefix is not an org slug)
  const org =
    db.prepare('SELECT * FROM organizations WHERE slug = ?').get(slug) ||
    db.prepare("SELECT * FROM organizations WHERE slug = 'default'").get();

  if (!org) {
    return res.status(404).json({ error: `Organization '${slug}' not found` });
  }

  req.org = org;
  next();
}

module.exports = resolveOrg;
