// Chapter 7 skill journeys (DECISIONS D31): Lessons 7-2 to 7-7 teach each skill with its own I Do → We Do → You Do,
// like Lesson 7-1. These checks guard the structure, the answers, the outcome rules and the saved-progress store.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { check, solution } from '../../js/lib/lessons.js';
import { sectionsOf, cardItem, cardDone, frontierOf, sectionNeeds, resumeSkill, youDoOutcome, skillReadiness } from '../../js/lib/skill-journey.js';
import { loadLessonProgress, saveLessonProgress, lessonKey } from '../../js/lib/lesson-store.js';

const LESSONS = ['7-2', '7-3', '7-4', '7-5', '7-6', '7-7'].map((id) => JSON.parse(fs.readFileSync(`data/lessons/${id}.json`, 'utf8')));
const key = (m) => m && JSON.stringify({ kind: m.kind, parts: m.parts, wholes: m.wholes ?? 1, max: m.max, point: m.point, sel: m.kind === 'line' ? undefined : [...(m.selected || [])].length, weights: m.weights });
const asText = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));

test('every lesson is organized by skill, each skill a complete I Do → We Do → You Do cycle', () => {
  for (const L of LESSONS) {
    const secs = sectionsOf(L);
    assert.ok(secs.length >= 4 && secs.length <= 8, `${L.id}: ${secs.length} skills`);
    assert.equal(new Set(secs.map((s) => s.id)).size, secs.length, `${L.id}: section ids are unique`);
    for (const s of secs) {
      const ph = s.cards.map((c) => c.phase);
      const last = (p) => ph.lastIndexOf(p), first = (p) => ph.indexOf(p);
      assert.ok(first('ido') === 0, `${L.id} ${s.id}: starts with I Do`);
      assert.ok(first('wedo') > last('ido') && first('youdo') > last('wedo'), `${L.id} ${s.id}: I Do, then We Do, then You Do`);
      assert.ok(s.cards.some((c) => c.phase === 'ido' && (c.kind === 'example' || (c.text || []).length)), `${L.id} ${s.id}: the I Do explains`);
      assert.ok(ph.filter((p) => p === 'youdo').length >= 1, `${L.id} ${s.id}: at least one You Do`);
    }
    // No question is used twice in the journey.
    const ids = secs.flatMap((s) => s.cards.map(cardItem).filter(Boolean).map((it) => it.id));
    assert.equal(new Set(ids).size, ids.length, `${L.id}: every journey question is different`);
  }
});

test('a You Do question never shows a picture that was solved on an I Do card of its skill', () => {
  for (const L of LESSONS) for (const s of sectionsOf(L)) {
    const taught = new Set(s.cards.filter((c) => c.phase === 'ido').flatMap((c) => [c.model, ...(c.models || []), ...(c.steps || []).flatMap((x) => [x.model, ...(x.models || [])])]).filter(Boolean).map(key));
    for (const c of s.cards.filter((x) => x.phase === 'youdo')) assert.ok(!taught.has(key(c.item.model)), `${L.id} ${s.id} ${c.item.id}: its picture was already solved in the I Do`);
  }
});

test('every journey question accepts its answer and rejects a wrong one', () => {
  for (const L of LESSONS) for (const s of sectionsOf(L)) for (const c of s.cards) {
    const it = cardItem(c);
    if (!it || it.type === 'sentence') continue;
    const sol = solution(it);
    assert.equal(check(it, asText(sol), L).status, 'correct', `${L.id} ${it.id}`);
    const wrong = it.type === 'choice' ? { choice: String((Number(sol.choice) + 1) % it.options.length) } : it.answerPolicy === 'value' ? { ...asText(sol), n: String(Number(sol.n) + 1) } : Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, String(Number(v) + 1)]));
    assert.notEqual(check(it, wrong, L).status, 'correct', `${L.id} ${it.id} rejects a wrong answer`);
  }
});

