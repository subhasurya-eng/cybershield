const express = require('express');
const router = express.Router();
const db = require('../db/setup');
const auth = require('../middleware/auth');

// GET /api/chat
router.get('/', auth, async (req, res) => {
  try {
    const messages = await db.allAsync('SELECT id, role, message, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 50', [req.user.id]);
    res.json({ messages });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/chat
router.post('/', auth, async (req, res) => {
  try {
    const { role, message } = req.body;
    if (!role || !message) return res.status(400).json({ message: 'role and message required.' });
    const result = await db.runAsync('INSERT INTO chat_messages (user_id, role, message) VALUES (?, ?, ?)', [req.user.id, role, message]);
    res.status(201).json({ id: result.lastID });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/chat
router.delete('/', auth, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM chat_messages WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Chat cleared.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;