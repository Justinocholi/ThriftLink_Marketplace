/**
 * productsRepo — Supabase-backed data access for products.
 * Mirrors routes/products.js (public search) and the vendor-side CRUD in
 * routes/vendors.js (me/products).
 */

const { getDataClient, fromDb, fromDbMany, toDb, unwrap } = require('../db/supabaseData');

const TABLE = 'products';

// Public search. Mirrors GET /api/products with the same validated filters.
async function search(q) {
  const db = getDataClient();
  // Embed vendor_profiles for vendor_name/state/city/is_verified/rating.
  let query = db
    .from(TABLE)
    .select(
      `*, vendor_profiles!inner(id,shop_name,whatsapp_number,rating,state,city,is_verified,logo,description)`,
      { count: 'exact' }
    )
    .eq('is_available', true);

  if (q.verified_only) query = query.eq('vendor_profiles.is_verified', true);
  if (q.search) {
    // OR across name/description/category. PostgREST `.or` only accepts a
    // single comma-separated string; ilike is case-insensitive.
    const s = q.search.replace(/,/g, ' ');
    query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`);
  }
  if (q.category) query = query.eq('category', q.category);
  if (q.condition) query = query.eq('condition', q.condition);
  if (q.min_price !== undefined) query = query.gte('price', q.min_price);
  if (q.max_price !== undefined) query = query.lte('price', q.max_price);
  if (q.state) query = query.eq('vendor_profiles.state', q.state);
  if (q.city) query = query.eq('vendor_profiles.city', q.city);

  switch (q.sort) {
    case 'price_low': query = query.order('price', { ascending: true }); break;
    case 'price_high': query = query.order('price', { ascending: false }); break;
    case 'popular': query = query.order('views', { ascending: false }); break;
    case 'rating': query = query.order('rating', { foreignTable: 'vendor_profiles', ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const from = (q.page - 1) * q.limit;
  query = query.range(from, from + q.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const products = (data || []).map((row) => {
    const vp = row.vendor_profiles;
    const { vendor_profiles, ...rest } = row;
    return fromDb({
      ...rest,
      vendor_name: vp?.shop_name,
      vendor_profile_id: vp?.id,
      whatsapp_number: vp?.whatsapp_number,
      vendor_rating: vp?.rating,
      vendor_state: vp?.state,
      vendor_city: vp?.city,
      is_verified: vp?.is_verified ? 1 : 0,
    });
  });

  return { products, total: count || 0, page: q.page, pages: Math.ceil((count || 0) / q.limit) };
}

async function categoriesList() {
  const db = getDataClient();
  // PostgREST has no GROUP BY; pull names client-side. Volume is small.
  const data = unwrap(await db.from(TABLE).select('category').eq('is_available', true));
  const counts = new Map();
  for (const row of data || []) {
    if (!row.category) continue;
    counts.set(row.category, (counts.get(row.category) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

async function getById(id) {
  const db = getDataClient();
  // Embed full vendor info to mirror the JOIN used by the old route.
  const row = unwrap(
    await db.from(TABLE).select(
      `*, vendor_profiles(id,shop_name,whatsapp_number,rating,description,is_verified,state,city,logo,user_id)`
    ).eq('id', id).maybeSingle()
  );
  if (!row) return null;
  const vp = row.vendor_profiles;
  const { vendor_profiles, ...rest } = row;
  return fromDb({
    ...rest,
    vendor_name: vp?.shop_name,
    vendor_profile_id: vp?.id,
    vendor_user_id: vp?.user_id,
    whatsapp_number: vp?.whatsapp_number,
    vendor_rating: vp?.rating,
    vendor_description: vp?.description,
    is_verified: vp?.is_verified ? 1 : 0,
    vendor_state: vp?.state,
    vendor_city: vp?.city,
    vendor_logo: vp?.logo,
  });
}

async function listByVendor(vendorId, { availableOnly = false, excludeId, limit } = {}) {
  const db = getDataClient();
  let q = db.from(TABLE).select('*').eq('vendor_id', vendorId);
  if (availableOnly) q = q.eq('is_available', true);
  if (excludeId) q = q.neq('id', excludeId);
  if (limit) q = q.limit(limit);
  return fromDbMany(unwrap(await q));
}

async function create(row) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).insert(toDb(row)).select().maybeSingle()));
}

async function update(id, vendorId, patch) {
  const db = getDataClient();
  const row = fromDb(unwrap(
    await db.from(TABLE).update(toDb({ ...patch, updated_at: new Date().toISOString() }))
      .eq('id', id).eq('vendor_id', vendorId).select().maybeSingle()
  ));
  return row;
}

async function remove(id, vendorId) {
  const db = getDataClient();
  unwrap(await db.from(TABLE).delete().eq('id', id).eq('vendor_id', vendorId));
}

async function incrementViews(id) {
  // PostgREST has no atomic UPDATE x = x + 1 without an RPC; race is acceptable
  // for a view counter. Read-then-write.
  const db = getDataClient();
  const row = unwrap(await db.from(TABLE).select('views').eq('id', id).maybeSingle());
  if (!row) return;
  await db.from(TABLE).update({ views: (row.views || 0) + 1 }).eq('id', id);
}

async function adminRemove(id) {
  const db = getDataClient();
  unwrap(await db.from(TABLE).delete().eq('id', id));
}

module.exports = {
  search, categoriesList, getById, listByVendor,
  create, update, remove, incrementViews, adminRemove,
};
