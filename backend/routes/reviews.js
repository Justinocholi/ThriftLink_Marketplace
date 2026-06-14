const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const realtime = require('../realtime');
const reviewsRepo = require('../repos/reviewsRepo');
const vendorsRepo = require('../repos/vendorsRepo');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

// GET /api/reviews/vendor/:vendorId
router.get('/vendor/:vendorId', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    if (useSupabase()) {
      return res.json(await reviewsRepo.forVendorPublic(req.params.vendorId, { page: parseInt(page), limit: parseInt(limit) }));
    }
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
  } catch (err) {
    console.error('reviews list error:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// POST /api/reviews/vendor/:vendorId
router.post('/vendor/:vendorId', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  const vendorId = req.params.vendorId;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    let review, avg, total, vendorUserId;

    if (useSupabase()) {
      const vendor = await vendorsRepo.getById(vendorId);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      if (await reviewsRepo.alreadyReviewed(vendorId, req.user.id)) {
        return res.status(409).json({ error: 'You have already reviewed this vendor' });
      }
      const id = uuidv4();
      await reviewsRepo.create({ id, vendorId, userId: req.user.id, rating: parseInt(rating), comment: comment || null });
      await reviewsRepo.recalcVendorRating(vendorId);
      review = await reviewsRepo.getWithUser(id);
      const refreshed = await vendorsRepo.getById(vendorId);
      avg = refreshed.rating; total = refreshed.total_reviews; vendorUserId = refreshed.user_id;
    } else {
      const db = getDb();
      const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE id = ?').get(vendorId);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      const existing = db.prepare('SELECT id FROM reviews WHERE vendor_id = ? AND user_id = ?').get(vendorId, req.user.id);
      if (existing) return res.status(409).json({ error: 'You have already reviewed this vendor' });
      const id = uuidv4();
      db.prepare('INSERT INTO reviews (id, vendor_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
        .run(id, vendorId, req.user.id, parseInt(rating), comment || null);
      const ratingData = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE vendor_id = ? AND is_approved = 1').get(vendorId);
      db.prepare('UPDATE vendor_profiles SET rating = ?, total_reviews = ? WHERE id = ?')
        .run(ratingData.avg || 0, ratingData.total, vendorId);
      review = db.prepare('SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?').get(id);
      avg = ratingData.avg || 0; total = ratingData.total;
      vendorUserId = db.prepare('SELECT user_id FROM vendor_profiles WHERE id = ?').get(vendorId)?.user_id;
    }

    realtime.emit('*', 'review:new', { vendor_id: vendorId, review, rating: avg || 0, total });
    if (vendorUserId) {
      realtime.emit(`user:${vendorUserId}`, 'notification:new', {
        type: 'review', title: 'New Review',
        message: `${req.user.name} left you a ${rating}-star review.`,
        link: '/vendor/profile', created_at: new Date().toISOString(),
      });
    }
    res.status(201).json(review);
  } catch (err) {
    console.error('review create error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
