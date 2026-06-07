/**
 * Realtime bus — Socket.IO wiring with JWT auth, presence tracking, and a
 * single emit() helper used by REST route handlers to fan out DB changes.
 *
 * Rooms used:
 *   user:<id>     — a per-user room every socket joins on connect
 *   role:admin    — every admin socket joins this on connect
 */

const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { getDb } = require('./database/db');

let io = null;

// userId -> Set<socketId>
const presence = new Map();

function broadcastPresence(userId, online) {
  if (!io) return;
  io.emit('presence:change', { userId, online });
}

function markOnline(userId) {
  try {
    getDb()
      .prepare("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?")
      .run(userId);
  } catch {}
}

function init(server, opts = {}) {
  io = new Server(server, {
    cors: { origin: opts.origin || true, credentials: true },
    pingInterval: 20000,
    pingTimeout: 25000,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;

    socket.join(`user:${userId}`);
    if (role === 'admin') socket.join('role:admin');
    if (role === 'vendor') socket.join('role:vendor');

    // Track presence (multi-tab safe).
    if (!presence.has(userId)) {
      presence.set(userId, new Set());
      broadcastPresence(userId, true);
    }
    presence.get(userId).add(socket.id);
    markOnline(userId);

    // ---- Typing relay ----
    socket.on('typing', ({ to, isTyping = true }) => {
      if (!to) return;
      io.to(`user:${to}`).emit('typing', { from: userId, isTyping });
    });

    // ---- Read receipts relay (client tells us they opened the thread) ----
    socket.on('message:read', ({ partnerId }) => {
      if (!partnerId) return;
      try {
        getDb()
          .prepare(`
            UPDATE messages
            SET is_read = 1, read_at = datetime('now')
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
          `)
          .run(partnerId, userId);
      } catch {}
      io.to(`user:${partnerId}`).emit('message:read', {
        by: userId,
        readAt: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      const sockets = presence.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        presence.delete(userId);
        markOnline(userId);
        broadcastPresence(userId, false);
      }
    });
  });

  return io;
}

/**
 * REST routes call this after writing to the DB so connected clients can
 * react immediately. Falls back to a no-op before init() runs.
 */
function emit(target, event, payload) {
  if (!io) return;
  if (Array.isArray(target)) {
    target.forEach((t) => io.to(t).emit(event, payload));
  } else if (target === '*') {
    io.emit(event, payload);
  } else {
    io.to(target).emit(event, payload);
  }
}

function isOnline(userId) {
  return presence.has(userId);
}

function getIO() {
  return io;
}

module.exports = { init, emit, isOnline, getIO };
