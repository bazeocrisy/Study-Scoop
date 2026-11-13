import { mountPacketTools } from './views/packet-tools.js';
// Activity player: the DOM code for Spelling, Vocabulary and Math practice and for the practice tests (DECISIONS D18, D19).
// Progress, misses and test answers live in memory for this visit only (never stored), keyed by week, so weeks never mix.
import { check, helpSteps, solution } from './lib/lessons.js';
import { showNewStep } from './lib/help-scroll.js';
import { WORD_MODES, activityInfo, isMissesAct, mathItems, mathWordItems, missGroup, rng, shuffle, shuffleRounds, spellItem, spellingItems, testFor, vocabItems, vocabPractice } from './lib/activities.js';
import { PROPERTIES } from './lib/mathlearn.js';
import { SKILL_SETS, timesFamilyFlash, timesFamilyPractice, timesFamilyFind, findItCorrect } from './lib/skills.js';
import { AREA_CARDS, AREA_SETS, areaItems, areaVocabWords } from './lib/area.js';
import { packetItems } from './lib/homework.js';
import { FRACTION_VOCAB_MODES, FRACTION_PRACTICE_ACTS, fractionVocabItems, fractionPracticeItems } from './lib/chapter7.js';
import { html } from './lib/html.js';
import { activityInner, timesFlashView, timesFindView } from './views/activity.js';
import { skillsView } from './views/skills.js';
import { unanswered, lessonHelpSteps, teachingFeedbackFor } from './views/lesson.js';

const runs = new Map();    // "week:section:act" -> run
const fractionHistories = new Map(); // Chapter 7 assistance, held only until this tab reloads.
const misses = new Map();  // "week:subject" -> Map(key -> { item, fromMark })

const missMap = (weekId, subject) => {
  // Skill Builders are not weekly: their misses stay when another week is chosen.
  const k = /^skill/.test(subject) ? `all:${subject}` : `${weekId}:${subject}`;
  if (!misses.has(k)) misses.set(k, new Map());
  return misses.get(k);
};
export const missCounts = (weekId) => Object.fromEntries(['vocab', 'spelling', 'math', 'mathwords', 'area', 'areavocab', 'fractions', 'fractionvocab', 'skilladd', 'skillround', 'skilltimes'].map((g) => [g, missMap(weekId, g).size]));

/** One entry per spelling word (Missing Letters and Hear and Spell share it); vocabulary questions are kept apart. */
// (Rounding questions also have a number `n`, but they are kept by their own id, which names the number and the place.)
const missKey = (item) => (item.n && !item.to ? `word-${item.n}` : item.id);
function addMiss(weekId, subject, item, fromMark = false) {
  const m = missMap(weekId, subject);
  const old = m.get(missKey(item));
  // Keep the harder form of a spelling word (Hear and Spell over Missing Letters); a real miss outranks a mark.
  // ("Add the ending" questions give the base word, so they are easier than hearing and spelling the word.)
  if (old && old.item.type === 'spell' && (item.type === 'letters' || String(item.id).startsWith('bw-'))) { old.fromMark = old.fromMark && fromMark; return; }
  m.set(missKey(item), { item, fromMark: Boolean(old ? old.fromMark && fromMark : fromMark) });
}

const seed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
/** A choice question with its options in a new order (True/False stays in order). */
const reshuffle = (item, rand) => (item.type === 'choice' && item.options.length > 2 ? { ...item, options: shuffle(item.options, rand) } : item);
/** What the cards of a card activity show: spelling words, vocabulary words, or the four math properties. */
const cardsFor = (ctx, subject, act) => (subject === 'math' && ctx.chapter?.id === 7 ? (ctx.fractions?.vocabulary || []) : AREA_CARDS.includes(act) ? areaVocabWords(ctx.area) : subject === 'math' ? PROPERTIES : subject === 'vocab' ? ctx.week.vocab.words : ctx.week.spelling.words);

