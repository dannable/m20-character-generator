#!/usr/bin/env python3
"""Scrape M20 Book of the Fallen.pdf into the transcription chunks under tools/fallen-src/.

The PDF is not in git (see .gitignore), so this script is a one-way ingest: run it
once against the book, review the JSON it writes, then build the catalogue with
tools/build_fallen_catalogue.py. Same division of labour as
tools/build_sorcerer_catalogue.py + tools/sorcerer-src/.

Usage:
    python3 tools/extract_fallen.py ["M20 Book of the Fallen.pdf"]

Page numbers in the output are the book's PRINTED page numbers. The cover is PDF
page 1, so PDF page i+1 is printed page i.

The book is set in two columns. Plain `pdftotext` reading order interleaves them
on any page where a column starts below an image or a pull-quote, which silently
splices one entry's prose into another's. So text is rebuilt from
`pdftotext -bbox-layout` word coordinates instead: blocks are grouped into
full-width bands and then read left column before right. See `pages()`.
"""
import html, json, os, re, statistics, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'fallen-src')
PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'M20 Book of the Fallen.pdf')

# ── text plumbing ────────────────────────────────────────────────────────────

RUNNING = re.compile(
    r'^\s*(?:\d{1,3}\s*)?(?:The Book of the Fallen|Chapter (?:One|Two|Three|Four|Five|Six|Seven):[^\n]*|'
    r'Table of Contents)\s*(?:\d{1,3}\s*)?$', re.I)
PAGENUM = re.compile(r'^\s*\d{1,3}\s*$')


PAGE_RE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', re.S)
BLOCK_RE = re.compile(
    r'<block xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</block>', re.S)
LINE_RE = re.compile(r'<line .*?>(.*?)</line>', re.S)
WORD_RE = re.compile(r'<word [^>]*>([^<]*)</word>')
FOOTER_Y = 700          # running heads and folios sit below this
FULL_WIDTH = 0.60       # a block this wide spans both columns


def pages(pdf):
    """Printed page number -> text in true reading order.

    Blocks that span both columns (chapter titles, wide sidebars) divide the page
    into bands; inside each band the left column is read before the right.
    """
    xml = subprocess.run(['pdftotext', pdf, '-bbox-layout', '-'],
                         capture_output=True, text=True, check=True).stdout
    out = {}
    for idx, pm in enumerate(PAGE_RE.finditer(xml)):
        pw, ph, body = float(pm.group(1)), float(pm.group(2)), pm.group(3)
        mid, wide = pw / 2, pw * FULL_WIDTH
        blocks_ = []
        for bm in BLOCK_RE.finditer(body):
            x0, y0, x1, _ = (float(bm.group(i)) for i in range(1, 5))
            text = '\n'.join(
                clean(html.unescape(' '.join(WORD_RE.findall(ln))))
                for ln in LINE_RE.findall(bm.group(5)))
            text = '\n'.join(ln for ln in text.split('\n') if ln)
            if not text or y0 > FOOTER_Y or RUNNING.match(text) or PAGENUM.match(text):
                continue
            blocks_.append({'x': x0, 'y': y0, 'full': (x1 - x0) >= wide,
                            'col': 0 if (x0 + x1) / 2 < mid else 1, 'text': text})

        # Bands are delimited by the full-width blocks, in vertical order.
        cuts = sorted(b['y'] for b in blocks_ if b['full'])
        def band(b):
            return sum(1 for c in cuts if b['y'] >= c - 1)
        blocks_.sort(key=lambda b: (band(b), 0 if b['full'] else 1, b['col'], b['y']))
        out[idx] = '\n'.join(b['text'] for b in blocks_)
    return out


def span(pp, first, last):
    return '\n'.join(pp[i] for i in range(first, last + 1) if i in pp)


def span_pages(pp, first, last):
    """span(), plus a line-index -> printed-page map so entries can cite a page."""
    chunks, idx, pmap = [], 0, {}
    for i in range(first, last + 1):
        if i not in pp:
            continue
        for _ in pp[i].split('\n'):
            pmap[idx] = i
            idx += 1
        chunks.append(pp[i])
    return '\n'.join(chunks), pmap


