// db/setup.js — SQLite database using 'sqlite3' package (no Visual Studio needed)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './db/cybershield.db';

// Ensure db directory exists
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Open (or create) the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('❌ Could not open database:', err.message); process.exit(1); }
  console.log('✅ Database connected:', DB_PATH);
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_in TEXT DEFAULT (datetime('now')),
    logged_out TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    risk_level TEXT,
    risk_score INTEGER,
    anomalies TEXT,
    warnings TEXT,
    entropy REAL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vault_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    record_type TEXT,
    url TEXT,
    score TEXT,
    raw_data TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audit_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers TEXT,
    score INTEGER,
    grade TEXT,
    summary TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});

// Promisified helpers
db.getAsync  = (sql, params=[]) => new Promise((res,rej) => db.get(sql, params, (err,row) => err?rej(err):res(row)));
db.allAsync  = (sql, params=[]) => new Promise((res,rej) => db.all(sql, params, (err,rows)=> err?rej(err):res(rows)));
db.runAsync  = (sql, params=[]) => new Promise((res,rej) => db.run(sql, params, function(err){ err?rej(err):res({lastID:this.lastID,changes:this.changes}); }));

module.exports = db;