// The validator must catch the mistakes a weekly update could introduce.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateIndex, validateWeek } from '../../js/lib/validate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const good = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/2026-10-19.json'), 'utf8'));
const WEEK_HOMEWORK = good().homework.length; // where a new, broken homework entry lands
const goodIndex = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/weeks.json'), 'utf8'));

function expectProblem(mutate, pattern) {
  const week = good();
  mutate(week);
  const problems = validateWeek(week, '2026-10-19');
  assert.ok(problems.some((p) => pattern.test(p)), `expected ${pattern}, got ${JSON.stringify(problems)}`);
}

test('a valid week has no problems', () => assert.deepEqual(validateWeek(good(), '2026-10-19'), []));

test('week problems are caught', () => {
  expectProblem((w) => { w.id = '2026-10-12'; }, /"id" is/);
  expectProblem((w) => { delete w.label; }, /label/);
  expectProblem((w) => { w.tests[0].date = '2026-02-30'; }, /real date/);
  expectProblem((w) => { w.tests[0].kind = 'science'; }, /kind must be/);
  expectProblem((w) => { w.learning.push(['Math']); }, /learning\[6\]/);
  expectProblem((w) => { w.events.push({ date: 'Nov 1' }); }, /events\[4\]/);
  expectProblem((w) => { w.homework.push({ title: 'x' }); }, new RegExp(`homework\\[${WEEK_HOMEWORK}\\]`));
  // A practice link to an activity needs a section (Skill Builders > Rounding).
  expectProblem((w) => { w.homework[0] = { ...w.homework[0], practice: { label: 'x', lesson: '5-1', act: 'round' } }; }, /practice\.act needs a section/);
  expectProblem((w) => { w.spelling.words[0].rule = 'nope'; }, /rule "nope"/);
  expectProblem((w) => { w.spelling.words[1].word = w.spelling.words[0].word; }, /listed twice/);
  expectProblem((w) => { w.spelling.words[0].sentence = 'No word here.'; }, /must use "heating"/);
  expectProblem((w) => { w.spelling.words[0].word = 'two words'; }, /one word/);
  expectProblem((w) => { delete w.spelling.ruleHelp.add; }, /ruleHelp\.add/);
  expectProblem((w) => { w.spelling.words[2].img = '../x'; }, /picture name/);
  expectProblem((w) => { w.vocab.words[0].fill = 'No blank here.'; }, /exactly one ___/);
  expectProblem((w) => { w.vocab.words[0].fill = '___ and ___'; }, /exactly one ___/);
  expectProblem((w) => { w.vocab.words[0].fill = w.vocab.words[0].sentence = 'The ___ produce.'; }, /different from the sentence/);
  expectProblem((w) => { w.vocab.words[0].group = 'blue'; }, /green" or "purple/);
  expectProblem((w) => { w.vocab.words[0].def = ''; }, /def is missing/);
  expectProblem((w) => { w.math.words[0].example = [7, 1, 8]; }, /7 × 1 is 7, not 8/);
  expectProblem((w) => { w.math.words[0].example = [7, 1.5, 10.5]; }, /whole numbers/);
});

test('math is optional', () => {
  const w = good();
  delete w.math;
  assert.deepEqual(validateWeek(w, '2026-10-19'), []);
});

test('weeks.json problems are caught', () => {
  assert.deepEqual(validateIndex(goodIndex()), []);
  const cases = [
    [(i) => { i.current = '2026-10-26'; }, /"current"/],
    [(i) => { i.weeks.reverse(); }, /newest first/],
    [(i) => { i.weeks.push({ ...i.weeks[0] }); }, /listed twice|newest first/],
    [(i) => { i.weeks[0].id = '10/19/2026'; }, /date like/],
    [(i) => { i.weeks = []; }, /at least one week/],
  ];
  for (const [mutate, pattern] of cases) {
    const i = goodIndex();
    mutate(i);
    const problems = validateIndex(i);
    assert.ok(problems.some((p) => pattern.test(p)), `expected ${pattern}, got ${JSON.stringify(problems)}`);
  }
});
