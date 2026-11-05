// Discord bot support for session mode (Phase 3): REST-only, no gateway connection.
// Posting needs only DISCORD_BOT_TOKEN and a channel id. Slash commands arrive as
// signed HTTPS requests (routes/discord-interactions.js), verified with
// DISCORD_PUBLIC_KEY. Nothing here ever throws into a roll or a session action:
// a roll is saved first and posted second.
const crypto = require('crypto');
// The database is loaded lazily so command registration (scripts/) never opens it.
const dbh = () => require('./db');

const env = () => process.env;
const apiBase = () => env().DISCORD_API_BASE || 'https://discord.com/api/v10';
const appId = () => env().DISCORD_APPLICATION_ID || env().DISCORD_CLIENT_ID || '';
const configured = () => !!(env().DISCORD_BOT_TOKEN && env().DISCORD_PUBLIC_KEY && appId());

// Send Messages (2048) + Embed Links (16384). Slash commands need only the
// applications.commands scope, not a permission bit.
const INVITE_PERMISSIONS = 2048 + 16384;
function inviteUrl() {
  if (!appId()) return '';
  return 'https://discord.com/oauth2/authorize?' + new URLSearchParams({
    client_id: appId(), scope: 'bot applications.commands', permissions: String(INVITE_PERMISSIONS),
  }).toString();
}

// ── Request signature (Ed25519 over timestamp + raw body) ────────────────────
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
function verifySignature(rawBody, signatureHex, timestamp, publicKeyHex = env().DISCORD_PUBLIC_KEY) {
  try {
    if (!rawBody || !signatureHex || !timestamp || !publicKeyHex) return false;
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(publicKeyHex, 'hex')]), format: 'der', type: 'spki' });
    return crypto.verify(null, Buffer.concat([Buffer.from(String(timestamp)), rawBody]), key, Buffer.from(signatureHex, 'hex'));
  } catch { return false; }
}

// ── REST ─────────────────────────────────────────────────────────────────────
let sleep = ms => new Promise(r => setTimeout(r, ms));
const _setSleep = fn => { sleep = fn; };

