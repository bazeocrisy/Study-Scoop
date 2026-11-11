# Lesson 7-1 learning journey: design, audit and evidence

Branch `feature/lesson-7-1-learning-journey`, created from production `main` at `c0b49f9`. Production, `develop` and the shared `/preview/` are unchanged. Nothing is merged without the owner's approval.

The reference workbook (four printed pages) was read for curriculum analysis only. It is not in this repository or the published build, and no wording, artwork or page layout was copied (see *Originality* below).

## 1. Initial audit (before coding)

Inspected: `data/lessons/7-1.json`, `js/lesson-player.js`, `js/partition-lab.js`, `js/lib/partition-geometry.js`, `js/lib/partition-reasoning.js`, `js/views/lesson.js`, `css/partition-lab.css`, the Chapter 7 unit and browser suites, the accessibility suites and the earlier Lesson 7-1 reports in this folder. Gabriella's Math Lab was studied for its per-question help pattern only (no assets or text copied).

| | Finding |
|---|---|
| **Reuse** | `partition-geometry.js`: planar-graph face walk, shoelace areas, circle sector check and its tests. It now checks every construction in the journey unchanged. Its cross and midpoint-triangle outlines are reused. The site's tokens, stepper, buttons, `#live` announcer, Read-to-me and in-tab-only data policy are also reused. |
| **Modify** | The lesson view and player now route Lesson 7-1 to the journey. The Chapter 7 lesson list shows 7-1's sections. The build skips one retired module. Tests and CI are updated to match. |
| **Missing** | Before this change there was no Explore comparison, no rectangle fourths/sixths/eighths construction, and no Teach → Guide → My Turn sequence per shape. Section E had no written explanation, and the error analysis had no "fix it" construction. Region counting used multiple choice, not counting. There was no unit-square overlay you could tap, and no lesson-wide report of hints vs steps vs answers. |
| **Redundant** | Two help systems sat on one page: the lab's own Hint/Show Me How buttons and its "? Help". The Learn It / Practice It / Test Me modes duplicated the lesson's own stages. |
| **Could confuse a third grader** | The core activity was behind a collapsed `<details>` and a dropdown of 13 tasks. Three mode buttons appeared above every task, and the parent summary was mixed into the child's screen. Hard-coded light colours did not follow dark mode. |
| **Must stay unchanged** | The geometry engine, Chapters 5, 6 and 7-2 to 7-7, weekly homework, reading, spelling, vocabulary, navigation and branding. Lesson 7-1's original thirteen Learn It screens, three Watch Me examples, practice and test also stay: they are kept intact and reachable as optional extra practice. So does the no-storage privacy policy. |

## 2. Interaction map

`#math?lesson=7-1` opens section A. A stepper (A–I, then ★ Grown-up Summary) is always visible. Each section shows **one card at a time** with *Card n of N*, progress dots and Back/Next; the last card links to the next section. No dropdowns, no collapsed activities.

| Section | Cards (ids) | Interaction |
|---|---|---|
| A Explore | a-same, a-equal, a-words, a-area, a-notfourths | compare three cut sandwiches; choose the equal ones (unit-square hint); words; area idea; four beds that are not fourths |
| B Learn the Method | b-fourths, b-fourths-make, b-sixths, b-sixths-make, b-eighths, b-eighths-make, b-triangles | worked examples show 4/3/3 ways (rows, columns, grids, half-then-diagonal); the child builds each in **any** valid way |
| C Work Together | c-way1, c-make1, c-way2, c-make2, c-why | plus sign: watch Way 1, build it; watch Way 2, build a **different** way (checked by comparing regions); explain why both are fourths |
| D Shape Builder | per shape: `d-*-teach` → `d-*-guide` → `d-*-myturn` | diamond 4ths, square 6ths, circle 8ths, octagon 4ths, hexagon 6ths, octagon 8ths. Teach Me steps change the diagram; Guide Me is the same shape with help; My Turn is a new shape (size/orientation/marks change), no solution shown |
| E Compare Sizes | e-explore, e-what, e-why, e-write | choose 2–8 parts and watch one part shrink; answer what happens and why; write it in own words (self/parent reviewed) |
| F Find the Mistake | f-agree, f-fix, f-write | four unequal pie pieces (cut across below the center); flip-overlay shows the gap; draw real fourths; explain to the character |
| G Count the Parts | g-regions, g-tiles, g-slant, g-triangle, g-triangle-make | "parts, not lines"; tap each region to number it, then complete "__ equal parts, or ____"; join midpoints yourself |
| H Explain Equal Area | h-grid, h-write | toggle unit squares, tap parts to reveal counts (strips 6×1 and blocks 3×2), decide, then explain |
| I Check & Reflect | i-rect, i-square, i-circle, i-sizes, i-pizza, i-star, i-kite, i-grid, i-reflect | nine new problems marked *On my own*; reflection writing |
| ★ Grown-up Summary | — | results this visit; the existing Parent Guide; links to the original stages as optional extra practice |

**Help on every question** (`? Help`, beside the card title; panel directly beneath the problem). Level 1 *Hint* → level 2 *Show steps* (each step redraws a partial diagram; steps never show a finished partition) → level 3 *Show the answer* (a construction checked by the engine, with the reason). The child's drawing, choices, counts and writing are never changed by help. Help is available on *On my own* questions too; using it is recorded and those questions then cannot count as independent.

