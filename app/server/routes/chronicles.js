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

// ── GET /api/chronicles/custom/member-content — chronicle content for members ─
// Returns custom content from every chronicle the caller's characters belong to.
// Must be defined BEFORE /:id so Express doesn't consume "custom" as a chronicle ID.
router.get('/custom/member-content', (req, res) => {
  try {
    const chronicles = db.prepare(`
      SELECT DISTINCT chr.id, chr.name
      FROM chronicles chr
      JOIN characters ch ON ch.chronicle_id = chr.id
      WHERE ch.user_id = ?
    `).all(req.session.userId);

    const result = chronicles.map(chr => ({
      id:          chr.id,
      name:        chr.name,
      merits_flaws: db.prepare(`SELECT * FROM chronicle_custom_merits_flaws WHERE chronicle_id = ? ORDER BY kind, name`).all(chr.id),
      rotes:        db.prepare(`SELECT * FROM chronicle_custom_rotes       WHERE chronicle_id = ? ORDER BY name`).all(chr.id),
      backgrounds:  db.prepare(`SELECT * FROM chronicle_custom_backgrounds WHERE chronicle_id = ? ORDER BY name`).all(chr.id),
      wonders:      db.prepare(`SELECT * FROM chronicle_custom_wonders      WHERE chronicle_id = ? ORDER BY name`).all(chr.id),
    }));

    res.json({ chronicles: result });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── GET /api/chronicles/:id — detail with member list ────────────────────────
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chronicle = db.prepare(`SELECT * FROM chronicles WHERE id = ?`).get(id);
    if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
    const isAdmin = req.session.role === 'admin';
    const isST    = chronicle.user_id === req.session.userId;
    if (!isST && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

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
      return {
        ...m,
        has_submitted_xp: log.some(e => e.type === 'spend' && e.submitted && !e.approved && !e.finalized),
        xp_awards: log.filter(e => e.type === 'award'),
      };
    });
    let parsedRules = {};
    try { parsedRules = JSON.parse(chronicle.rules || '{}'); } catch {}

    // Include chronicle custom content for ST/admin
    const customContent = {
      merits_flaws: db.prepare(`SELECT * FROM chronicle_custom_merits_flaws WHERE chronicle_id = ? ORDER BY kind, name`).all(id),
      rotes:        db.prepare(`SELECT * FROM chronicle_custom_rotes       WHERE chronicle_id = ? ORDER BY name`).all(id),
      backgrounds:  db.prepare(`SELECT * FROM chronicle_custom_backgrounds WHERE chronicle_id = ? ORDER BY name`).all(id),
      wonders:      db.prepare(`SELECT * FROM chronicle_custom_wonders      WHERE chronicle_id = ? ORDER BY name`).all(id),
    };

    res.json({ ...chronicle, rules: parsedRules, members, customContent });
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
    // Parse JSON fields — must stay in sync with characters route JSON_FIELDS
    const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
      'instruments','freebie_spent','attr_priority','ability_priority','merits','flaws','specialties',
      'customArchetypes','custom_ability_names','health_track','merit_labels','resonance','rotes','xp_log',
      'creation_baselines','wonders','gear','weapons','virtues'];
    const ARRAY_FIELDS = new Set(['instruments','wonders','gear','weapons']);
    const parsed = { ...char };
    JSON_FIELDS.forEach(f => {
      if (typeof parsed[f] === 'string') {
        try { parsed[f] = JSON.parse(parsed[f]); } catch { parsed[f] = ARRAY_FIELDS.has(f) ? [] : {}; }
      } else if (parsed[f] == null) {
        parsed[f] = ARRAY_FIELDS.has(f) ? [] : {};
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
        'character_type','virtues','humanity',
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

// ── Chronicle custom content CRUD ─────────────────────────────────────────────
// Shared middleware: verifies ST ownership for write operations
function requireChronST(req, res, next) {
  const id = parseInt(req.params.id);
  const chronicle = db.prepare(`SELECT user_id FROM chronicles WHERE id = ?`).get(id);
  if (!chronicle) return res.status(404).json({ error: 'Chronicle not found' });
  if (chronicle.user_id !== req.session.userId && req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — Storytellers only' });
  }
  req._chronicle = chronicle;
  req._chronicleId = id;
  next();
}

// ── Merits & Flaws ────────────────────────────────────────────────────────────
router.get('/:id/custom/merits-flaws', requireChronST, (req, res) => {
  const items = db.prepare(`SELECT * FROM chronicle_custom_merits_flaws WHERE chronicle_id = ? ORDER BY kind, category, name`).all(req._chronicleId);
  res.json({ items });
});

router.post('/:id/custom/merits-flaws', requireChronST, (req, res) => {
  const { kind, name, cost, category, description, repeatable } = req.body;
  if (!['merit','flaw'].includes(kind)) return res.status(400).json({ error: 'kind must be "merit" or "flaw"' });
  if (!name?.trim())                   return res.status(400).json({ error: 'Name is required' });
  const CATS = ['Physical','Mental','Social','Supernatural'];
  const cat  = CATS.includes(category) ? category : 'Social';
  const result = db.prepare(
    `INSERT INTO chronicle_custom_merits_flaws (chronicle_id, kind, name, cost, category, description, repeatable)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req._chronicleId, kind, name.trim(), String(cost || '1').slice(0,30), cat, (description||'').slice(0,500), repeatable ? 1 : 0);
  res.status(201).json({ item: db.prepare(`SELECT * FROM chronicle_custom_merits_flaws WHERE id = ?`).get(result.lastInsertRowid) });
});

router.put('/:id/custom/merits-flaws/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_merits_flaws WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, cost, category, description, repeatable } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const CATS = ['Physical','Mental','Social','Supernatural'];
  const cat  = CATS.includes(category) ? category : 'Social';
  db.prepare(`UPDATE chronicle_custom_merits_flaws SET name=?,cost=?,category=?,description=?,repeatable=? WHERE id=?`)
    .run(name.trim(), String(cost||'1').slice(0,30), cat, (description||'').slice(0,500), repeatable ? 1 : 0, itemId);
  res.json({ item: db.prepare(`SELECT * FROM chronicle_custom_merits_flaws WHERE id = ?`).get(itemId) });
});

router.delete('/:id/custom/merits-flaws/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_merits_flaws WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM chronicle_custom_merits_flaws WHERE id = ?`).run(itemId);
  res.json({ deleted: true });
});

// ── Rotes ─────────────────────────────────────────────────────────────────────
router.get('/:id/custom/rotes', requireChronST, (req, res) => {
  const items = db.prepare(`SELECT * FROM chronicle_custom_rotes WHERE chronicle_id = ? ORDER BY name`).all(req._chronicleId);
  res.json({ items });
});

router.post('/:id/custom/rotes', requireChronST, (req, res) => {
  const { name, spheres, description, source } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const spheresJson = JSON.stringify(typeof spheres === 'object' && spheres ? spheres : {});
  const result = db.prepare(
    `INSERT INTO chronicle_custom_rotes (chronicle_id, name, spheres, description, source) VALUES (?,?,?,?,?)`
  ).run(req._chronicleId, name.trim(), spheresJson, (description||'').slice(0,1000), (source||'').slice(0,100));
  res.status(201).json({ item: db.prepare(`SELECT * FROM chronicle_custom_rotes WHERE id = ?`).get(result.lastInsertRowid) });
});

router.put('/:id/custom/rotes/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_rotes WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, spheres, description, source } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const spheresJson = JSON.stringify(typeof spheres === 'object' && spheres ? spheres : {});
  db.prepare(`UPDATE chronicle_custom_rotes SET name=?,spheres=?,description=?,source=? WHERE id=?`)
    .run(name.trim(), spheresJson, (description||'').slice(0,1000), (source||'').slice(0,100), itemId);
  res.json({ item: db.prepare(`SELECT * FROM chronicle_custom_rotes WHERE id = ?`).get(itemId) });
});

router.delete('/:id/custom/rotes/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_rotes WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM chronicle_custom_rotes WHERE id = ?`).run(itemId);
  res.json({ deleted: true });
});

// ── Backgrounds ───────────────────────────────────────────────────────────────
router.get('/:id/custom/backgrounds', requireChronST, (req, res) => {
  const items = db.prepare(`SELECT * FROM chronicle_custom_backgrounds WHERE chronicle_id = ? ORDER BY name`).all(req._chronicleId);
  res.json({ items });
});

router.post('/:id/custom/backgrounds', requireChronST, (req, res) => {
  const { name, description, max_dots } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const dots = Math.min(Math.max(parseInt(max_dots)||5,1),10);
  const result = db.prepare(
    `INSERT INTO chronicle_custom_backgrounds (chronicle_id, name, description, max_dots) VALUES (?,?,?,?)`
  ).run(req._chronicleId, name.trim(), (description||'').slice(0,1000), dots);
  res.status(201).json({ item: db.prepare(`SELECT * FROM chronicle_custom_backgrounds WHERE id = ?`).get(result.lastInsertRowid) });
});

router.put('/:id/custom/backgrounds/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_backgrounds WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, description, max_dots } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const dots = Math.min(Math.max(parseInt(max_dots)||5,1),10);
  db.prepare(`UPDATE chronicle_custom_backgrounds SET name=?,description=?,max_dots=? WHERE id=?`)
    .run(name.trim(), (description||'').slice(0,1000), dots, itemId);
  res.json({ item: db.prepare(`SELECT * FROM chronicle_custom_backgrounds WHERE id = ?`).get(itemId) });
});

router.delete('/:id/custom/backgrounds/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_backgrounds WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM chronicle_custom_backgrounds WHERE id = ?`).run(itemId);
  res.json({ deleted: true });
});

