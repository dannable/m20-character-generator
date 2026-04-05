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
  // Dots arranged in a circle; start = 9 o'clock, clockwise
  const WHEEL = (cx, cy, r, val, max, dotR = 3) => {
    for (let i = 0; i < max; i++) {
      const angle = Math.PI - (i / max) * 2 * Math.PI;
      CIRC(cx + r * Math.cos(angle), cy + r * Math.sin(angle), dotR, i < val);
    }
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
  const banner = 'MAGE: THE ASCENSION  --  20th Anniversary Edition  --  Character Record';
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

  const TOP_Y = iy - 2;   // top of banded section
  let y = TOP_Y;

  // Full-width section header helper
  const SH_full = (yy, lbl) => {
    FR(ML - 5, yy - 1, W - (ML - 5) * 2, 12, ink.dark);
    T(lbl.toUpperCase(), ML - 2, yy + 1.5, 7.5, fB, ink.white);
    return yy - 14;
  };

  /* ══════════════════════════════════════════════════════════════════════════
     BAND 1  —  ATTRIBUTES
  ══════════════════════════════════════════════════════════════════════════ */
  y = SH_full(y, 'Attributes');
  let y1 = y, y2 = y, y3 = y;

  [
    { col: C1, lbl: 'Physical', keys: ['strength','dexterity','stamina'],       names: ['Strength','Dexterity','Stamina'] },
    { col: C2, lbl: 'Social',   keys: ['charisma','manipulation','appearance'],  names: ['Charisma','Manipulation','Appearance'] },
    { col: C3, lbl: 'Mental',   keys: ['perception','intelligence','wits'],      names: ['Perception','Intelligence','Wits'] },
  ].forEach((g, gi) => {
    let yc = y;
    yc = GH(g.col, yc, CW, g.lbl);
    g.keys.forEach((k, i) => { yc = TR(g.col, yc, CW, g.names[i], c[k] || 1); });
    if (gi === 0) y1 = yc;
    else if (gi === 1) y2 = yc;
    else y3 = yc;
  });
  y = Math.min(y1, y2, y3) - 4;

  /* ══════════════════════════════════════════════════════════════════════════
     BAND 2  —  ABILITIES
  ══════════════════════════════════════════════════════════════════════════ */
  y = SH_full(y, 'Abilities');
  y1 = y; y2 = y; y3 = y;

  const custNames = c.custom_ability_names || {};

  const drawAbilGrp = (col, yy, grpLbl, base, sect) => {
    yy = GH(col, yy, CW, grpLbl);
    base.forEach(ab => {
      const spec  = (c.specialties || {})[ab.id];
      const label = spec ? `${ab.name} (${spec})` : ab.name;
      yy = TR(col, yy, CW, label, sect[ab.id] || 0);
    });
    Object.entries(sect).forEach(([id, val]) => {
      if (base.find(a => a.id === id)) return;
      const name  = custNames[id] || id;
      const spec  = (c.specialties || {})[id];
      const label = spec ? `${name} (${spec})` : name;
      yy = TR(col, yy, CW, label, val || 0);
    });
    return yy;
  };

  y1 = drawAbilGrp(C1, y1, 'Talents',    TALENTS,    c.talents    || {});
  y2 = drawAbilGrp(C2, y2, 'Skills',     SKILLS,     c.skills     || {});
  y3 = drawAbilGrp(C3, y3, 'Knowledges', KNOWLEDGES, c.knowledges || {});
  y = Math.min(y1, y2, y3) - 4;

  /* ══════════════════════════════════════════════════════════════════════════
     BAND 3  —  SPHERES
  ══════════════════════════════════════════════════════════════════════════ */
  y = SH_full(y, 'Spheres');
  y1 = y; y2 = y; y3 = y;

  const sph = c.spheres || {};
  const affMark = (id) => id === c.affinity_sphere ? ' *' : '';

  // Col 1: Correspondence, Entropy, Forces
  [['Correspondence','correspondence'],['Entropy','entropy'],['Forces','forces']].forEach(([name, id]) => {
    y1 = TR(C1, y1, CW, name + affMark(id), sph[id] || 0);
  });

  // Col 2: Life, Matter, Mind
  [['Life','life'],['Matter','matter'],['Mind','mind']].forEach(([name, id]) => {
    y2 = TR(C2, y2, CW, name + affMark(id), sph[id] || 0);
  });

  // Col 3: Prime, Spirit, Time
  [['Prime','prime'],['Spirit','spirit'],['Time','time']].forEach(([name, id]) => {
    y3 = TR(C3, y3, CW, name + affMark(id), sph[id] || 0);
  });

  y = Math.min(y1, y2, y3) - 4;

  /* ══════════════════════════════════════════════════════════════════════════
     BAND 4  —  ADVANTAGES / CORE STATS
  ══════════════════════════════════════════════════════════════════════════ */
  y = SH_full(y, 'Advantages');
  y1 = y; y2 = y; y3 = y;

  /* ── C1: Backgrounds + Merits + Flaws + Magical Focus ── */
  y1 = GH(C1, y1, CW, 'Backgrounds');
  const bgs = Object.entries(c.backgrounds || {}).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  if (!bgs.length) { T('None selected', C1 + 2, y1 + 2, 6.5, fI, ink.dim); y1 -= RH; }
  else { bgs.forEach(([k, v]) => { const nm = BG_OPTION_MAP[k] || k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase()); y1 = TR(C1, y1, CW, nm, v); }); }

  const merits = Object.entries(c.merits || {});
  if (merits.length) {
    y1 -= 2; y1 = GH(C1, y1, CW, 'Merits');
    merits.forEach(([id, cost]) => {
      const nm = MERIT_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      y1 = TR(C1, y1, CW, `${nm} (${cost})`, cost, 5);
    });
  }

  const flaws = Object.entries(c.flaws || {});
  if (flaws.length) {
    y1 -= 2; y1 = GH(C1, y1, CW, 'Flaws');
    flaws.forEach(([id, cost]) => {
      const nm = FLAW_NAMES[id] || id.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
      y1 = TR(C1, y1, CW, `${nm} (${cost})`, cost, 5);
    });
  }

  y1 -= 4; y1 = GH(C1, y1, CW, 'Magical Focus');
  T('Paradigm:', C1 + 2, y1, 6.5, fB, ink.mid); y1 -= 9;
  const pLines = wrapText(c.paradigm || '', CW - 5, fI, 6.5, 3);
  if (pLines.length) { pLines.forEach(l => { T(l, C1 + 3, y1, 6.5, fI, ink.black); y1 -= 8; }); }
  else { HL(C1 + 2, y1 + 2, CW - 4, 0.3, ink.rule); y1 -= 8; }
  y1 -= 3;
  T('Practice:', C1 + 2, y1, 6.5, fB, ink.mid);
  T(fit(c.practice || '', CW - 55, fR, 7), C1 + 54, y1, 7, fR, ink.black);
  HL(C1 + 54, y1 - 1.5, CW - 56, 0.3, ink.rule);
  y1 -= 12; y1 -= 3;
  T('Instruments:', C1 + 2, y1, 6.5, fB, ink.mid); y1 -= 9;
  const instrArr = Array.isArray(c.instruments) ? c.instruments : [];
  const iLines = wrapText(instrArr.join(', '), CW - 5, fR, 6.5, 5);
  if (iLines.length) { iLines.forEach(l => { T(l, C1 + 3, y1, 6.5, fR, ink.black); y1 -= 8; }); }
  else { T('None selected', C1 + 3, y1, 6.5, fI, ink.dim); y1 -= 8; }

  /* ── C2: Arete + Willpower + Q/P Wheel (vertically stacked) ── */
  {
    const dotsR = 4, dotsSp = 16;
    const dotsMax = 10;
    const dotsW = (dotsMax - 1) * dotsSp + 2 * dotsR;  // 9×16+8 = 152 pts
    const dotsX = C2 + (CW - dotsW) / 2;

    // Arete
    const arLbl = 'Arete';
    T(arLbl, C2 + (CW - fB.widthOfTextAtSize(arLbl, 7)) / 2, y2, 7, fB, ink.mid);
    y2 -= 14;
    DOTS(dotsX, y2, Math.min(c.arete || 1, dotsMax), dotsMax, dotsR, dotsSp);
    y2 -= 14;

    // Willpower
    const wpLbl = 'Willpower';
    T(wpLbl, C2 + (CW - fB.widthOfTextAtSize(wpLbl, 7)) / 2, y2, 7, fB, ink.mid);
    y2 -= 14;
    DOTS(dotsX, y2, c.willpower || 5, dotsMax, dotsR, dotsSp);
    // Spent boxes aligned under each dot
    y2 -= 10;
    T('Spent:', C2 + 2, y2, 5.5, fB, ink.dim);
    for (let i = 0; i < dotsMax; i++) {
      SQR(dotsX + i * dotsSp + dotsR - 4.5, y2 - 10, 9);
    }
    y2 -= 22;

    // Q/P Wheel — label above, wheel, label below
    const qVal = c.quintessence || 0;
    const pVal = c.paradox || 0;
    const wMax = 20, wR = 22, wDotR = 2.8;
    const wCx = C2 + Math.round(CW / 2);

    const qLbl = `Quintessence: ${qVal}`;
    T(qLbl, C2 + (CW - fR.widthOfTextAtSize(qLbl, 6.5)) / 2, y2, 6.5, fB, ink.mid);
    y2 -= 8;

    const wCy = y2 - wR - wDotR - 2;
    for (let i = 0; i < wMax; i++) {
      const angle = Math.PI - (i / wMax) * 2 * Math.PI;
      const dx = wCx + wR * Math.cos(angle);
      const dy = wCy + wR * Math.sin(angle);
      if (i === 0) { CIRC(dx, dy, wDotR * 1.4, true); }
      else {
        CIRC(dx, dy, wDotR, i <= qVal || (pVal > 0 && i >= wMax - pVal));
      }
    }
    y2 = wCy - wR - wDotR - 6;

    const pLbl = `Paradox: ${pVal}`;
    T(pLbl, C2 + (CW - fR.widthOfTextAtSize(pLbl, 6.5)) / 2, y2, 6.5, fB, ink.mid);
    y2 -= 8;
  }

  /* ── C3: Health track ── */
  {
    const hLbl = 'Health';
    T(hLbl, C3 + (CW - fB.widthOfTextAtSize(hLbl, 7)) / 2, y3, 7, fB, ink.mid);
    y3 -= 12;
    const boxX = C3 + CW - 12;
    [['Bruised',''],['Hurt','-1'],['Injured','-1'],['Wounded','-2'],
     ['Mauled','-2'],['Crippled','-5'],['Incapacitated','']].forEach(([name, pen]) => {
      T(name, C3 + 2, y3 + 2, 6, fR, ink.black);
      if (pen) {
        const pw = fB.widthOfTextAtSize(pen, 6.5);
        T(pen, boxX - pw - 5, y3 + 1.5, 6.5, fB, ink.dark);
      }
      SQR(boxX, y3 + 0.5, 8);
      HL(C3, y3, CW, 0.3, ink.rule);
      y3 -= RH;
    });
  }

  y = Math.min(y1, y2, y3) - 4;

  /* ══════════════════════════════════════════════════════════════════════════
     BOTTOM SECTION  —  NOTES / ROTES  +  DESCRIPTION / BACKGROUND
  ══════════════════════════════════════════════════════════════════════════ */
  const BOT_MARGIN = 26;
  const botSep     = y - 8;

  if (botSep > BOT_MARGIN + 30) {
    HL(ML - 5, botSep, W - (ML - 5) * 2, 1, ink.dark);
    const HW = Math.floor((W - ML * 2 - 8) / 2);

    // Left: Notes / Rotes
    let bL = botSep - 2;
    bL = SH(ML, bL, HW, 'Notes / Rotes');
    const nLines = wrapText(c.notes || '', HW - 5, fR, 7, 18);
    if (nLines.length) { nLines.forEach(l => { T(l, ML + 2, bL, 7, fR, ink.black); bL -= 9; }); }
    else { T('--', ML + 2, bL, 7, fI, ink.dim); }

    // Right: Description / Background
    const DX = ML + HW + 8;
    let bR = botSep - 2;
    bR = SH(DX, bR, HW, 'Description / Background');
    const dLines = wrapText(c.description || '', HW - 5, fR, 7, 18);
    if (dLines.length) { dLines.forEach(l => { T(l, DX + 2, bR, 7, fR, ink.black); bR -= 9; }); }
    else { T('--', DX + 2, bR, 7, fI, ink.dim); }
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
