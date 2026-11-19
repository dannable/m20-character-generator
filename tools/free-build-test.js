// Free Build end to end: the way in, the live XP meter, the absence of rules.
//
//   node tools/free-build-test.js [screenshot-dir]
//
// The server runs with RULES_ENFORCE=1 on purpose. With enforcement off every
// character saves regardless and "the rules were skipped" would prove nothing;
// with it on, an illegal sheet is a 400 unless the mode really does exempt it.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'fb-shots');
const PORT = +(process.env.PORT || 8031);
const CDP = +(process.env.CDP_PORT || 9344);
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); c ? pass++ : fail++; };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-test-'));
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: APP, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), NODE_ENV: 'development',
           SESSION_SECRET: 'free-build-test', RULES_ENFORCE: '1' },
  });
  let log = ''; server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });

  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${CDP}`, '--window-size=1280,900',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'fb-cdp-')), 'about:blank'], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) break; } catch {} await sleep(250); }
    let targets;
    for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
    const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });
    let id = 0; const pending = new Map();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      const exc = r.result && r.result.exceptionDetails;
      if (exc) throw new Error('page threw: ' + (exc.exception?.description || JSON.stringify(exc)).slice(0, 400));
      return r.result?.result?.value;
    };
    const shot = async (n, h = 900) => {
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1280, height: h, scale: 1 } });
      fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(s.result.data, 'base64'));
    };

    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(2600);
    await evaluate('Auth.enterAsGuest()');
    await sleep(2200);

    ok(await evaluate('typeof BuildXP === "object" && typeof BuildXP.compute === "function"'), 'build-xp.js is loaded in the page');
    ok(await evaluate('xpCost("sphere", 2, true) === BuildXP.cost("sphere", 2, true)'),
      'app.js xpCost() and BuildXP.cost() are the same table, not two copies');

    // ── The way in ──────────────────────────────────────────────────────────
    await evaluate('App.showPage("char-type"); App._attachCharTypePicker(); "ok"');
    await sleep(500);
    ok(await evaluate('!!document.querySelector(".char-type-card-free")'), 'the picker offers a Free Build card');
    await shot('01-picker', 1000);
    await evaluate('document.querySelector(".char-type-card-free").click(); "ok"');
    await sleep(500);
    const dlg = await evaluate(`(() => ({
      open: document.getElementById('modal-overlay').style.display === 'flex',
      title: document.getElementById('modal-title').textContent,
      kinds: [...document.querySelectorAll('#fbuild-kind option')].map(o => o.value),
      freebies: document.getElementById('fbuild-freebies').checked
    }))()`);
    ok(dlg.open && /Free Build/.test(dlg.title), 'it opens the Free Build dialog');
    ok(dlg.kinds.join(',') === 'awakened,nephandi,mortal,sorcerer', `it asks what the character is (${dlg.kinds.join(', ')})`);
    ok(dlg.freebies === true, 'freebies are on by default');
    await shot('02-dialog');

    await evaluate(`(() => { document.getElementById('fbuild-name').value = 'Unbound';
      document.getElementById('fbuild-kind').value = 'awakened';
      document.getElementById('fbuild-freebies').checked = false;
      document.getElementById('modal-confirm').click(); return 'go'; })()`);
    await sleep(2200);

    // ── Straight into Free Edit, with a meter ───────────────────────────────
    const landed = await evaluate(`(() => ({
      page: [...document.querySelectorAll('.page')].filter(p => p.classList.contains('active')).map(p => p.id)[0],
      meter: !!document.getElementById('fb-xp-meter'),
      total: (document.querySelector('#fb-xp-meter .fb-xp-total strong') || {}).textContent,
      mode: FreeEdit.char.build_mode, fb: FreeEdit.char.build_freebies,
      type: FreeEdit.char.character_type, id: FreeEdit.char.id,
      draft: FreeEdit.char.is_draft
    }))()`);
    ok(landed.page === 'page-free-edit', `it goes straight to the unrestricted editor (${landed.page})`);
    ok(landed.meter, 'with the XP meter on it');
    ok(landed.total === '0', `a fresh sheet prices at ${landed.total} XP`);
    ok(landed.mode === 'free' && landed.fb === 0, `the mode round-tripped through the server (build_mode=${landed.mode}, freebies=${landed.fb})`);
    ok(!landed.draft, 'and it is a real character, not a draft stuck in the creator');

    // ── The meter follows the sheet ─────────────────────────────────────────
    const raised = await evaluate(`(() => {
      FreeEdit.char.strength = 5;                   // 1->5 = 4+8+12+16 = 40
      FreeEdit.char.talents = { alertness: 5 };     // 0->5 = 3+2+4+6+8 = 23
      FreeEdit.char.spheres = { forces: 5 };        // 0->5 = 10+8+16+24+32 = 90, over the creation cap of 3
      FreeEdit.char.arete = 5;                      // also over the cap of 3: 8+16+24+32 = 80
      FreeEdit._updateXpMeter();
      return { total: document.querySelector('#fb-xp-meter .fb-xp-total strong').textContent,
               expect: 40 + 23 + 90 + 80,
               lines: [...document.querySelectorAll('#fb-xp-meter .fb-xp-row > span:first-child')].map(s => s.textContent.trim()) };
    })()`);
    ok(+raised.total === raised.expect, `the meter reprices the sheet live (${raised.total} XP, expected ${raised.expect})`);
    ok(raised.lines.includes('Attributes') && raised.lines.includes('Spheres'), `and breaks it down (${raised.lines.slice(0, 4).join(', ')})`);

    // A real dot click, through the editor's own handler.
    const clicked = await evaluate(`(() => new Promise(resolve => {
      const before = document.querySelector('#fb-xp-meter .fb-xp-total strong').textContent;
      const dots = document.querySelector('.fe-dots[data-fe-field="dexterity"]');
      dots.querySelectorAll('.dot')[4].click();     // Dexterity to 5
      setTimeout(() => resolve({ before, after: document.querySelector('#fb-xp-meter .fb-xp-total strong').textContent,
                                 dex: FreeEdit.char.dexterity }), 60);
    }))()`);
    ok(clicked.dex === 5, 'clicking the fifth dot sets the trait to 5 with nothing in the way');
    ok(+clicked.after === +clicked.before + 40, `and the meter follows the click (${clicked.before} -> ${clicked.after})`);
    await shot('03-editor', 1100);

    // ── No caps, and no rules ───────────────────────────────────────────────
    const saved = await evaluate(`FreeEdit._save().then(() => 'saved').catch(e => 'ERR ' + e.message)`);
    await sleep(1800);
    ok(saved === 'saved', `a Sphere at 5 and Arete at 5 — both over the creation cap of 3 — save without complaint (${saved})`);

    const reread = await evaluate(`fetch('/api/characters/${landed.id}').then(r => r.json()).then(c => ({
      mode: c.build_mode, fb: c.build_freebies, str: c.strength,
      alertness: (typeof c.talents === 'string' ? JSON.parse(c.talents) : c.talents).alertness,
      arete: c.arete, forces: (typeof c.spheres === 'string' ? JSON.parse(c.spheres) : c.spheres).forces }))`);
    ok(reread.mode === 'free' && reread.fb === 0, 'the columns survive the round trip');
    ok(reread.str === 5 && reread.alertness === 5, 'and so do the traits that no budget would have allowed');
    ok(reread.arete === 5 && reread.forces === 5, `including the ones over the validator's own caps (Arete ${reread.arete}, Forces ${reread.forces})`);

    // The control: the same illegal sheet WITHOUT the mode must be refused,
    // or this test would pass even if the exemption did nothing.
    const illegal = { name: 'Over Budget', character_type: 'awakened', affiliation: 'Traditions',
      strength: 5, dexterity: 5, stamina: 5, charisma: 5, manipulation: 5, appearance: 5,
      perception: 5, intelligence: 5, wits: 5, arete: 5, willpower: 5,
      talents: { alertness: 5 }, spheres: { forces: 5 }, is_draft: 0 };
    const refused = await evaluate(`fetch('/api/characters', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(${JSON.stringify(illegal)}) }).then(r => r.json().then(j => ({ s: r.status, n: (j.violations && j.violations.errors || []).length })))`);
    ok(refused.s === 400 && refused.n > 0, `the same sheet without Free Build is refused with ${refused.n} violation(s) (${refused.s})`);
    const allowed = await evaluate(`fetch('/api/characters', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(Object.assign(${JSON.stringify(illegal)}, { name:'Unbound Two', build_mode:'free', build_freebies:1 })) })
      .then(r => r.json().then(j => ({ s: r.status, id: j.id, mode: j.build_mode })))`);
    ok(allowed.s === 201 && allowed.mode === 'free', `and accepted with it (${allowed.s})`);

    // Leaving the mode must clear the flag rather than leave it half-set.
    const left = await evaluate(`fetch('/api/characters/${allowed.id}', { method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ build_mode: '' }) }).then(r => r.json()).then(c => ({ mode: c.build_mode, fb: c.build_freebies }))`);
    ok(left.mode === '' && left.fb === 1, `dropping the mode resets the freebie flag too (mode "${left.mode}", freebies ${left.fb})`);

    // ── The sheet reports it ────────────────────────────────────────────────
    await evaluate(`App.viewCharacter(${landed.id})`);
    await sleep(2000);
    const band = await evaluate(`(() => {
      const el = document.querySelector('.sheet-freebuild');
      if (!el) return null;
      const c = Sheet.char;
      const r = BuildXP.compute(c, { freebies: c.build_freebies !== 0 });
      return { text: el.textContent.replace(/\\s+/g, ' ').trim(), total: r.total };
    })()`);
    ok(band !== null, 'the sheet carries a Free Build band');
    ok(band && band.text.includes(String(band.total)) && /without creation budgets/.test(band.text),
      `and states the price and the absence of budgets: "${band && band.text.slice(0, 90)}"`);
    await shot('04-sheet', 1400);

    // ── A normal character is untouched by any of this ──────────────────────
    await evaluate('App.newCharacterOfType("awakened"); "ok"');
    await sleep(1600);
    const normal = await evaluate(`(() => ({
      page: [...document.querySelectorAll('.page')].filter(p => p.classList.contains('active')).map(p => p.id)[0],
      mode: Creator.char.build_mode,
      // The hidden Free Edit page keeps its markup, so ask whether the meter is
      // on screen rather than whether it exists.
      meter: (document.getElementById('fb-xp-meter') || { getClientRects: () => [] }).getClientRects().length > 0,
      steps: Creator._steps().length }))()`);
    ok(normal.page === 'page-creator', 'the ordinary path still opens the creator');
    ok(normal.mode === undefined, 'and carries no build_mode');
    ok(!normal.meter && normal.steps === 7, `with the usual seven steps and no XP meter (${normal.steps})`);

    ws.close();
  } finally {
    chrome.kill('SIGKILL'); server.kill('SIGTERM'); await sleep(300);
    if (fail) console.log('\n--- server log ---\n' + log.slice(-1600));
  }
  console.log(`\n${pass} passed, ${fail} failed · screenshots in ${OUT}`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
