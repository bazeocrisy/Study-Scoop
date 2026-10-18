import { html } from '../lib/html.js';
import { formatLongDate } from '../lib/dates.js';
import { pageHead } from './common.js';
import { homeworkList, learningList } from './week.js';

export function newsletterView(ctx) {
  const { week, index } = ctx;
  return html`
    ${pageHead('Newsletter', ctx)}

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
