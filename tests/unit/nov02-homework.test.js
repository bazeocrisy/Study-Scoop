// Release regression: received assignments must open usable activities, not metadata only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { packetItems, validatePacket } from '../../js/lib/homework.js';
import { check, helpSteps, solution } from '../../js/lib/lessons.js';
import { runFor } from '../../js/activity-player.js';
import { activityInner } from '../../js/views/activity.js';
import { homeworkView } from '../../js/views/homework.js';
import { fractionFigure } from '../../js/views/packet-tools.js';

const read = p => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const week = read('data/2026-11-02.json');
const packet = read('data/homework/2026-11-02.json');
const items = packetItems(packet);
const ctx = {
  week, packet, weekId: week.id, section: 'homework', isCurrent: true,
  index: { current: week.id },
  link: section => `#${section}?week=${week.id}`,
  actLink: (section, act) => `#${section}?week=${week.id}&act=${act}`,
};
const textResponse = answer => Object.fromEntries(Object.entries(answer).map(([key, val]) => [key, String(val)]));

test('November received homework is four separately linked activities with math and reading groups', () => {
  assert.deepEqual(validatePacket(packet, week.id), []);
  const received = week.homework.filter(h => h.source === 'received');
  assert.equal(received.length, 4);
  assert.deepEqual(received.map(h => h.subject), ['Math', 'Math', 'Reading', 'Reading']);
  const ids = received.map(h => h.practice.act);
  assert.deepEqual(ids, packet.pages.map(p => p.id));
  assert.equal(new Set(ids).size, 4);
  const markup = homeworkView(ctx).s;
  for (const id of ids) assert.ok(markup.includes(`act=${id}`), `${id} opens from Homework`);
  assert.match(markup, /4 classroom assignments were/);
});

test('every fraction key accepts its answer, rejects reversed parts, and has help after a mistake', () => {
  const fractions = items.filter(it => it.fraction || it.fractionWords);
  assert.ok(fractions.length >= 20, 'substantial whole, set and word practice');
  assert.deepEqual(new Set(fractions.filter(it => it.fraction).map(it => it.fraction.kind)), new Set(['bar', 'circle', 'set']));
  for (const it of fractions) {
    const f = it.fraction || it.fractionWords;
    assert.equal(it.answer.a, f.n, `${it.id} numerator`);
    assert.equal(it.answer.b, f.d, `${it.id} denominator`);
    if (it.fractionWords) {
      const match = /^Write ([a-z]+)-([a-z]+) as a fraction\.$/.exec(it.prompt);
      assert.ok(match, `${it.id} number words are readable`);
      const numerators = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7};
      const denominators = {half:2,third:3,thirds:3,fourth:4,fourths:4,fifths:5,sixth:6,sixths:6,sevenths:7,eighth:8,eighths:8,ninths:9,tenths:10};
      assert.equal(it.answer.a, numerators[match[1]], `${it.id} numerator independently decoded from words`);
      assert.equal(it.answer.b, denominators[match[2]], `${it.id} denominator independently decoded from words`);
    }

    assert.equal(check(it, textResponse(solution(it))).status, 'correct', it.id);
    assert.equal(check(it, {a:String(f.d), b:String(f.n)}).status, 'notyet', `${it.id} swapped numerator/denominator`);
    assert.match(check(it, {a:String(f.d), b:String(f.n)}).say, /switched|numerator/i, `${it.id} explains reversed parts`);
    assert.match(check(it, {a:'0', b:'99'}).say, /numerator|denominator/i, `${it.id} explains a wrong fraction`);
    assert.ok(helpSteps(it).length >= 2, `${it.id} help`);
    if (it.fraction) {
      const svg = fractionFigure(f).s;
      const count = f.kind === 'set' ? (svg.match(/<circle/g) || []).length - f.n : (svg.match(f.kind === 'bar' ? /<rect/g : /<path/g) || []).length;
      assert.equal(count, f.d, `${it.id} visual part count`);
      assert.equal((svg.match(/fill="#583084"/g) || []).length, f.n, `${it.id} shaded parts`);
    }
  }
});

test('packet validation rejects broken fraction keys and unsafe fraction geometry metadata', () => {
  for (const mutate of [
    it => { it.answer.a++; },
    it => { it.answer.b++; },
    it => { it.fraction.n = -1; },
    it => { it.fraction.d = 0; },
    it => { it.fraction.n = it.fraction.d + 1; },
    it => { it.fraction.d = 2.5; },
    it => { it.fraction.kind = 'unsupported'; },
  ]) {
    const broken = structuredClone(packet);
    mutate(broken.pages[0].problems[0].items[0]);
    assert.ok(validatePacket(broken, week.id).some(e => /fraction/.test(e)), 'invalid fraction rejected');
  }
});

test('all four activity routes render their assignment controls, including question-free fluency', () => {
  const expected = { fractions: /data-partition="triangle"/, parts: /What fraction of this set/, fluency: /data-fluency="right1"/, comprehension: /<textarea/ };
  for (const pg of packet.pages) {
    const run = runFor(ctx, 'homework', pg.id);
    assert.equal(run.unavailable, false, pg.id);
    assert.ok(run.items.every(it => it.page === pg.id), `${pg.id} contains its own questions`);
    const rendered = activityInner({...ctx, run}).s;
    assert.match(rendered, expected[pg.id], `${pg.id} controls appear`);
    assert.match(rendered, /Back to Homework/);
    assert.doesNotMatch(rendered, /undefined|NaN|could not be loaded/);
  }
  const fluency = activityInner({...ctx, run: runFor(ctx, 'homework', 'fluency')}).s;
  assert.equal((fluency.match(/data-fluency=/g) || []).length, 6, 'three reads with WRR and errors');
  assert.match(fluency, /manual records, not automatic scores/);
});

test('comprehension preserves author-based questions and clearly limits automated checks', () => {
  const pg = packet.pages.find(p => p.id === 'comprehension');
  assert.equal(pg.problems.length, 2);
  assert.match(pg.problems[0].items[0].prompt, /author.*perfect place/);
  assert.match(pg.problems[1].items[0].prompt, /author buys.*waiting for a library/);
  for (const {items:[it]} of pg.problems) {
    assert.equal(it.type, 'sentence');
    const result = check(it, {text:'A complete sentence can still have incorrect meaning.'});
    assert.match(result.say, /Does it answer the question/);
    assert.match(it.explain, /grown-up checks/);
  }
  assert.match(pg.directions, /cannot grade your understanding/);
});

test('November public packet has original practice text and no source photographs or student identifiers', () => {
  const raw = JSON.stringify({week, packet});
  assert.doesNotMatch(raw, /\bChris\b|Christopher|Bazemore|IMG_301[1-4]|homework-private|Is there anything better than curling up/);
  assert.equal(week.homeworkPapers.pages.length, 4);
  assert.equal(week.homeworkPapers.reviewed, '2026-11-04');
  const pg = packet.pages.find(p => p.id === 'fluency');
  assert.match(pg.passage.title, /original optional practice/);
  assert.ok(pg.passage.text.split(/\s+/).length >= 150);
  assert.match(pg.directions, /Use your class paper/);
});