def unwrap(block):
    """Join PDF line wraps back into paragraphs.

    Justified body text gives near-constant line lengths, so a line noticeably
    shorter than the median ends a paragraph. Blank lines are column breaks and
    carry no meaning, so they are ignored.
    """
    lines = [ln.strip() for ln in block.split('\n') if ln.strip()]
    if not lines:
        return ''
    med = statistics.median(len(ln) for ln in lines) or 1
    paras, cur = [], []
    for ln in lines:
        cur.append(ln)
        if len(ln) < med * 0.85 or ln.endswith(':'):
            paras.append(cur)
            cur = []
    if cur:
        paras.append(cur)
    return '\n\n'.join(dehyphen(' '.join(p)) for p in paras).strip()


# Words the book legitimately hyphenates; everything else that breaks across a
# line is rejoined. Kept deliberately small — review the report if a word looks wrong.
KEEP_HYPHEN = re.compile(
    r'^(?:self|non|anti|pseudo|quasi|ex|re|co|pre|post|semi|half|cross|'
    r'well|ill|high|low|long|short|new|old|all|near|far|over|under|'
    r'soul|god|dark|black|blood|life|death|mind|hand|hard|cold|warm|'
    r'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)$', re.I)


def dehyphen(s):
    def fix(m):
        a, b = m.group(1), m.group(2)
        if KEEP_HYPHEN.match(a) or b[:1].isupper():
            return f'{a}-{b}'
        return a + b
    return re.sub(r'(\w+)-\s+(\w+)', fix, s)


def clean(s):
    return re.sub(r'\s+', ' ', s).strip()


def slug(s):
    s = s.lower().replace('’', "'").replace('‘', "'").replace("'", '')
    return re.sub(r'[^a-z0-9]+', '_', s).strip('_')


def write(name, obj):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write('\n')
    n = len(obj) if isinstance(obj, (list, dict)) else 1
    print(f'  {name:28s} {n:4d} entries')
    return n


# ── Chapter 5: Merits, Flaws, Investments (pp. 117-127) ──────────────────────

COST = r'(\d+(?:\+|-\d+)?)'
KINDS = r'(Supernatural Merit|Supernatural Flaw|Investment)'
# Merits and Flaws put the tag on its own line under the name; Investments put
# the name and tag together on one line.
TAG = re.compile(rf'^\({COST} ?pt\.? {KINDS}\)$')
TAG_INLINE = re.compile(rf'^(.{{3,60}}?) \({COST} ?pt\.? {KINDS}\)$')


# Headings that end a trait's body text. Without these the last entry of each
# section swallows the prose that follows it.
STOP = {'Infernal Investments', 'Optional Rule: Infernal Pacts', 'Investment Traits',
        'Demonic Investment Flaws', 'Malevolent Focus', 'Aberration and Heresy'}

# p. 127 tags Media Bomb "(8 pts.)", omitting the trait type that every other
# entry carries. Normalised here so the one parser handles it.
TYPOS = [('Media Bomb (8 pts.)', 'Media Bomb (8 pt. Investment)')]


def traits(pp):
    text, pmap = span_pages(pp, 117, 128)
    for bad, good in TYPOS:
        text = text.replace(bad, good)
    lines = [ln.strip() for ln in text.split('\n')]
    found = []
    for i, ln in enumerate(lines):
        m = TAG_INLINE.match(ln)
        if m:
            found.append({'name': clean(m.group(1)), 'cost': m.group(2),
                          'tag': m.group(3), 'at': i})
            continue
        m = TAG.match(ln)
        if not m:
            continue
        # The name is the nearest preceding non-empty line.
        j = i - 1
        while j >= 0 and not lines[j].strip():
            j -= 1
        if j < 0:
            continue
        found.append({'name': clean(lines[j]), 'cost': m.group(1), 'tag': m.group(2),
                      'at': i})

    # Body text runs from each tag to the next entry's name.
    out = []
    for k, e in enumerate(found):
        stop = found[k + 1]['at'] - 1 if k + 1 < len(found) else len(lines)
        for j in range(e['at'] + 1, stop):            # truncate at a section heading
            if lines[j] in STOP:
                stop = j
                break
        body = unwrap('\n'.join(lines[e['at'] + 1:stop]))
        kind = {'Supernatural Merit': 'merit', 'Supernatural Flaw': 'flaw',
                'Investment': 'investment'}[e['tag']]
        out.append({'id': slug(e['name'].split(',')[0]), 'name': e['name'],
                    'kind': kind, 'cost': e['cost'],
                    'category': 'Supernatural', 'page': pmap.get(e['at'], 117),
                    'text': body})
    return out


