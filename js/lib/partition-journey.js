// Lesson 7-1 learning journey: original content, geometry and progress rules (no DOM).
// Sequence follows the lesson's skill progression; wording, figures and examples are newly authored.
// Equal-area success is always computed from the actual construction by partition-geometry.js.
import { validatePartition, partitionPolygon, polygonArea, signedArea, TASKS } from './partition-geometry.js';

export const JOURNEY_LESSON = '7-1';
export const JOURNEY = [
  { id: 'explore', label: 'Explore', title: 'Explore equal parts', skill: 'whole' },
  { id: 'method', label: 'Learn the Method', title: 'Learn the method: rectangles', skill: 'rectangles' },
  { id: 'cross', label: 'Try It Together', title: 'Try it together: a plus-sign shape', skill: 'cross' },
  { id: 'shapes', label: 'Shape Builder', title: 'Shape Builder: six shapes', skill: 'shapes' },
  { id: 'sizes', label: 'Compare Sizes', title: 'Compare part sizes', skill: 'sizes' },
  { id: 'mistake', label: 'Find the Mistake', title: 'Find the mistake', skill: 'mistake' },
  { id: 'count', label: 'Count the Parts', title: 'Count equal parts', skill: 'count' },
  { id: 'area', label: 'Explain Equal Area', title: 'Explain equal area', skill: 'area' },
  { id: 'check', label: 'Final Check', title: 'Final check: 10 questions', skill: 'check' },
];
export const JOURNEY_IDS = JOURNEY.map((s) => s.id);
export const isJourneyStage = (lessonId, stage) => lessonId === JOURNEY_LESSON && JOURNEY_IDS.includes(stage);
export const journeyLabel = (id) => JOURNEY.find((s) => s.id === id)?.label;

export const SKILLS = {
  whole: 'One whole, partition, equal parts and area',
  rectangles: 'Rectangles into fourths, sixths and eighths',
  cross: 'Plus-sign shape into fourths two ways',
  diamond: 'Diamond into fourths',
  square: 'Square into sixths',
  circle: 'Circle into eighths',
  octagon4: 'Octagon into fourths',
  hexagon: 'Hexagon into sixths',
  octagon8: 'Octagon into eighths',
  sizes: 'More equal parts make smaller parts',
  mistake: 'Four parts are not always fourths',
  count: 'Count equal regions and name the parts',
  area: 'Different-looking parts can have equal area',
  reflect: 'Explain how to make equal parts',
};

// ------------------------------------------------------------------ geometry helpers
const TAU = Math.PI * 2;
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const regular = (n, cx, cy, r, start) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(start + i * TAU / n), cy + r * Math.sin(start + i * TAU / n)]);
const DIRS = ['right', 'lower right', 'bottom', 'lower left', 'left', 'upper left', 'top', 'upper right'];
const dir = ([x, y], [cx, cy]) => DIRS[Math.round(((Math.atan2(y - cy, x - cx) + TAU) % TAU) / (TAU / 8)) % 8];
const point = (id, [x, y], label) => ({ id, x, y, label });
const centroid = (p) => { const a = signedArea(p); if (Math.abs(a) < 1e-9) return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]; let x = 0, y = 0; p.forEach((q, i) => { const r = p[(i + 1) % p.length], c = q[0] * r[1] - r[0] * q[1]; x += (q[0] + r[0]) * c; y += (q[1] + r[1]) * c; }); return [x / (6 * a), y / (6 * a)]; };
export { centroid };

const ORD = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const DEN = { 2: 'halves', 3: 'thirds', 4: 'fourths', 6: 'sixths', 8: 'eighths' };
const DEN1 = { 2: 'half', 3: 'third', 4: 'fourth', 6: 'sixth', 8: 'eighth' };
const fracWord = (n, d) => (n * 2 === d ? 'halfway' : `${ORD[n]} ${n === 1 ? DEN1[d] : DEN[d]}`);

/** A polygon whole with corner, side-middle and (optional) center points. */
function polygonTask({ id, label, count, polygon, center, mids = true, viewBox = [320, 300], solutions, why, hint, teach, extra = [] }) {
  const c = center || centroid(polygon);
  const points = polygon.map((p, i) => point(`v${i}`, p, `Corner ${i + 1}, ${dir(p, c)}`));
  if (mids) polygon.forEach((p, i) => points.push(point(`m${i}`, mid(p, polygon[(i + 1) % polygon.length]), `Middle of side ${i + 1}, ${dir(mid(p, polygon[(i + 1) % polygon.length]), c)}`)));
  if (center !== false) points.push(point('c', c, 'Center'));
  points.push(...extra);
  return { id, label, count, shape: 'polygon', polygon, points, solutions, solution: solutions[0], why, hint, teach, viewBox };
}
/** A circle whole with equally spaced edge points and its center. */
function circleTask({ id, label, count, center, radius, edge = 8, start = -Math.PI / 2, viewBox = [320, 300], solutions, why, hint, teach }) {
  const ring = regular(edge, center[0], center[1], radius, start);
  const points = ring.map((p, i) => point(`e${i}`, p, `Edge point ${i + 1}, ${dir(p, center)}`)).concat(point('c', center, 'Center'));
  return { id, label, count, shape: 'circle', center, radius, points, solutions, solution: solutions[0], why, hint, teach, viewBox };
}
/** A rectangle with marks at the given fractions of its top/bottom and left/right edges. */
function rectTask({ id, label, count, x, y, w, h, across, down, viewBox = [320, 280], solutions, why, hint, teach }) {
  const polygon = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const names = ['Top left corner', 'Top right corner', 'Bottom right corner', 'Bottom left corner'];
  const points = polygon.map((p, i) => point(`k${i}`, p, names[i]));
  for (const [n, d] of across) {
    points.push(point(`t${n}-${d}`, [x + w * n / d, y], `Top edge, ${fracWord(n, d)} across`));
    points.push(point(`b${n}-${d}`, [x + w * n / d, y + h], `Bottom edge, ${fracWord(n, d)} across`));
  }
  for (const [n, d] of down) {
    points.push(point(`l${n}-${d}`, [x, y + h * n / d], `Left edge, ${fracWord(n, d)} down`));
    points.push(point(`r${n}-${d}`, [x + w, y + h * n / d], `Right edge, ${fracWord(n, d)} down`));
  }
  return { id, label, count, shape: 'polygon', polygon, points, solutions, solution: solutions[0], why, hint, teach, viewBox };
}
const cols = (d, ks = Array.from({ length: d - 1 }, (_, i) => i + 1)) => ks.map((n) => [`t${n}-${d}`, `b${n}-${d}`]);
const rows = (d, ks = Array.from({ length: d - 1 }, (_, i) => i + 1)) => ks.map((n) => [`l${n}-${d}`, `r${n}-${d}`]);
const fan = (n, prefix = 'v') => Array.from({ length: n }, (_, i) => ['c', `${prefix}${i}`]);
const steps = (lines, texts) => texts.map((text, i) => ({ text, lines: lines.slice(0, i + 1) }));
const qs = (q) => Array.from({ length: q }, (_, i) => i);

// ------------------------------------------------------------------ Section B: rectangles
const Q = [[1, 4], [2, 4], [3, 4]], S6 = qs(5).map((i) => [i + 1, 6]), E8 = qs(7).map((i) => [i + 1, 8]), T3 = [[1, 3], [1, 2], [2, 3]];
export const RECT_FOURTHS = rectTask({
  id: 'rect-fourths', label: 'Rectangle: fourths', count: 4, x: 30, y: 50, w: 260, h: 180, across: Q, down: Q,
  solutions: [cols(4), rows(4), [['t2-4', 'b2-4'], ['l2-4', 'r2-4']], [['l2-4', 'r2-4'], ['k0', 'r2-4'], ['l2-4', 'k2']]],
  why: 'Each part is one of 4 equal parts. Together they cover the whole rectangle, so they are fourths.',
  hint: 'The marks are evenly spaced. Lines that use matching marks make parts with the same width or the same height.',
});
RECT_FOURTHS.ways = [
  { text: 'Way 1: three up-and-down lines make 4 tall columns. Each column has the same width and the same height.', lines: RECT_FOURTHS.solutions[0] },
  { text: 'Way 2: three side-to-side lines make 4 long rows. Same length, same thickness: equal areas.', lines: RECT_FOURTHS.solutions[1] },
  { text: 'Way 3: one line down the middle and one line across the middle make a 2-by-2 grid of 4 matching rectangles.', lines: RECT_FOURTHS.solutions[2] },
  { text: 'Way 4: cut the rectangle into 2 equal halves. Then cut each half corner to corner. Each half makes 2 matching triangles, so all 4 triangles are fourths.', lines: RECT_FOURTHS.solutions[3] },
];
export const RECT_SIXTHS = rectTask({
  id: 'rect-sixths', label: 'Rectangle: sixths', count: 6, x: 25, y: 30, w: 270, h: 220, across: [...S6], down: T3,
  solutions: [[...cols(6, [2, 4]), ['l1-2', 'r1-2']], cols(6), [['t3-6', 'b3-6'], ...rows(3, [1, 2])]],
  why: 'Six parts with the same size cover the whole rectangle. Six equal parts are sixths.',
  hint: 'Try 3 equal columns and 2 equal rows. 3 times 2 makes 6 equal parts.',
});
RECT_SIXTHS.ways = [
  { text: 'Way 1: five up-and-down lines make 6 thin columns of the same width.', lines: RECT_SIXTHS.solutions[1] },
  { text: 'Way 2: make 3 equal columns, then one line across the middle. 3 columns times 2 rows is 6 equal parts.', lines: RECT_SIXTHS.solutions[0] },
  { text: 'Way 3: make 2 equal columns and 3 equal rows. 2 times 3 is also 6 equal parts.', lines: RECT_SIXTHS.solutions[2] },
];
export const RECT_EIGHTHS = rectTask({
  id: 'rect-eighths', label: 'Rectangle: eighths', count: 8, x: 20, y: 60, w: 280, h: 160, across: E8, down: Q,
  solutions: [[...cols(8, [2, 4, 6]), ['l2-4', 'r2-4']], cols(8), [['t4-8', 'b4-8'], ...rows(4)]],
  why: 'Eight parts with the same size cover the whole rectangle. Eight equal parts are eighths.',
  hint: 'Make 4 equal columns, then split every column in half. 4 times 2 is 8.',
});
RECT_EIGHTHS.ways = [
  { text: 'Way 1: seven up-and-down lines make 8 thin columns of the same width.', lines: RECT_EIGHTHS.solutions[1] },
  { text: 'Way 2: make 4 equal columns and 2 equal rows. 4 times 2 is 8 equal parts.', lines: RECT_EIGHTHS.solutions[0] },
  { text: 'Way 3: make 2 equal columns and 4 equal rows. 2 times 4 is also 8 equal parts.', lines: RECT_EIGHTHS.solutions[2] },
];

