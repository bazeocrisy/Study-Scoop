// Lessons 7-2 to 7-7 as skill journeys, with the same student experience as Lesson 7-1: one card at a time, one
// progress line ("Part B (2 of 6): …") with the parts behind "See all parts", the I Do / We Do / You Do badge,
// Next only when the card is done, parts that open in order, the Final Check, and a grown-up readiness report.
// The cards reuse the lesson views (screens, worked examples and questions with their visual feedback).
import { html } from '../lib/html.js';
import { subBar } from './common.js';
import { learnCard, exampleCard, itemCard, stageBody, parentGuide, stageStepper, chapterLink } from './lesson.js';
import { sectionsOf, sectionOf, cardItem, cardDone, frontierOf, sectionNeeds, letter, PHASES, skillReadiness, OUTCOME_TEXT } from '../lib/skill-journey.js';
import { STAGES } from '../lib/lessons.js';

const EXTRA = STAGES.filter((s) => s.id !== 'test');
const label = (lesson, id) => (id === 'test' ? 'Final Check' : id === 'parent' ? 'Grown-up report' : sectionOf(lesson, id)?.label || id);

/** One progress line, a thin bar, and the list of parts behind "See all parts" (open on the report page). */
export function skillMap(ctx, lesson, current, { card, open = false } = {}) {
  const secs = sectionsOf(lesson), done = ctx.lessonVisited || new Set(), n = secs.length;
  const si = secs.findIndex((s) => s.id === current);
  const where = si >= 0 ? html`<strong>Part ${letter(si)}</strong> <span class="j-of">(${si + 1} of ${n}):</span> ${secs[si].title}`
    : current === 'test' ? html`<strong>Final Check</strong>` : html`<strong>Grown-up report</strong>`;
  const item = (id, i, text) => {
    const locked = sectionNeeds(lesson, id, done).length > 0, isDone = done.has(id) && id !== current, mark = i < 0 ? '★' : letter(i);
    const inner = html`<span class="n">${id === 'test' ? '✓' : mark}</span> <span class="name">${text}</span>`;
    return html`<li class="${isDone ? 'done' : ''}${locked ? ' locked' : ''}">${locked ? html`<span class="j-locked"><span class="n">${id === 'test' ? '✓' : mark}</span> <span class="name"><span aria-hidden="true">🔒 </span>${text}</span><span class="sr-only"> (locked: finish the earlier parts first)</span></span>`
      : html`<a href="${ctx.lessonLink(lesson.id, id)}"${id === current ? html` aria-current="step"` : ''}>${inner}</a>`}</li>`;
  };
  const list = html`<nav class="stepper j-stepper j-cols-${n + 2}${open ? ' j-stepper-open' : ''}" data-n="${n + 2}" aria-label="Lesson ${lesson.id} parts"><ol>
    ${secs.map((s, i) => item(s.id, i, s.label))}${item('test', 0, 'Final Check')}${item('parent', -1, 'Grown-up report')}</ol></nav>`;
  return html`<div class="j-map j-bar-${n + 1}">
    <p class="j-where">${where}${card ? html` <span class="j-cardnum">${card}</span>` : ''}</p>
    <span class="j-mapbar" aria-hidden="true">${[...secs.map((s) => s.id), 'test'].map((id) => html`<span class="${id === current ? 'now' : done.has(id) ? 'past' : ''}"></span>`)}</span>
    ${open ? list : html`<details class="j-map-all"><summary>See all parts</summary>${list}</details>`}
  </div>`;
}

function lockedPart(ctx, lesson, stage, needs) {
  const go = needs[0], gi = sectionsOf(lesson).findIndex((s) => s.id === go);
  const what = stage === 'test' ? 'The Final Check' : `Part ${letter(sectionsOf(lesson).findIndex((s) => s.id === stage))}`;
  return html`<article class="card j-card"><h2 id="stage-h" tabindex="-1">🔒 ${what} is locked</h2>
    <p>Finish Part ${letter(gi)} first. Then this part opens.</p>
    <p><a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, go)}">Go to Part ${letter(gi)}: ${label(lesson, go)} ›</a></p></article>`;
}

