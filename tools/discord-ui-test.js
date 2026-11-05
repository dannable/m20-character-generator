// UI smoke test for the Discord card. Usage: node tools/discord-ui-test.js <public dir>
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const pub = path.resolve(process.argv[2]);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => { let f = path.join(pub, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(pub, 'index.html'); res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  const user = { id: 2, username: 'st', email: 't@x', role: 'awakened', is_active: 1, timezone: 'UTC', default_focus_mode: 'core' };
  let st = { configured: false, invite_url: '', linked: false, guild_name: '', channel_name: '', error: '', code: '', code_expires: '' }; const calls = [];
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/**', route => {
    const k = new URL(route.request().url()).pathname, m = route.request().method();
    if (k === '/api/auth/me') return json(route, user);
    if (k === '/api/chronicles/5') return json(route, { id: 5, user_id: 2, name: 'Chantry Nights', join_code: 'ABCDE', is_active: 1, allow_bg_xp: 1, rules: '{}', members: [], customContent: {} });
    if (k === '/api/chronicles/5/notes') return json(route, []);
    if (k === '/api/chronicles/5/sessions') return json(route, []);
    if (k === '/api/chronicles/5/discord' && m === 'GET') return json(route, st);
    if (k === '/api/chronicles/5/discord/link-code') { calls.push('code'); st = { ...st, code: 'ABCD2345', code_expires: new Date(Date.now() + 900000).toISOString() }; return json(route, st); }
    if (k === '/api/chronicles/5/discord/test') { calls.push('test'); return json(route, st.error ? { error: st.error } : { ok: true }, st.error ? 502 : 200); }
    if (k === '/api/chronicles/5/discord' && m === 'DELETE') { calls.push('unlink'); st = { ...st, linked: false, channel_name: '', guild_name: '' }; return json(route, st); }
    if (k.startsWith('/api/custom')) return json(route, { items: [] });
    if (k === '/api/chronicles/custom/member-content') return json(route, { chronicles: [] });
    if (k.includes('attention') || k.includes('recent') || k === '/api/characters' || k === '/api/chronicles') return json(route, []);
    json(route, {}, 404);
  });
  await page.goto(`http://localhost:${server.address().port}/`); await page.waitForTimeout(800);
  const log = (...a) => console.log(...a); const text = sel => page.textContent(sel).then(t => t.replace(/\s+/g, ' ').trim());
  await page.evaluate(() => Chronicle.showDetail(5)); await page.waitForTimeout(600);
  log('not configured:', await text('#discord-card-body'));
  st = { ...st, configured: true, invite_url: 'https://discord.com/oauth2/authorize?client_id=1' }; await page.evaluate(() => DiscordCard.refresh()); await page.waitForTimeout(200);
  log('unlinked steps:', await text('#discord-card-body'), '| invite href ok:', await page.$eval('.discord-steps a', a => a.href.startsWith('https://discord.com/oauth2/authorize') && a.target === '_blank'));
  await page.click('#dc-code'); await page.waitForTimeout(300);
  log('code shown:', await text('.discord-code'));
  st = { ...st, linked: true, guild_name: 'Test Server', channel_name: 'table-talk', code: '' }; await page.evaluate(() => DiscordCard.refresh()); await page.waitForTimeout(200);
  log('linked:', await text('#discord-card-body'));
  st.error = 'The linked channel no longer exists, or the bot was removed from the server.'; await page.evaluate(() => DiscordCard.refresh()); await page.waitForTimeout(200);
  log('warning shown:', await page.$eval('.discord-warn', e => e.textContent.slice(0, 40)));
  await page.click('#dc-test'); await page.waitForTimeout(300);
  await page.click('#dc-unlink'); await page.waitForTimeout(300);
  log('calls:', calls.join(','), '| back to unlinked:', !!(await page.$('#dc-code')));
  await page.setViewportSize({ width: 390, height: 900 });
  log('no horizontal scroll at 390px:', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  log('errors:', errors.length ? errors : 'none');
  await browser.close(); server.close(); process.exit(0);
})();
