// Reading Coach engine: the pure logic behind every question, hint, retry and summary (no DOM, so Node tests run it).
// One item model serves every passage. A passage written for the improved experience carries a `coach` block; the other
// passages keep their original `questions` and `elements`, which `buildItems` converts into the same items, so they
// work unchanged and gain hints, help tracking and the parent summary.
//
// Nothing here stores anything: every state object lives in memory for the current page visit (CLAUDE.md).
import { GUIDE, checkBlank, fillBlank, formatOf, mapChoices, shuffled } from './reading.js';

/** Names of the skills, in the words a parent reads. */
export const SKILLS = {
  listen: 'Listening', detail: 'Finding details', element: 'Story elements', sequence: 'Putting events in order',
  cause: 'Cause and effect', inference: 'Making inferences', summary: 'Summarizing', main: 'Main idea and lesson',
  vocab: 'Word meaning', solution: 'Explaining a solution',
};
/** The skill a passage-original question or map element practises. */
const LEGACY_SKILL = { listen: 'listen', order: 'sequence', cause: 'cause', main: 'main', detail: 'detail', vocab: 'vocab', infer: 'inference' };
const MAP_SKILL = { characters: 'element', setting: 'element', problem: 'element', solution: 'element', lesson: 'element', events: 'sequence', mainidea: 'main', detail: 'detail', cause: 'cause', takeaway: 'summary' };
/** What to look for, when a passage did not write its own first hint. */
const GENERIC_HINT = {
  listen: 'Think back to what you heard. Which part answers the question?',
  detail: 'Look for the key words from the question. They are in the story.',
  order: 'Look for order words such as first, then, next and finally.',
  cause: 'Look for a word such as because or so. What happened, and why?',
  main: 'Think about the whole passage, not just one part.',
  vocab: 'Read the sentence around the word. What would make sense there?',
  infer: 'The story does not say it straight out. What do the clues tell you?',
};

const asList = (v) => (Array.isArray(v) ? v : [v]).filter((n) => Number.isInteger(n));
const seedOf = (text) => [...String(text)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 17);

// ---------------------------------------------------------------- building the items

/**
 * Every item of a passage as { listen, map, core, written, all }. An item is
 * { id, group, fact, skill, format, ask, evidence: [sentence numbers], hint, explain, legacy, ... } plus what its format needs:
 * choice (choices, right), tf (right: boolean), blank (accept, blank), sequence (order, display), say (model, selfChecked).
 * `follow` (optional, choice or tf) is a second question: pick the sentence that proves it, or correct the false statement.
 */
export function buildItems(story) {
  if (story.coach) return fromCoach(story);
  const items = { listen: [], map: [], core: [], written: [] };
  const guide = GUIDE[story.kind];
  story.questions.forEach((q, i) => {
    const f = formatOf(q);
    const it = {
      id: `q${i}`, group: q.type === 'listen' ? 'listen' : 'core', fact: `q${i}`, skill: LEGACY_SKILL[q.type] || 'detail', format: f, ask: q.ask,
      evidence: asList(q.find), hint: GENERIC_HINT[q.type] || GENERIC_HINT.detail, explain: null, legacy: true,
    };
    if (f === 'choice') Object.assign(it, { choices: q.choices, right: q.answer });
    else if (f === 'tf') Object.assign(it, { right: q.answer });
    else if (f === 'blank') Object.assign(it, { blank: q.blank, accept: q.accept });
    else Object.assign(it, { format: 'say', model: q.answer, selfChecked: true });
    items[it.group].push(it);
  });
  for (const g of guide) {
    const m = story.elements[g.id];
    const base = { id: `m-${g.id}`, group: 'map', fact: `m-${g.id}`, element: g.id, skill: MAP_SKILL[g.id], ask: g.ask, evidence: asList(m.find), hint: g.tip, explain: null, legacy: true };
    if (g.id === 'events') items.map.push({ ...base, format: 'sequence', order: m.order, display: shuffled(m.order, 5) });
    else {
      const f = formatOf(m);
      if (f === 'blank') items.map.push({ ...base, format: 'blank', ask: m.text, blank: m.blank, accept: m.accept });
      else if (f === 'say') items.map.push({ ...base, format: 'say', model: m.answer, selfChecked: true });
      // Seeded by the passage as well as the element, so the right answer to (say) every Setting question is not in the same place.
      else { const mc = mapChoices(m, seedOf(`${story.id}-${g.id}`)); items.map.push({ ...base, format: 'choice', choices: mc.choices, right: mc.answer }); }
    }
  }
  items.all = [...items.listen, ...items.map, ...items.core];
  return items;
}

