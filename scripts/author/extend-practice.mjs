// Brings each Math > Practice Problems kind up to 20 original questions (data/practice/math.json) and adds the
// Associative Property. Idempotent: questions it adds are replaced on a re-run; the earlier questions are kept.
// Every answer key is checked again by validateMathPractice (the property from the equation's numbers, every split
// option against its picture, every "break apart" option against the factor named). Development only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMathPractice } from '../../js/lib/activities.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = path.join(ROOT, 'data/practice/math.json');
const F = (a, b) => `${a} × ${b}`;
const P = (a, b) => `(${a} × ${b})`;

// ---------------------------------------------------------------- Identify the Property
const WHY = {
  Identity: 'The Identity Property is about multiplying by 1.',
  Zero: 'The Zero Property is about multiplying by 0.',
  Commutative: 'The Commutative Property changes the order of two factors.',
  Associative: 'The Associative Property changes the grouping, the ( ), of three factors.',
  Distributive: 'The Distributive Property breaks a fact into two easier facts and adds them.',
};
// For an Associative equation, the turn-around choice gets a sharper reason (the order does not change there).
const WHY_ASSOC = { Commutative: 'The Commutative Property changes the order of the factors. Here the order stays the same: only the ( ) move.' };
const HINTS = ['Look for a 1, a 0, a turn-around, ( ) that move, or a + sign.'];

function prop(id, eq, name, others, second, show, prompt) {
  const options = [name, ...others].map((n) => (n === name ? { text: `${n} Property`, correct: true }
    : { text: `${n} Property`, why: (name === 'Associative' && WHY_ASSOC[n]) || WHY[n] }));
  // Spread the right answer around (same order every run, so the file does not change).
  const at = Number(id.slice(1)) % 4;
  options.splice(at, 0, options.shift());
  return {
    id, type: 'choice', eq, prompt: prompt || `Which property does ${eq} show?`, options,
    hints: [...HINTS, second], show, yes: `Yes! ${eq} shows the ${name} Property.`,
    explain: `${eq} shows the ${name} Property. ${show[show.length - 2]}`,
  };
}

const PROPS = [
  prop('p13', '(2 × 3) × 4 = 2 × (3 × 4)', 'Associative', ['Commutative', 'Distributive', 'Identity'],
    'Look at the ( ). Did the order of the numbers change, or only the grouping?',
    ['The factors stay in the same order: 2, 3, 4.', 'Only the ( ) move. Both sides make 24: 6 × 4 = 24 and 2 × 12 = 24.', 'So this is the Associative Property.']),
  prop('p14', '(5 × 2) × 3 = 5 × (2 × 3)', 'Associative', ['Commutative', 'Zero', 'Distributive'],
    'Look at the ( ). Did the order of the numbers change, or only the grouping?',
    ['The factors stay in the same order: 5, 2, 3.', 'Only the grouping changes. Both sides make 30: 10 × 3 = 30 and 5 × 6 = 30.', 'So this is the Associative Property.']),
  prop('p15', '4 × (3 × 2) = (4 × 3) × 2', 'Associative', ['Identity', 'Commutative', 'Distributive'],
    'Three factors with ( ) that move. What is that called?',
    ['The factors stay in the same order: 4, 3, 2.', 'Only the ( ) move. Both sides make 24: 4 × 6 = 24 and 12 × 2 = 24.', 'So this is the Associative Property.']),
  prop('p16', '(2 × 3) × 5 = 2 × (3 × 5)', 'Associative', ['Commutative', 'Zero', 'Identity'],
    'Kai and Lena multiplied the same three numbers in the same order. What did they change?',
    ['Kai: 2 × 3 = 6, then 6 × 5 = 30. Lena: 3 × 5 = 15, then 2 × 15 = 30.', 'Same factors, same order, different grouping. Same product.', 'So this is the Associative Property.'],
    'Kai finds 2 × 3 = 6 first, then finds 6 × 5. Lena finds 3 × 5 = 15 first, then finds 2 × 15. They both get 30. Which property does (2 × 3) × 5 = 2 × (3 × 5) show?'),
  prop('p17', '10 × 1 = 10', 'Identity', ['Zero', 'Commutative', 'Associative'],
    'Look at the factors. What is special about one of them?',
    ['One factor is 1.', 'Any number multiplied by 1 stays the same: 10 × 1 = 10.', 'So this is the Identity Property.']),
  prop('p18', '7 × 0 = 0', 'Zero', ['Identity', 'Associative', 'Distributive'],
    'Look at the factors. What is special about one of them?',
    ['One factor is 0.', 'Any number multiplied by 0 equals 0: 7 × 0 = 0.', 'So this is the Zero Property.'],
    'There are 7 plates with 0 cookies on each plate. 7 × 0 = 0. Which property does 7 × 0 = 0 show?'),
  prop('p19', '4 × 9 = 9 × 4', 'Commutative', ['Associative', 'Identity', 'Distributive'],
    'Look at both sides of the = sign. Are the same numbers there in a different order?',
    ['The factors are 4 and 9 on both sides, in a different order.', 'Changing the order does not change the product: both are 36.', 'So this is the Commutative Property.']),
  prop('p20', '7 × 6 = (5 × 6) + (2 × 6)', 'Distributive', ['Associative', 'Commutative', 'Zero'],
    'Look for a + sign. Was a factor broken apart?',
    ['The 7 is broken apart into 5 + 2.', '5 × 6 = 30 and 2 × 6 = 12. 30 + 12 = 42, and 7 × 6 = 42.', 'So this is the Distributive Property.']),
];

