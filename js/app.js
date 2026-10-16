// Study Scoop: one-page app. Reads data/weeks.json and data/<week>.json and shows one of seven sections.
// Nothing is stored: no localStorage, cookies, accounts or analytics. The chosen week lives in the address.

import { html } from './lib/html.js';
import { loadIndex, loadWeek } from './lib/data.js';
import { buildHash, parseHash, resolveWeek } from './lib/router.js';
import { validateIndex, validateWeek } from './lib/validate.js';
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
  quickmath: quickmathView, homework: homeworkView, newsletter: newsletterView,
};

const app = document.getElementById('app');
const select = document.getElementById('weekSelect');
const weekLabel = document.getElementById('weekLabel');
const nav = document.querySelector('nav.tabs');
const brand = document.querySelector('.brand');

let index = null;
let renderCount = 0;

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
  window.addEventListener('hashchange', render);
  await render();
}

async function render() {
  const n = ++renderCount;
  const route = parseHash(location.hash, SECTION_IDS);
  const weekId = resolveWeek(route.week, index);
  const canonical = buildHash(route.section, weekId, index.current);
  // Fix unknown sections and unknown weeks in the address without adding a history entry.
  if (location.hash && location.hash !== canonical) {
    history.replaceState(null, '', canonical);
  }

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
  };
  app.innerHTML = VIEWS[route.section](ctx).s;
  document.title = `${sectionLabel(route.section)} · Study Scoop`;

  // Word pictures are optional: drop the frame when a picture file does not exist.
  for (const img of app.querySelectorAll('img[data-optional]')) {
    img.addEventListener('error', () => img.closest('.pic')?.remove(), { once: true });
  }
  // After a navigation, move keyboard and screen-reader focus to the new content (not on first load,
  // and not while the week picker is being used).
  if (n > 1 && document.activeElement !== select) {
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  app.dataset.ready = String(n);
}

function showProblem(message, details) {
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
