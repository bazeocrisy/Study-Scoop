// Math Topic 6: Area (week of Oct 26–30; class vocabulary test Tuesday, Nov 3). Pure data and helpers (no DOM).
// The teacher's three words and exact definitions come from the week file (math.words). Everything here is
// Study Scoop's own: child-friendly explanations, worked examples, and the checks for data/practice/area.json.
// Every picture is drawn from numbers (js/lib/models.js tiles), and every answer is worked out again from them.

import { normWord, validateQuiz } from './lessons.js';
import { evaluate } from './arith.js';
import { shuffle } from './activities.js';

/** The three teacher words, in the order of the class vocabulary sheet. */
export const AREA_WORDS = ['Area', 'Square Unit', 'Multiply'];

/** True when a week's math is Topic 6: Area (its words are the three Area words). */
export const isAreaWeek = (week) => {
  const words = (week?.math?.words || []).map((w) => normWord(w.word));
  return AREA_WORDS.every((w) => words.includes(normWord(w)));
};

/** Learn Area: one card per word. `kid` adds to the teacher's words (it never replaces them). */
export const AREA_LEARN = [
  {
    word: 'Area',
    kid: 'Area is how much flat space is inside a shape. Cover the inside with unit squares, with no gaps and no overlaps, then count them.',
    model: { type: 'array', style: 'tiles', rows: 3, cols: 4 }, caption: 'This rectangle is covered by 12 unit squares.',
    steps: ['Look at the inside of the rectangle. It is covered by small squares.', 'Count them: 3 rows of 4 squares. That is 12 squares.', 'So the area is 12 square units.'],
  },
  {
    word: 'Square Unit',
    kid: 'A square unit is one small square. Each side is 1 unit long. We count area in square units.',
    model: { type: 'array', style: 'tiles', rows: 1, cols: 1, sideLabels: true }, caption: 'One square unit: 1 unit tall and 1 unit wide.',
    steps: ['This square is 1 unit tall and 1 unit wide.', 'It is one square unit.', 'Area is the number of these squares inside a shape: 5 squares is 5 square units.'],
  },
  {
    word: 'Multiply',
    kid: 'You do not have to count every square. Multiply the length (squares in one row) by the width (the number of rows).',
    model: { type: 'array', style: 'tiles', rows: 3, cols: 4, sideLabels: true }, caption: '4 units long and 3 units wide: 4 × 3 = 12.',
    steps: ['The length is 4 units. The width is 3 units.', 'Multiply the length and the width: 4 × 3 = 12.', 'The area is 12 square units. That is the same as counting all 12 squares.'],
  },
];

/** Learn Area: worked examples (Watch Me), each checked by the unit tests against its numbers. */
export const AREA_EXAMPLES = [
  {
    title: 'Count the square units',
    model: { type: 'array', style: 'tiles', rows: 2, cols: 5 }, rows: 2, cols: 5,
    steps: ['Count the squares in the top row: 5.', 'Count the rows: 2.', 'Count all the squares: 5 + 5 = 10.', 'The area is 10 square units.'],
  },
  {
    title: 'Multiply the length and the width',
    model: { type: 'array', style: 'tiles', rows: 3, cols: 6, sideLabels: true }, rows: 3, cols: 6,
    steps: ['The rectangle is 6 units long and 3 units wide.', 'Multiply: 6 × 3 = 18.', 'The area is 18 square units.'],
  },
  {
    title: 'A story problem',
    story: 'A rug is 4 feet long and 2 feet wide. What is its area?', rows: 2, cols: 4,
    model: { type: 'array', style: 'tiles', rows: 2, cols: 4, sideLabels: true },
    steps: ['The length is 4 feet. The width is 2 feet.', 'Multiply: 4 × 2 = 8.', 'The rug covers 8 square feet. Each square foot is a square 1 foot long and 1 foot wide.'],
  },
];

