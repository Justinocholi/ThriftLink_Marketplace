const { getDataClient, fromDb, fromDbMany, unwrap } = require('../db/supabaseData');

const TABLE = 'subscription_payments';

async function pendingForVendor(vendorId) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from(TABLE).select('*').eq('vendor_id', vendorId).eq('status', 'pending').maybeSingle()
  ));
}

async function historyForVendor(vendorId, limit = 5) {
  const db = getDataClient();
  return fromDbMany(unwrap(
    await db.from(TABLE).select('id,plan,amount,reference,status,review_notes,created_at,reviewed_at')
      .eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(limit)
  ));
}

async function create({ id, vendorId, plan, amount, reference, note }) {
  const db = getDataClient();
  unwrap(
    await db.from(TABLE).insert({ id, vendor_id: vendorId, plan, amount, reference, note: note || null, status: 'pending' })
  );
}

async function adminList({ status } = {}) {
  const db = getDataClient();
  let q = db.from(TABLE).select('*, vendor_profiles(shop_name, users(email,name))').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const data = unwrap(await q);
  return (data || []).map((r) => {
    const vp = r.vendor_profiles;
    const u = vp?.users;
    const { vendor_profiles, ...rest } = r;
    return fromDb({ ...rest, shop_name: vp?.shop_name, vendor_email: u?.email, vendor_name: u?.name });
  });
}

async function getById(id) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).select('*').eq('id', id).maybeSingle()));
}

async function review(id, { reviewedBy, decision, notes }) {
  const db = getDataClient();
  unwrap(await db.from(TABLE).update({
    status: decision, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(),
    review_notes: notes || null, updated_at: new Date().toISOString(),
  }).eq('id', id));
}

module.exports = { pendingForVendor, historyForVendor, create, adminList, getById, review };
