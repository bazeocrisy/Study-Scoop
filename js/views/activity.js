// Practice activities (Spelling, Vocabulary) and Study Scoop practice tests (Tests section). DECISIONS D18.
// Questions use the same question card as the Math lessons; the activity player keeps progress for this visit only.
import { html } from '../lib/html.js';
import { answerText, score } from '../lib/lessons.js';
import { SUBJECT, activityLabel } from '../lib/activities.js';
import { formatLongDate } from '../lib/dates.js';
import { itemCard, readButton, unanswered } from './lesson.js';
import { wordPicture } from './common.js';

const NOT_SAVED = 'Your answers are not saved. If you close or refresh this page, this activity starts again.';
const CHECK = { catchAll: 'Not yet. Try again.' };

/** The page for an activity or a test: a title bar and the area the player redraws. */
export function activityView(ctx) {
  const run = ctx.run;
  return html`
    ${activityBar(ctx, run)}
    <div class="stage" id="act-stage" data-subject="${run.subject}" data-act="${run.act}" data-mode="${run.mode}">
      ${activityInner(ctx)}
    </div>`;
}

function activityBar(ctx, run) {
  const back = run.mode === 'test'
    ? { href: ctx.link('tests'), label: 'All tests' }
    : { href: ctx.link(run.subject), label: `All of ${SUBJECT[run.subject]}` };
  return html`
    <div class="lesson-bar act-bar">
      <div class="lb-title">
        <p class="lb-nav"><a class="back" href="${back.href}">‹ ${back.label}</a><span class="eyebrow">${run.mode === 'test' ? 'Study Scoop practice test' : SUBJECT[run.subject]} · ${ctx.week.label.replace(/^Week of /, '')}</span></p>
        <h1>${run.title}</h1>
        ${run.goal ? html`<p class="goal">${run.goal}</p>` : ''}
      </div>
    </div>`;
}

/** Just the area below the title bar (redrawn in place after each action). */
export function activityInner(ctx) {
  const run = ctx.run;
  if (run.act === 'flash') return flashcards(ctx, run);
  if (run.act === 'cards') return studyCards(ctx, run);
  if (!run.items.length) return emptyRun(ctx, run);
  if (run.mode === 'test') return run.submitted ? testResults(ctx, run) : testQuestion(ctx, run);
  return run.finished ? practiceSummary(ctx, run) : practiceQuestion(ctx, run);
}

function emptyRun(ctx, run) {
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Nothing to practise yet</h2></div>
    <div class="card"><p>You have no missed questions to practise. Try an activity first. Anything you miss shows up here.</p></div>
    <div class="stage-nav"><a class="btn" href="${ctx.link(run.subject)}">‹ Back to ${SUBJECT[run.subject]}</a><span></span></div>`;
}

// ---------------------------------------------------------------- practice

function practiceQuestion(ctx, run) {
  const i = Math.min(run.i, run.items.length - 1);
  const item = run.items[i];
  const st = run.items_[item.id] || {};
  const ready = st.status === 'correct' || Boolean(st.shown);
  const last = i === run.items.length - 1;
  const fb = st.status === 'correct' ? html` aria-describedby="fb-${item.id}"` : '';
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">${activityLabel(run.subject, run.act)}</h2>
      <p class="progress">Question ${i + 1} of ${run.items.length}</p>
    </div>
    ${itemCard(CHECK, item, 'together', { items: run.items_ })}
    <div class="stage-nav">
      ${i > 0 ? html`<button type="button" class="btn" data-act="back">‹ Back</button>` : html`<span></span>`}
      <span class="next-wrap">${ready ? '' : html`<span class="hint" id="next-why">Answer the question to go on.</span>`}
        <button type="button" class="btn btn-primary" data-act="next"${ready ? fb : html` disabled aria-describedby="next-why"`}>${last ? 'See my results ›' : 'Next ›'}</button></span>
    </div>
    <p class="hint">${NOT_SAVED}</p>`;
}

