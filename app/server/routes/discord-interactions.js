// Public endpoint Discord POSTs slash commands to. Every request must carry a valid
// Ed25519 signature or it is rejected before anything else happens.
const express = require('express');
const db = require('../db');
const Bot = require('../discord-bot');
const router = express.Router();

const reply = (content) => ({ type: 4, data: { content, flags: 64, allowed_mentions: { parse: [] } } });

router.post('/interactions', async (req, res) => {
  const ok = Bot.configured() && Bot.verifySignature(req.rawBody, req.get('x-signature-ed25519'), req.get('x-signature-timestamp'));
  if (!ok) return res.status(401).send('invalid request signature');
  const i = req.body || {};
  try {
    if (i.type === 1) return res.json({ type: 1 }); // PING
    if (i.type !== 2 || i.data?.name !== 'm20') return res.json(reply('Unknown command.'));
    const sub = (i.data.options || [])[0];
    if (sub?.name === 'link') return res.json(await link(i, sub));
    return res.json(reply('Unknown command.'));
  } catch (e) {
    console.error('discord interaction:', e.message);
    return res.json(reply('Something went wrong on the Chantry server.'));
  }
});

async function link(i, sub) {
  if (!i.guild_id || !i.channel_id) return reply('Run this in a server channel, not a direct message.');
  const code = String((sub.options || []).find(o => o.name === 'code')?.value || '').trim().toUpperCase();
  const c = code && db.prepare(`SELECT * FROM chronicles WHERE discord_link_code = ? AND discord_link_code != '' AND discord_link_expires > ? AND is_active = 1`)
    .get(code, new Date().toISOString());
  if (!c) return reply('That code is not valid, or it has expired. Generate a new one on the chronicle page.');
  const channelName = i.channel?.name || '';
  db.prepare(`UPDATE chronicles SET discord_guild_id = ?, discord_channel_id = ?, discord_channel_name = ?, discord_guild_name = '',
              discord_link_code = '', discord_link_expires = '', discord_error = '' WHERE id = ?`)
    .run(i.guild_id, i.channel_id, channelName, c.id);
  // Best effort: look up the server name, then confirm in the channel. Neither delays the reply.
  Bot.api('GET', `/guilds/${i.guild_id}`).then(r => {
    if (r.ok && r.json?.name) db.prepare('UPDATE chronicles SET discord_guild_name = ? WHERE id = ?').run(String(r.json.name).slice(0, 100), c.id);
  }).catch(() => {});
  Bot.post(c.id, Bot.textEmbed('Chronicle linked', `**${c.name}** will post session events and dice rolls in this channel.`));
  return reply(`Linked to **${c.name}**. Rolls and session events will appear in this channel.`);
}

module.exports = router;
