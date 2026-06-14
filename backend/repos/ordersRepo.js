/**
 * ordersRepo — Supabase-backed data access for orders + order_items.
 *
 * The checkout flow needs atomicity (create orders, create items, decrement
 * stock, clear cart, create notifications — all or nothing). PostgREST has
 * no multi-statement transactions, so we delegate the whole flow to a
 * Postgres function `place_order(p_user_id text, p_payload jsonb)` defined
 * in database/postgres-functions.sql. Run that file once in the Supabase
 * SQL Editor before flipping DATA_BACKEND=supabase.
 */

const { getDataClient, fromDb, fromDbMany, unwrap } = require('../db/supabaseData');

async function placeOrder(userId, payload) {
  const db = getDataClient();
  const { data, error } = await db.rpc('place_order', { p_user_id: userId, p_payload: payload });
  if (error) throw error;
  return data; // array of created order ids
}

async function listForUser(userId) {
  const db = getDataClient();
  const orders = unwrap(
    await db.from('orders').select('*, vendor_profiles(shop_name)')
      .eq('user_id', userId).order('created_at', { ascending: false })
  ) || [];
  // Hydrate items per order — small N typically; one round trip per order.
  return Promise.all(orders.map(async (o) => {
    const items = unwrap(
      await db.from('order_items').select('*, products(name,images)').eq('order_id', o.id)
    ) || [];
    const { vendor_profiles, ...rest } = o;
    return fromDb({
      ...rest,
      vendor_name: vendor_profiles?.shop_name,
      items: items.map((it) => ({
        ...it,
        product_name: it.products?.name,
        images: it.products?.images,
      })),
    });
  }));
}

async function getById(id, userId) {
  const db = getDataClient();
  const o = unwrap(
    await db.from('orders').select('*, vendor_profiles(shop_name,whatsapp_number,user_id)').eq('id', id).maybeSingle()
  );
  if (!o) return null;
  // Permission: caller must be the buyer OR the vendor's user.
  if (o.user_id !== userId && o.vendor_profiles?.user_id !== userId) {
    // Caller might be admin; let the route layer decide. Return the row anyway
    // and let the route enforce admin.
  }
  const items = unwrap(
    await db.from('order_items').select('*, products(name,images)').eq('order_id', id)
  ) || [];
  const { vendor_profiles, ...rest } = o;
  return fromDb({
    ...rest,
    vendor_name: vendor_profiles?.shop_name,
    vendor_whatsapp: vendor_profiles?.whatsapp_number,
    vendor_user_id: vendor_profiles?.user_id,
    items: items.map((it) => ({ ...it, product_name: it.products?.name, images: it.products?.images })),
  });
}

async function listForVendor(vendorProfileId) {
  const db = getDataClient();
  const rows = unwrap(
    await db.from('orders').select('*, users(name,email)')
      .eq('vendor_id', vendorProfileId).order('created_at', { ascending: false })
  );
  return (rows || []).map((row) => {
    const { users, ...rest } = row;
    return fromDb({ ...rest, buyer_name: users?.name, buyer_email: users?.email });
  });
}

async function setStatus(id, status) {
  const db = getDataClient();
  unwrap(
    await db.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  );
}

async function getBasic(id) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from('orders').select('*').eq('id', id).maybeSingle()));
}

module.exports = { placeOrder, listForUser, getById, listForVendor, setStatus, getBasic };
