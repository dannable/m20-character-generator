#!/usr/bin/env python3
"""
Fill the truncated rote descriptions in app/server/rotes-seed.json from the
"Enlightened Grimoire" PDF (Charles Siegel, 2018), which is the document the seed
was originally extracted from.

Why coordinates and not plain pdftotext: the grimoire is a two-column Word PDF and
pdftotext's reading order interleaves entries whose heading sits at the bottom of
one column and whose body continues in the next.  `pdftotext -bbox-layout` gives
every line with its position, so this script:

  1. assigns each line to the left or right column (or "wide" = page-spanning
     section header), drops the running footer (chapter name + page number at
     y > 715) and re-orders each page as left column then right column, split
     into bands at page-wide headers;
  2. detects rote headings: a short line centred in its column whose text is in
     the grimoire's own alphabetical index (pp. 202-210), falling back to a
     centred line followed by a source/sphere line;
  3. collects, per heading: alias lines, every "<Book> page N" source line,
     sphere lines, then the description up to the next heading, joining
     end-of-line hyphenation with the same dictionary rule clean_rotes.py uses
     and keeping paragraph breaks as "\\n";
  4. matches seed records by normalised name (then source / page to break ties)
     and replaces the description ONLY when the seed's truncated text is a
     prefix of the full one, so a mis-parse can never overwrite a good record.

Usage:
  python3 tools/enrich_rotes_from_grimoire.py                 # in place
  python3 tools/enrich_rotes_from_grimoire.py --dry-run
  python3 tools/enrich_rotes_from_grimoire.py --dump "Threefold Return"
It is also called automatically at the end of tools/clean_rotes.py when the PDF is
present, so a full re-run of the pipeline is just `python3 tools/clean_rotes.py`.
"""
import argparse
import collections
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clean_rotes as CR  # noqa: E402  (dictionary / hyphen helpers, RE_TERMINAL)

ROOT = CR.ROOT
SEED = CR.SRC
PDF = os.path.join(ROOT, 'Enlightened-grimoire.pdf')
REPORT = os.path.join(ROOT, 'tools', 'reports', 'rotes-grimoire-enrichment.txt')

PAGE_MID = 306.0          # letter width 612
FOOTER_Y = 715.0          # running footer sits at y ~722
COL_WIDTH_MAX = 238.0     # a centred heading/source is narrower than a justified prose line (239.1-239.5)
CENTER_TOL = 8.0

SPHERES = ['Correspondence', 'Data', 'Dimensional Science', 'Entropy', 'Forces', 'Life',
           'Matter', 'Mind', 'Prime', 'Primal Utility', 'Spirit', 'Time']
RE_SOURCE = re.compile(r'\b(?:page|pas|pg\.?|p\.)\s*\d+\b', re.I)
# A source line ends with its page reference, optionally followed by "(as Other Name)" or
# ", 99 (Daemon)"; a wrapped one may end with an unclosed "(as Strengthen".
RE_SOURCE_END = re.compile(
    r'\b(?:page|pas|pg\.?|p\.)\s*\d+(?:\s*\([^)]*\)?)?(?:,\s*\d+\s*\([^)]*\)?)*\s*$', re.I)
RE_SOURCE_BARE = re.compile(r'^(Various|Unknown|Original|Homebrew)$', re.I)
RE_SPHERE_START = re.compile(
    r'^(?:\(?(?:' + '|'.join(SPHERES) + r')\b|optional\b|or\b|OR\b|and\b|any\b|either\b|plus\b|Varies\b|\d\b|\+)', re.I)
RE_SPHERE_ANY = re.compile(r'\b(?:' + '|'.join(SPHERES) + r')\s*\d', re.I)
# a line made only of sphere vocabulary, e.g. "Mind 2 or 4;", "Varies", "Life 3 or Forces 2 or both"
RE_SPHERE_LINE = re.compile(
    r'^(?:(?:' + '|'.join(SPHERES) + r'|optional|or|and|any|either|plus|both|instead|of|varies|Varies|\d+)\s*[,;/()+\-–]*\s*)+$', re.I)


