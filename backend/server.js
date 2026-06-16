require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const realtime = require('./realtime');

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const webhookRoutes = require('./routes/webhooks');
const messageRoutes = require('./routes/messages');
const reportRoutes = require('./routes/reports');
const paymentRoutes = require('./routes/payment');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// --- JWT secret hardening ------------------------------------------------
// Critical: the dev placeholder must never be used in production. We also
// refuse weak (empty/short) secrets unconditionally. In dev a weak secret
// only emits a warning so local work isn't disrupted.
(function assertJwtSecret() {
  const s = process.env.JWT_SECRET || '';
  const isDevSecret = s.startsWith('dev-only-');
  if (!s) throw new Error('FATAL: JWT_SECRET is required.');
  if (s.length < 32) throw new Error('FATAL: JWT_SECRET must be at least 32 characters.');
  if (isProd && isDevSecret) {
    throw new Error(
      'FATAL: refusing to boot in production with the dev JWT_SECRET. ' +
      'Generate a strong random secret (e.g. `openssl rand -hex 48`) and set it.'
    );
  }
  if (isDevSecret) console.warn('[security] Using the dev JWT_SECRET. Replace before production.');
})();

// --- CORS allowlist ------------------------------------------------------
// In dev: localhost:5173 only. In prod: FRONTEND_URL and any comma-separated
// extra origins in CORS_ALLOWED_ORIGINS (e.g. preview deployment URLs).
const allowedOrigins = (() => {
  if (!isProd) return new Set(['http://localhost:5173']);
  const out = new Set();
  const add = (u) => u && out.add(u.replace(/\/$/, ''));
  add(process.env.FRONTEND_URL);
  for (const o of (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean)) add(o);
  return out;
})();

function corsOriginCheck(origin, cb) {
  // Allow non-browser callers (curl, server-to-server, webhooks) which omit Origin.
  if (!origin) return cb(null, true);
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.has(normalized)) return cb(null, true);
  // Reject by omitting the Access-Control-Allow-Origin header. Browsers block
  // the response client-side; we don't throw so the HTTP layer stays clean.
  return cb(null, false);
}

// Security headers. crossOriginResourcePolicy is relaxed so Cloudinary /
// cross-origin <img> loads aren't blocked; CSP is left off here because the
// SPA is served separately by Vite in dev and a CDN in prod.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust the reverse proxy (Railway/Render/etc.) so rate-limit sees real IPs.
app.set('trust proxy', 1);

// Global API rate limit — generous, just blunts abuse/scraping.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Tighter limit on auth endpoints to blunt credential stuffing / reset abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

app.use('/api/', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// In production, serve the built React frontend
if (isProd) {
  const frontendDist = path.join(__dirname, '../dist');
  app.use(express.static(frontendDist));
  // Catch-all so React Router handles client-side navigation
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
realtime.init(server, { origin: corsOriginCheck });
app.set('io', realtime);

server.listen(PORT, () => {
  console.log(`Thrift-Link API + realtime on http://localhost:${PORT}`);
  const backend = (process.env.DATA_BACKEND || 'sqlite').toLowerCase();
  console.log(`Data backend: ${backend}`);
  if (isProd) console.log('Serving React frontend from dist/');
});
