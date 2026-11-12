/** Chapter 7 skill journeys (owner correction, 2026-11-12): Lessons 7-2 to 7-7 follow Lesson 7-1's teaching model.
 * Each distinct skill is its own section with a complete cycle: I Do (explanation screens and a worked example that
 * change step by step) → We Do (guided questions with help) → You Do (new questions, help only after a try), and the
 * lesson ends with the Final Check (the lesson's 10-question test) and the grown-up report.
 * Pure: it reuses the lesson's own reviewed screens, worked examples and questions (verified answer keys and
 * misconception feedback) by reference, and adds a few original screens where a skill had no I Do of its own.
 */
const clone = (x) => JSON.parse(JSON.stringify(x));
const bar = (d, n = 0) => ({ type: 'fraction', kind: 'bar', parts: d, wholes: 1, selected: Array.from({ length: n }, (_, i) => i) });
const line = (d, n) => ({ type: 'fraction', kind: 'line', parts: d, max: 1, point: n });
const lineCounted = (d, n) => ({ ...line(d, n), counted: Array.from({ length: n }, (_, i) => i) });
const disk = (d, n = 0) => ({ ...bar(d, n), kind: 'circle', framing: 'close' });

// I Do screens written for skills that had no explanation screen of their own (original text and pictures).
const NEW = {
  '7-2:fix': { title: 'Check a fraction', text: ['A learner wrote 5/8 for this strip. Let us check.', 'Count all the equal pieces: 8. Count the colored pieces: 3. The fraction is 3/8, not 5/8. The 5 counted the plain pieces.'], model: { ...bar(8, 3), counted: [0, 1, 2] } },
  '7-3:fix': { title: 'Check a point', text: ['A learner wrote 2/4 for this point.', 'Count the spaces from 0, not the ticks. One space reaches the point, so the point is 1/4. The 2 counted the tick at 0 too.'], model: lineCounted(4, 1) },
  '7-4:top': { title: 'Find the missing top number', text: ['This disk has 6 equal parts. ?/6 equals 1 means: how many parts make the whole?', 'Every part is needed, so the top is 6 too: 6/6 is one whole.'], model: { ...disk(6, 6), counted: [0, 1, 2, 3, 4, 5] } },
};

