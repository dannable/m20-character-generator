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

// SQLite CURRENT_TIMESTAMP produces "YYYY-MM-DD HH:MM:SS" without a timezone
// marker. Browsers parse that as *local* time, causing a double-offset when the
// server is UTC. Appending 'Z' forces correct UTC interpretation everywhere.
function normalizeTs(str) {
  if (!str) return str;
  // Match bare SQLite format (space separator, no T/Z)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) return str.replace(' ', 'T') + 'Z';
  return str;
}

// Returns the current user's saved IANA timezone, or undefined (= browser default)
function userTz() {
  return App?.currentUser?.timezone || undefined;
}

function formatDate(str) {
  if (!str) return '';
  return new Date(normalizeTs(str)).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: userTz(),
  });
}

function formatDateTime(str) {
  if (!str) return '';
  return new Date(normalizeTs(str)).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: userTz(),
  });
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

// ── Allowed Factions helpers ──────────────────────────────────────────────────
// allowedFactions is stored as:
//   null / {} / missing  → no restrictions (all factions + subfactions allowed)
//   { Traditions: [], … } → faction allowed, all subfactions allowed
//   { Traditions: ['Akashic Brotherhood', …] } → only those subfactions
//   old format: ['Traditions', 'Technocracy'] array → converted to {Traditions:[], Technocracy:[]}
function normalizeAllowedFactions(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    if (!raw.length) return null;
    const obj = {};
    raw.forEach(f => { obj[f] = []; });
    return obj;
  }
  if (typeof raw === 'object' && !Object.keys(raw).length) return null;
  return raw;
}
function factionAllowed(norm, faction) {
  return !norm || faction in norm;
}
function subfactionAllowed(norm, faction, name) {
  if (!norm) return true;
  if (!(faction in norm)) return false;
  const list = norm[faction];
  return !list.length || list.includes(name);
}
const FACTION_SUBFACTIONS = {
  Traditions: () => M20.TRADITIONS.map(t => t.name),
  Technocracy: () => M20.TECHNOCRACY.map(t => t.name),
  Disparates:  () => M20.DISPARATES.map(t => t.name),
};
const FACTION_LABEL = { Traditions: 'The Traditions', Technocracy: 'Technocratic Union', Disparates: 'Disparate Crafts' };

