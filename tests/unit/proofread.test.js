// The proofreading gate (scripts/proofread.mjs): it catches the slips found by the 2026-11-12 text audit, and every
// Study Scoop string in data/ passes it. Teacher-source text is reported, never changed silently.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { proofreadText, proofreadFiles, proofreadCode } from '../../scripts/proofread.mjs';

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

test('the gate reads vocabulary entries, notes and the text in code, games and labs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-proof-'));
  const week = path.join(dir, 'week.json'), page = path.join(dir, 'page.js');
  fs.writeFileSync(week, JSON.stringify({ vocab: { words: [{ word: 'Peculiar', def: 'strange or unusual', sentence: 'The the cat looked peculiar.', note: 'Short skills to practise.' }] }, spelling: { words: ['tractor', 'form'] } }));
  fs.writeFileSync(page, "// a comment that says practise is ignored\nconst label = 'Short skills to practise any week.';\nconst ok = 'Lesson 7-1 parts';");
  const data = proofreadFiles([week]), code = proofreadCode([page]);
  assert.ok(data.some((f) => f.rule === 'doubled' && /sentence/.test(f.path)), 'vocabulary sentence');
  assert.ok(data.some((f) => f.rule === 'british' && /note/.test(f.path)), 'note');
  assert.equal(code.length, 1); assert.equal(code[0].rule, 'british');
  assert.deepEqual(proofreadCode().map((f) => `${f.file}: ${f.why}: ${f.match}`), [], 'site code, games and labs');
});
