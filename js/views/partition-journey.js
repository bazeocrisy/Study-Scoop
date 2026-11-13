// Lesson 7-1 learning journey view. Pure: renders journey state to HTML so it runs in Node tests.
// js/partition-journey.js handles taps, keys and focus.
import { html, raw } from '../lib/html.js';
import { speak } from '../lib/arith.js';
import { JOURNEY, CARDS, ALL_CARDS, stageComplete, UNITS, FIGURES, GRID, TASK_INDEX, RECT_FOURTHS, CROSS, checkBuild, centroid, summarize, partitionKey, cardDone, stageUnlocked, frontier, nextStage, unitOf, cardById, differentAvoidKey, OUTCOME_TEXT, HELP_LABELS, SKILLS, SHAPES } from '../lib/partition-journey.js';
import { TASKS, validatePartition } from '../lib/partition-geometry.js';

const n2 = (v) => Math.round(v * 100) / 100;
const pts = (p) => p.map((q) => `${n2(q[0])},${n2(q[1])}`).join(' ');
const taskById = (id) => TASK_INDEX[id] || TASKS.find((t) => t.id === id);
/** "**word**" becomes bold; everything else is escaped. */
const rich = (text) => html`${String(text).split('**').map((part, i) => (i % 2 ? html`<strong>${part}</strong>` : part))}`;
const plain = (text) => String(text).replace(/\*\*/g, '');
const READ_ICON = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>`;
const readButton = (parts) => html`<button type="button" class="read j-read" data-act="read" data-say="${speak(parts.filter(Boolean).map(plain).join('. '))}" aria-label="Read to me: this card">${READ_ICON}<span class="read-label">Read to me</span></button>`;

// ------------------------------------------------------------------ SVG pieces
function sectorPath([cx, cy], r, a, b) {
  const sweep = ((b - a) + Math.PI * 2) % (Math.PI * 2) || Math.PI * 2;
  if (sweep >= Math.PI * 2 - 1e-9) return `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
  const p = (t) => `${n2(cx + r * Math.cos(t))},${n2(cy + r * Math.sin(t))}`;
  return `M${cx},${cy} L${p(a)} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${p(b)} Z`;
}
const sectorMid = ([cx, cy], r, [a, b]) => { const sweep = ((b - a) + Math.PI * 2) % (Math.PI * 2) || Math.PI * 2, t = a + sweep / 2; return [cx + r * .6 * Math.cos(t), cy + r * .6 * Math.sin(t)]; };

/** A construction picture: the whole, shaded regions, divider lines and (when active) the tappable points. */
export function taskSvg(task, { lines = [], result = null, active = false, selected = null, cursor = null, label = '', small = false, dots: showDots = true } = {}) {
  const [w, h] = task.viewBox || [300, 300];
  const at = new Map(task.points.map((p) => [p.id, p]));
  const shapes = result?.shapes || [];
  // Wrong number of parts: number each part, so the child can count the spaces. Unequal parts: mark bigger/smaller.
  const numbered = result && !result.valid && result.count !== task.count && shapes.length > 0;
  const tag = (i) => (numbered ? String(i + 1) : i === result?.big ? 'bigger' : i === result?.small ? 'smaller' : '');
  const regions = shapes.map((s, i) => {
    const cls = `j-region r${i % 4}${result?.valid ? ' ok' : ''}${tag(i) ? ' marked' : ''}`;
    if (s.sector) { const [x, y] = sectorMid(task.center, task.radius, s.sector); return html`<path class="${cls}" d="${sectorPath(task.center, task.radius, ...s.sector)}"/>${tag(i) ? html`<text class="j-tag" x="${n2(x)}" y="${n2(y)}">${tag(i)}</text>` : ''}`; }
    const [x, y] = centroid(s);
    return html`<polygon class="${cls}" points="${pts(s)}"/>${tag(i) ? html`<text class="j-tag" x="${n2(x)}" y="${n2(y)}">${tag(i)}</text>` : ''}`;
  });
  const drawn = lines.map(([a, b]) => { const p = at.get(a), q = at.get(b); return p && q ? html`<line class="j-cut" x1="${n2(p.x)}" y1="${n2(p.y)}" x2="${n2(q.x)}" y2="${n2(q.y)}"/>` : ''; });
  // The touch target around each dot is as large as possible without overlapping a neighbour (at most 22 units).
  task._hit ||= Math.min(22, ...task.points.flatMap((p, i) => task.points.slice(i + 1).map((q) => Math.hypot(p.x - q.x, p.y - q.y) / 2 - .5)));
  const kind = (id) => (id === 'c' ? 'center' : /^[vk]\d/.test(id) ? 'corner' : 'mark');
  // One Tab stop for the whole drawing (roving tabindex); arrow keys move between dots (js/partition-journey.js).
  const tabTo = active ? (task.points.some((p) => p.id === cursor) ? cursor : selected || task.points[0].id) : null;
  const dots = task.points.map((p) => html`<g class="j-point ${kind(p.id)}${selected === p.id ? ' selected' : ''}"${active ? html` role="button" tabindex="${p.id === tabTo ? 0 : -1}" data-point="${p.id}" aria-label="${p.label}" aria-pressed="${selected === p.id}"` : ''}>${active ? html`<circle class="hit" cx="${n2(p.x)}" cy="${n2(p.y)}" r="${n2(task._hit)}"/><circle class="ring" cx="${n2(p.x)}" cy="${n2(p.y)}" r="17"/>` : ''}<circle class="dot" cx="${n2(p.x)}" cy="${n2(p.y)}" r="${kind(p.id) === 'mark' ? 5.5 : 7}"/></g>`);
  const whole = task.shape === 'circle' ? html`<circle class="j-whole" cx="${task.center[0]}" cy="${task.center[1]}" r="${task.radius}"/>` : html`<polygon class="j-whole" points="${pts(task.polygon)}"/>`;
  const desc = label || `${task.label}. ${lines.length} line${lines.length === 1 ? '' : 's'} drawn.`;
  return html`<svg class="j-svg${small ? ' small' : ''}${active ? ' j-build' : ''}" viewBox="0 0 ${w} ${h}" ${active ? html`role="group" data-build` : html`role="img"`} aria-label="${active ? `${desc} Use the arrow keys to move between dots, and Enter or Space to choose one.` : desc}">${whole}${regions}<g class="j-outline-top">${task.shape === 'circle' ? html`<circle cx="${task.center[0]}" cy="${task.center[1]}" r="${task.radius}"/>` : html`<polygon points="${pts(task.polygon)}"/>`}</g>${drawn}${active || (showDots && (lines.length || small)) ? dots : ''}</svg>`;
}

