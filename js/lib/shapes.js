// Area pictures for Chapter 6 (Lessons 6-1 to 6-6), drawn from numbers only, so a picture always matches its numbers.
//
//   grid:  a shape on unit squares. `cells` is a list of rows, one letter per square:
//          "X" a unit square tile, "o" part of the shape that is not tiled yet, "." outside the shape.
//          `paper: true` draws the squared paper around it; `tiling: "gaps"` or "overlap" draws a wrong tiling.
//          `unit` ("1 cm") draws a key square.
//   shape: a figure made of rectangles [x, y, w, h] (whole units, no overlaps, all joined), with every side
//          labelled with its length and `unit`. `show: "parts"` colours each rectangle and writes its area inside;
//          `areas: true` writes each part's area inside (teaching pictures only); `unknown` lists sides (as [x1, y1, x2, y2]) whose label is "?". `tiles: true` draws the unit squares.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.trunc(Number(v)) || 0));

// ---------------------------------------------------------------- grid

/** The letters of a grid picture as rows of equal length (anything unknown is outside). */
export function gridRows(m) {
  const rows = (Array.isArray(m.cells) ? m.cells : []).slice(0, 14).map((r) => String(r).slice(0, 14).replace(/[^Xo.]/g, '.'));
  const w = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, '.'));
}

/** Counts used by questions and tests: tiles drawn, squares in the shape (its area), rows and columns. */
export function gridCounts(m) {
  const rows = gridRows(m);
  const flat = rows.join('');
  return { tiles: [...flat].filter((c) => c === 'X').length, area: [...flat].filter((c) => c !== '.').length,
    rows: rows.length, cols: rows[0]?.length || 0 };
}

function gridSvg(m) {
  const rows = gridRows(m);
  const R = rows.length, C = rows[0]?.length || 0;
  const S = Math.max(16, Math.min(30, Math.floor(300 / Math.max(C + (m.paper ? 2 : 0), 1))));
  const pad = m.paper ? S : 4;
  const out = [];
  const W = C * S + pad * 2, H = R * S + pad * 2;
  if (m.paper) {
    for (let x = 0; x <= C + 2; x++) out.push(`<line class="g-paper" x1="${x * S}" y1="0" x2="${x * S}" y2="${H}"/>`);
    for (let y = 0; y <= R + 2; y++) out.push(`<line class="g-paper" x1="0" y1="${y * S}" x2="${W}" y2="${y * S}"/>`);
  }
  const inShape = (r, c) => r >= 0 && c >= 0 && r < R && c < C && rows[r][c] !== '.';
  // Untiled part of the shape: plain fill, no lines (the child imagines or counts the missing tiles).
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (rows[r][c] === 'o') out.push(`<rect class="g-empty" x="${pad + c * S}" y="${pad + r * S}" width="${S}" height="${S}"/>`);
  }
  // Tiles. A gap tiling draws smaller tiles with space between; an overlap tiling adds tiles that sit half on another.
  const gap = m.tiling === 'gaps' ? Math.round(S * 0.3) : 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (rows[r][c] !== 'X') continue;
    out.push(`<rect class="g-tile" x="${pad + c * S + gap / 2}" y="${pad + r * S + gap / 2}" width="${S - gap}" height="${S - gap}"/>`);
  }
  if (m.tiling === 'overlap') {
    for (let r = 0; r < R; r += 2) for (let c = 0; c < C - 1; c += 3) {
      if (rows[r][c] === 'X' && rows[r][c + 1] === 'X') out.push(`<rect class="g-tile g-over" x="${pad + c * S + S / 2}" y="${pad + r * S + S / 4}" width="${S}" height="${S}"/>`);
    }
  }
  // The outline of the shape: every side of a square that is not shared with another square of the shape.
  const edges = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (!inShape(r, c)) continue;
    const x = pad + c * S, y = pad + r * S;
    if (!inShape(r - 1, c)) edges.push(`M${x} ${y}h${S}`);
    if (!inShape(r + 1, c)) edges.push(`M${x} ${y + S}h${S}`);
    if (!inShape(r, c - 1)) edges.push(`M${x} ${y}v${S}`);
    if (!inShape(r, c + 1)) edges.push(`M${x + S} ${y}v${S}`);
  }
  out.push(`<path class="g-outline" d="${edges.join('')}"/>`);
  return `<svg class="model-svg area-svg" viewBox="-2 -2 ${W + 4} ${H + 4}" width="${W + 4}" height="${H + 4}">${out.join('')}</svg>`;
}

