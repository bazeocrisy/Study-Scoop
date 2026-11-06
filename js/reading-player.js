// The Reading Coach for one passage. Activities: Story Guide, Listen, Read along, Echo read, Your turn (timed, optional),
// Story map, Questions, Writing (optional), Summary and Check answers. Every activity is open at any time.
// Reading aloud uses the voice built into the device; nothing is recorded, stored or sent.
// All of a visit's work (answers, hints, writing, timed readings) lives in memory only (CLAUDE.md: no student data without an
// approved design). Leaving or reloading clears it, so the page warns first (js/lib/leave-guard.js).
import { html } from './lib/html.js';
import { GUIDE, TARGET_WPM, scoreReading, storyTokens, suggestion } from './lib/reading.js';
import {
  SKILLS, STATUS_TEXT, WRITTEN_TEXT, answerKey, attempted, buildItems, buildSummary, firstAttempt, hintAt, newState, newWritten,
  retry, reveal as markRevealed, selfAssess, statusOf, submit, useHint, writtenStatus,
} from './lib/coach.js';
import { setLeaveGuard } from './lib/leave-guard.js';

const MAX_READINGS = 3;
const LEAVE_MESSAGE = 'Your answers, writing and timed readings from this visit are not saved. If you leave this passage they are cleared. Leave anyway?';

// ---------------------------------------------------------------- speaking
const synth = () => globalThis.speechSynthesis;
let spoken = 0; // counts speak() calls, so an old "end" never ends a newer reading
/** Says `text` with the device's own voice (a built-in voice when there is one). Returns a function that stops it. */
function speak(text, { rate = 0.9, onWord, onEnd } = {}) {
  const s = synth();
  if (!s) { onEnd?.(); return () => {}; }
  const me = ++spoken;
  const u = new SpeechSynthesisUtterance(text);
  const en = s.getVoices().filter((v) => /^en/i.test(v.lang));
  const voice = en.find((v) => v.localService) || en[0];
  if (voice) u.voice = voice;
  u.rate = rate;
  let ended = false;
  const end = () => { if (!ended) { ended = true; if (me === spoken) onEnd?.(); } };
  u.onboundary = (e) => { if (me === spoken && e.name !== 'sentence') onWord?.(e.charIndex); };
  u.onend = u.onerror = end;
  s.speak(u);
  return () => { if (me === spoken) { spoken++; s.cancel(); } };
}
const stopAll = () => { spoken++; synth()?.cancel(); };

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const ACTIVITY_WORD = { done: 'Done', started: 'Started', notstarted: 'Not started' };

