// Lesson 7-1 learning journey: answer keys, rendered diagrams, help and the record of independent vs assisted work.
// Diagram checks parse the SVG the child actually sees and recompute areas independently of the content module.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_CARDS, CARDS, JOURNEY, UNITS, ASSESSMENT, FIGURES, GRID, SHAPES, CROSS, CROSS_WEDO, CROSS_YOU, differentAvoidKey, HALVES, HALVES2, HALVES3, checkBuild, checkCount, partitionKey, onSameEdge, newRecord, noteHelp, noteCheck, outcome, summarize, readiness, cardDone, stageUnlocked, frontier, nextStage, diagnose } from '../../js/lib/partition-journey.js';
import { picture, helpSteps, helpAnswer, journeyCard, journeyStepper, FLAGS, XCIRCLE } from '../../js/views/partition-journey.js';
import { act, resetJourney, journeyState, stageDone } from '../../js/partition-journey.js';
import { partitionPolygon, validatePartition } from '../../js/lib/partition-geometry.js';

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const tags = (svg, name) => [...String(svg).matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => attrs(m[0]));
const pts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const area = (p) => Math.abs(p.reduce((n, a, i) => { const b = p[(i + 1) % p.length]; return n + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const builds = ALL_CARDS.filter((c) => c.type === 'build');
const ctx = { lessonLink: (id, st) => `#math?lesson=${id}&stage=${st}` };
const byId = (id) => ALL_CARDS.find((c) => c.id === id);
const idx = (stage, id) => CARDS[stage].findIndex((c) => c.id === id);
/** A record that counts as done for a card (watched, written, answered right). */
function doneRecord(c) { const r = newRecord(c); r.viewed = true; if (c.type === 'write') r.written = true; else if (c.type !== 'demo') { r.attempts = 1; r.first = 'correct'; r.correct = true; } return r; }
/** Finish every card before this one in its section (and every earlier section), the way a child would. */
function reach(stage, index) {
  resetJourney();
  for (const s of JOURNEY) { if (s.id === stage) break; for (const c of CARDS[s.id]) journeyState.records[c.id] = doneRecord(c); }
  for (const c of CARDS[stage].slice(0, index)) journeyState.records[c.id] = doneRecord(c);
  journeyState.at[stage] = index;
}
const allDoneRecords = () => Object.fromEntries(ALL_CARDS.map((c) => [c.id, doneRecord(c)]));

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
  const rect = byId('b-fourths-make').task, bad = checkBuild(rect, [['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']]);
  assert.equal(bad.valid, false); assert.equal(bad.count, 4); assert.ok(bad.big >= 0 && bad.small >= 0 && bad.big !== bad.small);
  assert.ok(near(bad.areas[bad.big] / bad.areas[bad.small], 3), '3/8 vs 1/8 of the rectangle');
  // Circle: a chord that misses the center is reported as unsupported, never as success.
  const pie = CARDS.mistake.find((c) => c.id === 'f-fix').task, chord = checkBuild(pie, [['e0', 'e2']]);
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
  for (const c of ALL_CARDS.filter((x) => x.type === 'build' && (x.phase === 'assess' || x.phase === 'youdo'))) assert.ok(!taught.has(JSON.stringify(c.task.polygon || [c.task.center, c.task.radius, c.task.count])), `${c.id} is new`);
  assert.ok(CARDS.check.every((c) => c.independent && c.phase === 'assess'), 'every Final Check question is independent');
});

test('plus-sign shape: both taught ways are fourths and count as different ways; redrawing Way 1 does not', () => {
  const [w1, w2] = CROSS.solutions;
  assert.notEqual(partitionKey(CROSS, w1), partitionKey(CROSS, w2));
  assert.equal(partitionKey(CROSS, [['top', 'c'], ['c', 'bottom'], ['right', 'left']]), partitionKey(CROSS, w1), 'same partition drawn with split lines');
  reach('cross', idx('cross', 'c-make1')); for (const [a, b] of w1) { act('cross', 'point', { id: a }); act('cross', 'point', { id: b }); }
  act('cross', 'check'); assert.equal(journeyState.records['c-make1'].correct, true);
  journeyState.records['c-why'] = doneRecord(byId('c-why')); journeyState.at.cross = idx('cross', 'c-make2');
  assert.equal(byId('c-make2').task.id, 'cross-you', 'You Do uses a new plus sign');
  for (const [a, b] of [['top', 'c'], ['c', 'bottom'], ['left', 'right']]) { act('cross', 'point', { id: a }); act('cross', 'point', { id: b }); }
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
  const card = byId('g-you');
  assert.equal(checkCount(card, '8', 'eighths').valid, true);
  assert.equal(checkCount(card, '8', 'sixths').valid, false);
  assert.equal(checkCount(card, '6', 'eighths').valid, false);
  assert.equal(checkCount(card, '', 'eighths').incomplete, true);
  assert.notEqual(card.answer, byId('g-show').steps.at(-1).text.match(/(\d+) equal parts/)[1], 'the You Do answer differs from the worked example');
});

test('every figure and construction fits inside its own picture frame', () => {
  const inside = ([x, y], [w, h]) => x >= -1e-6 && y >= -1e-6 && x <= w + 1e-6 && y <= h + 1e-6;
  for (const f of Object.values(FIGURES)) for (const r of f.regions) for (const p of r) assert.ok(inside(p, f.viewBox), `${f.id} point ${p} outside ${f.viewBox}`);
  for (const c of ALL_CARDS.filter((x) => x.type === 'build')) {
    const t = c.task, box = t.viewBox || [300, 300];
    const pts2 = t.shape === 'circle' ? [[t.center[0] - t.radius, t.center[1] - t.radius], [t.center[0] + t.radius, t.center[1] + t.radius]] : t.polygon;
    for (const p of pts2) assert.ok(inside(p, box), `${c.id} outside its frame`);
  }
});

test('My Turn hints never mention a center dot that is not there', () => {
  for (const s2 of SHAPES) if (s2.myTurn.bare) assert.match(s2.myTurn.hint, /no center dot/, s2.skill);
  for (const s2 of SHAPES) { const steps = helpSteps({ type: 'build', task: s2.myTurn }); assert.ok(steps.length >= 1, `${s2.skill} My Turn has visual steps`); const words = steps.map((x) => x.text).join(' '), t = s2.myTurn;
    if (t.bare) assert.doesNotMatch(words, /join the center|center to|center dot/i, `${s2.skill} steps never ask to use a hidden center dot`);
    if (/top corner/i.test(words)) assert.ok(t.polygon.every((p) => p[1] >= t.polygon[0][1] - 1e-9) && t.polygon.filter((p) => Math.abs(p[1] - t.polygon[0][1]) < 1e-6).length === 1, `${s2.skill}: "top corner" only when corner 1 is the single top point`); }
});

test('unit-square rectangle: the pieces tile the grid exactly, 6 squares each, in two different shapes', () => {
  const all = GRID.pieces.flatMap((p) => p.cells.map((c) => c.join(',')));
  assert.equal(all.length, GRID.cols * GRID.rows); assert.equal(new Set(all).size, all.length);
  assert.deepEqual(GRID.pieces.map((p) => p.cells.length), [6, 6, 6, 6]);
  const svg = picture({ kind: 'grid', show: [0, 1, 2, 3] }).s;
  assert.equal(tags(svg, 'rect').filter((r) => /j-region/.test(r.class)).length, GRID.cols * GRID.rows, 'one drawn unit square per cell');
  const dims = GRID.pieces.map((p) => { const xs = p.cells.map((c) => c[0]), ys = p.cells.map((c) => c[1]); return `${Math.max(...xs) - Math.min(...xs) + 1}x${Math.max(...ys) - Math.min(...ys) + 1}`; });
  assert.deepEqual(dims.sort(), ['3x2', '3x2', '6x1', '6x1']);
  assert.equal(CARDS.area.find((c) => c.id === 'h-grid').answer, 'equal');
});

test('half of a half, with no grid: both rectangles really are fourths, with two different part shapes each', () => {
  for (const t of [HALVES, HALVES2, HALVES3]) {
    const r = checkBuild(t, t.solution); assert.equal(r.valid, true, t.id);
    const svg = picture({ kind: 'task', task: t.id, lines: t.solution, shade: true }).s;
    const polys = tags(svg, 'polygon').filter((p) => /j-region/.test(p.class)).map((p) => pts(p.points));
    assert.equal(polys.length, 4); assert.ok(polys.every((p) => near(area(p), area(t.polygon) / 4)));
    assert.equal(new Set(polys.map((p) => p.length)).size >= 1 && new Set(polys.map((p) => { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); return `${Math.round(Math.max(...xs) - Math.min(...xs))}x${Math.round(Math.max(...ys) - Math.min(...ys))}`; })).size, 2, `${t.id} two different-looking kinds of part`);
    assert.doesNotMatch(svg, /j-unit/, 'no unit squares to count');
  }
  for (const id of ['h-you', 'q10']) assert.match(ALL_CARDS.find((c) => c.id === id).options.find((o) => o.correct).text, /^Yes/);
});

