const {
  validateProductQuery, validateKyc, clampString,
  sanitizePostgrestLike, isUuid,
} = require('../middleware/validate');

describe('validateProductQuery', () => {
  test('clamps page/limit to safe ranges', () => {
    const q = validateProductQuery({ page: '-5', limit: '99999' });
    expect(q.page).toBe(1);
    expect(q.limit).toBe(100);
  });

  test('allowlists sort values, falls back to newest', () => {
    expect(validateProductQuery({ sort: 'newest' }).sort).toBe('newest');
    expect(validateProductQuery({ sort: 'price_low' }).sort).toBe('price_low');
    expect(validateProductQuery({ sort: 'DROP TABLE products' }).sort).toBe('newest');
  });

  test('allowlists condition values', () => {
    expect(validateProductQuery({ condition: 'good' }).condition).toBe('good');
    expect(validateProductQuery({ condition: 'pristine' }).condition).toBeUndefined();
  });

  test('drops non-numeric prices', () => {
    const q = validateProductQuery({ min_price: 'abc', max_price: '500' });
    expect(q.min_price).toBeUndefined();
    expect(q.max_price).toBe(500);
  });
});

describe('validateKyc', () => {
  test('requires 11-digit NIN', () => {
    expect(validateKyc({}).errors).toContain('NIN must be 11 digits');
    expect(validateKyc({ nin: '123' }).errors).toContain('NIN must be 11 digits');
    const ok = validateKyc({ nin: '12345678901', business_name: 'X', business_address: 'Y' });
    expect(ok.errors).toEqual([]);
    expect(ok.data.nin).toBe('12345678901');
  });

  test('rejects non-11-digit BVN when present', () => {
    const r = validateKyc({ nin: '12345678901', bvn: '1', business_name: 'X', business_address: 'Y' });
    expect(r.errors).toContain('BVN must be 11 digits');
  });
});

describe('sanitizePostgrestLike', () => {
  test('strips PostgREST control characters and LIKE wildcards', () => {
    // commas, parens, colons, backslashes, %, _, * all become spaces
    expect(sanitizePostgrestLike('xx,is_available.eq.false'))
      .toBe('xx is available.eq.false');
    expect(sanitizePostgrestLike('and(sender_id.eq.A)')).toBe('and sender id.eq.A');
    expect(sanitizePostgrestLike('a%b_c*d:e\\f')).toBe('a b c d e f');
  });

  test('trims and caps length', () => {
    expect(sanitizePostgrestLike('  hi  ')).toBe('hi');
    expect(sanitizePostgrestLike('x'.repeat(200))).toHaveLength(60);
  });

  test('returns empty string for non-strings', () => {
    expect(sanitizePostgrestLike(null)).toBe('');
    expect(sanitizePostgrestLike(123)).toBe('');
  });
});

describe('isUuid', () => {
  test('accepts canonical UUIDs', () => {
    expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
    expect(isUuid('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
  });
  test('rejects everything else', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('aaa,is_read.eq.true')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(123)).toBe(false);
  });
});

describe('clampString', () => {
  test('trims and caps', () => {
    expect(clampString('  hi  ', 5)).toBe('hi');
    expect(clampString('abcdef', 3)).toBe('abc');
  });
  test('rejects non-strings and empty', () => {
    expect(clampString(null, 10)).toBeUndefined();
    expect(clampString('   ', 10)).toBeUndefined();
  });
});
