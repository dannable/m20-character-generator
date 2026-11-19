// Free Build — a build mode layered over the existing character types.
//
// Mirrors server/nephandi.js: one normaliser that the write paths call, so the
// two columns can never disagree with each other or with the rest of the row.
//
// The mode deliberately turns off the rules engine for the character (see
// routes/characters.js), because "no restrictions" is the entire point. It is
// recorded on the character rather than inferred, so a sheet always says how it
// was built — a Storyteller looking at a 400 XP mage should not have to guess.
'use strict';
const path = require('path');
const BuildXP = require(path.join(__dirname, '..', 'public', 'js', 'build-xp.js'));

const COLUMNS = ['build_mode', 'build_freebies'];

function isFreeBuild(c) {
  return !!c && c.build_mode === 'free';
}

/**
 * Settle the two columns on a merged character row, in place.
 * Anything other than the literal 'free' means the normal creator, and then the
 * freebie flag is meaningless and is put back to its default rather than left
 * carrying a stale value from a mode the character is no longer in.
 */
function normalizeCharacterFreeBuild(c) {
  if (!c || typeof c !== 'object') return c;
  if (c.build_mode === undefined && c.build_freebies === undefined) return c;  // untouched by this write

  if (c.build_mode !== 'free') {
    c.build_mode = '';
    c.build_freebies = 1;
    return c;
  }
  c.build_mode = 'free';
  c.build_freebies = (c.build_freebies === 0 || c.build_freebies === '0' || c.build_freebies === false) ? 0 : 1;
  return c;
}

/** What the character cost, priced at advancement rates. Null when not a Free Build. */
function buildXp(c) {
  if (!isFreeBuild(c)) return null;
  return BuildXP.compute(c, { freebies: c.build_freebies !== 0 });
}

module.exports = { COLUMNS, isFreeBuild, normalizeCharacterFreeBuild, buildXp, BuildXP };
