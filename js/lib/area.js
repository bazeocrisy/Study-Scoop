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

/** Practice activities: Find the Area (problems) and Area Words (vocabulary). Their misses share one list. */
export const AREA_SETS = { areafind: 'find', areawords: 'words' };

/** The questions for one Area practice activity, shuffled (True/False options stay in order). */
export function areaItems(bank, act, rand = Math.random) {
  const list = bank?.[AREA_SETS[act]] || [];
  return shuffle(list, rand).map((it) => (it.type === 'choice' && it.options.length > 2 && !it.keepOrder ? { ...it, options: shuffle(it.options, rand) } : it));
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
  const lists = practice ? ['find', 'words'] : ['items'];
  for (const k of lists) {
    const list = bank[k];
    if (!Array.isArray(list) || (practice && list.length !== 20)) { err(`${k} needs ${practice ? 'exactly 20' : 'a list of'} questions`); continue; }
    errors.push(...validateQuiz(list, 1, `${where} ${k}`));
    // Two questions are the same when both the words and the picture are the same.
    if (new Set(list.map((it) => `${normWord(it.prompt)}|${JSON.stringify(it.model || null)}`)).size !== list.length) err(`${k}: two questions are the same`);
    for (const it of list) errors.push(...areaItemProblems(it, defs, practice).map((m) => `${where} ${k} ${it.id}: ${m}`));
  }
  if (practice) {
    const words = bank.words || [];
    for (const w of AREA_WORDS) if (words.filter((it) => it.word === w).length < 4) err(`words: needs at least 4 questions about ${w}`);
    const tf = words.filter((it) => it.kind === 'tf');
    const trues = tf.filter((it) => it.truth).length;
    if (tf.length && Math.abs(trues * 2 - tf.length) > 1) err(`words: about half the true-or-false statements must be true (${trues} of ${tf.length})`);
  }
  return errors;
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
  if (it.compare) {
    const areas = it.compare.map(([a, b]) => a * b);
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
