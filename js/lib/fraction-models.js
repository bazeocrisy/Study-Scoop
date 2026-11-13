// Deterministic fraction diagrams. Accessible observations describe parts, never compute the requested answer.
import { fractionModelProblems } from './fractions.js';
export function describeFraction(m) {
  if (fractionModelProblems(m).length) return 'Invalid fraction diagram.';
  // Number lines are described tick by tick, as a sighted child sees them, so a screen-reader user counts the
  // spaces too: the description never states how many spaces there are or how far the point is (forensic audit 2026-11-13).
  if (m.kind === 'line') return `Number line from zero to ${m.max ?? 1}, with equal spaces between tick marks. Tick marks from left to right: ${Array.from({ length: m.parts * (m.max ?? 1) + 1 }, (_, i) => `${i % m.parts === 0 ? `tick labeled ${i / m.parts}` : 'tick'}${i === m.point ? ' with the point' : ''}`).join(', ')}. A reference bracket from zero to one marks one whole.${m.counted?.length ? ' ' + m.counted.map((index, ordinal) => `Space ${index + 1} from the left has a bold stroke and count marker ${ordinal + 1}.`).join(' ') : ''}`;
  const count = (m.wholes ?? 1) * m.parts;
  const structure = m.kind === 'set' ? 'One whole collection of objects' : `${(m.wholes ?? 1) === 1 ? 'One whole' : `${m.wholes} same-sized wholes`}: ${(m.wholes ?? 1) === 1 ? (m.kind === 'circle' ? 'a circle' : 'a bar') : (m.kind === 'circle' ? 'circles' : 'bars')}${m.parts === 1 ? ' that is not divided (1 part)' : m.kind === 'circle' ? ' divided into equal parts' : ' divided into parts'}`;
  return structure + (m.wholeLayout === 'grid' ? ', arranged in two columns and read left to right across each row' : '') + '. ' + Array.from({ length: count }, (_, i) => {
    const position = m.kind === 'set' ? `Object ${i + 1}` : `Whole ${Math.floor(i / m.parts) + 1}, part ${i % m.parts + 1}`;
    const geometry = m.kind === 'bar' ? (() => { const u = m.weights?.[i % m.parts] ?? 1; return `, size ${u}`; })() : '';
    const counted = m.counted?.indexOf(i) ?? -1;
    return `${position}${geometry}: ${m.selected.includes(i) ? 'shaded and dotted' : 'unshaded'}${counted >= 0 ? `, count marker ${counted + 1}` : ''}`;
  }).join('; ') + '.';
}
export function fractionSvg(m) {
  if (fractionModelProblems(m).length) return '<span>Invalid fraction diagram</span>';
  const out = [];
  if (m.kind === 'line') {
    const max = m.max ?? 1, width = 560, left = 20, span = width - 40;
    const markerRows = m.counted?.length ? Math.ceil(m.parts * max / 16) : 1, y = 48 + (markerRows - 1) * 36;
    out.push(`<line x1="${left}" y1="${y}" x2="${width - left}" y2="${y}" stroke="currentColor" stroke-width="3"/>`);
    for (let i = 0; i <= m.parts * max; i++) { const x = left + span * i / (m.parts * max); out.push(`<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="currentColor" stroke-width="2"/>`); if (i % m.parts === 0) out.push(`<text x="${x}" y="${y + 32}" text-anchor="middle" font-size="18">${i / m.parts}</text>`); }
    for (const [ordinal, index] of (m.counted || []).entries()) {
      const start = left + span * index / (m.parts * max), end = left + span * (index + 1) / (m.parts * max), center = (start + end) / 2;
      const markerY = 20 + (index % markerRows) * 36;
      out.push(`<g data-count-interval="${index}" data-count-marker="${ordinal + 1}"><line x1="${start + 2}" y1="${y}" x2="${end - 2}" y2="${y}" stroke="#583084" stroke-width="7"/><line x1="${center}" y1="${markerY + 16}" x2="${center}" y2="${y - 5}" stroke="#555" stroke-width="1"/><circle cx="${center}" cy="${markerY}" r="16" fill="#fff" stroke="#222" stroke-width="2"/><text x="${center}" y="${markerY}" text-anchor="middle" dominant-baseline="central" font-size="22" font-weight="700" fill="#111">${ordinal + 1}</text></g>`);
    }
    out.push(`<circle cx="${left + span * m.point / (m.parts * max)}" cy="${y}" r="7" fill="#583084" stroke="currentColor" stroke-width="2"/>`);
    // The tick under the point stays visible above and below the dot, so every tick can be counted.
    if (m.point > 0) { const px = left + span * m.point / (m.parts * max); out.push(`<path d="M${px} ${y - 15}V${y - 8}M${px} ${y + 8}V${y + 15}" stroke="currentColor" stroke-width="2"/>`); }
    const unitEnd = left + span / max;
    out.push(`<path d="M${left} ${y + 42} v5 H${unitEnd} v-5" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="${(left + unitEnd) / 2}" y="${y + 67}" text-anchor="middle" font-size="14">one whole</text>`);
    return `<svg aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${y + 76}" width="${width}" height="${y + 76}">${out.join('')}</svg>`;
  }
  const wholes = m.wholes ?? 1;
  const pattern = (x, y) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/>`;
  const fill = (idx) => m.selected.includes(idx) ? '#583084' : '#fff';
  const marker = (idx, x, y, radius = 11) => {
    const at = m.counted?.indexOf(idx) ?? -1;
    return at < 0 ? '' : `<g data-count-marker="${at + 1}"><circle cx="${x}" cy="${y}" r="${radius}" fill="#fff" stroke="#222" stroke-width="2"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${radius + 3}" font-weight="700" fill="#111">${at + 1}</text></g>`;
  };
  if (m.kind === 'set') {
    const cols = Math.min(6, m.parts), rows = Math.ceil(m.parts / cols);
    for (let i = 0; i < m.parts; i++) { const x = 24 + (i % cols) * 40, y = 24 + Math.floor(i / cols) * 40; out.push(`<circle cx="${x}" cy="${y}" r="15" fill="${fill(i)}" stroke="#222" stroke-width="2"/>`); if (m.selected.includes(i)) out.push(pattern(x, y)); out.push(marker(i, x, y, 9)); }
    return `<svg aria-hidden="true" focusable="false" viewBox="0 0 ${cols * 40 + 8} ${rows * 40 + 8}" width="${cols * 40 + 8}" height="${rows * 40 + 8}">${out.join('')}</svg>`;
  }
  const grid = m.wholeLayout === 'grid', columns = grid ? 2 : 1;
  const chartHeight = Math.ceil(wholes / columns) * 116;
  for (let w = 0; w < wholes; w++) {
    const xOffset = grid ? (w % columns) * 162 : 0, y = 12 + Math.floor(w / columns) * 116;
    const barWidth = grid ? 138 : 300;
    if (m.kind === 'bar') {
      const weights = m.weights || Array(m.parts).fill(1), total = weights.reduce((a, b) => a + b, 0); let offset = 0;
      for (let i = 0; i < m.parts; i++) {
        const rows = m.layout === 'rows', size = (rows ? 88 : barWidth) * weights[i] / total, idx = w * m.parts + i;
        const x = xOffset + (rows ? 12 : 12 + offset), top = rows ? y + offset : y, width = rows ? barWidth : size, height = rows ? size : 88;
        out.push(`<rect x="${x}" y="${top}" width="${width}" height="${height}" fill="${fill(idx)}" stroke="#222" stroke-width="2"/>`);
        if (m.selected.includes(idx)) out.push(pattern(x + width / 2, top + height / 2));
        out.push(marker(idx, x + width / 2, top + height / 2, grid ? Math.max(3, Math.min(18, (rows ? height : width) / 2 - 1)) : rows && m.parts > 4 ? 7 : 11)); offset += size;
      }
    } else {
      const cx = xOffset + (grid ? 81 : 162), cy = y + 46, r = 44;
      if (m.parts === 1) { out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill(w)}" stroke="#222" stroke-width="2"/>`); if (m.selected.includes(w)) out.push(pattern(cx, cy)); out.push(marker(w, cx, cy, grid ? 18 : 11)); }
      else for (let i = 0; i < m.parts; i++) { const a = 2 * Math.PI * i / m.parts - Math.PI / 2, b = 2 * Math.PI * (i + 1) / m.parts - Math.PI / 2, idx = w * m.parts + i; out.push(`<path d="M${cx} ${cy} L${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)} Z" fill="${fill(idx)}" stroke="#222" stroke-width="2"/>`); if (m.selected.includes(idx)) out.push(pattern(cx + r * .6 * Math.cos((a + b) / 2), cy + r * .6 * Math.sin((a + b) / 2))); out.push(marker(idx, cx + r * .65 * Math.cos((a + b) / 2), cy + r * .65 * Math.sin((a + b) / 2), grid ? Math.min(14, Math.max(6, r * .65 * Math.sin(Math.PI / m.parts) - 1)) : 8)); }
    }
  }
  return !grid && m.kind === 'circle' && m.framing === 'close'
    ? `<svg data-framing="close" aria-hidden="true" focusable="false" viewBox="104 0 116 ${wholes * 116}" width="232" height="${wholes * 232}">${out.join('')}</svg>`
    : `<svg${grid ? ' data-whole-layout="grid"' : ''} aria-hidden="true" focusable="false" viewBox="0 0 324 ${chartHeight}" width="324" height="${chartHeight}">${out.join('')}</svg>`;
}
