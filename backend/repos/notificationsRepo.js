const { getDataClient, fromDbMany, unwrap } = require('../db/supabaseData');

async function create({ id, userId, type, title, message, link }) {
  const db = getDataClient();
  unwrap(await db.from('notifications').insert({
    id, user_id: userId, type, title, message, link: link || null,
  }));
}

async function listForUser(userId, { limit = 50 } = {}) {
  const db = getDataClient();
  return fromDbMany(unwrap(
    await db.from('notifications').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(limit)
  ));
}

async function markRead(id, userId) {
  const db = getDataClient();
  unwrap(await db.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId));
}

async function markAllRead(userId) {
  const db = getDataClient();
  unwrap(await db.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false));
}

module.exports = { create, listForUser, markRead, markAllRead };