# ── heading-driven splitting ─────────────────────────────────────────────────

def _norm(s):
    return clean(s).lower()


def blocks(text, headings, stop=None):
    """Slice `text` into {heading: body} at each heading, in order.

    Headings are matched against whole lines, never as substrings: several in
    this book are ordinary words ("Torment", "Violation", "Mutilation") that also
    occur inside body prose, and a substring match splits the block mid-word.
    A heading that wraps onto a second line is matched as the pair.

    Bodies keep their line structure so nested calls and unwrap() still work.
    Returns the bodies, the headings that were not found, and each heading's
    line index (so callers holding a span_pages() map can cite a page).
    """
    lines = [ln.strip() for ln in text.split('\n')]
    norm = [_norm(ln) for ln in lines]
    hits, missing, cur = [], [], 0
    for h in headings:
        want = _norm(h)
        found = consumed = -1
        for i in range(cur, len(lines)):
            for n in (1, 2, 3):                 # display headings wrap up to 3 lines
                if i + n <= len(lines) and _norm(' '.join(lines[i:i + n])) == want:
                    found, consumed = i, n
                    break
            if found >= 0:
                break
        if found < 0:
            missing.append(h)
            continue
        hits.append((found, consumed, h))
        cur = found + consumed

    end = len(lines)
    if stop:
        want = _norm(stop)
        for i in range(cur, len(lines)):
            if norm[i].startswith(want):
                end = i
                break

    out, pos = {}, {}
    for k, (i, c, h) in enumerate(hits):
        to = hits[k + 1][0] if k + 1 < len(hits) else end
        out[h] = '\n'.join(lines[i + c:to])
        pos[h] = i
    return out, missing, pos


# ── Chapter 2: origins (pp. 55-58) and Abyssal Essences (pp. 59-60) ──────────

ORIGINS = [
    ('barabbi', 'Barabbi', 'Barabbi',
     'A mage who already belonged to another sect and chose to Fall. Keeps the '
     'focus and training of the faction they betrayed — and often stays inside '
     'it, poisoning it from within.'),
    ('caul_born', 'The Caul-Born', 'Caul-Born',
     'Awakened through the Cauls themselves, or Fell very shortly afterward. No '
     'previous loyalty to discard and no inherited habits to unlearn; among the '
     'Fallen they are reckoned the "pure" ones.'),
    ('widderslainte', 'Widderslainte', 'Widderslainte',
     'Born with a Nephandic soul from a previous incarnation. Doomed from the '
     'womb, and the most sympathetic of their kind — the Cauls beckon from '
     'childhood until death.'),
]

ESSENCES = [
    ('chaotic', 'Chaotic: The Primordial Essence', 'Chaotic', 'Primordial'),
    ('destructive', 'Destructive: The Dynamic Essence', 'Destructive', 'Dynamic'),
    ('frozen', 'Frozen: The Static Essence', 'Frozen', 'Static'),
    ('tormented', 'Tormented: The Questing Essence', 'Tormented', 'Questing'),
]


def origins(pp):
    src = span(pp, 55, 58)
    bodies, missing, _ = blocks(src, [h for _, h, _, _ in ORIGINS],
                             stop='Nephandic Avatars')
    if missing:
        print(f'    ! origins not found: {missing}')
    return [{'id': i, 'name': n, 'summary': s, 'page': 55,
             'text': unwrap(bodies.get(h, ''))}
            for i, h, n, s in ORIGINS]


def essences(pp):
    src = span(pp, 59, 60)
    bodies, missing, _ = blocks(src, [h for _, h, _, _ in ESSENCES],
                             stop='The Law of Predation')
    if missing:
        print(f'    ! essences not found: {missing}')
    return [{'id': i, 'name': n, 'm20Essence': m20, 'page': 59,
             'text': unwrap(bodies.get(h, ''))}
            for i, h, n, m20 in ESSENCES]


