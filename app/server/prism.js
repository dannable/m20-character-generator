// Server-side helpers for Prism of Focus mode.
//
// Loads the same catalogue the browser uses (public/js/data-prism.js exports
// itself under CommonJS) so ids written by the client can be checked here and
// the legacy paradigm / practice text columns can be regenerated from the
// structured Prism columns.
'use strict';
const path  = require('path');
const PRISM = require(path.join(__dirname, '..', 'public', 'js', 'data-prism.js'));

const FOCUS_MODES = new Set(['core', 'prism']);
const CHRONICLE_FOCUS_MODES = new Set(['player_choice', 'core', 'prism']);

const TENET_CATEGORY_IDS = new Set(PRISM.TENET_CATEGORIES.map(c => c.id));
const TENET_IDS     = new Set(PRISM.TENETS.map(t => t.id));
const PRACTICE_IDS  = new Set(PRISM.PRACTICES.map(p => p.id));
const SPECIALTY_IDS = new Set(PRISM.SPECIALTIES.map(s => s.id));
const PRESET_IDS    = new Set(PRISM.PARADIGM_PRESETS.map(p => p.id));

function asObj(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const o = JSON.parse(v); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; } catch { return {}; } }
  return {};
}

// ── Character-side normalisation ─────────────────────────────────────────────
// Drops unknown ids / categories and clamps ratings so bad client data never
// lands in the columns. Returns new objects; never mutates the input.
function cleanTenets(raw) {
  const out = {};
  for (const [cat, id] of Object.entries(asObj(raw))) {
    if (!TENET_CATEGORY_IDS.has(cat) || !TENET_IDS.has(id)) continue;
    const t = PRISM.tenetById(id);
    if (t.category !== cat) continue;
    out[cat] = id;
  }
  return out;
}
function cleanPracticeRatings(raw) {
  const out = {};
  for (const [id, r] of Object.entries(asObj(raw))) {
    if (!PRACTICE_IDS.has(id)) continue;
    const n = Math.max(0, Math.min(5, parseInt(r, 10) || 0));
    if (n > 0) out[id] = n;
  }
  return out;
}
function cleanPracticeSpecialties(raw) {
  const out = {};
  for (const [base, spec] of Object.entries(asObj(raw))) {
    if (!PRACTICE_IDS.has(base) || !SPECIALTY_IDS.has(spec)) continue;
    if (PRISM.specialtyById(spec).base !== base) continue;
    out[base] = spec;
  }
  return out;
}

/** Human-readable projection of the Prism columns into the legacy text columns. */
function projectFocus({ tenets, paradigm_preset, practice_ratings, practice_specialties }) {
  const t = cleanTenets(tenets);
  const preset = PRESET_IDS.has(paradigm_preset) ? PRISM.presetById(paradigm_preset) : null;
  const tenetNames = PRISM.TENET_CATEGORIES
    .map(c => t[c.id] && PRISM.tenetById(t[c.id]))
    .filter(Boolean)
    .map(x => x.name);
  const paradigm = preset
    ? `${preset.name} (${tenetNames.join(' · ')})`
    : (tenetNames.length ? `Tenets: ${tenetNames.join(' · ')}` : '');

  const ratings = cleanPracticeRatings(practice_ratings);
  const specs   = cleanPracticeSpecialties(practice_specialties);
  const practice = Object.entries(ratings)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, r]) => {
      const base = PRISM.practiceById(id);
      const spec = specs[id] && PRISM.specialtyById(specs[id]);
      return spec ? `${spec.name} (${base.name}) ${r}` : `${base.name} ${r}`;
    })
    .join(', ');
  return { paradigm, practice };
}

/**
 * Normalise the Prism fields present on an incoming character payload.
 * In prism mode the legacy paradigm/practice strings are regenerated; in
 * core mode the Prism columns are left as sent (so a mode flip back loses
 * nothing) but never projected. Mutates and returns `data`.
 */
