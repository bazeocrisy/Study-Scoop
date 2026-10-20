// Tiny arithmetic for lesson content: whole numbers, × ÷ + − and parentheses, and "=" chains.
// Used by the lesson checker and the validator so every equation shown to a child is computed, never trusted.
// No eval (the Content Security Policy forbids it anyway).

const TOKEN = /\s*(\d+|[×x*÷/+\-−=()])/y;

export function tokenize(text) {
  const out = [];
  const s = String(text);
  TOKEN.lastIndex = 0;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(s);
    if (!m) throw new Error(`Cannot read "${s.slice(i, i + 8)}" in "${s}"`);
    const t = m[1];
    out.push(/\d/.test(t) ? Number(t) : t === 'x' || t === '*' ? '×' : t === '/' ? '÷' : t === '−' ? '-' : t);
    i = TOKEN.lastIndex;
  }
  return out;
}

/** Value of an expression with no "=" (× before + and −; parentheses first). */
export function evaluate(text) {
  const t = Array.isArray(text) ? text : tokenize(text);
  let i = 0;
  const peek = () => t[i];
  function primary() {
    const v = t[i++];
    if (v === '(') { const r = sum(); if (t[i++] !== ')') throw new Error('missing )'); return r; }
    if (typeof v !== 'number') throw new Error(`expected a number, got ${JSON.stringify(v)}`);
    return v;
  }
  function product() {
    let v = primary();
    while (peek() === '×' || peek() === '÷') { const op = t[i++]; const r = primary(); v = op === '×' ? v * r : v / r; }
    return v;
  }
  function sum() {
    let v = product();
    while (peek() === '+' || peek() === '-') { const op = t[i++]; const r = product(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  const v = sum();
  if (i !== t.length) throw new Error(`unexpected ${JSON.stringify(t[i])}`);
  return v;
}

/** Splits "a = b = c" into its sides. */
export const sides = (text) => String(text).split('=').map((s) => s.trim());

/** True when every side of an "=" chain has the same value (needs at least two sides). */
export function chainHolds(text) {
  const parts = sides(text);
  if (parts.length < 2 || parts.some((p) => p === '')) return false;
  const values = parts.map((p) => evaluate(p));
  return values.every((v) => v === values[0]);
}

/** Every "=" chain written inside free text that is not true, e.g. "20 + 16 = 37" in a hint or message
 *  (a backstop for prose, captions, feedback and Show me how steps). */
export function wrongFactsInText(text) {
  const bad = [];
  // The longest run of numbers, signs and brackets (a whole chain), which must contain "=".
  const CHAIN = /(?<![\d\w])[\d(][\d\s×x÷+\-−()=]*[\d)](?![\d\w])/g;
  for (const m of String(text).matchAll(CHAIN)) {
    const chain = m[0].trim();
    if (!chain.includes('=')) continue;
    let ok;
    try { ok = chainHolds(chain); } catch { continue; } // not arithmetic after all (e.g. a list of numbers)
    if (!ok) bad.push(chain);
  }
  return bad;
}

/** How to read math aloud: "6 × 3 = 5 × 3 + 1 × 3" -> "6 times 3 equals 5 times 3, plus 1 times 3".
 *  Only an "x" between numbers is a times sign; words keep their letters. */
export function speak(text) {
  return String(text)
    .replace(/\[[a-z0-9]+\]/gi, 'blank')
    .replace(/_{2,}/g, 'blank')
    .replace(/\(\s*\)/g, 'brackets')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/(\d|blank)\s*x\s*(?=\d|blank)/g, '$1 times ')
    .replace(/(\d|\))\s*\+\s*(?=\d|\(|blank)/g, '$1, plus ')
    .replace(/(\d|blank)\s*[−]\s*(?=\d)/g, '$1 minus ')
    .replace(/(\d)\s+-\s+(?=\d)/g, '$1 minus ')
    .replace(/\s*=\s*/g, ' equals ')
    .replace(/\((?=[\d\s]|blank)|(?<=[\d\s]|blank)\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