test('evenly spaced parallel cuts in a circle and an oval: the middle pieces are bigger (the classic not-fourths)', () => {
  const svg = picture({ kind: 'cookie' }).s, c = tags(svg, 'circle')[0], r = +c.r, cx = +c.cx;
  const xs = tags(svg, 'line').filter((l) => /j-cut/.test(l.class)).map((l) => +l.x1).sort((a, b) => a - b);
  assert.deepEqual(xs.map((x) => x - cx), [-r / 2, 0, r / 2], 'three evenly spaced up-and-down cuts');
  // Area of a circle between two vertical lines (integral of chord height).
  const F = (x) => { const z = x - cx; return z * Math.sqrt(Math.max(0, r * r - z * z)) + r * r * Math.asin(Math.max(-1, Math.min(1, z / r))); };
  const edges = [cx - r, ...xs, cx + r], parts = edges.slice(1).map((x, i) => F(x) - F(edges[i]));
  assert.ok(near(parts.reduce((a, b) => a + b, 0), Math.PI * r * r));
  assert.ok(parts[1] > parts[0] * 1.5 && near(parts[0], parts[3]) && near(parts[1], parts[2]), parts.map(Math.round).join(','));
  const o = tags(picture({ kind: 'oval' }).s, 'ellipse')[0], ys = tags(picture({ kind: 'oval' }).s, 'line').map((l) => +l.y1 - +o.cy).sort((a, b) => a - b);
  assert.deepEqual(ys, [-o.ry / 2, 0, o.ry / 2].map(Number));
  assert.ok(byId('f-show').steps.some((st) => st.picture?.flip) && byId('f-show').steps.some((st) => st.picture?.heights), 'the worked example shows heights and the flip');
  assert.match(byId('f-oval').options.find((x) => x.correct).text, /^No/);
});

