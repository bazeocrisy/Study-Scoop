// Chapter 7 resource pages. Lessons and scored activities use the shared engines.
import { html } from '../lib/html.js';
import { modelFigure } from '../lib/models.js';
import { STAGES } from '../lib/lessons.js';
import { subBar, subjectMenu } from './common.js';
import { readButton } from './lesson.js';

const back = (ctx) => html`<a class="btn" href="${ctx.chapterLink(7)}">‹ Back to Chapter 7</a>`;
function bar(ctx, title, goal) {
  return subBar(ctx, { tone: 'math', title, goal,
    trail: [{ label: 'Math', href: ctx.link('math') }, { label: 'Chapter 7', href: ctx.chapterLink(7) }, { label: title }],
    back: [{ href: ctx.chapterLink(7), label: '‹ Back to Chapter 7' }, { href: ctx.link('math'), label: 'Back to Math' }],
  });
}
const paragraphs = (text) => (Array.isArray(text) ? text : text ? [text] : []).map((p) => html`<p>${p}</p>`);
const picture = (model) => model ? html`<div class="frac-model">${modelFigure(model)}</div>` : '';
const data = (ctx) => ctx.fractions;
const available = (ctx, title) => html`${bar(ctx, title, 'Chapter 7: Fractions')}
  <p class="card">The Chapter 7 resources could not be loaded. Please try again later.</p>`;

/** Return null for pages owned by another view or the activity player. */
export function fractionPage(ctx) {
  const pages = { fraclearn: vocabulary, fracwords: vocabularyMenu, fracpractice: practiceMenu, ch7guide: guide, ch7: lessons };
  return pages[ctx.page] ? pages[ctx.page](ctx) : null;
}

function vocabulary(ctx) {
  const pack = data(ctx);
  if (!pack?.vocabulary?.length) return available(ctx, 'Learn Fraction Words');
  return html`${bar(ctx, 'Learn Fraction Words', 'Read the meaning, study the picture, and explain the word in your own words.')}
    <div class="frac-resources">
      <ul class="frac-word-list">${pack.vocabulary.map((w, i) => html`<li class="card frac-word" aria-labelledby="frac-word-${i}">
        <div class="instruct-head"><h2 id="frac-word-${i}">${w.word}</h2>${readButton([w.word, w.def, w.simple || '', w.example || ''], `the word ${w.word}`)}</div>
        <p class="frac-source">${w.source === 'teacher' ? 'Teacher’s exact words' : 'Study Scoop review definition'}</p>
        <p class="frac-definition">${w.def}</p>
        ${w.simple ? html`<p><strong>Think of it this way:</strong> ${w.simple}</p>` : ''}
        ${picture(w.model)}
        ${w.example ? html`<p class="frac-example"><strong>Example:</strong> ${w.example}</p>` : ''}
      </li>`)}</ul>
    </div>
    <div class="stage-nav">${back(ctx)}<span class="btn-row"><button type="button" class="btn" data-act="print">Print word guide</button>
      <a class="btn btn-primary" href="${ctx.actLink('math', 'fracwords')}">Next: Vocabulary Practice ›</a></span></div>`;
}

function vocabularyMenu(ctx) {
  const items = [
    { id: 'fvflash', label: 'Fraction Word Cards', about: 'Say each word, then turn the card over to check its meaning.', icon: 'cards', start: true },
    { id: 'fvchoice', label: 'Choose the Meaning', about: 'Choose the meaning that matches the fraction word.', icon: 'choice' },
    { id: 'fvtf', label: 'True or False', about: 'Decide whether each meaning is right.', icon: 'truefalse' },
    { id: 'fvfill', label: 'Fill in the Blank', about: 'Use fraction words to complete a sentence.', icon: 'pencil' },
    { id: 'fvmisses', label: 'Practice My Misses', about: 'Try vocabulary questions you missed during this visit.', icon: 'redo', misses: true },
  ];
  return html`${bar(ctx, 'Fraction Vocabulary Practice', 'Practice the Chapter 7 words. Hints and explanations help you learn.')}
    <section class="menu" aria-labelledby="h-frac-words"><h2 class="ask" id="h-frac-words">What would you like to do?</h2>
      ${subjectMenu(ctx, 'math', items, { misses: ctx.misses?.fractionvocab || ctx.misses?.fracvocab || 0 })}</section>
    <div class="stage-nav">${back(ctx)}<a class="btn" href="${ctx.actLink('math', 'fraclearn')}">Review the words first</a></div>`;
}

function practiceMenu(ctx) {
  const items = [
    { id: 'fpractice', label: 'Mixed Fraction Practice', about: 'Read fraction models, name equal parts, and solve fraction problems.', icon: 'mix', start: true },
    { id: 'fchoice', label: 'Choose an Answer', about: 'Look closely at the picture and choose an answer.', icon: 'choice' },
    { id: 'ftf', label: 'True or False', about: 'Check fraction statements and learn why.', icon: 'truefalse' },
    { id: 'ffill', label: 'Write a Fraction', about: 'Use the picture to write the numerator and denominator.', icon: 'pencil' },
    { id: 'fmisses', label: 'Practice My Misses', about: 'Try Chapter 7 practice questions you missed during this visit.', icon: 'redo', misses: true },
  ];
  return html`${bar(ctx, 'Fraction Practice Problems', 'Practice with pictures and numbers. Get help when you need it.')}
    <section class="menu" aria-labelledby="h-frac-practice"><h2 class="ask" id="h-frac-practice">What would you like to practice?</h2>
      ${subjectMenu(ctx, 'math', items, { misses: ctx.misses?.fractions || 0 })}</section>
    <div class="stage-nav">${back(ctx)}<a class="btn" href="${ctx.actLink('math', 'ch7guide')}">Chapter 7 Study Guide</a></div>`;
}

