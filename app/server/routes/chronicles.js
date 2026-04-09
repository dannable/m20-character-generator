const express = require('express');
const db      = require('../db');
const router  = express.Router();

// Guests may not create or join chronicles
function noGuests(req, res, next) {
  if (req.session.role === 'guest') {
    return res.status(403).json({ error: 'Guest accounts cannot use Chronicles.' });
  }
  next();
}

// ── Join code generator ───────────────────────────────────────────────────────
// Uses unambiguous characters (no O/0, I/1/l)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateJoinCode() {
  let code = '';
  for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}
function uniqueJoinCode() {
  let code, attempts = 0;
  do {
    code = generateJoinCode();
    attempts++;
  } while (db.prepare('SELECT id FROM chronicles WHERE join_code = ?').get(code) && attempts < 30);
  return code;
}

// ── GET /api/chronicles/join/:code — public join-code lookup ─────────────────
// Placed before /:id so it isn't swallowed by the id route
router.get('/join/:code', (req, res) => {
  const chronicle = db.prepare(
    `SELECT id, name, join_code, rules FROM chronicles WHERE join_code = ? AND is_active = 1`
  ).get(req.params.code.toUpperCase().trim());
  if (!chronicle) return res.status(404).json({ error: 'Invalid join code' });
  // Parse rules JSON so the client gets a plain object, not a raw string
  try { chronicle.rules = JSON.parse(chronicle.rules || '{}'); } catch { chronicle.rules = {}; }
  res.json(chronicle);
});

