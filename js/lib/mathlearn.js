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
    // The class organizer lists this fifth property; the week file has no teacher wording for it, so `def` is the
    // Product Owner's definition and is labelled "Definition", never "Teacher's words".
    key: 'associative', name: 'Associative Property', kid: 'Changing the grouping of three or more factors does not change the product.',
    def: 'Changing the grouping of three or more factors does not change the product.',
    eq: '(2 × 3) × 4 = 2 × (3 × 4)',
    models: [
      { model: { type: 'array', rows: 6, cols: 4 }, caption: '(2 × 3) × 4: first 2 × 3 = 6, so 6 rows of 4' },
      { model: { type: 'array', rows: 2, cols: 12 }, caption: '2 × (3 × 4): first 3 × 4 = 12, so 2 rows of 12' },
    ],
    caption: 'Both arrays have 24 dots',
    steps: ['(2 × 3) × 4: do the ( ) first. 2 × 3 = 6, then 6 × 4 = 24.', '2 × (3 × 4): do the ( ) first. 3 × 4 = 12, then 2 × 12 = 24.', 'The factors stay in the same order. Only the ( ) move. The product stays 24.'],
    // Commutative vs Associative: the two children mix up most often (DECISIONS D20).
    contrast: 'Commutative changes the order of the factors: 3 × 7 = 7 × 3. Associative keeps the order and changes the grouping: (2 × 3) × 4 = 2 × (3 × 4).',
  },
  {
    key: 'distributive', name: 'Distributive Property', kid: 'You can break apart a factor, multiply the smaller parts, and add their products.',
    eq: '6 × 3 = (5 × 3) + (1 × 3)', model: { type: 'array', rows: 6, cols: 3, cut: { by: 'rows', at: 5 }, labels: 'facts' },
    caption: '6 rows of 3, split into 5 rows of 3 and 1 row of 3',
    steps: ['Break apart the 6 into 5 + 1.', 'Multiply each part: 5 × 3 = 15 and 1 × 3 = 3.', 'Add the products: 15 + 3 = 18.', 'So 6 × 3 = 18.'],
    // A second example: the same idea with two equal parts.
    second: {
      eq: '6 × 7 = (3 × 7) + (3 × 7)', model: { type: 'array', rows: 6, cols: 7, cut: { by: 'rows', at: 3 }, labels: 'facts' },
      caption: '6 rows of 7, split into 3 rows of 7 and 3 rows of 7',
      steps: ['Break apart the 6 into 3 + 3.', 'Multiply each part: 3 × 7 = 21 and 3 × 7 = 21.', 'Add the products: 21 + 21 = 42.', 'So 6 × 7 = 42.'],
    },
  },
];

/** The week's teacher entry for a property (exact words), or null when the week does not list it. */
export function teacherWord(week, prop) {
  return (week?.math?.words || []).find((w) => w.word.toLowerCase().includes(prop.key)) || null;
}

/** A property by its key ('identity', 'zero', 'commutative', 'associative', 'distributive'). */
export const propertyByKey = (key) => PROPERTIES.find((p) => p.key === key) || null;

/** The words to show as a property's definition: the teacher's exact words when the week has them, otherwise the
 *  property's own definition (labelled "Definition", so it is never passed off as the teacher's). */
export function definitionOf(week, prop) {
  const tw = teacherWord(week, prop);
  if (tw) return { text: tw.def, teacher: true };
  return prop.def ? { text: prop.def, teacher: false } : null;
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
    'I can name the property that a fact shows, including the Associative Property.',
    'I can match a split array to its two facts.',
    'I can break apart a factor, multiply the parts and add.',
  ],
};

/** Study Guide: Unit 5 goals, the strategy for each factor, patterns, mix-ups and review questions (Study Scoop's own words). */
export const UNIT5 = {
  goals: [
    'Name the five multiplication properties and give an example of each.',
    'Read a split array and write its two facts.',
    'Break apart a factor into two easier facts, multiply each, and add.',
    'Use known facts to multiply by 3, 4, 6, 7, 8 and 9.',
    'Solve story problems with equal groups and arrays.',
  ],
  // Each row: the factor, how to break it apart, and one worked example (every sum is checked by the tests).
  strategies: [
    ['3', '2 + 1', 'Double, then add one more group: 3 × 7 = 14 + 7 = 21.'],
    ['4', '2 + 2', 'Double the 2s fact: 4 × 7 = 14 + 14 = 28.'],
    ['6', '5 + 1 or 3 + 3', '6 × 7 = 35 + 7 = 42, or 6 × 7 = 21 + 21 = 42.'],
    ['7', '5 + 2', '7 × 6 = 30 + 12 = 42.'],
    ['8', '4 + 4 or 5 + 3', '8 × 6 = 24 + 24 = 48, or 8 × 6 = 30 + 18 = 48.'],
    ['9', '5 + 4', '9 × 6 = 30 + 24 = 54.'],
  ],
  patterns: [
    'Doubling chain: 2 × 6 = 12, 4 × 6 = 24, 8 × 6 = 48. Each one doubles the last.',
    '3s and 6s: 3 × 7 = 21, so 6 × 7 = 21 + 21 = 42.',
    'Turn-around facts: 4 × 9 = 36 and 9 × 4 = 36. If you know one, you know both.',
  ],
  mixups: [
    'Commutative or Associative? Commutative changes the order: 3 × 7 = 7 × 3. Associative keeps the order and moves the ( ): (2 × 3) × 4 = 2 × (3 × 4).',
    'Identity or Zero? Times 1 keeps the number: 8 × 1 = 8. Times 0 makes 0: 8 × 0 = 0.',
    'The second part must be a whole fact: 6 × 4 = 5 × 4 + 1 × 4, not 5 × 4 + 1.',
    'The parts must add up to the factor: 8 = 5 + 3, not 5 + 2.',
    'Multiply equal groups. 6 rows of 9 is 6 × 9 = 54, not 6 + 9 = 15.',
  ],
  // Self-check questions; the answers are printed at the end of the guide.
  review: [
    ['Which property does 5 × 1 = 5 show?', 'Identity Property'],
    ['Which property does (3 × 2) × 5 = 3 × (2 × 5) show?', 'Associative Property'],
    ['Finish it: 7 × 4 = 5 × 4 + 2 × 4 = 20 + 8 = ?', '28'],
    ['Double the 2s fact to find 4 × 8.', '16 + 16 = 32'],
    ['Find 9 × 7 with a 5s fact.', '35 + 28 = 63'],
    ['A tray has 6 rows of 8 cookies. How many cookies?', '6 × 8 = 48 cookies'],
  ],
};
