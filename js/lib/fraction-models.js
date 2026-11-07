// Deterministic fraction diagrams. Accessible observations describe parts, never compute the requested answer.
import { fractionModelProblems } from './fractions.js';
export function describeFraction(m) {
  if (fractionModelProblems(m).length) return 'Invalid fraction diagram.';
  if (m.kind === 'line') return `Number line from zero to ${m.max ?? 1}. Each unit has ${m.parts} equal intervals. A point is on tick ${m.point}, counting from zero. Whole-number ticks are labelled.`;
  const count = (m.wholes ?? 1) * m.parts;
  const structure = m.kind === 'set' ? 'One whole collection of objects' : `${m.wholes ?? 1} same-sized whole ${m.kind === 'circle' ? 'circles' : 'bars'}, divided into parts`;
  return structure + '. ' + Array.from({ length: count }, (_, i) => {
    const position = m.kind === 'set' ? `Object ${i + 1}` : `Whole ${Math.floor(i / m.parts) + 1}, part ${i % m.parts + 1}`;
    const geometry = m.kind === 'bar' ? `, ${m.layout === 'rows' ? 'height' : 'width'} ${m.weights?.[i % m.parts] ?? 1} relative units` : m.kind === 'circle' ? `, sector angle ${360 / m.parts} degrees` : '';
    const counted = m.counted?.indexOf(i) ?? -1;
    return `${position}${geometry}: ${m.selected.includes(i) ? 'shaded and dotted' : 'unshaded'}${counted >= 0 ? `, count marker ${counted + 1}` : ''}`;
  }).join('; ') + '.';
}
export function fractionSvg(m) {
  if (fractionModelProblems(m).length) return '<span>Invalid fraction diagram</span>';
  const out = [];
  if (m.kind === 'line') {
    const max = m.max ?? 1, width = 560, y = 48, left = 20, span = width - 40;
    out.push(`<line x1="${left}" y1="${y}" x2="${width - left}" y2="${y}" stroke="currentColor" stroke-width="3"/>`);
    for (let i = 0; i <= m.parts * max; i++) { const x = left + span * i / (m.parts * max); out.push(`<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="currentColor" stroke-width="2"/>`); if (i % m.parts === 0) out.push(`<text x="${x}" y="80" text-anchor="middle" font-size="18">${i / m.parts}</text>`); }
    out.push(`<circle cx="${left + span * m.point / (m.parts * max)}" cy="${y}" r="7" fill="#583084" stroke="currentColor" stroke-width="2"/>`);
    return `<svg aria-hidden="true" focusable="false" viewBox="0 0 ${width} 94" width="${width}" height="94">${out.join('')}</svg>`;
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
  for (let w = 0; w < wholes; w++) {
    const y = 12 + w * 116;
    if (m.kind === 'bar') {
      const weights = m.weights || Array(m.parts).fill(1), total = weights.reduce((a, b) => a + b, 0); let offset = 0;
      for (let i = 0; i < m.parts; i++) {
        const rows = m.layout === 'rows', size = (rows ? 88 : 300) * weights[i] / total, idx = w * m.parts + i;
        const x = rows ? 12 : 12 + offset, top = rows ? y + offset : y, width = rows ? 300 : size, height = rows ? size : 88;
        out.push(`<rect x="${x}" y="${top}" width="${width}" height="${height}" fill="${fill(idx)}" stroke="#222" stroke-width="2"/>`);
        if (m.selected.includes(idx)) out.push(pattern(x + width / 2, top + height / 2));
        out.push(marker(idx, x + width / 2, top + height / 2, rows && m.parts > 4 ? 7 : 11)); offset += size;
      }
    } else {
      const cx = 162, cy = y + 46, r = 44;
      if (m.parts === 1) { out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill(w)}" stroke="#222" stroke-width="2"/>`); if (m.selected.includes(w)) out.push(pattern(cx, cy)); out.push(marker(w, cx, cy)); }
      else for (let i = 0; i < m.parts; i++) { const a = 2 * Math.PI * i / m.parts - Math.PI / 2, b = 2 * Math.PI * (i + 1) / m.parts - Math.PI / 2, idx = w * m.parts + i; out.push(`<path d="M${cx} ${cy} L${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)} Z" fill="${fill(idx)}" stroke="#222" stroke-width="2"/>`); if (m.selected.includes(idx)) out.push(pattern(cx + r * .6 * Math.cos((a + b) / 2), cy + r * .6 * Math.sin((a + b) / 2))); out.push(marker(idx, cx + r * .65 * Math.cos((a + b) / 2), cy + r * .65 * Math.sin((a + b) / 2), 8)); }
    }
  }
  return m.kind === 'circle' && m.framing === 'close'
    ? `<svg data-framing="close" aria-hidden="true" focusable="false" viewBox="104 0 116 ${wholes * 116}" width="232" height="${wholes * 232}">${out.join('')}</svg>`
    : `<svg aria-hidden="true" focusable="false" viewBox="0 0 324 ${wholes * 116}" width="324" height="${wholes * 116}">${out.join('')}</svg>`;
}
