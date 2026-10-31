// Homework packets (DECISIONS D23): Study Scoop's own version of the week's homework, to do on screen and download.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packetItems, passageLines, validatePacket } from '../../js/lib/homework.js';
import { check, helpSteps, solution } from '../../js/lib/lessons.js';
import { chainHolds } from '../../js/lib/arith.js';
import { buildSite, verifySite, REPO } from '../../scripts/build-site.js';

const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));
const PACKET = read('data/homework/2026-10-19.json');
const ITEMS = packetItems(PACKET);
const asText = (sol) => Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, String(v)]));
const byId = (id) => ITEMS.find((it) => it.id === id);

test('the packet is valid: three pages in the paper packet\'s order, 9 rounding problems, a story with 2 questions, 2 word problems', () => {
  assert.deepEqual(validatePacket(PACKET, '2026-10-19'), []);
  assert.deepEqual(PACKET.pages.map((p) => [p.id, p.problems.length]), [['rounding', 9], ['reading', 2], ['word', 2]]);
  assert.deepEqual(PACKET.pages[0].problems.map((p) => p.items[0].type), ['multi', 'blanks', 'multi', 'number', 'multi', 'number', 'choice', 'blanks', 'choice']);
  for (const it of ITEMS) {
    assert.equal(check(it, asText(solution(it))).status, 'correct', it.id);
    assert.ok(helpSteps(it).length >= 2, `${it.id} has step-by-step Help`);
  }
  assert.equal(PACKET.download, 'downloads/homework-2026-10-19.pdf');
});

test('the packet is Study Scoop\'s own: no names, story or numbers from the class worksheets', () => {
  const text = JSON.stringify(PACKET);
  // The class sheets used a story about two other children and these numbers; none of them may appear here.
  for (const banned of ['Carter', 'Cora', 'Martinez', 'Chang', 'Fall Friends', 'random act', 'Alex', 'cherries', 'pizza', '"555"', '"653"', '"612"', '"630"', '"63 ', '275', '"52"', '"57"', '"45"', '"58"', '"98"', '"85"', '"49"', '"110"', '"84"', '"420"', '"400"', '"500"', '"600"']) {
    assert.ok(!text.includes(banned), `contains ${banned}`);
  }
  assert.doesNotMatch(text, /\bChris\b|Christopher|Bazemore|\bMaya\b|\bJordan\b|\bSam\b/);
});

test('choose-all, number-line blanks and sentence answers each explain what is wrong', () => {
  const r1 = byId('r1');
  assert.equal(check(r1, { multi: '0,1' }).say, '451 rounds to 500. Its tens digit is 5, so the 4 goes up.');
  assert.match(check(r1, { multi: '0,2' }).say, /^You are close! One more answer is right/);
  assert.equal(check(r1, {}).status, 'empty');
  const r2 = byId('r2');
  assert.equal(check(r2, { a: '50', b: '40', c: '50', d: '40', e: '50' }).status, 'correct', 'either end first');
  assert.equal(check(r2, { a: '40', b: '50', c: '40', d: '50', e: '50' }).say, 'Look at the dot again. Is it nearer the 40 or the 50?');
  const q1 = byId('q1');
  assert.equal(check(q1, { text: 'because he had a cast.' }).say, 'Start your sentence with a capital letter.');
  assert.match(check(q1, { text: 'He had a cast.' }).say, /^Write a little more/);
  assert.match(check(q1, { text: 'He could not go to the patch with his leg.' }).say, /^Restate the question/);
  assert.equal(check(q1, { text: 'Nia and Owen brought a pumpkin because his leg was hurt' }).say, 'End your sentence with a period.');
  assert.match(check(q1, { text: 'Nia and Owen brought a pumpkin to Mr. Reyes because his leg was in a cast.' }).say, /^Your sentence has all its parts\. Does it answer the question\? Here is one way to say it/);
  // Division in equations: 24 ÷ 4 = 6, and the total comes first.
  assert.ok(chainHolds('24 ÷ 4 = 6'));
  assert.equal(check(byId('w1eq'), { a: '4', b: '24', c: '6' }).say, 'Start with the total, 24. Then divide by the number of bags.');
  assert.equal(check(byId('w2eq'), { a: '7', b: '5', c: '35' }).status, 'correct', 'a turned-around multiplication is fine');
});

test('the story is cut into lines with running word counts for a grown-up', () => {
  const lines = passageLines(PACKET.pages[1].passage.text);
  assert.equal(lines.at(-1).count, PACKET.pages[1].passage.text.trim().split(/\s+/).length);
  for (let k = 1; k < lines.length; k++) assert.ok(lines[k].count > lines[k - 1].count);
});

test('the published PDF must be printed by Study Scoop from its own page; a scan fails the build', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'hw-src-'));
  for (const s of ['index.html', 'flash-cards', 'css', 'js', 'data', 'images', 'fonts', 'downloads']) fs.cpSync(path.join(REPO, s), path.join(src, s), { recursive: true });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'hw-out-'));
  buildSite(out, src);
  assert.deepEqual(verifySite(out), []);
  // Swap in a "scanned" PDF (any PDF Study Scoop did not print itself).
  fs.writeFileSync(path.join(out, 'downloads/homework-2026-10-19.pdf'), '%PDF-1.4\n/Producer (Scanner Pro 3)\n%%EOF');
  assert.ok(verifySite(out).some((p) => /never a scan/.test(p)));
  // A PDF no packet names is refused too.
  fs.writeFileSync(path.join(out, 'downloads/homework-2026-10-26.pdf'), fs.readFileSync(path.join(REPO, 'downloads/homework-2026-10-19.pdf')));
  assert.ok(verifySite(out).some((p) => /no homework packet names it/.test(p)));
});
