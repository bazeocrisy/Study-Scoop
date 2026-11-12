// One view for every lesson and stage (Learn It, Watch Me, Practice Together, Try It Yourself, Test, Parent Guide).
// Pure: it renders the lesson data plus the in-memory progress (state). js/lesson-player.js handles clicks and typing.
import { html } from '../lib/html.js';
import { journeyStepper, journeyCard, journeySummary } from './partition-journey.js';
import { journeyState, doneStages } from '../partition-journey.js';
import { JOURNEY_LESSON, isJourneyStage } from '../lib/partition-journey.js';
import { speak } from '../lib/arith.js';
import { modelFigure } from '../lib/models.js';
import { PLACE } from '../lib/rounding.js';
import { STAGES, STAGE_IDS, answerText, boxes, helpSteps, score, stageLabel, chapterOf } from '../lib/lessons.js';
import { ICONS, facts, scoreLine, subBar } from './common.js';

const ICON_OK = html`<svg class="fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>`;
const ICON_NOT = html`<svg class="fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`;
const ICON_SPEAK = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>`;
const VJOIN = html`<svg class="vjoin" viewBox="0 0 72 18" aria-hidden="true" focusable="false"><path d="M6 3 L36 15 L66 3"/></svg>`;
const NOT_SAVED = 'Your answers are not saved. If you close or refresh this page, this part starts again.';

const hasChapter7Teaching = (lesson) => lesson.chapter === 7 || /^7-[1-7]$/.test(String(lesson.id));

export const stageOf = (stage) => (STAGE_IDS.includes(stage) ? stage : 'learn');

// Chapter 7 teaching release (Lessons 7-2 to 7-7): teach first. Learn It and Watch Me (I Do) and Practice Together (We Do)
// are always open; Try It Yourself (You Do) opens after them, and the Test after Try It Yourself.
export const teachFirst = (lesson) => /^7-[2-7]$/.test(String(lesson?.id));
export const PHASE = { learn: 'I Do', watch: 'I Do', together: 'We Do', try: 'You Do', test: 'Check' };
const NEEDS = { try: ['learn', 'watch', 'together'], test: ['learn', 'watch', 'together', 'try'] };
/** The earlier stages still to finish before a stage opens ([] when it is open). */
export function stageNeeds(lesson, stage, visited) {
  if (!teachFirst(lesson)) return [];
  return (NEEDS[stage] || []).filter((s) => !visited?.has(s));
}
function lockedStage(ctx, lesson, stage, needs) {
  return html`<div class="stage-title"><h2 id="stage-h" tabindex="-1"><span aria-hidden="true">🔒 </span>${stageLabel(stage)} is not open yet</h2></div>
    <div class="card locked-stage"><p>${stage === 'test' ? 'The Test opens after Try It Yourself.' : 'Try It Yourself opens after the teaching parts. Learning the steps first makes the practice work.'}</p>
      <p>Still to finish: ${needs.map((s) => stageLabel(s)).join(', ')}.</p>
      <p><a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, needs[0])}">Go to ${stageLabel(needs[0])} ›</a></p></div>`;
}

/** "Read to me": reads the text aloud with the device's own voice (the player hides it where speech is unavailable). */
export const readButton = (parts, what = 'this') => html`<button type="button" class="read" data-act="read" data-say="${speak([].concat(parts).filter(Boolean).join('. '))}" data-label="Read to me" aria-label="Read to me: ${what}">${ICON_SPEAK}<span class="read-label">Read to me</span></button>`;

/** The cards (screens) a stage steps through. */
export function cardsOf(lesson, stage) {
  if (stage === 'learn') return lesson.learn.screens;
  if (stage === 'watch') return lesson.watch.examples;
  if (stage === 'parent') return [lesson.parent];
  return lesson[stage].items;
}

export function lessonView(ctx) {
  const { lesson } = ctx;
  const stage = stageOf(ctx.stage);
  if (lesson.id === JOURNEY_LESSON) return journeyLessonView(ctx);
  const state = ctx.lessonState || { i: 0, items: {}, steps: {} };
  const needs = stageNeeds(lesson, stage, ctx.lessonVisited);
  if (needs.length) return html`${lessonBar(ctx, lesson, stage)}<div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}" data-locked="true">${lockedStage(ctx, lesson, stage, needs)}</div>`;
  return html`
    ${lessonBar(ctx, lesson, stage)}
    <div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}">
      ${stageBody(ctx, lesson, stage, state)}${lessonHistoryPanel(lesson, state)}
    </div>`;
}

/**
 * Lesson 7-1: one guided journey (sections A to I and a grown-up summary). Its original five stages stay
 * available as optional extra practice, reached from the Check & Reflect section and the summary.
 */
function journeyLessonView(ctx) {
  const { lesson } = ctx;
  const journey = isJourneyStage(lesson.id, ctx.stage), stage = journey ? ctx.stage : stageOf(ctx.stage);
  const jctx = { ...ctx, journeyDone: doneStages(journeyState) };
  // A slim header: the lesson name and one way back, so the activity is the main thing on the screen.
  const top = subBar(ctx, {
    tone: 'math', compact: true, title: `Lesson ${lesson.id}: ${lesson.title}`, goal: stage === 'explore' && !(journeyState.at.explore > 0) ? lesson.goal : '',
    trail: [{ label: 'Chapter 7 Lessons', href: chapterLink(ctx, lesson) }, { label: `Lesson ${lesson.id}` }],
    back: [{ href: chapterLink(ctx, lesson), label: '‹ Back to Lessons' }],
  });
  if (journey) return html`${top}<div class="stage j-stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}">${journeyCard(jctx, stage, journeyState)}</div>`;
  const state = ctx.lessonState || { i: 0, items: {}, steps: {} };
  if (stage === 'parent') return html`${top}${journeyStepper(jctx, 'parent', journeyState.records, { open: true })}
    <div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="parent">${journeySummary(jctx, journeyState)}${extraPractice(ctx, lesson)}${stageBody(ctx, lesson, stage, state)}${lessonHistoryPanel(lesson, state)}</div>`;
  // The original stages keep their own layout, labelled as optional extra practice, with a way back to the journey.
  return html`${subBar(ctx, {
    tone: 'math', eyebrow: `Lesson ${lesson.id} · Extra practice (optional)`, title: lesson.title, goal: '',
    trail: [{ label: 'Math', href: ctx.link('math') }, { label: 'Chapter 7', href: ctx.chapterLink(7) }, { label: 'Chapter 7 Lessons', href: chapterLink(ctx, lesson) }, { label: `Lesson ${lesson.id}` }],
    back: [{ href: chapterLink(ctx, lesson), label: '‹ Back to Lessons' }, { href: ctx.lessonLink(lesson.id, 'explore'), label: '‹ Main lesson' }],
  })}${stageStepper(ctx, lesson, stage, 'Extra practice steps')}
    <div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}">${stageBody(ctx, lesson, stage, state)}${lessonHistoryPanel(lesson, state)}</div>`;
}
function extraPractice(ctx, lesson) {
  return html`<section class="card j-extra" aria-labelledby="j-extra-h"><h2 id="j-extra-h" class="h3">Extra practice (optional)</h2>
    <p>More questions about counting and naming equal parts in strips and circles.</p>
    <p class="btn-row">${STAGES.map((s) => html`<a class="btn" href="${ctx.lessonLink(lesson.id, s.id)}">${s.label}</a>`)}</p></section>`;
}

/** Just the stage area (re-rendered in place after each answer, so the page does not jump). */
export function stageInner(ctx) {
  const state = ctx.lessonState || { i: 0, items: {}, steps: {} };
  return html`${stageBody(ctx, ctx.lesson, stageOf(ctx.stage), state)}${lessonHistoryPanel(ctx.lesson, state)}`;
}

