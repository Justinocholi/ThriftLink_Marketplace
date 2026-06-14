/**
 * vendorsRepo — Supabase-backed data access for vendor_profiles.
 *
 * Part of the #10 migration. Mirrors the queries currently in routes/vendors.js
 * but async + PostgREST. Not yet wired into routes (atomic cutover pending).
 */

const { getDataClient, fromDb, fromDbMany, toDb, unwrap } = require('../db/supabaseData');

const TABLE = 'vendor_profiles';

// Public list of verified vendors, featured-first then by rating.
// Mirrors GET /api/vendors ordering.
async function listVerified({ state, category, search, featured, limit = 20, page = 1 } = {}) {
  const db = getDataClient();
  let q = db
    .from(TABLE)
    .select('*, users(name,email)', { count: 'exact' })
    .eq('is_verified', true);

  if (featured) q = q.eq('is_featured', true);
  if (state) q = q.eq('state', state);
  if (category) q = q.eq('category', category);
  if (search) q = q.or(`shop_name.ilike.%${search}%,description.ilike.%${search}%`);

  // Featured first (desc), then rating desc, then views desc.
  // PostgREST sorts nulls last by default for desc.
  q = q
    .order('is_featured', { ascending: false })
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('rating', { ascending: false })
    .order('profile_views', { ascending: false });

  const from = (page - 1) * limit;
  q = q.range(from, from + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  // Flatten the embedded user into owner_name/owner_email like the SQL JOIN did.
  const vendors = (data || []).map((row) => {
    const { users, ...rest } = row;
    return fromDb({ ...rest, owner_name: users?.name || null, owner_email: users?.email || null });
  });

  return { vendors, total: count || 0, page, pages: Math.ceil((count || 0) / limit) };
}

async function getById(id) {
  const db = getDataClient();
  const data = unwrap(await db.from(TABLE).select('*').eq('id', id).maybeSingle());
  return fromDb(data);
}

async function getByUserId(userId) {
  const db = getDataClient();
  const data = unwrap(await db.from(TABLE).select('*').eq('user_id', userId).maybeSingle());
  return fromDb(data);
}

async function setFeatured(id, isFeatured, rank) {
  const db = getDataClient();
  const data = unwrap(
    await db
      .from(TABLE)
      .update(toDb({ is_featured: isFeatured ? 1 : 0, featured_rank: isFeatured ? rank : null, updated_at: new Date().toISOString() }))
      .eq('id', id)
      .select()
      .maybeSingle()
  );
  return fromDb(data);
}

module.exports = { listVerified, getById, getByUserId, setFeatured };
