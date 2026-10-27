# PDF sources needed to finish the data (2026-10-18)

> **Update, later on 2026-10-18:** the rote descriptions no longer need any of the books
> below. `Enlightened-grimoire.pdf` (the compiled document the seed was extracted from) was
> added to the project root and `tools/enrich_rotes_from_grimoire.py` now fills every rote
> from it: 955/955 records matched, 714 truncated descriptions replaced, 7 empty ones filled,
> 128 rotes gained their alternate source citations. 8 remain flagged `truncated` because the
> grimoire itself ends them without a period or they are bullet lists/tables; 2 (`Dim Mak`
> p.62, `Break the Dreamshell` p.110) are duplicates the original extraction invented and are
> marked `grimoire_unverified`. See `tools/reports/rotes-grimoire-enrichment.txt`.
> The lists below are kept for the **wonders** stubs and for anyone wanting the original
> rulebook text rather than the grimoire's paraphrase.

Counts come from `app/server/rotes-seed.json` (`truncated` flag or empty description) and
`app/public/data/wonders.json` (description under 40 chars). "Needed" = records that book
would complete. Only the M20 core rulebook is on disk today.

## Tier 1 — highest payoff (10+ rote descriptions each, 492 of 655 total)

| Rotes needed | Wonders needed | Book |
|---|---|---|
| 50 | 1 | Dead Magic |
| 49 | 1 | Mage: The Ascension (1st Edition) |
| 40 | 0 | Dead Magic 2 |
| 39 | 0 | Order of Reason |
| 31 | 1 | Book of Shadows (Mage Players Guide) |
| 26 | 0 | Book of Crafts |
| 26 | 0 | Hidden Lore |
| 23 | 5 | Guide to the Technocracy |
| 18 | 3 | Technocracy: Void Engineers |
| 17 | 0 | Tradition Book: Hollow Ones (Revised) |
| 17 | 0 | Mage: The Ascension Revised |
| 16 | 0 | Technocracy: Progenitors |
| 13 | 0 | Dragons of the East |
| 12 | 0 | Lost Paths: Ahl-i-Batin and Taftani |
| 12 | 0 | Technocracy: Iteration X |
| 12 | 1 | Tradition Book: Akashic Brotherhood (Revised) |
| 11 | 0 | The Spirit Ways |
| 11 | 0 | Tradition Book: Virtual Adepts (Revised) |
| 11 | 1 | Technocracy: New World Order |
| 11 | 0 | Orphan's Survival Guide |
| 10 | 0 | Mage: The Ascension (2nd Edition) |

## Tier 2 — 5 to 9 rote descriptions each (147 total)

| Rotes needed | Wonders needed | Book |
|---|---|---|
| 9 | 0 | Tradition Book: Verbena (Revised) |
| 9 | 0 | Digital Web 2.0 |
| 9 | 0 | Convention Book: Syndicate (Revised) |
| 9 | 0 | Tradition Book: Dreamspeakers (Revised) |
| 8 | 0 | Mage: The Sorcerer's Crusade |
| 8 | 0 | Convention Book: New World Order (Revised) |
| 8 | 0 | Blood Treachery |
| 8 | 0 | The Swashbuckler's Handbook |
| 8 | 0 | Infinite Tapestry |
| 8 | 0 | Artisan's Handbook |
| 7 | 0 | Tradition Book: Verbena (1st Edition) |
| 6 | 0 | Digital Web |
| 6 | 0 | Convention Book: Progenitors (Revised) |
| 6 | 0 | Tradition Book: Order of Hermes (1st Edition) |
| 6 | 0 | Infernalism: The Path of Screams |
| 6 | 0 | Convention Book: Void Engineers (Revised) |
| 6 | 0 | Tradition Book: Cult of Ecstasy (1st Edition) |
| 6 | 0 | Mage Storyteller's Companion |
| 5 | 0 | Tradition Book: Order of Hermes (Revised) |
| 5 | 0 | Fallen Tower: Las Vegas |
| 5 | 1 | Technocracy: Syndicate |
| 5 | 0 | Tradition Book: Celestial Chorus (Revised) |
| 5 | 0 | Tradition Book: Euthanatos (Revised) |
| 5 | 0 | World of Darkness: Outcasts |

## Tier 3 — 1 to 4 rote descriptions each (33 total)

Tradition Book: Euthanatos (1st Ed) 4 · Guide to the Traditions 4 · Tradition Book: Celestial Chorus (1st Ed) 4 ·
Tradition Book: Sons of Ether (Revised) 4 · Tradition Book: Sons of Ether (1st Ed) 4 · Book of Chantries 3 ·
Tradition Book: Virtual Adepts (1st Ed) 3 · Tradition Book: Cult of Ecstasy (Revised) 2 ·
Tradition Book: Akashic Brotherhood (1st Ed) 2 · Tradition Book: Dreamspeakers (1st Ed) 2 ·
Horizon: Stronghold of Hope 2 · Book of Secrets 1 (also cited by 305 Merit/Flaw page refs in data.js) ·
"Mage: The Ascension" (edition unclear) 1

## Wonders-only sources (descriptions already mostly complete)

Technomancer's Toybox (65 wonders, 1 stub) · Forged by Dragon's Fire (51, 2 stubs) ·
Convention Book: Progenitors, Iteration X, New World Order (53, 0 stubs) · Book of Madness (2).
Wonders need these only if you want to re-extract with a cleaner pipeline; the current text is usable.

## Unattributed

- 7 rotes have no `source_book` (6 of them truncated). Names: see `tools/clean_rotes.py` report; they need a manual lookup.
- 2 rotes still have empty sphere requirements because the raw text was unparseable.

## Already on disk, just needs extraction (no new PDF)

From `Mage 20th Anniversary Edition.pdf`:
- Appendix II, pp. 642-648 — Merits & Flaws, to verify the 117 Merits / 140 Flaws in data.js
  (currently all cite Book of Secrets; the M20-core ones are unverified).
- pp. 267-273 — Archetypes, to verify the 34 in data.js.
- 2 M20 rotes and 0 M20 wonders are truncated.

## Suggested order

1. Dead Magic, Dead Magic 2, Order of Reason, Book of Shadows, Book of Crafts, Hidden Lore, Guide to the Technocracy — seven books cover 235 of 655 truncated rotes.
2. The five Technocracy convention books (Void Engineers, Progenitors, Iteration X, NWO, Syndicate) and the Revised Tradition books — another ~140.
3. Mage 1st/2nd/Revised core books — 76, but these are the oldest and least likely to match M20 rules text.
4. Everything else as available.