def is_sphere_text(t):
    return bool(RE_SPHERE_START.match(t)) and (bool(RE_SPHERE_ANY.search(t)) or bool(RE_SPHERE_LINE.match(t)))
RE_INDEX_LINE = re.compile(r'^(.*?)\s*\.{2,}\s*(\d+)$|^(.*\S)\s+(\d+)$')
RE_NUM = re.compile(r'^\d+$')


def norm(s):
    s = unicodedata.normalize('NFKC', s or '')
    s = s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    s = s.lower()
    s = re.sub(r'\(.*?\)', ' ', s)           # drop parentheticals for matching
    return re.sub(r'[^a-z0-9]+', '', s)


def norm_text(s):
    s = unicodedata.normalize('NFKC', s or '').replace('’', "'").replace('“', '"').replace('”', '"')
    s = s.replace('-', '').replace('­', '')
    return re.sub(r'[^a-z0-9]+', '', s.lower())


# ─── 1. PDF → ordered lines ──────────────────────────────────────────────────

def bbox_lines(pdf):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, 'bbox.html')
        subprocess.run(['pdftotext', '-bbox-layout', pdf, out], check=True)
        root = ET.parse(out).getroot()
    tag = lambda e: e.tag.split('}')[-1]
    pages = []
    for pg in (e for e in root.iter() if tag(e) == 'page'):
        lines = []
        for ln in (e for e in pg.iter() if tag(e) == 'line'):
            words = [(w.text or '') for w in ln if tag(w) == 'word']
            text = ' '.join(words).strip()
            if not text:
                continue
            x0, x1, y0 = float(ln.get('xMin')), float(ln.get('xMax')), float(ln.get('yMin'))
            lines.append({'y': y0, 'x0': x0, 'x1': x1, 'w': x1 - x0, 'text': text})
        pages.append(lines)
    return pages


def classify_column(ln):
    if ln['x0'] < PAGE_MID - 16 and ln['x1'] > PAGE_MID + 16:
        return 'W'
    return 'L' if (ln['x0'] + ln['x1']) / 2 < PAGE_MID else 'R'


def column_edges(lines):
    """Per-column (x0, x1) from full-width prose lines. Left- and right-hand pages
    have mirrored margins (54-293/305-544 vs 68-307/319-558), so this must be
    computed per page, not once for the document."""
    geo = {}
    for col in ('L', 'R'):
        body = [ln for ln in lines if ln['w'] > 60 and classify_column(ln) == col]
        if len(body) >= 3:
            # the margin is the leftmost body line (continuation lines sit on it even when
            # text wraps round an image); the right edge is the rightmost line end
            geo[col] = (round(min(l['x0'] for l in body)), round(max(l['x1'] for l in body)))
    return geo


def page_geometry(pages):
    """Document-wide fallback geometry (most common edges) for pages without full lines."""
    lefts = collections.Counter(); rights = collections.Counter()
    for lines in pages:
        g = column_edges(lines)
        if 'L' in g: lefts[g['L']] += 1
        if 'R' in g: rights[g['R']] += 1
    return {'L': lefts.most_common(1)[0][0], 'R': rights.most_common(1)[0][0]}