function newRun(ctx, section, act) {
  const rand = rng(seed());
  const base = { items: [], items_: {}, i: 0, finished: false, submitted: false, warned: false, noSound: false };
  if (section === 'tests') {
    const t = testFor(act, ctx.week, ctx.tests, rand, ctx.mathWords, ctx.area);
    if (!t) return null;
    // The weekly math test belongs to the week's chapter (D26): its misses go to that chapter's Practice My Misses.
    const chapter = act === 'math' && ctx.week.mathChapter ? ctx.week.mathChapter : null;
    return { ...base, ...t, subject: act, group: chapter === 6 ? 'area' : act, act, mode: 'test', chapter, goal: `${t.topic} · ${t.items.length} questions` };
  }
  const info = activityInfo(section, act);
  if (section === 'math' && info?.chapter === 7) {
    const run = { ...base, subject: section, chapter: 7, group: missGroup(section, act), act, mode: info.test ? 'test' : 'practice', title: info.label, goal: info.about };
    const historyKey = `${ctx.weekId}:${run.group}`;
    if (!fractionHistories.has(historyKey)) fractionHistories.set(historyKey, {});
    run.history = fractionHistories.get(historyKey);
    if (!ctx.fractions) return { ...run, unavailable: true };
    if (info.test) return { ...run, ...ctx.fractions.test, items: ctx.fractions.test.items.map((x) => JSON.parse(JSON.stringify(x))), kind: 'math', chapter: 7 };
    if (act === 'fvflash') run.flash = { order: ctx.fractions.vocabulary.map((_, i) => i), i: 0, flipped: false, marks: {} };
    else if (isMissesAct(act)) run.items = [...missMap(ctx.weekId, run.group).values()].map((e) => reshuffle(e.item, rand));
    else if (FRACTION_VOCAB_MODES[act]) run.items = fractionVocabItems(ctx.fractions, FRACTION_VOCAB_MODES[act], rand);
    else if (FRACTION_PRACTICE_ACTS.includes(act)) run.items = fractionPracticeItems(ctx.fractions, act, rand);
    return run;
  }
  // A Math chapter's practice test (D26): the chapter's own test, taken inside the chapter (no Help until the end).
  if (section === 'math' && info.test) {
    const t = testFor('math', ctx.week, ctx.tests, rand, ctx.mathWords, ctx.area);
    if (!t) return { ...base, subject: section, group: missGroup(section, act), act, mode: 'test', title: info.label, goal: info.about, unavailable: true, chapter: info.chapter };
    return { ...base, ...t, kind: 'math', subject: section, group: missGroup(section, act), act, mode: 'test', title: info.label, chapter: info.chapter,
      goal: `${t.topic} · ${t.items.length} questions` };
  }
  // Skill Builders tests are tests (no Help until the end), kept on the skill's own menu.
  if (section === 'skills' && info.test) {
    const set = SKILL_SETS[act];
    return { ...base, subject: section, group: missGroup(section, act), act, mode: 'test', title: set.title, goal: set.coverage,
      items: set.make(rand), pass: set.pass, coverage: set.coverage,
      instructions: 'Answer every question, then press Finish the test. There is no Help during the test. You will see the right answers at the end.' };
  }
  const run = { ...base, subject: section, group: missGroup(section, act), act, mode: 'practice', title: info.label, goal: info.about };
  const cards = cardsFor(ctx, section, act);
  if (act === 'learn' || act === 'flash' || act === 'cards' || act === 'wreview' || AREA_CARDS.includes(act)) { run.flash = { order: cards.map((_, k) => k), i: 0, flipped: false, marks: {} }; if (AREA_CARDS.includes(act)) run.unavailable = !cards.length; }
  else if (isMissesAct(act)) run.items = [...missMap(ctx.weekId, run.group).values()].map((e) => reshuffle(e.item, rand));
  else if (WORD_MODES[act]) { run.items = mathWordItems(ctx.mathWords, act, rand); run.unavailable = !ctx.mathWords; }
  else if (AREA_SETS[act]) { run.items = areaItems(ctx.area, act, rand); run.unavailable = !ctx.area; }
  else if (section === 'math') { run.items = mathItems(ctx.practice, act, rand); run.unavailable = !ctx.practice; }
  else if (section === 'skills') run.items = SKILL_SETS[act].make(rand);
  // The homework packet: every page at once, in order (not shuffled), like the paper packet.
  else if (section === 'homework') {
    const pages = ctx.packet?.pages || [];
    const page = pages.find((pg) => pg.id === act);
    run.items = packetItems(ctx.packet).filter((it) => act === 'packet' || it.page === act);
    run.packet = true;
    run.packetFluency = pages.find((pg) => pg.fluency)?.fluency;
    run.unavailable = !ctx.packet || (act !== 'packet' && !page);
    run.title = page?.title || run.title;
  }
  else if (section === 'vocab') run.items = shuffleRounds(vocabItems(ctx.week, act, rand), rand);
  else run.items = shuffleRounds(spellingItems(ctx.week, act), rand);
  return run;
}

/** The activity or test named in the address (made on first visit, kept while the page is open). */
export function runFor(ctx, section, act) {
  const key = `${ctx.weekId}:${section}:${act}`;
  const old = runs.get(key);
  // Practice My Misses always starts from the current list of misses (a run in progress keeps going).
  const stale = (isMissesAct(old?.act) && (old.finished || !Object.keys(old.items_).length)) || (old?.unavailable && (activityInfo(section, act)?.chapter === 7 ? ctx.fractions : activityInfo(section, act)?.test && section === 'math' ? ctx.tests : WORD_MODES[act] ? ctx.mathWords : AREA_SETS[act] || AREA_CARDS.includes(act) ? ctx.area : ctx.practice));
  if (old && !stale) {
    // A misses run in progress also gets the questions missed since it started (QA5-1).
    if (isMissesAct(old.act)) {
      const have = new Set(old.items.map(missKey));
      old.items.push(...[...missMap(ctx.weekId, old.group).values()].map((e) => e.item).filter((it) => !have.has(missKey(it))));
    }
    return old;
  }
  const run = newRun(ctx, section, act);
  if (run) runs.set(key, run);
  return run;
}

/** Keep help/reveal history separate from a fresh round's first-attempt score. */
function noteFractionHistory(run, item, kind) {
  if (run.chapter !== 7 || !run.history) return;
  const id = item.id.replace(/^test-/, '');
  const entry = run.history[id] ||= { help: 0, revealed: false, checks: 0 };
  if (kind === 'check') entry.checks++;
  if (kind === 'help') entry.help++;
  if (kind === 'reveal') entry.revealed = true;
}