// The skill map of each lesson: [id, short label, title, cards]. Card refs: L<n> learn screen, W<n> worked example,
// g<n>/t<n> question from Practice Together / Try It Yourself, '+name' a NEW screen, '*id' an extra question.
// Phases: I = I Do, W = We Do, Y = You Do, S = say it in your own words.
export const MAPS = {
  '7-2': [
    ['whole', 'One whole', 'One whole and equal parts', ['I:L0', 'I:L1', 'W:*ja1', 'Y:t20']],
    ['denominator', 'Denominator', 'The bottom number: all the equal parts', ['I:L2', 'I:L5', 'W:g2', 'Y:t6', 'Y:t7']],
    ['numerator', 'Numerator', 'The top number: the colored parts', ['I:L3', 'I:L4', 'W:g3', 'Y:t8', 'Y:t9']],
    ['unit', 'Unit fractions', 'One part is a unit fraction', ['I:L6', 'W:g5', 'Y:t10', 'Y:t11']],
    ['name', 'Name it', 'Name the fraction', ['I:W0', 'I:W1', 'I:W2', 'W:g1', 'W:g4', 'Y:t3', 'Y:t5', 'Y:t12']],
    ['fix', 'Fix it', 'Fix a fraction mistake', ['I:+7-2:fix', 'W:g6', 'Y:t16', 'Y:t17', 'S:L9']],
  ],
  '7-3': [
    ['distance', 'One whole', 'One whole is a distance', ['I:L0', 'I:L1', 'W:g2', 'Y:t6', 'Y:t8']],
    ['interval', 'One step', 'One equal step is a unit fraction', ['I:L2', 'W:g5', 'Y:t12', 'Y:t13']],
    ['spaces', 'Count spaces', 'Count spaces to the point, not ticks', ['I:L3', 'I:L4', 'I:W1', 'W:g3', 'W:g6', 'Y:t9', 'Y:t10', 'Y:t15']],
    ['point', 'Name the point', 'Name a point on the number line', ['I:L5', 'I:L6', 'I:W0', 'I:W2', 'W:g1', 'W:g4', 'Y:t1', 'Y:t4', 'Y:t5']],
    ['fix', 'Fix it', 'Fix mistakes and move the point', ['I:+7-3:fix', 'W:t14', 'Y:t16', 'Y:t20', 'Y:t19', 'S:L9']],
  ],
  '7-4': [
    ['all', 'All the parts', 'Every part makes one whole', ['I:L0', 'I:L1', 'I:L2', 'I:L3', 'I:W0', 'W:g1', 'W:g2', 'Y:t1', 'Y:t2', 'Y:t3']],
    ['check', 'Is it whole?', 'Is it one whole? Check both numbers', ['I:L6', 'W:g3', 'Y:t5', 'Y:t6', 'Y:t7']],
    ['top', 'Missing top', 'Find the missing top number', ['I:+7-4:top', 'W:g4', 'Y:t9', 'Y:t10']],
    ['line', 'On a line', 'One whole on a number line', ['I:L5', 'I:W2', 'W:g5', 'Y:t12', 'Y:t13']],
    ['names', 'Many names', 'Different names for one whole', ['I:L4', 'I:W1', 'W:g6', 'Y:t15', 'Y:t16', 'Y:t8', 'S:L9']],
  ],
  '7-5': [
    ['one', 'One part', 'Each whole is one part', ['I:L0', 'I:L1', 'I:L4', 'W:g1', 'W:g4', 'Y:t1', 'Y:t13']],
    ['count', 'Count wholes', 'Count the wholes', ['I:L2', 'I:W0', 'W:g2', 'Y:t2', 'Y:t4']],
    ['write', 'Write n/1', 'Write a whole number over 1', ['I:L3', 'W:g3', 'Y:t7', 'Y:t8', 'Y:t10']],
    ['line', 'On a line', 'Whole numbers on a number line', ['I:L5', 'I:L6', 'I:W2', 'W:g5', 'Y:t9', 'Y:t12', 'Y:t20']],
    ['back', 'Back again', 'From n/1 back to a whole number, and fixing mistakes', ['I:W1', 'W:g6', 'Y:t14', 'Y:t16', 'Y:t18', 'S:L9']],
  ],
  '7-6': [
    ['unit', 'One unit', 'One whole unit and its equal gaps', ['I:L0', 'I:L1', 'I:L4', 'W:g1', 'Y:t1']],
    ['past', 'Past 1', 'Keep counting past 1', ['I:L2', 'I:L3', 'I:W0', 'I:W1', 'W:g2', 'W:g6', 'Y:t2', 'Y:t16', 'Y:t19']],
    ['name', 'Name it', 'Name a point greater than 1', ['I:L7', 'W:g3', 'W:g4', 'Y:t3', 'Y:t5', 'Y:t7']],
    ['compare', 'Compare', 'Compare with whole numbers', ['I:L5', 'I:L6', 'I:L8', 'I:W2', 'W:g5', 'Y:t14', 'Y:t15', 'Y:t20', 'S:L11']],
  ],
  '7-7': [
    ['set', 'The whole set', 'The whole is the whole set', ['I:L0', 'I:L1', 'I:L4', 'I:L5', 'I:W0', 'W:g1', 'W:g5', 'Y:t13', 'Y:t19', 'Y:t20']],
    ['one', 'One object', 'One selected object: a unit fraction', ['I:L2', 'W:g3', 'Y:t2', 'Y:t3', 'Y:t12']],
    ['several', 'Several', 'Several selected objects', ['I:L3', 'I:W2', 'W:g2', 'W:g4', 'Y:t9', 'Y:t10', 'Y:t14']],
    ['move', 'Moving', 'Moving objects and naming other groups', ['I:L6', 'I:L7', 'I:W1', 'W:g6', 'Y:t16', 'Y:t11', 'S:L10']],
  ],
};
const PHASE = { I: 'ido', W: 'wedo', Y: 'youdo', S: 'say' };

/** Adds `journey` to a lesson. `extra` maps an extra question id to its question (built by the lesson's own builders). */
export function applyChapter7Journey(lesson, extra = {}) {
  const map = MAPS[lesson.id];
  if (!map) return lesson;
  const l = clone(lesson);
  const items = new Map([...l.together.items, ...l.try.items].map((it) => [it.id, it]));
  const used = new Set();
  const card = (ref) => {
    const [p, what] = [ref[0], ref.slice(2)], phase = PHASE[p];
    if (what.startsWith('+')) return { kind: 'screen', phase, ...clone(NEW[what.slice(1)]) };
    if (what.startsWith('*')) { const q = extra[what.slice(1)]; if (!q) throw Error(`${l.id}: missing extra question ${what}`); return { kind: 'item', phase, item: clone(q) }; }
    if (/^L\d+$/.test(what)) { const s = l.learn.screens[Number(what.slice(1))]; if (!s) throw Error(`${l.id}: no learn screen ${what}`); return { kind: 'screen', phase, ...clone(s) }; }
    if (/^W\d+$/.test(what)) { const e = l.watch.examples[Number(what.slice(1))]; if (!e) throw Error(`${l.id}: no worked example ${what}`); return { kind: 'example', phase, ...clone(e) }; }
    const q = items.get(what);
    if (!q) throw Error(`${l.id}: no question ${what}`);
    if (used.has(what)) throw Error(`${l.id}: question ${what} used twice`);
    used.add(what);
    return { kind: 'item', phase, item: clone(q) };
  };
  l.journey = { sections: map.map(([id, label, title, refs]) => ({ id, label, title, cards: refs.map(card) })) };
  return l;
}
