import { mountJourney, mountJourneyReset } from './partition-journey.js';
import { isJourneyStage } from './lib/partition-journey.js';
// Lesson player: the only DOM code for lessons. It keeps progress in memory for this visit only (never stored),
// re-renders the stage area after each action, moves keyboard focus sensibly and announces feedback to screen readers.
import { check, helpSteps, solution } from './lib/lessons.js';
import { showNewStep } from './lib/help-scroll.js';
import { cardsOf, missItems, stageInner, stageOf, unanswered, lessonHelpSteps, countPartsFor, countComplete, teachingFeedbackFor } from './views/lesson.js';
import { skillJourney, sectionOf, sectionsOf, cardItem, cardDone, sectionDone, phaseOfItem, frontierOf } from './lib/skill-journey.js';
import { loadLessonProgress, saveLessonProgress, clearLessonProgress } from './lib/lesson-store.js';

const histories = new Map();
const isChapter7 = (id) => String(id).startsWith('7-');
export function updateWrittenResponse(st, text) {
  if (String(st.resp?.text ?? '') === text) return false;
  st.resp = { text }; st.revision = (st.revision || 0) + 1;
  delete st.comparedRevision; delete st.reviewedRevision; st.reviewChecks = {}; st.status = undefined; st.say = ''; st.shown = false;
  return true;
}
export function compareWrittenResponse(st, item) {
  const text = String(st.resp?.text || '').trim();
  if (!text || (item.starter && text === item.starter.trim())) { st.status = 'empty'; st.say = 'Write your own response before comparing.'; st.wrong = ['text']; return false; }
  delete st.reviewedRevision;
  st.comparedRevision = st.revision || 0; st.reviewChecks = {}; st.status = 'compared'; st.wrong = undefined;
  st.say = 'Compare your reasoning with the example. The computer does not judge your mathematical explanation.';
  return true;
}
export function updateWrittenChecks(st, checks) {
  const changed = JSON.stringify(st.reviewChecks || {}) !== JSON.stringify(checks);
  st.reviewChecks = checks;
  if (changed && st.reviewedRevision !== undefined) { delete st.reviewedRevision; st.status = 'compared'; return true; }
  return false;
}
export function reviewWrittenResponse(st) {
  if (st.comparedRevision !== (st.revision || 0) || !String(st.resp?.text || '').trim() || !st.reviewChecks?.whole || !st.reviewChecks?.reason || !st.reviewChecks?.compare) return false;
  st.reviewedRevision = st.revision || 0; st.status = 'correct'; st.say = 'Review completed by you or a grown-up. This is not a computer grade for mathematical meaning.';
  return true;
}
const progress = new Map(); // "5-1:try" -> { i, items: { id: { resp, status, say, tries, first, hints, shown } }, steps, streak, submitted }

/** The stages of a lesson opened during this visit (the stepper marks only these as done). */
export function visitedStages(lessonId) {
  return new Set([...progress.keys()].filter((k) => k.startsWith(`${lessonId}:`) && (!isChapter7(lessonId) || progress.get(k).completed)).map((k) => k.slice(lessonId.length + 1)));
}

export function completedLessonStage(lesson, stage, state) {
  if (stage === 'parent') return false;
  const section = sectionOf(lesson, stage);
  if (section) return sectionDone(section, state);
  if (stage === 'test') return Boolean(state.submitted);
  if (stage === 'try') return state.i >= lesson.try.items.length;
  return cardsOf(lesson, stage).every((card, i) => {
    if (!state.seen?.[i]) return false;
    if (stage === 'watch' && (state.steps?.[i] ?? 1) < card.steps.length) return false;
    const item = stage === 'learn' ? card.item : stage === 'watch' ? card.why : card;
    if (!item) return true;
    const st = state.items[item.id]; return st?.status === 'correct' || Boolean(st?.shown);
  });
}
export function stateFor(lessonId, stage) {
  // Skill-journey sections have their own stage ids (e.g. "denominator").
  const key = `${lessonId}:${typeof stage === 'string' && /^[a-z][a-z0-9-]{0,30}$/.test(stage) ? stage : stageOf(stage)}`;
  if (!progress.has(key)) progress.set(key, { i: 0, items: {}, steps: {}, streak: 0, submitted: false, warned: false });
  const state = progress.get(key);
  if (isChapter7(lessonId)) {
    if (!histories.has(lessonId)) histories.set(lessonId, { restarts: 0, missRounds: 0, items: {} });
    state.history = histories.get(lessonId); state.stage = key.slice(lessonId.length + 1);
  }
  return state;
}