/** Tips shown on Learn Area (Study Scoop's own words). */
export const AREA_TIPS = [
  'Area covers the inside of a shape. It is not the edge around the outside.',
  'Do not add the sides. For a rectangle 4 long and 3 wide, 4 + 3 = 7 is not the area. Multiply: 4 × 3 = 12.',
  'Say the unit: square units, square feet, square inches or square meters.',
];

/** Chapter 6 Review: one picture per lesson (each drawn from its numbers) and the mistakes to watch for. */
export const CH6_SUMMARY = [
  { title: '6-1 Understand Area', text: 'Cover the inside with unit squares, no gaps and no overlaps, and count them.', model: { type: 'grid', cells: ['XXXX', 'XXXX', 'XXXX'] }, eq: '4 + 4 + 4 = 12' },
  { title: '6-2 Count Unit Squares', text: 'Count row by row, and name the unit: each square is 1 square foot here.', model: { type: 'shape', rects: [[0, 0, 5, 2]], unit: 'ft', tiles: true }, eq: '5 + 5 = 10' },
  { title: '6-3 Multiply', text: 'Area of a rectangle = length × width.', model: { type: 'shape', rects: [[0, 0, 7, 3]], unit: 'cm' }, eq: '7 × 3 = 21' },
  { title: '6-4 Composite Figures', text: 'Split into rectangles with no overlap, find each area, and add.', model: { type: 'shape', rects: [[0, 0, 6, 2], [4, 2, 2, 3]], unit: 'units', show: 'parts', areas: true }, eq: '12 + 6 = 18' },
  { title: '6-5 Split a Side', text: 'Break one side into two parts. Keep the other side. Add the two areas.', model: { type: 'shape', rects: [[0, 0, 5, 6], [5, 0, 3, 6]], unit: 'units', show: 'parts', areas: true }, eq: '8 × 6 = 30 + 18 = 48' },
  { title: '6-6 Area Problems', text: 'Find the numbers, picture the shape, write an equation, and label the answer.', model: { type: 'shape', rects: [[0, 0, 10, 4], [10, 0, 5, 4]], unit: 'ft', show: 'parts', areas: true }, eq: '15 × 4 = 40 + 20 = 60' },
];
export const CH6_MISTAKES = [
  'Adding the sides instead of multiplying: a 4 by 3 rectangle is 4 × 3 = 12, not 4 + 3 = 7.',
  'Adding all four sides (that goes around the outside) when the question asks what is covered.',
  'Writing "12 feet" instead of "12 square feet".',
  'Counting only the tiles that are drawn when part of a shape is not tiled yet.',
  'Splitting a figure so that two parts overlap, or forgetting to add a part.',
  'When splitting a side, forgetting to multiply one part: 3 × 17 is (3 × 10) + (3 × 7) = 51, not (3 × 10) + 7.',
];

/**
 * The Chapter 6 Study Guide (D26): Study Scoop's own explanations, one picture per idea (drawn from its numbers),
 * the problem-solving steps, and a self-check with answers. `eq` lines and self-check `value`s are re-checked by
 * the unit tests (tests/unit/chapters.test.js). The teacher's exact words are added from the week file.
 */
