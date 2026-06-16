/**
 * Mailboxlayer — pre-flight email verification at signup.
 *
 * Calls https://apilayer.net/api/check before we touch Supabase Auth, so
 * disposable inboxes, typos, and unreachable domains are stopped at the door.
 *
 * Config (backend/.env):
 *   MAILBOXLAYER_KEY              required to enable. Without it this no-ops
 *                                 (returns { ok: true, skipped: true }).
 *
 * Design notes
 * - smtp_check is INTENTIONALLY ignored. Major providers (Gmail, Outlook,
 *   Yahoo) block Mailboxlayer's SMTP probes, so smtp_check is false for many
 *   perfectly real addresses. Rejecting on it would create false positives.
 * - We "fail open" on any network/API/quota error so a Mailboxlayer outage
 *   never blocks signups. The error is logged for observability.
 * - The verifier is wrapped with a 4s timeout so a slow API doesn't slow
 *   registration noticeably.
 */

const ENDPOINT = 'https://apilayer.net/api/check';
const TIMEOUT_MS = 4000;

function hasKey() {
  return Boolean(process.env.MAILBOXLAYER_KEY);
}

async function verifyEmailDeliverability(email) {
  if (!hasKey()) return { ok: true, skipped: true };
  if (!email) return { ok: false, reason: 'Email is required' };

  const url = new URL(ENDPOINT);
  url.searchParams.set('access_key', process.env.MAILBOXLAYER_KEY);
  url.searchParams.set('email', email);
  url.searchParams.set('smtp', '0');    // skip remote SMTP probe (unreliable)

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      console.warn('[mailboxlayer] HTTP', res.status, '— failing open');
      return { ok: true, skipped: true, error: `HTTP ${res.status}` };
    }
    const data = await res.json();

    // The API itself signals quota/auth problems inside the JSON.
    if (data?.success === false || data?.error) {
      console.warn('[mailboxlayer] API error — failing open:', data?.error?.info || JSON.stringify(data));
      return { ok: true, skipped: true, error: 'mailboxlayer_api_error' };
    }

    // Reject ONLY on truly unambiguous signals to avoid false positives.
    // We don't reject on mx_found alone — Mailboxlayer's free tier occasionally
    // returns mx_found:false for valid major providers (e.g. Gmail).
    if (data.format_valid === false) {
      return { ok: false, reason: 'That email address looks malformed.' };
    }
    if (data.disposable === true) {
      return { ok: false, reason: 'Disposable / temporary email addresses are not allowed.' };
    }
    // Soft suggestion: surface the did_you_mean when present, but still allow the
    // submission through. Front-end can show it as a confirm-prompt if desired.
    return {
      ok: true,
      suggestion: data.did_you_mean || null,
      raw: { mx_found: data.mx_found, disposable: data.disposable, role: data.role, free: data.free, score: data.score },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[mailboxlayer] timeout — failing open');
    } else {
      console.warn('[mailboxlayer] fetch failed — failing open:', err.message);
    }
    return { ok: true, skipped: true, error: 'mailboxlayer_unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { verifyEmailDeliverability, hasKey };
