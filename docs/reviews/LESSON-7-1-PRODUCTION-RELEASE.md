# Lesson 7-1 production release

The owner explicitly requested production release after reviewing the deployed lesson. This release starts at production `b8c85813b5136d6910998c32b3c3761b80891888` and ports the reviewed Lesson 7-1 work from preview `a0bac575dd404fada01cc46e4da495d5293aef0f`.

## Deliberately scoped release

The release adds the integrated Partition Lab, original geometry/reasoning activities, progressive question-specific help, independent/assisted reporting, parent-note source, tests, and audit evidence. Existing production navigation and weekly content are preserved.

The pending home learning-path redesign, compact navigation, weekly-test scope changes, standalone Interactive Chapter 7 pages, Reading Coach exemplar and Galaxy Flash Cards are excluded. Production did not contain the standalone sketch page; its preview-only qualification patch and legacy-page test are therefore excluded. No new standalone textbook-style pages are introduced by this release.

The new lab, geometry, reasoning and stylesheet match the reviewed preview. Shared lesson files apply only the lab/progressive-help delta to production's existing lesson engine. Package scripts and both built-site CI paths add the new suite without importing preview-only test/navigation dependencies.

The earlier curriculum, mathematical and usability reports describe the reviewed preview and its legacy page where noted. They are historical evidence; this production release scope supersedes their deployment-status prose. Actual child learning, physical-device, audible speech and screen-reader use remain unverified.

## Validation and release evidence

Release-specific unit, focused source/built-site browser, full CI and deployment results are recorded in the production pull request. Production release is complete only after the Pages workflow succeeds and the live runtime files are checked against this branch.

Rollback: revert this production release merge on `main`, which republishes the previous production build. Preview remains independently built from `develop`.
