/**
 * usersRepo — Supabase-backed data access for users.
 * Part of the #10 migration. Mirrors the queries in routes/auth.js,
 * routes/users.js, and the auth middleware.
 */

const { getDataClient, fromDb, toDb, unwrap } = require('../db/supabaseData');

const TABLE = 'users';

async function getById(id) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).select('*').eq('id', id).maybeSingle()));
}

async function getByEmail(email) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).select('*').eq('email', email).maybeSingle()));
}

async function getBySupabaseUserId(sid) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).select('*').eq('supabase_user_id', sid).maybeSingle()));
}

async function create(row) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).insert(toDb(row)).select().maybeSingle()));
}

async function update(id, patch) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from(TABLE).update(toDb({ ...patch, updated_at: new Date().toISOString() })).eq('id', id).select().maybeSingle()
  ));
}

async function setLastSeen(id) {
  const db = getDataClient();
  await db.from(TABLE).update({ last_seen_at: new Date().toISOString() }).eq('id', id);
}

async function setResetToken(id, tokenHash, expiresAt) {
  const db = getDataClient();
  unwrap(
    await db.from(TABLE).update({ reset_token_hash: tokenHash, reset_token_expires_at: expiresAt }).eq('id', id)
  );
}

async function clearResetToken(id, password_hash) {
  const db = getDataClient();
  unwrap(
    await db.from(TABLE).update({
      password_hash,
      reset_token_hash: null,
      reset_token_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  );
}

// User search for chat. Excludes admins, the caller, inactives.
async function search({ q, role, excludeUserId, limit = 20 }) {
  const db = getDataClient();
  // Pull user rows; embed vendor_profiles to surface shop_name + is_verified.
  let qb = db
    .from(TABLE)
    .select('id,name,avatar,role,state,city,last_seen_at,vendor_profiles(shop_name,is_verified)')
    .eq('is_active', true)
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (excludeUserId) qb = qb.neq('id', excludeUserId);
  if (role && ['user', 'vendor'].includes(role)) qb = qb.eq('role', role);
  else qb = qb.in('role', ['user', 'vendor']);

  const data = unwrap(await qb);
  return (data || []).map((row) => {
    const vp = Array.isArray(row.vendor_profiles) ? row.vendor_profiles[0] : row.vendor_profiles;
    return {
      id: row.id, name: row.name, avatar: row.avatar, role: row.role,
      state: row.state, city: row.city, last_seen_at: row.last_seen_at,
      vendor_shop_name: vp?.shop_name || null,
      vendor_is_verified: vp?.is_verified ? 1 : 0,
    };
  });
}

// Admin list with pagination
async function adminList({ page = 1, limit = 50 } = {}) {
  const db = getDataClient();
  const from = (page - 1) * limit;
  const { data, error, count } = await db
    .from(TABLE).select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return { users: (data || []).map((r) => { const { password_hash, ...safe } = r; return fromDb(safe); }), total: count || 0 };
}

async function activeAdmins() {
  const db = getDataClient();
  return unwrap(await db.from(TABLE).select('id').eq('role', 'admin').eq('is_active', true)) || [];
}

async function setActive(id, isActive) {
  const db = getDataClient();
  unwrap(await db.from(TABLE).update({ is_active: !!isActive, updated_at: new Date().toISOString() }).eq('id', id));
}

module.exports = {
  getById, getByEmail, getBySupabaseUserId, create, update,
  setLastSeen, setResetToken, clearResetToken,
  search, adminList, activeAdmins, setActive,
};
