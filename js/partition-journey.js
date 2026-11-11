// Lesson 7-1 learning journey controller: taps, keys, focus and the record of independent and assisted work.
// Progress is saved in this browser only (DECISIONS D29, js/lib/journey-store.js) and never sent anywhere.
import { CARDS, JOURNEY, ALL_CARDS, checkBuild, checkCount, partitionKey, onSameEdge, unequalTip, newRecord, noteHelp, noteCheck } from './lib/partition-journey.js';
import { STORE_KEY, loadProgress, saveProgress, clearProgress } from './lib/journey-store.js';
import { journeyCard, journeySummary } from './views/partition-journey.js';

export const journeyState = { stage: null, at: {}, ui: {}, records: {} };
export function resetJourney() { journeyState.stage = null; journeyState.at = {}; journeyState.ui = {}; journeyState.records = {}; }
/** Restores saved progress into the journey (pictures of checked constructions are recomputed, not stored). */
export function restoreJourney(saved = loadProgress()) {
  resetJourney();
  if (!saved) return false;
  Object.assign(journeyState, { stage: saved.stage, at: saved.at, ui: saved.ui, records: saved.records });
  for (const c of ALL_CARDS) {
    const ui = journeyState.ui[c.id];
    if (c.type === 'build' && ui?.checked && ui.lines?.length) { const r = checkBuild(c.task, ui.lines); ui.result = !ui.ok && r.valid ? { ...r, valid: false } : r; }
  }
  return true;
}
export const saveJourney = () => saveProgress(journeyState);
/** Grown-up reset: erases this browser's saved Lesson 7-1 progress and the progress on screen. */
export function eraseJourney() { clearProgress(); resetJourney(); }
/** Where "Lesson 7-1" should open: the section the child was last in, or section A. */
export const resumeStage = () => (journeyState.stage && journeyState.stage !== 'parent' && CARDS[journeyState.stage] ? journeyState.stage : JOURNEY[0].id);
restoreJourney();
// Another open tab saved or erased Lesson 7-1 progress: adopt it, so tabs never overwrite each other
// and a grown-up's Reset cannot be undone by a tab left open.
const listeners = new Set();
export const onJourneyChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
globalThis.addEventListener?.('storage', (e) => { if (e.key === null || e.key === STORE_KEY) { restoreJourney(); listeners.forEach((fn) => fn()); } });
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
      const id = data.id; ui.cursor = id;
      if (ui.selected && ui.selected !== id) {
        ui.lines ||= [];
        if (onSameEdge(card.task, ui.selected, id)) { ui.selected = null; reset(); ui.say = 'That line would sit on the edge of the shape. Pick a dot on a different side.'; return { focus: `[data-point="${id}"]`, say: ui.say }; }
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
      // Compare with the child's first answer, or with the taught Way 1 if the first card was skipped.
      const first = state.ui[card.different]?.solvedKey || partitionKey(card.task, card.task.solutions[0]);
      if (first && partitionKey(card.task, lines) === first) { ui.result = { ...result, valid: false }; return done(false, 'These are equal parts, but it is the same way as your first answer. Find a different way to make fourths.', key); }
    }
    if (result.valid) { if (card.task.shape === 'polygon') ui.solvedKey = partitionKey(card.task, lines); return done(true, card.task.why, key); }
    const n = result.count, want = card.task.count;
    if (n === want && result.areas.length) return done(false, `You made ${n} parts, but they are not all the same size. Compare the parts marked “bigger” and “smaller”. ${unequalTip(card.task)}`, key);
    if (card.task.shape === 'circle' && !result.areas.length) return done(false, `That line does not go through the center. ${unequalTip(card.task)}`, key);
    if (n < want) return done(false, `You made ${n} part${n === 1 ? '' : 's'}. We need ${want} equal parts. A line must go all the way across the shape, or to another line, to split it.`, key);
    return done(false, `You made ${n} parts. We need ${want} equal parts. Use Undo to take a line away.`, key);
  }
  if (card.type === 'count') {
    const res = checkCount(card, ui.num, ui.name);
    if (res.incomplete) { ui.say = res.message; ui.ok = false; return { focus: '[data-j="check"]', say: res.message }; }
    return done(res.valid, res.message.replace(/^Yes! /, ''), `${ui.num}|${ui.name}`);
  }
  // choice and area questions
  const valid = new Set(card.options.map((o, i) => (card.type === 'area' ? o.value : String(i))));
  const picked = (ui.choice || []).filter((v) => valid.has(v));
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
  journeyState.stage = stageId; saveJourney();
  // Another tab changed progress: redraw quietly (no focus move, no scrolling).
  const off = onJourneyChange(() => { if (!root.isConnected) return; journeyState.stage ||= stageId; render(null); });
  signal.addEventListener('abort', off);
  const run = (action, data) => {
    const out = act(stageId, action, data);
    journeyState.stage = stageId; saveJourney();
    if (out.quiet) return;
    render(out.focus);
    // After Check, make sure the result is on screen (short Chromebook screens).
    if (action === 'check') root.querySelector('.j-feedback')?.scrollIntoView({ block: 'nearest' });
    // Help: read out the newest help text itself, and put focus on it.
    if (['hint', 'steps', 'next-help', 'answer'].includes(action)) {
      const block = [...root.querySelectorAll('.j-help-block')].pop();
      if (block) { block.setAttribute('tabindex', '-1'); block.focus({ preventScroll: false }); announce([...block.children].map((c) => c.textContent.trim()).filter(Boolean).join('. ')); return; }
    }
    announce(out.say);
  };
  const cardEl = () => root.querySelector('[data-card]');
  root.addEventListener('click', (e) => {
    // Pointer taps on dots are handled by the press-preview-lift code below; clicks here come from the keyboard.
    // (A click with no pointer press just before it, e.g. from a screen reader or switch access, still works.)
    const p = e.target.closest('[data-point]'); if (p) { if (e.detail === 0 || Date.now() - lastLift > 600) run('point', { id: p.dataset.point }); return; }
    const g = e.target.closest('[data-region]'); if (g) return run('region', { index: Number(g.dataset.region) });
    const piece = e.target.closest('[data-piece]'); if (piece) return run('piece', { index: Number(piece.dataset.piece) });
    const b = e.target.closest('[data-j]'); if (!b || b.disabled) return;
    run(b.dataset.j, { ...b.dataset });
  }, { signal });
  root.addEventListener('keydown', (e) => {
    if (e.target.matches?.('[data-point]') && e.key.startsWith('Arrow')) { e.preventDefault(); moveFocus(e.target, e.key); return; }
    if (e.key === 'Escape' && root.querySelector('.j-help')) { e.preventDefault(); run('close-help'); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-point], [data-region], [data-piece]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  }, { signal });
  // Choosing a dot: a press anywhere on the drawing picks the nearest dot (no gaps, no overlaps) and rings it;
  // sliding moves the ring; lifting chooses it. A scroll gesture cancels. Taps far from every dot do nothing.
  const REACH = 48; // CSS pixels from a dot's center
  let pending = null, lastLift = 0;
  const svgOf = (e) => e.target.closest?.('svg[data-build]');
  const nearest = (svg, e) => {
    const m = svg.getScreenCTM(); if (!m) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(m.inverse()), scale = Math.hypot(m.a, m.b) || 1;
    let best = null, bd = Infinity;
    for (const g of svg.querySelectorAll('[data-point]')) { const c = g.querySelector('.dot'), d = Math.hypot(c.cx.baseVal.value - q.x, c.cy.baseVal.value - q.y); if (d < bd) { bd = d; best = g; } }
    return best && bd * scale <= REACH ? best : null;
  };
  const show = (svg, g, cls) => {
    svg.querySelectorAll(`.j-point.${cls}`).forEach((x) => { if (x !== g) x.classList.remove(cls); });
    if (g) g.classList.add(cls);
    if (cls === 'preview') { const out = root.querySelector('[data-j-preview]'); if (out) out.textContent = g ? g.getAttribute('aria-label') : '\u00a0'; }
  };
  root.addEventListener('pointerdown', (e) => {
    const svg = svgOf(e); if (!svg || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const g = nearest(svg, e); if (!g) { pending = null; return; }
    pending = { svg, id: e.pointerId, g, t: Date.now() }; show(svg, g, 'preview');
    try { svg.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
  }, { signal });
  root.addEventListener('pointermove', (e) => {
    const svg = pending?.svg || svgOf(e); if (!svg) return;
    const g = nearest(svg, e);
    if (pending && e.pointerId === pending.id) { pending.g = g; show(svg, g, 'preview'); } // off every dot: lifting chooses nothing
    else if (e.pointerType === 'mouse') show(svg, g, 'near');
  }, { signal });
  const finish = (e, commit) => {
    if (!pending || e.pointerId !== pending.id) return;
    const { svg, g } = pending; pending = null; lastLift = Date.now(); show(svg, null, 'preview');
    if (commit && g) run('point', { id: g.dataset.point });
  };
  root.addEventListener('pointerup', (e) => finish(e, true), { signal });
  // Touch: a quick swipe scrolls the page as usual; a finger held still for a moment, then slid, adjusts the ring
  // in any direction instead of scrolling.
  root.addEventListener('touchmove', (e) => { if (pending && e.cancelable && Date.now() - pending.t >= 150) e.preventDefault(); }, { signal, passive: false });
  root.addEventListener('pointercancel', (e) => finish(e, false), { signal });
  // If the page scrolls during a press, it was a scroll, not a choice (some browsers report the cancel late).
  window.addEventListener('scroll', () => { if (pending) { show(pending.svg, null, 'preview'); pending = null; } }, { signal, passive: true });
  // Arrow keys move between dots: to the closest dot in that direction.
  const moveFocus = (from, key) => {
    const svg = from.ownerSVGElement, dot = (g) => { const c = g.querySelector('.dot'); return [c.cx.baseVal.value, c.cy.baseVal.value]; };
    const [x, y] = dot(from), dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[key];
    let best = null, score = Infinity;
    for (const g of svg.querySelectorAll('[data-point]')) {
      if (g === from) continue;
      const [gx, gy] = dot(g), dx = gx - x, dy = gy - y, along = dx * dir[0] + dy * dir[1], across = Math.abs(dx * dir[1] - dy * dir[0]);
      if (along <= 0.5) continue;
      const sc = along + 3 * across; if (sc < score) { score = sc; best = g; }
    }
    if (!best) return;
    svg.querySelectorAll('[data-point]').forEach((g) => g.setAttribute('tabindex', g === best ? '0' : '-1'));
    best.focus();
    const card = cardEl()?.dataset.card; if (card) (journeyState.ui[card] ||= {}).cursor = best.dataset.point;
  };
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

/** Grown-up Summary: Reset Lesson 7-1 progress, with an on-page confirmation step. */
export function mountJourneyReset(app, ctx, signal) {
  const live = document.getElementById('live');
  app.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !app.querySelector('[data-j-reset-confirm]')?.hidden) app.querySelector('[data-j-reset="no"]')?.click(); }, { signal });
  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-j-reset]'); if (!b) return;
    const box = app.querySelector('[data-j-reset-box]'), ask = box?.querySelector('[data-j-reset-ask]'), confirm = box?.querySelector('[data-j-reset-confirm]');
    if (!box) return;
    if (b.dataset.jReset === 'ask') { ask.hidden = true; confirm.hidden = false; confirm.querySelector('[data-j-reset="no"]').focus(); return; }
    if (b.dataset.jReset === 'no') { confirm.hidden = true; ask.hidden = false; ask.querySelector('button').focus(); return; }
    eraseJourney();
    const summary = app.querySelector('.j-summary');
    if (summary) summary.outerHTML = journeySummary(ctx, journeyState).s;
    app.querySelectorAll('.j-stepper li.done').forEach((li) => li.classList.remove('done'));
    app.querySelector('#j-sum-h')?.focus();
    if (live) { live.textContent = ''; setTimeout(() => { live.textContent = 'Lesson 7-1 progress erased. The lesson will start again at section A.'; }, 60); }
  }, { signal });
}
