/**
 * messagesRepo — Supabase-backed data access for messages.
 * Uses the conversation_list() Postgres function (PostgREST has no GROUP BY).
 */

const { getDataClient, fromDb, fromDbMany, unwrap } = require('../db/supabaseData');
const { isUuid } = require('../middleware/validate');

// PostgREST `.or()` builds a filter string from interpolated values, so any
// non-UUID input could rewrite the query. Both `userId` (from the JWT) and
// `partnerId` (from the URL) MUST be UUIDs. We hard-fail otherwise.
function assertUuid(name, v) {
  if (!isUuid(v)) {
    const e = new Error(`Invalid ${name}`);
    e.status = 400;
    throw e;
  }
}

async function conversations(userId) {
  const db = getDataClient();
  const { data, error } = await db.rpc('conversation_list', { p_user_id: userId });
  if (error) throw error;
  return (data || []).map((r) => ({ ...r, unread_count: Number(r.unread_count || 0) }));
}

async function thread(userId, partnerId) {
  assertUuid('userId', userId);
  assertUuid('partnerId', partnerId);
  const db = getDataClient();
  const data = unwrap(
    await db.from('messages').select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
  );
  return fromDbMany(data || []);
}

async function markRead(userId, partnerId) {
  assertUuid('userId', userId);
  assertUuid('partnerId', partnerId);
  const db = getDataClient();
  const { data, error } = await db.from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('sender_id', partnerId).eq('receiver_id', userId).eq('is_read', false)
    .select('id');
  if (error) throw error;
  return (data || []).length; // changes count
}

async function getPartner(partnerId) {
  assertUuid('partnerId', partnerId);
  const db = getDataClient();
  return fromDb(unwrap(
    await db.from('users').select('id,name,avatar,last_seen_at').eq('id', partnerId).maybeSingle()
  ));
}

async function send({ id, senderId, receiverId, content, imageUrl }) {
  assertUuid('senderId', senderId);
  assertUuid('receiverId', receiverId);
  const db = getDataClient();
  const row = unwrap(
    await db.from('messages').insert({
      id, sender_id: senderId, receiver_id: receiverId,
      content: content || '', image_url: imageUrl || null,
    }).select().maybeSingle()
  );
  return fromDb(row);
}

module.exports = { conversations, thread, markRead, getPartner, send };
