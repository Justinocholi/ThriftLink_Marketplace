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

async function create(row) {
  const db = getDataClient();
  return fromDb(unwrap(await db.from(TABLE).insert(toDb(row)).select().maybeSingle()));
}

async function update(id, patch) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from(TABLE).update(toDb({ ...patch, updated_at: new Date().toISOString() }))
      .eq('id', id).select().maybeSingle()
  ));
}

async function updateLogo(id, logoUrl) {
  return update(id, { logo: logoUrl });
}

async function submitKyc(id, kycData) {
  return update(id, {
    ...kycData,
    kyc_submitted_at: new Date().toISOString(),
    kyc_reviewed_at: null,
    kyc_review_notes: null,
    verification_status: 'pending',
  });
}

async function reviewKyc(id, decision, notes) {
  return update(id, {
    verification_status: decision,
    is_verified: decision === 'approved' ? 1 : 0,
    kyc_reviewed_at: new Date().toISOString(),
    kyc_review_notes: notes || null,
  });
}

async function getKycForVendor(userId) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from(TABLE).select(
      'verification_status,business_name,business_address,business_registration_number,id_document_type,id_document_url,kyc_submitted_at,kyc_reviewed_at,kyc_review_notes,nin,bvn'
    ).eq('user_id', userId).maybeSingle()
  ));
}

async function incrementWhatsappClicks(id) {
  const db = getDataClient();
  const row = unwrap(await db.from(TABLE).select('whatsapp_clicks').eq('id', id).maybeSingle());
  if (!row) return;
  await db.from(TABLE).update({ whatsapp_clicks: (row.whatsapp_clicks || 0) + 1 }).eq('id', id);
}

async function incrementProfileViews(id) {
  const db = getDataClient();
  const row = unwrap(await db.from(TABLE).select('profile_views').eq('id', id).maybeSingle());
  if (!row) return;
  await db.from(TABLE).update({ profile_views: (row.profile_views || 0) + 1 }).eq('id', id);
}

async function setSubscription(id, plan, expiresAt) {
  return update(id, { subscription_plan: plan, subscription_expires_at: expiresAt });
}

// Admin list with pagination + status filter
async function adminList({ status, page = 1, limit = 20 } = {}) {
  const db = getDataClient();
  let q = db
    .from(TABLE)
    .select('*, users(email,name,phone,created_at)', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (status) q = q.eq('verification_status', status);
  const from = (page - 1) * limit;
  q = q.range(from, from + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  const vendors = (data || []).map((row) => {
    const { users, ...rest } = row;
    return fromDb({
      ...rest,
      email: users?.email, owner_name: users?.name, phone: users?.phone,
      user_created_at: users?.created_at,
    });
  });
  return { vendors, total: count || 0, page, pages: Math.ceil((count || 0) / limit) };
}

module.exports = {
  listVerified, getById, getByUserId, setFeatured,
  create, update, updateLogo,
  submitKyc, reviewKyc, getKycForVendor,
  incrementWhatsappClicks, incrementProfileViews,
  setSubscription, adminList,
};
