// Jest setup. Force SQLite mode so tests are hermetic (no live Supabase
// dependency) and supply a strong JWT secret so the production guard is
// happy if a test imports server.js.
process.env.DATA_BACKEND = 'sqlite';
process.env.JWT_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET
    : 'test-jwt-secret-0123456789abcdef0123456789abcdef0123456789';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Use a fresh, ephemeral SQLite file per test run so we don't trample dev data.
const path = require('path');
const fs = require('fs');
const tmpDir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const dbFile = path.join(tmpDir, `jest-${process.pid}.db`);
try { fs.unlinkSync(dbFile); } catch {}
process.env.SQLITE_DB_PATH = dbFile;
