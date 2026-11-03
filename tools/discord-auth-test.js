const Module = require('module'); const path = require('path'); const { DatabaseSync } = require('node:sqlite');
const root = process.argv[2];
class Shim { constructor(f) { this.d = new DatabaseSync(f); }
  prepare(sql) { const st = this.d.prepare(sql); return { get: (...a) => st.get(...a), all: (...a) => st.all(...a), run: (...a) => st.run(...a) }; }
  exec(s) { this.d.exec(s); } pragma() {} transaction(fn) { return (...a) => fn(...a); } }
const orig = Module._load; Module._load = function (req, ...r) { return req === 'better-sqlite3' ? Shim : orig.call(this, req, ...r); };
process.env.DATA_DIR = require('os').tmpdir() + '/disc-' + Date.now(); require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
process.env.APP_URL = 'https://m20.example';
const express = require(path.join(root, 'node_modules/express')); const session = require(path.join(root, 'node_modules/express-session'));
// stub Discord
let profile = { id: '111', username: 'dave', global_name: 'Dave', email: 'dave@x.co', verified: true, avatar: 'abc' };
let tokenOk = true; const realFetch = global.fetch;
global.fetch = async (u, o) => { if (String(u).startsWith('https://discord.com/api/oauth2/token')) return tokenOk ? { ok: true, json: async () => ({ access_token: 't', token_type: 'Bearer' }) } : { ok: false, status: 400 };
  if (String(u).startsWith('https://discord.com/api/users/@me')) return { ok: true, json: async () => profile }; return realFetch(u, o); };
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
const db = require(path.join(root, 'server/db.js'));
const app = express(); app.use(express.json()); app.use(session({ secret: 's', resave: false, saveUninitialized: false }));
app.use('/api/auth', require(path.join(root, 'server/routes/discord.js'))); app.use('/api/auth', require(path.join(root, 'server/routes/auth.js')));
app.use('/api/settings', (q, s, n) => q.session.userId ? n() : s.status(401).json({}), require(path.join(root, 'server/routes/settings.js')));
class Client { constructor(base) { this.base = base; this.jar = {}; }
  async req(m, u, b) { const r = await realFetch(this.base + u, { method: m, redirect: 'manual', headers: { 'Content-Type': 'application/json', cookie: Object.entries(this.jar).map(([k, v]) => k + '=' + v).join('; ') }, body: b ? JSON.stringify(b) : undefined });
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, v] = kv.split('='); this.jar[k] = v; }
    return { s: r.status, loc: r.headers.get('location'), b: await r.json().catch(() => ({})) }; }
  // full Discord round trip: start → (Discord) → callback
  async oauth(mode, extra = '') { const a = await this.req('GET', `/api/auth/discord/start?mode=${mode}${extra}`); if (!/discord\.com\/api\/oauth2\/authorize/.test(a.loc || '')) return a;
    const state = new URL(a.loc).searchParams.get('state'); return this.req('GET', `/api/auth/discord/callback?code=c1&state=${state}`); } }