// ------------------------------------------------------------------ Section C: plus-sign shape (reuses the reviewed cross outline)
const crossBase = TASKS.find((t) => t.id === 'cross-fourths');
export const CROSS = {
  ...crossBase, id: 'cross', label: 'Plus sign: fourths', viewBox: [300, 300],
  points: [...crossBase.points, point('c', [150, 150], 'Center')],
  solutions: [[['top', 'bottom'], ['left', 'right']], [['v2', 'v8'], ['v5', 'v11']]],
  hint: 'Try a quarter turn. The shape looks the same. Use lines that look the same after a quarter turn too.',
  why: 'Each part fits exactly on the next part after a quarter turn. Four matching parts fill the shape, so each part is one fourth.',
};
CROSS.solution = CROSS.solutions[0];
/** More plus signs with other proportions (corner numbering matches CROSS): We Do, You Do and the Final Check. */
function plusSign(id, inner, outer) {
  const [a, b] = inner, [lo, hi] = outer, poly = [[a, lo], [b, lo], [b, a], [hi, a], [hi, b], [b, b], [b, hi], [a, hi], [a, b], [lo, b], [lo, a], [a, a]], m = (a + b) / 2;
  const t = { id, label: 'Plus sign: fourths', count: 4, shape: 'polygon', polygon: poly, viewBox: [300, 300], why: CROSS.why, hint: CROSS.hint,
    points: [...poly.map((p, i) => point(`v${i}`, p, `Corner ${i + 1}`)), point('top', [m, lo], 'Top midpoint'), point('bottom', [m, hi], 'Bottom midpoint'), point('left', [lo, m], 'Left midpoint'), point('right', [hi, m], 'Right midpoint'), point('c', [m, m], 'Center')],
    solutions: [[['top', 'bottom'], ['left', 'right']], [['v2', 'v8'], ['v5', 'v11']]] };
  t.solution = t.solutions[0];
  return t;
}
export const CROSS_WEDO = plusSign('cross-wedo', [120, 180], [30, 270]);
export const CROSS_YOU = plusSign('cross-you', [100, 200], [20, 280]);
export const CROSS_Q = plusSign('cross-q', [85, 215], [45, 255]);
/**
 * "A different way" on the new plus sign: the child's own We Do lines are redrawn on the new plus sign (the points
 * have the same names), and that partition is the one to avoid. With no saved lines, Way 1 is avoided.
 */
export function differentAvoidKey(card, firstUi) {
  const first = cardById(card.different);
  if (!first) return null;
  const lines = firstUi?.solvedLines;
  const ids = new Set(card.task.points.map((p) => p.id));
  if (lines?.length && lines.every((l) => l.every((id) => ids.has(id)))) return partitionKey(card.task, lines);
  return partitionKey(card.task, card.task.solutions[0]);
}
CROSS.teach = [
  { text: 'This plus-sign shape is one whole. It has a middle square and four matching arms.', lines: [] },
  { text: 'Way 1, step 1: join the middle of the top edge to the middle of the bottom edge.', lines: [['top', 'bottom']] },
  { text: 'Step 2: join the middle of the left edge to the middle of the right edge. Now there are 4 parts.', lines: CROSS.solutions[0] },
  { text: 'Each part is a corner piece shaped like an L. Turn one part a quarter turn and it fits right on top of the next part. Equal parts!', lines: CROSS.solutions[0] },
];
CROSS.teach2 = [
  { text: 'Way 2 uses the four inside corners where the arms meet the middle square.', lines: [] },
  { text: 'Step 1: join two inside corners that are across from each other.', lines: [CROSS.solutions[1][0]] },
  { text: 'Step 2: join the other two inside corners. The middle square is cut into 4 matching triangles.', lines: CROSS.solutions[1] },
  { text: 'Now each part is one whole arm plus one triangle from the middle. All four parts match, so each is one fourth, even though they look different from Way 1.', lines: CROSS.solutions[1] },
];

// ------------------------------------------------------------------ Section D: six construction skills (Teach Me / Guide Me shape, then a fresh My Turn shape)
const rh = (cx, cy, hw, hh) => [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]];
const sq = (x, y, s) => [x, y, s, s];
const flatOct = (cx, cy, r) => regular(8, cx, cy, r, -Math.PI / 2 + Math.PI / 8);
const pointOct = (cx, cy, r) => regular(8, cx, cy, r, -Math.PI / 2);
const flatHex = (cx, cy, r) => regular(6, cx, cy, r, Math.PI);
const pointHex = (cx, cy, r) => regular(6, cx, cy, r, -Math.PI / 2);

const DIAMOND_WHY = 'Both lines cross exactly in the middle of the diamond, so the 4 parts have the same area. Each part is one fourth.';
const SHAPE_DEFS = [
  {
    skill: 'diamond', name: 'Diamond', goal: 'fourths',
    make: (variant) => polygonTask({
      id: variant ? 'diamond-myturn' : 'diamond', label: 'Diamond: fourths', count: 4, polygon: variant ? rh(160, 150, 125, 85) : rh(160, 150, 85, 125),
      solutions: [[['v0', 'v2'], ['v1', 'v3']], [['m0', 'm2'], ['m1', 'm3']]],
      hint: 'Look for corners that are across from each other.', why: DIAMOND_WHY,
      teach: [{ text: 'Join the top corner to the bottom corner.', lines: [['v0', 'v2']] }, { text: 'Join the left corner to the right corner. The lines cross in the middle.', lines: [['v0', 'v2'], ['v1', 'v3']] }],
    }),
  },
  {
    skill: 'square', name: 'Square', goal: 'sixths',
    make: (variant) => variant
      ? rectTask({ id: 'square-myturn', label: 'Square: sixths', count: 6, ...Object.fromEntries(['x', 'y', 'w', 'h'].map((k, i) => [k, sq(55, 35, 210)[i]])), across: T3, down: T3, viewBox: [320, 280],
        solutions: [[...cols(3), ['l1-2', 'r1-2']], [['t1-2', 'b1-2'], ...rows(3)]], hint: 'This time the marks show thirds and halves. Try 3 equal columns, then split them into 2 equal rows.',
        why: '3 equal columns times 2 equal rows (or 2 columns times 3 rows) makes 6 matching rectangles. Each is one sixth.' })
      : rectTask({ id: 'square', label: 'Square: sixths', count: 6, ...Object.fromEntries(['x', 'y', 'w', 'h'].map((k, i) => [k, sq(40, 20, 240)[i]])), across: S6, down: T3, viewBox: [320, 280],
        solutions: [cols(6), [...cols(6, [2, 4]), ['l1-2', 'r1-2']], [['t3-6', 'b3-6'], ...rows(3, [1, 2])]], hint: 'The marks on the top edge are evenly spaced. Lines straight down from matching marks make parts of the same width.',
        why: 'The 6 parts have the same width and the same height, so they have the same area. Six equal parts are sixths.',
        teach: [{ text: 'Make 3 equal columns: join the top mark two sixths across to the matching bottom mark.', lines: [['t2-6', 'b2-6']] }, { text: 'Join the top mark four sixths across to the matching bottom mark. Now there are 3 equal columns.', lines: [['t2-6', 'b2-6'], ['t4-6', 'b4-6']] }, { text: 'Cut across the middle. 3 columns times 2 rows is 6 matching rectangles.', lines: [['t2-6', 'b2-6'], ['t4-6', 'b4-6'], ['l1-2', 'r1-2']] }] }),
  },
  {
    skill: 'circle', name: 'Circle', goal: 'eighths',
    make: (variant) => circleTask({
      id: variant ? 'circle-myturn' : 'circle', label: 'Circle: eighths', count: 8, center: [160, 150], radius: variant ? 105 : 118, start: variant ? -Math.PI / 2 + Math.PI / 8 : -Math.PI / 2,
      solutions: [[['e0', 'e4'], ['e1', 'e5'], ['e2', 'e6'], ['e3', 'e7']], fan(8, 'e')],
      hint: 'Every line should go through the center. Equal turns around the center make equal slices.',
      why: 'All 8 slices reach from the center to the edge and open by the same amount. Eight equal slices are eighths.',
      teach: [{ text: 'Draw a line from an edge point, through the center, to the point straight across. That makes halves.', lines: [['e0', 'e4']] }, { text: 'Draw a second line through the center so the two lines cross like a plus sign. That makes fourths.', lines: [['e0', 'e4'], ['e2', 'e6']] }, { text: 'Draw a line through the center, halfway between the first two lines. It cuts two of the fourths in half.', lines: [['e0', 'e4'], ['e2', 'e6'], ['e1', 'e5']] }, { text: 'Add the last line through the center. It cuts the other two fourths in half. Now there are 8 slices.', lines: [['e0', 'e4'], ['e2', 'e6'], ['e1', 'e5'], ['e3', 'e7']] }],
    }),
  },
  {
    skill: 'octagon4', name: 'Octagon', goal: 'fourths',
    make: (variant) => polygonTask({
      id: variant ? 'octagon4-myturn' : 'octagon4', label: 'Octagon: fourths', count: 4, polygon: variant ? flatOct(160, 150, 118) : pointOct(160, 150, 125),
      solutions: [[['v0', 'v4'], ['v2', 'v6']], [['v1', 'v5'], ['v3', 'v7']], [['m0', 'm4'], ['m2', 'm6']], [['m1', 'm5'], ['m3', 'm7']]],
      hint: 'An octagon has 8 equal sides. Think about splitting it in half, then splitting each half again.',
      why: 'Both lines go through the center and cross like a plus sign. A quarter turn moves each part onto the next one, so the 4 parts are fourths.',
      teach: [{ text: 'Join a corner to the corner straight across. That makes 2 equal halves.', lines: [['v0', 'v4']] }, { text: 'Skip one corner and join the next corner to the one straight across. The lines cross like a plus sign, so each half is cut in half.', lines: [['v0', 'v4'], ['v2', 'v6']] }],
    }),
  },
  {
    skill: 'hexagon', name: 'Hexagon', goal: 'sixths',
    make: (variant) => polygonTask({
      id: variant ? 'hexagon-myturn' : 'hexagon', label: 'Hexagon: sixths', count: 6, polygon: variant ? flatHex(160, 150, 128) : pointHex(160, 150, 125),
      solutions: [fan(6), [['v0', 'v3'], ['v1', 'v4'], ['v2', 'v5']], fan(6, 'm')],
      hint: 'A hexagon has 6 equal sides and 6 corners. Try using the center.',
      why: 'All 6 parts are the same size and shape. They fit together around the center, so each one is a sixth.',
      teach: [{ text: 'Join one corner, through the center, to the corner straight across.', lines: [['v0', 'v3']] }, { text: 'Do the same with the next pair of opposite corners.', lines: [['v0', 'v3'], ['v1', 'v4']] }, { text: 'Join the last pair. Now there are 6 triangles that meet at the center.', lines: [['v0', 'v3'], ['v1', 'v4'], ['v2', 'v5']] }],
    }),
  },
  {
    skill: 'octagon8', name: 'Octagon', goal: 'eighths',
    make: (variant) => polygonTask({
      id: variant ? 'octagon8-myturn' : 'octagon8', label: 'Octagon: eighths', count: 8, polygon: variant ? pointOct(160, 150, 120) : flatOct(160, 150, 128),
      solutions: [fan(8), [['v0', 'v4'], ['v1', 'v5'], ['v2', 'v6'], ['v3', 'v7']], fan(8, 'm')],
      hint: 'Eight sides, eight parts. Try joining the center to every corner.',
      why: 'All 8 parts are the same size and shape and fit together around the center, so each one is an eighth.',
      teach: [{ text: 'Join the center to one corner.', lines: fan(8).slice(0, 1) }, { text: 'Join the center to the next corner. That is one triangle.', lines: fan(8).slice(0, 2) }, { text: 'Keep going around: center to each corner.', lines: fan(8).slice(0, 5) }, { text: 'Finish the last corners. Count 8 matching triangles.', lines: fan(8) }, { text: 'Another way: join each corner to the corner straight across. These 4 lines make the same 8 triangles, without a center dot.', lines: [['v0', 'v4'], ['v1', 'v5'], ['v2', 'v6'], ['v3', 'v7']] }],
    }),
  },
];
/**
 * My Turn shows only the corners (or, on a circle, only the edge points): no ready-made center or side-middle dots,
 * so the child must find the lines across the shape, closer to drawing on a blank workbook shape.
 * The square keeps its edge marks: without them no exact sixths can be drawn with this tool.
 */
