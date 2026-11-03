# Transcription instructions (M20 Sorcerer catalogue)

You are transcribing rules text from the sourcebook *M20 Sorcerer* (Paradox 2022) into JSON for a character-builder app. The text was extracted from the PDF in reading order; page numbers appear as lone numbers near "Chapter One: Hedge Magic" / "Chapter Two: Psychic Phenomena" / "Chapter Three: Practitioners" / "Chapter Four: Tools and Traits" running headers. Sidebars (boxed text) sometimes interrupt the flow; keep them as `sidebars` where the schema allows, otherwise fold them into `notes`.

General rules:
- Transcribe FULL text, faithfully, including rules numbers. Do not summarise or paraphrase. Fix only obvious extraction damage: join hyphen breaks across lines ("trans-\nformation" → "transformation"), join wrapped lines into paragraphs, drop running headers/page numbers, keep real paragraph breaks as `\n\n`.
- Keep the book's spelling (magick, Night-Folk, etc.) and curly quotes/apostrophes as they appear.
- Dot ratings in headings like "Object Permanence (•••)" are the level: count the bullets (• = 1).
- Level lists like "•  Commune: ..." / "••  Mass Communication: ..." give level entries 1-5. A level may have several entries (e.g. Alchemy recipes); keep each entry separately.
- `id` = lowercase snake_case of the name (e.g. `summoning_binding_and_warding`, `anti_psychic`, `object_permanence`). Custom-looking names with slashes: use the first name (`belle_of_the_ball`).
- `page` = the printed book page the entry starts on (the lone page numbers in the text; chapter one entries run pp. 18-51, chapter two pp. 54-77, chapter three pp. 80-95, chapter four pp. 103-110).
- Output must be valid JSON (UTF-8). Write it to the output path given in your task. Reply with only a count of entries written and anything you could not place.

## Schema: Paths (chapter one)

```json
[{
  "id": "conjuration", "name": "Conjuration", "page": 20,
  "description": "<all prose before the System heading, paragraphs joined with \n\n>",
  "system": {
    "text": "<everything under System up to Sample Rituals, verbatim, paragraphs joined with \n\n; include the Modifiers, Aspects, Price of Failure and any other labelled paragraphs>",
    "aspects": ["Distance", "Number of Targets", "Weight"],   // Aspect names the System says the Path uses; [] if none stated
    "modifiers": "<the Modifiers paragraph(s) only, or ''>",
    "priceOfFailure": "<the Price of Failure paragraph(s) only, or ''>"
  },
  "levels": [ { "level": 1, "text": "..." } ],   // only for Paths that list dot-by-dot effects or recipes (e.g. Alchemy); one object per entry, several per level allowed; [] otherwise
  "rituals": [ { "id": "object_permanence", "name": "Object Permanence", "level": 2, "text": "<full ritual text>" } ],
  "sidebars": [ { "title": "...", "text": "..." } ],
  "notes": ""
}]
```

## Schema: Phenomena (chapter two)

```json
[{
  "id": "animal_psychics", "name": "Animal Psychics", "page": 54,
  "description": "<all prose before the level list>",
  "levels": [ { "level": 1, "name": "Commune", "text": "..." }, ... ],   // name = the bold label before the colon, '' if none
  "system": "<any System/rules prose that is not part of a level entry, or ''>",
  "sidebars": [ { "title": "...", "text": "..." } ],
  "notes": ""
}]
```

## Schema: Affiliations (chapter three)

```json
[{
  "id": "the_arcanum", "name": "The Arcanum", "page": 80,
  "favoredAttributes": ["intelligence", "wits"],
  "favoredPaths": ["Alchemy", "Conveyance", "Enchantment", "Summoning, Binding, and Warding"],   // exactly as printed, incl. parentheticals like "Ephemera (Ghosts)"; put psychic phenomena here too if the text lists them
  "favoredNote": "<any qualifying sentence attached to the favored list, e.g. 'Most modern Star Council are psychics...', or ''>",
  "description": "<full body text>",
  "sidebars": [ { "title": "...", "text": "..." } ]
}]
```
Also include at the end the three "Other Magical Societies" entries (The Council of Nine Mystick Traditions, The Disparate Alliance, The Technocratic Union) with `"kind": "society"` and no favored lists, and the "Covens" / "Lone Practitioners" intro text as `{ "id": "unaligned", "name": "Unaligned", "kind": "unaligned", "description": ... }`.

## Schema: chapter four and core rules

```json
{
  "creation": { "text": "<Character Creation section text, pp. 103-106, verbatim>" },
  "backgrounds": { "text": "<Backgrounds section incl. Artifact background>", "artifactLevels": [ { "level": 1, "text": "A minor Artifact (Pecos Bill’s Revolvers (–1 on difficulty to aimed shots))" } ] },
  "meritsFlaws": [ { "id": "path_natural", "name": "Path Natural", "kind": "merit"|"flaw", "cost": "5", "costOptions": [5], "text": "<full text>" } ],
  "artifacts": [ { "id": "eternal_light", "name": "Eternal Light", "rating": 1, "text": "<full text>" } ],
  "aspects": [ { "name": "Area", "levels": ["1-foot radius", "3-foot radius", "6-foot radius", "12-foot radius", "25-foot radius"], "note": "" } ],
  "coreRules": { "pathMagic": "<Path Magic Core Rules prose incl. Spells, Rituals, Store Spell, Complications sub-sections; verbatim>", "psychic": "<Psychic Powers Core Rules prose>" }
}
```
For Merits/Flaws with variable costs ("1, 2, or 6 pt Flaw", "3-5 pt Flaw", "4 or 6 pt Merit", "4 pt Merit to 4 pt Flaw") put the printed string in `cost` and the numeric options in `costOptions` (Wild Talent: costOptions [-4,-3,-2,-1,1,2,3,4] with kind "merit" and a note).
