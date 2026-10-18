// Pictures for math, drawn from numbers (never by hand), so a picture always matches its equation.
// a × b is drawn as a rows of b. A cut goes between rows (splits the first factor) or between
// columns (splits the second factor), never through a dot. Colours come from CSS classes (no style attributes).

import { html, raw } from './html.js';

const GAP = 30;      // distance between dot centres
const R = 10.5;      // dot radius
const SPLIT = 22;    // extra space where the cut is

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Accessible description of a model (what is drawn, never the answer to a question). */
export function describe(m) {
  if (m.type === 'plates') {
    if (m.plates === 0) return 'No plates at all.';
    return `${plural(m.plates, 'plate')} with ${m.each === 0 ? 'nothing' : plural(m.each, 'dot')} on each plate.`;
  }
  if (m.type === 'pair') return `${describe(m.left)} Turned around: ${describe(m.right)}`;
  const unit = m.style === 'tiles' ? 'square' : 'dot';
  let s = m.style === 'tiles'
    ? `A rectangle of squares, ${m.rows} tall and ${m.cols} wide.`
    : `${plural(m.rows, 'row')} with ${plural(m.cols, unit)} in each row.`;
  if (m.cut) {
    s += m.cut.by === 'rows'
      ? ` A dashed line cuts under row ${m.cut.at}.`
      : ` A dashed line cuts after column ${m.cut.at}.`;
  }
  if (m.star) s += ' One dot is a star.';
  // Pictures that print their facts say them too (questions use "parts" labels, which give nothing away).
  if (m.cut && m.labels === 'facts') {
    const [[a1, a2], [b1, b2]] = parts(m);
    const [first, second] = m.cut.by === 'rows' ? ['Top part', 'Bottom part'] : ['Left part', 'Right part'];
    s += ` ${first}: ${a1} × ${a2} = ${a1 * a2}. ${second}: ${b1} × ${b2} = ${b1 * b2}.`;
  }
  return s;
}

/** Numbers for each part of a cut array: the two facts in equation order. */
export function parts(m) {
  if (!m.cut) return null;
  return m.cut.by === 'rows'
    ? [[m.cut.at, m.cols], [m.rows - m.cut.at, m.cols]]
    : [[m.rows, m.cut.at], [m.rows, m.cols - m.cut.at]];
}

function arrayShapes(m, ox = 0, oy = 0) {
  const tiles = m.style === 'tiles';
  const out = [];
  for (let r = 0; r < m.rows; r++) {
    for (let c = 0; c < m.cols; c++) {
      let part = '';
      let x = ox + c * GAP, y = oy + r * GAP;
      if (m.cut?.by === 'rows') { part = r < m.cut.at ? 'a' : 'b'; if (r >= m.cut.at) y += SPLIT; }
      if (m.cut?.by === 'cols') { part = c < m.cut.at ? 'a' : 'b'; if (c >= m.cut.at) x += SPLIT; }
      const cls = `m-${tiles ? 'tile' : 'dot'}${part ? ` m-${part}` : ''}`;
      if (m.star && m.star[0] === r && m.star[1] === c) {
        const cx = x + R, cy = y + R;
        const pts = Array.from({ length: 10 }, (_, k) => {
          const ang = -Math.PI / 2 + k * Math.PI / 5; const rad = k % 2 ? R * 0.48 : R * 1.35;
          return `${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`;
        }).join(' ');
        out.push(`<polygon class="m-star" points="${pts}"/>`);
      } else if (tiles) {
        out.push(`<rect class="${cls}" x="${x - 4}" y="${y - 4}" width="${GAP}" height="${GAP}"/>`);
      } else {
        out.push(`<circle class="${cls}" cx="${x + R}" cy="${y + R}" r="${R}"/>`);
      }
    }
  }
  return out;
}

function arraySize(m) {
  const w = m.cols * GAP - (GAP - 2 * R) + (m.cut?.by === 'cols' ? SPLIT : 0) + (m.style === 'tiles' ? 8 : 0);
  const h = m.rows * GAP - (GAP - 2 * R) + (m.cut?.by === 'rows' ? SPLIT : 0) + (m.style === 'tiles' ? 8 : 0);
  return [w, h];
}

