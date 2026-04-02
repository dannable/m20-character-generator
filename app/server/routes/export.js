'use strict';
const express    = require('express');
const router     = express.Router();
const path       = require('path');
const fs         = require('fs');
const db         = require('../db');
const { PDFDocument, PDFName, PDFString } = require('pdf-lib');

const TEMPLATE   = path.join('/data', 'template.pdf');
const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
                     'instruments','freebie_spent','attr_priority','ability_priority',
                     'merits','flaws','specialties'];

// Parse flat DB row — JSON fields become objects, everything else stays as-is
function parseRow(row) {
  if (!row) return null;
  const c = { ...row };
  JSON_FIELDS.forEach(f => {
    if (typeof c[f] === 'string') {
      try { c[f] = JSON.parse(c[f]); } catch { c[f] = f === 'instruments' ? [] : {}; }
    } else if (c[f] == null) {
      c[f] = f === 'instruments' ? [] : {};
    }
  });
  return c;
}

// ── PDF helpers ───────────────────────────────────────────────────────────────

function setText(form, name, value) {
  try { form.getTextField(name).setText(String(value ?? '')); } catch (_) {}
}

// Force-write any string into a choice/dropdown field — bypasses option validation
function setChoice(form, name, value) {
  if (!value) return;
  try {
    const field = form.getField(name);
    const str = PDFString.of(String(value));
    field.acroField.dict.set(PDFName.of('V'), str);
    field.acroField.getWidgets().forEach(w => {
      if (w.dict.has(PDFName.of('V'))) w.dict.set(PDFName.of('V'), str);
    });
  } catch (_) {}
}

// Try to match an existing dropdown option; fall back to force-writing
function setDropdown(form, name, value) {
  if (!value) return;
  try {
    const dd   = form.getDropdown(name);
    const opts = dd.getOptions();
    const hit  = opts.find(o => o.toLowerCase() === String(value).toLowerCase());
    if (hit) { dd.select(hit); return; }
  } catch (_) {}
  setChoice(form, name, value);
}

// Fill N filled dots starting at `startDot` (consecutive field numbers)
function checkDots(form, startDot, value, count = 5) {
  for (let i = 0; i < count; i++) {
    try {
      const cb = form.getCheckBox(`dot${startDot + i}`);
      if (i < value) cb.check(); else cb.uncheck();
    } catch (_) {}
  }
}

// ── Layout constants ──────────────────────────────────────────────────────────

// Dot-row start numbers for each group (consecutive within a row, step 8 between rows)
const ATTR_DOT_STARTS   = [1, 9, 17, 25, 33, 41, 49, 57, 65];
const BG_DOT_STARTS     = [385, 393, 401, 409, 414, 419];

function abilityDotStart(i)  { return 73  + i * 8; }  // 0-based, 0-29
function sphereDotStart(i)   { return 313 + i * 8; }  // 0-based, 0-8

// Attribute display order (Physical → Social → Mental)
const ATTR_KEYS  = ['strength','dexterity','stamina',
                    'charisma','manipulation','appearance',
                    'perception','intelligence','wits'];
const ATTR_NAMES = ['Strength','Dexterity','Stamina',
                    'Charisma','Manipulation','Appearance',
                    'Perception','Intelligence','Wits'];

// ── Tradition name mapping ────────────────────────────────────────────────────
const TRADITION_MAP = {
  'Akashayana (Akashic Brotherhood)': 'Akashic Brotherhood',
  'Celestial Chorus':                  'Celestial Chorus',
  'Cult of Ecstasy (Sahajiya)':        'Cult of Ecstacy',
  "Dreamspeakers (Kha'vadi)":          'Dreamspeakers',
  'Euthanatoi (Chakravanti)':          'Euthanatos',
  'Hollow Ones':                       'Hollow Ones',
  'Order of Hermes':                   'Order of Hermes',
  'Sons of Ether':                     'Sons of Ether',
  'Verbena':                           'Verbena',
  'Virtual Adepts':                    'Virtual Adepts',
};

// ── Ability definitions ───────────────────────────────────────────────────────
const TALENTS    = [
  { id:'alertness',    name:'Alertness'    },
  { id:'art',          name:'Art'          },
  { id:'athletics',    name:'Athletics'    },
  { id:'awareness',    name:'Awareness'    },
  { id:'brawl',        name:'Brawl'        },
  { id:'empathy',      name:'Empathy'      },
  { id:'expression',   name:'Expression'   },
  { id:'intimidation', name:'Intimidation' },
  { id:'leadership',   name:'Leadership'   },
  { id:'streetwise',   name:'Streetwise'   },
  { id:'subterfuge',   name:'Subterfuge'   },
];
const SKILLS     = [
  { id:'crafts',       name:'Crafts'       },
  { id:'drive',        name:'Drive'        },
  { id:'etiquette',    name:'Etiquette'    },
  { id:'firearms',     name:'Firearms'     },
  { id:'martialArts',  name:'Martial Arts' },
  { id:'meditation',   name:'Meditation'   },
  { id:'melee',        name:'Melee'        },
  { id:'research',     name:'Research'     },
  { id:'stealth',      name:'Stealth'      },
  { id:'survival',     name:'Survival'     },
  { id:'technology',   name:'Technology'   },
];
const KNOWLEDGES = [
  { id:'academics',     name:'Academics'     },
  { id:'computer',      name:'Computer'      },
  { id:'cosmology',     name:'Cosmology'     },
  { id:'enigmas',       name:'Enigmas'       },
  { id:'esoterica',     name:'Esoterica'     },
  { id:'investigation', name:'Investigation' },
  { id:'law',           name:'Law'           },
  { id:'medicine',      name:'Medicine'      },
  { id:'occult',        name:'Occult'        },
  { id:'politics',      name:'Politics'      },
  { id:'science',       name:'Science'       },
];