// ---------------------------------------------------------------- Match the Split Array
const rowsOf = (n, per) => `${n} ${n === 1 ? 'row' : 'rows'} of ${per}`;
/** A split-array question: a rows of b, cut by rows (under row k) or by columns (after column k). */
function split(id, a, b, by, k, wrongCut) {
  const rows = by === 'rows';
  const n = rows ? a : b;
  const f1 = rows ? [k, b] : [a, k];
  const f2 = rows ? [a - k, b] : [a, b - k];
  const text = (x, y) => `${P(...x)} + ${P(...y)}`;
  const w = rows ? [wrongCut, b] : [a, wrongCut];
  const w2 = rows ? [a - wrongCut, b] : [a, b - wrongCut];
  const place = (c) => (rows ? `under row ${c}` : `after column ${c}`);
  const other = rows ? Math.max(1, Math.floor(b / 2)) : Math.max(1, Math.floor(a / 2));
  const turned = rows ? text([a, other], [a, b - other]) : text([other, b], [a - other, b]);
  const options = [
    { text: text(f1, f2), correct: true },
    { text: text(w, w2), why: `That also makes ${a * b}, but it would be a cut ${place(wrongCut)}. This line is ${place(k)}.` },
    { text: turned, why: `That also makes ${a * b}, but that cut goes between ${rows ? 'columns' : 'rows'}. This line goes between ${rows ? 'rows' : 'columns'}.` },
    { text: rows ? text(f1, [a - k, k]) : text(f1, [k, b - k]), why: rows ? `Each row below the line still has ${b} dots.` : `Each column on the right still has ${a} dots.` },
  ];
  const at = Number(id.slice(1)) % 4;
  options.splice(at, 0, options.shift());
  const unit = rows ? 'row' : 'column';
  const per = rows ? b : a;
  return {
    id, type: 'choice', prompt: 'A dashed line splits this array. Which facts match the two parts?',
    model: { type: 'array', rows: a, cols: b, cut: { by, at: k } }, pictureMatch: true, options,
    hints: [rows ? 'Put your finger on each row above the dashed line and count. Then do the same below it.' : 'Count the columns left of the dashed line. Then count the columns right of it.',
      `Every ${unit} has ${per} dots.`],
    show: [`The line is ${place(k)}.`, rows ? `Above the line: ${rowsOf(k, b)}, so ${F(k, b)}.` : `Left of the line: ${rowsOf(a, k)}, so ${F(a, k)}.`,
      rows ? `Below the line: ${rowsOf(a - k, b)}, so ${F(a - k, b)}.` : `Right of the line: ${rowsOf(a, b - k)}, so ${F(a, b - k)}.`, `So the answer is ${text(f1, f2)}.`],
    yes: `Yes! ${F(...f1)} = ${f1[0] * f1[1]} and ${F(...f2)} = ${f2[0] * f2[1]}. ${f1[0] * f1[1]} + ${f2[0] * f2[1]} = ${a * b}.`,
    explain: `${text(f1, f2)} = ${f1[0] * f1[1]} + ${f2[0] * f2[1]} = ${a * b}.`,
    unitCount: n,
  };
}

