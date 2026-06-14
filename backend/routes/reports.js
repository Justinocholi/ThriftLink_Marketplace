const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const realtime = require('../realtime');
const reportsRepo = require('../repos/reportsRepo');
const usersRepo = require('../repos/usersRepo');
const notificationsRepo = require('../repos/notificationsRepo');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

const VALID_TARGETS = ['product', 'vendor', 'user', 'message'];
const VALID_REASONS = [
  'Scam/Fraud',
  'Fake Product',
  'Harassment',
  'Spam',
  'Inappropriate Content',
  'Other',
];

// POST /api/reports — submit a report
router.post('/', authenticate, async (req, res) => {
  const { target_type, target_id, reason, details } = req.body;

  if (!target_type || !VALID_TARGETS.includes(target_type)) {
    return res.status(400).json({ error: 'Invalid target_type' });
  }
  if (!target_id) {
    return res.status(400).json({ error: 'target_id is required' });
  }
  if (!reason || !VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  // Normalize "user"/"message" reports to one of the schema-allowed buckets to keep
  // the existing CHECK constraint happy without an extra migration.
  const storedTargetType = target_type === 'user' || target_type === 'message' ? 'vendor' : target_type;
  const message = `${reason} report on ${target_type}`;
  const id = uuidv4();

  try {
    let report;
    if (useSupabase()) {
      report = await reportsRepo.create({
        id, reporterId: req.user.id, targetType: storedTargetType, targetId: target_id, reason, details,
      });
      const admins = await usersRepo.activeAdmins();
      await Promise.all(admins.map((a) => notificationsRepo.create({
        id: uuidv4(), userId: a.id, type: 'report', title: 'New Report', message, link: '/admin/reports',
      })));
    } else {
      const db = getDb();
      db.prepare(`
        INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(id, req.user.id, storedTargetType, target_id, reason, details || null);
      const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' AND is_active = 1").all();
      const insertNotif = db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'report', 'New Report', ?, '/admin/reports')
      `);
      admins.forEach((a) => insertNotif.run(uuidv4(), a.id, message));
      report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    }

    // Push to every connected admin so the moderation board updates live.
    realtime.emit('role:admin', 'report:new', {
      ...report,
      reporter_name: req.user.name,
    });
    realtime.emit('role:admin', 'notification:new', {
      type: 'report',
      title: 'New Report',
      message,
      link: '/admin/reports',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ id, message: 'Report received' });
  } catch (err) {
    console.error('Report submission failed:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