export function bare(task) {
  if (task.id.startsWith('square')) return task;
  const keep = task.points.filter((p) => /^[ve]\d/.test(p.id)), ids = new Set(keep.map((p) => p.id));
  const ok = (lines) => lines.every((l) => l.every((id) => ids.has(id)));
  const solutions = task.solutions.filter(ok);
  const teach = task.teach?.filter((st) => ok(st.lines));
  const hint = task.shape === 'circle' ? 'There is no center dot this time. Join each edge point to the point straight across the circle.' : 'There is no center dot this time. Join each corner to the corner straight across. The lines all cross in the middle.';
  return { ...task, points: keep, solutions, solution: solutions[0], teach: teach?.length ? teach : undefined, hint, bare: true };
}
/** We Do gets its own figure: the taught shape turned and/or resized (same dots and same kind of answer). */
function variant(task, { rot = 0, sx = 1, sy = sx, id }) {
  const c = task.shape === 'circle' ? task.center : centroid(task.polygon), cos = Math.cos(rot), sin = Math.sin(rot);
  const f = ([x, y]) => { const dx = (x - c[0]) * sx, dy = (y - c[1]) * sy; return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos]; };
  const relabel = (p, x, y) => p.id === 'c' ? p.label : p.label.replace(/, (upper |lower )?(right|left|top|bottom)$/, `, ${dir([x, y], c)}`);
  const out = { ...task, id, points: task.points.map((p) => { const [x, y] = f([p.x, p.y]); return { ...p, x, y, label: relabel(p, x, y) }; }), _hit: undefined };
  if (task.shape === 'circle') out.radius = task.radius * sx; else out.polygon = task.polygon.map(f);
  return out;
}
const WEDO = { diamond: { sx: 1.15, sy: 0.85 }, circle: { rot: Math.PI / 16, sx: 0.92 }, octagon4: { rot: Math.PI / 16, sx: 0.9 }, hexagon: { rot: Math.PI / 4, sx: 0.92 }, octagon8: { rot: Math.PI / 16, sx: 0.9 } };
/** "Let's learn it again" for a corners-only You Do: the shape from the worked example, drawn with corner-to-corner lines only. */
function simpleSteps(teach, goal) {
  const sol = teach.solutions.find((x) => x.every((l) => l.every((id) => /^[ve]\d/.test(id))));
  if (!sol) return null;
  const word = teach.shape === 'circle' ? 'edge point' : 'corner', a = teach.shape === 'circle' ? 'an' : 'a';
  // Space the lines evenly: halves, then fourths (a plus sign), then the in-between lines.
  if (sol.length === 4) sol.splice(0, 4, sol[0], sol[2], sol[1], sol[3]);
  return [
    { text: `Let's go back to the shape from the example. This time, use only the ${word}s.`, lines: [] },
    ...sol.map((_, i) => ({ text: i === 0 ? `First make halves: join ${a} ${word} to the ${word} straight across.` : `Add another line from ${a} ${word} to the ${word} straight across. Space the lines evenly around the middle.`, lines: sol.slice(0, i + 1) })),
    { text: `Count the parts: ${teach.count} equal parts, or ${goal}. Do your new shape the same way.`, lines: sol },
  ];
}
const SQUARE_WEDO = rectTask({ id: 'square-wedo', label: 'Square: sixths', count: 6, x: 60, y: 30, w: 210, h: 210, across: T3, down: [...S6], viewBox: [320, 280],
  solutions: [[...rows(6, [2, 4]), ['t1-2', 'b1-2']], rows(6), [['l3-6', 'r3-6'], ...cols(3, [1, 2])]], hint: 'This time the marks for sixths are on the sides. Try 3 equal rows and 2 equal columns.',
  why: '6 parts with the same width and height cover the square, so each is one sixth.',
  teach: [{ text: 'Make 3 equal rows: join the left mark two sixths down to the matching right mark.', lines: [['l2-6', 'r2-6']] }, { text: 'Join the marks four sixths down. Now there are 3 equal rows.', lines: [['l2-6', 'r2-6'], ['l4-6', 'r4-6']] }, { text: 'Cut down the middle. 3 rows times 2 columns is 6 matching rectangles.', lines: [['l2-6', 'r2-6'], ['l4-6', 'r4-6'], ['t1-2', 'b1-2']] }] });
export const SHAPES = SHAPE_DEFS.map((d) => { const guide = d.make(false); return { ...d, guide, wedo: d.skill === 'square' ? SQUARE_WEDO : variant(guide, { ...WEDO[d.skill], id: `${guide.id}-wedo` }), myTurn: bare(d.make(true)), relearnSteps: simpleSteps(guide, d.goal) }; });

// The rectangle and the six shapes' Teach Me steps start by naming the whole and the goal, and end with the reason.
function teachSteps(task, goal) {
  const body = task.teach || task.solutions[0].map((_, i) => ({ text: 'Add the next line.', lines: task.solutions[0].slice(0, i + 1) }));
  return [{ text: `This ${task.label.split(':')[0].toLowerCase()} is one whole. Goal: ${task.count} equal parts, called ${goal}.`, lines: [] }, ...body, { text: task.why, lines: task.solution }];
}

// ------------------------------------------------------------------ Section G: figures to count (regions are listed, so counting uses areas, not lines)
const lattice = (o, u, v, nu, nv) => { const out = []; for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = [o[0] + i * u[0] + j * v[0], o[1] + i * u[1] + j * v[1]]; out.push([a, [a[0] + u[0], a[1] + u[1]], [a[0] + u[0] + v[0], a[1] + u[1] + v[1]], [a[0] + v[0], a[1] + v[1]]]); } return out; };
const quadFan = (quad, withMids) => { const c = centroid(quad); return quad.flatMap((p, i) => { const q = quad[(i + 1) % 4]; return withMids ? [[c, p, mid(p, q)], [c, mid(p, q), q]] : [[c, p, q]]; }); };
const midTri = (a, b, c) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); return [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]; };
const star = (c, s) => Array.from({ length: 8 }, (_, k) => { const t = k * Math.PI / 4 - Math.PI / 2, e = (a) => [Math.cos(a) * s, Math.sin(a) * s], [x1, y1] = e(t), [x2, y2] = e(t + Math.PI / 4); return [c, [c[0] + x1, c[1] + y1], [c[0] + x1 + x2, c[1] + y1 + y2], [c[0] + x2, c[1] + y2]]; });
/** Distinct boundary segments drawn in a figure (used to show "lines are not parts"). */
export function segmentCount(regions) { const keys = new Set(); for (const r of regions) r.forEach((p, i) => { const q = r[(i + 1) % r.length]; keys.add([p, q].map((v) => v.map((n) => Math.round(n)).join(',')).sort().join('|')); }); return keys.size; }

export const FIGURES = {
  tiles: { id: 'tiles', viewBox: [340, 210], regions: lattice([10, 30], [80, 0], [40, 80 * Math.sqrt(3) / 2], 3, 2), name: 'tile pattern', alt: 'A slanted shape made of 2 rows of 3 matching diamond-shaped tiles.' },
  slant: { id: 'slant', viewBox: [320, 260], regions: lattice([30, 30], [100, 0], [30, 100], 2, 2).flatMap(([a, b, c, d]) => [[a, b, c], [a, c, d]]), name: 'slanted shape', alt: 'A slanted four-sided shape split into 4 smaller slanted pieces, each cut corner to corner into 2 triangles.' },
  tiles2: { id: 'tiles2', viewBox: [320, 280], regions: lattice([40, 20], [70, 0], [35, 70 * Math.sqrt(3) / 2], 2, 3), name: 'tile pattern', alt: 'A slanted shape made of 3 rows of 2 matching diamond-shaped tiles.' },
  triangle: { id: 'triangle', viewBox: [320, 280], regions: midTri([40, 250], [290, 230], [120, 30]), name: 'triangle', alt: 'A triangle whose three side midpoints are joined, making 4 smaller triangles.' },
  star: { id: 'star', viewBox: [320, 300], regions: star([160, 150], 72), name: 'star', alt: 'An eight-pointed star made of matching diamond-shaped tiles that meet at the center.' },
  jack: { id: 'jack', viewBox: [320, 280], regions: quadFan([[60, 40], [260, 40], [260, 240], [60, 240]], true), name: 'square', alt: 'A square cut by both corner-to-corner lines and both middle lines into triangles that meet in the center.' },
  kite: { id: 'kite', viewBox: [320, 260], regions: quadFan([[40, 220], [200, 220], [280, 40], [120, 40]], false), name: 'slanted shape', alt: 'A slanted four-sided shape with both corner-to-corner lines drawn, making triangles.' },
};
for (const f of Object.values(FIGURES)) { f.lines = segmentCount(f.regions); f.whole = f.regions.reduce((s, r) => s + polygonArea(r), 0); }

// ------------------------------------------------------------------ Section H: half of a half (no grid), then a unit grid
export const HALVES = rectTask({ id: 'halves', label: 'Rectangle: four parts', count: 4, x: 40, y: 40, w: 240, h: 160, across: [[1, 2]], down: [[1, 2], [3, 4]],
  solutions: [[['l1-2', 'r1-2'], ['t1-2', 'c'], ['l3-4', 'r3-4']]], why: 'Each half is split into 2 equal parts. Half of a half is one fourth.' });
HALVES.points.push(point('c', [160, 120], 'Center'));
export const HALVES2 = rectTask({ id: 'halves2', label: 'Rectangle: four parts', count: 4, x: 40, y: 30, w: 240, h: 200, across: [[1, 2]], down: [[1, 2]],
  solutions: [[['t1-2', 'b1-2'], ['k0', 'b1-2'], ['c', 'r1-2']]], why: 'Each half is split into 2 equal parts, so all 4 parts are fourths, even though 2 are triangles and 2 are boxes.' });
HALVES2.points.push(point('c', [160, 130], 'Center'));
// ------------------------------------------------------------------ Section H: a rectangle on a unit grid
export const GRID = { cols: 6, rows: 4, unit: 40, x: 40, y: 40, pieces: [
  { name: 'A', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
  { name: 'B', cells: [[0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] },
  { name: 'C', cells: [[3, 1], [4, 1], [5, 1], [3, 2], [4, 2], [5, 2]] },
  { name: 'D', cells: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]] },
] };

// ------------------------------------------------------------------ cards: one question or idea at a time
const choice = (id, o) => ({ id, type: 'choice', graded: true, ...o });
const build = (id, task, o) => ({ id, type: 'build', graded: true, task, ...o });
const demo = (id, o) => ({ id, type: 'demo', ...o });
const concept = (id, o) => ({ id, type: 'concept', ...o });
const write = (id, o) => ({ id, type: 'write', ...o });
const count = (id, figure, o) => ({ id, type: 'count', graded: true, figure, ...o });
const NAMES = [['3', 'thirds'], ['4', 'fourths'], ['6', 'sixths'], ['8', 'eighths']];
const NUMS = ['3', '4', '6', '8'];

