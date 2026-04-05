/* ═══════════════════════════════════════════════════════════════
   Mage: The Ascension 20th Anniversary Edition
   Character Generator — Main Application + Creator
   ═══════════════════════════════════════════════════════════════ */

/* ─── Utilities ──────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-container').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function dots(value, max = 5, cls = '') {
  let html = `<span class="dots ${cls}">`;
  for (let i = 1; i <= max; i++) {
    html += `<span class="dot ${i <= value ? 'filled' : ''}"></span>`;
  }
  return html + '</span>';
}

function dotsClickable(value, max = 5, onChange, cls = '') {
  let html = `<span class="dots ${cls}" data-max="${max}">`;
  for (let i = 1; i <= max; i++) {
    html += `<span class="dot ${i <= value ? 'filled' : ''}" data-val="${i}"></span>`;
  }
  return html + '</span>';
}

function attachDotListeners(container, getValue, setValue, min = 0) {
  $$('.dots[data-max]', container).forEach(dotsEl => {
    dotsEl.addEventListener('click', e => {
      const dot = e.target.closest('.dot');
      if (!dot) return;
      const val = parseInt(dot.dataset.val);
      const current = getValue(dotsEl);
      const newVal = current === val ? Math.max(min, val - 1) : val;
      setValue(dotsEl, newVal);
    });
  });
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Returns the faction-appropriate display name for a background
function bgDisplayName(bg, affiliation) {
  if (!bg) return '';
  if (affiliation === 'Technocracy' && bg.technocracyName) return bg.technocracyName;
  if (bg.traditionName) return bg.traditionName;
  return bg.name;
}

// Returns only backgrounds appropriate for the given affiliation
function filteredBackgrounds(affiliation) {
  return M20.BACKGROUNDS.filter(bg => {
    if (bg.technocracy && affiliation !== 'Technocracy') return false;
    return true;
  });
}

/* ─── API ────────────────────────────────────────────────────── */
const API = {
  async get(id = '') {
    const r = await fetch(`/api/characters${id ? '/' + id : ''}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async create(data) {
    const r = await fetch('/api/characters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(id, data) {
    const r = await fetch(`/api/characters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(id) {
    const r = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};

// Per-user UI preferences stored in localStorage (persists across logins on this device)
const UiPrefs = {
  _key() { return `m20-ui-prefs-${App.currentUser?.id || 'guest'}`; },
  get(key, defaultVal = null) {
    try {
      const prefs = JSON.parse(localStorage.getItem(this._key()) || '{}');
      return key in prefs ? prefs[key] : defaultVal;
    } catch { return defaultVal; }
  },
  set(key, val) {
    try {
      const k = this._key();
      const prefs = JSON.parse(localStorage.getItem(k) || '{}');
      prefs[key] = val;
      localStorage.setItem(k, JSON.stringify(prefs));
    } catch {}
  },
};

// Abilities that require a specialty from 1 dot (M20 "Well-Skilled Craftsman" p. 279)
const GENERAL_ABILITY_IDS = new Set(['art', 'crafts', 'academics', 'esoterica', 'science']);

/* ═══════════════════════════════════════════════════════════════
   APP — Page routing & roster
   ═══════════════════════════════════════════════════════════════ */
const App = {
  currentCharId: null,
  currentUser: null,
  _popping: false,

  setUser(user) {
    this.currentUser = user;
    $('#user-name').textContent = user.username;
    $('#user-info').style.display = 'flex';
    $('#nav-dashboard').style.display = '';
    $('#nav-logout').style.display = '';
    if (user.role === 'admin') {
      $('#nav-admin').style.display = '';
      $('#admin-badge').style.display = 'inline';
    } else {
      $('#nav-admin').style.display = 'none';
      $('#admin-badge').style.display = 'none';
    }
    // Apply user's saved theme preference (UiPrefs key uses currentUser.id, set before calling)
    const savedTheme = UiPrefs.get('theme', null);
    if (savedTheme) {
      this.applyTheme(savedTheme);
    } else {
      // No per-user pref — keep whatever the device-level m20-theme is
      const current = document.documentElement.getAttribute('data-theme');
      this._updateThemeBtn(current === 'light' ? 'light' : 'dark');
    }
  },

  clearUser() {
    this.currentUser = null;
    $('#user-info').style.display = 'none';
    ['nav-dashboard','nav-admin','nav-logout'].forEach(id => {
      $(`#${id}`).style.display = 'none';
    });
    $('#admin-badge').style.display = 'none';
  },

  applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem('m20-theme', theme || 'dark'); } catch(e) {}
    this._updateThemeBtn(theme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
    // Persist per-user if logged in
    if (this.currentUser) UiPrefs.set('theme', next);
  },

  _updateThemeBtn(theme) {
    const btn = $('#btn-theme');
    if (!btn) return;
    if (theme === 'light') {
      btn.textContent = '☀';
      btn.title = 'Switch to dark mode';
    } else {
      btn.textContent = '☽';
      btn.title = 'Switch to light mode';
    }
  },

  _recentShowAll: false,

  async showDashboard() {
    this.showPage('dashboard');
    const greeting = $('#dashboard-greeting');
    if (this.currentUser) greeting.textContent = `Welcome back, ${this.currentUser.username}`;

    // Render the toggle for admins
    const toggleWrap = $('#dashboard-recent-toggle');
    if (toggleWrap) {
      if (this.currentUser?.role === 'admin') {
        toggleWrap.innerHTML = `
          <button id="btn-recent-mine" class="btn-sm ${this._recentShowAll ? 'btn-ghost' : 'btn-secondary'}"
            onclick="App._recentShowAll=false;App.loadRecentCards()">Mine</button>
          <button id="btn-recent-all" class="btn-sm ${this._recentShowAll ? 'btn-secondary' : 'btn-ghost'}"
            onclick="App._recentShowAll=true;App.loadRecentCards()">All Users</button>`;
        toggleWrap.style.display = 'flex';
      } else {
        toggleWrap.style.display = 'none';
      }
    }

    await this.loadRecentCards();
  },

  async loadRecentCards() {
    const grid  = $('#dashboard-cards');
    const empty = $('#dashboard-empty');
    // Update toggle button styles
    $('#btn-recent-mine')?.classList.toggle('btn-secondary', !this._recentShowAll);
    $('#btn-recent-mine')?.classList.toggle('btn-ghost',     this._recentShowAll);
    $('#btn-recent-all')?.classList.toggle('btn-secondary',  this._recentShowAll);
    $('#btn-recent-all')?.classList.toggle('btn-ghost',     !this._recentShowAll);
    try {
      const url = (this._recentShowAll && this.currentUser?.role === 'admin')
        ? '/api/characters/recent/all'
        : '/api/characters/recent';
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const chars = await r.json();
      if (!Array.isArray(chars) || chars.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = chars.map(c => this.renderCard(c, !!c.owner_username)).join('');
      }
    } catch {
      grid.innerHTML = '';
    }
  },

  async showAdmin() {
    this.showPage('admin');
    const content = $('#admin-content');
    content.innerHTML = '<p style="color:var(--text-faint);font-style:italic">Loading users…</p>';
    try {
      const r = await fetch('/api/admin/users');
      if (!r.ok) throw new Error('Access denied');
      const { users, purged } = await r.json();
      const me = this.currentUser;
      const formatDate = iso => {
        if (!iso) return '<span style="color:var(--text-faint)">Never</span>';
        const d = new Date(iso);
        return `<span title="${d.toLocaleString()}">${d.toLocaleDateString()}</span>`;
      };
      content.innerHTML = `
        ${purged > 0 ? `<p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.75rem">♻ Auto-purged ${purged} ghost account${purged > 1 ? 's' : ''} (≤1 login, 0 characters, &gt;30 days old).</p>` : ''}
        <table class="admin-table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Role</th>
              <th>Chars</th><th>Last Login</th><th>Logins</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const isSelf = me && u.id === me.id;
              return `<tr>
                <td>${u.username}</td>
                <td style="font-size:0.8rem;color:var(--text-dim)">${u.email}</td>
                <td>
                  <span class="${u.role === 'admin' ? 'admin-badge' : ''}" style="${u.role !== 'admin' ? 'color:var(--text-dim);font-size:0.8rem' : ''}">${u.role}</span>
                </td>
                <td style="text-align:center">
                  ${u.character_count > 0
                    ? `<button class="btn-ghost btn-sm" style="min-width:2rem" onclick="App.showUserCharacters(${u.id},'${u.username.replace(/'/g, "\\'")}')" title="View ${u.username}'s characters">${u.character_count}</button>`
                    : '0'}
                </td>
                <td style="font-size:0.8rem;color:var(--text-dim)">${formatDate(u.last_login)}</td>
                <td style="text-align:center;font-size:0.8rem;color:var(--text-dim)">${u.login_count ?? 0}</td>
                <td class="${u.is_active ? 'status-active' : 'status-disabled'}">${u.is_active ? 'Active' : 'Disabled'}</td>
                <td>
                  <div class="admin-actions">
                    <button class="btn-ghost btn-sm" onclick="App.toggleUser(${u.id}, ${u.is_active})"
                      ${isSelf ? 'disabled title="Cannot disable your own account"' : ''}>
                      ${u.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn-ghost btn-sm" onclick="App.changeRole(${u.id}, '${u.role}', '${u.username}')"
                      ${isSelf ? 'disabled title="Cannot change your own role"' : ''}>
                      ${u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button class="btn-secondary btn-sm" onclick="App.resetPassword(${u.id}, '${u.username}')">
                      Reset PW
                    </button>
                    <button class="btn-danger btn-sm" onclick="App.deleteUser(${u.id}, '${u.username}')"
                      ${isSelf ? 'disabled title="Cannot delete your own account"' : ''}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    } catch (err) {
      content.innerHTML = `<p style="color:var(--crimson)">Failed to load users: ${err.message}</p>`;
    }
  },

  async toggleUser(id, isActive) {
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive ? 0 : 1 })
      });
      if (!r.ok) throw new Error();
      toast(isActive ? 'User disabled' : 'User enabled');
      await this.showAdmin();
    } catch { toast('Failed to update user', 'error'); }
  },

  async changeRole(id, currentRole, username) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!r.ok) throw new Error();
      toast(`${username} ${newRole === 'admin' ? 'promoted to Admin' : 'demoted to User'}.`);
      await this.showAdmin();
    } catch { toast('Failed to change role.', 'error'); }
  },

  resetPassword(id, username) {
    $('#modal-title').textContent = `Reset Password — ${username}`;
    $('#modal-body').innerHTML = `
      <p style="margin-bottom:0.75rem">Set a new password for <strong style="color:var(--gold-mid)">${username}</strong>:</p>
      <div class="form-group">
        <label class="form-label">New Password <span class="form-hint">(min 6 characters)</span></label>
        <input type="password" id="modal-new-password" class="form-input" minlength="6" placeholder="Enter new password…" />
      </div>`;
    const btn = $('#modal-confirm');
    btn.textContent = 'Reset Password';
    btn.className = 'btn-secondary';
    btn.onclick = async () => {
      const pw = $('#modal-new-password')?.value || '';
      if (pw.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
      try {
        const r = await fetch(`/api/admin/users/${id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw })
        });
        if (!r.ok) throw new Error();
        this.closeModal();
        toast(`Password reset for ${username}.`);
      } catch { toast('Failed to reset password.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
  },

  deleteUser(id, username) {
    $('#modal-title').textContent = 'Delete User';
    $('#modal-body').innerHTML = `<p>Permanently delete <strong style="color:var(--crimson)">${username}</strong> and all their characters?<br>This cannot be undone.</p>`;
    const btn = $('#modal-confirm');
    btn.textContent = 'Delete User';
    btn.className = 'btn-danger';
    btn.onclick = async () => {
      try {
        const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error();
        this.closeModal();
        toast(`${username} has been deleted.`);
        await this.showAdmin();
      } catch { toast('Failed to delete user.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
  },

  async logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    this.clearUser();
    this.showPage('auth');
  },

  // ── Shared sheet view — accessible without login ─────────────────────────────
  async loadSharedSheet(token) {
    Sheet.sharedToken = token;

    // Check if user is logged in (silently — shared view works either way)
    try {
      const r = await fetch('/api/auth/me');
      if (r.ok) {
        const user = await r.json();
        this.setUser(user);
      }
    } catch {}

    // Fetch the shared character data
    try {
      const r = await fetch(`/api/share/${token}`);
      if (!r.ok) {
        // Show a minimal not-found state inside the sheet page
        $$('.page').forEach(p => p.classList.remove('active'));
        $('#page-sheet').classList.add('active');
        $('#sheet-toolbar-left').innerHTML =
          `<button class="btn-ghost" onclick="window.location.href='/'">← Home</button>`;
        $('#sheet-toolbar-right').innerHTML = '';
        $('#sheet-content').innerHTML = `
          <div style="text-align:center;padding:4rem 2rem;color:var(--text-faint)">
            <div style="font-size:2rem;margin-bottom:1rem">☽✦☾</div>
            <p style="font-size:1.1rem">This share link is no longer valid or the character has been removed.</p>
          </div>`;
        return;
      }
      const { character, likeCount, userLiked } = await r.json();
      Sheet.render(character);
      Sheet.renderToolbar('shared', { token, likeCount, userLiked });

      // Show sheet page bypassing the login guard
      $$('.page').forEach(p => p.classList.remove('active'));
      $('#page-sheet').classList.add('active');

      history.replaceState({ page: 'shared', token }, '', `/s/${token}`);
    } catch {
      toast('Failed to load shared character', 'error');
    }
  },

  showAbout() {
    // About is accessible without login — bypass the auth guard in showPage
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#page-about').classList.add('active');
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    $('#nav-about').classList.add('active');
    if (!this._popping) {
      const state = { page: 'about' };
      if (history.state === null) history.replaceState(state, '', location.pathname);
      else history.pushState(state, '', location.pathname);
    }
  },

  showPage(id) {
    if (id !== 'auth' && !this.currentUser) {
      $$('.page').forEach(p => p.classList.remove('active'));
      $('#page-auth').classList.add('active');
      return;
    }
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${id}`).classList.add('active');
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    if (id === 'dashboard') $('#nav-dashboard').classList.add('active');
    if (id === 'admin')     $('#nav-admin').classList.add('active');
    if (id === 'about')     $('#nav-about').classList.add('active');
    // Push browser history state (skip during popstate restoration)
    if (!this._popping && id !== 'auth') {
      const state = { page: id };
      if (id === 'sheet' && this.currentCharId) state.charId = this.currentCharId;
      if (id === 'creator') {
        if (Creator.editId) state.charId = Creator.editId;
        state.step = Creator.step || 0;
      }
      // Use replaceState on the very first navigation so there is no blank
      // "before the app" entry in the stack — subsequent navigations push normally.
      if (history.state === null) {
        history.replaceState(state, '', location.pathname);
      } else {
        history.pushState(state, '', location.pathname);
      }
    }
  },

  async showRoster() {
    this.showPage('roster');
    await this.loadRoster();
  },

  async loadRoster() {
    const grid = $('#roster-grid');
    const empty = $('#roster-empty');
    try {
      const chars = await API.get();
      if (chars.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = chars.map(c => this.renderCard(c)).join('');
      }
    } catch (err) {
      toast('Failed to load characters', 'error');
    }
  },

  renderCard(c, showOwner = false) {
    const tradition = c.tradition || c.affiliation || '—';
    const concept   = c.concept || '—';
    return `
      <div class="character-card" onclick="App.viewCharacter(${c.id})">
        <div class="card-tradition">${tradition}</div>
        <div class="card-name">${c.name}</div>
        ${showOwner && c.owner_username ? `<div class="card-owner">✦ ${c.owner_username}</div>` : ''}
        <div class="card-concept">${concept}</div>
        <div class="card-stats">
          <div class="card-stat">
            <span class="card-stat-label">Arete</span>
            <span class="card-stat-value">${c.arete || 1}</span>
          </div>
          <div class="card-stat">
            <span class="card-stat-label">Willpower</span>
            <span class="card-stat-value">${c.willpower || 5}</span>
          </div>
          <div class="card-stat">
            <span class="card-stat-label">Essence</span>
            <span class="card-stat-value" style="font-size:0.7rem">${c.essence || '—'}</span>
          </div>
        </div>
        <div class="card-date">Updated ${formatDate(c.updated_at)}</div>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-secondary btn-sm" onclick="App.viewCharacter(${c.id})">View Sheet</button>
          <button class="btn-ghost btn-sm" onclick="App.editCharacter(${c.id})">Edit</button>
          <button class="btn-danger btn-sm" onclick="App.confirmDelete(${c.id}, '${c.name.replace(/'/g,"\\'")}')">Delete</button>
        </div>
      </div>`;
  },

  async viewCharacter(id) {
    this.currentCharId = id;
    try {
      const char = await API.get(id);
      Sheet.sharedToken = null;
      Sheet.render(char);
      Sheet.renderToolbar('owner');
      this.showPage('sheet');
    } catch (err) {
      toast('Failed to load character', 'error');
    }
  },

  async editCharacter(id) {
    this.currentCharId = id;
    try {
      const char = await API.get(id);
      Creator.loadCharacter(char);
      this.showPage('creator');
    } catch (err) {
      toast('Failed to load character', 'error');
    }
  },

  startNewCharacter() {
    this.currentCharId = null;
    Creator.init();
    this.showPage('creator');
  },

  confirmDelete(id, name) {
    $('#modal-title').textContent = 'Delete Character';
    $('#modal-body').innerHTML = `<p>Permanently delete <strong style="color:var(--gold-mid)">${name}</strong>?<br>This cannot be undone.</p>`;
    const btn = $('#modal-confirm');
    btn.onclick = async () => {
      try {
        await API.delete(id);
        this.closeModal();
        toast(`${name} has passed beyond the Gauntlet.`);
        await this.loadRoster();
      } catch { toast('Delete failed', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
  },

  async showUserCharacters(userId, username) {
    // Reuse the modal — hide Confirm, relabel Cancel as Close
    $('#modal-title').textContent = `${username}'s Characters`;
    $('#modal-body').innerHTML = '<p style="color:var(--text-faint);font-style:italic;text-align:center;padding:1rem 0">Loading…</p>';
    const confirmBtn = $('#modal-confirm');
    if (confirmBtn) confirmBtn.style.display = 'none';
    const cancelBtn = document.querySelector('.modal-footer .btn-ghost');
    if (cancelBtn) cancelBtn.textContent = 'Close';
    $('#modal-overlay').style.display = 'flex';
    try {
      const r = await fetch(`/api/admin/users/${userId}/characters`);
      if (!r.ok) throw new Error('Failed to load');
      const { characters } = await r.json();
      if (!characters.length) {
        $('#modal-body').innerHTML = '<p style="color:var(--text-faint);text-align:center;padding:1.5rem 0">No characters yet.</p>';
      } else {
        $('#modal-body').innerHTML = `<div class="roster-grid" style="padding:0.25rem 0 0.5rem">${characters.map(c => this.renderCard(c)).join('')}</div>`;
      }
    } catch {
      $('#modal-body').innerHTML = '<p style="color:var(--crimson);text-align:center">Failed to load characters.</p>';
    }
  },

  closeModal() {
    $('#modal-overlay').style.display = 'none';
    // Reset confirm button and cancel button to neutral state for next use
    const confirmBtn = $('#modal-confirm');
    if (confirmBtn) { confirmBtn.textContent = 'Confirm'; confirmBtn.className = 'btn-danger'; confirmBtn.onclick = null; confirmBtn.style.display = ''; }
    const cancelBtn = document.querySelector('.modal-footer .btn-ghost');
    if (cancelBtn) cancelBtn.textContent = 'Cancel';
  },
};

/* ═══════════════════════════════════════════════════════════════
   AUTH — Login / Registration
   ═══════════════════════════════════════════════════════════════ */
const Auth = {
  showTab(tab) {
    $('#form-login').style.display    = tab === 'login'    ? 'flex' : 'none';
    $('#form-register').style.display = tab === 'register' ? 'flex' : 'none';
    $('#form-forgot').style.display   = 'none';
    $('#form-reset').style.display    = 'none';
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    $(`#tab-${tab}`)?.classList.add('active');
    $$('.auth-tabs').forEach(el => el.style.display = '');
  },

  showForgot() {
    $('#form-login').style.display    = 'none';
    $('#form-register').style.display = 'none';
    $('#form-forgot').style.display   = 'flex';
    $('#form-reset').style.display    = 'none';
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    $$('.auth-tabs').forEach(el => el.style.display = 'none');
    $('#forgot-email').value = '';
    $('#forgot-error').style.display   = 'none';
    $('#forgot-success').style.display = 'none';
  },

  showReset() {
    $('#form-login').style.display    = 'none';
    $('#form-register').style.display = 'none';
    $('#form-forgot').style.display   = 'none';
    $('#form-reset').style.display    = 'flex';
    $$('.auth-tabs').forEach(el => el.style.display = 'none');
    $('#reset-error').style.display   = 'none';
    $('#reset-success').style.display = 'none';
  },

  async forgotPassword(e) {
    e.preventDefault();
    const email   = $('#forgot-email').value.trim();
    const errEl   = $('#forgot-error');
    const succEl  = $('#forgot-success');
    errEl.style.display = succEl.style.display = 'none';
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      // Always show success — don't reveal whether email exists
      succEl.textContent = 'If that email is registered, a reset link is on its way. Check your inbox.';
      succEl.style.display = 'block';
      $('#forgot-email').value = '';
    } catch {
      errEl.textContent = 'Could not connect to server. Please try again.';
      errEl.style.display = 'block';
    }
  },

  async resetPassword(e) {
    e.preventDefault();
    const password = $('#reset-password').value;
    const confirm  = $('#reset-password-confirm').value;
    const errEl    = $('#reset-error');
    const succEl   = $('#reset-success');
    errEl.style.display = succEl.style.display = 'none';
    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match.';
      errEl.style.display = 'block';
      return;
    }
    const token = new URLSearchParams(window.location.search).get('token');
    try {
      const r    = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await r.json();
      if (!r.ok) {
        errEl.textContent = data.error || 'Reset failed.';
        errEl.style.display = 'block';
        return;
      }
      succEl.textContent = 'Password updated! You can now sign in.';
      succEl.style.display = 'block';
      $('#reset-password').value = '';
      $('#reset-password-confirm').value = '';
      // Clear token from URL and switch to login after a short delay
      history.replaceState({}, '', location.pathname);
      setTimeout(() => Auth.showTab('login'), 2500);
    } catch {
      errEl.textContent = 'Could not connect to server. Please try again.';
      errEl.style.display = 'block';
    }
  },

  async login(e) {
    e.preventDefault();
    const username     = $('#login-username').value.trim();
    const password     = $('#login-password').value;
    const staySignedIn = $('#login-remember').checked;
    const errEl = $('#login-error');
    errEl.style.display = 'none';
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, staySignedIn })
      });
      const data = await r.json();
      if (!r.ok) {
        errEl.textContent = data.error || 'Login failed';
        errEl.style.display = 'block';
        return;
      }
      App.setUser(data);
      App.showDashboard();
    } catch {
      errEl.textContent = 'Could not connect to server. Please try again.';
      errEl.style.display = 'block';
    }
  },

  async register(e) {
    e.preventDefault();
    const username = $('#reg-username').value.trim();
    const email    = $('#reg-email').value.trim();
    const password = $('#reg-password').value;
    const confirm  = $('#reg-password-confirm').value;
    const errEl = $('#reg-error');
    errEl.style.display = 'none';
    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match.';
      errEl.style.display = 'block';
      $('#reg-password-confirm').focus();
      return;
    }
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await r.json();
      if (!r.ok) {
        errEl.textContent = data.error || 'Registration failed';
        errEl.style.display = 'block';
        return;
      }
      App.setUser(data);
      App.showDashboard();
    } catch {
      errEl.textContent = 'Could not connect to server. Please try again.';
      errEl.style.display = 'block';
    }
  },
};

