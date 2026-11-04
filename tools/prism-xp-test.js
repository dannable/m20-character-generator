// Server test for Prism Phase 6 XP spends. Usage: node tools/prism-xp-test.js <app dir>
const Module = require('module'); const path = require('path'); const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(process.argv[2]);
class Shim { constructor(f) { this.d = new DatabaseSync(f); }
  prepare(sql) { const st = this.d.prepare(sql); return { get: (...a) => st.get(...a), all: (...a) => st.all(...a), run: (...a) => st.run(...a) }; }
  exec(s) { this.d.exec(s); } pragma(s) { try { this.d.exec('PRAGMA ' + s); } catch {} }
  transaction(fn) { return (...a) => { this.d.exec('BEGIN'); try { const r = fn(...a); this.d.exec('COMMIT'); return r; } catch (e) { this.d.exec('ROLLBACK'); throw e; } }; } }
const orig = Module._load; Module._load = function (req, ...r) { if (req === 'better-sqlite3') return Shim; return orig.call(this, req, ...r); };
process.env.DB_PATH = ':memory:'; process.env.DATA_DIR = require('os').tmpdir() + '/pxp-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
const express = require(path.join(root, 'node_modules/express'));
const db = require(path.join(root, 'server/db.js'));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
db.prepare(`INSERT INTO users (username,email,password_hash,role) VALUES ('adm','a@x.co','x','admin'),('bob','b@x.co','x','awakened')`).run();
const mk = (o) => db.prepare(`INSERT INTO characters (user_id,name,character_type,focus_mode,tenets,practice_ratings,practice_specialties,paradigm_preset,talents,skills,knowledges,arete,xp_earned,xp_log,chronicle_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  .run(2, o.name || 'P', 'awakened', o.mode || 'prism', JSON.stringify(o.tenets || { metaphysical: 'rational_universe', personal: 'i_am_special', ascension: 'full_knowledge' }), JSON.stringify(o.ratings || {}), '{}', o.preset || '',
    JSON.stringify(o.talents || {}), JSON.stringify(o.skills || { crafts: 2, science: 2 }), JSON.stringify(o.knowledges || { medicine: 2, esoterica: 1 }), o.arete || 3, o.xp ?? 50, '[]', o.chron || null).lastInsertRowid;
const app = express(); app.use(express.json());
let sess = { userId: 2, role: 'awakened' }; app.use((req, res, n) => { req.session = sess; n(); });
app.use('/api/characters', require(path.join(root, 'server/routes/characters.js')));
const srv = app.listen(0, async () => {
  const base = 'http://localhost:' + srv.address().port;
  const j = async (m, u, b) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, b: await r.json().catch(() => ({})) }; };
  const row = id => db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
  const prac = (id, from, cost, extra = {}) => ({ trait_group: 'practice', trait_col: 'practice_ratings', trait_key: id, trait_label: id, from, to: from + 1, cost, ...extra });
  let id = mk({});
  // ── practices ──
  let r = await j('POST', `/api/characters/${id}/xp/spend`, prac('alchemy', 0, 3));
  ok(r.s === 200, 'new practice costs 3: ' + r.s + ' ' + (r.b.error || ''));
  ok(JSON.parse(row(id).practice_ratings).alchemy === 1, 'rating stored');
  ok(/Alchemy 1/.test(row(id).practice), 'practice text projected: ' + row(id).practice);
  r = await j('POST', `/api/characters/${id}/xp/spend`, prac('alchemy', 1, 3));
  ok(r.s === 400 && /Wrong cost/.test(r.b.error), 'raise 1->2 must cost 1, not 3: ' + r.b.error);
  r = await j('POST', `/api/characters/${id}/xp/spend`, prac('alchemy', 1, 1));
  ok(r.s === 200, 'raise 1->2 costs 1 (abilities 7 dots >= 4)');
  r = await j('POST', `/api/characters/${id}/xp/spend`, prac('alchemy', 2, 2));
  ok(r.s === 200, 'raise 2->3 costs 2 (needs 6, has 7)');
  r = await j('POST', `/api/characters/${id}/xp/spend`, prac('alchemy', 3, 3));
  ok(r.s === 400 && /Associated Abilities/.test(r.b.error), 'raise 3->4 blocked by ability requirement (needs 8): ' + r.b.error);
  r = await j('POST', `/api/characters/${id}/xp/spend`, prac('animalism', 1, 3));
  ok(r.s === 400, 'rating mismatch rejected: ' + r.b.error);
  r = await j('POST', `/api/characters/${id}/xp/spend`, prac('nonsense', 0, 3));
  ok(r.s === 400 && /Unknown Practice/.test(r.b.error), 'unknown practice rejected');
  r = await j('POST', `/api/characters/${id}/xp/spend`, { ...prac('alchemy', 3, 3), trait_group: 'ability' });
  ok(r.s === 400, 'practice_ratings via a non-Prism group is refused: ' + r.b.error);
  // undo restores the previous rating
  const log = JSON.parse(row(id).xp_log); const idx = log.length - 1;
  r = await j('DELETE', `/api/characters/${id}/xp/${idx}`);
  ok(r.s === 200 && JSON.parse(row(id).practice_ratings).alchemy === 2, 'undo 2->3 restores 2');
  // undo the first purchase entirely
  r = await j('DELETE', `/api/characters/${id}/xp/1`); r = await j('DELETE', `/api/characters/${id}/xp/0`);
  ok(!('alchemy' in JSON.parse(row(id).practice_ratings)), 'undoing the purchase removes the practice: ' + row(id).practice_ratings);
  // insufficient XP
  const poor = mk({ xp: 2 });
  r = await j('POST', `/api/characters/${poor}/xp/spend`, prac('alchemy', 0, 3));
  ok(r.s === 400 && /Not enough XP/.test(r.b.error), 'not enough XP: ' + r.b.error);
  // core-mode characters cannot buy practices
  const core = mk({ mode: 'core' });
  r = await j('POST', `/api/characters/${core}/xp/spend`, prac('alchemy', 0, 3));
  ok(r.s === 400 && /Prism/.test(r.b.error), 'core character refused');
  // admin bypasses the ability requirement
  const weak = mk({ skills: {}, knowledges: {} });
  r = await j('POST', `/api/characters/${weak}/xp/spend`, prac('alchemy', 0, 3));
  ok(r.s === 400, 'no abilities: blocked for the owner');
  sess = { userId: 1, role: 'admin' };
  r = await j('POST', `/api/characters/${weak}/xp/spend`, prac('alchemy', 0, 3));
  ok(r.s === 200, 'admin override allowed');
  sess = { userId: 2, role: 'awakened' };
  // chronicle rule: ability requirement softened; allowed practices
  const ST = db.prepare(`INSERT INTO chronicles (user_id,name,join_code,rules) VALUES (1,'C','ABCDE',?)`).run(JSON.stringify({ prism: { enforceAbilityRequirement: false, allowedPractices: ['alchemy'] } })).lastInsertRowid;
  const inChron = mk({ skills: {}, knowledges: {}, chron: ST });
  r = await j('POST', `/api/characters/${inChron}/xp/spend`, prac('alchemy', 0, 3));
  ok(r.s === 200, 'chronicle softens the ability requirement: ' + (r.b.error || ''));
  r = await j('POST', `/api/characters/${inChron}/xp/spend`, prac('animalism', 0, 3));
  ok(r.s === 400 && /not allowed/.test(r.b.error), 'chronicle allowedPractices respected: ' + r.b.error);
  // ── tenets ──
  const tn = mk({ preset: 'whatever' });
  const ten = (cat, from, to, cost) => ({ trait_group: 'tenet', trait_col: 'tenets', trait_key: cat, trait_label: 'T', from: 0, to: 1, cost, tenet_from: from, tenet: to });
  const socialIds = require(path.join(root, 'public/js/data-prism.js')).TENETS.filter(t => t.category === 'social_role').map(t => t.id);
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('social_role', '', socialIds[0], 0));
  ok(r.s === 200, 'adding a tenet to an empty category is free (' + socialIds[0] + '): ' + (r.b.error || ''));
  ok(JSON.parse(row(tn).tenets).social_role === socialIds[0], 'tenet stored');
  ok(row(tn).paradigm_preset === '', 'book preset detached after a tenet change');
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('metaphysical', 'rational_universe', 'divine_is_real', 3));
  ok(r.s === 400 && /Wrong cost/.test(r.b.error), 'replacing costs the tenet count (4 now): ' + r.b.error);
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('metaphysical', 'rational_universe', 'divine_is_real', 4));
  ok(r.s === 200 && JSON.parse(row(tn).tenets).metaphysical === 'divine_is_real', 'replace costs 4 with 4 tenets: ' + (r.b.error || ''));
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('metaphysical', 'rational_universe', 'divine_is_real', 4));
  ok(r.s === 400, 'stale tenet_from refused');
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('metaphysical', 'divine_is_real', '', 4));
  ok(r.s === 400 && /required/.test(r.b.error), 'cannot remove a required category');
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('metaphysical', 'divine_is_real', socialIds[0], 4));
  ok(r.s === 400, 'tenet from another category refused: ' + r.b.error);
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('social_role', socialIds[0], '', 4));
  ok(r.s === 200 && !('social_role' in JSON.parse(row(tn).tenets)), 'remove optional tenet costs 4: ' + (r.b.error || ''));
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('social_role', '', socialIds[0], 0));
  r = await j('POST', `/api/characters/${tn}/xp/spend`, ten('openness', '', '', 0));
  ok(r.s === 400, 'no-op refused');
  // undo the replace restores tenet and preset
  const lg = JSON.parse(row(tn).xp_log);
  const ri = lg.findIndex(e => e.trait_key === 'metaphysical');
  // undo later entries first (remove optional tenet, re-add)
  for (let i = lg.length - 1; i >= ri; i--) { const x = await j('DELETE', `/api/characters/${tn}/xp/${i}`); if (x.s !== 200) console.log('undo', i, x.b); }
  ok(JSON.parse(row(tn).tenets).metaphysical === 'rational_universe', 'undo restores the original tenet');
  // arete cap: removing a tenet that would drop below the arete's cap
  const hi = mk({ arete: 4, tenets: { metaphysical: 'rational_universe', personal: 'i_am_special', ascension: 'full_knowledge', social_role: socialIds[0] }, xp: 50 });
  r = await j('POST', `/api/characters/${hi}/xp/spend`, ten('social_role', socialIds[0], '', 4));
  ok(r.s === 400 && /Arete/.test(r.b.error), 'removal below the Arete cap refused: ' + r.b.error);
  srv.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
});
