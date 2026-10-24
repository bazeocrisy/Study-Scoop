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
/** Ids come from the question itself (not its place in the list), so a miss is never mixed up with another question. */
const numbered = (items, prefix) => items.map((it) => ({ ...it, id: it.id || `${prefix}-${keyOf(it)}` }));
const keyOf = (it) => `${it.kind ? `${it.kind}-` : ''}${it.lines ? it.lines[0] : it.prompt}`.replace(/\[[a-z]+\]/g, '').replace(/×/g, 'x').replace(/\+/g, 'p').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

// ---------------------------------------------------------------- Mental Add

/** 7 + [x] = 10: the number that goes with 7 to make 10. */
function makeTen(rand) {
  const a = int(1, 9, rand), b = 10 - a;
  return {
    type: 'fill', kind: 'make10', prompt: `What goes with ${a} to make 10?`, lines: [`${a} + [x] = 10`], answer: { x: b },
    hints: [`Count up from ${a} to 10. How many did you count?`, `Think of 10 dots: ${a} are filled in. How many are empty?`],
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
    hints: ['Adding 10 is easy: the number gets 1 more ten.', 'The ones stay the same. Only the tens change.'],
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
  // The last step should cross a ten (the part worth practising), and b must not equal the ones (the steps would go in a circle).
  if (ones + b < 10 || ones === 0 || b === ones) return null;
  const mid = tens + b, sum = a + b;
  return {
    type: 'fill', kind: 'split1', prompt: `Break ${a} into tens and ones. Add the tens first, then the ones.`,
    lines: [`${a} + ${b} = ${tens} + ${b} + [a]`, '= [b] + [c]', '= [t]'], answer: { a: ones, b: mid, c: ones, t: sum },
    hints: [`${a} is ${tens / 10} ${plural(tens / 10, 'ten', 'tens')} and some ones. How many ones?`, `Add ${tens} + ${b} first. Then add the ones.`],
    show: [`${a} = ${tens} + ${ones}.`, `${tens} + ${b} = ${mid}.`, `${mid} + ${ones} = ${sum}. So ${a} + ${b} = ${sum}.`],
    mistakes: [
      { when: { t: sum - 10 }, say: 'You lost a ten. When the ones make 10 or more, the answer gets one more ten.' },
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
    mistakes: [{ when: { t: sum - 10 }, say: `The ones make ${ones}, which is 10 or more. That ten goes with the tens.` }],
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
    const practice = { ...it, id: `${it.kind === 'make10' || it.kind === 'bridge' || it.kind === 'nextten' ? 'af' : 'as'}-${keyOf(it)}` };
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
  return numbered(shuffle(items, rand), 'aq').map(clean);
}

// ---------------------------------------------------------------- Rounding

/** One rounding question with the class method: underline, arrow, go up or stay, write the number. */
export function roundItem(n, to) {
  const p = roundParts(n, to);
  const name = PLACE[to];
  const show = [
    `Underline the ${p.d} in the ${name} place.`,
    `The arrow points to ${p.next}. ${p.up ? `${p.next} is 5 or more, so the ${p.d} goes up.` : `${p.next} is 4 or less, so the ${p.d} stays the same.`}`,
    ...(p.carry ? [`The ${p.d} goes up to 10, so write 0 in the ${name} place and ${p.place === 0 ? `write 1 in the ${NEXT[to]} place` : `add 1 to the ${NEXT[to]} digit`}.`] : []),
    `Every digit to the right of the underlined digit becomes 0.`,
    `So ${n} rounds to ${p.answer}.`,
  ];
  return {
    id: `round-${n}-${to}`, type: 'round', prompt: `Round ${n} to the nearest ${to}.`, n, to,
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
  for (let k = 0, guard = 0; k < (to === 10 ? 4 : 3) && guard < 100; guard++) if (add(pick(carries, rand)())) k++;
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
  return shuffle(roundNumbers(to, rand, 20), rand).map((n) => roundItem(n, to));
}

/** The Rounding test: 10 questions (5 to the nearest 10, 5 to the nearest 100), the answer only. */
export function roundTest(rand) {
  // Each half is built on purpose: 1 "9 goes up", 1 with a 5 exactly, 1 other "go up" and 2 "stay the same".
  const half = (to) => {
    const pool = roundNumbers(to, rand, 20);
    const kind = (n) => { const p = roundParts(n, to); return p.carry ? 'carry' : p.next === 5 ? 'five' : p.up ? 'up' : 'stay'; };
    const take = (k, count) => shuffle(pool.filter((n) => kind(n) === k), rand).slice(0, count);
    const chosen = [...take('carry', 1), ...take('five', 1), ...take('up', 1), ...take('stay', 2)];
    for (const n of shuffle(pool, rand)) if (chosen.length < 5 && !chosen.includes(n) && kind(n) !== 'carry') chosen.push(n);
    return chosen.map((n) => [n, to]);
  };
  const items = [...half(10), ...half(100)].map(([n, to]) => {
    const it = roundItem(n, to);
    return { ...it, id: `rq-${n}-${to}`, type: 'number', answer: String(roundParts(n, to).answer), practice: it };
  });
  return shuffle(items, rand).map(clean);
}

// ---------------------------------------------------------------- Times Tables

/** How to find a × b with a fact you know. Handles 0–12. */
function timesHelp(a, b) {
  const P = a * b;
  // Special rules for 0 and 1 (identity/zero property).
  if (a === 0 || b === 0) {
    return {
      hints: ['Any number times 0 is always 0.', 'Zero groups of anything is nothing.'],
      show: [`${a} × ${b} = 0.`],
    };
  }
  if (a === 1 || b === 1) {
    const other = a === 1 ? b : a;
    return {
      hints: ['Any number times 1 stays the same.', 'One group of anything is just that amount.'],
      show: [`1 × ${other} = ${other}.`],
    };
  }
  if (a === 11 || b === 11) {
    const other = a === 11 ? b : a;
    return {
      hints: [
        other <= 9 ? `× 11: write the digit ${other} twice.` : `Break 11 into 10 + 1: find 10 × ${other}, then add ${other}.`,
        other <= 9 ? `${other} appears in both the tens and ones place.` : 'Find each part, then add.',
      ],
      show: other <= 9
        ? [`${other} in the tens, ${other} in the ones: ${P}.`]
        : [`10 × ${other} = ${10 * other}.`, `${10 * other} + ${other} = ${P}.`],
    };
  }
  if (a === 12 || b === 12) {
    const other = a === 12 ? b : a;
    return {
      hints: [`Break 12 into 10 + 2: find 10 × ${other} and 2 × ${other}.`, 'Find each part, then add.'],
      show: [`10 × ${other} = ${10 * other}.`, `2 × ${other} = ${2 * other}.`, `${10 * other} + ${2 * other} = ${P}.`],
    };
  }
  // The factor whose rule we use: a 10, 2 or 5 first (they are easiest), otherwise the one that needs breaking apart.
  const easy = [10, 2, 5].find((x) => a === x || b === x);
  const [f, g] = easy ? [easy, a === easy ? b : a] : [a, b].sort((x, y) => rank(y) - rank(x));
  const parts = {
    2: { hint: `× 2 is a double: ${g} + ${g}.`, show: [`${g} + ${g} = ${P}.`] },
    3: { hint: `Break 3 into 2 + 1: double ${g}, then add one more ${g}.`, show: [`2 × ${g} = ${2 * g}.`, `${2 * g} + ${g} = ${P}.`] },
    4: { hint: `Break 4 into 2 + 2: double ${g}, then double again.`, show: [`2 × ${g} = ${2 * g}.`, `${2 * g} + ${2 * g} = ${P}.`] },
    5: { hint: `Count by 5s, ${g} times.`, show: [`Count by 5s: ${Array.from({ length: g }, (_, k) => 5 * (k + 1)).join(', ')}.`] },
    6: { hint: `Break 6 into 5 + 1: find 5 × ${g}, then add one more ${g}.`, show: [`5 × ${g} = ${5 * g}.`, `${5 * g} + ${g} = ${P}.`] },
    7: { hint: `Break 7 into 5 + 2: find 5 × ${g} and 2 × ${g}.`, show: [`5 × ${g} = ${5 * g}.`, `2 × ${g} = ${2 * g}.`, `${5 * g} + ${2 * g} = ${P}.`] },
    8: { hint: `Break 8 into 4 + 4: find 4 × ${g}, then double it.`, show: [`4 × ${g} = ${4 * g}.`, `${4 * g} + ${4 * g} = ${P}.`] },
    9: { hint: `Break 9 into 5 + 4: find 5 × ${g} and 4 × ${g}.`, show: [`5 × ${g} = ${5 * g}.`, `4 × ${g} = ${4 * g}.`, `${5 * g} + ${4 * g} = ${P}.`] },
    10: { hint: `× 10 means ${g} tens.`, show: [`${g} tens is ${P}.`] },
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
    id: `times-${a}x${b}`, type: 'number', kind: 'times', prompt: `${a} × ${b} = ?`, answer: `${a} × ${b}`,
    hints: h.hints, show: h.show, yes: `Yes! ${a} × ${b} = ${a * b}.`, explain: h.show.join(' '),
  };
}

/** All Facts: 20 different facts from the 2s to the 10s (no two the same, turned around or not). */
export function timesFacts(rand) {
  return distinctFacts(20, () => [int(2, 10, rand), int(2, 10, rand)], rand);
}
/** Tricky Facts: 20 facts with a 6, 7, 8 or 9 (the ones most children still count). */
export function timesTricky(rand) {
  return distinctFacts(20, () => [pick([6, 7, 8, 9], rand), int(3, 9, rand)], rand);
}
/** The Times Tables test: 12 facts, more of them tricky. */
export function timesTest(rand) {
  const items = distinctFacts(12, () => (rand() < 0.7 ? [pick([6, 7, 8, 9], rand), int(3, 9, rand)] : [int(2, 10, rand), int(2, 10, rand)]), rand);
  return items.map((it) => ({ ...it, id: `tq-${it.id}`, practice: it })).map(clean);
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

// ---------------------------------------------------------------- Times Tables App (family-based, 0–12)

/** All fact pairs for a set of fact families (selected tables 0–12). Each pair appears once, in random order. */
function familyPairs(families, rand) {
  const pairs = [];
  const seen = new Set();
  for (const f of families) {
    for (let b = 0; b <= 12; b++) {
      const key = [Math.min(f, b), Math.max(f, b)].join('x');
      if (!seen.has(key)) { seen.add(key); pairs.push([f, b]); }
    }
  }
  // Shuffle: Fisher-Yates
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

/** Flashcard object for a single fact (used by the Times App flash mode). */
export function timesFlashCard(a, b) {
  const h = timesHelp(a, b);
  return { a, b, product: a * b, show: h.show, hints: h.hints };
}

/** All flash cards for the selected families (0–12), shuffled. */
export function timesFamilyFlash(families, rand) {
  return familyPairs(families, rand).map(([a, b]) => timesFlashCard(a, b));
}

/** Practice items (type: 'number') for the selected families (0–12), shuffled. */
export function timesFamilyPractice(families, rand) {
  return familyPairs(families, rand).map(([a, b]) => timesItem(a, b));
}

/**
 * Find-It items: child sees the product, types the two factors.
 * type: 'blanks', two boxes [a] and [b], either order accepted.
 * If the child types a correct fact from the wrong family, a nudge message fires.
 */
export function timesFamilyFind(families, rand) {
  return familyPairs(families, rand).map(([a, b]) => {
    const P = a * b;
    // Build all OTHER valid factor pairs for this product (from outside the selected families)
    const wrongFamilyNudges = [];
    for (let x = 0; x <= 12; x++) {
      for (let y = x; y <= 12; y++) {
        if (x * y === P && !families.includes(x) && !families.includes(y)) {
          wrongFamilyNudges.push({ when: { a: x, b: y }, say: `${x} × ${y} = ${P} too! But practice your selected facts.` });
          if (x !== y) wrongFamilyNudges.push({ when: { a: y, b: x }, say: `${y} × ${x} = ${P} too! But practice your selected facts.` });
        }
      }
    }
    const accept = a !== b ? [{ a: b, b: a }] : [];
    return {
      id: `timesfind-${a}x${b}`,
      type: 'blanks',
      kind: 'timesfind',
      prompt: `The answer is ${P}. What two numbers were multiplied?`,
      lines: [`[a] × [b] = ${P}`],
      answer: { a, b },
      accept,
      hints: [`Think about the ${families.length === 1 ? `${families[0]}s` : 'facts you picked'}.`, `What times what equals ${P}?`],
      show: [`${a} × ${b} = ${P}.`],
      yes: `Yes! ${a} × ${b} = ${P}.`,
      explain: `${a} × ${b} = ${P}.`,
      mistakes: wrongFamilyNudges,
    };
  });
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
  // Note: timesFamilyFlash / timesFamilyPractice / timesFamilyFind are used directly by mountTimesApp in
  // activity-player.js and are NOT registered here — their item count varies by family selection.
};
