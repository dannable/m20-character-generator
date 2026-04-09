const express    = require('express');
const bcrypt     = require('bcryptjs');
const db         = require('../db');
const router     = express.Router();

const BCRYPT_ROUNDS  = 12;
const ALLOWED_ROLES  = new Set(['admin', 'awakened', 'user']);
const EMAIL_RE       = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Admin-only guard
router.use((req, res, next) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// ── Auto-purge ghost accounts ─────────────────────────────────────────────────
// Removes accounts with ≤1 login, 0 characters, created more than 30 days ago.
// Admins are never purged. Called each time the user list is loaded.
function purgeGhostAccounts() {
  const stale = db.prepare(`
    SELECT u.id FROM users u
    LEFT JOIN characters c ON c.user_id = u.id
    WHERE u.role != 'admin'
      AND u.login_count <= 1
      AND u.created_at <= datetime('now', '-30 days')
    GROUP BY u.id
    HAVING COUNT(c.id) = 0
  `).all();
  if (stale.length === 0) return 0;
  const ids = stale.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM characters WHERE user_id IN (${placeholders})`).run(...ids);
  // role != 'admin' guard is repeated here as a safety net in case of unexpected data
  db.prepare(`DELETE FROM users WHERE id IN (${placeholders}) AND role != 'admin'`).run(...ids);
  return ids.length;
}

// GET /api/admin/users
router.get('/users', (req, res) => {
  const purged = purgeGhostAccounts();
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at,
           u.last_login, u.login_count,
           COUNT(c.id) AS character_count
    FROM users u
    LEFT JOIN characters c ON c.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json({ users, purged });
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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { is_active, role, username, email } = req.body;

  if (id === req.session.userId && is_active === 0) {
    return res.status(400).json({ error: 'Cannot disable your own account' });
  }
  if (id === req.session.userId && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot remove your own admin role' });
  }

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (is_active !== undefined) db.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).run(is_active, id);
  if (role) {
    if (!ALLOWED_ROLES.has(role)) return res.status(400).json({ error: 'Invalid role' });
    db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);
  }

  if (username !== undefined) {
    const trimmed = (username || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Username cannot be empty' });
    const conflict = db.prepare(`SELECT id FROM users WHERE username = ? AND id != ?`).get(trimmed, id);
    if (conflict) return res.status(409).json({ error: 'Username already taken' });
    db.prepare(`UPDATE users SET username = ? WHERE id = ?`).run(trimmed, id);
  }

  if (email !== undefined) {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) return res.status(400).json({ error: 'Invalid email address' });
    const conflict = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(trimmed, id);
    if (conflict) return res.status(409).json({ error: 'Email already in use' });
    db.prepare(`UPDATE users SET email = ? WHERE id = ?`).run(trimmed, id);
  }

  res.json({ ok: true });
});

// PUT /api/admin/users/:id/password
router.put('/users/:id/password', (req, res) => {
  const id = parseInt(req.params.id);
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
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

// GET /api/admin/stats — dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const totals = {
      users:      db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role NOT IN ('guest')`).get().c,
      characters: db.prepare(`SELECT COUNT(*) AS c FROM characters ch JOIN users u ON u.id = ch.user_id WHERE u.role NOT IN ('guest')`).get().c,
      chronicles: db.prepare(`SELECT COUNT(*) AS c FROM chronicles`).get().c,
    };

    const recent_users = db.prepare(`
      SELECT u.id, u.username, u.last_login, u.login_count, u.role,
             COUNT(c.id) AS character_count
      FROM users u
      LEFT JOIN characters c ON c.user_id = u.id
      WHERE u.role != 'guest' AND u.last_login IS NOT NULL
      GROUP BY u.id
      ORDER BY u.last_login DESC
      LIMIT 5
    `).all();

    const recent_chars = db.prepare(`
      SELECT ch.id, ch.name, ch.player, ch.tradition, ch.affiliation, ch.updated_at,
             u.username AS owner_username
      FROM characters ch
      LEFT JOIN users u ON u.id = ch.user_id
      WHERE u.role != 'guest' OR ch.user_id IS NULL
      ORDER BY ch.updated_at DESC
      LIMIT 5
    `).all();

    // Trend: count new items per "week bucket" for the past 8 weeks
    // weeks_ago=0 means created this week, weeks_ago=7 means 7 weeks ago
    const userTrend = db.prepare(`
      SELECT CAST((julianday('now') - julianday(created_at)) / 7 AS INTEGER) AS weeks_ago,
             COUNT(*) AS count
      FROM users
      WHERE created_at >= datetime('now', '-56 days') AND role NOT IN ('guest')
      GROUP BY weeks_ago
    `).all();

    const charTrend = db.prepare(`
      SELECT CAST((julianday('now') - julianday(ch.created_at)) / 7 AS INTEGER) AS weeks_ago,
             COUNT(*) AS count
      FROM characters ch
      JOIN users u ON u.id = ch.user_id
      WHERE ch.created_at >= datetime('now', '-56 days') AND u.role NOT IN ('guest')
      GROUP BY weeks_ago
    `).all();

    const chronTrend = db.prepare(`
      SELECT CAST((julianday('now') - julianday(created_at)) / 7 AS INTEGER) AS weeks_ago,
             COUNT(*) AS count
      FROM chronicles
      WHERE created_at >= datetime('now', '-56 days')
      GROUP BY weeks_ago
    `).all();

    // Convert week-bucket rows into an 8-slot array (index 0 = oldest, index 7 = this week)
    const toArray = rows => {
      const arr = Array(8).fill(0);
      rows.forEach(r => {
        const idx = 7 - Math.min(7, Math.max(0, r.weeks_ago));
        arr[idx] += r.count;
      });
      return arr;
    };

    // Generate display labels for the 8 week buckets (week-start Monday dates)
    const weekLabels = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weekLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    res.json({
      totals,
      recent_users,
      recent_chars,
      trends: {
        labels:     weekLabels,
        users:      toArray(userTrend),
        characters: toArray(charTrend),
        chronicles: toArray(chronTrend),
      },
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