# ── Chapter 3: the eight sects (pp. 68-91) ───────────────────────────────────
# Structural metadata transcribed from the chapter and its table of contents;
# the prose under each sub-heading is extracted.
# Each sect is located by its full display heading, "<name>: <subtitle>", which
# the PDF wraps over two or three lines.
SECTS = [
    ('infernalists', 'Infernalists', 'Their Satanic Majesties', 'The Unholy Trinity', 68),
    ('kllashaa', 'K’llashaa', 'Prophets of Mad Sanity', 'The Unholy Trinity', 71),
    ('malfeans', 'Malfeans', 'Hunters of the World’s End', 'The Unholy Trinity', 74),
    ('baphies', 'Baphies (Goatkids)', 'Dancers of the Beast', 'The Secret Scourge', 76),
    ('exies', 'Exies (Obliviates)', 'Devotees of Extinction', 'The Secret Scourge', 79),
    ('basks', 'Heralds of Basilisk (Basks)', 'Tricksters of the Wired World', 'The Secret Scourge', 82),
    ('ironhands', 'Ironhands', 'Crafters of Oblivion', 'The Secret Scourge', 85),
    ('mammonites', 'Mammonites', 'The Cruelty of Gold', 'The Secret Scourge', 89),
]
SECT_PARTS = ['Organization, Goals, and Tactics', 'Focus and Spells', 'Dark Luminaries']


def sects(pp):
    """Slice chapter three at the eight sect headings, then at the three
    sub-headings inside each. Page spans alone do not work: a page that starts
    one sect also carries the tail of the previous one."""
    chapter = span(pp, 67, 91)
    heads = [f'{name}: {sub}' for _, name, sub, _, _ in SECTS]
    sect_bodies, missing, _ = blocks(chapter, heads, stop='Chapter Four')
    if missing:
        print(f'    ! sects not found: {missing}')
    out = []
    for (sid, name, subtitle, group, page), head in zip(SECTS, heads):
        body = sect_bodies.get(head, '')
        parts, _, _ = blocks(body, SECT_PARTS)
        lines = body.split('\n')
        cut = next((i for i, ln in enumerate(lines)
                    if _norm(ln) == _norm(SECT_PARTS[0])), len(lines))
        intro = '\n'.join(lines[:cut])
        out.append({
            'id': sid, 'name': name, 'subtitle': subtitle, 'group': group,
            'page': page,
            'intro': unwrap(intro.lstrip(' :—–-')),
            'organization': unwrap(parts.get(SECT_PARTS[0], '')),
            'focus': unwrap(parts.get(SECT_PARTS[1], '')),
            'luminaries': unwrap(parts.get(SECT_PARTS[2], '')),
        })
    return out


# ── Chapter 4: Sphere → Qlipha (p. 104) and the Dominions (pp. 107-112) ──────

SPHERE_IDS = {'Correspondence': 'correspondence', 'Entropy': 'entropy', 'Forces': 'forces',
              'Life': 'life', 'Matter': 'matter', 'Mind': 'mind', 'Prime': 'prime',
              'Spirit': 'spirit', 'Time': 'time', 'The Absolute': 'absolute'}
QLIPHA_OF = {'correspondence': 'Thagirion', 'entropy': 'Samael', 'forces': 'Golchab',
             'life': 'Lilith', 'matter': 'Gha’ag Sheblah', 'mind': 'Satariel',
             'prime': 'Gamaliel', 'spirit': 'Ghagiel', 'time': 'A’arab Zaraq',
             'absolute': 'Thaumiel'}


