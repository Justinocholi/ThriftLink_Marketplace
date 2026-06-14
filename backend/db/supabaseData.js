/**
 * Supabase data client (PostgREST) for the #10 migration.
 *
 * This is the data-plane client — distinct from services/supabaseService.js
 * which handles Auth. It uses the service-role key (bypasses RLS) and is the
 * ONLY way this container can reach Supabase (raw Postgres ports are blocked;
 * see MIGRATION.md).
 *
 * Helpers normalize the two schema differences between our SQLite app and the
 * Supabase Postgres schema:
 *   - booleans: Postgres returns true/false; the app historically used 1/0.
 *     `toBoolInt` maps a row's boolean columns back to 1/0 so existing route
 *     code (`row.is_verified === 1`, JSON shapes the frontend expects) keeps
 *     working unchanged.
 *   - timestamps: Postgres returns ISO strings with offset; we pass them
 *     through (the few `+ 'Z'` hacks get removed during route conversion).
 */

const { createClient } = require('@supabase/supabase-js');

let client = null;

function getDataClient() {
  if (client) return client;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase data client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

// Columns that are boolean in Postgres but the app treats as 0/1 integers.
const BOOL_COLUMNS = new Set([
  'is_active', 'is_verified', 'is_featured', 'is_available', 'is_read', 'is_approved',
]);

function boolToInt(v) {
  if (v === true) return 1;
  if (v === false) return 0;
  return v;
}

function intToBool(v) {
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return v;
}

// Normalize a row coming OUT of Supabase so it looks like the old SQLite row
// (boolean columns become 0/1). Mutates a shallow copy.
function fromDb(row) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (BOOL_COLUMNS.has(key)) out[key] = boolToInt(out[key]);
  }
  return out;
}

function fromDbMany(rows) {
  return Array.isArray(rows) ? rows.map(fromDb) : rows;
}

// Normalize a patch going INTO Supabase (0/1 → true/false for boolean cols).
function toDb(patch) {
  if (!patch || typeof patch !== 'object') return patch;
  const out = { ...patch };
  for (const key of Object.keys(out)) {
    if (BOOL_COLUMNS.has(key)) out[key] = intToBool(out[key]);
  }
  return out;
}

// Throw on PostgREST errors so callers can use try/catch like the rest of the app.
function unwrap({ data, error }) {
  if (error) {
    const e = new Error(error.message || 'Supabase query failed');
    e.code = error.code;
    e.details = error.details;
    throw e;
  }
  return data;
}

module.exports = { getDataClient, fromDb, fromDbMany, toDb, unwrap, BOOL_COLUMNS };