// ── Wonders ───────────────────────────────────────────────────────────────────
router.get('/:id/custom/wonders', requireChronST, (req, res) => {
  const items = db.prepare(`SELECT * FROM chronicle_custom_wonders WHERE chronicle_id = ? ORDER BY level, name`).all(req._chronicleId);
  res.json({ items });
});

router.post('/:id/custom/wonders', requireChronST, (req, res) => {
  const { name, description, level } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const lvl = Math.min(Math.max(parseInt(level)||1,1),10);
  const result = db.prepare(
    `INSERT INTO chronicle_custom_wonders (chronicle_id, name, description, level) VALUES (?,?,?,?)`
  ).run(req._chronicleId, name.trim(), (description||'').slice(0,1000), lvl);
  res.status(201).json({ item: db.prepare(`SELECT * FROM chronicle_custom_wonders WHERE id = ?`).get(result.lastInsertRowid) });
});

router.put('/:id/custom/wonders/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_wonders WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, description, level } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const lvl = Math.min(Math.max(parseInt(level)||1,1),10);
  db.prepare(`UPDATE chronicle_custom_wonders SET name=?,description=?,level=? WHERE id=?`)
    .run(name.trim(), (description||'').slice(0,1000), lvl, itemId);
  res.json({ item: db.prepare(`SELECT * FROM chronicle_custom_wonders WHERE id = ?`).get(itemId) });
});

router.delete('/:id/custom/wonders/:itemId', requireChronST, (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const row = db.prepare(`SELECT id FROM chronicle_custom_wonders WHERE id = ? AND chronicle_id = ?`).get(itemId, req._chronicleId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM chronicle_custom_wonders WHERE id = ?`).run(itemId);
  res.json({ deleted: true });
});

module.exports = router;
