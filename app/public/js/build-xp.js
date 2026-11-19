/* ═══════════════════════════════════════════════════════════════════════════
   BUILD XP — what a character would have cost, priced at advancement rates
   Shared by the browser and the server, the same way validate-character.js is.

   Free Build (characters with build_mode = 'free') drops every creation budget
   and every cap, so there is no points-remaining figure to show. What replaces
   it is this: the sheet is priced dot by dot at the XP rates on M20 p. 336, so
   a Storyteller can see what the character is worth in the only currency that
   still means anything once the budgets are gone.

   Counted from a BLANK SHEET. Attributes start at 1, Abilities at 0, Arete at
   1 and Willpower at 5 (the dots a character has before anybody spends
   anything), and everything above that is priced. A by-the-book starting mage
   therefore reads around 245 XP rather than 0 — the number answers "what would
   it cost to buy this character outright", not "how much advancement has this
   character had".

   With freebies included, the 15 points (plus whatever the Flaws bring in,
   less whatever the Merits cost) are spent on the dots where a freebie buys
   the most XP, so the figure is the least this character could have cost.
   That ordering is why a Background dot tends to go first: one freebie point
   against eight XP at the fifth dot.

   What this does NOT price, because the app has no XP rate for it and this
   file will not invent one: Merits, Flaws, Specialties, mortal Virtues,
   Humanity, Quintessence, Paradox, Paradigm, Instruments and Prism Tenets.
   compute() lists them in `unpriced` rather than passing over them in silence.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.BuildXP = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ── Advancement costs ────────────────────────────────────────────────────
     M20 p. 336, Sorcerer p. 105, and the Prism of Focus house rules. This is
     the one copy: app.js's xpCost() delegates here, so the Advancement screen
     and the Free Build meter can never drift apart. `current` is the rating
     being raised FROM, so a 0 means buying the trait for the first time. */
  function cost(group, current, affinity) {
    switch (group) {
      case 'attribute':           return current * 4;
      case 'ability':             return current === 0 ? 3 : current * 2;
      case 'background':          return current === 0 ? 3 : current * 2;
      case 'background_sorcerer': return current === 0 ? 3 : current * 3;   // Sorcerer p. 105
      case 'sphere':              return current === 0 ? 10 : current * (affinity ? 7 : 8);
      case 'arete':               return current * 8;
      case 'willpower':           return current * 1;
      case 'resonance':           return current * 2;
      case 'numen':               return current === 0 ? 7 : current * (affinity ? 6 : 7);  // Sorcerer p. 105
      case 'practice':            return current === 0 ? 3 : current;        // Prism of Focus
      default:                    return null;
    }
  }

  /* ── Freebie costs (M20 p. 331) ───────────────────────────────────────────
     Only the traits freebies can actually buy appear here. A step with no
     entry can only be paid for in XP, which is the honest answer for Resonance,
     Numina and rated Practices — none of them are on the freebie table. */
  var FREEBIE = {
    attribute: 5,
    ability: 2, abilityNew: 3,
    background: 1, background_sorcerer: 1,
    sphere: 7,
    arete: 4,
    willpower: 1,
  };
  var FREEBIE_POINTS = 15;
  var FREEBIE_ARETE_DOTS = 3;     // freebies may raise Arete by at most three

  var ABILITY_COLS = ['talents', 'skills', 'knowledges'];

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
  function dict(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
  function mfSum(v) { return Array.isArray(v) ? v.reduce(function (a, b) { return a + num(b); }, 0) : num(v); }
  function points(d) {
    var t = 0, k;
    for (k in dict(d)) if (Object.prototype.hasOwnProperty.call(d, k)) t += mfSum(d[k]);
    return t;
  }

  /* Where each trait starts before anyone spends anything. */
  function baseWillpower(c) {
    if (c.character_type === 'mortal') return 1;     // mortals derive it from Courage
    return 5;                                        // Awakened and Sorcerer both start at 5
  }
  function baseArete(c) {
    return c.character_type === 'awakened' || !c.character_type ? 1 : 0;
  }

  /* ── Every dot the character has bought, one entry each ───────────────── */
  function steps(char) {
    var c = char || {}, out = [];
    var isSorcerer = c.character_type === 'sorcerer';

    function run(group, col, key, from, to, affinity, fbKey, fbFirstKey) {
      for (var v = from; v < to; v++) {
        var xp = cost(group, v, affinity);
        if (xp === null) continue;
        var fb = null;
        if (fbKey) fb = (v === 0 && fbFirstKey) ? FREEBIE[fbFirstKey] : FREEBIE[fbKey];
        out.push({ group: group, col: col || null, key: key, from: v, to: v + 1, xp: xp, fb: (fb === undefined ? null : fb) });
      }
    }

    ['strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits']
      .forEach(function (k) { run('attribute', null, k, 1, num(c[k]) || 1, false, 'attribute'); });

    ABILITY_COLS.forEach(function (col) {
      var d = dict(c[col]);
      Object.keys(d).forEach(function (k) { run('ability', col, k, 0, num(d[k]), false, 'ability', 'abilityNew'); });
    });

    var bgGroup = isSorcerer ? 'background_sorcerer' : 'background';
    var bgs = dict(c.backgrounds);
    Object.keys(bgs).forEach(function (k) { run(bgGroup, 'backgrounds', k, 0, num(bgs[k]), false, bgGroup); });

    var sph = dict(c.spheres);
    Object.keys(sph).forEach(function (k) {
      var aff = (c.affinity_sphere === k || c.affinity_sphere_2 === k);
      run('sphere', 'spheres', k, 0, num(sph[k]), aff, 'sphere');
    });

    run('arete', null, 'arete', baseArete(c), num(c.arete), false, 'arete');
    run('willpower', null, 'willpower', baseWillpower(c), num(c.willpower), false, 'willpower');

    (Array.isArray(c.resonance) ? c.resonance : []).forEach(function (r, i) {
      if (!r || !num(r.rating)) return;
      run('resonance', null, 'resonance_' + i, 0, num(r.rating), false, null);
    });

    var numina = dict(c.numina);
    Object.keys(numina).forEach(function (k) {
      run('numen', 'numina', k, 0, num(numina[k]), c.affinity_path === k, null);
    });

    var practices = dict(c.practice_ratings);
    Object.keys(practices).forEach(function (k) { run('practice', 'practice_ratings', k, 0, num(practices[k]), false, null); });

    return out;
  }

  /* Human-readable grouping for the summary panel. */
  var GROUP_LABEL = {
    attribute: 'Attributes', ability: 'Abilities', background: 'Backgrounds',
    background_sorcerer: 'Backgrounds', sphere: 'Spheres', arete: 'Arete',
    willpower: 'Willpower', resonance: 'Resonance', numen: 'Numina', practice: 'Practices',
  };
  var GROUP_ORDER = ['attribute', 'ability', 'background', 'background_sorcerer', 'sphere', 'arete', 'willpower', 'resonance', 'numen', 'practice'];

  /**
   * Price a character.
   * @param {object} char
   * @param {object} opts  { freebies: bool }  — whether the 15 points are in play
   * @returns {{gross:number,total:number,lines:Array,freebies:object,unpriced:Array,steps:Array}}
   */
  function compute(char, opts) {
    var c = char || {}, o = opts || {};
    var useFreebies = !!o.freebies;
    var all = steps(c);

    var gross = 0, byGroup = {};
    all.forEach(function (s) {
      gross += s.xp;
      var g = byGroup[s.group] || (byGroup[s.group] = { group: s.group, label: GROUP_LABEL[s.group] || s.group, dots: 0, xp: 0 });
      g.dots++; g.xp += s.xp;
    });

    var meritPts = points(c.merits), flawPts = points(c.flaws);
    var fb = {
      base: useFreebies ? FREEBIE_POINTS : 0,
      merits: meritPts, flaws: flawPts,
      pool: 0, spent: 0, saved: 0, over: 0, lines: [],
    };

    if (useFreebies) {
      // Flaws pay in, Merits pay out. Free Build lifts the usual seven-point
      // cap on Flaws along with every other restriction.
      var pool = FREEBIE_POINTS + flawPts - meritPts;
      if (pool < 0) { fb.over = -pool; pool = 0; }   // Merits outran the pool; say so rather than invent a rate
      fb.pool = pool;

      // Spend where a freebie point buys the most XP. One freebie point against
      // the eighth XP of a fifth Background dot beats five against an Attribute.
      var payable = all.filter(function (s) { return s.fb; })
        .slice()
        .sort(function (a, b) { return (b.xp / b.fb) - (a.xp / a.fb) || b.xp - a.xp; });

      var left = pool, areteDots = 0;
      payable.forEach(function (s) {
        if (s.fb > left) return;                                   // cannot part-pay a dot
        if (s.group === 'arete' && areteDots >= FREEBIE_ARETE_DOTS) return;
        left -= s.fb;
        if (s.group === 'arete') areteDots++;
        fb.spent += s.fb;
        fb.saved += s.xp;
        fb.lines.push(s);
      });
      fb.remaining = left;
    }

    var lines = GROUP_ORDER.filter(function (g) { return byGroup[g]; }).map(function (g) { return byGroup[g]; });

    return {
      mode: useFreebies ? 'freebies' : 'xp',
      gross: gross,
      total: Math.max(0, gross - fb.saved),
      lines: lines,
      freebies: fb,
      steps: all,
      unpriced: unpriced(c),
    };
  }

  /* Things on the sheet that carry no XP rate anywhere in the app. Reported so
     a total is never mistaken for "everything on this character". */
  function unpriced(c) {
    var out = [];
    if (points(c.merits)) out.push('Merits');
    if (points(c.flaws)) out.push('Flaws');
    var specs = dict(c.specialties);
    if (Object.keys(specs).length) out.push('Specialties');
    if (c.character_type === 'mortal') {
      if (points(c.virtues)) out.push('Virtues');
      if (num(c.humanity)) out.push('Humanity');
    }
    if (num(c.quintessence)) out.push('Quintessence');
    if (Object.keys(dict(c.tenets)).length) out.push('Tenets');
    return out;
  }

  return {
    cost: cost,
    steps: steps,
    compute: compute,
    FREEBIE: FREEBIE,
    FREEBIE_POINTS: FREEBIE_POINTS,
    GROUP_LABEL: GROUP_LABEL,
  };
});
