# Lesson 7-1 browser verification

This report is authored by the browser-test implementer, independently of the lab UI and geometry authors. Automated and adult browser checks do not establish observed child comprehension, real Chromebook hardware behavior, actual speech output, physical printing, or assistive-technology certification.

## Executed coverage

`tests/partition-lab.browser.js` exercises real browser pointer interactions for all eight construction activities and their fresh transfer tests, a second correct square/parallelogram construction, incomplete constructions, all five reasoning activities, changing demonstration pictures, independent-versus-assisted records, hints/reveals retained across reset and navigation, keyboard activation, actual CDP touch input, minimum 44px alternative point controls, and absence of teaching assistance from the shared scored lesson test.

The suite also checks that changing a construction clears prior checked regions and revising a reasoning answer clears stale success feedback. The new suite runs in `test:browser`, `test:site`, pull-request built-site checks, and both preview and released-production workflow paths.

Screenshots are original site output under `docs/reviews/images/partition-lab-*.png`: six viewport widths (360, 390, 768, 1024, 1366, 1920), the completed triangle teaching diagram with four labeled quarters, an actual correction, and the individual question’s Hint, Show Steps, and explicit Show Answer at 390px. Touch is browser emulation, not a physical-device test.

## Findings and dispositions

- Early 360px SVG endpoints were too small: fixed by large native construction-point controls.
- Early disabled-button and opt-in dark-palette teaching text failed the existing contrast audit: explicit readable colors applied.
- A newly inserted closed lab above the shared guided practice prevented the original picture and answer input from both fitting after Try again: lab entry restricted to Learn It and Parent Guide; existing real-phone regression now passes.
- A reflected copy was insufficiently fresh for independent assessment: construction transfer tasks now change proportions or requested count; teaching/practice assistance remains separately visible.
- Prior result geometry and checked reasoning feedback could become stale after changes: cleared on task/drawing/answer revision, with regression checks.

## Commands and results

The complete regression runs freeze runtime implementation and tests at commit `72f7de9`. The square endpoint captions already use child-facing descriptions in that commit. A final fresh allowlist build, all 151 new browser checks, and 346 unit tests passed again with unchanged runtime bytes. Later commits update reports only.

The environment uses Chromium with a local `--no-sandbox` wrapper selected through `CHROME_PATH`; the application adds no dependencies or browser flags.

- Baseline `npm test`: 321 passed, 0 failed.
- Updated `npm test`: 346 passed, 0 failed, including the progressive-help refinement.
- `node tests/chapter7-teaching.browser.js`: 8 passed, 0 failed after the layout correction, on both repository and a freshly allowlist-built site.
- Partition Lab suite: 151 passed on repository and freshly built site, including all 13 progressive help paths, preserved work, separate hint/steps/reveal records, shared early-hint assistance accounting, parent summary counts, and all three written-reflection help levels without grading mathematical meaning.
- Frozen core `node tests/browser.test.js`: 346 passed, 0 failed on the repository; 348 passed, 0 failed on the allowlist-built site. This includes Chapters 5/6, weekly activities, keyboard/labels/touch-target checks, light/dark contrast, six responsive widths, print emulation, and end-to-end test/miss journeys.
- Full `npm run test:browser`: **PASS, exit 0**.
- Full `npm run test:site`: **PASS, exit 0**.
- Both complete scripts additionally pass: November 2 homework (220), November 9 homework (220), weekly illustrated labs (80), shared layout (74), Chapter 7 journeys (548), focused assessment (3), pilot teaching (8), pilot accessibility (10), all-chapter teaching (18), learning paths (82), weekly-test scope (47), and Partition Lab (151). The all-chapter suite renders 413 items across 2,518 delivered answer paths and 1,192 blank/invalid checks; these are automated behavior probes, not comprehension measurements.

The initial full run intentionally captured work-in-progress contrast failures; it was superseded by final verification after fixes. No failed check is counted as a pass. An older unit assertion for the literal “Next step” label was updated narrowly to “? Show Steps” to match the owner-requested help labels; its retry and original-picture assertions remain.
