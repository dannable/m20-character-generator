// M20 dice resolution (Chapter Eight, Mage: The Ascension 20th Anniversary Edition).
// Pure functions: no database, no Express. The rng is injectable so tests can
// feed the book's own examples.
const crypto = require('crypto');

// Dice-pool penalty by number of damaged health levels (Bruised..Crippled).
// Bruised 0, Hurt -1, Injured -1, Wounded -2, Mauled -2, Crippled -5.
const WOUND_PENALTY = [0, 0, -1, -1, -2, -2, -5, -5];
function woundPenalty(damagedLevels) {
  const n = Math.max(0, Math.min(7, Math.floor(damagedLevels) || 0));
  return WOUND_PENALTY[n];
}

const DEGREES = ['Failure', 'Marginal', 'Moderate', 'Complete', 'Exceptional', 'Phenomenal'];
const degreeLabel = n => DEGREES[Math.max(0, Math.min(5, n))];

const d10 = () => crypto.randomInt(1, 11);

// opts: { pool, difficulty = 6, specialty = false, willpower = false, threshold = 0, rng = d10 }
function roll(opts = {}) {
  const pool = Math.max(0, Math.min(50, Math.floor(Number(opts.pool) || 0)));
  const difficulty = Math.max(2, Math.min(10, Math.floor(Number(opts.difficulty) || 6)));
  const threshold = Math.max(0, Math.min(10, Math.floor(Number(opts.threshold) || 0)));
  const specialty = !!opts.specialty, willpower = !!opts.willpower;
  const rng = opts.rng || d10;

  const dice = [];
  for (let i = 0; i < pool; i++) dice.push(rng());

  let rolled = 0, ones = 0, tens = 0;
  for (const d of dice) {
    if (d === 1) ones++;
    // A 10 is always a success, whatever the difficulty
    if (d >= difficulty || d === 10) {
      rolled += (d === 10 && specialty) ? 2 : 1;
      if (d === 10) tens++;
    }
  }
  const hadSuccess = rolled > 0;
  // Each 1 cancels one rolled success. A Willpower success cannot be cancelled.
  const afterOnes = Math.max(0, rolled - ones) + (willpower ? 1 : 0);
  // A threshold of N removes N successes (the book applies it before the 1s; the
  // arithmetic is the same because both only ever subtract from the total).
  const successes = Math.max(0, afterOnes - threshold);
  const botch = !hadSuccess && ones > 0 && !willpower;
  const outcome = botch ? 'botch' : successes > 0 ? 'success' : 'failure';
  return {
    pool, difficulty, specialty, willpower, threshold, dice,
    rolled, ones, tens, successes, outcome,
    degree: outcome === 'success' ? degreeLabel(successes) : outcome === 'botch' ? 'Botch' : 'Failure',
  };
}

module.exports = { roll, woundPenalty, degreeLabel, WOUND_PENALTY };