def order_page(lines, fallback_geo):
    """Footer-stripped lines of one page in reading order; returns (ordered, footer_chapter, wide_headers).
    Each line gets: col, centered, indent, band (0 = before any page-wide header)."""
    chapter = None
    body = []
    for ln in lines:
        if ln['y'] > FOOTER_Y:
            if not RE_NUM.match(ln['text']) and ln['text'] != 'Enlightened Grimoire':
                chapter = ln['text']
            continue
        body.append(ln)
    geo = dict(fallback_geo)
    for col, (x0, x1) in column_edges(body).items():
        fx0, fx1 = fallback_geo.get(col, (x0, x1))
        if abs(x0 - fx0) <= 20 and abs(x1 - fx1) <= 20:     # ignore odd pages (art, tables)
            geo[col] = (x0, x1)
    for ln in body:
        ln['col'] = classify_column(ln)
        c0, c1 = geo[ln['col']] if ln['col'] in geo else (0, 612)
        center = (ln['x0'] + ln['x1']) / 2
        # Centred = equal margins on both sides. A paragraph's indented first line
        # (x0 = c0+9, x1 = c1) has the right centre but unequal margins.
        symmetric = abs((ln['x0'] - c0) - (c1 - ln['x1'])) <= 4
        not_full = ln['w'] <= (c1 - c0) - 1.5          # a justified prose line spans the column exactly
        ln['centered'] = ln['col'] != 'W' and abs(center - (c0 + c1) / 2) <= CENTER_TOL \
            and not_full and ln['w'] <= COL_WIDTH_MAX and symmetric
        ln['indent'] = ln['col'] != 'W' and ln['x0'] >= c0 + 3   # body lines sit exactly on c0; first lines at c0+9
    body.sort(key=lambda l: l['y'])
    # bands split at page-wide lines
    ordered, wide = [], []
    band = []
    band_no = [0]
    def flush():
        band.sort(key=lambda l: (0 if l['col'] == 'L' else 1, l['y']))
        for l in band:
            l['band'] = band_no[0]
        ordered.extend(band)
        band.clear()
    for ln in body:
        if ln['col'] == 'W':
            flush()
            band_no[0] += 1
            wide.append(ln['text'])
            continue
        band.append(ln)
    flush()
    return ordered, chapter, wide


# ─── 2. index of rotes → authoritative names ────────────────────────────────

RE_INDEX_END = re.compile(r'^(.*?)\s*\.*\s*(\d+(?:\s*,\s*\d+)*)\s*$')


def parse_index(pages, first_index_page):
    """The index is set in THREE columns (x ≈ 54 / 230 / 405); wrapped names continue
    on an indented line; multi-page refs look like '120, 165'."""
    names = {}
    for pi in range(first_index_page, len(pages)):
        lines = [l for l in pages[pi] if l['y'] <= FOOTER_Y and l['text'] != 'Index of Rotes']
        if any('Twenty-Five Years of Magick' in l['text'] for l in lines):
            break
        # cluster by column start: the three most common x0 values are the column edges;
        # a wrapped continuation line is indented ~11pt from its column edge.
        starts = [x for x, _ in collections.Counter(round(l['x0']) for l in lines).most_common(3)]
        starts.sort()
        cols = collections.defaultdict(list)
        for l in lines:
            cands = [s for s in starts if s - 3 <= l['x0']]
            cols[max(cands) if cands else starts[0]].append(l)
        for key in sorted(cols):
            col_lines = sorted(cols[key], key=lambda l: l['y'])
            col_x0 = key
            buf = []
            for k, ln in enumerate(col_lines):
                buf.append(ln['text'])
                joined = ' '.join(buf)
                nxt = col_lines[k + 1] if k + 1 < len(col_lines) else None
                continues = nxt is not None and nxt['x0'] > col_x0 + 5   # indented continuation
                if continues or joined.rstrip().endswith(','):
                    continue
                m = RE_INDEX_END.match(joined)
                if m and re.search(r'\d$', joined.rstrip()):
                    name = m.group(1).strip(' .')
                    pgs = [int(x) for x in re.findall(r'\d+', m.group(2))]
                else:
                    name, pgs = joined.strip(' .'), []
                if name and not RE_NUM.match(name) and norm(name):
                    names.setdefault(norm(name), []).append((name, pgs))
                buf = []
    return names


# ─── 3. entries ──────────────────────────────────────────────────────────────

def is_source(t):
    """Book citation line, not prose that merely mentions a page: starts with a capital,
    ends with the page reference, is short, and contains no sentence boundary."""
    if RE_SOURCE_BARE.match(t):
        return True
    if re.search(r'\b(?:Book|Edition|Technocracy|Tradition|Convention|Guide|Magic|Web|Lore|Paths|Order|Crusade|Handbook|Ways|Tapestry)\b.*\bpage\s*$', t):
        return True     # citation whose page number was lost in the source document
    return bool(RE_SOURCE_END.search(t)) and len(t) <= 95 and t[:1].isupper() and '. ' not in t