const gridOf = () => GRID;
function gridSvg(g, { units = true, show = [], tappable = false, label = '' } = {}) {
  const { x, y, unit: u, cols, rows } = g, colors = ['r0', 'r1', 'r2', 'r3'];
  const cell = ([c, r]) => [x + c * u, y + r * u];
  const pieces = g.pieces.map((p, i) => {
    const outline = pieceOutline(p.cells, g);
    const [cx, cy] = p.cells.reduce((s, c) => [s[0] + c[0] + .5, s[1] + c[1] + .5], [0, 0]).map((v) => v / p.cells.length);
    const shown = show.includes(i);
    return html`<g class="j-piece${shown ? ' shown' : ''}"${tappable ? html` role="button" tabindex="0" data-piece="${i}" aria-pressed="${shown}" aria-label="Part ${p.name}${shown ? `: ${p.cells.length} unit squares` : ''}"` : ''}>${p.cells.map((c) => { const [px, py] = cell(c); return html`<rect class="j-region ${colors[i]}${shown ? ' ok' : ''}" x="${px}" y="${py}" width="${u}" height="${u}"/>`; })}<path class="j-piece-edge" d="${outline}"/><text class="j-piece-name" x="${n2(x + cx * u)}" y="${n2(y + cy * u - (shown ? 8 : 0))}">${p.name}</text>${shown ? html`<text class="j-piece-count" x="${n2(x + cx * u)}" y="${n2(y + cy * u + 14)}">${p.cells.length} squares</text>` : ''}</g>`;
  });
  const lines = units ? [...Array(cols - 1)].map((_, i) => html`<line class="j-unit" x1="${x + (i + 1) * u}" x2="${x + (i + 1) * u}" y1="${y}" y2="${y + rows * u}"/>`).concat([...Array(rows - 1)].map((_, i) => html`<line class="j-unit" y1="${y + (i + 1) * u}" y2="${y + (i + 1) * u}" x1="${x}" x2="${x + cols * u}"/>`)) : [];
  const desc = label || `A rectangle ${cols} unit squares wide and ${rows} tall, partitioned into ${g.pieces.length} parts named ${g.pieces.map((p) => p.name).join(', ')}.${show.length ? ' ' + show.map((i) => `Part ${g.pieces[i].name} covers ${g.pieces[i].cells.length} unit squares.`).join(' ') : ''}`;
  return html`<svg class="j-svg" viewBox="0 0 ${x * 2 + cols * u} ${y * 2 + rows * u}" ${tappable ? html`role="group"` : html`role="img"`} aria-label="${desc}">${pieces}<g class="j-units">${lines}</g>${g.pieces.map((p) => html`<path class="j-piece-edge strong" d="${pieceOutline(p.cells, g)}"/>`)}<rect class="j-outline" x="${x}" y="${y}" width="${cols * u}" height="${rows * u}"/></svg>`;
}
/** Outline of a set of grid cells: every cell edge not shared with another cell of the same piece. */
function pieceOutline(cells, { x, y, unit: u }) {
  const has = new Set(cells.map((c) => c.join(','))), d = [];
  for (const [c, r] of cells) {
    const X = x + c * u, Y = y + r * u;
    if (!has.has(`${c},${r - 1}`)) d.push(`M${X},${Y}h${u}`);
    if (!has.has(`${c},${r + 1}`)) d.push(`M${X},${Y + u}h${u}`);
    if (!has.has(`${c - 1},${r}`)) d.push(`M${X},${Y}v${u}`);
    if (!has.has(`${c + 1},${r}`)) d.push(`M${X + u},${Y}v${u}`);
  }
  return d.join('');
}

function figureSvg(f, { counted = [], tappable = false, extra = '', label = '' } = {}) {
  const [w, h] = f.viewBox;
  const regions = f.regions.map((r, i) => {
    const k = counted.indexOf(i), [cx, cy] = centroid(r);
    return html`<g class="j-tile${k >= 0 ? ' counted' : ''}"${tappable ? html` role="button" tabindex="0" data-region="${i}" aria-pressed="${k >= 0}" aria-label="${k >= 0 ? `Part counted as number ${k + 1}` : 'Part not counted yet'}"` : ''}><polygon class="j-region ${k >= 0 ? `r${k % 4} ok` : 'plain'}" points="${pts(r)}"/>${k >= 0 ? html`<text class="j-num" x="${n2(cx)}" y="${n2(cy)}">${k + 1}</text>` : ''}</g>`;
  });
  return html`<svg class="j-svg" viewBox="0 0 ${w} ${h}" ${tappable ? html`role="group"` : html`role="img"`} aria-label="${label || f.alt}${counted.length ? ` ${counted.length} parts counted.` : ''}">${regions}${extra}</svg>`;
}

