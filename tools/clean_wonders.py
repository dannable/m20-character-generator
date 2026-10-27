#!/usr/bin/env python3
"""
clean_wonders.py — repeatable cleanup for app/public/data/wonders.json

The file is a raw pdftotext extraction of the "Mystic Armory" wonders compendium
(449 entries, alphabetical).  This script fixes the extraction artifacts found in
REVIEW-2026-10-17.md §5 and writes the cleaned file in place, keeping the raw
original as wonders.json.orig.  It is idempotent: if wonders.json.orig exists it is
used as the input, so re-running always regenerates from the raw data.

Fixes applied (in this order, per description):
  1. whitespace normalisation
  2. running headers removed:  "N Mystic Armory" (even pages) and
     "<Section name> N" (odd pages, section list below)
  3. leading source citation removed ("<source_book> page N (...)")
  4. trailing next-entry name removed — the *next entry in the source book*, which
     is not the next JSON record, so the tail is matched against every wonder
     name in the corpus (incl. "X, The" / "The X" and apostrophe variants) and
     against section headings when preceded by terminal punctuation
  5. "xx- yy" hyphen breaks joined to "xxyy" only when that word is in the system
     dictionary or appears elsewhere in the corpus; otherwise kept as "xx-yy"
  6. per-record surgery (RECORD_FIXES): heading rows Armor/Car/Weapons, the four
     mega-entries, swallowed index
  7. source_book apostrophes unified to the typographic form (’)
  8. 'type' inferred from capitalised keywords (Talisman/Device/Charm/Gadget/
     Trinket/Periapt/Fetish/Artifact), 'Unknown' when absent or ambiguous
  9. background_cost / arete / quintessence / gnosis normalised to
     int | {"min","max"} | {"text"} | null

New optional fields on a record: type, truncated (bool: text ends mid-sentence),
needs_review (bool), review_note (str), long_entry (bool), split_from (str).  Names are never changed except for the
three heading rows, because characters reference wonders by name.

Usage:  python3 tools/clean_wonders.py [--dry-run] [--out PATH] [--report PATH]
"""
import argparse
import collections
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'app', 'public', 'data', 'wonders.json')
ORIG = SRC + '.orig'
DICT_PATHS = ['/usr/share/dict/american-english', '/usr/share/dict/words',
              '/usr/share/dict/british-english']

# Mystic Armory chapter / section names that appear as odd-page running headers
# ("Mental Manipulation 87") and as trailing section headings after the last
# entry of a section.
SECTIONS = [
    'Appendix: Optional Rules', 'Books and Learning', 'Computers',
    'Engineering and Materials', 'Information', 'Internal', 'Life and Nature',
    'Mental Manipulation', 'Miscellaneous', 'Other Beings', 'Primal Energy',
    'Transit and Communication', 'Weapons', 'Wearables',
]
# Sub-section headings that can trail an entry (only stripped after ./!/?)
TRAILING_HEADINGS = SECTIONS + [
    'Armor', 'Blades', 'Defenses', 'Firearms', 'Identification', 'Other',
    'Perceptions', 'Sound', 'Vehicles', 'Index',
]

RE_EVEN_HDR = re.compile(r'(?<![\w-])\d{1,3} Mystic Armory(?!\w)')
RE_ODD_HDR = re.compile(r'(?<!\w)(?:' + '|'.join(map(re.escape, SECTIONS)) + r') \d{1,3}(?!\w)')
RE_HYPHEN = re.compile(r'(?<![\w-])([A-Za-z]{1,}(?:[A-Za-z])*)- ([A-Za-z]+)')
RE_WS = re.compile(r'\s+')
RE_LEAD_CITE = re.compile(r'^[A-Z][^.]{3,70}? page \d+(?:-\d+)?(?: \([^)]{1,40}\))?\s+(?=[A-Z])')
RE_LEAD_HEADING = re.compile(r'^(' + '|'.join(map(re.escape, SECTIONS + ['Armor', 'Blades', 'Defenses', 'Firearms', 'Vehicles', 'Identification', 'Sound', 'Perceptions'])) + r') (?=[A-Z])')
RE_TERMINAL = re.compile(r'[.!?)"”’\]…]$')

