// Server test for session mode Phase 3 (Discord posting and linking), against a fake Discord API.
// Usage: node tools/discord-test.js <app dir>
const Module = require('module'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(process.argv[2]);
class Shim { constructor(f) { this.d = new DatabaseSync(f); }
  prepare(sql) { const st = this.d.prepare(sql); return { get: (...a) => st.get(...a), all: (...a) => st.all(...a), run: (...a) => st.run(...a) }; }
  exec(s) { this.d.exec(s); } pragma(s) { try { this.d.exec('PRAGMA ' + s); } catch {} }
  transaction(fn) { return (...a) => { this.d.exec('BEGIN'); try { const r = fn(...a); this.d.exec('COMMIT'); return r; } catch (e) { this.d.exec('ROLLBACK'); throw e; } }; } }
const orig = Module._load; Module._load = function (req, ...r) { if (req === 'better-sqlite3') return Shim; return orig.call(this, req, ...r); };
process.env.DB_PATH = ':memory:'; process.env.DATA_DIR = require('os').tmpdir() + '/dc-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };

// Fake Discord: records posts, replays a programmable list of statuses
const posted = []; let script = []; let guildCalls = 0;
const fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => {
  if (req.method === 'GET' && /^\/guilds\//.test(req.url)) { guildCalls++; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ name: 'Test Server' })); }
  const m = /^\/channels\/(\w+)\/messages$/.exec(req.url);
  const next = script.shift() || { status: 200 };
  if (next.status === 200) posted.push({ channel: m[1], auth: req.headers.authorization, body: JSON.parse(b) });
  res.statusCode = next.status; res.setHeader('content-type', 'application/json'); if (next.retry) res.setHeader('retry-after', String(next.retry));
  res.end(JSON.stringify(next.status === 200 ? { id: '1' } : { message: 'x', code: 0 })); }); });
