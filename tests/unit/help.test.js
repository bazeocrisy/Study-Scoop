// Help (one step at a time after a wrong answer) and "why it is wrong" explanations, across the whole site.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { check, explainNumber, explainWord, helpSteps, solution } from '../../js/lib/lessons.js';
import { mathItems, mathWordItems, spellingItems, vocabItems } from '../../js/lib/activities.js';

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url)));
const weeks = read('data/weeks.json');
const WEEK = read(`data/${weeks.current}.json`);
const LESSONS = ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6', '5-7'].map((id) => read(`data/lessons/${id}.json`));
const MATH = read('data/practice/math.json');
const MW = read('data/practice/math-words.json');

/** Every practice question on the site (lessons, Practice Problems, Math Vocabulary, Spelling, Vocabulary). */
function everyPractice() {
  const out = [];
  for (const l of LESSONS) {
    l.learn.screens.filter((s) => s.item).forEach((s) => out.push([`${l.id} learn`, s.item, l]));
    l.watch.examples.filter((e) => e.why).forEach((e) => out.push([`${l.id} watch`, e.why, l]));
    for (const st of ['together', 'try']) l[st].items.forEach((it) => out.push([`${l.id} ${st}`, it, l]));
  }
  for (const act of ['props', 'split', 'breakapart', 'mixed']) mathItems(MATH, act).forEach((it) => out.push([`math ${act}`, it, {}]));
  for (const act of ['wchoice', 'wtf', 'wfill']) mathWordItems(MW, act).forEach((it) => out.push([`math words ${act}`, it, {}]));
  for (const k of ['choice', 'truefalse', 'fill']) vocabItems(WEEK, k).forEach((it) => out.push([`vocab ${k}`, it, {}]));
  for (const k of ['letters', 'listen']) spellingItems(WEEK, k).forEach((it) => out.push([`spelling ${k}`, it, {}]));
  return out;
}

test('every practice question on the site has at least two Help steps, and the answer only comes in the worked steps', () => {
  const all = everyPractice();
  assert.ok(all.length > 400, `${all.length} questions`);
  for (const [where, item] of all) {
    const steps = helpSteps(item);
    assert.ok(steps.length >= 2, `${where} ${item.id}: ${steps.length} Help step(s)`);
    assert.equal(steps.at(-1).kind, 'show', `${where} ${item.id}`);
    for (const s of steps) assert.ok(typeof s.text === 'string' && s.text.trim() && !/undefined|\.\.$/.test(s.text), `${where} ${item.id}: "${s.text}"`);
  }
});

test('every wrong answer gets a reason (not just "Try again"), and the reason never states the answer', () => {
  for (const [where, item, lesson] of everyPractice()) {
    const sol = solution(item);
    let wrongs = [];
    if (item.type === 'choice') wrongs = item.options.map((o, i) => (o.correct ? null : { choice: String(i) })).filter(Boolean);
    else if (item.type === 'number') wrongs = [{ answer: String(sol.answer + 3) }, { answer: String(Math.max(0, sol.answer - 1)) }].filter((r) => Number(r.answer) !== sol.answer);
    else if (item.type === 'word' || item.type === 'spell') wrongs = [{ text: 'zzz' }, ...(item.bank || []).filter((w) => w !== item.answer).map((w) => ({ text: w }))];
    for (const r of wrongs) {
      const out = check(item, r, lesson);
      assert.equal(out.status, 'notyet', `${where} ${item.id} ${JSON.stringify(r)}`);
      assert.ok(out.say && out.say !== 'Try again.', `${where} ${item.id}: "${out.say}"`);
      if (item.type === 'number') assert.ok(!new RegExp(`\\b${sol.answer}\\b`).test(out.say) || (item.mistakes || []).length, `${where} ${item.id} gives away ${sol.answer}: ${out.say}`);
      if (item.type === 'word' || item.type === 'spell') assert.ok(!out.say.toLowerCase().includes(`"${item.answer}"`) && !new RegExp(`\\b${item.answer}\\b`, 'i').test(out.say.replace(/the [a-z]+ property:/gi, '')) || item.kind === 'fill-eq', `${where} ${item.id} gives away the word: ${out.say}`);
    }
  }
});

test('typed numbers: added factors, one group too many or too few, too big or too small', () => {
  const it = { type: 'number', answer: '6 × 7', prompt: '6 × 7 = ?' };
  assert.equal(explainNumber(it, 13), 'You added: 6 + 7 = 13. 6 × 7 means 6 groups of 7, so multiply.');
  assert.equal(explainNumber(it, 35), '35 is 5 groups of 7. You need 6 groups of 7.');
  assert.equal(explainNumber(it, 49), '49 is 7 groups of 7. You need 6 groups of 7.');
  // Off by one factor of 6: still said as 6 groups (the way the question reads).
  assert.equal(explainNumber(it, 36), '36 is 6 groups of 6. Each group needs 7.');
  assert.equal(explainNumber(it, 48), '48 is 6 groups of 8. Each group needs 7.');
  assert.equal(explainNumber(it, 50), '50 is too big.');
  assert.equal(explainNumber(it, 40), '40 is too small.');
  for (const x of [0, 1, 13, 35, 36, 41, 43, 48, 49, 99]) assert.ok(!/\b42\b/.test(explainNumber(it, x)), `never says 42 (${x})`);
  // Times 1 and times 0: group messages would name the answer, so only too big or too small.
  assert.equal(explainNumber({ type: 'number', answer: '8 × 1', prompt: '8 × 1 = ?' }, 7), '7 is too small.');
  assert.equal(explainNumber({ type: 'number', answer: '8 × 1', prompt: '8 × 1 = ?' }, 16), '16 is too big.');
  // Factors the child cannot see (a story that never says "10") get no group message.
  assert.equal(explainNumber({ type: 'number', answer: '10 × 8', prompt: '9 rows of 8 cars, then 1 more row. How many cars?' }, 18), '18 is too small.');
});

test('typed words: another word from the bank says what it means; spelling says which letter to check', () => {
  const fill = vocabItems(WEEK, 'fill').find((it) => it.bank.length > 1);
  const other = fill.bank.find((w) => w !== fill.answer);
  const said = check(fill, { text: other }).say;
  assert.match(said, /means: .*does not fit this sentence/);
  assert.match(check(fill, { text: 'qqq' }).say, /^Use one of the words in the word bank\./);
  assert.equal(explainWord({ answer: 'heating' }, 'heeting'), 'The first 2 letters are right. Check letter 3.');
  assert.equal(explainWord({ answer: 'heating' }, 'jeating'), 'Check the first letter.');
  assert.equal(explainWord({ answer: 'heating' }, 'heat'), 'You typed 4 letters. The word has 7 letters.');
  const mw = mathWordItems(MW, 'wfill')[0];
  const wrongProp = ['identity', 'zero', 'commutative', 'associative', 'distributive'].find((w) => w !== mw.answer);
  assert.match(check(mw, { text: wrongProp }).say, /^The [A-Z][a-z]+ Property: .+ show that\?/);
});
