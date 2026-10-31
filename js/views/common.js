import { html, raw } from '../lib/html.js';
import { pictureName } from '../lib/data.js';

const weekTiming = (ctx) => (ctx.shownWeekId || ctx.weekId) > ctx.index.current ? 'an upcoming' : 'an earlier';

/** Page heading shared by every section: the section name and the week being shown. */
export function pageHead(title, ctx, intro, actions) {
  return html`
    <div class="page-head">
      <h1 tabindex="-1">${title}</h1>
      <p class="week-of">${(ctx.shownWeek || ctx.week).label}</p>
      ${intro ? html`<p class="intro">${intro}</p>` : ''}
      ${actions ? html`<div class="btn-row">${actions}</div>` : ''}
    </div>
    ${ctx.isCurrent ? '' : html`
      <p class="notice" role="note">You are looking at ${weekTiming(ctx)} week.
        <a href="${ctx.link(ctx.section, ctx.index.current)}">Go to this week</a></p>`}`;
}

/** A clearly marked placeholder for an activity that has not been built yet (no fake controls). */
export function comingSoon(title, items, { level = 2 } = {}) {
  const heading = level === 3
    ? html`<h3 id="${slug(title)}">${title}</h3>`
    : html`<h2 id="${slug(title)}">${title}</h2>`;
  return html`
    <section class="soon" aria-labelledby="${slug(title)}">
      <div class="soon-head">
        ${heading}
        <span class="soon-badge">Coming soon</span>
      </div>
      ${items && items.length ? html`<ul class="soon-list">${items.map((i) => html`<li>${i}</li>`)}</ul>` : ''}
    </section>`;
}

/**
 * The picture for a word: the owner-approved study card (WebP) when there is one, otherwise the drawing (SVG),
 * otherwise nothing. data/pictures.json says which files exist, so no page asks for a missing file.
 * `names` are tried in order (e.g. a spelling word, then the drawing it shares).
 */
export function wordPicture(ctx, names, alt) {
  const p = ctx.pictures || {};
  const list = (Array.isArray(names) ? names : [names]).filter(Boolean).map(pictureName);
  const photo = list.find((n) => p.photos?.includes(n));
  const drawing = list.find((n) => p.drawings?.includes(n));
  const src = photo ? `images/words/${photo}.webp` : drawing ? `images/words/${drawing}.svg` : null;
  if (!src) return '';
  return html`<span class="pic"><img src="${src}" alt="${alt}" width="400" height="400" decoding="async" data-optional></span>`;
}

