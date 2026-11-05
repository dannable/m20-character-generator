// Unit tests for server/dice.js, including the book's worked example. Usage: node tools/dice-test.js app
const path = require('path');
const { roll, woundPenalty } = require(path.resolve(process.argv[2], 'server/dice.js'));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const seq = a => { let i = 0; return () => a[i++]; };
const r = (dice, o = {}) => roll({ pool: dice.length, rng: seq(dice), ...o });
// Book, Chapter Eight (p. 388): 2,4,8,9,3,6,6 at difficulty 8 = two successes
let x = r([2, 4, 8, 9, 3, 6, 6], { difficulty: 8 });
ok(x.successes === 2 && x.outcome === 'success', 'book example: Charisma+Animal Kinship diff 8 gives 2 successes');
x = r([6, 6, 3]); ok(x.successes === 2 && x.degree === 'Moderate', 'default difficulty is 6, 2 successes is Moderate');
x = r([2, 3, 4]); ok(x.outcome === 'failure' && x.successes === 0, 'no successes, no ones = failure');
x = r([2, 1, 4]); ok(x.outcome === 'botch', 'no successes with a 1 = botch');
x = r([7, 1, 3]); ok(x.successes === 0 && x.outcome === 'failure', 'a 1 cancels a success; a success was rolled so it is a failure, not a botch');
x = r([8, 9, 1]); ok(x.successes === 1, 'one 1 removes one of two successes');
x = r([1, 1, 7]); ok(x.successes === 0 && x.outcome === 'failure', 'ones cannot go below zero successes');
x = r([10, 3], { difficulty: 10 }); ok(x.successes === 1, '10 succeeds at difficulty 10');
x = r([10, 3], { difficulty: 2 }); ok(x.successes === 2, 'difficulty 2: both the 3 and the 10 succeed');
x = r([10, 5], { difficulty: 6, specialty: true }); ok(x.successes === 2 && x.tens === 1, 'specialty: a 10 counts double');
x = r([6, 5], { difficulty: 6, specialty: true }); ok(x.successes === 1, 'specialty does not double non-10s');
x = r([10, 1], { specialty: true }); ok(x.successes === 1, 'specialty 10 (2) minus a 1 = 1');
x = r([2, 3], { willpower: true }); ok(x.successes === 1 && x.outcome === 'success', 'Willpower gives one automatic success');
x = r([1, 1, 2], { willpower: true }); ok(x.successes === 1 && x.outcome === 'success', 'Willpower success cannot be cancelled and prevents a botch');
x = r([8, 1], { willpower: true }); ok(x.successes === 1, 'Willpower: rolled success cancelled by the 1, auto success remains');
x = r([9, 9, 9, 9], { difficulty: 7, threshold: 3 }); ok(x.successes === 1, 'threshold 3: four successes leave one');
x = r([9, 9, 9], { difficulty: 7, threshold: 3 }); ok(x.successes === 0 && x.outcome === 'failure', 'threshold 3: three successes fail');
x = r([9, 9, 9, 9, 1], { difficulty: 7, threshold: 3 }); ok(x.successes === 0, 'threshold then a 1: 4 successes, threshold 3, one 1 = 0');
x = roll({ pool: 0, rng: () => 5 }); ok(x.dice.length === 0 && x.outcome === 'failure', 'empty pool fails');
x = roll({ pool: 0, willpower: true }); ok(x.successes === 1, 'empty pool with Willpower still gets the automatic success');
ok(roll({ pool: 99 }).dice.length === 50, 'pool is capped at 50');
ok(roll({ pool: 3, difficulty: 99 }).difficulty === 10 && roll({ pool: 3, difficulty: 0 }).difficulty === 6 && roll({ pool: 3, difficulty: 1 }).difficulty === 2, 'difficulty is clamped to 2..10 (0 or junk falls back to 6)');
const woundExpect = [[0, 0], [1, 0], [2, -1], [3, -1], [4, -2], [5, -2], [6, -5]];
woundExpect.forEach(([n, p]) => ok(woundPenalty(n) === p, `wound penalty with ${n} damaged level(s) = ${p}`));
// statistical sanity with the real rng: mean successes at diff 6 for 10 dice is ~ 10*(0.5) - 10*(0.1) = 4
let tot = 0; for (let i = 0; i < 4000; i++) tot += roll({ pool: 10 }).successes; const mean = tot / 4000;
ok(mean > 3.7 && mean < 4.3, 'real rng mean successes for 10 dice at diff 6 is about 4: ' + mean.toFixed(2));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
