const { getDataClient, fromDb, fromDbMany, unwrap } = require('../db/supabaseData');

async function create({ id, reporterId, targetType, targetId, reason, details }) {
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from('reports').insert({
      id, reporter_id: reporterId, target_type: targetType, target_id: targetId,
      reason, details: details || null, status: 'pending',
    }).select().maybeSingle()
  ));
}

async function adminList({ status } = {}) {
  const db = getDataClient();
  let q = db.from('reports').select('*, users:reporter_id(name,email)').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const data = unwrap(await q);
  return (data || []).map((r) => { const { users, ...rest } = r; return fromDb({ ...rest, reporter_name: users?.name, reporter_email: users?.email }); });
}

async function setStatus(id, status) {
  const db = getDataClient();
  unwrap(await db.from('reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id));
}

module.exports = { create, adminList, setStatus };