// Pick up to `limit` slots: highest-value first, then standard order
function selectAbilities(list, section, limit = 10) {
  const valued = list.filter(a => (section[a.id] || 0) > 0)
                     .sort((a,b) => (section[b.id]||0) - (section[a.id]||0));
  const zeroes = list.filter(a => !(section[a.id] || 0));
  return [...valued, ...zeroes].slice(0, limit);
}

// ── Sphere definitions ────────────────────────────────────────────────────────
const SPHERES = [
  { id:'correspondence', name:'Correspondence' },
  { id:'entropy',        name:'Entropy'        },
  { id:'forces',         name:'Forces'         },
  { id:'life',           name:'Life'           },
  { id:'matter',         name:'Matter'         },
  { id:'mind',           name:'Mind'           },
  { id:'prime',          name:'Prime'          },
  { id:'spirit',         name:'Spirit'         },
  { id:'time',           name:'Time'           },
];

// ── Merit / Flaw name lookup ─────────────────────────────────────────────────
const MERIT_NAMES = {
  acute_senses:'Acute Senses', ambidextrous:'Ambidextrous', bruiser:'Bruiser',
  catlike_balance:'Catlike Balance', double_jointed:'Double-Jointed',
  rugged_looks:'Rugged Good Looks', daredevil:'Daredevil', huge_size:'Huge Size',
  true_love:'True Love', friendly_face:'Friendly Face', enchanting_voice:'Enchanting Voice',
  charmed_life:'Charmed Life', natural_leader:'Natural Leader', common_sense:'Common Sense',
  versatile_sleeper:'Versatile Sleeper', language:'Language', eidetic_memory:'Eidetic Memory',
  lightning_calc:'Lightning Calculator', calm_heart:'Calm Heart', concentration:'Concentration',
  jack_of_trades:'Jack of All Trades', touched_veil:'Touched by the Veil', luck:'Luck',
  sphere_natural:'Sphere Natural', nine_lives:'Nine Lives', avatar_companion:'Avatar Companion',
};
const FLAW_NAMES = {
  speech_impediment:'Speech Impediment', hard_of_hearing:'Hard of Hearing',
  color_blind:'Color Blindness', asthma:'Asthma', smell_wyld:'Smell of the Wyld',
  one_eye:'One Eye', addiction:'Addiction', lame:'Lame', sickly:'Sickly', mute:'Mute',
  allergic:'Allergic', dark_secret:'Dark Secret', infamous_mentor:'Infamous Mentor',
  mistaken_identity:'Mistaken Identity', outsider:'Outsider', probationary:'Probationary Member',
  notoriety:'Notoriety', haunted:'Haunted', wanted:'Wanted', enemy:'Enemy',
  nightmares:'Nightmares', soft_hearted:'Soft-Hearted', compulsion:'Compulsion',
  amnesia:'Amnesia', short_fuse:'Short Fuse', phobia_mild:'Phobia (Mild)',
  flashbacks:'Flashbacks', absent_minded:'Absent-Minded', hatred:'Hatred',
  phobia_severe:'Phobia (Severe)', dark_fate:'Dark Fate', cursed:'Cursed',
  echoes:'Echoes', ward:'Ward', sphere_inept:'Sphere Inept', avatar_deficit:'Avatar Deficit',
};

// ── Background mapping ────────────────────────────────────────────────────────
const BG_OPTION_MAP = {
  allies:'Allies', alternateId:'Alternate Identity', arcane:'Arcane',
  avatar:'Avatar', backup:'Backup', blessing:'Blessing',
  certification:'Certification', chantry:'Chantry', contacts:'Contacts',
  cult:'Cult', demesne:'Demesne', destiny:'Destiny', dream:'Dream',
  enhancement:'Enhancement', fame:'Fame', familiar:'Familiar',
  influence:'Influence', legend:'Legend', library:'Library',
  mentor:'Mentor', node:'Node', pastLives:'Past Lives', patron:'Patron',
  rank:'Rank', requisitions:'Requisitions', resources:'Resources',
  retainers:'Retainers', sanctum:'Sanctum', secretWeapons:'Secret Weapons',
  spies:'Spies', status:'Status', totem:'Totem', wonder:'Wonder',
};

