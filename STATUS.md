# Study Scoop — Project Status

## Current phase
Chapter-first Math (D26): Math opens on Choose Your Chapter; Chapter 5 and Chapter 6 each have Learn Vocabulary, Vocabulary Practice, Math Lessons, Practice Problems, Study Guide and Chapter Test, loading only their own content. This Week recommends the week's chapter (Oct 26–30: Chapter 6; Oct 12–23: Chapter 5) with shortcuts. The Newsletter shows the privacy-reviewed Oct 26–30 flyer (zoom, print); Oct 12 and Oct 19 flyers were never supplied and show as unavailable. Reusable workflows: `.claude/skills/build-chapter`, `.claude/skills/update-week`, `.claude/agents`.

Oct 26–30 release (D24): weekly content for Oct 26–30 (spelling -er/-or with the supplied pictures, the four green vocabulary words, Topic 6: Area for the Nov 3 vocabulary test) and the release-test repair. Chapter 6 (D25): lessons 6-1 to 6-6, Area Words, Chapter 6 Review, the Chapter 6 Practice Test (27) and the Nov 3 Math Vocabulary Practice Test (12).

Skill Builders Wave 1 (D22): Quick Math is now Skill Builders with Mental Add, Rounding and Times Tables.

Step-by-step Help (D21) on `develop`: one Help button after a wrong answer, one step at a time, and a reason for every wrong answer, across lessons and all practice activities.

Unit 5 build on `develop` (DECISIONS D20): all seven Unit 5 lessons (5-1 to 5-7), each with 20 Try It Yourself questions, hints, Show me how, results with what to do next and an in-lesson Practice My Misses; Math Vocabulary for the five properties (Associative added); 20 questions in every Practice Problems kind and every Spelling and Vocabulary activity; a Math Vocabulary Practice Test; a Unit 5 Study Guide. Content was reviewed by independent curriculum and interaction/accessibility reviews and corrected. 144 unit tests, 171 browser checks and 173 built-site checks pass.

Assignment 005 user-acceptance corrections on `develop` (D19): Spelling, Vocabulary and Math open on an activity menu; every activity has crumbs, Back to Subject and Home; flashcards flip on click, tap, Enter or Space; Math has Learn the Properties, Practice Problems (38 checked original problems), Math Lessons and a Study Guide; leaving an unfinished test asks first. Production is unchanged.

Assignment 005 (implementation) on `develop`: eighth section **Tests** (weekly Study Scoop practice tests for Math, Spelling and Vocabulary), Spelling and Vocabulary practice activities with Practice My Misses, and homework entries that say what was received (D18). Before that, Assignment 004: redesigned site (D16), interactive Lessons 5-1 and 5-2 on a shared lesson engine (D17), spelling and vocabulary pictures integrated. Preview: https://bazeocrisy.github.io/Study-Scoop/preview/ · production (unchanged until the owner approves a merge): https://bazeocrisy.github.io/Study-Scoop/. Image PRs #2 and #3: their files are included on `develop`; the PRs themselves are not merged.

## Completed
- GitHub repository created by owner; README.md and CLAUDE.md added
- Assignment 001: read-only audit (`docs/STUDY-SCOOP-AUDIT-REPORT.md`)
- Assignment 002:
  - Reviewed original files imported (`docs/HANDOFF-IMPORT.md`, `docs/DECISIONS.md` D1–D2)
  - Seven sections with responsive layout, week picker, shareable week links, light "vanilla" theme on every device (D12) and print styles
  - Real data shown: This Week (test countdowns, learning, dates, homework), spelling words by rule, vocabulary cards with exact definitions and pictures, the week's math words, homework checklist (not saved), newsletter from data with all weeks
  - "Coming soon" panels for every unbuilt activity
  - 66 unit tests + 45 browser checks, all passing (`docs/TESTING.md`)
- Assignment 002B (`docs/DEPLOYMENT.md`, DECISIONS D11):
  - Allowlist build `scripts/build-site.js`: publishes only the page, styles, modules, listed weeks and pictures, and verifies the result
  - Workflow `.github/workflows/pages.yml`: checks every pull request; superseded by preview-first publishing (D15): pushes to `main`/`develop` test and publish production and preview
  - 76 unit tests, 45 browser checks on the repository, 47 on the built site, all passing
- Owner feedback (light theme, D12): vanilla background, white cards, softer sprinkles; light on every device. 76 unit, 46 browser, 48 built-site checks passing

## Not yet implemented
- Printable study sheets (spelling, vocabulary)
- Practice for multiplying multiples of 10 (homework topic, Oct 12–16)
- Vocabulary "purple words" for Oct 19–23 (not provided yet; the tests say so)
- Multiplication Mastery and Find My Factors
- Skill Builders later waves: Read the Clock, Elapsed Time, Greater/Less Than, Mental Subtract, Place Value, Is It Equal?, Times Tens
- Optional timers
- Manual device, print and screen-reader checks (`docs/TESTING.md`)

## Open questions (from the audit)
- Unit 5 build: confirm with the teacher that the Associative Property is on the class organizer, and its exact wording (Study Scoop labels it "Definition", not "Teacher's words")
- B3: which words are "purple" for the Oct 23 quiz
- B4: vocabulary sheet photo so definitions can be checked (kept out of the repo)
- B5: word pictures that contain text
- B6–B8: Find My Factors rules, Lesson 5-1/5-2 objectives, Quick Math specification
- Chapter 6 vocabulary: the class sheet defines *Distracted* as "To prevent something from continuing as usual", which reads closer to *interrupted*. Study Scoop keeps the teacher's words; worth confirming with the teacher
- Chapter 6 story names (Omar, Lena, Ana, Ben, Ray, Bo, Jo, Max) are invented; owner to confirm none match a classmate

## Next
New work goes to `develop` and appears on the live preview. The owner tests it there; each merge into `main` needs the owner's explicit approval of that pull request. Do not merge image PRs #2 and #3 until approved. Release steps: `docs/DEPLOYMENT.md`.

## Privacy note
The repository is public. Never add newsletter photos, homework packet scans, textbook pages, student names or other personal information.