TYPE_KEYWORDS = {
    # common English words: capitalised game term only
    'Device': r'\bDevices?\b',
    'Charm': r'\bCharms?\b',
    # rare words: any case
    'Talisman': r'(?i)\bTalismans?\b',
    'Gadget': r'(?i)\bGadgets?\b',
    'Trinket': r'(?i)\bTrinkets?\b',
    'Periapt': r'(?i)\bPeriapts?\b|\bMatri(?:x|ces)\b',
    'Fetish': r'(?i)\bFetish(?:es)?\b',
    'Artifact': r'(?i)\bArtifacts?\b',
}

# ── per-record surgery ───────────────────────────────────────────────────────────
# Each entry: name -> function(record, by_name) -> None.  Applied after the generic
# text passes.  `by_name` maps every surviving record name to the record so one
# fix can move text into another record.  A fix may set record['_drop'] = True.

ARMOR_INTRO = ('Armor has had a recent resurgent in popular culture, thanks to the popularity '
               'of technology-based superheroes. This has led the Technocratic Union to '
               'reinvest in hardsuits and other high-tech armors as the Consensus moves '
               'towards them. Of course, the mystics had never stopped enchanting or '
               'otherwise making enhanced armor.')
WEAPONS_INTRO = ('other weapons have been enhanced consistently throughout history. This chapter '
                 'is broken into sections based on what the weapon is: Blades, Defenses, '
                 'Firearms, and Other.')


def _loose(phrase):
    """Regex for a phrase as it may appear before hyphen joining: any space may be
    whitespace and any letter pair may hide a '- ' line break."""
    parts = []
    for ch in phrase:
        if ch == ' ':
            parts.append(r'\s+')
        else:
            parts.append(re.escape(ch) + r'(?:-\s)?')
    return re.compile(''.join(parts))


def _cut_between(text, start_marker, end_marker):
    """Remove text[start:end] (markers inclusive of start, exclusive of end)."""
    i = text.find(start_marker)
    j = text.find(end_marker, i + len(start_marker)) if i >= 0 else -1
    if i < 0 or j < 0:
        return text, None
    return (text[:i] + text[j:]).strip(), text[i:j].strip()


def fix_armor(rec, by_name):
    """The 'Armor' heading row (p.166) duplicates 'Alanson Light Hardsuit' (p.162).
    Both copies carry the second half of the Zulu Warshield entry interleaved by
    column flow ("under- warrior carrying it ... by 2. neath a trench coat").
    Keep the longer copy under the real name, move the Zulu text home, drop 'Armor'."""
    real = by_name.get('Alanson Light Hardsuit')
    if real is None:                      # defensive: no real record, so rename instead
        real = rec
        rec['name'] = 'Alanson Light Hardsuit'
    elif len(rec['description']) > len(real['description']):
        real['description'] = rec['description']
    d, zulu = _cut_between(real['description'], 'warrior carrying it.', 'neath a trench coat')
    if zulu:
        real['description'] = d.replace('under- neath', 'underneath').replace('under-neath', 'underneath')
        real['review_note'] = 'interleaved Zulu Warshield text moved back to that entry'
        z = by_name.get('Zulu Warshield')
        if z is not None:
            zd = _loose(ARMOR_INTRO).sub('', z['description'])
            zd = re.sub(r'\s+Armor$', '', RE_WS.sub(' ', zd).strip())
            if zd.endswith('experiences of the'):
                zd = zd + ' ' + zulu
            z['description'] = _strip_trailing_headings(zd)
            z['review_note'] = 'description reassembled from text interleaved into the Alanson Light Hardsuit entry'
    if real is not rec:
        rec['_drop'] = True
        rec['_drop_reason'] = "heading row; duplicate of 'Alanson Light Hardsuit'"


