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
            <div id="session-roster">${this._rosterHTML()}</div>
            ${ended ? '' : '<div class="ornate-divider">— Roll —</div><div id="session-roll-panel"></div>'}
            <div class="ornate-divider">— Roll Log —</div>
            <div id="session-roll-log"></div>
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
    this._startLive(ended);
  },

  _startLive(ended) {
    this._live?.close();
    const d = this._data;
    this._live = new SessionLive({
      chronicleId: this._c.id, role: 'st', rolls: d.rolls || [], characters: d.characters || [],
      logEl: '#session-roll-log', userId: App.currentUser?.id,
      onRoll: () => this._refreshRoster(), onSession: () => {},
    });
    if (!ended) {
      this._panel = new RollPanel({ el: '#session-roll-panel', live: this._live, role: 'st', onRolled: () => this._refreshRoster() });
      this._live.panel = this._panel;
      this._panel.render();
    }
    this._live.renderLog();
    if (!ended) this._live.connect();
  },

  async _refreshRoster() {
    clearTimeout(this._rt);
    this._rt = setTimeout(async () => {
      try {
        const d = await this._api('GET', `${this._base()}/${this._sid}`);
        this._data.roster = d.roster; this._live.characters = d.characters; this._panel?.render();
        const el = $('#session-roster'); if (el) el.innerHTML = this._rosterHTML();
      } catch {}
    }, 300);
  },

  _saved(el, text = 'Saved') { if (!el) return; el.textContent = text; clearTimeout(el._t); el._t = setTimeout(() => { el.textContent = ''; }, 1500); },

  _debounce(key, fn, ms = 700) { clearTimeout(this._timers[key]); this._timers[key] = setTimeout(fn, ms); },

  _wire() {
    const back = () => { this._live?.close(); Chronicle.showDetail(this._c.id); };
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


// ═════════════════════════ Phase 2: rolling ═════════════════════════════════
const _rollTime = r => { try { return new Date(String(r.created_at).replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };

// Keeps the roll list and the Server-Sent Events connection for one chronicle.
class SessionLive {
  constructor(o) { Object.assign(this, o); this.es = null; this.helloCount = 0; }
  close() { try { this.es?.close(); } catch {} this.es = null; this.closed = true; }
  connect() {
    if (this.closed) return;
    this.es = new EventSource(`/api/chronicles/${this.chronicleId}/session/stream`);
    this.es.addEventListener('hello', () => { if (++this.helloCount > 1) this.resync(); });
    this.es.addEventListener('roll', e => this._in(() => { const r = JSON.parse(e.data); if (!this.rolls.some(x => x.id === r.id)) this.rolls.push(r); this.renderLog(); this.onRoll?.(r); }));
    this.es.addEventListener('void', e => this._in(() => { const r = JSON.parse(e.data); const i = this.rolls.findIndex(x => x.id === r.id); if (i >= 0) this.rolls[i] = r; this.renderLog(); this.onRoll?.(r); }));
    this.es.addEventListener('session', e => this._in(() => this.onSession?.(JSON.parse(e.data))));
  }
  // Ignore events once the screen has been left
  _in(fn) { if (!document.querySelector(this.logEl)) { this.close(); return; } fn(); }
  async resync() {
    try {
      const r = await fetch(`/api/chronicles/${this.chronicleId}/session`); if (!r.ok) return;
      const d = await r.json(); if (!d.session) return;
      this.rolls = d.rolls; this.characters = d.characters; this.renderLog(); this.panel?.render();
    } catch {}
  }
  add(r) { if (!this.rolls.some(x => x.id === r.id)) this.rolls.push(r); this.renderLog(); }
  _canVoid(r) {
    if (r.voided) return false;
    if (this.role === 'st') return true;
    const last = [...this.rolls].reverse().find(x => !x.hidden);
    return r.user_id === this.userId && last && last.id === r.id && !this.readOnly;
  }
  renderLog() {
    const el = $(this.logEl); if (!el) return;
    if (!this.rolls.length) { el.innerHTML = '<p class="chronicle-empty-state">No rolls yet.</p>'; return; }
    el.innerHTML = [...this.rolls].reverse().map(r => {
      const diff = r.difficulty;
      const dice = r.dice.map(d => `<span class="die${d >= diff || d === 10 ? ' die-hit' : ''}${d === 1 ? ' die-one' : ''}${d === 10 ? ' die-ten' : ''}">${d}</span>`).join('') || '<span class="die-none">no dice</span>';
      const items = (r.pool.items || []).map(i => i.key === 'custom' ? `${i.value} dice` : `${escHtml(i.label)} ${i.value}`).join(' + ');
      const adj = [r.pool.modifier ? `${r.pool.modifier > 0 ? '+' : ''}${r.pool.modifier} dice` : '', r.pool.wound ? `${r.pool.wound} wounds` : ''].filter(Boolean).join(', ');
      const flags = [r.specialty && 'specialty', r.willpower && 'Willpower', r.threshold && `threshold ${r.threshold}`, r.hidden && 'hidden'].filter(Boolean).join(' · ');
      const res = r.outcome === 'botch' ? '<b class="roll-botch">BOTCH</b>'
        : r.outcome === 'success' ? `<b class="roll-success">${r.successes} success${r.successes === 1 ? '' : 'es'}</b>` : '<b class="roll-fail">Failure</b>';
      return `<div class="roll-entry${r.voided ? ' roll-voided' : ''}${r.hidden ? ' roll-hidden' : ''}" data-rid="${r.id}">
        <div class="roll-head"><span class="roll-who">${escHtml(r.roller_name || 'Someone')}</span>
          ${r.label && r.label !== r.roller_name ? `<span class="roll-label">${escHtml(r.label)}</span>` : ''}
          <span class="roll-time">${_rollTime(r)}</span></div>
        <div class="roll-pool">${items}${adj ? ` (${adj})` : ''} · diff ${diff}${flags ? ' · ' + flags : ''}</div>
        <div class="roll-dice">${dice}</div>
        <div class="roll-result">${res}${r.outcome === 'success' && r.degree ? ` <span class="roll-degree">${escHtml(r.degree)}</span>` : ''}
          ${r.voided ? `<span class="roll-void-note">voided${r.void_reason ? ': ' + escHtml(r.void_reason) : ''}</span>` : ''}
          ${this._canVoid(r) ? `<button class="btn-ghost btn-sm roll-void-btn" data-rid="${r.id}">${this.role === 'st' ? 'Void' : 'Undo'}</button>` : ''}</div>
      </div>`;
    }).join('');
    el.querySelectorAll('.roll-void-btn').forEach(b => b.addEventListener('click', async () => {
      const reason = this.role === 'st' ? (prompt('Reason for voiding (optional)') ?? null) : '';
      if (reason === null) return;
      b.disabled = true;
      try {
        const r = await fetch(`/api/chronicles/${this.chronicleId}/session/rolls/${b.dataset.rid}/void`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
        const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Failed');
        const i = this.rolls.findIndex(x => x.id === body.id); if (i >= 0) this.rolls[i] = body;
        this.renderLog(); this.onRoll?.(body);
      } catch (e) { toast(e.message, 'error'); b.disabled = false; }
    }));
  }
}

// The roll form. Players see only their own characters; the Storyteller also gets
// NPC / custom pools and hidden rolls.
class RollPanel {
  constructor(o) { Object.assign(this, o); this.charId = null; this.sel = []; this.opts = { difficulty: 6, modifier: 0, threshold: 0, specialty: false, willpower: false, wound: true, hidden: false, pool_size: 5, label: '' }; }
  get chars() { return this.live.characters; }
  get char() { return this.chars.find(c => c.id === this.charId) || null; }
  render() {
    const host = $(this.el); if (!host) return;
    if (this.charId === null && this.role !== 'st' && this.chars.length) this.charId = this.chars[0].id;
    if (this.charId !== null && !this.char) this.charId = null;
    const c = this.char, st = this.role === 'st';
    const groups = {};
    if (c) c.traits.forEach(t => (groups[t.group] = groups[t.group] || []).push(t));
    const { picked, specOk } = this._calc();
    const o = this.opts;
    host.innerHTML = `<div class="roll-panel">
      ${st || this.chars.length > 1 ? `<label class="roll-field">Character
        <select class="form-input" id="rp-char">${st ? '<option value="">NPC / custom pool</option>' : ''}
          ${this.chars.map(x => `<option value="${x.id}" ${x.id === this.charId ? 'selected' : ''}>${escHtml(x.name)}</option>`).join('')}</select></label>` : (c ? `<div class="roll-charname">${escHtml(c.name)}</div>` : '')}
      ${c ? Object.entries(groups).map(([g, ts]) => `<div class="roll-group"><div class="roll-group-title">${g}</div>
        <div class="roll-chips">${ts.map(t => `<button type="button" class="roll-chip${this.sel.includes(t.key) ? ' on' : ''}" data-key="${t.key}">${escHtml(t.label)} <b>${t.value}</b></button>`).join('')}</div></div>`).join('')
        : `<label class="roll-field">Dice <input type="number" class="form-input" id="rp-size" min="0" max="50" value="${o.pool_size}"></label>
           <label class="roll-field">Label <input type="text" class="form-input" id="rp-label" maxlength="120" placeholder="Guard, Spirit, ..." value="${escHtml(o.label)}"></label>`}
      <div class="roll-row">
        <label class="roll-field">Difficulty <select class="form-input" id="rp-diff">${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option ${n === o.difficulty ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="roll-field">Dice +/- <input type="number" class="form-input" id="rp-mod" min="-10" max="10" value="${o.modifier}"></label>
        <label class="roll-field">Threshold <input type="number" class="form-input" id="rp-thr" min="0" max="10" value="${o.threshold}"></label>
      </div>
      <div class="roll-toggles">
        <label><input type="checkbox" id="rp-spec" ${o.specialty && specOk ? 'checked' : ''} ${specOk ? '' : 'disabled'}> Specialty</label>
        <label><input type="checkbox" id="rp-wp" ${o.willpower ? 'checked' : ''} ${c && c.willpower_current < 1 ? 'disabled' : ''}> Willpower${c ? ` (${c.willpower_current} left)` : ''}</label>
        ${c ? `<label><input type="checkbox" id="rp-wound" ${o.wound ? 'checked' : ''}> Wound penalty${c.wound_penalty ? ` (${c.wound_penalty})` : ''}</label>` : ''}
        ${st ? `<label><input type="checkbox" id="rp-hidden" ${o.hidden ? 'checked' : ''}> Hidden from players</label>` : ''}
      </div>
      <div class="roll-summary">${this._summaryHTML()}</div>
      <button class="btn-primary" id="rp-go" ${c && !picked.length ? 'disabled' : ''}>Roll</button>
    </div>`;
    this._wire(host);
  }
  _calc() {
    const c = this.char, o = this.opts;
    const picked = c ? this.sel.map(k => c.traits.find(t => t.key === k)).filter(Boolean) : [];
    const base = c ? picked.reduce((n, t) => n + t.value, 0) : Number(o.pool_size) || 0;
    const wound = c && o.wound && !picked.some(t => t.key === 'arete') ? c.wound_penalty : 0;
    const total = Math.max(0, base + (Number(o.modifier) || 0) + wound);
    return { picked, wound, total, specOk: !c || picked.some(t => t.value >= 4) };
  }
  _summaryHTML() {
    const c = this.char, o = this.opts, { picked, wound, total } = this._calc();
    return `${c ? (picked.length ? picked.map(t => `${escHtml(t.label)} ${t.value}`).join(' + ') : 'Pick traits above') : 'Custom pool'}${o.modifier ? ` ${o.modifier > 0 ? '+' : ''}${o.modifier}` : ''}${wound ? ` ${wound} wounds` : ''} = <b>${total}</b> dice`;
  }
  _wire(host) {
    const o = this.opts;
    host.querySelector('#rp-char')?.addEventListener('change', e => { this.charId = e.target.value ? Number(e.target.value) : null; this.sel = []; o.willpower = false; o.specialty = false; this.render(); });
    host.querySelectorAll('.roll-chip').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.key; this.sel = this.sel.includes(k) ? this.sel.filter(x => x !== k) : [...this.sel, k].slice(0, 6); this.render();
    }));
    const num = (id, key) => host.querySelector(id)?.addEventListener('input', e => { o[key] = Number(e.target.value) || 0; const el = host.querySelector('.roll-summary'); if (el) el.innerHTML = this._summaryHTML(); });
    num('#rp-mod', 'modifier'); num('#rp-thr', 'threshold'); num('#rp-size', 'pool_size');
    host.querySelector('#rp-diff')?.addEventListener('change', e => { o.difficulty = Number(e.target.value); });
    host.querySelector('#rp-label')?.addEventListener('input', e => { o.label = e.target.value; });
    const chk = (id, key) => host.querySelector(id)?.addEventListener('change', e => { o[key] = e.target.checked; this.render(); });
    chk('#rp-spec', 'specialty'); chk('#rp-wp', 'willpower'); chk('#rp-wound', 'wound'); chk('#rp-hidden', 'hidden');
    host.querySelector('#rp-go')?.addEventListener('click', async e => {
      const btn = e.currentTarget; btn.disabled = true;
      const body = { difficulty: o.difficulty, modifier: o.modifier, threshold: o.threshold, specialty: o.specialty, willpower: o.willpower, hidden: this.role === 'st' && o.hidden };
      if (this.charId) { body.character_id = this.charId; body.traits = this.sel; body.wound = o.wound; }
      else { body.pool_size = o.pool_size; body.label = o.label; }
      try {
        const r = await fetch(`/api/chronicles/${this.live.chronicleId}/session/rolls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const row = await r.json(); if (!r.ok) throw new Error(row.error || 'Roll failed');
        this.live.add(row);
        o.willpower = false; // a Willpower point is spent per roll, never carried over
        this.onRolled?.(row);
        if (this.charId) { const ch = this.char; if (ch && row.wp_spent) ch.willpower_current = Math.max(0, ch.willpower_current - 1); }
        this.render();
      } catch (err) { toast(err.message, 'error'); btn.disabled = false; }
    });
  }
}

// Player-facing screen: roll panel and log for the running session.
Object.assign(SessionUI, {
  async openPlayer(chronicleId, back) {
    App.showPage('chronicle');
    $('#chronicle-content').innerHTML = '<div class="chronicle-loading">Loading…</div>';
    let d;
    try { d = await this._api('GET', `/api/chronicles/${chronicleId}/session`); }
    catch (e) { $('#chronicle-content').innerHTML = `<p class="error-msg">${escHtml(e.message)}</p>`; return; }
    if (!d.session) { toast('There is no session running right now.', 'error'); (back || (() => App.showDashboard()))(); return; }
    $('#chronicle-content').innerHTML = `<div class="chronicle-page session-page">
      <div class="session-top"><button class="btn-ghost" id="ps-back">← Back</button>
        <h2 class="section-title" style="margin:0">Session ${d.session.number}${d.session.title ? ': ' + escHtml(d.session.title) : ''}
          <span class="session-badge session-badge-live" id="ps-badge">Live</span></h2></div>
      <div class="session-grid"><div><div class="ornate-divider">— Roll —</div><div id="ps-panel"></div></div>
        <div><div class="ornate-divider">— Roll Log —</div><div id="ps-log"></div></div></div></div>`;
    const live = new SessionLive({ chronicleId, role: 'player', rolls: d.rolls, characters: d.characters, logEl: '#ps-log', userId: App.currentUser?.id });
    const panel = new RollPanel({ el: '#ps-panel', live, role: 'player' });
    live.panel = panel;
    live.onSession = ev => {
      if (ev.status === 'ended') {
        live.readOnly = true; live.renderLog(); $('#ps-panel').innerHTML = '<p class="chronicle-empty-state">The session has ended.</p>';
        const b = $('#ps-badge'); if (b) { b.textContent = 'Ended'; b.className = 'session-badge session-badge-ended'; }
      }
    };
    live.onRoll = () => {}; // own Willpower changes arrive through resync on reconnect
    $('#ps-back').addEventListener('click', () => { live.close(); (back || (() => App.showDashboard()))(); });
    panel.render(); live.renderLog(); live.connect();
  },

  // "Join session" banner on a player's own character sheet
  async sheetBanner(char) {
    const host = document.getElementById('session-join-banner'); if (!host || !char.chronicle_id) return;
    try {
      const r = await fetch(`/api/chronicles/${char.chronicle_id}/session`); if (!r.ok) return;
      const d = await r.json(); if (!d.session) return;
      host.innerHTML = `<div class="session-join-banner"><span class="session-live-dot"></span>
        <span>Session ${d.session.number}${d.session.title ? ': ' + escHtml(d.session.title) : ''} is running.</span>
        <button class="btn-primary btn-sm" id="btn-join-session">Join session</button></div>`;
      document.getElementById('btn-join-session').addEventListener('click', () => this.openPlayer(char.chronicle_id, () => App.viewCharacter(char.id)));
    } catch {}
  },
});
