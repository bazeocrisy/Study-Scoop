import { html } from '../lib/html.js';
import { crumbs } from './common.js';

const card = (ctx, id, title, about, action) => html`<li><a class="path-card" href="${ctx.link(id)}"><h2>${title}</h2><p>${about}</p><span>${action} ›</span></a></li>`;

export function homeView(ctx) {
  return html`<div class="page-head section-head path-head"><h1 tabindex="-1">What would you like to work on?</h1><p class="intro">Choose a path to get started.</p></div>
  <ul class="path-grid home-paths" aria-label="Choose your learning path">
    ${card(ctx, 'week', 'Schoolwork', 'Your weekly homework, spelling, vocabulary, math, and school information.', 'Open Schoolwork')}
    ${card(ctx, 'extra', 'Extra Learning', 'Read extra passages, practice understanding, and build other skills.', 'Open Extra Learning')}
  </ul>`;
}

export function extraView(ctx) {
  return html`<div class="page-head section-head path-head">${crumbs(ctx, [{ label: 'Extra Learning' }])}<h1 tabindex="-1">Extra Learning</h1><p class="intro">Choose some extra practice. Come back whenever you want.</p></div>
  <ul class="path-grid" aria-label="Extra learning activities">
    ${card(ctx, 'reading', 'Reading Practice', 'Listen to a passage, get help with words, read it yourself, and answer questions about its meaning.', 'Choose a passage')}
    ${card(ctx, 'skills', 'Skill Builders', 'Practice math facts, number skills, and more.', 'Choose a skill')}
  </ul>`;
}