/** One card of a skill section (re-rendered in place after each action). */
export function sectionInner(ctx) {
  const { lesson } = ctx, section = sectionOf(lesson, ctx.stage), state = ctx.lessonState || { i: 0, items: {}, steps: {} };
  const secs = sectionsOf(lesson), si = secs.indexOf(section), cards = section.cards;
  const i = Math.min(state.i || 0, frontierOf(section, state)), card = cards[i];
  const it = cardItem(card), st = it ? state.items?.[it.id] || {} : {};
  const done = cardDone(card, i, { ...state, seen: { ...state.seen, [i]: true } });
  const pseudo = card.phase === 'wedo' ? 'together' : card.phase === 'youdo' ? 'try' : 'learn';
  const body = card.kind === 'example' ? exampleCard(lesson, card, i, state) : card.kind === 'screen' ? learnCard(lesson, card, state) : itemCard(lesson, card.item, pseudo, state);
  const firstIdo = cards.findIndex((c) => c.phase === 'ido' && c.kind === 'example') >= 0 ? cards.findIndex((c) => c.phase === 'ido' && c.kind === 'example') : cards.findIndex((c) => c.phase === 'ido');
  const stuck = card.phase === 'youdo' && (st.tries || 0) >= 2 && st.status !== 'correct' && !st.shown;
  const next = secs[si + 1];
  const why = card.kind === 'example' ? 'Watch every step to go on.' : it ? (card.phase === 'say' ? 'Write your answer, compare and check it to go on.' : 'Get this one right to go on. You can try as many times as you need.') : '';
  const nextBtn = i < cards.length - 1
    ? html`<button type="button" class="btn${done ? ' btn-primary' : ''}" data-act="next"${done ? '' : html` disabled aria-describedby="next-why"`}>Next ›</button>`
    : done ? html`<a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, next ? next.id : 'test')}">${next ? `Next: Part ${letter(si + 1)} ›` : 'Next: Final Check ›'}</a>`
      : html`<button type="button" class="btn" disabled aria-describedby="next-why">${next ? `Next: Part ${letter(si + 1)} ›` : 'Next: Final Check ›'}</button>`;
  return html`${skillMap(ctx, lesson, section.id, { card: `Card ${i + 1} of ${cards.length}` })}
    <article class="card j-card skill-card j-phase-${card.phase}" data-card="${it?.id || `${section.id}-${i}`}" data-phase="${card.phase}" data-kind="${card.kind}">
      <p class="j-badge-row"><span class="j-badge phase-${card.phase}">${PHASES[card.phase]}</span><span class="j-skill">Part ${letter(si)}: ${section.label}</span></p>
      <h2 id="stage-h" tabindex="-1" class="skill-title">${section.title}</h2>
      ${card.phase === 'youdo' && !(st.tries) ? html`<p class="j-note">On your own. Help opens after your first try, and your grown-up's report shows when help was used.</p>` : ''}
      ${card.phase === 'wedo' && !(st.tries) ? html`<p class="j-note">Let's do it together. Press Help any time to see one step at a time.</p>` : ''}
      ${body}
      ${stuck && firstIdo >= 0 ? html`<div class="j-quick"><h3>Still tricky?</h3><p>Look at the example again, then come back and try this one.</p><div class="j-row"><button type="button" class="btn" data-act="goto" data-to="${firstIdo}">Look at the example again</button></div></div>` : ''}
    </article>
    <div class="stage-nav j-nav">
      ${i > 0 ? html`<button type="button" class="btn" data-act="back">‹ Back</button>` : si > 0 ? html`<a class="btn" href="${ctx.lessonLink(lesson.id, secs[si - 1].id)}">‹ Part ${letter(si - 1)}</a>` : html`<span></span>`}
      <span class="next-wrap">${nextBtn}</span>
    </div>
    ${done ? '' : html`<p class="j-locknote" id="next-why">${why || 'Finish this card to go on.'}</p>`}
    <p class="hint">Your work is saved on this device, so you can come back later. Nothing is sent anywhere.</p>`;
}

/** The Final Check stage (the lesson's test, re-rendered in place). */
export function finalInner(ctx) {
  return html`${skillMap(ctx, ctx.lesson, 'test')}${stageBody(ctx, ctx.lesson, 'test', ctx.lessonState || { i: 0, items: {}, steps: {} })}`;
}

export function skillReport(ctx, lesson, stateOf, history) {
  const r = skillReadiness(lesson, stateOf, history);
  const verdict = {
    unfinished: ['In progress.', 'The report is complete after the Final Check.'],
    ready: ['Ready for the workbook.', 'Every skill was done on screen and the Final Check was passed. Next, ask your child to do the school workbook page without help.'],
    review: ['Almost ready.', `Practice the skills listed below, then try the workbook page.`],
    notyet: ['Not ready yet.', 'Go back through the parts listed below with your child before the workbook page.'],
  }[r.level];
  const missed = (r.test?.missed || []).map((id) => lesson.test.items.find((x) => x.id === id)).filter(Boolean);
  const say = sectionsOf(lesson).flatMap((s) => s.cards.filter((c) => c.phase === 'say').map((c) => ({ s, it: cardItem(c) }))).map(({ s, it }) => ({ it, st: stateOf(s.id)?.items?.[it.id] }));
  return html`<section class="card j-summary readiness" aria-labelledby="j-sum-h">
    <h2 id="j-sum-h" tabindex="-1">Lesson ${lesson.id} readiness report</h2>
    <p class="j-verdict ${r.level}"><strong>${verdict[0]}</strong> ${verdict[1]}</p>
    <p>Final Check (first try): ${r.test ? html`<strong>${r.test.right} of ${r.test.total}</strong> right` : 'not taken yet'}.${missed.length ? ` Missed: ${missed.length} question${missed.length === 1 ? '' : 's'}.` : ''}</p>
    <h3>Each skill: the "You Do" questions</h3>
    <table class="j-table j-ready"><thead><tr><th scope="col">Skill</th><th scope="col">On their own</th></tr></thead><tbody>
      ${r.skills.map((k) => html`<tr class="${k.solid ? 'solid' : ''}"><th scope="row">${k.letter}. ${k.section.title}</th><td>${k.results.map((x) => OUTCOME_TEXT[x]).join('; ')}</td></tr>`)}
    </tbody></table>
    ${r.practise.length ? html`<p><strong>Practice more:</strong> ${r.practise.join('; ')}.</p>` : ''}
    ${missed.length ? html`<details class="j-detail"><summary>Questions missed on the Final Check</summary><ul>${missed.map((x) => html`<li>${x.prompt}</li>`)}</ul></details>` : ''}
    <h3>Written answer</h3>
    ${say.some((x) => x.st?.resp?.text) ? html`<ul>${say.map((x) => html`<li>“${x.st?.resp?.text || ''}” ${x.st?.status === 'correct' ? '(checklist ticked; a grown-up should still read it)' : '(needs a grown-up to read it)'}</li>`)}</ul>` : html`<p>No written answer yet.</p>`}
    <p class="j-note">"On own" means right with no help. Answers shown by Help, and retakes after the answers were shown, never count as on own. On-screen results are not proof of mastery: the workbook page done without help is the real check.</p>
    <section class="j-reset" aria-labelledby="j-reset-h" data-l-reset-box>
      <h3 id="j-reset-h">Saved progress (for grown-ups)</h3>
      <p>Lesson ${lesson.id} progress is saved only in this browser on this device, so your child can stop and come back. It holds answers, the written answer and the results above. It holds no name, and nothing is sent anywhere. Erase it when another child will use this device, or to start Lesson ${lesson.id} again.</p>
      <div class="j-row" data-l-reset-ask><button type="button" class="btn" data-l-reset="ask">Reset Lesson ${lesson.id} progress…</button></div>
      <div class="j-confirm" data-l-reset-confirm hidden>
        <p role="alert"><strong>Erase all Lesson ${lesson.id} progress on this device?</strong> This cannot be undone.</p>
        <div class="j-row"><button type="button" class="btn btn-primary" data-l-reset="no">Cancel: keep progress</button><button type="button" class="btn j-danger" data-l-reset="yes">Yes, erase Lesson ${lesson.id} progress</button></div>
      </div>
    </section>
  </section>`;
}

export function skillLessonView(ctx, { stateOf, history }) {
  const { lesson } = ctx, stage = ctx.stage, section = sectionOf(lesson, stage), secs = sectionsOf(lesson);
  const top = subBar(ctx, {
    tone: 'math', compact: true, title: `Lesson ${lesson.id}: ${lesson.title}`, goal: section === secs[0] && !(ctx.lessonState?.i > 0) ? lesson.goal : '',
    trail: [{ label: 'Chapter 7 Lessons', href: chapterLink(ctx, lesson) }, { label: `Lesson ${lesson.id}` }],
    back: [{ href: chapterLink(ctx, lesson), label: '‹ Back to Lessons' }],
  });
  if (section || stage === 'test') {
    const needs = sectionNeeds(lesson, stage, ctx.lessonVisited);
    if (needs.length) return html`${top}<div class="stage j-stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}" data-locked="true">${skillMap(ctx, lesson, stage)}${lockedPart(ctx, lesson, stage, needs)}</div>`;
    return html`${top}<div class="stage j-stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}">${section ? sectionInner(ctx) : finalInner(ctx)}</div>`;
  }
  if (stage === 'parent') return html`${top}<div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="parent">${skillMap(ctx, lesson, 'parent', { open: true })}${skillReport(ctx, lesson, stateOf, history)}
    <section class="card j-extra" aria-labelledby="j-extra-h"><h2 id="j-extra-h" class="h3">Extra practice (optional)</h2><p>More screens and questions from this lesson, for practice after the skills.</p>
    <p class="btn-row">${EXTRA.map((s) => html`<a class="btn" href="${ctx.lessonLink(lesson.id, s.id)}">${s.label}</a>`)}</p></section>${parentGuide(ctx, lesson)}</div>`;
  // The original stages stay as optional extra practice, with a way back to the lesson.
  return html`${subBar(ctx, { tone: 'math', eyebrow: `Lesson ${lesson.id} · Extra practice (optional)`, title: lesson.title, goal: '',
    trail: [{ label: 'Chapter 7 Lessons', href: chapterLink(ctx, lesson) }, { label: `Lesson ${lesson.id}` }],
    back: [{ href: chapterLink(ctx, lesson), label: '‹ Back to Lessons' }, { href: ctx.lessonLink(lesson.id, undefined), label: '‹ Main lesson' }] })}
    ${stageStepper(ctx, lesson, stage, 'Extra practice steps', EXTRA)}
    <div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}">${stageBody(ctx, lesson, stage, ctx.lessonState || { i: 0, items: {}, steps: {} })}</div>`;
}
