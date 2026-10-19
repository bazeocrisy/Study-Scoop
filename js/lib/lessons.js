// The shared lesson engine (pure, no DOM): answer checking, feedback, scoring and validation for every lesson.
// Lessons are data (data/lessons/<id>.json). One engine serves every lesson; nothing here knows a lesson by name.

import { chainHolds, evaluate, wrongFactsInText } from './arith.js';
import { counts } from './models.js';
import { FROM_RIGHT, NEXT_PLACE, PLACE, roundParts } from './rounding.js';

export const STAGES = [
  { id: 'learn', label: 'Learn It' },
  { id: 'watch', label: 'Watch Me' },
  { id: 'together', label: 'Practice Together' },
  { id: 'try', label: 'Try It Yourself' },
  { id: 'test', label: 'Test Your Knowledge' },
];
export const STAGE_IDS = [...STAGES.map((s) => s.id), 'parent'];
export const stageLabel = (id) => (STAGES.find((s) => s.id === id) || { label: 'Parent Guide' }).label;

const BOX = /\[([a-z][a-z0-9]*)\]/g;

/** Names of the answer boxes in an item, in reading order. */
export function boxes(item) {
  if (item.type === 'number') return ['answer'];
  if (item.type === 'round') return ['place', 'dir', 'answer'];
  if (item.type === 'word' || item.type === 'spell') return ['text'];
  if (item.type === 'letters') return (item.blanks || []).map((_, k) => `l${k}`);
  if (item.type === 'decompose') return ['p', 'q', 'r', 's', 't'];
  if (item.type === 'fill') return [...item.lines.join(' ').matchAll(BOX)].map((m) => m[1]);
  if (item.type === 'table') return item.rows.flatMap((row, i) => row.map((c, j) => (typeof c === 'object' ? `r${i}c${j}` : null))).filter(Boolean);
  return [];
}

/** The correct value of every box (used by Show me how, the test review and the validator). */
export function solution(item) {
  if (item.type === 'number') return { answer: evaluate(String(item.answer)) };
  if (item.type === 'round') { const p = roundParts(item.n, item.to); return { place: p.place, dir: p.up ? 'up' : 'stay', answer: p.answer }; }
  if (item.type === 'fill' || item.type === 'decompose') return { ...item.answer };
  if (item.type === 'table') {
    const out = {};
    item.rows.forEach((row, i) => row.forEach((c, j) => { if (typeof c === 'object') out[`r${i}c${j}`] = evaluate(String(c.answer)); }));
    return out;
  }
  if (item.type === 'choice') return { choice: item.options.findIndex((o) => o.correct) };
  if (item.type === 'word' || item.type === 'spell') return { text: item.answer };
  if (item.type === 'letters') return Object.fromEntries(item.blanks.map((b, k) => [`l${k}`, item.word[b]]));
  return {};
}

