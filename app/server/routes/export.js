'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/* ── Field parsing ──────────────────────────────────────────────────────────── */
const JSON_FIELDS = ['talents','skills','knowledges','backgrounds','spheres',
  'instruments','freebie_spent','attr_priority','ability_priority',
  'merits','flaws','specialties','custom_ability_names'];

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

/* ── Static lookup data ─────────────────────────────────────────────────────── */
const TALENTS = [
  {id:'alertness',name:'Alertness'},{id:'art',name:'Art'},
  {id:'athletics',name:'Athletics'},{id:'awareness',name:'Awareness'},
  {id:'brawl',name:'Brawl'},{id:'empathy',name:'Empathy'},
  {id:'expression',name:'Expression'},{id:'intimidation',name:'Intimidation'},
  {id:'leadership',name:'Leadership'},{id:'streetwise',name:'Streetwise'},
  {id:'subterfuge',name:'Subterfuge'},
];
const SKILLS = [
  {id:'crafts',name:'Crafts'},{id:'drive',name:'Drive'},
  {id:'etiquette',name:'Etiquette'},{id:'firearms',name:'Firearms'},
  {id:'martialArts',name:'Martial Arts'},{id:'meditation',name:'Meditation'},
  {id:'melee',name:'Melee'},{id:'research',name:'Research'},
  {id:'stealth',name:'Stealth'},{id:'survival',name:'Survival'},
  {id:'technology',name:'Technology'},
];
const KNOWLEDGES = [
  {id:'academics',name:'Academics'},{id:'computer',name:'Computer'},
  {id:'cosmology',name:'Cosmology'},{id:'enigmas',name:'Enigmas'},
  {id:'esoterica',name:'Esoterica'},{id:'investigation',name:'Investigation'},
  {id:'law',name:'Law'},{id:'medicine',name:'Medicine'},
  {id:'occult',name:'Occult'},{id:'politics',name:'Politics'},
  {id:'science',name:'Science'},
];
const SPHERES = [
  {id:'correspondence',name:'Correspondence'},{id:'entropy',name:'Entropy'},
  {id:'forces',name:'Forces'},{id:'life',name:'Life'},
  {id:'matter',name:'Matter'},{id:'mind',name:'Mind'},
  {id:'prime',name:'Prime'},{id:'spirit',name:'Spirit'},
  {id:'time',name:'Time'},
];
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

/* ── Text wrapping helper ───────────────────────────────────────────────────── */
function wrapText(text, maxW, font, sz, maxLines = 20) {
  if (!text) return [];
  const out = [];
  for (const para of String(text).split(/\r?\n/)) {
    if (out.length >= maxLines) break;
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let cur = '';
    for (const w of words) {
      if (out.length >= maxLines) break;
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, sz) > maxW && cur) {
        out.push(cur); cur = w;
      } else { cur = test; }
    }
    if (cur && out.length < maxLines) out.push(cur);
  }
  return out;
}