const SAND = [10, 115, 220], SW = 80;
function sandwiches({ grid = false, mark = -1 } = {}) {
  const y = 40, cuts = [
    (x) => [[x, y, x + SW, y + SW], [x + SW, y, x, y + SW]],
    (x) => [1, 2, 3.5].map((k) => [x + k * 20, y, x + k * 20, y + SW]),
    (x) => [[x + 40, y, x + 40, y + SW], [x, y + 40, x + SW, y + 40]],
  ];
  const tiny = (x) => [1, 2, 3].flatMap((k) => [html`<line class="j-unit" x1="${x + k * 20}" x2="${x + k * 20}" y1="${y}" y2="${y + SW}"/>`, html`<line class="j-unit" y1="${y + k * 20}" y2="${y + k * 20}" x1="${x}" x2="${x + SW}"/>`]);
  return html`<svg class="j-svg wide" viewBox="0 0 310 150" role="img" aria-label="Three same-size square sandwiches. Sandwich 1 is cut corner to corner both ways into 4 triangles. Sandwich 2 is cut into 4 strips of different widths. Sandwich 3 is cut into 4 small squares.${grid ? ' A faint grid shows 16 tiny squares in each sandwich.' : ''}">
    ${SAND.map((x, i) => html`<g><rect class="j-bread" x="${x - 4}" y="${y - 4}" width="${SW + 8}" height="${SW + 8}" rx="10"/><rect class="j-whole${mark === i ? ' j-mark' : ''}" x="${x}" y="${y}" width="${SW}" height="${SW}" rx="3"/>${grid ? tiny(x) : ''}${i === 1 && mark === 1 && grid ? html`<rect class="j-region r1 ok" x="${x + 40}" y="${y}" width="30" height="${SW}"/><rect class="j-region r2 ok" x="${x + 70}" y="${y}" width="10" height="${SW}"/>` : ''}${i === 2 && mark === 2 ? html`<rect class="j-region r0 ok" x="${x}" y="${y}" width="40" height="40"/>` : ''}${cuts[i](x).map(([a, b, c, d]) => html`<line class="j-cut" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`)}<text class="j-caption" x="${x + SW / 2}" y="${y + SW + 26}">Sandwich ${i + 1}</text></g>`)}</svg>`;
}
function garden({ grid = false, mark = -1 } = {}) {
  const x = 60, y = 20, u = 45, beds = [[0, 0, 2, 4], [2, 0, 2, 1], [2, 1, 2, 1], [2, 2, 2, 2]];
  return html`<svg class="j-svg" viewBox="0 0 300 220" role="img" aria-label="A square garden split into 4 beds: one big bed fills the left half; the right half has two thin beds on top and one medium bed at the bottom.${grid ? ' A faint grid shows 16 unit squares.' : ''}">
    ${beds.map(([c, r, w, h], i) => html`<rect class="j-region ${mark === i ? `r${i} ok` : 'garden'}" x="${x + c * u}" y="${y + r * u}" width="${w * u}" height="${h * u}"/>`)}
    ${grid ? [1, 2, 3].flatMap((k) => [html`<line class="j-unit" x1="${x + k * u}" x2="${x + k * u}" y1="${y}" y2="${y + 4 * u}"/>`, html`<line class="j-unit" y1="${y + k * u}" y2="${y + k * u}" x1="${x}" x2="${x + 4 * u}"/>`]) : ''}
    ${beds.map(([c, r, w, h]) => html`<rect class="j-bed" x="${x + c * u}" y="${y + r * u}" width="${w * u}" height="${h * u}"/>`)}</svg>`;
}
const PIE = { c: [160, 140], r: 110, chord: 40 };
function pie({ center = false, flip = false, fair = false } = {}) {
  const [cx, cy] = PIE.c, r = PIE.r, yc = cy + PIE.chord, dx = Math.sqrt(r * r - PIE.chord ** 2);
  const lines = fair ? html`<line class="j-cut" x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"/><line class="j-cut" x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}"/>`
    : html`<line class="j-cut" x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"/><line class="j-cut" x1="${n2(cx - dx)}" y1="${yc}" x2="${n2(cx + dx)}" y2="${yc}"/>`;
  const bottom = `M${n2(cx - dx)},${yc} L${cx},${yc} L${cx},${cy + r} A${r},${r} 0 0,1 ${n2(cx - dx)},${yc} Z`;
  const flipped = `M${n2(cx - dx)},${yc} L${cx},${yc} L${cx},${2 * yc - (cy + r)} A${r},${r} 0 0,0 ${n2(cx - dx)},${yc} Z`;
  return html`<svg class="j-svg" viewBox="0 0 320 280" role="img" aria-label="${fair ? 'A round cracker cut by two lines through the center that cross like a plus sign, making 4 matching pieces.' : `A round pie cut by one up-and-down line through the center and one line across that is below the center. The 2 top pieces are bigger than the 2 bottom pieces.${flip ? ' A copy of a bottom piece is flipped onto a top piece and leaves space uncovered.' : ''}`}">
    <circle class="j-whole pie" cx="${cx}" cy="${cy}" r="${r}"/>
    ${flip ? html`<path class="j-region r1 ok" d="${bottom}"/><path class="j-ghost" d="${flipped}"/><text class="j-tag" x="${cx - 45}" y="${cy - 45}">space left over</text>` : ''}
    ${lines}${center ? html`<circle class="j-centerdot" cx="${cx}" cy="${cy}" r="6"/><text class="j-tag" x="${cx + 34}" y="${cy - 8}">center</text>` : ''}</svg>`;
}
function strips({ parts = [4, 6, 8], shade = false, guide = false, chosen = null } = {}) {
  const x = 20, w = 280, h = 34, gap = 66;
  return html`<svg class="j-svg wide" viewBox="0 0 320 ${parts.length * gap + 10}" role="img" aria-label="${parts.length} same-size strips cut into ${parts.join(', ')} equal parts${shade ? ', with one part of each strip shaded' : ''}.${guide ? ' Dashed lines show where each shaded part ends: the more parts, the shorter each part.' : ''}">
    ${parts.map((n, i) => { const y = 26 + i * gap; return html`<g><text class="j-label" x="${x}" y="${y - 7}">${chosen ? `${n} equal parts` : `${n} equal parts`}</text><rect class="j-whole" x="${x}" y="${y}" width="${w}" height="${h}"/>${shade ? html`<rect class="j-region r${i % 4} ok" x="${x}" y="${y}" width="${n2(w / n)}" height="${h}"/>` : ''}${[...Array(n - 1)].map((_, k) => html`<line class="j-cut thin" x1="${n2(x + (k + 1) * w / n)}" x2="${n2(x + (k + 1) * w / n)}" y1="${y}" y2="${y + h}"/>`)}${guide ? html`<line class="j-guide" x1="${n2(x + w / n)}" x2="${n2(x + w / n)}" y1="${y}" y2="${parts.length * gap + 8}"/>` : ''}</g>`; })}</svg>`;
}
function areaIdea() {
  const u = 34, sx = 20, sy = 70, qx = 200, qy = 52;
  const cells = (x0, y0, c, r) => [...Array(c * r)].map((_, i) => html`<rect class="j-region r${x0 > 100 ? 1 : 0} ok" x="${x0 + (i % c) * u}" y="${y0 + Math.floor(i / c) * u}" width="${u}" height="${u}"/>`);
  return html`<svg class="j-svg wide" viewBox="0 0 300 150" role="img" aria-label="A long strip of 4 unit squares in a row and a square made of 2 rows of 2 unit squares. Both cover 4 unit squares.">${cells(sx, sy, 4, 1)}${cells(qx, qy, 2, 2)}<text class="j-caption" x="${sx + 2 * u}" y="${sy + u + 26}">4 unit squares</text><text class="j-caption" x="${qx + u}" y="${qy + 2 * u + 26}">4 unit squares</text></svg>`;
}
function words() {
  return html`<svg class="j-svg wide" viewBox="0 0 320 150" role="img" aria-label="Left: one whole rectangle. Right: the same rectangle partitioned into 4 equal parts, with one part shaded.">
    <rect class="j-whole" x="15" y="30" width="120" height="80"/><text class="j-caption" x="75" y="132">1 whole</text>
    <text class="j-arrow" x="160" y="76">→</text>
    <rect class="j-whole" x="185" y="30" width="120" height="80"/><rect class="j-region r0 ok" x="185" y="30" width="30" height="80"/>${[1, 2, 3].map((k) => html`<line class="j-cut" x1="${185 + k * 30}" x2="${185 + k * 30}" y1="30" y2="110"/>`)}<text class="j-caption" x="245" y="132">4 equal parts</text></svg>`;
}
function crossBoth() {
  const a = taskSvg(CROSS, { dots: false, lines: CROSS.solutions[0], result: checkBuild(CROSS, CROSS.solutions[0]), label: 'Way 1: the plus sign split by a vertical and a horizontal line through its center into 4 matching L-shaped parts.' });
  const b = taskSvg(CROSS, { dots: false, lines: CROSS.solutions[1], result: checkBuild(CROSS, CROSS.solutions[1]), label: 'Way 2: the plus sign split by lines between opposite inside corners into 4 matching parts, each one arm plus a triangle.' });
  return html`<div class="j-pair"><figure>${a}<figcaption>Way 1</figcaption></figure><figure>${b}<figcaption>Way 2</figcaption></figure></div>`;
}
function reflectPic() {
  const r = RECT_FOURTHS, hex = SHAPES.find((s) => s.skill === 'hexagon').guide, circ = SHAPES.find((s) => s.skill === 'circle').guide;
  return html`<div class="j-pair three">${[[r, r.solutions[2]], [circ, circ.solutions[0]], [hex, hex.solutions[0]]].map(([t, l]) => taskSvg(t, { dots: false, lines: l, result: checkBuild(t, l), label: `${t.label}: an example of equal parts.` }))}</div>`;
}
const COOKIE = { c: [160, 140], r: 110, gap: 55 };
function cookie({ flip = false, heights = false } = {}) {
  const [cx, cy] = COOKIE.c, r = COOKIE.r, g = COOKIE.gap, h = Math.sqrt(r * r - g * g), a = cx - g;
  const cuts = [-g, 0, g].map((d) => { const y = Math.sqrt(r * r - d * d); return html`<line class="j-cut" x1="${cx + d}" y1="${n2(cy - y)}" x2="${cx + d}" y2="${n2(cy + y)}"/>`; });
  const end = `M${a},${n2(cy - h)} A${r},${r} 0 0,0 ${a},${n2(cy + h)} Z`, flipped = `M${a},${n2(cy - h)} A${r},${r} 0 0,1 ${a},${n2(cy + h)} Z`;
  const tall = (x, word) => { const y = Math.sqrt(r * r - (x - cx) ** 2); return html`<line class="j-guide" x1="${n2(x)}" x2="${n2(x)}" y1="${n2(cy - y)}" y2="${n2(cy + y)}"/><text class="j-tag" x="${n2(x)}" y="${n2(cy + y + 18)}">${word}</text>`; };
  return html`<svg class="j-svg" viewBox="0 0 320 290" role="img" aria-label="A round cookie cut by 3 evenly spaced up-and-down lines into 4 pieces. The 2 middle pieces are tall; the 2 end pieces are short and curved.${flip ? ' A copy of an end piece is flipped onto a middle piece and leaves space uncovered.' : ''}${heights ? ' Dashed lines show a middle piece is taller than an end piece.' : ''}">
    <circle class="j-whole pie" cx="${cx}" cy="${cy}" r="${r}"/>${flip ? html`<path class="j-region r1 ok" d="${end}"/><path class="j-ghost" d="${flipped}"/><text class="j-tag" x="${cx}" y="${cy + r + 28}">dashed line: space left over</text>` : ''}
    ${cuts}${heights ? html`${tall(cx - 27.5, 'tall')}${tall(cx - 85, 'short')}` : ''}</svg>`;
}
function oval({ mark = false } = {}) {
  const cx = 160, cy = 130, rx = 135, ry = 95, ys = [-ry / 2, 0, ry / 2];
  return html`<svg class="j-svg" viewBox="0 0 320 260" role="img" aria-label="An oval rug cut by 3 evenly spaced side-to-side lines into 4 strips.">
    <ellipse class="j-whole" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
    ${ys.map((d) => { const w = rx * Math.sqrt(1 - (d / ry) ** 2); return html`<line class="j-cut" x1="${n2(cx - w)}" x2="${n2(cx + w)}" y1="${n2(cy + d)}" y2="${n2(cy + d)}"/>`; })}
    ${mark ? html`<text class="j-tag" x="${cx}" y="${cy - 20}">wide</text><text class="j-tag" x="${cx}" y="${cy - 62}">narrow</text>` : ''}</svg>`;
}
/** Three same-size flags: unequal stripes across, corner-to-corner, and equal stripes up and down. */
export const FLAGS = { x: [22, 125, 228], y: 40, w: 76, h: 64, stripes: [0, 16, 32, 56, 64] };
function flags() {
  const { x: xs, y, w, h, stripes } = FLAGS;
  const cuts = [(x) => stripes.slice(1, -1).map((k) => [x, y + k, x + w, y + k]), (x) => [[x, y, x + w, y + h], [x + w, y, x, y + h]], (x) => [1, 2, 3].map((k) => [x + k * w / 4, y, x + k * w / 4, y + h])];
  return html`<svg class="j-svg wide" viewBox="0 0 320 150" role="img" aria-label="Three same-size flags, each cut into 4 parts. Flag 1 has 3 lines across. Flag 2 is cut corner to corner both ways. Flag 3 has 3 lines up and down.">
    ${xs.map((x, i) => html`<g><line class="j-pole" x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + h + 30}"/><rect class="j-whole" x="${x}" y="${y}" width="${w}" height="${h}"/>${cuts[i](x).map(([a, b, c, d]) => html`<line class="j-cut" x1="${n2(a)}" y1="${n2(b)}" x2="${n2(c)}" y2="${n2(d)}"/>`)}<text class="j-caption" x="${x + w / 2}" y="${y + h + 24}">Flag ${i + 1}</text></g>`)}</svg>`;
}
/** A circle cut by 2 lines through the center that cross at 60 degrees, not like a plus sign. */
export const XCIRCLE = { c: [160, 140], r: 110, angle: 60 };
function xcircle({ angle = XCIRCLE.angle } = {}) {
  const [cx, cy] = XCIRCLE.c, r = XCIRCLE.r, t = (angle * Math.PI) / 180;
  const end = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const l1 = [end(0), end(Math.PI)], l2 = [end(t), end(t + Math.PI)];
  return html`<svg class="j-svg" viewBox="0 0 320 280" role="img" aria-label="A round pizza cut by two lines through the center. The lines cross at a slant, not like a plus sign.">
    <circle class="j-whole pie" cx="${cx}" cy="${cy}" r="${r}"/>${[l1, l2].map(([a, b]) => html`<line class="j-cut" x1="${n2(a[0])}" y1="${n2(a[1])}" x2="${n2(b[0])}" y2="${n2(b[1])}"/>`)}</svg>`;
}
const linesFigure = () => { const f = FIGURES.tiles, [a, b] = [f.regions[1][0], f.regions[1][3]]; return html`<line class="j-hiline" x1="${n2(a[0])}" y1="${n2(a[1])}" x2="${n2(b[0])}" y2="${n2(b[1])}"/><text class="j-tag" x="${n2(a[0] + 4)}" y="${n2(f.viewBox[1] - 18)}">a line is an edge</text>`; };