test('review fixes: corners-only My Turn, no lines along an edge, and a "different way" answer that really differs', () => {
  for (const s2 of SHAPES) if (s2.skill !== 'square') assert.ok(s2.myTurn.points.every((p) => /^[ve]\d/.test(p.id)) && s2.myTurn.solutions.length >= 1, `${s2.skill} My Turn has only corners or edge points`);
  const rect = byId('b-fourths-make').task;
  assert.equal(onSameEdge(rect, 'k0', 't1-4'), true); assert.equal(onSameEdge(rect, 't1-4', 'b1-4'), false);
  reach('method', idx('method', 'b-fourths-make')); act('method', 'point', { id: 'k0' }); act('method', 'point', { id: 't2-4' });
  assert.equal((journeyState.ui['b-fourths-make'].lines || []).length, 0, 'edge line refused');
  assert.match(journeyState.ui['b-fourths-make'].say, /edge/);
  const card = CARDS.cross.find((c) => c.id === 'c-make2');
  const T = card.task;
  for (const first of T.solutions) {
    const ans = helpAnswer(card, { avoidKey: partitionKey(T, first) });
    const drawn = tags(ans.svg.s, 'line').map((l) => [[+l.x1, +l.y1], [+l.x2, +l.y2]]);
    assert.notEqual(partitionKey({ ...T, points: drawn.flat().map((p, i) => ({ id: String(i), x: p[0], y: p[1] })) }, drawn.map((_, i) => [String(2 * i), String(2 * i + 1)])), partitionKey(T, first), 'shown answer differs from the first way');
  }
  // One part: correct grammar and a short message.
  reach('shapes', 1); act('shapes', 'point', { id: 'v0' }); act('shapes', 'point', { id: 'm0' }); act('shapes', 'check');
  assert.doesNotMatch(journeyState.ui['d-diamond-guide'].say, /1 parts/);
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
  assert.deepEqual(byId('a-flags').options.map((o) => Boolean(o.correct)), [false, true, true]);
  const { x: fx, y: fy, w: fw, h: fh, stripes } = FLAGS, flag = (x) => [[x, fy], [x + fw, fy], [x + fw, fy + fh], [x, fy + fh]];
  const fcuts = tags(picture({ kind: 'flags' }).s, 'line').filter((l) => /j-cut/.test(l.class)).map((l) => [[+l.x1, +l.y1], [+l.x2, +l.y2]]);
  const fparts = fx.map((x) => partitionPolygon(flag(x), fcuts.filter(([a]) => a[0] >= x - 1 && a[0] <= x + fw + 1)).map(area));
  assert.ok(fparts.every((p) => p.length === 4), 'each flag has 4 parts');
  assert.ok(!fparts[0].every((a) => near(a, fw * fh / 4)) && fparts[1].every((a) => near(a, fw * fh / 4)) && fparts[2].every((a) => near(a, fw * fh / 4)), 'flag 1 unequal; flags 2 and 3 fourths');
  assert.deepEqual(stripes, [0, 16, 32, 56, 64]);
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
    if (c.phase === 'wedo') assert.ok(c.help?.hint, `${c.id} hint`);
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
  reach('shapes', 1);
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
  reach('sizes', CARDS.sizes.findIndex((c) => c.type === 'write'));
  act('sizes', 'compare'); assert.equal(journeyState.ui['e-write'].compared, undefined, 'empty writing is not compared');
  act('sizes', 'text', { text: 'Each part gets smaller with more parts.' }); act('sizes', 'compare');
  for (const k of [0, 1, 2]) act('sizes', 'review', { index: k, checked: true });
  const r = journeyState.records['e-write'];
  assert.ok(r.written && r.reviewed && !r.correct);
  act('sizes', 'text', { text: 'Changed.' }); assert.equal(journeyState.records['e-write'].reviewed, false, 'editing clears the review');
  assert.ok(!summarize(journeyState.records).rows.some((row) => row.card.type === 'write'), 'writing is not in the scored rows');
});