def fix_car(rec, by_name):
    """'Car' heading row duplicates 'DDGR Card, The' (M20 p.661)."""
    target = by_name.get('DDGR Card, The')
    body = rec['description']
    if target is not None and len(body) > len(target['description']):
        target['description'] = body
        target['review_note'] = "description taken from duplicate heading row 'Car' (longer text)"
    rec['_drop'] = True
    rec['_drop_reason'] = "heading row; duplicate of 'DDGR Card, The'"


def fix_weapons(rec, by_name):
    """'Weapons' heading row duplicates 'Abh-t Dagger' (Book of Crafts p.49) with the
    Weapons chapter intro interleaved."""
    body = _loose(WEAPONS_INTRO).sub('', rec['description'])
    body = RE_WS.sub(' ', body).strip()
    target = by_name.get('Abh-t Dagger')
    if target is not None:
        own = RE_WS.sub(' ', _loose(WEAPONS_INTRO).sub('', target['description'])).strip()
        target['description'] = body if len(body) > len(own) else own
        target['review_note'] = 'interleaved Weapons chapter intro removed; duplicate heading row Weapons dropped'
    rec['_drop'] = True
    rec['_drop_reason'] = "heading row; duplicate of 'Abh-t Dagger'"


def fix_universal_suit(rec, by_name):
    """Universal Suit swallowed the appendix (pp.173-175) and the book index."""
    d = rec['description']
    i = d.find('Appendix: Optional Rules')
    if i > 0:
        rec['description'] = d[:i].strip()
        rec['needs_review'] = True
        rec['review_note'] = ('appendix and book index (Mystic Armory pp.173-175) removed from description; '
                              'any Universal Suit text after the first paragraph was lost in extraction')


def fix_detox_implant(rec, by_name):
    """Detox Implant ran into the next entry, 'Digital Enhancement Implants', which
    has no record of its own.  Split it out as a new record."""
    d = rec['description']
    marker = 'Digital Enhancement Implants'
    i = d.find(marker)
    if i < 0:
        return
    rest = d[i + len(marker):].strip()
    while True:
        m = RE_LEAD_CITE.match(rest)
        if not m:
            break
        rest = rest[m.end():]
    rec['description'] = d[:i].strip()
    new = {
        'name': 'Digital Enhancement Implants (DEI / ADEI)',
        'book_page': rec['book_page'],
        'source_book': 'Technocracy: Iteration X',
        'source_page': 51,
        'background_cost': None, 'arete': None, 'quintessence': None, 'gnosis': None,
        'description': rest,
        'needs_review': True,
        'split_from': 'Detox Implant',
        'review_note': ('split out of the Detox Implant entry; costs not captured by extraction. '
                        'Sources: Technocracy: Iteration X p.51 (DEI), Guide to the Technocracy p.216, '
                        'Convention Book: Iteration X p.74 (ADEI)'),
    }
    rec['_new_records'] = [new]


def flag_long(note):
    def _f(rec, by_name):
        rec['long_entry'] = True
        rec['review_note'] = note
    return _f


RECORD_FIXES = {
    'Armor': fix_armor,
    'Car': fix_car,
    'Weapons': fix_weapons,
    'Universal Suit': fix_universal_suit,
    'Detox Implant': fix_detox_implant,
    'Spectre Limousine': flag_long('single entry: the base car plus its bulleted upgrade list (each with its own Arete/Quintessence/cost)'),
    'Tradition Blades': flag_long('single entry describing all nine Tradition blades'),
}


# ── helpers ──────────────────────────────────────────────────────────────────────

def load_dictionary():
    words = set()
    for p in DICT_PATHS:
        if os.path.exists(p):
            with open(p, encoding='utf-8', errors='ignore') as fh:
                for line in fh:
                    w = line.strip()
                    if w and "'" not in w:
                        words.add(w.lower())
            break
    return words


def name_variants(name):
    """All lowercase strings a bleed tail could use for this name."""
    out = set()
    base = name.strip()
    forms = {base}
    if base.endswith(', The'):
        stem = base[:-5]
        forms |= {stem, 'The ' + stem}
    # drop a trailing parenthetical, e.g. "Dimension Phase Disruption Emitter (DPDE)"
    forms |= {re.sub(r'\s*\([^)]*\)\s*$', '', f) for f in list(forms)}
    for f in forms:
        f = RE_WS.sub(' ', f).strip()
        if len(f) >= 4:
            out.add(f.lower())
            out.add(f.lower().replace('’', "'"))
            out.add(f.lower().replace("'", '’'))
    return out


