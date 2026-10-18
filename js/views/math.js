// Math opens on its menu: Learn the Properties, Practice Problems, Math Lessons, Study Guide (DECISIONS D19).
// When the address names a lesson (#math?lesson=5-1&stage=watch), the lesson view is shown instead.
import { html } from '../lib/html.js';
import { modelFigure } from '../lib/models.js';
import { STAGES } from '../lib/lessons.js';
import { menuItems } from '../lib/activities.js';
import { GUIDE_STEPS, GUIDE_WORDS, PROPERTIES, teacherExample, teacherWord } from '../lib/mathlearn.js';
import { facts, menuPage, subBar, subjectMenu, testsNote } from './common.js';
import { lessonView } from './lesson.js';
import { activityView } from './activity.js';

const MATH = (ctx) => ({ label: 'Math', href: ctx.link('math') });
const BACK_MATH = (ctx) => ({ href: ctx.link('math'), label: '‹ Back to Math' });

export function mathView(ctx) {
  if (ctx.lesson) return lessonView(ctx);
  if (ctx.run) return activityView(ctx);
  if (ctx.page === 'practice') return practiceMenu(ctx);
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

/** Math > Math Lessons: each lesson with its steps as links, so Practice Together and Try It Yourself are easy to find. */
function lessonsMenu(ctx) {
  const lessons = ctx.lessons?.lessons || [];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Math Lessons', goal: 'Each lesson has five steps. Start at Learn It, or jump to any step.',
      trail: [MATH(ctx), { label: 'Math Lessons' }], back: [BACK_MATH(ctx)],
    })}
    ${lessons.length ? html`
      <ol class="lesson-list">
        ${lessons.map((l) => html`
          <li class="card lesson-card">
            <span class="lesson-num">${l.id}</span>
            <div>
              <h2 class="h3">Lesson ${l.id}: ${l.title}</h2>
              <p>${l.summary}</p>
              <ol class="stage-links" aria-label="Steps in Lesson ${l.id}">${STAGES.map((s, i) => html`<li><a href="${ctx.lessonLink(l.id, s.id)}"><span class="n" aria-hidden="true">${i + 1}</span> ${s.label}<span class="sr-only"> (Lesson ${l.id})</span></a></li>`)}</ol>
            </div>
            <a class="btn btn-primary" href="${ctx.lessonLink(l.id, 'learn')}">Start<span class="sr-only"> Lesson ${l.id}</span></a>
          </li>`)}
      </ol>` : html`<p class="card">The lessons could not be loaded. Please try again later.</p>`}
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><span></span></div>`;
}

/** Math > Study Guide: a short review of the four properties, the words, and breaking apart facts. Printable. */
function studyGuide(ctx) {
  const m = ctx.week.math;
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Study Guide', goal: m?.test ? `For the Multiplication Properties test: ${m.test}` : 'Multiplication Properties',
      trail: [MATH(ctx), { label: 'Study Guide' }], back: [BACK_MATH(ctx)],
    })}
    <p class="print-only">${ctx.week.label} · Study Scoop study guide (Multiplication Properties)</p>
    <section aria-labelledby="h-g-props">
      <h2 id="h-g-props">1. The four properties</h2>
      <ul class="guide-props">
        ${PROPERTIES.map((p) => {
          const tw = teacherWord(ctx.week, p);
          return html`<li class="card guide-prop">
            <h3>${p.name}</h3>
            ${tw ? html`<p class="teacher-line"><span class="label">Teacher's words</span> <span class="def">${tw.def}</span></p>` : ''}
            <p><span class="label">In other words</span> ${p.kid}</p>
            <p class="equation">${facts(p.eq)}</p>
            ${p.second ? html`<p class="equation">${facts(p.second.eq)}</p>` : ''}
          </li>`;
        })}
      </ul>
    </section>
    <div class="two-col">
      <section class="card" aria-labelledby="h-g-break">
        <h2 id="h-g-break">2. Break apart a factor</h2>
        <ol class="guide-steps">${GUIDE_STEPS.breakApart.map((s) => html`<li>${s}</li>`)}</ol>
        <p class="label">Two ways for 3 × 7</p>
        <ul class="plain-list">${GUIDE_STEPS.breakExamples.map((s) => html`<li class="equation-line">${facts(s)}</li>`)}</ul>
        <p>Both ways are right. If a question says which factor to break apart, break apart that one.</p>
        ${teacherExample(teacherWord(ctx.week, PROPERTIES[3])) ? html`<p><span class="label">Your teacher's example</span> ${teacherExample(teacherWord(ctx.week, PROPERTIES[3]))}</p>` : ''}
      </section>
      <section class="card" aria-labelledby="h-g-split">
        <h2 id="h-g-split">3. Read a split array</h2>
        <div class="models">${modelFigure(GUIDE_STEPS.splitModel)}</div>
        <ol class="guide-steps">${GUIDE_STEPS.split.map((s) => html`<li>${facts(s)}</li>`)}</ol>
      </section>
    </div>
    <div class="two-col">
      <section class="card" aria-labelledby="h-g-words">
        <h2 id="h-g-words">4. Math words</h2>
        <dl class="guide-words">${GUIDE_WORDS.map(([w, d]) => html`<div><dt>${w}</dt><dd>${facts(d)}</dd></div>`)}</dl>
      </section>
      <section class="card" aria-labelledby="h-g-ready">
        <h2 id="h-g-ready">5. Am I ready?</h2>
        <ul class="ready">${GUIDE_STEPS.ready.map((s) => html`<li>${s}</li>`)}</ul>
        <p>Not sure yet? Try <a href="${ctx.actLink('math', 'practice')}">Practice Problems</a>. When you are ready, take the <a href="${ctx.testLink('math')}">Math Practice Test</a>.</p>
      </section>
    </div>
    <div class="stage-nav">
      <a class="btn" href="${ctx.link('math')}">‹ Back to Math</a>
      <button type="button" class="btn btn-primary" data-act="print">Print the study guide</button>
    </div>`;
}
