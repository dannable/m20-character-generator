// Server test for session mode Phase 2 (rolling). Usage: node tools/session-rolls-test.js <app dir>
const Module = require('module'); const path = require('path'); const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(process.argv[2]);
class Shim { constructor(f) { this.d = new DatabaseSync(f); }
  prepare(sql) { const st = this.d.prepare(sql); return { get: (...a) => st.get(...a), all: (...a) => st.all(...a), run: (...a) => st.run(...a) }; }
  exec(s) { this.d.exec(s); } pragma(s) { try { this.d.exec('PRAGMA ' + s); } catch {} }
  transaction(fn) { return (...a) => { this.d.exec('BEGIN'); try { const r = fn(...a); this.d.exec('COMMIT'); return r; } catch (e) { this.d.exec('ROLLBACK'); throw e; } }; } }
const orig = Module._load; Module._load = function (req, ...r) { if (req === 'better-sqlite3') return Shim; return orig.call(this, req, ...r); };
process.env.DB_PATH = ':memory:'; process.env.DATA_DIR = require('os').tmpdir() + '/roll-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
const express = require(path.join(root, 'node_modules/express'));
const db = require(path.join(root, 'server/db.js'));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
db.prepare(`INSERT INTO users (username,email,password_hash,role) VALUES ('adm','a@x.co','x','admin'),('st','s@x.co','x','awakened'),('bob','b@x.co','x','awakened'),('eve','e@x.co','x','awakened')`).run();
const chron = db.prepare(`INSERT INTO chronicles (user_id,name,join_code) VALUES (2,'C','AAAAA')`).run().lastInsertRowid;
const mk = (uid, name, o = {}) => db.prepare(`INSERT INTO characters (user_id,name,character_type,chronicle_id,dexterity,wits,talents,skills,spheres,arete,willpower,health_track) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
  .run(uid, name, 'awakened', o.chron === undefined ? chron : o.chron, 3, 2, JSON.stringify({ alertness: 4 }), JSON.stringify({ firearms: 2 }), JSON.stringify({ forces: 3 }), 4, 5,
    JSON.stringify(o.track || ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'])).lastInsertRowid;
const mira = mk(3, 'Mira'), hurt = mk(3, 'Hurt', { track: ['bashing', 'bashing', 'lethal', 'lethal', 'empty', 'empty', 'empty'] }), outsider = mk(4, 'Outsider', { chron: null });
const app = express(); app.use(express.json());
app.use((req, res, n) => { const u = { 1: { userId: 1, role: 'admin' }, 2: { userId: 2, role: 'awakened' }, 3: { userId: 3, role: 'awakened' }, 4: { userId: 4, role: 'awakened' } }; req.session = u[req.headers['x-user'] || 2]; n(); });
app.use('/api/chronicles', require(path.join(root, 'server/routes/sessions.js')));
const srv = app.listen(0, async () => {
  const base = 'http://localhost:' + srv.address().port;
  const j = async (u, m, b, who = 2) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', 'x-user': String(who) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, b: await r.json().catch(() => ({})) }; };
  const C = `/api/chronicles/${chron}`;
  let r = await j(`${C}/session`, 'GET', null, 3);
  ok(r.s === 200 && r.b.session === null, 'player sees no session before one starts');
  ok((await j(`${C}/session`, 'GET', null, 4)).s === 403, 'a user with no character in the chronicle is refused');
  ok((await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.dexterity'] }, 3)).s === 409, 'cannot roll with no active session');
  const sid = (await j(`${C}/sessions`, 'POST', { title: 'T' })).b.id;
  // live streams: one ST, one player
  const listen = async who => { const ctl = new AbortController(); const res = await fetch(`${base}${C}/session/stream`, { headers: { 'x-user': String(who) }, signal: ctl.signal }); const got = []; (async () => { const rd = res.body.getReader(); const dec = new TextDecoder(); try { for (;;) { const { value, done } = await rd.read(); if (done) break; dec.decode(value).split('\n\n').forEach(c => { const m = /event: (\w+)/.exec(c); if (m) got.push(m[1]); }); } } catch {} })(); return { got, stop: () => ctl.abort(), status: res.status, ctype: res.headers.get('content-type') }; };
  const stStream = await listen(2), plStream = await listen(3);
  ok(stStream.status === 200 && /event-stream/.test(stStream.ctype), 'stream is text/event-stream');
  ok((await fetch(`${base}${C}/session/stream`, { headers: { 'x-user': '4' } })).status === 403, 'stream refused to outsiders');
  r = await j(`${C}/session`, 'GET', null, 3);
  ok(r.b.session && r.b.characters.length === 2 && r.b.characters.every(c => c.id !== outsider), 'player sees active session and only their own characters');
  const tkeys = r.b.characters.find(c => c.id === mira).traits.map(t => t.key);
  ok(['attr.dexterity', 'abil.alertness', 'abil.firearms', 'arete', 'sphere.forces', 'willpower'].every(k => tkeys.includes(k)), 'trait list: ' + tkeys.join(','));
  // plain roll
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.dexterity', 'abil.firearms'], difficulty: 7 }, 3);
  ok(r.s === 201 && r.b.pool_size === 5 && r.b.dice.length === 5 && r.b.difficulty === 7 && r.b.pool.items.length === 2, 'Dexterity 3 + Firearms 2 = 5 dice');
  ok(r.b.dice.every(d => d >= 1 && d <= 10), 'server rolled the dice');
  // client cannot invent dots
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['abil.melee'] }, 3);
  ok(r.s === 400, 'trait the character lacks is refused');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.dexterity'], pool_size: 40 }, 3);
  ok(r.s === 201 && r.b.pool_size === 3, 'client-supplied pool_size is ignored for character rolls');
  // ownership
  ok((await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.wits'] }, 4)).s === 403, 'outsider cannot roll');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: outsider, traits: ['attr.wits'] }, 3);
  ok(r.s === 404, 'character outside the chronicle refused');
  ok((await j(`${C}/session/rolls`, 'POST', { pool_size: 5 }, 3)).s === 400, 'player cannot make a custom pool roll');
  // specialty needs a 4+ trait
  ok((await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.dexterity', 'abil.firearms'], specialty: true }, 3)).s === 400, 'specialty refused with no trait at 4+');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.dexterity', 'abil.alertness'], specialty: true }, 3);
  ok(r.s === 201 && r.b.specialty === true && r.b.pool_size === 7, 'specialty allowed with Alertness 4');
  // wound penalty: 4 damaged levels = -2
  r = await j(`${C}/session/rolls`, 'POST', { character_id: hurt, traits: ['attr.dexterity', 'abil.alertness'] }, 3);
  ok(r.b.pool_size === 5 && r.b.pool.wound === -2, 'wound penalty -2 applied: pool ' + r.b.pool_size);
  r = await j(`${C}/session/rolls`, 'POST', { character_id: hurt, traits: ['attr.dexterity', 'abil.alertness'], wound: false }, 3);
  ok(r.b.pool_size === 7 && r.b.pool.wound === 0, 'wound toggle off removes the penalty');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: hurt, traits: ['arete'] }, 3);
  ok(r.b.pool_size === 4 && r.b.pool.wound === 0, 'Arete rolls ignore wound penalties');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.dexterity'], modifier: -2 }, 3);
  ok(r.b.pool_size === 1, 'dice modifier applied');
  // Willpower: spends a point, refunded on undo
  const wpOf = id => { const c = db.prepare('SELECT willpower, willpower_spent FROM characters WHERE id = ?').get(id); return c.willpower - c.willpower_spent; };
  ok(wpOf(mira) === 5, 'Willpower 5 before');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.wits'], willpower: true, difficulty: 10 }, 3);
  const wpRoll = r.b;
  ok(r.s === 201 && r.b.willpower === true && r.b.successes >= 1 && r.b.wp_spent === true && wpOf(mira) === 4, 'Willpower roll gets an automatic success and spends a point');
  r = await j(`${C}/session/rolls/${wpRoll.id}/void`, 'POST', { reason: 'oops' }, 3);
  ok(r.s === 200 && r.b.voided === true && wpOf(mira) === 5, 'undo refunds the Willpower point');
  ok((await j(`${C}/session/rolls/${wpRoll.id}/void`, 'POST', {}, 2)).s === 409, 'cannot void twice (no double refund)');
  ok(wpOf(mira) === 5, 'still 5 after the double-void attempt');
  db.prepare('UPDATE characters SET willpower_spent = willpower WHERE id = ?').run(mira);
  ok((await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.wits'], willpower: true }, 3)).s === 400, 'cannot spend Willpower you do not have');
  db.prepare('UPDATE characters SET willpower_spent = 0 WHERE id = ?').run(mira);
  // Storyteller: NPC roll, hidden roll
  r = await j(`${C}/session/rolls`, 'POST', { pool_size: 6, label: 'Guard', difficulty: 8 }, 2);
  ok(r.s === 201 && r.b.character_id === null && r.b.roller_name === 'Guard' && r.b.pool_size === 6, 'ST NPC roll');
  r = await j(`${C}/session/rolls`, 'POST', { pool_size: 4, label: 'Secret', hidden: true }, 2);
  const hid = r.b.id; ok(r.s === 201 && r.b.hidden === true, 'ST hidden roll');
  r = await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.wits'], hidden: true }, 3);
  ok(r.s === 201 && r.b.hidden === false, 'a player cannot hide a roll');
  r = await j(`${C}/session`, 'GET', null, 3);
  ok(!r.b.rolls.some(x => x.hidden) && r.b.rolls.length > 5, 'player log excludes hidden rolls');
  r = await j(`${C}/session`, 'GET', null, 2);
  ok(r.b.rolls.some(x => x.id === hid), 'ST log includes hidden rolls');
  ok((await j(`${C}/sessions/${sid}`, 'GET', null, 3)).s === 403, 'player cannot use the ST detail route');
  r = await j(`${C}/sessions/${sid}`, 'GET', null, 2);
  ok(r.b.rolls.some(x => x.id === hid) && r.b.characters.length === 2, 'ST detail includes rolls and roll characters');
  // undo permissions
  const mine = (await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.wits'] }, 3)).b;
  ok((await j(`${C}/session/rolls/${hid}/void`, 'POST', {}, 3)).s === 403, 'player cannot void a hidden/ST roll');
  await j(`${C}/session/rolls`, 'POST', { pool_size: 2 }, 2);
  ok((await j(`${C}/session/rolls/${mine.id}/void`, 'POST', {}, 3)).s === 403, 'player cannot undo once a later roll exists');
  ok((await j(`${C}/session/rolls/${mine.id}/void`, 'POST', { reason: 'wrong target' }, 2)).s === 200, 'ST can void any roll');
  await new Promise(r => setTimeout(r, 200));
  ok(stStream.got.filter(x => x === 'roll').length > plStream.got.filter(x => x === 'roll').length, 'ST stream got hidden roll events the player stream did not');
  ok(plStream.got.includes('void') && plStream.got.includes('roll'), 'player stream got roll and void events: ' + plStream.got.join(','));
  // session end publishes and blocks rolling
  await j(`${C}/sessions/${sid}/end`, 'POST', {}, 2);
  await new Promise(r => setTimeout(r, 100));
  ok(plStream.got.includes('session'), 'session events reach the player stream');
  ok((await j(`${C}/session/rolls`, 'POST', { character_id: mira, traits: ['attr.wits'] }, 3)).s === 409, 'no rolling after the session ends');
  stStream.stop(); plStream.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); srv.close(); process.exit(fails ? 1 : 0);
});
