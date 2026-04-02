const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const router  = express.Router();

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare(`SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?`).get(req.session.userId);
  if (!user || !user.is_active) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Account not found or disabled' });
  }
  res.json(user);
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username.trim());
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  if (!user.is_active) return res.status(403).json({ error: 'Account has been disabled' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid username or password' });

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Session error' });
    req.session.userId = user.id;
    req.session.role   = user.role;
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (username.trim().length < 2) return res.status(400).json({ error: 'Username must be at least 2 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`)
      .run(username.trim(), email.trim().toLowerCase(), hash);
    const user = db.prepare(`SELECT id, username, email, role FROM users WHERE id = ?`).get(result.lastInsertRowid);
    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Session error' });
      req.session.userId = user.id;
      req.session.role   = user.role;
      res.status(201).json(user);
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already taken' });
    throw err;
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
