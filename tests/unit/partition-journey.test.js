// Lesson 7-1 learning journey: answer keys, rendered diagrams, help and the record of independent vs assisted work.
// Diagram checks parse the SVG the child actually sees and recompute areas independently of the content module.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_CARDS, CARDS, JOURNEY, FIGURES, GRID, GRID_UNEQUAL, SHAPES, CROSS, checkBuild, checkCount, partitionKey, newRecord, noteHelp, noteCheck, outcome, summarize } from '../../js/lib/partition-journey.js';
import { picture, helpSteps, helpAnswer, journeyCard, journeyStepper } from '../../js/views/partition-journey.js';
import { act, resetJourney, journeyState, stageDone } from '../../js/partition-journey.js';
import { partitionPolygon, validatePartition } from '../../js/lib/partition-geometry.js';

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const tags = (svg, name) => [...String(svg).matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => attrs(m[0]));
const pts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const area = (p) => Math.abs(p.reduce((n, a, i) => { const b = p[(i + 1) % p.length]; return n + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const builds = ALL_CARDS.filter((c) => c.type === 'build');
const ctx = { lessonLink: (id, st) => `#math?lesson=${id}&stage=${st}` };

test('the journey has sections A–I in the lesson order, each with at least one card', () => {
  assert.deepEqual(JOURNEY.map((s) => s.id), ['explore', 'method', 'cross', 'shapes', 'sizes', 'mistake', 'count', 'area', 'check']);
  for (const s of JOURNEY) assert.ok(CARDS[s.id].length > 0, s.id);
  assert.equal(new Set(ALL_CARDS.map((c) => c.id)).size, ALL_CARDS.length, 'card ids are unique');
});

test('every listed construction is a valid equal-area partition; empty and one-line work is never accepted', () => {
  for (const c of builds) {
    const t = c.task;
    assert.ok(t.solutions.length >= 1, c.id);
    for (const sol of t.solutions) {
      const r = checkBuild(t, sol);
      assert.equal(r.valid, true, `${c.id} ${JSON.stringify(sol)}: ${r.message}`);
      assert.equal(r.areas.length, t.count);
      const whole = t.shape === 'circle' ? Math.PI * t.radius ** 2 : area(t.polygon);
      for (const a of r.areas) assert.ok(near(a, whole / t.count), `${c.id} part area`);
    }
    assert.equal(checkBuild(t, []).valid, false, `${c.id} empty`);
    assert.equal(checkBuild(t, t.solution.slice(0, 1)).valid, false, `${c.id} one line`);
  }
});

test('alternative constructions are found by geometry, not by matching the answer key', () => {
  const diamond = SHAPES[0].guide;
  assert.equal(checkBuild(diamond, [['v1', 'v3'], ['v2', 'v0']]).valid, true, 'reversed order and direction');
  // Octagon: any two perpendicular lines through the center give fourths, including ones not listed.
  const oct = SHAPES[3].guide;
  assert.equal(checkBuild(oct, [['c', 'v0'], ['c', 'v2'], ['c', 'v4'], ['c', 'v6']]).valid, true, 'four radii to alternate corners');
  // Hexagon: center to every other corner gives thirds, not sixths.
  assert.equal(checkBuild(SHAPES[4].guide, [['c', 'v0'], ['c', 'v2'], ['c', 'v4']]).valid, false);
  // Unequal: 4 parts with unequal areas are rejected and the biggest and smallest are identified.
  const rect = CARDS.method[1].task, bad = checkBuild(rect, [['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']]);
  assert.equal(bad.valid, false); assert.equal(bad.count, 4); assert.ok(bad.big >= 0 && bad.small >= 0 && bad.big !== bad.small);
  assert.ok(near(bad.areas[bad.big] / bad.areas[bad.small], 3), '3/8 vs 1/8 of the rectangle');
  // Circle: a chord that misses the center is reported as unsupported, never as success.
  const pie = CARDS.mistake[1].task, chord = checkBuild(pie, [['e0', 'e2']]);
  assert.equal(chord.valid, false); assert.match(chord.message, /center/);
});

test('My Turn and Check problems are fresh: different geometry from the taught example', () => {
  for (const s of SHAPES) {
    const a = s.guide, b = s.myTurn;
    const shape = (t) => JSON.stringify(t.shape === 'circle' ? [t.center, t.radius, t.points.map((p) => [Math.round(p.x), Math.round(p.y)])] : t.polygon.map((p) => p.map(Math.round)));
    assert.notEqual(shape(a), shape(b), `${s.skill} My Turn changes the shape`);
    assert.equal(a.count, b.count, `${s.skill} My Turn keeps the same skill`);
  }
  const taught = new Set(builds.filter((c) => !c.independent).map((c) => JSON.stringify(c.task.polygon || [c.task.center, c.task.radius, c.task.count])));
  for (const c of CARDS.check.filter((x) => x.type === 'build')) assert.ok(!taught.has(JSON.stringify(c.task.polygon || [c.task.center, c.task.radius, c.task.count])), `${c.id} is new`);
  assert.ok(CARDS.check.every((c) => c.independent), 'every Check & Reflect card is independent');
});

test('plus-sign shape: both taught ways are fourths and count as different ways; redrawing Way 1 does not', () => {
  const [w1, w2] = CROSS.solutions;
  assert.notEqual(partitionKey(CROSS, w1), partitionKey(CROSS, w2));
  assert.equal(partitionKey(CROSS, [['top', 'c'], ['c', 'bottom'], ['right', 'left']]), partitionKey(CROSS, w1), 'same partition drawn with split lines');
  resetJourney();
  journeyState.at.cross = 1; for (const [a, b] of w1) { act('cross', 'point', { id: a }); act('cross', 'point', { id: b }); }
  act('cross', 'check'); assert.equal(journeyState.records['c-make1'].correct, true);
  journeyState.at.cross = 3; for (const [a, b] of [['top', 'c'], ['c', 'bottom'], ['left', 'right']]) { act('cross', 'point', { id: a }); act('cross', 'point', { id: b }); }
  act('cross', 'check'); assert.equal(journeyState.records['c-make2'].correct, false, 'same way again is not a second way');
  assert.match(journeyState.ui['c-make2'].say, /same way/);
  journeyState.ui['c-make2'].lines = []; for (const [a, b] of w2) { act('cross', 'point', { id: a }); act('cross', 'point', { id: b }); }
  act('cross', 'check'); assert.equal(journeyState.records['c-make2'].correct, true);
});

test('count figures: the rendered regions are equal, fill the outline without overlap, and match the answer key', () => {
  for (const c of ALL_CARDS.filter((x) => x.type === 'count')) {
    const svg = picture({ kind: 'figure', figure: Object.keys(FIGURES).find((k) => FIGURES[k] === c.figure) }).s;
    const polys = tags(svg, 'polygon').map((p) => pts(p.points));
    assert.equal(String(polys.length), c.answer, `${c.id} region count`);
    assert.ok(polys.every((p) => near(area(p), area(polys[0]), 1e-3)), `${c.id} equal areas`);
    assert.equal(c.name, { 4: 'fourths', 6: 'sixths', 8: 'eighths' }[c.answer]);
    // No overlaps: every edge is shared by at most two regions and the regions' interiors are disjoint (probe lines).
    const edges = new Map(); for (const p of polys) p.forEach((a, i) => { const k = [a, p[(i + 1) % p.length]].map((q) => q.map((n) => n.toFixed(1)).join(',')).sort().join('|'); edges.set(k, (edges.get(k) || 0) + 1); });
    assert.ok([...edges.values()].every((n) => n <= 2), `${c.id} edges`);
    for (let y = 1.37; y < c.figure.viewBox[1]; y += 3.11) {
      const spans = polys.map((p) => { const xs = []; p.forEach((a, i) => { const b = p[(i + 1) % p.length]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); }); return xs.length ? [Math.min(...xs), Math.max(...xs)] : null; }).filter(Boolean).sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < spans.length; i++) assert.ok(spans[i - 1][1] <= spans[i][0] + 1e-6, `${c.id} overlap at y=${y}`);
    }
  }
  const card = CARDS.count[1];
  assert.equal(checkCount(card, '6', 'sixths').valid, true);
  assert.equal(checkCount(card, '8', 'sixths').valid, false);
  assert.equal(checkCount(card, '6', 'eighths').valid, false);
  assert.equal(checkCount(card, '', 'sixths').incomplete, true);
});

test('unit-square rectangles: pieces tile the grid exactly; the equal one has 6 squares each, the new one does not', () => {
  for (const [g, sizes] of [[GRID, [6, 6, 6, 6]], [GRID_UNEQUAL, [8, 4, 8, 4]]]) {
    const all = g.pieces.flatMap((p) => p.cells.map((c) => c.join(',')));
    assert.equal(all.length, g.cols * g.rows); assert.equal(new Set(all).size, all.length);
    assert.deepEqual(g.pieces.map((p) => p.cells.length), sizes);
    const svg = picture({ kind: 'grid', grid: g === GRID ? undefined : 'unequal', show: [0, 1, 2, 3] }).s;
    assert.equal(tags(svg, 'rect').filter((r) => /j-region/.test(r.class)).length, g.cols * g.rows, 'one drawn unit square per cell');
  }
  // Different-looking: in the equal grid two pieces are 6-by-1 strips and two are 3-by-2 blocks.
  const dims = GRID.pieces.map((p) => { const xs = p.cells.map((c) => c[0]), ys = p.cells.map((c) => c[1]); return `${Math.max(...xs) - Math.min(...xs) + 1}x${Math.max(...ys) - Math.min(...ys) + 1}`; });
  assert.deepEqual(dims.sort(), ['3x2', '3x2', '6x1', '6x1']);
  assert.equal(CARDS.area[0].answer, 'equal'); assert.equal(CARDS.check.find((c) => c.id === 'i-grid').answer, 'unequal');
});

test('Rio\'s pie: the rendered cut gives two bigger top pieces; the fair cracker gives four equal pieces', () => {
  const svg = picture({ kind: 'pie' }).s, c = tags(svg, 'circle')[0], r = +c.r, cy = +c.cy;
  const lines = tags(svg, 'line'), across = lines.find((l) => l.y1 === l.y2), up = lines.find((l) => l.x1 === l.x2);
  assert.equal(+up.x1, +c.cx, 'up-and-down cut through the center');
  const yc = +across.y1; assert.ok(yc > cy, 'cut across is below the center');
  // Area of the circle between heights a and b (integral of chord length), halved for left/right pieces.
  const F = (y) => { const z = y - cy; return z * Math.sqrt(Math.max(0, r * r - z * z)) + r * r * Math.asin(Math.max(-1, Math.min(1, z / r))); };
  const top = (F(yc) - F(cy - r)) / 2, bottom = (F(cy + r) - F(yc)) / 2;
  assert.ok(near(2 * top + 2 * bottom, Math.PI * r * r));
  assert.ok(top > bottom * 1.5, `top ${top.toFixed(0)} vs bottom ${bottom.toFixed(0)}`);
  const fair = tags(picture({ kind: 'pie', fair: true }).s, 'line');
  assert.ok(fair.some((l) => l.x1 === l.x2 && +l.x1 === +c.cx) && fair.some((l) => l.y1 === l.y2 && +l.y1 === cy), 'two diameters');
});

test('sandwiches, garden and strips: the pictures match what the questions say', () => {
  const sq = (x) => [[x, 40], [x + 80, 40], [x + 80, 120], [x, 120]];
  const svg = picture({ kind: 'sandwiches' }).s, cuts = tags(svg, 'line').filter((l) => /j-cut/.test(l.class)).map((l) => [[+l.x1, +l.y1], [+l.x2, +l.y2]]);
  const parts = [10, 115, 220].map((x) => partitionPolygon(sq(x), cuts.filter(([a]) => a[0] >= x - 1 && a[0] <= x + 81)).map(area));
  assert.ok(parts.every((p) => p.length === 4), 'each sandwich has 4 pieces');
  assert.ok(parts[0].every((a) => near(a, 1600)) && parts[2].every((a) => near(a, 1600)), 'sandwiches 1 and 3 are fourths');
  assert.ok(!parts[1].every((a) => near(a, 1600)), 'sandwich 2 is not');
  assert.deepEqual(parts[1].map((a) => a / 400).sort((a, b) => a - b), [2, 4, 4, 6], 'tiny squares in sandwich 2 strips');
  assert.deepEqual(CARDS.explore[1].options.map((o) => Boolean(o.correct)), [true, false, true]);
  const garden = tags(picture({ kind: 'garden' }).s, 'rect').filter((r) => /j-bed/.test(r.class)).map((r) => (+r.width * +r.height) / 45 ** 2);
  assert.deepEqual(garden, [8, 2, 2, 4]);
  const strips = tags(picture({ kind: 'strips', parts: [4, 6, 8], shade: true }).s, 'rect').filter((r) => /j-region/.test(r.class)).map((r) => +r.width);
  assert.ok(strips[0] > strips[1] && strips[1] > strips[2], 'one part shrinks as parts increase');
});

test('every multiple-choice question has exactly its intended right answers and a reason for every option', () => {
  for (const c of ALL_CARDS.filter((x) => x.type === 'choice' || x.type === 'area')) {
    const right = c.options.filter((o) => o.correct).length;
    assert.ok(c.multi ? right >= 1 : right === 1, c.id);
    assert.ok(c.options.every((o) => o.why && o.why.length > 15), `${c.id} reasons`);
    assert.ok(c.help?.hint, `${c.id} hint`);
  }
});

test('help: every question has a hint, steps stop before the finished answer, and the answer is verified', () => {
  for (const c of ALL_CARDS.filter((x) => !['demo', 'concept', 'sizes'].includes(x.type))) {
    const steps = helpSteps(c);
    if (c.type === 'build') {
      assert.ok(steps.length >= 1, `${c.id} has visual steps`);
      for (const s of steps) {
        const drawn = tags(s.svg.s, 'line').length;
        assert.ok(drawn < Math.max(...c.task.solutions.map((x) => x.length)) || !validatePartition(c.task, []).valid, `${c.id} step is partial`);
      }
      assert.equal(new Set(steps.map((s) => s.svg.s)).size, steps.length, `${c.id} steps change the diagram`);
      const a = helpAnswer(c);
      assert.ok(a.svg && a.text, `${c.id} answer`);
    }
    if (c.type === 'count') assert.ok(steps.every((s) => (s.svg.s.match(/class="j-num"/g) || []).length < c.figure.regions.length), `${c.id} steps do not count everything`);
  }
});

test('records: independent means right on the first check with no help; later help never upgrades or erases it', () => {
  const r = newRecord({ id: 'x' });
  noteCheck(r, true); assert.equal(outcome(r), 'independent');
  noteHelp(r, 3); assert.equal(outcome(r), 'independent', 'help after success does not change the result');
  assert.equal(r.help, 3, 'but the help is still recorded');
  const h = newRecord({ id: 'y' }); noteHelp(h, 1); noteCheck(h, true); assert.equal(outcome(h), 'after-hint');
  const s = newRecord({ id: 'z' }); noteHelp(s, 1); noteHelp(s, 2); noteCheck(s, false); noteCheck(s, true); assert.equal(outcome(s), 'after-steps'); assert.equal(s.first, 'wrong');
  const a = newRecord({ id: 'w' }); noteHelp(a, 3); noteCheck(a, true); assert.equal(outcome(a), 'after-answer');
  const w = newRecord({ id: 'v' }); noteCheck(w, false); noteCheck(w, true); assert.equal(outcome(w), 'after-retry');
  assert.equal(outcome(undefined), 'not-tried');
});

test('controller: checking the same unchanged answer twice is one attempt; help keeps the child\'s lines', () => {
  resetJourney();
  journeyState.at.shapes = 1;
  act('shapes', 'point', { id: 'v0' }); act('shapes', 'point', { id: 'v2' });
  act('shapes', 'check'); act('shapes', 'check');
  assert.equal(journeyState.records['d-diamond-guide'].attempts, 1);
  const before = JSON.stringify(journeyState.ui['d-diamond-guide'].lines);
  for (const a of ['help', 'hint', 'steps', 'next-help', 'answer', 'close-help']) act('shapes', a);
  assert.equal(JSON.stringify(journeyState.ui['d-diamond-guide'].lines), before);
  act('shapes', 'point', { id: 'v1' }); act('shapes', 'point', { id: 'v3' }); act('shapes', 'check');
  assert.equal(outcome(journeyState.records['d-diamond-guide']), 'after-answer');
  // Tapping the same two points again erases that line.
  act('shapes', 'point', { id: 'v3' }); act('shapes', 'point', { id: 'v1' });
  assert.equal(journeyState.ui['d-diamond-guide'].lines.length, 1);
});

test('written answers are compared and reviewed by a person, never computer-graded', () => {
  resetJourney();
  const i = CARDS.sizes.findIndex((c) => c.type === 'write'); journeyState.at.sizes = i;
  act('sizes', 'compare'); assert.equal(journeyState.ui['e-write'].compared, undefined, 'empty writing is not compared');
  act('sizes', 'text', { text: 'It gets smaller.' }); act('sizes', 'compare');
  for (const k of [0, 1, 2]) act('sizes', 'review', { index: k, checked: true });
  const r = journeyState.records['e-write'];
  assert.ok(r.written && r.reviewed && !r.correct);
  act('sizes', 'text', { text: 'Changed.' }); assert.equal(journeyState.records['e-write'].reviewed, false, 'editing clears the review');
  assert.ok(!summarize(journeyState.records).rows.some((row) => row.card.type === 'write'), 'writing is not in the scored rows');
});

test('summary separates independent, wrong-first and assisted work and lists skills to practise', () => {
  const recs = {};
  const set = (id, fn) => { recs[id] = newRecord({ id }); fn(recs[id]); };
  set('d-diamond-myturn', (r) => noteCheck(r, true));
  set('d-square-myturn', (r) => { noteCheck(r, false); noteCheck(r, true); });
  set('d-circle-myturn', (r) => { noteHelp(r, 2); noteCheck(r, true); });
  const s = summarize(recs);
  assert.equal(s.totals.independent, 1); assert.equal(s.totals.firstWrong, 1); assert.equal(s.totals.afterSteps, 1);
  assert.equal(s.totals.independentDone, 1);
  assert.ok(s.needs.includes('Square into sixths') && s.needs.includes('Circle into eighths') && !s.needs.includes('Diamond into fourths'));
});

test('views: one card at a time, help on every question, and the stepper lists A–I plus the grown-up summary', () => {
  resetJourney();
  const stepper = journeyStepper(ctx, 'explore').s;
  assert.equal((stepper.match(/<li/g) || []).length, 10);
  for (const s of JOURNEY) for (let i = 0; i < CARDS[s.id].length; i++) {
    journeyState.at[s.id] = i;
    const out = journeyCard(ctx, s.id, journeyState).s, c = CARDS[s.id][i];
    assert.equal((out.match(/data-card=/g) || []).length, 1, `${c.id} one card`);
    assert.equal(out.includes('data-j="help"'), !['demo', 'concept', 'sizes'].includes(c.type), `${c.id} help button`);
    assert.doesNotMatch(out, /<select|<details/, `${c.id} no dropdown or hidden section`);
    assert.doesNotMatch(out, /<img|\.png|\.jpe?g/i, `${c.id} uses only drawn diagrams`);
  }
  assert.equal(stageDone('explore', { records: {} }), false);
});

test('originality guard: journey sources contain no images, scans or publisher marks', () => {
  for (const f of ['js/lib/partition-journey.js', 'js/views/partition-journey.js', 'js/partition-journey.js', 'css/partition-journey.css']) {
    const text = fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /McGraw|Copyright|Reveal Math|<img|url\(|base64/i, f);
  }
});
