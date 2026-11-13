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
// Text audit (2026-11-12): plainer, child-sized wording for templated feedback. Applied to every string.
const AUDIT = [
  [/A zero denominator cannot name the equal parts in this whole\. Count the visible equal parts for a positive bottom number\./g, "The bottom number can't be 0. Count the equal parts in one whole."],
  [/A denominator of zero cannot describe equal parts of a whole\. Find one complete whole in the picture; it contains a positive number of counting parts\./g, "The bottom number can't be 0. Find one whole in the picture and count its parts."],
  [/A whole must contain a positive number of parts\. This complete whole contains one part\./g, "The bottom number can't be 0. Look at one whole and count its parts."],
  [/That fraction names the same amount, but this question asks for the shown partition\. The picture has (\d+) equal parts in one whole; keep that count on the bottom\./g, 'That fraction is the same amount, but use the parts in the picture. One whole has $1 equal parts, so keep $1 on the bottom.'],
  [/That fraction has the same value, but this question asks for the displayed partition\. Keep (\d+) on the bottom to describe the parts in ONE shown whole; count those displayed parts for the top\./g, 'That fraction is the same amount, but use the parts in the picture. Keep $1 on the bottom: that is how many parts are in one whole.'],
  [/You or a grown-up will compare your response; this is not a computer grade for mathematical meaning\./g, 'Check your answer with the example or a grown-up. The computer does not grade it.'],
  [/Ask a grown-up to compare your reason with the example; the computer does not judge your mathematical explanation\./g, 'Check your reason with the example or a grown-up. The computer does not grade it.'],
  [/Compare your explanation with the example, with a grown-up if helpful\. The computer does not judge the mathematical meaning of your writing\./g, 'Check your answer with the example or a grown-up. The computer does not grade it.'],
  [/Compare your explanation with the example or a grown-up; the computer does not judge its mathematical meaning\./g, 'Check your answer with the example or a grown-up. The computer does not grade it.'],
  [/One of four equal pieces is 1\/4\. Three pieces are still missing from the selected part\./g, 'One of four equal pieces is 1/4. Three pieces are not selected.'],
  [/That bottom count is smaller than the given selected count\. A whole cannot have fewer parts than the full whole shown selected; count every part once\./g, "The bottom can't be smaller than the top here. Every part is selected, so count every part once for the bottom."],
  [/A fraction can count whole-size pieces too\. The highlighted whole is one part of itself, so its denominator can be 1\./g, 'A fraction can count whole pieces too. Each whole is not cut, so it is 1 part: the bottom is 1.'],
  [/Use the highlighted reference to decide what the question counts\. Write a whole-number count, not a fraction or a list\./g, 'Look at the highlighted part to see what to count. Type one number, not a fraction.'],
  [/For the bottom, inspect one outline: it contains one complete part\./g, 'For the bottom, look at one outline: it is one whole part.'],
  [/Being a set does not decide whether a fraction is a unit fraction\. Inspect how many objects are selected on top\./g, 'Count the selected objects. A unit fraction has 1 on top.'],
  [/\binspect\b/g, 'look at'], [/\bInspect\b/g, 'Look at'],
  [/Start at zero\. The first gap ends at the highlighted point; zero itself is not a jump\./g, 'Start at zero. The first gap ends at the first tick after zero. Zero itself is not a jump.'],
  [/Those counts include boundary ticks\. Count the highlighted gap, not its two endpoints; use gaps both within one unit and along the trip\./g, 'You counted ticks. Count the gaps between the ticks, for both numbers.'],
  [/The denominator describes the whole collection of (\d+) objects\. Selection divides it into a chosen part and a plain part but removes neither from the whole\./g, 'The bottom counts all $1 objects in the set. Some are selected and some are plain, but all of them are still in the whole set.'],
  [/Moving changes positions, not membership: /g, 'Moving objects does not add or take away any objects: '],
  [/Only the 1 crossed spaces? count on top; the whole-unit count belongs on the bottom\./g, 'Only the 1 space crossed counts on top. The spaces from 0 to 1 go on the bottom.'],
  [/Only the (\d+) crossed spaces count on top; the whole-unit count belongs on the bottom\./g, 'Only the $1 spaces crossed count on top. The spaces from 0 to 1 go on the bottom.'],
  [/The numerator measures how many equal intervals lead from 0 to the point\. /g, 'The top number counts the equal gaps from 0 to the point. '],
  [/(?:That 1 gap is|Those 1 gaps are) numbered; boundary ticks mark their edges\./g, 'That 1 gap is numbered. The ticks mark its two ends.'],
  [/Those ([2-9]|\d\d) gaps are numbered; boundary ticks mark their edges\./g, 'Those $1 gaps are numbered. The ticks mark where each gap starts and ends.'],
  [/Write any fraction that equals one whole; your denominator may differ from the picture’s partition\./g, 'Write any fraction that equals one whole. Your bottom number does not have to match the picture.'],
  [/Other positive matching counts, such as 2\/2, also name a complete whole\./g, 'Other fractions with the same top and bottom, such as 2/2, also name one whole.'],
  [/To equal one whole, the top and bottom must be equal positive counts\./g, 'To equal one whole, the top and bottom numbers must be the same (and not 0).'],
  [/The new point crosses one more gap; the whole unit is not repartitioned\./g, 'The new point crosses one more gap. The gaps in one whole stay the same.'],
  [/A denominator change would need a new partition of the unit\. The gaps here keep the same size; only the point moves\./g, 'The bottom number would change only if the gaps changed size. Here the gaps stay the same; only the point moves.'],
  [/Each neighboring pair of these (\d+) equal pieces is joined\. What happens\?/g, 'These $1 equal pieces are joined in pairs, side by side. What happens?'],
  [/The first two highlighted pieces become one larger piece with the same covered area\./g, 'The first two pieces join into one bigger piece. It covers the same space as both pieces together.'],
  [/Identify one whole before checking the two counts\./g, 'Find one whole first. Then check both numbers.'],
  [/Both unit lengths have the same number of gaps\. Count that fixed unit separately from the longer trip\./g, 'Both lines have the same number of gaps from 0 to 1. Count those gaps for the bottom and the whole trip for the top.'],
];
// "1 wholes" → "1 whole" (the number 1 directly before a plural counting word).
const SINGULAR = /\b1 ((?:equal |colored |selected |plain |complete |whole-size |whole-unit |half-unit |unit |crossed )?)(piece|part|space|whole|object|interval|gap|jump|strip|disk|task|tile)s\b/g;

