# November 2–6 homework release

## Scope and source crosswalk

This release starts from production `452c702984573e02484b6e6a81810ddcbcdf646d`. PR #23 merged receipt metadata into develop; PR #24 is an open, conflicting develop-to-main proposal with 55 changed files. This release does not merge that proposal or any other develop changes.

| Received assignment | Private source | Public equivalent |
| --- | --- | --- |
| Identifying Fractions, p. 61 | IMG_3011.jpeg | Eight original whole/set fraction questions, interactive triangle halves and rectangle eighths partitions |
| Recognizing the Parts / Write the Fraction, p. 63 | IMG_3012.jpeg | Six original set questions and twelve number-word fractions |
| My Favorite Author fluency | IMG_3013.jpeg | Three parent-assisted class-passage reading attempts, WRR and errors; separate optional original passage |
| My Favorite Author comprehension | IMG_3014.jpeg | Two complete-sentence responses preserving the classroom tasks; sentence structure checks and parent meaning review |

The actual first comprehension task concerns the author's reading spot, rather than the student's own reading spot. The public prompts preserve that requirement. The passage, photographs, publisher artwork and scans are not uploaded to this public repository. The original photos remain in the owner's private files.

## Behavior

Homework opens with separate Math and Reading cards and a direct entry for each assignment. New packet activities show one problem at a time, with Previous and Next, while printing includes all questions and entered answers. Answers and records live in memory for the current visit only. Nothing is submitted to the teacher.

The existing packet engine, question checker, incremental Help, read-aloud controls, back navigation and allowlist build are reused. Fraction metadata is validated against its key; independent tests also decode number words and count generated diagram parts. Incorrect answers explain the role of numerator and denominator, including switched numbers. Help is offered after an attempt.

The drawing tools construct equal partitions from a selected triangle line or equal rectangle rows and columns. They support the teacher's drawing skills; the class drawing still belongs on the class paper. Fluency records are explicitly parent-assisted, with no microphone or automatic accuracy claim. The optional original passage is not a substitute for the assigned class passage. Written response feedback checks sentence structure only and asks a grown-up to judge meaning.

November 2–6 becomes the current week. Existing browser regression journeys use an explicit October 26 index fixture so their historical spelling, vocabulary, homework and Math expectations remain stable as the current week advances. The new homework browser suite uses the real index and is included in PR and production-build checks.

## Independent review

Six repository specialist roles reviewed curriculum, instruction, interaction, accessibility, UI and QA. The review found and resolved: hidden zero-question fluency, stale state after restart, generic fraction feedback, singular/plural wording, hidden-field focus, excessive repeated introduction, and mobile native-select overflow. UI review inspected all four activity screens at 360, 390, 768, 1024, 1366 and 1920 pixels. Independent interaction smoke checked restart, record persistence, drawing state, navigation and focus.

## Verification commands

- `npm test`
- `CHROME_PATH=<browser> node tests/browser.test.js`
- `node scripts/build-site.js _site`
- `CHROME_PATH=<browser> node tests/browser.test.js --site _site`
- `CHROME_PATH=<browser> node tests/homework-nov02.browser.js`
- `CHROME_PATH=<browser> node tests/homework-nov02.browser.js --site _site`
- After deployment: `CHROME_PATH=<browser> node tests/homework-nov02.browser.js --url https://bazeocrisy.github.io/Study-Scoop/` where outbound access supports it, plus direct live browser interaction.

The new browser suite exercises all four routes at six widths, all 26 fraction keys, wrong answers and Help, both partitions, all three manual fluency attempts, restart and navigation, both written responses, print visibility and earlier weeks. It checks console/network errors and overflow against the layout viewport, rather than an expanding innerWidth.

## Limits and rollback

Physical Chromebook and iPhone hardware, a real screen reader, speech quality on each device, and a physical printer are not verified by headless browser checks. The live public app intentionally does not contain the copyrighted class passage or worksheet scans. Print is the supported way to keep entered work; there is no persistent student storage.

Rollback: revert the focused production PR and allow the existing Pages workflow to redeploy. Earlier week files and chapter data are unchanged. No Pages settings or access permissions are modified.
