// The Nephandi idle escalation, and the admin message form.
//
//   node tools/darrell-void-test.js [screenshot-dir]
//
// Same harness as tools/nephandi-glitch-test.js: the real server on a throwaway
// DATA_DIR, headless Chromium over the DevTools protocol, no playwright package.
// This one is slow on purpose — it sits through the whole sequence in real time
// rather than reaching into the closure to shorten it, because the timing IS the
// feature. Budget about two minutes.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'void-shots');
const PORT = +(process.env.PORT || 8029);
const CDP = +(process.env.CDP_PORT || 9342);
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + msg); cond ? pass++ : fail++; };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'void-test-'));
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: APP, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), NODE_ENV: 'development', SESSION_SECRET: 'darrell-void-test' },
  });
  let log = '';
  server.stdout.on('data', d => { log += d; });
  server.stderr.on('data', d => { log += d; });

  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${CDP}`, '--window-size=1280,900',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'void-cdp-')), 'about:blank'], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) break; } catch {}
      await sleep(250);
    }
    let targets;
    for (let i = 0; i < 60; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); if (targets.length) break; } catch {}
      await sleep(250);
    }
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
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
    // Poll an expression until it is truthy, or give up. Returns how long it took.
    const waitFor = async (expr, ms, step = 250) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (await evaluate(expr)) return Date.now() - t0;
        await sleep(step);
      }
      return -1;
    };
    const shot = async (name, h = 900) => {
      const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1280, height: h, scale: 1 } });
      fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.result.data, 'base64'));
    };

    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(2600);

    // ══ The admin message form ════════════════════════════════════════════════
    const logged = await evaluate(`fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username:'admin', password:'admin' }) }).then(r => r.status)`);
    ok(logged === 200, `signed in as the development admin (${logged})`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(2800);
    await evaluate('App.showAdminWizard()');
    await sleep(1200);

    const form = await evaluate(`(() => {
      const wrap = document.querySelector('.wiz-add');
      const ta = document.getElementById('wiz-new');
      const sel = document.querySelector('.wiz-cat-new');
      const btn = document.getElementById('wiz-add-btn');
      if (!wrap || !ta || !sel) return null;
      const w = wrap.getBoundingClientRect(), t = ta.getBoundingClientRect(), s = sel.getBoundingClientRect();
      return {
        formW: Math.round(w.width), taW: Math.round(t.width), taH: Math.round(t.height),
        selW: Math.round(s.width), selBelow: s.top >= t.bottom - 1,
        btnRight: btn.getBoundingClientRect().right <= w.right + 1,
        maxlength: ta.getAttribute('maxlength'),
        count: document.getElementById('wiz-new-count').textContent
      };
    })()`);
    ok(form !== null, 'the add-message form rendered');
    ok(form.taW >= form.formW * 0.95, `the message box spans the form (${form.taW}px of ${form.formW}px)`);
    ok(form.selW <= form.formW * 0.3, `the category select is small (${form.selW}px of ${form.formW}px)`);
    ok(form.selBelow, 'the category select sits below the message box, not beside it');
    ok(form.taH >= 90, `the message box is tall enough to write in (${form.taH}px)`);

    // ══ The cap ═══════════════════════════════════════════════════════════════
    ok(form.maxlength === '160', `the box stops at the cap (maxlength ${form.maxlength})`);
    ok(/^0\/160$/.test(form.count.trim()), `a live counter shows the cap (${form.count.trim()})`);
    const counter = await evaluate(`(() => {
      const ta = document.getElementById('wiz-new');
      ta.value = 'x'.repeat(160);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      const el = document.getElementById('wiz-new-count');
      return { text: el.textContent.trim(), full: el.classList.contains('wiz-count-full') };
    })()`);
    ok(counter.text === '160/160' && counter.full, `the counter marks the cap as reached (${counter.text})`);
    const over = await evaluate(`fetch('/api/admin/wizard-messages', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text: 'y'.repeat(161) }) }).then(r => r.status)`);
    ok(over === 400, `the server refuses 161 characters as well (${over})`);
    const atCap = await evaluate(`fetch('/api/admin/wizard-messages', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text: 'z'.repeat(160), category: 'corrupted' }) }).then(r => r.json()).then(j => j.id || 0)`);
    ok(atCap > 0, 'exactly 160 is accepted');
    await evaluate(`fetch('/api/admin/wizard-messages/${atCap}', { method:'DELETE' }).then(r => r.status)`);
    await shot('01-admin-form', 760);

    // ══ The void ══════════════════════════════════════════════════════════════
    await evaluate('App.newCharacterOfType("nephandi"); "ok"');
    await sleep(1600);
    const OUTM = `document.dispatchEvent(new MouseEvent('mousemove',{clientX:40,clientY:window.innerHeight-40,bubbles:true})); 'ok'`;
    const SETTLE = `(()=>{const b=document.getElementById('wizard-balloon');
      if(!b.classList.contains('wizard-balloon-visible'))
        document.getElementById('wizard-darrell').dispatchEvent(new TransitionEvent('transitionend',{propertyName:'transform'}));
      return b.className;})()`;
    await evaluate(OUTM);
    await sleep(1000);
    await evaluate(SETTLE);
    await sleep(300);
    ok(await evaluate(`document.querySelectorAll('#wizard-balloon .wiz-char').length > 0`), 'stage 0: the message is melting');

    // 1 — the bubble is left empty, but still there
    const t1 = await waitFor(`(() => { const b = document.getElementById('wizard-balloon');
      return b.classList.contains('wizard-balloon-visible') && !b.classList.contains('wizard-balloon-melting') && !b.textContent.trim(); })()`, 20000);
    ok(t1 > 0, `stage 1: the melted message leaves the bubble empty after ${(t1 / 1000).toFixed(1)}s`);
    await shot('02-blank-bubble');

    // 2 — the bubble itself dissolves
    const t2 = await waitFor(`document.getElementById('wizard-balloon').classList.contains('wizard-balloon-dissolve')`, 8000);
    ok(t2 > 0, `stage 2: the bubble dissolves ${(t2 / 1000).toFixed(1)}s later`);

    // 3 — the site melts away, and Darrell does not
    const t3 = await waitFor(`document.body.classList.contains('neph-void-site')`, 8000);
    ok(t3 > 0, `stage 3: the site starts melting ${(t3 / 1000).toFixed(1)}s after that`);
    const exempt = await evaluate(`(() => {
      const anim = el => el ? getComputedStyle(el).animationName : 'MISSING';
      const kids = [...document.body.children].filter(e => !['SCRIPT','TEMPLATE'].includes(e.tagName));
      const sinking = kids.filter(e => getComputedStyle(e).animationName === 'neph-void-sink').length;
      return { picture: anim(document.getElementById('wizard-picture')),
               balloon: anim(document.getElementById('wizard-balloon')),
               body: anim(document.body), sinking, kids: kids.length };
    })()`);
    ok(exempt.picture === 'none', `Darrell is exempt from the melt (${exempt.picture})`);
    ok(exempt.sinking >= 3 && exempt.sinking === exempt.kids - 2,
      `every other top-level element melts (${exempt.sinking} of ${exempt.kids}, Darrell and his bubble excepted)`);
    ok(exempt.body === 'neph-void-black', `the page itself goes to black (${exempt.body})`);
    await sleep(9000);
    await shot('03-melting');

    // 4 — the sigils
    const t4 = await waitFor(`!!document.getElementById('neph-void')`, 12000);
    ok(t4 > 0, `stage 4: the sigil layer arrives ${(t4 / 1000).toFixed(1)}s into the melt`);
    const first = await evaluate(`document.querySelectorAll('#neph-void .neph-sigil').length`);
    await sleep(4000);
    const later = await evaluate(`document.querySelectorAll('#neph-void .neph-sigil').length`);
    await sleep(4000);
    const latest = await evaluate(`document.querySelectorAll('#neph-void .neph-sigil').length`);
    ok(later > first && latest > later, `they accumulate (${first} -> ${later} -> ${latest})`);
    ok(latest - later > later - first, `and they accumulate faster (+${later - first}, then +${latest - later})`);
    const sig = await evaluate(`(() => {
      const el = document.querySelector('#neph-void .neph-sigil');
      const svg = el.querySelector('svg');
      return { paths: svg.querySelectorAll('path').length, stroke: getComputedStyle(svg).stroke,
               layerZ: getComputedStyle(document.getElementById('neph-void')).zIndex,
               darrellZ: getComputedStyle(document.getElementById('wizard-darrell')).zIndex,
               events: getComputedStyle(document.getElementById('neph-void')).pointerEvents };
    })()`);
    ok(sig.paths >= 2, `each sigil is drawn from several strokes (${sig.paths})`);
    ok(+sig.layerZ < +sig.darrellZ, `the sigils fill in behind Darrell (${sig.layerZ} < ${sig.darrellZ})`);
    ok(sig.events === 'none', 'the sigil layer never takes a pointer event');
    await shot('04-sigils');

    // ══ The snap back ═════════════════════════════════════════════════════════
    const back = await evaluate(`(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: window.innerHeight - 42, bubbles: true }));
      // Read synchronously, in the same task: "instantly" means no frame of it.
      return { site: document.body.classList.contains('neph-void-site'),
               layer: !!document.getElementById('neph-void'),
               dissolve: document.getElementById('wizard-balloon').classList.contains('wizard-balloon-dissolve'),
               bodyAnim: getComputedStyle(document.body).animationName,
               headerAnim: getComputedStyle(document.getElementById('app-header')).animationName };
    })()`);
    ok(!back.site && !back.layer && !back.dissolve, 'a mouse move takes all of it down in the same task');
    ok(back.bodyAnim === 'none' && back.headerAnim === 'none', `nothing is left animating (body ${back.bodyAnim}, header ${back.headerAnim})`);
    const talking = await waitFor(`document.querySelectorAll('#wizard-balloon .wiz-char').length > 0`, 4000);
    ok(talking >= 0, 'and he starts talking again rather than standing mute');
    await shot('05-snapped-back');

    // A keystroke has to work too — typing in the creator with the pointer
    // parked in his corner must not dissolve the page out from under it. This
    // has to go through the real sequence: snapping back is a no-op unless a
    // stage is actually running, so planting the class by hand proves nothing.
    const atStage1 = await waitFor(`(() => { const b = document.getElementById('wizard-balloon');
      return b.classList.contains('wizard-balloon-visible') && !b.classList.contains('wizard-balloon-melting') && !b.textContent.trim(); })()`, 20000);
    ok(atStage1 > 0, `back into stage 1 after ${(atStage1 / 1000).toFixed(1)}s, without touching the mouse`);
    const byKey = await evaluate(`(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      // Same task again: he should already be mid-sentence.
      return { chars: document.querySelectorAll('#wizard-balloon .wiz-char').length,
               site: document.body.classList.contains('neph-void-site'),
               dissolve: document.getElementById('wizard-balloon').classList.contains('wizard-balloon-dissolve') };
    })()`);
    ok(byKey.chars > 0 && !byKey.site && !byKey.dissolve,
      `a keystroke takes it down too, and he starts a new line (${byKey.chars} characters)`);

    // ══ Reduced motion never starts it ════════════════════════════════════════
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await sleep(300);
    await evaluate(`document.dispatchEvent(new MouseEvent('mousemove',{clientX:900,clientY:200,bubbles:true})); 'ok'`);
    await sleep(1100);
    await evaluate(OUTM);
    await sleep(1000);
    await evaluate(SETTLE);
    await sleep(9000);
    const rm = await evaluate(`(() => ({
      site: document.body.classList.contains('neph-void-site'),
      layer: !!document.getElementById('neph-void'),
      dissolve: document.getElementById('wizard-balloon').classList.contains('wizard-balloon-dissolve'),
      chars: document.querySelectorAll('#wizard-balloon .wiz-char').length,
      text: document.getElementById('wizard-balloon').textContent.trim().length
    }))()`);
    ok(!rm.site && !rm.layer && !rm.dissolve, 'prefers-reduced-motion: nine seconds in, none of the void has started');
    ok(rm.chars === 0 && rm.text > 0, 'prefers-reduced-motion: he just says his piece and stays');
    await send('Emulation.setEmulatedMedia', { features: [] });

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.kill('SIGTERM');
    await sleep(300);
    if (fail) console.log('\n--- server log ---\n' + log.slice(-1200));
  }

  console.log(`\n${pass} passed, ${fail} failed · screenshots in ${OUT}`);
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