/** Any card picture by description. */
export function picture(p) {
  if (!p) return '';
  if (p.kind === 'sandwiches') return sandwiches(p);
  if (p.kind === 'garden') return garden(p);
  if (p.kind === 'pie') return pie(p);
  if (p.kind === 'strips') return strips(p);
  if (p.kind === 'area-idea') return areaIdea();
  if (p.kind === 'words') return words();
  if (p.kind === 'cross-both') return crossBoth();
  if (p.kind === 'reflect') return reflectPic();
  if (p.kind === 'grid') return gridSvg(gridOf(p.grid), { show: p.show || [] });
  if (p.kind === 'figure') return figureSvg(FIGURES[p.figure], { counted: p.counted || (p.lines ? [0] : []), extra: p.lines ? linesFigure() : '', label: p.lines ? `${FIGURES[p.figure].alt} One tile is shaded as one part; one edge between tiles is highlighted as a line.` : '' });
  if (p.kind === 'task') { const t = taskById(p.task), lines = p.lines || []; return taskSvg(t, { dots: false, lines, label: p.label || '', result: p.shade ? checkBuild(t, lines) : null }); }
  if (p.kind === 'cookie') return cookie(p);
  if (p.kind === 'flags') return flags(p);
  if (p.kind === 'xcircle') return xcircle(p);
  if (p.kind === 'oval') return oval(p);
  return '';
}

// ------------------------------------------------------------------ help
/** The steps shown by "Show Steps": partial constructions only; the finished answer is a separate choice. */
export function helpSteps(card, ui = {}) {
  if (card.type === 'build') {
    const t = card.task, avoid = card.different ? ui.avoidKey || partitionKey(t, t.solutions[0]) : null;
    // A different way: show the way the child has NOT drawn yet.
    const way2 = avoid && partitionKey(t, CROSS.teach2[CROSS.teach2.length - 1].lines) === avoid;
    const src = card.different ? (way2 ? CROSS.teach : CROSS.teach2).slice(1) : t.teach || t.solution.map((_, i) => ({ text: i === 0 ? 'Start with this line.' : 'Add this line next.', lines: t.solution.slice(0, i + 1) }));
    const partial = (list) => list.filter((s) => s.lines?.length && !validatePartition(t, s.lines).valid);
    const steps = partial(src).length ? partial(src) : partial(t.solution.map((_, i) => ({ text: i === 0 ? 'Start with this line.' : 'Add this line next.', lines: t.solution.slice(0, i + 1) })));
    return steps.map((s) => ({ text: s.text, svg: taskSvg(t, { lines: s.lines, small: true, label: `Help picture: ${s.text}` }) }));
  }
  if (card.type === 'count') {
    const n = card.figure.regions.length, half = Math.max(1, Math.floor(n / 2));
    return [{ text: 'Tap one space. That is part number 1. A line is not a part.', svg: figureSvg(card.figure, { counted: [0] }) }, { text: 'Keep going: count each space once. Here are the first parts.', svg: figureSvg(card.figure, { counted: [...Array(half).keys()] }) }];
  }
  if (card.type === 'write') return [{ text: 'A strong answer does these things:', list: card.checks }];
  return (card.help?.steps || []).map((s) => ({ text: s.text, svg: picture(s.picture) }));
}
export function helpAnswer(card, ui = {}) {
  if (card.type === 'build') {
    // For "a different way", show a construction that differs from the child's first answer (or from the taught Way 1).
    const t = card.task, avoid = card.different ? ui.avoidKey || partitionKey(t, t.solutions[0]) : null;
    const sol = avoid ? t.solutions.find((x) => partitionKey(t, x) !== avoid) || t.solution : t.solution;
    return { text: t.why, svg: taskSvg(t, { lines: sol, result: checkBuild(t, sol), small: true, label: `Answer: ${t.label}, partitioned into ${t.count} equal parts.` }) };
  }
  if (card.type === 'count') return { text: `There are ${card.answer} equal parts. ${card.answer} equal parts are called ${card.name}.`, svg: figureSvg(card.figure, { counted: [...card.figure.regions.keys()] }) };
  if (card.type === 'write') return { text: `Example: ${card.sample}` };
  if (card.type === 'area') return { text: card.options.find((o) => o.correct).why, svg: gridSvg(card.grid, { show: [...card.grid.pieces.keys()] }) };
  const right = card.options.filter((o) => o.correct);
  const why = right[0].why.replace(/^(Yes|Right|Exactly)[.!]\s*/, '');
  return { text: `The answer: ${right.map((o) => o.text.replace(/\.$/, '')).join(' and ')}. ${why}`, svg: picture(card.help?.answerPicture || card.picture) };
}
const hintFor = (card) => card.hintOverride || card.help?.hint || card.hint || card.task?.hint || 'Compare how much space each part covers.';

