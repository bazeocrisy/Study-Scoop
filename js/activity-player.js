// Activity player: the DOM code for Spelling, Vocabulary and Math practice and for the practice tests (DECISIONS D18, D19).
// Progress, misses and test answers live in memory for this visit only (never stored), keyed by week, so weeks never mix.
import { check, solution, showSteps } from './lib/lessons.js';
import { activityInfo, mathItems, rng, shuffle, spellItem, spellingItems, testFor, vocabItems, vocabPractice } from './lib/activities.js';
import { PROPERTIES } from './lib/mathlearn.js';
import { html } from './lib/html.js';
import { activityInner } from './views/activity.js';
import { unanswered } from './views/lesson.js';

const runs = new Map();    // "week:section:act" -> run
const misses = new Map();  // "week:subject" -> Map(key -> { item, fromMark })

const missMap = (weekId, subject) => {
  const k = `${weekId}:${subject}`;
  if (!misses.has(k)) misses.set(k, new Map());
  return misses.get(k);
};
export const missCounts = (weekId) => ({ vocab: missMap(weekId, 'vocab').size, spelling: missMap(weekId, 'spelling').size, math: missMap(weekId, 'math').size });

/** One entry per spelling word (Missing Letters and Hear and Spell share it); vocabulary questions are kept apart. */
const missKey = (item) => (item.n ? `word-${item.n}` : item.id);
function addMiss(weekId, subject, item, fromMark = false) {
  const m = missMap(weekId, subject);
  const old = m.get(missKey(item));
  // Keep the harder form of a spelling word (Hear and Spell over Missing Letters); a real miss outranks a mark.
  if (old && old.item.type === 'spell' && item.type === 'letters') { old.fromMark = old.fromMark && fromMark; return; }
  m.set(missKey(item), { item, fromMark: Boolean(old ? old.fromMark && fromMark : fromMark) });
}

const seed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
/** A choice question with its options in a new order (True/False stays in order). */
const reshuffle = (item, rand) => (item.type === 'choice' && item.options.length > 2 ? { ...item, options: shuffle(item.options, rand) } : item);
/** What the cards of a card activity show: spelling words, vocabulary words, or the four math properties. */
const cardsFor = (ctx, subject) => (subject === 'math' ? PROPERTIES : subject === 'vocab' ? ctx.week.vocab.words : ctx.week.spelling.words);

function newRun(ctx, section, act) {
  const rand = rng(seed());
  const base = { items: [], items_: {}, i: 0, finished: false, submitted: false, warned: false, noSound: false };
  if (section === 'tests') {
    const t = testFor(act, ctx.week, ctx.tests, rand);
    if (!t) return null;
    return { ...base, ...t, subject: act, act, mode: 'test', goal: `${t.topic} · ${t.items.length} questions` };
  }
  const info = activityInfo(section, act);
  const run = { ...base, subject: section, act, mode: 'practice', title: info.label, goal: info.about };
  const cards = cardsFor(ctx, section);
  if (act === 'learn' || act === 'flash') run.flash = { order: cards.map((_, k) => k), i: 0, flipped: false, marks: {} };
  else if (act === 'misses') run.items = [...missMap(ctx.weekId, section).values()].map((e) => reshuffle(e.item, rand));
  else if (section === 'math') { run.items = mathItems(ctx.practice, act, rand); run.unavailable = !ctx.practice; }
  else if (section === 'vocab') run.items = shuffle(vocabItems(ctx.week, act, rand), rand);
  else run.items = shuffle(spellingItems(ctx.week, act), rand);
  return run;
}

