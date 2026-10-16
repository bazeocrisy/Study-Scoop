# Study Scoop

A free third-grade learning hub for weekly classroom topics and original practice activities.

## Status
**Foundation built, not released.** The seven sections, weekly data loading and baseline tests are on the `feature/foundation` branch for review. GitHub Pages stays off until the owner approves publication. See `STATUS.md`.

## Planned areas
- This Week: topics, announcements and assessments
- Spelling: study, flashcards and practice tests
- Vocabulary: definitions, examples and activities
- Math: Unit 5 lessons, multiplication mastery and Find My Factors
- Quick Math: Make 10/20/50/100, Next 10 and mixed mental math
- Homework: weekly assignment support
- Newsletter: current issue and archives

## Workflow
The product owner supplies Friday newsletters and Monday homework through ChatGPT. ChatGPT is the product architect/design lead, prepares requirements and reviews developer work. Claude Code implements approved tasks on branches. The owner approves all releases.

## Safety and publishing
This repository is public. **Do not commit unreviewed school newsletters, student names, personal information, textbook scans, or answer keys copied from copyrighted materials.** Original examples and practice must be validated. No student accounts, tracking, analytics, paid services, or persistent storage in v1.

## Working on it
- Preview: `npm run serve`, then open the address it prints (the site must be served; opening `index.html` as a file will not work).
- Tests: `npm test` and `npm run test:browser` (no packages to install). See `docs/TESTING.md`.
- Adding a week: `docs/CONTENT-GUIDE.md`.
- Decisions: `docs/DECISIONS.md`.
