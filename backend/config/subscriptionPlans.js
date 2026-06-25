/**
 * Single source of truth for subscription plans.
 * Used by:
 *   - GET /api/subscriptions/plans (vendor-facing UI)
 *   - POST /api/subscriptions/payment-reference (validation)
 *   - Admin approval (set plan + compute expiry)
 */

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    durationDays: null,
    description: 'Basic marketplace access — list a limited number of products.',
    features: [
      'List up to 5 products',
      'Basic profile',
      'Standard analytics',
      'Community support',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 1500,
    durationDays: 30,
    description: 'For growing vendors who need more listings and visibility.',
    features: [
      'List up to 50 products',
      'Verified badge',
      'Priority support',
      'Advanced analytics',
      'Featured listings',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 3000,
    durationDays: 30,
    description: 'Maximum reach for established vendors.',
    features: [
      'Unlimited listings',
      'Verified badge',
      'Dedicated support',
      'Custom analytics',
      'Homepage feature',
      'Multiple locations',
    ],
  },
};

const PAID_PLAN_IDS = ['basic', 'pro'];

function isPaidPlan(plan) {
  return PAID_PLAN_IDS.includes(plan);
}

function getPlan(plan) {
  return PLANS[plan] || null;
}

function listPlans() {
  return Object.values(PLANS);
}

function computeExpiry(plan, startDate = new Date()) {
  const p = getPlan(plan);
  if (!p?.durationDays) return null;
  const d = new Date(startDate);
  d.setDate(d.getDate() + p.durationDays);
  return d.toISOString();
}

module.exports = { PLANS, PAID_PLAN_IDS, isPaidPlan, getPlan, listPlans, computeExpiry };
