/* ═══════════════════════════════════════════════════════════════════════════
   THE FALLEN — word-level glitches for the Nephandi skin
   Companion to css/nephandi.css. No dependency on app.js; it starts itself.

   Every few seconds this picks one word, or a short run of two or three, from
   somewhere inside a visible .nephandi-skin, wraps it in a <span class="neph-g">
   with one flavour class, and unwraps it again when the animation finishes. The
   flavours are modelled on Kyle Cooper's Se7en title sequence: an unsteady gate,
   dropped frames, inks slipping out of register, a word coming off its mark
   entirely, scratched emulsion, a negative frame, and the hand-scratched
   tremble where every letter moves on its own.

   What this file is careful about, in rough order of how much it would matter:

   • It never changes layout. The wrapper stays `display: inline` and the CSS
     moves it with left/top under `position: relative`, so a word can shiver
     without re-wrapping the paragraph it lives in. The one exception is
     `lurch`, which has to scale and so has to have a block box; it is capped
     at a single word, where `inline-block` is laid out identically, and it
     declines words without room to grow (see roomToLurch).
   • It never changes text. The run that goes into the span is the same string
     that comes out, so `el.textContent` reads identically throughout — which is
     what the rest of the app uses. Nothing in app.js walks text nodes
     positionally (no firstChild / childNodes / nodeValue / MutationObserver
     anywhere in js/), which is what makes splitting a text node safe here.
   • It survives the app re-rendering underneath it. renderStep() replaces whole
     subtrees; a span that goes with one is simply dropped, because unwrap()
     checks isConnected first.
   • It declines to run at all under prefers-reduced-motion, on a hidden tab,
     while printing, and while the user has text selected inside the skin —
     unwrapping mid-selection would collapse it.
   • It stays out of form controls, code, and anything that reports a problem.
     A glitching error message is a support ticket, not a mood.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Each life is its CSS animation duration plus a frame, so the span comes out
     just after the last keyframe rather than cutting it off. */
  var FLAVOURS = [
    { name: 'jitter',  weight: 23, life: 660 },
    { name: 'flicker', weight: 19, life: 620 },
    { name: 'smear',   weight: 15, life: 760 },
    { name: 'lurch',   weight: 14, life: 820, words: 1 },   // see roomToLurch
    { name: 'scratch', weight: 12, life: 660 },
    { name: 'tremble', weight: 11, life: 780 },
    { name: 'neg',     weight:  6, life: 540 }
  ];
  var TOTAL_WEIGHT = FLAVOURS.reduce(function (n, f) { return n + f.weight; }, 0);

  var MIN_GAP = 2400;      // ms between glitches, lower bound
  var MAX_GAP = 6200;      // …and upper. Se7en's credits are not metronomic.
  var BURST_CHANCE = 0.22; // sometimes two or three in quick succession
  var MAX_LIVE = 3;
  var TREMBLE_MAX = 16;    // letters; past this, per-character spans aren't worth it
  var LURCH_MARGIN = 28;   // px of viewport clearance a scaling word needs

  /* Text inside these never gets touched. */
  var SKIP_TAGS = {
    SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, TITLE: 1,
    INPUT: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, OPTGROUP: 1,
    CODE: 1, PRE: 1, SVG: 1, PATH: 1
  };
  var SKIP_CLOSEST = [
    '.neph-g',                 // never nest a glitch in a glitch
    'code', 'pre', 'select', 'textarea',
    '[contenteditable=""]', '[contenteditable="true"]',
    '[data-no-glitch]',
    /* Anything telling the user something is wrong stays perfectly still. */
    '.error-msg', '.dash-error', '.arete-budget-error',
    '.fin-warning', '.fallen-pact-warning', '.char-type-card-warning',
    '.validation-list', '.rules-violations'
  ].join(', ');

  var live = new Set();     // spans currently wrapped
  var timers = new Set();   // every pending timeout, so stop() can clear them
  var loop = null;
  var reduceMQ = null;

  function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function pickFlavour() {
    var n = Math.random() * TOTAL_WEIGHT;
    for (var i = 0; i < FLAVOURS.length; i++) {
      n -= FLAVOURS[i].weight;
      if (n <= 0) return FLAVOURS[i];
    }
    return FLAVOURS[0];
  }

  function reduced() {
    if (!reduceMQ && window.matchMedia) {
      reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    }
    return !!(reduceMQ && reduceMQ.matches);
  }

  /* A non-collapsed selection anywhere inside the skin: leave the DOM alone. */
  function selecting() {
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    var node = sel.anchorNode;
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    return !!(el && el.closest && el.closest('.nephandi-skin'));
  }

  function enabled() {
    return !reduced() && !document.hidden && !selecting();
  }

  /* ── Finding something to glitch ─────────────────────────────────────────── */

  function textNodes(root) {
    var out = [];
    if (!root || !document.createTreeWalker) return out;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var text = node.nodeValue;
        if (!text || text.length < 4) return NodeFilter.FILTER_REJECT;
        if (!/[A-Za-z]{3}/.test(text)) return NodeFilter.FILTER_REJECT;
        var el = node.parentElement;
        if (!el || SKIP_TAGS[el.tagName]) return NodeFilter.FILTER_REJECT;
        if (el.closest(SKIP_CLOSEST)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  /* Up to `most` consecutive words out of a text node, as offsets into it.
     The run must start on a word with three letters in it, so the effect never
     lands on a lone digit or a piece of punctuation. */
  function pickRun(text, most) {
    var words = [], re = /\S+/g, m;
    while ((m = re.exec(text))) words.push([m.index, m.index + m[0].length]);
    var starts = [];
    for (var i = 0; i < words.length; i++) {
      if (/[A-Za-z]{3}/.test(text.slice(words[i][0], words[i][1]))) starts.push(i);
    }
    if (!starts.length) return null;
    var a = pick(starts);
    var want = Math.random() < 0.6 ? 1 : (Math.random() < 0.7 ? 2 : 3);
    want = Math.min(want, most || 3);
    var b = Math.min(a + want - 1, words.length - 1);
    return { start: words[a][0], end: words[b][1] };
  }

  function viewport() {
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 0,
      h: window.innerHeight || document.documentElement.clientHeight || 0
    };
  }

  /* The rect a run of text occupies, or null if it has none. */
  function runRect(node, start, end) {
    var range = document.createRange();
    try {
      range.setStart(node, start);
      range.setEnd(node, end);
    } catch (e) {
      return null;
    }
    var box = range.getBoundingClientRect();
    return (box.width && box.height) ? box : null;
  }

  /* Only glitch what the user can actually see — a tremble below the fold is
     wasted, and worse, it is a DOM mutation nobody asked for. */
  function inView(box) {
    var v = viewport();
    return box.bottom > 8 && box.top < v.h - 8 && box.right > 0 && box.left < v.w;
  }

  /* `lurch` is the one flavour that paints outside its own box: it scales up to
     1.42 and shifts up to 6px. On a word already against the edge of the
     viewport that would paint past it and grow the document, which shows up as
     a horizontal scrollbar appearing and vanishing. So it needs clearance all
     round, proportional to the word's own width because the scale is what
     dominates for a long word. Without it, the caller falls back to jitter. */
  function roomToLurch(box) {
    var v = viewport();
    var m = Math.max(LURCH_MARGIN, box.width * 0.25);
    return box.left > m && box.right < v.w - m && box.top > m && box.bottom < v.h - m;
  }

  /* ── Wrapping and unwrapping ─────────────────────────────────────────────── */

  function splitLetters(span) {
    var text = span.textContent;
    span.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n') {
        span.appendChild(document.createTextNode(ch));
        continue;
      }
      var letter = document.createElement('i');
      letter.className = 'neph-c';
      // A negative delay starts each letter part-way through the same cycle.
      letter.style.setProperty('--d', '-' + rnd(0, 0.34).toFixed(3) + 's');
      letter.textContent = ch;
      span.appendChild(letter);
    }
  }

  function wrap(node, start, end, flavour) {
    var run = node.splitText(start);           // run holds [start … ]
    if (end - start < run.nodeValue.length) {
      run.splitText(end - start);              // …and now exactly [start, end)
    }
    var parent = run.parentNode;
    if (!parent) return null;
    var span = document.createElement('span');
    // 16 letters of per-character spans is plenty; a long run just jitters whole.
    if (flavour === 'tremble' && run.nodeValue.length > TREMBLE_MAX) flavour = 'jitter';
    span.className = 'neph-g neph-g--' + flavour;
    parent.insertBefore(span, run);
    span.appendChild(run);
    if (flavour === 'tremble') splitLetters(span);
    return span;
  }

  function unwrap(span) {
    live.delete(span);
    if (!span || !span.isConnected) return;    // the app re-rendered over it
    var parent = span.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(span.textContent), span);
    parent.normalize();                        // leave the text node as we found it
  }

  function after(ms, fn) {
    var id = setTimeout(function () { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }

  function clear() {
    timers.forEach(clearTimeout);
    timers.clear();
    Array.from(live).forEach(unwrap);
    live.clear();
  }

  /* ── One glitch ──────────────────────────────────────────────────────────── */

  function fire() {
    if (!enabled() || live.size >= MAX_LIVE) return null;
    var roots = [];
    document.querySelectorAll('.nephandi-skin').forEach(function (r) {
      // #page-creator keeps the class while hidden behind another page.
      if (r.getClientRects().length) roots.push(r);
    });
    if (!roots.length) return null;

    var nodes = textNodes(pick(roots));
    if (!nodes.length) return null;

    for (var tries = 0; tries < 14; tries++) {
      var node = pick(nodes);
      if (!node.isConnected || !node.parentElement) continue;
      // The flavour is chosen first because it caps how many words it may take.
      var flavour = pickFlavour();
      var run = pickRun(node.nodeValue, flavour.words);
      if (!run) continue;
      var box = runRect(node, run.start, run.end);
      if (!box || !inView(box)) continue;
      if (flavour.name === 'lurch' && !roomToLurch(box)) flavour = FLAVOURS[0];
      var span = wrap(node, run.start, run.end, flavour.name);
      if (!span) continue;
      live.add(span);
      after(flavour.life, function () { unwrap(span); });
      return span;
    }
    return null;
  }

  /* ── The loop ────────────────────────────────────────────────────────────── */

  function tick() {
    schedule();
    if (!enabled()) return;
    fire();
    if (Math.random() < BURST_CHANCE) {
      var extra = 1 + ((Math.random() * 2) | 0);
      for (var i = 1; i <= extra; i++) after(i * rnd(110, 280), fire);
    }
  }

  function schedule() {
    if (loop) clearTimeout(loop);
    loop = setTimeout(tick, rnd(MIN_GAP, MAX_GAP));
  }

  function start() {
    if (loop) return;
    schedule();
  }

  function stop() {
    if (loop) clearTimeout(loop);
    loop = null;
    clear();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clear();
  });
  window.addEventListener('beforeprint', clear);

  window.NephGlitch = {
    start: start,
    stop: stop,
    fire: fire,
    clear: clear,
    liveCount: function () { return live.size; },
    // Exposed for tools/nephandi-glitch-test.js.
    _textNodes: textNodes,
    _pickRun: pickRun,
    _runRect: runRect,
    _roomToLurch: roomToLurch,
    _enabled: enabled,
    _flavours: FLAVOURS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
