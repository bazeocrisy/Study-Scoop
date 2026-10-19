// Math opens on its menu: Learn the Properties, Math Vocabulary, Practice Problems, Math Lessons, Study Guide (D19, D20).
// When the address names a lesson (#math?lesson=5-1&stage=watch), the lesson view is shown instead.
import { html } from '../lib/html.js';
import { modelFigure } from '../lib/models.js';
import { STAGES } from '../lib/lessons.js';
import { menuItems } from '../lib/activities.js';
import { GUIDE_STEPS, GUIDE_WORDS, PROPERTIES, UNIT5, definitionOf, propertyByKey, teacherExample, teacherWord } from '../lib/mathlearn.js';
import { facts, menuPage, subBar, subjectMenu, testsNote } from './common.js';
import { lessonView } from './lesson.js';
import { activityView } from './activity.js';

const MATH = (ctx) => ({ label: 'Math', href: ctx.link('math') });
const BACK_MATH = (ctx) => ({ href: ctx.link('math'), label: '‹ Back to Math' });

export function mathView(ctx) {
  if (ctx.lesson) return lessonView(ctx);
  if (ctx.run) return activityView(ctx);
  if (ctx.page === 'practice') return practiceMenu(ctx);
  if (ctx.page === 'words') return wordsMenu(ctx);
  if (ctx.page === 'lessons') return lessonsMenu(ctx);
  if (ctx.page === 'guide') return studyGuide(ctx);
  const m = ctx.week.math;
  return menuPage(ctx, 'math', {
    title: 'Math', context: m ? `${m.title}${m.test ? ` · Math test: ${m.test}` : ''}` : 'Topic 5: Properties of Multiplication',
    items: menuItems('math'), after: testsNote(ctx, 'The weekly Math Test'),
  });
}

/** Math > Practice Problems: a second menu with the kinds of problems. */
function practiceMenu(ctx) {
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Practice Problems', goal: 'Choose a kind of problem. You get hints and help while you practice.',
      trail: [MATH(ctx), { label: 'Practice Problems' }], back: [BACK_MATH(ctx)],
    })}
    ${ctx.practice
      ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to practice?</h2>
          ${subjectMenu(ctx, 'math', menuItems('math', 'practice'), { misses: ctx.misses?.math })}</section>`
      : html`<p class="card">The practice problems could not be loaded. Please try again later.</p>`}
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><a class="btn" href="${ctx.actLink('math', 'learn')}">Learn the Properties first</a></div>`;
}

/** Math > Math Vocabulary: a second menu with Review My Words, three quizzes and Practice My Misses. */
function wordsMenu(ctx) {
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Math Vocabulary', goal: 'The five property words: Identity, Zero, Commutative, Associative and Distributive.',
      trail: [MATH(ctx), { label: 'Math Vocabulary' }], back: [BACK_MATH(ctx)],
    })}
    ${ctx.mathWords
      ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
          ${subjectMenu(ctx, 'math', menuItems('math', 'words'), { misses: ctx.misses?.mathwords })}</section>`
      : html`<p class="card">The Math Vocabulary questions could not be loaded. Please try again later.</p>`}
    <p class="hint menu-foot">When you are ready, try the Math Vocabulary Practice Test in <a href="${ctx.link('tests')}">Tests</a>.</p>
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><span></span></div>`;
}

