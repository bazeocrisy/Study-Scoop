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

**Recording** (saved in this browser only, never sent; DECISIONS D29): per question, the number of checks (an unchanged answer re-checked is not a new try), the first result, and the highest help level used before success. The outcomes are: independent (right on the first try, no help) · right after another try · after a hint · after steps · after the answer · not finished. Written answers are compared with an example and ticked off by the child or a grown-up. They are never machine-graded.

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

Still open (nice-to-have): a mixed-shape review card; a solo rectangle-sixths check. Arrow keys and touch targets were done in round 3 (§9).

## 5. Test evidence

Commands were run in this container (Node 22, headless Chromium) on the final commit. Every suite runs on its own, so one failure cannot hide the results after it. Logs are in the session scratchpad and are not committed.

Final run on **`1454bff`** (application and tests; later commits change docs only). All exits 0.

| Suite | Repository | Built site (`_site`, allowlist build) |
|---|---|---|
| `npm test` (unit; 333 at baseline + 22 new journey tests) | 355 passed, 0 failed | n/a |
| `scripts/build-site.js` verification | n/a | approved files only, every reference resolves, data valid, no personal names |
| `browser.test.js` (all sections, navigation, accessibility, contrast, layout, print) | 347 passed, 0 failed | 349 passed, 0 failed |
| `homework-nov02` / `homework-nov09` | 220 / 220 | 220 / 220 |
| `weekly-labs` / `layout` | 80 / 79 | 80 / 79 |
| `chapter7` (Chapters 5–7 journeys) | 547 | 547 |
| `chapter7-assessment` / `-teaching` / `-teaching-access` / `-teaching-all` | 3 / 8 / 10 / 18 | 3 / 8 / 10 / 18 |
| **`partition-journey` (new)** | **715** | **715** |

Earlier runs on this branch, kept for honesty:
- **Baseline at `c0b49f9`, before any change:** 333 unit tests passed. All repository browser suites passed, including the old Partition Lab suite (151 checks).
- **Run 1 at `ac65246`:** 350 unit tests passed. `browser.test.js` failed 2 checks in both the repository and the built site: (a) at 360 px the parent-page summary table went past the edge; (b) the Chapter 7 lesson-goals list picked up the new "Extra practice" link. Because the npm scripts chain with `&&`, the later suites did not run. Both were fixed in `fdd1b24`.
- **Run 3 at `21158ea`:** 355 unit tests passed; `browser.test.js` 347/0; homework, labs and layout passed; Chapter 7 547 and assessment passed. `chapter7-teaching.browser.js` failed one check: after "Try again" on the original Practice Together stage, the picture and the answer no longer fit on screen together, because the extra headers pushed them down. Fixed in `3a0ab57` by keeping the original stages' own layout. That suite then passed alone (8 passed, 0 failed).
- **The independent reviewers' own scripts:** the counts are in §4.

What the new suites cover:
- `tests/unit/partition-journey.test.js`: every answer key, alternative constructions, fresh solo geometry, the "different way" rule, an independent rendered-diagram audit (count figures, unit grids, halves, the cookie, oval and pie areas by integral, sandwiches, garden, strips), frames, help never showing a finished answer early, record rules, the controller, writing, the summary and an originality guard.
- `tests/partition-journey.browser.js`: a complete walk through all sections with real clicks, plus wrong first tries, every listed alternative construction, an unequal partition, an unsupported circle chord, every help level with the child's drawing preserved, focus, keyboard, touch, the grown-up summary counts, and the original stages. It also checks that every card fits at 320, 360, 390, 768 and 1366 px.

## 6. Decisions and remaining limits

- **The collapsed Partition Lab is replaced, not duplicated.** The assignment ruled out collapsed sections and dropdowns. The UI (`js/partition-lab.js`, `css/partition-lab.css`) and its browser suite were removed. That suite's checks of the original stages were moved into the new suite. `js/lib/partition-reasoning.js` and its audit test are kept, because deleting a test needs the owner's approval. They are listed in `RETIRED` in `scripts/build-site.js` and are not published; the owner may delete both later.
- **Help on solo questions.** Help is available everywhere, as the assignment requires. Using it is recorded, and that question then cannot count as independent. Lesson 7-1's original scored test still has no hints.
- **Saved progress (D29, owner-approved 2026-11-11).** Lesson 7-1 progress is saved in the child's own browser under one key. It is never sent, holds no name, and is validated when read back. A grown-up can erase it with Reset (with confirmation). Every other page still stores nothing (D4). (Before D29: results lasted only while the tab was open.) The summary says so.
- **Invented names:** Rio, Jun, Noor, Kai, Mia and Leo. The owner should confirm none matches a classmate.
- **Not verified:** a real child using it, physical Chromebook or touch hardware, a real screen reader, audible speech, and printing. Technical checks cannot show that a child has learned the skill. The grown-up summary asks for a paper check, then the printed workbook with no help.

## 7. Originality

