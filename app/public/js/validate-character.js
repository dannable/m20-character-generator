/* ═══════════════════════════════════════════════════════════════════════════
   SHARED CHARACTER VALIDATOR
   Runs in the browser (sidebar issues, Prism checks) and on the server
   (routes/characters.js, routes/chronicles.js) so a chronicle's rules are
   checked the same way in both places.

   CharValidator.validate(char, rules, opts) → { errors: [], warnings: [] }
     char   plain character object (JSON columns already parsed)
     rules  chronicle rules object ({} when unlinked)
     opts   { creation: bool }  creation-time checks (trait caps) only apply
                                while the character is a draft or being finalized
   Each item: { code, field, message, step }   step = wizard step index (0-6)
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    const path = require('path');
    module.exports = factory(require(path.join(__dirname, 'data.js')), require(path.join(__dirname, 'data-prism.js')));
  } else {
    // M20 / PRISM are top-level consts from data.js / data-prism.js (shared script scope, not window properties)
    root.CharValidator = factory(M20, PRISM);
  }
})(typeof self !== 'undefined' ? self : this, function (M20, PRISM) {
  'use strict';

  const ABILITY_NAME = {};
  ['TALENTS','SKILLS','KNOWLEDGES','SECONDARY_TALENTS','SECONDARY_SKILLS','SECONDARY_KNOWLEDGES']
    .forEach(k => (M20[k] || []).forEach(a => { ABILITY_NAME[a.id] = a.name; }));
  const FACTION_LABEL = { Traditions: 'The Traditions', Technocracy: 'Technocratic Union', Disparates: 'Disparate Crafts' };
  const MAXDOT_DEFAULTS = { attributes: 5, talents: 5, skills: 5, knowledges: 5, backgrounds: 5, spheres: 3, arete: 3, willpower: 10 };
  const ATTRS = ['strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits'];

  const obj = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const num = v => (typeof v === 'number' ? v : parseInt(v, 10)) || 0;
  const mfSum = v => Array.isArray(v) ? v.reduce((a, b) => a + num(b), 0) : num(v);

  function normalizeAllowedFactions(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) { if (!raw.length) return null; const o = {}; raw.forEach(f => { o[f] = []; }); return o; }
    if (typeof raw === 'object' && !Object.keys(raw).length) return null;
    return raw;
  }

  function factionChecks(c, rules, out) {
    const norm = normalizeAllowedFactions(rules.allowedFactions);
    if (!norm || c.character_type === 'mortal') return;
    const aff = c.affiliation || '';
    if (aff && !(aff in norm)) {
      out.errors.push({ code: 'faction', field: 'affiliation', step: 0, message: `${FACTION_LABEL[aff] || aff} is not allowed in this Chronicle` });
      return;
    }
    const list = aff ? norm[aff] : null;
    if (c.tradition && Array.isArray(list) && list.length && !list.includes(c.tradition)) {
      out.errors.push({ code: 'subfaction', field: 'tradition', step: 0, message: `${c.tradition} is not allowed in this Chronicle` });
    }
  }

  function capChecks(c, rules, out) {
    if (c.character_type === 'mortal') return;
    const md = { ...MAXDOT_DEFAULTS, ...obj(rules.maxDots) };
    ATTRS.forEach(a => { if (num(c[a]) > md.attributes) out.errors.push({ code: 'cap', field: a, step: 1, message: `${a[0].toUpperCase() + a.slice(1)} ${c[a]} exceeds the cap of ${md.attributes}` }); });
    [['talents', md.talents, 2], ['skills', md.skills, 2], ['knowledges', md.knowledges, 2]].forEach(([key, cap, step]) => {
      Object.entries(obj(c[key])).forEach(([id, v]) => { if (num(v) > cap) out.errors.push({ code: 'cap', field: `${key}.${id}`, step, message: `${ABILITY_NAME[id] || id} ${v} exceeds the cap of ${cap}` }); });
    });
    Object.entries(obj(c.backgrounds)).forEach(([id, v]) => { if (num(v) > md.backgrounds) out.errors.push({ code: 'cap', field: `backgrounds.${id}`, step: 3, message: `Background ${id} ${v} exceeds the cap of ${md.backgrounds}` }); });
    Object.entries(obj(c.spheres)).forEach(([id, v]) => { if (num(v) > md.spheres) out.errors.push({ code: 'cap', field: `spheres.${id}`, step: 5, message: `${id[0].toUpperCase() + id.slice(1)} ${v} exceeds the Sphere cap of ${md.spheres}` }); });
    if (num(c.arete) > md.arete) out.errors.push({ code: 'cap', field: 'arete', step: 5, message: `Arete ${c.arete} exceeds the cap of ${md.arete}` });
    if (num(c.willpower) > md.willpower) out.errors.push({ code: 'cap', field: 'willpower', step: 6, message: `Willpower ${c.willpower} exceeds the cap of ${md.willpower}` });
    const meritCap = rules.meritCap === undefined ? 7 : rules.meritCap;
    const merits = Object.values(obj(c.merits)).reduce((s, v) => s + mfSum(v), 0);
    if (meritCap !== null && merits > meritCap) out.errors.push({ code: 'cap', field: 'merits', step: 3, message: `Merits total ${merits} exceeds the cap of ${meritCap}` });
  }

  // ── Prism of Focus ─────────────────────────────────────────────────────────
  function prismRules(rules) { return obj(rules.prism); }
  function tenetsFor(rules, catId) {
    const r = prismRules(rules);
    const allow = r.allowedTenets && Array.isArray(r.allowedTenets[catId]) ? new Set(r.allowedTenets[catId]) : null;
    return PRISM.TENETS.filter(t => t.category === catId).filter(t => !allow || allow.has(t.id));
  }
  function allowedPractices(rules) {
    const r = prismRules(rules);
    const allow = Array.isArray(r.allowedPractices) ? new Set(r.allowedPractices) : null;
    return PRISM.PRACTICES.filter(p => !allow || allow.has(p.id));
  }
  function specialtiesFor(rules, baseId) {
    const r = prismRules(rules);
    const allow = Array.isArray(r.allowedSpecialties) ? new Set(r.allowedSpecialties) : null;
    return PRISM.SPECIALTIES.filter(s => s.base === baseId).filter(s => !allow || allow.has(s.id)).filter(s => !(s.corrupted && r.hideCorrupted));
  }
  function factionSpecialty(c) { return c.tradition ? (PRISM.SPECIALTIES.find(s => s.faction === c.tradition) || null) : null; }

  function prismChecks(c, rules, out) {
    const mode = c.focus_mode === 'prism' ? 'prism' : 'core';
    const forced = rules.focusMode === 'core' || rules.focusMode === 'prism' ? rules.focusMode : null;
    if (forced && forced !== mode) out.errors.push({ code: 'focus_mode', field: 'focus_mode', step: 0, message: `This Chronicle requires the ${forced === 'prism' ? 'Prism of Focus' : 'M20 Core'} focus system` });
    if (mode !== 'prism') return;
    const tenets = obj(c.tenets), ratings = obj(c.practice_ratings), specs = obj(c.practice_specialties);
    const r = prismRules(rules);
    PRISM.TENET_CATEGORIES.filter(k => k.required).forEach(k => {
      if (!tenets[k.id]) out.errors.push({ code: 'tenet_required', field: `tenets.${k.id}`, step: 4, message: `${k.name} tenet not chosen` });
    });
    Object.entries(tenets).forEach(([cat, id]) => {
      if (!tenetsFor(rules, cat).some(t => t.id === id)) out.errors.push({ code: 'tenet_allowed', field: `tenets.${cat}`, step: 4, message: `${PRISM.tenetById(id)?.name || id} is not allowed in this Chronicle` });
    });
    const nT = Object.values(tenets).filter(Boolean).length;
    const cap = PRISM.areteCap(tenets);
    if (num(c.arete) > cap) out.errors.push({ code: 'arete_tenets', field: 'arete', step: 4, message: `Arete ${c.arete} exceeds tenet count (${nT})` });
    const rated = Object.keys(ratings).filter(id => num(ratings[id]) > 0);
    if (!rated.length) out.errors.push({ code: 'practice_required', field: 'practice_ratings', step: 4, message: 'No practice rated' });
    const allowed = new Set(allowedPractices(rules).map(p => p.id));
    const hard = r.enforceAbilityRequirement !== false;
    rated.forEach(id => {
      const p = PRISM.practiceById(id); if (!p) { out.errors.push({ code: 'practice_unknown', field: `practice_ratings.${id}`, step: 4, message: `Unknown practice ${id}` }); return; }
      if (!allowed.has(id)) out.errors.push({ code: 'practice_allowed', field: `practice_ratings.${id}`, step: 4, message: `${p.name} is not allowed in this Chronicle` });
      const spec = specs[id];
      if (spec && !specialtiesFor(rules, id).some(s => s.id === spec)) out.errors.push({ code: 'specialty_allowed', field: `practice_specialties.${id}`, step: 4, message: `${PRISM.specialtyById(spec)?.name || spec} is not allowed in this Chronicle` });
      const have = PRISM.associatedAbilityDots(c, id), need = num(ratings[id]) * PRISM.COSTS.abilityDotsPerPracticeDot;
      if (have < need) (hard ? out.errors : out.warnings).push({ code: 'ability_req', field: `practice_ratings.${id}`, step: 4, message: `${p.name} ${ratings[id]} needs ${need} Associated Ability dots (have ${have})` });
    });
    if (r.requireFactionSpecialty) {
      const fs = factionSpecialty(c);
      if (fs && num(ratings[fs.base]) > 0 && specs[fs.base] !== fs.id) out.errors.push({ code: 'faction_specialty', field: `practice_specialties.${fs.base}`, step: 4, message: `${fs.faction} characters must take ${fs.name}` });
    }
    PRISM.REMOVED_SECONDARY_ABILITIES.forEach(id => {
      if (obj(c.skills)[id] !== undefined || obj(c.talents)[id] !== undefined) out.errors.push({ code: 'removed_ability', field: id, step: 2, message: `${ABILITY_NAME[id] || id} is replaced by a Practice in Prism mode` });
    });
  }

  function validate(char, rules, opts) {
    const c = char || {}, r = obj(rules), o = opts || {};
    const out = { errors: [], warnings: [] };
    factionChecks(c, r, out);
    if (o.creation) capChecks(c, r, out);
    prismChecks(c, r, out);
    return out;
  }

  return { validate, prismChecks: (c, r) => { const out = { errors: [], warnings: [] }; prismChecks(c, obj(r), out); return out; }, normalizeAllowedFactions };
});
