// Drive headless Chromium over the DevTools protocol (Node 22 built-in WebSocket) and take
// phone-width screenshots of a list of app states. Usage: node shots.js <shots.json> <outdir>
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;  // any Chromium ≥ 110 works
const [,, shotsFile, outDir] = process.argv;
const shots = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const PORT = 9333;
const W = +(process.env.W || 390), H = +(process.env.H || 844);
const MOBILE = process.env.MOBILE !== '0';   // MOBILE=0: desktop spot-check (fine pointer, no touch)

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`, `--window-size=${W},${H}`, '--user-data-dir=' + fs.mkdtempSync(require('os').tmpdir() + '/m20-cdp-'),
    'about:blank'], { stdio: 'ignore' });
  try {
    let targets;
    for (let i = 0; i < 50; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (targets.length) break; } catch {}
      await sleep(200);
    }
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 0; const pending = new Map(); const events = [];
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      else if (m.method) events.push(m);
    };
    const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) return 'EXC: ' + (r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails)).slice(0, 300);
      return r.result?.result?.value;
    };
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    // the app sets SESSION_SECURE=true and trusts one proxy hop, so present as proxied HTTPS
    await send('Network.setExtraHTTPHeaders', { headers: { 'X-Forwarded-Proto': 'https' } });
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: MOBILE });
    if (MOBILE) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    const results = [];
    for (const s of shots) {
      // $VAR in a url is read from the environment (e.g. SHARE_TOKEN for /s/<token>);
      // a state whose variable is unset is skipped rather than rendered as a 404
      if (s.url && /\$[A-Z_][A-Z0-9_]*/.test(s.url)) {
        const missing = (s.url.match(/\$[A-Z_][A-Z0-9_]*/g) || []).map(v => v.slice(1)).filter(k => !process.env[k]);
        if (missing.length) { results.push({ name: s.name, skipped: `env ${missing.join(', ')} not set` }); continue; }
        s.url = s.url.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, k) => process.env[k]);
      }
      if (s.url) { await send('Page.navigate', { url: s.url }); await sleep(s.wait || 2500); }
      if (s.js) { const v = await evaluate(s.js); results.push({ name: s.name, js: v }); await sleep(s.wait || 1200); }
      const metrics = await send('Page.getLayoutMetrics');
      const cs = metrics.result.cssContentSize || metrics.result.contentSize;
      const docW = await evaluate('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)');
      const h = Math.min(cs.height, s.maxHeight || 2600);
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: W, height: h, scale: 1 } });
      fs.writeFileSync(path.join(outDir, s.name + '.png'), Buffer.from(shot.result.data, 'base64'));
      const row = { name: s.name, pageHeight: Math.round(cs.height), scrollWidth: docW, overflowX: docW > W };
      // OVERFLOW_DEBUG=1: list the innermost elements whose right edge passes the viewport
      if (process.env.OVERFLOW_DEBUG && row.overflowX) {
        row.wide = await evaluate(`(() => {
          const W = ${W}; const out = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= W + 0.5) continue;
            // innermost offenders only: skip when a child is just as wide
            if ([...el.children].some(ch => ch.getBoundingClientRect().right > W + 0.5)) continue;
            const id = el.id ? '#' + el.id : ''; const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
            out.push(el.tagName.toLowerCase() + id + cls + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width));
            if (out.length >= 12) break;
          }
          return out;
        })()`);
      }
      results.push(row);
    }
    console.log(JSON.stringify(results, null, 1));
    ws.close();
  } finally { chrome.kill('SIGKILL'); }
}
main().catch(e => { console.error(e); process.exit(1); });
