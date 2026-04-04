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
                     'merits','flaws','specialties','custom_ability_names'];

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

// Fill N dot checkboxes starting at `startDot` using the given prefix
function checkDots(form, startDot, value, count = 5, prefix = 'dot') {
  for (let i = 0; i < count; i++) {
    try {
      const cb = form.getCheckBox(`${prefix}${startDot + i}`);
      if (i < value) cb.check(); else cb.uncheck();
    } catch (_) {}
  }
}

// ── Layout constants (confirmed from PDF field enumeration) ──────────────────

// Attributes: dot1–dot72 (consecutive, 8 per row, 5 active + 3 padding)
const ATTR_DOT_STARTS = [1, 9, 17, 25, 33, 41, 49, 57, 65];

// Talents (11): 8 before backgrounds, then 3 after
const TALENT_DOT_STARTS    = [73, 81, 89, 97, 105, 113, 121, 129, 153, 161, 169];

// Skills (11): 5 before backgrounds, then 6 after
const SKILL_DOT_STARTS     = [177, 185, 193, 201, 209, 233, 241, 249, 257, 265, 273];

// Knowledges (11): 2 before backgrounds, then 9 after
const KNOWLEDGE_DOT_STARTS = [281, 289, 313, 321, 329, 337, 345, 353, 361, 369, 377];

// Backgrounds: interleaved between ability columns (2 per column)
const BG_DOT_STARTS        = [137, 145, 217, 225, 297, 305];

// Spheres: use 'sdot' prefix, 5 consecutive per sphere, starting at 1
const SPHERE_DOT_STARTS    = [1, 6, 11, 16, 21, 26, 31, 36, 41];

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
function selectAbilities(list, section, limit = 11) {
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

// ── PDF Export route ──────────────────────────────────────────────────────────
router.get('/pdf/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Character not found' });

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
    if (user.role !== 'admin' && row.user_id !== req.session.userId)
      return res.status(403).json({ error: 'Forbidden' });

    const c = parseRow(row);

    if (!fs.existsSync(TEMPLATE))
      return res.status(500).json({ error: 'PDF template not found on server' });

    const pdfDoc = await PDFDocument.load(fs.readFileSync(TEMPLATE), { ignoreEncryption: true });
    const form   = pdfDoc.getForm();

    // ── Identity ───────────────────────────────────────────────────────────
    setText(form, 'name',        c.name);
    setText(form, 'player',      c.player       || '');
    setText(form, 'chronicle',   c.chronicle     || '');
    setText(form, 'concept',     c.concept       || '');
    setText(form, 'affiliation', c.tradition     || '');
    setText(form, 'sect',        c.tradition     || '');
    setDropdown(form, 'tradition', TRADITION_MAP[c.tradition] || c.tradition || '');
    setDropdown(form, 'nature',    c.nature       || '');
    setDropdown(form, 'Demeanor',  c.demeanor     || '');
    setDropdown(form, 'essence',   c.essence      || '');

    // ── Attributes ────────────────────────────────────────────────────────
    ATTR_KEYS.forEach((key, i) => {
      setText  (form, `attributes${i + 1}`, ATTR_NAMES[i]);
      checkDots(form, ATTR_DOT_STARTS[i],   c[key] || 1);
    });

    // ── Abilities ─────────────────────────────────────────────────────────
    const talents    = c.talents    || {};
    const skills     = c.skills     || {};
    const knowledges = c.knowledges || {};

    selectAbilities(TALENTS, talents, 11).forEach((ab, i) => {
      const spec = (c.specialties || {})[ab.id];
      const label = spec ? `${ab.name} (${spec})` : ab.name;
      setText  (form, `skills${i + 1}`,         label);
      checkDots(form, TALENT_DOT_STARTS[i],      talents[ab.id] || 0);
    });

    selectAbilities(SKILLS, skills, 11).forEach((ab, i) => {
      const spec = (c.specialties || {})[ab.id];
      const label = spec ? `${ab.name} (${spec})` : ab.name;
      setText  (form, `skills${i + 12}`,         label);
      checkDots(form, SKILL_DOT_STARTS[i],        skills[ab.id] || 0);
    });

    selectAbilities(KNOWLEDGES, knowledges, 11).forEach((ab, i) => {
      const spec = (c.specialties || {})[ab.id];
      const label = spec ? `${ab.name} (${spec})` : ab.name;
      setText  (form, `skills${i + 23}`,          label);
      checkDots(form, KNOWLEDGE_DOT_STARTS[i],    knowledges[ab.id] || 0);
    });

    // ── Spheres ────────────────────────────────────────────────────────────
    const spheres = c.spheres || {};
    SPHERES.forEach((sp, i) => {
      const label = sp.id === c.affinity_sphere ? `${sp.name} *` : sp.name;
      setText  (form, `spheres${i + 1}`, label);
      checkDots(form, SPHERE_DOT_STARTS[i], spheres[sp.id] || 0, 5, 'sdot');
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

    // ── Merits & Flaws ────────────────────────────────────────────────────
    Object.entries(c.merits || {}).slice(0, 4).forEach(([id, cost], i) => {
      const name = MERIT_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      setDropdown(form, `Merit${i + 1}`, name);
      setDropdown(form, `cost${i + 1}`,  `${cost} pt.`);
      checkDots  (form, i * 5 + 1,       cost, 5, 'xdot');
    });
    Object.entries(c.flaws || {}).slice(0, 4).forEach(([id, cost], i) => {
      const name = FLAW_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      setDropdown(form, `flaw${i + 1}`,  name);
      setDropdown(form, `cost${i + 5}`,  `${cost} pt.`);
      checkDots  (form, i * 5 + 1,       cost, 5, 'xdotm');
    });

    // ── Willpower ──────────────────────────────────────────────────────────
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`willdot${i}`);
        if (i <= (c.willpower || 3)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }

    // ── Arete (bpdot1–bpdot10 checkboxes) ─────────────────────────────────
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`bpdot${i}`);
        if (i <= (c.arete || 1)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }

    // ── Quintessence pool (qpcheck1–10) ───────────────────────────────────
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`qpcheck${i}`);
        if (i <= (c.quintessence || 0)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }

    // ── Paradox track (qpcheck11–20) ──────────────────────────────────────
    for (let i = 1; i <= 10; i++) {
      try {
        const cb = form.getCheckBox(`qpcheck${i + 10}`);
        if (i <= (c.paradox || 0)) cb.check(); else cb.uncheck();
      } catch (_) {}
    }

    // ── Notes / Rotes ─────────────────────────────────────────────────────
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

