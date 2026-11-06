// Reading Coach: real-browser checks of the stateful flows (real clicks, typing and keys in headless Chrome).
// Run: node tests/reading.browser.js            (the repository)
//      node tests/reading.browser.js --site _site   (a built site)
// SS_SHOTS=<folder> also writes screenshots. Voice, confirm() and page visibility are replaced by test doubles so
// speech, warnings and "page hidden" can be driven; phone widths here are SIMULATED, not a physical device.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, BASE, startBrowser, startServer } from './lib/harness.js';
import { buildItems } from './../js/lib/coach.js';

const arg = (k) => { const n = process.argv.indexOf(k); return n < 0 ? null : process.argv[n + 1]; };
const server = await startServer({ root: arg('--site') ? path.resolve(arg('--site')) : ROOT });
const base = server.origin + BASE;
const b = await startBrowser();
const SHOTS = process.env.SS_SHOTS;
let passed = 0; const failures = [];
const check = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ok   ${name}`); } catch (e) { failures.push(name); console.log(`  FAIL ${name}\n       ${String(e.message).split('\n').slice(0, 4).join('\n       ')}`); }
};
const eq = (a, e, m) => assert.deepEqual(a, e, m);
const ok = (v, m) => assert.ok(v, m);

// ---- test doubles: a voice that only finishes when told to, confirm() that records, and a hideable page
const DOUBLES = `
  window.__cancels = 0; window.__spoken = []; window.__utt = null;
  class U { constructor(t) { this.text = t; } }
  window.SpeechSynthesisUtterance = U;
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => [{ lang: 'en-US', localService: true }],
    cancel() { window.__cancels++; }, speak(u) { window.__spoken.push(u.text); window.__utt = u; } } });
  window.__finish = () => { const u = window.__utt; window.__utt = null; if (u && u.onend) u.onend(); };
  window.__word = (i) => { const u = window.__utt; if (u && u.onboundary) u.onboundary({ name: 'word', charIndex: i }); };
  window.__confirms = []; window.__confirmAnswer = true;
  window.confirm = (m) => { window.__confirms.push(m); return window.__confirmAnswer; };
  window.__hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__hidden });`;
await b.initScript(DOUBLES);

const js = (x) => b.js(x);
const click = async (sel) => { await b.clickAt(sel); };
const present = (sel) => js(`return !!document.querySelector(${JSON.stringify(sel)});`);
const count = (sel) => js(`return document.querySelectorAll(${JSON.stringify(sel)}).length;`);
const text = (sel = '#rd-stage') => js(`return document.querySelector(${JSON.stringify(sel)})?.innerText || '';`);
const open = async (id) => { await b.load(`${base}#reading?act=${id}`); await b.waitFor('!!document.querySelector("#rd .rd-stage")'); };
const go = async (step) => { await click(`.rd-steps [data-act="go"][data-step="${step}"]`); await b.waitFor(`document.querySelector('#rd-stage').dataset.step === ${JSON.stringify(step)}`); };
const setValue = (sel, v) => js(`const el = document.querySelector(${JSON.stringify(sel)}); el.focus(); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', { bubbles: true }));`);
const statusOf = (id) => js(`return document.querySelector('#item-${id} .rd-status')?.innerText || '';`);
const finishSpeech = async (max = 60) => { for (let i = 0; i < max && !(await present('#rd-stage .rd-q')); i++) await js('window.__finish();'); };
const shot = async (name) => { if (SHOTS) await b.shot(path.join(SHOTS, `${name}.png`)); };
const answerById = (id) => `#item-${id}`;

const EX = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/reading/missingbook.json'), 'utf8'));
const ITEMS = buildItems(EX);

