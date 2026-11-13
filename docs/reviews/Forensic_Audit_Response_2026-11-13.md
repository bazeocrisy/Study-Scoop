# Response to the Production Forensic Audit (2026-11-13)

Branch: `feature/forensic-audit-fixes` (from the audit commit e81a248 on develop).
Scope: every finding in `Study_Scoop_Production_Forensic_Audit_2026-11-13.md` was checked independently, then four further independent passes were run on the live-equivalent site: a rendered-screen visual crawl (3,843 screens at 320, 390, 768, 1024 and 1366 px, plus print), a rendered-text grammar crawl (381 routes, about 6,300 lines including aria-labels and alt text), a content-accuracy audit (about 850 questions recomputed, homework, assessments and parent reports) and an independent code review of the corrections. No redesign and no new features.

## Audit findings

| # | Finding | Verified? | Action |
|---|---|---|---|
| 1 | 6-1 "The rows have 3, 1 and 1 squares." | The picture (`XXX / X.. / X..`) does have rows of 3, 1, 1; the sentence was accurate but terse. | Reworded: "The top row has 3 squares. The next two rows have 1 square each." |
| 2 | Lesson 7-1 note "Other Study Scoop pages are not saved." | Confirmed (7-2 to 7-7 save since D31; the game also keeps scores). | Corrected, naming both. |
| 3 | `lesson.js` "Lessons 7-2 to 7-7 are not saved." | Confirmed, unreachable code. | Removed the dead `readinessReport`. |
| 4 | Number-line accessible description gives the answer | Confirmed: it stated the units' part count and the point's interval. | Ticks are listed one by one; the child counts. Unit test guards it. |
| 5 | Worksheet "Greater Than 1": labels collide | Confirmed ("¹3/3", "6²/3"), plus a stray double dash. | Whole numbers 0, 1, 2 moved to their own row above the line (glyphs from the same page); dash removed; everything outside rows 375–474 is pixel-identical; answers unchanged. |
| 6 | Teacher definitions (Distracted, Trustworthy, Irritating) | Confirmed: the everyday meaning was only a grey "Parent note", and quiz feedback read that note to the child. | Teacher's words kept and labelled; an "In other words" meaning added; feedback uses it. |
| 7 | fortunate.webp; nine cut-off word cards | Confirmed: amazing, asking, crashing, lifting, opening, rushing, stepping, thinking, winking had their printed word cut at the bottom edge. | Label band cropped (the page prints the word); fortunate.webp withheld so the clover drawing shows. |
| 8 | formed, inform, misinform, uninformed, extract (.webp) | Partly: the words are used, but the 2026-11-09 illustration always replaces these files, so they were never shown. | Withheld from publishing (kept in the repository); the build fails if they are published. |
| 9 | 320 px title position; "Example again" | Both confirmed. | "Example again" in 7-2 to 7-7 is now recorded and reported like 7-1 ("After watching the example again", not on own). The 320 px layout is **not changed** (see below). |

## Further defects found and fixed

- **High, live in production:** on the 7-2 to 7-7 grown-up reports the "Erase all progress?" confirmation (an alert) was always visible; the hide rule only matched Lesson 7-1. Fixed, and the browser suite now checks it is hidden until Reset (the check fails without the fix).
- Weekly vocabulary tests: a parent note inside a child's question; two questions with a second defensible answer.
- Lesson 7-5 and Chapter 7 feedback that stated the answer while still counting as "on own"; Chapter 7 vocabulary questions with no blank; fill-in clues that named the word.
- Parent and child text: contradictory saving statements, an out-of-date newsletter line, contradictory homework messages, adult wording on children's results screens, plurals, double periods, button names in test instructions.
- Layout: Lesson 5-6 Parent Guide overflow at 320 px; game title covered at 320 px; low-contrast lab buttons and an ISO date; a duplicated element id in rounding activities.
- Screen-reader picture descriptions: number agreement, plain words ("size 1", not "relative units" or "unit", which means one whole here).

No answer key anywhere was wrong.

## Unresolved (for the Product Owner)

Layout or design changes, outside "no redesign":
1. Phones at 320 px: the menu and lesson header fill the first screen, so a card's title starts below it.
2. Newsletter flyer pages are cut off inside a 560 px scroll box with no visible scroll cue.
3. Lesson 7-1's test screen uses the older layout, not the Final Check layout of 7-2 to 7-7.
4. Chapter 7 part map wraps at phone widths with a stray connector; homework problem frame has no padding at 320 px; breadcrumb repeats the heading.
5. Print: the Chapter 7 guide is 23 pages and prints the self-check answers; Chapter 6 guide's light grid and tints fade in black and white.
6. Five names for the grown-up page; "Unit 5" / "Topic 7" next to "Chapter" (tests pin "Unit 5 goals", which may be the class's own name).
7. Spelling Help shows non-words as a step ("runn", "danc"); a long four-way spelling-rule question; some adult phrasing in Chapter 7 feedback; repeated sentences on fraction word cards.
8. The readiness verdict "Ready" can appear when every You Do needed help steps (same rule as Lesson 7-1; a rule change needs approval).
9. "Parent note" still appears (labelled) on the vocabulary study card under the new "In other words" box.
10. Picture crops: some wide pictures lose a little at the sides in the square card frame (existing behaviour, now slightly more for four of the nine cropped cards).

Owner decisions to confirm:
- The Multiplication Mastery 8 game shows a child's name and photos (approved, D28) and keeps scores in `localStorage`; CLAUDE.md lists only Chapter 7 progress as approved persistent data.
- Teacher-original wording kept as is ("improper fraction" in the homework, event names in the flyers).

Not covered by any pass: real printers, Safari/Firefox, real touch devices, and every lesson played to the end through the UI (reports were also checked from code and unit tests).

## Evidence

- Unit tests and the proofreading gate: pass.
- Browser suites (13) on the repository and on the built site: see the pull request.
- Rollback: revert the merge commit on develop (preview) or main (production); no data migration is involved. Saved Chapter 7 progress gains one optional field (`relearn`), which older code ignores.