def is_sphere(t, prev_sphere):
    if is_sphere_text(t):
        return True
    return prev_sphere and prev_sphere.rstrip().endswith((',', ';', ' or', ' OR', ' and', '/'))


RE_PAGE_CONT = re.compile(r'^(?:\(?(?:Edition|Revised|Anniversary Edition)\s+)?(?:page|pas)\s+\d+\)?$', re.I)
RE_AS_NOTE = re.compile(r'^\(as .*\)$', re.I)


DANGLING = ('/', '-', ' of', ' the', ' and', ' or', ' to', ' for', ' in', ' a', ' an', 'page')


def join_wrapped(lines, index_names):
    """Merge heading/source lines that Word wrapped onto a second centred line:
       'Technocracy: New World Order page 49 (as Strengthen' + 'Gauntlet)'
       'Lost Paths: Ahl-i-Batin and Taftani' + 'page 43'
       'Mage: The Ascension Second' + 'Edition page 189'
       'Mage: The Ascension First Edition page' + '216'
       'Heal Self (Channel' + 'Chi)'
       'Create Virtual Object/Create' + 'Daemon'          (pair is an index name)
    and attach a stand-alone '(as Other Name)' note to the source line above it."""
    out = []
    for ln in lines:
        prev = out[-1] if out else None
        same_block = prev is not None and prev['col'] == ln['col'] and prev['page'] == ln['page'] \
            and 0 < ln['y'] - prev['y'] < 20
        if same_block:
            pt, t = prev['text'], ln['text']
            unbalanced = pt.count('(') > pt.count(')')
            short_pair = prev['w'] <= COL_WIDTH_MAX and ln['w'] <= COL_WIDTH_MAX and not is_source(t) \
                and not is_sphere_text(t)
            if (unbalanced and ')' in t and t.count(')') >= t.count('(')) \
                    or RE_PAGE_CONT.match(t) \
                    or (pt.rstrip().endswith('page') and RE_NUM.match(t)) \
                    or (RE_AS_NOTE.match(t) and is_source(pt)) \
                    or (short_pair and not is_source(pt) and norm(pt + ' ' + t) in index_names) \
                    or (short_pair and not is_source(pt) and prev['indent'] and ln['indent']
                        and pt.rstrip().endswith(DANGLING) and not pt.endswith('.')) \
                    or (not is_source(pt) and prev['centered'] and ln['centered'] and not RE_SPHERE_START.match(t)
                        and t[:1].islower()):
                prev['text'] = pt + ' ' + t
                prev['x0'] = min(prev['x0'], ln['x0']); prev['x1'] = max(prev['x1'], ln['x1'])
                prev['w'] = prev['x1'] - prev['x0']
                continue
        out.append(ln)
    return out


