// Session mode (Phase 1): chronicle sessions and Storyteller session notes.
// Mounted at /api/chronicles, after the chronicles router.
const express = require('express');
const db      = require('../db');
const router  = express.Router();
const Dice    = require('../dice');
const Events  = require('../session-events');
const Bot     = require('../discord-bot');

const NOTE_KINDS = ['note', 'handout', 'scene'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Session notes are plain text. A handout is mirrored into chronicle_notes as
// escaped paragraphs so the existing "Storyteller notes" view on a player's
// sheet shows it with no new player-side code.
function textToHtml(text) {
  return String(text || '').split(/\n{2,}/).filter(p => p.trim())
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

function loadChronicle(req, res) {
  const c = db.prepare('SELECT * FROM chronicles WHERE id = ?').get(req.params.id);
  if (!c) { res.status(404).json({ error: 'Chronicle not found' }); return null; }
  if (c.user_id !== req.session.userId && req.session.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' }); return null;
  }
  return c;
}
function loadSession(req, res, c) {
  const s = db.prepare('SELECT * FROM chronicle_sessions WHERE id = ? AND chronicle_id = ?')
    .get(req.params.sid, c.id);
  if (!s) { res.status(404).json({ error: 'Session not found' }); return null; }
  return s;
}
const fail = (res, err) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); };

// Only characters that actually belong to this chronicle may receive a handout
function validCharIds(chronicleId, ids) {
  if (!Array.isArray(ids)) return [];
  const ok = db.prepare('SELECT id FROM characters WHERE chronicle_id = ?').all(chronicleId).map(r => r.id);
  return [...new Set(ids.map(Number))].filter(id => ok.includes(id));
}

function notesWithShares(sessionId) {
  const notes = db.prepare('SELECT * FROM session_notes WHERE session_id = ? ORDER BY created_at, id').all(sessionId);
  return notes.map(n => {
    const shares = n.chronicle_note_id
      ? db.prepare(`SELECT cns.character_id, ch.name AS character_name
                    FROM chronicle_note_shares cns JOIN characters ch ON ch.id = cns.character_id
                    WHERE cns.note_id = ?`).all(n.chronicle_note_id)
      : [];
    return { ...n, shares };
  });
}

function roster(chronicleId) {
  return db.prepare(`
    SELECT ch.id, ch.name, ch.character_type, ch.willpower, ch.willpower_spent, ch.quintessence,
           ch.paradox, ch.health_track, ch.health_dead, u.username AS owner_username
    FROM characters ch LEFT JOIN users u ON u.id = ch.user_id
    WHERE ch.chronicle_id = ? ORDER BY ch.name`).all(chronicleId).map(r => {
    let track = []; try { track = JSON.parse(r.health_track || '[]'); } catch {}
    const damaged = Array.isArray(track) ? track.filter(t => t && t !== 'empty').length : 0;
    const { health_track, ...rest } = r;
    return { ...rest, health_damaged: damaged };
  });
}

// Keep the mirrored chronicle note in step with a handout session note
function syncHandout(chronicleId, note, charIds) {
  let cnId = note.chronicle_note_id;
  const title = note.title || 'Handout';
  const body  = textToHtml(note.body);
  if (!cnId) {
    cnId = db.prepare('INSERT INTO chronicle_notes (chronicle_id, title, body) VALUES (?, ?, ?)')
      .run(chronicleId, title, body).lastInsertRowid;
    db.prepare('UPDATE session_notes SET chronicle_note_id = ? WHERE id = ?').run(cnId, note.id);
  } else {
    db.prepare('UPDATE chronicle_notes SET title = ?, body = ? WHERE id = ?').run(title, body, cnId);
  }
  if (charIds) {
    if (charIds.length) {
      db.prepare('DELETE FROM chronicle_note_shares WHERE note_id = ? AND character_id NOT IN (' +
        charIds.map(() => '?').join(',') + ')').run(cnId, ...charIds);
    } else {
      db.prepare('DELETE FROM chronicle_note_shares WHERE note_id = ?').run(cnId);
    }
    const ins = db.prepare('INSERT OR IGNORE INTO chronicle_note_shares (note_id, character_id) VALUES (?, ?)');
    charIds.forEach(id => ins.run(cnId, id));
  }
}
function dropMirror(note) {
  if (note.chronicle_note_id) db.prepare('DELETE FROM chronicle_notes WHERE id = ?').run(note.chronicle_note_id);
}

// ── GET /:id/sessions — list ─────────────────────────────────────────────────
router.get('/:id/sessions', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    res.json(db.prepare('SELECT * FROM chronicle_sessions WHERE chronicle_id = ? ORDER BY number DESC').all(c.id));
  } catch (err) { fail(res, err); }
});

