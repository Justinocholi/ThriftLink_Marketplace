const TERMII_BASE_URL = 'https://api.ng.termii.com/api';

function hasTermiiConfig() {
  return Boolean(process.env.TERMII_API_KEY);
}

function normalizePhoneNumber(phone) {
  if (!phone) return null;

  const trimmed = String(phone).trim().replace(/\s+/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('234')) return `+${trimmed}`;
  if (trimmed.startsWith('0')) return `+234${trimmed.slice(1)}`;
  return trimmed;
}

async function termiiRequest(path, payload) {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available in this Node runtime');
  }

  const response = await fetch(`${TERMII_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Termii request failed (${response.status})`);
  }

  return data;
}

async function sendSms({ to, message, from = process.env.TERMII_SENDER_ID || 'ThriftLink' }) {
  const recipient = normalizePhoneNumber(to);
  if (!recipient || !hasTermiiConfig()) {
    return { skipped: true };
  }

  return termiiRequest('/sms/send', {
    to: recipient,
    from,
    sms: message,
    type: 'plain',
    channel: 'generic',
    api_key: process.env.TERMII_API_KEY,
  });
}

async function sendWelcomeSms({ to, name, role }) {
  if (!to) {
    return { skipped: true };
  }

  const label = role === 'vendor' ? 'vendor account' : 'account';
  return sendSms({
    to,
    message: `Hi ${name}, your ThriftLink ${label} is ready. You can now sign in and start using the marketplace.`,
  });
}

module.exports = {
  hasTermiiConfig,
  normalizePhoneNumber,
  sendSms,
  sendWelcomeSms,
};
