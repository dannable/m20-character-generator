#!/usr/bin/env python3
"""
clean_rotes.py — repeatable cleanup for app/server/rotes-seed.json

The seed is a raw pdftotext extraction of a rote compendium (954 rotes; `page` is
the compendium page, `source` the original book citation).  Descriptions were
hard-truncated at ~175 characters during extraction and cannot be recovered
without the source PDFs; everything else listed in REVIEW-2026-10-17.md §5 is fixed
here.  Idempotent: if rotes-seed.json.orig exists it is used as the input.

Fixes:
  1. seed_key — stable 16-hex id derived from the ORIGINAL (name, page, source) so
     app/server/db.js can update rows in place without changing rote ids
     (characters reference rotes by id).  Formula must match roteSeedKey() in db.js:
         sha1("<name>|<page>|<source>")[:16]   (+ "|<n>" for the n-th duplicate)
  2. garbage names (NAME_FIXES) — headings lost in extraction; a provisional name is
     reconstructed from the description and flagged name_reconstructed with name_raw
  3. source / source_book oddities ("pas 120", leading "- ", split "Edition")
  4. Technocratic sphere names (Data → Correspondence, Dimensional Science → Spirit,
     Primal Utility → Prime) mapped in spheres_parsed / sphere_minimums; spheres_raw
     keeps the original wording.  Only records containing those names are re-parsed;
     the parser is validated against the existing output of all other records.
  5. descriptions: whitespace, stray column-bleed letters at either end, trailing
     bled citations ("... Digital Web page 98"), "xx- yy" hyphen breaks (joined only
     when the result is a dictionary/corpus word), the Adad/"Squaring the Circle"
     header bleed
  6. truncated: true when the description ends mid-sentence
  7. straight apostrophes in source / source_book unified to ’ (names untouched)

Usage:  python3 tools/clean_rotes.py [--dry-run] [--out PATH] [--report PATH] [--dump NAME]
"""
import argparse
import collections
import hashlib
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'app', 'server', 'rotes-seed.json')
ORIG = SRC + '.orig'
DICT_PATHS = ['/usr/share/dict/american-english', '/usr/share/dict/words']

CANON = ['Correspondence', 'Entropy', 'Forces', 'Life', 'Matter', 'Mind', 'Prime', 'Spirit', 'Time']
TECHNO = {'Data': 'Correspondence', 'Dimensional Science': 'Spirit', 'Primal Utility': 'Prime'}
RE_TECHNO = re.compile(r'\b(' + '|'.join(map(re.escape, TECHNO)) + r')\b')
RE_WS = re.compile(r'\s+')
RE_TERMINAL = re.compile(r'[.!?)"”’\]…]$')
RE_HYPHEN = re.compile(r'(?<![\w-])([A-Za-z]+)- ([A-Za-z]+)')
RE_LEAD_STRAY = re.compile(r'^(?:[a-z]{1,2} )+(?=[A-Z])')
RE_TRAIL_STRAY = re.compile(r'\s(?![aI]\b)[A-Za-z]$')

NOTE_NAME = 'provisional name reconstructed from the description; the heading was lost in extraction'

# original name -> provisional name.  All of these were numbers, lone fragments of
# a parenthetical, or a citation that replaced the heading.
NAME_FIXES = {
    '188': 'Trace to Source',
    '610': 'Petrify the Undead',
    'Magick': 'Cold Water Magick',
    'Drug)': 'Prime Generation (Drug)',
    'DMSO (': 'DMSO (Dimethyl Sulfoxide)',
    'Chi)': 'Heal Self (Channel Chi)',
    'Talisman)': 'Enchant Object (Create Talisman)',
    'Gauntlet)': 'Strengthen/Weaken Gauntlet',
    'Deviant)': 'Identify Reality Deviant',
    'Blade)': 'Quickened Reflexes',
    'Conditioning)': 'Remove Conditioning',
    'Mage: The Ascension Second': 'Scry Distant Location',
}

