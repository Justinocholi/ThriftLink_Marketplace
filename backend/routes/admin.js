const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const realtime = require('../realtime');
const { sendEmail, templates } = require('../services/emailService');

const router = express.Router();

// All admin routes require admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const stats = {
    totalVendors: db.prepare('SELECT COUNT(*) as c FROM vendor_profiles').get().c,
    pendingVerifications: db.prepare('SELECT COUNT(*) as c FROM vendor_profiles WHERE verification_status = ?').get('pending').c,
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('user').c,
    totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    totalReviews: db.prepare('SELECT COUNT(*) as c FROM reviews').get().c,
    pendingReviews: db.prepare('SELECT COUNT(*) as c FROM reviews WHERE is_approved = 0').get().c,
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
  };
  res.json(stats);
});

// GET /api/admin/vendors
router.get('/vendors', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  const params = [];
  if (status) { where.push('vp.verification_status = ?'); params.push(status); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const vendors = db.prepare(`
    SELECT vp.*, u.email, u.name as owner_name, u.phone, u.created_at as user_created_at
    FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id
    ${whereClause}
    ORDER BY vp.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id ${whereClause}`).get(...params).count;

  res.json({ vendors, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// PUT /api/admin/vendors/:id/verify — also closes out the KYC review and emails the vendor
router.put('/vendors/:id/verify', (req, res) => {
  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  const db = getDb();
  db.prepare(`
    UPDATE vendor_profiles SET
      verification_status = ?,
      is_verified = ?,
      kyc_reviewed_at = datetime('now'),
      kyc_review_notes = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status, status === 'approved' ? 1 : 0, notes || null, req.params.id);

  const vendor = db.prepare(
    `SELECT vp.user_id, vp.shop_name, u.email, u.name
     FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id WHERE vp.id = ?`
  ).get(req.params.id);

  if (vendor) {
    realtime.emit(`user:${vendor.user_id}`, 'vendor:verification', { status, shop_name: vendor.shop_name });
    if (vendor.email) {
      const tpl = status === 'approved'
        ? templates.kycApproved(vendor.name)
        : templates.kycRejected(vendor.name, notes);
      sendEmail({ to: vendor.email, ...tpl }).catch(() => {});
    }
  }
  realtime.emit('role:admin', 'vendor:updated', { id: req.params.id, verification_status: status });

  res.json({ message: `Vendor ${status}` });
});

// PUT /api/admin/orders/:id/confirm-payment — mark a bank transfer as received
router.put('/orders/:id/confirm-payment', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT id, user_id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare(
    `UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
     payment_confirmed_at = datetime('now'), payment_confirmed_by = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(req.user.id, order.id);

  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(order.user_id);
  if (user?.email) {
    const tpl = templates.paymentConfirmed(order.id);
    sendEmail({ to: user.email, ...tpl }).catch(() => {});
  }
  realtime.emit(`user:${order.user_id}`, 'order:payment-confirmed', { orderId: order.id });
  res.json({ message: 'Payment confirmed' });
});

// PUT /api/admin/vendors/:id/subscription
router.put('/vendors/:id/subscription', (req, res) => {
  const { plan } = req.body;
  if (!['free', 'basic', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const db = getDb();
  db.prepare(`UPDATE vendor_profiles SET subscription_plan = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(plan, req.params.id);

  res.json({ message: 'Subscription updated' });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  const params = [];
  if (role) { where.push('role = ?'); params.push(role); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const users = db.prepare(`
    SELECT id, email, name, role, phone, state, city, is_active, created_at
    FROM users ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

  res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', (req, res) => {
  const { is_active } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(is_active ? 1 : 0, req.params.id);
  realtime.emit(`user:${req.params.id}`, 'account:status', { is_active: !!is_active });
  realtime.emit('role:admin', 'user:updated', { id: req.params.id, is_active: !!is_active });
  res.json({ message: 'User status updated' });
});

// GET /api/admin/reviews
router.get('/reviews', (req, res) => {
  const { approved, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  const params = [];
  if (approved !== undefined) { where.push('r.is_approved = ?'); params.push(approved === 'true' ? 1 : 0); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, vp.shop_name as vendor_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN vendor_profiles vp ON vp.id = r.vendor_id
    ${whereClause}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM reviews r ${whereClause}`).get(...params).count;

  res.json({ reviews, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// PUT /api/admin/reviews/:id
router.put('/reviews/:id', (req, res) => {
  const { is_approved } = req.body;
  const db = getDb();
  db.prepare('UPDATE reviews SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, req.params.id);

  // Recalculate vendor rating
  const review = db.prepare('SELECT vendor_id FROM reviews WHERE id = ?').get(req.params.id);
  if (review) {
    const ratingData = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE vendor_id = ? AND is_approved = 1').get(review.vendor_id);
    db.prepare('UPDATE vendor_profiles SET rating = ?, total_reviews = ? WHERE id = ?')
      .run(ratingData.avg || 0, ratingData.total, review.vendor_id);
  }

  res.json({ message: 'Review updated' });
});

// ----- Reports / Moderation -----

// GET /api/admin/reports — list reports with reporter & basic target info
router.get('/reports', (req, res) => {
  const { status, page = 1, limit = 25 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const where = [];
  const params = [];
  if (status) { where.push('r.status = ?'); params.push(status); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(`
    SELECT r.*, u.name as reporter_name, u.email as reporter_email
    FROM reports r
    LEFT JOIN users u ON u.id = r.reporter_id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const reports = rows.map((r) => {
    let target_name = null;
    if (r.target_type === 'product') {
      const p = db.prepare('SELECT name FROM products WHERE id = ?').get(r.target_id);
      target_name = p?.name;
    } else if (r.target_type === 'vendor') {
      const v = db.prepare('SELECT shop_name FROM vendor_profiles WHERE id = ?').get(r.target_id);
      target_name = v?.shop_name;
    }
    return { ...r, target_name };
  });

  const total = db.prepare(`SELECT COUNT(*) as count FROM reports r ${whereClause}`).get(...params).count;
  res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// PUT /api/admin/reports/:id — update status
router.put('/reports/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const db = getDb();
  db.prepare("UPDATE reports SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, req.params.id);
  realtime.emit('role:admin', 'report:updated', { id: req.params.id, status });
  res.json({ message: 'Report updated' });
});

// DELETE /api/admin/products/:id — remove a listing (moderation action)
router.delete('/products/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.id, p.name, vp.user_id as vendor_user_id
    FROM products p
    JOIN vendor_profiles vp ON vp.id = p.vendor_id
    WHERE p.id = ?
  `).get(req.params.id);

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

  realtime.emit('*', 'product:removed', { id: req.params.id });
  if (product?.vendor_user_id) {
    realtime.emit(`user:${product.vendor_user_id}`, 'notification:new', {
      type: 'warning',
      title: 'Listing removed',
      message: `Your listing "${product.name}" was removed by moderation.`,
      link: '/vendor/products',
      created_at: new Date().toISOString(),
    });
  }
  res.json({ message: 'Listing removed' });
});

// POST /api/admin/users/:id/warn — send a warning notification
router.post('/users/:id/warn', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const notifId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message)
    VALUES (?, ?, 'warning', 'Moderation Warning', ?)
  `).run(notifId, req.params.id, message);
  realtime.emit(`user:${req.params.id}`, 'notification:new', {
    id: notifId,
    type: 'warning',
    title: 'Moderation Warning',
    message,
    created_at: new Date().toISOString(),
  });
  res.json({ message: 'Warning sent' });
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', (req, res) => {
  const db = getDb();
  const review = db.prepare('SELECT vendor_id FROM reviews WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);

  if (review) {
    const ratingData = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE vendor_id = ? AND is_approved = 1').get(review.vendor_id);
    db.prepare('UPDATE vendor_profiles SET rating = ?, total_reviews = ? WHERE id = ?')
      .run(ratingData.avg || 0, ratingData.total, review.vendor_id);
  }

  res.json({ message: 'Review deleted' });
});

module.exports = router;
