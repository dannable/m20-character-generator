// Storyteller-facing Discord settings for a chronicle: invite link, link code,
// status, test message, unlink. Mounted at /api/chronicles (behind login).
const express = require('express');
const db = require('../db');
const Bot = require('../discord-bot');
const router = express.Router();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const CODE_TTL_MS = 15 * 60 * 1000;

function load(req, res) {
  const c = db.prepare('SELECT * FROM chronicles WHERE id = ?').get(req.params.id);
  if (!c) { res.status(404).json({ error: 'Chronicle not found' }); return null; }
  if (c.user_id !== req.session.userId && req.session.role !== 'admin') { res.status(403).json({ error: 'Forbidden' }); return null; }
  return c;
}
function status(c) {
  const codeLive = c.discord_link_code && c.discord_link_expires > new Date().toISOString();
  return {
    configured: Bot.configured(),
    invite_url: Bot.configured() ? Bot.inviteUrl() : '',
    linked: !!c.discord_channel_id,
    guild_name: c.discord_guild_name || '', channel_name: c.discord_channel_name || '',
    error: c.discord_error || '',
    code: codeLive ? c.discord_link_code : '', code_expires: codeLive ? c.discord_link_expires : '',
  };
}
const fail = (res, e) => { console.error(e); res.status(500).json({ error: 'Internal server error' }); };

router.get('/:id/discord', (req, res) => { try { const c = load(req, res); if (c) res.json(status(c)); } catch (e) { fail(res, e); } });

router.post('/:id/discord/link-code', (req, res) => {
  try {
    const c = load(req, res); if (!c) return;
    if (!Bot.configured()) return res.status(400).json({ error: 'The Discord bot is not set up on this server.' });
    let code, n = 0;
    do { code = newCode(); n++; } while (db.prepare('SELECT id FROM chronicles WHERE discord_link_code = ?').get(code) && n < 20);
    db.prepare('UPDATE chronicles SET discord_link_code = ?, discord_link_expires = ? WHERE id = ?')
      .run(code, new Date(Date.now() + CODE_TTL_MS).toISOString(), c.id);
    res.json(status(db.prepare('SELECT * FROM chronicles WHERE id = ?').get(c.id)));
  } catch (e) { fail(res, e); }
});

router.post('/:id/discord/test', async (req, res) => {
  try {
    const c = load(req, res); if (!c) return;
    if (!Bot.configured()) return res.status(400).json({ error: 'The Discord bot is not set up on this server.' });
    if (!c.discord_channel_id) return res.status(400).json({ error: 'This chronicle is not linked to a channel.' });
    const r = await Bot.sendNow(c.discord_channel_id, Bot.textEmbed('Test message', `Chantry can post here for **${c.name}**.`));
    db.prepare('UPDATE chronicles SET discord_error = ? WHERE id = ?').run(r.ok ? '' : r.error, c.id);
    if (!r.ok) return res.status(502).json({ error: r.error });
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
});

router.delete('/:id/discord', (req, res) => {
  try {
    const c = load(req, res); if (!c) return;
    db.prepare(`UPDATE chronicles SET discord_guild_id = '', discord_guild_name = '', discord_channel_id = '', discord_channel_name = '',
                discord_link_code = '', discord_link_expires = '', discord_error = '' WHERE id = ?`).run(c.id);
    res.json(status(db.prepare('SELECT * FROM chronicles WHERE id = ?').get(c.id)));
  } catch (e) { fail(res, e); }
});

module.exports = router;
