import { html } from '../lib/html.js';
import { launcherHead, launcherCard } from './paths.js';

/** Schoolwork is a chooser. Weekly details live in Newsletter and the subject pages. */
export function weekView(ctx) {
  const items = [
    ['homework', 'Homework', 'Reading and math assignments'],
    ['spelling', 'Spelling', 'Spell this week’s words'],
    ['vocab', 'Vocabulary', 'Learn what the words mean'],
    ['math', 'Math', 'Lessons and chapter practice'],
    ['newsletter', 'Newsletter', 'School news, dates, and the flyer'],
    ['tests', 'Practice Tests', 'Check what you know'],
  ];
  return html`${launcherHead(ctx, 'Schoolwork', { weekly: true })}
    <ul class="path-grid launcher-cards schoolwork-cards" aria-label="Choose your schoolwork">
      ${items.map(([id, title, about]) => launcherCard(ctx, id, title, about))}
    </ul>`;
}

export function learningList(learning) {
  return learning.length
    ? html`<dl class="learning">${learning.map(([subject, topic]) => html`<div><dt>${subject}</dt><dd>${topic}</dd></div>`)}</dl>`
    : html`<p>Nothing is listed for this week.</p>`;
}

export function homeworkList(homework) {
  return homework.length
    ? html`<ul class="plain">${homework.map((h) => html`<li><strong>${h.title}</strong> <span class="due">${h.due}</span></li>`)}</ul>`
    : html`<p>No homework is listed for this week.</p>`;
}