try {
  await b.viewport(1280, 900);

  // ================================================================= recommended path and navigation
  await check('a recommended path is shown; optional activities are labelled in words and every activity is open', async () => {
    await open('missingbook');
    const path_ = await text('.rd-path');
    ok(path_.includes('Story Guide → Listen → Read along → Story map → Questions → Summary'), path_);
    ok(/Optional, and always open: Echo read, Your turn \(timed\), Writing, Check answers/.test(path_), path_);
    eq(await js('return [...document.querySelectorAll(".rd-steps .rd-step")].map(b => b.dataset.step);'), ['guide', 'listen', 'along', 'echo', 'turn', 'map', 'quiz', 'write', 'done', 'answers']);
    eq(await js('return [...document.querySelectorAll(".rd-step.is-optional")].map(b => b.dataset.step);'), ['echo', 'turn', 'write', 'answers']);
    for (const step of ['answers', 'write', 'turn', 'echo', 'map', 'quiz', 'done', 'listen', 'along', 'guide']) { await go(step); ok(await present('#rd-h'), `${step} opens`); }
  });

  await check('"Next sentence" and "Next activity" are unmistakably different controls', async () => {
    await open('missingbook'); await go('echo');
    ok(/Sentence 1 of 16/.test(await text('.rd-sentcount')));
    const sent = await js(`const b = document.querySelector('.rd-sentnext'); return { label: b.innerText, inBox: !!b.closest('.rd-sentbox'), inNav: !!b.closest('.rd-nav') };`);
    const act = await js(`const b = document.querySelector('.rd-actnext'); return { label: b.innerText, inBox: !!b.closest('.rd-sentbox'), inNav: !!b.closest('.rd-nav'), primary: b.classList.contains('btn-primary') };`);
    eq([sent.inBox, sent.inNav], [true, false]);
    eq([act.inBox, act.inNav, act.primary], [false, true, true]);
    ok(/^Next sentence/.test(sent.label) && /^Next activity: Your turn \(timed\) \(optional\)/.test(act.label), `${sent.label} | ${act.label}`);
    eq(await js(`const a = document.querySelector('.rd-sentnext'), c = document.querySelector('.rd-actnext'); return [getComputedStyle(a).backgroundColor !== getComputedStyle(c).backgroundColor, a.getBoundingClientRect().height < c.getBoundingClientRect().height];`), [true, true], 'different colour and size');
    await click('.rd-sentnext');
    ok(/Sentence 2 of 16/.test(await text('.rd-sentcount')), 'Next sentence stays in Echo read');
    eq(await js('return document.querySelector("#rd-stage").dataset.step;'), 'echo');
    ok(await present('[data-act="go"][data-step="map"].rd-actnav'), 'a way to skip the optional activity to the recommended one');
    await click('.rd-actnext');
    await b.waitFor('document.querySelector("#rd-stage").dataset.step === "turn"');
  });

  // ================================================================= question formats, feedback, hints
  await check('questions show "Not answered yet" (never "wrong") before any answer, and the exemplar has eight core questions', async () => {
    await open('missingbook'); await go('quiz');
    eq(await count('#rd-stage .rd-q'), 8);
    const statuses = await js('return [...document.querySelectorAll("#rd-stage .rd-q .rd-status")].map(s => s.innerText);');
    ok(statuses.every((s) => s === 'Not answered yet.'), statuses.join('|'));
    eq(await count('#rd-stage .rd-fb.no'), 0, 'nothing is marked wrong');
    eq(await count('#rd-stage .rd-blank'), 1, 'a typed blank');
    eq(await count('#rd-stage .rd-tfchoices'), 1, 'a true/false question');
    eq(await count('#rd-stage [data-act="seq"]'), 3, 'a sequence');
    ok((await count('#rd-stage [data-act="answer"]')) >= 12, 'multiple choice questions');
    await shot('questions-unanswered');
  });

  await check('typed blank: wrong is "not yet", the draft stays, an accepted variant is found independently', async () => {
    await open('missingbook'); await go('quiz');
    await setValue('#in-c1-nightly', 'dinner'); await click('#item-c1-nightly [data-act="check-blank"]');
    ok(/Not yet\. Let's look for the clue together/.test(await text('#item-c1-nightly')));
    eq(await statusOf('c1-nightly'), "Let's look for the clue together.");
    eq(await js('return document.querySelector("#in-c1-nightly").value;'), 'dinner', 'the typed text stays');
    await setValue('#in-c1-nightly', ' The Bed. '); await click('#item-c1-nightly [data-act="check-blank"]');
    eq(await statusOf('c1-nightly'), 'You found it independently.');
    ok(await js('return document.querySelector("#in-c1-nightly").disabled;'));
  });

  await check('bounded blanks accept equivalent answers and spelling slips but never a different concept', async () => {
    const tries = [['bedtime', true], ['BED', true], ['bedtim', true], ['breakfast', false], ['bad', false], ['school', false]];
    for (const [typed, good] of tries) {
      await open('missingbook'); await go('quiz');
      await setValue('#in-c1-nightly', typed); await click('#item-c1-nightly [data-act="check-blank"]');
      eq((await statusOf('c1-nightly')) === 'You found it independently.', good, `"${typed}"`);
    }
    await open('missingbook'); await go('map');
    for (const [typed, good] of [['mother', true], ['mothr', true], ['mum', true], ['dad', false], ['teacher', false]]) {
      await open('missingbook'); await go('map');
      await setValue('#in-m-characters', typed); await click('#item-m-characters [data-act="check-blank"]');
      eq((await statusOf('m-characters')) === 'You found it independently.', good, `"${typed}"`);
    }
  });

  await check('graduated hints: what to look for, then where, then the answer; the answer is not shown at the first mistake', async () => {
    await open('missingbook'); await go('quiz');
    const id = 'c4-question';
    await click(`#item-${id} [data-act="answer"][data-k="0"]`);       // a wrong choice
    ok(!(await text(`#item-${id}`)).includes('Where did you last read it?') || (await js(`return !document.querySelector('#item-${id} .rd-hints');`)), 'no hint box yet');
    eq(await count(`#item-${id} .rd-hint`), 0, 'a mistake does not open a hint by itself');
    eq(await statusOf(id), "Let's look for the clue together.");
    await click(`#item-${id} [data-act="hint"]`);
    eq(await count(`#item-${id} .rd-hint`), 1);
    ok(/Look for the words Noah's mom says out loud/.test(await text(`#item-${id} .rd-hints`)));
    ok(!(await text(`#item-${id} .rd-hints`)).includes('Where did you last read it?'), 'hint 1 does not give the answer');
    await click(`#item-${id} [data-act="hint"]`);
    ok((await text(`#item-${id} .rd-hints`)).includes('“Let\'s think,” she said') || (await text(`#item-${id} .rd-hints`)).includes('Let\'s think'), 'hint 2 quotes the evidence sentence');
    ok(!/The answer:/.test(await text(`#item-${id} .rd-hints`)), 'hint 2 only points at the sentence; it does not state the answer (the sentence itself may contain the answer words)');
    await click(`#item-${id} [data-act="hint"]`);
    ok(/The answer: Where did you last read it\?/.test(await text(`#item-${id} .rd-hints`)), 'hint 3 shows the answer and why');
    ok(await js(`return document.querySelector('#item-${id} [data-act="hint"]').disabled;`), 'no hint 4');
    await shot('help-three-levels');
    await click(`#item-${id} [data-act="answer"][data-k="2"]`);
    eq(await statusOf(id), 'You found it after a hint.', 'finished after help is not "independent"');
  });

  await check('true/false asks him to correct the false statement; the inference asks for the proving sentence', async () => {
    await open('missingbook'); await go('quiz');
    await click('#item-c2-ontime [data-act="tf"][data-v="true"]');
    eq(await statusOf('c2-ontime'), "Let's look for the clue together.");
    await click('#item-c2-ontime [data-act="tf"][data-v="false"]');
    ok(/Fix it/.test(await text('#item-c2-ontime')) && (await count('#item-c2-ontime .rd-follow [data-act="answer"]')) === 3, 'the correction choices appear');
    await click('#item-c2-ontime .rd-follow [data-act="answer"][data-k="2"]');                 // wrong correction
    ok(/Not yet/.test(await text('#item-c2-ontime')));
    await click('#item-c2-ontime .rd-follow [data-act="answer"][data-k="0"]');
    eq(await statusOf('c2-ontime'), 'You found it independently.');
    await click('#item-c7-careful [data-act="answer"][data-k="1"]');
    ok(/Prove it/.test(await text('#item-c7-careful')), 'the proving sentence is asked for');
    await click('#item-c7-careful .rd-follow [data-act="answer"][data-k="0"]');
    eq(await statusOf('c7-careful'), 'You found it independently.');
  });

  await check('sequence: a wrong card is "not yet", right cards are numbered in place', async () => {
    await open('missingbook'); await go('quiz');
    const order = ITEMS.core.find((x) => x.id === 'c5-search').order;
    await click(`#item-c5-search [data-act="seq"][data-card="${order[2]}"]`);
    eq(await count('#item-c5-search [data-act="seq"][disabled]'), 0);
    ok(/Not yet/.test(await text('#item-c5-search')));
    for (const card of order) await click(`#item-c5-search [data-act="seq"][data-card="${card}"]`);
    eq(await statusOf('c5-search'), 'You found it independently.');
    eq(await js('return [...document.querySelectorAll("#item-c5-search .rd-choice b")].map(b => b.innerText).sort();'), ['1.', '2.', '3.'], 'cards are numbered 1, 2, 3');
    eq(await js(`return ${JSON.stringify(order)}.map(c => document.querySelector('#item-c5-search [data-card="' + c + '"] b').innerText);`), ['1.', '2.', '3.'], 'each card carries its place in the order');
  });

  // ================================================================= look back, drafts, position
  await check('looking back preserves answers, typing, focus, position and activity state, and is not counted as help', async () => {
    await open('missingbook'); await go('quiz');
    await click('#item-c4-question [data-act="answer"][data-k="0"]');
    await setValue('#in-c1-nightly', 'bed');                                   // typed, not yet checked
    await js(`document.querySelector('#item-c1-nightly [data-act="lookback"]').scrollIntoView({ block: 'center' });`);
    const before = await js(`const el = document.querySelector('#item-c1-nightly'); return { top: Math.round(el.getBoundingClientRect().top + window.scrollY), scroll: Math.round(window.scrollY), rendered: document.getElementById('app').dataset.rendered };`);
    await click('#item-c1-nightly [data-act="lookback"]');
    ok(await present('#item-c1-nightly .rd-lb'), 'the story opens under the question');
    ok((await text('#item-c1-nightly .rd-lb')).includes('He read it every night before bed.'));
    const during = await js(`return { value: document.querySelector('#in-c1-nightly').value, wrong: document.querySelectorAll('#item-c4-question .rd-choice.is-wrong').length, rendered: document.getElementById('app').dataset.rendered, expanded: document.querySelector('#item-c1-nightly [data-act="lookback"]').getAttribute('aria-expanded') };`);
    eq([during.value, during.wrong, during.expanded], ['bed', 1, 'true']);
    eq(during.rendered, before.rendered, 'the activity was not redrawn');
    const afterOpen = await js(`const el = document.querySelector('#item-c1-nightly'); return { top: Math.round(el.getBoundingClientRect().top + window.scrollY), scroll: Math.round(window.scrollY) };`);
    eq(afterOpen.top, before.top, 'the question stays where it is on the page');
    ok(Math.abs(afterOpen.scroll - before.scroll) <= 2, `the page did not scroll by itself (${before.scroll} -> ${afterOpen.scroll})`);
    await click('#item-c1-nightly .rd-lb [data-close]');
    eq(await present('#item-c1-nightly .rd-lb'), false);
    eq(await js('return document.querySelector("#in-c1-nightly").value;'), 'bed');
    eq(await statusOf('c1-nightly'), 'Not answered yet.', 'looking back is not an attempt and not help');
    await click('#item-c1-nightly [data-act="check-blank"]');
    eq(await statusOf('c1-nightly'), 'You found it independently.', 'looking back did not count as help');
    // The Story map and Questions steps each offer a look back at the top as well.
    ok(await present('#rd-stage > p [data-act="lookback"][data-id="step"]'));
    await shot('look-back-open');
  });

  await check('typed answers survive switching activities and the written response keeps its text (reported issue 1)', async () => {
    await open('missingbook'); await go('quiz');
    await setValue('#in-c1-nightly', 'bed');
    await go('guide'); await go('quiz');
    eq(await js('return document.querySelector("#in-c1-nightly").value;'), 'bed');
    await go('map'); await setValue('#in-m-characters', 'mom'); await go('write'); await setValue('#w-w1-worried', 'Noah was worried because he might lose it.');
    await go('quiz'); await go('map'); await go('write');
    eq(await js('return document.querySelector("#w-w1-worried").value;'), 'Noah was worried because he might lose it.');
    await go('map');
    eq(await js('return document.querySelector("#in-m-characters").value;'), 'mom');
  });

  // ================================================================= written responses
  await check('written responses use a real text field, starters, a model and a self-check; nothing is auto-graded', async () => {
    await open('missingbook'); await go('write');
    eq(await count('#rd-stage textarea'), 3, 'three real text fields');
    ok(await js('return [...document.querySelectorAll("#rd-stage textarea")].every(t => document.querySelector(`label[for="${t.id}"]`));'), 'each field has a label');
    ok(await js('return document.querySelector(`[data-act="w-compare"][data-id="w1-worried"]`).disabled;'), 'compare waits for writing');
    await click('[data-act="starter"][data-id="w1-worried"]');
    eq(await js('return document.querySelector("#w-w1-worried").value;'), 'Noah was worried because ___.');
    eq(await text('#item-w1-worried .rd-status'), 'Not written yet.', 'an untouched starter is not an answer');
    await setValue('#w-w1-worried', 'Noah was worried because he did not want to lose a library book.');
    eq(await text('#item-w1-worried .rd-status'), 'Not written yet.', 'status updates when he presses compare, not on every key');
    await click('[data-act="w-compare"][data-id="w1-worried"]');
    ok(/Self-assessed/.test(await text('#item-w1-worried .rd-status')), await text('#item-w1-worried .rd-status'));
    ok((await text('#item-w1-worried .rd-model')).includes('A good answer:'), 'a model');
    eq(await count('#item-w1-worried .rd-checklist input[type="checkbox"]'), 3, 'a comparison checklist');
    ok(/A grown-up should read it/.test(await text('#item-w1-worried .rd-model')));
    await click('#item-w1-worried .rd-checklist input[data-k="0"]');
    await shot('written-response');
  });

  // ================================================================= hints and answer reveal tracking
  await check('seeing an answer in Check answers before finishing counts as help; after finishing it changes nothing', async () => {
    await open('missingbook'); await go('quiz');
    await click('#item-c4-question [data-act="answer"][data-k="2"]');                    // finished independently
    await go('answers');
    await click('[data-act="toggle-key"][data-id="c4-question"]');                       // reviewed after finishing
    await click('[data-act="toggle-key"][data-id="c6-car"]');                            // shown before answering
    await go('quiz');
    eq(await statusOf('c4-question'), 'You found it independently.');
    await click('#item-c6-car [data-act="answer"][data-k="1"]');
    eq(await statusOf('c6-car'), 'You found it after a hint.', 'answered after seeing the answer');
  });

  await check('Check answers stays available with no password and clue colours stay out of every other activity', async () => {
    await open('missingbook');
    for (const step of ['guide', 'listen', 'along', 'echo', 'turn', 'map', 'quiz', 'write', 'done']) { await go(step); eq(await count('#rd-stage .rd-clue'), 0, `${step} has no clue colours`); }
    await go('answers');
    eq(await count('#rd-stage input[type="password"]'), 0);
    eq(await count('#rd-stage .rd-reveal'), 2 + 6 + 8 + 3 + 1 - 1, 'a row for every question, map item and writing prompt');
    eq(await count('#rd-stage .rd-clue'), 0, 'clue colours are off until he turns them on');
    await click('[data-act="key-clues"]');
    ok((await count('#rd-stage .rd-clue')) > 10);
    await go('map'); eq(await count('#rd-stage .rd-clue'), 0);
  });

  // ================================================================= retry without erasing other work
  await check('retry starts a fresh round for missed questions and keeps everything else, including timed readings and first tries', async () => {
    await open('missingbook');
    await go('turn'); await click('[data-act="turn-start"]'); await click('[data-act="turn-done"]'); await click('[data-act="turn-save"]');
    eq(await count('#rd-stage .rd-reading'), 1);
    await go('quiz');
    await click('#item-c4-question [data-act="answer"][data-k="0"]');                    // wrong
    await click('#item-c4-question [data-act="answer"][data-k="2"]');                    // then right, no help: independent
    await click('#item-c3-feeling [data-act="answer"][data-k="0"]');                     // wrong, left practicing
    await click('#item-c3-feeling [data-act="hint"]'); await click('#item-c3-feeling [data-act="answer"][data-k="2"]'); // with help
    await click('#item-c1-nightly [data-act="check-blank"]');                            // empty: asks him to type, no attempt
    await setValue('#in-c1-nightly', 'dinner'); await click('#item-c1-nightly [data-act="check-blank"]'); // practicing
    ok(/Practice the 2 I am still working on/.test(await text('#rd-stage .rd-progress + p')), await text('#rd-stage .rd-progress + p'));
    await go('done');
    await click('[data-act="retry-all-missed"]');
    eq(await js('return document.querySelector("#rd-stage").dataset.step;'), 'quiz');
    eq(await statusOf('c3-feeling'), 'Not answered yet.', 'a fresh round');
    ok(/Round 2/.test(await text('#item-c3-feeling')));
    eq(await statusOf('c4-question'), 'You found it independently.', 'finished work is untouched');
    eq(await js('return document.querySelector("#in-c1-nightly").value;'), '', 'the old wrong try is cleared for the new round');
    await go('turn');
    eq(await count('#rd-stage .rd-reading'), 1, 'the timed reading is still there');
    await go('quiz');
    await click('#item-c3-feeling [data-act="answer"][data-k="2"]');
    eq(await statusOf('c3-feeling'), 'You found it independently.', 'right on the new round without help');
    await go('done');
    const sum = await text('#rd-summary');
    ok(/Relieved|How did Noah feel after the book was found/.test(sum) && /practiced again/.test(sum), 'the summary shows it was practiced again');
    ok(/First try[\s\S]*Not yet/.test(sum), 'the first try is still on record');
  });

  // ================================================================= timed reading
  await check('the timer pauses when he leaves the activity and the time away is not counted (reported issue 2)', async () => {
    await open('missingbook'); await go('turn');
    await click('[data-act="turn-start"]');
    await go('guide');
    await b.wait(2400);                                                                  // away for 2.4 s
    await go('turn');
    ok(/Reading paused at 0:0[0-1]/.test(await text()), `paused: ${(await text()).slice(0, 120)}`);
    ok(/time away was not counted/.test(await text()));
    ok(await present('[data-act="turn-resume"]') && await present('[data-act="turn-redo"]'), 'resume or start over');
    await click('[data-act="turn-resume"]');
    await b.wait(1100);
    await click('[data-act="turn-done"]');
    const secs = await js('const m = /reading time was ([0-9]+):([0-9]+)/.exec(document.getElementById("rd-stage").innerText); return m ? Number(m[1]) * 60 + Number(m[2]) : -1;');
    ok(secs >= 1 && secs <= 2, `reading time ${secs}s must not include the 2.4s away`);
  });

  await check('hiding the page pauses the timer on purpose and says so', async () => {
    await open('missingbook'); await go('turn'); await click('[data-act="turn-start"]');
    await js(`window.__hidden = true; document.dispatchEvent(new Event('visibilitychange'));`);
    ok(/Reading paused/.test(await text()) && /page was hidden/.test(await text()));
    await js(`window.__hidden = false;`);
    await click('[data-act="turn-redo"]');
    ok(await present('[data-act="turn-start"]'), 'start over');
  });

  await check('an incomplete reading never recommends moving on and keeps completion, accuracy, pace and help separate (reported issue 3)', async () => {
    await open('missingbook'); await go('turn'); await click('[data-act="turn-start"]');
    await click('.rd-w[data-n="2"]');                                                    // one word tapped for help while reading
    await click('[data-act="turn-done"]');
    await click('[data-act="tool"][data-tool="stop"]'); await click('.rd-w[data-n="9"]');
    await click('[data-act="turn-save"]');
    const t = await text();
    ok(/stopped before the end/.test(t), t.slice(0, 400));
    ok(!/next step|harder/i.test(t), 'no advancement');
    for (const label of ['Finished?', 'Accuracy', 'Pace', 'Help']) ok(t.includes(label), label);
    ok(/No, stopped at word 10 of 106/.test(t) || /No, stopped at word 10 of/.test(t));
    ok(/1 word tapped/.test(t));
    ok(/Not scored for speed because the whole passage was not read/.test(t));
    eq(await count('#rd-stage meter'), 0, 'no pace bar for an unscored reading');
  });

  await check('a whole passage in a few seconds is not believable and a grown-up-assisted reading is not scored', async () => {
    await open('missingbook'); await go('turn'); await click('[data-act="turn-start"]'); await click('[data-act="turn-done"]'); await click('[data-act="turn-save"]');
    let t = await text();
    ok(/too short to be right/.test(t) && !/next step/i.test(t), t.slice(0, 300));
    ok(/Pace\s+Not shown: the time looks too short to be right/.test(t) && !/words right per minute \(/.test(t.split('Pace')[1] || ''), 'no made-up pace number is printed for an unbelievable time');
    await open('missingbook'); await go('turn'); await click('[data-act="turn-start"]'); await click('[data-act="turn-done"]');
    await click('[data-act="assisted"]'); await click('[data-act="turn-save"]');
    t = await text();
    ok(/a grown-up helped read some words/.test(t) && !/next step/i.test(t), t.slice(0, 300));
  });

  // ================================================================= read-along
  await check('tapping a word during read-along stops the voice AND resets the button and the lit words (reported issue 7)', async () => {
    await open('missingbook'); await go('along');
    await click('[data-act="play-along"]');
    await js('window.__word(0);');
    eq(await text('[data-act="play-along"]'), 'Stop');
    ok((await count('#rd-stage .rd-w.now, #rd-stage .rd-sent.now')) > 0, 'something is lit');
    const cancels = await js('return window.__cancels;');
    await click('.rd-w[data-n="5"]');
    ok((await js('return window.__cancels;')) > cancels, 'speech was cancelled');
    eq(await text('[data-act="play-along"]'), 'Read it to me', 'the button says it is stopped');
    eq(await count('#rd-stage .rd-w.now, #rd-stage .rd-sent.now'), 0, 'nothing stays lit');
    eq(await js('return document.querySelector(\'[data-act="play-along"]\').getAttribute("aria-pressed");'), 'false');
  });

  // ================================================================= self-assessment and other passages
  await check('passage-original "say it" items are self-checked and kept out of the checked results (reported issue 4)', async () => {
    await open('stuckkite'); await go('quiz');
    await click('[data-act="say-show"]'); await click('[data-act="say-grade"][data-ok="1"]');
    await go('done');
    const sum = await text('#rd-summary');
    ok(/Self-checked \(not scored by the page\)/.test(sum), 'listed separately');
    ok(/Found independently: 0/.test(sum), 'not counted as found independently');
    ok(!/right on the first try/i.test(sum), 'no "right on the first try" claim');
  });

  await check('the other seven passages still work: every question answers correctly, in every format', async () => {
    for (const id of ['stuckkite', 'pip', 'busybees', 'leafcolor', 'lemonade', 'raindelay', 'octopus']) {
      const s = JSON.parse(fs.readFileSync(path.join(ROOT, `data/reading/${id}.json`), 'utf8'));
      ok(!s.coach, `${id} keeps its original questions`);
      const its = buildItems(s);
      await open(id);
      await go('listen'); await click('[data-act="play-all"]'); await finishSpeech();
      const drive = async (it) => {
        const sel = `#item-${it.id}`;
        if (it.format === 'choice') await click(`${sel} [data-act="answer"][data-k="${it.right}"]`);
        else if (it.format === 'tf') await click(`${sel} [data-act="tf"][data-v="${it.right}"]`);
        else if (it.format === 'blank') { await setValue(`#in-${it.id}`, it.blank); await click(`${sel} [data-act="check-blank"]`); }
        else if (it.format === 'sequence') for (const c of it.order) await click(`${sel} [data-act="seq"][data-card="${c}"]`);
        else { await click(`${sel} [data-act="say-show"]`); await click(`${sel} [data-act="say-grade"][data-ok="1"]`); }
      };
      for (const it of its.listen) await drive(it);
      await go('map'); for (const it of its.map) await drive(it);
      await go('quiz'); for (const it of its.core) await drive(it);
      await go('done');
      const sum = await text('#rd-summary');
      const checked = its.all.filter((x) => x.format !== 'say').length;
      ok(new RegExp(`Found independently: ${checked} `).test(sum), `${id}: all ${checked} checked questions found independently: ${sum.match(/Found independently[^\n]*/)}`);
      ok(/Self-checked/.test(sum) || !its.all.some((x) => x.format === 'say'), `${id} self-checked items listed apart`);
      await go('answers'); ok((await count('#rd-stage .rd-reveal')) === its.all.length, `${id} answer rows`);
    }
  });

  // ================================================================= summary and print
  await check('the parent summary lists activities, checked results, help, unanswered items, writing, skills and timed readings', async () => {
    await open('missingbook');
    await go('turn'); await click('[data-act="turn-start"]'); await click('[data-act="turn-done"]'); await click('[data-act="turn-save"]');
    await go('quiz');
    await click('#item-c4-question [data-act="answer"][data-k="2"]');
    await click('#item-c3-feeling [data-act="hint"]'); await click('#item-c3-feeling [data-act="answer"][data-k="2"]');
    await setValue('#in-c1-nightly', 'dinner'); await click('#item-c1-nightly [data-act="check-blank"]');
    await go('write'); await setValue('#w-w3-summary', 'First Noah lost it, then he told his mom, and finally they found it.'); await click('[data-act="w-compare"][data-id="w3-summary"]');
    await click('#item-w3-summary .rd-checklist input[data-k="1"]');
    await go('done');
    const sum = await text('#rd-summary');
    for (const part of ['Session summary', 'The Missing Library Book', 'Activities', 'Comprehension questions (checked by the page)', 'Completed with help', 'Not answered yet', 'Skills to revisit', 'Written responses (self-assessed, need a grown-up)', 'Timed readings (optional)', 'Reading strategies']) ok(sum.includes(part), part);
    ok(/Found independently: 1 .* Found after a hint: 1 .* Still practicing: 1 .* Not answered yet: 13 .* Total: 16/s.test(sum), sum.match(/Found independently[^\n]*/)?.[0]);
    ok(/Self-assessed\. A grown-up still needs to read it\./.test(sum) && /First Noah lost it/.test(sum), 'the written response and its review status');
    ok(/\[ \] I told the beginning/.test(sum) && /\[x\] I included the problem/.test(sum), 'the checklist results');
    ok(/Story Guide[\s\S]*Opened/.test(sum) && /Your turn \(timed\)[\s\S]*Done/.test(sum), 'activity statuses');
    ok(/Reading 1/.test(sum) && /Accuracy/.test(sum), 'timed readings listed');
    ok(!/Story complete/i.test(await text('#rd')), 'no "Story complete" claim');
    ok(!/Reviewed by a grown-up\./.test(await text('#rd-summary')), 'not reviewed yet');
    await click('[data-act="w-reviewed"][data-id="w3-summary"]');
    ok(/Status: Reviewed by a grown-up\./.test(await text('#rd-summary')), 'a grown-up can mark it reviewed, and the status changes');
    eq(await js('return document.querySelector(\'[data-act="w-reviewed"][data-id="w3-summary"]\').checked;'), true);
    await shot('parent-summary');
  });

  await check('the summary prints on its own: the page chrome is hidden in print', async () => {
    await open('missingbook'); await go('done');
    ok(await js('return document.body.classList.contains("rd-summary-open");'));
    await b.media('print');
    eq(await js(`return ['.top', 'nav.tabs', '.rd-nav', '.rd-steps', '.rd-nonprint'].map(s => { const el = document.querySelector(s); return !el || getComputedStyle(el).display === 'none'; });`), [true, true, true, true, true]);
    ok(await js('return getComputedStyle(document.querySelector("#rd-summary")).display !== "none";'));
    await b.media('');
    await go('guide'); ok(!(await js('return document.body.classList.contains("rd-summary-open");')));
  });

  // ================================================================= leaving
  await check('leaving asks first when work would be lost, not otherwise; declining changes nothing (no storage anywhere)', async () => {
    await open('missingbook');
    await js('window.__confirmAnswer = false; window.__confirms.length = 0;');
    await click('.lesson-bar a.home');                                                   // no work yet
    await b.waitFor('location.hash === "#week"');
    await open('missingbook'); await go('quiz');
    await js('window.__confirmAnswer = false; window.__confirms.length = 0;');
    await click('#item-c4-question [data-act="answer"][data-k="2"]');
    await click('.lesson-bar a.home');                                                   // work: asks; says no
    eq(await js('return window.__confirms.length;'), 1);
    ok(/not saved/.test(await js('return window.__confirms[0];')), await js('return window.__confirms[0];'));
    eq(await js('return location.hash;'), '#reading?act=missingbook', 'declined: still here');
    eq(await statusOf('c4-question'), 'You found it independently.', 'declined: work untouched');
    await js('window.__confirmAnswer = true; window.__confirms.length = 0;');
    await click('.lesson-bar a.home');                                                   // says yes
    await b.waitFor('location.hash === "#week"');
    eq(await js('return window.__confirms.length;'), 1, 'asked once, not twice');
    // Back button / typed address: declining puts the address back and draws nothing new.
    await open('missingbook'); await go('quiz'); await click('#item-c4-question [data-act="answer"][data-k="2"]');
    await js('window.__confirmAnswer = false; window.__confirms.length = 0; location.hash = "#spelling";');
    await b.waitFor('window.__confirms.length === 1');
    await b.waitFor('location.hash === "#reading?act=missingbook"');
    eq(await statusOf('c4-question'), 'You found it independently.', 'declining the Back button keeps the work');
    await js('window.__confirmAnswer = true; location.hash = "#spelling";');
    await b.waitFor('document.querySelector("#app h1")?.textContent === "Spelling"');
    await open('missingbook'); await go('quiz');
    eq(await statusOf('c4-question'), 'Not answered yet.', 'leaving and returning starts a fresh session');
    const stored = await js('return [localStorage.length, sessionStorage.length, document.cookie.length];');
    eq(stored, [0, 0, 0], 'nothing was stored');
  });

  await check('closing or reloading the tab warns only when there is work (a real browser "Leave site?" prompt)', async () => {
    await open('missingbook'); await go('quiz');
    eq(await js('const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented;'), false, 'no work, no warning');
    b.dialogs.length = 0;
    await b.send('Page.navigate', { url: 'about:blank' }); await b.waitFor('location.href === "about:blank"');
    eq(b.dialogs.length, 0, 'leaving with no work does not prompt');
    await open('missingbook'); await go('quiz');
    await click('#item-c4-question [data-act="answer"][data-k="2"]');
    eq(await js('const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented;'), true, 'work, warning');
    b.dialogs.length = 0;
    await b.send('Page.navigate', { url: 'about:blank' }); await b.waitFor('location.href === "about:blank"');
    eq(b.dialogs.map((d) => d.type), ['beforeunload'], 'the browser asked before unloading a page with work');
  });

  // ================================================================= keyboard, labels, focus
  await check('keyboard: Tab reaches the controls, Enter checks a blank, Space/Enter presses buttons, focus lands on the heading', async () => {
    await open('missingbook'); await go('quiz');
    eq(await js('return document.activeElement.id;'), 'rd-h', 'focus moves to the activity heading');
    await js('document.querySelector("#in-c1-nightly").focus();');
    await b.type('bed'); await b.key('Enter');
    eq(await statusOf('c1-nightly'), 'You found it independently.', 'Enter checks the blank');
    await js('document.querySelector("#item-c4-question [data-act=hint]").focus();');
    await b.key('Enter');
    eq(await count('#item-c4-question .rd-hint'), 1, 'Enter opens a hint');
    await b.key(' ');
    eq(await count('#item-c4-question .rd-hint'), 2, 'Space asks for the next hint');
    await b.waitFor('document.getElementById("live").textContent.length > 0');   // announcements are queued for a moment so repeats are heard
    await js('document.querySelector("#item-c4-question [data-act=answer]:not([disabled])").focus();');
    await b.key('Tab');
    ok(await js('return document.activeElement.matches("button, input, textarea, a, select");'), 'Tab moves along the controls');
  });

  await check('every control has an accessible name in every activity, and answer fields have labels', async () => {
    await open('missingbook');
    for (const step of ['guide', 'listen', 'along', 'echo', 'turn', 'map', 'quiz', 'write', 'done', 'answers']) {
      await go(step);
      const bad = await js(`return [...document.querySelectorAll('#rd button, #rd input, #rd textarea')].filter(el => el.getClientRects().length).filter(el => { const name = (el.getAttribute('aria-label') || el.innerText || el.value || '').trim() || (el.id && document.querySelector('label[for="' + el.id + '"]')?.innerText) || (el.closest('label')?.innerText || '').trim(); return !name; }).map(el => el.outerHTML.slice(0, 80));`);
      eq(bad, [], `${step}: controls without a name`);
    }
    await go('quiz');
    eq(await js('return [...document.querySelectorAll("#rd-stage .rd-blank")].every(i => i.getAttribute("aria-label") && i.getAttribute("aria-label").includes("blank"));'), true);
  });

  // ================================================================= responsive layouts
  await check('phone, tablet and desktop widths: no sideways scrolling, controls visible, touch targets large enough (simulated devices)', async () => {
    for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]]) {
      await b.viewport(w, h);
      await open('missingbook');
      for (const step of ['guide', 'listen', 'along', 'echo', 'turn', 'map', 'quiz', 'write', 'done', 'answers']) {
        await go(step);
        ok(await js('return document.documentElement.scrollWidth <= document.documentElement.clientWidth;'), `${w}px ${step}: no horizontal scroll`);
        const small = await js(`return [...document.querySelectorAll('#rd button, #rd input[type=text], #rd textarea, #rd .rd-nav a')].filter(el => el.getClientRects().length && !el.closest('.rd-lb')).map(el => [el, el.getBoundingClientRect()]).filter(([el, r]) => r.height < 44 && !el.classList.contains('rd-w') && el.type !== 'checkbox').map(([el, r]) => el.className + ' ' + Math.round(r.height)).slice(0, 4);`);
        eq(small, [], `${w}px ${step}: controls under 44px`);
      }
      if (w === 390) { await go('quiz'); await shot('phone-questions'); await go('done'); await shot('phone-summary'); }
    }
    await b.viewport(1280, 900);
  });

  await check('the rest of the site is intact: every section opens with no console errors, no failed requests', async () => {
    for (const id of ['week', 'spelling', 'vocab', 'reading', 'math', 'skills', 'homework', 'newsletter', 'tests']) {
      await b.load(`${base}#${id}`);
      ok(await present('#app h1'), `${id} has a heading`);
    }
    eq(b.errors, [], 'console errors');
    ok(!server.missing.length, `missing files: ${server.missing.join(', ')}`);
  });
} finally {
  b.close(); server.close();
}
console.log(`\n${passed} checks passed${failures.length ? `, ${failures.length} FAILED:\n - ${failures.join('\n - ')}` : ''}`);
process.exit(failures.length ? 1 : 0);
