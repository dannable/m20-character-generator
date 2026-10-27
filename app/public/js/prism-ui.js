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
            <div class="attr-desc prism-benefit"><strong>Common instruments:</strong> ${escHtml((p.instruments || []).join(', '))}</div>
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

/* ═══════════════════════════════════════════════════════════════════════════
   Storyteller side: chronicle rules card, detail pills, welcome modal section,
   member badges, settings default. Mirrors server/prism.js sanitizeChronicleRules.
   ═══════════════════════════════════════════════════════════════════════════ */
Object.assign(PrismUI, {
  FOCUS_MODE_LABELS: { player_choice: 'Player’s choice', core: 'M20 Core only', prism: 'Prism of Focus only' },

  stRulesActive(rules) {
    const p = rules?.prism || {};
    return (rules?.focusMode && rules.focusMode !== 'player_choice')
      || Array.isArray(p.allowedPractices) || Array.isArray(p.allowedSpecialties) || !!p.hideCorrupted
      || !!(p.allowedTenets && Object.keys(p.allowedTenets).length) || !!p.requireFactionSpecialty
      || (p.bonusPracticeDots || 0) > 0 || p.enforceAbilityRequirement === false;
  },

  /* ── chronicle form card ─────────────────────────────────────────────────── */
  stRulesCardHTML(rules) {
    const mode = rules?.focusMode || 'player_choice';
    const p = rules?.prism || {};
    const allowP = Array.isArray(p.allowedPractices) ? new Set(p.allowedPractices) : null;
    const allowS = Array.isArray(p.allowedSpecialties) ? new Set(p.allowedSpecialties) : null;
    const allowT = p.allowedTenets || null;
    const cb = (cls, val, label, checked, extra = '') =>
      `<label class="chron-toggle-label chron-subfac-row"><input type="checkbox" class="${cls}" value="${val}" ${checked ? 'checked' : ''} ${extra}> ${label}</label>`;
    const practiceBoxes = PRISM.PRACTICES.map(x => cb('prism-practice-cb', x.id, escHtml(x.name), !allowP || allowP.has(x.id))).join('');
    const specBoxes = PRISM.SPECIALTIES.map(x => {
      const tag = x.corrupted ? '<em class="prism-st-tag corrupted">corrupted</em>' : `<em class="prism-st-tag">${escHtml(x.faction)}</em>`;
      return cb('prism-spec-cb', x.id, `${escHtml(x.name)} ${tag}`, !allowS || allowS.has(x.id), `data-corrupted="${x.corrupted ? 1 : 0}"`);
    }).join('');
    const tenetGroups = PRISM.TENET_CATEGORIES.map(cat => {
      const list = allowT && Array.isArray(allowT[cat.id]) ? new Set(allowT[cat.id]) : null;
      return `<div class="prism-st-tenet-cat"><div class="prism-st-tenet-cat-name">${cat.name}${cat.required ? '' : ' <span class="cw-note">(optional)</span>'}</div>
        ${PRISM.TENETS.filter(t => t.category === cat.id).map(t => cb('prism-tenet-cb', t.id, escHtml(t.name), !list || list.has(t.id), `data-cat="${cat.id}"`)).join('')}</div>`;
    }).join('');
    const radio = (val, label, hint) => `
      <label class="chron-toggle-label prism-st-mode"><input type="radio" name="prism-focus-mode" value="${val}" ${mode === val ? 'checked' : ''}> <strong>${label}</strong> <span class="cw-note">${hint}</span></label>`;
    return `
      <div class="chron-rules-group" id="prism-st-rules">
        <h4 class="chron-rules-heading">Focus System
          <span class="chron-rules-subhead">M20 Core focus, or Prism of Focus tenets and rated practices</span>
        </h4>
        <div class="prism-st-modes">
          ${radio('player_choice', 'Player’s choice', 'each character picks on Step One')}
          ${radio('core', 'M20 Core only', 'freeform Paradigm, Practice, Instruments (p. 259)')}
          ${radio('prism', 'Prism of Focus only', 'Tenets + rated Practices (Storytellers Vault supplement)')}
        </div>
        <div id="prism-st-options" style="${mode === 'core' ? 'display:none' : ''}">
          <p class="chron-rules-hint" style="margin:0.6rem 0 0.4rem">These apply to characters built in Prism mode.</p>
          <div class="chron-rules-row" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center">
            <label class="chron-toggle-label"><input type="checkbox" id="prism-st-enforce" ${p.enforceAbilityRequirement === false ? '' : 'checked'}> Enforce 2 Associated Ability dots per Practice dot <span class="cw-note">(off = warning only)</span></label>
            <label class="chron-toggle-label"><input type="checkbox" id="prism-st-faction-spec" ${p.requireFactionSpecialty ? 'checked' : ''}> Faction members must take their faction’s specialty</label>
            <label class="chron-toggle-label"><input type="checkbox" id="prism-st-hide-corrupted" ${p.hideCorrupted ? 'checked' : ''}> Hide corrupted practices</label>
            <label class="chron-toggle-label">Bonus practice dots <input type="number" id="prism-st-bonus-dots" class="form-input chron-rules-num" value="${p.bonusPracticeDots || 0}" min="0" max="10" style="width:4.5rem"></label>
          </div>
          <details class="prism-st-details"><summary>Allowed practices <span class="cw-note" id="prism-st-practice-count">${allowP ? allowP.size + ' of ' + PRISM.PRACTICES.length : 'all'}</span></summary>
            <div class="prism-st-grid-tools"><button type="button" class="btn-ghost btn-sm prism-st-all" data-target="prism-practice-cb" data-on="1">All</button><button type="button" class="btn-ghost btn-sm prism-st-all" data-target="prism-practice-cb" data-on="0">None</button></div>
            <div class="prism-st-grid">${practiceBoxes}</div></details>
          <details class="prism-st-details"><summary>Allowed specialized and corrupted practices <span class="cw-note" id="prism-st-spec-count">${allowS ? allowS.size + ' of ' + PRISM.SPECIALTIES.length : 'all'}</span></summary>
            <div class="prism-st-grid-tools"><button type="button" class="btn-ghost btn-sm prism-st-all" data-target="prism-spec-cb" data-on="1">All</button><button type="button" class="btn-ghost btn-sm prism-st-all" data-target="prism-spec-cb" data-on="0">None</button></div>
            <div class="prism-st-grid">${specBoxes}</div></details>
          <details class="prism-st-details"><summary>Allowed tenets <span class="cw-note" id="prism-st-tenet-count">${allowT && Object.keys(allowT).length ? 'restricted' : 'all'}</span></summary>
            <div class="prism-st-grid-tools"><button type="button" class="btn-ghost btn-sm prism-st-all" data-target="prism-tenet-cb" data-on="1">All</button><button type="button" class="btn-ghost btn-sm prism-st-all" data-target="prism-tenet-cb" data-on="0">None</button></div>
            <div class="prism-st-tenets">${tenetGroups}</div></details>
        </div>
      </div>`;
  },

  attachSTForm(root) {
    const card = (root || document).querySelector('#prism-st-rules');
    if (!card) return;
    card.addEventListener('change', e => {
      if (e.target.name === 'prism-focus-mode') {
        const opts = card.querySelector('#prism-st-options');
        if (opts) opts.style.display = e.target.value === 'core' ? 'none' : '';
      }
      this._updateSTCounts(card);
    });
    card.addEventListener('click', e => {
      const b = e.target.closest('.prism-st-all'); if (!b) return;
      card.querySelectorAll('.' + b.dataset.target).forEach(c => { c.checked = b.dataset.on === '1'; });
      this._updateSTCounts(card);
    });
  },
  _updateSTCounts(card) {
    const count = (cls, el, total) => {
      const boxes = [...card.querySelectorAll('.' + cls)];
      const n = boxes.filter(b => b.checked).length;
      const out = card.querySelector('#' + el); if (out) out.textContent = n === total ? 'all' : `${n} of ${total}`;
    };
    count('prism-practice-cb', 'prism-st-practice-count', PRISM.PRACTICES.length);
    count('prism-spec-cb', 'prism-st-spec-count', PRISM.SPECIALTIES.length);
    const t = [...card.querySelectorAll('.prism-tenet-cb')];
    const tc = card.querySelector('#prism-st-tenet-count');
    if (tc) tc.textContent = t.every(b => b.checked) ? 'all' : 'restricted';
  },

  /** Returns { focusMode, prism } for collectRules(). */
  collectSTRules() {
    const card = document.getElementById('prism-st-rules');
    if (!card) return {};
    const focusMode = card.querySelector('input[name="prism-focus-mode"]:checked')?.value || 'player_choice';
    const checkedVals = cls => [...card.querySelectorAll('.' + cls)].filter(b => b.checked).map(b => b.value);
    const practices = checkedVals('prism-practice-cb');
    const specs     = checkedVals('prism-spec-cb');
    const allowedTenets = {};
    PRISM.TENET_CATEGORIES.forEach(cat => {
      const boxes = [...card.querySelectorAll(`.prism-tenet-cb[data-cat="${cat.id}"]`)];
      const on = boxes.filter(b => b.checked).map(b => b.value);
      if (on.length !== boxes.length) allowedTenets[cat.id] = on;
    });
    const prism = {
      allowedPractices:   practices.length === PRISM.PRACTICES.length ? null : practices,
      allowedSpecialties: specs.length === PRISM.SPECIALTIES.length ? null : specs,
      hideCorrupted:      !!card.querySelector('#prism-st-hide-corrupted')?.checked,
      requireFactionSpecialty: !!card.querySelector('#prism-st-faction-spec')?.checked,
      enforceAbilityRequirement: card.querySelector('#prism-st-enforce')?.checked !== false,
      bonusPracticeDots:  parseInt(card.querySelector('#prism-st-bonus-dots')?.value, 10) || 0,
      allowedTenets:      Object.keys(allowedTenets).length ? allowedTenets : null,
    };
    return { focusMode, prism };
  },

  /* ── detail page pills + welcome modal ───────────────────────────────────── */
  _ruleLines(rules) {
    const lines = [];
    const mode = rules?.focusMode || 'player_choice';
    if (mode !== 'player_choice') lines.push(['Focus system', this.FOCUS_MODE_LABELS[mode]]);
    const p = rules?.prism || {};
    if (mode !== 'core') {
      if (Array.isArray(p.allowedPractices)) lines.push(['Practices', p.allowedPractices.map(id => PRISM.practiceById(id)?.name).filter(Boolean).join(', ') || 'none']);
      if (Array.isArray(p.allowedSpecialties)) lines.push(['Specialties', p.allowedSpecialties.map(id => PRISM.specialtyById(id)?.name).filter(Boolean).join(', ') || 'none']);
      if (p.hideCorrupted) lines.push(['Corrupted practices', 'hidden']);
      if (p.allowedTenets) Object.entries(p.allowedTenets).forEach(([cat, ids]) => {
        const c = PRISM.TENET_CATEGORIES.find(x => x.id === cat);
        lines.push([`${c?.name || cat} tenets`, ids.map(id => PRISM.tenetById(id)?.name).filter(Boolean).join(', ') || 'none']);
      });
      if (p.requireFactionSpecialty) lines.push(['Faction specialty', 'required for faction members']);
      if ((p.bonusPracticeDots || 0) > 0) lines.push(['Bonus practice dots', `+${p.bonusPracticeDots}`]);
      if (p.enforceAbilityRequirement === false) lines.push(['Ability requirement', 'warning only']);
    }
    return lines;
  },
  stDetailRulesHTML(rules, sec) {
    const lines = this._ruleLines(rules);
    if (!lines.length) return '';
    return sec('Focus (Prism of Focus)', lines.map(([k, v]) => `<span class="chron-dr-pill">${escHtml(k)}: ${escHtml(v)}</span>`).join(''));
  },
  welcomeSectionHTML(rules, section) {
    const lines = this._ruleLines(rules);
    if (!lines.length) return '';
    return section('Focus System', '', lines.map(([k, v]) => `<div class="cw-item"><span class="cw-label">${escHtml(k)}:</span> <strong>${escHtml(v)}</strong></div>`).join(''));
  },

  /* ── member badge on the chronicle page ──────────────────────────────────── */
  memberBadgeHTML(m, rules) {
    const mode = m.focus_mode === 'prism' ? 'prism' : 'core';
    const forced = rules?.focusMode === 'core' || rules?.focusMode === 'prism' ? rules.focusMode : null;
    const mismatch = forced && forced !== mode;
    const label = mode === 'prism' ? 'Prism' : 'Core';
    return `<span class="prism-member-badge${mismatch ? ' mismatch' : ''}" title="${mismatch ? `Chronicle requires ${this.FOCUS_MODE_LABELS[forced]}; this character uses ${label}` : `Focus system: ${label}`}">${label}${mismatch ? ' ⚠' : ''}</span>`;
  },

  /* ── settings page ───────────────────────────────────────────────────────── */
  settingsSectionHTML(data) {
    const cur = data?.default_focus_mode === 'prism' ? 'prism' : 'core';
    return `
        <div class="settings-section">
          <h3 class="settings-section-title">Default Focus System</h3>
          <p class="settings-hint">Pre-selects the Focus System on Step One for new characters. A Chronicle that fixes the system overrides this.</p>
          <div class="settings-row">
            <select id="settings-focus-mode" class="form-input" style="max-width:16rem">
              <option value="core" ${cur === 'core' ? 'selected' : ''}>M20 Core</option>
              <option value="prism" ${cur === 'prism' ? 'selected' : ''}>Prism of Focus</option>
            </select>
            <button class="btn-primary" id="btn-save-focus-mode">Save</button>
          </div>
        </div>`;
  },
  attachSettings() {
    $('#btn-save-focus-mode')?.addEventListener('click', async () => {
      const v = $('#settings-focus-mode')?.value;
      try {
        const r = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ default_focus_mode: v }) });
        if (!r.ok) throw new Error();
        if (App.currentUser) App.currentUser.default_focus_mode = v;
        toast('Default focus system saved.');
      } catch { toast('Failed to save.', 'error'); }
    });
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
   Rule-check UI (shared validator results): save-time modal for players,
   member rule-check panel for Storytellers. Not Prism-specific; lives here
   because it ships with the same phase and shares the chronicle-rules plumbing.
   ═══════════════════════════════════════════════════════════════════════════ */