function fromCoach(story) {
  const c = story.coach;
  const make = (x, group) => {
    const it = { id: x.id, group, fact: x.fact, skill: x.skill, format: x.format, ask: x.ask, evidence: asList(x.evidence), hint: x.hint, explain: x.explain || null, legacy: false };
    if (x.element) it.element = x.element;
    if (x.format === 'choice') Object.assign(it, { choices: x.choices, right: x.answer });
    else if (x.format === 'tf') it.right = x.answer;
    else if (x.format === 'blank') Object.assign(it, { blank: x.blank, accept: x.accept, reject: x.reject || [] });
    else if (x.format === 'sequence') Object.assign(it, { order: x.order, display: shuffled(x.order, seedOf(x.id)) });
    if (x.follow) it.follow = { kind: x.follow.kind, ask: x.follow.ask, choices: x.follow.choices, right: x.follow.answer };
    return it;
  };
  const items = {
    listen: c.listen.map((x) => make(x, 'listen')),
    map: c.map.map((x) => make(x, 'map')),
    core: c.core.map((x) => make(x, 'core')),
    written: c.written.map((x) => ({ id: x.id, group: 'written', fact: x.fact, skill: x.skill, ask: x.ask, starters: x.starters, model: x.model, checklist: x.checklist, evidence: asList(x.evidence), hint: x.hint })),
  };
  items.all = [...items.listen, ...items.map, ...items.core];
  return items;
}

/** The right answer of an item in words (for hints, the answer-review area and the parent summary). */
export function answerText(item) {
  if (item.format === 'choice') return item.choices[item.right] + (item.follow ? ` (proof: ${item.follow.choices[item.follow.right]})` : '');
  if (item.format === 'tf') {
    const base = item.right ? 'True' : 'False';
    return item.follow ? `${base}. ${item.follow.kind === 'correction' ? 'Corrected: ' : 'Proof: '}${item.follow.choices[item.follow.right]}` : base;
  }
  if (item.format === 'blank') return fillBlank(item.ask, item.blank);
  if (item.format === 'sequence') return item.order.map((t, i) => `${i + 1}. ${t}`).join('  ');
  return item.model;
}

/** The sentences an item points at, as text. */
export const evidenceSentences = (story, item) => item.evidence.map((i) => ({ i, text: story.sentences[i] }));

/** Graduated help: 1 what to look for, 2 where to look, 3 the answer and why. Never the answer at level 1 or 2. */
export function hintAt(story, item, level) {
  if (level <= 1) return { level: 1, title: 'What to look for', text: item.hint };
  if (level === 2) return { level: 2, title: 'Where to look', sentences: evidenceSentences(story, item) };
  return { level: 3, title: 'The answer and why', text: answerText(item), explain: item.explain, sentences: evidenceSentences(story, item) };
}

// ---------------------------------------------------------------- one item's state

/** A fresh state. `attempts` are every try this round; `history` keeps earlier rounds so a retry never erases them. */
export function newState() {
  return { round: 1, attempts: [], helpLevel: 0, helped: false, revealed: false, done: false, stage: 'main', slots: [], draft: '', followDraft: '', selfStatus: null, shown: false, history: [], reviewedAfter: false };
}

const log = (st, stage, response, correct) => st.attempts.push({ stage, response, correct, help: st.helpLevel });

/**
 * Records one try. `response` depends on the stage: choice index, true/false, typed text, or the sequence card he tapped.
 * Returns { correct, done, stage } and never reveals an answer.
 */
export function submit(st, item, response) {
  if (st.done) return { correct: true, done: true, stage: st.stage };
  if (st.stage === 'follow') {
    const ok = response === item.follow.right;
    log(st, 'follow', response, ok);
    if (ok) st.done = true;
    return { correct: ok, done: st.done, stage: 'follow' };
  }
  let ok;
  if (item.format === 'choice') ok = response === item.right;
  else if (item.format === 'tf') ok = response === item.right;
  else if (item.format === 'blank') ok = checkBlank(response, item.accept, item.reject || []);
  else if (item.format === 'sequence') ok = response === item.order[st.slots.length];
  else throw new Error(`${item.format} questions are self-checked, not submitted`);
  log(st, 'main', response, ok);
  if (!ok) return { correct: false, done: false, stage: 'main' };
  if (item.format === 'sequence') {
    st.slots.push(response);
    if (st.slots.length === item.order.length) st.done = true;
  } else if (item.follow) st.stage = 'follow';
  else st.done = true;
  return { correct: true, done: st.done, stage: st.stage };
}