def _strip_trailing_headings(text):
    changed = True
    while changed:
        changed = False
        for h in sorted(TRAILING_HEADINGS, key=len, reverse=True):
            if text.endswith(' ' + h):
                before = text[:-len(h)].rstrip()
                if before and RE_TERMINAL.search(before):
                    text = before
                    changed = True
                    break
    return text


def strip_headers(text):
    n = 0
    text, k = RE_EVEN_HDR.subn(' ', text); n += k
    text, k = RE_ODD_HDR.subn(' ', text); n += k
    return RE_WS.sub(' ', text).strip(), n


def strip_leading_citation(rec):
    d = rec['description']
    m = RE_LEAD_CITE.match(d)
    if m:
        return d[m.end():], 1
    return d, 0


CONNECTORS = {'of', 'the', 'and', 'de', 'ibn', 'a', 'for', 'with', 'in', 'to', 'von',
              'la', 'le', 'du', 'y', 'al', 'el', 'des', 'der', 'van', 'o', 'or', 'on'}
RE_LAST_SENTENCE_END = re.compile(r'[.!?)"”’\]…](?=\s)')


def strip_trailing_title_phrase(text):
    """After the last sentence end, a short run of Capitalised words (a wonder name
    the file has no record for) is bleed from the following entry.  Returns the
    stripped text and the phrase removed (or None)."""
    ends = list(RE_LAST_SENTENCE_END.finditer(text))
    if not ends:
        return text, None
    tail = text[ends[-1].end():].strip()
    if not tail or RE_TERMINAL.search(tail):
        return text, None
    toks = tail.split(' ')
    if not 1 <= len(toks) <= 8:
        return text, None
    caps = 0
    for t in toks:
        core = t.strip('"“”\'’(),')
        if not core:
            return text, None
        if core[0].isupper() or core[0].isdigit():
            caps += 1
        elif core.lower() not in CONNECTORS:
            return text, None
    if caps == 0 or not toks[0].strip('"“(')[:1].isupper():
        return text, None
    return text[:ends[-1].end()].rstrip(), tail


def strip_trailing_bleed(text, variants_by_len, own_variants):
    """Remove trailing wonder names (bleed from the following entry in the book)."""
    removed = []
    while True:
        low = text.lower().rstrip()
        hit = None
        for v in variants_by_len:
            if v in own_variants:
                continue
            if low.endswith(v) and (len(low) == len(v) or low[-len(v) - 1] == ' '):
                hit = v
                break
        if not hit:
            break
        text = text[:len(low) - len(hit)].rstrip()
        removed.append(hit)
        if not text:
            break
    text = _strip_trailing_headings(text)
    text, phrase = strip_trailing_title_phrase(text)
    if phrase:
        removed.append('?' + phrase)
    return text, removed


# Game vocabulary the system dictionary lacks; joined when seen as "xx- yy"
JOIN_WHITELIST = {'disrupter', 'disrupters', 'luciferian', 'translocator',
                  'transmogrification', 'transmogrify', 'quintessential', 'technomage',
                  'technomages', 'technomancer', 'technomancers'}

HYPHEN_PREFIXES = {'non', 'pre', 'post', 'self', 'well', 'anti', 'semi', 're', 'co', 'ex',
                   'multi', 'half', 'high', 'low', 'long', 'short', 'full', 'one', 'two',
                   'three', 'all', 'un', 'sub', 'super', 'inter', 'cross', 'counter',
                   'pseudo', 'quasi', 'proto', 'neo', 'ultra', 'mid'}


