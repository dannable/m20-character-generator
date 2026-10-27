// Server-side entry to the shared character validator (public/js/validate-character.js).
//
// RULES_ENFORCE: unset/0 → violations are logged and returned to the client as
// `violations` but never block a save (the first-release default).
//              1 → a non-draft save (create, update, finalize, edit-request)
//                  with errors is rejected with 400 { error, violations }.
// Admins and the chronicle's Storyteller may pass `override: true` to save anyway;
// overrides and violations are written to the server log.
'use strict';
const path = require('path');
const db   = require('./db');
const CharValidator = require(path.join(__dirname, '..', 'public', 'js', 'validate-character.js'));

const ENFORCE = /^(1|true|yes)$/i.test(String(process.env.RULES_ENFORCE || ''));

const JSON_COLS = ['talents','skills','knowledges','backgrounds','spheres','merits','flaws','tenets','practice_ratings','practice_specialties'];
function parsed(row) {
  const c = { ...row };
  JSON_COLS.forEach(k => { if (typeof c[k] === 'string') { try { c[k] = JSON.parse(c[k]); } catch { c[k] = {}; } } });
  return c;
}
function chronicleRules(chronicleId) {
  if (!chronicleId) return {};
  const row = db.prepare('SELECT rules FROM chronicles WHERE id = ?').get(chronicleId);
  try { return JSON.parse(row?.rules || '{}') || {}; } catch { return {}; }
}

/**
 * Validate a character (merged row + incoming changes) against its chronicle.
 * @param {object} merged   full character object as it would be after the write
 * @param {number|null} chronicleId
 * @param {object} opts     { creation: bool }
 * @returns {{errors:[], warnings:[], enforce:boolean}}
 */
function check(merged, chronicleId, opts = {}) {
  const rules = chronicleRules(chronicleId);
  const res = CharValidator.validate(parsed(merged), rules, { creation: !!opts.creation });
  return { ...res, enforce: ENFORCE };
}

/** Validate every member of a chronicle; returns [{ id, name, errors, warnings }] for members with findings. */
function checkChronicleMembers(chronicleId) {
  const rules = chronicleRules(chronicleId);
  const rows = db.prepare('SELECT * FROM characters WHERE chronicle_id = ?').all(chronicleId);
  return rows.map(row => {
    const r = CharValidator.validate(parsed(row), rules, { creation: !!row.is_draft });
    return { id: row.id, name: row.name, is_draft: !!row.is_draft, errors: r.errors, warnings: r.warnings };
  }).filter(x => x.errors.length || x.warnings.length);
}

/**
 * Decide whether a write may proceed. Returns null to allow, or a response body to reject with 400.
 * Logs violations either way.
 */
function gate(req, result, { characterName, isDraft, canOverride }) {
  if (!result.errors.length && !result.warnings.length) return null;
  const who = req.session?.userId;
  console.log(`[rules] ${isDraft ? 'draft' : 'character'} "${characterName}" by user ${who}: ${result.errors.length} error(s), ${result.warnings.length} warning(s)` +
    (result.errors.length ? ' — ' + result.errors.map(e => e.message).join('; ') : ''));
  if (!ENFORCE || isDraft || !result.errors.length) return null;
  if (canOverride && req.body?.override === true) {
    console.log(`[rules] override by user ${who} on "${characterName}"`);
    return null;
  }
  return { error: 'Character does not satisfy the Chronicle\'s creation rules', violations: result };
}

module.exports = { check, checkChronicleMembers, gate, ENFORCE };
