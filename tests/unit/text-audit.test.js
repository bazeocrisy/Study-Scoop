// Text and accuracy audit (2026-11-12): regression tests for the verified Study Scoop errors that were fixed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { vocabItems } from '../../js/lib/activities.js';
import { timesFamilyFind, findItCorrect } from '../../js/lib/skills.js';
import { check } from '../../js/lib/lessons.js';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const WEEKS = ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09'];

test('fill in the blank: a word that would also fit the sentence never joins the word bank', () => {
  for (const id of WEEKS) {
    const week = read(`data/${id}.json`);
    for (let seed = 0; seed < 30; seed++) {
      let x = seed + 1; const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
      for (const it of vocabItems(week, 'fill', rand)) {
        const w = week.vocab.words.find((v) => v.word === it.word);
        for (const other of w.alsoFits || []) assert.ok(!it.bank.includes(other.toLowerCase()), `${id} ${it.id}: "${other}" also fits`);
      }
    }
  }
});

test('teacher definitions are kept exactly; mismatched ones carry a plain-words note', () => {
  for (const id of WEEKS) {
    const words = read(`data/${id}.json`).vocab.words;
    const by = (n) => words.find((w) => w.word === n);
    assert.equal(by('Distracted').def, 'To prevent something from continuing as usual');
    assert.equal(by('Trustworthy').def, 'The ability to keep promises');
    assert.equal(by('Irritating').def, 'To anger or bother');
    for (const n of ['Distracted', 'Trustworthy', 'Irritating']) assert.match(by(n).note || '', /\w/, `${id} ${n} note`);
  }
});

test('graders accept every correct answer: Times App Find It and partial areas in either order', () => {
  // The function the Find It button uses (js/activity-player.js find-check).
  const it = timesFamilyFind([2, 3], Math.random).find((i) => i.answer.a * i.answer.b === 12);
  for (const [a, b] of [[2, 6], [6, 2], [3, 4], [4, 3]]) assert.ok(findItCorrect(it, a, b), `${a} × ${b}`);
  assert.ok(!findItCorrect(it, 1, 12), 'outside the chosen families'); assert.ok(!findItCorrect(it, 5, 2), 'wrong product');
  assert.match(fs.readFileSync('js/activity-player.js', 'utf8'), /const corr = findItCorrect\(item, va, vb\)/, 'the live handler uses it');
  const L = read('data/lessons/6-4.json'), x1 = L.test.items.find((i) => i.id === 'x1');
  assert.equal(check(x1, { a: '12', b: '9', p1: '9', p2: '12', t: '21' }, L).status, 'correct');
  assert.notEqual(check(x1, { a: '12', b: '9', p1: '9', p2: '9', t: '18' }, L).status, 'correct');
  const game = fs.readFileSync('games/multiplication-mastery-8.html', 'utf8');
  assert.match(game, /\(f\.a===0\?f\.b:f\.a\)===0\?value>=0/, '0 × ☐ = 0 accepts any number');
});

test('content fixes stay fixed', () => {
  assert.ok(read('data/reading/leafcolor.json').elements.cause.accept.includes('food'), 'the evidence sentence word is accepted');
  assert.match(read('data/reading/raindelay.json').words.umpire.means, /decides/);
  const t = read('data/2026-10-26.json').tests.find((x) => /Topic 6/.test(x.title));
  assert.equal(t.title, 'Math Topic 6 Area Test', 'the 11-02 flyer names it the Topic 6 Area Test');
  assert.doesNotMatch(fs.readFileSync('data/tests/2026-10-26.json', 'utf8'), /distracted when the class was interrupted/);
  assert.equal(read('data/pictures.json').illustrations['2026-11-09'].spelling.formal.alt, 'A boy wears a formal suit and bow tie at a family celebration.');
});