// ------------------------------------------------------------- saved progress for the skill journeys (D29, extended)
const restored = new Set();
/** The stages of a skill-journey lesson that keep progress, with their question ids and card counts. */
function savedStages(lesson) {
  const out = {};
  for (const s of sectionsOf(lesson)) out[s.id] = { ids: new Set(s.cards.map(cardItem).filter(Boolean).map((it) => it.id)), cards: s.cards.length };
  out.test = { ids: new Set(lesson.test.items.map((it) => it.id)), cards: lesson.test.items.length };
  return out;
}
/** Brings back saved progress once per page load. "Finished" is worked out again from the answers, never trusted. */
export function restoreLesson(lesson) {
  if (!skillJourney(lesson) || restored.has(lesson.id)) return;
  restored.add(lesson.id);
  const saved = loadLessonProgress(lesson, savedStages(lesson));
  if (!saved) return;
  histories.set(lesson.id, { ...saved.history });
  for (const [stage, st] of Object.entries(saved.stages)) {
    const state = { ...st }; const sec = sectionOf(lesson, stage);
    if (sec) { state.i = Math.min(state.i, frontierOf(sec, state)); state.completed = sectionDone(sec, state); }
    else state.completed = Boolean(state.submitted);
    progress.set(`${lesson.id}:${stage}`, state);
  }
  // A section can only count as finished when every earlier one is.
  let ok = true;
  for (const s of sectionsOf(lesson)) { const st = progress.get(`${lesson.id}:${s.id}`); if (!ok && st) st.completed = false; ok = ok && Boolean(st?.completed); }
  if (!ok && progress.get(`${lesson.id}:test`)) progress.get(`${lesson.id}:test`).completed = false;
}
export function saveLesson(lesson) {
  if (!skillJourney(lesson)) return false;
  const stages = {};
  for (const id of Object.keys(savedStages(lesson))) { const st = progress.get(`${lesson.id}:${id}`); if (st) stages[id] = st; }
  return saveLessonProgress(lesson, stages, histories.get(lesson.id));
}
export function eraseLesson(lesson) {
  clearLessonProgress(lesson);
  for (const k of [...progress.keys()]) if (k.startsWith(`${lesson.id}:`)) progress.delete(k);
  histories.delete(lesson.id);
}
/** Grown-up report: Reset this lesson's progress, with an on-page confirmation step. */
function mountLessonReset(app, lesson, signal) {
  app.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !app.querySelector('[data-l-reset-confirm]')?.hidden) app.querySelector('[data-l-reset="no"]')?.click(); }, { signal });
  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-l-reset]'); if (!b) return;
    const ask = app.querySelector('[data-l-reset-ask]'), confirm = app.querySelector('[data-l-reset-confirm]');
    if (b.dataset.lReset === 'ask') { ask.hidden = true; confirm.hidden = false; confirm.querySelector('[data-l-reset="no"]').focus(); return; }
    if (b.dataset.lReset === 'no') { confirm.hidden = true; ask.hidden = false; ask.querySelector('button').focus(); return; }
    if (b.dataset.lReset === 'yes') { eraseLesson(lesson); location.hash = location.hash.replace(/([?&]stage=)[^&]*/, `$1${sectionsOf(lesson)[0].id}`); }
  }, { signal });
}

/** Every question in a stage (including Learn It checks and Watch Me "why" questions), by id. */
function itemsById(lesson, stage) {
  const out = new Map();
  const section = sectionOf(lesson, stage);
  for (const c of cardsOf(lesson, stage)) {
    const item = section ? cardItem(c) : stage === 'learn' ? c.item : stage === 'watch' ? c.why : c;
    if (item?.id) out.set(item.id, item);
  }
  return out;
}