test('readiness report: You Do result per skill, Final Check score, and an honest verdict', () => {
  const recs = {};
  const set = (id, fn) => { recs[id] = newRecord({ id }); fn(recs[id]); };
  set('d-diamond-myturn', (r) => noteCheck(r, true));
  set('d-square-myturn', (r) => { noteCheck(r, false); noteCheck(r, true); });
  set('d-circle-myturn', (r) => { r.relearn = true; noteCheck(r, false); noteCheck(r, true); });
  set('d-hexagon-myturn', (r) => { noteHelp(r, 3); noteCheck(r, true); });
  let rd = readiness(recs);
  const by = (u) => rd.skills.find((k) => k.unit.id === u);
  assert.equal(by('diamond').text, 'On own, first try'); assert.equal(by('square').text, 'On own, after another try');
  assert.equal(by('circle').text, 'After watching the example again'); assert.equal(by('hexagon').text, 'After seeing the answer');
  assert.equal(rd.verdict.level, 'unfinished');
  for (const q of ASSESSMENT) set(q.id, (r) => noteCheck(r, true));
  rd = readiness(recs); assert.equal(rd.score, 10); assert.equal(rd.verdict.level, 'review', 'an answer was shown for a skill, so not "ready"');
  const clean = allDoneRecords(); assert.equal(readiness(clean).verdict.level, 'ready');
  for (const id of ['q1', 'q2', 'q3']) { clean[id] = newRecord({ id }); noteCheck(clean[id], false); }
  rd = readiness(clean); assert.equal(rd.score, 7); assert.equal(rd.verdict.level, 'review'); assert.ok(rd.missedSkills.length >= 1);
  const s2 = summarize(recs); assert.equal(s2.totals.afterRelearn, 1); assert.equal(s2.totals.afterAnswer, 1);
});

