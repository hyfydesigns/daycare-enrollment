const express = require('express');
const cors = require('cors');
const path = require('path');
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
    // Allow requests with no origin (mobile apps, curl) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // In production also allow any subdomain of the app domain (https only)
    if (isProd && process.env.APP_DOMAIN) {
      const regex = new RegExp(`^https://[a-z0-9-]+\\.${process.env.APP_DOMAIN.replace('.', '\\.')}$`);
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

// ─── Serve built frontend in production ───────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Daycare Enrollment API running on http://localhost:${PORT}`);
});
