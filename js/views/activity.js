// Practice activities (Spelling, Vocabulary, Math) and Study Scoop practice tests (Tests section). DECISIONS D18, D19.
// Questions use the same question card as the Math lessons; the activity player keeps progress for this visit only.
import { html } from '../lib/html.js';
import { answerText, score } from '../lib/lessons.js';
import { SKILL_LABEL, SUBJECT, MATH_SKILLS, activityInfo, blankSentence } from '../lib/activities.js';
import { modelFigure } from '../lib/models.js';
import { PROPERTIES, teacherExample, teacherWord } from '../lib/mathlearn.js';
import { formatLongDate } from '../lib/dates.js';
import { blanks, itemCard, readButton, soundButton, unanswered } from './lesson.js';
import { ICONS, facts, subBar, wordPicture } from './common.js';

const NOT_SAVED = 'Your answers are not saved. If you close or refresh this page, this activity starts again.';
const CHECK = { catchAll: 'Try again.' };
/** Tests longer than this get a "take a break" note halfway through. */
const BREAK_AFTER = 12;

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
  if (run.mode === 'test') {
    return subBar(ctx, {
      tone: 'tests', title: run.title, goal: run.goal, eyebrow: `Study Scoop practice test · ${ctx.week.label.replace(/^Week of /, '')}`,
      trail: [{ label: 'Tests', href: ctx.link('tests') }, { label: run.title }], back: [{ href: ctx.link('tests'), label: '‹ Back to Tests' }],
    });
  }
  const parent = parentOf(run);
  const subject = { label: SUBJECT[run.subject], href: ctx.link(run.subject) };
  return subBar(ctx, {
    tone: run.subject, title: run.title, goal: run.goal,
    trail: [subject, ...(parent ? [{ label: parent.label, href: ctx.actLink(run.subject, parent.id) }] : []), { label: run.title }],
    back: parent
      ? [{ href: ctx.actLink(run.subject, parent.id), label: `‹ Back to ${parent.label}` }, { href: subject.href, label: `Back to ${subject.label}` }]
      : [{ href: subject.href, label: `‹ Back to ${subject.label}` }],
  });
}

/** The menu an activity was chosen from (Math > Practice Problems for the practice sets). */
const parentOf = (run) => { const p = activityInfo(run.subject, run.act)?.parent; return p ? activityInfo(run.subject, p) : null; };
/** "Choose another activity": back to the menu this activity was chosen from. */
const menuLink = (ctx, run) => (parentOf(run) ? ctx.actLink(run.subject, parentOf(run).id) : ctx.link(run.subject));
/** The buttons at the end of an activity: Try again, Practice My Misses, Choose another activity, Home. */
function endNav(ctx, run, { missed = false, again = 'Try again' } = {}) {
  return html`
    <div class="stage-nav end-nav">
      <span class="btn-row">
        ${again ? html`<button type="button" class="btn" data-act="restart">${again}</button>` : ''}
        ${missed ? html`<a class="btn" href="${ctx.actLink(run.subject, 'misses')}">Practice My Misses</a>` : ''}
        <a class="btn" href="${ctx.link('week')}">${ICONS.home}<span>Home</span></a>
      </span>
      <a class="btn btn-primary" href="${menuLink(ctx, run)}">Choose another activity</a>
    </div>`;
}

/** The heading the keyboard focus lands on: it says where the child is ("Question 3 of 12"). */
const stageTitle = (text) => html`<div class="stage-title"><h2 id="stage-h" tabindex="-1">${text}</h2></div>`;

/** Just the area below the title bar (redrawn in place after each action). */
export function activityInner(ctx) {
  const run = ctx.run;
  if (run.act === 'flash') return flashcards(ctx, run);
  if (run.act === 'learn') return run.subject === 'math' ? propertyCards(ctx, run) : studyCards(ctx, run);
  if (!run.items.length) return emptyRun(ctx, run);
  if (run.mode === 'test') return run.submitted ? testResults(ctx, run) : testQuestion(ctx, run);
  return run.finished ? practiceSummary(ctx, run) : practiceQuestion(ctx, run);
}

