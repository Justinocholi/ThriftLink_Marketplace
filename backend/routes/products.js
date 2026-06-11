const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { validateProductQuery } = require('../middleware/validate');

const router = express.Router();

// GET /api/products/categories/list — MUST be before /:id
router.get('/categories/list', (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count FROM products
    WHERE is_available = 1
    GROUP BY category ORDER BY count DESC
  `).all();
  res.json(categories);
});

// GET /api/products — public product search
const ORDER_BY_MAP = {
  newest: 'p.created_at DESC',
  price_low: 'p.price ASC',
  price_high: 'p.price DESC',
  popular: 'p.views DESC',
  rating: 'vp.rating DESC',
};

router.get('/', (req, res) => {
  const q = validateProductQuery(req.query);
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
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, vp.shop_name as vendor_name, vp.id as vendor_profile_id,
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
});

module.exports = router;