def sphere_qlipha(pp):
    """The p.104 bullet list: one bullet per Sphere, plus the rumoured 10th."""
    lines = pp[104].split('\n')
    bullets, cur = [], None
    for ln in lines:
        s = ln.strip()
        if s.startswith('•'):
            if cur:
                bullets.append(cur)
            cur = [s.lstrip('• ').strip()]
        elif cur is not None and s:
            cur.append(s)
    if cur:
        bullets.append(cur)

    out = []
    for b in bullets:
        text = dehyphen(' '.join(b))
        head = text.split(',')[0].strip()
        sid = SPHERE_IDS.get(head)
        if not sid:
            print(f'    ! unmatched Sphere bullet: {head!r}')
            continue
        out.append({'sphere': sid, 'name': head, 'qlipha': QLIPHA_OF[sid],
                    'page': 104, 'text': clean(text),
                    'rumoured': sid == 'absolute'})
    return out


# Book order: rank 10 down to 1, with Daath (rank 0 here) sitting in the gap
# between 4 and 3. Names and titles are given explicitly because two of the
# headings wrap mid-phrase in the PDF, which loses the subtitle.
QLIPHOTH = [
    (10, 'lilith', 'Lilith', 'the Queen of Night', '10: Lilith, the Queen of Night', 107),
    (9, 'gamaliel', 'Gamaliel', 'the Obscene Ones', '9: Gamaliel, the Obscene Ones', 107),
    (8, 'samael', 'Samael', 'the Poison of God', '8: Samael, the Poison of God', 108),
    (7, 'aarab_zaraq', 'A’arab Zaraq', 'the Ravens of Dispersion', '7: A’arab Zaraq, the', 108),
    (6, 'thagirion', 'Thagirion', 'the Disputers', '6: Thagirion, the Disputers', 109),
    (5, 'golchab', 'Golchab', 'the Flaming Ones', '5: Golchab, the Flaming Ones', 109),
    (4, 'ghaag_sheblah', 'Gha’ag Sheblah', 'the Smiter', '4: Gha’ag Sheblah, the Smiter', 110),
    (0, 'daath', 'Daath', 'the Returned Abyss', 'Daath, the Returned Abyss', 111),
    (3, 'satariel', 'Satariel', 'the Concealers', '3: Satariel, the Concealers', 111),
    (2, 'ghagiel', 'Ghagiel', 'the Hinderers', '2: Ghagiel, the Hinderers', 112),
    (1, 'thaumiel', 'Thaumiel', 'the Twin Gods', '1: Thaumiel, the Twin Gods', 112),
]


BODY_OVERRIDE = {}      # column-aware pages() removed the need for any


def qlippoth(pp):
    src = span(pp, 107, 113)
    bodies, missing, _ = blocks(src, [h for *_, h, _ in QLIPHOTH],
                             stop='The Black Diamond')
    if missing:
        print(f'    ! Qliphoth not found: {missing}')
    flat = clean(src.replace('\n', ' '))
    out = []
    for rank, qid, name, title, head, page in QLIPHOTH:
        body = bodies.get(head, '')
        if qid in BODY_OVERRIDE:
            start, end = BODY_OVERRIDE[qid]
            i, j = flat.find(start), flat.find(end)
            if i < 0 or j < i:
                print(f'    ! {qid}: body override did not match')
            else:
                body = flat[i:j]
        # A wrapped heading can leave its second line at the head of the body.
        lead = title.replace('the ', '')
        if body[:len(lead) + 4].lower().startswith(lead.lower()):
            body = body[len(lead):].lstrip(' :—–-')
        out.append({'id': qid, 'rank': rank, 'name': name,
                    'title': f'{name}, {title}', 'page': page,
                    'text': unwrap(dehyphen(body))})
    out.sort(key=lambda q: -q['rank'])
    return out


# ── Chapter 5: Infernal Pacts (p. 121) ───────────────────────────────────────

PACT = re.compile(r'^Level (\d+): (.+)$')


def pacts(pp):
    lines = [ln.strip() for ln in span(pp, 120, 122).split('\n')]
    marks = [(i, int(m.group(1)), clean(m.group(2)))
             for i, ln in enumerate(lines) if (m := PACT.match(ln))]
    out = []
    for k, (i, lvl, name) in enumerate(marks):
        stop = marks[k + 1][0] if k + 1 < len(marks) else len(lines)
        out.append({'level': lvl, 'name': name, 'freebies': lvl, 'page': 121,
                    'text': unwrap('\n'.join(lines[i + 1:stop]))})
    return out


