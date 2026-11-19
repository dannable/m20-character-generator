// Browser test for the Nephandi skin: palette, contrast, and the Se7en word
// glitches in js/nephandi-glitch.js.
//
//   node tools/nephandi-glitch-test.js [screenshot-dir]
//
// Boots the real server on a throwaway DATA_DIR and drives headless Chromium
// over the DevTools protocol with Node's built-in WebSocket — same approach as
// tools/mobile_shots.js, so it needs no playwright package, only the browser
// binary (CHROME=... to point it elsewhere).
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'neph-shots');
const PORT = +(process.env.PORT || 8021);
const CDP = +(process.env.CDP_PORT || 9334);
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + msg); cond ? pass++ : fail++; };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neph-test-'));
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: APP, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), NODE_ENV: 'development', SESSION_SECRET: 'nephandi-glitch-test' },
  });
  let log = '';
  server.stdout.on('data', d => { log += d; });
  server.stderr.on('data', d => { log += d; });

  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${CDP}`, '--window-size=1280,900',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'neph-cdp-')), 'about:blank'], { stdio: 'ignore' });

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
    const shot = async (name, h = 1400) => {
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1280, height: h, scale: 1 } });
      fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.result.data, 'base64'));
    };

    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    // ── Reach the Nephandi creator ──────────────────────────────────────────
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(2600);
    await evaluate('Auth.enterAsGuest()');
    await sleep(2200);

    ok(await evaluate('typeof NephGlitch === "object" && typeof NephGlitch.fire === "function"'),
      'nephandi-glitch.js loaded and exposed NephGlitch');

    await evaluate('App.showPage("dashboard"); App._attachCharTypePicker && App._attachCharTypePicker(); "ok"');
    await sleep(400);
    await evaluate('document.querySelector(".char-type-card-fallen").click(); "ok"');
    await sleep(500);
    ok(await evaluate('!!document.getElementById("nephandi-gate")'), 'the content gate opened before the creator');
    await shot('01-gate');
    await evaluate('document.querySelector(".nephandi-gate-accept").click(); "ok"');
    await sleep(700);
    // Accepting the gate now asks how to build, Guided preselected. The gate
    // comes first on purpose: no point asking how to build something they may
    // decide not to build at all.
    ok(await evaluate('!!document.querySelector(".build-mode-card")'),
      'and the build-mode prompt follows it, not the other way round');
    await evaluate('document.getElementById("modal-confirm").click(); "ok"');
    await sleep(1800);

    ok(await evaluate('document.getElementById("page-creator").classList.contains("nephandi-skin")'),
      'the skin is on #page-creator');
    ok(await evaluate('Creator.char.affiliation === "Nephandi" && Creator.char.character_type === "awakened"'),
      'a Nephandus is an awakened character with affiliation Nephandi');

    // ── Palette ─────────────────────────────────────────────────────────────
    const tok = await evaluate(`(() => {
      const s = getComputedStyle(document.getElementById('page-creator'));
      const r = getComputedStyle(document.documentElement);
      const g = n => [s.getPropertyValue(n).trim(), r.getPropertyValue(n).trim()];
      return { gold: g('--gold-mid'), purple: g('--purple-mid'), crimson: g('--crimson'), maroon: s.getPropertyValue('--neph-maroon').trim() };
    })()`);
    ok(tok.gold[0] === '#b59a4e' && tok.gold[0] !== tok.gold[1], `--gold-mid is overridden in the skin only (${tok.gold[0]} vs ${tok.gold[1]})`);
    ok(tok.purple[0] === '#9a78d2', `--purple-mid is the bruise violet (${tok.purple[0]})`);
    ok(tok.crimson[0] === '#d4655c', `--crimson is the maroon-leaning red (${tok.crimson[0]})`);
    ok(tok.maroon === '#6e2028', `--neph-maroon is defined for rules and borders (${tok.maroon})`);

    // The palette must still read as the house gold/purple/blue, not a new hue
    // family: gold's red channel leads, purple's blue channel leads.
    const hue = await evaluate(`(() => {
      const hex = h => { h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); };
      const s = getComputedStyle(document.getElementById('page-creator'));
      const gold = hex(s.getPropertyValue('--gold-mid').trim());
      const purple = hex(s.getPropertyValue('--purple-mid').trim());
      const bg = hex(s.getPropertyValue('--bg-card').trim());
      return { goldWarm: gold[0] > gold[2] && gold[1] > gold[2], purpleCool: purple[2] > purple[1], bgCool: bg[2] >= bg[0] };
    })()`);
    ok(hue.goldWarm, 'the gold is still gold (red and green channels lead blue)');
    ok(hue.purpleCool, 'the purple is still purple (blue leads green)');
    ok(hue.bgCool, 'the backgrounds stayed the house blue-violet rather than going red');

    // ── Contrast of actually-rendered text ──────────────────────────────────
    const CONTRAST = `(() => {
      const lin = c => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
      const rgb = s => (s.match(/\\d+(\\.\\d+)?/g) || []).slice(0,3).map(Number);
      const lum = c => { const [r,g,b] = c.map(lin); return 0.2126*r + 0.7152*g + 0.0722*b; };
      const bgOf = el => { let n = el; while (n && n !== document.documentElement) {
          const c = getComputedStyle(n).backgroundColor; const v = rgb(c);
          if (v.length === 3 && !/rgba\\(.*,\\s*0\\)/.test(c)) return v; n = n.parentElement; }
        return [10,10,16]; };
      const out = [];
      for (const el of document.querySelectorAll('#page-creator .step-title, #page-creator .fallen-origin-name, #page-creator .fallen-origin-summary, #page-creator .fallen-sect-group-title, #page-creator label, #page-creator .form-hint')) {
        if (!el.getClientRects().length || !el.textContent.trim()) continue;
        const cs = getComputedStyle(el);
        if (parseFloat(cs.fontSize) >= 24 || cs.fontWeight >= 700) continue;   // AA-large
        const fg = rgb(cs.color), bg = bgOf(el);
        if (fg.length !== 3) continue;
        const [hi, lo] = [lum(fg), lum(bg)].sort((a,b) => b-a);
        const ratio = (hi + 0.05) / (lo + 0.05);
        out.push({ ratio: +ratio.toFixed(2), cls: el.className || el.tagName, text: el.textContent.trim().slice(0, 28) });
      }
      out.sort((a,b) => a.ratio - b.ratio);
      return out.slice(0, 5);
    })()`;
    const worst = await evaluate(CONTRAST);
    ok(worst.length > 0 && worst[0].ratio >= 4.5,
      `dark theme: worst rendered body text is ${worst[0] && worst[0].ratio}:1 on "${worst[0] && worst[0].text}" (${worst[0] && worst[0].cls})`);
    await shot('02-creator-dark');

    // ── The glitch: structure ───────────────────────────────────────────────
    const g = await evaluate(`(() => {
      const span = NephGlitch.fire();
      if (!span) return { ok: false };
      return { ok: true, cls: span.className, text: span.textContent,
               words: span.textContent.trim().split(/\\s+/).length,
               flavour: (span.className.match(/neph-g--(\\w+)/) || [])[1],
               anim: getComputedStyle(span).animationName,
               inline: getComputedStyle(span).display,
               live: NephGlitch.liveCount() };
    })()`);
    ok(g.ok && /\bneph-g\b/.test(g.cls), 'fire() wrapped a run in .neph-g');
    ok(g.words >= 1 && g.words <= 3, `it took ${g.words} word(s), as intended (1-3): "${g.text}"`);
    // These two assertions were written before `lurch` existed and were only
    // passing by luck: fire() picks at random, so each run had about a one in
    // seven chance of drawing the one flavour that is deliberately a block box.
    const FLAVOURS = ['jitter', 'flicker', 'smear', 'lurch', 'scratch', 'tremble', 'neg'];
    ok(FLAVOURS.includes(g.flavour), `flavour is one of the seven: ${g.flavour}`);
    ok(g.inline === (g.flavour === 'lurch' ? 'inline-block' : 'inline'),
      `the wrapper is ${g.flavour === 'lurch' ? 'inline-block, which only lurch may be' : 'display:inline so nothing reflows'} (${g.inline})`);
    ok(g.live >= 1, `it is tracked as live (${g.live} live)`);

    // ── The glitch: it happens on its own ───────────────────────────────────
    // Everything above drives fire() by hand. The feature is the scheduler, so
    // watch for wrappers appearing without being asked. MIN_GAP..MAX_GAP is
    // 2.4-6.2s, plus up to three in a burst, so 14s should see at least two.
    await evaluate(`(() => {
      NephGlitch.clear();
      window.__seen = [];
      window.__obs = new MutationObserver(ms => {
        for (const m of ms) for (const n of m.addedNodes) {
          if (n.nodeType === 1 && n.classList && n.classList.contains('neph-g')) {
            window.__seen.push((n.className.match(/neph-g--(\\w+)/) || [])[1] + ':' + n.textContent);
          }
        }
      });
      window.__obs.observe(document.getElementById('page-creator'), { childList: true, subtree: true });
      return 'watching';
    })()`);
    await sleep(14000);
    const seen = await evaluate('window.__obs.disconnect(); window.__seen');
    ok(seen.length >= 2, `the scheduler fired ${seen.length} glitch(es) unprompted in 14s: ${seen.slice(0, 4).join(' | ')}`);
    ok(new Set(seen.map(x => x.split(':')[0])).size >= 1, `flavours seen: ${[...new Set(seen.map(x => x.split(':')[0]))].join(', ')}`);
    const settled = await evaluate('document.querySelectorAll(".neph-g").length');
    ok(settled <= 3, `at most MAX_LIVE wrappers are ever present at once (${settled} right now)`);

    // ── The glitch: it changes nothing it should not ────────────────────────
    const integrity = await evaluate(`(() => {
      NephGlitch.clear();
      const host = document.getElementById('step-content');
      const before = host.textContent;
      const rects = [...host.querySelectorAll('.fallen-origin-card, .form-group, label')]
        .slice(0, 12).map(el => { const r = el.getBoundingClientRect(); return Math.round(r.top) + ':' + Math.round(r.left) + ':' + Math.round(r.height); });
      const h0 = host.scrollHeight;
      const spans = [];
      for (let i = 0; i < 6; i++) { const s = NephGlitch.fire(); if (s) spans.push(s); }
      const during = host.textContent;
      const rectsDuring = [...host.querySelectorAll('.fallen-origin-card, .form-group, label')]
        .slice(0, 12).map(el => { const r = el.getBoundingClientRect(); return Math.round(r.top) + ':' + Math.round(r.left) + ':' + Math.round(r.height); });
      const h1 = host.scrollHeight;
      NephGlitch.clear();
      return { wrapped: spans.length, before, during, after: host.textContent,
               reflow: rects.join('|') !== rectsDuring.join('|'), h0, h1,
               leftover: document.querySelectorAll('.neph-g, .neph-c').length };
    })()`);
    ok(integrity.wrapped > 0, `wrapped ${integrity.wrapped} run(s) for the integrity check`);
    ok(integrity.before === integrity.during, 'textContent is byte-identical while glitched');
    ok(integrity.before === integrity.after, 'textContent is byte-identical after unwrapping');
    ok(!integrity.reflow, 'no element moved: every sampled top/left/height is unchanged');
    ok(integrity.h0 === integrity.h1, `the container height did not change (${integrity.h0}px)`);
    ok(integrity.leftover === 0, 'clear() removed every wrapper');

    // ── The glitch: exclusions ──────────────────────────────────────────────
    const excl = await evaluate(`(() => {
      const host = document.getElementById('step-content');
      const probe = document.createElement('div');
      probe.innerHTML = '<p class="error-msg">Spheres exceed the available points here</p>' +
                        '<pre><code>const forbidden = "do not glitch this";</code></pre>' +
                        '<label>Keep this one <input value="untouchable text inside"></label>' +
                        '<p data-no-glitch>Explicitly opted out of glitching</p>' +
                        '<p>Ordinary prose that is perfectly eligible for glitching</p>';
      host.appendChild(probe);
      const nodes = NephGlitch._textNodes(document.getElementById('page-creator'));
      const inside = sel => nodes.some(n => n.parentElement && n.parentElement.closest(sel));
      const r = { err: inside('.error-msg'), code: inside('code'), opt: inside('[data-no-glitch]'),
                  eligible: nodes.some(n => /Ordinary prose/.test(n.nodeValue)) };
      probe.remove();
      return r;
    })()`);
    ok(!excl.err, 'error messages are never glitched');
    ok(!excl.code, 'code and pre are never glitched');
    ok(!excl.opt, '[data-no-glitch] is honoured');
    ok(excl.eligible, 'ordinary prose in the same subtree still is eligible');

    // ── The glitch: survives the app re-rendering under it ──────────────────
    const rerender = await evaluate(`(() => {
      const s = NephGlitch.fire();
      if (!s) return { skipped: true };
      Creator.renderStep();                      // throws the whole subtree away
      NephGlitch.clear();                        // must not throw on an orphan
      return { leftover: document.querySelectorAll('.neph-g').length, live: NephGlitch.liveCount() };
    })()`);
    ok(rerender.skipped || (rerender.leftover === 0 && rerender.live === 0),
      'a glitch that gets re-rendered away is dropped without error');

    // ── Every flavour is wired to real keyframes ────────────────────────────
    const flav = await evaluate(`(() => {
      const host = document.getElementById('step-content');
      const out = {};
      for (const f of ['jitter','flicker','smear','scratch','tremble','neg']) {
        const s = document.createElement('span');
        s.className = 'neph-g neph-g--' + f;
        s.textContent = 'ordeal';
        host.appendChild(s);
        const own = getComputedStyle(s).animationName;
        const bef = getComputedStyle(s, '::before').animationName;
        const aft = getComputedStyle(s, '::after').animationName;
        out[f] = [own, bef, aft].filter(v => v && v !== 'none');
        s.remove();
      }
      return out;
    })()`);
    for (const f of ['jitter', 'flicker', 'smear', 'scratch', 'neg']) {
      ok(flav[f] && flav[f].length > 0, `flavour "${f}" resolves to keyframes: ${(flav[f] || []).join(', ') || 'NONE'}`);
    }
    ok(flav.tremble !== undefined, 'flavour "tremble" styles its letters through .neph-c (checked below)');
    const tremble = await evaluate(`(() => {
      const host = document.getElementById('step-content');
      const s = document.createElement('span');
      s.className = 'neph-g neph-g--tremble';
      host.appendChild(s);
      const i = document.createElement('i'); i.className = 'neph-c'; i.textContent = 'a';
      s.appendChild(i);
      const cs = getComputedStyle(i);
      const r = { anim: cs.animationName, iter: cs.animationIterationCount, style: cs.fontStyle };
      s.remove();
      return r;
    })()`);
    ok(tremble.anim === 'neph-g-tremble' && tremble.iter === 'infinite', `.neph-c animates per letter (${tremble.anim}, ${tremble.iter})`);
    ok(tremble.style !== 'italic', 'the <i> letters are not italic (font-style: inherit)');

    // ── The lurch flavour ──────────────────────────────────────────────────
    const lurch = await evaluate(`(() => {
      const host = document.getElementById('step-content');
      const s = document.createElement('span');
      s.className = 'neph-g neph-g--lurch';
      s.textContent = 'ordeal';
      host.appendChild(s);
      const cs = getComputedStyle(s);
      const r = { anim: cs.animationName, display: cs.display, origin: cs.transformOrigin };
      s.remove();
      // It must never take more than one word, or inline-block would remove a
      // line-break opportunity between words and the paragraph could re-wrap.
      r.words = [];
      for (let i = 0; i < 40; i++) {
        const run = NephGlitch._pickRun('the Caul remembers every promise made to it', 1);
        if (run) r.words.push('the Caul remembers every promise made to it'.slice(run.start, run.end).trim().split(/\\s+/).length);
      }
      r.maxWords = Math.max(...r.words);
      // And it must decline a word with no room to grow into.
      const v = { w: window.innerWidth, h: window.innerHeight };
      r.edge   = NephGlitch._roomToLurch({ left: 2, right: 60, top: 300, bottom: 320, width: 58 });
      r.middle = NephGlitch._roomToLurch({ left: v.w / 2, right: v.w / 2 + 60, top: v.h / 2, bottom: v.h / 2 + 20, width: 60 });
      r.right  = NephGlitch._roomToLurch({ left: v.w - 60, right: v.w - 2, top: 300, bottom: 320, width: 58 });
      return r;
    })()`);
    ok(lurch.anim === 'neph-g-lurch', `lurch resolves to its keyframes (${lurch.anim})`);
    ok(lurch.display === 'inline-block', `lurch takes a block box so it can scale (${lurch.display})`);
    ok(lurch.maxWords === 1, `lurch is capped at a single word (max seen: ${lurch.maxWords})`);
    ok(lurch.edge === false && lurch.right === false, 'lurch declines a word against the left or right edge');
    ok(lurch.middle === true, 'lurch accepts a word with clearance around it');

    // ── Darrell ────────────────────────────────────────────────────────────
    const DARRELL_OUT = `(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: window.innerHeight - 40, bubbles: true }));
      return 'out';
    })()`;
    const DARRELL_IN = `(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 900, clientY: 200, bubbles: true }));
      return 'in';
    })()`;
    // The balloon is shown from the slide's transitionend; nudge it if the
    // headless compositor has not fired one by the time we look.
    const SETTLE = `(() => {
      const b = document.getElementById('wizard-balloon');
      if (!b.classList.contains('wizard-balloon-visible')) {
        document.getElementById('wizard-darrell')
          .dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'transform' }));
      }
      return b.classList.contains('wizard-balloon-visible');
    })()`;

    ok(await evaluate('document.getElementById("wizard-balloon").getAttribute("aria-hidden") === "true"'),
      'the balloon is aria-hidden, so splitting it per character reaches no screen reader');

    // …on an ordinary page he is himself.
    await evaluate('App.showPage("dashboard"); "ok"');
    await sleep(400);
    await evaluate(DARRELL_OUT);
    await sleep(1000);
    await evaluate(SETTLE);
    await sleep(300);
    const plain = await evaluate(`(() => {
      const w = document.getElementById('wizard-darrell'), b = document.getElementById('wizard-balloon');
      return { corrupt: w.classList.contains('wizard-corrupted'), src: w.getAttribute('src'),
               srcset: w.parentNode.querySelector('source').srcset,
               melting: b.classList.contains('wizard-balloon-melting'),
               chars: b.querySelectorAll('.wiz-char').length,
               text: b.textContent.trim().slice(0, 40) };
    })()`);
    ok(!plain.corrupt && /darrell_cartoon/.test(plain.src), `off the Nephandi pages he is the ordinary Darrell (${plain.src})`);
    ok(!plain.melting && plain.chars === 0, 'his ordinary balloon is plain text, not split per character');
    ok(plain.text.length > 0, `he said something: "${plain.text}"`);

    await evaluate(DARRELL_IN);
    await sleep(1100);

    // …and in the Caul he is not.
    await evaluate('App.newCharacterOfType("nephandi"); "ok"');
    await sleep(1500);
    await evaluate(DARRELL_OUT);
    await sleep(1000);
    await evaluate(SETTLE);
    await sleep(400);
    const rot = await evaluate(`(() => {
      const w = document.getElementById('wizard-darrell'), b = document.getElementById('wizard-balloon');
      const ch = b.querySelector('.wiz-char');
      return { corrupt: w.classList.contains('wizard-corrupted'), src: w.getAttribute('src'),
               srcset: w.parentNode.querySelector('source').srcset,
               loaded: w.complete && w.naturalWidth > 0, natural: w.naturalWidth + 'x' + w.naturalHeight,
               balloonCorrupt: b.classList.contains('wizard-balloon-corrupted'),
               melting: b.classList.contains('wizard-balloon-melting'),
               words: b.querySelectorAll('.wiz-word').length,
               chars: b.querySelectorAll('.wiz-char').length,
               anim: ch ? getComputedStyle(ch).animationName : null,
               fill: ch ? getComputedStyle(ch).animationFillMode : null,
               charDisplay: ch ? getComputedStyle(ch).display : null,
               wordWrap: b.querySelector('.wiz-word') ? getComputedStyle(b.querySelector('.wiz-word')).display : null,
               text: b.textContent.trim(),
               border: getComputedStyle(b).borderTopColor };
    })()`);
    ok(rot.corrupt && /corrupted_darrell/.test(rot.src), `in a Nephandi creator the art swaps (${rot.src})`);
    ok(/corrupted_darrell-1x\.webp 1x/.test(rot.srcset), 'the <source> srcset swaps too, or <picture> would keep serving the old webp');
    ok(rot.loaded, `the corrupted art actually loaded (${rot.natural})`);
    ok(rot.balloonCorrupt && rot.border === 'rgb(110, 32, 40)', `the balloon goes to rot (border ${rot.border})`);
    ok(rot.melting && rot.chars > 0, `the message is laid out per character to melt (${rot.chars} chars in ${rot.words} words)`);
    ok(rot.anim === 'wiz-melt' && rot.fill === 'forwards', `each character melts and stays melted (${rot.anim}, ${rot.fill})`);
    ok(rot.charDisplay === 'inline-block' && rot.wordWrap === 'inline-block',
      'characters and their word wrappers are both inline-block, so letters move but words still break normally');

    // The message has to come from the Nephandi list, and the corrupted
    // defaults are the only lines that are in one list and not the other.
    const lists = await evaluate(`fetch('/api/wizard').then(r => r.json()).then(d => ({
      messages: d.messages.length, nephandi: d.nephandi.length,
      onlyNeph: d.nephandi.filter(t => !d.messages.includes(t)).length,
      saidIsNeph: d.nephandi.includes(${JSON.stringify('PLACEHOLDER')}) }))`
      .replace(JSON.stringify('PLACEHOLDER'), JSON.stringify(rot.text)));
    ok(lists.onlyNeph > 0, `${lists.onlyNeph} corrupted line(s) exist that he never says normally`);
    ok(lists.saidIsNeph, 'what he actually said is drawn from the Nephandi list');

    // ── Reduced motion ─────────────────────────────────────────────────────
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await sleep(200);
    const rm = await evaluate(`(() => {
      NephGlitch.clear();
      const enabled = NephGlitch._enabled();
      const span = NephGlitch.fire();
      return { enabled, fired: !!span, wrappers: document.querySelectorAll('.neph-g').length };
    })()`);
    ok(rm.enabled === false, 'prefers-reduced-motion: _enabled() reports false');
    ok(rm.fired === false && rm.wrappers === 0, 'prefers-reduced-motion: nothing is wrapped at all — not even silently');

    // Darrell keeps the corrupted art — that is not motion — but says his piece
    // as plain text instead of melting it.
    await evaluate(DARRELL_IN);
    await sleep(1100);
    await evaluate(DARRELL_OUT);
    await sleep(1000);
    await evaluate(SETTLE);
    await sleep(300);
    const rmWiz = await evaluate(`(() => {
      const w = document.getElementById('wizard-darrell'), b = document.getElementById('wizard-balloon');
      return { corrupt: w.classList.contains('wizard-corrupted'),
               melting: b.classList.contains('wizard-balloon-melting'),
               chars: b.querySelectorAll('.wiz-char').length,
               text: b.textContent.trim().length };
    })()`);
    ok(rmWiz.corrupt, 'prefers-reduced-motion: he is still the corrupted Darrell');
    ok(!rmWiz.melting && rmWiz.chars === 0 && rmWiz.text > 0,
      'prefers-reduced-motion: the balloon is plain text, never split or melted');

    await send('Emulation.setEmulatedMedia', { features: [] });
    await sleep(200);

    // ── Selection guard ────────────────────────────────────────────────────
    const selGuard = await evaluate(`(() => {
      const el = document.querySelector('#step-content .fallen-origin-summary, #step-content p, #step-content label');
      if (!el) return { skipped: true };
      const r = document.createRange(); r.selectNodeContents(el);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      const enabled = NephGlitch._enabled();
      const fired = !!NephGlitch.fire();
      sel.removeAllRanges();
      return { enabled, fired };
    })()`);
    ok(selGuard.skipped || (selGuard.enabled === false && selGuard.fired === false),
      'a live text selection in the skin suspends glitching (it would collapse the selection)');

    // ── Light theme ────────────────────────────────────────────────────────
    await evaluate('document.documentElement.setAttribute("data-theme","light"); "ok"');
    await sleep(400);
    const lightTok = await evaluate('getComputedStyle(document.getElementById("page-creator")).getPropertyValue("--gold-mid").trim()');
    ok(lightTok === '#755410', `light theme overrides the skin too (--gold-mid ${lightTok})`);
    const worstLight = await evaluate(CONTRAST);
    ok(worstLight.length > 0 && worstLight[0].ratio >= 4.5,
      `light theme: worst rendered body text is ${worstLight[0] && worstLight[0].ratio}:1 on "${worstLight[0] && worstLight[0].text}"`);
    await shot('03-creator-light');
    await evaluate('document.documentElement.setAttribute("data-theme","dark"); "ok"');
    await sleep(300);

    // ── Phone width ────────────────────────────────────────────────────────
    await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 1, mobile: true });
    await sleep(600);
    const PROBE = `(() => {
      NephGlitch.clear();
      const w = 400, bad = [];
      for (const el of document.querySelectorAll('#page-creator *')) {
        const r = el.getBoundingClientRect();
        if (!r.width || r.right <= w + 0.5) continue;
        if ([...el.children].some(c => c.getBoundingClientRect().right > w + 0.5)) continue;
        bad.push((el.className || el.tagName).trim() + ' right=' + Math.round(r.right));
        if (bad.length >= 8) break;
      }
      return bad;
    })()`;
    const overflow = await evaluate(PROBE);
    await evaluate('App.newCharacterOfType("awakened"); "ok"');
    await sleep(1400);
    const baseline = await evaluate(PROBE);
    const added = overflow.filter(x => !baseline.includes(x));
    ok(added.length === 0,
      `the skin adds no horizontal overflow at 400px that the house creator does not already have` +
      ` (skin ${overflow.length}, unskinned awakened ${baseline.length}` +
      `${added.length ? ', NEW: ' + added.join(', ') : ''})`);
    await evaluate('App.newCharacterOfType("nephandi"); "ok"');
    await sleep(1400);
    // lurch scales a word up to 1.42 and shifts it, which paints outside its own
    // box — the one way a glitch could grow the document and flash a scrollbar.
    // Fire enough times to hit that flavour repeatedly and watch scrollWidth.
    const mobileGlitch = await evaluate(`(() => {
      NephGlitch.clear();
      const base = document.documentElement.scrollWidth;
      let worst = base, fired = 0, lurches = 0;
      for (let i = 0; i < 60; i++) {
        const s = NephGlitch.fire();
        if (!s) continue;
        fired++;
        if (s.className.indexOf('neph-g--lurch') >= 0) lurches++;
        worst = Math.max(worst, document.documentElement.scrollWidth);
        if (NephGlitch.liveCount() >= 3) NephGlitch.clear();
      }
      NephGlitch.clear();
      return { base, worst, fired, lurches };
    })()`);
    ok(mobileGlitch.worst <= mobileGlitch.base,
      `${mobileGlitch.fired} glitches (${mobileGlitch.lurches} of them lurches) at phone width never widened the document` +
      ` (${mobileGlitch.base}px -> worst ${mobileGlitch.worst}px)`);
    await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true });
    await shot('04-creator-phone', 860);

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.kill('SIGTERM');
    await sleep(300);
    if (fail) { console.log('\n--- server log ---\n' + log.slice(-1500)); }
  }

  console.log(`\n${pass} passed, ${fail} failed · screenshots in ${OUT}`);
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