// ---------------------------------------------------------------- the page
export function mountReading(app, ctx, signal) {
  const { story, index } = ctx.reading;
  const stage = app.querySelector('#rd');
  const live = document.getElementById('live');
  const tokens = storyTokens(story);
  const flat = tokens.flat();
  const total = flat.length;
  const guide = GUIDE[story.kind];
  const items = buildItems(story);
  const hasWriting = items.written.length > 0;
  const canSpeak = Boolean(synth());
  synth()?.getVoices();

  // The recommended path is the core of the lesson; the rest is optional and always open.
  const STEPS = [
    { id: 'guide', label: 'Story Guide', rec: true }, { id: 'listen', label: 'Listen', rec: true },
    { id: 'along', label: 'Read along', rec: true }, { id: 'echo', label: 'Echo read', rec: false },
    { id: 'turn', label: 'Your turn (timed)', rec: false }, { id: 'map', label: 'Story map', rec: true },
    { id: 'quiz', label: 'Questions', rec: true },
    ...(hasWriting ? [{ id: 'write', label: 'Writing', rec: false }] : []),
    { id: 'done', label: 'Summary', rec: true }, { id: 'answers', label: 'Check answers', rec: false, review: true },
  ];
  const stepById = (id) => STEPS.find((s) => s.id === id);
  const nextRecommended = (id) => STEPS.slice(STEPS.findIndex((s) => s.id === id) + 1).find((s) => s.rec);

  const freshTurn = () => ({ phase: 'ready', elapsedMs: 0, runStart: 0, helpTaps: 0, errors: new Set(), stop: null, tool: 'error', assisted: false, note: '', seconds: 0 });
  const fresh = () => ({
    step: 'guide', visited: new Set(['guide']), playing: false, playingWhat: null, slow: false,
    listenPlayed: !canSpeak, playedByUser: false, alongDone: false, echo: 0, echoDone: false,
    card: null, tapped: [], readings: [], turn: freshTurn(),
    items: Object.fromEntries(items.all.map((x) => [x.id, newState()])),
    written: Object.fromEntries(items.written.map((w) => [w.id, newWritten()])),
    lookAt: null, lookBacks: 0, shown: new Set(), keyClues: false, confirmedLeave: false,
  });
  let S = fresh();
  let stopSpeech = () => {};
  let timer = null;

  const announce = (t) => { if (live) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); } };
  const stopTimer = () => { clearInterval(timer); timer = null; };
  const sentenceOf = (i) => story.sentences[i];

  // ------------------------------------------------------------ work worth warning about
  const hasWork = () => items.all.some((x) => { const st = S.items[x.id]; return st.attempts.length || st.helped || st.draft.trim() || st.history.length || st.selfStatus; })
    || items.written.some((w) => S.written[w.id].text.trim()) || S.readings.length > 0 || S.turn.phase === 'running' || S.turn.phase === 'paused' || S.turn.phase === 'marking';
  setLeaveGuard(() => (S.confirmedLeave || !hasWork() ? null : LEAVE_MESSAGE));
  document.body.classList.toggle('rd-summary-open', false);
  const onBeforeUnload = (e) => { if (hasWork()) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', onBeforeUnload);
  // A link inside Study Scoop (tabs, Home, All stories) asks first when work would be lost.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#app' || !hasWork() || S.confirmedLeave) return;
    if (window.confirm(LEAVE_MESSAGE)) { S.confirmedLeave = true; setTimeout(() => { S.confirmedLeave = false; }, 1500); } else { e.preventDefault(); e.stopPropagation(); }
  }, { capture: true, signal });
  signal.addEventListener('abort', () => {
    stopSpeech(); stopAll(); stopTimer(); setLeaveGuard(null);
    window.removeEventListener('beforeunload', onBeforeUnload);
    document.body.classList.remove('rd-summary-open');
  });

  // ------------------------------------------------------------ activities: done, started or not started
  const attemptedAll = (list) => list.length > 0 && list.every((x) => attempted(S.items[x.id], x));
  const attemptedAny = (list) => list.some((x) => attempted(S.items[x.id], x));
  function activityState(id) {
    switch (id) {
      case 'guide': return S.visited.has('guide') ? 'done' : 'notstarted';
      case 'listen': return (S.playedByUser || !canSpeak) && attemptedAll(items.listen) ? 'done' : S.playedByUser || attemptedAny(items.listen) ? 'started' : 'notstarted';
      case 'along': return S.alongDone ? 'done' : S.visited.has('along') ? 'started' : 'notstarted';
      case 'echo': return S.echoDone ? 'done' : S.visited.has('echo') ? 'started' : 'notstarted';
      case 'turn': return S.readings.length ? 'done' : S.turn.phase !== 'ready' ? 'started' : 'notstarted';
      case 'map': return attemptedAll(items.map) ? 'done' : attemptedAny(items.map) ? 'started' : 'notstarted';
      case 'quiz': return attemptedAll(items.core) ? 'done' : attemptedAny(items.core) ? 'started' : 'notstarted';
      case 'write': return items.written.some((w) => S.written[w.id].compared) ? 'done' : items.written.some((w) => S.written[w.id].text.trim()) ? 'started' : 'notstarted';
      case 'answers': return S.shown.size ? 'started' : 'notstarted';
      default: return 'notstarted';
    }
  }

  // ------------------------------------------------------------ the passage as tappable words
  function passage({ only = null, mark = false, big = false, reveal = false } = {}) {
    const rows = tokens.map((sent, si) => (only !== null && only !== si ? '' : html`<span class="rd-sent" data-s="${si}">${sent.map((t) => {
      const cls = ['rd-w'];
      // Clue colours give the answers away, so they appear only when he asks for them in Check answers.
      if (reveal && t.el) cls.push('rd-clue', `el-${t.el}`);
      if (story.words[t.key]) cls.push('has-def');
      if (mark && S.turn.errors.has(t.n)) cls.push('is-err');
      if (mark && S.turn.stop === t.n) cls.push('is-stop');
      return html`<button type="button" class="${cls.join(' ')}" data-n="${t.n}" data-key="${t.key}"${reveal && t.el ? html` data-el="${t.el}"` : ''}>${t.text}</button> `;
    })}</span>`));
    return html`<p class="rd-text${big ? ' big' : ''}${mark ? ' marking' : ''}" id="rd-text">${rows}</p>`;
  }
  const legend = () => html`<ul class="rd-legend" aria-label="Clue colors">${guide.map((e) => html`<li class="rd-chip el-${e.id}">${e.label}</li>`)}</ul>`;

  function wordCard() {
    const c = S.card;
    if (!c) return html`<aside class="rd-wordcard" id="rd-card" hidden></aside>`;
    const d = story.words[c.key];
    const el = c.el ? guide.find((e) => e.id === c.el) : null;
    return html`<aside class="rd-wordcard" id="rd-card" aria-label="About the word ${c.text}">
      <p class="rd-wc-word"><strong>${c.text.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')}</strong>${d ? html` <span class="rd-say">${d.say}</span>` : ''}</p>
      ${d ? html`<p><b>Means:</b> ${d.means}.</p><p><b>Example:</b> ${d.example}</p>` : el ? '' : html`<p class="hint">Listen to the word. Ask a grown-up what it means.</p>`}
      ${el ? html`<p class="rd-wc-clue el-${el.id}"><b>Clue for ${el.label}.</b> ${el.ask}</p>` : ''}
      ${canSpeak ? html`<p class="btn-row"><button type="button" class="btn" data-act="say" data-text="${c.key}">Say it</button>
        <button type="button" class="btn" data-act="say" data-slow="1" data-text="${c.key}">Say it slowly</button></p>` : ''}
      ${el || S.step === 'answers' ? '' : html`<p class="hint">Saved to My Words for this visit.</p>`}
    </aside>`;
  }

  // ------------------------------------------------------------ look back at the story (a reading strategy, never a failure)
  function lookPanel(key) {
    const item = key === 'step' ? null : items.all.find((x) => x.id === key);
    const here = item && S.items[item.id].helpLevel >= 2 ? new Set(item.evidence) : new Set();
    return html`<section class="rd-lb" aria-label="The story, to look back at">
      <h4>The story</h4>
      <p class="hint">Looking back is what good readers do. Your answers stay exactly where they are.</p>
      ${story.sentences.map((t, i) => html`<p class="rd-lb-s${here.has(i) ? ' is-here' : ''}">${here.has(i) ? html`<span class="rd-here">Look here</span> ` : ''}${t}</p>`)}
      <p><button type="button" class="btn" data-act="lookback" data-id="${key}" data-close="1">Close the story</button></p>
    </section>`;
  }
  const lookButton = (key) => html`<button type="button" class="btn rd-lookbtn" data-act="lookback" data-id="${key}" aria-expanded="${S.lookAt === key}">Look back at the story</button>`;
  const lookSlot = (key) => html`<div class="rd-lb-slot" data-slot="${key}">${S.lookAt === key ? lookPanel(key) : ''}</div>`;
  /** Opens or closes the story without redrawing, so answers, typing, focus and scroll position are untouched. */
  function toggleLook(key, closeOnly = false) {
    const wasOpen = S.lookAt === key;
    S.lookAt = wasOpen || closeOnly ? null : key;
    if (S.lookAt) S.lookBacks++;
    for (const n of stage.querySelectorAll('.rd-lb')) n.remove();
    for (const b of stage.querySelectorAll('[data-act="lookback"][aria-expanded]')) b.setAttribute('aria-expanded', String(b.dataset.id === S.lookAt));
    const slot = stage.querySelector(`[data-slot="${key}"]`);
    // The panel opens right under the question that asked for it, and the page does not scroll: the reader keeps their place.
    if (S.lookAt && slot) slot.innerHTML = lookPanel(key).s;
    const btn = stage.querySelector(`[data-act="lookback"][aria-expanded][data-id="${key}"]`);
    if (!S.lookAt && btn) btn.focus({ preventScroll: true });
    announce(S.lookAt ? 'The story is open. Your answers are still saved on the page.' : 'The story is closed.');
  }

  // ------------------------------------------------------------ one question (any format)
  const wrongTries = (st, stageName) => st.attempts.filter((a) => a.stage === stageName && !a.correct).map((a) => a.response);
  function choiceButtons(it, st, stageName) {
    const choices = stageName === 'follow' ? it.follow.choices : it.choices;
    const right = stageName === 'follow' ? it.follow.right : it.right;
    const tried = wrongTries(st, stageName);
    const finished = st.done || (stageName === 'main' && st.stage === 'follow');
    return html`<div class="rd-choices" role="group" aria-label="Answers">${choices.map((c, k) => {
      const cls = finished && k === right ? ' is-right' : tried.includes(k) ? ' is-wrong' : '';
      return html`<button type="button" class="rd-choice${cls}" data-act="answer" data-id="${it.id}" data-k="${k}"${finished ? ' disabled' : ''}>${c}</button>`;
    })}</div>`;
  }
  function itemBody(it, st) {
    const done = st.done;
    if (it.format === 'choice' || it.format === 'tf') {
      const main = it.format === 'tf'
        ? html`<div class="rd-choices rd-tfchoices" role="group" aria-label="True or false">${[['true', 'True'], ['false', 'False']].map(([v, label]) => {
          const mainDone = done || st.stage === 'follow';
          const tried = wrongTries(st, 'main').includes(v === 'true');
          const cls = mainDone && (v === 'true') === it.right ? ' is-right' : tried ? ' is-wrong' : '';
          return html`<button type="button" class="rd-choice${cls}" data-act="tf" data-id="${it.id}" data-v="${v}"${mainDone ? ' disabled' : ''}>${label}</button>`;
        })}</div>`
        : choiceButtons(it, st, 'main');
      const follow = it.follow && (st.stage === 'follow' || done)
        ? html`<div class="rd-follow"><p class="rd-qask rd-followask"><span class="rd-tf">${it.follow.kind === 'correction' ? 'Fix it' : 'Prove it'}</span> ${it.follow.ask}</p>${choiceButtons(it, st, 'follow')}</div>` : '';
      return html`<p class="rd-qask">${it.format === 'tf' ? html`<span class="rd-tf">True or false</span> ` : ''}${it.ask.replace(/^True or false:\s*/i, '')}</p>${main}${follow}`;
    }
    if (it.format === 'blank') {
      const [before, after] = it.ask.split('___');
      return html`<p class="rd-qask rd-blankline"><label for="in-${it.id}">${before}</label><input type="text" class="rd-blank${done ? ' is-right' : ''}" id="in-${it.id}" data-id="${it.id}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Fill in the blank: ${it.ask.replace('___', 'blank')}" value="${st.draft}"${done ? ' disabled' : ''}>${after}</p>
        ${done ? '' : html`<p class="btn-row"><button type="button" class="btn" data-act="check-blank" data-id="${it.id}">Check</button></p>`}`;
    }
    if (it.format === 'sequence') {
      return html`<p class="rd-qask">${it.ask}</p><p class="hint">Tap the cards in order, first to last.</p>
        <div class="rd-choices">${it.display.map((c) => {
          const pos = st.slots.indexOf(c);
          return html`<button type="button" class="rd-choice${pos >= 0 ? ' is-right' : ''}" data-act="seq" data-id="${it.id}" data-card="${c}"${pos >= 0 ? ' disabled' : ''}>${pos >= 0 ? html`<b>${pos + 1}.</b> ` : ''}${c}</button>`;
        })}</div>`;
    }
    // A passage-original "say it" item: he says it, looks at a model, and marks himself. Self-assessed, never checked.
    return html`<p class="rd-qask">${it.ask}</p>${st.shown ? html`<div class="rd-model"><p><b>A good answer:</b> ${it.model}</p>
      ${st.selfStatus ? html`<p class="rd-fb ok" role="status">${st.selfStatus === 'got' ? 'You marked this one: I got it.' : 'You marked this one: not yet. Keep practicing.'}</p>`
        : html`<p>Did you say something like this?</p><p class="btn-row"><button type="button" class="btn btn-primary" data-act="say-grade" data-id="${it.id}" data-ok="1">I got it</button><button type="button" class="btn" data-act="say-grade" data-id="${it.id}" data-ok="0">Not yet</button></p>`}</div>`
      : html`<p class="hint">Say your answer out loud, or write it down. Then check it.</p><p class="btn-row"><button type="button" class="btn" data-act="say-show" data-id="${it.id}">Show a good answer</button></p>`}`;
  }
  function hintsBlock(it, st) {
    if (!st.helpLevel) return '';
    const levels = [1, 2, 3].filter((l) => l <= st.helpLevel).map((l) => hintAt(story, it, l));
    return html`<div class="rd-hints" role="region" aria-label="Hints">${levels.map((h) => html`<div class="rd-hint rd-hint-${h.level}"><p><b>Hint ${h.level}: ${h.title}.</b></p>
      ${h.level === 1 ? html`<p>${h.text}</p>` : h.level === 2 ? html`<ul>${h.sentences.map((e) => html`<li><q>${e.text}</q></li>`)}</ul>`
        : html`<p>The answer: <b>${h.text}</b></p>${h.explain ? html`<p>${h.explain}</p>` : ''}`}</div>`)}</div>`;
  }
  function helpRow(it, st) {
    if (it.format === 'say' || st.done) return it.format === 'say' ? '' : html`<p class="btn-row rd-helprow">${lookButton(it.id)}</p>`;
    const labels = ['Need a hint?', 'Show me where to look', 'Show a model answer', 'The answer is shown'];
    return html`<p class="btn-row rd-helprow"><button type="button" class="btn" data-act="hint" data-id="${it.id}"${st.helpLevel >= 3 ? ' disabled' : ''}>${labels[st.helpLevel]}</button>${lookButton(it.id)}</p>`;
  }
  function feedback(it, st) {
    if (it.format === 'say') return '';
    const status = statusOf(st, it);
    const missed = st.attempts.some((a) => !a.correct) && !st.done;
    return html`${missed ? html`<p class="rd-fb no" role="status">Not yet. Let's look for the clue together. Try again, ask for a hint, or look back at the story.</p>` : ''}
      ${st.done ? html`<p class="rd-fb ok" role="status">${STATUS_TEXT[status]}</p>${it.explain ? html`<p class="rd-explain"><b>Why:</b> ${it.explain}</p>` : ''}` : ''}`;
  }
  function itemBlock(it, n) {
    const st = S.items[it.id];
    const status = statusOf(st, it);
    return html`<li class="rd-q" id="item-${it.id}" data-item="${it.id}">
      <div class="rd-qhead"><span class="rd-qn" aria-hidden="true">${n}</span><span class="rd-skill">${SKILLS[it.skill] || it.skill}</span>
        <span class="rd-status st-${status}">${STATUS_TEXT[status]}</span>${st.round > 1 ? html`<span class="rd-round">Round ${st.round}</span>` : ''}</div>
      ${itemBody(it, st)}${feedback(it, st)}${helpRow(it, st)}${hintsBlock(it, st)}${lookSlot(it.id)}</li>`;
  }
  function itemList(list) {
    return html`<ol class="rd-qs">${list.map((it, i) => itemBlock(it, i + 1))}</ol>`;
  }
  /** "Answered 3 of 8" and a retry for the ones he is still working on. Unanswered is never counted as wrong. */
  function progressLine(list) {
    const stats = list.map((it) => statusOf(S.items[it.id], it));
    const count = (s) => stats.filter((x) => x === s).length;
    const again = list.filter((it) => ['practicing', 'withHelp'].includes(statusOf(S.items[it.id], it)));
    return html`<p class="rd-progress" role="status">Answered ${list.length - count('unanswered')} of ${list.length}.
      ${count('independent') ? ` Found independently: ${count('independent')}.` : ''}${count('withHelp') ? ` Found after a hint: ${count('withHelp')}.` : ''}${count('practicing') ? ` Still practicing: ${count('practicing')}.` : ''}</p>
      ${again.length ? html`<p class="btn-row"><button type="button" class="btn" data-act="retry-some" data-group="${list[0].group}">Practice the ${again.length} I am still working on</button></p>` : ''}`;
  }

  // ------------------------------------------------------------ steps
  const stepViews = {
    guide() {
      return html`
        <h2 id="rd-h" tabindex="-1">Story Guide: what to look for</h2>
        <p>${story.kind === 'story' ? 'Every story has these parts.' : 'This passage tells facts. Look for these parts.'} Clue words can help you find each one. Clues help, but always think about what the sentence is telling you. You will find the parts yourself, and the answers wait for you in Check answers.</p>
        <ul class="rd-guide">${guide.map((e) => html`<li class="rd-gcard el-${e.id}">
          <h3>${e.label}</h3><p class="rd-ask">${e.ask}</p><p>${e.tip}</p>
          <p class="rd-clues"><span>Clue words:</span> ${e.clues.map((c) => html`<b class="rd-cw">${c}</b> `)}</p></li>`)}</ul>`;
    },
    listen() {
      return html`
        <h2 id="rd-h" tabindex="-1">Listen first</h2>
        <p>${canSpeak ? 'The words are hidden. Press play and listen carefully.' : 'This device cannot read aloud. Ask a grown-up to read the story out loud while you listen.'}</p>
        ${canSpeak ? html`<p class="btn-row"><button type="button" class="btn btn-primary" data-act="play-all" aria-pressed="${S.playing && S.playingWhat === 'listen'}">${S.playing && S.playingWhat === 'listen' ? 'Stop' : S.playedByUser ? 'Play it again' : 'Play the story'}</button></p>` : ''}
        ${S.listenPlayed ? html`<h3>Listening questions</h3>${progressLine(items.listen)}${itemList(items.listen)}` : html`<p class="hint">Questions show up after you listen.</p>`}`;
    },
    along() {
      return html`
        <h2 id="rd-h" tabindex="-1">Read along</h2>
        <p>Follow the words as they light up. Tap any word to hear it or learn what it means.</p>
        <p class="btn-row">${canSpeak ? html`<button type="button" class="btn btn-primary" data-act="play-along">${S.playing && S.playingWhat === 'along' ? 'Stop' : 'Read it to me'}</button>
          <button type="button" class="btn" data-act="slow" aria-pressed="${S.slow}">Speed: ${S.slow ? 'Slow' : 'Normal'}</button>` : ''}</p>
        ${passage()}${wordCard()}`;
    },
    echo() {
      const n = story.sentences.length, last = S.echo >= n - 1;
      return html`
        <h2 id="rd-h" tabindex="-1">Echo read</h2>
        <p>Listen to one sentence, then read it back in your best voice.</p>
        <div class="rd-sentbox"><p class="rd-sentcount" role="status">Sentence ${S.echo + 1} of ${n}</p>
          ${passage({ only: S.echo, big: true })}${wordCard()}
          <div class="rd-sentnav" role="group" aria-label="Move between sentences">
            ${canSpeak ? html`<button type="button" class="btn rd-sentbtn" data-act="echo-hear">${S.playing && S.playingWhat === 'echo' ? 'Stop' : 'Hear this sentence'}</button>` : ''}
            <button type="button" class="btn rd-sentbtn" data-act="echo-prev"${S.echo === 0 ? ' disabled' : ''}>‹ Previous sentence</button>
            <button type="button" class="btn rd-sentbtn rd-sentnext" data-act="echo-next">${last ? 'Finish the last sentence' : 'Next sentence ›'}</button>
          </div>
          ${S.echoDone ? html`<p class="rd-fb ok" role="status">You read every sentence. Choose the next activity below when you are ready.</p>` : ''}</div>`;
    },
    turn: turnView,
    map() {
      return html`
        <h2 id="rd-h" tabindex="-1">Story map</h2>
        <p>Show what you remember about the story. You can look back at the story any time.</p>
        <p class="btn-row">${lookButton('step')}</p>${lookSlot('step')}
        ${progressLine(items.map)}${itemList(items.map)}`;
    },
    quiz() {
      return html`
        <h2 id="rd-h" tabindex="-1">Questions</h2>
        <p>Read each question. If you are not sure, ask for a hint or look back at the story. That is what good readers do.</p>
        <p class="btn-row">${lookButton('step')}</p>${lookSlot('step')}
        ${progressLine(items.core)}${itemList(items.core)}`;
    },
    write: writeView,
    done: summaryView,
    answers: answersView,
  };

  // ------------------------------------------------------------ timed reading (optional)
  const turnElapsed = () => S.turn.elapsedMs + (S.turn.phase === 'running' ? Date.now() - S.turn.runStart : 0);
  function pauseTurn(note) {
    const t = S.turn;
    if (t.phase !== 'running') return false;
    t.elapsedMs += Date.now() - t.runStart;
    t.phase = 'paused';
    t.note = note;
    stopTimer();
    return true;
  }
  function turnView() {
    const t = S.turn, k = S.readings.length;
    if (t.phase === 'saved') return savedView();
    const head = html`<h2 id="rd-h" tabindex="-1">Your turn: reading ${Math.min(k + 1, MAX_READINGS)} of ${MAX_READINGS}</h2>`;
    const optional = html`<p class="hint">This activity is optional. Reading speed is only one part of reading, and understanding matters more.</p>`;
    if (t.phase === 'ready') return html`${head}${optional}
      <p>Read the whole ${story.kind === 'story' ? 'story' : 'passage'} out loud, at a steady speed. A grown-up keeps the time. Tap a word if you need help. If you leave this activity or hide the page, the timer pauses and does not count that time.</p>
      <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-start">Start reading</button></p>${passage()}${wordCard()}`;
    if (t.phase === 'running') return html`${head}
      <p class="rd-timer" id="rd-timer" role="timer" aria-label="Time reading">${fmt(turnElapsed() / 1000)}</p>
      <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-done">I am done</button><button type="button" class="btn" data-act="turn-pause">Pause</button></p>${passage()}${wordCard()}`;
    if (t.phase === 'paused') return html`${head}
      <div class="rd-fb no" role="status"><p><b>Reading paused at ${fmt(turnElapsed() / 1000)}.</b> ${t.note || 'The timer is paused.'} The time away was not counted.</p></div>
      <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-resume">Resume reading</button><button type="button" class="btn" data-act="turn-redo">Start over</button></p>${passage()}${wordCard()}`;
    return html`${head}
      <p><b>Grown-up:</b> reading time was <b>${fmt(t.seconds)}</b>. Tap each word that was missed. To record where the reader stopped, choose the second tool and tap that word.</p>
      <p class="btn-row"><button type="button" class="btn" data-act="tool" data-tool="error" aria-pressed="${t.tool === 'error'}">Mark missed words</button>
        <button type="button" class="btn" data-act="tool" data-tool="stop" aria-pressed="${t.tool === 'stop'}">Reader stopped here</button></p>
      <p><label class="rd-check"><input type="checkbox" data-act="assisted"${t.assisted ? ' checked' : ''}> A grown-up read or helped with some words</label></p>
      <p class="hint" id="rd-count">${markCount()}</p>${passage({ mark: true })}
      <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-save">Save this reading</button><button type="button" class="btn" data-act="turn-redo">Start over</button></p>`;
  }
  const markCount = () => {
    const t = S.turn;
    return `Missed words: ${t.errors.size}. Words he tapped for help: ${t.helpTaps}.${t.stop !== null ? ` Stopped at word ${t.stop + 1} of ${total}.` : ''}`;
  };
  function readingsList() {
    return html`<ol class="rd-chart" aria-label="Timed readings">${S.readings.map((r, k) => html`<li class="rd-reading">
      <p><b>Reading ${k + 1}</b></p>
      <ul class="rd-metrics">
        <li><span>Finished?</span> ${r.finished ? 'Yes, the whole passage' : `No, stopped at word ${r.reached} of ${total}`}</li>
        <li><span>Accuracy</span> ${r.accuracy}% (${r.correct} of ${r.reached} words right)</li>
        <li><span>Pace</span> ${!r.believable ? 'Not shown: the time looks too short to be right' : `${r.wrr} words right per minute${r.scored ? '' : r.finished ? ' (not scored for speed)' : ' (partial reading, not scored for speed)'}`}</li>
        <li><span>Help</span> ${r.helpTaps} word${r.helpTaps === 1 ? '' : 's'} tapped${r.assisted ? '; a grown-up helped read some words' : ''}</li>
      </ul>
      ${r.scored ? html`<meter min="0" max="150" value="${r.wrr}" aria-label="Reading ${k + 1}: ${r.wrr} words read right per minute"></meter>`
        : html`<p class="hint">${!r.finished ? 'Not scored for speed because the whole passage was not read.' : !r.believable ? 'Not scored for speed because the time looks too short to be right.' : 'Not scored for speed because a grown-up helped.'}</p>`}</li>`)}</ol>
      <p class="hint">Class goal: ${TARGET_WPM} words read right per minute. Pace is only one part of reading.</p>`;
  }
  function savedView() {
    const more = S.readings.length < MAX_READINGS;
    const last = S.readings[S.readings.length - 1];
    return html`<h2 id="rd-h" tabindex="-1">Reading ${S.readings.length} saved</h2>
      ${readingsList()}<p class="rd-fb ${last.scored && last.accuracy >= 95 ? 'ok' : 'no'}" role="status">${suggestion(S.readings)}</p>
      <p class="btn-row">${more ? html`<button type="button" class="btn btn-primary" data-act="turn-again">Read again (reading ${S.readings.length + 1} of ${MAX_READINGS})</button>` : html`<span class="hint">Three readings are saved.</span>`}</p>`;
  }

  // ------------------------------------------------------------ optional writing (self-assessed, never auto-graded)
  function writeView() {
    return html`<h2 id="rd-h" tabindex="-1">Writing (optional)</h2>
      <p>Explain your thinking in your own words. Nobody and nothing grades this on the page. Compare your answer with a model, then a grown-up reads it.</p>
      <p class="btn-row">${lookButton('step')}</p>${lookSlot('step')}
      <ol class="rd-qs">${items.written.map((w, i) => writtenBlock(w, i + 1))}</ol>`;
  }
  function writtenBlock(w, n) {
    const ws = S.written[w.id];
    const status = writtenStatus(ws, w);
    return html`<li class="rd-q rd-written" id="item-${w.id}">
      <div class="rd-qhead"><span class="rd-qn" aria-hidden="true">${n}</span><span class="rd-skill">${SKILLS[w.skill] || w.skill}</span><span class="rd-status st-${status === 'selfAssessed' ? 'self' : status === 'draft' ? 'practicing' : status}">${WRITTEN_TEXT[status]}</span></div>
      <p class="rd-qask"><label for="w-${w.id}">${w.ask}</label></p>
      <p class="rd-starters">${w.starters.map((t, k) => html`<button type="button" class="btn" data-act="starter" data-id="${w.id}" data-k="${k}">Start with: ${t}</button> `)}</p>
      <textarea id="w-${w.id}" class="rd-textarea" data-id="${w.id}" rows="4" autocomplete="off" spellcheck="true">${ws.text}</textarea>
      <p class="btn-row">${ws.viewedHint ? '' : html`<button type="button" class="btn" data-act="w-hint" data-id="${w.id}">Show me where to look</button>`}
        <button type="button" class="btn btn-primary" data-act="w-compare" data-id="${w.id}"${ws.text.trim() ? '' : ' disabled'}>${ws.compared ? 'Compare again' : 'Compare with a model'}</button></p>
      ${ws.viewedHint ? html`<div class="rd-hints"><div class="rd-hint rd-hint-2"><p><b>Where to look.</b> ${w.hint}</p><ul>${w.evidence.map((i) => html`<li><q>${sentenceOf(i)}</q></li>`)}</ul></div></div>` : ''}
      ${ws.compared ? html`<div class="rd-model"><p><b>A good answer:</b> ${w.model}</p>
        <fieldset class="rd-checklist"><legend>Compare yours with the model. Did you...</legend>${w.checklist.map((c, k) => html`<label class="rd-check"><input type="checkbox" data-act="w-check" data-id="${w.id}" data-k="${k}"${ws.checks[k] ? ' checked' : ''}> ${c}</label>`)}</fieldset>
        <p class="hint">This is your own check. Your answer can use different words and still be right. A grown-up should read it.</p></div>` : ''}
    </li>`;
  }

  // ------------------------------------------------------------ the parent summary (printable, in memory only)
  const RESULT_WORD = { independent: 'Found independently', withHelp: 'Found after a hint', practicing: 'Still practicing', unanswered: 'Not answered yet', self: 'Self-checked' };
  const FIRST_WORD = { right: 'Right', wrong: 'Not yet', none: '–' };
  function summaryView() {
    const sum = buildSummary({
      story, items, states: S.items, writtenStates: S.written, readings: S.readings, lookBacks: S.lookBacks,
      activities: STEPS.filter((s) => !['done'].includes(s.id)).map((s) => ({ id: s.id, label: s.label, optional: !s.rec, state: activityState(s.id) })),
    });
    const c = sum.counts;
    const groups = [['listen', 'Listening'], ['map', 'Story map'], ['core', 'Questions']];
    return html`<div class="rd-summary" id="rd-summary">
      <h2 id="rd-h" tabindex="-1">Session summary</h2>
      <p class="rd-sumhead"><b>${story.title}</b> · ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
      <p class="rd-fb no rd-nonprint" role="note">This summary is only on this page. It is not saved or sent anywhere. If you leave or reload the page it is cleared, so print it or write it down first.</p>
      <p class="btn-row rd-nonprint"><button type="button" class="btn btn-primary" data-act="print">Print this summary</button></p>

      <h3>Activities</h3>
      <table class="rd-table"><thead><tr><th scope="col">Activity</th><th scope="col">Status</th></tr></thead><tbody>
        ${sum.activities.map((a) => html`<tr><th scope="row">${a.label}${a.optional ? html` <span class="hint">(optional)</span>` : ''}</th><td>${a.id === 'guide' && a.state === 'done' ? 'Opened' : ACTIVITY_WORD[a.state]}</td></tr>`)}</tbody></table>

      <h3>Comprehension questions (checked by the page)</h3>
      <p>Found independently: <b>${c.independent}</b> · Found after a hint: <b>${c.withHelp}</b> · Still practicing: <b>${c.practicing}</b> · Not answered yet: <b>${c.unanswered}</b> · Total: ${sum.total}</p>
      <p class="hint">The page also keeps his first try on each question for you: first try right ${sum.firstTry.right} of ${sum.firstTry.tried} tried. Success here means finding the answer, not getting it right the first time.</p>
      ${groups.map(([g, label]) => {
        const rows = sum.rows.filter((r) => r.group === g && !r.selfChecked);
        return rows.length ? html`<table class="rd-table"><caption>${label}</caption><thead><tr><th scope="col">Question</th><th scope="col">Skill</th><th scope="col">Result</th><th scope="col">First try</th><th scope="col">Help</th></tr></thead><tbody>
          ${rows.map((r) => html`<tr><th scope="row">${r.ask.replace(/___/g, '…')}</th><td>${SKILLS[r.skill] || r.skill}</td><td>${RESULT_WORD[r.status]}${r.retried ? ' (practiced again)' : ''}</td><td>${FIRST_WORD[r.first]}</td><td>${r.revealed ? 'Answer shown' : r.helped ? 'Hint used' : '–'}</td></tr>`)}</tbody></table>` : '';
      })}
      ${sum.withHelp.length ? html`<h3>Completed with help</h3><ul>${sum.withHelp.map((r) => html`<li>${r.ask.replace(/___/g, '…')}</li>`)}</ul>` : ''}
      ${sum.unanswered.length ? html`<h3>Not answered yet</h3><ul>${sum.unanswered.map((r) => html`<li>${r.ask.replace(/___/g, '…')}</li>`)}</ul>` : ''}
      <h3>Skills to revisit</h3>
      ${sum.skillsToRevisit.length ? html`<ul>${sum.skillsToRevisit.map((x) => html`<li>${x}</li>`)}</ul>` : html`<p>None yet from the questions he has answered.</p>`}
      ${sum.notTried.length ? html`<p class="hint">Not tried yet: ${sum.notTried.join(', ')}.</p>` : ''}

      ${sum.selfAssessed.length ? html`<h3>Self-checked (not scored by the page)</h3><p class="hint">He said these out loud and marked himself. They are not counted above.</p><ul>${sum.selfAssessed.map((r) => html`<li>${r.ask.replace(/___/g, '…')} – ${RESULT_WORD[r.status]}</li>`)}</ul>` : ''}

      ${sum.written.length ? html`<h3>Written responses (self-assessed, need a grown-up)</h3>${sum.written.map((w) => html`<div class="rd-wsum"><p><b>${w.ask}</b></p>
        ${w.text.trim() ? html`<p class="rd-wtext">${w.text}</p>` : html`<p class="hint">Not written yet.</p>`}
        <p>Status: ${WRITTEN_TEXT[w.status]}</p>
        ${w.status !== 'unanswered' ? html`<ul class="rd-checkres">${w.checklist.map((c, k) => html`<li>${w.checks[k] ? '[x]' : '[ ]'} ${c}</li>`)}</ul>
          <label class="rd-check rd-nonprint"><input type="checkbox" data-act="w-reviewed" data-id="${w.id}"${w.reviewed ? ' checked' : ''}> Reviewed by a grown-up</label>` : ''}</div>`)}` : ''}

      <h3>Timed readings (optional)</h3>
      ${S.readings.length ? readingsList() : html`<p class="hint">No timed reading was done.</p>`}

      <h3>Reading strategies</h3>
      <p>Looked back at the story ${S.lookBacks} time${S.lookBacks === 1 ? '' : 's'}${S.lookBacks ? ', which is a good reading strategy' : ''}.</p>

      <div class="rd-nonprint"><h3>What next?</h3>
        <p class="btn-row">${sum.counts.practicing + sum.counts.withHelp ? html`<button type="button" class="btn btn-primary" data-act="retry-all-missed">Practice the ${sum.counts.practicing + sum.counts.withHelp} I am still working on</button>` : ''}
          <button type="button" class="btn" data-act="retry-everything">Start a fresh attempt at every question</button>
          <button type="button" class="btn" data-act="go" data-step="answers">Check answers</button></p>
        <p class="hint">Practicing again keeps everything else, including timed readings and the first tries.</p>
        <p class="btn-row"><a class="btn" href="${ctx.link('reading')}">All passages</a>
          ${(() => { const next = index.stories[index.stories.findIndex((x) => x.id === story.id) + 1]; return next ? html`<a class="btn" href="${ctx.actLink('reading', next.id)}">Next passage: ${next.title}</a>` : ''; })()}</p></div>
    </div>`;
  }

  // ------------------------------------------------------------ the answer-review area (always open, no password)
  function answersView() {
    const key = answerKey(story);
    const open = (id) => S.shown.has(id);
    const row = (id, title, body, ev) => html`<li class="rd-akey"><button type="button" class="rd-reveal" data-act="toggle-key" data-id="${id}" aria-expanded="${open(id)}"><span>${title}</span><span class="rd-plus" aria-hidden="true">${open(id) ? '−' : '+'}</span></button>${open(id) ? html`<div class="rd-apanel">${body}<p class="hint">Evidence in the story:</p><ul>${ev.map((i) => html`<li><q>${sentenceOf(i)}</q></li>`)}</ul></div>` : ''}</li>`;
    const ans = (a) => html`<p><b>${a}</b></p>`;
    const titleOf = (r) => `${r.format === 'tf' ? 'True or false: ' : ''}${String(r.ask).replace(/___/g, '…').replace(/^True or false:\s*/i, '')}`;
    const mapRows = key.map.map((m) => row(m.id, html`<b>${GUIDE[story.kind].find((g) => g.id === m.element)?.label || m.id}</b>: ${titleOf(m)}`, html`${ans(m.answer)}${m.explain ? html`<p>${m.explain}</p>` : ''}`, m.evidence));
    const qRows = key.questions.map((q) => row(q.id, titleOf(q), html`${ans(q.answer)}${q.explain ? html`<p>${q.explain}</p>` : ''}`, q.evidence));
    const wRows = key.written.map((w) => row(w.id, w.ask, html`<p class="hint">Write your own answer first. This is a model, and yours can use different words.</p>${ans(w.model)}`, w.evidence));
    return html`<h2 id="rd-h" tabindex="-1">Check answers</h2>
      <p>Tap a question to see its answer and where to find it in the story. Try to remember it first! Opening an answer before you have finished a question is noted as help.</p>
      <p class="btn-row"><button type="button" class="btn" data-act="key-all">${S.shown.size ? 'Hide all the answers' : 'Show all the answers'}</button>
        <button type="button" class="btn" data-act="key-clues" aria-pressed="${S.keyClues}">Clue words in the story: ${S.keyClues ? 'On' : 'Off'}</button></p>
      ${S.keyClues ? legend() : ''}${passage({ reveal: S.keyClues })}${wordCard()}
      <h3>Story map</h3><ul class="rd-key">${mapRows}</ul>
      <h3>Questions</h3><ul class="rd-key">${qRows}</ul>
      ${wRows.length ? html`<h3>Writing (models)</h3><ul class="rd-key">${wRows}</ul>` : ''}`;
  }

  // ------------------------------------------------------------ drawing
  function stepNav() {
    const si = STEPS.findIndex((s) => s.id === S.step);
    const prev = STEPS[si - 1], next = STEPS[si + 1];
    const rec = next && !next.rec ? nextRecommended(S.step) : null;
    return html`<nav class="rd-nav" aria-label="Move between activities">
      ${prev ? html`<button type="button" class="btn rd-actnav" data-act="go" data-step="${prev.id}">‹ Previous activity: ${prev.label}</button>` : html`<span></span>`}
      <span class="rd-navright">
        ${rec ? html`<button type="button" class="btn rd-actnav" data-act="go" data-step="${rec.id}">Skip to: ${rec.label}</button>` : ''}
        ${next ? html`<button type="button" class="btn btn-primary rd-actnext" data-act="go" data-step="${next.id}">Next activity: ${next.label}${next.rec ? '' : ' (optional)'} ›</button>` : ''}
      </span></nav>`;
  }
  function stepsRow() {
    return html`<p class="rd-path"><b>Recommended path:</b> ${STEPS.filter((s) => s.rec).map((s) => s.label).join(' → ')}. <b>Optional, and always open:</b> ${STEPS.filter((s) => !s.rec).map((s) => s.label).join(', ')}.</p>
      <ol class="rd-steps" aria-label="Activities">${STEPS.map((s, k) => {
    const st = activityState(s.id);
    return html`<li><button type="button" class="rd-step${s.id === S.step ? ' is-now' : ''}${st === 'done' && s.id !== S.step ? ' is-past' : ''}${s.rec ? '' : ' is-optional'}" data-act="go" data-step="${s.id}"${s.id === S.step ? ' aria-current="step"' : ''}>
      <span class="rd-sn">${st === 'done' && s.id !== 'done' && s.id !== 'guide' ? '✓' : k + 1}</span><span class="rd-sl">${s.label}${s.rec ? '' : html` <small>${s.review ? 'review' : 'optional'}</small>`}</span></button></li>`;
  })}</ol>`;
  }
  function render(focus = true) {
    stopTimer();
    document.body.classList.toggle('rd-summary-open', S.step === 'done');
    stage.innerHTML = html`${stepsRow()}
      <div class="card rd-stage" id="rd-stage" data-step="${S.step}">${stepViews[S.step]()}</div>${stepNav()}`.s;
    if (S.step === 'turn' && S.turn.phase === 'running') tick();
    if (focus) stage.querySelector('#rd-h')?.focus({ preventScroll: false });
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
  }
  /** Redraws only the activity (keeps focus on the control just used). Typed text lives in the state, so it is never lost. */
  function refresh(focusSel) {
    stopTimer();
    const box = stage.querySelector('#rd-stage');
    box.innerHTML = stepViews[S.step]().s;
    stage.querySelector('.rd-steps').outerHTML = stepsRow().s.match(/<ol class="rd-steps"[\s\S]*<\/ol>/)[0];
    stage.querySelector('.rd-path').outerHTML = stepsRow().s.match(/<p class="rd-path">[\s\S]*?<\/p>/)[0];
    if (S.step === 'turn' && S.turn.phase === 'running') tick();
    if (focusSel) stage.querySelector(focusSel)?.focus({ preventScroll: true });
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
  }
  function tick() {
    const el = stage.querySelector('#rd-timer');
    const draw = () => { if (el) el.textContent = fmt(turnElapsed() / 1000); };
    draw();
    timer = setInterval(draw, 500);
  }

  // ------------------------------------------------------------ playback (the displayed state always matches the sound)
  function syncPlayButtons() {
    const set = (act, what, on, off) => { const b = stage.querySelector(`[data-act="${act}"]`); if (b) { b.textContent = S.playing && S.playingWhat === what ? on : off; b.setAttribute('aria-pressed', String(S.playing && S.playingWhat === what)); } };
    set('play-all', 'listen', 'Stop', S.playedByUser ? 'Play it again' : 'Play the story');
    set('play-along', 'along', 'Stop', 'Read it to me');
    set('echo-hear', 'echo', 'Stop', 'Hear this sentence');
    for (const n of stage.querySelectorAll('.rd-w.now, .rd-sent.now')) n.classList.remove('now');
  }
  /** Stops any playback and puts the page back to "not playing" (buttons, lit words) in one place. */
  function haltPlayback() {
    stopSpeech(); stopAll();
    S.playing = false; S.playingWhat = null;
    syncPlayButtons();
  }
  function lightWord(n) {
    for (const w of stage.querySelectorAll('.rd-w.now')) w.classList.remove('now');
    stage.querySelector(`.rd-w[data-n="${n}"]`)?.classList.add('now');
  }
  function readSentences(from, to, { rate, then }) {
    let si = from;
    const next = () => {
      if (si > to || !S.playing) { const wasPlaying = S.playing; S.playing = false; S.playingWhat = null; syncPlayButtons(); if (wasPlaying) then?.(); return; }
      const s = si++;
      for (const el of stage.querySelectorAll('.rd-sent.now')) el.classList.remove('now');
      stage.querySelector(`.rd-sent[data-s="${s}"]`)?.classList.add('now');
      stopSpeech = speak(story.sentences[s], {
        rate,
        onWord: (ci) => { const t = tokens[s].find((x) => ci >= x.start && ci < x.end); if (t) lightWord(t.n); },
        onEnd: next,
      });
    };
    next();
  }
  function playAll() {
    if (S.playing && S.playingWhat === 'listen') { haltPlayback(); return; }
    haltPlayback();
    S.playing = true; S.playingWhat = 'listen';
    syncPlayButtons();
    let si = 0;
    const next = () => {
      if (si >= story.sentences.length || !S.playing) {
        const finished = S.playing;
        S.playing = false; S.playingWhat = null;
        if (finished) { S.listenPlayed = true; S.playedByUser = true; refresh('[data-act="play-all"]'); announce('The story is finished. Answer the questions.'); } else syncPlayButtons();
        return;
      }
      stopSpeech = speak(story.sentences[si++], { rate: 0.9, onEnd: next });
    };
    next();
  }
  function playAlong() {
    if (S.playing && S.playingWhat === 'along') { haltPlayback(); return; }
    haltPlayback();
    S.playing = true; S.playingWhat = 'along';
    syncPlayButtons();
    readSentences(0, story.sentences.length - 1, { rate: S.slow ? 0.7 : 0.9, then: () => { S.alongDone = true; syncPlayButtons(); announce('Finished reading along.'); } });
  }
  function echoHear() {
    if (S.playing && S.playingWhat === 'echo') { haltPlayback(); return; }
    haltPlayback();
    S.playing = true; S.playingWhat = 'echo';
    syncPlayButtons();
    readSentences(S.echo, S.echo, { rate: 0.85, then: () => {} });
  }

  // ------------------------------------------------------------ answering
  const itemById = (id) => items.all.find((x) => x.id === id);
  function afterSubmit(it, st, result, focusSel) {
    const status = statusOf(st, it);
    announce(result.done ? STATUS_TEXT[status] : result.correct ? 'That is right. One more part.' : "Not yet. Let's look for the clue together.");
    refresh(focusSel);
  }
  function answerChoice(id, k) {
    const it = itemById(id), st = S.items[id];
    if (st.done) return;
    const result = submit(st, it, k);
    afterSubmit(it, st, result, `#item-${id} [data-act="answer"]:not([disabled])`);
  }
  function answerTf(id, v) {
    const it = itemById(id), st = S.items[id];
    const result = submit(st, it, v === 'true');
    afterSubmit(it, st, result, `#item-${id} [data-act="answer"]:not([disabled])`);
  }
  function checkBlankItem(id) {
    const it = itemById(id), st = S.items[id];
    if (st.done) return;
    const value = (stage.querySelector(`#in-${id}`)?.value ?? st.draft).trim();
    if (!value) { announce('Type your answer first.'); stage.querySelector(`#in-${id}`)?.focus(); return; }
    st.draft = value;
    const result = submit(st, it, value);
    afterSubmit(it, st, result, result.done ? `#item-${id} [data-act="hint"]` : `#in-${id}`);
  }
  function pickCard(id, card) {
    const it = itemById(id), st = S.items[id];
    const result = submit(st, it, card);
    afterSubmit(it, st, result, `#item-${id} [data-act="seq"]:not([disabled])`);
  }
  function askHint(id) {
    const it = itemById(id), st = S.items[id];
    const level = useHint(st);
    announce(level === 3 ? 'Here is the answer and why.' : level === 2 ? 'Here is where to look.' : 'Here is what to look for.');
    refresh(`#item-${id} [data-act="hint"]`);
  }
  function retryGroup(predicate, message) {
    let n = 0;
    for (const it of items.all) { const st = S.items[it.id]; if (it.format !== 'say' && predicate(it, st)) { retry(st); n++; } }
    announce(`${message} ${n} question${n === 1 ? '' : 's'} ready to try again.`);
    return n;
  }

  // ------------------------------------------------------------ tapping words
  function tapWord(btn) {
    const n = Number(btn.dataset.n), t = flat[n];
    if (S.step === 'turn' && S.turn.phase === 'marking') {
      const tu = S.turn;
      if (tu.tool === 'stop') tu.stop = tu.stop === n ? null : n;
      else if (tu.errors.has(n)) tu.errors.delete(n); else tu.errors.add(n);
      btn.classList.toggle('is-err', tu.errors.has(n));
      for (const w of stage.querySelectorAll('.is-stop')) w.classList.remove('is-stop');
      if (tu.stop !== null) stage.querySelector(`.rd-w[data-n="${tu.stop}"]`)?.classList.add('is-stop');
      stage.querySelector('#rd-count').textContent = markCount();
      return;
    }
    if (S.step === 'turn' && S.turn.phase === 'running') S.turn.helpTaps++;
    // Tapping a word during read-along stops the playback, and the page says so (buttons and lit words reset).
    if (S.playing) { haltPlayback(); announce('Stopped. Tap Read it to me to start again.'); }
    S.card = { key: t.key, text: t.text, el: S.step === 'answers' && S.keyClues ? t.el : null };
    if (t.key && S.step !== 'answers' && !S.tapped.includes(t.key)) S.tapped.push(t.key);
    const card = stage.querySelector('#rd-card');
    if (card) card.outerHTML = wordCard().s;
    if (canSpeak) { stopSpeech(); stopAll(); stopSpeech = speak(t.key, { rate: 0.8 }); }
    announce(story.words[t.key] ? `${t.key}. ${story.words[t.key].means}.` : t.key);
  }

  // ------------------------------------------------------------ navigation
  function go(step) {
    if (step === S.step) return;
    haltPlayback();
    // Leaving the timed reading pauses it: time on another activity never counts as reading time.
    if (S.step === 'turn' && pauseTurn('You left this activity, so the timer paused.')) announce('The timer paused because you left Your turn.');
    S.step = step; S.card = null; S.visited.add(step);
    if (step === 'echo') S.echo = Math.min(S.echo, story.sentences.length - 1);
    if (step !== 'answers') { S.keyClues = false; }
    S.lookAt = null;
    render();
  }

  // ------------------------------------------------------------ clicks, typing and keys
  stage.addEventListener('click', (e) => {
    const w = e.target.closest('.rd-w');
    if (w) return tapWord(w);
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const a = b.dataset.act, id = b.dataset.id;
    switch (a) {
      case 'go': return go(b.dataset.step);
      case 'slow': S.slow = !S.slow; return refresh('[data-act="slow"]');
      case 'play-all': return playAll();
      case 'play-along': return playAlong();
      case 'echo-hear': return echoHear();
      case 'echo-next':
        haltPlayback();
        if (S.echo >= story.sentences.length - 1) { S.echoDone = true; announce('You finished echo reading.'); return refresh('[data-act="echo-next"]'); }
        S.echo++; return refresh('[data-act="echo-next"]');
      case 'echo-prev': haltPlayback(); S.echo = Math.max(0, S.echo - 1); return refresh('[data-act="echo-next"]');
      case 'say': { stopSpeech(); stopAll(); stopSpeech = speak(b.dataset.text, { rate: b.dataset.slow ? 0.55 : 0.8 }); return; }
      case 'answer': return answerChoice(id, Number(b.dataset.k));
      case 'tf': return answerTf(id, b.dataset.v);
      case 'check-blank': return checkBlankItem(id);
      case 'seq': return pickCard(id, b.dataset.card);
      case 'hint': return askHint(id);
      case 'lookback': return toggleLook(id, Boolean(b.dataset.close));
      case 'say-show': { const st = S.items[id]; st.shown = true; return refresh(`[data-act="say-grade"][data-id="${id}"]`); }
      case 'say-grade': selfAssess(S.items[id], b.dataset.ok === '1'); announce('Saved. This one is self-checked.'); return refresh('[data-act="go"].rd-actnext');
      case 'retry-some': { const g = b.dataset.group; retryGroup((it, st) => it.group === g && ['practicing', 'withHelp'].includes(statusOf(st, it)), 'Fresh round.'); return refresh('#rd-h'); }
      case 'retry-all-missed': retryGroup((it, st) => ['practicing', 'withHelp'].includes(statusOf(st, it)), 'Fresh round.'); S.step = 'quiz'; S.visited.add('quiz'); return render();
      case 'retry-everything': retryGroup((it, st) => attempted(st, it), 'New attempt.'); S.step = 'quiz'; S.visited.add('quiz'); return render();
      case 'turn-start': S.turn = freshTurn(); S.turn.phase = 'running'; S.turn.runStart = Date.now(); S.card = null; return refresh('[data-act="turn-done"]');
      case 'turn-pause': pauseTurn('You paused the timer.'); return refresh('[data-act="turn-resume"]');
      case 'turn-resume': S.turn.phase = 'running'; S.turn.runStart = Date.now(); S.turn.note = ''; return refresh('[data-act="turn-done"]');
      case 'turn-done': S.turn.elapsedMs = turnElapsed(); S.turn.runStart = 0; S.turn.seconds = S.turn.elapsedMs / 1000; S.turn.phase = 'marking'; return refresh('#rd-h');
      case 'tool': S.turn.tool = b.dataset.tool; return refresh(`[data-tool="${b.dataset.tool}"]`);
      case 'turn-save': return saveReading();
      case 'turn-redo': case 'turn-again': S.turn = freshTurn(); return refresh('#rd-h');
      case 'starter': return insertStarter(id, Number(b.dataset.k));
      case 'w-hint': S.written[id].viewedHint = true; return refresh(`#w-${id}`);
      case 'w-compare': { const ws = S.written[id]; ws.text = stage.querySelector(`#w-${id}`)?.value ?? ws.text; ws.compared = true; announce('Here is a model answer and a checklist. This is your own check, and a grown-up still needs to read it.'); return refresh(`#item-${id} .rd-checklist input`); }
      case 'toggle-key': {
        if (S.shown.has(id)) S.shown.delete(id); else { S.shown.add(id); const st = S.items[id]; if (st) markRevealed(st); }
        return refresh(`[data-act="toggle-key"][data-id="${id}"]`);
      }
      case 'key-all': {
        if (S.shown.size) S.shown = new Set();
        else { for (const it of items.all) { S.shown.add(it.id); markRevealed(S.items[it.id]); } for (const w of items.written) S.shown.add(w.id); }
        return refresh('[data-act="key-all"]');
      }
      case 'key-clues': S.keyClues = !S.keyClues; return refresh('[data-act="key-clues"]');
      case 'print': return window.print();
      default:
    }
  }, { signal });

  stage.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset?.act === 'assisted') S.turn.assisted = t.checked;
    else if (t.dataset?.act === 'w-check') { const ws = S.written[t.dataset.id]; ws.checks[Number(t.dataset.k)] = t.checked; }
    else if (t.dataset?.act === 'w-reviewed') { S.written[t.dataset.id].reviewed = t.checked; announce(t.checked ? 'Marked as reviewed by a grown-up.' : 'Review mark removed.'); refresh(`[data-act="w-reviewed"][data-id="${t.dataset.id}"]`); }
  }, { signal });
  // Everything typed is kept in the state as it is typed, so switching activities never loses it.
  stage.addEventListener('input', (e) => {
    const t = e.target;
    if (t.classList?.contains('rd-blank')) S.items[t.dataset.id].draft = t.value;
    else if (t.classList?.contains('rd-textarea')) { S.written[t.dataset.id].text = t.value; const btn = stage.querySelector(`[data-act="w-compare"][data-id="${t.dataset.id}"]`); if (btn) btn.disabled = !t.value.trim(); }
  }, { signal });
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('.rd-blank')) { e.preventDefault(); checkBlankItem(e.target.dataset.id); }
  }, { signal });
  // Hiding the page or switching apps pauses a running timer on purpose (the time away is not reading time).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && pauseTurn('The page was hidden, so the timer paused.')) { announce('The timer paused because the page was hidden.'); if (S.step === 'turn') refresh('[data-act="turn-resume"]'); }
  }, { signal });

  function insertStarter(id, k) {
    const w = items.written.find((x) => x.id === id), ws = S.written[id];
    const ta = stage.querySelector(`#w-${id}`);
    const text = w.starters[k];
    const cur = ta.value.trim();
    ta.value = cur ? `${ta.value.replace(/\s+$/, '')} ${text}` : text;
    ws.text = ta.value;
    ta.focus();
    const at = ta.value.lastIndexOf('___');
    if (at >= 0) ta.setSelectionRange(at, at + 3);
    const btn = stage.querySelector(`[data-act="w-compare"][data-id="${id}"]`); if (btn) btn.disabled = false;
  }
  function saveReading() {
    const tu = S.turn;
    const stop = tu.stop;
    const r = scoreReading({ total, stoppedAt: stop === null ? total : stop + 1, errors: [...tu.errors].filter((n) => stop === null || n <= stop).length, seconds: tu.seconds, helpTaps: tu.helpTaps, assisted: tu.assisted });
    S.readings.push(r);
    tu.phase = 'saved';
    announce(`Reading saved: ${r.wrr} words read right per minute.`);
    refresh('#rd-h');
  }

  render(false);
}
