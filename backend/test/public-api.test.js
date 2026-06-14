const request = require('supertest');
const { buildApp } = require('./app');

const app = buildApp();

describe('GET /api/health', () => {
  test('returns status ok', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });
});

describe('GET /api/products (search validator)', () => {
  test('clamps invalid query and returns a paginated shape', async () => {
    const r = await request(app).get('/api/products?sort=BAD;DROP&limit=99999&min_price=abc&page=-5');
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty('products');
    expect(r.body).toHaveProperty('total');
    expect(r.body.page).toBe(1);
    expect(Array.isArray(r.body.products)).toBe(true);
  });
});

describe('GET /api/products/:id', () => {
  test('returns 404 for malformed UUID (no 500 leak)', async () => {
    const r = await request(app).get('/api/products/not-a-uuid');
    expect(r.status).toBe(404);
  });

  test('returns 404 for valid-format but missing UUID', async () => {
    const r = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
    expect(r.status).toBe(404);
  });
});

describe('GET /api/vendors/:id', () => {
  test('returns 404 for malformed UUID', async () => {
    const r = await request(app).get('/api/vendors/garbage');
    expect(r.status).toBe(404);
  });
});

describe('GET /api/subscriptions/plans', () => {
  test('returns the three plans + payment account shape', async () => {
    const r = await request(app).get('/api/subscriptions/plans');
    expect(r.status).toBe(200);
    expect(r.body.plans.map((p) => p.id).sort()).toEqual(['basic', 'free', 'pro']);
    expect(r.body.paymentAccount).toHaveProperty('bankName');
    const basic = r.body.plans.find((p) => p.id === 'basic');
    expect(basic.price).toBe(2000);
    expect(basic.durationDays).toBe(30);
  });
});

describe('GET /api/payment/account', () => {
  test('returns the bank account fields (env-driven)', async () => {
    const r = await request(app).get('/api/payment/account');
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty('bankName');
    expect(r.body).toHaveProperty('accountNumber');
    expect(r.body).toHaveProperty('accountName');
  });
});

describe('Rate-limited paths are not enforced under the test app', () => {
  // Tests deliberately don't mount the rate limiter so they don't trip on
  // many requests; this asserts that fact so future regressions surface.
  test('100 rapid health requests all return 200', async () => {
    for (let i = 0; i < 100; i++) {
      const r = await request(app).get('/api/health');
      expect(r.status).toBe(200);
    }
  });
});
