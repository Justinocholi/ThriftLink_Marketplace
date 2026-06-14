const { getDataClient, fromDbMany, unwrap } = require('../db/supabaseData');

async function listForUser(userId) {
  const db = getDataClient();
  return fromDbMany(unwrap(
    await db.from('saved_items').select('*, products(id,name,price,images), vendor_profiles(id,shop_name,logo)')
      .eq('user_id', userId).order('created_at', { ascending: false })
  ));
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
