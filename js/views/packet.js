// The homework packet page (DECISIONS D23): every page of Study Scoop's version of this week's homework, in order,
// like the paper packet. Each question has Check, a reason when it is wrong, and Help one step at a time.
import { html } from '../lib/html.js';
import { passageLines } from '../lib/homework.js';
import { itemCard, readButton } from './lesson.js';
import { ICONS } from './common.js';

const CHECK = { catchAll: 'Try again.' };

export function packetPage(ctx, run) {
  const p = ctx.packet;
  const byId = new Map(run.items.map((it) => [it.id, it]));
  const st = (id) => run.items_[id] || {};
  const isDone = (id) => st(id).status === 'correct' || Boolean(st(id).shown);
  const answered = run.items.filter((it) => st(it.id).first).length;
  // Written sentences are compared with an example, not marked right, so they are not counted as "right".
  const scored = run.items.filter((it) => it.type !== 'sentence');
  const firstTry = scored.filter((it) => st(it.id).first === 'correct').length;
  const finished = run.items.filter((it) => isDone(it.id)).length;
  /** A question that waits for the one before it (the meaning check waits for the written answer), or an equation
   *  whose × or ÷ stays hidden until "I need to…" is answered (the sign would give that answer away). */
  const view = (it) => {
    if (it.after && !isDone(it.after)) return html`<p class="card locked">Answer the question above first. Then check your meaning here.</p>`;
    const shown = it.opFrom && !isDone(it.opFrom) ? { ...it, lines: it.lines.map((l) => l.replace(/[×÷]/g, '?')) } : it;
    return itemCard(CHECK, shown, 'together', { items: run.items_ });
  };
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">${p.title}</h2></div>
    <div class="card packet-intro">
      <p>${p.about}</p>
      <p class="btn-row no-print">
        ${p.download ? html`<a class="btn" href="${p.download}" download>${ICONS.list}<span>Download the packet (PDF)</span></a>` : ''}
        <button type="button" class="btn" data-act="print">Save my work (print or save as PDF)</button>
      </p>
    </div>
    <p class="print-only name-line">Name ____________________________ &nbsp; Date ______________ &nbsp; <span class="small">${ctx.week.label} · Study Scoop's version of the homework</span></p>
    ${p.pages.map((pg, k) => html`
      <section class="packet-page" aria-labelledby="pg-${pg.id}">
        <h2 id="pg-${pg.id}" class="packet-title"><span class="pg-num">Page ${k + 1}</span> ${pg.title}</h2>
        ${pg.directions ? html`<p class="directions"><strong>Directions:</strong> ${pg.directions}<span class="no-print"> Press Check Answer after each one.</span></p>` : ''}
        ${pg.passage ? passage(pg.passage) : ''}
        <ol class="problems">
          ${pg.problems.map((pr) => html`
            <li class="problem" id="${pg.id}-${pr.n}">
              <h3 class="pnum">${pg.passage ? 'Question' : 'Problem'} ${pr.n}</h3>
              ${pr.story ? html`<div class="story card"><p>${pr.story}</p>${readButton(pr.story, 'the problem')}</div><div class="print-only show-work">Show your work</div>` : ''}
              ${pr.items.map((it) => view(byId.get(it.id)))}
            </li>`)}
        </ol>
      </section>`)}
    <div class="card packet-progress" aria-live="off">
      <h2>How you are doing</h2>
      <p><strong>${finished} of ${run.items.length}</strong> questions done · ${answered} answered · ${firstTry} of ${scored.length} right on the first try (written answers are compared with an example, not scored)</p>
      <p class="hint">Your answers are not saved. To keep them, press Save my work before you close this page.</p>
    </div>
    <div class="stage-nav no-print">
      <span class="btn-row">
        <button type="button" class="btn" data-act="restart">Start over</button>
        <a class="btn" href="${ctx.link('week')}">${ICONS.home}<span>Home</span></a>
      </span>
      <a class="btn btn-primary" href="${ctx.link('homework')}">Back to Homework</a>
    </div>`;
}

/** The story with the running word count beside each line (for the grown-up), and a chart for three reads. */
function passage(ps) {
  const lines = passageLines(ps.text);
  return html`
    <div class="card passage">
      <div class="instruct-head"><h3>${ps.title}</h3>${readButton(ps.text, 'the story')}</div>
      <ol class="passage-lines">${lines.map((l) => html`<li><span class="pl-text">${l.text}</span><span class="pl-count" aria-label="${l.count} words so far">${l.count}</span></li>`)}</ol>
      <p class="hint">The numbers count the words so far, for a grown-up scoring a read.</p>
      <table class="fluency">
        <caption>Reading chart (not saved)</caption>
        <thead><tr><td></td><th scope="col">1st read</th><th scope="col">2nd read</th><th scope="col">3rd read</th></tr></thead>
        <tbody>
          ${[['wrr', 'Words read right'], ['err', 'Mistakes']].map(([k, label]) => html`<tr><th scope="row">${label}</th>${[1, 2, 3].map((r) => html`<td><input class="fl-in" type="text" inputmode="numeric" maxlength="3" aria-label="${label}, read ${r}" id="fl-${k}-${r}"></td>`)}</tr>`)}
        </tbody>
      </table>
    </div>`;
}
