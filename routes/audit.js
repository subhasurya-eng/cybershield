const express = require('express');
const router = express.Router();
const db = require('../db/setup');
const auth = require('../middleware/auth');

// POST /api/audit
router.post('/', auth, async (req, res) => {
  try {
    const { answers, score, grade, summary } = req.body;
    if (score === undefined || !grade) return res.status(400).json({ message: 'score and grade required.' });
    await db.runAsync(
      'INSERT INTO audit_results (user_id, answers, score, grade, summary) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, JSON.stringify(answers || {}), score, grade, summary || null]
    );
    await db.runAsync(
      "INSERT INTO vault_records (user_id, category, record_type, score, raw_data) VALUES (?, 'audit', 'Security Audit', ?, ?)",
      [req.user.id, score + ' / ' + grade, JSON.stringify({ answers, score, grade, summary })]
    );
    res.status(201).json({ message: 'Audit saved.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/audit/history
router.get('/history', auth, async (req, res) => {
  try {
    const audits = await db.allAsync('SELECT id, score, grade, summary, created_at FROM audit_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json({ audits });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/audit/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const scanCount  = await db.getAsync('SELECT COUNT(*) as count FROM scans WHERE user_id = ?', [req.user.id]);
    const auditCount = await db.getAsync('SELECT COUNT(*) as count FROM audit_results WHERE user_id = ?', [req.user.id]);
    const avgRisk    = await db.getAsync('SELECT AVG(risk_score) as avg FROM scans WHERE user_id = ?', [req.user.id]);
    const highRisk   = await db.getAsync("SELECT COUNT(*) as count FROM scans WHERE user_id = ? AND risk_level = 'High'", [req.user.id]);
    const lastAudit  = await db.getAsync('SELECT score, grade, created_at FROM audit_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    res.json({ total_scans: scanCount.count, total_audits: auditCount.count, avg_risk_score: avgRisk.avg ? Math.round(avgRisk.avg) : 0, high_risk_scans: highRisk.count, last_audit: lastAudit || null });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;