# ── Chapter 5: Malevolent Focus (pp. 127-151) ────────────────────────────────
# Heading lists come from the chapter's table of contents; blocks() reports any
# that fail to match so the list can be corrected rather than silently dropped.
FOCUS = {
    'heresy': (127, 131, 'Nephandic Paradigms', [
        'Alternative Sciences', 'Dark Paganism (or Heathenism)', 'Lilithianism',
        'Luciferianism', 'Palo Mayombe', 'The Prosperity Gospel', 'Satanism',
        'Thugee']),
    'paradigm': (131, 139, 'Fallen Practices', [
        'All Power Comes from Sin', 'Barbarism is the Truest State of Man',
        'Cosmic Horror is the Only Truth',
        'Everyone’s Against Me, so Whatever I do is Justified',
        'Evil is Necessary, and so I am Evil',
        'Existence is Unknowable, Irrational, and Sublime',
        'Forbidden Wisdom is the Truest Source of Power', 'I am All',
        'I’m a Predator, and the World is My Prey',
        'Indulgence is Nature’s Only Law', 'Only the Strongest Deserve to Survive',
        'People are Shit', 'Rebellion is the Road to Transcendence',
        'We are Stormtroopers of the Abyss']),
    'practice': (139, 146, 'Malign Instruments', [
        'Abyssalism', 'The Black Mass', 'Demonism', 'Feralism', 'Goetia',
        'Infernal Sciences', 'Vamamarga']),
    'instrument': (146, 151, 'Malignant Magicks', [
        'Atrocity', 'Perversion', 'Mutilation', 'Torment',
        'Trolling and Cyberbullying', 'Violation']),
}


def focus(pp):
    out = []
    for kind, (first, last, stop, heads) in FOCUS.items():
        text, pmap = span_pages(pp, first, last)
        bodies, missing, pos = blocks(text, heads, stop=stop)
        if missing:
            print(f'    ! {kind} not found: {missing}')
        for h in heads:
            if h not in bodies:
                continue
            out.append({'id': slug(h.split(' (')[0]), 'name': h, 'kind': kind,
                        'page': pmap.get(pos[h], first),
                        'text': unwrap(bodies[h])})
    return out


# ── Chapter 5: Fallen spells and rites (pp. 151-164) ─────────────────────────
# Names from the chapter's table of contents. A rote heading is the name followed
# by its Sphere requirement in parentheses, wrapped over up to three lines; the
# name itself sometimes wraps before the parenthesis opens.
ROTE_NAMES = [
    'Shroud the Soul', 'Spot the Sucker', 'The Art of Seduction',
    'Every Man Against His Brother', 'Look Away', 'Rile the Herd',
    'Beautify or Deform', 'Blindside', 'Blur Truth or Fake News',
    'Constant Cravings', 'Grasping Terrors', 'I Disappear',
    'Mirror, Mirror or Murphy’s Mirror', 'Plague Mass',
    'Kraft Memetic Catastrophe', 'Shadow of the Black Wind', 'Timeless Agony',
    'Untangle Tongues or Lo, It Is Written or Jabberhash', 'Conjure the Beast',
    'Abyssal Escape', 'Devil’s Advocate', 'Invoke the Caul',
]
DOTS = {'•': 1, '••': 2, '•••': 3, '••••': 4, '•••••': 5}