# original name -> (source, source_book) overrides
SOURCE_FIXES = {
    'Mage: The Ascension Second': ('Mage: The Ascension Second Edition page 189', 'Mage: The Ascension Second Edition'),
    'Holy Union': ('Mage: The Ascension page 197-199', 'Mage: The Ascension'),
}

JOIN_WHITELIST = {'technomancer', 'technomancers', 'quintessential'}
HYPHEN_PREFIXES = {'non', 'pre', 'post', 'self', 'well', 'anti', 'semi', 're', 'co', 'ex',
                   'multi', 'half', 'high', 'low', 'long', 'short', 'full', 'one', 'two',
                   'three', 'five', 'all', 'un', 'sub', 'super', 'inter', 'cross', 'counter',
                   'pseudo', 'quasi', 'proto', 'neo', 'ultra', 'mid'}


# ── seed key ─────────────────────────────────────────────────────────────────────

def seed_key(name, page, source, n=0):
    base = f'{name}|{page}|{source}' + (f'|{n}' if n else '')
    return hashlib.sha1(base.encode('utf-8')).hexdigest()[:16]


# ── sphere parser (mirrors the extractor's behaviour) ────────────────────────────

RE_ALT = re.compile(r'^(?:(' + '|'.join(CANON) + r') )?(\d)$')


def parse_spheres(raw):
    """Return (groups, minimums).  Everything after the first ' OR ' is ignored;
    groups are comma separated; a group is 'optional '? Sphere N ( or (Sphere )?N )*
    and is skipped if it does not match exactly."""
    text = raw.split(' OR ')[0].strip()
    groups, mins = [], {}
    for part in [p.strip() for p in text.split(',') if p.strip()]:
        required = True
        if part.startswith('optional '):
            required = False
            part = part[len('optional '):]
        alts, ok = [], True
        for tok in [t.strip() for t in part.split(' or ')]:
            m = RE_ALT.match(tok)
            if not m:
                ok = False
                break
            sphere, rank = m.group(1), int(m.group(2))
            if sphere:
                alts.append({'sphere': sphere, 'min': rank, 'max': rank})
            elif alts:
                alts[-1]['max'] = max(alts[-1]['max'], rank)
            else:
                ok = False
                break
        if not ok or not alts:
            continue
        groups.append({'required': required, 'alternatives': alts})
        if required:
            for a in alts:
                mins[a['sphere']] = min(mins.get(a['sphere'], 99), a['min'])
    return groups, mins


def validate_parser(records):
    """Compare parse_spheres() with the existing output on non-Technocratic records."""
    same = diff = 0
    examples = []
    for r in records:
        if RE_TECHNO.search(r['spheres_raw']):
            continue
        g, m = parse_spheres(r['spheres_raw'])
        if g == json.loads(r['spheres_parsed']) and m == json.loads(r['sphere_minimums']):
            same += 1
        else:
            diff += 1
            if len(examples) < 8:
                examples.append(f"{r['name']!r}: {r['spheres_raw']!r}")
    return same, diff, examples


# ── text helpers ─────────────────────────────────────────────────────────────────

def load_dictionary():
    for p in DICT_PATHS:
        if os.path.exists(p):
            with open(p, encoding='utf-8', errors='ignore') as fh:
                return {w.strip().lower() for w in fh if w.strip() and "'" not in w}
    return set()


def join_hyphens(text, dictionary, corpus, stats):
    def repl(m):
        a, b = m.group(1), m.group(2)
        jl = (a + b).lower()
        if jl in dictionary or corpus.get(jl, 0) > 0 or jl in JOIN_WHITELIST or \
                (b[0].islower() and a.lower() not in dictionary and a.lower() not in HYPHEN_PREFIXES):
            stats['joined'].append(a + b)
            return a + b
        stats['hyphenated'].append(a + '-' + b)
        return a + '-' + b
    return RE_HYPHEN.sub(repl, text)