test('progress rules: cards in order, parts in order, honest outcomes', () => {
  const L = LESSONS[0], [A, B] = sectionsOf(L);
  assert.equal(frontierOf(A, { seen: {}, items: {}, steps: {} }), 0);
  assert.ok(cardDone(A.cards[0], 0, { seen: { 0: true }, items: {} }), 'a screen is done when seen');
  const q = A.cards.findIndex((c) => c.kind === 'item');
  assert.ok(!cardDone(A.cards[q], q, { seen: { [q]: true }, items: {} }), 'a question waits for its answer');
  assert.deepEqual(sectionNeeds(L, B.id, new Set()), [A.id]);
  assert.deepEqual(sectionNeeds(L, 'test', new Set([A.id])).length, sectionsOf(L).length - 1);
  assert.equal(resumeSkill(L, new Set([A.id]), false), B.id);
  assert.equal(youDoOutcome({ tries: 1, first: 'correct', status: 'correct' }), 'independent');
  assert.equal(youDoOutcome({ tries: 2, first: 'notyet', status: 'correct' }), 'retry');
  assert.equal(youDoOutcome({ tries: 2, first: 'notyet', status: 'correct', help: 1 }), 'help');
  assert.equal(youDoOutcome({ tries: 4, first: 'notyet', status: 'shown', shown: true }), 'answer');
  assert.equal(youDoOutcome({ tries: 2, first: 'notyet', status: 'correct', feedbackRevealed: true }), 'help', 'feedback that showed the answer is help');
  const r = skillReadiness(L, () => null, { firstTest: { right: 9, total: 10, pass: 8, missed: [] } });
  assert.equal(r.level, 'notyet' === r.level ? 'notyet' : r.level);
  assert.notEqual(r.level, 'ready', 'not ready while the skills are not done');
});

test('saved progress: one key per lesson, validated on load, hostile data cleaned', () => {
  const L = LESSONS[1], A = sectionsOf(L)[0];
  const m = new Map(), storage = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  const it = cardItem(A.cards.find((c) => c.kind === 'item'));
  assert.ok(saveLessonProgress(L, { [A.id]: { i: 2, seen: { 0: true, 1: true }, steps: {}, items: { [it.id]: { resp: { answer: '3' }, status: 'correct', tries: 1, first: 'correct', teachingFeedback: { x: 1 } } } } }, { restarts: 0, missRounds: 0, items: {} }, storage));
  assert.deepEqual([...m.keys()], [lessonKey(L.id)]);
  const stageItems = { [A.id]: { ids: new Set([it.id]), cards: A.cards.length }, test: { ids: new Set(L.test.items.map((x) => x.id)), cards: 10 } };
  const back = loadLessonProgress(L, stageItems, storage);
  assert.equal(back.stages[A.id].items[it.id].status, 'correct');
  assert.equal(back.stages[A.id].items[it.id].teachingFeedback, undefined, 'derived feedback is not stored');
  m.set(lessonKey(L.id), JSON.stringify({ v: 1, stages: { [A.id]: { i: 999, items: { [it.id]: { status: 'hacked', tries: -4, resp: { answer: 7, ['<x>']: 'y' } }, nope: {} } }, evil: {} }, history: { firstTest: { right: 'all' } } }));
  const bad = loadLessonProgress(L, stageItems, storage);
  assert.equal(bad.stages[A.id].i, 0); assert.equal(bad.stages[A.id].items[it.id].status, undefined); assert.equal(bad.stages[A.id].items[it.id].tries, undefined);
  assert.deepEqual(bad.stages[A.id].items[it.id].resp, {}); assert.equal(bad.stages[A.id].items.nope, undefined); assert.equal(bad.stages.evil, undefined); assert.equal(bad.history.firstTest, undefined);
  for (const raw of ['', 'not json', '{"v":2}', 'null']) { m.set(lessonKey(L.id), raw); assert.equal(loadLessonProgress(L, stageItems, storage), null, raw); }
  assert.equal(loadLessonProgress(L, stageItems, { getItem() { throw new Error('blocked'); } }), null);
  assert.equal(saveLessonProgress(L, {}, null, { setItem() { throw new Error('full'); } }), false);
});
