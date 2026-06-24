const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const realtime = require('../realtime');
const { storeUploadedFile, storeUploadedFiles } = require('../services/cloudinaryService');
const { validateKyc, isUuid } = require('../middleware/validate');
const { sendEmail, templates } = require('../services/emailService');
const vendorsRepo = require('../repos/vendorsRepo');
const productsRepo = require('../repos/productsRepo');
const reviewsRepo = require('../repos/reviewsRepo');
const analyticsRepo = require('../repos/analyticsRepo');
const ordersRepo = require('../repos/ordersRepo');
const usersRepo = require('../repos/usersRepo');
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

const router = express.Router();

// GET /api/vendors — public list of verified vendors
// Admin-featured vendors always rank first (by featured_rank), then by rating.
// Pass ?featured=true to return only the admin-curated featured vendors.
router.get('/', async (req, res) => {
  const { state, category, search, page = 1, limit = 20, featured } = req.query;

  if (useSupabase()) {
    try {
      const result = await vendorsRepo.listVerified({
        state, category, search, featured: featured === 'true',
        page: parseInt(page), limit: parseInt(limit),
      });
      return res.json(result);
    } catch (err) {
      console.error('vendors list (supabase) error:', err);
      return res.status(500).json({ error: 'Failed to load vendors' });
    }
  }

  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['vp.is_verified = 1'];
  const params = [];

  if (featured === 'true') where.push('vp.is_featured = 1');
  if (state) { where.push('vp.state = ?'); params.push(state); }
  if (category) { where.push('vp.category = ?'); params.push(category); }
  if (search) {
    where.push('(vp.shop_name LIKE ? OR vp.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const vendors = db.prepare(`
    SELECT vp.*, u.name as owner_name, u.email as owner_email
    FROM vendor_profiles vp
    JOIN users u ON u.id = vp.user_id
    ${whereClause}
    ORDER BY vp.is_featured DESC,
             CASE WHEN vp.featured_rank IS NULL THEN 1 ELSE 0 END,
             vp.featured_rank ASC,
             vp.rating DESC, vp.profile_views DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM vendor_profiles vp
    JOIN users u ON u.id = vp.user_id ${whereClause}
  `).get(...params).count;

  res.json({ vendors, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// ---- Authenticated /me routes (must come BEFORE /:id) ----

// GET /api/vendors/me/profile
router.get('/me/profile', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    if (useSupabase()) {
      const vendor = await vendorsRepo.getByUserId(req.user.id);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      return res.json(vendor);
    }
    const db = getDb();
    const vendor = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
    res.json(vendor);
  } catch (err) {
    console.error('me/profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/vendors/me/profile
router.put('/me/profile', authenticate, requireRole('vendor'), async (req, res) => {
  const { shop_name, description, whatsapp_number, instagram_handle, category, state, city } = req.body;
  try {
    if (useSupabase()) {
      const profile = await vendorsRepo.getByUserId(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });
      const patch = {};
      for (const [k, v] of Object.entries({ shop_name, description, whatsapp_number, instagram_handle, category, state, city })) {
        if (v != null) patch[k] = v;
      }
      return res.json(await vendorsRepo.update(profile.id, patch));
    }
    const db = getDb();
    db.prepare(`
      UPDATE vendor_profiles SET
        shop_name = COALESCE(?, shop_name),
        description = COALESCE(?, description),
        whatsapp_number = COALESCE(?, whatsapp_number),
        instagram_handle = COALESCE(?, instagram_handle),
        category = COALESCE(?, category),
        state = COALESCE(?, state),
        city = COALESCE(?, city),
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(shop_name, description, whatsapp_number, instagram_handle, category, state, city, req.user.id);
    res.json(db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(req.user.id));
  } catch (err) {
    console.error('me/profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/vendors/me/logo
router.post('/me/logo', authenticate, requireRole('vendor'), upload.single('logo'), upload.verifyMime('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const uploaded = await storeUploadedFile(req.file, { folder: 'thriftlink/vendors/logos' });
    const url = uploaded.url;
    if (useSupabase()) {
      const profile = await vendorsRepo.getByUserId(req.user.id);
      if (profile) await vendorsRepo.updateLogo(profile.id, url);
    } else {
      getDb().prepare("UPDATE vendor_profiles SET logo = ?, updated_at = datetime('now') WHERE user_id = ?").run(url, req.user.id);
    }
    res.json({ url });
  } catch (error) {
    console.error('Vendor logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload vendor logo' });
  }
});

// GET /api/vendors/me/products
router.get('/me/products', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    if (useSupabase()) {
      const vendor = await vendorsRepo.getByUserId(req.user.id);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      return res.json(await productsRepo.listByVendor(vendor.id));
    }
    const db = getDb();
    const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
    res.json(db.prepare('SELECT * FROM products WHERE vendor_id = ? ORDER BY created_at DESC').all(vendor.id));
  } catch (err) {
    console.error('me/products error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// POST /api/vendors/me/products
router.post('/me/products', authenticate, requireRole('vendor'), upload.array('images', 5), upload.verifyMime('image'), async (req, res) => {
  try {
    const { name, description, price, original_price, category, condition, stock_quantity } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'name, price, and category are required' });
    }

    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const vendor = onSupabase
      ? await vendorsRepo.getByUserId(req.user.id)
      : db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    const images = req.files?.length
      ? (await storeUploadedFiles(req.files, () => ({ folder: 'thriftlink/products' }))).map((file) => file.url)
      : [];
    const id = uuidv4();
    const row = {
      id, vendor_id: vendor.id, name, description: description || null,
      price: parseFloat(price), original_price: original_price ? parseFloat(original_price) : null,
      category, condition: condition || 'good', images: JSON.stringify(images),
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 1,
    };

    let created;
    if (onSupabase) {
      created = await productsRepo.create(row);
    } else {
      db.prepare(`
        INSERT INTO products (id, vendor_id, name, description, price, original_price, category, condition, images, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(row.id, row.vendor_id, row.name, row.description, row.price, row.original_price, row.category, row.condition, row.images, row.stock_quantity);
      created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    }
    realtime.emit('*', 'product:created', created);
    res.status(201).json(created);
  } catch (error) {
    console.error('Vendor product upload error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/vendors/me/products/:productId
router.put('/me/products/:productId', authenticate, requireRole('vendor'), async (req, res) => {
  const { name, description, price, original_price, category, condition, is_available, stock_quantity } = req.body;
  try {
    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const vendor = onSupabase
      ? await vendorsRepo.getByUserId(req.user.id)
      : db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);

    if (onSupabase) {
      const patch = {};
      if (name != null) patch.name = name;
      if (description != null) patch.description = description;
      if (price != null) patch.price = parseFloat(price);
      if (original_price != null) patch.original_price = parseFloat(original_price);
      if (category != null) patch.category = category;
      if (condition != null) patch.condition = condition;
      if (is_available !== undefined) patch.is_available = is_available ? 1 : 0;
      if (stock_quantity != null) patch.stock_quantity = parseInt(stock_quantity);
      const updated = await productsRepo.update(req.params.productId, vendor?.id, patch);
      if (!updated) return res.status(404).json({ error: 'Product not found' });
      realtime.emit('*', 'product:updated', updated);
      return res.json(updated);
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND vendor_id = ?').get(req.params.productId, vendor?.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name), description = COALESCE(?, description),
        price = COALESCE(?, price), original_price = COALESCE(?, original_price),
        category = COALESCE(?, category), condition = COALESCE(?, condition),
        is_available = COALESCE(?, is_available), stock_quantity = COALESCE(?, stock_quantity),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, description, price ? parseFloat(price) : null,
      original_price ? parseFloat(original_price) : null, category, condition,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      stock_quantity ? parseInt(stock_quantity) : null, req.params.productId);
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.productId);
    realtime.emit('*', 'product:updated', updated);
    res.json(updated);
  } catch (err) {
    console.error('me/products update error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/vendors/me/products/:productId
router.delete('/me/products/:productId', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const vendor = onSupabase
      ? await vendorsRepo.getByUserId(req.user.id)
      : db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);

    let archived = false;
    if (onSupabase) {
      const existing = await productsRepo.listByVendor(vendor?.id);
      if (!existing.some((p) => p.id === req.params.productId)) {
        return res.status(404).json({ error: 'Product not found' });
      }
      // Best-effort hard delete; if FK against order_items prevents it, soft-delete.
      try {
        await productsRepo.remove(req.params.productId, vendor.id);
      } catch (e) {
        await productsRepo.update(req.params.productId, vendor.id, { is_available: 0 });
        archived = true;
      }
    } else {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND vendor_id = ?').get(req.params.productId, vendor?.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      const refCount = db.prepare('SELECT COUNT(*) as c FROM order_items WHERE product_id = ?').get(req.params.productId)?.c || 0;
      if (refCount > 0) {
        db.prepare("UPDATE products SET is_available = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.productId);
        archived = true;
      } else {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.productId);
      }
    }
    realtime.emit('*', 'product:removed', { id: req.params.productId });
    res.json({ message: archived ? 'Product archived (has existing orders)' : 'Product removed' });
  } catch (err) {
    console.error('me/products delete error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /api/vendors/me/analytics
router.get('/me/analytics', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    if (useSupabase()) {
      const vendor = await vendorsRepo.getByUserId(req.user.id);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      const { last30days, dailyViews } = await analyticsRepo.vendorDashboard(vendor.id);
      return res.json({
        totals: {
          profile_views: vendor.profile_views, whatsapp_clicks: vendor.whatsapp_clicks,
          rating: vendor.rating, total_reviews: vendor.total_reviews,
        },
        last30days, dailyViews,
      });
    }
    const db = getDb();
    const vendor = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
    const last30days = db.prepare(`
      SELECT event_type, COUNT(*) as count FROM analytics_events
      WHERE vendor_id = ? AND created_at >= datetime('now', '-30 days') GROUP BY event_type
    `).all(vendor.id);
    const dailyViews = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as views FROM analytics_events
      WHERE vendor_id = ? AND event_type = 'profile_view' AND created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at) ORDER BY date ASC
    `).all(vendor.id);
    res.json({
      totals: {
        profile_views: vendor.profile_views, whatsapp_clicks: vendor.whatsapp_clicks,
        rating: vendor.rating, total_reviews: vendor.total_reviews,
      },
      last30days, dailyViews,
    });
  } catch (err) {
    console.error('me/analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// GET /api/vendors/me/orders
router.get('/me/orders', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const vendor = onSupabase
      ? await vendorsRepo.getByUserId(req.user.id)
      : db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    if (onSupabase) {
      return res.json(await ordersRepo.listForVendor(vendor.id));
    }
    const list = db.prepare(`
      SELECT o.*, u.name as buyer_name, u.phone as buyer_phone
      FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.vendor_id = ? ORDER BY o.created_at DESC
    `).all(vendor.id);
    const withHistory = list.map((o) => {
      let status_history = [];
      try {
        status_history = db.prepare(`
          SELECT id, status, note, created_at
          FROM order_status_history
          WHERE order_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `).all(o.id);
      } catch (e) { /* ignore */ }
      return { ...o, status_history };
    });
    res.json(withHistory);
  } catch (err) {
    console.error('me/orders error:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// PUT /api/vendors/me/orders/:orderId/status
const VENDOR_FORWARD = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
function vendorValidTransition(from, to) {
  if (from === to) return false;
  if (to === 'cancelled') return from === 'pending' || from === 'confirmed';
  return VENDOR_FORWARD[from] === to;
}

router.put('/me/orders/:orderId/status', authenticate, requireRole('vendor'), async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const vendor = onSupabase
      ? await vendorsRepo.getByUserId(req.user.id)
      : db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);

    let order;
    if (onSupabase) {
      order = await ordersRepo.getBasic(req.params.orderId);
      if (!order || order.vendor_id !== vendor?.id) return res.status(404).json({ error: 'Order not found' });
    } else {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND vendor_id = ?').get(req.params.orderId, vendor?.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
    }

    if (!vendorValidTransition(order.status, status)) {
      return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
    }

    if (onSupabase) {
      await ordersRepo.setStatus(req.params.orderId, status);
    } else {
      db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ? AND vendor_id = ?")
        .run(status, req.params.orderId, vendor?.id);
      try {
        db.prepare(`
          INSERT INTO order_status_history (id, order_id, status, note, changed_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), req.params.orderId, status, note || null, req.user.id);
      } catch (e) { /* ignore */ }
    }

    const updatedAt = new Date().toISOString();
    realtime.emit(`user:${order.user_id}`, 'order:status', {
      order_id: req.params.orderId, status, updated_at: updatedAt, note: note || null,
    });
    realtime.emit(`user:${order.user_id}`, 'order:updated', { id: req.params.orderId, status });

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('me/orders status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ---- Public /:id route (MUST come AFTER all /me/* routes) ----

// POST /api/vendors/:id/whatsapp-click
router.post('/:id/whatsapp-click', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Vendor not found' });
  try {
    if (useSupabase()) {
      analyticsRepo.logEvent({ id: uuidv4(), vendorId: req.params.id, eventType: 'whatsapp_click' }).catch(() => {});
      await vendorsRepo.incrementWhatsappClicks(req.params.id);
    } else {
      const db = getDb();
      db.prepare("INSERT INTO analytics_events (id, vendor_id, event_type) VALUES (?, ?, 'whatsapp_click')")
        .run(uuidv4(), req.params.id);
      db.prepare('UPDATE vendor_profiles SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = ?').run(req.params.id);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('whatsapp-click error:', err);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// GET /api/vendors/:id — public vendor profile
router.get('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Vendor not found' });
  if (useSupabase()) {
    try {
      const vendor = await vendorsRepo.getById(req.params.id);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      // Fire-and-forget side effects
      vendorsRepo.incrementProfileViews(vendor.id).catch(() => {});
      analyticsRepo.logEvent({
        id: uuidv4(), vendorId: vendor.id, eventType: 'profile_view',
      }).catch(() => {});
      const [products, reviews] = await Promise.all([
        productsRepo.listByVendor(vendor.id, { availableOnly: true }),
        reviewsRepo.listForVendor(vendor.id, { approvedOnly: true, limit: 10 }),
      ]);
      return res.json({ vendor, products, reviews });
    } catch (err) {
      console.error('vendor detail (supabase) error:', err);
      return res.status(500).json({ error: 'Failed to load vendor' });
    }
  }

  const db = getDb();
  const vendor = db.prepare(`
    SELECT vp.*, u.name as owner_name
    FROM vendor_profiles vp
    JOIN users u ON u.id = vp.user_id
    WHERE vp.id = ?
  `).get(req.params.id);

  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  db.prepare("INSERT INTO analytics_events (id, vendor_id, event_type) VALUES (?, ?, 'profile_view')")
    .run(uuidv4(), vendor.id);
  db.prepare('UPDATE vendor_profiles SET profile_views = profile_views + 1 WHERE id = ?').run(vendor.id);

  const products = db.prepare('SELECT * FROM products WHERE vendor_id = ? AND is_available = 1').all(vendor.id);
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.vendor_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC LIMIT 10
  `).all(vendor.id);

  res.json({ vendor, products, reviews });
});

// POST /api/vendors/me/kyc — submit/replace KYC details with NIN + business info + ID document
router.post(
  '/me/kyc',
  authenticate,
  requireRole('vendor'),
  upload.single('id_document'),
  upload.verifyMime('document'),
  async (req, res) => {
    try {
      // Strict NIN check first — spec requires exactly 11 digits with a precise error message.
      const ninRaw = typeof req.body.nin === 'string' ? req.body.nin.trim() : '';
      if (!/^\d{11}$/.test(ninRaw)) {
        return res.status(400).json({ error: 'NIN must be exactly 11 digits' });
      }
      const { errors, data } = validateKyc(req.body);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });

      const onSupabase = useSupabase();
      const db = onSupabase ? null : getDb();
      const profile = onSupabase
        ? await vendorsRepo.getByUserId(req.user.id)
        : db.prepare('SELECT id, id_document_url FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found. Create your shop first.' });

      let documentUrl = null;
      if (req.file) {
        const uploaded = await storeUploadedFile(req.file, { folder: 'thriftlink/kyc' });
        documentUrl = uploaded?.url || null;
      }
      const finalDocUrl = documentUrl || profile.id_document_url || null;
      if (!finalDocUrl) {
        return res.status(400).json({ error: 'ID document is required' });
      }

      if (onSupabase) {
        await vendorsRepo.submitKyc(profile.id, {
          nin: data.nin, bvn: data.bvn || null,
          business_name: data.business_name, business_address: data.business_address,
          business_registration_number: data.business_registration_number || null,
          id_document_type: data.id_document_type, id_document_url: finalDocUrl,
        });
        const user = await usersRepo.getById(req.user.id);
        if (user?.email) sendEmail({ to: user.email, ...templates.kycSubmitted(user.name) }).catch(() => {});
      } else {
        db.prepare(
          `UPDATE vendor_profiles
           SET nin = ?, bvn = ?, business_name = ?, business_address = ?,
               business_registration_number = ?, id_document_type = ?, id_document_url = ?,
               kyc_submitted_at = datetime('now'),
               kyc_reviewed_at = NULL, kyc_review_notes = NULL,
               verification_status = 'pending', updated_at = datetime('now')
           WHERE id = ?`
        ).run(data.nin, data.bvn || null, data.business_name, data.business_address,
          data.business_registration_number || null, data.id_document_type, finalDocUrl, profile.id);
        const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id);
        if (user?.email) sendEmail({ to: user.email, ...templates.kycSubmitted(user.name) }).catch(() => {});
      }

      res.json({ message: 'KYC submitted. We will review within 1–2 business days.' });
    } catch (error) {
      console.error('KYC submission error:', error);
      res.status(500).json({ error: 'Failed to submit KYC' });
    }
  }
);

// GET /api/vendors/me/kyc — fetch current KYC status (sensitive fields masked)
router.get('/me/kyc', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const mask = (v) => (v ? `${'*'.repeat(Math.max(0, v.length - 4))}${v.slice(-4)}` : null);
    if (useSupabase()) {
      const row = await vendorsRepo.getKycForVendor(req.user.id);
      if (!row) return res.status(404).json({ error: 'Vendor profile not found' });
      return res.json({ ...row, nin: mask(row.nin), bvn: mask(row.bvn) });
    }
    const db = getDb();
    const row = db.prepare(
      `SELECT verification_status, business_name, business_address, business_registration_number,
              id_document_type, id_document_url, kyc_submitted_at, kyc_reviewed_at, kyc_review_notes,
              nin, bvn
       FROM vendor_profiles WHERE user_id = ?`
    ).get(req.user.id);
    if (!row) return res.status(404).json({ error: 'Vendor profile not found' });
    res.json({ ...row, nin: mask(row.nin), bvn: mask(row.bvn) });
  } catch (err) {
    console.error('me/kyc error:', err);
    res.status(500).json({ error: 'Failed to load KYC' });
  }
});

module.exports = router;
