const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const productsRepo = require('../repos/productsRepo');
const { validateProductQuery, isUuid } = require('../middleware/validate');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

// GET /api/products/categories/list — MUST be before /:id
router.get('/categories/list', async (req, res) => {
  try {
    if (useSupabase()) return res.json(await productsRepo.categoriesList());
    const db = getDb();
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count FROM products
      WHERE is_available = 1
      GROUP BY category ORDER BY count DESC
    `).all();
    res.json(categories);
  } catch (err) {
    console.error('categories error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/products — public product search
const ORDER_BY_MAP = {
  newest: 'p.created_at DESC',
  price_low: 'p.price ASC',
  price_high: 'p.price DESC',
  popular: 'p.views DESC',
  rating: 'vp.rating DESC',
};

router.get('/', async (req, res) => {
  const q = validateProductQuery(req.query);

  if (useSupabase()) {
    try {
      const result = await productsRepo.search(q);
      return res.json(result);
    } catch (err) {
      console.error('products search (supabase) error:', err);
      return res.status(500).json({ error: 'Failed to search products' });
    }
  }

  // SQLite path (legacy)
  const db = getDb();
  const offset = (q.page - 1) * q.limit;
  const where = ['p.is_available = 1'];
  const params = [];
  if (q.verified_only) where.push('vp.is_verified = 1');
  if (q.search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)');
    const like = `%${q.search}%`;
    params.push(like, like, like);
  }
  if (q.category) { where.push('p.category = ?'); params.push(q.category); }
  if (q.condition) { where.push('p.condition = ?'); params.push(q.condition); }
  if (q.min_price !== undefined) { where.push('p.price >= ?'); params.push(q.min_price); }
  if (q.max_price !== undefined) { where.push('p.price <= ?'); params.push(q.max_price); }
  if (q.state) { where.push('vp.state = ?'); params.push(q.state); }
  if (q.city) { where.push('vp.city = ?'); params.push(q.city); }
  const whereClause = 'WHERE ' + where.join(' AND ');
  const orderBy = ORDER_BY_MAP[q.sort];
  const prods = db.prepare(`
    SELECT p.*, vp.shop_name as vendor_name, vp.id as vendor_profile_id,
           vp.whatsapp_number, vp.rating as vendor_rating, vp.state as vendor_state,
           vp.city as vendor_city, vp.is_verified
    FROM products p
    JOIN vendor_profiles vp ON vp.id = p.vendor_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, q.limit, offset);
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM products p
    JOIN vendor_profiles vp ON vp.id = p.vendor_id ${whereClause}
  `).get(...params).count;
  res.json({ products: prods, total, page: q.page, pages: Math.ceil(total / q.limit) });
});

// GET /api/products/:id — MUST be after /categories/list
router.get('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  try {
    if (useSupabase()) {
      const product = await productsRepo.getById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      // Fire-and-forget side effects (analytics + view counter) to avoid
      // delaying the response. Errors are swallowed.
      productsRepo.incrementViews(product.id).catch(() => {});
      const analytics = require('../repos/analyticsRepo');
      analytics.logEvent({
        id: uuidv4(), vendorId: product.vendor_profile_id,
        eventType: 'product_view', productId: product.id,
      }).catch(() => {});
      const related = await productsRepo.listByVendor(product.vendor_profile_id, {
        availableOnly: true, excludeId: product.id, limit: 4,
      });
      return res.json({ product, related });
    }

    const db = getDb();
    const product = db.prepare(`
      SELECT p.*, vp.shop_name as vendor_name, vp.id as vendor_profile_id,
             vp.user_id as vendor_user_id,
             vp.whatsapp_number, vp.rating as vendor_rating, vp.description as vendor_description,
             vp.is_verified, vp.state as vendor_state, vp.city as vendor_city, vp.logo as vendor_logo
      FROM products p
      JOIN vendor_profiles vp ON vp.id = p.vendor_id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    db.prepare("INSERT INTO analytics_events (id, vendor_id, event_type, product_id) VALUES (?, ?, 'product_view', ?)")
      .run(uuidv4(), product.vendor_profile_id, product.id);
    db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(product.id);
    const related = db.prepare(
      'SELECT * FROM products WHERE vendor_id = ? AND id != ? AND is_available = 1 LIMIT 4'
    ).all(product.vendor_profile_id, product.id);
    res.json({ product, related });
  } catch (err) {
    console.error('product detail error:', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

module.exports = router;
