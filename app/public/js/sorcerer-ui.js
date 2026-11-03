/* ═══════════════════════════════════════════════════════════════════════════
   SORCERER UI — creator wizard pieces for the Sorcerer character type
   (M20 Sorcerer, Chapter Four). Loaded after app.js; hooks in Creator call in.

   Steps (Creator.STEPS_SORCERER):
     0 Concept      renderStep0Mortal + SorcererUI.conceptExtrasHTML
     1 Attributes   renderStep1Mortal (6/4/3)
     2 Abilities    renderStep2Mortal (11/7/4, max 3)
     3 Backgrounds  SorcererUI.renderBackgrounds   (5 dots + Artifact picker)
     4 Numina       SorcererUI.renderNumina        (5 dots, one style)
     5 Finishing    SorcererUI.renderFinishing     (freebies 21)
   ═══════════════════════════════════════════════════════════════════════════ */
const SorcererUI = {
  get C()     { return SORCERER.CREATION; },
  get COSTS() { return SORCERER.FREEBIE_COSTS; },

  ATTRS: ['strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits'],
  ATTR_NAME: id => id.charAt(0).toUpperCase() + id.slice(1),

  /* ── character helpers ───────────────────────────────────────────────── */
  ensure(c) {
    if (!c.numina || typeof c.numina !== 'object' || Array.isArray(c.numina)) c.numina = {};
    if (!Array.isArray(c.rituals))   c.rituals = [];
    if (!Array.isArray(c.artifacts)) c.artifacts = [];
    if (!c.numina_style)      c.numina_style = '';
    if (!c.casting_attribute) c.casting_attribute = '';
    if (!c.affinity_path)     c.affinity_path = '';
    if (c.faction === undefined) c.faction = '';
    // Legacy HH II shape { id: rating } → { id: { rating } }
    for (const [id, v] of Object.entries(c.numina)) if (typeof v === 'number') c.numina[id] = { rating: v };
    return c;
  },
  rules(c)        { return (c && c._chronicleRules && c._chronicleRules.sorcerer) || {}; },
  affiliation(c)  { return SORCERER.affiliationById(c.affiliation) || null; },
  isAligned(c)    { const a = this.affiliation(c); return !!(a && a.kind === 'affiliation'); },
  rating(c, id)   { const n = (c.numina || {})[id]; return n ? (typeof n === 'number' ? n : (n.rating || 0)) : 0; },
  numinaIds(c)    { return Object.keys(c.numina || {}).filter(id => this.rating(c, id) > 0); },
  pathIds(c)      { return this.numinaIds(c).filter(id => SORCERER.isPath(id) || (c.numina[id] && c.numina[id].kind === 'hedge')); },
  phenIds(c)      { return this.numinaIds(c).filter(id => SORCERER.isPhenomenon(id) || (c.numina[id] && c.numina[id].kind === 'psychic')); },
  totalDots(c)    { return this.numinaIds(c).reduce((s, id) => s + this.rating(c, id), 0); },
  freeDots(c)     { return this.C.numinaDots + (parseInt(this.rules(c).bonusNuminaDots, 10) || 0); },
  extraDots(c)    { return Math.max(0, this.totalDots(c) - this.freeDots(c)); },
  extraRituals(c) { return this.pathIds(c).reduce((s, id) => s + SORCERER.checkRituals(c, id, this.rating(c, id), { creation: true }).extra, 0); },
  /** Freebies spent on Numina at creation: 7 per dot beyond the free 5, 3 per ritual beyond one per Path dot. */
  numinaFreebieCost(c) { return this.extraDots(c) * this.COSTS.numina.cost + this.extraRituals(c) * this.COSTS.ritual.cost; },
  psychicCap(c)   { return SORCERER.psychicCap(c.willpower || this.C.startWillpower); },
  abilityRating(c, abilityId) {
    for (const k of ['talents','skills','knowledges']) if ((c[k] || {})[abilityId] !== undefined) return c[k][abilityId] || 0;
    return 0;
  },
  abilityName(id) {
    const all = [...M20.TALENTS, ...M20.SKILLS, ...M20.KNOWLEDGES, ...(M20.SECONDARY_TALENTS||[]), ...(M20.SECONDARY_SKILLS||[]), ...(M20.SECONDARY_KNOWLEDGES||[])];
    const a = all.find(x => x.id === id); return a ? a.name : id;
  },
  /** Abilities the character has at least one dot in (Path Ability choices), plus any custom ones. */
  abilitiesFor(c) {
    const out = [];
    for (const k of ['talents','skills','knowledges']) for (const [id, v] of Object.entries(c[k] || {})) if (v > 0) out.push({ id, name: (c.custom_ability_names || {})[id] || this.abilityName(id), rating: v });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },
  /** Casting Attribute choices: the Affiliation's two favored Attributes, or all nine when Unaligned / enforcement is off. */
  castingChoices(c) {
    const a = this.affiliation(c); const mode = this.rules(c).enforceFavored || 'block';
    if (a && a.kind === 'affiliation' && a.favoredAttributes.length && mode === 'block') return a.favoredAttributes;
    return this.ATTRS;
  },
  /** Affinity Path choices: favored Paths of the Affiliation (block mode), else every Path the character has. */
  affinityChoices(c) {
    const a = this.affiliation(c); const mode = this.rules(c).enforceFavored || 'block';
    if (a && a.kind === 'affiliation' && a.favoredPathIds.length && mode === 'block') return a.favoredPathIds.map(x => x.id);
    return SORCERER.PATHS.map(p => p.id);
  },
  allowedPaths(c) {
    const r = this.rules(c);
    return SORCERER.PATHS.filter(p => !Array.isArray(r.allowedPaths) || r.allowedPaths.includes(p.id));
  },
  allowedPhenomena(c) {
    const r = this.rules(c);
    return SORCERER.PHENOMENA.filter(p => !Array.isArray(r.allowedPhenomena) || r.allowedPhenomena.includes(p.id));
  },
  allowedAffiliations(c) {
    const r = this.rules(c);
    return SORCERER.AFFILIATIONS.filter(a => a.kind !== 'society' && (!Array.isArray(r.allowedAffiliations) || a.kind === 'unaligned' || r.allowedAffiliations.includes(a.id)));
  },
  /** Backgrounds for the Sorcerer, resolved to M20 background definitions (+ the Artifact entry). */
  backgrounds(c) {
    const names = SORCERER.backgroundsFor(c.faction || '');
    const NAME_TO_ID = { 'Arcane/Cloaking': 'arcane', 'Familiar/Companion': 'familiar', 'Construct': 'chantry', 'Hypercram': 'dream', 'Laboratory': 'sanctum' };
    const out = []; const seen = new Set();
    names.forEach(n => {
      if (n === 'Artifact') { if (!seen.has('artifact')) { seen.add('artifact'); out.push(this.ARTIFACT_BG); } return; }
      const id = NAME_TO_ID[n] || (M20.BACKGROUNDS.find(b => b.name === n || b.traditionName === n || b.technocracyName === n) || {}).id;
      if (!id || seen.has(id)) return;
      const b = M20.BACKGROUNDS.find(x => x.id === id); if (!b) return;
      seen.add(id);
      out.push({ ...b, name: (c.faction === 'technocracy' && b.technocracyName) ? b.technocracyName : (b.traditionName || b.name) });
    });
    return out;
  },
  ARTIFACT_BG: { id: 'artifact', name: 'Artifact', max: 5, description: 'Begin play with a supernatural item. Each dot is a more powerful Artifact; the Storyteller builds it from your suggestions, roughly equal to an Enchantment-made item. Sorcerer p. 106.',
    levels: ['A minor Artifact', 'A useful Artifact', 'An Artifact of significant power', 'A much-sought Artifact mentioned in legends', 'An artifact of incredible power'] },

  /* ── Step 0: Affiliation, alignment, Essence ────────────────────────── */
  conceptExtrasHTML(c) {
    this.ensure(c);
    const affs = this.allowedAffiliations(c);
    const cur = this.affiliation(c);
    const opts = affs.map(a => `<option value="${a.id}" ${c.affiliation === a.id ? 'selected' : ''}>${escHtml(a.name)}</option>`).join('');
    const favored = cur && cur.kind === 'affiliation' ? `
      <div class="sorc-favored">
        <div><span class="sorc-favored-label">Favored Attributes</span> ${cur.favoredAttributes.map(this.ATTR_NAME).join(', ') || '—'}</div>
        <div><span class="sorc-favored-label">Favored Paths</span> ${cur.favoredPaths.map(escHtml).join(', ') || '—'}${cur.favoredNote ? ` <em>${escHtml(cur.favoredNote)}</em>` : ''}</div>
      </div>` : '';
    const desc = cur ? `<details class="sorc-affil-desc"><summary>About ${escHtml(cur.name)} <span class="page-ref">Sorcerer p. ${cur.page || ''}</span></summary><div class="sorc-affil-text">${this._paras(cur.description)}</div></details>` : '';
    const alignOpts = SORCERER.ALIGNMENTS.map(a => `<option value="${a.id}" ${(c.faction || '') === a.id ? 'selected' : ''}>${escHtml(a.name)}</option>`).join('');
    const essOpts = (M20.ESSENCES || []).map(e => { const n = e.name || e; return `<option value="${escHtml(n)}" ${c.essence === n ? 'selected' : ''}>${escHtml(n)}</option>`; }).join('');
    return `
      <div class="step-section" id="sorc-concept">
        <div class="step-section-title">Affiliation <span class="page-ref">Sorcerer p. 79–95, 103</span></div>
        <p class="step-instructions" style="margin-top:0">Most sorcerers learn from a mentor and a society. Your Affiliation sets the Attribute you cast with and the Paths you are best at. Lone practitioners and unaligned covens may choose any.</p>
        <div class="form-grid">
          <div class="form-group">
            <label>Affiliation</label>
            <select id="f-sorc-affiliation"><option value="">— Choose —</option>${opts}</select>
          </div>
          <div class="form-group">
            <label>Ascension War alignment <span class="info-tip" data-tip="Sorcerers aligned with the Traditions, the Disparate Alliance or the Technocratic Union gain that faction's extra Backgrounds (Sorcerer p. 104). Leave as None for an independent sorcerer.">?</span></label>
            <select id="f-sorc-alignment">${alignOpts}</select>
          </div>
          <div class="form-group">
            <label>Essence <span class="info-tip" data-tip="A sorcerer's Avatar is subtle but present. Choose the Essence that fits the concept and Affiliation (M20 p. 266–273).">?</span></label>
            <select id="f-sorc-essence"><option value="">— Choose —</option>${essOpts}</select>
          </div>
        </div>
        ${favored}
        ${desc}
      </div>`;
  },
  attachStep0(content, creator) {
    const c = creator.char;
    const sel = content.querySelector('#f-sorc-affiliation');
    if (sel) sel.addEventListener('change', () => {
      c.affiliation = sel.value;
      // Re-validate casting Attribute / Affinity Path against the new favored lists
      if (c.casting_attribute && !this.castingChoices(c).includes(c.casting_attribute)) c.casting_attribute = '';
      if (c.affinity_path && !this.affinityChoices(c).includes(c.affinity_path)) c.affinity_path = '';
      creator.renderStep({ scroll: false });
    });
    const al = content.querySelector('#f-sorc-alignment');
    if (al) al.addEventListener('change', () => { c.faction = al.value; creator.updateSidebar && creator.updateSidebar(); });
    const es = content.querySelector('#f-sorc-essence');
    if (es) es.addEventListener('change', () => { c.essence = es.value; creator.updateSidebar && creator.updateSidebar(); });
  },

  /* ── Step 3: Backgrounds + Artifact ─────────────────────────────────── */
  renderBackgrounds(creator) {
    const c = creator.char; this.ensure(c);
    const bgs = this.backgrounds(c);
    const pool = this.C.backgroundDots;
    const used = bgs.reduce((s, b) => s + ((c.backgrounds || {})[b.id] || 0), 0);
    const row = b => {
      const val = (c.backgrounds || {})[b.id] || 0;
      const safeDesc = (b.description || '').replace(/"/g, '&quot;');
      const tip = i => (b.levels && b.levels[i]) ? ` title="${String(b.levels[i]).replace(/"/g, '&quot;')}"` : '';
      return `<div class="attr-row mortal-trait-row" data-attr-id="${b.id}">
        <div class="attr-info"><div class="attr-name">${escHtml(b.name)} <span class="info-tip" data-tip="${safeDesc}">?</span></div></div>
        <span class="dots mortal-trait-dots" data-mortal-bg="${b.id}">
          ${Array.from({ length: Math.min(b.max || 5, 5) }, (_, i) => `<span class="dot${i < val ? ' filled' : ''}" data-val="${i + 1}"${tip(i)}></span>`).join('')}
        </span>
      </div>`;
    };
    const artDots = (c.backgrounds || {}).artifact || 0;
    const artSum  = c.artifacts.reduce((s, a) => s + (a.rating || 0), 0);
    const artRows = c.artifacts.map((a, i) => `
      <div class="sorc-artifact-row" data-idx="${i}">
        <span class="sorc-artifact-name">${escHtml(a.name)} <span class="sorc-dots-inline">${'●'.repeat(a.rating || 0)}</span>${a.id ? '' : ' <span class="custom-badge">Custom</span>'}</span>
        <input type="text" class="sorc-artifact-notes" data-idx="${i}" value="${escHtml(a.notes || '')}" placeholder="Notes, story hooks, restrictions…" maxlength="500">
        <button type="button" class="btn-remove-secondary sorc-artifact-remove" data-idx="${i}" title="Remove">×</button>
      </div>`).join('');
    const artOpts = SORCERER.ARTIFACTS.map(a => `<option value="${a.id}">${escHtml(a.name)} (${'●'.repeat(a.rating)})</option>`).join('');
    const artifactSection = artDots > 0 ? `
      <div class="step-section" id="sorc-artifacts">
        <div class="step-section-title">Artifacts <span class="cw-note">${artSum} of ${artDots} dot${artDots !== 1 ? 's' : ''} assigned</span> <span class="page-ref">Sorcerer p. 106, 108–110</span></div>
        <p class="step-note">Your Artifact Background dots are spent on one or more items; the ratings must add up to the dots. Pick from the Tools of the Trade or describe your own for the Storyteller to build.</p>
        ${artRows || '<p class="practice-empty-hint">No artifact chosen yet.</p>'}
        ${artSum < artDots ? `
        <div class="practice-adder-row" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.4rem">
          <select id="sorc-artifact-add"><option value="">＋ Tools of the Trade…</option>${artOpts}</select>
          <input type="text" id="sorc-artifact-custom-name" placeholder="or a custom artifact…" maxlength="80" style="flex:1;min-width:10rem">
          <select id="sorc-artifact-custom-rating">${[1,2,3,4,5].map(n => `<option value="${n}">${'●'.repeat(n)}</option>`).join('')}</select>
          <button type="button" class="btn-secondary btn-sm" id="sorc-artifact-custom-add">Add</button>
        </div>` : ''}
        <div id="sorc-artifact-detail" class="sorc-detail"></div>
      </div>` : '';
    return `
      ${creator.stepHeader('Step IV — Backgrounds',
        '"Some sorcerers have plentiful magical allies and tools at hand; others possess political power and money."',
        `Spend <strong>${pool}</strong> Background dots. ${c.faction ? `Your ${escHtml((SORCERER.ALIGNMENTS.find(a => a.id === c.faction) || {}).name || '')} alignment adds its Backgrounds to the list.` : 'Aligning with the Traditions, Disparates or Technocracy in Step I adds that faction\'s Backgrounds.'} <span class="page-ref">Sorcerer p. 104, 106</span>`)}
      <div class="step-section">
        <div class="step-section-title">Backgrounds ${creator._mortalPoolCounter('Background', used, pool, this.COSTS.background.cost)}</div>
        <div class="mortal-bg-grid">${bgs.map(row).join('')}</div>
        <p class="step-note">Going over the pool is allowed; the overage is paid from freebies in Step VI.</p>
      </div>
      ${artifactSection}`;
  },
  attachBackgrounds(content, creator) {
    const c = creator.char;
    const rerender = () => creator.renderStep({ scroll: false });
    const add = content.querySelector('#sorc-artifact-add');
    if (add) add.addEventListener('change', () => {
      const a = SORCERER.artifactById(add.value); if (!a) return;
      c.artifacts.push({ id: a.id, name: a.name, rating: a.rating, notes: '' }); rerender();
    });
    const cadd = content.querySelector('#sorc-artifact-custom-add');
    if (cadd) cadd.addEventListener('click', () => {
      const name = (content.querySelector('#sorc-artifact-custom-name') || {}).value || '';
      const rating = parseInt((content.querySelector('#sorc-artifact-custom-rating') || {}).value, 10) || 1;
      if (!name.trim()) return;
      c.artifacts.push({ id: '', name: name.trim(), rating, notes: '' }); rerender();
    });
    content.querySelectorAll('.sorc-artifact-remove').forEach(b => b.addEventListener('click', () => { c.artifacts.splice(parseInt(b.dataset.idx, 10), 1); rerender(); }));
    content.querySelectorAll('.sorc-artifact-notes').forEach(i => i.addEventListener('input', () => { const a = c.artifacts[parseInt(i.dataset.idx, 10)]; if (a) a.notes = i.value; }));
    content.querySelectorAll('.sorc-artifact-name').forEach(el => el.addEventListener('click', () => {
      const idx = parseInt(el.closest('.sorc-artifact-row').dataset.idx, 10); const a = c.artifacts[idx]; const cat = a && a.id ? SORCERER.artifactById(a.id) : null;
      const d = content.querySelector('#sorc-artifact-detail'); if (!d) return;
      d.innerHTML = cat ? `<strong>${escHtml(cat.name)}</strong> <span class="page-ref">Sorcerer p. ${cat.page || ''}</span>${this._paras(cat.text)}` : '';
    }));
  },

  /* ── Step 4: Numina ─────────────────────────────────────────────────── */
  renderNumina(creator) {
    const c = creator.char; this.ensure(c);
    const r = this.rules(c);
    const style = c.numina_style;
    const free = this.freeDots(c), total = this.totalDots(c), extra = this.extraDots(c);
    const styleBtn = (id, label, sub) => `<button type="button" class="focus-mode-btn sorc-style-btn${style === id ? ' active' : ''}" data-style="${id}">
      <span class="focus-mode-name">${label}</span><span class="focus-mode-sub">${sub}</span></button>`;
    const picker = `
      <div class="step-section">
        <div class="step-section-title">Style of Numina <span class="page-ref">Sorcerer p. 104</span></div>
        <p class="step-instructions" style="margin-top:0">Your 5 Numina dots are spent within one style. ${r.allowBothStyles ? 'This chronicle allows both styles at creation.' : 'Combining hedge magic with psychic phenomena is a later study (21 XP, Storyteller approval).'}</p>
        <div class="focus-mode-group" id="sorc-style-group">
          ${styleBtn('hedge', 'Hedge Magic', 'Paths cast with an Attribute + Ability; rituals; Affinity Path')}
          ${styleBtn('psychic', 'Psychic Phenomena', 'Willpower-driven powers, capped at half your Willpower')}
        </div>
      </div>`;
    const budget = `
      <div class="prism-budget" id="sorc-budget">
        <span><strong>${Math.min(total, free)}</strong> / ${free} free dots</span>
        ${extra > 0 ? `<span class="prism-budget-extra">+${extra} dot${extra !== 1 ? 's' : ''} from freebies (${extra * this.COSTS.numina.cost} pts)</span>` : ''}
        ${this.extraRituals(c) > 0 ? `<span class="prism-budget-extra">+${this.extraRituals(c)} extra ritual${this.extraRituals(c) !== 1 ? 's' : ''} (${this.extraRituals(c) * this.COSTS.ritual.cost} pts)</span>` : ''}
      </div>`;
    let body = '';
    if (style === 'hedge' || (r.allowBothStyles && style)) body += this._hedgeSection(creator);
    if (style === 'psychic' || (r.allowBothStyles && style)) body += this._psychicSection(creator);
    return `
      ${creator.stepHeader('Step V — Numina',
        '"Each sorcerer has 5 dots of Numina to spend to determine the skill and power they have developed."',
        `Choose Hedge Magic <em>or</em> Psychic Phenomena, then spend <strong>${free}</strong> dots. Extra dots cost <strong>${this.COSTS.numina.cost}</strong> freebies each and extra rituals <strong>${this.COSTS.ritual.cost}</strong>. <span class="page-ref">Sorcerer p. 12–17, 54, 104</span>`)}
      ${picker}
      ${style ? budget : ''}
      ${body}`;
  },

  _hedgeSection(creator) {
    const c = creator.char;
    const aff = this.affiliation(c);
    const castOpts = this.castingChoices(c).map(id => `<option value="${id}" ${c.casting_attribute === id ? 'selected' : ''}>${this.ATTR_NAME(id)}${aff && aff.favoredAttributes.includes(id) ? ' ✦' : ''}</option>`).join('');
    const myPaths = this.pathIds(c);
    const affChoices = this.affinityChoices(c);
    const affOpts = affChoices.map(id => { const p = SORCERER.pathById(id); return p ? `<option value="${id}" ${c.affinity_path === id ? 'selected' : ''}>${escHtml(p.name)}${myPaths.includes(id) ? '' : ' (not yet learned)'}</option>` : ''; }).join('');
    const allowed = this.allowedPaths(c).filter(p => !myPaths.includes(p.id));
    const addOpts = allowed.map(p => `<option value="${p.id}">${escHtml(p.name)}${p.placeholder ? ' (not in this book)' : ''}${aff && aff.favoredPathIds.some(x => x.id === p.id) ? ' ✦' : ''}</option>`).join('');
    const rows = myPaths.map(id => this._pathRowHTML(c, id)).join('');
    return `
      <div class="step-section" id="sorc-hedge">
        <div class="step-section-title">Hedge Magic <span class="page-ref">Sorcerer p. 12</span></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Casting Attribute <span class="info-tip" data-tip="Every spell and ritual rolls this Attribute + the Path's Ability, difficulty Path level + 4. Aligned sorcerers choose from their Affiliation's two favored Attributes (✦).">?</span></label>
            <select id="sorc-casting"><option value="">— Choose —</option>${castOpts}</select>
          </div>
          <div class="form-group">
            <label>Affinity Path <span class="info-tip" data-tip="Your Affinity Path is rolled for countermagic and advances at 6 XP per dot instead of 7. Aligned sorcerers choose from their Affiliation's favored Paths.">?</span></label>
            <select id="sorc-affinity"><option value="">— Choose —</option>${affOpts}</select>
          </div>
        </div>
        <div class="sorc-path-list" id="sorc-path-list">${rows || '<p class="practice-empty-hint">No Paths yet. Add one below.</p>'}</div>
        <div class="practice-adder-row" style="margin-top:0.5rem">
          <select id="sorc-path-add"><option value="">＋ Add a Path…</option>${addOpts}</select>
        </div>
        <div id="sorc-path-detail" class="sorc-detail"></div>
      </div>`;
  },

  _pathRowHTML(c, id) {
    const p = SORCERER.pathById(id) || { id, name: (c.numina[id] && c.numina[id].custom_name) || id, rituals: [], placeholder: true, description: '' };
    const n = c.numina[id] || {}; const rating = n.rating || 0;
    const abil = n.ability || ''; const abilRating = abil ? this.abilityRating(c, abil) : 0;
    const overCap = abil && rating > abilRating;
    const practiceOpts = (M20.PRACTICES || []).map(pr => `<option value="${pr.id}" ${n.practice === pr.id ? 'selected' : ''}>${escHtml(pr.name)}</option>`).join('');
    const abilOpts = this.abilitiesFor(c).map(a => `<option value="${a.id}" ${abil === a.id ? 'selected' : ''}>${escHtml(a.name)} (${a.rating})</option>`).join('');
    const dots = Array.from({ length: 5 }, (_, i) => `<span class="dot${i < rating ? ' filled' : ''}" data-val="${i + 1}"></span>`).join('');
    const known = SORCERER.ritualsFor(c, id);
    const chk = SORCERER.checkRituals(c, id, rating, { creation: true });
    const ritualRows = known.map(rt => `<span class="practice-tag sorc-ritual-tag" title="${escHtml((SORCERER.ritualById(id, rt.id) || {}).text || rt.notes || '')}">
        <span class="practice-tag-name">${escHtml(rt.name)} <span class="sorc-dots-inline">${'●'.repeat(rt.level)}</span></span>
        <button type="button" class="practice-tag-remove sorc-ritual-remove" data-path="${id}" data-ritual="${escHtml(rt.id)}" title="Remove">×</button></span>`).join('');
    const avail = (p.rituals || []).filter(rt => rt.level <= Math.max(rating, 1) && !known.some(k => k.id === rt.id));
    const ritualOpts = avail.map(rt => `<option value="${rt.id}">${escHtml(rt.name)} (${'●'.repeat(rt.level)})</option>`).join('');
    const isAff = c.affinity_path === id;
    return `
      <div class="attr-row sorc-path-row" data-path="${id}">
        <div class="attr-row-main">
          <div class="attr-info"><div class="attr-name sorc-path-name" data-path="${id}" title="Show rules text">${escHtml(p.name)}${isAff ? ' <span class="secondary-badge">✦ Affinity</span>' : ''}${p.placeholder ? ' <span class="custom-badge">No rules text</span>' : ''}<span class="page-ref">${p.page ? ` p. ${p.page}` : ''}</span></div></div>
          <div style="display:flex;align-items:center;gap:0.4rem">
            <span class="dots sorc-path-dots" data-path="${id}">${dots}</span>
            <button type="button" class="btn-remove-secondary sorc-path-remove" data-path="${id}" title="Remove Path">×</button>
          </div>
        </div>
        <div class="sorc-path-config">
          <label>Practice <select class="sorc-path-practice" data-path="${id}"><option value="">— Choose —</option>${practiceOpts}</select></label>
          <label>Path Ability <select class="sorc-path-ability" data-path="${id}"><option value="">— Choose —</option>${abilOpts}</select></label>
          ${overCap ? `<span class="prism-warn">Rating ${rating} exceeds ${escHtml(this.abilityName(abil))} ${abilRating}: the Ability caps the Path.</span>` : ''}
        </div>
        <div class="sorc-rituals">
          <span class="sorc-rituals-label">Rituals <span class="cw-note">(${known.length} of ${rating} free)</span></span>
          <div class="practices-list">${ritualRows || '<span class="practice-empty-hint">None yet.</span>'}</div>
          <div class="practice-adder-row" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.3rem">
            ${ritualOpts ? `<select class="sorc-ritual-add" data-path="${id}"><option value="">＋ Sample ritual…</option>${ritualOpts}</select>` : ''}
            <input type="text" class="sorc-ritual-custom" data-path="${id}" placeholder="or a custom ritual…" maxlength="80" style="flex:1;min-width:9rem">
            <select class="sorc-ritual-custom-level" data-path="${id}">${[1,2,3,4,5].map(n => `<option value="${n}" ${n > rating ? 'disabled' : ''}>${'●'.repeat(n)}</option>`).join('')}</select>
            <button type="button" class="btn-secondary btn-sm sorc-ritual-custom-add" data-path="${id}">Add</button>
          </div>
          ${chk.errors.length ? `<div class="prism-warn">${chk.errors.map(escHtml).join('<br>')}</div>` : ''}
        </div>
      </div>`;
  },

  _psychicSection(creator) {
    const c = creator.char;
    const cap = this.psychicCap(c);
    const my = this.phenIds(c);
    const anti = my.includes('anti_psychic');
    const allowed = this.allowedPhenomena(c).filter(p => !my.includes(p.id));
    const addOpts = allowed.map(p => `<option value="${p.id}" ${anti || (p.id !== 'anti_psychic' && false) ? 'disabled' : ''}>${escHtml(p.name)}</option>`).join('');
    const rows = my.map(id => {
      const p = SORCERER.phenomenonById(id) || { name: (c.numina[id] && c.numina[id].custom_name) || id };
      const rating = this.rating(c, id);
      const dots = Array.from({ length: 5 }, (_, i) => `<span class="dot${i < rating ? ' filled' : ''}${i >= cap ? ' dot-locked' : ''}" data-val="${i + 1}" title="${i >= cap ? `Above your Willpower cap (${cap})` : ''}"></span>`).join('');
      return `<div class="attr-row sorc-phen-row" data-phen="${id}">
        <div class="attr-row-main">
          <div class="attr-info"><div class="attr-name sorc-phen-name" data-phen="${id}" title="Show rules text">${escHtml(p.name)}<span class="page-ref">${p.page ? ` p. ${p.page}` : ''}</span></div></div>
          <div style="display:flex;align-items:center;gap:0.4rem">
            <span class="dots sorc-phen-dots" data-phen="${id}">${dots}</span>
            <button type="button" class="btn-remove-secondary sorc-phen-remove" data-phen="${id}" title="Remove">×</button>
          </div>
        </div>
        ${rating > cap ? `<div class="prism-warn">${escHtml(p.name)} ${rating} is above the cap of ${cap} (half of Willpower ${c.willpower}). Raise Willpower in Step VI or lower the rating.</div>` : ''}
      </div>`;
    }).join('');
    return `
      <div class="step-section" id="sorc-psychic">
        <div class="step-section-title">Psychic Phenomena <span class="cw-note">cap ${cap} (Willpower ${c.willpower} ÷ 2)</span> <span class="page-ref">Sorcerer p. 54</span></div>
        <p class="step-instructions" style="margin-top:0">Each Phenomenon is capped at half your Willpower, rounded down. Anti-Psychics cannot develop any other Phenomenon.</p>
        <div class="sorc-path-list" id="sorc-phen-list">${rows || '<p class="practice-empty-hint">No Phenomena yet. Add one below.</p>'}</div>
        <div class="practice-adder-row" style="margin-top:0.5rem">
          <select id="sorc-phen-add" ${anti ? 'disabled title="Anti-Psychics cannot learn other Phenomena"' : ''}><option value="">＋ Add a Phenomenon…</option>${addOpts}</select>
        </div>
        <div id="sorc-phen-detail" class="sorc-detail"></div>
      </div>`;
  },

  attachNumina(content, creator) {
    const c = creator.char; this.ensure(c);
    const rerender = () => { creator.renderStep({ scroll: false }); creator.updateFreebieDisplay(); };
    // Style toggle
    content.querySelectorAll('.sorc-style-btn').forEach(b => b.addEventListener('click', () => {
      const s = b.dataset.style; if (s === c.numina_style) return;
      const other = s === 'hedge' ? this.phenIds(c) : this.pathIds(c);
      if (other.length && !this.rules(c).allowBothStyles) {
        if (!confirm('Switching style removes the Numina you have chosen in the other style. Continue?')) return;
        other.forEach(id => { delete c.numina[id]; });
        c.rituals = c.rituals.filter(r => c.numina[r.path]);
        if (s === 'psychic') { c.casting_attribute = ''; c.affinity_path = ''; }
      }
      c.numina_style = s; rerender();
    }));
    const sel = (q, fn) => { const el = content.querySelector(q); if (el) el.addEventListener('change', () => fn(el)); };
    sel('#sorc-casting',  el => { c.casting_attribute = el.value; creator.updateSidebar && creator.updateSidebar(); });
    sel('#sorc-affinity', el => { c.affinity_path = el.value; rerender(); });
    sel('#sorc-path-add', el => { if (!el.value) return; c.numina[el.value] = { rating: 1, practice: '', ability: '' }; if (!c.affinity_path && this.affinityChoices(c).includes(el.value)) c.affinity_path = el.value; rerender(); });
    sel('#sorc-phen-add', el => { if (!el.value) return; if (el.value === 'anti_psychic' && this.phenIds(c).length && !confirm('Anti-Psychic cannot be combined with other Phenomena. Remove the others?')) return; if (el.value === 'anti_psychic') this.phenIds(c).forEach(id => delete c.numina[id]); c.numina[el.value] = { rating: 1 }; rerender(); });
    content.querySelectorAll('.sorc-path-practice').forEach(s => s.addEventListener('change', () => { const n = c.numina[s.dataset.path]; if (n) n.practice = s.value; }));
    content.querySelectorAll('.sorc-path-ability').forEach(s => s.addEventListener('change', () => { const n = c.numina[s.dataset.path]; if (n) { n.ability = s.value; rerender(); } }));
    content.querySelectorAll('.sorc-path-remove').forEach(b => b.addEventListener('click', () => { const id = b.dataset.path; delete c.numina[id]; c.rituals = c.rituals.filter(r => r.path !== id); if (c.affinity_path === id) c.affinity_path = ''; rerender(); }));
    content.querySelectorAll('.sorc-phen-remove').forEach(b => b.addEventListener('click', () => { delete c.numina[b.dataset.phen]; rerender(); }));
    const dotClick = (grp, id, max) => grp.addEventListener('click', e => {
      const dot = e.target.closest('.dot'); if (!dot) return;
      const val = parseInt(dot.dataset.val, 10); const cur = this.rating(c, id);
      let next = cur === val ? val - 1 : val;
      if (next > max) { toast(`Capped at ${max} here.`, 'error'); return; }
      if (next < 1) next = 1;
      const was = this.numinaFreebieCost(c), have = creator.freebiesRemaining();
      c.numina[id].rating = next;
      const delta = this.numinaFreebieCost(c) - was;
      if (delta > 0 && delta > have) { c.numina[id].rating = cur; toast(`Not enough freebie points (need ${delta}, have ${have}).`, 'error'); return; }
      rerender();
    });
    content.querySelectorAll('.sorc-path-dots').forEach(g => dotClick(g, g.dataset.path, 5));
    content.querySelectorAll('.sorc-phen-dots').forEach(g => dotClick(g, g.dataset.phen, this.psychicCap(c)));
    // Rituals
    content.querySelectorAll('.sorc-ritual-add').forEach(s => s.addEventListener('change', () => {
      const rt = SORCERER.ritualById(s.dataset.path, s.value); if (!rt) return;
      const was = this.numinaFreebieCost(c), have = creator.freebiesRemaining();
      c.rituals.push({ id: rt.id, path: s.dataset.path, name: rt.name, level: rt.level });
      const delta = this.numinaFreebieCost(c) - was;
      if (delta > 0 && delta > have) { c.rituals.pop(); toast(`Not enough freebie points for another ritual (need ${delta}, have ${have}).`, 'error'); return; }
      rerender();
    }));
    content.querySelectorAll('.sorc-ritual-custom-add').forEach(b => b.addEventListener('click', () => {
      const path = b.dataset.path;
      const inp = content.querySelector(`.sorc-ritual-custom[data-path="${path}"]`); const lv = content.querySelector(`.sorc-ritual-custom-level[data-path="${path}"]`);
      const name = (inp && inp.value || '').trim(); if (!name) return;
      const level = parseInt(lv && lv.value, 10) || 1;
      const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (c.rituals.some(r => r.path === path && r.id === id)) return;
      const was = this.numinaFreebieCost(c), have = creator.freebiesRemaining();
      c.rituals.push({ id, path, name, level });
      const delta = this.numinaFreebieCost(c) - was;
      if (delta > 0 && delta > have) { c.rituals.pop(); toast(`Not enough freebie points for another ritual (need ${delta}, have ${have}).`, 'error'); return; }
      rerender();
    }));
    content.querySelectorAll('.sorc-ritual-remove').forEach(b => b.addEventListener('click', () => { c.rituals = c.rituals.filter(r => !(r.path === b.dataset.path && r.id === b.dataset.ritual)); rerender(); }));
    // Detail panes
    content.querySelectorAll('.sorc-path-name').forEach(el => el.addEventListener('click', () => { const d = content.querySelector('#sorc-path-detail'); if (d) d.innerHTML = this.pathDetailHTML(el.dataset.path); }));
    content.querySelectorAll('.sorc-phen-name').forEach(el => el.addEventListener('click', () => { const d = content.querySelector('#sorc-phen-detail'); if (d) d.innerHTML = this.phenDetailHTML(el.dataset.phen); }));
  },

  /* ── rules text panes (shared with the sheet in Phase 3) ────────────── */
  _paras(t) { return String(t || '').split(/\n{2,}/).map(p => `<p>${escHtml(p).replace(/\n/g, '<br>')}</p>`).join(''); },
  pathDetailHTML(id) {
    const p = SORCERER.pathById(id); if (!p) return '';
    const lv = (p.levels || []).map(l => `<div class="sorc-level"><span class="sorc-dots-inline">${'●'.repeat(l.level)}</span> ${escHtml(l.text)}</div>`).join('');
    const rituals = (p.rituals || []).map(r => `<details class="sorc-ritual-detail"><summary>${escHtml(r.name)} <span class="sorc-dots-inline">${'●'.repeat(r.level)}</span>${r.generic ? ' <span class="cw-note">every Path</span>' : ''}</summary>${this._paras(r.text)}</details>`).join('');
    return `<h4>${escHtml(p.name)} <span class="page-ref">Sorcerer p. ${p.page || ''}</span></h4>
      ${this._paras(p.description)}
      ${p.system && p.system.text ? `<details class="sorc-system" open><summary>System${p.system.aspects && p.system.aspects.length ? ` · Aspects: ${p.system.aspects.map(escHtml).join(', ')}` : ''}</summary>${this._paras(p.system.text)}</details>` : ''}
      ${lv ? `<div class="sorc-levels">${lv}</div>` : ''}
      ${rituals ? `<div class="sorc-rituals-ref"><div class="sorc-rituals-label">Sample rituals</div>${rituals}</div>` : ''}`;
  },
  phenDetailHTML(id) {
    const p = SORCERER.phenomenonById(id); if (!p) return '';
    const lv = (p.levels || []).map(l => `<div class="sorc-level"><span class="sorc-dots-inline">${'●'.repeat(l.level)}</span> ${l.name ? `<strong>${escHtml(l.name)}:</strong> ` : ''}${escHtml(l.text)}</div>`).join('');
    return `<h4>${escHtml(p.name)} <span class="page-ref">Sorcerer p. ${p.page || ''}</span></h4>${this._paras(p.description)}${p.system ? `<details class="sorc-system"><summary>System</summary>${this._paras(p.system)}</details>` : ''}<div class="sorc-levels">${lv}</div>`;
  },

  /* ── Step 5: Finishing (freebies) ───────────────────────────────────── */
  renderFinishing(creator) {
    const c = creator.char; this.ensure(c);
    const lb = creator._lockedBaselines || {};
    if (lb.willpower != null && (!c.willpower || c.willpower < lb.willpower)) c.willpower = lb.willpower;
    const pool = creator.freebiesPool();
    const spent = this.calcFreebies(creator);
    const remaining = pool - spent;
    const COSTS = this.COSTS;
    const fbRow = (id, label, current, max, baseline, costPer, costNote, stat = null, specOptions = null, currentSpec = '', specThreshold = 4, desc = '') => {
      const spentDots = Math.max(0, current - baseline) * costPer;
      const dotsHtml = Array.from({ length: max }, (_, i) => { const val = i + 1; const isFree = val <= baseline; return `<span class="dot ${val <= current ? 'filled' : ''} ${isFree ? 'dot-free' : 'dot-freebie'}" data-val="${val}" title="${isFree ? 'Free (creation)' : `Costs ${costPer} freebie pt${costPer > 1 ? 's' : ''}`}"></span>`; }).join('');
      const costDisplay = spentDots > 0 ? `<span class="fb-cost-badge">${spentDots} pt${spentDots > 1 ? 's' : ''}</span>` : `<span class="fb-cost-free">${costPer}/dot</span>`;
      const dataAttr = stat ? `data-stat="${stat}"` : `data-fb-id="${id}"`;
      const specHtml = specOptions !== null ? `<div class="specialty-row fb-specialty-row"${current < specThreshold ? ' style="display:none"' : ''}><input class="specialty-input" list="fb-spec-${id}" data-specialty-for="${id}" placeholder="Specialty…" value="${escHtml(currentSpec)}"><datalist id="fb-spec-${id}">${specOptions.map(s => `<option value="${escHtml(s)}">`).join('')}</datalist></div>` : '';
      return `<div class="fb-row" ${dataAttr} data-baseline="${baseline}" data-cost="${costPer}" data-max="${max}">
        <div class="fb-row-label"><span>${label}${costNote ? `<span class="fb-cost-hint">${costNote}</span>` : ''}</span><span class="fb-row-desc">${desc}</span></div>
        <span class="dots" data-max="${max}">${dotsHtml}</span><div class="fb-row-cost">${costDisplay}</div></div>${specHtml}`;
    };
    const attrSpecMap = {}; Object.values(M20.ATTRIBUTES).forEach(g => g.forEach(a => { attrSpecMap[a.id] = a.specialties || []; }));
    const attrSection = [['Physical', M20.ATTRIBUTES.physical], ['Social', M20.ATTRIBUTES.social], ['Mental', M20.ATTRIBUTES.mental]].map(([label, list]) => `<div class="fb-group"><div class="fb-group-header"><span class="fb-group-label">${label} Attributes</span></div>${list.map(a => fbRow(a.id, a.name, c[a.id] || 1, 5, lb.attrs?.[a.id] ?? 1, COSTS.attribute.cost, `${COSTS.attribute.cost} pts/dot`, null, attrSpecMap[a.id] || [], (c.specialties || {})[a.id] || '', 4, '')).join('')}</div>`).join('');
    const abilGroups = [{ label: 'Talents', key: 'talents', data: M20.TALENTS, sec: M20.SECONDARY_TALENTS || [] }, { label: 'Skills', key: 'skills', data: M20.SKILLS, sec: M20.SECONDARY_SKILLS || [] }, { label: 'Knowledges', key: 'knowledges', data: M20.KNOWLEDGES, sec: M20.SECONDARY_KNOWLEDGES || [] }];
    const abilSection = abilGroups.map(g => {
      const row = (a, badge, isCustom) => { const cur = (c[g.key] || {})[a.id] || 0; const desc = cur > 0 && a.levels ? a.levels[cur - 1] : (a.description || ''); const th = (!isCustom && GENERAL_ABILITY_IDS.has(a.id)) ? 1 : 4; return fbRow(a.id, `${escHtml(a.name)}${badge}`, cur, 5, lb.abilities?.[a.id] ?? 0, COSTS.ability.cost, `${COSTS.ability.cost} pts/dot`, null, a.specialties || [], (c.specialties || {})[a.id] || '', th, desc); };
      const rows = g.data.map(a => row(a, '', false)).join('');
      const sec = g.sec.filter(a => (c[g.key] || {})[a.id] !== undefined).map(a => row(a, ' <span class="secondary-badge">Secondary</span>', false)).join('');
      const cust = Object.keys(c.custom_ability_names || {}).filter(id => (c[g.key] || {})[id] !== undefined).map(id => row({ id, name: c.custom_ability_names[id] || id, specialties: [] }, ' <span class="secondary-badge">Custom</span>', true)).join('');
      return `<div class="fb-group" data-cat="${g.key}"><div class="fb-group-header"><span class="fb-group-label">${g.label}</span></div>${rows}${sec}${cust}</div>`;
    }).join('');
    const bgRows = this.backgrounds(c).map(b => fbRow(b.id, `${escHtml(b.name)} <span class="info-tip" data-tip="${(b.description || '').replace(/"/g, '&quot;')}">?</span>`, (c.backgrounds || {})[b.id] || 0, b.max || 5, lb.backgrounds?.[b.id] ?? 0, COSTS.background.cost, `${COSTS.background.cost} pt/dot`, null, null, '', 4, '')).join('');
    const willpowerRow = fbRow('willpower', 'Willpower', c.willpower || this.C.startWillpower, 10, lb.willpower || this.C.startWillpower, COSTS.willpower.cost, `${COSTS.willpower.cost} pt/dot`, 'willpower', null, '', 99, `Base ${this.C.startWillpower}. ${c.numina_style === 'psychic' ? `Psychic cap is ${this.psychicCap(c)}; each 2 Willpower raises it by 1.` : 'Sorcerers are naturally willful.'}`);
    const quint = this.canStoreQuintessence(c);
    const quintRow = quint ? fbRow('quintessence', 'Quintessence', c.quintessence || 0, 20, 0, 1, 'tracked in play', 'quintessence', null, '', 99, `Stored by ${escHtml(quint)}. Set the starting pool with your Storyteller.`) : '';
    const numinaSummary = this.numinaSummaryHTML(c);
    const pips = Array.from({ length: pool }, (_, i) => `<span class="fb-pip ${i < remaining ? 'available' : 'spent'}"></span>`).join('');
    const details = (id, title, costId, body, note = '') => `<details class="fb-section" id="${id}"><summary class="fb-section-summary"><span class="fb-section-title">${title}</span><span class="fb-section-cost" id="${costId}"></span><span class="fb-section-caret"></span></summary>${note ? `<div class="fb-section-note">${note}</div>` : ''}${body}</details>`;
    return `
      ${creator.stepHeader('Step VI — Finishing Touches',
        '"Are there ratings that should be higher, to represent the heights that your sorcerer has already reached?"',
        `Spend your <strong>${pool} Freebie Points</strong>: Attributes ${COSTS.attribute.cost}, Abilities ${COSTS.ability.cost}, Paths and Phenomena ${COSTS.numina.cost}, rituals ${COSTS.ritual.cost}, Backgrounds ${COSTS.background.cost}, Willpower ${COSTS.willpower.cost}. Then Merits and Flaws, and specialties for anything rated 4 or more. <span class="page-ref">Sorcerer p. 104–105</span>`)}
      <div class="fb-bank" id="fb-bank"><div class="fb-bank-inner"><div class="fb-bank-label">Freebie Points</div><div class="fb-bank-bar" id="fb-bar">${pips}</div><div class="fb-bank-numbers"><span id="fb-remaining" class="${remaining < 0 ? 'fb-over' : ''}">${remaining} of ${pool} remaining</span></div></div></div>
      ${details('fb-attrs', 'Attributes', 'fb-cost-attrs', `<div class="fb-cols-3">${attrSection}</div>`)}
      ${details('fb-abilities', 'Abilities', 'fb-cost-abilities', `<div class="fb-cols-3">${abilSection}</div>`)}
      ${details('fb-bgs', 'Backgrounds', 'fb-cost-bgs', `<div class="fb-group">${bgRows}</div>`)}
      ${details('fb-corestats', 'Willpower' + (quint ? ' &amp; Quintessence' : ''), 'fb-cost-corestats', `<div class="fb-group">${willpowerRow}${quintRow}</div>`)}
      ${details('fb-numina-section', 'Numina', 'fb-cost-numina', numinaSummary, `Paths and Phenomena beyond the 5 free dots cost <strong>${COSTS.numina.cost} pts/dot</strong>; rituals beyond one per Path dot cost <strong>${COSTS.ritual.cost} pts</strong>. Change them in Step V.`)}
      ${details('fb-merits-section', 'Merits', 'mf-cost-merits', '<div id="fb-merits" class="mf-list"></div>', 'Click a Merit to add it; click again to remove. Sorcerer Merits (p. 106) are listed with the M20 and Book of Secrets ones.')}
      ${details('fb-flaws-section', `Flaws (bonus, max ${creator.flawCapRule() || 7})`, 'mf-cost-flaws', '<div id="fb-flaws" class="mf-list"></div>', `Taking a Flaw grants bonus freebie points equal to its cost (max +${creator.flawCapRule() || 7} total).`)}`;
  },
  canStoreQuintessence(c) {
    if (this.rating(c, 'quintessence_manipulation') > 0) return 'Quintessence Manipulation';
    const m = c.merits || {};
    for (const [id, name] of [['the_flow_of_ki', 'The Flow of Ki'], ['force_of_spirit', 'Force of Spirit'], ['strength_of_psyche', 'Strength of Psyche']]) if (m[id] !== undefined) return name;
    return '';
  },
  numinaSummaryHTML(c) {
    const ids = this.numinaIds(c);
    if (!ids.length) return '<p class="practice-empty-hint">No Numina chosen.</p>';
    const rows = ids.map(id => { const n = SORCERER.numenById(id); const name = n ? n.name : ((c.numina[id] || {}).custom_name || id); const rs = SORCERER.isPath(id) ? SORCERER.ritualsFor(c, id) : []; return `<div class="freebie-row"><span>${escHtml(name)}${c.affinity_path === id ? ' ✦' : ''} <span class="sorc-dots-inline">${'●'.repeat(this.rating(c, id))}</span>${rs.length ? ` <span class="cw-note">${rs.map(r => escHtml(r.name)).join(', ')}</span>` : ''}</span></div>`; }).join('');
    const extra = this.extraDots(c), er = this.extraRituals(c);
    return `<div class="fb-group">${rows}<div class="freebie-row freebie-row-total"><span>${this.totalDots(c)} dots (${this.freeDots(c)} free${extra ? `, ${extra} × ${this.COSTS.numina.cost} pts` : ''}${er ? `; ${er} extra ritual${er !== 1 ? 's' : ''} × ${this.COSTS.ritual.cost} pts` : ''})</span><strong>${this.numinaFreebieCost(c)} pts</strong></div></div>`;
  },

  /* ── freebie accounting ─────────────────────────────────────────────── */
  calcFreebies(creator) {
    const c = creator.char; this.ensure(c);
    const COSTS = this.COSTS; const lb = creator._lockedBaselines;
    let total = 0;
    if (lb && lb.attrs && Object.keys(lb.attrs).length) {
      this.ATTRS.forEach(id => { total += Math.max(0, (c[id] || 1) - (lb.attrs[id] || 1)) * COSTS.attribute.cost; });
      ['talents','skills','knowledges'].forEach(k => Object.keys(c[k] || {}).forEach(id => { total += Math.max(0, (c[k][id] || 0) - (lb.abilities[id] || 0)) * COSTS.ability.cost; }));
      Object.keys(c.backgrounds || {}).forEach(id => { total += Math.max(0, (c.backgrounds[id] || 0) - (lb.backgrounds[id] || 0)) * COSTS.background.cost; });
      total += Math.max(0, (c.willpower || this.C.startWillpower) - (lb.willpower || this.C.startWillpower)) * COSTS.willpower.cost;
    } else {
      const ap = this.C.attrPoints, groups = { Physical: ['strength','dexterity','stamina'], Social: ['charisma','manipulation','appearance'], Mental: ['perception','intelligence','wits'] };
      Object.keys(groups).forEach(cat => { const used = groups[cat].reduce((s, id) => s + Math.max(0, (c[id] || 1) - 1), 0); const pool = [ap.primary, ap.secondary, ap.tertiary][(c.attr_priority || []).indexOf(cat)] || 0; total += Math.max(0, used - pool) * COSTS.attribute.cost; });
      const bp = this.C.abilityPoints, keys = { Talents: 'talents', Skills: 'skills', Knowledges: 'knowledges' };
      Object.keys(keys).forEach(cat => { const used = Object.values(c[keys[cat]] || {}).reduce((s, v) => s + (v || 0), 0); const pool = [bp.primary, bp.secondary, bp.tertiary][(c.ability_priority || []).indexOf(cat)] || 0; total += Math.max(0, used - pool) * COSTS.ability.cost; });
      const bgUsed = Object.values(c.backgrounds || {}).reduce((s, v) => s + (v || 0), 0);
      total += Math.max(0, bgUsed - this.C.backgroundDots) * COSTS.background.cost;
      total += Math.max(0, (c.willpower || this.C.startWillpower) - this.C.startWillpower) * COSTS.willpower.cost;
    }
    total += this.numinaFreebieCost(c);
    total += creator.calcMeritCost();
    total -= creator.calcFlawBonus();
    return total;
  },
  breakdownLines(creator) {
    const c = creator.char; const lines = [];
    const a = creator.calcAttrFreebies(); if (a) lines.push({ label: 'Attributes', cost: a });
    const b = creator.calcAbilityFreebies(); if (b) lines.push({ label: 'Abilities', cost: b });
    const g = creator.calcBgFreebies(); if (g) lines.push({ label: 'Backgrounds', cost: g });
    const w = Math.max(0, (c.willpower || this.C.startWillpower) - (creator._lockedBaselines?.willpower || this.C.startWillpower)); if (w) lines.push({ label: 'Willpower', cost: w });
    const n = this.numinaFreebieCost(c); if (n) lines.push({ label: 'Numina', cost: n });
    const m = creator.calcMeritCost(); if (m) lines.push({ label: 'Merits', cost: m });
    const f = creator.calcFlawBonus(); if (f) lines.push({ label: 'Flaws', cost: -f });
    return lines;
  },
  lockBaselines(creator) {
    const c = creator.char; this.ensure(c);
    const greedy = (ids, getValue, pool, startVal = 0) => { const r = {}; ids.forEach(id => { r[id] = startVal; }); if (pool <= 0) return r; const sorted = [...ids].sort((x, y) => getValue(y) - getValue(x)); let rem = pool; for (const id of sorted) { if (rem <= 0) break; const take = Math.min(rem, Math.max(0, getValue(id) - startVal)); r[id] = startVal + take; rem -= take; } return r; };
    const ap = this.C.attrPoints, bp = this.C.abilityPoints;
    const attrPri = c.attr_priority || ['Physical','Social','Mental'], abilPri = c.ability_priority || ['Talents','Skills','Knowledges'];
    const attrGroups = { Physical: ['strength','dexterity','stamina'], Social: ['charisma','manipulation','appearance'], Mental: ['perception','intelligence','wits'] };
    const attrs = {};
    Object.keys(attrGroups).forEach(cat => Object.assign(attrs, greedy(attrGroups[cat], id => c[id] || 1, [ap.primary, ap.secondary, ap.tertiary][attrPri.indexOf(cat)] ?? 0, 1)));
    const abilMap = { Talents: { key: 'talents', data: M20.TALENTS, sec: M20.SECONDARY_TALENTS || [] }, Skills: { key: 'skills', data: M20.SKILLS, sec: M20.SECONDARY_SKILLS || [] }, Knowledges: { key: 'knowledges', data: M20.KNOWLEDGES, sec: M20.SECONDARY_KNOWLEDGES || [] } };
    const abilities = {};
    Object.keys(abilMap).forEach(cat => { const { key, data, sec } = abilMap[cat]; const ids = [...data.map(a => a.id), ...sec.filter(a => (c[key] || {})[a.id] !== undefined).map(a => a.id), ...Object.keys(c.custom_ability_names || {}).filter(id => (c[key] || {})[id] !== undefined)]; Object.assign(abilities, greedy(ids, id => (c[key] || {})[id] || 0, [bp.primary, bp.secondary, bp.tertiary][abilPri.indexOf(cat)] ?? 0, 0)); });
    const backgrounds = greedy(this.backgrounds(c).map(b => b.id), id => (c.backgrounds || {})[id] || 0, this.C.backgroundDots, 0);
    creator._lockedBaselines = { attrs, abilities, backgrounds, virtues: {}, spheres: {}, bonusAttrs: {}, bonusAbilities: {}, bonusBgs: {}, bonusSpheres: {}, areteBonus: 0, willpower: this.C.startWillpower, numinaFree: this.freeDots(c) };
  },

  /* ── sidebar completeness ───────────────────────────────────────────── */
  stepIssues(creator, step) {
    const c = creator.char; this.ensure(c); const issues = [];
    if (step === 0) {
      if (!c.name?.trim()) issues.push('Name not set');
      if (!c.concept?.trim()) issues.push('Concept not set');
      if (!c.affiliation) issues.push('Affiliation not set');
      if (!c.essence) issues.push('Essence not set');
      if (!c.nature) issues.push('Nature not set');
      if (!c.demeanor) issues.push('Demeanor not set');
    } else if (step === 1) {
      const ap = this.C.attrPoints, groups = { Physical: ['strength','dexterity','stamina'], Social: ['charisma','manipulation','appearance'], Mental: ['perception','intelligence','wits'] };
      let rem = 0; (c.attr_priority || ['Physical','Social','Mental']).forEach((cat, i) => { const used = groups[cat].reduce((s, id) => s + Math.max(0, (c[id] || 1) - 1), 0); rem += Math.max(0, [ap.primary, ap.secondary, ap.tertiary][i] - used); });
      if (rem > 0) issues.push(`${rem} attribute point${rem !== 1 ? 's' : ''} unspent`);
    } else if (step === 2) {
      const bp = this.C.abilityPoints, keys = { Talents: 'talents', Skills: 'skills', Knowledges: 'knowledges' };
      let rem = 0; (c.ability_priority || ['Talents','Skills','Knowledges']).forEach((cat, i) => { const used = Object.values(c[keys[cat]] || {}).reduce((s, v) => s + (v || 0), 0); rem += Math.max(0, [bp.primary, bp.secondary, bp.tertiary][i] - used); });
      if (rem > 0) issues.push(`${rem} ability point${rem !== 1 ? 's' : ''} unspent`);
    } else if (step === 3) {
      const used = this.backgrounds(c).reduce((s, b) => s + ((c.backgrounds || {})[b.id] || 0), 0);
      const rem = Math.max(0, this.C.backgroundDots - used);
      if (rem > 0) issues.push(`${rem} background point${rem !== 1 ? 's' : ''} unspent`);
      const ad = (c.backgrounds || {}).artifact || 0, as = c.artifacts.reduce((s, a) => s + (a.rating || 0), 0);
      if (ad && as !== ad) issues.push(`Artifact ratings (${as}) must equal the Background dots (${ad})`);
    } else if (step === 4) {
      if (!c.numina_style) { issues.push('Numina style not chosen'); return issues; }
      const rem = Math.max(0, this.freeDots(c) - this.totalDots(c));
      if (rem > 0) issues.push(`${rem} Numina dot${rem !== 1 ? 's' : ''} unspent`);
      if (c.numina_style === 'hedge' || this.pathIds(c).length) {
        if (!c.casting_attribute) issues.push('Casting Attribute not chosen');
        if (!c.affinity_path) issues.push('Affinity Path not chosen');
        this.pathIds(c).forEach(id => {
          const n = c.numina[id]; const name = (SORCERER.pathById(id) || {}).name || id;
          if (!n.practice) issues.push(`${name}: Practice not chosen`);
          if (!n.ability) issues.push(`${name}: Path Ability not chosen`);
          else if (this.rating(c, id) > this.abilityRating(c, n.ability)) issues.push(`${name} ${this.rating(c, id)} exceeds its Ability (${this.abilityRating(c, n.ability)})`);
          const chk = SORCERER.checkRituals(c, id, this.rating(c, id), { creation: true });
          chk.errors.filter(e => !/extras cost/.test(e)).forEach(e => issues.push(e));
          if (SORCERER.ritualsFor(c, id).length < this.rating(c, id) && (SORCERER.pathById(id) || {}).rituals?.length) issues.push(`${name}: ${this.rating(c, id) - SORCERER.ritualsFor(c, id).length} ritual${this.rating(c, id) - SORCERER.ritualsFor(c, id).length !== 1 ? 's' : ''} still free to pick`);
        });
      }
      if (c.numina_style === 'psychic' || this.phenIds(c).length) {
        const cap = this.psychicCap(c);
        this.phenIds(c).forEach(id => { if (this.rating(c, id) > cap) issues.push(`${(SORCERER.phenomenonById(id) || {}).name || id} above the Willpower cap (${cap})`); });
      }
    }
    return issues;
  },

  /* ── Merits & Flaws from the Sorcerer book, shaped like M20.MERITS ──── */
  merits() {
    return SORCERER.MERITS_FLAWS.filter(m => m.kind === 'merit' || m.id === 'wild_talent').map(m => this._mf(m, 'merit'));
  },
  flaws() {
    return SORCERER.MERITS_FLAWS.filter(m => m.kind === 'flaw' || m.id === 'wild_talent').map(m => this._mf(m, 'flaw'));
  },
  _mf(m, kind) {
    let cost = m.cost;
    if (m.id === 'wild_talent') cost = '1-4';
    else { const opts = (m.costOptions || []).map(Math.abs).filter(n => n > 0); cost = opts.length === 1 ? opts[0] : (opts.length ? opts.join(' or ') : (parseInt(m.cost, 10) || 1)); }
    const cat = /psychic|psi|twin|detached|wild/i.test(m.id) ? 'Supernatural' : /path|ritual|style|flow|spirit|psyche|innocent|isolated|black|pacifist/i.test(m.id) ? 'Supernatural' : 'Social';
    return { id: m.id, name: m.name, cost, category: cat, description: m.text.split(/\n{2,}/)[0].slice(0, 400), fullText: m.text, page: `Sorcerer p. ${m.page || ''}`, sorcerer: true };
  },
};