function guide(ctx) {
  const pack = data(ctx);
  if (!pack?.guide) return available(ctx, 'Chapter 7 Study Guide');
  const g = pack.guide;
  return html`${bar(ctx, g.title || 'Chapter 7 Study Guide', 'Review a little at a time. Explain your thinking, then check the examples.')}
    <div class="frac-resources frac-guide">
      <div class="card frac-guide-intro">${paragraphs(g.intro)}<p class="no-print"><button type="button" class="btn" data-act="print">Print study guide</button></p></div>
      ${(g.sections || []).map((s, i) => html`<section class="card frac-guide-section" aria-labelledby="frac-guide-${i}">
        <h2 id="frac-guide-${i}">${s.title}</h2>${paragraphs(s.text)}
        ${(s.examples || []).map((e) => html`<div class="frac-worked"><h3>${e.title}</h3>${picture(e.model)}${paragraphs(e.text)}</div>`)}
        ${s.mistakes?.length ? html`<h3>Watch out</h3><ul class="frac-mistakes">${s.mistakes.map((m) => html`<li><p><strong>A mix-up:</strong> ${m.mistake}</p><p><strong>Try this:</strong> ${m.fix}</p></li>`)}</ul>` : ''}
        ${(s.checks || []).map((q, k) => html`<div class="frac-check"><h3>Try it ${k + 1}</h3><p>${q.question}</p>${picture(q.model)}
          <details class="frac-answer-key"><summary>Check your thinking</summary><p>${q.answer}</p></details></div>`)}
      </section>`)}
      ${performance(pack.performance)}
      ${fluency(pack.fluency)}
    </div>
    <div class="stage-nav no-print">${back(ctx)}<a class="btn btn-primary" href="${ctx.actLink('math', 'ch7test')}">Try the Chapter 7 Practice Test ›</a></div>`;
}

function performance(p) {
  if (!p?.tasks?.length) return '';
  return html`<section class="card frac-performance" aria-labelledby="h-frac-performance"><h2 id="h-frac-performance">${p.title || 'Show What You Know'}</h2>
    ${paragraphs(p.note)}<p>Say your answer or write it on paper. Use a picture and explain how you know.</p>
    <ol class="frac-task-list">${p.tasks.map((t, i) => html`<li><h3>Task ${i + 1}</h3><p>${t.prompt}</p>${picture(t.model)}
      <details class="frac-answer-key"><summary>Compare with an example answer</summary>${paragraphs(t.example)}</details></li>`)}</ol></section>`;
}

function fluency(f) {
  if (!f?.items?.length) return '';
  return html`<section class="card frac-fluency" aria-labelledby="h-frac-fluency"><h2 id="h-frac-fluency">${f.title || 'Fraction Fluency'}</h2>
    ${paragraphs(f.note)}<p>Work at your own pace. Accuracy and explaining your thinking come first.</p>
    <ol class="frac-task-list">${f.items.map((q) => html`<li><p>${q.prompt}</p>${picture(q.model)}
      ${q.options?.length ? html`<ul class="frac-fluency-options">${q.options.map((o) => html`<li>${o.text}</li>`)}</ul>` : ''}
      <details class="frac-answer-key"><summary>Check your answer</summary><p>${q.explain || q.example || q.answerLabel || q.options?.find((o) => o.correct)?.text || (typeof q.answer === 'string' || typeof q.answer === 'number' ? q.answer : 'Review the matching lesson to explain your answer.')}</p></details>
    </li>`)}</ol></section>`;
}

function lessons(ctx) {
  const list = (ctx.lessons?.lessons || []).filter((l) => l.chapter === 7 || l.id.startsWith('7-'));
  return html`${bar(ctx, 'Chapter 7 Lessons', 'Start with Learn It, or choose a lesson step. Every lesson is open.')}
    <ol class="lesson-list">${list.map((l) => html`<li class="card lesson-card"><span class="lesson-num">${l.id}</span><div>
      <h2 class="h3">Lesson ${l.id}: ${l.title}</h2><p>${l.summary || l.strategy}</p>
      <ol class="stage-links" aria-label="Steps in Lesson ${l.id}">${STAGES.map((s, i) => html`<li><a href="${ctx.lessonLink(l.id, s.id)}"><span class="n" aria-hidden="true">${i + 1}</span> ${s.label}</a></li>`)}</ol>
    </div><a class="btn btn-primary" href="${ctx.lessonLink(l.id, 'learn')}">Start<span class="sr-only"> Lesson ${l.id}</span></a></li>`)}</ol>
    <div class="stage-nav">${back(ctx)}<a class="btn" href="${ctx.actLink('math', 'ch7guide')}">Chapter 7 Study Guide</a></div>`;
}