/** He asks for a hint. Returns the new level (1 to 3). Level 3 shows the answer, so it counts as a reveal. */
export function useHint(st) {
  st.helpLevel = Math.min(3, st.helpLevel + 1);
  st.helped = true;
  if (st.helpLevel === 3) st.revealed = true;
  return st.helpLevel;
}

/**
 * The answer-review area opened this item's answer. If he had not finished it, he was shown the answer, so anything he
 * finishes afterwards is "with help". If he had already finished, nothing about his result changes.
 */
export function reveal(st) {
  if (st.done) { st.reviewedAfter = true; return; }
  st.helped = true;
  st.revealed = true;
  st.helpLevel = 3;
}

/** A passage-original "say it, then check" item: he marks himself. Never mixed with the checked results. */
export function selfAssess(st, gotIt) { st.shown = true; st.selfStatus = gotIt ? 'got' : 'practice'; }

/**
 * What to tell him, in one word:
 * unanswered, independent (found it on his own), withHelp (found it after a hint or a look at the answer),
 * practicing (tried, not there yet), or self (marked himself on a say-it item).
 */
export function statusOf(st, item) {
  if (item.format === 'say') return st.selfStatus ? 'self' : 'unanswered';
  if (!st.attempts.length && !st.revealed) return 'unanswered';
  if (st.done) return st.helped ? 'withHelp' : 'independent';
  return 'practicing';
}

/** The child-facing sentence for a status. Unanswered is never shown as a mistake. */
export const STATUS_TEXT = {
  unanswered: 'Not answered yet.',
  independent: 'You found it independently.',
  withHelp: 'You found it after a hint.',
  practicing: "Let's look for the clue together.",
  self: 'You checked this one yourself.',
};

/** His very first try, kept for the parent even after retries. null when he has not tried. */
export function firstAttempt(st) {
  const all = [...st.history.flatMap((h) => h.attempts), ...st.attempts];
  return all.length ? { correct: all[0].correct, stage: all[0].stage } : null;
}

/** Starts another round of this item. The old round is kept in `history`; nothing else is touched. */
export function retry(st) {
  st.history.push({ round: st.round, attempts: st.attempts, helped: st.helped, revealed: st.revealed, done: st.done });
  Object.assign(st, { round: st.round + 1, attempts: [], helpLevel: 0, helped: false, revealed: false, done: false, stage: 'main', slots: [], draft: '', followDraft: '', reviewedAfter: false });
}

/** Has he handed in an answer (or been shown the answer)? Completing an activity does not depend on being right. */
export const attempted = (st, item) => (item.format === 'say' ? Boolean(st.selfStatus) : st.attempts.length > 0 || st.revealed || st.history.length > 0);

// ---------------------------------------------------------------- written responses (self-assessed, never auto-graded)

export const newWritten = () => ({ text: '', compared: false, checks: [], reviewed: false, parentNote: '', viewedHint: false });

/**
 * draft: writing started. selfAssessed: he compared with the model and the checklist (needs a parent to look).
 * reviewed: a grown-up marked it reviewed. Open explanations are never scored by matching words.
 */
export function writtenStatus(w, prompt = null) {
  const t = w.text.trim();
  // A sentence starter left exactly as it was handed over is not an answer yet.
  if (!t || (prompt?.starters || []).some((x) => x.trim() === t)) return 'unanswered';
  if (w.reviewed) return 'reviewed';
  return w.compared ? 'selfAssessed' : 'draft';
}
export const WRITTEN_TEXT = {
  unanswered: 'Not written yet.', draft: 'Draft. Compare it with the model when you are ready.',
  selfAssessed: 'Self-assessed. A grown-up still needs to read it.', reviewed: 'Reviewed by a grown-up.',
};

// ---------------------------------------------------------------- the answer key and the parent summary

/** Every item with its answer, evidence and explanation, for the answer-review area. */
export function answerKey(story) {
  const it = buildItems(story);
  const row = (x) => ({ id: x.id, group: x.group, element: x.element, skill: x.skill, ask: x.ask, format: x.format, answer: answerText(x), explain: x.explain, find: x.evidence, evidence: x.evidence });
  return { map: it.map.map(row), questions: [...it.listen, ...it.core].map(row), written: it.written.map((w) => ({ id: w.id, ask: w.ask, model: w.model, evidence: w.evidence })) };
}