// ── Chronicle Welcome Modal ───────────────────────────────────────────────────
// Shows a read-only summary of chronicle customizations right after joining.
// Only displayed if the chronicle has at least one non-default setting.
function showChronicleWelcomeModal(chronicleName, rules) {
  const fp      = rules.freebiePoints;
  const mc      = rules.meritCap;
  const fc      = rules.flawCap;
  const bds     = (rules.bonusDots         || []).filter(bd => bd.amount > 0);
  const cBgs    = (rules.customBackgrounds || []).filter(b  => b.name?.trim());
  const cAbils  = (rules.customAbilities   || []).filter(a  => a.name?.trim());
  const cMerits = (rules.customMerits      || []).filter(m  => m.name?.trim());
  const cFlaws  = (rules.customFlaws       || []).filter(f  => f.name?.trim());
  const normFac = normalizeAllowedFactions(rules.allowedFactions);

  const hasPoolChange = (fp !== undefined && fp !== 15)
                     || (mc !== undefined && mc !== null)
                     || (fc !== undefined && fc !== 7);
  const hasCustom = bds.length || cBgs.length || cAbils.length || cMerits.length || cFlaws.length || normFac;
  if (!hasPoolChange && !hasCustom) return;

  function fmtBd(bd) {
    const n = bd.amount || 1;
    const targetMap = { arete:'Arete', focus_sphere:'Focus Sphere', any_ability:'any Ability',
      attribute:'any Attribute', talent:'any Talent', skill:'any Skill',
      knowledge:'any Knowledge', sphere:'any Sphere', background:'any Background' };
    const target = bd.name || targetMap[bd.type] || bd.type;
    return `<div class="cw-item"><span class="cw-bd-amt">+${n}</span> dot${n !== 1 ? 's' : ''} to <strong>${escHtml(target)}</strong></div>`;
  }
  const abilCat = { talents:'Talent', skills:'Skill', knowledges:'Knowledge' };

  function section(title, subhead, rows) {
    return `<div class="cw-section">
      <div class="cw-section-title">${title}${subhead ? ` <span class="cw-subhead">${subhead}</span>` : ''}</div>
      ${rows}
    </div>`;
  }

  let body = '';
  if (hasPoolChange) {
    let rows = '';
    if (fp !== undefined && fp !== 15) rows += `<div class="cw-item"><span class="cw-label">Freebie Points:</span> <strong>${fp}</strong> <span class="cw-note">(default 15)</span></div>`;
    if (mc !== undefined && mc !== null) rows += `<div class="cw-item"><span class="cw-label">Merit Cap:</span> <strong>${mc} pts</strong></div>`;
    if (fc !== undefined && fc !== 7)   rows += `<div class="cw-item"><span class="cw-label">Flaw Bonus Cap:</span> <strong>${fc} pts</strong> <span class="cw-note">(default 7)</span></div>`;
    body += section('Point Pools', '', rows);
  }
  if (bds.length)    body += section('Bonus Dots', '— free, don\'t cost freebies', bds.map(fmtBd).join(''));
  if (cBgs.length)   body += section('Custom Backgrounds', '', cBgs.map(bg =>
    `<div class="cw-item"><strong>${escHtml(bg.name)}</strong>${bg.description ? ` — <span class="cw-note">${escHtml(bg.description)}</span>` : ''} <span class="cw-note">(max ${bg.max||5} dots)</span></div>`
  ).join(''));
  if (cAbils.length) body += section('Custom Abilities', '', cAbils.map(a =>
    `<div class="cw-item"><strong>${escHtml(a.name)}</strong> <span class="cw-note">${abilCat[a.category]||a.category}</span></div>`
  ).join(''));
  if (cMerits.length) body += section('Custom Merits', '', cMerits.map(m =>
    `<div class="cw-item"><strong>${escHtml(m.name)}</strong> <span class="cw-cost">${m.cost} pt${m.cost!==1?'s':''}</span>${m.description?` — <span class="cw-note">${escHtml(m.description)}</span>`:''}</div>`
  ).join(''));
  if (cFlaws.length)  body += section('Custom Flaws', '', cFlaws.map(f =>
    `<div class="cw-item"><strong>${escHtml(f.name)}</strong> <span class="cw-bonus">+${f.cost} pt${f.cost!==1?'s':''}</span>${f.description?` — <span class="cw-note">${escHtml(f.description)}</span>`:''}</div>`
  ).join(''));
  if (normFac) {
    const facLines = Object.entries(normFac).map(([f, subs]) => {
      const label = FACTION_LABEL[f] || f;
      if (!subs.length) return `<div class="cw-item">✦ <strong>${escHtml(label)}</strong> <span class="cw-note">(any)</span></div>`;
      return `<div class="cw-item">✦ <strong>${escHtml(label)}</strong>: ${subs.map(s => escHtml(s)).join(', ')}</div>`;
    }).join('');
    body += section('Allowed Factions', 'only these are permitted', facLines);
  }

  const overlay = document.createElement('div');
  overlay.className = 'chron-welcome-overlay';
  overlay.innerHTML = `
    <div class="chron-welcome-box">
      <div class="chron-welcome-header">
        <div class="chron-welcome-title">Chronicle: <strong>${escHtml(chronicleName)}</strong></div>
        <button class="modal-close chron-welcome-close">✕</button>
      </div>
      <p class="chron-welcome-intro">This chronicle includes the following character creation customizations:</p>
      <div class="chron-welcome-body">${body}</div>
      <div class="chron-welcome-footer">
        <button class="btn-primary chron-welcome-ok">Got it</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('.chron-welcome-close').addEventListener('click', close);
  overlay.querySelector('.chron-welcome-ok').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// XP cost to raise a trait from currentVal → currentVal+1 (M20 p. 336)
function xpCost(traitGroup, currentVal, isAffinitySphere = false) {
  switch (traitGroup) {
    case 'attribute':  return currentVal * 4;
    case 'ability':    return currentVal === 0 ? 3 : currentVal * 2;
    case 'background': return currentVal === 0 ? 3 : currentVal * 2;
    case 'sphere':
      return isAffinitySphere
        ? (currentVal === 0 ? 7 : currentVal * 7)
        : (currentVal === 0 ? 8 : currentVal * 8);
    case 'arete':      return currentVal * 8;
    case 'willpower':  return currentVal * 1;
    case 'resonance':  return currentVal * 2;
    default: return null;
  }
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

// Flat list of all ability definitions (primary + secondary across all categories)
const ALL_ABILITY_DEFS = [
  ...M20.TALENTS, ...M20.SKILLS, ...M20.KNOWLEDGES,
  ...M20.SECONDARY_TALENTS, ...M20.SECONDARY_SKILLS, ...M20.SECONDARY_KNOWLEDGES,
];

/* ═══════════════════════════════════════════════════════════════
   APP — Page routing & roster
   ═══════════════════════════════════════════════════════════════ */
const App = {
  currentCharId: null,
  currentUser: null,
  _popping: false,

  setUser(user) {
    this.currentUser = user;
    const isGuest = user.role === 'guest';
    $('#user-name').textContent = isGuest ? 'Guest' : user.username;
    $('#user-info').style.display = 'flex';
    $('#nav-dashboard').style.display = '';
    $('#nav-logout').style.display = '';
    $('#nav-grimoire').style.display  = isGuest ? 'none' : '';
    $('#nav-settings').style.display  = isGuest ? 'none' : '';
    $('#nav-feedback').style.display  = isGuest ? 'none' : '';
    if (user.role === 'admin') {
      $('#nav-admin').style.display = '';
      $('#admin-badge').style.display = 'inline';
    } else {
      $('#nav-admin').style.display = 'none';
      $('#admin-badge').style.display = 'none';
    }
    // Show/hide guest banner
    const banner = $('#guest-banner');
    if (banner) banner.style.display = isGuest ? 'flex' : 'none';
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
    ['nav-dashboard','nav-admin','nav-logout','nav-grimoire','nav-settings','nav-feedback'].forEach(id => {
      $(`#${id}`).style.display = 'none';
    });
    $('#admin-badge').style.display = 'none';
    const banner = $('#guest-banner');
    if (banner) banner.style.display = 'none';
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

  toggleHamburger(e) {
    e?.stopPropagation();
    $('#nav-hamburger-menu')?.classList.toggle('open');
  },

  closeHamburger() {
    $('#nav-hamburger-menu')?.classList.remove('open');
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
    const isGuest = this.currentUser?.role === 'guest';
    const greeting = $('#dashboard-greeting');
    if (this.currentUser) greeting.textContent = isGuest ? 'Welcome, Guest' : `Welcome back, ${this.currentUser.username}`;

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

    // Hide chronicle UI for guests
    const createChronBtn = document.querySelector('.dashboard-actions .btn-secondary[onclick*="Chronicle.showCreate"]');
    if (createChronBtn) createChronBtn.style.display = isGuest ? 'none' : '';
    const chronCol = $('#dashboard-chronicle-list')?.closest('.dashboard-col');
    if (chronCol) chronCol.style.display = isGuest ? 'none' : '';

    await this.loadRecentCards();
    if (!isGuest) await Chronicle.loadDashboard();
  },

  async loadRecentCards() {
    const grid  = $('#dashboard-cards');
    const empty = $('#dashboard-empty');
    $('#btn-recent-mine')?.classList.toggle('btn-secondary', !this._recentShowAll);
    $('#btn-recent-mine')?.classList.toggle('btn-ghost',     this._recentShowAll);
    $('#btn-recent-all')?.classList.toggle('btn-secondary',  this._recentShowAll);
    $('#btn-recent-all')?.classList.toggle('btn-ghost',     !this._recentShowAll);
    try {
      let url;
      if (this._recentShowAll && this.currentUser?.role === 'admin') {
        url = '/api/characters/recent/all';
      } else {
        const viewed = this.getRecentViewed();
        url = viewed.length ? `/api/characters/recent?ids=${viewed.join(',')}` : '/api/characters/recent';
      }
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const chars = await r.json();
      if (!Array.isArray(chars) || chars.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
        grid.style.display = 'flex';
        grid.innerHTML = chars.map(c => this.renderCard(c, !!c.owner_username)).join('');
      }
    } catch {
      grid.innerHTML = '';
    }
  },

  async showAdmin() {
    if (this.currentUser?.role !== 'admin') return;
    this.showPage('admin');
    const content = $('#admin-content');
    content.innerHTML = '<p style="color:var(--text-faint);font-style:italic;padding:2rem 1rem">Loading…</p>';
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
      ]);
      if (!statsRes.ok || !usersRes.ok) throw new Error('Access denied');
      const stats = await statsRes.json();
      const { users, purged } = await usersRes.json();
      this._adminUsers = users;

      content.innerHTML = `
        ${purged > 0 ? `<div class="admin-purge-notice">♻ Auto-purged ${purged} ghost account${purged > 1 ? 's' : ''} (≤1 login, 0 characters, &gt;30 days old).</div>` : ''}

        <div class="admin-dash-header">
          <h2 class="admin-dash-title">Overview</h2>
          <button class="btn-secondary" onclick="App.showAdminUsers()">⚙ User Management →</button>
        </div>

        <!-- Stat cards -->
        <div class="admin-stat-cards">
          <div class="admin-stat-card">
            <div class="admin-stat-num">${stats.totals.users}</div>
            <div class="admin-stat-label">Total Users</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-num">${stats.totals.characters}</div>
            <div class="admin-stat-label">Total Characters</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-num">${stats.totals.chronicles}</div>
            <div class="admin-stat-label">Total Chronicles</div>
          </div>
        </div>

        <!-- Trend chart -->
        <div class="admin-chart-wrap">
          <div class="admin-chart-title">
            Activity — Last 8 Weeks
            <span class="admin-chart-legend">
              <span class="legend-dot legend-users"></span>Users
              <span class="legend-dot legend-chars"></span>Characters
              <span class="legend-dot legend-chrons"></span>Chronicles
            </span>
          </div>
          <div class="admin-chart-svg-wrap">
            ${this._drawAdminChart(stats.trends)}
          </div>
        </div>

        <!-- Recent activity columns -->
        <div class="admin-recent-cols">
          <div class="admin-recent-col">
            <div class="admin-recent-title">Recently Signed In</div>
            ${stats.recent_users.length === 0
              ? '<p class="admin-recent-empty">No sign-ins recorded yet.</p>'
              : stats.recent_users.map(u => `
                <div class="admin-recent-row">
                  <div class="admin-recent-main">
                    <span class="admin-recent-name">${escHtml(u.username)}</span>
                    <span class="admin-recent-meta">${u.character_count} char${u.character_count !== 1 ? 's' : ''}</span>
                  </div>
                  <span class="admin-recent-date">${formatDateTime(u.last_login)}</span>
                </div>`).join('')
            }
          </div>
          <div class="admin-recent-col">
            <div class="admin-recent-title">Recently Edited Characters</div>
            ${stats.recent_chars.length === 0
              ? '<p class="admin-recent-empty">No characters yet.</p>'
              : stats.recent_chars.map(c => `
                <div class="admin-recent-row">
                  <div class="admin-recent-main">
                    <span class="admin-recent-name">${escHtml(c.name)}</span>
                    <span class="admin-recent-meta">${escHtml(c.tradition || c.affiliation || '—')}${c.owner_username ? ' · ' + escHtml(c.owner_username) : ''}</span>
                  </div>
                  <span class="admin-recent-date">${formatDate(c.updated_at)}</span>
                </div>`).join('')
            }
          </div>
        </div>`;

    } catch (err) {
      content.innerHTML = `<p style="color:var(--crimson);padding:1rem">Failed to load admin stats: ${err.message}</p>`;
    }
  },

  _drawAdminChart(trends) {
    const W = 560, H = 180;
    const PAD = { top: 12, right: 16, bottom: 38, left: 36 };
    const pw = W - PAD.left - PAD.right;
    const ph = H - PAD.top  - PAD.bottom;
    const n  = trends.labels.length; // 8

    const allVals = [...trends.users, ...trends.characters, ...trends.chronicles];
    const maxVal  = Math.max(...allVals, 1);
    // Round up to a nice number for the Y axis
    const yMax = Math.ceil(maxVal / 5) * 5 || 5;
    const yTicks = 4;

    const xPos = i => PAD.left + (i / (n - 1)) * pw;
    const yPos = v => PAD.top  + ph - (v / yMax) * ph;

    // Grid lines + Y labels
    let gridLines = '';
    for (let t = 0; t <= yTicks; t++) {
      const v  = Math.round((yMax / yTicks) * t);
      const y  = yPos(v);
      const isZero = t === 0;
      gridLines += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}"
        stroke="${isZero ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}" stroke-width="${isZero ? 1.5 : 1}" />`;
      gridLines += `<text x="${PAD.left - 5}" y="${y + 4}" text-anchor="end"
        fill="rgba(200,188,168,0.5)" font-size="9">${v}</text>`;
    }

    // X axis labels
    let xLabels = '';
    trends.labels.forEach((label, i) => {
      const x = xPos(i);
      xLabels += `<text x="${x}" y="${H - PAD.bottom + 14}" text-anchor="middle"
        fill="rgba(200,188,168,0.55)" font-size="9">${label}</text>`;
    });

    // Polyline builder
    const polyline = (data, color, opacity = 1) => {
      const pts = data.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ');
      const dots = data.map((v, i) =>
        `<circle cx="${xPos(i)}" cy="${yPos(v)}" r="3" fill="${color}" opacity="${opacity}" />`
      ).join('');
      return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round" opacity="${opacity}" />${dots}`;
    };

    // Area fill under users line
    const areaFill = data => {
      const pts = data.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ');
      const bottom = yPos(0);
      return `<polyline points="${PAD.left},${bottom} ${pts} ${xPos(n-1)},${bottom}"
        fill="rgba(232,201,106,0.07)" stroke="none" />`;
    };

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
      style="width:100%;height:auto;display:block;overflow:visible">
      ${gridLines}
      ${areaFill(trends.users)}
      ${polyline(trends.chronicles, '#5a9a6a')}
      ${polyline(trends.characters, '#a07ee0')}
      ${polyline(trends.users,      '#e8c96a')}
      ${xLabels}
    </svg>`;
  },

  async showAdminUsers() {
    const content = $('#admin-content');
    if (!content) return;

    // Ensure user list is loaded
    if (!this._adminUsers) {
      try {
        const r = await fetch('/api/admin/users');
        if (!r.ok) throw new Error('Access denied');
        const { users, purged } = await r.json();
        this._adminUsers = users;
      } catch (err) {
        content.innerHTML = `<p style="color:var(--crimson);padding:1rem">Failed to load users: ${err.message}</p>`;
        return;
      }
    }

    content.innerHTML = `
      <div class="admin-dash-header">
        <button class="btn-ghost" onclick="App.showAdmin()">← Back to Overview</button>
        <h2 class="admin-dash-title" style="margin:0">User Management</h2>
      </div>
      <div class="admin-controls">
        <div class="admin-search-row">
          <input type="search" id="admin-search" class="admin-search"
            placeholder="Search username or email…" autocomplete="off" spellcheck="false" />
        </div>
        <div class="admin-filter-row">
          <div class="admin-filters">
            <select id="admin-filter-status" class="admin-filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <select id="admin-filter-chars" class="admin-filter-select">
              <option value="">All Characters</option>
              <option value="has">Has Characters</option>
              <option value="none">No Characters</option>
            </select>
            <select id="admin-filter-role" class="admin-filter-select">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="awakened">Awakened</option>
              <option value="user">User</option>
            </select>
            <button class="btn-ghost btn-sm" id="admin-clear-filters" style="display:none">✕ Clear</button>
          </div>
          <div class="admin-result-count" id="admin-count"></div>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Role</th>
              <th>Chars</th><th>Last Login</th><th>Logins</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="admin-tbody"></tbody>
        </table>
      </div>`;

    // Restore filter state
    if (this._adminSearchState) {
      const s = this._adminSearchState;
      if ($('#admin-search'))        $('#admin-search').value = s.search;
      if ($('#admin-filter-status')) $('#admin-filter-status').value = s.status;
      if ($('#admin-filter-chars'))  $('#admin-filter-chars').value = s.chars;
      if ($('#admin-filter-role'))   $('#admin-filter-role').value = s.role;
    }

    this._renderAdminTable();

    $('#admin-search')?.addEventListener('input', () => this._renderAdminTable());
    ['admin-filter-status', 'admin-filter-chars', 'admin-filter-role'].forEach(id => {
      $(`#${id}`)?.addEventListener('change', () => this._renderAdminTable());
    });
    $('#admin-clear-filters')?.addEventListener('click', () => {
      $('#admin-search').value = '';
      $('#admin-filter-status').value = '';
      $('#admin-filter-chars').value = '';
      $('#admin-filter-role').value = '';
      this._adminSearchState = null;
      this._renderAdminTable();
    });
  },

  _renderAdminTable() {
    const tbody    = $('#admin-tbody');
    const countEl  = $('#admin-count');
    const clearBtn = $('#admin-clear-filters');
    if (!tbody) return;

    const search       = ($('#admin-search')?.value || '').toLowerCase().trim();
    const filterStatus = $('#admin-filter-status')?.value || '';
    const filterChars  = $('#admin-filter-chars')?.value  || '';
    const filterRole   = $('#admin-filter-role')?.value   || '';

    // Persist so filter state survives a full reload triggered by an action
    this._adminSearchState = { search, status: filterStatus, chars: filterChars, role: filterRole };

    const hasFilters = !!(search || filterStatus || filterChars || filterRole);
    if (clearBtn) clearBtn.style.display = hasFilters ? '' : 'none';

    const formatDate = iso => {
      if (!iso) return '<span style="color:var(--text-faint)">Never</span>';
      const d = new Date(normalizeTs(iso));
      const tz = { timeZone: userTz() };
      return `<span title="${d.toLocaleString(undefined, tz)}">${d.toLocaleDateString(undefined, tz)}</span>`;
    };

    const me  = this.currentUser;
    const all = this._adminUsers || [];

    const filtered = all.filter(u => {
      if (search && !u.username.toLowerCase().includes(search) && !u.email.toLowerCase().includes(search)) return false;
      if (filterStatus === 'active'   && !u.is_active)         return false;
      if (filterStatus === 'disabled' &&  u.is_active)         return false;
      if (filterChars  === 'has'      && !u.character_count)   return false;
      if (filterChars  === 'none'     &&  u.character_count > 0) return false;
      if (filterRole && u.role !== filterRole) return false;
      return true;
    });

    if (countEl) {
      const t = all.length, f = filtered.length;
      countEl.textContent = f === t ? `${t} user${t !== 1 ? 's' : ''}` : `${f} of ${t}`;
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="admin-empty-row">No users match the current filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const isSelf = me && u.id === me.id;
      return `<tr>
        <td>${u.username}</td>
        <td class="admin-td-email">${u.email}</td>
        <td>
          <span class="${u.role === 'admin' ? 'admin-badge' : u.role === 'awakened' ? 'admin-badge-awakened' : 'admin-role-user'}">${u.role}</span>
        </td>
        <td style="text-align:center">
          ${u.character_count > 0
            ? `<button class="btn-ghost btn-sm admin-char-btn" onclick="App.showUserCharacters(${u.id},'${u.username.replace(/'/g, "\\'")}')" title="View characters">${u.character_count}</button>`
            : '<span class="admin-zero">0</span>'}
        </td>
        <td class="admin-td-date">${formatDate(u.last_login)}</td>
        <td style="text-align:center" class="admin-td-date">${u.login_count ?? 0}</td>
        <td class="${u.is_active ? 'status-active' : 'status-disabled'}">${u.is_active ? 'Active' : 'Disabled'}</td>
        <td>
          <div class="admin-actions">
            <button class="btn-ghost btn-sm" onclick="App.editUser(${u.id}, '${u.username.replace(/'/g, "\\'")}', '${u.email.replace(/'/g, "\\'")}')">
              Edit
            </button>
            <button class="btn-ghost btn-sm" onclick="App.toggleUser(${u.id}, ${u.is_active})"
              ${isSelf ? 'disabled title="Cannot disable your own account"' : ''}>
              ${u.is_active ? 'Disable' : 'Enable'}
            </button>
            <button class="btn-ghost btn-sm" onclick="App.changeRole(${u.id}, '${u.role}', '${u.username}')"
              ${isSelf ? 'disabled title="Cannot change your own role"' : ''}>
              Role
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
    }).join('');
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
      await this.showAdminUsers();
    } catch { toast('Failed to update user', 'error'); }
  },

  changeRole(id, currentRole, username) {
    $('#modal-title').textContent = `Change Role — ${username}`;
    $('#modal-body').innerHTML = `
      <div class="form-group">
        <label class="form-label">Role</label>
        <select id="modal-role-select" class="form-input">
          <option value="user"     ${currentRole === 'user'     ? 'selected' : ''}>User</option>
          <option value="awakened" ${currentRole === 'awakened' ? 'selected' : ''}>Awakened</option>
          <option value="admin"    ${currentRole === 'admin'    ? 'selected' : ''}>Admin</option>
        </select>
      </div>`;
    const btn = $('#modal-confirm');
    btn.textContent = 'Save Role';
    btn.className = 'btn-secondary';
    btn.onclick = async () => {
      const newRole = $('#modal-role-select')?.value;
      if (!newRole || newRole === currentRole) { this.closeModal(); return; }
      try {
        const r = await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
        const data = await r.json();
        if (!r.ok) { toast(data.error || 'Failed to change role.', 'error'); return; }
        this.closeModal();
        toast(`${username} is now ${newRole}.`);
        await this.showAdminUsers();
      } catch { toast('Failed to change role.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
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
        await this.showAdminUsers();
      } catch { toast('Failed to delete user.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
  },

  editUser(id, username, email) {
    $('#modal-title').textContent = `Edit User — ${username}`;
    $('#modal-body').innerHTML = `
      <div class="form-group" style="margin-bottom:0.75rem">
        <label class="form-label">Username</label>
        <input type="text" id="modal-edit-username" class="form-input" value="${username.replace(/"/g, '&quot;')}" autocomplete="off" spellcheck="false" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" id="modal-edit-email" class="form-input" value="${email.replace(/"/g, '&quot;')}" autocomplete="off" />
      </div>`;
    const btn = $('#modal-confirm');
    btn.textContent = 'Save Changes';
    btn.className = 'btn-secondary';
    btn.onclick = async () => {
      const newUsername = $('#modal-edit-username')?.value?.trim() || '';
      const newEmail    = $('#modal-edit-email')?.value?.trim() || '';
      if (!newUsername) { toast('Username cannot be empty.', 'error'); return; }
      if (!newEmail || !newEmail.includes('@')) { toast('Please enter a valid email.', 'error'); return; }
      try {
        const r = await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newUsername, email: newEmail })
        });
        const data = await r.json();
        if (!r.ok) { toast(data.error || 'Failed to save changes.', 'error'); return; }
        this.closeModal();
        toast(`${username} updated.`);
        await this.showAdmin();
      } catch { toast('Failed to save changes.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
    setTimeout(() => $('#modal-edit-username')?.focus(), 50);
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

  showFeedback() {
    const username = this.currentUser?.username || '';
    document.getElementById('feedback-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    overlay.id = 'feedback-modal';
    overlay.innerHTML = `
      <div class="feedback-box">
        <div class="feedback-header">
          <span class="feedback-title">Send Feedback</span>
          <button class="modal-close feedback-close">✕</button>
        </div>
        <div class="feedback-body">
          <div class="feedback-from">
            <span class="feedback-from-label">From</span>
            <span class="feedback-from-user">${escHtml(username)}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Subject <span class="form-hint">(optional)</span></label>
            <input type="text" id="feedback-subject" class="form-input" placeholder="What's on your mind?" maxlength="120">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Message</label>
            <div class="rte-toolbar">
              <button type="button" class="rte-btn" data-cmd="bold" title="Bold"><strong>B</strong></button>
              <button type="button" class="rte-btn" data-cmd="italic" title="Italic"><em>I</em></button>
              <button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="Bullet list">≡ List</button>
            </div>
            <div id="feedback-message" class="rte-editor" contenteditable="true"
              data-placeholder="Share your thoughts, bug reports, or feature ideas…" spellcheck="true"></div>
          </div>
        </div>
        <div class="feedback-footer">
          <button class="btn-ghost feedback-cancel">Cancel</button>
          <button class="btn-primary" id="feedback-send">Send Feedback</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.feedback-close').addEventListener('click', close);
    overlay.querySelector('.feedback-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Rich-text toolbar buttons
    overlay.querySelectorAll('.rte-btn').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault(); // keep focus in editor
        document.execCommand(btn.dataset.cmd, false, null);
        document.getElementById('feedback-message').focus();
      });
    });

    // Send
    document.getElementById('feedback-send').addEventListener('click', async () => {
      const msgEl   = document.getElementById('feedback-message');
      const message = msgEl.innerHTML.trim();
      if (!msgEl.textContent.trim()) { toast('Please enter a message.', 'error'); return; }

      const btn = document.getElementById('feedback-send');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        const r = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: document.getElementById('feedback-subject').value.trim(),
            message,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to send');
        close();
        toast('Feedback sent — thank you!');
      } catch (err) {
        toast(err.message || 'Failed to send feedback.', 'error');
        btn.disabled = false;
        btn.textContent = 'Send Feedback';
      }
    });

    setTimeout(() => document.getElementById('feedback-message')?.focus(), 50);
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
    if (id === 'grimoire')  $('#nav-grimoire').classList.add('active');
    // Push browser history state (skip during popstate restoration)
    if (!this._popping && id !== 'auth') {
      const state = { page: id };
      if (id === 'sheet' && this.currentCharId) state.charId = this.currentCharId;
      if (id === 'creator') {
        if (Creator.editId) state.charId = Creator.editId;
        state.step = Creator.step || 0;
      }
      if (id === 'free-edit' && FreeEdit.char?.id) state.charId = FreeEdit.char.id;
      // Use replaceState on the very first navigation so there is no blank
      // "before the app" entry in the stack — subsequent navigations push normally.
      if (history.state === null) {
        history.replaceState(state, '', location.pathname);
      } else {
        history.pushState(state, '', location.pathname);
      }
    }
  },

  showGrimoire(charSpheres = null) {
    this.showPage('grimoire');
    Grimoire.init(charSpheres);
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
    const chronDate = c.chronicle_next_session
      ? new Date(c.chronicle_next_session + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null;
    const chronicleBadge = c.linked_chronicle_name ? `
      <div class="card-chronicle-badge" title="${c.linked_chronicle_name}${c.chronicle_storyteller ? ' · ST: ' + c.chronicle_storyteller : ''}${chronDate ? ' · Next: ' + chronDate : ''}">
        <span class="card-chronicle-badge-icon">⚝</span>
        <div class="card-chronicle-badge-info">
          <span class="card-chronicle-badge-name">${c.linked_chronicle_name}</span>
          ${chronDate ? `<span class="card-chronicle-badge-date">${chronDate}</span>` : ''}
        </div>
      </div>` : '';
    return `
      <div class="character-card" onclick="App.viewCharacter(${c.id})">
        <div class="card-top-row">
          <div class="card-tradition">${tradition}</div>
          ${chronicleBadge}
        </div>
        <div class="card-name">${c.name}${c.is_draft ? ' <span class="card-draft-badge">draft</span>' : ''}</div>
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

  // ── Recently-viewed tracking (localStorage) ─────────────────────────────
  trackRecentView(id) {
    try {
      const key = 'sanctum_recent_viewed';
      let recent = JSON.parse(localStorage.getItem(key) || '[]');
      recent = [id, ...recent.filter(i => i !== id)].slice(0, 3);
      localStorage.setItem(key, JSON.stringify(recent));
    } catch {}
  },

  getRecentViewed() {
    try { return JSON.parse(localStorage.getItem('sanctum_recent_viewed') || '[]'); } catch { return []; }
  },

  async viewCharacter(id) {
    this.currentCharId = id;
    try {
      const [char, stNotes] = await Promise.all([
        API.get(id),
        fetch(`/api/characters/${id}/storyteller-notes`).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      Sheet.sharedToken = null;
      Sheet.render(char, stNotes);
      Sheet.renderToolbar('owner');
      this.showPage('sheet');
      this.trackRecentView(id);
      // Record server-side view timestamp (fire-and-forget)
      fetch(`/api/characters/${id}/view`, { method: 'POST' }).catch(() => {});
    } catch (err) {
      toast('Failed to load character', 'error');
    }
  },

  async viewMemberCharacter(chronicleId, charId) {
    try {
      const [charRes, editsRes] = await Promise.all([
        fetch(`/api/chronicles/${chronicleId}/members/${charId}`),
        fetch(`/api/chronicles/${chronicleId}/pending-edits`).catch(() => null),
      ]);
      if (!charRes.ok) throw new Error();
      const char = await charRes.json();
      const allEdits = (editsRes?.ok) ? await editsRes.json() : [];
      const pendingEdits = allEdits.filter(e => e.character_id === charId);
      Sheet.sharedToken = null;
      Sheet.render(char, [], { mode: 'storyteller', chronicleId, pendingEdits });
      Sheet.renderToolbar('storyteller', { chronicleId });
      this.showPage('sheet');
    } catch { toast('Failed to load character.', 'error'); }
  },

  async editCharacter(id) {
    this.currentCharId = id;
    try {
      const char = await API.get(id);
      // Always load chronicle rules if in a chronicle
      if (char.chronicle_id) {
        try {
          const cr = await fetch(`/api/chronicles/${char.chronicle_id}`);
          if (cr.ok) {
            const chron = await cr.json();
            char._chronicleRules = chron.rules || {};
          }
        } catch {}
      }
      if (char.is_draft) {
        // Drafts still use the creation wizard
        Creator.loadCharacter(char);
        this.showPage('creator');
      } else {
        // Finalized characters use Free Edit mode
        FreeEdit.open(char);
      }
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
    if (confirmBtn) { confirmBtn.textContent = 'Confirm'; confirmBtn.className = 'btn-danger'; confirmBtn.onclick = null; confirmBtn.style.display = ''; confirmBtn.disabled = false; }
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

  async enterAsGuest() {
    const btn = document.querySelector('.auth-guest-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Entering…'; }
    try {
      const r = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) {
        toast(data.error || 'Could not start guest session.', 'error');
        return;
      }
      App.setUser(data);
      App.showDashboard();
    } catch {
      toast('Could not connect to server. Please try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Enter as Guest'; }
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

/* ─── Debounce utility ───────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ─── Sphere constants ───────────────────────────────────────── */
const SPHERE_NAMES = ['Correspondence','Entropy','Forces','Life','Matter','Mind','Prime','Spirit','Time'];

function formatSpheresRaw(raw) {
  let s = raw || '';
  SPHERE_NAMES.forEach(n => {
    s = s.replace(new RegExp(n, 'g'), `<span class="sphere-highlight">${n}</span>`);
  });
  return s;
}

function canCast(rote, charSpheres) {
  if (!charSpheres || !Array.isArray(rote.spheres_parsed)) return true;
  const required = rote.spheres_parsed.filter(c => c.required);
  return required.every(comp =>
    comp.alternatives.some(alt => {
      const level = charSpheres[alt.sphere.toLowerCase()] || 0;
      return level >= alt.min;
    })
  );
}

/* ═══════════════════════════════════════════════════════════════
   GRIMOIRE — Rote browser
   ═══════════════════════════════════════════════════════════════ */
const Grimoire = {
  state: {
    search: '', chapter: '', faction: '', book: '',
    sphereFilters: {},   // { SphereName: { rating: 1-5, mode: 'upto'|'exact' } }
    page: 1, limit: 10, total: 0, pages: 0,
    chapters: [], factions: [], books: [],
    rotes: [],
    loading: false,
    castableOnly: false,
    charSpheres: null,
  },

  init(charSpheres = null) {
    this.state.charSpheres   = charSpheres;
    this.state.search        = '';
    this.state.chapter       = '';
    this.state.faction       = '';
    this.state.book          = '';
    this.state.sphereFilters = {};
    this.state.page          = 1;
    this.state.castableOnly  = false;
    this.renderShell();
    if (!this.state.chapters.length) {
      this.loadChapters();
    } else {
      this.renderFilters();
      this.fetchRotes();
    }
  },

  renderShell() {
    const content = $('#grimoire-content');
    if (!content) return;
    content.innerHTML = `
      <div class="grimoire-container">
        <div class="grimoire-title">The Grimoire</div>
        <div class="grimoire-subtitle">A compendium of rotes and ritual workings from across the Traditions.</div>
        <div id="grimoire-filters"></div>
        <div class="grimoire-stats" id="grimoire-stats"></div>
        <div id="grimoire-results"><div class="grimoire-loading">Loading rotes…</div></div>
        <div id="grimoire-pagination"></div>
      </div>`;
  },

  async loadChapters() {
    try {
      const [chapR, factR, bookR] = await Promise.all([
        fetch('/api/rotes/chapters'),
        fetch('/api/rotes/factions'),
        fetch('/api/rotes/books'),
      ]);
      this.state.chapters  = chapR.ok  ? await chapR.json()  : [];
      this.state.factions  = factR.ok  ? await factR.json()  : [];
      this.state.books     = bookR.ok  ? await bookR.json()  : [];
    } catch {
      this.state.chapters = []; this.state.factions = []; this.state.books = [];
    }
    this.renderFilters();
    this.fetchRotes();
  },

  renderFilters() {
    const el = $('#grimoire-filters');
    if (!el) return;
    const { chapter, chapters, faction, factions, book, books, castableOnly, charSpheres } = this.state;
    const esc = s => (s || '').replace(/"/g, '&quot;');

    el.innerHTML = `
      <div class="grimoire-filter-bar">
        <input type="search" class="grimoire-search-input" id="grimoire-search"
          placeholder="Search rotes by name…" value="${esc(this.state.search)}" autocomplete="off" />
        <select class="grimoire-select" id="grimoire-chapter">
          <option value="">All Categories</option>
          ${chapters.map(c => `<option value="${esc(c)}"${chapter === c ? ' selected' : ''}>${c}</option>`).join('')}
        </select>
        <select class="grimoire-select" id="grimoire-faction">
          <option value="">All Factions</option>
          ${factions.map(f => `<option value="${esc(f)}"${faction === f ? ' selected' : ''}>${f}</option>`).join('')}
        </select>
        <select class="grimoire-select" id="grimoire-book">
          <option value="">All Sources</option>
          ${books.map(b => `<option value="${esc(b)}"${book === b ? ' selected' : ''}>${b}</option>`).join('')}
        </select>
        ${charSpheres ? `
        <label class="grimoire-castable-label">
          <input type="checkbox" id="grimoire-castable" ${castableOnly ? 'checked' : ''} />
          Castable only
        </label>` : ''}
        <button class="grimoire-clear-btn" id="grimoire-clear-all" title="Clear all filters">Clear All</button>
      </div>
      <div class="grimoire-sphere-panel">
        <div class="grimoire-sphere-panel-title">Sphere Filters</div>
        <div class="grimoire-sphere-grid" id="grimoire-sphere-grid">
          ${this._sphereGridHTML()}
        </div>
      </div>`;

    const debouncedFetch = debounce(() => { this.state.page = 1; this.fetchRotes(); }, 300);

    $('#grimoire-search')?.addEventListener('input', e => {
      this.state.search = e.target.value;
      debouncedFetch();
    });
    $('#grimoire-chapter')?.addEventListener('change', e => {
      this.state.chapter = e.target.value; this.state.page = 1; this.fetchRotes();
    });
    $('#grimoire-faction')?.addEventListener('change', e => {
      this.state.faction = e.target.value; this.state.page = 1; this.fetchRotes();
    });
    $('#grimoire-book')?.addEventListener('change', e => {
      this.state.book = e.target.value; this.state.page = 1; this.fetchRotes();
    });
    $('#grimoire-castable')?.addEventListener('change', e => {
      this.state.castableOnly = e.target.checked; this.state.page = 1; this.fetchRotes();
    });
    $('#grimoire-clear-all')?.addEventListener('click', () => {
      this.state.search = '';
      this.state.chapter = '';
      this.state.faction = '';
      this.state.book = '';
      this.state.sphereFilters = {};
      this.state.castableOnly = false;
      this.state.page = 1;
      // Reset text input
      const searchEl = $('#grimoire-search');
      if (searchEl) searchEl.value = '';
      // Reset selects
      ['#grimoire-chapter','#grimoire-faction','#grimoire-book'].forEach(sel => {
        const el = $(sel); if (el) el.value = '';
      });
      const castEl = $('#grimoire-castable');
      if (castEl) castEl.checked = false;
      this._refreshSphereGrid();
      this.fetchRotes();
    });
    this._attachSphereGridListeners();
  },

  // ── Sphere grid helpers ────────────────────────────────────────────────────
  // Technocracy sphere aliases — data-sphere always uses the tradition name so
  // the filter state and SQL query are identical regardless of which row is clicked.
  _TECH_SPHERES: [
    { label: 'Data',               mapsTo: 'Data' },
    { label: 'Dimensional Science', mapsTo: 'Dimensional Science' },
    { label: 'Primal Utility',     mapsTo: 'Primal Utility' },
  ],

  _sphereRowHTML(label, filterSphere) {
    const filter = this.state.sphereFilters[filterSphere];
    const rating = filter ? filter.rating : 0;
    const mode   = filter ? filter.mode   : 'upto';
    const dots   = [1,2,3,4,5].map(i =>
      `<span class="g-dot${i <= rating ? ' filled' : ''}" data-sphere="${filterSphere}" data-val="${i}" title="${label} ${i}"></span>`
    ).join('');
    const modeHTML = rating > 0
      ? `<div class="g-mode-group">
           <button class="g-mode-btn${mode === 'upto'  ? ' active' : ''}" data-sphere="${filterSphere}" data-mode="upto"  title="Up to ${rating}">≤</button>
           <button class="g-mode-btn${mode === 'exact' ? ' active' : ''}" data-sphere="${filterSphere}" data-mode="exact" title="Exactly ${rating}">=</button>
         </div>`
      : `<div class="g-mode-group g-mode-placeholder"></div>`;
    return `<div class="g-sphere-row${rating > 0 ? ' g-active' : ''}">
      <span class="g-sphere-name">${label}</span>
      <div class="g-sphere-dots">${dots}</div>
      ${modeHTML}
    </div>`;
  },

  _sphereGridHTML() {
    const tradRows = SPHERE_NAMES.map(s => this._sphereRowHTML(s, s)).join('');
    const techRows = this._TECH_SPHERES.map(({ label, mapsTo }) => this._sphereRowHTML(label, mapsTo)).join('');
    return `
      <div class="g-subsection">
        <div class="g-subsection-title">Traditions</div>
        <div class="g-subgrid">${tradRows}</div>
      </div>
      <div class="g-subsection g-subsection--tech">
        <div class="g-subsection-title">Technocracy</div>
        <div class="g-subgrid g-subgrid--tech">${techRows}</div>
      </div>`;
  },

  _refreshSphereGrid() {
    const el = $('#grimoire-sphere-grid');
    if (!el) return;
    el.innerHTML = this._sphereGridHTML();
    this._attachSphereGridListeners(el);
  },

  _attachSphereGridListeners(grid) {
    grid = grid || $('#grimoire-sphere-grid');
    if (!grid) return;
    grid.addEventListener('click', e => {
      // Dot click
      const dot = e.target.closest('.g-dot');
      if (dot) {
        const sphere = dot.dataset.sphere;
        const val    = parseInt(dot.dataset.val, 10);
        const current = (this.state.sphereFilters[sphere] || {rating: 0}).rating;
        if (current === val) {
          delete this.state.sphereFilters[sphere];
        } else {
          this.state.sphereFilters[sphere] = {
            rating: val,
            mode: (this.state.sphereFilters[sphere] || {mode: 'upto'}).mode,
          };
        }
        this.state.page = 1;
        this._refreshSphereGrid();
        this.fetchRotes();
        return;
      }
      // Mode button click
      const modeBtn = e.target.closest('.g-mode-btn');
      if (modeBtn) {
        const sphere = modeBtn.dataset.sphere;
        const mode   = modeBtn.dataset.mode;
        if (this.state.sphereFilters[sphere]) {
          this.state.sphereFilters[sphere].mode = mode;
          this.state.page = 1;
          this._refreshSphereGrid();
          this.fetchRotes();
        }
      }
    });
  },

  async fetchRotes() {
    if (this.state.loading) return;
    this.state.loading = true;
    const resultsEl = $('#grimoire-results');
    if (resultsEl) resultsEl.innerHTML = '<div class="grimoire-loading">Loading…</div>';

    const { search, chapter, faction, book, sphereFilters, page, limit, castableOnly, charSpheres } = this.state;

    // Build spheres param: "Entropy:2:upto,Forces:3:exact"
    const sfParts = Object.entries(sphereFilters)
      .filter(([, f]) => f.rating > 0)
      .map(([sphere, f]) => `${sphere}:${f.rating}:${f.mode}`);

    // When castable-only is on, fetch all and filter client-side
    const fetchAll   = castableOnly && charSpheres;
    const fetchLimit = fetchAll ? 954 : limit;
    const fetchPage  = fetchAll ? 1   : page;

    const params = { page: fetchPage, limit: fetchLimit };
    if (search)         params.search  = search;
    if (chapter)        params.chapter = chapter;
    if (faction)        params.faction = faction;
    if (book)           params.book    = book;
    if (sfParts.length) params.spheres = sfParts.join(',');

    try {
      const r = await fetch('/api/rotes?' + new URLSearchParams(params));
      if (!r.ok) throw new Error();
      const data  = await r.json();
      let   rotes = data.rotes || [];

      if (fetchAll) {
        rotes = rotes.filter(rt => canCast(rt, charSpheres));
        const totalFiltered = rotes.length;
        const start = (page - 1) * limit;
        this.state.rotes = rotes.slice(start, start + limit);
        this.state.total = totalFiltered;
        this.state.pages = Math.max(1, Math.ceil(totalFiltered / limit));
      } else {
        this.state.rotes = rotes;
        this.state.total = data.total || 0;
        this.state.pages = data.pages || 1;
      }
    } catch {
      this.state.rotes = [];
      this.state.total = 0;
      this.state.pages = 1;
    }

    this.state.loading = false;
    this.renderResults();
    this.renderPagination();
    // Reattach sphere grid listeners (they get wiped on re-render)
    this._attachSphereGridListeners();
  },

  renderResults() {
    const el = $('#grimoire-results');
    if (!el) return;
    const statsEl = $('#grimoire-stats');
    const { rotes, total, page, pages, charSpheres } = this.state;

    if (statsEl) {
      statsEl.textContent = total === 0 ? 'No rotes found.' : `${total} rote${total !== 1 ? 's' : ''} found`;
    }

    if (!rotes.length) {
      el.innerHTML = '<div class="grimoire-empty">No rotes match your filters.</div>';
      return;
    }

    const showCastability = !!charSpheres;

    el.innerHTML = `<table class="grimoire-table">
      <thead>
        <tr>
          ${showCastability ? '<th></th>' : ''}
          <th>Name</th>
          <th>Spheres</th>
          <th>Category</th>
          <th>Faction</th>
          <th>Source</th>
          <th>Pg</th>
        </tr>
      </thead>
      <tbody>
        ${rotes.map(rt => {
          const castable = charSpheres ? canCast(rt, charSpheres) : null;
          const rowCls = castable === null ? '' : (castable ? 'castable' : 'not-castable');
          return `<tr class="grimoire-row ${rowCls}">
            ${showCastability ? `<td class="grimoire-castable-icon">${castable ? '✦' : ''}</td>` : ''}
            <td class="grimoire-name">${rt.name || '—'}</td>
            <td class="grimoire-spheres">${formatSpheresRaw(rt.spheres_raw || '')}</td>
            <td class="grimoire-chapter">${rt.chapter || '—'}</td>
            <td class="grimoire-faction">${rt.faction || '—'}</td>
            <td class="grimoire-source">${rt.source_book || rt.source || '—'}</td>
            <td class="grimoire-page-ref">${rt.page || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  },

  renderPagination() {
    const el = $('#grimoire-pagination');
    if (!el) return;
    const { page, pages } = this.state;
    if (pages <= 1) { el.innerHTML = ''; return; }

    let html = `<button class="grimoire-page-btn" onclick="Grimoire.setPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Prev</button>`;

    // Show up to 7 page numbers
    const maxShow = 7;
    let start = Math.max(1, page - 3);
    let end   = Math.min(pages, start + maxShow - 1);
    if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);

    if (start > 1) html += `<button class="grimoire-page-btn" onclick="Grimoire.setPage(1)">1</button>`;
    if (start > 2) html += `<span style="color:var(--text-faint);padding:0 0.25rem">…</span>`;
    for (let i = start; i <= end; i++) {
      html += `<button class="grimoire-page-btn${i === page ? ' active' : ''}" onclick="Grimoire.setPage(${i})">${i}</button>`;
    }
    if (end < pages - 1) html += `<span style="color:var(--text-faint);padding:0 0.25rem">…</span>`;
    if (end < pages) html += `<button class="grimoire-page-btn" onclick="Grimoire.setPage(${pages})">${pages}</button>`;

    html += `<button class="grimoire-page-btn" onclick="Grimoire.setPage(${page + 1})" ${page >= pages ? 'disabled' : ''}>Next →</button>`;
    el.innerHTML = `<div class="grimoire-pagination">${html}</div>`;
  },

  setPage(n) {
    const { pages } = this.state;
    const clamped = Math.max(1, Math.min(pages, n));
    if (clamped === this.state.page) return;
    this.state.page = clamped;
    this.fetchRotes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};

/* ═══════════════════════════════════════════════════════════════
   CHRONICLE — Creation, viewing and management
   ═══════════════════════════════════════════════════════════════ */
const Chronicle = {

  // ── Dashboard: load and render chronicle cards ───────────────────────────
  async loadDashboard() {
    const list = $('#dashboard-chronicle-list');
    if (!list) return;
    try {
      const r = await fetch('/api/chronicles');
      if (!r.ok) throw new Error();
      const chronicles = await r.json();
      const active   = chronicles.filter(c => c.is_active !== 0);
      const inactive = chronicles.filter(c => c.is_active === 0);
      let html = '';
      if (active.length) {
        html += `<div class="chronicle-card-grid">${active.map(c => this._cardHTML(c)).join('')}</div>`;
      } else {
        html += `<p class="chronicle-empty-state">No chronicles yet. Create one to invite players.</p>`;
      }
      if (inactive.length) {
        html += `
          <details class="inactive-chronicles-accordion">
            <summary class="inactive-chronicles-summary">Inactive Chronicles (${inactive.length})</summary>
            <div class="chronicle-card-grid" style="margin-top:0.75rem">
              ${inactive.map(c => this._cardHTML(c)).join('')}
            </div>
          </details>`;
      }
      list.innerHTML = html;
    } catch { list.innerHTML = ''; }
  },

  _cardHTML(c) {
    const isActive = c.is_active !== 0;
    const date = c.next_session
      ? new Date(c.next_session + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null;
    return `
      <div class="chronicle-card${isActive ? '' : ' chronicle-card-inactive'}" onclick="Chronicle.showDetail(${c.id})">
        <div class="chronicle-card-name">${escHtml(c.name)}</div>
        <div class="chronicle-card-meta">
          ${c.setting ? `<span>${escHtml(c.setting)}</span>` : ''}
          ${c.year    ? `<span>${escHtml(c.year)}</span>` : ''}
        </div>
        <div class="chronicle-card-footer">
          ${isActive
            ? `<span class="chronicle-join-badge" title="Join code">${c.join_code}</span>`
            : `<span class="chronicle-inactive-label">Inactive</span>`}
          <span class="chronicle-member-count">${c.member_count} member${c.member_count !== 1 ? 's' : ''}</span>
          ${date && isActive ? `<span class="chronicle-next-session">Next: ${date}</span>` : ''}
        </div>
      </div>`;
  },

  // ── Show create form ─────────────────────────────────────────────────────
  showCreate() {
    App.showPage('chronicle');
    $('#chronicle-content').innerHTML = this._formHTML(null);
    this._attachFormListeners(null);
  },

  // ── Show detail / edit for existing chronicle ────────────────────────────
  async showDetail(id) {
    App.showPage('chronicle');
    $('#chronicle-content').innerHTML = `<div class="chronicle-loading">Loading…</div>`;
    try {
      const [r, nr] = await Promise.all([
        fetch(`/api/chronicles/${id}`),
        fetch(`/api/chronicles/${id}/notes`),
      ]);
      if (!r.ok) throw new Error();
      const data = await r.json();
      const notes = nr.ok ? await nr.json() : [];
      this._currentId = id;
      this._notes = notes;
      $('#chronicle-content').innerHTML = this._detailHTML(data, notes);
      this._attachDetailListeners(data, notes);
    } catch {
      $('#chronicle-content').innerHTML = `<p class="error-msg">Failed to load chronicle.</p>`;
    }
  },

  _quill: null,

  // ── Create / edit form HTML ──────────────────────────────────────────────
  _formHTML(c) {
    const isEdit = !!c;
    const rules = (() => { try { return typeof c?.rules === 'object' ? c.rules : JSON.parse(c?.rules || '{}'); } catch { return {}; } })();
    const freebiePoints  = rules.freebiePoints  ?? 15;
    const meritCap       = rules.meritCap       ?? null;
    const flawCap        = rules.flawCap        ?? 7;
    const bonusDots      = rules.bonusDots      || [];
    const customBgs      = rules.customBackgrounds || [];
    const customAbils    = rules.customAbilities   || [];
    const customMerits   = rules.customMerits      || [];
    const customFlaws    = rules.customFlaws        || [];
    const normFacForm = normalizeAllowedFactions(rules.allowedFactions);
    const allFactions = ['Traditions', 'Technocracy', 'Disparates'];
    // For the form: is a top-level faction enabled?
    const facEnabled  = f => !normFacForm || f in normFacForm;
    // Is a specific subfaction checked?
    const subfacEnabled = (f, name) => subfactionAllowed(normFacForm, f, name);
    // Are all subfactions of a faction checked?
    const allSubfacEnabled = f => !normFacForm || !(f in normFacForm) || normFacForm[f].length === 0;
    return `
      <div class="chronicle-page">
        <div class="chronicle-page-header">
          <h2 class="section-title">${isEdit ? 'Update Chronicle' : 'Create Chronicle'}</h2>
        </div>
        <div class="chronicle-form-body">
          <div class="form-group">
            <label class="form-label">Chronicle Name <span style="color:var(--crimson)">*</span></label>
            <input type="text" id="chron-name" class="form-input" value="${escHtml(c?.name || '')}" placeholder="The Shadow Wars…" />
          </div>
          <div class="chronicle-form-row">
            <div class="form-group">
              <label class="form-label">Setting</label>
              <input type="text" id="chron-setting" class="form-input" value="${escHtml(c?.setting || '')}" placeholder="New York City, 1998…" />
            </div>
            <div class="form-group">
              <label class="form-label">Year</label>
              <input type="text" id="chron-year" class="form-input" value="${escHtml(c?.year || '')}" placeholder="1998" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Themes</label>
            <input type="text" id="chron-themes" class="form-input" value="${escHtml(c?.themes || '')}" placeholder="Awakening, Redemption, Hidden Conspiracy…" />
          </div>
          <div class="form-group">
            <label class="form-label">Next Session</label>
            <input type="date" id="chron-next-session" class="form-input" value="${c?.next_session || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="chron-notes" class="form-input" rows="5" placeholder="Plot hooks, NPC notes, ongoing threads…">${escHtml(c?.notes || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="chron-toggle-label">
              <input type="checkbox" id="chron-allow-bg-xp" ${c?.allow_bg_xp ? 'checked' : ''}>
              Allow members to spend XP on Background traits
            </label>
            <p class="form-hint" style="margin-top:0.3rem">When enabled, players may use Advancement to raise Background ratings with XP.</p>
          </div>
          <details class="chron-rules-section" id="chron-rules-details">
            <summary class="chron-rules-summary">Character Creation Rules</summary>
            <div class="chron-rules-body">

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Point Pools</h4>
                <div class="chron-pool-grid">
                  <label class="chron-pool-label">Freebie Points</label>
                  <span></span>
                  <input type="number" id="chron-freebie-pts" class="form-input chron-rules-num" value="${freebiePoints}" min="0" max="99">
                  <span class="chron-rules-hint">Default: 15</span>

                  <label class="chron-pool-label">Merit Cap</label>
                  <label class="chron-toggle-label chron-pool-toggle">
                    <input type="checkbox" id="chron-merit-uncapped" ${meritCap === null ? 'checked' : ''}> Uncapped
                  </label>
                  <input type="number" id="chron-merit-cap" class="form-input chron-rules-num" value="${meritCap ?? 7}" min="0" max="99" ${meritCap === null ? 'disabled' : ''}>
                  <span class="chron-rules-hint">Max freebie pts on merits</span>

                  <label class="chron-pool-label">Flaw Bonus Cap</label>
                  <label class="chron-toggle-label chron-pool-toggle">
                    <input type="checkbox" id="chron-flaw-uncapped" ${flawCap === null ? 'checked' : ''}> Uncapped
                  </label>
                  <input type="number" id="chron-flaw-cap" class="form-input chron-rules-num" value="${flawCap ?? 7}" min="0" max="99" ${flawCap === null ? 'disabled' : ''}>
                  <span class="chron-rules-hint">Default: 7</span>
                </div>
              </div>

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Bonus Dots <span class="chron-rules-subhead">Free dots given to all characters (don't cost freebies)</span></h4>
                <div id="chron-bonus-dots-list"></div>
                <button type="button" class="btn-ghost btn-sm" id="btn-add-bonus-dot">+ Add Bonus</button>
              </div>

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Custom Backgrounds</h4>
                <div id="chron-custom-bgs-list"></div>
                <button type="button" class="btn-ghost btn-sm" id="btn-add-custom-bg">+ Add Background</button>
              </div>

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Custom Abilities</h4>
                <div id="chron-custom-abils-list"></div>
                <button type="button" class="btn-ghost btn-sm" id="btn-add-custom-abil">+ Add Ability</button>
              </div>

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Custom Merits</h4>
                <div id="chron-custom-merits-list"></div>
                <button type="button" class="btn-ghost btn-sm" id="btn-add-custom-merit">+ Add Merit</button>
              </div>

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Custom Flaws</h4>
                <div id="chron-custom-flaws-list"></div>
                <button type="button" class="btn-ghost btn-sm" id="btn-add-custom-flaw">+ Add Flaw</button>
              </div>

              <div class="chron-rules-group">
                <h4 class="chron-rules-heading">Allowed Factions
                  <span class="chron-rules-subhead">Restrict which affiliations characters may belong to</span>
                </h4>
                <p class="chron-rules-hint" style="margin:0 0 0.5rem">Leave all enabled to allow any group. Disable a faction to block it, or expand to restrict specific groups.</p>
                ${allFactions.map(f => {
                  const subs = FACTION_SUBFACTIONS[f]();
                  const isOn = facEnabled(f);
                  return `<div class="chron-faction-group" data-faction="${f}">
                    <div class="chron-faction-header">
                      <label class="chron-toggle-label chron-faction-main-label">
                        <input type="checkbox" class="chron-faction-cb" data-faction="${f}" ${isOn ? 'checked' : ''}>
                        <strong>${FACTION_LABEL[f]}</strong>
                      </label>
                      <button type="button" class="chron-subfac-toggle btn-ghost btn-sm" data-faction="${f}" ${!isOn ? 'disabled' : ''}>
                        ${allSubfacEnabled(f) ? 'All' : normFacForm[f].length + ' selected'} ▾
                      </button>
                    </div>
                    <div class="chron-subfac-list" id="chron-subfac-${f}" style="${!isOn ? 'display:none' : ''}">
                      <label class="chron-toggle-label chron-subfac-row chron-subfac-all-row">
                        <input type="checkbox" class="chron-subfac-all-cb" data-faction="${f}" ${allSubfacEnabled(f) ? 'checked' : ''}>
                        <em>All ${FACTION_LABEL[f]}</em>
                      </label>
                      <div class="chron-subfac-items" style="${allSubfacEnabled(f) ? 'display:none' : ''}">
                        ${subs.map(name => `
                        <label class="chron-toggle-label chron-subfac-row">
                          <input type="checkbox" class="chron-subfac-cb" data-faction="${f}" data-name="${escHtml(name)}" ${subfacEnabled(f, name) ? 'checked' : ''}>
                          ${escHtml(name)}
                        </label>`).join('')}
                      </div>
                    </div>
                  </div>`;
                }).join('')}
              </div>

            </div>
          </details>
          <div class="chronicle-form-actions">
            <div class="chronicle-form-actions-row">
              ${isEdit ? `<button class="btn-ghost" id="btn-discard-chronicle">Discard Changes</button>` : ''}
              <button class="btn-primary" id="btn-save-chronicle">${isEdit ? 'Save Changes' : 'Create Chronicle'}</button>
            </div>
            ${isEdit ? `<div class="chronicle-form-actions-row">
              <button class="btn-danger" id="btn-deactivate-chronicle">Deactivate Chronicle</button>
            </div>` : ''}
          </div>
        </div>
      </div>`;
  },

  // ── Detail view HTML ─────────────────────────────────────────────────────
  _detailHTML(c, notes = []) {
    const isActive  = c.is_active !== 0;
    const date = c.next_session
      ? new Date(c.next_session + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : null;
    const membersHTML = c.members.length === 0
      ? `<p class="chronicle-empty-state">${isActive ? 'No characters have joined yet. Share your join code!' : 'No characters are assigned.'}</p>`
      : c.members.map(m => `
          <div class="chronicle-member-row">
            <div class="chronicle-member-info">
              <span class="chronicle-member-name">${escHtml(m.name)}</span>
              <span class="chronicle-member-meta">${escHtml(m.tradition || m.affiliation || '—')} · Arete ${m.arete}</span>
              ${m.owner_username ? `<span class="chronicle-member-owner">Player: ${escHtml(m.owner_username)}</span>` : ''}
            </div>
            <div class="chronicle-member-actions">
              ${m.has_submitted_xp ? `<span class="member-xp-pending-badge" title="Has XP expenditures awaiting review">XP ●</span>` : ''}
              <div class="member-menu-wrap">
                <button class="member-menu-btn" data-char-id="${m.id}" title="Actions">⋮</button>
                <div class="member-menu-dropdown" hidden>
                  <button class="member-menu-item chronicle-view-sheet" data-char-id="${m.id}">View Sheet</button>
                  ${isActive ? `<button class="member-menu-item chronicle-remove-member" data-char-id="${m.id}">Remove from Chronicle</button>` : ''}
                </div>
              </div>
            </div>
          </div>`).join('');

    const detailRules = (() => { try { return typeof c.rules === 'object' ? c.rules : JSON.parse(c.rules || '{}'); } catch { return {}; } })();

    const infoRows = [
      c.setting && `<div class="chronicle-info-row"><span class="chronicle-info-label">Setting</span><span>${escHtml(c.setting)}</span></div>`,
      c.year    && `<div class="chronicle-info-row"><span class="chronicle-info-label">Year</span><span>${escHtml(c.year)}</span></div>`,
      c.themes  && `<div class="chronicle-info-row"><span class="chronicle-info-label">Themes</span><span>${escHtml(c.themes)}</span></div>`,
      date && isActive && `<div class="chronicle-info-row"><span class="chronicle-info-label">Next Session</span><span>${date}</span></div>`,
    ].filter(Boolean).join('');

    return `
      <div class="chronicle-page">
        <div class="chronicle-page-header">
          <h2 class="section-title" style="margin:0">
            ${escHtml(c.name)}
            ${!isActive ? '<span class="chronicle-inactive-badge">Inactive</span>' : ''}
          </h2>
        </div>

        ${!isActive ? `<div class="chronicle-inactive-notice">
          This chronicle is inactive. The join code has been deactivated and no new characters can be assigned to it.
        </div>` : ''}

        <div class="chronicle-detail-body">
          <div class="chronicle-detail-main">
            ${infoRows ? `<div class="chronicle-info-block">${infoRows}</div>` : ''}
            ${c.notes ? `<div class="chron-detail-description">${escHtml(c.notes)}</div>` : ''}
            ${this._rulesDisplayHTML(detailRules)}
          </div>
          <div class="chronicle-detail-sidebar">
            ${isActive ? `
            <div class="chronicle-join-block">
              <div class="chronicle-info-label">Join Code</div>
              <div class="chronicle-join-display">
                <span class="chronicle-join-code-big" id="join-code-display">${c.join_code}</span>
                <button class="btn-ghost btn-sm" id="btn-copy-join-code" title="Copy join code">Copy</button>
              </div>
              <p class="chronicle-join-hint">Share this code with players so they can join their character.</p>
            </div>` : ''}
            <div class="chronicle-members-block">
              <div class="chronicle-members-header">
                <div class="chronicle-info-label">Members (${c.members.length})</div>
                ${isActive && c.members.length > 0 ? `<button class="btn-secondary btn-sm" id="btn-grant-xp">Grant XP</button>` : ''}
              </div>
              <div id="chronicle-member-list">${membersHTML}</div>
            </div>
            ${isActive ? `<div class="chronicle-bg-xp-status">
              <span class="chronicle-info-label">Background XP</span>
              <span class="chron-bg-xp-badge ${c.allow_bg_xp ? 'chron-bg-xp-on' : 'chron-bg-xp-off'}">
                ${c.allow_bg_xp ? 'Allowed' : 'Restricted'}
              </span>
            </div>` : ''}
          </div>
        </div>

        <div class="chronicle-update-row">
          ${isActive
            ? `<button class="btn-ghost" id="btn-edit-chronicle">Update Chronicle</button>`
            : `<button class="btn-danger" id="btn-delete-chronicle-inactive">Delete Chronicle</button>`
          }
        </div>

        <div class="chronicle-notes-section">
          <div class="chronicle-notes-header">
            <div class="ornate-divider" style="flex:1;margin:0">— Storyteller Notes —</div>
            ${isActive ? `<button class="btn-secondary btn-sm" id="btn-new-note">+ New Note</button>` : ''}
          </div>
          <div id="note-form-container"></div>
          <div id="note-list">${this._notesListHTML(notes, isActive ? c.members : [])}</div>
        </div>
      </div>`;
  },

  // ── Rules display summary (read-only, shown on detail screen) ───────────────
  _rulesDisplayHTML(rules) {
    if (!rules) return '';
    const fp      = rules.freebiePoints;
    const mc      = rules.meritCap;
    const fc      = rules.flawCap;
    const bds     = (rules.bonusDots         || []).filter(bd => bd.amount > 0);
    const cBgs    = (rules.customBackgrounds || []).filter(b  => b.name?.trim());
    const cAbils  = (rules.customAbilities   || []).filter(a  => a.name?.trim());
    const cMerits = (rules.customMerits      || []).filter(m  => m.name?.trim());
    const cFlaws  = (rules.customFlaws       || []).filter(f  => f.name?.trim());
    const normFacDetail = normalizeAllowedFactions(rules.allowedFactions);
    const abilCat = { talents: 'Talent', skills: 'Skill', knowledges: 'Knowledge' };
    const bdTarget = bd => {
      const map = { arete:'Arete', focus_sphere:'Focus Sphere', any_ability:'any Ability',
        attribute:'any Attribute', talent:'any Talent', skill:'any Skill',
        knowledge:'any Knowledge', sphere:'any Sphere', background:'any Background' };
      return bd.name || map[bd.type] || bd.type;
    };

    const hasPoolChange = (fp !== undefined && fp !== 15)
                       || (mc !== undefined && mc !== null)
                       || (fc !== undefined && fc !== 7);
    const hasContent = hasPoolChange || bds.length || cBgs.length || cAbils.length
                    || cMerits.length || cFlaws.length || normFacDetail;
    if (!hasContent) return '';

    const sec = (label, rows) => rows ? `
      <div class="chron-detail-rules-group">
        <div class="chron-detail-rules-label">${label}</div>
        <div class="chron-detail-rules-items">${rows}</div>
      </div>` : '';

    let html = '';

    if (hasPoolChange) {
      let rows = '';
      if (fp !== undefined && fp !== 15) rows += `<span class="chron-dr-pill">${fp} freebie pts</span>`;
      if (mc !== undefined && mc !== null) rows += `<span class="chron-dr-pill">Merit cap: ${mc}</span>`;
      if (fc !== undefined && fc !== 7)   rows += `<span class="chron-dr-pill">Flaw cap: ${fc}</span>`;
      html += sec('Point Pools', rows);
    }
    if (bds.length) html += sec('Bonus Dots',
      bds.map(bd => `<span class="chron-dr-pill chron-dr-bonus">+${bd.amount} ${escHtml(bdTarget(bd))}</span>`).join(''));
    if (normFacDetail) {
      const facPills = Object.entries(normFacDetail).flatMap(([f, subs]) => {
        const label = FACTION_LABEL[f] || f;
        if (!subs.length) return [`<span class="chron-dr-pill">${escHtml(label)}</span>`];
        return subs.map(s => `<span class="chron-dr-pill">${escHtml(label)}: ${escHtml(s)}</span>`);
      }).join('');
      html += sec('Allowed Factions', facPills);
    }
    if (cAbils.length) html += sec('Custom Abilities',
      cAbils.map(a => `<span class="chron-dr-pill">${escHtml(a.name)} <em>${abilCat[a.category]||a.category}</em></span>`).join(''));
    if (cBgs.length) html += sec('Custom Backgrounds',
      cBgs.map(b => `<span class="chron-dr-pill">${escHtml(b.name)}</span>`).join(''));
    if (cMerits.length) html += sec('Custom Merits',
      cMerits.map(m => `<span class="chron-dr-pill">${escHtml(m.name)} <em>${m.cost}pt</em></span>`).join(''));
    if (cFlaws.length) html += sec('Custom Flaws',
      cFlaws.map(f => `<span class="chron-dr-pill">${escHtml(f.name)} <em>+${f.cost}pt</em></span>`).join(''));

    return `<div class="chron-detail-rules"><div class="chron-detail-rules-title">Character Creation Rules</div>${html}</div>`;
  },

  // ── Notes list HTML ───────────────────────────────────────────────────────
  _notesListHTML(notes, members = []) {
    if (!notes.length) {
      return `<p class="chronicle-empty-state">No notes yet. Click <em>+ New Note</em> to write one.</p>`;
    }
    return notes.map(n => this._noteCardHTML(n, members)).join('');
  },

  _noteCardHTML(note, members = []) {
    const sharedTo    = note.shares || [];
    const unreadCount = sharedTo.filter(s => !s.seen_at).length;
    const preview     = note.body.replace(/<[^>]+>/g, '').trim().slice(0, 160);

    const shareStatusHTML = sharedTo.length
      ? sharedTo.map(s => `
          <span class="note-share-recipient">
            ${escHtml(s.character_name)}
            ${s.seen_at
              ? `<span class="note-read-stamp">Read ${formatDateTime(s.seen_at)}</span>`
              : `<span class="note-unread-stamp">Unread</span>`
            }
          </span>`).join('')
      : `<span class="note-not-shared">Not shared</span>`;

    return `
      <div class="note-card" data-note-id="${note.id}">
        <div class="note-card-header">
          <div class="note-card-title-row">
            <span class="note-card-title">${escHtml(note.title)}</span>
            ${unreadCount ? `<span class="note-unread-badge">${unreadCount} unread</span>` : ''}
          </div>
          <div class="note-card-actions">
            <button class="btn-ghost btn-sm note-edit-btn" data-note-id="${note.id}">Edit</button>
            <button class="btn-danger btn-sm note-delete-btn" data-note-id="${note.id}">Delete</button>
          </div>
        </div>
        ${preview ? `<div class="note-card-preview">${escHtml(preview)}${note.body.replace(/<[^>]+>/g,'').trim().length > 160 ? '…' : ''}</div>` : ''}
        <div class="note-card-footer">
          <div class="note-share-status">${shareStatusHTML}</div>
          <span class="note-date">${formatDate(note.updated_at)}</span>
        </div>
      </div>`;
  },

  // ── Note editor form HTML ─────────────────────────────────────────────────
  _noteFormHTML(note, members = []) {
    const sharedIds = (note?.shares || []).map(s => s.character_id);
    const memberChecks = members.length
      ? members.map(m => `
          <label class="note-share-checkbox">
            <input type="checkbox" class="note-share-check" value="${m.id}" ${sharedIds.includes(m.id) ? 'checked' : ''} />
            <span>${escHtml(m.name)}</span>
            ${m.owner_username ? `<span class="note-share-player">(${escHtml(m.owner_username)})</span>` : ''}
          </label>`).join('')
      : `<span class="chronicle-empty-state" style="font-size:0.8rem">No members yet — share your join code first.</span>`;
    return `
      <div class="note-form">
        <input type="text" id="note-title-input" class="note-title-input"
               placeholder="Note title…" value="${escHtml(note?.title || '')}" maxlength="120" />
        <div id="note-editor-container"></div>
        <div class="note-share-section">
          <div class="note-share-label">Share with players:</div>
          <div class="note-share-list">${memberChecks}</div>
        </div>
        <div class="note-form-actions">
          <button class="btn-ghost" id="note-cancel-btn">Cancel</button>
          <button class="btn-primary" id="note-save-btn">${note ? 'Update Note' : 'Save Note'}</button>
        </div>
      </div>`;
  },

  // ── Open note form (create or edit) ──────────────────────────────────────
  _openNoteForm(c, note = null) {
    const container = $('#note-form-container');
    if (!container) return;
    this._quill = null;
    container.innerHTML = this._noteFormHTML(note, c.members);
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    this._quill = new Quill('#note-editor-container', {
      theme: 'snow',
      placeholder: 'Write your note here…',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ header: [1, 2, 3, false] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['clean'],
        ],
      },
    });
    if (note?.body) this._quill.clipboard.dangerouslyPasteHTML(note.body);
    $('#note-title-input')?.focus();

    $('#note-cancel-btn')?.addEventListener('click', () => {
      this._quill = null;
      container.innerHTML = '';
    });

    $('#note-save-btn')?.addEventListener('click', async () => {
      const title = $('#note-title-input')?.value?.trim();
      if (!title) { toast('Note title is required.', 'error'); return; }
      const body = this._quill?.root.innerHTML || '';
      const charIds = $$('.note-share-check:checked').map(cb => parseInt(cb.value));
      const btn = $('#note-save-btn');
      if (btn) btn.disabled = true;
      try {
        const url  = note ? `/api/chronicles/${c.id}/notes/${note.id}` : `/api/chronicles/${c.id}/notes`;
        const r = await fetch(url, {
          method: note ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, character_ids: charIds }),
        });
        if (!r.ok) throw new Error();
        this._quill = null;
        toast(note ? 'Note updated.' : 'Note created!');
        await this.showDetail(c.id);
      } catch {
        toast('Failed to save note.', 'error');
        if (btn) btn.disabled = false;
      }
    });
  },

  // ── Form listeners (create & edit) ───────────────────────────────────────
  _attachFormListeners(c) {
    const isEdit = !!c;

    // ── Rules state ───────────────────────────────────────────────────────────
    const existingRules = (() => { try { return typeof c?.rules === 'object' ? c.rules : JSON.parse(c?.rules || '{}'); } catch { return {}; } })();
    const rulesState = {
      bonusDots:         (existingRules.bonusDots         || []).map(x => ({...x})),
      customBackgrounds: (existingRules.customBackgrounds  || []).map(x => ({...x})),
      customAbilities:   (existingRules.customAbilities    || []).map(x => ({...x})),
      customMerits:      (existingRules.customMerits       || []).map(x => ({...x})),
      customFlaws:       (existingRules.customFlaws        || []).map(x => ({...x})),
    };

    function genId(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 9); }

    const BD_TYPES = [
      { value: 'attribute',    label: 'Attribute' },
      { value: 'talent',       label: 'Talent' },
      { value: 'skill',        label: 'Skill' },
      { value: 'knowledge',    label: 'Knowledge' },
      { value: 'any_ability',  label: 'Any Ability' },
      { value: 'sphere',       label: 'Sphere' },
      { value: 'focus_sphere', label: 'Focus Sphere' },
      { value: 'background',   label: 'Background' },
      { value: 'arete',        label: 'Arete' },
    ];
    // Types that have no name sub-selector (fixed or character-determined)
    const BD_NO_NAME_TYPES = new Set(['arete','focus_sphere','any_ability']);
    const BD_SPHERE_NAMES = ['Correspondence','Entropy','Forces','Life','Matter','Mind','Prime','Spirit','Time'];
    const BD_ATTR_NAMES   = ['Strength','Dexterity','Stamina','Charisma','Manipulation','Appearance','Perception','Intelligence','Wits'];

    function getBdNameOptions(type, currentName) {
      const any = `<option value="" ${!currentName ? 'selected' : ''}>(any ${BD_TYPES.find(t=>t.value===type)?.label || type})</option>`;
      let items = [];
      if (type === 'attribute') {
        items = BD_ATTR_NAMES;
      } else if (type === 'talent') {
        items = [...M20.TALENTS.map(a=>a.name), ...rulesState.customAbilities.filter(a=>a.category==='talents'&&a.name).map(a=>a.name)];
      } else if (type === 'skill') {
        items = [...M20.SKILLS.map(a=>a.name), ...rulesState.customAbilities.filter(a=>a.category==='skills'&&a.name).map(a=>a.name)];
      } else if (type === 'knowledge') {
        items = [...M20.KNOWLEDGES.map(a=>a.name), ...rulesState.customAbilities.filter(a=>a.category==='knowledges'&&a.name).map(a=>a.name)];
      } else if (type === 'sphere') {
        items = BD_SPHERE_NAMES;
      } else if (type === 'background') {
        items = [...M20.BACKGROUNDS.map(b=>b.name), ...rulesState.customBackgrounds.filter(b=>b.name).map(b=>b.name)];
      }
      return any + items.map(n => `<option value="${escHtml(n)}" ${currentName===n?'selected':''}>${escHtml(n)}</option>`).join('');
    }
    const MF_CATEGORIES = ['Physical', 'Mental', 'Social', 'Supernatural'];
    const ABIL_CATEGORIES = [
      { value: 'talents',    label: 'Talent' },
      { value: 'skills',     label: 'Skill' },
      { value: 'knowledges', label: 'Knowledge' },
    ];

    function renderBonusDotsList() {
      const el = document.getElementById('chron-bonus-dots-list');
      if (!el) return;
      el.innerHTML = rulesState.bonusDots.map((bd, i) => {
        const noName = BD_NO_NAME_TYPES.has(bd.type);
        const typeHint = bd.type === 'focus_sphere' ? '<span class="chron-rules-hint">Character\'s affinity sphere</span>'
                       : bd.type === 'any_ability'  ? '<span class="chron-rules-hint">Any talent, skill, or knowledge</span>'
                       : '';
        return `
        <div class="chron-rules-item" data-idx="${i}">
          <select class="form-input chron-rules-sel bd-type" data-idx="${i}">
            ${BD_TYPES.map(t => `<option value="${t.value}" ${bd.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
          ${noName ? typeHint : `<select class="form-input chron-rules-name bd-name" data-idx="${i}">
            ${getBdNameOptions(bd.type, bd.name)}
          </select>`}
          <input type="number" class="form-input chron-rules-num bd-amount" value="${bd.amount || 1}" min="1" max="10">
          <button type="button" class="btn-ghost btn-sm chron-rules-remove" data-list="bonusDots" data-idx="${i}">✕</button>
        </div>`;
      }).join('') || '<p class="chron-rules-empty">No bonus dots set.</p>';
      // Attach type-change listener to update name dropdown live
      el.querySelectorAll('.bd-type').forEach(sel => {
        sel.addEventListener('change', () => {
          const idx = parseInt(sel.dataset.idx);
          rulesState.bonusDots[idx].type = sel.value;
          rulesState.bonusDots[idx].name = null;
          renderBonusDotsList();
          attachRulesListDelegation();
        });
      });
    }

    function renderCustomBgList() {
      const el = document.getElementById('chron-custom-bgs-list');
      if (!el) return;
      el.innerHTML = rulesState.customBackgrounds.map((bg, i) => `
        <div class="chron-rules-item" data-idx="${i}">
          <input type="text" class="form-input chron-rules-name cbg-name" placeholder="Background name" value="${escHtml(bg.name || '')}">
          <input type="number" class="form-input chron-rules-num cbg-max" value="${bg.max || 5}" min="1" max="10" title="Max dots">
          <input type="text" class="form-input chron-rules-desc cbg-desc" placeholder="Description (optional)" value="${escHtml(bg.description || '')}">
          <button type="button" class="btn-ghost btn-sm chron-rules-remove" data-list="customBackgrounds" data-idx="${i}">✕</button>
        </div>`).join('') || '<p class="chron-rules-empty">No custom backgrounds.</p>';
    }

    function renderCustomAbilList() {
      const el = document.getElementById('chron-custom-abils-list');
      if (!el) return;
      el.innerHTML = rulesState.customAbilities.map((a, i) => `
        <div class="chron-rules-item" data-idx="${i}">
          <input type="text" class="form-input chron-rules-name ca-name" placeholder="Ability name" value="${escHtml(a.name || '')}">
          <select class="form-input chron-rules-sel ca-cat">
            ${ABIL_CATEGORIES.map(c2 => `<option value="${c2.value}" ${a.category === c2.value ? 'selected' : ''}>${c2.label}</option>`).join('')}
          </select>
          <button type="button" class="btn-ghost btn-sm chron-rules-remove" data-list="customAbilities" data-idx="${i}">✕</button>
        </div>`).join('') || '<p class="chron-rules-empty">No custom abilities.</p>';
    }

    function renderCustomMeritList() {
      const el = document.getElementById('chron-custom-merits-list');
      if (!el) return;
      el.innerHTML = rulesState.customMerits.map((m, i) => `
        <div class="chron-rules-item" data-idx="${i}">
          <input type="text" class="form-input chron-rules-name cm-name" placeholder="Merit name" value="${escHtml(m.name || '')}">
          <input type="number" class="form-input chron-rules-num cm-cost" value="${m.cost || 1}" min="1" max="7" title="Cost (pts)">
          <select class="form-input chron-rules-sel cm-cat">
            ${MF_CATEGORIES.map(cat => `<option value="${cat}" ${m.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
          <input type="text" class="form-input chron-rules-desc cm-desc" placeholder="Description (optional)" value="${escHtml(m.description || '')}">
          <button type="button" class="btn-ghost btn-sm chron-rules-remove" data-list="customMerits" data-idx="${i}">✕</button>
        </div>`).join('') || '<p class="chron-rules-empty">No custom merits.</p>';
    }

    function renderCustomFlawList() {
      const el = document.getElementById('chron-custom-flaws-list');
      if (!el) return;
      el.innerHTML = rulesState.customFlaws.map((f, i) => `
        <div class="chron-rules-item" data-idx="${i}">
          <input type="text" class="form-input chron-rules-name cf-name" placeholder="Flaw name" value="${escHtml(f.name || '')}">
          <input type="number" class="form-input chron-rules-num cf-cost" value="${f.cost || 1}" min="1" max="7" title="Bonus pts">
          <select class="form-input chron-rules-sel cf-cat">
            ${MF_CATEGORIES.map(cat => `<option value="${cat}" ${f.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
          <input type="text" class="form-input chron-rules-desc cf-desc" placeholder="Description (optional)" value="${escHtml(f.description || '')}">
          <button type="button" class="btn-ghost btn-sm chron-rules-remove" data-list="customFlaws" data-idx="${i}">✕</button>
        </div>`).join('') || '<p class="chron-rules-empty">No custom flaws.</p>';
    }

    // Initial render
    renderBonusDotsList();
    renderCustomBgList();
    renderCustomAbilList();
    renderCustomMeritList();
    renderCustomFlawList();

    // Merit cap toggle
    document.getElementById('chron-merit-uncapped')?.addEventListener('change', e => {
      const capInput = document.getElementById('chron-merit-cap');
      if (capInput) capInput.disabled = e.target.checked;
    });
    // Flaw cap toggle
    document.getElementById('chron-flaw-uncapped')?.addEventListener('change', e => {
      const capInput = document.getElementById('chron-flaw-cap');
      if (capInput) capInput.disabled = e.target.checked;
    });

    // ── Faction / subfaction interaction ───────────────────────────────────────
    function updateSubfacToggleLabel(f) {
      const btn = document.querySelector(`.chron-subfac-toggle[data-faction="${f}"]`);
      if (!btn) return;
      const allCb = document.querySelector(`.chron-subfac-all-cb[data-faction="${f}"]`);
      const picked = [...document.querySelectorAll(`.chron-subfac-cb[data-faction="${f}"]:checked`)].length;
      const total  = FACTION_SUBFACTIONS[f]().length;
      btn.textContent = (allCb?.checked || picked === total) ? 'All ▾' : `${picked} selected ▾`;
    }

    document.querySelectorAll('.chron-faction-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const f = cb.dataset.faction;
        const list   = document.getElementById(`chron-subfac-${f}`);
        const toggle = document.querySelector(`.chron-subfac-toggle[data-faction="${f}"]`);
        if (list)   list.style.display   = cb.checked ? '' : 'none';
        if (toggle) toggle.disabled       = !cb.checked;
      });
    });

    document.querySelectorAll('.chron-subfac-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const f     = btn.dataset.faction;
        const items = document.querySelector(`#chron-subfac-${f} .chron-subfac-items`);
        if (!items) return;
        const open  = items.style.display !== 'none';
        items.style.display = open ? 'none' : '';
        // When expanding, sync "all" checkbox state
        if (!open) {
          const allCb  = document.querySelector(`.chron-subfac-all-cb[data-faction="${f}"]`);
          const subCbs = [...document.querySelectorAll(`.chron-subfac-cb[data-faction="${f}"]`)];
          if (allCb?.checked) subCbs.forEach(s => { s.checked = true; });
        }
      });
    });

    document.querySelectorAll('.chron-subfac-all-cb').forEach(allCb => {
      allCb.addEventListener('change', () => {
        const f     = allCb.dataset.faction;
        const items = document.querySelector(`#chron-subfac-${f} .chron-subfac-items`);
        if (allCb.checked) {
          // Check all individual boxes and hide the expanded list
          document.querySelectorAll(`.chron-subfac-cb[data-faction="${f}"]`).forEach(s => { s.checked = true; });
          if (items) items.style.display = 'none';
        } else {
          // Show individual list to let ST pick
          if (items) items.style.display = '';
        }
        updateSubfacToggleLabel(f);
      });
    });

    document.querySelectorAll('.chron-subfac-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const f      = cb.dataset.faction;
        const subCbs = [...document.querySelectorAll(`.chron-subfac-cb[data-faction="${f}"]`)];
        const allCb  = document.querySelector(`.chron-subfac-all-cb[data-faction="${f}"]`);
        const allChecked = subCbs.every(s => s.checked);
        if (allCb) allCb.checked = allChecked;
        if (allChecked) {
          const items = document.querySelector(`#chron-subfac-${f} .chron-subfac-items`);
          if (items) items.style.display = 'none';
        }
        updateSubfacToggleLabel(f);
      });
    });

    // Add buttons
    document.getElementById('btn-add-bonus-dot')?.addEventListener('click', () => {
      rulesState.bonusDots.push({ type: 'talent', name: null, amount: 1 });
      renderBonusDotsList();
      attachRulesListDelegation();
    });
    document.getElementById('btn-add-custom-bg')?.addEventListener('click', () => {
      rulesState.customBackgrounds.push({ id: genId('cb'), name: '', max: 5, description: '' });
      renderCustomBgList();
      attachRulesListDelegation();
    });
    document.getElementById('btn-add-custom-abil')?.addEventListener('click', () => {
      rulesState.customAbilities.push({ id: genId('ca'), name: '', category: 'talents' });
      renderCustomAbilList();
      attachRulesListDelegation();
    });
    document.getElementById('btn-add-custom-merit')?.addEventListener('click', () => {
      rulesState.customMerits.push({ id: genId('cm'), name: '', cost: 1, category: 'Social', description: '' });
      renderCustomMeritList();
      attachRulesListDelegation();
    });
    document.getElementById('btn-add-custom-flaw')?.addEventListener('click', () => {
      rulesState.customFlaws.push({ id: genId('cf'), name: '', cost: 1, category: 'Social', description: '' });
      renderCustomFlawList();
      attachRulesListDelegation();
    });

    function attachRulesListDelegation() {
      document.querySelectorAll('.chron-rules-remove').forEach(btn => {
        btn.onclick = () => {
          const list = btn.dataset.list;
          const idx  = parseInt(btn.dataset.idx);
          rulesState[list].splice(idx, 1);
          if (list === 'bonusDots')              renderBonusDotsList();
          else if (list === 'customBackgrounds') renderCustomBgList();
          else if (list === 'customAbilities')   renderCustomAbilList();
          else if (list === 'customMerits')      renderCustomMeritList();
          else if (list === 'customFlaws')       renderCustomFlawList();
          attachRulesListDelegation();
        };
      });
    }
    attachRulesListDelegation();

    function collectRules() {
      // Sync in-memory state from current DOM values before collecting
      document.querySelectorAll('#chron-bonus-dots-list .chron-rules-item').forEach((row, i) => {
        if (!rulesState.bonusDots[i]) return;
        const type = row.querySelector('.bd-type')?.value || 'talent';
        rulesState.bonusDots[i].type   = type;
        // Types with no name selector store null (applied by the engine at runtime)
        const noName = ['arete','focus_sphere','any_ability'].includes(type);
        const nameVal = noName ? null : (row.querySelector('.bd-name')?.value || null);
        rulesState.bonusDots[i].name   = nameVal || null;
        rulesState.bonusDots[i].amount = parseInt(row.querySelector('.bd-amount')?.value) || 1;
      });
      document.querySelectorAll('#chron-custom-bgs-list .chron-rules-item').forEach((row, i) => {
        if (!rulesState.customBackgrounds[i]) return;
        rulesState.customBackgrounds[i].name        = row.querySelector('.cbg-name')?.value?.trim() || '';
        rulesState.customBackgrounds[i].max         = parseInt(row.querySelector('.cbg-max')?.value) || 5;
        rulesState.customBackgrounds[i].description = row.querySelector('.cbg-desc')?.value?.trim() || '';
      });
      document.querySelectorAll('#chron-custom-abils-list .chron-rules-item').forEach((row, i) => {
        if (!rulesState.customAbilities[i]) return;
        rulesState.customAbilities[i].name     = row.querySelector('.ca-name')?.value?.trim() || '';
        rulesState.customAbilities[i].category = row.querySelector('.ca-cat')?.value || 'talents';
      });
      document.querySelectorAll('#chron-custom-merits-list .chron-rules-item').forEach((row, i) => {
        if (!rulesState.customMerits[i]) return;
        rulesState.customMerits[i].name        = row.querySelector('.cm-name')?.value?.trim() || '';
        rulesState.customMerits[i].cost        = parseInt(row.querySelector('.cm-cost')?.value) || 1;
        rulesState.customMerits[i].category    = row.querySelector('.cm-cat')?.value || 'Social';
        rulesState.customMerits[i].description = row.querySelector('.cm-desc')?.value?.trim() || '';
      });
      document.querySelectorAll('#chron-custom-flaws-list .chron-rules-item').forEach((row, i) => {
        if (!rulesState.customFlaws[i]) return;
        rulesState.customFlaws[i].name        = row.querySelector('.cf-name')?.value?.trim() || '';
        rulesState.customFlaws[i].cost        = parseInt(row.querySelector('.cf-cost')?.value) || 1;
        rulesState.customFlaws[i].category    = row.querySelector('.cf-cat')?.value || 'Social';
        rulesState.customFlaws[i].description = row.querySelector('.cf-desc')?.value?.trim() || '';
      });

      const meritUncapped = document.getElementById('chron-merit-uncapped')?.checked;
      const flawUncapped  = document.getElementById('chron-flaw-uncapped')?.checked;
      // Collect allowedFactions as object { faction: string[] } or null
      const allowedFactionsObj = {};
      let anyFactionRestriction = false;
      ['Traditions', 'Technocracy', 'Disparates'].forEach(f => {
        const fCb = document.querySelector(`.chron-faction-cb[data-faction="${f}"]`);
        if (!fCb?.checked) { anyFactionRestriction = true; return; } // faction disabled — not in result
        const allCb = document.querySelector(`.chron-subfac-all-cb[data-faction="${f}"]`);
        if (allCb?.checked) {
          allowedFactionsObj[f] = []; // all subfactions
        } else {
          const picked = [...document.querySelectorAll(`.chron-subfac-cb[data-faction="${f}"]:checked`)].map(cb => cb.dataset.name);
          allowedFactionsObj[f] = picked;
          if (picked.length < FACTION_SUBFACTIONS[f]().length) anyFactionRestriction = true;
        }
      });
      const allFactionKeys = ['Traditions', 'Technocracy', 'Disparates'];
      const allEnabled = allFactionKeys.every(f => f in allowedFactionsObj && allowedFactionsObj[f].length === 0);
      const allowedFactions = (anyFactionRestriction || !allEnabled) ? allowedFactionsObj : null;
      return {
        freebiePoints:      parseInt(document.getElementById('chron-freebie-pts')?.value) || 15,
        meritCap:           meritUncapped ? null : (parseInt(document.getElementById('chron-merit-cap')?.value) || 7),
        flawCap:            flawUncapped  ? null : (parseInt(document.getElementById('chron-flaw-cap')?.value)  ?? 7),
        bonusDots:          rulesState.bonusDots.filter(bd => bd.amount > 0),
        customBackgrounds:  rulesState.customBackgrounds.filter(bg => bg.name),
        customAbilities:    rulesState.customAbilities.filter(a => a.name),
        customMerits:       rulesState.customMerits.filter(m => m.name),
        customFlaws:        rulesState.customFlaws.filter(f => f.name),
        allowedFactions,
      };
    }

    $('#btn-save-chronicle')?.addEventListener('click', async () => {
      const name = $('#chron-name')?.value?.trim();
      if (!name) { toast('Chronicle name is required.', 'error'); return; }
      const body = {
        name,
        setting:      $('#chron-setting')?.value || '',
        year:         $('#chron-year')?.value || '',
        themes:       $('#chron-themes')?.value || '',
        notes:        $('#chron-notes')?.value || '',
        next_session: $('#chron-next-session')?.value || '',
        allow_bg_xp:  $('#chron-allow-bg-xp')?.checked ? 1 : 0,
        rules:        collectRules(),
      };
      try {
        const r = await fetch(isEdit ? `/api/chronicles/${c.id}` : '/api/chronicles', {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok) { toast(data.error || 'Failed to save.', 'error'); return; }
        toast(isEdit ? 'Chronicle updated.' : 'Chronicle created!');
        if (isEdit) { this.showDetail(c.id); } else { await App.showDashboard(); }
      } catch { toast('Failed to save chronicle.', 'error'); }
    });

    if (isEdit) {
      // Discard — go back to detail without saving
      $('#btn-discard-chronicle')?.addEventListener('click', () => this.showDetail(c.id));

      // Deactivate — warns, then deactivates without deleting
      $('#btn-deactivate-chronicle')?.addEventListener('click', () => {
        $('#modal-title').textContent = 'Deactivate Chronicle';
        $('#modal-body').innerHTML = `
          <p>Deactivating <strong style="color:var(--gold-mid)">${escHtml(c.name)}</strong> will:</p>
          <ul style="margin:0.6rem 0 0.6rem 1.2rem;font-size:0.88rem;color:var(--text-dim);line-height:1.8">
            <li>Unassign all player characters from this chronicle</li>
            <li>Destroy the join code — no new characters can join</li>
            <li>Archive the chronicle as inactive</li>
          </ul>
          <p style="font-size:0.85rem;color:var(--text-dim)">The chronicle and its notes will be preserved and can be permanently deleted from the inactive view.</p>`;
        const confirmBtn = $('#modal-confirm');
        confirmBtn.textContent = 'Deactivate Chronicle';
        confirmBtn.disabled = false;
        confirmBtn.onclick = async () => {
          try {
            confirmBtn.disabled = true;
            const r = await fetch(`/api/chronicles/${c.id}/deactivate`, { method: 'POST' });
            if (!r.ok) throw new Error();
            App.closeModal();
            toast('Chronicle deactivated.');
            await this.showDetail(c.id);
          } catch {
            toast('Failed to deactivate chronicle.', 'error');
            confirmBtn.disabled = false;
          }
        };
        $('#modal-overlay').style.display = 'flex';
      });
    }
  },

  // ── Detail listeners ─────────────────────────────────────────────────────
  _attachDetailListeners(c, notes = []) {
    // Update Chronicle → switch to form view (active only)
    $('#btn-edit-chronicle')?.addEventListener('click', () => {
      $('#chronicle-content').innerHTML = this._formHTML(c);
      this._attachFormListeners(c);
    });

    // Delete Chronicle (inactive chronicles only) — requires name confirmation
    $('#btn-delete-chronicle-inactive')?.addEventListener('click', () => {
      $('#modal-title').textContent = 'Delete Chronicle';
      $('#modal-body').innerHTML = `
        <p>Permanently delete <strong style="color:var(--gold-mid)">${escHtml(c.name)}</strong>?</p>
        <p style="margin:0.6rem 0;font-size:0.88rem;color:var(--text-dim)">
          All Storyteller Notes will be permanently destroyed. This cannot be undone.
        </p>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">
          Type <strong style="color:var(--text-mid)">${escHtml(c.name)}</strong> to confirm:
        </p>
        <input type="text" id="modal-delete-name-input" class="form-input"
               placeholder="${escHtml(c.name)}" style="margin-top:0.5rem" autocomplete="off" />`;
      const confirmBtn = $('#modal-confirm');
      confirmBtn.textContent = 'Delete Chronicle';
      confirmBtn.disabled = true;
      setTimeout(() => {
        $('#modal-delete-name-input')?.addEventListener('input', e => {
          confirmBtn.disabled = e.target.value !== c.name;
        });
      }, 0);
      confirmBtn.onclick = async () => {
        try {
          confirmBtn.disabled = true;
          const r = await fetch(`/api/chronicles/${c.id}`, { method: 'DELETE' });
          if (!r.ok) throw new Error();
          App.closeModal();
          toast('Chronicle deleted.');
          await App.showDashboard();
        } catch {
          toast('Failed to delete chronicle.', 'error');
          confirmBtn.disabled = false;
        }
      };
      $('#modal-overlay').style.display = 'flex';
    });

    // Copy join code
    $('#btn-copy-join-code')?.addEventListener('click', () => {
      navigator.clipboard.writeText(c.join_code).then(() => toast('Join code copied!'));
    });

    // Member row hamburger menus
    const closeAllMemberMenus = () => {
      $$('.member-menu-dropdown').forEach(d => d.hidden = true);
    };
    $$('.member-menu-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const wrap = btn.closest('.member-menu-wrap');
        const dropdown = wrap?.querySelector('.member-menu-dropdown');
        if (!dropdown) return;
        const isOpen = !dropdown.hidden;
        closeAllMemberMenus();
        if (!isOpen) dropdown.hidden = false;
      });
    });
    // Close menus when clicking anywhere outside
    document.addEventListener('click', closeAllMemberMenus, { once: false, capture: false });

    // View member sheet (ST mode)
    $$('.chronicle-view-sheet').forEach(btn => {
      btn.addEventListener('click', () => {
        closeAllMemberMenus();
        App.viewMemberCharacter(c.id, parseInt(btn.dataset.charId));
      });
    });

    // Grant XP to members
    $('#btn-grant-xp')?.addEventListener('click', () => this._showGrantXpModal(c));

    // Remove members
    $$('.chronicle-remove-member').forEach(btn => {
      btn.addEventListener('click', async () => {
        closeAllMemberMenus();
        const charId = parseInt(btn.dataset.charId);
        const memberRow = btn.closest('.chronicle-member-row');
        const name = memberRow?.querySelector('.chronicle-member-name')?.textContent || 'this character';
        if (!confirm(`Remove ${name} from the chronicle?`)) return;
        try {
          const r = await fetch(`/api/chronicles/${c.id}/members/${charId}`, { method: 'DELETE' });
          if (!r.ok) throw new Error();
          memberRow?.remove();
          toast(`${name} removed from chronicle.`);
          const remaining = $$('.chronicle-member-row').length;
          const header = $('.chronicle-members-header .chronicle-info-label');
          if (header) header.textContent = `Members (${remaining})`;
          if (remaining === 0) {
            $('#chronicle-member-list').innerHTML = `<p class="chronicle-empty-state">No characters have joined yet.</p>`;
          }
        } catch { toast('Failed to remove member.', 'error'); }
      });
    });

    // New Note
    $('#btn-new-note')?.addEventListener('click', () => this._openNoteForm(c, null));

    // Edit / Delete note cards
    $$('.note-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const noteId = parseInt(btn.dataset.noteId);
        const note = this._notes.find(n => n.id === noteId);
        if (note) this._openNoteForm(c, note);
      });
    });

    $$('.note-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const noteId = parseInt(btn.dataset.noteId);
        const noteTitle = this._notes.find(n => n.id === noteId)?.title || 'this note';
        if (!confirm(`Delete "${noteTitle}"? This cannot be undone.`)) return;
        try {
          const r = await fetch(`/api/chronicles/${c.id}/notes/${noteId}`, { method: 'DELETE' });
          if (!r.ok) throw new Error();
          this._notes = this._notes.filter(n => n.id !== noteId);
          btn.closest('.note-card')?.remove();
          toast('Note deleted.');
          if (!this._notes.length) {
            $('#note-list').innerHTML = `<p class="chronicle-empty-state">No notes yet. Click <em>+ New Note</em> to write one.</p>`;
          }
        } catch { toast('Failed to delete note.', 'error'); }
      });
    });
  },

  // ── Grant XP modal ───────────────────────────────────────────────────────
  _showGrantXpModal(c) {
    const memberRows = c.members.map(m => `
      <label class="grant-xp-member-row">
        <input type="checkbox" class="grant-xp-cb" value="${m.id}" checked>
        <span>${escHtml(m.name)}</span>
        ${m.owner_username ? `<span class="grant-xp-player">${escHtml(m.owner_username)}</span>` : ''}
      </label>`).join('');

    $('#modal-title').textContent = 'Grant XP';
    $('#modal-body').innerHTML = `
      <div class="form-group" style="margin-bottom:0.75rem">
        <label class="form-label">XP Amount</label>
        <input type="number" id="grant-xp-amount" class="form-input" min="1" max="999" value="5" style="width:140px" />
      </div>
      <div class="form-group" style="margin-bottom:0.75rem">
        <label class="form-label">Note <span class="form-hint">(optional)</span></label>
        <input type="text" id="grant-xp-note" class="form-input" placeholder="Session 3, end-of-arc bonus…" />
      </div>
      <div class="form-group">
        <label class="form-label">Grant to</label>
        <label class="grant-xp-all-label">
          <input type="checkbox" id="grant-xp-all" checked> All members
        </label>
        <div id="grant-xp-member-list" class="grant-xp-member-list" style="display:none">${memberRows}</div>
      </div>`;

    $('#grant-xp-all')?.addEventListener('change', e => {
      $('#grant-xp-member-list').style.display = e.target.checked ? 'none' : 'block';
    });

    const confirmBtn = $('#modal-confirm');
    confirmBtn.textContent = 'Grant XP';
    confirmBtn.disabled = false;
    confirmBtn.onclick = async () => {
      const amount = parseInt($('#grant-xp-amount')?.value || 0);
      const note   = ($('#grant-xp-note')?.value || '').trim();
      if (!amount || amount < 1) { toast('Enter a valid XP amount.', 'error'); return; }
      const grantAll = $('#grant-xp-all')?.checked;
      const character_ids = grantAll
        ? c.members.map(m => m.id)
        : [...document.querySelectorAll('.grant-xp-cb:checked')].map(cb => parseInt(cb.value));
      if (!character_ids.length) { toast('Select at least one character.', 'error'); return; }
      App.closeModal();
      try {
        const r = await fetch(`/api/chronicles/${c.id}/grant-xp`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, note, character_ids }),
        });
        if (!r.ok) throw new Error((await r.json()).error || 'Failed');
        const data = await r.json();
        toast(`+${amount} XP granted to ${data.granted_to} character${data.granted_to === 1 ? '' : 's'}.`);
        // Refresh the detail view so pending badges update
        this.showDetail(c.id);
      } catch (e) { toast(e.message || 'Failed to grant XP.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
    setTimeout(() => $('#grant-xp-amount')?.select(), 50);
  },

  // ── Join code lookup (used in character creator/editor) ──────────────────
  async lookupJoinCode(code) {
    if (!code || code.length < 5) return null;
    try {
      const r = await fetch(`/api/chronicles/join/${encodeURIComponent(code.toUpperCase())}`);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
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
      const isGuest = App.currentUser?.role === 'guest';
      const hasPendingEdit = !!Sheet.char?.pending_edit;
      right.innerHTML = `
        <button class="btn-secondary" onclick="Advancement.show(Sheet.char)">Advancement</button>
        <button class="btn-secondary" onclick="Sheet.editCharacter()"
          ${hasPendingEdit ? 'disabled title="A character edit is pending Storyteller approval"' : ''}>Edit Character</button>
        <button class="btn-secondary" onclick="Sheet.exportPDF()">Export PDF</button>
        ${isGuest ? '' : `<button class="btn-secondary" onclick="Sheet.shareSheet()">Share Sheet</button>`}
        <button class="btn-danger" onclick="Sheet.deleteCharacter()">Delete</button>
      `;
    } else if (mode === 'storyteller') {
      left.innerHTML = `<button class="btn-ghost" onclick="Chronicle.showDetail(${opts.chronicleId})">← Back to Chronicle</button>`;
      right.innerHTML = `<button class="btn-secondary" onclick="Sheet.exportPDF()">Export PDF</button>`;
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

  render(char, stNotes = [], opts = {}) {
    this.char = char;
    // Ensure rotes is always an array
    if (!Array.isArray(this.char.rotes)) this.char.rotes = [];
    const content = $('#sheet-content');

    const specialties = char.specialties || {};
    const instruments = (Array.isArray(char.instruments) ? char.instruments : []).join(', ') || '—';
    const ro = !!this.sharedToken || opts.mode === 'storyteller';

    // Resonance display (read-only for shared, editable for owner)
    const resonances = Array.isArray(char.resonance) && char.resonance.length > 0
      ? char.resonance : [{ description: '', flavor: '', rating: 1 }];
    const resonanceSheetHTML = resonances.map((res, idx) => {
      const r = res.rating || 1;
      const dotSpans = Array.from({length: 5}, (_, i) =>
        `<span class="dot ${i < r ? 'filled' : ''} ${ro ? 'readonly' : 'sheet-res-dot'}" `
        + (ro ? '' : `data-res-idx="${idx}" data-val="${i+1}" `)
        + '></span>'
      ).join('');
      // Both shared and owner views show name/flavor as static text.
      // Owner additionally gets clickable dots and a delete button.
      return `<div class="sheet-resonance-item" ${ro ? '' : `data-res-idx="${idx}"`}>
        <span class="sheet-resonance-name">${res.description || '—'}</span>
        ${res.flavor ? `<span class="sheet-resonance-flavor-badge">${res.flavor}</span>` : ''}
        <div class="sheet-resonance-dots">${dotSpans}</div>
        ${!ro ? `<button class="sheet-res-remove" data-res-idx="${idx}" title="Remove resonance">✕</button>` : ''}
      </div>`;
    }).join('');

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
    const meritLabels = char.merit_labels || {};
    const meritsHTML = Object.entries(char.merits || {}).map(([k, v]) => {
      if (k === 'language') {
        // Expand each language instance into its own named row
        const instances = Array.isArray(v) ? v : [v];
        return instances.map((cost, idx) => {
          const lang = meritLabels['language:' + idx];
          const label = lang ? `Language (${lang})` : `Language`;
          return `<div class="sheet-trait-row"><span class="sheet-trait-name">${label}</span>${dots(cost, 5, 'readonly')}</div>`;
        }).join('');
      }
      const name = k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<div class="sheet-trait-row"><span class="sheet-trait-name">${name}</span>${dots(v, 5, 'readonly')}</div>`;
    }).join('');

    // Flaws
    const flawsHTML = Object.entries(char.flaws || {}).map(([k, v]) => {
      const name = k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<div class="sheet-trait-row"><span class="sheet-trait-name">${name}</span>${dots(v, 5, 'readonly')}</div>`;
    }).join('');

    // All spheres (show all 9, mark affinity) — normalize to lowercase ID for old chars
    const _affinityId = (char.affinity_sphere || '').toLowerCase();
    const allSpheres = M20.SPHERES.map(s => {
      const val  = (char.spheres || {})[s.id] || 0;
      const spec = specialties[s.id];
      const isAff = s.id === _affinityId;
      return `<div class="sheet-trait-row${isAff ? ' affinity-row' : ''}">
        <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${s.name}${isAff ? ' ✦' : ''}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
        ${dots(val, 5, 'readonly sphere-dots')}
      </div>`;
    }).join('');

    const affiliationGroup = char.affiliation === 'Traditions' ? 'The Traditions'
      : char.affiliation === 'Technocracy' ? 'Technocratic Union'
      : char.affiliation === 'Disparates'  ? 'Disparate Crafts'
      : '';

    // XP tracker (owner view only)
    const xpLog       = Array.isArray(char.xp_log) ? char.xp_log : [];
    const xpEarned    = char.xp_earned || 0;
    const xpSpentAmt  = xpLog.filter(e => e.type === 'spend').reduce((s, e) => s + (e.cost || 0), 0);
    const xpRemaining = xpEarned - xpSpentAmt;

    // Owner: compact XP tracker bar
    const xpTrackerHTML = (!ro && opts.mode !== 'storyteller') ? `
      <div class="sheet-xp-tracker">
        <span class="sheet-xp-pill">
          <span class="sheet-xp-label">XP</span>
          <span class="sheet-xp-val${xpRemaining < 0 ? ' xp-negative' : ''}">${xpRemaining}</span>
          <span class="sheet-xp-sub">remaining</span>
        </span>
        <span class="sheet-xp-sub">${xpEarned} earned · ${xpSpentAmt} spent</span>
        <button class="btn-ghost btn-sm sheet-xp-adv-btn" onclick="Advancement.show(Sheet.char)">Advancement →</button>
      </div>` : '';

    // Storyteller: XP activity panel + pending edits panel
    this._stChronicleId = opts.mode === 'storyteller' ? (opts.chronicleId || null) : null;
    this._pendingEdits  = opts.pendingEdits || [];
    const stXpHTML = opts.mode === 'storyteller' ? this._stXpPanelHTML(char) : '';
    const stPendingEditsHTML = (opts.mode === 'storyteller' && this._pendingEdits.length)
      ? this._stPendingEditsHTML(this._pendingEdits, opts.chronicleId)
      : '';

    // Owner: pending edit notice (chronicle characters with pending submission)
    const pendingEditNotice = (!ro && char.pending_edit)
      ? `<div class="sheet-pending-edit-notice">
           ⏳ Character edits are pending Storyteller approval — further edits are locked until reviewed.
         </div>`
      : '';

    content.innerHTML = `
    <div class="char-sheet">
      ${pendingEditNotice}
      ${xpTrackerHTML}
      ${stPendingEditsHTML}
      ${stXpHTML}
      <div class="sheet-header">
        <div class="sheet-char-name">${char.name}</div>
        <div class="sheet-field">
          <span class="sheet-field-label">Player</span>
          <span class="sheet-field-value">${char.player || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Chronicle</span>
          <span class="sheet-field-value">${char.linked_chronicle_name || char.chronicle || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Concept</span>
          <span class="sheet-field-value">${char.concept || '—'}</span>
        </div>
        <div class="sheet-field">
          <span class="sheet-field-label">Affiliation</span>
          <span class="sheet-field-value">${char.tradition || char.affiliation || '—'}</span>
          ${affiliationGroup ? `<span class="sheet-field-sub">${affiliationGroup}</span>` : ''}
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
              const isAff = s.id === _affinityId;
              return `<div class="sheet-trait-row${isAff ? ' affinity-row' : ''}">
                <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${isAff ? '✦ ' : ''}${s.name}</span>
                ${dots(val, 5, 'readonly')}
              </div>`;
            }).join('')}
          </div>
          <div class="sheet-group">
            ${M20.SPHERES.filter(s => ['life','matter','mind'].includes(s.id)).map(s => {
              const val = (char.spheres || {})[s.id] || 0;
              const isAff = s.id === _affinityId;
              return `<div class="sheet-trait-row${isAff ? ' affinity-row' : ''}">
                <span class="sheet-trait-name${isAff ? ' affinity' : ''}">${isAff ? '✦ ' : ''}${s.name}</span>
                ${dots(val, 5, 'readonly')}
              </div>`;
            }).join('')}
          </div>
          <div class="sheet-group">
            ${M20.SPHERES.filter(s => ['prime','spirit','time'].includes(s.id)).map(s => {
              const val = (char.spheres || {})[s.id] || 0;
              const isAff = s.id === _affinityId;
              return `<div class="sheet-trait-row${isAff ? ' affinity-row' : ''}">
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
              <div class="sheet-focus-item sheet-focus-resonance">
                <span class="sheet-focus-label">Resonance</span>
                <div class="sheet-resonance-list" id="sheet-resonance-list">${resonanceSheetHTML}</div>
                ${!ro ? `<button class="sheet-res-add-btn" id="sheet-add-resonance">＋ Add</button>` : ''}
              </div>
            </div>
          </div>
          <div class="sheet-group core-stats-group">
            <div class="sheet-group-title">Core Statistics</div>
            ${this.coreStatBox('Arete', char.arete || 1, 10)}
            ${this.willpowerBox(char.willpower || 5, char.willpower_spent || 0)}
            ${this.qpControls(char.quintessence || 0, char.paradox || 0)}
          </div>
          <div class="sheet-group">
            ${this.healthTrack(char)}
          </div>
        </div>
      </div>

      ${this.rotesSection(char)}

      ${(char.description || char.notes || stNotes.length) ? `
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
        ${stNotes.length ? this._stNotesHTML(stNotes) : ''}
      </div>` : ''}
    </div>`;
    this.attachSheetListeners();
  },

  _stNotesHTML(notes) {
    return `
      <div class="sheet-section st-notes-section">
        <div class="sheet-section-title">Storyteller Notes</div>
        ${notes.map(n => `
          <div class="st-note-card ${!n.seen_at ? 'st-note-unseen' : ''}" data-note-id="${n.id}">
            <div class="st-note-header">
              <span class="st-note-title">${escHtml(n.title)}</span>
              ${!n.seen_at
                ? `<button class="st-note-new-badge" onclick="Sheet.markNoteSeen(${n.id}, this)" title="Mark as read">NEW</button>`
                : `<span class="st-note-read-badge">Read</span>`
              }
              <span class="st-note-meta">${escHtml(n.storyteller)} · ${formatDate(n.updated_at)}</span>
            </div>
            <div class="st-note-body ql-editor">${n.body}</div>
          </div>`).join('')}
      </div>`;
  },

  async markNoteSeen(noteId, badgeEl) {
    const charId = App.currentCharId;
    if (!charId) return;
    try {
      const r = await fetch(`/api/characters/${charId}/storyteller-notes/${noteId}/seen`, { method: 'POST' });
      if (!r.ok) throw new Error();
      badgeEl.textContent = 'Read';
      badgeEl.className = 'st-note-read-badge';
      badgeEl.onclick = null;
      badgeEl.closest('.st-note-card')?.classList.remove('st-note-unseen');
    } catch {
      toast('Could not mark note as read.', 'error');
    }
  },

  rotesSection(char) {
    const ro = !!this.sharedToken;
    const rotes = Array.isArray(char.rotes) ? char.rotes : [];
    const charSpheres = char.spheres || {};
    const hasSpheres = Object.values(charSpheres).some(v => v > 0);

    const roteListHTML = rotes.length === 0
      ? '<div class="sheet-no-rotes">No rotes known.</div>'
      : rotes.map(r => `
          <div class="sheet-rote-row" data-rote-id="${r.id}">
            <div class="sheet-rote-main">
              <span class="sheet-rote-name">${r.name}</span>
              ${!ro ? `<button class="rote-remove-btn" data-rote-id="${r.id}" title="Remove rote">✕</button>` : ''}
            </div>
            ${r.spheres_raw ? `<div class="sheet-rote-spheres">${r.spheres_raw}</div>` : ''}
          </div>`).join('');

    // Build chapter options for the picker — will be populated lazily
    const chapOptions = (Grimoire.state.chapters || [])
      .map(c => `<option value="${c.replace(/"/g,'&quot;')}">${c}</option>`).join('');

    return `
      <div class="sheet-band sheet-rotes-band" id="sheet-rotes-band">
        <div class="sheet-band-title">Rotes</div>
        <div class="sheet-rotes-body">
          <div class="sheet-rotes-col">
          <div id="sheet-rotes-list">${roteListHTML}</div>
          ${!ro ? `
          <div id="sheet-rotes-picker">
            <button class="btn-ghost sheet-add-rote-btn" id="btn-add-rote">＋ Add Rote</button>
            <div class="sheet-rote-search-panel" id="rote-search-panel" style="display:none">
              <div class="sheet-rote-search-row">
                <input type="search" class="sheet-rote-search-input" id="rote-search-input"
                  placeholder="Search rotes…" autocomplete="off" />
                <select class="sheet-rote-select" id="rote-search-chapter">
                  <option value="">All Chapters</option>
                  ${chapOptions}
                </select>
                ${hasSpheres ? `
                <label class="sheet-rote-castable-label">
                  <input type="checkbox" id="rote-castable-only" checked />
                  Castable
                </label>` : ''}
                <button class="sheet-rote-search-close" id="rote-search-close" title="Close">✕</button>
              </div>
              <div class="sheet-rote-results" id="rote-search-results">
                <div class="sheet-rote-results-empty">Type to search for rotes…</div>
              </div>
            </div>
          </div>` : ''}
          </div>
        </div>
      </div>`;
  },

  addRote(id, name, spheresRaw) {
    if (!Array.isArray(this.char.rotes)) this.char.rotes = [];
    if (this.char.rotes.find(r => r.id === id)) return;
    this.char.rotes.push({ id, name, spheres_raw: spheresRaw });
    this.renderSheetRotes();
    this.saveRotes();
  },

  removeRote(id) {
    if (!Array.isArray(this.char.rotes)) return;
    this.char.rotes = this.char.rotes.filter(r => r.id !== id);
    this.renderSheetRotes();
    this.saveRotes();
  },

  saveRotes() {
    if (!this.char?.id) return;
    fetch(`/api/characters/${this.char.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotes: this.char.rotes }),
    }).catch(() => {});
  },

  renderSheetRotes() {
    const el = $('#sheet-rotes-list');
    if (!el) return;
    const ro = !!this.sharedToken;
    const rotes = Array.isArray(this.char.rotes) ? this.char.rotes : [];
    if (rotes.length === 0) {
      el.innerHTML = '<div class="sheet-no-rotes">No rotes known.</div>';
    } else {
      el.innerHTML = rotes.map(r => `
        <div class="sheet-rote-row" data-rote-id="${r.id}">
          <div class="sheet-rote-main">
            <span class="sheet-rote-name">${r.name}</span>
            ${!ro ? `<button class="rote-remove-btn" data-rote-id="${r.id}" title="Remove rote">✕</button>` : ''}
          </div>
          ${r.spheres_raw ? `<div class="sheet-rote-spheres">${r.spheres_raw}</div>` : ''}
        </div>`).join('');
    }
    // Re-attach remove button listeners
    $$('.rote-remove-btn', el).forEach(btn => {
      btn.addEventListener('click', e => {
        const id = parseInt(btn.dataset.roteId);
        this.removeRote(id);
      });
    });
  },

  attrRow(name, val = 1, specialties = {}) {
    const id   = name.toLowerCase();
    const spec = specialties[id];
    return `<div class="sheet-trait-row">
      <span class="sheet-trait-name">${name}${spec ? `<em class="sheet-specialty">(${spec})</em>` : ''}</span>
      ${dots(val, 5, 'readonly')}
    </div>`;
  },

  // ── Storyteller XP panel (shown when ST views a member's sheet) ─────────────
  _stXpPanelHTML(char) {
    const log       = Array.isArray(char.xp_log) ? char.xp_log : [];
    const earned    = char.xp_earned || 0;
    const spent     = log.filter(e => e.type === 'spend').reduce((s, e) => s + (e.cost || 0), 0);
    const remaining = earned - spent;

    // Unreviewed = submitted but not yet approved/finalized
    const unreviewed = log
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.type === 'spend' && e.submitted && !e.approved && !e.finalized);

    // Reviewed = approved+finalized spend entries
    const reviewed = log.filter(e => e.type === 'spend' && e.approved && e.finalized);

    const fmtReviewed = e => {
      const d = e.date ? new Date(normalizeTs(e.date)).toLocaleDateString(undefined, { timeZone: userTz() }) : '';
      return `<div class="st-xp-row">
        <span class="st-xp-row-date">${d}</span>
        <span class="st-xp-row-trait">${escHtml(e.trait_label || e.trait_key)}</span>
        <span class="st-xp-row-arrow">${e.from}→${e.to}</span>
        <span class="st-xp-row-cost">−${e.cost} XP</span>
      </div>`;
    };

    const unreviewedHTML = unreviewed.length
      ? unreviewed.map(({ e, i }) => {
          const d = e.date ? new Date(normalizeTs(e.date)).toLocaleDateString(undefined, { timeZone: userTz() }) : '';
          return `<div class="st-xp-row st-xp-row-unreviewed" data-log-idx="${i}">
            <div class="st-xp-row-info">
              <span class="st-xp-row-date">${d}</span>
              <span class="st-xp-row-trait">${escHtml(e.trait_label || e.trait_key)}</span>
              <span class="st-xp-row-arrow">${e.from}→${e.to}</span>
              <span class="st-xp-row-cost">−${e.cost} XP</span>
            </div>
            <div class="st-xp-row-actions">
              <button class="btn-sm st-xp-approve-btn" data-log-idx="${i}" title="Approve this expenditure">✓ Approve</button>
              <button class="btn-sm st-xp-reject-btn"  data-log-idx="${i}" title="Reject and refund XP">✕ Reject</button>
            </div>
          </div>`;
        }).join('')
      : `<p class="st-xp-empty">No pending expenditures to review.</p>`;

    const reviewedHTML = reviewed.length
      ? `<details class="st-xp-finalized-details">
           <summary class="st-xp-finalized-summary">Approved history (${reviewed.length})</summary>
           <div class="st-xp-finalized-rows">${reviewed.map(fmtReviewed).join('')}</div>
         </details>`
      : '';

    return `<div class="st-xp-panel">
      <div class="st-xp-panel-header">
        <span class="st-xp-panel-title">XP Activity</span>
        <span class="st-xp-balance">
          <span class="st-xp-bal-num${remaining < 0 ? ' st-xp-negative' : ''}">${remaining}</span> remaining
          &nbsp;·&nbsp; ${earned} earned &nbsp;·&nbsp; ${spent} spent
        </span>
      </div>
      <div class="st-xp-pending-section">
        <div class="st-xp-section-label">
          Awaiting Review
          ${unreviewed.length ? `<span class="st-xp-new-count">${unreviewed.length} unreviewed</span>` : ''}
        </div>
        ${unreviewedHTML}
      </div>
      ${reviewedHTML}
    </div>`;
  },

  // ── ST pending character-edit panel ─────────────────────────────────────────
  _stPendingEditsHTML(edits, chronicleId) {
    const cards = edits.map(e => {
      const d = e.submitted_at ? new Date(normalizeTs(e.submitted_at)).toLocaleDateString(undefined, { timeZone: userTz() }) : '';
      const diffRows = (e.diff_summary || []).map(ch => {
        const before = ch.type === 'scalar' || ch.type === 'trait' ? ch.before : (String(ch.before || '').slice(0,40) || '—');
        const after  = ch.type === 'scalar' || ch.type === 'trait' ? ch.after  : (String(ch.after  || '').slice(0,40) || '—');
        return `<div class="st-pe-diff-row">
          <span class="st-pe-diff-field">${escHtml(ch.label)}</span>
          <span class="st-pe-diff-arrow">
            <span class="st-pe-diff-before">${escHtml(String(before))}</span>
            → <span class="st-pe-diff-after">${escHtml(String(after))}</span>
          </span>
        </div>`;
      }).join('');

      return `<div class="st-pe-card">
        <div class="st-pe-meta">Submitted by <strong>${escHtml(e.submitter || '?')}</strong> · ${d}</div>
        ${e.reason ? `<div class="st-pe-reason">"${escHtml(e.reason)}"</div>` : ''}
        ${diffRows ? `<div class="st-pe-diff">${diffRows}</div>` : '<div class="st-pe-diff"><em style="color:var(--text-dim);font-size:0.8rem">No trait changes detected.</em></div>'}
        <div class="st-pe-actions">
          <button class="st-pe-approve-btn" data-edit-id="${e.id}" data-chron-id="${chronicleId}">✓ Approve</button>
          <button class="st-pe-reject-btn"  data-edit-id="${e.id}" data-chron-id="${chronicleId}">✕ Reject</button>
        </div>
      </div>`;
    }).join('');

    return `<div class="st-pe-panel">
      <div class="st-pe-header">
        <span class="st-pe-title">Pending Character Edits</span>
        <span class="st-pe-count">${edits.length}</span>
      </div>
      ${cards}
    </div>`;
  },

  // ── Attach ST pending-edit listeners ─────────────────────────────────────────
  _attachStPendingEditsListeners() {
    $$('.st-pe-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => FreeEdit.stApprove(parseInt(btn.dataset.editId), parseInt(btn.dataset.chronId)));
    });
    $$('.st-pe-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => FreeEdit.stReject(parseInt(btn.dataset.editId), parseInt(btn.dataset.chronId)));
    });
  },

  // ── Attach ST approve/reject listeners ───────────────────────────────────────
  _attachStXpListeners() {
    $$('.st-xp-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => this.stApprove(parseInt(btn.dataset.logIdx)));
    });
    $$('.st-xp-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => this.stReject(parseInt(btn.dataset.logIdx)));
    });
  },

  async stApprove(logIdx) {
    if (!this.char || !this._stChronicleId) return;
    try {
      const r = await fetch(`/api/chronicles/${this._stChronicleId}/members/${this.char.id}/xp/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_index: logIdx, action: 'approve' }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed to approve.', 'error'); return; }
      const data = await r.json();
      this.char.xp_log = data.xp_log;
      toast('Expenditure approved.');
      // Re-render just the ST XP panel
      const panel = document.querySelector('.st-xp-panel');
      if (panel) {
        panel.outerHTML = this._stXpPanelHTML(this.char);
        this._attachStXpListeners();
      }
    } catch { toast('Failed to approve expenditure.', 'error'); }
  },

  async stReject(logIdx) {
    if (!this.char || !this._stChronicleId) return;
    $('#modal-title').textContent = 'Reject Expenditure';
    const entry = (Array.isArray(this.char.xp_log) ? this.char.xp_log : [])[logIdx];
    const traitLabel = entry ? escHtml(entry.trait_label || entry.trait_key) : 'this trait';
    $('#modal-body').innerHTML = `
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:1rem">
        Reject the expenditure for <strong>${traitLabel}</strong> (${entry ? entry.from : '?'}→${entry ? entry.to : '?'}, ${entry ? entry.cost : '?'} XP)?<br>
        The XP will be refunded and the trait reverted. A rejection notice will appear in the player's log.
      </p>
      <div class="form-group">
        <label class="form-label">Reason <span class="form-hint">(optional)</span></label>
        <input type="text" id="st-reject-reason" class="form-input"
               placeholder="Explain the rejection to the player…" />
      </div>`;
    const confirmBtn = $('#modal-confirm');
    confirmBtn.textContent = 'Reject & Refund';
    confirmBtn.disabled = false;
    confirmBtn.onclick = async () => {
      const reason = ($('#st-reject-reason')?.value || '').trim();
      App.closeModal();
      try {
        const r = await fetch(`/api/chronicles/${this._stChronicleId}/members/${this.char.id}/xp/review`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ log_index: logIdx, action: 'reject', reason }),
        });
        if (!r.ok) { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed to reject.', 'error'); return; }
        const data = await r.json();
        this.char.xp_log = data.xp_log;
        toast('Expenditure rejected and XP refunded.');
        const panel = document.querySelector('.st-xp-panel');
        if (panel) {
          panel.outerHTML = this._stXpPanelHTML(this.char);
          this._attachStXpListeners();
        }
      } catch { toast('Failed to reject expenditure.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
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

  willpowerBox(val, spent) {
    const ro = !!this.sharedToken;
    return `<div class="core-stat-box">
      <div class="core-stat-label">Willpower</div>
      <div class="wp-track-grid">
        ${Array.from({length: 10}, (_, i) => `
          <span class="dot ${i < val ? 'filled' : ''}"></span>
          <span class="wp-spent-box${i < spent ? ' spent' : ''}${i >= val ? ' wp-inactive' : ''}${ro ? ' wp-readonly' : ''}" data-idx="${i}"></span>
        `).join('')}
      </div>
    </div>`;
  },

  // Quintessence / Paradox with +/- controls
  qpControls(q, p) {
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
    const ro = !!this.sharedToken;
    return `<div class="core-stat-box qp-wheel-box">
      <div class="qp-stat-label">
        <span class="qp-label-name">Quintessence</span>
        ${ro
          ? `<span class="qp-label-value" id="sheet-q-val">${q}</span>`
          : `<span class="qp-stepper">
               <button class="qp-btn" id="btn-q-minus" title="Spend Quintessence">−</button>
               <input class="qp-input" id="inp-q" value="${q}" maxlength="4" title="Enter a number to set, or +N / −N to adjust" />
               <button class="qp-btn" id="btn-q-plus"  title="Gain Quintessence">+</button>
             </span>`}
      </div>
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="wheel-svg" id="sheet-qp-wheel">${dotsSVG}</svg>
      <div class="qp-stat-label qp-paradox">
        <span class="qp-label-name">Paradox</span>
        ${ro
          ? `<span class="qp-label-value qp-paradox-value" id="sheet-p-val">${p}</span>`
          : `<span class="qp-stepper">
               <button class="qp-btn qp-btn-paradox" id="btn-p-minus" title="Reduce Paradox">−</button>
               <input class="qp-input qp-input-paradox" id="inp-p" value="${p}" maxlength="4" title="Enter a number to set, or +N / −N to adjust" />
               <button class="qp-btn qp-btn-paradox" id="btn-p-plus"  title="Gain Paradox">+</button>
             </span>`}
      </div>
    </div>`;
  },

  _buildWheelSVG(q, p) {
    const max = 20, r = 72, dotR = 9, pad = 16;
    const size = (r + dotR + pad) * 2;
    const cx = size / 2, cy = size / 2;
    const startR = (dotR * 1.25).toFixed(1);
    return Array.from({length: max}, (_, i) => {
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
  },

  healthTrack(char) {
    const levels = [
      { name: 'Bruised',       pen: '',   desc: 'Minor pain and swelling; he\'s banged up but otherwise fine.' },
      { name: 'Hurt',          pen: '−1', desc: 'Cuts, bruises, aches, perhaps bleeding but no major impairment.' },
      { name: 'Injured',       pen: '−1', desc: 'Minor, painful injuries limit the character to half his normal movement.' },
      { name: 'Wounded',       pen: '−2', desc: 'Notable injuries handicap him; the character can\'t run but may still walk.' },
      { name: 'Mauled',        pen: '−2', desc: 'Significant internal and external damage; character can hobble around (three yards/turn) but not move normally.' },
      { name: 'Crippled',      pen: '−5', desc: 'Catastrophic injuries; character can only crawl (one yard/turn).' },
      { name: 'Incapacitated', pen: '',   desc: 'Character is unconscious from pain and trauma; no movement possible.' },
    ];
    const track = Array.isArray(char.health_track) && char.health_track.length === 7
      ? char.health_track : Array(7).fill('empty');
    const dmgChar = { empty: '', bashing: '/', lethal: '✕', aggravated: '✳' };
    const healTip = {
      empty:      '',
      bashing:    'Bashing — heals 1 level per 15 min (M20 p.406)',
      lethal:     'Lethal — heals 1 level per day (M20 p.406)',
      aggravated: 'Aggravated — heals 1 level per week, magical aid required (M20 p.406)',
    };
    const ro = !!this.sharedToken;
    return `<div class="sheet-section sheet-health-section">
      <div class="sheet-section-title">Health</div>
      ${ro ? '' : `<div class="health-dmg-selector">
        <button class="dmg-type-btn active" data-dmg="bashing"    title="Bashing damage heals 1 level per 15 minutes (M20 p.406)">/ Bashing</button>
        <button class="dmg-type-btn"        data-dmg="lethal"     title="Lethal damage heals 1 level per day (M20 p.406)">✕ Lethal</button>
        <button class="dmg-type-btn"        data-dmg="aggravated" title="Aggravated damage heals 1 level per week, magical aid required (M20 p.406)">✳ Aggravated</button>
        <button class="dmg-type-btn heal-mode-btn" data-dmg="heal" title="Heal: click a filled box to remove one level of that damage type">♥ Heal</button>
      </div>`}
      <div class="health-track">
        ${levels.map(({name, pen, desc}, i) => {
          const state = track[i] || 'empty';
          return `
          <div class="health-row">
            <span class="health-level-name">${name}</span>
            ${pen ? `<span class="health-penalty">${pen}</span>` : '<span class="health-penalty"></span>'}
            <span class="health-box dmg-${state}" data-slot="${i}" title="${healTip[state] || ''}">${dmgChar[state]}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="health-penalty-display" id="health-penalty-display">${this._penaltyHTML(track, !!char.health_dead)}</div>
    </div>`;
  },

  _levelInfo(track) {
    const levels = [
      { pen: 0,               desc: 'Minor pain and swelling; he\'s banged up but otherwise fine.' },
      { pen: -1,              desc: 'Cuts, bruises, aches, perhaps bleeding but no major impairment.' },
      { pen: -1,              desc: 'Minor, painful injuries limit the character to half his normal movement.' },
      { pen: -2,              desc: 'Notable injuries handicap him; the character can\'t run but may still walk.' },
      { pen: -2,              desc: 'Significant internal and external damage; character can hobble around (three yards/turn) but not move normally.' },
      { pen: -5,              desc: 'Catastrophic injuries; character can only crawl (one yard/turn).' },
      { pen: 'Incapacitated', desc: 'Character is unconscious from pain and trauma; no movement possible.' },
    ];
    let lastFilled = -1;
    for (let i = 0; i < 7; i++) {
      if (track[i] && track[i] !== 'empty') lastFilled = i;
    }
    if (lastFilled === -1) return null;
    return levels[lastFilled];
  },

  _penaltyHTML(track, died = false) {
    if (died) {
      return `<span class="hp-desc">Another soul greets the Great Mystery.</span>
              <span class="hp-dead">† DEAD</span>`;
    }
    const info = this._levelInfo(track);
    if (!info) return '<span class="hp-none">No wound penalty</span>';
    const { pen, desc } = info;
    if (pen === 'Incapacitated') {
      return `<span class="hp-desc">${desc}</span>
              <span class="hp-incap">Incapacitated — cannot act</span>`;
    }
    return `<span class="hp-desc">${desc}</span>
            <span class="hp-val">Wound penalty <strong>${pen}</strong> to all dice pools
              <span class="hp-caveat">(not Avatar, soak, or Arete rolls)</span>
            </span>`;
  },

  _refreshPenaltyDisplay(track, died = false) {
    const el = $('#health-penalty-display');
    if (el) el.innerHTML = this._penaltyHTML(track, died);
  },

  // ── Damage track helpers ──────────────────────────────────────────────────────
  _sortTrack(counts) {
    const result = [];
    for (let i = 0; i < counts.aggravated; i++) result.push('aggravated');
    for (let i = 0; i < counts.lethal;     i++) result.push('lethal');
    for (let i = 0; i < counts.bashing;    i++) result.push('bashing');
    while (result.length < 7) result.push('empty');
    return result;
  },

  _addDamage(track, type) {
    const counts = { bashing: 0, lethal: 0, aggravated: 0 };
    track.forEach(s => { if (s !== 'empty') counts[s]++; });
    const total = counts.bashing + counts.lethal + counts.aggravated;

    if (total < 7) {
      // Room available — simply add
      counts[type]++;
      return { track: this._sortTrack(counts), died: false };
    }

    // Track is full — overflow rules
    if (type === 'bashing') {
      // Bashing wraps: one existing bashing becomes lethal (non-recursive)
      if (counts.bashing > 0) {
        counts.bashing--;
        counts.lethal++;
        return { track: this._sortTrack(counts), died: false };
      }
      // No bashing to wrap — lethal/agg fills the whole track → dead
      return { track: this._sortTrack(counts), died: true };
    }

    // Adding lethal or aggravated to a full track → dead
    return { track: this._sortTrack(counts), died: true };
  },

  _removeDamage(track, type) {
    const counts = { bashing: 0, lethal: 0, aggravated: 0 };
    track.forEach(s => { if (s !== 'empty') counts[s]++; });
    if (!counts[type]) return track; // nothing to remove
    counts[type]--;
    return this._sortTrack(counts);
  },

  _refreshHealthBoxes(track) {
    const dmgChar = { empty: '', bashing: '/', lethal: '✕', aggravated: '✳' };
    const healTip = {
      empty:      '',
      bashing:    'Bashing — heals 1 level per 15 min (M20 p.406)',
      lethal:     'Lethal — heals 1 level per day (M20 p.406)',
      aggravated: 'Aggravated — heals 1 level per week, magical aid required (M20 p.406)',
    };
    track.forEach((state, i) => {
      const box = $(`[data-slot="${i}"]`);
      if (!box) return;
      box.className = `health-box dmg-${state}`;
      box.textContent = dmgChar[state];
      box.title = healTip[state] || '';
    });
  },

  // ── Sheet state persistence ───────────────────────────────────────────────────
  async saveSheetState() {
    if (!this.char?.id) return;
    try {
      await fetch(`/api/characters/${this.char.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          health_track:    this.char.health_track,
          health_dead:     this.char.health_dead ? 1 : 0,
          willpower_spent: this.char.willpower_spent,
          quintessence:    this.char.quintessence,
          paradox:         this.char.paradox,
          resonance:       this.char.resonance,
        }),
      });
    } catch { /* silent — non-critical */ }
  },

  // ── Attach interactive listeners after render ─────────────────────────────────
  attachSheetListeners() {
    if (this.sharedToken) return; // read-only for shared views

    // ── Damage / heal mode selector ───────────────────────────────────────────
    let selectedDmg = 'bashing';
    $$('.dmg-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.dmg-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDmg = btn.dataset.dmg;
      });
    });

    // ── Health box clicks ──────────────────────────────────────────────────────
    const track = () => Array.isArray(this.char.health_track) && this.char.health_track.length === 7
      ? this.char.health_track : Array(7).fill('empty');

    $$('.health-box').forEach(box => {
      box.addEventListener('click', () => {
        const cur   = track();
        const state = cur[parseInt(box.dataset.slot)];
        let newTrack, died = false;
        if (selectedDmg === 'heal') {
          if (state === 'empty') return; // nothing to heal here
          newTrack = this._removeDamage(cur, state);
          died = false; // healing always clears dead state
        } else {
          ({ track: newTrack, died } = this._addDamage(cur, selectedDmg));
        }
        this.char.health_track  = newTrack;
        this.char.health_dead   = died;
        this._refreshHealthBoxes(newTrack);
        this._refreshPenaltyDisplay(newTrack, died);
        this.saveSheetState();
      });
    });

    // ── Willpower spent boxes ─────────────────────────────────────────────────
    $$('.wp-spent-box').forEach(box => {
      box.addEventListener('click', () => {
        if (box.classList.contains('wp-inactive')) return; // beyond rating
        const idx = parseInt(box.dataset.idx);
        const cur = this.char.willpower_spent || 0;
        // Click the rightmost spent box → un-spend it; otherwise fill up to idx+1
        this.char.willpower_spent = (cur === idx + 1) ? idx : idx + 1;
        const rating = this.char.willpower || 5;
        $$('.wp-spent-box').forEach(b => {
          const i = parseInt(b.dataset.idx);
          b.classList.toggle('spent',    i < this.char.willpower_spent);
          b.classList.toggle('wp-inactive', i >= rating);
        });
        this.saveSheetState();
      });
    });

    // ── Quintessence / Paradox controls ──────────────────────────────────────
    const updateQPDisplay = () => {
      const q = this.char.quintessence || 0;
      const p = this.char.paradox      || 0;
      const qEl = $('#inp-q') || $('#sheet-q-val');
      const pEl = $('#inp-p') || $('#sheet-p-val');
      if (qEl) { if (qEl.tagName === 'INPUT') qEl.value = q; else qEl.textContent = q; }
      if (pEl) { if (pEl.tagName === 'INPUT') pEl.value = p; else pEl.textContent = p; }
      const wheel = $('#sheet-qp-wheel');
      if (wheel) wheel.innerHTML = this._buildWheelSVG(q, p);
    };

    // Parse an expression ("6", "+3", "-2") and return the new value, or null if invalid.
    const parseExpr = (raw, current) => {
      const t = raw.trim();
      if (t.startsWith('+')) { const d = parseInt(t.slice(1)); return isNaN(d) ? null : current + d; }
      if (t.startsWith('-')) { const d = parseInt(t.slice(1)); return isNaN(d) ? null : current - d; }
      const n = parseInt(t);
      return isNaN(n) ? null : n;
    };

    // Apply a Q expression, clamped to [0, 20 − P]
    const applyQ = (raw) => {
      const q = this.char.quintessence || 0;
      const p = this.char.paradox      || 0;
      const newQ = parseExpr(raw, q);
      if (newQ === null) { updateQPDisplay(); return; }   // reset on bad input
      this.char.quintessence = Math.max(0, Math.min(20 - p, newQ));
      updateQPDisplay(); this.saveSheetState();
    };

    // Apply a P expression, clamped to [0, 20]; reduce Q if wheel overflows
    const applyP = (raw) => {
      const p = this.char.paradox || 0;
      const newP = parseExpr(raw, p);
      if (newP === null) { updateQPDisplay(); return; }
      this.char.paradox = Math.max(0, Math.min(20, newP));
      const maxQ = 20 - this.char.paradox;
      if ((this.char.quintessence || 0) > maxQ) this.char.quintessence = maxQ;
      updateQPDisplay(); this.saveSheetState();
    };

    // + / − step buttons for Q
    $('#btn-q-plus')?.addEventListener('click', () => applyQ(`+1`));
    $('#btn-q-minus')?.addEventListener('click', () => applyQ(`-1`));

    // Q text input — commit on Enter or blur, select-all on focus
    const qInp = $('#inp-q');
    if (qInp) {
      qInp.addEventListener('keydown', e => { if (e.key === 'Enter') { applyQ(qInp.value); qInp.blur(); } });
      qInp.addEventListener('blur',    () => applyQ(qInp.value));
      qInp.addEventListener('focus',   () => qInp.select());
    }

    // + / − step buttons for P
    $('#btn-p-plus')?.addEventListener('click', () => applyP(`+1`));
    $('#btn-p-minus')?.addEventListener('click', () => applyP(`-1`));

    // P text input — commit on Enter or blur
    const pInp = $('#inp-p');
    if (pInp) {
      pInp.addEventListener('keydown', e => { if (e.key === 'Enter') { applyP(pInp.value); pInp.blur(); } });
      pInp.addEventListener('blur',    () => applyP(pInp.value));
      pInp.addEventListener('focus',   () => pInp.select());
    }

    // ── Sheet resonance editing (owner only) ─────────────────────
    const sheetResList = $('#sheet-resonance-list');

    const _rebuildSheetResList = () => {
      if (!sheetResList) return;
      const resonances = this.char.resonance || [];
      sheetResList.innerHTML = resonances.map((res, idx) => {
        const r = res.rating || 1;
        const dotSpans = Array.from({length: 5}, (_, i) =>
          `<span class="dot ${i < r ? 'filled' : ''} sheet-res-dot" data-res-idx="${idx}" data-val="${i+1}"></span>`
        ).join('');
        return `<div class="sheet-resonance-item" data-res-idx="${idx}">
          <span class="sheet-resonance-name">${res.description || '—'}</span>
          ${res.flavor ? `<span class="sheet-resonance-flavor-badge">${res.flavor}</span>` : ''}
          <div class="sheet-resonance-dots">${dotSpans}</div>
          <button class="sheet-res-remove" data-res-idx="${idx}" title="Remove resonance">✕</button>
        </div>`;
      }).join('');
    };

    if (sheetResList) {
      sheetResList.addEventListener('click', e => {
        const dot = e.target.closest('.sheet-res-dot');
        if (dot) {
          const idx = parseInt(dot.dataset.resIdx);
          const val = parseInt(dot.dataset.val);
          if (!this.char.resonance?.[idx]) return;
          const cur = this.char.resonance[idx].rating || 1;
          this.char.resonance[idx].rating = cur === val ? Math.max(1, val - 1) : val;
          const item = sheetResList.querySelector(`.sheet-resonance-item[data-res-idx="${idx}"]`);
          if (item) item.querySelectorAll('.sheet-res-dot').forEach(d =>
            d.classList.toggle('filled', parseInt(d.dataset.val) <= this.char.resonance[idx].rating)
          );
          this.saveSheetState();
          return;
        }
        const rmBtn = e.target.closest('.sheet-res-remove');
        if (rmBtn) {
          const idx = parseInt(rmBtn.dataset.resIdx);
          this.char.resonance.splice(idx, 1);
          _rebuildSheetResList();
          this.saveSheetState();
        }
      });
    }

    $('#sheet-add-resonance')?.addEventListener('click', () => {
      if (!this.char.resonance) this.char.resonance = [];
      this.char.resonance.push({ description: '', flavor: '', rating: 1 });
      _rebuildSheetResList();
      this.saveSheetState();
    });

    // ── Rote picker ───────────────────────────────────────────────────────────────
    // Initial remove-button listeners (for rotes already on the list at render time)
    $$('.rote-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.roteId);
        this.removeRote(id);
      });
    });

    const rotePanel   = $('#rote-search-panel');
    const addRoteBtn  = $('#btn-add-rote');
    const roteInput   = $('#rote-search-input');
    const roteChapter = $('#rote-search-chapter');
    const roteCastable = $('#rote-castable-only');
    const roteResults  = $('#rote-search-results');
    const roteClose   = $('#rote-search-close');

    if (addRoteBtn && rotePanel) {
      addRoteBtn.addEventListener('click', () => {
        const isOpen = rotePanel.style.display !== 'none';
        rotePanel.style.display = isOpen ? 'none' : '';
        if (!isOpen) {
          roteInput?.focus();
          // Load chapters into dropdown if not yet loaded
          if (Grimoire.state.chapters.length > 0 && roteChapter && roteChapter.options.length <= 1) {
            Grimoire.state.chapters.forEach(c => {
              const opt = document.createElement('option');
              opt.value = c; opt.textContent = c;
              roteChapter.appendChild(opt);
            });
          }
          this._fetchRotePickerResults();
        }
      });
    }

    if (roteClose) {
      roteClose.addEventListener('click', () => {
        if (rotePanel) rotePanel.style.display = 'none';
      });
    }

    const debouncedRoteSearch = debounce(() => this._fetchRotePickerResults(), 300);

    if (roteInput) {
      roteInput.addEventListener('input', debouncedRoteSearch);
    }
    if (roteChapter) {
      roteChapter.addEventListener('change', () => this._fetchRotePickerResults());
    }
    if (roteCastable) {
      roteCastable.addEventListener('change', () => this._fetchRotePickerResults());
    }

    // ── ST mode: approve/reject XP + pending edit listeners ───────────────────
    if (this._stChronicleId) {
      this._attachStXpListeners();
      this._attachStPendingEditsListeners();
    }
  },

  async _fetchRotePickerResults() {
    const roteInput    = $('#rote-search-input');
    const roteChapter  = $('#rote-search-chapter');
    const roteCastable = $('#rote-castable-only');
    const roteResults  = $('#rote-search-results');
    if (!roteResults) return;

    const search   = roteInput?.value?.trim() || '';
    const chapter  = roteChapter?.value || '';
    const castOnly = roteCastable?.checked ?? false;
    const charSpheres = this.char?.spheres || {};

    const params = { limit: 40, page: 1 };
    if (search)  params.search = search;
    if (chapter) params.chapter = chapter;

    try {
      const r = await fetch('/api/rotes?' + new URLSearchParams(params));
      if (!r.ok) throw new Error();
      const data = await r.json();
      let rotes = data.rotes || [];

      if (castOnly) {
        rotes = rotes.filter(rt => canCast(rt, charSpheres));
      }

      rotes = rotes.slice(0, 20);

      if (!rotes.length) {
        roteResults.innerHTML = '<div class="sheet-rote-results-empty">No rotes found.</div>';
        return;
      }

      const knownIds = new Set((this.char.rotes || []).map(r => r.id));
      roteResults.innerHTML = rotes.map(rt => {
        const known = knownIds.has(rt.id);
        return `<div class="sheet-rote-result-item${known ? ' already-known' : ''}"
          data-rote-id="${rt.id}" data-rote-name="${(rt.name||'').replace(/"/g,'&quot;')}"
          data-rote-spheres="${(rt.spheres_raw||'').replace(/"/g,'&quot;')}">
          <span class="sheet-rote-result-name">${rt.name}</span>
          <span class="sheet-rote-result-spheres">${rt.spheres_raw || ''}</span>
          <span class="sheet-rote-result-source">${rt.chapter || ''} p.${rt.page || '?'} — ${rt.source || ''}</span>
        </div>`;
      }).join('');

      // Attach click listeners
      $$('.sheet-rote-result-item:not(.already-known)', roteResults).forEach(item => {
        item.addEventListener('click', () => {
          const id      = parseInt(item.dataset.roteId);
          const name    = item.dataset.roteName;
          const spheres = item.dataset.roteSpheres;
          this.addRote(id, name, spheres);
          // Re-render results to mark as known
          this._fetchRotePickerResults();
        });
      });
    } catch {
      roteResults.innerHTML = '<div class="sheet-rote-results-empty">Error loading rotes.</div>';
    }
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

/* ─── Merit/Flaw cost parser ─────────────────────────────────── */
// Converts any cost value into a sorted numeric array of valid options.
// Handles numbers, legacy arrays, and descriptive strings such as
// '1 or 3', '2-5', '3, 6, or 9', '2, 4, 6, 8, or 10', etc.
function parseCostOptions(cost) {
  if (typeof cost === 'number') return [cost];
  if (Array.isArray(cost))     return cost.map(Number);
  if (typeof cost === 'string') {
    const nums = cost.match(/\d+/g);
    if (!nums || nums.length === 0) return [1];
    const parsed = nums.map(Number);
    // Detect compact "X-Y" range notation (exactly 2 numbers, hyphen, no comma/or)
    if (parsed.length === 2 && cost.includes('-')
        && !cost.includes(',') && !cost.toLowerCase().includes('or')) {
      const [a, b] = parsed;
      if (b > a && b - a <= 15)
        return Array.from({ length: b - a + 1 }, (_, i) => a + i);
    }
    return parsed;
  }
  return [1];
}

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
      merits: {}, flaws: {}, merit_labels: {},
      // Spheres
      spheres: {}, affinity_sphere: '',
      // Stats
      arete: 1, willpower: 5, quintessence: 0, paradox: 0,
      // Focus
      paradigm: '', practice: '', instruments: [],
      resonance: [{ description: '', flavor: '', rating: 1 }],
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
    // Resonance migration: ensure valid array with at least one entry
    if (!Array.isArray(this.char.resonance) || this.char.resonance.length === 0) {
      this.char.resonance = [{ description: '', flavor: '', rating: 1 }];
    } else {
      this.char.resonance = this.char.resonance.map(r => ({
        description: r.description || '',
        flavor:      r.flavor      || '',
        rating:      r.rating      || 1,
      }));
    }
    this.renderStep();
    this.updateSidebar();
    // Finalized characters: restore saved creation_baselines so XP spending on traits
    // never inflates the freebie cost retroactively.
    // Drafts: leave null — updateFreebieDisplay() recomputes baselines on every
    // change during steps 1-5, so new dots always stay inside the allocation pool.
    if (this.char.creation_baselines && !this.char.is_draft) {
      this._lockedBaselines = this.char.creation_baselines;
    } else {
      this._lockedBaselines = null;
    }
    // For finalized characters with no saved baselines (pre-freebie-tracking era):
    // snapshot their load-time trait totals so _lockBaselines() can expand the
    // creation pools to cover existing dots without growing as new dots are added.
    if (!this.char.creation_baselines && !this.char.is_draft) {
      this._legacyPoolSnapshot = this._computeLegacyPoolSnapshot();
    } else {
      this._legacyPoolSnapshot = null;
    }
    this.updateFreebieDisplay();
  },

  // Computes the allocation pool sizes needed to cover all current trait values
  // for a character that was finalized before creation_baselines were introduced.
  // Called once at load time; result stored in this._legacyPoolSnapshot.
  _computeLegacyPoolSnapshot() {
    const c = this.char;
    const attrPri = c.attr_priority || ['Physical','Social','Mental'];
    const abilPri = c.ability_priority || ['Talents','Skills','Knowledges'];
    const grpMap  = { Physical:['strength','dexterity','stamina'], Social:['charisma','manipulation','appearance'], Mental:['perception','intelligence','wits'] };
    const abilDef = {
      Talents:    { key:'talents',    data:M20.TALENTS,    sec:M20.SECONDARY_TALENTS },
      Skills:     { key:'skills',     data:M20.SKILLS,     sec:M20.SECONDARY_SKILLS },
      Knowledges: { key:'knowledges', data:M20.KNOWLEDGES, sec:M20.SECONDARY_KNOWLEDGES },
    };

    const attrAllocs = {};
    ['Physical','Social','Mental'].forEach((grp, i) => {
      const normal  = [7,5,3][attrPri.indexOf(grp)] ?? 0;
      const rawUsed = grpMap[grp].reduce((s, id) => s + Math.max(0, (c[id]||1) - 1), 0);
      attrAllocs[grp] = Math.max(normal, rawUsed);
    });

    const abilAllocs = {};
    ['Talents','Skills','Knowledges'].forEach(cat => {
      const { key, data, sec } = abilDef[cat];
      const normal   = [13,9,5][abilPri.indexOf(cat)] ?? 0;
      const custIds  = Object.keys(c.custom_ability_names || {}).filter(id => c[key]?.[id] !== undefined);
      const chronIds = (this.effectiveCustomAbilities?.(key) || []).map(a => a.id);
      const allIds   = [...data.map(a=>a.id), ...sec.map(a=>a.id).filter(id=>c[key]?.[id]!==undefined), ...custIds, ...chronIds];
      const rawUsed  = allIds.reduce((s, id) => s + (c[key]?.[id] || 0), 0);
      abilAllocs[cat] = Math.max(normal, rawUsed);
    });

    const bgAff = c.affiliation || 'Traditions';
    const chronBgs = (c._chronicleRules?.customBackgrounds || []).filter(b => b.name)
      .map(b => ({ id: b.id, doubleCost: false }));
    const allBgs = [...filteredBackgrounds(bgAff), ...chronBgs];
    const rawBgUsed = allBgs.reduce((s, bg) => s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1), 0);
    const bgPool = Math.max(M20.CREATION.backgroundDots, rawBgUsed);

    const rawSphUsed = M20.SPHERES.reduce((s, sph) => s + (c.spheres?.[sph.id] || 0), 0);
    const sphPool = Math.max(M20.CREATION.sphereDots, rawSphUsed);

    return { attrAllocs, abilAllocs, bgPool, sphPool };
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
    const save = $('#btn-save');
    back.style.visibility = this.step > 0 ? 'visible' : 'hidden';
    next.textContent = this.step === this.STEPS.length - 1 ? 'Save Character ✓' : 'Next →';
    if (save) {
      const complete = this.isCharacterComplete();
      save.textContent = complete ? 'Save' : 'Save Draft';
      save.className   = complete ? 'btn-secondary' : 'btn-ghost';
      save.onclick     = complete ? () => this.saveCharacter() : () => this.saveDraft();
    }
  },

  // Returns array of outstanding requirement strings for a given step index
  getStepIncomplete(step) {
    const c = this.char;
    const issues = [];
    if (step === 0) {
      if (!c.name?.trim())    issues.push('Name not set');
      if (!c.concept?.trim()) issues.push('Concept not set');
      if (!c.tradition)       issues.push('Tradition / affiliation not set');
      if (!c.essence)         issues.push('Essence not set');
      if (!c.nature)          issues.push('Nature not set');
      if (!c.demeanor)        issues.push('Demeanor not set');
    } else if (step === 1) {
      const pri   = c.attr_priority || ['Physical', 'Social', 'Mental'];
      const alloc = M20.CREATION.attrPoints;
      const ranks = ['primary', 'secondary', 'tertiary'];
      const lb1   = this._lockedBaselines;
      let rem = 0;
      pri.forEach((cat, i) => {
        const attrs   = M20.ATTRIBUTES[cat.toLowerCase()] || [];
        const rawUsed = attrs.reduce((s, a) => s + Math.max(0, (c[a.id] || 1) - 1), 0);
        const bonus   = attrs.reduce((s, a) => s + (lb1?.bonusAttrs?.[a.id] || 0), 0);
        const used    = Math.max(0, rawUsed - bonus);
        rem += Math.max(0, alloc[ranks[i]] - used);
      });
      if (rem > 0) issues.push(`${rem} attribute point${rem !== 1 ? 's' : ''} unspent`);
    } else if (step === 2) {
      const pri     = c.ability_priority || ['Talents', 'Skills', 'Knowledges'];
      const alloc   = M20.CREATION.abilityPoints;
      const keyMap  = { Talents: 'talents', Skills: 'skills', Knowledges: 'knowledges' };
      const dataMap = { Talents: M20.TALENTS, Skills: M20.SKILLS, Knowledges: M20.KNOWLEDGES };
      const secMap  = { Talents: M20.SECONDARY_TALENTS, Skills: M20.SECONDARY_SKILLS, Knowledges: M20.SECONDARY_KNOWLEDGES };
      const ranks   = ['primary', 'secondary', 'tertiary'];
      const lb2     = this._lockedBaselines;
      let rem = 0;
      pri.forEach((cat, i) => {
        const key    = keyMap[cat];
        const data   = dataMap[cat] || [];
        const secAll = secMap[cat]  || [];
        const custIds = Object.keys(c.custom_ability_names || {}).filter(id => c[key]?.[id] !== undefined);
        const chronAbils2 = this.effectiveCustomAbilities(key);
        const rawUsed = data.reduce((s, a) => s + (c[key]?.[a.id] || 0), 0)
          + secAll.filter(a => c[key]?.[a.id] !== undefined).reduce((s, a) => s + (c[key][a.id] || 0), 0)
          + custIds.reduce((s, id) => s + (c[key][id] || 0), 0)
          + chronAbils2.reduce((s, a) => s + (c[key]?.[a.id] || 0), 0);
        const allIds = [...data.map(a => a.id), ...secAll.filter(a => c[key]?.[a.id] !== undefined).map(a => a.id), ...custIds, ...chronAbils2.map(a => a.id)];
        const bonus  = allIds.reduce((s, id) => s + (lb2?.bonusAbilities?.[id] || 0), 0);
        const used   = Math.max(0, rawUsed - bonus);
        rem += Math.max(0, alloc[ranks[i]] - used);
      });
      if (rem > 0) issues.push(`${rem} ability point${rem !== 1 ? 's' : ''} unspent`);
    } else if (step === 3) {
      const aff  = c.affiliation || 'Traditions';
      const chronBgsSidebar = (c._chronicleRules?.customBackgrounds || []).filter(bg => bg.name)
        .map(bg => ({ id: bg.id, doubleCost: false }));
      const allBgsSidebar = [...filteredBackgrounds(aff), ...chronBgsSidebar];
      const lb3 = this._lockedBaselines;
      const rawUsed = allBgsSidebar.reduce((s, bg) => s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1), 0);
      const bonus   = allBgsSidebar.reduce((s, bg) => s + (lb3?.bonusBgs?.[bg.id] || 0), 0);
      const used    = Math.max(0, rawUsed - bonus);
      const rem  = Math.max(0, M20.CREATION.backgroundDots - used);
      if (rem > 0) issues.push(`${rem} background point${rem !== 1 ? 's' : ''} unspent`);
    } else if (step === 4) {
      if (!c.paradigm?.trim()) issues.push('Paradigm not set');
      if (!c.practice?.trim()) issues.push('Practice not set');
    } else if (step === 5) {
      const lb5 = this._lockedBaselines;
      const rawSph  = Object.values(c.spheres).reduce((s, v) => s + v, 0);
      const bonusSph = M20.SPHERES.reduce((s, sph) => s + (lb5?.bonusSpheres?.[sph.id] || 0), 0);
      const used = Math.max(0, rawSph - bonusSph);
      const rem  = Math.max(0, M20.CREATION.sphereDots - used);
      if (rem > 0) issues.push(`${rem} sphere dot${rem !== 1 ? 's' : ''} unspent`);
    }
    return issues;
  },

  // True when all required fields across all steps are filled
  isCharacterComplete() {
    for (let s = 0; s <= 5; s++) {
      if (this.getStepIncomplete(s).length > 0) return false;
    }
    return true;
  },

  updateSidebar() {
    $$('.step-item').forEach(el => {
      const s      = parseInt(el.dataset.step);
      const active = s === this.step;
      el.classList.toggle('active', active);
      el.classList.toggle('completed', s < this.step);
      const issues = this.getStepIncomplete(s);
      el.classList.toggle('step-incomplete', issues.length > 0 && !active);
      el.title = issues.length > 0 && !active ? issues.join('\n') : '';
    });
  },

  // ── Resonance freebie cost ─────────────────────────────────────
  calcResonanceFreebies() {
    const resonances = this.char.resonance || [];
    let total = 0;
    resonances.forEach((res, idx) => {
      const r = Math.max(1, res.rating || 1);
      const freeStart = idx === 0 ? 1 : 0; // first resonance: 1 free dot
      for (let d = freeStart + 1; d <= r; d++) total += d * 3;
    });
    return total;
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
    const resCost = this.calcResonanceFreebies();
    if (resCost)   lines.push({ label: 'Resonance',    cost: resCost });
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
    const total = this.freebiesPool();
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
    // Merits cost freebies; flaws grant them (capped by chronicle rule)
    const meritCost = this.calcMeritCost();
    const flawBonus = this.calcFlawBonus();
    let total = this.calcAttrFreebies() + this.calcAbilityFreebies() + this.calcBgFreebies() + this.calcSphereFreebies() + this.calcResonanceFreebies() + meritCost - flawBonus;
    // Arete: each dot above 1 costs 4 freebies, minus any chronicle arete bonus
    const areteBonus = this._lockedBaselines?.areteBonus || 0;
    total += Math.max(0, (c.arete || 1) - 1 - areteBonus) * 4;
    total += Math.max(0, (c.willpower || 5) - 5) * 1;
    const avatarRating = (c.backgrounds || {})['avatar'] || 0;
    total += Math.ceil(Math.max(0, (c.quintessence || 0) - avatarRating) / 4);
    // Manual entries
    Object.values(c.freebie_spent || {}).forEach(v => { total += v; });
    return { total };
  },

  updateFreebieDisplay() {
    // Re-compute baselines during steps 1-5 so that traits added within the
    // creation allocation pool are never incorrectly shown as costing freebies.
    // In step 6 the baselines are frozen at step-entry to give stable dot coloring.
    if (this.step < 6) this._lockBaselines();

    // Auto-apply chronicle free Arete bonus — bump arete up to the bonus floor
    const areteBonus = this._lockedBaselines?.areteBonus || 0;
    if (areteBonus > 0) {
      this.char.arete = Math.max(this.char.arete || 1, 1 + areteBonus);
    }

    const total     = this.freebieSpent();
    const remaining = this.freebiesPool() - total;
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
    return this.freebiesPool() - this.calcFreebies().total;
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

  // Compute and store per-trait creation baselines so step 6 dot coloring stays stable.
  // Chronicle bonus dots are a PRE-ALLOCATION free layer: they are consumed first (before
  // allocation points), and do NOT count against the allocation pool display.
  // Stored in _lockedBaselines:
  //   .attrs / .abilities / .backgrounds / .spheres  — total free baseline (bonus + alloc)
  //   .bonusAttrs / .bonusAbilities / .bonusBgs / .bonusSpheres — just the bonus portion
  //   .areteBonus — bonus arete dots (reduces calcFreebies arete cost)
  _lockBaselines() {
    const c = this.char;
    const bonusDots = c._chronicleRules?.bonusDots || [];

    // Distribute `pool` bonus dots (lowest-value traits first, capped at current value - startVal)
    const bonusGreedy = (ids, getValue, pool, startVal = 0) => {
      const result = {};
      ids.forEach(id => { result[id] = 0; });
      if (pool <= 0) return result;
      const sorted = [...ids].sort((a, b) => getValue(a) - getValue(b));
      let rem = pool;
      for (const id of sorted) {
        if (rem <= 0) break;
        const available = Math.max(0, getValue(id) - startVal);
        if (!available) continue;
        const grant = Math.min(rem, available);
        result[id] = grant;
        rem -= grant;
      }
      return result;
    };

    // Allocation greedy: runs on (value - bonusBaseline) vs allocation pool, starts from bonusBase
    const allocGreedy = (ids, getValue, pool, bonusBase, startVal = 0) => {
      const baselines = {};
      ids.forEach(id => { baselines[id] = startVal + (bonusBase[id] || 0); });
      const sorted = [...ids].sort((a, b) =>
        Math.max(0, getValue(a) - baselines[a]) - Math.max(0, getValue(b) - baselines[b])
      );
      let rem = pool;
      for (const id of sorted) {
        if (rem <= 0) break;
        const above = Math.max(0, getValue(id) - baselines[id]);
        const alloc = Math.min(rem, above);
        baselines[id] += alloc;
        rem -= alloc;
      }
      return baselines; // bonus + allocation combined
    };

    const attrPri    = c.attr_priority    || ['Physical','Social','Mental'];
    const abilityPri = c.ability_priority || ['Talents','Skills','Knowledges'];
    let attrAllocs = { Physical:[7,5,3][attrPri.indexOf('Physical')]??0, Social:[7,5,3][attrPri.indexOf('Social')]??0, Mental:[7,5,3][attrPri.indexOf('Mental')]??0 };
    let abilAllocs = { Talents:[13,9,5][abilityPri.indexOf('Talents')]??0, Skills:[13,9,5][abilityPri.indexOf('Skills')]??0, Knowledges:[13,9,5][abilityPri.indexOf('Knowledges')]??0 };

    // ── For finalized characters without saved creation baselines (pre-freebie-tracking era),
    //    use the snapshot pools computed at load time. These are sized to cover whatever
    //    dots existed when the character was loaded, without growing as new dots are added
    //    during this session (so new dots correctly cost freebies).
    if (this._legacyPoolSnapshot) {
      const snap = this._legacyPoolSnapshot;
      attrAllocs = { ...snap.attrAllocs };
      abilAllocs = { ...snap.abilAllocs };
    }

    // ── Attributes ───────────────────────────────────────────────────────────────
    const attrGroupMap = { Physical:['strength','dexterity','stamina'], Social:['charisma','manipulation','appearance'], Mental:['perception','intelligence','wits'] };
    const allAttrIds = [...attrGroupMap.Physical, ...attrGroupMap.Social, ...attrGroupMap.Mental];
    // Named attr bonuses go directly to that attr; wildcard bonus distributed greedily
    const wildcardAttrBonus = bonusDots.filter(bd => bd.type === 'attribute' && !bd.name).reduce((s,bd) => s+(bd.amount||0), 0);
    const bonusAttrs = bonusGreedy(allAttrIds, id => c[id]||1, wildcardAttrBonus, 1);
    bonusDots.forEach(bd => {
      if (bd.type !== 'attribute' || !bd.name) return;
      const id = bd.name.toLowerCase();
      if (bonusAttrs[id] !== undefined) bonusAttrs[id] = Math.min((c[id]||1) - 1, bonusAttrs[id] + (bd.amount||0));
    });
    const attrs = {};
    ['Physical','Social','Mental'].forEach(cat =>
      Object.assign(attrs, allocGreedy(attrGroupMap[cat], id => c[id]||1, attrAllocs[cat],
        Object.fromEntries(attrGroupMap[cat].map(id => [id, bonusAttrs[id]||0])), 1))
    );

    // ── Abilities ────────────────────────────────────────────────────────────────
    const anyAbilBonus = bonusDots.filter(bd => bd.type === 'any_ability').reduce((s,bd) => s+(bd.amount||0), 0);
    const abilGroups = {
      Talents:    { key:'talents',    data:M20.TALENTS,    sec:M20.SECONDARY_TALENTS },
      Skills:     { key:'skills',     data:M20.SKILLS,     sec:M20.SECONDARY_SKILLS },
      Knowledges: { key:'knowledges', data:M20.KNOWLEDGES, sec:M20.SECONDARY_KNOWLEDGES },
    };
    const catTypeMap = { Talents:'talent', Skills:'skill', Knowledges:'knowledge' };
    const allAbilDefs = [...M20.TALENTS,...M20.SKILLS,...M20.KNOWLEDGES,
      ...M20.SECONDARY_TALENTS,...M20.SECONDARY_SKILLS,...M20.SECONDARY_KNOWLEDGES,
      ...(c._chronicleRules?.customAbilities||[]).map(a=>({id:a.id,name:a.name}))];
    const bonusAbilities = {};
    const abilities = {};
    ['Talents','Skills','Knowledges'].forEach(cat => {
      const {key, data, sec} = abilGroups[cat];
      const secIds   = sec.map(a=>a.id).filter(id => c[key][id] !== undefined);
      const custIds  = Object.keys(c.custom_ability_names || {}).filter(id => c[key][id] !== undefined);
      const chronIds = this.effectiveCustomAbilities(key).map(a => a.id);
      const allIds   = [...data.map(a=>a.id), ...secIds, ...custIds, ...chronIds];
      // Wildcard bonus for this category + any_ability bonus (applies per category)
      const wildcardCatBonus = bonusDots.filter(bd => bd.type === catTypeMap[cat] && !bd.name).reduce((s,bd) => s+(bd.amount||0), 0);
      const catBonusPool = wildcardCatBonus + anyAbilBonus;
      const catBonus = bonusGreedy(allIds, id => c[key][id]||0, catBonusPool);
      // Named bonuses on top
      bonusDots.forEach(bd => {
        if (bd.type !== catTypeMap[cat] || !bd.name) return;
        const found = allAbilDefs.find(a => a.name === bd.name);
        if (!found || catBonus[found.id] === undefined) return;
        catBonus[found.id] = Math.min(c[key][found.id]||0, catBonus[found.id] + (bd.amount||0));
      });
      Object.assign(bonusAbilities, catBonus);
      const catBonusSlice = Object.fromEntries(allIds.map(id => [id, catBonus[id]||0]));
      Object.assign(abilities, allocGreedy(allIds, id => c[key][id]||0, abilAllocs[cat], catBonusSlice));
    });

    // ── Backgrounds ───────────────────────────────────────────────────────────────
    const bgAff = c.affiliation || 'Traditions';
    const filteredBgs = filteredBackgrounds(bgAff);
    const chronCustomBgs = (c._chronicleRules?.customBackgrounds || []).filter(bg => bg.name)
      .map(bg => ({ id: bg.id, name: bg.name, doubleCost: false, max: bg.max || 5 }));
    const allBgsForBaseline = [...filteredBgs, ...chronCustomBgs];
    const allBgIds = allBgsForBaseline.map(bg => bg.id);
    const wildcardBgBonus = bonusDots.filter(bd => bd.type === 'background' && !bd.name).reduce((s,bd) => s+(bd.amount||0), 0);
    const bonusBgs = bonusGreedy(allBgIds, id => c.backgrounds[id]||0, wildcardBgBonus);
    bonusDots.forEach(bd => {
      if (bd.type !== 'background' || !bd.name) return;
      const bg = allBgsForBaseline.find(b => b.name === bd.name);
      if (bg && bonusBgs[bg.id] !== undefined)
        bonusBgs[bg.id] = Math.min(c.backgrounds[bg.id]||0, bonusBgs[bg.id] + (bd.amount||0));
    });
    const backgrounds = {};
    allBgsForBaseline.forEach(bg => { backgrounds[bg.id] = bonusBgs[bg.id] || 0; });
    // Allocation greedy on remaining dots (after bonus is subtracted)
    const sortedBgs = [...allBgsForBaseline].sort((a, b) =>
      Math.max(0, (c.backgrounds[a.id]||0) - (bonusBgs[a.id]||0)) -
      Math.max(0, (c.backgrounds[b.id]||0) - (bonusBgs[b.id]||0))
    );
    let bgRem = this._legacyPoolSnapshot
      ? this._legacyPoolSnapshot.bgPool
      : M20.CREATION.backgroundDots;
    for (const bg of sortedBgs) {
      if (bgRem <= 0) break;
      const val = Math.max(0, (c.backgrounds[bg.id] || 0) - (bonusBgs[bg.id] || 0));
      if (val === 0) continue;
      const costPer = bg.doubleCost ? 2 : 1;
      const allocDots = Math.min(Math.floor(bgRem / costPer), val);
      backgrounds[bg.id] += allocDots;
      bgRem -= allocDots * costPer;
    }

    // ── Spheres ───────────────────────────────────────────────────────────────
    const allSphereIds = M20.SPHERES.map(s => s.id);
    const wildcardSphBonus = bonusDots.filter(bd => bd.type === 'sphere' && !bd.name).reduce((s,bd) => s+(bd.amount||0), 0);
    const bonusSpheres = bonusGreedy(allSphereIds, id => c.spheres[id]||0, wildcardSphBonus);
    bonusDots.forEach(bd => {
      if (bd.type !== 'sphere' || !bd.name) return;
      const s = M20.SPHERES.find(s => s.name === bd.name);
      if (s && bonusSpheres[s.id] !== undefined)
        bonusSpheres[s.id] = Math.min(c.spheres[s.id]||0, bonusSpheres[s.id] + (bd.amount||0));
    });
    bonusDots.filter(bd => bd.type === 'focus_sphere').forEach(bd => {
      const id = (c.affinity_sphere || '').toLowerCase();
      if (id && bonusSpheres[id] !== undefined)
        bonusSpheres[id] = Math.min(c.spheres[id]||0, bonusSpheres[id] + (bd.amount||0));
    });
    const bonusSphSlice = Object.fromEntries(allSphereIds.map(id => [id, bonusSpheres[id]||0]));
    const sphPool = this._legacyPoolSnapshot
      ? this._legacyPoolSnapshot.sphPool
      : M20.CREATION.sphereDots;
    const spheres = allocGreedy(allSphereIds, id => c.spheres[id]||0, sphPool, bonusSphSlice);

    // ── Arete ─────────────────────────────────────────────────────────────────
    const areteBonus = bonusDots.filter(bd => bd.type === 'arete').reduce((s,bd) => s+(bd.amount||0), 0);

    this._lockedBaselines = { attrs, abilities, backgrounds, spheres,
                               bonusAttrs, bonusAbilities, bonusBgs, bonusSpheres, areteBonus };
  },

  validateStep() {
    if (this.step === 0 && !this.char.name.trim()) return 'Character name is required.';
    if (this.step === 0 && !this.char.tradition) return 'Please choose a tradition or affiliation.';
    if (this.step === 0 && !this.char.essence) return 'Please choose an Essence.';
    return null;
  },

  async saveDraft() {
    if (!this.char.name.trim()) { toast('Enter a name first.', 'error'); return; }
    this.char.is_draft = 1;
    const payload = ('_join_code' in this.char)
      ? { ...this.char, join_code: this.char._join_code }
      : this.char;
    try {
      if (this.editId) {
        await API.update(this.editId, payload);
        toast('Draft saved.');
      } else {
        const created = await API.create(payload);
        this.editId = created.id;
        App.currentCharId = created.id;
        toast('Draft saved as new character.');
      }
    } catch { toast('Save failed.', 'error'); }
  },

  async saveCharacter() {
    if (this.freebieSpent() > this.freebiesPool()) {
      if (!confirm(`You've spent more than ${this.freebiesPool()} freebie points. Save anyway?`)) return;
    }
    this.char.is_draft = 0;
    // Persist the creation baselines so that future XP spending doesn't
    // retroactively inflate the freebie calculation. Once locked, the
    // freebie cost is always computed against these fixed per-trait baselines
    // rather than the live trait values.
    if (!this._lockedBaselines) this._lockBaselines();
    this.char.creation_baselines = this._lockedBaselines;
    try {
      let char;
      // Include join_code when explicitly set (empty string = unlink)
      const payload = ('_join_code' in this.char)
        ? { ...this.char, join_code: this.char._join_code }
        : this.char;
      if (this.editId) {
        char = await API.update(this.editId, payload);
        toast('Character updated.');
      } else {
        char = await API.create(payload);
        toast('Character created. The Awakening is complete.');
      }
      App.currentCharId = char.id;
      Sheet.sharedToken = null;
      Sheet.render(char);
      Sheet.renderToolbar('owner');
      App.showPage('sheet');
      App.trackRecentView(char.id);
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
            <span class="archetype-list-name">${a.name}${a.isCustom ? ' <span class="custom-badge">Custom</span>' : ''}${a.page ? ` <span class="page-ref archetype-page-ref">${a.page}</span>` : ''}</span>
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
          <div class="archetype-name">${a.name}${a.isCustom ? ' <span class="custom-badge">Custom</span>' : ''}${a.page ? ` <span class="page-ref archetype-page-ref">${a.page}</span>` : ''}</div>
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
        ${c.chronicle_id
          ? `<input type="text" id="f-chronicle" value="${c.linked_chronicle_name || c.chronicle || ''}" readonly class="form-input-readonly" />`
          : `<input type="text" id="f-chronicle" value="${c.chronicle}" placeholder="Story name" />`
        }
        ${App.currentUser?.role === 'guest' ? '' : c.chronicle_id
          ? `<div class="chronicle-linked-notice">
               <span class="chronicle-linked-tick">✓</span>
               Linked to <strong>${c.linked_chronicle_name || c.chronicle || 'a Chronicle'}</strong>
               <button type="button" class="btn-ghost btn-sm" id="btn-unlink-chronicle">Unlink</button>
             </div>`
          : `<div class="join-code-row">
               <label class="join-code-label">
                 Join Code
                 <span class="info-tip" data-tip="Enter a 5-character code to link this character to a Chronicle. Ask your Storyteller for the code.">?</span>
               </label>
               <div class="join-code-input-wrap">
                 <input type="text" id="f-join-code" maxlength="5"
                   value="${c._join_code || ''}"
                   placeholder="XXXXX"
                   autocomplete="off"
                   spellcheck="false"
                   style="text-transform:uppercase;letter-spacing:0.15em;width:7rem"
                 />
                 <span id="join-code-status" class="join-code-status"></span>
               </div>
             </div>`
        }
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
    const normFac = normalizeAllowedFactions(this.char._chronicleRules?.allowedFactions);

    const tabs = [
      { id: 'Traditions', label: 'The Traditions' },
      { id: 'Technocracy', label: 'Technocratic Union' },
      { id: 'Disparates', label: 'Disparate Crafts' },
    ];

    const tabHtml = tabs.map(t => {
      const restricted = !factionAllowed(normFac, t.id);
      return `<button class="affil-tab ${c.affiliation === t.id ? 'active' : ''} ${restricted ? 'affil-tab-restricted' : ''}"
        data-affil="${t.id}" ${restricted ? 'title="Not allowed in this Chronicle"' : ''}>${t.label}${restricted ? ' ✕' : ''}</button>`;
    }).join('');

    const renderGroup = (list, type) => list.map(t => {
      const facRestricted  = !factionAllowed(normFac, type);
      const subRestricted  = !subfactionAllowed(normFac, type, t.name);
      const restricted     = facRestricted || subRestricted;
      return `
      <div class="tradition-card ${c.tradition === t.name ? 'selected' : ''} ${restricted ? 'tradition-card-restricted' : ''}" data-tradition="${t.name}" data-type="${type}">
        <div class="trad-name">${t.shortName || t.name}</div>
        ${t.affinitySpheres ? `<div class="trad-spheres">Affinity: ${t.affinitySpheres.join(' / ')}</div>` : ''}
        <div class="trad-desc">${t.description}</div>
        ${t.page ? `<div class="page-ref" style="margin-top:0.35rem">p. ${t.page}</div>` : ''}
        ${restricted ? `<div class="trad-restricted-notice">Not allowed in this Chronicle</div>` : ''}
      </div>`;
    }).join('');

    // Build restriction notice
    let restrictionNotice = '';
    if (normFac) {
      const parts = Object.entries(normFac).map(([f, subs]) => {
        const label = FACTION_LABEL[f] || f;
        return subs.length ? `${label} (${subs.join(', ')})` : label;
      });
      // Also list blocked factions
      const blocked = ['Traditions','Technocracy','Disparates'].filter(f => !(f in normFac));
      const blockedStr = blocked.map(f => `~~${FACTION_LABEL[f]}~~`).join(', ');
      const notice = [...parts, ...(blocked.length ? [blockedStr] : [])].join(' · ');
      restrictionNotice = `<div class="affil-restriction-notice">This Chronicle restricts characters to: <strong>${notice}</strong></div>`;
    }

    return `
    <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:0.75rem">Choose your mage's affiliation — the Traditions, the Technocratic Union, or the Disparate Crafts. <span class="page-ref">p. 254</span></p>
    ${restrictionNotice}
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
      const lb = this._lockedBaselines;
      const rawUsed  = attrs.reduce((sum, a) => sum + Math.max(0, (c[a.id] || 1) - 1), 0);
      const bonusUsed = attrs.reduce((sum, a) => sum + (lb?.bonusAttrs?.[a.id] || 0), 0);
      const usedExtra  = Math.max(0, rawUsed - bonusUsed);
      const remaining  = totalExtra - usedExtra;
      const overBy     = Math.max(0, -remaining);
      const displayRem = Math.max(0, remaining);
      const bonusLines = this._chronicleBonusLines('attribute');
      const bonusHtml  = bonusLines.length ? `<span class="chronicle-bonus-notice">${bonusLines.join(' · ')} <span class="cb-free">(chronicle, free)</span></span>` : '';
      return `
      <div class="attr-block">
        <div class="attr-block-header">
          <span class="attr-block-title">${cat} Attributes</span>
          <span class="attr-block-points">
            <span class="pts">${displayRem}</span> / ${totalExtra} pts remaining
            ${overBy > 0 ? `<span class="pts-freebie">+${overBy} via freebies</span>` : ''}
          </span>
        </div>
        ${bonusHtml}
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

    const matchedPracticeS2 = M20.PRACTICES.find(p => p.name.toLowerCase() === (c.practice || '').toLowerCase());
    const suggestedAbilityIds = new Set(matchedPracticeS2?.abilities || []);

    const priorityHtml = this.renderPrioritySorter(
      ['Talents', 'Skills', 'Knowledges'],
      pri,
      'ability_priority',
      { primary: 13, secondary: 9, tertiary: 5 }
    );

    const abilityRow = (a, key, isSecondary = false, isCustom = false, isChronicle = false) => {
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
      const isSuggestedAbility = suggestedAbilityIds.has(a.id);
      return `
        <div class="attr-row${isSecondary ? ' secondary-ability-row' : ''}" data-ability="${a.id}" data-category="${key}">
          <div class="attr-row-main">
            <div class="attr-info">
              <div class="attr-name">${a.name}
                ${isSecondary ? '<span class="secondary-badge">Secondary</span>' : ''}
                ${isCustom ? '<span class="secondary-badge">Custom</span>' : ''}
                ${isChronicle ? '<span class="secondary-badge chronicle-badge">Chronicle</span>' : ''}
                ${isSuggestedAbility ? `<span class="suggested-badge" title="Suggested from ${matchedPracticeS2.name}">✦</span>` : ''}
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
      const chronAbils  = this.effectiveCustomAbilities(key);
      const chronUsed   = chronAbils.reduce((sum, a) => sum + (c[key][a.id] || 0), 0);
      // Subtract chronicle bonus dots so they don't count against the allocation pool
      const lb = this._lockedBaselines;
      const allAbilIds = [
        ...data.map(a => a.id),
        ...secAll.filter(a => c[key][a.id] !== undefined).map(a => a.id),
        ...custIds,
        ...chronAbils.map(a => a.id),
      ];
      const bonusUsed = allAbilIds.reduce((sum, id) => sum + (lb?.bonusAbilities?.[id] || 0), 0);
      const used        = Math.max(0, primaryUsed + secUsed + custUsed + chronUsed - bonusUsed);
      const remaining   = total - used;
      const overBy      = Math.max(0, -remaining);
      const displayRem  = Math.max(0, remaining);

      const bonusLinesAbil = this._chronicleBonusLines([key === 'talents' ? 'talent' : key === 'skills' ? 'skill' : 'knowledge', 'any_ability']);
      const bonusHtmlAbil  = bonusLinesAbil.length ? `<div class="chronicle-bonus-notice">${bonusLinesAbil.join(' · ')} <span class="cb-free">(chronicle, free)</span></div>` : '';

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
        ${bonusHtmlAbil}
        ${data.map(a => abilityRow(a, key, false)).join('')}
        ${secAdded.map(a => abilityRow(a, key, true)).join('')}
        ${custIds.map(id => {
          const name = (c.custom_ability_names || {})[id] || id;
          return abilityRow({ id, name, levels: null, specialties: [], description: 'Custom ability' }, key, true, true);
        }).join('')}
        ${chronAbils.map(a => abilityRow({ id: a.id, name: a.name, levels: null, specialties: [], description: 'Chronicle ability' }, key, false, false, true)).join('')}
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
    const customChronBgs = (c._chronicleRules?.customBackgrounds || []).filter(bg => bg.name);
    const chronBgIds = new Set(customChronBgs.map(bg => bg.id));
    const allBgs = [...filteredBackgrounds(aff), ...customChronBgs.map(bg => ({ id: bg.id, name: bg.name, description: bg.description || '', max: bg.max || 5, doubleCost: false, levels: [] }))];
    const lb = this._lockedBaselines;
    const rawBgDots  = allBgs.reduce((s, bg) => s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1), 0);
    const bonusBgDots = allBgs.reduce((s, bg) => s + (lb?.bonusBgs?.[bg.id] || 0), 0);
    const usedDots = Math.max(0, rawBgDots - bonusBgDots);
    const remaining = totalDots - usedDots;
    const bgOverBy = Math.max(0, -remaining);
    const bgDisplayRem = Math.max(0, remaining);
    const bonusBgLines = this._chronicleBonusLines('background');
    const bonusBgHtml  = bonusBgLines.length ? `<div class="chronicle-bonus-notice">${bonusBgLines.join(' · ')} <span class="cb-free">(chronicle, free)</span></div>` : '';
    const bgRows = allBgs.map(bg => {
      const val = c.backgrounds[bg.id] || 0;
      const dispName = bgDisplayName(bg, aff);
      const bgMax = bg.max || 5;
      const levelDesc = bg.levels && val > 0 ? bg.levels[val - 1] : bg.description;
      const isChronBg = chronBgIds.has(bg.id);
      return `
      <div class="attr-row" data-bg="${bg.id}" data-bg-max="${bgMax}">
        <div class="attr-info">
          <div class="attr-name">${dispName}
            ${isChronBg ? '<span class="secondary-badge chronicle-badge">Chronicle</span>' : ''}
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
      ${bonusBgHtml}
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

  // ── Practice select options, with optional paradigm-based optgroups ─────────
  _buildPracticeOptsHTML(suggestedIds = []) {
    if (!suggestedIds.length) {
      return M20.PRACTICES.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
    const suggested = M20.PRACTICES.filter(p => suggestedIds.includes(p.id));
    const others    = M20.PRACTICES.filter(p => !suggestedIds.includes(p.id));
    return `<optgroup label="✦ Suggested Practices">
        ${suggested.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </optgroup>
      <optgroup label="Other Practices">
        ${others.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </optgroup>`;
  },

  // ── Paradigm select options, with optional practice-based optgroups ──────────
  _buildParadigmOptsHTML(suggestedIds = []) {
    if (!suggestedIds.length) {
      return M20.PARADIGMS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
    const suggested = M20.PARADIGMS.filter(p => suggestedIds.includes(p.id));
    const others    = M20.PARADIGMS.filter(p => !suggestedIds.includes(p.id));
    return `<optgroup label="✦ Suggested Paradigms">
        ${suggested.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </optgroup>
      <optgroup label="Other Paradigms">
        ${others.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </optgroup>`;
  },

  // ── Resonance item HTML builder (used in creator Step 4 and sheet) ──────────
  _buildResonanceItemHTML(res, idx) {
    const isFirst = idx === 0;
    const r = Math.max(1, res.rating || 1);
    const freeStart = isFirst ? 1 : 0;
    let cost = 0;
    for (let d = freeStart + 1; d <= r; d++) cost += d * 3;
    const costLabel = isFirst && r === 1
      ? '1 free dot'
      : `${cost} freebie${cost !== 1 ? 's' : ''}`;
    const flavorOpts = M20.RESONANCE_FLAVORS.map(f =>
      `<option value="${f.id}" ${res.flavor === f.id ? 'selected' : ''}>${f.id}</option>`
    ).join('');
    const flavorDesc = res.flavor
      ? (M20.RESONANCE_FLAVORS.find(f => f.id === res.flavor)?.desc || '')
      : '';
    const dotsHtml = Array.from({length: 5}, (_, i) => {
      const d = i + 1;
      const isFreebie = isFirst ? d > 1 : true;
      return `<span class="dot ${d <= r ? 'filled' : ''} ${isFreebie ? 'dot-freebie' : 'dot-free'}" `
        + `data-res-idx="${idx}" data-res-dot="${d}" `
        + `title="${isFreebie ? `Costs ${d * 3} freebie pt${d * 3 > 1 ? 's' : ''}` : 'Free dot'}"></span>`;
    }).join('');
    return `<div class="resonance-item" data-res-idx="${idx}">
      <div class="resonance-item-row">
        <input class="resonance-desc-input" type="text" placeholder="One word…"
          value="${(res.description || '').replace(/"/g, '&quot;')}" maxlength="40" data-res-idx="${idx}" />
        <select class="resonance-flavor-select" data-res-idx="${idx}">
          <option value="">— Flavor —</option>
          ${flavorOpts}
        </select>
        <div class="resonance-dots-wrap">${dotsHtml}</div>
        <span class="resonance-cost-tag">${costLabel}</span>
        ${!isFirst ? `<button class="resonance-remove-btn" data-res-idx="${idx}" title="Remove">✕</button>` : ''}
      </div>
      ${flavorDesc ? `<div class="resonance-flavor-desc">${flavorDesc}</div>` : ''}
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

    // Ensure resonance is initialized
    if (!Array.isArray(c.resonance) || c.resonance.length === 0) {
      c.resonance = [{ description: '', flavor: '', rating: 1 }];
    }
    const resonanceListHTML = c.resonance.map((r, i) => this._buildResonanceItemHTML(r, i)).join('');

    const selectedInstruments = Array.isArray(c.instruments) ? c.instruments : [];
    const builtinSet = new Set(M20.INSTRUMENTS);
    const customInstruments = selectedInstruments.filter(i => !builtinSet.has(i));

    // Paradigm dropdown — check if current practice is a known one and pre-suggest
    const matchedPractice = M20.PRACTICES.find(p => p.name.toLowerCase() === (c.practice || '').toLowerCase());
    const paradigmOpts = this._buildParadigmOptsHTML(matchedPractice?.paradigms || []);

    const suggestedInstruments = new Set(matchedPractice?.instruments || []);

    const builtinRows = M20.INSTRUMENTS.map(inst => {
      const checked = selectedInstruments.includes(inst);
      const safeId  = inst.replace(/[^a-zA-Z0-9]/g, '_');
      const isSuggestedInst = suggestedInstruments.has(inst);
      return `<label class="instrument-item ${checked ? 'checked' : ''}${isSuggestedInst ? ' suggested-instrument' : ''}" for="inst-${safeId}">
        <input type="checkbox" id="inst-${safeId}" value="${inst}" ${checked ? 'checked' : ''} />
        <span class="inst-text">${inst}${isSuggestedInst ? `<span class="suggested-badge" title="Suggested from ${matchedPractice.name}">✦</span>` : ''}</span>
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

    // Build ability ID→name lookup for hint display
    const abilityIdToName = Object.fromEntries(ALL_ABILITY_DEFS.map(a => [a.id, a.name]));

    // Practice hint shown if current value matches a known practice
    const practiceHintHTML = matchedPractice
      ? `<div class="practice-hint" id="practice-hint">
           <span class="practice-hint-label">Suggested abilities:</span> ${matchedPractice.abilities.map(id => abilityIdToName[id] || id).join(', ')} ·
           <span class="practice-hint-label">Common instruments:</span> ${matchedPractice.instruments.join(', ')}
           <span class="page-ref" style="margin-left:0.3rem">M20 p. ${matchedPractice.page}</span>
         </div>`
      : `<div class="practice-hint" id="practice-hint" style="display:none"></div>`;

    // Try to infer the active paradigm from stored paradigm text (chosen from preset)
    const activeParadigm = M20.PARADIGMS.find(p => c.paradigm && c.paradigm.startsWith(p.desc));
    const suggestedPracticeIds = activeParadigm
      ? M20.PRACTICES.filter(p => p.paradigms.includes(activeParadigm.id)).map(p => p.id)
      : [];
    const practiceOpts = this._buildPracticeOptsHTML(suggestedPracticeIds);
    const practiceFromParadigmNote = activeParadigm
      ? `<div class="practice-paradigm-note" id="practice-from-paradigm-note">✦ Suggested practices for <em>${activeParadigm.name}</em> appear at the top of the list above.</div>`
      : `<div class="practice-paradigm-note" id="practice-from-paradigm-note" style="display:none"></div>`;

    return `
    ${this.stepHeader('Step Five: Focus & Practice',
      M20.QUOTES.step5,
      `Define your mage's <strong>Paradigm</strong> (what they believe about the nature of reality), <strong>Practice</strong> (how they work their magic), and <strong>Instruments</strong> (the tools and foci they use). <span class="page-ref">M20 p. 259</span>`)}

    <div class="form-group" style="margin-bottom:1.2rem">
      <label>Paradigm — "What do you believe reality is?" <span class="ref">p. 568</span></label>
      ${trad ? `<div style="font-size:0.78rem;color:var(--purple-dim);font-style:italic;margin-bottom:0.4rem">${trad.name} paradigm: "${paradigmHint}"</div>` : ''}
      <select id="f-paradigm-select" style="margin-bottom:0.5rem">
        <option value="">— Choose a common paradigm —</option>
        ${paradigmOpts}
        <option value="custom">Custom (write your own)</option>
      </select>
      ${matchedPractice ? `<div class="practice-paradigm-note" id="paradigm-practice-note">✦ Suggested paradigms for <em>${matchedPractice.name}</em> appear at the top of the list above.</div>` : `<div class="practice-paradigm-note" id="paradigm-practice-note" style="display:none"></div>`}
      <textarea id="f-paradigm" rows="4" placeholder="Describe your mage's core belief about the nature of reality and magic…">${c.paradigm}</textarea>
    </div>

    <div class="form-group" style="margin-bottom:1.5rem">
      <label>Practice — "How do you work your magic?" <span class="ref">p. 573</span></label>
      <select id="f-practice-select" style="margin-bottom:0.3rem">
        <option value="">— Choose a common practice —</option>
        ${practiceOpts}
        <option value="custom">Custom (write your own)</option>
      </select>
      ${practiceFromParadigmNote}
      <input type="text" id="f-practice" value="${c.practice}" placeholder="e.g. Alchemy, Shamanism, Hypertech, Martial Arts…" />
      ${practiceHintHTML}
    </div>

    <div style="margin-bottom:0.6rem">
      <label>Instruments — Tools &amp; Foci <span class="ref">p. 259</span></label>
      <p style="font-size:0.82rem;color:var(--text-dim);margin:0.2rem 0 0">
        Narrative tools describing <em>how</em> you work magic. Most mages use roughly 7.
      </p>
    </div>
    <div class="instrument-tally-bar">
      <div class="instrument-tally${selectedInstruments.length >= 7 ? ' at-target' : ''}" id="instrument-tally">
        <span class="inst-count">${selectedInstruments.length}</span>
        <span class="inst-label"> selected</span>
        <span class="inst-hint">${selectedInstruments.length >= 7 ? ' ✓' : ' (~7 recommended)'}</span>
      </div>
    </div>
    <div class="instrument-list" id="instrument-list">${instrumentRows}</div>
    <div class="instrument-custom-adder">
      <input type="text" id="f-custom-instrument" placeholder="Add a custom instrument\u2026" />
      <button class="btn-secondary" id="btn-add-instrument">＋ Add</button>
    </div>

    <div class="resonance-section">
      <label>Resonance <span class="ref">p. 186</span></label>
      <p style="font-size:0.82rem;color:var(--text-dim);margin:0.2rem 0 0.8rem">
        The spiritual imprint of your magic. Your first resonance begins at 1 dot for free.
        Raising a resonance costs new rating × 3 freebie points. Adding another resonance costs 3 freebies for its first dot.
      </p>
      <div id="resonance-list">${resonanceListHTML}</div>
      <button class="resonance-add-btn" id="btn-add-resonance">＋ Add Resonance <span class="resonance-add-cost">(3 freebies)</span></button>
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
    // Normalize to lowercase ID (old chars may have stored proper-cased name)
    if (c.affinity_sphere) c.affinity_sphere = c.affinity_sphere.toLowerCase();
    let selectedAffinity = c.affinity_sphere;
    if (!selectedAffinity && affinitySpheres.length === 1) {
      selectedAffinity = affinitySpheres[0].toLowerCase();
      c.affinity_sphere = selectedAffinity;
    }

    const totalDots = M20.CREATION.sphereDots;
    const lb5 = this._lockedBaselines;
    const rawSphDots  = Object.values(c.spheres).reduce((s, v) => s + v, 0);
    const bonusSphDots = M20.SPHERES.reduce((s, sph) => s + (lb5?.bonusSpheres?.[sph.id] || 0), 0);
    const usedDots  = Math.max(0, rawSphDots - bonusSphDots);
    const remaining = totalDots - usedDots;
    const sphOverBy = Math.max(0, -remaining);
    const sphDisplayRem = Math.max(0, remaining);

    // Affinity sphere selector for multiple options (includes Disparates — all spheres)
    let affinitySelectHtml = '';
    if (affinitySpheres.length > 1) {
      const opts = affinitySpheres.map(s => { const sid = s.toLowerCase(); return `<option value="${sid}" ${selectedAffinity === sid ? 'selected' : ''}>${s}</option>`; }).join('');
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

      const sphereImgName = sphere.name.replace(/\s+/g, '');
      return `
      <div class="sphere-card ${isAffinity ? 'affinity' : ''}" data-sphere="${sphere.id}">
        <div class="sphere-card-bg" style="background-image:url('/images/Sphere${sphereImgName}.webp')"></div>
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
    // Merits & Flaws always render in list view (categorised)

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
    if (!c.merits        || Array.isArray(c.merits))        c.merits        = {};
    if (!c.flaws         || Array.isArray(c.flaws))         c.flaws         = {};
    if (!c.merit_labels  || Array.isArray(c.merit_labels))  c.merit_labels  = {};
    // Ensure resonance is valid array (migration safety)
    if (!Array.isArray(c.resonance) || c.resonance.length === 0) {
      c.resonance = [{ description: '', flavor: '', rating: 1 }];
    }

    // Flat attribute specialty lookup: { strength: [...], dexterity: [...], ... }
    const attrSpecMap = {};
    Object.values(M20.ATTRIBUTES).forEach(grp => grp.forEach(a => { attrSpecMap[a.id] = a.specialties || []; }));

    // Helper: dots row for the freebie panel.
    // baseline:     total free threshold (bonus + allocation); dots above cost freebies.
    // bonusCeiling: upper bound of the chronicle-free zone (teal dots).
    // inherentMin:  dots at or below this are inherently free (gold), not teal — used for
    //               attributes which always start at 1 regardless of chronicle rules.
    const fbRow = (id, label, current, max, baseline, costPer, costNote, stat = null, specOptions = null, currentSpec = '', specThreshold = 4, desc = '', bonusCeiling = 0, inherentMin = 0) => {
      const spent     = Math.max(0, current - baseline) * costPer;
      const dotsHtml  = Array.from({length: max}, (_, i) => {
        const val = i + 1;
        // Chronicle-free: above the inherent min, within the bonus ceiling
        const isBonus  = val > inherentMin && val <= bonusCeiling;
        const isFree   = val <= baseline && !isBonus;            // allocation/inherent (gold)
        const isFilled = val <= current;
        const dotCls   = isBonus ? 'dot-chronicle' : isFree ? 'dot-free' : 'dot-freebie';
        const tipText  = isBonus ? 'Chronicle bonus (free)' : isFree ? 'Free (creation)' : `Costs ${costPer} freebie pt${costPer>1?'s':''}`;
        return `<span class="dot ${isFilled ? 'filled' : ''} ${dotCls}"
          data-val="${val}" title="${tipText}"></span>`;
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
          <span class="fb-row-desc">${desc}</span>
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
        const cur     = c[id] || 1;
        const baseline = lb.attrs[id] ?? 1;
        // Bonus attrs stored as dots ABOVE inherent min of 1; bonusCeiling = 1 + bonus
        const bonus    = lb.bonusAttrs?.[id] || 0;
        const bonusCeiling = bonus > 0 ? Math.min(cur, 1 + bonus) : 0;
        return fbRow(id, name, cur, 5, baseline, 5, '5 pts/dot', null, attrSpecMap[id] || [], c.specialties[id] || '', 4, '', bonusCeiling, 1);
      }).join('');
      const attrBonus = this._chronicleBonusLines('attribute');
      return `
      <div class="fb-group">
        <div class="fb-group-header">
          <span class="fb-group-label">${g.label} Attributes</span>
          <span class="fb-group-alloc">${alloc} creation pts · over-allocation costs 5 freebies/dot${attrBonus.length ? ` · <span class="cb-grant">${attrBonus.join(', ')} (free)</span>` : ''}</span>
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
        const cur      = c[g.key][a.id] || 0;
        const baseline = lb.abilities[a.id] ?? 0;
        const bonus    = lb.bonusAbilities?.[a.id] || 0;
        const specThreshold = GENERAL_ABILITY_IDS.has(a.id) ? 1 : 4;
        const levelDesc = cur > 0 && a.levels ? a.levels[cur - 1] : (a.description || '');
        return fbRow(a.id, a.name, cur, 5, baseline, 2, '2 pts/dot', null, a.specialties || [], c.specialties[a.id] || '', specThreshold, levelDesc, Math.min(cur, bonus));
      }).join('');
      // Secondary abilities
      const addedSec = g.sec.filter(a => c[g.key][a.id] !== undefined);
      const secRows  = addedSec.map(a => {
        const cur      = c[g.key][a.id] || 0;
        const baseline = lb.abilities[a.id] ?? 0;
        const bonus    = lb.bonusAbilities?.[a.id] || 0;
        const label    = a.name + ' <span class="secondary-badge">Secondary</span>';
        const levelDesc = cur > 0 && a.levels ? a.levels[cur - 1] : (a.description || '');
        return fbRow(a.id, label, cur, 3, baseline, 3, '3 pts/dot', null, a.specialties || [], c.specialties[a.id] || '', 4, levelDesc, Math.min(cur, bonus));
      }).join('');
      // Custom abilities
      const custIds = Object.keys(c.custom_ability_names || {}).filter(id => c[g.key][id] !== undefined);
      const custRows = custIds.map(id => {
        const cur      = c[g.key][id] || 0;
        const baseline = lb.abilities[id] ?? 0;
        const bonus    = lb.bonusAbilities?.[id] || 0;
        const name     = (c.custom_ability_names || {})[id] || id;
        const label    = name + ' <span class="secondary-badge">Custom</span>';
        return fbRow(id, label, cur, 3, baseline, 3, '3 pts/dot', null, [], c.specialties[id] || '', 4, '', Math.min(cur, bonus));
      }).join('');
      // Chronicle custom abilities (2 pts/dot)
      const chronAbilRows = this.effectiveCustomAbilities(g.key).map(a => {
        const cur      = c[g.key][a.id] || 0;
        const baseline = lb.abilities[a.id] ?? 0;
        const bonus    = lb.bonusAbilities?.[a.id] || 0;
        const label    = escHtml(a.name) + ' <span class="secondary-badge">Chronicle</span>';
        return fbRow(a.id, label, cur, 5, baseline, 2, '2 pts/dot', null, [], c.specialties[a.id] || '', 4, '', Math.min(cur, bonus));
      }).join('');
      const abilKey = g.key === 'talents' ? 'talent' : g.key === 'skills' ? 'skill' : 'knowledge';
      const abilBonus = this._chronicleBonusLines([abilKey, 'any_ability']);
      return `
      <div class="fb-group" data-cat="${g.key}">
        <div class="fb-group-header">
          <span class="fb-group-label">${g.label}</span>
          <span class="fb-group-alloc">${alloc} creation pts · over-allocation costs 2 freebies/dot${abilBonus.length ? ` · <span class="cb-grant">${abilBonus.join(', ')} (free)</span>` : ''}</span>
        </div>
        ${rows}
        ${secRows}
        ${custRows}
        ${chronAbilRows}
      </div>`;
    }).join('');

    // Background rows (filtered by faction, correct names, plus chronicle custom)
    const bgAff = c.affiliation || 'Traditions';
    const chronBgsForStep6 = (c._chronicleRules?.customBackgrounds || []).filter(bg => bg.name)
      .map(bg => ({ id: bg.id, name: bg.name, description: bg.description || '', max: bg.max || 5, doubleCost: false, levels: [] }));
    const allBgsForStep6 = [...filteredBackgrounds(bgAff), ...chronBgsForStep6];
    const bgSection = allBgsForStep6.map(bg => {
      const cur = c.backgrounds[bg.id] || 0;
      const baseline = lb.backgrounds[bg.id] ?? 0;
      const bgMax = bg.max || 5;
      const costPer = bg.doubleCost ? 2 : 1;
      const costNote = bg.doubleCost ? '2 pts/dot' : '1 pt/dot';
      const tipText = (bg.description + (bg.note ? ' (' + bg.note + ')' : '')).replace(/"/g, '&quot;');
      const label = `${bgDisplayName(bg, bgAff)} <span class="info-tip" data-tip="${tipText}">?</span>`;
      const levelDesc = bg.levels && cur > 0 ? bg.levels[cur - 1] : (bg.description || '');
      const bonus = lb.bonusBgs?.[bg.id] || 0;
      return fbRow(bg.id, label, cur, bgMax, baseline, costPer, costNote, null, null, '', 4, levelDesc, Math.min(cur, bonus));
    }).join('');

    // Sphere rows
    const sphereSection = M20.SPHERES.map(s => {
      const cur      = c.spheres[s.id] || 0;
      const baseline = lb.spheres[s.id] ?? 0;
      const bonus    = lb.bonusSpheres?.[s.id] || 0;
      return fbRow(s.id, s.name, cur, 3, baseline, 7, '7 pts/dot', null, s.specialties || [], c.specialties[s.id] || '', 4, '', Math.min(cur, bonus));
    }).join('');

    const { total } = this.calcFreebies();
    const remaining = this.freebiesPool() - total;

    return `
    ${this.stepHeader('Step Seven: Finishing Touches',
      M20.QUOTES.step7,
      `Spend your <strong>${this.freebiesPool()} Freebie Points</strong> to push traits beyond creation allocations, or raise core stats. Click dots in any section below — the bank updates live. <span class="page-ref">M20 p. 259</span>`)}

    <!-- ── Freebie Bank ── -->
    <div class="fb-bank" id="fb-bank">
      <div class="fb-bank-inner">
        <div class="fb-bank-label">Freebie Points</div>
        <div class="fb-bank-bar" id="fb-bar">
          ${Array.from({length: this.freebiesPool()}, (_, i) => `<span class="fb-pip ${i < (this.freebiesPool() - total) ? 'available' : 'spent'}"></span>`).join('')}
        </div>
        <div class="fb-bank-numbers">
          <span id="fb-remaining" class="${remaining < 0 ? 'fb-over' : ''}">${remaining}</span>
          <span class="fb-bank-of">of ${this.freebiesPool()} remaining</span>
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
    <details class="fb-details">
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
      <div class="fb-section-note">7 creation dots are free. Each additional dot costs 1 freebie pt.${(() => { const bl = this._chronicleBonusLines('background'); return bl.length ? ` <span class="cb-grant">${bl.join(' · ')} (chronicle, free)</span>` : ''; })()}</div>
      <div id="fb-bgs" class="fb-group">${bgSection}</div>
    </details>

    <!-- ── Spheres ── -->
    <details class="fb-details">
      <summary class="fb-details-summary">
        Spheres <span class="fb-details-cost" id="fb-cost-spheres"><!-- updated by JS --></span>
        <span class="fb-details-hint">7 pts/dot over 6-dot allocation · <span class="page-ref">p. 512</span></span>
      </summary>
      <div class="fb-section-note">6 creation dots are free. Each additional dot costs 7 freebie pts.${(() => { const bl = this._chronicleBonusLines(['sphere','focus_sphere']); return bl.length ? ` <span class="cb-grant">${bl.join(' · ')} (chronicle, free)</span>` : ''; })()}</div>
      <div id="fb-spheres" class="fb-group">${sphereSection}</div>
    </details>

    <!-- ── Merits ── -->
    <details class="fb-details mf-details">
      <summary class="fb-details-summary">
        Merits <span class="fb-details-cost" id="mf-cost-merits"></span>
        <span class="fb-details-hint">cost freebie points &middot; <span class="page-ref">M20 p. 340 / BoS p. 35</span></span>
      </summary>
      <div class="fb-section-note">Click a merit to add it; click again to remove. Variable-cost merits show a dropdown — choose your level first, then click the row to activate.</div>
      <div id="fb-merits" class="mf-list"></div>
    </details>

    <!-- ── Flaws ── -->
    <details class="fb-details mf-details">
      <summary class="fb-details-summary">
        Flaws <span class="fb-details-cost" id="mf-cost-flaws"></span>
        <span class="fb-details-hint">grant bonus freebie points (max +7) &middot; <span class="page-ref">M20 p. 350 / BoS p. 39</span></span>
      </summary>
      <div class="fb-section-note">Taking a flaw grants bonus freebie points equal to its cost (max +7 total). Click to toggle. Variable-cost flaws show a dropdown — select your level before clicking.</div>
      <div id="fb-flaws" class="mf-list"></div>
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

    const rows = tierLabels.map((tier, idx) => {
      const cat = current[idx];
      return `
      <div class="priority-row">
        <div class="priority-tier-label ${tierCls[idx]}">
          <span class="priority-tier-name">${tier}</span>
          <span class="priority-tier-pts">${tierPts[idx]} pts</span>
        </div>
        <div class="priority-dropzone" data-tier="${idx}" data-field="${field}">
          <div class="priority-chip" draggable="true" data-cat="${cat}" data-field="${field}">
            <span class="priority-chip-handle" aria-hidden="true">⠿</span>
            <span class="priority-chip-name">${cat}</span>
          </div>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="priority-sorter" data-field="${field}">
      ${rows}
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

    // ── Unlink chronicle ───────────────────────────────────────────────────
    $('#btn-unlink-chronicle', content)?.addEventListener('click', async () => {
      const chronicleName = c.linked_chronicle_name || c.chronicle || 'this Chronicle';
      if (!confirm(`Unlink from "${chronicleName}"?\n\nThis character will no longer be associated with that Chronicle.`)) return;
      c.chronicle_id       = null;
      c._join_code         = '';   // empty string signals server to clear chronicle_id
      c.linked_chronicle_name = null;
      c._chronicleRules    = null;
      Creator._lockedBaselines = null;
      try {
        if (Creator.editId) {
          await API.update(Creator.editId, { join_code: '' });
          toast('Unlinked from Chronicle', 'success');
        }
      } catch (err) {
        console.error(err);
        toast('Failed to save — unlink will apply on next save', 'error');
      }
      Creator.renderStep();
    });

    // ── Join code: live validation + chronicle name auto-fill ──────────────
    const joinInp    = $('#f-join-code', content);
    const joinStatus = $('#join-code-status', content);
    const chronInp   = $('#f-chronicle', content);
    if (joinInp) {
      let _joinDebounce;
      joinInp.addEventListener('input', () => {
        joinInp.value = joinInp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
        clearTimeout(_joinDebounce);
        const code = joinInp.value.trim();
        c._join_code = code || '';
        if (code.length < 5) {
          if (joinStatus) { joinStatus.textContent = ''; joinStatus.className = 'join-code-status'; }
          // Code is being cleared — remove any previously applied chronicle customizations
          if (c._chronicleRules) {
            c._chronicleRules = null;
            c.chronicle_id    = null;
            Creator._lockedBaselines = null;
          }
          return;
        }
        if (joinStatus) { joinStatus.textContent = '…'; joinStatus.className = 'join-code-status'; }
        _joinDebounce = setTimeout(async () => {
          const result = await Chronicle.lookupJoinCode(code);
          if (result) {
            joinStatus.textContent = '✓ ' + result.name;
            joinStatus.className = 'join-code-status valid';
            if (chronInp && !chronInp.value.trim()) {
              chronInp.value = result.name;
              c.chronicle = result.name;
            }
            // Apply chronicle customizations immediately so steps 1-6 reflect them
            c._chronicleRules    = result.rules || {};
            c.chronicle_id       = result.id;
            Creator._lockedBaselines = null; // force recompute with new rules when step 6 is entered
            // Show customization summary popup if the chronicle has any
            showChronicleWelcomeModal(result.name, c._chronicleRules);
          } else {
            joinStatus.textContent = '✗ Invalid code';
            joinStatus.className = 'join-code-status invalid';
            // Invalid code — clear any stale chronicle customizations
            c._chronicleRules    = null;
            c.chronicle_id       = null;
            Creator._lockedBaselines = null;
          }
        }, 400);
      });
    }
    bind('#f-paradigm', 'paradigm');
    bind('#f-practice', 'practice');

    // Practice preset dropdown — fills input, shows hint, updates paradigm suggestions
    const practiceSelS4  = $('#f-practice-select', content);
    const practiceInp    = $('#f-practice', content);
    const practiceHintEl = $('#practice-hint', content);
    const paradigmNote   = $('#paradigm-practice-note', content);
    const paradigmSel    = $('#f-paradigm-select', content);
    if (practiceSelS4 && practiceInp) {
      practiceSelS4.addEventListener('change', () => {
        const val = practiceSelS4.value;
        if (val && val !== 'custom') {
          const preset = M20.PRACTICES.find(p => p.id === val);
          if (preset) {
            c.practice = preset.name;
            practiceInp.value = preset.name;
            // Show hint (map ability IDs to display names)
            if (practiceHintEl) {
              const _abMap = Object.fromEntries(ALL_ABILITY_DEFS.map(a => [a.id, a.name]));
              practiceHintEl.innerHTML = `<span class="practice-hint-label">Suggested abilities:</span> ${preset.abilities.map(id => _abMap[id] || id).join(', ')} &middot; `
                + `<span class="practice-hint-label">Common instruments:</span> ${preset.instruments.join(', ')} `
                + `<span class="page-ref">M20 p. ${preset.page}</span>`;
              practiceHintEl.style.display = '';
            }
            // Update instrument highlighting
            const _instList = $('#instrument-list', content);
            if (_instList) {
              const _suggested = new Set(preset.instruments);
              _instList.querySelectorAll('.instrument-item:not(.instrument-item-custom)').forEach(lbl => {
                const inp = lbl.querySelector('input');
                if (!inp) return;
                const isSugg = _suggested.has(inp.value);
                lbl.classList.toggle('suggested-instrument', isSugg);
                const textSpan = lbl.querySelector('.inst-text');
                let badge = lbl.querySelector('.suggested-badge');
                if (isSugg && !badge && textSpan) {
                  badge = document.createElement('span');
                  badge.className = 'suggested-badge';
                  badge.title = `Suggested from ${preset.name}`;
                  badge.textContent = '✦';
                  textSpan.appendChild(badge);
                } else if (!isSugg && badge) {
                  badge.remove();
                }
              });
            }
            // Update paradigm select with optgroups
            if (paradigmSel) {
              const currentVal = paradigmSel.value;
              paradigmSel.innerHTML = `<option value="">— Choose a common paradigm —</option>`
                + this._buildParadigmOptsHTML(preset.paradigms)
                + `<option value="custom">Custom (write your own)</option>`;
              paradigmSel.value = currentVal; // restore selection if still valid
            }
            if (paradigmNote) {
              paradigmNote.innerHTML = `✦ Suggested paradigms for <em>${preset.name}</em> appear at the top of the list above.`;
              paradigmNote.style.display = '';
            }
          }
        } else if (val === 'custom') {
          c.practice = '';
          practiceInp.value = '';
          practiceInp.focus();
          if (practiceHintEl) { practiceHintEl.innerHTML = ''; practiceHintEl.style.display = 'none'; }
          // Clear instrument highlighting
          const _instListC = $('#instrument-list', content);
          if (_instListC) {
            _instListC.querySelectorAll('.instrument-item').forEach(lbl => {
              lbl.classList.remove('suggested-instrument');
              const badge = lbl.querySelector('.suggested-badge');
              if (badge) badge.remove();
            });
          }
          // Remove optgroups from paradigm select
          if (paradigmSel) {
            const currentVal = paradigmSel.value;
            paradigmSel.innerHTML = `<option value="">— Choose a common paradigm —</option>`
              + this._buildParadigmOptsHTML()
              + `<option value="custom">Custom (write your own)</option>`;
            paradigmSel.value = currentVal;
          }
          if (paradigmNote) { paradigmNote.style.display = 'none'; }
        }
        practiceSelS4.value = ''; // reset dropdown so it acts as a picker
      });
    }

    // Paradigm preset dropdown — fills textarea, updates practice suggestions
    const paradigmArea  = $('#f-paradigm', content);
    const practiceFromParadigmNoteEl = $('#practice-from-paradigm-note', content);
    if (paradigmSel && paradigmArea) {
      paradigmSel.addEventListener('change', () => {
        const val = paradigmSel.value;
        if (val && val !== 'custom') {
          const preset = M20.PARADIGMS.find(p => p.id === val);
          if (preset) {
            c.paradigm = `${preset.desc} (M20 p. ${preset.page})`;
            paradigmArea.value = c.paradigm;
            paradigmArea.focus();
            // Update practice dropdown with suggested practices for this paradigm
            if (practiceSelS4) {
              const suggestedIds = M20.PRACTICES.filter(p => p.paradigms.includes(preset.id)).map(p => p.id);
              practiceSelS4.innerHTML = `<option value="">— Choose a common practice —</option>`
                + this._buildPracticeOptsHTML(suggestedIds)
                + `<option value="custom">Custom (write your own)</option>`;
            }
            if (practiceFromParadigmNoteEl) {
              practiceFromParadigmNoteEl.innerHTML = `✦ Suggested practices for <em>${preset.name}</em> appear at the top of the list above.`;
              practiceFromParadigmNoteEl.style.display = '';
            }
          }
        } else if (val === 'custom') {
          c.paradigm = '';
          paradigmArea.value = '';
          paradigmArea.focus();
          // Reset practice dropdown to flat list
          if (practiceSelS4) {
            practiceSelS4.innerHTML = `<option value="">— Choose a common practice —</option>`
              + this._buildPracticeOptsHTML()
              + `<option value="custom">Custom (write your own)</option>`;
          }
          if (practiceFromParadigmNoteEl) { practiceFromParadigmNoteEl.style.display = 'none'; }
        }
        // Reset dropdown back to blank so it can be used again as a picker
        paradigmSel.value = '';
      });
    }
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
        if (tab.classList.contains('affil-tab-restricted')) {
          toast('That faction is not allowed in this Chronicle.', 'error');
          return;
        }
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
        if (card.classList.contains('tradition-card-restricted')) {
          toast('That faction is not allowed in this Chronicle.', 'error');
          return;
        }
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
        if (trad?.affinitySpheres?.length === 1) c.affinity_sphere = trad.affinitySpheres[0].toLowerCase();
        else c.affinity_sphere = '';
      });
    });

    // Priority drag-and-drop sorters (steps 1 & 2)
    // Chips are draggable; tier labels are static drop targets
    $$('.priority-sorter', content).forEach(sorter => {
      const field = sorter.dataset.field;
      let dragCat = null; // category name being dragged

      sorter.addEventListener('dragstart', e => {
        const chip = e.target.closest('.priority-chip');
        if (!chip) return;
        dragCat = chip.dataset.cat;
        e.dataTransfer.effectAllowed = 'move';
        requestAnimationFrame(() => chip.classList.add('dragging'));
      });

      sorter.addEventListener('dragend', () => {
        $$('.priority-chip', sorter).forEach(el => el.classList.remove('dragging'));
        $$('.priority-dropzone', sorter).forEach(el => el.classList.remove('drag-over'));
        dragCat = null;
      });

      sorter.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const zone = e.target.closest('.priority-dropzone');
        if (!zone) return;
        $$('.priority-dropzone', sorter).forEach(el => el.classList.remove('drag-over'));
        // Only highlight if dropping onto a different zone
        const zoneCat = zone.querySelector('.priority-chip')?.dataset.cat;
        if (zoneCat !== dragCat) zone.classList.add('drag-over');
      });

      sorter.addEventListener('dragleave', e => {
        const zone = e.target.closest('.priority-dropzone');
        if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
      });

      sorter.addEventListener('drop', e => {
        e.preventDefault();
        const zone = e.target.closest('.priority-dropzone');
        if (!zone || !dragCat) return;
        $$('.priority-dropzone', sorter).forEach(el => el.classList.remove('drag-over'));
        const dropCat = zone.querySelector('.priority-chip')?.dataset.cat;
        if (!dropCat || dropCat === dragCat) return;
        // Swap the two categories in the priority array
        const arr = c[field];
        const fromIdx = arr.indexOf(dragCat);
        const toIdx   = arr.indexOf(dropCat);
        if (fromIdx === -1 || toIdx === -1) return;
        [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
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
            const abilDef = ALL_ABILITY_DEFS.find(a => a.id === id);
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
        // Re-lock baselines so bonus accounting reflects the just-changed value
        this._lockBaselines();
        const aff3 = c.affiliation || 'Traditions';
        const chronBgs3 = (c._chronicleRules?.customBackgrounds || []).filter(bg => bg.name)
          .map(bg => ({ id: bg.id, doubleCost: false }));
        const allBgs3 = [...filteredBackgrounds(aff3), ...chronBgs3];
        const lb3live = this._lockedBaselines;
        const rawBgTotal = allBgs3.reduce((s, bg) => s + (c.backgrounds[bg.id] || 0) * (bg.doubleCost ? 2 : 1), 0);
        const bonusBgTotal = allBgs3.reduce((s, bg) => s + (lb3live?.bonusBgs?.[bg.id] || 0), 0);
        const bgUsed = Math.max(0, rawBgTotal - bonusBgTotal);
        const remEl = $('#bg-remaining', content);
        const noteEl = $('#bg-freebie-note', content);
        if (remEl) {
          const rem = M20.CREATION.backgroundDots - bgUsed;
          const over = Math.max(0, -rem);
          remEl.textContent = Math.max(0, rem);
          remEl.style.color = 'var(--gold-bright)';
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

        // Auto-set Arete to match highest sphere (min 1+areteBonus, max 3 at creation)
        const maxSphere = Object.values(c.spheres).reduce((m, v) => Math.max(m, v), 0);
        const oldArete = c.arete || 1;
        const areteBonus = this._lockedBaselines?.areteBonus || 0;
        const newArete = Math.max(1 + areteBonus, Math.min(3, maxSphere));
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

        // Update points display — re-lock first so bonus accounting reflects the just-changed value
        this._lockBaselines();
        const rawSphTotal = Object.values(c.spheres).reduce((s, v) => s + v, 0);
        const lb5live = this._lockedBaselines;
        const bonusSphTotal = M20.SPHERES.reduce((s, sph) => s + (lb5live?.bonusSpheres?.[sph.id] || 0), 0);
        const sphUsed = Math.max(0, rawSphTotal - bonusSphTotal);
        const remEl = $('#sphere-remaining', content);
        const sphNoteEl = $('#sphere-freebie-note', content);
        if (remEl) {
          const rem = M20.CREATION.sphereDots - sphUsed;
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
        c.affinity_sphere = affinitySelect.value.toLowerCase();
        // Auto-add first dot if needed
        if (c.affinity_sphere && !c.spheres[c.affinity_sphere]) {
          const sphereObj = M20.SPHERES.find(s => s.id === c.affinity_sphere);
          if (sphereObj && !c.spheres[sphereObj.id]) c.spheres[sphereObj.id] = 1;
        }
        this.renderStep(); // Re-render to update highlights
      });
    }

    // Core stat dots (step 6) — identified by data-stat attribute
    const areteBonus = this._lockedBaselines?.areteBonus || 0;
    const statMinima = { arete: Math.max(1, 1 + areteBonus), willpower: 1, quintessence: 0, paradox: 0 };
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

    // Instruments — live tally update (no-op if not on step 4)
    const updateInstrumentTally = () => {
      const tally = $('#instrument-tally', content);
      if (!tally) return;
      const count = (c.instruments || []).length;
      const atTarget = count >= 7;
      tally.className = 'instrument-tally' + (atTarget ? ' at-target' : '');
      tally.innerHTML = `<span class="inst-count">${count}</span>`
        + `<span class="inst-label"> selected</span>`
        + `<span class="inst-hint">${atTarget ? ' ✓' : ' (~7 recommended)'}</span>`;
    };

    // Helper: attach listeners to a single instrument label element
    const attachInstrumentItemListeners = (label, inp) => {
      inp.addEventListener('change', () => {
        const instruments = c.instruments || [];
        if (inp.checked) {
          if (!instruments.includes(inp.value)) instruments.push(inp.value);
          c.instruments = instruments;
          label.classList.add('checked');
        } else {
          c.instruments = instruments.filter(i => i !== inp.value);
          if (inp.dataset.custom) {
            label.remove(); // DOM remove — no renderStep(), no scroll jump
          } else {
            label.classList.remove('checked');
          }
        }
        updateInstrumentTally();
      });
    };

    // Instruments — checkboxes (built-in + any already-rendered custom)
    $$('.instrument-item', content).forEach(label => {
      const inp = label.querySelector('input[type="checkbox"]');
      if (inp) attachInstrumentItemListeners(label, inp);
    });

    // Instruments — add custom (DOM append; no renderStep() so no scroll jump)
    const customInstrumentInput = $('#f-custom-instrument', content);
    const instrumentListEl = $('#instrument-list', content);
    const addCustomBtn = $('#btn-add-instrument', content);
    const addCustomInstrument = () => {
      if (!customInstrumentInput) return;
      const val = customInstrumentInput.value.trim();
      if (!val) return;
      if ((c.instruments || []).includes(val)) {
        customInstrumentInput.value = '';
        return;
      }
      c.instruments = [...(c.instruments || []), val];
      // Append new label to DOM directly — avoids full re-render + scroll reset
      if (instrumentListEl) {
        const safeId = 'custom_' + val.replace(/[^a-zA-Z0-9]/g, '_');
        const label = document.createElement('label');
        label.className = 'instrument-item instrument-item-custom checked';
        label.htmlFor = `inst-${safeId}`;
        label.innerHTML = `<input type="checkbox" id="inst-${safeId}" value="${val.replace(/"/g, '&quot;')}" checked data-custom="true" />`
          + val
          + `<button class="instrument-tag-remove" data-instrument="${val.replace(/"/g, '&quot;')}" title="Remove">\u00d7</button>`;
        const inp = label.querySelector('input');
        attachInstrumentItemListeners(label, inp);
        instrumentListEl.appendChild(label);
      }
      customInstrumentInput.value = '';
      customInstrumentInput.focus();
      updateInstrumentTally();
    };
    if (addCustomBtn) addCustomBtn.addEventListener('click', addCustomInstrument);
    if (customInstrumentInput) {
      customInstrumentInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addCustomInstrument(); }
      });
    }

    // Instruments — remove custom tag (× button) — DOM remove, no scroll jump
    content.addEventListener('click', e => {
      const btn = e.target.closest('.instrument-tag-remove');
      if (!btn) return;
      const val = btn.dataset.instrument;
      c.instruments = (c.instruments || []).filter(i => i !== val);
      btn.closest('.instrument-item').remove();
      updateInstrumentTally();
    });

    // ── Resonance listeners (Step 4) ─────────────────────────────
    const resonanceList = $('#resonance-list', content);
    if (resonanceList) {
      // Helper: update a single item's dots + cost tag after a rating change
      const refreshResItem = (idx) => {
        const item = resonanceList.querySelector(`.resonance-item[data-res-idx="${idx}"]`);
        if (!item || !c.resonance?.[idx]) return;
        const res = c.resonance[idx];
        const isFirst = idx === 0;
        const r = res.rating || 1;
        item.querySelectorAll('.dot[data-res-dot]').forEach(dot => {
          const d = parseInt(dot.dataset.resDot);
          const isFreebie = isFirst ? d > 1 : true;
          dot.className = `dot ${d <= r ? 'filled' : ''} ${isFreebie ? 'dot-freebie' : 'dot-free'}`;
        });
        const costTag = item.querySelector('.resonance-cost-tag');
        if (costTag) {
          const freeStart = isFirst ? 1 : 0;
          let cost = 0;
          for (let d = freeStart + 1; d <= r; d++) cost += d * 3;
          costTag.textContent = isFirst && r === 1 ? '1 free dot' : `${cost} freebie${cost !== 1 ? 's' : ''}`;
        }
      };

      // Description input
      resonanceList.addEventListener('input', e => {
        const inp = e.target.closest('.resonance-desc-input');
        if (!inp) return;
        const idx = parseInt(inp.dataset.resIdx);
        if (c.resonance?.[idx] !== undefined) c.resonance[idx].description = inp.value;
      });

      // Flavor select
      resonanceList.addEventListener('change', e => {
        const sel = e.target.closest('.resonance-flavor-select');
        if (!sel) return;
        const idx = parseInt(sel.dataset.resIdx);
        if (!c.resonance?.[idx]) return;
        c.resonance[idx].flavor = sel.value;
        // Update flavor description in DOM
        const item = resonanceList.querySelector(`.resonance-item[data-res-idx="${idx}"]`);
        if (item) {
          let descEl = item.querySelector('.resonance-flavor-desc');
          const fd = sel.value ? (M20.RESONANCE_FLAVORS.find(f => f.id === sel.value)?.desc || '') : '';
          if (fd) {
            if (!descEl) { descEl = document.createElement('div'); descEl.className = 'resonance-flavor-desc'; item.appendChild(descEl); }
            descEl.textContent = fd;
          } else if (descEl) { descEl.remove(); }
        }
        this.updateFreebieDisplay();
      });

      // Dot rating clicks
      resonanceList.addEventListener('click', e => {
        const dot = e.target.closest('.dot[data-res-dot]');
        if (!dot) return;
        const idx = parseInt(dot.dataset.resIdx);
        const val = parseInt(dot.dataset.resDot);
        if (!c.resonance?.[idx]) return;
        const cur = c.resonance[idx].rating || 1;
        c.resonance[idx].rating = cur === val ? Math.max(1, val - 1) : val;
        refreshResItem(idx);
        this.updateFreebieDisplay();
      });

      // Remove resonance button — re-render list (no scroll jump since we target only the list)
      resonanceList.addEventListener('click', e => {
        const btn = e.target.closest('.resonance-remove-btn');
        if (!btn) return;
        const idx = parseInt(btn.dataset.resIdx);
        c.resonance.splice(idx, 1);
        resonanceList.innerHTML = c.resonance.map((r, i) => this._buildResonanceItemHTML(r, i)).join('');
        this.updateFreebieDisplay();
      });
    }

    // Add resonance button
    $('#btn-add-resonance', content)?.addEventListener('click', () => {
      if (!c.resonance) c.resonance = [];
      c.resonance.push({ description: '', flavor: '', rating: 1 });
      if (resonanceList) {
        resonanceList.innerHTML = c.resonance.map((r, i) => this._buildResonanceItemHTML(r, i)).join('');
      }
      this.updateFreebieDisplay();
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
          const areteBonus = this._lockedBaselines?.areteBonus || 0;
          const areteMin = Math.max(c.maxSphere(), 1 + areteBonus);
          if (val < areteMin) {
            App.showToast('Arete must be at least ' + areteMin + ' \u2014 your highest Sphere is ' + c.maxSphere(), 'error');
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
        // Find which category key from the nearest fb-group's data-cat attribute
        const groupEl = row.closest('.fb-group[data-cat]');
        const catKey = groupEl?.dataset?.cat || null;
        if (!catKey) return;
        const cur = char[catKey][id] || 0;
        char[catKey][id] = cur === val ? Math.max(0, val-1) : Math.min(max, val);
        c.refreshFreebieRow(row, char[catKey][id]);
        // Update level description
        const abilDescEl = row.querySelector('.fb-row-desc');
        if (abilDescEl) {
          const abilDef = ALL_ABILITY_DEFS.find(a => a.id === id);
          const newVal  = char[catKey][id];
          abilDescEl.textContent = newVal > 0 && abilDef?.levels ? abilDef.levels[newVal - 1] : (abilDef?.description || '');
        }
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
          const newBgVal = char.backgrounds[id];
          descEl.textContent = bgDef?.levels && newBgVal > 0 ? bgDef.levels[newBgVal - 1] : (bgDef?.description || '');
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
        if (c.calcFreebies().total > c.freebiesPool()) {
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
      const list  = kind === 'merit' ? c.effectiveMerits() : c.effectiveFlaws();

      grid.addEventListener('click', e => {
        // "×" Remove instance button — check first to avoid propagation issues
        const removeBtn = e.target.closest('.mf-remove-btn');
        if (removeBtn) {
          e.stopPropagation();
          const id  = removeBtn.dataset.id;
          const idx = parseInt(removeBtn.dataset.idx);
          if (Array.isArray(store[id])) {
            store[id].splice(idx, 1);
            if (store[id].length === 0) delete store[id];
          }
          // Re-index language labels after removal
          if (id === 'language' && char.merit_labels) {
            const remaining = (store[id] || []).map((_, i) => char.merit_labels['language:' + (i >= idx ? i + 1 : i)] || '');
            Object.keys(char.merit_labels).filter(k => k.startsWith('language:')).forEach(k => delete char.merit_labels[k]);
            remaining.forEach((v, i) => { if (v) char.merit_labels['language:' + i] = v; });
          }
          c.updateFreebieBank();
          return;
        }

        // Cost select — let the change handler deal with it; stop propagation so card click doesn't fire
        if (e.target.closest('.mf-cost-select')) {
          e.stopPropagation();
          return;
        }

        // Helper: resolve numeric cost — reads the top-level cost select (no data-idx)
        // if one is present (variable-cost items), otherwise uses the minimum cost.
        const resolveCardCost = (card, item) => {
          const sel = card.querySelector('.mf-cost-select:not([data-idx])');
          if (sel) return parseInt(sel.value);
          return parseCostOptions(item.cost)[0];
        };

        // "+ Take" / "+ Add Another" button (repeatable)
        const addBtn = e.target.closest('.mf-add-btn');
        if (addBtn) {
          e.stopPropagation();
          const id   = addBtn.dataset.id;
          const item = list.find(i => i.id === id);
          if (!item) return;
          const cost = resolveCardCost(addBtn.closest('.mf-card'), item);
          if (kind === 'merit' && !c.canSpendFreebie(cost)) {
            toast('Not enough freebie points to take ' + item.name + '.', 'error'); return;
          }
          if (kind === 'merit') {
            const cap = c.meritCapRule();
            if (cap !== null && c.calcMeritCost() + cost > cap) {
              toast(`Merit cap reached (max ${cap} pts).`, 'error'); return;
            }
          }
          if (kind === 'flaw') {
            const flawCap = c.flawCapRule();
            if (flawCap !== null && c.calcFlawBonus() + cost > flawCap) {
              toast(`Flaw bonus cap reached (max +${flawCap} pts from flaws).`, 'error'); return;
            }
          }
          if (!Array.isArray(store[id])) store[id] = [];
          store[id].push(cost);
          c.updateFreebieBank();
          return;
        }

        // Card row click — toggle the merit/flaw on or off
        const card = e.target.closest('.mf-card');
        if (!card) return;
        const id   = card.dataset.id;
        const item = list.find(i => i.id === id);
        if (!item) return;
        const cost = resolveCardCost(card, item);

        if (item.repeatable) {
          // Only auto-add the first instance on plain card click; subsequent adds use the + button
          const existing = store[id];
          if (!existing || (Array.isArray(existing) && existing.length === 0)) {
            if (kind === 'merit' && !c.canSpendFreebie(cost)) {
              toast('Not enough freebie points to take ' + item.name + '.', 'error'); return;
            }
            if (kind === 'merit') {
              const cap = c.meritCapRule();
              if (cap !== null && c.calcMeritCost() + cost > cap) {
                toast(`Merit cap reached (max ${cap} pts).`, 'error'); return;
              }
            }
            if (kind === 'flaw') {
              const flawCap = c.flawCapRule();
              if (flawCap !== null && c.calcFlawBonus() + cost > flawCap) {
                toast(`Flaw bonus cap reached (max +${flawCap} pts from flaws).`, 'error'); return;
              }
            }
            store[id] = [cost];
            c.updateFreebieBank();
          }
          return;
        }

        // Non-repeatable toggle
        if (store[id] !== undefined) {
          delete store[id];
        } else {
          if (kind === 'merit' && !c.canSpendFreebie(cost)) {
            toast('Not enough freebie points to take ' + item.name + '.', 'error'); return;
          }
          if (kind === 'merit') {
            const cap = c.meritCapRule();
            if (cap !== null && c.calcMeritCost() + cost > cap) {
              toast(`Merit cap reached (max ${cap} pts).`, 'error'); return;
            }
          }
          if (kind === 'flaw') {
            const flawCap = c.flawCapRule();
            if (flawCap !== null && c.calcFlawBonus() + cost > flawCap) {
              toast(`Flaw bonus cap reached (max +${flawCap} pts from flaws).`, 'error'); return;
            }
          }
          store[id] = cost;
        }
        c.updateFreebieBank();
      });

      // Language name inputs
      grid.addEventListener('input', e => {
        const inp = e.target.closest('.mf-lang-input');
        if (!inp) return;
        if (!char.merit_labels) char.merit_labels = {};
        char.merit_labels['language:' + inp.dataset.idx] = inp.value;
      });

      // Cost selects — only update the store when an item is already active.
      // For inactive variable-cost items the select is a pre-selection only;
      // the actual cost is read from the select at the moment the card is clicked.
      grid.addEventListener('change', e => {
        const sel = e.target.closest('.mf-cost-select');
        if (!sel) return;
        const id      = sel.dataset.id;
        const newCost = parseInt(sel.value);

        if (sel.dataset.idx !== undefined) {
          // ── Repeatable instance cost change ──────────────────────
          const idx = parseInt(sel.dataset.idx);
          if (!Array.isArray(store[id])) return;
          const oldCost = store[id][idx];
          store[id][idx] = newCost;
          if (kind === 'merit' && c.calcFreebies().total > c.freebiesPool()) {
            store[id][idx] = oldCost;
            sel.value = oldCost;
            toast('Not enough freebie points for that option.', 'error');
            return;
          }
          if (kind === 'merit') {
            const cap = c.meritCapRule();
            if (cap !== null && c.calcMeritCost() > cap) {
              store[id][idx] = oldCost;
              sel.value = oldCost;
              toast(`Merit cap reached (max ${cap} pts).`, 'error');
              return;
            }
          }
          c.updateFreebieBank();
        } else if (store[id] !== undefined) {
          // ── Active non-repeatable variable cost change ────────────
          const oldCost = store[id];
          store[id] = newCost;
          if (kind === 'merit' && c.calcFreebies().total > c.freebiesPool()) {
            store[id] = oldCost;
            sel.value = oldCost;
            toast('Not enough freebie points for that option.', 'error');
            return;
          }
          if (kind === 'merit') {
            const cap = c.meritCapRule();
            if (cap !== null && c.calcMeritCost() > cap) {
              store[id] = oldCost;
              sel.value = oldCost;
              toast(`Merit cap reached (max ${cap} pts).`, 'error');
              return;
            }
          }
          c.updateFreebieBank();
        }
        // else: item not yet active — select is just a pre-selection, no store update
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
    const remaining = this.freebiesPool() - total;

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
        // Chronicle custom abilities (treated as primary, 2 pts/dot)
        this.effectiveCustomAbilities(key).filter(a => c[key][a.id] !== undefined).forEach(a => {
          total += Math.max(0, (c[key][a.id]||0) - (lb[a.id]??0)) * 2;
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
    const allBgs = this.effectiveBackgrounds();
    if (this._lockedBaselines) {
      const lb = this._lockedBaselines.backgrounds;
      return Object.entries(c.backgrounds||{}).reduce((total, [id, val]) => {
        const bg = allBgs.find(b => b.id === id);
        const costPer = bg?.doubleCost ? 2 : 1;
        return total + Math.max(0, val - (lb[id]??0)) * costPer;
      }, 0);
    }
    // Fallback: weighted total vs creation pool
    const bgAff = c.affiliation || 'Traditions';
    const customChronBgs = (c._chronicleRules?.customBackgrounds || []).filter(bg => bg.name);
    const allFilteredBgs = [...filteredBackgrounds(bgAff), ...customChronBgs.map(bg => ({ id: bg.id, doubleCost: false }))];
    const weightedTotal = allFilteredBgs.reduce((s, bg) => {
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
    let attrIds;
    if (title.includes('physical')) attrIds = ['strength','dexterity','stamina'];
    else if (title.includes('social')) attrIds = ['charisma','manipulation','appearance'];
    else attrIds = ['perception','intelligence','wits'];

    const pri = c.attr_priority;
    const cat = title.includes('physical') ? 'Physical' : title.includes('social') ? 'Social' : 'Mental';
    const rank = pri.indexOf(cat);
    const total = [7,5,3][rank] || 0;
    // Re-lock baselines now that a trait value has changed, so bonus dot accounting is current
    this._lockBaselines();
    const lb = this._lockedBaselines;
    // Raw used = dots above inherent minimum (1), minus chronicle bonus dots
    const used = attrIds.reduce((s, a) => {
      const raw   = Math.max(0, (c[a] || 1) - 1);
      const bonus = lb?.bonusAttrs?.[a] || 0;
      return s + Math.max(0, raw - bonus);
    }, 0);
    const rem = total - used;
    const over = Math.max(0, -rem);
    header.innerHTML = `<span class="pts">${Math.max(0, rem)}</span> / ${total} pts remaining${over > 0 ? ` <span class="pts-freebie">+${over} via freebies</span>` : ''}`;
  },

  refreshAbilityPoints(block, cat) {
    const header = block.querySelector('.attr-block-points');
    if (!header) return;
    // Re-lock baselines now that a trait value has changed, so bonus dot accounting is current
    this._lockBaselines();
    const c    = this.char;
    const data = cat === 'talents' ? M20.TALENTS : cat === 'skills' ? M20.SKILLS : M20.KNOWLEDGES;
    const sec  = cat === 'talents' ? M20.SECONDARY_TALENTS : cat === 'skills' ? M20.SECONDARY_SKILLS : M20.SECONDARY_KNOWLEDGES;
    const pri  = c.ability_priority;
    const catLabel = cat === 'talents' ? 'Talents' : cat === 'skills' ? 'Skills' : 'Knowledges';
    const rank  = pri.indexOf(catLabel);
    const total = [13,9,5][rank] || 0;
    const lb    = this._lockedBaselines;
    const primaryUsed = data.reduce((s, a) => s + (c[cat][a.id] || 0), 0);
    const secUsed     = sec.filter(a => c[cat][a.id] !== undefined).reduce((s, a) => s + (c[cat][a.id] || 0), 0);
    const custIds     = Object.keys(c.custom_ability_names || {}).filter(id => c[cat][id] !== undefined);
    const custUsed    = custIds.reduce((s, id) => s + (c[cat][id] || 0), 0);
    const chronAbils  = this.effectiveCustomAbilities(cat);
    const chronUsed   = chronAbils.reduce((s, a) => s + (c[cat][a.id] || 0), 0);
    // Subtract chronicle bonus dots so they don't count against the allocation pool
    const allIds = [...data.map(a => a.id), ...sec.filter(a => c[cat][a.id] !== undefined).map(a => a.id), ...custIds, ...chronAbils.map(a => a.id)];
    const bonusUsed = allIds.reduce((s, id) => s + (lb?.bonusAbilities?.[id] || 0), 0);
    const used = Math.max(0, primaryUsed + secUsed + custUsed + chronUsed - bonusUsed);
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
    const cap = this.flawCapRule();
    return cap === null ? raw : Math.min(raw, cap);
  },

  // ── Chronicle rules helpers ───────────────────────────────────────────────
  freebiesPool() {
    return this.char._chronicleRules?.freebiePoints ?? M20.CREATION.freebiePoints;
  },

  flawCapRule() {
    const r = this.char._chronicleRules;
    if (!r || !('flawCap' in r)) return 7;
    return r.flawCap; // null means uncapped
  },

  meritCapRule() {
    return this.char._chronicleRules?.meritCap ?? null;
  },

  _bonusDotDiscount() {
    const rules = this.char._chronicleRules;
    if (!rules?.bonusDots?.length) return 0;
    const COSTS = { attribute: 5, talent: 2, skill: 2, knowledge: 2, any_ability: 2, sphere: 7, focus_sphere: 7, background: 1, arete: 4 };
    return rules.bonusDots.reduce((sum, bd) => sum + (bd.amount || 0) * (COSTS[bd.type] || 1), 0);
  },

  // Returns bonus dots from chronicle rules for a specific trait id/type/name.
  // Used to compute per-trait baseline offsets so the freebie display shows
  // bonus dots as gold (free) rather than purple (freebie cost).
  _bonusDotsForTrait(traitType, traitName) {
    const rules = this.char._chronicleRules;
    if (!rules?.bonusDots?.length) return 0;
    let total = 0;
    for (const bd of rules.bonusDots) {
      const amt = bd.amount || 0;
      if (bd.type === traitType) {
        // Specific name match or wildcard (any in category)
        if (!bd.name || bd.name === traitName) total += amt;
      } else if (bd.type === 'any_ability' && ['talent','skill','knowledge'].includes(traitType)) {
        total += amt;
      } else if (bd.type === 'focus_sphere' && traitType === 'sphere') {
        // Only applies to the character's affinity sphere
        const sphereObj = M20.SPHERES.find(s => s.name === traitName || s.id === traitName);
        if (sphereObj && sphereObj.id === (this.char.affinity_sphere || '').toLowerCase()) total += amt;
      }
    }
    return total;
  },

  effectiveBackgrounds() {
    const customs = (this.char._chronicleRules?.customBackgrounds || [])
      .filter(bg => bg.name)
      .map(bg => ({ id: bg.id, name: bg.name, description: bg.description || '', max: bg.max || 5, doubleCost: false }));
    return [...M20.BACKGROUNDS, ...customs];
  },

  effectiveMerits() {
    const customs = (this.char._chronicleRules?.customMerits || [])
      .filter(m => m.name)
      .map(m => ({ id: m.id, name: m.name, cost: m.cost || 1, category: m.category || 'Social', description: m.description || '', custom: true }));
    return [...M20.MERITS, ...customs];
  },

  effectiveFlaws() {
    const customs = (this.char._chronicleRules?.customFlaws || [])
      .filter(f => f.name)
      .map(f => ({ id: f.id, name: f.name, cost: f.cost || 1, category: f.category || 'Social', description: f.description || '', custom: true }));
    return [...M20.FLAWS, ...customs];
  },

  effectiveCustomAbilities(category) {
    // Returns chronicle-provided custom abilities for the given category (talents/skills/knowledges)
    return (this.char._chronicleRules?.customAbilities || [])
      .filter(a => a.category === category && a.name)
      .map(a => ({ id: a.id, name: a.name }));
  },

  // Build a short human-readable list of chronicle bonus dot rules relevant to a section.
  // sectionType: 'attribute'|'talent'|'skill'|'knowledge'|'any_ability'|'sphere'|'background'|'arete'
  // Returns an array of strings like "+2 to Strength (free)" or "+1 to any Talent (free)"
  _chronicleBonusLines(sectionTypes) {
    const rules = this.char._chronicleRules;
    if (!rules?.bonusDots?.length) return [];
    const types = Array.isArray(sectionTypes) ? sectionTypes : [sectionTypes];
    const lines = [];
    for (const bd of rules.bonusDots) {
      if (!bd.amount) continue;
      let match = false;
      if (bd.type === 'any_ability' && types.some(t => ['talent','skill','knowledge'].includes(t))) match = true;
      else if (types.includes(bd.type)) match = true;
      if (!match) continue;
      let label = '';
      if (bd.type === 'any_ability')   label = `+${bd.amount} to any Ability`;
      else if (bd.type === 'focus_sphere') label = `+${bd.amount} to Focus Sphere`;
      else if (bd.name) label = `+${bd.amount} to ${bd.name}`;
      else {
        const typeLabel = { attribute:'Attribute', talent:'Talent', skill:'Skill', knowledge:'Knowledge', sphere:'Sphere', background:'Background', arete:'Arete' }[bd.type] || bd.type;
        label = `+${bd.amount} to any ${typeLabel}`;
      }
      lines.push(label);
    }
    return lines;
  },

  updateMFDisplay() {
    // Refresh merit card states
    const meritsEl = document.getElementById('fb-merits');
    if (meritsEl) this.renderMFCards(meritsEl, this.effectiveMerits(), this.char.merits, 'merit');
    const flawsEl  = document.getElementById('fb-flaws');
    if (flawsEl)  this.renderMFCards(flawsEl,  this.effectiveFlaws(),  this.char.flaws,  'flaw');
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

    const CATEGORIES = ['Physical', 'Mental', 'Social', 'Supernatural'];

    container.innerHTML = CATEGORIES.map(cat => {
      const items = list.filter(item => item.category === cat);
      if (!items.length) return '';

      // Count how many in this category are currently taken
      const takenCount = items.filter(item => {
        if (item.repeatable) {
          const raw = selected[item.id];
          return Array.isArray(raw) ? raw.length > 0 : raw !== undefined;
        }
        return selected[item.id] !== undefined;
      }).length;
      const countBadge = takenCount > 0
        ? '<span class="mf-cat-count">' + takenCount + ' taken</span>'
        : '';

      const itemsHtml = items.map(item => {
        const costOpts  = parseCostOptions(item.cost);
        const isVar     = costOpts.length > 1;
        const isRepeat  = !!item.repeatable;

        // Resolve active state
        let instances = [], isActive = false;
        if (isRepeat) {
          const raw = selected[item.id];
          instances = Array.isArray(raw) ? raw : (raw !== undefined ? [raw] : []);
          isActive  = instances.length > 0;
        } else {
          isActive = selected[item.id] !== undefined;
        }

        // ── Cost display ──────────────────────────────────────────
        let costDisplay;
        if (isRepeat) {
          if (isActive) {
            const tot = instances.reduce((s, v) => s + v, 0);
            costDisplay = tot + ' pt' + (tot !== 1 ? 's' : '');
          } else if (isVar) {
            costDisplay = '<select class="mf-cost-select" data-id="' + item.id + '">'
              + costOpts.map(v => '<option value="' + v + '">' + v + ' pt' + (v !== 1 ? 's' : '') + '</option>').join('')
              + '</select>';
          } else {
            costDisplay = costOpts[0] + ' pt' + (costOpts[0] !== 1 ? 's' : '') + ' ea';
          }
        } else if (isVar) {
          // Always show a select — when active it also updates the stored cost on change
          const selVal = isActive ? selected[item.id] : costOpts[0];
          costDisplay = '<select class="mf-cost-select" data-id="' + item.id + '">'
            + costOpts.map(v => '<option value="' + v + '"' + (v === selVal ? ' selected' : '') + '>' + v + ' pt' + (v !== 1 ? 's' : '') + '</option>').join('')
            + '</select>';
        } else {
          const cv = isActive ? selected[item.id] : costOpts[0];
          costDisplay = cv + ' pt' + (cv !== 1 ? 's' : '');
        }

        // ── Page reference (inline, muted) ────────────────────────
        const pageRef = '<span class="mf-card-page-inline">'
          + (typeof item.page === 'string' ? item.page : 'p.\u202f' + item.page)
          + '</span>';

        // ── Info-tip ? badge ─────────────────────────────────────
        const safeDesc = (item.description || '').replace(/"/g, '&quot;');
        const infoTip  = '<span class="info-tip mf-info-tip" data-tip="' + safeDesc + '">?</span>';

        // ── Instance rows (repeatable) ────────────────────────────
        let instancesHtml = '';
        if (isRepeat && isActive) {
          const isLanguage = item.id === 'language';
          const labels = isLanguage ? (this.char.merit_labels || {}) : {};
          instancesHtml = '<div class="mf-instances">'
            + instances.map((instCost, idx) => {
              const costEl = isVar
                ? '<select class="mf-cost-select" data-id="' + item.id + '" data-idx="' + idx + '">'
                  + costOpts.map(v => '<option value="' + v + '"' + (v === instCost ? ' selected' : '') + '>' + v + ' pt</option>').join('')
                  + '</select>'
                : '<span class="mf-instance-cost">' + instCost + ' pt' + (instCost !== 1 ? 's' : '') + '</span>';
              const langInput = isLanguage
                ? '<input class="mf-lang-input" type="text" placeholder="Language name…"'
                  + ' data-id="' + item.id + '" data-idx="' + idx + '"'
                  + ' value="' + ((labels['language:' + idx] || '')).replace(/"/g, '&quot;') + '"'
                  + ' maxlength="40" />'
                : '';
              return '<div class="mf-instance">'
                + '<span class="mf-instance-label">#' + (idx + 1) + '</span>'
                + costEl + langInput
                + '<button class="mf-remove-btn" data-id="' + item.id + '" data-idx="' + idx + '" title="Remove">×</button>'
                + '</div>';
            }).join('')
            + '</div>';
        }

        // ── Add button (repeatable) ───────────────────────────────
        const addBtnHtml = isRepeat
          ? '<button class="mf-add-btn" data-id="' + item.id + '">'
            + (isActive ? '+ Add Another' : '+ Take') + '</button>'
          : '';

        return '<div class="mf-card'
          + (isActive  ? ' mf-active'     : '')
          + (isRepeat  ? ' mf-repeatable' : '')
          + ' mf-cat-' + cat.toLowerCase()
          + '" data-id="' + item.id + '" data-kind="' + kind + '" data-desc="' + safeDesc + '">'
          + '<div class="mf-card-top">'
          + '<span class="mf-card-name">' + item.name + ' ' + infoTip + ' ' + pageRef + '</span>'
          + '<span class="mf-card-cost">' + costDisplay + '</span>'
          + '</div>'
          + instancesHtml + addBtnHtml
          + '</div>';
      }).join('');

      return '<details class="mf-cat-details">'
        + '<summary class="mf-cat-summary">'
        + cat + ' ' + countBadge
        + '<span class="fb-details-hint">' + items.length + ' available</span>'
        + '</summary>'
        + '<div class="mf-cat-body">' + itemsHtml + '</div>'
        + '</details>';
    }).join('');
  },

  maxSphere() {
    return Object.values(this.char.spheres || {}).reduce((m, v) => Math.max(m, v), 0);
  },

  updateAreteNotice() {
    const el = document.getElementById('arete-sphere-notice');
    if (!el) return;
    const areteBonus = this._lockedBaselines?.areteBonus || 0;
    const min = Math.max(this.maxSphere(), 1 + areteBonus);
    if (min <= 1) { el.innerHTML = ''; el.className = 'arete-sphere-notice'; return; }
    const { total } = this.calcFreebies();
    const remaining = this.freebiesPool() - total;
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

/* ═══════════════════════════════════════════════════════════════
   FREE EDIT MODE
   ═══════════════════════════════════════════════════════════════ */
const FreeEdit = {
  char: null,       // deep-copy being edited
  _chronicleId: null,

  // Entry point — pass already-fetched char object
  open(char) {
    this.char = JSON.parse(JSON.stringify(char));
    this._chronicleId = char.chronicle_id || null;
    App.showPage('free-edit');
    this._renderToolbar();
    this._render();
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  _dots(val, max, field, subkey) {
    const dataAttrs = subkey
      ? `data-fe-field="${field}" data-fe-sub="${subkey}"`
      : `data-fe-field="${field}"`;
    return `<span class="dots fe-dots" ${dataAttrs}>${
      Array.from({length: max}, (_, i) => {
        const v = i + 1;
        return `<span class="dot${v <= val ? ' filled' : ''}" data-val="${v}"></span>`;
      }).join('')
    }</span>`;
  },

  _input(field, value, placeholder = '') {
    return `<input class="fe-input" type="text" data-fe-field="${field}" value="${escHtml(value || '')}" placeholder="${placeholder}">`;
  },

  _textarea(field, value, rows = 4) {
    return `<textarea class="fe-textarea" data-fe-field="${field}" rows="${rows}">${escHtml(value || '')}</textarea>`;
  },

  _number(field, value, min = 0, max = 20) {
    return `<input class="fe-number" type="number" data-fe-field="${field}" value="${value || 0}" min="${min}" max="${max}">`;
  },

  // ── Toolbar ───────────────────────────────────────────────────────────────
  _renderToolbar() {
    const tb = $('#free-edit-toolbar');
    if (!tb) return;
    const isChronicle = !!this._chronicleId;
    const saveLabel = isChronicle ? '📨 Submit for Approval' : '✓ Save Changes';
    tb.innerHTML = `
      <div class="fe-toolbar-left">
        <button class="btn-ghost" id="fe-back-btn">← Back to Sheet</button>
        <span class="fe-toolbar-title">${escHtml(this.char.name || 'Character')}</span>
      </div>
      <div class="fe-toolbar-right">
        <button class="btn-ghost" id="fe-cancel-btn">Cancel</button>
        <button class="btn-primary" id="fe-save-btn">${saveLabel}</button>
      </div>`;
    $('#fe-back-btn').addEventListener('click', () => this._cancel());
    $('#fe-cancel-btn').addEventListener('click', () => this._cancel());
    $('#fe-save-btn').addEventListener('click', () => this._save());
  },

  // ── Main render ───────────────────────────────────────────────────────────
  _render() {
    const c = this.char;
    const el = $('#free-edit-content');
    if (!el) return;
    const isChronicle = !!this._chronicleId;

    // Attribute row helper
    const attrRow = (name, id) => {
      const val = c[id] || 1;
      return `<div class="fe-trait-row">
        <span class="fe-trait-label">${name}</span>
        ${this._dots(val, 5, id)}
      </div>`;
    };

    // Ability row helper
    const abilRow = (name, id, catKey, max = 5, badgeHtml = '') => {
      const val = (c[catKey] || {})[id] || 0;
      return `<div class="fe-trait-row">
        <span class="fe-trait-label">${name}${badgeHtml}</span>
        ${this._dots(val, max, catKey, id)}
      </div>`;
    };

    // Background row helper
    const bgRow = (name, id, max = 5) => {
      const val = (c.backgrounds || {})[id] || 0;
      return `<div class="fe-trait-row">
        <span class="fe-trait-label">${name}</span>
        ${this._dots(val, max, 'backgrounds', id)}
      </div>`;
    };

    // Sphere row helper
    const sphRow = (name, id) => {
      const val = (c.spheres || {})[id] || 0;
      const isAff = id === (c.affinity_sphere || '').toLowerCase();
      return `<div class="fe-trait-row${isAff ? ' fe-affinity-row' : ''}">
        <span class="fe-trait-label${isAff ? ' fe-affinity-label' : ''}">${isAff ? '✦ ' : ''}${name}</span>
        ${this._dots(val, 5, 'spheres', id)}
      </div>`;
    };

    // Secondary badge
    const secBadge = `<span class="fe-secondary-badge">Secondary</span>`;
    const custBadge = `<span class="fe-secondary-badge">Custom</span>`;

    // Abilities - build per column
    const buildAbilColumn = (key, primaryList, secondaryList) => {
      const primRows = primaryList.map(a => abilRow(a.name, a.id, key)).join('');
      const addedSec = secondaryList.filter(a => (c[key] || {})[a.id] !== undefined);
      const secRows  = addedSec.map(a => abilRow(a.name, a.id, key, 3, secBadge)).join('');
      const custIds  = Object.keys(c.custom_ability_names || {}).filter(id => (c[key] || {})[id] !== undefined);
      const custRows = custIds.map(id => abilRow(c.custom_ability_names[id] || id, id, key, 3, custBadge)).join('');
      const chronAbils = (c._chronicleRules?.customAbilities || []).filter(a => a.category === key && a.name);
      const chronRows = chronAbils.map(a => abilRow(a.name, a.id, key, 5,
        `<span class="fe-secondary-badge">Chronicle</span>`)).join('');
      return primRows + secRows + custRows + chronRows;
    };

    // Backgrounds — show all from M20 plus any chronicle custom ones, show zero-valued collapsed notice
    const bgAff = c.affiliation || 'Traditions';
    const allBgs = M20.BACKGROUNDS.filter(b => !b.factionOnly || !b.factionOnly.length || b.factionOnly.includes(bgAff));
    const chronBgs = (c._chronicleRules?.customBackgrounds || []).filter(b => b.name);
    const bgRows = [...allBgs, ...chronBgs.map(b => ({ id: b.id, name: b.name, max: b.max || 5 }))].map(bg => bgRow(bg.name || bg.id, bg.id, bg.max || 5)).join('');

    el.innerHTML = `
    ${isChronicle ? `<div class="fe-chronicle-notice">✏️ This character is in a Chronicle — changes will go to the Storyteller for approval before taking effect.</div>` : ''}

    <!-- Identity -->
    <div class="fe-section">
      <div class="fe-section-title">Identity</div>
      <div class="fe-grid-2">
        <div class="fe-field"><label>Name</label>${this._input('name', c.name, 'Character name')}</div>
        <div class="fe-field"><label>Player</label>${this._input('player', c.player, 'Player name')}</div>
        <div class="fe-field"><label>Concept</label>${this._input('concept', c.concept, 'Character concept')}</div>
        <div class="fe-field"><label>Chronicle</label>${this._input('chronicle', c.chronicle, 'Chronicle name')}</div>
        <div class="fe-field"><label>Nature</label>${this._input('nature', c.nature, 'Nature archetype')}</div>
        <div class="fe-field"><label>Demeanor</label>${this._input('demeanor', c.demeanor, 'Demeanor archetype')}</div>
        <div class="fe-field"><label>Affiliation</label>${this._input('affiliation', c.affiliation, 'Traditions / Technocracy / Disparates')}</div>
        <div class="fe-field"><label>Tradition / Convention</label>${this._input('tradition', c.tradition, 'Tradition or Convention')}</div>
        <div class="fe-field"><label>Faction / Order</label>${this._input('faction', c.faction, 'Faction or order')}</div>
        <div class="fe-field"><label>Essence</label>${this._input('essence', c.essence, 'Dynamic / Pattern / Primordial / Questing')}</div>
        <div class="fe-field"><label>Paradigm</label>${this._input('paradigm', c.paradigm, 'Paradigm')}</div>
        <div class="fe-field"><label>Practice</label>${this._input('practice', c.practice, 'Practice')}</div>
        <div class="fe-field"><label>Affinity Sphere</label>${this._input('affinity_sphere', c.affinity_sphere, 'e.g. life, mind, forces')}</div>
      </div>
    </div>

    <!-- Attributes -->
    <div class="fe-section">
      <div class="fe-section-title">Attributes</div>
      <div class="fe-grid-3">
        <div>
          <div class="fe-group-label">Physical</div>
          ${attrRow('Strength','strength')}${attrRow('Dexterity','dexterity')}${attrRow('Stamina','stamina')}
        </div>
        <div>
          <div class="fe-group-label">Social</div>
          ${attrRow('Charisma','charisma')}${attrRow('Manipulation','manipulation')}${attrRow('Appearance','appearance')}
        </div>
        <div>
          <div class="fe-group-label">Mental</div>
          ${attrRow('Perception','perception')}${attrRow('Intelligence','intelligence')}${attrRow('Wits','wits')}
        </div>
      </div>
    </div>

    <!-- Abilities -->
    <div class="fe-section">
      <div class="fe-section-title">Abilities</div>
      <div class="fe-grid-3">
        <div>
          <div class="fe-group-label">Talents</div>
          ${buildAbilColumn('talents', M20.TALENTS, M20.SECONDARY_TALENTS)}
        </div>
        <div>
          <div class="fe-group-label">Skills</div>
          ${buildAbilColumn('skills', M20.SKILLS, M20.SECONDARY_SKILLS)}
        </div>
        <div>
          <div class="fe-group-label">Knowledges</div>
          ${buildAbilColumn('knowledges', M20.KNOWLEDGES, M20.SECONDARY_KNOWLEDGES)}
        </div>
      </div>
    </div>

    <!-- Backgrounds -->
    <div class="fe-section">
      <div class="fe-section-title">Backgrounds</div>
      <div class="fe-grid-2">
        <div>${allBgs.filter((_, i) => i % 2 === 0).map(bg => bgRow(bg.name || bgDisplayName(bg, bgAff), bg.id, bg.max || 5)).join('')}
          ${chronBgs.filter((_, i) => i % 2 === 0).map(bg => bgRow(bg.name, bg.id, bg.max || 5)).join('')}
        </div>
        <div>${allBgs.filter((_, i) => i % 2 === 1).map(bg => bgRow(bg.name || bgDisplayName(bg, bgAff), bg.id, bg.max || 5)).join('')}
          ${chronBgs.filter((_, i) => i % 2 === 1).map(bg => bgRow(bg.name, bg.id, bg.max || 5)).join('')}
        </div>
      </div>
    </div>

    <!-- Spheres -->
    <div class="fe-section">
      <div class="fe-section-title">Spheres</div>
      <div class="fe-grid-3">
        <div>${['correspondence','entropy','forces'].map(id => sphRow(M20.SPHERES.find(s=>s.id===id)?.name||id, id)).join('')}</div>
        <div>${['life','matter','mind'].map(id => sphRow(M20.SPHERES.find(s=>s.id===id)?.name||id, id)).join('')}</div>
        <div>${['prime','spirit','time'].map(id => sphRow(M20.SPHERES.find(s=>s.id===id)?.name||id, id)).join('')}</div>
      </div>
    </div>

    <!-- Core Stats -->
    <div class="fe-section">
      <div class="fe-section-title">Core Stats</div>
      <div class="fe-stat-grid">
        <div class="fe-trait-row"><span class="fe-trait-label">Arete</span>${this._dots(c.arete||1, 10, 'arete')}</div>
        <div class="fe-trait-row"><span class="fe-trait-label">Willpower</span>${this._dots(c.willpower||5, 10, 'willpower')}</div>
        <div class="fe-trait-row"><span class="fe-trait-label">Quintessence</span>${this._number('quintessence', c.quintessence||0, 0, 20)}</div>
        <div class="fe-trait-row"><span class="fe-trait-label">Paradox</span>${this._number('paradox', c.paradox||0, 0, 20)}</div>
      </div>
    </div>

    <!-- Description & Notes -->
    <div class="fe-section">
      <div class="fe-section-title">Description & Notes</div>
      <div class="fe-field" style="margin-bottom:0.75rem">
        <label>Description</label>
        ${this._textarea('description', c.description, 5)}
      </div>
      <div class="fe-field">
        <label>Notes</label>
        ${this._textarea('notes', c.notes, 3)}
      </div>
    </div>

    ${isChronicle ? `
    <!-- Reason for changes -->
    <div class="fe-section">
      <div class="fe-section-title">Reason for Changes</div>
      <div class="fe-reason-label">Explain why these changes are needed — your Storyteller will see this note.</div>
      <textarea id="fe-reason" class="fe-textarea" rows="3" placeholder="Describe what's changing and why…"></textarea>
    </div>` : ''}

    <!-- Bottom actions -->
    <div class="fe-actions">
      <button class="btn-ghost" id="fe-cancel-btn-bottom">Cancel</button>
      <button class="btn-primary" id="fe-save-btn-bottom">
        ${isChronicle ? '📨 Submit for Storyteller Approval' : '✓ Save Changes'}
      </button>
    </div>`;

    this._attachListeners();
  },

  // ── Event listeners ────────────────────────────────────────────────────────
  _attachListeners() {
    const el = $('#free-edit-content');
    if (!el) return;
    const c = this.char;

    // Dot clicks (event delegation)
    el.addEventListener('click', e => {
      const dot = e.target.closest('.dot');
      if (!dot || !dot.closest('.fe-dots')) return;
      const dotsEl = dot.closest('.fe-dots');
      const field  = dotsEl.dataset.feField;
      const subkey = dotsEl.dataset.feSub || null;
      const val    = parseInt(dot.dataset.val);
      const max    = dotsEl.querySelectorAll('.dot').length;
      if (!field) return;

      if (subkey) {
        if (!c[field]) c[field] = {};
        const cur = c[field][subkey] || 0;
        c[field][subkey] = cur === val ? Math.max(0, val - 1) : Math.min(max, val);
        this._refreshDots(dotsEl, c[field][subkey]);
      } else {
        const cur    = c[field] || 0;
        const minVal = ['arete','willpower'].includes(field) ? 1 : 0;
        c[field] = cur === val ? Math.max(minVal, val - 1) : Math.min(max, val);
        this._refreshDots(dotsEl, c[field]);
      }
    });

    // Text inputs
    el.addEventListener('input', e => {
      const inp = e.target;
      if (inp.classList.contains('fe-input') && inp.dataset.feField) {
        c[inp.dataset.feField] = inp.value;
      }
      if (inp.classList.contains('fe-textarea') && inp.dataset.feField) {
        c[inp.dataset.feField] = inp.value;
      }
      if (inp.classList.contains('fe-number') && inp.dataset.feField) {
        c[inp.dataset.feField] = parseInt(inp.value) || 0;
      }
    });

    // Bottom buttons
    $('#fe-cancel-btn-bottom')?.addEventListener('click', () => this._cancel());
    $('#fe-save-btn-bottom')?.addEventListener('click', () => this._save());
  },

  _refreshDots(dotsEl, val) {
    dotsEl.querySelectorAll('.dot').forEach(d => {
      d.classList.toggle('filled', parseInt(d.dataset.val) <= val);
    });
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  _cancel() {
    App.viewCharacter(App.currentCharId);
  },

  // ── Save / Submit ──────────────────────────────────────────────────────────
  async _save() {
    const saveBtn  = $('#fe-save-btn');
    const saveBtn2 = $('#fe-save-btn-bottom');
    [saveBtn, saveBtn2].forEach(b => { if (b) b.disabled = true; });

    const reason = ($('#fe-reason')?.value || '').trim();
    try {
      const res = await fetch(`/api/characters/${this.char.id}/edit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposed: this.char, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      if (data.applied) {
        toast('Character saved successfully.');
      } else {
        toast('Changes submitted — awaiting Storyteller approval.');
      }
      App.viewCharacter(App.currentCharId);
    } catch (err) {
      toast(err.message || 'Save failed', 'error');
      [saveBtn, saveBtn2].forEach(b => { if (b) b.disabled = false; });
    }
  },

  // ── ST: approve/reject a pending edit ─────────────────────────────────────
  async stApprove(editId, chronicleId) {
    try {
      const r = await fetch(`/api/chronicles/${chronicleId}/pending-edits/${editId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Failed');
      toast('Character edits approved and applied.');
      // Re-load the character sheet
      App.viewMemberCharacter(chronicleId, Sheet.char?.id || App.currentCharId);
    } catch (err) { toast(err.message, 'error'); }
  },

  async stReject(editId, chronicleId) {
    App.showModal('Reject Character Edits', `
      <p style="margin-bottom:0.75rem;color:var(--text-mid)">Optionally provide a reason for the player:</p>
      <textarea id="modal-reject-note" class="fe-textarea" rows="3" placeholder="Reason for rejection…"></textarea>`,
      async () => {
        const note = $('#modal-reject-note')?.value || '';
        try {
          const r = await fetch(`/api/chronicles/${chronicleId}/pending-edits/${editId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject', reviewer_note: note }),
          });
          if (!r.ok) throw new Error((await r.json()).error || 'Failed');
          toast('Character edits rejected.');
          App.closeModal();
          App.viewMemberCharacter(chronicleId, Sheet.char?.id || App.currentCharId);
        } catch (err) { toast(err.message, 'error'); }
      },
      'Reject Edits'
    );
  },
};

/* ═══════════════════════════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════════════════════════ */
const Settings = {

  async show() {
    App.showPage('settings');
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    $('#settings-content').innerHTML = `<div class="chronicle-loading">Loading…</div>`;
    try {
      const r = await fetch('/api/settings');
      if (!r.ok) throw new Error();
      const data = await r.json();
      $('#settings-content').innerHTML = this._html(data);
      this._attachListeners(data);
    } catch {
      $('#settings-content').innerHTML = `<p class="error-msg">Failed to load settings.</p>`;
    }
  },

  _html(data) {
    // Build timezone options from the browser's built-in IANA list
    const allTz = (typeof Intl.supportedValuesOf === 'function')
      ? Intl.supportedValuesOf('timeZone')
      : ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
         'America/Vancouver','America/Toronto','Europe/London','Europe/Paris','Europe/Berlin',
         'Europe/Amsterdam','Asia/Tokyo','Asia/Shanghai','Asia/Kolkata','Australia/Sydney'];
    const tzOptions = allTz.map(tz =>
      `<option value="${tz}"${tz === (data.timezone || 'UTC') ? ' selected' : ''}>${tz.replace(/_/g,' ')}</option>`
    ).join('');

    return `
      <div class="settings-page">
        <h2 class="section-title">Settings</h2>

        <!-- Account Overview -->
        <div class="settings-section">
          <h3 class="settings-section-title">Account Overview</h3>
          <div class="settings-stats">
            <div class="settings-stat">
              <span class="settings-stat-value">${data.character_count}</span>
              <span class="settings-stat-label">Characters</span>
            </div>
            <div class="settings-stat">
              <span class="settings-stat-value">${data.chronicle_count}</span>
              <span class="settings-stat-label">Chronicles</span>
            </div>
          </div>
          <p class="settings-hint" style="margin-top:0.75rem">
            Signed in as <strong style="color:var(--text-mid)">${escHtml(data.username)}</strong>
            &nbsp;·&nbsp; ${escHtml(data.email)}
          </p>
        </div>

        <!-- Timezone -->
        <div class="settings-section">
          <h3 class="settings-section-title">Timezone</h3>
          <p class="settings-hint">Used to display session dates and times in your local timezone.</p>
          <div class="settings-row">
            <select id="settings-timezone" class="form-input settings-tz-select">${tzOptions}</select>
            <button class="btn-primary" id="btn-save-timezone">Save</button>
          </div>
        </div>

        <!-- Change Password -->
        <div class="settings-section">
          <h3 class="settings-section-title">Change Password</h3>
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" id="settings-current-pw" class="form-input" autocomplete="current-password" />
            </div>
            <div class="form-group">
              <label class="form-label">New Password <span class="form-hint">(min 6 characters)</span></label>
              <input type="password" id="settings-new-pw" class="form-input" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input type="password" id="settings-confirm-pw" class="form-input" autocomplete="new-password" />
            </div>
            <button class="btn-primary" id="btn-save-password">Update Password</button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section settings-danger-zone">
          <h3 class="settings-section-title settings-danger-title">Danger Zone</h3>
          <p class="settings-hint">Permanently deletes your account, all characters, all chronicles, and all notes. This cannot be undone.</p>
          <button class="btn-danger" id="btn-delete-account">Delete My Account</button>
        </div>
      </div>`;
  },

  _attachListeners(data) {
    // ── Save timezone ────────────────────────────────────────────────────────
    $('#btn-save-timezone')?.addEventListener('click', async () => {
      const tz = $('#settings-timezone')?.value;
      try {
        const r = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: tz }),
        });
        if (!r.ok) throw new Error();
        // Update in-memory user so formatDate/formatDateTime pick up the new tz immediately
        if (App.currentUser) App.currentUser.timezone = tz;
        toast('Timezone saved.');
      } catch { toast('Failed to save timezone.', 'error'); }
    });

    // ── Change password ──────────────────────────────────────────────────────
    $('#btn-save-password')?.addEventListener('click', async () => {
      const current = $('#settings-current-pw')?.value;
      const next    = $('#settings-new-pw')?.value;
      const confirm = $('#settings-confirm-pw')?.value;
      if (!current || !next || !confirm) { toast('Please fill in all password fields.', 'error'); return; }
      if (next !== confirm) { toast('New passwords do not match.', 'error'); return; }
      if (next.length < 6)  { toast('New password must be at least 6 characters.', 'error'); return; }
      const btn = $('#btn-save-password');
      if (btn) btn.disabled = true;
      try {
        const r = await fetch('/api/settings/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: current, new_password: next }),
        });
        const json = await r.json();
        if (!r.ok) { toast(json.error || 'Failed to update password.', 'error'); return; }
        toast('Password updated successfully.');
        ['settings-current-pw','settings-new-pw','settings-confirm-pw'].forEach(id => {
          const el = $(`#${id}`);
          if (el) el.value = '';
        });
      } catch { toast('Failed to update password.', 'error'); }
      finally { if (btn) btn.disabled = false; }
    });

    // ── Delete account ───────────────────────────────────────────────────────
    $('#btn-delete-account')?.addEventListener('click', () => {
      const username = App.currentUser?.username || '';
      $('#modal-title').textContent = 'Delete Account';
      $('#modal-body').innerHTML = `
        <p>Permanently delete <strong style="color:var(--gold-mid)">${escHtml(username)}</strong>?</p>
        <ul style="margin:0.6rem 0 0.6rem 1.2rem;font-size:0.88rem;color:var(--text-dim);line-height:1.8">
          <li>All characters you own</li>
          <li>All chronicles you own and their notes</li>
          <li>Your account credentials</li>
        </ul>
        <p style="font-size:0.85rem;color:var(--text-dim)">This cannot be undone.</p>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">
          Type <strong style="color:var(--text-mid)">${escHtml(username)}</strong> to confirm:
        </p>
        <input type="text" id="modal-delete-account-input" class="form-input"
               placeholder="${escHtml(username)}" style="margin-top:0.5rem" autocomplete="off" />`;
      const confirmBtn = $('#modal-confirm');
      confirmBtn.textContent = 'Delete My Account';
      confirmBtn.disabled = true;
      setTimeout(() => {
        $('#modal-delete-account-input')?.addEventListener('input', e => {
          confirmBtn.disabled = e.target.value !== username;
        });
      }, 0);
      confirmBtn.onclick = async () => {
        try {
          confirmBtn.disabled = true;
          const r = await fetch('/api/settings', { method: 'DELETE' });
          if (!r.ok) throw new Error();
          App.closeModal();
          toast('Your account has been deleted.');
          await App.logout();
        } catch {
          toast('Failed to delete account.', 'error');
          confirmBtn.disabled = false;
        }
      };
      $('#modal-overlay').style.display = 'flex';
    });
  },
};

/* ─── Advancement ────────────────────────────────────────────── */
const Advancement = {
  char: null,

  show(char) {
    this.char = JSON.parse(JSON.stringify(char)); // deep copy
    App.showPage('advancement');
    this._render();
    document.getElementById('btn-adv-back')?.addEventListener('click', () => {
      App.viewCharacter(this.char.id);
    });
  },

  _xpEarned()    { return this.char.xp_earned || 0; },
  _xpSpent()     {
    const log = Array.isArray(this.char.xp_log) ? this.char.xp_log : [];
    return log.filter(e => e.type === 'spend').reduce((s, e) => s + (e.cost || 0), 0);
  },
  _xpRemaining() { return this._xpEarned() - this._xpSpent(); },

  _effectiveAllowBgXp() {
    if (this.char.chronicle_id) return !!this.char.chronicle_allow_bg_xp;
    return this.char.allow_bg_xp !== 0;
  },

  _hasUnsubmittedSpends() {
    const log = Array.isArray(this.char.xp_log) ? this.char.xp_log : [];
    return log.some(e => e.type === 'spend' && !e.submitted && !e.finalized);
  },

  _render() {
    const char      = this.char;
    const remaining = this._xpRemaining();
    const earned    = this._xpEarned();
    const spent     = this._xpSpent();
    const allowBg   = this._effectiveAllowBgXp();

    const bgControlHTML = char.chronicle_id
      ? `<p class="adv-info-note">Background XP spending is <strong>${allowBg ? 'enabled' : 'disabled'}</strong> by the Chronicle Storyteller.</p>`
      : `<label class="adv-toggle-label">
           <input type="checkbox" id="adv-bg-toggle" ${allowBg ? 'checked' : ''}>
           Allow spending XP on Backgrounds
         </label>`;

    $('#advancement-content').innerHTML = `
      <div class="adv-page">

        <!-- ── Left: floating history panel ── -->
        <div class="adv-history-panel">
          <div class="adv-panel-title">XP History</div>
          <div class="adv-log-scrollable" id="adv-log-list">
            ${this._logEntriesHTML(char)}
          </div>
          <div class="adv-panel-footer">
            ${char.chronicle_id
              ? `<button class="btn-primary adv-finalize-btn" id="btn-submit-xp"
                   ${this._hasUnsubmittedSpends() ? '' : 'disabled'}>Submit to Storyteller</button>`
              : `<button class="btn-primary adv-finalize-btn" id="btn-finalize-xp"
                   ${this._hasUnsubmittedSpends() ? '' : 'disabled'}>Finalize</button>`
            }
          </div>
        </div>

        <!-- ── Right: main trait content ── -->
        <div class="adv-main-content">
          <div class="adv-header">
            <div>
              <div class="adv-char-name">${escHtml(char.name)}</div>
              <div class="adv-xp-detail">${earned} earned &nbsp;·&nbsp; ${spent} spent</div>
            </div>
            <div class="adv-xp-balance-wrap">
              <span class="adv-xp-num${remaining < 0 ? ' adv-xp-negative' : ''}">${remaining}</span>
              <span class="adv-xp-label">XP Remaining</span>
            </div>
            <button class="btn-primary" id="btn-award-xp">+ Award XP</button>
          </div>

          ${this._attrSection(char, remaining)}
          ${this._abilSection(char, remaining)}

          <div class="adv-section adv-bg-outer" id="adv-bg-outer">
            <h3 class="adv-section-title">Backgrounds</h3>
            <div class="adv-bg-control">${bgControlHTML}</div>
            <div id="adv-bg-rows">${this._bgRows(char, remaining, allowBg)}</div>
          </div>

          ${this._sphereSection(char, remaining)}
          ${this._otherSection(char, remaining)}
        </div>

      </div>`;

    this._attachListeners();
  },

  // ── Log entries HTML (history panel) ────────────────────────────────────────
  _logEntriesHTML(char) {
    const log = Array.isArray(char.xp_log) ? char.xp_log : [];
    if (log.length === 0) {
      return `<p class="adv-no-history">No XP history yet.<br>Award XP to begin.</p>`;
    }
    return [...log].reverse().map((e, revIdx) => {
      const idx = log.length - 1 - revIdx; // actual index in forward array
      const d   = e.date ? new Date(e.date).toLocaleDateString() : '';

      if (e.type === 'award') {
        return `<div class="adv-log-entry adv-log-award">
          <div class="adv-log-main">
            <span class="adv-log-date">${d}</span>
            <span class="adv-log-desc">+${e.amount} XP${e.note ? `<em class="adv-log-note"> — ${escHtml(e.note)}</em>` : ''}</span>
          </div>
        </div>`;
      }
      if (e.type === 'spend') {
        const fin       = !!e.finalized;
        const submitted = !!e.submitted && !fin;
        let stateHTML;
        if (fin) {
          stateHTML = `<span class="adv-finalized-mark" title="Approved / Finalized">✓</span>`;
        } else if (submitted) {
          stateHTML = `<span class="adv-submitted-mark" title="Awaiting Storyteller review">Pending Review</span>`;
        } else {
          stateHTML = `<button class="adv-undo-btn" data-log-idx="${idx}">Undo</button>`;
        }
        return `<div class="adv-log-entry adv-log-spend${fin ? ' adv-log-finalized' : ''}${submitted ? ' adv-log-submitted' : ''}">
          <div class="adv-log-main">
            <span class="adv-log-date">${d}</span>
            <span class="adv-log-desc">${escHtml(e.trait_label || e.trait_key)}
              <span class="adv-log-arrow">${e.from}→${e.to}</span>
              <strong class="adv-log-cost">−${e.cost}</strong>
            </span>
          </div>
          ${stateHTML}
        </div>`;
      }
      if (e.type === 'rejection') {
        return `<div class="adv-log-entry adv-log-rejection">
          <div class="adv-log-main">
            <span class="adv-log-date">${d}</span>
            <span class="adv-log-desc adv-log-rejection-label">
              ✕ Rejected: ${escHtml(e.trait_label || e.trait_key)}
              <span class="adv-log-arrow">${e.from}→${e.to}</span>
              <strong class="adv-log-cost adv-log-refund">+${e.cost} refunded</strong>
            </span>
          </div>
          ${e.reason ? `<span class="adv-rejection-reason">"${escHtml(e.reason)}"</span>` : ''}
        </div>`;
      }
      return '';
    }).join('');
  },

  // ── Row builder ─────────────────────────────────────────────────────────────
  _advRow(traitGroup, traitCol, traitKey, traitLabel, currentVal, maxVal, xpRemaining, isAffinitySphere = false) {
    const cost    = xpCost(traitGroup, currentVal, isAffinitySphere);
    const atMax   = currentVal >= maxVal;
    const canAfford = !atMax && cost != null && xpRemaining >= cost;

    const dotCount = Math.min(maxVal, 10);
    const dotSpans = Array.from({length: dotCount}, (_, i) =>
      `<span class="dot ${i < currentVal ? 'filled' : ''} readonly"></span>`
    ).join('');

    const costLabel = atMax
      ? `<span class="adv-at-max">Max</span>`
      : cost == null ? ''
      : `<span class="adv-cost${canAfford ? '' : ' adv-unaffordable'}">${cost} XP</span>`;

    const btn = (atMax || cost == null) ? '' :
      `<button class="btn-sm adv-raise-btn"
        data-group="${traitGroup}" data-col="${traitCol || ''}"
        data-key="${escHtml(traitKey)}" data-label="${escHtml(traitLabel.replace(/<[^>]+>/g,''))}"
        data-from="${currentVal}" data-to="${currentVal + 1}" data-cost="${cost}"
        ${canAfford ? '' : 'disabled'}>Raise</button>`;

    return `<div class="adv-trait-row">
      <span class="adv-trait-name">${traitLabel}</span>
      <span class="dots readonly">${dotSpans}</span>
      ${costLabel}
      ${btn}
    </div>`;
  },

  // ── Sections ─────────────────────────────────────────────────────────────────
  _attrSection(char, rem) {
    const groups = [
      { label:'Physical', keys:[['strength','Strength'],['dexterity','Dexterity'],['stamina','Stamina']] },
      { label:'Social',   keys:[['charisma','Charisma'],['manipulation','Manipulation'],['appearance','Appearance']] },
      { label:'Mental',   keys:[['perception','Perception'],['intelligence','Intelligence'],['wits','Wits']] },
    ];
    const rows = groups.map(g => `
      <div class="adv-group-label">${g.label}</div>
      ${g.keys.map(([k,l]) => this._advRow('attribute', null, k, l, char[k] || 1, 5, rem)).join('')}
    `).join('');
    return `<div class="adv-section"><h3 class="adv-section-title">Attributes</h3>${rows}</div>`;
  },

  _abilSection(char, rem) {
    const groups = [
      { label:'Talents',    col:'talents',    data:M20.TALENTS,    sec:M20.SECONDARY_TALENTS },
      { label:'Skills',     col:'skills',     data:M20.SKILLS,     sec:M20.SECONDARY_SKILLS },
      { label:'Knowledges', col:'knowledges', data:M20.KNOWLEDGES, sec:M20.SECONDARY_KNOWLEDGES },
    ];
    const customNames = char.custom_ability_names || {};
    const rows = groups.map(g => {
      const dict = char[g.col] || {};
      const prim = g.data.map(a =>
        this._advRow('ability', g.col, a.id, a.name, dict[a.id] || 0, 5, rem)
      ).join('');
      const sec = g.sec.filter(a => dict[a.id] !== undefined).map(a =>
        this._advRow('ability', g.col, a.id, `${a.name} <em class="adv-sec-tag">sec</em>`, dict[a.id] || 0, 5, rem)
      ).join('');
      const cust = Object.keys(customNames).filter(id => dict[id] !== undefined).map(id =>
        this._advRow('ability', g.col, id, customNames[id] || id, dict[id] || 0, 5, rem)
      ).join('');
      return `<div class="adv-group-label">${g.label}</div>${prim}${sec}${cust}`;
    }).join('');
    return `<div class="adv-section"><h3 class="adv-section-title">Abilities</h3>${rows}</div>`;
  },

  _bgRows(char, rem, allowBg) {
    if (!allowBg) return `<p class="adv-info-note">Background XP spending is currently disabled.</p>`;
    const bgs  = filteredBackgrounds(char.affiliation || 'Traditions');
    const dict = char.backgrounds || {};
    return bgs.map(bg => {
      const val  = dict[bg.id] || 0;
      const name = bgDisplayName(bg, char.affiliation);
      return this._advRow('background', 'backgrounds', bg.id, name, val, 5, rem);
    }).join('');
  },

  _sphereSection(char, rem) {
    const affinityId = char.affinity_sphere || '';
    const spheres    = char.spheres || {};
    const rows = M20.SPHERES.map(s => {
      const val   = spheres[s.id] || 0;
      const isAff = s.id === affinityId;
      const label = `${s.name}${isAff ? ' <span class="adv-affinity-badge">✦ Affinity</span>' : ''}`;
      return this._advRow('sphere', 'spheres', s.id, label, val, 5, rem, isAff);
    }).join('');
    return `<div class="adv-section"><h3 class="adv-section-title">Spheres</h3>${rows}</div>`;
  },

  _otherSection(char, rem) {
    const areteRow = this._advRow('arete', null, 'arete', 'Arete', char.arete || 1, 10, rem);
    const wpRow    = this._advRow('willpower', null, 'willpower', 'Willpower', char.willpower || 5, 10, rem);

    const resonances = Array.isArray(char.resonance) ? char.resonance : [];
    const resRows = resonances.map((r, idx) => {
      if (!r.description) return '';
      const label = escHtml(r.description) + (r.flavor ? ` <em>(${escHtml(r.flavor)})</em>` : '');
      return this._advRow('resonance', null, String(idx), label, r.rating || 1, 5, rem);
    }).join('');

    return `<div class="adv-section">
      <h3 class="adv-section-title">Other Traits</h3>
      <div class="adv-group-label">Arete &amp; Willpower</div>
      ${areteRow}${wpRow}
      ${resRows ? `<div class="adv-group-label">Resonance</div>${resRows}` : ''}
    </div>`;
  },

  // ── Listeners ────────────────────────────────────────────────────────────────
  _attachListeners() {
    $('#btn-award-xp')?.addEventListener('click', () => this._showAwardModal());
    $('#btn-finalize-xp')?.addEventListener('click', () => this._finalize());
    $('#btn-submit-xp')?.addEventListener('click', () => this._submitToST());

    // Undo buttons inside the history panel
    document.querySelectorAll('.adv-undo-btn').forEach(btn => {
      btn.addEventListener('click', () => this._undoSpend(parseInt(btn.dataset.logIdx)));
    });

    // Background XP toggle (only for non-chronicle characters)
    if (!this.char.chronicle_id) {
      $('#adv-bg-toggle')?.addEventListener('change', async (e) => {
        const allow = e.target.checked ? 1 : 0;
        try {
          await fetch(`/api/characters/${this.char.id}`, {
            method: 'PUT', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ allow_bg_xp: allow }),
          });
          this.char.allow_bg_xp = allow;
          const bgRows = $('#adv-bg-rows');
          if (bgRows) {
            bgRows.innerHTML = this._bgRows(this.char, this._xpRemaining(), !!allow);
            this._attachRaiseBtns();
          }
        } catch { toast('Failed to save setting.', 'error'); }
      });
    }

    this._attachRaiseBtns();
  },

  _attachRaiseBtns() {
    document.querySelectorAll('.adv-raise-btn:not([disabled])').forEach(btn => {
      btn.removeEventListener('click', btn._advHandler);
      btn._advHandler = () => this._spendXP(btn.dataset);
      btn.addEventListener('click', btn._advHandler);
    });
  },

  _showAwardModal() {
    $('#modal-title').textContent = 'Award XP';
    $('#modal-body').innerHTML = `
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:1rem">
        Add experience points to <strong>${escHtml(this.char.name)}</strong>'s pool.
      </p>
      <div class="form-group" style="margin-bottom:0.75rem">
        <label class="form-label">XP Amount</label>
        <input type="number" id="award-xp-amount" class="form-input" min="1" max="999" value="5"
               style="width:140px" />
      </div>
      <div class="form-group">
        <label class="form-label">Note <span class="form-hint">(optional)</span></label>
        <input type="text" id="award-xp-note" class="form-input"
               placeholder="Session 3, end-of-arc bonus…" />
      </div>`;
    const confirmBtn = $('#modal-confirm');
    confirmBtn.textContent = 'Award XP';
    confirmBtn.disabled = false;
    confirmBtn.onclick = () => this._confirmAward();
    $('#modal-overlay').style.display = 'flex';
    setTimeout(() => $('#award-xp-amount')?.select(), 50);
  },

  async _confirmAward() {
    const amount = parseInt($('#award-xp-amount')?.value || 0);
    const note   = ($('#award-xp-note')?.value || '').trim();
    if (!amount || amount < 1) { toast('Enter a valid XP amount.', 'error'); return; }
    App.closeModal();
    try {
      const r = await fetch(`/api/characters/${this.char.id}/xp/award`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ amount, note }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Failed');
      const data = await r.json();
      this.char.xp_earned = data.xp_earned;
      this.char.xp_log    = data.xp_log;
      toast(`+${amount} XP awarded!`);
      this._render();
    } catch (e) { toast(e.message || 'Failed to award XP.', 'error'); }
  },

  async _spendXP(dataset) {
    const { group, col, key, label, from: f, to: t, cost: c } = dataset;
    const fromVal = parseInt(f);
    const toVal   = parseInt(t);
    const cost    = parseInt(c);
    const remaining = this._xpRemaining();
    if (cost > remaining) {
      toast(`Not enough XP (need ${cost}, have ${remaining}).`, 'error'); return;
    }
    try {
      const r = await fetch(`/api/characters/${this.char.id}/xp/spend`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          trait_group: group, trait_col: col || null,
          trait_key: key, trait_label: label,
          from: fromVal, to: toVal, cost,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast(err.error || 'Failed to spend XP.', 'error'); return;
      }
      const data = await r.json();
      this.char.xp_log = data.xp_log;
      this._applyTraitUpdate(group, col || null, key, toVal);
      toast(`${label.replace(/<[^>]+>/g,'')} raised to ${toVal} (−${cost} XP).`);
      this._render();
    } catch { toast('Failed to spend XP.', 'error'); }
  },

  async _undoSpend(logIdx) {
    try {
      const r = await fetch(`/api/characters/${this.char.id}/xp/${logIdx}`, { method: 'DELETE' });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast(err.error || 'Failed to undo.', 'error'); return;
      }
      // Re-fetch fresh character so trait values are accurate after revert
      const char = await fetch(`/api/characters/${this.char.id}`).then(r => r.json());
      this.char = char;
      toast('XP expenditure undone.');
      this._render();
    } catch { toast('Failed to undo.', 'error'); }
  },

  async _submitToST() {
    if (!this._hasUnsubmittedSpends()) return;
    $('#modal-title').textContent = 'Submit to Storyteller';
    $('#modal-body').innerHTML = `
      <p style="color:var(--text-dim);font-size:0.9rem">
        Submit all pending XP spends for <strong>${escHtml(this.char.name)}</strong> to the Storyteller for review?
        You won't be able to undo them while they are under review.
      </p>`;
    const confirmBtn = $('#modal-confirm');
    confirmBtn.textContent = 'Submit';
    confirmBtn.disabled = false;
    confirmBtn.onclick = async () => {
      App.closeModal();
      try {
        const r = await fetch(`/api/characters/${this.char.id}/xp/submit`, { method: 'POST' });
        if (!r.ok) throw new Error();
        const data = await r.json();
        this.char.xp_log = data.xp_log;
        toast(`${data.submitted_count} XP ${data.submitted_count === 1 ? 'spend' : 'spends'} submitted for review.`);
        this._render();
      } catch { toast('Failed to submit.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
  },

  async _finalize() {
    if (!this._hasUnsubmittedSpends()) return;
    $('#modal-title').textContent = 'Finalize XP Expenditures';
    $('#modal-body').innerHTML = `
      <p style="color:var(--text-dim);font-size:0.9rem">
        Finalize all pending XP spends for <strong>${escHtml(this.char.name)}</strong>?
        Finalized entries cannot be undone.
      </p>`;
    const confirmBtn = $('#modal-confirm');
    confirmBtn.textContent = 'Finalize';
    confirmBtn.disabled = false;
    confirmBtn.onclick = async () => {
      App.closeModal();
      try {
        const r = await fetch(`/api/characters/${this.char.id}/xp/finalize`, { method: 'POST' });
        if (!r.ok) throw new Error();
        const data = await r.json();
        this.char.xp_log = data.xp_log;
        toast(`${data.finalized_count} XP ${data.finalized_count === 1 ? 'spend' : 'spends'} finalized.`);
        this._render();
      } catch { toast('Failed to finalize.', 'error'); }
    };
    $('#modal-overlay').style.display = 'flex';
  },

  _applyTraitUpdate(group, col, key, newVal) {
    if (group === 'attribute' || group === 'arete' || group === 'willpower') {
      this.char[key] = newVal;
    } else if (col && ['talents','skills','knowledges','backgrounds','spheres'].includes(col)) {
      if (!this.char[col]) this.char[col] = {};
      this.char[col][key] = newVal;
    } else if (group === 'resonance') {
      const idx = parseInt(key);
      if (Array.isArray(this.char.resonance) && this.char.resonance[idx]) {
        this.char.resonance[idx].rating = newVal;
      }
    }
  },
};

/* ─── Bootstrap ──────────────────────────────────────────────── */
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-hamburger-wrap')) App.closeHamburger();
});

window.addEventListener('DOMContentLoaded', async () => {
  // Randomise title sphere sigils
  const _allSpheres = ['Correspondence','Entropy','Forces','Life','Matter','Mind','Prime','Spirit','Time'];
  const _pick = _allSpheres.sort(() => Math.random() - 0.5);
  const _sigilL = document.getElementById('title-sigil-left');
  const _sigilR = document.getElementById('title-sigil-right');
  const _setMask = (el, name) => {
    if (!el) return;
    el.style.webkitMaskImage = `url('/images/Sphere${name}.webp')`;
    el.style.maskImage        = `url('/images/Sphere${name}.webp')`;
  };
  _setMask(_sigilL, _pick[0]);
  _setMask(_sigilR, _pick[1]);

  // Sync theme button icon with whatever the FOUC-prevention script applied
  App._updateThemeBtn(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  // ── Keep --nav-h CSS variable in sync with the actual header height ───────────
  // Sticky elements inside the page use top: var(--nav-h) to clear the header.
  const _updateNavH = () => {
    const h = document.getElementById('app-header')?.offsetHeight || 72;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  };
  _updateNavH();
  window.addEventListener('resize', _updateNavH);

  // ── Register persistent UI listeners first, before any async routing ─────────
  // (Must happen unconditionally so they're available even when the user later
  //  navigates from a shared-sheet URL into the main app within the same SPA session.)

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
      } else if (state.page === 'grimoire') {
        App.showGrimoire();
      } else if (state.page === 'free-edit' && state.charId) {
        await App.editCharacter(state.charId);
      } else if (state.page === 'shared' && state.token) {
        await App.loadSharedSheet(state.token);
      }
    } finally {
      App._popping = false;
    }
  });

  // ── URL-based routing (async — runs after listeners are registered) ───────────

  // If a shared sheet URL (/s/:token), load in shared mode (no login required)
  const shareMatch = window.location.pathname.match(/^\/s\/([a-f0-9]{32})$/);
  if (shareMatch) {
    await App.loadSharedSheet(shareMatch[1]);
    return;
  }

  // If a password reset token is in the URL, show the reset form immediately
  if (new URLSearchParams(window.location.search).get('token')) {
    App.showPage('auth');
    Auth.showReset();
    return;
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
});