function practiceSummary(ctx, run) {
  const first = run.items.filter((it) => run.items_[it.id]?.first === 'correct').length;
  const missed = run.items.filter((it) => run.items_[it.id]?.first !== 'correct');
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">Your results</h2></div>
    <div class="card results">
      <p class="summary-score">${first} out of ${run.items.length} right on the first try</p>
      <p>${missed.length ? 'Good work! The questions below are saved in Practice My Misses for this visit.' : 'Every answer was right on the first try. Great work!'}</p>
      ${missed.length ? html`<h3>Look again at these</h3><ul class="review">${missed.map((it) => html`<li>${reviewPrompt(it)}<span class="right">Answer: ${answerText(it)}</span>${it.explain ? html`<span>${it.explain}</span>` : ''}</li>`)}</ul>` : ''}
    </div>
    <div class="stage-nav">
      <span class="btn-row">
        <button type="button" class="btn" data-act="restart">Start again</button>
        ${missed.length ? html`<a class="btn" href="${ctx.actLink(run.subject, 'misses')}">Practice My Misses</a>` : ''}
      </span>
      <a class="btn btn-primary" href="${ctx.link(run.subject)}">Back to ${SUBJECT[run.subject]}</a>
    </div>`;
}

/** The question as it is shown in a review list (a spelling word is named by its sentence, never by itself). */
function reviewPrompt(it) {
  if (it.type === 'spell') return html`<span>${it.fallback.replace(/\s*\([^)]*\)\s*$/, '')}</span>`;
  if (it.type === 'letters') return html`<span>${it.context}</span>`;
  return html`<span>${it.prompt}</span>`;
}

// ---------------------------------------------------------------- tests

function testQuestion(ctx, run) {
  const i = Math.min(run.i, run.items.length - 1);
  const item = run.items[i];
  const last = i === run.items.length - 1;
  const blanks = run.warned ? unanswered(run.items, { items: run.items_ }) : [];
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">${run.title}</h2>
      <p class="progress">Question ${i + 1} of ${run.items.length}</p>
    </div>
    ${i === 0 ? html`<div class="notice test-intro"><p>${run.instructions}</p><p class="coverage">${run.coverage}</p></div>` : ''}
    ${itemCard(CHECK, item, 'test', { items: run.items_ })}
    ${blanks.length ? html`<div class="notice" id="test-warning" tabindex="-1"><p><strong>${blanks.length === 1 ? '1 question has' : `${blanks.length} questions have`} no answer.</strong> You can go back to ${blanks.length === 1 ? 'it' : 'them'}, or finish anyway.</p>
      <p class="btn-row">${blanks.map((k) => html`<button type="button" class="btn" data-act="goto" data-to="${k}">Go to question ${k + 1}</button>`)}</p></div>` : ''}
    <div class="stage-nav">
      ${i > 0 ? html`<button type="button" class="btn" data-act="back">‹ Back</button>` : html`<span></span>`}
      ${last ? html`<button type="button" class="btn btn-primary" data-act="submit">${run.warned ? 'Finish anyway' : 'Finish the test'}</button>`
        : html`<button type="button" class="btn btn-primary" data-act="next">Next question ›</button>`}
    </div>
    <p class="hint">${NOT_SAVED} This is a Study Scoop practice test, not your teacher's test.</p>`;
}

/** What the child answered, as text (results review). */
function given(it, st) {
  const r = st?.resp || {};
  if (it.type === 'choice') return r.choice === undefined ? 'No answer' : it.options[Number(r.choice)]?.text || 'No answer';
  if (it.type === 'letters') return Object.values(r).some((v) => String(v).trim()) ? [...it.word].map((c, k) => (it.blanks.includes(k) ? (r[`l${it.blanks.indexOf(k)}`] || '_') : c)).join('') : 'No answer';
  const vals = Object.values(r).map((v) => String(v).trim()).filter(Boolean);
  return vals.length ? vals.join(', ') : 'No answer';
}

function testResults(ctx, run) {
  const s = score(run.items, run.items_, run.pass);
  const back = run.subject === 'math' ? 'Math' : SUBJECT[run.subject];
  return html`
    <div class="stage-title"><h2 id="stage-h" tabindex="-1">${run.title}: your score</h2></div>
    <div class="card results">
      <p class="summary-score">${s.right} out of ${s.total}</p>
      <p>${s.passed ? 'You passed! Great work.' : `Not yet. ${run.pass} or more right means you passed. Look at the answers below, then practise and try again.`}</p>
      <p class="print-only">${ctx.week.label} · Study Scoop practice test (not the teacher's test)</p>
      ${s.missed.length ? html`<h3>Questions to look at again</h3>
        <ol class="review">${s.missed.map((it) => html`<li>
          <span class="qnum">Question ${run.items.indexOf(it) + 1}</span>
          ${reviewPrompt(it)}
          <span class="you">Your answer: ${given(it, run.items_[it.id])}</span>
          <span class="right">Correct answer: ${answerText(it)}</span>
          ${it.explain ? html`<span>${it.explain}</span>` : ''}
        </li>`)}</ol>` : html`<p>You got every question right!</p>`}
    </div>
    <div class="stage-nav">
      <span class="btn-row">
        <button type="button" class="btn" data-act="restart">Take the test again</button>
        <button type="button" class="btn" data-act="print">Print my results</button>
      </span>
      <a class="btn btn-primary" href="${ctx.link(run.subject)}">Practise in ${back}</a>
    </div>`;
}

// ---------------------------------------------------------------- flashcards and study cards