function fixText(s, { help }) {
  let out = s;
  if (help) for (const [re, to] of COUNT_REWRITES) out = out.replace(re, to);
  for (const [a, b] of WORDING) out = out.split(a).join(b);
  for (const [re, to] of AUDIT) out = out.replace(re, to);
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
  if (lesson.id === '7-1') { const l = JSON.parse(JSON.stringify(lesson)); walk(l, false); return l; }
  if (!/^7-[2-7]$/.test(lesson.id)) return lesson;
  const l = JSON.parse(JSON.stringify(lesson));
  // Questions children answer in the teaching and practice stages; the test keeps its own review text.
  for (const part of [l.learn, l.watch, l.together, l.try, l.journey]) if (part) walk(part, false);
  walk(l.test, false);
  for (const k of ['goal', 'catchAll']) if (typeof l[k] === 'string') l[k] = fixText(l[k], { help: false });
  walk(l.parent, false);
  // Math words on the first Learn It screen (the lesson's vocabulary was in the data but never shown).
  if (l.learn?.screens?.[0] && !l.learn.screens[0].item) l.learn.screens[0].teacher = true;
  const first = l.journey?.sections?.[0]?.cards?.[0];
  if (first?.kind === 'screen' && !first.item) first.teacher = true;
  return l;
}
