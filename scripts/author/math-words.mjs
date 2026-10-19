// Writes data/practice/math-words.json: Math Vocabulary questions about the five multiplication properties
// (20 multiple choice, 20 true or false, 20 fill in the blank). Original questions. Every key is checked again by
// validateMathWords (js/lib/activities.js): properties are worked out from each equation's own numbers, and every
// definition is the property's own line from js/lib/mathlearn.js. Development only. Run: node scripts/author/math-words.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMathWords } from '../../js/lib/activities.js';
import { PROPERTIES } from '../../js/lib/mathlearn.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BY = Object.fromEntries(PROPERTIES.map((p) => [p.key, p]));
const NAME = (k) => BY[k].name;
const SHORT = (k) => BY[k].name.replace(' Property', '');
const DEF = (k) => BY[k].kid;
const KEYS = ['identity', 'zero', 'commutative', 'associative', 'distributive'];
const q = (s) => `"${s}"`;

/** Why an equation shows its property (used in Show me how and the results review). */
const BECAUSE = {
  identity: (eq) => `One factor is 1, and the number stays the same: ${eq}.`,
  zero: (eq) => `One factor is 0, so the product is 0: ${eq}.`,
  commutative: (eq) => `The same two factors are on both sides in a different order: ${eq}.`,
  associative: (eq) => `The same three factors stay in the same order. Only the ( ) move: ${eq}.`,
  distributive: (eq) => `A factor is broken apart into two easier facts that are added: ${eq}.`,
};
const SPOT = {
  identity: 'Look for a factor of 1.',
  zero: 'Look for a factor of 0.',
  commutative: 'Look for the same two factors in a different order.',
  associative: 'Look for three factors in the same order with ( ) that move.',
  distributive: 'Look for a + sign: a factor broken apart into two facts.',
};
const HINT_EQ = 'Look for a 1, a 0, a turn-around, ( ) that move, or a + sign.';
const rot = (list, n) => list.map((_, k) => list[(k + n) % list.length]);
/** Four choices: the right one and three others, in a fixed spread so the right answer is not always first. */
function four(right, others, n) {
  const opts = [right, ...others.slice(0, 3)];
  return rot(opts, n % 4);
}

// ---------------------------------------------------------------- Multiple Choice (20)
const choice = [];
// 1-5: which property does this equation show?
const MC_EQ = [['identity', '1 × 7 = 7'], ['zero', '0 × 5 = 0'], ['commutative', '6 × 2 = 2 × 6'], ['associative', '(3 × 2) × 4 = 3 × (2 × 4)'], ['distributive', '5 × 7 = (5 × 5) + (5 × 2)']];
MC_EQ.forEach(([k, eq], n) => {
  const others = KEYS.filter((x) => x !== k);
  choice.push({
    id: `wc${n + 1}`, type: 'choice', kind: 'eq', prop: k, eq,
    prompt: `Which property does ${eq} show?`,
    options: four({ text: NAME(k), correct: true }, rot(others, n).map((o) => ({ text: NAME(o), why: `${NAME(o)}: ${DEF(o)}` })), n),
    hints: [HINT_EQ, SPOT[k]], show: [BECAUSE[k](eq), `So it shows the ${NAME(k)}.`],
    yes: `Yes! ${eq} shows the ${NAME(k)}.`, explain: `${BECAUSE[k](eq)} That is the ${NAME(k)}.`,
  });
});
// 6-10: what does the property mean?
KEYS.forEach((k, n) => {
  const others = KEYS.filter((x) => x !== k);
  choice.push({
    id: `wc${n + 6}`, type: 'choice', kind: 'meaning', prop: k,
    prompt: `What does the ${NAME(k)} mean?`,
    options: four({ text: DEF(k), correct: true }, rot(others, n + 1).map((o) => ({ text: DEF(o), why: `That is the ${NAME(o)}.` })), n + 1),
    hints: [`Think of an example: ${BY[k].eq}.`], show: [`${NAME(k)}: ${DEF(k)}`, `Example: ${BY[k].eq}.`],
    yes: `Yes! ${NAME(k)}: ${DEF(k)}`, explain: `${NAME(k)}: ${DEF(k)}`,
  });
});
// 11-15: which property says this?
KEYS.forEach((k, n) => {
  const others = KEYS.filter((x) => x !== k);
  choice.push({
    id: `wc${n + 11}`, type: 'choice', kind: 'name', prop: k,
    prompt: `Which property says: ${q(DEF(k))}`,
    options: four({ text: NAME(k), correct: true }, rot(others, n + 2).map((o) => ({ text: NAME(o), why: `${NAME(o)}: ${DEF(o)}` })), n + 2),
    hints: [`Which property matches an example like ${BY[k].eq}?`], show: [`${DEF(k)}`, `That is the ${NAME(k)}. Example: ${BY[k].eq}.`],
    yes: `Yes! That is the ${NAME(k)}.`, explain: `${NAME(k)}: ${DEF(k)}`,
  });
});
// 16-20: which equation shows the property? (each wrong equation shows a different property)
const SAMPLE = {
  identity: ['9 × 1 = 9', '1 × 4 = 4'], zero: ['0 × 3 = 0', '8 × 0 = 0'], commutative: ['5 × 8 = 8 × 5', '2 × 9 = 9 × 2'],
  associative: ['(2 × 5) × 3 = 2 × (5 × 3)', '4 × (3 × 2) = (4 × 3) × 2'], distributive: ['6 × 4 = (5 × 4) + (1 × 4)', '8 × 3 = (4 × 3) + (4 × 3)'],
};
KEYS.forEach((k, n) => {
  // The turn-around and the grouping are the two that get mixed up, so each of them is a wrong choice for the other.
  const pick = k === 'commutative' ? ['associative', 'identity', 'distributive'] : k === 'associative' ? ['commutative', 'zero', 'distributive'] : KEYS.filter((x) => x !== k).slice(0, 3);
  const right = SAMPLE[k][1];
  choice.push({
    id: `wc${n + 16}`, type: 'choice', kind: 'which-eq', prop: k,
    prompt: `Which equation shows the ${NAME(k)}?`,
    options: four({ text: right, correct: true }, pick.map((o) => ({ text: SAMPLE[o][0], why: `${SAMPLE[o][0]} shows the ${NAME(o)}.` })), n + 3),
    hints: [SPOT[k]], show: [BECAUSE[k](right), `So ${right} shows the ${NAME(k)}.`],
    yes: `Yes! ${right} shows the ${NAME(k)}.`, explain: BECAUSE[k](right),
  });
});

