// Lesson 5-4: Use Properties to Multiply by 6 (5s fact + one more group, or double the 3s fact). Original content.
import { F, arr, choice, decompose, fact, factorsFill, forTest, missing, partsFill, story, table } from '../lib.mjs';

/** Hints and steps for 6 × n with the 5s fact plus one more group. */
function six(n, first = true) {
  const five = first ? F(5, n) : F(n, 5);
  const one = first ? F(1, n) : F(n, 1);
  const whole = first ? F(6, n) : F(n, 6);
  return {
    hints: [`Use the 5s fact: ${five} = ${5 * n}.`, `Add one more group of ${n}: ${5 * n} + ${n}.`],
    show: [`6 = 5 + 1, so ${whole} = ${five} + ${one}.`, `${5 * n} + ${n} = ${6 * n}.`, `So ${whole} = ${6 * n}.`],
    mistakes: [
      ...(6 + n !== 5 * n ? [{ when: { answer: 6 + n }, say: `6 + ${n} is ${6 + n}, but this is times. Use the 5s fact, then add one more group.` }] : []),
      { when: { answer: 5 * n }, say: `${5 * n} is the 5s fact. Add one more group of ${n}.` },
    ],
  };
}

export default {
  id: '5-4',
  title: 'Use Properties to Multiply by 6',
  goal: 'I can multiply by 6: the 5s fact plus one more group, or double the 3s fact.',
  catchAll: 'Find the 6. Use the 5s fact and add one more group, or double the 3s fact.',
  teacher: [{ term: 'Distributive Property', def: 'a multiplication fact can be broken apart into the sum of two other related facts' }],
  glossary: {
    '5s fact': 'a fact times 5, like 5 × 7',
    '3s fact': 'a fact times 3, like 3 × 7',
    double: 'add a number to itself, like 21 + 21',
  },
  learn: {
    screens: [
      {
        title: 'Ready? Warm-up',
        item: fact('r1', 5, 7, {
          hints: ['Count by 5s seven times: 5, 10, 15 …', '5 × 7 is 7 fives.'],
          mistakes: [{ when: { answer: 12 }, say: '5 + 7 is 12, but this is times. Count by 5s seven times.' }],
          yes: 'Yes! 5 × 7 = 35.',
        }),
      },
      {
        title: 'Ready? One more',
        item: fact('r2', 3, 7, {
          hints: ['Use the 3s strategy: 2 × 7 + 1 × 7.', '14 + 7.'],
          mistakes: [{ when: { answer: 10 }, say: '3 + 7 is 10, but this is times. Double 7, then add 7 once more.' }],
          yes: 'Yes! 3 × 7 = 21.',
        }),
      },
      {
        title: 'Way 1: 6 is 5 + 1',
        text: [
          '6 × 7 means 6 rows of 7.',
          '6 is 5 + 1. Cut under row 5.',
          'The top part is the 5s fact: 5 × 7 = 35. The bottom part is one more group: 1 × 7 = 7.',
          'Add them: 35 + 7 = 42.',
        ],
        model: arr(6, 7, ['r', 5], 'facts'),
        caption: '6 × 7 = 5 × 7 + 1 × 7',
        words: ['5s fact'],
      },
      {
        title: 'Way 2: 6 is 3 + 3',
        text: [
          '6 is also 3 + 3. Cut under row 3.',
          'Each part is the 3s fact: 3 × 7 = 21.',
          'Double it: 21 + 21 = 42. Same answer! The dots did not change, only the cut.',
        ],
        model: arr(6, 7, ['r', 3], 'facts'),
        caption: '6 × 7 = 3 × 7 + 3 × 7',
        words: ['3s fact', 'double'],
      },
      {
        title: 'The 6s strategies',
        teacher: true,
        text: [
          'Find the 6. Use the 5s fact, then add one more group.',
          'Or double the 3s fact. Both ways use the Distributive Property.',
        ],
        pairs: ['6 × 7 = (5 × 7) + (1 × 7)', '6 × 7 = (3 × 7) + (3 × 7)'],
      },
      {
        title: 'Check',
        item: choice('l1', 'Which one is equal to 6 × 8?', [
          ['5 × 8 + 1', 'The second part must be a whole fact: 1 × 8, not 1.'],
          ['3 × 8 + 2 × 8', '3 and 2 make 5, not 6.'],
          ['5 × 8 + 1 × 8', true],
          ['6 + 8', '6 × 8 means 6 groups of 8, not 6 + 8.'],
        ], { target: '6 × 8', yes: 'Yes! 5 × 8 + 1 × 8 is 40 + 8. That is 48.' }),
      },
    ],
  },
  watch: {
    takeaway: '6s facts: the 5s fact plus one more group, or double the 3s fact.',
    examples: [
      {
        title: 'Example A: 6 × 7 as 5 + 1',
        model: arr(6, 7, ['r', 5], 'facts'),
        steps: [
          { say: 'Problem: 6 × 7. That is 6 rows of 7.', model: arr(6, 7) },
          { say: 'Break 6 into 5 + 1. Cut under row 5.', model: arr(6, 7, ['r', 5], 'parts') },
          { say: 'The top part is the 5s fact.', eq: '5 × 7 = 35' },
          { say: 'The bottom part is one more group of 7.', eq: '1 × 7 = 7' },
          { say: 'Add the two parts.', eq: '6 × 7 = 5 × 7 + 1 × 7 = 35 + 7 = 42', pictured: true },
        ],
        why: choice('wA', 'Why is the bottom part only 7?', [
          ['We took away 35.', 'Nothing was taken away. The bottom part is 1 row of 7.'],
          ['7 is the answer.', 'The answer is 42. The bottom part is 1 row of 7.'],
          ['It is 1 row of 7.', true],
        ], { yes: 'Yes! The bottom part is one more group of 7.' }),
      },
      {
        title: 'Example B: 6 × 7 as 3 + 3',
        model: arr(6, 7, ['r', 3], 'facts'),
        steps: [
          { say: 'Now break 6 into 3 + 3. Cut under row 3.', model: arr(6, 7, ['r', 3], 'parts') },
          { say: 'The top part is the 3s fact.', eq: '3 × 7 = 21' },
          { say: 'The bottom part is the same 3s fact.', eq: '3 × 7 = 21' },
          { say: 'Double 21.', eq: '6 × 7 = 3 × 7 + 3 × 7 = 21 + 21 = 42', pictured: true, word: 'double' },
        ],
        why: choice('wB', 'Both ways make 42. Why?', [
          ['We added more dots.', 'No dots were added. We only moved the cut.'],
          ['We moved the cut. It is still 6 rows of 7.', true],
          ['3 is bigger than 5.', '3 is smaller than 5. We only moved the cut, so the dots stay the same.'],
        ], { yes: 'Yes! You can cut in a different place. The product stays the same.' }),
        another: {
          text: 'Two cuts, the same 42 dots.',
          models: [arr(6, 7, ['r', 5], 'facts'), arr(6, 7, ['r', 3], 'facts')],
        },
      },
      {
        title: 'Example C: the 6 comes second',
        model: arr(4, 6, ['c', 5], 'facts'),
        steps: [
          { say: 'This time the 6 comes second. 4 × 6 is 4 rows of 6.', model: arr(4, 6) },
          { say: 'Find the 6. Break it into 5 + 1. Cut between the columns.', model: arr(4, 6, ['c', 5], 'parts') },
          { say: 'The left part is 4 rows of 5.', eq: '4 × 5 = 20' },
          { say: 'The right part is 4 rows of 1.', eq: '4 × 1 = 4' },
          { say: 'Add the two parts.', eq: '4 × 6 = 4 × 5 + 4 × 1 = 20 + 4 = 24', pictured: true },
        ],
        why: choice('wC', 'Which number did we break apart?', [
          ['The 4', 'Every part still has 4 rows. We broke the 6 into 5 + 1.'],
          ['The 6', true],
          ['The 24', '24 is the product. We broke the 6 into 5 + 1.'],
        ], { yes: 'Yes! Find the 6 and break it apart, wherever it is.' }),
      },
    ],
  },
  together: {
    intro: "Let's do some together. Use Hint if you get stuck.",
    items: [
      partsFill('g1', 6, 4, 'rows', 5, {
        ask: 'total', labels: 'facts', prompt: 'Finish the last step.',
        hints: ['The top part is 5 × 4 = 20.', 'Add one more group of 4: 20 + 4.'],
        yes: 'Yes! 20 + 4 = 24. You used the 5s fact!',
      }),
      partsFill('g2', 6, 8, 'rows', 3, {
        hints: ['Each part is 3 rows of 8.', '3 × 8 = 24. Double 24: 24 + 24.'],
        yes: 'Yes! 24 + 24 = 48. You doubled the 3s fact!',
      }),
      factorsFill('g3', 6, 9, 'rows', 5, { total: true, yes: 'Yes! 5 + 1 = 6 rows, and 45 + 9 = 54.' }),
      partsFill('g4', 7, 6, 'cols', 5, {
        prompt: 'The 6 comes second. Find each part, then add.',
        hints: ['The left part is 7 rows of 5.', '7 × 5 = 35. Add one more group of 7.'],
        yes: 'Yes! 35 + 7 = 42.',
      }),
      fact('g5', 6, 6, { ...six(6), yes: 'Yes! 30 + 6 = 36.' }),
      decompose('g6', 6, 8, ['rows', 5], {
        prompt: 'Your turn! Decompose 6 × 8 any way you like.', model: arr(6, 8),
        hints: ['Break 6 into 5 + 1, or into 3 + 3.', '5 × 8 + 1 × 8. Then add.'],
        show: ['Break 6 into 5 + 1.', '5 × 8 + 1 × 8 = 40 + 8 = 48.'],
      }),
    ],
  },
  try: {
    pass: 16,
    items: [
      // 1-5: understanding
      {
        id: 't1', type: 'fill', prompt: '3 × 9 = 27. Use it to find 6 × 9.', lines: ['6 × 9 = 27 + [x]', '= [t]'], answer: { x: 27, t: 54 },
        hints: ['6 = 3 + 3. So 6 × 9 is two 3 × 9 facts.', 'Double 27: 27 + 27.'],
        mistakes: [{ when: { x: 9 }, say: 'Add the whole 3s fact again: 27, not 9.' }, { when: { x: 3 }, say: 'Add the whole 3s fact again: 27, not 3.' }],
        show: ['6 × 9 = 3 × 9 + 3 × 9.', '27 + 27 = 54.'], yes: 'Yes! 27 + 27 = 54.',
      },
      choice('t2', 'Which facts match this split array?', [
        ['(3 × 5) + (3 × 5)', 'That would be a cut under row 3. This line is under row 5.'],
        ['(5 × 5) + (1 × 5)', true],
        ['(6 × 4) + (6 × 1)', 'That cut goes between columns. This line goes between rows.'],
        ['(5 × 6) + (1 × 6)', 'Each row has 5 dots, not 6. Count the dots in one row.'],
      ], {
        model: arr(6, 5, ['r', 5], 'parts'), pictureMatch: true,
        hints: ['Count the rows above the line and below the line.', 'Each row has 5 dots.'],
        show: ['5 rows are above the line and 1 row is below it.', 'Each row has 5 dots: (5 × 5) + (1 × 5).'],
        yes: 'Yes! 5 rows of 5 on top and 1 row of 5 below.',
      }),
      fact('t3', 6, 5, { ...six(5) }),
      missing('t4', '6 × [x] = 5 × 8 + 1 × 8', { x: 8 }, {
        hints: ['Both parts have 8.', '5 rows of 8 and 1 more row of 8 make 6 rows of what?'],
        mistakes: [{ when: { x: 40 }, say: 'That is one part. The box needs a factor: 6 × what?' }, { when: { x: 48 }, say: 'That box needs a factor, not the product.' }],
        show: ['5 + 1 = 6, and both parts have 8.', '6 × 8 = 5 × 8 + 1 × 8.'], yes: 'Yes! 6 × 8 = 5 × 8 + 1 × 8.',
      }),
      choice('t5', 'Which two facts can you add to find 6 × 4?', [
        ['3 × 4 and 2 × 4', '3 and 2 make 5, not 6.'],
        ['5 × 4 and 1 × 4', true],
        ['5 × 4 and 1', 'The second part must be a whole fact: 1 × 4, not 1.'],
        ['4 × 4 and 1 × 4', '4 and 1 make 5, not 6.'],
      ], {
        hints: ['The two numbers you break 6 into must add up to 6.'],
        show: ['5 + 1 = 6.', '6 × 4 = 5 × 4 + 1 × 4 = 20 + 4 = 24.'], yes: 'Yes! 20 + 4 = 24.',
      }),
      // 6-15: practice
      partsFill('t6', 6, 7, 'rows', 5, { hints: ['Top part: 5 rows of 7.', 'Bottom part: 1 row of 7. Then add.'] }),
      partsFill('t7', 6, 9, 'rows', 3, { hints: ['Each part is 3 rows of 9.', '3 × 9 = 27. Double 27.'] }),
      partsFill('t8', 8, 6, 'cols', 5, {
        prompt: 'The 6 comes second. Find each part, then add.',
        hints: ['Left part: 8 rows of 5.', '8 × 5 = 40. Add one more group of 8.'],
      }),
      fact('t9', 6, 8, { ...six(8) }),
      decompose('t10', 6, 9, ['rows', 5], { hints: ['Break 6 into 5 + 1, or into 3 + 3.', '5 × 9 + 1 × 9. Then add.'] }),
      {
        id: 't11', type: 'fill', prompt: 'Break apart the 6 in 6 × 4. Use any two numbers that work.',
        lines: ['6 × 4 = [a] × 4 + [b] × 4'], answer: { a: 5, b: 1 }, open: true, min: 1,
        hints: ['Pick two numbers that add up to 6.', 'Try 5 and 1, or 3 and 3.'],
        show: ['5 + 1 = 6, so 6 × 4 = 5 × 4 + 1 × 4.', '20 + 4 = 24.'],
        retry: 'The two numbers must add up to 6. Each one must be at least 1.',
        yes: 'Yes! Your two parts add up to 6.',
      },
      story('t12', 'A muffin pan has 6 rows. Each row holds 4 muffins. How many muffins fit in the pan?', 6, 4, {
        model: arr(6, 4),
        hints: ['6 rows of 4: 6 × 4.', 'Use the 5s fact: 5 × 4 = 20. Add one more row of 4.'],
        mistakes: [{ when: { answer: 10 }, say: '6 + 4 is 10. There are 6 rows of 4, so multiply.' }, { when: { answer: 20 }, say: '20 is only 5 rows. Add the last row of 4.' }],
        show: ['6 × 4 = 5 × 4 + 1 × 4.', '20 + 4 = 24 muffins.'], yes: 'Yes! 24 muffins.',
      }),
      choice('t13', 'Which one is equal to 6 × 9?', [
        ['5 × 9 + 1', 'The second part must be a whole fact: 1 × 9, not 1.'],
        ['5 × 9 + 1 × 9', true],
        ['3 × 9 + 2 × 9', '3 and 2 make 5, not 6.'],
        ['6 + 9', '6 × 9 means 6 groups of 9, not 6 + 9.'],
      ], { target: '6 × 9', hints: ['6 = 5 + 1. Look for 5 × 9 and 1 × 9.'], show: ['6 × 9 = 5 × 9 + 1 × 9 = 45 + 9 = 54.'], yes: 'Yes! 45 + 9 = 54.' }),
      missing('t14', '[x] × 6 = 42', { x: 7 }, {
        hints: ['Count by 6s: 6, 12, 18 … Stop at 42.', 'Or: 5 × 6 = 30. How many more 6s make 42?'],
        mistakes: [{ when: { x: 36 }, say: 'That box needs a factor. What times 6 makes 42?' }, { when: { x: 6 }, say: '6 × 6 is 36. One more 6 makes 42.' }],
        show: ['5 × 6 = 30. 30 + 6 + 6 = 42.', 'That is 7 groups of 6, so 7 × 6 = 42.'], yes: 'Yes! 7 × 6 = 42.',
      }),
      table('t15', 'Double the 3s fact to fill in the times 6 column.', ['Number', 'Times 3', 'Times 6'], [
        ['4', '12', { answer: '6 × 4' }],
        ['7', '21', { answer: '6 × 7' }],
        ['9', '27', { answer: '6 × 9' }],
      ], {
        hints: ['Times 6 is double the times 3 number.', 'For 4: 12 + 12.'],
        retry: 'Check each row: double the times 3 number.',
        show: ['4: 12 + 12 = 24.', '7: 21 + 21 = 42.', '9: 27 + 27 = 54.'],
        yes: 'Yes! Each times 6 number is double the times 3 number.',
      }),
      // 16-20: apply and explain
      choice('t16', 'A student wrote 6 × 8 = 5 × 8 + 1 = 41. What went wrong?', [
        ['Nothing. It is correct.', '6 × 8 is 6 rows of 8. That is 48, not 41.'],
        ['The second part should be 1 × 8, not 1.', true],
        ['The first part should be 6 × 8.', 'The first part 5 × 8 is fine. The second part lost its 8.'],
        ['You should add 6 + 8.', '6 × 8 means 6 groups of 8, not 6 + 8.'],
      ], {
        quotesMistake: true,
        hints: ['Both parts must be whole facts.', 'Is "1" a whole fact like 1 × 8?'],
        show: ['6 × 8 = 5 × 8 + 1 × 8.', '40 + 8 = 48.'], yes: 'Yes! 6 × 8 = 5 × 8 + 1 × 8 = 40 + 8 = 48.',
      }),
      story('t17', 'A soccer team has 6 players on the field. How many players are on the field for 9 teams?', 9, 6, {
        hints: ['9 teams of 6 players: 9 × 6.', 'Find the 6. Use 9 × 5 = 45, then add one more group of 9.'],
        mistakes: [{ when: { answer: 15 }, say: '9 + 6 is 15. There are 9 equal teams, so multiply.' }, { when: { answer: 45 }, say: '45 is 9 × 5. Add one more group of 9.' }],
        show: ['9 × 6 = 9 × 5 + 9 × 1.', '45 + 9 = 54 players.'], yes: 'Yes! 54 players.',
      }),
      choice('t18', 'Two friends find 6 × 7. Friend 1 writes 5 × 7 + 1 × 7. Friend 2 writes 3 × 7 + 3 × 7. Who is right?', [
        ['Only Friend 1', 'Check Friend 2 too: 21 + 21 = 42.'],
        ['Only Friend 2', 'Check Friend 1 too: 35 + 7 = 42.'],
        ['Both friends', true],
        ['Neither', 'Both make 42: 35 + 7 = 42 and 21 + 21 = 42.'],
      ], {
        models: [arr(6, 7, ['r', 5], 'facts'), arr(6, 7, ['r', 3], 'facts')],
        hints: ['Find each friend\'s total.', 'Friend 1: 35 + 7. Friend 2: 21 + 21.'],
        show: ['Friend 1: 35 + 7 = 42.', 'Friend 2: 21 + 21 = 42.', 'Both are right.'],
        yes: 'Yes! 35 + 7 = 42 and 21 + 21 = 42. Different cuts, same product.',
      }),
      choice('t19', 'How is 6 × 8 related to 3 × 8?', [
        ['6 × 8 is double 3 × 8.', true],
        ['6 × 8 is 3 more than 3 × 8.', '6 × 8 is 48 and 3 × 8 is 24. 48 is double 24.'],
        ['They are the same.', '6 × 8 is 48 and 3 × 8 is 24. They are not the same.'],
      ], { hints: ['6 = 3 + 3.', 'So 6 rows is 3 rows and 3 more rows.'], show: ['6 × 8 = 3 × 8 + 3 × 8.', '24 + 24 = 48, double 24.'], yes: 'Yes! 6 rows is 3 rows and 3 more rows.' }),
      story('t20', 'Erin has 6 bags. Each bag has 10 marbles. How many marbles does she have?', 6, 10, {
        hints: ['6 bags of 10: 6 × 10.', 'Use the 5s fact: 5 × 10 = 50. Add one more bag of 10.'],
        mistakes: [{ when: { answer: 16 }, say: '6 + 10 is 16. There are 6 equal bags, so multiply.' }, { when: { answer: 50 }, say: '50 is only 5 bags. Add one more bag of 10.' }],
        show: ['6 × 10 = 5 × 10 + 1 × 10.', '50 + 10 = 60 marbles.'], yes: 'Yes! 60 marbles.',
      }),
    ],
  },
  test: {
    pass: 7,
    items: [
      forTest(fact('x1', 6, 4, { show: ['5 × 4 = 20.', 'Add one more group of 4: 20 + 4 = 24.'] })),
      forTest(partsFill('x2', 6, 8, 'rows', 5)),
      forTest(missing('x3', '6 × [x] = 3 × 9 + 3 × 9', { x: 9 }, { show: ['Both parts have 9, and 3 + 3 = 6.', '6 × 9 = 3 × 9 + 3 × 9.'] })),
      forTest(choice('x4', 'Which one is equal to 6 × 7?', [
        ['3 × 7 + 2 × 7', '3 and 2 make 5, not 6.'],
        ['5 × 7 + 1 × 7', true],
        ['6 + 7', '6 × 7 means 6 groups of 7, not 6 + 7.'],
        ['5 × 7 + 1', 'The second part must be a whole fact: 1 × 7, not 1.'],
      ], { target: '6 × 7', show: ['6 × 7 = 5 × 7 + 1 × 7 = 35 + 7 = 42.'] })),
      forTest(story('x5', 'There are 6 boxes. Each box has 9 pencils. How many pencils are there?', 6, 9, { show: ['6 boxes of 9 is 6 × 9.', '5 × 9 = 45. Add one more box: 45 + 9 = 54.'] })),
      forTest(decompose('x6', 7, 6, ['cols', 5], { show: ['Break the 6 into 5 + 1: 7 × 5 + 7 × 1.', '35 + 7 = 42.'] })),
      forTest(missing('x7', '[x] = 6 × 3', { x: 18 }, { show: ['3 × 3 = 9. Double it: 9 + 9 = 18.'] })),
      forTest(choice('x8', 'Which two facts can you add to find 6 × 8?', [
        ['3 × 8 and 3', 'The second part must be a whole fact: 3 × 8, not 3.'],
        ['4 × 8 and 1 × 8', '4 and 1 make 5, not 6.'],
        ['3 × 8 and 3 × 8', true],
        ['5 × 8 and 2 × 8', '5 and 2 make 7, not 6.'],
      ], { show: ['3 + 3 = 6.', '6 × 8 = 3 × 8 + 3 × 8 = 24 + 24 = 48.'] })),
    ],
  },
  parent: {
    sections: [
      { heading: 'What your child is learning', text: 'Two ways to multiply by 6. Because 6 = 5 + 1, a 6s fact is the 5s fact plus one more group: 6 × 7 = 5 × 7 + 1 × 7 = 35 + 7 = 42. Because 6 = 3 + 3, it is also double the 3s fact: 3 × 7 + 3 × 7 = 21 + 21 = 42. Both are the Distributive Property.' },
      { heading: 'Try it with real things', list: ['Lay out 6 rows of 7 buttons. Cover the bottom row: 5 rows is 35. Uncover it: 35 + 7 = 42.', 'Now cover the bottom 3 rows: 21 buttons. Uncover them: 21 + 21 = 42.'] },
      { heading: 'Questions to ask', list: ['Where is the 6?', 'What is the 5s fact? What is one more group?', 'What is the 3s fact? What is double that?'] },
      { heading: 'Common mistakes', list: ['Adding 1 instead of one more group: 35 + 1 instead of 35 + 7.', 'Stopping at the 5s fact.', 'Breaking 6 into numbers that do not add up to 6, such as 3 and 2.', 'Adding the factors: 6 + 7 = 13.'] },
      { heading: 'A note on notation', text: 'Some books write the facts without ( ) and some with ( ). Both mean the same thing. Study Scoop uses original practice questions; it never copies the textbook.' },
    ],
  },
};
