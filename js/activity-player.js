// Activity player: the DOM code for Spelling and Vocabulary practice and for the practice tests (DECISIONS D18).
// Progress, misses and test answers live in memory for this visit only (never stored), keyed by week, so weeks never mix.
import { check, solution, showSteps } from './lib/lessons.js';
import { ACTIVITIES, rng, shuffle, spellItem, spellingItems, testFor, vocabItems } from './lib/activities.js';
import { activityInner } from './views/activity.js';
import { unanswered } from './views/lesson.js';

const runs = new Map();    // "week:section:act" -> run
const misses = new Map();  // "week:subject" -> Map(item id -> item)

const missMap = (weekId, subject) => {
  const k = `${weekId}:${subject}`;
  if (!misses.has(k)) misses.set(k, new Map());
  return misses.get(k);
};
export const missCounts = (weekId) => ({ vocab: missMap(weekId, 'vocab').size, spelling: missMap(weekId, 'spelling').size });

const seed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

function newRun(ctx, section, act) {
  const rand = rng(seed());
  const base = { items: [], items_: {}, i: 0, finished: false, submitted: false, warned: false };
  if (section === 'tests') {
    const t = testFor(act, ctx.week, ctx.tests, rand);
    if (!t) return null;
    return { ...base, ...t, subject: act, act, mode: 'test', goal: `${t.topic} · ${t.items.length} questions` };
  }
  const info = ACTIVITIES[section].find((a) => a.id === act);
  const run = { ...base, subject: section, act, mode: 'practice', title: info.label, goal: info.about };
  const words = section === 'vocab' ? ctx.week.vocab.words : ctx.week.spelling.words;
  if (act === 'cards' || act === 'flash') run.flash = { order: words.map((_, k) => k), i: 0, flipped: false, marks: {} };
  else if (act === 'misses') run.items = [...missMap(ctx.weekId, section).values()];
  else if (section === 'vocab') run.items = shuffle(vocabItems(ctx.week, act, rand), rand);
  else run.items = shuffle(spellingItems(ctx.week, act), rand);
  return run;
}

/** The activity or test named in the address (made on first visit, kept while the page is open). */
export function runFor(ctx, section, act) {
  const key = `${ctx.weekId}:${section}:${act}`;
  const old = runs.get(key);
  // Practice My Misses always starts from the current list of misses.
  if (old && !(old.act === 'misses' && old.finished)) return old;
  const run = newRun(ctx, section, act);
  if (run) runs.set(key, run);
  return run;
}

// ---------------------------------------------------------------- speech
const synth = () => globalThis.speechSynthesis;
let speakingBtn = null;
function stopSpeech() {
  synth()?.cancel();
  if (speakingBtn) setReadLabel(speakingBtn, false);
  speakingBtn = null;
}
function setReadLabel(btn, on) {
  const label = btn.querySelector('.read-label');
  if (!label) return;
  label.textContent = on ? 'Stop' : btn.dataset.label;
  btn.dataset.aria ||= btn.getAttribute('aria-label');
  btn.setAttribute('aria-label', on ? 'Stop reading' : btn.dataset.aria);
  btn.classList.toggle('is-reading', on);
}
/** Says each part in turn with the device's own voice when it has one. Calls onfail if speech fails. */
function speak(parts, { rate = 0.9, btn = null, onfail = () => {} } = {}) {
  stopSpeech();
  const local = synth().getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
  parts.forEach((text, k) => {
    const u = new SpeechSynthesisUtterance(text);
    if (local.length) u.voice = local[0];
    u.rate = rate;
    if (k === parts.length - 1) u.onend = () => { if (btn && speakingBtn === btn) { setReadLabel(btn, false); speakingBtn = null; } };
    u.onerror = (e) => { if (e.error !== 'canceled' && e.error !== 'interrupted') onfail(); };
    synth().speak(u);
  });
  if (btn) { setReadLabel(btn, true); speakingBtn = btn; }
}

