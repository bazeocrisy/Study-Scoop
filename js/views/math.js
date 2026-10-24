// Math is chapter-first (D26): Math opens on Choose Your Chapter; each chapter opens a menu with the same six
// activities (Learn Vocabulary, Vocabulary Practice, Math Lessons, Practice Problems, Study Guide, Chapter Test),
// each loading only that chapter's content. A lesson address (#math?lesson=6-1&stage=watch) shows the lesson.
import { html } from '../lib/html.js';
import { modelFigure } from '../lib/models.js';
import { STAGES } from '../lib/lessons.js';
import { menuItems } from '../lib/activities.js';
import { GUIDE_STEPS, GUIDE_WORDS, PROPERTIES, UNIT5, definitionOf, hasPropertyWords, propertyByKey, teacherExample, teacherWord } from '../lib/mathlearn.js';
import { ICONS, crumbs, facts, subBar, subjectMenu, testsNote } from './common.js';
import { lessonView, readButton } from './lesson.js';
import { AREA_EXAMPLES, AREA_LEARN, AREA_TIPS, AREA_WORDS, CH6_GUIDE, CH6_MISTAKES } from '../lib/area.js';
import { chapterLessons, chapterList, chapterMenu, chapterStatus, recommendedChapter } from '../lib/chapters.js';
import { activityView } from './activity.js';

const MATH = (ctx) => ({ label: 'Math', href: ctx.link('math') });

// ---------------------------------------------------------------- chapter-first Math (D26)

/** The chapter this page belongs to (from the address), with its crumb and Back links. */
const chapterOfPage = (ctx) => ctx.chapter || null;
const CHAPTER = (ctx, c = chapterOfPage(ctx)) => (c ? { label: `Chapter ${c.id}`, href: ctx.chapterLink(c.id) } : null);
/** "Home > Math > Chapter 6 > <page>" and "‹ Back to Chapter 6 · Back to Math". */
function chapterBar(ctx, { title, goal, crumbs: extra = [], back = [] }) {
  const c = chapterOfPage(ctx);
  return subBar(ctx, {
    tone: 'math', title, goal,
    trail: [MATH(ctx), ...(c ? [CHAPTER(ctx, c)] : []), ...extra, { label: title }],
    back: [...back, ...(c ? [{ href: ctx.chapterLink(c.id), label: back.length ? `Back to Chapter ${c.id}` : `‹ Back to Chapter ${c.id}` }] : []), { href: ctx.link('math'), label: 'Back to Math' }],
  });
}
const backToChapter = (ctx) => {
  const c = chapterOfPage(ctx);
  return c ? html`<a class="btn" href="${ctx.chapterLink(c.id)}">‹ Back to Chapter ${c.id}</a>` : html`<a class="btn" href="${ctx.link('math')}">‹ Back to Math</a>`;
};

export function mathView(ctx) {
  if (ctx.lesson) return lessonView(ctx);
  if (ctx.run) return activityView(ctx);
  if (ctx.chapterMenu) return chapterPage(ctx, ctx.chapterMenu);
  const PAGES = {
    words: wordsMenu, practice: practiceMenu, guide: studyGuide, ch5: lessonsMenu,
    arealearn: areaLearn, areawords: areaWordsMenu, areapractice: areaPracticeMenu, ch6guide: chapter6Guide, ch6: lessonsMenu,
  };
  if (PAGES[ctx.page]) return PAGES[ctx.page](ctx);
  return chooseChapter(ctx);
}

