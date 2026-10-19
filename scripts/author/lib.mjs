// Authoring helpers for the Unit 5 lesson files (development only; never published).
// Every number a child sees is computed here from the two factors, so an item cannot carry a wrong product.
// The lesson engine (js/lib/lessons.js) validates the written files again, independently, before they are shown.

export const F = (a, b) => `${a} × ${b}`;

/** An array picture: a rows of b, optionally cut between rows (splits a) or columns (splits b). */
export function arr(rows, cols, cut = null, labels = undefined, extra = {}) {
  const m = { type: 'array', rows, cols, ...extra };
  if (cut) {
    m.cut = { by: cut[0] === 'r' ? 'rows' : 'cols', at: cut[1] };
    if (labels) m.labels = labels;
  }
  return m;
}

/** The two facts of a × b cut by rows at k (k × b + (a − k) × b) or by columns at k (a × k + a × (b − k)). */
export function split(a, b, by, k) {
  const f1 = by === 'rows' ? [k, b] : [a, k];
  const f2 = by === 'rows' ? [a - k, b] : [a, b - k];
  const p = f1[0] * f1[1], q = f2[0] * f2[1];
  if (p + q !== a * b) throw new Error(`bad split ${a}×${b}`);
  return { f1, f2, p, q, t: a * b, eq: `${F(a, b)} = ${F(...f1)} + ${F(...f2)}` };
}

/** "a × b = ?" with a story-free prompt. */
export function fact(id, a, b, o = {}) {
  const item = { id, type: 'number', prompt: o.prompt || `${F(a, b)} = ?`, answer: F(a, b) };
  if (o.model) item.model = o.model;
  if (o.asks) item.asks = o.asks;
  return finish(item, o, a * b);
}

/** A story problem answered with one number (the product of a × b). */
export function story(id, prompt, a, b, o = {}) {
  const item = { id, type: 'number', prompt, answer: F(a, b) };
  if (o.model) item.model = o.model;
  return finish(item, o, a * b);
}

/**
 * The full three-line split: "a × b = f1 + f2", "= [p] + [q]", "= [t]".
 * ask: 'products' (p, q and t), 'total' (t only) or 'second' (q and t).
 */
export function partsFill(id, a, b, by, k, o = {}) {
  const s = split(a, b, by, k);
  const ask = o.ask || 'products';
  const lines = [s.eq];
  const answer = {};
  if (ask === 'products') { lines.push('= [p] + [q]'); answer.p = s.p; answer.q = s.q; }
  else if (ask === 'second') { lines.push(`= ${s.p} + [q]`); answer.q = s.q; }
  else lines.push(`= ${s.p} + ${s.q}`);
  lines.push('= [t]');
  answer.t = s.t;
  const item = { id, type: 'fill', prompt: o.prompt || 'Find each part. Then add.', lines, answer };
  // Hints teach a step without giving the products away (the full working is in Show me how):
  // the first says what the parts are, the second how to find them.
  const how = (f) => (f[0] === 1 || f[1] === 1 ? 'times 1 keeps the number' : f[0] === 10 || f[1] === 10 ? 'count by 10s' : f[0] === 5 || f[1] === 5 ? 'count by 5s' : f[0] === 2 || f[1] === 2 ? 'it is a double' : 'use a fact you know');
  o = { ...o, hints: [o.hints?.[0] || `The parts are ${F(...s.f1)} and ${F(...s.f2)}.`, `Find ${F(...s.f1)} (${how(s.f1)}) and ${F(...s.f2)} (${how(s.f2)}). Then add them.`] };
  if (o.model !== false) item.model = o.model || arr(a, b, [by[0], k], o.labels || 'parts');
  if (ask === 'products' && s.p !== s.q) item.accept = [{ p: s.q, q: s.p, t: s.t }];
  const mistakes = [
    { when: { t: s.p }, say: 'You found the first part! Now add the second part.' },
  ];
  if (a + b !== s.p && a + b !== s.t) mistakes.push({ when: { t: a + b }, say: `${F(a, b)} means ${a} groups of ${b}, not ${a} + ${b}. Add the two products.` });
  if (ask === 'products' && s.p !== s.q) {
    const leftover = by === 'rows' ? s.f2[0] : s.f2[1];
    if (leftover !== s.q && leftover !== s.p) mistakes.push({ when: { q: leftover }, say: `The second part is ${F(...s.f2)}, not ${leftover}. Find ${F(...s.f2)}.` });
  }
  item.mistakes = dedupe([...(o.mistakes || []), ...mistakes]);
  return finish(item, { ...o, show: o.show || [`${F(...s.f1)} = ${s.p}.`, `${F(...s.f2)} = ${s.q}.`, `${s.p} + ${s.q} = ${s.t}. So ${F(a, b)} = ${s.t}.`] }, s.t);
}