export const CH6_GUIDE = {
  goals: [
    'Explain what area is and name it in square units.',
    'Tile a shape with no gaps and no overlaps, and count the unit squares.',
    'Multiply the length and the width to find the area of a rectangle.',
    'Split a composite figure into rectangles, find each area, and add.',
    'Split one side of a rectangle (the Distributive Property) to multiply bigger numbers.',
    'Solve area story problems and label the answer.',
  ],
  sections: [
    { id: 'area', title: '1. What area means', teacher: 'Area', text: ['Area is how much flat space is inside a shape.', 'Cover the inside with unit squares and count them. This rectangle has 12.'],
      model: { type: 'grid', cells: ['XXXX', 'XXXX', 'XXXX'] }, caption: '12 unit squares cover the inside', eq: '4 + 4 + 4 = 12' },
    { id: 'unit', title: '2. Unit squares and square units', teacher: 'Square Unit', text: ['A unit square is 1 unit long on each side. It covers 1 square unit.', 'Name the unit: square centimeters, square inches, square feet or square meters.'],
      model: { type: 'array', style: 'tiles', rows: 1, cols: 1, sideLabels: true }, caption: 'One square unit' },
    { id: 'tile', title: '3. No gaps and no overlaps', text: ['Tiles must cover the whole inside. A gap leaves space that is not counted.', 'Tiles must not lie on top of each other. An overlap counts some space twice.'],
      models: [{ type: 'grid', cells: ['XXXX', 'XXXX'] }, { type: 'grid', cells: ['XXXX', 'XXXX'], tiling: 'gaps' }, { type: 'grid', cells: ['XXXX', 'XXXX'], tiling: 'overlap' }],
      captions: ['Correct', 'Gaps: wrong', 'Overlaps: wrong'] },
    { id: 'count', title: '4. Count the unit squares', text: ['Count row by row, then add the rows.', 'A shape does not have to be a rectangle: count every square inside it.'],
      model: { type: 'grid', cells: ['XXXXX', 'XXXXX', 'XXX..'], paper: true }, caption: 'Rows of 5, 5 and 3', eq: '5 + 5 + 3 = 13' },
    { id: 'multiply', title: '5. Multiply the length and the width', teacher: 'Multiply', text: ['You do not have to count every square.', 'Area of a rectangle = length × width. Here 7 × 3 = 21 square centimeters.'],
      model: { type: 'shape', rects: [[0, 0, 7, 3]], unit: 'cm' }, caption: '7 cm long and 3 cm wide', eq: '7 × 3 = 21' },
    { id: 'composite', title: '6. Composite figures: split, then add', text: ['Split the figure into rectangles that do not overlap.', 'Find the area of each rectangle, then add the areas.'],
      model: { type: 'shape', rects: [[0, 0, 6, 2], [4, 2, 2, 3]], unit: 'units', show: 'parts', areas: true }, caption: '6 × 2 = 12 and 2 × 3 = 6', eq: '12 + 6 = 18' },
    { id: 'side', title: '7. A missing side', text: ['When a side has no number, use the sides you know.', 'The bottom is 8 units and the top part covers 5 of them, so the missing side is 8 - 5 = 3 units.'],
      model: { type: 'shape', rects: [[0, 0, 5, 2], [0, 2, 8, 3]], unit: 'units', unknown: [[5, 2, 8, 2]] }, caption: 'The ? side: 8 - 5 = 3', eq: '8 - 5 = 3' },
    { id: 'split', title: '8. Split a side (the Distributive Property)', text: ['Break one side into two easier numbers, such as 13 = 10 + 3. Keep the other side.', 'Multiply each part, then add: 4 × 13 = (4 × 10) + (4 × 3).'],
      model: { type: 'shape', rects: [[0, 0, 10, 4], [10, 0, 3, 4]], unit: 'units', show: 'parts', areas: true }, caption: '40 + 12 = 52', eq: '4 × 10 + 4 × 3 = 52' },
  ],
  steps: ['Read the problem.', 'Find the important numbers and units.', 'Picture the shape: one rectangle, or a figure to split.', 'Write an equation.', 'Calculate.', 'Label the answer in square units.', 'Check: does the answer make sense?'],
  example: {
    story: 'A patio is 9 feet long and 6 feet wide. How much ground does it cover?',
    model: { type: 'shape', rects: [[0, 0, 9, 6]], unit: 'ft' },
    lines: ['The patio is a rectangle 9 feet long and 6 feet wide.', 'Area = length × width, so 9 × 6.', '9 × 6 = 54.', 'The patio covers 54 square feet.', 'Check: 9 × 6 is close to 10 × 6 = 60, so 54 makes sense.'],
    eq: '9 × 6 = 54',
  },
  check: [
    { q: 'A rectangle is covered by 4 rows of 6 unit squares, with no gaps and no overlaps. What is its area?', a: '24 square units', why: '6 + 6 + 6 + 6 = 24, or 4 × 6 = 24.', eq: '4 × 6', value: 24 },
    { q: 'A garden is 7 meters long and 5 meters wide. What is its area?', a: '35 square meters', why: 'Multiply the length and the width: 7 × 5 = 35.', eq: '7 × 5', value: 35 },
    { q: 'Some tiles inside a shape have a gap between them. Why is the number of tiles not the area?', a: 'The gap is inside the shape but not covered, so the count is too small.', why: 'Area counts every unit square needed to cover the whole inside.' },
    { q: 'Each side of a square tile is 1 inch long. What is its area?', a: '1 square inch', why: 'A square 1 unit tall and 1 unit wide is one square unit. Here the unit is an inch.' },
    { q: 'A figure splits into a 6 by 2 rectangle and a 2 by 3 rectangle that do not overlap. What is its area?', a: '18 square units', why: '6 × 2 = 12 and 2 × 3 = 6. Then 12 + 6 = 18.', eq: '6 × 2 + 2 × 3', value: 18 },
    { q: '4 × 13 = (4 × 10) + (4 × ?). What is the missing number, and what is 4 × 13?', a: '3, and 4 × 13 = 52', why: '13 = 10 + 3. 4 × 10 = 40 and 4 × 3 = 12. 40 + 12 = 52.', eq: '4 × 10 + 4 × 3', value: 52 },
    { q: 'A student says a rug 5 feet long and 3 feet wide covers 8 square feet. What went wrong?', a: 'The student added 5 + 3. Multiply: 5 × 3 = 15 square feet.', why: 'Adding two sides does not find area.', eq: '5 × 3', value: 15 },
    { q: 'Rug A is 4 feet by 4 feet. Rug B is 3 feet by 6 feet. Which covers more floor?', a: 'Rug B: 18 square feet is more than 16 square feet.', why: '4 × 4 = 16 and 3 × 6 = 18.', eq: '3 × 6', value: 18 },
  ],
};

