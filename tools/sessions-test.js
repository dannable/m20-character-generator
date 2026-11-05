// Server test for session mode Phase 1. Usage: node tools/sessions-test.js <app dir>
const Module = require('module'); const path = require('path'); const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(process.argv[2]);
class Shim { constructor(f) { this.d = new DatabaseSync(f); }
  prepare(sql) { const st = this.d.prepare(sql); return { get: (...a) => st.get(...a), all: (...a) => st.all(...a), run: (...a) => st.run(...a) }; }
  exec(s) { this.d.exec(s); } pragma(s) { try { this.d.exec('PRAGMA ' + s); } catch {} }
  transaction(fn) { return (...a) => { this.d.exec('BEGIN'); try { const r = fn(...a); this.d.exec('COMMIT'); return r; } catch (e) { this.d.exec('ROLLBACK'); throw e; } }; } }
const orig = Module._load; Module._load = function (req, ...r) { if (req === 'better-sqlite3') return Shim; return orig.call(this, req, ...r); };
process.env.DB_PATH = ':memory:'; process.env.DATA_DIR = require('os').tmpdir() + '/sess-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
const express = require(path.join(root, 'node_modules/express'));
const db = require(path.join(root, 'server/db.js'));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
db.prepare(`INSERT INTO users (username,email,password_hash,role) VALUES ('adm','a@x.co','x','admin'),('st','s@x.co','x','awakened'),('bob','b@x.co','x','awakened')`).run();
const chron = (uid, code, active = 1) => db.prepare(`INSERT INTO chronicles (user_id,name,join_code,is_active) VALUES (?,?,?,?)`).run(uid, 'C' + code, code, active).lastInsertRowid;
const c1 = chron(2, 'AAAAA'), c2 = chron(2, 'BBBBB', 0), c3 = chron(3, 'CCCCC');
const mk = (uid, name, chronId) => db.prepare(`INSERT INTO characters (user_id,name,character_type,chronicle_id,health_track) VALUES (?,?,?,?,?)`)
  .run(uid, name, 'awakened', chronId, JSON.stringify(['empty', 'bashing', 'lethal', 'empty', 'empty', 'empty', 'empty'])).lastInsertRowid;
const mira = mk(3, 'Mira', c1), other = mk(3, 'Stranger', c3);
const app = express(); app.use(express.json());
let sess = { userId: 2, role: 'awakened' }; app.use((req, res, n) => { req.session = sess; n(); });
app.use('/api/chronicles', require(path.join(root, 'server/routes/sessions.js')));
const srv = app.listen(0, async () => {
  const base = 'http://localhost:' + srv.address().port;
  const j = async (m, u, b) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, b: await r.json().catch(() => ({})) }; };
  const P = `/api/chronicles/${c1}/sessions`;
  // permissions
  sess = { userId: 3, role: 'awakened' };
  ok((await j('POST', P, {})).s === 403, 'player cannot start a session');
  ok((await j('GET', P)).s === 403, 'player cannot list sessions');
  sess = { userId: 2, role: 'awakened' };
  ok((await j('POST', `/api/chronicles/${c3}/sessions`, {})).s === 403, 'ST of another chronicle is refused');
  ok((await j('POST', `/api/chronicles/${c2}/sessions`, {})).s === 400, 'inactive chronicle cannot start');
  ok((await j('POST', `/api/chronicles/999/sessions`, {})).s === 404, 'missing chronicle 404');
  // start
  let r = await j('POST', P, { title: 'The Basement' });
  ok(r.s === 201 && r.b.number === 1 && r.b.status === 'active' && r.b.title === 'The Basement', 'start session 1');
  const sid = r.b.id;
  ok((await j('POST', P, {})).s === 409, 'second active session refused');
  // notes
  const N = `${P}/${sid}/notes`;
  r = await j('POST', N, { kind: 'scene', title: 'Scene 1: arrival' });
  ok(r.s === 201 && r.b.kind === 'scene', 'scene marker');
  ok((await j('POST', N, { kind: 'scene', title: '' })).s === 400, 'scene needs a title');
  r = await j('POST', N, { kind: 'note', title: 'Prep', body: 'Secret <b>plot</b>' });
  ok(r.s === 201 && r.b.kind === 'note', 'private note'); const noteId = r.b.id;
  ok(db.prepare('SELECT COUNT(*) n FROM chronicle_notes').get().n === 0, 'private note is not mirrored to chronicle notes');
  r = await j('POST', N, { kind: 'handout', title: 'Letter', body: 'Dear <script>x</script>\n\nSecond para', character_ids: [mira, other] });
  ok(r.s === 201 && r.b.shares.length === 1 && r.b.shares[0].character_id === mira, 'handout shares only chronicle members');
  const hid = r.b.id;
  const cn = db.prepare('SELECT * FROM chronicle_notes').all();
  ok(cn.length === 1 && cn[0].title === 'Letter' && !/<script/.test(cn[0].body) && /<p>Second para<\/p>/.test(cn[0].body), 'handout mirrored as escaped HTML: ' + cn[0].body);
  ok(db.prepare('SELECT COUNT(*) n FROM chronicle_note_shares WHERE note_id = ?').get(cn[0].id).n === 1, 'share row exists for the player view');
  r = await j('PUT', `${N}/${hid}`, { title: 'Letter v2', character_ids: [] });
  ok(r.s === 200 && r.b.shares.length === 0, 'unshare handout');
  ok(db.prepare('SELECT title FROM chronicle_notes').get().title === 'Letter v2', 'mirror title updated');
  r = await j('PUT', `${N}/${noteId}`, { body: 'Updated' });
  ok(r.s === 200 && r.b.body === 'Updated' && r.b.title === 'Prep', 'autosave body only');
  // detail + roster
  r = await j('GET', `${P}/${sid}`);
  ok(r.s === 200 && r.b.notes.length === 3 && r.b.roster.length === 1 && r.b.roster[0].name === 'Mira' && r.b.roster[0].health_damaged === 2, 'detail has notes and roster (damage 2)');
  ok((await j('GET', `/api/chronicles/${c3}/sessions/${sid}`)).s === 403, 'cross-chronicle read refused');
  ok((await j('DELETE', `${P}/${sid}`)).s === 409, 'active session cannot be deleted');
  // end
  r = await j('POST', `${P}/${sid}/end`, { recap: 'They found the letter.' });
  ok(r.s === 200 && r.b.status === 'ended' && r.b.ended_at && r.b.recap === 'They found the letter.', 'end session');
  ok((await j('POST', `${P}/${sid}/end`, {})).s === 409, 'cannot end twice');
  r = await j('POST', P, {});
  ok(r.s === 201 && r.b.number === 2, 'next session is number 2');
  ok((await j('POST', `${P}/${r.b.id}/end`, {})).s === 200, 'end session 2');
  r = await j('GET', P);
  ok(r.b.length === 2 && r.b[0].number === 2, 'list newest first');
  // delete cleans the mirror
  ok((await j('DELETE', `${P}/${sid}`)).s === 200, 'delete ended session');
  ok(db.prepare('SELECT COUNT(*) n FROM chronicle_notes').get().n === 0, 'handout mirror removed with session');
  // admin allowed
  sess = { userId: 1, role: 'admin' };
  ok((await j('GET', P)).s === 200, 'admin can read');
  // chronicle delete cascades
  db.prepare('DELETE FROM chronicles WHERE id = ?').run(c1);
  ok(db.prepare('SELECT COUNT(*) n FROM chronicle_sessions').get().n === 0, 'sessions cascade with chronicle');
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); srv.close(); process.exit(fails ? 1 : 0);
});
