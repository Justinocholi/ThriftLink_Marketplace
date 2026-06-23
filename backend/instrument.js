/**
 * Sentry initialization. Must be required before any HTTP/Express modules.
 * No-ops gracefully when SENTRY_DSN is not set so dev/CI don't need it.
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('[sentry] initialized');
  } catch (err) {
    console.warn('[sentry] failed to initialize:', err.message);
  }
} else {
  // Silent no-op when DSN missing.
}
