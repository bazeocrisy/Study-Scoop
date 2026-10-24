// Math > Practice Problems and Learn the Properties (DECISIONS D19): every answer key is worked out again here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVITIES, mathItems, menuItems, propertyOf, rng, splitsOf, twoFacts, validateMathPractice } from '../../js/lib/activities.js';
import { check, solution, modelEquation } from '../../js/lib/lessons.js';
import { counts } from '../../js/lib/models.js';
import { wrongFactsInText } from '../../js/lib/arith.js';
import { GUIDE_STEPS, GUIDE_WORDS, PROPERTIES, UNIT5 } from '../../js/lib/mathlearn.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRACTICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/practice/math.json'), 'utf8'));
const copy = () => JSON.parse(JSON.stringify(PRACTICE));
const asText = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));

test('the practice bank passes every check, with enough questions in each kind', () => {
  assert.deepEqual(validateMathPractice(PRACTICE), []);
  const n = Object.fromEntries(Object.entries(PRACTICE.sets).map(([k, v]) => [k, v.length]));
  assert.ok(n.props >= 12 && n.split >= 10 && n.breakapart >= 10 && n.facts >= 6, JSON.stringify(n));
  for (const it of Object.values(PRACTICE.sets).flat()) {
    assert.equal(check(it, asText(solution(it))).status, 'correct', it.id);
    assert.ok(it.hints.length && it.show.length && it.explain, it.id);
  }
});

test('the property is worked out from the numbers, and unclear facts are refused', () => {
  assert.equal(propertyOf('6 × 1 = 6'), 'Identity');
  assert.equal(propertyOf('0 × 8 = 0'), 'Zero');
  assert.equal(propertyOf('3 × 6 = 6 × 3'), 'Commutative');
  assert.equal(propertyOf('8 × 4 = (5 × 4) + (3 × 4)'), 'Distributive');
  assert.equal(propertyOf('6 × 9 = (6 × 5) + (6 × 4)'), 'Distributive');
  for (const bad of ['1 × 0 = 0', '1 × 5 = 5 × 1', '6 × 9 = (6 × 5) + (6 × 3)', '6 × 1 = 7', '4 × 4 = 4 × 4']) assert.equal(propertyOf(bad), null, bad);
  // Every Identify the Property answer key matches its equation.
  for (const it of PRACTICE.sets.props) assert.equal(it.options.find((o) => o.correct).text, `${propertyOf(it.eq)} Property`, it.id);
});

test('a wrong property key, a split that does not match its picture, or the wrong factor broken apart is caught', () => {
  const a = copy();
  const p = a.sets.props[0];
  p.options.forEach((o) => { o.correct = o.text === 'Zero Property' || undefined; if (!o.correct) o.why = 'x'; else delete o.why; });
  assert.ok(validateMathPractice(a).some((m) => m.includes(`${p.id}: "${p.eq}" shows the Identity Property`)));

  const b = copy();
  b.sets.split[0].model.cut.at += 1;
  assert.ok(validateMathPractice(b).some((m) => m.includes(b.sets.split[0].id)));

  const d = copy();
  const s = d.sets.split[0];
  const w = s.options.find((o) => !o.correct);
  w.why = 'That also makes 99, but it does not match where the line is.';
  assert.ok(validateMathPractice(d).some((m) => m.includes('does not make 99')), 'a false also-makes claim');

  const e = copy();
  const b10 = Object.values(e.sets).flat().find((x) => x.id === 'b10');
  b10.options.forEach((o) => { if (o.text.startsWith('Nothing')) { o.correct = true; delete o.why; } else if (o.correct) { delete o.correct; o.why = 'x'; } });
  assert.ok(validateMathPractice(e).some((m) => m.includes('b10: the key says the wrong work is correct')), 'a swapped what-went-wrong key');

  const c = copy();
  const b1 = c.sets.breakapart.find((x) => x.id === 'b1');
  b1.split = 'first';
  assert.ok(validateMathPractice(c).some((m) => m.includes('b1')));
});

test('every split array question: exactly the right choice names the two parts of the picture', () => {
  for (const it of PRACTICE.sets.split) {
    const m = it.model;
    const c = counts(m);
    const right = it.options.find((o) => o.correct).text;
    const [p, q, r, s] = twoFacts(right);
    assert.equal(p * q, c.a, `${it.id} first part`);
    assert.equal(r * s, c.b, `${it.id} second part`);
    assert.ok(modelEquation(m).endsWith(`${p} × ${q} + ${r} × ${s}`), `${it.id}: ${modelEquation(m)} vs ${right}`);
    // No wrong choice names the same two parts (turned around or not).
    for (const o of it.options.filter((x) => !x.correct)) {
      const f = twoFacts(o.text);
      const same = [[f[0] * f[1], f[2] * f[3]].sort().join(), [p * q, r * s].sort().join()];
      const sameFacts = [f.slice(0, 2).sort().join('x'), f.slice(2).sort().join('x')].sort().join() === [[p, q].sort().join('x'), [r, s].sort().join('x')].sort().join();
      assert.ok(!sameFacts, `${it.id}: ${o.text} is the right answer in disguise (${same})`);
    }
  }
});

