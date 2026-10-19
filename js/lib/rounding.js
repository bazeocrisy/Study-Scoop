// Rounding the way the class does it on paper (DECISIONS D22): underline the digit in the place you round to,
// draw an arrow to the digit on its right, 5 or more goes up and 4 or less stays the same, then zeros to the right.

export const PLACE = { 10: 'tens', 100: 'hundreds', 1000: 'thousands' };
export const NEXT_PLACE = { 10: 'hundreds', 100: 'thousands' };
/** Which digit from the right holds that place ("the tens place is the second digit from the right"). */
export const FROM_RIGHT = { 10: 'second', 100: 'third' };

/** The worked parts of rounding n to the nearest `to` (10 or 100). `place` counts digits from the left. */
export function roundParts(n, to) {
  const digits = String(n);
  const place = digits.length - String(to).length;
  const d = Number(digits[place]), next = Number(digits[place + 1]);
  const up = next >= 5;
  const answer = up ? (Math.floor(n / to) + 1) * to : Math.floor(n / to) * to;
  return { digits, place, d, next, up, answer, carry: up && d === 9 };
}
