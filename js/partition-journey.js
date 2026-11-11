// Lesson 7-1 learning journey controller: taps, keys, focus and the in-tab record of independent and assisted work.
// Nothing is stored or sent; refreshing the page starts over (repository privacy policy).
import { CARDS, JOURNEY, checkBuild, checkCount, partitionKey, newRecord, noteHelp, noteCheck } from './lib/partition-journey.js';
import { journeyCard } from './views/partition-journey.js';

export const journeyState = { at: {}, ui: {}, records: {} };
export function resetJourney() { journeyState.at = {}; journeyState.ui = {}; journeyState.records = {}; }
const rec = (card) => (journeyState.records[card.id] ||= newRecord(card));
const uiFor = (card) => (journeyState.ui[card.id] ||= {});

/** A section is done when its examples were watched, its questions answered correctly and its writing finished. */
export function stageDone(id, state = journeyState) {
  return CARDS[id].every((c) => (c.type === 'demo' ? state.records[c.id]?.viewed : c.graded ? state.records[c.id]?.correct : c.type === 'write' ? state.records[c.id]?.written : true));
}
export const doneStages = (state = journeyState) => new Set(JOURNEY.map((s) => s.id).filter((id) => stageDone(id, state)));

/** Applies one action to the journey state. Separate from the DOM so it can be tested directly. */
export function act(stageId, action, data = {}, state = journeyState) {
  const cards = CARDS[stageId], at = Math.min(state.at[stageId] || 0, cards.length - 1), card = cards[at];
  const ui = (state.ui[card.id] ||= {}), r = (state.records[card.id] ||= newRecord(card));
  const reset = () => { ui.result = null; ui.say = ''; ui.ok = false; ui.checked = false; };
  switch (action) {
    case 'next': state.at[stageId] = Math.min(cards.length - 1, at + 1); return { focus: '#stage-h' };
    case 'prev': state.at[stageId] = Math.max(0, at - 1); return { focus: '#stage-h' };
    case 'goto': state.at[stageId] = Math.max(0, Math.min(cards.length - 1, Number(data.index) || 0)); return { focus: '#stage-h' };
    case 'point': {
      const id = data.id;
      if (ui.selected && ui.selected !== id) {
        ui.lines ||= [];
        const k = ui.lines.findIndex((l) => l.includes(ui.selected) && l.includes(id));
        if (k < 0) ui.lines.push([ui.selected, id]); else ui.lines.splice(k, 1);
        ui.selected = null; reset();
        return { focus: `[data-point="${id}"]`, say: k < 0 ? 'Line drawn.' : 'Line erased.' };
      }
      ui.selected = ui.selected === id ? null : id;
      return { focus: `[data-point="${id}"]`, say: ui.selected ? 'Point chosen. Now choose where the line ends.' : 'Point not chosen.' };
    }
    case 'undo': (ui.lines ||= []).pop(); ui.selected = null; reset(); return { focus: ui.lines.length ? '[data-j="undo"]' : '[data-j="check"]', say: 'Last line removed.' };
    case 'clear': ui.lines = []; ui.selected = null; reset(); return { focus: '[data-j="check"]', say: 'All lines removed.' };
    case 'choice': ui.choice = data.values; reset(); return { quiet: true };
    case 'num': case 'name': ui[action] = data.value; reset(); return { quiet: true };
    case 'region': { ui.counted ||= []; const k = ui.counted.indexOf(data.index); if (k < 0) ui.counted.push(data.index); else ui.counted.splice(k, 1); return { focus: `[data-region="${data.index}"]`, say: `${ui.counted.length} counted.` }; }
    case 'recount': ui.counted = []; return { focus: '[data-region="0"]', say: 'Count again from zero.' };
    case 'piece': { ui.shown ||= []; const k = ui.shown.indexOf(data.index); if (k < 0) ui.shown.push(data.index); else ui.shown.splice(k, 1); return { focus: `[data-piece="${data.index}"]` }; }
    case 'units': ui.units = ui.units === false; return { focus: '[data-j="units"]' };
    case 'parts': ui.parts = Number(data.parts); r.viewed = true; return { focus: `[data-parts="${data.parts}"]` };
    case 'demo-next': case 'demo-back': case 'demo-restart': {
      ui.step = action === 'demo-restart' ? 0 : Math.max(0, Math.min(card.steps.length - 1, (ui.step || 0) + (action === 'demo-next' ? 1 : -1)));
      if (ui.step === card.steps.length - 1) r.viewed = true;
      return { focus: ui.step === card.steps.length - 1 ? '[data-j="demo-back"]' : `[data-j="${action === 'demo-restart' ? 'demo-next' : action}"]` };
    }
    case 'text': ui.text = data.text; if (ui.compared) { ui.review = {}; r.reviewed = false; } return { quiet: true };
    case 'compare': if (!String(ui.text || '').trim()) { ui.say = 'Write your own answer first.'; return { focus: '[data-j-text]', say: ui.say }; } ui.compared = true; r.written = true; return { focus: '.j-compare', say: 'Here is an example answer. Compare it with yours.' };
    case 'review': ui.review ||= {}; ui.review[data.index] = data.checked; r.reviewed = card.checks.every((_, i) => ui.review[i]); return { quiet: true };
    case 'help': ui.help ||= { open: false, level: 0, step: 0 }; ui.help.open = !ui.help.open; return { focus: ui.help.open ? '[data-help-heading]' : '[data-j="help"]' };
    case 'hint': ui.help = { open: true, level: Math.max(1, ui.help?.level || 0), step: ui.help?.step || 0 }; noteHelp(r, 1); return { focus: '[data-help-heading]', say: 'Hint shown.' };
    case 'steps': ui.help = { open: true, level: Math.max(2, ui.help.level), step: 0 }; noteHelp(r, 2); return { focus: '[data-help-heading]', say: 'Step 1 shown.' };
    case 'next-help': ui.help.step = (ui.help.step || 0) + 1; return { focus: '[data-j="next-help"], [data-j="answer"]', say: `Step ${ui.help.step + 1} shown.` };
    case 'answer': ui.help = { ...ui.help, open: true, level: 3 }; noteHelp(r, 3); return { focus: '[data-help-heading]', say: 'Answer shown. Your own work is still there.' };
    case 'close-help': if (ui.help) ui.help.open = false; return { focus: '[data-j="help"]' };
    case 'check': return check(card, ui, r, state);
    default: return { quiet: true };
  }
}

