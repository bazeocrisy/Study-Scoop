// Times Tables > Pick My Facts (pure, no DOM): the facts a child picked, and how each answer is checked.

/** Every fact for the picked numbers: 4 → 4 × 1 … 4 × max, in order. */
export function factDeck(picked, max = 10) {
  const out = [];
  for (const a of [...picked].sort((x, y) => x - y)) for (let b = 1; b <= max; b++) out.push({ a, b });
  return out;
}

export function shuffled(list, rand = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** A round: up to `size` different facts, shuffled. */
export const roundOf = (picked, max, size = 10, rand = Math.random) => shuffled(factDeck(picked, max), rand).slice(0, size);

/**
 * Find the Fact: the child sees the answer and fills in x × y.
 * 'right'  — x × y makes the answer and uses a picked fact (either order: 6 × 4 counts for the 4s);
 * 'other'  — x × y makes the answer but uses no picked fact (3 × 8 = 24 when only the 4s are picked);
 * 'wrong'  — x × y does not make the answer.
 */
export function checkFind(x, y, answer, picked, max = 10) {
  if (x * y !== answer) return 'wrong';
  const ok = (f, g) => picked.has(f) && g >= 1 && g <= max;
  return ok(x, y) || ok(y, x) ? 'right' : 'other';
}
