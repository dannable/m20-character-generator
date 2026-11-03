const Module = require('module'); const path = require('path');
const orig = Module._load;
Module._load = function (req, parent, ...r) { if (/\/db$/.test(req)) return { prepare: () => ({ get: () => ({}) }) }; return orig.call(this, req, parent, ...r); };
const root = process.argv[2];
const { buildCharacterPDF } = require(path.join(root, 'server/routes/export.js'));
const fs = require('fs');
const base = { name: 'Petrus', player: 'Dave', chronicle: 'Test', concept: 'Hermetic bookseller', affiliation: 'ancient_order_of_the_aeon_rites', faction: 'traditions', tradition: '', essence: 'Questing', nature: 'Architect', demeanor: 'Pedagogue',
  strength: 2, dexterity: 2, stamina: 2, charisma: 2, manipulation: 2, appearance: 2, perception: 3, intelligence: 4, wits: 3,
  talents: { alertness: 2 }, skills: { crafts: 2 }, knowledges: { occult: 3 }, backgrounds: { library: 3, artifact: 2 }, willpower: 6, quintessence: 4,
  merits: { the_flow_of_ki: 3 }, flaws: { isolated_upbringing: 2 }, specialties: {}, description: 'A bookseller.', notes: 'Notes here', character_type: 'sorcerer',
  numina_style: 'hedge', numina_secondary: 'psychic', casting_attribute: 'intelligence', affinity_path: 'conjuration',
  numina: { conjuration: { rating: 3, practice: 'high_ritual', ability: 'occult' }, divination: { rating: 2, practice: 'high_ritual', ability: 'esoterica' }, clairvoyance: { rating: 2, kind: 'psychic' } },
  rituals: [{ id: 'object_permanence', path: 'conjuration', name: 'Object Permanence', level: 2 }, { id: 'x', path: 'conjuration', name: 'Fetch', level: 1 }],
  artifacts: [{ id: 'witchs_bottle', name: 'Witch’s Bottle', rating: 2 }], custom_ability_names: {}, instruments: [], wonders: [], spheres: {} };
const many = { ...base, name: 'Heavy', numina: Object.fromEntries(['conjuration','divination','fortune','healing','shadows'].map(id => [id, { rating: 5, practice: 'high_ritual', ability: 'occult' }])), numina_secondary: '',
  rituals: Array.from({ length: 25 }, (_, i) => ({ id: 'r' + i, path: 'conjuration', name: 'Ritual number ' + i, level: 1 + (i % 5) })) };
(async () => { for (const [n, c] of [['base', base], ['many', many], ['awakened', { ...base, character_type: 'mage', spheres: { forces: 3 }, arete: 3, affiliation: 'Traditions', tradition: 'Verbena' }]]) fs.writeFileSync(process.argv[3] + '/' + n + '.pdf', await buildCharacterPDF(c)); console.log('ok'); })().catch(e => { console.error(e); process.exit(1); });
