// Lesson 5-6: Use Properties to Multiply by 7 and 9 (5s fact + 2s fact; 5s fact + 4s fact). Original content.
// The "10s fact minus one group" strategy for 9s is left out on purpose: the unit builds 7s and 9s from known 5s facts.
import { F, arr, choice, decompose, fact, factorsFill, forTest, missing, partsFill, story, table } from '../lib.mjs';

/** Hints and steps for 7 × n (5 + 2) or 9 × n (5 + 4), with the 7 or 9 first. */
function fiveAnd(big, n) {
  const small = big - 5;
  return {
    hints: [`Break ${big} into 5 + ${small}.`, `Find ${F(5, n)} and ${F(small, n)}. Then add them.`],
    show: [`${F(big, n)} = ${F(5, n)} + ${F(small, n)}.`, `${5 * n} + ${small * n} = ${big * n}.`],
    mistakes: [
      ...(big + n !== 5 * n ? [{ when: { answer: big + n }, say: `${big} + ${n} is ${big + n}, but this is times. Break ${big} into 5 + ${small}.` }] : []),
      { when: { answer: 5 * n }, say: `${5 * n} is only the 5s fact. Add the ${small}s fact too.` },
    ],
  };
}

export default {
  id: '5-6',
  title: 'Use Properties to Multiply by 7 and 9',
  goal: 'I can multiply by 7 and 9 by starting with a 5s fact.',
  catchAll: 'Break the 7 into 5 + 2, or the 9 into 5 + 4. Find each part, then add.',
  teacher: [{ term: 'Distributive Property', def: 'a multiplication fact can be broken apart into the sum of two other related facts' }],
  glossary: {
    '5s fact': 'a fact times 5, like 5 × 6. Count by 5s.',
    '2s fact': 'a fact times 2, like 2 × 6. It is a double.',
    '4s fact': 'a fact times 4, like 4 × 6. Double the 2s fact.',
  },
  learn: {
    screens: [
      {
        title: 'Ready? Warm-up',
        item: fact('r1', 5, 6, {
          hints: ['Count by 5s six times: 5, 10, 15 …', '5 × 6 is 6 fives.'],
          mistakes: [{ when: { answer: 11 }, say: '5 + 6 is 11, but this is times. Count by 5s six times.' }],
          yes: 'Yes! 5 × 6 = 30.',
        }),
      },
      {
        title: 'Ready? One more',
        item: fact('r2', 4, 6, {
          hints: ['Find the 2s fact: 2 × 6 = 12.', 'Double it: 12 + 12.'],
          mistakes: [{ when: { answer: 10 }, say: '4 + 6 is 10, but this is times. Double the 2s fact.' }],
          yes: 'Yes! 4 × 6 = 24.',
        }),
      },
      {
        title: 'A 7s fact: 7 is 5 + 2',
        text: [
          '7 × 6 means 7 rows of 6.',
          '7 is 5 + 2. Cut under row 5.',
          'The top part is the 5s fact: 5 × 6 = 30. The bottom part is the 2s fact: 2 × 6 = 12.',
          'Add them: 30 + 12 = 42.',
        ],
        model: arr(7, 6, ['r', 5], 'facts'),
        caption: '7 × 6 = 5 × 6 + 2 × 6',
        words: ['5s fact', '2s fact'],
      },
      {
        title: 'A 9s fact: 9 is 5 + 4',
        text: [
          '9 × 6 means 9 rows of 6.',
          '9 is 5 + 4. Cut under row 5.',
          'The top part is the 5s fact: 5 × 6 = 30. The bottom part is the 4s fact: 4 × 6 = 24.',
          'Add them: 30 + 24 = 54.',
        ],
        model: arr(9, 6, ['r', 5], 'facts'),
        caption: '9 × 6 = 5 × 6 + 4 × 6',
        words: ['4s fact'],
      },
      {
        title: 'Start with a 5s fact',
        teacher: true,
        text: [
          'A 7s fact is the 5s fact plus the 2s fact.',
          'A 9s fact is the 5s fact plus the 4s fact.',
          'Both use the Distributive Property.',
        ],
        pairs: ['7 × 6 = (5 × 6) + (2 × 6)', '9 × 6 = (5 × 6) + (4 × 6)'],
      },
      {
        title: 'Check',
        item: choice('l1', 'Which one is equal to 7 × 8?', [
          ['5 × 8 + 2', 'The second part must be a whole fact: 2 × 8, not 2.'],
          ['5 × 8 + 2 × 8', true],
          ['5 × 8 + 1 × 8', '5 and 1 make 6, not 7.'],
          ['7 + 8', '7 × 8 means 7 groups of 8, not 7 + 8.'],
        ], { target: '7 × 8', yes: 'Yes! 5 × 8 + 2 × 8 is 40 + 16. That is 56.' }),
      },
    ],
  },
  watch: {
    takeaway: '7s facts: 5s fact + 2s fact. 9s facts: 5s fact + 4s fact.',
    examples: [
      {
        title: 'Example A: 7 × 6',
        model: arr(7, 6, ['r', 5], 'facts'),
        steps: [
          { say: 'Problem: 7 × 6. That is 7 rows of 6.', model: arr(7, 6) },
          { say: 'Break 7 into 5 + 2. Cut under row 5.', model: arr(7, 6, ['r', 5], 'parts') },
          { say: 'The top part is the 5s fact.', eq: '5 × 6 = 30' },
          { say: 'The bottom part is the 2s fact.', eq: '2 × 6 = 12' },
          { say: 'Add the two parts.', eq: '7 × 6 = 5 × 6 + 2 × 6 = 30 + 12 = 42', pictured: true },
          { say: 'Check the array. 7 rows of 6 is 42 dots.', eq: '7 × 6 = 42' },
        ],
        why: choice('wA', 'Why did we cut under row 5?', [
          ['5 is the answer.', 'The answer is 42. We cut at 5 because 5s facts are easy.'],
          ['5s facts are easy.', true],
          ['There are 5 dots in a row.', 'Each row has 6 dots. We cut at 5 because 5s facts are easy.'],
        ], { yes: 'Yes! 5s facts are easy, so 5 is a good place to cut.' }),
      },
      {
        title: 'Example B: 9 × 6',
        model: arr(9, 6, ['r', 5], 'facts'),
        steps: [
          { say: 'Problem: 9 × 6. That is 9 rows of 6.', model: arr(9, 6) },
          { say: 'Break 9 into 5 + 4. Cut under row 5.', model: arr(9, 6, ['r', 5], 'parts') },
          { say: 'The top part is the 5s fact.', eq: '5 × 6 = 30' },
          { say: 'The bottom part is the 4s fact. Double the 2s fact: 12 + 12.', eq: '4 × 6 = 24' },
          { say: 'Add the two parts.', eq: '9 × 6 = 5 × 6 + 4 × 6 = 30 + 24 = 54', pictured: true },
        ],
        why: choice('wB', 'What did we break 9 into?', [
          ['5 + 5', '5 + 5 makes 10, not 9. There are 5 rows on top and 4 below.'],
          ['6 + 4', '6 + 4 makes 10, not 9. There are 5 rows on top and 4 below.'],
          ['5 + 4', true],
        ], { yes: 'Yes! 5 + 4 = 9. The 5s fact plus the 4s fact.' }),
      },
      {
        title: 'Example C: the 9 comes second',
        model: arr(3, 9, ['c', 5], 'facts'),
        steps: [
          { say: 'This time the 9 comes second. 3 × 9 is 3 rows of 9.', model: arr(3, 9) },
          { say: 'Find the 9. Break it into 5 + 4. Cut between the columns.', model: arr(3, 9, ['c', 5], 'parts') },
          { say: 'The left part is 3 rows of 5.', eq: '3 × 5 = 15' },
          { say: 'The right part is 3 rows of 4.', eq: '3 × 4 = 12' },
          { say: 'Add the two parts.', eq: '3 × 9 = 3 × 5 + 3 × 4 = 15 + 12 = 27', pictured: true },
        ],
        why: choice('wC', 'Which number did we break apart?', [
          ['The 3', 'Every part still has 3 rows. We broke the 9 into 5 + 4.'],
          ['The 9', true],
          ['The 27', '27 is the product. We broke the 9 into 5 + 4.'],
        ], { yes: 'Yes! Find the 9 and break it into 5 + 4, wherever it is.' }),
      },
    ],
  },
  together: {
    intro: "Let's do some together. Use Hint if you get stuck.",
    items: [
      partsFill('g1', 7, 3, 'rows', 5, {
        ask: 'total', labels: 'facts', prompt: 'Finish the last step.',
        hints: ['The parts are 5 × 3 = 15 and 2 × 3 = 6.', 'Add 15 + 6.'],
        yes: 'Yes! 15 + 6 = 21. You used the 5s fact!',
      }),
      partsFill('g2', 9, 4, 'rows', 5, {
        hints: ['The top part is 5 rows of 4. The bottom part is 4 rows of 4.', '5 × 4 = 20 and 4 × 4 = 16.'],
        yes: 'Yes! 20 + 16 = 36.',
      }),
      factorsFill('g3', 7, 8, 'rows', 5, { total: true, yes: 'Yes! 5 + 2 = 7 rows, and 40 + 16 = 56.' }),
      partsFill('g4', 6, 9, 'cols', 5, {
        prompt: 'The 9 comes second. Find each part, then add.',
        hints: ['The left part is 6 rows of 5. The right part is 6 rows of 4.', '6 × 5 = 30 and 6 × 4 = 24.'],
        yes: 'Yes! 30 + 24 = 54.',
      }),
      fact('g5', 9, 7, { ...fiveAnd(9, 7), yes: 'Yes! 35 + 28 = 63.' }),
      decompose('g6', 7, 7, ['rows', 5], {
        prompt: 'Your turn! Decompose 7 × 7 any way you like.', model: arr(7, 7),
        hints: ['Try breaking one 7 into 5 + 2.', '5 × 7 + 2 × 7. Then add.'],
        show: ['Break 7 into 5 + 2.', '5 × 7 + 2 × 7 = 35 + 14 = 49.'],
      }),
    ],
  },
  try: {
    pass: 16,
    items: [
      // 1-5: understanding (7s and 9s)
      {
        id: 't1', type: 'fill', prompt: '5 × 8 = 40 and 2 × 8 = 16. Use them to find 7 × 8.', lines: ['7 × 8 = 40 + [x]', '= [t]'], answer: { x: 16, t: 56 },
        hints: ['7 = 5 + 2. Add the 5s fact and the 2s fact.', 'Which number in the equation is the 2s fact?'],
        mistakes: [{ when: { x: 2 }, say: 'Add the whole 2s fact: 16, not 2.' }, { when: { x: 8 }, say: 'Add the whole 2s fact: 2 × 8 = 16, not 8.' }],
        show: ['7 × 8 = 5 × 8 + 2 × 8.', '40 + 16 = 56.'], yes: 'Yes! 40 + 16 = 56.',
      },
      choice('t2', 'Which facts match this split array?', [
        ['(5 × 3) + (5 × 3)', 'That makes 10 rows. This array has 9 rows: 5 on top and 4 below.'],
        ['(9 × 2) + (9 × 1)', 'That cut goes between columns. This line goes between rows.'],
        ['(5 × 3) + (4 × 3)', true],
        ['(4 × 3) + (3 × 3)', 'Count the rows above the line again. There are 5.'],
      ], {
        model: arr(9, 3, ['r', 5], 'parts'), pictureMatch: true,
        hints: ['Count the rows above the line and below the line.', 'Each row has 3 dots.'],
        show: ['5 rows are above the line and 4 rows are below it.', 'Each row has 3 dots: (5 × 3) + (4 × 3).'],
        yes: 'Yes! 5 rows of 3 on top and 4 rows of 3 below.',
      }),
      fact('t3', 7, 5, { ...fiveAnd(7, 5) }),
      missing('t4', '9 × [x] = 5 × 7 + 4 × 7', { x: 7 }, {
        hints: ['Both parts have 7.', '5 rows of 7 and 4 rows of 7 make 9 rows of what?'],
        mistakes: [{ when: { x: 35 }, say: 'That is one part. The box needs a factor: 9 × what?' }, { when: { x: 63 }, say: 'That box needs a factor, not the product.' }],
        show: ['5 + 4 = 9, and both parts have 7.', '9 × 7 = 5 × 7 + 4 × 7.'], yes: 'Yes! 9 × 7 = 5 × 7 + 4 × 7.',
      }),
      choice('t5', 'Which two facts can you add to find 7 × 9?', [
        ['5 × 9 and 2', 'The second part must be a whole fact: 2 × 9, not 2.'],
        ['5 × 9 and 4 × 9', '5 and 4 make 9, not 7. That is 9 × 9.'],
        ['5 × 9 and 2 × 9', true],
        ['7 × 5 and 2 × 4', 'Both facts must keep the same factor. Try 5 × 9 and 2 × 9.'],
      ], {
        hints: ['The two numbers must add up to 7, and both facts must keep the 9.'],
        show: ['5 + 2 = 7.', '7 × 9 = 5 × 9 + 2 × 9 = 45 + 18 = 63.'], yes: 'Yes! 45 + 18 = 63.',
      }),
      // 6-15: practice
      partsFill('t6', 7, 6, 'rows', 5, { hints: ['Top part: 5 rows of 6. Bottom part: 2 rows of 6.'] }),
      partsFill('t7', 9, 8, 'rows', 5, { hints: ['Top part: 5 rows of 8. Bottom part: 4 rows of 8.'] }),
      partsFill('t8', 4, 7, 'cols', 5, {
        prompt: 'The 7 comes second. Find each part, then add.',
        hints: ['Left part: 4 rows of 5. Right part: 4 rows of 2.'],
      }),
      partsFill('t9', 2, 9, 'cols', 5, {
        prompt: 'The 9 comes second. Find each part, then add.',
        hints: ['Left part: 2 rows of 5. Right part: 2 rows of 4.'],
      }),
      fact('t10', 9, 9, { ...fiveAnd(9, 9) }),
      decompose('t11', 9, 7, ['rows', 5], { hints: ['Break the 9 into 5 + 4, or the 7 into 5 + 2.', 'Write two facts that keep the same factor. Then add.'] }),
      fact('t12', 7, 7, { ...fiveAnd(7, 7) }),
      choice('t13', 'Which one is equal to 9 × 6?', [
        ['5 × 6 + 3 × 6', '5 and 3 make 8, not 9.'],
        ['5 × 6 + 4', 'The second part must be a whole fact: 4 × 6, not 4.'],
        ['9 + 6', '9 × 6 means 9 groups of 6, not 9 + 6.'],
        ['5 × 6 + 4 × 6', true],
      ], { target: '9 × 6', hints: ['The numbers 9 is broken into must add up to 9, and both parts must keep the 6.'], show: ['9 × 6 = 5 × 6 + 4 × 6 = 30 + 24 = 54.'], yes: 'Yes! 30 + 24 = 54.' }),
      missing('t14', '7 × [x] = 63', { x: 9 }, {
        hints: ['Count by 7s: 7, 14, 21 … Stop at 63. Count how many 7s you said.', 'Or start at 7 × 5 = 35 and keep adding 7 until you reach 63.'],
        mistakes: [{ when: { x: 56 }, say: 'That box needs a factor. 7 × what makes 63?' }, { when: { x: 8 }, say: '7 × 8 is 56. One more 7 makes 63.' }],
        show: ['7 × 9 = 7 × 5 + 7 × 4.', '35 + 28 = 63. So the missing number is 9.'], yes: 'Yes! 7 × 9 = 63.',
      }),
      table('t15', 'Add the 5s fact and the 2s fact to fill in the times 7 column.', ['Number', 'Times 5', 'Times 2', 'Times 7'], [
        ['3', '15', '6', { answer: '7 × 3' }],
        ['6', '30', '12', { answer: '7 × 6' }],
        ['8', '40', '16', { answer: '7 × 8' }],
      ], {
        hints: ['Times 7 is the times 5 number plus the times 2 number.', 'For 3: 15 + 6.'],
        retry: 'Check each row: add the times 5 and times 2 numbers.',
        show: ['3: 15 + 6 = 21.', '6: 30 + 12 = 42.', '8: 40 + 16 = 56.'],
        yes: 'Yes! 5 + 2 = 7, so add the 5s and the 2s.',
      }),
      // 16-20: apply and explain
      choice('t16', 'A student wrote 9 × 4 = 5 × 4 + 4 = 24. What went wrong?', [
        ['Nothing. It is correct.', '9 × 4 is 9 rows of 4. That is 36, not 24.'],
        ['9 should be 5 + 5.', '5 + 5 is 10, not 9. Use 5 + 4.'],
        ['The second part should be 4 × 4, not 4.', true],
        ['You should add 9 + 4.', '9 × 4 means 9 groups of 4, not 9 + 4.'],
      ], {
        quotesMistake: true,
        hints: ['Both parts must be whole facts that keep the same factor.', 'Check each part, one at a time.'],
        show: ['9 × 4 = 5 × 4 + 4 × 4.', '20 + 16 = 36.'], yes: 'Yes! 9 × 4 = 5 × 4 + 4 × 4 = 20 + 16 = 36.',
      }),
      story('t17', 'There are 7 days in a week. How many days are in 6 weeks?', 6, 7, {
        hints: ['6 weeks of 7 days: 6 × 7.', 'Break the 7 into 5 + 2: 6 × 5 + 6 × 2.'],
        mistakes: [{ when: { answer: 13 }, say: '6 + 7 is 13. Each week has 7 days, so multiply.' }, { when: { answer: 30 }, say: '30 is 6 × 5. Add 6 × 2 too.' }],
        show: ['6 × 7 = 6 × 5 + 6 × 2.', '30 + 12 = 42 days.'], yes: 'Yes! 42 days.',
      }),
      story('t18', 'A tricycle has 3 wheels. How many wheels do 9 tricycles have?', 9, 3, {
        hints: ['9 tricycles with 3 wheels: 9 × 3.', '5 × 3 = 15 and 4 × 3 = 12. Add.'],
        mistakes: [{ when: { answer: 12 }, say: '9 + 3 is 12. Each tricycle has 3 wheels, so multiply.' }, { when: { answer: 15 }, say: '15 is only 5 tricycles. Add the other 4.' }],
        show: ['9 × 3 = 5 × 3 + 4 × 3.', '15 + 12 = 27 wheels.'], yes: 'Yes! 27 wheels.',
      }),
      choice('t19', 'Does 7 × 8 = 5 × 8 + 2 × 8? Does the same idea work for 7 × 3?', [
        ['Yes, and yes. 7 is always 5 + 2.', true],
        ['Yes for 7 × 8, but not for 7 × 3.', 'It works for 7 × 3 too: 5 × 3 + 2 × 3 = 15 + 6 = 21.'],
        ['No. 5 × 8 + 2 × 8 is not 56.', 'Check it: 40 + 16 = 56, so it is true.'],
      ], { hints: ['Find 5 × 8 + 2 × 8. Is it 56?', 'Then try 5 × 3 + 2 × 3. Is it 21?'], show: ['40 + 16 = 56 = 7 × 8.', '15 + 6 = 21 = 7 × 3.', '7 = 5 + 2 for every 7s fact.'], yes: 'Yes! Every 7s fact is a 5s fact plus a 2s fact.' }),
      choice('t20', 'Kai knows 5 × 6 = 30 and 4 × 6 = 24. Which fact can he find by adding them?', [
        ['9 × 4', 'Both facts have the 6, so the answer is a fact with 6. 5 + 4 = 9, so it is 9 × 6.'],
        ['20 × 6', 'Add the 5 and the 4, do not multiply them: 5 + 4 = 9.'],
        ['9 × 6', true],
        ['1 × 6', 'Do not take away. Add the parts: 5 + 4 = 9, so it is 9 × 6.'],
      ], { hints: ['Both facts keep the 6.', 'Add the other two numbers.'], show: ['5 × 6 + 4 × 6 = 30 + 24 = 54.', '5 + 4 = 9, so that is 9 × 6 = 54.'], yes: 'Yes! 30 + 24 = 54, and that is 9 × 6.' }),
    ],
  },
  test: {
    pass: 7,
    items: [
      forTest(fact('x1', 7, 8, { show: ['7 × 8 = 5 × 8 + 2 × 8.', '40 + 16 = 56.'] })),
      forTest(partsFill('x2', 9, 7, 'rows', 5)),
      forTest(missing('x3', '7 × [x] = 5 × 3 + 2 × 3', { x: 3 }, { show: ['Both parts have 3, and 5 + 2 = 7.', '7 × 3 = 5 × 3 + 2 × 3.'] })),
      forTest(choice('x4', 'Which one is equal to 9 × 8?', [
        ['5 × 8 + 4', 'The second part must be a whole fact: 4 × 8, not 4.'],
        ['5 × 8 + 5 × 8', '5 and 5 make 10, not 9.'],
        ['5 × 8 + 4 × 8', true],
        ['9 + 8', '9 × 8 means 9 groups of 8, not 9 + 8.'],
      ], { target: '9 × 8', show: ['9 × 8 = 5 × 8 + 4 × 8 = 40 + 32 = 72.'] })),
      forTest(story('x5', 'Each bracelet has 9 beads. How many beads are on 6 bracelets?', 6, 9, { show: ['6 bracelets of 9 beads is 6 × 9.', 'Break the 9 into 5 + 4: 30 + 24 = 54.'] })),
      forTest(decompose('x6', 7, 6, ['rows', 5], { show: ['Break 7 into 5 + 2: 5 × 6 + 2 × 6.', '30 + 12 = 42.'] })),
      forTest(missing('x7', '[x] = 9 × 9', { x: 81 }, { show: ['9 × 9 = 5 × 9 + 4 × 9.', '45 + 36 = 81.'] })),
      forTest(choice('x8', 'Which two facts can you add to find 9 × 2?', [
        ['5 × 2 and 4', 'The second part must be a whole fact: 4 × 2, not 4.'],
        ['5 × 2 and 4 × 2', true],
        ['5 × 2 and 5 × 2', '5 and 5 make 10, not 9.'],
        ['4 × 2 and 3 × 2', '4 and 3 make 7, not 9.'],
      ], { show: ['5 + 4 = 9.', '9 × 2 = 5 × 2 + 4 × 2 = 10 + 8 = 18.'] })),
    ],
  },
  parent: {
    sections: [
      { heading: 'What your child is learning', text: 'To multiply by 7 and 9 using a 5s fact they already know. 7 = 5 + 2, so 7 × 6 = 5 × 6 + 2 × 6 = 30 + 12 = 42. 9 = 5 + 4, so 9 × 6 = 5 × 6 + 4 × 6 = 30 + 24 = 54. Either factor can be broken apart.' },
      { heading: 'Try it with real things', list: ['Make 7 rows of 6 coins. Slide the bottom 2 rows away: 30 + 12 = 42.', 'Count by 5s on fingers, then add the small fact.'] },
      { heading: 'Questions to ask', list: ['What 5s fact can you start with?', 'What is left after the 5? Is it a 2s fact or a 4s fact?', 'Does your answer match the array?'] },
      { heading: 'Common mistakes', list: ['Breaking 9 into 5 + 5 (that makes 10).', 'Adding the leftover number instead of its fact: 30 + 2 instead of 30 + 12.', 'Stopping at the 5s fact.', 'Adding the factors: 7 + 6 = 13.'] },
      { heading: 'A note on 9s', text: 'Some children also learn 9 × 6 as 10 × 6 minus one group of 6. Study Scoop sticks to the unit\'s add-on strategy (5s fact plus 4s fact), which uses facts your child already knows.' },
    ],
  },
};