function emptyRun(ctx, run) {
  if (run.unavailable) {
    return html`${stageTitle('Not available right now')}<div class="card"><p>The practice problems could not be loaded. Please try again later.</p></div>${endNav(ctx, run, { again: '' })}`;
  }
  return html`
    ${stageTitle('Nothing to practice yet')}
    <div class="card empty-state"><p><strong>Nothing to practice yet. Good news!</strong></p>
      <p>When you miss a question in another activity, it shows up here so you can practice it again. Try an activity first.</p></div>
    ${endNav(ctx, run, { again: '' })}`;
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
    ${stageTitle(`Question ${i + 1} of ${run.items.length}`)}
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
  const praise = !missed.length ? 'Every answer was right on the first try. Great work!'
    : first * 2 >= run.items.length ? 'Good work! The questions below are saved in Practice My Misses for this visit.'
      : 'Nice effort. Let\'s practice the ones below. They are saved in Practice My Misses for this visit.';
  return html`
    ${stageTitle('Your results')}
    <div class="card results">
      <p class="summary-score">${first} out of ${run.items.length} right on the first try</p>
      <p>${praise}</p>
      ${missed.length ? html`<h3>Look again at these</h3><ul class="review">${missed.map((it) => html`<li>${reviewPrompt(it)}<span class="right">Answer: ${answerText(it)}</span>${it.explain ? html`<span>${it.explain}</span>` : ''}</li>`)}</ul>` : ''}
    </div>
    ${endNav(ctx, run, { missed: missed.length > 0 })}`;
}

/** The question as it is shown in a review list (a spelling word is named by its sentence, never by itself). */
function reviewPrompt(it) {
  if (it.type === 'spell') return html`<span>${blanks(it.fallback.replace(/^.*The sentence is: /, ''))}</span>`;
  if (it.type === 'letters') return html`<span>${blanks(it.context)}</span>`;
  return html`<span>${blanks(it.prompt)}</span>`;
}

// ---------------------------------------------------------------- tests