function labelText(m, i) {
  const [p, q] = parts(m)[i];
  if (m.labels === 'facts') return [`${p} × ${q} = ${p * q}`, m.cut.by === 'rows' ? plural(p, 'row') + ` of ${q}` : plural(q, 'column') + ` of ${p}`];
  if (m.labels === 'parts') return m.cut.by === 'rows' ? [i ? 'Bottom part' : 'Top part', ''] : [i ? 'Right part' : 'Left part', ''];
  return null;
}

/** SVG markup for an array model. */
function arraySvg(m) {
  const [w, h] = arraySize(m);
  const pad = m.style === 'tiles' ? 4 : 0;
  const shapes = arrayShapes(m, pad, pad);
  let extraW = 0, extraH = 0;
  if (m.cut) {
    const y = m.cut.by === 'rows' ? m.cut.at * GAP - (GAP - 2 * R) / 2 + SPLIT / 2 + pad : 0;
    const x = m.cut.by === 'cols' ? m.cut.at * GAP - (GAP - 2 * R) / 2 + SPLIT / 2 + pad : 0;
    shapes.push(m.cut.by === 'rows'
      ? `<line class="m-cut" x1="0" x2="${w}" y1="${y}" y2="${y}"/>`
      : `<line class="m-cut" x1="${x}" x2="${x}" y1="0" y2="${h}"/>`);
    if (m.labels && m.labels !== 'none') {
      const ps = parts(m);
      for (const i of [0, 1]) {
        const [main, sub] = labelText(m, i);
        const cls = i ? 'm-lab m-lab-b' : 'm-lab m-lab-a';
        if (m.cut.by === 'rows') {
          const top = i ? m.cut.at * GAP + SPLIT : 0;
          const bot = top + ps[i][0] * GAP - (GAP - 2 * R);
          const mid = (top + bot) / 2 + pad;
          shapes.push(`<path class="m-brace ${i ? 'm-b-line' : 'm-a-line'}" d="M${w + 6} ${top + pad} h6 V${bot + pad} h-6"/>`);
          shapes.push(`<text class="${cls}" x="${w + 20}" y="${mid + (sub ? -2 : 6)}">${main}</text>`);
          if (sub) shapes.push(`<text class="${cls} m-sub" x="${w + 20}" y="${mid + 17}">${sub}</text>`);
        } else {
          // Column parts can be narrow, so their labels go under the picture as text lines (see modelFigure).
          const left = i ? m.cut.at * GAP + SPLIT : 0;
          const right = left + ps[i][1] * GAP - (GAP - 2 * R);
          shapes.push(`<path class="m-brace ${i ? 'm-b-line' : 'm-a-line'}" d="M${left + pad} ${h + 6} v6 H${right + pad} v-6"/>`);
        }
      }
      if (m.cut.by === 'rows') extraW = 150; else extraH = 16;
    }
  }
  if (m.sideLabels) {
    // Area model: side lengths written along the top and the left (the rectangle is moved right/down to make room).
    return areaSvg(m, w, h, shapes);
  }
  const W = w + extraW, H = h + extraH;
  return `<svg class="model-svg" viewBox="${-2} ${-2} ${W + 4} ${H + 4}" width="${W + 4}" height="${H + 4}">${shapes.join('')}</svg>`;
}

function areaSvg(m, w, h, shapes) {
  const off = 28;
  const labels = [`<text class="m-side" x="${-12}" y="${h / 2 + 6}" text-anchor="end">${m.rows}</text>`];
  if (m.cut?.by === 'cols') {
    const a = m.cut.at, b = m.cols - m.cut.at;
    const wa = a * GAP - (GAP - 2 * R) + 8;
    labels.push(`<text class="m-side m-side-a" x="${wa / 2}" y="-10" text-anchor="middle">${a}</text>`);
    labels.push(`<text class="m-side m-side-b" x="${wa + SPLIT + (b * GAP - (GAP - 2 * R) + 8) / 2 - 8}" y="-10" text-anchor="middle">${b}</text>`);
  } else {
    labels.push(`<text class="m-side" x="${w / 2}" y="-10" text-anchor="middle">${m.cols}</text>`);
  }
  const W = w + off + 4, H = h + off + 4;
  return `<svg class="model-svg" viewBox="${-off} ${-off} ${W} ${H}" width="${W}" height="${H}">${labels.join('')}${shapes.join('')}</svg>`;
}

