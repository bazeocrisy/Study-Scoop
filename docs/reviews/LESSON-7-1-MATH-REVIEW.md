# Lesson 7-1 independent mathematical review

Reviewed against feature branch based on `710fb45` (`origin/develop`). Exact delivery commit is recorded in the PR; the review covers the files named below, not a production release.

## Authorship and scope

This reviewer did not author the new partition geometry, lab interface, or reasoning activities. The reviewer independently authored `tests/unit/partition-independent.test.js` and found mathematical defects during review. The reviewer **did** author the separate legacy sketch-checker qualification in `interactive/7-1.html` and its counterexample regression test. That legacy patch is not presented as an independent review of itself.

## Executed geometry evidence

`node --test tests/unit/partition-independent.test.js` passes. The initial executed probe set included **193 assertions** and **110,880 independently sampled containment points**. The durable test also runs on both the teaching tasks and their fresh Test Me variants.

The probes validate every declared construction and alternative; reverse endpoint direction and duplicate-segment invariance; rejection after omitting each required divider; empty and invalid endpoint input; and a correct-count but unequal-area counterexample. A separate ray-crossing containment implementation checks that each sampled point belongs to exactly one returned region inside the original polygon and none outside. Sampling supplements the finite-segment graph and shoelace-area calculations; it is not offered as a proof for all arbitrary drawings.

Independent calculations:

- Triangle total area 25,300; each midpoint triangle 6,325 (one fourth). The midpoint construction scales each small triangle's base and height by one half.
- Diamond total area 23,750; four triangles 5,937.5 each.
- Square total area 48,400; six strips or a three-column/two-row grid each have area 48,400/6.
- Regular hexagon equal central triangles follow from equal side lengths and equal center-to-side heights.
- Regular octagon central eighths have area about 4,277.996026 each; quarter regions pair these into about 8,555.992052 each.
- Cross total area 32,000; both axis and diagonal constructions return four regions of area exactly 8,000.
- Circle eighths use angles of pi/4 with radius 110, yielding area pi×110²/8 each. Center-to-edge radii and complete diameters are supported; arbitrary off-center circle chords are explicitly unsupported rather than assigned a fabricated equal-area result.

Numerical geometry uses a small relative floating-point tolerance (`1e-6` of the whole) to handle trigonometric coordinates, rather than accepting a visually approximate 6% area spread. The correctness criterion checks the region count, each area against the required share of the whole, and total coverage.

## Findings and disposition

1. **Fixed:** The first cross explanation claimed three equal little squares per quarter without a matching square grid. It now uses the valid quarter-turn congruence explanation. The second diagonal construction is explicitly demonstrated and validated.
2. **Fixed:** The triangle demonstration initially joined the first midpoint pair immediately; an explicit midpoint identification step now precedes the first divider.
3. **Fixed and independently retested:** The first diamond mosaic illustration overlapped adjacent rhombi. The first different-outline diagram called 30×60 rectangles unit squares. Actual rendered SVG tests now verify a nonoverlapping six-rhombus lattice and sixteen 30×30 unit squares.
4. **Fixed and independently retested:** Test Me recognition originally mirrored the same practice picture. It now changes mosaic six to four tiles, slanted eight to four triangles, unequal circle bands to equal quarter turns, equal mixed-outline regions to 4/4/2/6-unit regions, and share comparison 4/6/8 to 2/4/8. Construction variants use a scalene triangle, sheared polygons, and a six-sector circle transfer.

## Rendered recognition evidence

`node --test tests/unit/partition-reasoning-audit.test.js` passes **5/5** independently authored tests. These parse the actual exported SVG strings rather than checking an unrelated hand-built fixture. They verify equal rhombus areas, seven shared interior edges and ten boundary edges in the six-tile lattice, no horizontal interior overlap, eight equal-area triangles in the slanted quadrilateral, real square unit dimensions and four groups of four unit areas in the mixed-outline rectangle. Fresh Test Me keys are independently recomputed from their changed geometry. A circle-chord area integral establishes that the original four horizontal bands are unequal; perpendicular diameters establish equal quarters in the fresh test. Same-sized comparison bars have decreasing share areas in both practice and test. Test diagrams contain no teaching highlight.

## Retained legacy sketch activity

The pre-existing standalone activity rasterizes to 300×300 pixels and treats maximum/minimum estimated areas up to a 1.06 ratio as equal. An executed counterexample splits a 300×300 square at x=74,149,224. Its four actual areas are **22,200; 22,500; 22,500; 22,800**, but the old checker reports `equal: true`. This is not exact equal-area validation.

The scoped legacy patch preserves drawing behavior while visibly labeling success a **drawing estimate**, explaining that it cannot prove equal areas, linking to the precise lab, and excluding drawing estimates from the report's first-try/independent equal-area mastery claim. `tests/unit/partition-legacy.test.js` preserves this exact executable counterexample and the qualification contract. Existing standalone tests plus that regression passed 5/5 when run together.

## Verdict boundaries

New polygon/circle construction mathematics: **PASS for the tested supported contract**. Rendered recognition mathematics: **PASS** on the independently tested SVG diagrams and fresh variants. Assistance accounting source inspection confirms history remains keyed by task/mode across resets and navigation; practice reveals remain recorded, tests hide assistance controls, a wrong first test check prevents independent credit, and later correct work is completion on retry. Browser execution evidence is supplied in the separate browser/usability reports. This report does not certify unrestricted freehand drawing, every possible arbitrary polygon, student comprehension, a real Chromebook, screen-reader output, or long-term retention. Browser evidence and the separate usability/curriculum reports cover their stated scopes. Actual child learning remains **NOT VERIFIED**.