const OLD = (() => {
  const CARDS = {
  explore: [
    choice('a-same', { skill: 'whole', title: 'Three sandwiches', picture: { kind: 'sandwiches' },
      prompt: 'Three sandwiches are the same size. Each one has been cut. How are all three sandwiches alike?',
      options: [
        { text: 'All of the pieces are the same shape.', why: 'Look again: sandwich 1 has triangles, sandwich 2 has strips and sandwich 3 has small squares.' },
        { text: 'Each sandwich is one whole, and each is cut into 4 pieces.', correct: true, why: 'Yes. Count the pieces in each sandwich: 4, 4 and 4. Each sandwich is one whole.' },
        { text: 'Each sandwich is cut with the same lines.', why: 'The lines are different. One uses corner-to-corner cuts, one uses up-and-down cuts and one makes a grid.' },
      ],
      help: { hint: 'Count the pieces in each sandwich, one sandwich at a time.', steps: [{ text: 'Sandwich 1: count the triangles. There are 4.', picture: { kind: 'sandwiches', mark: 0 } }, { text: 'Sandwich 2: count the strips. There are 4.', picture: { kind: 'sandwiches', mark: 1 } }] } }),
    choice('a-equal', { skill: 'whole', title: 'Which are equal parts?', picture: { kind: 'sandwiches', grid: true }, multi: true,
      prompt: 'Now look for differences. Which sandwiches are cut into 4 equal parts? Choose all that are right.',
      options: [
        { text: 'Sandwich 1 (triangles)', correct: true, why: 'Sandwich 1: the 4 triangles match, so each covers the same space as 4 tiny squares. Equal parts.' },
        { text: 'Sandwich 2 (strips)', why: 'Sandwich 2: the strips are not all the same width. The widest strip covers 6 tiny squares, but the thinnest covers only 2.' },
        { text: 'Sandwich 3 (small squares)', correct: true, why: 'Sandwich 3: each square covers 4 small squares. Equal parts.' },
      ],
      help: { hint: 'The faint grid splits each sandwich into 16 tiny squares. Equal parts cover the same number of tiny squares.', steps: [{ text: 'Sandwich 2: the third strip covers 6 tiny squares, but the last strip covers only 2. Are they equal?', picture: { kind: 'sandwiches', grid: true, mark: 1 } }, { text: 'Sandwich 3: each piece is 2 tiny squares wide and 2 tall. 4 tiny squares each.', picture: { kind: 'sandwiches', grid: true, mark: 2 } }] } }),
    concept('a-words', { skill: 'whole', title: 'Math words', picture: { kind: 'words' },
      text: ['A **whole** is one complete shape, every bit inside its outline.', 'To **partition** means to divide a whole into parts.', '**Equal parts** each cover the same amount of space. All the parts together make the whole.'] }),
    concept('a-area', { skill: 'whole', title: 'Why area matters', picture: { kind: 'area-idea' },
      text: ['**Area** is how much flat space a shape covers. We can measure it in unit squares.', 'The long strip and the square look different, but each covers 4 unit squares. They have the same area.', 'To check equal parts, compare area, not just the look.'] }),
    choice('a-notfourths', { skill: 'whole', title: 'Four parts, but are they fourths?', picture: { kind: 'garden' },
      prompt: 'This garden is split into 4 beds. Does it show fourths?',
      options: [
        { text: 'Yes. There are 4 beds, so they are fourths.', why: 'Counting 4 parts is not enough. Fourths need 4 parts with the same area. Compare the big bed with a small one.' },
        { text: 'No. The 4 beds do not cover the same amount of space.', correct: true, why: 'Right. Fourths must be 4 EQUAL parts. The big bed covers much more space than the small beds.' },
      ],
      help: { hint: 'Compare the size of the biggest bed and the smallest bed.', steps: [{ text: 'The faint grid shows unit squares. Count the squares in the big bed: 8.', picture: { kind: 'garden', grid: true, mark: 0 } }, { text: 'Count the squares in a small bed: 2. 8 and 2 are not equal.', picture: { kind: 'garden', grid: true, mark: 1 } }] } }),
  ],
  method: [
    demo('b-fourths', { skill: 'rectangles', title: 'Fourths in a rectangle', task: RECT_FOURTHS, steps: [{ text: 'This rectangle is one whole. We can partition it into 4 equal parts, or fourths, in more than one way.', lines: [] }, ...RECT_FOURTHS.ways] }),
    build('b-fourths-make', RECT_FOURTHS, { skill: 'rectangles', title: 'Make fourths', prompt: 'Draw lines to partition the rectangle into 4 equal parts. Use any way you like.' }),
    demo('b-sixths', { skill: 'rectangles', title: 'Sixths in a rectangle', task: RECT_SIXTHS, steps: [{ text: 'Now we want 6 equal parts, called sixths.', lines: [] }, ...RECT_SIXTHS.ways] }),
    build('b-sixths-make', RECT_SIXTHS, { skill: 'rectangles', title: 'Make sixths', prompt: 'Draw lines to partition the rectangle into 6 equal parts.' }),
    demo('b-eighths', { skill: 'rectangles', title: 'Eighths in a rectangle', task: RECT_EIGHTHS, steps: [{ text: 'Now we want 8 equal parts, called eighths.', lines: [] }, ...RECT_EIGHTHS.ways] }),
    build('b-eighths-make', RECT_EIGHTHS, { skill: 'rectangles', title: 'Make eighths', prompt: 'Draw lines to partition the rectangle into 8 equal parts.' }),
    choice('b-triangles', { skill: 'rectangles', title: 'Different look, same size', picture: { kind: 'task', task: 'rect-fourths', lines: RECT_FOURTHS.solutions[3], shade: true },
      prompt: 'This rectangle was cut in half, then each half was cut corner to corner. Are the 4 triangles fourths?',
      options: [
        { text: 'No. Triangles cannot be fourths of a rectangle.', why: 'Parts do not need to look like the whole. What matters is equal area. Each triangle is half of a half.' },
        { text: 'No. Only lines that go straight across can make fourths.', why: 'Slanted lines can make equal parts too. Each half is split into 2 matching triangles.' },
        { text: 'Yes. Each half is cut into 2 matching triangles, so all 4 triangles have equal area.', correct: true, why: 'Yes. Half of a half is a fourth. All 4 triangles cover the same amount of space.' },
      ],
      help: { hint: 'First look at the line across the middle. What does it make?', steps: [{ text: 'The middle line makes 2 equal halves: top and bottom.', picture: { kind: 'task', task: 'rect-fourths', lines: [['l2-4', 'r2-4']] } }, { text: 'One corner-to-corner line splits the top half into 2 matching triangles. Flip one and it fits on the other.', picture: { kind: 'task', task: 'rect-fourths', lines: RECT_FOURTHS.solutions[3].slice(0, 2) } }] } }),
  ],
  cross: [
    demo('c-way1', { skill: 'cross', title: 'Watch: Way 1', task: CROSS, steps: CROSS.teach }),
    build('c-make1', CROSS, { skill: 'cross', title: 'Your turn: Way 1', prompt: 'Draw lines to partition the plus sign into 4 equal parts, like Way 1.' }),
    demo('c-way2', { skill: 'cross', title: 'Watch: Way 2', task: CROSS, steps: CROSS.teach2 }),
    build('c-make2', CROSS, { skill: 'cross', title: 'Your turn: a different way', different: 'c-make1', prompt: 'Partition the plus sign into fourths again, a different way from your first answer.', hintOverride: 'Use the 4 inside corners where the arms meet the middle square.' }),
    choice('c-why', { skill: 'cross', title: 'Why both ways work', picture: { kind: 'cross-both' },
      prompt: 'The parts in Way 1 and Way 2 look different. Why are both ways fourths?',
      options: [
        { text: 'Because both ways use 2 lines.', why: 'Two lines can also make unequal parts. Check that the 4 parts have the same area.' },
        { text: 'In each way, the 4 parts match each other and cover the whole plus sign.', correct: true, why: 'Yes. Inside each way, the 4 parts are the same size. That makes them fourths.' },
        { text: 'They are not both fourths. The parts must look the same in both ways.', why: 'Each way only has to make 4 equal parts of the same whole. The two ways can look different from each other.' },
      ],
      help: { hint: 'Look inside one way at a time. Do its 4 parts match?', steps: [{ text: 'Way 1: each part is an L-shaped corner. A quarter turn moves one onto the next.', picture: { kind: 'task', task: 'cross', lines: CROSS.solutions[0], shade: true } }] } }),
  ],
  shapes: SHAPES.flatMap((s, i) => [
    demo(`d-${s.skill}-teach`, { skill: s.skill, phase: 'teach', shape: i, title: `Teach Me: ${s.name} into ${s.goal}`, task: s.guide, steps: teachSteps(s.guide, s.goal) }),
    build(`d-${s.skill}-guide`, s.guide, { skill: s.skill, phase: 'guide', shape: i, title: `Guide Me: ${s.name} into ${s.goal}`, prompt: `Draw lines to partition the ${s.name.toLowerCase()} into ${s.guide.count} equal parts, or ${s.goal}. Use ? Help if you get stuck.` }),
    build(`d-${s.skill}-myturn`, s.myTurn, { skill: s.skill, phase: 'myturn', shape: i, independent: true, title: `My Turn: a new ${s.name.toLowerCase()}`, prompt: `A new ${s.name.toLowerCase()}! Partition it into ${s.myTurn.count} equal parts, or ${s.goal}, on your own.` }),
  ]),
  sizes: [
    { id: 'e-explore', type: 'sizes', skill: 'sizes', title: 'Same whole, more parts', text: 'Each strip below is the same size. Choose how many equal parts to make. Watch what happens to one part.' },
    choice('e-what', { skill: 'sizes', title: 'What happens?', picture: { kind: 'strips', parts: [2, 3, 6], shade: true },
      prompt: 'Look at the shaded part in each strip. The strips are all the same length. The more equal parts a strip has, the ___ each part is.',
      options: [
        { text: 'Each part gets bigger.', why: '6 is a bigger number than 2, but look at the shaded parts: one sixth is the smallest. More parts share the same whole.' },
        { text: 'Each part gets smaller.', correct: true, why: 'Yes. The whole stays the same size, so when more parts share it, each part gets smaller.' },
        { text: 'Each part stays the same size.', why: 'Compare the shaded parts. They end at different places, so they are different sizes.' },
      ],
      help: { hint: 'Look at one shaded part from each strip. Which is longest?', steps: [{ text: 'Line up the shaded parts. The half reaches farthest; the sixth is shortest.', picture: { kind: 'strips', parts: [2, 3, 6], shade: true, guide: true } }] } }),
    choice('e-why', { skill: 'sizes', title: 'Explain why', picture: { kind: 'strips', parts: [2, 3, 6], shade: true, guide: true },
      prompt: 'Why do the parts get smaller?',
      options: [
        { text: 'Because 6 is smaller than 2.', why: '6 is bigger than 2. It is the number of parts that is bigger, and that makes each part smaller.' },
        { text: 'Because the strips with more parts are shorter.', why: 'All three strips are the same length. Only the number of parts changes.' },
        { text: 'The whole stays the same size, so more parts must share the same space.', correct: true, why: 'Exactly. Sharing one whole among more equal parts makes each part smaller.' },
      ],
      help: { hint: 'Did the size of the whole strip change?', steps: [{ text: 'All three strips start and end at the same place. The whole did not change.', picture: { kind: 'strips', parts: [2, 3, 6], guide: false } }] } }),
    write('e-write', { skill: 'sizes', title: 'In your own words', picture: { kind: 'strips', parts: [2, 3, 6], shade: true },
      prompt: 'Finish this idea in your own words: More equal parts means each part is...',
      sample: 'When the same whole is cut into more equal parts, each part gets smaller, because more parts have to share the same amount of space.',
      checks: ['I said the whole stays the same size.', 'I said each part gets smaller.', 'I said why: more parts share the same space.'],
      help: { hint: 'Start with: "Each part gets ... because ..."' } }),
  ],
  mistake: [
    choice('f-cookie', { skill: 'mistake', title: 'Is this fourths?', picture: { kind: 'cookie' },
      prompt: 'Jun cut a round cookie with 3 straight cuts that all go the same way. The cuts are evenly spaced. Jun says, "I made fourths because I have 4 pieces." Do you agree?',
      options: [
        { text: 'Yes. The cuts are evenly spaced, so the pieces are equal.', why: 'Evenly spaced cuts make equal parts in a rectangle. A circle gets narrow near its edge, so the two end pieces are smaller.' },
        { text: 'No. The two middle pieces cover more space than the two end pieces.', correct: true, why: 'Right. The middle pieces are tall. The end pieces are short and curved. The areas are not equal, so they are not fourths.' },
        { text: 'Yes. Jun has 4 pieces, so they are fourths.', why: 'Counting 4 pieces is not enough. Fourths must be 4 pieces with equal areas.' },
      ],
      help: { hint: 'Compare an end piece with a middle piece. Which one covers more space?', steps: [{ text: 'Look at the heights. The middle pieces are tall. The end pieces get short near the edge of the circle.', picture: { kind: 'cookie', heights: true } }, { text: 'Flip an end piece onto a middle piece. It does not fill it. Space is left over.', picture: { kind: 'cookie', flip: true } }] } }),
    choice('f-agree', { skill: 'mistake', title: 'Another one: is this fourths?', picture: { kind: 'pie' },
      prompt: 'Rio cut a round pie with 2 straight cuts. Rio says, "My pie shows fourths because it has 4 pieces." Do you agree?',
      options: [
        { text: 'Yes. Rio has 4 pieces, so the pie shows fourths.', why: 'Four pieces is not enough. Fourths need 4 pieces with the same area. Compare a top piece and a bottom piece.' },
        { text: 'No. The 2 top pieces are bigger than the 2 bottom pieces, so they are not equal parts.', correct: true, why: 'Right. The cut across is below the center, so the top pieces cover more space. Fourths must be 4 equal parts.' },
        { text: 'No. A circle can never be cut into fourths.', why: 'A circle can be cut into fourths: two lines through the center, crossing like a plus sign. Rio\'s cut across misses the center.' },
      ],
      help: { hint: 'Find the center of the pie. Do both cuts go through it?', steps: [{ text: 'The up-and-down cut goes through the center. The cut across is lower than the center.', picture: { kind: 'pie', center: true } }, { text: 'Flip a bottom piece up onto a top piece. It does not fill it. There is space left over.', picture: { kind: 'pie', center: true, flip: true } }] } }),
    build('f-fix', circleTask({ id: 'pie-fix', label: 'Pie: fourths', count: 4, center: [160, 150], radius: 115, solutions: [[['e0', 'e4'], ['e2', 'e6']], [['e1', 'e5'], ['e3', 'e7']]], hint: 'Draw 2 lines through the center that cross like a plus sign.', why: 'Two lines through the center that cross like a plus sign make 4 equal slices. These are fourths.' }),
      { skill: 'mistake', title: 'Make real fourths', prompt: 'Draw lines to cut this round pie into 4 equal parts, or fourths.' }),
    write('f-write', { skill: 'mistake', title: 'Explain to Jun', picture: { kind: 'cookie', flip: true },
      prompt: 'Write what you would tell Jun about the cookie.',
      sample: 'I do not agree. Your cookie has 4 pieces, but the middle pieces are bigger than the end pieces. Fourths must have equal areas. Two lines through the center, crossing like a plus sign, would make fourths.',
      checks: ['I said whether I agree.', 'I said the pieces are not the same size (area).', 'I said what fourths need, or how to fix it.'],
      help: { hint: 'Start with: "I agree" or "I do not agree", then say why.' } }),
  ],
  count: [
    concept('g-regions', { skill: 'count', title: 'Count parts, not lines', picture: { kind: 'figure', figure: 'tiles', lines: true },
      text: ['A part is a space inside the outline. A line is just the edge between parts.', 'To name the parts, tap each space once and count it. Do not count the lines.'] }),
    count('g-tiles', FIGURES.tiles, { skill: 'count', title: 'Tile pattern', prompt: 'Tap each tile to count it. Then complete the sentence.', answer: '6', name: 'sixths',
      hint: 'All the tiles match. Count one row, then the other row.' }),
    count('g-slant', FIGURES.slant, { skill: 'count', title: 'Slanted shape', prompt: 'This slanted shape is made of 4 matching slanted pieces. Each piece is cut corner to corner into 2 matching triangles. Tap each triangle to count it. Then complete the sentence.', answer: '8', name: 'eighths',
      hint: 'Count the triangles in one slanted piece. Then count the pieces.' }),
    count('g-triangle', FIGURES.triangle, { skill: 'count', title: 'Triangle', prompt: 'The middles of the 3 sides are joined. Tap each small triangle to count it. Then complete the sentence.', answer: '4', name: 'fourths',
      hint: 'Look at each corner. Then look in the middle too.' }),
    build('g-triangle-make', TASKS.find((t) => t.id === 'triangle-fourths'), { skill: 'count', title: 'Make it yourself', prompt: 'Now you make it. Join the middles of the sides to partition this triangle into 4 equal triangles.' }),
  ],
  area: [
    choice('h-halves', { skill: 'area', title: 'Half of a half', picture: { kind: 'task', task: 'halves', lines: HALVES.solution, shade: true, label: 'A rectangle cut in half top and bottom. The top half is cut into 2 boxes side by side. The bottom half is cut into 2 long strips, one above the other.' },
      prompt: 'Mia cut a rectangle in half, top and bottom. She cut the top half into 2 boxes and the bottom half into 2 long strips. Are the 4 parts equal in area?',
      options: [
        { text: 'No. Boxes and strips are different shapes.', why: 'Different shapes can have the same area. Each half was cut into 2 equal parts.' },
        { text: 'No. The strips are thinner, so they are smaller.', why: 'The strips are thinner, but they are longer. Each strip is still half of the bottom half.' },
        { text: 'Yes. Each half is cut into 2 equal parts, and half of a half is one fourth.', correct: true, why: 'Yes. The top half makes 2 equal boxes and the bottom half makes 2 equal strips. Every part is half of a half: one fourth.' },
      ],
      help: { hint: 'First find the 2 halves. Then look at how each half is cut.', steps: [{ text: 'The line across the middle makes 2 equal halves.', picture: { kind: 'task', task: 'halves', lines: [['l1-2', 'r1-2']], shade: true } }, { text: 'The top half is cut into 2 matching boxes. Each box is half of the top half.', picture: { kind: 'task', task: 'halves', lines: [['l1-2', 'r1-2'], ['t1-2', 'c']] } }] } }),
    { id: 'h-grid', type: 'area', skill: 'area', graded: true, grid: GRID, answer: 'equal', title: 'Are these parts equal?',
      prompt: 'This rectangle has 4 parts: two long strips and two blocks. Turn on the unit squares and tap each part to count its squares. Are all 4 parts equal in area?',
      options: [
        { value: 'equal', text: 'Yes. Each part covers 6 unit squares.', correct: true, why: 'Yes. A long strip is 6 squares in a row. A block is 3 squares by 2 squares, also 6. Same area, different shape.' },
        { value: 'unequal', text: 'No. The strips and blocks are different shapes.', why: 'Different shapes can still have the same area. Count the unit squares in a strip and in a block.' },
      ],
      help: { hint: 'Count the unit squares in one strip. Then count the squares in one block.', steps: [{ text: 'Part A, a strip: 6 squares in one row. 6 unit squares.', picture: { kind: 'grid', show: [0] } }, { text: 'Part B, a block: 2 rows of 3. 3 + 3 = 6 unit squares.', picture: { kind: 'grid', show: [0, 1] } }] } },
    write('h-write', { skill: 'area', title: 'Explain your thinking', picture: { kind: 'grid', show: [0, 1, 2, 3] },
      prompt: 'Explain how you know whether the 4 parts are equal.',
      sample: 'The parts are equal. Each strip is 6 squares long. Each block is 3 squares across and 2 down, which is also 6 squares. All 4 parts have an area of 6 square units, so they are fourths.',
      checks: ['I said whether the parts are equal.', 'I used unit squares (area) to compare.', 'I explained that different shapes can have the same area.'],
      help: { hint: 'Start with: "Each part covers ___ unit squares, so..."' } }),
  ],
  check: [
    build('i-rect', rectTask({ id: 'check-rect', label: 'Rectangle: fourths', count: 4, x: 70, y: 20, w: 180, h: 240, across: Q, down: Q, viewBox: [320, 280],
      solutions: [cols(4), rows(4), [['t2-4', 'b2-4'], ['l2-4', 'r2-4']]], hint: 'Use matching marks so every part gets the same width or height.', why: 'The 4 parts have the same area, so they are fourths.' }),
      { skill: 'rectangles', independent: true, title: 'Check 1: tall rectangle', prompt: 'Partition this tall rectangle into fourths.' }),
    build('i-square', rectTask({ id: 'check-square', label: 'Square: eighths', count: 8, x: 50, y: 30, w: 220, h: 220, across: Q, down: Q, viewBox: [320, 280],
      solutions: [[...cols(4), ['l2-4', 'r2-4']], [['t2-4', 'b2-4'], ...rows(4)]], hint: 'The marks show fourths. 4 columns times 2 rows is 8.', why: '8 matching rectangles cover the square. Each is one eighth.' }),
      { skill: 'shapes', independent: true, title: 'Check 2: square', prompt: 'Partition this square into eighths.' }),
    build('i-circle', bare(circleTask({ id: 'check-circle', label: 'Circle: sixths', count: 6, center: [160, 150], radius: 110, edge: 6, start: -Math.PI / 2,
      solutions: [[['e0', 'e3'], ['e1', 'e4'], ['e2', 'e5']], fan(6, 'e')], hint: 'Every line should go through the middle of the circle, from one edge point to the point straight across.', why: 'Six slices that open by the same amount from the center are sixths.' })),
      { skill: 'shapes', independent: true, title: 'Check 3: circle', prompt: 'Partition this circle into sixths.' }),
    choice('i-sizes', { skill: 'sizes', independent: true, title: 'Check 4: sizes', picture: { kind: 'strips', parts: [2, 4, 8], shade: true },
      prompt: 'Three same-size strips are cut into 2, 4 and 8 equal parts. Which strip has the biggest parts?',
      options: [{ text: 'The strip with 8 parts', why: 'More parts share the same whole, so each of the 8 parts is the smallest.' }, { text: 'The strip with 2 parts', correct: true, why: 'Yes. Fewer parts sharing the same whole means bigger parts.' }, { text: 'They are all the same size', why: 'Compare the shaded parts. One half is much longer than one eighth.' }],
      help: { hint: 'Fewer parts sharing the same whole means each part is...?', steps: [{ text: 'Compare the shaded parts.', picture: { kind: 'strips', parts: [2, 4, 8], shade: true, guide: true } }] } }),
    choice('i-oval', { skill: 'mistake', independent: true, title: 'Check 5: an oval', picture: { kind: 'oval' },
      prompt: 'Noor cut an oval rug into 4 strips with 3 evenly spaced cuts that go side to side. Noor says the strips are fourths. Do you agree?',
      options: [
        { text: 'Yes. The cuts are evenly spaced, so the strips are equal.', why: 'Evenly spaced cuts do not make equal parts in a round or oval shape. The top and bottom strips are short and curved.' },
        { text: 'Yes. There are 4 strips.', why: 'Counting 4 parts is not enough. Fourths need equal areas.' },
        { text: 'No. The middle strips cover more space than the top and bottom strips.', correct: true, why: 'Right. The oval is widest in the middle, so the middle strips are bigger. They are not fourths.' },
      ],
      help: { hint: 'Where is the oval widest? Where is it narrow?', steps: [{ text: 'The middle strips are wide. The top and bottom strips are narrow and curved.', picture: { kind: 'oval', mark: true } }] } }),
    count('i-tiles', FIGURES.tiles2, { skill: 'count', independent: true, title: 'Check 6: tile pattern', prompt: 'All the tiles match. Tap each one to count it, then complete the sentence.', answer: '6', name: 'sixths', hint: 'Count the tiles in one row. How many rows are there?' }),
    count('i-star', FIGURES.star, { skill: 'count', independent: true, title: 'Check 7: star', prompt: 'All the diamond tiles match. Tap each one to count it, then complete the sentence.', answer: '8', name: 'eighths', hint: 'Go around the center like a clock.' }),
    count('i-kite', FIGURES.kite, { skill: 'count', independent: true, title: 'Check 8: slanted shape', prompt: 'Tap each part to count it. Then complete the sentence.', answer: '4', name: 'fourths', hint: 'Count the spaces, not the lines.' }),
    choice('i-halves', { skill: 'area', independent: true, title: 'Check 9: a new rectangle', picture: { kind: 'task', task: 'halves2', lines: HALVES2.solution, shade: true, label: 'A rectangle cut in half left and right. The left half is cut corner to corner into 2 triangles. The right half is cut into 2 boxes, one above the other.' },
      prompt: 'Leo cut a rectangle in half, left and right. He cut the left half corner to corner and the right half into 2 boxes. Are the 4 parts fourths?',
      options: [
        { text: 'No. Triangles and boxes cannot have the same area.', why: 'Different shapes can have the same area. Each half was cut into 2 equal parts.' },
        { text: 'Yes. Each half is cut into 2 equal parts, so each part is half of a half: one fourth.', correct: true, why: 'Yes. Both triangles are half of the left half, and both boxes are half of the right half. All 4 are fourths.' },
        { text: 'No. The triangles are bigger because they are longer.', why: 'The triangles are long but narrow at one end. Each triangle is exactly half of the left half.' },
      ],
      help: { hint: 'Find the 2 halves first. Is each half cut into 2 equal parts?', steps: [{ text: 'The up-and-down line makes 2 equal halves.', picture: { kind: 'task', task: 'halves2', lines: [['t1-2', 'b1-2']], shade: true } }] } }),
    write('i-reflect', { skill: 'reflect', independent: true, title: 'Think back', picture: { kind: 'reflect' },
      prompt: 'Tell how you would split a shape into equal parts. Then tell how you would check that the parts really are equal.',
      sample: 'I find the whole shape. I draw lines so that every part covers the same amount of space. Then I check: the parts must cover the whole and each part must have the same area. I count the parts to name them, like 4 equal parts are fourths.',
      checks: ['I said the parts must cover the whole.', 'I said each part must have the same area.', 'I said how to name the parts by counting them.'],
      help: { hint: 'Think about the steps you used today: draw, check the areas, count and name.' } }),
  ],
};
  return Object.fromEntries(Object.values(CARDS).flat().map((c) => [c.id, c]));
})();

