# Chapter 7: Fractions — implementation and independent review

This chapter follows the owner-supplied reference's seven-lesson sequence. The reference PDF and private renders stay outside this public repository. All published explanations, exercises and SVG models are newly authored. No textbook scans, OCR or student identifiers are published.

## Scope and content

1. Partition shapes into equal parts.
2. Understand fractions as selected equal parts of a specified whole.
3. Represent fractions on number lines.
4. Represent one whole as a fraction.
5. Represent whole numbers as fractions.
6. Represent fractions greater than one on number lines.
7. Understand unit fractions as parts of sets.

Each lesson includes Learn It, three worked Watch Me examples, six guided questions, twenty independent questions and a separate ten-question practice test. Written explanations in Learn It are reflection checkpoints, not semantically graded answers. A learner compares an original response with an example and completes a self/parent review checklist. Edits invalidate comparison and review for the previous response; a fresh review is required. The chapter pack adds six vocabulary terms, twenty questions per vocabulary mode, fifty mixed practice questions, a seven-section printable study guide, a twenty-eight-question cumulative practice test, four ungraded performance tasks and twelve optional fluency questions. Cumulative coverage is four questions per lesson. These are Study Scoop study tests; no school Math test date is announced.

The newsletter's four fraction definitions remain verbatim and are labelled as teacher words. Partition and fraction tiles are labelled as review terms. The November 9 week recommends Chapter 7; earlier chapters and the separate spelling/vocabulary labs remain available. The current-week selector is not advanced by this change.

General simplification, arbitrary fraction ordering, mixed-number conversion and fraction arithmetic are outside scope. Equivalent-value answer acceptance supports fair grading, rather than introducing a separate equivalence unit.

## Implementation

- `scripts/author/chapter7-lessons.mjs` and `chapter7-resources.mjs` generate the original lesson and resource JSON.
- `data/lessons/7-1.json` through `7-7.json` own the lessons; `data/chapters/7.json` owns vocabulary, practice, guide and cumulative resources.
- `js/lib/fractions.js` validates exact rational answers and derives values from models. `fraction-models.js` renders area bars, circles, sets and number lines through the shared model interface.
- A fraction model specifies its equal subdivision count (`parts`) and selected indices, or a number-line integer tick (`point`) and whole-number maximum. Optional integer bar weights describe unequal-part nonexamples. Validators reject inconsistent geometry and keys.
- `answerPolicy: partition` requires the numerator/denominator shown by the model; prompts explicitly request those parts. `value` accepts equal rational values using integer cross multiplication. Empty, incomplete and zero-denominator answers fail. Separate labelled numerator/denominator inputs share the existing first-attempt scoring and help behavior.
- `js/lib/chapter7.js`, the activity registry/player and chapter views integrate chapter-owned resources. Selected historical weeks do not substitute earlier Math content into Chapter 7. Misses stay separate from Chapters 5 and 6 and are held only in the current tab's memory. Assistance/reveal history survives Chapter 7 restarts and retakes during that visit, separately from current-round scores and reflected in lesson parent summaries.
- `css/fractions.css` owns the new resource layout and printing. No runtime dependency, account, analytics or learner-storage service is added.

## Independent checks and release gate

Specialist agents separately reviewed curriculum/source alignment, instructional progression, fraction engine, UI, accessibility/browser behavior and mathematical QA. Reviewers re-derived keys from geometry, checked fresh scored questions against practice, checked exact teacher definitions and inspected first hints and nonexamples. Findings included repeated test geometry, missing worked conclusions, insufficiently concrete whole-number examples, screen-reader disclosure of equal/unequal conclusions and phone number-line overflow; these were routed to their respective owners for correction.

Run `npm test`, `npm run test:browser` and `npm run test:site`. The latter builds the allowlisted public output and repeats the browser checks against that output. `tests/chapter7-assessment.browser.js` verifies revision-linked writing and help history across retries. `tests/chapter7.browser.js` exercises all seven lesson routes and stages, the resource activities, fraction input policies, help/misses, responsive layouts and guide printing. Existing chapter, homework and weekly-lab regression suites remain in place.

The feature PR and its Pages push run identify the reviewed source and deployed merge commits. Both the existing regression suites and new Chapter 7 suites are required gates before preview publication. Production requires the owner's approval of the completed preview. Rollback is a revert of the chapter feature commit followed by the normal Pages build; no learner database migration exists.

## Remaining human checks

Desktop Chrome automation and generated print output do not establish usability on a physical phone, actual audio playback or a physical printer. No child has tried this chapter. These remain owner checks; they must not be described as verified.


## Verification evidence

- Full unit suite: 282 passing tests, including legacy chapter assertions and new rational/assessment regressions.
- Dedicated Chapter 7 browser suite: 547 checks passed on the repository and 547 on a fresh allowlisted build.
- Focused assessment browser suite: three complete journeys passed on repository and built output, including help/reveal → restart → parent summary and writing → checklist → review → edit → fresh review. Five focused assessment state tests also pass.
- Independent mathematical QA recomputed all eight chapter JSON files from model geometry with no answer errors. Reviewers checked semantic freshness, not just different item IDs. Both author scripts reproduce all eight JSON files byte for byte.
- UI review inspected 36 real-content states across 360, 390, 768, 1024, 1366 and 1920 pixels, plus written review/history at phone and desktop widths. Overflow and stale comparison visibility findings were fixed and rechecked.
- Allowlist build verified every reference and data validator; private reference material is excluded. Chapters 5/6 JSON, historical weeks, current-week selection, images and weekly labs have no changes from the feature base (754a2cb), except November 9's Chapter 7 recommendation/availability note.
- Private plugin release 0.3.1 was read back: all 11 files match the validated candidate. The existing illustrated-lab generator/templates/reference are byte-identical to their prior release. The plugin supplies the chapter workflow and implementation references; the website code remains in its repository.

No blocking specialist findings remain. The owner should review the deployed preview's vocabulary, one full lesson and written reflection, practice/results/misses, cumulative test and printable guide before authorizing production. Physical-device audio, physical printing, assistive technology and child usability remain NOT VERIFIED.
