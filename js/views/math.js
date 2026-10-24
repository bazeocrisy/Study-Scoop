// Math opens on its menu: Learn the Properties, Math Vocabulary, Practice Problems, Math Lessons, Study Guide (D19, D20).
// When the address names a lesson (#math?lesson=5-1&stage=watch), the lesson view is shown instead.
import { html } from '../lib/html.js';
import { modelFigure } from '../lib/models.js';
import { STAGES, chapterOf } from '../lib/lessons.js';
import { menuItems } from '../lib/activities.js';
import { GUIDE_STEPS, GUIDE_WORDS, PROPERTIES, UNIT5, definitionOf, hasPropertyWords, propertyByKey, teacherExample, teacherWord } from '../lib/mathlearn.js';
import { facts, menuPage, subBar, subjectMenu, testsNote } from './common.js';
import { lessonView, readButton } from './lesson.js';
import { AREA_EXAMPLES, AREA_LEARN, AREA_TIPS, AREA_WORDS, CH6_MISTAKES, CH6_SUMMARY, isAreaWeek } from '../lib/area.js';
import { formatLongDate } from '../lib/dates.js';
import { activityView } from './activity.js';

const MATH = (ctx) => ({ label: 'Math', href: ctx.link('math') });
const BACK_MATH = (ctx) => ({ href: ctx.link('math'), label: '‹ Back to Math' });

export function mathView(ctx) {
  if (ctx.lesson) return lessonView(ctx);
  if (ctx.run) return activityView(ctx);
  if (ctx.page === 'practice') return practiceMenu(ctx);
  if (ctx.page === 'words') return wordsMenu(ctx);
  if (ctx.page === 'lessons') return chaptersMenu(ctx);
  if (ctx.page === 'ch5' || ctx.page === 'ch6') return lessonsMenu(ctx, Number(ctx.page.slice(2)));
  if (ctx.page === 'guide') return studyGuide(ctx);
  const AREA_PAGES = { area: areaMenu, arealearn: areaLearn, areawords: areaWordsMenu, ch6review: chapter6Review };
  if (AREA_PAGES[ctx.page]) return isAreaWeek(ctx.week) ? AREA_PAGES[ctx.page](ctx) : notThisWeek(ctx);
  const m = ctx.week.math;
  const area = isAreaWeek(ctx.week);
  return menuPage(ctx, 'math', {
    title: 'Math', context: m ? `${m.title}${m.test ? ` · Math test: ${m.test}` : ''}` : 'Topic 5: Properties of Multiplication',
    // Topic 6: Area comes first in its week; Unit 5 (the properties) stays below it, with nothing removed.
    items: menuItems('math').filter((a) => a.topic !== 'area' || area).map((a) => (area && !a.topic ? { ...a, start: false } : a)),
    after: html`${area ? html`<p class="hint menu-foot">Unit 5 (the multiplication properties) is still here for review: Learn the Properties, Math Vocabulary, Practice Problems, Math Lessons and the Study Guide.</p>` : ''}${testsNote(ctx, 'The weekly Math Test')}`,
  });
}

const AREA = (ctx) => ({ label: 'Topic 6: Area', href: ctx.actLink('math', 'area') });

/** An Area page asked for in a week without Topic 6 (an old link): say so and offer this week. */
function notThisWeek(ctx) {
  return html`
    ${subBar(ctx, { tone: 'math', title: 'Topic 6: Area', goal: 'Area is the Topic 6 math topic.', trail: [MATH(ctx), { label: 'Topic 6: Area' }], back: [BACK_MATH(ctx)] })}
    <p class="card">Area is not this week's math topic. <a href="${ctx.link('math', ctx.index.current)}">Go to this week's Math</a> or go back to Math for ${ctx.week.label.replace(/^Week of /, '')}.</p>
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><span></span></div>`;
}

