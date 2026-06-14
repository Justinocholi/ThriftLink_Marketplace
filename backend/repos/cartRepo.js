/**
 * cartRepo — Supabase-backed data access for cart_items.
 */

const { getDataClient, fromDbMany, unwrap } = require('../db/supabaseData');

const TABLE = 'cart_items';

async function listForUser(userId) {
  const db = getDataClient();
  const data = unwrap(
    await db.from(TABLE).select(
      `*, products(id,name,price,images,stock_quantity,vendor_id,vendor_profiles(shop_name,whatsapp_number))`
    ).eq('user_id', userId).order('created_at', { ascending: false })
  );
  return (data || []).map((row) => {
    const p = row.products;
    return {
      id: row.id, user_id: row.user_id, product_id: row.product_id, quantity: row.quantity,
      product_name: p?.name,
      price: p?.price,
      images: p?.images,
      stock_quantity: p?.stock_quantity,
      vendor_id: p?.vendor_id,
      vendor_name: p?.vendor_profiles?.shop_name,
      vendor_whatsapp: p?.vendor_profiles?.whatsapp_number,
    };
  });
}

async function upsert(row) {
  const db = getDataClient();
  // The schema has UNIQUE(user_id, product_id). Use onConflict to upsert.
  return unwrap(
    await db.from(TABLE).upsert(row, { onConflict: 'user_id,product_id' }).select().maybeSingle()
  );
}

async function updateQuantity(id, userId, quantity) {
  const db = getDataClient();
  return unwrap(
    await db.from(TABLE).update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId).select().maybeSingle()
  );
}

async function remove(id, userId) {
  const db = getDataClient();
  unwrap(await db.from(TABLE).delete().eq('id', id).eq('user_id', userId));
}

async function clearForUser(userId) {
  const db = getDataClient();
  unwrap(await db.from(TABLE).delete().eq('user_id', userId));
}

module.exports = { listForUser, upsert, updateQuantity, remove, clearForUser };
