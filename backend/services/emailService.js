/**
 * Email Service for Thrift-Link
 *
 * Picks the first available transport:
 *   1. SMTP (nodemailer) if SMTP_HOST is set — works with Gmail, SendGrid, Mailgun, Resend SMTP, etc.
 *   2. console fallback for local dev so missing creds never crash the app.
 *
 * Password reset emails use Supabase's built-in resetPasswordForEmail (handled in auth.js),
 * which delivers via Supabase's own mailer with no extra config.
 */

const nodemailer = require('nodemailer');

let cachedTransport = null;

function getTransport() {
  if (cachedTransport !== null) return cachedTransport;

  if (process.env.SMTP_HOST) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    return cachedTransport;
  }

  cachedTransport = false;
  return cachedTransport;
}

const sendEmail = async ({ to, subject, text, html }) => {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM || 'Thrift-Link <no-reply@thriftlink.local>';

  if (!transport) {
    console.log('[email:log-only]', { to, subject, text: text?.slice(0, 200) });
    return { success: true, transport: 'log' };
  }

  try {
    const info = await transport.sendMail({ from, to, subject, text, html });
    return { success: true, transport: 'smtp', messageId: info.messageId };
  } catch (err) {
    console.error('[email:smtp-error]', err.message);
    return { success: false, transport: 'smtp', error: err.message };
  }
};

const templates = {
  registration: (name) => ({
    subject: 'Welcome to Thrift-Link!',
    text: `Hi ${name},\n\nWelcome to Thrift-Link! You can now browse and buy from verified vendors.\n\n— The Thrift-Link Team`,
    html: `<h1>Welcome to Thrift-Link!</h1><p>Hi ${name},</p><p>Welcome to Thrift-Link! You can now browse and buy from verified vendors.</p>`,
  }),
  orderConfirmation: (orderId, total) => ({
    subject: `Order #${orderId.slice(0, 8)} received`,
    text:
      `Thank you for your order!\n\n` +
      `Order ID: ${orderId.slice(0, 8)}\n` +
      `Total: ₦${Number(total).toLocaleString()}\n\n` +
      `The vendor will reach out to coordinate payment and delivery directly.\n\n— The Thrift-Link Team`,
    html:
      `<h1>Order received</h1>` +
      `<p><strong>Order ID:</strong> ${orderId.slice(0, 8)}<br/>` +
      `<strong>Total:</strong> ₦${Number(total).toLocaleString()}</p>` +
      `<p>The vendor will reach out to coordinate payment and delivery directly.</p>`,
  }),
  subscriptionSubmitted: (name, plan) => ({
    subject: 'Subscription payment received — review in progress',
    text: `Hi ${name},\n\nWe received your transfer reference for the ${plan} plan. Our team will confirm and activate it within 1 business day.\n\n— The Thrift-Link Team`,
    html: `<h1>Subscription payment received</h1><p>Hi ${name},</p><p>We received your transfer reference for the <strong>${plan}</strong> plan. Our team will confirm and activate it within 1 business day.</p>`,
  }),
  subscriptionApproved: (name, plan, expiresAt) => ({
    subject: `Your ${plan} subscription is active`,
    text: `Hi ${name},\n\nYour ${plan} subscription is now active${expiresAt ? ` until ${new Date(expiresAt).toDateString()}` : ''}. Enjoy the upgrade!\n\n— The Thrift-Link Team`,
    html: `<h1>You're upgraded!</h1><p>Hi ${name},</p><p>Your <strong>${plan}</strong> subscription is now active${expiresAt ? ` until <strong>${new Date(expiresAt).toDateString()}</strong>` : ''}.</p>`,
  }),
  subscriptionRejected: (name, plan, reason) => ({
    subject: `${plan} subscription payment needs another look`,
    text: `Hi ${name},\n\nWe couldn't confirm your transfer for the ${plan} plan. Reason: ${reason || 'Not specified'}.\n\nPlease re-check your bank receipt and submit a new reference, or contact support.\n\n— The Thrift-Link Team`,
    html: `<h1>Subscription payment needs another look</h1><p>Hi ${name},</p><p>We couldn't confirm your transfer for the <strong>${plan}</strong> plan.</p><p><strong>Reason:</strong> ${reason || 'Not specified'}</p><p>Please re-check your bank receipt and submit a new reference, or contact support.</p>`,
  }),
  kycSubmitted: (name) => ({
    subject: 'KYC submitted — review in progress',
    text: `Hi ${name},\n\nWe received your KYC submission. Our team will review it within 1–2 business days and email you once your vendor account is verified.\n\n— The Thrift-Link Team`,
    html: `<h1>KYC received</h1><p>Hi ${name},</p><p>We received your KYC submission. Our team will review it within 1–2 business days and email you once your vendor account is verified.</p>`,
  }),
  kycApproved: (name) => ({
    subject: 'Your vendor account is verified',
    text: `Hi ${name},\n\nYour KYC has been approved. Your store is now marked as verified and your listings are visible across the marketplace.\n\n— The Thrift-Link Team`,
    html: `<h1>You're verified!</h1><p>Hi ${name},</p><p>Your KYC has been approved. Your store is now marked as verified and your listings are visible across the marketplace.</p>`,
  }),
  kycRejected: (name, reason) => ({
    subject: 'KYC needs another look',
    text: `Hi ${name},\n\nWe couldn't approve your KYC submission. Reason: ${reason || 'Not specified'}.\n\nPlease re-submit with corrected information.\n\n— The Thrift-Link Team`,
    html: `<h1>KYC needs another look</h1><p>Hi ${name},</p><p>We couldn't approve your KYC submission.</p><p><strong>Reason:</strong> ${reason || 'Not specified'}</p><p>Please re-submit with corrected information.</p>`,
  }),
  passwordReset: (resetUrl) => ({
    subject: 'Reset your Thrift-Link password',
    text: `You requested a password reset. Open this link to set a new password (valid for 1 hour): ${resetUrl}\n\nIf you didn't request this, ignore this email.`,
    html: `<h1>Reset your password</h1><p>You requested a password reset. Click below to set a new password (valid for 1 hour):</p><p><a href="${resetUrl}">Reset password</a></p><p>If you didn't request this, ignore this email.</p>`,
  }),
};

module.exports = { sendEmail, templates };
