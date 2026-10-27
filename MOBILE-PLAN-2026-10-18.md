# Mobile review and plan (2026-10-18)

Scope: what it would take to make the M20 character builder usable on a phone. Evidence
comes from a stylesheet/template audit of the live frontend and from real renders of the
running site at 390×844 (iPhone 14/15 width) in headless Chromium, as a guest, through every
creator step, the Grimoire, the menu, the tarot spread and a public shared sheet.
Screenshots: `tools/reports/mobile-shots/`. Harness: `tools/mobile_shots.js` (see end).

## 1. Where it stands

The site is **partially responsive already**: the viewport meta is correct, there are 24
`max-width` media queries that collapse most big grids to one column, there is no fixed pixel
width above 360px anywhere, inputs are 19px (no iOS zoom), native `<select>`s are used, and a
hamburger menu exists. Login and the dashboard work as-is on a phone.

It is **not usable** on a phone for the thing it is for, building a character:

| Screen (390px wide)              | Content width | What breaks |
|----------------------------------|--------------:|-------------|
| Login, dashboard                 | 390           | Nothing. |
| Creator step 1 Concept           | 489           | Step card and affiliation tabs overflow; 11,400px tall (every Tradition card expanded). |
| Creator step 2 Attributes        | 417           | Priority chooser is **drag-and-drop only**; dots are 14px targets. |
| Creator step 3 Abilities         | 441           | Same, plus the secondary-ability rows. |
| Creator steps 4-6                | 417           | Overflow from the step card padding and sidebar. |
| Creator step 7 Finishing Touches | 671           | Freebie dot row and core-stat rows run off screen; sticky bottom nav covers content. |
| Grimoire (rote browser)          | 730           | 6-column table; tab strip and sphere-filter dots cramped. |
| Tarot spread                     | overflow      | Overlay wider than the screen; 5 full-size PNGs (3-9 MB each) per reading. |
| Shared character sheet           | overflow      | Three-column attribute/ability/sphere/advantage grids clipped on the right; core-stat wheels cut off. |
| Admin                            | not tested    | 9-column table, no scroll wrapper. |

Hover-only affordances mean that even where layout fits, information is unreachable: the
`?` tooltips on every trait, the freebie breakdown, and the sphere rank detail panel all
open on hover only.

## 2. Root causes (from `app/public/css/style.css` and `js/app.js`)

**Layout**
- Multi-column grids with no phone override: `.sheet-header`, `.sheet-cols-3`,
  `.sheet-rotes-body`, `.sheet-advantages`, `.sheet-footer` (style.css:1960-2130, 5990),
  `.priority-row 160px 1fr` (:918), `.fb-row 200px 1fr auto` (:2574), `.chron-pool-grid`
  with 322px of fixed tracks (:7569), `.fe-stat-grid`, `.gcr-sphere-grid`, `.chronicle-form-row`.
- Three real `<table>`s with no horizontal-scroll wrapper: grimoire (6 cols, app.js:3315),
  admin (9 cols, :1006), sheet combat (:5629).
- Density tuned for desktop: root font is 20px, `#step-content` has 40px padding each side
  (:775), `.grimoire-container` and `.chronicle-content-wrap` similar. 80 of 390px go to padding.
- `.modal-box min-width: 320px` without `width: 100%` (:2243) overflows on 320-360px phones.
- `100vh` used for body and panels (:182, :4111, :6745); no `dvh`, so iOS address-bar jitter.

**Interaction**
- Attribute/ability priority chooser is HTML5 drag-and-drop with no tap alternative
  (app.js:9036, 10487-10522). HTML5 DnD does not fire on iOS or Android touch. **Blocking.**
- 126 `:hover` rules; the ones that matter: `.info-tip:hover::after` tooltips (22 uses, no
  click fallback, :3132-3153), `.sidebar-points:hover .freebie-tooltip` (nowrap, :707), the
  sphere rank panel on `mouseenter` (app.js:10786), grimoire sphere preview on `mouseover` (:3210).
- Dot targets `.dot` 14×14px with 5px gap (:1147-1162), `.g-dot` 13px; buttons `.btn-sm`
  ~30px tall. Apple/Google guidance is 44/48px.
- 100 `title=` attributes as the only explanation of a control.

**Chrome (persistent UI)**
- Sticky header ~100px, growing to ~150-170px below 600px when the logo stacks above the
  wrapping nav (:246-290, :4426). Hamburger holds only About/Feedback/Settings/Logout; the
  primary Home/Grimoire/Admin buttons never collapse.
