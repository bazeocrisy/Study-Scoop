// The Reading Coach for one story: Story Guide, Listen, Read along, Echo read, Your turn (timed, 3 readings),
// Story Map and Questions. Reading aloud uses the voice built into the device; nothing is recorded, stored or sent.
// A reading's numbers live only while this page is open (CLAUDE.md: no student data without an approved design).
import { html } from './lib/html.js';
import { GUIDE, TARGET_WPM, mapChoices, scoreReading, shuffled, storyPassed, storyTokens, suggestion } from './lib/reading.js';

const STEPS = [
  { id: 'guide', label: 'Story Guide' }, { id: 'listen', label: 'Listen' }, { id: 'along', label: 'Read along' },
  { id: 'echo', label: 'Echo read' }, { id: 'turn', label: 'Your turn' }, { id: 'map', label: 'Story map' },
  { id: 'quiz', label: 'Questions' }, { id: 'done', label: 'All done' },
];
const MAX_READINGS = 3;

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

// ---------------------------------------------------------------- the page
export function mountReading(app, ctx, signal) {
  const { story, index } = ctx.reading;
  const stage = app.querySelector('#rd');
  const live = document.getElementById('live');
  const tokens = storyTokens(story);
  const flat = tokens.flat();
  const total = flat.length;
  const guide = GUIDE[story.kind];
  const listenQs = story.questions.map((q, i) => ({ ...q, i })).filter((q) => q.type === 'listen');
  const quizQs = story.questions.map((q, i) => ({ ...q, i })).filter((q) => q.type !== 'listen');
  const canSpeak = Boolean(synth());
  synth()?.getVoices();

  const fresh = () => ({
    step: 'guide', clues: true, slow: false, playing: false, listenPlayed: !canSpeak,
    echo: 0, card: null, tapped: [], readings: [],
    turn: { phase: 'ready', startedAt: 0, seconds: 0, errors: new Set(), stop: null, tool: 'error' },
    answers: {}, map: {}, events: { picked: [], slips: 0 },
  });
  let S = fresh();
  let stopSpeech = () => {};
  let timer = null;

  const announce = (t) => { if (live) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); } };
  const stopTimer = () => { clearInterval(timer); timer = null; };
  signal.addEventListener('abort', () => { stopSpeech(); stopAll(); stopTimer(); });

  // ------------------------------------------------------------ small pieces
  const elLabel = (id) => guide.find((e) => e.id === id)?.label || '';
  const sentenceOf = (si) => story.sentences[si];

  /** The passage as one button per word. `opts.range` limits it to some sentences. */
  function passage({ only = null, mark = false, big = false } = {}) {
    const rows = tokens.map((sent, si) => (only !== null && only !== si ? '' : html`<span class="rd-sent" data-s="${si}">${sent.map((t) => {
      const cls = ['rd-w'];
      if (S.clues && t.el) cls.push('rd-clue', `el-${t.el}`);
      if (story.words[t.key]) cls.push('has-def');
      if (mark && S.turn.errors.has(t.n)) cls.push('is-err');
      if (mark && S.turn.stop === t.n) cls.push('is-stop');
      return html`<button type="button" class="${cls.join(' ')}" data-n="${t.n}" data-key="${t.key}"${S.clues && t.el ? html` data-el="${t.el}"` : ''}>${t.text}</button> `;
    })}</span>`));
    return html`<p class="rd-text${big ? ' big' : ''}${mark ? ' marking' : ''}" id="rd-text">${rows}</p>`;
  }

  const clueSwitch = () => html`<button type="button" class="btn" data-act="clues" aria-pressed="${S.clues}">Clue colors: ${S.clues ? 'On' : 'Off'}</button>`;
  const legend = () => S.clues ? html`<ul class="rd-legend" aria-label="Clue colors">${guide.map((e) => html`<li class="rd-chip el-${e.id}">${e.label}</li>`)}</ul>` : '';

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
      ${el ? '' : html`<p class="hint">Saved to My Words for this visit.</p>`}
    </aside>`;
  }

  // ------------------------------------------------------------ steps
  const stepViews = {
    guide() {
      return html`
        <h2 id="rd-h" tabindex="-1">Story Guide: what to look for</h2>
        <p>${story.kind === 'story' ? 'Every story has these parts.' : 'This passage tells facts. Look for these parts.'} Clue words can help you find each one. Clues help, but always think about what the sentence is telling you.</p>
        <ul class="rd-guide">${guide.map((e) => html`<li class="rd-gcard el-${e.id}">
          <h3>${e.label}</h3><p class="rd-ask">${e.ask}</p><p>${e.tip}</p>
          <p class="rd-clues"><span>Clue words:</span> ${e.clues.map((c) => html`<b class="rd-cw">${c}</b> `)}</p></li>`)}</ul>`;
    },
    listen() {
      return html`
        <h2 id="rd-h" tabindex="-1">Listen first</h2>
        <p>${canSpeak ? 'The words are hidden. Press play and listen carefully.' : 'This device cannot read aloud. Ask a grown-up to read the story out loud while you listen.'}</p>
        ${canSpeak ? html`<p class="btn-row"><button type="button" class="btn btn-primary" data-act="play-all" aria-pressed="${S.playing}">${S.playing ? 'Stop' : S.listenPlayed ? 'Play it again' : 'Play the story'}</button></p>` : ''}
        ${S.listenPlayed ? html`<h3>Listening questions</h3>${questions(listenQs)}` : html`<p class="hint">Questions show up after you listen.</p>`}`;
    },
    along() {
      return html`
        <h2 id="rd-h" tabindex="-1">Read along</h2>
        <p>Follow the words as they light up. Tap any word to hear it or learn what it means.</p>
        <p class="btn-row">${canSpeak ? html`<button type="button" class="btn btn-primary" data-act="play-along">${S.playing ? 'Stop' : 'Read it to me'}</button>
          <button type="button" class="btn" data-act="slow" aria-pressed="${S.slow}">Speed: ${S.slow ? 'Slow' : 'Normal'}</button>` : ''}${clueSwitch()}</p>
        ${legend()}${passage()}${wordCard()}`;
    },
    echo() {
      const n = story.sentences.length;
      return html`
        <h2 id="rd-h" tabindex="-1">Echo read</h2>
        <p>Listen to one sentence, then read it back in your best voice. Sentence ${S.echo + 1} of ${n}.</p>
        ${passage({ only: S.echo, big: true })}${wordCard()}
        <p class="btn-row">${canSpeak ? html`<button type="button" class="btn btn-primary" data-act="echo-hear">${S.playing ? 'Stop' : 'Hear it'}</button>` : ''}
          <button type="button" class="btn" data-act="echo-prev"${S.echo === 0 ? ' disabled' : ''}>Back</button>
          <button type="button" class="btn" data-act="echo-next">${S.echo === n - 1 ? 'Finished!' : 'I read it. Next sentence'}</button></p>`;
    },
    turn() {
      const t = S.turn, k = S.readings.length;
      if (t.phase === 'saved') return savedView();
      const head = html`<h2 id="rd-h" tabindex="-1">Your turn: reading ${Math.min(k + 1, MAX_READINGS)} of ${MAX_READINGS}</h2>`;
      if (t.phase === 'ready') return html`${head}
        <p>Read the whole ${story.kind === 'story' ? 'story' : 'passage'} out loud, at a steady speed. A grown-up keeps the time. Tap a word if you need help.</p>
        <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-start">Start reading</button>${clueSwitch()}</p>${passage()}${wordCard()}`;
      if (t.phase === 'running') return html`${head}
        <p class="rd-timer" id="rd-timer" role="timer" aria-label="Time reading">0:00</p>
        <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-done">I am done</button></p>${passage()}${wordCard()}`;
      return html`${head}
        <p><b>Grown-up:</b> time was <b>${fmt(t.seconds)}</b>. Tap each word that was missed, or switch tools and tap the word where the reader stopped.</p>
        <p class="btn-row"><button type="button" class="btn" data-act="tool" data-tool="error" aria-pressed="${t.tool === 'error'}">Mark missed words</button>
          <button type="button" class="btn" data-act="tool" data-tool="stop" aria-pressed="${t.tool === 'stop'}">Reader stopped here</button></p>
        <p class="hint" id="rd-count">${markCount()}</p>${passage({ mark: true })}
        <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-save">Save this reading</button>
          <button type="button" class="btn" data-act="turn-redo">Start over</button></p>`;
    },
    map() {
      return html`
        <h2 id="rd-h" tabindex="-1">Story map</h2>
        <p>Show what you remember. If you miss one, look at the clue sentence and try again.</p>
        <ol class="rd-map">${guide.map((e) => mapCard(e))}</ol>`;
    },
    quiz() {
      return html`<h2 id="rd-h" tabindex="-1">Questions</h2><p>Read each question. Go back to the story to find the answer.</p>
        ${questions(quizQs)}`;
    },
    done: doneView,
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const markCount = () => {
    const t = S.turn;
    return `Missed words: ${t.errors.size}.${t.stop !== null ? ` Stopped at word ${t.stop + 1} of ${total}.` : ''}`;
  };

  // ------------------------------------------------------------ questions
  function choiceButtons(id, choices, st) {
    return html`<div class="rd-choices" role="group" aria-label="Answers">${choices.map((c, k) => {
      const picked = st?.tried?.includes(k);
      const cls = st?.done && st.right === k ? ' is-right' : picked ? ' is-wrong' : '';
      return html`<button type="button" class="rd-choice${cls}" data-act="answer" data-id="${id}" data-k="${k}"${st?.done ? ' disabled' : ''}>${c}</button>`;
    })}</div>`;
  }
  function feedback(st, find) {
    if (!st) return '';
    if (st.done) return html`<p class="rd-fb ok" role="status">Yes! That is right.</p>`;
    if (st.tried?.length) return html`<p class="rd-fb no" role="status">Not yet. Look at this sentence: <q>${sentenceOf(find)}</q> Then try again.</p>`;
    return '';
  }
  function questions(list) {
    return html`<ol class="rd-qs">${list.map((q) => {
      const id = `q${q.i}`, st = S.answers[id];
      return html`<li class="rd-q"><p class="rd-qask">${q.ask}</p>${choiceButtons(id, q.choices, st ? { ...st, right: q.answer } : null)}${feedback(st, q.find)}</li>`;
    })}</ol>`;
  }

  // ------------------------------------------------------------ story map
  function mapCard(e) {
    const m = story.elements[e.id];
    const head = html`<h3>${e.label}</h3><p class="rd-ask">${e.ask}</p>`;
    if (e.id === 'events') {
      const ev = S.events, done = ev.picked.length === 3;
      const cards = shuffled(m.order, 5);
      return html`<li class="rd-mcard el-${e.id}">${head}
        <p class="hint">Tap the events in order: first, next, last.</p>
        <div class="rd-choices">${cards.map((c, k) => {
          const pos = ev.picked.indexOf(c);
          return html`<button type="button" class="rd-choice${pos >= 0 ? ' is-right' : ''}" data-act="event" data-c="${c}"${pos >= 0 ? ' disabled' : ''}>${pos >= 0 ? html`<b>${pos + 1}.</b> ` : ''}${c}</button>`;
        })}</div>
        ${done ? html`<p class="rd-fb ok" role="status">Yes! That is the right order.</p>` : ev.slips ? html`<p class="rd-fb no" role="status">Not yet. Look at this sentence: <q>${sentenceOf(m.find)}</q> Then try again.</p>` : ''}</li>`;
    }
    const mc = mapChoices(m, e.id.length + 3);
    const st = S.map[e.id];
    return html`<li class="rd-mcard el-${e.id}">${head}${choiceButtons(`m-${e.id}`, mc.choices, st ? { ...st, right: mc.answer } : null)}${feedback(st, m.find)}</li>`;
  }
  const mapStats = () => {
    const ids = guide.map((e) => e.id);
    const right = ids.filter((id) => (id === 'events' ? S.events.picked.length === 3 && S.events.slips === 0 : S.map[id]?.done && S.map[id].first)).length;
    return { right, total: ids.length };
  };
  const quizStats = () => {
    const right = quizQs.filter((q) => S.answers[`q${q.i}`]?.done && S.answers[`q${q.i}`].first).length;
    return { right, total: quizQs.length };
  };

  // ------------------------------------------------------------ results
  function chart(readings) {
    return html`<ol class="rd-chart" aria-label="Words read right per minute">${readings.map((r, k) => html`<li>
      <span class="rd-cl">Reading ${k + 1}</span><meter min="0" max="150" value="${r.wrr}" aria-label="Reading ${k + 1}: ${r.wrr} words read right per minute"></meter>
      <span class="rd-cv"><b>${r.wrr}</b> words a minute · ${r.accuracy}% right · ${r.errors} missed${r.finished ? '' : ' · stopped early'}</span></li>`)}</ol>
      <p class="hint">Class goal: ${TARGET_WPM} words read right per minute.</p>`;
  }
  function savedView() {
    const last = S.readings[S.readings.length - 1];
    const more = S.readings.length < MAX_READINGS;
    return html`<h2 id="rd-h" tabindex="-1">Reading ${S.readings.length} saved</h2>
      <p class="rd-big"><b>${last.wrr}</b> words read right per minute</p>
      <p>${last.correct} of ${last.reached} words right (${last.accuracy}%) in ${fmt(last.seconds)}.</p>
      ${last.seconds < 20 || last.wrr > 300 ? html`<p class="rd-fb no" role="status">That time looks very short. If the timer was stopped too soon, choose "Read again" to redo it.</p>` : ''}${chart(S.readings)}
      <p class="rd-fb ${last.accuracy >= 95 ? 'ok' : 'no'}">${suggestion(S.readings, S.tapped)}</p>
      <p class="btn-row">${more ? html`<button type="button" class="btn btn-primary" data-act="turn-again">Read again (reading ${S.readings.length + 1} of ${MAX_READINGS})</button>` : ''}
        <button type="button" class="btn${more ? '' : ' btn-primary'}" data-act="go" data-step="map">Go to the story map</button></p>`;
  }
  function doneView() {
    const q = quizStats(), m = mapStats();
    const passed = storyPassed(q.right, q.total);
    const next = index.stories[index.stories.findIndex((s) => s.id === story.id) + 1];
    const myWords = [...new Set(S.tapped)];
    return html`<h2 id="rd-h" tabindex="-1">${passed ? 'Story complete!' : 'Nice work!'}</h2>
      <p class="rd-big">${passed ? 'You answered at least 4 of 5 questions right on the first try.' : 'Read the story again and try the questions once more to finish it.'}</p>
      <ul class="rd-sum">
        <li><b>Questions:</b> ${q.right} of ${q.total} right on the first try</li>
        <li><b>Story map:</b> ${m.right} of ${m.total} right on the first try</li>
        <li><b>Readings:</b> ${S.readings.length ? S.readings.map((r) => `${r.wrr} words a minute`).join(', then ') : 'none yet. Try Your turn.'}</li>
      </ul>${S.readings.length ? chart(S.readings) : ''}
      ${S.readings.length ? html`<p class="rd-fb ok">${suggestion(S.readings, myWords)}</p>` : ''}
      <h3>My Words</h3>
      ${myWords.length ? html`<ul class="rd-mywords">${myWords.map((w) => html`<li><b>${w}</b>${story.words[w] ? html` <span class="hint">${story.words[w].means}</span>` : ''}${canSpeak ? html` <button type="button" class="btn" data-act="say" data-text="${w}">Hear it</button>` : ''}</li>`)}</ul>` : html`<p class="hint">You did not tap any words this time.</p>`}
      <p class="hint">Numbers are not saved. Write them down if you want to keep them.</p>
      <p class="btn-row"><a class="btn btn-primary" href="${ctx.link('reading')}">All stories</a>
        ${next ? html`<a class="btn" href="${ctx.actLink('reading', next.id)}">Next story: ${next.title}</a>` : ''}
        <button type="button" class="btn" data-act="restart">Read this one again</button></p>`;
  }

  // ------------------------------------------------------------ drawing
  function render(focus = true) {
    stopTimer();
    const si = STEPS.findIndex((s) => s.id === S.step);
    stage.innerHTML = html`
      <ol class="rd-steps" aria-label="Steps">${STEPS.map((s, k) => html`<li><button type="button" class="rd-step${k === si ? ' is-now' : ''}${k < si ? ' is-past' : ''}" data-act="go" data-step="${s.id}"${k === si ? ' aria-current="step"' : ''}><span class="rd-sn">${k + 1}</span><span class="rd-sl">${s.label}</span></button></li>`)}</ol>
      <div class="card rd-stage" id="rd-stage">${stepViews[S.step]()}</div>
      <p class="btn-row rd-nav"><button type="button" class="btn" data-act="prev"${si === 0 ? ' disabled' : ''}>Back</button>
        <button type="button" class="btn btn-primary" data-act="next"${si === STEPS.length - 1 ? ' disabled' : ''}>Next</button></p>`.s;
    if (S.step === 'turn' && S.turn.phase === 'running') tick();
    if (focus) stage.querySelector('#rd-h')?.focus({ preventScroll: false });
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
  }
  /** Redraws only the part under the step heading (keeps focus on the button just pressed). */
  function refresh(focusSel) {
    stopTimer();
    const box = stage.querySelector('#rd-stage');
    box.innerHTML = stepViews[S.step]().s;
    if (S.step === 'turn' && S.turn.phase === 'running') tick();
    if (focusSel) stage.querySelector(focusSel)?.focus({ preventScroll: true });
    app.dataset.rendered = String(Number(app.dataset.rendered || 0) + 1);
  }
  function tick() {
    const el = stage.querySelector('#rd-timer');
    const draw = () => { if (el) el.textContent = fmt((Date.now() - S.turn.startedAt) / 1000); };
    draw();
    timer = setInterval(draw, 500);
  }
  function go(step) {
    stopSpeech(); stopAll(); S.playing = false;
    S.step = step; S.card = null;
    if (step === 'echo') S.echo = Math.min(S.echo, story.sentences.length - 1);
    render();
  }

  // ------------------------------------------------------------ talking
  function lightWord(n) {
    for (const w of stage.querySelectorAll('.rd-w.now')) w.classList.remove('now');
    stage.querySelector(`.rd-w[data-n="${n}"]`)?.classList.add('now');
  }
  /** Reads the sentences from `from`, lighting each word (and the whole sentence when the voice gives no word marks). */
  function readSentences(from, to, { rate, then }) {
    let si = from;
    const next = () => {
      if (si > to || !S.playing) { S.playing = false; for (const w of stage.querySelectorAll('.now')) w.classList.remove('now'); then?.(); return; }
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
    if (S.playing) { S.playing = false; stopSpeech(); stopAll(); return refresh('[data-act="play-all"]'); }
    S.playing = true;
    refresh('[data-act="play-all"]');
    // The words are hidden on this step, so there is nothing to light up.
    let si = 0;
    const next = () => {
      if (si >= story.sentences.length || !S.playing) { S.playing = false; S.listenPlayed = true; refresh('[data-act="play-all"]'); announce('The story is finished. Answer the questions.'); return; }
      stopSpeech = speak(story.sentences[si++], { rate: 0.9, onEnd: next });
    };
    next();
  }
  function playAlong() {
    if (S.playing) { S.playing = false; stopSpeech(); stopAll(); return refresh('[data-act="play-along"]'); }
    S.playing = true;
    refresh('[data-act="play-along"]');
    readSentences(0, story.sentences.length - 1, { rate: S.slow ? 0.7 : 0.9, then: () => refresh('[data-act="play-along"]') });
  }
  function echoHear() {
    if (S.playing) { S.playing = false; stopSpeech(); stopAll(); return refresh('[data-act="echo-hear"]'); }
    S.playing = true;
    refresh('[data-act="echo-hear"]');
    readSentences(S.echo, S.echo, { rate: 0.85, then: () => refresh('[data-act="echo-hear"]') });
  }

  // ------------------------------------------------------------ answering
  function answer(id, k) {
    const isMap = id.startsWith('m-');
    let right, st;
    if (isMap) {
      const key = id.slice(2);
      const mc = mapChoices(story.elements[key], key.length + 3);
      right = mc.answer; st = S.map[key] ||= { tried: [], done: false, first: true };
    } else {
      const q = story.questions[Number(id.slice(1))];
      right = q.answer; st = S.answers[id] ||= { tried: [], done: false, first: true };
    }
    if (st.done) return;
    if (k === right) st.done = true;
    else { st.tried.push(k); st.first = false; }
    announce(st.done ? 'Right!' : 'Not yet. Look at the sentence and try again.');
    refresh(`[data-id="${id}"][data-k="${k}"]`);
  }
  function pickEvent(c) {
    const order = story.elements.events.order, ev = S.events;
    if (c === order[ev.picked.length]) ev.picked.push(c); else ev.slips++;
    announce(ev.picked.length === 3 ? 'Right order!' : 'Keep going.');
    refresh();
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
    S.card = { key: t.key, text: t.text, el: S.clues ? t.el : null };
    // A clue word he tapped to see its colour is not an unknown word, so it stays out of My Words.
    if (t.key && !(S.clues && t.el) && !S.tapped.includes(t.key)) S.tapped.push(t.key);
    const card = stage.querySelector('#rd-card');
    if (card) { card.outerHTML = wordCard().s; }
    if (canSpeak) { stopSpeech(); stopAll(); stopSpeech = speak(t.key, { rate: 0.8 }); }
    announce(story.words[t.key] ? `${t.key}. ${story.words[t.key].means}.` : t.key);
  }

  // ------------------------------------------------------------ turn
  function saveReading() {
    const tu = S.turn;
    const r = scoreReading({ total, stoppedAt: tu.stop === null ? total : tu.stop + 1, errors: [...tu.errors].filter((n) => tu.stop === null || n <= tu.stop).length, seconds: tu.seconds });
    S.readings.push(r);
    tu.phase = 'saved';
    announce(`Reading saved: ${r.wrr} words read right per minute.`);
    refresh('#rd-h');
  }

  // ------------------------------------------------------------ clicks
  stage.addEventListener('click', (e) => {
    const w = e.target.closest('.rd-w');
    if (w) return tapWord(w);
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const a = b.dataset.act, si = STEPS.findIndex((s) => s.id === S.step);
    switch (a) {
      case 'go': return go(b.dataset.step);
      case 'next': return go(STEPS[Math.min(STEPS.length - 1, si + 1)].id);
      case 'prev': return go(STEPS[Math.max(0, si - 1)].id);
      case 'clues': S.clues = !S.clues; return refresh('[data-act="clues"]');
      case 'slow': S.slow = !S.slow; return refresh('[data-act="slow"]');
      case 'play-all': return playAll();
      case 'play-along': return playAlong();
      case 'echo-hear': return echoHear();
      case 'echo-next':
        stopSpeech(); stopAll(); S.playing = false;
        if (S.echo >= story.sentences.length - 1) return go('turn');
        S.echo++; return refresh('[data-act="echo-next"]');
      case 'echo-prev': stopSpeech(); stopAll(); S.playing = false; S.echo = Math.max(0, S.echo - 1); return refresh('[data-act="echo-next"]');
      case 'say': { const text = b.dataset.text; stopSpeech(); stopAll(); stopSpeech = speak(text, { rate: b.dataset.slow ? 0.55 : 0.8 }); return; }
      case 'turn-start': S.turn.phase = 'running'; S.turn.startedAt = Date.now(); S.card = null; return refresh('[data-act="turn-done"]');
      case 'turn-done': S.turn.seconds = (Date.now() - S.turn.startedAt) / 1000; S.turn.phase = 'marking'; return refresh('#rd-h');
      case 'tool': S.turn.tool = b.dataset.tool; return refresh(`[data-tool="${b.dataset.tool}"]`);
      case 'turn-save': return saveReading();
      case 'turn-redo': S.turn = fresh().turn; return refresh('#rd-h');
      case 'turn-again': S.turn = fresh().turn; return refresh('#rd-h');
      case 'answer': return answer(b.dataset.id, Number(b.dataset.k));
      case 'event': return pickEvent(b.dataset.c);
      case 'restart': S = fresh(); return render();
      default:
    }
  }, { signal });

  render(false);
}
