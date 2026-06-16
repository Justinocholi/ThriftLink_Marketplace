const request = require('supertest');
const { buildApp } = require('./app');

const app = buildApp();

function freshEmail(prefix = 'u') {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@thriftlink.test`;
}

describe('POST /api/auth/register', () => {
  test('rejects missing fields', async () => {
    const r = await request(app).post('/api/auth/register').send({});
    expect(r.status).toBe(400);
  });

  test('rejects short passwords', async () => {
    const r = await request(app).post('/api/auth/register').send({
      email: freshEmail(), password: '123', name: 'X', role: 'user',
    });
    expect(r.status).toBe(400);
  });

  test('creates a user and returns a JWT', async () => {
    const r = await request(app).post('/api/auth/register').send({
      email: freshEmail('reg'), password: 'Pass1234!', name: 'Reg User', role: 'user',
    });
    expect(r.status).toBe(201);
    expect(typeof r.body.token).toBe('string');
    expect(r.body.token.length).toBeGreaterThan(50);
    expect(r.body.user.email).toBeTruthy();
    expect(r.body.user.password_hash).toBeUndefined();
    expect(r.body.user.reset_token_hash).toBeUndefined();
  });

  test('rejects duplicate email with 409', async () => {
    const email = freshEmail('dup');
    const first = await request(app).post('/api/auth/register').send({
      email, password: 'Pass1234!', name: 'Dup', role: 'user',
    });
    expect(first.status).toBe(201);
    const second = await request(app).post('/api/auth/register').send({
      email, password: 'Pass1234!', name: 'Dup2', role: 'user',
    });
    expect(second.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  let creds;
  beforeAll(async () => {
    creds = { email: freshEmail('login'), password: 'Pass1234!' };
    await request(app).post('/api/auth/register').send({ ...creds, name: 'L', role: 'user' });
  });

  test('returns token for valid credentials', async () => {
    const r = await request(app).post('/api/auth/login').send(creds);
    expect(r.status).toBe(200);
    expect(r.body.token).toBeTruthy();
  });

  test('rejects wrong password', async () => {
    const r = await request(app).post('/api/auth/login').send({ ...creds, password: 'wrong' });
    expect(r.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  let token;
  beforeAll(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: freshEmail('me'), password: 'Pass1234!', name: 'Me User', role: 'user',
    });
    token = reg.body.token;
  });

  test('401 without token', async () => {
    const r = await request(app).get('/api/auth/me');
    expect(r.status).toBe(401);
  });

  test('returns user profile with valid token, never leaks secrets', async () => {
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body.user.name).toBe('Me User');
    expect(r.body.user.password_hash).toBeUndefined();
    expect(r.body.user.reset_token_hash).toBeUndefined();
  });
});

describe('POST /api/auth/forgot-password (anti-enumeration)', () => {
  test('returns the same message whether or not the email exists', async () => {
    const r1 = await request(app).post('/api/auth/forgot-password').send({ email: freshEmail('nope') });
    const r2 = await request(app).post('/api/auth/forgot-password').send({ email: 'admin@thriftlink.test' });
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.message).toBe(r2.body.message);
  });
});