function lessonHistoryPanel(lesson, state) {
  if (chapterOf(lesson.id) !== 7 || !state.history) return '';
  const records = Object.entries(state.history.items || {}), current = Object.values(state.items || {});
  const helped = records.reduce((n, [, v]) => n + v.help, 0), revealed = records.reduce((n, [, v]) => n + v.reveals, 0);
  return html`<details class="card lesson-history"><summary>Parent summary: this visit</summary>
    ${state.stage === 'parent' ? html`<p>Latest activity rounds are listed separately from earlier assistance below. Written reasoning is self-reviewed or parent-reviewed and is not scored for meaning.</p>` : html`<p>Current round: ${current.filter((v) => v.first === 'correct' && !v.scaffoldAssisted).length} questions right on the first attempt without help or counting assistance; ${current.filter((v) => v.first && v.first !== 'correct').length} needing another attempt. Written reasoning is reviewed separately and is not scored for meaning.</p>`}
    ${state.stage === 'parent' && Object.keys(state.history.currentRounds || {}).length ? html`<ul>${Object.entries(state.history.currentRounds).map(([stage, round]) => html`<li>${stageLabel(stage)}, latest round: ${round.right} right on the first attempt; ${round.retry} needing another attempt.</li>`)}</ul>` : ''}
    <p>Across this visit, including earlier rounds: ${helped} help steps opened; ${revealed} answers revealed; ${state.history.restarts} restarts or retakes; ${state.history.missRounds} missed-question rounds. These earlier events remain after a retry.</p>
    ${records.length ? html`<ul>${records.map(([id, r]) => html`<li>${r.label || 'Question'}: ${r.attempts} checked attempts, ${r.help} help steps, ${r.reveals} answer reveals${r.countScaffold ? ', counting scaffold used' : ''}.</li>`)}</ul>` : ''}
    <p>Kept only in this open tab. Closing or refreshing clears this summary.</p></details>`;
}

function lessonBar(ctx, lesson, stage) {
  const at = STAGES.findIndex((s) => s.id === stage);
  return html`
    ${subBar(ctx, {
      tone: 'math', eyebrow: `Lesson ${lesson.id}`, title: lesson.title, goal: stage === 'learn' ? lesson.goal : '',
      trail: [{ label: 'Math', href: ctx.link('math') }, { label: `Chapter ${chapterOf(lesson.id)}`, href: ctx.chapterLink(chapterOf(lesson.id)) }, { label: `Chapter ${chapterOf(lesson.id)} Lessons`, href: chapterLink(ctx, lesson) }, { label: `Lesson ${lesson.id}` }],
      back: [{ href: chapterLink(ctx, lesson), label: '‹ Back to Lessons' }, { href: ctx.chapterLink(chapterOf(lesson.id)), label: `Back to Chapter ${chapterOf(lesson.id)}` }],
    })}
    ${stageStepper(ctx, lesson, stage)}`;
}

function stageStepper(ctx, lesson, stage, label = 'Lesson steps') {
  return html`
    <div class="lesson-steps">
      <nav class="stepper" aria-label="${label}">
        <ol>${STAGES.map((s, i) => {
          const tag = teachFirst(lesson) ? html`<span class="phase-tag">${PHASE[s.id]}</span>` : '';
          if (stageNeeds(lesson, s.id, ctx.lessonVisited).length && s.id !== stage) return html`<li class="locked"><span class="stage-locked"><span class="n">${i + 1}</span> <span class="name"><span aria-hidden="true">🔒 </span>${s.label}</span>${tag}<span class="sr-only"> (opens after the earlier steps)</span></span></li>`;
          return html`<li class="${s.id !== stage && ctx.lessonVisited?.has(s.id) ? 'done' : ''}"><a href="${ctx.lessonLink(lesson.id, s.id)}"${s.id === stage ? html` aria-current="step"` : ''}><span class="n">${i + 1}</span> <span class="name">${s.label}</span>${tag}</a></li>`;
        })}</ol>
      </nav>
    </div>`;
}

/** The questions of a Practice My Misses round (the questions missed in Try It Yourself or in the test). */
export const missItems = (lesson, stage, state) => (state?.misses ? lesson[stage].items.filter((it) => state.misses.ids.includes(it.id)) : []);