// ── GET /api/chronicles — list the current user's chronicles ─────────────────
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, COUNT(ch.id) AS member_count
      FROM chronicles c
      LEFT JOIN characters ch ON ch.chronicle_id = c.id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.is_active DESC, c.updated_at DESC
    `).all(req.session.userId);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── GET /api/chronicles/:id — detail with member list ────────────────────────
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rawMembers = db.prepare(`
      SELECT ch.id, ch.name, ch.player, ch.affiliation, ch.tradition, ch.arete, ch.user_id,
             ch.xp_earned, ch.xp_log,
             u.username AS owner_username
      FROM characters ch
      LEFT JOIN users u ON u.id = ch.user_id
      WHERE ch.chronicle_id = ?
      ORDER BY ch.name ASC
    `).all(id);
    const members = rawMembers.map(({ xp_log, ...m }) => {
      let log = [];
      try { log = JSON.parse(xp_log || '[]'); } catch {}
      return { ...m, has_submitted_xp: log.some(e => e.type === 'spend' && e.submitted && !e.approved && !e.finalized) };
    });
    let parsedRules = {};
    try { parsedRules = JSON.parse(chronicle.rules || '{}'); } catch {}
    res.json({ ...chronicle, rules: parsedRules, members });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/chronicles — create ────────────────────────────────────────────
router.post('/', noGuests, (req, res) => {
  try {
    const { name, setting, year, themes, notes, next_session, rules } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Chronicle name is required' });
    const join_code = uniqueJoinCode();
    const result = db.prepare(`
      INSERT INTO chronicles (user_id, name, setting, year, themes, notes, next_session, join_code, rules)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.userId,
      name.trim(),
      setting  || '',
      year     || '',
      themes   || '',
      notes    || '',
      next_session || '',
      join_code,
      JSON.stringify(rules || {})
    );
    const created = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── PUT /api/chronicles/:id — update ─────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, setting, year, themes, notes, next_session, allow_bg_xp, rules } = req.body;
    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({ error: 'Chronicle name cannot be empty' });
    }
    db.prepare(`
      UPDATE chronicles SET
        name         = COALESCE(?, name),
        setting      = COALESCE(?, setting),
        year         = COALESCE(?, year),
        themes       = COALESCE(?, themes),
        notes        = COALESCE(?, notes),
        next_session = COALESCE(?, next_session),
        allow_bg_xp  = COALESCE(?, allow_bg_xp),
        rules        = COALESCE(?, rules)
      WHERE id = ?
    `).run(
      name?.trim()        ?? null,
      setting             ?? null,
      year                ?? null,
      themes              ?? null,
      notes               ?? null,
      next_session        ?? null,
      allow_bg_xp != null ? (allow_bg_xp ? 1 : 0) : null,
      rules != null ? JSON.stringify(rules) : null,
      id
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/chronicles/:id/grant-xp — award XP to selected members ─────────
router.post('/:id/grant-xp', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { amount, note, character_ids } = req.body;
    const amt = parseInt(amount);
    if (!amt || amt < 1 || amt > 1000) return res.status(400).json({ error: 'Invalid XP amount' });

    const allMembers = db.prepare(`SELECT id FROM characters WHERE chronicle_id = ?`).all(id);
    const validIds   = new Set(allMembers.map(m => m.id));
    const targetIds  = Array.isArray(character_ids)
      ? character_ids.map(Number).filter(cid => validIds.has(cid))
      : [...validIds];
    if (targetIds.length === 0) return res.status(400).json({ error: 'No valid characters selected' });

    db.transaction(() => {
      for (const charId of targetIds) {
        const char = db.prepare(`SELECT xp_earned, xp_log FROM characters WHERE id = ?`).get(charId);
        let log = [];
        try { log = JSON.parse(char.xp_log || '[]'); } catch {}
        log.push({ type: 'award', amount: amt, note: (note || '').slice(0, 200), date: new Date().toISOString() });
        db.prepare(`UPDATE characters SET xp_earned = ?, xp_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run((char.xp_earned || 0) + amt, JSON.stringify(log), charId);
      }
    })();
    res.json({ ok: true, granted_to: targetIds.length });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── GET /api/chronicles/:id/members/:charId — ST views a member's sheet ──────
router.get('/:id/members/:charId', (req, res) => {
  try {
    const chronicleId = parseInt(req.params.id);
    const charId      = parseInt(req.params.charId);
    const chronicle   = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(chronicleId);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const char = db.prepare(`SELECT * FROM characters WHERE id = ? AND chronicle_id = ?`).get(charId, chronicleId);
    if (!char) return res.status(404).json({ error: 'Character not found in this chronicle' });
    // Parse JSON fields (reuse same list as characters route)
    const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
      'instruments','freebie_spent','attr_priority','ability_priority','merits','flaws','specialties',
      'customArchetypes','custom_ability_names','health_track','merit_labels','resonance','rotes','xp_log'];
    const parsed = { ...char };
    JSON_FIELDS.forEach(f => {
      if (typeof parsed[f] === 'string') {
        try { parsed[f] = JSON.parse(parsed[f]); } catch { parsed[f] = f === 'instruments' ? [] : {}; }
      }
    });
    res.json(parsed);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/chronicles/:id/members/:charId/xp/review — approve or reject ───
router.post('/:id/members/:charId/xp/review', (req, res) => {
  try {
    const chronicleId = parseInt(req.params.id);
    const charId      = parseInt(req.params.charId);
    const { log_index, action, reason } = req.body;

    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(chronicleId);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const char = db.prepare(`SELECT * FROM characters WHERE id = ? AND chronicle_id = ?`).get(charId, chronicleId);
    if (!char) return res.status(404).json({ error: 'Character not found in this chronicle' });

    const idx = parseInt(log_index);
    const xpLog = JSON.parse(char.xp_log || '[]');
    if (isNaN(idx) || idx < 0 || idx >= xpLog.length) {
      return res.status(400).json({ error: 'Invalid log index' });
    }
    const entry = xpLog[idx];
    if (entry.type !== 'spend' || !entry.submitted || entry.approved || entry.finalized) {
      return res.status(400).json({ error: 'Entry is not in a reviewable state' });
    }

    if (action === 'approve') {
      entry.approved  = true;
      entry.finalized = true;
      db.prepare(`UPDATE characters SET xp_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(JSON.stringify(xpLog), char.id);
      return res.json({ ok: true, action: 'approved', xp_log: xpLog });

    } else if (action === 'reject') {
      // Revert trait to pre-spend value
      const JSON_TRAIT_COLS  = new Set(['talents','skills','knowledges','backgrounds','spheres']);
      const SCALAR_TRAIT_COLS = new Set(['strength','dexterity','stamina','charisma','manipulation','appearance',
        'perception','intelligence','wits','arete','willpower']);
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
        const ridx = parseInt(trait_key);
        if (!isNaN(ridx) && resonance[ridx]) {
          resonance[ridx].rating = fromVal;
          db.prepare(`UPDATE characters SET resonance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(JSON.stringify(resonance), char.id);
        }
      }

      // Remove spend entry, insert rejection notice
      xpLog.splice(idx, 1);
      xpLog.push({
        type:        'rejection',
        trait_label: entry.trait_label || entry.trait_key,
        trait_key:   entry.trait_key,
        from:        entry.from,
        to:          entry.to,
        cost:        entry.cost,
        reason:      (reason || '').slice(0, 500),
        date:        new Date().toISOString(),
      });
      db.prepare(`UPDATE characters SET xp_log = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(JSON.stringify(xpLog), char.id);
      return res.json({ ok: true, action: 'rejected', xp_log: xpLog });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── GET /api/chronicles/:id/pending-edits — list pending character edits ─────
router.get('/:id/pending-edits', (req, res) => {
  try {
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(req.params.id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const edits = db.prepare(`
      SELECT pe.id, pe.character_id, pe.user_id, pe.diff_summary, pe.reason, pe.status, pe.submitted_at,
             c.name AS char_name, u.username AS submitter
      FROM pending_edits pe
      JOIN characters c ON c.id = pe.character_id
      JOIN users u ON u.id = pe.user_id
      WHERE pe.chronicle_id = ? AND pe.status = 'pending'
      ORDER BY pe.submitted_at DESC
    `).all(req.params.id);

    res.json(edits.map(e => ({ ...e, diff_summary: JSON.parse(e.diff_summary || '[]') })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/chronicles/:id/pending-edits/:editId/review — approve/reject ───
router.post('/:id/pending-edits/:editId/review', (req, res) => {
  try {
    const chronicleId = parseInt(req.params.id);
    const editId      = parseInt(req.params.editId);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(chronicleId);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const edit = db.prepare(`SELECT * FROM pending_edits WHERE id = ? AND chronicle_id = ?`).get(editId, chronicleId);
    if (!edit || edit.status !== 'pending') return res.status(404).json({ error: 'Pending edit not found' });

    const { action, reviewer_note } = req.body;
    if (!['approve','reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const note = (reviewer_note || '').slice(0, 500);
    const now  = new Date().toISOString();

    if (action === 'approve') {
      const EDITABLE = new Set([
        'name','player','concept','chronicle','affiliation','tradition','faction','essence','nature','demeanor',
        'strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits',
        'arete','willpower','quintessence','paradox','paradigm','practice','affinity_sphere',
        'talents','skills','knowledges','backgrounds','spheres','instruments','specialties',
        'merits','flaws','merit_labels','resonance','rotes','customArchetypes','custom_ability_names',
        'freebie_spent','attr_priority','ability_priority','description','notes',
      ]);
      const snapshot = JSON.parse(edit.char_snapshot);
      const allowed  = Object.keys(snapshot).filter(k => EDITABLE.has(k));
      const vals     = Object.fromEntries(allowed.map(k => [k, snapshot[k]]));
      const sets     = allowed.map(k => `${k} = @${k}`).join(', ');

      db.transaction(() => {
        db.prepare(`UPDATE characters SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @_id`).run({ ...vals, _id: edit.character_id });
        db.prepare(`UPDATE pending_edits SET status = 'approved', reviewed_at = ?, reviewer_id = ?, reviewer_note = ? WHERE id = ?`)
          .run(now, req.session.userId, note, editId);
      })();
      return res.json({ ok: true, action: 'approved' });
    }

    // Reject
    db.prepare(`UPDATE pending_edits SET status = 'rejected', reviewed_at = ?, reviewer_id = ?, reviewer_note = ? WHERE id = ?`)
      .run(now, req.session.userId, note, editId);
    return res.json({ ok: true, action: 'rejected' });

  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/chronicles/:id/deactivate — deactivate, destroy join code ──────
router.post('/:id/deactivate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Unassign all member characters
    db.prepare(`UPDATE characters SET chronicle_id = NULL WHERE chronicle_id = ?`).run(id);
    // Deactivate — join_code kept in DB but marked inactive so it cannot be used
    db.prepare(`UPDATE chronicles SET is_active = 0 WHERE id = ?`).run(id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── DELETE /api/chronicles/:id — delete chronicle ────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Detach all member characters before deleting
    db.prepare(`UPDATE characters SET chronicle_id = NULL WHERE chronicle_id = ?`).run(id);
    db.prepare(`DELETE FROM chronicles WHERE id = ?`).run(id);
    res.json({ deleted: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── GET /api/chronicles/:id/notes — list notes with share info ───────────────
router.get('/:id/notes', (req, res) => {
  try {
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(req.params.id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const notes = db.prepare(
      `SELECT * FROM chronicle_notes WHERE chronicle_id = ? ORDER BY created_at DESC`
    ).all(req.params.id);

    const noteIds = notes.map(n => n.id);
    const shares = noteIds.length
      ? db.prepare(
          `SELECT cns.note_id, cns.character_id, cns.seen_at, ch.name AS character_name
           FROM chronicle_note_shares cns
           JOIN characters ch ON ch.id = cns.character_id
           WHERE cns.note_id IN (${noteIds.map(() => '?').join(',')})`
        ).all(...noteIds)
      : [];

    const sharesByNote = {};
    shares.forEach(s => {
      (sharesByNote[s.note_id] = sharesByNote[s.note_id] || []).push(s);
    });
    res.json(notes.map(n => ({ ...n, shares: sharesByNote[n.id] || [] })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── POST /api/chronicles/:id/notes — create note ─────────────────────────────
router.post('/:id/notes', (req, res) => {
  try {
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(req.params.id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { title, body, character_ids = [] } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Note title is required' });

    const result = db.prepare(
      `INSERT INTO chronicle_notes (chronicle_id, title, body) VALUES (?, ?, ?)`
    ).run(req.params.id, title.trim(), body || '');

    const noteId = result.lastInsertRowid;
    if (character_ids.length) {
      const insertShare = db.prepare(
        `INSERT OR IGNORE INTO chronicle_note_shares (note_id, character_id) VALUES (?, ?)`
      );
      db.transaction(() => character_ids.forEach(cid => insertShare.run(noteId, cid)))();
    }
    res.status(201).json(db.prepare(`SELECT * FROM chronicle_notes WHERE id = ?`).get(noteId));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── PUT /api/chronicles/:id/notes/:noteId — update note ──────────────────────
router.put('/:id/notes/:noteId', (req, res) => {
  try {
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(req.params.id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const note = db.prepare(
      `SELECT * FROM chronicle_notes WHERE id = ? AND chronicle_id = ?`
    ).get(req.params.noteId, req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const { title, body, character_ids } = req.body;
    if (title !== undefined && !title?.trim()) return res.status(400).json({ error: 'Note title cannot be empty' });

    db.prepare(
      `UPDATE chronicle_notes SET title = COALESCE(?, title), body = COALESCE(?, body) WHERE id = ?`
    ).run(title?.trim() ?? null, body ?? null, req.params.noteId);

    if (character_ids !== undefined) {
      db.prepare(`DELETE FROM chronicle_note_shares WHERE note_id = ?`).run(req.params.noteId);
      if (character_ids.length) {
        const ins = db.prepare(
          `INSERT OR IGNORE INTO chronicle_note_shares (note_id, character_id) VALUES (?, ?)`
        );
        db.transaction(() => character_ids.forEach(cid => ins.run(req.params.noteId, cid)))();
      }
    }
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── DELETE /api/chronicles/:id/notes/:noteId — delete note ───────────────────
router.delete('/:id/notes/:noteId', (req, res) => {
  try {
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(req.params.id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    db.prepare(`DELETE FROM chronicle_notes WHERE id = ? AND chronicle_id = ?`).run(req.params.noteId, req.params.id);
    res.json({ deleted: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── DELETE /api/chronicles/:id/members/:charId — remove a character ──────────
router.delete('/:id/members/:charId', (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const charId = parseInt(req.params.charId);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    db.prepare(`UPDATE characters SET chronicle_id = NULL WHERE id = ? AND chronicle_id = ?`).run(charId, id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
