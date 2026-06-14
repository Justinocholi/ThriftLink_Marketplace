const { getDataClient, fromDb, fromDbMany, unwrap } = require('../db/supabaseData');

async function listForVendor(vendorId, { approvedOnly = true, limit } = {}) {
  const db = getDataClient();
  let q = db.from('reviews').select('*, users(name)').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (approvedOnly) q = q.eq('is_approved', true);
  if (limit) q = q.limit(limit);
  const data = unwrap(await q);
  return (data || []).map((r) => { const { users, ...rest } = r; return fromDb({ ...rest, user_name: users?.name }); });
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

module.exports = { listForVendor, create, recalcVendorRating, adminList, setApproved, remove };
