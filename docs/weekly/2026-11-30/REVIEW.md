# November 30–December 4 weekly review

## Source-to-site crosswalk

Source: two owner-supplied newsletter screenshots, visually inspected in two passes (transcription and meaning/date review). Browser chrome was cropped; teacher lettering and artwork were not reconstructed.

| Source | Site destination | Verified content |
|---|---|---|
| Front spelling list | Spelling, illustrated spelling lab | report, support, important, passport, carport, export, airport, reporter, portal, seaport, porter, portable, in source order |
| Back purple-outlined cards | Vocabulary, illustrated vocabulary lab, Tests | demolition, projects, precious, assigned, mosaics, retains, in row-major source order |
| Front quiz box | Dated week | Dec 3 division review, 10 questions; Dec 4 vocabulary quiz; Dec 4 port spelling test |
| Front learning box | Dated week and newsletter | Equivalent Fractions; Elements of Poetry, Point of View, Character Traits; Narrative; port; Dialogue; American Indians |
| Front announcements | Dates to know | Dec 4 Holiday Extravaganza, 6–8 PM; Dec 7 Wesley Woods field trip; Dec 9 habitat project due |
| Front homework | Homework reminders | Packet sent Monday/due Friday; reading log every Monday; three spelling activities. No physical packet or reading log received for this week. |
| Both pages | Original newsletter | Privacy-reviewed page-only WebP crops; phone/browser controls removed |

Definitions are preserved exactly in data/2026-11-30.json and source-transcription.json. The school does not specify vocabulary question count or format. The authored six-question vocabulary practice is explicitly Study Scoop practice. There is no assigned reading title or comprehension assessment in these pages, so no novel test was inferred.

## Source discrepancies and visual proof

Visible NEWSLETTER, SPELLING WORDS, WHAT WE’RE LEARNING, QUIZZES AND TESTS, ANNOUNCEMENTS, HOMEWORK, VOCABULARY, point of VIEW, poetry and Butterfly Method headings were read from final page crops. All word-list letters, definitions and dates match the source. November 30 is Monday, December 3 Thursday and December 4 Friday in 2026. The butterfly example is arithmetically correct: 4×7=28, 3×6=18, hence 4/6>3/7.

| Teacher wording | Clarification kept separate |
|---|---|
| demolition — “to tear down and destroy” | Demolition names the act of tearing down or destroying something. |
| precious — “something that is important or valuable” | Precious describes how important or valuable something is. |
| assigned — “a task given to you for someone to complete” | Assigned means gave someone a task to do. |
| retains — “something that you have and keep it” | Retains means keeps or continues to have. |

No teacher-origin words were silently corrected. Poetry and point of view remain reading topics, separate from the six outlined vocabulary quiz words. The source poetry wording is a simplified classroom description; it does not establish that a poem’s speaker is always its author.

## Image inventory and review

All 18 word illustrations are new. The per-word source, syllable split, exact asset path and accessible meaning are recorded in lab-images.json. Generated with the built-in image tool: one 3×6 scene sheet, then targeted carport badge removal. The sheet’s rectangular scenes were extracted and padded into square WebPs without stretching. The generator embeds final image bytes into both complete HTML downloads and registers the same images for native cards.

Every final image was inspected individually for meaning, mapping, clipping, visible text, privacy, and people. Every depicted person, including small family-photo figures, is Black. Object-only scenes are used for passport, carport, export, airport, portal, seaport, demolition and mosaics. No word labels are embedded. A vehicle badge in the first carport was rejected and removed; the final carport was reinspected and passes. Final 18/18 image review passes.

Image scene order: report presentation; supporting an injured friend; helmet safety; passport; roofed carport; exported crates; airport; reporter interview; garden portal; seaport; luggage porter; portable radio; demolition; model-building projects; precious family photograph; assigned plant-watering task; tile mosaic; retaining a teddy bear.

## Teaching and interaction checks

- Reused the existing labs and native activities, preserving sound controls, learning, flash cards, spelling practice/test, matching, multiple choice, fill-in and true/false.
- Pictures appear in learning and on revealed flash cards, never in test prompts or their accessible picture labels.
- Independent interaction reviewer ran VM checks against these specific labs: recycled misses never regain first-attempt credit; typed markup is escaped; matching errors remain counted; exact dated relative return links work by inspection.
- Six-word native vocabulary activities generate 12 distinct questions using the engine’s existing two-forms-per-word contract; tests now honor that documented small-list limit rather than demanding invented extra words. Standalone vocabulary quizzes cover six words each. Spelling practice remains 20 native questions and a 12-word test.
- New labs fix inherited red/purple helper-text contrast; missing speech support is disclosed and audio-dependent spelling modes are disabled. Matching exposes selection and disables completed pairs.
- Fixed an inherited vocabulary-menu message that incorrectly claimed supplied purple quiz words were missing.
- Suppressed the division quiz’s misleading links into a fractions test. Other weeks retain their existing links.

## Curriculum and delivery limits

Chapter 7 remains available for general fractions review, with a visible note that equivalent fractions and unlike-denominator comparison are not yet taught there. No Math chapter was changed. The school division quiz is listed, but a supplementary division review quiz has not been built; the notice directs families to class materials. The Monday packet remains missing.

The current-week selector remains November 16 because the requested week begins November 30. The new week is accessible by its dated link and week picker.

Independent curriculum, instructional-design, UI, interaction, accessibility and QA reviews were completed. Reported material issues were corrected and rechecked. These are adult/AI reviews, not observed-child usability evidence. Actual voice quality and screen-reader behavior require device checks.

## Technical and rendered verification

- Unit suite: 357/357 passed after adding regression checks for the division card, vocabulary message and optional scope fields.
- Proofreading: 0 Study Scoop findings.
- Allowlist build: passed.
- Illustrated lab browser suite: 228 checks passed, including the new 12/6-word week, every word/image mapping, image decoding, sound API calls, picture-free test prompts, quizzes, keyboard flash cards, results and dated return links.
- Independent UI reviewer inspected 24 screenshots: both lab menus and first learning cards at 360, 390, 768, 1024, 1366 and 1920 px. No overflow or clipped controls; no browser errors.
- Print review: eight CDP PDF samples inspected. These are interactive HTML downloads, not print-ready worksheets. Default browser printing omits CSS background illustrations and makes some text faint; background printing is clearer but ink-heavy. Vocabulary Learn can put its Next button on a second page; no instructional text was clipped.
- Full repository and built-site browser suites and GitHub deployment: status is recorded on the pull request; do not infer a live release from this local report.

Inherited nonblocking limitations: activity-screen focus/headings, standalone unfinished-activity leave confirmation, and duplicate “Vocabulary” lab heading. Production publication requires owner approval.

## Rollback

Revert this weekly change through a PR to develop. Do not modify main, prior weekly datasets, chapter resources or deployment settings. The last production state is unaffected by this preview-only release.
