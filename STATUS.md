# Study Scoop — Project Status

## Current phase
Assignment 002 + 002B (foundation, safe publishing) complete on `feature/foundation` (PR #1), awaiting Product Architect review. Not merged. GitHub Pages is off; no site has been published.

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
  - Workflow `.github/workflows/pages.yml`: checks every pull request; publishes only when the owner runs it by hand on `main`
  - 76 unit tests, 45 browser checks on the repository, 47 on the built site, all passing
- Owner feedback (light theme, D12): vanilla background, white cards, softer sprinkles; light on every device. 76 unit, 46 browser, 48 built-site checks passing

## Not yet implemented
- Spelling practice, flash cards, tests, Practice My Misses, print sheet
- Vocabulary practice, quizzes, tests, Practice My Misses, print sheet
- Math Chapters Lessons 5-1 and 5-2 (Learn, Practice, Study Guide, Test)
- Multiplication Mastery and Find My Factors
- Quick Math (six levels)
- Optional timers
- Manual device, print and screen-reader checks (`docs/TESTING.md`)

## Open questions (from the audit)
- B3: which words are "purple" for the Oct 23 quiz
- B4: vocabulary sheet photo so definitions can be checked (kept out of the repo)
- B5: word pictures that contain text
- B6–B8: Find My Factors rules, Lesson 5-1/5-2 objectives, Quick Math specification

## Next
Product Architect reviews PR #1. No merge, Pages setting change, publishing or Assignment 003 work until approved. Release steps: `docs/DEPLOYMENT.md`.

## Privacy note
The repository is public. Never add newsletter photos, homework packet scans, textbook pages, student names or other personal information.