/**
 * The parent summary as data (the page and the tests both use it).
 * `ctx`: { story, items, states, writtenStates, readings, activities, lookBacks }.
 * Checked results (choice, true/false, blank, sequence) are kept apart from self-assessed items and written responses.
 */
export function buildSummary({ story, items, states, writtenStates = {}, readings = [], activities = [], lookBacks = 0 }) {
  const rows = items.all.map((it) => {
    const st = states[it.id];
    const status = statusOf(st, it);
    const first = firstAttempt(st);
    return { id: it.id, group: it.group, skill: it.skill, ask: it.ask, format: it.format, status, helped: st.helped, revealed: st.revealed, first: first ? (first.correct ? 'right' : 'wrong') : 'none', rounds: st.round, retried: st.history.length > 0, selfChecked: it.format === 'say' };
  });
  const checked = rows.filter((r) => !r.selfChecked);
  const count = (s) => checked.filter((r) => r.status === s).length;
  const skillsToRevisit = [...new Set(checked.filter((r) => r.status === 'withHelp' || r.status === 'practicing').map((r) => r.skill))].map((k) => SKILLS[k] || k);
  const notTried = [...new Set(checked.filter((r) => r.status === 'unanswered').map((r) => r.skill))].map((k) => SKILLS[k] || k);
  const written = items.written.map((w) => {
    const ws = writtenStates[w.id] || newWritten();
    return { id: w.id, ask: w.ask, skill: w.skill, text: ws.text, status: writtenStatus(ws, w), checks: ws.checks, checklist: w.checklist, reviewed: ws.reviewed, parentNote: ws.parentNote, model: w.model };
  });
  return {
    passage: story.title, total: checked.length,
    counts: { independent: count('independent'), withHelp: count('withHelp'), practicing: count('practicing'), unanswered: count('unanswered') },
    rows, checked,
    withHelp: checked.filter((r) => r.status === 'withHelp'), unanswered: checked.filter((r) => r.status === 'unanswered'),
    selfAssessed: rows.filter((r) => r.selfChecked), written, skillsToRevisit, notTried,
    activities, readings, lookBacks,
    firstTry: { right: checked.filter((r) => r.first === 'right').length, tried: checked.filter((r) => r.first !== 'none').length },
  };
}

// ---------------------------------------------------------------- warning signals for question quality (never proof)

/** How often the right choice is the longest or the shortest. A warning signal for an answer a child could guess by length. */
export function lengthBias(items) {
  const sets = [];
  for (const it of items) {
    if (it.format === 'choice') sets.push({ id: it.id, lens: it.choices.map((c) => c.length), right: it.right });
    if (it.follow) sets.push({ id: `${it.id}/follow`, lens: it.follow.choices.map((c) => c.length), right: it.follow.right });
  }
  const longest = sets.filter((s) => s.lens[s.right] > Math.max(...s.lens.filter((_, i) => i !== s.right))).length;
  const shortest = sets.filter((s) => s.lens[s.right] < Math.min(...s.lens.filter((_, i) => i !== s.right))).length;
  const big = sets.filter((s) => s.lens[s.right] >= 1.5 * Math.max(...s.lens.filter((_, i) => i !== s.right))).map((s) => s.id);
  return { n: sets.length, longest, shortest, longestRate: sets.length ? longest / sets.length : 0, bigGap: big };
}

const STOP = new Set('about after again also because before could every from have into just like more mostover said some than that their them then there they this were what when where which while with would your'.split(' '));
const contentWords = (t) => String(t).toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ''));
/**
 * A rough check that an item's evidence sentences say something related to its answer (a word in common). It cannot judge
 * meaning, so it only lists items for a person to look at.
 */
export function evidenceOverlap(story, item) {
  const ev = contentWords(item.evidence.map((i) => story.sentences[i]).join(' '));
  const ans = item.format === 'choice' ? [item.choices[item.right]] : item.format === 'blank' ? [item.blank, ...(item.accept || [])] : item.format === 'sequence' ? item.order : item.format === 'say' ? [item.model] : [item.ask];
  const words = contentWords(ans.join(' ') + (item.follow ? ' ' + item.follow.choices[item.follow.right] : ''));
  return { ok: words.some((w) => ev.includes(w)), words };
}
