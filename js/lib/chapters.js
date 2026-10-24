// Math chapters (DECISIONS D26). Chapters own their Math content: vocabulary, lessons, practice, study guide and
// chapter test. Weeks own the newsletter, spelling, ELA vocabulary, homework, school-test dates and which chapter
// the class is studying (week.mathChapter). Math opens on Choose Your Chapter; a week only recommends a chapter.
//
// A chapter is registered in data/lessons/index.json ("chapters": id, title, name, summary, week) and its
// activities in ACTIVITIES.math (js/lib/activities.js), each naming its `chapter`. Every chapter menu has the same
// six roles, in this order.

import { ACTIVITIES, activityInfo } from './activities.js';
import { chapterOf } from './lessons.js';

export const CHAPTER_ROLES = [
  { role: 'vocab', label: 'Learn Vocabulary' },
  { role: 'vocabpractice', label: 'Vocabulary Practice' },
  { role: 'lessons', label: 'Math Lessons' },
  { role: 'practice', label: 'Practice Problems' },
  { role: 'guide', label: 'Study Guide' },
  { role: 'test', label: 'Chapter Test' },
];

/** The registered chapters, in order (from data/lessons/index.json). */
export const chapterList = (lessons) => (lessons?.chapters || []).filter((c) => Number.isInteger(c.id));

/** The chapter an address belongs to: a chapter menu (#math?ch=6), one of its activities, or one of its lessons. */
export function chapterFor(lessons, { ch = null, act = null, lesson = null } = {}) {
  const id = ch || activityInfo('math', act)?.chapter || (lesson ? chapterOf(lesson) : null);
  return chapterList(lessons).find((c) => c.id === id) || null;
}

/** A chapter's menu: one activity per role, in the CHAPTER_ROLES order. */
export const chapterMenu = (id) => CHAPTER_ROLES
  .map((r) => ({ ...r, act: ACTIVITIES.math.find((a) => a.chapter === id && a.role === r.role) }))
  .filter((r) => r.act);

/** The chapter the class is studying in a week (its newsletter's math topic), or null. */
export const recommendedChapter = (week, lessons) => chapterList(lessons).find((c) => c.id === week?.mathChapter) || null;

/** "Currently studying" for the week's chapter; earlier chapters are for review; later ones open any time. */
export function chapterStatus(chapter, week) {
  const now = week?.mathChapter;
  if (!now) return 'Open any time';
  if (chapter.id === now) return 'Currently studying';
  return chapter.id < now ? 'Available for review' : 'Coming up: open any time';
}

/** The lessons of a chapter, in order. */
export const chapterLessons = (lessons, id) => (lessons?.lessons || []).filter((l) => chapterOf(l.id) === id);

/** Problems with the chapter registry; an empty list means it is safe to show. */
export function validateChapters(lessons) {
  const errors = [];
  const list = lessons?.chapters;
  if (!Array.isArray(list) || !list.length) return ['lessons/index.json: "chapters" must list the Math chapters'];
  const ids = new Set();
  for (const c of list) {
    const at = `lessons/index.json chapter ${c?.id}`;
    if (!Number.isInteger(c?.id)) { errors.push('lessons/index.json: every chapter needs a number "id"'); continue; }
    if (ids.has(c.id)) errors.push(`${at}: listed twice`);
    ids.add(c.id);
    for (const k of ['title', 'name', 'summary']) if (typeof c[k] !== 'string' || !c[k].trim()) errors.push(`${at}: "${k}" is missing`);
    if (c.week !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(c.week)) errors.push(`${at}: "week" must be a week id`);
    if (!chapterLessons(lessons, c.id).length) errors.push(`${at}: has no lessons`);
    const roles = chapterMenu(c.id).map((r) => r.role);
    for (const r of CHAPTER_ROLES) if (!roles.includes(r.role)) errors.push(`${at}: its menu has no "${r.label}"`);
  }
  for (const l of lessons.lessons || []) if (!ids.has(chapterOf(l.id))) errors.push(`lessons/index.json: lesson ${l.id} has no chapter`);
  return errors;
}
