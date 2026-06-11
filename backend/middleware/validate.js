/**
 * Lightweight request validation helpers — no schema lib needed.
 * Use directly in routes:  const { search } = validateProductQuery(req.query);
 */

function clampInt(value, { min, max, fallback }) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampFloat(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function clampString(value, maxLen) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

const ALLOWED_SORTS = new Set(['newest', 'price_low', 'price_high', 'popular', 'rating']);
const ALLOWED_CONDITIONS = new Set(['new', 'like-new', 'good', 'fair']);

function validateProductQuery(q) {
  const sort = ALLOWED_SORTS.has(q.sort) ? q.sort : 'newest';
  const condition = ALLOWED_CONDITIONS.has(q.condition) ? q.condition : undefined;
  return {
    search: clampString(q.search, 100),
    category: clampString(q.category, 50),
    condition,
    min_price: clampFloat(q.min_price),
    max_price: clampFloat(q.max_price),
    state: clampString(q.state, 50),
    city: clampString(q.city, 50),
    sort,
    page: clampInt(q.page, { min: 1, max: 10000, fallback: 1 }),
    limit: clampInt(q.limit, { min: 1, max: 100, fallback: 24 }),
    verified_only: q.verified_only === 'true',
  };
}

const NIN_RE = /^\d{11}$/;
const BVN_RE = /^\d{11}$/;
const PHONE_RE = /^\+?\d{10,15}$/;

function validateKyc(body) {
  const errors = [];
  const nin = clampString(body.nin, 11);
  if (!nin || !NIN_RE.test(nin)) errors.push('NIN must be 11 digits');

  const bvn = body.bvn ? clampString(body.bvn, 11) : undefined;
  if (bvn && !BVN_RE.test(bvn)) errors.push('BVN must be 11 digits');

  const businessName = clampString(body.business_name, 120);
  if (!businessName) errors.push('Business name is required');

  const businessAddress = clampString(body.business_address, 240);
  if (!businessAddress) errors.push('Business address is required');

  const phone = clampString(body.phone, 16);
  if (phone && !PHONE_RE.test(phone)) errors.push('Phone must be a valid number');

  return {
    errors,
    data: {
      nin,
      bvn,
      business_name: businessName,
      business_address: businessAddress,
      business_registration_number: clampString(body.business_registration_number, 40),
      id_document_type: clampString(body.id_document_type, 30) || 'national_id',
      phone,
    },
  };
}

module.exports = { validateProductQuery, validateKyc, clampString };
