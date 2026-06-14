const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { storeUploadedFile } = require('../services/cloudinaryService');
const usersRepo = require('../repos/usersRepo');
const savedItemsRepo = require('../repos/savedItemsRepo');
const ordersRepo = require('../repos/ordersRepo');
const messagesRepo = require('../repos/messagesRepo');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

function stripSecret(user) {
  if (!user) return user;
  const { password_hash, reset_token_hash, reset_token_expires_at, ...safe } = user;
  return safe;
}

// GET /api/users/me/profile
router.get('/me/profile', authenticate, async (req, res) => {
  try {
    if (useSupabase()) return res.json(stripSecret(await usersRepo.getById(req.user.id)));
    const db = getDb();
    res.json(stripSecret(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
  } catch (err) {
    console.error('profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// GET /api/users/search?q=...&role=user|vendor
router.get('/search', authenticate, async (req, res) => {
  const qRaw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (qRaw.length < 2) return res.json({ users: [] });
  const roleFilter = ['user', 'vendor'].includes(req.query.role) ? req.query.role : null;

  try {
    if (useSupabase()) {
      const users = await usersRepo.search({ q: qRaw.slice(0, 60), role: roleFilter, excludeUserId: req.user.id });
      return res.json({ users });
    }
    const db = getDb();
    const q = `%${qRaw.slice(0, 60)}%`;
    const where = ['u.is_active = 1', 'u.id != ?', '(u.name LIKE ? OR u.email LIKE ?)'];
    const params = [req.user.id, q, q];
    if (roleFilter) { where.push('u.role = ?'); params.push(roleFilter); }
    else where.push("u.role IN ('user', 'vendor')");
    const rows = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.role, u.state, u.city, u.last_seen_at,
             vp.shop_name as vendor_shop_name, vp.is_verified as vendor_is_verified
      FROM users u
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY u.name ASC LIMIT 20
    `).all(...params);
    res.json({ users: rows });
  } catch (err) {
    console.error('user search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// PUT /api/users/me/profile
router.put('/me/profile', authenticate, async (req, res) => {
  const { name, phone, state, city } = req.body;
  try {
    if (useSupabase()) {
      // COALESCE semantics: only overwrite provided fields.
      const patch = {};
      if (name != null) patch.name = name;
      if (phone != null) patch.phone = phone;
      if (state != null) patch.state = state;
      if (city != null) patch.city = city;
      const user = await usersRepo.update(req.user.id, patch);
      return res.json(stripSecret(user));
    }
    const db = getDb();
    db.prepare(`
      UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone),
      state = COALESCE(?, state), city = COALESCE(?, city), updated_at = datetime('now')
      WHERE id = ?
    `).run(name, phone, state, city, req.user.id);
    res.json(stripSecret(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/me/avatar
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const uploaded = await storeUploadedFile(req.file, { folder: 'thriftlink/users/avatars' });
    const url = uploaded.url;
    if (useSupabase()) await usersRepo.update(req.user.id, { avatar: url });
    else getDb().prepare('UPDATE users SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?').run(url, req.user.id);
    res.json({ url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// GET /api/users/me/orders
router.get('/me/orders', authenticate, async (req, res) => {
  try {
    if (useSupabase()) {
      const orders = await ordersRepo.listForUser(req.user.id);
      // strip nested items to match the old shape (this endpoint returned flat orders)
      return res.json(orders.map(({ items, ...o }) => o));
    }
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, vp.shop_name as vendor_name, vp.whatsapp_number
      FROM orders o JOIN vendor_profiles vp ON vp.id = o.vendor_id
      WHERE o.user_id = ? ORDER BY o.created_at DESC
    `).all(req.user.id);
    res.json(orders);
  } catch (err) {
    console.error('me/orders error:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// GET /api/users/me/saved
router.get('/me/saved', authenticate, async (req, res) => {
  try {
    if (useSupabase()) return res.json(await savedItemsRepo.listForUser(req.user.id));
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
  } catch (err) {
    console.error('me/saved error:', err);
    res.status(500).json({ error: 'Failed to load saved items' });
  }
});

// POST /api/users/me/saved
router.post('/me/saved', authenticate, async (req, res) => {
  const { product_id, vendor_id } = req.body;
  if (!product_id && !vendor_id) return res.status(400).json({ error: 'product_id or vendor_id required' });
  const id = uuidv4();
  try {
    if (useSupabase()) {
      await savedItemsRepo.add({ id, userId: req.user.id, productId: product_id, vendorId: vendor_id });
    } else {
      getDb().prepare('INSERT INTO saved_items (id, user_id, vendor_id, product_id) VALUES (?, ?, ?, ?)')
        .run(id, req.user.id, vendor_id || null, product_id || null);
    }
    res.status(201).json({ id, message: 'Saved' });
  } catch {
    res.status(409).json({ error: 'Already saved' });
  }
});

// DELETE /api/users/me/saved/:id
router.delete('/me/saved/:id', authenticate, async (req, res) => {
  try {
    if (useSupabase()) await savedItemsRepo.remove(req.params.id, req.user.id);
    else getDb().prepare('DELETE FROM saved_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Removed from saved' });
  } catch (err) {
    console.error('unsave error:', err);
    res.status(500).json({ error: 'Failed to remove' });
  }
});

// ---- Legacy message endpoints (the active chat uses /api/messages). ----
// Kept for backwards-compat; thread + send are RPC-free, conversation list
// uses the conversation_list RPC in Supabase mode.
router.get('/me/messages', authenticate, async (req, res) => {
  try {
    if (useSupabase()) return res.json(await messagesRepo.conversations(req.user.id));
    const db = getDb();
    const conversations = db.prepare(`
      SELECT m.*,
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
        u.name as partner_name, u.avatar as partner_avatar, u.role as partner_role
      FROM messages m
      JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY partner_id HAVING MAX(m.created_at) ORDER BY m.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);
    res.json(conversations);
  } catch (err) {
    console.error('me/messages error:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.get('/me/messages/:partnerId', authenticate, async (req, res) => {
  try {
    if (useSupabase()) {
      const messages = await messagesRepo.thread(req.user.id, req.params.partnerId);
      await messagesRepo.markRead(req.user.id, req.params.partnerId);
      return res.json(messages);
    }
    const db = getDb();
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(req.user.id, req.params.partnerId, req.params.partnerId, req.user.id);
    db.prepare('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?')
      .run(req.user.id, req.params.partnerId);
    res.json(messages);
  } catch (err) {
    console.error('me/messages thread error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/me/messages/:partnerId', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });
  try {
    if (useSupabase()) {
      const receiver = await usersRepo.getById(req.params.partnerId);
      if (!receiver) return res.status(404).json({ error: 'Recipient not found' });
      const msg = await messagesRepo.send({
        id: uuidv4(), senderId: req.user.id, receiverId: req.params.partnerId, content: content.trim(),
      });
      return res.status(201).json(msg);
    }
    const db = getDb();
    const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.partnerId);
    if (!receiver) return res.status(404).json({ error: 'Recipient not found' });
    const id = uuidv4();
    db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)')
      .run(id, req.user.id, req.params.partnerId, content.trim());
    res.status(201).json(db.prepare('SELECT * FROM messages WHERE id = ?').get(id));
  } catch (err) {
    console.error('me/messages send error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
