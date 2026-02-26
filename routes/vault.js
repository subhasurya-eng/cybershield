const express = require('express');
const router = express.Router();
const db = require('../db/setup');
const auth = require('../middleware/auth');

// GET /api/vault
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT id, category, record_type, url, score, created_at FROM vault_records WHERE user_id = ?';
    const params = [req.user.id];
    if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const records = await db.allAsync(sql, params);
    res.json({ records, total: records.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/vault
router.post('/', auth, async (req, res) => {
  try {
    const { category, record_type, url, score, raw_data } = req.body;
    if (!category || !record_type) return res.status(400).json({ message: 'category and record_type are required.' });
    await db.runAsync(
      'INSERT INTO vault_records (user_id, category, record_type, url, score, raw_data) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, category, record_type, url || null, score || null, raw_data ? JSON.stringify(raw_data) : null]
    );
    res.status(201).json({ message: 'Record added.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/vault/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.runAsync('DELETE FROM vault_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
