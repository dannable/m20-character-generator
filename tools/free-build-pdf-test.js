// Free Build appears on the PDF character record. Usage:
//   node tools/free-build-pdf-test.js app
// Builds the PDF in-process (db stubbed, same trick as sorcerer-pdf-test.js)
// and reads the text back with pdftotext.
'use strict';
const Module = require('module'); const path = require('path');
const orig = Module._load;
Module._load = function (req, parent, ...r) { if (/\/db$/.test(req)) return { prepare: () => ({ get: () => ({}) }) }; return orig.call(this, req, parent, ...r); };
const root = path.resolve(process.argv[2] || 'app');
const { buildCharacterPDF } = require(path.join(root, 'server/routes/export.js'));
const BuildXP = require(path.join(root, 'public/js/build-xp.js'));
const fs = require('fs'); const os = require('os'); const { execFileSync } = require('child_process');

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); c ? pass++ : fail++; };

const base = {
  name: 'Free Built', player: 'Dave', chronicle: 'Test', concept: 'Anything at all',
  character_type: 'awakened', affiliation: 'Traditions', tradition: 'Order of Hermes',
  essence: 'Questing', nature: 'Architect', demeanor: 'Pedagogue',
  strength: 5, dexterity: 4, stamina: 4, charisma: 3, manipulation: 3, appearance: 3,
  perception: 4, intelligence: 5, wits: 4,
  talents: { alertness: 5, awareness: 4 }, skills: { firearms: 4 }, knowledges: { occult: 5 },
  backgrounds: { library: 5, resources: 4 }, spheres: { forces: 5, prime: 4, correspondence: 3 },
  affinity_sphere: 'forces', arete: 5, willpower: 9, quintessence: 0,
  merits: {}, flaws: {}, specialties: {}, custom_ability_names: {}, instruments: [], wonders: [],
  resonance: [{ description: 'Scorched', rating: 2 }],
  description: '', notes: '',
};

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-pdf-'));
  async function text(c) {
    const bytes = await buildCharacterPDF(c);
    const f = path.join(dir, 'c.pdf');
    fs.writeFileSync(f, bytes);
    return execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8' });
  }

  const priced = BuildXP.compute({ ...base, build_mode: 'free', build_freebies: 0 }, { freebies: false });
  const t = await text({ ...base, build_mode: 'free', build_freebies: 0 });
  ok(/Free Build/.test(t), 'the record says it is a Free Build');
  ok(/no creation budgets or caps/i.test(t), 'and that no budgets or caps applied');
  ok(t.includes(String(priced.total)), `the XP total is on the sheet (${priced.total})`);
  ok(/no freebies/i.test(t), 'with freebies off, it says so');
  ok(/M20 p\. 336/.test(t), 'and cites where the rates come from');

  const t2 = await text({ ...base, build_mode: 'free', build_freebies: 1 });
  const priced2 = BuildXP.compute({ ...base, build_mode: 'free', build_freebies: 1 }, { freebies: true });
  ok(/after \d+ from freebies/.test(t2), 'with freebies on, it reports what they covered');
  ok(t2.includes(String(priced2.total)), `and the lower total (${priced2.total} vs ${priced.total})`);
  ok(priced2.total < priced.total, 'which really is lower');

  const t3 = await text(base);                       // no build_mode at all
  ok(!/Free Build/.test(t3), 'an ordinary character record says nothing about Free Build');
  ok(/Nature/.test(t3) && /Demeanor/.test(t3), 'and is otherwise unchanged');

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