/** The activity or test named in the address (made on first visit, kept while the page is open). */
export function runFor(ctx, section, act) {
  const key = `${ctx.weekId}:${section}:${act}`;
  const old = runs.get(key);
  // Practice My Misses always starts from the current list of misses (a run in progress keeps going).
  const stale = (old?.act === 'misses' && (old.finished || !Object.keys(old.items_).length)) || (old?.unavailable && ctx.practice);
  if (old && !stale) {
    // A misses run in progress also gets the questions missed since it started (QA5-1).
    if (old.act === 'misses') {
      const have = new Set(old.items.map(missKey));
      old.items.push(...[...missMap(ctx.weekId, section).values()].map((e) => e.item).filter((it) => !have.has(missKey(it))));
    }
    return old;
  }
  const run = newRun(ctx, section, act);
  if (run) runs.set(key, run);
  return run;
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
    for (const el of form.querySelectorAll('input.box')) resp[el.name] = el.value;
    const chosen = form.querySelector('input[name="choice"]:checked');
    if (chosen) resp.choice = chosen.value;
    return resp;
  };
  const saveForm = (form) => { if (form?.dataset.item) itemState(form.dataset.item).resp = readForm(form); };

  // Misses: a question missed on the first try (or shown) is added; in Practice My Misses, a first-try right answer removes it.
  const noteFirst = (item, first) => {
    const m = missMap(ctx.weekId, run.subject);
    if (first !== 'correct') addMiss(ctx.weekId, run.subject, item);
    else if (run.act === 'misses' && m.get(missKey(item))?.item.id === item.id) m.delete(missKey(item));
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
    st.status = r.status;
    if (!st.first) { st.first = r.status; noteFirst(item, r.status); }
    if (r.status !== 'correct' && st.tries === 2) st.say += ' You can press Show me how now.';
    announce(r.status === 'correct' ? st.say : `Not yet. ${st.say}`);
    rerender(r.status === 'correct'
      ? '[data-act="next"]:not([disabled])'
      : [`form[data-item="${item.id}"] input[name=choice]:checked`, `form[data-item="${item.id}"] input[aria-invalid="true"]`, `form[data-item="${item.id}"] input:not([disabled])`]);
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
      const blankList = unanswered(run.items, { items: run.items_ });
      if (blankList.length && !run.warned) {
        run.warned = true;
        announce(`${blankList.length} question${blankList.length === 1 ? ' has' : 's have'} no answer. Go back to ${blankList.length === 1 ? 'it' : 'them'}, or press Finish anyway.`);
        return rerender('#test-warning');
      }
      for (const it of run.items) {
        const st = itemState(it.id);
        st.status = check(it, st.resp, {}).status === 'correct' ? 'correct' : 'notyet';
        // Missed spelling and vocabulary test questions go to Practice My Misses in their practice form (with hints).
        if (st.status !== 'correct' && run.subject === 'spelling') {
          addMiss(ctx.weekId, 'spelling', spellItem(ctx.week.spelling.words[it.n - 1], ctx.week.spelling));
        } else if (st.status !== 'correct' && run.subject === 'vocab') {
          const w = ctx.week.vocab.words.find((x) => x.word === it.word);
          if (w) addMiss(ctx.weekId, 'vocab', vocabPractice({ ...it, id: `test-${it.id}` }, w));
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
    const words = cardsFor(ctx, run.subject);
    const cardWord = () => words[f.order[f.i]];
    // A spelling card's front must not say the word (it is the answer); other cards name their word.
    const cardName = () => (run.subject === 'spelling' ? '' : `: ${cardWord().word || cardWord().name}`);
    // The spelling card's word is never in the page (it is the answer): the player says it from its own list.
    if (act === 'say-card') {
      if (speakingBtn === btn) return stopSpeech();
      return speak([cardWord().word], { rate: 0.8, btn });
    }
    if (act === 'flip') {
      f.flipped = !f.flipped;
      const w = cardWord();
      const rule = ctx.week.spelling.rules?.[w.rule];
      if (!btn.classList.contains('flashcard')) announce(f.flipped ? `Back of the card: ${w.word}. ${rule ? `${rule}. ` : ''}${w.sentence}` : 'Front of the card.');
      // Keep focus where it was: on the card itself, or on the Flip Card button.
      rerender(btn.classList.contains('flashcard') ? '.flashcard' : '.flip-btn');
      area().querySelector('.flashcard')?.classList.add('flip-anim');
      return;
    }
    if (act === 'card-next' || act === 'card-prev') {
      f.i = Math.max(0, Math.min(words.length - 1, f.i + (act === 'card-next' ? 1 : -1)));
      f.flipped = false;
      announce(`${run.subject === 'math' ? 'Property' : 'Card'} ${f.i + 1} of ${words.length}${cardName()}.`);
      return rerender(`[data-act="${act}"]:not([disabled]), [data-act="card-prev"]:not([disabled]), [data-act="card-next"]:not([disabled]), #stage-h`);
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
