// Adds Try It Yourself questions 9-20 to Lessons 5-1 and 5-2 (and, for 5-2, a Learn It screen and a Watch Me example
// that break apart the other factor: 3 × 7 = 3 × 5 + 3 × 2). Idempotent: running it again replaces what it added.
// The hand-written questions 1-8 and every other part of both lessons are kept as they are.
// Development only (not published). Run: node scripts/author/extend-5-1-5-2.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLesson } from '../../js/lib/lessons.js';
import { arr, choice, decompose, fact, missing, partsFill, story } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = (id) => path.join(ROOT, `data/lessons/${id}.json`);

const EXTRA = {
  '5-1': [
    choice('t9', 'Which fact does this array show?', [
      ['4 + 6', 'An array has equal rows, so it shows multiplication.'],
      ['6 × 4', true],
      ['6 × 6', 'Count the dots in one row. There are 4.'],
      ['4 × 4', 'Count the rows going down. There are 6.'],
    ], {
      model: arr(6, 4), target: '6 × 4',
      hints: ['Count the rows going down. Then count the dots in one row.', 'Rows first, then how many in each row.'],
      show: ['There are 6 rows.', 'Each row has 4 dots, so the array shows 6 × 4 = 24.'], yes: 'Yes! 6 equal rows of 4 is 6 × 4.',
    }),
    choice('t10', 'Which facts match this split array?', [
      ['(4 × 3) + (3 × 3)', 'That would be a cut under row 4. This line is under row 5.'],
      ['(7 × 2) + (7 × 1)', 'That cut goes between columns. This line goes between rows.'],
      ['(5 × 3) + (2 × 3)', true],
      ['(5 × 7) + (2 × 7)', 'Each row has 3 dots, not 7. Count the dots in one row.'],
    ], {
      model: arr(7, 3, ['r', 5], 'parts'), pictureMatch: true,
      hints: ['Count the rows above the line and below the line.', 'Each row has 3 dots.'],
      show: ['5 rows are above the line and 2 rows are below it.', 'Each row has 3 dots: (5 × 3) + (2 × 3).'],
      yes: 'Yes! 5 rows of 3 on top and 2 rows of 3 below.',
    }),
    choice('t11', 'This line goes between columns. Which facts match?', [
      ['(4 × 5) + (4 × 3)', true],
      ['(2 × 8) + (2 × 8)', 'That cut goes between rows. This line goes between columns.'],
      ['(4 × 6) + (4 × 2)', 'That would be a cut after column 6. This line is after column 5.'],
      ['(4 × 5) + (4 × 5)', 'That makes 10 columns. The picture has 8: 5 on the left and 3 on the right.'],
    ], {
      model: arr(4, 8, ['c', 5], 'parts'), pictureMatch: true,
      hints: ['Count the columns left of the line and right of the line.', 'Each column has 4 dots.'],
      show: ['5 columns are left of the line and 3 are right of it.', 'Each column has 4 dots: (4 × 5) + (4 × 3).'],
      yes: 'Yes! 4 rows of 5 on the left and 4 rows of 3 on the right.',
    }),
    choice('t12', 'What does the dashed line do to the array?', [
      ['It takes some dots away.', 'No dots are taken away. Every dot is still there.'],
      ['It splits the array into two smaller arrays.', true],
      ['It adds more dots.', 'No dots are added. The line only splits the array into two parts.'],
    ], {
      model: arr(6, 5, ['r', 3], 'parts'),
      hints: ['Count all the dots. Is the total still 6 rows of 5?'],
      show: ['The top part is 3 × 5 and the bottom part is 3 × 5.', 'Together they are still 6 × 5 = 30 dots.'],
      yes: 'Yes! Two smaller arrays, and the same number of dots.',
    }),
    partsFill('t13', 7, 6, 'rows', 5, { hints: ['The top part is 5 rows of 6. The bottom part is 2 rows of 6.', '5 × 6 = 30 and 2 × 6 = 12.'] }),
    partsFill('t14', 5, 8, 'cols', 5, {
      prompt: 'This cut goes between columns. Find each part, then add.',
      hints: ['The left part is 5 rows of 5. The right part is 5 rows of 3.', '5 × 5 = 25 and 5 × 3 = 15.'],
    }),
    decompose('t15', 7, 7, ['rows', 5], {
      model: arr(7, 7),
      hints: ['Cut one 7 into 5 + 2.', '5 × 7 + 2 × 7. Then add.'],
    }),
    choice('t16', 'Which is a correct way to decompose 8 × 6?', [
      ['5 × 6 + 2 × 6', '5 and 2 make 7, not 8.'],
      ['4 × 6 + 4', 'The second part must be a whole fact: 4 × 6, not 4.'],
      ['4 × 6 + 4 × 6', true],
      ['8 × 3 + 8 × 2', '3 and 2 make 5, not 6.'],
    ], { target: '8 × 6', hints: ['The two parts of the broken factor must add up to that factor.', 'Check each choice: do its two numbers add up to 8 or to 6, and is each part a whole fact?'], show: ['8 × 6 = 4 × 6 + 4 × 6.', '24 + 24 = 48.'], yes: 'Yes! 4 + 4 = 8, and 24 + 24 = 48.' }),
    missing('t17', '2 × 8 + 4 × 8 = 8 × [x]', { x: 6 }, {
      hints: ['Both facts have 8. Which numbers were put together?', 'Add the two numbers that are not 8.'],
      mistakes: [{ when: { x: 48 }, say: 'That box needs a factor, not the product. What do 2 and 4 make?' }, { when: { x: 4 }, say: 'Do not forget the 2 × 8. 2 and 4 make 6.' }],
      show: ['2 + 4 = 6.', '2 × 8 + 4 × 8 = 16 + 32 = 48, and 8 × 6 = 48.'], yes: 'Yes! 2 + 4 = 6, so 8 × 6.',
    }),
    missing('t18', '7 × 3 + 7 × 3 = 7 × [x]', { x: 6 }, {
      hints: ['Both facts keep the 7. Add the other two numbers.'],
      mistakes: [{ when: { x: 3 }, say: 'There are two 7 × 3 facts. 3 and 3 make 6.' }, { when: { x: 42 }, say: 'That box needs a factor, not the product.' }],
      show: ['3 + 3 = 6.', '7 × 3 + 7 × 3 = 21 + 21 = 42, and 7 × 6 = 42.'], yes: 'Yes! 3 + 3 = 6, so 7 × 6.',
    }),
    story('t19', 'A bakery has 9 trays. Each tray has 6 rolls. How many rolls are there?', 9, 6, {
      hints: ['9 trays of 6: 9 × 6.', 'Decompose the 9 into 5 + 4. Find each part, then add.'],
      mistakes: [{ when: { answer: 15 }, say: '9 + 6 is 15. There are 9 equal trays, so multiply.' }, { when: { answer: 30 }, say: '30 is only 5 trays. Add the other 4 trays.' }],
      show: ['9 × 6 = 5 × 6 + 4 × 6.', '30 + 24 = 54 rolls.'], yes: 'Yes! 54 rolls.',
    }),
    choice('t20', 'Ty cuts 6 × 4 into 5 rows and 1 row. Ana cuts it into 3 rows and 3 rows. Who gets more dots?', [
      ['Ty, because 5 is bigger.', 'Ty has 20 + 4 = 24 dots. Ana has 12 + 12 = 24 dots. They are the same.'],
      ['Ana, because her parts are equal.', 'Ana has 12 + 12 = 24 dots. Ty has 20 + 4 = 24 dots. They are the same.'],
      ['Neither. They both have 24 dots.', true],
    ], { models: [arr(6, 4, ['r', 5], 'parts'), arr(6, 4, ['r', 3], 'parts')], hints: ['Find Ty\'s two parts and add them. Then do the same for Ana.'], show: ['Ty: 5 × 4 + 1 × 4 = 20 + 4 = 24.', 'Ana: 3 × 4 + 3 × 4 = 12 + 12 = 24.', 'A different cut never changes the number of dots.'], yes: 'Yes! Every correct cut gives the same product.' }),
  ],
  '5-2': [
    partsFill('t9', 3, 5, 'rows', 2, { hints: ['The top part is 2 rows of 5: the 2s fact. The bottom part is 1 row of 5.'] }),
    partsFill('t10', 3, 7, 'cols', 5, {
      prompt: 'This time the 7 is broken apart into 5 + 2. Find each part, then add.',
      hints: ['The left part is 3 rows of 5. The right part is 3 rows of 2.', '3 × 5 = 15 and 3 × 2 = 6.'],
    }),
    decompose('t11', 3, 8, ['rows', 2], {
      hints: ['Break the 3 into 2 + 1. Or break the 8 into 5 + 3.', '2 × 8 + 1 × 8. Then add.'],
    }),
    choice('t12', 'Which facts match this split array?', [
      ['(2 × 8) + (2 × 8)', 'That makes 4 rows. This array has 3 rows: 2 on top and 1 below.'],
      ['(2 × 8) + (1 × 8)', true],
      ['(3 × 5) + (3 × 3)', 'That cut goes between columns. This line goes between rows.'],
      ['(2 × 3) + (1 × 3)', 'Each row has 8 dots, not 3. Count the dots in one row.'],
    ], {
      model: arr(3, 8, ['r', 2], 'parts'), pictureMatch: true,
      hints: ['Count the rows above the line and below the line.', 'Count the dots in one row.'],
      show: ['2 rows are above the line and 1 row is below it.', 'Each row has 8 dots: (2 × 8) + (1 × 8).'],
      yes: 'Yes! The 2s fact on top and the 1s fact below.',
    }),
    choice('t13', 'This line goes between columns. Which facts match?', [
      ['(2 × 7) + (1 × 7)', 'That cut goes between rows. This line goes between columns.'],
      ['(3 × 4) + (3 × 3)', 'That would be a cut after column 4. This line is after column 5.'],
      ['(3 × 5) + (3 × 5)', 'That makes 10 columns. The picture has 7: 5 on the left and 2 on the right.'],
      ['(3 × 5) + (3 × 2)', true],
    ], {
      model: arr(3, 7, ['c', 5], 'parts'), pictureMatch: true,
      hints: ['Count the columns left of the line and right of the line.', 'Each column has 3 dots.'],
      show: ['5 columns are left of the line and 2 are right of it.', 'Each column has 3 dots: (3 × 5) + (3 × 2).'],
      yes: 'Yes! 3 × 7 = (3 × 5) + (3 × 2) = 15 + 6 = 21.',
    }),
    fact('t14', 3, 10, {
      hints: ['Double 10 is 20. That is the 2s fact.', 'Add 10 once more: 20 + 10.'],
      mistakes: [{ when: { answer: 13 }, say: '3 + 10 is 13, but this is times. Double 10, then add 10 once more.' }, { when: { answer: 20 }, say: '20 is the 2s fact. Add one more 10.' }],
      show: ['3 × 10 = 2 × 10 + 1 × 10.', '20 + 10 = 30.'],
    }),
    story('t15', 'A clover has 3 leaves. How many leaves are on 7 clovers?', 7, 3, {
      hints: ['7 clovers with 3 leaves: 7 × 3.', 'Find the 3. Double 7 is 14, then add 7 once more.'],
      mistakes: [{ when: { answer: 10 }, say: '7 + 3 is 10. Each clover has 3 leaves, so multiply.' }, { when: { answer: 14 }, say: '14 is the 2s fact. Add one more 7.' }],
      show: ['7 × 3 = 7 × 2 + 7 × 1.', '14 + 7 = 21 leaves.'], yes: 'Yes! 21 leaves.',
    }),
    story('t16', 'Kim reads 3 books each week. How many books does she read in 6 weeks?', 6, 3, {
      hints: ['6 weeks of 3 books: 6 × 3.', 'Find the 3. Double 6 is 12, then add 6 once more.'],
      mistakes: [{ when: { answer: 9 }, say: '6 + 3 is 9. She reads 3 books each week, so multiply.' }, { when: { answer: 12 }, say: '12 is the 2s fact. Add one more 6.' }],
      show: ['6 × 3 = 6 × 2 + 6 × 1.', '12 + 6 = 18 books.'], yes: 'Yes! 18 books.',
    }),
    choice('t17', 'Pick the way that finds 3 × 4.', [
      ['3 × 2 + 3 × 3', '2 and 3 make 5, not 4.'],
      ['2 × 4 + 1 × 4', true],
      ['2 × 4 + 1', 'The second part must be a whole fact that keeps the 4.'],
      ['3 + 4', '3 × 4 means 3 groups of 4, not 3 + 4.'],
    ], { target: '3 × 4', hints: ['3 = 2 + 1. Both facts must keep the same factor.'], show: ['3 × 4 = 2 × 4 + 1 × 4.', '8 + 4 = 12.'], yes: 'Yes! 8 + 4 = 12.' }),
    choice('t18', 'A student wrote 3 × 8 = 2 × 8 + 1 = 17. What went wrong?', [
      ['The second part should be 1 × 8, not 1.', true],
      ['Nothing. It is correct.', '3 × 8 is 3 rows of 8. That is 24, not 17.'],
      ['The first part should be 3 × 8.', 'The first part 2 × 8 is fine. The second part lost its 8.'],
      ['You should add 3 + 8.', '3 × 8 means 3 groups of 8, not 3 + 8.'],
    ], {
      quotesMistake: true,
      hints: ['Both parts must be whole facts that keep the same factor.', 'Check each part, one at a time.'],
      show: ['3 × 8 = 2 × 8 + 1 × 8.', '16 + 8 = 24.'], yes: 'Yes! 3 × 8 = 2 × 8 + 1 × 8 = 16 + 8 = 24.',
    }),
    choice('t19', 'Jo knows 3 × 6 = 18. What is 6 × 3?', [
      ['21, because you add 3 more.', '6 × 3 has the same factors in a different order, so it is still 18.'],
      ['18. Turning a fact around keeps the product.', true],
      ['63', '6 × 3 is a multiplication fact, not the number 63. Turn it around: it is 18.'],
    ], { hints: ['Look at the two factors. Are they the same numbers in a different order?'], show: ['6 × 3 and 3 × 6 use the same factors.', 'Turning a fact around does not change the product: 18.'], yes: 'Yes! The order of the factors does not matter.' }),
    choice('t20', 'Why does 3 × 6 = 2 × 6 + 1 × 6 work?', [
      ['Because 6 is even.', 'That does not matter. The 3 rows split into 2 rows and 1 row.'],
      ['3 rows is 2 rows and 1 more row.', true],
      ['Because 2 × 6 is bigger.', 'Size does not matter. The 3 rows split into 2 rows and 1 row, and the 6 stays in both parts.'],
    ], { hints: ['Think of 3 rows of 6. Cut under row 2.'], show: ['3 = 2 + 1.', 'So 3 rows of 6 is 2 rows of 6 and 1 row of 6: 12 + 6 = 18.'], yes: 'Yes! 2 + 1 = 3 rows, and every row has 6.' }),
  ],
};

