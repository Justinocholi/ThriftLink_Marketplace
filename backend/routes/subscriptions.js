const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const realtime = require('../realtime');
const { sendEmail, templates } = require('../services/emailService');
const { listPlans, getPlan, isPaidPlan, computeExpiry } = require('../config/subscriptionPlans');
const subscriptionsRepo = require('../repos/subscriptionsRepo');
const vendorsRepo = require('../repos/vendorsRepo');
const usersRepo = require('../repos/usersRepo');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

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
router.get('/me', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    let profile, recent;
    if (useSupabase()) {
      profile = await vendorsRepo.getByUserId(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });
      recent = await subscriptionsRepo.historyForVendor(profile.id, 5);
    } else {
      const db = getDb();
      profile = db.prepare('SELECT id, subscription_plan, subscription_expires_at FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });
      recent = db.prepare(
        `SELECT id, plan, amount, reference, status, review_notes, created_at, reviewed_at
         FROM subscription_payments WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 5`
      ).all(profile.id);
    }
    const pending = recent.find((r) => r.status === 'pending') || null;
    res.json({
      plan: profile.subscription_plan,
      expiresAt: profile.subscription_expires_at,
      narration: `VENDOR-${profile.id.slice(0, 8)}`,
      pending,
      history: recent,
    });
  } catch (err) {
    console.error('subscriptions/me error:', err);
    res.status(500).json({ error: 'Failed to load subscription' });
  }
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

  return (async () => {
  try {
    let profileId, existingPendingId;
    if (useSupabase()) {
      const profile = await vendorsRepo.getByUserId(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });
      profileId = profile.id;
      const existing = await subscriptionsRepo.pendingForVendor(profileId);
      existingPendingId = existing?.id;
    } else {
      const db = getDb();
      const profile = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });
      profileId = profile.id;
      existingPendingId = db.prepare("SELECT id FROM subscription_payments WHERE vendor_id = ? AND status = 'pending'").get(profileId)?.id;
    }

    if (existingPendingId) {
      return res.status(409).json({
        error: 'You already have a pending submission. Wait for review or contact support.',
        paymentId: existingPendingId,
      });
    }

    const id = uuidv4();
    const noteVal = note ? String(note).slice(0, 500) : null;
    if (useSupabase()) {
      await subscriptionsRepo.create({ id, vendorId: profileId, plan: target.id, amount: target.price, reference: ref, note: noteVal });
    } else {
      getDb().prepare(
        `INSERT INTO subscription_payments (id, vendor_id, plan, amount, reference, note, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      ).run(id, profileId, target.id, target.price, ref, noteVal);
    }

    realtime.emit('role:admin', 'subscription:submitted', { id, vendor_id: profileId, plan: target.id });
    res.json({
      message: 'Payment reference submitted. We will review within 1 business day.',
      paymentId: id,
    });
  } catch (err) {
    console.error('payment-reference error:', err);
    res.status(500).json({ error: 'Failed to submit payment reference' });
  }
  })();
});

// =============== ADMIN ===============

// GET /api/subscriptions/admin/payments — list (optionally filter by status)
router.get('/admin/payments', authenticate, requireRole('admin'), async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
  try {
    if (useSupabase()) {
      return res.json({ payments: await subscriptionsRepo.adminList({ status }) });
    }
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
  } catch (err) {
    console.error('admin payments list error:', err);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

// PUT /api/subscriptions/admin/payments/:id/review — approve or reject
router.put('/admin/payments/:id/review', authenticate, requireRole('admin'), async (req, res) => {
  const { decision, notes } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }

  try {
  let payment, vendor;
  const expiresAt = decision === 'approved' ? null : undefined;

  if (useSupabase()) {
    payment = await subscriptionsRepo.getById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'pending') return res.status(409).json({ error: `Payment already ${payment.status}` });

    await subscriptionsRepo.review(payment.id, { reviewedBy: req.user.id, decision, notes });
    if (decision === 'approved') {
      await vendorsRepo.setSubscription(payment.vendor_id, payment.plan, computeExpiry(payment.plan));
    }
    const vp = await vendorsRepo.getById(payment.vendor_id);
    const u = vp ? await usersRepo.getById(vp.user_id) : null;
    vendor = vp ? { user_id: vp.user_id, shop_name: vp.shop_name, subscription_plan: vp.subscription_plan, subscription_expires_at: vp.subscription_expires_at, email: u?.email, name: u?.name } : null;
  } else {
    const db = getDb();
    payment = db.prepare('SELECT * FROM subscription_payments WHERE id = ?').get(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'pending') return res.status(409).json({ error: `Payment already ${payment.status}` });

    const txn = db.transaction(() => {
      db.prepare(
        `UPDATE subscription_payments
         SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'),
             review_notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(decision, req.user.id, notes ? String(notes).slice(0, 500) : null, payment.id);
      if (decision === 'approved') {
        db.prepare(
          `UPDATE vendor_profiles
           SET subscription_plan = ?, subscription_expires_at = ?, updated_at = datetime('now')
           WHERE id = ?`
        ).run(payment.plan, computeExpiry(payment.plan), payment.vendor_id);
      }
    });
    txn();

    vendor = db.prepare(
      `SELECT vp.user_id, vp.shop_name, vp.subscription_plan, vp.subscription_expires_at,
              u.email, u.name
       FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id WHERE vp.id = ?`
    ).get(payment.vendor_id);
  }

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
  } catch (err) {
    console.error('subscription review error:', err);
    res.status(500).json({ error: 'Failed to review payment' });
  }
});

module.exports = router;
