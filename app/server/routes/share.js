const express = require('express');
const router  = express.Router();
const db      = require('../db');
const crypto  = require('crypto');

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
}

const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
  'instruments','freebie_spent','attr_priority','ability_priority','merits','flaws','specialties',
  'customArchetypes','custom_ability_names'];

function parseCharacter(row) {
  if (!row) return null;
  const char = { ...row };
  JSON_FIELDS.forEach(f => {
    if (typeof char[f] === 'string') {
      try { char[f] = JSON.parse(char[f]); } catch { char[f] = f === 'instruments' ? [] : {}; }
    }
  });
  return char;
}

// POST /api/share/:characterId — create (or retrieve existing) share token
router.post('/:characterId', requireAuth, (req, res) => {
  try {
    const char = db.prepare('SELECT id, user_id FROM characters WHERE id = ?').get(req.params.characterId);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && char.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    // Return existing token if one exists (idempotent)
    const existing = db.prepare('SELECT token FROM share_tokens WHERE character_id = ?').get(char.id);
    if (existing) return res.json({ token: existing.token });

    const token = crypto.randomBytes(16).toString('hex');
    db.prepare('INSERT INTO share_tokens (character_id, token) VALUES (?, ?)').run(char.id, token);
    res.json({ token });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/share/:token — public; returns character data + like info
router.get('/:token', (req, res) => {
  try {
    const share = db.prepare('SELECT * FROM share_tokens WHERE token = ?').get(req.params.token);
    if (!share) return res.status(404).json({ error: 'Share link not found' });

    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(share.character_id);
    if (!char) return res.status(404).json({ error: 'Character not found' });

    const likeCount = db.prepare(
      'SELECT COUNT(*) AS count FROM character_likes WHERE character_id = ?'
    ).get(share.character_id).count;

    const userLiked = req.session.userId
      ? !!db.prepare(
          'SELECT 1 FROM character_likes WHERE character_id = ? AND user_id = ?'
        ).get(share.character_id, req.session.userId)
      : false;

    res.json({ character: parseCharacter(char), likeCount, userLiked });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/share/:token/like — toggle like for the current user (auth required)
router.post('/:token/like', requireAuth, (req, res) => {
  try {
    const share = db.prepare('SELECT * FROM share_tokens WHERE token = ?').get(req.params.token);
    if (!share) return res.status(404).json({ error: 'Share link not found' });

    const existing = db.prepare(
      'SELECT id FROM character_likes WHERE character_id = ? AND user_id = ?'
    ).get(share.character_id, req.session.userId);

    if (existing) {
      db.prepare(
        'DELETE FROM character_likes WHERE character_id = ? AND user_id = ?'
      ).run(share.character_id, req.session.userId);
    } else {
      db.prepare(
        'INSERT INTO character_likes (character_id, user_id) VALUES (?, ?)'
      ).run(share.character_id, req.session.userId);
    }

    const likeCount = db.prepare(
      'SELECT COUNT(*) AS count FROM character_likes WHERE character_id = ?'
    ).get(share.character_id).count;

    res.json({ likeCount, userLiked: !existing });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
