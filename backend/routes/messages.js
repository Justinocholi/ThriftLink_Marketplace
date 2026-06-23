const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const realtime = require('../realtime');
const { storeUploadedFile } = require('../services/cloudinaryService');
const messagesRepo = require('../repos/messagesRepo');
const usersRepo = require('../repos/usersRepo');
const notificationsRepo = require('../repos/notificationsRepo');
const { isUuid } = require('../middleware/validate');
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

// Authorization for messaging:
//   Allow if either party is a vendor (cold-contact a vendor is a core
//   journey; vendors must be able to reply), OR a prior message already
//   exists between the two parties (existing thread).
// Implementations split by backend so each can use its own client.
async function canMessageSqlite(db, userId, partnerId) {
  const partner = db.prepare('SELECT id, role FROM users WHERE id = ?').get(partnerId);
  if (!partner) return { ok: false, status: 404, error: 'Recipient not found' };
  const me = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
  if (partner.role === 'vendor' || me?.role === 'vendor') return { ok: true, partner };
  const prior = db.prepare(
    'SELECT 1 FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) LIMIT 1'
  ).get(userId, partnerId, partnerId, userId);
  if (prior) return { ok: true, partner };
  return { ok: false, status: 403, error: 'Not allowed to message this user' };
}

async function canMessageSupabase(userId, partnerId) {
  const partner = await usersRepo.getById(partnerId);
  if (!partner) return { ok: false, status: 404, error: 'Recipient not found' };
  const me = await usersRepo.getById(userId);
  if (partner.role === 'vendor' || me?.role === 'vendor') return { ok: true, partner };
  try {
    const existing = await messagesRepo.thread(userId, partnerId);
    if (existing && existing.length > 0) return { ok: true, partner };
  } catch {}
  return { ok: false, status: 403, error: 'Not allowed to message this user' };
}

// Validate :partnerId and reject self-messaging. Returns true if request is
// valid, otherwise writes the error response and returns false.
function validatePartner(req, res) {
  const { partnerId } = req.params;
  if (!isUuid(partnerId)) {
    res.status(400).json({ error: 'Invalid partner id' });
    return false;
  }
  if (partnerId === req.user.id) {
    res.status(400).json({ error: 'Cannot message yourself' });
    return false;
  }
  return true;
}

function parsePagination(query) {
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(limit)) limit = 50;
  limit = Math.max(1, Math.min(100, limit));
  const beforeRaw = typeof query.before === 'string' ? query.before : null;
  let before = null;
  if (beforeRaw) {
    const d = new Date(beforeRaw);
    if (!Number.isNaN(d.getTime())) before = d.toISOString();
  }
  return { limit, before };
}

// Lightweight in-process typing tracker. Acceptable for a single-instance
// development backend; replace with Redis if horizontally scaled.
const typingTracker = new Map(); // key: `${userId}:${partnerId}` -> timestamp ms

const TYPING_TTL = 6000; // 6s

function isTyping(userId, partnerId) {
  const key = `${userId}:${partnerId}`;
  const ts = typingTracker.get(key);
  if (!ts) return false;
  if (Date.now() - ts > TYPING_TTL) {
    typingTracker.delete(key);
    return false;
  }
  return true;
}

function markOnline(db, userId) {
  try {
    if (useSupabase()) { usersRepo.setLastSeen(userId).catch(() => {}); return; }
    db.prepare("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?").run(userId);
  } catch {}
}

