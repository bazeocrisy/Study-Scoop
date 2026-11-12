// Chapter 7 teaching release: regression tests for defects found by the independent reviews (round 1).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CARDS, ALL_CARDS, CROSS, partitionKey, cardById } from '../../js/lib/partition-journey.js';
import { helpSteps, journeyCard } from '../../js/views/partition-journey.js';
import { act, resetJourney, journeyState } from '../../js/partition-journey.js';
import { check, solution } from '../../js/lib/lessons.js';

const lesson = (id) => JSON.parse(fs.readFileSync(`data/lessons/${id}.json`, 'utf8'));
const ctx = { lessonLink: (id, s) => `#math?lesson=${id}&stage=${s}` };

test('7-1: every You Do card the child sees has a quick fix (choice cards included)', () => {
  for (const c of Object.values(CARDS).flat().filter((x) => x.phase === 'youdo')) {
    assert.ok(c.quick || helpSteps(c).length, `${c.id}: a quick fix exists on the card the screen draws`);
  }
  // The quick fix appears on the screen after a second miss on a choice card (QA: it was missing).
  resetJourney();
  const k = CARDS.explore.findIndex((c) => c.id === 'a-flags');
  for (const c of CARDS.explore.slice(0, k)) journeyState.records[c.id] = { id: c.id, attempts: 1, first: 'correct', correct: true, help: 0, helpBeforeCorrect: 0, viewed: true, written: true, reviewed: false, relearn: false, wrongStreak: 0 };
  journeyState.at.explore = k;
  act('explore', 'choice', { values: ['0'] }); act('explore', 'check');
  act('explore', 'choice', { values: ['0', '1'] }); const out = act('explore', 'check');
  assert.equal(out.focus, '[data-quick-heading]');
  const page = journeyCard(ctx, 'explore', journeyState).s;
  assert.match(page, /data-quick-heading/); assert.match(page, /data-j="relearn-open"/);
});

test('7-1: "a different way" help shows the way the child has not drawn yet', () => {
  const card = cardById('c-make2'), t = card.task;
  const way2 = partitionKey(t, CROSS.teach2[CROSS.teach2.length - 1].lines), way1 = partitionKey(t, CROSS.teach[CROSS.teach.length - 1].lines);
  const lastLines = (avoidKey) => { const steps = helpSteps(card, { avoidKey }); return steps; };
  assert.notEqual(way1, way2);
  assert.match(lastLines(way2).map((s) => s.text).join(' '), /Way 1|top edge|middle of the/i, 'drew Way 2 before: help teaches Way 1');
  assert.match(lastLines(way1).map((s) => s.text).join(' '), /inside corners/i, 'drew Way 1 before: help teaches Way 2');
});

test('7-6: "Greater than" is a right answer in practice and in the test (not always "Less than")', () => {
  const L = lesson('7-6');
  const rel = (it) => it.options.find((o) => o.correct).text.split(' ')[0];
  const cmp = (items) => items.filter((it) => /less than, equal to, or greater than/.test(it.prompt));
  for (const part of ['try', 'test']) {
    const r = cmp(L[part].items).map(rel);
    assert.ok(r.filter((x) => x === 'Greater').length >= 2, `${part}: at least two "Greater than" answers (${r})`);
    assert.ok(r.some((x) => x !== 'Greater'), `${part}: not always "Greater than" either`);
  }
  // We Do: the denominator question's first help step is about one whole, not the trip to the point.
  const g1 = L.together.items.find((it) => it.id === 'g1');
  assert.match(g1.prompt, /denominator/); assert.match(g1.teaching.steps[0].text, /0 and 1/); assert.doesNotMatch(g1.teaching.steps[0].text, /marked point/);
});

test('7-2 and 7-5: equal-parts and n/1 = n are practised and tested, and graded by the real checker', () => {
  const L2 = lesson('7-2'), L5 = lesson('7-5');
  const eq = (items) => items.filter((it) => /equal parts of the strip/.test(it.prompt));
  assert.ok(eq(L2.try.items).length >= 1 && eq(L2.test.items).length >= 1, '7-2 equal versus unequal parts');
  const conv = (items) => items.filter((it) => /\d\/1/.test(it.prompt) && it.type === 'number');
  assert.ok(conv(L5.try.items).length >= 1 && conv(L5.test.items).length >= 1, '7-5 n/1 back to a whole number');
  for (const [L, it] of [...eq([...L2.try.items, ...L2.test.items]).map((x) => [L2, x]), ...conv([...L5.try.items, ...L5.test.items]).map((x) => [L5, x])]) {
    const right = Object.fromEntries(Object.entries(solution(it)).map(([k, v]) => [k, String(v)]));
    assert.equal(check(it, right, L).status, 'correct', `${it.id} accepts its answer`);
    const wrong = it.type === 'choice' ? { choice: String((Number(right.choice) + 1) % it.options.length) } : { answer: String(Number(right.answer) + 1) };
    assert.notEqual(check(it, wrong, L).status, 'correct', `${it.id} rejects a wrong answer`);
  }
});

test('7-2 to 7-7: no prompt states its own answer, and help steps do not state the number to type', () => {
  for (const id of ['7-2', '7-3', '7-4', '7-5', '7-6', '7-7']) {
    const raw = fs.readFileSync(`data/lessons/${id}.json`, 'utf8');
    for (const bad of ['Each whole is one piece', 'the same number of pieces is colored', 'None are added, removed', 'put 4 in the bottom box', 'Count all four selected', 'has every equal piece selected', 'Those 1 gap are', '1 equal piece are']) {
      assert.ok(!raw.includes(bad), `${id}: "${bad}"`);
    }
  }
});

test('ALL_CARDS and CARDS agree on the quick fix (the screen and the report see the same card)', () => {
  for (const c of ALL_CARDS) { const s = Object.values(CARDS).flat().find((x) => x.id === c.id); if (s) assert.equal(Boolean(s.quick), Boolean(c.quick), c.id); }
});
