import { html } from '../lib/html.js';

/** Page heading shared by every section: the section name and the week being shown. */
export function pageHead(title, ctx, intro) {
  return html`
    <div class="page-head">
      <h1>${title}</h1>
      <p class="week-of">${ctx.week.label}</p>
      ${intro ? html`<p class="intro">${intro}</p>` : ''}
    </div>
    ${ctx.isCurrent ? '' : html`
      <p class="notice" role="note">You are looking at an earlier week.
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

export function slug(text) {
  return 'h-' + String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
