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

const VOID_DECAY_S = 90;   // must match VOID_DECAY in index.html
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
    // Real time is 3.2s blank + 1.6s bubble + 60s calm + 90s decay + 4min of
    // sigils, which is six and a half minutes of waiting. WizardEgg.speed
    // divides every delay in the sequence and every duration in the stylesheet,
    // so the test watches the same timeline at SPEED times the rate — which
    // also exercises the control itself, since a preview of the effect needs it.
    const SPEED = 10;
    await evaluate('App.newCharacterOfType("nephandi"); "ok"');
    await sleep(1600);
    await evaluate(`WizardEgg.speed = ${SPEED}; "ok"`);
    const OUTM = `document.dispatchEvent(new MouseEvent('mousemove',{clientX:40,clientY:window.innerHeight-40,bubbles:true})); 'ok'`;
    const SETTLE = `(()=>{const b=document.getElementById('wizard-balloon');
      if(!b.classList.contains('wizard-balloon-visible'))
        document.getElementById('wizard-darrell').dispatchEvent(new TransitionEvent('transitionend',{propertyName:'transform'}));
      return b.className;})()`;
    await evaluate(OUTM);
    await sleep(1000);
    await evaluate(SETTLE);
    await sleep(200);
    ok(await evaluate(`document.querySelectorAll('#wizard-balloon .wiz-char').length > 0`), 'stage 0: the message is melting');
    ok(await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--neph-spd').trim() === '${SPEED}'`),
      'the speed control reaches the stylesheet as --neph-spd');
    // The size it reached while full, to compare against once it is empty.
    const fullBox = await evaluate(`(() => { const r = document.getElementById('wizard-balloon').getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) }; })()`);

    // 1 — the bubble is left empty, AT THE SIZE IT HAD. Emptying the text used
    //     to collapse it to one blank line, which read as a resize and a jump.
    const t1 = await waitFor(`(() => { const b = document.getElementById('wizard-balloon');
      return b.classList.contains('wizard-balloon-visible') && !b.classList.contains('wizard-balloon-melting') && !b.textContent.trim(); })()`, 20000);
    ok(t1 > 0, `stage 1: the melted message leaves the bubble empty after ${(t1 / 1000).toFixed(1)}s at ${SPEED}x`);
    const blankBox = await evaluate(`(() => { const r = document.getElementById('wizard-balloon').getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) }; })()`);
    ok(Math.abs(blankBox.w - fullBox.w) <= 1 && Math.abs(blankBox.h - fullBox.h) <= 1,
      `the empty bubble keeps its size (${fullBox.w}x${fullBox.h} -> ${blankBox.w}x${blankBox.h})`);
    ok(blankBox.top === fullBox.top && blankBox.left === fullBox.left,
      `and does not move (${fullBox.left},${fullBox.top})`);
    ok(await evaluate(`!document.getElementById('wizard-eyes').classList.contains('neph-eyes-live')`),
      'his eyes are not pulsing yet — the bubble is still there');

    // 2 — the bubble dissolves where it stands, with no transform of its own
    const t2 = await waitFor(`document.getElementById('wizard-balloon').classList.contains('wizard-balloon-dissolve')`, 8000);
    ok(t2 > 0, `stage 2: the bubble dissolves ${(t2 / 1000).toFixed(1)}s later`);
    const dissolving = await evaluate(`(() => {
      const b = document.getElementById('wizard-balloon'), r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      return { w: Math.round(r.width), h: Math.round(r.height), anim: cs.animationName,
               frames: [...document.styleSheets].flatMap(sh => { try { return [...sh.cssRules]; } catch (e) { return []; } })
                 .filter(r2 => r2.type === CSSRule.KEYFRAMES_RULE && r2.name === 'wiz-balloon-dissolve')
                 .map(r2 => [...r2.cssRules].map(k => k.style.transform).join('|'))[0] };
    })()`);
    ok(Math.abs(dissolving.w - fullBox.w) <= 1 && Math.abs(dissolving.h - fullBox.h) <= 1,
      `it keeps that size as it dissolves (${dissolving.w}x${dissolving.h})`);
    ok(!dissolving.frames || !/translate|scale/.test(dissolving.frames),
      `and the dissolve itself never transforms it (keyframe transforms: ${JSON.stringify(dissolving.frames)})`);

    // 3 — the eyes take over, and then a long stretch of nothing
    const t3 = await waitFor(`document.getElementById('wizard-eyes').classList.contains('neph-eyes-live')`, 8000);
    ok(t3 > 0, `stage 3: his eyes start pulsing ${(t3 / 1000).toFixed(1)}s later, as the bubble finishes`);
    const eye = await evaluate(`(() => { const e = document.getElementById('wizard-eyes'), cs = getComputedStyle(e);
      const w = document.getElementById('wizard-darrell').getBoundingClientRect(), r = e.getBoundingClientRect();
      return { anim: cs.animationName, iter: cs.animationIterationCount, blend: cs.mixBlendMode,
               events: cs.pointerEvents, dur: cs.animationDuration,
               aligned: Math.abs(r.left - w.left) < 2 && Math.abs(r.bottom - w.bottom) < 2 && Math.abs(r.width - w.width) < 2 }; })()`);
    ok(eye.anim === 'neph-eye-pulse' && eye.iter === 'infinite', `they pulse on a loop (${eye.anim}, ${eye.iter})`);
    ok(eye.blend === 'screen', `the glow adds light rather than painting over his face (${eye.blend})`);
    ok(eye.aligned, 'the glow overlay is pinned exactly to the wizard image');
    ok(eye.events === 'none', 'and never takes a pointer event');
    ok(parseFloat(eye.dur) < 2.6, `the pulse honours the speed control too (${eye.dur})`);
    await shot('02-eyes-pulsing');

    // The calm: a full minute of nothing, so nothing may have started.
    await sleep((60000 / SPEED) * 0.55);
    const calm = await evaluate(`(() => ({
      site: document.body.classList.contains('neph-void-site'),
      rotting: document.querySelectorAll('.neph-rot-melt, .neph-rot-decay, .neph-rot-static').length,
      layer: !!document.getElementById('neph-void'),
      eyes: document.getElementById('wizard-eyes').classList.contains('neph-eyes-live')
    }))()`);
    ok(!calm.site && calm.rotting === 0 && !calm.layer,
      'the calm: well past halfway through the minute, nothing has begun to decay');
    ok(calm.eyes, 'his eyes keep pulsing through it');

    // 4 — individual parts come apart, in three different ways
    const t4 = await waitFor(`document.querySelectorAll('.neph-rot-melt, .neph-rot-decay, .neph-rot-static').length > 0`, 60000 / SPEED + 8000);
    ok(t4 > 0, `stage 4: parts of the screen start coming apart after the calm`);
    const rot = await evaluate(`(() => {
      const sel = '.neph-rot-melt, .neph-rot-decay, .neph-rot-static';
      const all = [...document.querySelectorAll(sel)];
      const kinds = {};
      for (const el of all) for (const k of ['melt','decay','static']) if (el.classList.contains('neph-rot-' + k)) kinds[k] = (kinds[k]||0)+1;
      const delays = all.map(e => parseFloat(e.style.animationDelay) || 0);
      const nested = all.filter(e => all.some(o => o !== e && e.contains(o))).length;
      const onDarrell = all.filter(e => e.closest('#wizard-picture, #wizard-balloon, #wizard-eyes')).length;
      return { n: all.length, kinds, nested, onDarrell,
               spread: +(Math.max(...delays) - Math.min(...delays)).toFixed(2),
               maxDelay: +Math.max(...delays).toFixed(2),
               sample: all.slice(0, 3).map(e => (e.className || e.tagName).toString().split(' ')[0]) };
    })()`);
    ok(rot.n > 8, `${rot.n} separate pieces were picked, not the page as one lump`);
    ok(Object.keys(rot.kinds).length === 3, `all three ways are in use: ${JSON.stringify(rot.kinds)}`);
    ok(rot.nested === 0, 'no piece sits inside another piece, so nothing decays twice over');
    ok(rot.onDarrell === 0, 'nothing on Darrell himself was picked');
    ok(rot.spread > (VOID_DECAY_S / SPEED) * 0.3, `they are staggered across the phase, not synchronised (${rot.spread}s apart)`);
    ok(rot.maxDelay <= (VOID_DECAY_S / SPEED) * 0.75, `the last one still starts in time to finish (${rot.maxDelay}s)`);
    await sleep((90000 / SPEED) * 0.45);
    await shot('03-coming-apart');

    // …and the sweep closes it out, taking the page to black
    const t5 = await waitFor(`document.body.classList.contains('neph-void-site')`, 90000 / SPEED);
    ok(t5 > 0, 'the closing sweep starts, catching whatever was off screen');
    ok(await evaluate(`getComputedStyle(document.body).animationName === 'neph-void-black'`), 'the page itself goes to black');
    const exempt = await evaluate(`(() => {
      const anim = el => el ? getComputedStyle(el).animationName : 'MISSING';
      return { picture: anim(document.getElementById('wizard-picture')), eyes: anim(document.getElementById('wizard-eyes')) };
    })()`);
    ok(exempt.picture === 'none', `Darrell is exempt from the sweep (${exempt.picture})`);
    ok(exempt.eyes === 'neph-eye-pulse', `and so is the glow on his eyes (${exempt.eyes})`);

    // 5 — four solid minutes of sigils
    const t6 = await waitFor(`!!document.getElementById('neph-void')`, 90000 / SPEED + 10000);
    ok(t6 > 0, 'stage 5: the sigil layer arrives once the screen is gone');
    const counts = [];
    for (let i = 0; i < 5; i++) {
      counts.push(await evaluate(`document.querySelectorAll('#neph-void .neph-sigil').length`));
      await sleep((240000 / SPEED) / 6);
    }
    ok(counts[4] > counts[0], `they pile up across the run (${counts.join(' -> ')})`);
    const early = counts[1] - counts[0], late = counts[4] - counts[3];
    ok(late > early, `and arrive faster as it goes (+${early} early, +${late} late)`);
    const stillGoing = await evaluate(`(() => {
      const el = document.querySelector('#neph-void .neph-sigil svg');
      const layer = document.getElementById('neph-void'), cs = getComputedStyle(layer);
      return { glow: el.querySelectorAll('.sg-glow').length, core: el.querySelectorAll('.sg-core').length,
               filtered: getComputedStyle(el.parentElement).filter,
               z: cs.zIndex, dz: getComputedStyle(document.getElementById('wizard-darrell')).zIndex,
               events: cs.pointerEvents };
    })()`);
    ok(stillGoing.glow > 0 && stillGoing.glow === stillGoing.core,
      `each sigil glows by a doubled stroke, not a per-element filter (${stillGoing.glow} glow / ${stillGoing.core} core)`);
    ok(stillGoing.filtered === 'none', 'no drop-shadow filter on any of them, which would not scale to hundreds');
    ok(+stillGoing.z < +stillGoing.dz, `they fill in behind Darrell (${stillGoing.z} < ${stillGoing.dz})`);
    ok(stillGoing.events === 'none', 'the sigil layer never takes a pointer event');
    // Two thirds of the way through its four minutes, it must still be running.
    ok(counts[4] > 20 && counts[4] < 800, `${counts[4]} of them by two thirds of the way in, and still going`);
    await shot('04-sigils');

    // ══ The snap back ═════════════════════════════════════════════════════════
    const back = await evaluate(`(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: window.innerHeight - 42, bubbles: true }));
      // Read synchronously, in the same task: "instantly" means no frame of it.
      return { site: document.body.classList.contains('neph-void-site'),
               layer: !!document.getElementById('neph-void'),
               rotting: document.querySelectorAll('.neph-rot-melt, .neph-rot-decay, .neph-rot-static').length,
               eyes: document.getElementById('wizard-eyes').classList.contains('neph-eyes-live'),
               dissolve: document.getElementById('wizard-balloon').classList.contains('wizard-balloon-dissolve'),
               pinned: document.getElementById('wizard-balloon').style.width,
               bodyAnim: getComputedStyle(document.body).animationName,
               headerAnim: getComputedStyle(document.getElementById('app-header')).animationName };
    })()`);
    ok(!back.site && !back.layer && !back.dissolve && !back.eyes, 'a mouse move takes all of it down in the same task');
    ok(back.rotting === 0, 'every decaying piece is handed back untouched');
    ok(!back.pinned, 'and the balloon stops being pinned to its old size');
    ok(back.bodyAnim === 'none' && back.headerAnim === 'none', `nothing is left animating (body ${back.bodyAnim}, header ${back.headerAnim})`);
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
    await sleep(12000);
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
