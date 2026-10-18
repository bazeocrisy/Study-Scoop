// One view for every lesson and stage (Learn It, Watch Me, Practice Together, Try It Yourself, Test, Parent Guide).
// Pure: it renders the lesson data plus the in-memory progress (state). js/lesson-player.js handles clicks and typing.
import { html } from '../lib/html.js';
import { speak } from '../lib/arith.js';
import { modelFigure } from '../lib/models.js';
import { STAGES, STAGE_IDS, answerText, boxes, score, showSteps, stageLabel } from '../lib/lessons.js';

const ICON_OK = html`<svg class="fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>`;
const ICON_NOT = html`<svg class="fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`;
const ICON_SPEAK = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>`;
const VJOIN = html`<svg class="vjoin" viewBox="0 0 72 18" aria-hidden="true" focusable="false"><path d="M6 3 L36 15 L66 3"/></svg>`;
const NOT_SAVED = 'Your answers are not saved. If you close or refresh this page, this part starts again.';

export const stageOf = (stage) => (STAGE_IDS.includes(stage) ? stage : 'learn');

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
  const state = ctx.lessonState || { i: 0, items: {}, steps: {} };
  return html`
    ${lessonBar(ctx, lesson, stage)}
    ${ctx.isCurrent ? '' : html`<p class="notice" role="note">You are looking at an earlier week. Lessons work the same in every week.</p>`}
    <div class="stage" id="lesson-stage" data-lesson="${lesson.id}" data-stage="${stage}">
      ${stageBody(ctx, lesson, stage, state)}
    </div>`;
}

/** Just the stage area (re-rendered in place after each answer, so the page does not jump). */
export function stageInner(ctx) {
  return stageBody(ctx, ctx.lesson, stageOf(ctx.stage), ctx.lessonState || { i: 0, items: {}, steps: {} });
}

function lessonBar(ctx, lesson, stage) {
  const at = STAGES.findIndex((s) => s.id === stage);
  return html`
    <div class="lesson-bar">
      <div class="lb-title">
        <p class="lb-nav"><a class="back" href="${ctx.link('math')}">‹ All of Math</a><span class="eyebrow">Lesson ${lesson.id}</span></p>
        <h1>${lesson.title}</h1>
        ${stage === 'learn' ? html`<p class="goal">${lesson.goal}</p>` : ''}
      </div>
      <nav class="stepper" aria-label="Lesson steps">
        <ol>${STAGES.map((s, i) => html`<li class="${s.id !== stage && ctx.lessonVisited?.has(s.id) ? 'done' : ''}"><a href="${ctx.lessonLink(lesson.id, s.id)}"${s.id === stage ? html` aria-current="step"` : ''}><span class="n">${i + 1}</span> <span class="name">${s.label}</span></a></li>`)}</ol>
      </nav>
    </div>`;
}

function stageBody(ctx, lesson, stage, state) {
  if (stage === 'parent') return parentGuide(ctx, lesson);
  const cards = cardsOf(lesson, stage);
  const label = stageLabel(stage);
  if (stage === 'test' && state.submitted) return testResults(ctx, lesson, state);
  if (stage === 'try' && state.i >= cards.length) return trySummary(ctx, lesson, state);
  const i = Math.min(state.i || 0, cards.length - 1);
  const card = cards[i];
  const what = stage === 'watch' ? 'Example' : stage === 'learn' ? 'Screen' : 'Question';
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">${label}</h2>
      <p class="progress">${what} ${i + 1} of ${cards.length}</p>
    </div>
    ${stage === 'test' && i === 0 ? html`<p class="notice">No hints during the test. Answer every question, then press Finish to see your score.</p>` : ''}
    ${stage === 'learn' ? learnCard(lesson, card, state) : stage === 'watch' ? exampleCard(lesson, card, i, state) : itemCard(lesson, card, stage, state)}
    ${stageNav(ctx, lesson, stage, state, i, cards)}`;
}

// ---------------------------------------------------------------- Learn It

