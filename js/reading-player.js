// The Reading Coach for one story: Story Guide, Listen, Read along, Echo read, Your turn (timed, 3 readings),
// Story Map and Questions. Reading aloud uses the voice built into the device; nothing is recorded, stored or sent.
// A reading's numbers live only while this page is open (CLAUDE.md: no student data without an approved design).
import { html } from './lib/html.js';
import { GUIDE, TARGET_WPM, answerKey, checkBlank as matches, formatOf, mapChoices, scoreReading, shuffled, storyPassed, storyTokens, suggestion } from './lib/reading.js';

const STEPS = [
  { id: 'guide', label: 'Story Guide' }, { id: 'listen', label: 'Listen' }, { id: 'along', label: 'Read along' },
  { id: 'echo', label: 'Echo read' }, { id: 'turn', label: 'Your turn' }, { id: 'map', label: 'Story map' },
  { id: 'quiz', label: 'Questions' }, { id: 'done', label: 'All done' }, { id: 'answers', label: 'Answers' },
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
    step: 'guide', keyClues: false, shown: new Set(), slow: false, playing: false, listenPlayed: !canSpeak,
    echo: 0, card: null, tapped: [], readings: [],
    turn: { phase: 'ready', startedAt: 0, seconds: 0, errors: new Set(), stop: null, tool: 'error' },
    answers: {}, events: { picked: [], slips: 0 },
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
  function passage({ only = null, mark = false, big = false, reveal = false } = {}) {
    const rows = tokens.map((sent, si) => (only !== null && only !== si ? '' : html`<span class="rd-sent" data-s="${si}">${sent.map((t) => {
      const cls = ['rd-w'];
      // Clue colours give the answers away, so they appear only in the Answers step at the very end.
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
      ${el ? '' : html`<p class="hint">Saved to My Words for this visit.</p>`}
    </aside>`;
  }

  // ------------------------------------------------------------ steps
  const stepViews = {
    guide() {
      return html`
        <h2 id="rd-h" tabindex="-1">Story Guide: what to look for</h2>
        <p>${story.kind === 'story' ? 'Every story has these parts.' : 'This passage tells facts. Look for these parts.'} Clue words can help you find each one. Clues help, but always think about what the sentence is telling you. You will find the parts yourself, and the answers wait for you at the very end.</p>
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
          <button type="button" class="btn" data-act="slow" aria-pressed="${S.slow}">Speed: ${S.slow ? 'Slow' : 'Normal'}</button>` : ''}</p>
        ${passage()}${wordCard()}`;
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
        <p class="btn-row"><button type="button" class="btn btn-primary" data-act="turn-start">Start reading</button></p>${passage()}${wordCard()}`;
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
    answers: answersView,
    done: doneView,
  };


  /** The Answers step: every question is a tappable row. Tap one to see its answer and where to look in the story. */
  function answersView() {
    const key = answerKey(story);
    const open = (id) => S.shown.has(id);
    const row = (id, title, body, find) => html`<li class="rd-akey"><button type="button" class="rd-reveal" data-act="toggle-key" data-id="${id}" aria-expanded="${open(id)}"><span>${title}</span><span class="rd-plus" aria-hidden="true">${open(id) ? '\u2212' : '+'}</span></button>${open(id) ? html`<div class="rd-apanel">${body}<p class="hint">Look at: <q>${sentenceOf(find)}</q></p></div>` : ''}</li>`;
    const ans = (a) => Array.isArray(a) ? html`<ol>${a.map((x) => html`<li>${x}</li>`)}</ol>` : html`<p><b>${a}</b></p>`;
    const mapRows = key.map.map((m) => row(`m-${m.id}`, html`<b>${m.label}</b>: ${m.format === 'blank' ? m.ask.replace('___', '\u2026') : m.format === 'order' ? 'Put the events in order' : m.ask}`, ans(m.answer), m.find));
    const qRows = key.questions.map((q, i) => row(`q${i}`, `${q.format === 'tf' ? 'True or false: ' : ''}${q.format === 'blank' ? q.ask.replace('___', '\u2026') : q.ask}`, ans(q.answer), q.find));
    return html`<h2 id="rd-h" tabindex="-1">Answers</h2>
      <p>Tap a question to see its answer. Try to remember the answer first!</p>
      <p class="btn-row"><button type="button" class="btn" data-act="key-all">${S.shown.size ? 'Hide all the answers' : 'Show all the answers'}</button>
        <button type="button" class="btn" data-act="key-clues" aria-pressed="${S.keyClues}">Clue words in the story: ${S.keyClues ? 'On' : 'Off'}</button></p>
      ${S.keyClues ? legend() : ''}${passage({ reveal: S.keyClues })}${wordCard()}
      <h3>Story map</h3><ul class="rd-key">${mapRows}</ul>
      <h3>Questions</h3><ul class="rd-key">${qRows}</ul>`;
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const markCount = () => {
    const t = S.turn;
    return `Missed words: ${t.errors.size}.${t.stop !== null ? ` Stopped at word ${t.stop + 1} of ${total}.` : ''}`;
  };

  // ------------------------------------------------------------ questions: choose, true or false, fill in, say it
  /** One question or map item as the page needs it: how it is answered, what is right and where to look. */
  function describe(id) {
    if (id.startsWith('m-')) {
      const key = id.slice(2), g = guide.find((e) => e.id === key), m = story.elements[key], f = formatOf(m);
      if (f === 'blank') return { id, fmt: 'blank', ask: m.text, accept: m.accept, blank: m.blank, find: m.find };
      if (f === 'say') return { id, fmt: 'say', ask: g.ask, model: m.answer, find: m.find };
      const mc = mapChoices(m, key.length + 3);
      return { id, fmt: 'choice', ask: g.ask, choices: mc.choices, right: mc.answer, find: m.find };
    }
    const q = story.questions[Number(id.slice(1))], f = formatOf(q);
    if (f === 'tf') return { id, fmt: 'tf', ask: q.ask, choices: ['True', 'False'], right: q.answer ? 0 : 1, find: q.find };
    if (f === 'blank') return { id, fmt: 'blank', ask: q.ask, accept: q.accept, blank: q.blank, find: q.find };
    if (f === 'say') return { id, fmt: 'say', ask: q.ask, model: q.answer, find: q.find };
    return { id, fmt: 'choice', ask: q.ask, choices: q.choices, right: q.answer, find: q.find };
  }
  function choiceButtons(id, choices, st) {
    return html`<div class="rd-choices" role="group" aria-label="Answers">${choices.map((c, k) => {
      const picked = st?.tried?.includes(k);
      const cls = st?.done && st.right === k ? ' is-right' : picked ? ' is-wrong' : '';
      return html`<button type="button" class="rd-choice${cls}" data-act="answer" data-id="${id}" data-k="${k}"${st?.done ? ' disabled' : ''}>${c}</button>`;
    })}</div>`;
  }
  function feedbackHtml(d, st) {
    if (!st || d.fmt === 'say') return '';
    if (st.done) return html`<p class="rd-fb ok" role="status">Yes! That is right.</p>`;
    const missed = d.fmt === 'blank' ? st.wrong : st.tried?.length;
    if (!missed) return '';
    return html`<p class="rd-fb no" role="status">Not yet. Look at this sentence: <q>${sentenceOf(d.find)}</q> Then try again.${d.fmt === 'blank' && st.wrong >= 2 ? html` Hint: it starts with \u201c${d.blank[0]}\u201d.` : ''}</p>`;
  }
  function itemHtml(d) {
    const st = S.answers[d.id];
    if (d.fmt === 'choice' || d.fmt === 'tf') {
      return html`<p class="rd-qask">${d.fmt === 'tf' ? html`<span class="rd-tf">True or false:</span> ` : ''}${d.ask}</p>${choiceButtons(d.id, d.choices, st ? { ...st, right: d.right } : null)}${feedbackHtml(d, st)}`;
    }
    if (d.fmt === 'blank') {
      const [before, after] = d.ask.split('___'), done = st?.done;
      return html`<p class="rd-qask rd-blankline">${before}<input type="text" class="rd-blank${done ? ' is-right' : ''}" id="in-${d.id}" data-id="${d.id}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Fill in the blank"${done ? html` value="${st.value}" disabled` : ''}>${after}</p>
        ${done ? '' : html`<p class="btn-row"><button type="button" class="btn" data-act="check-blank" data-id="${d.id}">Check</button></p>`}${feedbackHtml(d, st)}`;
    }
    return html`<p class="rd-qask">${d.ask}</p>${st?.shown ? html`<div class="rd-model"><p><b>A good answer:</b> ${d.model}</p><p class="hint">Look at: <q>${sentenceOf(d.find)}</q></p>
      ${st.done ? html`<p class="rd-fb ${st.first ? 'ok' : 'no'}" role="status">${st.first ? 'Great thinking!' : 'Keep practicing. You will get it.'}</p>`
        : html`<p>Did you say something like this?</p><p class="btn-row"><button type="button" class="btn btn-primary" data-act="say-grade" data-id="${d.id}" data-ok="1">I got it</button><button type="button" class="btn" data-act="say-grade" data-id="${d.id}" data-ok="0">Not yet</button></p>`}</div>`
      : html`<p class="hint">Say your answer out loud to a grown-up, or write it down. Then check it.</p><p class="btn-row"><button type="button" class="btn" data-act="say-show" data-id="${d.id}">Show a good answer</button></p>`}`;
  }
  function questions(list) {
    return html`<ol class="rd-qs">${list.map((q) => html`<li class="rd-q">${itemHtml(describe(`q${q.i}`))}</li>`)}</ol>`;
  }

  // ------------------------------------------------------------ story map
  function mapCard(e) {
    if (e.id === 'events') {
      const m = story.elements.events, ev = S.events, done = ev.picked.length === 3;
      const cards = shuffled(m.order, 5);
      return html`<li class="rd-mcard el-${e.id}"><h3>${e.label}</h3><p class="rd-ask">${e.ask}</p>
        <p class="hint">Tap the events in order: first, next, last.</p>
        <div class="rd-choices">${cards.map((c) => {
          const pos = ev.picked.indexOf(c);
          return html`<button type="button" class="rd-choice${pos >= 0 ? ' is-right' : ''}" data-act="event" data-c="${c}"${pos >= 0 ? ' disabled' : ''}>${pos >= 0 ? html`<b>${pos + 1}.</b> ` : ''}${c}</button>`;
        })}</div>
        ${done ? html`<p class="rd-fb ok" role="status">Yes! That is the right order.</p>` : ev.slips ? html`<p class="rd-fb no" role="status">Not yet. Look at this sentence: <q>${sentenceOf(m.find)}</q> Then try again.</p>` : ''}</li>`;
    }
    return html`<li class="rd-mcard el-${e.id}"><h3>${e.label}</h3>${itemHtml(describe(`m-${e.id}`))}</li>`;
  }
  const rightFirst = (id) => S.answers[id]?.done && S.answers[id].first;
  const mapStats = () => {
    const ids = guide.map((e) => e.id);
    const right = ids.filter((id) => (id === 'events' ? S.events.picked.length === 3 && S.events.slips === 0 : rightFirst(`m-${id}`))).length;
    return { right, total: ids.length };
  };
  const quizStats = () => ({ right: quizQs.filter((q) => rightFirst(`q${q.i}`)).length, total: quizQs.length });

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
    return html`<h2 id="rd-h" tabindex="-1">${passed ? 'Story complete!' : 'Keep going!'}</h2>
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
      <p class="btn-row"><button type="button" class="btn" data-act="go" data-step="answers">Check the answers</button>
        <a class="btn btn-primary" href="${ctx.link('reading')}">All stories</a>
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
    // Words already typed into other blanks stay put when one question redraws.
    const typed = [...stage.querySelectorAll('.rd-blank:not([disabled])')].map((i) => [i.id, i.value]);
    box.innerHTML = stepViews[S.step]().s;
    for (const [id, v] of typed) { const el = stage.querySelector(`#${CSS.escape(id)}`); if (el) el.value = v; }
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
    S.step = step; S.card = null; if (step !== 'answers') { S.keyClues = false; S.shown = new Set(); }
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
    const d = describe(id), st = S.answers[id] ||= { tried: [], done: false, first: true };
    if (st.done) return;
    if (k === d.right) st.done = true; else { st.tried.push(k); st.first = false; }
    announce(st.done ? 'Right!' : 'Not yet. Look at the sentence and try again.');
    refresh(`[data-id="${id}"][data-k="${k}"]`);
  }
  function checkBlankItem(id) {
    const d = describe(id), st = S.answers[id] ||= { wrong: 0, done: false, first: true, value: '' };
    if (st.done) return;
    const value = (stage.querySelector(`#in-${id}`)?.value || '').trim();
    if (!value) { announce('Type your answer first.'); return stage.querySelector(`#in-${id}`)?.focus(); }
    if (matches(value, d.accept)) { st.done = true; st.value = value; } else { st.wrong++; st.first = false; }
    announce(st.done ? 'Right!' : 'Not yet. Look at the sentence and try again.');
    refresh(st.done ? `[data-act="next"]` : `#in-${id}`);
  }
  function sayShow(id) { (S.answers[id] ||= { shown: false, done: false, first: true }).shown = true; refresh(`[data-act="say-grade"][data-id="${id}"]`); }
  function sayGrade(id, ok) {
    const st = S.answers[id];
    st.done = true; st.first = ok;
    announce(ok ? 'Great thinking!' : 'Keep practicing.');
    refresh(`[data-act="next"]`);
  }
  function pickEvent(c) {
    const order = story.elements.events.order, ev = S.events;
    if (c === order[ev.picked.length]) ev.picked.push(c); else ev.slips++;
    announce(ev.picked.length === 3 ? 'Right order!' : 'Keep going.');
    refresh();
  }
  function allKeyIds() { return [...guide.map((e) => `m-${e.id}`), ...story.questions.map((_, i) => `q${i}`)]; }

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
    S.card = { key: t.key, text: t.text, el: S.step === 'answers' && S.keyClues ? t.el : null };
    // Words tapped while checking the answers are not unknown words, so they stay out of My Words.
    if (t.key && S.step !== 'answers' && !S.tapped.includes(t.key)) S.tapped.push(t.key);
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
      case 'toggle-key': S.shown.has(b.dataset.id) ? S.shown.delete(b.dataset.id) : S.shown.add(b.dataset.id); return refresh(`[data-id="${b.dataset.id}"]`);
      case 'key-all': S.shown = S.shown.size ? new Set() : new Set(allKeyIds()); return refresh('[data-act="key-all"]');
      case 'key-clues': S.keyClues = !S.keyClues; return refresh('[data-act="key-clues"]');
      case 'check-blank': return checkBlankItem(b.dataset.id);
      case 'say-show': return sayShow(b.dataset.id);
      case 'say-grade': return sayGrade(b.dataset.id, b.dataset.ok === '1');
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

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('.rd-blank')) { e.preventDefault(); checkBlankItem(e.target.dataset.id); }
  }, { signal });

  render(false);
}
