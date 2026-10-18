// Math: the week's property words, each explained with a picture drawn from its own numbers, then the lessons.
// When the address names a lesson (#math?lesson=5-1&stage=watch), the lesson view is shown instead.
import { html } from '../lib/html.js';
import { modelFigure } from '../lib/models.js';
import { STAGES } from '../lib/lessons.js';
import { comingSoon, pageHead } from './common.js';
import { lessonView } from './lesson.js';

export function mathView(ctx) {
  if (ctx.lesson) return lessonView(ctx);
  const m = ctx.week.math;
  const lessons = ctx.lessons?.lessons || [];
  const first = lessons[0];
  // What the child is learning, how to start and when the test is: all in the page head (UX-6).
  const actions = first || m?.test ? html`
    ${first ? html`<a class="btn btn-primary" href="${ctx.lessonLink(first.id, 'learn')}">Start Lesson ${first.id}: ${first.title}</a>` : ''}
    ${m?.test ? html`<span class="test-pill">Math test: ${m.test}</span>` : ''}` : null;
  return html`
    ${pageHead('Math', ctx, m ? m.title : null, actions)}

    <section aria-labelledby="h-lessons">
      <h2 id="h-lessons">Lessons</h2>
      ${lessons.length ? html`
        <ol class="lesson-list">
          ${lessons.map((l) => html`
            <li class="card lesson-card">
              <span class="lesson-num">${l.id}</span>
              <div>
                <h3>Lesson ${l.id}: ${l.title}</h3>
                <p>${l.summary}</p>
                <ul class="stage-chips" aria-label="Steps">${STAGES.map((s) => html`<li>${s.label}</li>`)}</ul>
              </div>
              <a class="btn btn-primary" href="${ctx.lessonLink(l.id, 'learn')}">Start<span class="sr-only"> Lesson ${l.id}</span></a>
            </li>`)}
        </ol>` : html`<p class="card">The lessons could not be loaded. Please try again later.</p>`}
    </section>

    <section aria-labelledby="h-math-words">
      <h2 id="h-math-words">${m ? 'The property words' : "This week's math words"}</h2>
      ${m ? html`
        <p class="convention"><span>6 × 3 means <strong>6 groups of 3</strong>. In a dot picture, each group is one row.</span></p>
        <ul class="property-grid math-words">${[...m.words].sort((x, y) => isWide(x) - isWide(y)).map((w) => propertyCard(w))}</ul>`
        : html`<p class="card">No math words are listed for this week.</p>`}
    </section>

    ${comingSoon('More math practice', ['Multiplication Mastery: tables 0 to 12', 'Find My Factors: My Table and All Factor Pairs'], { level: 2 })}`;
}

// The Distributive card shows three examples, so it spans the full width and goes last (no half-empty rows).
const isWide = (w) => (w.word.toLowerCase().includes('distributive') ? 1 : 0);
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** One property card: teacher's words (exact), a kid-friendly line, a picture that matches the numbers, the equation. */
function propertyCard(w) {
  const [a, b] = w.example;
  const name = w.word.toLowerCase();
  let kid, body;
  if (name.includes('identity')) {
    kid = 'Times 1 keeps a number the same.';
    body = html`<div class="models">${modelFigure({ type: 'plates', plates: a, each: 1, perRow: Math.ceil(a / 2) }, `${pl(a, 'group')} of 1 = ${a}`)}</div>
      <p class="equation fact">${a} × ${b} = ${a * b}</p>`;
  } else if (name.includes('zero')) {
    kid = 'Times 0 always makes 0.';
    body = html`<div class="models">
        ${modelFigure({ type: 'plates', plates: a, each: 0, perRow: 5 }, `${a} × 0: ${pl(a, 'group')} of 0`)}
        ${modelFigure({ type: 'plates', plates: 0, each: 0 }, `0 × ${a}: 0 groups of ${a}`)}
      </div>
      <p class="equation fact">${a} × ${b} = ${a * b}</p>
      <p class="equation">0 × ${a} = 0</p>`;
  } else if (name.includes('commutative')) {
    kid = 'Turn it around. The number of dots stays the same.';
    body = html`<div class="models">${modelFigure({ type: 'pair', left: { rows: a, cols: b, star: [0, 0] }, right: { rows: b, cols: a, star: [0, a - 1] } },
      `${pl(a, 'row')} of ${b} turns into ${pl(b, 'row')} of ${a}. The star shows the same dot.`)}</div>
      <p class="equation fact">${a} × ${b} = ${b} × ${a} = ${a * b}</p>`;
  } else if (name.includes('distributive') && a >= 3 && b >= 2) {
    kid = 'Decompose one factor into two easier facts. Then add.';
    const cutA = a > 5 ? 5 : a - 1;
    const cutB = a - 2 >= 1 && a - 2 !== cutA ? a - 2 : null;
    const ex = [{ by: 'rows', at: cutA }, cutB ? { by: 'rows', at: cutB } : null, { by: 'cols', at: b - 1 }].filter(Boolean);
    body = html`<div class="example-set">${ex.map((cut, i) => {
      const [p1, q1, p2, q2] = cut.by === 'rows' ? [cut.at, b, a - cut.at, b] : [a, cut.at, a, b - cut.at];
      return html`<div class="ex">
        <p class="ex-title">Example ${'ABC'[i]}: ${cut.by === 'rows' ? `cut under row ${cut.at}` : `cut after column ${cut.at}`}</p>
        ${modelFigure({ type: 'array', rows: a, cols: b, cut, labels: 'facts' })}
        <p class="equation">${a} × ${b} = <span class="a">${p1} × ${q1}</span> + <span class="b">${p2} × ${q2}</span></p>
        <p class="equation"><span class="a">${p1 * q1}</span> + <span class="b">${p2 * q2}</span> = ${a * b}</p>
      </div>`;
    })}</div>
      <p class="fact sr-only">${a} × ${b} = ${a * b}</p>
      <p>Each way decomposes one factor, and each way makes ${a * b}. You can decompose either factor.</p>
      ${w.fill?.includes('___') ? html`<p class="pairs"><span class="label">Your teacher writes it like this</span> ${w.fill.replace('___', w.word)}</p>` : ''}`;
  } else {
    kid = '';
    body = html`<p class="equation fact">${a} × ${b} = ${a * b}</p>`;
  }
  return html`
    <li class="card property${name.includes('distributive') ? ' wide' : ''}">
      <h3>${w.word}</h3>
      <blockquote class="teacher-words"><span class="label">Teacher's words</span><span class="def">${w.def}</span></blockquote>
      ${kid ? html`<p class="kid-words"><span class="label">In other words</span>${kid}</p>` : ''}
      ${body}
    </li>`;
}
