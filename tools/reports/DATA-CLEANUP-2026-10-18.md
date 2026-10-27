# Data cleanup — wonders.json and rotes-seed.json (2026-10-18)

Follow-up to REVIEW-2026-10-17.md §5. Two repeatable scripts now live in `tools/`;
both are idempotent (they read the preserved `.orig` file when present) and print a
before/after report that is also saved to `tools/reports/`.

```
python3 tools/clean_wonders.py   # app/public/data/wonders.json  (original: wonders.json.orig)
python3 tools/clean_rotes.py     # app/server/rotes-seed.json    (original: rotes-seed.json.orig)
```

Both accept `--dry-run`, `--out PATH`, `--dump NAME` (print a cleaned record); the
wonders script also has `--grep REGEX`. Hand corrections belong in the scripts'
tables (`RECORD_FIXES`, `NAME_FIXES`, `SOURCE_FIXES`), not in the JSON, so a re-run
never loses them.

## Part A — wonders.json (449 → 447 records)

| metric | before | after |
|---|---|---|
| running-header fragments ("N Mystic Armory", "Section N") | 119 | 0 |
| hyphen breaks "xx- yy" | 729 | 0 (683 joined, 23 kept as real compounds) |
| descriptions ending in another wonder's name | 338 | 0 |
| descriptions ending in terminal punctuation | 19 | 419 |
| descriptions > 3,000 chars | 4 | 2 (Spectre Limousine, Tradition Blades: coherent single entries, flagged `long_entry`) |
| longest description | 20,456 | 3,550 |
| heading rows Armor / Car / Weapons | 3 | 0 |
| swallowed book index (Universal Suit) | 1 | 0 |
| source_book spellings | 46 | 44 (straight apostrophes unified) |
| stat fields as strings | 405 / 269 / 272 / 5 | 0 — now int, `{min,max}` or `{text}` |
| empty descriptions | 12 | 17 (5 were only a header or the next entry's name; all flagged) |

Findings that changed the plan:

- The trailing bleed is the next entry **in the source book**, not the next JSON
  record, so tails are matched against every wonder name in the file. 79 further
  trailing names belong to wonders that are **missing from the file entirely**
  (list in `wonders-cleanup-report.txt`, e.g. Sacred Bullhide, Hrunting, Submersible Car).
- `Car` and `Weapons` were duplicates of *The DDGR Card* and *Abh-t Dagger* (dropped,
  longer text kept). `Armor` was a duplicate of *Alanson Light Hardsuit*; both copies
  carried half of the *Zulu Warshield* entry interleaved by column flow, which is now
  back in Zulu Warshield.
- *Detox Implant* contained the whole *Digital Enhancement Implants (DEI / ADEI)*
  entry, which had no record; it is now its own record (costs unknown, flagged).
- Two descriptions had a section intro dropped into the middle of a word
  ("…three dimensional ab- Other Wonders which … Sound stracts sculptures"); healed.

New fields: `type` (keyword-inferred: 40 typed, 407 `Unknown` — the compendium text
rarely names the category), `truncated`, `needs_review`, `review_note`,
`long_entry`, `split_from`. Names are unchanged (characters reference wonders by
name); no character references a dropped or renamed record.

UI: `app/public/js/app.js` gained `wonderStatText()` / `wonderStatNum()` and every
place that printed or summed `background_cost` / `arete` / `quintessence` uses them,
so int, range and text shapes all render ("9–12 pts", "Varies pts"). Type shows as a
badge in the grimoire list and is searchable. `index.html` asset versions bumped
(app.js v69, style.css v71). `app/public` is a read-only bind mount, so these are
live without a rebuild (hard-refresh the browser).

## Part B — rotes-seed.json (954 → 955 records)

| metric | before | after |
|---|---|---|
| garbage names | 12 | 0 (provisional names, `name_raw` + `name_reconstructed: true`) |
| rotes using Data / Dimensional Science / Primal Utility | 34 | 34 (`spheres_raw` unchanged) |
| …with that sphere missing from `sphere_minimums` | 30 | 0 |
| …with empty `sphere_minimums` | 11 | 0 |
| hyphen breaks | 19 | 0 |
| bled trailing citations | 5 | 0 |
| stray column-bleed letters (leading / trailing) | 26 / 47 | 0 / 0 |
| odd `source_book` ("pas 120", "- Dead Magic 2", "Edition", "Ascension") | 17 | 7 (the 7 left have no source at all) |
| descriptions ending mid-sentence | 671 | 655 → all flagged `truncated: true` |

- Mapping Data → Correspondence, Dimensional Science → Spirit, Primal Utility → Prime
  is done by re-parsing `spheres_raw` with the names substituted; the parser was
  validated against the extractor's own output on the 920 other rotes (910 identical,
  10 oddly worded ones left untouched). Only the 34 Technocratic rotes were rewritten.