def rotes(pp):
    text, pmap = span_pages(pp, 151, 165)
    lines = [ln.strip() for ln in text.split('\n')]
    hits, missing, cur = [], [], 0
    for name in ROTE_NAMES:
        want = _norm(name)
        found = -1
        for i in range(cur, len(lines)):
            if lines[i].startswith('•'):
                continue                      # a body bullet, not a heading
            for n in (1, 2, 3):
                if _norm(' '.join(lines[i:i + n])).startswith(want):
                    found = i
                    break
            if found >= 0:
                break
        if found < 0:
            missing.append(name)
            continue
        # Consume lines until the Sphere parenthesis closes.
        head, depth, j = [], 0, found
        while j < len(lines) and j < found + 5:
            head.append(lines[j])
            depth += lines[j].count('(') - lines[j].count(')')
            j += 1
            if depth <= 0 and '(' in ' '.join(head):
                break
        hits.append({'name': name, 'head': clean(' '.join(head)), 'at': found,
                     'body_at': j})
        cur = j
    if missing:
        print(f'    ! rotes not found: {missing}')

    stop = next((i for i, ln in enumerate(lines)
                 if _norm(ln).startswith('diverse items of fell')), len(lines))
    out = []
    for k, h in enumerate(hits):
        end = hits[k + 1]['at'] if k + 1 < len(hits) else stop
        m = re.search(r'\((.+)\)\s*$', h['head'])
        spheres_raw = clean(m.group(1)) if m else ''
        named = sorted({w for w in re.findall(
            r'(?:•+)\s*([A-Z][a-z]+)', spheres_raw)})
        # Several rotes are printed under two or three interchangeable names.
        alts = [clean(a) for a in re.split(r'\s+or\s+', h['name'])]
        out.append({'id': slug(h['name']), 'name': alts[0], 'aka': alts[1:],
                    'fullName': h['name'], 'heading': h['head'],
                    'page': pmap.get(h['at'], 151),
                    'spheres_raw': spheres_raw, 'spheres': named,
                    'text': unwrap('\n'.join(lines[h['body_at']:end]))})
    return out


# ── Chapter 5: artifacts (pp. 164-175) ───────────────────────────────────────
ARTIFACTS = [
    ('Akaa’ Et Nuon Ta / “Cry of the World”', 'black_book', 165),
    ('The Annotated Protocols of Damian', 'black_book', 165),
    ('The Blargarian Mythos', 'black_book', 166),
    ('The Ebon Broomstick Series', 'black_book', 166),
    ('The Six Seals of Ganzir', 'black_book', 167),
    ('The Hunter and the Prey', 'black_book', 167),
    ('The Malleus Nefandorum', 'black_book', 168),
    ('The Sebel-el-Mafouh Whash', 'black_book', 168),
    ('The Squirebook', 'black_book', 169),
    ('The Thirteen Hours', 'black_book', 169),
    ('The Catcher-Snatcher', 'device', 170),
    ('False Face', 'device', 171),
    ('Malign Cutlery', 'device', 171),
    ('The Riotizer', 'device', 172),
    ('FIDO', 'device', 173),
    ('Gallu’s Lash', 'device', 173),
    ('Portable Hellgate', 'device', 174),
]


LEAD_RATING = re.compile(r'^([•]+)\s*\+?\s*')
TRAIL_PARENS = re.compile(r'\s*\(([^)]*)\)\s*$')


def _artifact_key(line):
    """Strip a heading's rating and type so it can be compared to a bare name.

    Black books are titled "Name (•••• Grimoire)"; devices put the rating first,
    "•• The Catcher-Snatcher (Device)" — and one is "•• + Malign Cutlery".
    Returns (key, rating, type_label).
    """
    s = line.strip()
    lead = LEAD_RATING.match(s)
    rating = len(lead.group(1)) if lead else 0
    s = LEAD_RATING.sub('', s)
    label = ''
    tail = TRAIL_PARENS.search(s)
    if tail:
        inner = tail.group(1)
        dots = re.match(r'^([•]+)\s*', inner)
        if dots:
            rating = rating or len(dots.group(1))
            inner = inner[dots.end():]
        label = clean(inner)
        s = TRAIL_PARENS.sub('', s)
    return _norm(s), rating, label