function readForm(form) {
  const resp = {};
  for (const el of form.querySelectorAll('input.box, textarea.box')) resp[el.name] = el.value;
  // "Choose all that are right": the ticked boxes, as a list.
  const ticked = [...form.querySelectorAll('input[type="checkbox"][name="multi"]:checked')].map((c) => c.value);
  if (ticked.length) resp.multi = ticked.join(',');
  // Radio buttons: the chosen answer, and for rounding the underlined digit and go up or stay.
  for (const r of form.querySelectorAll('input[type="radio"]:checked')) resp[r.name] = r.value;
  return resp;
}

// ---------------------------------------------------------------- read aloud
const synth = () => globalThis.speechSynthesis;
let speaking = null;
function stopReading() {
  synth()?.cancel();
  if (speaking) setReadLabel(speaking, false);
  speaking = null;
}
function setReadLabel(btn, on) {
  const label = btn.querySelector('.read-label');
  if (label) label.textContent = on ? 'Stop' : btn.dataset.label;
  btn.dataset.aria ||= btn.getAttribute('aria-label');
  btn.setAttribute('aria-label', on ? 'Stop reading' : btn.dataset.aria);
  btn.classList.toggle('is-reading', on);
}
function readAloud(btn) {
  const wasThis = speaking === btn;
  stopReading();
  if (wasThis) return; // pressing again stops reading
  const u = new SpeechSynthesisUtterance(btn.dataset.say);
  // Prefer a voice built into the device, so the words are not sent to an online voice service.
  const local = synth().getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
  if (local.length) u.voice = local[0];
  u.rate = 0.9;
  u.onend = u.onerror = () => { if (speaking === btn) { setReadLabel(btn, false); speaking = null; } };
  setReadLabel(btn, true);
  speaking = btn;
  synth().speak(u);
}

/** Pages to read (Study Guide, Learn Area): their Read to me buttons, or none when the device has no voice. */
export function mountReadButtons(app, signal) {
  if (!synth()) { app.querySelectorAll('.read').forEach((b) => b.remove()); return; }
  synth().getVoices();
  signal.addEventListener('abort', stopReading);
  app.addEventListener('click', (e) => { const b = e.target.closest('[data-act="read"]'); if (b) readAloud(b); }, { signal });
}

