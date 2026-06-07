const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');

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
router.get('/', (req, res) => {
  const { search, category, condition, min_price, max_price, state, city, sort = 'newest', page = 1, limit = 24, verified_only = 'false' } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['p.is_available = 1'];
  const params = [];

  if (verified_only === 'true') {
    where.push('vp.is_verified = 1');
  }

  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) { where.push('p.category = ?'); params.push(category); }
  if (condition) { where.push('p.condition = ?'); params.push(condition); }
  if (min_price) { where.push('p.price >= ?'); params.push(parseFloat(min_price)); }
  if (max_price) { where.push('p.price <= ?'); params.push(parseFloat(max_price)); }
  if (state) { where.push('vp.state = ?'); params.push(state); }
  if (city) { where.push('vp.city = ?'); params.push(city); }

  const whereClause = 'WHERE ' + where.join(' AND ');

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_low') orderBy = 'p.price ASC';
  else if (sort === 'price_high') orderBy = 'p.price DESC';
  else if (sort === 'popular') orderBy = 'p.views DESC';
  else if (sort === 'rating') orderBy = 'vp.rating DESC';

  const prods = db.prepare(`
    SELECT p.*, vp.shop_name as vendor_name, vp.id as vendor_profile_id,
           vp.whatsapp_number, vp.rating as vendor_rating, vp.state as vendor_state,
           vp.city as vendor_city, vp.is_verified
    FROM products p
    JOIN vendor_profiles vp ON vp.id = p.vendor_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM products p
    JOIN vendor_profiles vp ON vp.id = p.vendor_id ${whereClause}
  `).get(...params).count;

  res.json({ products: prods, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
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
