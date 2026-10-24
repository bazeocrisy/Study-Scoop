import { html } from '../lib/html.js';
import { countdownLabel, daysUntil, formatLongDate } from '../lib/dates.js';
import { TEST_SECTION, sectionLabel } from '../sections.js';
import { pageHead } from './common.js';
import { isAreaWeek } from '../lib/area.js';

export function weekView(ctx) {
  const { week } = ctx;
  const tests = [...week.tests].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return html`
    ${pageHead('This Week', ctx)}

    <section aria-labelledby="h-tests">
      <h2 id="h-tests">Quizzes and tests</h2>
      ${tests.length ? html`
        <ul class="cards tests">
          ${tests.map((t) => {
            const days = daysUntil(t.date, ctx.today);
            const section = TEST_SECTION[t.kind];
            // In the Area week, "Study" opens Topic 6: Area directly.
            const study = t.kind === 'math' && isAreaWeek(week) ? ctx.actLink('math', 'area') : section ? ctx.link(section) : null;
            return html`
              <li class="card test test-${t.kind}">
                <p class="count${days !== null && days < 0 ? ' past' : ''}">${countdownLabel(days)}</p>
                <h3>${t.title}</h3>
                <p class="date">${formatLongDate(t.date)}</p>
                ${t.detail ? html`<p>${t.detail}</p>` : ''}
                <p class="links">${section ? html`<a class="action" href="${study}">Study in ${sectionLabel(section)}</a>` : ''}
                  <a class="action" href="${ctx.link('tests')}">Practice test</a></p>
              </li>`;
          })}
        </ul>` : html`<p class="card">No quizzes or tests are listed for this week.</p>`}
    </section>

    <div class="two-col">
      <section class="card" aria-labelledby="h-learning">
        <h2 id="h-learning">What we're learning</h2>
        ${learningList(week.learning)}
      </section>

      <section class="card" aria-labelledby="h-dates">
        <h2 id="h-dates">Dates to know</h2>
        ${week.events.length ? html`
          <ul class="dates">${week.events.map((e) => html`<li><span class="when">${e.date}</span> ${e.text}</li>`)}</ul>`
          : html`<p>No events are listed for this week.</p>`}
      </section>
    </div>

    <section class="card" aria-labelledby="h-homework">
      <h2 id="h-homework">Homework</h2>
      ${homeworkList(week.homework)}
      <p class="links">
        <a class="action" href="${ctx.link('homework')}">Open Homework</a>
        <a class="action" href="${ctx.link('newsletter')}">Read the newsletter</a>
      </p>
    </section>`;
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