const srv = app.listen(0, async () => {
  const base = 'http://localhost:' + srv.address().port; let r;
  r = await new Client(base).req('GET', '/api/auth/providers'); ok(r.b.discord === false, 'providers off without credentials');
  r = await new Client(base).req('GET', '/api/auth/discord/start?mode=login'); ok(r.loc === '/?discord=not_configured', 'start redirects with not_configured');
  process.env.DISCORD_CLIENT_ID = 'cid'; process.env.DISCORD_CLIENT_SECRET = 'sec';
  r = await new Client(base).req('GET', '/api/auth/providers'); ok(r.b.discord === true, 'providers on');
  let c = new Client(base);
  const st = await c.req('GET', '/api/auth/discord/start?mode=login'); const u = new URL(st.loc);
  ok(u.searchParams.get('client_id') === 'cid' && u.searchParams.get('scope') === 'identify email' && u.searchParams.get('redirect_uri') === 'https://m20.example/api/auth/discord/callback', 'authorize URL: client, scope, redirect uri');
  r = await c.req('GET', `/api/auth/discord/callback?code=c1&state=wrong`); ok(r.loc === '/?discord=expired', 'bad state rejected');
  r = await new Client(base).req('GET', '/api/auth/discord/callback?code=c1&state=x'); ok(r.loc === '/?discord=expired', 'no session state rejected');
  r = await new Client(base).oauth('login'); ok(r.loc === '/?discord=not_linked', 'login with unknown Discord: not_linked');
  c = new Client(base); r = await c.oauth('register'); ok(r.loc === '/', 'register creates account and signs in');
  r = await c.req('GET', '/api/auth/me'); ok(r.s === 200 && r.b.username === 'Dave' && r.b.email === 'dave@x.co' && r.b.discord_linked === 1, 'me: username from global_name, verified email, linked');
  let row = db.prepare(`SELECT * FROM users WHERE discord_id = '111'`).get(); ok(row.has_password === 0 && row.discord_avatar === 'abc', 'has_password 0, avatar cached');
  r = await new Client(base).req('POST', '/api/auth/login', { username: 'Dave', password: 'anything' }); ok(r.s === 401, 'password login impossible for Discord-only account');
  c = new Client(base); r = await c.oauth('login', '&stay=1'); ok(r.loc === '/', 'login with linked Discord'); r = await c.req('GET', '/api/auth/me'); ok(r.s === 200, 'session works after Discord login');
  ok(db.prepare(`SELECT login_count FROM users WHERE discord_id='111'`).get().login_count === 2, 'login_count incremented (register + login)');
  // register again with same Discord = just sign in, no duplicate
  c = new Client(base); await c.oauth('register'); ok(db.prepare(`SELECT COUNT(*) n FROM users WHERE discord_id='111'`).get().n === 1, 'register twice does not duplicate');
  // username collision + email collision
  profile = { id: '222', username: 'dave', global_name: 'Dave', email: 'other@x.co', verified: true, avatar: null };
  c = new Client(base); await c.oauth('register'); r = await c.req('GET', '/api/auth/me'); ok(r.b.username === 'Dave2', 'username collision gets suffix: ' + r.b.username);
  profile = { id: '333', username: 'x', global_name: null, email: 'dave@x.co', verified: true };
  r = await new Client(base).oauth('register'); ok(r.loc === '/?discord=email_taken', 'verified email already used: email_taken (no takeover)');
  profile = { id: '444', username: 'unver', email: 'unver@x.co', verified: false };
  c = new Client(base); await c.oauth('register'); r = await c.req('GET', '/api/auth/me'); ok(r.b.email === 'discord_444@discord.local', 'unverified email not trusted: ' + r.b.email);
  // link flow
  const bcrypt = require(path.join(root, 'node_modules/bcryptjs'));
  db.prepare(`INSERT INTO users (username,email,password_hash) VALUES ('pw','pw@x.co',?)`).run(bcrypt.hashSync('secret1', 4));
  c = new Client(base); await c.req('POST', '/api/auth/login', { username: 'pw', password: 'secret1' });
  profile = { id: '555', username: 'pwdiscord', global_name: 'PW', email: 'pw@x.co', verified: true, avatar: 'z' };
  r = await c.oauth('link'); ok(r.loc === '/?discord=linked', 'signed-in user links Discord');
  r = await c.req('GET', '/api/settings'); ok(r.b.discord_linked === true && r.b.discord_username === 'PW' && r.b.has_password === 1 && r.b.discord_available === true, 'settings shows linked state');
  r = await c.req('DELETE', '/api/settings/discord'); ok(r.s === 200, 'unlink allowed with a password');
  r = await c.oauth('link'); r = await c.req('GET', '/api/settings'); ok(r.b.discord_linked === true, 're-link');
  const c2 = new Client(base); db.prepare(`INSERT INTO users (username,email,password_hash) VALUES ('pw2','pw2@x.co',?)`).run(bcrypt.hashSync('secret2', 4));
  await c2.req('POST', '/api/auth/login', { username: 'pw2', password: 'secret2' }); r = await c2.oauth('link'); ok(r.loc === '/?discord=already_linked', 'cannot link a Discord already used by someone else');
  r = await new Client(base).req('GET', '/api/auth/discord/start?mode=link'); ok(r.loc === '/?discord=need_signin', 'link needs sign-in');
  const g = new Client(base); await g.req('POST', '/api/auth/guest'); r = await g.req('GET', '/api/auth/discord/start?mode=link'); ok(r.loc === '/?discord=guest', 'guests cannot link');
  // Discord-only account: cannot unlink until a password is set
  profile = { id: '444', username: 'unver', email: 'unver@x.co', verified: false };
  c = new Client(base); await c.oauth('login');
  r = await c.req('DELETE', '/api/settings/discord'); ok(r.s === 400 && /password/i.test(r.b.error), 'unlink blocked without a password');
  r = await c.req('PUT', '/api/settings/password', { new_password: 'abc' }); ok(r.s === 400, 'short password rejected');
  r = await c.req('PUT', '/api/settings/password', { new_password: 'newsecret' }); ok(r.s === 200, 'set password without current one');
  r = await c.req('DELETE', '/api/settings/discord'); ok(r.s === 200, 'unlink works after setting a password');
  r = await new Client(base).req('POST', '/api/auth/login', { username: 'unver', password: 'newsecret' }); ok(r.s === 200, 'password login now works');
  r = await c.req('PUT', '/api/settings/password', { new_password: 'x12345' }); ok(r.s === 400, 'changing an existing password still needs the current one');
  // disabled + denied + token failure
  db.prepare(`UPDATE users SET is_active = 0 WHERE discord_id = '111'`).run(); profile = { id: '111', username: 'dave' };
  r = await new Client(base).oauth('login'); ok(r.loc === '/?discord=disabled', 'disabled account refused');
  c = new Client(base); const s2 = await c.req('GET', '/api/auth/discord/start?mode=login'); r = await c.req('GET', '/api/auth/discord/callback?error=access_denied&state=' + new URL(s2.loc).searchParams.get('state')); ok(r.loc === '/?discord=denied', 'user cancelled → denied');
  tokenOk = false; r = await new Client(base).oauth('login'); ok(r.loc === '/?discord=failed', 'token exchange failure → failed');
  srv.close(); process.exit(0);
});