fake.listen(0, async () => {
  process.env.DISCORD_API_BASE = `http://localhost:${fake.address().port}`;
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  process.env.DISCORD_PUBLIC_KEY = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
  process.env.DISCORD_BOT_TOKEN = 'tok'; process.env.DISCORD_CLIENT_ID = '123456';
  const express = require(path.join(root, 'node_modules/express'));
  const db = require(path.join(root, 'server/db.js'));
  const Bot = require(path.join(root, 'server/discord-bot.js'));
  Bot._setSleep(() => Promise.resolve());
  db.prepare(`INSERT INTO users (username,email,password_hash,role) VALUES ('adm','a@x.co','x','admin'),('st','s@x.co','x','awakened'),('bob','b@x.co','x','awakened')`).run();
  const chron = db.prepare(`INSERT INTO chronicles (user_id,name,join_code) VALUES (2,'Chantry Nights','AAAAA')`).run().lastInsertRowid;
  const mira = db.prepare(`INSERT INTO characters (user_id,name,character_type,chronicle_id,dexterity,willpower) VALUES (3,'Mira','awakened',?,3,5)`).run(chron).lastInsertRowid;
  const app = express();
  app.use(express.json({ verify: (req, res, buf) => { if (req.originalUrl.startsWith('/api/discord/interactions')) req.rawBody = buf; } }));
  app.use('/api/discord', require(path.join(root, 'server/routes/discord-interactions.js')));
  app.use((req, res, n) => { req.session = { 1: { userId: 1, role: 'admin' }, 2: { userId: 2, role: 'awakened' }, 3: { userId: 3, role: 'awakened' } }[req.headers['x-user'] || 2]; n(); });
  app.use('/api/chronicles', require(path.join(root, 'server/routes/sessions.js')));
  app.use('/api/chronicles', require(path.join(root, 'server/routes/chronicle-discord.js')));
  const srv = app.listen(0, async () => {
    const base = 'http://localhost:' + srv.address().port;
    const j = async (u, m, b, who = 2) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', 'x-user': String(who) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, b: await r.json().catch(() => ({})) }; };
    const C = `/api/chronicles/${chron}`;
    const sign = (body, ts = String(Math.floor(Date.now() / 1000)), key = privateKey) => ({ 'x-signature-ed25519': crypto.sign(null, Buffer.from(ts + body), key).toString('hex'), 'x-signature-timestamp': ts });
    const interact = async (obj, headers) => { const body = JSON.stringify(obj); const r = await fetch(base + '/api/discord/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(headers || sign(body)) }, body }); return { s: r.status, b: await r.json().catch(() => ({})) }; };
    const flush = async () => { await Bot.idle(); await new Promise(r => setTimeout(r, 30)); await Bot.idle(); };

    // ── signature verification ──
    const raw = Buffer.from('{"type":1}'); const h = sign(raw.toString());
    ok(Bot.verifySignature(raw, h['x-signature-ed25519'], h['x-signature-timestamp']), 'valid signature verifies');
    ok(!Bot.verifySignature(Buffer.from('{"type":2}'), h['x-signature-ed25519'], h['x-signature-timestamp']), 'tampered body rejected');
    ok(!Bot.verifySignature(raw, h['x-signature-ed25519'], '1'), 'wrong timestamp rejected');
    ok(!Bot.verifySignature(raw, '', h['x-signature-timestamp']) && !Bot.verifySignature(raw, 'zz', h['x-signature-timestamp']), 'missing or garbage signature rejected');
    const other = crypto.generateKeyPairSync('ed25519').privateKey;
    ok((await interact({ type: 1 }, sign('{"type":1}', '5', other))).s === 401, 'endpoint: signature from another key gives 401');
    ok((await interact({ type: 1 }, {})).s === 401, 'endpoint: no signature gives 401');
    let r = await interact({ type: 1 });
    ok(r.s === 200 && r.b.type === 1, 'endpoint: signed PING answered with PONG');

    // ── Storyteller card routes ──
    ok((await j(`${C}/discord`, 'GET', null, 3)).s === 403, 'player cannot read Discord settings');
    r = await j(`${C}/discord`, 'GET');
    ok(r.b.configured && r.b.invite_url.includes('client_id=123456') && /scope=bot\+applications\.commands/.test(r.b.invite_url) && r.b.invite_url.includes('permissions=18432') && !r.b.linked, 'status: configured, invite URL with scopes and permissions, not linked: ' + r.b.invite_url);
    ok((await j(`${C}/discord/test`, 'POST')).s === 400, 'test message refused when not linked');
    r = await j(`${C}/discord/link-code`, 'POST');
    const code = r.b.code; ok(/^[A-Z2-9]{8}$/.test(code), 'link code generated: ' + code);
    ok((await j(`${C}/discord/link-code`, 'POST', null, 3)).s === 403, 'player cannot generate a link code');

    // ── /m20 link ──
    const cmd = (c, extra = {}) => ({ type: 2, guild_id: 'G1', channel_id: 'CH1', channel: { id: 'CH1', name: 'table-talk' }, data: { name: 'm20', options: [{ type: 1, name: 'link', options: [{ name: 'code', type: 3, value: c }] }] }, ...extra });
    r = await interact(cmd('WRONG123'));
    ok(r.b.type === 4 && r.b.data.flags === 64 && /not valid/.test(r.b.data.content), 'bad code is refused (ephemeral reply)');
    r = await interact({ ...cmd(code), guild_id: undefined });
    ok(/not a direct message/.test(r.b.data.content), 'link in a DM refused');
    db.prepare('UPDATE chronicles SET discord_link_expires = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), chron);
    r = await interact(cmd(code)); ok(/not valid|expired/.test(r.b.data.content), 'expired code refused');
    code2 = (await j(`${C}/discord/link-code`, 'POST')).b.code;
    r = await interact(cmd(code2.toLowerCase()));
    ok(/Linked to \*\*Chantry Nights\*\*/.test(r.b.data.content), 'code accepted case-insensitively');
    await flush();
    let c = db.prepare('SELECT * FROM chronicles WHERE id = ?').get(chron);
    ok(c.discord_guild_id === 'G1' && c.discord_channel_id === 'CH1' && c.discord_channel_name === 'table-talk' && c.discord_link_code === '', 'chronicle linked, code consumed');
    ok(c.discord_guild_name === 'Test Server', 'server name looked up');
    ok(posted.length === 1 && posted[0].channel === 'CH1' && posted[0].auth === 'Bot tok' && /Chronicle linked/.test(posted[0].body.embeds[0].title), 'confirmation posted to the channel with the bot token');
    ok((await interact(cmd(code2))).b.data.content.includes('not valid'), 'code cannot be reused');
    r = await j(`${C}/discord`, 'GET'); ok(r.b.linked && r.b.channel_name === 'table-talk' && r.b.guild_name === 'Test Server' && r.b.code === '', 'status shows the link');

    // ── posting ──
    posted.length = 0;
    r = await j(`${C}/discord/test`, 'POST'); ok(r.s === 200 && posted.length === 1, 'test message posts');
    posted.length = 0;
    const sid = (await j(`${C}/sessions`, 'POST', { title: 'The Basement' })).b.id; await flush();
    ok(posted.length === 1 && posted[0].body.embeds[0].title === 'Session 1 has begun', 'session start posted');
    const rollBody = { character_id: mira, traits: ['attr.dexterity'], difficulty: 7, label: 'Shoot' };
    r = await j(`${C}/session/rolls`, 'POST', rollBody, 3); await flush();
    let e = posted[1] && posted[1].body.embeds[0];
    ok(e && /Mira: Shoot/.test(e.title) && e.fields[0].value.includes('Dexterity 3') && e.fields[1].value.startsWith('7') && e.footer.text.includes('Session 1'), 'roll posted as an embed with pool, difficulty, footer');
    ok(e.description.split('\n')[0].split('  ').length === 3, 'every die appears in the embed');
    ok(JSON.stringify(posted[1].body.allowed_mentions) === '{"parse":[]}', 'mentions are suppressed');
    const n = posted.length;
    await j(`${C}/session/rolls`, 'POST', { pool_size: 4, label: 'Secret', hidden: true }, 2); await flush();
    ok(posted.length === n, 'hidden rolls are never posted');
    await j(`${C}/session/rolls/${r.b.id}/void`, 'POST', { reason: 'wrong target' }, 2); await flush();
    ok(/Roll voided/.test(posted[posted.length - 1].body.embeds[0].title) && /wrong target/.test(posted[posted.length - 1].body.embeds[0].description), 'void posted with reason');
    const sc = (await j(`${C}/sessions/${sid}/notes`, 'POST', { kind: 'scene', title: 'The cellar' })).b; await flush();
    ok(!posted.some(p => /cellar/.test(p.body.embeds[0].title)), 'creating a scene does not post (no half-typed titles)');
    ok((await j(`${C}/sessions/${sid}/notes/${sc.id}/announce`, 'POST')).s === 200, 'announce scene'); await flush();
    ok(/Scene: The cellar/.test(posted[posted.length - 1].body.embeds[0].title), 'scene posted on announce');
    const priv = (await j(`${C}/sessions/${sid}/notes`, 'POST', { kind: 'note', title: 'p' })).b;
    ok((await j(`${C}/sessions/${sid}/notes/${priv.id}/announce`, 'POST')).s === 400, 'private notes cannot be announced');
    // ordering
    const before = posted.length;
    for (let i = 0; i < 5; i++) await j(`${C}/session/rolls`, 'POST', { ...rollBody, label: 'R' + i }, 3);
    await flush(); ok(posted.slice(before).map(p => p.body.embeds[0].title).join() === 'Mira: R0,Mira: R1,Mira: R2,Mira: R3,Mira: R4', 'rolls post in order');

    // ── failure handling ──
    script = [{ status: 500 }, { status: 502 }]; const b2 = posted.length;
    r = await j(`${C}/session/rolls`, 'POST', { ...rollBody, label: 'Retry' }, 3); await flush();
    ok(r.s === 201 && posted.length === b2 + 1, 'transient 5xx is retried and the message lands');
    script = [{ status: 429, retry: 1 }]; const b3 = posted.length;
    await j(`${C}/session/rolls`, 'POST', { ...rollBody, label: 'Limited' }, 3); await flush();
    ok(posted.length === b3 + 1, '429 is retried after the delay');
    script = [{ status: 404 }]; const b4 = posted.length;
    r = await j(`${C}/session/rolls`, 'POST', { ...rollBody, label: 'Dead' }, 3); await flush();
    ok(r.s === 201 && posted.length === b4, 'dead channel: the roll is still saved and returned');
    ok(db.prepare('SELECT COUNT(*) n FROM session_rolls WHERE label = ?').get('Dead').n === 1, 'roll stored even though Discord failed');
    r = await j(`${C}/discord`, 'GET'); ok(/no longer exists/.test(r.b.error), 'link shows a warning: ' + r.b.error);
    await j(`${C}/session/rolls`, 'POST', { ...rollBody, label: 'Back' }, 3); await flush();
    r = await j(`${C}/discord`, 'GET'); ok(r.b.error === '', 'warning clears after the next successful post');
    script = [{ status: 403 }]; r = await j(`${C}/discord/test`, 'POST');
    ok(r.s === 502 && /Send Messages/.test(r.b.error), 'test button reports a permission problem');
    script = [{ status: 500 }, { status: 500 }, { status: 500 }]; const b5 = posted.length;
    r = await j(`${C}/session/rolls`, 'POST', { ...rollBody, label: 'Down' }, 3); await flush();
    ok(r.s === 201 && posted.length === b5, 'Discord down: roll still succeeds');
    script = [];

    // end session, unlink
    await j(`${C}/sessions/${sid}/end`, 'POST', { recap: 'They fled.' }); await flush();
    const last = posted[posted.length - 1].body.embeds[0];
    ok(/Session 1 has ended/.test(last.title) && /They fled\./.test(last.description) && /roll/.test(last.description), 'session end summary posted');
    r = await j(`${C}/discord`, 'DELETE');
    ok(!r.b.linked, 'unlink'); const b6 = posted.length;
    await j(`${C}/sessions`, 'POST', {}); await flush();
    ok(posted.length === b6, 'nothing posts after unlinking');

    // not configured: no network at all
    delete process.env.DISCORD_BOT_TOKEN;
    ok(!Bot.configured(), 'unconfigured without a token');
    r = await j(`${C}/discord`, 'GET'); ok(r.b.configured === false && r.b.invite_url === '', 'status reports not configured');
    ok((await j(`${C}/discord/link-code`, 'POST')).s === 400, 'link code refused when not configured');
    ok((await interact({ type: 1 })).s === 401, 'interactions endpoint closed when not configured');

    console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); srv.close(); fake.close(); process.exit(fails ? 1 : 0);
  });
});