/** Practice activities: Mixed Practice (problems) and the Area Words quizzes (vocabulary, with their own misses). */
export const AREA_SETS = { areafind: ['find'], avchoice: ['vocab', 'choice'], avtf: ['vocab', 'truefalse'], avfill: ['vocab', 'fill'] };
/** The card activities of Area Words: Review My Words and Flashcards. */
export const AREA_CARDS = ['avreview', 'avflash'];
export const areaVocabWords = (bank) => bank?.vocab?.words || [];

/** The questions for one Area practice activity, shuffled (True/False options stay in order). */
export function areaItems(bank, act, rand = Math.random) {
  const list = (AREA_SETS[act] || []).reduce((o, k) => o?.[k], bank) || [];
  return shuffle(list, rand).map((it) => (it.type === 'choice' && it.options.length > 2 && !it.keepOrder ? { ...it, options: shuffle(it.options, rand) } : it));
}

/**
 * The Nov 3 Math Vocabulary practice test: the teacher's three words only, four questions each (meaning, which word,
 * true or false, fill in the blank), picked from the test's own pool so a retake can differ. No hints.
 */
export function areaVocabTest(bank, rand = Math.random) {
  const pool = bank?.vocab?.test || [];
  const picked = [];
  for (const w of AREA_WORDS) {
    for (const kind of ['meaning', 'name', 'tf', 'fill']) {
      const forms = pool.filter((it) => it.word === w && it.kind === kind);
      if (forms.length) picked.push(forms[Math.floor(rand() * forms.length)]);
    }
  }
  const items = shuffle(picked, rand).map((it, i) => ({ ...it, id: `q${i + 1}`, ...(it.type === 'choice' && it.options.length > 2 ? { options: shuffle(it.options, rand) } : {}) }));
  return {
    kind: 'mathwords', title: 'Math Vocabulary Practice Test', topic: 'Nov 3 words: Area, Square Unit, Multiply', items, pass: Math.ceil(items.length * 0.8), areaVocab: true,
    coverage: `${items.length} questions about the three words on the Nov 3 vocabulary test, with the teacher's exact definitions.`,
    note: 'A Study Scoop practice test for the class Topic 6 vocabulary test. It does not cover the six Area lessons.',
    instructions: 'Answer each question. There are no hints during the test. You will see your score and the answers at the end.',
  };
}

