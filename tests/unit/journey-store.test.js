// Lesson 7-1 saved progress (DECISIONS D29): one key, local only, validated on the way back in, erasable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STORE_KEY, STORE_VERSION, loadProgress, saveProgress, clearProgress } from '../../js/lib/journey-store.js';
import { act, journeyState, resetJourney, restoreJourney, saveJourney, eraseJourney, resumeStage } from '../../js/partition-journey.js';
import { CARDS, JOURNEY, newRecord, outcome } from '../../js/lib/partition-journey.js';

const fake = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const draw = (stage, lines) => { for (const [a, b] of lines) { act(stage, 'point', { id: a }); act(stage, 'point', { id: b }); } };
const idx = (stage, id) => CARDS[stage].findIndex((c) => c.id === id);
function doneRecord(c) { const r = newRecord(c); r.viewed = true; if (c.type === 'write') r.written = true; else if (c.type !== 'demo') { r.attempts = 1; r.first = 'correct'; r.correct = true; } return r; }
/** Finish everything before a card (earlier sections and earlier cards), as a child would, without resetting. */
function finishBefore(stage, id) {
  for (const s of JOURNEY) { if (s.id === stage) break; for (const c of CARDS[s.id]) journeyState.records[c.id] ||= doneRecord(c); }
  const k = idx(stage, id); for (const c of CARDS[stage].slice(0, k)) journeyState.records[c.id] ||= doneRecord(c);
  journeyState.at[stage] = k;
}

