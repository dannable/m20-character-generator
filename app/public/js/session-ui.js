// Session mode (Phase 1): Storyteller session screen, GM notes and scene markers.
// Depends on globals from app.js: $, escHtml, toast, formatDateTime, App, Chronicle.
const SessionUI = {
  _c: null,       // chronicle the screen belongs to
  _sid: null,
  _data: null,    // { session, roster, notes }
  _timers: {},

  _api(method, url, body) {
    return fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(async r => { const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'Request failed'); return b; });
  },
  _base() { return `/api/chronicles/${this._c.id}/sessions`; },

  // ── Chronicle page card ────────────────────────────────────────────────────
  cardHTML(c) {
    if (!c.is_active) return '';
    return `<div class="chronicle-join-block session-card" id="session-card">
      <div class="chronicle-info-label">Session</div>
      <div id="session-card-body"><p class="chronicle-join-hint">Loading…</p></div>
    </div>`;
  },

  async attachCard(c) {
    const body = $('#session-card-body'); if (!body) return;
    this._c = c;
    let list = [];
    try { list = await this._api('GET', this._base()); }
    catch { body.innerHTML = '<p class="chronicle-join-hint">Sessions unavailable.</p>'; return; }
    const active = list.find(s => s.status === 'active');
    const past = list.filter(s => s.status === 'ended');
    const label = s => `Session ${s.number}${s.title ? ': ' + escHtml(s.title) : ''}`;
    body.innerHTML = `
      ${active
        ? `<div class="session-live-row"><span class="session-live-dot"></span><strong>${label(active)}</strong> is running</div>
           <button class="btn-primary btn-sm" id="btn-open-session" data-sid="${active.id}">Open session</button>`
        : `<input type="text" class="form-input" id="session-title-input" maxlength="120" placeholder="Title (optional)">
           <button class="btn-primary btn-sm" id="btn-start-session" style="margin-top:.5rem">Start session</button>`}
      ${past.length ? `<details class="session-past"><summary>Past sessions (${past.length})</summary>
        ${past.map(s => `<button class="session-past-row" data-sid="${s.id}">
          <span>${label(s)}</span><span class="session-past-date">${formatDateTime(s.started_at)}</span></button>`).join('')}
      </details>` : ''}`;
    $('#btn-start-session')?.addEventListener('click', async e => {
      e.target.disabled = true;
      try {
        const s = await this._api('POST', this._base(), { title: $('#session-title-input').value });
        this.open(c, s.id);
      } catch (err) { toast(err.message, 'error'); e.target.disabled = false; }
    });
    $('#btn-open-session')?.addEventListener('click', e => this.open(c, e.target.dataset.sid));
    body.querySelectorAll('.session-past-row').forEach(b => b.addEventListener('click', () => this.open(c, b.dataset.sid)));
  },

  // ── Session screen ─────────────────────────────────────────────────────────
  async open(c, sid) {
    this._c = c; this._sid = sid;
    App.showPage('chronicle');
    $('#chronicle-content').innerHTML = '<div class="chronicle-loading">Loading…</div>';
    try {
      this._data = await this._api('GET', `${this._base()}/${sid}`);
    } catch (err) {
      $('#chronicle-content').innerHTML = `<p class="error-msg">${escHtml(err.message)}</p>`;
      return;
    }
    this._render();
  },

  _rosterHTML() {
    const rows = this._data.roster;
    if (!rows.length) return '<p class="chronicle-empty-state">No characters have joined this chronicle yet.</p>';
    return `<div class="session-roster">${rows.map(r => {
      const wp = Math.max(0, (r.willpower || 0) - (r.willpower_spent || 0));
      const mage = r.character_type !== 'mortal' && r.character_type !== 'sorcerer';
      return `<div class="session-roster-row">
        <div class="session-roster-name">${escHtml(r.name)}${r.owner_username ? `<span class="chronicle-member-owner"> ${escHtml(r.owner_username)}</span>` : ''}</div>
        <div class="session-stat" title="Willpower (current / permanent)">WP <b>${wp}</b>/${r.willpower || 0}</div>
        <div class="session-stat" title="Health levels marked as damaged">${r.health_dead ? '<b class="session-dead">Dead</b>' : `Hurt <b>${r.health_damaged}</b>/7`}</div>
        ${mage ? `<div class="session-stat" title="Quintessence">Q <b>${r.quintessence || 0}</b></div>
        <div class="session-stat" title="Paradox">P <b>${r.paradox || 0}</b></div>` : ''}
      </div>`;
    }).join('')}</div>`;
  },

  _noteHTML(n) {
    const sc = n.kind === 'scene';
    const members = this._data.roster;
    const shared = new Set((n.shares || []).map(s => s.character_id));
    return `<div class="session-note session-note-${n.kind}" data-nid="${n.id}">
      <div class="session-note-head">
        <span class="session-note-kind">${sc ? 'Scene' : n.kind === 'handout' ? 'Handout' : 'Note'}</span>
        <input type="text" class="form-input session-note-title" value="${escHtml(n.title)}" maxlength="200"
               placeholder="${sc ? 'Scene title' : n.kind === 'handout' ? 'Handout title' : 'Title (optional)'}">
        <span class="session-save-state" aria-live="polite"></span>
        <button class="btn-ghost btn-sm session-note-del" title="Delete">✕</button>
      </div>
      ${sc ? '' : `<textarea class="form-input session-note-body" rows="${n.kind === 'handout' ? 4 : 6}"
        placeholder="${n.kind === 'handout' ? 'Text the chosen players will see' : 'Private to the Storyteller'}">${escHtml(n.body)}</textarea>`}
      ${n.kind === 'handout' ? `<div class="session-share">Share with:
        ${members.length ? members.map(m => `<label class="session-share-opt"><input type="checkbox" class="session-share-cb" value="${m.id}" ${shared.has(m.id) ? 'checked' : ''}> ${escHtml(m.name)}</label>`).join('') : '<em>no members</em>'}
      </div>` : ''}
    </div>`;
  },

  _render() {
    const { session: s } = this._data;
    const ended = s.status === 'ended';
    $('#chronicle-content').innerHTML = `
      <div class="chronicle-page session-page">
        <div class="session-top">
          <button class="btn-ghost" id="session-back">← ${escHtml(this._c.name)}</button>
          <h2 class="section-title" style="margin:0">Session ${s.number}
            <span class="session-badge ${ended ? 'session-badge-ended' : 'session-badge-live'}">${ended ? 'Ended' : 'Live'}</span></h2>
          <span class="session-started">${formatDateTime(s.started_at)}</span>
        </div>
        <input type="text" class="form-input" id="session-title" maxlength="120" placeholder="Session title" value="${escHtml(s.title)}">
        <div class="session-grid">
          <div>
            <div class="ornate-divider">— Characters —</div>
            ${this._rosterHTML()}
            <p class="chronicle-join-hint">Dice rolling arrives in the next update.</p>
          </div>
          <div>
            <div class="ornate-divider">— GM Notes —</div>
            <div class="session-add-row">
              <button class="btn-secondary btn-sm" data-add="note">+ Note</button>
              <button class="btn-secondary btn-sm" data-add="scene">+ Scene marker</button>
              <button class="btn-secondary btn-sm" data-add="handout">+ Handout</button>
            </div>
            <div id="session-notes">${this._data.notes.map(n => this._noteHTML(n)).join('') || '<p class="chronicle-empty-state">No notes yet.</p>'}</div>
          </div>
        </div>
        <div class="session-end">
          <div class="chronicle-info-label">Recap</div>
          <textarea class="form-input" id="session-recap" rows="3" placeholder="What happened (optional)">${escHtml(s.recap)}</textarea>
          <div class="session-end-row">
            <span class="session-save-state" id="session-recap-state" aria-live="polite"></span>
            ${ended
              ? `<button class="btn-danger btn-sm" id="session-delete">Delete session</button>`
              : `<button class="btn-primary" id="session-end">End session</button>`}
          </div>
        </div>
      </div>`;
    this._wire();
  },

  _saved(el, text = 'Saved') { if (!el) return; el.textContent = text; clearTimeout(el._t); el._t = setTimeout(() => { el.textContent = ''; }, 1500); },

  _debounce(key, fn, ms = 700) { clearTimeout(this._timers[key]); this._timers[key] = setTimeout(fn, ms); },

  _wire() {
    const back = () => Chronicle.showDetail(this._c.id);
    $('#session-back').addEventListener('click', back);

    const patch = (extra, stateEl) => {
      stateEl && (stateEl.textContent = 'Saving…');
      return this._api('PATCH', `${this._base()}/${this._sid}`, extra)
        .then(() => this._saved(stateEl)).catch(e => { toast(e.message, 'error'); stateEl && (stateEl.textContent = 'Not saved'); });
    };
    $('#session-title').addEventListener('input', e => this._debounce('title', () => patch({ title: e.target.value })));
    $('#session-recap').addEventListener('input', e => this._debounce('recap', () => patch({ recap: e.target.value }, $('#session-recap-state'))));

    $('#session-end')?.addEventListener('click', async () => {
      if (!confirm('End this session? You can still edit notes afterwards.')) return;
      try {
        await this._api('POST', `${this._base()}/${this._sid}/end`, { recap: $('#session-recap').value });
        toast('Session ended.'); back();
      } catch (e) { toast(e.message, 'error'); }
    });
    $('#session-delete')?.addEventListener('click', async () => {
      if (!confirm('Delete this session and its notes? This cannot be undone.')) return;
      try { await this._api('DELETE', `${this._base()}/${this._sid}`); toast('Session deleted.'); back(); }
      catch (e) { toast(e.message, 'error'); }
    });

    document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', async () => {
      const kind = b.dataset.add;
      const title = kind === 'note' ? '' : (kind === 'scene' ? 'New scene' : 'New handout');
      try {
        const n = await this._api('POST', `${this._base()}/${this._sid}/notes`, { kind, title });
        this._data.notes.push(n);
        const host = $('#session-notes');
        host.querySelector('.chronicle-empty-state')?.remove();
        host.insertAdjacentHTML('beforeend', this._noteHTML(n));
        this._wireNote(host.lastElementChild);
        host.lastElementChild.querySelector('input')?.focus();
      } catch (e) { toast(e.message, 'error'); }
    }));
    document.querySelectorAll('.session-note').forEach(el => this._wireNote(el));
  },

  _wireNote(el) {
    const nid = el.dataset.nid, kind = [...el.classList].find(c => c.startsWith('session-note-') && c !== 'session-note-head')?.slice(13);
    const state = el.querySelector('.session-save-state');
    const save = () => {
      const payload = { title: el.querySelector('.session-note-title').value };
      const body = el.querySelector('.session-note-body'); if (body) payload.body = body.value;
      if (kind === 'handout') payload.character_ids = [...el.querySelectorAll('.session-share-cb:checked')].map(c => Number(c.value));
      state.textContent = 'Saving…';
      this._api('PUT', `${this._base()}/${this._sid}/notes/${nid}`, payload)
        .then(() => this._saved(state)).catch(e => { toast(e.message, 'error'); state.textContent = 'Not saved'; });
    };
    el.querySelectorAll('.session-note-title, .session-note-body').forEach(i => i.addEventListener('input', () => this._debounce('n' + nid, save)));
    el.querySelectorAll('.session-share-cb').forEach(i => i.addEventListener('change', save));
    el.querySelector('.session-note-del').addEventListener('click', async () => {
      if (!confirm('Delete this ' + (kind === 'scene' ? 'scene marker' : kind) + '?')) return;
      try { await this._api('DELETE', `${this._base()}/${this._sid}/notes/${nid}`); el.remove(); }
      catch (e) { toast(e.message, 'error'); }
    });
  },
};