/* ── Custom PDF builder ─────────────────────────────────────────────────────── */
async function buildCharacterPDF(c) {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const W = 612, H = 792;

  const fR = await doc.embedFont(StandardFonts.Helvetica);
  const fB = await doc.embedFont(StandardFonts.HelveticaBold);
  const fI = await doc.embedFont(StandardFonts.HelveticaOblique);

  const ink = {
    black: rgb(0, 0, 0),
    dark:  rgb(0.08, 0.08, 0.08),
    mid:   rgb(0.30, 0.30, 0.30),
    dim:   rgb(0.55, 0.55, 0.55),
    rule:  rgb(0.72, 0.72, 0.72),
    lite:  rgb(0.91, 0.91, 0.91),
    white: rgb(1, 1, 1),
  };

  /* ── Drawing primitives ──────────────────────────────────────────────────── */
  const T = (s, x, y, sz, f = fR, col = ink.black) => {
    if (s == null || s === '') return;
    try { page.drawText(String(s), { x, y, size: sz, font: f, color: col }); } catch (_) {}
  };
  const HL = (x, y, w, t = 0.5, col = ink.black) =>
    page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: t, color: col });
  const VL = (x, y, h, t = 0.5, col = ink.black) =>
    page.drawLine({ start: { x, y }, end: { x, y: y + h }, thickness: t, color: col });
  const FR = (x, y, w, h, col = ink.dark) =>
    page.drawRectangle({ x, y, width: w, height: h, color: col });
  const SR = (x, y, w, h, col = ink.dark, t = 1) =>
    page.drawRectangle({ x, y, width: w, height: h, borderColor: col, borderWidth: t });
  const CIRC = (cx, cy, r, filled) =>
    page.drawCircle({ x: cx, y: cy, size: r,
      color: filled ? ink.dark : undefined,
      borderColor: ink.dark, borderWidth: 0.5 });
  const DOTS = (x, y, val, max = 5, r = 2.5, sp = 7) => {
    for (let i = 0; i < max; i++) CIRC(x + i * sp + r, y + r, r, i < val);
  };
  const SQR = (x, y, sz = 7) =>
    page.drawRectangle({ x, y, width: sz, height: sz, borderColor: ink.dark, borderWidth: 0.5 });

  // Truncate string to fit within maxW pts
  const fit = (s, maxW, f, sz) => {
    if (!s) return '';
    let out = String(s);
    while (out.length > 1 && f.widthOfTextAtSize(out, sz) > maxW) out = out.slice(0, -1);
    return out.length < String(s).length ? out.slice(0, -1) + '\u2026' : out;
  };

  /* ── Layout helpers ──────────────────────────────────────────────────────── */
  const RH = 11;  // standard row height (pts)

  // Dark section header bar → returns y of next row
  const SH = (x, y, w, lbl) => {
    FR(x, y - 1, w, 12, ink.dark);
    T(lbl.toUpperCase(), x + 3, y + 1.5, 7.5, fB, ink.white);
    return y - 14;
  };

  // Light group subheader → returns y of next row
  const GH = (x, y, w, lbl) => {
    FR(x, y - 1, w, 10, ink.lite);
    const lw = fB.widthOfTextAtSize(lbl, 7);
    T(lbl.toUpperCase(), x + (w - lw) / 2, y + 0.5, 7, fB, ink.mid);
    return y - 12;
  };

  // Trait row: name left + 5-dot track right → returns y of next row
  const TR = (x, y, w, lbl, val, max = 5, r = 2.5, sp = 7) => {
    const dotsW = (max - 1) * sp + 2 * r;
    T(fit(lbl, w - dotsW - 8, fR, 7), x + 2, y + 2.5, 7, fR, ink.black);
    DOTS(x + w - dotsW - 2, y + 2, val, max, r, sp);
    HL(x, y, w, 0.3, ink.rule);
    return y - RH;
  };

  // Identity field (label: value with underline) — inline, no return
  const IF = (lbl, val, x, y, availW) => {
    const lw = fB.widthOfTextAtSize(lbl + ':', 6.5) + 2;
    T(lbl + ':', x, y, 6.5, fB, ink.mid);
    T(fit(val || '', availW - lw - 1, fR, 7.5), x + lw, y, 7.5, fR, ink.black);
    HL(x + lw - 1, y - 1.5, availW - lw + 1, 0.3, ink.rule);
  };

  /* ── Column geometry ─────────────────────────────────────────────────────── */
  const ML = 28;
  const CW = Math.floor((W - ML * 2 - 16) / 3);  // ≈ 180 pts per column
  const C1 = ML;
  const C2 = ML + CW + 8;
  const C3 = ML + (CW + 8) * 2;

  /* ══════════════════════════════════════════════════════════════════════════
     TITLE BANNER
  ══════════════════════════════════════════════════════════════════════════ */
  FR(ML - 5, H - 39, W - (ML - 5) * 2, 28, ink.dark);
  const banner = 'MAGE: THE ASCENSION  \u2014  20th Anniversary Edition  \u2014  Character Record';
  const bw = fB.widthOfTextAtSize(banner, 9.5);
  T(banner, (W - bw) / 2, H - 30, 9.5, fB, ink.white);

  /* ══════════════════════════════════════════════════════════════════════════
     IDENTITY FIELDS  (3 rows beneath banner)
  ══════════════════════════════════════════════════════════════════════════ */
  let iy = H - 48;
  IF('Name',        c.name,                          C1,       iy, 195);
  IF('Player',      c.player,                        C2,       iy, CW);
  IF('Chronicle',   c.chronicle,                     C3,       iy, CW);
  iy -= 13;
  IF('Concept',     c.concept,                       C1,       iy, 190);
  IF('Tradition',   c.tradition,                     C2,       iy, CW);
  IF('Essence',     c.essence,                       C3,       iy, CW);
  iy -= 13;
  IF('Nature',      c.nature,                        C1,       iy, 105);
  IF('Demeanor',    c.demeanor,                      C1 + 112, iy, CW - 14);
  IF('Affiliation', c.affiliation || c.tradition,    C3,       iy, CW);
  iy -= 11;
  HL(ML - 5, iy + 2, W - (ML - 5) * 2, 1.2, ink.dark);

  const TOP_Y = iy - 2;   // top of three-column section

  /* ══════════════════════════════════════════════════════════════════════════
     COLUMN 1  —  ATTRIBUTES  /  FOCUS  /  HEALTH
  ══════════════════════════════════════════════════════════════════════════ */
  let y1 = TOP_Y;

  /* ── Attributes ── */
  y1 = SH(C1, y1, CW, 'Attributes');
  [
    { lbl: 'Physical', keys: ['strength',   'dexterity', 'stamina'    ], names: ['Strength',   'Dexterity', 'Stamina'    ] },
    { lbl: 'Social',   keys: ['charisma',   'manipulation','appearance'], names: ['Charisma',   'Manipulation','Appearance'] },
    { lbl: 'Mental',   keys: ['perception', 'intelligence','wits'      ], names: ['Perception', 'Intelligence','Wits'      ] },
  ].forEach(g => {
    y1 = GH(C1, y1, CW, g.lbl);
    g.keys.forEach((k, i) => { y1 = TR(C1, y1, CW, g.names[i], c[k] || 1); });
  });

  y1 -= 6;

  /* ── Focus & Practice ── */
  y1 = SH(C1, y1, CW, 'Focus & Practice');

  T('Paradigm:', C1 + 2, y1, 6.5, fB, ink.mid);
  y1 -= 9;
  const pLines = wrapText(c.paradigm || '', CW - 5, fI, 6.5, 3);
  if (pLines.length) { pLines.forEach(l => { T(l, C1 + 3, y1, 6.5, fI, ink.black); y1 -= 8; }); }
  else { HL(C1 + 2, y1 + 2, CW - 4, 0.3, ink.rule); y1 -= 8; }

  y1 -= 3;
  T('Practice:', C1 + 2, y1, 6.5, fB, ink.mid);
  T(fit(c.practice || '', CW - 55, fR, 7), C1 + 54, y1, 7, fR, ink.black);
  HL(C1 + 54, y1 - 1.5, CW - 56, 0.3, ink.rule);
  y1 -= 12;

  y1 -= 3;
  T('Instruments:', C1 + 2, y1, 6.5, fB, ink.mid);
  y1 -= 9;
  const instrArr = Array.isArray(c.instruments) ? c.instruments : [];
  const iLines   = wrapText(instrArr.join(', '), CW - 5, fR, 6.5, 5);
  if (iLines.length) { iLines.forEach(l => { T(l, C1 + 3, y1, 6.5, fR, ink.black); y1 -= 8; }); }
  else { T('None selected', C1 + 3, y1, 6.5, fI, ink.dim); y1 -= 8; }

  y1 -= 6;

  /* ── Health ── */
  y1 = SH(C1, y1, CW, 'Health');
  // B / L / A column labels above the checkboxes
  T('B', C1 + CW - 24, y1 + 1.5, 5.5, fB, ink.dim);
  T('L', C1 + CW - 15, y1 + 1.5, 5.5, fB, ink.dim);
  T('A', C1 + CW - 6,  y1 + 1.5, 5.5, fB, ink.dim);
  y1 -= 10;
  ['Bruised (+0)', 'Hurt (\u22121)', 'Injured (\u22121)', 'Wounded (\u22122)',
   'Mauled (\u22122)', 'Crippled (\u22125)', 'Incapacitated'].forEach(lbl => {
    T(lbl, C1 + 2, y1 + 2, 6.5, fR, ink.black);
    SQR(C1 + CW - 26, y1 + 0.5, 7);
    SQR(C1 + CW - 17, y1 + 0.5, 7);
    SQR(C1 + CW - 8,  y1 + 0.5, 7);
    HL(C1, y1, CW, 0.3, ink.rule);
    y1 -= RH;
  });

  /* ══════════════════════════════════════════════════════════════════════════
     COLUMN 2  —  ABILITIES  (Talents / Skills / Knowledges)
  ══════════════════════════════════════════════════════════════════════════ */
  let y2 = TOP_Y;
  y2 = SH(C2, y2, CW, 'Abilities');

  const custNames = c.custom_ability_names || {};

  const drawAbilGrp = (y, grpLbl, base, sect) => {
    y = GH(C2, y, CW, grpLbl);
    // Standard abilities
    base.forEach(ab => {
      const spec  = (c.specialties || {})[ab.id];
      const label = spec ? `${ab.name} (${spec})` : ab.name;
      y = TR(C2, y, CW, label, sect[ab.id] || 0);
    });
    // Any custom abilities that belong to this section
    Object.entries(sect).forEach(([id, val]) => {
      if (base.find(a => a.id === id)) return;
      const name  = custNames[id] || id;
      const spec  = (c.specialties || {})[id];
      const label = spec ? `${name} (${spec})` : name;
      y = TR(C2, y, CW, label, val || 0);
    });
    return y;
  };

  y2 = drawAbilGrp(y2, 'Talents',    TALENTS,    c.talents    || {});
  y2 = drawAbilGrp(y2, 'Skills',     SKILLS,     c.skills     || {});
  y2 = drawAbilGrp(y2, 'Knowledges', KNOWLEDGES, c.knowledges || {});

  /* ══════════════════════════════════════════════════════════════════════════
     COLUMN 3  —  ADVANTAGES
     (Spheres / Backgrounds / Willpower / Arete / Quintessence / Paradox /
      Merits / Flaws)
  ══════════════════════════════════════════════════════════════════════════ */
  let y3 = TOP_Y;
  y3 = SH(C3, y3, CW, 'Advantages');

  /* Spheres */
  y3 = GH(C3, y3, CW, 'Spheres');
  const sph = c.spheres || {};
  SPHERES.forEach(sp => {
    const lbl = sp.id === c.affinity_sphere ? `${sp.name} *` : sp.name;
    y3 = TR(C3, y3, CW, lbl, sph[sp.id] || 0);
  });
  y3 -= 4;

  /* Backgrounds */
  y3 = GH(C3, y3, CW, 'Backgrounds');
  const bgs = Object.entries(c.backgrounds || {}).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  if (!bgs.length) {
    T('None selected', C3 + 2, y3 + 2, 6.5, fI, ink.dim);
    y3 -= RH;
  } else {
    bgs.forEach(([k, v]) => {
      const nm = BG_OPTION_MAP[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      y3 = TR(C3, y3, CW, nm, v);
    });
  }
  y3 -= 4;

  /* Willpower (10-dot track) */
  y3 = GH(C3, y3, CW, 'Willpower');
  DOTS(C3 + 4, y3 + 2, c.willpower || 3, 10, 4, 16);
  y3 -= 18;

  /* Arete (10-dot track) */
  y3 = GH(C3, y3, CW, 'Arete');
  DOTS(C3 + 4, y3 + 2, c.arete || 1, 10, 4, 16);
  y3 -= 18;

  /* Quintessence + Paradox */
  y3 = GH(C3, y3, CW, 'Quintessence / Paradox');
  T('Quintessence', C3 + 2, y3 + 1.5, 6, fR, ink.mid);
  y3 -= 9;
  DOTS(C3 + 4, y3 + 2, c.quintessence || 0, 10, 3, 11);
  y3 -= 13;
  HL(C3, y3, CW, 0.3, ink.rule);
  T('Paradox', C3 + 2, y3 + 1.5, 6, fR, ink.mid);
  y3 -= 9;
  DOTS(C3 + 4, y3 + 2, c.paradox || 0, 10, 3, 11);
  y3 -= 13;
  y3 -= 4;

  /* Merits */
  const merits = Object.entries(c.merits || {});
  if (merits.length) {
    y3 = GH(C3, y3, CW, 'Merits');
    merits.forEach(([id, cost]) => {
      const nm = MERIT_NAMES[id] || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      y3 = TR(C3, y3, CW, `${nm} (${cost})`, cost, 5);
    });
  }

  /* Flaws */
  const flaws = Object.entries(c.flaws || {});
  if (flaws.length) {
    y3 = GH(C3, y3, CW, 'Flaws');
    flaws.forEach(([id, cost]) => {
      const nm = FLAW_NAMES[id] || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      y3 = TR(C3, y3, CW, `${nm} (${cost})`, cost, 5);
    });
  }

  /* ── Column separator rules ──────────────────────────────────────────────── */
  const colBot = Math.min(y1, y2, y3) - 6;
  VL(C2 - 4, colBot, TOP_Y - colBot, 0.5, ink.rule);
  VL(C3 - 4, colBot, TOP_Y - colBot, 0.5, ink.rule);

  /* ══════════════════════════════════════════════════════════════════════════
     BOTTOM SECTION  —  NOTES / ROTES  +  DESCRIPTION / BACKGROUND
  ══════════════════════════════════════════════════════════════════════════ */
  const BOT_MARGIN = 26;
  const botSep     = colBot - 8;

  if (botSep > BOT_MARGIN + 30) {
    HL(ML - 5, botSep, W - (ML - 5) * 2, 1, ink.dark);
    const HW = Math.floor((W - ML * 2 - 8) / 2);

    // Left: Notes / Rotes
    let bL = botSep - 2;
    bL = SH(ML, bL, HW, 'Notes / Rotes');
    const nLines = wrapText(c.notes || '', HW - 5, fR, 7, 18);
    if (nLines.length) { nLines.forEach(l => { T(l, ML + 2, bL, 7, fR, ink.black); bL -= 9; }); }
    else { T('\u2014', ML + 2, bL, 7, fI, ink.dim); }

    // Right: Description / Background
    const DX = ML + HW + 8;
    let bR = botSep - 2;
    bR = SH(DX, bR, HW, 'Description / Background');
    const dLines = wrapText(c.description || '', HW - 5, fR, 7, 18);
    if (dLines.length) { dLines.forEach(l => { T(l, DX + 2, bR, 7, fR, ink.black); bR -= 9; }); }
    else { T('\u2014', DX + 2, bR, 7, fI, ink.dim); }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PAGE BORDER
  ══════════════════════════════════════════════════════════════════════════ */
  SR(ML - 5, BOT_MARGIN - 2, W - (ML - 5) * 2, H - (BOT_MARGIN - 2) - 11, ink.dark, 1.25);

  return await doc.save();
}

/* ── Auth guard helper ──────────────────────────────────────────────────────── */
function checkAccess(req, res, row) {
  if (!req.session.userId) { res.status(401).json({ error: 'Not authenticated' }); return false; }
  if (!row)                { res.status(404).json({ error: 'Character not found' }); return false; }
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user.role !== 'admin' && row.user_id !== req.session.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

/* ══════════════════════════════════════════════════════════════════════════════
   PDF EXPORT ROUTE
══════════════════════════════════════════════════════════════════════════════ */
router.get('/pdf/:id', async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!checkAccess(req, res, row)) return;

    const c        = parseRow(row);
    const pdfBytes = await buildCharacterPDF(c);
    const safeName = (c.name || 'character').replace(/[^a-z0-9\-_. ]/gi, '_');

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName} - M20 Character Sheet.pdf"`,
      'Content-Length':      pdfBytes.length,
    });
    res.end(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Export failed: ' + err.message });
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   FOUNDRY VTT EXPORT ROUTE
══════════════════════════════════════════════════════════════════════════════ */
router.get('/foundry/:id', async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!checkAccess(req, res, row)) return;

    const c     = parseRow(row);
    const items = [];
    const makeId = () => Math.random().toString(36).slice(2, 18).padEnd(16, '0');

    /* Abilities */
    const abilityTypeMap = {
      alertness:'wod.abilities.talent', art:'wod.abilities.talent',
      athletics:'wod.abilities.talent', awareness:'wod.abilities.talent',
      brawl:'wod.abilities.talent',     empathy:'wod.abilities.talent',
      expression:'wod.abilities.talent',intimidation:'wod.abilities.talent',
      leadership:'wod.abilities.talent',streetwise:'wod.abilities.talent',
      subterfuge:'wod.abilities.talent',
      crafts:'wod.abilities.skill',     drive:'wod.abilities.skill',
      etiquette:'wod.abilities.skill',  firearms:'wod.abilities.skill',
      martialArts:'wod.abilities.skill',meditation:'wod.abilities.skill',
      melee:'wod.abilities.skill',      research:'wod.abilities.skill',
      stealth:'wod.abilities.skill',    survival:'wod.abilities.skill',
      technology:'wod.abilities.skill',
      academics:'wod.abilities.knowledge',  computer:'wod.abilities.knowledge',
      cosmology:'wod.abilities.knowledge',  enigmas:'wod.abilities.knowledge',
      esoterica:'wod.abilities.knowledge',  investigation:'wod.abilities.knowledge',
      law:'wod.abilities.knowledge',        medicine:'wod.abilities.knowledge',
      occult:'wod.abilities.knowledge',     politics:'wod.abilities.knowledge',
      science:'wod.abilities.knowledge',
    };

    [
      ...TALENTS.map(a    => ({ section: c.talents    || {}, a })),
      ...SKILLS.map(a     => ({ section: c.skills     || {}, a })),
      ...KNOWLEDGES.map(a => ({ section: c.knowledges || {}, a })),
    ].forEach(({ section, a }) => {
      const val  = section[a.id] || 0;
      const spec = (c.specialties || {})[a.id] || '';
      if (val === 0 && !spec) return;
      items.push({
        _id: makeId(), name: a.name, type: 'ability',
        system: {
          id: a.id, reference: `wod.abilities.${a.id.toLowerCase()}`,
          type: abilityTypeMap[a.id] || 'wod.abilities.ability',
          label: `wod.abilities.${a.id.toLowerCase()}`,
          value: val, bonus: 0, total: val, max: 5, speciality: spec,
          description: '',
          settings: { isvisible:true, isfavorited:false, alwaysspeciality:false,
                      ismeleeweapon:false, israngedeweapon:false, ispower:false },
        },
      });
    });

    /* Spheres */
    const spheres = c.spheres || {};
    SPHERES.forEach(sp => {
      const val = spheres[sp.id] || 0;
      if (val === 0 && sp.id !== c.affinity_sphere) return;
      items.push({
        _id: makeId(), name: sp.name, type: 'sphere',
        system: {
          id: sp.id, reference: `wod.spheres.${sp.id}`,
          label: `wod.spheres.${sp.id}`,
          value: val, max: 5, speciality: '', description: '',
          settings: { isvisible:true, istechnocracy:false },
        },
      });
    });

    /* Backgrounds */
    Object.entries(c.backgrounds || {}).filter(([, v]) => v > 0).forEach(([key, val]) => {
      const displayName = BG_OPTION_MAP[key] || key.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({
        _id: makeId(), name: displayName, type: 'advantage',
        system: {
          id: key, reference: `wod.advantages.backgrounds.${key.toLowerCase()}`,
          type: 'wod.advantages.backgrounds', group: 'backgrounds',
          label: `wod.advantages.backgrounds.${key.toLowerCase()}`,
          permanent: val, temporary: 0, max: 5, description: '',
          settings: { isvisible:true, usepermanent:true, usetemporary:false },
        },
      });
    });

    /* Willpower / Arete / Quintessence / Paradox */
    const advItems = [
      { name:'Willpower', id:'willpower', group:'virtues', perm:c.willpower||3, temp:c.willpower||3, max:10, usetemp:true },
      { name:'Arete',     id:'arete',     group:'mage',    perm:c.arete||1,     temp:0,              max:10, usetemp:false },
    ];
    if ((c.quintessence||0) > 0) advItems.push({ name:'Quintessence', id:'quintessence', group:'mage', perm:c.quintessence, temp:c.quintessence, max:20, usetemp:true });
    if ((c.paradox||0) > 0)      advItems.push({ name:'Paradox',      id:'paradox',      group:'mage', perm:0,              temp:c.paradox,      max:20, usetemp:true });
    advItems.forEach(a => {
      items.push({
        _id: makeId(), name: a.name, type: 'advantage',
        system: {
          id: a.id, reference: `wod.advantages.${a.id}`,
          type: `wod.advantages.${a.group === 'mage' ? 'mage' : a.id}`, group: a.group,
          label: `wod.advantages.${a.id}`,
          permanent: a.perm, temporary: a.temp, max: a.max, description: '',
          settings: { isvisible:true, usepermanent:true, usetemporary: a.usetemp },
        },
      });
    });

    /* Merits & Flaws */
    Object.entries(c.merits || {}).forEach(([id, cost]) => {
      const name = MERIT_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({ _id:makeId(), name, type:'advantage', system: {
        id, reference:`wod.merits.${id}`, type:'wod.advantages.merits', group:'merits', label:name,
        permanent:cost, temporary:0, max:5, description:'',
        settings:{ isvisible:true, usepermanent:true, usetemporary:false },
      }});
    });
    Object.entries(c.flaws || {}).forEach(([id, cost]) => {
      const name = FLAW_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({ _id:makeId(), name, type:'advantage', system: {
        id, reference:`wod.flaws.${id}`, type:'wod.advantages.flaws', group:'flaws', label:name,
        permanent:cost, temporary:0, max:5, description:'',
        settings:{ isvisible:true, usepermanent:true, usetemporary:false },
      }});
    });

    /* Actor document */
    const buildAttr = (key, type, sort) => ({
      value:c[key]||1, bonus:0, total:c[key]||1, max:5,
      type, label:`wod.attributes.${key.toLowerCase()}`,
      speciality:'', sort, isvisible:true, isfavorited:false,
    });
    const actor = {
      name: c.name || 'Unnamed Mage', type: 'mage',
      img:  'icons/svg/mystery-man.svg',
      system: {
        bio: {
          worldanvil:'', name:c.name||'', nature:c.nature||'', demeanor:c.demeanor||'',
          derangement:'', concept:c.concept||'',
          splatfields:{ tradition:c.tradition||'', affiliation:c.tradition||'',
                        essence:c.essence||'', sect:c.tradition||'' },
          appearance:c.description||'', background:'', notes:c.notes||'', roleplaytip:'',
        },
        attributes: {
          strength:    buildAttr('strength',    'physical', 1),
          dexterity:   buildAttr('dexterity',   'physical', 2),
          stamina:     buildAttr('stamina',     'physical', 3),
          charisma:    buildAttr('charisma',    'social',   4),
          manipulation:buildAttr('manipulation','social',   5),
          appearance:  buildAttr('appearance',  'social',   6),
          perception:  buildAttr('perception',  'mental',   8),
          intelligence:buildAttr('intelligence','mental',   9),
          wits:        buildAttr('wits',        'mental',  10),
        },
        soak:{ bashing:0, lethal:0, aggravated:0 },
        initiative:{ base:0, bonus:0, total:0 },
        conditions:{ isignoringpain:false, isstunned:false, isfrenzy:false },
        movement:{
          walk:{value:7,isactive:true}, jog:{value:14,isactive:true},
          run:{value:21,isactive:true}, fly:{value:0,isactive:false},
          vjump:{value:0,isactive:true}, hjump:{value:0,isactive:true},
        },
        gear:{ notes:'', money:{ carried:0, bank:0 } },
        favoriterolls:[],
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

/* ── Legacy route (old /:id → pdf) ─────────────────────────────────────────── */
router.get('/:id', (req, res) => res.redirect(307, `/api/export/pdf/${req.params.id}`));

module.exports = router;