const MODEL_ANSWER = (m) => m.rows * m.cols;

/**
 * Problems with data/practice/area.json (and the Area items of a practice test); an empty list means it is safe
 * to show. Every answer is worked out again from the picture or the numbers in the question, and every vocabulary
 * question about a teacher word uses the teacher's exact definition from the week file.
 */
export function validateArea(bank, week, { where = 'practice/area.json', practice = true } = {}) {
  const errors = [];
  const err = (m) => errors.push(`${where}: ${m}`);
  if (!bank || typeof bank !== 'object') return [`${where} must be an object`];
  const defs = Object.fromEntries((week?.math?.words || []).map((w) => [normWord(w.word), w.def]));
  if (week && !isAreaWeek(week)) err('its week is not Topic 6: Area');
  const lists = practice ? ['find'] : ['items'];
  for (const k of lists) {
    const list = bank[k];
    if (!Array.isArray(list) || (practice && list.length !== 20)) { err(`${k} needs ${practice ? 'exactly 20' : 'a list of'} questions`); continue; }
    errors.push(...validateQuiz(list, 1, `${where} ${k}`));
    // Two questions are the same when both the words and the picture are the same.
    if (new Set(list.map((it) => `${normWord(it.prompt)}|${JSON.stringify(it.model || null)}`)).size !== list.length) err(`${k}: two questions are the same`);
    for (const it of list) errors.push(...areaItemProblems(it, defs, practice).map((m) => `${where} ${k} ${it.id}: ${m}`));
  }
  if (practice) errors.push(...vocabProblems(bank.vocab, defs).map((m) => `${where} vocab: ${m}`));
  return errors;
}

/**
 * Area Words: the three teacher words with the teacher's exact definitions (and only they are on the Nov 3 test),
 * the chapter review words, 20 questions in each quiz, keys worked out from the definitions.
 */