/** Typed words are compared without capitals, extra spaces or a full stop at the end ("  Heating. " is "heating"). */
export const normWord = (t) => String(t ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/^["']+|[.,!?;:"']+$/g, '');

const fill = (text, values) => String(text).replace(BOX, (_, k) => (values[k] === undefined ? '□' : String(values[k])));

/** Human-readable correct answer (results review). */
export function answerText(item) {
  const s = solution(item);
  if (item.type === 'choice') return item.options[s.choice].text;
  if (item.type === 'word' || item.type === 'spell') return item.answer;
  if (item.type === 'letters') return item.word;
  if (item.type === 'number' || item.type === 'round') return String(s.answer);
  if (item.type === 'fill') return item.lines.map((l) => fill(l, s)).join(' ');
  if (item.type === 'decompose') return `${item.fact[0]} × ${item.fact[1]} = ${s.p} × ${s.q} + ${s.r} × ${s.s} = ${s.t}`;
  if (item.type === 'table') return item.rows.map((row, i) => row.map((c, j) => (typeof c === 'object' ? s[`r${i}c${j}`] : c)).join(' · ')).join('; ');
  return '';
}

/** Reads typed text as a whole number: " 18 " and "018" are 18; anything else is not a number. */
export function readNumber(text) {
  // "1,000" is read as 1000 (children often write the comma).
  const t = String(text ?? '').trim().replace(/^(\d{1,3}),(\d{3})$/, '$1$2');
  if (t === '') return { empty: true };
  if (!/^\d{1,4}$/.test(t)) return { bad: true };
  return { value: Number(t) };
}

function readAll(item, response) {
  const values = {};
  for (const b of boxes(item)) {
    const r = readNumber(response?.[b]);
    if (r.empty) return { empty: true };
    if (r.bad) return { bad: true };
    values[b] = r.value;
  }
  return { values };
}

/** Open decomposition rule (DECISIONS D17): two facts that share one factor K of a × b, whose other numbers
 *  are at least 1 and add up to the other factor. Facts may be turned around and the parts may come in any order. */
export function decompositionOf(a, b, p, q, r, s) {
  for (const [K, other] of [[b, a], [a, b]]) {
    const f1 = p === K ? q : q === K ? p : null;
    const f2 = r === K ? s : s === K ? r : null;
    if (f1 !== null && f2 !== null && f1 >= 1 && f2 >= 1 && f1 + f2 === other) {
      // Equation order: row cut writes c × b; column cut writes a × c.
      const rowCut = K === b;
      // When a = b (a square fact) either way of writing is in equation order.
      const inOrder = a === b ? (q === K && s === K) || (p === K && r === K)
        : rowCut ? (q === K && s === K) : (p === K && r === K);
      return { K, parts: [f1, f2], rowCut, inOrder };
    }
  }
  return null;
}

/**
 * Checks a response. Returns { status, say, fixed } where status is
 * 'correct' | 'notyet' | 'empty' (empty or unreadable answers are never counted as a try).
 */
export function check(item, response, lesson = {}) {
  const catchAll = lesson.catchAll || 'Look at the picture and try again.';
  if (item.type === 'choice') {
    const i = response?.choice;
    if (i === undefined || i === null || i === '') return { status: 'empty', say: 'Choose an answer first.' };
    const o = item.options[Number(i)];
    if (!o) return { status: 'empty', say: 'Choose an answer first.' };
    return o.correct ? { status: 'correct', say: item.yes || 'Yes!' } : { status: 'notyet', say: o.why || catchAll };
  }
  if (item.type === 'word' || item.type === 'spell') {
    const typed = normWord(response?.text);
    if (!typed) return { status: 'empty', say: 'Type the word first.', wrong: ['text'] };
    if ([item.answer, ...(item.accept || [])].some((a) => normWord(a) === typed)) return { status: 'correct', say: item.yes || 'Yes!' };
    return { status: 'notyet', say: join(explainWord(item, typed), item.retry || catchAll), wrong: ['text'] };
  }
  if (item.type === 'letters') {
    const names = boxes(item);
    const sol = solution(item);
    const got = names.map((n) => normWord(response?.[n]));
    const blank = names.filter((n, k) => !got[k]);
    if (blank.length) return { status: 'empty', say: names.length > 1 ? 'Type a letter in every box first.' : 'Type a letter first.', wrong: blank };
    const wrong = names.filter((n, k) => got[k] !== sol[n]);
    if (!wrong.length) return { status: 'correct', say: item.yes || 'Yes!' };
    const lead = wrong.length === names.length && names.length > 1 ? 'Those letters are not right yet.' : wrong.length > 1 ? `${wrong.length} of the letters are not right yet. They are marked.` : names.length > 1 ? 'One letter is not right yet. It is marked.' : 'That letter is not right yet.';
    return { status: 'notyet', say: join(lead, item.retry || catchAll), wrong };
  }
  if (item.type === 'round') return checkRound(item, response);
  const read = readAll(item, response);
  // Empty or unreadable boxes are marked so the child can find them (never counted as a try).
  const unread = boxes(item).filter((b) => readNumber(response?.[b]).value === undefined);
  if (read.empty) return { status: 'empty', say: boxes(item).length > 1 ? 'Type a number in every box first.' : 'Type a number first.', wrong: unread };
  if (read.bad) return { status: 'empty', say: 'Use only the digits 0 to 9.', wrong: unread };
  const v = read.values;
  const mistake = (item.mistakes || []).find((m) => Object.entries(m.when).every(([k, val]) => v[k] === val));

  if (item.type === 'number') {
    if (v.answer === solution(item).answer) return { status: 'correct', say: item.yes || 'Yes!' };
    const why = explainNumber(item, v.answer);
    // The lesson's general hint follows only a general reason (too big or too small); a specific reason stands alone.
    // After a general reason (too big or too small) comes the question's own first hint, or the lesson's general hint.
    return { status: 'notyet', say: mistake?.say || (/ is too (?:big|small)\.$/.test(why) ? join(why, item.hints?.[0] || catchAll) : why) };
  }
  if (item.type === 'table') {
    const s = solution(item);
    const wrong = Object.keys(s).filter((k) => v[k] !== s[k]);
    if (!wrong.length) return { status: 'correct', say: item.yes || 'Yes!' };
    return { status: 'notyet', say: mistake?.say || join(markedNote(wrong.length, Object.keys(s).length), item.retry || catchAll), wrong };
  }
  if (item.type === 'fill') {
    const sol = solution(item);
    const holds = (text) => { try { return chainHolds(text); } catch { return false; } };
    const matches = (acc) => Object.entries(acc).every(([k, val]) => v[k] === val);
    // Strict by default: the boxes must hold the answer (or an allowed alternative in "accept"). Only items marked
    // "open" accept any values that make every line true (e.g. any way to decompose 3 into two parts of at least 1).
    const ok = item.open
      ? holds(item.lines.map((l) => fill(l, v)).join(' ')) && boxes(item).every((b) => v[b] >= (item.min ?? 1))
      : matches(sol) || (item.accept || []).some(matches);
    if (ok) return { status: 'correct', say: item.yes || 'Yes!' };
    // Mark only the boxes that need another look. In an open item whose first line is already true, that is the rest.
    let wrong = boxes(item).filter((b) => v[b] !== sol[b]);
    if (item.open) {
      const firstBoxes = boxes({ type: 'fill', lines: [item.lines[0]] });
      const firstOk = holds(fill(item.lines[0], v)) && firstBoxes.every((b) => v[b] >= (item.min ?? 1));
      wrong = firstOk ? boxes(item).filter((b) => !firstBoxes.includes(b)) : firstBoxes;
    }
    return { status: 'notyet', say: mistake?.say || join(wrong.length ? markedNote(wrong.length, boxes(item).length) : '', item.retry || catchAll), wrong: wrong.length ? wrong : undefined };
  }
  if (item.type === 'decompose') {
    const [a, b] = item.fact;
    const d = decompositionOf(a, b, v.p, v.q, v.r, v.s);
    if (d && v.t === a * b) {
      if (d.inOrder) return { status: 'correct', say: `Yes! ${v.p * v.q} + ${v.r * v.s} = ${a * b}.` };
      const [c1, c2] = d.parts;
      const ordered = d.rowCut ? `${c1} × ${d.K} + ${c2} × ${d.K}` : `${d.K} × ${c1} + ${d.K} × ${c2}`;
      return { status: 'correct', say: `Yes! You can also write it ${ordered}.` };
    }
    const facts = ['p', 'q', 'r', 's'];
    if (mistake) return { status: 'notyet', say: mistake.say, wrong: d ? ['t'] : facts };
    const zeros = facts.filter((k) => v[k] === 0);
    if (zeros.length) return { status: 'notyet', say: 'Each part needs at least 1. A part of 0 is not a real part.', wrong: zeros };
    const shareA = (v.p === a || v.q === a) && (v.r === a || v.s === a);
    const shareB = (v.p === b || v.q === b) && (v.r === b || v.s === b);
    if (!shareA && !shareB) return { status: 'notyet', say: `Keep ${b} in both facts, or keep ${a} in both facts. Only decompose one factor.`, wrong: facts };
    if (!d) {
      const K = shareB ? b : a, S = shareB ? a : b;
      const f1 = v.p === K ? v.q : v.p, f2 = v.r === K ? v.s : v.r;
      return { status: 'notyet', say: `${f1} and ${f2} make ${f1 + f2}. We need ${S}.`, wrong: facts };
    }
    // The facts are a real decomposition: only the total needs another look.
    if (v.t === v.p * v.q) return { status: 'notyet', say: 'You found the first part! Now add the second part.', wrong: ['t'] };
    return { status: 'notyet', say: `Your facts are right. Now find ${v.p * v.q} + ${v.r * v.s}.`, wrong: ['t'] };
  }
  return { status: 'notyet', say: catchAll };
}

const join = (...parts) => parts.filter(Boolean).join(' ');
/** Two words at most two letters apart (a near miss when copying a word from the bank). */
function near(a, b) {
  if (Math.abs(a.length - b.length) > 2) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length] <= 2;
}
const groups = (n, of) => `${n} ${n === 1 ? 'group' : 'groups'} of ${of}`;

/** Which boxes need another look, said in words (the boxes are also marked on the screen). */
function markedNote(n, total) {
  if (total <= 1) return '';
  return n === total ? 'None of the boxes are right yet.' : n === 1 ? 'One box is not right yet. It is marked.' : `${n} boxes are not right yet. They are marked.`;
}

/**
 * Why a typed number is not the answer, when no planned mistake matches (never says the answer itself):
 * an added fact, one group too many or too few, or simply too big or too small.
 */
export function explainNumber(item, x) {
  const target = solution(item).answer;
  const m = String(item.answer).match(/^\s*(\d+)\s*×\s*(\d+)\s*$/);
  // Group messages only when the child can see both factors (and never for × 0 or × 1, where they would name the answer).
  const prompt = String(item.prompt || '');
  if (m && Number(m[1]) > 1 && Number(m[2]) > 1 && new RegExp(`\\b${m[1]}\\b`).test(prompt) && new RegExp(`\\b${m[2]}\\b`).test(prompt)) {
    const a = Number(m[1]), b = Number(m[2]);
    if (x === a + b) return `You added: ${a} + ${b} = ${x}. ${a} × ${b} means ${groups(a, b)}, so multiply.`;
    if (x === target - b) return `${x} is ${groups(a - 1, b)}. You need ${groups(a, b)}.`;
    if (x === target + b) return `${x} is ${groups(a + 1, b)}. You need ${groups(a, b)}.`;
    if (a !== b && x === target - a) return `${x} is ${groups(a, b - 1)}. Each group needs ${b}.`;
    if (a !== b && x === target + a) return `${x} is ${groups(a, b + 1)}. Each group needs ${b}.`;
  }
  // Adding: a lost or extra ten, or just 1 away.
  const plus = String(item.answer).match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/);
  if (plus) {
    if ((plus[1] === '10' || plus[2] === '10') && x === target - 10) return 'You forgot to add the 10. Adding 10 gives one more ten.';
    if (x === target - 10) return 'You lost a ten. When the ones make 10 or more, that ten goes with the tens.';
    if (x === target + 10) return 'You added an extra ten. Check the tens again.';
    if (Math.abs(x - target) === 1) return 'So close! Check the ones again.';
  }
  return x > target ? `${x} is too big.` : `${x} is too small.`;
}

