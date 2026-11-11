# Lesson 7-1 curriculum and instruction review

Reviewer: independent review agent; no implementation authorship. Baseline: `710fb45` (`develop`, 2026-11-11). The owner-uploaded four-page source was visually inspected upright. Its text layer is unreliable on even pages. No source scans, OCR, original exercise text or publisher illustrations are included here.

## Source-to-site baseline alignment

Status evaluates the required skill, including its geometric representation; denominator coverage alone is insufficient. “Full” describes content coverage, not proof of child learning. The shared lesson is `data/lessons/7-1.json`; the separate drawing page is `interactive/7-1.html`.

| Source question | Required skill (curriculum description) | Shared lesson baseline | Separate drawing page baseline | Material correction |
|---|---|---|---|---|
| 1 | Construct fourths in a diamond | Missing: only strip/circle models | Partial: `OWN[0]` constructs rectangle fourths | Teach and construct diamond fourths |
| 2 | Construct sixths in a square | Partial: strip sixths and verbal construction | Partial: `OWN[1]` constructs triangle sixths; `teach-grid` demonstrates square sixths | Independent square-sixths construction, with strips and grids accepted |
| 3 | Construct eighths in a circle | Partial: equal circle recognition, not construction | Partial: `OWN[2]` constructs square eighths; `teach-lines` demonstrates circle eighths | Independent circle-eighths construction |
| 4 | Construct fourths in an octagon | Missing | Partial: `OWN[3]` supports octagon-fourths drawing; generic circle/square teaching | Shape-specific steps and equal-area reason |
| 5 | Construct sixths in a hexagon | Missing | Partial: `OWN[4]` has hexagon-sixths task and solution; generic teaching | Shape-specific steps and equal-area reason |
| 6 | Construct eighths in an octagon | Missing | Partial: `OWN[5]` has octagon-eighths task; generic teaching | Shape-specific steps and equal-area reason |
| 7 | For a fixed whole, relate greater equal-part count to smaller individual area | Full: `try.t17`, `try.t18`, Watch Me subdivision | Full: slider and `own-7` comparison | Preserve; include fresh lab practice and assessment |
| 8 | Explain why a circle's four unequal bands are not fourths | Partial: unequal-strip nonexamples teach the rule, not curved bands | Full: `own-8` circle comparison, typed explanation and reason choice | Include original unequal-circle example and explain smaller caps versus middle bands |
| 9 | Count/name six equal rhombi in a compound mosaic | Missing: no compound polygons | Partial: `SENT[0]` substitutes six triangle sectors of a regular hexagon | Teach piece boundaries and count original compound rhombi |
| 10 | Count/name eight triangular regions in a slanted quadrilateral | Missing: no slanted polygon | Partial: `SENT[1]` uses a square with eight triangles | Teach/assess slanted quadrilateral; distinguish pieces from lines |
| 11 | Recognize four midpoint triangles, including the inverted central piece | Missing | Missing: `SENT[2]` substitutes a parallelogram grid | Full midpoint construction, visual area justification and independent repetition |
| 12 | Explain equal area for four rectangle pieces with different outlines | Missing: parent guide explicitly defers different-outline comparison | Full: `own-12` unit-square overlay and reason choice | Bring original unit-area comparison into shared lesson lab; preserve honest written review |

Additional source work-together objective (printed page 4): construct **two different fourths partitions of a cross**. Missing in shared lesson; the separate page's corresponding practice substitutes a square (`together`). Cross axes and diagonal constructions both divide a symmetric five-square cross into four equal-area regions. Both need concrete demonstrations; merely using a familiar square does not cover a concave outline.

## What already works

The shared lesson establishes whole, part, partition and area before naming equal shares. Its thirteen Learn It screens, three changing-picture Watch Me examples, six Practice Together items, twenty independent items and ten test items provide a substantial prerequisite sequence. Equal/unequal strip comparisons, all-part counting, denominator names, same-whole subdivision and specific visible correction paths should be retained. The written reflection is explicitly self/parent reviewed. Shared lesson history separates earlier assistance from current-round results. Chapter 7's guide/practice/test resources preserve these general concepts but do not supply the missing active polygon constructions.

The separate drawing page offers actual line creation, undo/clear/check, region feedback, unit-square comparison and a grown-up report. Its raster checker flood-fills the actual drawing rather than matching stored strokes. However, `analyze()` uses a 300×300 raster, discards tiny regions and accepts a largest/smallest area ratio up to 1.06. Those approximations are not an exact equal-area proof. Its generic central-line advice must not be generalized to arbitrary polygons. It also lacks distinct Learn/Practice/Test construction modes; help history is not a replacement for a fresh independent test.

## Required instructional sequence for the extension