function describeGrid(m) {
  const c = gridCounts(m);
  const untiled = c.area - c.tiles;
  let s = m.paper ? 'A shape drawn on squared paper.' : 'A shape made of squares.';
  if (m.tiling === 'gaps') s = 'Squares placed inside a rectangle with gaps between them.';
  else if (m.tiling === 'overlap') s = 'Squares covering a rectangle, with some squares lying on top of others.';
  else if (untiled > 0 && c.tiles > 0) s += ' Part of the shape is not covered with tiles yet.';
  else if (!c.tiles) s += ' No unit squares are drawn inside it.';
  return `${s} ${describeRows(m)}`;
}

/** Row by row, how many squares of the shape each row has (so the picture can be counted without seeing it). */
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
/** Row by row, how many squares of the shape each row has (so the picture can be counted without seeing it).
 *  Rows are named in words ("the second row"), so no number in the description can be mistaken for an answer. */
function describeRows(m) {
  const rows = gridRows(m);
  const parts = rows.map((r, i) => {
    const n = [...r].filter((ch) => ch !== '.').length;
    const first = [...r].findIndex((ch) => ch !== '.');
    return n ? `the ${ORD[i]} row has ${n} square${n === 1 ? '' : 's'}${first > 0 ? `, starting in column ${first + 1}` : ''}` : null;
  }).filter(Boolean);
  const c = gridCounts(m);
  const tiled = c.tiles && c.tiles < c.area ? ` Tiles are drawn on ${c.tiles} of the squares.` : '';
  return parts.length ? `${parts.join('; ').replace(/^t/, 'T')}.${tiled}` : '';
}

// ---------------------------------------------------------------- shape (composite figures)

export function shapeRects(m) {
  return (Array.isArray(m.rects) ? m.rects : []).slice(0, 6).map((r) => [int(r[0], 0, 30), int(r[1], 0, 30), int(r[2], 1, 30), int(r[3], 1, 30)]);
}

/** Area of a figure: the sum of its rectangles (they never overlap; validateShape checks). */
export const shapeArea = (m) => shapeRects(m).reduce((s, [, , w, h]) => s + w * h, 0);

/** Problems with a shape picture: whole units, no overlaps, every rectangle joined to the others. */
export function shapeProblems(m) {
  const out = [];
  const rects = Array.isArray(m.rects) ? m.rects : [];
  if (!rects.length) return ['a shape needs at least one rectangle'];
  if (rects.length > 6) out.push('a shape can have at most 6 rectangles');
  for (const r of rects) if (!Array.isArray(r) || r.length !== 4 || !r.every((v, k) => Number.isInteger(v) && v >= (k < 2 ? 0 : 1) && v <= 30)) out.push(`rectangle ${JSON.stringify(r)} must be [x, y, width, height] in whole units`);
  if (out.length) return out;
  const cells = new Map();
  rects.forEach(([x, y, w, h], k) => {
    for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) {
      const key = `${i},${j}`;
      if (cells.has(key)) out.push(`rectangles ${cells.get(key) + 1} and ${k + 1} overlap`);
      cells.set(key, k);
    }
  });
  // Joined: the squares form one piece (moving between squares that share a side).
  const keys = [...cells.keys()];
  const seen = new Set([keys[0]]);
  const todo = [keys[0]];
  while (todo.length) {
    const [i, j] = todo.pop().split(',').map(Number);
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      const k = `${a},${b}`;
      if (cells.has(k) && !seen.has(k)) { seen.add(k); todo.push(k); }
    }
  }
  if (seen.size !== cells.size) out.push('the rectangles must be joined into one figure');
  if (m.unknown) for (const u of m.unknown) if (!shapeSides(m).some((s) => sameSide(s, u))) out.push(`unknown side ${JSON.stringify(u)} is not a side of the figure`);
  return [...new Set(out)];
}

