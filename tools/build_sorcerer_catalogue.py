#!/usr/bin/env python3
"""Assemble app/public/js/data-sorcerer.js from the transcribed JSON chunks."""
import json, re, sys, os
C = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sorcerer-src')
OUT = sys.argv[1]

def load(n): return json.load(open(os.path.join(C, n), encoding='utf-8'))

paths = []
for i in range(4): paths += load(f'paths{i}.json')
phen = []
for i in range(3): phen += load(f'phen{i}.json')
affil = load('affil.json')
core = load('core_ch4.json')

def slug(s):
    s = s.lower().replace('’', "'").replace("'", '')
    s = re.sub(r'[^a-z0-9]+', '_', s).strip('_')
    return s

ATTR_IDS = {'strength','dexterity','stamina','charisma','manipulation','appearance','perception','intelligence','wits'}

# ── normalise paths ──────────────────────────────────────────────────────────
path_by_name = {}
for p in paths:
    p['id'] = slug(p['name']) if p['id'] in ('', None) else p['id']
    p.setdefault('levels', []); p.setdefault('rituals', []); p.setdefault('sidebars', []); p.setdefault('notes', '')
    p['system'] = p.get('system') or {}
    for k in ('text','modifiers','priceOfFailure'): p['system'].setdefault(k, '')
    p['system'].setdefault('aspects', [])
    for r in p['rituals']:
        r['id'] = r.get('id') or slug(r['name'])
        r['level'] = int(r['level'])
    # Store Spell (level 5) is available on every Path that has rituals (p. 14)
    if p['rituals'] and not any(r['id'] == 'store_spell' for r in p['rituals']):
        p['rituals'].append({'id': 'store_spell', 'name': 'Store Spell', 'level': 5, 'generic': True,
            'text': core['coreRules'].get('storeSpell') or 'With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path.'})
    p['rituals'].sort(key=lambda r: (r['level'], r['name']))
    path_by_name[p['name'].lower()] = p['id']

# Affiliations name two Paths under their older titles (confirmed by David 2026-11-03):
# Herbalism is grouped with Brewing under the Path of Alchemy, and Shadowcasting is the Shadows Path (p. 45).
PATH_ALIASES = {'herbalism': 'alchemy', 'shadowcasting': 'shadows'}
for alias, target in PATH_ALIASES.items(): path_by_name[alias] = target

for ph in phen:
    ph['id'] = ph.get('id') or slug(ph['name'])
    ph.setdefault('levels', []); ph.setdefault('system', ''); ph.setdefault('sidebars', []); ph.setdefault('notes', '')
    for l in ph['levels']: l['level'] = int(l['level']); l.setdefault('name', '')
phen_by_name = {ph['name'].lower(): ph['id'] for ph in phen}

# ── affiliations: resolve favored names to ids ───────────────────────────────
def resolve_favored(names):
    paths_out, phen_out, unresolved = [], [], []
    for raw in names:
        base = re.sub(r'\s*\(.*?\)\s*$', '', raw).strip()
        key = base.lower().replace('summon,', 'summoning,').replace('summoning, binding and warding', 'summoning, binding, and warding')
        if key == 'shadow': key = 'shadows'   # Affiliations list the Shadows Path as "Shadow"
        if key in path_by_name: paths_out.append({'id': path_by_name[key], 'qualifier': raw[len(base):].strip(' ()')})
        elif key in phen_by_name: phen_out.append(phen_by_name[key])
        else: unresolved.append(raw)
    return paths_out, phen_out, unresolved

for a in affil:
    a['id'] = a.get('id') or slug(a['name'])
    a.setdefault('kind', 'affiliation')
    a.setdefault('favoredAttributes', []); a.setdefault('favoredPaths', []); a.setdefault('favoredNote', ''); a.setdefault('sidebars', [])
    a['favoredAttributes'] = [x.lower() for x in a['favoredAttributes'] if x.lower() in ATTR_IDS]
    fp, fph, un = resolve_favored(a['favoredPaths'])
    a['favoredPathIds'] = fp; a['favoredPhenomenaIds'] = fph
    if un: print('UNRESOLVED favored in', a['name'], un, file=sys.stderr)

# ── chapter four ─────────────────────────────────────────────────────────────
for m in core['meritsFlaws']:
    m['id'] = m.get('id') or slug(m['name'])
for art in core['artifacts']:
    art['id'] = art.get('id') or slug(art['name'])

