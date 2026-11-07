# Assignment 008: Chapter 6 instructional mastery corrections

Branch `feature/ch6-instructional-mastery` (base `develop`). Not merged. Production is unchanged.

**Backlog note.** The SS-FCIA-001 audit files were not available to the developer (only the Chapter 6 textbook PDF was), so original finding IDs could not be kept. The assignment's own eight priorities (P1–P8) and the six independent reviews were used as the backlog.

## Priority matrix

| # | Priority | Result |
|---|---|---|
| P1 | Real-browser walk of every Chapter 6 lesson stage | 1,800 cards at 360/390/768/1024/1366/1920 px, 0 overflow, clipping or script errors |
| P2 | Lesson 6-4 compare splits, find the mistake | Try It items use two students' splits (omitted, double counted, wrong part), choose-all valid splits, built from the shape engine |
| P3 | Lesson 6-6 worked real-world sequence | Seven-step Example D, composite room, comparison, changing-dimension and error-analysis items |
| P4 | Explain My Thinking | One written checkpoint per lesson in Learn It (ungraded, compared with a model sentence, never scored) |
| P5 | Repeated test questions | Test items that repeated practice replaced with different pictures or reasoning |
| P6 | Visual check of every model | Independent Python recompute of 152 pictures and 165 checks plus the browser sweep (label-overlap check added) |
| P7 | Practice Test vs textbook Unit Review | Three items replaced to cover missing side lengths and composite rooms |
| P8 | Nov 3 vocabulary prep vs Practice Test | Kept separate; teacher definitions unchanged |

## Review-driven corrections (this round)

- Keyboard focus returns to the written answer after Check, Help and step buttons (`js/lesson-player.js`).
- Written-answer panel: five rows, larger on phones, block layout, neutral (not green) styling, no duplicate "Choose all that are right".
- Pictures come before the question and answer boxes on phones.
- Multiple-choice answer positions rebalanced (first-position share 75% → 43%; unit test guards the spread). Items whose options are positional (Figure A/B, "They are the same", "Both/Only") keep their order.
- Teach before test: new Learn It screens "Gaps and left-out parts" and "Missing side, then area" (6-4) and "Not the whole box" (6-6); harder Try It items moved later.
- 6-6 t20 uses a 9 by 5 garden so width and length cannot be confused.

## Tests

`npm test` 196 pass. `node tests/browser.test.js` 292 pass. `verify_math.py` 165 checks and 25 hand-derived facts pass. Built-site browser run: see PR.

## Open for the Product Owner

- Lesson 6-5 refers to Chapter 5 strategies. Keep as a prerequisite reminder, or remove to keep chapters fully separate?
- Preview needs the production-build fix (PR #17) merged before `develop` can publish.

## Rollback

Revert the merge commit of the Chapter 6 PR. Only `data/lessons/6-*.json`, `data/tests/2026-10-26.json`, `js/lesson-player.js`, `js/views/lesson.js`, `css/style.css` and tests change.