function normalizeCharacterFocus(data, existing) {
  if (data.focus_mode !== undefined && !FOCUS_MODES.has(data.focus_mode)) data.focus_mode = 'core';
  if (data.tenets !== undefined)               data.tenets = cleanTenets(data.tenets);
  if (data.practice_ratings !== undefined)     data.practice_ratings = cleanPracticeRatings(data.practice_ratings);
  if (data.practice_specialties !== undefined) data.practice_specialties = cleanPracticeSpecialties(data.practice_specialties);
  if (data.paradigm_preset !== undefined && data.paradigm_preset !== '' && !PRESET_IDS.has(data.paradigm_preset)) data.paradigm_preset = '';

  const mode = data.focus_mode ?? existing?.focus_mode ?? 'core';
  const touchesPrism = ['tenets', 'paradigm_preset', 'practice_ratings', 'practice_specialties', 'focus_mode'].some(k => k in data);
  if (mode === 'prism' && touchesPrism) {
    const merged = {
      tenets:               data.tenets               ?? asObj(existing?.tenets),
      paradigm_preset:      data.paradigm_preset      ?? existing?.paradigm_preset ?? '',
      practice_ratings:     data.practice_ratings     ?? asObj(existing?.practice_ratings),
      practice_specialties: data.practice_specialties ?? asObj(existing?.practice_specialties),
    };
    Object.assign(data, projectFocus(merged));
  }
  return data;
}

// ── Chronicle rules ──────────────────────────────────────────────────────────
// Shape of rules.prism (all optional):
//   allowedPractices:   null | string[]   (PRISM.PRACTICES ids)
//   allowedSpecialties: null | string[]   (PRISM.SPECIALTIES ids)
//   hideCorrupted:      bool              default false — corrupted specialties show with a warning unless hidden
//   allowedTenets:      null | { categoryId: string[] }
//   requireFactionSpecialty: bool         default false
//   bonusPracticeDots:  int 0..10         default 0
//   rotePoints:         int 0..30         default 6
//   enforceAbilityRequirement: bool       default true (false = warning only)
function idList(arr, valid) {
  if (!Array.isArray(arr)) return null;
  // null = no restriction; an empty array is a real (if odd) restriction: nothing allowed
  return [...new Set(arr.filter(x => typeof x === 'string' && valid.has(x)))];
}
function clampInt(v, lo, hi, dflt) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
}

/**
 * Sanitise the focus-related keys of a chronicle `rules` object in place and
 * return it. Unknown keys inside rules.prism are dropped; other rules keys are
 * untouched (collectRules() on the client owns those).
 */
function sanitizeChronicleRules(rules) {
  if (!rules || typeof rules !== 'object') return rules;
  if (rules.focusMode !== undefined) {
    if (!CHRONICLE_FOCUS_MODES.has(rules.focusMode)) delete rules.focusMode;
  }
  if (rules.prism !== undefined) {
    const p = asObj(rules.prism);
    const clean = {};
    if ('allowedPractices'   in p) clean.allowedPractices   = idList(p.allowedPractices, PRACTICE_IDS);
    if ('allowedSpecialties' in p) clean.allowedSpecialties = idList(p.allowedSpecialties, SPECIALTY_IDS);
    if ('hideCorrupted'      in p) clean.hideCorrupted      = !!p.hideCorrupted;
    if ('requireFactionSpecialty' in p) clean.requireFactionSpecialty = !!p.requireFactionSpecialty;
    if ('enforceAbilityRequirement' in p) clean.enforceAbilityRequirement = !!p.enforceAbilityRequirement;
    if ('bonusPracticeDots'  in p) clean.bonusPracticeDots  = clampInt(p.bonusPracticeDots, 0, 10, 0);
    if ('rotePoints'         in p) clean.rotePoints         = clampInt(p.rotePoints, 0, 30, 6);
    if ('allowedTenets' in p) {
      const at = asObj(p.allowedTenets);
      const out = {};
      for (const [cat, ids] of Object.entries(at)) {
        if (!TENET_CATEGORY_IDS.has(cat)) continue;
        const l = idList(ids, TENET_IDS);
        if (l && l.length) out[cat] = l.filter(id => PRISM.tenetById(id).category === cat);
      }
      clean.allowedTenets = Object.keys(out).length ? out : null;
    }
    rules.prism = clean;
  }
  return rules;
}

module.exports = {
  PRISM, FOCUS_MODES, CHRONICLE_FOCUS_MODES,
  cleanTenets, cleanPracticeRatings, cleanPracticeSpecialties,
  projectFocus, normalizeCharacterFocus, sanitizeChronicleRules,
};
