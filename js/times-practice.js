// Times Tables > Pick My Facts (js/views/skills.js draws the page). The child picks one or more facts, then:
//   Flashcards     — tap a card to flip it (4 × 6 / 24);
//   Find the Fact  — see an answer (24) and fill in the two numbers (4 × 6);
//   Quick Quiz     — see a fact (4 × 6) and type the answer.
// A round is 10 facts. Two tries each; a fact missed twice shows its answer and goes on the "Practice these" list.
// Nothing is saved: the choices live only while the page is open.

import { checkFind, factDeck, roundOf, shuffled } from './lib/factpick.js';

const ROUND = 10;

export function mountTimesPractice(app, signal) {
  const root = app.querySelector('#tp');
  const stage = app.querySelector('#tp-stage');
  if (!root || !stage) return;
  const S = { facts: new Set(), max: 10, mode: 'flash', deck: [], i: 0, flipped: false,
    round: [], r: 0, tries: 0, score: 0, missed: [], boxes: [], active: 0, locked: false };
  const facts = () => [...S.facts].sort((a, b) => a - b);
  const factList = () => facts().map((f) => `×${f}`).join(', ');

  function sync() {
    for (const b of root.querySelectorAll('[data-fact]')) b.setAttribute('aria-pressed', String(S.facts.has(Number(b.dataset.fact))));
    for (const b of root.querySelectorAll('[data-max]')) b.setAttribute('aria-pressed', String(Number(b.dataset.max) === S.max));
    for (const b of root.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode));
  }

  function start(list) {
    if (!S.facts.size) { stage.innerHTML = '<p class="tp-empty">Tap a number above to pick a fact.</p>'; return; }
    if (S.mode === 'flash') { S.deck = shuffled(factDeck(S.facts, S.max)); S.i = 0; S.flipped = false; return flash(); }
    S.round = list || roundOf(S.facts, S.max, ROUND);
    S.r = 0; S.score = 0; S.missed = [];
    newQuestion();
  }

  // ------------------------------------------------------------ Flashcards
  function flash() {
    const c = S.deck[S.i], ans = c.a * c.b, last = S.i === S.deck.length - 1;
    stage.innerHTML = `
      <p class="tp-count">Card ${S.i + 1} of ${S.deck.length}</p>
      <button type="button" class="tp-card${S.flipped ? ' is-flipped' : ''}" data-tp="flip"
        aria-label="${S.flipped ? `${c.a} times ${c.b} equals ${ans}. Tap to turn back.` : `${c.a} times ${c.b}. Tap to see the answer.`}">
        <span class="tp-big">${S.flipped ? ans : `${c.a} × ${c.b}`}</span>
        <span class="tp-card-note">${S.flipped ? `${c.a} × ${c.b} = ${ans}` : 'Tap to flip'}</span>
      </button>
      <p class="btn-row center">
        <button type="button" class="btn" data-tp="prev"${S.i === 0 ? ' disabled' : ''}>‹ Back</button>
        <button type="button" class="btn" data-tp="shuffle">Shuffle</button>
        <button type="button" class="btn btn-primary" data-tp="next">${last ? 'Start over' : 'Next ›'}</button>
      </p>`;
  }

  // ------------------------------------------------------------ Find the Fact and Quick Quiz
  function newQuestion() {
    S.tries = 0; S.active = 0; S.locked = false;
    S.boxes = S.mode === 'find' ? ['', ''] : [''];
    question('', '');
  }

  function question(msg, tone, boxTone = '') {
    if (S.r >= S.round.length) return results();
    const q = S.round[S.r], ans = q.a * q.b;
    const box = (k, label) => `<button type="button" class="tp-box${S.mode === 'quiz' ? ' wide' : ''}${!S.locked && S.active === k ? ' is-active' : ''}${boxTone ? ` ${boxTone}` : ''}" data-box="${k}" aria-label="${label}">${S.boxes[k]}</button>`;
    const eq = S.mode === 'find'
      ? `<p class="tp-label">Which fact makes</p><p class="tp-big tp-target">${ans}</p>
         <div class="tp-eq">${box(0, 'First number')}<span class="tp-op">×</span>${box(1, 'Second number')}<span class="tp-op">=</span><span class="tp-num">${ans}</span></div>
         <p class="tp-note">Use your <strong>${factList()}</strong> ${S.facts.size > 1 ? 'facts' : 'fact'}.</p>`
      : `<p class="tp-label">Solve it</p>
         <div class="tp-eq"><span class="tp-num">${q.a}</span><span class="tp-op">×</span><span class="tp-num">${q.b}</span><span class="tp-op">=</span>${box(0, 'Answer')}</div>`;
    stage.innerHTML = `
      <p class="tp-count">Question ${S.r + 1} of ${S.round.length} · ${S.score} right</p>
      ${eq}
      <p class="tp-msg${tone ? ` ${tone}` : ''}" role="status">${msg}</p>
      ${S.locked
        ? `<p class="btn-row center"><button type="button" class="btn btn-primary" data-tp="go">${S.r === S.round.length - 1 ? 'See my score' : 'Next ›'}</button></p>`
        : `<div class="tp-pad" role="group" aria-label="Number pad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="tp-key" data-key="${d}">${d}</button>`).join('')}
            <button type="button" class="tp-key" data-key="del" aria-label="Erase">⌫</button>
            <button type="button" class="tp-key" data-key="0">0</button>
            <button type="button" class="tp-key tp-check" data-key="ok">Check</button>
          </div>`}`;
    if (S.locked) stage.querySelector('[data-tp="go"]')?.focus({ preventScroll: true });
  }

  function paintBoxes() {
    for (const b of stage.querySelectorAll('[data-box]')) {
      const k = Number(b.dataset.box);
      b.textContent = S.boxes[k];
      b.classList.toggle('is-active', !S.locked && k === S.active);
      b.classList.remove('is-wrong');
    }
  }
  function say(text, tone) { const m = stage.querySelector('.tp-msg'); if (m) { m.textContent = text; m.className = `tp-msg${tone ? ` ${tone}` : ''}`; } }

  function press(key) {
    if (S.locked || S.mode === 'flash' || !S.boxes.length) return;
    if (key === 'ok') return check();
    const k = S.active;
    if (key === 'del') {
      if (S.boxes[k] === '' && k > 0) S.active = k - 1; else S.boxes[k] = S.boxes[k].slice(0, -1);
      return paintBoxes();
    }
    if (S.boxes[k].length >= (S.mode === 'quiz' ? 3 : 2)) return;
    if (S.mode === 'find' && S.boxes[k] === '' && key === '0') return;
    S.boxes[k] += key;
    // The first number is done when it is 2 to 9 or has two digits: move on to the second box.
    if (S.mode === 'find' && k === 0 && (S.boxes[0].length === 2 || Number(S.boxes[0]) >= 2)) S.active = 1;
    paintBoxes(); say('', '');
  }

  function check() {
    const q = S.round[S.r], ans = q.a * q.b;
    let result, wrongText = '';
    if (S.mode === 'find') {
      if (S.boxes.some((b) => b === '')) return say('Fill in both boxes.', 'info');
      const [x, y] = S.boxes.map(Number);
      result = checkFind(x, y, ans, S.facts, S.max);
      if (result === 'other') {
        S.boxes = ['', '']; S.active = 0; paintBoxes();
        return say(`Yes, ${x} × ${y} = ${ans}! Now find one that uses ${S.facts.size > 1 ? `one of your facts (${factList()})` : factList()}.`, 'info');
      }
      if (result === 'wrong') wrongText = `${x} × ${y} = ${x * y}, not ${ans}. Try again!`;
    } else {
      if (S.boxes[0] === '') return say('Type your answer first.', 'info');
      result = Number(S.boxes[0]) === ans ? 'right' : 'wrong';
      if (result === 'wrong') wrongText = 'Not quite. Try again!';
    }
    if (result === 'right') {
      if (S.tries === 0) S.score++;
      S.locked = true;
      const shown = S.mode === 'find' ? `${S.boxes[0]} × ${S.boxes[1]} = ${ans}` : `${q.a} × ${q.b} = ${ans}`;
      return question(`${S.tries === 0 ? 'Correct!' : 'Got it!'} ${shown}`, 'ok', 'is-right');
    }
    S.tries++;
    if (S.tries >= 2) {
      S.missed.push(q); S.locked = true;
      S.boxes = S.mode === 'find' ? [String(q.a), String(q.b)] : [String(ans)];
      return question(`${S.mode === 'find' ? 'It is ' : ''}${q.a} × ${q.b} = ${ans}. This one goes on your practice list.`, 'notyet', 'is-shown');
    }
    for (const b of stage.querySelectorAll('[data-box]')) b.classList.add('is-wrong');
    say(wrongText, 'notyet');
    S.boxes = S.boxes.map(() => ''); S.active = 0;
    setTimeout(() => { if (!S.locked) paintBoxes(); }, 700);
  }

  function results() {
    const n = S.round.length;
    const missed = [...new Map(S.missed.map((q) => [`${q.a}x${q.b}`, q])).values()];
    S.boxes = [];
    stage.innerHTML = `
      <p class="tp-label">Your score</p>
      <p class="tp-big tp-score">${S.score} out of ${n}</p>
      <p class="tp-msg ${S.score === n ? 'ok' : 'info'}">${S.score === n ? 'Perfect! Every one on the first try.' : S.score >= n * 0.7 ? 'Nice work! Keep it up.' : 'Good effort. Practice makes it stick.'}</p>
      ${missed.length ? `<p class="tp-label">Practice these</p><ul class="tp-missed">${missed.map((q) => `<li>${q.a} × ${q.b} = ${q.a * q.b}</li>`).join('')}</ul>` : ''}
      <p class="btn-row center">
        ${missed.length ? '<button type="button" class="btn btn-primary" data-tp="redo">Practice the ones I missed</button>' : ''}
        <button type="button" class="btn${missed.length ? '' : ' btn-primary'}" data-tp="again">New round</button>
      </p>`;
    S.redo = missed;
  }

  // ------------------------------------------------------------ Controls
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t || !root.contains(t)) return;
    if (t.dataset.fact) { const n = Number(t.dataset.fact); S.facts.has(n) ? S.facts.delete(n) : S.facts.add(n); sync(); return start(); }
    if (t.dataset.max) { S.max = Number(t.dataset.max); sync(); return start(); }
    if (t.dataset.mode) { S.mode = t.dataset.mode; sync(); return start(); }
    if (t.dataset.box) { if (!S.locked) { S.active = Number(t.dataset.box); paintBoxes(); } return; }
    if (t.dataset.key) return press(t.dataset.key);
    switch (t.dataset.tp) {
      case 'all': for (let n = 1; n <= 12; n++) S.facts.add(n); sync(); return start();
      case 'clear': S.facts.clear(); sync(); return start();
      case 'flip': S.flipped = !S.flipped; flash(); return stage.querySelector('.tp-card')?.focus({ preventScroll: true });
      case 'prev': if (S.i > 0) { S.i--; S.flipped = false; flash(); } return;
      case 'next': S.i = S.i === S.deck.length - 1 ? 0 : S.i + 1; S.flipped = false; return flash();
      case 'shuffle': S.deck = shuffled(S.deck); S.i = 0; S.flipped = false; return flash();
      case 'go': S.r++; return newQuestion();
      case 'again': return start();
      case 'redo': return start(shuffled(S.redo || []));
      default:
    }
  }, { signal });

  // Typing on a computer: digits, Backspace, Enter; Tab or the arrow keys move between the two boxes.
  document.addEventListener('keydown', (e) => {
    if (S.mode === 'flash' || S.locked || !S.boxes.length || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('select, input, textarea')) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
    else if (e.key === 'Enter' && !e.target.closest?.('a, button:not(.tp-box):not(.tp-key)')) { e.preventDefault(); press('ok'); }
    else if (S.mode === 'find' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); S.active = e.key === 'ArrowRight' ? 1 : 0; paintBoxes(); }
  }, { signal });

  sync();
  start();
}
