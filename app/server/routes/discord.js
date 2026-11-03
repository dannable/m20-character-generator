'use strict';
// Sign in with Discord (OAuth2 authorization-code flow, scopes: identify email).
//   GET /api/auth/providers            which sign-in providers are configured
//   GET /api/auth/discord/start        ?mode=login|register|link  → redirects to Discord
//   GET /api/auth/discord/callback     Discord sends the user back here
// Configure with DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET and (optionally) DISCORD_REDIRECT_URI.
const express = require('express');
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const rateLimit = require('../rateLimit');
const router  = express.Router();

const API = 'https://discord.com/api';
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 40, message: 'Too many Discord attempts, please wait a few minutes.' });
const MODES = new Set(['login', 'register', 'link']);

const cfg = () => ({
  id: process.env.DISCORD_CLIENT_ID || '',
  secret: process.env.DISCORD_CLIENT_SECRET || '',
});
const configured = () => { const c = cfg(); return !!(c.id && c.secret); };
function redirectUri(req) {
  if (process.env.DISCORD_REDIRECT_URI) return process.env.DISCORD_REDIRECT_URI;
  const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/+$/, '')}/api/auth/discord/callback`;
}

// Messages the front end shows after a redirect back to /?discord=<code>
const MESSAGES = {
  linked:        'Discord linked to your account.',
  not_linked:    'No account is linked to that Discord user. Register with Discord, or sign in and link it from Settings.',
  email_taken:   'An account with your Discord email already exists. Sign in with your password, then link Discord from Settings.',
  already_linked:'That Discord account is already linked to a different user.',
  disabled:      'This account has been disabled.',
  need_signin:   'Sign in first, then link Discord from Settings.',
  guest:         'Guests cannot link Discord. Create an account first.',
  denied:        'Discord sign-in was cancelled.',
  expired:       'That Discord sign-in expired. Please try again.',
  failed:        'Discord sign-in failed. Please try again.',
  not_configured:'Discord sign-in is not set up on this server.',
};

router.get('/providers', (req, res) => res.json({ discord: configured() }));

router.get('/discord/start', limiter, (req, res) => {
  if (!configured()) return res.redirect('/?discord=not_configured');
  const mode = MODES.has(req.query.mode) ? req.query.mode : 'login';
  if (mode === 'link') {
    if (!req.session.userId) return res.redirect('/?discord=need_signin');
    if (req.session.isGuest || req.session.role === 'guest') return res.redirect('/?discord=guest');
  }
  const state = crypto.randomBytes(24).toString('hex');
  req.session.discordOAuth = { state, mode, stay: req.query.stay === '1', at: Date.now() };
  req.session.save(err => {
    if (err) return res.redirect('/?discord=failed');
    const q = new URLSearchParams({
      client_id: cfg().id, redirect_uri: redirectUri(req), response_type: 'code',
      scope: 'identify email', state, prompt: 'consent',
    });
    res.redirect(`${API}/oauth2/authorize?${q}`);
  });
});

async function discordProfile(code, req) {
  const body = new URLSearchParams({
    client_id: cfg().id, client_secret: cfg().secret, grant_type: 'authorization_code',
    code, redirect_uri: redirectUri(req),
  });
  const tr = await fetch(`${API}/oauth2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!tr.ok) throw new Error('token ' + tr.status);
  const tok = await tr.json();
  const ur = await fetch(`${API}/users/@me`, { headers: { Authorization: `${tok.token_type || 'Bearer'} ${tok.access_token}` } });
  if (!ur.ok) throw new Error('user ' + ur.status);
  return ur.json();
}

function cleanUsername(p) {
  let u = String(p.global_name || p.username || '').replace(/[^\w .'\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32);
  if (u.length < 2) u = `discord_${String(p.id).slice(-4)}`;
  return u;
}
function uniqueUsername(base) {
  const taken = n => db.prepare(`SELECT 1 FROM users WHERE username = ? COLLATE NOCASE`).get(n);
  let name = base, i = 1;
  while (taken(name)) { i += 1; name = `${base.slice(0, 28)}${i}`; if (i > 999) name = `${base.slice(0, 20)}${crypto.randomBytes(3).toString('hex')}`; }
  return name;
}

function signIn(req, res, user, stay, to) {
  req.session.regenerate(err => {
    if (err) return res.redirect('/?discord=failed');
    req.session.userId = user.id;
    req.session.role = user.role;
    if (stay) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; else req.session.cookie.expires = false;
    db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?`).run(user.id);
    res.redirect(to || '/');
  });
}

router.get('/discord/callback', limiter, async (req, res) => {
  const o = req.session.discordOAuth;
  delete req.session.discordOAuth;
  const back = code => res.redirect(`/?discord=${code}`);
  if (req.query.error) return back('denied');
  if (!o || !req.query.state || req.query.state !== o.state || Date.now() - o.at > 10 * 60 * 1000) return back('expired');
  if (!req.query.code) return back('failed');

  let p;
  try { p = await discordProfile(String(req.query.code), req); }
  catch (e) { console.error('Discord OAuth error:', e.message); return back('failed'); }
  if (!p || !p.id) return back('failed');
  const did = String(p.id);
  const existing = db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get(did);

  try {
    // Keep the cached display fields fresh whenever a linked user comes through.
    const refresh = u => db.prepare(`UPDATE users SET discord_username = ?, discord_avatar = ? WHERE id = ?`).run(p.global_name || p.username || '', p.avatar || null, u.id);

    if (o.mode === 'link') {
      const uid = req.session.userId;
      const me = uid && db.prepare(`SELECT id, role FROM users WHERE id = ?`).get(uid);
      if (!me) return back('need_signin');
      if (me.role === 'guest') return back('guest');
      if (existing && existing.id !== me.id) return back('already_linked');
      db.prepare(`UPDATE users SET discord_id = ?, discord_username = ?, discord_avatar = ?, discord_linked_at = COALESCE(discord_linked_at, CURRENT_TIMESTAMP) WHERE id = ?`)
        .run(did, p.global_name || p.username || '', p.avatar || null, me.id);
      return back('linked');
    }

    if (existing) {
      if (!existing.is_active) return back('disabled');
      refresh(existing);
      return signIn(req, res, existing, o.stay);
    }
    if (o.mode === 'login') return back('not_linked');

    // register: create the account
    let email = (p.verified && p.email) ? String(p.email).trim().toLowerCase() : '';
    if (email && db.prepare(`SELECT 1 FROM users WHERE email = ?`).get(email)) return back('email_taken');
    if (!email) email = `discord_${did}@discord.local`;
    const username = uniqueUsername(cleanUsername(p));
    const hash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);   // unusable until the user sets a password
    const r = db.prepare(`INSERT INTO users (username, email, password_hash, has_password, discord_id, discord_username, discord_avatar, discord_linked_at, last_login, login_count)
                          VALUES (?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)`)
      .run(username, email, hash, did, p.global_name || p.username || '', p.avatar || null);
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(r.lastInsertRowid);
    return signIn(req, res, user, o.stay);
  } catch (e) {
    console.error('Discord callback error:', e);
    return back('failed');
  }
});

module.exports = router;
module.exports.MESSAGES = MESSAGES;
