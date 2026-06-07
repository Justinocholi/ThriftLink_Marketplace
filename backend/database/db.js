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
  }
  return db;
}

module.exports = { getDb };
