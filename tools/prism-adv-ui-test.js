const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const pub = path.resolve(process.argv[2]);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => { let f = path.join(pub, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(pub, 'index.html'); res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
const user = { id: 2, username: 'p', email: 't@x', role: 'awakened', is_active: 1, timezone: 'UTC', default_focus_mode: 'core' };
const char0 = { id: 9, user_id: 2, name: 'Mira', player: '', chronicle: '', concept: 'Seeker', affiliation: 'Traditions', tradition: 'Verbena', faction: '', essence: 'Dynamic', nature: 'Architect', demeanor: 'Pedagogue', strength: 2, dexterity: 2, stamina: 2, charisma: 2, manipulation: 2, appearance: 2, perception: 2, intelligence: 2, wits: 2, talents: {}, skills: {}, knowledges: {}, backgrounds: {}, spheres: { life: 2 }, affinity_sphere: 'life', arete: 2, willpower: 5, quintessence: 0, paradox: 0, paradigm: '', practice: '', instruments: [], freebie_spent: {}, merits: {}, flaws: {}, specialties: {}, description: 'Tall.', notes: '', attr_priority: [], ability_priority: [], is_draft: 0, chronicle_id: null, character_type: 'awakened', resonance: [], rotes: [], wonders: [], xp_earned: 0, xp_log: [], custom_ability_names: {}, merit_labels: {}, gender: 'woman', pronouns: 'she/her', motivation: 'To heal the land.' };
const api = { '/api/auth/me': user, '/api/custom/merits-flaws': { items: [] }, '/api/custom/rotes': { items: [] }, '/api/custom/backgrounds': { items: [] }, '/api/custom/wonders': { items: [] }, '/api/chronicles/custom/member-content': { chronicles: [] }, '/api/characters/recent': [], '/api/characters/attention-summary': [], '/api/chronicles': [], '/api/characters': [], '/api/characters/9/storyteller-notes': [], '/api/wizard': { enabled: false, messages: [] }, '/api/auth/providers': { discord: false } };
const char = { ...char0, name: 'Prismatic', focus_mode: 'prism', tenets: { metaphysical: 'rational_universe', personal: 'i_am_special', ascension: 'full_knowledge' }, practice_ratings: { alchemy: 1 }, practice_specialties: {}, paradigm_preset: 'x', arete: 3, talents: {}, skills: { crafts: 2, science: 2 }, knowledges: { medicine: 2, esoterica: 1 }, xp_earned: 40, xp_log: [{ type: 'award', amount: 40, note: '', date: '2026-01-01' }] };
api['/api/characters/9'] = char; api['/api/characters'] = [char];
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  const spends = []; let cur = JSON.parse(JSON.stringify(char));
  await page.route('**/api/**', route => { const k = new URL(route.request().url()).pathname, m = route.request().method();
    if (m === 'POST' && k.endsWith('/xp/spend')) { const b = JSON.parse(route.request().postData()); spends.push(b); cur.xp_log.push({ type: 'spend', ...b, date: '2026-01-02' }); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, xp_log: cur.xp_log }) }); }
    const body = api[k] ?? null; if (body === null) return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }); });
  await page.goto(`http://localhost:${server.address().port}/`); await page.waitForTimeout(800);
  const log = (...a) => console.log(...a);
  await page.evaluate(c => Advancement.show(c), char); await page.waitForTimeout(400);
  log('section present:', !!(await page.$('#adv-prism')));
  log('practice rows:', await page.$$eval('#adv-prism .adv-trait-row .adv-trait-name', xs => xs.map(x => x.textContent.trim())));
  log('alchemy raise button:', await page.$eval('#adv-prism .adv-raise-btn[data-key="alchemy"]', b => ({ cost: b.dataset.cost, disabled: b.disabled })));
  log('learn options (first 3):', await page.$$eval('.prism-adv-learn option', os => os.slice(0, 3).map(o => o.textContent.trim().slice(0, 60))));
  log('arete note:', await page.$eval('.adv-info-note:last-of-type', () => '') , await page.$$eval('.adv-info-note', xs => xs.filter(x => /capped/.test(x.textContent)).map(x => x.textContent.trim().slice(0, 80))));
  log('arete raise disabled (cap 3, arete 3):', await page.$$eval('.adv-trait-row', rs => { const r = rs.find(x => /^\s*Arete/.test(x.textContent)); return r ? !r.querySelector('.adv-raise-btn') : 'no row'; }));
  // raise alchemy 1 -> 2 costs 1
  await page.click('#adv-prism .adv-raise-btn[data-key="alchemy"]'); await page.waitForTimeout(300);
  log('spend 1:', JSON.stringify(spends[0]));
  // learn a practice with enough abilities
  const learnable = await page.$$eval('.prism-adv-learn option:not([disabled])', os => os.map(o => o.value).filter(Boolean));
  log('learnable (not blocked):', learnable.length);
  await page.selectOption('.prism-adv-learn', learnable[0]); await page.waitForTimeout(300);
  log('spend 2:', JSON.stringify(spends[1]));
  // tenet replace
  await page.selectOption('.prism-adv-tenet-select[data-cat="metaphysical"]', 'divine_is_real'); await page.waitForTimeout(100);
  log('apply button:', await page.$eval('.prism-adv-tenet-apply[data-cat="metaphysical"]', b => ({ text: b.textContent.trim(), disabled: b.disabled })));
  await page.click('.prism-adv-tenet-apply[data-cat="metaphysical"]'); await page.waitForTimeout(300);
  log('spend 3:', JSON.stringify(spends[2]));
  log('history shows tenet entry:', (await page.$$eval('.adv-log-spend .adv-log-desc', xs => xs.map(x => x.textContent.replace(/\s+/g, ' ').trim()))).filter(t => /Metaphysical/.test(t)));
  // add optional tenet free
  await page.selectOption('.prism-adv-tenet-select[data-cat="social_role"]', 'i_rule'); await page.click('.prism-adv-tenet-apply[data-cat="social_role"]'); await page.waitForTimeout(300);
  log('spend 4 (free):', JSON.stringify(spends[3]));
  log('arete cap lifted note (cap now 4):', await page.$$eval('.adv-info-note', xs => xs.map(x => x.textContent.trim().slice(0, 70)).filter(t => /Tenets cap/.test(t))));
  await page.screenshot({ path: '/tmp/adv-prism.png', fullPage: false });
  const sec = await page.$('#adv-prism'); await sec.screenshot({ path: '/tmp/adv-prism-section.png' });
  // core-mode character: no section
  await page.evaluate(c => Advancement.show({ ...c, focus_mode: 'core' }), char); await page.waitForTimeout(300);
  log('core mode has no prism section:', !(await page.$('#adv-prism')));
  log('ERRORS:', errors.length ? errors : 'none');
  await browser.close(); server.close();
})();
