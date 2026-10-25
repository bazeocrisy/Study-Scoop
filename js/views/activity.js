// Practice activities (Spelling, Vocabulary, Math) and Study Scoop practice tests (Tests section). DECISIONS D18, D19.
// Questions use the same question card as the Math lessons; the activity player keeps progress for this visit only.
import { html } from '../lib/html.js';
import { answerText, score } from '../lib/lessons.js';
import { SKILL_LABEL, SUBJECT, MATH_SKILLS, TEST_HOME, activityInfo, blankSentence, missesAct } from '../lib/activities.js';
import { modelFigure } from '../lib/models.js';
import { PROPERTIES, definitionOf, teacherExample, teacherWord } from '../lib/mathlearn.js';
import { formatLongDate } from '../lib/dates.js';
import { blanks, itemCard, readButton, soundButton, unanswered } from './lesson.js';
import { ICONS, facts, scoreLine, subBar, wordPicture } from './common.js';
import { packetPage } from './packet.js';

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
  // A Math chapter's activity or test (D26): Home > Math > Chapter N > (its menu) > the activity.
  const chapter = run.subject === 'math' && ctx.chapter ? ctx.chapter : null;
  if (chapter) {
    const parent = parentOf(run);
    const chapterCrumb = { label: `Chapter ${chapter.id}`, href: ctx.chapterLink(chapter.id) };
    return subBar(ctx, {
      tone: run.mode === 'test' ? 'tests' : 'math', title: run.title, goal: run.goal,
      eyebrow: run.mode === 'test' ? `Study Scoop practice test · Chapter ${chapter.id}` : '',
      trail: [{ label: 'Math', href: ctx.link('math') }, chapterCrumb, ...(parent ? [{ label: parent.label, href: ctx.actLink('math', parent.id) }] : []), { label: run.title }],
      back: parent
        ? [{ href: ctx.actLink('math', parent.id), label: `‹ Back to ${parent.label}` }, { href: chapterCrumb.href, label: `Back to Chapter ${chapter.id}` }]
        : [{ href: chapterCrumb.href, label: `‹ Back to Chapter ${chapter.id}` }, { href: ctx.link('math'), label: 'Back to Math' }],
    });
  }
  if (run.mode === 'test' && run.subject !== 'skills') {
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
const menuLink = (ctx, run) => (parentOf(run) ? ctx.actLink(run.subject, parentOf(run).id)
  : run.subject === 'math' && ctx.chapter ? ctx.chapterLink(ctx.chapter.id) : ctx.link(run.subject));
/** The buttons at the end of an activity: Try again, Practice My Misses, Choose another activity, Home. */
function endNav(ctx, run, { missed = false, again = 'Try again' } = {}) {
  return html`
    <div class="stage-nav end-nav">
      <span class="btn-row">
        ${again ? html`<button type="button" class="btn" data-act="restart">${again}</button>` : ''}
        ${missed ? html`<a class="btn" href="${ctx.actLink(run.subject, missesAct(run.subject, run.act))}">Practice My Misses</a>` : ''}
        <a class="btn" href="${ctx.link('week')}">${ICONS.home}<span>Home</span></a>
      </span>
      <a class="btn btn-primary" href="${menuLink(ctx, run)}">Choose another activity</a>
    </div>`;
}

/** The heading the keyboard focus lands on: it says where the child is ("Question 3 of 12"). */
const stageTitle = (text) => html`<div class="stage-title"><h2 id="stage-h" tabindex="-1">${text}</h2></div>`;

// ---------------------------------------------------------------- Times Tables App (exported)

/**
 * Vertical flashcard for the Times App.
 * mode = 'flash' (tap to flip) or 'practice' (show product + strategy steps).
 */
export function timesFlashView(ctx, mode = 'flash') {
  const run = ctx.timesRun;
  if (!run || !run.cards || run.cards.length === 0) {
    return html`<div class="card times-empty"><p>No facts to practice. Pick a fact family above.</p></div>`;
  }
  const f = run.flash;
  const card = run.cards[f.order[f.i]];
  const total = run.cards.length;

  if (mode === 'practice') {
    // Practice mode: show question, child types answer
    const item = run.practiceItems[f.order[f.i]];
    const st = run.items_[item.id] || {};
    return html`
      <p class="times-card-count" aria-live="polite">Fact ${f.i + 1} of ${total}</p>
      <div class="times-practice-card card">
        <div class="times-vert-eq" aria-label="${item.prompt}">
          <span class="times-factor">${item.prompt.split('×')[0].trim()}</span>
          <span class="times-op">× <span class="times-factor">${item.prompt.split('×')[1].replace('= ?', '').trim()}</span></span>
          <span class="times-line" aria-hidden="true"></span>
          <span class="times-product">?</span>
        </div>
        <div class="times-answer-area">
          <label class="sr-only" for="times-ans">Answer</label>
          <input id="times-ans" class="times-input" type="number" inputmode="numeric" min="0" max="144"
            data-act="times-answer" data-id="${item.id}" autocomplete="off" aria-label="Type the answer" value="${st.resp?.v || ''}">
          <button type="button" class="btn btn-primary" data-act="times-check" data-id="${item.id}">Check</button>
        </div>
        ${st.status === 'correct' ? html`<p class="fb-yes" role="alert">${item.yes}</p>` : ''}
        ${st.status === 'wrong' ? html`<p class="fb-no" role="alert">Not quite. ${item.hints[0]}</p>` : ''}
        ${st.shown ? html`<ol class="steps times-steps">${item.show.map((s, k) => html`<li><span class="sn" aria-hidden="true">${k + 1}</span><span>${s}</span></li>`)}</ol>` : ''}
      </div>
      <div class="stage-nav">
        <button type="button" class="btn" data-act="times-card-prev"${f.i === 0 ? ' disabled' : ''}>‹ Previous</button>
        <button type="button" class="btn btn-primary" data-act="times-card-next">${f.i === total - 1 ? 'Start over' : 'Next ›'}</button>
      </div>`;
  }

  // Flash mode: tap the card to flip
  const [factorA, factorB] = [card.a, card.b];
  const frontLabel = `Front of the card. ${factorA} times ${factorB}. Say the answer out loud, then tap the card to check.`;
  const backLabel = `Back of the card. ${factorA} times ${factorB} equals ${card.product}.`;
  return html`
    <p class="times-card-count" aria-live="polite">Card ${f.i + 1} of ${total}</p>
    <button type="button"
      class="times-flashcard${f.flipped ? ' is-flipped' : ''}"
      data-act="flip"
      aria-describedby="times-flip-help"
      aria-label="${f.flipped ? backLabel : frontLabel}">
      ${f.flipped ? html`
        <span class="face back">
          <span class="times-vert-eq" aria-hidden="true">
            <span class="times-factor">${factorA}</span>
            <span class="times-op">× <span class="times-factor">${factorB}</span></span>
            <span class="times-line"></span>
            <span class="times-product">${card.product}</span>
          </span>
          <span class="times-strategy">${card.show[0]}</span>
        </span>` : html`
        <span class="face front">
          <span class="times-vert-eq" aria-hidden="true">
            <span class="times-factor">${factorA}</span>
            <span class="times-op">× <span class="times-factor">${factorB}</span></span>
            <span class="times-line"></span>
            <span class="times-product">?</span>
          </span>
          <span class="times-tap-cue">Say the answer. Then tap to check.</span>
        </span>`}
    </button>
    <p class="sr-only" id="times-flip-help">Press Enter or Space to turn the card over.</p>
    <div class="btn-row center flash-tools">
      <button type="button" class="btn btn-primary flip-btn" data-act="flip">Flip Card</button>
      <button type="button" class="btn" data-act="times-shuffle">Shuffle</button>
    </div>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="times-card-prev"${f.i === 0 ? ' disabled' : ''}>‹ Previous</button>
      <button type="button" class="btn btn-primary" data-act="times-card-next">${f.i === total - 1 ? 'Start over' : 'Next ›'}</button>
    </div>`;
}

/** Find It view: child sees the product, types the two factors. */
export function timesFindView(ctx) {
  const run = ctx.timesRun;
  if (!run || !run.findItems || run.findItems.length === 0) {
    return html`<div class="card times-empty"><p>No facts to practice. Pick a fact family above.</p></div>`;
  }
  const i = run.findI || 0;
  const item = run.findItems[i];
  const total = run.findItems.length;
  const st = run.findState_[item.id] || {};

  const wrongFamily = st.wrongFamily;
  return html`
    <p class="times-card-count" aria-live="polite">Fact ${i + 1} of ${total}</p>
    <div class="card times-find-card">
      <p class="times-find-prompt">The answer is <strong class="times-big-product">${item.answer.a * item.answer.b}</strong>.</p>
      <p class="times-find-ask">What two numbers were multiplied?</p>
      <div class="times-find-boxes" role="group" aria-label="Enter the two factors">
        <label class="sr-only" for="find-a">First factor</label>
        <input id="find-a" class="times-box" type="number" inputmode="numeric" min="0" max="12"
          data-find="a" aria-label="First number" autocomplete="off" value="${st.va || ''}" ${st.correct ? 'disabled' : ''}>
        <span class="times-find-times" aria-hidden="true">×</span>
        <label class="sr-only" for="find-b">Second factor</label>
        <input id="find-b" class="times-box" type="number" inputmode="numeric" min="0" max="12"
          data-find="b" aria-label="Second number" autocomplete="off" value="${st.vb || ''}" ${st.correct ? 'disabled' : ''}>
        <span class="times-find-eq" aria-hidden="true">= ${item.answer.a * item.answer.b}</span>
      </div>
      ${!st.correct ? html`<button type="button" class="btn btn-primary" data-act="find-check" data-id="${item.id}">Check</button>` : ''}
      ${st.correct ? html`<p class="fb-yes" role="alert">${item.yes}</p>` : ''}
      ${wrongFamily ? html`<p class="fb-nudge" role="alert">${wrongFamily}</p>` : ''}
      ${st.wrong ? html`<p class="fb-no" role="alert">Try again! Think about the facts you picked.</p>` : ''}
    </div>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="find-prev"${i === 0 ? ' disabled' : ''}>‹ Previous</button>
      <button type="button" class="btn btn-primary" data-act="find-next">${i === total - 1 ? 'Start over' : 'Next ›'}</button>
    </div>`;
}

/** Just the area below the title bar (redrawn in place after each action). */
export function activityInner(ctx) {
  const run = ctx.run;
  if (run.act === 'flash') return flashcards(ctx, run);
  if (run.act === 'learn') return run.subject === 'math' ? propertyCards(ctx, run) : studyCards(ctx, run);
  if (run.act === 'wreview') return wordCards(ctx, run);
  if (run.act === 'avreview' || run.act === 'avflash') return run.unavailable ? emptyRun(ctx, run) : (run.act === 'avreview' ? areaWordCards(ctx, run) : areaFlashcards(ctx, run));
  if (!run.items.length) return emptyRun(ctx, run);
  if (run.packet) return packetPage(ctx, run);
  if (run.mode === 'test') return run.submitted ? testResults(ctx, run) : testQuestion(ctx, run);
  return run.finished ? practiceSummary(ctx, run) : practiceQuestion(ctx, run);
}

function emptyRun(ctx, run) {
  if (run.unavailable) {
    return html`${stageTitle('Not available right now')}<div class="card"><p>The practice questions could not be loaded. Please try again later.</p></div>${endNav(ctx, run, { again: '' })}`;
  }
  return html`
    ${stageTitle('Nothing to practice yet')}
    <div class="card empty-state"><p><strong>Good news!</strong></p>
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
  const answered = run.items.filter((it) => run.items_[it.id]?.first).length;
  const praise = !missed.length ? 'Every answer was right on the first try. Great work!'
    : first * 2 >= run.items.length ? 'Good work! The questions below are saved in Practice My Misses for this visit.'
      : 'Nice effort. Let\'s practice the ones below. They are saved in Practice My Misses for this visit.';
  return html`
    ${stageTitle('Your results')}
    <div class="card results">
      ${scoreLine(first, run.items.length, answered)}
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
    <p class="hint">${NOT_SAVED} This is a Study Scoop practice test, not the class test.</p>`;
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
  const answered = s.total - unanswered(run.items, { items: run.items_ }).length;
  // A math test belongs to a chapter (D26): its practice and its Practice My Misses are that chapter's.
  const chId = run.areaVocab ? 6 : run.subject === 'math' ? run.chapter || null : run.subject === 'mathwords' ? 5 : null;
  const CH_HOME = { 6: run.areaVocab ? ['areawords', 'avmisses'] : ['areapractice', 'areamisses'], 5: run.subject === 'mathwords' ? ['words', 'wmisses'] : ['practice', 'misses'] };
  const [homeSection, homeAct, missAct] = chId ? ['math', ...CH_HOME[chId]] : [...(TEST_HOME[run.subject] || [run.subject, null]), null];
  const practiceHref = homeAct ? ctx.actLink(homeSection, homeAct) : ctx.link(homeSection);
  const inChapter = run.subject === 'math' && ctx.chapter;
  // A Skill Builders test belongs to its skill: practice, misses and "back" all go to that skill's menu.
  const card = run.subject === 'skills' ? parentOf(run) : null;
  return html`
    ${stageTitle(`${run.title}: your score`)}
    <div class="card results">
      ${scoreLine(s.right, s.total, answered, false)}
      <p>${s.passed ? 'You passed! Great work.' : `Not yet. ${run.pass} or more right means you passed. Look at the answers below, then practice and try again.`}</p>
      ${run.noSound ? html`<p class="notice">The sound was off for some words, so a grown-up read them. That is fine for practice.</p>` : ''}
      ${skills.length > 1 ? html`<table class="skills"><caption>Your score in each part</caption><tbody>${skills.map(([k, list]) => html`<tr><th scope="row">${SKILL_LABEL[k]}</th><td>${list.filter((it) => run.items_[it.id]?.status === 'correct').length} of ${list.length}</td></tr>`)}</tbody></table>` : ''}
      <p class="print-only">${ctx.week.label} · Study Scoop practice test (not the class test)</p>
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
        ${s.missed.length && (run.subject !== 'math' || missAct) ? html`<a class="btn" href="${card ? ctx.actLink('skills', missesAct('skills', run.act)) : missAct ? ctx.actLink('math', missAct) : ctx.actLink(homeSection, 'misses')}">Practice My Misses</a>` : ''}
        ${card ? '' : html`<a class="btn" href="${practiceHref}">${chId ? `Chapter ${chId} Practice` : `Practice ${SUBJECT[run.subject]}`}</a>`}
        <a class="btn" href="${ctx.link('week')}">${ICONS.home}<span>Home</span></a>
      </span>
      ${card ? html`<a class="btn btn-primary" href="${ctx.actLink('skills', card.id)}">Back to ${card.label}</a>`
        : inChapter ? html`<a class="btn btn-primary" href="${ctx.chapterLink(ctx.chapter.id)}">Back to Chapter ${ctx.chapter.id}</a>`
          : html`<a class="btn btn-primary" href="${ctx.link('tests')}">Back to Tests</a>`}
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
  const rule = sp.rules[w.rule] || '';
  // The whole card is one button: click, tap, Enter or Space turns it over. Only one side is ever on the page,
  // and the front never shows the spelling (base word + ending and the sentence with a blank).
  return html`
    ${stageTitle(`Card ${f.i + 1} of ${words.length}`)}
    <button type="button" class="flashcard${f.flipped ? ' is-flipped' : ''}" data-act="flip" aria-describedby="flip-help"
      aria-label="${f.flipped ? `Back of the card: ${w.word}. ${rule ? `${rule}. ` : ''}${w.sentence}` : `Front of the card. ${blankSentence(w.sentence, w.word).replace(/_+/g, 'blank')} Press Hear the word, spell it out loud, then turn the card over.`}">
      ${f.flipped ? html`
        <span class="face back">
          <span class="side-label">Back of the card</span>
          ${wordPicture(ctx, [w.word, w.img], '')}
          <span class="flash-word">${w.word}</span>
          ${rule ? html`<span class="flash-rule">${rule}${sp.ruleHelp?.[w.rule] ? html`<span class="rule-help">${sp.ruleHelp[w.rule]}</span>` : ''}</span>` : ''}
          <span class="sentence">${w.sentence}</span>
        </span>`
        : html`
        <span class="face front">
          <span class="side-label">Front of the card</span>
          <span class="flash-clue">Which word fits?</span>
          <span class="sentence">${blanks(blankSentence(w.sentence, w.word))}</span>
          <span class="tap">Press Hear the word. Spell it out loud. Then tap the card to check.</span>
        </span>`}
    </button>
    <p class="sr-only" id="flip-help">Press Enter or Space to turn the card over.</p>
    <div class="btn-row center flash-tools">
      <button type="button" class="btn btn-primary flip-btn" data-act="flip">Flip Card</button>
      ${soundButton('say-card', 'Hear the word')}
      <button type="button" class="btn" data-act="shuffle">Shuffle</button>
    </div>
    ${f.flipped || mark ? html`<div class="btn-row center marks" role="group" aria-label="Did you spell it right?">
      <button type="button" class="btn mark-known" data-act="mark" data-mark="known" aria-pressed="${mark === 'known' ? 'true' : 'false'}">I know it</button>
      <button type="button" class="btn mark-again" data-act="mark" data-mark="again" aria-pressed="${mark === 'again' ? 'true' : 'false'}">Practice again</button>
    </div>` : html`<p class="hint center">Turn the card over to check your spelling. Then mark it.</p>`}
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
  const tw = teacherWord(ctx.unit5Week || ctx.week, p);
  const d = definitionOf(ctx.unit5Week || ctx.week, p);
  const last = f.i === PROPERTIES.length - 1;
  return html`
    ${stageTitle(`Property ${f.i + 1} of ${PROPERTIES.length}`)}
    <div class="work has-pic prop-learn">
      <div class="card pic-card">
        ${propertyPicture(p)}
        <p class="equation fact">${facts(p.eq)}</p>
      </div>
      <div class="card">
        <div class="instruct-head"><h3>${p.name}</h3>${readButton([p.name, d ? `${d.teacher ? "Teacher's words" : 'Definition'}: ${d.text}` : '', d?.text === p.kid ? '' : `In other words: ${p.kid}`, ...p.steps], 'this property')}</div>
        ${definitionBlock(d)}
        ${d?.text === p.kid ? '' : html`<p class="kid-words"><span class="label">In other words</span>${p.kid}</p>`}
        ${p.contrast ? html`<p class="contrast"><span class="label">Do not mix them up</span> ${facts(p.contrast)}</p>` : ''}
        <h4 class="label">${p.second ? 'Example 1' : 'Example'}: ${facts(p.eq)}</h4>
        <ol class="steps">${p.steps.map((s, k) => html`<li><span class="sn" aria-hidden="true">${k + 1}</span><span>${facts(s)}</span></li>`)}</ol>
        ${p.key === 'distributive' && teacherExample(tw) ? html`<p class="teacher-line"><span class="label">Your teacher's example</span> ${facts(teacherExample(tw))}</p>` : ''}
      </div>
    </div>
    ${p.second ? html`<div class="work has-pic prop-learn second-ex">
      <div class="card pic-card">
        <div class="models">${modelFigure(p.second.model, p.second.caption)}</div>
        <p class="equation fact">${facts(p.second.eq)}</p>
      </div>
      <div class="card">
        <div class="instruct-head"><h4 class="ex2">Example 2: ${facts(p.second.eq)}</h4>${readButton(p.second.steps, 'example 2')}</div>
        <p>The same idea with two equal parts.</p>
        <ol class="steps">${p.second.steps.map((s, k) => html`<li><span class="sn" aria-hidden="true">${k + 1}</span><span>${facts(s)}</span></li>`)}</ol>
      </div>
    </div>` : ''}
    <div class="stage-nav">
      ${f.i > 0 ? html`<button type="button" class="btn" data-act="card-prev">‹ Previous Property</button>` : html`<span></span>`}
      ${last ? html`<a class="btn btn-primary" href="${ctx.actLink('math', 'practice')}">Next: Practice Problems ›</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next Property: ${PROPERTIES[f.i + 1].name.replace(' Property', '')} ›</button>`}
    </div>`;
}

/** A property's picture(s): one model, or two side by side (the Associative Property's two groupings). */
function propertyPicture(p) {
  if (p.models) return html`<div class="models">${p.models.map((m) => modelFigure(m.model, m.caption))}</div><p class="caption-all">${p.caption}</p>`;
  return html`<div class="models">${modelFigure(p.model, p.caption)}</div>`;
}

/** The teacher's exact words when the week has them; otherwise the property's definition, labelled as such. */
function definitionBlock(d) {
  if (!d) return '';
  return html`<blockquote class="teacher-words"><span class="label">${d.teacher ? "Teacher's words" : 'Definition'}</span><span class="def">${d.text}</span></blockquote>`;
}

/** Math > Math Vocabulary > Review My Words: one property word per card, with Previous and Next. */
function wordCards(ctx, run) {
  const f = run.flash;
  const p = PROPERTIES[f.i];
  const d = definitionOf(ctx.unit5Week || ctx.week, p);
  const last = f.i === PROPERTIES.length - 1;
  return html`
    ${stageTitle(`Word ${f.i + 1} of ${PROPERTIES.length}`)}
    <div class="work has-pic prop-learn word-card">
      <div class="card pic-card">
        ${propertyPicture(p)}
      </div>
      <div class="card">
        <div class="instruct-head"><h3 class="vocab-word">${p.name}</h3>${readButton([p.name, d ? `${d.teacher ? "Teacher's words" : 'Definition'}: ${d.text}` : '', d?.text === p.kid ? '' : `In other words: ${p.kid}`, `Example: ${p.eq}`], 'this word')}</div>
        ${definitionBlock(d)}
        ${d?.text === p.kid ? '' : html`<p class="kid-words"><span class="label">In other words</span>${p.kid}</p>`}
        <p class="example"><span class="tag">Example</span> <span class="equation">${facts(p.eq)}</span></p>
        ${p.contrast ? html`<p class="contrast"><span class="label">Do not mix them up</span> ${facts(p.contrast)}</p>` : ''}
      </div>
    </div>
    <div class="stage-nav">
      ${f.i > 0 ? html`<button type="button" class="btn" data-act="card-prev">‹ Previous</button>` : html`<span></span>`}
      ${last ? html`<a class="btn btn-primary" href="${ctx.actLink('math', 'words')}">Done: choose a quiz ›</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next: ${PROPERTIES[f.i + 1].name.replace(' Property', '')} ›</button>`}
    </div>`;
}

/** The tag on an Area word: on the Nov 3 test (teacher's words), or a Chapter 6 review word. */
const areaTag = (w) => html`<span class="word-tag ${w.teacher ? 'tag-test' : 'tag-review'}">${w.teacher ? 'Nov 3 test word' : 'Chapter review word'}</span>`;

/** Topic 6 > Area Words > Review My Words: one word per card, with its picture, meaning and an example. */
function areaWordCards(ctx, run) {
  const words = ctx.area.vocab.words;
  const f = run.flash;
  const w = words[f.order[f.i]];
  const last = f.i === words.length - 1;
  return html`
    ${stageTitle(`Word ${f.i + 1} of ${words.length}`)}
    <div class="work has-pic word-card">
      <div class="card pic-card"><div class="models">${modelFigure(w.model)}</div></div>
      <div class="card">
        <div class="instruct-head"><h3 class="vocab-word">${w.word}</h3>${readButton([w.word, `${w.teacher ? "Teacher's words" : 'Meaning'}: ${w.def}`, `In other words: ${w.kid}`, `Example: ${w.example}`], 'this word')}</div>
        <p>${areaTag(w)}</p>
        <blockquote class="teacher-words"><span class="label">${w.teacher ? "Teacher's words" : 'Meaning'}</span><span class="def">${w.def}</span></blockquote>
        <p class="kid-words"><span class="label">In other words</span>${facts(w.kid)}</p>
        <p class="example"><span class="tag">Example</span> ${facts(w.example)}</p>
      </div>
    </div>
    <div class="stage-nav">
      ${f.i > 0 ? html`<button type="button" class="btn" data-act="card-prev">‹ Previous</button>` : html`<span></span>`}
      ${last ? html`<a class="btn btn-primary" href="${menuLink(ctx, run)}">Done: choose a quiz ›</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next: ${words[f.order[f.i + 1]].word} ›</button>`}
    </div>`;
}

/** Topic 6 > Area Words > Flashcards: the front shows the picture and the meaning; the back shows the word. */
function areaFlashcards(ctx, run) {
  const words = ctx.area.vocab.words;
  const f = run.flash;
  const w = words[f.order[f.i]];
  return html`
    ${stageTitle(`Card ${f.i + 1} of ${words.length}`)}
    <button type="button" class="flashcard${f.flipped ? ' is-flipped' : ''}" data-act="flip" aria-describedby="flip-help"
      aria-label="${f.flipped ? `Back of the card: ${w.word}. ${w.example}` : `Front of the card. Which word means: ${w.def}? Say the word, then turn the card over.`}">
      ${f.flipped ? html`
        <span class="face back">
          <span class="side-label">Back of the card</span>
          <span class="flash-word">${w.word}</span>
          ${areaTag(w)}
          <span class="sentence">${w.example}</span>
        </span>` : html`
        <span class="face front">
          <span class="side-label">Front of the card</span>
          <span class="models">${modelFigure(w.model)}</span>
          <span class="flash-clue">Which word means:</span>
          <span class="sentence">${w.def}</span>
          <span class="tap">Say the word out loud. Then tap the card to check.</span>
        </span>`}
    </button>
    <p class="sr-only" id="flip-help">Press Enter or Space to turn the card over.</p>
    <div class="btn-row center flash-tools">
      <button type="button" class="btn btn-primary flip-btn" data-act="flip">Flip Card</button>
      <button type="button" class="btn" data-act="shuffle">Shuffle</button>
    </div>
    <div class="stage-nav">
      <button type="button" class="btn" data-act="card-prev"${f.i === 0 ? ' disabled' : ''}>‹ Previous</button>
      ${f.i === words.length - 1 ? html`<a class="btn btn-primary" href="${menuLink(ctx, run)}">Done: choose another activity</a>`
        : html`<button type="button" class="btn btn-primary" data-act="card-next">Next ›</button>`}
    </div>`;
}

// ---------------------------------------------------------------- menus

/** The Test Center: the four Study Scoop practice tests for the chosen week. */
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
            ${c.available
              ? html`<a class="btn btn-primary" href="${ctx.testLink(c.kind)}">Start test<span class="sr-only">: ${c.title}</span></a>`
              : html`<p class="unavailable"><strong>Not available.</strong> ${c.reason}</p>`}
            <dl class="facts">
              <div><dt>${c.dateLabel || 'Class test'}</dt><dd>${c.date ? formatLongDate(c.date) : c.review || 'No date given'}</dd></div>
              <div><dt>Questions</dt><dd>${c.available ? c.count : '—'}</dd></div>
            </dl>
            ${c.coverage ? html`<p class="coverage">${c.coverage}</p>` : ''}
            ${c.note ? html`<p class="grownups">${c.note}</p>` : ''}
          </li>`)}
      </ul>
    </section>`;
}
