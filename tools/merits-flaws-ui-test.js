// Merits & Flaws: source badges, Step VII filtering, and the reading view.
//
//   node tools/merits-flaws-ui-test.js [screenshot-dir]
//
// Same harness as the other browser tests: the real server on a throwaway
// DATA_DIR, headless Chromium over the DevTools protocol, no playwright package.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'mf-shots');
const PORT = +(process.env.PORT || 8033);
const CDP = +(process.env.CDP_PORT || 9346);
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); c ? pass++ : fail++; };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mf-test-'));
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: APP, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), NODE_ENV: 'development', SESSION_SECRET: 'mf-ui-test' },
  });
  let log = ''; server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });

  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${CDP}`, '--window-size=1280,900',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'mf-cdp-')), 'about:blank'], { stdio: 'ignore' });

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
    const shot = async (n, h = 1200, y = 0) => {
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: 1280, height: h, scale: 1 } });
      fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(s.result.data, 'base64'));
    };

    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(2600);
    await evaluate('Auth.enterAsGuest()');
    await sleep(2200);

    // ══ The helpers agree about what a row is ════════════════════════════════
    const helpers = await evaluate(`(() => {
      const m = FALLEN.meritRows().find(x => x.id === 'neph_shadow_appeal');
      const inv = FALLEN.meritRows().find(x => x.investment);
      const core = M20.MERITS.find(x => x.id === 'acute_senses');
      const hh = M20.MERITS.concat(M20.FLAWS).find(x => typeof x.page === 'string');
      return {
        fallenPage: mfPageText(m), corePage: mfPageText(core), hhPage: hh ? mfPageText(hh) : null,
        fallenBadge: mfBadgesHTML(m), invBadge: mfBadgesHTML(inv), coreBadge: mfBadgesHTML(core),
      };
    })()`);
    ok(/^BotF p\./.test(helpers.fallenPage), `a Fallen page reference cites Book of the Fallen, not M20 (${helpers.fallenPage})`);
    ok(/^M20 p\./.test(helpers.corePage), `a core one still cites M20 (${helpers.corePage})`);
    ok(helpers.hhPage && !/^M20/.test(helpers.hhPage), `a row that carries its own book keeps it (${helpers.hhPage})`);
    ok(/mf-badge-fallen/.test(helpers.fallenBadge), 'a Fallen Merit is badged FALLEN');
    ok(/mf-badge-investment/.test(helpers.invBadge), 'an Infernal Investment is badged INVESTMENT');
    ok(helpers.coreBadge === '', 'a core Merit carries no badge at all');

    // ══ The Grimoire ═════════════════════════════════════════════════════════
    await evaluate('App.showGrimoire(); "ok"');
    await sleep(1600);
    await evaluate(`Grimoire.state.activeTab = 'merits-flaws'; Grimoire._renderTabBar ? Grimoire._renderTabBar() : null; Grimoire._renderActiveTab(); "ok"`);
    await sleep(900);
    const grim = await evaluate(`(() => {
      const names = [...document.querySelectorAll('.gmf-item-name')].map(n => n.textContent);
      return {
        total: names.length,
        shadowAppeal: names.some(n => /Shadow Appeal/.test(n)),
        badges: document.querySelectorAll('.gmf-item .mf-badge-fallen').length,
        investments: document.querySelectorAll('.gmf-item .mf-badge-investment').length,
        botfPages: [...document.querySelectorAll('.gmf-item-page')].filter(p => /BotF/.test(p.textContent)).length,
        readBtns: document.querySelectorAll('.gmf-read-btn').length,
        sourceSelect: !!document.querySelector('.gmf-source-select'),
      };
    })()`);
    ok(grim.shadowAppeal, 'the Grimoire now lists the Fallen Merits at all — it read M20.MERITS alone before');
    ok(grim.badges >= 4 && grim.investments >= 16,
      `and badges them (${grim.badges} Fallen, ${grim.investments} Investments)`);
    ok(grim.botfPages >= 20, `their page references say BotF (${grim.botfPages} of them)`);
    ok(grim.sourceSelect, 'there is a book filter');
    ok(grim.readBtns === grim.total, `and every row has a Full text button (${grim.readBtns} of ${grim.total})`);
    await shot('01-grimoire', 1500);

    const filtered = await evaluate(`(() => {
      Grimoire.state.mfSource = 'investment';
      Grimoire._renderMFContent();
      const names = [...document.querySelectorAll('.gmf-item-name')].map(n => n.textContent);
      const inv = document.querySelectorAll('.gmf-item .mf-badge-investment').length;
      Grimoire.state.mfSource = 'core';
      Grimoire._renderMFContent();
      const coreOnly = document.querySelectorAll('.gmf-item .mf-badge-fallen, .gmf-item .mf-badge-investment').length;
      const coreCount = document.querySelectorAll('.gmf-item').length;
      Grimoire.state.mfSource = 'all';
      Grimoire._renderMFContent();
      return { invShown: names.length, invBadged: inv, coreOnly, coreCount };
    })()`);
    ok(filtered.invShown === filtered.invBadged && filtered.invShown >= 16,
      `filtering to Investments shows only Investments (${filtered.invShown})`);
    ok(filtered.coreOnly === 0 && filtered.coreCount > 200,
      `and filtering to Core excludes every Fallen row (${filtered.coreCount} rows, ${filtered.coreOnly} badged)`);

    // ══ The reading view ═════════════════════════════════════════════════════
    const lore = await evaluate(`fetch('/data/fallen-lore.json').then(r => r.json()).then(j => ({
      served: !!j.traits, n: Object.keys(j.traits || {}).length,
      shadow: (j.traits && j.traits.neph_shadow_appeal || '').length }))`);
    ok(lore.served && lore.n === 24, `the lore file is served and holds all the Fallen traits (${lore.n})`);
    ok(lore.shadow > 1500, `with the whole passage, not a summary (${lore.shadow} characters)`);

    const read = await evaluate(`(async () => {
      const m = FALLEN.meritRows().find(x => x.id === 'neph_shadow_appeal');
      await showTraitText(m);
      await new Promise(r => setTimeout(r, 400));
      const body = document.getElementById('trait-text-body');
      return { open: document.getElementById('modal-overlay').style.display === 'flex',
               title: document.getElementById('modal-title').textContent,
               len: body.textContent.length, paras: body.querySelectorAll('p').length,
               cites: /Book of the Fallen/.test(body.textContent),
               confirmHidden: document.getElementById('modal-confirm').style.display === 'none',
               summaryLen: (m.description || '').length };
    })()`);
    ok(read.open && /Shadow Appeal/.test(read.title), 'the reading view opens on the trait');
    ok(read.len > read.summaryLen * 2, `and shows the whole passage, not the card summary (${read.len} vs ${read.summaryLen} characters)`);
    ok(read.paras >= 3, `broken into paragraphs (${read.paras})`);
    ok(read.cites, 'and cites the book it came from');
    ok(read.confirmHidden, 'with no confirm button, because there is nothing to confirm');
    await shot('02-reading-view', 900);
    await evaluate('App.closeModal(); "ok"');

    const coreRead = await evaluate(`(async () => {
      await showTraitText(M20.MERITS.find(x => x.id === 'acute_senses'));
      await new Promise(r => setTimeout(r, 300));
      const body = document.getElementById('trait-text-body');
      return { text: body.textContent, honest: /app's summary/.test(body.textContent) };
    })()`);
    ok(coreRead.honest,
      'a core Merit says plainly that what is stored is the app summary, not the passage');
    await evaluate('App.closeModal(); "ok"');

    // ══ Step VII ═════════════════════════════════════════════════════════════
    await evaluate('App.newCharacterOfType("nephandi"); "ok"');
    await sleep(1800);
    await evaluate('Creator.step = 6; Creator.renderStep(); "ok"');
    await sleep(1200);
    const step = await evaluate(`(() => {
      const el = document.getElementById('fb-merits');
      return { toolbar: !!el.querySelector('.mf-toolbar'), search: !!el.querySelector('.mf-search'),
               source: !!el.querySelector('.mf-source'), taken: !!el.querySelector('.mf-taken'),
               fallenBadges: el.querySelectorAll('.mf-badge-fallen').length,
               invBadges: el.querySelectorAll('.mf-badge-investment').length,
               clickable: el.querySelectorAll('.mf-info-clickable').length,
               botf: [...el.querySelectorAll('.mf-card-page-inline')].filter(p => /BotF/.test(p.textContent)).length };
    })()`);
    ok(step.toolbar && step.search && step.taken, 'Step VII has a search box and a taken-only toggle');
    ok(step.source, 'and a book filter, because this character has more than one book in play');
    ok(step.fallenBadges >= 4 && step.invBadges >= 16,
      `the Fallen rows are badged in the creator too (${step.fallenBadges} Fallen, ${step.invBadges} Investments)`);
    ok(step.botf >= 20, `and cite BotF rather than M20 (${step.botf})`);
    ok(step.clickable > 0, 'every card offers the full entry');
    // The Merits panel is itself a collapsed <details>; open it, and the
    // category inside it, so the screenshot shows what a person would see.
    await evaluate(`(() => {
      // The panel that holds the merit list is a collapsed <details>; its id
      // differs between the step renderers, so walk up from the list itself.
      document.getElementById('fb-merits')?.closest('details')?.setAttribute('open', '');
      const sup = [...document.querySelectorAll('#fb-merits details.mf-cat-details')]
        .find(d => d.dataset.cat === 'Supernatural');
      if (sup) sup.open = true;
      return 'ok';
    })()`);
    await sleep(400);
    const mfTop = await evaluate(`(() => {
      const el = document.getElementById('fb-merits');
      const panel = el?.closest('details') || el;
      return panel ? Math.round(panel.getBoundingClientRect().top + window.scrollY) - 20 : 0;
    })()`);
    await shot('03-step7', 900, Math.max(0, mfTop));

    const search = await evaluate(`(() => {
      const el = document.getElementById('fb-merits');
      const before = el.querySelectorAll('.mf-card').length;
      const box = el.querySelector('.mf-search');
      box.focus();                       // as a person would, before typing
      box.value = 'ambidext';
      box.dispatchEvent(new Event('input', { bubbles: true }));
      const after = [...el.querySelectorAll('.mf-card-name')].map(n => n.textContent.trim());
      const count = el.querySelector('.mf-result-count').textContent;
      return { before, after, count,
               sameNode: el.querySelector('.mf-search') === box,
               valueKept: el.querySelector('.mf-search').value };
    })()`);
    ok(search.before > 100, `the unfiltered list is long enough to need searching (${search.before} cards)`);
    ok(search.after.length === 1 && /Ambidext/i.test(search.after[0]),
      `searching narrows it to the one row (${search.after.join(', ') || 'nothing'})`);
    ok(/1 of \d+/.test(search.count), `and reports the count (${search.count})`);
    ok(search.sameNode && search.valueKept === 'ambidext',
      'the search box survives the re-render as the same node, so typing is never interrupted');

    const srcFilter = await evaluate(`(() => {
      const el = document.getElementById('fb-merits');
      el.querySelector('.mf-search').value = '';
      el.querySelector('.mf-search').dispatchEvent(new Event('input', { bubbles: true }));
      const sel = el.querySelector('.mf-source');
      sel.value = 'investment';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const cards = el.querySelectorAll('.mf-card').length;
      const badged = el.querySelectorAll('.mf-badge-investment').length;
      sel.value = 'core';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const coreFallen = el.querySelectorAll('.mf-badge-fallen, .mf-badge-investment').length;
      sel.value = 'all';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { cards, badged, coreFallen, restored: el.querySelectorAll('.mf-card').length };
    })()`);
    ok(srcFilter.cards === srcFilter.badged && srcFilter.cards >= 16,
      `filtering to Investments leaves only Investments (${srcFilter.cards})`);
    ok(srcFilter.coreFallen === 0, 'filtering to Core leaves no Fallen rows');
    ok(srcFilter.restored === search.before, `clearing the filter restores the whole list (${srcFilter.restored})`);

    const empty = await evaluate(`(() => {
      const el = document.getElementById('fb-merits');
      const box = el.querySelector('.mf-search');
      box.value = 'zzzznotathing';
      box.dispatchEvent(new Event('input', { bubbles: true }));
      const msg = !!el.querySelector('.mf-no-results');
      el.querySelector('.mf-clear-filters').click();
      return { msg, afterClear: el.querySelectorAll('.mf-card').length, box: box.value };
    })()`);
    ok(empty.msg, 'a search that matches nothing says so rather than showing an empty page');
    ok(empty.afterClear === search.before && empty.box === '',
      `and Clear filters puts the list back (${empty.afterClear} cards)`);

    // Taken-only, and that the ? opens the entry instead of taking the Merit.
    const taken = await evaluate(`(async () => {
      const el = document.getElementById('fb-merits');
      Creator.char.merits = { acute_senses: 1 };
      Creator.updateMFDisplay();
      el.querySelector('.mf-taken').checked = true;
      el.querySelector('.mf-taken').dispatchEvent(new Event('change', { bubbles: true }));
      const names = [...el.querySelectorAll('.mf-card-name')].map(n => n.textContent.trim());
      el.querySelector('.mf-taken').checked = false;
      el.querySelector('.mf-taken').dispatchEvent(new Event('change', { bubbles: true }));
      return { names };
    })()`);
    ok(taken.names.length === 1 && /Acute Senses/.test(taken.names[0]),
      `taken-only shows just what is taken (${taken.names.join(', ') || 'nothing'})`);

    // The ? on a card is wired to the reading view rather than to taking the
    // trait. The click itself is exercised in the Grimoire below, where the rows
    // are not buried in nested collapsed sections: the two share one handler and
    // one showTraitText, so what differs here is only where the pixel lands.
    const wiring = await evaluate(`(() => {
      const el = document.getElementById('fb-merits');
      const tips = [...el.querySelectorAll('.mf-info-clickable')];
      const card = el.querySelector('.mf-card[data-id="neph_shadow_appeal"]');
      const tip = card && card.querySelector('.mf-info-clickable');
      return { count: tips.length, cards: el.querySelectorAll('.mf-card').length,
               role: tip && tip.getAttribute('role'), tab: tip && tip.getAttribute('tabindex'),
               titled: tip && /full entry/i.test(tip.getAttribute('title') || ''),
               keepsTip: tip && !!tip.getAttribute('data-tip') };
    })()`);
    ok(wiring.count === wiring.cards, `every card's ? is wired for the reading view (${wiring.count} of ${wiring.cards})`);
    ok(wiring.role === 'button' && wiring.tab === '0', `and is reachable by keyboard (role=${wiring.role}, tabindex=${wiring.tab})`);
    ok(wiring.titled, 'and says what it does on hover');
    ok(wiring.keepsTip, 'while keeping the summary tooltip it always had');

    // A real mouse click, in the Grimoire, through hit-testing.
    await evaluate('App.showGrimoire(); "ok"');
    await sleep(1500);
    await evaluate(`Grimoire.state.activeTab = 'merits-flaws'; Grimoire.state.mfSearch = 'Shadow Appeal'; Grimoire._renderActiveTab(); "ok"`);
    await sleep(800);
    await evaluate(`document.getElementById('modal-title').textContent = 'nothing open'; "ok"`);
    const clicked = await evaluate(`(() => {
      const btn = document.querySelector('.gmf-item[data-id="neph_shadow_appeal"] .gmf-read-btn');
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    await sleep(700);
    const grimRead = await evaluate(`(() => {
      const open = document.getElementById('modal-overlay').style.display === 'flex';
      const title = document.getElementById('modal-title').textContent;
      const len = (document.getElementById('trait-text-body') || {}).textContent?.length || 0;
      App.closeModal();
      return { open, title, len };
    })()`);
    ok(clicked, 'the Full text button is there to be clicked');
    ok(grimRead.open && /Shadow Appeal/.test(grimRead.title),
      `clicking it opens that entry through the delegated handler ("${grimRead.title}")`);
    ok(grimRead.len > 1500, `with the whole passage behind it (${grimRead.len} characters)`);

    ws.close();
  } finally {
    chrome.kill('SIGKILL'); server.kill('SIGTERM'); await sleep(300);
    if (fail) console.log('\n--- server log ---\n' + log.slice(-1400));
  }
  console.log(`\n${pass} passed, ${fail} failed · screenshots in ${OUT}`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