function stageBody(ctx, lesson, stage, state) {
  if (stage === 'parent') return parentGuide(ctx, lesson);
  if (state.misses && (stage === 'try' || stage === 'test')) return missesBody(ctx, lesson, stage, state);
  const cards = cardsOf(lesson, stage);
  const label = stageLabel(stage);
  if (stage === 'test' && state.submitted) return testResults(ctx, lesson, state);
  if (stage === 'try' && state.i >= cards.length) return trySummary(ctx, lesson, state);
  const i = Math.min(state.i || 0, cards.length - 1);
  const card = cards[i];
  const what = stage === 'watch' ? 'Example' : stage === 'learn' ? 'Screen' : 'Question';
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">${teachFirst(lesson) ? html`<span class="phase-badge phase-${stage}">${PHASE[stage]}</span> ` : ''}${label}</h2>
      <p class="progress">${what} ${i + 1} of ${cards.length}</p>
    </div>
    ${stage === 'test' && i === 0 ? html`<p class="notice">No hints during the test. Answer every question, then press Finish to see your score.</p>` : ''}
    ${teachFirst(lesson) && stage === 'together' && i === 0 ? html`<p class="notice">We Do: work through these with the help. Press Help any time to see one step at a time.</p>` : ''}
    ${teachFirst(lesson) && stage === 'try' && i === 0 ? html`<p class="notice">You Do: work on your own. Help opens after your first try, and the Parent Guide shows when help was used.</p>` : ''}
    ${stage === 'learn' ? learnCard(lesson, card, state) : stage === 'watch' ? exampleCard(lesson, card, i, state) : itemCard(lesson, card, stage, state)}
    ${stageNav(ctx, lesson, stage, state, i, cards)}`;
}

// ---------------------------------------------------------------- Learn It

function learnCard(lesson, s, state) {
  if (s.item) return html`<h3 class="card-title">${s.title}</h3>${itemCard(lesson, s.item, 'learn', state)}`;
  const pictures = hasChapter7Teaching(lesson) && s.models?.length ? s.models : s.model ? [{ ...s.model, caption: s.caption ?? s.model.caption }] : [];
  const teacher = s.teacher ? (lesson.teacher || []) : [];
  const words = (s.words || []).map((w) => [w, lesson.glossary?.[w]]).filter(([, d]) => d);
  return html`
    <div class="work${pictures.length ? ' has-pic' : ''}">
      ${pictures.length ? html`<div class="card pic-card">${pictures.map((picture) => modelFigure(picture, picture.caption))}</div>` : ''}
      <div class="card">
        <div class="instruct-head"><h3>${s.title}</h3>${readButton([s.title, ...(s.text || []), ...teacher.map((t) => `${t.term}: ${t.def}`), ...(s.pairs || [])], 'this screen')}</div>
        ${(s.text || []).map((t) => html`<p>${t}</p>`)}
        ${teacher.map((t) => html`<blockquote class="teacher-words"><span class="label">Teacher's words: ${t.term}</span><span class="def">${t.def}</span></blockquote>`)}
        ${s.pairs ? html`<div class="pairs">${s.pairs.map((p) => html`<p>${p}</p>`)}</div>` : ''}
        ${words.length ? html`<div class="word-list">${words.map(([w, d]) => html`<span class="chip"><strong>${w}</strong>: ${d}</span>`)}</div>` : ''}
      </div>
    </div>`;
}

// ---------------------------------------------------------------- Watch Me

function exampleCard(lesson, ex, idx, state) {
  const shown = Math.min(state.steps?.[idx] ?? 1, ex.steps.length);
  const step = ex.steps[shown - 1];
  // The picture for the current step: the step's own picture (e.g. the cut before its facts are found),
  // otherwise the example's labelled picture.
  const pictures = hasChapter7Teaching(lesson) ? step.models?.length ? step.models : step.model ? [step.model] : ex.models?.length ? ex.models : ex.model ? [ex.model] : [] : [step.model || ex.model].filter(Boolean);
  const done = shown >= ex.steps.length;
  const word = ex.steps.slice(0, shown).map((s) => s.word).filter(Boolean).pop();
  const whyState = state.items?.[ex.why?.id];
  const another = ex.another ? (ex.another.models || [ex.another.model]) : [];
  return html`
    <div class="work${pictures.length ? ' has-pic' : ''}">
      ${pictures.length ? html`<div class="card pic-card">${pictures.map((picture) => modelFigure(picture, hasChapter7Teaching(lesson) ? picture.caption : undefined))}</div>` : ''}
      <div class="card">
        <div class="instruct-head"><h3>${ex.title}</h3>${readButton([ex.title, ...(hasChapter7Teaching(lesson) && ex.teaching ? [step] : ex.steps.slice(0, shown)).map((s) => (s.eq ? `${s.say} ${s.eq}` : s.say))], 'these steps')}</div>
        ${hasChapter7Teaching(lesson) && ex.teaching ? html`<div class="visual-coach watch-coach"><p class="coach-progress">Step ${shown} of ${ex.steps.length}</p><p class="coach-instruction">${step.say}${step.eq ? html`<span class="eq">${step.eq}</span>` : ''}</p>${shown > 1 ? html`<details><summary>Review earlier steps</summary><ol>${ex.steps.slice(0, shown - 1).map((s) => html`<li>${s.say}</li>`)}</ol></details>` : ''}</div>` : html`<ol class="steps">
          ${ex.steps.slice(0, shown).map((s, k) => html`
            <li class="${k === shown - 1 ? 'now' : ''}"><span class="sn" aria-hidden="true">${k + 1}</span>
              <span>${s.say}${s.eq ? html`<span class="eq">${s.eq}</span>` : ''}</span></li>`)}
        </ol>`}
        ${word && lesson.glossary?.[word] ? html`<p><span class="chip"><strong>${word}</strong>: ${lesson.glossary[word]}</span></p>` : ''}
        <div class="btn-row step-row">
          <button type="button" class="btn" data-act="step-back"${shown <= 1 ? ' disabled' : ''}>‹ Back</button>
          <p class="progress">Step ${shown} of ${ex.steps.length}</p>
          ${done ? '' : html`<button type="button" class="btn btn-primary" data-act="step-next">Next step ›</button>`}
        </div>
      </div>
    </div>
    ${done && another.length ? html`<div class="card"><p>${ex.another.text}</p><div class="models">${another.map((m) => modelFigure(m))}</div></div>` : ''}
    ${done && ex.why ? itemCard(lesson, ex.why, 'watch', state) : ''}
    ${done && whyState?.status === 'correct' && lesson.watch.takeaway && idx === lesson.watch.examples.length - 1
      ? html`<p class="takeaway">${lesson.watch.takeaway}</p>` : ''}`;
}

// ---------------------------------------------------------------- questions

/** What "Read to me" says for a question: the prompt, the equation lines and the answer choices. */
function sayItem(item) {
  const parts = [item.prompt];
  if (item.lines) parts.push(item.lines.join(' '));
  if (item.type === 'decompose') parts.push(`${item.fact[0]} × ${item.fact[1]} = [p] × [q] + [r] × [s] = [t]`);
  if (item.options) item.options.forEach((o, k) => parts.push(`Choice ${k + 1}: ${o.text}`));
  if (item.context) parts.push(item.context.replace(/_+/g, 'blank'));
  if (item.bank) parts.push(`Word bank: ${item.bank.join(', ')}`);
  return parts;
}

/** Chapter 7 authored visual teaching; legacy lessons keep their existing Help contract. */
export function lessonHelpSteps(lesson, item) {
  if (hasChapter7Teaching(lesson) && item.teaching?.steps?.length) return item.teaching.steps.map((s, i, list) => ({ ...s, kind: i === list.length - 1 ? 'show' : 'hint' }));
  return helpSteps(item);
}
export function teachingFeedbackFor(lesson, item, response, status) {
  if (!hasChapter7Teaching(lesson) || !item.teaching) return null;
  const option = item.options?.[Number(response?.choice)]?.text;
  if (status === 'correct') return item.teaching.correct;
  const answer = String(response?.answer ?? '').trim();
  const sameInteger = (value) => /^[-+]?\d+$/.test(answer) && /^[-+]?\d+$/.test(String(value)) && BigInt(answer) === BigInt(String(value));
  const wrong = item.teaching.wrong || [];
  const int = (value) => /^[-+]?\d+$/.test(String(value ?? '').trim()) ? BigInt(String(value).trim()) : null;
  const n = int(response?.n), d = int(response?.d), en = int(item.answer?.n), ed = int(item.answer?.d);
  const fraction = n !== null && d !== null && en !== null && ed !== null;
  const integer = /^[-+]?\d+$/.test(answer) ? BigInt(answer) : null;
  const expected = /^[-+]?\d+$/.test(String(item.answer)) ? BigInt(item.answer) : null;
  const matches = {
    zeroDenominator: fraction && d === 0n,
    zeroNumerator: fraction && n === 0n && d > 0n,
    equivalentPartition: fraction && d > 0n && item.answerPolicy === 'partition' && n * ed === en * d && (n !== en || d !== ed),
    reversed: fraction && n === ed && d === en && en !== ed,
    numeratorOnly: fraction && n !== en && d === ed,
    denominatorOnly: fraction && n === en && d !== ed,
    selectedOnly: integer !== null && integer === BigInt(item.model?.selected?.length || 0),
    insideLines: integer !== null && item.model?.kind === 'bar' && integer === BigInt(item.model.parts - 1),
    tooLow: integer !== null && expected !== null && integer < expected,
    tooHigh: integer !== null && expected !== null && integer > expected,
  };
  return wrong.find((s) => s.option !== undefined && s.option === option)
    || ['zeroDenominator', 'zeroNumerator'].map((kind) => matches[kind] && wrong.find((s) => s.when === kind)).find(Boolean)
    || wrong.find((s) => s.answer !== undefined && sameInteger(s.answer))
    || wrong.find((s) => s.response && Object.entries(s.response).every(([key, value]) => int(response?.[key]) !== null && int(response?.[key]) === int(value)))
    || ['equivalentPartition', 'reversed', 'numeratorOnly', 'denominatorOnly', 'selectedOnly', 'insideLines', 'tooLow', 'tooHigh'].map((kind) => matches[kind] && wrong.find((s) => s.when === kind)).find(Boolean)
    || wrong.find((s) => s.when === 'default' || (s.option === undefined && s.answer === undefined && s.response === undefined && s.when === undefined));
}
export function coachModels(step) {
  const models = step?.models?.length ? step.models : step?.model ? [step.model] : [];
  return html`${models.map((model) => modelFigure(model, model.caption))}`;
}
export function countPartsFor(lesson, item) {
  return hasChapter7Teaching(lesson) && item.teaching?.count ? item.teaching.count.parts || [] : [];
}
export function countComplete(lesson, item, st) {
  const parts = countPartsFor(lesson, item);
  return parts.every((p) => (st.counted || []).includes(p));
}
function countScaffold(lesson, item, st) {
  const parts = countPartsFor(lesson, item); if (!parts.length) return '';
  const seen = st.counted || [];
  return html`<section class="count-scaffold" aria-label="Count the parts before answering">
    <h3>Touch and count</h3><p>${item.teaching.count.prompt}</p>
    <div class="btn-row">${parts.map((p, i) => html`<button type="button" class="btn${seen.includes(p) ? ' is-counted' : ''}" data-act="count-part" data-part="${p}" aria-pressed="${seen.includes(p) ? 'true' : 'false'}" aria-label="Part ${i + 1}${seen.includes(p) ? ', counted' : ', tap to count'}">${seen.includes(p) ? '✓ ' : ''}Part ${i + 1}</button>`)}</div>
    <p class="count-status" role="status">${seen.length} of ${parts.length} parts counted.${countComplete(lesson, item, st) ? ' Now write your answer.' : ' Tap each part once before answering.'}</p>
  </section>`;
}
/** One question with its answer boxes or choices, feedback, and Help (one step at a time, after a wrong answer). */
export function itemCard(lesson, item, stage, state) {
  const st = state.items?.[item.id] || {};
  const test = stage === 'test';
  const writtenReview = chapterOf(lesson.id) === 7 && item.type === 'sentence' && !test;
  const resp = st.resp || {};
  const done = !test && (st.status === 'correct' || st.shown);
  const steps = test ? [] : lessonHelpSteps(lesson, item);
  const opened = st.shown ? steps.length : Math.min(st.help || 0, steps.length);
  const questionHelp = lesson.id === '7-1';
  const helpAllowed = !test && !done && (questionHelp || (st.tries || 0) >= 1 || (stage === 'together' && teachFirst(lesson))) && opened < steps.length;
  const helpLabel = questionHelp ? (opened === 0 ? '? Hint' : opened === steps.length - 1 ? '? Show Answer' : '? Show Steps') : (opened ? 'Next step' : 'Help');
  const coached = hasChapter7Teaching(lesson) && item.teaching && !test;
  const countReady = test || countComplete(lesson, item, st);
  const feedbackMode = coached && st.coachView === 'feedback' && st.teachingFeedback;
  const activeCoach = feedbackMode || (coached && st.coachView !== 'answer' && opened ? steps[Math.min(opened, steps.length) - 1] : null);
  const pics = (activeCoach?.models?.length || activeCoach?.model) ? [] : item.models || (item.model ? [{ ...item.model, ...(coached && item.teaching.count ? { counted: st.counted || [] } : {}) }] : []);
  const inline = item.type === 'number' && /=\s*\?\s*$/.test(item.prompt);
  return html`
    <div class="work${pics.length ? ' has-pic' : ''}">
      ${pics.length ? html`<div class="card pic-card"><div class="models">${pics.map((m) => modelFigure(m, m.caption))}</div></div>` : ''}
      <form class="card question" data-act="check" data-item="${item.id}" data-state="${st.status || 'unanswered'}" novalidate>
        <div class="instruct-head">${item.type === 'choice' || item.type === 'multi' || inline ? html`<span></span>` : html`<p class="prompt" id="q-${item.id}">${blanks(item.prompt)}</p>`}${item.type === 'spell' || item.type === 'letters' ? '' : readButton(sayItem(item), 'the question')}</div>
        ${coached && !activeCoach ? countScaffold(lesson, item, st) : ''}
        ${writtenReview ? writtenReviewArea(item, st, lesson.id === '7-1') : !countReady ? html`<fieldset disabled class="count-answer-gate"><legend>Count the parts above before answering</legend>${answerArea(item, resp, st, test, done)}</fieldset>` : answerArea(item, resp, st, test, done)}
        ${test || writtenReview ? '' : html`
          <div class="btn-row">
            ${done ? '' : html`<button type="submit" class="btn btn-primary"${countReady ? '' : ' disabled'}>Check Answer</button>`}
            ${helpAllowed ? html`<button type="button" class="btn btn-help" data-act="help" aria-label="${questionHelp ? `${helpLabel.replace('? ', '')} for this question, step ${opened + 1} of ${steps.length}` : opened ? `Next step, step ${opened + 1} of ${steps.length}` : `Help, step 1 of ${steps.length}`}">${helpLabel}</button>` : ''}
          </div>`}
        ${!test && !writtenReview && opened && !feedbackMode && st.coachView !== 'answer' ? helpPanel(item, steps, opened, st.shown, done, coached, (st.tries || 0) > 0) : ''}
        ${!test && !writtenReview && st.say && (!coached || feedbackMode || !opened) ? feedbackPanel(item, st, opened, coached) : ''}
      </form>
    </div>`;
}

function writtenReviewArea(item, st, questionHelp = false) {
  const compared = st.comparedRevision === (st.revision || 0), reviewed = st.reviewedRevision === (st.revision || 0);
  const help = st.writingHelp || 0;
  return html`<label for="${item.id}-text">Write your own explanation</label>
    <textarea class="box text sentence" id="${item.id}-text" name="text" rows="5" maxlength="600"${st.status === 'empty' ? html` aria-invalid="true"` : ''}>${val(st.resp || {}, 'text')}</textarea>
    ${questionHelp ? html`<button type="button" class="btn btn-help" data-act="writing-help">? ${help === 0 ? 'Hint' : help === 1 ? 'Show Steps' : help === 2 ? 'Show Answer' : 'Review example'}</button>
      ${help ? html`<section class="visual-coach" data-written-help tabindex="-1"><h3>${help === 1 ? 'Hint: find the whole' : help === 2 ? 'Show Steps: compare areas' : 'One sample explanation'}</h3>
        ${modelFigure({ type: 'fraction', kind: 'bar', parts: help === 1 ? 1 : 4, wholes: 1, selected: help === 1 ? [0] : help === 2 ? [0, 1] : [0, 1, 2, 3] })}
        <p>${help === 1 ? 'Trace the outside edge. Include every part inside this one whole.' : help === 2 ? 'Compare two pieces. Their widths match and their heights match. Check the other pieces too; matching widths and heights give matching areas.' : item.example}</p><p>Use your own words. A grown-up reviews your mathematical explanation.</p></section>` : ''}` : ''}
    <p>This explanation is reviewed by you or a grown-up. The computer does not grade its mathematical meaning.</p>
    <button class="btn btn-primary" type="submit">Compare my response with an example</button>
    ${st.status === 'empty' ? html`<p class="feedback info">${st.say}</p>` : ''}
    ${compared ? html`<section data-written-review id="fb-${item.id}" class="card"><h3>Compare and review</h3><p><strong>One example:</strong> ${item.example}</p>
      <fieldset><legend>You or a grown-up: review this version of your response</legend>
        ${[['whole', 'I identified the whole or the quantities in the question.'], ['reason', 'I explained why my answer makes sense, using the model or an example.'], ['compare', 'I compared my reasoning with the example, or asked a grown-up to review it.']].map(([key, label]) => html`<label class="choice"><input type="checkbox" data-review-check="${key}"${st.reviewChecks?.[key] ? ' checked' : ''}> ${label}</label>`)}
      </fieldset><button type="button" class="btn" data-act="review-written">Finish my review</button>
      ${reviewed ? html`<p data-written-complete role="status">Review completed for this response. This is not a computer grade for mathematical meaning.</p>` : ''}</section>` : ''}`;
}

/** A written blank ("___") drawn as a line; screen readers say "blank" instead of a row of underscores. */
export function blanks(text) {
  return String(text).split(/(_{3,})/).map((p, k) => (k % 2
    ? html`<span class="blank"><span aria-hidden="true">${p}</span><span class="sr-only">blank</span></span>` : facts(p)));
}

/** A button that speaks (dictation and the word in Missing Letters); its label turns into "Stop" while it speaks. */
export function soundButton(act, label, primary = false) {
  return html`<button type="button" class="btn${primary ? ' btn-primary' : ''} sound" data-act="${act}" data-label="${label}">${ICON_SPEAK}<span class="read-label">${label}</span></button>`;
}

/**
 * Rounding the class way: tap the digit in the place you round to (it is underlined and an arrow appears on the
 * digit to its right), choose go up or stay the same, then write the rounded number. The underline and arrow are
 * drawn by the stylesheet from the chosen radio button, so they appear as soon as a digit is tapped.
 */
function roundArea(item, resp, st, done) {
  const digits = String(item.n);
  const marked = (name) => (st.status === 'notyet' || st.status === 'empty') && st.wrong?.includes(name);
  const dis = done ? ' disabled' : '';
  const dirs = [['up', 'Go up'], ['stay', 'Stay the same']];
  return html`<div class="round-work">
    <p class="round-step" id="q-${item.id}"><span class="sn" aria-hidden="true">1</span><span>Tap the digit in the <strong>${PLACE[item.to]} place</strong> to underline it.</span></p>
    <fieldset class="round-digits${marked('place') ? ' is-marked' : ''}" role="radiogroup"${marked('place') ? html` aria-invalid="true"` : ''}>
      <legend class="sr-only">Which digit of ${digits} is in the ${PLACE[item.to]} place?</legend>
      ${[...digits].map((d, k) => html`<input type="radio" class="dg-in" name="place" id="${item.id}-d${k}" value="${k}"${String(resp.place) === String(k) ? ' checked' : ''}${dis}><label class="digit" for="${item.id}-d${k}"><span class="sr-only">Digit ${k + 1} of ${digits.length}: </span>${d}</label>`)}
    </fieldset>
    <p class="round-step"><span class="sn" aria-hidden="true">2</span><span>The arrow points to the next digit. <strong>5 or more, go up. 4 or less, stay the same.</strong></span></p>
    <fieldset class="choices round-dir${marked('dir') ? ' is-marked' : ''}"><legend class="sr-only">Go up or stay the same?</legend>
      ${dirs.map(([v, label]) => {
        const chosen = resp.dir === v;
        const cls = chosen && st.status === 'notyet' && marked('dir') ? ' is-wrong' : chosen && done ? ' is-right' : '';
        return html`<label class="choice${cls}"><input type="radio" name="dir" value="${v}"${chosen ? ' checked' : ''}${dis}> <span>${label}</span></label>`;
      })}
    </fieldset>
    <p class="round-step"><span class="sn" aria-hidden="true">3</span><span>Write the rounded number.</span></p>
    <div class="eqlines"><span class="eqline"><span>${digits} rounds to</span>${box(item, 'answer', `${digits} rounded to the nearest ${item.to}`, resp, st, done)}</span></div>
  </div>`;
}

function feedbackPanel(item, st, opened = 0, coached = false) {
  if (coached && st.teachingFeedback && st.coachView === 'feedback' && ['correct', 'notyet'].includes(st.status)) {
    const step = st.teachingFeedback;
    return html`<div class="feedback ${st.status === 'correct' ? 'ok' : 'notyet'} visual-coach" id="fb-${item.id}" data-coach="feedback">
      <div class="fb-head"><h3 tabindex="-1" data-coach-heading>${st.status === 'correct' ? 'Yes — here is why' : 'Look at this part again'}</h3>${readButton(step.text, 'the explanation')}</div>
      <div class="coach-model">${coachModels(step)}</div><p class="coach-instruction">${step.text}</p>${st.status === 'notyet' ? html`<button type="button" class="btn btn-primary" data-act="coach-retry">Try again</button>` : ''}</div>`;
  }
  const id = `fb-${item.id}`;
  // Once Help is open the "press Help" reminder is out of date.
  if (opened) st = { ...st, say: String(st.say).replace(' Press Help to see one step at a time.', '') };
  // A written sentence is checked for its parts only, so it is never marked "right": it is compared with an example.
  if (st.status === 'correct' && item.type === 'sentence') return html`<div class="feedback info compare" id="${id}"><div class="fb-head"><span class="fb-title">Compare your answer</span>${readButton(st.say, 'the example answer')}</div>
    <p class="fb-why">${st.say}</p></div>`;
  if (st.status === 'correct') return html`<div class="feedback ok" id="${id}">${ICON_OK}<span class="fb-title">${st.say}</span></div>`;
  if (st.status === 'empty') return html`<div class="feedback info" id="${id}"><span>${st.say}</span></div>`;
  return html`<div class="feedback notyet" id="${id}"><div class="fb-head">${ICON_NOT}<span class="fb-title">Not yet</span>${readButton(['Not yet', st.say], 'why it is not right')}</div>
    <p class="fb-why">${st.say}</p></div>`;
}

/** The Help steps opened so far; when the last one is open the answer is filled in. */
function helpPanel(item, steps, opened, finished, done, coached = false, tried = true) {
  if (coached) {
    const step = steps[Math.min(opened, steps.length) - 1];
    return html`<section class="feedback info help-panel visual-coach" id="help-${item.id}" data-coach="help" aria-label="Visual help">
      <h3 tabindex="-1" data-coach-heading class="coach-progress">Step ${opened} of ${steps.length}${finished ? ': put it together' : ''}</h3>
      <div class="coach-model">${coachModels(step)}</div><p class="coach-instruction">${step.text}</p>${readButton(step.text, 'this teaching step')}
      ${opened > 1 ? html`<details><summary>Review earlier steps</summary><ol>${steps.slice(0, opened - 1).map((s) => html`<li>${s.text}</li>`)}</ol></details>` : ''}
      ${done ? '' : html`<p>Try your answer now, or go to the next teaching step.</p><button type="button" class="btn btn-primary" data-act="coach-retry">${tried ? 'Try again' : 'Try it'}</button>`}
    </section>`;
  }
  const shownSteps = steps.slice(0, opened);
  const title = finished ? "Here's how" : `Help: step ${opened} of ${steps.length}`;
  return html`<div class="feedback info help-panel" id="help-${item.id}">
    <div class="fb-head"><span class="fb-title">${title}</span>${readButton(shownSteps.slice(-1).map((s) => s.text), 'this help step')}</div>
    <ol class="help-steps">${shownSteps.map((s, k) => html`<li class="${k === opened - 1 && !finished ? 'is-new' : ''}">${s.text}</li>`)}</ol>
    ${done ? '' : html`<p class="help-more">Try the question again, or press Next step.</p>`}
  </div>`;
}

const val = (resp, k) => (resp[k] === undefined ? '' : String(resp[k]));

function box(item, name, label, resp, st, done) {
  const marked = (st.status === 'notyet' || st.status === 'empty') && (st.wrong ? st.wrong.includes(name) : st.status === 'notyet');
  return html`<input class="box${name === 't' || name === 'answer' ? ' wide' : ''}${done ? ' is-right' : ''}" name="${name}" id="${item.id}-${name}"
    inputmode="numeric" autocomplete="off" maxlength="4" aria-label="${label}" value="${val(resp, name)}"${marked ? html` aria-invalid="true"` : ''}${done ? ' readonly' : ''}>`;
}

/** An equation line with answer boxes. Each "a × b" fact stays together on one line ("term"). */
function eqLine(item, line, resp, st, done, n) {
  const spoken = speak(item.lines.join(' '));
  const tokens = String(line).trim().split(/\s+/);
  // Group "x × y" (numbers or boxes) into one term so a fact never breaks across lines.
  const groups = [];
  for (let k = 0; k < tokens.length; k++) {
    if (tokens[k + 1] === '×' && tokens[k + 2] !== undefined) { groups.push([tokens[k], '×', tokens[k + 2]]); k += 2; } else groups.push([tokens[k]]);
  }
  const piece = (tok) => {
    const m = /^\[([a-z][a-z0-9]*)\]$/.exec(tok);
    return m ? box(item, m[1], `Box ${boxes(item).indexOf(m[1]) + 1} of ${n} in: ${spoken}`, resp, st, done) : html`<span>${tok}</span>`;
  };
  return html`<span class="eqline">${groups.map((g) => (g.length === 3 ? html`<span class="term">${g.map(piece)}</span>` : piece(g[0])))}</span>`;
}

function answerArea(item, resp, st, test, done) {
  const n = boxes(item).length;
  if (item.type === 'choice') {
    return html`<fieldset class="choices"><legend id="q-${item.id}">${blanks(item.prompt)}</legend>
      ${item.options.map((o, k) => {
        const chosen = String(resp.choice) === String(k);
        const cls = !test && chosen && st.status === 'correct' ? ' is-right' : !test && chosen && st.status === 'notyet' ? ' is-wrong' : '';
        return html`<label class="choice${cls}"><input type="radio" name="choice" value="${k}"${chosen ? ' checked' : ''}${done ? ' disabled' : ''}> <span>${facts(o.text)}</span></label>`;
      })}</fieldset>`;
  }
  if (item.type === 'round') return roundArea(item, resp, st, done);
  if (item.type === 'multi') {
    // "Circle all that apply": check boxes; a wrong choice is marked when the answer is checked.
    const chosen = String(resp.multi ?? '').split(',').filter((x) => x !== '');
    return html`<fieldset class="choices multi"><legend id="q-${item.id}">${blanks(item.prompt)} <span class="multi-note">Choose all that are right.</span></legend>
      ${item.options.map((o, k) => {
        const on = chosen.includes(String(k));
        const cls = !test && on && st.status === 'notyet' && !o.correct ? ' is-wrong' : !test && on && done ? ' is-right' : '';
        return html`<label class="choice${cls}"><input type="checkbox" name="multi" value="${k}"${on ? ' checked' : ''}${done ? ' disabled' : ''}> <span>${facts(o.text)}</span></label>`;
      })}</fieldset>`;
  }
  if (item.type === 'blanks') {
    // Each box is named by its place in the line ("Box 2 of 2 in: 47 is between blank and blank"), and a full stop
    // after a box stays with it on a narrow screen.
    return html`<div class="blank-lines" role="group" aria-labelledby="q-${item.id}">
      ${item.text.map((line) => {
        const parts = String(line).split(/(\[[a-z][a-z0-9]*\])/);
        const count = (parts.length - 1) / 2;
        return html`<p class="blank-line">${parts.map((part, k) => {
          if (k % 2 === 0) return k > 0 && /^[.,!?]/.test(part) ? part.slice(1) : part;
          const name = part.slice(1, -1);
          const tail = /^[.,!?]/.test(parts[k + 1] || '') ? parts[k + 1][0] : '';
          const label = count > 1 ? `Box ${(k + 1) / 2} of ${count} in: ${speak(line)}` : speak(line);
          return html`<span class="nobr">${box(item, name, label, resp, st, done)}${tail}</span>`;
        })}</p>`;
      })}
    </div>`;
  }
  if (item.type === 'sentence') {
    const marked = (st.status === 'notyet' || st.status === 'empty') && st.wrong?.includes('text');
    return html`<p class="word-answer sentence-answer"><label for="${item.id}-text">Write your answer in a complete sentence</label>
      <textarea class="box text sentence${done ? ' is-compared' : ''}" name="text" id="${item.id}-text" rows="5" maxlength="300" autocapitalize="sentences"
        spellcheck="true"${marked ? html` aria-invalid="true"` : ''}${done ? ' readonly' : ''}>${val(resp, 'text')}</textarea></p>`;
  }
  if (item.type === 'fraction') {
    return html`<fieldset class="fraction-answer"><legend>Write the fraction</legend>
      <label for="${item.id}-n">Numerator (top number)</label>${box(item, 'n', 'Numerator, top number', resp, st, done)}
      <span class="fraction-bar" aria-hidden="true"></span>
      <label for="${item.id}-d">Denominator (bottom number)</label>${box(item, 'd', 'Denominator, bottom number', resp, st, done)}
    </fieldset>`;
  }
  if (item.type === 'number') {
    const fact = /^(.*=)\s*\?\s*$/.exec(item.prompt);
    return html`<div class="eqlines"><span class="eqline">${fact ? html`<span id="q-${item.id}">${fact[1]}</span>` : ''}${box(item, 'answer', fact ? `Answer: ${speak(item.prompt.replace(/\?\s*$/, 'blank'))}` : `Answer: ${speak(item.prompt)}`, resp, st, done)}</span></div>`;
  }
  if (item.type === 'fill') {
    return html`<div class="eqlines" role="group" aria-labelledby="q-${item.id}">
      ${item.lines.map((l, k) => html`${k ? VJOIN : ''}${eqLine(item, l, resp, st, done, n)}`)}
    </div>`;
  }
  if (item.type === 'decompose') {
    const [a, b] = item.fact;
    const where = `for ${a} times ${b}`;
    return html`<div class="eqlines" role="group" aria-labelledby="q-${item.id}">
      <span class="eqline"><span>${a} × ${b} =</span>
        <span class="term">${box(item, 'p', `First fact, first number, ${where}`, resp, st, done)}<span>×</span>${box(item, 'q', `First fact, second number, ${where}`, resp, st, done)}</span>
        <span>+</span>
        <span class="term">${box(item, 'r', `Second fact, first number, ${where}`, resp, st, done)}<span>×</span>${box(item, 's', `Second fact, second number, ${where}`, resp, st, done)}</span></span>
      ${VJOIN}
      <span class="eqline"><span>=</span>${box(item, 't', `Total ${where}`, resp, st, done)}</span>
    </div>`;
  }
  if (item.type === 'word' || item.type === 'spell') {
    // Typed words: no spell-check, autocorrect or suggestions, so the browser never gives the spelling away.
    const marked = (st.status === 'notyet' || st.status === 'empty') && st.wrong?.includes('text');
    const label = item.type === 'spell' ? 'Type the word you hear' : item.blank === false ? 'Type the new word' : 'Type the missing word';
    return html`
      ${item.type === 'spell' ? html`<div class="dictate">
        ${soundButton('dictate', 'Hear the word and sentence', true)}
        ${soundButton('say-word', 'Replay word')}
        <button type="button" class="btn" data-act="no-sound">I can't hear it</button>
      </div>
      <p class="dictate-fallback" hidden><span class="label">No sound</span> ${blanks(item.fallback)}</p>` : ''}
      ${item.bank ? html`<p class="bank" role="group" aria-label="Word bank: press a word to put it in the answer box"><span class="label" aria-hidden="true">Word bank</span> ${item.bank.map((w) => html`<button type="button" class="chip bank-word" data-act="bank" data-word="${w}"${done ? ' disabled' : ''}>${w}</button>`)}</p>` : ''}
      <p class="word-answer"><label for="${item.id}-text">${label}</label>
        <input class="box text${done ? ' is-right' : ''}" name="text" id="${item.id}-text" type="text" autocomplete="off" autocapitalize="off"
          autocorrect="off" spellcheck="false" maxlength="30" value="${val(resp, 'text')}"${marked ? html` aria-invalid="true"` : ''}${done ? ' readonly' : ''}></p>`;
  }
  if (item.type === 'letters') {
    const spoken = [...item.word].map((ch, k) => (item.blanks.includes(k) ? 'blank' : ch)).join(', ');
    const n = item.blanks.length;
    return html`
      ${item.say ? html`<div class="dictate">${soundButton('say-word', 'Hear the word', true)}</div>` : ''}
      ${item.context ? html`<p class="context">${blanks(item.context)}</p>` : ''}
      <p class="letters" role="group" aria-label="The word: ${spoken}">${[...item.word].map((ch, k) => {
        const at = item.blanks.indexOf(k);
        if (at < 0) return html`<span class="lt" aria-hidden="true">${ch}</span>`;
        const name = `l${at}`;
        const marked = (st.status === 'notyet' || st.status === 'empty') && st.wrong?.includes(name);
        return html`<input class="box letter${done ? ' is-right' : ''}" name="${name}" id="${item.id}-${name}" type="text" maxlength="1" autocomplete="off"
          autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Missing letter ${at + 1} of ${n}" value="${val(resp, name)}"${marked ? html` aria-invalid="true"` : ''}${done ? ' readonly' : ''}>`;
      })}</p>`;
  }
  if (item.type === 'table') {
    return html`<div class="table-scroll"><table class="table-item"><thead><tr>${item.headers.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead>
      <tbody>${item.rows.map((row, i) => html`<tr>${row.map((c, j) => (typeof c === 'object'
        ? html`<td>${box(item, `r${i}c${j}`, `${item.headers[j]} for ${row[0]}`, resp, st, done)}</td>`
        : html`<td>${c}</td>`))}</tr>`)}</tbody></table></div>`;
  }
  return '';
}

// ---------------------------------------------------------------- stage navigation, summary, results

function stageNav(ctx, lesson, stage, state, i, cards) {
  const idx = STAGES.findIndex((s) => s.id === stage);
  const nextStage = STAGES[idx + 1];
  const last = i >= cards.length - 1;
  const card = cards[i];
  let ready = true;
  let why = '';
  if (stage !== 'test') {
    const item = stage === 'watch' ? (card.why || null) : stage === 'learn' ? card.item : card;
    const st = item ? state.items?.[item.id] : null;
    if (stage === 'watch') {
      const stepsDone = (state.steps?.[i] ?? 1) >= card.steps.length;
      ready = stepsDone && (!item || st?.status === 'correct' || Boolean(st?.shown));
      why = stepsDone ? 'Answer the question to go on.' : 'Finish the steps to go on.';
    } else if (item) {
      ready = st?.status === 'correct' || Boolean(st?.shown);
      why = 'Answer the question to go on.';
    }
  }
  const wait = ready ? '' : html`<span class="hint" id="next-why">${why}</span>`;
  const descr = ready ? '' : html` aria-describedby="next-why"`;
  const okFor = stage === 'test' ? null : (stage === 'watch' ? card.why : stage === 'learn' ? card.item : card);
  const fbRef = okFor && state.items?.[okFor.id]?.status === 'correct' ? html` aria-describedby="fb-${okFor.id}"` : '';
  let next;
  if (stage === 'test') {
    next = last ? html`<button type="button" class="btn btn-primary" data-act="submit">${state.warned ? 'Finish anyway' : 'Finish the test'}</button>`
      : html`<button type="button" class="btn btn-primary" data-act="next">Next question ›</button>`;
  } else if (!last) {
    next = html`<button type="button" class="btn btn-primary" data-act="next"${ready ? fbRef : html` disabled${descr}`}>${stage === 'watch' ? 'Next example ›' : 'Next ›'}</button>`;
  } else if (stage === 'try') {
    next = html`<button type="button" class="btn btn-primary" data-act="next"${ready ? fbRef : html` disabled${descr}`}>See my results ›</button>`;
  } else {
    next = ready ? html`<a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, nextStage.id)}"${fbRef}>Next: ${nextStage.label} ›</a>`
      : html`<button type="button" class="btn btn-primary" disabled${descr}>Next: ${nextStage.label} ›</button>`;
  }
  const streak = stage === 'together' && state.streak >= 3 && !last && !teachFirst(lesson)
    ? html`<p class="feedback ok">${ICON_OK}<span class="fb-title">3 in a row! You can keep practicing, or go on to <a href="${ctx.lessonLink(lesson.id, 'try')}">Try It Yourself</a>.</span></p>` : '';
  const blanks = stage === 'test' && state.warned ? unanswered(cards, state) : [];
  return html`${streak}
    ${blanks.length ? html`<div class="notice" id="test-warning" tabindex="-1"><p><strong>${blanks.length === 1 ? '1 question has' : `${blanks.length} questions have`} no answer.</strong> You can go back to ${blanks.length === 1 ? 'it' : 'them'}, or finish anyway.</p>
      <p class="btn-row">${blanks.map((k) => html`<button type="button" class="btn" data-act="goto" data-to="${k}">Go to question ${k + 1}</button>`)}</p></div>` : ''}
    <div class="stage-nav">
      ${i > 0 ? html`<button type="button" class="btn" data-act="back">‹ Back</button>`
        : idx > 0 ? html`<a class="btn" href="${ctx.lessonLink(lesson.id, STAGES[idx - 1].id)}">‹ ${STAGES[idx - 1].label}</a>` : html`<span></span>`}
      <span class="next-wrap">${wait}${next}</span>
    </div>
    <p class="hint">${NOT_SAVED} <a href="${ctx.lessonLink(lesson.id, 'parent')}">Parent Guide</a></p>`;
}

