const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const realtime = require('../realtime');
const { sendEmail, templates } = require('../services/emailService');
const vendorsRepo = require('../repos/vendorsRepo');
const usersRepo = require('../repos/usersRepo');
const reviewsRepo = require('../repos/reviewsRepo');
const reportsRepo = require('../repos/reportsRepo');
const productsRepo = require('../repos/productsRepo');
const notificationsRepo = require('../repos/notificationsRepo');
const analyticsRepo = require('../repos/analyticsRepo');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

// All admin routes require admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    if (useSupabase()) return res.json(await analyticsRepo.adminStats());
    const db = getDb();
    res.json({
      totalVendors: db.prepare('SELECT COUNT(*) as c FROM vendor_profiles').get().c,
      pendingVerifications: db.prepare('SELECT COUNT(*) as c FROM vendor_profiles WHERE verification_status = ?').get('pending').c,
      totalUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('user').c,
      totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
      totalReviews: db.prepare('SELECT COUNT(*) as c FROM reviews').get().c,
      pendingReviews: db.prepare('SELECT COUNT(*) as c FROM reviews WHERE is_approved = 0').get().c,
      totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    });
  } catch (err) {
    console.error('admin stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// GET /api/admin/vendors
router.get('/vendors', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  try {
    if (useSupabase()) {
      return res.json(await vendorsRepo.adminList({ status, page: parseInt(page), limit: parseInt(limit) }));
    }
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = [];
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
  } catch (err) {
    console.error('admin vendors error:', err);
    res.status(500).json({ error: 'Failed to load vendors' });
  }
});

// PUT /api/admin/vendors/:id/verify — also closes out the KYC review and emails the vendor
router.put('/vendors/:id/verify', async (req, res) => {
  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  try {
    if (useSupabase()) {
      await vendorsRepo.reviewKyc(req.params.id, status, notes);
      const vendor = await vendorsRepo.getById(req.params.id);
      if (vendor) {
        const owner = await usersRepo.getById(vendor.user_id);
        realtime.emit(`user:${vendor.user_id}`, 'vendor:verification', { status, shop_name: vendor.shop_name });
        if (owner?.email) {
          const tpl = status === 'approved' ? templates.kycApproved(owner.name) : templates.kycRejected(owner.name, notes);
          sendEmail({ to: owner.email, ...tpl }).catch(() => {});
        }
      }
      realtime.emit('role:admin', 'vendor:updated', { id: req.params.id, verification_status: status });
      return res.json({ message: `Vendor ${status}` });
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
  } catch (err) {
    console.error('admin verify error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});


// PUT /api/admin/vendors/:id/feature — admin curates featured/top vendors
// body: { is_featured: bool, featured_rank?: number }
router.put('/vendors/:id/feature', async (req, res) => {
  const isFeatured = req.body.is_featured ? 1 : 0;
  let rank = null;
  if (isFeatured) {
    const parsed = parseInt(req.body.featured_rank, 10);
    rank = Number.isFinite(parsed) ? Math.max(1, Math.min(999, parsed)) : null;
  }

  try {
    if (useSupabase()) {
      const vendor = await vendorsRepo.getById(req.params.id);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      if (isFeatured && !vendor.is_verified) return res.status(400).json({ error: 'Only verified vendors can be featured.' });
      await vendorsRepo.setFeatured(req.params.id, isFeatured, rank);
      realtime.emit('role:admin', 'vendor:updated', { id: req.params.id, is_featured: isFeatured, featured_rank: rank });
      return res.json({ message: isFeatured ? 'Vendor featured' : 'Vendor unfeatured', is_featured: isFeatured, featured_rank: rank });
    }
    const db = getDb();
    const vendor = db.prepare('SELECT id, is_verified FROM vendor_profiles WHERE id = ?').get(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    if (isFeatured && !vendor.is_verified) return res.status(400).json({ error: 'Only verified vendors can be featured.' });
    db.prepare(`UPDATE vendor_profiles SET is_featured = ?, featured_rank = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(isFeatured, rank, req.params.id);
    realtime.emit('role:admin', 'vendor:updated', { id: req.params.id, is_featured: isFeatured, featured_rank: rank });
    res.json({ message: isFeatured ? 'Vendor featured' : 'Vendor unfeatured', is_featured: isFeatured, featured_rank: rank });
  } catch (err) {
    console.error('admin feature error:', err);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

// PUT /api/admin/vendors/:id/subscription
router.put('/vendors/:id/subscription', async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'basic', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  try {
    if (useSupabase()) {
      const current = await vendorsRepo.getById(req.params.id);
      await vendorsRepo.setSubscription(req.params.id, plan, current?.subscription_expires_at || null);
    } else {
      getDb().prepare(`UPDATE vendor_profiles SET subscription_plan = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(plan, req.params.id);
    }
    res.json({ message: 'Subscription updated' });
  } catch (err) {
    console.error('admin subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  try {
    if (useSupabase()) {
      const { users, total } = await usersRepo.adminList({ role, page: parseInt(page), limit: parseInt(limit) });
      return res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = [];
    const params = [];
    if (role) { where.push('role = ?'); params.push(role); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const users = db.prepare(`
      SELECT id, email, name, role, phone, state, city, is_active, created_at
      FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);
    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('admin users error:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  const { is_active } = req.body;
  try {
    if (useSupabase()) await usersRepo.setActive(req.params.id, !!is_active);
    else getDb().prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
    realtime.emit(`user:${req.params.id}`, 'account:status', { is_active: !!is_active });
    realtime.emit('role:admin', 'user:updated', { id: req.params.id, is_active: !!is_active });
    res.json({ message: 'User status updated' });
  } catch (err) {
    console.error('admin user status error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  const { approved, page = 1, limit = 20 } = req.query;
  try {
    if (useSupabase()) {
      const status = approved === undefined ? undefined : (approved === 'true' ? 'approved' : 'pending');
      const reviews = await reviewsRepo.adminList({ status });
      // reviewsRepo returns shop_name; alias to vendor_name for the existing UI.
      const mapped = reviews.map((r) => ({ ...r, vendor_name: r.shop_name }));
      return res.json({ reviews: mapped, total: mapped.length, page: parseInt(page), pages: 1 });
    }
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = [];
    const params = [];
    if (approved !== undefined) { where.push('r.is_approved = ?'); params.push(approved === 'true' ? 1 : 0); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, vp.shop_name as vendor_name
      FROM reviews r JOIN users u ON u.id = r.user_id JOIN vendor_profiles vp ON vp.id = r.vendor_id
      ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);
    const total = db.prepare(`SELECT COUNT(*) as count FROM reviews r ${whereClause}`).get(...params).count;
    res.json({ reviews, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('admin reviews error:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// PUT /api/admin/reviews/:id
router.put('/reviews/:id', async (req, res) => {
  const { is_approved } = req.body;
  try {
    if (useSupabase()) {
      const updated = await reviewsRepo.setApproved(req.params.id, !!is_approved);
      if (updated) await reviewsRepo.recalcVendorRating(updated.vendor_id);
      return res.json({ message: 'Review updated' });
    }
    const db = getDb();
    db.prepare('UPDATE reviews SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, req.params.id);
    const review = db.prepare('SELECT vendor_id FROM reviews WHERE id = ?').get(req.params.id);
    if (review) {
      const ratingData = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE vendor_id = ? AND is_approved = 1').get(review.vendor_id);
      db.prepare('UPDATE vendor_profiles SET rating = ?, total_reviews = ? WHERE id = ?').run(ratingData.avg || 0, ratingData.total, review.vendor_id);
    }
    res.json({ message: 'Review updated' });
  } catch (err) {
    console.error('admin review update error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// ----- Reports / Moderation -----

// GET /api/admin/reports — list reports with reporter & basic target info
router.get('/reports', async (req, res) => {
  const { status, page = 1, limit = 25 } = req.query;
  try {
    if (useSupabase()) {
      const rows = await reportsRepo.adminList({ status });
      // Batch-fetch targets to avoid N+1 round trips.
      const productIds = [...new Set(rows.filter(r => r.target_type === 'product').map(r => r.target_id).filter(Boolean))];
      const vendorIds = [...new Set(rows.filter(r => r.target_type === 'vendor').map(r => r.target_id).filter(Boolean))];
      const productMap = new Map();
      const vendorMap = new Map();
      let supabaseData = null;
      try { supabaseData = require('../db/supabaseData'); } catch {}
      if (supabaseData && (productIds.length || vendorIds.length)) {
        const db = supabaseData.getDataClient();
        if (productIds.length) {
          const { data } = await db.from('products').select('id,name').in('id', productIds);
          for (const p of (data || [])) productMap.set(p.id, p.name);
        }
        if (vendorIds.length) {
          const { data } = await db.from('vendor_profiles').select('id,shop_name').in('id', vendorIds);
          for (const v of (data || [])) vendorMap.set(v.id, v.shop_name);
        }
      }
      const reports = rows.map((r) => {
        let target_name = null;
        if (r.target_type === 'product') target_name = productMap.get(r.target_id) || null;
        else if (r.target_type === 'vendor') target_name = vendorMap.get(r.target_id) || null;
        return { ...r, target_name };
      });
      return res.json({ reports, total: reports.length, page: parseInt(page), pages: 1 });
    }
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = [];
    const params = [];
    if (status) { where.push('r.status = ?'); params.push(status); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const rows = db.prepare(`
      SELECT r.*, u.name as reporter_name, u.email as reporter_email
      FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
      ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);
    const reports = rows.map((r) => {
      let target_name = null;
      if (r.target_type === 'product') target_name = db.prepare('SELECT name FROM products WHERE id = ?').get(r.target_id)?.name;
      else if (r.target_type === 'vendor') target_name = db.prepare('SELECT shop_name FROM vendor_profiles WHERE id = ?').get(r.target_id)?.shop_name;
      return { ...r, target_name };
    });
    const total = db.prepare(`SELECT COUNT(*) as count FROM reports r ${whereClause}`).get(...params).count;
    res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('admin reports error:', err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

// PUT /api/admin/reports/:id — update status
router.put('/reports/:id', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    if (useSupabase()) await reportsRepo.setStatus(req.params.id, status);
    else getDb().prepare("UPDATE reports SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    realtime.emit('role:admin', 'report:updated', { id: req.params.id, status });
    res.json({ message: 'Report updated' });
  } catch (err) {
    console.error('admin report update error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/admin/products/:id — remove a listing (moderation action)
router.delete('/products/:id', async (req, res) => {
  try {
    let product;
    if (useSupabase()) {
      const p = await productsRepo.getById(req.params.id);
      product = p ? { id: p.id, name: p.name, vendor_user_id: p.vendor_user_id } : null;
      await productsRepo.adminRemove(req.params.id);
    } else {
      const db = getDb();
      product = db.prepare(`
        SELECT p.id, p.name, vp.user_id as vendor_user_id
        FROM products p JOIN vendor_profiles vp ON vp.id = p.vendor_id WHERE p.id = ?
      `).get(req.params.id);
      db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    }
    realtime.emit('*', 'product:removed', { id: req.params.id });
    if (product?.vendor_user_id) {
      realtime.emit(`user:${product.vendor_user_id}`, 'notification:new', {
        type: 'warning', title: 'Listing removed',
        message: `Your listing "${product.name}" was removed by moderation.`,
        link: '/vendor/products', created_at: new Date().toISOString(),
      });
    }
    res.json({ message: 'Listing removed' });
  } catch (err) {
    console.error('admin product remove error:', err);
    res.status(500).json({ error: 'Failed to remove listing' });
  }
});

// POST /api/admin/users/:id/warn — send a warning notification
router.post('/users/:id/warn', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });
  const notifId = uuidv4();
  try {
    if (useSupabase()) {
      const user = await usersRepo.getById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await notificationsRepo.create({ id: notifId, userId: req.params.id, type: 'warning', title: 'Moderation Warning', message });
    } else {
      const db = getDb();
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      db.prepare(`INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, 'warning', 'Moderation Warning', ?)`)
        .run(notifId, req.params.id, message);
    }
    realtime.emit(`user:${req.params.id}`, 'notification:new', {
      id: notifId,
      type: 'warning',
      title: 'Moderation Warning',
      message,
      created_at: new Date().toISOString(),
    });
    res.json({ message: 'Warning sent' });
  } catch (err) {
    console.error('admin warn error:', err);
    res.status(500).json({ error: 'Failed to send warning' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res) => {
  try {
    if (useSupabase()) {
      const review = await reviewsRepo.getWithUser(req.params.id);
      await reviewsRepo.remove(req.params.id);
      if (review) await reviewsRepo.recalcVendorRating(review.vendor_id);
      return res.json({ message: 'Review deleted' });
    }
    const db = getDb();
    const review = db.prepare('SELECT vendor_id FROM reviews WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    if (review) {
      const ratingData = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE vendor_id = ? AND is_approved = 1').get(review.vendor_id);
      db.prepare('UPDATE vendor_profiles SET rating = ?, total_reviews = ? WHERE id = ?').run(ratingData.avg || 0, ratingData.total, review.vendor_id);
    }
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('admin review delete error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