function flashcards(ctx, run) {
  const f = run.flash;
  const words = ctx.week.spelling.words;
  const w = words[f.order[f.i]];
  const mark = f.marks[w.word];
  const known = Object.values(f.marks).filter((m) => m === 'known').length;
  const again = Object.values(f.marks).filter((m) => m === 'again').length;
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">Flashcards</h2>
      <p class="progress">Card ${f.i + 1} of ${words.length}</p>
    </div>
    <div class="card flashcard${f.flipped ? ' is-flipped' : ''}">
      ${f.flipped ? html`
        <p class="side-label">Back of the card</p>
        ${wordPicture(ctx, [w.word, w.img], `Study card for the word "${w.word}"`)}
        <p class="flash-word small">${w.word}</p>
        <p class="sentence">${w.sentence}</p>`
        : html`
        <p class="side-label">Front of the card</p>
        <p class="flash-word">${w.word}</p>
        <p class="hint">Say the word. Spell it out loud. Then flip the card.</p>`}
      <div class="btn-row center">
        <button type="button" class="btn btn-primary" data-act="flip" aria-pressed="${f.flipped ? 'true' : 'false'}">Flip card</button>
        ${readButton([w.word], 'the word')}
      </div>
      <div class="btn-row center marks" role="group" aria-label="How well do you know this word?">
        <button type="button" class="btn mark-known" data-act="mark" data-mark="known" aria-pressed="${mark === 'known' ? 'true' : 'false'}">I know it</button>
        <button type="button" class="btn mark-again" data-act="mark" data-mark="again" aria-pressed="${mark === 'again' ? 'true' : 'false'}">Practise again</button>
      </div>
    </div>
    <p class="tally">Known: ${known} · To practise: ${again}${again ? html` · <a href="${ctx.actLink('spelling', 'misses')}">Practice My Misses</a>` : ''}</p>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="card-prev"${f.i === 0 ? ' disabled' : ''}>‹ Previous</button>
      <button type="button" class="btn" data-act="shuffle">Shuffle</button>
      <button type="button" class="btn btn-primary" data-act="card-next"${f.i === words.length - 1 ? ' disabled' : ''}>Next ›</button>
    </div>
    <p class="hint">Marks are not saved. They clear when you close or refresh this page.</p>`;
}

function studyCards(ctx, run) {
  const f = run.flash;
  const words = ctx.week.vocab.words;
  const w = words[f.order[f.i]];
  return html`
    <div class="stage-title">
      <h2 id="stage-h" tabindex="-1">Study Cards</h2>
      <p class="progress">Card ${f.i + 1} of ${words.length}</p>
    </div>
    <div class="card study-one">
      ${wordPicture(ctx, w.word, `Picture showing what "${w.word}" means`)}
      <div class="study-text">
        <div class="instruct-head"><h3 class="vocab-word">${w.word}</h3>${readButton([w.word, `${w.word} means: ${w.def}`, w.sentence], 'this card')}</div>
        <blockquote class="teacher-words"><span class="label">Teacher's words</span><span class="def">${w.def}</span></blockquote>
        <p class="example"><span class="tag">In a sentence</span> ${w.sentence}</p>
      </div>
    </div>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="card-prev"${f.i === 0 ? ' disabled' : ''}>‹ Previous</button>
      ${f.i === words.length - 1
        ? html`<a class="btn btn-primary" href="${ctx.actLink('vocab', 'choice')}">Next: Multiple Choice ›</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next ›</button>`}
    </div>`;
}

// ---------------------------------------------------------------- menus

/** The list of activities on the Spelling and Vocabulary pages. */
export function activityMenu(ctx, subject, list) {
  const misses = ctx.misses?.[subject] || 0;
  return html`
    <section class="activities" aria-labelledby="h-act-${subject}">
      <h2 id="h-act-${subject}">Practice activities</h2>
      <ul class="activity-grid">
        ${list.map((a) => html`
          <li class="card activity${a.id === 'misses' ? ' misses' : ''}">
            <h3>${a.label}</h3>
            <p>${a.about}</p>
            ${a.id === 'misses' && !misses
              ? html`<p class="soon-note">No misses yet. Questions you miss in this visit show up here.</p>`
              : html`<a class="btn btn-primary" href="${ctx.actLink(subject, a.id)}">${a.id === 'misses' ? `Practise ${misses} missed` : 'Start'}<span class="sr-only">: ${a.label}</span></a>`}
          </li>`)}
      </ul>
      <p class="hint">Weekly tests are in <a href="${ctx.link('tests')}">Tests</a>.</p>
    </section>`;
}

/** The Test Center: the three Study Scoop practice tests for the chosen week. */
export function testCenter(ctx, catalog) {
  return html`
    <section aria-labelledby="h-tests-list">
      <h2 id="h-tests-list" class="sr-only">This week's practice tests</h2>
      <ul class="test-grid">
        ${catalog.map((c) => html`
          <li class="card test-card test-${c.kind}">
            <p class="subject">${c.subject}</p>
            <h3>${c.title}</h3>
            ${c.topic ? html`<p class="topic">${c.topic}</p>` : ''}
            <dl class="facts">
              <div><dt>Class test</dt><dd>${c.date ? formatLongDate(c.date) : 'No date given'}</dd></div>
              <div><dt>Questions</dt><dd>${c.available ? c.count : '—'}</dd></div>
            </dl>
            ${c.coverage ? html`<p class="coverage">${c.coverage}</p>` : ''}
            ${c.available
              ? html`<a class="btn btn-primary" href="${ctx.testLink(c.kind)}">Start test<span class="sr-only">: ${c.title}</span></a>`
              : html`<p class="unavailable"><strong>Not available.</strong> ${c.reason}</p>`}
          </li>`)}
      </ul>
    </section>`;
}