/** Fill in the factors of a split ("6 × 7 = [a] × 7 + [b] × 7") from a picture, then the total. */
export function factorsFill(id, a, b, by, k, o = {}) {
  const s = split(a, b, by, k);
  const lines = by === 'rows'
    ? [`${F(a, b)} = [a] × ${b} + [b] × ${b}`]
    : [`${F(a, b)} = ${a} × [a] + ${a} × [b]`];
  const answer = { a: by === 'rows' ? s.f1[0] : s.f1[1], b: by === 'rows' ? s.f2[0] : s.f2[1] };
  if (o.total) { lines.push(`= ${s.p} + ${s.q}`, '= [t]'); answer.t = s.t; }
  const item = { id, type: 'fill', prompt: o.prompt || 'Look at the cut. Fill in the boxes.', model: o.model || arr(a, b, [by[0], k], 'parts'), lines, answer, min: 1 };
  const unit = by === 'rows' ? 'rows' : 'columns';
  const where = by === 'rows' ? ['above', 'below'] : ['left of', 'right of'];
  item.hints = o.hints || [`Count the ${unit} ${where[0]} the line.`, `Count the ${unit} ${where[1]} the line.`];
  const n = (k) => `${k} ${k === 1 ? unit.slice(0, -1) + ' is' : unit + ' are'}`;
  item.show = o.show || [`${n(answer.a)} ${where[0]} the line.`, `${n(answer.b)} ${where[1]} the line.`, `${s.eq}${o.total ? ` = ${s.p} + ${s.q} = ${s.t}` : ''}.`];
  const whole = by === 'rows' ? a : b;
  const mistakes = [];
  if (whole !== answer.a) mistakes.push({ when: { a: whole }, say: `Count only the ${unit} ${where[0]} the line. That is the first part.` });
  if (answer.a !== answer.b) mistakes.push({ when: { a: answer.b, b: answer.a }, say: `Those numbers are switched. Start with the ${unit} ${where[0]} the line.` });
  item.mistakes = dedupe([...(o.mistakes || []), ...mistakes]);
  item.yes = o.yes || `Yes! ${answer.a} + ${answer.b} = ${whole} ${unit}.`;
  return item;
}

/** One missing number in a true equation, e.g. "4 × [x] = 2 × 6 + 2 × 6". */
export function missing(id, line, answer, o = {}) {
  const item = { id, type: 'fill', prompt: o.prompt || 'What number makes it true?', lines: [line], answer };
  if (o.model) item.model = o.model;
  if (o.min !== undefined) item.min = o.min;
  return finish(item, o);
}

/** The engine's open decomposition: any valid split of a × b is right. */
export function decompose(id, a, b, pref, o = {}) {
  const s = split(a, b, pref[0], pref[1]);
  const item = { id, type: 'decompose', prompt: o.prompt || `Decompose ${F(a, b)}. Any way that works is fine.`, fact: [a, b],
    answer: { p: s.f1[0], q: s.f1[1], r: s.f2[0], s: s.f2[1], t: s.t } };
  if (o.model) item.model = o.model;
  return finish(item, { ...o, show: o.show || [`${s.eq}.`, `${s.p} + ${s.q} = ${s.t}.`] });
}

/** Multiple choice. options: [text, why | true]. `target` makes the validator check every option's value. */
export function choice(id, prompt, options, o = {}) {
  const item = { id, type: 'choice', prompt, options: options.map(([text, w]) => (w === true ? { text, correct: true } : { text, why: w })) };
  for (const k of ['target', 'model', 'models', 'pictureMatch', 'quotesMistake']) if (o[k] !== undefined) item[k] = o[k];
  return finish(item, o);
}

/** A table with answer cells ({ answer: "a × b" }). */
export function table(id, prompt, headers, rows, o = {}) {
  return finish({ id, type: 'table', prompt, headers, rows, retry: o.retry }, o);
}

function finish(item, o, total) {
  if (o.hints) item.hints = o.hints;
  if (o.mistakes && !item.mistakes) item.mistakes = o.mistakes;
  if (o.show) item.show = o.show;
  if (o.yes) item.yes = o.yes;
  else if (total !== undefined) item.yes = `Yes! ${total}.`;
  if (o.noHints) delete item.hints;
  if (item.mistakes && !item.mistakes.length) delete item.mistakes;
  if (item.retry === undefined) delete item.retry;
  return item;
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((m) => { const k = JSON.stringify(m.when); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** A test question: no hints (tests never show them), keeps Show me how for the results review. */
export const forTest = (item) => { const t = { ...item }; delete t.hints; delete t.mistakes; delete t.yes; return t; };
