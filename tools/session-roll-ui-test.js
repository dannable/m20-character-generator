// UI smoke test for session mode Phase 2. Usage: node tools/session-roll-ui-test.js <public dir>
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const pub = path.resolve(process.argv[2]);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => { let f = path.join(pub, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(pub, 'index.html'); res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
const T = (key, label, group, value) => ({ key, label, group, value });
const mira = { id: 9, name: 'Mira', willpower_current: 4, willpower: 5, wound_penalty: -1, damaged: 2, traits: [T('attr.dexterity', 'Dexterity', 'Attributes', 3), T('abil.firearms', 'Firearms', 'Skills', 2), T('abil.alertness', 'Alertness', 'Talents', 4), T('arete', 'Arete', 'Magick', 3), T('willpower', 'Willpower', 'Other', 5)] };
const mkRoll = (id, extra = {}) => ({ id, session_id: 2, character_id: 9, user_id: 3, roller_name: 'Mira', label: '', pool: { items: [{ key: 'attr.dexterity', label: 'Dexterity', value: 3 }, { key: 'abil.firearms', label: 'Firearms', value: 2 }], modifier: 0, wound: -1 }, pool_size: 4, difficulty: 7, specialty: false, willpower: false, threshold: 0, hidden: false, dice: [9, 1, 7, 3], successes: 1, ones: 1, outcome: 'success', degree: 'Marginal', voided: false, void_reason: '', wp_spent: false, created_at: '2026-02-01 10:00:00', ...extra });
const sheetChar = { id: 9, user_id: 3, name: 'Mira', chronicle_id: 5, character_type: 'awakened', affiliation: 'Traditions', tradition: 'Verbena', strength: 2, dexterity: 3, stamina: 2, charisma: 2, manipulation: 2, appearance: 2, perception: 2, intelligence: 2, wits: 2, talents: {}, skills: {}, knowledges: {}, backgrounds: {}, spheres: { life: 2 }, arete: 2, willpower: 5, quintessence: 0, paradox: 0, instruments: [], freebie_spent: {}, merits: {}, flaws: {}, specialties: {}, rotes: [], xp_log: [], is_draft: 0, resonance: [], wonders: [], custom_ability_names: {}, merit_labels: {}, linked_chronicle_name: 'Chantry Nights' };
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|404|EventSource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept('because'));
  let me = { id: 2, username: 'st', email: 't@x', role: 'awakened', is_active: 1, timezone: 'UTC', default_focus_mode: 'core' };
  let rolls = [mkRoll(1)]; const posts = []; const voids = [];
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/**', route => {
    const k = new URL(route.request().url()).pathname, m = route.request().method();
    const post = route.request().postData() ? JSON.parse(route.request().postData()) : null;
    if (k === '/api/auth/me') return json(route, me);
    if (k === '/api/chronicles/5/session/stream') return route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: hello\ndata: {}\n\n' });
    if (k === '/api/chronicles/5/session' && m === 'GET') return json(route, { session: { id: 2, number: 2, title: 'The Basement', started_at: '2026-02-01 10:00:00' }, role: me.id === 2 ? 'st' : 'player', characters: [mira], rolls: rolls.filter(r => me.id === 2 || !r.hidden) });
    if (k === '/api/chronicles/5/session/rolls' && m === 'POST') { posts.push(post); const r = mkRoll(10 + posts.length, { ...(post.character_id ? {} : { character_id: null, roller_name: post.label || 'Storyteller', pool: { items: [{ key: 'custom', label: 'Dice', value: post.pool_size }], modifier: 0, wound: 0 }, pool_size: post.pool_size }), hidden: !!post.hidden, difficulty: post.difficulty, willpower: !!post.willpower, wp_spent: !!post.willpower && !!post.character_id, specialty: !!post.specialty, dice: [10, 8, 2] }); rolls.push(r); return json(route, r, 201); }
    if (/\/session\/rolls\/\d+\/void$/.test(k)) { voids.push([k, post]); const id = Number(k.split('/').slice(-2)[0]); const r = rolls.find(x => x.id === id); r.voided = true; r.void_reason = post.reason; return json(route, r); }
    if (k === '/api/chronicles/5') return json(route, { id: 5, user_id: 2, name: 'Chantry Nights', join_code: 'ABCDE', is_active: 1, allow_bg_xp: 1, rules: '{}', members: [], customContent: {} });
    if (k === '/api/chronicles/5/notes') return json(route, []);
    if (k === '/api/chronicles/5/sessions' && m === 'GET') return json(route, [{ id: 2, chronicle_id: 5, number: 2, title: 'The Basement', status: 'active', recap: '', started_at: '2026-02-01 10:00:00' }]);
    if (k === '/api/chronicles/5/sessions/2' && m === 'GET') return json(route, { session: { id: 2, chronicle_id: 5, number: 2, title: 'The Basement', status: 'active', recap: '', started_at: '2026-02-01 10:00:00' }, roster: [{ id: 9, name: 'Mira', character_type: 'awakened', willpower: 5, willpower_spent: 1, quintessence: 0, paradox: 0, health_damaged: 2, health_dead: 0 }], notes: [], rolls, characters: [mira] });
    if (k === '/api/characters/9') return json(route, sheetChar);
    if (k === '/api/characters/9/storyteller-notes') return json(route, []);
    if (k.startsWith('/api/custom')) return json(route, { items: [] });
    if (k === '/api/chronicles/custom/member-content') return json(route, { chronicles: [] });
    if (k.includes('attention') || k.includes('recent') || k === '/api/characters' || k === '/api/chronicles') return json(route, []);
    json(route, {}, 404);
  });
  await page.goto(`http://localhost:${server.address().port}/`); await page.waitForTimeout(800);
  const log = (...a) => console.log(...a);
  // ── Storyteller ──
  await page.evaluate(() => SessionUI.open({ id: 5, name: 'Chantry Nights' }, 2)); await page.waitForTimeout(700);
  log('ST: panel present:', !!(await page.$('#rp-go')), '| log entries:', (await page.$$('.roll-entry')).length, '| char select options:', await page.$$eval('#rp-char option', o => o.map(x => x.textContent)));
  log('ST: first log entry:', (await page.textContent('.roll-entry')).replace(/\s+/g, ' ').trim());
  await page.selectOption('#rp-char', '9'); await page.waitForTimeout(100);
  log('ST: roll disabled with no trait picked:', await page.$eval('#rp-go', b => b.disabled));
  await page.click('.roll-chip[data-key="attr.dexterity"]'); await page.click('.roll-chip[data-key="abil.alertness"]');
  log('summary:', (await page.textContent('.roll-summary')).replace(/\s+/g, ' ').trim());
  log('specialty enabled (Alertness 4):', await page.$eval('#rp-spec', c => !c.disabled));
  await page.check('#rp-spec'); await page.check('#rp-wp'); await page.selectOption('#rp-diff', '8'); await page.check('#rp-hidden');
  await page.click('#rp-go'); await page.waitForTimeout(500);
  log('POST body:', JSON.stringify(posts[0]));
  log('hidden roll marked in ST log:', await page.$$eval('.roll-hidden', x => x.length), '| Willpower checkbox reset after roll:', await page.$eval('#rp-wp', c => c.checked));
  log('toggles after spend:', await page.$eval('.roll-toggles', t => t.textContent.replace(/\s+/g, ' ').trim()));
  await page.selectOption('#rp-char', ''); await page.fill('#rp-size', '6'); await page.fill('#rp-label', 'Guard'); await page.click('#rp-go'); await page.waitForTimeout(400);
  log('NPC POST:', JSON.stringify(posts[1]));
  await page.click('.roll-entry .roll-void-btn'); await page.waitForTimeout(400);
  log('void call:', JSON.stringify(voids[0] && voids[0][1]), '| voided entries:', await page.$$eval('.roll-voided', x => x.length));
  await page.screenshot({ path: '/tmp/st-roll.png', fullPage: true });
  // ── Player ──
  me = { id: 3, username: 'bob', email: 'b@x', role: 'awakened', is_active: 1, timezone: 'UTC', default_focus_mode: 'core' };
  await page.reload(); await page.waitForTimeout(900);
  await page.evaluate(() => App.viewCharacter(9)); await page.waitForTimeout(900);
  log('player: join banner:', (await page.textContent('#session-join-banner').catch(() => '')).replace(/\s+/g, ' ').trim());
  await page.click('#btn-join-session'); await page.waitForTimeout(600);
  log('player: no character picker (one char):', !(await page.$('#rp-char')), '| no hidden option:', !(await page.$('#rp-hidden')), '| log entries (hidden excluded):', (await page.$$('.roll-entry')).length);
  await page.click('.roll-chip[data-key="abil.firearms"]'); await page.click('#rp-go'); await page.waitForTimeout(400);
  log('player POST:', JSON.stringify(posts[2]));
  log('player undo button on latest roll only:', await page.$$eval('.roll-void-btn', b => b.map(x => x.textContent)));
  await page.setViewportSize({ width: 390, height: 900 });
  log('no horizontal scroll at 390px:', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: '/tmp/player-roll.png', fullPage: true });
  log('errors:', errors.length ? errors : 'none');
  await browser.close(); server.close(); process.exit(0);
})();
