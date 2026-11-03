// Server-side helpers for the Sorcerer character type (M20 Sorcerer).
//
// Loads the same catalogue the browser uses (public/js/data-sorcerer.js exports
// itself under CommonJS) so ids written by the client can be checked here.
// Mirrors server/prism.js: clean the structured columns on every write, and
// sanitise the chronicle's rules.sorcerer block.
'use strict';
const path = require('path');
const SORCERER = require(path.join(__dirname, '..', 'public', 'js', 'data-sorcerer.js'));

const STYLES        = new Set(['hedge', 'psychic']);
const ENFORCE_MODES = new Set(['block', 'warn', 'off']);
const ATTR_IDS      = new Set(['strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits']);
const PATH_IDS      = new Set(SORCERER.PATHS.map(p => p.id));
const PHEN_IDS      = new Set(SORCERER.PHENOMENA.map(p => p.id));
const AFFIL_IDS     = new Set(SORCERER.AFFILIATIONS.map(a => a.id));
const ALIGN_IDS     = new Set(SORCERER.ALIGNMENTS.map(a => a.id));

function asObj(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const o = JSON.parse(v); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; } catch { return {}; } }
  return {};
}
function asArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; } }
  return [];
}
const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, parseInt(v, 10) || 0));

// ── Character-side normalisation ─────────────────────────────────────────────
/** numina: { id: { rating, practice, ability, custom_name } } — Paths and Phenomena share the map. */
function cleanNumina(raw) {
  const out = {};
  for (const [id, v] of Object.entries(asObj(raw))) {
    const isPath = PATH_IDS.has(id), isPhen = PHEN_IDS.has(id), isCustom = /^custom_[a-z0-9_]+$/.test(id);
    if (!isPath && !isPhen && !isCustom) continue;
    const o = (v && typeof v === 'object') ? v : { rating: v };
    const rating = int(o.rating, 0, 5);
    if (rating <= 0) continue;
    const entry = { rating };
    if (isPath || isCustom) {
      if (o.practice) entry.practice = str(o.practice, 40);
      if (o.ability)  entry.ability  = str(o.ability, 40);
    }
    if (isCustom) { entry.custom_name = str(o.custom_name, 60); entry.kind = o.kind === 'psychic' ? 'psychic' : 'hedge'; }
    out[id] = entry;
  }
  return out;
}

/** rituals: [ { id, path, name, level, notes } ] — id is a catalogue ritual id or custom-<slug>. */
function cleanRituals(raw, numina) {
  const seen = new Set(); const out = [];
  for (const r of asArr(raw)) {
    if (!r || typeof r !== 'object') continue;
    const pathId = str(r.path, 60);
    if (!pathId || !(PATH_IDS.has(pathId) || /^custom_[a-z0-9_]+$/.test(pathId))) continue;
    const level = int(r.level, 1, 5);
    let id = str(r.id, 80), name = str(r.name, 80), text = '';
    const cat = PATH_IDS.has(pathId) ? SORCERER.ritualById(pathId, id) : null;
    if (cat) { name = cat.name; }
    else { if (!/^custom-/.test(id)) id = 'custom-' + (name || 'ritual').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); if (!name) continue; }
    const key = pathId + '/' + id;
    if (seen.has(key)) continue; seen.add(key);
    const entry = { id, path: pathId, name, level: cat ? cat.level : level };
    const notes = str(r.notes, 2000); if (notes) entry.notes = notes;
    out.push(entry);
  }
  // Rituals for Paths the character no longer has are dropped
  if (numina) return out.filter(r => numina[r.path]);
  return out;
}

/** artifacts: [ { id, name, rating, notes } ] — id is a Tools of the Trade id or '' for a custom artifact. */
function cleanArtifacts(raw) {
  const out = [];
  for (const a of asArr(raw)) {
    if (!a || typeof a !== 'object') continue;
    const id = str(a.id, 60);
    const cat = id ? SORCERER.artifactById(id) : null;
    const name = cat ? cat.name : str(a.name, 80);
    if (!name) continue;
    const entry = { id: cat ? id : '', name, rating: cat ? cat.rating : int(a.rating, 1, 5) };
    const notes = str(a.notes, 2000); if (notes) entry.notes = notes;
    out.push(entry);
  }
  return out;
}

/**
 * Normalise the Sorcerer columns in a write payload. For non-sorcerer characters the
 * columns are blanked only when the payload explicitly touches them.
 */
