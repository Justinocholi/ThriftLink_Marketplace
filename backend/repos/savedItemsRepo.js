const { getDataClient, fromDbMany, unwrap } = require('../db/supabaseData');

async function listForUser(userId) {
  const db = getDataClient();
  const rows = unwrap(
    await db.from('saved_items').select('*, products(name,price,images,condition), vendor_profiles(id,shop_name)')
      .eq('user_id', userId).order('created_at', { ascending: false })
  ) || [];
  // Field names mirror routes/users.js SQLite JOIN.
  return rows.map((r) => {
    const p = r.products; const vp = r.vendor_profiles;
    const { products, vendor_profiles, ...rest } = r;
    return {
      ...rest,
      product_name: p?.name, price: p?.price, images: p?.images, condition: p?.condition,
      vendor_name: vp?.shop_name, vendor_profile_id: vp?.id,
    };
  });
}

async function add({ id, userId, productId, vendorId }) {
  const db = getDataClient();
  return unwrap(
    await db.from('saved_items').insert({ id, user_id: userId, product_id: productId || null, vendor_id: vendorId || null }).select().maybeSingle()
  );
}

async function remove(id, userId) {
  const db = getDataClient();
  unwrap(await db.from('saved_items').delete().eq('id', id).eq('user_id', userId));
}

module.exports = { listForUser, add, remove };
