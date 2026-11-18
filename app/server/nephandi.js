// Server-side helpers for the Nephandi path (M20 Book of the Fallen).
//
// Loads the same catalogue the browser uses (public/js/data-fallen.js exports
// itself under CommonJS) so ids written by the client can be checked here.
// Mirrors server/sorcerer.js and server/prism.js: clean the structured columns on
// every write, and sanitise the chronicle's rules.nephandi block.
//
// Nephandi are mechanically ordinary Awakened mages, so there is no new character
// type. A Nephandus is `character_type: 'awakened'` with `affiliation: 'Nephandi'`
// and the sect in the existing `tradition` column. Only four extra columns exist:
// nephandi_origin, nephandi_prior_affiliation, nephandi_prior_faction, pact_rating.
'use strict';
const path = require('path');
const FALLEN = require(path.join(__dirname, '..', 'public', 'js', 'data-fallen.js'));
const M20 = require(path.join(__dirname, '..', 'public', 'js', 'data.js'));

const AFFILIATION = 'Nephandi';
const COLUMNS = ['nephandi_origin', 'nephandi_prior_affiliation',
                 'nephandi_prior_faction', 'pact_rating'];

const ORIGIN_IDS = new Set(FALLEN.ORIGINS.map(o => o.id));
const SECT_NAMES = new Map(FALLEN.SECTS.map(s => [s.name.toLowerCase(), s.name]));
const SECT_IDS = new Map(FALLEN.SECTS.map(s => [s.id, s.name]));

// The three groups a Barabbus can have Fallen from, and their factions by name.
const PRIOR_GROUPS = {
  Traditions: M20.TRADITIONS.map(t => t.name),
  Technocracy: M20.TECHNOCRACY.map(t => t.name),
  Disparates: M20.DISPARATES.map(t => t.name),
};
const PRIOR_FACTIONS = new Map(
  Object.entries(PRIOR_GROUPS).flatMap(([group, names]) =>
    names.map(n => [n.toLowerCase(), { group, name: n }])));

const ENFORCE_MODES = new Set(['block', 'warn', 'off']);
const MAX_PACT = FALLEN.PACT_LEVELS.length;   // 10

function asObj(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const o = JSON.parse(v); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; } catch { return {}; }
  }
  return {};
}
const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, parseInt(v, 10) || 0));

/** Canonical sect name for an id or a display name; '' when unrecognised. */
function sectName(v) {
  const s = str(v, 80);
  if (!s) return '';
  return SECT_IDS.get(s.toLowerCase()) || SECT_NAMES.get(s.toLowerCase()) || '';
}

/** Is this character (row or payload) on the Fallen path? */
const isNephandi = c => !!c && c.affiliation === AFFILIATION;

/**
 * Normalise the Nephandi columns in a write payload.
 *
 * For characters that are not Nephandi the columns are blanked, but only when the
 * payload explicitly touches them or changes affiliation — the same rule
 * normalizeCharacterSorcerer uses, so an unrelated PATCH never wipes data.
 */
function normalizeCharacterNephandi(data, existing) {
  const affiliation = data.affiliation ?? existing?.affiliation ?? '';
  const touches = COLUMNS.some(k => k in data);

  if (affiliation !== AFFILIATION) {
    if (!touches && data.affiliation === undefined) return data;
    for (const col of COLUMNS) {
      if (data[col] !== undefined) data[col] = col === 'pact_rating' ? 0 : '';
    }
    // Leaving the path clears it even when the payload did not name the columns.
    if (data.affiliation !== undefined && existing && isNephandi(existing)) {
      for (const col of COLUMNS) data[col] = col === 'pact_rating' ? 0 : '';
    }
    return data;
  }

  // Nephandi are Awakened; the sect lives in `tradition`.
  if (data.character_type !== undefined && data.character_type !== 'awakened') {
    data.character_type = 'awakened';
  }
  if (data.tradition !== undefined) data.tradition = sectName(data.tradition);

  if (data.nephandi_origin !== undefined) {
    const o = str(data.nephandi_origin, 24).toLowerCase();
    data.nephandi_origin = ORIGIN_IDS.has(o) ? o : '';
  }

  const origin = data.nephandi_origin ?? existing?.nephandi_origin ?? '';
  if (origin === 'barabbi') {
    // The prior faction decides the group, so trust the faction and derive the
    // group from it; that keeps the two columns consistent whatever the client sent.
    if (data.nephandi_prior_faction !== undefined) {
      const hit = PRIOR_FACTIONS.get(str(data.nephandi_prior_faction, 80).toLowerCase());
      data.nephandi_prior_faction = hit ? hit.name : '';
      data.nephandi_prior_affiliation = hit ? hit.group : '';
    } else if (data.nephandi_prior_affiliation !== undefined) {
      data.nephandi_prior_affiliation =
        PRIOR_GROUPS[data.nephandi_prior_affiliation] ? data.nephandi_prior_affiliation : '';
    }
  } else if (origin) {
    // Caul-Born and Widderslainte never had a prior faction.
    if (data.nephandi_prior_faction !== undefined || data.nephandi_origin !== undefined) {
      data.nephandi_prior_faction = '';
      data.nephandi_prior_affiliation = '';
    }
  }

  if (data.pact_rating !== undefined) data.pact_rating = int(data.pact_rating, 0, MAX_PACT);
  return data;
}

// ── Chronicle rules ──────────────────────────────────────────────────────────
// Shape of rules.nephandi (all optional):
//   allowNephandi:    bool            default true
//   allowedSects:     null | string[] (FALLEN.SECTS ids; [] = none)
//   allowedOrigins:   null | string[] (FALLEN.ORIGINS ids)
//   allowPacts:       bool            default false — the book does not endorse
//                                     Infernal Pacts as a player-character option (p. 120)
//   maxPactRating:    int 0..10       default 10, only meaningful with allowPacts
//   enforceTraitLimits: 'block' | 'warn' | 'off'  default 'off' — the book says
//                                     Nephandic Merits and Flaws may exceed the
//                                     usual limits (p. 117), so caps are off by default
function sanitizeNephandiRules(raw) {
  const r = asObj(raw); const out = {};
  const list = (v, ids) => Array.isArray(v) ? v.filter(id => ids.has(id)) : null;
  if (r.allowNephandi !== undefined) out.allowNephandi = !!r.allowNephandi;
  if (r.allowedSects !== undefined) {
    const l = list(r.allowedSects, new Set(SECT_IDS.keys()));
    if (l) out.allowedSects = l;
  }
  if (r.allowedOrigins !== undefined) {
    const l = list(r.allowedOrigins, ORIGIN_IDS);
    if (l) out.allowedOrigins = l;
  }
  if (r.allowPacts !== undefined) out.allowPacts = !!r.allowPacts;
  if (r.maxPactRating !== undefined) out.maxPactRating = int(r.maxPactRating, 0, MAX_PACT);
  if (r.enforceTraitLimits !== undefined) {
    out.enforceTraitLimits = ENFORCE_MODES.has(r.enforceTraitLimits) ? r.enforceTraitLimits : 'off';
  }
  return out;
}

module.exports = {
  FALLEN,
  AFFILIATION,
  COLUMNS,
  MAX_PACT,
  isNephandi,
  sectName,
  normalizeCharacterNephandi,
  sanitizeNephandiRules,
  PRIOR_GROUPS,
};
