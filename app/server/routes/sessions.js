// Session mode (Phase 1): chronicle sessions and Storyteller session notes.
// Mounted at /api/chronicles, after the chronicles router.
const express = require('express');
const db      = require('../db');
const router  = express.Router();

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
    res.status(201).json(db.prepare('SELECT * FROM chronicle_sessions WHERE id = ?').get(id));
  } catch (err) { fail(res, err); }
});

// ── GET /:id/sessions/:sid — session, roster and notes ───────────────────────
router.get('/:id/sessions/:sid', (req, res) => {
  try {
    const c = loadChronicle(req, res); if (!c) return;
    const s = loadSession(req, res, c); if (!s) return;
    res.json({ session: s, roster: roster(c.id), notes: notesWithShares(s.id) });
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
    res.json(db.prepare('SELECT * FROM chronicle_sessions WHERE id = ?').get(s.id));
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

module.exports = router;
