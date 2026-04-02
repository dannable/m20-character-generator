const express = require('express');
const router  = express.Router();
const db      = require('../db');

const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
  'instruments','freebie_spent','attr_priority','ability_priority','merits','flaws','specialties'];

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

function serializeCharacter(data) {
  const out = { ...data };
  JSON_FIELDS.forEach(f => {
    if (out[f] !== undefined && typeof out[f] !== 'string') {
      out[f] = JSON.stringify(out[f]);
    }
  });
  delete out.id;
  delete out.user_id;
  delete out.created_at;
  delete out.updated_at;
  return out;
}

const SUMMARY_COLS = `id, user_id, name, player, chronicle, concept, affiliation,
  tradition, essence, arete, willpower, quintessence, created_at, updated_at`;

// GET /recent — last 4 characters for current user
router.get('/recent', (req, res) => {
  try {
    const userId = req.session.userId;
    const isAdmin = req.session.role === 'admin';
    const rows = isAdmin
      ? db.prepare(`SELECT ${SUMMARY_COLS} FROM characters ORDER BY updated_at DESC LIMIT 4`).all()
      : db.prepare(`SELECT ${SUMMARY_COLS} FROM characters WHERE user_id = ? ORDER BY updated_at DESC LIMIT 4`).all(userId);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all characters
router.get('/', (req, res) => {
  try {
    const userId = req.session.userId;
    const isAdmin = req.session.role === 'admin';
    const rows = isAdmin
      ? db.prepare(`SELECT ${SUMMARY_COLS} FROM characters ORDER BY updated_at DESC`).all()
      : db.prepare(`SELECT ${SUMMARY_COLS} FROM characters WHERE user_id = ? ORDER BY updated_at DESC`).all(userId);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single character
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && row.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });
    res.json(parseCharacter(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create character
router.post('/', (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ error: 'Character name is required' });
    const data = serializeCharacter(req.body);
    data.user_id = req.session.userId;
    const cols = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(k => `@${k}`).join(', ');
    const result = db.prepare(`INSERT INTO characters (${cols}) VALUES (${placeholders})`).run(data);
    const created = db.prepare('SELECT * FROM characters WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseCharacter(created));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update character
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && existing.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    const data = serializeCharacter(req.body);
    const sets = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE characters SET ${sets} WHERE id = @_id`).run({ ...data, _id: req.params.id });
    const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    res.json(parseCharacter(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE character
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && existing.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });
    db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