/**
 * Why a typed word is not the answer: another word's meaning (word banks), a word that is not in the bank,
 * or, for spelling, how long the word is and which letter to check first.
 */
export function explainWord(item, typed) {
  if (item.wrongWords?.[typed]) return item.wrongWords[typed];
  if (item.bank?.length) {
    const bank = item.bank.map(normWord);
    if (bank.includes(typed)) return '';
    return bank.some((w) => near(w, typed)) ? 'Check your spelling. Copy the word from the word bank.' : 'Use one of the words in the word bank.';
  }
  const want = normWord(item.answer);
  if (!/^[a-z' -]+$/.test(typed)) return 'Use only letters.';
  if (typed.length !== want.length) return `You typed ${typed.length} ${typed.length === 1 ? 'letter' : 'letters'}. The word has ${want.length} letters.`;
  const k = [...want].findIndex((c, i) => typed[i] !== c);
  return k <= 0 ? 'Check the first letter.' : `The first ${k === 1 ? 'letter is' : `${k} letters are`} right. Check letter ${k + 1}.`;
}

/**
 * Help: the steps a child can open one at a time after a wrong answer. The hints come first (they teach a step
 * without the answer), then the worked steps; the last step finishes the question.
 */
export function helpSteps(item) {
  // A choice question with no written hints still gets a first step before the answer: how to choose.
  const hints = item.hints?.length ? item.hints
    : item.type === 'choice' ? ['Read each choice again. Cross out the ones that cannot be right.'] : [];
  const show = showSteps(item).filter((t) => !hints.includes(t));
  const steps = [...hints.map((text) => ({ text, kind: 'hint' })), ...show.map((text) => ({ text, kind: 'show' }))];
  // The same sentence twice in a row adds nothing when it opens one step at a time.
  return steps.filter((st, k) => k === 0 || st.text !== steps[k - 1].text);
}

/** Rounding with the class method: which digit is underlined, go up or stay, and the rounded number. */
function checkRound(item, response) {
  const p = roundParts(item.n, item.to);
  const name = PLACE[item.to];
  const place = response?.place, dir = response?.dir;
  if (place === undefined || place === null || place === '') return { status: 'empty', say: 'Tap a digit to underline it first.', wrong: ['place'] };
  if (dir !== 'up' && dir !== 'stay') return { status: 'empty', say: 'Choose: go up, or stay the same.', wrong: ['dir'] };
  const r = readNumber(response?.answer);
  if (r.empty) return { status: 'empty', say: 'Type the rounded number.', wrong: ['answer'] };
  if (r.bad) return { status: 'empty', say: 'Use only the digits 0 to 9.', wrong: ['answer'] };
  if (Number(place) !== p.place) return { status: 'notyet', say: `To round to the nearest ${item.to}, underline the digit in the ${name} place. It is the ${FROM_RIGHT[item.to]} digit from the right.`, wrong: ['place'] };
  if (dir !== (p.up ? 'up' : 'stay')) return { status: 'notyet', say: `The arrow points to ${p.next}. Remember: 5 or more, go up. 4 or less, stay the same.`, wrong: ['dir'] };
  const x = r.value;
  if (x === p.answer) return { status: 'correct', say: item.yes || 'Yes!' };
  const zeros = item.to === 10 ? '0' : '00';
  const say = x === item.n ? `Rounding to the nearest ${item.to} makes a number that ends in ${zeros}.`
    : x % item.to !== 0 ? 'Every digit to the right of the underlined digit becomes 0.'
      : p.carry ? `The ${p.d} goes up to 10. Write 0 in the ${name} place and ${p.place === 0 ? `write 1 in the ${NEXT_PLACE[item.to]} place` : `add 1 to the ${NEXT_PLACE[item.to]} digit`}.`
        // Compare the digits left of the underlined one, then the underlined digit itself.
        : Math.floor(x / (item.to * 10)) !== Math.floor(p.answer / (item.to * 10)) ? 'The digits to the left of the underlined digit stay the same.'
          : p.up ? `Going up means the ${p.d} becomes 1 more.` : `Staying the same means the ${p.d} does not change.`;
  return { status: 'notyet', say, wrong: ['answer'] };
}

/** Steps shown by "Show me how". Authored steps win; otherwise the filled-in answer. */
export function showSteps(item) {
  if (item.show?.length) return item.show;
  const a = String(answerText(item)).trim();
  return [item.type === 'choice' ? `The right choice is: ${a}${/[.!?]$/.test(a) ? '' : '.'}` : `The answer is ${a.replace(/[.!?]+$/, '')}.`];
}

/** Score of a finished test: { right, total, passed, missed: [items] }. */
export function score(items, answers, pass) {
  const missed = items.filter((it) => answers[it.id]?.status !== 'correct');
  const right = items.length - missed.length;
  return { right, total: items.length, passed: right >= pass, missed };
}

// ---------------------------------------------------------------- validation

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

function validateModel(m, where, err) {
  if (!m || typeof m !== 'object') return err(`${where}: model is missing`);
  if (m.type === 'plates') {
    if (!isInt(m.plates, 0, 12) || !isInt(m.each, 0, 3)) err(`${where}: plates need 0-12 plates and 0-3 dots each`);
    return;
  }
  if (m.type === 'pair') {
    validateModel({ ...m.left, type: 'array' }, `${where}.left`, err);
    validateModel({ ...m.right, type: 'array' }, `${where}.right`, err);
    if (m.left.rows * m.left.cols !== m.right.rows * m.right.cols) err(`${where}: the two arrays must have the same number of dots`);
    return;
  }
  if (m.type !== 'array') return err(`${where}: unknown model type ${JSON.stringify(m.type)}`);
  if (!isInt(m.rows, 1, 12) || !isInt(m.cols, 1, 12)) err(`${where}: rows and cols must be whole numbers from 1 to 12`);
  if (m.labels !== undefined && !['facts', 'parts', 'none'].includes(m.labels)) err(`${where}: labels must be "facts", "parts" or "none"`);
  if (m.style !== undefined && !['dots', 'tiles'].includes(m.style)) err(`${where}: style must be "dots" or "tiles"`);
  if (m.labels && m.labels !== 'none' && !m.cut) err(`${where}: labels need a cut`);
  if (m.cut) {
    const max = m.cut.by === 'rows' ? m.rows : m.cut.by === 'cols' ? m.cols : 0;
    if (!max) err(`${where}: cut.by must be "rows" or "cols"`);
    else if (!isInt(m.cut.at, 1, max - 1)) err(`${where}: the cut must leave at least 1 ${m.cut.by === 'rows' ? 'row' : 'column'} on each side`);
  }
  if (m.star && !(isInt(m.star[0], 0, m.rows - 1) && isInt(m.star[1], 0, m.cols - 1))) err(`${where}: star is outside the array`);
}

/** The equation a cut array shows, in equation order (e.g. "6 × 3 = 5 × 3 + 1 × 3"). */
export function modelEquation(m) {
  const c = counts(m);
  if (!m.cut) return `${m.rows} × ${m.cols} = ${c.total}`;
  return m.cut.by === 'rows'
    ? `${m.rows} × ${m.cols} = ${m.cut.at} × ${m.cols} + ${m.rows - m.cut.at} × ${m.cols}`
    : `${m.rows} × ${m.cols} = ${m.rows} × ${m.cut.at} + ${m.rows} × ${m.cols - m.cut.at}`;
}

/** "(5 × 3) + (1 × 3)" -> a key for its two facts, ignoring order inside and between facts; null if not two facts. */
function factsKey(text) {
  const m = /^\s*\(?\s*(\d+)\s*[×x]\s*(\d+)\s*\)?\s*\+\s*\(?\s*(\d+)\s*[×x]\s*(\d+)\s*\)?\s*$/.exec(String(text));
  if (!m) return null;
  const f = (a, b) => [Number(a), Number(b)].sort((x, y) => x - y).join('x');
  return [f(m[1], m[2]), f(m[3], m[4])].sort().join('+');
}

function validateItem(item, where, err, ids) {
  if (!isText(item.id)) err(`${where}: id is missing`);
  else if (ids.has(item.id)) err(`${where}: id ${item.id} is used twice`);
  else ids.add(item.id);
  if (!isText(item.prompt)) err(`${where}: prompt is missing`);
  if (item.model) validateModel(item.model, where, err);
  if (item.models !== undefined) {
    if (!Array.isArray(item.models) || !item.models.length) err(`${where}: models must be a list of pictures`);
    else item.models.forEach((m, i) => validateModel(m, `${where}.models[${i}]`, err));
  }
  if (item.hints && (!Array.isArray(item.hints) || !item.hints.every(isText))) err(`${where}: hints must be a list of text`);
  const sol = (() => { try { return solution(item); } catch (e) { err(`${where}: ${e.message}`); return null; } })();
  if (!sol) return;
  const asText = Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, String(v)]));
  switch (item.type) {
    case 'number': {
      // A bare fact prompt ("8 × 3 = ?") must agree with its answer.
      const m = /^\s*(\d+\s*[×x]\s*\d+)\s*=\s*\?\s*$/.exec(item.prompt || '');
      if (m && evaluate(m[1]) !== sol.answer) err(`${where}: the prompt says ${m[1]} but the answer is ${sol.answer}`);
      // "How many rows / columns?" about a picture: the answer must be what the picture shows.
      if (item.asks) {
        const pic = item.model;
        const want = pic?.type === 'array' ? { rows: pic.rows, cols: pic.cols, dots: pic.rows * pic.cols }[item.asks] : undefined;
        if (want === undefined) err(`${where}: "asks" must be rows, cols or dots, about an array picture`);
        else if (want !== sol.answer) err(`${where}: the picture has ${want} ${item.asks}, but the answer is ${sol.answer}`);
      }
      break;
    }
    case 'choice': {
      if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 4) { err(`${where}: choice needs 2 to 4 options`); break; }
      if (item.options.filter((o) => o.correct).length !== 1) err(`${where}: exactly one option must be correct`);
      item.options.forEach((o, i) => {
        if (!isText(o.text)) err(`${where}: option ${i + 1} has no text`);
        if (!o.correct && !isText(o.why)) err(`${where}: wrong option ${i + 1} needs a "why" message`);
        if (o.model) validateModel(o.model, `${where} option ${i + 1}`, err);
      });
      // "Which expression matches this split array?": exactly the correct option names the picture's two facts
      // (turned-around facts count as the same facts, so they can never be a wrong option).
      if (item.pictureMatch) {
        const m = item.model;
        if (!m || m.type !== 'array' || !m.cut) err(`${where}: pictureMatch needs a cut array`);
        else {
          const want = factsKey(modelEquation(m).split('=')[1]);
          item.options.forEach((o, i) => {
            const got = factsKey(o.text);
            if (!got) err(`${where}: option ${i + 1} must be two facts like (5 × 3) + (1 × 3)`);
            else if ((got === want) !== Boolean(o.correct)) err(`${where}: option ${i + 1} (${o.text}) ${o.correct ? 'does not match' : 'also matches'} the picture (${modelEquation(m)})`);
          });
        }
      }
      // "Which fact does this array show?": the target must be the picture's own rows × columns.
      if (item.target && item.model?.type === 'array' && !item.model.cut && item.target.replace(/\s+/g, ' ').trim() !== `${item.model.rows} × ${item.model.cols}`) {
        err(`${where}: the picture shows ${item.model.rows} × ${item.model.cols}, but the target is ${item.target}`);
      }
      if (item.target) {
        const want = evaluate(item.target);
        item.options.forEach((o, i) => {
          let val = null; try { val = evaluate(o.text); } catch { /* not an expression */ }
          if (val !== null && (val === want) !== Boolean(o.correct)) err(`${where}: option ${i + 1} (${o.text} = ${val}) is ${o.correct ? 'marked correct but is not' : 'also equal to ' + item.target}`);
        });
      }
      break;
    }
    case 'word':
    case 'spell': {
      if (!isText(item.answer) || !/^[a-z' -]+$/i.test(item.answer)) err(`${where}: answer must be a word`);
      if (item.type === 'word' && item.blank !== false && !/___/.test(item.prompt || '')) err(`${where}: a fill-in-the-blank prompt needs ___`);
      if (item.type === 'word' && item.bank && !item.bank.some((w) => normWord(w) === normWord(item.answer))) err(`${where}: the word bank must include the answer`);
      if (item.type === 'spell' && (!Array.isArray(item.say) || !item.say.length || !item.say.every(isText))) err(`${where}: dictation needs what to say`);
      if (item.type === 'spell' && item.say?.some((s) => !normWord(s).includes(normWord(item.answer)))) err(`${where}: every spoken part must contain the word`);
      // Nothing written on the screen may give the spelling away.
      for (const k of ['prompt', 'fallback']) if (item.type === 'spell' && normWord(item[k]).includes(normWord(item.answer))) err(`${where}: ${k} shows the answer`);
      // The no-sound clue may not name the base word either ("heat" + "ing" would spell "heating").
      if (item.type === 'spell' && item.base && new RegExp(`\\b${normWord(item.base)}\\b`).test(normWord(item.fallback))) err(`${where}: fallback names the base word ${item.base}`);
      if (item.type === 'word' && normWord(item.prompt).includes(normWord(item.answer))) err(`${where}: the prompt shows the answer`);
      if (check(item, asText).status !== 'correct') err(`${where}: its own answer is not accepted`);
      break;
    }
    case 'letters': {
      const w = String(item.word || '');
      if (!/^[a-z]+$/.test(w)) { err(`${where}: word must be lowercase letters`); break; }
      if (!Array.isArray(item.blanks) || !item.blanks.length || item.blanks.some((b) => !isInt(b, 0, w.length - 1)) || new Set(item.blanks).size !== item.blanks.length) err(`${where}: blanks must be different letter positions in the word`);
      if (normWord(item.prompt).includes(w) || normWord(item.context).includes(w)) err(`${where}: the question shows the answer`);
      break;
    }
    case 'fill': {
      if (!Array.isArray(item.lines) || !item.lines.length) { err(`${where}: fill needs lines`); break; }
      // The lines are one "=" chain: every line after the first continues it.
      if (item.lines.slice(1).some((l) => !/^\s*=/.test(l))) { err(`${where}: continuation lines must start with =`); break; }
      const names = boxes(item);
      if (!names.length) err(`${where}: fill has no [boxes]`);
      if (names.some((n) => sol[n] === undefined)) err(`${where}: answer must give a value for every box`);
      else if (check(item, asText).status !== 'correct') err(`${where}: its own answer is not accepted (${item.lines.join(' ')})`);
      else {
        // The answer, and every allowed alternative, must make the whole chain true (and respect "min").
        for (const alt of [sol, ...(item.accept || [])]) {
          const vals = { ...sol, ...alt };
          let ok = false;
          try { ok = chainHolds(item.lines.map((l) => fill(l, vals)).join(' ')); } catch { ok = false; }
          if (!ok || names.some((n) => vals[n] < (item.min ?? 0))) err(`${where}: ${JSON.stringify(alt)} does not make "${item.lines.join(' ')}" true`);
        }
      }
      break;
    }
    case 'decompose': {
      const [a, b] = item.fact || [];
      if (!isInt(a, 1, 12) || !isInt(b, 1, 12)) { err(`${where}: fact must be two whole numbers`); break; }
      if (check(item, asText).status !== 'correct') err(`${where}: its own answer is not a valid decomposition`);
      break;
    }
    case 'round': {
      if (!isInt(item.n, 10, 9999) || ![10, 100].includes(item.to) || String(item.n).length < String(item.to).length) { err(`${where}: round needs a number n (10 to 9999) with at least as many digits as "to" (10 or 100)`); break; }
      if (check(item, asText).status !== 'correct') err(`${where}: its own answer is not accepted`);
      break;
    }
    case 'table': {
      if (!Array.isArray(item.headers) || !Array.isArray(item.rows)) err(`${where}: table needs headers and rows`);
      else if (item.rows.some((r) => r.length !== item.headers.length)) err(`${where}: every row needs one cell per header`);
      break;
    }
    default: err(`${where}: unknown item type ${JSON.stringify(item.type)}`);
  }
  for (const m of item.mistakes || []) {
    if (!m.when || !isText(m.say)) { err(`${where}: each mistake needs "when" and "say"`); continue; }
    const resp = { ...asText, ...Object.fromEntries(Object.entries(m.when).map(([k, v]) => [k, String(v)])) };
    if (check(item, resp).status === 'correct') err(`${where}: mistake ${JSON.stringify(m.when)} is actually a correct answer`);
  }
}