- Creator bottom bar `.creator-nav` is `position: sticky; bottom: 0` (:777-790) and overlaps
  step content; the creator sidebar (step list + freebie counter) renders as a tall block
  above the form below 900px instead of a compact stepper.
- Mascot `#wizard-darrell` fixed 200px wide bottom-left with a balloon at fixed offsets
  (:8480-8495, :8874-8880), never hidden on small screens, driven by `mousemove`.

**Weight**
- 1.27 MB of unminified JS/CSS loaded synchronously (app.js 702 KB, data.js 237 KB,
  style.css 255 KB, tarot.js 78 KB) plus Quill from a CDN and 9 Google Font variants.
- Header/mascot PNGs total ~3 MB (chantry-logo 1.07 MB rendered at 64px tall), no
  `width/height`, no `loading="lazy"`.
- Tarot: 79 PNGs, 280 MB, 3.5 MB average; a reading loads 20-40 MB.
- No web manifest, no service worker, no icons: cannot be installed to a home screen.

**Accessibility that doubles as mobile usability**
- 127 inputs, 96 labels, 9 `for=` associations, 0 `aria-label`; 97 rely on placeholder only.

## 3. Options

**A. Responsive retrofit of the existing frontend (recommended).** The audit's conclusion
and mine: there are no fixed widths, the grid-collapse pattern already exists, the root
rem scale is consistent, the hamburger exists. Roughly 25-35 added rules in a single
`@media (max-width: 600px)` tier plus a `@media (pointer: coarse)` tier fix most layout
items. Two things need JavaScript, not CSS: a tap model for the priority chooser and a tap
model for tooltips/info panels. Two screens deserve a distinct phone layout rather than a
collapse: the rote/admin tables (card rows) and the tarot spread (single column, small assets).

**B. Separate mobile site or mobile-first rewrite.** Not justified. The views are template
strings in one file with no component boundaries; a second rendering path would double the
surface for every future rules change. The freebie logic alone has three implementations
already (see REVIEW-2026-10-17.md).

**C. Native wrapper / PWA.** A PWA manifest and icons are cheap and worth doing after A so
the site can be pinned to a home screen with a standalone window. A service worker is
optional (the app is online-only: auth, chronicles, export). Do not wrap in a store app.

## 4. Plan

Effort is in focused days for one developer familiar with the code. Each phase is
independently shippable; frontend changes go live through the bind mount without a rebuild.

### Phase 0 — harness and baseline (0.5 day)
- Keep `tools/mobile_shots.js` (already added): headless Chromium, guest login, screenshots
  of every state at 390px, reports `scrollWidth` per screen. Add a check that fails when any
  screen reports `overflowX: true`; run it before and after each phase.
- Add `@media (max-width: 600px) { html { overflow-x: hidden } }` as a temporary guard so
  users stop seeing sideways scroll while the real fixes land, and log which elements exceed
  the viewport (`document.querySelectorAll('*')` width check in the harness).

### Phase 1 — global chrome and foundation (2 days)
1. Header: at ≤600px show a 40px logo and keep the nav on one row; move Home, Grimoire and
   Admin into the existing hamburger; header height ≤ 60px.
2. Hide `#wizard-darrell` and `#wizard-balloon` below 768px; stop binding `mousemove` there.
3. Padding tier: `#step-content`, `.grimoire-container`, `.chronicle-content-wrap`,
   `.adv-page` to 12-16px at ≤600px; root `font-size` 18px at ≤600px.
4. `.modal-box { width: 100%; min-width: 0; max-width: min(480px, 100% - 24px) }`; replace
   `100vh` with `100dvh` (fallback kept).
5. Touch tier `@media (pointer: coarse)`: `.dot`/`.g-dot` 24px with 8px gap and a 44px hit
   area via padding or `::before`; `.btn-sm` min-height 40px; icon buttons 44px.
6. Tooltips: make `.info-tip` a `<button>` that toggles a `.open` class on tap (close on
   outside tap), keep `:hover` for mouse; same for `.freebie-tooltip` and the sphere rank
   panel (`mouseenter` → also `click`). One shared helper in app.js.
7. Guest banner: collapse to one line with a disclosure on phones.

### Phase 2 — the creator (3 days)
1. Priority chooser (steps 2 and 3): replace drag-and-drop with tap-to-assign. Tap a
   category chip, then tap Primary/Secondary/Tertiary (or use three `<select>`s on coarse
   pointers). Keep DnD for mouse. This is the single blocking item.
2. Step list: below 900px render the sidebar as a horizontal, scrollable stepper (Roman
   numeral + current label) with the freebie counter inline; ~56px tall, sticky under the header.
