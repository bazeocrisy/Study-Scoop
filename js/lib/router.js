// Hash routes: "#<section>" for this week, "#<section>?week=YYYY-MM-DD" for another week.
// Lessons live under Math: "#math?lesson=5-1&stage=watch" (DECISIONS D17).
// Activities: "#vocab?act=choice", "#spelling?act=listen", "#math?act=split", "#skills?act=roundten"; practice tests: "#tests?test=math" (D18, D19, D22).
// The week lives in the address (not in storage), so links can be shared and nothing is saved.

export const DEFAULT_SECTION = 'week';
const LESSON_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WORD = /^[a-z]+$/;
/** Sections that open on a menu of activities (#math?act=practice, #spelling?act=flash). */
const SUBJECTS = ['spelling', 'vocab', 'math', 'skills', 'homework'];

/** Reads a location hash. `known` is false when the section name was not recognised. */
export function parseHash(hash, sectionIds) {
  const text = String(hash || '').replace(/^#/, '');
  const q = text.indexOf('?');
  const name = q === -1 ? text : text.slice(0, q);
  const params = new URLSearchParams(q === -1 ? '' : text.slice(q + 1));
  const known = name === '' || sectionIds.includes(name);
  const section = name && sectionIds.includes(name) ? name : DEFAULT_SECTION;
  const lesson = section === 'math' && LESSON_ID.test(params.get('lesson') || '') ? params.get('lesson') : null;
  return {
    section,
    week: params.get('week') || null,
    lesson,
    stage: lesson ? params.get('stage') || null : null,
    act: SUBJECTS.includes(section) && !lesson && WORD.test(params.get('act') || '') ? params.get('act') : null,
    test: section === 'tests' && WORD.test(params.get('test') || '') ? params.get('test') : null,
    known,
  };
}

/** The canonical hash for a section and week (plus an optional lesson and stage). The current week is left out. */
export function buildHash(section, weekId, currentWeekId, extra = {}) {
  const params = [];
  if (weekId && weekId !== currentWeekId) params.push(`week=${encodeURIComponent(weekId)}`);
  if (section === 'math' && extra.lesson) {
    params.push(`lesson=${encodeURIComponent(extra.lesson)}`);
    if (extra.stage) params.push(`stage=${encodeURIComponent(extra.stage)}`);
  }
  if (SUBJECTS.includes(section) && !extra.lesson && extra.act) params.push(`act=${encodeURIComponent(extra.act)}`);
  if (section === 'tests' && extra.test) params.push(`test=${encodeURIComponent(extra.test)}`);
  return params.length ? `#${section}?${params.join('&')}` : `#${section}`;
}

/** The week to show: the requested one when it is listed, otherwise the current week. */
export function resolveWeek(requested, index) {
  return requested && index.weeks.some((w) => w.id === requested) ? requested : index.current;
}
