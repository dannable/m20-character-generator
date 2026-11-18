const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/wizard — public. Messages for the speech balloon, plus this user's on/off switch.
// Signed-out visitors (the login screen) get Darrell too.
router.get('/', (req, res) => {
  try {
    let enabled = true;
    if (req.session && req.session.userId) {
      const u = db.prepare(`SELECT wizard_enabled FROM users WHERE id = ?`).get(req.session.userId);
      if (u) enabled = u.wizard_enabled !== 0;
    }
    // Two ready-made lists rather than a category per line, so the client picks
    // one by mode and does nothing else. `messages` keeps its old meaning —
    // what Darrell says normally — so a client loaded before this change still
    // behaves, and a client loaded after it falls back to `messages` when
    // talking to a server that has no `nephandi` field yet.
    //   general   → both lists        pure → messages only
    //   corrupted → nephandi only
    const rows = enabled
      ? db.prepare(`SELECT text, category FROM wizard_messages WHERE enabled = 1 ORDER BY sort_order, id`).all()
      : [];
    const pick = (...cats) => rows.filter(r => cats.includes(r.category || 'general')).map(r => r.text);
    res.json({ enabled, messages: pick('general', 'pure'), nephandi: pick('general', 'corrupted') });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