/** Every string in a value (for the prose arithmetic scan). */
function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

/** Plain-English problems with a lesson file; an empty list means it is safe to show. */
export function validateLesson(lesson, expectedId) {
  const errors = [];
  const err = (msg) => errors.push(`${expectedId || 'lesson'}: ${msg}`);
  if (!lesson || typeof lesson !== 'object') return [`${expectedId}: lesson file must be an object`];
  if (lesson.id !== expectedId) err(`"id" is ${JSON.stringify(lesson.id)}, expected ${JSON.stringify(expectedId)}`);
  for (const k of ['title', 'goal', 'catchAll']) if (!isText(lesson[k])) err(`"${k}" is missing`);
  const ids = new Set();

  const learn = lesson.learn || {};
  if (!Array.isArray(learn.screens) || !learn.screens.length) err('learn.screens is missing');
  (learn.screens || []).forEach((s, i) => {
    if (!isText(s.title)) err(`learn.screens[${i}]: title is missing`);
    if (s.model) validateModel(s.model, `learn.screens[${i}]`, err);
    if (s.item) validateItem(s.item, `learn.screens[${i}].item`, err, ids);
  });

  const ex = lesson.watch?.examples;
  if (!Array.isArray(ex) || !ex.length) err('watch.examples is missing');
  (ex || []).forEach((e, i) => {
    const w = `watch.examples[${i}]`;
    if (!isText(e.title)) err(`${w}: title is missing`);
    if (!Array.isArray(e.steps) || e.steps.length < 2) err(`${w}: needs at least 2 steps`);
    if (e.model) validateModel(e.model, w, err);
    (e.steps || []).forEach((s, j) => {
      if (!isText(s.say)) err(`${w}.steps[${j}]: "say" is missing`);
      if (s.model) validateModel(s.model, `${w}.steps[${j}]`, err);
      if (s.eq) { try { if (!chainHolds(s.eq)) err(`${w}.steps[${j}]: "${s.eq}" is not true`); } catch (e2) { err(`${w}.steps[${j}]: ${e2.message}`); } }
      // A step marked "pictured" must write exactly the decomposition its picture shows, in equation order.
      const m = s.model || e.model;
      if (s.pictured) {
        const norm = (x) => x.replace(/\s+/g, ' ').trim();
        if (!m || m.type !== 'array' || !m.cut) err(`${w}.steps[${j}]: "pictured" needs a cut array`);
        else if (!norm(s.eq || '').startsWith(norm(modelEquation(m)))) err(`${w}.steps[${j}]: "${s.eq}" does not match its picture (${modelEquation(m)})`);
      }
    });
    if (e.why) validateItem(e.why, `${w}.why`, err, ids);
    if (e.another) {
      if (!isText(e.another.text)) err(`${w}.another: text is missing`);
      const pics = e.another.models || [e.another.model];
      pics.forEach((m, k) => validateModel(m, `${w}.another.models[${k}]`, err));
    }
  });

  for (const stage of ['together', 'try', 'test']) {
    const items = lesson[stage]?.items;
    if (!Array.isArray(items) || !items.length) { err(`${stage}.items is missing`); continue; }
    items.forEach((it, i) => validateItem(it, `${stage}.items[${i}]`, err, ids));
    if (stage !== 'together') {
      const pass = lesson[stage].pass;
      if (!isInt(pass, 1, items.length)) err(`${stage}.pass must be between 1 and ${items.length}`);
    }
  }
  if (!Array.isArray(lesson.parent?.sections) || !lesson.parent.sections.length) err('parent.sections is missing');

  proseScan(lesson, err);
  return errors;
}

