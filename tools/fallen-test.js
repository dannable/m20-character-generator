// Smoke test for the Nephandi path (M20 Book of the Fallen).
//
//   node tools/fallen-test.js <repoRoot> [outDir]
//
// Covers the catalogue, the server-side normaliser, the shared validator and a
// PDF render of a finished Nephandus. Stubs ../db so nothing touches a database.
// With an outDir, the rendered PDFs are written there.
const Module = require('module');
const path = require('path');
const fs = require('fs');

const orig = Module._load;
Module._load = function (req, parent, ...r) {
  if (/\/db$/.test(req)) return { prepare: () => ({ get: () => ({}), run: () => ({}) }), exec: () => {} };
  return orig.call(this, req, parent, ...r);
};

const root = process.argv[2] || path.join(__dirname, '..');
const outDir = process.argv[3] || null;
const FALLEN = require(path.join(root, 'app/public/js/data-fallen.js'));
const M20 = require(path.join(root, 'app/public/js/data.js'));
const N = require(path.join(root, 'app/server/nephandi.js'));
const V = require(path.join(root, 'app/public/js/validate-character.js'));
const { buildCharacterPDF } = require(path.join(root, 'app/server/routes/export.js'));

let checks = 0;
function eq(got, want, msg) {
  checks++;
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { console.error(`FAIL ${msg}\n  got  ${a}\n  want ${b}`); process.exitCode = 1; }
}
const codes = o => [...o.errors.map(e => 'E:' + e.code), ...o.warnings.map(w => 'W:' + w.code)].sort();

// ── Catalogue ────────────────────────────────────────────────────────────────
eq(FALLEN.ORIGINS.length, 3, 'three origins');
eq(FALLEN.SECTS.length, 8, 'eight sects');
eq(FALLEN.ESSENCES.length, 4, 'four Abyssal Essences');
eq(FALLEN.PACT_LEVELS.length, 10, 'ten pact levels');
eq(FALLEN.meritRows().length, 20, '4 Merits + 16 Investments');
eq(FALLEN.flawRows().length, 4, 'four Flaws');

// Every Sphere in data.js maps to a Qlipha, and none of the nine is renamed.
eq(M20.SPHERES.filter(s => !FALLEN.qliphaForSphere(s.id)).map(s => s.id), [], 'all nine Spheres mapped');
eq(FALLEN.qliphaForSphere('time').qlipha, 'A’arab Zaraq', 'Time -> A’arab Zaraq');
eq(FALLEN.SPHERE_QLIPHA.filter(q => q.rumoured).map(q => q.sphere), ['absolute'], 'only The Absolute is rumoured');

// The four Abyssal Essences cover the four M20 Essences exactly.
eq(FALLEN.ESSENCES.map(e => e.m20Essence).sort(), M20.ESSENCES.map(e => e.name).sort(), 'Essences line up');

// Trait ids cannot collide with the 117 Merits / 140 Flaws in data.js.
const m20Ids = new Set([...M20.MERITS, ...M20.FLAWS].map(x => x.id));
eq([...FALLEN.meritRows(), ...FALLEN.flawRows()].map(r => r.id).filter(i => m20Ids.has(i)), [],
   'no trait id collisions');

// ── Normaliser ───────────────────────────────────────────────────────────────
const fresh = {
  affiliation: 'Nephandi', tradition: 'ironhands', nephandi_origin: 'BARABBI',
  nephandi_prior_faction: 'verbena', pact_rating: '99', character_type: 'sorcerer',
};
N.normalizeCharacterNephandi(fresh, null);
eq(fresh.tradition, 'Ironhands', 'sect canonicalised from id');
eq(fresh.nephandi_origin, 'barabbi', 'origin lowercased');
eq(fresh.nephandi_prior_affiliation, 'Traditions', 'prior group derived from faction');
eq(fresh.pact_rating, 10, 'pact clamped');
eq(fresh.character_type, 'awakened', 'Nephandi are awakened');

const leaving = { affiliation: 'Traditions' };
N.normalizeCharacterNephandi(leaving, { affiliation: 'Nephandi', nephandi_origin: 'barabbi', pact_rating: 4 });
eq([leaving.nephandi_origin, leaving.pact_rating], ['', 0], 'leaving the path clears the columns');

