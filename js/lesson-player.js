// Lesson player: the only DOM code for lessons. It keeps progress in memory for this visit only (never stored),
// re-renders the stage area after each action, moves keyboard focus sensibly and announces feedback to screen readers.
import { check, solution, showSteps } from './lib/lessons.js';
import { cardsOf, missItems, stageInner, stageOf, unanswered } from './views/lesson.js';

const progress = new Map(); // "5-1:try" -> { i, items: { id: { resp, status, say, tries, first, hints, shown } }, steps, streak, submitted }

/** The stages of a lesson opened during this visit (the stepper marks only these as done). */
export function visitedStages(lessonId) {
  return new Set([...progress.keys()].filter((k) => k.startsWith(`${lessonId}:`)).map((k) => k.slice(lessonId.length + 1)));
}

export function stateFor(lessonId, stage) {
  const key = `${lessonId}:${stageOf(stage)}`;
  if (!progress.has(key)) progress.set(key, { i: 0, items: {}, steps: {}, streak: 0, submitted: false, warned: false });
  return progress.get(key);
}

/** Every question in a stage (including Learn It checks and Watch Me "why" questions), by id. */
function itemsById(lesson, stage) {
  const out = new Map();
  for (const c of cardsOf(lesson, stage)) {
    const item = stage === 'learn' ? c.item : stage === 'watch' ? c.why : c;
    if (item?.id) out.set(item.id, item);
  }
  return out;
}

function readForm(form) {
  const resp = {};
  for (const el of form.querySelectorAll('input.box')) resp[el.name] = el.value;
  const chosen = form.querySelector('input[name="choice"]:checked');
  if (chosen) resp.choice = chosen.value;
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

/** Attaches the lesson controls to the rendered page. `signal` removes the listeners on the next navigation. */
export function mountLesson(app, ctx, signal) {
  const { lesson } = ctx;
  const stage = stageOf(ctx.stage);
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
  const rerender = (focus) => {
    stopReading();
    area().innerHTML = stageInner({ ...ctx, lessonState: state }).s;
    hideReadIfUnavailable();
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
    const el = focus && area().querySelector(focus);
    if (el) el.focus({ preventScroll: false });
  };
  // In Practice My Misses the answers are kept apart, so the results of the first round stay as they were.
  const itemState = (id) => ((state.misses ? state.misses.items : state.items)[id] ||= { resp: {}, tries: 0, hints: 0 });
  const saveForm = (form) => { if (form?.dataset.item) itemState(form.dataset.item).resp = readForm(form); };

  function onCheck(form) {
    const item = items.get(form.dataset.item);
    if (!item) return;
    const st = itemState(item.id);
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
      rerender(`form[data-item="${item.id}"] input[aria-invalid="true"], form[data-item="${item.id}"] input`);
      return;
    }
    st.lastChecked = key;
    st.tries += 1;
    st.status = r.status;
    if (!st.first) {
      st.first = r.status;
      if (stage === 'together') state.streak = r.status === 'correct' ? state.streak + 1 : 0;
    }
    if (r.status !== 'correct' && (stage === 'try' || state.misses) && st.tries === 2) st.say += item.hints?.length ? ' You can press Hint or Show me how now.' : ' You can press Show me how now.';
    announce(r.status === 'correct' ? st.say : `Not yet. ${st.say}`);
    rerender(r.status === 'correct'
      ? '[data-act="next"]:not([disabled]), .stage-nav a.btn-primary[href], form[data-item] .choices input'
      : `form[data-item="${item.id}"] input[aria-invalid="true"], form[data-item="${item.id}"] input:not([disabled])`);
  }

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
    // The second click of a double click lands on the redrawn button: it must not skip a question or a step.
    if (e.detail > 1 && ['next', 'back', 'step-next', 'step-back', 'submit', 'goto'].includes(act)) return;
    if (act === 'hint' && form) {
      const item = items.get(form.dataset.item);
      const st = itemState(item.id);
      saveForm(form);
      st.hints = Math.min((st.hints || 0) + 1, item.hints.length);
      announce(`Hint: ${item.hints[st.hints - 1]}`);
      rerender('[data-act="hint"]:not([disabled]), button[type="submit"]');
      return;
    }
    if (act === 'show' && form) {
      const item = items.get(form.dataset.item);
      const st = itemState(item.id);
      st.shown = true;
      const sol = solution(item);
      st.resp = Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, String(v)]));
      if (!st.first) st.first = 'shown';
      st.status = 'shown';
      st.say = '';
      st.wrong = undefined;
      if (stage === 'together') state.streak = 0;
      announce(`Here's how. ${showSteps(item).join(' ')}`);
      rerender('[data-act="next"]:not([disabled]), .stage-nav a.btn-primary[href]');
      return;
    }
    if (act === 'step-next' || act === 'step-back') {
      const n = state.steps[state.i] ?? 1;
      const steps = cards[state.i].steps.length;
      state.steps[state.i] = Math.max(1, Math.min(steps, n + (act === 'step-next' ? 1 : -1)));
      rerender(state.steps[state.i] >= steps ? '.choices input, [data-act="step-back"]' : `[data-act="${act}"]:not([disabled]), [data-act="step-back"]`);
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
      state.i = Math.max(0, Math.min(stage === 'try' ? cards.length : cards.length - 1, to));
      state.warned = false;
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
      }
      state.submitted = true;
      const right = cards.filter((it) => state.items[it.id].status === 'correct').length;
      announce(`You got ${right} out of ${cards.length}.`);
      rerender('#stage-h');
      return;
    }
    if (act === 'restart') {
      Object.assign(state, { i: 0, items: {}, steps: {}, streak: 0, submitted: false, warned: false, misses: null });
      rerender('#stage-h');
    }
  }, { signal });
}
