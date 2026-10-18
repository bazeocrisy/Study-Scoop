// Math > Learn the Properties and Math > Study Guide: what each multiplication property means, with a picture
// drawn from the same numbers as its equation. Pure data and helpers (no DOM). DECISIONS D19.
// The teacher's exact words come from the week file (math.words); the child-friendly lines here only add to them.

export const PROPERTIES = [
  {
    key: 'identity', name: 'Identity Property', kid: 'Any number multiplied by 1 stays the same.',
    eq: '7 × 1 = 7', model: { type: 'plates', plates: 7, each: 1, perRow: 4 }, caption: '7 groups of 1',
    steps: ['7 × 1 means 7 groups of 1.', 'Count the dots: there are 7.', 'So 7 × 1 = 7. Multiplying by 1 keeps the 7 the same.'],
  },
  {
    key: 'zero', name: 'Zero Property', kid: 'Any number multiplied by 0 equals 0.',
    eq: '9 × 0 = 0', model: { type: 'plates', plates: 9, each: 0, perRow: 5 }, caption: '9 groups of 0: every plate is empty',
    steps: ['9 × 0 means 9 groups of 0.', 'Every group is empty, so there is nothing to count.', 'So 9 × 0 = 0.'],
  },
  {
    key: 'commutative', name: 'Commutative Property', kid: 'Changing the order of the factors does not change the product.',
    eq: '4 × 2 = 2 × 4 = 8', model: { type: 'pair', left: { rows: 4, cols: 2, star: [0, 0] }, right: { rows: 2, cols: 4, star: [0, 3] } },
    caption: '4 rows of 2 turn into 2 rows of 4. The star shows the same dot.',
    steps: ['4 × 2 is 4 rows of 2. That is 8 dots.', 'Turn the array. Now it is 2 rows of 4.', '2 × 4 is 8 dots too. The order changed, but the product stayed 8.'],
  },
  {
    key: 'distributive', name: 'Distributive Property', kid: 'You can break apart a factor, multiply the smaller parts, and add their products.',
    eq: '6 × 7 = (3 × 7) + (3 × 7)', model: { type: 'array', rows: 6, cols: 7, cut: { by: 'rows', at: 3 }, labels: 'facts' },
    caption: '6 rows of 7, split into 3 rows of 7 and 3 rows of 7',
    steps: ['Break apart the 6 into 3 + 3.', 'Multiply each part: 3 × 7 = 21 and 3 × 7 = 21.', 'Add the products: 21 + 21 = 42.', 'So 6 × 7 = 42.'],
  },
];

/** The week's teacher entry for a property (exact words), or null when the week does not list it. */
export function teacherWord(week, prop) {
  return (week?.math?.words || []).find((w) => w.word.toLowerCase().includes(prop.key)) || null;
}

/** The teacher's example sentence with its blank filled in ("6 × 3 into (5 × 3) + (1 × 3) uses the Distributive Property."). */
export const teacherExample = (w) => (w?.fill?.includes('___') ? w.fill.replace('___', w.word) : '');

/** Study Guide: words to know (Study Scoop's own short explanations). */
export const GUIDE_WORDS = [
  ['factor', 'a number you multiply. In 4 × 2, the factors are 4 and 2.'],
  ['product', 'the answer when you multiply. In 4 × 2 = 8, the product is 8.'],
  ['array', 'objects in equal rows. 3 rows of 5 dots is a 3 × 5 array.'],
  ['row', 'a line of objects going across.'],
  ['column', 'a line of objects going up and down.'],
  ['break apart (decompose)', 'split a number into smaller parts, like 6 = 3 + 3.'],
];

/** Study Guide: how to use the Distributive Property, and how to read a split array. */
export const GUIDE_STEPS = {
  breakApart: [
    'Pick a factor to break apart.',
    'Break it into two smaller numbers that add up to it.',
    'Multiply each part by the other factor.',
    'Add the two products.',
  ],
  breakExamples: [
    'Break apart the 7: 3 × 7 = (3 × 2) + (3 × 5) = 6 + 15 = 21.',
    'Break apart the 3: 3 × 7 = (2 × 7) + (1 × 7) = 14 + 7 = 21.',
  ],
  splitModel: { type: 'array', rows: 5, cols: 6, cut: { by: 'rows', at: 2 }, labels: 'facts' },
  split: [
    'Look at where the line is: between rows or between columns.',
    'Count the rows in each part. Count the dots in each row.',
    'Write a fact for each part: 2 × 6 and 3 × 6.',
    'Add the products: 12 + 18 = 30. So 5 × 6 = (2 × 6) + (3 × 6) = 30.',
  ],
  ready: [
    'I can name the property that a fact shows.',
    'I can match a split array to its two facts.',
    'I can break apart a factor, multiply the parts and add.',
  ],
};
