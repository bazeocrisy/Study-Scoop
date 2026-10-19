// Lesson 5-3: Use Properties to Multiply by 4 (double the 2s fact). Original content.
import { F, arr, choice, decompose, fact, factorsFill, forTest, missing, partsFill, story, table } from '../lib.mjs';

/** Hints and steps for a 4s fact: the 2s fact, doubled. `first` says whether the 4 is the first factor. */
function four(n, first = true) {
  const two = first ? F(2, n) : F(n, 2);
  const whole = first ? F(4, n) : F(n, 4);
  return {
    hints: [`Find the 2s fact: ${two}.`, 'Then double it: add the 2s fact to itself.'],
    show: [`4 = 2 + 2, so ${whole} is two ${two} facts.`, `${two} = ${2 * n}.`, `${2 * n} + ${2 * n} = ${4 * n}. So ${whole} = ${4 * n}.`],
    mistakes: [
      ...(4 + n !== 2 * n ? [{ when: { answer: 4 + n }, say: `${4} + ${n} is ${4 + n}, but this is times. Find the 2s fact and double it.` }] : []),
      { when: { answer: 2 * n }, say: `${2 * n} is the 2s fact. Double it to get the 4s fact.` },
    ],
  };
}

export default {
  id: '5-3',
  title: 'Use Properties to Multiply by 4',
  goal: 'I can multiply by 4: find the 2s fact, then double it.',
  catchAll: 'Find the 4. Find the 2s fact, then double it.',
  teacher: [{ term: 'Distributive Property', def: 'a multiplication fact can be broken apart into the sum of two other related facts' }],
  glossary: {
    double: 'add a number to itself, like 12 + 12',
    '2s fact': 'a fact times 2, like 2 × 6',
    '4s fact': 'a fact times 4, like 4 × 6',
  },
  learn: {
    screens: [
      {
        title: 'Ready? Warm-up',
        item: fact('r1', 2, 6, {
          hints: ['2 × 6 means 2 groups of 6.', 'Double 6: 6 + 6.'],
          mistakes: [{ when: { answer: 8 }, say: '2 + 6 is 8, but this is times. 2 groups of 6 is 6 + 6.' }],
          yes: 'Yes! 2 × 6 = 12. That is double 6.',
        }),
      },
      {
        title: 'Ready? One more',
        item: {
          id: 'r2', type: 'number', prompt: 'Double 12 = ?', answer: '12 + 12',
          hints: ['Double means add the number to itself: 12 + 12.', '10 + 10 = 20 and 2 + 2 = 4.'],
          mistakes: [{ when: { answer: 14 }, say: 'That is 12 + 2. Double 12 means 12 + 12.' }],
          yes: 'Yes! 12 + 12 = 24.',
        },
      },
      {
        title: 'Two 2s make a 4',
        text: [
          '4 × 6 means 4 rows of 6.',
          '4 is 2 + 2. So cut the 4 rows into two parts. Each part has 2 rows.',
          'Each part is the 2s fact: 2 × 6 = 12. Two parts make 12 + 12 = 24.',
        ],
        model: arr(4, 6, ['r', 2], 'facts'),
        caption: '4 × 6 = 2 × 6 + 2 × 6',
        words: ['2s fact', 'double'],
      },
      {
        title: 'The 4s strategy',
        teacher: true,
        text: [
          'Find the 4. Find the 2s fact. Then double it.',
          'It works because 4 rows is 2 rows and 2 more rows. That is the Distributive Property.',
        ],
        pairs: ['4 × 6 = (2 × 6) + (2 × 6)', '12 + 12 = 24'],
      },
      {
        title: 'Check',
        item: choice('l1', 'Which one is equal to 4 × 7?', [
          ['2 × 7 + 2', 'The second part must be a whole fact: 2 × 7, not 2.'],
          ['2 × 7 + 2 × 7', true],
          ['4 + 7', '4 × 7 means 4 groups of 7, not 4 + 7.'],
          ['2 × 7 + 1 × 7', '2 and 1 make 3, not 4. That is 3 × 7.'],
        ], { target: '4 × 7', yes: 'Yes! 2 × 7 + 2 × 7 is 14 + 14. That is 28.' }),
      },
    ],
  },
  watch: {
    takeaway: '4s facts: find the 2s fact, then double it.',
    examples: [
      {
        title: 'Example A: 4 × 9',
        model: arr(4, 9, ['r', 2], 'facts'),
        steps: [
          { say: 'Problem: 4 × 9. That is 4 rows of 9.', model: arr(4, 9) },
          { say: 'Step 1: Break 4 into 2 + 2. Cut under row 2.', model: arr(4, 9, ['r', 2], 'parts') },
          { say: 'Step 2: Solve the top part.', eq: '2 × 9 = 18' },
          { say: 'Step 3: Solve the bottom part. It is the same fact!', eq: '2 × 9 = 18' },
          { say: 'Step 4: Add the two parts. That is double 18.', eq: '4 × 9 = 2 × 9 + 2 × 9 = 18 + 18 = 36', pictured: true, word: 'double' },
          { say: 'Step 5: Check the array. 4 rows of 9 is 36 dots.', eq: '4 × 9 = 36' },
        ],
        why: choice('wA', 'Why are both parts the same?', [
          ['We added more dots.', 'No dots were added. The 4 rows were cut into 2 rows and 2 rows.'],
          ['Each part is 2 rows of 9.', true],
          ['9 is an odd number.', 'That does not matter. Both parts are 2 rows of 9, so they are the same.'],
        ], { yes: 'Yes! 2 rows and 2 more rows make 4 rows, so you double the 2s fact.' }),
      },
      {
        title: 'Example B: the 4 comes second',
        model: arr(6, 4, ['c', 2], 'facts'),
        steps: [
          { say: 'This time the 4 comes second. 6 × 4 is 6 rows of 4.', model: arr(6, 4) },
          { say: 'Find the 4. Break it into 2 + 2. Cut between the columns.', model: arr(6, 4, ['c', 2], 'parts') },
          { say: 'The left part is 6 rows of 2.', eq: '6 × 2 = 12' },
          { say: 'The right part is 6 rows of 2 too.', eq: '6 × 2 = 12' },
          { say: 'Double 12.', eq: '6 × 4 = 6 × 2 + 6 × 2 = 12 + 12 = 24', pictured: true },
        ],
        why: choice('wB', 'Which number did we break apart?', [
          ['The 6', 'Every part still has 6 rows. Look at what the line cuts.'],
          ['The 4', true],
          ['The 24', '24 is the product. Look at what the line cuts.'],
        ], { yes: 'Yes! Find the 4 and break it into 2 + 2, wherever it is.' }),
        another: {
          text: 'Turn it around and it still works: 4 × 6 = 6 × 4 = 24.',
          models: [arr(4, 6, ['r', 2], 'facts'), arr(6, 4, ['c', 2], 'facts')],
        },
      },
    ],
  },
  together: {
    intro: "Let's do some together. Use Hint if you get stuck.",
    items: [
      partsFill('g1', 4, 8, 'rows', 2, {
        ask: 'total', labels: 'facts', prompt: 'Finish the last step.',
        hints: ['Each part is 2 × 8 = 16.', 'Double 16: 16 + 16.'],
        yes: 'Yes! 16 + 16 = 32. You doubled the 2s fact!',
      }),
      partsFill('g2', 4, 5, 'rows', 2, {
        hints: ['The top part is 2 rows of 5.', 'Both parts are 2 × 5 = 10.'],
        yes: 'Yes! 10 + 10 = 20.',
      }),
      factorsFill('g3', 4, 6, 'rows', 2, { total: true, prompt: 'Break the 4 into two equal parts. Fill in the boxes.', yes: 'Yes! 2 + 2 = 4 rows, and 12 + 12 = 24.' }),
      partsFill('g4', 10, 4, 'cols', 2, {
        prompt: 'The 4 comes second. Find each part, then add.',
        hints: ['Find the 4. It is broken into 2 + 2 columns.', 'Find 10 × 2. Then double it.'],
        yes: 'Yes! 20 + 20 = 40.',
      }),
      fact('g5', 4, 4, { ...four(4), yes: 'Yes! 8 + 8 = 16.' }),
      decompose('g6', 4, 6, ['rows', 2], {
        prompt: 'Your turn! Decompose 4 × 6 any way you like.',
        model: arr(4, 6),
        hints: ['Try breaking the 4 into 2 + 2.', '2 × 6 + 2 × 6. Then add.'],
        show: ['Break the 4 into 2 + 2.', '2 × 6 + 2 × 6 = 12 + 12 = 24.'],
      }),
    ],
  },
  try: {
    pass: 16,
    items: [
      // 1-5: understanding
      {
        id: 't1', type: 'fill', prompt: '2 × 2 = 4. Use it to find 4 × 2.', lines: ['4 × 2 = 4 + [x]', '= [t]'], answer: { x: 4, t: 8 },
        hints: ['4 × 2 is two 2 × 2 facts.', 'Double means add the same 2s fact again.'],
        mistakes: [{ when: { x: 2 }, say: 'Add the whole 2s fact again, not just 2.' }, { when: { x: 1 }, say: 'Add the whole 2s fact again, not 1.' }],
        show: ['4 × 2 = 2 × 2 + 2 × 2.', '4 + 4 = 8.'], yes: 'Yes! 4 + 4 = 8.',
      },
      choice('t2', 'Which facts match this split array?', [
        ['(4 × 4) + (4 × 4)', 'That cut goes between columns. This line goes between rows.'],
        ['(2 × 8) + (2 × 8)', true],
        ['(1 × 8) + (3 × 8)', 'That would be a cut under row 1. This line is under row 2.'],
        ['(2 × 4) + (2 × 4)', 'Each row has 8 dots, not 4. Count the dots in one row.'],
      ], {
        model: arr(4, 8, ['r', 2], 'parts'), pictureMatch: true,
        hints: ['Count the rows above the line and below the line.', 'Count the dots in one row.'],
        show: ['2 rows are above the line and 2 rows are below it.', 'Each row has 8 dots: (2 × 8) + (2 × 8).'],
        yes: 'Yes! 2 rows of 8 on top and 2 rows of 8 below.',
      }),
      fact('t3', 4, 3, { ...four(3) }),
      missing('t4', '4 × [x] = 2 × 7 + 2 × 7', { x: 7 }, {
        hints: ['Both parts are 2 × 7.', '2 rows of 7 and 2 more rows of 7 make 4 rows of what?'],
        mistakes: [{ when: { x: 14 }, say: 'That is one part. The box needs a factor: 4 × what?' }, { when: { x: 28 }, say: 'That box needs a factor, not the product.' }],
        show: ['2 + 2 = 4, and both parts have 7.', '4 × 7 = 2 × 7 + 2 × 7.'], yes: 'Yes! 4 × 7 = 2 × 7 + 2 × 7.',
      }),
      choice('t5', 'Which fact can you double to find 4 × 9?', [
        ['2 × 9', true],
        ['4 × 2', 'Double 4 × 2 is 4 × 4, not 4 × 9. Which 2s fact keeps the 9?'],
        ['1 × 9', 'Doubling 1 × 9 makes a 2s fact, not 4 × 9. Which fact doubles to make 4 × 9?'],
        ['2 × 4', 'Double 2 × 4 is 4 × 4, not 4 × 9. Which 2s fact keeps the 9?'],
      ], {
        hints: ['4 = 2 + 2. Which 2s fact keeps the 9?'],
        show: ['4 × 9 = 2 × 9 + 2 × 9.', 'So double 2 × 9 = 18: 18 + 18 = 36.'], yes: 'Yes! Double 2 × 9: 18 + 18 = 36.',
      }),
      // 6-15: practice
      partsFill('t6', 4, 2, 'rows', 2, { hints: ['The top part is 2 rows of 2.'] }),
      partsFill('t7', 3, 4, 'cols', 2, {
        prompt: 'The 4 comes second. Find each part, then add.',
        hints: ['Each part is 3 rows of 2.'],
      }),
      fact('t8', 6, 4, {
        hints: ['Turn it around: 6 × 4 = 4 × 6.', 'Find the 2s fact: 6 × 2 = 12. Double it.'],
        mistakes: [{ when: { answer: 10 }, say: '6 + 4 is 10, but this is times. Find the 2s fact and double it.' }, { when: { answer: 12 }, say: '12 is the 2s fact. Double it to get the 4s fact.' }],
        show: ['Find the 4. 6 × 4 = 6 × 2 + 6 × 2.', '12 + 12 = 24.'],
      }),
      factorsFill('t9', 4, 5, 'rows', 2, { total: true }),
      decompose('t10', 4, 7, ['rows', 2], {
        hints: ['Try breaking the 4 into 2 + 2.', 'Write two 2s facts that keep the 7. Then add.'],
      }),
      table('t11', 'Double, then double again. Fill in the times 4 column.', ['Number', 'Times 2', 'Times 4'], [
        ['2', '4', { answer: '4 × 2' }],
        ['6', '12', { answer: '4 × 6' }],
        ['10', '20', { answer: '4 × 10' }],
      ], {
        hints: ['Times 4 is double the times 2 number.', 'For 2: what is 4 + 4?'],
        retry: 'Check each row: double the times 2 number.',
        show: ['2: 4 + 4 = 8.', '6: 12 + 12 = 24.', '10: 20 + 20 = 40.'],
        yes: 'Yes! Each times 4 number is double the times 2 number.',
      }),
      story('t12', 'A table has 4 legs. How many legs are on 7 tables?', 7, 4, {
        hints: ['7 tables with 4 legs each: 7 × 4.', 'Find the 2s fact: 7 × 2 = 14. Double it.'],
        mistakes: [{ when: { answer: 11 }, say: '7 + 4 is 11. Each table has 4 legs, so multiply.' }, { when: { answer: 14 }, say: '14 is the 2s fact. Double it for 4 legs.' }],
        show: ['7 tables of 4 legs is 7 × 4.', '7 × 2 = 14. Double it: 14 + 14 = 28.', 'There are 28 legs.'],
        yes: 'Yes! 28 legs.',
      }),
      choice('t13', 'Which one is equal to 4 × 6?', [
        ['2 × 6 + 2', 'The second part must be a whole fact: 2 × 6, not 2.'],
        ['2 × 3 + 2 × 3', 'That is 2 × 6 broken apart. It is only half of 4 × 6.'],
        ['2 × 6 + 2 × 6', true],
        ['4 + 6', '4 × 6 means 4 groups of 6, not 4 + 6.'],
      ], { target: '4 × 6', hints: ['4 = 2 + 2. Both parts must be whole facts that keep the 6.'], show: ['4 × 6 = 2 × 6 + 2 × 6 = 12 + 12 = 24.'], yes: 'Yes! 12 + 12 = 24.' }),
      missing('t14', '[x] × 4 = 36', { x: 9 }, {
        hints: ['Count by 4s: 4, 8, 12, 16 … Stop at 36.', 'Or: what number doubled makes 36? Which 2s fact makes that number?'],
        mistakes: [{ when: { x: 32 }, say: 'That box needs a factor. What times 4 makes 36?' }, { when: { x: 8 }, say: '8 × 4 is 32. One more 4 makes 36.' }],
        show: ['2 × 9 = 18, and 18 + 18 = 36.', 'So 9 × 4 = 36.'], yes: 'Yes! 9 × 4 = 36.',
      }),
      fact('t15', 4, 4, { ...four(4) }),
      // 16-20: apply and explain
      choice('t16', 'A student wrote 4 × 8 = 2 × 8 + 2 = 18. What went wrong?', [
        ['The second part should be 2 × 8, not 2.', true],
        ['Nothing. It is correct.', '4 × 8 is 4 rows of 8. That is 32 dots, not 18.'],
        ['The first part should be 4 × 8.', 'The first part 2 × 8 is fine. The second part lost its 8.'],
        ['You should add 4 + 8.', '4 × 8 means 4 groups of 8, not 4 + 8.'],
      ], {
        quotesMistake: true,
        hints: ['Both parts must be whole facts that keep the same factor.', 'Check each part, one at a time.'],
        show: ['4 × 8 = 2 × 8 + 2 × 8.', '16 + 16 = 32.'], yes: 'Yes! 4 × 8 = 2 × 8 + 2 × 8 = 16 + 16 = 32.',
      }),
      story('t17', 'A box of crayons has 4 rows. Each row has 5 crayons. How many crayons are in the box?', 4, 5, {
        model: arr(4, 5),
        hints: ['4 rows of 5 is 4 × 5.', 'Find the 2s fact for 2 rows. Then double it.'],
        mistakes: [{ when: { answer: 9 }, say: '4 + 5 is 9. There are 4 rows of 5, so multiply.' }, { when: { answer: 10 }, say: '10 is only 2 rows. Double it for 4 rows.' }],
        show: ['4 × 5 = 2 × 5 + 2 × 5.', '10 + 10 = 20 crayons.'], yes: 'Yes! 20 crayons.',
      }),
      choice('t18', 'Lena knows 2 × 10 = 20. How can she find 4 × 10?', [
        ['Add 4: 20 + 4', '4 × 10 is two 2 × 10 facts. Add 20 again, not 4.'],
        ['Add 10 once: 20 + 10', '20 + 10 is only 3 × 10. 4 × 10 needs two 2s facts.'],
        ['Double 20: 20 + 20', true],
      ], { hints: ['4 = 2 + 2. How many 2 × 10 facts make 4 × 10?'], show: ['4 × 10 = 2 × 10 + 2 × 10.', '20 + 20 = 40.'], yes: 'Yes! 20 + 20 = 40.' }),
      story('t19', 'A horse has 4 legs. How many legs do 6 horses have?', 6, 4, {
        hints: ['6 horses with 4 legs each: 6 × 4.', 'Find the 4. Find the 2s fact with 6, then double it.'],
        mistakes: [{ when: { answer: 10 }, say: '6 + 4 is 10. Each horse has 4 legs, so multiply.' }, { when: { answer: 12 }, say: '12 is only 2 legs on each horse. Double it for 4.' }],
        show: ['6 × 4 = 6 × 2 + 6 × 2.', '12 + 12 = 24 legs.'], yes: 'Yes! 24 legs.',
      }),
      choice('t20', 'Kim says: "To find any 4s fact, find the 2s fact and double it." Is Kim right?', [
        ['Only for even numbers.', 'It works for every number. 4 × 7 = 14 + 14 = 28.'],
        ['Yes. 4 rows is 2 rows and 2 more rows.', true],
        ['Only for small numbers.', 'It works for every number. 4 × 9 = 18 + 18 = 36.'],
      ], { hints: ['Try it with 4 × 7. Is 14 + 14 the same as 4 × 7?'], show: ['4 = 2 + 2 for every fact.', 'So a 4s fact is always two 2s facts: double the 2s fact.'], yes: 'Yes! 4 is always 2 + 2.' }),
    ],
  },
  test: {
    pass: 7,
    items: [
      forTest(fact('x1', 4, 7, { show: ['2 × 7 = 14.', 'Double it: 14 + 14 = 28.'] })),
      forTest(partsFill('x2', 4, 9, 'rows', 2)),
      forTest(missing('x3', '4 × [x] = 2 × 8 + 2 × 8', { x: 8 }, { show: ['Both parts are 2 × 8, and 2 + 2 = 4.', '4 × 8 = 2 × 8 + 2 × 8.'] })),
      forTest(choice('x4', 'Which one is equal to 4 × 5?', [
        ['2 × 5 + 1 × 5', '2 and 1 make 3, not 4.'],
        ['4 + 5', '4 × 5 means 4 groups of 5, not 4 + 5.'],
        ['2 × 5 + 2 × 5', true],
        ['2 × 5 + 2', 'The second part must be a whole fact: 2 × 5, not 2.'],
      ], { target: '4 × 5', show: ['4 × 5 = 2 × 5 + 2 × 5 = 10 + 10 = 20.'] })),
      forTest(story('x5', 'A store puts 6 apples in each bag. How many apples are in 4 bags?', 4, 6, { show: ['4 bags of 6 is 4 × 6.', '2 × 6 = 12. Double it: 12 + 12 = 24.'] })),
      forTest(decompose('x6', 8, 4, ['cols', 2], { show: ['Break the 4 into 2 + 2: 8 × 2 + 8 × 2.', '16 + 16 = 32.'] })),
      forTest(missing('x7', '[x] = 4 × 3', { x: 12 }, { show: ['2 × 3 = 6. Double it: 6 + 6 = 12.'] })),
      forTest(choice('x8', 'Which fact can you double to find 4 × 10?', [
        ['1 × 10', 'Double 1 × 10 is only 2 × 10.'],
        ['2 × 10', true],
        ['2 × 5', 'Double 2 × 5 is 2 × 10, not 4 × 10.'],
        ['4 × 2', 'Double 4 × 2 is 4 × 4.'],
      ], { show: ['4 × 10 = 2 × 10 + 2 × 10.', '20 + 20 = 40.'] })),
    ],
  },
  parent: {
    sections: [
      { heading: 'What your child is learning', text: 'To multiply by 4 by doubling a 2s fact. Because 4 = 2 + 2, a 4s fact is two equal 2s facts: 4 × 9 = 2 × 9 + 2 × 9 = 18 + 18 = 36. When the 4 comes second (6 × 4), break the 4 the same way: 6 × 2 + 6 × 2.' },
      { heading: 'Try it with real things', list: ['Make 2 rows of 9 pennies. Count them (18). Make 2 more rows below. Now there are 4 rows: 18 + 18 = 36.', 'Practice doubles out loud: double 12, double 16, double 18.'] },
      { heading: 'Questions to ask', list: ['Where is the 4?', 'What is the 2s fact?', 'What is double that number?'] },
      { heading: 'Common mistakes', list: ['Stopping at the 2s fact (2 × 9 = 18) and not doubling.', 'Adding the factors: 4 + 9 = 13.', 'Writing the second part as a number instead of a fact: 2 × 9 + 2.', 'Doubling the wrong fact, such as 4 × 2 for 4 × 9.'] },
      { heading: 'A note on notation', text: 'Some books write the facts without ( ) and some with ( ). Both mean the same thing. Study Scoop uses original practice questions; it never copies the textbook.' },
    ],
  },
};