// ------------------------------------------------------------------ the teaching sequence: I Do → We Do → You Do for every skill
// I Do: a worked example, step by step, with the reason. We Do: a new problem with help and step guidance.
// You Do: another new problem with no hints; mistakes get targeted feedback, then a re-teach and a retry.
const ido = (c) => ({ ...c, phase: 'ido' });
const wedo = (c) => ({ ...c, phase: 'wedo' });
const youdo = (c) => ({ ...c, help: undefined, hintOverride: undefined, phase: 'youdo', independent: true });
const say = (c) => ({ ...c, phase: 'say' });
const picDemo = (id, o) => ({ id, type: 'demo', pictures: true, ...o });
export const RECT_EIGHTHS_YOU = rectTask({ id: 'rect-eighths-you', label: 'Rectangle: eighths', count: 8, x: 40, y: 40, w: 240, h: 200, across: Q, down: Q, viewBox: [320, 280],
  solutions: [[...cols(4), ['l2-4', 'r2-4']], [['t2-4', 'b2-4'], ...rows(4)]],
  why: 'Eight parts with the same size cover the whole rectangle. Eight equal parts are eighths.', hint: 'Make 4 equal columns, then cut every column in half.' });
export const HALVES3 = rectTask({ id: 'halves3', label: 'Rectangle: four parts', count: 4, x: 40, y: 40, w: 240, h: 180, across: [[1, 2]], down: [[1, 2]],
  solutions: [[['l1-2', 'r1-2'], ['k0', 'r1-2'], ['c', 'b1-2']]], why: 'Each half is split into 2 equal parts, so all 4 parts are fourths.' });