// ── POST /:id/sessions — start a session ─────────────────────────────────────
router.post('/:id/sessions', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    if (!c.is_active) return res.status(400).json({ error: 'This chronicle is inactive.' });
    if (db.prepare("SELECT id FROM chronicle_sessions WHERE chronicle_id = ? AND status = 'active'").get(c.id)) {
      return res.status(409).json({ error: 'A session is already running. End it first.' });
    }
    const title = String(req.body?.title || '').trim().slice(0, 120);
    const num = (db.prepare('SELECT MAX(number) AS n FROM chronicle_sessions WHERE chronicle_id = ?').get(c.id).n || 0) + 1;
    const id = db.prepare('INSERT INTO chronicle_sessions (chronicle_id, number, title) VALUES (?, ?, ?)')
      .run(c.id, num, title).lastInsertRowid;
    const created = db.prepare('SELECT * FROM chronicle_sessions WHERE id = ?').get(id);
    Events.publish(c.id, 'session', { status: 'active', session: created });
    Bot.postSessionStart(c.id, created);
    res.status(201).json(created);
  } catch (err) { fail(res, err); }
});

// ── GET /:id/sessions/:sid — session, roster and notes ───────────────────────
router.get('/:id/sessions/:sid', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    res.json({ session: s, roster: roster(c.id), notes: notesWithShares(s.id), rolls: listRolls(s.id, true), characters: rollCharacters(c.id) });
  } catch (err) { fail(res, err); }
});

// ── PATCH /:id/sessions/:sid — rename / recap ────────────────────────────────
router.patch('/:id/sessions/:sid', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    const title = req.body?.title !== undefined ? String(req.body.title).trim().slice(0, 120) : s.title;
    const recap = req.body?.recap !== undefined ? String(req.body.recap).slice(0, 10000) : s.recap;
    db.prepare('UPDATE chronicle_sessions SET title = ?, recap = ? WHERE id = ?').run(title, recap, s.id);
    res.json(db.prepare('SELECT * FROM chronicle_sessions WHERE id = ?').get(s.id));
  } catch (err) { fail(res, err); }
});

// ── POST /:id/sessions/:sid/end ──────────────────────────────────────────────
router.post('/:id/sessions/:sid/end', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    if (s.status === 'ended') return res.status(409).json({ error: 'Session already ended.' });
    const recap = req.body?.recap !== undefined ? String(req.body.recap).slice(0, 10000) : s.recap;
    db.prepare("UPDATE chronicle_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP, recap = ? WHERE id = ?")
      .run(recap, s.id);
    const ended = db.prepare('SELECT * FROM chronicle_sessions WHERE id = ?').get(s.id);
    Events.publish(c.id, 'session', { status: 'ended', session: ended });
    Bot.postSessionEnd(c.id, ended, db.prepare('SELECT COUNT(*) n FROM session_rolls WHERE session_id = ? AND hidden = 0 AND voided = 0').get(s.id).n);
    res.json(ended);
  } catch (err) { fail(res, err); }
});

// ── DELETE /:id/sessions/:sid — remove an ended session and its notes ────────
router.delete('/:id/sessions/:sid', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    if (s.status === 'active') return res.status(409).json({ error: 'End the session before deleting it.' });
    db.transaction(() => {
      db.prepare('SELECT * FROM session_notes WHERE session_id = ?').all(s.id).forEach(dropMirror);
      db.prepare('DELETE FROM chronicle_sessions WHERE id = ?').run(s.id);
    })();
    res.json({ deleted: true });
  } catch (err) { fail(res, err); }
});

// ── Notes ────────────────────────────────────────────────────────────────────
router.post('/:id/sessions/:sid/notes', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    const kind = NOTE_KINDS.includes(req.body?.kind) ? req.body.kind : 'note';
    const title = String(req.body?.title || '').trim().slice(0, 200);
    const body  = String(req.body?.body || '').slice(0, 50000);
    if (kind === 'scene' && !title) return res.status(400).json({ error: 'A scene needs a title.' });
    if (kind === 'handout' && !title) return res.status(400).json({ error: 'A handout needs a title.' });
    let noteId;
    db.transaction(() => {
      noteId = db.prepare('INSERT INTO session_notes (session_id, kind, title, body) VALUES (?, ?, ?, ?)')
        .run(s.id, kind, title, kind === 'scene' ? '' : body).lastInsertRowid;
      if (kind === 'handout') {
        syncHandout(c.id, db.prepare('SELECT * FROM session_notes WHERE id = ?').get(noteId),
          validCharIds(c.id, req.body?.character_ids));
      }
    })();
    res.status(201).json(notesWithShares(s.id).find(n => n.id === Number(noteId)));
  } catch (err) { fail(res, err); }
});