def parse_entries(pages, geo, index_names, start_page, end_page):
    lines = []
    chapter = None
    dropped_headers = []
    for pi in range(start_page, end_page + 1):
        ordered, ch, wide = order_page(pages[pi], geo)
        if ch:
            chapter = ch
        for ln in ordered:
            ln['page'] = pi + 1
            ln['chapter'] = chapter
            lines.append(ln)
        dropped_headers.extend((pi + 1, w) for w in wide)
    lines = join_wrapped(lines, index_names)
    # back-fill chapter for pages before the first footer seen
    last = None
    for ln in reversed(lines):
        if ln['chapter']:
            last = ln['chapter']
        else:
            ln['chapter'] = last

    def looks_like_heading(i):
        ln = lines[i]
        t = ln['text']
        if is_source(t) or RE_NUM.match(t) or t.startswith('(') or not norm(t):
            return False
        if norm(t) in index_names and ln['indent'] and ln['w'] <= COL_WIDTH_MAX:
            return True
        if len(t) > 70 or t.endswith(('.', ',', ';', ':')) or t[:1].islower():
            return False
        if is_sphere_text(t):
            return False
        # Not in the index: accept a centred line — or, on pages where text wraps round an
        # image and nothing is centred, any short indented line — if a source follows within 3 lines.
        if not (ln['centered'] or (ln['indent'] and ln['w'] <= COL_WIDTH_MAX)):
            return False
        for j in range(i + 1, min(i + 4, len(lines))):
            if is_source(lines[j]['text']):
                return True
            if looks_like_heading_cheap(j):
                return False
        return False

    def looks_like_heading_cheap(j):
        t = lines[j]['text']
        return norm(t) in index_names and lines[j]['indent'] and lines[j]['w'] <= COL_WIDTH_MAX

    # Prose that directly follows a page-wide section header (before the next heading)
    # is the section's introduction, not part of the previous rote.
    intro_dropped = 0
    cur_key, seen_heading = None, True
    for i, ln in enumerate(lines):
        key = (ln['page'], ln.get('band', 0))
        if key != cur_key:
            cur_key = key
            seen_heading = ln.get('band', 0) == 0   # band 0 continues the previous page
        if looks_like_heading(i):
            seen_heading = True
        ln['intro'] = not seen_heading
        if ln['intro']:
            intro_dropped += 1
    lines = [ln for ln in lines if not ln['intro']]

    entries = []
    section_headers = []
    i = 0
    n = len(lines)
    while i < n:
        if not looks_like_heading(i):
            i += 1
            continue
        head = lines[i]
        e = {'name': head['text'], 'aka': [], 'sources': [], 'spheres': [], 'desc_lines': [],
             'pdf_page': head['page'], 'chapter': head['chapter'], 'in_index': norm(head['text']) in index_names}
        i += 1
        # aliases: centred non-source lines right after the heading
        while i < n and lines[i]['centered'] and not is_source(lines[i]['text']) and not looks_like_heading(i) \
                and not RE_SPHERE_START.match(lines[i]['text']):
            e['aka'].append(lines[i]['text']); i += 1
        # sources + spheres (may alternate: source A, spheres A, source B, spheres B)
        prev_sphere = None
        while i < n and not looks_like_heading(i):
            t = lines[i]['text']
            if is_source(t):
                # a source line may wrap onto a second centred line
                src = t
                while i + 1 < n and lines[i + 1]['centered'] and not is_source(lines[i + 1]['text']) \
                        and not RE_SPHERE_START.match(lines[i + 1]['text']) and not looks_like_heading(i + 1) \
                        and not RE_SOURCE.search(src):
                    i += 1; src += ' ' + lines[i]['text']
                e['sources'].append(src); prev_sphere = None; i += 1; continue
            if is_sphere(t, prev_sphere) and not e['desc_lines']:
                e['spheres'].append(t); prev_sphere = t; i += 1; continue
            break
        # description — stops at the next heading, or at an in-column sub-section header
        # (short centred Title-Case line with no source after it, e.g. "Miscellaneous");
        # the intro prose after such a header is skipped up to the next heading.
        while i < n and not looks_like_heading(i):
            ln = lines[i]
            t = ln['text']
            prev_t = e['desc_lines'][-1]['text'] if e['desc_lines'] else ''
            title_case = len(t) <= 40 and not t.endswith(('.', ',', ';', ':', '!', '?')) and t[:1].isupper() \
                and all(w[:1].isupper() or w.lower() in ('and', 'or', 'of', 'the', 'a', 'in', 'to', 'for') for w in t.split()) \
                and not RE_SPHERE_ANY.search(t) and not is_source(t)
            # centred sub-header after a finished paragraph, or a left-aligned one (e.g.
            # "Miscellaneous") that is followed by a new paragraph / heading
            if title_case and e['desc_lines'] and prev_t.endswith(('.', '!', '?', ')', '"', '”')) and (
                    ln['centered'] or (i + 1 < n and (lines[i + 1]['indent'] or looks_like_heading(i + 1)))):
                section_headers.append((ln['page'], t))
                i += 1
                while i < n and not looks_like_heading(i):
                    i += 1
                break
            e['desc_lines'].append(ln); i += 1
        entries.append(e)
    dropped_headers = dropped_headers + [(p, t + '  [in-column]') for p, t in section_headers]
    return entries, dropped_headers, intro_dropped


