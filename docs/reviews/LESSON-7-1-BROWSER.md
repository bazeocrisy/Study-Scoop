# Lesson 7-1 browser verification

This report is authored by the browser-test implementer, independently of the lab UI and geometry authors. Automated and adult browser checks do not establish observed child comprehension, real Chromebook hardware behavior, actual speech output, physical printing, or assistive-technology certification.

## Executed coverage

`tests/partition-lab.browser.js` exercises real browser pointer interactions for all eight construction activities and their fresh transfer tests, a second correct square/parallelogram construction, incomplete constructions, all five reasoning activities, changing demonstration pictures, independent-versus-assisted records, hints/reveals retained across reset and navigation, keyboard activation, actual CDP touch input, minimum 44px alternative point controls, and absence of teaching assistance from the shared scored lesson test.

The suite also checks that changing a construction clears prior checked regions and revising a reasoning answer clears stale success feedback. The new suite runs in `test:browser`, `test:site`, pull-request built-site checks, and both preview and released-production workflow paths.

Screenshots are original site output under `docs/reviews/images/partition-lab-*.png`: six viewport widths (360, 390, 768, 1024, 1366, 1920), the completed triangle teaching diagram with four labeled quarters, and an actual correction. Touch is browser emulation, not a physical-device test.

## Findings and dispositions

- Early 360px SVG endpoints were too small: fixed by large native construction-point controls.
- Early disabled-button and opt-in dark-palette teaching text failed the existing contrast audit: explicit readable colors applied.
- A newly inserted closed lab above the shared guided practice prevented the original picture and answer input from both fitting after Try again: lab entry restricted to Learn It and Parent Guide; existing real-phone regression now passes.
- A reflected copy was insufficiently fresh for independent assessment: construction transfer tasks now change proportions or requested count; teaching/practice assistance remains separately visible.
- Prior result geometry and checked reasoning feedback could become stale after changes: cleared on task/drawing/answer revision, with regression checks.

## Commands and results

The environment uses Chromium with a local `--no-sandbox` wrapper selected through `CHROME_PATH`; the application adds no dependencies or browser flags.

- Baseline `npm test`: 321 passed, 0 failed.
- Updated `npm test`: 346 passed, 0 failed (before the subsequent progressive-help refinement).
- `node tests/chapter7-teaching.browser.js`: 8 passed, 0 failed after the layout correction, on both repository and a freshly allowlist-built site.
- Partition Lab suite: 73 passed on repository and freshly built site before progressive-help refinement; final refinement results are recorded in the delivery audit.
- Full `npm run test:browser` and `npm run test:site` were executed; final command outcomes and any remaining limitations are recorded in the delivery audit.

The initial full run intentionally captured work-in-progress contrast failures; it was superseded by final verification after fixes. No failed check is counted as a pass.