router.put('/:id/sessions/:sid/notes/:nid', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    const n = db.prepare('SELECT * FROM session_notes WHERE id = ? AND session_id = ?').get(req.params.nid, s.id);
    if (!n) return res.status(404).json({ error: 'Note not found' });
    const title = req.body?.title !== undefined ? String(req.body.title).trim().slice(0, 200) : n.title;
    const body  = req.body?.body  !== undefined && n.kind !== 'scene' ? String(req.body.body).slice(0, 50000) : n.body;
    if (n.kind !== 'note' && !title) return res.status(400).json({ error: 'A title is required.' });
    db.transaction(() => {
      db.prepare('UPDATE session_notes SET title = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(title, body, n.id);
      if (n.kind === 'handout') {
        const ids = req.body?.character_ids !== undefined ? validCharIds(c.id, req.body.character_ids) : undefined;
        syncHandout(c.id, db.prepare('SELECT * FROM session_notes WHERE id = ?').get(n.id), ids);
      }
    })();
    res.json(notesWithShares(s.id).find(x => x.id === n.id));
  } catch (err) { fail(res, err); }
});

// Post a scene marker to the linked Discord channel (explicit, so half-typed titles never go out)
router.post('/:id/sessions/:sid/notes/:nid/announce', async (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    const n = db.prepare('SELECT * FROM session_notes WHERE id = ? AND session_id = ?').get(req.params.nid, s.id);
    if (!n) return res.status(404).json({ error: 'Note not found' });
    if (n.kind !== 'scene') return res.status(400).json({ error: 'Only scene markers can be announced.' });
    if (!c.discord_channel_id || !Bot.configured()) return res.status(400).json({ error: 'This chronicle is not linked to a Discord channel.' });
    await Bot.postScene(c.id, n.title);
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.delete('/:id/sessions/:sid/notes/:nid', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    const n = db.prepare('SELECT * FROM session_notes WHERE id = ? AND session_id = ?').get(req.params.nid, s.id);
    if (!n) return res.status(404).json({ error: 'Note not found' });
    db.transaction(() => {
      dropMirror(n);
      db.prepare('DELETE FROM session_notes WHERE id = ?').run(n.id);
    })();
    res.json({ deleted: true });
  } catch (err) { fail(res, err); }
});

// ═══════════════════════════ Phase 2: rolling ═══════════════════════════════
const ATTRS = ['strength', 'dexterity', 'stamina', 'charisma', 'manipulation', 'appearance', 'perception', 'intelligence', 'wits'];
const titleize = k => String(k).replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const jsonObj = v => { try { const o = typeof v === 'string' ? JSON.parse(v || '{}') : v; return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; } };

function damagedLevels(ch) {
  let t = []; try { t = JSON.parse(ch.health_track || '[]'); } catch {}
  return Array.isArray(t) ? t.filter(x => x && x !== 'empty').length : 0;
}
function wpCurrent(ch) { return Math.max(0, (ch.willpower || 0) - (ch.willpower_spent || 0)); }

// Everything a roll panel can offer for one character. Keys are what the client
// sends back; the server re-reads the ratings so a client cannot invent dots.
function traitsFor(ch) {
  const out = [];
  ATTRS.forEach(k => out.push({ key: 'attr.' + k, label: titleize(k), group: 'Attributes', value: ch[k] || 0 }));
  [['talents', 'Talents'], ['skills', 'Skills'], ['knowledges', 'Knowledges']].forEach(([col, group]) => {
    Object.entries(jsonObj(ch[col])).forEach(([k, v]) => { if (Number(v) > 0) out.push({ key: 'abil.' + k, label: titleize(k), group, value: Number(v) }); });
  });
  if (ch.character_type !== 'mortal' && ch.character_type !== 'sorcerer' && (ch.arete || 0) > 0) out.push({ key: 'arete', label: 'Arete', group: 'Magick', value: ch.arete });
  Object.entries(jsonObj(ch.spheres)).forEach(([k, v]) => { if (Number(v) > 0) out.push({ key: 'sphere.' + k, label: titleize(k), group: 'Magick', value: Number(v) }); });
  if ((ch.willpower || 0) > 0) out.push({ key: 'willpower', label: 'Willpower', group: 'Other', value: ch.willpower });
  return out;
}
function rollCharacters(chronicleId, userId = null) {
  const rows = db.prepare(`SELECT * FROM characters WHERE chronicle_id = ?${userId ? ' AND user_id = ?' : ''} ORDER BY name`)
    .all(...(userId ? [chronicleId, userId] : [chronicleId]));
  return rows.map(ch => ({
    id: ch.id, name: ch.name, willpower_current: wpCurrent(ch), willpower: ch.willpower || 0,
    wound_penalty: Dice.woundPenalty(damagedLevels(ch)), damaged: damagedLevels(ch), traits: traitsFor(ch),
  }));
}