// ---------------------------------------------------------------- mount
export function mountActivity(app, ctx, signal) {
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
  const showFallback = (scope, say = true) => {
    scope.querySelectorAll('.dictate').forEach((d) => { d.hidden = true; });
    scope.querySelectorAll('.dictate-fallback').forEach((p) => { p.hidden = false; });
    if (say) announce('Sound is not working. Read the sentence on the screen instead.');
  };
  const prepare = () => {
    if (!synth()) {
      app.querySelectorAll('.read').forEach((b) => b.remove());
      showFallback(app, false);
    }
  };
  prepare();
  synth()?.getVoices();
  signal.addEventListener('abort', () => { stopSpeech(); clearTimeout(announceTimer); });

  const rerender = (focus) => {
    stopSpeech();
    area().innerHTML = activityInner({ ...ctx, run }).s;
    prepare();
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
    const el = focus && area().querySelector(focus);
    if (el) el.focus({ preventScroll: false });
  };
  const itemState = (id) => (run.items_[id] ||= { resp: {}, tries: 0, hints: 0 });
  const readForm = (form) => {
    const resp = {};
    for (const el of form.querySelectorAll('input.box')) resp[el.name] = el.value;
    const chosen = form.querySelector('input[name="choice"]:checked');
    if (chosen) resp.choice = chosen.value;
    return resp;
  };
  const saveForm = (form) => { if (form?.dataset.item) itemState(form.dataset.item).resp = readForm(form); };

  // Misses: a question missed on the first try (or shown) is added; in Practice My Misses, a first-try right answer removes it.
  const noteFirst = (item, first) => {
    const m = missMap(ctx.weekId, run.subject);
    if (first === 'correct') { if (run.act === 'misses') m.delete(item.id); } else m.set(item.id, item);
  };

  function onCheck(form) {
    const item = byId().get(form.dataset.item);
    if (!item) return;
    const st = itemState(item.id);
    st.resp = readForm(form);
    const keyed = JSON.stringify(st.resp);
    if (keyed === st.lastChecked && st.status !== 'empty') return; // a double click is not a new try
    const r = check(item, st.resp, { catchAll: 'Not yet. Try again.' });
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
    st.status = r.status;
    if (!st.first) { st.first = r.status; noteFirst(item, r.status); }
    if (r.status !== 'correct' && st.tries === 2) st.say += ' You can press Show me how now.';
    announce(r.status === 'correct' ? st.say : `Not yet. ${st.say}`);
    rerender(r.status === 'correct'
      ? '[data-act="next"]:not([disabled])'
      : `form[data-item="${item.id}"] input[aria-invalid="true"], form[data-item="${item.id}"] input:not([disabled])`);
  }

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
      const item = byId().get(form?.dataset.item);
      if (!item || !synth()) return;
      const parts = act === 'dictate' ? item.say : [item.say[0]];
      return speak(parts, { rate: 0.8, onfail: () => showFallback(form) });
    }
    if (act === 'bank' && form) {
      const input = form.querySelector('input[name="text"]');
      input.value = btn.dataset.word;
      saveForm(form);
      input.focus();
      return;
    }
    if (e.detail > 1 && ['next', 'back', 'submit', 'goto', 'card-next', 'card-prev', 'flip'].includes(act)) return;
    if (act === 'hint' && form) {
      const item = byId().get(form.dataset.item);
      const st = itemState(item.id);
      saveForm(form);
      st.hints = Math.min((st.hints || 0) + 1, item.hints.length);
      announce(`Hint: ${item.hints[st.hints - 1]}`);
      return rerender('[data-act="hint"]:not([disabled]), button[type="submit"]');
    }
    if (act === 'show' && form) {
      const item = byId().get(form.dataset.item);
      const st = itemState(item.id);
      st.shown = true;
      st.resp = Object.fromEntries(Object.entries(solution(item)).map(([k, v]) => [k, String(v)]));
      if (!st.first) { st.first = 'shown'; noteFirst(item, 'shown'); }
      st.status = 'shown';
      st.say = '';
      st.wrong = undefined;
      announce(`Here's how. ${showSteps(item).join(' ')}`);
      return rerender('[data-act="next"]:not([disabled])');
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
      const blanks = unanswered(run.items, { items: run.items_ });
      if (blanks.length && !run.warned) {
        run.warned = true;
        announce(`${blanks.length} question${blanks.length === 1 ? ' has' : 's have'} no answer. Go back to ${blanks.length === 1 ? 'it' : 'them'}, or press Finish anyway.`);
        return rerender('#test-warning');
      }
      for (const it of run.items) {
        const st = itemState(it.id);
        st.status = check(it, st.resp, {}).status === 'correct' ? 'correct' : 'notyet';
        // Missed spelling and vocabulary test questions can be practised afterwards (with hints) in Practice My Misses.
        if (st.status !== 'correct' && run.subject !== 'math') {
          const practice = it.type === 'spell' ? spellItem(ctx.week.spelling.words.find((w) => w.word.toLowerCase() === it.answer), ctx.week.spelling) : it;
          missMap(ctx.weekId, run.subject).set(practice.id, practice);
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
    const words = run.subject === 'vocab' ? ctx.week.vocab.words : ctx.week.spelling.words;
    if (act === 'flip') { f.flipped = !f.flipped; announce(f.flipped ? 'Back of the card.' : 'Front of the card.'); return rerender('[data-act="flip"]'); }
    if (act === 'card-next' || act === 'card-prev') {
      f.i = Math.max(0, Math.min(words.length - 1, f.i + (act === 'card-next' ? 1 : -1)));
      f.flipped = false;
      announce(`Card ${f.i + 1} of ${words.length}.`);
      return rerender(`[data-act="${act}"]:not([disabled]), [data-act="card-prev"]:not([disabled]), [data-act="card-next"]:not([disabled])`);
    }
    if (act === 'shuffle') {
      f.order = shuffle(f.order, rng(seed()));
      f.i = 0;
      f.flipped = false;
      announce('The cards are shuffled. Card 1.');
      return rerender('[data-act="shuffle"]');
    }
    if (act === 'mark') {
      const w = words[f.order[f.i]];
      const mark = btn.dataset.mark;
      f.marks[w.word] = f.marks[w.word] === mark ? undefined : mark;
      const m = missMap(ctx.weekId, 'spelling');
      const practice = spellItem(w, ctx.week.spelling);
      if (f.marks[w.word] === 'again') m.set(practice.id, practice);
      else m.delete(practice.id);
      announce(f.marks[w.word] === 'again' ? `${w.word} is added to Practice My Misses.` : f.marks[w.word] === 'known' ? 'Marked as known.' : 'Mark removed.');
      return rerender(`[data-mark="${mark}"]`);
    }
  }, { signal });
}

