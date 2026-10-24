import { html } from '../lib/html.js';
import { formatLongDate } from '../lib/dates.js';
import { pageHead } from './common.js';
import { homeworkList, learningList } from './week.js';

export function newsletterView(ctx) {
  const { week, index } = ctx;
  return html`
    ${pageHead('Newsletter', ctx, 'The original flyer from school (for grown-ups), then the same week in short.')}
    ${flyerSection(ctx, week)}
    <h2 class="guide-part">This week in short</h2>

    <div class="two-col">
      <section class="card" aria-labelledby="h-nl-learning">
        <h2 id="h-nl-learning">What we're learning</h2>
        ${learningList(week.learning)}
      </section>

      <section class="card" aria-labelledby="h-nl-tests">
        <h2 id="h-nl-tests">Quizzes and tests</h2>
        ${week.tests.length ? html`
          <ul class="dates">${week.tests.map((t) => html`
            <li><span class="when">${formatLongDate(t.date)}</span> ${t.title}${t.detail ? html` (${t.detail})` : ''}</li>`)}</ul>`
          : html`<p>No quizzes or tests are listed for this week.</p>`}
      </section>

      <section class="card" aria-labelledby="h-nl-dates">
        <h2 id="h-nl-dates">Announcements</h2>
        ${week.events.length ? html`
          <ul class="dates">${week.events.map((e) => html`<li><span class="when">${e.date}</span> ${e.text}</li>`)}</ul>`
          : html`<p>No announcements this week.</p>`}
      </section>

      <section class="card" aria-labelledby="h-nl-homework">
        <h2 id="h-nl-homework">Homework</h2>
        ${homeworkList(week.homework)}
      </section>

      <section class="card nl-spelling" aria-labelledby="h-nl-spelling">
        <h2 id="h-nl-spelling">Spelling words: ${week.spelling.pattern}</h2>
        <ol class="spelling-list">${week.spelling.words.map((w) => html`<li>${w.word}</li>`)}</ol>
      </section>
    </div>

    <section class="card" aria-labelledby="h-archive">
      <h2 id="h-archive">All weeks</h2>
      <ul class="archive">
        ${index.weeks.map((w) => html`
          <li><a href="${ctx.link('newsletter', w.id)}"${w.id === ctx.weekId ? html` aria-current="true"` : ''}>${w.label}</a>${w.id === index.current ? ' (this week)' : ''}</li>`)}
      </ul>
    </section>`;
}

/** The original newsletter flyer (D26): shown only when the week lists a privacy-reviewed flyer; otherwise a clear note. */
export function flyerSection(ctx, week) {
  const f = week.flyer;
  if (!f?.reviewed || !f.pages?.length) {
    return html`<section class="card flyer flyer-missing" id="flyer" aria-labelledby="h-flyer">
      <h2 id="h-flyer">Original newsletter</h2>
      <p>The original flyer for ${week.label.replace(/^Week of /, '')} is not available on Study Scoop. Everything from it is listed below.</p>
    </section>`;
  }
  return html`<section class="card flyer" id="flyer" aria-labelledby="h-flyer">
    <div class="instruct-head"><h2 id="h-flyer">Original newsletter</h2>
      <span class="btn-row no-print"><button type="button" class="btn" data-act="zoom" aria-pressed="false">Zoom in</button>
      <button type="button" class="btn" data-act="print">Print the newsletter</button></span></div>
    <p class="hint no-print">The flyer sent home from school, ${f.pages.length === 1 ? 'one page' : `${f.pages.length} pages`}. Open a page to see it full size.</p>
    <div class="flyer-pages">
      ${f.pages.map((pg) => html`<figure class="flyer-page">
        <div class="flyer-scroll" tabindex="0" role="region" aria-label="${pg.label}"><img src="${pg.src}" alt="${pg.alt}" width="${pg.width}" height="${pg.height}" loading="lazy" decoding="async"></div>
        <figcaption>${pg.label} <a class="no-print" href="${pg.src}" target="_blank" rel="noopener">Open full size<span class="sr-only"> (${pg.label}, opens in a new tab)</span></a></figcaption>
      </figure>`)}
    </div>
  </section>`;
}
