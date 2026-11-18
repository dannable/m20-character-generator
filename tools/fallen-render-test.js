// Render smoke test for the Nephandi creator steps.
//
//   node tools/fallen-render-test.js <repoRoot>
//
// There is no jsdom in this project, so app.js is loaded into a minimal DOM stub
// and the Creator's render functions are called directly. That will not prove the
// markup is correct, but it does catch the failure this kind of change actually
// produces: a ReferenceError or a thrown template expression in a branch that
// only a Nephandus reaches.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.argv[2] || path.join(__dirname, '..');
const pub = f => fs.readFileSync(path.join(root, 'app/public', f), 'utf8');

// ── A DOM stub that is just deep enough for the render helpers ───────────────
const makeEl = (tag = 'div') => {
  const el = {
    tagName: String(tag).toUpperCase(), nodeType: 1, dataset: {}, style: {},
    children: [], classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, on) { const v = on === undefined ? !this._s.has(c) : !!on; v ? this._s.add(c) : this._s.delete(c); return v; },
      contains(c) { return this._s.has(c); },
    },
    innerHTML: '', textContent: '', value: '', checked: false, disabled: false,
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, replaceWith() {}, insertBefore(c) { this.children.push(c); return c; },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, click() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    closest() { return null }, scrollIntoView() {}, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    cloneNode() { return makeEl(tag); },
  };
  return el;
};
const doc = {
  ...makeEl('document'),
  documentElement: makeEl('html'),
  body: makeEl('body'),
  head: makeEl('head'),
  createElement: makeEl,
  createComment: () => makeEl('#comment'),
  createDocumentFragment: () => makeEl('#fragment'),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
};
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const sandbox = {
  document: doc, window: null, self: null, globalThis: null,
  localStorage: storage, sessionStorage: storage,
  location: { pathname: '/', search: '', href: 'http://localhost/', origin: 'http://localhost' },
  history: { state: null, pushState() {}, replaceState() {} },
  navigator: { userAgent: 'node', clipboard: {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame: cb => cb(0),
  console, Image: function () { return makeEl('img'); }, Intl, Date, Math, JSON,
};
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['js/data.js', 'js/data-prism.js', 'js/data-sorcerer.js', 'js/data-fallen.js',
                 'js/validate-character.js', 'js/tarot.js', 'js/app.js',
                 'js/session-ui.js', 'js/prism-ui.js', 'js/free-edit-extras.js', 'js/sorcerer-ui.js']) {
  try {
    vm.runInContext(pub(f), sandbox, { filename: f });
  } catch (e) {
    console.error(`FAIL loading ${f}: ${e.message}`);
    process.exit(1);
  }
}

// app.js declares its modules as top-level `const`, which live in the context's
// lexical scope rather than on the global object, so they are lifted out here.
vm.runInContext('globalThis.__M = { Creator, App, FALLEN, M20, Obsidian };', sandbox);
const { Creator, Obsidian } = sandbox.__M;
let checks = 0, failures = 0;
function renders(label, fn) {
  checks++;
  try {
    const html = fn();
    if (typeof html !== 'string' || !html.length) throw new Error('produced no markup');
    const bad = html.split('\n').find(l => /undefined|\[object Object\]|NaN/.test(l));
    if (bad) throw new Error('markup contains a stray value: ' + JSON.stringify(bad.trim().slice(0, 120)));
    return html;
  } catch (e) {
    console.error(`FAIL ${label}: ${e.message}`);
    failures++;
    return '';
  }
}

// ── A Nephandus at each stage of creation ────────────────────────────────────
const base = () => {
  Creator.charType = 'awakened';
  Creator.char = Creator.defaultChar('awakened');
  Creator.char.affiliation = 'Nephandi';
  Creator.char.name = 'Ashlar Venn';
  Creator.char.concept = 'Fallen artificer';
  Creator._lockedBaselines = null;
  Creator.step = 0;
  return Creator.char;
};

// Origin not yet chosen
base();
let html = renders('step 0, no origin', () => Creator.renderStep0());
if (html && !/fallen-origin-card/.test(html)) { console.error('FAIL step 0 is missing the origin cards'); failures++; }
if (html && /fallen-prior-faction/.test(html)) { console.error('FAIL prior-faction picker shown before Barabbi is chosen'); failures++; }
if (html && !/Abyssal Essence/.test(html)) { console.error('FAIL step 0 is missing the Abyssal Essence heading'); failures++; }

// Barabbi — the prior-faction picker appears
let c = base();
c.nephandi_origin = 'barabbi';
html = renders('step 0, Barabbi', () => Creator.renderStep0());
if (html && !/fallen-prior-faction/.test(html)) { console.error('FAIL Barabbi has no prior-faction picker'); failures++; }

// Caul-Born — it does not
c = base();
c.nephandi_origin = 'caul_born';
html = renders('step 0, Caul-Born', () => Creator.renderStep0());
if (html && /fallen-prior-faction/.test(html)) { console.error('FAIL Caul-Born offered a prior faction'); failures++; }

// Every step renders for a Nephandus
c = base();
c.nephandi_origin = 'barabbi';
c.nephandi_prior_faction = 'Verbena';
c.nephandi_prior_affiliation = 'Traditions';
c.tradition = 'Ironhands';
c.essence = 'Dynamic';
c.nature = 'Monster';
c.demeanor = 'Caregiver';
for (const [i, name] of [[1, 'renderStep1'], [2, 'renderStep2'], [3, 'renderStep3'],
                         [4, 'renderStep4'], [5, 'renderStep5'], [6, 'renderStep6']]) {
  Creator.step = i;
  renders(`step ${i} (${name})`, () => Creator[name]());
}

// Step 5: a Barabbus inherits Verbena's affinity Spheres, not a free choice
Creator.step = 5;
html = renders('step 5, Barabbi affinity', () => Creator.renderStep5());
if (html && /may claim any Sphere/.test(html)) { console.error('FAIL Barabbus offered a free Affinity Sphere'); failures++; }
if (html && !/under Samael/.test(html)) { console.error('FAIL step 5 is missing the Qlipha descriptors'); failures++; }

c.nephandi_origin = 'caul_born';
c.nephandi_prior_faction = '';
c.nephandi_prior_affiliation = '';
html = renders('step 5, Caul-Born affinity', () => Creator.renderStep5());
if (html && !/may claim any Sphere/.test(html)) { console.error('FAIL Caul-Born not offered a free Affinity Sphere'); failures++; }

// Pact section: hidden unless the chronicle allows pacts
checks++;
if (Creator._renderPactSection() !== '') { console.error('FAIL pact section shown without chronicle opt-in'); failures++; }
c._chronicleRules = { nephandi: { allowPacts: true } };
c.pact_rating = 3;
html = renders('pact section', () => Creator._renderPactSection());
if (html && !/Infernal Pact/.test(html)) { console.error('FAIL pact section has no heading'); failures++; }
checks++;
if (Creator.freebiesPool() !== 15 + 3) { console.error(`FAIL pact freebies not added to the pool (got ${Creator.freebiesPool()})`); failures++; }
c.pact_rating = 0;
checks++;
if (Creator.freebiesPool() !== 15) { console.error('FAIL pool wrong with no pact'); failures++; }

// Flaw cap lifts for the Fallen, holds for everyone else
checks++;
if (Creator.flawCapRule() !== null) { console.error('FAIL flaw cap not lifted for the Fallen'); failures++; }
c.affiliation = 'Traditions';
checks++;
if (Creator.flawCapRule() !== 7) { console.error('FAIL flaw cap not 7 for a Tradition mage'); failures++; }

// The Fallen Traits are offered only on the Fallen path
c.affiliation = 'Nephandi';
checks++;
const nephMerits = Creator.effectiveMerits().filter(m => /^(neph|inv)_/.test(m.id));
if (nephMerits.length !== 20) { console.error(`FAIL expected 20 Fallen merit rows, got ${nephMerits.length}`); failures++; }
c.affiliation = 'Traditions';
checks++;
if (Creator.effectiveMerits().some(m => /^(neph|inv)_/.test(m.id))) { console.error('FAIL Fallen Merits offered to a Tradition mage'); failures++; }
checks++;
const strayFlaws = Creator.effectiveFlaws().filter(f => /^neph_/.test(f.id)).map(f => f.id);
if (JSON.stringify(strayFlaws) !== JSON.stringify(['neph_widderslainte'])) {
  console.error(`FAIL only Widderslainte should be offered pre-Fall, got ${JSON.stringify(strayFlaws)}`); failures++;
}

// A non-Nephandus still renders every step unchanged
c = Creator.char = Creator.defaultChar('awakened');
c.name = 'Petrus'; c.concept = 'Hermetic'; c.tradition = 'Order of Hermes';
c.affiliation = 'Traditions'; c.essence = 'Questing'; c.nature = 'Architect'; c.demeanor = 'Pedagogue';
for (const [i, name] of [[0, 'renderStep0'], [4, 'renderStep4'], [5, 'renderStep5'], [6, 'renderStep6']]) {
  Creator.step = i;
  const out = renders(`tradition mage step ${i}`, () => Creator[name]());
  if (out && /fallen-origin-card|Qlippothic|Infernal Pact/.test(out)) {
    console.error(`FAIL step ${i} leaked Fallen content into a Tradition mage`); failures++;
  }
}

// Regression guard: this change touched effectiveMerits/effectiveFlaws,
// freebiesPool, flawCapRule and the focus option builders, all of which the
// mortal and sorcerer flows share.
for (const type of ['mortal', 'sorcerer']) {
  Creator.charType = type;
  Creator.char = Creator.defaultChar(type);
  Creator.char.name = 'Regression';
  Creator.char.concept = 'Test';
  Creator.step = 0;
  const steps = Creator._steps();
  for (let i = 0; i < steps.length; i++) {
    Creator.step = i;
    const out = renders(`${type} step ${i} (${steps[i].renderer})`, () => Creator[steps[i].renderer]());
    if (out && /fallen-origin-card|Infernal Pact|Qlippothic/.test(out)) {
      console.error(`FAIL ${type} step ${i} leaked Fallen content`); failures++;
    }
  }
  checks++;
  // Both flows get 21 freebies, and neither may pick up a pact bonus.
  const pool = Creator.freebiesPool();
  if (pool !== 21) { console.error(`FAIL ${type} freebie pool ${pool}, expected 21`); failures++; }
  checks++;
  if (Creator.effectiveMerits().some(m => /^(neph|inv)_/.test(m.id))) {
    console.error(`FAIL ${type} offered Fallen Merits`); failures++;
  }
}

// ── Markdown export ─────────────────────────────────────────────────────────
const mdChar = {
  name: 'Ashlar Venn', affiliation: 'Nephandi', tradition: 'Ironhands',
  character_type: 'awakened', nephandi_origin: 'barabbi',
  nephandi_prior_faction: 'Verbena', nephandi_prior_affiliation: 'Traditions',
  essence: 'Dynamic', nature: 'Monster', demeanor: 'Caregiver', pact_rating: 4,
  arete: 3, willpower: 6, spheres: { matter: 3 }, affinity_sphere: 'matter',
  talents: {}, skills: {}, knowledges: {}, backgrounds: {}, merits: {}, flaws: {},
  specialties: {}, resonance: [], instruments: [], wonders: [], rotes: [],
  custom_ability_names: {}, health_track: [],
};
const md = renders('markdown export', () => Obsidian._charMd(mdChar, null));
for (const want of ['nephandi_origin: "Barabbi"', 'nephandi_prior_faction: "Verbena"',
                    'abyssal_essence: "Destructive"', 'pact_rating: 4',
                    'nephandi, fallen]', 'Abyssal Essence', 'The Fall']) {
  checks++;
  if (md && !md.includes(want)) { console.error(`FAIL markdown missing ${JSON.stringify(want)}`); failures++; }
}
// and a Tradition mage keeps the old shape
const mdTrad = renders('markdown, tradition mage',
  () => Obsidian._charMd({ ...mdChar, affiliation: 'Traditions', tradition: 'Verbena' }, null));
checks++;
if (mdTrad && /nephandi|Abyssal|The Fall/.test(mdTrad)) { console.error('FAIL markdown leaked Fallen fields'); failures++; }

console.log(failures ? `FAILED — ${failures} problem(s) across ${checks} checks`
                     : `ok — ${checks} render checks passed`);
process.exit(failures ? 1 : 0);
