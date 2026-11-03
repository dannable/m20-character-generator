/* ═══════════════════════════════════════════════════════════════════════════
   FREE EDIT — post-creation editors that the original Free Edit page lacked:
     • Magical Focus: Paradigm, Practices (add/remove), Instruments (toggle,
       custom) in Core mode; the Prism tenet/practice editor in Prism mode.
     • Abilities: add a Secondary or Custom ability to a finalized character,
       and remove a Secondary/Custom one.
   Loaded after prism-ui.js. Hook points in app.js: FreeEdit._render() calls
   FreeEditExtras.focusSectionHTML / abilityAdderHTML / abilityRemoveBtnHTML and
   FreeEdit._attachListeners() calls FreeEditExtras.attach(el, FreeEdit).
   ═══════════════════════════════════════════════════════════════════════════ */
const FreeEditExtras = {
  /* ── Magical Focus section ───────────────────────────────────────────────── */
  focusSectionHTML(c) {
    if (c.character_type === 'mortal') return '';
    const prism = c.focus_mode === 'prism';
    const body = prism ? this._prismBody(c) : this._coreBody(c);
    return `
    <div class="fe-section" id="fe-focus-section">
      <div class="fe-section-title">Magical Focus <span class="fe-secondary-badge">${prism ? 'Prism of Focus' : 'M20 Core'}</span></div>
      ${body}
    </div>`;
  },

  _prismBody(c) {
    PrismUI.ensure(c);
    // Same editor as wizard Step 4; its free-dot budget line reads against current Arete.
    return PrismUI.renderFocusSection(c);
  },

  _coreBody(c) {
    if (!Array.isArray(c.practices) || !c.practices.length) {
      c.practices = (c.practice || '').split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(c.instruments)) c.instruments = [];
    const practiceTags = c.practices.length
      ? c.practices.map((name, i) => `<span class="practice-tag"><span class="practice-tag-name">${escHtml(name)}</span><button type="button" class="practice-tag-remove fe-practice-remove" data-idx="${i}" title="Remove">×</button></span>`).join('')
      : `<span class="practice-empty-hint">No practices listed.</span>`;
    const known = new Set(c.practices.map(p => p.toLowerCase()));
    const practiceOpts = M20.PRACTICES.filter(p => !known.has(p.name.toLowerCase()))
      .map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
    const builtin = new Set(M20.INSTRUMENTS);
    const selected = new Set(c.instruments);
    const instRows = M20.INSTRUMENTS.map(inst => `
      <label class="instrument-item${selected.has(inst) ? ' checked' : ''}">
        <input type="checkbox" class="fe-instrument-cb" value="${escHtml(inst)}" ${selected.has(inst) ? 'checked' : ''}>
        <span class="inst-text">${escHtml(inst)}</span>
      </label>`).join('');
    const customRows = c.instruments.filter(i => !builtin.has(i)).map(inst => `
      <label class="instrument-item instrument-item-custom checked">
        <input type="checkbox" class="fe-instrument-cb" value="${escHtml(inst)}" checked data-custom="1">
        <span class="inst-text">${escHtml(inst)}</span>
        <button type="button" class="instrument-tag-remove fe-instrument-remove" data-instrument="${escHtml(inst)}" title="Remove">×</button>
      </label>`).join('');
    return `
      <div class="fe-field"><label>Paradigm</label>${FreeEdit._textarea('paradigm', c.paradigm, 3)}</div>
      <div class="fe-field">
        <label>Practices</label>
        <div class="practices-list fe-practices">${practiceTags}</div>
        <div class="practice-adder-row" style="margin-top:0.4rem;display:flex;gap:0.4rem;flex-wrap:wrap">
          <select class="fe-practice-add"><option value="">＋ Add a practice…</option>${practiceOpts}</select>
          <input type="text" class="fe-practice-custom" placeholder="or a custom practice…" maxlength="60" style="flex:1;min-width:10rem">
          <button type="button" class="btn-secondary btn-sm fe-practice-custom-add">Add</button>
        </div>
      </div>
      <div class="fe-field">
        <label>Instruments <span class="cw-note">(${c.instruments.length} selected)</span></label>
        <div class="instrument-list fe-instrument-list">${instRows}${customRows}</div>
        <div class="instrument-custom-adder" style="margin-top:0.4rem">
          <input type="text" class="fe-instrument-custom" placeholder="Add a custom instrument…" maxlength="60">
          <button type="button" class="btn-secondary btn-sm fe-instrument-custom-add">＋ Add</button>
        </div>
      </div>`;
  },

  /* ── Ability adders ──────────────────────────────────────────────────────── */
  abilityAdderHTML(c, key, secondaryList) {
    const available = (secondaryList || []).filter(a => (c[key] || {})[a.id] === undefined && !PrismUI.removedAbility(c, a.id));
    return `
      <div class="fe-abil-adder">
        ${available.length ? `<select class="fe-sec-add" data-category="${key}">
          <option value="">＋ Add Secondary Ability…</option>
          ${available.map(a => `<option value="${a.id}">${escHtml(a.name)}</option>`).join('')}
        </select>` : ''}
        <div class="fe-custom-adder">
          <input type="text" class="fe-custom-abil-name" data-category="${key}" placeholder="✎ Custom ability…" maxlength="40">
          <button type="button" class="btn-ghost btn-sm fe-custom-abil-add" data-category="${key}">Add</button>
        </div>
      </div>`;
  },
  abilityRemoveBtnHTML(key, id) {
    return `<button type="button" class="btn-remove-secondary fe-abil-remove" data-category="${key}" data-ability-id="${escHtml(id)}" title="Remove">×</button>`;
  },

  /* ── listeners (delegated on the Free Edit root) ─────────────────────────── */
  attach(el, fe) {
    const c = fe.char;
    const rerender = () => {
      const y = window.scrollY;
      fe._render();
      window.scrollTo({ top: y });
    };
    const syncPractice = () => { c.practice = (c.practices || []).join(', '); };

    el.addEventListener('change', e => {
      const t = e.target;
      if (t.classList.contains('fe-sec-add')) {
        const key = t.dataset.category;
        if (t.value) { if (!c[key]) c[key] = {}; c[key][t.value] = 1; rerender(); }
        return;
      }
      if (t.classList.contains('fe-practice-add')) {
        const p = M20.PRACTICES.find(x => x.id === t.value);
        if (p && !c.practices.map(n => n.toLowerCase()).includes(p.name.toLowerCase())) { c.practices.push(p.name); syncPractice(); rerender(); }
        return;
      }
      if (t.classList.contains('fe-instrument-cb')) {
        const v = t.value;
        if (t.checked) { if (!c.instruments.includes(v)) c.instruments.push(v); }
        else c.instruments = c.instruments.filter(i => i !== v);
        t.closest('.instrument-item')?.classList.toggle('checked', t.checked);
        const lbl = el.querySelector('#fe-focus-section .cw-note'); if (lbl) lbl.textContent = `(${c.instruments.length} selected)`;
      }
    });

    el.addEventListener('click', e => {
      const rm = e.target.closest('.fe-abil-remove');
      if (rm) {
        const key = rm.dataset.category, id = rm.dataset.abilityId;
        if (c[key]) delete c[key][id];
        if (c.custom_ability_names && c.custom_ability_names[id]) delete c.custom_ability_names[id];
        if (c.specialties) delete c.specialties[id];
        rerender(); return;
      }
      const addCustom = e.target.closest('.fe-custom-abil-add');
      if (addCustom) {
        const key = addCustom.dataset.category;
        const inp = el.querySelector(`.fe-custom-abil-name[data-category="${key}"]`);
        const name = (inp?.value || '').trim();
        if (!name) return;
        const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (!id || id === 'custom_') return;
        if (!c.custom_ability_names) c.custom_ability_names = {};
        if (!c[key]) c[key] = {};
        c.custom_ability_names[id] = name;
        if (c[key][id] === undefined) c[key][id] = 1;
        rerender(); return;
      }
      const prm = e.target.closest('.fe-practice-remove');
      if (prm) { c.practices.splice(parseInt(prm.dataset.idx, 10), 1); syncPractice(); rerender(); return; }
      if (e.target.closest('.fe-practice-custom-add')) {
        const inp = el.querySelector('.fe-practice-custom');
        const name = (inp?.value || '').trim();
        if (name && !c.practices.map(n => n.toLowerCase()).includes(name.toLowerCase())) { c.practices.push(name); syncPractice(); rerender(); }
        return;
      }
      const irm = e.target.closest('.fe-instrument-remove');
      if (irm) { c.instruments = c.instruments.filter(i => i !== irm.dataset.instrument); rerender(); return; }
      if (e.target.closest('.fe-instrument-custom-add')) {
        const inp = el.querySelector('.fe-instrument-custom');
        const name = (inp?.value || '').trim();
        if (name && !c.instruments.includes(name)) { c.instruments.push(name); rerender(); }
      }
    });

    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const t = e.target;
      if (t.classList.contains('fe-custom-abil-name')) { e.preventDefault(); el.querySelector(`.fe-custom-abil-add[data-category="${t.dataset.category}"]`)?.click(); }
      if (t.classList.contains('fe-practice-custom'))  { e.preventDefault(); el.querySelector('.fe-practice-custom-add')?.click(); }
      if (t.classList.contains('fe-instrument-custom')) { e.preventDefault(); el.querySelector('.fe-instrument-custom-add')?.click(); }
    });

    // Prism editor: reuse the wizard's Step 4 handlers with a Free Edit shim
    if (c.focus_mode === 'prism') {
      PrismUI.attachStep4(el, { char: c, renderStep: () => rerender(), updateFreebieDisplay() {} });
    }
  },
};
