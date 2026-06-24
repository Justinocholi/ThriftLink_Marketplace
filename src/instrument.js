/**
 * Sentry init — MUST be the first import in main.jsx so React errors get
 * caught from the start. Configure via Vite env vars (.env.local in dev,
 * host env in prod):
 *
 *   VITE_SENTRY_DSN              Required. Without it Sentry no-ops.
 *   VITE_APP_VERSION             Optional release tag (e.g. "0.1.0").
 *
 * Sampling is conservative by default; bump tracesSampleRate when you want
 * more performance data.
 */
import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance + replay sampling. Sane defaults — adjust on the dashboard
    // once you see real volume.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/.*\.thriftlink\.app$/,
    ],
    replaysSessionSampleRate: 0.0,   // no random session replays
    replaysOnErrorSampleRate: 1.0,   // always replay an errored session
  });
} else {
  console.info('[sentry] VITE_SENTRY_DSN not set — Sentry disabled');
}

export { Sentry };
