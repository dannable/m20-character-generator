const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const pub = path.resolve(process.argv[2]);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => { let f = path.join(pub, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(pub, 'index.html'); res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
const user = { id: 2, username: 'p', email: 't@x', role: 'awakened', is_active: 1, timezone: 'UTC', default_focus_mode: 'core' };
const char = { id: 9, user_id: 2, name: 'Mira', player: '', chronicle: '', concept: 'Seeker', affiliation: 'Traditions', tradition: 'Verbena', faction: '', essence: 'Dynamic', nature: 'Architect', demeanor: 'Pedagogue', strength: 2, dexterity: 2, stamina: 2, charisma: 2, manipulation: 2, appearance: 2, perception: 2, intelligence: 2, wits: 2, talents: {}, skills: {}, knowledges: {}, backgrounds: {}, spheres: { life: 2 }, affinity_sphere: 'life', arete: 2, willpower: 5, quintessence: 0, paradox: 0, paradigm: '', practice: '', instruments: [], freebie_spent: {}, merits: {}, flaws: {}, specialties: {}, description: 'Tall.', notes: '', attr_priority: [], ability_priority: [], is_draft: 0, chronicle_id: null, character_type: 'awakened', resonance: [], rotes: [], wonders: [], xp_earned: 0, xp_log: [], custom_ability_names: {}, merit_labels: {}, gender: 'woman', pronouns: 'she/her', motivation: 'To heal the land.' };
const api = { '/api/auth/me': user, '/api/custom/merits-flaws': { items: [] }, '/api/custom/rotes': { items: [] }, '/api/custom/backgrounds': { items: [] }, '/api/custom/wonders': { items: [] }, '/api/chronicles/custom/member-content': { chronicles: [] }, '/api/characters/recent': [], '/api/characters/attention-summary': [], '/api/chronicles': [], '/api/characters': [char], '/api/characters/9': char, '/api/characters/9/storyteller-notes': [], '/api/wizard': { enabled: false, messages: [] }, '/api/auth/providers': { discord: false } };
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  let posted = null, proposed = null, puts = [];
  await page.route('**/api/**', route => { const k = new URL(route.request().url()).pathname, m = route.request().method();
    if (m === 'POST' && k === '/api/characters') { posted = JSON.parse(route.request().postData()); return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...posted, id: 5 }) }); }
    if (m === 'POST' && k.endsWith('/edit-request')) { proposed = JSON.parse(route.request().postData()).proposed; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, applied: true }) }); }
    if (m === 'PUT') { puts.push(JSON.parse(route.request().postData())); return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); }
    if (m === 'POST') return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    const body = api[k] ?? null; if (body === null) return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }); });
  await page.goto(`http://localhost:${server.address().port}/`); await page.waitForTimeout(800);
  const log = (...a) => console.log(...a);
  const emblem = () => page.$eval('.creator-content', e => ({ has: e.classList.contains('has-emblem'), v: e.style.getPropertyValue('--emblem') }));

  // Awakened Step I
  await page.evaluate(() => App.startNewCharacter()); await page.waitForTimeout(200);
  await page.click('.char-type-card[data-char-type="awakened"]'); await page.waitForTimeout(500);
  log('awakened about block:', await page.$$eval('.about-block input, .about-block textarea', xs => xs.map(x => x.id)));
  log('no emblem before choosing:', JSON.stringify(await emblem()));
  await page.click('.tradition-card[data-tradition="Order of Hermes"]'); await page.waitForTimeout(500);
  log('hermes emblem:', JSON.stringify(await emblem()));
  await page.click('.affil-tab[data-affil="Technocracy"]'); await page.click('.tradition-card[data-tradition="Iteration X"]'); await page.waitForTimeout(500);
  log('iteration x emblem:', JSON.stringify(await emblem()));
  await page.click('.affil-tab[data-affil="Disparates"]'); await page.click('.tradition-card[data-tradition="Hollow Ones"]'); await page.waitForTimeout(500);
  log('disparate falls back to group:', JSON.stringify(await emblem()));
  await page.click('.affil-tab[data-affil="Traditions"]'); await page.click('.tradition-card[data-tradition="Order of Hermes"]'); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(__dirname, 'emb-top.png') });
  await page.evaluate(() => window.scrollTo(0, 700)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(__dirname, 'emb-scrolled.png') });
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); window.scrollTo(0, 0); }); await page.waitForTimeout(500); await page.screenshot({ path: path.join(__dirname, 'emb-light.png') });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.fill('#f-gender', 'nonbinary'); await page.fill('#f-pronouns', 'they/them'); await page.fill('#f-motivation', 'Find the lost library.'); await page.fill('#f-description', 'Ink-stained hands.');
  log('pronoun suggestions:', await page.$$eval('#pronoun-options option', xs => xs.length));
  log('char fields:', await page.evaluate(() => JSON.stringify([Creator.char.gender, Creator.char.pronouns, Creator.char.motivation, Creator.char.description])));
  await page.screenshot({ path: path.join(__dirname, 'step0.png') });
  let notesStep = -1; for (let i = 1; i < 9 && notesStep < 0; i++) { await page.evaluate(n => { Creator.step = n; Creator.renderStep(); }, i); await page.waitForTimeout(150); if (await page.$('#f-notes')) notesStep = i; }
  log('final step', notesStep, ': description box moved out:', await page.$('#f-description') === null, '| notes still there:', await page.$('#f-notes') !== null);
  // Mortal + Sorcerer
  for (const t of ['mortal', 'sorcerer']) {
    await page.evaluate(() => App.startNewCharacter()); await page.waitForTimeout(200);
    await page.click(`.char-type-card[data-char-type="${t}"]`); await page.waitForTimeout(500);
    log(t, 'about block:', await page.$$eval('.about-block input, .about-block textarea', xs => xs.map(x => x.id)), '| old motivation box gone:', await page.$('#f-mortal-motivation') === null, '| no emblem:', JSON.stringify(await emblem()));
    await page.fill('#f-motivation', 'Because someone has to.'); await page.fill('#f-pronouns', 'he/him');
    log(t, 'saved to char:', await page.evaluate(() => [Creator.char.motivation, Creator.char.pronouns, Creator.char.notes].join(' | ')));
  }
  await page.selectOption('#f-sorc-affiliation', 'ancient_order_of_the_aeon_rites'); await page.waitForTimeout(500);
  log('sorcerer emblem after affiliation:', JSON.stringify(await emblem()));
  // Sheet
  await page.evaluate(() => App.viewCharacter(9)); await page.waitForTimeout(600);
  log('sheet pronouns cell:', await page.$$eval('.sheet-bio-input', xs => xs.map(x => x.dataset.bioKey + '=' + x.value).join(',')));
  log('sheet motivation:', await page.$eval('#sheet-motiv-input', e => e.value));
  await page.fill('#sheet-motiv-input', 'To heal the land, slowly.'); await page.click('#sheet-desc-input'); await page.waitForTimeout(500);
  log('motivation PUT:', JSON.stringify(puts.find(p => 'motivation' in p)));
  await page.fill('.sheet-bio-input[data-bio-key="pronouns"]', 'she/they'); await page.keyboard.press('Tab'); await page.waitForTimeout(400);
  log('bio PUT has pronouns:', JSON.stringify(puts.find(p => 'pronouns' in p)?.pronouns));
  // Free edit
  await page.evaluate(() => App.editCharacter(9)); await page.waitForTimeout(700);
  log('free edit fields:', await page.$$eval('[data-fe-field="gender"],[data-fe-field="pronouns"],[data-fe-field="motivation"]', xs => xs.map(x => x.dataset.feField + '=' + x.value)));
  await page.fill('[data-fe-field="motivation"]', 'FE motive'); await page.click('#fe-save-btn'); await page.waitForTimeout(600);
  log('free edit proposed:', proposed?.motivation, proposed?.pronouns);
  const md = await page.evaluate(() => Obsidian._charMd(Sheet.char || {}, ''));
  log('markdown:', /pronouns: "/.test(md), /## Motivation/.test(md));
  log('ERRORS:', errors.length ? errors : 'none');
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
