/**
 * Checks whether thriftlink.com.ng is ready to send via Resend.
 *
 * Reports:
 *  - whether the domain resolves at all (NS / SOA at the TLD)
 *  - each of the 4 records Resend expects (DKIM TXT, send MX, send SPF TXT, _dmarc TXT)
 *  - Resend's own verification status for the domain
 *
 * Usage:
 *   RESEND_API_KEY=... node scripts/verify-resend-domain.mjs
 *   (or rely on backend/.env's SMTP_PASSWORD when SMTP_USER=resend)
 */
import { readFileSync } from 'node:fs';

const ROOT = 'thriftlink.com.ng';
const DOH = (name, type) =>
  fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`).then((r) => r.json());

function loadKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const env = readFileSync(new URL('../backend/.env', import.meta.url), 'utf8');
    const user = env.match(/^SMTP_USER=(.*)$/m)?.[1]?.trim();
    const pass = env.match(/^SMTP_PASSWORD=(.*)$/m)?.[1]?.trim();
    if (user === 'resend' && pass) return pass;
    const explicit = env.match(/^RESEND_API_KEY=(.*)$/m)?.[1]?.trim();
    if (explicit) return explicit;
  } catch {}
  return null;
}

function statusLabel(s) {
  return { 0: 'OK', 3: 'NXDOMAIN' }[s] ?? `status ${s}`;
}

async function checkRecord(name, type, want) {
  const d = await DOH(name, type);
  const answers = d.Answer || [];
  const values = answers.map((a) => String(a.data || ''));
  const ok = want ? values.some((v) => v.includes(want)) : values.length > 0;
  return { name, type, status: statusLabel(d.Status), values, ok };
}

console.log(`Checking ${ROOT} …\n`);

const checks = await Promise.all([
  checkRecord(ROOT, 'NS'),
  checkRecord(`resend._domainkey.${ROOT}`, 'TXT', 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCa31iDg6'),
  checkRecord(`send.${ROOT}`, 'MX', 'feedback-smtp.eu-west-1.amazonses.com'),
  checkRecord(`send.${ROOT}`, 'TXT', 'v=spf1 include:amazonses.com'),
  checkRecord(`_dmarc.${ROOT}`, 'TXT', 'v=DMARC1'),
]);

for (const c of checks) {
  const flag = c.ok ? '✓' : '✗';
  console.log(`${flag} ${c.type.padEnd(4)} ${c.name}  [${c.status}]${c.values.length ? '' : '  (no records)'}`);
}

console.log('\n--- Resend domain status ---');
const key = loadKey();
if (!key) {
  console.log('(no RESEND_API_KEY available; skipping)');
} else {
  const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` } });
  const data = await r.json();
  const dom = data?.data?.find((d) => d.name === ROOT);
  if (!dom) console.log(`(no domain entry for ${ROOT} in this Resend account)`);
  else console.log(`Resend status: ${dom.status}  (id ${dom.id}, region ${dom.region})`);
}

const dnsReady = checks.every((c) => c.ok);
console.log(`\n${dnsReady ? '✅ All DNS records present.' : '⏳ DNS not yet ready.'} Click "Verify" in Resend once everything above is ✓.`);
process.exit(dnsReady ? 0 : 2);
