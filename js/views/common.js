import { html } from '../lib/html.js';
import { pictureName } from '../lib/data.js';

/** Page heading shared by every section: the section name and the week being shown. */
export function pageHead(title, ctx, intro, actions) {
  return html`
    <div class="page-head">
      <h1>${title}</h1>
      <p class="week-of">${ctx.week.label}</p>
      ${intro ? html`<p class="intro">${intro}</p>` : ''}
      ${actions ? html`<div class="btn-row">${actions}</div>` : ''}
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