**Recording** (this open tab only; nothing saved or sent): per question, the number of checks (an unchanged answer re-checked is not a new try), the first result, and the highest help level used before success. The outcomes are: independent (right on the first try, no help) · right after another try · after a hint · after steps · after the answer · not finished. Written answers are compared with an example and ticked off by the child or a grown-up. They are never machine-graded.

## 3. Curriculum coverage matrix

Workbook items are named by skill only. **Teach** = worked example or explanation; **Guide** = the child does it with help available; **Solo** = a fresh problem marked *Solo try* (help still available, but use is reported).

| Workbook item (skill) | Teach | Guide | Solo |
|---|---|---|---|
| Opening comparison: same-size wholes cut differently | a-same, a-equal, a-words, a-area | a-notfourths | (discussion item) |
| Rectangle in fourths, several ways | b-fourths (4 ways) | b-fourths-make (any valid way) | i-rect |
| Rectangle in sixths | b-sixths (3 ways) | b-sixths-make | d-square-myturn (square) |
| Rectangle in eighths | b-eighths (3 ways) | b-eighths-make | i-square (square into eighths) |
| Shapes have equal parts when the areas match | a-area, b-triangles | h-grid | i-halves |
| Plus-sign shape in fourths, two ways | c-way1, c-way2 | c-make1, c-make2 (must differ), c-why | (a work-together item) |
| #1 diamond fourths | d-diamond-teach | d-diamond-guide | d-diamond-myturn (corners only) |
| #2 square sixths | d-square-teach | d-square-guide | d-square-myturn (thirds/halves marks only) |
| #3 circle eighths | d-circle-teach | d-circle-guide | d-circle-myturn (edge points only); i-circle (sixths) |
| #4 octagon fourths | d-octagon4-teach | d-octagon4-guide | d-octagon4-myturn (corners only) |
| #5 hexagon sixths | d-hexagon-teach | d-hexagon-guide | d-hexagon-myturn (corners only) |
| #6 octagon eighths | d-octagon8-teach | d-octagon8-guide | d-octagon8-myturn (corners only) |
| #7 more parts → smaller parts | e-explore, e-what | e-why, e-write | i-sizes |
| #8 error analysis: four unequal pieces of a circle | f-cookie (evenly spaced parallel cuts), f-agree | f-fix, f-write | i-oval |
| #9 count equal tile regions | g-regions | g-tiles | i-tiles, i-star |
| #10 count equal triangles in a slanted shape | g-regions | g-slant | i-kite |
| #11 midpoints of a triangle's sides → fourths | g-triangle | g-triangle-make | (skill also used in i-kite) |
| #12 are different-looking parts equal? explain | h-halves (no grid), h-grid (unit squares) | h-write | i-halves (no grid) |
| Reflect | everything above | — | i-reflect (grown-up reviewed) |

Known limit: on screen, lines join marked dots, so the child never draws freehand or spaces lines by eye. The grown-up summary therefore asks for a short *Try it on paper* check on blank shapes before the workbook.

## 4. Independent reviews and how they were resolved

Each review was done by a separate agent that did not write the code. Each reviewer had the code and the reference, not the implementer's conclusions. The math and UI reviewers ran their own scripts; their logs are in the session scratchpad and are not committed.

| Role | Round 1 (`ac65246`) | Resolved in | Round 2 re-check (`fdd1b24`) | Resolved in |
|---|---|---|---|---|
| A+B Curriculum & instruction | 2 blockers: #8 misconception not matched; #12 needs a gridless item. Should-fix: dots made solo builds easier than the workbook; no solo sixths-tile count; wording; generic build feedback | `fdd1b24`: f-cookie, i-oval, h-halves, i-halves, corners-only My Turn, i-tiles, wording, shape tips | All gaps closed. New should-fix: My Turn hints named a hidden center | `21158ea` |
| F Mathematics (own area code, ≈133k enumerated + ≈1,900 accepted configurations, 13M tolerance checks) | Checker: 0 false positives, 0 false negatives. Defects: plus-sign "different way" answer showed Way 1; a sandwich hint misstated widths | `fdd1b24` | Both fixes PASS; new content verified. New: tile picture 20 units past its frame; "top corner" wording on a flat-top octagon | `21158ea` |
| C+E UI & accessibility (Playwright at 320–1366 px, keyboard, contrast) | Blocker: 320 px overflow in Shape Builder. Should-fix: phone dot size, Chromebook fold, edge lines, help not announced, double status, fake pill buttons, two primary buttons | `fdd1b24` | 11 of 13 PASS. New blocker: count cards overflowed at every width (a class-name collision) | `21158ea`; every card now tested at 5 widths |
| H Originality | No scans, artwork or PDF copies in the repo or the build. Should-review: verbatim reflect sentence; "Work Together"/"On My Own" names; item-7 setup; shape order/orientation; slanted-shape composition | `fdd1b24`: reworded, renamed ("Try It Together", "Solo try"), strips 2/3/6, orientations changed, new slanted composition | — | — |
| G Browser & regression | Run by the implementer as executed test suites; see §5 | | | |

Not changed, by decision: the order of the six Shape Builder skills and the midpoint-triangle item both follow the assignment's explicit list. The plus shape is the existing reviewed outline. These echo the workbook's structure and are listed for the owner's review under *Open questions*.

Still open (nice-to-have): arrow-key movement between dots (today each dot is a Tab stop); a mixed-shape review card; a solo rectangle-sixths check; phone dot hit areas of 33–36 px on the densest rectangles (above the 24 px AA minimum, below the 44 px goal).