async function api(method, path, body) {
  const res = await fetch(apiBase() + path, {
    method,
    headers: { Authorization: `Bot ${env().DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'ChantryBot (m20, 1)' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, ok: res.ok, json, retryAfter: Number(res.headers.get('retry-after')) || (json && json.retry_after) || 0 };
}

// Send with retry. Returns { ok, status, error, fatal }. fatal means the link itself is
// bad (bot removed, channel deleted, missing permission), so retrying cannot help.
async function sendNow(channelId, payload) {
  let last = { ok: false, status: 0, error: 'unknown' };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await api('POST', `/channels/${channelId}/messages`, payload);
      if (r.ok) return { ok: true, status: r.status };
      if (r.status === 429) { last = { ok: false, status: 429, error: 'rate limited' }; await sleep(Math.min(10000, Math.max(500, r.retryAfter * 1000))); continue; }
      if (r.status === 401) return { ok: false, status: 401, error: 'The bot token was rejected by Discord.', fatal: true };
      if (r.status === 403 || r.status === 404) {
        const why = r.status === 404 ? 'The linked channel no longer exists, or the bot was removed from the server.'
          : 'The bot is not allowed to post in the linked channel. Give it Send Messages and Embed Links there.';
        return { ok: false, status: r.status, error: why, fatal: true };
      }
      last = { ok: false, status: r.status, error: `Discord returned ${r.status}` };
    } catch (e) { last = { ok: false, status: 0, error: 'Could not reach Discord.' }; }
    await sleep(1000 * (attempt + 1));
  }
  return last;
}

// ── Per-chronicle queue: messages arrive in order, one at a time ─────────────
const chains = new Map();
function setError(chronicleId, msg) {
  try { dbh().prepare('UPDATE chronicles SET discord_error = ? WHERE id = ?').run(msg, chronicleId); } catch {}
}
function post(chronicleId, payload) {
  if (!configured()) return Promise.resolve();
  const prev = chains.get(chronicleId) || Promise.resolve();
  const next = prev.then(async () => {
    const c = dbh().prepare('SELECT discord_channel_id, discord_error FROM chronicles WHERE id = ?').get(chronicleId);
    if (!c || !c.discord_channel_id) return;
    const r = await sendNow(c.discord_channel_id, payload);
    if (r.ok) { if (c.discord_error) setError(chronicleId, ''); }
    else setError(chronicleId, r.error);
  }).catch(e => console.error('discord post:', e.message));
  chains.set(chronicleId, next);
  next.finally(() => { if (chains.get(chronicleId) === next) chains.delete(chronicleId); });
  return next;
}
const idle = () => Promise.all([...chains.values()]);

// ── Message builders ─────────────────────────────────────────────────────────
const COLORS = { success: 0x4caf6e, failure: 0x8a8a96, botch: 0xd64545, info: 0xc9a84c };
const esc = s => String(s).replace(/([*_~`|>\\])/g, '\\$1');

function diceLine(r) {
  if (!r.dice.length) return '*no dice*';
  return r.dice.map(d => d === 1 ? `~~${d}~~` : (d >= r.difficulty || d === 10) ? `**${d}**` : String(d)).join('  ');
}
function rollEmbed(r, ctx = {}) {
  const items = (r.pool.items || []).map(i => i.key === 'custom' ? `${i.value} dice` : `${esc(i.label)} ${i.value}`).join(' + ');
  const adj = [r.pool.modifier ? `${r.pool.modifier > 0 ? '+' : '-'} ${Math.abs(r.pool.modifier)}` : '', r.pool.wound ? `- ${Math.abs(r.pool.wound)} wounds` : ''].filter(Boolean).join(' ');
  const result = r.outcome === 'botch' ? '**BOTCH**' : r.outcome === 'success' ? `**${r.successes} success${r.successes === 1 ? '' : 'es'}**${r.degree ? ` (${r.degree})` : ''}` : '**Failure**';
  const flags = [r.specialty && 'specialty', r.willpower && 'Willpower', r.threshold && `threshold ${r.threshold}`].filter(Boolean).join(', ');
  const title = r.label && r.label !== r.roller_name ? `${esc(r.roller_name)}: ${esc(r.label)}` : esc(r.roller_name || 'Roll');
  return {
    title: title.slice(0, 250),
    description: `${diceLine(r)}\n${result}`.slice(0, 4000),
    color: COLORS[r.outcome] || COLORS.info,
    fields: [
      { name: 'Pool', value: `${items}${adj ? ' ' + adj : ''} = ${r.pool_size} dice`.slice(0, 1000), inline: true },
      { name: 'Difficulty', value: `${r.difficulty}${flags ? ' · ' + flags : ''}`.slice(0, 1000), inline: true },
    ],
    footer: ctx.session ? { text: `Session ${ctx.session.number}${ctx.chronicleName ? ' · ' + ctx.chronicleName : ''}`.slice(0, 200) } : undefined,
  };
}
const embedMsg = (embed) => ({ embeds: [embed], allowed_mentions: { parse: [] } });
const textEmbed = (title, description, color = COLORS.info) => embedMsg({ title: String(title).slice(0, 250), description: String(description || '').slice(0, 4000), color });

const chronicleName = id => (dbh().prepare('SELECT name FROM chronicles WHERE id = ?').get(id) || {}).name || '';

// Public helpers used by the session routes. Each is fire-and-forget.
function postRoll(chronicleId, roll, session) {
  if (roll.hidden) return;
  post(chronicleId, embedMsg(rollEmbed(roll, { session, chronicleName: chronicleName(chronicleId) })));
}
function postVoid(chronicleId, roll) {
  if (roll.hidden) return;
  post(chronicleId, textEmbed('Roll voided', `${esc(roll.roller_name || 'A roll')}'s roll was voided${roll.void_reason ? ': ' + esc(roll.void_reason) : '.'}`, COLORS.failure));
}
function postSessionStart(chronicleId, session) {
  post(chronicleId, textEmbed(`Session ${session.number} has begun`, session.title ? esc(session.title) : '', COLORS.info));
}
function postSessionEnd(chronicleId, session, rollCount) {
  post(chronicleId, textEmbed(`Session ${session.number} has ended`, [session.title && esc(session.title), session.recap && esc(session.recap).slice(0, 1500), `${rollCount} roll${rollCount === 1 ? '' : 's'} this session.`].filter(Boolean).join('\n\n'), COLORS.info));
}
function postScene(chronicleId, title) {
  return post(chronicleId, textEmbed(`Scene: ${esc(title)}`, '', COLORS.info));
}

// Slash command definitions (registered by tools/register-discord-commands.js)
const COMMANDS = [{
  name: 'm20', description: 'Chantry: Mage 20th Anniversary session tools', type: 1,
  options: [{ type: 1, name: 'link', description: 'Link this channel to a chronicle', options: [{ type: 3, name: 'code', description: 'The code shown on the chronicle page', required: true }] }],
}];

module.exports = { configured, inviteUrl, verifySignature, api, sendNow, post, idle, rollEmbed, diceLine, textEmbed,
  postRoll, postVoid, postSessionStart, postSessionEnd, postScene, COMMANDS, _setSleep, appId };
