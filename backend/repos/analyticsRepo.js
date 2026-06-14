const { getDataClient, unwrap } = require('../db/supabaseData');

async function logEvent({ id, vendorId, eventType, productId }) {
  const db = getDataClient();
  unwrap(await db.from('analytics_events').insert({
    id, vendor_id: vendorId, event_type: eventType, product_id: productId || null,
  }));
}

// Returns dashboard counters used by admin/stats. Backed by the vendor_stats() RPC.
async function adminStats() {
  const db = getDataClient();
  const { data, error } = await db.rpc('vendor_stats');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalVendors: Number(row?.total_vendors || 0),
    pendingVerifications: Number(row?.pending_verifications || 0),
    totalUsers: Number(row?.total_users || 0),
    totalProducts: Number(row?.total_products || 0),
    totalReviews: Number(row?.total_reviews || 0),
    pendingReviews: Number(row?.pending_reviews || 0),
    totalOrders: Number(row?.total_orders || 0),
  };
}

// Vendor's own analytics page — counts by event_type over a window.
async function vendorAnalytics(vendorId, { days = 30 } = {}) {
  const db = getDataClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const events = unwrap(
    await db.from('analytics_events').select('event_type,created_at').eq('vendor_id', vendorId).gte('created_at', since)
  ) || [];
  const counts = { profile_view: 0, whatsapp_click: 0, product_view: 0 };
  for (const e of events) counts[e.event_type] = (counts[e.event_type] || 0) + 1;
  return { range_days: days, ...counts, total_events: events.length };
}

// Dashboard data for GET /api/vendors/me/analytics. PostgREST has no GROUP BY,
// so pull the last-30-days events and tally in JS (per-vendor volume is small).
async function vendorDashboard(vendorId) {
  const db = getDataClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const events = unwrap(
    await db.from('analytics_events').select('event_type,created_at')
      .eq('vendor_id', vendorId).gte('created_at', since)
  ) || [];
  const byType = new Map();
  const byDay = new Map();
  for (const e of events) {
    byType.set(e.event_type, (byType.get(e.event_type) || 0) + 1);
    if (e.event_type === 'profile_view') {
      const day = String(e.created_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
    }
  }
  return {
    last30days: Array.from(byType.entries()).map(([event_type, count]) => ({ event_type, count })),
    dailyViews: Array.from(byDay.entries()).map(([date, views]) => ({ date, views })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

module.exports = { logEvent, adminStats, vendorAnalytics, vendorDashboard };