// ---------------------------------------------------------------- speech
const synth = () => globalThis.speechSynthesis;
let speakingBtn = null;
function stopSpeech() {
  synth()?.cancel();
  if (speakingBtn) setSpeaking(speakingBtn, false);
  speakingBtn = null;
}
/** While a button speaks, its label says "Stop" (pressing it again stops); its name is restored afterwards. */
function setSpeaking(btn, on) {
  const label = btn.querySelector('.read-label');
  // The button keeps its size while it says "Stop", so the answer box below never jumps (QA UAT-5).
  // (Set through the CSSOM, which the page's style-src policy allows; no style attribute is written in markup.)
  if (on) {
    const r = btn.getBoundingClientRect();
    btn.style.minWidth = `${r.width}px`;
    btn.style.minHeight = `${r.height}px`;
  } else {
    btn.style.minWidth = '';
    btn.style.minHeight = '';
  }
  if (label) label.textContent = on ? 'Stop' : btn.dataset.label;
  if (!btn.dataset.named) btn.dataset.named = btn.hasAttribute('aria-label') ? btn.getAttribute('aria-label') : '';
  if (on) btn.setAttribute('aria-label', 'Stop reading');
  else if (btn.dataset.named) btn.setAttribute('aria-label', btn.dataset.named);
  else btn.removeAttribute('aria-label');
  btn.classList.toggle('is-reading', on);
}
/** Says each part in turn with the device's own voice when it has one. Calls onfail once if speech fails. */
function speak(parts, { rate = 0.9, btn = null, onfail = () => {} } = {}) {
  stopSpeech();
  const local = synth().getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
  let failed = false;
  parts.forEach((text, k) => {
    const u = new SpeechSynthesisUtterance(text);
    if (local.length) u.voice = local[0];
    u.rate = rate;
    if (k === parts.length - 1) u.onend = () => { if (btn && speakingBtn === btn) { setSpeaking(btn, false); speakingBtn = null; } };
    u.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted' || failed) return;
      failed = true;
      if (btn && speakingBtn === btn) { setSpeaking(btn, false); speakingBtn = null; }
      onfail();
    };
    synth().speak(u);
  });
  if (btn) { setSpeaking(btn, true); speakingBtn = btn; }
}

