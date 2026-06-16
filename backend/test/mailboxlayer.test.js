// Unit tests for the Mailboxlayer wrapper. We stub global fetch so no real
// HTTP traffic leaves the test runner.

const svc = require('../services/mailboxlayerService');

const realFetch = global.fetch;
const realKey = process.env.MAILBOXLAYER_KEY;

function mockFetchOnce(payload, status = 200) {
  global.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

afterEach(() => {
  global.fetch = realFetch;
  if (realKey !== undefined) process.env.MAILBOXLAYER_KEY = realKey;
  else delete process.env.MAILBOXLAYER_KEY;
});

describe('verifyEmailDeliverability', () => {
  test('no-ops when MAILBOXLAYER_KEY is not set', async () => {
    delete process.env.MAILBOXLAYER_KEY;
    const r = await svc.verifyEmailDeliverability('user@example.com');
    expect(r).toEqual({ ok: true, skipped: true });
  });

  test('passes good addresses through', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({
      format_valid: true, mx_found: true, disposable: false, role: false, free: true, score: 0.6,
    });
    const r = await svc.verifyEmailDeliverability('user@gmail.com');
    expect(r.ok).toBe(true);
    expect(r.raw.disposable).toBe(false);
  });

  test('rejects malformed addresses', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({ format_valid: false, mx_found: false });
    const r = await svc.verifyEmailDeliverability('garbage');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/malformed/i);
  });

  test('does not reject on mx_found:false (free-tier false-positives are common) but surfaces did_you_mean', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({ format_valid: true, mx_found: false, did_you_mean: 'user@gmail.com' });
    const r = await svc.verifyEmailDeliverability('user@gmial.com');
    // Soft-pass: allow signup but pass the typo suggestion to the caller.
    expect(r.ok).toBe(true);
    expect(r.suggestion).toBe('user@gmail.com');
  });

  test('rejects disposable inboxes', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({ format_valid: true, mx_found: true, disposable: true });
    const r = await svc.verifyEmailDeliverability('user@mailinator.com');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Disposable/);
  });

  test('fails open on a non-200 response (signups should keep working)', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({}, 500);
    const r = await svc.verifyEmailDeliverability('user@gmail.com');
    expect(r.ok).toBe(true);
    expect(r.skipped).toBe(true);
  });

  test('fails open when the API returns a quota / auth error inside the body', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({ success: false, error: { code: 104, type: 'monthly_limit_reached', info: 'quota' } });
    const r = await svc.verifyEmailDeliverability('user@gmail.com');
    expect(r.ok).toBe(true);
    expect(r.skipped).toBe(true);
  });

  test('does NOT reject on smtp_check=false (Gmail/Outlook block probes legitimately)', async () => {
    process.env.MAILBOXLAYER_KEY = 'k';
    mockFetchOnce({ format_valid: true, mx_found: true, smtp_check: false, disposable: false });
    const r = await svc.verifyEmailDeliverability('user@gmail.com');
    expect(r.ok).toBe(true);
  });
});