/** Positions (0-based) of test questions with no answer yet. */
export function unanswered(items, state) {
  return items.map((it, k) => [it, k]).filter(([it]) => {
    const r = state.items?.[it.id]?.resp || {};
    return it.type === 'choice' ? r.choice === undefined : boxes(it).some((b) => !String(r[b] ?? '').trim());
  }).map(([, k]) => k);
}

/** Where a finished lesson stage can go: Back to Lessons and Home (with its icon and its word). */
function lessonExits(ctx) {
  return html`<a class="btn" href="${chapterLink(ctx, ctx.lesson)}">‹ Back to Lessons</a>
    <a class="btn" href="${ctx.link('week')}">${ICONS.home}<span>Home</span></a>`;
}

/** A lesson's own chapter lesson list (Math > Chapter N > Chapter N Lessons). */
const chapterLink = (ctx, lesson) => ctx.actLink('math', `ch${chapterOf(lesson?.id) || 5}`);

/** The lesson after this one in its chapter (for "what next?"), or null for the last lesson. */
function nextLesson(ctx, lesson) {
  const list = (ctx.lessons?.lessons || []).filter((l) => chapterOf(l.id) === chapterOf(lesson.id));
  const k = list.findIndex((l) => l.id === lesson.id);
  return k >= 0 && k < list.length - 1 ? list[k + 1] : null;
}