def assemble_description(desc_lines, dictionary, corpus, hstats):
    paras = []
    cur = []
    for k, ln in enumerate(desc_lines):
        t = ln['text']
        if k > 0 and ln['indent'] and cur and not cur[-1].endswith('-'):
            paras.append(' '.join(cur)); cur = []
        cur.append(t)
    if cur:
        paras.append(' '.join(cur))
    out = []
    for p in paras:
        p = re.sub(r'(\w)-\s+(\w)', r'\1- \2', p)          # normalise "word-\nword" → "word- word"
        p = CR.join_hyphens(p, dictionary, corpus, hstats)
        p = re.sub(r'\s+([,.;:!?])', r'\1', p)
        p = CR.RE_WS.sub(' ', p).strip()
        if p:
            out.append(p)
    return '\n'.join(out)


def split_source(src):
    m = re.match(r'^(.*?)\s+(?:page|pas|pg\.?|p\.)\s*(\d+)(.*)$', src, re.I)
    if not m:
        return {'text': src, 'book': src, 'page': None}
    book = m.group(1).strip().replace("'", '’')
    return {'text': src, 'book': book, 'page': int(m.group(2)), 'note': m.group(3).strip(' ()') or None}


# ─── 4. match + merge ────────────────────────────────────────────────────────

