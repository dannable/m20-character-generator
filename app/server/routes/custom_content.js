const express = require('express');
const db      = require('../db');
const router  = express.Router();

// No guest access
router.use((req, res, next) => {
  if (!req.session?.userId)  return res.status(401).json({ error: 'Not authenticated' });
  if (req.session.isGuest)   return res.status(403).json({ error: 'Guests cannot create custom content' });
  next();
});

// GET /api/custom/merits-flaws — list caller's custom merits & flaws
router.get('/merits-flaws', (req, res) => {
  const items = db.prepare(
    `SELECT * FROM custom_merits_flaws WHERE user_id = ? ORDER BY kind, category, name`
  ).all(req.session.userId);
  res.json({ items });
});

// POST /api/custom/merits-flaws — create
router.post('/merits-flaws', (req, res) => {
  const { kind, name, cost, category, description, repeatable } = req.body;
  if (!['merit', 'flaw'].includes(kind))  return res.status(400).json({ error: 'kind must be "merit" or "flaw"' });
  if (!name?.trim())                      return res.status(400).json({ error: 'Name is required' });
  const CATS = ['Physical', 'Mental', 'Social', 'Supernatural'];
  const cat  = CATS.includes(category) ? category : 'Social';
  const result = db.prepare(
    `INSERT INTO custom_merits_flaws (user_id, kind, name, cost, category, description, repeatable)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.session.userId, kind, name.trim(), String(cost || '1').slice(0, 30), cat,
        (description || '').slice(0, 500), repeatable ? 1 : 0);
  const item = db.prepare(`SELECT * FROM custom_merits_flaws WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ item });
});

// PUT /api/custom/merits-flaws/:id — update
router.put('/merits-flaws/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const row = db.prepare(`SELECT id FROM custom_merits_flaws WHERE id = ? AND user_id = ?`).get(id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, cost, category, description, repeatable } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const CATS = ['Physical', 'Mental', 'Social', 'Supernatural'];
  const cat  = CATS.includes(category) ? category : 'Social';
  db.prepare(
    `UPDATE custom_merits_flaws SET name=?, cost=?, category=?, description=?, repeatable=? WHERE id=?`
  ).run(name.trim(), String(cost || '1').slice(0, 30), cat, (description || '').slice(0, 500), repeatable ? 1 : 0, id);
  const item = db.prepare(`SELECT * FROM custom_merits_flaws WHERE id = ?`).get(id);
  res.json({ item });
});

// DELETE /api/custom/merits-flaws/:id — delete
router.delete('/merits-flaws/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const row = db.prepare(`SELECT id FROM custom_merits_flaws WHERE id = ? AND user_id = ?`).get(id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM custom_merits_flaws WHERE id = ?`).run(id);
  res.json({ deleted: true });
});

// ── Custom Rotes ──────────────────────────────────────────────────────────────

// GET /api/custom/rotes
router.get('/rotes', (req, res) => {
  const items = db.prepare(
    `SELECT * FROM custom_rotes WHERE user_id = ? ORDER BY name`
  ).all(req.session.userId);
  res.json({ items });
});

// POST /api/custom/rotes
router.post('/rotes', (req, res) => {
  const { name, spheres, description, source } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const spheresJson = JSON.stringify(typeof spheres === 'object' && spheres ? spheres : {});
  const result = db.prepare(
    `INSERT INTO custom_rotes (user_id, name, spheres, description, source)
     VALUES (?, ?, ?, ?, ?)`
  ).run(req.session.userId, name.trim(), spheresJson,
        (description || '').slice(0, 1000), (source || '').slice(0, 100));
  const item = db.prepare(`SELECT * FROM custom_rotes WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ item });
});

// PUT /api/custom/rotes/:id
router.put('/rotes/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const row = db.prepare(`SELECT id FROM custom_rotes WHERE id = ? AND user_id = ?`).get(id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, spheres, description, source } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const spheresJson = JSON.stringify(typeof spheres === 'object' && spheres ? spheres : {});
  db.prepare(
    `UPDATE custom_rotes SET name=?, spheres=?, description=?, source=? WHERE id=?`
  ).run(name.trim(), spheresJson, (description || '').slice(0, 1000), (source || '').slice(0, 100), id);
  const item = db.prepare(`SELECT * FROM custom_rotes WHERE id = ?`).get(id);
  res.json({ item });
});

// DELETE /api/custom/rotes/:id
router.delete('/rotes/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const row = db.prepare(`SELECT id FROM custom_rotes WHERE id = ? AND user_id = ?`).get(id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM custom_rotes WHERE id = ?`).run(id);
  res.json({ deleted: true });
});

// ── Custom Backgrounds ────────────────────────────────────────────────────────

// GET /api/custom/backgrounds
router.get('/backgrounds', (req, res) => {
  const items = db.prepare(
    `SELECT * FROM custom_backgrounds WHERE user_id = ? ORDER BY name`
  ).all(req.session.userId);
  res.json({ items });
});

// POST /api/custom/backgrounds
router.post('/backgrounds', (req, res) => {
  const { name, description, max_dots } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const dots = Math.min(Math.max(parseInt(max_dots) || 5, 1), 10);
  const result = db.prepare(
    `INSERT INTO custom_backgrounds (user_id, name, description, max_dots)
     VALUES (?, ?, ?, ?)`
  ).run(req.session.userId, name.trim(), (description || '').slice(0, 1000), dots);
  const item = db.prepare(`SELECT * FROM custom_backgrounds WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ item });
});

// PUT /api/custom/backgrounds/:id
router.put('/backgrounds/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const row = db.prepare(`SELECT id FROM custom_backgrounds WHERE id = ? AND user_id = ?`).get(id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, description, max_dots } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const dots = Math.min(Math.max(parseInt(max_dots) || 5, 1), 10);
  db.prepare(
    `UPDATE custom_backgrounds SET name=?, description=?, max_dots=? WHERE id=?`
  ).run(name.trim(), (description || '').slice(0, 1000), dots, id);
  const item = db.prepare(`SELECT * FROM custom_backgrounds WHERE id = ?`).get(id);
  res.json({ item });
});

// DELETE /api/custom/backgrounds/:id
router.delete('/backgrounds/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const row = db.prepare(`SELECT id FROM custom_backgrounds WHERE id = ? AND user_id = ?`).get(id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM custom_backgrounds WHERE id = ?`).run(id);
  res.json({ deleted: true });
});

module.exports = router;
