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

module.exports = { SORCERER, cleanNumina, cleanRituals, cleanArtifacts, normalizeCharacterSorcerer, sanitizeSorcererRules, STYLES, ENFORCE_MODES };