const sameSide = (s, u) => Array.isArray(u) && s.x1 === u[0] && s.y1 === u[1] && s.x2 === u[2] && s.y2 === u[3];

/**
 * The sides of the figure, each with its length: the outline split into straight pieces (and, when the parts are
 * shown, also where two rectangles meet the outline, so each part's side is labelled on its own).
 */
export function shapeSides(m) {
  const rects = shapeRects(m);
  const owner = new Map();
  rects.forEach(([x, y, w, h], k) => { for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) owner.set(`${i},${j}`, k); });
  const at = (i, j) => (owner.has(`${i},${j}`) ? owner.get(`${i},${j}`) : -1);
  const split = m.show === 'parts';
  const sides = [];
  // Horizontal unit edges: between row j-1 and row j, at column i. side: which way is outside.
  const maxX = Math.max(...rects.map(([x, , w]) => x + w)), maxY = Math.max(...rects.map(([, y, , h]) => y + h));
  for (let j = 0; j <= maxY; j++) {
    let run = null;
    for (let i = 0; i <= maxX; i++) {
      const up = at(i, j - 1), down = at(i, j);
      const edge = (up < 0) !== (down < 0) ? { out: up < 0 ? 'up' : 'down', part: up < 0 ? down : up } : null;
      const cont = run && edge && edge.out === run.out && (!split || edge.part === run.part);
      if (run && !cont) { sides.push({ x1: run.i, y1: j, x2: i, y2: j, len: i - run.i, out: run.out }); run = null; }
      if (edge && !run) run = { i, out: edge.out, part: edge.part };
    }
  }
  for (let i = 0; i <= maxX; i++) {
    let run = null;
    for (let j = 0; j <= maxY; j++) {
      const left = at(i - 1, j), right = at(i, j);
      const edge = (left < 0) !== (right < 0) ? { out: left < 0 ? 'left' : 'right', part: left < 0 ? right : left } : null;
      const cont = run && edge && edge.out === run.out && (!split || edge.part === run.part);
      if (run && !cont) { sides.push({ x1: i, y1: run.j, x2: i, y2: j, len: j - run.j, out: run.out }); run = null; }
      if (edge && !run) run = { j, out: edge.out, part: edge.part };
    }
  }
  return sides;
}