def build_cite_regex(records):
    """'<known source book> page N' at the very end of a description is a bled
    citation from the following entry's header."""
    books = {b for r in records for b in (r['source_book'], r['source_book'].replace('’', "'")) if len(b) > 3}
    alts = '|'.join(re.escape(b) for b in sorted(books, key=len, reverse=True))
    return re.compile(r'[,;]?\s+(?:' + alts + r'),? page \d+(?:-\d+)?$')


RE_TRAILING_CITE = None  # set in main() once the source books are known


def clean_description(r, log):
    d = RE_WS.sub(' ', r['description']).strip()
    m = RE_TRAILING_CITE.search(d)
    if m and not d.endswith(')'):
        log['bled citations stripped'].append(f"{r['name']!r}: {d[m.start():]!r}")
        d = d[:m.start()].rstrip(' ,;')
    m = RE_LEAD_STRAY.match(d)
    if m:
        log['leading stray tokens stripped'].append(f"{r['name']!r}: {m.group(0)!r}")
        d = d[m.end():]
    m = RE_TRAIL_STRAY.search(d)
    if m:
        log['trailing stray tokens stripped'].append(f"{r['name']!r}: {m.group(0)!r}")
        d = d[:m.start()].rstrip(' ,;')
    return d.strip()


# ── metrics ──────────────────────────────────────────────────────────────────────

def metrics(records):
    m = collections.OrderedDict()
    m['records'] = len(records)
    m['garbage names'] = sum(1 for r in records if r['name'] in NAME_FIXES or re.fullmatch(r'\d+', r['name']))
    techno = [r for r in records if RE_TECHNO.search(r['spheres_raw'])]
    m['rotes using Technocratic sphere names'] = len(techno)
    m['  …with the Technocratic sphere missing from sphere_minimums'] = sum(
        1 for r in techno
        if any(TECHNO[t] not in json.loads(r['sphere_minimums']) and not re.search(r'optional [^,]*' + t, r['spheres_raw'])
               for t in set(RE_TECHNO.findall(r['spheres_raw'])) if re.search(t + r' \d', r['spheres_raw'].split(' OR ')[0])))
    m['  …with empty sphere_minimums'] = sum(1 for r in techno if json.loads(r['sphere_minimums']) == {})
    m['hyphen breaks "xx- yy"'] = sum(len(RE_HYPHEN.findall(r['description'])) for r in records)
    m['descriptions ending in a bled citation'] = sum(1 for r in records if RE_TRAILING_CITE.search(r['description']) and not r['description'].endswith(')'))
    m['descriptions with leading stray letters'] = sum(1 for r in records if RE_LEAD_STRAY.match(r['description']))
    m['descriptions with trailing stray letter'] = sum(1 for r in records if RE_TRAIL_STRAY.search(r['description']))
    m['descriptions starting mid-word (lowercase)'] = sum(1 for r in records if re.match(r'^[a-z]', r['description']))
    m['empty descriptions'] = sum(1 for r in records if not r['description'].strip())
    m['descriptions ending mid-sentence'] = sum(1 for r in records if r['description'].strip() and not RE_TERMINAL.search(r['description'].strip()))
    m['flagged truncated'] = sum(1 for r in records if r.get('truncated'))
    m['source_book values'] = len({r['source_book'] for r in records})
    m['odd source_book (empty / fragment / "pas N" / leading "- ")'] = sum(
        1 for r in records if not r['source_book'] or r['source_book'] in ('Edition', 'Ascension')
        or ' pas ' in r['source_book'] or r['source_book'].startswith('- '))
    m['straight apostrophes in source/source_book'] = sum(1 for r in records if "'" in r['source'] + r['source_book'])
    m['records with seed_key'] = sum(1 for r in records if r.get('seed_key'))
    return m


