const jwt = require('jsonwebtoken');

// In production, JWT_SECRET must be explicitly set — no silent fallback.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'daycare_jwt_secret_dev_only_change_in_production';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Org admin OR platform superadmin
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Platform superadmin only
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  next();
}

function requireParent(req, res, next) {
  if (req.user?.role !== 'parent') {
    return res.status(403).json({ error: 'Parent access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireSuperAdmin, requireParent, JWT_SECRET };
