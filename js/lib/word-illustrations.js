// Shared validation for reviewed word-atlas entries used by the native study cards.
export function isWordIllustration(p) {
  return p && typeof p.alt === 'string' && p.alt.trim() &&
    typeof p.src === 'string' && /^images\/words\/[a-z0-9-]+\.webp$/.test(p.src) &&
    [p.columns, p.rows, p.index].every(Number.isInteger) && p.columns > 0 && p.rows > 0 &&
    p.index >= 0 && p.index < p.columns * p.rows;
}
