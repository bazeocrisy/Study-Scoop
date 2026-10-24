// Skill Builders (DECISIONS D22): short skills a child can practise any week, one card per skill.
// Each card opens its own menu (Learn It, practice sets, Practice My Misses, a test). Questions use the same
// question card, step-by-step Help and results as the rest of Study Scoop.
import { html } from '../lib/html.js';
import { menuItems, activityInfo } from '../lib/activities.js';
import { roundItem, roundParts, timesItem } from '../lib/skills.js';
import { PLACE } from '../lib/rounding.js';
import { menuPage, subBar, subjectMenu } from './common.js';
import { activityView } from './activity.js';
import { readButton } from './lesson.js';

const HOME = (ctx) => ({ label: 'Skill Builders', href: ctx.link('skills') });
const GROUP = { add: 'skilladd', round: 'skillround', times: 'skilltimes' };
const LEARN = { addlearn: 'add', roundlearn: 'round', timeslearn: 'times' };

export function skillsView(ctx) {
  if (ctx.run) return activityView(ctx);
  if (GROUP[ctx.page]) return cardMenu(ctx, activityInfo('skills', ctx.page));
  if (LEARN[ctx.page]) return learnPage(ctx, activityInfo('skills', LEARN[ctx.page]), ctx.page);
  if (ctx.page === 'timespick') return pickPage(ctx, activityInfo('skills', 'times'));
  return menuPage(ctx, 'skills', {
    title: 'Skill Builders', items: menuItems('skills'),
    context: 'Short skills to practise any week. Each one has Learn It, practice with Help, and a test.',
  });
}

/** One skill's menu: Learn It, its practice sets, Practice My Misses and its test. */
function cardMenu(ctx, card) {
  return html`
    ${subBar(ctx, {
      tone: 'skills', title: card.label, goal: card.about,
      trail: [HOME(ctx), { label: card.label }], back: [{ href: ctx.link('skills'), label: '‹ Back to Skill Builders' }],
    })}
    <section class="menu" aria-labelledby="h-menu"><h2 id="h-menu" class="ask">What would you like to do?</h2>
      ${subjectMenu(ctx, 'skills', menuItems('skills', card.id), { misses: ctx.misses?.[GROUP[card.id]] })}</section>
    <div class="stage-nav"><a class="btn" href="${ctx.link('skills')}">‹ Back to Skill Builders</a><span></span></div>`;
}

// ---------------------------------------------------------------- Learn It pages

/** The examples on each skill's Learn It page: a title, the steps, and (for rounding) the number drawn the class way. */
export function learnExamples(skill) {
  if (skill === 'add') {
    return [
      { title: 'Make 10', steps: ['These pairs make 10: 1 + 9, 2 + 8, 3 + 7, 4 + 6, 5 + 5.', 'Turn them around and they still make 10: 9 + 1, 8 + 2, 7 + 3, 6 + 4.', 'Know them by heart. You will use them all the time.'] },
      { title: '10 plus a number', steps: ['10 + 6 is 1 ten and 6 ones.', 'So 10 + 6 = 16. No counting needed!'] },
      { title: 'Get to the next ten: 8 + 5', steps: ['8 needs 2 to make 10.', 'Break 5 into 2 + 3.', '8 + 2 = 10.', '10 + 3 = 13. So 8 + 5 = 13.'] },
      { title: 'It works with bigger numbers: 28 + 5', steps: ['28 needs 2 to make 30.', 'Break 5 into 2 + 3.', '28 + 2 = 30.', '30 + 3 = 33. So 28 + 5 = 33.'] },
      { title: 'Break it apart: 12 + 9', steps: ['Break 12 into tens and ones: 12 = 10 + 2.', 'Add the ten first: 10 + 9 = 19.', 'Then add the ones: 19 + 2 = 21.', 'So 12 + 9 = 21.'] },
      { title: 'Two big numbers: 38 + 27', steps: ['Break both numbers into tens and ones: 38 = 30 + 8 and 27 = 20 + 7.', 'Add the tens: 30 + 20 = 50.', 'Add the ones: 8 + 7 = 15.', 'Put them together: 50 + 15 = 65. So 38 + 27 = 65.'] },
    ];
  }
  if (skill === 'round') {
    const ex = (n, to, title) => ({ title, steps: roundItem(n, to).show, round: { n, to } });
    return [
      ex(45, 10, 'Round 45 to the nearest 10'),
      ex(63, 10, 'Round 63 to the nearest 10'),
      ex(347, 100, 'Round 347 to the nearest 100'),
      ex(897, 10, 'When a 9 goes up: round 897 to the nearest 10'),
      ex(962, 100, 'When a 9 goes up: round 962 to the nearest 100'),
    ];
  }
  return [
    { title: 'Find any fact from one you know', table: [
      ['× 2', 'Double it.'], ['× 3', 'Double it, then add one more group.'], ['× 4', 'Double it, then double again.'],
      ['× 5', 'Count by 5s.'], ['× 6', 'The 5s fact, plus one more group.'], ['× 7', 'The 5s fact plus the 2s fact.'],
      ['× 8', 'Double the 4s fact.'], ['× 9', 'The 5s fact plus the 4s fact.'], ['× 10', 'Write the number with a 0 after it.'],
    ] },
    // The first step is the strategy the practice questions use for that fact, so the example and the Help agree.
    { title: 'Example: 7 × 8', steps: [timesItem(7, 8).hints[0], ...timesItem(7, 8).show] },
    { title: 'Example: 6 × 4', steps: [timesItem(6, 4).hints[0], ...timesItem(6, 4).show] },
    { title: 'Turn it around', steps: ['8 × 3 is the same as 3 × 8. Use the one that is easier for you.', 'That is the Commutative Property.'] },
  ];
}

