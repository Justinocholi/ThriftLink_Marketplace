const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/users/me/profile
router.get('/me/profile', authenticate, (req, res) => {
  const db = getDb();
  const { password_hash, ...user } = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// PUT /api/users/me/profile
router.put('/me/profile', authenticate, (req, res) => {
  const { name, phone, state, city } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone),
    state = COALESCE(?, state), city = COALESCE(?, city), updated_at = datetime('now')
    WHERE id = ?
  `).run(name, phone, state, city, req.user.id);
  const { password_hash, ...user } = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// POST /api/users/me/avatar
router.post('/me/avatar', authenticate, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const db = getDb();
  db.prepare('UPDATE users SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?').run(url, req.user.id);
  res.json({ url });
});

// GET /api/users/me/orders
router.get('/me/orders', authenticate, (req, res) => {
  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, vp.shop_name as vendor_name, vp.whatsapp_number
    FROM orders o JOIN vendor_profiles vp ON vp.id = o.vendor_id
    WHERE o.user_id = ? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

// GET /api/users/me/saved
router.get('/me/saved', authenticate, (req, res) => {
  const db = getDb();
  const saved = db.prepare(`
    SELECT s.*, p.name as product_name, p.price, p.images, p.condition,
           vp.shop_name as vendor_name, vp.id as vendor_profile_id
    FROM saved_items s
    LEFT JOIN products p ON p.id = s.product_id
    LEFT JOIN vendor_profiles vp ON vp.id = s.vendor_id
    WHERE s.user_id = ? ORDER BY s.created_at DESC
  `).all(req.user.id);
  res.json(saved);
});

// POST /api/users/me/saved
router.post('/me/saved', authenticate, (req, res) => {
  const { product_id, vendor_id } = req.body;
  if (!product_id && !vendor_id) {
    return res.status(400).json({ error: 'product_id or vendor_id required' });
  }
  const db = getDb();
  const id = uuidv4();
  try {
    db.prepare('INSERT INTO saved_items (id, user_id, vendor_id, product_id) VALUES (?, ?, ?, ?)')
      .run(id, req.user.id, vendor_id || null, product_id || null);
    res.status(201).json({ id, message: 'Saved' });
  } catch {
    res.status(409).json({ error: 'Already saved' });
  }
});

// DELETE /api/users/me/saved/:id
router.delete('/me/saved/:id', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM saved_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Removed from saved' });
});

// GET /api/users/me/messages — conversation list
router.get('/me/messages', authenticate, (req, res) => {
  const db = getDb();
  // Get latest message per conversation partner
  const conversations = db.prepare(`
    SELECT m.*,
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
      u.name as partner_name, u.avatar as partner_avatar, u.role as partner_role
    FROM messages m
    JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY partner_id
    HAVING MAX(m.created_at)
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id);

  res.json(conversations);
});

// GET /api/users/me/messages/:partnerId — message thread
router.get('/me/messages/:partnerId', authenticate, (req, res) => {
  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(req.user.id, req.params.partnerId, req.params.partnerId, req.user.id);

  // Mark as read
  db.prepare('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?')
    .run(req.user.id, req.params.partnerId);

  res.json(messages);
});

// POST /api/users/me/messages/:partnerId — send message
router.post('/me/messages/:partnerId', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });

  const db = getDb();
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.partnerId);
  if (!receiver) return res.status(404).json({ error: 'Recipient not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)')
    .run(id, req.user.id, req.params.partnerId, content.trim());

  res.status(201).json(db.prepare('SELECT * FROM messages WHERE id = ?').get(id));
});

module.exports = router;
