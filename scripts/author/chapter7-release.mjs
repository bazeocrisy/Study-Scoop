/** Chapter 7 teaching release (owner brief, 2026-11-12): a last, reviewable pass over Lessons 7-2 to 7-7.
 * Pure text transform, applied after the lesson transforms:
 *  - help steps and hints no longer state the number the child must type (the child counts it from the picture);
 *  - "1 wholes"-style grammar slips are fixed;
 *  - a few long prompts get plainer third-grade wording, and "continue the count from zero" (which reads as "start
 *    again") becomes "keep counting past 1";
 *  - the lesson's math words are shown on the first Learn It screen.
 * It never changes a number in a question, a picture or an answer key.
 */
const COUNT_REWRITES = [
  [/Count all (\d+) equal pieces; put \1 in the bottom box\./g, 'Count all the equal pieces, colored and plain. That number goes in the bottom box.'],
  [/Count all (\d+) equal pieces inside the whole\./g, 'Count all the equal pieces inside the whole.'],
  [/Count all (\d+) equal pieces inside the outside edge\./g, 'Count all the equal pieces inside the outside edge.'],
  [/Count (\d+) spaces from 0 to 1; put \1 in the bottom box\./g, 'Count the spaces from 0 to 1. That number goes in the bottom box.'],
  [/Count all (\d+) equal intervals from 0 to 1\./g, 'Count all the equal intervals from 0 to 1.'],
  [/All (\d+) selected parts must also be all the parts in that whole\./g, 'The selected parts must be all the parts in that whole.'],
  [/At 1 you have counted (\d+) gaps\. Keep the same gap size and continue the count after 1\./g, 'At 1 you have counted every gap in one whole. Keep the same gap size and keep counting past 1.'],
  [/Find the 0-to-1 whole unit\. It has (\d+) equal gaps; the point starts at zero\./g, 'Find the 0-to-1 whole unit and count its equal gaps. Zero is the start, not a gap.'],
  [/The first whole has (\d+) equal gaps; that unit length stays fixed\./g, 'Count the equal gaps in the first whole. That unit length stays the same all along the line.'],
  [/Use only 0 to 1 for the denominator: it contains (\d+) equal gaps\./g, 'Use only 0 to 1 for the denominator: count its equal gaps.'],
  [/Count each object once: (\d+) objects make the whole set\. That count goes on the bottom\./g, 'Count each object once, selected and plain. That count goes on the bottom.'],
];
const WORDING = [
  ['Keep the same gap size and continue the count from zero.', 'Keep the same gap size and keep counting past 1.'],
  ['Name the marked point. Use the equal intervals from 0 to 1 as the denominator.', 'What fraction is at the point? Count the equal spaces from 0 to 1 for the bottom number.'],
  ['Name the marked point using the displayed number of intervals per whole as the denominator.', 'What fraction is at the point? The bottom number is the gaps in one whole; the top is every gap from 0 to the point.'],
  ['What denominator describes a complete whole-size piece?', 'How many equal parts is each whole cut into? That number is the denominator.'],
  // Release review round 2: prompts must not state their own answer; hints must not state the value or the right option.
  ['Both equal-part wholes match. Different positions are colored, but the same number of pieces is colored. Which counts change?', 'Both wholes have the same equal pieces. Different pieces are colored. Which counts change?'],
  ['The selected objects move to the new positions shown. None are added, removed, or changed from selected to plain. Does the selected fraction change?', 'The objects move to the new places shown. Does the selected fraction change?'],
  ['Count all four selected pieces and all four pieces in the whole.', 'Count the selected pieces. Then count all the pieces in the whole.'],
  ['The first shape has every equal piece selected.', 'Check the first shape: is every equal piece selected?'],
  ['The second also has every equal piece selected.', 'Now check the second shape the same way.'],
  ['The selected objects have new positions, but the same number are selected.', 'Count the selected objects in each picture. Then count all the objects.'],
  ['This set selects more than that first object.', 'Count the selected objects. How many are there?'],
  ['Those numbers match tick counts, including the starting tick at 0. The numbered space shows what to count: gaps, not marks.', 'You counted the tick marks. Count the spaces between the ticks instead.'],
  ['Partition the unit into three equal spaces.', 'Split 0 to 1 into three equal spaces.'],
  ['Match the numbered colored-piece counts in the two pictures.', 'Count the colored pieces in each picture.'],
  ['Compare the before-and-after pictures in Watch Me; the fraction stays the same when both counts stay the same.', 'If the number selected and the number in the whole set stay the same, the fraction stays the same.'],
];
// "1 wholes" → "1 whole" (the number 1 directly before a plural counting word).
const SINGULAR = /\b1 ((?:equal |colored |selected |plain |complete |whole-size |whole-unit |half-unit |unit |crossed )?)(piece|part|space|whole|object|interval|gap|jump|strip|disk|task|tile)s\b/g;

function fixText(s, { help }) {
  let out = s;
  if (help) for (const [re, to] of COUNT_REWRITES) out = out.replace(re, to);
  for (const [a, b] of WORDING) out = out.split(a).join(b);
  out = out.replace(SINGULAR, '1 $1$2');
  // Verb agreement after the singular fix ("1 equal piece are" → "1 equal piece is").
  for (const [a, b] of [['Those 1 gap are', 'That 1 gap is'], ['1 equal interval lead ', '1 equal interval leads '], ['1 equal piece are ', '1 equal piece is '], ['1 interval lead ', '1 interval leads ']]) out = out.split(a).join(b);
  return out;
}
function walk(x, help) {
  if (Array.isArray(x)) return x.map((v) => (typeof v === 'string' ? fixText(v, { help }) : walk(v, help)));
  if (!x || typeof x !== 'object') return x;
  for (const [k, v] of Object.entries(x)) {
    if (typeof v === 'string') x[k] = fixText(v, { help: help || ['say', 'text'].includes(k) });
    else x[k] = walk(v, help || k === 'hints' || k === 'show' || k === 'teaching');
  }
  return x;
}

export function applyChapter7Release(lesson) {
  if (!/^7-[2-7]$/.test(lesson.id)) return lesson;
  const l = JSON.parse(JSON.stringify(lesson));
  // Questions children answer in the teaching and practice stages; the test keeps its own review text.
  for (const part of [l.learn, l.watch, l.together, l.try]) walk(part, false);
  walk(l.test, false);
  for (const k of ['goal', 'catchAll']) if (typeof l[k] === 'string') l[k] = fixText(l[k], { help: false });
  walk(l.parent, false);
  // Math words on the first Learn It screen (the lesson's vocabulary was in the data but never shown).
  if (l.learn?.screens?.[0] && !l.learn.screens[0].item) l.learn.screens[0].teacher = true;
  return l;
}
