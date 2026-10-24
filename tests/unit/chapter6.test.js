// Chapter 6 (Connect Area and Multiplication): lessons 6-1 to 6-6, the area pictures, Area Words and the tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLesson, validateQuiz } from '../../js/lib/lessons.js';
import { gridCounts, shapeArea, shapeProblems, shapeSides } from '../../js/lib/shapes.js';
import { describe, modelFigure } from '../../js/lib/models.js';
import { AREA_WORDS, areaVocabTest, validateArea } from '../../js/lib/area.js';
import { rng, testCatalog, validateTests } from '../../js/lib/activities.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const W26 = readJSON('data/2026-10-26.json');
const AREA = readJSON('data/practice/area.json');
const T26 = readJSON('data/tests/2026-10-26.json');
const IDS = ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6'];
const L = Object.fromEntries(IDS.map((id) => [id, readJSON(`data/lessons/${id}.json`)]));
const clone = (o) => JSON.parse(JSON.stringify(o));

test('the six Chapter 6 lessons, in the textbook\'s order, each with the full lesson workflow', () => {
  assert.deepEqual(IDS.map((id) => L[id].title), ['Understand Area', 'Count Unit Squares to Determine Area', 'Use Multiplication to Determine Area',
    'Determine the Area of a Composite Figure', 'Use the Distributive Property to Determine Area', 'Solve Area Problems']);
  for (const id of IDS) {
    const l = L[id];
    assert.deepEqual(validateLesson(l, id), [], id);
    assert.ok(l.learn.screens.length >= 5 && l.learn.screens.some((s) => s.item), `${id}: Learn It screens with checkpoints`);
    assert.ok(l.watch.examples.length >= 2, `${id}: at least two worked examples`);
    assert.ok(l.together.items.length >= 5, `${id}: at least five guided questions`);
    assert.equal(l.try.items.length, 20, `${id}: 20 Try It Yourself questions`);
    assert.ok(l.test.items.length >= 10 && l.test.items.length <= 15, `${id}: a 10-15 question test`);
    for (const it of [...l.together.items, ...l.try.items]) assert.ok(it.hints?.length && it.show?.length, `${id} ${it.id}: Help and Show me how`);
    for (const it of l.test.items) assert.ok(!it.hints && !it.mistakes, `${id} ${it.id}: no hints in the test`);
    // Test questions are not the practice questions again.
    const practice = new Set([...l.together.items, ...l.try.items].map((it) => `${it.prompt}|${JSON.stringify(it.model || it.models || null)}`));
    for (const it of l.test.items) assert.ok(!practice.has(`${it.prompt}|${JSON.stringify(it.model || it.models || null)}`), `${id} ${it.id} repeats a practice question`);
    assert.ok(new Set(l.try.items.map((it) => `${it.prompt}|${JSON.stringify(it.model || it.models || null)}`)).size === 20, `${id}: 20 different practice questions`);
  }
});

