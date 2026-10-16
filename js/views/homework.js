import { html } from '../lib/html.js';
import { pageHead } from './common.js';

export function homeworkView(ctx) {
  const items = ctx.week.homework;
  return html`
    ${pageHead('Homework', ctx)}

    <section class="card" aria-labelledby="h-due">
      <h2 id="h-due">This week's homework</h2>
      ${items.length ? html`
        <ul class="checklist">
          ${items.map((h, i) => html`
            <li><label for="hw-${i}"><input type="checkbox" id="hw-${i}">
              <span><strong>${h.title}</strong> <span class="due">${h.due}</span></span></label></li>`)}
        </ul>
        <p class="hint">Checkmarks are not saved. They clear when you leave this page.</p>`
        : html`<p>No homework is listed for this week.</p>`}
    </section>

    <section class="card" aria-labelledby="h-practice">
      <h2 id="h-practice">Practice for this week</h2>
      <p class="links">
        <a class="action" href="${ctx.link('spelling')}">Spelling words</a>
        <a class="action" href="${ctx.link('vocab')}">Vocabulary words</a>
        <a class="action" href="${ctx.link('math')}">Math</a>
      </p>
    </section>

    <p class="card note">Weekly assignment details are added after the homework packet goes home on Monday.</p>`;
}
