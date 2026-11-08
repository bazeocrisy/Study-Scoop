// Exact, integer-backed fraction mathematics. No floating point answer grading.
const int = (n, lo = 0, hi = 9999) => Number.isSafeInteger(n) && n >= lo && n <= hi;
export const validFraction = (f) => f && int(f.n) && int(f.d, 1);
export const equalFractions = (a, b) => Boolean(validFraction(a) && validFraction(b) && BigInt(a.n) * BigInt(b.d) === BigInt(b.n) * BigInt(a.d));
export function parseFraction(text) {
  const m = /^\s*(\d{1,4})\s*\/\s*(\d{1,4})\s*$/.exec(String(text));
  if (!m) return null;
  const f = { n: Number(m[1]), d: Number(m[2]) };
  return validFraction(f) ? f : null;
}
export function fractionModelProblems(m) {
  const out = [];
  if (!m || m.type !== 'fraction') return ['needs a fraction model'];
  if (!['bar', 'circle', 'set', 'line'].includes(m.kind)) out.push('unknown fraction model kind');
  if (!int(m.parts, 1, 24)) out.push('parts must be an integer from 1 to 24');
  const wholes = m.kind === 'line' ? (m.max ?? 1) : (m.wholes ?? 1);
  if (!int(wholes, 1, 8)) out.push('wholes/max must be an integer from 1 to 8');
  if (m.kind === 'set' && wholes !== 1) out.push('a set defines one whole collection');
  if (m.kind === 'line') {
    if (!int(m.point, 0, m.parts * wholes)) out.push('point must be a tick index within the number line');
    if (m.selected !== undefined) out.push('a number line uses point, not selected');
  } else if (!Array.isArray(m.selected) || m.selected.some((n) => !int(n, 0, m.parts * wholes - 1)) || new Set(m.selected).size !== m.selected.length) out.push('selected must be distinct part indices within the wholes');
  if (m.weights !== undefined && (m.kind !== 'bar' || !Array.isArray(m.weights) || m.weights.length !== m.parts || m.weights.some((n) => !int(n, 1, 1000)))) out.push('weights need one positive integer per bar part');
  if (m.layout !== undefined && (m.kind !== 'bar' || !['columns', 'rows'].includes(m.layout))) out.push('layout must be columns or rows on a bar');
  if (m.wholeLayout !== undefined && (!['bar', 'circle'].includes(m.kind) || m.wholeLayout !== 'grid')) out.push('wholeLayout grid is supported only on bar or circle models');
  if (m.framing !== undefined && (m.kind !== 'circle' || m.framing !== 'close')) out.push('close framing is supported only on circle models');
  if (m.counted !== undefined && (!Array.isArray(m.counted) || m.counted.some((n) => !int(n, 0, m.parts * wholes - 1)) || new Set(m.counted).size !== m.counted.length)) out.push('counted markers need distinct part or interval indices in range');
  return out;
}
export function fractionOfModel(m) {
  if (fractionModelProblems(m).length) throw new Error('Invalid fraction model');
  if (m.weights && new Set(m.weights).size > 1) throw new Error('Unequal parts do not define a count-based fraction');
  return { n: m.kind === 'line' ? m.point : m.selected.length, d: m.parts };
}
export function checkFraction(item, response) {
  if (!validFraction(item.answer)) return { status: 'empty', say: 'This fraction question is unavailable.' };
  const got = {};
  for (const k of ['n', 'd']) {
    const t = String(response?.[k] ?? '').trim();
    if (!t) return { status: 'empty', say: 'Enter both the numerator and denominator.', wrong: [k] };
    if (!/^\d{1,4}$/.test(t)) return { status: 'empty', say: 'Use whole-number digits in both boxes.', wrong: [k] };
    got[k] = Number(t);
  }
  if (!got.d) return { status: 'notyet', say: 'The denominator must be greater than zero.', wrong: ['d'] };
  const right = item.answerPolicy === 'value' ? equalFractions(got, item.answer) : got.n === item.answer.n && got.d === item.answer.d;
  return right ? { status: 'correct', say: item.yes || 'Yes!' } : { status: 'notyet', say: item.retry || (item.answerPolicy === 'value' ? 'Check the value represented by the model.' : 'Count the selected parts and the equal parts in one whole.'), wrong: item.answerPolicy === 'value' ? ['n', 'd'] : ['n', 'd'].filter((k) => got[k] !== item.answer[k]) };
}
export function fractionItemProblems(item) {
  const out = [];
  if (item.type === 'fraction') {
    if (!validFraction(item.answer)) out.push('fraction answer needs nonnegative integer n and positive integer d');
    if (!['partition', 'value'].includes(item.answerPolicy)) out.push('fraction answerPolicy must be partition or value');
    if (item.asks !== 'fraction') out.push('fraction item must declare asks: fraction');
  }
  if (item.asks === 'fraction') {
    let want;
    try { want = fractionOfModel(item.model); } catch (e) { out.push(e.message); return out; }
    if (item.type === 'fraction' && validFraction(item.answer)) {
      if (item.answerPolicy === 'partition' ? item.answer.n !== want.n || item.answer.d !== want.d : !equalFractions(item.answer, want)) out.push('fraction answer does not match the model');
    }
    if (item.type === 'choice') {
      const values = (item.options || []).map((o) => parseFraction(o.text));
      values.forEach((f, i) => {
        if (!f) out.push(`option ${i + 1} must be a numeric fraction with positive denominator`);
        else if (equalFractions(f, want) !== Boolean(item.options[i].correct)) out.push(`option ${i + 1} key does not match the model value`);
        if (f && values.slice(0, i).some((v) => equalFractions(v, f))) out.push('equivalent duplicate fraction choices');
      });
    }
  }
  return out;
}
// BigInt rational expression parser, used only for authored equations and validation.
const gcd = (a, b) => b ? gcd(b, a % b) : (a < 0n ? -a : a);
function rat(n, d = 1n) { if (!d) throw new Error('zero denominator'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; }
export function rationalValue(text) {
  const s = String(text); const tokens = s.match(/\d+|[()+\-−×x*÷/]/g) || [];
  if (tokens.join('') !== s.replace(/\s/g, '')) throw new Error('invalid rational expression');
  let i = 0;
  function primary() { const t = tokens[i++]; if (t === '(') { const v = sum(); if (tokens[i++] !== ')') throw new Error('missing parenthesis'); return v; } if (t === '-' || t === '−') { const v = primary(); return rat(-v.n, v.d); } if (!/^\d+$/.test(t || '')) throw new Error('expected integer'); return rat(BigInt(t)); }
  function product() { let a = primary(); while (['×', 'x', '*', '÷', '/'].includes(tokens[i])) { const op = tokens[i++], b = primary(); a = ['×', 'x', '*'].includes(op) ? rat(a.n * b.n, a.d * b.d) : rat(a.n * b.d, a.d * b.n); } return a; }
  function sum() { let a = product(); while (['+', '-', '−'].includes(tokens[i])) { const op = tokens[i++], b = product(); a = rat(a.n * b.d + (op === '+' ? 1n : -1n) * b.n * a.d, a.d * b.d); } return a; }
  const a = sum(); if (i !== tokens.length) throw new Error('extra token'); return a;
}
export function rationalChainHolds(text) {
  const sides = String(text).split('='); if (sides.length < 2 || sides.some((s) => !s.trim())) return false;
  try { const v = sides.map(rationalValue); return v.every((x) => x.n === v[0].n && x.d === v[0].d); } catch { return false; }
}
export function wrongFractionFactsInText(text) {
  const bad = [];
  for (const m of String(text).matchAll(/(?<![\w\d])[\d(][\d\s/×x*÷+\-−()=]*[\d)](?![\w\d])/g)) {
    const t = m[0].trim(); if (t.includes('=')) {
      try { t.split('=').forEach(rationalValue); if (!rationalChainHolds(t)) bad.push(t); } catch { bad.push(t); }
    }
  }
  return bad;
}
