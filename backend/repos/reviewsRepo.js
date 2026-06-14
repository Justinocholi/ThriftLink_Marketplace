const { getDataClient, fromDb, fromDbMany, unwrap } = require('../db/supabaseData');

async function listForVendor(vendorId, { approvedOnly = true, limit } = {}) {
  const db = getDataClient();
  let q = db.from('reviews').select('*, users(name)').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (approvedOnly) q = q.eq('is_approved', true);
  if (limit) q = q.limit(limit);
  const data = unwrap(await q);
  return (data || []).map((r) => { const { users, ...rest } = r; return fromDb({ ...rest, user_name: users?.name }); });
}

// Public vendor reviews + rating distribution (PostgREST has no aggregates,
// so we pull approved reviews and tally in JS; volume per vendor is small).
async function forVendorPublic(vendorId, { page = 1, limit = 10 } = {}) {
  const db = getDataClient();
  const from = (page - 1) * limit;
  const reviews = unwrap(
    await db.from('reviews').select('*, users(name,avatar)')
      .eq('vendor_id', vendorId).eq('is_approved', true)
      .order('created_at', { ascending: false }).range(from, from + limit - 1)
  ) || [];
  const all = unwrap(
    await db.from('reviews').select('rating').eq('vendor_id', vendorId).eq('is_approved', true)
  ) || [];
  const dist = { five: 0, four: 0, three: 0, two: 0, one: 0 };
  const map = { 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' };
  let sum = 0;
  for (const r of all) { sum += r.rating; if (map[r.rating]) dist[map[r.rating]]++; }
  const total = all.length;
  return {
    reviews: reviews.map((r) => { const { users, ...rest } = r; return fromDb({ ...rest, user_name: users?.name, user_avatar: users?.avatar }); }),
    stats: { avg: total ? sum / total : 0, total, ...dist },
  };
}

async function alreadyReviewed(vendorId, userId) {
  const db = getDataClient();
  const row = unwrap(await db.from('reviews').select('id').eq('vendor_id', vendorId).eq('user_id', userId).maybeSingle());
  return !!row;
}

async function getWithUser(id) {
  const db = getDataClient();
  const r = unwrap(await db.from('reviews').select('*, users(name)').eq('id', id).maybeSingle());
  if (!r) return null;
  const { users, ...rest } = r;
  return fromDb({ ...rest, user_name: users?.name });
}

async function create({ id, vendorId, userId, rating, comment }) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from('reviews').insert({ id, vendor_id: vendorId, user_id: userId, rating, comment }).select().maybeSingle()
  ));
}

async function recalcVendorRating(vendorId) {
  const db = getDataClient();
  const rows = unwrap(await db.from('reviews').select('rating').eq('vendor_id', vendorId).eq('is_approved', true)) || [];
  const total = rows.length;
  const avg = total ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
  await db.from('vendor_profiles').update({ rating: avg, total_reviews: total }).eq('id', vendorId);
}

async function adminList({ status } = {}) {
  const db = getDataClient();
  let q = db.from('reviews').select('*, users(name,email), vendor_profiles(shop_name)').order('created_at', { ascending: false });
  if (status === 'pending') q = q.eq('is_approved', false);
  if (status === 'approved') q = q.eq('is_approved', true);
  const data = unwrap(await q);
  return (data || []).map((r) => {
    const { users, vendor_profiles, ...rest } = r;
    return fromDb({ ...rest, user_name: users?.name, user_email: users?.email, shop_name: vendor_profiles?.shop_name });
  });
}

async function setApproved(id, isApproved) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from('reviews').update({ is_approved: !!isApproved }).eq('id', id).select().maybeSingle()
  ));
}

async function remove(id) {
  const db = getDataClient();
  unwrap(await db.from('reviews').delete().eq('id', id));
}

module.exports = {
  listForVendor, forVendorPublic, alreadyReviewed, getWithUser,
  create, recalcVendorRating, adminList, setApproved, remove,
};
