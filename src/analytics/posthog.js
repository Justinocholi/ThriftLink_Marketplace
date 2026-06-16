/**
 * PostHog analytics — single entry point.
 *
 * Configure via Vite env vars (root .env, .env.local, or host env):
 *   VITE_POSTHOG_KEY        Project API key (phc_…)
 *   VITE_POSTHOG_HOST       Optional, defaults to https://us.i.posthog.com
 *
 * Without VITE_POSTHOG_KEY this module no-ops (calls are safe; nothing is sent).
 *
 * Event names follow PostHog convention (past-tense, snake_case):
 *   - $pageview               (autocapture + manual on SPA route change)
 *   - button_clicked          (any <button> or role=button)
 *   - link_clicked            (internal <a>)
 *   - outbound_link_clicked   (cross-origin <a>)
 *   - form_submitted          (any <form>)
 *   - scroll_depth_reached    (one per 25/50/75/100% milestone, per page)
 */

import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;
let listenersAttached = false;

export function isAnalyticsEnabled() {
  return Boolean(KEY) && initialized;
}

export function initAnalytics() {
  if (initialized) return;
  if (!KEY) {

    console.info('[analytics] VITE_POSTHOG_KEY not set — PostHog disabled');
    return;
  }
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,    // PostHog handles the initial pageview
    capture_pageleave: true,   // and time-on-page
    autocapture: true,         // baseline clicks/inputs/forms (we layer our own on top)
    persistence: 'localStorage+cookie',
    person_profiles: 'identified_only',
  });
  initialized = true;
  attachListeners();
}

/**
 * Capture a custom event. Safe to call whether or not PostHog is initialized.
 * Always adds page + url so the dashboard can slice by route.
 */
export function trackEvent(name, properties = {}) {
  const enriched = {
    page: typeof window !== 'undefined' ? window.location.pathname : null,
    url: typeof window !== 'undefined' ? window.location.href : null,
    ...properties,
  };
  if (initialized) posthog.capture(name, enriched);
  // In dev (no key), surface what would have been sent so we can verify shape.
  if (!initialized && import.meta.env.DEV) {

    console.log('[analytics:dry-run]', name, enriched);
  }
}

export function identifyUser(user) {
  if (!initialized || !user?.id) return;
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

export function resetUser() {
  if (initialized) posthog.reset();
}

/**
 * Manual pageview, used by <PageviewTracker /> on SPA route change so client-
 * side navigation isn't missed (PostHog's autocapture only catches the initial
 * load). Also resets per-page scroll-depth state.
 */
export function trackPageview() {
  resetScrollState();
  if (initialized) posthog.capture('$pageview');
  if (!initialized && import.meta.env.DEV) {

    console.log('[analytics:dry-run] $pageview', window.location.pathname);
  }
}

// ---------------------------------------------------------------------------
// Auto-listeners
// ---------------------------------------------------------------------------

const scrollMilestones = [25, 50, 75, 100];
let scrollFiredFor = new Set();

function resetScrollState() {
  scrollFiredFor = new Set();
}

function getScrollDepthPct() {
  const docEl = document.documentElement;
  const scrollTop = window.scrollY || docEl.scrollTop || 0;
  const viewport = window.innerHeight || docEl.clientHeight || 0;
  const total = docEl.scrollHeight || 0;
  const scrollable = Math.max(total - viewport, 1);
  return Math.min(100, Math.round((scrollTop / scrollable) * 100));
}

function onScroll() {
  const pct = getScrollDepthPct();
  for (const m of scrollMilestones) {
    if (pct >= m && !scrollFiredFor.has(m)) {
      scrollFiredFor.add(m);
      trackEvent('scroll_depth_reached', { depth_pct: m });
    }
  }
}

function findInteractive(el, selector) {
  // Walks up from the click target to find the matched element (so a click on
  // <button><svg/></button> still attributes to the button).
  let cur = el;
  while (cur && cur !== document.body) {
    if (cur.matches && cur.matches(selector)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function visibleText(el) {
  return (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isOutbound(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (!/^https?:$/.test(url.protocol)) return false; // mailto:, tel:, etc.
    return url.host !== window.location.host;
  } catch {
    return false;
  }
}

function onClick(e) {
  // Buttons (real <button> or role="button")
  const button = findInteractive(e.target, 'button, [role="button"]');
  if (button) {
    trackEvent('button_clicked', {
      button_text: visibleText(button) || null,
      button_id: button.id || null,
      button_name: button.getAttribute('name') || null,
      button_aria_label: button.getAttribute('aria-label') || null,
      button_type: button.getAttribute('type') || null,
    });
    return;
  }
  // Links
  const a = findInteractive(e.target, 'a[href]');
  if (a) {
    const outbound = isOutbound(a);
    trackEvent(outbound ? 'outbound_link_clicked' : 'link_clicked', {
      href: a.href,
      link_text: visibleText(a) || null,
      target: a.target || null,
    });
  }
}

function onSubmit(e) {
  const form = e.target;
  if (!form || form.tagName !== 'FORM') return;
  trackEvent('form_submitted', {
    form_id: form.id || null,
    form_name: form.getAttribute('name') || null,
    form_action: form.getAttribute('action') || null,
    field_count: form.elements?.length ?? null,
  });
}

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  // `capture: true` so we observe events even when stopPropagation is used.
  document.addEventListener('click', onClick, { capture: true });
  document.addEventListener('submit', onSubmit, { capture: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  listenersAttached = true;
}

// Expose for the React-Router pageview component.
export { posthog };