// ---------------------------------------------------------------- True or False (20, 10 true and 10 false)
const truefalse = [];
const tfEq = [
  ['commutative', '4 × 7 = 7 × 4', 'commutative'], ['associative', '(2 × 4) × 5 = 2 × (4 × 5)', 'associative'],
  ['identity', '3 × 1 = 3', 'identity'], ['zero', '0 × 9 = 0', 'zero'], ['distributive', '7 × 3 = (5 × 3) + (2 × 3)', 'distributive'],
  // False: the statement names the wrong property (Commutative and Associative mix-ups first).
  ['commutative', '(5 × 2) × 4 = 5 × (2 × 4)', 'associative'], ['associative', '8 × 3 = 3 × 8', 'commutative'],
  ['zero', '6 × 1 = 6', 'identity'], ['identity', '7 × 0 = 0', 'zero'], ['commutative', '9 × 4 = (5 × 4) + (4 × 4)', 'distributive'],
];
tfEq.forEach(([said, eq, real], n) => {
  const truth = said === real;
  truefalse.push({
    id: `wt${n + 1}`, type: 'choice', kind: 'tf-eq', prop: real, said, eq, truth,
    prompt: `True or false? ${eq} shows the ${NAME(said)}.`,
    options: [truth ? { text: 'True', correct: true } : { text: 'True', why: `It is false. ${BECAUSE[real](eq)} That is the ${NAME(real)}.` },
      truth ? { text: 'False', why: `It is true. ${BECAUSE[real](eq)}` } : { text: 'False', correct: true }],
    hints: [HINT_EQ, SPOT[said]], show: [BECAUSE[real](eq), truth ? `So it is true.` : `That is the ${NAME(real)}, so it is false.`],
    yes: truth ? `Yes, it is true. ${BECAUSE[real](eq)}` : `Yes, it is false. ${eq} shows the ${NAME(real)}.`,
    explain: `${truth ? 'True' : 'False'}. ${eq} shows the ${NAME(real)}.`,
  });
});
const tfDef = [
  ['identity', 'identity'], ['zero', 'zero'], ['commutative', 'commutative'], ['associative', 'associative'], ['distributive', 'distributive'],
  ['commutative', 'associative'], ['associative', 'commutative'], ['identity', 'zero'], ['zero', 'identity'], ['distributive', 'commutative'],
];
tfDef.forEach(([said, real], n) => {
  const truth = said === real;
  truefalse.push({
    id: `wt${n + 11}`, type: 'choice', kind: 'tf-def', prop: said, said, defOf: real, truth,
    prompt: `True or false? The ${NAME(said)} says: ${q(DEF(real))}`,
    options: [truth ? { text: 'True', correct: true } : { text: 'True', why: `It is false. That is the ${NAME(real)}. The ${NAME(said)} says: ${DEF(said)}` },
      truth ? { text: 'False', why: `It is true. Example: ${BY[said].eq}.` } : { text: 'False', correct: true }],
    hints: [`Think of an example of the ${NAME(said)}: ${BY[said].eq}.`], show: [`${NAME(said)}: ${DEF(said)}`, truth ? 'So it is true.' : `The sentence describes the ${NAME(real)}, so it is false.`],
    yes: truth ? `Yes, it is true. ${NAME(said)}: ${DEF(said)}` : `Yes, it is false. That sentence is the ${NAME(real)}.`,
    explain: `${truth ? 'True' : 'False'}. ${NAME(said)}: ${DEF(said)}`,
  });
});

