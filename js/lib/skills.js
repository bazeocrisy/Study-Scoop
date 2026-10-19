// Skill Builders (DECISIONS D22): short skills a child can practise any week. Pure, no DOM.
// Every question is made here from its numbers, so every answer, hint and worked step is computed, never typed.
// The lesson engine (lessons.js) checks the answers and gives the step-by-step Help; validateQuiz checks every set.

import { shuffle } from './activities.js';
import { NEXT_PLACE as NEXT, PLACE, roundParts } from './rounding.js';

export { roundParts };

const pick = (list, rand) => list[Math.floor(rand() * list.length)];
const int = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));
const plural = (n, one, many) => (n === 1 ? one : many);

/** Up to `n` different questions from a maker (a maker returns null for a combination it cannot use). */
function distinct(n, make, rand, tries = 400, seen = new Set()) {
  const out = [];
  for (let k = 0; out.length < n && k < tries; k++) {
    const it = make(rand);
    if (!it) continue;
    const key = `${it.prompt}|${(it.lines || []).join(' ')}`; // the instruction can repeat; the numbers cannot
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}
const numbered = (items, prefix) => items.map((it, i) => ({ ...it, id: `${prefix}${i + 1}` }));

// ---------------------------------------------------------------- Mental Add

/** 7 + [x] = 10: the number that goes with 7 to make 10. */
function makeTen(rand) {
  const a = int(1, 9, rand), b = 10 - a;
  return {
    type: 'fill', kind: 'make10', prompt: `What goes with ${a} to make 10?`, lines: [`${a} + [x] = 10`], answer: { x: b },
    hints: [`Count up from ${a} to 10. How many did you count?`, 'The pairs that make 10: 1 and 9, 2 and 8, 3 and 7, 4 and 6, 5 and 5.'],
    show: [`${a} + ${b} = 10.`],
    mistakes: a !== 10 - a ? [{ when: { x: a }, say: `${a} + ${a} is a double. Which number goes with ${a} to make 10?` }] : [],
    yes: `Yes! ${a} and ${b} make 10.`, explain: `${a} + ${b} = 10.`,
  };
}

/** 10 + 6: the ten stays, the number goes in the ones. */
function tenPlus(rand) {
  const b = int(1, 9, rand);
  const flip = rand() < 0.4;
  const expr = flip ? `${b} + 10` : `10 + ${b}`;
  return {
    type: 'number', kind: 'tenplus', prompt: `${expr} = ?`, answer: expr,
    hints: ['Adding 10 is easy: the number gets 1 ten.', `1 ten and ${b} ${plural(b, 'one', 'ones')}. What number is that?`],
    show: [`10 + ${b} = ${10 + b}.`],
    yes: `Yes! ${10 + b}.`, explain: `1 ten and ${b} ${plural(b, 'one', 'ones')} is ${10 + b}.`,
  };
}

/** 8 + 5 or 28 + 5: get to the next ten, then add the rest. */
function nextTen(rand, big) {
  const a = big ? int(1, 8, rand) * 10 + int(5, 9, rand) : int(5, 9, rand);
  const b = int(2, 9, rand);
  const need = 10 - (a % 10);
  if (b <= need) return null; // must cross the ten
  const ten = a + need, rest = b - need, sum = a + b;
  return {
    type: 'number', kind: big ? 'nextten' : 'bridge', prompt: `${a} + ${b} = ?`, answer: `${a} + ${b}`,
    hints: [`${a} needs ${need} to make ${ten}.`, `Break ${b} into ${need} + ${rest}. Add the ${need} first.`],
    show: [`${a} + ${need} = ${ten}.`, `${ten} + ${rest} = ${sum}. So ${a} + ${b} = ${sum}.`],
    yes: `Yes! ${a} + ${b} = ${sum}.`, explain: `${a} + ${need} = ${ten}, then ${ten} + ${rest} = ${sum}.`,
  };
}

/** Quick Facts: make 10, ten plus a number, and getting to the next ten (20 questions). */
export function addFacts(rand) {
  const items = [
    ...distinct(5, makeTen, rand),
    ...distinct(4, tenPlus, rand),
    ...distinct(6, (r) => nextTen(r, false), rand),
    ...distinct(5, (r) => nextTen(r, true), rand),
  ];
  return numbered(shuffle(items, rand), 'af');
}

/** 12 + 9 or 28 + 5: break the first number into tens and ones, add the tens first, then the ones. */
function splitOne(rand, teen) {
  const a = teen ? int(11, 19, rand) : int(2, 8, rand) * 10 + int(1, 9, rand);
  const b = int(3, 9, rand);
  const tens = a - (a % 10), ones = a % 10;
  if (ones + b < 10 || ones === 0) return null; // the last step should cross a ten (the part worth practising)
  const mid = tens + b, sum = a + b;
  return {
    type: 'fill', kind: 'split1', prompt: `Break ${a} into tens and ones. Add the tens first, then the ones.`,
    lines: [`${a} + ${b} = ${tens} + ${b} + [a]`, '= [b] + [c]', '= [t]'], answer: { a: ones, b: mid, c: ones, t: sum },
    hints: [`${a} is ${tens / 10} ${plural(tens / 10, 'ten', 'tens')} and some ones. How many ones?`, `Add ${tens} + ${b} first. Then add the ones.`],
    show: [`${a} = ${tens} + ${ones}.`, `${tens} + ${b} = ${mid}.`, `${mid} + ${ones} = ${sum}. So ${a} + ${b} = ${sum}.`],
    mistakes: [
      { when: { t: sum - 10 }, say: 'You lost a ten. When the ones make more than 10, the answer gets one more ten.' },
      ...(mid + ones - 1 !== sum - 10 ? [{ when: { t: sum - 1 }, say: 'Close! Check the last step again.' }] : []),
    ],
    yes: `Yes! ${a} + ${b} = ${sum}.`, explain: `${tens} + ${b} = ${mid}, then ${mid} + ${ones} = ${sum}.`,
  };
}

/** 38 + 27: add the tens, add the ones, then put them together. */
function splitTwo(rand) {
  const a = int(1, 7, rand) * 10 + int(1, 9, rand), b = int(1, 8, rand) * 10 + int(1, 9, rand);
  const at = a - (a % 10), bt = b - (b % 10), ao = a % 10, bo = b % 10;
  if (a + b > 99 || ao + bo < 10 || a === b) return null; // practise the case where the ones make another ten
  const tens = at + bt, ones = ao + bo, sum = a + b;
  return {
    type: 'fill', kind: 'split2', prompt: 'Break both numbers into tens and ones. Add the tens, then the ones.',
    lines: [`${a} + ${b} = ${at} + ${bt} + [a] + [b]`, '= [c] + [d]', '= [t]'],
    answer: { a: ao, b: bo, c: tens, d: ones, t: sum }, accept: ao !== bo ? [{ a: bo, b: ao, c: tens, d: ones, t: sum }] : undefined,
    hints: ['Break each number into tens and ones.', `Add the tens: ${at} + ${bt}. Add the ones. Then put them together.`],
    show: [`${a} = ${at} + ${ao} and ${b} = ${bt} + ${bo}.`, `${at} + ${bt} = ${tens}.`, `${ao} + ${bo} = ${ones}.`, `${tens} + ${ones} = ${sum}. So ${a} + ${b} = ${sum}.`],
    mistakes: [{ when: { t: sum - 10 }, say: `The ones make ${ones}, which is more than 10. That extra ten goes with the tens.` }],
    yes: `Yes! ${a} + ${b} = ${sum}.`, explain: `${at} + ${bt} = ${tens}, ${ao} + ${bo} = ${ones}, and ${tens} + ${ones} = ${sum}.`,
  };
}

/** Break It Apart: teen numbers, then two-digit numbers, then two two-digit numbers (20 questions, easy to hard). */
export function addSplit(rand) {
  return numbered([
    ...distinct(6, (r) => splitOne(r, true), rand),
    ...distinct(7, (r) => splitOne(r, false), rand),
    ...distinct(7, splitTwo, rand),
  ], 'as');
}

/** The Mental Add test: 10 questions, answered in one box each (no Help during the test). */
export function addTest(rand) {
  // Each test question keeps its practice form, which goes to Practice My Misses when it is missed.
  const asNumber = (it, k) => {
    const sum = it.lines ? it.lines[0].split('=')[0].trim() : null;
    const practice = { ...it, id: `atp${k}` };
    return it.kind === 'make10'
      ? { ...it, type: 'number', answer: String(it.answer.x), lines: undefined, mistakes: undefined, practice }
      : { ...it, type: 'number', prompt: sum ? `${sum} = ?` : it.prompt, answer: sum || it.answer, lines: undefined, mistakes: undefined, accept: undefined, practice };
  };
  // One list of sums already used, so two kinds of question never ask the same sum (28 + 5 twice).
  const used = new Set();
  const take = (n, make) => distinct(n, (r) => {
    const it = make(r);
    if (!it) return null;
    const sum = it.lines ? it.lines[0].split('=')[0].trim() : it.prompt.replace(/ = \?$/, '');
    if (used.has(sum)) return null;
    used.add(sum);
    return it;
  }, rand);
  const items = [
    ...take(2, makeTen),
    ...take(3, (r) => nextTen(r, false)),
    ...take(2, (r) => nextTen(r, true)),
    ...take(2, (r) => splitOne(r, false)),
    ...take(1, splitTwo),
  ].map(asNumber);
  return numbered(shuffle(items, rand), 'at').map(clean);
}

// ---------------------------------------------------------------- Rounding

/** One rounding question with the class method: underline, arrow, go up or stay, write the number. */
export function roundItem(n, to) {
  const p = roundParts(n, to);
  const name = PLACE[to];
  const show = [
    `Underline the ${p.d} in the ${name} place.`,
    `The arrow points to ${p.next}. ${p.up ? `${p.next} is 5 or more, so the ${p.d} goes up.` : `${p.next} is 4 or less, so the ${p.d} stays the same.`}`,
    ...(p.carry ? [`The ${p.d} goes up to 10, so write 0 in the ${name} place and add 1 to the ${NEXT[to]} place.`] : []),
    `Every digit to the right of the underlined digit becomes 0.`,
    `So ${n} rounds to ${p.answer}.`,
  ];
  return {
    type: 'round', prompt: `Round ${n} to the nearest ${to}.`, n, to,
    hints: [`Find the ${name} place. Tap that digit to underline it.`, 'Look at the digit the arrow points to. 5 or more, go up. 4 or less, stay the same.'],
    show, explain: show.join(' '), yes: `Yes! ${n} rounds to ${p.answer}.`, carry: p.carry,
  };
}

/** The numbers to round: a fair mix of going up and staying, a 5 on purpose, and the "9 goes up" cases. */
function roundNumbers(to, rand, count) {
  const out = new Set();
  const add = (n) => { if (n >= 10 && n <= 999 && !out.has(n)) { out.add(n); return true; } return false; };
  const carries = to === 10 ? [() => int(1, 9, rand) * 100 + 90 + int(5, 9, rand), () => 90 + int(5, 9, rand)]
    : [() => 900 + int(50, 99, rand)];
  // 4 that make a 9 go up (897 -> 900, 96 -> 100, 951 -> 1,000), then a 5 exactly, then a mix.
  for (let k = 0, guard = 0; k < 4 && guard < 100; guard++) if (add(pick(carries, rand)())) k++;
  for (let k = 0, guard = 0; k < 2 && guard < 100; guard++) if (add(to === 10 ? int(1, 99, rand) * 10 + 5 : int(1, 9, rand) * 100 + 50 + int(0, 9, rand))) k++;
  for (let guard = 0; out.size < count && guard < 1000; guard++) {
    const n = to === 10 ? (rand() < 0.35 ? int(11, 99, rand) : int(101, 989, rand)) : int(101, 949, rand);
    if (n % to === 0 || roundParts(n, to).carry) continue; // already round, or another carry case
    const p = roundParts(n, to);
    const ups = [...out].filter((x) => roundParts(x, to).up).length;
    if (p.up && ups > count / 2 + 1) continue; // keep "stay the same" answers common too
    add(n);
  }
  return [...out];
}

/** Round to the Nearest 10 / 100: 20 questions with the underline-and-arrow method. */
export function roundSet(to, rand) {
  return numbered(shuffle(roundNumbers(to, rand, 20), rand).map((n) => roundItem(n, to)), to === 10 ? 'rt' : 'rh');
}

/** The Rounding test: 10 questions (5 to the nearest 10, 5 to the nearest 100), the answer only. */
export function roundTest(rand) {
  const tens = shuffle(roundNumbers(10, rand, 8), rand).slice(0, 5);
  const hundreds = shuffle(roundNumbers(100, rand, 8), rand).slice(0, 5);
  const items = [...tens.map((n) => [n, 10]), ...hundreds.map((n) => [n, 100])].map(([n, to]) => {
    const it = roundItem(n, to);
    return { ...it, type: 'number', answer: String(roundParts(n, to).answer), practice: { ...it, id: `rp-${n}-${to}` } };
  });
  return numbered(shuffle(items, rand), 'ru').map(clean);
}

// ---------------------------------------------------------------- Times Tables

/** How to find a × b with a fact you know (the Unit 5 strategies). Breaks the harder factor. */
function timesHelp(a, b) {
  const [f, g] = [a, b].sort((x, y) => rank(y) - rank(x)); // f: the factor we break apart; g: the other factor
  const P = a * b;
  const parts = {
    2: { hint: `× 2 is a double: ${g} + ${g}.`, show: [`${g} + ${g} = ${P}.`] },
    3: { hint: `Break 3 into 2 + 1: double ${g}, then add one more ${g}.`, show: [`2 × ${g} = ${2 * g}.`, `${2 * g} + ${g} = ${P}.`] },
    4: { hint: `Break 4 into 2 + 2: double ${g}, then double again.`, show: [`2 × ${g} = ${2 * g}.`, `${2 * g} + ${2 * g} = ${P}.`] },
    5: { hint: `Count by 5s, ${g} times.`, show: [`Count by 5s: ${Array.from({ length: g }, (_, k) => 5 * (k + 1)).join(', ')}.`] },
    6: { hint: `Break 6 into 5 + 1: find 5 × ${g}, then add one more ${g}.`, show: [`5 × ${g} = ${5 * g}.`, `${5 * g} + ${g} = ${P}.`] },
    7: { hint: `Break 7 into 5 + 2: find 5 × ${g} and 2 × ${g}.`, show: [`5 × ${g} = ${5 * g}.`, `2 × ${g} = ${2 * g}.`, `${5 * g} + ${2 * g} = ${P}.`] },
    8: { hint: `Break 8 into 4 + 4: find 4 × ${g}, then double it.`, show: [`4 × ${g} = ${4 * g}.`, `${4 * g} + ${4 * g} = ${P}.`] },
    9: { hint: `Break 9 into 5 + 4: find 5 × ${g} and 4 × ${g}.`, show: [`5 × ${g} = ${5 * g}.`, `4 × ${g} = ${4 * g}.`, `${5 * g} + ${4 * g} = ${P}.`] },
    10: { hint: `× 10: write ${g} with a 0 after it.`, show: [`${g} tens is ${P}.`] },
  }[f];
  return {
    hints: [parts.hint, f === 5 ? (g === 2 ? "Or: add 5 two times." : `Or: find 10 × ${g}, then take half.`) : f === 10 ? 'A number times 10 has the same digits with a 0 at the end.' : f === 2 ? 'Add the number to itself.' : 'Find each part. Then add.'],
    show: [...parts.show, `So ${a} × ${b} = ${P}.`],
  };
}
/** How much a factor needs breaking apart (higher is harder). */
const rank = (n) => ({ 7: 9, 8: 8, 9: 7, 6: 6, 4: 5, 3: 4, 2: 2, 5: 3, 10: 1 }[n] ?? 0);

export function timesItem(a, b) {
  const h = timesHelp(a, b);
  return {
    type: 'number', kind: 'times', prompt: `${a} × ${b} = ?`, answer: `${a} × ${b}`,
    hints: h.hints, show: h.show, yes: `Yes! ${a} × ${b} = ${a * b}.`, explain: h.show.join(' '),
  };
}

/** All Facts: 20 different facts from the 2s to the 10s (no two the same, turned around or not). */
export function timesFacts(rand) {
  return numbered(distinctFacts(20, () => [int(2, 10, rand), int(2, 10, rand)], rand), 'tf');
}
/** Tricky Facts: 20 facts with a 6, 7, 8 or 9 (the ones most children still count). */
export function timesTricky(rand) {
  return numbered(distinctFacts(20, () => [pick([6, 7, 8, 9], rand), int(3, 9, rand)], rand), 'tt');
}
/** The Times Tables test: 12 facts, more of them tricky. */
export function timesTest(rand) {
  const items = distinctFacts(12, () => (rand() < 0.7 ? [pick([6, 7, 8, 9], rand), int(3, 9, rand)] : [int(2, 10, rand), int(2, 10, rand)]), rand);
  return numbered(items, 'tq').map(clean);
}
function distinctFacts(n, make, rand) {
  const out = [], seen = new Set();
  for (let k = 0; out.length < n && k < 2000; k++) {
    let [a, b] = make();
    if (rand() < 0.5) [a, b] = [b, a];
    const key = [a, b].sort((x, y) => x - y).join('x');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(timesItem(a, b));
  }
  return out;
}

/** A test question: the Help steps stay with it (Practice My Misses uses them) but the test page never shows them. */
function clean(it) {
  const out = { ...it };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

// ---------------------------------------------------------------- the sets

/** Every Skill Builders question set, by activity id: { make(rand), pass } (pass only for tests). */
export const SKILL_SETS = {
  addfacts: { make: addFacts },
  addsplit: { make: addSplit },
  addtest: { make: addTest, pass: 8, title: 'Mental Add Test', coverage: 'Make 10, getting to the next ten, and breaking numbers apart.' },
  roundten: { make: (r) => roundSet(10, r) },
  roundhun: { make: (r) => roundSet(100, r) },
  roundtest: { make: roundTest, pass: 8, title: 'Rounding Test', coverage: 'Rounding to the nearest 10 and the nearest 100.' },
  timesall: { make: timesFacts },
  timestricky: { make: timesTricky },
  timestest: { make: timesTest, pass: 10, title: 'Times Tables Test', coverage: 'Multiplication facts from the 2s to the 10s, more of them with a 6, 7, 8 or 9.' },
};