def join_hyphens(text, dictionary, corpus_words, stats):
    def repl(m):
        a, b = m.group(1), m.group(2)
        joined = a + b
        jl = joined.lower()
        if jl in dictionary or corpus_words.get(jl, 0) > 0 or jl in JOIN_WHITELIST:
            stats['joined'] += 1
            return joined
        # second half lowercase and first half not a word on its own: a broken word,
        # not a compound ("conceala- ble", "superhe- roes")
        if b[0].islower() and a.lower() not in dictionary and a.lower() not in HYPHEN_PREFIXES:
            stats['joined'] += 1
            return joined
        # a real compound ("well-known", "pre-Columbian", "R-25"): keep the hyphen
        stats['hyphenated'] += 1
        stats['hyphenated_examples'].append(a + '-' + b)
        return a + '-' + b
    return RE_HYPHEN.sub(repl, text)


RE_BREAK_CAP = re.compile(r'(?<![\w-])([a-z]{2,})- (?=[A-Z•])')
RE_FRAG = re.compile(r'(?<![\w-])([a-z]{2,})(?![\w-])')


def heal_interleaved(rec, dictionary, corpus_words, log):
    """Column flow sometimes drops a section-intro paragraph into the middle of a
    word: "...three dimensional ab- Other Wonders which ... Sound stracts sculptures".
    Find a later lowercase fragment that is not a word itself but completes the
    broken word, cut the inserted text out and keep it in review_note."""
    text = rec['description']
    pos = 0
    while True:
        m = RE_BREAK_CAP.search(text, pos)
        if not m:
            break
        a = m.group(1)
        found = None
        for f in RE_FRAG.finditer(text, m.end(), min(len(text), m.end() + 2500)):
            frag = f.group(1)
            if frag in dictionary or frag in HYPHEN_PREFIXES:
                continue
            jl = (a + frag).lower()
            if jl in dictionary or corpus_words.get(jl, 0) > 0:
                found = f
                break
        if found and (found.start() - m.end()) >= 20:
            inserted = text[m.end():found.start()].strip()
            text = text[:m.start()] + a + found.group(1) + text[found.end():]
            log.append(f"{rec['name']!r}: {a}-{found.group(1)} <- removed {len(inserted)} chars: {inserted[:90]}...")
            note = f'interleaved section text removed from mid-word break ({a}…{found.group(1)}): "{inserted[:160]}"'
            rec['review_note'] = (rec.get('review_note', '') + '; ' if rec.get('review_note') else '') + note
            pos = m.start() + len(a + found.group(1))
        else:
            pos = m.end()
    rec['description'] = text


def infer_type(rec):
    d = rec.get('description') or ''
    scores = {t: len(re.findall(p, d)) for t, p in TYPE_KEYWORDS.items()}
    best = max(scores.values()) if scores else 0
    if best == 0:
        return 'Fetish' if rec.get('gnosis') not in (None, '', 0) else 'Unknown'
    winners = [t for t, s in scores.items() if s == best]
    return winners[0] if len(winners) == 1 else 'Unknown'


def norm_stat(v):
    if v is None:
        return None
    s = RE_WS.sub(' ', str(v)).strip()
    if s == '':
        return None
    if re.fullmatch(r'\d+', s):
        return int(s)
    m = re.fullmatch(r'(\d+)\s*[-–—]\s*(\d+)', s)
    if m:
        lo, hi = int(m.group(1)), int(m.group(2))
        return {'min': min(lo, hi), 'max': max(lo, hi)}
    return {'text': s}


def shape(v):
    if v is None:
        return 'null'
    if isinstance(v, int):
        return 'int'
    if isinstance(v, dict):
        return 'range' if 'min' in v else 'text'
    return 'string'


# ── metrics ──────────────────────────────────────────────────────────────────────