function learnCard(lesson, s, state) {
  if (s.item) return html`<h3 class="card-title">${s.title}</h3>${itemCard(lesson, s.item, 'learn', state)}`;
  const teacher = s.teacher ? (lesson.teacher || []) : [];
  const words = (s.words || []).map((w) => [w, lesson.glossary?.[w]]).filter(([, d]) => d);
  return html`
    <div class="work${s.model ? ' has-pic' : ''}">
      ${s.model ? html`<div class="card pic-card">${modelFigure(s.model, s.caption)}</div>` : ''}
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
  const pic = step.model || ex.model;
  const done = shown >= ex.steps.length;
  const word = ex.steps.slice(0, shown).map((s) => s.word).filter(Boolean).pop();
  const whyState = state.items?.[ex.why?.id];
  const another = ex.another ? (ex.another.models || [ex.another.model]) : [];
  return html`
    <div class="work has-pic">
      <div class="card pic-card">${modelFigure(pic)}</div>
      <div class="card">
        <div class="instruct-head"><h3>${ex.title}</h3>${readButton([ex.title, ...ex.steps.slice(0, shown).map((s) => (s.eq ? `${s.say} ${s.eq}` : s.say))], 'these steps')}</div>
        <ol class="steps">
          ${ex.steps.slice(0, shown).map((s, k) => html`
            <li class="${k === shown - 1 ? 'now' : ''}"><span class="sn" aria-hidden="true">${k + 1}</span>
              <span>${s.say}${s.eq ? html`<span class="eq">${s.eq}</span>` : ''}</span></li>`)}
        </ol>
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
  return parts;
}

/** One question with its answer boxes or choices, feedback, hints and "Show me how". */
export function itemCard(lesson, item, stage, state) {
  const st = state.items?.[item.id] || {};
  const test = stage === 'test';
  const resp = st.resp || {};
  const done = !test && (st.status === 'correct' || st.shown);
  const hintsAllowed = !test && (stage !== 'try' || (st.tries || 0) >= 2);
  const showAllowed = !test && (st.tries || 0) >= 2;
  const pics = item.models || (item.model ? [item.model] : []);
  const inline = item.type === 'number' && /=\s*\?\s*$/.test(item.prompt);
  return html`
    <div class="work${pics.length ? ' has-pic' : ''}">
      ${pics.length ? html`<div class="card pic-card"><div class="models">${pics.map((m) => modelFigure(m))}</div></div>` : ''}
      <form class="card question" data-act="check" data-item="${item.id}" data-state="${st.status || 'unanswered'}" novalidate>
        <div class="instruct-head">${item.type === 'choice' || inline ? html`<span></span>` : html`<p class="prompt" id="q-${item.id}">${item.prompt}</p>`}${readButton(sayItem(item), 'the question')}</div>
        ${answerArea(item, resp, st, test, done)}
        ${test ? '' : html`
          <div class="btn-row">
            ${done ? '' : html`<button type="submit" class="btn btn-primary">Check Answer</button>`}
            ${!done && hintsAllowed && item.hints?.length ? html`<button type="button" class="btn" data-act="hint"${(st.hints || 0) >= item.hints.length ? ' disabled' : ''}>Hint${(st.hints || 0) ? ` ${st.hints} of ${item.hints.length}` : ''}</button>` : ''}
            ${!done && showAllowed ? html`<button type="button" class="btn" data-act="show">Show me how</button>` : ''}
          </div>`}
        ${!test && st.say ? feedbackPanel(item, st) : ''}
        ${!test && st.hints ? html`<div class="feedback info"><span class="fb-title">Hint</span><ol class="hints">${item.hints.slice(0, st.hints).map((h) => html`<li>${h}</li>`)}</ol></div>` : ''}
        ${!test && st.shown ? html`<div class="showme"><strong>Here's how:</strong><ol>${showSteps(item).map((s) => html`<li>${s}</li>`)}</ol></div>` : ''}
      </form>
    </div>`;
}

function feedbackPanel(item, st) {
  const id = `fb-${item.id}`;
  if (st.status === 'correct') return html`<div class="feedback ok" id="${id}">${ICON_OK}<span class="fb-title">${st.say}</span></div>`;
  if (st.status === 'empty') return html`<div class="feedback info" id="${id}"><span>${st.say}</span></div>`;
  return html`<div class="feedback notyet" id="${id}">${ICON_NOT}<span class="fb-title">Not yet</span> <span>${st.say}</span></div>`;
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
    return html`<fieldset class="choices"><legend id="q-${item.id}">${item.prompt}</legend>
      ${item.options.map((o, k) => {
        const chosen = String(resp.choice) === String(k);
        const cls = !test && chosen && st.status === 'correct' ? ' is-right' : !test && chosen && st.status === 'notyet' ? ' is-wrong' : '';
        return html`<label class="choice${cls}"><input type="radio" name="choice" value="${k}"${chosen ? ' checked' : ''}${done ? ' disabled' : ''}> <span>${o.text}</span></label>`;
      })}</fieldset>`;
  }
  if (item.type === 'number') {
    const fact = /^(.*=)\s*\?\s*$/.exec(item.prompt);
    return html`<div class="eqlines"><span class="eqline">${fact ? html`<span id="q-${item.id}">${fact[1]}</span>` : ''}${box(item, 'answer', `Answer: ${speak(item.prompt.replace(/\?\s*$/, 'blank'))}`, resp, st, done)}</span></div>`;
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
  const streak = stage === 'together' && state.streak >= 3 && !last
    ? html`<p class="feedback ok">${ICON_OK}<span class="fb-title">3 in a row! You can keep practising, or go on to <a href="${ctx.lessonLink(lesson.id, 'try')}">Try It Yourself</a>.</span></p>` : '';
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

function trySummary(ctx, lesson, state) {
  const items = lesson.try.items;
  const first = items.filter((it) => state.items?.[it.id]?.first === 'correct').length;
  const missed = items.filter((it) => state.items?.[it.id]?.first !== 'correct');
  const passed = first >= lesson.try.pass;
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Try It Yourself: your results</h2></div>
    <div class="card">
      <p class="summary-score">${first} out of ${items.length} right on the first try</p>
      <p>${passed ? 'Great work! You are ready for the test.' : `Practise a little more. ${lesson.try.pass} or more right on the first try means you are ready for the test.`}</p>
      ${missed.length ? html`<h3>Look again at these</h3><ul class="review">${missed.map((it) => html`<li><span>${it.prompt}</span><span class="right">Answer: ${answerText(it)}</span></li>`)}</ul>` : ''}
    </div>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="restart">Try again</button>
      <a class="btn btn-primary" href="${ctx.lessonLink(lesson.id, 'test')}">Next: Test Your Knowledge ›</a>
    </div>`;
}