// Questions 1-8 that had no hint or no Show me how get them (only missing fields are added; nothing is changed).
const PATCH = {
  '5-1': {
    t5: { hints: ['Find each friend\'s total.', 'Friend 1: 20 + 20. Friend 2: 25 + 15.'], show: ['Friend 1: 4 × 5 + 4 × 5 = 20 + 20 = 40.', 'Friend 2: 5 × 5 + 3 × 5 = 25 + 15 = 40.', 'Both make 40, so both friends are right.'] },
    t7: { show: ['8 × 1 means 8 groups of 1.', 'That is 8. Times 1 keeps the number the same.'] },
  },
  '5-2': {
    t4: { hints: ['3 = 2 + 1. Both facts must keep the 7.', 'Check each choice: do the two numbers add up to 3?'], show: ['3 × 7 = 2 × 7 + 1 × 7.', '14 + 7 = 21.'] },
    t7: { show: ['0 × 7 means 0 groups of 7.', 'There is nothing to count, so 0 × 7 = 0.'] },
    t8: { show: ['9 × 1 means 9 groups of 1.', 'That is 9. Times 1 keeps the number the same.'] },
  },
};

// Reviewer fixes to the hand-written parts (curriculum review, D20): wording, scope ("area" is not in this unit),
// feedback, Show me how steps and an easy-to-hard order for Try It Yourself. Replacements, applied every run.
function revise(id, lesson) {
  const all = [...lesson.learn.screens.map((x) => x.item), ...lesson.watch.examples.map((e) => e.why), ...lesson.together.items, ...lesson.try.items, ...lesson.test.items].filter(Boolean);
  const item = (k) => all.find((it) => it.id === k);
  if (id === '5-1') {
    delete lesson.glossary.area;
    lesson.glossary.factor = 'a number you multiply, like the 6 and the 3 in 6 × 3';
    lesson.glossary.product = 'the answer when you multiply';
    for (const k of ['g5', 't4', 'x5']) {
      const it = item(k);
      it.prompt = it.prompt.replace(/^Each square is like a dot\. Find the area \(how many squares\): (\d+ × \d+)\.$/, 'How many squares? Break apart $1.');
    }
    const teach = lesson.learn.screens.find((x) => x.title === 'The Distributive Property');
    teach.text[0] = 'Break one factor into two smaller numbers. Multiply each part. Then add.';
    item('t5').models = item('t5').models.map((m) => ({ ...m, labels: 'parts' }));
    item('t5').hints = ['Find each friend\'s total.', 'Add each friend\'s two parts. Are the totals the same?'];
    const g3 = item('g3');
    g3.show = g3.show.map((x) => x.replace('The right part has 1 column of 5 dots: 5 × 1 = 5.', 'The right part is 5 rows of 1: 5 × 1 = 5.'));
    const wb = item('wB');
    const bigger = wb.options.find((o) => /bigger than 5/.test(o.text));
    if (bigger) { bigger.text = 'We used a bigger number.'; bigger.why = 'The array is still 6 rows of 3. We only moved the cut, so the dots stay the same.'; }
    const order = ['t9', 't12', 't7', 't8', 't10', 't11', 't13', 't14', 't2', 't3', 't17', 't18', 't16', 't1', 't6', 't15', 't4', 't5', 't19', 't20'];
    lesson.try.items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  if (id === '5-2') {
    const x8 = item('x8');
    for (const o of x8.options) if (o.text === '3 × 3 and 1 × 10') o.why = 'Keep the 10 in both facts: 2 × 10 and 1 × 10.';
    item('t1').show = ['3 × 9 = 27, so the missing number is 9.', 'Check with the 3s strategy: 2 × 9 + 1 × 9 = 18 + 9 = 27.'];
    const x1 = item('x1');
    x1.show = ['3 × 7 = 2 × 7 + 1 × 7 = 14 + 7 = 21.', 'So the missing number is 7.'];
    item('t4').hints = ['3 = 2 + 1. Both facts must keep the 7.', 'Check each choice: do the two numbers add up to 3?'];
    const order = ['t7', 't8', 't9', 't4', 't12', 't13', 't2', 't3', 't10', 't11', 't14', 't1', 't5', 't6', 't15', 't16', 't17', 't18', 't19', 't20'];
    lesson.try.items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
}

// Lesson 5-2: the other factor can be broken apart too (3 × 7 = 3 × 5 + 3 × 2). Inserted before the Check screen.
const OTHER_WAY = {
  title: 'Another way: break apart the 7',
  text: [
    'You can also break apart the other factor. 7 is 5 + 2.',
    'Cut between the columns. The left part is 3 × 5 = 15. The right part is 3 × 2 = 6.',
    'Add: 15 + 6 = 21. The same 21 dots! A correct way always keeps every dot.',
  ],
  model: arr(3, 7, ['c', 5], 'facts'),
  caption: '3 × 7 = 3 × 5 + 3 × 2',
};

let bad = 0;
for (const [id, extra] of Object.entries(EXTRA)) {
  const lesson = JSON.parse(fs.readFileSync(file(id), 'utf8'));
  const added = new Set(extra.map((it) => it.id));
  lesson.try.items = [...lesson.try.items.filter((it) => !added.has(it.id)), ...extra];
  for (const it of lesson.try.items) for (const [k, v] of Object.entries(PATCH[id]?.[it.id] || {})) if (!it[k]?.length) it[k] = v;
  lesson.try.pass = 16;
  revise(id, lesson);
  if (id === '5-2') {
    lesson.learn.screens = lesson.learn.screens.filter((s) => s.title !== OTHER_WAY.title);
    const at = lesson.learn.screens.findIndex((s) => s.title === 'Check');
    lesson.learn.screens.splice(at, 0, OTHER_WAY);
  }
  const problems = validateLesson(lesson, id);
  if (problems.length) { bad++; console.error(`✗ ${id}\n  ${problems.join('\n  ')}`); continue; }
  fs.writeFileSync(file(id), `${JSON.stringify(lesson, null, 2)}\n`);
  console.log(`✓ ${id}: try ${lesson.try.items.length} (pass ${lesson.try.pass}), learn ${lesson.learn.screens.length}`);
}
process.exit(bad ? 1 : 0);