def metrics(records, variants_by_len, own_variants_of):
    m = collections.OrderedDict()
    descs = [r.get('description') or '' for r in records]
    m['records'] = len(records)
    m['running-header fragments'] = sum(len(RE_EVEN_HDR.findall(d)) + len(RE_ODD_HDR.findall(d)) for d in descs)
    m['descriptions containing a header'] = sum(1 for d in descs if RE_EVEN_HDR.search(d) or RE_ODD_HDR.search(d))
    m['hyphen breaks "xx- yy"'] = sum(len(RE_HYPHEN.findall(d)) for d in descs)
    bleed = 0
    for r, d in zip(records, descs):
        low = d.lower().rstrip()
        own = own_variants_of.get(r['name'], set())
        if any(low.endswith(v) and v not in own and (len(low) == len(v) or low[-len(v) - 1] == ' ')
               for v in variants_by_len):
            bleed += 1
    m['descriptions ending in another wonder name'] = bleed
    m['descriptions ending in terminal punctuation'] = sum(1 for d in descs if RE_TERMINAL.search(d.strip()))
    m['empty descriptions'] = sum(1 for d in descs if not d.strip())
    m['descriptions > 3000 chars'] = sum(1 for d in descs if len(d) > 3000)
    m['longest description'] = max(len(d) for d in descs)
    m['heading rows (Armor/Car/Weapons)'] = sum(1 for r in records if r['name'] in ('Armor', 'Car', 'Weapons'))
    m['index dotted leaders'] = sum(1 for d in descs if '.....' in d)
    m['source_book spellings'] = len({r.get('source_book') for r in records})
    m["source_book with straight apostrophe"] = sum(1 for r in records if "'" in (r.get('source_book') or ''))
    for f in ('background_cost', 'arete', 'quintessence', 'gnosis'):
        m[f'{f} shapes'] = dict(collections.Counter(shape(r.get(f)) for r in records))
    if any('type' in r for r in records):
        m['type'] = dict(collections.Counter(r.get('type', '-') for r in records).most_common())
    m['flagged truncated'] = sum(1 for r in records if r.get('truncated'))
    m['flagged needs_review'] = sum(1 for r in records if r.get('needs_review'))
    m['flagged long_entry'] = sum(1 for r in records if r.get('long_entry'))
    return m


def fmt_report(before, after, extra):
    lines = ['wonders.json cleanup report', '=' * 60, f'{"metric":<48}{"before":>10}{"after":>10}']
    for k in list(dict.fromkeys(list(before.keys()) + list(after.keys()))):
        b, a = before.get(k), after.get(k)
        if isinstance(b, dict) or isinstance(a, dict):
            lines.append(f'{k}:')
            keys = list(dict.fromkeys(list((b or {}).keys()) + list((a or {}).keys())))
            for kk in keys:
                lines.append(f'    {kk:<44}{str((b or {}).get(kk, "-")):>10}{str((a or {}).get(kk, "-")):>10}')
        else:
            lines.append(f'{k:<48}{str(b):>10}{str(a):>10}')
    lines.append('')
    for k, v in extra.items():
        if isinstance(v, list):
            lines.append(f'{k} ({len(v)}):')
            for x in v:
                lines.append(f'    {x}')
        else:
            lines.append(f'{k}: {v}')
    return '\n'.join(lines)


