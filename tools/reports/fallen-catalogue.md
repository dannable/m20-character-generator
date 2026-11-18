# Book of the Fallen catalogue — extraction report (2026-11-17)

Phase 1 of the Nephandi character path: the data layer. Nothing user-visible in
the creator yet.

## Pipeline

```
M20 Book of the Fallen.pdf          (225 pp., git-ignored by the /*.pdf rule)
  │
  ├─ tools/extract_fallen.py        → tools/fallen-src/*.json   (10 chunks, 144 entries)
  │
  ├─ tools/build_fallen_catalogue.py
  │     → app/public/js/data-fallen.js        49 KB, 105 entries + helpers
  │     → app/public/data/fallen-lore.json   320 KB, 85 keys, lazy-fetched
  │     → tools/fallen-src/out-rotes.json     22 rote records
  │     → tools/fallen-src/out-wonders.json   17 wonder records
  │
  └─ tools/merge_fallen_content.py  → app/server/rotes-seed.json   955 → 977
                                    → app/public/data/wonders.json 447 → 464
```

All three scripts are re-runnable. The merge is idempotent: it drops every record
whose `source_book` is exactly `M20 Book of the Fallen` before appending, so a
re-extract replaces rather than duplicates. Records from *Fallen Tower: Las
Vegas* (6 rotes, 1 wonder) are a different book and are left alone.

## What was extracted

| Chunk | n | Source pages |
|---|---|---|
| traits (4 Merits, 4 Flaws, 16 Investments) | 24 | 117–127 |
| origins (Barabbi, Caul-Born, Widderslainte) | 3 | 55–58 |
| essences (Abyssal names for the four M20 Essences) | 4 | 59–60 |
| sects | 8 | 68–91 |
| Sphere → Qlipha descriptors | 10 | 104 |
| Qlippothic Dominions (10 + Daath) | 11 | 107–112 |
| Infernal Pact levels | 10 | 121 |
| focus (8 heresies, 14 paradigms, 7 practices, 6 instruments) | 35 | 127–150 |
| rotes | 22 | 151–164 |
| artifacts (10 black books, 7 devices) | 17 | 165–174 |

## Why the text is rebuilt from word coordinates

The book is set in two columns. Plain `pdftotext` reading order interleaves them
on any page where a column starts below an image or a pull-quote, which splices
one entry's prose into another's — it put Thaumiel's body after Ghagiel's, left
"Barbarism is the Truest State of Man" empty, and started Torment's text
mid-word inside Mutilation's.

`pages()` in `extract_fallen.py` instead parses `pdftotext -bbox-layout`, groups
blocks into bands delimited by full-width blocks, and reads the left column
before the right. Column cropping (`-x/-W`) was tried first and does not split
this book's pages cleanly.

Heading matching is line-exact for the same reason: several headings are ordinary
words ("Torment", "Violation", "Mutilation") that also occur in body prose, and a
substring match splits the block mid-sentence.

**Independent check on the alignment:** the page number derived from block
geometry matches the book's own table of contents for all 47 page-cited entries
(8 traits, 22 rotes, 17 artifacts), and the focus sections land on 128–150 as
printed.

## Two book quirks, handled explicitly

- p. 127 tags Media Bomb `(8 pts.)`, omitting the trait type every other entry
  carries. Normalised in `TYPOS` so one parser handles it.
- The chapter heading spells it "Widderslante"; the body text and Mage 20 both
  use "Widderslainte". The catalogue follows the latter (`RENAME`).

## Shapes chosen, and why

**Merits, Flaws and Investments use the row shape of `M20.MERITS`** — `{ id,
name, cost, category, description, page }` plus `nephandi: true` and, for
Investments, `investment: true`. The book calls Investments "essentially Special
Advantages or Supernatural Merits" (p. 121), so riding the existing merit/flaw
pipeline gets rendering, costing, the sheet band, PDF, Markdown, XP and the share
view with no new plumbing — and avoids a JSON column, which would mean edits in
all four duplicated `JSON_FIELDS` lists.

Ids are prefixed `neph_` and `inv_` so they can never collide with the 117
Merits / 140 Flaws in `data.js` (verified: no collisions today), and so a stored
character's merits map says where each trait came from. Mirrors the existing
`ucmf_` prefix used for custom content.

**Rote Sphere requirements** are converted from dot notation to the seed's
numeric form (`"••• - ••••• Forces"` → `"3-5 Forces"`) and parsed into
`spheres_parsed`. The connector decides the shape: `", or"` gives one component
with several alternatives, `", and"` gives separate required components, and
`"plus"` splits required from alternatives. Clauses after the first `;` are the
book's "possibly with … added" variants and become `required: false`, so
`canCast()` does not demand them. A segment mixing "or" and "and" without "plus"
is emitted as alternatives: the seed structure cannot express an AND-group nested
inside an alternative, and being permissive is the safer error for `canCast()`.
One rote, *Look Away*, is affected.

**Size.** The catalogue was 494 KB with all prose inline. `index.html` loads
every script eagerly with no bundler, and the README measures the whole app at
1.27 MB of JS+CSS, so that was a 39% increase on every page load. Splitting the
reference prose into `data/fallen-lore.json` — the treatment `data/wonders.json`
already gets — brings the eager cost to 49 KB.

## Verification

- `npm test` → 36/36 files pass `node --check` (was 35).
- 18 assertions over the built catalogue: counts, every helper, all nine Spheres
  mapped to a Qlipha, no id collisions with `data.js`, Prism practice overlap.
- Seeded against a copy of the production database (609 characters): *"Rotes seed
  synced (977 records): 955 updated, 22 inserted, 0 legacy rows keyed, 0 rows not
  in seed kept"*. No schema change needed.
- `GET /api/rotes?faction=Nephandi` → 22; the book appears in `/api/rotes/books`;
  `?spheres=Spirit:4:upto` correctly returns the 6 Spirit rotes.
- Both new assets serve: `/js/data-fallen.js` 50 KB, `/data/fallen-lore.json` 327 KB.
- Diffs to the two existing data files are append-only (569 insertions, 0
  deletions); each file's trailing-newline convention is preserved, and a
  round-trip of `wonders.json` through the writer is byte-identical.

## Note on what is already live

`docker-compose.yml` bind-mounts `app/public` read-only, so the 17 artifacts in
`wonders.json`, `data-fallen.js` and the `index.html` script tag are **already
being served** by the running container. The 22 rotes are not: `app/server` is
baked into the image and needs `docker compose build`. Until the rest of the
feature lands, the live Grimoire therefore shows the Fallen wonders but not the
Fallen rotes.

## Registration (three places, easy to miss)

- `app/public/index.html` — the `<script>` tag, with its own `?v=`.
- `app/scripts/build-dist.js` — the `FILES` array, or the file is never minified.
- `app/public/data/fallen-lore.json` needs none; `express.static` serves it.