// Every other sum written anywhere (steps, hints, messages, Show me how) must be true. Lines with answer
// boxes are skipped here: they are proven true with their answers above.
// An item marked "quotesMistake" shows a child's wrong sum on purpose (error analysis); only its prompt is exempt.
function proseScan(data, err) {
  const scanned = JSON.parse(JSON.stringify(data, (k, v) => (v && typeof v === 'object' && v.quotesMistake ? { ...v, prompt: '' } : v)));
  for (const s of strings(scanned)) {
    if (/\[[a-z][a-z0-9]*\]/.test(s)) continue;
    for (const bad of wrongFactsInText(s)) err(`wrong arithmetic in text: "${bad}"`);
  }
}

/** Problems with a list of questions outside a lesson (a practice test); an empty list means it is safe to show. */
export function validateQuiz(items, pass, label = 'quiz') {
  const errors = [];
  const err = (msg) => errors.push(`${label}: ${msg}`);
  if (!Array.isArray(items) || !items.length) return [`${label}: there are no questions`];
  const ids = new Set();
  items.forEach((it, i) => validateItem(it, `items[${i}] (${it?.id})`, err, ids));
  if (!isInt(pass, 1, items.length)) err(`pass must be between 1 and ${items.length}`);
  proseScan(items, err);
  return errors;
}

export function validateLessonIndex(index) {
  const errors = [];
  if (!index || !Array.isArray(index.lessons) || !index.lessons.length) return ['lessons/index.json: "lessons" must list at least one lesson'];
  const ids = new Set();
  index.lessons.forEach((l, i) => {
    if (!l || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id || '')) errors.push(`lessons/index.json: lessons[${i}].id must look like 5-1`);
    else if (ids.has(l.id)) errors.push(`lessons/index.json: ${l.id} is listed twice`);
    else ids.add(l.id);
    if (!isText(l?.title)) errors.push(`lessons/index.json: lessons[${i}].title is missing`);
  });
  return errors;
}