function check(card, ui, r, state) {
  const done = (ok, say, key) => {
    // Checking the same unchanged answer again is not a new try.
    if (key !== undefined && key === ui.lastKey && ui.checked) return { focus: '[data-j="check"]', say: ui.say };
    ui.lastKey = key; ui.ok = ok; ui.say = say; ui.checked = true; noteCheck(r, ok);
    return { focus: '[data-j="check"]', say: `${ok ? 'Yes!' : 'Not yet.'} ${say}` };
  };
  if (card.type === 'build') {
    const lines = ui.lines || [];
    if (!lines.length) { ui.say = 'Draw at least one line first. Tap one dot, then another dot.'; ui.ok = false; ui.checked = false; return { focus: '[data-j="check"]', say: ui.say }; }
    const result = checkBuild(card.task, lines); ui.result = result;
    const key = JSON.stringify(lines.map((l) => [...l].sort()).sort());
    if (result.valid && card.different) {
      const first = state.ui[card.different]?.solvedKey;
      if (first && partitionKey(card.task, lines) === first) { ui.result = { ...result, valid: false }; return done(false, 'These are equal parts, but it is the same way as your first answer. Find a different way to make fourths.', key); }
    }
    if (result.valid) { if (card.task.shape === 'polygon') ui.solvedKey = partitionKey(card.task, lines); return done(true, card.task.why, key); }
    if (result.count === card.task.count) return done(false, `You made ${result.count} parts, but they are not all the same size. The part marked “bigger” covers more space than the part marked “smaller”. Change a line and check again.`, key);
    return done(false, result.message.replace(/ A line must finish.*$/, '') + (result.count < card.task.count ? ' A line has to go all the way across a part to split it.' : ''), key);
  }
  if (card.type === 'count') {
    const res = checkCount(card, ui.num, ui.name);
    if (res.incomplete) { ui.say = res.message; ui.ok = false; return { focus: '[data-j="check"]', say: res.message }; }
    return done(res.valid, res.message.replace(/^Yes! /, ''), `${ui.num}|${ui.name}`);
  }
  // choice and area questions
  const picked = ui.choice || [];
  if (!picked.length) { ui.say = 'Choose an answer first.'; ui.ok = false; ui.checked = false; return { focus: '[data-j="check"]', say: ui.say }; }
  if (card.type === 'area') { const o = card.options.find((x) => x.value === picked[0]); return done(Boolean(o.correct), o.why, picked[0]); }
  const right = card.options.map((o, i) => (o.correct ? String(i) : null)).filter((x) => x !== null);
  const ok = picked.length === right.length && picked.every((p) => right.includes(p));
  const wrong = picked.filter((p) => !right.includes(p)).map((p) => card.options[p].why);
  const missing = right.filter((p) => !picked.includes(p));
  const say = ok ? card.options[right[0]].why + (right.length > 1 ? ' ' + right.slice(1).map((p) => card.options[p].why).join(' ') : '')
    : wrong.length ? wrong.join(' ') : `Some of your answer is right. ${missing.length === 1 ? 'One more choice is also right.' : 'More choices are also right.'}`;
  return done(ok, say, [...picked].sort().join(','));
}