/** "Practice My Misses (2)": the number is shown, and read out as "2 questions" (not "left paren 2"). */
const countLabel = (label, n) => html`${label} <span aria-hidden="true">(${n})</span><span class="sr-only">: ${n} question${n === 1 ? '' : 's'}</span>`;

/** The main "what next" for a finished lesson test: retake when not passed; the next lesson when passed;
 *  after the last lesson, the Study Guide and the Math Practice Test. */
function testNext(ctx, lesson, passed) {
  const next = nextLesson(ctx, lesson);
  if (!passed) return { text: 'Then take the test again.', main: html`<button type="button" class="btn btn-primary" data-act="restart">Take the test again</button>`, retakeSecondary: false };
  if (next) return { text: `When you are ready, go on to Lesson ${next.id}: ${next.title}.`, main: html`<a class="btn btn-primary" href="${ctx.lessonLink(next.id, 'learn')}">Next: Lesson ${next.id} ›</a>`, retakeSecondary: true };
  // The last lesson of a chapter: that chapter's Study Guide and Chapter Test (D26).
  const ch = chapterOf(lesson.id);
  const guide = ch === 7 ? 'ch7guide' : ch === 6 ? 'ch6guide' : 'guide';
  return {
    text: `You finished the last lesson of Chapter ${ch}! Review with the Chapter ${ch} Study Guide, then try the Chapter ${ch} Practice Test.`,
    main: html`<a class="btn" href="${ctx.actLink('math', `ch${ch}test`)}">Chapter ${ch} Practice Test</a><a class="btn btn-primary" href="${ctx.actLink('math', guide)}">Chapter ${ch} Study Guide ›</a>`, retakeSecondary: true,
  };
}