test('area answers come from the pictures: tiles, area and missing squares; split figures add up', () => {
  assert.deepEqual(gridCounts({ cells: ['XXXX', 'XXoo', 'Xooo'] }), { tiles: 7, area: 12, rows: 3, cols: 4 });
  assert.equal(shapeArea({ rects: [[0, 0, 6, 2], [4, 2, 2, 3]] }), 18);
  // The L shape's sides are measured from its rectangles, never typed by hand.
  assert.deepEqual(shapeSides({ rects: [[0, 0, 6, 2], [4, 2, 2, 3]] }).map((s) => s.len).sort((a, b) => a - b), [2, 2, 3, 4, 5, 6]);
  assert.deepEqual(shapeProblems({ rects: [[0, 0, 3, 3], [2, 0, 3, 3]] }), ['rectangles 1 and 2 overlap']);
  assert.deepEqual(shapeProblems({ rects: [[0, 0, 2, 2], [5, 5, 1, 1]] }), ['the rectangles must be joined into one figure']);
  // Every picture in every lesson is valid and drawn.
  for (const id of IDS) for (const s of JSON.stringify(L[id]).matchAll(/"model":(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g)) {
    const m = JSON.parse(s[1]);
    assert.ok(modelFigure(m).s.includes('<svg'), `${id} draws ${s[1]}`);
  }
});

test('the validator catches a wrong area key, a picture that does not match, and a wrong "choose all" option', () => {
  const a = clone(L['6-4']);
  a.try.items.find((it) => it.type === 'number' && it.asks === 'area').answer = '9 × 9';
  assert.ok(validateLesson(a, '6-4').some((p) => /the picture has \d+ area/.test(p)), 'a wrong composite answer');
  const b = clone(L['6-1']);
  b.try.items.find((it) => it.asks === 'missing').model.cells[0] = 'oooo';
  assert.ok(validateLesson(b, '6-1').length > 0, 'a changed picture no longer matches its answer');
  const c = clone(L['6-4']);
  c.try.items.find((it) => it.areaOptions && it.type === 'multi').options[0].correct = false;
  assert.ok(validateLesson(c, '6-4').some((p) => /marked wrong but equals/.test(p)), 'a right equation marked wrong');
  const d = clone(L['6-5']);
  d.try.items.find((it) => it.areaBox).answer.t += 1;
  assert.ok(validateLesson(d, '6-5').length > 0, 'a wrong total in a split rectangle');
});

test('question pictures never print part areas or give the answer away', () => {
  for (const id of IDS) for (const stage of ['together', 'try', 'test']) for (const it of L[id][stage].items) {
    for (const m of it.models || (it.model ? [it.model] : [])) {
      assert.notEqual(m.areas, true, `${id} ${it.id}: part areas are only on teaching pictures`);
      if (m.type === 'shape' && m.show === 'parts') assert.doesNotMatch(modelFigure(m).s, /class="s-area"/, `${id} ${it.id}`);
    }
  }
  assert.match(describe({ type: 'grid', cells: ['XXX', 'Xoo'] }), /first row has 3 squares; the second row has 3 squares\. Tiles are drawn on 4/);
});

test('Area Words: the teacher\'s three words word for word, the chapter review words marked as review, 20 questions per quiz', () => {
  assert.deepEqual(validateArea(AREA, W26), []);
  const v = AREA.vocab;
  for (const w of AREA_WORDS) assert.equal(v.words.find((x) => x.word === w).def, W26.math.words.find((x) => x.word === w).def, w);
  assert.deepEqual(v.words.filter((w) => !w.teacher).map((w) => w.word), ['Unit Square', 'Square Units', 'Decompose', 'Composite Figure', 'Multiplication']);
  for (const m of ['choice', 'truefalse', 'fill']) assert.equal(v[m].length, 20, m);
  const bad = clone(AREA);
  bad.vocab.words[0].def = 'how big a shape is';
  assert.ok(validateArea(bad, W26).some((p) => /teacher's, word for word/.test(p)));
  const bad2 = clone(AREA);
  bad2.vocab.truefalse[0].options.forEach((o) => { o.correct = !o.correct; if (o.correct) delete o.why; else o.why = 'x'; });
  assert.ok(validateArea(bad2, W26).some((p) => /does not match/.test(p)));
});

test('the Nov 3 Math Vocabulary practice test: only Area, Square Unit and Multiply, 12 questions, no hints, never a practice question', () => {
  const practice = new Set(['choice', 'truefalse', 'fill'].flatMap((m) => AREA.vocab[m].map((it) => it.prompt)));
  const sets = new Set();
  for (let seed = 1; seed <= 6; seed++) {
    const t = areaVocabTest(AREA, rng(seed));
    assert.equal(t.items.length, 12);
    assert.deepEqual(validateQuiz(t.items, t.pass, 'nov3'), []);
    for (const it of t.items) {
      assert.ok(AREA_WORDS.includes(it.word), it.word);
      assert.ok(!it.hints && !it.show, `${it.id}: no hints`);
      assert.ok(!practice.has(it.prompt), it.prompt);
    }
    for (const w of AREA_WORDS) assert.equal(t.items.filter((it) => it.word === w).length, 4, w);
    sets.add(t.items.map((i) => i.prompt).sort().join('|'));
  }
  assert.ok(sets.size > 1, 'a retake can differ');
});

test('Oct 26 Test Center: the Chapter 6 Practice Test (27, every lesson), spelling, green-word vocabulary, and the Nov 3 vocabulary test', () => {
  assert.deepEqual(validateTests(T26, W26), []);
  const per = Object.fromEntries(['l61', 'l62', 'l63', 'l64', 'l65', 'l66'].map((k) => [k, T26.math.items.filter((i) => i.skill === k).length]));
  assert.equal(T26.math.items.length, 27);
  for (const [k, n] of Object.entries(per)) assert.ok(n >= 4, `${k}: ${n}`);
  const cards = testCatalog(W26, T26, null, AREA);
  assert.deepEqual(cards.map((c) => [c.title, c.count, c.available]), [['Chapter 6 Practice Test', 27, true], ['Spelling Practice Test', 15, true],
    ['Vocabulary Practice Test', 16, true], ['Math Vocabulary Practice Test', 12, true]]);
  const mv = cards.find((c) => c.kind === 'mathwords');
  assert.deepEqual([mv.dateLabel, mv.date, mv.classTest], ['Class test', '2026-11-03', 'Math Topic 6 Vocabulary Test']);
  const ch = cards.find((c) => c.kind === 'math');
  assert.deepEqual([ch.dateLabel, ch.date, ch.review], ['Review of', null, 'Chapter 6 (all lessons)'], 'the chapter test is a review, not a class test');
  // The vocabulary test is only about the four green words.
  assert.deepEqual([...new Set(T26.vocab.items.map((i) => i.word))].sort(), ['Constellations', 'Distracted', 'Irritating', 'Trustworthy']);
});
