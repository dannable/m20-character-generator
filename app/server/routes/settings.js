const express = require('express');
const db      = require('../db');
const bcrypt  = require('bcryptjs');
const router  = express.Router();

// ── GET /api/settings — current user info + stats ─────────────────────────────
router.get('/', (req, res) => {
  try {
    const user = db.prepare(
      `SELECT id, username, email, role, timezone FROM users WHERE id = ?`
    ).get(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const character_count = db.prepare(
      `SELECT COUNT(*) AS c FROM characters WHERE user_id = ?`
    ).get(req.session.userId).c;
    const chronicle_count = db.prepare(
      `SELECT COUNT(*) AS c FROM chronicles WHERE user_id = ?`
    ).get(req.session.userId).c;

    res.json({ ...user, character_count, chronicle_count });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── PUT /api/settings — update timezone ──────────────────────────────────────
router.put('/', (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone) return res.status(400).json({ error: 'Timezone is required' });
    db.prepare(`UPDATE users SET timezone = ? WHERE id = ?`).run(timezone, req.session.userId);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── PUT /api/settings/password — change password ──────────────────────────────
router.put('/password', (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hash = bcrypt.hashSync(new_password, 12);
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, req.session.userId);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── DELETE /api/settings — delete account and all owned data ─────────────────
router.delete('/', (req, res) => {
  try {
    const userId = req.session.userId;
    db.transaction(() => {
      // Tokens & likes for user's characters
      db.prepare(`DELETE FROM share_tokens WHERE character_id IN (SELECT id FROM characters WHERE user_id = ?)`).run(userId);
      db.prepare(`DELETE FROM character_likes WHERE character_id IN (SELECT id FROM characters WHERE user_id = ?)`).run(userId);
      // Password reset tokens
      db.prepare(`DELETE FROM password_reset_tokens WHERE user_id = ?`).run(userId);
      // Chronicles (cascades: chronicle_notes → chronicle_note_shares)
      db.prepare(`DELETE FROM chronicles WHERE user_id = ?`).run(userId);
      // Characters (cascades: chronicle_note_shares received by these chars)
      db.prepare(`DELETE FROM characters WHERE user_id = ?`).run(userId);
      // User
      db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    })();
    req.session.destroy(() => {});
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