const SPLITS = [
  split('s11', 6, 5, 'rows', 2, 3),
  split('s12', 7, 6, 'rows', 5, 4),
  split('s13', 8, 3, 'rows', 4, 5),
  split('s14', 4, 9, 'rows', 1, 2),
  split('s15', 9, 2, 'rows', 5, 6),
  split('s16', 6, 7, 'cols', 5, 4),
  split('s17', 3, 8, 'cols', 4, 5),
  split('s18', 5, 9, 'cols', 4, 6),
  split('s19', 7, 4, 'cols', 1, 2),
  split('s20', 2, 10, 'cols', 5, 7),
].map(({ unitCount, ...it }) => it);

// ---------------------------------------------------------------- Break Apart a Factor
const BREAK = [
  {
    id: 'b11', type: 'number', prompt: '5 × 6 = 30 and 2 × 6 = 12. Use them to find 7 × 6. What is 7 × 6?', answer: '7 × 6',
    mistakes: [{ when: { answer: 30 }, say: 'That is only the 5 × 6 part. Add the 2 × 6 part too.' }, { when: { answer: 13 }, say: '7 + 6 is 13, but this is times. Add the two parts: 30 + 12.' }],
    hints: ['7 is 5 + 2.', 'Add the two products: 30 + 12.'],
    show: ['7 is 5 + 2.', '5 × 6 = 30 and 2 × 6 = 12.', '30 + 12 = 42. So 7 × 6 = 42.'],
    yes: 'Yes! 30 + 12 = 42.', explain: '7 is 5 + 2, so 7 × 6 = 30 + 12 = 42.',
  },
  {
    id: 'b12', type: 'number', prompt: 'Break apart 8 into 4 + 4. 4 × 7 = 28 and 4 × 7 = 28. What is 8 × 7?', answer: '8 × 7',
    mistakes: [{ when: { answer: 28 }, say: 'That is only one part. Add the second 4 × 7 too.' }],
    hints: ['There are two parts that are both 28.', 'Double 28: 28 + 28.'],
    show: ['8 is 4 + 4.', '4 × 7 = 28, two times.', '28 + 28 = 56. So 8 × 7 = 56.'],
    yes: 'Yes! 28 + 28 = 56.', explain: '8 is 4 + 4, so 8 × 7 = 28 + 28 = 56.',
  },
  {
    id: 'b13', type: 'fill', prompt: 'Finish breaking apart 6 × 7.', lines: ['6 × 7 = 5 × 7 + [a] × 7', '= 35 + [b]', '= [t]'], answer: { a: 1, b: 7, t: 42 },
    hints: ['5 and what number add up to 6?', 'Find 1 × 7. Then add it to 35.'],
    mistakes: [{ when: { a: 1, b: 1 }, say: 'The second part is 1 × 7, not 1. Find 1 × 7.' }],
    show: ['6 is 5 + 1, so the missing factor is 1.', '1 × 7 = 7.', '35 + 7 = 42.'],
    yes: 'Yes! 6 × 7 = 35 + 7 = 42.', explain: '6 is 5 + 1. 5 × 7 = 35 and 1 × 7 = 7. 35 + 7 = 42.',
  },
  {
    id: 'b14', type: 'fill', prompt: 'Finish breaking apart 4 × 8.', lines: ['4 × 8 = 4 × 4 + 4 × [a]', '= 16 + [b]', '= [t]'], answer: { a: 4, b: 16, t: 32 },
    hints: ['4 and what number add up to 8?', 'Find 4 × 4. Then add it to 16.'],
    show: ['8 is 4 + 4, so the missing factor is 4.', '4 × 4 = 16.', '16 + 16 = 32.'],
    yes: 'Yes! 4 × 8 = 16 + 16 = 32.', explain: '8 is 4 + 4. 4 × 4 = 16, two times. 16 + 16 = 32.',
  },
  {
    id: 'b15', type: 'choice', fact: [4, 9], split: 'second', prompt: 'Which shows a way to break apart the 9 in 4 × 9?',
    options: [
      { text: '(2 × 9) + (2 × 9)', why: 'That is true, but it breaks apart the 4, not the 9.' },
      { text: '(4 × 5) + (4 × 4)', correct: true },
      { text: '(4 × 5) + (4 × 5)', why: '5 + 5 is 10, not 9.' },
      { text: '(4 × 6) + (4 × 2)', why: '6 + 2 is 8, not 9.' },
    ],
    hints: ['The two smaller numbers must add up to the factor you break apart.', 'Keep the 4 in both facts. Which two numbers add up to 9?'],
    show: ['Keep the 4. Break apart the 9 into 5 + 4.', '4 × 5 = 20 and 4 × 4 = 16.', '20 + 16 = 36, and 4 × 9 = 36.', 'So the answer is (4 × 5) + (4 × 4).'],
    yes: 'Yes! 5 + 4 = 9, so 4 × 9 = (4 × 5) + (4 × 4) = 20 + 16 = 36.', explain: '5 + 4 = 9, so 4 × 9 = (4 × 5) + (4 × 4) = 20 + 16 = 36.',
  },
  {
    id: 'b16', type: 'choice', fact: [6, 4], split: 'first', prompt: 'Which shows a way to break apart the 6 in 6 × 4?',
    options: [
      { text: '(5 × 4) + (1 × 4)', correct: true },
      { text: '(6 × 2) + (6 × 2)', why: 'That is true, but it breaks apart the 4, not the 6.' },
      { text: '(4 × 4) + (1 × 4)', why: '4 + 1 is 5, not 6.' },
      { text: '(3 × 4) + (2 × 4)', why: '3 + 2 is 5, not 6.' },
    ],
    hints: ['The two smaller numbers must add up to the factor you break apart.', 'Keep the 4 in both facts. Which two numbers add up to 6?'],
    show: ['Keep the 4. Break apart the 6 into 5 + 1.', '5 × 4 = 20 and 1 × 4 = 4.', '20 + 4 = 24, and 6 × 4 = 24.', 'So the answer is (5 × 4) + (1 × 4).'],
    yes: 'Yes! 5 + 1 = 6, so 6 × 4 = (5 × 4) + (1 × 4) = 20 + 4 = 24.', explain: '5 + 1 = 6, so 6 × 4 = (5 × 4) + (1 × 4) = 20 + 4 = 24.',
  },
  {
    id: 'b17', type: 'choice', fact: [7, 8], split: 'any', prompt: 'Which is a correct way to break apart 7 × 8?',
    options: [
      { text: '(5 × 8) + (1 × 8)', why: '5 + 1 is 6, not 7.' },
      { text: '(7 × 4) + (7 × 3)', why: '4 + 3 is 7, not 8.' },
      { text: '(5 × 8) + (2 × 8)', correct: true },
      { text: '(5 × 4) + (2 × 4)', why: 'Both facts must keep the 8, or both must keep the 7.' },
    ],
    hints: ['Keep one factor in both facts.', 'The other two numbers must add up to the factor you broke apart.'],
    show: ['Keep the 8. Break apart the 7 into 5 + 2.', '5 × 8 = 40 and 2 × 8 = 16.', '40 + 16 = 56, and 7 × 8 = 56.', 'So the answer is (5 × 8) + (2 × 8).'],
    yes: 'Yes! 5 + 2 = 7, so 7 × 8 = (5 × 8) + (2 × 8) = 40 + 16 = 56.', explain: '5 + 2 = 7, so 7 × 8 = (5 × 8) + (2 × 8) = 40 + 16 = 56.',
  },
  {
    id: 'b18', type: 'choice', quotesMistake: true, prompt: 'A student wrote 6 × 4 = (5 × 4) + (1 × 1). What went wrong?',
    options: [
      { text: 'Nothing. It is correct.', why: '(5 × 4) + (1 × 1) makes 21, but 6 × 4 makes 24.' },
      { text: 'The second part should be 1 × 4.', correct: true },
      { text: '6 cannot be broken into 5 and 1.', why: '5 + 1 = 6, so that part is fine.' },
      { text: 'The first part should be 6 × 4.', why: 'The first part is right: 5 rows of 4 is 5 × 4.' },
    ],
    hints: ['Both parts must keep the factor 4.', 'Look at the second part. Does it keep the 4?'],
    show: ['6 is 5 + 1, and both parts keep the 4.', 'The parts are 5 × 4 and 1 × 4.', '20 + 4 = 24, and 6 × 4 = 24.', 'So the second part should be 1 × 4.'],
    yes: 'Yes! 6 × 4 = (5 × 4) + (1 × 4) = 20 + 4 = 24.', explain: '6 is 5 + 1, so 6 × 4 = (5 × 4) + (1 × 4) = 20 + 4 = 24.',
  },
  {
    id: 'b19', type: 'decompose', fact: [7, 4], prompt: 'Break apart 7 × 4 into two easier facts. Then find the product.',
    answer: { p: 5, q: 4, r: 2, s: 4, t: 28 },
    hints: ['Keep the 4 and break apart the 7, or keep the 7 and break apart the 4.', 'One way: 7 is 5 + 2.'],
    show: ['7 is 5 + 2, so keep the 4.', '5 × 4 = 20 and 2 × 4 = 8.', '20 + 8 = 28.', 'So 7 × 4 = 5 × 4 + 2 × 4 = 28. Other correct ways count too.'],
    yes: 'Yes! 7 × 4 = 28.', explain: 'One way: 7 is 5 + 2, so 7 × 4 = 5 × 4 + 2 × 4 = 20 + 8 = 28.',
  },
  {
    id: 'b20', type: 'decompose', fact: [9, 6], prompt: 'Break apart 9 × 6 into two easier facts. Then find the product.',
    answer: { p: 5, q: 6, r: 4, s: 6, t: 54 },
    hints: ['Keep the 6 and break apart the 9, or keep the 9 and break apart the 6.', 'One way: 9 is 5 + 4.'],
    show: ['9 is 5 + 4, so keep the 6.', '5 × 6 = 30 and 4 × 6 = 24.', '30 + 24 = 54.', 'So 9 × 6 = 5 × 6 + 4 × 6 = 54. Other correct ways count too.'],
    yes: 'Yes! 9 × 6 = 54.', explain: 'One way: 9 is 5 + 4, so 9 × 6 = 5 × 6 + 4 × 6 = 30 + 24 = 54.',
  },
];