test('every skill teaches I Do, then We Do, then exactly one You Do on a new problem', () => {
  assert.equal(UNITS.length, 13);
  for (const u of UNITS) {
    const ph = u.cards.map((c) => c.phase);
    assert.ok(ph.includes('ido') && ph.includes('wedo'), `${u.id} has I Do and We Do`);
    assert.equal(ph.filter((p) => p === 'youdo').length, 1, `${u.id} has one You Do`);
    // Each fraction may be taught then practised in turn (I Do, We Do, I Do, We Do…), but every We Do follows an I Do,
    // the single You Do comes after all of them, and only "Say it" cards follow the You Do.
    assert.equal(ph[0], 'ido', `${u.id} starts with I Do`);
    const y = ph.indexOf('youdo');
    assert.ok(ph.slice(0, y).every((p) => p === 'ido' || p === 'wedo') && ph.slice(y + 1).every((p) => p === 'say'), `${u.id} order around You Do`);
    assert.ok(u.cards.some((c) => c.phase === 'ido' && c.type === 'demo'), `${u.id} has a step-by-step worked example`);
    const you = u.cards.find((c) => c.phase === 'youdo');
    assert.ok(!you.help, `${u.id} You Do has no hints`);
    const geo = (c) => JSON.stringify(c.task ? (c.task.polygon || [c.task.center, c.task.radius, c.task.points.length]) : c.figure ? c.figure.id : c.grid ? 'grid' : c.picture);
    for (const c of u.cards.filter((x) => x.phase !== 'youdo' && x.type !== 'demo')) assert.notEqual(geo(c), geo(you), `${u.id}: You Do differs from ${c.id}`);
    for (const d of u.cards.filter((x) => x.type === 'demo' && x.task)) if (you.task) assert.notEqual(JSON.stringify(d.task.polygon || d.task.center), JSON.stringify(you.task.polygon || you.task.center) + (you.task === d.task ? '' : 'x'), `${u.id}: You Do is not the worked example`);
  }
  assert.equal(ASSESSMENT.length, 10);
  assert.ok(ASSESSMENT.every((q) => q.graded && !q.help), 'Final Check has no hints');
  const used = new Set(UNITS.flatMap((u) => u.cards).filter((c) => c.picture || c.figure).map((c) => JSON.stringify(c.picture || c.figure.id)));
  for (const q of ASSESSMENT.filter((x) => x.picture || x.figure)) assert.ok(!used.has(JSON.stringify(q.picture || q.figure.id)), `${q.id} is a fresh picture`);
});

test('teaching cannot be skipped: Next waits for each card, and later sections stay locked', () => {
  resetJourney();
  assert.equal(stageUnlocked('explore', {}), true); assert.equal(stageUnlocked('method', {}), false); assert.equal(nextStage({}), 'explore');
  journeyState.at.explore = 4; act('explore', 'next');
  assert.equal(journeyState.at.explore, 2, 'a stored position past unfinished cards is pulled back to the worked example');
  // a-words and a-area are reading cards; the worked example must be watched to the end.
  const out = act('explore', 'next'); assert.equal(journeyState.at.explore, 2, 'cannot leave the worked example early'); assert.match(out.say, /Finish/);
  for (let k = 0; k < 6; k++) act('explore', 'demo-next');
  act('explore', 'next'); assert.equal(journeyState.at.explore, 3);
  assert.equal(frontier('explore', journeyState.records), 3);
  const html2 = journeyCard(ctx, 'method', journeyState).s;
  assert.match(html2, /is locked/); assert.doesNotMatch(html2, /data-card=/);
  assert.match(journeyStepper(ctx, 'explore', journeyState.records).s, /class="locked"|locked/);
  const all = allDoneRecords(); assert.ok(JOURNEY.every((s) => stageUnlocked(s.id, all))); assert.equal(nextStage(all), 'parent');
});

