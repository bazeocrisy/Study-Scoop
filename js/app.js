// Study Scoop: one-page app. Reads data/weeks.json and data/<week>.json and shows one of eight sections.
// Nothing is stored: no localStorage, cookies, accounts or analytics. The chosen week lives in the address.

import { html } from './lib/html.js';
import { loadIndex, loadJSON, loadWeek } from './lib/data.js';
import { buildHash, parseHash, resolveWeek } from './lib/router.js';
import { validateIndex, validateWeek } from './lib/validate.js';
import { STAGE_IDS, stageLabel, validateLesson, validateLessonIndex } from './lib/lessons.js';
import { hasPropertyWords } from './lib/mathlearn.js';
import { validateArea } from './lib/area.js';
import { mountLesson, mountReadButtons, stateFor, visitedStages } from './lesson-player.js';
import { TEST_KINDS, activityInfo, validateMathPractice, validateMathWords, validateTests } from './lib/activities.js';
import { chapterFor, validateChapters } from './lib/chapters.js';
import { missCounts, mountActivity, runFor } from './activity-player.js';
import { mountTimesPractice } from './times-practice.js';
import { testsView } from './views/tests.js';
import { validatePacket } from './lib/homework.js';
import { SECTIONS, SECTION_IDS, sectionLabel } from './sections.js';
import { weekView } from './views/week.js';
import { spellingView } from './views/spelling.js';
import { vocabView } from './views/vocab.js';
import { mathView } from './views/math.js';
import { skillsView } from './views/skills.js';
import { homeworkView } from './views/homework.js';
import { newsletterView } from './views/newsletter.js';

const VIEWS = {
  week: weekView, spelling: spellingView, vocab: vocabView, math: mathView,
  skills: skillsView, homework: homeworkView, newsletter: newsletterView, tests: testsView,
};

const app = document.getElementById('app');
const select = document.getElementById('weekSelect');
const weekLabel = document.getElementById('weekLabel');
const nav = document.querySelector('nav.tabs');
const brand = document.querySelector('.brand');

let index = null;
let pictures = { photos: [], drawings: [] };
let renderCount = 0;
let mounted = null; // removes the lesson or activity controls of the previous page

async function start() {
  try {
    index = await loadIndex();
    const problems = validateIndex(index);
    if (problems.length) return showProblem('The list of weeks has a problem.', problems);
  } catch (e) {
    return showProblem('Study Scoop could not load its weekly information.', [String(e.message || e)]);
  }
  select.innerHTML = html`${index.weeks.map((w) => html`
    <option value="${w.id}">${w.label}${w.id === index.current ? ' (this week)' : ''}</option>`)}`.s;
  select.addEventListener('change', () => {
    const r = parseHash(location.hash, SECTION_IDS);
    // Math chapters do not change with the week (D26): a chapter menu, chapter page or lesson keeps its place.
    // Other subjects' activities belong to their week, so they go to the chosen week's menu.
    const keep = r.section === 'math' ? (r.lesson ? { lesson: r.lesson, stage: r.stage } : r.act ? { act: r.act } : r.ch ? { ch: r.ch } : {}) : {};
    location.hash = buildHash(r.section, select.value, index.current, keep);
  });
  // Which word pictures exist (so no page asks for a missing file). Pictures are optional: no list, no pictures.
  try { pictures = await loadJSON('data/pictures.json'); } catch { /* keep the empty list */ }
  window.addEventListener('hashchange', render);
  await render();
}