3. Bottom `.creator-nav`: make it a real fixed bottom bar with safe-area padding and add
   matching `padding-bottom` to `#step-content` so it never covers content; Back / Save /
   Next as three equal buttons.
4. Step 1 Concept: affiliation tabs become a scrollable chip row; Tradition/Convention/Craft
   cards become an accordion (name + affinity visible, description on expand) so the page
   is not 11,000px tall; "Consult the Fates" moves into the accordion header.
5. Step 7 Finishing Touches: freebie dot row wraps or becomes a numeric counter; core-stat
   rows use `.fb-row { grid-template-columns: 1fr auto }` with the label above; collapsible
   sections stay.
6. Sphere grid, archetype grid, essence grid: confirm one column at ≤600px (most already
   are) and that the sphere rank panel opens on tap.

### Phase 3 — sheet, grimoire, chronicle, admin (2.5 days)
1. Character sheet: stack `.sheet-header`, `.sheet-cols-3`, `.sheet-advantages`,
   `.sheet-footer`, `.sheet-rotes-body` at ≤600px; move the Arete/Willpower/Quintessence
   wheels into a horizontal row of three; combat table → card per weapon.
2. Grimoire: at ≤600px render each rote as a card (name, spheres, source, expand for
   description) instead of the 6-column table; filters into a collapsible drawer; tab strip
   scrollable. Admin table: wrap in `overflow-x: auto` with sticky first column (admin is
   desktop-first; a scroll wrapper is enough).
3. Chronicle: `.chron-pool-grid`, `.chronicle-form-row`, `.fe-stat-grid`, `.gcr-sphere-grid`
   to one column; the Quill toolbar for ST notes set to a compact group set on phones.
4. Free-edit toolbar `.fe-toolbar`: stop stacking under the sticky header (one sticky bar only).

### Phase 4 — weight (1.5 days)
1. Resize and convert `chantry-logo.png`, `darkpack_logo2.png`, `darrell_cartoon.png`,
   `mage20.png` to WebP at display size with 2× variants; add `width/height` and
   `loading="lazy"` on everything below the fold.
2. Tarot: generate ≤300 KB WebP derivatives (and ~60 KB thumbnails for the deck backs);
   `srcset` by viewport; keep the originals only for the full-size tap-to-zoom view.
   Single-column spread at ≤600px with the overlay at `width: 100%`.
3. Minify `app.js`, `data.js`, `style.css` at deploy time (a one-line esbuild step in the
   Dockerfile, no source change) and load Quill only when a note editor opens. Expect ~1.27 MB
   → ~450 KB before gzip; make sure the reverse proxy gzips/brotlis.
4. Trim Google Fonts to the weights actually used (likely 5 of 9) and add `font-display: swap`.

### Phase 5 — installable (0.5 day)
- `manifest.webmanifest` (name, theme colour, 192/512 icons from the sigil), `apple-touch-icon`,
  `theme-color` meta, `display: standalone`. Optional later: a service worker that caches
  the static shell only.

### Acceptance criteria
- `tools/mobile_shots.js` reports `overflowX: false` on every state at 360, 390 and 414px.
- A character can be created end to end by touch only (no drag, no hover) in the harness
  using `Emulation.setTouchEmulationEnabled` and `Input.dispatchTouchEvent`, and on one real
  iPhone and one real Android phone.
- Every interactive control ≥ 40px tall on coarse pointers; every `?` tooltip reachable by tap.
- Header + any bottom bar ≤ 120px combined on a 667px-tall viewport.
- First load on a throttled 4G profile ≤ 3 s to interactive (Lighthouse mobile ≥ 80 performance).

### Total
About 10 developer-days across the five phases; Phases 1-2 (5 days) are the minimum for
"you can build a character on a phone". Phases 3-5 can trail by weeks.

## 5. Not covered here
PDF export already works on mobile (it is a download). Chronicle Storyteller tooling
(XP approval, note sharing) is reviewed only for layout, not re-designed for touch; it is
desktop-first by nature and a scroll wrapper is acceptable for v1.

## Appendix: the harness
```
node tools/mobile_shots.js tools/mobile_shots.json /tmp/m20-shots     # 390×844 default
W=414 H=896 node tools/mobile_shots.js tools/mobile_shots.json /tmp/m20-shots-414
CHROME=/usr/bin/chromium node tools/mobile_shots.js ...               # any Chromium ≥ 110
```
It logs in as a guest (guest accounts are purged on the next server restart), drives the app
with its own functions (`Creator.step = n; Creator.renderStep()`), captures full-page PNGs
and prints `pageHeight`/`scrollWidth`/`overflowX` per state. It sends `X-Forwarded-Proto:
https` because the session cookie is `Secure` behind the proxy.
