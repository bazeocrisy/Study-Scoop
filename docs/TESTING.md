# Testing

No packages to install. Needs Node 22 or newer and Chrome or Edge (set `CHROME_PATH` if neither is in the usual place).

| Command | What it runs | Time |
|---|---|---|
| `npm test` | Unit tests (`tests/unit/*.test.js`): data, validator, routing, dates, escaping, every section rendered for every week, privacy/security scans, publishing build and verifier | ~3 s |
| `npm run test:browser` | Headless Chrome against the site served at `/Study-Scoop/` (like GitHub Pages): every section and every lesson stage at six widths, keyboard lesson flows, feedback, hints, Show me how, scoring, pictures, contrast, and child journeys that start from the menus (real mouse clicks and Enter/Space on flashcards, Back/Home on every activity, leaving a test) | ~5 min |
| `npm run build` | Builds the publishable site into `_site` from the allowlist and verifies it (`docs/DEPLOYMENT.md`) | ~1 s |
| `npm run test:site` | Builds `_site`, then runs every browser check against the built site only, plus checks that development files are not served | ~20 s |
| `npm run test:all` | All three | |
| `SCREENSHOTS=1 npm run test:browser` | Also rewrites `docs/screenshots/assignment-002/` | |
| `npm run serve` | Local preview at `http://127.0.0.1:<port>/Study-Scoop/` (opening `index.html` as a file will not work: the site loads JSON) | |

On Windows PowerShell use `npm.cmd` if `npm` is blocked.

## What is covered

| Area | Unit tests | Browser tests |
|---|---|---|
| Data | Every week file and the sample week pass the validator; every file is listed; pictures referenced by `img` exist; math examples multiply correctly; the 12 teacher definitions equal an approved list exactly | Definitions, spelling words and math facts on screen equal the data exactly |
| Validator | 25 deliberate mistakes are each caught (bad dates, unknown rule, missing blank, wrong product, duplicate words…) | — |
| Routing | Parse/build round trip for every section × week; unknown weeks fall back | Deep links, unknown section/week fixed in the address, week picker both ways, Back button |
| Dates | Real-date check, countdown across midnight, daylight-saving change and year end; weekday names | Countdown with "today" frozen at Fri Oct 16, 2026 |
| Accessibility | One h1, no skipped heading levels, labelled checkboxes | Tab order, visible focus, Enter opens a section and moves focus, skip link, Space ticks a checkbox, labels/alt text, touch targets ≥ 44 px, WCAG AA text contrast in the light theme and in the opt-in dark palette; a device set to dark mode still gets the light theme |
| Responsive | — | 360, 390, 768, 1024, 1366 and 1920 px wide: no sideways scroll, all eight links on screen, on every section, lesson stage, activity and test |
| Print | — | Navigation hidden; no large colour fills; white page |
| Privacy | No storage/analytics APIs or external URLs in app code; strict CSP; no photos, mockups or personal names published; no credentials | After a full run: no localStorage, sessionStorage, cookies or IndexedDB; every request same-site; none failed; no newsletter photo requests; no console errors |
| Publishing | The built site is exactly the allowlisted files; the four named development files (and every other forbidden path) are absent; junk planted in approved folders is left out; the verifier rejects 12 planted forbidden files, missing modules/styles, absolute or external paths, unused modules, invalid or unlisted data, missing pictures, SVG scripts and personal names; the build refuses to delete the repository or a source folder | Against `_site` served at `/Study-Scoop/`: all checks above pass on the published files alone; 16 development paths requested directly each return "not found"; runtime files return 200 |
| Activities and practice tests (D18) | Every generated question in every week is valid and accepts its own answer; one right answer per multiple-choice question; true/false balanced with matching keys; fill-in ignores capitals and spaces; missing letters never show the word; dictation says word, sentence, word and nothing on screen or in the page source names the word; spelling test asks every word once; authored tests pass the validator, and planted mistakes (wrong key, a split option that also matches the picture, a changed definition, a missing word, a hint) are each caught; homework sources | Every activity end to end (right and wrong answers, empty answers, retries, hints, Show me how, results, Practice My Misses), speech recorded and its fallback (no speech, speech failure), flashcards (flip, shuffle, marks), Test Center for two weeks, each test (no hints or feedback, answers kept when moving around, unanswered warning, score, review, restart, refresh starts again, printed results), weeks never mix |
| New week | Sample week renders in every section | A third week (fixture overlay) appears in every section with no code change; symbols shown as text; missing pictures hidden |

The browser tests were checked against deliberate breakage (low-contrast text, a no-wrap nav, a storage write): each was caught. A prototype planted in `_site` was caught by both the verifier and the "not served" browser check.

The same steps run on GitHub for every pull request (`.github/workflows/pages.yml`); that run publishes nothing. A push to `main` or `develop` runs them for both branches before publishing production and preview (`docs/DEPLOYMENT.md`).

## Manual checks still needed before release

- Real phone, iPad and Chromebook (layout, touch, the week picker).
- A black-and-white printout of Vocabulary and This Week.
- Screen reader pass (VoiceOver or ChromeVox) on one section.
- Owner check of every definition against the class vocabulary sheet.