function testQuestion(ctx, run) {
  const i = Math.min(run.i, run.items.length - 1);
  const item = run.items[i];
  const last = i === run.items.length - 1;
  const blankList = run.warned ? unanswered(run.items, { items: run.items_ }) : [];
  const half = run.items.length > BREAK_AFTER && i === Math.ceil(run.items.length / 2);
  return html`
    ${stageTitle(`Question ${i + 1} of ${run.items.length}`)}
    ${i === 0 ? html`<div class="notice test-intro"><p>${run.instructions}</p><p class="coverage">This test covers: ${run.coverage}</p></div>` : ''}
    ${half ? html`<p class="notice break-note">Halfway there! Take a short break if you need one. Your answers are kept while this page stays open.</p>` : ''}
    ${itemCard(CHECK, item, 'test', { items: run.items_ })}
    ${blankList.length ? html`<div class="notice" id="test-warning" tabindex="-1"><p><strong>${blankList.length === 1 ? '1 question has' : `${blankList.length} questions have`} no answer.</strong> Go back to ${blankList.length === 1 ? 'it' : 'them'}, or finish anyway.</p>
      <p class="goto-list"><span>Questions with no answer:</span> ${blankList.map((k) => html`<button type="button" class="btn goto" data-act="goto" data-to="${k}" aria-label="Go to question ${k + 1}">${k + 1}</button>`)}</p></div>` : ''}
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

/** Why the chosen option was wrong (each wrong option carries its own reason). */
const whyChosen = (it, st) => (it.type === 'choice' && st?.resp?.choice !== undefined ? it.options[Number(st.resp.choice)]?.why : '');

function testResults(ctx, run) {
  const s = score(run.items, run.items_, run.pass);
  const skills = MATH_SKILLS.map((k) => [k, run.items.filter((it) => it.skill === k)]).filter(([, list]) => list.length);
  return html`
    ${stageTitle(`${run.title}: your score`)}
    <div class="card results">
      <p class="summary-score">${s.right} out of ${s.total}</p>
      <p>${s.passed ? 'You passed! Great work.' : `Not yet. ${run.pass} or more right means you passed. Look at the answers below, then practice and try again.`}</p>
      ${run.noSound ? html`<p class="notice">The sound was off for some words, so a grown-up read them. That is fine for practice.</p>` : ''}
      ${skills.length > 1 ? html`<table class="skills"><caption>Your score in each part</caption><tbody>${skills.map(([k, list]) => html`<tr><th scope="row">${SKILL_LABEL[k]}</th><td>${list.filter((it) => run.items_[it.id]?.status === 'correct').length} of ${list.length}</td></tr>`)}</tbody></table>` : ''}
      <p class="print-only">${ctx.week.label} · Study Scoop practice test (not the teacher's test)</p>
      ${s.missed.length ? html`<h3>Questions to look at again</h3>
        <ol class="review">${s.missed.map((it) => html`<li>
          <span class="qnum">Question ${run.items.indexOf(it) + 1}</span>
          ${reviewPrompt(it)}
          <span class="you">Your answer: ${given(it, run.items_[it.id])}</span>
          ${whyChosen(it, run.items_[it.id]) ? html`<span>${whyChosen(it, run.items_[it.id])}</span>` : ''}
          <span class="right">Correct answer: ${answerText(it)}</span>
          ${it.explain ? html`<span>${it.explain}</span>` : ''}
        </li>`)}</ol>` : html`<p>You got every question right!</p>`}
    </div>
    <div class="stage-nav">
      <span class="btn-row">
        <button type="button" class="btn" data-act="restart">Take the test again</button>
        <button type="button" class="btn" data-act="print">Print my results</button>
        <a class="btn" href="${ctx.link(run.subject)}">Practice ${SUBJECT[run.subject]}</a>
      </span>
      <a class="btn btn-primary" href="${ctx.link('tests')}">Back to Tests</a>
    </div>`;
}

// ---------------------------------------------------------------- flashcards and study cards

function flashcards(ctx, run) {
  const f = run.flash;
  const sp = ctx.week.spelling;
  const words = sp.words;
  const w = words[f.order[f.i]];
  const mark = f.marks[w.word];
  const known = Object.values(f.marks).filter((m) => m === 'known').length;
  const again = Object.values(f.marks).filter((m) => m === 'again').length;
  const ending = String(sp.pattern).replace(/^-/, '');
  const rule = sp.rules[w.rule] || '';
  // The whole card is one button: click, tap, Enter or Space turns it over. Only one side is ever on the page,
  // and the front never shows the spelling (base word + ending and the sentence with a blank).
  return html`
    ${stageTitle(`Card ${f.i + 1} of ${words.length}`)}
    <button type="button" class="flashcard${f.flipped ? ' is-flipped' : ''}" data-act="flip" aria-describedby="flip-help">
      ${f.flipped ? html`
        <span class="face back">
          <span class="side-label">Back of the card</span>
          ${wordPicture(ctx, [w.word, w.img], `Study card for the word "${w.word}"`)}
          <span class="flash-word">${w.word}</span>
          ${rule ? html`<span class="flash-rule">${rule}${sp.ruleHelp?.[w.rule] ? html`<span class="rule-help">${sp.ruleHelp[w.rule]}</span>` : ''}</span>` : ''}
          <span class="sentence">${w.sentence}</span>
        </span>`
        : html`
        <span class="face front">
          <span class="side-label">Front of the card</span>
          <span class="flash-clue">${w.base} + ${ending}</span>
          <span class="sentence">${blanks(blankSentence(w.sentence, w.word))}</span>
          <span class="tap">Think of the word. Then tap the card to see it.</span>
        </span>`}
    </button>
    <p class="sr-only" id="flip-help">Press Enter or Space to turn the card over.</p>
    <div class="btn-row center flash-tools">
      <button type="button" class="btn btn-primary flip-btn" data-act="flip">Flip Card</button>
      ${soundButton('say-card', 'Hear the word')}
      <button type="button" class="btn" data-act="shuffle">Shuffle</button>
    </div>
    <div class="btn-row center marks" role="group" aria-label="How well do you know this word?">
      <button type="button" class="btn mark-known" data-act="mark" data-mark="known" aria-pressed="${mark === 'known' ? 'true' : 'false'}">I know it</button>
      <button type="button" class="btn mark-again" data-act="mark" data-mark="again" aria-pressed="${mark === 'again' ? 'true' : 'false'}">Practice again</button>
    </div>
    <p class="tally">Known: ${known} · To practice: ${again}${again ? html` · <a href="${ctx.actLink('spelling', 'misses')}">Practice My Misses</a>` : ''}</p>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="card-prev"${f.i === 0 ? ' disabled' : ''}>‹ Previous</button>
      ${f.i === words.length - 1
        ? html`<a class="btn btn-primary" href="${menuLink(ctx, run)}">Done: choose another activity</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next ›</button>`}
    </div>
    <p class="hint">Marks are not saved. They clear when you close or refresh this page.</p>`;
}

function studyCards(ctx, run) {
  const f = run.flash;
  const words = ctx.week.vocab.words;
  const w = words[f.order[f.i]];
  const last = f.i === words.length - 1;
  const note = ctx.week.vocab.groupsNote;
  return html`
    ${stageTitle(`Card ${f.i + 1} of ${words.length}`)}
    ${f.i === 0 && note.includes('purple') ? html`<p class="hint">${note} Only these ${words.length} words have been provided; the purple words are not on this list yet.</p>` : ''}
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
      ${last ? html`<a class="btn btn-primary" href="${menuLink(ctx, run)}">Done: choose an activity</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next ›</button>`}
    </div>`;
}

/** Math > Learn the Properties: one property at a time, with the teacher's words, a picture and a worked example. */
function propertyCards(ctx, run) {
  const f = run.flash;
  const p = PROPERTIES[f.i];
  const tw = teacherWord(ctx.week, p);
  const last = f.i === PROPERTIES.length - 1;
  return html`
    ${stageTitle(`Property ${f.i + 1} of ${PROPERTIES.length}`)}
    <div class="work has-pic prop-learn">
      <div class="card pic-card">
        <div class="models">${modelFigure(p.model, p.caption)}</div>
        <p class="equation fact">${facts(p.eq)}</p>
      </div>
      <div class="card">
        <div class="instruct-head"><h3>${p.name}</h3>${readButton([p.name, tw ? `Teacher's words: ${tw.def}` : '', `In other words: ${p.kid}`, ...p.steps], 'this property')}</div>
        ${tw ? html`<blockquote class="teacher-words"><span class="label">Teacher's words</span><span class="def">${tw.def}</span></blockquote>` : ''}
        <p class="kid-words"><span class="label">In other words</span>${p.kid}</p>
        <h4 class="label">Example: ${p.eq}</h4>
        <ol class="steps">${p.steps.map((s, k) => html`<li><span class="sn" aria-hidden="true">${k + 1}</span><span>${facts(s)}</span></li>`)}</ol>
        ${p.key === 'distributive' && teacherExample(tw) ? html`<p class="pairs"><span class="label">Your teacher's example</span> ${teacherExample(tw)}</p>` : ''}
      </div>
    </div>
    <div class="stage-nav">
      ${f.i > 0 ? html`<button type="button" class="btn" data-act="card-prev">‹ Previous Property</button>` : html`<span></span>`}
      ${last ? html`<a class="btn btn-primary" href="${ctx.actLink('math', 'practice')}">Next: Practice Problems ›</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next Property: ${PROPERTIES[f.i + 1].name.replace(' Property', '')} ›</button>`}
    </div>`;
}

// ---------------------------------------------------------------- menus

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
            ${c.note ? html`<p class="grownups">${c.note}</p>` : ''}
            ${c.available
              ? html`<a class="btn btn-primary" href="${ctx.testLink(c.kind)}">Start test<span class="sr-only">: ${c.title}</span></a>`
              : html`<p class="unavailable"><strong>Not available.</strong> ${c.reason}</p>`}
          </li>`)}
      </ul>
    </section>`;
}
