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

/* ═══════════════════════════════════════════════════════════════
   APP — Page routing & roster
   ═══════════════════════════════════════════════════════════════ */
const App = {
  currentCharId: null,
  currentUser: null,

  setUser(user) {
    this.currentUser = user;
    $('#user-name').textContent = user.username;
    $('#user-info').style.display = 'flex';
    $('#nav-dashboard').style.display = '';
    $('#nav-roster').style.display = '';
    $('#nav-create').style.display = '';
    $('#nav-logout').style.display = '';
    if (user.role === 'admin') {
      $('#nav-admin').style.display = '';
      $('#admin-badge').style.display = 'inline';
    } else {
      $('#nav-admin').style.display = 'none';
      $('#admin-badge').style.display = 'none';
    }
  },

  clearUser() {
    this.currentUser = null;
    $('#user-info').style.display = 'none';
    ['nav-dashboard','nav-roster','nav-create','nav-admin','nav-logout'].forEach(id => {
      $(`#${id}`).style.display = 'none';
    });
    $('#admin-badge').style.display = 'none';
  },

  async showDashboard() {
    this.showPage('dashboard');
    const greeting = $('#dashboard-greeting');
    if (this.currentUser) greeting.textContent = `Welcome back, ${this.currentUser.username}`;
    const grid  = $('#dashboard-cards');
    const empty = $('#dashboard-empty');
    try {
      const r = await fetch('/api/characters/recent');
      if (!r.ok) throw new Error();
      const chars = await r.json();
      if (!Array.isArray(chars) || chars.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = chars.map(c => this.renderCard(c)).join('');
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
      const users = await r.json();
      const me = this.currentUser;
      content.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Role</th>
              <th>Chars</th><th>Status</th><th>Actions</th>
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
                <td style="text-align:center">${u.character_count}</td>
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

  showPage(id) {
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${id}`).classList.add('active');
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    if (id === 'dashboard') $('#nav-dashboard').classList.add('active');
    if (id === 'roster')    $('#nav-roster').classList.add('active');
    if (id === 'creator')   $('#nav-create').classList.add('active');
    if (id === 'admin')     $('#nav-admin').classList.add('active');
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

  renderCard(c) {
    const tradition = c.tradition || c.affiliation || '—';
    const concept   = c.concept || '—';
    return `
      <div class="character-card" onclick="App.viewCharacter(${c.id})">
        <div class="card-tradition">${tradition}</div>
        <div class="card-name">${c.name}</div>
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
      Sheet.render(char);
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
      $('#nav-create').classList.add('active');
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

  closeModal() {
    $('#modal-overlay').style.display = 'none';
    // Reset confirm button to neutral state for next use
    const btn = $('#modal-confirm');
    if (btn) { btn.textContent = 'Confirm'; btn.className = 'btn-danger'; btn.onclick = null; }
  },
};

/* ═══════════════════════════════════════════════════════════════
   AUTH — Login / Registration
   ═══════════════════════════════════════════════════════════════ */
const Auth = {
  showTab(tab) {
    $('#form-login').style.display  = tab === 'login'    ? 'flex' : 'none';
    $('#form-register').style.display = tab === 'register' ? 'flex' : 'none';
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    $(`#tab-${tab}`).classList.add('active');
  },

  async login(e) {
    e.preventDefault();
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    const errEl = $('#login-error');
    errEl.style.display = 'none';
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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
    const errEl = $('#reg-error');
    errEl.style.display = 'none';
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

  render(char) {
    this.char = char;
    const content = $('#sheet-content');

    const specialties = char.specialties || {};

    const allSpheres = M20.SPHERES.map(s => {
      const val  = (char.spheres || {})[s.id] || 0;
      if (val === 0) return null;
      const spec = specialties[s.id];
      return `<div class="sheet-trait-row">
        <span class="sheet-trait-name">${s.name}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
        ${dots(val, 5, 'readonly sphere-dots')}
      </div>`;
    }).filter(Boolean).join('') || '<p style="color:var(--text-faint);font-size:0.82rem">No spheres allocated</p>';

    const allTalents = M20.TALENTS.map(a => this.traitRow(a, (char.talents || {})[a.id], specialties)).join('');
    const allSkills  = M20.SKILLS.map(a => this.traitRow(a, (char.skills || {})[a.id], specialties)).join('');
    const allKnow    = M20.KNOWLEDGES.map(a => this.traitRow(a, (char.knowledges || {})[a.id], specialties)).join('');

    const bgs = Object.entries(char.backgrounds || {})
      .filter(([,v]) => v > 0)
      .map(([k, v]) => {
        const bg = M20.BACKGROUNDS.find(b => b.id === k);
        return bg ? `<div class="sheet-trait-row"><span class="sheet-trait-name">${bgDisplayName(bg, char.affiliation)}</span>${dots(v, 5, 'readonly')}</div>` : '';
      }).join('') || '<p style="color:var(--text-faint);font-size:0.82rem">No backgrounds selected</p>';

    const instruments = (Array.isArray(char.instruments) ? char.instruments : []).join(', ') || '—';

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

      <div class="sheet-body">
        <!-- Attributes Column -->
        <div class="sheet-column">
          <div class="sheet-section">
            <div class="sheet-section-title">Physical <span class="page-ref">p. 258</span></div>
            ${this.attrRow('Strength',    char.strength,    specialties)}
            ${this.attrRow('Dexterity',   char.dexterity,   specialties)}
            ${this.attrRow('Stamina',     char.stamina,     specialties)}
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Social <span class="page-ref">p. 258</span></div>
            ${this.attrRow('Charisma',    char.charisma,    specialties)}
            ${this.attrRow('Manipulation',char.manipulation,specialties)}
            ${this.attrRow('Appearance',  char.appearance,  specialties)}
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Mental <span class="page-ref">p. 258</span></div>
            ${this.attrRow('Perception',  char.perception,  specialties)}
            ${this.attrRow('Intelligence',char.intelligence,specialties)}
            ${this.attrRow('Wits',        char.wits,        specialties)}
          </div>
        </div>

        <!-- Abilities Column -->
        <div class="sheet-column">
          <div class="sheet-section">
            <div class="sheet-section-title">Talents <span class="page-ref">p. 275</span></div>
            ${allTalents}
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Skills <span class="page-ref">p. 279</span></div>
            ${allSkills}
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Knowledges <span class="page-ref">p. 285</span></div>
            ${allKnow}
          </div>
        </div>

        <!-- Advantages Column -->
        <div class="sheet-column">
          <div class="sheet-section">
            <div class="sheet-section-title">Backgrounds <span class="page-ref">p. 301</span></div>
            ${bgs}
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Spheres <span class="page-ref">p. 512</span></div>
            <div style="margin-bottom:0.4rem">
              <span style="font-size:0.72rem;color:var(--gold-dim)">Affinity: ${char.affinity_sphere || '—'}</span>
            </div>
            ${allSpheres}
          </div>
        </div>

        <!-- Full-width advantages row -->
        <div class="sheet-advantages">
          <div class="sheet-section">
            <div class="sheet-section-title">Magical Focus <span class="page-ref">p. 259</span></div>
            <div class="summary-row">
              <span class="summary-row-label">Paradigm</span>
              <span class="summary-row-value" style="font-size:0.82rem;text-align:right;max-width:60%">${char.paradigm || '—'}</span>
            </div>
            <div class="summary-row">
              <span class="summary-row-label">Practice</span>
              <span class="summary-row-value" style="font-size:0.82rem;text-align:right;max-width:60%">${char.practice || '—'}</span>
            </div>
            <div class="summary-row">
              <span class="summary-row-label">Instruments</span>
              <span class="summary-row-value" style="font-size:0.78rem;text-align:right;max-width:60%;line-height:1.4">${instruments}</span>
            </div>
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Core Statistics</div>
            <div class="core-stats-row">
              ${this.coreStatBox('Arete', char.arete || 1, 10)}
              ${this.coreStatBox('Willpower', char.willpower || 5, 10)}
              ${this.coreStatBox('Quintessence', char.quintessence || 0, 10)}
              ${this.coreStatBox('Paradox', char.paradox || 0, 10)}
            </div>
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

  traitRow(trait, val = 0, specialties = {}) {
    if (!val) return '';
    const spec = specialties[trait.id];
    return `<div class="sheet-trait-row">
      <span class="sheet-trait-name">${trait.name}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
      ${dots(val, 5, 'readonly')}
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

  editCharacter() {
    if (this.char) App.editCharacter(this.char.id);
  },

  deleteCharacter() {
    if (this.char) App.confirmDelete(this.char.id, this.char.name);
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
    };
  },

  init() {
    this.step = 0;
    this.char = this.defaultChar();
    this.editId = null;
    this.renderStep();
    this.updateSidebar();
    this.updateFreebieDisplay();
  },

  loadCharacter(char) {
    this.step = 0;
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
    this.renderStep();
    this.updateSidebar();
    this.updateFreebieDisplay();
  },

  renderStep() {
    const content = $('#step-content');
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

  prevStep() { if (this.step > 0) { this.step--; this.renderStep(); } },

  nextStep() {
    const err = this.validateStep();
    if (err) { toast(err, 'error'); return; }
    if (this.step < this.STEPS.length - 1) {
      this.step++;
      this.renderStep();
    } else {
      this.saveCharacter();
    }
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
      Sheet.render(char);
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

    const builtinNames     = new Set(M20.ARCHETYPES.map(a => a.name));
    const isCustomNature   = !!(c.nature   && !builtinNames.has(c.nature));
    const isCustomDemeanor = !!(c.demeanor && !builtinNames.has(c.demeanor));

    const archetypeCardGrid = (target, selectedVal, isCustom) => {
      const cards = M20.ARCHETYPES.map(a => `
        <div class="archetype-card ${!isCustom && selectedVal === a.name ? 'selected' : ''}"
             data-archetype="${a.name}" data-target="${target}">
          <div class="archetype-name">${a.name}</div>
          <div class="archetype-wp">${a.willpower}</div>
          <div class="archetype-desc">${a.description}</div>
        </div>`).join('');
      const customCard = `
        <div class="archetype-card archetype-custom ${isCustom ? 'selected' : ''}"
             data-archetype="__custom__" data-target="${target}">
          <div class="archetype-name">Custom\u2026</div>
          <div class="archetype-desc">Enter your own archetype name below.</div>
        </div>`;
      return `<div class="archetype-grid" id="${target}-archetype-grid">${cards}${customCard}</div>`;
    };
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
    <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:1rem">
      <strong style="color:var(--text-mid)">Nature</strong> is your true self — fulfilling it is how you regain Willpower.
      <strong style="color:var(--text-mid)">Demeanor</strong> is the face you show the world.
      <span class="page-ref">p. 267</span>
    </p>

    <div class="archetype-section-header">
      <span class="archetype-section-title">Nature <span class="page-ref">p. 267</span></span>
      <span class="archetype-section-hint">Your true inner self — what fulfilling your Nature achieves</span>
    </div>
    ${archetypeCardGrid('nature', c.nature, isCustomNature)}
    <input type="text" id="f-nature-custom" placeholder="Enter custom archetype name\u2026"
      value="${isCustomNature ? c.nature : ''}"
      style="margin-bottom:0.5rem${isCustomNature ? '' : ';display:none'}">
    <div id="nature-wp" style="font-size:0.78rem;color:var(--purple-mid);margin-bottom:1.5rem;font-style:italic"></div>

    <div class="archetype-section-header">
      <span class="archetype-section-title">Demeanor <span class="page-ref">p. 267</span></span>
      <span class="archetype-section-hint">The mask you wear — does not affect Willpower recovery</span>
    </div>
    ${archetypeCardGrid('demeanor', c.demeanor, isCustomDemeanor)}
    <input type="text" id="f-demeanor-custom" placeholder="Enter custom archetype name\u2026"
      value="${isCustomDemeanor ? c.demeanor : ''}"
      style="${isCustomDemeanor ? '' : 'display:none'}">`;
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
      return `
      <div class="attr-block">
        <div class="attr-block-header">
          <span class="attr-block-title">${cat} Attributes</span>
          <span class="attr-block-points">
            <span class="pts">${remaining}</span> / ${totalExtra} pts remaining
          </span>
        </div>
        ${attrs.map(a => `
        <div class="attr-row" data-attr-id="${a.id}">
          <div class="attr-row-main">
            <div class="attr-info">
              <div class="attr-name">${a.name}
                <span class="info-tip" data-tip="${a.description}">?</span>
              </div>
              <div class="attr-desc">${a.description}</div>
            </div>
            ${dotsClickable(c[a.id] || 1, 5, null, '')}
          </div>
          <div class="specialty-row" ${(c[a.id] || 1) < 4 ? 'style="display:none"' : ''}>
            <input class="specialty-input" list="spec-${a.id}" data-specialty-for="${a.id}"
              placeholder="Specialty\u2026" value="${c.specialties[a.id] || ''}">
            <datalist id="spec-${a.id}">${(a.specialties || []).map(s => `<option value="${s}">`).join('')}</datalist>
          </div>
        </div>`).join('')}
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

    const abilityRow = (a, key, isSecondary = false) => {
      const val     = c[key][a.id] || 0;
      const specRow = `<div class="specialty-row" ${val < 4 ? 'style="display:none"' : ''}>
            <input class="specialty-input" list="spec-${a.id}" data-specialty-for="${a.id}"
              placeholder="Specialty\u2026" value="${c.specialties[a.id] || ''}">
            <datalist id="spec-${a.id}">${(a.specialties || []).map(s => `<option value="${s}">`).join('')}</datalist>
          </div>`;
      const removeBtn = isSecondary
        ? `<button class="btn-remove-secondary" data-ability-id="${a.id}" data-category="${key}" title="Remove ${a.name}">\u00d7</button>`
        : '';
      return `
        <div class="attr-row${isSecondary ? ' secondary-ability-row' : ''}" data-ability="${a.id}" data-category="${key}">
          <div class="attr-row-main">
            <div class="attr-info">
              <div class="attr-name">${a.name}
                ${isSecondary ? '<span class="secondary-badge">Secondary</span>' : ''}
                <span class="info-tip" data-tip="${a.description}">?</span>
              </div>
              <div class="attr-desc">${a.description}</div>
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
      // Only primary abilities count against the creation point pool
      const used      = data.reduce((sum, a) => sum + (c[key][a.id] || 0), 0);
      const remaining = total - used;

      const adderHtml = secAvailable.length > 0 ? `
        <div class="secondary-ability-adder">
          <select class="secondary-add-select" data-category="${key}">
            <option value="">\uff0b Add Secondary Ability\u2026</option>
            ${secAvailable.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
          </select>
        </div>` : '';

      return `
      <div class="attr-block">
        <div class="attr-block-header">
          <span class="attr-block-title">${cat}</span>
          <span class="attr-block-points">
            <span class="pts">${remaining}</span> / ${total} pts · max 3 per ability
          </span>
        </div>
        ${data.map(a => abilityRow(a, key, false)).join('')}
        ${secAdded.map(a => abilityRow(a, key, true)).join('')}
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
    const totalDots = M20.CREATION.backgroundDots;
    const usedDots = Object.values(c.backgrounds).reduce((s, v) => s + v, 0);
    const remaining = totalDots - usedDots;

    const aff = c.affiliation || 'Traditions';
    const bgRows = filteredBackgrounds(aff).map(bg => {
      const val = c.backgrounds[bg.id] || 0;
      const dispName = bgDisplayName(bg, aff);
      return `
      <div class="attr-row" data-bg="${bg.id}">
        <div class="attr-info">
          <div class="attr-name">${dispName}
            ${bg.doubleCost ? '<span style="font-size:0.6rem;color:var(--crimson);margin-left:0.3rem">[2× cost]</span>' : ''}
            <span class="info-tip" data-tip="${bg.description}${bg.note ? ' (' + bg.note + ')' : ''}">?</span>
          </div>
          <div class="attr-desc">${bg.description}</div>
          ${bg.page ? `<div class="page-ref">p. ${bg.page}</div>` : ''}
        </div>
        ${dotsClickable(val, 5, null, '')}
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
          <span class="pts" id="bg-remaining">${remaining}</span> / ${totalDots} pts remaining
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

    const instrumentHtml = M20.INSTRUMENTS.map(inst => {
      const checked = (c.instruments || []).includes(inst);
      const safeId = inst.replace(/[^a-zA-Z0-9]/g, '_');
      return `
      <label class="instrument-item ${checked ? 'checked' : ''}" for="inst-${safeId}">
        <input type="checkbox" id="inst-${safeId}" value="${inst}" ${checked ? 'checked' : ''} />
        ${inst}
      </label>`;
    }).join('');

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

    <div style="margin-bottom:0.75rem">
      <label>Instruments — Tools & Foci <span class="ref">p. 259</span></label>
      <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:0.75rem">
        Choose the instruments your mage uses to work magic. Most mages use 3–5 instruments regularly. These are narrative tools — they help describe <em>how</em> you work Effects, not hard mechanical limits.
      </p>
    </div>
    <div class="instrument-grid">${instrumentHtml}</div>`;
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
        <div style="margin:0.5rem 0">${dotsClickable(val, 5, null, 'sphere-dots')}</div>
        <div class="specialty-row" ${val < 4 ? 'style="display:none"' : ''}>
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
      <span class="attr-block-points">
        <span class="pts" id="sphere-remaining">${remaining}</span> / ${totalDots} pts remaining
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

    // Ensure merits/flaws are plain objects (migration safety: handle undefined, null, or legacy arrays)
    if (!c.merits || Array.isArray(c.merits)) c.merits = {};
    if (!c.flaws  || Array.isArray(c.flaws))  c.flaws  = {};

    // Flat attribute specialty lookup: { strength: [...], dexterity: [...], ... }
    const attrSpecMap = {};
    Object.values(M20.ATTRIBUTES).forEach(grp => grp.forEach(a => { attrSpecMap[a.id] = a.specialties || []; }));

    // Helper: dots row for the freebie panel
    // specOptions: array of suggestion strings (null = no specialty row)
    // currentSpec: currently saved specialty text for this trait
    const fbRow = (id, label, current, max, baseline, costPer, costNote, stat = null, specOptions = null, currentSpec = '') => {
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
        ? `<div class="specialty-row fb-specialty-row"${current < 4 ? ' style="display:none"' : ''}>` +
          `<input class="specialty-input" list="fb-spec-${id}" data-specialty-for="${id}" ` +
          `placeholder="Specialty\u2026" value="${currentSpec}">` +
          `<datalist id="fb-spec-${id}">${specOptions.map(s => `<option value="${s}">`).join('')}</datalist>` +
          `</div>`
        : '';
      return `
      <div class="fb-row" ${dataAttr} data-baseline="${baseline}" data-cost="${costPer}" data-max="${max}">
        <div class="fb-row-label">${label}${costNote ? `<span class="fb-cost-hint">${costNote}</span>` : ''}</div>
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
      const used     = g.ids.reduce((s,[id]) => s + Math.max(0,(c[id]||1)-1), 0);
      const alloc    = attrAllocs[g.label] ?? 0;
      const overUsed = Math.max(0, used - alloc);
      // Baseline per attribute: distribute free dots greedily (already set from step 2)
      // For display we just show each attr; baseline is 1 + their share of alloc
      const rows = g.ids.map(([id, name]) => {
        const cur = c[id] || 1;
        return fbRow(id, name, cur, 5, 1, 5, '5 pts/dot', null, attrSpecMap[id] || [], c.specialties[id] || '');
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
      const used  = g.data.reduce((s,a) => s + (c[g.key][a.id]||0), 0);
      const alloc = abilAllocs[g.label] ?? 0;
      const rows  = g.data.map(a => {
        const cur = c[g.key][a.id] || 0;
        return fbRow(a.id, a.name, cur, 5, 0, 2, '2 pts/dot', null, a.specialties || [], c.specialties[a.id] || '');
      }).join('');
      // Secondary abilities that have been added — 3 pts/dot, no free baseline
      const addedSec = g.sec.filter(a => c[g.key][a.id] !== undefined);
      const secRows  = addedSec.map(a => {
        const cur = c[g.key][a.id] || 0;
        const label = a.name + ' <span class="secondary-badge">Secondary</span>';
        return fbRow(a.id, label, cur, 3, 0, 3, '3 pts/dot', null, a.specialties || [], c.specialties[a.id] || '');
      }).join('');
      return `
      <div class="fb-group">
        <div class="fb-group-header">
          <span class="fb-group-label">${g.label}</span>
          <span class="fb-group-alloc">${alloc} creation pts · over-allocation costs 2 freebies/dot</span>
        </div>
        ${rows}
        ${secRows}
      </div>`;
    }).join('');

    // Background rows (filtered by faction, correct names)
    const bgAff = c.affiliation || 'Traditions';
    const bgSection = filteredBackgrounds(bgAff).map(bg => {
      const cur = c.backgrounds[bg.id] || 0;
      return fbRow(bg.id, bgDisplayName(bg, bgAff), cur, 5, 0, 1, '1 pt/dot', null);
    }).join('');

    // Sphere rows
    const sphereSection = M20.SPHERES.map(s => {
      const cur = c.spheres[s.id] || 0;
      return fbRow(s.id, s.name, cur, 5, 0, 7, '7 pts/dot', null, s.specialties || [], c.specialties[s.id] || '');
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

    <!-- ── Merits ── -->
    <details class="fb-details mf-details">
      <summary class="fb-details-summary">
        Merits <span class="fb-details-cost" id="mf-cost-merits"></span>
        <span class="fb-details-hint">cost freebie points &middot; <span class="page-ref">p. 340</span></span>
      </summary>
      <div class="fb-section-note">Click a merit to add it; click again to remove. Each costs its listed freebie point value.</div>
      <div id="fb-merits" class="mf-grid"></div>
    </details>

    <!-- ── Flaws ── -->
    <details class="fb-details mf-details">
      <summary class="fb-details-summary">
        Flaws <span class="fb-details-cost" id="mf-cost-flaws"></span>
        <span class="fb-details-hint">grant bonus freebie points (max +7) &middot; <span class="page-ref">p. 350</span></span>
      </summary>
      <div class="fb-section-note">Taking a flaw grants you bonus freebie points equal to its cost. Maximum +7 pts from flaws total. Click to toggle.</div>
      <div id="fb-flaws" class="mf-grid"></div>
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

    // Archetype cards — Nature and Demeanor
    $$('.archetype-card', content).forEach(card => {
      card.addEventListener('click', () => {
        const target   = card.dataset.target;   // 'nature' or 'demeanor'
        const value    = card.dataset.archetype;
        const customEl = $(`#f-${target}-custom`, content);

        // Update selection highlight
        $$(`.archetype-card[data-target="${target}"]`, content)
          .forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');

        if (value === '__custom__') {
          if (customEl) customEl.style.display = '';
          c[target] = customEl ? customEl.value.trim() : '';
        } else {
          if (customEl) customEl.style.display = 'none';
          c[target] = value;
        }
        if (target === 'nature') this.updateNatureWillpower();
        this.updateFreebieDisplay();
      });
    });

    // Custom archetype text inputs
    const natureCustom = $('#f-nature-custom', content);
    if (natureCustom) {
      natureCustom.addEventListener('input', () => {
        c.nature = natureCustom.value.trim();
        this.updateNatureWillpower();
      });
    }
    const demeanorCustom = $('#f-demeanor-custom', content);
    if (demeanorCustom) {
      demeanorCustom.addEventListener('input', () => { c.demeanor = demeanorCustom.value.trim(); });
    }

    // Essence cards
    $$('.essence-card', content).forEach(card => {
      card.addEventListener('click', () => {
        c.essence = card.dataset.essence;
        $$('.essence-card', content).forEach(el => el.classList.toggle('selected', el.dataset.essence === c.essence));
      });
    });

    // Affiliation tabs
    $$('.affil-tab', content).forEach(tab => {
      tab.addEventListener('click', () => {
        c.affiliation = tab.dataset.affil;
        c.tradition = '';
        c.affinity_sphere = '';
        $$('.affil-tab', content).forEach(t => t.classList.toggle('active', t.dataset.affil === c.affiliation));
        $$('[id^="tradition-panel-"]', content).forEach(p => {
          p.style.display = p.id.endsWith(c.affiliation) ? 'grid' : 'none';
        });
        $$('.tradition-card', content).forEach(t => t.classList.remove('selected'));
      });
    });

    // Tradition cards
    $$('.tradition-card', content).forEach(card => {
      card.addEventListener('click', () => {
        c.tradition = card.dataset.tradition;
        $$('.tradition-card', content).forEach(t => t.classList.toggle('selected', t.dataset.tradition === c.tradition));
        // Auto-set affinity sphere
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
            // Show/hide specialty row
            const specRow = attrRow.querySelector('.specialty-row');
            if (specRow) {
              specRow.style.display = c[cat][id] >= 4 ? '' : 'none';
              if (c[cat][id] < 4) { delete c.specialties[id]; const inp = specRow.querySelector('.specialty-input'); if (inp) inp.value = ''; }
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
      this.renderStep();
    });

    // Background dots (step 3)
    $$('[data-bg]', content).forEach(row => {
      const dotsEl = row.querySelector('.dots');
      if (!dotsEl) return;
      dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (!dot) return;
        const bgId = row.dataset.bg;
        const val  = parseInt(dot.dataset.val);
        const cur  = c.backgrounds[bgId] || 0;
        c.backgrounds[bgId] = cur === val ? Math.max(0, val - 1) : val;
        this.refreshDots(dotsEl, c.backgrounds[bgId]);
        const total = Object.values(c.backgrounds).reduce((s, v) => s + v, 0);
        const remEl = $('#bg-remaining', content);
        if (remEl) {
          remEl.textContent = M20.CREATION.backgroundDots - total;
          remEl.style.color = total > M20.CREATION.backgroundDots ? 'var(--crimson)' : 'var(--gold-bright)';
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
        c.spheres[sphereId] = cur === val ? Math.max(0, val - 1) : val;
        this.refreshDots(dotsEl, c.spheres[sphereId]);

        // Show/hide specialty row
        const specRow = card.querySelector('.specialty-row');
        if (specRow) {
          specRow.style.display = c.spheres[sphereId] >= 4 ? '' : 'none';
          if (c.spheres[sphereId] < 4) { delete c.specialties[sphereId]; const inp = specRow.querySelector('.specialty-input'); if (inp) inp.value = ''; }
        }

        // Update rank display
        const rankEl = $(`#sphere-rank-${sphereId}`, content);
        if (rankEl && sphere) {
          const rv = c.spheres[sphereId];
          rankEl.innerHTML = rv > 0 ? sphere.ranks[rv-1]?.name || '' : '<em>Unlearned</em>';
        }

        // Update points display
        const total = Object.values(c.spheres).reduce((s, v) => s + v, 0);
        const remEl = $('#sphere-remaining', content);
        if (remEl) {
          remEl.textContent = M20.CREATION.sphereDots - total;
          remEl.style.color = total > M20.CREATION.sphereDots ? 'var(--crimson)' : 'var(--gold-bright)';
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

    // Instruments (step 4)
    $$('.instrument-item input', content).forEach(inp => {
      inp.addEventListener('change', () => {
        const instruments = c.instruments || [];
        if (inp.checked) {
          if (!instruments.includes(inp.value)) instruments.push(inp.value);
        } else {
          const idx = instruments.indexOf(inp.value);
          if (idx > -1) instruments.splice(idx, 1);
        }
        c.instruments = instruments;
        inp.closest('.instrument-item').classList.toggle('checked', inp.checked);
      });
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
        c.refreshFreebieRow(row, char[stat], baseline, costPer, max);
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
        // Recalculate per-group allocation to determine freebie cost of this row
        const groupEl = row.closest('.fb-group');
        if (groupEl) {
          const groupLabel = groupEl.querySelector('.fb-group-label').textContent.split(' ')[0];
          const groupIds   = attrGroups[groupLabel] || [];
          groupIds.forEach((aid, idx) => {
            const aRow = groupEl.querySelectorAll('.fb-row[data-fb-id]')[idx];
            const aVal = char[aid] || 1;
            if (aRow) c.refreshFreebieRow(aRow, aVal, 1, 5, 5);
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
        c.refreshFreebieRow(row, char[catKey][id], 0, 2, 5);
        // Show/hide specialty row
        const specRow = row.nextElementSibling;
        if (specRow && specRow.classList.contains('fb-specialty-row')) {
          specRow.style.display = char[catKey][id] >= 4 ? '' : 'none';
          if (char[catKey][id] < 4) {
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
        c.refreshFreebieRow(row, char.backgrounds[id], 0, 1, 5);
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
          if (areteRow) c.refreshFreebieRow(areteRow, char.arete, 1, 4, 3);
          c.updateAreteLabel();
        }
        c.refreshFreebieRow(row, char.spheres[id], 0, 7, 5);
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
  },

  // Refresh a single fb-row's dots and cost display in place
  refreshFreebieRow(row, val, baseline, costPer, max) {
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
    const pri = c.ability_priority || ['Talents','Skills','Knowledges'];
    const groups = {
      Talents:    { key: 'talents',    data: M20.TALENTS,    sec: M20.SECONDARY_TALENTS },
      Skills:     { key: 'skills',     data: M20.SKILLS,     sec: M20.SECONDARY_SKILLS },
      Knowledges: { key: 'knowledges', data: M20.KNOWLEDGES, sec: M20.SECONDARY_KNOWLEDGES },
    };
    let total = 0;
    ['Talents','Skills','Knowledges'].forEach(cat => {
      const alloc = [13,9,5][pri.indexOf(cat)] ?? 0;
      const { key, data, sec } = groups[cat];
      // Primary ability over-allocation at 2 pts/dot
      const primaryUsed = data.reduce((s,a) => s + (c[key][a.id]||0), 0);
      total += Math.max(0, primaryUsed - alloc) * 2;
      // Secondary abilities cost 3 freebie pts/dot (all dots, regardless of alloc)
      const addedSec = sec.filter(a => c[key][a.id] !== undefined);
      const secDots  = addedSec.reduce((s,a) => s + (c[key][a.id]||0), 0);
      total += secDots * 3;
    });
    return total;
  },

  calcBgFreebies() {
    const total = Object.values(this.char.backgrounds||{}).reduce((s,v)=>s+v,0);
    return Math.max(0, total - M20.CREATION.backgroundDots);
  },

  calcSphereFreebies() {
    const total = Object.values(this.char.spheres||{}).reduce((s,v)=>s+v,0);
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
    header.innerHTML = `<span class="pts">${total - used}</span> / ${total} pts remaining`;
  },

  refreshAbilityPoints(block, cat) {
    const header = block.querySelector('.attr-block-points');
    if (!header) return;
    const c    = this.char;
    const data = cat === 'talents' ? M20.TALENTS : cat === 'skills' ? M20.SKILLS : M20.KNOWLEDGES;
    const pri  = c.ability_priority;
    const catLabel = cat === 'talents' ? 'Talents' : cat === 'skills' ? 'Skills' : 'Knowledges';
    const rank  = pri.indexOf(catLabel);
    const total = [13,9,5][rank] || 0;
    const used  = data.reduce((s, a) => s + (c[cat][a.id] || 0), 0);
    header.innerHTML = `<span class="pts">${total - used}</span> / ${total} pts · max 3 per ability`;
  },

  updateNatureWillpower() {
    const el = $('#nature-wp');
    if (!el) return;
    const arch = M20.ARCHETYPES.find(a => a.name === this.char.nature);
    el.textContent = arch ? `Regain Willpower when: ${arch.willpower}` : '';
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

      return '<div class="mf-card'
        + (isActive   ? ' mf-active'    : '')
        + (isRepeat   ? ' mf-repeatable': '')
        + ' ' + catClass
        + '" data-id="' + item.id + '" data-kind="' + kind + '">'
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
    }
  });
});