export function mountJourney(app, ctx, signal) {
  const root = app.querySelector('#lesson-stage');
  if (!root) return;
  const stageId = ctx.stage, live = document.getElementById('live');
  let timer = null;
  signal.addEventListener('abort', () => clearTimeout(timer));
  const announce = (text) => { if (!live || !text) return; clearTimeout(timer); live.textContent = ''; timer = setTimeout(() => { live.textContent = text; }, 60); };
  const render = (focus) => {
    root.innerHTML = journeyCard(ctx, stageId, journeyState).s;
    if (!window.speechSynthesis) root.querySelectorAll('.read').forEach((b) => b.remove());
    if (!focus) return;
    const el = root.querySelector(focus);
    if (el) el.focus({ preventScroll: !focus.startsWith('#stage-h') && !focus.includes('help') && focus !== '.j-compare' });
    if (focus === '#stage-h') root.querySelector('.j-head')?.scrollIntoView({ block: 'start' });
  };
  const run = (action, data) => {
    const out = act(stageId, action, data);
    if (out.quiet) return;
    render(out.focus);
    announce(out.say);
  };
  const cardEl = () => root.querySelector('[data-card]');
  root.addEventListener('click', (e) => {
    const p = e.target.closest('[data-point]'); if (p) return run('point', { id: p.dataset.point });
    const g = e.target.closest('[data-region]'); if (g) return run('region', { index: Number(g.dataset.region) });
    const piece = e.target.closest('[data-piece]'); if (piece) return run('piece', { index: Number(piece.dataset.piece) });
    const b = e.target.closest('[data-j]'); if (!b || b.disabled) return;
    run(b.dataset.j, { ...b.dataset });
  }, { signal });
  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-point], [data-region], [data-piece]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  }, { signal });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-j-choice]')) run('choice', { values: [...cardEl().querySelectorAll('[data-j-choice]:checked')].map((x) => x.value) });
    else if (t.matches('[data-j-num]')) run('num', { value: t.value });
    else if (t.matches('[data-j-name]')) run('name', { value: t.value });
    else if (t.matches('[data-j-review]')) run('review', { index: Number(t.dataset.jReview), checked: t.checked });
    // Clear stale feedback without re-rendering, so the chosen control keeps focus.
    const fb = root.querySelector('.j-feedback'); if (fb && t.matches('[data-j-choice], [data-j-num], [data-j-name]')) { fb.textContent = ''; fb.className = 'j-feedback'; root.querySelectorAll('.j-option.right, .j-option.wrong').forEach((o) => o.classList.remove('right', 'wrong')); }
  }, { signal });
  root.addEventListener('input', (e) => { if (e.target.matches('[data-j-text]')) { const was = journeyState.ui[cardEl().dataset.card]?.compared; run('text', { text: e.target.value }); if (was) root.querySelectorAll('[data-j-review]').forEach((x) => { x.checked = false; }); } }, { signal });
}
export { uiFor, rec };