All wording, examples, characters and diagrams are new. Diagrams are inline SVG computed from coordinates; there are no images. The reference PDF is not in the repository; an md5 comparison against every tracked file found no match. The build output has no PDF-derived files. After the originality screen, these changes were made: the reflection sentence was reworded; "Work Together" and "On My Own" were renamed "Try It Together" and "Solo try"; the item-7 analogue now uses strips of 2, 3 and 6; the octagon and hexagon orientations were changed; and the slanted-shape figure is a new composition.

**Open questions for the owner** (screening only, not legal advice):
- Is following the workbook's item order acceptable? The six-shape list and the midpoint triangle come from the assignment.
- Earlier merges published homework images and a homework PDF. These are outside this change, but the screener asked whether they have a recorded permission review.

## 8. Preview, release and rollback

- **Preview:** the shared `/preview/` is built from `develop`, so it changes only when `develop` changes, and that needs the owner's approval. To see this exact branch locally, run `npm run serve`, then open `…/Study-Scoop/#math?lesson=7-1`. To see the exact publishable set, run `node scripts/build-site.js _site`, then serve `_site`.
- **Screenshots:** `docs/reviews/images/lesson-7-1-journey-*-{1366,1280,390}.png` (Chromebook and phone).
- **Release:** merge only after approval. The workflow's Lesson 7-1 steps run whichever suite each branch has.
- **Rollback:** revert the merge commit. No data or storage migration is involved.


## 9. Round 3 (owner brief of 2026-11-11): touch targets and saved progress

**Saved progress (DECISIONS D29, owner-approved Option 1).**
- `js/lib/journey-store.js` saves the journey in this browser only, under one key (`studyScoop.lesson7-1.progress`). It saves the last section and card, drawings, answers, counts, writing and checklists, help levels, and the independent/assisted records.
- Everything read back is checked: unknown cards, impossible lines, out-of-range choices and damaged JSON are dropped. If storage is blocked or full, the lesson still works.
- Opening Lesson 7-1 without a section resumes where the child stopped.
- Open tabs stay in sync through the browser's `storage` event, so a Reset in one tab is not undone by another.
- The Grown-up Summary explains what is saved and has **Reset Lesson 7-1 progress** with an on-page confirmation. Cancel is the emphasised button, and Escape closes the confirmation.
- No names are collected and nothing is sent. Every other page still stores nothing (D4); the D4 unit and browser tests now allow exactly this one key, from exactly that file.

**Choosing dots (touch targets).** Geometry is unchanged. On a 320–390 px phone, the densest drawing (rectangle eighths) has dots 30–37 px apart. Giving each dot a separate 44 px target would mean overlapping targets or a drawing wider than the screen. So the drawing itself is the control:
- **Nearest dot:** a press anywhere within 48 px of a dot chooses the nearest dot. There are no gaps and no overlaps.
- **Preview and slide:** while pressing, the dot that will be chosen is ringed and named. Sliding moves the ring, and lifting chooses it. Lifting away from every dot chooses nothing.
- **Touch:** holding still for a moment, then sliding, works in any direction. A quick swipe still scrolls the page, and any scroll cancels the press.
- **Keyboard:** the drawing is a single Tab stop. Arrow keys move between dots, and Enter or Space chooses.
- **Screen readers:** a hidden list says which lines are drawn. Clicks from assistive technology are accepted.

Measured closest-dot spacing on screen (browser suite):

| Width | 320 | 360 | 390 | 768 | 1024 | 1366 |
|---|---|---|---|---|---|---|
| Densest drawing (rectangle eighths) | 30 px | 34 px | 37 px | 57 px | 54 px | 54 px |
| Typical drawing (diamond) | 64 px | 73 px | 80 px | 123 px | 108 px | 108 px |

At every width, a press just short of halfway toward the closest neighbour (capped at 44 px) still chooses the right dot, by touch and by mouse. That is checked for every dot of both drawings: 6 widths, 2 drawings, all dots. So targets are 44 px or more from tablet width up. On phones, the densest drawings meet WCAG 2.5.8 (AA, 24 px) and rely on the equivalent controls above for the 44 px goal. An independent reviewer found that mouse clicks 16 px off-centre on the 320 px densest card picked a neighbouring dot 32 times in 192 tries. That is a recoverable near-miss (the ring shows it, and the dot can be tapped again or the line undone), but it is not a true 44 px target.

**Independent reviews in round 3** (agents that did not write the code):
- *Interaction and persistence:* 17 checks passed, including refresh mid-drawing, mid-help and mid-writing, browser reopen, exact summary match, damaged data and blocked storage, and no other page writing storage. It found two tabs overwriting each other, Reset being undone by another tab, and stale choices breaking Check. All three are fixed in `be200ee` and covered by tests.
- *Accessibility and touch:* keyboard, live messages, contrast (light and dark), reflow and the Reset flow passed. It found vertical slide-to-correct impossible on touch, preview text shifting the buttons, drawn lines not described to screen readers, and assistive-technology clicks possibly ignored. All are fixed in `be200ee`. Not verified: real phones, VoiceOver or TalkBack, Safari or Firefox.

