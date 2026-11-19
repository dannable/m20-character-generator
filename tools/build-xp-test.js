// Unit tests for public/js/build-xp.js — the Free Build price.
//   node tools/build-xp-test.js
'use strict';
const path = require('path');
const B = require(path.join(__dirname, '..', 'app', 'public', 'js', 'build-xp.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); c ? pass++ : fail++; };
const eq = (got, want, m) => ok(got === want, `${m} (got ${got}, want ${want})`);

// ── The cost table matches M20 p. 336 ──────────────────────────────────────
eq(B.cost('attribute', 1), 4,  'Attribute 1->2 is current x4');
eq(B.cost('attribute', 4), 16, 'Attribute 4->5 is current x4');
eq(B.cost('ability', 0), 3,    'a brand new Ability is a flat 3');
eq(B.cost('ability', 3), 6,    'Ability 3->4 is current x2');
eq(B.cost('background', 0), 3, 'a new Background is a flat 3');
eq(B.cost('sphere', 0), 10,    'a new Sphere is a flat 10');
eq(B.cost('sphere', 2, false), 16, 'Sphere 2->3 is current x8');
eq(B.cost('sphere', 2, true), 14,  'an affinity Sphere is current x7');
eq(B.cost('arete', 3), 24,     'Arete 3->4 is current x8');
eq(B.cost('willpower', 7), 7,  'Willpower is current x1');
eq(B.cost('numen', 0), 7,      'a new Numen is 7 (Sorcerer p. 105)');
eq(B.cost('numen', 2, true), 12, 'an affinity Path is current x6');
eq(B.cost('nonsense', 1), null, 'an unknown trait group is not priced at all');

// ── Baselines: the dots everyone starts with are never charged for ─────────
const blankMage = { character_type: 'awakened', strength:1,dexterity:1,stamina:1,
  charisma:1,manipulation:1,appearance:1,perception:1,intelligence:1,wits:1,
  arete: 1, willpower: 5 };
eq(B.compute(blankMage, { freebies: false }).total, 0, 'a blank Awakened sheet costs nothing');
eq(B.compute({ ...blankMage, willpower: 6 }, { freebies: false }).total, 5,
   'Willpower 5->6 is the first charged dot for a mage');
eq(B.compute({ character_type: 'mortal', willpower: 1 }, { freebies: false }).total, 0,
   'a mortal starts at Willpower 1, not 5');
eq(B.compute({ character_type: 'mortal', willpower: 5, strength: 1 }, { freebies: false }).total,
   1 + 2 + 3 + 4, 'so a mortal at Willpower 5 has paid for four dots');
eq(B.compute({ character_type: 'awakened', arete: 3, strength: 1, willpower: 5 }, { freebies: false }).total,
   8 + 16, 'Arete starts at 1 for the Awakened');

// ── Worked examples ────────────────────────────────────────────────────────
const oneAbility = B.compute({ character_type:'awakened', arete:1, willpower:5, talents:{ alertness: 3 } }, { freebies: false });
eq(oneAbility.total, 3 + 2 + 4, 'Alertness 0->3 is 3 + 2 + 4 = 9');
const oneSphere = B.compute({ character_type:'awakened', arete:1, willpower:5, spheres:{ forces: 3 } }, { freebies: false });
eq(oneSphere.total, 10 + 8 + 16, 'Forces 0->3 is 10 + 8 + 16 = 34');
const affSphere = B.compute({ character_type:'awakened', arete:1, willpower:5, affinity_sphere:'forces', spheres:{ forces: 3 } }, { freebies: false });
eq(affSphere.total, 10 + 7 + 14, 'the same Sphere as an affinity is 10 + 7 + 14 = 31');
ok(affSphere.total < oneSphere.total, 'an affinity Sphere is cheaper than an ordinary one');

// ── A by-the-book starting mage ────────────────────────────────────────────
const starting = {
  character_type:'awakened', affinity_sphere:'forces',
  strength:4,dexterity:3,stamina:3, charisma:3,manipulation:3,appearance:2, perception:2,intelligence:2,wits:2,
  talents:{alertness:3,awareness:3,athletics:3,expression:2,streetwise:2},
  skills:{drive:3,firearms:3,technology:2,meditation:1},
  knowledges:{academics:2,occult:2,science:1},
  backgrounds:{avatar:3,library:2,resources:2},
  spheres:{forces:3,prime:2,correspondence:1},
  arete:1, willpower:5, merits:{}, flaws:{},
};
const sx = B.compute(starting, { freebies: false });
ok(sx.total > 200 && sx.total < 300, `a by-the-book starting mage prices at ${sx.total} XP, in the expected 200-300 band`);
eq(sx.lines.find(l => l.group === 'attribute').dots, 15, 'its 15 Attribute dots over base are all counted');
eq(sx.lines.find(l => l.group === 'ability').dots, 27, 'and its 27 Ability dots');

// ── Freebies ───────────────────────────────────────────────────────────────
const sf = B.compute(starting, { freebies: true });
ok(sf.total < sx.total, `freebies lower the price (${sx.total} -> ${sf.total})`);
eq(sf.gross, sx.total, 'the gross is the same either way; only the total moves');
eq(sf.freebies.spent + sf.freebies.remaining, 15, 'every freebie point is either spent or reported as left over');
eq(sf.total, sf.gross - sf.freebies.saved, 'the total is the gross less what the freebies bought');
ok(sf.freebies.lines.every(l => l.fb), 'freebies are only ever spent on traits the freebie table covers');

// They go where they buy the most. A fifth Background dot is one point for
// eight XP; nothing on the table beats it.
const bgHeavy = B.compute({ character_type:'awakened', arete:1, willpower:5,
  backgrounds:{ resources: 5, allies: 5, contacts: 5 } }, { freebies: true });
ok(bgHeavy.freebies.saved >= 40, `spent on Backgrounds, 15 points buy a lot of XP (${bgHeavy.freebies.saved})`);
const attrHeavy = B.compute({ character_type:'awakened', arete:1, willpower:5,
  strength:5, dexterity:5, stamina:5 }, { freebies: true });
ok(attrHeavy.freebies.saved < bgHeavy.freebies.saved,
   `and less when only Attributes are on offer at 5 points a dot (${attrHeavy.freebies.saved})`);

// Flaws pay in, Merits pay out.
const withFlaws = B.compute({ ...starting, flaws: { 'curiosity': 3 } }, { freebies: true });
eq(withFlaws.freebies.pool, 18, 'Flaws add to the freebie pool');
const withMerits = B.compute({ ...starting, merits: { 'acute_senses': 1 } }, { freebies: true });
eq(withMerits.freebies.pool, 14, 'Merits come out of it');
const broke = B.compute({ ...starting, merits: { 'huge': 20 } }, { freebies: true });
eq(broke.freebies.pool, 0, 'a pool cannot go negative…');
eq(broke.freebies.over, 5, '…and the shortfall is reported rather than swallowed');
eq(broke.total, broke.gross, 'with no pool left, nothing is discounted');

// Arete may take at most three freebie dots (M20 p. 331).
const areteHog = B.compute({ character_type:'awakened', willpower:5, arete:5 }, { freebies: true });
const areteFb = areteHog.freebies.lines.filter(l => l.group === 'arete').length;
ok(areteFb <= 3, `freebies raise Arete by at most three dots (took ${areteFb})`);

// ── Off-table traits ───────────────────────────────────────────────────────
const resonant = B.compute({ character_type:'awakened', arete:1, willpower:5, resonance:[{rating:3}] }, { freebies: true });
eq(resonant.freebies.lines.length, 0, 'Resonance is not on the freebie table, so freebies cannot buy it');
eq(resonant.total, 0 + 2 + 4, 'but it is priced in XP: 0 + 2 + 4');

// ── What is deliberately not priced ────────────────────────────────────────
const unp = B.compute({ character_type:'mortal', willpower:1, merits:{x:3}, flaws:{y:2},
  specialties:{strength:'Brawl'}, virtues:{conscience:3}, humanity:5, quintessence:4 }, { freebies: false });
['Merits','Flaws','Specialties','Virtues','Humanity','Quintessence'].forEach(k =>
  ok(unp.unpriced.includes(k), `${k} is reported as unpriced rather than silently skipped`));
eq(unp.total, 0, 'and none of them move the XP total');

// ── Shape ──────────────────────────────────────────────────────────────────
const shape = B.compute(starting, { freebies: true });
ok(Array.isArray(shape.lines) && shape.lines.every(l => l.label && l.dots > 0), 'every summary line is labelled and non-empty');
ok(shape.steps.length === shape.lines.reduce((n, l) => n + l.dots, 0), 'the per-dot list and the summary agree on the dot count');
eq(B.compute(null, { freebies: true }).total, 0, 'a missing character prices at zero rather than throwing');
eq(B.compute({}, {}).total, 0, 'so does an empty one');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