- *Adad*'s description was actually the header of a lost rote, **Squaring the Circle**
  (Order of Reason p.88, Correspondence 2, Mind 1); it is now its own record and Adad's
  description is empty with a note.
- Provisional names (please check against the books): Trace to Source (was `188`),
  Petrify the Undead (`610`), Cold Water Magick (`Magick`), Prime Generation (Drug),
  DMSO (Dimethyl Sulfoxide), Heal Self (Channel Chi), Enchant Object (Create Talisman),
  Strengthen/Weaken Gauntlet, Identify Reality Deviant, Quickened Reflexes (`Blade)`),
  Remove Conditioning, Scry Distant Location (was the citation fragment
  `Mage: The Ascension Second`).
- `spheres_parsed` / `sphere_minimums` stay JSON strings (the DB columns are TEXT).

### Reseed mechanism (app/server/db.js)

The old path dropped the table when columns were missing, which would have renumbered
rotes and broken every character's `rotes` list (they store `{id, name, spheres_raw}`;
161 references across 40 characters today). Replaced by `syncRotesFromSeed()`:

- every seed record carries a stable `seed_key` = sha1("name|page|source")[:16]
  computed from the **original** raw fields, and `db.js` backfills the same key onto
  existing rows from their current (raw) fields, so each row meets its cleaned record
  even where the name changed;
- rows are UPDATEd in place by key, new records INSERTed, rows not in the seed kept;
- the seed file's sha256 is stored in a new `app_meta` table, so the sync runs only
  when `rotes-seed.json` changes; `rotes` gained `seed_key` and `truncated` columns
  (additive ALTERs, no DROP).

Tested against a copy of `data/characters.db`: 954 updated, 1 inserted, 954 legacy
rows keyed, all 161 character rote references still resolve; a second start is a no-op.
The grimoire detail view now appends "… (continues in <source>)" to truncated rotes.

## What to run

`server/` is baked into the image, so the rotes seed and db.js change need a rebuild:

```bash
cd /opt/M20 && docker compose up -d --build
```

Expected log line on first start: `★ Rotes seed synced (955 records): 954 updated, 1 inserted, …`.
The wonders changes are already live (bind mount).

## Still needs the missing PDFs

Only the M20 core rulebook is on disk; a disk-wide search found no other Mage PDFs.
Without the compendium PDFs nothing below can be recovered:

- **655 rote descriptions** are cut at ~175 characters (flagged, shown with an
  ellipsis and source reference). Re-extraction would key on rote name + compendium
  `page`.
- **12 provisional rote names** and the 7 rotes with no source.
- **17 wonders with lost descriptions** (`needs_review`), the Universal Suit tail,
  costs for Digital Enhancement Implants, and the **79 wonders absent from the file**.
- Wonder `type` for the 407 `Unknown` entries (the compendium's per-section
  category is not in the text).

Backups: `app.js.bak-wonders-2026-10-18`, `style.css.bak-2026-10-18`,
`index.html.bak-wonders-2026-10-18`, `db.js.bak-rotes-sync-2026-10-18`,
`wonders.json.orig`, `rotes-seed.json.orig`.

## Addendum (later on 2026-10-18) — rote descriptions completed from the grimoire

`Enlightened-grimoire.pdf` turned out to be the document the rote seed was extracted from.
`tools/enrich_rotes_from_grimoire.py` (now called automatically at the end of
`clean_rotes.py`) parses it by line coordinates (`pdftotext -bbox-layout`) because
plain reading order interleaves the two columns, and replaces a description only when
the seed's text is a prefix of the full one or the entry's identity is confirmed by its
source line, sphere line or page.

| metric | before | after |
|---|---|---|
| seed records matched to a grimoire entry | – | 955 / 955 |
| descriptions replaced (truncated or wrong text) | – | 714 |
| descriptions filled (were empty) | – | 7 |
| seed descriptions that were the *wrong* text entirely | – | 108 found and replaced |
| flagged `truncated` | 655 | 8 (grimoire text itself has no final period, or lists/tables) |
| median description length | 154 | 207 |
| records with all alternate sources (`sources[]`) | 0 | 954 (128 multi-source) |
| records marked `grimoire_unverified` (likely invented duplicates) | – | 2 |

Full report: `tools/reports/rotes-grimoire-enrichment.txt`.
