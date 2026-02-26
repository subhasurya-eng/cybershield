const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/setup');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const existing = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await db.runAsync('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed]);

    res.status(201).json({ message: 'Account created successfully.', userId: result.lastID });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

    const logResult = await db.runAsync('INSERT INTO login_logs (user_id) VALUES (?)', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful.', token, loginLogId: logResult.lastID, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    const { loginLogId } = req.body;
    if (loginLogId) await db.runAsync("UPDATE login_logs SET logged_out = datetime('now') WHERE id = ? AND user_id = ?", [loginLogId, req.user.id]);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during logout.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await db.getAsync('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
});

module.exports = router;