/** Math: Choose Your Chapter. One card per registered chapter; the week only recommends one. */
function chooseChapter(ctx) {
  const shown = ctx.shownWeek || ctx.week;
  const list = chapterList(ctx.lessons);
  const now = recommendedChapter(shown, ctx.lessons);
  const lessonCount = (id) => chapterLessons(ctx.lessons, id).length;
  return html`
    <div class="page-head menu-head subject-math">
      ${crumbs(ctx, [{ label: 'Math' }])}
      <h1 tabindex="-1">Math</h1>
      <p class="week-of">${shown.label}</p>
      <p class="intro">${now ? html`This week your class is studying <strong>Chapter ${now.id}: ${now.name}</strong>. Every chapter is open.` : 'Every chapter is open. Choose one to start.'}</p>
    </div>
    ${ctx.isCurrent ? '' : html`<p class="notice" role="note">You are looking at an earlier week.
      <a href="${ctx.link('math', ctx.index.current)}">Go to this week</a></p>`}
    <section class="menu" aria-labelledby="h-menu">
      <h2 id="h-menu" class="ask">Choose Your Chapter</h2>
      ${list.length ? html`<ul class="menu-grid chapter-grid subject-math count-${list.length}">
        ${list.map((c) => {
          const status = chapterStatus(c, shown);
          return html`<li><a class="menu-card chapter-card${now?.id === c.id ? ' current' : ''}" href="${ctx.chapterLink(c.id)}" data-chapter="${c.id}">
            <span class="mc-icon">${ICONS[c.id === 6 ? 'grid' : 'steps']}</span>
            <span class="mc-text">
              <span class="chapter-status${now?.id === c.id ? ' now' : ''}">${status}</span>
              <span class="mc-title">Chapter ${c.id}: ${c.name}</span>
              <span class="mc-about">${lessonCount(c.id)} lessons. ${c.summary.replace(/^Lessons [^:]*: /, '')}</span>
            </span>
            <span class="mc-go" aria-hidden="true">›</span>
          </a></li>`;
        })}
      </ul>` : html`<p class="card">The chapters could not be loaded. Please try again later.</p>`}
    </section>
    ${testsNote(ctx, 'The weekly practice tests')}`;
}

/** Math > Chapter N: the same six activities for every chapter, each with this chapter's own content. */
function chapterPage(ctx, id) {
  const c = chapterList(ctx.lessons).find((x) => x.id === id);
  const shown = ctx.shownWeek || ctx.week;
  const menu = chapterMenu(id);
  const misses = id === 6 ? (ctx.misses?.area || 0) + (ctx.misses?.areavocab || 0) : (ctx.misses?.math || 0) + (ctx.misses?.mathwords || 0);
  const first = menu.find((r) => r.act.start) || menu[0];
  return html`
    ${subBar(ctx, {
      tone: 'math', title: `Chapter ${id}: ${c?.name || ''}`, eyebrow: c ? chapterStatus(c, shown) : '',
      goal: c ? `${chapterLessons(ctx.lessons, id).length} lessons. ${c.summary.replace(/^Lessons [^:]*: /, '')}` : '',
      trail: [MATH(ctx), { label: `Chapter ${id}` }], back: [{ href: ctx.link('math'), label: '‹ Back to Math' }],
    })}
    <section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
      <ul class="menu-grid subject-math count-${menu.length}">
        ${menu.map((r) => html`<li><a class="menu-card" href="${ctx.actLink('math', r.act.id)}" data-role="${r.role}">
          <span class="mc-icon">${ICONS[r.act.icon] || ''}</span>
          <span class="mc-text">${r === first ? html`<span class="start-here">Start here</span>` : ''}<span class="mc-title">${r.label}</span>
            <span class="mc-about">${r.act.about}</span></span>
          <span class="mc-go" aria-hidden="true">›</span>
        </a></li>`)}
      </ul>
    </section>
    ${misses ? html`<p class="hint menu-foot">You have ${misses} question${misses === 1 ? '' : 's'} to practice again: open Vocabulary Practice or Practice Problems, then Practice My Misses.</p>` : ''}
    ${id === 6 ? html`<p class="hint menu-foot">For the class test on Tuesday, Nov 3 (Area, Square Unit and Multiply), take the <a href="${ctx.testLink('mathwords')}">Math Vocabulary Practice Test</a> in Tests.</p>` : ''}
    <div class="stage-nav"><a class="btn" href="${ctx.link('math')}">‹ Back to Math</a>${first ? html`<a class="btn btn-primary" href="${ctx.actLink('math', first.act.id)}">Start: ${first.label} ›</a>` : html`<span></span>`}</div>`;
}

