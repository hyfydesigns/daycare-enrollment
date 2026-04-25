const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./database');

const app = express();
const PORT = process.env.PORT || 3007;
const isProd = process.env.NODE_ENV === 'production';

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  // Allow inline scripts/styles needed by React in production
  contentSecurityPolicy: isProd ? undefined : false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5174', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin non-preflight)
    if (!origin) return cb(null, true);
    // Explicitly listed origins
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Railway auto-injects RAILWAY_PUBLIC_DOMAIN — allow our own deployment URL
    if (process.env.RAILWAY_PUBLIC_DOMAIN &&
        origin === `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`) {
      return cb(null, true);
    }
    // Allow any subdomain of APP_DOMAIN (multi-tenant white-label orgs)
    if (process.env.APP_DOMAIN) {
      const escaped = process.env.APP_DOMAIN.replace(/\./g, '\\.');
      const regex = new RegExp(`^https://(.*\\.)?${escaped}$`);
      if (regex.test(origin)) return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Strict limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 requests per minute per IP
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api',      apiLimiter);

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/org',         require('./routes/org'));
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/superadmin',  require('./routes/superadmin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// ─── Serve built frontend (whenever public/ exists) ───────────────────────────
const distPath = path.join(__dirname, 'public');
console.log('[static] __dirname   :', __dirname);
console.log('[static] distPath    :', distPath);
console.log('[static] dir exists  :', fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  console.log('[static] dir contents:', fs.readdirSync(distPath));
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  console.warn('[static] WARNING: public/ not found — frontend will not be served');
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Daycare Enrollment API running on http://localhost:${PORT}`);
});