// ---------------------------------------------------------------- mount
export function mountActivity(app, ctx, signal) {
  if (ctx.run.packet) mountPacketTools(app, () => run, signal, () => rerender('#stage-h'));
  const key = () => `${ctx.weekId}:${ctx.section}:${ctx.run.act}`;
  const live = document.getElementById('live');
  const area = () => app.querySelector('#act-stage');
  let announceTimer = null;
  let run = ctx.run;
  const byId = () => new Map(run.items.map((it) => [it.id, it]));

  const announce = (text) => {
    if (!live) return;
    clearTimeout(announceTimer);
    live.textContent = '';
    announceTimer = setTimeout(() => { live.textContent = text; }, 60);
  };
  // No sound (no speech on this device, a speech error, or "I can't hear it"): the written clue replaces the sound
  // buttons for the rest of this activity or test.
  const showFallback = () => {
    app.querySelectorAll('.dictate').forEach((d) => { if (d.querySelector('[data-act=no-sound]')) d.hidden = true; });
    app.querySelectorAll('.dictate-fallback').forEach((p) => { p.hidden = false; });
  };
  const soundOff = (why) => {
    if (!run.noSound) announce(why);
    run.noSound = true;
    showFallback();
    area().querySelector('.dictate-fallback')?.setAttribute('tabindex', '-1');
    area().querySelector('.dictate-fallback')?.focus();
  };
  const prepare = () => {
    if (!synth()) {
      app.querySelectorAll('.read, .sound').forEach((b) => b.remove());
      app.querySelectorAll('.dictate').forEach((d) => { if (!d.querySelector('button')) d.remove(); });
      run.noSound = run.noSound || app.querySelector('.dictate-fallback') !== null;
    }
    if (run.noSound) showFallback();
  };
  prepare();
  synth()?.getVoices();
  signal.addEventListener('abort', () => { stopSpeech(); clearTimeout(announceTimer); document.getElementById('leave-dialog')?.remove(); });

  // Leaving an unfinished test (Home, Back to Tests, the tabs) asks first. The answers are kept while the page
  // stays open, so coming back carries on where the child left off.
  if (run.mode === 'test') {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]:not(.skip)');
      if (!a || e.target.closest('#leave-dialog') || run.submitted || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (unanswered(run.items, { items: run.items_ }).length === run.items.length) return; // nothing answered yet
      e.preventDefault();
      confirmLeave(a.getAttribute('href'));
    }, { signal, capture: true });
  }
  function confirmLeave(href) {
    if (typeof HTMLDialogElement !== 'function') {
      if (window.confirm('Leave the test? You have not finished. Your answers are kept while this page stays open.')) location.hash = href;
      return;
    }
    document.getElementById('leave-dialog')?.remove();
    const dlg = document.createElement('dialog');
    dlg.id = 'leave-dialog';
    dlg.className = 'leave-dialog';
    dlg.setAttribute('aria-labelledby', 'leave-h');
    dlg.setAttribute('aria-describedby', 'leave-p');
    dlg.innerHTML = html`<h2 id="leave-h">Leave the test?</h2>
      <p id="leave-p">You have not finished. Your answers are kept while this page stays open, so you can come back and finish.</p>
      <p class="btn-row"><button type="button" class="btn btn-primary" data-choice="stay">Keep working</button>
        <button type="button" class="btn" data-choice="go">Leave the test</button></p>`.s;
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-choice]');
      if (!b) return;
      dlg.close();
      dlg.remove();
      if (b.dataset.choice === 'go') location.hash = href;
      else area()?.querySelector('#stage-h')?.focus();
    });
    dlg.addEventListener('cancel', () => setTimeout(() => { dlg.remove(); area()?.querySelector('#stage-h')?.focus(); }, 0));
    document.body.append(dlg);
    dlg.showModal();
    dlg.querySelector('[data-choice="stay"]').focus();
  }

  const rerender = (focus) => {
    stopSpeech();
    area().innerHTML = activityInner({ ...ctx, run }).s;
    prepare();
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
    const el = focus && [].concat(focus).map((s) => area().querySelector(s)).find(Boolean);
    if (el) el.focus({ preventScroll: false });
  };
  const itemState = (id) => (run.items_[id] ||= { resp: {}, tries: 0, hints: 0 });
  const readForm = (form) => {
    const resp = {};
    for (const el of form.querySelectorAll('input.box, textarea.box')) resp[el.name] = el.value;
    // "Choose all that are right": the ticked boxes, as a list.
    const ticked = [...form.querySelectorAll('input[type="checkbox"][name="multi"]:checked')].map((c) => c.value);
    if (ticked.length) resp.multi = ticked.join(',');
    // Radio buttons: the chosen answer, and for rounding the underlined digit and go up or stay.
    for (const r of form.querySelectorAll('input[type="radio"]:checked')) resp[r.name] = r.value;
    return resp;
  };
  const saveForm = (form) => { if (form?.dataset.item) itemState(form.dataset.item).resp = readForm(form); };

  // Misses: a question missed on the first try (or shown) is added; in Practice My Misses, a first-try right answer removes it.
  const noteFirst = (item, first) => {
    const m = missMap(ctx.weekId, run.group);
    if (first !== 'correct') addMiss(ctx.weekId, run.group, item);
    else if (isMissesAct(run.act) && m.get(missKey(item))?.item.id === item.id) m.delete(missKey(item));
  };

  function onCheck(form) {
    const item = byId().get(form.dataset.item);
    if (!item) return;
    const st = itemState(item.id);
    st.resp = readForm(form);
    const keyed = JSON.stringify(st.resp);
    if (keyed === st.lastChecked && st.status !== 'empty') return; // a double click is not a new try
    const r = check(item, st.resp, { catchAll: 'Try again.' });
    st.say = r.say;
    st.wrong = r.wrong;
    if (r.status === 'empty') {
      st.status = 'empty';
      announce(r.say);
      rerender(`form[data-item="${item.id}"] input[aria-invalid="true"], form[data-item="${item.id}"] input`);
      return;
    }
    st.lastChecked = keyed;
    st.tries += 1;
    noteFractionHistory(run, item, 'check');
    st.status = r.status;
    if (run.chapter === 7 && item.teaching) {
      st.teachingFeedback = teachingFeedbackFor({ chapter: 7 }, item, st.resp, r.status);
      if (st.teachingFeedback) {
        st.say = st.teachingFeedback.text; st.coachView = 'feedback';
        if (st.teachingFeedback.revealsAnswer && r.status !== 'correct') noteFractionHistory(run, item, 'reveal');
      }
    }
    if (!st.first) { st.first = r.status; noteFirst(item, r.status); }
    if (r.status !== 'correct' && st.tries === 1 && !(st.help > 0)) st.say += ' Press Help to see one step at a time.';
    announce(r.status === 'correct' ? st.say : `Not yet. ${st.say}`);
    // In the homework packet, a right answer moves on to the next question on the page.
    const after = run.packet ? run.items[run.items.findIndex((it) => it.id === item.id) + 1] : null;
    const visualFeedback = run.chapter === 7 && st.teachingFeedback;
    rerender(visualFeedback ? '[data-coach-heading]' : r.status === 'correct'
      ? (run.packet && run.act !== 'packet' ? ['[data-hw-nav="1"]:not([disabled])', '#stage-h'] : after ? [`form[data-item="${after.id}"] input:not([disabled])`, `form[data-item="${after.id}"] textarea`, '[data-act="next"]:not([disabled])'] : ['[data-act="next"]:not([disabled])', '[data-act="print"]'])
      // Focus stays on what the child chose (never on another answer, which would hint at it).
      : [`form[data-item="${item.id}"] input[type=radio]:checked`, `form[data-item="${item.id}"] [aria-invalid="true"]`, `form[data-item="${item.id}"] input:not([disabled])`, `form[data-item="${item.id}"] textarea`]);
    if (visualFeedback) area().querySelector('[data-coach="feedback"]')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  app.addEventListener('toggle', (e) => {
    const detail = e.target;
    if (run.chapter !== 7 || run.mode !== 'test' || !run.submitted || !detail.open || !detail.dataset.resourceTestCoach) return;
    const item = byId().get(detail.dataset.resourceTestCoach), st = item && itemState(item.id);
    if (!item || st.reviewOpened) return;
    st.reviewOpened = true; noteFractionHistory(run, item, 'reveal');
    const opened = [...area().querySelectorAll('[data-resource-test-coach][open]')].map((el) => el.dataset.resourceTestCoach);
    rerender(`[data-resource-test-coach="${item.id}"] summary`);
    for (const id of opened) { const current = [...area().querySelectorAll('[data-resource-test-coach]')].find((el) => el.dataset.resourceTestCoach === id); if (current) current.open = true; }
  }, { signal, capture: true });

  app.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-act="check"]');
    if (!form) return;
    e.preventDefault();
    if (run.mode !== 'test') onCheck(form);
  }, { signal });
  app.addEventListener('input', (e) => saveForm(e.target.closest('form[data-item]')), { signal });
  app.addEventListener('change', (e) => saveForm(e.target.closest('form[data-item]')), { signal });

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.tagName === 'FORM' || btn.disabled) return;
    const act = btn.dataset.act;
    const form = btn.closest('form[data-item]') || area()?.querySelector('form[data-item]');
    if (act === 'read') {
      if (speakingBtn === btn) return stopSpeech();
      return speak([btn.dataset.say], { btn });
    }
    if (act === 'dictate' || act === 'say-word') {
      if (speakingBtn === btn) return stopSpeech();
      const item = byId().get(form?.dataset.item);
      if (!item || !synth()) return;
      const parts = act === 'dictate' ? item.say : [item.say[0]];
      return speak(parts, { rate: 0.8, btn, onfail: () => soundOff('Sound is not working. Read the sentence on the screen and ask a grown-up to say the word.') });
    }
    if (act === 'no-sound') return soundOff('No sound. Read the sentence on the screen and ask a grown-up to say the word.');
    if (act === 'bank' && form) {
      const input = form.querySelector('input[name="text"]');
      input.value = btn.dataset.word;
      saveForm(form);
      input.focus();
      return;
    }
    if (e.detail > 1 && ['help', 'next', 'back', 'submit', 'goto', 'card-next', 'card-prev', 'flip'].includes(act)) return;
    if (act === 'coach-retry' && form && run.chapter === 7) {
      const item = byId().get(form.dataset.item), st = item && itemState(item.id);
      if (!item?.teaching || st.shown || st.status === 'correct') return;
      saveForm(form); st.coachView = 'answer'; st.say = ''; st.status = 'unanswered';
      delete st.lastChecked; delete st.wrong;
      announce('Try your answer again. Look at the original picture.');
      rerender([`form[data-item="${item.id}"] input:not([disabled])`, `form[data-item="${item.id}"] textarea:not([readonly])`]);
      area().querySelector('.pic-card')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
    if (act === 'help' && form) {
      // Help opens one step at a time; the last step fills in the answer (the question then counts as missed).
      const item = byId().get(form.dataset.item);
      const st = itemState(item.id);
      if (!st.tries || st.status === 'correct' || st.shown) return;
      saveForm(form);
      const visualHelp = run.chapter === 7 && item.teaching;
      const steps = visualHelp ? lessonHelpSteps({ chapter: 7 }, item) : helpSteps(item);
      if (visualHelp) st.coachView = 'help';
      st.help = Math.min((st.help || 0) + 1, steps.length);
      const last = st.help === steps.length;
      noteFractionHistory(run, item, 'help');
      if (!last && steps[st.help - 1]?.revealsAnswer) noteFractionHistory(run, item, 'reveal');
      if (last) {
        noteFractionHistory(run, item, 'reveal');
        st.shown = true;
        st.resp = Object.fromEntries(Object.entries(solution(item)).map(([k, v]) => [k, String(v)]));
        if (!st.first) { st.first = 'shown'; noteFirst(item, 'shown'); }
        st.status = 'shown';
        st.say = '';
        st.wrong = undefined;
      }
      announce(`${last ? "Here's how. " : ''}Step ${st.help} of ${steps.length}. ${steps[st.help - 1].text}${last ? ' The answer is filled in.' : ''}`);
      rerender(visualHelp ? '[data-coach-heading]' : last ? '[data-act="next"]:not([disabled])' : ['[data-act="help"]', 'button[type="submit"]']);
      if (visualHelp) area().querySelector('[data-coach="help"]')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      else showNewStep(area());
      return;
    }
    if (act === 'next' || act === 'back' || act === 'goto') {
      saveForm(form);
      if (act === 'next' && run.mode === 'practice' && run.i >= run.items.length - 1) {
        run.finished = true;
        announce('Your results.');
      } else {
        const to = act === 'goto' ? Number(btn.dataset.to) : run.i + (act === 'next' ? 1 : -1);
        run.i = Math.max(0, Math.min(run.items.length - 1, to));
      }
      run.warned = false;
      rerender('#stage-h');
      window.scrollTo({ top: Math.max(0, area().getBoundingClientRect().top + window.scrollY - 12) });
      return;
    }
    if (act === 'submit') {
      saveForm(form);
      const blankList = unanswered(run.items, { items: run.items_ });
      if (blankList.length && !run.warned) {
        run.warned = true;
        announce(`${blankList.length} question${blankList.length === 1 ? ' has' : 's have'} no answer. Go back to ${blankList.length === 1 ? 'it' : 'them'}, or press Finish anyway.`);
        return rerender('#test-warning');
      }
      for (const it of run.items) {
        const st = itemState(it.id);
        st.status = check(it, st.resp, {}).status === 'correct' ? 'correct' : 'notyet';
        noteFractionHistory(run, it, 'check');
        if (st.status !== 'correct') noteFractionHistory(run, it, 'reveal');
        // Missed spelling and vocabulary test questions go to Practice My Misses in their practice form (with hints).
        if (st.status !== 'correct' && run.subject === 'spelling') {
          addMiss(ctx.weekId, 'spelling', spellItem(ctx.week.spelling.words[it.n - 1], ctx.week.spelling));
        } else if (st.status !== 'correct' && run.subject === 'vocab') {
          const w = ctx.week.vocab.words.find((x) => x.word === it.word);
          if (w) addMiss(ctx.weekId, 'vocab', vocabPractice({ ...it, id: `test-${it.id}` }, w));
        } else if (st.status !== 'correct' && run.subject === 'math' && run.chapter) {
          // A missed chapter test question goes to the chapter's Practice My Misses, in its practice form when it has one.
          addMiss(ctx.mathWeekId || ctx.weekId, run.group, it.practice ? { ...it.practice, id: `test-${it.id}` } : { ...it, id: `test-${it.id}` });
        } else if (st.status !== 'correct' && run.subject === 'skills') {
          // A missed Skill Builders test question goes to the skill's Practice My Misses in its practice form (with Help).
          addMiss(ctx.weekId, run.group, it.practice || it);
        } else if (st.status !== 'correct' && run.areaVocab && ctx.area) {
          // A missed Nov 3 vocabulary test question goes to Area Words > Practice My Misses, as its practice question.
          const orig = ['choice', 'truefalse', 'fill'].flatMap((m) => ctx.area.vocab[m] || []).find((x) => x.word === it.word && x.kind === (it.kind === 'tf' ? 'tf' : it.kind));
          if (orig) addMiss(ctx.mathWeekId || ctx.weekId, 'areavocab', orig);
        } else if (st.status !== 'correct' && run.subject === 'mathwords' && ctx.mathWords) {
          // The practice form of the question (with its hints and Show me how) goes to Math Vocabulary > Practice My Misses.
          const orig = [...Object.values(WORD_MODES), 'test'].flatMap((m) => ctx.mathWords[m] || []).find((x) => x.prompt === it.prompt);
          if (orig) addMiss(ctx.mathWeekId || ctx.weekId, 'mathwords', orig);
        }
      }
      run.submitted = true;
      const right = run.items.filter((it) => run.items_[it.id].status === 'correct').length;
      announce(`You got ${right} out of ${run.items.length}.`);
      return rerender('#stage-h');
    }
    if (act === 'print') return window.print();
    if (act === 'restart') {
      run = newRun(ctx, ctx.section, run.act);
      runs.set(key(), run);
      return rerender('#stage-h');
    }
    // Flashcards and study cards
    const f = run.flash;
    if (!f) return;
    const words = cardsFor(ctx, run.subject, run.act);
    const cardWord = () => words[f.order[f.i]];
    // A spelling card's front must not say the word (it is the answer); other cards name their word.
    const cardName = () => (run.subject === 'spelling' || run.act === 'avflash' ? '' : `: ${cardWord().word || cardWord().name}`);
    // The spelling card's word is never in the page (it is the answer): the player says it from its own list.
    if (act === 'say-card') {
      if (speakingBtn === btn) return stopSpeech();
      return speak([cardWord().word], { rate: 0.8, btn });
    }
    if (act === 'flip') {
      f.flipped = !f.flipped;
      const w = cardWord();
      const rule = run.act === 'avflash' ? '' : ctx.week.spelling.rules?.[w.rule];
      const backSays = run.act === 'fvflash' ? `Back of the card: ${w.word}. ${w.def}${/[.!?]$/.test(w.def) ? '' : '.'} ${w.example}` : run.act === 'avflash' ? `Back of the card: ${w.word}. ${w.example}` : `Back of the card: ${w.word}. ${rule ? `${rule}. ` : ''}${w.sentence}`;
      if (!btn.classList.contains('flashcard')) announce(f.flipped ? backSays : 'Front of the card.');
      // Keep focus where it was: on the card itself, or on the Flip Card button.
      rerender(btn.classList.contains('flashcard') ? '.flashcard' : '.flip-btn');
      area().querySelector('.flashcard')?.classList.add('flip-anim');
      return;
    }
    if (act === 'card-next' || act === 'card-prev') {
      f.i = Math.max(0, Math.min(words.length - 1, f.i + (act === 'card-next' ? 1 : -1)));
      f.flipped = false;
      announce(`${run.act === 'wreview' || run.act === 'avreview' ? 'Word' : run.act === 'avflash' ? 'Card' : run.act === 'fvflash' ? 'Word' : run.subject === 'math' ? 'Property' : 'Card'} ${f.i + 1} of ${words.length}${run.act === 'avflash' ? '' : cardName()}.`);
      return rerender(`[data-act="${act}"]:not([disabled]), .stage-nav a.btn-primary, [data-act="card-prev"]:not([disabled]), [data-act="card-next"]:not([disabled]), #stage-h`);
    }
    if (act === 'shuffle') {
      f.order = shuffle(f.order, rng(seed()));
      f.i = 0;
      f.flipped = false;
      announce(`The cards are shuffled. Card 1${cardName()}.`);
      return rerender('[data-act="shuffle"]');
    }
    if (act === 'mark') {
      const w = cardWord();
      const mark = btn.dataset.mark;
      f.marks[w.word] = f.marks[w.word] === mark ? undefined : mark;
      const m = missMap(ctx.weekId, 'spelling');
      const practice = spellItem(w, ctx.week.spelling);
      if (f.marks[w.word] === 'again') addMiss(ctx.weekId, 'spelling', practice, true);
      else if (m.get(missKey(practice))?.fromMark) m.delete(missKey(practice)); // a mark never removes a real miss
      announce(f.marks[w.word] === 'again' ? 'This word is added to Practice My Misses.' : f.marks[w.word] === 'known' ? 'Marked as known.' : 'Mark removed.');
      return rerender(`[data-mark="${mark}"]`);
    }
  }, { signal });
}

