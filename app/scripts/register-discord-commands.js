// Registers the bot's slash commands with Discord (global commands). Run once after
// setting DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID (or DISCORD_APPLICATION_ID), and
// again whenever server/discord-bot.js changes the command list.
//   docker compose exec <service> node scripts/register-discord-commands.js
//   (from a checkout: cd app && node scripts/register-discord-commands.js)
process.env.DB_PATH = process.env.DB_PATH || ':memory:';
const Bot = require('../server/discord-bot.js');
(async () => {
  if (!process.env.DISCORD_BOT_TOKEN || !Bot.appId()) { console.error('Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID first.'); process.exit(1); }
  const r = await Bot.api('PUT', `/applications/${Bot.appId()}/commands`, Bot.COMMANDS);
  if (!r.ok) { console.error('Discord refused the command list:', r.status, JSON.stringify(r.json)); process.exit(1); }
  console.log('Registered:', (r.json || []).map(c => '/' + c.name).join(', '));
  process.exit(0);
})();
