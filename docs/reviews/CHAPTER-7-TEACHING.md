# Chapter 7 Teaching Release: curriculum and implementation matrix

Owner brief "Chapter 7 Teaching Release" (2026-11-12). Branch `feature/chapter-7-teacher`, built on the Lesson 7-1 preview
branch (`feature/lesson-7-1-learning-journey`, pull request 50). Production (`main`) is untouched.

## 1. What already exists (inspected before changing anything)

Lessons 7-2 to 7-7 already run on the shared lesson engine (`js/lesson-player.js`, `js/views/lesson.js`), built from the
generator `scripts/author/chapter7-lessons.mjs` and the transforms `chapter7-teaching-234.mjs` and `chapter7-teaching-567.mjs`.
Each lesson has:

| Engine stage | Role | Size | Already good |
|---|---|---|---|
| Learn It | I Do: explanation | 10–12 screens with changing pictures | Original pictures; the goal is shown; a short check after the key idea |
| Watch Me | I Do: worked examples | 3 examples, 3–6 steps, plus a "why" check | Pictures change at each step |
| Practice Together | We Do | 6 items | Every item has misconception feedback with a corrective picture (`teaching.wrong`) |
| Try It Yourself | You Do | 20 items, pass 16 | Help only after a try; first-try results are kept apart from later ones |
| Test | Assess | 10 items, pass 8 | No hints; scored on submission |
| Parent Guide | Grown-up | text, plus a "this visit" summary | Counts of help, reveals and restarts |

Independent audits (curriculum/maths and instruction, both read-only) found that all **237 answer keys are correct**:
each was recomputed from its picture and run through the real `check()`. The defects are in the sequence, the guidance and
the test design, not in the maths.

## 2. Curriculum matrix

| Lesson | Objective | Taught well | Too abstract or wordy | Feedback gaps | Independent practice and test gaps |
|---|---|---|---|---|---|
| 7-2 Understand Fractions | Name selected equal parts (numerator, denominator) of a strip or disk | Whole → bottom count → top count; worked examples W1–W3 | "Match the numbered colored-piece counts" (t20, x9); "How do the top and bottom counts connect…" | Typing the denominator as the numerator gets "too many" (t8, t9, x6) | Hints state the count to type; test x8 = g5 again; never asks "are these parts equal?" |
| 7-3 Number line 0–1 | Name a point by counting equal intervals from 0 | Spaces, not ticks (L5, W2) | "Use the equal intervals from 0 to 1 as the denominator" | Good (tick counting is diagnosed) | 6 of 10 test items are "which method" choices whose right answer can be spotted by wording; x2 reuses the I Do picture |
| 7-4 One whole as a fraction | n/n = 1 for strips, disks, lines | W2 (2/2, 4/4, 8/8 cover one disk) | t19 "6/? equals 1 … How many equal parts must one whole contain?" | Feedback and hints give the number away | Test x1, x2, x4, x7, x8 print the needed number in the question; x5 = t5 |
| 7-5 Whole numbers as fractions | n/1 counts whole pieces | The "each piece is a whole" idea | "What denominator describes a complete whole-size piece?" | Reversed 1/n is diagnosed | Test x6/x10 repeat each other; x8 = t16; denominator always 1 is trivial; 6/1 = 6 never asked |
| 7-6 Greater than 1 on a line | Keep counting equal intervals past 1; compare with 1 | Continuous count (L4, L5) | "displayed number of intervals per whole as the denominator"; "continue the count from zero" reads as "start again" | Restarting after 1 is not named in number items | Test x5 compares with 2, never practised |
| 7-7 Fraction of a set | The whole is the whole set | Plain objects still count | g6, t11 wording | Counting only plain objects is diagnosed | Uses 5, 10 and 12 objects (grade 3 uses 2, 3, 4, 6, 8); x3 "is it a unit fraction?" never practised |

Across all six lessons, from the code:
- **Teaching can be skipped.** Every stage is a link, and `stage=test` opens directly.
- **Revealed answers can count as passing.** After the test, every answer is shown, and "Take the test again" repeats the same 10 items and says "You passed!".
- **Vocabulary data is never shown.** The data exists (`teacher`, `glossary`), but no Learn screen displays it.
- **Practice Together works exactly like Try It Yourself.** Help appears only after a wrong answer, so there is no guided "we" step.
- **The Parent Guide shows counts only.** There is no readiness verdict and no step to the workbook.

## 3. Implementation plan (reuse first)

**Shared engine changes (one change serves all six lessons):**

| # | Change | Reuses |
|---|---|---|
| E1 | Teaching first: Try It Yourself opens after Learn It, Watch Me and Practice Together; the Test after Try It Yourself. Locked stages say what to finish first | 7-1 locked-part page and stepper |
| E2 | Stage names carry the phase: Learn It and Watch Me (I Do), Practice Together (We Do), Try It Yourself (You Do), Test (Check) | 7-1 phase badges |
| E3 | Math words: the lesson's vocabulary appears on the first Learn It screen | existing `teacher` data and view |
| E4 | We Do is guided: Help can be opened before the first try, one step at a time. You Do keeps help until after a try and says so | existing help steps |
| E5 | Honest results: a test retake after the answers were shown is practice, never "You passed!"; the report uses the first test | 7-1 one-try rule |
| E6 | Readiness report on the Parent Guide: verdict from the first test, You Do on own versus with help, what to practise, workbook step | 7-1 readiness report |