function shapeRoll(r) {
  return { ...r, pool: jsonObj(r.pool), dice: (() => { try { return JSON.parse(r.dice); } catch { return []; } })(),
           specialty: !!r.specialty, willpower: !!r.willpower, hidden: !!r.hidden, voided: !!r.voided, wp_spent: !!r.wp_spent };
}
function listRolls(sessionId, includeHidden) {
  const rows = db.prepare(`SELECT * FROM session_rolls WHERE session_id = ? ${includeHidden ? '' : 'AND hidden = 0'} ORDER BY id`).all(sessionId);
  return rows.map(shapeRoll);
}

// Storyteller or admin: 'st'. A player with a character in the chronicle: 'player'.
function accessFor(req, res) {
  const c = db.prepare('SELECT * FROM chronicles WHERE id = ?').get(req.params.id);
  if (!c) { res.status(404).json({ error: 'Chronicle not found' }); return null; }
  if (c.user_id === req.session.userId || req.session.role === 'admin') return { c, role: 'st' };
  const mine = db.prepare('SELECT id FROM characters WHERE chronicle_id = ? AND user_id = ?').get(c.id, req.session.userId);
  if (!mine) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return { c, role: 'player' };
}
const activeSession = cid => db.prepare("SELECT * FROM chronicle_sessions WHERE chronicle_id = ? AND status = 'active'").get(cid);

// ── GET /:id/session — the running session as this user may see it ──────────
router.get('/:id/session', (req, res) => {
  try {
    const a = accessFor(req, res); if (!a) return;
    const s = activeSession(a.c.id);
    if (!s) return res.json({ session: null, role: a.role });
    const st = a.role === 'st';
    res.json({
      session: { id: s.id, number: s.number, title: s.title, started_at: s.started_at },
      role: a.role,
      characters: rollCharacters(a.c.id, st ? null : req.session.userId),
      rolls: listRolls(s.id, st),
    });
  } catch (err) { fail(res, err); }
});

