require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

app.use(cors({
  origin: isProd ? true : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
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
realtime.init(server, { origin: isProd ? true : 'http://localhost:5173' });
app.set('io', realtime);

server.listen(PORT, () => {
  console.log(`Thrift-Link API + realtime on http://localhost:${PORT}`);
  if (isProd) console.log('Serving React frontend from dist/');
});