/* ═══════════════════════════════════════════════════════════════
   SHEET — Character sheet rendering
   ═══════════════════════════════════════════════════════════════ */
const Sheet = {
  char: null,
  sharedToken: null,

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  // mode: 'owner' | 'shared'
  // opts (shared): { token, likeCount, userLiked }
  renderToolbar(mode, opts = {}) {
    const left  = $('#sheet-toolbar-left');
    const right = $('#sheet-toolbar-right');
    if (!left || !right) return;

    if (mode === 'owner') {
      left.innerHTML = `<button class="btn-ghost" onclick="App.showRoster()">← Back to Roster</button>`;
      right.innerHTML = `
        <button class="btn-secondary" onclick="Sheet.editCharacter()">Edit Character</button>
        <button class="btn-secondary" onclick="Sheet.exportPDF()">Export PDF</button>
        <button class="btn-secondary" onclick="Sheet.exportFoundry()" title="Export as Foundry VTT actor (worldofdarkness system)">Export Foundry</button>
        <button class="btn-secondary" onclick="Sheet.shareSheet()">Share Sheet</button>
        <button class="btn-danger" onclick="Sheet.deleteCharacter()">Delete</button>
      `;
    } else if (mode === 'shared') {
      const { likeCount = 0, userLiked = false } = opts;
      const backBtn = App.currentUser
        ? `<button class="btn-ghost" onclick="App.showRoster()">← My Characters</button>`
        : `<button class="btn-ghost" onclick="window.location.href='/'">← Sign In</button>`;
      left.innerHTML = backBtn;

      const countLabel = likeCount === 1 ? '1 like' : `${likeCount} likes`;
      const likeBtn = App.currentUser
        ? `<button class="like-btn${userLiked ? ' liked' : ''}" id="btn-like" onclick="Sheet.toggleLike()">
             ${userLiked ? '❤' : '♡'} ${userLiked ? 'Liked' : 'Like'}
           </button>`
        : `<span class="like-hint">Sign in to like</span>`;

      right.innerHTML = `
        <span class="like-count" id="sheet-like-count">${countLabel}</span>
        ${likeBtn}
      `;
    }
  },

  // ── Share sheet — generate link and show copy modal ──────────────────────────
  async shareSheet() {
    if (!this.char) return;
    try {
      const r = await fetch(`/api/share/${this.char.id}`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed');
      const { token } = await r.json();
      const url = `${window.location.origin}/s/${token}`;

      $('#modal-title').textContent = 'Share Character Sheet';
      $('#modal-body').innerHTML = `
        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:1rem">
          Anyone with this link can view this sheet — no account required.
        </p>
        <div class="share-url-row">
          <input type="text" class="share-url-input" id="share-url-input"
            value="${url}" readonly onclick="this.select()" />
          <button class="btn-secondary" onclick="Sheet._copyShareUrl()">Copy</button>
        </div>
        <div id="share-copy-feedback" style="color:var(--gold-mid);font-size:0.82rem;margin-top:0.5rem;min-height:1.2em"></div>
      `;
      const confirmBtn = $('#modal-confirm');
      if (confirmBtn) confirmBtn.style.display = 'none';
      const cancelBtn = document.querySelector('.modal-footer .btn-ghost');
      if (cancelBtn) cancelBtn.textContent = 'Close';
      $('#modal-overlay').style.display = 'flex';
    } catch {
      toast('Failed to generate share link', 'error');
    }
  },

  _copyShareUrl() {
    const input = $('#share-url-input');
    if (!input) return;
    input.select();
    const fb = $('#share-copy-feedback');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(input.value).then(() => {
        if (fb) fb.textContent = '✓ Copied to clipboard!';
      }).catch(() => {
        try { document.execCommand('copy'); if (fb) fb.textContent = '✓ Copied!'; } catch {}
      });
    } else {
      try { document.execCommand('copy'); if (fb) fb.textContent = '✓ Copied!'; } catch {}
    }
  },

  // ── Like toggle ──────────────────────────────────────────────────────────────
  async toggleLike() {
    if (!this.sharedToken) return;
    const btn = $('#btn-like');
    if (btn) btn.disabled = true;
    try {
      const r = await fetch(`/api/share/${this.sharedToken}/like`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed');
      const { likeCount, userLiked } = await r.json();

      const countEl = $('#sheet-like-count');
      if (countEl) countEl.textContent = likeCount === 1 ? '1 like' : `${likeCount} likes`;

      if (btn) {
        btn.className = `like-btn${userLiked ? ' liked' : ''}`;
        btn.innerHTML = `${userLiked ? '❤' : '♡'} ${userLiked ? 'Liked' : 'Like'}`;
        btn.disabled = false;
      }
    } catch {
      toast('Failed to update like', 'error');
      if (btn) btn.disabled = false;
    }
  },

  render(char) {
    this.char = char;
    const content = $('#sheet-content');

    const specialties = char.specialties || {};
    const instruments = (Array.isArray(char.instruments) ? char.instruments : []).join(', ') || '—';

    // All abilities (show all, including 0)
    const allTalents = M20.TALENTS.map(a => this.traitRow(a, (char.talents || {})[a.id], specialties)).join('');
    const allSkills  = M20.SKILLS.map(a => this.traitRow(a, (char.skills || {})[a.id], specialties)).join('');
    const allKnow    = M20.KNOWLEDGES.map(a => this.traitRow(a, (char.knowledges || {})[a.id], specialties)).join('');

    // Backgrounds
    const bgs = Object.entries(char.backgrounds || {})
      .filter(([,v]) => v > 0)
      .map(([k, v]) => {
        const bg = M20.BACKGROUNDS.find(b => b.id === k);
        return bg ? `<div class="sheet-trait-row"><span class="sheet-trait-name">${bgDisplayName(bg, char.affiliation)}</span>${dots(v, 5, 'readonly')}</div>` : '';
      }).join('') || '<p style="color:var(--text-faint);font-size:0.82rem">No backgrounds selected</p>';

    // Merits
    const meritsHTML = Object.entries(char.merits || {}).map(([k, v]) => {
      const name = k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<div class="sheet-trait-row"><span class="sheet-trait-name">${name}</span>${dots(v, 5, 'readonly')}</div>`;
    }).join('');

    // Flaws
    const flawsHTML = Object.entries(char.flaws || {}).map(([k, v]) => {
      const name = k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<div class="sheet-trait-row"><span class="sheet-trait-name">${name}</span>${dots(v, 5, 'readonly')}</div>`;
    }).join('');

    // All spheres (show all 9, mark affinity)
    const allSpheres = M20.SPHERES.map(s => {
      const val  = (char.spheres || {})[s.id] || 0;
      const spec = specialties[s.id];
      const isAff = s.id === char.affinity_sphere;
      return `<div class="sheet-trait-row">
        <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${s.name}${isAff ? ' ✦' : ''}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
        ${dots(val, 5, 'readonly sphere-dots')}
      </div>`;
    }).join('');

    content.innerHTML = `
    <div class="char-sheet">
      <div class="sheet-header">
        <div class="sheet-char-name">${char.name}</div>
        <div class="sheet-field">
          <span class="sheet-field-label">Player</span>
          <span class="sheet-field-value">${char.player || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Chronicle</span>
          <span class="sheet-field-value">${char.chronicle || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Concept</span>
          <span class="sheet-field-value">${char.concept || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Affiliation</span>
          <span class="sheet-field-value">${char.tradition || char.affiliation || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Essence</span>
          <span class="sheet-field-value">${char.essence || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Nature / Demeanor</span>
          <span class="sheet-field-value">${char.nature || '—'} / ${char.demeanor || '—'}</span>
        </div>
      </div>

      <!-- Band 1: ATTRIBUTES -->
      <div class="sheet-band">
        <div class="sheet-band-title">Attributes</div>
        <div class="sheet-cols-3">
          <div class="sheet-group">
            <div class="sheet-group-title">Physical</div>
            ${this.attrRow('Strength',    char.strength,    specialties)}
            ${this.attrRow('Dexterity',   char.dexterity,   specialties)}
            ${this.attrRow('Stamina',     char.stamina,     specialties)}
          </div>
          <div class="sheet-group">
            <div class="sheet-group-title">Social</div>
            ${this.attrRow('Charisma',    char.charisma,    specialties)}
            ${this.attrRow('Manipulation',char.manipulation,specialties)}
            ${this.attrRow('Appearance',  char.appearance,  specialties)}
          </div>
          <div class="sheet-group">
            <div class="sheet-group-title">Mental</div>
            ${this.attrRow('Perception',  char.perception,  specialties)}
            ${this.attrRow('Intelligence',char.intelligence,specialties)}
            ${this.attrRow('Wits',        char.wits,        specialties)}
          </div>
        </div>
      </div>

      <!-- Band 2: ABILITIES -->
      <div class="sheet-band">
        <div class="sheet-band-title">Abilities</div>
        <div class="sheet-cols-3">
          <div class="sheet-group">
            <div class="sheet-group-title">Talents</div>
            ${allTalents}
          </div>
          <div class="sheet-group">
            <div class="sheet-group-title">Skills</div>
            ${allSkills}
          </div>
          <div class="sheet-group">
            <div class="sheet-group-title">Knowledges</div>
            ${allKnow}
          </div>
        </div>
      </div>

      <!-- Band 3: SPHERES -->
      <div class="sheet-band">
        <div class="sheet-band-title">Spheres</div>
        <div class="sheet-cols-3">
          <div class="sheet-group">
            ${M20.SPHERES.filter(s => ['correspondence','entropy','forces'].includes(s.id)).map(s => {
              const val = (char.spheres || {})[s.id] || 0;
              const isAff = s.id === char.affinity_sphere;
              return `<div class="sheet-trait-row">
                <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${isAff ? '✦ ' : ''}${s.name}</span>
                ${dots(val, 5, 'readonly')}
              </div>`;
            }).join('')}
          </div>
          <div class="sheet-group">
            ${M20.SPHERES.filter(s => ['life','matter','mind'].includes(s.id)).map(s => {
              const val = (char.spheres || {})[s.id] || 0;
              const isAff = s.id === char.affinity_sphere;
              return `<div class="sheet-trait-row">
                <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${isAff ? '✦ ' : ''}${s.name}</span>
                ${dots(val, 5, 'readonly')}
              </div>`;
            }).join('')}
          </div>
          <div class="sheet-group">
            ${M20.SPHERES.filter(s => ['prime','spirit','time'].includes(s.id)).map(s => {
              const val = (char.spheres || {})[s.id] || 0;
              const isAff = s.id === char.affinity_sphere;
              return `<div class="sheet-trait-row">
                <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${isAff ? '✦ ' : ''}${s.name}</span>
                ${dots(val, 5, 'readonly')}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Band 4: ADVANTAGES -->
      <div class="sheet-band">
        <div class="sheet-band-title">Advantages</div>
        <div class="sheet-cols-3">
          <div class="sheet-group">
            <div class="sheet-group-title">Backgrounds</div>
            ${bgs}
            ${meritsHTML ? `<div class="sheet-group-title" style="margin-top:0.5rem">Merits</div>${meritsHTML}` : ''}
            ${flawsHTML ? `<div class="sheet-group-title" style="margin-top:0.5rem">Flaws</div>${flawsHTML}` : ''}
            <div class="sheet-group-title" style="margin-top:0.5rem">Magical Focus</div>
            <div class="sheet-focus-row">
              <div class="sheet-focus-item">
                <span class="sheet-focus-label">Paradigm</span>
                <span class="sheet-focus-value">${char.paradigm || '—'}</span>
              </div>
              <div class="sheet-focus-item">
                <span class="sheet-focus-label">Practice</span>
                <span class="sheet-focus-value">${char.practice || '—'}</span>
              </div>
              <div class="sheet-focus-item">
                <span class="sheet-focus-label">Instruments</span>
                <span class="sheet-focus-value">${instruments}</span>
              </div>
            </div>
          </div>
          <div class="sheet-group core-stats-group">
            <div class="sheet-group-title">Core Statistics</div>
            ${this.coreStatBox('Arete', char.arete || 1, 10)}
            ${this.willpowerBox(char.willpower || 5)}
            ${this.qpWheelSVG(char.quintessence || 0, char.paradox || 0)}
          </div>
          <div class="sheet-group">
            ${this.healthTrack()}
          </div>
        </div>
      </div>

      ${char.description || char.notes ? `
      <div class="sheet-footer">
        ${char.description ? `
        <div class="sheet-section">
          <div class="sheet-section-title">Description</div>
          <p style="font-size:0.88rem;color:var(--text-mid);line-height:1.6">${char.description}</p>
        </div>` : ''}
        ${char.notes ? `
        <div class="sheet-section">
          <div class="sheet-section-title">Notes</div>
          <p style="font-size:0.88rem;color:var(--text-mid);line-height:1.6">${char.notes}</p>
        </div>` : ''}
      </div>` : ''}
    </div>`;
  },

  attrRow(name, val = 1, specialties = {}) {
    const id   = name.toLowerCase();
    const spec = specialties[id];
    return `<div class="sheet-trait-row">
      <span class="sheet-trait-name">${name}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
      ${dots(val, 5, 'readonly')}
    </div>`;
  },

  traitRow(trait, val, specialties = {}) {
    const v = val == null ? 0 : val;
    const spec = specialties[trait.id];
    return `<div class="sheet-trait-row">
      <span class="sheet-trait-name">${trait.name}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
      ${dots(v, 5, 'readonly')}
    </div>`;
  },

  coreStatBox(label, val, max) {
    return `<div class="core-stat-box">
      <div class="core-stat-label">${label}</div>
      <div class="dots core-stat-dots readonly" style="justify-content:center;flex-wrap:wrap;gap:3px;max-width:120px;margin:0 auto">
        ${Array.from({length: max}, (_, i) => `<span class="dot ${i < val ? 'filled' : ''}"></span>`).join('')}
      </div>
    </div>`;
  },

  willpowerBox(val) {
    return `<div class="core-stat-box">
      <div class="core-stat-label">Willpower</div>
      <div class="dots core-stat-dots readonly" style="justify-content:center;flex-wrap:nowrap;gap:3px;margin:0 auto 4px">
        ${Array.from({length: 10}, (_, i) => `<span class="dot ${i < val ? 'filled' : ''}"></span>`).join('')}
      </div>
      <div class="wp-spent-row">
        <span class="wp-spent-label">Spent</span>
        ${Array.from({length: 10}, () => `<span class="wp-spent-box"></span>`).join('')}
      </div>
    </div>`;
  },

  // Single combined Quintessence/Paradox wheel with start marker
  qpWheelSVG(q, p) {
    const max = 20, r = 72, dotR = 9, pad = 16;
    const size = (r + dotR + pad) * 2;
    const cx = size / 2, cy = size / 2;
    const startR = (dotR * 1.25).toFixed(1);
    const dotsSVG = Array.from({length: max}, (_, i) => {
      const angle = (i / max) * 2 * Math.PI + Math.PI;
      const x = (cx + r * Math.cos(angle)).toFixed(1);
      const y = (cy + r * Math.sin(angle)).toFixed(1);
      const isStart = i === 0;
      const isQ = i < q;
      const isP = !isQ && p > 0 && i >= max - p;
      let cls = 'wheel-dot';
      if (isStart) cls += ' start';
      if (isQ) cls += ' filled';
      else if (isP) cls += ' paradox';
      return `<circle cx="${x}" cy="${y}" r="${isStart ? startR : dotR}" class="${cls}"/>`;
    }).join('');
    return `<div class="core-stat-box qp-wheel-box">
      <div class="qp-stat-label">
        <span class="qp-label-name">Quintessence</span>
        <span class="qp-label-value">${q}</span>
      </div>
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="wheel-svg">${dotsSVG}</svg>
      <div class="qp-stat-label qp-paradox">
        <span class="qp-label-name">Paradox</span>
        <span class="qp-label-value qp-paradox-value">${p}</span>
      </div>
    </div>`;
  },

  healthTrack() {
    const levels = [
      ['Bruised', ''],
      ['Hurt', '−1'],
      ['Injured', '−1'],
      ['Wounded', '−2'],
      ['Mauled', '−2'],
      ['Crippled', '−5'],
      ['Incapacitated', ''],
    ];
    return `<div class="sheet-section sheet-health-section">
      <div class="sheet-section-title">Health</div>
      <div class="health-track">
        ${levels.map(([name, pen]) => `
        <div class="health-row">
          <span class="health-level-name">${name}</span>
          ${pen ? `<span class="health-penalty">${pen}</span>` : '<span class="health-penalty"></span>'}
          <span class="health-box"></span>
        </div>`).join('')}
      </div>
    </div>`;
  },

  editCharacter() {
    if (this.char) App.editCharacter(this.char.id);
  },

  deleteCharacter() {
    if (this.char) App.confirmDelete(this.char.id, this.char.name);
  },

  exportPDF() {
    if (!this.char) return;
    window.location.href = `/api/export/pdf/${this.char.id}`;
  },

  exportFoundry() {
    if (!this.char) return;
    window.location.href = `/api/export/foundry/${this.char.id}`;
  },
};

/* ═══════════════════════════════════════════════════════════════
   CREATOR — Multi-step character creation wizard
   ═══════════════════════════════════════════════════════════════ */
const Creator = {
  step: 0,
  char: null,   // working character data
  editId: null, // set if editing existing

  STEPS: [
    'Concept & Identity',
    'Attributes',
    'Abilities',
    'Advantages',
    'Focus & Practice',
    'Spheres',
    'Finishing Touches',
  ],

  defaultChar() {
    return {
      name: '', player: '', chronicle: '', concept: '',
      affiliation: 'Traditions', tradition: '', faction: '',
      essence: '', nature: '', demeanor: '',
      // Attributes
      strength: 1, dexterity: 1, stamina: 1,
      charisma: 1, manipulation: 1, appearance: 1,
      perception: 1, intelligence: 1, wits: 1,
      // Abilities
      talents: {}, skills: {}, knowledges: {},
      // Advantages
      backgrounds: {},
      // Merits & Flaws
      merits: {}, flaws: {},
      // Spheres
      spheres: {}, affinity_sphere: '',
      // Stats
      arete: 1, willpower: 5, quintessence: 0, paradox: 0,
      // Focus
      paradigm: '', practice: '', instruments: [],
      // Meta
      freebie_spent: {}, description: '', notes: '',
      attr_priority: ['Physical', 'Social', 'Mental'],
      ability_priority: ['Talents', 'Skills', 'Knowledges'],
      specialties: {},
      custom_ability_names: {},
      customArchetypes: [],
    };
  },

  init() {
    this.step = 0;
    this._lockedBaselines = null;
    this.char = this.defaultChar();
    this.editId = null;
    this.renderStep();
    this.updateSidebar();
    this.updateFreebieDisplay();
  },

  loadCharacter(char) {
    this.step = 0;
    this._lockedBaselines = null;
    this.char = {
      ...this.defaultChar(),
      ...char,
      instruments: Array.isArray(char.instruments) ? char.instruments : [],
      attr_priority: Array.isArray(char.attr_priority) && char.attr_priority.length === 3
        ? char.attr_priority : ['Physical', 'Social', 'Mental'],
      ability_priority: Array.isArray(char.ability_priority) && char.ability_priority.length === 3
        ? char.ability_priority : ['Talents', 'Skills', 'Knowledges'],
    };
    this.editId = char.id;
    if (!this.char.custom_ability_names) this.char.custom_ability_names = {};
    this.renderStep();
    this.updateSidebar();
    this.updateFreebieDisplay();
  },

  renderStep() {
    // Scroll to top of page when switching steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Replace the element with a fresh clone to clear any stacked event listeners
    // from previous renders — otherwise delegated handlers accumulate and fire
    // multiple times, causing toggles to cancel each other out.
    const old = $('#step-content');
    const content = old.cloneNode(false);
    old.parentNode.replaceChild(content, old);
    content.innerHTML = this[`renderStep${this.step}`]();
    this.attachStepListeners();
    this.updateNav();
    this.updateSidebar();
  },

  updateNav() {
    const back = $('#btn-back');
    const next = $('#btn-next');
    back.style.display = this.step > 0 ? 'inline-flex' : 'none';
    next.textContent = this.step === this.STEPS.length - 1 ? 'Save Character ✓' : 'Next →';
  },

  updateSidebar() {
    $$('.step-item').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === this.step);
      el.classList.toggle('completed', s < this.step);
    });
  },

  // ── Freebie point calculation ─────────────────────────────────
  calcFreebieBreakdown() {
    const c = this.char;
    const lines = [];
    const attrCost = this.calcAttrFreebies();
    if (attrCost)  lines.push({ label: 'Attributes',   cost: attrCost });
    const abilCost = this.calcAbilityFreebies();
    if (abilCost)  lines.push({ label: 'Abilities',    cost: abilCost });
    const bgCost = this.calcBgFreebies();
    if (bgCost)    lines.push({ label: 'Backgrounds',  cost: bgCost });
    const sphCost = this.calcSphereFreebies();
    if (sphCost)   lines.push({ label: 'Spheres',      cost: sphCost });
    const areteCost = Math.max(0, (c.arete || 1) - 1) * 4;
    if (areteCost) lines.push({ label: 'Arete',        cost: areteCost });
    const wpCost = Math.max(0, (c.willpower || 5) - 5);
    if (wpCost)    lines.push({ label: 'Willpower',    cost: wpCost });
    const avatarRating = (c.backgrounds || {})['avatar'] || 0;
    const quintCost = Math.ceil(Math.max(0, (c.quintessence || 0) - avatarRating) / 4);
    if (quintCost) lines.push({ label: 'Quintessence', cost: quintCost });
    const meritCost = this.calcMeritCost();
    if (meritCost) lines.push({ label: 'Merits',       cost: meritCost });
    const flawBonus = this.calcFlawBonus();
    if (flawBonus) lines.push({ label: 'Flaws',        cost: -flawBonus });
    Object.entries(c.freebie_spent || {}).forEach(([key, v]) => {
      if (v) lines.push({ label: key, cost: v });
    });
    return lines;
  },

  updateFreebieTooltip() {
    const bdEl = $('#freebie-breakdown');
    if (!bdEl) return;
    const lines = this.calcFreebieBreakdown();
    const total = M20.CREATION.freebiePoints;
    const spent = this.freebieSpent();
    const remaining = total - spent;
    if (lines.length === 0) {
      bdEl.innerHTML = `<div class="fb-tip-empty">No points spent yet</div>
        <div class="fb-tip-total"><span>Remaining</span><span>${remaining} / ${total}</span></div>`;
    } else {
      bdEl.innerHTML = lines.map(l =>
        `<div class="fb-tip-row">
          <span>${l.label}</span>
          <span class="${l.cost < 0 ? 'fb-tip-bonus' : 'fb-tip-cost'}">${l.cost < 0 ? '+' + (-l.cost) : '\u2212' + l.cost}</span>
        </div>`
      ).join('') +
        `<div class="fb-tip-total"><span>Remaining</span><span class="${remaining < 0 ? 'fb-tip-over' : ''}">${remaining} / ${total}</span></div>`;
    }
  },

  calcFreebies() {
    const c = this.char;
    // Merits cost freebies; flaws grant them (max +7)
    const meritCost = this.calcMeritCost();
    const flawBonus = this.calcFlawBonus();
    let total = this.calcAttrFreebies() + this.calcAbilityFreebies() + this.calcBgFreebies() + this.calcSphereFreebies() + meritCost - flawBonus;
    total += Math.max(0, (c.arete || 1) - 1) * 4;
    total += Math.max(0, (c.willpower || 5) - 5) * 1;
    const avatarRating = (c.backgrounds || {})['avatar'] || 0;
    total += Math.ceil(Math.max(0, (c.quintessence || 0) - avatarRating) / 4);
    // Manual entries
    Object.values(c.freebie_spent || {}).forEach(v => { total += v; });
    return { total };
  },

  updateFreebieDisplay() {
    const total     = this.freebieSpent();
    const remaining = M20.CREATION.freebiePoints - total;
    const el = $('#freebie-display');
    if (el) {
      el.textContent = remaining;
      el.style.color = remaining < 0 ? 'var(--crimson)' : 'var(--gold-bright)';
    }
    this.updateFreebieTooltip();
    // On step 6, use the richer bank update
    if (this.step === 6) this.updateFreebieBank();
  },

  freebieSpent() {
    return this.calcFreebies().total;
  },

  freebiesRemaining() {
    return M20.CREATION.freebiePoints - this.calcFreebies().total;
  },

  canSpendFreebie(amount) {
    return this.freebiesRemaining() >= amount;
  },

  prevStep() {
    if (this.step > 0) {
      if (this.step === 6) this._lockedBaselines = null; // re-lock next time step 6 is entered
      this.step--;
      this.renderStep();
    }
  },

  nextStep() {
    const err = this.validateStep();
    if (err) { toast(err, 'error'); return; }
    if (this.step < this.STEPS.length - 1) {
      this.step++;
      if (this.step === 6) this._lockBaselines(); // lock creation baselines on entering step 6
      this.renderStep();
      // Push a history entry so the browser back button steps back through creation
      const stepState = { page: 'creator', step: this.step };
      if (this.editId) stepState.charId = this.editId;
      history.pushState(stepState, '', location.pathname);
    } else {
      this.saveCharacter();
    }
  },

  // Compute and store per-trait creation baselines so step 6 dot coloring stays stable
  // even as freebie dots are added. Must be called before renderStep6().
  _lockBaselines() {
    const c = this.char;
    const attrPri    = c.attr_priority    || ['Physical','Social','Mental'];
    const abilityPri = c.ability_priority || ['Talents','Skills','Knowledges'];
    const attrAllocs = { Physical:[7,5,3][attrPri.indexOf('Physical')]??0, Social:[7,5,3][attrPri.indexOf('Social')]??0, Mental:[7,5,3][attrPri.indexOf('Mental')]??0 };
    const abilAllocs = { Talents:[13,9,5][abilityPri.indexOf('Talents')]??0, Skills:[13,9,5][abilityPri.indexOf('Skills')]??0, Knowledges:[13,9,5][abilityPri.indexOf('Knowledges')]??0 };

    const greedy = (ids, getValue, pool, startBaseline) => {
      const baselines = {};
      ids.forEach(id => { baselines[id] = startBaseline; });
      const sorted = [...ids].sort((a,b) => getValue(a) - getValue(b));
      let rem = pool;
      for (const id of sorted) {
        if (rem <= 0) break;
        const above = Math.max(0, getValue(id) - startBaseline);
        const alloc = Math.min(rem, above);
        baselines[id] = startBaseline + alloc;
        rem -= alloc;
      }
      return baselines;
    };

    const attrGroups = { Physical:['strength','dexterity','stamina'], Social:['charisma','manipulation','appearance'], Mental:['perception','intelligence','wits'] };
    const attrs = {};
    ['Physical','Social','Mental'].forEach(cat => Object.assign(attrs, greedy(attrGroups[cat], id => c[id]||1, attrAllocs[cat], 1)));

    const abilGroups = {
      Talents:    { key:'talents',    data:M20.TALENTS,    sec:M20.SECONDARY_TALENTS },
      Skills:     { key:'skills',     data:M20.SKILLS,     sec:M20.SECONDARY_SKILLS },
      Knowledges: { key:'knowledges', data:M20.KNOWLEDGES, sec:M20.SECONDARY_KNOWLEDGES },
    };
    const abilities = {};
    ['Talents','Skills','Knowledges'].forEach(cat => {
      const {key, data, sec} = abilGroups[cat];
      const secIds  = sec.map(a=>a.id).filter(id => c[key][id] !== undefined);
      const custIds = Object.keys(c.custom_ability_names || {}).filter(id => c[key][id] !== undefined);
      const allIds  = [...data.map(a=>a.id), ...secIds, ...custIds];
      Object.assign(abilities, greedy(allIds, id => c[key][id]||0, abilAllocs[cat], 0));
    });

    const bgAff = c.affiliation || 'Traditions';
    const filteredBgs = filteredBackgrounds(bgAff);
    // Custom greedy for backgrounds: double-cost backgrounds use 2 creation dots per rating
    const backgrounds = {};
    filteredBgs.forEach(bg => { backgrounds[bg.id] = 0; });
    const sortedBgs = [...filteredBgs].sort((a, b) => (c.backgrounds[a.id]||0) - (c.backgrounds[b.id]||0));
    let bgRem = M20.CREATION.backgroundDots;
    for (const bg of sortedBgs) {
      if (bgRem <= 0) break;
      const val = c.backgrounds[bg.id] || 0;
      if (val === 0) continue;
      const costPer = bg.doubleCost ? 2 : 1;
      const allocDots = Math.min(Math.floor(bgRem / costPer), val);
      backgrounds[bg.id] = allocDots;
      bgRem -= allocDots * costPer;
    }

    const spheres = greedy(M20.SPHERES.map(s=>s.id), id => c.spheres[id]||0, M20.CREATION.sphereDots, 0);

    this._lockedBaselines = { attrs, abilities, backgrounds, spheres };
  },

  validateStep() {
    if (this.step === 0 && !this.char.name.trim()) return 'Character name is required.';
    if (this.step === 0 && !this.char.tradition) return 'Please choose a tradition or affiliation.';
    if (this.step === 0 && !this.char.essence) return 'Please choose an Essence.';
    return null;
  },

  async saveDraft() {
    if (!this.char.name.trim()) { toast('Enter a name first.', 'error'); return; }
    try {
      if (this.editId) {
        await API.update(this.editId, this.char);
        toast('Draft saved.');
      } else {
        const created = await API.create(this.char);
        this.editId = created.id;
        App.currentCharId = created.id;
        toast('Draft saved as new character.');
      }
    } catch { toast('Save failed.', 'error'); }
  },

  async saveCharacter() {
    if (this.freebieSpent() > M20.CREATION.freebiePoints) {
      if (!confirm(`You've spent more than ${M20.CREATION.freebiePoints} freebie points. Save anyway?`)) return;
    }
    try {
      let char;
      if (this.editId) {
        char = await API.update(this.editId, this.char);
        toast('Character updated.');
      } else {
        char = await API.create(this.char);
        toast('Character created. The Awakening is complete.');
      }
      App.currentCharId = char.id;
      Sheet.sharedToken = null;
      Sheet.render(char);
      Sheet.renderToolbar('owner');
      App.showPage('sheet');
    } catch { toast('Failed to save character.', 'error'); }
  },

  /* ─── Helpers ──────────────────────────────────────────────── */
  stepHeader(title, quote, instructions) {
    return `
    <div class="step-header">
      <h2 class="step-title">${title}</h2>
      <p class="step-quote">${quote}</p>
      ${instructions ? `<div class="step-instructions">${instructions}</div>` : ''}
    </div>`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 0 — Concept & Identity (p. 254–260)
     ══════════════════════════════════════════════════════════════ */
  renderStep0() {
    const c = this.char;
    const affiliationHtml = this.renderAffiliationSelector();
    const essenceHtml = M20.ESSENCES.map(e => `
      <div class="essence-card ${c.essence === e.name ? 'selected' : ''}" data-essence="${e.name}">
        <div class="essence-name">${e.name}</div>
        <div class="essence-desc">${e.description}</div>
        <div class="page-ref" style="margin-top:0.5rem">p. ${e.page}</div>
      </div>`).join('');

    if (!c.customArchetypes) c.customArchetypes = [];

    const allArchetypes = [
      ...M20.ARCHETYPES,
      ...c.customArchetypes.map(ca => ({ ...ca, isCustom: true })),
    ];

    const archView = UiPrefs.get('archetypeView', 'card');

    const archetypeCards = allArchetypes.map(a => {
      const isNature   = c.nature   === a.name;
      const isDemeanor = c.demeanor === a.name;
      const deleteBtn  = a.isCustom
        ? `<button class="archetype-delete-btn" data-archetype="${a.name}" title="Remove custom archetype">\u00d7</button>`
        : '';
      if (archView === 'list') {
        const classes = ['archetype-list-row', isNature ? 'nd-nature' : '', isDemeanor ? 'nd-demeanor' : ''].filter(Boolean).join(' ');
        const tipParts = [a.description, a.willpower ? `Willpower: ${a.willpower}` : ''].filter(Boolean);
        const tipAttr  = tipParts.length ? ` data-tip="${tipParts.join(' \u00b7 ').replace(/"/g, '&quot;')}"` : '';
        return `
          <div class="${classes}" data-archetype="${a.name}">
            <div class="archetype-nd-row" style="margin-bottom:0;flex-shrink:0">
              <button class="archetype-nd-btn nd-n${isNature ? ' nd-active-n' : ''}" data-archetype="${a.name}" data-role="nature" title="Set as Nature">N</button>
              <button class="archetype-nd-btn nd-d${isDemeanor ? ' nd-active-d' : ''}" data-archetype="${a.name}" data-role="demeanor" title="Set as Demeanor">D</button>
              ${deleteBtn}
            </div>
            <span class="archetype-list-name">${a.name}${a.isCustom ? ' <span class="custom-badge">Custom</span>' : ''}</span>
            ${tipParts.length ? `<span class="info-tip"${tipAttr}>?</span>` : ''}
          </div>`;
      }
      const classes = ['archetype-card', isNature ? 'nd-nature' : '', isDemeanor ? 'nd-demeanor' : ''].filter(Boolean).join(' ');
      return `
        <div class="${classes}" data-archetype="${a.name}">
          <div class="archetype-nd-row">
            <button class="archetype-nd-btn nd-n${isNature ? ' nd-active-n' : ''}" data-archetype="${a.name}" data-role="nature" title="Set as Nature">N</button>
            <button class="archetype-nd-btn nd-d${isDemeanor ? ' nd-active-d' : ''}" data-archetype="${a.name}" data-role="demeanor" title="Set as Demeanor">D</button>
            ${deleteBtn}
          </div>
          <div class="archetype-name">${a.name}${a.isCustom ? ' <span class="custom-badge">Custom</span>' : ''}</div>
          ${a.willpower ? `<div class="archetype-wp">${a.willpower}</div>` : ''}
          ${a.description ? `<div class="archetype-desc">${a.description}</div>` : ''}
        </div>`;
    }).join('');
    const conceptOptions = ['', ...M20.CONCEPTS].map(con =>
      `<option value="${con}" ${c.concept === con ? 'selected' : ''}>${con || '— choose or type below —'}</option>`).join('');

    return `
    ${this.stepHeader('Step One: Concept & Identity',
      M20.QUOTES.step1,
      `Choose your <strong>Concept</strong>, <strong>Affiliation</strong>, <strong>Essence</strong>, and <strong>Archetypes</strong>. These define who your mage <em>is</em> before they ever work a single Effect. <span class="page-ref">M20 p. 254–260</span>`)}

    <div class="form-grid">
      <div class="form-group">
        <label>Character Name <span class="ref">p. 254</span></label>
        <input type="text" id="f-name" value="${c.name}" placeholder="The name your mage is known by" />
      </div>
      <div class="form-group">
        <label>Player Name</label>
        <input type="text" id="f-player" value="${c.player}" placeholder="Your name" />
      </div>
      <div class="form-group">
        <label>Chronicle</label>
        <input type="text" id="f-chronicle" value="${c.chronicle}" placeholder="Story name" />
      </div>
      <div class="form-group">
        <label>Concept <span class="ref">p. 254</span>
          <span class="info-tip" data-tip="A brief phrase that captures who your character is at their core — e.g. 'Disillusioned Corporate Spy' or 'Wandering Herbalist.'">?</span>
        </label>
        <select id="f-concept-select">${conceptOptions}</select>
        <input type="text" id="f-concept" value="${c.concept}" placeholder="Or type your own concept..." style="margin-top:0.35rem" />
      </div>
    </div>

    <div class="ornate-divider">— Affiliation —</div>

    ${affiliationHtml}

    <div class="ornate-divider">— Essence —</div>
    <p class="page-ref" style="margin-bottom:0.75rem">Your Avatar's inner nature. M20 p. 255</p>
    <div class="essence-grid" id="essence-grid">
      ${essenceHtml}
    </div>

    <div class="ornate-divider">— Archetypes —</div>
    <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:0.6rem">
      <strong style="color:var(--text-mid)">Nature</strong> is your true self — fulfilling it is how you regain Willpower.
      <strong style="color:var(--text-mid)">Demeanor</strong> is the face you show the world.
      <span class="page-ref">p. 267</span>
    </p>
    <div class="archetype-nd-legend">
      <span id="archetype-nd-legend-nature"><span class="nd-legend-n">N</span> Nature${c.nature ? ` \u2014 <em>${c.nature}</em>` : ''}</span>
      <span id="archetype-nd-legend-demeanor"><span class="nd-legend-d">D</span> Demeanor${c.demeanor ? ` \u2014 <em>${c.demeanor}</em>` : ''}</span>
      <span style="margin-left:auto">
        <span class="view-toggle">
          <span class="view-toggle-label">View:</span>
          <button class="view-toggle-btn${archView === 'card' ? ' vt-active' : ''}" data-pref="archetypeView" data-val="card" title="Card view">⊞ Cards</button>
          <button class="view-toggle-btn${archView === 'list' ? ' vt-active' : ''}" data-pref="archetypeView" data-val="list" title="List view">☰ List</button>
        </span>
      </span>
    </div>
    <div class="${archView === 'list' ? 'archetype-list' : 'archetype-grid'}" id="archetype-grid">
      ${archetypeCards}
    </div>
    <div id="nature-wp" style="font-size:0.78rem;color:var(--purple-mid);margin-bottom:0.75rem;font-style:italic"></div>

    <div class="custom-archetype-adder">
      <button class="btn-secondary" id="btn-show-custom-arch">＋ Create Custom Archetype</button>
      <div id="custom-archetype-form" style="display:none">
        <div class="custom-arch-fields">
          <input type="text" id="f-custom-arch-name" placeholder="Archetype name\u2026" />
          <input type="text" id="f-custom-arch-wp" placeholder="Willpower condition (optional)\u2026" />
          <textarea id="f-custom-arch-desc" placeholder="Description (optional)\u2026" rows="2"></textarea>
        </div>
        <div class="custom-arch-actions">
          <button class="btn-primary" id="btn-custom-arch-submit">Add to Grid</button>
          <button class="btn-secondary" id="btn-custom-arch-cancel">Cancel</button>
        </div>
      </div>
    </div>`;
  },

  renderAffiliationSelector() {
    const c = this.char;
    const tabs = [
      { id: 'Traditions', label: 'The Traditions' },
      { id: 'Technocracy', label: 'Technocratic Union' },
      { id: 'Disparates', label: 'Disparate Crafts' },
    ];

    const tabHtml = tabs.map(t => `
      <button class="affil-tab ${c.affiliation === t.id ? 'active' : ''}" data-affil="${t.id}">${t.label}</button>`).join('');

    const renderGroup = (list, type) => list.map(t => `
      <div class="tradition-card ${c.tradition === t.name ? 'selected' : ''}" data-tradition="${t.name}" data-type="${type}">
        <div class="trad-name">${t.shortName || t.name}</div>
        ${t.affinitySpheres ? `<div class="trad-spheres">Affinity: ${t.affinitySpheres.join(' / ')}</div>` : ''}
        <div class="trad-desc">${t.description}</div>
        ${t.page ? `<div class="page-ref" style="margin-top:0.35rem">p. ${t.page}</div>` : ''}
      </div>`).join('');

    return `
    <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:0.75rem">Choose your mage's affiliation — the Traditions, the Technocratic Union, or the Disparate Crafts. <span class="page-ref">p. 254</span></p>
    <div class="affiliation-tabs">${tabHtml}</div>
    <div id="tradition-panel-Traditions" class="tradition-grid" style="${c.affiliation !== 'Traditions' ? 'display:none' : ''}">
      ${renderGroup(M20.TRADITIONS, 'Traditions')}
    </div>
    <div id="tradition-panel-Technocracy" class="tradition-grid" style="${c.affiliation !== 'Technocracy' ? 'display:none' : ''}">
      ${renderGroup(M20.TECHNOCRACY, 'Technocracy')}
    </div>
    <div id="tradition-panel-Disparates" class="tradition-grid" style="${c.affiliation !== 'Disparates' ? 'display:none' : ''}">
      ${renderGroup(M20.DISPARATES, 'Disparates')}
    </div>`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 1 — Attributes (p. 258–259)
     ══════════════════════════════════════════════════════════════ */
  renderStep1() {
    const c = this.char;
    const pri = c.attr_priority;

    const priorityHtml = this.renderPrioritySorter(
      ['Physical', 'Social', 'Mental'],
      pri,
      'attr_priority',
      { primary: 7, secondary: 5, tertiary: 3 }
    );

    const blocks = ['Physical', 'Social', 'Mental'].map(cat => {
      const attrs = M20.ATTRIBUTES[cat.toLowerCase()];
      const rank  = pri.indexOf(cat);
      const totalExtra = [7, 5, 3][rank] || 0;
      const usedExtra  = attrs.reduce((sum, a) => sum + Math.max(0, (c[a.id] || 1) - 1), 0);
      const remaining  = totalExtra - usedExtra;
      const overBy     = Math.max(0, -remaining);
      const displayRem = Math.max(0, remaining);
      return `
      <div class="attr-block">
        <div class="attr-block-header">
          <span class="attr-block-title">${cat} Attributes</span>
          <span class="attr-block-points">
            <span class="pts">${displayRem}</span> / ${totalExtra} pts remaining
            ${overBy > 0 ? `<span class="pts-freebie">+${overBy} via freebies</span>` : ''}
          </span>
        </div>
        ${attrs.map(a => {
          const val = c[a.id] || 1;
          const levelDesc = a.levels ? a.levels[val - 1] : a.description;
          return `
        <div class="attr-row" data-attr-id="${a.id}">
          <div class="attr-row-main">
            <div class="attr-info">
              <div class="attr-name">${a.name}
                <span class="info-tip" data-tip="${a.description}">?</span>
              </div>
              <div class="attr-desc">${levelDesc}</div>
            </div>
            ${dotsClickable(val, 5, null, '')}
          </div>
          <div class="specialty-row" ${val < 4 ? 'style="display:none"' : ''}>
            <input class="specialty-input" list="spec-${a.id}" data-specialty-for="${a.id}"
              placeholder="Specialty\u2026" value="${c.specialties[a.id] || ''}">
            <datalist id="spec-${a.id}">${(a.specialties || []).map(s => `<option value="${s}">`).join('')}</datalist>
          </div>
        </div>`;
        }).join('')}
      </div>`;
    }).join('');

    return `
    ${this.stepHeader('Step Two: Attributes',
      M20.QUOTES.step2,
      `Rank your three Attribute categories as <strong>Primary (7 pts)</strong>, <strong>Secondary (5 pts)</strong>, and <strong>Tertiary (3 pts)</strong>. All attributes begin at 1. Distribute the bonus points within each category. Maximum 5 dots per attribute. <span class="page-ref">M20 p. 258</span>`)}
    ${priorityHtml}
    ${blocks}`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 2 — Abilities (p. 259)
     ══════════════════════════════════════════════════════════════ */
  renderStep2() {
    const c = this.char;
    const pri = c.ability_priority;
    const abilityMap  = { Talents: 'talents',    Skills: 'skills',    Knowledges: 'knowledges' };
    const abilityData = { Talents: M20.TALENTS,  Skills: M20.SKILLS,  Knowledges: M20.KNOWLEDGES };
    const secondaryData = {
      Talents:    M20.SECONDARY_TALENTS,
      Skills:     M20.SECONDARY_SKILLS,
      Knowledges: M20.SECONDARY_KNOWLEDGES,
    };

    const priorityHtml = this.renderPrioritySorter(
      ['Talents', 'Skills', 'Knowledges'],
      pri,
      'ability_priority',
      { primary: 13, secondary: 9, tertiary: 5 }
    );

    const abilityRow = (a, key, isSecondary = false, isCustom = false) => {
      const val       = c[key][a.id] || 0;
      const isGeneral = GENERAL_ABILITY_IDS.has(a.id);
      const specThreshold = isGeneral ? 1 : 4;
      const levelDesc = (val > 0 && a.levels) ? a.levels[val - 1]
                      : (val > 0 ? a.description : '');
      const wscLabel  = isGeneral
        ? `<div class="wsc-label">Free Specialty <span class="wsc-rule">Well-Skilled Craftsman · p. 279</span></div>`
        : '';
      const specRow = `<div class="specialty-row" ${val < specThreshold ? 'style="display:none"' : ''}>
            ${wscLabel}
            <input class="specialty-input" list="spec-${a.id}" data-specialty-for="${a.id}"
              placeholder="Specialty\u2026" value="${c.specialties[a.id] || ''}">
            <datalist id="spec-${a.id}">${(a.specialties || []).map(s => `<option value="${s}">`).join('')}</datalist>
          </div>`;
      const removeBtn = (isSecondary || isCustom)
        ? `<button class="btn-remove-secondary${isCustom ? ' btn-remove-custom' : ''}" data-ability-id="${a.id}" data-category="${key}" title="Remove ${a.name}">\u00d7</button>`
        : '';
      return `
        <div class="attr-row${isSecondary ? ' secondary-ability-row' : ''}" data-ability="${a.id}" data-category="${key}">
          <div class="attr-row-main">
            <div class="attr-info">
              <div class="attr-name">${a.name}
                ${isSecondary ? '<span class="secondary-badge">Secondary</span>' : ''}
                <span class="info-tip" data-tip="${a.description}">?</span>
              </div>
              <div class="attr-desc">${levelDesc}</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.4rem">
              ${dotsClickable(val, 3, null, '')}
              ${removeBtn}
            </div>
          </div>
          ${specRow}
        </div>`;
    };

    const blocks = ['Talents', 'Skills', 'Knowledges'].map(cat => {
      const key     = abilityMap[cat];
      const data    = abilityData[cat];
      const secAll  = secondaryData[cat];
      // Secondary abilities already added: any whose ID is present in c[key]
      const secAdded     = secAll.filter(a => c[key][a.id] !== undefined);
      const secAvailable = secAll.filter(a => c[key][a.id] === undefined);

      const rank      = pri.indexOf(cat);
      const total     = [13, 9, 5][rank] || 0;
      // Primary + secondary + custom abilities all draw from the same creation pool
      const primaryUsed = data.reduce((sum, a) => sum + (c[key][a.id] || 0), 0);
      const secUsed     = secAll.filter(a => c[key][a.id] !== undefined)
                                .reduce((sum, a) => sum + (c[key][a.id] || 0), 0);
      const custIds     = Object.keys(c.custom_ability_names || {}).filter(id => c[key][id] !== undefined);
      const custUsed    = custIds.reduce((sum, id) => sum + (c[key][id] || 0), 0);
      const used        = primaryUsed + secUsed + custUsed;
      const remaining   = total - used;
      const overBy      = Math.max(0, -remaining);
      const displayRem  = Math.max(0, remaining);

      const adderHtml = `
        ${secAvailable.length > 0 ? `
        <div class="secondary-ability-adder">
          <select class="secondary-add-select" data-category="${key}">
            <option value="">\uff0b Add Secondary Ability\u2026</option>
            ${secAvailable.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
          </select>
        </div>` : ''}
        <div class="secondary-ability-adder custom-ability-adder">
          <input class="custom-ability-input" type="text" placeholder="\u270e Custom ability name\u2026" data-category="${key}" maxlength="40" />
          <button class="btn-add-custom" data-category="${key}">\uff0b Add</button>
        </div>`;

      return `
      <div class="attr-block">
        <div class="attr-block-header">
          <span class="attr-block-title">${cat}</span>
          <span class="attr-block-points">
            <span class="pts">${displayRem}</span> / ${total} pts · max 3 per ability
            ${overBy > 0 ? `<span class="pts-freebie">+${overBy} via freebies</span>` : ''}
          </span>
        </div>
        ${data.map(a => abilityRow(a, key, false)).join('')}
        ${secAdded.map(a => abilityRow(a, key, true)).join('')}
        ${custIds.map(id => {
          const name = (c.custom_ability_names || {})[id] || id;
          return abilityRow({ id, name, levels: null, specialties: [], description: 'Custom ability' }, key, true, true);
        }).join('')}
        ${adderHtml}
      </div>`;
    }).join('');

    return `
    ${this.stepHeader('Step Three: Abilities',
      M20.QUOTES.step3,
      `Rank Talents, Skills, and Knowledges as <strong>Primary (13 pts)</strong>, <strong>Secondary (9 pts)</strong>, and <strong>Tertiary (5 pts)</strong>. Maximum <strong>3 dots</strong> in any Ability at character creation. Secondary Abilities are optional and cost <strong>3 freebie pts/dot</strong> — add them below each group. <span class="page-ref">M20 p. 259, 275</span>`)}
    ${priorityHtml}
    ${blocks}`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 3 — Advantages / Backgrounds (p. 259, 301–328)
     ══════════════════════════════════════════════════════════════ */
  renderStep3() {
    const c = this.char;
    const aff = c.affiliation || 'Traditions';
    const totalDots = M20.CREATION.backgroundDots;
    const usedDots = filteredBackgrounds(aff).reduce((s, bg) => s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1), 0);
    const remaining = totalDots - usedDots;
    const bgOverBy = Math.max(0, -remaining);
    const bgDisplayRem = Math.max(0, remaining);
    const bgRows = filteredBackgrounds(aff).map(bg => {
      const val = c.backgrounds[bg.id] || 0;
      const dispName = bgDisplayName(bg, aff);
      const bgMax = bg.max || 5;
      const levelDesc = bg.levels && val > 0 ? bg.levels[val - 1] : bg.description;
      return `
      <div class="attr-row" data-bg="${bg.id}" data-bg-max="${bgMax}">
        <div class="attr-info">
          <div class="attr-name">${dispName}
            ${bg.doubleCost ? '<span style="font-size:0.6rem;color:var(--crimson);margin-left:0.3rem">[2\u00d7 cost]</span>' : ''}
            <span class="info-tip" data-tip="${bg.description}${bg.note ? ' (' + bg.note + ')' : ''}">?</span>
          </div>
          <div class="attr-desc">${levelDesc}</div>
          ${bg.page ? `<div class="page-ref">p. ${bg.page}</div>` : ''}
        </div>
        ${dotsClickable(val, bgMax, null, '')}
      </div>`;
    }).join('');

    return `
    ${this.stepHeader('Step Four: Advantages — Backgrounds',
      M20.QUOTES.step4,
      `Distribute <strong>7 dots</strong> among the Backgrounds below. Each dot represents one level of a background. Backgrounds marked <em>[2× cost]</em> cost two dots per rating during character creation. <span class="page-ref">M20 p. 259, 301–328</span>`)}

    <div class="attr-block">
      <div class="attr-block-header">
        <span class="attr-block-title">Backgrounds <span class="page-ref">p. 301</span></span>
        <span class="attr-block-points">
          <span class="pts" id="bg-remaining">${bgDisplayRem}</span> / ${totalDots} pts remaining
          ${bgOverBy > 0 ? `<span class="pts-freebie" id="bg-freebie-note">+${bgOverBy} via freebies</span>` : '<span class="pts-freebie" id="bg-freebie-note" style="display:none">+0 via freebies</span>'}
        </span>
      </div>
      <div id="bg-rows">${bgRows}</div>
    </div>

    <div style="margin-top:1rem;padding:0.8rem;background:var(--bg-raised);border-radius:var(--radius-md);border:1px solid var(--border-dim)">
      <p style="font-size:0.82rem;color:var(--text-dim)">
        <strong style="color:var(--gold-dim)">Note on ${aff === 'Technocracy' ? 'Genius' : 'Avatar'}:</strong>
        Your ${aff === 'Technocracy' ? 'Genius' : 'Avatar'} rating determines your starting Quintessence.
        This will be set automatically in the final step. <span class="page-ref">p. 303</span>
      </p>
    </div>`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 4 — Focus & Practice (p. 259)
     ══════════════════════════════════════════════════════════════ */
  renderStep4() {
    const c = this.char;
    const trad = [...M20.TRADITIONS, ...M20.TECHNOCRACY, ...M20.DISPARATES]
      .find(t => t.name === c.tradition);
    const paradigmHint = trad?.paradigm || '';

    const selectedInstruments = Array.isArray(c.instruments) ? c.instruments : [];
    const builtinSet = new Set(M20.INSTRUMENTS);
    const customInstruments = selectedInstruments.filter(i => !builtinSet.has(i));

    const builtinRows = M20.INSTRUMENTS.map(inst => {
      const checked = selectedInstruments.includes(inst);
      const safeId  = inst.replace(/[^a-zA-Z0-9]/g, '_');
      return `<label class="instrument-item ${checked ? 'checked' : ''}" for="inst-${safeId}">
        <input type="checkbox" id="inst-${safeId}" value="${inst}" ${checked ? 'checked' : ''} />
        ${inst}
      </label>`;
    }).join('');

    const customRows = customInstruments.map(inst => {
      const safeId = 'custom_' + inst.replace(/[^a-zA-Z0-9]/g, '_');
      return `<label class="instrument-item instrument-item-custom checked" for="inst-${safeId}">
        <input type="checkbox" id="inst-${safeId}" value="${inst}" checked data-custom="true" />
        ${inst}
        <button class="instrument-tag-remove" data-instrument="${inst.replace(/"/g, '&quot;')}" title="Remove">\u00d7</button>
      </label>`;
    }).join('');

    const instrumentRows = builtinRows + customRows;

    return `
    ${this.stepHeader('Step Five: Focus & Practice',
      M20.QUOTES.step5,
      `Define your mage's <strong>Paradigm</strong> (what they believe about the nature of reality), <strong>Practice</strong> (how they work their magic), and <strong>Instruments</strong> (the tools and foci they use). <span class="page-ref">M20 p. 259</span>`)}

    <div class="form-group" style="margin-bottom:1.2rem">
      <label>Paradigm — "What do you believe reality is?" <span class="ref">p. 259</span></label>
      ${trad ? `<div style="font-size:0.78rem;color:var(--purple-dim);font-style:italic;margin-bottom:0.4rem">${trad.name} paradigm: "${paradigmHint}"</div>` : ''}
      <textarea id="f-paradigm" rows="3" placeholder="Reality is... (describe your mage's core belief about the nature of existence and magic)">${c.paradigm}</textarea>
    </div>

    <div class="form-group" style="margin-bottom:1.5rem">
      <label>Practice — "How do you work your magic?" <span class="ref">p. 259</span></label>
      <input type="text" id="f-practice" value="${c.practice}" placeholder="e.g. Ceremonial Magic, Scientific Method, Shamanic Journeywork, Martial Discipline..." />
    </div>

    <div style="margin-bottom:0.6rem">
      <label>Instruments — Tools &amp; Foci <span class="ref">p. 259</span></label>
      <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:0.75rem">
        Choose the instruments your mage uses to work magic. Most mages use roughly 7. These are narrative tools — they describe <em>how</em> you work Effects, not hard mechanical limits.
      </p>
    </div>
    <div class="instrument-list">${instrumentRows}</div>
    <div class="instrument-custom-adder">
      <input type="text" id="f-custom-instrument" placeholder="Add a custom instrument\u2026" />
      <button class="btn-secondary" id="btn-add-instrument">＋ Add</button>
    </div>`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 5 — Spheres (p. 259, 512–527)
     ══════════════════════════════════════════════════════════════ */
  renderStep5() {
    const c = this.char;

    // Determine affinity sphere options from tradition / affiliation
    const isDisparate = c.affiliation === 'Disparates';
    const trad = [...M20.TRADITIONS, ...M20.TECHNOCRACY].find(t => t.name === c.tradition);
    const affinitySpheres = isDisparate
      ? M20.SPHERES.map(s => s.name)   // Disparates may choose any sphere
      : (trad?.affinitySpheres || []);

    // Auto-select affinity sphere if tradition has exactly one option and none set yet
    let selectedAffinity = c.affinity_sphere;
    if (!selectedAffinity && affinitySpheres.length === 1) {
      selectedAffinity = affinitySpheres[0];
      c.affinity_sphere = selectedAffinity;
    }

    const totalDots = M20.CREATION.sphereDots;
    const usedDots  = Object.values(c.spheres).reduce((s, v) => s + v, 0);
    const remaining = totalDots - usedDots;
    const sphOverBy = Math.max(0, -remaining);
    const sphDisplayRem = Math.max(0, remaining);

    // Affinity sphere selector for multiple options (includes Disparates — all spheres)
    let affinitySelectHtml = '';
    if (affinitySpheres.length > 1) {
      const opts = affinitySpheres.map(s => `<option value="${s}" ${selectedAffinity === s ? 'selected' : ''}>${s}</option>`).join('');
      const hint = isDisparate
        ? 'As a Disparate, you may choose any Sphere as your Affinity Sphere.'
        : 'Your Affinity Sphere receives its first dot free. It costs 7 XP per dot (vs. 8 for other spheres).';
      affinitySelectHtml = `
      <div class="form-group" style="margin-bottom:1rem">
        <label>Choose Affinity Sphere <span class="ref">p. 259</span></label>
        <select id="affinity-select">
          <option value="">— Select Affinity Sphere —</option>${opts}
        </select>
        <p style="font-size:0.78rem;color:var(--text-dim);margin-top:0.3rem">${hint}</p>
      </div>`;
    }

    const sphereCards = M20.SPHERES.map(sphere => {
      const val = c.spheres[sphere.id] || 0;
      const isAffinity = !!selectedAffinity && (
        sphere.name === selectedAffinity ||
        (sphere.altName && sphere.altName.startsWith(selectedAffinity))
      );
      const rankName = val > 0 ? (sphere.ranks[val - 1]?.name || '') : 'Unlearned';

      return `
      <div class="sphere-card ${isAffinity ? 'affinity' : ''}" data-sphere="${sphere.id}">
        <div class="sphere-card-header">
          <span class="sphere-name">${sphere.name}</span>
          ${isAffinity ? '<span class="sphere-affinity-badge">Affinity ✦</span>' : ''}
        </div>
        ${sphere.altName ? `<div style="font-size:0.62rem;color:var(--text-faint);margin-bottom:0.3rem">${sphere.altName}</div>` : ''}
        <div class="sphere-rank-name" id="sphere-rank-${sphere.id}">${val > 0 ? rankName : '<em>Unlearned</em>'}</div>
        <div style="margin:0.5rem 0">${dotsClickable(val, 3, null, 'sphere-dots')}</div>
        <div class="specialty-row" style="display:none">
          <input class="specialty-input" list="spec-${sphere.id}" data-specialty-for="${sphere.id}"
            placeholder="Specialty\u2026" value="${c.specialties[sphere.id] || ''}">
          <datalist id="spec-${sphere.id}">${(sphere.specialties || []).map(s => `<option value="${s}">`).join('')}</datalist>
        </div>
        <div class="page-ref" style="margin-top:0.25rem">p. ${sphere.page}</div>
      </div>`;
    }).join('');

    return `
    ${this.stepHeader('Step Six: Spheres',
      M20.QUOTES.step6,
      `Distribute <strong>${totalDots} dots</strong> among the Spheres. Your <strong>Affinity Sphere</strong> receives its first dot automatically (included in the 6). Maximum 5 dots per Sphere. <span class="page-ref">M20 p. 259, 512–527</span>`)}

    ${affinitySelectHtml}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="font-size:0.85rem;color:var(--text-dim)">Affinity Sphere: <strong style="color:var(--gold-mid)">${selectedAffinity || 'Not set'}</strong></span>
      <span style="font-size:0.85rem;color:var(--text-dim)">Arete: <strong style="color:var(--gold-mid)" id="sphere-step-arete">${c.arete || 1}</strong> <span style="color:var(--text-faint);font-size:0.75rem">(follows highest Sphere)</span></span>
      <span class="attr-block-points">
        <span class="pts" id="sphere-remaining">${sphDisplayRem}</span> / ${totalDots} pts remaining
        ${sphOverBy > 0 ? `<span class="pts-freebie" id="sphere-freebie-note">+${sphOverBy} via freebies</span>` : '<span class="pts-freebie" id="sphere-freebie-note" style="display:none">+0 via freebies</span>'}
      </span>
    </div>

    <div class="sphere-grid" id="sphere-grid">
      ${sphereCards}
    </div>

    <div style="margin-top:1.5rem;padding:1rem;background:var(--bg-raised);border-radius:var(--radius-md);border:1px solid var(--border-dim)">
      <div id="sphere-rank-detail" style="font-size:0.85rem;color:var(--text-dim)">
        <em>Click a sphere card above to see its rank descriptions.</em>
      </div>
    </div>`;
  },

  /* ══════════════════════════════════════════════════════════════
     STEP 6 — Finishing Touches (p. 259)
     ══════════════════════════════════════════════════════════════ */
  renderStep6() {
    const c = this.char;
    const avatarRating = c.backgrounds['avatar'] || 0;
    if (c.quintessence === 0 && avatarRating > 0) c.quintessence = avatarRating;

    // Enforce Arete >= highest sphere rating (M20 core rule, p. 259)
    const minArete = Math.max(1, Object.values(c.spheres || {}).reduce((m, v) => Math.max(m, v), 0));
    if ((c.arete || 1) < minArete) c.arete = minArete;

    // Compute allocation baselines for each category
    const attrPri    = c.attr_priority    || ['Physical','Social','Mental'];
    const abilityPri = c.ability_priority || ['Talents','Skills','Knowledges'];
    const attrAllocs = { Physical: [7,5,3][attrPri.indexOf('Physical')] ?? 0,
                          Social:   [7,5,3][attrPri.indexOf('Social')]   ?? 0,
                          Mental:   [7,5,3][attrPri.indexOf('Mental')]   ?? 0 };
    const abilAllocs = { Talents:    [13,9,5][abilityPri.indexOf('Talents')]    ?? 0,
                          Skills:     [13,9,5][abilityPri.indexOf('Skills')]     ?? 0,
                          Knowledges: [13,9,5][abilityPri.indexOf('Knowledges')] ?? 0 };

    // Lock baselines if not already locked (e.g. when editing an existing character)
    if (!this._lockedBaselines) this._lockBaselines();
    const lb = this._lockedBaselines;
    const mfView = UiPrefs.get('mfView', 'card');

    // Helper: greedily assign creation pool dots to traits (lowest-value first)
    // Used only as fallback; normally locked baselines are used directly.
    const computeTraitBaselines = (ids, getValue, pool, startBaseline) => {
      const baselines = {};
      ids.forEach(id => { baselines[id] = startBaseline; });
      const sorted = [...ids].sort((a, b) => getValue(a) - getValue(b));
      let rem = pool;
      for (const id of sorted) {
        if (rem <= 0) break;
        const above = Math.max(0, getValue(id) - startBaseline);
        const allocated = Math.min(rem, above);
        baselines[id] = startBaseline + allocated;
        rem -= allocated;
      }
      return baselines;
    };

    // Ensure merits/flaws are plain objects (migration safety: handle undefined, null, or legacy arrays)
    if (!c.merits || Array.isArray(c.merits)) c.merits = {};
    if (!c.flaws  || Array.isArray(c.flaws))  c.flaws  = {};

    // Flat attribute specialty lookup: { strength: [...], dexterity: [...], ... }
    const attrSpecMap = {};
    Object.values(M20.ATTRIBUTES).forEach(grp => grp.forEach(a => { attrSpecMap[a.id] = a.specialties || []; }));

    // Helper: dots row for the freebie panel
    // specOptions: array of suggestion strings (null = no specialty row)
    // currentSpec: currently saved specialty text for this trait
    const fbRow = (id, label, current, max, baseline, costPer, costNote, stat = null, specOptions = null, currentSpec = '', specThreshold = 4, desc = '') => {
      const spent     = Math.max(0, current - baseline) * costPer;
      const dotsHtml  = Array.from({length: max}, (_, i) => {
        const val = i + 1;
        const isFree   = val <= baseline;
        const isFilled = val <= current;
        return `<span class="dot ${isFilled ? 'filled' : ''} ${isFree ? 'dot-free' : 'dot-freebie'}"
          data-val="${val}" title="${isFree ? 'Free (creation)' : `Costs ${costPer} freebie pt${costPer>1?'s':''}`}"></span>`;
      }).join('');
      const costDisplay = spent > 0
        ? `<span class="fb-cost-badge">${spent} pt${spent>1?'s':''}</span>`
        : `<span class="fb-cost-free">free</span>`;
      const dataAttr = stat ? `data-stat="${stat}"` : `data-fb-id="${id}"`;
      const specHtml = specOptions !== null
        ? `<div class="specialty-row fb-specialty-row"${current < specThreshold ? ' style="display:none"' : ''}>` +
          `<input class="specialty-input" list="fb-spec-${id}" data-specialty-for="${id}" ` +
          `placeholder="Specialty\u2026" value="${currentSpec}">` +
          `<datalist id="fb-spec-${id}">${specOptions.map(s => `<option value="${s}">`).join('')}</datalist>` +
          `</div>`
        : '';
      return `
      <div class="fb-row" ${dataAttr} data-baseline="${baseline}" data-cost="${costPer}" data-max="${max}">
        <div class="fb-row-label">
          <span>${label}${costNote ? `<span class="fb-cost-hint">${costNote}</span>` : ''}</span>
          ${desc ? `<span class="fb-row-desc">${desc}</span>` : ''}
        </div>
        <span class="dots" data-max="${max}">${dotsHtml}</span>
        <div class="fb-row-cost">${costDisplay}</div>
      </div>${specHtml}`;
    };

    // Attribute rows — grouped
    const attrGroups = [
      { label: 'Physical', ids: [['strength','Strength'],['dexterity','Dexterity'],['stamina','Stamina']] },
      { label: 'Social',   ids: [['charisma','Charisma'],['manipulation','Manipulation'],['appearance','Appearance']] },
      { label: 'Mental',   ids: [['perception','Perception'],['intelligence','Intelligence'],['wits','Wits']] },
    ];
    const attrSection = attrGroups.map(g => {
      const alloc = attrAllocs[g.label] ?? 0;
      const rows = g.ids.map(([id, name]) => {
        const cur = c[id] || 1;
        const baseline = lb.attrs[id] ?? 1;
        return fbRow(id, name, cur, 5, baseline, 5, '5 pts/dot', null, attrSpecMap[id] || [], c.specialties[id] || '');
      }).join('');
      return `
      <div class="fb-group">
        <div class="fb-group-header">
          <span class="fb-group-label">${g.label} Attributes</span>
          <span class="fb-group-alloc">${alloc} creation pts · over-allocation costs 5 freebies/dot</span>
        </div>
        ${rows}
      </div>`;
    }).join('');

    // Ability rows
    const abilGroups = [
      { label:'Talents',    key:'talents',    data: M20.TALENTS,    sec: M20.SECONDARY_TALENTS },
      { label:'Skills',     key:'skills',     data: M20.SKILLS,     sec: M20.SECONDARY_SKILLS },
      { label:'Knowledges', key:'knowledges', data: M20.KNOWLEDGES, sec: M20.SECONDARY_KNOWLEDGES },
    ];
    const abilSection = abilGroups.map(g => {
      const alloc = abilAllocs[g.label] ?? 0;
      const rows  = g.data.map(a => {
        const cur = c[g.key][a.id] || 0;
        const baseline = lb.abilities[a.id] ?? 0;
        const specThreshold = GENERAL_ABILITY_IDS.has(a.id) ? 1 : 4;
        return fbRow(a.id, a.name, cur, 5, baseline, 2, '2 pts/dot', null, a.specialties || [], c.specialties[a.id] || '', specThreshold);
      }).join('');
      // Secondary abilities — use locked baseline (may be > 0 if covered by allocation)
      const addedSec = g.sec.filter(a => c[g.key][a.id] !== undefined);
      const secRows  = addedSec.map(a => {
        const cur      = c[g.key][a.id] || 0;
        const baseline = lb.abilities[a.id] ?? 0;
        const label = a.name + ' <span class="secondary-badge">Secondary</span>';
        return fbRow(a.id, label, cur, 3, baseline, 3, '3 pts/dot', null, a.specialties || [], c.specialties[a.id] || '');
      }).join('');
      // Custom abilities — same as secondary
      const custIds = Object.keys(c.custom_ability_names || {}).filter(id => c[g.key][id] !== undefined);
      const custRows = custIds.map(id => {
        const cur      = c[g.key][id] || 0;
        const baseline = lb.abilities[id] ?? 0;
        const name     = (c.custom_ability_names || {})[id] || id;
        const label    = name + ' <span class="secondary-badge">Custom</span>';
        return fbRow(id, label, cur, 3, baseline, 3, '3 pts/dot', null, [], c.specialties[id] || '');
      }).join('');
      return `
      <div class="fb-group">
        <div class="fb-group-header">
          <span class="fb-group-label">${g.label}</span>
          <span class="fb-group-alloc">${alloc} creation pts · over-allocation costs 2 freebies/dot</span>
        </div>
        ${rows}
        ${secRows}
        ${custRows}
      </div>`;
    }).join('');

    // Background rows (filtered by faction, correct names)
    const bgAff = c.affiliation || 'Traditions';
    const filteredBgs = filteredBackgrounds(bgAff);
    const bgSection = filteredBgs.map(bg => {
      const cur = c.backgrounds[bg.id] || 0;
      const baseline = lb.backgrounds[bg.id] ?? 0;
      const bgMax = bg.max || 5;
      const costPer = bg.doubleCost ? 2 : 1;
      const costNote = bg.doubleCost ? '2 pts/dot' : '1 pt/dot';
      const tipText = (bg.description + (bg.note ? ' (' + bg.note + ')' : '')).replace(/"/g, '&quot;');
      const label = `${bgDisplayName(bg, bgAff)} <span class="info-tip" data-tip="${tipText}">?</span>`;
      const levelDesc = bg.levels && cur > 0 ? bg.levels[cur - 1] : '';
      return fbRow(bg.id, label, cur, bgMax, baseline, costPer, costNote, null, null, '', 4, levelDesc);
    }).join('');

    // Sphere rows
    const sphereSection = M20.SPHERES.map(s => {
      const cur = c.spheres[s.id] || 0;
      const baseline = lb.spheres[s.id] ?? 0;
      return fbRow(s.id, s.name, cur, 3, baseline, 7, '7 pts/dot', null, s.specialties || [], c.specialties[s.id] || '');
    }).join('');

    const { total } = this.calcFreebies();
    const remaining = M20.CREATION.freebiePoints - total;

    return `
    ${this.stepHeader('Step Seven: Finishing Touches',
      M20.QUOTES.step7,
      `Spend your <strong>15 Freebie Points</strong> to push traits beyond creation allocations, or raise core stats. Click dots in any section below — the bank updates live. <span class="page-ref">M20 p. 259</span>`)}

    <!-- ── Freebie Bank ── -->
    <div class="fb-bank" id="fb-bank">
      <div class="fb-bank-inner">
        <div class="fb-bank-label">Freebie Points</div>
        <div class="fb-bank-bar" id="fb-bar">
          ${Array.from({length: M20.CREATION.freebiePoints}, (_, i) => `<span class="fb-pip ${i < (M20.CREATION.freebiePoints - total) ? 'available' : 'spent'}"></span>`).join('')}
        </div>
        <div class="fb-bank-numbers">
          <span id="fb-remaining" class="${remaining < 0 ? 'fb-over' : ''}">${remaining}</span>
          <span class="fb-bank-of">of ${M20.CREATION.freebiePoints} remaining</span>
        </div>
      </div>
    </div>

    <!-- ── Core Stats (always visible costs) ── -->
    <div class="summary-section">
      <div class="summary-section-title">Core Statistics <span class="page-ref">p. 259</span></div>
      <div class="fb-section-note">Arete, Willpower, and Quintessence can be raised here with freebie points. Paradox begins at 0.</div>
      <div class="fb-core-grid">
        ${fbRow('arete', 'Arete <span class="info-tip" data-tip="Arete measures a mage&#39;s magical enlightenment and mastery. Higher Arete raises the maximum rating of all Spheres and allows more powerful Effects. Each dot costs 4 freebie points at creation; raising it later costs 8 XP per dot. Maximum 3 at character creation. See M20 p. 259.">?</span>', c.arete, 3, 1, 4, '4 pts/dot · max 3', 'arete')}
        ${fbRow('willpower', 'Willpower <span class="info-tip" data-tip="Willpower reflects inner resolve, determination, and force of will. Spend a point to gain an automatic success on any roll, resist compulsions, or power certain magical effects. Regained by fulfilling your Nature archetype. Starts at 5; each dot above 5 costs 1 freebie point. See M20 p. 264.">?</span>', c.willpower, 10, 5, 1, '1 pt/dot above 5', 'willpower')}
        ${(() => { const qFree = avatarRating; return fbRow('quintessence', `Quintessence (free: ${qFree} from Avatar) <span class="info-tip" data-tip="Quintessence is raw magical energy stored in your Avatar. Spend it to reduce the difficulty of magical Effects by 1 per point, or to fuel rituals and Tass. Your starting pool equals your Avatar background rating. Extra dots beyond that cost 1 freebie point per 4 dots. See M20 p. 266.">?</span>`, c.quintessence, 10, qFree, 1, '1 pt per 4 dots extra', 'quintessence'); })()}
        <div class="fb-row">
          <div class="fb-row-label">Paradox <span class="info-tip" data-tip="Paradox accumulates when you work vulgar magic in front of Sleepers or when reality rejects your Effects. Higher Paradox brings Flaws, Backlashes, and eventually Quiet. It bleeds off slowly over time or can be purged through roleplay and Storyteller discretion. Begins at 0. See M20 p. 267.">?</span><span class="fb-cost-hint">begins at 0</span></div>
          <span class="dots" data-max="10" data-stat="paradox">${Array.from({length:10},(_,i)=>`<span class="dot ${i<c.paradox?'filled':''}" data-val="${i+1}"></span>`).join('')}</span>
          <div class="fb-row-cost"><span class="fb-cost-free">N/A</span></div>
        </div>
        <div class="fb-arete-label" id="arete-label" style="grid-column:1/-1;font-style:italic;color:var(--text-dim);font-size:0.82rem;padding:0.2rem 0 0.5rem 0">${M20.ARETE_LABELS[c.arete] || ''}</div>
        <div id="arete-sphere-notice"></div>
      </div>
    </div>

    <!-- ── Attributes ── -->
    <details class="fb-details" open>
      <summary class="fb-details-summary">
        Attributes <span class="fb-details-cost" id="fb-cost-attrs"><!-- updated by JS --></span>
        <span class="fb-details-hint">5 pts/dot over allocation · <span class="page-ref">p. 258</span></span>
      </summary>
      <div class="fb-section-note">Gold dots = covered by creation allocation. Purple dots = freebie cost.</div>
      <div id="fb-attrs">${attrSection}</div>
    </details>

    <!-- ── Abilities ── -->
    <details class="fb-details">
      <summary class="fb-details-summary">
        Abilities <span class="fb-details-cost" id="fb-cost-abilities"><!-- updated by JS --></span>
        <span class="fb-details-hint">2 pts/dot over allocation · <span class="page-ref">p. 259</span></span>
      </summary>
      <div class="fb-section-note">Gold dots = covered by creation allocation. Purple dots = freebie cost.</div>
      <div id="fb-abilities">${abilSection}</div>
    </details>

    <!-- ── Backgrounds ── -->
    <details class="fb-details">
      <summary class="fb-details-summary">
        Backgrounds <span class="fb-details-cost" id="fb-cost-bgs"><!-- updated by JS --></span>
        <span class="fb-details-hint">1 pt/dot over 7-dot allocation · <span class="page-ref">p. 301</span></span>
      </summary>
      <div class="fb-section-note">7 creation dots are free. Each additional dot costs 1 freebie pt.</div>
      <div id="fb-bgs" class="fb-group">${bgSection}</div>
    </details>

    <!-- ── Spheres ── -->
    <details class="fb-details">
      <summary class="fb-details-summary">
        Spheres <span class="fb-details-cost" id="fb-cost-spheres"><!-- updated by JS --></span>
        <span class="fb-details-hint">7 pts/dot over 6-dot allocation · <span class="page-ref">p. 512</span></span>
      </summary>
      <div class="fb-section-note">6 creation dots are free. Each additional dot costs 7 freebie pts.</div>
      <div id="fb-spheres" class="fb-group">${sphereSection}</div>
    </details>

    <div class="view-toggle" style="margin: 0.75rem 0 0.25rem">
      <span class="view-toggle-label">Merits &amp; Flaws view:</span>
      <button class="view-toggle-btn${mfView === 'card' ? ' vt-active' : ''}" data-pref="mfView" data-val="card" title="Card view">⊞ Cards</button>
      <button class="view-toggle-btn${mfView === 'list' ? ' vt-active' : ''}" data-pref="mfView" data-val="list" title="List view">☰ List</button>
    </div>
    <!-- ── Merits ── -->
    <details class="fb-details mf-details">
      <summary class="fb-details-summary">
        Merits <span class="fb-details-cost" id="mf-cost-merits"></span>
        <span class="fb-details-hint">cost freebie points &middot; <span class="page-ref">p. 340</span></span>
      </summary>
      <div class="fb-section-note">Click a merit to add it; click again to remove. Each costs its listed freebie point value.</div>
      <div id="fb-merits" class="${mfView === 'list' ? 'mf-list' : 'mf-grid'}"></div>
    </details>

    <!-- ── Flaws ── -->
    <details class="fb-details mf-details">
      <summary class="fb-details-summary">
        Flaws <span class="fb-details-cost" id="mf-cost-flaws"></span>
        <span class="fb-details-hint">grant bonus freebie points (max +7) &middot; <span class="page-ref">p. 350</span></span>
      </summary>
      <div class="fb-section-note">Taking a flaw grants you bonus freebie points equal to its cost. Maximum +7 pts from flaws total. Click to toggle.</div>
      <div id="fb-flaws" class="${mfView === 'list' ? 'mf-list' : 'mf-grid'}"></div>
    </details>

    <!-- ── Notes ── -->
    <div class="summary-section" style="margin-top:1.5rem">
      <div class="summary-section-title">Character Description & Notes</div>
      <div class="form-group" style="margin-bottom:1rem">
        <label>Physical Description & Background</label>
        <textarea id="f-description" rows="4" placeholder="Describe your mage's appearance, history, and personality...">${c.description}</textarea>
      </div>
      <div class="form-group">
        <label>Storyteller Notes / Additional Details</label>
        <textarea id="f-notes" rows="3" placeholder="Goals, connections, hooks, special notes...">${c.notes}</textarea>
      </div>
    </div>

    <div class="summary-section">
      <div class="summary-section-title">Character Summary</div>
      ${this.renderSummary()}
    </div>`;
  },

  renderSummary() {
    const c = this.char;
    const topAttrs = ['strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits']
      .map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1), val: c[id] || 1 }))
      .filter(a => a.val > 1)
      .map(a => `<div class="summary-row"><span class="summary-row-label">${a.name}</span><span class="summary-row-value">${a.val}</span></div>`)
      .join('') || '<p style="color:var(--text-faint);font-size:0.82rem">All attributes at 1</p>';

    const sphereList = M20.SPHERES.filter(s => (c.spheres[s.id] || 0) > 0)
      .map(s => `<div class="summary-row"><span class="summary-row-label">${s.name}</span><span class="summary-row-value">${c.spheres[s.id]}</span></div>`)
      .join('') || '<p style="color:var(--text-faint);font-size:0.82rem">No spheres allocated</p>';

    return `
    <div class="form-grid">
      <div>
        <div class="summary-row"><span class="summary-row-label">Name</span><span class="summary-row-value">${c.name || '—'}</span></div>
        <div class="summary-row"><span class="summary-row-label">Tradition</span><span class="summary-row-value">${c.tradition || '—'}</span></div>
        <div class="summary-row"><span class="summary-row-label">Essence</span><span class="summary-row-value">${c.essence || '—'}</span></div>
        <div class="summary-row"><span class="summary-row-label">Nature / Demeanor</span><span class="summary-row-value">${c.nature || '—'} / ${c.demeanor || '—'}</span></div>
        <div style="margin-top:0.8rem;font-size:0.72rem;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.4rem">Notable Attributes</div>
        ${topAttrs}
      </div>
      <div>
        <div style="font-size:0.72rem;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.4rem">Spheres</div>
        ${sphereList}
        <div style="margin-top:0.8rem">
          <div class="summary-row"><span class="summary-row-label">Arete</span><span class="summary-row-value">${c.arete}</span></div>
          <div class="summary-row"><span class="summary-row-label">Willpower</span><span class="summary-row-value">${c.willpower}</span></div>
          <div class="summary-row"><span class="summary-row-label">Quintessence</span><span class="summary-row-value">${c.quintessence}</span></div>
        </div>
      </div>
    </div>`;
  },

  /* ─── Priority Selector Helper ─────────────────────────────── */
  renderPrioritySorter(categories, current, field, labels) {
    const tierLabels = ['Primary', 'Secondary', 'Tertiary'];
    const tierPts    = [labels.primary, labels.secondary, labels.tertiary];
    const tierCls    = ['priority-primary', 'priority-secondary', 'priority-tertiary'];

    const items = current.map((cat, idx) => `
      <div class="priority-item ${tierCls[idx]}" draggable="true" data-idx="${idx}" data-field="${field}">
        <span class="priority-handle" title="Drag to reorder">⠿</span>
        <span class="priority-tier-badge">${tierLabels[idx]} &middot; ${tierPts[idx]} pts</span>
        <span class="priority-cat-name">${cat}</span>
      </div>`).join('');

    return `
    <div class="priority-sorter" data-field="${field}">
      <p class="priority-sorter-hint">Drag rows to set priority order — top row gets the most points</p>
      ${items}
    </div>`;
  },

  /* ─── Event Listeners ──────────────────────────────────────── */
  attachStepListeners() {
    const content = $('#step-content');
    const c = this.char;

    // Step 0 — Basic fields
    const bind = (id, field, transform) => {
      const el = $(id, content);
      if (!el) return;
      el.addEventListener('change', () => {
        c[field] = transform ? transform(el.value) : el.value;
        if (field === 'nature') this.updateNatureWillpower();
        if (field === 'arete') this.updateAreteLabel();
        this.updateFreebieDisplay();
      });
    };

    // Specialty text inputs — delegate across all steps
    content.addEventListener('input', e => {
      const inp = e.target.closest('.specialty-input');
      if (!inp) return;
      const id = inp.dataset.specialtyFor;
      if (!id) return;
      if (inp.value.trim()) c.specialties[id] = inp.value.trim();
      else delete c.specialties[id];
    });

    bind('#f-name', 'name');
    bind('#f-player', 'player');
    bind('#f-chronicle', 'chronicle');
    bind('#f-concept', 'concept');
    bind('#f-paradigm', 'paradigm');
    bind('#f-practice', 'practice');
    bind('#f-description', 'description');
    bind('#f-notes', 'notes');

    // Concept select sync
    const conceptSel = $('#f-concept-select', content);
    const conceptInp = $('#f-concept', content);
    if (conceptSel && conceptInp) {
      conceptSel.addEventListener('change', () => {
        if (conceptSel.value) conceptInp.value = conceptSel.value;
        c.concept = conceptInp.value;
      });
      conceptInp.addEventListener('input', () => { c.concept = conceptInp.value; });
    }

    // Archetype N/D buttons, delete buttons, and custom archetype form
    content.addEventListener('click', e => {
      // N or D assignment button
      const ndBtn = e.target.closest('.archetype-nd-btn');
      if (ndBtn) {
        e.stopPropagation();
        const archName = ndBtn.dataset.archetype;
        const role     = ndBtn.dataset.role; // 'nature' or 'demeanor'
        c[role] = (c[role] === archName) ? '' : archName;
        if (role === 'nature') this.updateNatureWillpower();
        this.updateFreebieDisplay();
        // Update highlights in-place without full re-render
        $$('.archetype-nd-btn.nd-n', content).forEach(b =>
          b.classList.toggle('nd-active-n', c.nature === b.dataset.archetype));
        $$('.archetype-nd-btn.nd-d', content).forEach(b =>
          b.classList.toggle('nd-active-d', c.demeanor === b.dataset.archetype));
        $$('.archetype-card', content).forEach(card => {
          const n = card.dataset.archetype;
          card.classList.toggle('nd-nature',   c.nature   === n);
          card.classList.toggle('nd-demeanor', c.demeanor === n);
        });
        // Update legend
        const leg = $('#archetype-nd-legend-nature', content);
        const legD = $('#archetype-nd-legend-demeanor', content);
        if (leg)  leg.innerHTML  = `<span class="nd-legend-n">N</span> Nature${c.nature   ? ` \u2014 <em>${c.nature}</em>`   : ''}`;
        if (legD) legD.innerHTML = `<span class="nd-legend-d">D</span> Demeanor${c.demeanor ? ` \u2014 <em>${c.demeanor}</em>` : ''}`;
        return;
      }

      // Delete custom archetype
      const delBtn = e.target.closest('.archetype-delete-btn');
      if (delBtn) {
        e.stopPropagation();
        const archName = delBtn.dataset.archetype;
        c.customArchetypes = (c.customArchetypes || []).filter(a => a.name !== archName);
        if (c.nature   === archName) c.nature   = '';
        if (c.demeanor === archName) c.demeanor = '';
        this.renderStep();
        return;
      }

      // Show custom archetype form
      if (e.target.closest('#btn-show-custom-arch')) {
        const form = $('#custom-archetype-form', content);
        if (form) form.style.display = '';
        e.target.style.display = 'none';
        return;
      }

      // Cancel custom archetype form
      if (e.target.closest('#btn-custom-arch-cancel')) {
        const form = $('#custom-archetype-form', content);
        if (form) form.style.display = 'none';
        const showBtn = $('#btn-show-custom-arch', content);
        if (showBtn) showBtn.style.display = '';
        ['f-custom-arch-name', 'f-custom-arch-wp', 'f-custom-arch-desc'].forEach(id => {
          const el = $(`#${id}`, content);
          if (el) el.value = '';
        });
        return;
      }

      // Submit custom archetype
      if (e.target.closest('#btn-custom-arch-submit')) {
        const nameEl = $('#f-custom-arch-name', content);
        const wpEl   = $('#f-custom-arch-wp', content);
        const descEl = $('#f-custom-arch-desc', content);
        const name   = nameEl ? nameEl.value.trim() : '';
        if (!name) { toast('Please enter an archetype name.', 'error'); return; }
        const allNames = [
          ...M20.ARCHETYPES.map(a => a.name),
          ...(c.customArchetypes || []).map(a => a.name),
        ];
        if (allNames.includes(name)) { toast('An archetype with that name already exists.', 'error'); return; }
        if (!c.customArchetypes) c.customArchetypes = [];
        c.customArchetypes.push({
          name,
          willpower:   wpEl   ? wpEl.value.trim()   : '',
          description: descEl ? descEl.value.trim() : '',
        });
        this.renderStep();
        return;
      }
    });

    // View toggle buttons (archetype view, mf view)
    $$('.view-toggle-btn[data-pref]', content).forEach(btn => {
      btn.addEventListener('click', () => {
        UiPrefs.set(btn.dataset.pref, btn.dataset.val);
        this.renderStep();
      });
    });

    // Essence cards
    $$('.essence-card', content).forEach(card => {
      card.addEventListener('click', () => {
        c.essence = card.dataset.essence;
        $$('.essence-card', content).forEach(el => el.classList.toggle('selected', el.dataset.essence === c.essence));
      });
    });

    // Affiliation tabs — display only, never touch character data.
    // Clicking a tab just shows that panel for browsing; the selection is
    // committed only when a tradition card is actually clicked.
    $$('.affil-tab', content).forEach(tab => {
      tab.addEventListener('click', () => {
        const panelId = tab.dataset.affil;
        $$('.affil-tab', content).forEach(t => t.classList.toggle('active', t.dataset.affil === panelId));
        $$('[id^="tradition-panel-"]', content).forEach(p => {
          p.style.display = p.id.endsWith(panelId) ? 'grid' : 'none';
        });
      });
    });

    // Tradition cards — clicking a card commits both the tradition and the
    // affiliation (so browsing other tabs never deselects a prior choice).
    $$('.tradition-card', content).forEach(card => {
      card.addEventListener('click', () => {
        c.tradition  = card.dataset.tradition;
        c.affiliation = card.dataset.type;           // Traditions / Technocracy / Disparates
        $$('.tradition-card', content).forEach(t => t.classList.toggle('selected', t.dataset.tradition === c.tradition));
        // Keep the active tab in sync with the chosen affiliation
        $$('.affil-tab', content).forEach(t => t.classList.toggle('active', t.dataset.affil === c.affiliation));
        $$('[id^="tradition-panel-"]', content).forEach(p => {
          p.style.display = p.id.endsWith(c.affiliation) ? 'grid' : 'none';
        });
        // Auto-set affinity sphere if the tradition has exactly one
        const trad = [...M20.TRADITIONS, ...M20.TECHNOCRACY, ...M20.DISPARATES].find(t => t.name === c.tradition);
        if (trad?.affinitySpheres?.length === 1) c.affinity_sphere = trad.affinitySpheres[0];
        else c.affinity_sphere = '';
      });
    });

    // Priority buttons — clicking a category promotes it toward Primary
    // Priority drag-and-drop sorters (steps 1 & 2)
    $$('.priority-sorter', content).forEach(sorter => {
      const field = sorter.dataset.field;
      let dragIdx = null;

      sorter.addEventListener('dragstart', e => {
        const item = e.target.closest('.priority-item');
        if (!item) return;
        dragIdx = parseInt(item.dataset.idx);
        e.dataTransfer.effectAllowed = 'move';
        // Defer so the browser can capture the drag ghost before we dim
        requestAnimationFrame(() => item.classList.add('dragging'));
      });

      sorter.addEventListener('dragend', () => {
        $$('.priority-item', sorter).forEach(el => el.classList.remove('dragging', 'drag-over'));
        dragIdx = null;
      });

      sorter.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const item = e.target.closest('.priority-item');
        if (!item) return;
        $$('.priority-item', sorter).forEach(el => el.classList.remove('drag-over'));
        if (parseInt(item.dataset.idx) !== dragIdx) item.classList.add('drag-over');
      });

      sorter.addEventListener('dragleave', e => {
        const item = e.target.closest('.priority-item');
        if (item) item.classList.remove('drag-over');
      });

      sorter.addEventListener('drop', e => {
        e.preventDefault();
        const item = e.target.closest('.priority-item');
        if (!item || dragIdx === null) return;
        const dropIdx = parseInt(item.dataset.idx);
        if (dragIdx === dropIdx) return;
        const arr = c[field];
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(dropIdx, 0, moved);
        this.renderStep();
      });
    });

    // Attribute dots (step 1)
    $$('.attr-block', content).forEach(block => {
      block.querySelectorAll('.attr-row').forEach(row => {
        const dotsEl = row.querySelector('.dots');
        if (!dotsEl) return;
        dotsEl.addEventListener('click', e => {
          const dot = e.target.closest('.dot');
          if (!dot) return;
          const val = parseInt(dot.dataset.val);

          // Determine category from the block
          const blockTitle = block.querySelector('.attr-block-title').textContent.toLowerCase();
          let attrIds = [];
          if (blockTitle.includes('physical')) attrIds = ['strength','dexterity','stamina'];
          else if (blockTitle.includes('social')) attrIds = ['charisma','manipulation','appearance'];
          else if (blockTitle.includes('mental')) attrIds = ['perception','intelligence','wits'];
          else if (blockTitle.includes('talents')) attrIds = M20.TALENTS.map(a => a.id);
          else if (blockTitle.includes('skills')) attrIds = M20.SKILLS.map(a => a.id);
          else if (blockTitle.includes('knowledges')) attrIds = M20.KNOWLEDGES.map(a => a.id);

          // Find which attribute this row is
          const attrRow = e.target.closest('.attr-row');
          if (!attrRow) return;

          // Ability rows
          if (attrRow.dataset.ability) {
            const id  = attrRow.dataset.ability;
            const cat = attrRow.dataset.category;
            const cur = c[cat][id] || 0;
            c[cat][id] = cur === val ? Math.max(0, val - 1) : val;
            this.refreshDots(dotsEl, c[cat][id]);
            this.refreshAbilityPoints(block, cat);
            this.updateFreebieDisplay();
            // Update level description in-place
            const newVal = c[cat][id];
            const allAbils = [...M20.TALENTS, ...M20.SKILLS, ...M20.KNOWLEDGES,
                              ...M20.SECONDARY_TALENTS, ...M20.SECONDARY_SKILLS, ...M20.SECONDARY_KNOWLEDGES];
            const abilDef = allAbils.find(a => a.id === id);
            const descEl = attrRow.querySelector('.attr-desc');
            if (descEl && abilDef) {
              descEl.textContent = (newVal > 0 && abilDef.levels) ? abilDef.levels[newVal - 1]
                                 : (newVal > 0 ? abilDef.description : '');
            }
            // Show/hide specialty row
            const specThreshold = GENERAL_ABILITY_IDS.has(id) ? 1 : 4;
            const specRow = attrRow.querySelector('.specialty-row');
            if (specRow) {
              specRow.style.display = newVal >= specThreshold ? '' : 'none';
              if (newVal < specThreshold) { delete c.specialties[id]; const inp = specRow.querySelector('.specialty-input'); if (inp) inp.value = ''; }
            }
            return;
          }

          // Attribute rows — find attribute id by position
          const allRows = [...block.querySelectorAll('.attr-row')];
          const rowIdx = allRows.indexOf(attrRow);
          const attrId = attrIds[rowIdx];
          if (!attrId) return;

          const cur = c[attrId] || 1;
          c[attrId] = cur === val ? Math.max(1, val - 1) : val;
          this.refreshDots(dotsEl, c[attrId]);
          this.refreshAttrPoints(block, attrId);
          this.updateFreebieDisplay();
          // Update level description in-place
          const descEl = attrRow.querySelector('.attr-desc');
          if (descEl) {
            const attrDef = Object.values(M20.ATTRIBUTES).flat().find(a => a.id === attrId);
            descEl.textContent = attrDef?.levels ? attrDef.levels[c[attrId] - 1] : (attrDef?.description || '');
          }
          // Show/hide specialty row
          const specRow = attrRow.querySelector('.specialty-row');
          if (specRow) {
            specRow.style.display = c[attrId] >= 4 ? '' : 'none';
            if (c[attrId] < 4) { delete c.specialties[attrId]; const inp = specRow.querySelector('.specialty-input'); if (inp) inp.value = ''; }
          }
        });
      });
    });

    // Secondary ability — add (select change)
    $$('.secondary-add-select', content).forEach(sel => {
      sel.addEventListener('change', () => {
        const id  = sel.value;
        const cat = sel.dataset.category;
        if (!id || !cat) return;
        c[cat][id] = 0;
        this.renderStep();
      });
    });

    // Secondary ability — remove (delegated click)
    content.addEventListener('click', e => {
      const btn = e.target.closest('.btn-remove-secondary');
      if (!btn) return;
      const id  = btn.dataset.abilityId;
      const cat = btn.dataset.category;
      if (!id || !cat) return;
      delete c[cat][id];
      delete c.specialties[id];
      // Also remove from custom_ability_names if it's a custom ability
      if (c.custom_ability_names && c.custom_ability_names[id]) {
        delete c.custom_ability_names[id];
      }
      this.renderStep();
    });

    // Custom ability — add (button click)
    content.addEventListener('click', e => {
      const btn = e.target.closest('.btn-add-custom');
      if (!btn) return;
      const cat = btn.dataset.category;
      const input = content.querySelector(`.custom-ability-input[data-category="${cat}"]`);
      if (!input) return;
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      // Generate a unique ID
      const id = 'cust_' + Date.now().toString(36);
      if (!c.custom_ability_names) c.custom_ability_names = {};
      c.custom_ability_names[id] = name;
      c[cat][id] = 0;
      this.renderStep();
    });

    // Custom ability — add on Enter key
    content.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const input = e.target.closest('.custom-ability-input');
      if (!input) return;
      e.preventDefault();
      const btn = content.querySelector(`.btn-add-custom[data-category="${input.dataset.category}"]`);
      if (btn) btn.click();
    });

    // Background dots (step 3)
    $$('[data-bg]', content).forEach(row => {
      const dotsEl = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const bgId  = row.dataset.bg;
        const bgMax = parseInt(row.dataset.bgMax) || 5;
        const val   = parseInt(dot.dataset.val);
        const cur   = c.backgrounds[bgId] || 0;
        c.backgrounds[bgId] = cur === val ? Math.max(0, val - 1) : Math.min(bgMax, val);
        this.refreshDots(dotsEl, c.backgrounds[bgId]);
        // Update level description in-place
        const descEl = row.querySelector('.attr-desc');
        if (descEl) {
          const bgDef = M20.BACKGROUNDS.find(b => b.id === bgId);
          const newVal = c.backgrounds[bgId];
          descEl.textContent = bgDef?.levels && newVal > 0 ? bgDef.levels[newVal - 1] : (bgDef?.description || '');
        }
        const total = filteredBackgrounds(c.affiliation || 'Traditions').reduce((s, bg) => s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1), 0);
        const remEl = $('#bg-remaining', content);
        const noteEl = $('#bg-freebie-note', content);
        if (remEl) {
          const rem = M20.CREATION.backgroundDots - total;
          const over = Math.max(0, -rem);
          remEl.textContent = Math.max(0, rem);
          remEl.style.color = over > 0 ? 'var(--gold-bright)' : 'var(--gold-bright)';
          if (noteEl) {
            noteEl.textContent = `+${over} via freebies`;
            noteEl.style.display = over > 0 ? 'block' : 'none';
          }
        }
        this.updateFreebieDisplay();
      });
    });

    // Sphere dots (step 5)
    $$('[data-sphere]', content).forEach(card => {
      const dotsEl = card.querySelector('.dots');
      if (!dotsEl) return;
      const sphereId = card.dataset.sphere;
      const sphere   = M20.SPHERES.find(s => s.id === sphereId);

      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        const cur = c.spheres[sphereId] || 0;
        c.spheres[sphereId] = cur === val ? Math.max(0, val - 1) : Math.min(3, val);
        this.refreshDots(dotsEl, c.spheres[sphereId]);

        // Auto-set Arete to match highest sphere (min 1, max 3 at creation)
        const maxSphere = Object.values(c.spheres).reduce((m, v) => Math.max(m, v), 0);
        const oldArete = c.arete || 1;
        const newArete = Math.max(1, Math.min(3, maxSphere));
        c.arete = newArete;
        const areteIndicator = $('#sphere-step-arete', content);
        if (areteIndicator) areteIndicator.textContent = newArete;
        if (newArete < oldArete) {
          toast(`Arete reduced to ${newArete} to match highest Sphere -- freebie points refunded.`);
        }

        // Show/hide specialty row (always hidden at creation; spheres capped at 3)
        const specRow = card.querySelector('.specialty-row');
        if (specRow) specRow.style.display = 'none';

        // Update rank display
        const rankEl = $(`#sphere-rank-${sphereId}`, content);
        if (rankEl && sphere) {
          const rv = c.spheres[sphereId];
          rankEl.innerHTML = rv > 0 ? sphere.ranks[rv-1]?.name || '' : '<em>Unlearned</em>';
        }

        // Update points display
        const total = Object.values(c.spheres).reduce((s, v) => s + v, 0);
        const remEl = $('#sphere-remaining', content);
        const sphNoteEl = $('#sphere-freebie-note', content);
        if (remEl) {
          const rem = M20.CREATION.sphereDots - total;
          const over = Math.max(0, -rem);
          remEl.textContent = Math.max(0, rem);
          remEl.style.color = 'var(--gold-bright)';
          if (sphNoteEl) {
            sphNoteEl.textContent = `+${over} via freebies`;
            sphNoteEl.style.display = over > 0 ? 'block' : 'none';
          }
        }
        this.updateFreebieDisplay();

        // Detail panel
        const detail = $('#sphere-rank-detail', content);
        if (detail && sphere && c.spheres[sphereId] > 0) {
          const rank = sphere.ranks[c.spheres[sphereId] - 1];
          detail.innerHTML = `
            <strong style="color:var(--purple-bright)">${sphere.name} ${c.spheres[sphereId]} — ${rank.name}</strong><br>
            <span style="color:var(--text-mid)">${rank.description}</span>`;
        }
      });

      // Show rank detail on hover
      card.addEventListener('mouseenter', () => {
        const detail = $('#sphere-rank-detail', content);
        if (!detail || !sphere) return;
        const rv = c.spheres[sphereId] || 0;
        if (rv > 0) {
          const rank = sphere.ranks[rv - 1];
          detail.innerHTML = `<strong style="color:var(--purple-bright)">${sphere.name} ${rv} — ${rank.name}</strong><br>
            <span style="color:var(--text-mid)">${rank.description}</span>`;
        } else {
          detail.innerHTML = `<strong style="color:var(--purple-dim)">${sphere.name}</strong><br>
            <span style="color:var(--text-dim)">${sphere.description}</span>`;
        }
      });
    });

    // Affinity sphere select (step 5)
    const affinitySelect = $('#affinity-select', content);
    if (affinitySelect) {
      affinitySelect.addEventListener('change', () => {
        c.affinity_sphere = affinitySelect.value;
        // Auto-add first dot if needed
        if (c.affinity_sphere && !c.spheres[c.affinity_sphere.toLowerCase().replace(/ /g,'')]) {
          const sphereObj = M20.SPHERES.find(s => s.name === c.affinity_sphere);
          if (sphereObj && !c.spheres[sphereObj.id]) c.spheres[sphereObj.id] = 1;
        }
        this.renderStep(); // Re-render to update highlights
      });
    }

    // Core stat dots (step 6) — identified by data-stat attribute
    const statMinima = { arete: 1, willpower: 1, quintessence: 0, paradox: 0 };
    $$('.dots[data-stat]', content).forEach(dotsEl => {
      const field = dotsEl.dataset.stat;
      if (!field) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        const cur = c[field] || 0;
        c[field] = cur === val ? Math.max(statMinima[field] ?? 0, val - 1) : val;
        this.refreshDots(dotsEl, c[field]);
        if (field === 'arete') this.updateAreteLabel();
        this.updateFreebieDisplay();
      });
    });

    // Instruments — checkboxes (built-in toggle state; custom items re-render on uncheck)
    $$('.instrument-item input', content).forEach(inp => {
      inp.addEventListener('change', () => {
        const instruments = c.instruments || [];
        if (inp.checked) {
          if (!instruments.includes(inp.value)) instruments.push(inp.value);
          c.instruments = instruments;
          inp.closest('.instrument-item').classList.add('checked');
        } else {
          c.instruments = instruments.filter(i => i !== inp.value);
          if (inp.dataset.custom) {
            this.renderStep(); // custom items disappear when unchecked
          } else {
            inp.closest('.instrument-item').classList.remove('checked');
          }
        }
      });
    });

    // Instruments — add custom
    const customInstrumentInput = $('#f-custom-instrument', content);
    const addCustomBtn = $('#btn-add-instrument', content);
    const addCustomInstrument = () => {
      if (!customInstrumentInput) return;
      const val = customInstrumentInput.value.trim();
      if (!val) return;
      if (!(c.instruments || []).includes(val)) {
        c.instruments = [...(c.instruments || []), val];
      }
      this.renderStep();
    };
    if (addCustomBtn) addCustomBtn.addEventListener('click', addCustomInstrument);
    if (customInstrumentInput) {
      customInstrumentInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addCustomInstrument(); }
      });
    }

    // Instruments — remove custom tag
    content.addEventListener('click', e => {
      const btn = e.target.closest('.instrument-tag-remove');
      if (!btn) return;
      const val = btn.dataset.instrument;
      c.instruments = (c.instruments || []).filter(i => i !== val);
      this.renderStep();
    });

    this.updateNatureWillpower();
    this.updateAreteLabel();

    // ── Step 6: Freebie panel dot listeners ───────────────────────
    if (this.step === 6) this.attachFreebieListeners(content);
  },

  attachFreebieListeners(content) {
    const c = this;
    const char = this.char;

    // Core stat rows (data-stat attribute)
    $$('.fb-row[data-stat]', content).forEach(row => {
      const stat    = row.dataset.stat;
      const costPer = parseFloat(row.dataset.cost) || 0;
      const max     = parseInt(row.dataset.max) || 10;
      const baseline = parseInt(row.dataset.baseline) || 0;
      const minVal  = baseline > 0 ? 1 : 0;
      const dotsEl  = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        const cur = char[stat] || minVal;
        // Freebie overspend guard
        const tentativeVal = cur === val ? Math.max(minVal, val - 1) : Math.min(max, val);
        const oldCost = Math.max(0, cur - baseline) * costPer;
        const newCost = Math.max(0, tentativeVal - baseline) * costPer;
        const delta   = newCost - oldCost;
        if (delta > 0 && !c.canSpendFreebie(delta)) {
          toast(`Not enough freebie points (need ${delta}, have ${c.freebiesRemaining()}).`, 'error');
          return;
        }
        if (stat === 'arete') {
          const areteMin = c.maxSphere();
          if (val < areteMin) {
            App.showToast('Arete must be at least ' + areteMin + ' \u2014 your highest Sphere is ' + areteMin, 'error');
            return;
          }
          char[stat] = cur === val ? Math.max(areteMin, val - 1) : Math.min(max, val);
        } else {
          char[stat] = cur === val ? Math.max(minVal, val - 1) : Math.min(max, val);
        }
        c.refreshFreebieRow(row, char[stat]);
        if (stat === 'arete') c.updateAreteLabel();
        c.updateFreebieBank();
      });
    });

    // Attribute rows (data-fb-id, inside fb-attrs)
    const attrGroups = {
      Physical: ['strength','dexterity','stamina'],
      Social:   ['charisma','manipulation','appearance'],
      Mental:   ['perception','intelligence','wits'],
    };
    const attrPri   = char.attr_priority || ['Physical','Social','Mental'];
    const attrAlloc = { Physical:[7,5,3][attrPri.indexOf('Physical')]??0,
                        Social:  [7,5,3][attrPri.indexOf('Social')]  ??0,
                        Mental:  [7,5,3][attrPri.indexOf('Mental')]  ??0 };

    $$('#fb-attrs .fb-row[data-fb-id]', content).forEach(row => {
      const id      = row.dataset.fbId;
      const max     = parseInt(row.dataset.max) || 5;
      const dotsEl  = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        const cur = char[id] || 1;
        char[id]  = cur === val ? Math.max(1, val - 1) : Math.min(max, val);
        // Refresh all rows in this attribute group (baselines read from data-baseline)
        const groupEl = row.closest('.fb-group');
        if (groupEl) {
          const groupLabel = groupEl.querySelector('.fb-group-label').textContent.split(' ')[0];
          const groupIds   = attrGroups[groupLabel] || [];
          groupIds.forEach((aid, idx) => {
            const aRow = groupEl.querySelectorAll('.fb-row[data-fb-id]')[idx];
            if (aRow) c.refreshFreebieRow(aRow, char[aid] || 1);
          });
        }
        // Show/hide specialty row
        const specRow = row.nextElementSibling;
        if (specRow && specRow.classList.contains('fb-specialty-row')) {
          specRow.style.display = char[id] >= 4 ? '' : 'none';
          if (char[id] < 4) {
            delete char.specialties[id];
            const inp = specRow.querySelector('.specialty-input');
            if (inp) inp.value = '';
          }
        }
        c.updateFreebieBank();
      });
    });

    // Ability rows
    const abilityMap = { Talents:'talents', Skills:'skills', Knowledges:'knowledges' };
    const abilPri    = char.ability_priority || ['Talents','Skills','Knowledges'];
    const abilAlloc  = { Talents:   [13,9,5][abilPri.indexOf('Talents')]   ??0,
                          Skills:    [13,9,5][abilPri.indexOf('Skills')]    ??0,
                          Knowledges:[13,9,5][abilPri.indexOf('Knowledges')]??0 };

    $$('#fb-abilities .fb-row[data-fb-id]', content).forEach(row => {
      const id     = row.dataset.fbId;
      const max    = parseInt(row.dataset.max) || 5;
      const dotsEl = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        // Find which category key this ability belongs to
        let catKey = null;
        if (M20.TALENTS.find(a => a.id === id))    catKey = 'talents';
        if (M20.SKILLS.find(a => a.id === id))     catKey = 'skills';
        if (M20.KNOWLEDGES.find(a => a.id === id)) catKey = 'knowledges';
        if (!catKey) return;
        const cur = char[catKey][id] || 0;
        char[catKey][id] = cur === val ? Math.max(0, val-1) : Math.min(max, val);
        c.refreshFreebieRow(row, char[catKey][id]);
        // Show/hide specialty row
        const specThreshold = GENERAL_ABILITY_IDS.has(id) ? 1 : 4;
        const specRow = row.nextElementSibling;
        if (specRow && specRow.classList.contains('fb-specialty-row')) {
          specRow.style.display = char[catKey][id] >= specThreshold ? '' : 'none';
          if (char[catKey][id] < specThreshold) {
            delete char.specialties[id];
            const inp = specRow.querySelector('.specialty-input');
            if (inp) inp.value = '';
          }
        }
        c.updateFreebieBank();
      });
    });

    // Background rows
    $$('#fb-bgs .fb-row[data-fb-id]', content).forEach(row => {
      const id     = row.dataset.fbId;
      const max    = parseInt(row.dataset.max) || 5;
      const dotsEl = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        const cur = char.backgrounds[id] || 0;
        char.backgrounds[id] = cur === val ? Math.max(0,val-1) : Math.min(max,val);
        c.refreshFreebieRow(row, char.backgrounds[id]);
        const descEl = row.querySelector('.fb-row-desc');
        if (descEl) {
          const bgDef = M20.BACKGROUNDS.find(b => b.id === id);
          descEl.textContent = bgDef?.levels && char.backgrounds[id] > 0 ? bgDef.levels[char.backgrounds[id] - 1] : '';
        }
        c.updateFreebieBank();
      });
    });

    // Sphere rows
    $$('#fb-spheres .fb-row[data-fb-id]', content).forEach(row => {
      const id     = row.dataset.fbId;
      const max    = parseInt(row.dataset.max) || 5;
      const dotsEl = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const val = parseInt(dot.dataset.val);
        const cur = char.spheres[id] || 0;
        const sphereNewVal = cur === val ? Math.max(0,val-1) : Math.min(max,val);
        char.spheres[id] = sphereNewVal;
        if (c.calcFreebies().total > M20.CREATION.freebiePoints) {
          char.spheres[id] = cur;
          toast(`Not enough freebie points (${c.freebiesRemaining()} remaining).`, 'error');
          return;
        }
        // Auto-raise Arete if the new sphere rating exceeds it
        const newMin = c.maxSphere();
        if ((char.arete || 1) < newMin) {
          char.arete = newMin;
          const areteRow = content.querySelector('.fb-row[data-stat="arete"]');
          if (areteRow) c.refreshFreebieRow(areteRow, char.arete);
          c.updateAreteLabel();
        }
        c.refreshFreebieRow(row, char.spheres[id]);
        // Show/hide specialty row
        const specRow = row.nextElementSibling;
        if (specRow && specRow.classList.contains('fb-specialty-row')) {
          specRow.style.display = char.spheres[id] >= 4 ? '' : 'none';
          if (char.spheres[id] < 4) {
            delete char.specialties[id];
            const inp = specRow.querySelector('.specialty-input');
            if (inp) inp.value = '';
          }
        }
        c.updateFreebieBank();
      });
    });

    // Merits & Flaws card listeners
    this.attachMFListeners(content);
    this.updateMFDisplay();

    // Initial bank render
    this.updateFreebieBank();
  },

  attachMFListeners(content) {
    const c = this;
    const char = this.char;

    ['fb-merits', 'fb-flaws'].forEach(gridId => {
      const grid = document.getElementById(gridId);
      if (!grid) return;
      const kind  = gridId === 'fb-merits' ? 'merit' : 'flaw';
      const store = kind === 'merit' ? char.merits : char.flaws;
      const list  = kind === 'merit' ? M20.MERITS   : M20.FLAWS;

      grid.addEventListener('click', e => {
        // "+ Take" / "+ Add Another" button
        const addBtn = e.target.closest('.mf-add-btn');
        if (addBtn) {
          e.stopPropagation();
          const id   = addBtn.dataset.id;
          const item = list.find(i => i.id === id);
          if (!item) return;
          const cost = Array.isArray(item.cost) ? item.cost[0] : item.cost;
          if (kind === 'merit' && !c.canSpendFreebie(cost)) {
            toast('Not enough freebie points to take ' + item.name + '.', 'error'); return;
          }
          if (kind === 'flaw' && c.calcFlawBonus() + cost > 7) {
            toast('Flaw bonus cap reached (max +7 pts from flaws).', 'error'); return;
          }
          if (!Array.isArray(store[id])) store[id] = [];
          store[id].push(cost);
          c.updateFreebieBank();
          return;
        }

        // "×" Remove instance button
        const removeBtn = e.target.closest('.mf-remove-btn');
        if (removeBtn) {
          e.stopPropagation();
          const id  = removeBtn.dataset.id;
          const idx = parseInt(removeBtn.dataset.idx);
          if (Array.isArray(store[id])) {
            store[id].splice(idx, 1);
            if (store[id].length === 0) delete store[id];
          }
          c.updateFreebieBank();
          return;
        }

        // Cost select — let change handle the value; just stop propagation
        if (e.target.closest('.mf-cost-select')) {
          e.stopPropagation();
          return;
        }

        // Card click
        const card = e.target.closest('.mf-card');
        if (!card) return;
        const id   = card.dataset.id;
        const item = list.find(i => i.id === id);
        if (!item) return;
        const cost = Array.isArray(item.cost) ? item.cost[0] : item.cost;

        if (item.repeatable) {
          // Clicking a repeatable card with no instances → add first instance
          const existing = store[id];
          if (!existing || (Array.isArray(existing) && existing.length === 0)) {
            if (kind === 'merit' && !c.canSpendFreebie(cost)) {
              toast('Not enough freebie points to take ' + item.name + '.', 'error'); return;
            }
            if (kind === 'flaw' && c.calcFlawBonus() + cost > 7) {
              toast('Flaw bonus cap reached (max +7 pts from flaws).', 'error'); return;
            }
            store[id] = [cost];
            c.updateFreebieBank();
          }
          // If already has instances, do nothing (use + / × buttons)
          return;
        }

        // Non-repeatable: toggle on/off
        if (store[id] !== undefined) {
          delete store[id];
        } else {
          if (kind === 'merit' && !c.canSpendFreebie(cost)) {
            toast('Not enough freebie points to take ' + item.name + '.', 'error'); return;
          }
          if (kind === 'flaw' && c.calcFlawBonus() + cost > 7) {
            toast('Flaw bonus cap reached (max +7 pts from flaws).', 'error'); return;
          }
          store[id] = cost;
        }
        c.updateFreebieBank();
      });

      // Cost selects (both variable non-repeatable and per-instance)
      grid.addEventListener('change', e => {
        const sel = e.target.closest('.mf-cost-select');
        if (!sel) return;
        const id      = sel.dataset.id;
        const newCost = parseInt(sel.value);

        if (sel.dataset.idx !== undefined) {
          // Repeatable instance cost change
          const idx = parseInt(sel.dataset.idx);
          if (!Array.isArray(store[id])) return;
          const oldCost = store[id][idx];
          store[id][idx] = newCost; // tentatively apply
          if (kind === 'merit' && c.calcFreebies().total > M20.CREATION.freebiePoints) {
            store[id][idx] = oldCost; // revert
            sel.value = oldCost;
            toast('Not enough freebie points for that option.', 'error');
            return;
          }
        } else {
          // Non-repeatable variable cost change
          const oldCost = store[id];
          store[id] = newCost; // tentatively apply
          if (kind === 'merit' && c.calcFreebies().total > M20.CREATION.freebiePoints) {
            store[id] = oldCost; // revert
            sel.value = oldCost;
            toast('Not enough freebie points for that option.', 'error');
            return;
          }
        }
        c.updateFreebieBank();
      });
    });

    // M&F and other view toggle buttons in step 6
    $$('.view-toggle-btn[data-pref]', content).forEach(btn => {
      btn.addEventListener('click', () => {
        const pref = btn.dataset.pref;
        const val  = btn.dataset.val;
        UiPrefs.set(pref, val);
        // Update button active states
        $$('.view-toggle-btn[data-pref="' + pref + '"]', content).forEach(b => {
          b.classList.toggle('vt-active', b.dataset.val === val);
        });
        // Update the mf container classes and re-render cards
        const newClass = val === 'list' ? 'mf-list' : 'mf-grid';
        ['fb-merits', 'fb-flaws'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.className = newClass;
        });
        this.updateMFDisplay();
      });
    });
  },

  // Refresh a single fb-row's dots and cost display in place.
  // Always reads baseline, cost, and max from the row's own data-* attributes
  // (set during renderStep6 with the correct per-trait creation baseline).
  refreshFreebieRow(row, val) {
    const baseline = parseFloat(row.dataset.baseline) || 0;
    const costPer  = parseFloat(row.dataset.cost)     || 1;
    const max      = parseInt(row.dataset.max)         || 5;
    const dotsEl = row.querySelector('.dots');
    if (dotsEl) {
      dotsEl.querySelectorAll('.dot').forEach((dot, i) => {
        const dotVal = i + 1;
        dot.classList.toggle('filled', dotVal <= val);
        dot.classList.toggle('dot-free',    dotVal <= baseline);
        dot.classList.toggle('dot-freebie', dotVal >  baseline);
      });
    }
    const costEl = row.querySelector('.fb-row-cost');
    if (costEl) {
      const extra = Math.max(0, val - baseline);
      // Quintessence is 1 pt per 4 dots
      const spent = (costPer === 1 && row.dataset.stat === 'quintessence')
        ? Math.ceil(extra / 4)
        : extra * costPer;
      costEl.innerHTML = spent > 0
        ? `<span class="fb-cost-badge">${spent} pt${spent>1?'s':''}</span>`
        : `<span class="fb-cost-free">free</span>`;
    }
  },

  // Update the freebie bank pips and number in the DOM without re-rendering the step
  updateFreebieBank() {
    const { total } = this.calcFreebies();
    const remaining = M20.CREATION.freebiePoints - total;

    // Update sidebar
    const sideEl = $('#freebie-display');
    if (sideEl) {
      sideEl.textContent = remaining;
      sideEl.style.color = remaining < 0 ? 'var(--crimson)' : 'var(--gold-bright)';
    }
    this.updateFreebieTooltip();

    // Update bank pips
    const bar = $('#fb-bar');
    if (bar) {
      bar.querySelectorAll('.fb-pip').forEach((pip, i) => {
        pip.classList.toggle('available', i < remaining);
        pip.classList.toggle('spent',     i >= remaining);
      });
    }

    // Update number
    const remEl = $('#fb-remaining');
    if (remEl) {
      remEl.textContent = remaining;
      remEl.className = remaining < 0 ? 'fb-over' : '';
    }

    // Update section costs
    this.updateSectionCost('fb-cost-attrs', this.calcAttrFreebies());
    this.updateSectionCost('fb-cost-abilities', this.calcAbilityFreebies());
    this.updateSectionCost('fb-cost-bgs', this.calcBgFreebies());
    this.updateSectionCost('fb-cost-spheres', this.calcSphereFreebies());
    this.updateMFDisplay();
    this.updateAreteNotice();
  },

  updateSectionCost(id, cost) {
    const el = $(`#${id}`);
    if (!el) return;
    el.textContent = cost > 0 ? `— ${cost} pts spent` : '';
    el.style.color = cost > 0 ? 'var(--gold-mid)' : '';
  },

  calcAttrFreebies() {
    const c = this.char;
    if (this._lockedBaselines) {
      // Use per-trait locked baselines for accuracy (matches dot coloring)
      return Object.entries(this._lockedBaselines.attrs).reduce((total, [id, baseline]) => {
        return total + Math.max(0, (c[id]||1) - baseline) * 5;
      }, 0);
    }
    // Fallback: group-level calculation (before step 6 is entered)
    const pri = c.attr_priority || ['Physical','Social','Mental'];
    const groups = { Physical:['strength','dexterity','stamina'], Social:['charisma','manipulation','appearance'], Mental:['perception','intelligence','wits'] };
    let total = 0;
    ['Physical','Social','Mental'].forEach(cat => {
      const alloc = [7,5,3][pri.indexOf(cat)] ?? 0;
      const used  = groups[cat].reduce((s,id) => s + Math.max(0,(c[id]||1)-1), 0);
      total += Math.max(0, used - alloc) * 5;
    });
    return total;
  },

  calcAbilityFreebies() {
    const c = this.char;
    const groups = {
      Talents:    { key: 'talents',    data: M20.TALENTS,    sec: M20.SECONDARY_TALENTS },
      Skills:     { key: 'skills',     data: M20.SKILLS,     sec: M20.SECONDARY_SKILLS },
      Knowledges: { key: 'knowledges', data: M20.KNOWLEDGES, sec: M20.SECONDARY_KNOWLEDGES },
    };
    let total = 0;
    if (this._lockedBaselines) {
      // Use per-trait locked baselines (matches dot coloring)
      const lb = this._lockedBaselines.abilities;
      ['Talents','Skills','Knowledges'].forEach(cat => {
        const { key, data, sec } = groups[cat];
        data.forEach(a => {
          total += Math.max(0, (c[key][a.id]||0) - (lb[a.id]??0)) * 2;
        });
        // Secondary abilities: use locked baseline (may be > 0 if covered by allocation)
        sec.filter(a => c[key][a.id] !== undefined).forEach(a => {
          total += Math.max(0, (c[key][a.id]||0) - (lb[a.id]??0)) * 3;
        });
        // Custom abilities: same as secondary
        Object.keys(c.custom_ability_names || {}).filter(id => c[key][id] !== undefined).forEach(id => {
          total += Math.max(0, (c[key][id]||0) - (lb[id]??0)) * 3;
        });
      });
    } else {
      // Fallback: group-level calculation (before step 6 baselines are locked)
      const pri = c.ability_priority || ['Talents','Skills','Knowledges'];
      ['Talents','Skills','Knowledges'].forEach(cat => {
        const alloc = [13,9,5][pri.indexOf(cat)] ?? 0;
        const { key, data, sec } = groups[cat];
        const primaryUsed = data.reduce((s,a) => s + (c[key][a.id]||0), 0);
        const addedSec    = sec.filter(a => c[key][a.id] !== undefined);
        const secDots     = addedSec.reduce((s,a) => s + (c[key][a.id]||0), 0);
        const custIds     = Object.keys(c.custom_ability_names || {}).filter(id => c[key][id] !== undefined);
        const custDots    = custIds.reduce((s,id) => s + (c[key][id]||0), 0);
        const nonPrimDots = secDots + custDots;
        // Primary over-allocation: 2 pts/dot
        total += Math.max(0, primaryUsed - alloc) * 2;
        // Secondary/custom: consume remaining allocation first, then 3 pts/dot
        const remainingAlloc = Math.max(0, alloc - primaryUsed);
        const nonPrimOverAlloc = Math.max(0, nonPrimDots - remainingAlloc);
        total += nonPrimOverAlloc * 3;
      });
    }
    return total;
  },

  calcBgFreebies() {
    const c = this.char;
    if (this._lockedBaselines) {
      const lb = this._lockedBaselines.backgrounds;
      return Object.entries(c.backgrounds||{}).reduce((total, [id, val]) => {
        const bg = M20.BACKGROUNDS.find(b => b.id === id);
        const costPer = bg?.doubleCost ? 2 : 1;
        return total + Math.max(0, val - (lb[id]??0)) * costPer;
      }, 0);
    }
    // Fallback: weighted total vs creation pool
    const bgAff = c.affiliation || 'Traditions';
    const weightedTotal = filteredBackgrounds(bgAff).reduce((s, bg) => {
      return s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1);
    }, 0);
    return Math.max(0, weightedTotal - M20.CREATION.backgroundDots);
  },

  calcSphereFreebies() {
    const c = this.char;
    if (this._lockedBaselines) {
      const lb = this._lockedBaselines.spheres;
      return Object.entries(c.spheres||{}).reduce((total, [id, val]) => {
        return total + Math.max(0, val - (lb[id]??0)) * 7;
      }, 0);
    }
    const total = Object.values(c.spheres||{}).reduce((s,v)=>s+v,0);
    return Math.max(0, total - M20.CREATION.sphereDots) * 7;
  },

  refreshDots(dotsEl, val) {
    dotsEl.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < val);
    });
  },

  refreshAttrPoints(block, changedId) {
    const header = block.querySelector('.attr-block-points');
    if (!header) return;
    const title = block.querySelector('.attr-block-title').textContent.toLowerCase();
    const c = this.char;
    let attrs;
    if (title.includes('physical')) attrs = ['strength','dexterity','stamina'];
    else if (title.includes('social')) attrs = ['charisma','manipulation','appearance'];
    else attrs = ['perception','intelligence','wits'];

    const pri = c.attr_priority;
    const cat = title.includes('physical') ? 'Physical' : title.includes('social') ? 'Social' : 'Mental';
    const rank = pri.indexOf(cat);
    const total = [7,5,3][rank] || 0;
    const used  = attrs.reduce((s, a) => s + Math.max(0, (c[a] || 1) - 1), 0);
    const rem = total - used;
    const over = Math.max(0, -rem);
    header.innerHTML = `<span class="pts">${Math.max(0, rem)}</span> / ${total} pts remaining${over > 0 ? ` <span class="pts-freebie">+${over} via freebies</span>` : ''}`;
  },

  refreshAbilityPoints(block, cat) {
    const header = block.querySelector('.attr-block-points');
    if (!header) return;
    const c    = this.char;
    const data = cat === 'talents' ? M20.TALENTS : cat === 'skills' ? M20.SKILLS : M20.KNOWLEDGES;
    const sec  = cat === 'talents' ? M20.SECONDARY_TALENTS : cat === 'skills' ? M20.SECONDARY_SKILLS : M20.SECONDARY_KNOWLEDGES;
    const pri  = c.ability_priority;
    const catLabel = cat === 'talents' ? 'Talents' : cat === 'skills' ? 'Skills' : 'Knowledges';
    const rank  = pri.indexOf(catLabel);
    const total = [13,9,5][rank] || 0;
    const primaryUsed = data.reduce((s, a) => s + (c[cat][a.id] || 0), 0);
    const secUsed     = sec.filter(a => c[cat][a.id] !== undefined).reduce((s, a) => s + (c[cat][a.id] || 0), 0);
    const custIds     = Object.keys(c.custom_ability_names || {}).filter(id => c[cat][id] !== undefined);
    const custUsed    = custIds.reduce((s, id) => s + (c[cat][id] || 0), 0);
    const used = primaryUsed + secUsed + custUsed;
    const rem = total - used;
    const over = Math.max(0, -rem);
    header.innerHTML = `<span class="pts">${Math.max(0, rem)}</span> / ${total} pts · max 3 per ability${over > 0 ? ` <span class="pts-freebie">+${over} via freebies</span>` : ''}`;
  },

  updateNatureWillpower() {
    const el = $('#nature-wp');
    if (!el) return;
    const name = this.char.nature;
    if (!name) { el.textContent = ''; return; }
    const arch = M20.ARCHETYPES.find(a => a.name === name)
      || (this.char.customArchetypes || []).find(a => a.name === name);
    el.textContent = arch?.willpower ? `Regain Willpower when: ${arch.willpower}` : '';
  },

  // Sum a merit/flaw store value: number (single) or array (repeatable instances)
  mfSum(v) {
    return Array.isArray(v) ? v.reduce((a, b) => a + b, 0) : (typeof v === 'number' ? v : 0);
  },

  calcMeritCost() {
    return Object.values(this.char.merits || {}).reduce((s, v) => s + this.mfSum(v), 0);
  },

  calcFlawBonus() {
    const raw = Object.values(this.char.flaws || {}).reduce((s, v) => s + this.mfSum(v), 0);
    return Math.min(raw, 7);
  },

  updateMFDisplay() {
    // Refresh merit card states
    const meritsEl = document.getElementById('fb-merits');
    if (meritsEl) this.renderMFCards(meritsEl, M20.MERITS, this.char.merits, 'merit');
    const flawsEl  = document.getElementById('fb-flaws');
    if (flawsEl)  this.renderMFCards(flawsEl,  M20.FLAWS,  this.char.flaws,  'flaw');
    // Update cost/bonus badges
    const mc = document.getElementById('mf-cost-merits');
    if (mc) {
      const cost = this.calcMeritCost();
      mc.textContent = cost > 0 ? `— ${cost} pts spent` : '';
      mc.style.color = cost > 0 ? 'var(--gold-mid)' : '';
    }
    const fc = document.getElementById('mf-cost-flaws');
    if (fc) {
      const bonus = this.calcFlawBonus();
      fc.textContent = bonus > 0 ? `— +${bonus} pts granted` : '';
      fc.style.color = bonus > 0 ? 'var(--purple-mid)' : '';
    }
  },

  renderMFCards(container, list, selected, kind) {
    const key = JSON.stringify(selected);
    if (container.dataset.lastKey === key) return;
    container.dataset.lastKey = key;

    container.innerHTML = list.map(item => {
      const costs      = Array.isArray(item.cost) ? item.cost : [item.cost];
      const isRepeat   = !!item.repeatable;
      const catClass   = 'mf-cat-' + item.category.toLowerCase().replace(/\s+/g, '-');

      // Resolve active instances
      let instances = [];
      let isActive  = false;
      if (isRepeat) {
        const raw = selected[item.id];
        instances = Array.isArray(raw) ? raw : (raw !== undefined ? [raw] : []);
        isActive  = instances.length > 0;
      } else {
        isActive = selected[item.id] !== undefined;
      }

      // ── Header cost display ─────────────────────────────────────
      let costDisplay;
      if (isRepeat) {
        if (isActive) {
          const tot = instances.reduce((s, v) => s + v, 0);
          costDisplay = tot + ' pt' + (tot !== 1 ? 's' : '') + ' total';
        } else {
          costDisplay = costs.length > 1
            ? costs.join('/') + ' pt ea'
            : costs[0] + ' pt' + (costs[0] !== 1 ? 's' : '') + ' ea';
        }
      } else if (isActive) {
        costDisplay = costs.length > 1
          ? '<select class="mf-cost-select" data-id="' + item.id + '">'
            + costs.map(v => '<option value="' + v + '"' + (v === selected[item.id] ? ' selected' : '') + '>' + v + ' pt</option>').join('')
            + '</select>'
          : selected[item.id] + ' pt' + (selected[item.id] !== 1 ? 's' : '');
      } else {
        costDisplay = costs.length > 1
          ? costs.join('/') + ' pt'
          : costs[0] + ' pt' + (costs[0] !== 1 ? 's' : '');
      }

      // ── Instance rows (repeatable only) ─────────────────────────
      let instancesHtml = '';
      if (isRepeat && isActive) {
        instancesHtml = '<div class="mf-instances">'
          + instances.map((instCost, idx) => {
            const costEl = costs.length > 1
              ? '<select class="mf-cost-select" data-id="' + item.id + '" data-idx="' + idx + '">'
                + costs.map(v => '<option value="' + v + '"' + (v === instCost ? ' selected' : '') + '>' + v + ' pt</option>').join('')
                + '</select>'
              : '<span class="mf-instance-cost">' + instCost + ' pt' + (instCost !== 1 ? 's' : '') + '</span>';
            return '<div class="mf-instance">'
              + '<span class="mf-instance-label">#' + (idx + 1) + '</span>'
              + costEl
              + '<button class="mf-remove-btn" data-id="' + item.id + '" data-idx="' + idx + '" title="Remove">×</button>'
              + '</div>';
          }).join('')
          + '</div>';
      }

      // ── Add button (repeatable only) ────────────────────────────
      const addBtn = isRepeat
        ? '<button class="mf-add-btn" data-id="' + item.id + '">'
          + (isActive ? '+ Add Another' : '+ Take') + '</button>'
        : '';

      const safeDesc = (item.description || '').replace(/"/g, '&quot;');
      return '<div class="mf-card'
        + (isActive   ? ' mf-active'    : '')
        + (isRepeat   ? ' mf-repeatable': '')
        + ' ' + catClass
        + '" data-id="' + item.id + '" data-kind="' + kind + '" data-desc="' + safeDesc + '">'
        + '<div class="mf-card-top">'
        + '<span class="mf-card-name">' + item.name + '</span>'
        + '<span class="mf-card-cost">' + costDisplay + '</span>'
        + '</div>'
        + '<div class="mf-card-desc">' + item.description + '</div>'
        + instancesHtml
        + addBtn
        + '<div class="mf-card-page">p. ' + item.page + '</div>'
        + '</div>';
    }).join('');
  },

  maxSphere() {
    return Object.values(this.char.spheres || {}).reduce((m, v) => Math.max(m, v), 0);
  },

  updateAreteNotice() {
    const el = document.getElementById('arete-sphere-notice');
    if (!el) return;
    const min = this.maxSphere();
    if (min <= 1) { el.innerHTML = ''; el.className = 'arete-sphere-notice'; return; }
    const { total } = this.calcFreebies();
    const remaining = M20.CREATION.freebiePoints - total;
    const over = remaining < 0;
    el.className = 'arete-sphere-notice' + (over ? ' arete-over-budget' : '');
    el.innerHTML = '\uD83D\uDD12 Arete locked to <strong>' + min + '</strong> \u2014 must equal your highest Sphere rating.'
      + (over
          ? ' <span class="arete-budget-error">\u26A0 <strong>' + Math.abs(remaining)
            + ' freebie point' + (Math.abs(remaining) === 1 ? '' : 's')
            + ' over budget!</strong> Reduce other spending or lower your Sphere ratings.</span>'
          : '');
  },

  updateAreteLabel() {
    const el = $('#arete-label');
    if (!el) return;
    el.textContent = M20.ARETE_LABELS[this.char.arete] || '';
  },
};

