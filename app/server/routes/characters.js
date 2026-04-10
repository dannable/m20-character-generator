const express = require('express');
const router  = express.Router();
const db      = require('../db');

const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
  'instruments','freebie_spent','attr_priority','ability_priority','merits','flaws','specialties',
  'customArchetypes','custom_ability_names','health_track','merit_labels','resonance','rotes','xp_log',
  'creation_baselines','wonders'];

function parseCharacter(row) {
  if (!row) return null;
  const char = { ...row };
  JSON_FIELDS.forEach(f => {
    if (typeof char[f] === 'string') {
      try { char[f] = JSON.parse(char[f]); } catch { char[f] = ['instruments','wonders'].includes(f) ? [] : {}; }
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
  // Strip virtual join columns — not real characters table columns
  delete out.linked_chronicle_name;
  delete out.chronicle_storyteller;
  delete out.chronicle_next_session;
  delete out.owner_username;
  // Strip client-side ephemeral fields (prefixed _)
  delete out._chronicleRules;
  return out;
}

// ── Fields allowed to be changed via edit-request/approval ───────────────────
const EDITABLE_FIELDS = new Set([
  'name','player','concept','chronicle','affiliation','tradition','faction','essence','nature','demeanor',
  'strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits',
  'arete','willpower','quintessence','paradox','paradigm','practice','affinity_sphere',
  'talents','skills','knowledges','backgrounds','spheres','instruments','specialties',
  'merits','flaws','merit_labels','resonance','rotes','customArchetypes','custom_ability_names',
  'freebie_spent','attr_priority','ability_priority','description','notes','wonders',
]);

// ── computeDiff: produce a human-readable diff for a pending edit ─────────────
function computeDiff(originalRow, proposed) {
  const orig = parseCharacter(originalRow);
  const diff = [];

  const SCALARS = [
    { key:'strength',      label:'Strength' },     { key:'dexterity',    label:'Dexterity' },
    { key:'stamina',       label:'Stamina' },       { key:'charisma',     label:'Charisma' },
    { key:'manipulation',  label:'Manipulation' },  { key:'appearance',   label:'Appearance' },
    { key:'perception',    label:'Perception' },    { key:'intelligence', label:'Intelligence' },
    { key:'wits',          label:'Wits' },          { key:'arete',        label:'Arete' },
    { key:'willpower',     label:'Willpower' },     { key:'quintessence', label:'Quintessence' },
    { key:'paradox',       label:'Paradox' },
  ];
  const TEXTS = [
    { key:'name',          label:'Name' },          { key:'player',       label:'Player' },
    { key:'concept',       label:'Concept' },        { key:'affiliation',  label:'Affiliation' },
    { key:'tradition',     label:'Tradition' },      { key:'faction',      label:'Faction' },
    { key:'essence',       label:'Essence' },        { key:'nature',       label:'Nature' },
    { key:'demeanor',      label:'Demeanor' },       { key:'paradigm',     label:'Paradigm' },
    { key:'practice',      label:'Practice' },       { key:'affinity_sphere', label:'Affinity Sphere' },
  ];
  const OBJ_TRAITS = [
    { key:'talents',     label:'Talent' },  { key:'skills',      label:'Skill' },
    { key:'knowledges',  label:'Knowledge'},{ key:'backgrounds', label:'Background' },
    { key:'spheres',     label:'Sphere' },  { key:'merits',      label:'Merit' },
    { key:'flaws',       label:'Flaw' },
  ];

  SCALARS.forEach(({ key, label }) => {
    const before = orig[key] ?? 0;
    const after  = proposed[key] ?? 0;
    if (Number(before) !== Number(after)) diff.push({ field: key, label, before: Number(before), after: Number(after), type: 'scalar' });
  });
  TEXTS.forEach(({ key, label }) => {
    const before = (orig[key] || '').trim();
    const after  = (proposed[key] || '').trim();
    if (before !== after) diff.push({ field: key, label, before, after, type: 'text' });
  });
  OBJ_TRAITS.forEach(({ key, label }) => {
    const o = orig[key] || {};
    const p = proposed[key] || {};
    const keys = new Set([...Object.keys(o), ...Object.keys(p)]);
    keys.forEach(k => {
      const before = o[k] || 0, after = p[k] || 0;
      if (Number(before) !== Number(after)) {
        const niceName = k.replace(/([A-Z])/g,' $1').replace(/^\w/,c=>c.toUpperCase()).trim();
        diff.push({ field:`${key}.${k}`, label:`${label}: ${niceName}`, before: Number(before), after: Number(after), type:'trait' });
      }
    });
  });
  return diff;
}

const SUMMARY_COLS = `characters.id, characters.user_id, characters.name, characters.player, characters.chronicle, characters.concept, characters.affiliation,
  characters.tradition, characters.essence, characters.arete, characters.willpower, characters.willpower_spent, characters.quintessence, characters.paradox, characters.health_track, characters.is_draft, characters.created_at, characters.updated_at, characters.chronicle_id`;

// Chronicle join columns & clause (used in list queries)
const CHRON_COLS = `chr.name AS linked_chronicle_name, cu.username AS chronicle_storyteller, chr.next_session AS chronicle_next_session, chr.allow_bg_xp AS chronicle_allow_bg_xp`;
const CHRON_JOIN = `LEFT JOIN chronicles chr ON chr.id = characters.chronicle_id LEFT JOIN users cu ON cu.id = chr.user_id`;

// POST /view — record a character view (fire-and-forget from client)
router.post('/:id/view', (req, res) => {
  try {
    const char = db.prepare('SELECT id, user_id FROM characters WHERE id = ?').get(req.params.id);
    if (!char || char.user_id !== req.session.userId) return res.json({ ok: false });
    db.prepare(`UPDATE characters SET last_viewed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(char.id);
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

// GET /recent — last 3 characters for the current user, ordered by last viewed
router.get('/recent', (req, res) => {
  try {
    if (req.query.ids) {
      const ids = req.query.ids.split(',').map(Number).filter(n => n > 0).slice(0, 5);
      if (!ids.length) return res.json([]);
      const placeholders = ids.map(() => '?').join(',');
      const rows = db.prepare(
        `SELECT ${SUMMARY_COLS}, ${CHRON_COLS} FROM characters ${CHRON_JOIN}
         WHERE characters.id IN (${placeholders}) AND characters.user_id = ?`
      ).all(...ids, req.session.userId);
      const byId = Object.fromEntries(rows.map(r => [r.id, r]));
      return res.json(ids.map(id => byId[id]).filter(Boolean));
    }
    // Order by last_viewed_at; fall back to updated_at for characters never explicitly viewed
    const rows = db.prepare(
      `SELECT ${SUMMARY_COLS}, ${CHRON_COLS} FROM characters ${CHRON_JOIN}
       WHERE characters.user_id = ?
       ORDER BY COALESCE(characters.last_viewed_at, characters.updated_at) DESC LIMIT 3`
    ).all(req.session.userId);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /recent/all — last 8 characters across all users (admin only)
router.get('/recent/all', (req, res) => {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const rows = db.prepare(`
      SELECT characters.id, characters.user_id, characters.name, characters.player,
             characters.chronicle, characters.concept, characters.affiliation,
             characters.tradition, characters.essence, characters.arete,
             characters.willpower, characters.willpower_spent, characters.quintessence,
             characters.paradox, characters.health_track, characters.is_draft,
             characters.created_at, characters.updated_at, characters.chronicle_id,
             u.username AS owner_username,
             ${CHRON_COLS}
      FROM characters
      LEFT JOIN users u ON u.id = characters.user_id
      ${CHRON_JOIN}
      ORDER BY characters.updated_at DESC LIMIT 8
    `).all();
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET all characters for the current user only
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT ${SUMMARY_COLS}, ${CHRON_COLS} FROM characters ${CHRON_JOIN}
       WHERE characters.user_id = ? ORDER BY characters.updated_at DESC`
    ).all(req.session.userId);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET storyteller notes shared to this character
router.get('/:id/storyteller-notes', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && existing.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });
    const notes = db.prepare(`
      SELECT cn.id, cn.title, cn.body, cn.created_at, cn.updated_at,
             cns.seen_at,
             cr.name AS chronicle_name, u.username AS storyteller
      FROM chronicle_note_shares cns
      JOIN chronicle_notes cn ON cn.id = cns.note_id
      JOIN chronicles cr ON cr.id = cn.chronicle_id
      JOIN users u ON u.id = cr.user_id
      WHERE cns.character_id = ?
      ORDER BY cn.created_at DESC
    `).all(req.params.id);
    res.json(notes);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST mark a storyteller note as seen
router.post('/:id/storyteller-notes/:noteId/seen', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && existing.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });
    db.prepare(`
      UPDATE chronicle_note_shares SET seen_at = CURRENT_TIMESTAMP
      WHERE note_id = ? AND character_id = ? AND seen_at IS NULL
    `).run(req.params.noteId, req.params.id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET single character
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT characters.*, ${CHRON_COLS}
      FROM characters ${CHRON_JOIN}
      WHERE characters.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && row.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });
    const parsed = parseCharacter(row);
    // Attach pending_edit info for chronicle characters
    if (row.chronicle_id) {
      const pe = db.prepare(
        `SELECT id, submitted_at, status FROM pending_edits WHERE character_id = ? AND status = 'pending' ORDER BY submitted_at DESC LIMIT 1`
      ).get(row.id);
      parsed.pending_edit = pe || null;
    } else {
      parsed.pending_edit = null;
    }
    res.json(parsed);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST create character
router.post('/', (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ error: 'Character name is required' });
    const { join_code, chronicle_id: _cid, _join_code: _jc, ...bodyRest } = req.body;
    const data = serializeCharacter(bodyRest);
    data.user_id = req.session.userId;
    const cols = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(k => `@${k}`).join(', ');
    const result = db.prepare(`INSERT INTO characters (${cols}) VALUES (${placeholders})`).run(data);
    // Link chronicle via join code if provided (guests may not join chronicles)
    if (join_code && req.session.role !== 'guest') {
      const code = join_code.trim().toUpperCase();
      const chronicle = db.prepare('SELECT id FROM chronicles WHERE join_code = ?').get(code);
      if (chronicle) {
        db.prepare('UPDATE characters SET chronicle_id = ? WHERE id = ?').run(chronicle.id, result.lastInsertRowid);
      }
    }
    const created = db.prepare('SELECT * FROM characters WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseCharacter(created));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// PUT update character
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && existing.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    // Extract chronicle fields before serializing — not character columns
    const { join_code, chronicle_id: _ignored, _join_code: _jc, ...rest } = req.body;

    // Resolve join code → chronicle_id (guests may not join chronicles)
    if (join_code !== undefined && req.session.role !== 'guest') {
      const code = (join_code || '').trim().toUpperCase();
      if (code) {
        const chronicle = db.prepare('SELECT id FROM chronicles WHERE join_code = ?').get(code);
        if (chronicle) {
          db.prepare('UPDATE characters SET chronicle_id = ? WHERE id = ?').run(chronicle.id, req.params.id);
        }
      } else {
        db.prepare('UPDATE characters SET chronicle_id = NULL WHERE id = ?').run(req.params.id);
      }
    }

    const data = serializeCharacter(rest);
    const sets = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    if (sets) {
      db.prepare(`UPDATE characters SET ${sets} WHERE id = @_id`).run({ ...data, _id: req.params.id });
    }
    const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    res.json(parseCharacter(updated));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/characters/:id/edit-request — free edit (direct or pending ST) ─
router.post('/:id/edit-request', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && existing.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });
    if (existing.is_draft) return res.status(400).json({ error: 'Use the creator wizard to edit draft characters' });

    const { proposed, reason } = req.body;
    if (!proposed || !proposed.name) return res.status(400).json({ error: 'proposed character data required' });

    if (!existing.chronicle_id) {
      // No chronicle — apply directly
      const data = serializeCharacter(proposed);
      // Only update editable fields
      const allowed = Object.keys(data).filter(k => EDITABLE_FIELDS.has(k));
      if (!allowed.length) return res.status(400).json({ error: 'No editable fields provided' });
      const sets = allowed.map(k => `${k} = @${k}`).join(', ');
      const vals = Object.fromEntries(allowed.map(k => [k, data[k]]));
      db.prepare(`UPDATE characters SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @_id`).run({ ...vals, _id: existing.id });
      const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(existing.id);
      return res.json({ ok: true, applied: true, char: parseCharacter(updated) });
    }

    // Chronicle character — queue for ST approval
    const existing_pending = db.prepare(
      `SELECT id FROM pending_edits WHERE character_id = ? AND status = 'pending'`
    ).get(existing.id);
    if (existing_pending) {
      return res.status(409).json({ error: 'A pending edit already exists for this character. Wait for Storyteller review.' });
    }

    const diff = computeDiff(existing, proposed);
    const snapshot = JSON.stringify(serializeCharacter(proposed));

    const result = db.prepare(
      `INSERT INTO pending_edits (character_id, chronicle_id, user_id, char_snapshot, diff_summary, reason)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(existing.id, existing.chronicle_id, req.session.userId, snapshot, JSON.stringify(diff), (reason || '').slice(0, 1000));

    return res.json({ ok: true, applied: false, pending_edit_id: result.lastInsertRowid });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── XP: whitelisted column sets to prevent SQL injection ─────────────────────
const SCALAR_TRAIT_COLS = new Set([
  'strength','dexterity','stamina','charisma','manipulation','appearance',
  'perception','intelligence','wits','arete','willpower',
]);
const JSON_TRAIT_COLS = new Set(['talents','skills','knowledges','backgrounds','spheres']);

// ── POST /api/characters/:id/xp/award — add XP to character pool ─────────────
router.post('/:id/xp/award', (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && char.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    const { amount, note } = req.body;
    const amt = parseInt(amount);
    if (!amt || amt < 1 || amt > 1000) return res.status(400).json({ error: 'Invalid XP amount' });

    const xpLog = JSON.parse(char.xp_log || '[]');
    xpLog.push({ type: 'award', amount: amt, note: (note || '').slice(0, 200), date: new Date().toISOString() });
    const newEarned = (char.xp_earned || 0) + amt;

    db.prepare(`UPDATE characters SET xp_earned = ?, xp_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(newEarned, JSON.stringify(xpLog), char.id);
    res.json({ xp_earned: newEarned, xp_log: xpLog });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/characters/:id/xp/spend — spend XP to raise a trait ────────────
router.post('/:id/xp/spend', (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && char.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    const { trait_group, trait_col, trait_key, trait_label, from: fromVal, to: toVal, cost } = req.body;
    if (!trait_group || !trait_key || typeof cost !== 'number' || typeof fromVal !== 'number' || typeof toVal !== 'number') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    if (toVal !== fromVal + 1) return res.status(400).json({ error: 'Can only raise one dot at a time' });
    if (cost < 1) return res.status(400).json({ error: 'Invalid cost' });
    if (trait_col && !JSON_TRAIT_COLS.has(trait_col)) return res.status(400).json({ error: 'Invalid trait column' });
    if (!trait_col && trait_group !== 'resonance' && !SCALAR_TRAIT_COLS.has(trait_key)) {
      return res.status(400).json({ error: 'Invalid trait key' });
    }

    // Check available XP
    const xpLog = JSON.parse(char.xp_log || '[]');
    const xpSpent = xpLog.filter(e => e.type === 'spend').reduce((s, e) => s + e.cost, 0);
    const xpAvailable = (char.xp_earned || 0) - xpSpent;
    if (cost > xpAvailable) return res.status(400).json({ error: `Not enough XP (have ${xpAvailable}, need ${cost})` });

    // Apply trait update
    if (SCALAR_TRAIT_COLS.has(trait_key) && !trait_col) {
      db.prepare(`UPDATE characters SET ${trait_key} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(toVal, char.id);
    } else if (trait_col && JSON_TRAIT_COLS.has(trait_col)) {
      const jsonData = JSON.parse(char[trait_col] || '{}');
      jsonData[trait_key] = toVal;
      db.prepare(`UPDATE characters SET ${trait_col} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(JSON.stringify(jsonData), char.id);
    } else if (trait_group === 'resonance') {
      const resonance = JSON.parse(char.resonance || '[]');
      const idx = parseInt(trait_key);
      if (!isNaN(idx) && resonance[idx]) {
        resonance[idx].rating = toVal;
        db.prepare(`UPDATE characters SET resonance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(JSON.stringify(resonance), char.id);
      }
    }

    // Append spend to log
    xpLog.push({
      type: 'spend', trait_group, trait_col: trait_col || null,
      trait_key, trait_label: (trait_label || trait_key).replace(/<[^>]+>/g, ''),
      from: fromVal, to: toVal, cost, date: new Date().toISOString(),
    });
    db.prepare(`UPDATE characters SET xp_log = ? WHERE id = ?`).run(JSON.stringify(xpLog), char.id);
    res.json({ ok: true, xp_log: xpLog });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── DELETE /api/characters/:id/xp/:logIndex — undo a specific spend ──────────
router.delete('/:id/xp/:logIndex', (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && char.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    const logIndex = parseInt(req.params.logIndex);
    const xpLog = JSON.parse(char.xp_log || '[]');
    if (isNaN(logIndex) || logIndex < 0 || logIndex >= xpLog.length) {
      return res.status(400).json({ error: 'Invalid log index' });
    }
    const entry = xpLog[logIndex];
    if (entry.type !== 'spend') return res.status(400).json({ error: 'Can only undo spend entries' });
    if (entry.finalized)        return res.status(400).json({ error: 'Cannot undo a finalized expenditure' });
    if (entry.submitted)        return res.status(400).json({ error: 'Cannot undo a submitted expenditure — it is awaiting Storyteller review' });

    // Revert trait to the pre-spend value stored in the log entry
    const { trait_group, trait_col, trait_key, from: fromVal } = entry;
    if (trait_col && JSON_TRAIT_COLS.has(trait_col)) {
      const jsonData = JSON.parse(char[trait_col] || '{}');
      jsonData[trait_key] = fromVal;
      db.prepare(`UPDATE characters SET ${trait_col} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(JSON.stringify(jsonData), char.id);
    } else if (SCALAR_TRAIT_COLS.has(trait_key) && !trait_col) {
      db.prepare(`UPDATE characters SET ${trait_key} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(fromVal, char.id);
    } else if (trait_group === 'resonance') {
      const resonance = JSON.parse(char.resonance || '[]');
      const idx = parseInt(trait_key);
      if (!isNaN(idx) && resonance[idx]) {
        resonance[idx].rating = fromVal;
        db.prepare(`UPDATE characters SET resonance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(JSON.stringify(resonance), char.id);
      }
    }

    xpLog.splice(logIndex, 1);
    db.prepare(`UPDATE characters SET xp_log = ? WHERE id = ?`).run(JSON.stringify(xpLog), char.id);
    res.json({ ok: true, xp_log: xpLog });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/characters/:id/xp/finalize — lock all pending spends ────────────
router.post('/:id/xp/finalize', (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && char.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    const xpLog = JSON.parse(char.xp_log || '[]');
    let count = 0;
    xpLog.forEach(e => { if (e.type === 'spend' && !e.finalized) { e.finalized = true; count++; } });

    db.prepare(`UPDATE characters SET xp_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(JSON.stringify(xpLog), char.id);
    res.json({ ok: true, xp_log: xpLog, finalized_count: count });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/characters/:id/xp/submit — submit pending spends to ST ─────────
router.post('/:id/xp/submit', (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    const isAdmin = req.session.role === 'admin';
    if (!isAdmin && char.user_id !== req.session.userId) return res.status(403).json({ error: 'Access denied' });

    const xpLog = JSON.parse(char.xp_log || '[]');
    let count = 0;
    xpLog.forEach(e => {
      if (e.type === 'spend' && !e.submitted && !e.finalized) {
        e.submitted = true;
        count++;
      }
    });

    db.prepare(`UPDATE characters SET xp_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(JSON.stringify(xpLog), char.id);
    res.json({ ok: true, xp_log: xpLog, submitted_count: count });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