/** Math > Topic 6: Area: Learn Area, the Chapter 6 lessons, Area Words, Mixed Practice, Chapter 6 Review and misses. */
function areaMenu(ctx) {
  const t = ctx.week.tests.find((x) => x.kind === 'math');
  const items = menuItems('math', 'area');
  const lessonsCard = { id: 'ch6', label: 'Chapter 6 Lessons', about: 'Lessons 6-1 to 6-6: Learn It, Watch Me, Practice Together, Try It Yourself and a test.', icon: 'steps' };
  const ordered = [items[0], lessonsCard, ...items.slice(1)];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Topic 6: Area', goal: `Chapter 6: Connect Area and Multiplication. The Nov 3 words: ${AREA_WORDS.join(', ')}.${t ? ` ${t.title}: ${formatLongDate(t.date)}.` : ''}`,
      trail: [MATH(ctx), { label: 'Topic 6: Area' }], back: [BACK_MATH(ctx)],
    })}
    <section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
      ${subjectMenu(ctx, 'math', ordered, { misses: ctx.misses?.area })}</section>
    <p class="hint menu-foot">Practice tests in <a href="${ctx.link('tests')}">Tests</a>: the Math Vocabulary Practice Test (the Nov 3 words) and the Chapter 6 Practice Test (all six lessons).</p>
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><a class="btn btn-primary" href="${ctx.actLink('math', 'arealearn')}">Start: Learn Area ›</a></div>`;
}

/** Math > Topic 6: Area > Area Words: Review My Words, Flashcards, three quizzes and Practice My Misses. */
function areaWordsMenu(ctx) {
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Area Words', goal: `The Nov 3 vocabulary test words (${AREA_WORDS.join(', ')}) and the Chapter 6 review words.`,
      trail: [MATH(ctx), AREA(ctx), { label: 'Area Words' }], back: [{ href: ctx.actLink('math', 'area'), label: '‹ Back to Topic 6: Area' }, { href: ctx.link('math'), label: 'Back to Math' }],
    })}
    ${ctx.area ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
      ${subjectMenu(ctx, 'math', menuItems('math', 'areawords'), { misses: ctx.misses?.areavocab })}</section>`
      : html`<p class="card">The Area Words could not be loaded. Please try again later.</p>`}
    <p class="hint menu-foot">On the Nov 3 test: Area, Square Unit and Multiply (teacher's words). The other words are Chapter 6 review words. When you are ready, take the <a href="${ctx.testLink('mathwords')}">Math Vocabulary Practice Test</a>.</p>
    <div class="stage-nav"><a class="btn" href="${ctx.actLink('math', 'area')}">‹ Back to Topic 6: Area</a><span></span></div>`;
}

/** Math > Topic 6: Area > Chapter 6 Review: goals, words, worked examples, common mistakes and a visual summary. */
function chapter6Review(ctx) {
  const lessons = (ctx.lessons?.lessons || []).filter((l) => chapterOf(l.id) === 6);
  const words = ctx.area?.vocab?.words || [];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Chapter 6 Review', goal: 'Connect Area and Multiplication: everything in one place, then the chapter practice test.',
      trail: [MATH(ctx), AREA(ctx), { label: 'Chapter 6 Review' }], back: [{ href: ctx.actLink('math', 'area'), label: '‹ Back to Topic 6: Area' }, { href: ctx.link('math'), label: 'Back to Math' }],
    })}
    <p class="print-only">${ctx.week.label} · Study Scoop: Chapter 6 review (not a teacher test)</p>
    <section class="card" aria-labelledby="h-r-goals">
      <h2 id="h-r-goals">The six lessons</h2>
      <ol class="review-lessons">${lessons.map((l) => html`<li><a href="${ctx.lessonLink(l.id, 'learn')}">Lesson ${l.id}: ${l.title}</a> <span class="muted">${l.summary}</span></li>`)}</ol>
    </section>
    <section aria-labelledby="h-r-summary">
      <h2 id="h-r-summary">The chapter in pictures</h2>
      <ul class="area-examples review-pics">
        ${CH6_SUMMARY.map((x) => html`<li class="card work has-pic"><div class="pic-card"><div class="models">${modelFigure(x.model)}</div></div>
          <div><h3>${x.title}</h3><p>${facts(x.text)}</p>${x.eq ? html`<p class="equation">${facts(x.eq)}</p>` : ''}</div></li>`)}
      </ul>
    </section>
    ${words.length ? html`<section class="card" aria-labelledby="h-r-words">
      <h2 id="h-r-words">Words to know</h2>
      <dl class="guide-words">${words.map((w) => html`<div><dt>${w.word} <span class="word-tag ${w.teacher ? 'tag-test' : 'tag-review'}">${w.teacher ? 'Nov 3 test word' : 'Chapter review'}</span></dt><dd>${w.teacher ? html`<span class="label">Teacher's words</span> ` : ''}${w.def}</dd></div>`)}</dl>
    </section>` : ''}
    <section class="card" aria-labelledby="h-r-mix">
      <h2 id="h-r-mix">Common mistakes</h2>
      <ul class="plain-list">${CH6_MISTAKES.map((x) => html`<li>${facts(x)}</li>`)}</ul>
    </section>
    <section class="card" aria-labelledby="h-r-next">
      <h2 id="h-r-next">Practice, then test yourself</h2>
      <p><a href="${ctx.actLink('math', 'areafind')}">Mixed Practice</a> (20 questions with Help), then the <a href="${ctx.testLink('math')}">Chapter 6 Practice Test</a> (27 questions from all six lessons, no hints). The practice test is Study Scoop's review, not a teacher test.</p>
    </section>
    <div class="stage-nav">
      <a class="btn" href="${ctx.actLink('math', 'area')}">‹ Back to Topic 6: Area</a>
      <span class="btn-row"><button type="button" class="btn" data-act="print">Print the review</button>
      <a class="btn btn-primary" href="${ctx.testLink('math')}">Chapter 6 Practice Test ›</a></span>
    </div>`;
}

/** Math > Topic 6: Area > Learn Area: the teacher's exact words, a picture for each word, and worked examples. */
function areaLearn(ctx) {
  const words = ctx.week.math.words;
  const teacher = (w) => words.find((x) => x.word.toLowerCase() === w.toLowerCase());
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Learn Area', goal: 'The three Area words, with pictures and worked examples.',
      trail: [MATH(ctx), AREA(ctx), { label: 'Learn Area' }], back: [{ href: ctx.actLink('math', 'area'), label: '‹ Back to Topic 6: Area' }, { href: ctx.link('math'), label: 'Back to Math' }],
    })}
    <p class="print-only">${ctx.week.label} · Study Scoop: Topic 6 Area words</p>
    <section aria-labelledby="h-area-words">
      <h2 id="h-area-words">The three words</h2>
      <ul class="area-words">
        ${AREA_LEARN.map((c, k) => html`<li class="card area-word work has-pic">
          <div class="pic-card"><div class="models">${modelFigure(c.model, c.caption)}</div></div>
          <div>
            <div class="instruct-head"><h3 class="vocab-word">${k + 1}. ${c.word}</h3>${readButton([c.word, `Teacher's words: ${teacher(c.word)?.def || ''}`, `In other words: ${c.kid}`, ...c.steps], c.word)}</div>
            <blockquote class="teacher-words"><span class="label">Teacher's words</span><span class="def">${teacher(c.word)?.def || ''}</span></blockquote>
            <p class="kid-words"><span class="label">In other words</span>${c.kid}</p>
            <ol class="steps">${c.steps.map((x, i) => html`<li><span class="sn" aria-hidden="true">${i + 1}</span><span>${facts(x)}</span></li>`)}</ol>
          </div>
        </li>`)}
      </ul>
    </section>
    <section aria-labelledby="h-area-ex">
      <h2 id="h-area-ex">Watch me find the area</h2>
      <ul class="area-examples">
        ${AREA_EXAMPLES.map((ex, k) => html`<li class="card work has-pic area-example">
          <div class="pic-card"><div class="models">${modelFigure(ex.model)}</div></div>
          <div>
            <div class="instruct-head"><h3>Example ${k + 1}: ${ex.title}</h3>${readButton([ex.story || ex.title, ...ex.steps], `example ${k + 1}`)}</div>
            ${ex.story ? html`<p>${ex.story}</p>` : ''}
            <ol class="steps">${ex.steps.map((x, i) => html`<li><span class="sn" aria-hidden="true">${i + 1}</span><span>${facts(x)}</span></li>`)}</ol>
          </div>
        </li>`)}
      </ul>
    </section>
    <section class="card" aria-labelledby="h-area-tips">
      <h2 id="h-area-tips">Do not mix them up</h2>
      <ul class="plain-list">${AREA_TIPS.map((x) => html`<li>${facts(x)}</li>`)}</ul>
    </section>
    <div class="stage-nav">
      <a class="btn" href="${ctx.actLink('math', 'area')}">‹ Back to Topic 6: Area</a>
      <span class="btn-row"><button type="button" class="btn" data-act="print">Print</button>
      <a class="btn btn-primary" href="${ctx.actLink('math', 'areafind')}">Next: Find the Area ›</a></span>
    </div>`;
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

/** Math > Math Lessons: choose a chapter (Chapter 5 and Chapter 6), each with its own lesson list. */
function chaptersMenu(ctx) {
  const chapters = ctx.lessons?.chapters || [];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: 'Math Lessons', goal: 'Choose a chapter. Every lesson is open: start anywhere.',
      trail: [MATH(ctx), { label: 'Math Lessons' }], back: [BACK_MATH(ctx)],
    })}
    ${chapters.length ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">Choose a chapter</h2>
      ${subjectMenu(ctx, 'math', chapters.map((c) => ({ id: `ch${c.id}`, label: c.title, about: c.summary, icon: c.id === 6 ? 'grid' : 'steps' })))}</section>`
      : html`<p class="card">The lessons could not be loaded. Please try again later.</p>`}
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a><span></span></div>`;
}

