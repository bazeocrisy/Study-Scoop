// Lesson 5-5: Use Properties to Multiply by 8 (double the 4s fact, or the 5s fact plus the 3s fact). Original content.
import { F, arr, choice, decompose, fact, factorsFill, forTest, missing, partsFill, story, table } from '../lib.mjs';

/** Hints and steps for 8 × n: double the 4s fact. */
function eight(n, first = true) {
  const four = first ? F(4, n) : F(n, 4);
  const whole = first ? F(8, n) : F(n, 8);
  return {
    hints: [`Find the 4s fact: ${four}.`, 'Then double it: add the 4s fact to itself.'],
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
    '8s fact': 'a fact times 8, like 8 × 7',
    double: 'add a number to itself, like 28 + 28',
  },
  learn: {
    screens: [
      {
        title: 'Ready? Warm-up',
        item: fact('r1', 4, 7, {
          hints: ['Find the 2s fact: 2 × 7.', 'Then double it: add the 2s fact to itself.'],
          mistakes: [{ when: { answer: 11 }, say: '4 + 7 is 11, but this is times. Double the 2s fact.' }, { when: { answer: 14 }, say: '14 is the 2s fact. Double it.' }],
          yes: 'Yes! 4 × 7 = 28.',
        }),
      },
      {
        title: 'Ready? One more',
        item: {
          id: 'r2', type: 'number', prompt: 'Double 28 = ?', answer: '28 + 28',
          hints: ['Double means add the number to itself: 28 + 28.', 'Add the tens (20 + 20). Then add the ones (8 + 8). Put them together.'],
          mistakes: [{ when: { answer: 30 }, say: 'That is 28 + 2. Double 28 means 28 + 28.' }, { when: { answer: 46 }, say: 'Check the ones: 8 + 8 is 16. Regroup 10 ones as 1 ten.' }],
          yes: 'Yes! 28 + 28 = 56.',
        },
      },
      {
        title: 'Way 1: 8 is 4 + 4',
        text: [
          '8 × 7 means 8 rows of 7.',
          '8 is 4 + 4. Cut under row 4.',
          'Each part is the 4s fact: 4 × 7 = 28. Double it: 28 + 28 = 56.',
        ],
        model: arr(8, 7, ['r', 4], 'facts'),
        caption: '8 × 7 = 4 × 7 + 4 × 7',
        words: ['4s fact', 'double'],
      },
      {
        title: 'Way 2: 8 is 5 + 3',
        text: [
          '8 is also 5 + 3. Cut under row 5.',
          'The top part is the 5s fact: 5 × 7 = 35. The bottom part is the 3s fact: 3 × 7 = 21.',
          'Add them: 35 + 21 = 56. Same answer!',
        ],
        model: arr(8, 7, ['r', 5], 'facts'),
        caption: '8 × 7 = 5 × 7 + 3 × 7',
      },
      {
        title: 'The 8s strategies',
        teacher: true,
        text: [
          'Find the 8. Double the 4s fact.',
          'Or add the 5s fact and the 3s fact. Pick the facts you know best.',
        ],
        pairs: ['8 × 7 = (4 × 7) + (4 × 7)', '8 × 7 = (5 × 7) + (3 × 7)'],
      },
      {
        title: 'Check',
        item: choice('l1', 'Which one is equal to 8 × 9?', [
          ['4 × 9 + 3 × 9', '4 and 3 make 7, not 8.'],
          ['4 × 9 + 4', 'The second part must be a whole fact: 4 × 9, not 4.'],
          ['8 + 9', '8 × 9 means 8 groups of 9, not 8 + 9.'],
          ['4 × 9 + 4 × 9', true],
        ], { target: '8 × 9', yes: 'Yes! 4 × 9 + 4 × 9 is 36 + 36. That is 72.' }),
      },
    ],
  },
  watch: {
    takeaway: '8s facts: double the 4s fact, or add the 5s fact and the 3s fact.',
    examples: [
      {
        title: 'Example A: 8 × 7 as 4 + 4',
        model: arr(8, 7, ['r', 4], 'facts'),
        steps: [
          { say: 'Problem: 8 × 7. That is 8 rows of 7.', model: arr(8, 7) },
          { say: 'Break 8 into 4 + 4. Cut under row 4.', model: arr(8, 7, ['r', 4], 'parts') },
          { say: 'The top part is the 4s fact.', eq: '4 × 7 = 28' },
          { say: 'The bottom part is the same 4s fact.', eq: '4 × 7 = 28' },
          { say: 'Double 28.', eq: '8 × 7 = 4 × 7 + 4 × 7 = 28 + 28 = 56', pictured: true, word: 'double' },
          { say: 'Check the array. 8 rows of 7 is 56 dots.', eq: '8 × 7 = 56' },
        ],
        why: choice('wA', 'Why can we double 4 × 7 to find 8 × 7?', [
          ['Because 7 is odd.', 'Odd or even does not matter. Look at how the 8 rows were cut.'],
          ['8 rows is 4 rows and 4 more rows.', true],
          ['Because 4 is the answer.', 'The answer is 56, not 4. Look at how the 8 rows were cut.'],
        ], { yes: 'Yes! 4 + 4 = 8, so two 4s facts make the 8s fact.' }),
      },
      {
        title: 'Example B: 8 × 7 as 5 + 3',
        model: arr(8, 7, ['r', 5], 'facts'),
        steps: [
          { say: 'Now break 8 into 5 + 3. Cut under row 5.', model: arr(8, 7, ['r', 5], 'parts') },
          { say: 'The top part is the 5s fact.', eq: '5 × 7 = 35' },
          { say: 'The bottom part is the 3s fact.', eq: '3 × 7 = 21' },
          { say: 'Add the two parts. Same answer as before!', eq: '8 × 7 = 5 × 7 + 3 × 7 = 35 + 21 = 56', pictured: true },
        ],
        why: choice('wB', 'Both ways make 56. Why?', [
          ['We moved the cut. It is still 8 rows of 7.', true],
          ['We added more dots.', 'No dots were added. We only moved the cut.'],
          ['5 and 3 are odd numbers.', 'That does not matter. We only moved the cut, so the dots stay the same.'],
        ], { yes: 'Yes! The cut moved, but the dots did not change.' }),
        another: {
          text: 'Two cuts, the same 56 dots.',
          models: [arr(8, 7, ['r', 4], 'facts'), arr(8, 7, ['r', 5], 'facts')],
        },
      },
      {
        title: 'Example C: the 8 comes second',
        model: arr(9, 8, ['c', 4], 'facts'),
        steps: [
          { say: 'This time the 8 comes second. 9 × 8 is 9 rows of 8.', model: arr(9, 8) },
          { say: 'Find the 8. Break it into 4 + 4. Cut between the columns.', model: arr(9, 8, ['c', 4], 'parts') },
          { say: 'The left part is 9 rows of 4.', eq: '9 × 4 = 36' },
          { say: 'The right part is the same.', eq: '9 × 4 = 36' },
          { say: 'Double 36.', eq: '9 × 8 = 9 × 4 + 9 × 4 = 36 + 36 = 72', pictured: true },
        ],
        why: choice('wC', 'Which number did we break apart?', [
          ['The 9', 'Every part still has 9 rows. Look at what the line cuts.'],
          ['The 72', '72 is the product. Look at what the line cuts.'],
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
      partsFill('g2', 8, 10, 'rows', 5, {
        hints: ['The top part is 5 rows of 10. The bottom part is 3 rows of 10.'],
        yes: 'Yes! 50 + 30 = 80.',
      }),
      factorsFill('g3', 8, 5, 'rows', 4, { total: true, yes: 'Yes! 4 + 4 = 8 rows, and 20 + 20 = 40.' }),
      partsFill('g4', 10, 8, 'cols', 4, {
        prompt: 'The 8 comes second. Find each part, then add.',
        hints: ['Each part is 10 rows of 4.', 'Find 10 × 4. Then double it.'],
        yes: 'Yes! 40 + 40 = 80.',
      }),
      fact('g5', 8, 4, { ...eight(4), yes: 'Yes! 16 + 16 = 32.' }),
      decompose('g6', 8, 2, ['rows', 4], {
        prompt: 'Your turn! Decompose 8 × 2 any way you like.', model: arr(8, 2),
        hints: ['Break 8 into 4 + 4, or into 5 + 3.', 'Write two facts that keep the 2. Then add.'],
        show: ['Break 8 into 4 + 4.', '4 × 2 + 4 × 2 = 8 + 8 = 16.'],
      }),
    ],
  },
  try: {
    pass: 16,
    items: [
      // 1-5: understanding
      {
        id: 't1', type: 'fill', prompt: '4 × 9 = 36. Use it to find 8 × 9.', lines: ['8 × 9 = 36 + [x]', '= [t]'], answer: { x: 36, t: 72 },
        hints: ['8 = 4 + 4. So 8 × 9 is two 4 × 9 facts.', 'What do you add to 36 to double it?'],
        mistakes: [{ when: { x: 9 }, say: 'Add the whole 4s fact again: 36, not 9.' }, { when: { x: 4 }, say: 'Add the whole 4s fact again: 36, not 4.' }],
        show: ['8 × 9 = 4 × 9 + 4 × 9.', '36 + 36 = 72.'], yes: 'Yes! 36 + 36 = 72.',
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
      fact('t3', 8, 5, { ...eight(5) }),
      missing('t4', '8 × [x] = 4 × 9 + 4 × 9', { x: 9 }, {
        hints: ['Which number is in both parts?', 'Each part keeps the same number. 4 rows and 4 more rows make 8 rows of it.'],
        mistakes: [{ when: { x: 36 }, say: 'That is one part. The box needs a factor: 8 × what?' }, { when: { x: 72 }, say: 'That box needs a factor, not the product.' }, { when: { x: 4 }, say: '4 is how many rows are in each part. Which number does each part keep?' }],
        show: ['4 + 4 = 8, and both parts have 9.', '8 × 9 = 4 × 9 + 4 × 9.'], yes: 'Yes! 8 × 9 = 4 × 9 + 4 × 9.',
      }),
      choice('t5', 'Which fact can you double to find 8 × 7?', [
        ['2 × 7', 'Doubling 2 × 7 makes a 4s fact, not 8 × 7. Which fact doubles to make 8 × 7?'],
        ['4 × 7', true],
        ['4 × 2', 'Double 4 × 2 is 4 × 4, not 8 × 7.'],
        ['8 × 2', 'Double 8 × 2 is 8 × 4, not 8 × 7.'],
      ], {
        hints: ['8 = 4 + 4. Which 4s fact keeps the 7?'],
        show: ['8 × 7 = 4 × 7 + 4 × 7.', 'So double 4 × 7 = 28: 28 + 28 = 56.'], yes: 'Yes! Double 4 × 7: 28 + 28 = 56.',
      }),
      // 6-15: practice
      partsFill('t6', 8, 10, 'rows', 4, { hints: ['Each part is 4 rows of 10.'] }),
      partsFill('t7', 8, 3, 'rows', 5, { hints: ['Top part: 5 rows of 3. Bottom part: 3 rows of 3.'] }),
      partsFill('t8', 7, 8, 'cols', 4, {
        prompt: 'The 8 comes second. Find each part, then add.',
        hints: ['Each part is 7 rows of 4.'],
      }),
      fact('t9', 8, 8, { ...eight(8) }),
      decompose('t10', 8, 7, ['rows', 4], { hints: ['Break 8 into 4 + 4, or into 5 + 3.', 'Write two facts that keep the 7. Then add.'] }),
      table('t11', 'Each times 8 number is double the times 4 number. Fill in the last column.', ['Number', 'Times 4', 'Times 8'], [
        ['7', '28', { answer: '8 × 7' }],
        ['9', '36', { answer: '8 × 9' }],
        ['10', '40', { answer: '8 × 10' }],
      ], {
        hints: ['Times 8 is double the times 4 number.', 'For 7: what is 28 + 28?'],
        retry: 'Check each row: double the times 4 number.',
        show: ['7: 28 + 28 = 56.', '9: 36 + 36 = 72.', '10: 40 + 40 = 80.'],
        yes: 'Yes! Each times 8 number is double the times 4 number.',
      }),
      story('t12', 'A spider has 8 legs. How many legs do 4 spiders have?', 4, 8, {
        hints: ['4 spiders with 8 legs each: 4 × 8.', 'Find 2 × 8 = 16. Double it.'],
        mistakes: [{ when: { answer: 12 }, say: '4 + 8 is 12. Each spider has 8 legs, so multiply.' }, { when: { answer: 16 }, say: '16 is only 2 spiders. Double it for 4 spiders.' }],
        show: ['4 × 8 = 2 × 8 + 2 × 8.', '16 + 16 = 32 legs.'], yes: 'Yes! 32 legs.',
      }),
      choice('t13', 'Which one is equal to 8 × 2?', [
        ['4 × 2 + 3 × 2', '4 and 3 make 7, not 8.'],
        ['5 × 2 + 3 × 2', true],
        ['5 × 2 + 3', 'The second part must be a whole fact: 3 × 2, not 3.'],
        ['8 + 2', '8 × 2 means 8 groups of 2, not 8 + 2.'],
      ], { target: '8 × 2', hints: ['Break 8 into two numbers that add up to 8.', 'Both parts must keep the 2.'], show: ['5 + 3 = 8.', '8 × 2 = 5 × 2 + 3 × 2 = 10 + 6 = 16.'], yes: 'Yes! 10 + 6 = 16.' }),
      missing('t14', '[x] × 8 = 64', { x: 8 }, {
        hints: ['Count by 8s: 8, 16, 24 … Stop at 64.', 'Or: what number doubled makes 64? Which 4s fact makes that number?'],
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
        hints: ['Add the two numbers that 8 was broken into.'],
        show: ['8 = 4 + 4.', '8 × 7 = 4 × 7 + 4 × 7 = 28 + 28 = 56.'], yes: 'Yes! The parts must add up to 8: 4 × 7 + 4 × 7 = 56.',
      }),
      story('t17', 'A garden has 9 rows. Each row has 8 bean plants. How many bean plants are there?', 9, 8, {
        hints: ['9 rows of 8: 9 × 8.', 'Find the 8. Break it into 4 + 4: find 9 × 4, then double it.'],
        mistakes: [{ when: { answer: 17 }, say: '9 + 8 is 17. There are 9 equal rows, so multiply.' }, { when: { answer: 36 }, say: '36 is 9 × 4, only half. Double it for 9 × 8.' }],
        show: ['9 × 8 = 9 × 4 + 9 × 4.', '36 + 36 = 72 plants.'], yes: 'Yes! 72 bean plants.',
      }),
      choice('t18', 'Two friends find 8 × 4. Friend 1 writes 4 × 4 + 4 × 4. Friend 2 writes 5 × 4 + 3 × 4. Who is right?', [
        ['Only Friend 1', 'Check Friend 2 too: 20 + 12 = 32.'],
        ['Both friends', true],
        ['Only Friend 2', 'Check Friend 1 too: 16 + 16 = 32.'],
        ['Neither', 'Both make 32: 16 + 16 = 32 and 20 + 12 = 32.'],
      ], {
        models: [arr(8, 4, ['r', 4], 'parts'), arr(8, 4, ['r', 5], 'parts')],
        hints: ['Find each friend\'s total.', 'Friend 1 doubles a 4s fact. Friend 2 adds a 5s fact and a 3s fact.'],
        show: ['Friend 1: 16 + 16 = 32.', 'Friend 2: 20 + 12 = 32.', 'Both are right.'],
        yes: 'Yes! 16 + 16 = 32 and 20 + 12 = 32. Different cuts, same product.',
      }),
      choice('t19', 'Ben says: "Every 8s fact is double a 4s fact." Is Ben right?', [
        ['No, only when the other number is even.', 'It works for every number. 8 × 7 = 28 + 28 = 56.'],
        ['No, it is half.', 'An 8s fact is double, not half. 8 × 3 = 12 + 12 = 24.'],
        ['Yes. 8 rows is 4 rows and 4 more rows.', true],
      ], { hints: ['Try it with 8 × 3. Is 12 + 12 the same as 8 × 3?'], show: ['8 = 4 + 4 for every fact.', 'So an 8s fact is always two 4s facts: double the 4s fact.'], yes: 'Yes! 8 is always 4 + 4.' }),
      story('t20', 'A pack has 8 crayons. How many crayons are in 10 packs?', 10, 8, {
        hints: ['10 packs of 8: 10 × 8.', 'Find the 8. Find the 4s fact with 10, then double it.'],
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
      forTest(missing('x3', '8 × [x] = 5 × 4 + 3 × 4', { x: 4 }, { show: ['Both parts have 4, and 5 + 3 = 8.', '8 × 4 = 5 × 4 + 3 × 4.'] })),
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
      { heading: 'What your child is learning', text: 'Two ways to multiply by 8. Because 8 = 4 + 4, an 8s fact is double the 4s fact: 8 × 7 = 4 × 7 + 4 × 7 = 28 + 28 = 56. Because 8 = 5 + 3, it is also the 5s fact plus the 3s fact: 5 × 7 + 3 × 7 = 35 + 21 = 56.' },
      { heading: 'Try it with real things', list: ['Make 8 rows of 7 cereal pieces. Cover the bottom 4 rows: 28. Uncover them: 28 + 28 = 56.', 'Chant a doubling chain: 3, 6, 12, 24 (times 1, 2, 4, 8).'] },
      { heading: 'Questions to ask', list: ['Where is the 8?', 'What is the 4s fact? What is double that?', 'Which way is easier for you: 4 + 4 or 5 + 3?'] },
      { heading: 'Common mistakes', list: ['Doubling the 2s fact only once (that gives the 4s fact, not the 8s fact).', 'Breaking 8 into numbers that do not add up to 8, such as 4 and 3.', 'Adding the factors: 8 + 7 = 15.'] },
      { heading: 'A note on notation', text: 'Some books write the facts without ( ) and some with ( ). Both mean the same thing. Study Scoop uses original practice questions; it never copies the textbook.' },
    ],
  },
};
