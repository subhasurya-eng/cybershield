// test.js — Run this to test if database saving works
// Usage: node test.js

require('dotenv').config();
const db = require('./db/setup');

console.log('\n🔍 Running CyberShield Database Test...\n');

// Wait for DB to initialize
setTimeout(async () => {
  try {

    // TEST 1: Insert a user
    console.log('TEST 1: Creating test user...');
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);
    
    // Delete existing test user first
    await db.runAsync('DELETE FROM users WHERE email = ?', ['dbtest@test.com']);
    
    const userResult = await db.runAsync(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      ['DB Test User', 'dbtest@test.com', hashed]
    );
    console.log('✅ User created! ID:', userResult.lastID);

    // TEST 2: Read the user back
    console.log('\nTEST 2: Reading user from database...');
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', ['dbtest@test.com']);
    console.log('✅ User found:', user.name, '|', user.email, '| created:', user.created_at);

    // TEST 3: Insert a scan
    console.log('\nTEST 3: Saving a scan...');
    const scanResult = await db.runAsync(
      'INSERT INTO scans (user_id, url, risk_level, risk_score, anomalies, warnings, entropy) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, 'http://suspicious-site.com', 'High', 75, '["Raw IP"]', '["Long URL"]', 3.45]
    );
    console.log('✅ Scan saved! ID:', scanResult.lastID);

    // TEST 4: Insert a vault record
    console.log('\nTEST 4: Saving vault record...');
    await db.runAsync(
      "INSERT INTO vault_records (user_id, category, record_type, url, score) VALUES (?, 'scan', 'URL Scan', ?, ?)",
      [user.id, 'http://suspicious-site.com', '75 / High']
    );
    console.log('✅ Vault record saved!');

    // TEST 5: Read all tables
    console.log('\nTEST 5: Counting all records...');
    const users    = await db.getAsync('SELECT COUNT(*) as c FROM users');
    const scans    = await db.getAsync('SELECT COUNT(*) as c FROM scans');
    const vault    = await db.getAsync('SELECT COUNT(*) as c FROM vault_records');
    const chats    = await db.getAsync('SELECT COUNT(*) as c FROM chat_messages');
    const audits   = await db.getAsync('SELECT COUNT(*) as c FROM audit_results');

    console.log('📊 Database Summary:');
    console.log('   Users:         ', users.c);
    console.log('   Scans:         ', scans.c);
    console.log('   Vault Records: ', vault.c);
    console.log('   Chat Messages: ', chats.c);
    console.log('   Audit Results: ', audits.c);

    console.log('\n✅ ALL TESTS PASSED — Database is working correctly!');
    console.log('📁 Database file: ./db/cybershield.db');
    console.log('\n👉 Now open DB Browser for SQLite and open:');
    console.log('   C:\\Users\\Sharanya\\OneDrive\\Desktop\\hackathon\\db\\cybershield.db\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error('\nFull error:', err);
    console.log('\n🔧 Possible fixes:');
    console.log('   1. Make sure db/setup.js exists');
    console.log('   2. Make sure node_modules exists (run npm install)');
    console.log('   3. Check your .env file has DB_PATH=./db/cybershield.db');
  }

  process.exit(0);
}, 500);