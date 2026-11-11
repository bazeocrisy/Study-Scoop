import { html } from '../lib/html.js';

const card = (ctx, id, title, about, action) => html`<li><a class="path-card" data-path="${id}" href="${ctx.link(id)}"><h2>${title}</h2><p>${about}</p><span>${action} ›</span></a></li>`;

export function homeView(ctx) {
  return html`<div class="page-head section-head path-head"><h1 tabindex="-1">What would you like to work on?</h1><p class="intro">Choose a path to get started.</p></div>
  <ul class="path-grid home-paths" aria-label="Choose your learning path">
    ${card(ctx, 'week', 'Schoolwork', 'Your weekly homework, spelling, vocabulary, math, and school information.', 'Open Schoolwork')}
    ${card(ctx, 'extra', 'Extra Learning', 'Read extra passages, practice understanding, and build other skills.', 'Open Extra Learning')}
  </ul>`;
}

export function extraView(ctx) {
  return html`${launcherHead(ctx, 'Extra Learning')}
    <ul class="path-grid launcher-cards extra-cards" aria-label="Choose extra learning">
      ${launcherCard(ctx, 'reading', 'Reading Practice', 'Read, listen, and understand')}
      ${launcherCard(ctx, 'skills', 'Skill Builders', 'Build math and number skills')}
    </ul>`;
}

/** Compact landing headings do not repeat Home or another page title. */
export function launcherHead(ctx, title, { weekly = false } = {}) {
  const week = ctx.shownWeek || ctx.week;
  const timing = (ctx.shownWeekId || ctx.weekId) > ctx.index.current ? 'an upcoming' : 'an earlier';
  return html`<header class="launcher-head section-head">
    <h1 tabindex="-1">${title}</h1>
    <a class="btn launcher-home" href="${ctx.link('home')}">‹ Back to Home</a>
    ${weekly ? html`<p class="week-of">${week.label}</p>` : ''}
  </header>
  ${weekly && !ctx.isCurrent ? html`<p class="notice" role="note">You are looking at ${timing} week. <a href="${ctx.link(ctx.section, ctx.index.current)}">Go to this week</a></p>` : ''}`;
}

export function launcherCard(ctx, id, title, about) {
  return html`<li><a class="path-card" data-path="${id}" href="${ctx.link(id)}">
    <h2>${title}</h2><p>${about}</p><span class="path-arrow" aria-hidden="true">›</span>
  </a></li>`;
}

/** A return route, never a second activity chooser. Deeper screens have their own Back/Home bar. */
export function pathControls(ctx) {
  if (['home', 'week', 'extra'].includes(ctx.section) || ctx.lesson || ctx.run || ctx.page || ctx.chapterMenu || ctx.reading?.story) return html``;
  const extra = ['extra', 'reading', 'skills'].includes(ctx.section);
  const landing = ctx.section === 'week' || ctx.section === 'extra';
  return html`<nav class="path-controls" aria-label="Go back">
    <a class="btn" href="${ctx.link('home')}">${landing ? '‹ Back to Home' : '‹ Home'}</a>
    ${landing ? '' : html`<a class="btn" href="${ctx.link(extra ? 'extra' : 'week')}">‹ Back to ${extra ? 'Extra Learning' : 'Schoolwork'}</a>`}
  </nav>`;
}
