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
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

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
  if (useSupabase()) {
    try {
      markOnline(null, req.user.id);
      const messages = await messagesRepo.thread(req.user.id, req.params.partnerId);
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
    markOnline(db, req.user.id);
    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(req.user.id, req.params.partnerId, req.params.partnerId, req.user.id);

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

  if (!content && !image_url) {
    return res.status(400).json({ error: 'Message content or image is required' });
  }

  if (useSupabase()) {
    try {
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