const unrelated = { willpower: 7 };
N.normalizeCharacterNephandi(unrelated, { affiliation: 'Traditions' });
eq(unrelated, { willpower: 7 }, 'an unrelated write is untouched');

// ── Validator ────────────────────────────────────────────────────────────────
const good = {
  character_type: 'awakened', affiliation: 'Nephandi', tradition: 'Ironhands',
  nephandi_origin: 'barabbi', nephandi_prior_faction: 'Verbena',
};
eq(codes(V.nephandiChecks(good, {})), [], 'a complete Barabbus is clean');
eq(codes(V.nephandiChecks({ affiliation: 'Nephandi' }, {})), ['E:origin', 'E:sect'], 'sect and origin required');
eq(codes(V.nephandiChecks({ ...good, nephandi_origin: 'caul_born' }, {})),
   ['E:prior_faction'], 'only Barabbi keep a prior faction');
eq(codes(V.nephandiChecks({ ...good, pact_rating: 3 }, {})), ['E:pact_barred'], 'pacts off by default');
eq(codes(V.nephandiChecks({ ...good, pact_rating: 3 }, { nephandi: { allowPacts: true } })), [],
   'pacts allowed when the chronicle enables them');
eq(codes(V.nephandiChecks({ affiliation: 'Traditions', merits: { inv_hellfire: 3 } }, {})),
   ['W:nephandi_trait'], 'Investments on an unFallen mage warn');
eq(codes(V.nephandiChecks({ affiliation: 'Traditions', flaws: { neph_widderslainte: 7 } }, {})), [],
   'Widderslainte is allowed before the Fall (p. 120)');

// The Merit cap is advisory for the Fallen (p. 117) and enforced for everyone else.
const capCodes = (c, r) => codes(V.validate(c, r || {}, { creation: true })).filter(x => x.endsWith('cap'));
eq(capCodes({ character_type: 'awakened', affiliation: 'Traditions', merits: { acute_senses: 9 } }),
   ['E:cap'], 'Merit cap enforced for a Tradition mage');
eq(capCodes({ ...good, merits: { acute_senses: 9 } }), [], 'Merit cap advisory for the Fallen');
eq(capCodes({ ...good, merits: { acute_senses: 9 } }, { nephandi: { enforceTraitLimits: 'block' } }),
   ['E:cap'], 'chronicle can re-enable the cap');

// ── PDF render ───────────────────────────────────────────────────────────────
const sheet = {
  ...good, name: 'Ashlar Venn', player: 'Dave', chronicle: 'Test',
  concept: 'Fallen artificer', essence: 'Dynamic', nature: 'Monster', demeanor: 'Caregiver',
  strength: 2, dexterity: 3, stamina: 2, charisma: 3, manipulation: 4, appearance: 2,
  perception: 3, intelligence: 4, wits: 3,
  talents: { alertness: 2, subterfuge: 3 }, skills: { crafts: 3 }, knowledges: { occult: 3 },
  backgrounds: { allies: 2, library: 2 }, spheres: { matter: 3, forces: 2, entropy: 1 },
  affinity_sphere: 'matter', arete: 3, willpower: 6, quintessence: 3, paradox: 0,
  merits: { neph_shadow_appeal: 3, inv_hellfire: 3 }, flaws: { neph_spectral_presence: 3 },
  paradigm: 'All Power Comes from Sin', practice: 'Infernal Sciences',
  instruments: [], specialties: {}, custom_ability_names: {}, wonders: [],
  resonance: [{ description: 'Corrosive', flavor: 'Entropic', rating: 2 }],
  pact_rating: 0, description: 'An Ironhand.', notes: '',
};

(async () => {
  for (const [name, c] of [['nephandi-barabbi', sheet],
                           ['nephandi-caulborn', { ...sheet, name: 'Null', nephandi_origin: 'caul_born', nephandi_prior_faction: '', nephandi_prior_affiliation: '', tradition: 'Exies (Obliviates)' }]]) {
    const pdf = await buildCharacterPDF(c);
    checks++;
    if (!pdf || pdf.length < 2000) { console.error(`FAIL ${name}: PDF too small (${pdf && pdf.length})`); process.exitCode = 1; }
    if (outDir) fs.writeFileSync(path.join(outDir, name + '.pdf'), pdf);
  }
  console.log(process.exitCode ? `FAILED (${checks} checks)` : `ok — ${checks} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
