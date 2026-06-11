const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'thriftlink.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function safeAddColumn(database, table, column, ddl) {
  const cols = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    try {
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    } catch (err) {
      // Column may have been added concurrently; ignore.
      console.warn(`Failed to add ${table}.${column}:`, err.message);
    }
  }
}

function ensureIndexes(database) {
  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_user_id
    ON users(supabase_user_id)
    WHERE supabase_user_id IS NOT NULL;
  `);
}

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);

    // Idempotent migrations for older DBs.
    safeAddColumn(db, 'messages', 'image_url', 'image_url TEXT');
    safeAddColumn(db, 'messages', 'read_at', 'read_at TEXT');
    safeAddColumn(db, 'users', 'last_seen_at', 'last_seen_at TEXT');
    safeAddColumn(db, 'users', 'supabase_user_id', 'supabase_user_id TEXT');

    safeAddColumn(db, 'vendor_profiles', 'nin', 'nin TEXT');
    safeAddColumn(db, 'vendor_profiles', 'bvn', 'bvn TEXT');
    safeAddColumn(db, 'vendor_profiles', 'business_name', 'business_name TEXT');
    safeAddColumn(db, 'vendor_profiles', 'business_address', 'business_address TEXT');
    safeAddColumn(db, 'vendor_profiles', 'business_registration_number', 'business_registration_number TEXT');
    safeAddColumn(db, 'vendor_profiles', 'id_document_type', 'id_document_type TEXT');
    safeAddColumn(db, 'vendor_profiles', 'id_document_url', 'id_document_url TEXT');
    safeAddColumn(db, 'vendor_profiles', 'kyc_submitted_at', 'kyc_submitted_at TEXT');
    safeAddColumn(db, 'vendor_profiles', 'kyc_reviewed_at', 'kyc_reviewed_at TEXT');
    safeAddColumn(db, 'vendor_profiles', 'kyc_review_notes', 'kyc_review_notes TEXT');

    safeAddColumn(db, 'orders', 'payment_reference', 'payment_reference TEXT');
    safeAddColumn(db, 'orders', 'payment_confirmed_at', 'payment_confirmed_at TEXT');
    safeAddColumn(db, 'orders', 'payment_confirmed_by', 'payment_confirmed_by TEXT');

    safeAddColumn(db, 'users', 'reset_token_hash', 'reset_token_hash TEXT');
    safeAddColumn(db, 'users', 'reset_token_expires_at', 'reset_token_expires_at TEXT');

    ensureIndexes(db);
  }
  return db;
}

module.exports = { getDb };
