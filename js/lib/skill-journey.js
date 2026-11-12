// Skill journeys for Lessons 7-2 to 7-7 (owner correction, 2026-11-12): the lesson follows Lesson 7-1's model.
// Each skill is a section (A, B, C…) with its own I Do → We Do → You Do cycle; the lesson ends with the Final Check
// (the lesson's test) and the grown-up report. Pure functions: the data is lesson.journey (built by
// scripts/author/chapter7-journeys.mjs) and the per-section progress kept by js/lesson-player.js.

export const skillJourney = (lesson) => Boolean(lesson?.journey?.sections?.length);
export const sectionsOf = (lesson) => lesson?.journey?.sections || [];
export const sectionOf = (lesson, stage) => sectionsOf(lesson).find((s) => s.id === stage) || null;
export const letter = (i) => String.fromCharCode(65 + i);
export const PHASES = { ido: 'I Do: watch and learn', wedo: 'We Do: try it together', youdo: 'You Do: on your own', say: 'Say it in your own words' };
/** The question a card asks (if any): a question card, a screen with a check, or a worked example's "why". */
export const cardItem = (card) => (card?.kind === 'example' ? card.why : card?.item) || null;

/** Every question in a section, by id (questions on screens and examples included). */
export function sectionItems(section) {
  return new Map((section?.cards || []).map(cardItem).filter((it) => it?.id).map((it) => [it.id, it]));
}
/** The phase of the card that asks a question (help rules depend on it). */
export function phaseOfItem(section, id) {
  return section?.cards.find((c) => cardItem(c)?.id === id)?.phase || null;
}

/** A card is done when it has been seen, its worked example played to the end, and its question answered
 *  (right, or the answer shown by Help, which the report records as help). */
export function cardDone(card, i, state) {
  if (!state?.seen?.[i]) return false;
  if (card.kind === 'example' && (state.steps?.[i] ?? 1) < card.steps.length) return false;
  const it = cardItem(card);
  if (!it) return true;
  const st = state.items?.[it.id];
  return st?.status === 'correct' || Boolean(st?.shown);
}
export const sectionDone = (section, state) => section.cards.every((c, i) => cardDone(c, i, state));
/** The first card not done yet: the child can never be past it (no skipping the teaching). */
export function frontierOf(section, state) {
  const k = section.cards.findIndex((c, i) => !cardDone(c, i, state));
  return k < 0 ? section.cards.length - 1 : k;
}

/** Sections (and the Final Check) open in order: a section needs every earlier one finished. */
export function sectionNeeds(lesson, stage, done) {
  const ids = sectionsOf(lesson).map((s) => s.id);
  const k = stage === 'test' ? ids.length : ids.indexOf(stage);
  if (k < 0) return [];
  return ids.slice(0, k).filter((id) => !done?.has(id));
}
/** Where to go when the lesson opens: the first unfinished section, then the Final Check, then the report. */
export function resumeSkill(lesson, done, submitted) {
  const open = sectionsOf(lesson).find((s) => !done?.has(s.id));
  return open ? open.id : submitted ? 'parent' : 'test';
}

/** How a You Do question finished, for the grown-up report. A right answer after Help or a shown answer is never "on own". */
export function youDoOutcome(st) {
  if (!st || (!st.tries && !st.shown)) return 'not-tried';
  if (st.shown) return 'answer';
  if (st.status !== 'correct') return 'not-yet';
  if (st.scaffoldAssisted || st.help > 0) return 'help';
  return st.first === 'correct' ? 'independent' : 'retry';
}
export const OUTCOME_TEXT = { independent: 'On own, first try', retry: 'On own, after another try', help: 'After help steps', answer: 'After seeing the answer', 'not-yet': 'Not finished', 'not-tried': 'Not started' };

/** The readiness report: each skill's You Do results and the first Final Check (later retakes are practice). */
export function skillReadiness(lesson, stateOf, history) {
  const skills = sectionsOf(lesson).map((s, i) => {
    const st = stateOf(s.id);
    const results = s.cards.filter((c) => c.phase === 'youdo').map((c) => youDoOutcome(st?.items?.[cardItem(c).id]));
    const solid = results.length > 0 && results.every((r) => r === 'independent' || r === 'retry');
    const worst = ['not-tried', 'not-yet', 'answer', 'help', 'retry', 'independent'].find((r) => results.includes(r)) || 'not-tried';
    return { section: s, letter: letter(i), results, solid, worst };
  });
  const t = history?.firstTest || null;
  let level = 'unfinished';
  if (t) level = t.right >= t.pass && skills.every((k) => k.worst !== 'answer' && k.worst !== 'not-yet' && k.worst !== 'not-tried') ? 'ready' : t.right >= t.pass - 2 ? 'review' : 'notyet';
  return { skills, test: t, level, practise: skills.filter((k) => !k.solid && k.worst !== 'not-tried').map((k) => k.section.title) };
}