test('"break apart the 7" and "break apart the 3" accept only that factor', () => {
  assert.deepEqual([...splitsOf(3, 7, '(3 × 2) + (3 × 5)')], ['second']);
  assert.deepEqual([...splitsOf(3, 7, '(2 × 7) + (1 × 7)')], ['first']);
  assert.deepEqual([...splitsOf(3, 7, '(3 × 3) + (3 × 3)')], []);
  for (const it of PRACTICE.sets.breakapart.filter((x) => x.split)) {
    for (const o of it.options) {
      const s = splitsOf(...it.fact, o.text);
      assert.equal(it.split === 'any' ? s.size > 0 : s.has(it.split), Boolean(o.correct), `${it.id} ${o.text}`);
    }
  }
});

test('Mixed Practice takes questions from every kind; each kind has its own questions', () => {
  const mixed = mathItems(PRACTICE, 'mixed', rng(7));
  assert.equal(mixed.length, 20);
  for (const prefix of ['p', 's', 'b', 'f']) assert.equal(mixed.filter((it) => it.id.startsWith(prefix) && /^\w\d+$/.test(it.id)).length, 5, prefix);
  assert.equal(new Set(mixed.map((it) => it.id)).size, 20);
  // Every practice kind on the menu has 20 questions (Assignment: 20 per category).
  for (const k of ['props', 'split', 'breakapart', 'mixed']) assert.equal(mathItems(PRACTICE, k, rng(3)).length, 20, k);
  assert.equal(mathItems(PRACTICE, 'split', rng(1)).length, PRACTICE.sets.split.length);
  assert.deepEqual(mathItems(null, 'split'), []);
});

test('Math menus: five choices first, five on Practice Problems, five on Math Vocabulary', () => {
  // Topic 6: Area is listed first; the Math page shows it only in the Area week (views.test.js).
  assert.deepEqual(menuItems('math').map((a) => a.label), ['Topic 6: Area', 'Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide']);
  assert.deepEqual(menuItems('math', 'area').map((a) => a.label), ['Learn Area', 'Area Words', 'Mixed Practice', 'Chapter 6 Review', 'Practice My Misses']);
  assert.deepEqual(menuItems('math', 'areawords').map((a) => a.label), ['Review My Words', 'Flashcards', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses']);
  assert.deepEqual(menuItems('math', 'lessons').map((a) => a.id), ['ch5', 'ch6']);
  assert.deepEqual(menuItems('math', 'practice').map((a) => a.id), ['props', 'split', 'breakapart', 'mixed', 'misses']);
  assert.deepEqual(menuItems('math', 'words').map((a) => a.label), ['Review My Words', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses']);
  assert.deepEqual(menuItems('spelling').map((a) => a.label), ['Learn My Words', 'Flashcards', 'Missing Letters', 'Listen & Spell', 'Practice My Misses']);
  assert.deepEqual(menuItems('vocab').map((a) => a.label), ['Learn My Words', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses']);
  assert.ok(Object.values(ACTIVITIES).flat().every((a) => a.label && a.about && a.icon));
});

test('Learn the Properties: each picture matches its equation, and every written fact is true', () => {
  assert.deepEqual(PROPERTIES.map((p) => p.key), ['identity', 'zero', 'commutative', 'associative', 'distributive']);
  const [id, zero, comm, assoc, dist] = PROPERTIES;
  // Associative: both pictures have 24 dots, and each is the product written in its caption.
  assert.deepEqual(assoc.models.map((m) => counts(m.model).total), [24, 24]);
  assert.equal(propertyOf(assoc.eq), 'Associative');
  assert.equal(counts(id.model).dots, 7);
  assert.equal(id.model.plates * id.model.each, 7);
  assert.equal(zero.model.plates, 9);
  assert.equal(counts(zero.model).dots, 0);
  assert.equal(comm.model.left.rows * comm.model.left.cols, 8);
  assert.deepEqual([comm.model.right.rows, comm.model.right.cols], [comm.model.left.cols, comm.model.left.rows]);
  assert.equal(modelEquation(dist.model), '6 × 3 = 5 × 3 + 1 × 3');
  assert.equal(counts(dist.model).total, 18);
  assert.equal(modelEquation(dist.second.model), '6 × 7 = 3 × 7 + 3 × 7');
  assert.equal(counts(dist.second.model).total, 42);
  assert.equal(propertyOf(dist.second.eq), 'Distributive');
  assert.equal(modelEquation(GUIDE_STEPS.splitModel), '5 × 6 = 2 × 6 + 3 × 6');
  const text = [...PROPERTIES.flatMap((p) => [p.eq, p.kid, p.caption, ...p.steps, ...(p.contrast ? [p.contrast] : []), ...(p.models || []).map((m) => m.caption), ...(p.second ? [p.second.eq, p.second.caption, ...p.second.steps] : [])]),
    ...GUIDE_WORDS.flat(), ...Object.values(GUIDE_STEPS).filter(Array.isArray).flat(), ...Object.values(UNIT5).flat(2)];
  for (const s of text) assert.deepEqual(wrongFactsInText(s), [], s);
  // Each example shows its own property (the turn-around example is checked without its "= 8").
  assert.deepEqual([id.eq, zero.eq, comm.eq.replace(/ = 8$/, ''), assoc.eq, dist.eq].map(propertyOf), ['Identity', 'Zero', 'Commutative', 'Associative', 'Distributive']);
});
