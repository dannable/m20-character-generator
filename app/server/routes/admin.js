const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const router  = express.Router();

// Admin-only guard
router.use((req, res, next) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at,
           COUNT(c.id) AS character_count
    FROM users u
    LEFT JOIN characters c ON c.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

// GET /api/admin/users/:id/characters — all characters belonging to a user
router.get('/users/:id/characters', (req, res) => {
  const SUMMARY_COLS = `id, user_id, name, player, chronicle, concept, affiliation,
    tradition, essence, arete, willpower, quintessence, created_at, updated_at`;
  try {
    const userId = parseInt(req.params.id);
    const user = db.prepare(`SELECT id, username FROM users WHERE id = ?`).get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const characters = db.prepare(`SELECT ${SUMMARY_COLS} FROM characters WHERE user_id = ? ORDER BY updated_at DESC`).all(userId);
    res.json({ user, characters });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { is_active, role } = req.body;

  if (id === req.session.userId && is_active === 0) {
    return res.status(400).json({ error: 'Cannot disable your own account' });
  }
  if (id === req.session.userId && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot remove your own admin role' });
  }

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (is_active !== undefined) db.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).run(is_active, id);
  if (role)       db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);

  res.json({ ok: true });
});

// PUT /api/admin/users/:id/password
router.put('/users/:id/password', (req, res) => {
  const id = parseInt(req.params.id);
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, id);
  res.json({ ok: true });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.session.userId) return res.status(400).json({ error: 'Cannot delete your own account' });

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(`DELETE FROM characters WHERE user_id = ?`).run(id);
  db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  res.json({ deleted: true });
});

module.exports = router;
