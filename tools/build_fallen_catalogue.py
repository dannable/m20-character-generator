#!/usr/bin/env python3
"""Assemble the Nephandi catalogue from the transcribed chunks in tools/fallen-src/.

Run tools/extract_fallen.py first to (re)build those chunks from the PDF.

Writes three files:

  app/public/js/data-fallen.js    the catalogue the creator needs on every load:
                                  ids, names, costs, pages and short descriptions.
  app/public/data/fallen-lore.json the long reference prose, fetched lazily the
                                  first time a detail panel wants it — the same
                                  treatment data/wonders.json already gets.
  tools/fallen-src/out-*.json     rote and wonder records in their destination
                                  shapes, for tools/merge_fallen_content.py.

Keeping the prose out of the JS matters: it is 300 KB of the 480 KB total, and
index.html loads every script eagerly with no bundler.

Usage:
    python3 tools/build_fallen_catalogue.py
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'fallen-src')
OUT = os.path.join(ROOT, 'app', 'public', 'js', 'data-fallen.js')
LORE = os.path.join(ROOT, 'app', 'public', 'data', 'fallen-lore.json')


def load(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return json.load(f)


# Merit, Flaw and Investment ids are prefixed so they can never collide with the
# 117 Merits / 140 Flaws in data.js, and so a stored character's merits map says
# plainly where each trait came from. Mirrors the 'ucmf_' prefix the custom
# content already uses.
M_PREFIX, I_PREFIX = 'neph_', 'inv_'

# The chapter heading spells it "Widderslante"; the body text and Mage 20 both
# use "Widderslainte", so the catalogue follows the latter.
RENAME = {'widderslante': ('widderslainte', 'Widderslainte (Taint of Corruption)')}


def first_sentences(text, limit=240):
    """A short summary for list views: whole sentences up to `limit` chars."""
    flat = re.sub(r'\s+', ' ', text).strip()
    if len(flat) <= limit:
        return flat
    cut = flat[:limit]
    stop = max(cut.rfind('. '), cut.rfind('! '), cut.rfind('? '))
    return (cut[:stop + 1] if stop > 60 else cut.rsplit(' ', 1)[0] + '…').strip()


def trait_rows(traits, kind, prefix, lore):
    """Reshape to the row shape data.js uses for M20.MERITS / M20.FLAWS, so the
    existing merit/flaw pipeline (renderMFCards, costs, sheet, PDF, Markdown)
    picks these up with no new plumbing. Full text goes to the lore file."""
    rows = []
    for e in traits:
        if e['kind'] != kind:
            continue
        eid, name = e['id'], e['name']
        if eid in RENAME:
            eid, name = RENAME[eid]
        tid = prefix + eid
        row = {
            'id': tid,
            'name': name,
            'cost': e['cost'],
            'category': e['category'],
            'description': first_sentences(e['text']),
            'page': e['page'],
            'nephandi': True,
        }
        if kind == 'investment':
            row['investment'] = True
        rows.append(row)
        lore.setdefault('traits', {})[tid] = e['text']
    return rows


def focus_rows(focus, kind, lore):
    rows = []
    for e in focus:
        if e['kind'] != kind:
            continue
        rows.append({'id': e['id'], 'name': e['name'], 'page': e['page'],
                     'description': first_sentences(e['text'])})
        lore.setdefault(kind, {})[e['id']] = e['text']
    return rows


SPHERE_NAMES = ['Correspondence', 'Entropy', 'Forces', 'Life', 'Matter', 'Mind',
                'Prime', 'Spirit', 'Time']
DOT_RUN = re.compile(r'([•]+)(?:\s*[-–]\s*([•]+))?')


def dots_to_numerals(raw):
    """"••• - ••••• Forces, ••• Spirit" -> "3-5 Forces, 3 Spirit".

    The existing seed stores Sphere requirements as "Entropy 2 or 3, Life 2",
    so the Fallen chapter's dot notation is normalised the same way.
    """
    def sub(m):
        lo = len(m.group(1))
        hi = len(m.group(2)) if m.group(2) else None
        return f'{lo}-{hi}' if hi and hi != lo else str(lo)
    return clean_ws(DOT_RUN.sub(sub, raw))


def clean_ws(s):
    return re.sub(r'\s+', ' ', s).strip()


def _alts(text):
    """Alternatives in one clause, carrying a trailing Sphere name back onto bare
    ratings: "2, 3, 4 or 5 Mind" is four ratings of Mind, not a stray 2 and 3."""
    out, pending = [], []
    for part in re.split(r'\bor\b|,', text):
        m = re.search(r'(\d)(?:\s*-\s*(\d))?\s+([A-Z][a-z]+)', part)
        if m and m.group(3) in SPHERE_NAMES:
            lo = int(m.group(1))
            hi = int(m.group(2)) if m.group(2) else lo
            for n in pending:
                out.append({'sphere': m.group(3), 'min': n, 'max': n})
            pending = []
            out.append({'sphere': m.group(3), 'min': lo, 'max': hi})
        else:
            pending += [int(d) for d in re.findall(r'\b(\d)\b', part)]
    return out


def parse_spheres(raw):
    """Build the seed's spheres_parsed structure from a requirement expression.

    Everything before the first ';' is what the rote needs; clauses after it are
    the book's "possibly with ... added" variants, which become optional
    components (required: false) so Grimoire's canCast() does not demand them.

    Within a segment the connector decides the shape:
      "A, or B, or C"      one component, three alternatives
      "A, B, and C"        three required components
      "A, plus B or C"     A required, then one component of alternatives
    A segment mixing "or" and "and" with no "plus" is emitted as alternatives.
    The seed's structure cannot express an AND-group nested inside an
    alternative, and being permissive is the safer error for canCast().
    """
    comps = []
    for n, seg in enumerate(s for s in raw.split(';') if s.strip()):
        required = (n == 0)

        def add(text, req):
            alts = _alts(text)
            if alts:
                comps.append({'required': req, 'alternatives': alts})

        if re.search(r'\bplus\b', seg):
            left, right = re.split(r'\bplus\b', seg, maxsplit=1)
            for clause in re.split(r',|\band\b', left):
                add(clause, required)
            add(right, required)
        elif re.search(r'\bor\b', seg):
            add(seg, required)
        else:
            for clause in re.split(r',|\band\b', seg):
                add(clause, required)
    return comps


def rote_seed_records(rotes):
    """Rote records shaped for app/server/rotes-seed.json.

    seed_key is sha1("name|page|source")[:16] — the scheme tools/clean_rotes.py
    uses and db.js keys its upsert on, so re-running never duplicates a rote.
    spheres_parsed and sphere_minimums are stored as JSON strings, as the
    existing 955 records are.
    """
    out = []
    for r in rotes:
        source = f'M20 Book of the Fallen page {r["page"]}'
        key = hashlib.sha1(
            f'{r["name"]}|{r["page"]}|{source}'.encode('utf-8')).hexdigest()[:16]
        numerals = dots_to_numerals(r['spheres_raw'])
        parsed = parse_spheres(numerals)
        mins = {}
        for comp in parsed:
            for alt in comp['alternatives']:
                cur = mins.get(alt['sphere'])
                mins[alt['sphere']] = alt['min'] if cur is None else min(cur, alt['min'])
        rec = {
            'name': r['name'],
            'chapter': 'And All the Powers of Hell',
            'page': r['page'],
            'source': source,
            'spheres_raw': numerals,
            'spheres_parsed': json.dumps(parsed),
            'sphere_minimums': json.dumps(mins),
            'description': r['text'],
            'faction': 'Nephandi',
            'source_book': 'M20 Book of the Fallen',
            'seed_key': key,
            'truncated': False,
            'aka': r['aka'],
            'note': 'Sphere requirement converted from the book\'s dot notation; '
                    'clauses after the first ";" are the optional "possibly with" variants.',
        }
        out.append(rec)
    return out


def num_or_none(v):
    """"4" -> 4, "2+" -> 2, "N/A" -> None — wonders.json stores numbers or null."""
    if v is None:
        return None
    m = re.match(r'^(\d+)', str(v))
    return int(m.group(1)) if m else None


def wonder_records(arts):
    """Artifact records shaped for app/public/data/wonders.json."""
    out = []
    for a in arts:
        # A Wonder's Background cost is its rating; black books print the rating
        # in the title and no stat line, devices print a stat line.
        bg = num_or_none(a.get('backgroundCost')) or (a['rating'] or None)
        rec = {
            'name': a['name'],
            'book_page': a['page'],
            'source_book': 'M20 Book of the Fallen',
            'source_page': a['page'],
            'background_cost': bg,
            'arete': num_or_none(a.get('arete')),
            'quintessence': num_or_none(a.get('quintessence')),
            'gnosis': None,
            'description': a['text'],
            'type': 'Black Book' if a['kind'] == 'black_book' else (a['type'] or 'Device'),
        }
        if a.get('costNote'):
            rec['note'] = a['costNote']
        out.append(rec)
    return out


def main():
    traits = load('traits.json')
    focus = load('focus.json')
    lore = {}

    # Origins, sects, Essences and Qliphoth: structure inline, prose to the lore file.
    origins = []
    for o in load('origins.json'):
        origins.append({'id': o['id'], 'name': o['name'], 'page': o['page'],
                        'summary': o['summary']})
        lore.setdefault('origins', {})[o['id']] = o['text']

    sects = []
    for s in load('sects.json'):
        sects.append({'id': s['id'], 'name': s['name'], 'subtitle': s['subtitle'],
                      'group': s['group'], 'page': s['page'],
                      'description': first_sentences(s['intro'])})
        lore.setdefault('sects', {})[s['id']] = {
            'intro': s['intro'], 'organization': s['organization'],
            'focus': s['focus'], 'luminaries': s['luminaries']}

    essences = []
    for e in load('essences.json'):
        essences.append({'id': e['id'], 'name': e['name'],
                         'm20Essence': e['m20Essence'], 'page': e['page'],
                         'description': first_sentences(e['text'])})
        lore.setdefault('essences', {})[e['id']] = e['text']

    qlippoth = []
    for q in load('qlippoth.json'):
        qlippoth.append({'id': q['id'], 'rank': q['rank'], 'name': q['name'],
                         'title': q['title'], 'page': q['page'],
                         'description': first_sentences(q['text'])})
        lore.setdefault('qlippoth', {})[q['id']] = q['text']

    fallen = {
        'SOURCE': {
            'title': 'M20 Book of the Fallen',
            'publisher': 'White Wolf Entertainment / Onyx Path',
            'year': 2019,
            'authors': 'Satyros Phil Brucato and Jacqueline Bryk',
            'developer': 'Satyros Phil Brucato',
        },
        # Rules notes that drive the implementation, quoted where it matters.
        'NOTES': {
            'qlippothicSpheres':
                'p. 103: "There\'s no rules-based difference between, say, '
                'Qlippothic Entropy and the regular Entropy Sphere." The Qlipha '
                'association is flavour; Sphere names and systems are unchanged.',
            'traitLimits':
                'p. 117: Nephandic Merits and Flaws "can exceed the usual limits '
                'on such Traits."',
            'pactPoints':
                'p. 121: "A mage who gains character points through an Infernal '
                'pact cannot spend those points on Arete or Spheres."',
            'pactOptional':
                'p. 120: Infernal Pacts are an optional rule the book does not '
                'endorse for player characters.',
            'absoluteSphere':
                'p. 104: The Absolute, a rumoured 10th Sphere, is archmage-tier '
                'lore — catalogued but not purchasable at creation.',
        },
        'ORIGINS': origins,
        'SECTS': sects,
        'ESSENCES': essences,
        # Small and needed during creation (the Sphere rank panel), so inline.
        'SPHERE_QLIPHA': load('sphere_qlipha.json'),
        'QLIPPOTH': qlippoth,
        'PACT_LEVELS': load('pacts.json'),
        'MERITS': trait_rows(traits, 'merit', M_PREFIX, lore),
        'FLAWS': trait_rows(traits, 'flaw', M_PREFIX, lore),
        'INVESTMENTS': trait_rows(traits, 'investment', I_PREFIX, lore),
        'HERESIES': focus_rows(focus, 'heresy', lore),
        'PARADIGMS': focus_rows(focus, 'paradigm', lore),
        'PRACTICES': focus_rows(focus, 'practice', lore),
        'INSTRUMENTS': focus_rows(focus, 'instrument', lore),
    }

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        f.write('const FALLEN = ' + json.dumps(fallen, indent=1, ensure_ascii=False) + ';\n')
        f.write(HELPERS)
    with open(LORE, 'w', encoding='utf-8') as f:
        json.dump(lore, f, indent=1, ensure_ascii=False)
        f.write('\n')

    # Rote and wonder records for the merge step.
    rotes = rote_seed_records(load('rotes.json'))
    wonders = wonder_records(load('artifacts.json'))
    for name, rows in (('out-rotes.json', rotes), ('out-wonders.json', wonders)):
        with open(os.path.join(SRC, name), 'w', encoding='utf-8') as f:
            json.dump(rows, f, indent=1, ensure_ascii=False)
            f.write('\n')

    counts = {k: len(v) for k, v in fallen.items() if isinstance(v, list)}
    kb = lambda p: os.path.getsize(p) / 1024
    print(f'wrote {os.path.relpath(OUT, ROOT)}  {kb(OUT):.0f} KB')
    print('  ' + '  '.join(f'{k}={v}' for k, v in counts.items())
          + f'  ({sum(counts.values())} entries)')
    print(f'wrote {os.path.relpath(LORE, ROOT)}  {kb(LORE):.0f} KB  '
          f'({sum(len(v) for v in lore.values())} keys, lazy-fetched)')
    print(f'wrote tools/fallen-src/out-rotes.json    {len(rotes)} rotes')
    print(f'wrote tools/fallen-src/out-wonders.json  {len(wonders)} wonders')


HEADER = '''/* ═══════════════════════════════════════════════════════════════════════════
   THE FALLEN — Nephandi catalogue for M20
   Source: Satyros Phil Brucato and Jacqueline Bryk, "M20 Book of the Fallen"
   (White Wolf / Onyx Path, 2019). Page numbers refer to that book.
   Generated by tools/build_fallen_catalogue.py from tools/fallen-src/ — edit
   those chunks, not this file. Loaded after data.js; exposes a global FALLEN.

   Nephandi are mechanically ordinary Awakened mages, so this catalogue adds no
   new rules engine. A Nephandus is an 'awakened' character whose affiliation is
   'Nephandi'; the sect lives in the existing `tradition` column. See FALLEN.NOTES.

     • Qlippothic Spheres are flavour only — the nine Spheres keep their names,
       ratings and systems. SPHERE_QLIPHA holds the p.104 descriptors.
     • The four Abyssal Essences rename the four M20 Essences (ESSENCES[].m20Essence).
     • Barabbi keep a prior Tradition / Convention / Craft; Caul-Born and
       Widderslainte have none.
     • MERITS, FLAWS and INVESTMENTS use the same row shape as M20.MERITS, so the
       existing merit/flaw pipeline renders, costs and exports them unchanged.
   ═══════════════════════════════════════════════════════════════════════════ */
'''

HELPERS = '''
/* ─── Lookups ─────────────────────────────────────────────────────────────── */

FALLEN.originById = id => FALLEN.ORIGINS.find(o => o.id === id) || null;
FALLEN.sectById   = id => FALLEN.SECTS.find(s => s.id === id) || null;
FALLEN.sectByName = name =>
  FALLEN.SECTS.find(s => s.name.toLowerCase() === String(name || '').toLowerCase()) || null;
FALLEN.essenceById = id => FALLEN.ESSENCES.find(e => e.id === id) || null;

// The Abyssal name for one of the four M20 Essences ('Dynamic' -> 'Destructive').
FALLEN.essenceForM20 = name =>
  FALLEN.ESSENCES.find(e => e.m20Essence.toLowerCase() === String(name || '').toLowerCase()) || null;

// p.104 descriptor for a Sphere, by the Sphere's data.js id.
FALLEN.qliphaForSphere = id =>
  FALLEN.SPHERE_QLIPHA.find(q => q.sphere === String(id || '').toLowerCase()) || null;
FALLEN.qliphaById = id => FALLEN.QLIPPOTH.find(q => q.id === id) || null;

FALLEN.pactLevel = n => FALLEN.PACT_LEVELS.find(p => p.level === Number(n)) || null;

// Freebie points an Infernal Pact grants (p. 121: level N grants N points, and
// they may never be spent on Arete or Spheres).
FALLEN.pactFreebies = n => {
  const lvl = Math.max(0, Math.min(10, Math.floor(Number(n) || 0)));
  return lvl;
};

// Sect names, for the affiliation picker's fourth tab.
FALLEN.sectNames = () => FALLEN.SECTS.map(s => s.name);

// Groups the sects fall into ("The Unholy Trinity", "The Secret Scourge").
FALLEN.sectGroups = () => {
  const seen = [];
  FALLEN.SECTS.forEach(s => { if (!seen.includes(s.group)) seen.push(s.group); });
  return seen;
};
FALLEN.sectsInGroup = group => FALLEN.SECTS.filter(s => s.group === group);

/* ─── Merits, Flaws, Investments ──────────────────────────────────────────── */

FALLEN.meritById = id =>
  FALLEN.MERITS.find(m => m.id === id) || FALLEN.INVESTMENTS.find(m => m.id === id) || null;
FALLEN.flawById = id => FALLEN.FLAWS.find(f => f.id === id) || null;

// Everything that belongs in the Merits column of Step 6: the four Nephandic
// Merits plus the Investments, which the book calls "essentially Special
// Advantages or Supernatural Merits" (p. 121).
FALLEN.meritRows = () => FALLEN.MERITS.concat(FALLEN.INVESTMENTS);
FALLEN.flawRows  = () => FALLEN.FLAWS;
FALLEN.isInvestment = id => FALLEN.INVESTMENTS.some(m => m.id === id);

/* ─── Focus ───────────────────────────────────────────────────────────────── */

FALLEN.focusLists = () => ({
  paradigms:   FALLEN.PARADIGMS,
  practices:   FALLEN.PRACTICES,
  instruments: FALLEN.INSTRUMENTS,
  heresies:    FALLEN.HERESIES,
});

// data-prism.js already ships Maleficia and Infernal Sciences; callers merging
// the Fallen practices into another list should drop names it already has.
FALLEN.practicesNotIn = names => {
  const have = (names || []).map(n => String(n).toLowerCase());
  return FALLEN.PRACTICES.filter(p => !have.includes(p.name.toLowerCase()));
};

/* ─── Character helpers ───────────────────────────────────────────────────── */

FALLEN.isNephandi = c => !!c && c.affiliation === 'Nephandi';

// Barabbi keep the affinity Sphere(s) of the faction they betrayed; Caul-Born
// and Widderslainte have no faction affinity and may choose any of the nine.
FALLEN.needsPriorFaction = c => !!c && c.nephandi_origin === 'barabbi';

if (typeof module !== 'undefined' && module.exports) module.exports = FALLEN;
'''

if __name__ == '__main__':
    main()
