const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const realtime = require('../realtime');

const router = express.Router();

// GET /api/reviews/vendor/:vendorId
router.get('/vendor/:vendorId', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.vendor_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(req.params.vendorId, parseInt(limit), offset);

  const stats = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as total,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one
    FROM reviews WHERE vendor_id = ? AND is_approved = 1
  `).get(req.params.vendorId);

  res.json({ reviews, stats });
});

// POST /api/reviews/vendor/:vendorId
router.post('/vendor/:vendorId', authenticate, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const db = getDb();

  // Check vendor exists
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE id = ?').get(req.params.vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  // Check if user already reviewed this vendor
  const existing = db.prepare('SELECT id FROM reviews WHERE vendor_id = ? AND user_id = ?').get(req.params.vendorId, req.user.id);
  if (existing) return res.status(409).json({ error: 'You have already reviewed this vendor' });

  const id = uuidv4();
  db.prepare('INSERT INTO reviews (id, vendor_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.vendorId, req.user.id, parseInt(rating), comment || null);

  // Update vendor aggregate rating
  const ratingData = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE vendor_id = ? AND is_approved = 1').get(req.params.vendorId);
  db.prepare('UPDATE vendor_profiles SET rating = ?, total_reviews = ? WHERE id = ?')
    .run(ratingData.avg || 0, ratingData.total, req.params.vendorId);

  const review = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.id = ?
  `).get(id);

  const vendorRow = db.prepare('SELECT user_id FROM vendor_profiles WHERE id = ?').get(req.params.vendorId);
  realtime.emit('*', 'review:new', { vendor_id: req.params.vendorId, review, rating: ratingData.avg || 0, total: ratingData.total });
  if (vendorRow) {
    realtime.emit(`user:${vendorRow.user_id}`, 'notification:new', {
      type: 'review',
      title: 'New Review',
      message: `${req.user.name} left you a ${rating}-star review.`,
      link: '/vendor/profile',
      created_at: new Date().toISOString(),
    });
  }

  res.status(201).json(review);
});

module.exports = router;