1. Show one whole and explain that partition means divide; equal means the same area.
2. Show the shape-specific construction one step at a time, changing the picture with each step.
3. Explain *why* those particular cuts make equal areas. For a triangle, identify all three side midpoints before connecting them. Include the inverted center triangle in the count and in the equality explanation.
4. Let the learner select endpoints to create lines and check the resulting regions. Practice feedback distinguishes no cut, wrong count, and unequal areas. A supported alternative must be judged by region geometry.
5. Present independent problems without hints or solution captions. Separate failed first attempts, assisted completion, revealed solutions and later unassisted completion in the parent report.
6. Teach complex-piece counting, curved nonexamples, same-whole comparison and different-shaped equal areas before their assessment. Written reasoning remains human reviewed.

## Final extension review

The independent reviewer inspected the new thirteen-task lab source and executed a Chromium walkthrough of **all 64 Learn It steps**, all eight advertised construction solutions, an empty-construction rejection for each construction, every answer option in the five reasoning Practice It items (13 paths), and every answer option in the five fresh reasoning Test Me items (13 paths). DOM activation was used for this independent semantic walk; the separate browser suite exercises pointer/keyboard/touch emulation. Textual results were captured privately in `work/curriculum-walk.json` and `work/curriculum-test-walk.json`. The 390 px rendered area-comparison screen and the delivered 390 px construction screenshot were visually inspected. This is an adult review, not an observed child session.

| Source requirement | Added lab evidence | Content coverage after correction |
|---|---|---|
| Questions 1–6 | `diamond-fourths`, `square-sixths`, `circle-eighths`, `octagon-fourths`, `hexagon-sixths`, `octagon-eighths`: changing-picture instructions and active endpoint constructions | Fully covered |
| Question 7 | `more-parts`: fixed-size bars, one-share comparison, Practice It and fresh 2/4/8 test | Fully covered |
| Question 8 | `circle-error`: unequal circle bands versus genuinely equal quarter-turn test figure | Fully covered |
| Question 9 | `rhombi-name`: original six-tile diamond lattice; fresh four-tile test | Fully covered |
| Question 10 | `slanted-name`: eight equal-area triangles in a parallelogram; fresh four-region test | Fully covered |
| Question 11 and required triangle demonstration | `triangle-fourths`: whole, separate midpoint-identification step, three connections, all four regions visibly labeled 1/4; independent active construction | Fully covered |
| Question 12 | `different-outline`: 30×30 unit-square grid, four-square areas with different outlines; fresh unequal-area comparison | Fully covered |
| Cross in two ways and alternative constructions | `cross-fourths` axes and inside-corner diagonal demonstration; `square-sixths` strips and 3×2 grid | Fully covered |

### Independent findings and corrections

- **Fixed:** the first cross explanation claimed an incorrect number of small squares. It now uses quarter-turn matching; both supported cross constructions independently produce areas 8000 each.
- **Fixed:** initial mosaic coordinates overlapped adjacent diamonds. Corrected tiles use a nonoverlapping oblique lattice; six congruent rhombi fill the whole.
- **Fixed:** the initial “unit squares” were 30×60 rectangles. The grid now uses 30×30 squares. Each original piece covers four squares; fresh test pieces cover 4, 4, 2 and 6 squares.
- **Fixed:** triangle teaching originally joined a line immediately. It now first shows all three midpoints without cuts, and labels each finished small triangle 1/4.
- **Fixed:** original reasoning tests merely mirrored the practice diagrams and could credit recalled solutions. New test versions change counts, partition boundaries or equality, and suppress practice highlighting.
- **Fixed:** original parent wording promised a separate retry result without displaying one. The report now explicitly distinguishes first-check independent tests, retry completion, hints, reveals and demonstrations.

### Verdicts and limits

**Curriculum coverage: PASS** for the supplied question types and the additional requested triangle/cross skills. **Independent teaching review: PASS WITH LIMITS** for the reviewed new lab paths: the child sees a construction before practice, correct feedback explains visible equal-area evidence, and wrong reasoning options identify the relevant count/area mistake. The existing shared prerequisite lesson and written reflection remain available. Open written reasoning remains self/parent reviewed; choice success is not mathematical explanation grading.

**Technical correctness:** refer to executed unit, independent geometry and browser evidence in the delivery report; this semantic review does not replace those tests. The independent walkthrough checked advertised solutions and empty constructions, not every possible endpoint combination. Browser checks run on emulated layouts, not physical Chromebooks or phones. Accessibility API, actual speech output and screen-reader comprehension are not certified by this review.

**Observed child comprehension, retention and physical-device usability: NOT VERIFIED.** An owner/child walkthrough remains the acceptance evidence for independent learning. Neither content coverage nor successful interactions establishes student mastery.