test('save and load round-trip: section, card, drawings, answers, writing, help, re-learning and independent vs assisted records', () => {
  const s = fake();
  resetJourney();
  journeyState.stage = 'shapes';
  finishBefore('explore', 'a-flags'); act('explore', 'choice', { values: ['1', '2'] });          // answer chosen, not checked
  finishBefore('shapes', 'd-diamond-guide'); draw('shapes', [['v0', 'v2'], ['v1', 'v3']]); act('shapes', 'check'); // We Do: first try
  finishBefore('shapes', 'd-square-guide'); act('shapes', 'help'); act('shapes', 'hint');                         // We Do with a hint
  draw('shapes', [['l2-6', 'r2-6'], ['l4-6', 'r4-6'], ['t1-2', 'b1-2']]); act('shapes', 'check');
  finishBefore('shapes', 'd-square-myturn'); draw('shapes', [['t1-3', 'b1-3']]); act('shapes', 'check'); draw('shapes', [['t2-3', 'b2-3']]); act('shapes', 'check'); // You Do: 2 misses → re-learn
  finishBefore('sizes', 'e-write'); act('sizes', 'text', { text: 'More parts make each part smaller.' }); act('sizes', 'compare');
  journeyState.stage = 'shapes';
  assert.equal(saveProgress(journeyState, s), true);
  assert.deepEqual([...s.m.keys()], [STORE_KEY], 'exactly one key');
  const raw = s.m.get(STORE_KEY);
  assert.equal(JSON.parse(raw).v, STORE_VERSION);
  assert.doesNotMatch(raw, /"name":"(?!fourths|sixths|eighths|thirds)/, 'no personal fields');
  const back = loadProgress(s);
  assert.equal(back.stage, 'shapes'); assert.equal(back.at.shapes, idx('shapes', 'd-square-myturn'));
  assert.deepEqual(back.ui['d-diamond-guide'].lines, [['v0', 'v2'], ['v1', 'v3']]);
  assert.deepEqual(back.ui['a-flags'].choice, ['1', '2']);
  assert.equal(back.ui['e-write'].text, 'More parts make each part smaller.'); assert.equal(back.ui['e-write'].compared, true);
  assert.equal(outcome(back.records['d-diamond-guide']), 'independent');
  assert.equal(outcome(back.records['d-square-guide']), 'after-hint');
  assert.equal(back.records['d-square-myturn'].relearn, true); assert.equal(back.records['d-square-myturn'].wrongStreak, 2);
  assert.equal(back.ui['d-square-guide'].help.level, 1); assert.equal(back.ui['d-square-guide'].help.open, false, 'help panel reopens closed');
});

test('restoring recomputes the picture of a checked construction, a re-saved state is identical, and Lesson 7-1 resumes', () => {
  const s = fake();
  resetJourney(); finishBefore('method', 'b-fourths-make'); journeyState.stage = 'method';
  draw('method', [['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']]); act('method', 'check');   // unequal, marked
  const before = journeyState.ui['b-fourths-make'].result;
  saveProgress(journeyState, s);
  restoreJourney(loadProgress(s));
  const after = journeyState.ui['b-fourths-make'].result;
  assert.equal(after.valid, false); assert.equal(after.count, 4); assert.equal(after.big, before.big); assert.equal(after.small, before.small);
  const s2 = fake(); saveProgress(journeyState, s2); assert.equal(s2.m.get(STORE_KEY), s.m.get(STORE_KEY));
  assert.equal(resumeStage(), 'method', 'opening Lesson 7-1 goes to the first unfinished section');
});

test('damaged, foreign, old-version or hostile saved data is ignored or cleaned, never trusted', () => {
  const s = fake();
  for (const bad of ['', 'not json', '{"v":99}', 'null', '[]', JSON.stringify({ v: 1, stage: 'shapes', at: { shapes: 3 }, ui: {}, records: {} }), JSON.stringify({ v: 2, at: { shapes: 999, nope: 1 } })]) {
    s.setItem(STORE_KEY, bad); const r = loadProgress(s);
    if (r) { assert.equal(r.at.shapes, undefined); assert.equal(r.at.nope, undefined); }
  }
  assert.equal(loadProgress(Object.assign(fake(), { getItem: () => JSON.stringify({ v: 1, stage: 'shapes', at: {}, ui: {}, records: {} }) })), null, 'progress saved by the earlier lesson version is not reused');
  s.setItem(STORE_KEY, JSON.stringify({ v: 2, stage: '<script>', at: { method: 1 },
    ui: { 'b-fourths-make': { lines: [['k0', 'k2'], ['k0', 'missing'], ['k1', 'k1'], 'x'], text: 'x'.repeat(5000), evil: 1, help: { open: true, level: 9 } }, 'no-such-card': { text: 'hi' } },
    records: { 'b-fourths-make': { attempts: -3, first: 'hacked', correct: 'yes', help: 7, relearn: 'yes' }, 'no-such-card': {} } }));
  const r = loadProgress(s);
  assert.equal(r.stage, null);
  assert.deepEqual(r.ui['b-fourths-make'].lines, [['k0', 'k2']], 'only lines between real points survive');
  assert.equal(r.ui['b-fourths-make'].text.length, 600); assert.equal(r.ui['b-fourths-make'].evil, undefined); assert.equal(r.ui['b-fourths-make'].help, undefined);
  assert.equal(r.ui['no-such-card'], undefined); assert.equal(r.records['no-such-card'], undefined);
  assert.deepEqual(r.records['b-fourths-make'], { id: 'b-fourths-make', attempts: 0, first: null, correct: false, help: 0, helpBeforeCorrect: 0, viewed: false, written: false, reviewed: false, relearn: false, wrongStreak: 0 });
});

test('no storage, blocked storage or a full disk: the lesson still works and nothing throws', () => {
  assert.equal(loadProgress(null), null); assert.equal(saveProgress(journeyState, null), false); assert.equal(clearProgress(null), false);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(loadProgress(throwing), null); assert.equal(saveProgress(journeyState, throwing), false); assert.equal(clearProgress(throwing), false);
  // In Node there is no localStorage: the controller's own save/erase quietly do nothing.
  assert.equal(saveJourney(), false); eraseJourney(); assert.deepEqual(journeyState.records, {});
});

test('reset (restart the lesson) erases only the Lesson 7-1 key and starts again at section A', () => {
  const s = fake(); s.setItem('other.site.key', 'keep');
  resetJourney(); finishBefore('count', 'g-slant'); journeyState.stage = 'count'; saveProgress(journeyState, s);
  restoreJourney(loadProgress(s)); assert.equal(resumeStage(), 'count');
  assert.equal(clearProgress(s), true);
  assert.equal(s.getItem(STORE_KEY), null); assert.equal(s.getItem('other.site.key'), 'keep');
  restoreJourney(loadProgress(s)); assert.equal(resumeStage(), 'explore'); assert.deepEqual(journeyState.at, {});
});

test('saved answer choices must be real options of that card; a stale choice can never break Check', () => {
  const s = fake();
  s.setItem(STORE_KEY, JSON.stringify({ v: 2, stage: 'explore', at: { explore: 3 }, ui: { 'a-notfourths': { choice: ['9', '1', '1'] }, 'h-grid': { choice: ['zzz'] } }, records: {} }));
  const r = loadProgress(s);
  assert.deepEqual(r.ui['a-notfourths'].choice, ['1']); assert.deepEqual(r.ui['h-grid'].choice, []);
  resetJourney(); finishBefore('explore', 'a-notfourths'); journeyState.ui['a-notfourths'] = { choice: ['9'] };
  assert.doesNotThrow(() => act('explore', 'check'));
  assert.match(journeyState.ui['a-notfourths'].say, /Choose an answer first/);
});