HALVES3.points.push(point('c', [160, 130], 'Center'));

export const UNITS = [
  { id: 'whole', section: 'explore', title: 'Equal parts', cards: [
    ido(OLD['a-words']), ido(OLD['a-area']),
    ido(picDemo('a-show', { skill: 'whole', title: 'Watch: are these fourths?', steps: [
      { text: 'Here are three sandwiches. They are the same size. Each sandwich is one whole.', picture: { kind: 'sandwiches' } },
      { text: 'Count the pieces. Each sandwich is cut into 4 pieces.', picture: { kind: 'sandwiches' } },
      { text: 'Are they fourths? Check the area. The faint grid splits each sandwich into 16 tiny squares.', picture: { kind: 'sandwiches', grid: true } },
      { text: 'Sandwich 3: each piece covers 4 tiny squares. Sandwich 1: the 4 triangles match, so each covers the same space as 4 tiny squares. Equal parts!', picture: { kind: 'sandwiches', grid: true, mark: 2 } },
      { text: 'Sandwich 2: one strip covers 6 tiny squares, but another covers only 2. Not equal, so these are not fourths.', picture: { kind: 'sandwiches', grid: true, mark: 1 } },
      { text: 'Why: fourths are 4 parts with the same area. Counting 4 pieces is not enough. We compare how much space each part covers.', picture: { kind: 'sandwiches', grid: true } },
    ] })),
    wedo(OLD['a-notfourths']),
    youdo({ id: 'a-flags', type: 'choice', graded: true, multi: true, skill: 'whole', title: 'Three flags', picture: { kind: 'flags' },
      prompt: 'These three flags are the same size. Which flags are cut into fourths? Choose all that are right.',
      options: [
        { text: 'Flag 1 (stripes across)', why: 'Flag 1: the stripes are not all the same height. A thick stripe covers more space than a thin one.' },
        { text: 'Flag 2 (corner to corner)', correct: true, why: 'Flag 2: the two lines cross in the middle, so all 4 triangles have the same area. Fourths.' },
        { text: 'Flag 3 (stripes up and down)', correct: true, why: 'Flag 3: 4 stripes with the same width and the same height. Fourths.' },
      ] }),
  ] },
  { id: 'rectangles', section: 'method', title: 'Rectangles', cards: [
    ido(OLD['b-fourths']), wedo(OLD['b-fourths-make']), wedo(OLD['b-triangles']),
    ido(OLD['b-sixths']), wedo(OLD['b-sixths-make']),
    ido(OLD['b-eighths']), wedo(OLD['b-eighths-make']),
    youdo({ id: 'b-eighths-you', type: 'build', graded: true, task: RECT_EIGHTHS_YOU, skill: 'rectangles', title: 'On your own: a new rectangle', prompt: 'This rectangle only has marks for fourths. Partition it into 8 equal parts, or eighths.', relearn: 'b-eighths' }),
  ] },
  { id: 'cross', section: 'cross', title: 'Plus sign', cards: [
    ido(OLD['c-way1']), ido(OLD['c-way2']),
    wedo({ ...OLD['c-make1'], task: CROSS_WEDO, title: 'Together: a plus sign', prompt: 'Draw lines to partition this plus sign into 4 equal parts. Try Way 1 or Way 2.' }), wedo(OLD['c-why']),
    youdo({ ...OLD['c-make2'], task: CROSS_YOU, relearn: 'c-way2', title: 'On your own: a new plus sign', prompt: 'Here is a new plus sign. Partition it into fourths a different way from the way you drew before.' }),
  ] },
  ...SHAPES.map((sh) => ({ id: sh.skill, section: 'shapes', title: `${sh.name} into ${sh.goal}`, cards: [
    ido({ ...OLD[`d-${sh.skill}-teach`], title: `Watch: ${sh.name.toLowerCase()} into ${sh.goal}` }),
    wedo({ ...OLD[`d-${sh.skill}-guide`], task: sh.wedo, title: `Together: ${sh.name.toLowerCase()} into ${sh.goal}` }),
    youdo({ ...OLD[`d-${sh.skill}-myturn`], title: `On your own: a new ${sh.name.toLowerCase()}`, relearn: `d-${sh.skill}-teach`, relearnSteps: sh.relearnSteps, relearnTask: sh.guide }),
    ...(sh.skill === 'octagon8' ? [say({ id: 'd-paper', type: 'concept', skill: 'octagon8', title: 'Try it on paper', picture: { kind: 'reflect' },
      text: ['Your workbook shapes have **no dots**. Ask a grown-up to draw a diamond, a hexagon and a circle on paper.', 'Draw lines to make fourths, sixths and eighths. Then check: do the lines cross in the **middle**? Do the parts look the **same size**?'] })] : []),
  ] })),
  { id: 'sizes', section: 'sizes', title: 'Compare part sizes', cards: [
    ido(OLD['e-explore']),
    ido(picDemo('e-show', { skill: 'sizes', title: 'Watch: more parts, smaller parts', steps: [
      { text: 'Three strips are the same size. One is cut into 4 equal parts, one into 6 and one into 8.', picture: { kind: 'strips', parts: [4, 6, 8] } },
      { text: 'Shade one part of each strip.', picture: { kind: 'strips', parts: [4, 6, 8], shade: true } },
      { text: 'Line them up. One fourth reaches farthest. One eighth is the shortest.', picture: { kind: 'strips', parts: [4, 6, 8], shade: true, guide: true } },
      { text: 'Why: the whole stays the same size. When more parts share it, each part gets smaller.', picture: { kind: 'strips', parts: [4, 6, 8], shade: true, guide: true } },
    ] })),
    wedo(OLD['e-what']), wedo(OLD['e-why']),
    youdo({ id: 'e-you', type: 'choice', graded: true, skill: 'sizes', title: 'On your own: smallest parts', picture: { kind: 'strips', parts: [3, 4, 6], shade: true },
      prompt: 'Three same-size strips are cut into 3, 4 and 6 equal parts. Which strip has the smallest parts?',
      options: [
        { text: 'The strip with 3 parts', why: 'Only 3 parts share that strip, so each part is the biggest, not the smallest.' },
        { text: 'The strip with 4 parts', why: 'Look again. Is there a strip that has even more parts sharing the same whole?' },
        { text: 'The strip with 6 parts', correct: true, why: 'Yes. The most parts share the same whole, so each part is the smallest.' },
      ], relearn: 'e-show' }),
    say(OLD['e-write']),
  ] },
  { id: 'mistake', section: 'mistake', title: 'Four parts are not always fourths', cards: [
    ido(picDemo('f-show', { skill: 'mistake', title: 'Watch: check a cookie', steps: [
      { text: 'Jun cut a round cookie with 3 straight cuts that are evenly spaced. Jun says the cookie shows fourths. Let\'s check.', picture: { kind: 'cookie' } },
      { text: 'There are 4 pieces. But fourths must have equal areas, so we compare the pieces.', picture: { kind: 'cookie' } },
      { text: 'Look at the heights. The middle pieces are tall. The end pieces are short, because a circle is narrow near its edge.', picture: { kind: 'cookie', heights: true } },
      { text: 'Flip an end piece onto a middle piece. It does not fill it: space is left over. The end piece is smaller.', picture: { kind: 'cookie', flip: true } },
      { text: 'Going through the center is not enough, either. These 2 lines cross at a slant. Two slices are wide and two are thin: not fourths!', picture: { kind: 'xcircle', angle: 40 } },
      { text: 'To make fourths of a circle, draw 2 lines through the center that cross like a plus sign. All 4 slices open the same amount.', picture: { kind: 'pie', fair: true } },
    ] })),
    wedo(OLD['f-agree']), wedo(OLD['f-fix']),
    youdo({ ...OLD['i-oval'], id: 'f-oval', title: 'On your own: an oval rug', relearn: 'f-show' }),
    say(OLD['f-write']),
  ] },
  { id: 'count', section: 'count', title: 'Count and name equal parts', cards: [
    ido(picDemo('g-show', { skill: 'count', title: 'Watch: count the parts', steps: [
      { text: 'A part is a space inside the outline. A line is just the edge between parts. We count spaces, not lines.', picture: { kind: 'figure', figure: 'tiles', lines: true } },
      { text: 'All the tiles match. Count each space once: 1, 2, 3...', picture: { kind: 'figure', figure: 'tiles', counted: [0, 1, 2] } },
      { text: '...4, 5, 6. There are 6 equal tiles.', picture: { kind: 'figure', figure: 'tiles', counted: [0, 1, 2, 3, 4, 5] } },
      { text: '6 equal parts are called sixths. So: the shape is partitioned into 6 equal parts, or sixths.', picture: { kind: 'figure', figure: 'tiles', counted: [0, 1, 2, 3, 4, 5] } },
    ] })),
    wedo(OLD['g-slant']), wedo(OLD['g-triangle']), wedo(OLD['g-triangle-make']),
    youdo({ id: 'g-you', type: 'count', graded: true, figure: FIGURES.jack, skill: 'count', title: 'On your own: a square', prompt: 'These triangles all have the same area. Tap each one to count it. Then complete the sentence.', answer: '8', name: 'eighths', relearn: 'g-show' }),
  ] },
  { id: 'area', section: 'area', title: 'Equal area, different shapes', cards: [
    ido(picDemo('h-show', { skill: 'area', title: 'Watch: half of a half', steps: [
      { text: 'Mia cut this rectangle into 4 parts: 2 boxes and 2 long strips. They look different. Are they equal?', picture: { kind: 'task', task: 'halves', lines: HALVES.solution } },
      { text: 'First, the line across the middle makes 2 equal halves.', picture: { kind: 'task', task: 'halves', lines: [['l1-2', 'r1-2']], shade: true } },
      { text: 'The top half is cut into 2 matching boxes. Each box is half of the top half.', picture: { kind: 'task', task: 'halves', lines: [['l1-2', 'r1-2'], ['t1-2', 'c']] } },
      { text: 'The bottom half is cut into 2 matching strips. Each strip is half of the bottom half.', picture: { kind: 'task', task: 'halves', lines: HALVES.solution } },
      { text: 'Half of a half is one fourth. All 4 parts are fourths, even though boxes and strips look different.', picture: { kind: 'task', task: 'halves', lines: HALVES.solution, shade: true } },
    ] })),
    wedo(OLD['h-grid']),
    youdo({ ...OLD['i-halves'], id: 'h-you', title: 'On your own: a new rectangle', relearn: 'h-show' }),
    say(OLD['h-write']),
  ] },
];
const bareShape = (t) => bare(t);
const assess = (c) => ({ ...c, help: undefined, relearn: undefined, phase: 'assess', independent: true });
export const ASSESSMENT = [
  assess({ ...OLD['i-rect'], id: 'q1', title: 'Question 1', skill: 'rectangles', reportLabel: 'Rectangle into fourths' }),
  assess({ ...OLD['i-square'], id: 'q2', title: 'Question 2', skill: 'rectangles', reportLabel: 'Square into eighths' }),
  assess({ id: 'q3', type: 'build', graded: true, skill: 'circle', reportLabel: 'Circle into eighths', title: 'Question 3', prompt: 'Partition this circle into eighths.',
    task: bareShape(circleTask({ id: 'q3-circle', label: 'Circle: eighths', count: 8, center: [160, 150], radius: 100, start: -Math.PI / 2 + (3 * Math.PI) / 16, solutions: [[['e0', 'e4'], ['e1', 'e5'], ['e2', 'e6'], ['e3', 'e7']]], why: 'Eight slices that open by the same amount from the center are eighths.' })) }),
  assess({ id: 'q4', type: 'build', graded: true, skill: 'octagon4', reportLabel: 'Octagon into fourths', title: 'Question 4', prompt: 'Partition this octagon into fourths.',
    task: bareShape(polygonTask({ id: 'q4-octagon', label: 'Octagon: fourths', count: 4, polygon: regular(8, 160, 150, 112, -Math.PI / 2 + Math.PI / 12), solutions: [[['v0', 'v4'], ['v2', 'v6']], [['v1', 'v5'], ['v3', 'v7']]], why: 'Two lines from corner to opposite corner, crossing like a plus sign, make 4 matching parts.' })) }),
  assess({ id: 'q5', type: 'build', graded: true, skill: 'hexagon', reportLabel: 'Hexagon into sixths', title: 'Question 5', prompt: 'Partition this hexagon into sixths.',
    task: bareShape(polygonTask({ id: 'q5-hexagon', label: 'Hexagon: sixths', count: 6, polygon: regular(6, 160, 150, 115, -Math.PI / 2 + Math.PI / 12), solutions: [[['v0', 'v3'], ['v1', 'v4'], ['v2', 'v5']]], why: 'Six matching triangles meet in the middle. Each is a sixth.' })) }),
  assess({ ...OLD['i-sizes'], id: 'q6', title: 'Question 6', reportLabel: 'Compare part sizes', prompt: 'Three same-size strips are cut into 2, 4 and 8 equal parts. Which strip has the biggest parts?' }),
  assess({ id: 'q7', type: 'choice', graded: true, skill: 'mistake', reportLabel: 'Four parts are not always fourths', title: 'Question 7', picture: { kind: 'xcircle' },
    prompt: 'Kai cut a round pizza with 2 lines through the center. The lines do not cross like a plus sign. Are the 4 pieces fourths?',
    options: [
      { text: 'Yes. Both lines go through the center.', why: 'Going through the center is not enough. The lines must cross like a plus sign so all 4 slices open by the same amount.' },
      { text: 'Yes. There are 4 pieces.', why: 'Counting 4 pieces is not enough. Fourths need equal areas.' },
      { text: 'No. Two slices are wide and two are narrow, so the areas are not equal.', correct: true, why: 'Right. The wide slices cover more space than the narrow ones. They are not fourths.' },
    ] }),
  assess({ ...OLD['i-star'], id: 'q8', title: 'Question 8', reportLabel: 'Count and name equal parts', prompt: 'Tap each tile to count it. Then complete the sentence.' }),
  assess({ id: 'q9', type: 'build', graded: true, skill: 'cross', reportLabel: 'Plus sign into fourths', title: 'Question 9', prompt: 'Partition this plus sign into fourths.', task: CROSS_Q }),
  assess({ id: 'q10', type: 'choice', graded: true, skill: 'area', reportLabel: 'Equal area, different shapes', title: 'Question 10', picture: { kind: 'task', task: 'halves3', lines: HALVES3.solution, shade: true, label: 'A rectangle cut in half top and bottom. The top half is cut corner to corner into 2 triangles. The bottom half is cut into 2 boxes side by side.' },
    prompt: 'This rectangle is cut in half, top and bottom. The top half is cut corner to corner. The bottom half is cut into 2 boxes. Are the 4 parts fourths?',
    options: [
      { text: 'No. Triangles and boxes are different shapes.', why: 'Different shapes can have the same area. Each half was cut into 2 equal parts.' },
      { text: 'No. The triangles are bigger because they are longer.', why: 'The triangles are long but thin at one end. Each triangle is exactly half of the top half.' },
      { text: 'Yes. Each half is cut into 2 equal parts, so each part is one fourth.', correct: true, why: 'Yes. Half of a half is one fourth, for the triangles and for the boxes.' },
    ] }),
];
export const CARDS = Object.fromEntries(JOURNEY.map((s) => [s.id, s.id === 'check' ? ASSESSMENT : UNITS.filter((u) => u.section === s.id).flatMap((u) => u.cards.map((c) => ({ ...c, unit: u.id })))]));
// Count questions share their two-part sentence.
for (const list of Object.values(CARDS)) for (const c of list) if (c.type === 'count') { c.nums = NUMS; c.names = NAMES; }
export const ALL_CARDS = JOURNEY.flatMap((s) => CARDS[s.id].map((c) => ({ ...c, stage: s.id })));
export const unitOf = (card) => UNITS.find((u) => u.id === card.unit);
export const cardById = (id) => ALL_CARDS.find((c) => c.id === id);
export const TASK_INDEX = Object.fromEntries([RECT_FOURTHS, RECT_SIXTHS, RECT_EIGHTHS, RECT_EIGHTHS_YOU, CROSS, CROSS_WEDO, CROSS_YOU, CROSS_Q, HALVES, HALVES2, HALVES3, ...SHAPES.flatMap((s) => [s.guide, s.wedo, s.myTurn])].map((t) => [t.id, t]));

