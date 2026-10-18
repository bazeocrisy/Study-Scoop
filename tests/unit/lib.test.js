// Routing, dates and HTML escaping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHash, parseHash, resolveWeek } from '../../js/lib/router.js';
import { countdownLabel, daysUntil, formatLongDate, parseISODate } from '../../js/lib/dates.js';
import { esc, html, raw } from '../../js/lib/html.js';
import { SECTION_IDS, SECTIONS } from '../../js/sections.js';

const INDEX = { current: '2026-10-19', weeks: [{ id: '2026-10-19' }, { id: '2026-10-12' }] };

test('there are exactly seven sections in the approved order', () => {
  assert.deepEqual(SECTIONS.map((s) => s.label),
    ['This Week', 'Spelling', 'Vocabulary', 'Math', 'Quick Math', 'Homework', 'Newsletter']);
});

test('parseHash reads sections and weeks', () => {
  assert.deepEqual(parseHash('', SECTION_IDS), { section: 'week', week: null, lesson: null, stage: null, known: true });
  assert.deepEqual(parseHash('#', SECTION_IDS), { section: 'week', week: null, lesson: null, stage: null, known: true });
  for (const id of SECTION_IDS) assert.deepEqual(parseHash(`#${id}`, SECTION_IDS), { section: id, week: null, lesson: null, stage: null, known: true });
  assert.deepEqual(parseHash('#vocab?week=2026-10-12', SECTION_IDS), { section: 'vocab', week: '2026-10-12', lesson: null, stage: null, known: true });
  assert.deepEqual(parseHash('#nope', SECTION_IDS), { section: 'week', week: null, lesson: null, stage: null, known: false });
  assert.deepEqual(parseHash('#nope?week=2026-10-12', SECTION_IDS), { section: 'week', week: '2026-10-12', lesson: null, stage: null, known: false });
  assert.deepEqual(parseHash('#math?week=', SECTION_IDS), { section: 'math', week: null, lesson: null, stage: null, known: true });
});

test('lesson routes live under Math and keep the week', () => {
  assert.deepEqual(parseHash('#math?lesson=5-1&stage=watch', SECTION_IDS), { section: 'math', week: null, lesson: '5-1', stage: 'watch', known: true });
  assert.deepEqual(parseHash('#math?week=2026-10-12&lesson=5-2', SECTION_IDS), { section: 'math', week: '2026-10-12', lesson: '5-2', stage: null, known: true });
  // Only Math has lessons, and a lesson id must be safe to put in a file path.
  assert.equal(parseHash('#vocab?lesson=5-1', SECTION_IDS).lesson, null);
  for (const bad of ['../x', '5-1/../a', '<b>', '']) assert.equal(parseHash(`#math?lesson=${encodeURIComponent(bad)}`, SECTION_IDS).lesson, null, bad);
  assert.equal(buildHash('math', '2026-10-19', '2026-10-19', { lesson: '5-1', stage: 'try' }), '#math?lesson=5-1&stage=try');
  assert.equal(buildHash('math', '2026-10-12', '2026-10-19', { lesson: '5-1' }), '#math?week=2026-10-12&lesson=5-1');
  assert.equal(buildHash('vocab', '2026-10-19', '2026-10-19', { lesson: '5-1' }), '#vocab');
});

test('buildHash leaves the current week out of the address', () => {
  assert.equal(buildHash('spelling', '2026-10-19', '2026-10-19'), '#spelling');
  assert.equal(buildHash('spelling', '2026-10-12', '2026-10-19'), '#spelling?week=2026-10-12');
  assert.equal(buildHash('week', null, '2026-10-19'), '#week');
});

test('round trip: every section and week survives build then parse', () => {
  for (const id of SECTION_IDS) {
    for (const { id: week } of INDEX.weeks) {
      const r = parseHash(buildHash(id, week, INDEX.current), SECTION_IDS);
      assert.equal(r.section, id);
      assert.equal(resolveWeek(r.week, INDEX), week);
    }
  }
});

test('resolveWeek falls back to the current week', () => {
  assert.equal(resolveWeek(null, INDEX), '2026-10-19');
  assert.equal(resolveWeek('2026-10-12', INDEX), '2026-10-12');
  assert.equal(resolveWeek('2030-01-01', INDEX), '2026-10-19');
  assert.equal(resolveWeek('<script>', INDEX), '2026-10-19');
});

test('parseISODate accepts only real dates', () => {
  assert.deepEqual(parseISODate('2026-10-21'), { y: 2026, m: 10, d: 21 });
  assert.deepEqual(parseISODate('2028-02-29'), { y: 2028, m: 2, d: 29 });
  for (const bad of ['2026-02-29', '2026-13-01', '2026-10-32', '2026-1-5', 'Oct 21', '', null, undefined]) {
    assert.equal(parseISODate(bad), null, String(bad));
  }
});

test('daysUntil counts calendar days regardless of the time of day', () => {
  const morning = new Date(2026, 9, 16, 0, 5);
  const night = new Date(2026, 9, 16, 23, 55);
  for (const now of [morning, night]) {
    assert.equal(daysUntil('2026-10-16', now), 0);
    assert.equal(daysUntil('2026-10-17', now), 1);
    assert.equal(daysUntil('2026-10-21', now), 5);
    assert.equal(daysUntil('2026-10-15', now), -1);
  }
  // Across the US daylight-saving change (Nov 1, 2026) the count is still whole days.
  assert.equal(daysUntil('2026-11-02', new Date(2026, 9, 31, 12)), 2);
  assert.equal(daysUntil('2027-01-01', new Date(2026, 11, 31, 23, 59)), 1);
  assert.equal(daysUntil('bad', morning), null);
});

test('countdown labels', () => {
  assert.equal(countdownLabel(-3), 'Finished');
  assert.equal(countdownLabel(0), 'Today');
  assert.equal(countdownLabel(1), 'Tomorrow');
  assert.equal(countdownLabel(7), 'In 7 days');
  assert.equal(countdownLabel(null), '');
});

test('formatLongDate names the right weekday', () => {
  assert.equal(formatLongDate('2026-10-21'), 'Wednesday, October 21');
  assert.equal(formatLongDate('2026-10-23'), 'Friday, October 23');
  assert.equal(formatLongDate('2026-10-16'), 'Friday, October 16');
  assert.equal(formatLongDate('not a date'), 'not a date');
});

test('html escapes every interpolated value', () => {
  assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  const evil = '<img src=x onerror=alert(1)>';
  assert.equal(html`<p>${evil}</p>`.s, '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  assert.equal(html`<p title="${'" onmouseover="x'}">`.s, '<p title="&quot; onmouseover=&quot;x">');
  assert.equal(html`${[1, '<', raw('<b>')]}`.s, '1&lt;<b>');
  assert.equal(html`a${null}${undefined}${false}b${0}`.s, 'ab0');
});
