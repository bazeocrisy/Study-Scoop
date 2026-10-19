// Study Scoop: one-page app. Reads data/weeks.json and data/<week>.json and shows one of eight sections.
// Nothing is stored: no localStorage, cookies, accounts or analytics. The chosen week lives in the address.

import { html } from './lib/html.js';
import { loadIndex, loadJSON, loadWeek } from './lib/data.js';
import { buildHash, parseHash, resolveWeek } from './lib/router.js';
import { validateIndex, validateWeek } from './lib/validate.js';
import { STAGE_IDS, stageLabel, validateLesson, validateLessonIndex } from './lib/lessons.js';
import { mountLesson, stateFor, visitedStages } from './lesson-player.js';
import { TEST_KINDS, activityInfo, validateMathPractice, validateMathWords, validateTests } from './lib/activities.js';
import { missCounts, mountActivity, runFor } from './activity-player.js';
import { testsView } from './views/tests.js';
import { SECTIONS, SECTION_IDS, sectionLabel } from './sections.js';
import { weekView } from './views/week.js';
import { spellingView } from './views/spelling.js';
import { vocabView } from './views/vocab.js';
import { mathView } from './views/math.js';
import { quickmathView } from './views/quickmath.js';
import { homeworkView } from './views/homework.js';
import { newsletterView } from './views/newsletter.js';

const VIEWS = {
  week: weekView, spelling: spellingView, vocab: vocabView, math: mathView,
  quickmath: quickmathView, homework: homeworkView, newsletter: newsletterView, tests: testsView,
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
    location.hash = buildHash(parseHash(location.hash, SECTION_IDS).section, select.value, index.current);
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
  if (route.section === 'math') {
    try {
      lessons = await loadJSON('data/lessons/index.json');
      if (validateLessonIndex(lessons).length) lessons = null;
    } catch { lessons = null; }
    if (route.lesson && lessons?.lessons.some((l) => l.id === route.lesson)) {
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
  let practice = null;
  if (route.section === 'math' && route.act) {
    try {
      practice = await loadJSON('data/practice/math.json');
      if (validateMathPractice(practice).length) practice = null;
    } catch { practice = null; }
  }
  // Math Vocabulary questions (Math > Math Vocabulary and the Math Vocabulary practice test), checked like the lessons.
  let mathWords = null;
  if ((route.section === 'math' && route.act) || route.section === 'tests') {
    try {
      mathWords = await loadJSON('data/practice/math-words.json');
      if (validateMathWords(mathWords).length) mathWords = null;
    } catch { mathWords = null; }
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
  if (n !== renderCount) return; // a newer navigation started while lessons were loading (keep its address)
  const stage = lesson ? (STAGE_IDS.includes(route.stage) ? route.stage : 'learn') : null;
  // An activity named in the address: a page to read (Learn My Words, a menu) or questions to answer (a run).
  const info = route.act ? activityInfo(route.section, route.act) : null;
  const act = info ? route.act : null;
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
  if (tests) {
    let tp;
    try { tp = validateTests(tests, week); } catch (e) { tp = [String(e.message || e)]; }
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
    week, index, weekId, section: route.section, isCurrent: weekId === index.current, today: new Date(),
    link: (section, id = weekId) => buildHash(section, id, index.current),
    lessonLink: (id, st) => buildHash('math', weekId, index.current, { lesson: id, stage: st }),
    pictures, lessons, lesson, stage, lessonState: lesson ? stateFor(lesson.id, stage) : null,
    lessonVisited: lesson ? visitedStages(lesson.id) : null,
    actLink: (subject, a) => buildHash(subject, weekId, index.current, { act: a }),
    testLink: (kind) => buildHash('tests', weekId, index.current, { test: kind }),
    tests, testsProblem, misses: missCounts(weekId), practice, mathWords, page: info?.page ? act : null,
  };
  ctx.run = act && !info.page ? runFor(ctx, route.section, act) : testKind ? runFor(ctx, 'tests', testKind) : null;
  // Fix unknown sections, weeks, activities and tests in the address without adding a history entry.
  const canonical = buildHash(route.section, weekId, index.current, lesson ? { lesson: lesson.id, stage }
    : ctx.run ? (ctx.run.mode === 'test' ? { test: testKind } : { act }) : ctx.page ? { act } : {});
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
  } else if (ctx.page) {
    // Pages to read only need their Print button (the Study Guide).
    mounted = new AbortController();
    app.addEventListener('click', (e) => { if (e.target.closest('[data-act="print"]')) window.print(); }, { signal: mounted.signal });
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