data = {
  'SOURCE': {'title': 'M20 Sorcerer', 'publisher': 'Paradox Interactive / Onyx Path', 'year': 2022, 'developer': 'Travis Legge', 'chargenPage': 103},
  'CREATION': {
    'attrPoints': {'primary': 6, 'secondary': 4, 'tertiary': 3},
    'abilityPoints': {'primary': 11, 'secondary': 7, 'tertiary': 4},
    'abilityMax': 3, 'backgroundDots': 5, 'numinaDots': 5, 'startWillpower': 5, 'freebiePoints': 21,
    'ritualsPerDot': 1, 'psychicCapDivisor': 2,
  },
  'FREEBIE_COSTS': {
    'attribute': {'label': 'Attribute', 'cost': 5}, 'ability': {'label': 'Ability', 'cost': 2}, 'newAbility': {'label': 'New Ability', 'cost': 3},
    'numina': {'label': 'Path / Phenomenon', 'cost': 7}, 'ritual': {'label': 'Ritual', 'cost': 3}, 'background': {'label': 'Background', 'cost': 1},
    'willpower': {'label': 'Willpower', 'cost': 1}, 'merit': {'label': 'Merit', 'cost': 'as listed'}, 'flaw': {'label': 'Flaw (bonus)', 'cost': 'as listed', 'maxBonus': 7},
  },
  'XP_COSTS': {
    'newAbility': 3, 'ability': 'current x2', 'newNumina': 7, 'numina': 'current x7', 'affinityPath': 'current x6',
    'secondaryNumina': 21, 'willpower': 'current rating', 'attribute': 'current x4', 'newRitual': 'rating of ritual', 'background': 'current x3',
  },
  'BACKGROUNDS': {
    'base': ['Allies','Alternate Identity','Arcane/Cloaking','Backup','Blessing','Certification','Contacts','Cult','Demesne','Destiny','Fame','Familiar/Companion','Influence','Library','Mentor','Past Lives','Patron','Rank','Resources','Spies','Status','Totem','Artifact'],
    'traditions': ['Chantry','Node','Retainers','Sanctum'], 'disparates': ['Chantry','Node','Retainers','Sanctum'],
    'technocracy': ['Construct','Hypercram','Enhancement','Node','Requisitions','Laboratory','Secret Weapons'],
    'artifactLevels': core['backgrounds'].get('artifactLevels', []), 'text': core['backgrounds'].get('text', ''),
  },
  'ASPECTS': core['aspects'],
  'CORE_RULES': core['coreRules'],
  'CREATION_TEXT': core['creation'].get('text', ''),
  'PATHS': paths, 'PHENOMENA': phen, 'AFFILIATIONS': affil, 'MERITS_FLAWS': core['meritsFlaws'], 'ARTIFACTS': core['artifacts'],
  'ALIGNMENTS': [{'id': '', 'name': 'None'}, {'id': 'traditions', 'name': 'Council of Nine Mystick Traditions'}, {'id': 'disparates', 'name': 'Disparate Alliance'}, {'id': 'technocracy', 'name': 'Technocratic Union'}],
}

js = "/* M20 Sorcerer catalogue — generated from the book text; see tools/reports/sorcerer-catalogue.md. */\n"
js += "const SORCERER = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
js += r"""
// ── helpers ─────────────────────────────────────────────────────────────────
SORCERER.PATH_ALIASES   = {"herbalism": "alchemy", "shadowcasting": "shadows"};
SORCERER.pathById       = id => SORCERER.PATHS.find(p => p.id === (SORCERER.PATH_ALIASES[id] || id)) || null;
SORCERER.phenomenonById = id => SORCERER.PHENOMENA.find(p => p.id === id) || null;
SORCERER.numenById      = id => SORCERER.pathById(id) || SORCERER.phenomenonById(id);
SORCERER.affiliationById= id => SORCERER.AFFILIATIONS.find(a => a.id === id) || null;
SORCERER.meritById      = id => SORCERER.MERITS_FLAWS.find(m => m.id === id) || null;
SORCERER.artifactById   = id => SORCERER.ARTIFACTS.find(a => a.id === id) || null;
SORCERER.ritualById     = (pathId, ritualId) => { const p = SORCERER.pathById(pathId); return p ? (p.rituals.find(r => r.id === ritualId) || null) : null; };
SORCERER.isPath         = id => !!SORCERER.pathById(id);
SORCERER.isPhenomenon   = id => !!SORCERER.phenomenonById(id);
/** Highest Phenomenon rating allowed by Willpower (p. 54): floor(willpower / 2). */
SORCERER.psychicCap     = willpower => Math.floor((parseInt(willpower, 10) || 0) / SORCERER.CREATION.psychicCapDivisor);
/** Backgrounds available to a sorcerer given an Ascension War alignment ('', traditions, disparates, technocracy). */
SORCERER.backgroundsFor = alignment => [...SORCERER.BACKGROUNDS.base, ...(SORCERER.BACKGROUNDS[alignment] || [])];
/** Numina styles a character may use: the primary style plus a secondary learned with XP. */
SORCERER.stylesFor      = c => [c.numina_style, c.numina_secondary].filter(Boolean);
/** Rituals a character knows for a Path, sorted by level. */
SORCERER.ritualsFor     = (c, pathId) => (Array.isArray(c.rituals) ? c.rituals : []).filter(r => r.path === pathId).sort((a, b) => a.level - b.level);
/**
 * Ritual rule check for one Path (p. 104): one ritual per Path dot at creation, each of level <= rating,
 * and a ritual of level N needs one at every lower level. Returns { ok, errors[] }.
 */
SORCERER.checkRituals   = (c, pathId, rating, { creation = false } = {}) => {
  const rs = SORCERER.ritualsFor(c, pathId); const errors = [];
  const name = (SORCERER.pathById(pathId) || {}).name || pathId;
  rs.forEach(r => { if (r.level > rating) errors.push(`${name}: ritual “${r.name}” (level ${r.level}) is above the Path rating ${rating}.`); });
  const levels = new Set(rs.map(r => r.level));
  const maxLvl = Math.max(0, ...rs.map(r => r.level));
  for (let l = 1; l < maxLvl; l++) if (!levels.has(l)) { errors.push(`${name}: a level ${maxLvl} ritual needs a ritual at every lower level (missing level ${l}).`); break; }
  if (creation && rs.length > rating) errors.push(`${name}: ${rs.length} rituals but only ${rating} free (one per Path dot); extras cost 3 freebies each.`);
  return { ok: errors.length === 0, errors, extra: Math.max(0, rs.length - rating) };
};
if (typeof module !== 'undefined' && module.exports) module.exports = SORCERER;
"""
open(OUT, 'w', encoding='utf-8').write(js)
print('paths', len(paths), 'rituals', sum(len(p['rituals']) for p in paths), 'phenomena', len(phen), 'affiliations', len(affil), 'merits/flaws', len(core['meritsFlaws']), 'artifacts', len(core['artifacts']), 'aspects', len(core['aspects']))