def fmt_report(before, after, extra):
    lines = ['rotes-seed.json cleanup report', '=' * 64, f'{"metric":<60}{"before":>8}{"after":>8}']
    for k in list(dict.fromkeys(list(before.keys()) + list(after.keys()))):
        lines.append(f'{k:<60}{str(before.get(k, "-")):>8}{str(after.get(k, "-")):>8}')
    lines.append('')
    for k, v in extra.items():
        if isinstance(v, list):
            lines.append(f'{k} ({len(v)}):')
            lines += [f'    {x}' for x in v]
        else:
            lines.append(f'{k}: {v}')
    return '\n'.join(lines)


# ── main ─────────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--out', default=SRC)
    ap.add_argument('--report', default=os.path.join(ROOT, 'tools', 'reports', 'rotes-cleanup-report.txt'))
    ap.add_argument('--dump', action='append', default=[], metavar='NAME')
    ap.add_argument('--no-grimoire', action='store_true',
                    help='skip the description enrichment from Enlightened-grimoire.pdf')
    args = ap.parse_args()

    src = ORIG if os.path.exists(ORIG) else SRC
    with open(src, encoding='utf-8') as fh:
        raw = json.load(fh)
    print(f'input: {src} ({len(raw)} records)')
    records = [dict(r) for r in raw]
    global RE_TRAILING_CITE
    RE_TRAILING_CITE = build_cite_regex(records)
    before = metrics(records)
    extra = collections.OrderedDict()
    log = collections.defaultdict(list)

    # 1. seed keys from the ORIGINAL fields (db.js backfills existing rows the same way)
    seen = collections.Counter()
    for r in records:
        base = f"{r['name']}|{r['page']}|{r['source']}"
        r['seed_key'] = seed_key(r['name'], r['page'], r['source'], seen[base])
        seen[base] += 1
    extra['duplicate (name,page,source) triples given ordinal keys'] = sum(1 for c in seen.values() if c > 1)
    assert len({r['seed_key'] for r in records}) == len(records), 'seed_key collision'

    # 2. names
    for r in records:
        if r['name'] in NAME_FIXES:
            r['name_raw'] = r['name']
            r['name'] = NAME_FIXES[r['name_raw']]
            r['name_reconstructed'] = True
            r['note'] = NOTE_NAME
            log['names reconstructed'].append(f"{r['name_raw']!r} -> {r['name']!r}  (p.{r['page']}, {r['source'] or 'no source'}; {r['spheres_raw']})")

    # 3. sources
    for r in records:
        key = r.get('name_raw', r['name'])
        if key in SOURCE_FIXES:
            r['source'], r['source_book'] = SOURCE_FIXES[key]
            log['sources fixed'].append(f"{r['name']!r}: {r['source']!r} / {r['source_book']!r}")
            continue
        src_, sb = r['source'], r['source_book']
        new_src = re.sub(r'^-\s+', '', src_)
        new_src = re.sub(r'\bpas (\d+)', r'page \1', new_src)
        new_sb = re.sub(r'^-\s+', '', sb)
        new_sb = re.sub(r'\s+pas \d+$', '', new_sb)
        if (new_src, new_sb) != (src_, sb):
            r['source'], r['source_book'] = new_src, new_sb
            log['sources fixed'].append(f"{r['name']!r}: {new_src!r} / {new_sb!r}")
        r['source'] = r['source'].replace("'", '’')
        r['source_book'] = r['source_book'].replace("'", '’')

    # 4. Technocratic spheres
    same, diff, examples = validate_parser(records)
    extra['parser validation on non-Technocratic records (identical / different)'] = f'{same} / {diff}'
    if examples:
        extra['parser differences (left untouched)'] = examples
    for r in records:
        if not RE_TECHNO.search(r['spheres_raw']):
            continue
        mapped = RE_TECHNO.sub(lambda m: TECHNO[m.group(1)], r['spheres_raw'])
        groups, mins = parse_spheres(mapped)
        old_mins = json.loads(r['sphere_minimums'])
        r['spheres_parsed'] = json.dumps(groups)
        r['sphere_minimums'] = json.dumps(mins)
        r['spheres_mapped'] = mapped
        log['Technocratic spheres mapped'].append(f"{r['name']!r}: {r['spheres_raw']!r} -> minimums {old_mins} => {mins}")

    # 5. descriptions
    dictionary = load_dictionary()
    adad = next((r for r in records if r['name'] == 'Adad' and r['description'].startswith('Squaring the Circle')), None)
    new_records = []
    if adad:
        sq = {
            'name': 'Squaring the Circle', 'chapter': adad['chapter'], 'page': adad['page'],
            'source': 'Order of Reason page 88', 'source_book': 'Order of Reason',
            'faction': 'Technocratic Union', 'spheres_raw': 'Correspondence 2, Mind 1',
            'description': '', 'note': "header bled into the Adad entry; description not captured by extraction",
        }
        g, m = parse_spheres(sq['spheres_raw'])
        sq['spheres_parsed'], sq['sphere_minimums'] = json.dumps(g), json.dumps(m)
        sq['seed_key'] = seed_key(sq['name'], sq['page'], sq['source'])
        new_records.append(sq)
        adad['description'] = ''
        adad['note'] = "description lost in extraction (replaced by the 'Squaring the Circle' header); see Dead Magic p.53"
        log['records added'].append("'Squaring the Circle' (Order of Reason p.88, Correspondence 2, Mind 1) split out of Adad")
    for r in records:
        r['description'] = clean_description(r, log)
    corpus = collections.Counter()
    for r in records:
        for w in re.findall(r'[A-Za-z]+', r['description'] + ' ' + r['name']):
            corpus[w.lower()] += 1
    hstats = {'joined': [], 'hyphenated': []}
    for r in records:
        r['description'] = join_hyphens(r['description'], dictionary, corpus, hstats)
        r['description'] = RE_WS.sub(' ', r['description']).strip()
    log['hyphen breaks joined'] = hstats['joined']
    log['hyphen breaks kept as compound'] = hstats['hyphenated']
    records.extend(new_records)

    # 6. truncated flag
    for r in records:
        d = r['description']
        r['truncated'] = bool(d) and not RE_TERMINAL.search(d)

    for k in ('names reconstructed', 'sources fixed', 'Technocratic spheres mapped', 'records added',
              'bled citations stripped', 'leading stray tokens stripped', 'trailing stray tokens stripped',
              'hyphen breaks joined', 'hyphen breaks kept as compound'):
        extra[k] = log.get(k, [])

    after = metrics(records)
    report = fmt_report(before, after, extra)
    print(report)
    for r in records:
        if r['name'] in args.dump or r.get('name_raw') in args.dump:
            print('\n--- ' + r['name']); print(json.dumps(r, ensure_ascii=False, indent=1))

    if args.dry_run:
        print('\n(dry run: nothing written)')
        return
    if not os.path.exists(ORIG):
        shutil.copy2(SRC, ORIG)
        print(f'original kept at {ORIG}')
    with open(args.out, 'w', encoding='utf-8') as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    print(f'wrote {args.out} ({len(records)} records)')
    os.makedirs(os.path.dirname(args.report), exist_ok=True)
    with open(args.report, 'w', encoding='utf-8') as fh:
        fh.write(report + '\n')
    print(f'report: {args.report}')

    # 7. full descriptions from the Enlightened Grimoire PDF (the document this seed was
    #    extracted from), when it is present in the project root
    pdf = os.path.join(ROOT, 'Enlightened-grimoire.pdf')
    if not args.no_grimoire and os.path.exists(pdf):
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # python -I drops it
        import enrich_rotes_from_grimoire as E
        print('\n── enriching descriptions from Enlightened-grimoire.pdf ──')
        E.run(args.out, pdf, verbose=False)
    elif not args.no_grimoire:
        print(f'\n(no {os.path.basename(pdf)} in {ROOT}; descriptions left as extracted)')


if __name__ == '__main__':
    main()