// ---------------------------------------------------------------- Times Tables App mount

/** Session-level state for the Times App (families, tab, per-tab run state). */
const timesAppState = {
  families: [],      // [0..12] selected family numbers
  tab: 'flash',      // 'flash' | 'practice' | 'find'
  rand: rng(seed()),
  // Flash state
  flash: null,       // { cards, order, i, flipped }
  // Practice state
  practice: null,    // { items, items_, i, finished }
  // Find It state
  find: null,        // { findItems, findState_, findI }
};

function rebuildTimesRuns(state) {
  const r = rng(seed());
  const fam = state.families;
  if (!fam.length) { state.flash = null; state.practice = null; state.find = null; return; }
  // Flash
  const cards = timesFamilyFlash(fam, r);
  state.flash = { cards, order: cards.map((_, k) => k), i: 0, flipped: false };
  // Practice
  const items = timesFamilyPractice(fam, r);
  state.practice = { items, items_: {}, i: 0, finished: false };
  // Find It
  const findItems = timesFamilyFind(fam, r);
  state.find = { findItems, findState_: {}, findI: 0 };
}

function makeTimesCtx(ctx) {
  const s = timesAppState;
  // The view expects timesRun.cards, timesRun.flash, timesRun.practiceItems, timesRun.items_
  // All tabs share one timesRun object so flash and practice can share the same index/order.
  const timesRun = (s.flash || s.practice || s.find) ? {
    cards: s.flash?.cards || [],
    flash: s.flash ? { order: s.flash.order, i: s.flash.i, flipped: s.flash.flipped } : { order: [], i: 0, flipped: false },
    practiceItems: s.practice?.items || [],
    items_: s.practice?.items_ || {},
    findItems: s.find?.findItems || [],
    findState_: s.find?.findState_ || {},
    findI: s.find?.findI || 0,
  } : null;
  return {
    ...ctx,
    timesFamilies: s.families,
    timesTab: s.tab,
    timesRun,
  };
}

