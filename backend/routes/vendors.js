const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const realtime = require('../realtime');
const { storeUploadedFile, storeUploadedFiles } = require('../services/cloudinaryService');
const { validateKyc } = require('../middleware/validate');
const { sendEmail, templates } = require('../services/emailService');

const router = express.Router();

// GET /api/vendors — public list of verified vendors
// Admin-featured vendors always rank first (by featured_rank), then by rating.
// Pass ?featured=true to return only the admin-curated featured vendors.
router.get('/', (req, res) => {
  const { state, category, search, page = 1, limit = 20, featured } = req.query;
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
router.get('/me/profile', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
  res.json(vendor);
});

// PUT /api/vendors/me/profile
router.put('/me/profile', authenticate, requireRole('vendor'), (req, res) => {
  const { shop_name, description, whatsapp_number, instagram_handle, category, state, city } = req.body;
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

  const vendor = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  res.json(vendor);
});

// POST /api/vendors/me/logo
router.post('/me/logo', authenticate, requireRole('vendor'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const uploaded = await storeUploadedFile(req.file, {
      folder: 'thriftlink/vendors/logos',
    });
    const url = uploaded.url;
    const db = getDb();
    db.prepare("UPDATE vendor_profiles SET logo = ?, updated_at = datetime('now') WHERE user_id = ?").run(url, req.user.id);
    res.json({ url });
  } catch (error) {
    console.error('Vendor logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload vendor logo' });
  }
});

// GET /api/vendors/me/products
router.get('/me/products', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
  const prods = db.prepare('SELECT * FROM products WHERE vendor_id = ? ORDER BY created_at DESC').all(vendor.id);
  res.json(prods);
});

// POST /api/vendors/me/products
router.post('/me/products', authenticate, requireRole('vendor'), upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, original_price, category, condition, stock_quantity } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'name, price, and category are required' });
    }

    const db = getDb();
    const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    const images = req.files?.length
      ? (await storeUploadedFiles(req.files, () => ({
          folder: 'thriftlink/products',
        }))).map((file) => file.url)
      : [];
    const id = uuidv4();

    db.prepare(`
      INSERT INTO products (id, vendor_id, name, description, price, original_price, category, condition, images, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, vendor.id, name, description || null, parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      category, condition || 'good', JSON.stringify(images),
      stock_quantity ? parseInt(stock_quantity) : 1);

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    realtime.emit('*', 'product:created', created);
    res.status(201).json(created);
  } catch (error) {
    console.error('Vendor product upload error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/vendors/me/products/:productId
router.put('/me/products/:productId', authenticate, requireRole('vendor'), (req, res) => {
  const { name, description, price, original_price, category, condition, is_available, stock_quantity } = req.body;
  const db = getDb();
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND vendor_id = ?').get(req.params.productId, vendor?.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      original_price = COALESCE(?, original_price),
      category = COALESCE(?, category),
      condition = COALESCE(?, condition),
      is_available = COALESCE(?, is_available),
      stock_quantity = COALESCE(?, stock_quantity),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, description, price ? parseFloat(price) : null,
    original_price ? parseFloat(original_price) : null,
    category, condition,
    is_available !== undefined ? (is_available ? 1 : 0) : null,
    stock_quantity ? parseInt(stock_quantity) : null,
    req.params.productId);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.productId);
  realtime.emit('*', 'product:updated', updated);
  res.json(updated);
});

// DELETE /api/vendors/me/products/:productId
router.delete('/me/products/:productId', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND vendor_id = ?').get(req.params.productId, vendor?.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.productId);
  realtime.emit('*', 'product:removed', { id: req.params.productId });
  res.json({ message: 'Product deleted' });
});

// GET /api/vendors/me/analytics
router.get('/me/analytics', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

  const last30days = db.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM analytics_events
    WHERE vendor_id = ? AND created_at >= datetime('now', '-30 days')
    GROUP BY event_type
  `).all(vendor.id);

  const dailyViews = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as views
    FROM analytics_events
    WHERE vendor_id = ? AND event_type = 'profile_view' AND created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(vendor.id);

  res.json({
    totals: {
      profile_views: vendor.profile_views,
      whatsapp_clicks: vendor.whatsapp_clicks,
      rating: vendor.rating,
      total_reviews: vendor.total_reviews,
    },
    last30days,
    dailyViews,
  });
});