export function slug(text) {
  return 'h-' + String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------- menu-first navigation (DECISIONS D19)

const svg = (paths) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${raw(paths)}</svg>`;
/** Small pictures for the activity cards (decoration only; the card's words say what it is). */
export const ICONS = {
  book: svg('<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>'),
  cards: svg('<rect x="7" y="3" width="13" height="16" rx="2"/><path d="M4 7v12a2 2 0 0 0 2 2h10"/>'),
  puzzle: svg('<rect x="3" y="8" width="5" height="8" rx="1"/><rect x="9.5" y="8" width="5" height="8" rx="1" stroke-dasharray="2 2"/><rect x="16" y="8" width="5" height="8" rx="1"/>'),
  ear: svg('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'),
  redo: svg('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>'),
  choice: svg('<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="12" r="2.2" fill="currentColor"/><circle cx="6" cy="18" r="2.2"/><path d="M11 6h9M11 12h9M11 18h9"/>'),
  truefalse: svg('<path d="M3 12.5l3.5 3.5L13 8.5"/><path d="M15 9l6 6M21 9l-6 6"/>'),
  pencil: svg('<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/>'),
  steps: svg('<path d="M4 20h5v-5h5v-5h5V5"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/>'),
  list: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3"/>'),
  grid: svg('<circle cx="6" cy="6" r="1.6" fill="currentColor"/><circle cx="12" cy="6" r="1.6" fill="currentColor"/><circle cx="18" cy="6" r="1.6" fill="currentColor"/><path d="M3 10h18" stroke-dasharray="2.5 2"/><circle cx="6" cy="14" r="1.6" fill="currentColor"/><circle cx="12" cy="14" r="1.6" fill="currentColor"/><circle cx="18" cy="14" r="1.6" fill="currentColor"/><circle cx="6" cy="19" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/><circle cx="18" cy="19" r="1.6" fill="currentColor"/>'),
  mix: svg('<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4"/><path d="M19 5l2 2-2 2M19 15l2 2-2 2"/>'),
  home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
};

/** "Home > Math > Practice Problems": where the child is. The last step is the page itself (not a link). */
export function crumbs(ctx, trail) {
  const all = [{ label: 'Home', href: ctx.link('week') }, ...trail];
  return html`<nav class="crumbs" aria-label="You are here"><ol>${all.map((c, k) => (k === all.length - 1
    ? html`<li><span aria-current="page">${c.label}</span></li>`
    : html`<li><a href="${c.href}">${c.label}</a></li>`))}</ol></nav>`;
}

/** The title bar of every page below a subject menu: where you are, the title, and Back and Home buttons. */
export function subBar(ctx, { tone, trail, title, goal, eyebrow, back = [] }) {
  return html`
    <div class="lesson-bar act-bar subject-${tone}">
      <div class="lb-title">
        ${crumbs(ctx, trail)}
        ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
        <h1 tabindex="-1">${title}</h1>
        ${goal ? html`<p class="goal">${goal}</p>` : ''}
      </div>
      <p class="bar-btns">
        ${back.map((b) => html`<a class="btn back" href="${b.href}" data-leave>${b.label}</a>`)}
        <a class="btn home" href="${ctx.link('week')}" data-leave>${ICONS.home}<span>Home</span></a>
      </p>
    </div>
    ${ctx.isCurrent ? '' : html`<p class="notice" role="note">You are looking at ${weekTiming(ctx)} week.</p>`}`;
}

/** A subject menu: "What would you like to do?" and one big card per activity (the whole card is the link). */
export function subjectMenu(ctx, subject, items, { misses = 0 } = {}) {
  return html`
    <ul class="menu-grid subject-${subject} count-${items.length}">
      ${items.map((a) => html`
        <li><a class="menu-card${a.misses ? ' misses' : ''}" href="${ctx.actLink(subject, a.id)}">
          <span class="mc-icon">${ICONS[a.icon] || ''}</span>
          <span class="mc-text">${a.start ? html`<span class="start-here">Start here</span>` : ''}<span class="mc-title">${a.label}${a.misses && misses ? html` <span class="count-badge">${misses}<span class="sr-only"> to practice</span></span>` : ''}</span>
            <span class="mc-about">${a.about}</span></span>
          <span class="mc-go" aria-hidden="true">›</span>
        </a></li>`)}
    </ul>`;
}

/** The first screen of Spelling, Vocabulary and Math. */
export function menuPage(ctx, subject, { title, context, items, misses, after = '' }) {
  return html`
    <div class="page-head menu-head subject-${subject}">
      ${crumbs(ctx, [{ label: title }])}
      <h1 tabindex="-1">${title}</h1>
      <p class="week-of">${(ctx.shownWeek || ctx.week).label}</p>
      ${context ? html`<p class="intro">${context}</p>` : ''}
    </div>
    ${ctx.isCurrent ? '' : html`
      <p class="notice" role="note">You are looking at ${weekTiming(ctx)} week.
        <a href="${ctx.link(ctx.section, ctx.index.current)}">Go to this week</a></p>`}
    <section class="menu" aria-labelledby="h-menu">
      <h2 id="h-menu" class="ask">What would you like to do?</h2>
      ${subjectMenu(ctx, subject, items, { misses })}
    </section>
    ${after}`;
}

/** Where the weekly tests are (they stay in Tests, apart from practice). */
export const testsNote = (ctx, what) => html`<p class="hint menu-foot">${what} is in <a href="${ctx.link('tests')}">Tests</a>.</p>`;

/** Keeps each written fact such as "(3 × 7)" or "6 × 7 = 42" on one line. */
export const facts = (text) => String(text).split(/(\(?\d+ × \d+\)?(?: = \d+)?)/).map((p, k) => (k % 2 ? html`<span class="nobr">${p}</span>` : p));

/** "18 out of 20 right on the first try (90%)", then how many were answered and missed: every results screen. */
export function scoreLine(right, total, answered, firstTry = true) {
  const pct = total ? Math.round((right / total) * 100) : 0;
  return html`<p class="summary-score">${right} out of ${total} right${firstTry ? ' on the first try' : ''} <span class="pct">(${pct}%)</span></p>
    <p class="score-facts"><span>Answered: ${answered} of ${total}</span> · <span>Missed: ${total - right}</span></p>`;
}