export function mountTimesApp(app, ctx, signal) {
  const live = document.getElementById('live');

  const announce = (text) => {
    if (!live) return;
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 60);
  };

  const rerender = (focusSel) => {
    const tctx = makeTimesCtx(ctx);
    app.innerHTML = skillsView(tctx).s;
    if (focusSel) {
      const targets = Array.isArray(focusSel) ? focusSel : [focusSel];
      const el = targets.map((s) => app.querySelector(s)).find(Boolean);
      el?.focus({ preventScroll: false });
    }
  };

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;

    // Family toggle
    if (act === 'times-family') {
      const n = Number(btn.dataset.n);
      const s = timesAppState;
      if (s.families.includes(n)) s.families = s.families.filter((f) => f !== n);
      else s.families = [...s.families, n].sort((a, b) => a - b);
      rebuildTimesRuns(s);
      const tctx = makeTimesCtx(ctx);
      app.innerHTML = skillsView(tctx).s;
      announce(s.families.length === 0 ? 'No families selected.' : `Selected: ${s.families.map((f) => `${f}s`).join(', ')}.`);
      app.querySelector(`[data-act="times-family"][data-n="${n}"]`)?.focus();
      return;
    }

    // Tab switch
    if (act === 'times-tab') {
      timesAppState.tab = btn.dataset.tab;
      const tctx = makeTimesCtx(ctx);
      app.innerHTML = skillsView(tctx).s;
      announce(`${btn.textContent} mode.`);
      app.querySelector('.times-panel')?.setAttribute('tabindex', '-1');
      app.querySelector('.times-panel')?.focus({ preventScroll: false });
      return;
    }

    // Flash: flip
    if (act === 'flip') {
      const s = timesAppState;
      if (!s.flash) return;
      s.flash.flipped = !s.flash.flipped;
      const card = s.flash.cards[s.flash.order[s.flash.i]];
      announce(s.flash.flipped ? `Back of the card: ${card.a} times ${card.b} equals ${card.product}.` : 'Front of the card.');
      app.innerHTML = skillsView(makeTimesCtx(ctx)).s;
      const target = btn.classList.contains('times-flashcard') ? '.times-flashcard' : '.flip-btn';
      app.querySelector(target)?.focus();
      return;
    }

    // Flash / Practice: next / prev (both tabs share card navigation via s.flash.i)
    if (act === 'times-card-next' || act === 'times-card-prev') {
      const s = timesAppState;
      if (!s.flash) return;
      const total = s.flash.cards.length;
      if (act === 'times-card-next') s.flash.i = (s.flash.i + 1) % total;
      else s.flash.i = Math.max(0, s.flash.i - 1);
      s.flash.flipped = false;
      if (s.tab === 'flash') {
        const card = s.flash.cards[s.flash.order[s.flash.i]];
        announce(`Card ${s.flash.i + 1} of ${total}: ${card.a} times ${card.b}.`);
      } else {
        announce(`Fact ${s.flash.i + 1} of ${total}.`);
      }
      app.innerHTML = skillsView(makeTimesCtx(ctx)).s;
      app.querySelector(`[data-act="${act}"]`)?.focus();
      return;
    }

    // Flash: shuffle
    if (act === 'times-shuffle') {
      const s = timesAppState;
      if (!s.flash) return;
      s.flash.order = shuffle(s.flash.order, rng(seed()));
      s.flash.i = 0;
      s.flash.flipped = false;
      announce('Cards shuffled. Card 1.');
      app.innerHTML = skillsView(makeTimesCtx(ctx)).s;
      app.querySelector('[data-act="times-shuffle"]')?.focus();
      return;
    }

    // Find It: check
    if (act === 'find-check') {
      const s = timesAppState;
      if (!s.find) return;
      const i = s.find.findI;
      const item = s.find.findItems[i];
      const st = (s.find.findState_[item.id] ||= {});
      const va = Number(app.querySelector('[data-find="a"]')?.value || '');
      const vb = Number(app.querySelector('[data-find="b"]')?.value || '');
      st.va = va; st.vb = vb;
      const corr = findItCorrect(item, va, vb);
      if (corr) {
        st.correct = true; st.wrong = false; st.wrongFamily = null;
        announce(`Yes! ${va} × ${vb} = ${va * vb}.`);
      } else {
        // Check for wrong-family nudge
        const nudge = item.mistakes?.find((m) => m.when.a === va && m.when.b === vb);
        st.wrong = !nudge; st.wrongFamily = nudge ? nudge.say : null;
        if (nudge) announce(nudge.say);
        else announce('Try again! Think about the facts you picked.');
      }
      app.innerHTML = skillsView(makeTimesCtx(ctx)).s;
      if (corr) app.querySelector('[data-act="find-next"]')?.focus();
      else { app.querySelector('#find-a')?.focus(); }
      return;
    }

    // Find It: next / prev
    if (act === 'find-next' || act === 'find-prev') {
      const s = timesAppState;
      if (!s.find) return;
      const total = s.find.findItems.length;
      if (act === 'find-next') s.find.findI = (s.find.findI + 1) % total;
      else s.find.findI = Math.max(0, s.find.findI - 1);
      announce(`Fact ${s.find.findI + 1} of ${total}.`);
      app.innerHTML = skillsView(makeTimesCtx(ctx)).s;
      app.querySelector('#find-a')?.focus();
      return;
    }

    // Practice: check answer
    if (act === 'times-check') {
      const s = timesAppState;
      if (!s.practice) return;
      const id = btn.dataset.id;
      const item = s.practice.items.find((it) => it.id === id);
      if (!item) return;
      const st = (s.practice.items_[id] ||= { resp: {}, tries: 0 });
      const val = app.querySelector('[data-act="times-answer"]')?.value || '';
      st.resp = { v: val };
      // item.answer is "a × b"; derive the product from the two factors
      const parts = item.answer.split(/[^\d]+/).map(Number).filter((n) => !isNaN(n));
      const product = parts[0] * parts[1];
      const isRight = Number(val) === product;
      if (isRight) { st.status = 'correct'; announce(item.yes); }
      else { st.tries = (st.tries || 0) + 1; st.status = 'wrong'; announce(`Not yet. ${item.hints[0]}`); }
      app.innerHTML = skillsView(makeTimesCtx(ctx)).s;
      if (isRight) app.querySelector('[data-act="times-card-next"]')?.focus();
      else app.querySelector('[data-act="times-answer"]')?.focus();
      return;
    }

  }, { signal });

  // Keyboard: Enter on a find-it input triggers check
  app.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const input = e.target.closest('[data-find]');
    if (!input) return;
    const checkBtn = app.querySelector('[data-act="find-check"]');
    checkBtn?.click();
  }, { signal });
}