/** Math > Math Lessons > Chapter N: each lesson with its steps as links, so Practice Together and Try It Yourself are easy to find. */
function lessonsMenu(ctx, chapter) {
  const lessons = (ctx.lessons?.lessons || []).filter((l) => chapterOf(l.id) === chapter);
  const info = (ctx.lessons?.chapters || []).find((c) => c.id === chapter);
  const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: info?.title || `Chapter ${chapter}`, goal: `${words[lessons.length] || lessons.length} lessons. Each has five steps. Start at Learn It, or jump to any step. Every lesson is open.`,
      trail: [MATH(ctx), { label: 'Math Lessons', href: ctx.actLink('math', 'lessons') }, { label: `Chapter ${chapter}` }],
      back: [{ href: ctx.actLink('math', 'lessons'), label: '‹ Back to Chapters' }, { href: ctx.link('math'), label: 'Back to Math' }],
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
    <div class="stage-nav"><a class="btn" href="${ctx.actLink('math', 'lessons')}">‹ Back to Chapters</a>${chapter === 6 ? html`<a class="btn" href="${ctx.actLink('math', 'ch6review')}">Chapter 6 Review</a>` : html`<span></span>`}</div>`;
}

/** Math > Study Guide: a short, printable review of Unit 5. Part 1 is the Multiplication Properties test topic;
 *  Part 2 is the rest of the unit, for practice (it is not announced as test material). */
function studyGuide(ctx) {
  // Unit 5's own class test and teacher's words (not a later topic's, such as Area).
  const u5 = ctx.unit5Week || ctx.week;
  const m = hasPropertyWords(u5) ? u5.math : null;
  const dist = propertyByKey('distributive');
  const tex = teacherExample(teacherWord(u5, dist));
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
          const d = definitionOf(u5, p);
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
        <caption class="sr-only">How to break apart each factor, with an example</caption>
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
    <h2 class="guide-part">Review: words, self-check and am I ready?</h2>
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