/** Attaches the lesson controls to the rendered page. `signal` removes the listeners on the next navigation. */
export function mountLesson(app, ctx, signal) {
  if (isJourneyStage(ctx.lesson.id, ctx.stage)) { mountReadButtons(app, signal); mountJourney(app, ctx, signal); return; }
  if (ctx.lesson.id === '7-1' && ctx.stage === 'parent') mountJourneyReset(app, ctx, signal);
  const { lesson } = ctx;
  const section = sectionOf(lesson, ctx.stage);
  const stage = section ? ctx.stage : stageOf(ctx.stage);
  if (skillJourney(lesson) && stage === 'parent') mountLessonReset(app, lesson, signal);
  // A stage that is not open yet (teach first, Lessons 7-2 to 7-7) has nothing to control.
  if (app.querySelector('#lesson-stage[data-locked]')) { mountReadButtons(app, signal); return; }
  const state = stateFor(lesson.id, stage);
  const items = itemsById(lesson, stage);
  const live = document.getElementById('live');
  const area = () => app.querySelector('#lesson-stage');
  let announceTimer = null;

  const hideReadIfUnavailable = () => {
    if (!synth()) app.querySelectorAll('.read').forEach((b) => b.remove());
  };
  hideReadIfUnavailable();
  synth()?.getVoices(); // starts loading the voice list (Chrome fills it in later)

  signal.addEventListener('abort', () => { stopReading(); clearTimeout(announceTimer); });

  const announce = (text) => {
    if (!live) return;
    clearTimeout(announceTimer);
    live.textContent = '';
    announceTimer = setTimeout(() => { live.textContent = text; }, 60); // re-announce even when the text repeats
  };
  if (isChapter7(lesson.id)) { state.seen ||= {}; state.seen[state.i] = true; }
  const rerender = (focus) => {
    if (section) state.i = Math.min(state.i, frontierOf(section, { ...state, seen: { ...state.seen, [state.i]: true } }));
    if (isChapter7(lesson.id)) { state.seen ||= {}; state.seen[state.i] = true; state.completed = completedLessonStage(lesson, stage, state);
      if (stage !== 'parent') { state.history.currentRounds ||= {}; state.history.currentRounds[stage] = { right: Object.values(state.items).filter(v => v.first === 'correct' && !v.scaffoldAssisted).length, retry: Object.values(state.items).filter(v => v.first && v.first !== 'correct').length }; }
    }
    stopReading();
    saveLesson(lesson);
    area().innerHTML = stageInner({ ...ctx, lessonState: state }).s;
    hideReadIfUnavailable();
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
    // A list of selectors means "the first of these that is on the screen" (a single selector string keeps page order).
    const el = focus && [].concat(focus).map((sel) => area().querySelector(sel)).find(Boolean);
    if (el) el.focus({ preventScroll: false });
  };
  // In Practice My Misses the answers are kept apart, so the results of the first round stay as they were.
  const itemState = (id) => ((state.misses ? state.misses.items : state.items)[id] ||= { resp: {}, tries: 0, hints: 0 });
  const written = (item) => isChapter7(lesson.id) && item?.type === 'sentence';
  const historyItem = (id) => (state.history ? (state.history.items[`${stage}:${id}`] ||= { label: section ? `${section.title}, question ${[...items.keys()].indexOf(id) + 1}` : `${stage === 'try' ? 'Try It Yourself' : stage === 'together' ? 'Practice Together' : stage === 'watch' ? 'Watch Me' : stage === 'test' ? 'Test Your Knowledge' : 'Learn It'}, question ${[...items.keys()].indexOf(id) + 1}`, attempts: 0, help: 0, reveals: 0 }) : null);
  const saveForm = (form) => {
    if (!form?.dataset.item) return;
    const st = itemState(form.dataset.item), item = items.get(form.dataset.item), resp = readForm(form);
    if (written(item)) {
      const edited = updateWrittenResponse(st, String(resp.text || ''));
      const checks = [...form.querySelectorAll('[data-review-check]')];
      const unchecked = checks.length && updateWrittenChecks(st, Object.fromEntries(checks.map((el) => [el.dataset.reviewCheck, el.checked])));
      if (edited || unchecked) {
        state.completed = false;
        if (edited) form.querySelector('[data-written-review]')?.setAttribute('hidden', '');
        form.querySelector('[data-written-complete]')?.setAttribute('hidden', '');
        form.querySelector('.feedback')?.setAttribute('hidden', '');
        for (const el of area().querySelectorAll('.stage-nav [data-act="next"], .stage-nav .btn-primary')) { if (el.tagName === 'BUTTON') el.disabled = true; else { el.setAttribute('aria-disabled', 'true'); el.dataset.invalidReview = 'true'; } }
      }
    } else st.resp = resp;
  };

  function onCheck(form) {
    const item = items.get(form.dataset.item);
    if (!item) return;
    const st = itemState(item.id);
    if (written(item)) {
      saveForm(form); compareWrittenResponse(st, item); announce(st.say);
      return rerender(st.status === 'empty' ? 'textarea' : '[data-review-check]');
    }
    if (!countComplete(lesson, item, st)) { announce('Touch and count each part before writing your answer.'); return; }
    st.resp = readForm(form);
    // The same answer checked twice (e.g. a double click) is not a new try.
    const key = JSON.stringify(st.resp);
    if (key === st.lastChecked && st.status !== 'empty') return;
    const r = check(item, st.resp, lesson);
    st.say = r.say;
    st.wrong = r.wrong;
    if (r.status === 'empty') {
      st.status = 'empty';
      announce(r.say);
      rerender([`form[data-item="${item.id}"] [aria-invalid="true"]`, `form[data-item="${item.id}"] input, form[data-item="${item.id}"] textarea`]);
      return;
    }
    st.lastChecked = key;
    st.tries += 1;
    const historical = historyItem(item.id); if (historical) historical.attempts += 1;
    st.status = r.status;
    if (isChapter7(lesson.id) && item.teaching) {
      st.teachingFeedback = teachingFeedbackFor(lesson, item, st.resp, r.status);
      if (st.teachingFeedback) {
        st.say = st.teachingFeedback.text; st.coachView = 'feedback';
        if (st.teachingFeedback.revealsAnswer && r.status !== 'correct') {
          if (historical) historical.reveals += 1;
          st.feedbackRevealed = true;
        }
      }
    }
    if (!st.first) {
      st.first = r.status;
      if (stage === 'together') state.streak = r.status === 'correct' && !st.scaffoldAssisted ? state.streak + 1 : 0;
    }
    if (r.status !== 'correct' && st.tries === 1 && (stage !== 'test' || state.misses) && !(st.help > 0)) st.say += ' Press Help to see one step at a time.';
    announce(r.status === 'correct' ? st.say : `Not yet. ${st.say}`);
    const visualFeedback = isChapter7(lesson.id) && st.teachingFeedback;
    rerender(visualFeedback ? '[data-coach-heading]' : r.status === 'correct'
      ? ['[data-act="next"]:not([disabled])', '.stage-nav a.btn-primary[href]', 'form[data-item] .choices input:not([disabled])']
      : [`form[data-item="${item.id}"] [aria-invalid="true"]`, `form[data-item="${item.id}"] input:not([disabled]), form[data-item="${item.id}"] textarea:not([readonly])`]);
    // A pointer check near the bottom of a phone must expose the picture and its explanation too.
    if (visualFeedback) area().querySelector('[data-coach="feedback"]')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  app.addEventListener('click', (e) => { const a = e.target.closest('a[data-invalid-review]'); if (a) { e.preventDefault(); announce('Compare and review your revised response before continuing.'); } }, { signal });
  app.addEventListener('toggle', (e) => {
    const detail = e.target;
    if (!isChapter7(lesson.id) || stage !== 'test' || !state.submitted || !detail.open || !detail.dataset.testCoach) return;
    const st = itemState(detail.dataset.testCoach); if (st.reviewOpened) return;
    st.reviewOpened = true; const record = historyItem(detail.dataset.testCoach);
    if (record) {
      record.testReview = true; if (st.status === 'correct') record.reveals += 1;
      const opened = [...area().querySelectorAll('[data-test-coach][open]')].map((el) => el.dataset.testCoach);
      rerender(`[data-test-coach="${detail.dataset.testCoach}"] summary`);
      for (const id of opened) { const current = [...area().querySelectorAll('[data-test-coach]')].find((el) => el.dataset.testCoach === id); if (current) current.open = true; }
    }
  }, { signal, capture: true });
  app.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-act="check"]');
    if (!form) return;
    e.preventDefault(); // the page never submits anywhere
    if (stage !== 'test' || state.misses) onCheck(form);
  }, { signal });

  // Remember typed answers as the child types (so Back and Next keep them).
  app.addEventListener('input', (e) => saveForm(e.target.closest('form[data-item]')), { signal });
  app.addEventListener('change', (e) => saveForm(e.target.closest('form[data-item]')), { signal });

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.tagName === 'FORM' || btn.disabled) return;
    const act = btn.dataset.act;
    const form = btn.closest('form[data-item]') || area()?.querySelector('form[data-item]');
    const cards = cardsOf(lesson, stage);
    if (act === 'read') return readAloud(btn);
    if (act === 'count-part' && form) {
      const item = items.get(form.dataset.item); const st = itemState(item.id); const part = Number(btn.dataset.part);
      if (stage === 'test' && !state.misses || !countPartsFor(lesson, item).includes(part)) return;
      st.counted ||= []; if (st.counted.includes(part)) return;
      st.counted.push(part); st.scaffoldAssisted = true; const record = historyItem(item.id); if (record) record.countScaffold = true;
      announce(`${st.counted.length} parts counted.${countComplete(lesson, item, st) ? ' Now write your answer.' : ''}`);
      return rerender(countComplete(lesson, item, st) ? ['input.box', 'input[type=radio]', 'button[type=submit]'] : `[data-act="count-part"][aria-pressed="false"]`);
    }
    if (act === 'review-written' && form) {
      const st = itemState(form.dataset.item);
      st.reviewChecks = Object.fromEntries([...form.querySelectorAll('[data-review-check]')].map((el) => [el.dataset.reviewCheck, el.checked]));
      if (!reviewWrittenResponse(st)) { announce('Check all three review statements for this response, or revise it and compare again.'); return; }
      announce(st.say); return rerender(['[data-act="next"]:not([disabled])', '.stage-nav a.btn-primary[href]']);
    }
    // The second click of a double click lands on the redrawn button: it must not skip a question or a step.
    if (e.detail > 1 && ['help', 'next', 'back', 'step-next', 'step-back', 'submit', 'goto', 'misses', 'misses-again', 'misses-exit', 'restart'].includes(act)) return;
    if (act === 'coach-retry' && form && isChapter7(lesson.id)) {
      const item = items.get(form.dataset.item), st = itemState(item.id);
      if (!item.teaching || st.shown || st.status === 'correct') return;
      saveForm(form); st.coachView = 'answer'; st.say = ''; st.status = 'unanswered';
      delete st.lastChecked; delete st.wrong;
      announce('Try your answer again. Look at the original picture.');
      rerender([`form[data-item="${item.id}"] input:not([disabled])`, `form[data-item="${item.id}"] textarea:not([readonly])`]);
      // Keep the restored stimulus in view as well as the focused response whenever they fit.
      area().querySelector('.pic-card')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
    if (act === 'writing-help' && form && lesson.id === '7-1' && stage !== 'test') {
      const item = items.get(form.dataset.item), st = itemState(item.id);
      if (item.type !== 'sentence') return;
      saveForm(form);
      const previous = st.writingHelp || 0;
      st.writingHelp = Math.min(previous + 1, 3);
      const historical = historyItem(item.id);
      if (historical && previous < 3) { historical.help += 1; if (st.writingHelp === 3) historical.reveals += 1; }
      rerender('[data-written-help]');
      return;
    }
    if (act === 'help' && form) {
      // Help opens one step at a time; the last step fills in the answer (the question then counts as missed).
      const item = items.get(form.dataset.item);
      const st = itemState(item.id);
      const guided = (stage === 'together' && /^7-[2-7]$/.test(lesson.id)) || (section && ['wedo', 'say'].includes(phaseOfItem(section, item.id)));
      if ((!st.tries && lesson.id !== '7-1' && !guided) || st.status === 'correct' || st.shown || (stage === 'test' && !state.misses)) return;
      saveForm(form);
      // Help opened before the first check makes a right answer assisted, not independent.
      if (lesson.id === '7-1' || !st.tries) st.scaffoldAssisted = true;
      const steps = lessonHelpSteps(lesson, item);
      if (isChapter7(lesson.id) && item.teaching) st.coachView = 'help';
      const historical = historyItem(item.id); if (historical) historical.help += 1;
      st.help = Math.min((st.help || 0) + 1, steps.length);
      const last = st.help === steps.length;
      if (!last && steps[st.help - 1]?.revealsAnswer && historical) historical.reveals += 1;
      if (last) {
        if (historical) historical.reveals += 1;
        st.shown = true;
        st.resp = Object.fromEntries(Object.entries(solution(item)).map(([k, v]) => [k, String(v)]));
        if (!st.first) st.first = 'shown';
        st.status = 'shown';
        st.say = '';
        st.wrong = undefined;
        if (stage === 'together') state.streak = 0;
      }
      announce(`${last ? "Here's how. " : ''}Step ${st.help} of ${steps.length}. ${steps[st.help - 1].text}${last ? ' The answer is filled in.' : ''}`);
      const visualHelp = isChapter7(lesson.id) && item.teaching;
      rerender(visualHelp ? '[data-coach-heading]' : last ? ['[data-act="next"]:not([disabled])', '.stage-nav a.btn-primary[href]'] : ['[data-act="help"]', 'button[type="submit"]']);
      if (visualHelp) area().querySelector('[data-coach="help"]')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      else showNewStep(area());
      return;
    }
    if (act === 'step-next' || act === 'step-back') {
      const n = state.steps[state.i] ?? 1;
      const steps = cards[state.i].steps.length;
      state.steps[state.i] = Math.max(1, Math.min(steps, n + (act === 'step-next' ? 1 : -1)));
      rerender(state.steps[state.i] >= steps ? ['.choices input', '[data-act="step-back"]'] : [`[data-act="${act}"]:not([disabled])`, '[data-act="step-back"]']);
      // A11Y-21: say the step that is now showing (the list itself is rebuilt, so it cannot be a live region).
      const s = cards[state.i].steps[state.steps[state.i] - 1];
      announce(`Step ${state.steps[state.i]} of ${steps}. ${s.say}${s.eq ? ` ${s.eq}` : ''}`);
      return;
    }
    if (state.misses && (act === 'next' || act === 'back')) {
      saveForm(form);
      const m = state.misses;
      const n = missItems(lesson, stage, state).length;
      if (act === 'next' && m.i >= n - 1) { m.done = true; announce('How you did.'); } else m.i = Math.max(0, Math.min(n - 1, m.i + (act === 'next' ? 1 : -1)));
      rerender('#stage-h');
      window.scrollTo({ top: Math.max(0, area().getBoundingClientRect().top + window.scrollY - 12) });
      return;
    }
    if (act === 'misses' || act === 'misses-again') {
      // The questions missed on the first try (Try It Yourself), on the test, or again in the last round.
      const ids = act === 'misses-again'
        ? missItems(lesson, stage, state).filter((it) => state.misses.items[it.id]?.first !== 'correct').map((it) => it.id)
        : stage === 'test'
          ? cards.filter((it) => state.items[it.id]?.status !== 'correct').map((it) => it.id)
          : cards.filter((it) => state.items[it.id]?.first !== 'correct').map((it) => it.id);
      if (!ids.length) return;
      if (state.history) state.history.missRounds += 1;
      state.misses = { ids, i: 0, items: {}, done: false };
      announce(`Practice My Misses: ${ids.length} question${ids.length === 1 ? '' : 's'}.`);
      rerender('#stage-h');
      return;
    }
    if (act === 'misses-exit') {
      state.misses = null;
      rerender('#stage-h');
      return;
    }
    if (act === 'next' || act === 'back' || act === 'goto') {
      saveForm(form);
      const to = act === 'goto' ? Number(btn.dataset.to) : state.i + (act === 'next' ? 1 : -1);
      // Skill sections: forward only from a finished card (no skipping the teaching); going back is always fine.
      if (section && to > state.i && !cardDone(cards[state.i], state.i, state)) return;
      state.i = Math.max(0, Math.min(stage === 'try' ? cards.length : cards.length - 1, to));
      state.warned = false;
      // The first finished round of Try It Yourself is the one the readiness report uses (later rounds are practice).
      if (stage === 'try' && state.i >= cards.length && state.history && !state.history.firstTry) {
        const rec = (it) => state.items[it.id] || {};
        state.history.firstTry = { total: cards.length, own: cards.filter((it) => rec(it).first === 'correct' && !rec(it).scaffoldAssisted).length,
          helped: cards.filter((it) => rec(it).status === 'correct' && (rec(it).first !== 'correct' || rec(it).scaffoldAssisted)).length, pass: lesson.try.pass };
      }
      rerender('#stage-h');
      window.scrollTo({ top: Math.max(0, area().getBoundingClientRect().top + window.scrollY - 12) });
      return;
    }
    if (act === 'submit') {
      saveForm(form);
      const blanks = unanswered(cards, state);
      if (blanks.length && !state.warned) {
        state.warned = true;
        announce(`${blanks.length} question${blanks.length === 1 ? ' has' : 's have'} no answer. Go back to ${blanks.length === 1 ? 'it' : 'them'}, or press Finish anyway.`);
        rerender('#test-warning');
        return;
      }
      for (const it of cards) {
        const st = itemState(it.id);
        const r = check(it, st.resp, lesson);
        st.status = r.status === 'correct' ? 'correct' : 'notyet';
        if (state.history) { st.first = st.status; const historical = historyItem(it.id); historical.attempts += 1; if (st.status !== 'correct') historical.reveals += 1; }
      }
      state.submitted = true;
      const right = cards.filter((it) => state.items[it.id].status === 'correct').length;
      // Only the first test counts: after it, every answer is shown, so a retake is practice.
      if (state.history && !state.history.firstTest) state.history.firstTest = { right, total: cards.length, pass: lesson.test.pass, missed: cards.filter((it) => state.items[it.id].status !== 'correct').map((it) => it.id) };
      announce(`You got ${right} out of ${cards.length}.`);
      rerender('#stage-h');
      return;
    }
    if (act === 'restart') {
      if (state.history) state.history.restarts += 1;
      Object.assign(state, { i: 0, items: {}, steps: {}, streak: 0, submitted: false, warned: false, misses: null, completed: false, seen: {} });
      if (stage === 'test' && state.history?.firstTest) state.retake = true;
      rerender('#stage-h');
    }
  }, { signal });
}