/** One missed question in a results list: the question, the right answer and how to get it. */
const reviewItem = (it, you = null) => html`<li>
  <span>${blanks(it.prompt)}</span>
  ${you === null ? '' : html`<span class="you">Your answer: ${you}</span>`}
  <span class="right">Correct answer: ${answerText(it)}</span>
  ${it.show ? html`<span class="explain">${it.show.join(' ')}</span>` : ''}
</li>`;

function trySummary(ctx, lesson, state) {
  const items = lesson.try.items;
  const first = items.filter((it) => state.items?.[it.id]?.first === 'correct' && !state.items?.[it.id]?.scaffoldAssisted).length;
  const scaffolded = items.filter((it) => state.items?.[it.id]?.scaffoldAssisted && state.items?.[it.id]?.status === 'correct').length;
  const missed = items.filter((it) => state.items?.[it.id]?.first !== 'correct');
  const answered = items.filter((it) => state.items?.[it.id]?.first).length;
  const passed = first >= lesson.try.pass;
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Try It Yourself: your results</h2></div>
    <div class="card results">
      ${scoreLine(first, items.length, answered)}
      ${scaffolded ? html`<p>${scaffolded} answers were completed with help or a counting scaffold. They are assisted practice, not unassisted first-attempt credit or wrong answers.</p>` : ''}
      <p>${passed ? 'Great work! You are ready for the test.' : `Practice a little more. ${lesson.try.pass} or more right on the first try means you are ready for the test.`}</p>
      <p class="next-step"><strong>What next?</strong> ${missed.length ? 'Press Practice My Misses to try the questions you missed again, with Help. Then take Test Your Knowledge.' : 'Take Test Your Knowledge.'}</p>
      ${missed.length ? html`<h3>Look again at these</h3><ul class="review">${missed.map((it) => reviewItem(it))}</ul>` : ''}
    </div>
    <div class="stage-nav end-nav">
      <span class="btn-row">
        ${missed.length ? html`<button type="button" class="btn" data-act="misses">${countLabel('Practice My Misses', missed.length)}</button>` : ''}
        <button type="button" class="btn" data-act="restart">Try again</button>
        ${lessonExits(ctx)}
      </span>
      <a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, 'test')}">Next: Test Your Knowledge ›</a>
    </div>`;
}

function testResults(ctx, lesson, state) {
  const items = lesson.test.items;
  const s = score(items, state.items || {}, lesson.test.pass);
  const shown = (it) => {
    const r = state.items?.[it.id]?.resp || {};
    if (it.type === 'fraction') return r.n || r.d ? `${r.n || 'blank'}/${r.d || 'blank'}` : 'No answer';
    if (it.type === 'choice') return r.choice === undefined ? 'No answer' : it.options[Number(r.choice)]?.text || 'No answer';
    const vals = boxes(it).map((b) => r[b]).filter((x) => x !== undefined && x !== '');
    return vals.length ? vals.join(', ') : 'No answer';
  };
  const answered = items.length - unanswered(items, state).length;
  // Lessons 7-2 to 7-7: a retake after the answers were shown is practice. The first test decides what is next.
  const first = teachFirst(lesson) ? state.history?.firstTest : null, retake = Boolean(first && state.retake);
  const what = testNext(ctx, lesson, retake ? first.right >= first.pass : s.passed);
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Test Your Knowledge: your score</h2></div>
    <div class="card results">
      ${scoreLine(s.right, s.total, answered, false)}
      <p>${retake ? `This was a practice retake. The answers were shown after your first test, so your grown-up's report uses the first test: ${first.right} of ${first.total}.` : s.passed ? 'You passed! Great work.' : `Not yet. ${lesson.test.pass} or more right means you passed. Look at the answers below, then ${teachFirst(lesson) ? 'practice the ones you missed' : 'try again'}.`}</p>
      <p class="next-step"><strong>What next?</strong> ${s.missed.length ? 'Press Practice My Misses to learn from the questions you missed. ' : ''}${what.text}</p>
      ${s.missed.length ? html`<h3>Questions to look at again</h3>
        <ul class="review">${s.missed.map((it) => reviewItem(it, shown(it)))}</ul>` : html`<p>You got every question right!</p>`}
      ${hasChapter7Teaching(lesson) && items.some((it) => it.teaching) ? html`<section class="pilot-test-explanations"><h3>Understand every answer</h3>
        <p>Open each question to see the picture and the reason, including answers you got right.</p>
        ${items.map((it, i) => {
          const record = state.items[it.id] || {}, right = record.status === 'correct';
          const feedback = teachingFeedbackFor(lesson, it, record.resp, record.status) || { text: it.explain, model: it.model, models: it.models };
          return html`<details class="test-teaching-review" data-test-coach="${it.id}"><summary>Question ${i + 1}: ${right ? 'correct' : 'look again'}</summary>
            <p>${it.prompt}</p><p>Your answer: ${shown(it)}</p><p>Correct answer: ${answerText(it)}</p>
            <div class="visual-coach" data-coach="test-review"><div class="coach-model">${coachModels(feedback)}</div><p class="coach-instruction">${feedback?.text || ''}</p>${feedback?.text ? readButton(feedback.text, 'why this answer works') : ''}</div>
          </details>`;
        })}</section>` : ''}
    </div>
    <div class="stage-nav end-nav">
      <span class="btn-row">
        ${s.missed.length ? html`<button type="button" class="btn" data-act="misses">${countLabel('Practice My Misses', s.missed.length)}</button>` : ''}
        ${what.retakeSecondary ? html`<button type="button" class="btn" data-act="restart">Take the test again</button>` : ''}
        ${lessonExits(ctx)}
      </span>
      <span class="btn-row">${what.main}</span>
    </div>`;
}

/** Practice My Misses inside a lesson: the missed questions again, one at a time, with Check Answer, Hint and Show me how. */
function missesBody(ctx, lesson, stage, state) {
  const m = state.misses;
  const items = missItems(lesson, stage, state);
  if (m.done || !items.length) return missesSummary(ctx, lesson, stage, state, items);
  const i = Math.min(m.i, items.length - 1);
  const item = items[i];
  const st = m.items[item.id] || {};
  const ready = st.status === 'correct' || Boolean(st.shown);
  const last = i === items.length - 1;
  const fb = st.status === 'correct' ? html` aria-describedby="fb-${item.id}"` : '';
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">Practice My Misses</h2>
      <p class="progress">Question ${i + 1} of ${items.length}</p>
    </div>
    ${i === 0 ? html`<p class="notice">These are the questions you missed${stage === 'test' ? ' on the test' : ''}. Check your answer. If it is not right yet, press Help to see one step at a time.</p>` : ''}
    ${itemCard(lesson, item, 'together', { items: m.items })}
    <div class="stage-nav">
      ${i > 0 ? html`<button type="button" class="btn" data-act="back">‹ Back</button>` : html`<button type="button" class="btn" data-act="misses-exit">‹ My results</button>`}
      <span class="next-wrap">${ready ? '' : html`<span class="hint" id="next-why">Answer the question to go on.</span>`}
        <button type="button" class="btn btn-primary" data-act="next"${ready ? fb : html` disabled aria-describedby="next-why"`}>${last ? 'See how I did ›' : 'Next ›'}</button></span>
    </div>
    <p class="hint">${NOT_SAVED}</p>`;
}