/** Math > Math Lessons: each lesson with its steps as links, so Practice Together and Try It Yourself are easy to find. */
function lessonsMenu(ctx) {
  const lessons = ctx.lessons?.lessons || [];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Math Lessons', goal: 'Seven lessons. Each has five steps. Start at Learn It, or jump to any step. Every lesson is open.',
      trail: [MATH(ctx), { label: 'Math Lessons' }], back: [BACK_MATH(ctx)],
    })}
    ${lessons.length ? html`
      <ol class="lesson-list">
        ${lessons.map((l) => html`
          <li class="card lesson-card">
            <span class="lesson-num">${l.id}</span>
            <div>
              <h2 class="h3">Lesson ${l.id}: ${l.title}</h2>
              ${l.strategy ? html`<p class="strategy"><span class="label">Strategy</span> ${facts(l.strategy)}</p>` : ''}
              <p>${l.summary}</p>
              <ol class="stage-links" aria-label="Steps in Lesson ${l.id}">${STAGES.map((s, i) => html`<li><a href="${ctx.lessonLink(l.id, s.id)}"><span class="n" aria-hidden="true">${i + 1}</span> ${s.label}<span class="sr-only"> (Lesson ${l.id})</span></a></li>`)}</ol>
            </div>
            <a class="btn btn-primary" href="${ctx.lessonLink(l.id, 'learn')}">Start<span class="sr-only"> Lesson ${l.id}</span></a>
          </li>`)}
      </ol>` : html`<p class="card">The lessons could not be loaded. Please try again later.</p>`}
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><span></span></div>`;
}

/** Math > Study Guide: a short, printable review of Unit 5. Part 1 is the Multiplication Properties test topic;
 *  Part 2 is the rest of the unit, for practice (it is not announced as test material). */
function studyGuide(ctx) {
  const m = ctx.week.math;
  const dist = propertyByKey('distributive');
  const tex = teacherExample(teacherWord(ctx.week, dist));
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Study Guide', goal: 'Unit 5: Use properties to multiply by 3, 4, 6, 7, 8 and 9',
      trail: [MATH(ctx), { label: 'Study Guide' }], back: [BACK_MATH(ctx)],
    })}
    <p class="print-only">${ctx.week.label} · Study Scoop study guide (Unit 5)</p>
    <section class="card" aria-labelledby="h-g-goals">
      <h2 id="h-g-goals">Unit 5 goals</h2>
      <ul class="ready">${UNIT5.goals.map((g) => html`<li>${g}</li>`)}</ul>
    </section>
    <h2 class="guide-part">Part 1: Multiplication Properties${m?.test ? html` <span class="part-note">(class math test: ${m.test})</span>` : ''}</h2>
    <section aria-labelledby="h-g-props">
      <h3 id="h-g-props">1. The five properties</h3>
      <ul class="guide-props">
        ${PROPERTIES.map((p) => {
          const d = definitionOf(ctx.week, p);
          return html`<li class="card guide-prop">
            <h4>${p.name}</h4>
            ${d ? html`<p class="teacher-line"><span class="label">${d.teacher ? "Teacher's words" : 'Definition'}</span> <span class="def">${d.text}</span></p>` : ''}
            ${d?.text === p.kid ? '' : html`<p><span class="label">In other words</span> ${p.kid}</p>`}
            <p class="equation">${facts(p.eq)}</p>
            ${p.second ? html`<p class="equation">${facts(p.second.eq)}</p>` : ''}
          </li>`;
        })}
      </ul>
    </section>
    <div class="two-col">
      <section class="card" aria-labelledby="h-g-break">
        <h3 id="h-g-break">2. Break apart a factor</h3>
        <ol class="guide-steps">${GUIDE_STEPS.breakApart.map((x) => html`<li>${x}</li>`)}</ol>
        <p class="label">Two ways for 3 × 7</p>
        <ul class="plain-list">${GUIDE_STEPS.breakExamples.map((x) => html`<li class="equation-line">${facts(x)}</li>`)}</ul>
        <p>Both ways are right. If a question says which factor to break apart, break apart that one.</p>
        ${tex ? html`<p><span class="label">Your teacher's example</span> ${tex}</p>` : ''}
      </section>
      <section class="card" aria-labelledby="h-g-split">
        <h3 id="h-g-split">3. Read a split array</h3>
        <div class="models">${modelFigure(GUIDE_STEPS.splitModel)}</div>
        <ol class="guide-steps">${GUIDE_STEPS.split.map((x) => html`<li>${facts(x)}</li>`)}</ol>
      </section>
    </div>
    <h2 class="guide-part">Part 2: Strategies from Lessons 5-2 to 5-7 <span class="part-note">(for practice)</span></h2>
    <section class="card" aria-labelledby="h-g-strat">
      <h3 id="h-g-strat">4. Multiply by 3, 4, 6, 7, 8 and 9</h3>
      <div class="table-scroll"><table class="guide-table">
        <thead><tr><th scope="col">To multiply by</th><th scope="col">Break it into</th><th scope="col">Example</th></tr></thead>
        <tbody>${UNIT5.strategies.map(([n, parts, ex]) => html`<tr><th scope="row">${n}</th><td>${parts}</td><td>${facts(ex)}</td></tr>`)}</tbody>
      </table></div>
      <p><span class="label">Story problems</span> Find the equal groups, write the fact, use a strategy, and check that the answer makes sense.</p>
      ${ctx.lessons?.lessons?.length ? html`<p class="label">Go back to a lesson</p>
        <ul class="guide-lessons">${ctx.lessons.lessons.map((l) => html`<li><a href="${ctx.lessonLink(l.id, 'learn')}">Lesson ${l.id}: ${l.title}</a>${l.strategy ? html` <span class="muted">(${facts(l.strategy)})</span>` : ''}</li>`)}</ul>` : ''}
    </section>
    <div class="two-col">
      <section class="card" aria-labelledby="h-g-pat">
        <h3 id="h-g-pat">5. Fact patterns</h3>
        <ul class="plain-list">${UNIT5.patterns.map((x) => html`<li>${facts(x)}</li>`)}</ul>
      </section>
      <section class="card" aria-labelledby="h-g-mix">
        <h3 id="h-g-mix">6. Do not mix these up</h3>
        <ul class="plain-list">${UNIT5.mixups.map((x) => html`<li>${facts(x)}</li>`)}</ul>
      </section>
    </div>
    <div class="two-col">
      <section class="card" aria-labelledby="h-g-words">
        <h3 id="h-g-words">7. Math words</h3>
        <dl class="guide-words">${GUIDE_WORDS.map(([w, d]) => html`<div><dt>${w}</dt><dd>${facts(d)}</dd></div>`)}</dl>
      </section>
      <section class="card" aria-labelledby="h-g-check">
        <h3 id="h-g-check">8. Check yourself</h3>
        <ol class="guide-steps">${UNIT5.review.map(([qq]) => html`<li>${facts(qq)}</li>`)}</ol>
        <details class="answers no-print"><summary>Show the answers</summary>
          <ol>${UNIT5.review.map(([, a]) => html`<li>${facts(a)}</li>`)}</ol></details>
        <div class="print-only"><p class="label">Answers</p><ol>${UNIT5.review.map(([, a]) => html`<li>${facts(a)}</li>`)}</ol></div>
      </section>
    </div>
    <section class="card" aria-labelledby="h-g-ready">
      <h3 id="h-g-ready">9. Am I ready?</h3>
      <ul class="ready">${GUIDE_STEPS.ready.map((x) => html`<li>${x}</li>`)}</ul>
      <p>Not sure yet? Try <a href="${ctx.actLink('math', 'practice')}">Practice Problems</a> or <a href="${ctx.actLink('math', 'words')}">Math Vocabulary</a>. When you are ready, take the <a href="${ctx.testLink('math')}">Math Practice Test</a>.</p>
    </section>
    <div class="stage-nav">
      <a class="btn" href="${ctx.link('math')}">‹ Back to Math</a>
      <button type="button" class="btn btn-primary" data-act="print">Print the study guide</button>
    </div>`;
}