/** A number drawn the way the class rounds it: the underlined digit, and an arrow on the digit to its right. */
function roundPicture({ n, to }) {
  const p = roundParts(n, to);
  return html`<p class="round-pic" role="img" aria-label="${n}: the ${p.d} in the ${PLACE[to]} place is underlined, and an arrow points to the ${p.next}.">${[...p.digits].map((d, k) => html`<span class="${k === p.place ? 'digit is-under' : k === p.place + 1 ? 'digit is-arrow' : 'digit'}">${d}</span>`)}<span class="round-to" aria-hidden="true">→ ${p.answer}</span></p>`;
}

function learnPage(ctx, card, page) {
  const first = menuItems('skills', card.id).find((a) => !a.page && !a.misses && !a.test);
  return html`
    ${subBar(ctx, {
      tone: 'skills', title: `${card.label}: Learn It`, goal: card.about,
      trail: [HOME(ctx), { label: card.label, href: ctx.actLink('skills', card.id) }, { label: 'Learn It' }],
      back: [{ href: ctx.actLink('skills', card.id), label: `‹ Back to ${card.label}` }],
    })}
    <div class="skill-learn">
      ${learnExamples(card.id).map((ex) => html`
        <section class="card skill-ex" aria-labelledby="${page}-${slugOf(ex.title)}">
          <div class="instruct-head"><h2 id="${page}-${slugOf(ex.title)}">${ex.title}</h2>${readButton([ex.title, ...(ex.steps || []), ...(ex.table || []).map(([a, b]) => `Times ${a.replace('× ', '')}: ${b}`)], 'this example')}</div>
          ${ex.round ? roundPicture(ex.round) : ''}
          ${ex.steps ? html`<ol class="steps">${ex.steps.map((s, k) => html`<li><span class="sn" aria-hidden="true">${k + 1}</span><span>${s}</span></li>`)}</ol>` : ''}
          ${ex.table ? html`<table class="guide-table"><thead><tr><th scope="col">Fact</th><th scope="col">Do this</th></tr></thead><tbody>${ex.table.map(([a, b]) => html`<tr><th scope="row">${a}</th><td>${b}</td></tr>`)}</tbody></table>` : ''}
        </section>`)}
    </div>
    <div class="stage-nav">
      <a class="btn" href="${ctx.actLink('skills', card.id)}">‹ Back to ${card.label}</a>
      ${first ? html`<a class="btn btn-primary" href="${ctx.actLink('skills', first.id)}">Start: ${first.label} ›</a>` : html`<span></span>`}
    </div>`;
}

// ---------------------------------------------------------------- Pick My Facts

/** Times Tables > Pick My Facts: the child chooses one or more facts, then practises them three ways.
 *  The page is drawn here; js/times-practice.js runs it (nothing is saved). */
function pickPage(ctx, card) {
  const n12 = Array.from({ length: 12 }, (_, k) => k + 1);
  return html`
    ${subBar(ctx, {
      tone: 'skills', title: 'Pick My Facts', goal: 'Choose one fact or many, then pick how to practice.',
      trail: [HOME(ctx), { label: card.label, href: ctx.actLink('skills', card.id) }, { label: 'Pick My Facts' }],
      back: [{ href: ctx.actLink('skills', card.id), label: `‹ Back to ${card.label}` }],
    })}
    <div class="tp" id="tp">
      <section class="card tp-pick" id="tp-setup" aria-labelledby="tp-h-facts">
        <div class="tp-row"><h2 id="tp-h-facts">1. Which facts?</h2>
          <p class="btn-row"><button type="button" class="btn" data-tp="all">All</button><button type="button" class="btn" data-tp="clear">Clear</button></p></div>
        <div class="tp-chips" role="group" aria-label="Facts">
          ${n12.map((n) => html`<button type="button" class="tp-chip" id="tp-fact-${n}" data-fact="${n}" aria-pressed="false" aria-label="The ${n}s facts">${n}</button>`)}
        </div>
        <div class="tp-row"><span class="label">Multiply up to</span>
          <p class="tp-seg" role="group" aria-label="Multiply up to"><button type="button" class="btn" id="tp-max-10" data-max="10" aria-pressed="true">× 10</button><button type="button" class="btn" id="tp-max-12" data-max="12" aria-pressed="false">× 12</button></p></div>
      </section>
      <p class="tp-summary" id="tp-summary" hidden>
        <span id="tp-summary-text"></span>
        <button type="button" class="btn" data-tp="edit-facts">Change facts</button>
      </p>
      <section aria-labelledby="tp-h-mode">
        <h2 id="tp-h-mode" class="ask">2. How do you want to practice?</h2>
        <div class="tp-modes" role="group" aria-label="Practice mode">
          <button type="button" class="tp-mode" id="tp-mode-flash" data-mode="flash" aria-pressed="true"><span class="tp-mode-t">Flashcards</span><span class="tp-mode-a">Tap a card to flip it.</span></button>
          <button type="button" class="tp-mode" id="tp-mode-find" data-mode="find" aria-pressed="false"><span class="tp-mode-t">Find the Fact</span><span class="tp-mode-a">See the answer. Fill in the two numbers.</span></button>
          <button type="button" class="tp-mode" id="tp-mode-quiz" data-mode="quiz" aria-pressed="false"><span class="tp-mode-t">Quick Quiz</span><span class="tp-mode-a">See the fact. Type the answer.</span></button>
        </div>
      </section>
      <section class="card tp-stage" id="tp-stage" aria-live="polite"><p class="tp-empty">Tap a number above to pick a fact.</p></section>
    </div>
    <div class="stage-nav"><a class="btn" href="${ctx.actLink('skills', card.id)}">‹ Back to ${card.label}</a><span></span></div>`;
}

const slugOf = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