function platesSvg(m) {
  if (m.plates === 0) return '';
  const per = Math.min(m.plates, m.perRow || 5);
  const rows = Math.ceil(m.plates / per);
  const PW = 52, PH = 40;
  const out = [];
  for (let i = 0; i < m.plates; i++) {
    const cx = (i % per) * (PW + 10) + PW / 2 + 2, cy = Math.floor(i / per) * (PH + 12) + PH / 2 + 2;
    out.push(`<ellipse class="m-plate" cx="${cx}" cy="${cy}" rx="${PW / 2}" ry="${PH / 2 - 2}"/>`);
    out.push(`<ellipse class="m-plate-in" cx="${cx}" cy="${cy}" rx="${PW / 2 - 9}" ry="${PH / 2 - 10}"/>`);
    for (let k = 0; k < m.each; k++) {
      const dx = (k - (m.each - 1) / 2) * 13;
      out.push(`<circle class="m-dot" cx="${cx + dx}" cy="${cy}" r="6"/>`);
    }
  }
  const W = per * (PW + 10) - 10 + 4, H = rows * (PH + 12) - 12 + 4;
  return `<svg class="model-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out.join('')}</svg>`;
}

/** Counts used by tests: how many dots/tiles/plates are drawn in each part. */
export function counts(m) {
  if (m.type === 'plates') return { plates: m.plates, dots: m.plates * m.each };
  if (m.type === 'pair') return { left: counts(m.left), right: counts(m.right) };
  const total = m.rows * m.cols;
  if (!m.cut) return { total };
  const [[a1, a2], [b1, b2]] = parts(m);
  return { total, a: a1 * a2, b: b1 * b2 };
}

/** A model as accessible markup: <figure> with the picture and an optional caption. */
/** A picture spec reduced to known words and whole numbers, so nothing else can reach the SVG markup. */
function clean(m) {
  const int = (v) => Math.max(0, Math.min(144, Math.trunc(Number(v)) || 0));
  const pick = (v, list) => (list.includes(v) ? v : undefined);
  const arr = (a) => ({
    type: 'array', rows: Math.max(1, int(a.rows)), cols: Math.max(1, int(a.cols)),
    cut: a.cut ? { by: a.cut.by === 'cols' ? 'cols' : 'rows', at: int(a.cut.at) } : undefined,
    style: pick(a.style, ['dots', 'tiles']), labels: pick(a.labels, ['facts', 'parts', 'none']),
    sideLabels: Boolean(a.sideLabels), star: a.star ? [int(a.star[0]), int(a.star[1])] : undefined, alt: a.alt,
  });
  if (m.type === 'plates') return { type: 'plates', plates: int(m.plates), each: int(m.each), perRow: m.perRow ? int(m.perRow) : undefined, alt: m.alt };
  if (m.type === 'pair') return { type: 'pair', left: arr(m.left), right: arr(m.right), alt: m.alt };
  return arr(m);
}

export function modelFigure(model, caption) {
  const m = clean(model);
  let svg;
  if (m.type === 'plates') {
    svg = m.plates === 0 ? '<span class="m-none">no plates</span>' : platesSvg(m);
  } else if (m.type === 'pair') {
    svg = `<span class="m-pair">${arraySvg({ ...m.left, type: 'array' })}<span class="m-turn" aria-hidden="true">↻</span>${arraySvg({ ...m.right, type: 'array' })}</span>`;
  } else {
    svg = arraySvg(m);
  }
  const legend = m.type === 'array' && m.cut?.by === 'cols' && m.labels && m.labels !== 'none'
    ? html`<span class="m-legend" aria-hidden="true">${[0, 1].map((i) => {
      const [main, sub] = labelText(m, i);
      return m.labels === 'facts'
        ? html`<span class="${i ? 'm-lab-b' : 'm-lab-a'}"><strong>${i ? 'Right' : 'Left'}:</strong> ${main} <span class="m-sub-t">(${sub})</span></span>`
        : html`<span class="${i ? 'm-lab-b' : 'm-lab-a'}"><strong>${main}</strong></span>`;
    })}</span>` : '';
  return html`<figure class="model">
    <span class="model-pic" role="img" aria-label="${m.alt || describe(m)}">${raw(svg)}</span>
    ${legend}
    ${caption ? html`<figcaption>${caption}</figcaption>` : ''}
  </figure>`;
}