async function render() {
  const n = ++renderCount;
  const route = parseHash(location.hash, SECTION_IDS);
  const weekId = resolveWeek(route.week, index);
  // Lessons (Math only): the list, and the lesson named in the address. Unknown lessons fall back to the Math page.
  let lessons = null, lesson = null;
  // This Week also reads the chapter list, to recommend the week's chapter (D26).
  if (route.section === 'math' || route.section === 'week' || route.section === 'tests') {
    try {
      lessons = await loadJSON('data/lessons/index.json');
      if (validateLessonIndex(lessons).length || validateChapters(lessons).length) lessons = null;
    } catch { lessons = null; }
    if (route.section === 'math' && route.lesson && lessons?.lessons.some((l) => l.id === route.lesson)) {
      try { lesson = await loadJSON(`data/lessons/${route.lesson}.json`); } catch (e) {
        if (n === renderCount) showProblem('This lesson could not be loaded.', [String(e.message || e)]);
        return;
      }
      let lp;
      try { lp = validateLesson(lesson, route.lesson); } catch (e) { lp = [String(e.message || e)]; }
      if (lp.length) { if (n === renderCount) showProblem('This lesson has a problem.', lp); return; }
    }
  }
  // Math practice problems (Math > Practice Problems): one checked question bank for the topic, like the lessons.
  // Math is chapter-first (D26): the chapter named by the address (a chapter menu, one of its activities, or one of
  // its lessons) owns the content. Its teacher's words, tests and misses come from the chapter's own week.
  const chapter = route.section === 'math' ? chapterFor(lessons, { ch: route.ch, act: route.act, lesson: lesson?.id || null }) : null;
  let practice = null;
  if (route.section === 'math' && route.act && chapter?.id === 5) {
    try {
      practice = await loadJSON('data/practice/math.json');
      if (validateMathPractice(practice).length) practice = null;
    } catch { practice = null; }
  }
  // Topic 6: Area questions (Math > Topic 6: Area), checked against the week's teacher words before they are shown.
  let area = null;
  if ((route.section === 'math' && chapter?.id === 6) || route.section === 'tests') {
    try { area = await loadJSON('data/practice/area.json'); } catch { area = null; }
  }
  // Math Vocabulary questions (Math > Math Vocabulary and the Math Vocabulary practice test), checked like the lessons.
  let mathWords = null;
  if ((route.section === 'math' && route.act && chapter?.id === 5) || route.section === 'tests') {
    try {
      mathWords = await loadJSON('data/practice/math-words.json');
      if (validateMathWords(mathWords).length) mathWords = null;
    } catch { mathWords = null; }
  }
  // This week's homework packet (Homework only), listed in data/homework/index.json and checked like the lessons.
  let packet = null;
  if (route.section === 'homework') {
    try {
      const list = await loadJSON('data/homework/index.json');
      if (list.weeks?.includes(weekId)) {
        packet = await loadJSON(`data/homework/${weekId}.json`);
        if (validatePacket(packet, weekId).length) packet = null;
      }
    } catch { packet = null; }
  }
  // Practice tests written for this week (Tests only). data/tests/index.json lists the weeks that have them;
  // another week simply has no math or vocabulary test (the spelling test is made from the week's list).
  let tests = null, testsProblem = false;
  if (route.section === 'tests') {
    try {
      const list = await loadJSON('data/tests/index.json');
      if (list.weeks?.includes(weekId)) tests = await loadJSON(`data/tests/${weekId}.json`);
    } catch { testsProblem = true; }
  }
  // The chapter's week: its teacher's words and class test dates, and (for its Chapter Test) its practice tests.
  const chapterWeekId = chapter?.week && index.weeks.some((w) => w.id === chapter.week) ? chapter.week : null;
  let chapterWeek = null;
  if (chapterWeekId && chapterWeekId !== weekId) {
    try { chapterWeek = await loadWeek(chapterWeekId); if (validateWeek(chapterWeek, chapterWeekId).length) chapterWeek = null; } catch { chapterWeek = null; }
  }
  if (route.section === 'math' && chapterWeekId && activityInfo('math', route.act)?.test) {
    try {
      const list = await loadJSON('data/tests/index.json');
      if (list.weeks?.includes(chapterWeekId)) tests = await loadJSON(`data/tests/${chapterWeekId}.json`);
    } catch { testsProblem = true; }
  }
  if (n !== renderCount) return; // a newer navigation started while lessons were loading (keep its address)
  const stage = lesson ? (STAGE_IDS.includes(route.stage) ? route.stage : 'learn') : null;
  // An activity named in the address: a page to read (Learn My Words, a menu) or questions to answer (a run).
  // An earlier address (alias) opens the page that replaced it: "area" is the Chapter 6 menu, "lessons" the chapter list.
  let info = route.act ? activityInfo(route.section, route.act) : null;
  let chMenu = route.section === 'math' && !lesson && chapter && !info ? chapter.id : null;
  if (info?.alias) {
    if (typeof info.alias === 'string') info = activityInfo(route.section, info.alias);
    else { chMenu = info.chapter && chapter ? chapter.id : null; info = null; }
  }
  const act = info ? info.id : null;
  const testKind = route.test && TEST_KINDS.includes(route.test) ? route.test : null;
  let week;
  try {
    week = await loadWeek(weekId);
  } catch (e) {
    if (n === renderCount) showProblem('This week could not be loaded.', [String(e.message || e)]);
    return;
  }
  if (n !== renderCount) return; // a newer navigation started while this week was loading
  const problems = validateWeek(week, weekId);
  if (problems.length) return showProblem('This week\'s information has a problem.', problems);
  // Unit 5 (the multiplication properties) is not tied to one week: its teacher's words and class test date come
  // from the week that announced them (lessons/index.json "teacherWeek"), so a later topic such as Area never
  // hides them and an earlier week still shows them.
  let unit5Week = hasPropertyWords(week) ? week : null;
  if (!unit5Week && route.section === 'math') {
    let teacherWeek = lessons?.teacherWeek;
    if (!teacherWeek) { try { teacherWeek = (await loadJSON('data/lessons/index.json')).teacherWeek; } catch { teacherWeek = null; } }
    if (teacherWeek && index.weeks.some((w) => w.id === teacherWeek)) {
      try { const tw = await loadWeek(teacherWeek); if (!validateWeek(tw, teacherWeek).length && hasPropertyWords(tw)) unit5Week = tw; } catch { /* show the definitions only */ }
    }
    if (n !== renderCount) return;
  }
  // In Math, a chapter's activities use the chapter's own week (Chapter 6 keeps its Nov 3 words when an earlier
  // week is chosen); the week picker, the header and every link keep the week the child chose.
  const content = route.section === 'math' && chapterWeekId ? (chapterWeekId === weekId ? week : chapterWeek || week) : week;
  const contentId = content.id || weekId;
  // Reuse the chapter's Area bank in later Area weeks only when its content and exact teacher definitions validate.
  if (area && validateArea(area, content).length) area = null;
  if (tests) {
    let tp;
    try { tp = validateTests(tests, content); } catch (e) { tp = [String(e.message || e)]; }
    if (tp.length) { tests = null; testsProblem = true; }
  }

  const entry = index.weeks.find((w) => w.id === weekId);
  select.value = weekId;
  weekLabel.textContent = `3rd grade · ${entry.label}`;
  brand.href = buildHash('week', weekId, index.current);
  for (const a of nav.querySelectorAll('a[data-tab]')) {
    a.href = buildHash(a.dataset.tab, weekId, index.current);
    if (a.dataset.tab === route.section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }

  const ctx = {
    week: content, shownWeek: week, unit5Week: unit5Week || week, index, weekId: contentId, shownWeekId: weekId, section: route.section, isCurrent: weekId === index.current, today: new Date(),
    chapter, chapterMenu: chMenu, chapterLink: (id) => buildHash('math', weekId, index.current, { ch: id }),
    link: (section, id = weekId) => buildHash(section, id, index.current),
    lessonLink: (id, st) => buildHash('math', weekId, index.current, { lesson: id, stage: st }),
    pictures, lessons, lesson, stage, lessonState: lesson ? stateFor(lesson.id, stage) : null,
    lessonVisited: lesson ? visitedStages(lesson.id) : null,
    actLink: (subject, a) => buildHash(subject, weekId, index.current, { act: a }),
    testLink: (kind) => buildHash('tests', weekId, index.current, { test: kind }),
    tests, testsProblem, misses: missCounts(contentId), practice, mathWords, area, packet, page: info?.page ? act : null,
    mathWeekId: lessons?.chapters?.find((c) => c.id === week.mathChapter)?.week || contentId,
  };
  ctx.run = act && !info.page ? runFor(ctx, route.section, act) : testKind ? runFor(ctx, 'tests', testKind) : null;
  // Fix unknown sections, weeks, activities and tests in the address without adding a history entry.
  const canonical = buildHash(route.section, weekId, index.current, lesson ? { lesson: lesson.id, stage }
    : ctx.run ? (ctx.run.mode === 'test' && route.section === 'tests' ? { test: testKind } : { act }) : ctx.page ? { act } : chMenu ? { ch: chMenu } : {});
  if (location.hash && location.hash !== canonical) history.replaceState(null, '', canonical);
  mounted?.abort();
  mounted = null;
  document.body.dataset.section = route.section;
  document.body.classList.toggle('in-lesson', Boolean(lesson));
  document.body.classList.toggle('in-activity', Boolean(ctx.run));
  app.innerHTML = VIEWS[route.section](ctx).s;
  document.title = lesson
    ? `${stageLabel(stage)} · Lesson ${lesson.id}: ${lesson.title} · Study Scoop`
    : ctx.run ? `${ctx.run.title} · ${sectionLabel(route.section)} · Study Scoop`
      : ctx.page ? `${info.label} · ${sectionLabel(route.section)} · Study Scoop` : `${sectionLabel(route.section)} · Study Scoop`;
  if (lesson || ctx.run) {
    mounted = new AbortController();
    (lesson ? mountLesson : mountActivity)(app, ctx, mounted.signal);
  } else if (ctx.page || route.section === 'newsletter') {
    // Pages to read only need their Print button (the Study Guides) and, on the Newsletter, Zoom in.
    mounted = new AbortController();
    app.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="print"]')) window.print();
      const z = e.target.closest('[data-act="zoom"]');
      if (z) {
        const on = z.getAttribute('aria-pressed') !== 'true';
        z.setAttribute('aria-pressed', String(on));
        z.textContent = on ? 'Zoom out' : 'Zoom in';
        app.querySelector('.flyer')?.classList.toggle('zoomed', on);
      }
    }, { signal: mounted.signal });
    mountReadButtons(app, mounted.signal);
    if (ctx.page === 'timespick') mountTimesPractice(app, mounted.signal);
  }

  // Word pictures are optional: drop the frame when a picture file does not exist.
  for (const img of app.querySelectorAll('img[data-optional]')) {
    img.addEventListener('error', () => img.closest('.pic')?.remove(), { once: true });
  }
  // After a navigation, move keyboard and screen-reader focus to the new content (not on first load,
  // and not while the week picker is being used).
  if (n > 1 && document.activeElement !== select) {
    const below = lesson || ctx.run || ctx.page || window.innerWidth < 700;
    window.scrollTo(0, below ? Math.max(0, app.getBoundingClientRect().top + window.scrollY - 8) : 0);
    // In a lesson, land on the stage heading; elsewhere on the page content.
    (lesson || ctx.run ? app.querySelector('#stage-h') || app : app.querySelector('h1[tabindex]') || app).focus({ preventScroll: true });
  }
  app.dataset.ready = String(n);
}

function showProblem(message, details) {
  // The old page's controls (e.g. a test's "Leave the test?" check) must not outlive it.
  mounted?.abort();
  mounted = null;
  app.innerHTML = html`
    <div class="card problem" role="alert">
      <h1>Sorry!</h1>
      <p>${message} Please try again later.</p>
      <details><summary>Details for grown-ups</summary><ul>${details.map((d) => html`<li>${d}</li>`)}</ul></details>
    </div>`.s;
  app.dataset.ready = 'problem';
}

// "Skip to main content" moves focus without changing the address (the address is the route).
document.querySelector('.skip').addEventListener('click', (e) => {
  e.preventDefault();
  app.focus();
});

// The navigation links are written in index.html; check they match the section list.
if (nav.querySelectorAll('a[data-tab]').length !== SECTIONS.length) console.warn('Navigation does not match SECTIONS');
start();
