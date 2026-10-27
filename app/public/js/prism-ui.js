/* ═══════════════════════════════════════════════════════════════════════════
   PRISM OF FOCUS — wizard / sheet UI
   Loaded after app.js. Everything Prism-specific the Creator needs lives here;
   app.js calls into PrismUI at a handful of hook points (Step 0 mode picker,
   Step 2 removed abilities, Step 4 focus section, validator, freebies, sheet).
   Depends on globals from app.js: $, $$, escHtml, dotsClickable, toast, App,
   Creator, M20, PRISM.
   ═══════════════════════════════════════════════════════════════════════════ */
const PrismUI = {
  /* ── mode resolution ─────────────────────────────────────────────────────── */
  chronicleMode(c) {
    const m = c?._chronicleRules?.focusMode;
    return (m === 'core' || m === 'prism') ? m : null;
  },
  locked(c) { return !!this.chronicleMode(c); },
  /** Resolve and persist the character's focus mode. */
  mode(c) {
    if (!c) return 'core';
    const forced = this.chronicleMode(c);
    if (forced) { c.focus_mode = forced; return forced; }
    if (c.focus_mode === 'prism' || c.focus_mode === 'core') return c.focus_mode;
    const dflt = App.currentUser?.default_focus_mode === 'prism' ? 'prism' : 'core';
    c.focus_mode = dflt;
    return dflt;
  },
  isPrism(c) { return this.mode(c) === 'prism'; },
  rules(c) { return (c?._chronicleRules?.prism && typeof c._chronicleRules.prism === 'object') ? c._chronicleRules.prism : {}; },

  /* ── state helpers ───────────────────────────────────────────────────────── */
  ensure(c) {
    if (!c.tenets || typeof c.tenets !== 'object' || Array.isArray(c.tenets)) c.tenets = {};
    if (!c.practice_ratings || typeof c.practice_ratings !== 'object' || Array.isArray(c.practice_ratings)) c.practice_ratings = {};
    if (!c.practice_specialties || typeof c.practice_specialties !== 'object' || Array.isArray(c.practice_specialties)) c.practice_specialties = {};
    if (typeof c.paradigm_preset !== 'string') c.paradigm_preset = '';
    return c;
  },
  freeDots(c)  { return Math.max(0, parseInt(c.arete, 10) || 0) + (parseInt(this.rules(c).bonusPracticeDots, 10) || 0); },
  spentDots(c) { return Object.values(c.practice_ratings || {}).reduce((s, v) => s + (parseInt(v, 10) || 0), 0); },
  extraDots(c) { return Math.max(0, this.spentDots(c) - this.freeDots(c)); },
  freebieCost(c) { return this.isPrism(c) ? this.extraDots(c) * PRISM.COSTS.practice.freebie : 0; },
  tenetCount(c) { return Object.values(c.tenets || {}).filter(Boolean).length; },
  factionSpecialty(c) { return c.tradition ? (PRISM.SPECIALTIES.find(s => s.faction === c.tradition) || null) : null; },

  /** Practices the chronicle lets this character pick (base practices). */
  allowedPractices(c) {
    const r = this.rules(c);
    const allow = Array.isArray(r.allowedPractices) ? new Set(r.allowedPractices) : null;
    return PRISM.PRACTICES.filter(p => !allow || allow.has(p.id));
  },
  /** Specialties available for a base practice, with the chronicle filters applied. */
  specialtiesFor(c, baseId) {
    const r = this.rules(c);
    const allow = Array.isArray(r.allowedSpecialties) ? new Set(r.allowedSpecialties) : null;
    return PRISM.SPECIALTIES.filter(s => s.base === baseId)
      .filter(s => !allow || allow.has(s.id))
      .filter(s => !(s.corrupted && r.hideCorrupted));
  },
  tenetsFor(c, catId) {
    const r = this.rules(c);
    const allow = r.allowedTenets && Array.isArray(r.allowedTenets[catId]) ? new Set(r.allowedTenets[catId]) : null;
    return PRISM.TENETS.filter(t => t.category === catId).filter(t => !allow || allow.has(t.id));
  },
  association(c, baseId) {
    const fs = this.factionSpecialty(c);
    const usesFactionSpec = !!fs && c.practice_specialties?.[baseId] === fs.id;
    return PRISM.association(c.tenets || {}, baseId, usesFactionSpec);
  },

  /* ── conversions when the mode flips ─────────────────────────────────────── */
  convert(c, to) {
    this.ensure(c);
    if (to === 'prism') {
      // Core practice names → 1-dot ratings; paradigm text → preset when it matches
      if (!Object.keys(c.practice_ratings).length && Array.isArray(c.practices)) {
        c.practices.forEach(name => {
          const p = PRISM.PRACTICES.find(x => x.name.toLowerCase() === String(name).toLowerCase().replace(/\s*\/.*$/, ''));
          if (p) c.practice_ratings[p.id] = 1;
        });
      }
      if (!Object.keys(c.tenets).length && c.paradigm) {
        const m20 = M20.PARADIGMS.find(p => c.paradigm.startsWith(p.desc));
        const preset = m20 && PRISM.presetById(m20.id);
        if (preset) { c.tenets = { ...preset.tenets }; c.paradigm_preset = preset.id; }
      }
    } else {
      // Prism → Core: leave the Prism columns in place; make sure the legacy
      // fields hold something readable so Core Step 4 is not blank.
      const names = Object.entries(c.practice_ratings)
        .filter(([, r]) => r > 0)
        .map(([id]) => PRISM.practiceById(id)?.name)
        .filter(Boolean);
      if (!(c.practices || []).length && names.length) { c.practices = names; c.practice = names.join(', '); }
      if (!c.paradigm && c.paradigm_preset) {
        const m20 = M20.PARADIGMS.find(p => p.id === c.paradigm_preset);
        if (m20) c.paradigm = m20.desc;
      }
    }
    c.focus_mode = to;
  },

  /* ── Step 0: mode picker ─────────────────────────────────────────────────── */
  modePickerHTML(c) {
    const mode = this.mode(c);
    const locked = this.locked(c);
    const btn = (val, label, sub) => `
      <button type="button" class="focus-mode-btn${mode === val ? ' active' : ''}" data-mode="${val}" ${locked ? 'disabled' : ''}>
        <span class="focus-mode-name">${label}</span>
        <span class="focus-mode-sub">${sub}</span>
      </button>`;
    return `
      <div class="form-group" id="focus-mode-group">
        <label>Focus System
          <span class="info-tip" data-tip="Core: M20's freeform Paradigm, Practice and Instruments (Step Five as written on p. 259). Prism of Focus: Paradigm built from Tenets and Practices rated 0 to 5, from the Storytellers Vault supplement by Charles Siegel.">?</span>
        </label>
        <div class="focus-mode-picker">
          ${btn('core', 'M20 Core', 'Paradigm, Practice, Instruments')}
          ${btn('prism', 'Prism of Focus', 'Tenets + rated Practices')}
        </div>
        ${locked ? `<div class="focus-mode-locked">Set by your Storyteller for this Chronicle.</div>` : ''}
      </div>`;
  },
  attachStep0(content, creator) {
    const c = creator.char;
    const picker = $('#focus-mode-group', content);
    if (!picker) return;
    picker.addEventListener('click', e => {
      const btn = e.target.closest('.focus-mode-btn');
      if (!btn || btn.disabled) return;
      const to = btn.dataset.mode;
      if (to === this.mode(c)) return;
      const hasFocusData = to === 'prism'
        ? (c.paradigm?.trim() || (c.practices || []).length)
        : (this.tenetCount(c) || this.spentDots(c));
      if (hasFocusData && !confirm(`Switch to ${to === 'prism' ? 'Prism of Focus' : 'M20 Core'}?\n\nYour Step Five choices will be carried over where they match; nothing is deleted, and you can switch back.`)) return;
      this.convert(c, to);
      creator.renderStep({ scroll: false });
      creator.updateFreebieDisplay?.();
    });
  },
  /** Called after a join code resolves: a forced mode overrides the picker. */
  applyChronicleMode(c, creator) {
    const forced = this.chronicleMode(c);
    if (forced && forced !== c.focus_mode) { this.convert(c, forced); creator.renderStep({ scroll: false }); return; }
    this.refreshPicker(c);
  },
  /** Update the Step 0 picker in place (lock state, active button) without re-rendering the step. */
  refreshPicker(c) {
    const group = $('#focus-mode-group'); if (!group) return;
    const mode = this.mode(c), locked = this.locked(c);
    $$('.focus-mode-btn', group).forEach(b => { b.disabled = locked; b.classList.toggle('active', b.dataset.mode === mode); });
    let note = group.querySelector('.focus-mode-locked');
    if (locked && !note) { note = document.createElement('div'); note.className = 'focus-mode-locked'; note.textContent = 'Set by your Storyteller for this Chronicle.'; group.appendChild(note); }
    if (!locked && note) note.remove();
  },

  /* ── Step 2: removed secondary abilities ─────────────────────────────────── */
  removedAbility(c, id) { return this.isPrism(c) && PRISM.REMOVED_SECONDARY_ABILITIES.includes(id); },

  /* ── Step 4: focus section ───────────────────────────────────────────────── */
  renderFocusSection(c) {
    this.ensure(c);
    const fs = this.factionSpecialty(c);
    const presetOpts = PRISM.PARADIGM_PRESETS
      .filter(p => Object.entries(p.tenets).every(([cat, id]) => this.tenetsFor(c, cat).some(t => t.id === id)))
      .map(p => `<option value="${p.id}" ${c.paradigm_preset === p.id ? 'selected' : ''}>${escHtml(p.name)}</option>`).join('');
    const activePreset = c.paradigm_preset && PRISM.presetById(c.paradigm_preset);

    const tenetRows = PRISM.TENET_CATEGORIES.map(cat => {
      const chosen = c.tenets[cat.id] || '';
      const t = chosen && PRISM.tenetById(chosen);
      const opts = this.tenetsFor(c, cat.id).map(x =>
        `<option value="${x.id}" ${x.id === chosen ? 'selected' : ''}>${escHtml(x.name)}</option>`).join('');
      const assoc = t ? t.associated.map(id => PRISM.practiceById(id)?.name).filter(Boolean).join(', ') : '';
      const lim   = t ? t.limited.map(id => PRISM.practiceById(id)?.name).filter(Boolean).join(', ') : '';
      return `
        <div class="prism-tenet-row${cat.required ? ' required' : ''}${chosen ? ' chosen' : ''}" data-cat="${cat.id}">
          <div class="prism-tenet-head">
            <span class="prism-tenet-cat">${cat.name}${cat.required ? ' <span class="prism-req">required</span>' : ''}</span>
            <span class="prism-tenet-q">${escHtml(cat.question)}</span>
          </div>
          <select class="prism-tenet-select" data-cat="${cat.id}">
            <option value="">${cat.required ? '— choose a tenet —' : '— none —'}</option>
            ${opts}
          </select>
          ${t ? `<div class="prism-tenet-desc">${escHtml(t.desc)} <span class="page-ref">PoF p. ${t.page}</span></div>
                 <div class="prism-tenet-links"><span class="prism-assoc">Associated:</span> ${escHtml(assoc) || '—'} &middot; <span class="prism-limited">Limited:</span> ${escHtml(lim) || '—'}</div>` : ''}
        </div>`;
    }).join('');

    const nTenets = this.tenetCount(c);
    const cap = PRISM.areteCap(c.tenets);
    const areteNote = (c.arete || 1) > cap
      ? `<span class="prism-warn">Arete ${c.arete} exceeds your ${nTenets} tenet${nTenets === 1 ? '' : 's'}; add a tenet or lower Arete.</span>`
      : `Arete may not exceed your tenet count until Arete 6 (currently ${nTenets} tenet${nTenets === 1 ? '' : 's'} → max Arete ${Math.min(cap, 5)}).`;

    // Practices
    const ratings = c.practice_ratings;
    const rated = Object.keys(ratings).filter(id => ratings[id] > 0);
    const practiceRows = rated.map(id => this._practiceRowHTML(c, id)).join('')
      || `<p class="practice-empty-hint">No practices yet — add one below. You get one free dot per dot of Arete.</p>`;
    const addOpts = this.allowedPractices(c).filter(p => !(ratings[p.id] > 0)).map(p => {
      const pin = fs && fs.base === p.id;
      return `<option value="${p.id}">${pin ? '✦ ' : ''}${escHtml(p.name)}${pin ? ` (${escHtml(fs.name)}, your faction)` : ''}</option>`;
    }).join('');
    const free = this.freeDots(c), spent = this.spentDots(c), extra = this.extraDots(c);
    const bonus = parseInt(this.rules(c).bonusPracticeDots, 10) || 0;

    return `
    <div id="prism-focus" class="prism-focus">
      <div class="form-group" style="margin-bottom:1.2rem">
        <label>Paradigm — Tenets <span class="ref">PoF p. 15</span>
          <span class="info-tip" data-tip="Your Paradigm is a set of beliefs. Pick a book paradigm to fill the three required tenets, or build your own. Extra tenets are free and raise your Arete ceiling.">?</span>
        </label>
        <select id="prism-preset" style="margin-bottom:0.6rem">
          <option value="">— start from a book paradigm (optional) —</option>
          ${presetOpts}
        </select>
        ${activePreset ? `<div class="prism-preset-desc">${escHtml(activePreset.desc)} <span class="page-ref">PoF p. ${activePreset.page}</span></div>` : ''}
        <div class="prism-tenet-list">${tenetRows}</div>
        <div class="prism-arete-note">${areteNote}</div>
      </div>

      <div class="form-group" style="margin-bottom:1.5rem">
        <label>Practices <span class="ref">PoF p. 31</span>
          <span class="info-tip" data-tip="Practices are rated 0 to 5. One free dot per dot of Arete; extra dots cost 1 freebie each. Each dot needs 2 dots across the practice's Associated Abilities. Tenets make a practice Associated (−1 difficulty) or Limited (+1).">?</span>
        </label>
        <div class="prism-budget${extra > 0 ? ' over' : ''}" id="prism-budget">
          <span><strong>${spent}</strong> dot${spent === 1 ? '' : 's'} placed</span>
          <span>·</span>
          <span><strong>${free}</strong> free (Arete ${c.arete || 0}${bonus ? ` + ${bonus} chronicle` : ''})</span>
          ${extra > 0 ? `<span>·</span><span class="prism-extra">${extra} extra = ${extra} freebie${extra === 1 ? '' : 's'}</span>` : ''}
        </div>
        <div id="prism-practice-list" class="prism-practice-list">${practiceRows}</div>
        <div class="practice-adder-row">
          <select id="prism-practice-add">
            <option value="">＋ Add a practice…</option>
            ${addOpts}
          </select>
        </div>
        ${fs ? `<div class="practice-paradigm-note">✦ <em>${escHtml(fs.name)}</em> is the ${escHtml(fs.faction)} specialty of ${escHtml(PRISM.practiceById(fs.base)?.name || '')}; it always counts as Associated for you.</div>` : ''}
      </div>
    </div>`;
  },

  _practiceRowHTML(c, id) {
    const p = PRISM.practiceById(id);
    if (!p) return '';
    const r = c.practice_ratings[id] || 0;
    const specId = c.practice_specialties[id] || '';
    const spec = specId && PRISM.specialtyById(specId);
    const fs = this.factionSpecialty(c);
    const specs = this.specialtiesFor(c, id);
    const assoc = this.association(c, id);
    const badge = assoc === 'associated' ? '<span class="prism-badge assoc">Associated −1</span>'
                : assoc === 'limited'    ? '<span class="prism-badge limited">Limited +1</span>'
                : '<span class="prism-badge neutral">Neutral</span>';
    const have = PRISM.associatedAbilityDots(c, id);
    const need = r * PRISM.COSTS.abilityDotsPerPracticeDot;
    const abilNames = p.abilityIds.map(aid => ALL_ABILITY_DEFS.find(a => a.id === aid)?.name || aid).join(', ');
    const short = have < need;
    const reqHard = this.rules(c).enforceAbilityRequirement !== false;
    const specOpts = specs.map(s =>
      `<option value="${s.id}" ${s.id === specId ? 'selected' : ''}>${escHtml(s.name)}${s.corrupted ? ' (corrupted)' : s.faction ? ` (${escHtml(s.faction)})` : ''}</option>`).join('');
    const corruptedWarn = spec?.corrupted
      ? `<div class="prism-corrupted-warn">⚠ Corrupted practice. ${escHtml(spec.price || '')}</div>` : '';
    const factionWarn = spec && spec.faction && (!fs || fs.id !== spec.id)
      ? `<div class="prism-corrupted-warn">⚠ ${escHtml(spec.name)} is normally only taught to ${escHtml(spec.faction)} initiates; check with your Storyteller.</div>` : '';
    return `
      <div class="attr-row prism-practice-row" data-practice="${id}">
        <div class="attr-row-main">
          <div class="attr-info">
            <div class="attr-name">${spec ? `${escHtml(spec.name)} <span class="prism-base">(${escHtml(p.name)})</span>` : escHtml(p.name)}
              ${badge}
              <span class="info-tip" data-tip="${escHtml((spec ? spec.desc + ' ' : '') + p.desc)}">?</span>
            </div>
            <div class="attr-desc">
              <span class="${short ? 'prism-warn' : 'prism-ok'}">Associated Abilities: ${have} / ${need} dots${short ? (reqHard ? ' — short' : ' — short (allowed by chronicle)') : ''}</span>
              <span class="prism-abil-list">${escHtml(abilNames)}</span>
            </div>
            <div class="attr-desc prism-benefit"><strong>Benefit:</strong> ${escHtml(spec?.benefit || p.benefit)} <strong>Penalty:</strong> ${escHtml(p.penalty)}</div>
            ${specs.length ? `<div class="prism-spec-row">
              <select class="prism-spec-select" data-practice="${id}">
                <option value="">Base practice</option>
                ${specOpts}
              </select></div>` : ''}
            ${corruptedWarn}${factionWarn}
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem">
            ${dotsClickable(r, 5, null, 'prism-dots')}
            <button class="btn-remove-secondary prism-practice-remove" data-practice="${id}" title="Remove ${escHtml(p.name)}">×</button>
          </div>
        </div>
      </div>`;
  },

  attachStep4(content, creator) {
    const root = $('#prism-focus', content);
    if (!root) return;
    const c = this.ensure(creator.char);
    const rerender = () => { creator.renderStep({ scroll: false }); creator.updateFreebieDisplay?.(); };

    root.addEventListener('change', e => {
      const el = e.target;
      if (el.id === 'prism-preset') {
        const preset = el.value && PRISM.presetById(el.value);
        if (preset) { c.tenets = { ...c.tenets, ...preset.tenets }; c.paradigm_preset = preset.id; }
        else c.paradigm_preset = '';
        rerender(); return;
      }
      if (el.classList.contains('prism-tenet-select')) {
        const cat = el.dataset.cat;
        if (el.value) c.tenets[cat] = el.value; else delete c.tenets[cat];
        const preset = c.paradigm_preset && PRISM.presetById(c.paradigm_preset);
        if (preset && !Object.entries(preset.tenets).every(([k, v]) => c.tenets[k] === v)) c.paradigm_preset = '';
        rerender(); return;
      }
      if (el.id === 'prism-practice-add') {
        if (el.value && PRISM.practiceById(el.value)) {
          c.practice_ratings[el.value] = 1;
          const fs = this.factionSpecialty(c);
          if (fs && fs.base === el.value && this.specialtiesFor(c, el.value).some(s => s.id === fs.id)) c.practice_specialties[el.value] = fs.id;
        }
        rerender(); return;
      }
      if (el.classList.contains('prism-spec-select')) {
        const id = el.dataset.practice;
        if (el.value) c.practice_specialties[id] = el.value; else delete c.practice_specialties[id];
        rerender();
      }
    });

    root.addEventListener('click', e => {
      const rm = e.target.closest('.prism-practice-remove');
      if (rm) {
        delete c.practice_ratings[rm.dataset.practice];
        delete c.practice_specialties[rm.dataset.practice];
        rerender(); return;
      }
      const dot = e.target.closest('.prism-dots .dot');
      if (dot) {
        const row = dot.closest('.prism-practice-row');
        const id = row?.dataset.practice; if (!id) return;
        const val = parseInt(dot.dataset.val, 10);
        const cur = c.practice_ratings[id] || 0;
        const next = cur === val ? val - 1 : val;
        if (next <= 0) { delete c.practice_ratings[id]; delete c.practice_specialties[id]; }
        else c.practice_ratings[id] = next;
        rerender();
      }
    });
  },

  /* ── validation (sidebar issues) ─────────────────────────────────────────── */
  issues(c) {
    const errors = [], warnings = [];
    if (!this.isPrism(c)) return { errors, warnings };
    this.ensure(c);
    PRISM.TENET_CATEGORIES.filter(k => k.required).forEach(k => {
      if (!c.tenets[k.id]) errors.push(`${k.name} tenet not chosen`);
    });
    const r = this.rules(c);
    Object.entries(c.tenets).forEach(([cat, id]) => {
      if (!this.tenetsFor(c, cat).some(t => t.id === id)) errors.push(`${PRISM.tenetById(id)?.name || id} not allowed in this Chronicle`);
    });
    const cap = PRISM.areteCap(c.tenets);
    if ((c.arete || 1) > cap) errors.push(`Arete ${c.arete} exceeds tenet count (${this.tenetCount(c)})`);
    const rated = Object.keys(c.practice_ratings).filter(id => c.practice_ratings[id] > 0);
    if (!rated.length) errors.push('No practice rated');
    const allowed = new Set(this.allowedPractices(c).map(p => p.id));
    const hard = r.enforceAbilityRequirement !== false;
    rated.forEach(id => {
      const p = PRISM.practiceById(id); if (!p) return;
      if (!allowed.has(id)) errors.push(`${p.name} not allowed in this Chronicle`);
      const spec = c.practice_specialties[id];
      if (spec && !this.specialtiesFor(c, id).some(s => s.id === spec)) errors.push(`${PRISM.specialtyById(spec)?.name || spec} not allowed in this Chronicle`);
      const have = PRISM.associatedAbilityDots(c, id), need = c.practice_ratings[id] * PRISM.COSTS.abilityDotsPerPracticeDot;
      if (have < need) (hard ? errors : warnings).push(`${p.name} ${c.practice_ratings[id]} needs ${need} Associated Ability dots (have ${have})`);
    });
    if (r.requireFactionSpecialty) {
      const fs = this.factionSpecialty(c);
      if (fs && c.practice_ratings[fs.base] > 0 && c.practice_specialties[fs.base] !== fs.id) errors.push(`${fs.faction} characters must take ${fs.name}`);
    }
    PRISM.REMOVED_SECONDARY_ABILITIES.forEach(id => {
      if ((c.skills?.[id] ?? c.talents?.[id]) !== undefined) errors.push(`${ALL_ABILITY_DEFS.find(a => a.id === id)?.name || id} is replaced by a Practice in Prism mode; remove it in Step Three`);
    });
    return { errors, warnings };
  },

  /* ── sheet card ──────────────────────────────────────────────────────────── */
  sheetFocusHTML(char) {
    this.ensure(char);
    const tenetLines = PRISM.TENET_CATEGORIES.map(cat => {
      const t = char.tenets[cat.id] && PRISM.tenetById(char.tenets[cat.id]);
      return t ? `<div class="sheet-prism-tenet"><span class="sheet-prism-cat">${cat.name}</span> ${escHtml(t.name)}</div>` : '';
    }).join('');
    const preset = char.paradigm_preset && PRISM.presetById(char.paradigm_preset);
    const practiceLines = Object.entries(char.practice_ratings || {}).filter(([, r]) => r > 0)
      .sort((a, b) => b[1] - a[1]).map(([id, r]) => {
        const p = PRISM.practiceById(id); if (!p) return '';
        const spec = char.practice_specialties?.[id] && PRISM.specialtyById(char.practice_specialties[id]);
        const assoc = this.association(char, id);
        const mark = assoc === 'associated' ? ' <span class="prism-badge assoc">A</span>' : assoc === 'limited' ? ' <span class="prism-badge limited">L</span>' : '';
        return `<div class="sheet-prism-practice"><span>${escHtml(spec ? `${spec.name} (${p.name})` : p.name)}${mark}</span>${dotsClickable(r, 5, null, 'sheet-dots-ro')}</div>`;
      }).join('');
    return `
      <div class="sheet-focus-item">
        <span class="sheet-focus-label">Paradigm${preset ? ` · ${escHtml(preset.name)}` : ''}</span>
        <div class="sheet-focus-value">${tenetLines || '—'}</div>
      </div>
      <div class="sheet-focus-item">
        <span class="sheet-focus-label">Practices</span>
        <div class="sheet-focus-value">${practiceLines || '—'}</div>
      </div>`;
  },
};
