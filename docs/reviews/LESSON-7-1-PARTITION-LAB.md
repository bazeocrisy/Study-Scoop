# Lesson 7-1 partition lab: owner review package

## Scope and baseline

Feature branch `feature/lesson-7-1-partition-lab`, based on `develop` commit `710fb45`. Source: the owner's four-page Lesson 7-1 PDF (printed pages 3–6), inspected as upright page images. Source extraction, scans and original exercise wording remain outside this public repository. The pasted assignment, rather than directions printed in the textbook, defines authorization.

This extension preserves the shared lesson's thirteen Learn It screens, three worked examples, six guided questions, twenty independent questions and ten-question test. It adds active construction and reasoning alongside that lesson rather than replacing Chapter 7. Chapters 5 and 6, weekly homework, vocabulary and spelling, and the separate interactive lessons remain in place. The lesson's parent note and its authoring source are updated together.

Before editing, open PRs were inspected: #31 Reading Coach exemplar, #19 Galaxy flash cards and staged image PRs #2/#3. None is included in this change. No production merge, preview branch merge or hosting-setting change is performed.

## Audit and design

See [the question-by-question curriculum matrix](LESSON-7-1-CURRICULUM.md). The baseline shared lesson teaches the prerequisite whole/area/equal-share concepts well but does not cover active diamond, square, circle, polygon, cross and midpoint-triangle constructions or complex polygon counting. The existing stand-alone drawing page has useful sketching and feedback, but an approximate raster test cannot certify exact equal areas.

The new construction contract uses marked endpoints and actual divider segments. Polygon boundaries and dividers form a planar graph; bounded faces determine region counts and shoelace areas. Concave outlines are clipped to the whole. Circle activities support radii and diameters through the center, with sector area derived from angles. Unsupported circle chords are rejected. The checker compares computed regions, not a stored stroke answer. This is a guided construction lab, not an arbitrary freehand validator.

Learn It demonstrates shape-specific cuts. Practice It permits active line construction, hints and Show Me How. Test Me removes assistance and uses transfer problems. The parent summary distinguishes first-check independent evidence, later correct completion, failed checks, hints and solution reveals. Everything new remains in tab memory; no accounts, tracking or persistent learner data are added. The existing standalone page retains its previously approved local-only storage policy.

## Review evidence

- [Curriculum and instructional review](LESSON-7-1-CURRICULUM.md)
- [Mathematical and interaction review](LESSON-7-1-MATH-REVIEW.md)
- [Rendered UI, accessibility and usability review](LESSON-7-1-USABILITY.md)

The implementation author and independent reviewers are different agents. Reviewers' proposals and executed technical checks do not establish observed student comprehension.

## Reproducible preview

From a checkout of this branch, run `npm run serve`, open the address printed by the server, then navigate to `index.html#math?lesson=7-1&stage=learn`. Expand **Partition Lab: make equal parts**. The same lab and summary are available from Lesson 7-1's Parent Guide. For the exact publishable preview, run `npm run build` and serve `_site` with a static HTTP server. No textbook scans are in that output.

A pull request targets `develop`. A branch PR does not deploy at the shared `/preview/` URL; the reproducible local preview above is the review route until an authorized preview merge/deployment occurs. Production remains subject to explicit owner approval.

## Verification results

Runtime and test implementation: **`72f7de95127fdf9f170c4476848b00ef56ce6557`**. Subsequent report-only commits do not alter the tested application. The `develop` base remained `710fb4564a3e6da55505d9e745edef906f07226f` at final verification.

| Check | Actual result |
|---|---|
| Baseline `npm test` | 321 passed, 0 failed |
| Final `npm test` | 346 passed, 0 failed |
| `npm run test:browser` | PASS, exit 0 |
| `npm run test:site` | PASS, exit 0 |
| Core browser checks | 346 repository / 348 built site, 0 failed |
| New partition-lab browser suite | 151 repository / 151 built site, 0 failed |
| Fresh allowlist build | 220 files verified; final lab and unit checks passed again |
| Independent geometry and rendered-diagram checks | PASS for the supported construction contract; see mathematical report |

Both full scripts execute the homework, weekly labs, responsive layout, Chapter 7 journeys/assessment/teaching/accessibility, learning-path, weekly-test-scope and new partition-lab suites. Detailed per-suite counts are in [the browser evidence](LESSON-7-1-BROWSER.md). The 25 added unit tests include region geometry, independent containment probes, actual SVG area/key checks and the legacy raster counterexample.

Initial work-in-progress failures were corrected and retested: mobile point targets, light/dark contrast, retry picture visibility, stale geometry/feedback, and a help-label assertion superseded by the owner's new wording. There are no unresolved failures in the executed final local suites. GitHub CI is a separate PR status; local results are not represented as a completed remote run.

Original screenshots include [triangle fourths](images/partition-lab-triangle-teaching-390.png), [partial question help with preserved student work](images/partition-lab-question-help-own-work-390.png), [explicit answer reveal](images/partition-lab-question-answer-own-work-390.png), [retry feedback](images/partition-lab-retry-390.png), and all six viewport widths in `images/partition-lab-{360,390,768,1024,1366,1920}.png`.

Verdicts: **technical checks PASS**; **independent teaching review PASS WITH LIMITS** for the reviewed paths; **observed child learning NOT VERIFIED**. The separate reviews state their authorship and scope.

## Limits and rollback

Actual child use, learning, retention, physical Chromebook/touch hardware, audible speech quality, screen-reader operation and physical printing are **NOT VERIFIED**. Browser viewport/touch emulation is described separately in the UI report. No mastery claim about a child is made.

Rollback: revert this feature's merge commit on `develop` (or close its unmerged PR); it adds no server state or learner-data migration. Keep production unchanged until owner acceptance of the concrete reviewed version.

## Additional direction: question-specific progressive help

Reviewed Gabriella's Math Lab at commit `a9421aa884e1ca7019c6da942834496a40941df7`, specifically the question-bound `?` trigger and focus restoration in `chapter-5/app.js`, and the progressive hints, visual solutions and assisted-attempt metadata in `js/coach.js` and `js/practice.js`. That repository is a behavioral reference only. No textbook assets, page overlays, illustrations, exercise text or source PDF were copied into Study Scoop.

Each of the thirteen lab tasks has an individual **? Help with this question** button. It opens an inline progression: **Hint → Show Steps → Show Answer**. Construction steps change the geometry and stop before a complete solution; the full answer requires an explicit reveal. The learner's own dividers or selected answer remain intact. The parent summary separately records hint use, visual steps and full reveals, including after resetting or revisiting a route. Test Me's `?` explains independent-work conditions without exposing instructional content.

The existing Lesson 7-1 question flow also offers question-specific `? Hint` before an attempted answer, then changing visual steps and explicit `? Show Answer`. Early help is marked assisted so a subsequent first correct check cannot earn an unassisted result. The written reflection has its own original strip demonstration and a clearly labeled sample explanation; its meaning remains human reviewed. Other lessons retain their original help behavior. Scored tests retain their no-assistance structure.

## Owner acceptance and production boundary

- Review the question-by-question matrix, original demonstrations and correction paths in this branch preview.
- Try the question-specific help progression and inspect the separate assisted and fresh independent results.
- Observe the intended learner before making any claim about comprehension or mastery; technical checks cannot supply that evidence.
- Production remains unchanged. Any production release needs explicit owner approval of its exact reviewed commit through a separate release workflow.
