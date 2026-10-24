import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFind, factDeck, roundOf, shuffled } from '../../js/lib/factpick.js';

test('Pick My Facts: the deck has every fact for the picked numbers, up to 10 or 12', () => {
  assert.deepEqual(factDeck(new Set([4]), 10).map((f) => `${f.a}x${f.b}`), ['4x1', '4x2', '4x3', '4x4', '4x5', '4x6', '4x7', '4x8', '4x9', '4x10']);
  assert.equal(factDeck(new Set([3, 7]), 12).length, 24);
  assert.equal(factDeck(new Set(), 10).length, 0);
  const d = factDeck(new Set([2, 5, 9]), 10);
  assert.deepEqual(shuffled(d).map((f) => `${f.a}x${f.b}`).sort(), d.map((f) => `${f.a}x${f.b}`).sort());
});

test('Pick My Facts: a round has 10 different facts from the picked numbers only', () => {
  for (let k = 0; k < 50; k++) {
    const r = roundOf(new Set([6, 8]), 12);
    assert.equal(r.length, 10);
    assert.equal(new Set(r.map((f) => `${f.a}x${f.b}`)).size, 10);
    for (const f of r) { assert.ok([6, 8].includes(f.a)); assert.ok(f.b >= 1 && f.b <= 12); }
  }
});

test('Find the Fact: right, either order, and a true fact that uses no picked number is told apart', () => {
  const four = new Set([4]);
  assert.equal(checkFind(4, 6, 24, four), 'right');
  assert.equal(checkFind(6, 4, 24, four), 'right');
  assert.equal(checkFind(3, 8, 24, four), 'other');
  assert.equal(checkFind(2, 4, 24, four), 'wrong');
  assert.equal(checkFind(3, 8, 24, new Set([3, 4])), 'right');
  assert.equal(checkFind(4, 12, 48, four, 10), 'other', '× 12 only counts when the child picked up to 12');
  assert.equal(checkFind(4, 12, 48, four, 12), 'right');
  // Every fact in every deck is accepted as written and turned around.
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
    assert.equal(checkFind(a, b, a * b, new Set([a]), 12), 'right');
    assert.equal(checkFind(b, a, a * b, new Set([a]), 12), 'right');
  }
});
