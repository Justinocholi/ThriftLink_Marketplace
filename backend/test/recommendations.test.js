const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buildApp } = require('./app');
const { getDb } = require('../database/db');
const recommendationEngine = require('../services/recommendationEngine');

const app = buildApp();
const db = getDb();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, state: user.state, city: user.city },
    process.env.JWT_SECRET
  );
}

function createTestUser({ role = 'user', name = 'Test User', state = 'Lagos', city = 'Ikeja' } = {}) {
  const id = uuidv4();
  const email = `test-${id.slice(0, 8)}@thriftlink.test`;
  const hash = bcrypt.hashSync('Pass1234!', 4);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, state, city, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, email, hash, name, role, state, city);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return { user, token: makeToken(user) };
}

function createTestVendor({
  shopName,
  category = 'Fashion & Clothing',
  isVerified = 1,
  verificationStatus = 'approved',
  state = 'Lagos',
  rating = 4.8,
  totalReviews = 10,
  productCount = 3,
} = {}) {
  const { user, token } = createTestUser({ role: 'vendor', name: `${shopName} Owner`, state });
  const vendorId = uuidv4();
  db.prepare(`
    INSERT INTO vendor_profiles (
      id, user_id, shop_name, description, whatsapp_number, category,
      state, is_verified, verification_status, rating, total_reviews, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    vendorId, user.id, shopName, `Description for ${shopName}`, '08012345678',
    category, state, isVerified, verificationStatus, rating, totalReviews
  );

  for (let i = 0; i < productCount; i++) {
    db.prepare(`
      INSERT INTO products (id, vendor_id, name, price, category, condition, is_available)
      VALUES (?, ?, ?, ?, ?, 'good', 1)
    `).run(uuidv4(), vendorId, `${shopName} Item ${i + 1}`, 5000 + i * 500, category);
  }

  return { vendorId, userId: user.id, shopName, token };
}

describe('Recommendation Algorithm Unit Tests', () => {
  test('calculateFreshness decays with time', () => {
    const now = new Date().toISOString();
    const freshScore = recommendationEngine.calculateFreshness(now);
    expect(freshScore).toBeCloseTo(1.0, 1);

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const staleScore = recommendationEngine.calculateFreshness(twoWeeksAgo);
    expect(staleScore).toBeLessThan(freshScore);
    expect(staleScore).toBeCloseTo(0.5, 1);

    const veryOld = new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString();
    expect(recommendationEngine.calculateFreshness(veryOld)).toBeLessThan(0.15);
  });

  test('calculateExploration boosts underexposed vendors', () => {
    const highBoost = recommendationEngine.calculateExploration(5, new Date().toISOString());
    expect(highBoost).toBe(1.0);

    const moderateBoost = recommendationEngine.calculateExploration(60);
    expect(moderateBoost).toBeGreaterThan(0.2);
    expect(moderateBoost).toBeLessThan(0.8);

    const noBoost = recommendationEngine.calculateExploration(200);
    expect(noBoost).toBe(0.0);
  });

  test('applyDiversity prevents clustering of same categories', () => {
    const list = [
      { id: '1', category: 'Fashion' },
      { id: '2', category: 'Fashion' },
      { id: '3', category: 'Fashion' },
      { id: '4', category: 'Electronics' },
      { id: '5', category: 'Fashion' },
    ];
    const diversified = recommendationEngine.applyDiversity(list, 2);
    // At index 2, the consecutive run of 'Fashion' should be broken by 'Electronics'
    expect(diversified[2].category).toBe('Electronics');
  });
});

describe('Recommendation API & Surfaces Integration Tests', () => {
  let verifiedFashionVendor;
  let verifiedTechVendor;
  let unverifiedVendor;
  let customer;

  beforeAll(() => {
    verifiedFashionVendor = createTestVendor({ shopName: 'Retro Kicks & Fits', category: 'Fashion & Clothing' });
    verifiedTechVendor = createTestVendor({ shopName: 'Gadget Vault', category: 'Electronics' });
    unverifiedVendor = createTestVendor({
      shopName: 'Suspicious Shop',
      category: 'Fashion & Clothing',
      isVerified: 0,
      verificationStatus: 'pending',
    });
    customer = createTestUser({ role: 'user', name: 'Thrift Shopper' });
  });

  test('GET /api/recommendations/vendors excludes unverified vendors (hard eligibility filter)', async () => {
    const res = await request(app).get('/api/recommendations/vendors?surface=discover');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('vendors');
    const returnedIds = res.body.vendors.map((v) => v.id);

    // Verified vendors are eligible
    expect(returnedIds).toContain(verifiedFashionVendor.vendorId);
    expect(returnedIds).toContain(verifiedTechVendor.vendorId);

    // Unverified/pending vendor MUST NEVER appear
    expect(returnedIds).not.toContain(unverifiedVendor.vendorId);
  });

  test('User interest selection updates scoring and ranking explanation', async () => {
    // 1. Set interest to 'Electronics'
    const putRes = await request(app)
      .put('/api/recommendations/user-interests')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ interests: ['Electronics'] });
    expect(putRes.status).toBe(200);
    expect(putRes.body.interests).toContain('Electronics');

    // 2. Fetch personalized recommendations
    const recRes = await request(app)
      .get('/api/recommendations/vendors?surface=recommended_for_you')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(recRes.status).toBe(200);
    expect(recRes.body.vendors.length).toBeGreaterThan(0);

    const techMatch = recRes.body.vendors.find((v) => v.id === verifiedTechVendor.vendorId);
    expect(techMatch).toBeDefined();
    expect(techMatch.reasons.some((r) => r.includes('Electronics'))).toBe(true);
  });

  test('Dismissed vendors are excluded from recommendations', async () => {
    // Dismiss the tech vendor
    const feedbackRes = await request(app)
      .post('/api/recommendations/feedback')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ vendorId: verifiedTechVendor.vendorId, reason: 'not_interested' });
    expect(feedbackRes.status).toBe(200);

    // Verify it is no longer returned in recommended_for_you
    const recRes = await request(app)
      .get('/api/recommendations/vendors?surface=recommended_for_you')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(recRes.status).toBe(200);
    const returnedIds = recRes.body.vendors.map((v) => v.id);
    expect(returnedIds).not.toContain(verifiedTechVendor.vendorId);
  });

  test('GET /api/vendors/:id/similar returns candidates in same category', async () => {
    const res = await request(app).get(`/api/vendors/${verifiedFashionVendor.vendorId}/similar`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('vendors');
    const returnedIds = res.body.vendors.map((v) => v.id);
    // Should not contain itself
    expect(returnedIds).not.toContain(verifiedFashionVendor.vendorId);
  });

  test('Interaction logging deduplicates repeat clicks within 15 minutes', async () => {
    const vendorId = verifiedFashionVendor.vendorId;

    // First event logs
    const ev1 = await request(app)
      .post('/api/recommendations/events')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ vendorId, eventType: 'catalog_view' });
    expect(ev1.status).toBe(200);
    expect(ev1.body.recorded).toBe(true);

    // Second identical event within seconds is deduplicated
    const ev2 = await request(app)
      .post('/api/recommendations/events')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ vendorId, eventType: 'catalog_view' });
    expect(ev2.status).toBe(200);
    expect(ev2.body.deduplicated).toBe(true);
  });

  test('POST /api/recommendations/impressions records recommendation impressions', async () => {
    const res = await request(app)
      .post('/api/recommendations/impressions')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        impressions: [
          {
            vendorId: verifiedFashionVendor.vendorId,
            surface: 'recommended_for_you',
            position: 1,
            score: 85,
          },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('Vendor follow and unfollow endpoints work properly', async () => {
    const targetId = verifiedFashionVendor.vendorId;

    // 1. Follow
    const followRes = await request(app)
      .post(`/api/vendors/${targetId}/follow`)
      .set('Authorization', `Bearer ${customer.token}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body.following).toBe(true);

    // 2. Check status
    const statusRes = await request(app)
      .get(`/api/vendors/${targetId}/follow-status`)
      .set('Authorization', `Bearer ${customer.token}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.isFollowing).toBe(true);
    expect(statusRes.body.followerCount).toBeGreaterThanOrEqual(1);

    // 3. Unfollow
    const unfollowRes = await request(app)
      .delete(`/api/vendors/${targetId}/follow`)
      .set('Authorization', `Bearer ${customer.token}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.following).toBe(false);
  });

  test('Referral tracking and attribution', async () => {
    // 1. Get referral code for vendor
    const refRes = await request(app).get(`/api/recommendations/referrals/vendor/${verifiedFashionVendor.vendorId}`);
    expect(refRes.status).toBe(200);
    expect(refRes.body.referralCode).toMatch(/^TL-/);

    // 2. Track public click
    const trackRes = await request(app)
      .post('/api/recommendations/referrals/track')
      .send({ referralCode: refRes.body.referralCode });
    expect(trackRes.status).toBe(200);

    // 3. Attribute registration
    const newCustomer = createTestUser();
    const attrRes = await request(app)
      .post('/api/recommendations/referrals/attribute')
      .set('Authorization', `Bearer ${newCustomer.token}`)
      .send({ referralCode: refRes.body.referralCode });
    expect(attrRes.status).toBe(200);
    expect(attrRes.body.result.conversion_status).toBe('registered');
  });

  test('Personalized feed returns posts for public and authenticated users', async () => {
    const res = await request(app).get('/api/recommendations/feed?surface=recommended_for_you&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);

    const authRes = await request(app)
      .get('/api/recommendations/feed?surface=new_arrivals&limit=10')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(authRes.status).toBe(200);
    expect(Array.isArray(authRes.body.posts)).toBe(true);
  });

  test('Vendor can upload product with condition like_new and it appears on the real feed without synthetic posts', async () => {
    // 1. Post product as verified vendor with condition 'like_new' and price string
    const prodRes = await request(app)
      .post('/api/vendors/me/products')
      .set('Authorization', `Bearer ${verifiedFashionVendor.token}`)
      .send({
        name: 'Vintage Leather Handbag Test',
        description: 'Authentic leather handbag directly posted by verified vendor',
        price: '18,500',
        condition: 'like_new',
        category: 'Fashion & Clothing',
        images: JSON.stringify(['https://example.com/test-handbag.jpg']),
      });
    expect(prodRes.status).toBe(201);
    expect(prodRes.body.product).toBeDefined();
    expect(prodRes.body.product.condition).toBe('like-new');

    // 2. Fetch news feed and verify the newly posted product appears
    const feedRes = await request(app).get('/api/recommendations/feed?surface=new_arrivals&limit=50');
    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body.posts)).toBe(true);

    // Verify zero synthetic posts
    const syntheticPosts = feedRes.body.posts.filter(p => p.post_type === 'vendor_status' || String(p.id).startsWith('status-'));
    expect(syntheticPosts.length).toBe(0);

    // Verify the newly created product is present in feed
    const targetId = prodRes.body.product?.id || prodRes.body.id;
    const found = feedRes.body.posts.find(p => p.id === targetId || p.product_id === targetId || p.name === 'Vintage Leather Handbag Test');
    expect(found).toBeDefined();
    expect(found.vendor_name).toBe(verifiedFashionVendor.shopName);
  });
});