function normalizeCharacterSorcerer(data, existing) {
  const type = data.character_type ?? existing?.character_type ?? 'awakened';
  const touches = ['numina', 'numina_style', 'numina_secondary', 'casting_attribute', 'affinity_path', 'rituals', 'artifacts'].some(k => k in data);
  if (type !== 'sorcerer') {
    if (data.numina_style !== undefined)      data.numina_style = '';
    if (data.numina_secondary !== undefined)  data.numina_secondary = '';
    if (data.casting_attribute !== undefined) data.casting_attribute = '';
    if (data.affinity_path !== undefined)     data.affinity_path = '';
    if (data.rituals !== undefined)           data.rituals = [];
    if (data.artifacts !== undefined)         data.artifacts = [];
    return data;
  }
  if (!touches && data.character_type === undefined) return data;
  if (data.numina_style !== undefined)      data.numina_style = STYLES.has(data.numina_style) ? data.numina_style : '';
  if (data.numina_secondary !== undefined)  data.numina_secondary = STYLES.has(data.numina_secondary) && data.numina_secondary !== (data.numina_style ?? existing?.numina_style) ? data.numina_secondary : '';
  if (data.casting_attribute !== undefined) data.casting_attribute = ATTR_IDS.has(String(data.casting_attribute).toLowerCase()) ? String(data.casting_attribute).toLowerCase() : '';
  if (data.affinity_path !== undefined)     data.affinity_path = PATH_IDS.has(data.affinity_path) || /^custom_[a-z0-9_]+$/.test(data.affinity_path || '') ? data.affinity_path : '';
  if (data.numina !== undefined)            data.numina = cleanNumina(data.numina);
  const numina = data.numina ?? asObj(existing?.numina);
  if (data.rituals !== undefined || data.numina !== undefined) data.rituals = cleanRituals(data.rituals ?? asArr(existing?.rituals), numina);
  if (data.artifacts !== undefined)         data.artifacts = cleanArtifacts(data.artifacts);
  if (data.affiliation !== undefined && data.affiliation !== '' && !AFFIL_IDS.has(data.affiliation)) {
    // Allow a display name too (older clients): map it to an id when it matches
    const hit = SORCERER.AFFILIATIONS.find(a => a.name.toLowerCase() === String(data.affiliation).toLowerCase());
    data.affiliation = hit ? hit.id : str(data.affiliation, 80);
  }
  if (data.faction !== undefined && !ALIGN_IDS.has(data.faction)) data.faction = '';
  return data;
}

// ── Chronicle rules ──────────────────────────────────────────────────────────
// Shape of rules.sorcerer (all optional):
//   allowSorcerers:       bool            default true
//   allowedAffiliations:  null | string[] (SORCERER.AFFILIATIONS ids; [] = none)
//   allowedPaths:         null | string[] (SORCERER.PATHS ids)
//   allowedPhenomena:     null | string[] (SORCERER.PHENOMENA ids)
//   enforceFavored:       'block' | 'warn' | 'off'   default 'block'
//   allowBothStyles:      bool            default false
//   bonusNuminaDots:      int 0..5        default 0
//   simplifiedAspects:    bool            default false
//   restrictMerits:       bool            default false — only the Sorcerer book's Merits/Flaws
function sanitizeSorcererRules(raw) {
  const r = asObj(raw); const out = {};
  if (r.allowSorcerers !== undefined)      out.allowSorcerers = !!r.allowSorcerers;
  const list = (v, ids) => Array.isArray(v) ? v.filter(id => ids.has(id)) : null;
  if (r.allowedAffiliations !== undefined) { const l = list(r.allowedAffiliations, AFFIL_IDS); if (l) out.allowedAffiliations = l; }
  if (r.allowedPaths !== undefined)        { const l = list(r.allowedPaths, PATH_IDS);        if (l) out.allowedPaths = l; }
  if (r.allowedPhenomena !== undefined)    { const l = list(r.allowedPhenomena, PHEN_IDS);    if (l) out.allowedPhenomena = l; }
  if (r.enforceFavored !== undefined)      out.enforceFavored = ENFORCE_MODES.has(r.enforceFavored) ? r.enforceFavored : 'block';
  if (r.allowBothStyles !== undefined)     out.allowBothStyles = !!r.allowBothStyles;
  if (r.bonusNuminaDots !== undefined)     out.bonusNuminaDots = int(r.bonusNuminaDots, 0, 5);
  if (r.simplifiedAspects !== undefined)   out.simplifiedAspects = !!r.simplifiedAspects;
  if (r.restrictMerits !== undefined)      out.restrictMerits = !!r.restrictMerits;
  return out;
}

// ── XP spends on Sorcerer traits ─────────────────────────────────────────────
// trait_group 'numen'        → numina[key].rating from→to (col 'numina')
// trait_group 'ritual'       → append body.ritual {id, path, name, level} (col 'rituals'), from 0 → to 1
// trait_group 'numina_style' → set numina_secondary = body.value (21 XP), from 0 → to 1
const XP_GROUPS = new Set(['numen', 'ritual', 'numina_style']);

