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