**Content changes (in the generators, then regenerated and re-verified):**

| # | Change |
|---|---|
| C1 | Hints and help steps no longer state the number to type ("Count the spaces from 0 to 1. That number goes in the bottom box.") |
| C2 | Grammar ("1 equal pieces", "1 wholes", "1 selected objects", "1 spaces") |
| C3 | Tests: replace near-copies of taught items; more "name the point" items in 7-3; no printed answers in 7-4; varied 7-5 test with 6/1 = 6; 7-6 x5 practised; a practised unit-fraction question in 7-7. (7-7 keeps its sets of 5, 10 and 12: the source lesson uses them, so the workbook will too.) |
| C4 | Plainer wording for the prompts quoted above; 7-6 "keep counting past 1" |
| C5 | 7-2: one practice and one test item on equal versus unequal parts |

**Deliberately not done** (to avoid tripling the lesson): no new 13-skill journey for each lesson. The 7-1 journey remains
the model for a construction lesson; 7-2 to 7-7 are counting and naming lessons, which already have the I Do, We Do,
You Do and Check stages.

## 4. Decisions that need the owner

1. **Saved progress for 7-2 to 7-7.** DECISIONS D29 allows saved progress for Lesson 7-1 only, so 7-2 to 7-7 still forget progress on refresh. With E1, a refresh means the child repeats the teaching stages before the practice opens again. Extending D29 (one local key per lesson, no names, a grown-up reset) is recommended, but it is not built without approval.
2. **"All learning activities are unlocked"** (CLAUDE.md, Product). E1 locks practice behind teaching in Chapter 7, as the owner asked for 7-1. Please confirm this applies to all of Chapter 7.

## 5. Independent reviews (Phase 4) and what changed

Five separate reviewers examined commit 0bcc26b: curriculum, instruction, mathematics, UX/accessibility and QA. Each used their own scripts or browser runs. Fixes are in the next commit.

| Finding | Reviewer(s) | Severity | Resolution |
|---|---|---|---|
| 7-1 You Do choice cards never showed the Quick fix, but the report said "after a quick fix" | QA | Blocking | Fixed: the quick fix is set on every copy of the card; regression test |
| 7-6 "Greater than" was never the right answer, so always picking "Less than" passed | Curriculum, Maths | Blocking | Fixed: 4 "greater", 2 "less" and 2 "equal" answers across practice and test |
| 7-6 We Do g1 (denominator) opened with a numerator hint | Instruction | Blocking | Fixed: the denominator and numerator questions have their own steps |
| Prompts stating their own answer (7-2 t20/x9, 7-5 "each whole is one piece", 7-7 "none are added") | All three content reviewers | Important | Reworded |
| Hints stating the value or the right option (7-4 t8, sameWhole, 7-7 rearrange, setUnit) | Curriculum, Maths | Important | Reworded to "count ..." prompts |
| 7-1 "a different way" help could teach the way already drawn | Maths | Important | Fixed: help shows the other way |
| 7-1 "A line must go all the way across" after a full line | Instruction | Important | "Add another line. It must go all the way across." |
| 7-5 never converted n/1 back to a whole number; 7-2 never asked "are these equal parts?" | Curriculum | Important | Added 1 You Do and 1 test item each |
| 7-1 center dot not reachable by arrow keys (octagons) | UX/a11y | Important | Home jumps to the center (and the guide says so) |
| Focus left off screen after "ready to try again" or a Final Check answer; We Do hint not read out | UX/a11y | Important | Focus is always scrolled into view; the hint text is announced |
| "How to draw lines" pushed Check far down the first drawing card | UX/a11y | Important | The guide is now under the Check button row |
| A tick under the number-line point was hidden by the dot | UX/a11y | Important | The tick shows above and below the dot |
| Three counters in the 7-1 header; "Part A of I" | Instruction, UX | Minor | "Part A (1 of 9)"; skill shown by name only |
| Grammar ("1 equal piece are", "Those 1 gap are", "labelled"), "Try again" before any try, Final Check "Not quite"/"Not yet", locked step font, phone stepper labels, duplicate report line, 7-7 screen pointing ahead to Watch Me, abstract 7-3 tick feedback | Several | Minor | Fixed |

**Not fixed in this release** (listed for the owner):
- **Repeated right-answer wording.** Several choice templates keep the same right-answer wording across practice and the test, so a child could match words (Curriculum 2). This needs new item designs per template.
- **No "given fraction → picture" items** in 7-2, 7-3 or 7-6. The workbook may ask, for example, "Which line shows 3/4?" (Curriculum 7). This needs a picture-option question type.
- **Screen readers hear the answer.** A number-line description tells a screen-reader user where the point is (for example "on tick 1"), which gives the answer (a11y I1). A fair alternative needs a step-through control.
- **Some test pictures match taught pictures with small denominators** (2–4 parts). Exact copies and same-prompt copies were removed (checked by script).
- **Close dots on small phones.** At 320 px, dot centres on the densest 7-1 shapes are 27–31 px apart. Nearest-dot selection with a press-and-slide preview makes each tap unambiguous, but the spacing is below the 44 px project bar.
- **No readiness report after a refresh in 7-2 to 7-7.** These lessons are not saved, so a refresh re-locks practice and clears the report (Decision 1 below).