/* ─── Bootstrap ──────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  // Sync theme button icon with whatever the FOUC-prevention script applied
  App._updateThemeBtn(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  // If a shared sheet URL (/s/:token), load in shared mode (no login required)
  const shareMatch = window.location.pathname.match(/^\/s\/([a-f0-9]{32})$/);
  if (shareMatch) {
    await App.loadSharedSheet(shareMatch[1]);
    // still wire up sidebar step-list and popstate below, but skip the login check
    return;
  }

  // If a password reset token is in the URL, show the reset form immediately
  if (new URLSearchParams(window.location.search).get('token')) {
    App.showPage('auth');
    Auth.showReset();
    return; // skip the normal session check
  }

  // Check if already logged in
  try {
    const r = await fetch('/api/auth/me');
    if (r.ok) {
      const user = await r.json();
      App.setUser(user);
      App.showDashboard();
    } else {
      App.showPage('auth');
    }
  } catch {
    App.showPage('auth');
  }

  // Click any step in the sidebar to jump directly to it
  document.getElementById('step-list')?.addEventListener('click', e => {
    const item = e.target.closest('.step-item');
    if (!item) return;
    const s = parseInt(item.dataset.step);
    if (!isNaN(s) && s !== Creator.step) {
      Creator.step = s;
      Creator.renderStep();
      // Push history so the back button can return to the previous step
      const stepState = { page: 'creator', step: s };
      if (Creator.editId) stepState.charId = Creator.editId;
      history.pushState(stepState, '', location.pathname);
    }
  });

  // Browser back/forward navigation
  window.addEventListener('popstate', async (e) => {
    const state = e.state;
    if (!state || !App.currentUser) return;
    App._popping = true;
    try {
      if (state.page === 'sheet' && state.charId) {
        await App.viewCharacter(state.charId);
      } else if (state.page === 'creator') {
        const targetStep = state.step ?? 0;
        // Re-load the character only if it's not already in memory or it's a different one
        if (!Creator.char || (state.charId && Creator.editId !== state.charId)) {
          if (state.charId) await App.editCharacter(state.charId);
          else App.startNewCharacter();
        } else {
          App.showPage('creator');
        }
        // Override to the target step if different from what was just rendered
        if (Creator.step !== targetStep) {
          Creator.step = targetStep;
          Creator.renderStep();
        }
      } else if (state.page === 'roster') {
        await App.showRoster();
      } else if (state.page === 'dashboard') {
        await App.showDashboard();
      } else if (state.page === 'admin') {
        App.showPage('admin');
      } else if (state.page === 'about') {
        App.showAbout();
      } else if (state.page === 'shared' && state.token) {
        await App.loadSharedSheet(state.token);
      }
    } finally {
      App._popping = false;
    }
  });
});
