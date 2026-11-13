# Study Scoop — Independent Production Forensic Audit
**Date:** November 13, 2026  
**Production commit:** `90652460f73764338bf9af5d702a247118f0cd4a`  
**Release PR:** https://github.com/bazeocrisy/Study-Scoop/pull/54

## Verdict
**Conditional / outstanding issues.** The latest production workflow finished successfully, but a successful automated deployment does not certify every displayed sentence, image, accessibility path or child learning outcome. Do not represent this report as a complete visual browser crawl.

## What was independently checked in this audit
- GitHub production commit, production workflow, and repository source tree: **474 tracked files**.
- Read and screened **43 JSON content files and 40,069 string values**: 20 math lesson files (Chapters 5, 6 and 7), five weekly data files, three homework files, four weekly assessment files, three mathematics practice banks, and eight reading passages. This screening used targeted spelling, repeated-word, singular/plural, British English and known-typo patterns. A screen of these categories is not equivalent to manual proofreading every sentence.
- Reviewed the repository's prior text-audit and Chapter 7 curriculum/UX findings against the current release.
- Read relevant active and legacy lesson view source and checked progress-saving copy.
- The public website's static HTML was fetched. The application is rendered dynamically in JavaScript, and there was no interactive browser run or fresh screenshot crawl in this independent audit. Historical images and earlier author's browser test reports are not fresh evidence of every rendered production screen.

## Independent new or reconfirmed findings

| Severity | Where | Evidence / Problem | Suggested fix |
|---|---|---|---|
| Medium | `data/lessons/6-1.json`, line 1136 | “The rows have 3, 1 and 1 squares.” is awkward and can imply a plural noun for a single square in each smaller row. | “The first row has 3 squares. The next two rows each have 1 square. The total area is 5 square units.” Verify the pictured grid. |
| Medium | `js/views/partition-journey.js`, line 476 | Parent-facing Lesson 7-1 note says “Other Study Scoop pages are not saved.” This is factually obsolete: Chapter 7 Lessons 7-2–7-7 now save progress. | Say “Other Chapter 7 lessons also save progress in this browser. Other activities may not.” Confirm real route visibility and scope. |
| Low / latent | `js/views/lesson.js`, line 815 | Legacy parent report contains “Lessons 7-2 to 7-7 are not saved.” This conflicts with current skill-journey persistence if the legacy branch remains reachable. | Remove or update obsolete copy; route-test before classifying as user-visible. |
| High accessibility / assessment | Chapter 7 number-line interaction | Prior reviewer identifies number-line accessible descriptions disclosing counts relevant to the answer. New production audit did not retest with an actual screen reader. | Do not expose answer-bearing counts in assessment alternative text; offer an accessible exploration interface. Test with a screen reader and verify equivalent assessment difficulty. |
| Medium visual | `images/homework/2026-11-09-clean-greater-than-one.webp` | Previously identified collision of numerals and fraction labels. The image asset persists in production; fresh visual inspection not performed. | Re-letter with distinct baseline and spacing, inspect at print and mobile sizes; compare numerical meaning with source. |
| Medium content | teacher-source vocabulary (`distracted`, `trustworthy`, `irritating`) | Source definitions are inaccurate or part-of-speech mismatched. The site preserves teacher transcription and adds child-facing notes, so the wrong source is still present as a citation to the handout. | Make accurate child-facing meaning highly prominent while clearly labeling the original teacher wording. Do not silently alter source materials. |
| Medium visual | `images/words/fortunate.webp` and nine previously flagged word cards | Prior reviewer found an unclear illustration and cut-off text; assets remain included in repository. Full current rendered image audit was not performed. | Replace and re-inspect generated art and displayed cards. |
| Medium asset publication | `images/words/formed.webp`, `inform.webp`, `misinform.webp`, `uninformed.webp`, `extract.webp` | Published assets violate the user's image requirements according to prior independent review; reportedly unused by the current pages. | Remove unused assets from publish allowlist or replace them; check for references. |
| Low UX | 320px layout and Example Again | Historical review: card title lies below first screen on narrow phones; example replay differs between 7-1 and the other six lessons. | Address when doing targeted UX cleanup, not with another wholesale redesign. |

## Checks that did not surface additional matches
- All seven Chapter 7 JSON lessons: 23,349 text values screened; no hits for the targeted patterns.
- Seven Chapter 5 lessons: 3,968 values; no hits.
- Six Chapter 6 lessons: 3,893 values; one awkward text match in 6-1.
- Five weekly files plus three homework files: 1,945 values; only a reference to the historical “VOCAPULARY” typo in an internal metadata note, not a live headline.
- Four test files plus three practice banks: 6,112 values; no targeted hits.
- Eight reading files: 802 values; no targeted hits.

## Independent verification limits
- No fresh execution of live JavaScript app, full state-space navigation, screen-reader pass, tactile device test, or screenshot-by-screenshot proofreading of every published image.
- No claim of mathematically recalculating every Chapter 5–7 answer in this pass. Prior reports record extensive checks, but this audit did not reproduce them.
- No child-learning observation or assessment of whether the instruction transfers to a printed workbook.

## Recommended remediation sequence
1. Fix verified 6-1 text and contradictory progress-saving language. Verify both displayed and fallback routes.
2. Make source-vocabulary corrections conspicuous in student learning, while preserving original transcriptions.
3. Fix the number-line accessible-answer leak before claiming equivalent accessibility.
4. Correct worksheet lettering and problematic images and audit the final rendered pixels.
5. Execute a *new* automated production-route crawl and manual visual inspection at 320, 390, 768, 1024, 1366 px, testing every lesson skill, error state, hint, final check, parent report, newsletter, spelling/vocabulary lab, reading page, weekly homework, printable and image; record screen IDs and evidence. No production change without approval.

## Source references
- Production release: https://github.com/bazeocrisy/Study-Scoop/pull/54
- Text audit: https://github.com/bazeocrisy/Study-Scoop/blob/main/docs/reviews/TEXT-AUDIT-2026-11-12.md
- Chapter 7 instruction review: https://github.com/bazeocrisy/Study-Scoop/blob/main/docs/reviews/CHAPTER-7-TEACHING.md
- Chapter 6-1 grammar finding: https://github.com/bazeocrisy/Study-Scoop/blob/main/data/lessons/6-1.json#L1136
- Lesson 7-1 stale parent statement: https://github.com/bazeocrisy/Study-Scoop/blob/main/js/views/partition-journey.js#L476
- Legacy lesson parent statement: https://github.com/bazeocrisy/Study-Scoop/blob/main/js/views/lesson.js#L815
