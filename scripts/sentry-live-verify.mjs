/**
 * End-to-end verification: send a real event to the Sentry "store" endpoint
 * derived from VITE_SENTRY_DSN and assert HTTP 200. A green run here proves
 * the DSN + network can reach Sentry; the SPA uses the same DSN.
 *
 * Usage:
 *   VITE_SENTRY_DSN=... node scripts/sentry-live-verify.mjs
 */
const dsn = process.env.VITE_SENTRY_DSN;
if (!dsn) {
  console.error('VITE_SENTRY_DSN not set');
  process.exit(1);
}

// Parse the DSN: https://<publicKey>@<host>/<projectId>
const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
if (!m) {
  console.error('VITE_SENTRY_DSN does not look like a Sentry DSN:', dsn);
  process.exit(1);
}
const [, publicKey, host, projectId] = m;

const eventId = (
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
);
const payload = {
  event_id: eventId,
  timestamp: new Date().toISOString(),
  platform: 'javascript',
  level: 'info',
  message: { formatted: 'sentry_verification_ping' },
  tags: { source: 'claude-code-script' },
  extra: { repo: 'ThriftLink_Marketplace' },
};

const url = `https://${host}/api/${projectId}/store/`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Sentry-Auth': [
      'Sentry sentry_version=7',
      `sentry_key=${publicKey}`,
      `sentry_client=claude-verify/1.0`,
    ].join(', '),
  },
  body: JSON.stringify(payload),
});
const text = await res.text();
console.log(`POST ${url}`);
console.log(`HTTP ${res.status}`);
console.log(`response: ${text}`);
console.log(`\nevent_id submitted: ${eventId}`);
console.log(`\nVerify on the Sentry dashboard:`);
console.log(`  Issues → search "sentry_verification_ping"  (or use event id above)`);
process.exit(res.ok ? 0 : 1);
