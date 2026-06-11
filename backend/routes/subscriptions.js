const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const realtime = require('../realtime');
const { sendEmail, templates } = require('../services/emailService');
const { listPlans, getPlan, isPaidPlan, computeExpiry } = require('../config/subscriptionPlans');

const router = express.Router();

// GET /api/subscriptions/plans — public list of available plans + payment destination
router.get('/plans', (_req, res) => {
  res.json({
    plans: listPlans(),
    paymentAccount: {
      bankName: process.env.PAYMENT_BANK_NAME || '',
      accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || '',
      accountName: process.env.PAYMENT_ACCOUNT_NAME || '',
    },
  });
});

// GET /api/subscriptions/me — current vendor's subscription + most recent submission
router.get('/me', authenticate, requireRole('vendor'), (req, res) => {
  const db = getDb();
  const profile = db.prepare(
    'SELECT id, subscription_plan, subscription_expires_at FROM vendor_profiles WHERE user_id = ?'
  ).get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });

  const recent = db.prepare(
    `SELECT id, plan, amount, reference, status, review_notes, created_at, reviewed_at
     FROM subscription_payments WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 5`
  ).all(profile.id);

  const pending = recent.find((r) => r.status === 'pending') || null;
  res.json({
    plan: profile.subscription_plan,
    expiresAt: profile.subscription_expires_at,
    narration: `VENDOR-${profile.id.slice(0, 8)}`,
    pending,
    history: recent,
  });
});

// POST /api/subscriptions/payment-reference — vendor submits their transfer reference
router.post('/payment-reference', authenticate, requireRole('vendor'), (req, res) => {
  const { plan, reference, note } = req.body;
  const target = getPlan(plan);
  if (!target || !isPaidPlan(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be basic or pro.' });
  }
  const ref = String(reference || '').trim();
  if (ref.length < 3 || ref.length > 120) {
    return res.status(400).json({ error: 'A valid transfer reference is required.' });
  }

  const db = getDb();
  const profile = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });

  // Guard against duplicate pending submissions for the same vendor
  const existingPending = db.prepare(
    "SELECT id FROM subscription_payments WHERE vendor_id = ? AND status = 'pending'"
  ).get(profile.id);
  if (existingPending) {
    return res.status(409).json({
      error: 'You already have a pending submission. Wait for review or contact support.',
      paymentId: existingPending.id,
    });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO subscription_payments (id, vendor_id, plan, amount, reference, note, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`
  ).run(id, profile.id, target.id, target.price, ref, note ? String(note).slice(0, 500) : null);

  realtime.emit('role:admin', 'subscription:submitted', { id, vendor_id: profile.id, plan: target.id });

  res.json({
    message: 'Payment reference submitted. We will review within 1 business day.',
    paymentId: id,
  });
});

// =============== ADMIN ===============

// GET /api/subscriptions/admin/payments — list (optionally filter by status)
router.get('/admin/payments', authenticate, requireRole('admin'), (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
  const db = getDb();
  const where = status ? 'WHERE sp.status = ?' : '';
  const params = status ? [status] : [];
  const rows = db.prepare(
    `SELECT sp.*, vp.shop_name, u.email as vendor_email, u.name as vendor_name
     FROM subscription_payments sp
     JOIN vendor_profiles vp ON vp.id = sp.vendor_id
     JOIN users u ON u.id = vp.user_id
     ${where}
     ORDER BY sp.created_at DESC LIMIT 200`
  ).all(...params);
  res.json({ payments: rows });
});

// PUT /api/subscriptions/admin/payments/:id/review — approve or reject
router.put('/admin/payments/:id/review', authenticate, requireRole('admin'), (req, res) => {
  const { decision, notes } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }

  const db = getDb();
  const payment = db.prepare('SELECT * FROM subscription_payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'pending') {
    return res.status(409).json({ error: `Payment already ${payment.status}` });
  }

  const txn = db.transaction(() => {
    db.prepare(
      `UPDATE subscription_payments
       SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'),
           review_notes = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(decision, req.user.id, notes ? String(notes).slice(0, 500) : null, payment.id);

    if (decision === 'approved') {
      const expiresAt = computeExpiry(payment.plan);
      db.prepare(
        `UPDATE vendor_profiles
         SET subscription_plan = ?, subscription_expires_at = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(payment.plan, expiresAt, payment.vendor_id);
    }
  });
  txn();

  const vendor = db.prepare(
    `SELECT vp.user_id, vp.shop_name, vp.subscription_plan, vp.subscription_expires_at,
            u.email, u.name
     FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id WHERE vp.id = ?`
  ).get(payment.vendor_id);

  if (vendor?.email) {
    const tpl =
      decision === 'approved'
        ? templates.subscriptionApproved(vendor.name, payment.plan, vendor.subscription_expires_at)
        : templates.subscriptionRejected(vendor.name, payment.plan, notes);
    sendEmail({ to: vendor.email, ...tpl }).catch(() => {});
  }

  if (vendor) {
    realtime.emit(`user:${vendor.user_id}`, 'subscription:reviewed', {
      decision,
      plan: payment.plan,
      expiresAt: vendor.subscription_expires_at,
    });
  }

  res.json({ message: `Payment ${decision}` });
});

module.exports = router;