// ── Foundry VTT Export route ──────────────────────────────────────────────────
router.get('/foundry/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Character not found' });

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
    if (user.role !== 'admin' && row.user_id !== req.session.userId)
      return res.status(403).json({ error: 'Forbidden' });

    const c = parseRow(row);

    const items = [];

    // ── Helper to create a minimal item id ────────────────────────────────
    const makeId = () => Math.random().toString(36).slice(2, 18).padEnd(16, '0');

    // ── Abilities (talent / skill / knowledge) ────────────────────────────
    const abilityTypeMap = {
      // Talents
      alertness:'wod.abilities.talent', art:'wod.abilities.talent',
      athletics:'wod.abilities.talent', awareness:'wod.abilities.talent',
      brawl:'wod.abilities.talent',     empathy:'wod.abilities.talent',
      expression:'wod.abilities.talent',intimidation:'wod.abilities.talent',
      leadership:'wod.abilities.talent',streetwise:'wod.abilities.talent',
      subterfuge:'wod.abilities.talent',
      // Skills
      crafts:'wod.abilities.skill',     drive:'wod.abilities.skill',
      etiquette:'wod.abilities.skill',  firearms:'wod.abilities.skill',
      martialArts:'wod.abilities.skill',meditation:'wod.abilities.skill',
      melee:'wod.abilities.skill',      research:'wod.abilities.skill',
      stealth:'wod.abilities.skill',    survival:'wod.abilities.skill',
      technology:'wod.abilities.skill',
      // Knowledges
      academics:'wod.abilities.knowledge',  computer:'wod.abilities.knowledge',
      cosmology:'wod.abilities.knowledge',  enigmas:'wod.abilities.knowledge',
      esoterica:'wod.abilities.knowledge',  investigation:'wod.abilities.knowledge',
      law:'wod.abilities.knowledge',        medicine:'wod.abilities.knowledge',
      occult:'wod.abilities.knowledge',     politics:'wod.abilities.knowledge',
      science:'wod.abilities.knowledge',
    };

    const allAbilities = [...TALENTS, ...SKILLS, ...KNOWLEDGES];
    const allSections  = [
      ...TALENTS.map(a    => ({ section: c.talents    || {}, a })),
      ...SKILLS.map(a     => ({ section: c.skills     || {}, a })),
      ...KNOWLEDGES.map(a => ({ section: c.knowledges || {}, a })),
    ];

    allSections.forEach(({ section, a }) => {
      const val  = section[a.id] || 0;
      const spec = (c.specialties || {})[a.id] || '';
      if (val === 0 && !spec) return; // skip zero-dot abilities with no specialty
      items.push({
        _id: makeId(),
        name: a.name,
        type: 'ability',
        system: {
          id:         a.id,
          reference:  `wod.abilities.${a.id.toLowerCase()}`,
          type:       abilityTypeMap[a.id] || 'wod.abilities.ability',
          label:      `wod.abilities.${a.id.toLowerCase()}`,
          value:      val,
          bonus:      0,
          total:      val,
          max:        5,
          speciality: spec,
          description: '',
          settings: {
            isvisible:       true,
            isfavorited:     false,
            alwaysspeciality:false,
            ismeleeweapon:   false,
            israngedeweapon: false,
            ispower:         false,
          },
        },
      });
    });

    // ── Spheres ────────────────────────────────────────────────────────────
    const spheres = c.spheres || {};
    SPHERES.forEach(sp => {
      const val = spheres[sp.id] || 0;
      if (val === 0 && sp.id !== c.affinity_sphere) return;
      items.push({
        _id: makeId(),
        name: sp.name,
        type: 'sphere',
        system: {
          id:         sp.id,
          reference:  `wod.spheres.${sp.id}`,
          label:      `wod.spheres.${sp.id}`,
          value:      val,
          max:        5,
          speciality: '',
          description: '',
          settings: {
            isvisible:     true,
            istechnocracy: false,
          },
        },
      });
    });

    // ── Backgrounds ────────────────────────────────────────────────────────
    const backgrounds = c.backgrounds || {};
    Object.entries(backgrounds).filter(([,v]) => v > 0).forEach(([key, val]) => {
      const displayName = BG_OPTION_MAP[key] || key.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({
        _id: makeId(),
        name: displayName,
        type: 'advantage',
        system: {
          id:        key,
          reference: `wod.advantages.backgrounds.${key.toLowerCase()}`,
          type:      'wod.advantages.backgrounds',
          group:     'backgrounds',
          label:     `wod.advantages.backgrounds.${key.toLowerCase()}`,
          permanent: val,
          temporary: 0,
          max:       5,
          description: '',
          settings: {
            isvisible:    true,
            usepermanent: true,
            usetemporary: false,
          },
        },
      });
    });

    // ── Willpower ──────────────────────────────────────────────────────────
    items.push({
      _id: makeId(),
      name: 'Willpower',
      type: 'advantage',
      system: {
        id:        'willpower',
        reference: 'wod.advantages.willpower',
        type:      'wod.advantages.willpower',
        group:     'virtues',
        label:     'wod.advantages.willpower',
        permanent: c.willpower || 3,
        temporary: c.willpower || 3,
        max:       10,
        description: '',
        settings: {
          isvisible:    true,
          usepermanent: true,
          usetemporary: true,
        },
      },
    });

    // ── Arete ──────────────────────────────────────────────────────────────
    items.push({
      _id: makeId(),
      name: 'Arete',
      type: 'advantage',
      system: {
        id:        'arete',
        reference: 'wod.advantages.arete',
        type:      'wod.advantages.mage',
        group:     'mage',
        label:     'wod.advantages.arete',
        permanent: c.arete || 1,
        temporary: 0,
        max:       10,
        description: '',
        settings: {
          isvisible:    true,
          usepermanent: true,
          usetemporary: false,
        },
      },
    });

    // ── Quintessence ───────────────────────────────────────────────────────
    if ((c.quintessence || 0) > 0) {
      items.push({
        _id: makeId(),
        name: 'Quintessence',
        type: 'advantage',
        system: {
          id:        'quintessence',
          reference: 'wod.advantages.quintessence',
          type:      'wod.advantages.mage',
          group:     'mage',
          label:     'wod.advantages.quintessence',
          permanent: c.quintessence || 0,
          temporary: c.quintessence || 0,
          max:       20,
          description: '',
          settings: {
            isvisible:    true,
            usepermanent: false,
            usetemporary: true,
          },
        },
      });
    }

    // ── Paradox ────────────────────────────────────────────────────────────
    if ((c.paradox || 0) > 0) {
      items.push({
        _id: makeId(),
        name: 'Paradox',
        type: 'advantage',
        system: {
          id:        'paradox',
          reference: 'wod.advantages.paradox',
          type:      'wod.advantages.mage',
          group:     'mage',
          label:     'wod.advantages.paradox',
          permanent: 0,
          temporary: c.paradox || 0,
          max:       20,
          description: '',
          settings: {
            isvisible:    true,
            usepermanent: false,
            usetemporary: true,
          },
        },
      });
    }

    // ── Merits & Flaws ────────────────────────────────────────────────────
    Object.entries(c.merits || {}).forEach(([id, cost]) => {
      const name = MERIT_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({
        _id: makeId(),
        name,
        type: 'advantage',
        system: {
          id, reference: `wod.merits.${id}`,
          type: 'wod.advantages.merits', group: 'merits', label: name,
          permanent: cost, temporary: 0, max: 5, description: '',
          settings: { isvisible: true, usepermanent: true, usetemporary: false },
        },
      });
    });
    Object.entries(c.flaws || {}).forEach(([id, cost]) => {
      const name = FLAW_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({
        _id: makeId(),
        name,
        type: 'advantage',
        system: {
          id, reference: `wod.flaws.${id}`,
          type: 'wod.advantages.flaws', group: 'flaws', label: name,
          permanent: cost, temporary: 0, max: 5, description: '',
          settings: { isvisible: true, usepermanent: true, usetemporary: false },
        },
      });
    });

    // ── Build actor document ───────────────────────────────────────────────
    const buildAttr = (key, type, sort) => ({
      value:       c[key] || 1,
      bonus:       0,
      total:       c[key] || 1,
      max:         5,
      type,
      label:       `wod.attributes.${key.toLowerCase()}`,
      speciality:  '',
      sort,
      isvisible:   true,
      isfavorited: false,
    });

    const actor = {
      name:  c.name || 'Unnamed Mage',
      type:  'mage',
      img:   'icons/svg/mystery-man.svg',
      system: {
        bio: {
          worldanvil: '',
          name:        c.name        || '',
          nature:      c.nature      || '',
          demeanor:    c.demeanor    || '',
          derangement: '',
          concept:     c.concept     || '',
          splatfields: {
            tradition:   c.tradition    || '',
            affiliation: c.tradition    || '',
            essence:     c.essence      || '',
            sect:        c.tradition    || '',
          },
          appearance:  c.description  || '',
          background:  '',
          notes:       c.notes        || '',
          roleplaytip: '',
        },
        attributes: {
          strength:     buildAttr('strength',     'physical', 1),
          dexterity:    buildAttr('dexterity',    'physical', 2),
          stamina:      buildAttr('stamina',       'physical', 3),
          charisma:     buildAttr('charisma',      'social',   4),
          manipulation: buildAttr('manipulation',  'social',   5),
          appearance:   buildAttr('appearance',    'social',   6),
          perception:   buildAttr('perception',    'mental',   8),
          intelligence: buildAttr('intelligence',  'mental',   9),
          wits:         buildAttr('wits',          'mental',  10),
        },
        soak: { bashing: 0, lethal: 0, aggravated: 0 },
        initiative: { base: 0, bonus: 0, total: 0 },
        conditions: { isignoringpain: false, isstunned: false, isfrenzy: false },
        movement: {
          walk:  { value: 7,  isactive: true },
          jog:   { value: 14, isactive: true },
          run:   { value: 21, isactive: true },
          fly:   { value: 0,  isactive: false },
          vjump: { value: 0,  isactive: true },
          hjump: { value: 0,  isactive: true },
        },
        gear: { notes: '', money: { carried: 0, bank: 0 } },
        favoriterolls: [],
      },
      items,
    };

    const safeName = (c.name || 'character').replace(/[^a-z0-9\-_. ]/gi, '_');
    const json     = JSON.stringify(actor, null, 2);
    res.set({
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="${safeName} - Foundry Actor.json"`,
      'Content-Length':      Buffer.byteLength(json),
    });
    res.end(json);

  } catch (err) {
    console.error('Foundry export error:', err);
    res.status(500).json({ error: 'Export failed: ' + err.message });
  }
});

// ── Legacy route compatibility (old /:id maps to PDF) ────────────────────────
router.get('/:id', (req, res) => {
  res.redirect(307, `/api/export/pdf/${req.params.id}`);
});

module.exports = router;