// ---------------------------------------------------------------- facts (only used by Mixed Practice)
const FACTS = [
  {
    id: 'f7', type: 'fill', prompt: 'What number goes in the box?', lines: ['(2 × 4) × 3 = 2 × (4 × [a])'], answer: { a: 3 },
    hints: ['Changing the grouping does not change the product.', 'Which factor from the left side is missing on the right side?'],
    mistakes: [{ when: { a: 2 }, say: 'Only the ( ) move. Which factor from the left side is missing on the right side?' }],
    show: ['The factors are 2, 4 and 3, in that order.', 'Only the ( ) move: 2 × (4 × 3).', 'So the missing number is 3. This is the Associative Property.'],
    yes: 'Yes! (2 × 4) × 3 = 2 × (4 × 3) = 24.', explain: 'Changing the grouping does not change the product: (2 × 4) × 3 = 8 × 3 = 24 and 2 × (4 × 3) = 2 × 12 = 24.',
  },
  {
    id: 'f8', type: 'number', prompt: '(3 × 2) × 5 = ?', answer: '(3 × 2) × 5',
    mistakes: [{ when: { answer: 10 }, say: 'Do the ( ) first: 3 × 2 = 6. Then 6 × 5.' }, { when: { answer: 6 }, say: '3 × 2 = 6 is the first step. Now multiply 6 × 5.' }],
    hints: ['Do the ( ) first: 3 × 2.', 'Then multiply that by 5.'],
    show: ['3 × 2 = 6.', '6 × 5 = 30.', 'Or group it the other way: 3 × (2 × 5) = 3 × 10 = 30.'],
    yes: 'Yes! (3 × 2) × 5 = 6 × 5 = 30.', explain: '(3 × 2) × 5 = 6 × 5 = 30. Grouping 3 × (2 × 5) = 3 × 10 gives 30 too.',
  },
];

const practice = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const add = (set, items) => {
  const ids = new Set(items.map((it) => it.id));
  practice.sets[set] = [...practice.sets[set].filter((it) => !ids.has(it.id)), ...items];
};
add('props', PROPS);
add('split', SPLITS);
add('breakapart', BREAK);
add('facts', FACTS);
// Every split question says "facts" (the word children learn), not "expression".
for (const it of practice.sets.split) it.prompt = it.prompt.replace('Which expression matches the two parts?', 'Which facts match the two parts?');
practice.note = 'Study Scoop practice problems (original, not from the textbook). They cover the five multiplication properties, split arrays and breaking apart a factor.';
const problems = validateMathPractice(practice);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
fs.writeFileSync(FILE, `${JSON.stringify(practice, null, 2)}\n`);
for (const k of Object.keys(practice.sets)) console.log(k, practice.sets[k].length);
