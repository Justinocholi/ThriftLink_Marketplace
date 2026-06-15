/**
 * End-to-end verification: send a real event to PostHog's capture API and
 * assert HTTP 200. Uses the same key the SPA will use at runtime, so a green
 * run here means the SPA event pipeline is configured correctly.
 *
 * Usage:
 *   node scripts/posthog-live-verify.mjs
 */
const key = process.env.VITE_POSTHOG_KEY;
const host = process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
if (!key) {
  console.error('VITE_POSTHOG_KEY not set');
  process.exit(1);
}

const distinct = `verify-${Date.now()}`;
const body = {
  api_key: key,
  event: 'analytics_verification_ping',
  distinct_id: distinct,
  timestamp: new Date().toISOString(),
  properties: {
    source: 'claude-code-script',
    repo: 'ThriftLink_Marketplace',
    note: 'Confirms the configured key + host can ingest events.',
  },
};

const url = `${host.replace(/\/$/, '')}/i/v0/e/`;
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log(`POST ${url}`);
console.log(`HTTP ${res.status}`);
console.log(`response: ${text}`);
console.log(`\ndistinct_id used: ${distinct}`);
console.log(`event name:       analytics_verification_ping`);
console.log(`\nVerify on the PostHog dashboard:`);
console.log(`  Activity → Live events  →  filter by event=analytics_verification_ping`);
process.exit(res.ok ? 0 : 1);
