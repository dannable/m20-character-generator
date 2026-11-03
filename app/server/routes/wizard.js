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
    const messages = enabled
      ? db.prepare(`SELECT text FROM wizard_messages WHERE enabled = 1 ORDER BY sort_order, id`).all().map(r => r.text)
      : [];
    res.json({ enabled, messages });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