// ------------------------------------------------------------------ checking
/** Validates a construction and adds the regions to draw (polygon faces or circle sectors). */
export function checkBuild(task, lines) {
  const result = validatePartition(task, lines);
  let shapes = result.regions || [];
  if (task.shape === 'circle' && result.areas.length > 1) shapes = circleSectors(task, lines);
  const areas = result.areas;
  let big = -1, small = -1;
  if (!result.valid && areas.length > 1) {
    big = areas.indexOf(Math.max(...areas)); small = areas.indexOf(Math.min(...areas));
    if (Math.abs(areas[big] - areas[small]) < 1e-6 * areas[big]) big = small = -1;
  }
  return { ...result, shapes, big, small };
}
/** Circle slices as start/end angles, in the same order as the validator's areas. */
export function circleSectors(task, lines) {
  const at = new Map(task.points.map((p) => [p.id, [p.x, p.y]])), [cx, cy] = task.center, angles = [];
  for (const [a, b] of lines) for (const p of [at.get(a), at.get(b)]) { if (!p) continue; const dx = p[0] - cx, dy = p[1] - cy; if (Math.hypot(dx, dy) > 1e-7) angles.push(Math.round(((Math.atan2(dy, dx) + TAU) % TAU) * 1e10) / 1e10); }
  const a = [...new Set(angles)].sort((x, y) => x - y);
  return a.length < 2 ? [] : a.map((x, i) => ({ sector: [x, a[(i + 1) % a.length]] }));
}
/** True when two points lie on the same side of a polygon whole: that line would trace the outline, not split it. */
export function onSameEdge(task, a, b) {
  if (task.shape !== 'polygon') return false;
  const at = new Map(task.points.map((p) => [p.id, [p.x, p.y]])), P = at.get(a), Q = at.get(b);
  if (!P || !Q) return false;
  const on = (p, u, v) => Math.abs((v[0] - u[0]) * (p[1] - u[1]) - (v[1] - u[1]) * (p[0] - u[0])) < 1e-6 * Math.hypot(v[0] - u[0], v[1] - u[1]) && Math.min(u[0], v[0]) - 1e-6 <= p[0] && p[0] <= Math.max(u[0], v[0]) + 1e-6 && Math.min(u[1], v[1]) - 1e-6 <= p[1] && p[1] <= Math.max(u[1], v[1]) + 1e-6;
  return task.polygon.some((u, i) => { const v = task.polygon[(i + 1) % task.polygon.length]; return on(P, u, v) && on(Q, u, v); });
}
/** A short, shape-specific tip after unequal parts. */
export function unequalTip(task) {
  if (task.shape === 'circle') return `Your lines go through the center. Now make the slices open by the same amount${task.count === 4 ? ', like a plus sign' : ': space the lines evenly, like spokes'}.`;
  if (task.points.some((p) => /^t\d/.test(p.id))) return 'Tip: use marks that are the same distance apart, so the parts get the same width or height.';
  return 'Tip: lines that cross in the very middle of the shape make matching parts.';
}
/** A key for "the same partition", independent of how the lines were drawn. */
export function partitionKey(task, lines) {
  const at = new Map(task.points.map((p) => [p.id, [p.x, p.y]]));
  const regions = partitionPolygon(task.polygon, lines.map(([a, b]) => [at.get(a), at.get(b)]));
  const clean = (r) => r.filter((p, i) => { const a = r[(i - 1 + r.length) % r.length], b = r[(i + 1) % r.length]; return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 1e-6; });
  return regions.map((r) => clean(r).map((p) => p.map((n) => Math.round(n * 1000)).join(',')).sort().join(' ')).sort().join('|');
}
export function checkCount(card, number, name) {
  if (!number || !name) return { valid: false, message: 'Choose a number and a name to finish the sentence.', incomplete: true };
  const valid = number === card.answer && name === card.name;
  if (valid) return { valid, message: `Yes! The ${card.figure.name} is partitioned into ${card.answer} equal parts, or ${card.name}.` };
  if (number !== card.answer) return { valid, message: `Count again: tap each space once. The numbers you tap show your count.` };
  return { valid, message: `${number} is right. Now the name: ${card.answer} equal parts are called ${NAMES.find(([n]) => n === card.answer)[1]}.` };
}