// ── Export route ──────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Character not found' });

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
    if (user.role !== 'admin' && row.user_id !== req.session.userId)
      return res.status(403).json({ error: 'Forbidden' });

    // Parse the flat row into a usable character object
    const c = parseRow(row);

    if (!fs.existsSync(TEMPLATE))
      return res.status(500).json({ error: 'PDF template not found on server' });

    const pdfDoc = await PDFDocument.load(fs.readFileSync(TEMPLATE), { ignoreEncryption: true });
    const form   = pdfDoc.getForm();

    // ── Identity ───────────────────────────────────────────────────────────
    setText  (form, 'Name',       c.name);
    setText  (form, 'Player',     c.player);
    setText  (form, 'Chronicle',  c.chronicle);
    setText  (form, 'concept',    c.concept);
    setDropdown(form, 'tradition', TRADITION_MAP[c.tradition] || c.tradition || '');
    setDropdown(form, 'nature',    c.nature);
    setDropdown(form, 'Demeanor',  c.demeanor);
    setDropdown(form, 'essence',   c.essence);

    // ── Attributes (direct integer columns) ───────────────────────────────
    ATTR_KEYS.forEach((key, i) => {
      setText  (form, `attrib${i + 1}`, ATTR_NAMES[i]);
      checkDots(form, ATTR_DOT_STARTS[i], c[key] || 1);
    });

    // ── Abilities (JSON object columns) ───────────────────────────────────
    const talents    = c.talents    || {};
    const skills     = c.skills     || {};
    const knowledges = c.knowledges || {};

    const rows = [
      ...selectAbilities(TALENTS,    talents,    10),
      ...selectAbilities(SKILLS,     skills,     10),
      ...selectAbilities(KNOWLEDGES, knowledges, 10),
    ];
    const sections = [
      ...selectAbilities(TALENTS,    talents,    10).map(() => talents),
      ...selectAbilities(SKILLS,     skills,     10).map(() => skills),
      ...selectAbilities(KNOWLEDGES, knowledges, 10).map(() => knowledges),
    ];

    rows.forEach((ab, i) => {
      setText  (form, `abilities${i + 1}`, ab.name);
      checkDots(form, abilityDotStart(i),  sections[i][ab.id] || 0);
    });

    // ── Spheres ────────────────────────────────────────────────────────────
    const spheres = c.spheres || {};
    SPHERES.forEach((sp, i) => {
      const label = sp.id === c.affinity_sphere ? `${sp.name} *` : sp.name;
      setText  (form, `spheres${i + 1}`, label);
      checkDots(form, sphereDotStart(i),  spheres[sp.id] || 0);
    });

    // ── Backgrounds ────────────────────────────────────────────────────────
    const backgrounds = c.backgrounds || {};
    Object.entries(backgrounds)
      .filter(([,v]) => v > 0)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 6)
      .forEach(([key, val], i) => {
        setDropdown(form, `backgrounds${i + 1}`, BG_OPTION_MAP[key] || key);
        checkDots  (form, BG_DOT_STARTS[i],      val);
      });

    // ── Merits & Flaws (stored as { id: cost } objects) ──────────────────────
    Object.entries(c.merits || {}).slice(0, 7).forEach(([id, cost], i) => {
      const name = MERIT_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      setDropdown(form, `Merit${i + 1}`, name);
      setDropdown(form, `cost${i + 1}`,  `${cost} pt.`);
    });
    Object.entries(c.flaws || {}).slice(0, 7).forEach(([id, cost], i) => {
      const name = FLAW_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      setDropdown(form, `flaw${i + 1}`,  name);
      setDropdown(form, `cost${i + 8}`,  `${cost} pt.`);
    });

    // ── Willpower ──────────────────────────────────────────────────────────
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`willdot${i}`);
        if (i <= (c.willpower || 3)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }

    // ── Arete / Quintessence / Paradox fields ──────────────────────────────
    setText(form, 'res1', String(c.arete        || 1));
    setText(form, 'res2', String(c.quintessence || 0));
    setText(form, 'res3', String(c.paradox      || 0));

    // Quintessence pool track (qpcheck1-10)
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`qpcheck${i}`);
        if (i <= (c.quintessence || 0)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }
    // Paradox track (qpcheck11-20)
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`qpcheck${i + 10}`);
        if (i <= (c.paradox || 0)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }

    // ── Notes / Description ────────────────────────────────────────────────
    if (c.notes) {
      c.notes.split('\n').filter(Boolean).slice(0, 15)
        .forEach((ln, i) => setText(form, `rotes${i + 1}`, ln));
    }
    if (c.description) {
      c.description.split('\n').filter(Boolean).slice(0, 22)
        .forEach((ln, i) => setText(form, `description${i + 1}`, ln));
    }

    // ── Send ───────────────────────────────────────────────────────────────
    const filled   = await pdfDoc.save();
    const safeName = (c.name || 'character').replace(/[^a-z0-9\-_. ]/gi, '_');
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName} - M20 Character Sheet.pdf"`,
      'Content-Length':      filled.length,
    });
    res.end(Buffer.from(filled));

  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Export failed: ' + err.message });
  }
});

module.exports = router;
