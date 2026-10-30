# Validation evidence — November 2–6 preview

## Performed checks

- Unit suite: 211 passed, 0 failed (`npm test`). Includes source-format validation, own-answer checking across generated practice, six-distinct-word sampling across 100 seeds, all four answer positions represented, invalid sampling-bank rejection, legal suffix transformations, and reuse of Area vocabulary only with matching teacher definitions.
- Allowlist build: PASS. No raw photos, documentation, test code, private content or unrelated development files are published. All runtime references resolve.
- Targeted browser journeys: 60 checks PASS against repository; 57 PASS against the allowlisted built site (`CHROME_PATH=... node tests/nov02.browser.js [--site _site]`). Completed the six-question vocabulary test with one deliberate miss and confirmed review, the 12-question Area vocabulary test with one deliberate miss and confirmed Chapter 6 review, an explicitly selected Chapter 5 test while viewing the Chapter 6 week with all misses staying in Chapter 5, and all ten spelling dictation questions and results. No hints or word pictures in dictation tests; no script, HTTP or missing-file errors.
- Responsive sweep: 96 captures = 16 weekly routes × 360/390/768/1024/1366/1920 px. No horizontal overflow, broken images, missing values, duplicate h1, script exceptions or HTTP failures. Routes: overview, spelling menu/Learn/Missing Letters/Listen, vocabulary menu/Learn/choice/true-false/fill, Tests catalog/spelling/vocabulary/Area vocabulary, Homework and Newsletter.
- Visual QA: independent reviewer inspected the original 90 captures at all six widths plus full-size phone details. Found and closed the Area vocabulary unavailable-card defect, rechecked corrected Tests at 360/768/1920 and approved preview. Final root-help wording changed from a wrapping '-pt' to 'last two letters are p and t'.
- Image QA: every one of the ten new spelling illustrations and twelve reused vocabulary images opened and reviewed individually. No missing images, answer labels in new art, private information or age-inappropriate content. Separate curriculum reviewer also opened all ten new spelling images and approved them.
- Privacy QA: both page-only source images reviewed, surrounding household background removed, no student/teacher/school identifiers or contacts visible.
- Full repository and built-site regression suites: executed separately by independent QA; the final PR review summary and CI checks record final status/counts. A full suite is not treated as passed solely because targeted checks passed.
- `git diff --check`: PASS.

## Review outcomes

Curriculum: approved for preview after fixes. Instruction: corrected empty missing-letter item and made Distracted explicit class-sheet recall. Interaction: validated sampling and requested option randomization and bounds checks, all implemented. Accessibility: static markup review plus real-browser existing regression checks; warning now appears on direct study-card entry. UI: approved after actual screenshots. QA: unit/build/browser evidence reported separately.

## Limitations and source questions

Teacher confirmation remains needed for Distracted's printed definition; Social Studies is truncated after American; no physical homework packet was supplied; Chapter 7 lessons are not built. These source/content gaps are displayed or recorded and are not hidden as successful work. No physical-device listening or assistive-screen-reader session was conducted; speech behavior is tested with the existing browser harness, and actual voice quality is device-dependent.

## Publishing boundary

This work targets develop/preview only. main is never updated by this feature. Current remains Oct 26 until an authorized date-appropriate rollover. Use #week?week=2026-11-02 for the upcoming preview. Owner approval of a specific production PR is required before publishing the new week to production.