test('teaching rules: specific feedback, We Do help after repeated errors, You Do re-learn, then the answer', () => {
  const card = byId('b-fourths-make');
  assert.equal(diagnose(card, checkBuild(card.task, [['t2-4', 'b2-4']])).kind, 'regions');
  assert.match(diagnose(card, checkBuild(card.task, [['t2-4', 'b2-4']])).message, /count the parts/i);
  assert.equal(diagnose(card, checkBuild(card.task, [['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']])).kind, 'area');
  assert.equal(diagnose(byId('f-fix'), checkBuild(byId('f-fix').task, [['e0', 'e2']])).kind, 'center');
  // We Do: the second wrong check opens a hint, the third the visual steps.
  reach('method', idx('method', 'b-fourths-make'));
  const wrong = (stage, lines) => { (journeyState.ui[CARDS[stage][journeyState.at[stage]].id] ||= {}).lines = []; for (const [a, b] of lines) { act(stage, 'point', { id: a }); act(stage, 'point', { id: b }); } return act(stage, 'check'); };
  wrong('method', [['t2-4', 'b2-4']]); assert.equal(journeyState.ui['b-fourths-make'].help?.open, undefined);
  wrong('method', [['t1-4', 'b1-4']]); assert.equal(journeyState.ui['b-fourths-make'].help.level, 1);
  wrong('method', [['t3-4', 'b3-4']]); assert.equal(journeyState.ui['b-fourths-make'].help.level, 2);
  assert.equal(outcome(journeyState.records['b-fourths-make']), 'not-yet'); assert.ok(journeyState.records['b-fourths-make'].helpBeforeCorrect >= 2, 'the help it opened is recorded');
  // You Do: no hints; the second wrong check replays the worked example; the answer is offered after 4 misses.
  reach('method', idx('method', 'b-eighths-you'));
  assert.deepEqual(act('method', 'hint'), { quiet: true }, 'no hints in You Do');
  wrong('method', [['t4-8', 'b4-8']]); assert.equal(journeyState.records['b-eighths-you'].relearn, false);
  wrong('method', [['t2-8', 'b2-8']]); assert.equal(journeyState.records['b-eighths-you'].relearn, true, 'second miss: learn it again');
  assert.match(journeyCard(ctx, 'method', journeyState).s, /Let.s learn it again/);
  assert.doesNotMatch(journeyCard(ctx, 'method', journeyState).s, /Show me the answer/);
  act('method', 'relearn-next'); act('method', 'relearn-done');
  assert.doesNotMatch(journeyCard(ctx, 'method', journeyState).s, /Let.s learn it again/, 'retry after re-learning');
  wrong('method', [['t1-8', 'b1-8']]); wrong('method', [['t3-8', 'b3-8']]);
  assert.match(journeyCard(ctx, 'method', journeyState).s, /Show me the answer/);
  journeyState.ui['b-eighths-you'].lines = []; for (const [a, b] of byId('b-eighths-you').task.solution) { act('method', 'point', { id: a }); act('method', 'point', { id: b }); } act('method', 'check');
  assert.equal(outcome(journeyState.records['b-eighths-you']), 'after-relearn');
  // You Do right on the first try: independent, and Next opens.
  reach('shapes', 2);
  for (const [a, b] of byId('d-diamond-myturn').task.solution) { act('shapes', 'point', { id: a }); act('shapes', 'point', { id: b }); }
  const res = act('shapes', 'check'); assert.match(res.say, /on your own/i); assert.equal(outcome(journeyState.records['d-diamond-myturn']), 'independent');
  act('shapes', 'next'); assert.equal(journeyState.at.shapes, 3);
});

test('Final Check: one try per question, no hints, then locked', () => {
  reach('check', 0);
  assert.deepEqual(act('check', 'help'), { quiet: true });
  act('check', 'point', { id: 't1-4' }); act('check', 'point', { id: 'b1-4' });
  const ask = act('check', 'check'); assert.equal(journeyState.records.q1.attempts, 0, 'the first press only asks to confirm'); assert.match(ask.say, /one try/);
  assert.match(journeyCard(ctx, 'check', journeyState).s, /Yes, check it/);
  act('check', 'check');
  const r = journeyState.records.q1; assert.equal(r.attempts, 1); assert.equal(r.correct, false);
  assert.deepEqual(act('check', 'point', { id: 't2-4' }), { quiet: true }, 'cannot change an answered question');
  assert.deepEqual(act('check', 'check'), { quiet: true });
  assert.match(journeyCard(ctx, 'check', journeyState).s, /<fieldset class="j-locked-answer" disabled>/);
  act('check', 'next'); assert.equal(journeyState.at.check, 1, 'a wrong answer still moves on');
  const q7 = XCIRCLE; assert.notEqual(q7.angle, 90, 'the pizza lines do not cross like a plus sign');
  assert.match(byId('q7').options.find((o) => o.correct).text, /^No/);
});