// GET /api/vendors/me/orders
router.get('/me/orders', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

  const orders = db.prepare(`
    SELECT o.*, u.name as buyer_name, u.phone as buyer_phone
    FROM orders o JOIN users u ON u.id = o.user_id
    WHERE o.vendor_id = ? ORDER BY o.created_at DESC
  `).all(vendor.id);
  res.json(orders);
});

// PUT /api/vendors/me/orders/:orderId/status
router.put('/me/orders/:orderId/status', authenticate, requireRole('vendor'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const db = getDb();
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ? AND vendor_id = ?")
    .run(status, req.params.orderId, vendor?.id);
  res.json({ message: 'Order status updated' });
});

// ---- Public /:id route (MUST come AFTER all /me/* routes) ----

// POST /api/vendors/:id/whatsapp-click
router.post('/:id/whatsapp-click', (req, res) => {
  const db = getDb();
  db.prepare("INSERT INTO analytics_events (id, vendor_id, event_type) VALUES (?, ?, 'whatsapp_click')")
    .run(uuidv4(), req.params.id);
  db.prepare('UPDATE vendor_profiles SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/vendors/:id — public vendor profile
router.get('/:id', (req, res) => {
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
  async (req, res) => {
    try {
      const { errors, data } = validateKyc(req.body);
      if (errors.length) return res.status(400).json({ errors });

      const db = getDb();
      const profile = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found. Create your shop first.' });

      let documentUrl = null;
      if (req.file) {
        const uploaded = await storeUploadedFile(req.file, { folder: 'thriftlink/kyc' });
        documentUrl = uploaded?.url || null;
      }

      const existing = db.prepare('SELECT id_document_url FROM vendor_profiles WHERE id = ?').get(profile.id);
      const finalDocUrl = documentUrl || existing?.id_document_url || null;
      if (!finalDocUrl) {
        return res.status(400).json({ error: 'A photo of your ID document is required.' });
      }

      db.prepare(
        `UPDATE vendor_profiles
         SET nin = ?, bvn = ?, business_name = ?, business_address = ?,
             business_registration_number = ?, id_document_type = ?, id_document_url = ?,
             kyc_submitted_at = datetime('now'),
             kyc_reviewed_at = NULL, kyc_review_notes = NULL,
             verification_status = 'pending',
             updated_at = datetime('now')
         WHERE id = ?`
      ).run(
        data.nin,
        data.bvn || null,
        data.business_name,
        data.business_address,
        data.business_registration_number || null,
        data.id_document_type,
        finalDocUrl,
        profile.id
      );

      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id);
      if (user?.email) {
        const tpl = templates.kycSubmitted(user.name);
        sendEmail({ to: user.email, ...tpl }).catch(() => {});
      }

      res.json({ message: 'KYC submitted. We will review within 1–2 business days.' });
    } catch (error) {
      console.error('KYC submission error:', error);
      res.status(500).json({ error: 'Failed to submit KYC' });
    }
  }
);

// GET /api/vendors/me/kyc — fetch current KYC status (sensitive fields masked)
router.get('/me/kyc', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const row = db.prepare(
    `SELECT verification_status, business_name, business_address, business_registration_number,
            id_document_type, id_document_url, kyc_submitted_at, kyc_reviewed_at, kyc_review_notes,
            nin, bvn
     FROM vendor_profiles WHERE user_id = ?`
  ).get(req.user.id);

  if (!row) return res.status(404).json({ error: 'Vendor profile not found' });
  const mask = (v) => (v ? `${'*'.repeat(Math.max(0, v.length - 4))}${v.slice(-4)}` : null);
  res.json({ ...row, nin: mask(row.nin), bvn: mask(row.bvn) });
});

module.exports = router;
