// Boots the Express app for integration tests without binding a port or
// initializing Socket.IO. Mirrors server.js's middleware pipeline.
//
// Intentionally does NOT load dotenv — tests rely on the explicit env set
// by test/setup-env.js so they're hermetic and a dev's local .env can't
// contaminate them (e.g. by enabling Mailboxlayer or Supabase).

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('../routes/auth');
const vendorRoutes = require('../routes/vendors');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const productRoutes = require('../routes/products');
const reviewRoutes = require('../routes/reviews');
const cartRoutes = require('../routes/cart');
const orderRoutes = require('../routes/orders');
const webhookRoutes = require('../routes/webhooks');
const messageRoutes = require('../routes/messages');
const reportRoutes = require('../routes/reports');
const paymentRoutes = require('../routes/payment');
const subscriptionRoutes = require('../routes/subscriptions');

function buildApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use('/api/auth', authRoutes);
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

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/*', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));

  app.use((err, _req, res, _next) => {
    if (err && err.message === 'Only image files are allowed') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { buildApp };