Evidence for this round: final run on **`be200ee`**, with every suite run separately and all exits 0.
- Unit tests: 361 passed, 0 failed (6 new saved-progress tests).
- Allowlist build: verified.

| Suite | Repository | Built site |
|---|---|---|
| `browser.test.js` | 347/0 | 349/0 |
| Homework (both weeks), weekly labs, layout | 220 / 220 / 80 / 79 | the same |
| Chapter 7: journeys, assessment, teaching, teaching access, teaching (all) | 547 / 3 / 8 / 10 / 18 | the same |
| Lesson 7-1 journey (now including touch targets, keyboard, saved progress, reset and two tabs) | 1191 | 1191 |

The re-checks by both independent reviewers at `be200ee` passed every item.


## 10. Round 4 (owner brief of 2026-11-12): I Do → We Do → You Do teaching

**Plan.** Keep the geometry engine, every validated drawing and figure, help, saved progress and reset, and the report page. Restructure the content into 13 skills, each taught with I Do, then We Do, then You Do. Add plain-JavaScript teaching rules and lock the order. Replace Check & Reflect with a 10-question Final Check, and the summary with a readiness report. (DECISIONS D30.)

**Reused.** `partition-geometry.js` for every check, the existing construction tasks and figures, the We Do help panel (hint → steps → answer), saved progress (store version 2), the grown-up reset, the original extra-practice stages and the Parent Guide.

| Skill | I Do (worked example) | We Do (guided) | You Do (new, no hints) |
|---|---|---|---|
| 1 Equal parts | a-words, a-area, a-show (sandwiches, steps) | a-notfourths | a-flags |
| 2 Rectangles | b-fourths, b-sixths, b-eighths | b-fourths-make, b-triangles, b-sixths-make, b-eighths-make | b-eighths-you (new rectangle) |
| 3 Plus sign | c-way1, c-way2 | c-make1, c-why | c-make2 on a new plus sign, a different way |
| 4–9 Six shapes | d-*-teach | d-*-guide (a turned or stretched copy; the square has its own sixths figure) | d-*-myturn (corners only); then d-paper (try it on paper) |
| 10 Part sizes | e-explore, e-show | e-what, e-why | e-you, then e-write |
| 11 Not always fourths | f-show (cookie: heights, flip, fix) | f-agree, f-fix | f-oval, then f-write |
| 12 Count and name | g-show (count tiles step by step) | g-slant, g-triangle, g-triangle-make | g-you (a square cut into 8 triangles) |
| 13 Equal area | h-show (half of a half) | h-grid | h-you, then h-write |
| Final Check | — | — | q1–q10: rectangle 4ths, square 8ths, circle 8ths, turned octagon 4ths, hexagon 6ths, part sizes, a circle cut at a slant (not fourths), count and name a star's 8ths, a new plus sign into 4ths, equal area with different shapes |

**Teaching rules.**
- *Wrong number of regions:* the parts are numbered and region counting is explained.
- *Right number, unequal areas:* the bigger and smaller parts are marked, area is explained, and a shape-specific tip is given.
- *A line that misses a circle's center:* gets its own message.
- *We Do:* the second miss opens a hint, the third the visual steps.
- *You Do:* the second miss shows *Let's learn it again* (the skill's worked example, step by step), then the child retries. *Show me the answer* appears only after four misses, and the report records it.
- *Right on the first try in You Do:* "You did it on your own!", and Next opens.

**Cannot skip.** Next is disabled until the card is done: watched, right, written, or answered in the Final Check. Later sections are not links. A typed address for a locked section shows where to go. A saved position past unfinished work is pulled back.

**Final Check and report.** Ten fresh questions, one try each, no hints. The answer locks after checking. The report shows a verdict (ready, almost ready, or in progress), the score and missed skills, the You Do result for each of the 13 skills, and the question-by-question details.

Not covered by the Final Check (checked in their You Do instead, and listed as such in the report): the diamond, the 8-part octagon, the triangle midpoints and the square into sixths.

**Review rounds (Round 4).** Three independent reviews (instruction, math, accessibility/interaction) ran on each candidate; every blocking item was fixed and re-checked.
- *Instruction:* We Do figures differ from I Do and You Do; the readiness verdict needs every drawing right and no answer-shown or not-yet skill; the rectangles are taught with a We Do for each part count; a "try it on paper" card bridges to the workbook.
- *Math:* a "different way" must really differ (lines are compared after redrawing on the new figure); help steps follow the hint's method (sixths and eighths start with columns-and-rows); re-teach lines are spaced evenly; tips say "plus sign" only for fourths; position words on turned shapes are recomputed.
- *Accessibility:* focus order after every action, re-teach and demo steps announced, locked drawings shown as pictures, locked stepper items show letter + lock, the Final Check asks again if the answer changes before its one try.

**Evidence (final commit d8047fc).** Unit tests 367/367. Lesson 7-1 browser suite 1415 checks on the repository and on the built site (every card fits at 320–1366 px, dot spacing at every width, keyboard, touch, saved progress, two tabs, teaching rules, reset). Every other site suite re-run separately: see the run log below.