function vocabProblems(v, defs) {
  const out = [];
  if (!v || typeof v !== 'object') return ['is missing'];
  const words = v.words || [];
  const D = Object.fromEntries(words.map((w) => [w.word, w.def]));
  for (const w of AREA_WORDS) {
    const entry = words.find((x) => x.word === w);
    if (!entry?.teacher) out.push(`${w} must be listed as a teacher word`);
    else if (entry.def !== defs[normWord(w)]) out.push(`${w}: the definition must be the teacher's, word for word`);
  }
  for (const w of words) {
    if (!w.teacher && AREA_WORDS.includes(w.word)) out.push(`${w.word} is a teacher word`);
    if (w.teacher && !AREA_WORDS.includes(w.word)) out.push(`${w.word} is not on the teacher's list; mark it as a review word`);
    for (const k of ['def', 'kid', 'example']) if (typeof w[k] !== 'string' || !w[k].trim()) out.push(`${w.word}: ${k} is missing`);
    if (!w.model) out.push(`${w.word}: needs a picture`);
  }
  if (new Set(Object.values(D)).size !== words.length) out.push('two words have the same definition');
  for (const mode of ['choice', 'truefalse', 'fill']) {
    const list = v[mode];
    if (!Array.isArray(list) || list.length !== 20) { out.push(`${mode} needs exactly 20 questions`); continue; }
    out.push(...validateQuiz(list, 1, mode));
    if (new Set(list.map((it) => normWord(it.prompt))).size !== list.length) out.push(`${mode}: two questions are the same`);
    for (const w of AREA_WORDS) if (list.filter((it) => it.word === w).length < 3) out.push(`${mode}: needs at least 3 questions about ${w}`);
    for (const it of list) out.push(...wordItemProblems(it, D, true).map((m) => `${mode} ${it.id}: ${m}`));
  }
  const tf = v.truefalse || [];
  if (tf.filter((it) => it.truth).length * 2 !== tf.length) out.push('truefalse: half the statements must be true');
  const pool = v.test || [];
  if (!pool.length) out.push('test pool is missing');
  out.push(...validateQuiz(pool, 1, 'test'));
  const practicePrompts = new Set(['choice', 'truefalse', 'fill'].flatMap((m) => (v[m] || []).map((it) => normWord(it.prompt))));
  for (const it of pool) {
    if (!AREA_WORDS.includes(it.word)) out.push(`test ${it.id}: "${it.word}" is not one of the Nov 3 words`);
    if (it.hints || it.show) out.push(`test ${it.id}: a test question cannot have hints or Show me how`);
    if (practicePrompts.has(normWord(it.prompt))) out.push(`test ${it.id}: the same question is in practice`);
    out.push(...wordItemProblems(it, D, false).map((m) => `test ${it.id}: ${m}`));
    if (it.type === 'choice' && it.options.some((o) => !AREA_WORDS.includes(o.text) && !AREA_WORDS.some((w) => D[w] === o.text) && !['True', 'False'].includes(o.text)
      && !Object.keys(D).includes(o.text) && !Object.values(D).includes(o.text))) out.push(`test ${it.id}: every choice must be a word or a definition`);
  }
  for (const w of AREA_WORDS) for (const kind of ['meaning', 'name', 'tf', 'fill']) if (!pool.some((it) => it.word === w && it.kind === kind)) out.push(`test: needs a ${kind} question about ${w}`);
  return out;
}

/** A vocabulary question's key, worked out from the definitions. */
function wordItemProblems(it, D, practice) {
  const out = [];
  const correct = it.options?.find((o) => o.correct)?.text;
  if (!D[it.word]) return [`"${it.word}" is not an Area word`];
  if (practice && (!Array.isArray(it.hints) || !it.hints.length)) out.push('needs a hint');
  if (typeof it.explain !== 'string' || !it.explain.trim()) out.push('needs an explanation');
  if (it.kind === 'meaning') {
    if (correct !== D[it.word]) out.push(`the key must be the definition of ${it.word}`);
    for (const o of it.options) if (!o.correct && !Object.values(D).includes(o.text)) out.push(`"${o.text}" must be another word's definition`);
  }
  if (it.kind === 'name') {
    if (!it.prompt.includes(`"${D[it.word]}"`)) out.push(`the question must quote the definition of ${it.word}`);
    if (correct !== it.word) out.push(`the key must be ${it.word}`);
  }
  if (it.kind === 'tf') {
    const stated = Object.keys(D).find((w) => it.prompt.endsWith(`means "${D[w]}".`));
    if (!stated) out.push('the statement must quote a definition');
    else if ((stated === it.word) !== Boolean(it.truth)) out.push('"truth" does not match the statement');
  }
  if (it.kind === 'tf' || it.kind === 'tf-example') {
    if ((correct === 'True') !== Boolean(it.truth)) out.push('the answer key does not match "truth"');
  }
  if (it.type === 'word') {
    if (normWord(it.answer) !== normWord(it.word)) out.push(`the answer must be ${it.word.toLowerCase()}`);
    for (const b of it.bank || []) if (!Object.keys(D).some((w) => normWord(w) === normWord(b))) out.push(`"${b}" in the word bank is not an Area word`);
  }
  return out;
}