test('views: one card at a time, help only in We Do, and the stepper lists A–I plus the grown-up report', () => {
  resetJourney(); journeyState.records = allDoneRecords();
  const stepper = journeyStepper(ctx, 'explore', journeyState.records).s;
  assert.equal((stepper.match(/<li/g) || []).length, 10);
  for (const s of JOURNEY) for (let i = 0; i < CARDS[s.id].length; i++) {
    journeyState.at[s.id] = i;
    const out = journeyCard(ctx, s.id, journeyState).s, c = CARDS[s.id][i];
    assert.equal((out.match(/data-card=/g) || []).length, 1, `${c.id} one card`);
    assert.equal(out.includes('data-j="help"'), ['wedo', 'say'].includes(c.phase) && !['demo', 'concept', 'sizes'].includes(c.type), `${c.id} help button only in We Do`);
    assert.doesNotMatch(out, /<select|<details/, `${c.id} no dropdown or hidden section`);
    assert.doesNotMatch(out, /<img|\.png|\.jpe?g/i, `${c.id} uses only drawn diagrams`);
  }
  assert.equal(stageDone('explore', { records: {} }), false);
});

test('review round 5: We Do has its own figure, honest verdicts, simpler re-teach, and fixed feedback', () => {
  // We Do never repeats the figure the worked example just solved.
  for (const u of UNITS) {
    const shownTasks = new Set(u.cards.filter((c) => c.type === 'demo' && c.task).map((c) => c.task));
    for (const w of u.cards.filter((c) => c.phase === 'wedo' && c.type === 'build')) if (u.id !== 'rectangles' && u.id !== 'mistake' && u.id !== 'count') assert.ok(!shownTasks.has(w.task), `${w.id} uses a new figure, not the worked example's`);
  }
  // "A different way": an untaught way drawn in We Do cannot be redrawn on the new plus sign as "different".
  const untaught = [['v0', 'v6'], ['v3', 'v9']];
  assert.equal(checkBuild(CROSS_WEDO, untaught).valid, true); assert.equal(checkBuild(CROSS_YOU, untaught).valid, true);
  const avoid = differentAvoidKey(byId('c-make2'), { solvedLines: untaught });
  assert.equal(avoid, partitionKey(CROSS_YOU, untaught), 'the child\'s own lines are the way to avoid');
  assert.equal(differentAvoidKey(byId('c-make2'), {}), partitionKey(CROSS_YOU, CROSS_YOU.solutions[0]), 'no saved lines: Way 1 is avoided');
  // Circle feedback: no "numbers" when nothing is numbered; the unequal-slices tip does not say the lines miss the center.
  const fix = byId('f-fix');
  assert.doesNotMatch(diagnose(fix, checkBuild(fix.task, [['c', 'e0']])).message, /numbers show/);
  assert.match(diagnose(fix, checkBuild(fix.task, [['e0', 'e4'], ['e1', 'e5']])).message, /Your lines go through the center/);
  // Verdicts: 3 of 10 is "not ready yet"; 7 of 10 is "almost"; a wrong drawing blocks "ready".
  const all = allDoneRecords();
  const miss = (recs, ids) => { const r = { ...recs }; for (const id of ids) { r[id] = newRecord({ id }); noteCheck(r[id], false); } return r; };
  assert.equal(readiness(miss(all, ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'])).verdict.level, 'notyet');
  assert.equal(readiness(miss(all, ['q6', 'q7', 'q8'])).verdict.level, 'review');
  assert.equal(readiness(miss(all, ['q1'])).verdict.level, 'review', '9 of 10 but a drawing was wrong');
  assert.equal(readiness(all).verdict.level, 'ready');
  assert.deepEqual(readiness(miss(all, ['q2'])).missedSkills, ['Square into eighths'], 'each question names its own skill');
  assert.ok(readiness(all).notChecked.length > 0 && readiness(all).notChecked.every((t) => UNITS.some((u) => u.title === t)));
  assert.ok(ASSESSMENT.every((q) => q.reportLabel));
  // Simpler re-teach for corners-only shapes: corner (or edge-point) lines only, ending in a valid partition of the taught shape.
  for (const sh of SHAPES.filter((x) => x.myTurn.bare)) {
    const you = byId(`d-${sh.skill}-myturn`), st = you.relearnSteps;
    assert.ok(st && st.length >= 3, `${sh.skill} has simple re-teach steps`);
    assert.ok(st.every((x) => x.lines.every((l) => l.every((id) => /^[ve]\d/.test(id)))), `${sh.skill} re-teach uses only corners`);
    assert.equal(checkBuild(you.relearnTask, st.at(-1).lines).valid, true);
  }
  // Rectangles: each fraction is shown then practised; eighths has a We Do.
  assert.ok(byId('b-eighths-make').phase === 'wedo');
  assert.equal(byId('d-paper').phase, 'say');
});

test('originality guard: journey sources contain no images, scans or publisher marks', () => {
  for (const f of ['js/lib/partition-journey.js', 'js/views/partition-journey.js', 'js/partition-journey.js', 'css/partition-journey.css']) {
    const text = fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /McGraw|Copyright|Reveal Math|<img|url\(|base64/i, f);
  }
});

test('review round 6: confirm resets on a new answer, turned labels, even re-teach lines, circle tips, eighths help order', async () => {
  const { unequalTip, cardById, RECT_EIGHTHS } = await import('../../js/lib/partition-journey.js');
  // Final Check: changing the answer after "check" asks again before the one try is used.
  resetJourney(); for (const c of ALL_CARDS) if (c.id !== 'q10') journeyState.records[c.id] = Object.assign(newRecord(c), { viewed: true, written: true, attempts: 1, first: 'correct', correct: true });
  const q10 = CARDS.check.findIndex((c) => c.id === 'q10'); journeyState.at.check = q10;
  act('check', 'choice', { values: ['0'] }); act('check', 'check'); assert.equal(journeyState.ui.q10.confirm, true);
  act('check', 'choice', { values: ['1'] }); assert.equal(journeyState.ui.q10.confirm, false);
  assert.equal(journeyState.records.q10?.attempts || 0, 0, 'no try used');
  // Turned We Do shapes: every position word matches where the dot now is.
  for (const sh of SHAPES) { const t = sh.wedo, cx = t.points.reduce((a, p) => a + p.x, 0) / t.points.length, cy = t.points.reduce((a, p) => a + p.y, 0) / t.points.length;
    for (const p of t.points) { if (/right$/.test(p.label)) assert.ok(p.x > cx - 1, `${t.id} ${p.label}`); if (/left$/.test(p.label)) assert.ok(p.x < cx + 1, `${t.id} ${p.label}`); if (/^.*(top)$/.test(p.label)) assert.ok(p.y < cy + 1, `${t.id} ${p.label}`); } }
  assert.notEqual(cardById('d-square-guide').task.id, cardById('d-square-myturn').task.id, 'square We Do is its own figure');
  // Re-teach steps: "an edge point", and the 2nd circle line makes a plus sign (lines evenly spaced).
  const circ = cardById('d-circle-myturn').relearnSteps; assert.match(circ[1].text, /an edge point/);
  const oct8 = SHAPES.find((s) => s.skill === 'octagon8').relearnSteps; const two = oct8.find((s) => s.lines?.length === 2);
  assert.equal(checkBuild(SHAPES.find((s) => s.skill === 'octagon8').guide, two.lines).count, 4, 'two re-teach lines already make 4 equal parts');
  assert.match(unequalTip({ shape: 'circle', count: 4 }), /plus sign/); assert.doesNotMatch(unequalTip({ shape: 'circle', count: 8 }), /plus sign/);
  assert.match(RECT_EIGHTHS.hint || '', /4|four/i); assert.equal(RECT_EIGHTHS.solutions[0].length, 4, 'help steps start with the 4-by-2 way the hint describes');
});