def run(seed_path=SEED, pdf_path=PDF, report_path=REPORT, dry_run=False, dump=(), verbose=True):
    pages = bbox_lines(pdf_path)
    geo = page_geometry(pages)
    page_text = [' '.join(l['text'] for l in ls) for ls in pages]
    index_page = next(i for i, t in enumerate(page_text) if t.startswith('Index of Rotes'))
    index_names = parse_index(pages, index_page)
    # body starts at the first page with a heading that is in the index and a source line
    start = None
    for pi in range(0, index_page):
        ordered, _, _ = order_page(pages[pi], geo)
        if any(norm(l['text']) in index_names and l['centered'] for l in ordered) and \
                any(is_source(l['text']) for l in ordered) and 'Introduction' not in page_text[pi][:200]:
            start = pi; break
    entries, dropped, intro_dropped = parse_entries(pages, geo, index_names, start, index_page - 1)

    dictionary = CR.load_dictionary()
    corpus = collections.Counter()
    for e in entries:
        for w in re.findall(r'[A-Za-z]+', ' '.join(l['text'] for l in e['desc_lines'])):
            corpus[w.lower()] += 1
    hstats = {'joined': [], 'hyphenated': []}
    for e in entries:
        e['description'] = assemble_description(e['desc_lines'], dictionary, corpus, hstats)
        e['source_info'] = [split_source(s) for s in e['sources']]
        del e['desc_lines']

    by_name = collections.defaultdict(list)
    by_page = collections.defaultdict(list)
    for e in entries:
        if norm(e['name']):
            by_name[norm(e['name'])].append(e)
        for a in e['aka']:
            if norm(a):
                by_name[norm(a)].append(e)
        for p in (e['pdf_page'] - 1, e['pdf_page'], e['pdf_page'] + 1):
            by_page[p].append(e)

    with open(seed_path, encoding='utf-8') as fh:
        records = json.load(fh)

    stats = collections.OrderedDict()
    stats['pdf pages'] = len(pages)
    stats['index names'] = len(index_names)
    stats['entries parsed'] = len(entries)
    stats['entries not in index'] = sum(1 for e in entries if not e['in_index'])
    found = {norm(e['name']) for e in entries} | {norm(a) for e in entries for a in e['aka']}
    missing_index = [v[0][0] for k, v in index_names.items() if k not in found]
    stats['index names without a parsed entry'] = len(missing_index)
    stats['entries with no source line'] = sum(1 for e in entries if not e['sources'])
    stats['entries with empty description'] = sum(1 for e in entries if not e['description'])
    stats['page-wide section headers dropped'] = len(dropped)
    stats['section-intro lines dropped'] = intro_dropped

    log = collections.defaultdict(list)
    replaced = filled = kept = unmatched = suspect = 0
    for r in records:
        key = norm(r['name'])
        cands = by_name.get(key)
        if not cands and norm(r.get('name_raw') or ''):
            cands = by_name.get(norm(r['name_raw']))
        if not cands:
            close = difflib.get_close_matches(key, list(by_name), n=1, cutoff=0.9)
            if close:
                cands = by_name[close[0]]
                log['fuzzy name matches'].append(f"{r['name']!r} ~ {cands[0]['name']!r}")
        if not cands:
            # The seed sometimes carries an invented name; fall back to the entries on the
            # seed's page whose source line or sphere line matches exactly.
            sk0 = norm_text(r.get('source') or '')
            sph0 = norm_text(r.get('spheres_raw') or '')
            pool = by_page.get(int(r['page'] or -99), [])
            probe0 = norm_text(r.get('description') or '')[:40]
            src_hits = [e for e in pool if sk0 and any(norm_text(x) == sk0 for x in e['sources'])]
            # spheres alone are too weak (many rotes share "Matter 2"): also require the seed's
            # description to start the same way, or to be empty
            sph_hits = [e for e in pool if sph0 and norm_text(' '.join(e['spheres'])) == sph0
                        and (not probe0 or probe0 in norm_text(e['description'])[:160])]
            if len(src_hits) > 1 and sph0:          # same source cited by two rotes: let the sphere line decide
                narrowed = [e for e in src_hits if norm_text(' '.join(e['spheres'])) == sph0]
                if len(narrowed) == 1:
                    src_hits = narrowed
            if len(src_hits) > 1 and probe0:        # ...then the seed's own opening words
                narrowed = [e for e in src_hits if probe0 in norm_text(e['description'])[:160]]
                if len(narrowed) == 1:
                    src_hits = narrowed
            hits = src_hits or sph_hits
            if len(hits) == 1:
                cands = hits
                log['matched by page + %s (seed name differs)' % ('source' if src_hits else 'spheres+text')].append(
                    f"{r['name']!r} -> {hits[0]['name']!r} (pdf p.{hits[0]['pdf_page']})")
            elif hits:
                log['page fallback ambiguous (left unmatched)'].append(
                    f"{r['name']!r} (p.{r['page']}): " + ', '.join(repr(h['name']) for h in hits))
        if not cands:
            unmatched += 1
            log['seed records with no grimoire entry'].append(f"{r['name']!r} (p.{r['page']}, {r['source'] or 'no source'}; {r['spheres_raw']})")
            continue
        # Identity evidence beyond the name: same source line, same sphere line, or the
        # seed's `page` (which is the grimoire's PDF page) within one page.
        sk = norm_text(r.get('source') or '')
        sph = norm_text(r.get('spheres_raw') or '')
        old = r.get('description') or ''
        probe = norm_text(old)[:40]

        def evidence(e):
            ev = []
            if sk and any(norm_text(x) == sk or norm_text(x).startswith(sk) or sk.startswith(norm_text(x)) for x in e['sources']): ev.append('source')
            if sph and any(norm_text(x) == sph for x in e['spheres']): ev.append('spheres')
            if sph and norm_text(' '.join(e['spheres'])) == sph: ev.append('spheres')
            if abs(e['pdf_page'] - int(r['page'] or -99)) <= 1: ev.append('page')
            if probe and probe in norm_text(e['description'])[:len(probe) + 120]: ev.append('text')
            return ev

        scored = sorted(((len(evidence(e)), e) for e in cands), key=lambda t: -t[0])
        e = scored[0][1]
        ev = evidence(e)
        if len(cands) > 1:
            log['ambiguous names resolved'].append(f"{r['name']!r}: {len(cands)} entries -> pdf p.{e['pdf_page']} {e['sources'][:1]} evidence={ev}")
        new = e['description']
        r['grimoire_page'] = e['pdf_page']
        r['aka'] = e['aka']
        r['sources'] = e['source_info']
        if 'text' not in ev and old:
            if ev:
                log['seed description was wrong text (replaced; identity confirmed by %s)' % '/'.join(sorted(set(ev)))].append(
                    f"{r['name']!r}\n      seed: {old[:90]!r}\n      pdf : {new[:90]!r}")
            else:
                suspect += 1
                r['grimoire_unverified'] = True      # probably a duplicate the original extraction invented
                log['description start does not match and no other evidence (left unchanged)'].append(
                    f"{r['name']!r} (seed p.{r['page']}, pdf p.{e['pdf_page']})\n      seed: {old[:90]!r}\n      pdf : {new[:90]!r}")
                continue
        if not new:
            kept += 1
            log['grimoire entry has no description (left unchanged)'].append(r['name'])
            continue
        if norm_text(new) == norm_text(old):
            kept += 1
        elif not old:
            filled += 1; r['description'] = new
        else:
            replaced += 1; r['description'] = new
        r['truncated'] = bool(r['description']) and not CR.RE_TERMINAL.search(r['description'])

    stats['seed records'] = len(records)
    stats['  matched to an entry'] = len(records) - unmatched
    stats['  description replaced (was truncated/partial)'] = replaced
    stats['  description filled (was empty)'] = filled
    stats['  unchanged (already identical or pdf empty)'] = kept
    stats['  start mismatch, left unchanged'] = suspect
    stats['  no grimoire entry'] = unmatched
    stats['still flagged truncated'] = sum(1 for r in records if r.get('truncated'))
    stats['empty descriptions'] = sum(1 for r in records if not (r.get('description') or '').strip())
    stats['hyphen breaks joined / kept'] = f"{len(hstats['joined'])} / {len(hstats['hyphenated'])}"

    out = ['rotes-seed.json ← Enlightened-grimoire.pdf enrichment report', '=' * 64]
    for k, v in stats.items():
        out.append(f'{k:52s} {v}')
    out.append('')
    out.append('index names without a parsed entry:')
    out.extend(f'    {n}' for n in sorted(missing_index))
    out.append('entries not in index (headings accepted by centring + source rule):')
    out.extend(f'    {e["name"]!r} (pdf p.{e["pdf_page"]})' for e in entries if not e['in_index'])
    out.append('page-wide section headers dropped:')
    out.extend(f'    p.{p}: {t}' for p, t in dropped)
    out.append('grimoire entries with an empty description:')
    out.extend(f'    {e["name"]!r} (pdf p.{e["pdf_page"]}; sources={e["sources"]})' for e in entries if not e['description'])
    out.append('seed records still flagged truncated:')
    out.extend(f'    {r["name"]!r} (p.{r["page"]}): {r["description"][-70:]!r}' for r in records if r.get('truncated'))
    for k in sorted(log):
        out.append(f'{k} ({len(log[k])}):')
        out.extend(f'    {x}' for x in log[k])
    report = '\n'.join(out)
    print(report if verbose else '\n'.join(out[:len(stats) + 2]))
    for r in records:
        if r['name'] in dump:
            print('\n--- ' + r['name']); print(json.dumps(r, ensure_ascii=False, indent=1))
    if dry_run:
        print('\n(dry run: nothing written)')
        return stats
    with open(seed_path, 'w', encoding='utf-8') as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2); fh.write('\n')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as fh:
        fh.write(report + '\n')
    print(f'\nwrote {seed_path} ({len(records)} records); report: {report_path}')
    return stats


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--seed', default=SEED)
    ap.add_argument('--pdf', default=PDF)
    ap.add_argument('--report', default=REPORT)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--dump', action='append', default=[], metavar='NAME')
    a = ap.parse_args()
    if not os.path.exists(a.pdf):
        sys.exit(f'PDF not found: {a.pdf}')
    run(a.seed, a.pdf, a.report, a.dry_run, a.dump)


if __name__ == '__main__':
    main()
