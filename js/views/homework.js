import { html } from '../lib/html.js';
import { pageHead } from './common.js';
import { activityView } from './activity.js';

// Where each homework entry came from (DECISIONS D18). Nothing is shown as received unless it was.
const SOURCE = {
  received: { label: 'Received from class', note: 'The worksheet itself is kept private and is not shown on this website.' },
  newsletter: { label: 'Listed in the newsletter', note: 'Not uploaded to Study Scoop.' },
};

export function homeworkView(ctx) {
  if (ctx.run) return activityView(ctx);
  const items = ctx.week.homework;
  const received = items.filter((h) => h.source === 'received');
  return html`
    ${pageHead('Homework', ctx, received.length
      ? `${received.length} classroom ${received.length === 1 ? 'assignment was' : 'assignments were'} received for this week.`
      : 'No classroom worksheets have been received for this week yet.')}

    ${ctx.packet ? html`
      <section class="card packet-card" aria-labelledby="h-packet">
        <h2 id="h-packet">Do this week's homework on the computer</h2>
        <p>${ctx.packet.about}</p>
        <p class="btn-row">
          <a class="btn btn-primary" href="${ctx.actLink('homework', 'packet')}">Start the homework</a>
          ${ctx.packet.download ? html`<a class="btn" href="${ctx.packet.download}" download>Download the packet (PDF)</a>` : ''}
        </p>
      </section>` : ''}

    <section aria-labelledby="h-due">
      <h2 id="h-due">${ctx.isCurrent ? 'This week\'s homework' : `Homework for ${ctx.week.label.replace(/^Week of /, '')}`}</h2>
      ${items.length ? html`
        <ul class="hw-list">
          ${items.map((h, i) => {
            const src = SOURCE[h.source] || SOURCE.newsletter;
            return html`
              <li class="card hw hw-${h.source || 'newsletter'}">
                <div class="hw-head">
                  ${h.subject ? html`<span class="chip subject">${h.subject}</span>` : ''}
                  <span class="badge src">${src.label}</span>
                </div>
                <label class="hw-check" for="hw-${i}"><input type="checkbox" id="hw-${i}">
                  <span><strong>${h.title}</strong> <span class="due">${h.due}</span></span></label>
                ${h.description ? html`<p>${h.description}</p>` : ''}
                <p class="hw-status">${h.status || src.note}</p>
                ${h.practice ? html`<p><a class="action" href="${practiceHref(ctx, h.practice)}">${h.practice.label}</a></p>` : ''}
              </li>`;
          })}
        </ul>
        <p class="hint">Checkmarks are not saved. They clear when you leave this page.</p>`
        : html`<p class="card">No homework is listed for this week.</p>`}
    </section>

    <section class="card" aria-labelledby="h-practice">
      <h2 id="h-practice">Study Scoop practice (optional)</h2>
      <p>Extra practice made by Study Scoop for this week. It is not classroom homework.</p>
      <p class="links">
        <a class="action" href="${ctx.link('spelling')}">Spelling activities</a>
        <a class="action" href="${ctx.link('vocab')}">Vocabulary activities</a>
        <a class="action" href="${ctx.link('math')}">Math lessons</a>
        <a class="action" href="${ctx.link('skills')}">Skill Builders</a>
        <a class="action" href="${ctx.link('tests')}">Practice tests</a>
      </p>
    </section>

    <p class="card note">Homework details are added after the homework goes home on Monday.</p>`;
}

function practiceHref(ctx, p) {
  if (p.lesson) return ctx.lessonLink(p.lesson, 'learn');
  if (p.test) return ctx.testLink(p.test);
  return p.act ? ctx.actLink(p.section, p.act) : ctx.link(p.section);
}