function missesSummary(ctx, lesson, stage, state, items) {
  const m = state.misses;
  const first = items.filter((it) => m.items[it.id]?.first === 'correct').length;
  const still = items.filter((it) => m.items[it.id]?.first !== 'correct');
  const answered = items.filter((it) => m.items[it.id]?.first).length;
  // After a test, what comes next depends on the test score (a child who passed goes on, not back).
  const what = stage === 'test' ? testNext(ctx, lesson, score(lesson.test.items, state.items || {}, lesson.test.pass).passed) : null;
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Practice My Misses: how you did</h2></div>
    <div class="card results">
      ${scoreLine(first, items.length, answered)}
      <p>${still.length ? 'Good practice! Look at these once more.' : 'You got every missed question right this time. Great work!'}</p>
      <p class="next-step"><strong>What next?</strong> ${still.length ? 'Practice them again, or go back to your results.' : stage === 'try' ? 'Take Test Your Knowledge.' : what.text}</p>
      ${still.length ? html`<h3>Still to practice</h3><ul class="review">${still.map((it) => reviewItem(it))}</ul>` : ''}
    </div>
    <div class="stage-nav end-nav">
      <span class="btn-row">
        ${still.length ? html`<button type="button" class="btn" data-act="misses-again">${countLabel('Practice these again', still.length)}</button>` : ''}
        <button type="button" class="btn" data-act="misses-exit">‹ My results</button>
        ${lessonExits(ctx)}
      </span>
      ${stage === 'try' ? html`<a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, 'test')}">Next: Test Your Knowledge ›</a>`
        : html`<span class="btn-row">${what.main}</span>`}
    </div>`;
}

/** Keeps each written fact such as "7 × 4 = 28" on one line (design re-review R-2). */
function keepFacts(text) {
  return String(text).split(/(\d+(?:\s*[×+=−-]\s*\d+)+)/).map((p, k) => (k % 2 ? html`<span class="term">${p}</span>` : p));
}

/** Lessons 7-2 to 7-7: a short readiness report from this visit (first Try It Yourself round and first test). */
export function readinessReport(lesson, history, visited) {
  const t = history?.firstTest, y = history?.firstTry;
  const level = !t ? 'unfinished' : t.right >= t.pass ? 'ready' : t.right >= t.pass - 2 ? 'review' : 'notyet';
  const verdict = {
    unfinished: ['In progress.', `The report is complete after the Test. ${STAGES.filter((s) => s.id !== 'test').map((s) => `${s.label}: ${visited?.has(s.id) ? 'done' : 'not finished'}`).join('; ')}.`],
    ready: ['Ready for the workbook.', `First test: ${t?.right} of ${t?.total}. Next, ask your child to do the school workbook page without help.`],
    review: ['Almost ready.', `First test: ${t?.right} of ${t?.total}. Practice the questions below (Practice My Misses), then try the workbook page.`],
    notyet: ['Not ready yet.', `First test: ${t?.right} of ${t?.total}. Go back to Watch Me and Practice Together with your child before the workbook page.`],
  }[level];
  const missed = (t?.missed || []).map((id) => lesson.test.items.find((it) => it.id === id)).filter(Boolean);
  return html`<section class="card readiness" aria-labelledby="ready-h">
    <h3 id="ready-h">Readiness report (this visit)</h3>
    <p class="verdict ${level}"><strong>${verdict[0]}</strong> ${verdict[1]}</p>
    ${y ? html`<p>Try It Yourself (You Do), first round: <strong>${y.own} of ${y.total}</strong> right on the first try with no help${y.helped ? `; ${y.helped} more right after another try or with help` : ''}.</p>` : ''}
    ${missed.length ? html`<p>Missed on the first test:</p><ul>${missed.map((it) => html`<li>${it.prompt}</li>`)}</ul>` : ''}
    <p class="hint">Answers shown by Help, and retakes after the answers were shown, never count as "on own". This report covers this visit only (Lessons 7-2 to 7-7 are not saved), and on-screen results are not proof of mastery: the workbook page done without help is the real check.</p>
  </section>`;
}

function parentGuide(ctx, lesson) {
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Parent Guide</h2></div>
    ${teachFirst(lesson) ? readinessReport(lesson, ctx.lessonState?.history, ctx.lessonVisited) : ''}
    <div class="card parent-guide">
      ${lesson.parent.sections.map((s) => html`<section><h3>${s.heading}</h3>
        ${s.text ? html`<p>${keepFacts(s.text)}</p>` : ''}
        ${s.list ? html`<ul>${s.list.map((x) => html`<li>${keepFacts(x)}</li>`)}</ul>` : ''}</section>`)}
      <section><h3>About "Read to me"</h3><p>Read to me uses your device's own voice when it has one. Some browsers use an online voice instead; nothing else is sent by Study Scoop.</p></section>
    </div>
    <div class="stage-nav"><a class="btn" href="${ctx.lessonLink(lesson.id, lesson.id === JOURNEY_LESSON ? 'explore' : 'learn')}">‹ Back to the lesson</a><span></span></div>`;
}