/** Validate a sorcerer XP spend body against the stored character. Returns an error string or null. */
function validateXpSpend(charRow, body) {
  if (charRow.character_type !== 'sorcerer') return 'Only Sorcerer characters have Numina';
  const numina = asObj(charRow.numina);
  const { trait_group, trait_key, from, to } = body;
  if (trait_group === 'numen') {
    if (body.trait_col !== 'numina') return 'Invalid trait column';
    const known = PATH_IDS.has(trait_key) || PHEN_IDS.has(trait_key) || (numina[trait_key] && /^custom_/.test(trait_key));
    if (!known) return 'Unknown Path or Phenomenon';
    const cur = numina[trait_key] ? (numina[trait_key].rating || 0) : 0;
    if (from !== cur) return `Rating mismatch (have ${cur})`;
    if (to > 5) return 'Rating cannot exceed 5';
    if (PATH_IDS.has(trait_key) && numina[trait_key] && numina[trait_key].ability) {
      const ab = numina[trait_key].ability; let have = 0;
      for (const col of ['talents','skills','knowledges']) { const m = asObj(charRow[col]); if (m[ab] !== undefined) have = m[ab] || 0; }
      if (to > have) return `${trait_key} is capped by its Path Ability (${ab} ${have}); raise the Ability first`;
    }
    if (PHEN_IDS.has(trait_key) && to > Math.floor((charRow.willpower || 0) / 2)) return `Phenomena are capped at half Willpower (${Math.floor((charRow.willpower || 0) / 2)})`;
    if (trait_key === 'anti_psychic' && Object.keys(numina).some(id => id !== 'anti_psychic' && PHEN_IDS.has(id) && numina[id].rating > 0)) return 'Anti-Psychic cannot be combined with other Phenomena';
    // A new Path/Phenomenon of the other style needs the secondary style
    const style = PATH_IDS.has(trait_key) ? 'hedge' : PHEN_IDS.has(trait_key) ? 'psychic' : null;
    if (cur === 0 && style && style !== charRow.numina_style && style !== charRow.numina_secondary) return `A ${style === 'hedge' ? 'hedge magic Path' : 'Psychic Phenomenon'} needs that style learned first (21 XP, Storyteller approval)`;
    return null;
  }
  if (trait_group === 'ritual') {
    if (body.trait_col !== 'rituals') return 'Invalid trait column';
    const r = body.ritual && typeof body.ritual === 'object' ? body.ritual : null;
    if (!r || !r.path) return 'Ritual details required';
    if (!numina[r.path] || !(numina[r.path].rating > 0)) return 'The character does not know that Path';
    const [clean] = cleanRituals([r], numina);
    if (!clean) return 'Invalid ritual';
    if (clean.level > numina[r.path].rating) return `Ritual level ${clean.level} is above the Path rating ${numina[r.path].rating}`;
    const have = asArr(charRow.rituals);
    if (have.some(x => x.path === clean.path && x.id === clean.id)) return 'Ritual already known';
    const levels = new Set(have.filter(x => x.path === clean.path).map(x => x.level));
    for (let l = 1; l < clean.level; l++) if (!levels.has(l)) return `A level ${clean.level} ritual needs a ritual at every lower level (missing level ${l})`;
    if (from !== 0 || to !== 1) return 'Rituals are bought once';
    return null;
  }
  if (trait_group === 'numina_style') {
    if (trait_key !== 'numina_secondary') return 'Invalid trait key';
    if (!STYLES.has(body.value) || body.value === charRow.numina_style) return 'Invalid secondary style';
    if (charRow.numina_secondary) return 'A secondary style is already known';
    if (from !== 0 || to !== 1) return 'Invalid range';
    return null;
  }
  return 'Unknown trait group';
}

/** Apply (direction +1) or revert (direction -1) a sorcerer XP log entry. Returns {col, value} to persist. */
function applyXpSpend(charRow, entry, direction = 1) {
  const numina = asObj(charRow.numina);
  if (entry.trait_group === 'numen') {
    const n = numina[entry.trait_key] || {};
    const rating = direction > 0 ? entry.to : entry.from;
    if (rating > 0) numina[entry.trait_key] = { ...n, rating }; else delete numina[entry.trait_key];
    return { col: 'numina', value: JSON.stringify(numina) };
  }
  if (entry.trait_group === 'ritual') {
    let rituals = asArr(charRow.rituals);
    const r = entry.ritual || {};
    rituals = rituals.filter(x => !(x.path === r.path && x.id === r.id));
    if (direction > 0) { const [clean] = cleanRituals([r], numina); if (clean) rituals.push(clean); }
    return { col: 'rituals', value: JSON.stringify(rituals) };
  }
  if (entry.trait_group === 'numina_style') {
    return { col: 'numina_secondary', value: direction > 0 ? entry.value : '' };
  }
  return null;
}

module.exports = { SORCERER, cleanNumina, cleanRituals, cleanArtifacts, normalizeCharacterSorcerer, sanitizeSorcererRules, STYLES, ENFORCE_MODES, XP_GROUPS, validateXpSpend, applyXpSpend };
