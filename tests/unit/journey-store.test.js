// Lesson 7-1 saved progress (DECISIONS D29): one key, local only, validated on the way back in, erasable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STORE_KEY, loadProgress, saveProgress, clearProgress } from '../../js/lib/journey-store.js';
import { act, journeyState, resetJourney, restoreJourney, saveJourney, eraseJourney, resumeStage } from '../../js/partition-journey.js';
import { CARDS, outcome } from '../../js/lib/partition-journey.js';

const fake = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const draw = (stage, lines) => { for (const [a, b] of lines) { act(stage, 'point', { id: a }); act(stage, 'point', { id: b }); } };

test('save and load round-trip: section, card, drawings, answers, writing, help and independent vs assisted records', () => {
  const s = fake();
  resetJourney();
  journeyState.stage = 'shapes'; journeyState.at.shapes = 1;
  draw('shapes', [['v0', 'v2'], ['v1', 'v3']]); act('shapes', 'check');            // Guide Me: right first try, no help
  journeyState.at.shapes = 4; act('shapes', 'help'); act('shapes', 'hint');         // square Guide Me: hint, then
  draw('shapes', [['t2-6', 'b2-6'], ['t4-6', 'b4-6'], ['l1-2', 'r1-2']]); act('shapes', 'check');
  journeyState.at.sizes = 3; act('sizes', 'text', { text: 'More parts, smaller parts.' }); act('sizes', 'compare');
  journeyState.at.explore = 1; act('explore', 'choice', { values: ['0', '2'] });
  assert.equal(saveProgress(journeyState, s), true);
  assert.deepEqual([...s.m.keys()], [STORE_KEY], 'exactly one key');
  const raw = s.m.get(STORE_KEY);
  assert.doesNotMatch(raw, /"name":"(?!fourths|sixths|eighths|thirds)/, 'no personal fields');
  const back = loadProgress(s);
  assert.equal(back.stage, 'shapes'); assert.equal(back.at.shapes, 4); assert.equal(back.at.sizes, 3);
  assert.deepEqual(back.ui['d-diamond-guide'].lines, [['v0', 'v2'], ['v1', 'v3']]);
  assert.deepEqual(back.ui['a-equal'].choice, ['0', '2']);
  assert.equal(back.ui['e-write'].text, 'More parts, smaller parts.'); assert.equal(back.ui['e-write'].compared, true);
  assert.equal(outcome(back.records['d-diamond-guide']), 'independent');
  assert.equal(outcome(back.records['d-square-guide']), 'after-hint');
  assert.equal(back.ui['d-square-guide'].help.level, 1); assert.equal(back.ui['d-square-guide'].help.open, false, 'help panel reopens closed');
});

test('restoring recomputes the picture of a checked construction, and a re-saved state is identical', () => {
  const s = fake();
  resetJourney(); journeyState.at.method = 1; journeyState.stage = 'method';
  draw('method', [['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']]); act('method', 'check');   // unequal, marked
  const before = journeyState.ui['b-fourths-make'].result;
  saveProgress(journeyState, s);
  restoreJourney(loadProgress(s));
  const after = journeyState.ui['b-fourths-make'].result;
  assert.equal(after.valid, false); assert.equal(after.count, 4); assert.equal(after.big, before.big); assert.equal(after.small, before.small);
  const s2 = fake(); saveProgress(journeyState, s2); assert.equal(s2.m.get(STORE_KEY), s.m.get(STORE_KEY));
  assert.equal(resumeStage(), 'method');
});

test('damaged, foreign or hostile saved data is ignored or cleaned, never trusted', () => {
  const s = fake();
  for (const bad of ['', 'not json', '{"v":99}', 'null', '[]', JSON.stringify({ v: 1, at: { shapes: 999, nope: 1 } })]) {
    s.setItem(STORE_KEY, bad); const r = loadProgress(s);
    if (r) { assert.equal(r.at.shapes, undefined); assert.equal(r.at.nope, undefined); }
  }
  s.setItem(STORE_KEY, JSON.stringify({ v: 1, stage: '<script>', at: { method: 1 },
    ui: { 'b-fourths-make': { lines: [['k0', 'k2'], ['k0', 'missing'], ['k1', 'k1'], 'x'], text: 'x'.repeat(5000), evil: 1, help: { open: true, level: 9 } }, 'no-such-card': { text: 'hi' } },
    records: { 'b-fourths-make': { attempts: -3, first: 'hacked', correct: 'yes', help: 7 }, 'no-such-card': {} } }));
  const r = loadProgress(s);
  assert.equal(r.stage, null);
  assert.deepEqual(r.ui['b-fourths-make'].lines, [['k0', 'k2']], 'only lines between real points survive');
  assert.equal(r.ui['b-fourths-make'].text.length, 600); assert.equal(r.ui['b-fourths-make'].evil, undefined); assert.equal(r.ui['b-fourths-make'].help, undefined);
  assert.equal(r.ui['no-such-card'], undefined); assert.equal(r.records['no-such-card'], undefined);
  assert.deepEqual(r.records['b-fourths-make'], { id: 'b-fourths-make', attempts: 0, first: null, correct: false, help: 0, helpBeforeCorrect: 0, viewed: false, written: false, reviewed: false });
});

test('no storage, blocked storage or a full disk: the lesson still works and nothing throws', () => {
  assert.equal(loadProgress(null), null); assert.equal(saveProgress(journeyState, null), false); assert.equal(clearProgress(null), false);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(loadProgress(throwing), null); assert.equal(saveProgress(journeyState, throwing), false); assert.equal(clearProgress(throwing), false);
  // In Node there is no localStorage: the controller's own save/erase quietly do nothing.
  assert.equal(saveJourney(), false); eraseJourney(); assert.deepEqual(journeyState.records, {});
});

test('reset erases only the Lesson 7-1 key and starts the lesson again at section A', () => {
  const s = fake(); s.setItem('other.site.key', 'keep');
  resetJourney(); journeyState.stage = 'count'; journeyState.at.count = 2; saveProgress(journeyState, s);
  assert.equal(clearProgress(s), true);
  assert.equal(s.getItem(STORE_KEY), null); assert.equal(s.getItem('other.site.key'), 'keep');
  restoreJourney(loadProgress(s)); assert.equal(resumeStage(), 'explore'); assert.deepEqual(journeyState.at, {});
  assert.ok(CARDS.explore.length > 0);
});