function shapeSvg(m) {
  const rects = shapeRects(m);
  const unit = m.unit ? ` ${m.unit}` : '';
  const maxX = Math.max(...rects.map(([x, , w]) => x + w)), maxY = Math.max(...rects.map(([, y, , h]) => y + h));
  const S = Math.max(9, Math.min(30, Math.floor(Math.min(250 / maxX, 220 / maxY))));
  const padX = 52, padY = 26;
  const X = (u) => padX + u * S, Y = (u) => padY + u * S;
  const out = [];
  rects.forEach(([x, y, w, h], k) => {
    const cls = m.show === 'parts' ? `s-part s-part-${'abc'[k % 3]}` : 's-fill';
    out.push(`<rect class="${cls}" x="${X(x)}" y="${Y(y)}" width="${w * S}" height="${h * S}"/>`);
    if (m.tiles) {
      for (let i = 1; i < w; i++) out.push(`<line class="s-grid" x1="${X(x + i)}" y1="${Y(y)}" x2="${X(x + i)}" y2="${Y(y + h)}"/>`);
      for (let j = 1; j < h; j++) out.push(`<line class="s-grid" x1="${X(x)}" y1="${Y(y + j)}" x2="${X(x + w)}" y2="${Y(y + j)}"/>`);
    }
  });
  // Where two parts meet: a dashed line (only when the parts are shown).
  if (m.show === 'parts') {
    rects.forEach(([x, y, w, h], k) => rects.forEach(([x2, y2, w2, h2], k2) => {
      if (k2 <= k) return;
      if (x + w === x2 || x2 + w2 === x) { const lx = x + w === x2 ? x2 : x; const a = Math.max(y, y2), b = Math.min(y + h, y2 + h2); if (b > a) out.push(`<line class="s-cut" x1="${X(lx)}" y1="${Y(a)}" x2="${X(lx)}" y2="${Y(b)}"/>`); }
      if (y + h === y2 || y2 + h2 === y) { const ly = y + h === y2 ? y2 : y; const a = Math.max(x, x2), b = Math.min(x + w, x2 + w2); if (b > a) out.push(`<line class="s-cut" x1="${X(a)}" y1="${Y(ly)}" x2="${X(b)}" y2="${Y(ly)}"/>`); }
    }));
    // Part areas are written inside only on teaching pictures (areas: true), never on a question's picture.
    if (m.areas === true) rects.forEach(([x, y, w, h]) => {
      if (w * S >= 40 && h * S >= 22) out.push(`<text class="s-area" x="${X(x + w / 2)}" y="${Y(y + h / 2) + 5}" text-anchor="middle">${w * h}</text>`);
    });
  }
  // The outline, then a label beside every side.
  const sides = shapeSides(m);
  out.push(`<path class="s-outline" d="${sides.map((s) => `M${X(s.x1)} ${Y(s.y1)}L${X(s.x2)} ${Y(s.y2)}`).join('')}"/>`);
  const unknown = m.unknown || [];
  // A rectangle (or a rectangle split into parts) is labelled along the top and the left only, like a book page;
  // any other figure has every side labelled.
  const isRect = shapeArea(m) === maxX * maxY;
  if (m.labels !== false) {
    for (const s of sides) {
      if (isRect && (s.out === 'down' || s.out === 'right') && !unknown.some((u) => sameSide(s, u))) continue;
      const label = unknown.some((u) => sameSide(s, u)) ? '?' : `${s.len}${unit}`;
      const mx = (X(s.x1) + X(s.x2)) / 2, my = (Y(s.y1) + Y(s.y2)) / 2;
      const [tx, ty, anchor] = s.out === 'up' ? [mx, my - 6, 'middle'] : s.out === 'down' ? [mx, my + 15, 'middle']
        : s.out === 'left' ? [mx - 5, my + 4, 'end'] : [mx + 5, my + 4, 'start'];
      out.push(`<text class="s-side${label === '?' ? ' s-unknown' : ''}" x="${tx}" y="${ty}" text-anchor="${anchor}">${esc(label)}</text>`);
    }
  }
  const W = X(maxX) + padX, H = Y(maxY) + padY;
  return `<svg class="model-svg area-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out.join('')}</svg>`;
}

function describeShape(m) {
  const rects = shapeRects(m);
  const unit = m.unit ? ` ${m.unit}` : ' units';
  const sides = shapeSides({ ...m, show: undefined });
  const kind = rects.length === 1 ? (rects[0][2] === rects[0][3] ? 'A square' : 'A rectangle') : 'A figure made of rectangles';
  const maxX = Math.max(...rects.map(([x, , w]) => x + w)), maxY = Math.max(...rects.map(([, y, , h]) => y + h));
  if (rects.length > 1 && shapeArea(m) === maxX * maxY) {
    return `A rectangle, ${maxX}${unit} long and ${maxY}${unit} wide, split into ${rects.length} rectangles: ${rects.map(([, , w, h]) => `${w} by ${h}`).join(' and ')}.`;
  }
  if (rects.length === 1) return `${kind}, ${rects[0][2]}${unit} long and ${rects[0][3]}${unit} wide.${m.tiles ? ' It is covered by unit squares.' : ''}`;
  const unknown = m.unknown || [];
  const list = sides.map((s) => (unknown.some((u) => sameSide(s, u)) ? 'a side marked ?' : `${s.len}${unit}`)).join(', ');
  let txt = `${kind}. Its sides measure ${list}.`;
  if (m.show === 'parts') txt += ` It is split into ${rects.length} rectangles: ${rects.map(([, , w, h]) => `${w} by ${h}`).join(', ')}.`;
  return txt;
}

// ---------------------------------------------------------------- shared

export function areaModelSvg(m) { return m.type === 'grid' ? gridSvg(m) : shapeSvg(m); }
export function describeArea(m) { return m.type === 'grid' ? describeGrid(m) : describeShape(m); }