// Get list of conversations
router.get('/', authenticate, async (req, res) => {
  if (useSupabase()) {
    try {
      markOnline(null, req.user.id);
      const conversations = await messagesRepo.conversations(req.user.id);
      const decorated = conversations.map((c) => ({
        ...c,
        is_typing: isTyping(c.partner_id, req.user.id),
        is_online: c.partner_last_seen ? Date.now() - new Date(c.partner_last_seen).getTime() < 120000 : false,
      }));
      return res.json(decorated);
    } catch (error) {
      console.error('Fetch conversations (supabase) error:', error);
      return res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to fetch conversations' });
    }
  }
  const db = getDb();
  try {
    markOnline(db, req.user.id);
    const conversations = db.prepare(`
      SELECT
        u.id as partner_id,
        u.name as partner_name,
        u.avatar as partner_avatar,
        u.last_seen_at as partner_last_seen,
        m.content as last_message,
        m.image_url as last_image,
        m.created_at as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
      WHERE u.id != ?
      GROUP BY u.id
      ORDER BY m.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);

    // Decorate with online / typing state.
    const decorated = conversations.map((c) => ({
      ...c,
      is_typing: isTyping(c.partner_id, req.user.id),
      is_online: c.partner_last_seen
        ? Date.now() - new Date(c.partner_last_seen + 'Z').getTime() < 120000
        : false,
    }));

    res.json(decorated);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/:partnerId', authenticate, async (req, res) => {
  if (!validatePartner(req, res)) return;
  const { limit, before } = parsePagination(req.query);
  if (useSupabase()) {
    try {
      const authz = await canMessageSupabase(req.user.id, req.params.partnerId);
      if (!authz.ok) return res.status(authz.status).json({ error: authz.error });
      markOnline(null, req.user.id);
      // thread() returns ASC ordered full list — apply cursor + limit here.
      const all = await messagesRepo.thread(req.user.id, req.params.partnerId);
      const filtered = before
        ? all.filter((m) => new Date(m.created_at).getTime() < new Date(before).getTime())
        : all;
      // Take the last `limit` messages (most recent N before cursor).
      const messages = filtered.slice(Math.max(0, filtered.length - limit));
      const changes = await messagesRepo.markRead(req.user.id, req.params.partnerId);
      if (changes > 0) {
        realtime.emit(`user:${req.params.partnerId}`, 'message:read', { by: req.user.id, readAt: new Date().toISOString() });
      }
      const partner = await messagesRepo.getPartner(req.params.partnerId);
      return res.json({
        messages,
        partner: partner ? {
          ...partner,
          is_typing: isTyping(partner.id, req.user.id),
          is_online: partner.last_seen_at ? Date.now() - new Date(partner.last_seen_at).getTime() < 120000 : false,
        } : null,
      });
    } catch (error) {
      console.error('Fetch messages (supabase) error:', error);
      return res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to fetch messages' });
    }
  }
  const db = getDb();
  try {
    const authz = await canMessageSqlite(db, req.user.id, req.params.partnerId);
    if (!authz.ok) return res.status(authz.status).json({ error: authz.error });
    markOnline(db, req.user.id);
    // Cursor pagination: fetch newest-N (optionally before a timestamp), then
    // return ASC so the UI can append in natural order.
    const params = [req.user.id, req.params.partnerId, req.params.partnerId, req.user.id];
    let cursorClause = '';
    if (before) {
      cursorClause = ' AND created_at < ?';
      params.push(before);
    }
    const rows = db.prepare(`
      SELECT * FROM messages
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
      ${cursorClause}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...params, limit);
    const messages = rows.reverse();

    const result = db.prepare(`
      UPDATE messages
      SET is_read = 1, read_at = datetime('now')
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(req.params.partnerId, req.user.id);

    if (result.changes > 0) {
      realtime.emit(`user:${req.params.partnerId}`, 'message:read', {
        by: req.user.id,
        readAt: new Date().toISOString(),
      });
    }

    const partner = db
      .prepare('SELECT id, name, avatar, last_seen_at FROM users WHERE id = ?')
      .get(req.params.partnerId);

    res.json({
      messages,
      partner: partner
        ? {
            ...partner,
            is_typing: isTyping(partner.id, req.user.id),
            is_online: partner.last_seen_at
              ? Date.now() - new Date(partner.last_seen_at + 'Z').getTime() < 120000
              : false,
          }
        : null,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to fetch messages' });
  }
});

// Send a message (text and/or image)
router.post('/:partnerId', authenticate, async (req, res) => {
  const { content, image_url } = req.body;
  const { partnerId } = req.params;

  if (!validatePartner(req, res)) return;
  if (!content && !image_url) {
    return res.status(400).json({ error: 'Message content or image is required' });
  }

  if (useSupabase()) {
    try {
      const authz = await canMessageSupabase(req.user.id, partnerId);
      if (!authz.ok) return res.status(authz.status).json({ error: authz.error });
      markOnline(null, req.user.id);
      const id = uuidv4();
      const newMessage = await messagesRepo.send({
        id, senderId: req.user.id, receiverId: partnerId, content, imageUrl: image_url,
      });
      const notifId = uuidv4();
      await notificationsRepo.create({
        id: notifId, userId: partnerId, type: 'new_message', title: 'New Message',
        message: `You have a new message from ${req.user.name}`, link: '/user/messages',
      });
      typingTracker.delete(`${req.user.id}:${partnerId}`);
      realtime.emit([`user:${partnerId}`, `user:${req.user.id}`], 'message:new', { ...newMessage, sender_name: req.user.name });
      realtime.emit(`user:${partnerId}`, 'notification:new', {
        id: notifId, type: 'new_message', title: 'New Message',
        message: `You have a new message from ${req.user.name}`, link: '/user/messages',
        created_at: new Date().toISOString(),
      });
      return res.status(201).json(newMessage);
    } catch (error) {
      console.error('Send message (supabase) error:', error);
      return res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to send message' });
    }
  }

  const db = getDb();
  try {
    const authz = await canMessageSqlite(db, req.user.id, partnerId);
    if (!authz.ok) return res.status(authz.status).json({ error: authz.error });
    markOnline(db, req.user.id);
    const id = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, sender_id, receiver_id, content, image_url) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user.id, partnerId, content || '', image_url || null);

    const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);

    // Notify receiver (deduped on type+sender for spam control would be nice; skipped).
    const notifId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'new_message', 'New Message', ?, ?)
    `).run(
      notifId,
      partnerId,
      `You have a new message from ${req.user.name}`,
      `/user/messages`
    );

    // Clear typing flag for sender now that the message landed.
    typingTracker.delete(`${req.user.id}:${partnerId}`);

    // Push to both ends of the conversation so the UI updates instantly.
    realtime.emit(
      [`user:${partnerId}`, `user:${req.user.id}`],
      'message:new',
      { ...newMessage, sender_name: req.user.name }
    );
    realtime.emit(`user:${partnerId}`, 'notification:new', {
      id: notifId,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message from ${req.user.name}`,
      link: '/user/messages',
      created_at: new Date().toISOString(),
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to send message' });
  }
});

// POST /api/messages/:partnerId/typing — heartbeat for typing indicator
router.post('/:partnerId/typing', authenticate, (req, res) => {
  if (!isUuid(req.params.partnerId) || req.params.partnerId === req.user.id) {
    return res.status(400).json({ error: 'Invalid partner id' });
  }
  typingTracker.set(`${req.user.id}:${req.params.partnerId}`, Date.now());
  markOnline(useSupabase() ? null : getDb(), req.user.id);
  realtime.emit(`user:${req.params.partnerId}`, 'typing', {
    from: req.user.id,
    isTyping: true,
  });
  res.json({ ok: true });
});

// POST /api/messages/upload-image — upload an image attachment, returns hosted URL
router.post('/upload-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const uploaded = await storeUploadedFile(req.file, {
      folder: 'thriftlink/messages',
    });
    res.status(201).json({ url: uploaded.url });
  } catch (error) {
    console.error('Message image upload error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to upload image' });
  }
});

module.exports = router;