# ── main ─────────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dry-run', action='store_true', help='do not write any file')
    ap.add_argument('--out', default=SRC, help='output path (default: overwrite wonders.json)')
    ap.add_argument('--dump', action='append', default=[], metavar='NAME',
                    help='print the cleaned record(s) with this name (repeatable)')
    ap.add_argument('--grep', default=None, help='print name + context of descriptions matching this regex')
    ap.add_argument('--report', default=os.path.join(ROOT, 'tools', 'reports', 'wonders-cleanup-report.txt'))
    args = ap.parse_args()

    src = ORIG if os.path.exists(ORIG) else SRC
    with open(src, encoding='utf-8') as fh:
        raw = json.load(fh)
    print(f'input: {src} ({len(raw)} records)')

    dictionary = load_dictionary()
    if not dictionary:
        print('warning: no system dictionary found; hyphen joins rely on corpus only', file=sys.stderr)

    records = [dict(r) for r in raw]
    own_variants_of = {r['name']: name_variants(r['name']) for r in records}
    all_variants = set().union(*own_variants_of.values())
    variants_by_len = sorted(all_variants, key=len, reverse=True)

    before = metrics(records, variants_by_len, own_variants_of)
    extra = collections.OrderedDict()

    # pass 1: whitespace + headers + leading citation
    hdr_removed = cite_removed = 0
    for r in records:
        d = RE_WS.sub(' ', r.get('description') or '').strip()
        r['description'] = d
        d, n = strip_headers(d); hdr_removed += n
        r['description'] = d
        d, n = strip_leading_citation(r); cite_removed += n
        r['description'] = d
    extra['running headers removed'] = hdr_removed
    extra['leading citations removed'] = cite_removed

    # pass 2: trailing bleed
    bleed_log = []
    missing = []
    for r in records:
        d, removed = strip_trailing_bleed(r['description'], variants_by_len, own_variants_of[r['name']])
        if removed:
            bleed_log.append(f"{r['name']!r} -> stripped {removed}")
            missing += [x[1:] for x in removed if x.startswith('?')]
        r['description'] = d
    extra['trailing bleed stripped (records)'] = len(bleed_log)
    extra['wonder names bled from entries missing in this file (candidates)'] = sorted(set(missing))

    # pass 3: per-record surgery
    by_name = {r['name']: r for r in records}
    new_records = []
    dropped = []
    for name, fn in RECORD_FIXES.items():
        rec = by_name.get(name)
        if rec is None:
            continue
        fn(rec, by_name)
        new_records.extend(rec.pop('_new_records', []))
        if rec.pop('_drop', False):
            dropped.append(f"{name!r}: {rec.pop('_drop_reason', '')}")
    records = [r for r in records if r['name'] not in {d.split(':')[0].strip("'") for d in dropped}]
    records.extend(new_records)
    records.sort(key=lambda r: r['name'].lower().lstrip("'‘’"))
    extra['records dropped'] = dropped
    extra['records added'] = [r['name'] for r in new_records]

    # pass 4: hyphen joins (corpus words computed after header removal)
    corpus_words = collections.Counter()
    for r in records:
        for w in re.findall(r'[A-Za-z]+', r['description'] + ' ' + r['name']):
            corpus_words[w.lower()] += 1
    heal_log = []
    for r in records:
        heal_interleaved(r, dictionary, corpus_words, heal_log)
    extra['interleaved section text healed'] = heal_log
    hstats = {'joined': 0, 'hyphenated': 0, 'hyphenated_examples': []}
    for r in records:
        r['description'] = join_hyphens(r['description'], dictionary, corpus_words, hstats)
    extra['hyphen breaks joined to one word'] = hstats['joined']
    extra['hyphen breaks kept as compound "xx-yy"'] = hstats['hyphenated']
    extra['compounds kept (review)'] = sorted(set(hstats['hyphenated_examples']))

    # pass 5: source_book apostrophes
    for r in records:
        if r.get('source_book'):
            r['source_book'] = r['source_book'].replace("'", '’')

    # pass 6: flags, type, stats
    for r in records:
        r['description'] = RE_WS.sub(' ', r['description']).strip()
        if not r['description']:
            r['needs_review'] = True
            r['review_note'] = (r.get('review_note', '') + '; ' if r.get('review_note') else '') + \
                'description lost in extraction (was empty or only a running header / next-entry name)'
        for f in ('background_cost', 'arete', 'quintessence', 'gnosis'):
            r[f] = norm_stat(r.get(f))
        r['type'] = infer_type(r)
        if r['description'] and not RE_TERMINAL.search(r['description']):
            r['truncated'] = True
        m = RE_LEAD_HEADING.match(r['description'])
        if m:
            r['needs_review'] = True
            note = f'begins with the "{m.group(1)}" section introduction (column flow); the entry text follows it'
            r['review_note'] = (r.get('review_note', '') + '; ' if r.get('review_note') else '') + note

    after = metrics(records, variants_by_len, own_variants_of)
    report = fmt_report(before, after, extra)
    print(report)
    for r in records:
        if r['name'] in args.dump:
            print('\n--- ' + r['name']); print(json.dumps(r, ensure_ascii=False, indent=1))
    if args.grep:
        rg = re.compile(args.grep)
        for r in records:
            for m in rg.finditer(r['description']):
                print(f"{r['name']!r}: ...{r['description'][max(0, m.start()-60):m.end()+60]}...")

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


if __name__ == '__main__':
    main()