function testResults(ctx, lesson, state) {
  const items = lesson.test.items;
  const s = score(items, state.items || {}, lesson.test.pass);
  const shown = (it) => {
    const r = state.items?.[it.id]?.resp || {};
    if (it.type === 'choice') return r.choice === undefined ? 'No answer' : it.options[Number(r.choice)]?.text || 'No answer';
    const vals = boxes(it).map((b) => r[b]).filter((x) => x !== undefined && x !== '');
    return vals.length ? vals.join(', ') : 'No answer';
  };
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Test Your Knowledge: your score</h2></div>
    <div class="card">
      <p class="summary-score">${s.right} out of ${s.total}</p>
      <p>${s.passed ? 'You passed! Great work.' : `Not yet. ${lesson.test.pass} or more right means you passed. Look at the answers below, then try again.`}</p>
      ${s.missed.length ? html`<h3>Questions to look at again</h3>
        <ul class="review">${s.missed.map((it) => html`<li>
          <span>${it.prompt}</span>
          <span class="you">Your answer: ${shown(it)}</span>
          <span class="right">Correct answer: ${answerText(it)}</span>
          ${it.show ? html`<span>${it.show.join(' ')}</span>` : ''}
        </li>`)}</ul>` : html`<p>You got every question right!</p>`}
    </div>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="restart">Take the test again</button>
      <a class="btn btn-primary" href="${ctx.link('math')}">Back to Math</a>
    </div>`;
}

/** Keeps each written fact such as "7 × 4 = 28" on one line (design re-review R-2). */
function keepFacts(text) {
  return String(text).split(/(d+(?:s*[×+=−-]s*d+)+)/).map((p, k) => (k % 2 ? html`<span class="term">${p}</span>` : p));
}

function parentGuide(ctx, lesson) {
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Parent Guide</h2></div>
    <div class="card parent-guide">
      ${lesson.parent.sections.map((s) => html`<section><h3>${s.heading}</h3>
        ${s.text ? html`<p>${keepFacts(s.text)}</p>` : ''}
        ${s.list ? html`<ul>${s.list.map((x) => html`<li>${keepFacts(x)}</li>`)}</ul>` : ''}</section>`)}
      <section><h3>About "Read to me"</h3><p>Read to me uses your device's own voice when it has one. Some browsers use an online voice instead; nothing else is sent by Study Scoop.</p></section>
    </div>
    <div class="stage-nav"><a class="btn" href="${ctx.lessonLink(lesson.id, 'learn')}">‹ Back to the lesson</a><span></span></div>`;
}