// ------------------------------------------------------------------ teaching rules (plain JavaScript; no AI service)
/** A card is done when it was watched (I Do), answered correctly (We Do, You Do), checked once (Final Check) or written and compared. */
export function cardDone(card, rec) {
  if (card.type === 'concept') return true;
  if (card.type === 'sizes') return Boolean(rec?.viewed);
  if (card.type === 'demo') return Boolean(rec?.viewed);
  if (card.type === 'write') return Boolean(rec?.written);
  if (card.phase === 'assess') return (rec?.attempts || 0) > 0;
  return Boolean(rec?.correct);
}
const allDone = (cards, records) => cards.every((c) => cardDone(c, records[c.id]));
/** The first card in a section that is not done yet (the farthest a child may go), or the last card. */
export function frontier(stageId, records) { const cards = CARDS[stageId], k = cards.findIndex((c) => !cardDone(c, records[c.id])); return k < 0 ? cards.length - 1 : k; }
/** A section opens when every earlier section is done, so required teaching cannot be skipped. */
export function stageUnlocked(stageId, records) { const i = JOURNEY.findIndex((s) => s.id === stageId); return JOURNEY.slice(0, Math.max(0, i)).every((s) => allDone(CARDS[s.id], records)); }
export const stageComplete = (stageId, records) => allDone(CARDS[stageId], records);
export const lessonComplete = (records) => JOURNEY.every((s) => allDone(CARDS[s.id], records));
/** Where the child should be: the first section that is not finished, or the report. */
export const nextStage = (records) => JOURNEY.find((s) => !allDone(CARDS[s.id], records))?.id || 'parent';

/**
 * Targeted feedback for a wrong answer. Kinds: 'regions' (wrong number of parts), 'area' (right number, unequal
 * areas), 'center' (a circle line that misses the center), 'choice' / 'count' (that answer's own reason).
 */
export function diagnose(card, result) {
  if (card.type !== 'build') return { kind: card.type === 'count' ? 'count' : 'choice' };
  const t = card.task, n = result.count, want = t.count;
  if (t.shape === 'circle' && !result.areas.length) return { kind: 'center', message: `That line does not go through the center. Every line in a circle has to go through the center, or the slices cannot be equal.` };
  if (n !== want) return { kind: 'regions', message: `Let's count the parts. A part is a space closed in by the outline and the lines. ${result.shapes?.length ? `The numbers show your ${n} part${n === 1 ? '' : 's'}.` : `You have ${n} part${n === 1 ? '' : 's'}.`} We need ${want}. ${n < want ? 'A line must go all the way across, from edge to edge (or to another line), to make a new part.' : 'You have too many parts. Use Undo to take a line away.'}` };
  return { kind: 'area', message: `You made ${n} parts. Good counting! But equal parts must cover the same amount of space. The part marked "bigger" covers more than the part marked "smaller". ${unequalTip(t)}` };
}

// ------------------------------------------------------------------ progress records (saved in this browser only, D29)
/** Help levels: 1 hint, 2 visual steps, 3 answer shown. */
export const HELP_LABELS = ['', 'hint', 'visual steps', 'answer shown'];
export function newRecord(card) { return { id: card.id, attempts: 0, first: null, correct: false, help: 0, helpBeforeCorrect: 0, viewed: false, written: false, reviewed: false, relearn: false, wrongStreak: 0 }; }
export function noteHelp(rec, level) { rec.help = Math.max(rec.help, level); if (!rec.correct) rec.helpBeforeCorrect = Math.max(rec.helpBeforeCorrect, level); }
export function noteCheck(rec, valid) {
  rec.attempts++;
  if (rec.first === null) rec.first = valid && rec.helpBeforeCorrect === 0 && !rec.relearn ? 'correct' : valid ? 'helped' : 'wrong';
  if (valid) { rec.correct = true; rec.wrongStreak = 0; } else rec.wrongStreak = (rec.wrongStreak || 0) + 1;
}
/** How a graded question finished, for the grown-up report. */
export function outcome(rec) {
  if (!rec || (!rec.attempts && !rec.correct)) return rec?.help || rec?.relearn ? 'help-only' : 'not-tried';
  if (!rec.correct) return 'not-yet';
  if (rec.first === 'correct') return 'independent';
  if (rec.helpBeforeCorrect === 3) return 'after-answer';
  if (rec.relearn) return 'after-relearn';
  if (rec.helpBeforeCorrect === 2) return 'after-steps';
  if (rec.helpBeforeCorrect === 1) return 'after-hint';
  return 'after-retry';
}
export const OUTCOME_TEXT = {
  independent: 'Right on the first try, no help',
  'after-retry': 'Right after another try, no help',
  'after-hint': 'Finished after a hint or quick fix',
  'after-steps': 'Finished after seeing visual steps',
  'after-relearn': 'Finished after watching the example again',
  'after-answer': 'Finished after the answer was shown',
  'not-yet': 'Tried, not finished yet',
  'help-only': 'Opened help, not checked yet',
  'not-tried': 'Not tried yet',
};
const YOU_DO_TEXT = { independent: 'On own, first try', 'after-retry': 'On own, after another try', 'after-hint': 'After a quick fix', 'after-steps': 'After help steps', 'after-relearn': 'After watching the example again', 'after-answer': 'After seeing the answer', 'not-yet': 'Not finished', 'help-only': 'Not finished', 'not-tried': 'Not started' };
/** The grown-up readiness report: You Do result per skill, the Final Check score and a short verdict. */
export function readiness(records) {
  const skills = UNITS.map((u) => {
    const you = u.cards.find((c) => c.phase === 'youdo'), res = outcome(records[you.id]);
    return { unit: u, card: you, result: res, text: YOU_DO_TEXT[res], solid: res === 'independent' || res === 'after-retry', finals: ASSESSMENT.filter((q) => q.skill === u.id) };
  });
  const answered = ASSESSMENT.filter((q) => records[q.id]?.attempts > 0);
  const right = ASSESSMENT.filter((q) => records[q.id]?.first === 'correct');
  const missed = answered.filter((q) => records[q.id]?.first !== 'correct');
  const missedSkills = [...new Set(missed.map((q) => q.reportLabel))];
  const shaky = skills.filter((k) => !k.solid && k.result !== 'not-tried').map((k) => k.unit.title);
  const notChecked = UNITS.filter((u) => !ASSESSMENT.some((q) => q.skill === u.id)).map((u) => u.title);
  const buildsRight = ASSESSMENT.filter((q) => q.type === 'build').every((q) => records[q.id]?.first === 'correct');
  let verdict;
  if (answered.length < ASSESSMENT.length) verdict = { level: 'unfinished', text: 'Not finished yet. The report is complete after the 10-question Final Check.' };
  else if (right.length >= 8 && buildsRight && !skills.some((k) => k.result === 'after-answer' || k.result === 'not-yet')) verdict = { level: 'ready', text: `Ready for the workbook: ${right.length} of 10 on the Final Check, every drawing right, and every skill finished without being shown the answer.` };
  else if (right.length >= 6) verdict = { level: 'review', text: `Almost ready: ${right.length} of 10 on the Final Check. Review the skills listed below, then try the workbook.` };
  else verdict = { level: 'notyet', text: `Not ready yet: ${right.length} of 10 on the Final Check. Redo the skills listed below before the workbook.` };
  return { skills, score: right.length, answered: answered.length, total: ASSESSMENT.length, missed, missedSkills, shaky, notChecked, verdict };
}
export function summarize(records) {
  const graded = ALL_CARDS.filter((c) => c.graded);
  const rows = graded.map((c) => ({ card: c, rec: records[c.id], result: outcome(records[c.id]) }));
  const n = (f) => rows.filter(f).length;
  const totals = {
    independent: n((r) => r.result === 'independent'),
    firstWrong: n((r) => r.rec?.first === 'wrong'),
    afterHint: n((r) => r.result === 'after-hint'),
    afterSteps: n((r) => r.result === 'after-steps'),
    afterRelearn: n((r) => r.result === 'after-relearn'),
    afterAnswer: n((r) => r.result === 'after-answer'),
    notTried: n((r) => r.result === 'not-tried' || r.result === 'help-only'),
    independentOpportunities: rows.filter((r) => r.card.phase === 'youdo').length,
    independentDone: n((r) => r.card.phase === 'youdo' && r.result === 'independent'),
  };
  const written = ALL_CARDS.filter((c) => c.type === 'write').map((c) => ({ card: c, rec: records[c.id] }));
  return { rows, totals, written, ready: readiness(records) };
}

// Quick fixes for the You Do choice questions (a second miss): one picture and one focused sentence.
// Drawing and counting questions use the first help step on their own shape instead.
const QUICK = {
  'a-flags': { text: 'Fourths need 4 parts that are all the same size. Check one flag at a time. In Flag 1, are all the stripes the same height?', picture: { kind: 'flags' } },
  'e-you': { text: 'The strips are the same size. Count the parts in each strip. When more parts share the same whole, each part is smaller.', picture: { kind: 'strips', parts: [3, 4, 6], shade: true } },
  'f-oval': { text: 'Compare the top strip with a middle strip. The oval is widest in the middle. Do they cover the same amount of space?', picture: { kind: 'oval' } },
  'h-you': { text: 'Look at one half at a time. A line from corner to corner cuts the left half into 2 matching triangles. Each one is half of a half.', picture: cardById('h-you').picture },
};
for (const [id, q] of Object.entries(QUICK)) cardById(id).quick = q;
