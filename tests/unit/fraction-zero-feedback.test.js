import test from 'node:test';
import assert from 'node:assert/strict';
import { check, validateQuiz } from '../../js/lib/lessons.js';
import { teachingFeedbackFor } from '../../js/views/lesson.js';

test('zero numerator means an empty amount only with a positive denominator; undefined 0/0 takes precedence', () => {
  const model = { type: 'fraction', kind: 'bar', parts: 6, wholes: 1, selected: [0, 1, 2, 3, 4, 5] };
  const node = (when) => ({ when, text: `Explain ${when}.`, model });
  const zeroN = node('zeroNumerator'), zeroD = node('zeroDenominator');
  const item = { id: 'zero-whole', type: 'fraction', prompt: 'Write a fraction equal to this complete whole.', asks: 'fraction', answer: { n: 1, d: 1 }, answerPolicy: 'value', model,
    teaching: { steps: [node('first'), node('last')], correct: { text: 'All parts fill one whole.', model },
      wrong: [{ response: { n: 0 }, text: 'An overly broad exact response must not hide denominator zero.', model }, zeroN, zeroD, node('default')] } };
  assert.deepEqual(validateQuiz([item], 1, 'zero feedback'), []);
  for (const response of [{ n: '0', d: '2' }, { n: '00', d: '06' }]) {
    assert.equal(check(item, response, {}).status, 'notyet');
    assert.equal(teachingFeedbackFor({ id: '7-4' }, item, response, 'notyet'), zeroN);
  }
  assert.equal(teachingFeedbackFor({ id: '7-4' }, item, { n: '0', d: '0' }, 'notyet'), zeroD);
  for (const response of [{ n: '2', d: '2' }, { n: '8', d: '8' }]) assert.equal(check(item, response, {}).status, 'correct');
  const malformed = structuredClone(item); malformed.teaching.wrong[1].when = 'unsupportedZero';
  assert.ok(validateQuiz([malformed], 1, 'bad condition').some((message) => message.includes('unknown teaching condition')));
});
