// The proofreading gate (scripts/proofread.mjs): it catches the slips found by the 2026-11-12 text audit, and every
// Study Scoop string in data/ passes it. Teacher-source text is reported, never changed silently.
import test from 'node:test';
import assert from 'node:assert/strict';
import { proofreadText, proofreadFiles } from '../../scripts/proofread.mjs';

test('the gate catches the kinds of slips the audit found', () => {
  for (const [bad, rule] of [
    ['Each whole has 1 equal parts.', 'one-plural'], ['The marked tick is 1 steps from zero.', 'one-plural'], ['1 equal piece are colored.', 'one-verb'],
    ['Short skills to practise any week.', 'british'], ['Put it in the the box.', 'doubled'], ['two-fifths means 2 parts out of 5. Count them all.', 'lower-start'],
    ['Count the visible equal parts for a positive bottom number.', 'jargon'], ['VOCAPULARY', 'misspelled'], ['Count the parts (all of them.', 'brackets'],
  ]) assert.ok(proofreadText(bad).some((f) => f.rule === rule), `${rule}: ${bad}`);
  for (const good of ['The rows have 3, 1 and 1 squares.', 'One side is marked with a ?. You can find the ? side.', 'Count 1 of the 5 objects.', 'The heading read "VOCAPULARY" and was repaired.'])
    assert.deepEqual(proofreadText(good), [], good);
});

test('every Study Scoop string in data/ passes the proofreading gate', () => {
  const found = proofreadFiles().filter((f) => f.source === 'study-scoop');
  assert.deepEqual(found.map((f) => `${f.file} ${f.path}: ${f.why}: ${f.match}`), []);
});
