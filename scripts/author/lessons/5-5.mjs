// Lesson 5-5: Use Properties to Multiply by 8 (double the 4s fact, or the 5s fact plus the 3s fact). Original content.
import { F, arr, choice, decompose, fact, factorsFill, forTest, missing, partsFill, story, table } from '../lib.mjs';

/** Hints and steps for 8 × n: double the 4s fact. */
function eight(n, first = true) {
  const four = first ? F(4, n) : F(n, 4);
  const whole = first ? F(8, n) : F(n, 8);
  return {
    hints: [`Find the 4s fact: ${four} = ${4 * n}.`, `Double it: ${4 * n} + ${4 * n}.`],
    show: [`8 = 4 + 4, so ${whole} is two ${four} facts.`, `${four} = ${4 * n}.`, `${4 * n} + ${4 * n} = ${8 * n}. So ${whole} = ${8 * n}.`],
    mistakes: [
      ...(8 + n !== 4 * n ? [{ when: { answer: 8 + n }, say: `8 + ${n} is ${8 + n}, but this is times. Find the 4s fact and double it.` }] : []),
      { when: { answer: 4 * n }, say: `${4 * n} is the 4s fact. Double it to get the 8s fact.` },
    ],
  };
}

export default {
  id: '5-5',
  title: 'Use Properties to Multiply by 8',
  goal: 'I can multiply by 8: double the 4s fact, or add the 5s fact and the 3s fact.',
  catchAll: 'Find the 8. Double the 4s fact, or add the 5s fact and the 3s fact.',
  teacher: [{ term: 'Distributive Property', def: 'a multiplication fact can be broken apart into the sum of two other related facts' }],
  glossary: {
    '4s fact': 'a fact times 4, like 4 × 6. Double the 2s fact to find it.',
    '8s fact': 'a fact times 8, like 8 × 6',
    double: 'add a number to itself, like 24 + 24',
  },
  learn: {
    screens: [
      {
        title: 'Ready? Warm-up',
        item: fact('r1', 4, 6, {
          hints: ['Find the 2s fact: 2 × 6 = 12.', 'Double 12: 12 + 12.'],
          mistakes: [{ when: { answer: 10 }, say: '4 + 6 is 10, but this is times. Double the 2s fact.' }, { when: { answer: 12 }, say: '12 is the 2s fact. Double it.' }],
          yes: 'Yes! 4 × 6 = 24.',
        }),
      },
      {
        title: 'Ready? One more',
        item: {
          id: 'r2', type: 'number', prompt: 'Double 24 = ?', answer: '24 + 24',
          hints: ['Double means add the number to itself: 24 + 24.', '20 + 20 = 40 and 4 + 4 = 8.'],
          mistakes: [{ when: { answer: 26 }, say: 'That is 24 + 2. Double 24 means 24 + 24.' }],
          yes: 'Yes! 24 + 24 = 48.',
        },
      },
      {
        title: 'Way 1: 8 is 4 + 4',
        text: [
          '8 × 6 means 8 rows of 6.',
          '8 is 4 + 4. Cut under row 4.',
          'Each part is the 4s fact: 4 × 6 = 24. Double it: 24 + 24 = 48.',
        ],
        model: arr(8, 6, ['r', 4], 'facts'),
        caption: '8 × 6 = 4 × 6 + 4 × 6',
        words: ['4s fact', 'double'],
      },
      {
        title: 'Way 2: 8 is 5 + 3',
        text: [
          '8 is also 5 + 3. Cut under row 5.',
          'The top part is the 5s fact: 5 × 6 = 30. The bottom part is the 3s fact: 3 × 6 = 18.',
          'Add them: 30 + 18 = 48. Same answer!',
        ],
        model: arr(8, 6, ['r', 5], 'facts'),
        caption: '8 × 6 = 5 × 6 + 3 × 6',
      },
      {
        title: 'The 8s strategies',
        teacher: true,
        text: [
          'Find the 8. Double the 4s fact.',
          'Or add the 5s fact and the 3s fact. Pick the facts you know best.',
        ],
        pairs: ['8 × 6 = (4 × 6) + (4 × 6)', '8 × 6 = (5 × 6) + (3 × 6)'],
      },
      {
        title: 'Check',
        item: choice('l1', 'Which one is equal to 8 × 7?', [
          ['4 × 7 + 3 × 7', '4 and 3 make 7, not 8.'],
          ['4 × 7 + 4', 'The second part must be a whole fact: 4 × 7, not 4.'],
          ['8 + 7', '8 × 7 means 8 groups of 7, not 8 + 7.'],
          ['4 × 7 + 4 × 7', true],
        ], { target: '8 × 7', yes: 'Yes! 4 × 7 + 4 × 7 is 28 + 28. That is 56.' }),
      },
    ],
  },
  watch: {
    takeaway: '8s facts: double the 4s fact, or add the 5s fact and the 3s fact.',
    examples: [
      {
        title: 'Example A: 8 × 6 as 4 + 4',
        model: arr(8, 6, ['r', 4], 'facts'),
        steps: [
          { say: 'Problem: 8 × 6. That is 8 rows of 6.', model: arr(8, 6) },
          { say: 'Break 8 into 4 + 4. Cut under row 4.', model: arr(8, 6, ['r', 4], 'parts') },
          { say: 'The top part is the 4s fact.', eq: '4 × 6 = 24' },
          { say: 'The bottom part is the same 4s fact.', eq: '4 × 6 = 24' },
          { say: 'Double 24.', eq: '8 × 6 = 4 × 6 + 4 × 6 = 24 + 24 = 48', pictured: true, word: 'double' },
          { say: 'Check the array. 8 rows of 6 is 48 dots.', eq: '8 × 6 = 48' },
        ],
        why: choice('wA', 'Why can we double 4 × 6 to find 8 × 6?', [
          ['Because 6 is even.', 'That does not matter. It works because 8 rows is 4 rows and 4 more rows.'],
          ['8 rows is 4 rows and 4 more rows.', true],
          ['Because 4 is the answer.', 'The answer is 48. It works because 8 rows is 4 rows and 4 more rows.'],
        ], { yes: 'Yes! 4 + 4 = 8, so two 4s facts make the 8s fact.' }),
      },
      {
        title: 'Example B: 8 × 6 as 5 + 3',
        model: arr(8, 6, ['r', 5], 'facts'),
        steps: [
          { say: 'Now break 8 into 5 + 3. Cut under row 5.', model: arr(8, 6, ['r', 5], 'parts') },
          { say: 'The top part is the 5s fact.', eq: '5 × 6 = 30' },
          { say: 'The bottom part is the 3s fact.', eq: '3 × 6 = 18' },
          { say: 'Add the two parts. Same answer as before!', eq: '8 × 6 = 5 × 6 + 3 × 6 = 30 + 18 = 48', pictured: true },
        ],
        why: choice('wB', 'Both ways make 48. Why?', [
          ['We moved the cut. It is still 8 rows of 6.', true],
          ['We added more dots.', 'No dots were added. We only moved the cut.'],
          ['5 and 3 are odd numbers.', 'That does not matter. We only moved the cut, so the dots stay the same.'],
        ], { yes: 'Yes! The cut moved, but the dots did not change.' }),
        another: {
          text: 'Two cuts, the same 48 dots.',
          models: [arr(8, 6, ['r', 4], 'facts'), arr(8, 6, ['r', 5], 'facts')],
        },
      },
      {
        title: 'Example C: the 8 comes second',
        model: arr(3, 8, ['c', 4], 'facts'),
        steps: [
          { say: 'This time the 8 comes second. 3 × 8 is 3 rows of 8.', model: arr(3, 8) },
          { say: 'Find the 8. Break it into 4 + 4. Cut between the columns.', model: arr(3, 8, ['c', 4], 'parts') },
          { say: 'The left part is 3 rows of 4.', eq: '3 × 4 = 12' },
          { say: 'The right part is the same.', eq: '3 × 4 = 12' },
          { say: 'Double 12.', eq: '3 × 8 = 3 × 4 + 3 × 4 = 12 + 12 = 24', pictured: true },
        ],
        why: choice('wC', 'Which number did we break apart?', [
          ['The 3', 'Every part still has 3 rows. We broke the 8 into 4 + 4.'],
          ['The 24', '24 is the product. We broke the 8 into 4 + 4.'],
          ['The 8', true],
        ], { yes: 'Yes! Find the 8 and break it apart, wherever it is.' }),
      },
    ],
  },
  together: {
    intro: "Let's do some together. Use Hint if you get stuck.",
    items: [
      partsFill('g1', 8, 3, 'rows', 4, {
        ask: 'total', labels: 'facts', prompt: 'Finish the last step.',
        hints: ['Each part is 4 × 3 = 12.', 'Double 12: 12 + 12.'],
        yes: 'Yes! 12 + 12 = 24. You doubled the 4s fact!',
      }),
      partsFill('g2', 8, 7, 'rows', 5, {
        hints: ['The top part is 5 rows of 7. The bottom part is 3 rows of 7.', '5 × 7 = 35 and 3 × 7 = 21.'],
        yes: 'Yes! 35 + 21 = 56.',
      }),
      factorsFill('g3', 8, 5, 'rows', 4, { total: true, yes: 'Yes! 4 + 4 = 8 rows, and 20 + 20 = 40.' }),
      partsFill('g4', 6, 8, 'cols', 4, {
        prompt: 'The 8 comes second. Find each part, then add.',
        hints: ['Each part is 6 rows of 4.', '6 × 4 = 24. Double 24.'],
        yes: 'Yes! 24 + 24 = 48.',
      }),
      fact('g5', 8, 4, { ...eight(4), yes: 'Yes! 16 + 16 = 32.' }),
      decompose('g6', 8, 6, ['rows', 4], {
        prompt: 'Your turn! Decompose 8 × 6 any way you like.', model: arr(8, 6),
        hints: ['Break 8 into 4 + 4, or into 5 + 3.', '4 × 6 + 4 × 6. Then add.'],
        show: ['Break 8 into 4 + 4.', '4 × 6 + 4 × 6 = 24 + 24 = 48.'],
      }),
    ],
  },
  try: {
    pass: 16,
    items: [
      // 1-5: understanding
      {
        id: 't1', type: 'fill', prompt: '4 × 7 = 28. Use it to find 8 × 7.', lines: ['8 × 7 = 28 + [x]', '= [t]'], answer: { x: 28, t: 56 },
        hints: ['8 = 4 + 4. So 8 × 7 is two 4 × 7 facts.', 'Double 28: 28 + 28.'],
        mistakes: [{ when: { x: 7 }, say: 'Add the whole 4s fact again: 28, not 7.' }, { when: { x: 4 }, say: 'Add the whole 4s fact again: 28, not 4.' }],
        show: ['8 × 7 = 4 × 7 + 4 × 7.', '28 + 28 = 56.'], yes: 'Yes! 28 + 28 = 56.',
      },
      choice('t2', 'Which facts match this split array?', [
        ['(5 × 4) + (3 × 4)', 'That would be a cut under row 5. This line is under row 4.'],
        ['(8 × 2) + (8 × 2)', 'That cut goes between columns. This line goes between rows.'],
        ['(4 × 4) + (4 × 4)', true],
        ['(4 × 8) + (4 × 8)', 'Each row has 4 dots, not 8. Count the dots in one row.'],
      ], {
        model: arr(8, 4, ['r', 4], 'parts'), pictureMatch: true,
        hints: ['Count the rows above the line and below the line.', 'Each row has 4 dots.'],
        show: ['4 rows are above the line and 4 rows are below it.', 'Each row has 4 dots: (4 × 4) + (4 × 4).'],
        yes: 'Yes! 4 rows of 4 on top and 4 rows of 4 below.',
      }),
      fact('t3', 8, 5, {
        hints: ['Find the 4s fact: 4 × 5 = 20.', 'Double it: 20 + 20.'],
        mistakes: [{ when: { answer: 13 }, say: '8 + 5 is 13, but this is times. Double the 4s fact.' }, { when: { answer: 20 }, say: '20 is the 4s fact. Double it to get the 8s fact.' }],
        show: ['8 × 5 = 4 × 5 + 4 × 5.', '20 + 20 = 40.'],
      }),
      missing('t4', '8 × [x] = 4 × 9 + 4 × 9', { x: 9 }, {
        hints: ['Both parts have 9.', '4 rows of 9 and 4 more rows of 9 make 8 rows of what?'],
        mistakes: [{ when: { x: 36 }, say: 'That is one part. The box needs a factor: 8 × what?' }, { when: { x: 72 }, say: 'That box needs a factor, not the product.' }],
        show: ['4 + 4 = 8, and both parts have 9.', '8 × 9 = 4 × 9 + 4 × 9.'], yes: 'Yes! 8 × 9 = 4 × 9 + 4 × 9.',
      }),
      choice('t5', 'Which fact can you double to find 8 × 6?', [
        ['2 × 6', 'Double 2 × 6 is only 4 × 6. Double 4 × 6 to get 8 × 6.'],
        ['4 × 6', true],
        ['4 × 3', 'Double 4 × 3 is 4 × 6, not 8 × 6.'],
        ['8 × 2', 'Double 8 × 2 is 8 × 4, not 8 × 6.'],
      ], {
        hints: ['8 = 4 + 4. Which fact has 4 and 6?'],
        show: ['8 × 6 = 4 × 6 + 4 × 6.', 'So double 4 × 6 = 24: 24 + 24 = 48.'], yes: 'Yes! Double 4 × 6: 24 + 24 = 48.',
      }),
      // 6-15: practice
      partsFill('t6', 8, 9, 'rows', 4, { hints: ['Each part is 4 rows of 9.', '4 × 9 = 36. Double 36.'] }),
      partsFill('t7', 8, 6, 'rows', 5, { hints: ['Top part: 5 rows of 6. Bottom part: 3 rows of 6.', '5 × 6 = 30 and 3 × 6 = 18.'] }),
      partsFill('t8', 7, 8, 'cols', 4, {
        prompt: 'The 8 comes second. Find each part, then add.',
        hints: ['Each part is 7 rows of 4.', '7 × 4 = 28. Double 28.'],
      }),
      fact('t9', 8, 8, { ...eight(8) }),
      decompose('t10', 8, 7, ['rows', 4], { hints: ['Break 8 into 4 + 4, or into 5 + 3.', '4 × 7 + 4 × 7. Then add.'] }),
      table('t11', 'Double, double, double! Fill in the times 8 column.', ['Number', 'Times 2', 'Times 4', 'Times 8'], [
        ['3', '6', '12', { answer: '8 × 3' }],
        ['5', '10', '20', { answer: '8 × 5' }],
        ['6', '12', '24', { answer: '8 × 6' }],
      ], {
        hints: ['Times 8 is double the times 4 number.', 'For 3: 12 + 12.'],
        retry: 'Check each row: double the times 4 number.',
        show: ['3: 12 + 12 = 24.', '5: 20 + 20 = 40.', '6: 24 + 24 = 48.'],
        yes: 'Yes! Each times 8 number is double the times 4 number.',
      }),
      story('t12', 'A spider has 8 legs. How many legs do 4 spiders have?', 4, 8, {
        hints: ['4 spiders with 8 legs each: 4 × 8.', 'Find 2 × 8 = 16. Double it.'],
        mistakes: [{ when: { answer: 12 }, say: '4 + 8 is 12. Each spider has 8 legs, so multiply.' }, { when: { answer: 16 }, say: '16 is only 2 spiders. Double it for 4 spiders.' }],
        show: ['4 × 8 = 2 × 8 + 2 × 8.', '16 + 16 = 32 legs.'], yes: 'Yes! 32 legs.',
      }),
      choice('t13', 'Which one is equal to 8 × 9?', [
        ['4 × 9 + 3 × 9', '4 and 3 make 7, not 8.'],
        ['5 × 9 + 3 × 9', true],
        ['5 × 9 + 3', 'The second part must be a whole fact: 3 × 9, not 3.'],
        ['8 + 9', '8 × 9 means 8 groups of 9, not 8 + 9.'],
      ], { target: '8 × 9', hints: ['8 = 5 + 3. Look for 5 × 9 and 3 × 9.'], show: ['8 × 9 = 5 × 9 + 3 × 9 = 45 + 27 = 72.'], yes: 'Yes! 45 + 27 = 72.' }),
      missing('t14', '[x] × 8 = 64', { x: 8 }, {
        hints: ['Count by 8s: 8, 16, 24 … Stop at 64.', 'Or: what doubled makes 64? 32. And 4 × 8 = 32.'],
        mistakes: [{ when: { x: 56 }, say: 'That box needs a factor. What times 8 makes 64?' }, { when: { x: 7 }, say: '7 × 8 is 56. One more 8 makes 64.' }],
        show: ['4 × 8 = 32, and 32 + 32 = 64.', 'So 8 × 8 = 64.'], yes: 'Yes! 8 × 8 = 64.',
      }),
      {
        id: 't15', type: 'fill', prompt: 'Break apart the 8 in 8 × 3. Use any two numbers that work.',
        lines: ['8 × 3 = [a] × 3 + [b] × 3'], answer: { a: 4, b: 4 }, open: true, min: 1,
        hints: ['Pick two numbers that add up to 8.', 'Try 4 and 4, or 5 and 3.'],
        show: ['4 + 4 = 8, so 8 × 3 = 4 × 3 + 4 × 3.', '12 + 12 = 24.'],
        retry: 'The two numbers must add up to 8. Each one must be at least 1.',
        yes: 'Yes! Your two parts add up to 8.',
      },
      // 16-20: apply and explain
      choice('t16', 'A student wrote 8 × 7 = 4 × 7 + 3 × 7 = 49. What went wrong?', [
        ['4 and 3 make 7, not 8. Use 4 × 7 + 4 × 7.', true],
        ['Nothing. It is correct.', '8 × 7 is 8 rows of 7. That is 56, not 49.'],
        ['The first part should be 8 × 7.', 'The first part 4 × 7 is fine. The two parts must add up to 8 rows.'],
        ['You should add 8 + 7.', '8 × 7 means 8 groups of 7, not 8 + 7.'],
      ], {
        quotesMistake: true,
        hints: ['Add the two numbers that 8 was broken into.', 'Do 4 and 3 make 8?'],
        show: ['8 = 4 + 4.', '8 × 7 = 4 × 7 + 4 × 7 = 28 + 28 = 56.'], yes: 'Yes! The parts must add up to 8: 4 × 7 + 4 × 7 = 56.',
      }),
      story('t17', 'A parking lot has 8 rows. Each row has 9 cars. How many cars are in the parking lot?', 8, 9, {
        hints: ['8 rows of 9: 8 × 9.', '5 × 9 = 45 and 3 × 9 = 27. Add.'],
        mistakes: [{ when: { answer: 17 }, say: '8 + 9 is 17. There are 8 equal rows, so multiply.' }, { when: { answer: 45 }, say: '45 is only 5 rows. Add the other 3 rows.' }],
        show: ['8 × 9 = 5 × 9 + 3 × 9.', '45 + 27 = 72 cars.'], yes: 'Yes! 72 cars.',
      }),
      choice('t18', 'Two friends find 8 × 6. Friend 1 writes 4 × 6 + 4 × 6. Friend 2 writes 5 × 6 + 3 × 6. Who is right?', [
        ['Only Friend 1', 'Check Friend 2 too: 30 + 18 = 48.'],
        ['Both friends', true],
        ['Only Friend 2', 'Check Friend 1 too: 24 + 24 = 48.'],
        ['Neither', 'Both make 48: 24 + 24 = 48 and 30 + 18 = 48.'],
      ], {
        models: [arr(8, 6, ['r', 4], 'facts'), arr(8, 6, ['r', 5], 'facts')],
        hints: ['Find each friend\'s total.', 'Friend 1: 24 + 24. Friend 2: 30 + 18.'],
        show: ['Friend 1: 24 + 24 = 48.', 'Friend 2: 30 + 18 = 48.', 'Both are right.'],
        yes: 'Yes! 24 + 24 = 48 and 30 + 18 = 48. Different cuts, same product.',
      }),
      choice('t19', 'Is it always true? An 8s fact is double a 4s fact.', [
        ['No, only when the other number is even.', 'It works for every number. 8 × 7 = 28 + 28 = 56.'],
        ['No, it is half.', 'An 8s fact is double, not half. 8 × 3 = 12 + 12 = 24.'],
        ['Yes. 8 rows is 4 rows and 4 more rows.', true],
      ], { hints: ['Try it with 8 × 3. Is 12 + 12 the same as 8 × 3?'], show: ['8 = 4 + 4 for every fact.', 'So an 8s fact is always two 4s facts: double the 4s fact.'], yes: 'Yes! 8 is always 4 + 4.' }),
      story('t20', 'A pack has 8 crayons. How many crayons are in 10 packs?', 10, 8, {
        hints: ['10 packs of 8: 10 × 8.', 'Find the 8. Double the 4s fact: 10 × 4 = 40. 40 + 40.'],
        mistakes: [{ when: { answer: 18 }, say: '10 + 8 is 18. There are 10 equal packs, so multiply.' }, { when: { answer: 40 }, say: '40 is 10 × 4. Double it for 10 × 8.' }],
        show: ['10 × 8 = 10 × 4 + 10 × 4.', '40 + 40 = 80 crayons.'], yes: 'Yes! 80 crayons.',
      }),
    ],
  },
  test: {
    pass: 7,
    items: [
      forTest(fact('x1', 8, 4, { show: ['4 × 4 = 16.', 'Double it: 16 + 16 = 32.'] })),
      forTest(partsFill('x2', 8, 7, 'rows', 4)),
      forTest(missing('x3', '8 × [x] = 5 × 6 + 3 × 6', { x: 6 }, { show: ['Both parts have 6, and 5 + 3 = 8.', '8 × 6 = 5 × 6 + 3 × 6.'] })),
      forTest(choice('x4', 'Which one is equal to 8 × 5?', [
        ['4 × 5 + 4 × 5', true],
        ['4 × 5 + 4', 'The second part must be a whole fact: 4 × 5, not 4.'],
        ['5 × 5 + 2 × 5', '5 and 2 make 7, not 8.'],
        ['8 + 5', '8 × 5 means 8 groups of 5, not 8 + 5.'],
      ], { target: '8 × 5', show: ['8 × 5 = 4 × 5 + 4 × 5 = 20 + 20 = 40.'] })),
      forTest(story('x5', 'A pack has 8 markers. How many markers are in 3 packs?', 3, 8, { show: ['3 packs of 8 is 3 × 8.', '2 × 8 = 16. Add one more 8: 16 + 8 = 24.'] })),
      forTest(decompose('x6', 8, 9, ['rows', 5], { show: ['Break 8 into 5 + 3: 5 × 9 + 3 × 9.', '45 + 27 = 72.'] })),
      forTest(missing('x7', '[x] = 8 × 8', { x: 64 }, { show: ['4 × 8 = 32. Double it: 32 + 32 = 64.'] })),
      forTest(choice('x8', 'Which two facts can you add to find 8 × 7?', [
        ['5 × 7 and 2 × 7', '5 and 2 make 7, not 8.'],
        ['4 × 7 and 3 × 7', '4 and 3 make 7, not 8.'],
        ['5 × 7 and 3', 'The second part must be a whole fact: 3 × 7, not 3.'],
        ['5 × 7 and 3 × 7', true],
      ], { show: ['5 + 3 = 8.', '8 × 7 = 5 × 7 + 3 × 7 = 35 + 21 = 56.'] })),
    ],
  },
  parent: {
    sections: [
      { heading: 'What your child is learning', text: 'Two ways to multiply by 8. Because 8 = 4 + 4, an 8s fact is double the 4s fact: 8 × 6 = 4 × 6 + 4 × 6 = 24 + 24 = 48. Because 8 = 5 + 3, it is also the 5s fact plus the 3s fact: 5 × 6 + 3 × 6 = 30 + 18 = 48.' },
      { heading: 'Try it with real things', list: ['Make 8 rows of 6 cereal pieces. Cover the bottom 4 rows: 24. Uncover them: 24 + 24 = 48.', 'Chant a doubling chain: 3, 6, 12, 24 (times 1, 2, 4, 8).'] },
      { heading: 'Questions to ask', list: ['Where is the 8?', 'What is the 4s fact? What is double that?', 'Which way is easier for you: 4 + 4 or 5 + 3?'] },
      { heading: 'Common mistakes', list: ['Doubling the 2s fact only once (that gives the 4s fact, not the 8s fact).', 'Breaking 8 into numbers that do not add up to 8, such as 4 and 3.', 'Adding the factors: 8 + 6 = 14.'] },
      { heading: 'A note on notation', text: 'Some books write the facts without ( ) and some with ( ). Both mean the same thing. Study Scoop uses original practice questions; it never copies the textbook.' },
    ],
  },
};
