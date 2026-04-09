const express = require('express');
const router  = express.Router();
const db      = require('../db');

const VALID_SPHERES = ['Correspondence','Entropy','Forces','Life','Matter','Mind','Prime','Spirit','Time',
  'Data','Dimensional Science','Primal Utility'];

// GET /api/rotes/chapters — distinct category names
router.get('/rotes/chapters', (req, res) => {
  try {
    const rows = db.prepare(`SELECT DISTINCT chapter FROM rotes ORDER BY chapter`).all();
    res.json(rows.map(r => r.chapter));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/rotes/factions — distinct faction values
router.get('/rotes/factions', (req, res) => {
  try {
    const rows = db.prepare(`SELECT DISTINCT faction FROM rotes WHERE faction IS NOT NULL AND faction != '' ORDER BY faction`).all();
    res.json(rows.map(r => r.faction));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/rotes/books — distinct source book values
router.get('/rotes/books', (req, res) => {
  try {
    const rows = db.prepare(`SELECT DISTINCT source_book FROM rotes WHERE source_book IS NOT NULL AND source_book != '' ORDER BY source_book`).all();
    res.json(rows.map(r => r.source_book));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/rotes — paginated list with optional filters
// Sphere filter: ?spheres=Entropy:2:upto,Forces:3:exact
//   upto  → sphere is required AND its minimum level <= Rating
//   exact → sphere minimum level = Rating exactly
router.get('/rotes', (req, res) => {
  try {
    const search    = (req.query.search    || '').trim();
    const chapter   = (req.query.chapter   || '').trim();
    const faction   = (req.query.faction   || '').trim();
    const book      = (req.query.book      || '').trim();
    const pageNum   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit     = Math.min(954, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset    = (pageNum - 1) * limit;

    const conditions = [];
    const params     = [];

    if (search)  { conditions.push(`name LIKE ? COLLATE NOCASE`); params.push(`%${search}%`); }
    if (chapter) { conditions.push(`chapter = ?`);      params.push(chapter); }
    if (faction) { conditions.push(`faction = ?`);      params.push(faction); }
    if (book)    { conditions.push(`source_book = ?`);  params.push(book); }

    // Multi-sphere filter: parse "Entropy:2:upto,Forces:3:exact"
    const spheresParam = (req.query.spheres || '').trim();
    if (spheresParam) {
      spheresParam.split(',').forEach(part => {
        const [sphere, ratingStr, modeStr] = part.trim().split(':');
        const rating = parseInt(ratingStr, 10);
        const mode   = modeStr === 'exact' ? 'exact' : 'upto';
        if (!VALID_SPHERES.includes(sphere) || !(rating >= 1 && rating <= 5)) return;
        const path = `'$.${sphere}'`;
        if (mode === 'exact') {
          conditions.push(`CAST(json_extract(sphere_minimums, ${path}) AS INTEGER) = ?`);
          params.push(rating);
        } else {
          conditions.push(
            `json_extract(sphere_minimums, ${path}) IS NOT NULL` +
            ` AND CAST(json_extract(sphere_minimums, ${path}) AS INTEGER) <= ?`
          );
          params.push(rating);
        }
      });
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = db.prepare(`SELECT COUNT(*) as c FROM rotes ${where}`).get(...params).c;
    const rows  = db.prepare(`SELECT * FROM rotes ${where} ORDER BY chapter, page, name LIMIT ? OFFSET ?`).all(...params, limit, offset);

    const rotes = rows.map(r => ({
      ...r,
      spheres_parsed:  JSON.parse(r.spheres_parsed  || '[]'),
      sphere_minimums: JSON.parse(r.sphere_minimums || '{}'),
    }));

    res.json({ total, page: pageNum, limit, pages: Math.ceil(total / limit), rotes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/rotes/:id — single rote
router.get('/rotes/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const row = db.prepare(`SELECT * FROM rotes WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Rote not found' });
    res.json({
      ...row,
      spheres_parsed:  JSON.parse(row.spheres_parsed  || '[]'),
      sphere_minimums: JSON.parse(row.sphere_minimums || '{}'),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