/** Chapter 6 > Learn Vocabulary. */
function areaLearn(ctx) {
  const words = ctx.week.math.words;
  const teacher = (w) => words.find((x) => x.word.toLowerCase() === w.toLowerCase());
  return html`
    ${chapterBar(ctx, { title: 'Learn the Area Words', goal: 'The teacher\'s three words for the Nov 3 test, with pictures and worked examples.' })}
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
      ${backToChapter(ctx)}
      <span class="btn-row"><button type="button" class="btn" data-act="print">Print</button>
      <a class="btn btn-primary" href="${ctx.actLink('math', 'areawords')}">Next: Vocabulary Practice ›</a></span>
    </div>`;
}

/** Math > Practice Problems: a second menu with the kinds of problems. */
function practiceMenu(ctx) {
  return html`
    ${chapterBar(ctx, { title: 'Practice Problems', goal: 'Chapter 5 problems: choose a kind. You get hints and help while you practice.' })}
    ${ctx.practice
      ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to practice?</h2>
          ${subjectMenu(ctx, 'math', menuItems('math', 'practice'), { misses: ctx.misses?.math })}</section>`
      : html`<p class="card">The practice problems could not be loaded. Please try again later.</p>`}
    <div class="stage-nav">${backToChapter(ctx)}<a class="btn" href="${ctx.actLink('math', 'learn')}">Learn the Properties first</a></div>`;
}

/** Math > Math Vocabulary: a second menu with Review My Words, three quizzes and Practice My Misses. */
function wordsMenu(ctx) {
  return html`
    ${chapterBar(ctx, { title: 'Math Vocabulary', goal: 'Chapter 5: the five property words, Identity, Zero, Commutative, Associative and Distributive.' })}
    ${ctx.mathWords
      ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
          ${subjectMenu(ctx, 'math', menuItems('math', 'words'), { misses: ctx.misses?.mathwords })}</section>`
      : html`<p class="card">The Math Vocabulary questions could not be loaded. Please try again later.</p>`}
    <p class="hint menu-foot">When you are ready, take the <a href="${ctx.actLink('math', 'ch5test')}">Chapter 5 Practice Test</a>.</p>
    <div class="stage-nav">${backToChapter(ctx)}<span></span></div>`;
}

/** Math > Math Lessons > Chapter N: each lesson with its steps as links, so Practice Together and Try It Yourself are easy to find. */
function lessonsMenu(ctx) {
  const chapter = ctx.chapter?.id;
  const lessons = chapterLessons(ctx.lessons, chapter);
  const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  return html`
    ${chapterBar(ctx, { title: `Chapter ${chapter} Lessons`, goal: `${words[lessons.length] || lessons.length} lessons. Each has five steps. Start at Learn It, or jump to any step. Every lesson is open.` })}
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
    <div class="stage-nav">${backToChapter(ctx)}<a class="btn" href="${ctx.actLink('math', chapter === 6 ? 'ch6guide' : 'guide')}">Chapter ${chapter} Study Guide</a></div>`;
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
    ${chapterBar(ctx, { title: 'Chapter 5 Study Guide', goal: 'Unit 5: Use properties to multiply by 3, 4, 6, 7, 8 and 9' })}
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
        <ul class="guide-lessons">${chapterLessons(ctx.lessons, 5).map((l) => html`<li><a href="${ctx.lessonLink(l.id, 'learn')}">Lesson ${l.id}: ${l.title}</a>${l.strategy ? html` <span class="muted">(${facts(l.strategy)})</span>` : ''}</li>`)}</ul>` : ''}
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
      <p>Not sure yet? Try <a href="${ctx.actLink('math', 'practice')}">Practice Problems</a> or <a href="${ctx.actLink('math', 'words')}">Math Vocabulary</a>. When you are ready, take the <a href="${ctx.actLink('math', 'ch5test')}">Chapter 5 Practice Test</a>.</p>
    </section>
    <div class="stage-nav">
      ${backToChapter(ctx)}
      <button type="button" class="btn btn-primary" data-act="print">Print the study guide</button>
    </div>`;
}

