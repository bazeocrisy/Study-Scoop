// Lesson 5-7: Solve multiplication problems using arrays and equal groups. Original content (no division).
import { F, arr, choice, decompose, fact, forTest, partsFill, story, table } from '../lib.mjs';

/** "Write the equation" for a story: [a] × [b] = [t], either order of the factors is right. */
function writeEq(id, prompt, a, b, o = {}) {
  return {
    id, type: 'fill', prompt, lines: ['[a] × [b] = [t]'], answer: { a, b, t: a * b }, accept: [{ a: b, b: a, t: a * b }],
    hints: o.hints, show: o.show, retry: 'Find the number of groups and the number in each group. Then multiply.',
    mistakes: [{ when: { a, b, t: a + b }, say: `${a} + ${b} is ${a + b}. These are equal groups, so multiply.` }],
    yes: o.yes || `Yes! ${F(a, b)} = ${a * b}.`,
  };
}

export default {
  id: '5-7',
  title: 'Solve Multiplication Problems',
  goal: 'I can solve a story problem: find the equal groups, write a fact, and use a strategy.',
  catchAll: 'Find the equal groups. Write the multiplication fact. Then break apart a factor if it helps.',
  teacher: [{ term: 'Distributive Property', def: 'a multiplication fact can be broken apart into the sum of two other related facts' }],
  glossary: {
    'equal groups': 'groups that all have the same number, like 6 rows of 8 chairs',
    equation: 'a number sentence with an equals sign, like 6 × 8 = 48',
    unknown: 'the number you need to find',
  },
  learn: {
    screens: [
      {
        title: 'Ready? Warm-up',
        item: fact('r1', 4, 7, {
          prompt: 'How many dots are in this array?', model: arr(4, 7),
          hints: ['There are 4 rows. Each row has 7 dots.', 'Count by 7s: 7, 14, 21 …'],
          mistakes: [{ when: { answer: 11 }, say: '4 + 7 is 11. There are 4 rows of 7, so multiply.' }],
          yes: 'Yes! 4 rows of 7 is 28 dots.',
        }),
      },
      {
        title: 'Ready? One more',
        item: fact('r2', 5, 8, {
          hints: ['Count by 5s eight times.', '5, 10, 15, 20 …'],
          mistakes: [{ when: { answer: 13 }, say: '5 + 8 is 13, but this is times. Count by 5s eight times.' }],
          yes: 'Yes! 5 × 8 = 40.',
        }),
      },
      {
        title: 'Read the problem',
        text: [
          'A class sets up 6 rows of chairs. Each row has 8 chairs. How many chairs are there?',
          'The important numbers are 6 rows and 8 chairs in each row.',
          'The rows are equal groups. So the fact is 6 × 8. The unknown is the total.',
        ],
        model: arr(6, 8),
        caption: '6 rows of 8 chairs',
        words: ['equal groups', 'unknown'],
      },
      {
        title: 'Use a strategy',
        teacher: true,
        text: [
          'Break apart a factor. 6 is 5 + 1.',
          '5 × 8 = 40 and 1 × 8 = 8. Add: 40 + 8 = 48 chairs.',
          'Does it make sense? 48 is more than 5 rows of 8 (40), but less than 6 rows of 10 (60). Yes!',
        ],
        model: arr(6, 8, ['r', 5], 'facts'),
        caption: '6 × 8 = 5 × 8 + 1 × 8',
      },
      {
        title: '4 steps to solve',
        text: [
          '1. Read. Find the equal groups.',
          '2. Write the fact, like 6 × 8.',
          '3. Solve. Break apart a factor if it helps.',
          '4. Check. Is the answer about the right size?',
        ],
        words: ['equation'],
      },
      {
        title: 'Check',
        item: choice('l1', 'Ana has 4 bags. Each bag has 7 marbles. Which equation tells how many marbles she has?', [
          ['4 + 7 = ?', 'There are 4 equal groups of 7, so multiply, not add.'],
          ['4 × 7 = ?', true],
          ['7 − 4 = ?', 'Nothing is taken away. Multiply the equal groups.'],
        ], { yes: 'Yes! 4 bags of 7 is 4 × 7.' }),
      },
    ],
  },
  watch: {
    takeaway: 'Find the equal groups, write the fact, break apart a factor, and check.',
    examples: [
      {
        title: 'Example A: cookies on a tray',
        model: arr(7, 7, ['r', 5], 'facts'),
        steps: [
          { say: 'Read: A baker puts 7 rows of cookies on a tray. Each row has 7 cookies. How many cookies are there?', model: arr(7, 7) },
          { say: 'The equal groups are 7 rows of 7. The equation is 7 × 7 = ?' },
          { say: 'Break apart the 7 rows into 5 + 2. Cut under row 5.', model: arr(7, 7, ['r', 5], 'parts') },
          { say: 'The top part is 5 rows of 7.', eq: '5 × 7 = 35' },
          { say: 'The bottom part is 2 rows of 7.', eq: '2 × 7 = 14' },
          { say: 'Add the two parts.', eq: '7 × 7 = 5 × 7 + 2 × 7 = 35 + 14 = 49', pictured: true },
          { say: 'Check: count by 7s: 7, 14, 21, 28, 35, 42, 49. There are 49 cookies.' },
        ],
        why: choice('wA', 'What are the equal groups in this problem?', [
          ['7 rows of 7 cookies', true],
          ['7 cookies and 7 more cookies', 'There are 7 rows, and each row has 7 cookies. The rows are the equal groups.'],
          ['49 rows', '49 is the answer. There are 7 rows of 7.'],
        ], { yes: 'Yes! 7 equal rows with 7 cookies in each row.' }),
      },
      {
        title: 'Example B: boxes of muffins',
        model: arr(8, 4, ['r', 4], 'facts'),
        steps: [
          { say: 'Read: Each box has 4 muffins. How many muffins are in 8 boxes?', model: arr(8, 4) },
          { say: 'Each box is one row of 4. There are 8 boxes, so the fact is 8 × 4.' },
          { say: 'Break the 8 into 4 + 4. Cut under row 4.', model: arr(8, 4, ['r', 4], 'parts') },
          { say: 'Each part is the 4s fact.', eq: '4 × 4 = 16' },
          { say: 'Double 16.', eq: '8 × 4 = 4 × 4 + 4 × 4 = 16 + 16 = 32', pictured: true },
          { say: 'Check: count by 4s: 4, 8, 12, 16, 20, 24, 28, 32. There are 32 muffins.' },
        ],
        why: choice('wB', 'Which number tells how many groups there are?', [
          ['4', '4 is how many muffins are in each box. There are 8 boxes.'],
          ['32', '32 is the answer. There are 8 boxes.'],
          ['8', true],
        ], { yes: 'Yes! 8 boxes are the 8 equal groups.' }),
      },
    ],
  },
  together: {
    intro: "Let's solve some together. Use Hint if you get stuck.",
    items: [
      story('g1', 'A pet shop has 3 rows of fish tanks. Each row has 7 tanks. How many tanks are there?', 3, 7, {
        model: arr(3, 7),
        hints: ['3 rows of 7: 3 × 7.', '2 × 7 = 14. Add one more 7.'],
        mistakes: [{ when: { answer: 10 }, say: '3 + 7 is 10. There are 3 equal rows, so multiply.' }],
        show: ['3 × 7 = 2 × 7 + 1 × 7.', '14 + 7 = 21 tanks.'], yes: 'Yes! 21 tanks.',
      }),
      writeEq('g2', 'There are 4 vans. Each van carries 8 kids. Write the equation and solve.', 4, 8, {
        hints: ['How many vans? How many kids in each van?', '4 × 8: find 2 × 8 = 16, then double it.'],
        show: ['4 vans of 8 kids is 4 × 8.', '16 + 16 = 32. So 4 × 8 = 32.'],
      }),
      partsFill('g3', 9, 6, 'rows', 5, {
        prompt: 'A choir stands in 9 rows of 6 singers. Break apart the 9. Find each part, then add.',
        hints: ['The top part is 5 rows of 6. The bottom part is 4 rows of 6.'],
        yes: 'Yes! 30 + 24 = 54 singers.',
      }),
      choice('g4', 'Which equation matches this array?', [
        ['5 + 4', 'This is an array of equal rows, so multiply.'],
        ['5 × 4', true],
        ['4 × 4', 'Count the rows again. There are 5 rows of 4.'],
        ['5 × 5', 'Count the dots in one row. There are 4.'],
      ], {
        model: arr(5, 4), target: '5 × 4',
        hints: ['Count the rows. Then count the dots in one row.'],
        show: ['There are 5 rows with 4 dots in each row.', 'So the equation is 5 × 4 = 20.'], yes: 'Yes! 5 rows of 4 is 5 × 4 = 20.',
      }),
      story('g5', 'A class puts paper stars on a wall in 8 rows. Each row has 7 stars. How many stars are on the wall?', 8, 7, {
        hints: ['8 rows of 7: 8 × 7.', 'Double the 4s fact: 4 × 7 = 28. 28 + 28.'],
        mistakes: [{ when: { answer: 15 }, say: '8 + 7 is 15. There are 8 equal rows, so multiply.' }, { when: { answer: 28 }, say: '28 is only 4 rows. Double it for 8 rows.' }],
        show: ['8 × 7 = 4 × 7 + 4 × 7.', '28 + 28 = 56 stars.'], yes: 'Yes! 56 stars.',
      }),
      decompose('g6', 6, 9, ['rows', 5], {
        prompt: 'A bookcase has 6 shelves. Each shelf holds 9 books. Decompose 6 × 9 to find how many books.',
        model: arr(6, 9),
        hints: ['Break 6 into 5 + 1. Or break 9 into 5 + 4.', '5 × 9 + 1 × 9. Then add.'],
        show: ['Break 6 into 5 + 1.', '5 × 9 + 1 × 9 = 45 + 9 = 54 books.'],
      }),
    ],
  },
  try: {
    pass: 16,
    items: [
      // 1-5: understanding
      story('t1', 'Look at the array of stickers. How many stickers are there?', 5, 6, {
        model: arr(5, 6),
        hints: ['Count the rows. Then count the stickers in one row.', '5 rows of 6: count by 5s six times.'],
        mistakes: [{ when: { answer: 11 }, say: '5 + 6 is 11. There are 5 equal rows of 6, so multiply.' }, { when: { answer: 5 }, say: '5 is the number of rows. Each row has 6 stickers.' }],
        show: ['There are 5 rows with 6 stickers in each row.', '5 × 6 = 30 stickers.'], yes: 'Yes! 30 stickers.',
      }),
      choice('t2', 'Which equation matches this array?', [
        ['3 + 8', 'This is an array of equal rows, so multiply.'],
        ['8 × 8', 'Count the rows again. There are 3 rows.'],
        ['3 × 8', true],
        ['3 × 3', 'Count the dots in one row. There are 8.'],
      ], {
        model: arr(3, 8), target: '3 × 8',
        hints: ['Count the rows. Then count the dots in one row.'],
        show: ['There are 3 rows with 8 dots in each row.', 'So the equation is 3 × 8 = 24.'], yes: 'Yes! 3 rows of 8 is 3 × 8.',
      }),
      choice('t3', 'Ben has 6 bags. Each bag has 5 shells. Which equation tells how many shells he has?', [
        ['6 × 5 = ?', true],
        ['6 + 5 = ?', 'There are 6 equal bags of 5, so multiply.'],
        ['5 × 5 = ?', 'There are 6 bags, not 5.'],
      ], { hints: ['How many bags? How many shells in each bag?'], show: ['6 bags with 5 shells in each bag is 6 × 5.', '6 × 5 = 30 shells.'], yes: 'Yes! 6 bags of 5 is 6 × 5.' }),
      story('t4', 'There are 3 rows of desks. Each row has 4 desks. How many desks are there?', 3, 4, {
        model: arr(3, 4),
        hints: ['3 rows of 4: 3 × 4.', 'Count by 4s three times: 4, 8, 12.'],
        mistakes: [{ when: { answer: 7 }, say: '3 + 4 is 7. There are 3 equal rows, so multiply.' }],
        show: ['3 × 4 = 2 × 4 + 1 × 4.', '8 + 4 = 12 desks.'], yes: 'Yes! 12 desks.',
      }),
      writeEq('t5', 'There are 7 boxes. Each box has 3 toys. Write the equation and solve.', 7, 3, {
        hints: ['How many boxes? How many toys in each box?', '7 × 3: double 7 is 14, then add 7 more.'],
        show: ['7 boxes of 3 toys is 7 × 3.', '7 × 2 + 7 × 1 = 14 + 7 = 21.'],
      }),
      // 6-15: practice
      story('t6', 'A tray has 4 rows of muffins. Each row has 6 muffins. How many muffins are on the tray?', 4, 6, {
        hints: ['4 rows of 6: 4 × 6.', 'Find 2 × 6 = 12. Double it.'],
        mistakes: [{ when: { answer: 10 }, say: '4 + 6 is 10. There are 4 equal rows, so multiply.' }, { when: { answer: 12 }, say: '12 is only 2 rows. Double it for 4 rows.' }],
        show: ['4 × 6 = 2 × 6 + 2 × 6.', '12 + 12 = 24 muffins.'], yes: 'Yes! 24 muffins.',
      }),
      story('t7', 'A triangle has 3 sides. How many sides do 8 triangles have?', 8, 3, {
        hints: ['8 triangles with 3 sides: 8 × 3.', 'Double 8 is 16. Add 8 more.'],
        mistakes: [{ when: { answer: 11 }, say: '8 + 3 is 11. Each triangle has 3 sides, so multiply.' }],
        show: ['8 × 3 = 8 × 2 + 8 × 1.', '16 + 8 = 24 sides.'], yes: 'Yes! 24 sides.',
      }),
      partsFill('t8', 7, 8, 'rows', 5, {
        prompt: 'A wall has 7 rows of 8 tiles. Break apart the 7. Find each part, then add.',
        hints: ['The top part is 5 rows of 8. The bottom part is 2 rows of 8.'],
        yes: 'Yes! 40 + 16 = 56 tiles.',
      }),
      story('t9', 'Each row in a small theater has 9 seats. How many seats are in 6 rows?', 6, 9, {
        hints: ['6 rows of 9: 6 × 9.', '5 × 9 = 45. Add one more row of 9.'],
        mistakes: [{ when: { answer: 15 }, say: '6 + 9 is 15. There are 6 equal rows, so multiply.' }, { when: { answer: 45 }, say: '45 is only 5 rows. Add one more row of 9.' }],
        show: ['6 × 9 = 5 × 9 + 1 × 9.', '45 + 9 = 54 seats.'], yes: 'Yes! 54 seats.',
      }),
      decompose('t10', 8, 8, ['rows', 4], {
        prompt: 'A game board has 8 rows of 8 squares. Decompose 8 × 8 to find the number of squares.',
        hints: ['Break one 8 into 4 + 4, or into 5 + 3.', '4 × 8 + 4 × 8. Then add.'],
        show: ['Break 8 into 4 + 4.', '4 × 8 + 4 × 8 = 32 + 32 = 64 squares.'],
      }),
      story('t11', 'A spider has 8 legs. How many legs do 5 spiders have?', 5, 8, {
        hints: ['5 spiders with 8 legs: 5 × 8.', 'Count by 5s eight times, or by 8s five times.'],
        mistakes: [{ when: { answer: 13 }, say: '5 + 8 is 13. Each spider has 8 legs, so multiply.' }],
        show: ['5 spiders with 8 legs each is 5 × 8.', 'Count by 5s eight times: 5, 10, 15, 20, 25, 30, 35, 40.', 'There are 40 legs.'], yes: 'Yes! 40 legs.',
      }),
      story('t12', 'A team has 9 players. How many players are on 4 teams?', 4, 9, {
        hints: ['4 teams of 9: 4 × 9.', 'Find 2 × 9 = 18. Double it.'],
        mistakes: [{ when: { answer: 13 }, say: '4 + 9 is 13. Each team has 9 players, so multiply.' }, { when: { answer: 18 }, say: '18 is only 2 teams. Double it for 4 teams.' }],
        show: ['4 × 9 = 2 × 9 + 2 × 9.', '18 + 18 = 36 players.'], yes: 'Yes! 36 players.',
      }),
      {
        id: 't13', type: 'fill', prompt: 'What number makes it true?', lines: ['9 × [x] = 63'], answer: { x: 7 },
        hints: ['Count by 9s: 9, 18, 27 … Stop at 63. Count how many 9s you said.', 'Or start at 9 × 5 = 45 and keep adding 9 until you reach 63.'],
        mistakes: [{ when: { x: 54 }, say: 'That box needs a factor. 9 × what makes 63?' }, { when: { x: 6 }, say: '9 × 6 is 54. One more 9 makes 63.' }],
        show: ['9 × 7 = 5 × 7 + 4 × 7.', '35 + 28 = 63. So the missing number is 7.'], yes: 'Yes! 9 × 7 = 63.',
      },
      table('t14', 'Each pack has 6 juice boxes. Fill in the table.', ['Packs', 'Juice boxes'], [
        ['3', { answer: '3 × 6' }],
        ['5', { answer: '5 × 6' }],
        ['8', { answer: '8 × 6' }],
      ], {
        hints: ['Each pack has 6, so multiply the packs by 6.', '3 packs: 3 × 6.'],
        retry: 'Check each row: packs × 6.',
        show: ['3 × 6 = 18.', '5 × 6 = 30.', '8 × 6 = 48.'],
        yes: 'Yes! Packs × 6 gives the juice boxes.',
      }),
      choice('t15', 'A farmer plants 9 rows with 7 plants in each row. Which is a correct way to find the total?', [
        ['9 + 7', 'The rows are equal groups, so multiply.'],
        ['5 × 7 + 4', 'The second part must be a whole fact: 4 × 7, not 4.'],
        ['5 × 7 + 4 × 7', true],
        ['9 × 5 + 9 × 3', '5 and 3 make 8, not 7.'],
      ], { target: '9 × 7', hints: ['The fact is 9 × 7. The two parts must add up to 9 rows, and each part keeps the 7.'], show: ['9 × 7 = 5 × 7 + 4 × 7.', '35 + 28 = 63 plants.'], yes: 'Yes! 35 + 28 = 63 plants.' }),
      // 16-20: apply and explain
      choice('t16', 'Theo\'s problem: 4 boxes, 9 books in each box. Theo wrote 4 + 9 = 13. What went wrong?', [
        ['Theo added. He should multiply: 4 × 9.', true],
        ['Nothing. It is correct.', 'There are 4 equal groups of 9, so multiply. 4 × 9 = 36.'],
        ['He should take away: 9 − 4.', 'Nothing is taken away. There are 4 equal groups of 9.'],
      ], { hints: ['Are there equal groups?', 'Equal groups mean multiply.'], show: ['4 boxes of 9 books is 4 × 9.', '4 × 9 = 18 + 18 = 36 books.'], yes: 'Yes! 4 × 9 = 36 books.' }),
      choice('t17', 'Which story can you solve with 5 × 8?', [
        ['There are 5 red flowers and 8 yellow flowers. How many flowers?', 'That is 5 + 8. There are no equal groups.'],
        ['There are 5 vases with 8 flowers in each. How many flowers?', true],
        ['There were 8 flowers. 5 were picked. How many are left?', 'That is 8 − 5. Nothing is multiplied.'],
      ], { hints: ['5 × 8 means 5 equal groups of 8.'], show: ['5 vases with 8 flowers in each is 5 equal groups of 8.', '5 × 8 = 40 flowers.'], yes: 'Yes! 5 equal groups of 8.' }),
      story('t18', 'A van has 4 rows of seats. Each row has 3 seats. 2 of the seats are red. How many seats are in the van?', 4, 3, {
        hints: ['Not every number is needed. Find the rows and the seats in each row.', '4 rows of 3: 4 × 3.'],
        mistakes: [{ when: { answer: 9 }, say: 'The 2 red seats are already counted. Just find 4 rows of 3.' }, { when: { answer: 7 }, say: '4 + 3 is 7. There are 4 equal rows, so multiply.' }, { when: { answer: 14 }, say: 'The 2 red seats are part of the 12, not extra. Just find 4 rows of 3.' }, { when: { answer: 10 }, say: 'Red seats are still seats. Do not take them away. Find 4 rows of 3.' }],
        show: ['The red seats do not change how many seats there are.', '4 × 3 = 12 seats.'], yes: 'Yes! 12 seats. The red seats were extra information.',
      }),
      choice('t19', 'Eli says 7 rows of 9 chairs is 16 chairs. Does that make sense?', [
        ['Yes. 7 + 9 = 16.', 'Rows of chairs are equal groups. Multiply: 7 × 9 = 63.'],
        ['No. There are 79 chairs.', 'Check: 7 × 9 = 45 + 18 = 63.'],
        ['No. 16 is 7 + 9. There are 63 chairs.', true],
      ], { hints: ['2 rows of 9 is already 18. Can 7 rows be only 16?'], show: ['7 rows of 9 is 7 × 9.', '7 × 9 = 5 × 9 + 2 × 9 = 45 + 18 = 63 chairs.'], yes: 'Yes! 16 is much too small. 7 × 9 = 63.' }),
      story('t20', 'A parking lot has 9 rows with 8 cars in each row. Then 1 more row of 8 cars is added. How many cars are there now?', 10, 8, {
        hints: ['How many rows are there now?', 'Each row has 8 cars. Multiply the rows by 8.'],
        mistakes: [{ when: { answer: 72 }, say: 'That is 9 rows. Do not forget the new row of 8.' }, { when: { answer: 73 }, say: 'The new row has 8 cars, not 1. Add 8 to 72.' }],
        show: ['9 rows + 1 row = 10 rows of 8.', '10 × 8 = 80 cars.'], yes: 'Yes! 80 cars.',
      }),
    ],
  },
  test: {
    pass: 7,
    items: [
      forTest(story('x1', 'There are 5 rows of trees. Each row has 7 trees. How many trees are there?', 5, 7, { show: ['5 rows of 7 is 5 × 7.', '5 × 7 = 35 trees.'] })),
      forTest(choice('x2', 'Which equation matches this array?', [
        ['4 + 9', 'This is an array of equal rows, so multiply.'],
        ['4 × 9', true],
        ['9 × 9', 'There are 4 rows, not 9.'],
        ['4 × 4', 'Each row has 9 dots, not 4.'],
      ], { model: arr(4, 9), target: '4 × 9', show: ['4 rows with 9 dots in each row is 4 × 9 = 36.'] })),
      forTest(story('x3', 'Each box has 8 crayons. How many crayons are in 6 boxes?', 6, 8, { show: ['6 boxes of 8 is 6 × 8.', '5 × 8 + 1 × 8 = 40 + 8 = 48 crayons.'] })),
      forTest(partsFill('x4', 9, 3, 'rows', 5, { prompt: 'A garden has 9 rows of 3 plants. Find each part, then add.' })),
      forTest(writeEq('x5', 'There are 3 bags. Each bag has 9 apples. Write the equation and solve.', 3, 9, { show: ['3 bags of 9 apples is 3 × 9.', '2 × 9 + 1 × 9 = 18 + 9 = 27.'] })),
      forTest(decompose('x6', 7, 6, ['rows', 5], { prompt: 'A box holds 7 rows of 6 eggs. Decompose 7 × 6 to find the number of eggs.', show: ['Break 7 into 5 + 2: 5 × 6 + 2 × 6.', '30 + 12 = 42 eggs.'] })),
      forTest(choice('x7', 'Which story can you solve with 4 × 6?', [
        ['There are 4 plates with 6 grapes on each plate. How many grapes?', true],
        ['There are 4 green grapes and 6 red grapes. How many grapes?', 'That is 4 + 6. There are no equal groups.'],
        ['There were 6 grapes. 4 were eaten. How many are left?', 'That is 6 − 4. Nothing is multiplied.'],
      ], { show: ['4 plates with 6 grapes each is 4 equal groups of 6.', '4 × 6 = 24 grapes.'] })),
      forTest(story('x8', 'A bus has 9 rows. Each row has 6 seats. How many seats are on the bus?', 9, 6, { show: ['9 rows of 6 is 9 × 6.', '5 × 6 + 4 × 6 = 30 + 24 = 54 seats.'] })),
    ],
  },
  parent: {
    sections: [
      { heading: 'What your child is learning', text: 'To solve multiplication story problems: find the equal groups, write an equation such as 6 × 8 = ?, solve it with a strategy (often by breaking apart a factor), and check that the answer makes sense. This lesson does not use division.' },
      { heading: 'Try it with real things', list: ['At the store: "Each pack has 6 yogurts. How many in 3 packs?"', 'At home: count chairs, windows or egg cups set out in rows. Ask "How many rows? How many in each row?"'] },
      { heading: 'Questions to ask', list: ['What are the equal groups?', 'What equation did you write?', 'Which strategy did you use?', 'Does the answer make sense?'] },
      { heading: 'Common mistakes', list: ['Adding the two numbers instead of multiplying (6 + 9 instead of 6 × 9).', 'Using a number that is not needed (extra information).', 'Not checking whether the answer is about the right size.'] },
      { heading: 'A note on notation', text: 'Some books write the facts without ( ) and some with ( ). Both mean the same thing. Study Scoop uses original practice questions; it never copies the textbook.' },
    ],
  },
};
