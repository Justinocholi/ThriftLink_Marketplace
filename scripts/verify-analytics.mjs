/**
 * Verifies the PostHog analytics module fires the expected events with the
 * expected properties when buttons, forms, links, and scroll happen.
 *
 * Runs jsdom + a posthog stub so we can assert without sending real network
 * traffic. Use this in dev to prove the wiring before pointing at a real key.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  `<!doctype html><html><body>
    <button id="cta">Place Order</button>
    <button aria-label="Close">×</button>
    <a id="local-link" href="/cart">Open cart</a>
    <a id="external-link" href="https://wa.me/2348011110000">Chat on WhatsApp</a>
    <form id="checkout-form" action="/checkout">
      <input name="email" /><input name="phone" />
      <button type="submit">Place Order</button>
    </form>
  </body></html>`,
  { url: 'http://localhost:5173/checkout', pretendToBeVisual: true }
);

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;

// Stub Vite's import.meta.env so the module reads our test key.
const env = { VITE_POSTHOG_KEY: 'phc_TEST_KEY_NOT_REAL', DEV: true };
const meta = { env };

// Capture what posthog.capture(...) is called with.
const captures = [];
const stub = {
  init: () => {},
  capture: (name, props) => captures.push({ name, props }),
  identify: () => {},
  reset: () => {},
};

// Vite's import.meta.env can't be used in plain Node, and we want to stub
// posthog-js without sending real network traffic. Transform the source so
// both substitutions are inlined, then dynamic-import the result.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const original = readFileSync(path.join(__dirname, '..', 'src/analytics/posthog.js'), 'utf8');
const transformed = original
  .replace(/import\s+posthog\s+from\s+['"]posthog-js['"];?/, 'const posthog = globalThis.__posthogStub;')
  .replace(/import\.meta\.env/g, '__TEST_ENV__');
const shimPath = path.join(__dirname, '..', '.tmp/posthog-shim.mjs');
mkdirSync(path.dirname(shimPath), { recursive: true });
writeFileSync(
  shimPath,
  `const __TEST_ENV__ = ${JSON.stringify(env)};\n${transformed}`
);
globalThis.__posthogStub = stub;
const mod = await import(shimPath + '?v=' + Date.now());
void meta;

// Init analytics → wires the listeners onto document/window.
mod.initAnalytics();

// --- Simulate user interactions ------------------------------------------
captures.length = 0;
document.getElementById('cta').click();
document.querySelector('button[aria-label="Close"]').click();
document.getElementById('local-link').click();
document.getElementById('external-link').click();
const form = document.getElementById('checkout-form');
form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

// --- Scroll milestones ----------------------------------------------------
Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', { value: 4000, configurable: true });
Object.defineProperty(dom.window.document.documentElement, 'clientHeight', { value: 800, configurable: true });
function scrollTo(y) {
  dom.window.scrollY = y;
  Object.defineProperty(dom.window.document.documentElement, 'scrollTop', { value: y, configurable: true });
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
}
// scrollable = scrollHeight (4000) - viewport (window.innerHeight, varies),
// so scroll well past each milestone to make the math robust to any jsdom default.
scrollTo(900);    // 25%
scrollTo(1700);   // 50%
scrollTo(2500);   // 75%
scrollTo(4000);   // 100%
scrollTo(4000);   // dedupe — should NOT re-fire

// --- Assert ---------------------------------------------------------------
function expect(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? '✓' : '✗'} ${label}: ${ok ? 'OK' : `expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`}`);
  if (!ok) process.exitCode = 1;
}
const names = captures.map((c) => c.name);
// Only count clicks we actually dispatch (cta + close). The form `submit`
// dispatch doesn't trigger a click event on the submit button.
expect(names.filter((n) => n === 'button_clicked').length, 2, '2 button_clicked (cta + close)');
expect(names.filter((n) => n === 'link_clicked').length, 1, '1 link_clicked (internal /cart)');
expect(names.filter((n) => n === 'outbound_link_clicked').length, 1, '1 outbound_link_clicked (wa.me)');
expect(names.filter((n) => n === 'form_submitted').length, 1, '1 form_submitted');
const scrolls = captures.filter((c) => c.name === 'scroll_depth_reached').map((c) => c.props.depth_pct);
expect(scrolls, [25, 50, 75, 100], 'scroll milestones fire once each in order');

const cta = captures.find((c) => c.name === 'button_clicked' && c.props.button_text === 'Place Order');
expect(cta?.props?.button_id, 'cta', 'button_clicked captures button_text + button_id');

const closeBtn = captures.find((c) => c.props?.button_aria_label === 'Close');
expect(Boolean(closeBtn), true, 'button without visible text falls back to aria-label');

const outbound = captures.find((c) => c.name === 'outbound_link_clicked');
expect(outbound?.props?.href, 'https://wa.me/2348011110000', 'outbound link captures full href');

const formEvt = captures.find((c) => c.name === 'form_submitted');
expect(formEvt?.props?.form_id, 'checkout-form', 'form_submitted captures form_id');

console.log(`\nTotal captures: ${captures.length}`);
if (!process.exitCode) console.log('\n✅ Analytics wiring verified.');