/** Chapter 6 > Vocabulary Practice: Review My Words, Flashcards, three quizzes and Practice My Misses. */
function areaWordsMenu(ctx) {
  return html`
    ${chapterBar(ctx, { title: 'Area Words', goal: `The Nov 3 vocabulary test words (${AREA_WORDS.join(', ')}) and the Chapter 6 review words.` })}
    ${ctx.area ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
      ${subjectMenu(ctx, 'math', menuItems('math', 'areawords'), { misses: ctx.misses?.areavocab })}</section>`
      : html`<p class="card">The Area Words could not be loaded. Please try again later.</p>`}
    <p class="hint menu-foot">On the Nov 3 test: Area, Square Unit and Multiply (teacher's words). The other words are Chapter 6 review words. When you are ready, take the <a href="${ctx.testLink('mathwords')}">Math Vocabulary Practice Test</a>.</p>
    <div class="stage-nav">${backToChapter(ctx)}<span></span></div>`;
}

/** Chapter 6 > Practice Problems: Mixed Practice (20 area problems with Help) and Practice My Misses. */
function areaPracticeMenu(ctx) {
  return html`
    ${chapterBar(ctx, { title: 'Area Practice Problems', goal: 'Chapter 6 problems: count square units, multiply length × width, split shapes and solve story problems.' })}
    ${ctx.area ? html`<section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to practice?</h2>
      ${subjectMenu(ctx, 'math', menuItems('math', 'areapractice'), { misses: ctx.misses?.area })}</section>`
      : html`<p class="card">The area problems could not be loaded. Please try again later.</p>`}
    <p class="hint menu-foot">Each lesson also has 20 Try It Yourself questions: open <a href="${ctx.actLink('math', 'ch6')}">Chapter 6 Lessons</a>. Questions you miss on the Chapter 6 Practice Test come here too, in Practice My Misses.</p>
    <div class="stage-nav">${backToChapter(ctx)}<a class="btn" href="${ctx.actLink('math', 'ch6test')}">Chapter 6 Practice Test ›</a></div>`;
}

/** Chapter 6 > Study Guide: area from tiling to story problems, mistakes to avoid and a self-check, ready to print. */
function chapter6Guide(ctx) {
  const G = CH6_GUIDE;
  const teacher = (w) => (ctx.week.math?.words || []).find((x) => x.word.toLowerCase() === String(w).toLowerCase());
  const words = ctx.area?.vocab?.words || [];
  const lessons = chapterLessons(ctx.lessons, 6);
  return html`
    ${chapterBar(ctx, { title: 'Chapter 6 Study Guide', goal: 'Connect Area and Multiplication: what to know, how to do it, and a self-check.' })}
    <p class="print-only">Study Scoop · Chapter 6 Study Guide (Study Scoop's review, not a teacher test)</p>
    <section class="card" aria-labelledby="h-c6-goals">
      <h2 id="h-c6-goals">Chapter 6 goals</h2>
      <ul class="ready">${G.goals.map((g) => html`<li>${g}</li>`)}</ul>
    </section>
    <h2 class="guide-part">Part 1: What to know</h2>
    <ul class="area-examples guide-sections">
      ${G.sections.map((x) => html`<li class="card work has-pic" id="g6-${x.id}">
        <div class="pic-card"><div class="models${x.models ? ' models-row' : ''}">${x.models ? x.models.map((m, k) => modelFigure(m, x.captions[k])) : modelFigure(x.model, x.caption)}</div></div>
        <div>
          <h3>${x.title}</h3>
          ${x.teacher && teacher(x.teacher) ? html`<p class="teacher-line"><span class="label">Teacher's words: ${x.teacher}</span> <span class="def">${teacher(x.teacher).def}</span></p>` : ''}
          ${x.text.map((t) => html`<p>${facts(t)}</p>`)}
          ${x.eq ? html`<p class="equation">${facts(x.eq)}</p>` : ''}
        </div>
      </li>`)}
    </ul>
    <h2 class="guide-part">Part 2: Solve an area problem</h2>
    <div class="two-col">
      <section class="card" aria-labelledby="h-c6-steps">
        <h3 id="h-c6-steps">The seven steps</h3>
        <ol class="guide-steps">${G.steps.map((x) => html`<li>${x}</li>`)}</ol>
      </section>
      <section class="card work" aria-labelledby="h-c6-ex">
        <h3 id="h-c6-ex">Worked example</h3>
        <p>${G.example.story}</p>
        <div class="models">${modelFigure(G.example.model)}</div>
        <ol class="steps">${G.example.lines.map((x, i) => html`<li><span class="sn" aria-hidden="true">${i + 1}</span><span>${facts(x)}</span></li>`)}</ol>
      </section>
    </div>
    <div class="two-col">
      <section class="card" aria-labelledby="h-c6-mix">
        <h3 id="h-c6-mix">Common mistakes</h3>
        <ul class="plain-list">${CH6_MISTAKES.map((x) => html`<li>${facts(x)}</li>`)}</ul>
      </section>
      ${words.length ? html`<section class="card" aria-labelledby="h-c6-words">
        <h3 id="h-c6-words">Words to know</h3>
        <dl class="guide-words">${words.map((w) => html`<div><dt>${w.word} <span class="word-tag ${w.teacher ? 'tag-test' : 'tag-review'}">${w.teacher ? 'Nov 3 test word' : 'Chapter review'}</span></dt><dd>${w.teacher ? html`<span class="label">Teacher's words</span> ` : ''}${w.def}</dd></div>`)}</dl>
      </section>` : ''}
    </div>
    <h2 class="guide-part">Part 3: Check yourself</h2>
    <section class="card" aria-labelledby="h-c6-check">
      <h3 id="h-c6-check">Self-check</h3>
      <ol class="guide-steps">${G.check.map((c) => html`<li>${facts(c.q)}</li>`)}</ol>
      <details class="answers no-print"><summary>Show the answers</summary>
        <ol>${G.check.map((c) => html`<li><strong>${facts(c.a)}</strong> ${facts(c.why)}</li>`)}</ol></details>
      <div class="print-only"><p class="label">Answers</p><ol>${G.check.map((c) => html`<li>${facts(c.a)} ${facts(c.why)}</li>`)}</ol></div>
    </section>
    <section class="card" aria-labelledby="h-c6-next">
      <h3 id="h-c6-next">Go back to a lesson</h3>
      <ul class="guide-lessons">${lessons.map((l) => html`<li><a href="${ctx.lessonLink(l.id, 'learn')}">Lesson ${l.id}: ${l.title}</a></li>`)}</ul>
      <p>Not sure yet? Try <a href="${ctx.actLink('math', 'areapractice')}">Practice Problems</a> or <a href="${ctx.actLink('math', 'areawords')}">Area Words</a>. When you are ready, take the <a href="${ctx.actLink('math', 'ch6test')}">Chapter 6 Practice Test</a> (Study Scoop's review of all six lessons, not the class test).</p>
    </section>
    <div class="stage-nav">
      ${backToChapter(ctx)}
      <span class="btn-row"><button type="button" class="btn" data-act="print">Print the study guide</button>
      <a class="btn btn-primary" href="${ctx.actLink('math', 'ch6test')}">Chapter 6 Practice Test ›</a></span>
    </div>`;
}
