const Module = require('module'); const path = require('path'); const { DatabaseSync } = require('node:sqlite');
const root = process.argv[2];
class Shim { constructor(f) { this.d = new DatabaseSync(f); }
  prepare(sql) { const st = this.d.prepare(sql); return { get: (...a) => st.get(...a), all: (...a) => st.all(...a), run: (...a) => st.run(...a) }; }
  exec(s) { this.d.exec(s); } pragma(s) { try { this.d.exec('PRAGMA ' + s); } catch {} }
  transaction(fn) { return (...a) => { this.d.exec('BEGIN'); try { const r = fn(...a); this.d.exec('COMMIT'); return r; } catch (e) { this.d.exec('ROLLBACK'); throw e; } }; } }
const orig = Module._load; Module._load = function (req, ...r) { if (req === 'better-sqlite3') return Shim; return orig.call(this, req, ...r); };
process.env.DB_PATH = ':memory:'; process.env.DATA_DIR = require('os').tmpdir() + '/wiz-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
const express = require(path.join(root, 'node_modules/express'));
const db = require(path.join(root, 'server/db.js'));
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
db.prepare(`INSERT INTO users (username,email,password_hash,role) VALUES ('adm','a@x.co','x','admin'),('bob','b@x.co','x','awakened')`).run();
const app = express(); app.use(express.json());
let sess = { userId: 2, role: 'awakened' }; app.use((req, res, n) => { req.session = sess; n(); });
app.use('/api/wizard', require(path.join(root, 'server/routes/wizard.js')));
app.use('/api/admin', require(path.join(root, 'server/routes/admin.js')));
app.use('/api/settings', require(path.join(root, 'server/routes/settings.js')));
const srv = app.listen(0, async () => {
  const base = 'http://localhost:' + srv.address().port;
  const j = async (m, u, b) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, b: await r.json().catch(() => ({})) }; };
  let r = await j('GET', '/api/wizard'); ok(r.b.enabled === true && r.b.messages.length === 24, 'seeded 24 messages for user: ' + r.b.messages.length);
  r = await j('GET', '/api/admin/wizard-messages'); ok(r.s === 403, 'non-admin blocked from admin list: ' + r.s);
  r = await j('POST', '/api/admin/wizard-messages', { text: 'x' }); ok(r.s === 403, 'non-admin blocked from add');
  r = await j('PUT', '/api/settings', { wizard_enabled: false }); ok(r.s === 200, 'user turns Darrell off');
  r = await j('GET', '/api/wizard'); ok(r.b.enabled === false && r.b.messages.length === 0, 'off: enabled false, no messages');
  r = await j('GET', '/api/settings'); ok(r.b.wizard_enabled === 0, 'settings reports wizard_enabled 0');
  await j('PUT', '/api/settings', { wizard_enabled: true });
  sess = { userId: 1, role: 'admin' };
  r = await j('GET', '/api/admin/wizard-messages'); ok(r.s === 200 && r.b.messages.length === 24, 'admin lists 24');
  r = await j('POST', '/api/admin/wizard-messages', { text: '  Hello   there!  ' }); ok(r.s === 201 && r.b.text === 'Hello there!', 'add trims/collapses: ' + r.b.text);
  const id = r.b.id;
  r = await j('POST', '/api/admin/wizard-messages', { text: '   ' }); ok(r.s === 400, 'empty rejected');
  r = await j('POST', '/api/admin/wizard-messages', { text: 'a'.repeat(201) }); ok(r.s === 400, 'too long rejected');
  r = await j('PUT', '/api/admin/wizard-messages/' + id, { text: 'Edited!' }); ok(r.s === 200, 'edit');
  r = await j('PUT', '/api/admin/wizard-messages/' + id, { enabled: false });
  sess = { userId: 2, role: 'awakened' };
  r = await j('GET', '/api/wizard'); ok(r.b.messages.length === 24 && !r.b.messages.includes('Edited!'), 'disabled message hidden from users');
  sess = { userId: 1, role: 'admin' };
  await j('PUT', '/api/admin/wizard-messages/' + id, { enabled: true });
  sess = { userId: 2, role: 'awakened' }; r = await j('GET', '/api/wizard'); ok(r.b.messages.includes('Edited!'), 'enabled message shows');
  sess = { userId: 1, role: 'admin' };
  r = await j('DELETE', '/api/admin/wizard-messages/' + id); ok(r.s === 200, 'delete');
  r = await j('DELETE', '/api/admin/wizard-messages/' + id); ok(r.s === 404, 'delete again 404');
  r = await j('PUT', '/api/admin/wizard-messages/9999', { text: 'x' }); ok(r.s === 404, 'edit missing 404');
  for (const m of (await j('GET', '/api/admin/wizard-messages')).b.messages) await j('DELETE', '/api/admin/wizard-messages/' + m.id);
  r = await j('GET', '/api/wizard'); ok(r.b.messages.length === 0, 'emptied list stays empty');
  srv.close(); process.exit(0);
});