def artifacts(pp):
    text, pmap = span_pages(pp, 164, 176)
    lines = [ln.strip() for ln in text.split('\n')]
    keys = [_artifact_key(ln) for ln in lines]
    hits, missing, cur = [], [], 0
    for name, kind, page in ARTIFACTS:
        want = _norm(name)
        found = next((i for i in range(cur, len(lines)) if keys[i][0] == want), -1)
        if found < 0:
            missing.append(name)
            continue
        hits.append((found, name, kind, page))
        cur = found + 1
    if missing:
        print(f'    ! artifacts not found: {missing}')

    stop = next((i for i, ln in enumerate(lines)
                 if _norm(ln).startswith('chapter six')), len(lines))
    out = []
    for k, (i, name, kind, page) in enumerate(hits):
        end = hits[k + 1][0] if k + 1 < len(hits) else stop
        _, rating, label = keys[i]
        body = [ln for ln in lines[i + 1:end]]

        # Several entries carry the rating and type on the line below the title.
        while body and not body[0]:
            body.pop(0)
        if body and body[0].startswith('(') and body[0].endswith(')'):
            inner = body.pop(0)[1:-1]
            dots = re.findall(r'[•]+', inner)
            if dots:
                rating = rating or max(len(d) for d in dots)
                inner = clean(re.sub(r'[•]+', '', inner))
            if not label and not inner.startswith('“'):
                label = clean(inner.strip(' or'))

        # "Arete 3, Quintessence 15, Background Cost N/A" — Devices say
        # "Enlightenment" where mystick Wonders say "Arete".
        stats, rest = {}, body
        for j in range(min(6, len(body))):
            # The stat line sometimes wraps just before the Background Cost value.
            for width in (1, 2):
                probe = clean(' '.join(body[j:j + width]))
                sm = re.match(
                    r'^(Arete|Enlightenment)\s+(N/A|\d+\+?)\s*,\s*Quintessence\s+'
                    r'(N/A|\d+\+?)\s*,\s*Background Cost\s+(N/A|[\d+\-–]+)\s*(.*)$', probe)
                if sm:
                    break
            if sm:
                stats = {'areteLabel': sm.group(1), 'arete': sm.group(2),
                         'quintessence': sm.group(3), 'backgroundCost': sm.group(4)}
                if sm.group(5).strip(' ()'):
                    stats['costNote'] = clean(sm.group(5).strip(' ()'))
                rest = body[:j] + body[j + width:]
                break

        while rest and not rest[0]:
            rest.pop(0)
        if rest and rest[0].startswith('(') and rest[0].endswith(')'):
            stats['costNote'] = clean(rest.pop(0)[1:-1])   # e.g. "per 10 units"
        out.append({'id': slug(name.split('/')[0]), 'name': name, 'kind': kind,
                    'rating': rating, 'type': label, 'page': pmap.get(i, page),
                    **stats, 'text': unwrap('\n'.join(rest))})
    return out


# Expected counts, so a silent regression in the PDF plumbing is caught here
# rather than halfway through the catalogue build.
EXPECT = {'traits.json': 24, 'origins.json': 3, 'essences.json': 4, 'sects.json': 8,
          'sphere_qlipha.json': 10, 'qlippoth.json': 11, 'pacts.json': 10,
          'focus.json': 35, 'rotes.json': 22, 'artifacts.json': 17}


def main():
    if not os.path.exists(PDF):
        sys.exit(f'PDF not found: {PDF}\nPass the path as the first argument.')
    print(f'Reading {os.path.basename(PDF)} …')
    pp = pages(PDF)
    print(f'  {len(pp)} pages\n')

    data = {
        'traits.json': traits(pp),
        'origins.json': origins(pp),
        'essences.json': essences(pp),
        'sects.json': sects(pp),
        'sphere_qlipha.json': sphere_qlipha(pp),
        'qlippoth.json': qlippoth(pp),
        'pacts.json': pacts(pp),
        'focus.json': focus(pp),
        'rotes.json': rotes(pp),
        'artifacts.json': artifacts(pp),
    }
    bad = []
    for name, rows in data.items():
        n = write(name, rows)
        if EXPECT.get(name) not in (None, n):
            bad.append(f'{name}: expected {EXPECT[name]}, got {n}')
        empty = [r.get('id') or r.get('name') for r in rows
                 if not clean(r.get('text') or r.get('intro') or '')]
        if empty:
            bad.append(f'{name}: no text for {empty}')

    kinds = {}
    for e in data['traits.json']:
        kinds[e['kind']] = kinds.get(e['kind'], 0) + 1
    for e in data['focus.json']:
        kinds[e['kind']] = kinds.get(e['kind'], 0) + 1
    print('\n  ' + '  '.join(f'{k}={v}' for k, v in sorted(kinds.items())))

    if bad:
        print('\nPROBLEMS:')
        for b in bad:
            print(f'  ! {b}')
        sys.exit(1)
    print('\nAll sections extracted and non-empty.')


if __name__ == '__main__':
    main()