function helpPanel(card, ui) {
  const help = ui.help;
  if (!help?.open) return '';
  const steps = helpSteps(card, ui), step = steps[Math.min(help.step || 0, Math.max(0, steps.length - 1))];
  const level = help.level || 0;
  return html`<section class="j-help" id="help-${card.id}" aria-labelledby="help-h-${card.id}">
    <h3 id="help-h-${card.id}" tabindex="-1" data-help-heading>Help for this question</h3>
    ${card.independent ? html`<p class="j-note">This is a solo try. You can still get help. Your grown-up's report will show that you used it.</p>` : ''}
    ${level >= 1 ? html`<div class="j-help-block"><p class="j-help-label">Hint</p><p>${hintFor(card)}</p></div>` : html`<p>Help comes one step at a time. Your own work stays where it is.</p>`}
    ${level >= 2 && step ? html`<div class="j-help-block"><p class="j-help-label">Step ${(help.step || 0) + 1} of ${steps.length}</p><p aria-live="polite">${step.text}</p>${step.list ? html`<ul>${step.list.map((t) => html`<li>${t}</li>`)}</ul>` : ''}${step.svg || ''}</div>` : ''}
    ${level >= 3 ? (() => { const a = helpAnswer(card, ui); return html`<div class="j-help-block answer"><p class="j-help-label">Answer</p>${a.svg || ''}<p>${a.text}</p><p class="j-note">Your own work above is still there. Try it yourself now!</p></div>`; })() : ''}
    <div class="j-row">
      ${level === 0 ? html`<button type="button" class="btn btn-primary" data-j="hint">Show a hint</button>` : ''}
      ${level === 1 ? html`<button type="button" class="btn btn-primary" data-j="steps">Show steps</button>` : ''}
      ${level === 2 && (help.step || 0) < steps.length - 1 ? html`<button type="button" class="btn btn-primary" data-j="next-help">Next step</button>` : ''}
      ${level === 2 && (help.step || 0) >= steps.length - 1 ? html`<button type="button" class="btn" data-j="answer">Show the answer</button>` : ''}
      ${level === 1 && !steps.length ? html`<button type="button" class="btn" data-j="answer">Show the answer</button>` : ''}
      <button type="button" class="btn" data-j="close-help">Close help</button>
    </div></section>`;
}
const helpButton = (card, ui) => html`<button type="button" class="j-help-btn" data-j="help" aria-expanded="${Boolean(ui.help?.open)}" aria-controls="help-${card.id}"><span aria-hidden="true">?</span> Help</button>`;

// ------------------------------------------------------------------ cards
function feedback(ui, card) {
  if (!ui.say) return html`<p class="j-feedback"></p>`;
  const lead = ui.ok ? (card?.phase === 'youdo' && ui.solo ? 'You did it on your own!' : 'Yes!') : card?.phase === 'assess' ? 'Not quite.' : 'Not yet.';
  return html`<p class="j-feedback ${ui.ok ? 'ok' : 'notyet'}" tabindex="-1"><strong>${lead}</strong> ${ui.say}</p>`;
}
function buildCard(card, ui) {
  const result = ui.result || null;
  const sel = card.task.points.find((p) => p.id === ui.selected);
  return html`
    <div class="j-stage-pic">${taskSvg(card.task, { lines: ui.lines || [], result, active: !ui.locked, selected: ui.selected, cursor: ui.cursor, small: ui.locked })}</div>
    <p class="sr-only" aria-live="off">${(ui.lines || []).length ? `Lines drawn: ${(ui.lines || []).map(([a, b]) => `${card.task.points.find((p) => p.id === a)?.label} to ${card.task.points.find((p) => p.id === b)?.label}`).join('; ')}.` : 'No lines drawn yet.'}</p>
    <p class="j-preview" data-j-preview aria-hidden="true">&nbsp;</p>
    <p class="j-legend"><span class="key corner"></span> corner${card.task.points.some((p) => !/^[vkce]\d|^c$/.test(p.id)) ? html` <span class="key mark"></span> mark on an edge` : ''}${card.task.points.some((p) => /^e\d/.test(p.id)) ? html` <span class="key mark"></span> point on the edge` : ''}${card.task.points.some((p) => p.id === 'c') ? html` <span class="key center"></span> center` : ''}</p>
    <p class="j-howto" data-j-status>${sel ? html`<strong>${sel.label}</strong> is chosen. Now tap or click the dot where the line should end.` : (ui.lines || []).length ? `${(ui.lines || []).length} line${(ui.lines || []).length === 1 ? '' : 's'} drawn. Add another line, or press Check my parts.` : 'No lines yet. Tap or click a dot to start a line.'}</p>
    <div class="j-row j-tools">
      <button type="button" class="btn btn-primary" data-j="check">${checkLabel(card, ui, 'Check my parts')}</button>
      <button type="button" class="btn" data-j="undo" ${(ui.lines || []).length ? '' : html`disabled`}>Undo last line</button>
      <button type="button" class="btn" data-j="clear" ${(ui.lines || []).length ? '' : html`disabled`}>Start over</button>
    </div>
    ${ui.locked ? '' : html`<details class="j-drawhelp"${ui.drawHelpOpen ? html` open` : ''}><summary>How to draw lines</summary><ol>
      <li><strong>Pick a dot:</strong> tap it or click it. It gets a circle.</li>
      <li><strong>Pick a second dot:</strong> a straight line joins the two dots.</li>
      <li><strong>Fix a mistake:</strong> press <em>Undo last line</em>, or pick the same two dots again to erase that line. <em>Start over</em> erases every line.</li>
      <li><strong>Finished?</strong> Press <em>Check my parts</em>.</li>
    </ol><p class="j-note">On a touch screen, hold your finger still for a moment and slide: the dot with the circle is the one you get when you lift. With a keyboard, press Tab to reach the shape, use the arrow keys to move between dots, and press Enter or Space to pick one. If the shape has a center dot, press Home to jump to it.</p></details>`}`;
}
/** The Final Check asks once before using its one try. */
const checkLabel = (card, ui, text) => (card.phase === 'assess' && ui.confirm && !ui.locked ? 'Yes, check it (one try)' : text);
function choiceCard(card, ui) {
  const picked = ui.choice || [];
  const type = card.multi ? 'checkbox' : 'radio';
  return html`${card.picture ? html`<div class="j-stage-pic">${picture(card.picture)}</div>` : ''}
    <fieldset class="j-options"><legend class="sr-only">${card.prompt}</legend>
    ${(card.options).map((o, i) => { const mark = ui.checked && picked.includes(String(i)) ? (o.correct ? 'right' : 'wrong') : ''; return html`<label class="j-option${mark ? ` ${mark}` : ''}"><input type="${type}" name="j-${card.id}" value="${i}" data-j-choice ${picked.includes(String(i)) ? html`checked` : ''}><span>${o.text}</span>${mark ? html`<span class="j-mark-sym">${mark === 'right' ? '✓ right' : '✗ not right'}</span>` : ''}</label>`; })}
    </fieldset><div class="j-row"><button type="button" class="btn btn-primary" data-j="check">${checkLabel(card, ui, 'Check my answer')}</button></div>`;
}
function countCard(card, ui) {
  const counted = ui.counted || [];
  const chip = (group, value, text) => html`<label class="j-chip"><input type="radio" name="j-${card.id}-${group}" value="${value}" data-j-${group} ${ui[group] === value ? html`checked` : ''}><span>${text}</span></label>`;
  return html`<div class="j-stage-pic">${figureSvg(card.figure, { counted, tappable: !ui.locked })}</div>
    <p class="j-howto" aria-live="polite">Parts counted: <strong>${counted.length}</strong>. ${counted.length ? 'Tap a counted part again to un-count it.' : 'Tap each part once.'}</p>
    <div class="j-row"><button type="button" class="btn" data-j="recount" ${counted.length ? '' : html`disabled`}>Count again from 0</button></div>
    <div class="j-sentence"><fieldset><legend>The shape is partitioned into</legend><div class="j-chips">${card.nums.map((v) => chip('num', v, v))}</div></fieldset>
    <fieldset><legend>equal parts, or</legend><div class="j-chips">${card.names.map(([, name]) => chip('name', name, name))}</div></fieldset></div>
    <div class="j-row"><button type="button" class="btn btn-primary" data-j="check">${checkLabel(card, ui, 'Check my answer')}</button></div>`;
}
function areaCard(card, ui) {
  const show = ui.shown || [];
  return html`<div class="j-row"><button type="button" class="btn" data-j="units" aria-pressed="${ui.units !== false}">${ui.units === false ? 'Show unit squares' : 'Hide unit squares'}</button></div>
    <div class="j-stage-pic">${gridSvg(card.grid, { units: ui.units !== false, show, tappable: true })}</div>
    <p class="j-howto">Tap a part to see how many unit squares it covers.</p>
    <fieldset class="j-options"><legend class="sr-only">${card.prompt}</legend>${card.options.map((o) => html`<label class="j-option${ui.checked && ui.choice?.[0] === o.value ? (o.correct ? ' right' : ' wrong') : ''}"><input type="radio" name="j-${card.id}" value="${o.value}" data-j-choice ${ui.choice?.[0] === o.value ? html`checked` : ''}><span>${o.text}</span></label>`)}</fieldset>
    <div class="j-row"><button type="button" class="btn btn-primary" data-j="check">Check my answer</button></div>`;
}
function writeCard(card, ui) {
  return html`${card.picture ? html`<div class="j-stage-pic">${picture(card.picture)}</div>` : ''}
    <label class="j-write"><span>Your answer</span><textarea rows="4" data-j-text maxlength="600">${ui.text || ''}</textarea></label>
    <div class="j-row"><button type="button" class="btn btn-primary" data-j="compare">I'm done: show an example</button></div>
    ${ui.compared ? html`<div class="j-compare"><p class="j-help-label">Example answer</p><p>${card.sample}</p>
      <fieldset><legend>Check your answer with a grown-up (or by yourself):</legend>${card.checks.map((c, i) => html`<label class="j-check"><input type="checkbox" data-j-review="${i}" ${ui.review?.[i] ? html`checked` : ''}><span>${c}</span></label>`)}</fieldset>
      <p class="j-note">The computer does not grade the meaning of your writing. A person checks it.</p></div>` : ''}`;
}
/** One step of a worked example: its own picture, or the construction drawn so far. */
export function demoPicture(card, s, i) {
  if (s.picture) return picture(s.picture);
  const result = s.lines.length && validatePartition(card.task, s.lines).valid ? checkBuild(card.task, s.lines) : null;
  return taskSvg(card.task, { lines: s.lines, result, label: `${card.task.label}. Step ${i + 1}: ${s.text}` });
}
function demoCard(card, ui) {
  const i = Math.min(ui.step || 0, card.steps.length - 1), s = card.steps[i], last = i === card.steps.length - 1;
  return html`<div class="j-stage-pic">${demoPicture(card, s, i)}</div>
    <p class="j-demo-text"><span class="j-help-label">Step ${i + 1} of ${card.steps.length}</span> <span data-step-text>${s.text}</span></p>
    <div class="j-row"><button type="button" class="btn" data-j="demo-back" ${i === 0 ? html`disabled` : ''}>‹ Previous step</button>
    <button type="button" class="btn${last ? '' : ' btn-primary'}" data-j="demo-next" ${last ? html`disabled` : ''}>Next step ›</button>
    ${i > 0 ? html`<button type="button" class="btn" data-j="demo-restart">Watch again</button>` : ''}</div>`;
}
function sizesCard(card, ui) {
  const n = ui.parts || 2;
  return html`<p>${card.text}</p><div class="j-chips big" role="group" aria-label="Number of equal parts">${[2, 3, 4, 6, 8].map((k) => html`<button type="button" class="j-chipbtn" data-j="parts" data-parts="${k}" aria-pressed="${n === k}">${k}</button>`)}</div>
    <div class="j-stage-pic">${strips({ parts: [...new Set([2, n])].sort((a, b) => a - b), shade: true, guide: n !== 2 })}</div>
    <p class="j-howto" aria-live="polite">${n === 2 ? 'The top strip has 2 equal parts. Choose a bigger number of parts.' : `With ${n} equal parts, one part is shorter than one of 2 equal parts. Try ${n === 8 ? 'other numbers' : 'an even bigger number'}.`}</p>`;
}
function conceptCard(card) {
  return html`<div class="j-stage-pic">${picture(card.picture)}</div><div class="j-text">${card.text.map((t) => html`<p>${rich(t)}</p>`)}</div>`;
}

export const PHASES = { ido: 'I Do: watch and learn', wedo: 'We Do: try it together', youdo: 'You Do: on your own', say: 'Say it in your own words', assess: 'Final Check' };
const PHASE_SHORT = { ido: 'I Do', wedo: 'We Do', youdo: 'You Do', say: 'Say it' };
function unitLine(card) {
  const u = unitOf(card);
  if (!u) return '';
  const k = UNITS.indexOf(u), phases = [...new Set(u.cards.map((c) => c.phase))];
  return html`<span class="j-skill">Skill: ${u.title}<span class="sr-only"> (skill ${k + 1} of ${UNITS.length}; ${phases.map((p) => PHASE_SHORT[p]).join(', then ')})</span></span>`;
}

/**
 * Where the child is in the lesson, kept small so the activity stays the main thing on the screen:
 * one line ("Part A of I: Explore equal parts"), a thin bar, and the full list of parts behind "See all parts".
 * Sections that are not open yet are not links.
 */
export function journeyStepper(ctx, current, records = {}, { card, open = false } = {}) {
  const L = (id) => ctx.lessonLink('7-1', id), si = JOURNEY.findIndex((s) => s.id === current), here = JOURNEY[si];
  const where = here ? html`<strong>Part ${String.fromCharCode(65 + si)}</strong> <span class="j-of">(${si + 1} of ${JOURNEY.length}):</span> ${here.title}` : html`<strong>Grown-up report</strong>`;
  return html`<div class="j-map">
    <p class="j-where">${where}${card ? html` <span class="j-cardnum">${card}</span>` : ''}</p>
    <span class="j-mapbar" aria-hidden="true">${JOURNEY.map((s) => html`<span class="${s.id === current ? 'now' : stageComplete(s.id, records) ? 'past' : ''}"></span>`)}</span>
    ${open ? '' : html`<details class="j-map-all"><summary>See all parts</summary>`}
    <nav class="stepper j-stepper${open ? ' j-stepper-open' : ''}" aria-label="Lesson 7-1 parts"><ol>
    ${JOURNEY.map((s, i) => { const open = stageUnlocked(s.id, records), done = stageComplete(s.id, records) && s.id !== current, label = html`<span class="n">${String.fromCharCode(65 + i)}</span> <span class="name">${s.label}</span>`;
      return html`<li class="${done ? 'done' : ''}${open ? '' : ' locked'}">${open ? html`<a href="${L(s.id)}"${s.id === current ? html` aria-current="step"` : ''}>${label}</a>` : html`<span class="j-locked"><span class="n">${String.fromCharCode(65 + i)}</span> <span class="name"><span aria-hidden="true">🔒 </span>${s.label}</span><span class="sr-only"> (locked: finish the earlier parts first)</span></span>`}</li>`; })}
    <li><a href="${L('parent')}"${current === 'parent' ? html` aria-current="step"` : ''}><span class="n">★</span> <span class="name">Grown-up Report</span></a></li>
    </ol></nav>${open ? '' : html`</details>`}
  </div>`;
}

/** You Do after a second wrong try: watch the worked example again, then try again. After 4 wrong tries the answer can be shown. */
function relearnPanel(card, ui, rec) {
  const wrong = rec?.attempts && !rec.correct ? (rec.wrongStreak || 0) : 0, misses = rec?.correct ? 0 : rec?.attempts || 0;
  if (rec?.correct || !ui.relearnOpen) return '';
  const demo = card.relearnSteps ? { type: 'demo', task: card.relearnTask, steps: card.relearnSteps } : cardById(card.relearn) || unitOf(card)?.cards.find((c) => c.type === 'demo');
  const k = Math.min(ui.relearnStep || 0, (demo?.steps.length || 1) - 1), st = demo?.steps[k];
  return html`<section class="j-relearn" aria-labelledby="relearn-h-${card.id}">
    <h3 id="relearn-h-${card.id}" tabindex="-1" data-relearn-heading>Let's learn it again</h3>
    <p>Watch the example one step at a time, then try again. Your ${card.type === 'build' ? 'drawing' : 'answer'} stays where it is.</p>
    ${demo ? html`<div class="j-help-block"><p class="j-help-label">Step ${k + 1} of ${demo.steps.length}</p><p data-step-text>${st.text}</p>${demoPicture(demo, st, k)}</div>
    <div class="j-row">${k > 0 ? html`<button type="button" class="btn" data-j="relearn-back">‹ Previous step</button>` : ''}${k < demo.steps.length - 1 ? html`<button type="button" class="btn btn-primary" data-j="relearn-next">Next step ›</button>` : html`<button type="button" class="btn btn-primary" data-j="relearn-done">I'm ready to try again</button>`}</div>` : ''}
  </section>`;
}

/** You Do after a second miss: one short picture that fixes the mistake, then another try. The whole example is offered. */
function quickPanel(card, ui, rec) {
  if (!ui.quick || rec?.correct) return '';
  const q = card.quick ? { text: card.quick.text, svg: picture(card.quick.picture) } : helpSteps(card, ui)[0];
  if (!q) return '';
  const tricky = (rec?.wrongStreak || 0) >= 3 || (rec?.attempts || 0) >= 3;
  return html`<section class="j-quick" aria-labelledby="quick-h-${card.id}">
    <h3 id="quick-h-${card.id}" tabindex="-1" data-quick-heading>Quick fix</h3>
    <p>${q.text}</p>${q.svg || ''}
    <p>${card.type === 'build' ? 'Now fix your drawing and check it again.' : 'Now look again and choose your answer.'}</p>
    ${ui.relearnOpen ? '' : html`<div class="j-row">${tricky ? html`<p class="j-note">Still tricky? Watching the whole example can help.</p>` : ''}<button type="button" class="btn${tricky ? ' btn-primary' : ''}" data-j="relearn-open">Watch the whole example</button></div>`}
  </section>`;
}

export function journeyCard(ctx, stageId, state) {
  const stage = JOURNEY.find((s) => s.id === stageId), cards = CARDS[stageId], si = JOURNEY.indexOf(stage);
  if (!stageUnlocked(stageId, state.records)) {
    const go = nextStage(state.records), goStage = JOURNEY.find((s) => s.id === go);
    const gi = JOURNEY.findIndex((x) => x.id === go);
    return html`${journeyStepper(ctx, stageId, state.records)}<article class="card j-card"><h2 id="stage-h" tabindex="-1">🔒 Part ${String.fromCharCode(65 + si)} is locked</h2><p>Finish ${gi >= 0 ? `Part ${String.fromCharCode(65 + gi)}` : 'the lesson'} first. Then this part opens.</p>
      <p><a class="btn btn-primary" href="${ctx.lessonLink('7-1', go)}">Go to ${goStage ? `Part ${String.fromCharCode(65 + gi)}: ${goStage.label}` : 'the Grown-up Report'} ›</a></p></article>`;
  }
  const i = Math.min(state.at[stageId] || 0, cards.length - 1, frontier(stageId, state.records)), card = cards[i], rec = state.records[card.id];
  const ui = { ...(state.ui[card.id] || {}), drawHelpOpen: state.drawHelp ?? !ALL_CARDS.some((c) => c.type === 'build' && state.records[c.id]?.attempts), avoidKey: card.different ? differentAvoidKey(card, state.ui[card.different]) : undefined, locked: card.phase === 'assess' && (state.records[card.id]?.attempts || 0) > 0 };
  const nextSection = JOURNEY[si + 1], prevStage = JOURNEY[si - 1];
  const asks = card.type !== 'concept' && card.type !== 'demo' && card.type !== 'sizes';
  const helps = asks && (card.phase === 'wedo' || card.phase === 'say');
  const answered = card.phase === 'assess' && (rec?.attempts || 0) > 0;
  const body = { build: buildCard, choice: choiceCard, count: countCard, area: areaCard, write: writeCard, demo: demoCard, sizes: sizesCard, concept: conceptCard }[card.type](card, ui, state);
  const prompt = card.prompt || '';
  const done = cardDone(card, rec);
  const nextCls = done ? 'btn btn-primary' : 'btn';
  const why = html`<p class="j-locknote" id="next-why">${card.type === 'demo' ? 'Watch every step to go on.' : card.phase === 'assess' ? 'Check your answer to go on.' : card.type === 'write' ? 'Write your answer and compare it to go on.' : 'Get this one right to go on. You can try as many times as you need.'}</p>`;
  const nextBtn = i < cards.length - 1
    ? html`<button type="button" class="${nextCls}" data-j="next" ${done ? '' : html`disabled aria-describedby="next-why"`}>Next ›</button>`
    : done ? html`<a class="${nextCls}" data-j-next-stage href="${ctx.lessonLink('7-1', nextSection ? nextSection.id : 'parent')}">${nextSection ? `Next: ${nextSection.label} ›` : 'Finish: see the report ›'}</a>`
      : html`<button type="button" class="btn" disabled aria-describedby="next-why">${nextSection ? `Next: ${nextSection.label} ›` : 'Finish ›'}</button>`;
  return html`${journeyStepper(ctx, stageId, state.records, { card: card.phase === 'assess' ? `Question ${i + 1} of ${cards.length}` : `Card ${i + 1} of ${cards.length}` })}
    <article class="card j-card j-${card.type} j-phase-${card.phase}" data-card="${card.id}" data-phase="${card.phase}">
      <p class="j-badge-row"><span class="j-badge phase-${card.phase}">${PHASES[card.phase]}</span>${unitLine(card)}</p>
      <div class="j-title-row"><h2 id="stage-h" tabindex="-1">${card.title}</h2><div class="j-title-btns">${readButton([card.title, prompt, ...(card.text || [])])}${helps ? helpButton(card, ui) : ''}</div></div>
      ${card.phase === 'youdo' ? html`<p class="j-note">No hints this time. Show what you learned! If you get stuck, the lesson will help you learn it again.</p>` : card.phase === 'assess' ? html`<p class="j-note">One try for each question, no hints. Do your best.</p>` : ''}
      ${prompt ? html`<p class="j-prompt">${prompt}</p>` : ''}
      ${answered ? html`<fieldset class="j-locked-answer" disabled>${body}</fieldset>` : body}
      ${asks ? feedback(ui, card) : ''}
      ${helps ? helpPanel(card, ui) : ''}
      ${card.phase === 'youdo' ? quickPanel(card, ui, rec) : ''}
      ${card.phase === 'youdo' ? relearnPanel(card, ui, rec) : ''}
      ${card.phase === 'youdo' && !rec?.correct && (rec?.attempts || 0) >= 4 && (ui.help?.level || 0) < 3 ? html`<div class="j-row j-answer-offer"><button type="button" class="btn" data-j="answer">Show me the answer</button><p class="j-note">Seeing the answer is fine. Your grown-up's report will show it.</p></div>` : ''}
      ${card.phase === 'youdo' && (ui.help?.level || 0) >= 3 && !rec?.correct ? (() => { const a = helpAnswer(card, ui); return html`<div class="j-help-block answer"><p class="j-help-label">Answer</p>${a.svg || ''}<p>${a.text}</p><p class="j-note">Now make it yourself.</p></div>`; })() : ''}
    </article>
    <div class="stage-nav j-nav">
      ${i > 0 ? html`<button type="button" class="btn" data-j="prev">‹ Back</button>` : prevStage ? html`<a class="btn" href="${ctx.lessonLink('7-1', prevStage.id)}">‹ ${prevStage.label}</a>` : html`<span></span>`}
      ${nextBtn}
    </div>
    ${done ? '' : why}
    <p class="hint">Your work is saved on this device, so you can come back later. Nothing is sent anywhere.</p>`;
}

// ------------------------------------------------------------------ parent summary
export function journeySummary(ctx, state) {
  const s = summarize(state.records), t = s.totals, r = s.ready;
  const wrote = s.written.filter((w) => w.rec?.written);
  return html`<section class="card j-summary" aria-labelledby="j-sum-h">
    <h2 id="j-sum-h" tabindex="-1">Lesson 7-1 readiness report</h2>
    <p class="j-verdict ${r.verdict.level}"><strong>${{ ready: 'Ready.', review: 'Almost ready.', notyet: 'Not ready yet.', unfinished: 'In progress.' }[r.verdict.level]}</strong> ${r.verdict.text}</p>
    <p>Final Check: <strong>${r.score} of ${r.total}</strong> right${r.answered < r.total ? ` (${r.answered} of ${r.total} answered)` : ''}.${r.missedSkills.length ? ` Missed: ${r.missedSkills.join('; ')}.` : ''}</p>
    <h3>Each skill: the "You Do" problem</h3>
    <table class="j-table j-ready"><thead><tr><th scope="col">Skill</th><th scope="col">On their own</th></tr></thead><tbody>
      ${r.skills.map((k) => html`<tr class="${k.solid ? 'solid' : ''}"><th scope="row">${k.unit.title}</th><td>${k.text}</td></tr>`)}
    </tbody></table>
    ${r.shaky.length ? html`<p><strong>Practice more:</strong> ${r.shaky.join('; ')}.</p>` : ''}
    <p class="j-note">Not part of the Final Check (only the "You Do" above shows these): ${r.notChecked.join('; ')}.</p>
    <details class="j-detail"><summary>Every question in detail</summary>
      <ul class="j-totals">
        <li><strong>${t.independent}</strong> right on the first try with no help</li>
        <li><strong>${t.firstWrong}</strong> wrong on the first try</li>
        <li><strong>${t.afterHint}</strong> after a hint; <strong>${t.afterSteps}</strong> after visual steps; <strong>${t.afterRelearn}</strong> after watching the example again; <strong>${t.afterAnswer}</strong> after seeing the answer</li>
      </ul>
      <table class="j-table"><thead><tr><th scope="col">Question</th><th scope="col">Step</th><th scope="col">Result</th><th scope="col">Checks</th><th scope="col">Help used</th></tr></thead><tbody>
      ${s.rows.map((row) => html`<tr><th scope="row">${row.card.title}</th><td>${PHASES[row.card.phase] || ''}</td><td>${OUTCOME_TEXT[row.result]}</td><td>${row.rec?.attempts || 0}</td><td>${[row.rec?.help ? HELP_LABELS[row.rec.help] : '', row.rec?.relearn ? 'watched the example again' : ''].filter(Boolean).join(', ') || 'none'}</td></tr>`)}
      </tbody></table></details>
    <h3>Written answers</h3>
    ${wrote.length ? html`<ul>${wrote.map((w) => html`<li><strong>${w.card.title}:</strong> “${state.ui[w.card.id]?.text || ''}” ${w.rec.reviewed ? '(checklist ticked; a grown-up should still read it)' : '(needs a grown-up to read it)'}</li>`)}</ul>` : html`<p>No written answers yet.</p>`}
    <p class="j-note"><strong>Written answers need a grown-up to read them.</strong> The checklist is ticked by the child or a grown-up. The computer does not grade their meaning. A correct construction here shows the steps worked on screen; it does not prove mastery. Try the printed workbook page without help to confirm.</p>
    <h3>Try it on paper</h3>
    <p>On screen, lines join dots. On paper there are no dots. Before the workbook, ask your child to draw on blank shapes: a diamond, a square, a circle, an octagon and a hexagon. Watch for two things: lines that cross in the middle of the shape, and parts that look the same size. Then use the printed lesson as the final check, with no help.</p>
    <section class="j-reset" aria-labelledby="j-reset-h" data-j-reset-box>
      <h3 id="j-reset-h">Saved progress (for grown-ups)</h3>
      <p>Lesson 7-1 progress is saved only in this browser on this device, so your child can stop and come back. It holds answers, drawings, written answers and the results above. It holds no name, and nothing is sent anywhere. Lessons 7-2 to 7-7 save their own progress in this browser too (each has its own reset), and the Multiplication Mastery 8 game keeps its own scores in this browser. Other Study Scoop activities are not saved. Erase it when another child will use this device, or to start Lesson 7-1 again.</p>
      <div class="j-row" data-j-reset-ask><button type="button" class="btn" data-j-reset="ask">Reset Lesson 7-1 progress…</button></div>
      <div class="j-confirm" data-j-reset-confirm hidden>
        <p role="alert"><strong>Erase all Lesson 7-1 progress on this device?</strong> This cannot be undone.</p>
        <div class="j-row"><button type="button" class="btn btn-primary" data-j-reset="no">Cancel: keep progress</button><button type="button" class="btn j-danger" data-j-reset="yes">Yes, erase Lesson 7-1 progress</button></div>
      </div>
    </section>
  </section>`;
}
export { SKILLS };