// ── POST /:id/session/rolls — make a roll in the running session ────────────
router.post('/:id/session/rolls', (req, res) => {
  try {
    const a = accessFor(req, res); if (!a) return;
    const s = activeSession(a.c.id);
    if (!s) return res.status(409).json({ error: 'No session is running.' });
    const st = a.role === 'st';
    const b = req.body || {};
    const label = String(b.label || '').trim().slice(0, 120);
    const modifier = Math.max(-10, Math.min(10, Math.floor(Number(b.modifier) || 0)));
    const difficulty = Math.max(2, Math.min(10, Math.floor(Number(b.difficulty) || 6)));
    const threshold = Math.max(0, Math.min(10, Math.floor(Number(b.threshold) || 0)));
    const hidden = st && !!b.hidden;

    let ch = null, items = [], wound = 0, specialtyOk = false, rollerName = '';
    if (b.character_id) {
      ch = db.prepare('SELECT * FROM characters WHERE id = ? AND chronicle_id = ?').get(Number(b.character_id), a.c.id);
      if (!ch) return res.status(404).json({ error: 'Character is not in this chronicle.' });
      if (!st && ch.user_id !== req.session.userId) return res.status(403).json({ error: 'That is not your character.' });
      const avail = new Map(traitsFor(ch).map(t => [t.key, t]));
      const keys = Array.isArray(b.traits) ? b.traits.slice(0, 6) : [];
      if (!keys.length) return res.status(400).json({ error: 'Pick at least one trait.' });
      for (const k of keys) {
        const t = avail.get(k);
        if (!t) return res.status(400).json({ error: `Unknown trait: ${String(k).slice(0, 40)}` });
        if (items.some(i => i.key === k)) continue;
        items.push({ key: t.key, label: t.label, value: t.value });
      }
      specialtyOk = items.some(i => i.value >= 4);
      // Wound penalties do not apply to Arete rolls (Chapter Eight, Health chart note)
      if (b.wound !== false && !items.some(i => i.key === 'arete')) wound = Dice.woundPenalty(damagedLevels(ch));
      rollerName = ch.name;
    } else {
      if (!st) return res.status(400).json({ error: 'Choose a character.' });
      const size = Math.floor(Number(b.pool_size));
      if (!(size >= 0 && size <= 50)) return res.status(400).json({ error: 'Pool size must be 0 to 50.' });
      items = [{ key: 'custom', label: 'Dice', value: size }];
      specialtyOk = true;
      rollerName = label || 'Storyteller';
    }
    const specialty = !!b.specialty;
    if (specialty && !st && !specialtyOk) return res.status(400).json({ error: 'A specialty needs a Trait of 4 or higher in the pool.' });

    const wantWp = !!b.willpower;
    if (wantWp && ch && wpCurrent(ch) < 1) return res.status(400).json({ error: `${ch.name} has no Willpower left to spend.` });

    const total = Math.max(0, items.reduce((n, i) => n + i.value, 0) + modifier + wound);
    const result = Dice.roll({ pool: total, difficulty, specialty, willpower: wantWp, threshold });

    let id;
    db.transaction(() => {
      id = db.prepare(`INSERT INTO session_rolls
        (session_id, chronicle_id, character_id, user_id, source, label, roller_name, pool, pool_size, difficulty,
         specialty, willpower, threshold, hidden, dice, successes, ones, outcome, wp_spent)
        VALUES (?, ?, ?, ?, 'web', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(s.id, a.c.id, ch ? ch.id : null, req.session.userId, label, rollerName,
          JSON.stringify({ items, modifier, wound }), total, difficulty, specialty ? 1 : 0, wantWp ? 1 : 0, threshold,
          hidden ? 1 : 0, JSON.stringify(result.dice), result.successes, result.ones, result.outcome,
          wantWp && ch ? 1 : 0).lastInsertRowid;
      if (wantWp && ch) db.prepare('UPDATE characters SET willpower_spent = willpower_spent + 1 WHERE id = ?').run(ch.id);
    })();
    const row = shapeRoll(db.prepare('SELECT * FROM session_rolls WHERE id = ?').get(id));
    row.degree = result.degree;
    Events.publish(a.c.id, 'roll', row, { stOnly: hidden });
    Bot.postRoll(a.c.id, row, s);
    res.status(201).json(row);
  } catch (err) { fail(res, err); }
});

// ── POST /:id/session/rolls/:rid/void — Storyteller, or a player undoing their own latest roll
router.post('/:id/session/rolls/:rid/void', (req, res) => {
  try {
    const a = accessFor(req, res); if (!a) return;
    const r = db.prepare('SELECT * FROM session_rolls WHERE id = ? AND chronicle_id = ?').get(req.params.rid, a.c.id);
    if (!r) return res.status(404).json({ error: 'Roll not found' });
    if (r.voided) return res.status(409).json({ error: 'Roll already voided.' });
    if (a.role !== 'st') {
      const latest = db.prepare('SELECT id FROM session_rolls WHERE session_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 1').get(r.session_id);
      if (r.user_id !== req.session.userId || r.hidden || !latest || latest.id !== r.id) {
        return res.status(403).json({ error: 'You can only undo your own most recent roll.' });
      }
      if (db.prepare("SELECT status FROM chronicle_sessions WHERE id = ?").get(r.session_id).status !== 'active') {
        return res.status(409).json({ error: 'The session has ended.' });
      }
    }
    const reason = String(req.body?.reason || '').trim().slice(0, 200);
    db.transaction(() => {
      db.prepare('UPDATE session_rolls SET voided = 1, void_reason = ? WHERE id = ?').run(reason, r.id);
      // Undo: a voided roll hands back the Willpower it spent
      if (r.wp_spent && r.character_id) db.prepare('UPDATE characters SET willpower_spent = MAX(0, willpower_spent - 1) WHERE id = ?').run(r.character_id);
    })();
    const row = shapeRoll(db.prepare('SELECT * FROM session_rolls WHERE id = ?').get(r.id));
    Events.publish(a.c.id, 'void', row, { stOnly: !!r.hidden });
    Bot.postVoid(a.c.id, row);
    res.json(row);
  } catch (err) { fail(res, err); }
});

// ── GET /:id/session/stream — Server-Sent Events ────────────────────────────
router.get('/:id/session/stream', (req, res) => {
  const a = accessFor(req, res); if (!a) return;
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  res.write('retry: 3000\n\nevent: hello\ndata: {}\n\n');
  const unsub = Events.subscribe(a.c.id, res, a.role === 'st');
  const beat = setInterval(() => { try { res.write(': keepalive\n\n'); } catch {} }, 25000);
  req.on('close', () => { clearInterval(beat); unsub(); });
});

module.exports = router;