// ---------------------------------------------------------------- Fill in the Blank (20)
const fill = [];
const BANK = KEYS.map((k) => SHORT(k).toLowerCase());
const fillEq = [
  ['identity', '8 × 1 = 8'], ['zero', '0 × 4 = 0'], ['commutative', '3 × 9 = 9 × 3'], ['associative', '(4 × 2) × 3 = 4 × (2 × 3)'], ['distributive', '6 × 8 = (5 × 8) + (1 × 8)'],
  ['identity', '1 × 12 = 12'], ['zero', '10 × 0 = 0'], ['commutative', '7 × 5 = 5 × 7'], ['associative', '2 × (2 × 5) = (2 × 2) × 5'], ['distributive', '4 × 9 = (4 × 5) + (4 × 4)'],
];
fillEq.forEach(([k, eq], n) => {
  fill.push({
    id: `wf${n + 1}`, type: 'word', kind: 'fill-eq', prop: k, eq,
    prompt: `${eq} shows the ___ Property.`, answer: SHORT(k).toLowerCase(), accept: [`${SHORT(k).toLowerCase()} property`],
    bank: BANK, hints: [HINT_EQ, SPOT[k]], show: [BECAUSE[k](eq), `So the word is ${q(SHORT(k))}.`],
    retry: 'Look at the equation again. Which word from the word bank fits?',
    yes: `Yes! ${eq} shows the ${NAME(k)}.`, explain: `${BECAUSE[k](eq)} That is the ${NAME(k)}.`,
  });
});
// Sentences that describe a property in other words (no property name in them).
const SENT = {
  identity: ['Any number multiplied by 1 stays the same. This is the ___ Property.', 'A friend says 15 × 1 is still 15. She is using the ___ Property.'],
  zero: ['Any number multiplied by 0 equals 0. This is the ___ Property.', 'Five empty boxes hold 0 crayons, because 5 × 0 = 0. That is the ___ Property.'],
  commutative: ['Changing the order of the factors does not change the product. This is the ___ Property.', 'Turning an array of 2 rows of 6 into 6 rows of 2 shows the ___ Property.'],
  associative: ['Changing the grouping of three or more factors does not change the product. This is the ___ Property.', 'Moving the ( ) in 2 × 3 × 4 without changing the order uses the ___ Property.'],
  distributive: ['Breaking apart a factor and adding the two products uses the ___ Property.', 'Cutting an array into two smaller arrays and adding them uses the ___ Property.'],
};
KEYS.forEach((k, n) => SENT[k].forEach((s, j) => {
  fill.push({
    id: `wf${11 + n * 2 + j}`, type: 'word', kind: 'fill-def', prop: k,
    prompt: s, answer: SHORT(k).toLowerCase(), accept: [`${SHORT(k).toLowerCase()} property`],
    bank: BANK, hints: [`Which property has an example like ${BY[k].eq}?`], show: [`${NAME(k)}: ${DEF(k)}`, `So the word is ${q(SHORT(k))}.`],
    retry: 'Read the sentence again. Which word from the word bank fits?',
    yes: `Yes! ${NAME(k)}.`, explain: `${NAME(k)}: ${DEF(k)}`,
  });
}));

const bank = {
  topic: 'The five multiplication properties',
  note: 'Study Scoop Math Vocabulary questions (original). Definitions match Learn the Properties.',
  choice, truefalse, fill,
};
const problems = validateMathWords(bank);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'data/practice/math-words.json'), `${JSON.stringify(bank, null, 2)}\n`);
console.log(`choice ${choice.length}, truefalse ${truefalse.length} (${truefalse.filter((t) => t.truth).length} true), fill ${fill.length}`);
