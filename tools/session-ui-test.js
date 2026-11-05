// UI smoke test for session mode Phase 1. Usage: node tools/session-ui-test.js <public dir>
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const pub = path.resolve(process.argv[2]);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => { let f = path.join(pub, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(pub, 'index.html'); res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
const user = { id: 2, username: 'st', email: 't@x', role: 'awakened', is_active: 1, timezone: 'UTC', default_focus_mode: 'core' };
const chron = { id: 5, user_id: 2, name: 'Chantry Nights', setting: '', year: '', themes: '', notes: '', next_session: '', join_code: 'ABCDE', is_active: 1, allow_bg_xp: 1, rules: '{}', members: [{ id: 9, name: 'Mira', arete: 3, character_type: 'awakened', affiliation: 'Traditions', tradition: 'Verbena', owner_username: 'bob', xp_awards: [] }], customContent: {} };
const roster = [{ id: 9, name: 'Mira', character_type: 'awakened', willpower: 6, willpower_spent: 2, quintessence: 3, paradox: 1, health_damaged: 2, health_dead: 0, owner_username: 'bob' }];
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  let sessions = [{ id: 1, chronicle_id: 5, number: 1, title: 'Old', status: 'ended', recap: '', started_at: '2026-01-01 10:00:00' }];
  let notes = []; const calls = [];
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/**', route => {
    const k = new URL(route.request().url()).pathname, m = route.request().method();
    const post = route.request().postData() ? JSON.parse(route.request().postData()) : null;
    if (k === '/api/auth/me') return json(route, user);
    if (k === '/api/chronicles/5') return json(route, chron);
    if (k === '/api/chronicles/5/notes') return json(route, []);
    if (k === '/api/chronicles/5/sessions' && m === 'GET') return json(route, sessions);
    if (k === '/api/chronicles/5/sessions' && m === 'POST') { const s = { id: 2, chronicle_id: 5, number: 2, title: post.title, status: 'active', recap: '', started_at: '2026-02-01 10:00:00' }; sessions.unshift(s); calls.push(['start', post]); return json(route, s, 201); }
    if (k === '/api/chronicles/5/sessions/2' && m === 'GET') return json(route, { session: sessions[0], roster, notes });
    if (k === '/api/chronicles/5/sessions/2/notes' && m === 'POST') { const n = { id: notes.length + 10, session_id: 2, kind: post.kind, title: post.title, body: '', shares: [] }; notes.push(n); calls.push(['addnote', post]); return json(route, n, 201); }
    if (/\/sessions\/2\/notes\/\d+$/.test(k) && m === 'PUT') { calls.push(['putnote', post]); return json(route, { ...post, id: 10, shares: [] }); }
    if (k === '/api/chronicles/5/sessions/2' && m === 'PATCH') { calls.push(['patch', post]); return json(route, sessions[0]); }
    if (k === '/api/chronicles/5/sessions/2/end') { calls.push(['end', post]); sessions[0].status = 'ended'; return json(route, sessions[0]); }
    if (k.startsWith('/api/custom') || k.includes('attention') || k.includes('recent') || k === '/api/characters' || k === '/api/chronicles') return json(route, k.includes('custom') ? { items: [], chronicles: [] } : []);
    json(route, {}, 404);
  });
  await page.goto(`http://localhost:${server.address().port}/`); await page.waitForTimeout(800);
  const log = (...a) => console.log(...a);
  await page.evaluate(() => Chronicle.showDetail(5)); await page.waitForTimeout(600);
  log('card present:', !!(await page.$('#session-card')), '| past rows:', (await page.$$('.session-past-row')).length, '| start button:', !!(await page.$('#btn-start-session')));
  await page.fill('#session-title-input', 'The Basement'); await page.click('#btn-start-session'); await page.waitForTimeout(500);
  log('start call:', JSON.stringify(calls[0]));
  log('screen heading:', (await page.textContent('.session-top h2')).replace(/\s+/g, ' ').trim());
  log('roster:', (await page.textContent('.session-roster-row')).replace(/\s+/g, ' ').trim());
  for (const k of ['note', 'scene', 'handout']) { await page.click(`[data-add="${k}"]`); await page.waitForTimeout(150); }
  log('notes on screen:', await page.$$eval('.session-note', xs => xs.map(x => x.className.replace('session-note ', ''))));
  log('handout share boxes:', (await page.$$('.session-share-cb')).length);
  await page.check('.session-share-cb'); await page.waitForTimeout(300);
  log('share save payload:', JSON.stringify(calls.filter(c => c[0] === 'putnote').pop()));
  await page.fill('.session-note-body', 'Hello'); await page.waitForTimeout(1100);
  log('autosave payload:', JSON.stringify(calls.filter(c => c[0] === 'putnote').pop()));
  await page.fill('#session-recap', 'Went well'); await page.waitForTimeout(1100);
  log('recap patch:', JSON.stringify(calls.filter(c => c[0] === 'patch').pop()));
  await page.setViewportSize({ width: 1600, height: 900 });
  log('wide: main width >', await page.$eval('#app-main', m => m.getBoundingClientRect().width), '| 3 columns:', await page.$$eval('.session-col', c => c.length), '| columns side by side:', await page.$$eval('.session-col', c => new Set(c.map(x => Math.round(x.getBoundingClientRect().top))).size === 1));
  log('wide: no page scroll (columns scroll inside):', await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2));
  await page.screenshot({ path: '/tmp/session-wide.png' });
  await page.setViewportSize({ width: 390, height: 900 });
  log('mobile: session UI hidden:', await page.$eval('.session-main', m => getComputedStyle(m).display === 'none'), '| notice shown:', (await page.textContent('.session-desktop-only')).replace(/\s+/g, ' ').trim().slice(0, 70));
  log('no horizontal scroll at 390px:', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: '/tmp/session-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.click('#session-end'); await page.waitForTimeout(700);
  await page.setViewportSize({ width: 390, height: 900 });
  log('mobile chronicle card: controls hidden:', await page.$eval('.session-desktop-ctl', c => getComputedStyle(c).display === 'none'), '| hint:', (await page.textContent('.session-desktop-hint')).trim().slice(0, 50));
  log('end call:', JSON.stringify(calls.find(c => c[0] === 'end')), '| back on chronicle page:', !!(await page.$('.chronicle-detail-body')));
  log('errors:', errors.length ? errors : 'none');
  await browser.close(); server.close();
})();
