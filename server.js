// server.js — CyberShield Backend Entry Point
// Node.js + Express + SQLite (better-sqlite3)

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// ─── INIT DB (must come before routes that use it) ─────────────────────────────
require('./db/setup');

// ─── ROUTES ────────────────────────────────────────────────────────────────────
const authRoutes  = require('./routes/auth');
const scanRoutes  = require('./routes/scan');
const vaultRoutes = require('./routes/vault');
const chatRoutes  = require('./routes/chat');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // In production, replace with your actual frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Serve static files (your cyber.html) from public folder
app.use(express.static(path.join(__dirname, 'public')));

// ─── API ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/scan',  scanRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/chat',  chatRoutes);
app.use('/api/audit', auditRoutes);

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CyberShield v3.0',
    timestamp: new Date().toISOString()
  });
});

// ─── FALLBACK: Serve cyber.html for any unmatched route ────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START SERVER ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  🛡️  CyberShield Backend Running');
  console.log(`  🚀  Server: http://localhost:${PORT}`);
  console.log(`  💾  Database: SQLite (./db/cybershield.db)`);
  console.log('');
  console.log('  API Endpoints:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/logout');
  console.log('  GET    /api/auth/me');
  console.log('  POST   /api/scan');
  console.log('  GET    /api/scan/history');
  console.log('  GET    /api/vault');
  console.log('  POST   /api/vault');
  console.log('  DELETE /api/vault/:id');
  console.log('  GET    /api/chat');
  console.log('  POST   /api/chat');
  console.log('  DELETE /api/chat');
  console.log('  POST   /api/audit');
  console.log('  GET    /api/audit/history');
  console.log('  GET    /api/audit/stats');
  console.log('');
});