const RulesUI = {
  STEP_LABELS: ['Concept', 'Attributes', 'Abilities', 'Advantages', 'Focus', 'Spheres', 'Finishing'],

  /** Modal listing errors/warnings. opts: { title, intro, blocked, onGoToStep } */
  showViolations(result, opts = {}) {
    const errors = result?.errors || [], warnings = result?.warnings || [];
    if (!errors.length && !warnings.length) return;
    const item = (v, cls) => `<div class="cw-item rv-item ${cls}">${escHtml(v.message)}${Number.isInteger(v.step) && opts.onGoToStep ? ` <button type="button" class="btn-ghost btn-sm rv-goto" data-step="${v.step}">Step ${v.step + 1}: ${this.STEP_LABELS[v.step] || ''}</button>` : ''}</div>`;
    const overlay = document.createElement('div');
    overlay.className = 'chron-welcome-overlay';
    overlay.innerHTML = `
      <div class="chron-welcome-box">
        <div class="chron-welcome-header">
          <div class="chron-welcome-title">${escHtml(opts.title || 'Chronicle rule check')}</div>
          <button class="modal-close chron-welcome-close">✕</button>
        </div>
        <p class="chron-welcome-intro">${escHtml(opts.intro || (opts.blocked ? 'The save was rejected because the character breaks these Chronicle rules:' : 'Saved. This character does not yet satisfy some Chronicle rules:'))}</p>
        <div class="chron-welcome-body">
          ${errors.length ? `<div class="cw-section"><div class="cw-section-title">Must fix</div>${errors.map(v => item(v, 'rv-error')).join('')}</div>` : ''}
          ${warnings.length ? `<div class="cw-section"><div class="cw-section-title">Warnings</div>${warnings.map(v => item(v, 'rv-warn')).join('')}</div>` : ''}
        </div>
        <div class="chron-welcome-footer"><button class="btn-primary chron-welcome-ok">OK</button></div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.chron-welcome-close').onclick = close;
    overlay.querySelector('.chron-welcome-ok').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('.rv-goto').forEach(b => b.addEventListener('click', () => { close(); opts.onGoToStep(parseInt(b.dataset.step, 10)); }));
  },

  /** After a successful save: surface server findings without blocking. */
  afterSave(char, creator) {
    const v = char?._violations;
    if (!v || (!v.errors.length && !v.warnings.length)) return;
    const n = v.errors.length + v.warnings.length;
    toast(`Saved with ${n} Chronicle rule ${n === 1 ? 'issue' : 'issues'}.`, 'error');
    this.showViolations(v, { onGoToStep: creator ? (s => { creator.step = s; creator.renderStep(); }) : null });
  },
  /** On a rejected save (400 with violations). */
  onRejected(err, creator) {
    const v = err?.body?.violations;
    if (!v) return false;
    this.showViolations(v, { blocked: true, onGoToStep: creator ? (s => { creator.step = s; creator.renderStep(); }) : null });
    return true;
  },

  /* ── Storyteller: member rule-check panel ─────────────────────────────── */
  panelHTML() {
    return `<div class="chron-detail-rules" id="chron-rule-check"><div class="chron-detail-rules-title">Rule Check</div><div class="chron-rc-body cw-note">Checking members…</div></div>`;
  },
  renderPanel(data) {
    const el = document.querySelector('#chron-rule-check .chron-rc-body'); if (!el) return;
    const members = data?.members || [];
    if (!members.length) { el.innerHTML = `<span class="chron-rc-ok">✓ Every member satisfies the Chronicle's creation rules.</span>`; return; }
    el.innerHTML = `<p class="cw-note" style="margin:0 0 0.4rem">${data.enforce ? 'Saves that break these rules are rejected.' : 'Rules are advisory for now; saves still go through.'}</p>` +
      members.map(m => `
        <div class="chron-rc-member">
          <div class="chron-rc-name">${escHtml(m.name)}${m.is_draft ? ' <span class="cw-note">(draft)</span>' : ''}</div>
          ${m.errors.map(v => `<div class="rv-item rv-error">${escHtml(v.message)}</div>`).join('')}
          ${m.warnings.map(v => `<div class="rv-item rv-warn">${escHtml(v.message)}</div>`).join('')}
        </div>`).join('');
  },
  async loadPanel(chronicleId) {
    if (!document.querySelector('#chron-rule-check')) return;
    try {
      const r = await fetch(`/api/chronicles/${chronicleId}/violations`);
      if (!r.ok) throw new Error();
      this.renderPanel(await r.json());
    } catch {
      const el = document.querySelector('#chron-rule-check .chron-rc-body'); if (el) el.textContent = 'Rule check unavailable.';
    }
  },
};

// PrismUI.issues now defers to the shared validator so the sidebar and the server agree.
PrismUI.issues = function (c) {
  if (!this.isPrism(c)) return { errors: [], warnings: [] };
  const r = CharValidator.prismChecks(this.ensure(c), c._chronicleRules || {});
  return { errors: r.errors.filter(v => v.code !== 'focus_mode').map(v => v.message), warnings: r.warnings.map(v => v.message) };
};