function areaItemProblems(it, defs, practice) {
  const out = [];
  const correct = it.options?.find((o) => o.correct)?.text;
  if (practice) {
    if (!Array.isArray(it.hints) || !it.hints.length) out.push('needs at least one hint');
    if (!Array.isArray(it.show) || !it.show.length) out.push('needs Show me how steps');
  } else if (it.hints || it.show) out.push('a test question cannot have hints or Show me how');
  if (typeof it.explain !== 'string' || !it.explain.trim()) out.push('needs an explanation for the results');
  const m = it.model;
  if (m && !(m.type === 'array' && m.style === 'tiles' && !m.cut)) out.push('an Area picture must be a rectangle of unit squares');
  if (m && (m.rows > 8 || m.cols > 9)) out.push('the picture is too big for a phone');
  // A number answer is length × width, checked against the picture and the numbers in the question.
  if (it.type === 'number') {
    const value = (() => { try { return evaluate(String(it.answer)); } catch { return NaN; } })();
    if (!/^\s*\d+\s*×\s*\d+\s*$/.test(String(it.answer))) out.push('the answer must be written as length × width');
    if (m) {
      if (it.asks !== 'dots') out.push('a picture question must ask for the squares (asks: "dots")');
      if (MODEL_ANSWER(m) !== value) out.push(`the picture has ${MODEL_ANSWER(m)} squares, but the answer is ${value}`);
      if (m.sideLabels && !(new RegExp(`\\b${m.cols}\\b`).test(it.prompt) && new RegExp(`\\b${m.rows}\\b`).test(it.prompt))) out.push('the question must give the same length and width as the picture');
    } else {
      const [, a, b] = /^\s*(\d+)\s*×\s*(\d+)\s*$/.exec(String(it.answer)) || [];
      if (!a || !new RegExp(`\\b${a}\\b`).test(it.prompt) || !new RegExp(`\\b${b}\\b`).test(it.prompt)) out.push('a story problem must give both numbers it multiplies');
    }
    if (!/square|area/i.test(it.prompt)) out.push('the question must ask for the area');
    if (!/square (units|feet|inches|meters|centimeters)/.test(String(it.yes))) out.push('the "yes" line must say the unit (square units, square feet …)');
  }
  // "Which rectangle has an area of N?" style questions: `target` is checked against every option (validateQuiz),
  // and the compare questions name the bigger area.
  if (it.compareSides) {
    const areas = it.compareSides.map(([a, b]) => a * b);
    if (areas[0] === areas[1]) out.push('the two areas must be different');
    const big = areas[0] > areas[1] ? 0 : 1;
    if (!String(correct || '').startsWith(it.compareNames[big])) out.push(`the key must be ${it.compareNames[big]}, the greater area`);
  }
  // Vocabulary: a question about a teacher word quotes the teacher's definition exactly where it uses one.
  if (it.word !== undefined) {
    if (!AREA_WORDS.includes(it.word)) out.push(`"${it.word}" is not one of the Area words`);
    const def = defs[normWord(it.word)];
    if (it.kind === 'meaning' && correct !== def) out.push(`the key must be the teacher's definition of ${it.word}`);
    if (it.kind === 'meaning') for (const o of it.options || []) if (!o.correct && !Object.values(defs).includes(o.text)) out.push(`wrong option "${o.text}" must be another Area word's definition`);
    if (it.kind === 'name') {
      if (!it.prompt.includes(`"${def}"`)) out.push(`the question must quote the teacher's definition of ${it.word}`);
      if (correct !== it.word) out.push(`the key must be ${it.word}`);
    }
    if (it.kind === 'tf') {
      if ((correct === 'True') !== Boolean(it.truth)) out.push('the answer key does not match "truth"');
      if (it.options?.length !== 2 || it.options[0].text !== 'True' || it.options[1].text !== 'False') out.push('the choices must be True, then False');
    }
    if (it.type === 'word') {
      if (normWord(it.answer) !== normWord(it.word)) out.push(`the answer must be ${it.word.toLowerCase()}`);
      if (JSON.stringify([...(it.bank || [])].map(normWord).sort()) !== JSON.stringify(AREA_WORDS.map(normWord).sort())) out.push('the word bank must be the three Area words');
    }
  }
  return out;
}
