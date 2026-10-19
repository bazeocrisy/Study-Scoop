# Study Scoop

A free third-grade learning hub for weekly classroom topics and original practice activities.

## Status
**Foundation live.** Production: https://bazeocrisy.github.io/Study-Scoop/ · live preview of work in progress: https://bazeocrisy.github.io/Study-Scoop/preview/. See `STATUS.md`.

## Planned areas
- This Week: topics, announcements and assessments
- Spelling: study, flashcards and practice tests
- Vocabulary: definitions, examples and activities
- Math: Unit 5 lessons, multiplication mastery and Find My Factors
- Skill Builders: Mental Add, Rounding and Times Tables (more skills to come), each with Learn It, practice with Help, and a test
- Homework: weekly assignment support
- Newsletter: current issue and archives

## Workflow
The product owner supplies Friday newsletters and Monday homework through ChatGPT. ChatGPT is the product architect/design lead, prepares requirements and reviews developer work. Claude Code implements approved tasks on branches. The owner approves all releases.

## Safety and publishing
This repository is public. **Do not commit unreviewed school newsletters, student names, personal information, textbook scans, or answer keys copied from copyrighted materials.** Original examples and practice must be validated. No student accounts, tracking, analytics, paid services, or persistent storage in v1.

## Working on it
- Preview: `npm run serve`, then open the address it prints (the site must be served; opening `index.html` as a file will not work).
- Tests: `npm test`, `npm run test:browser` and `npm run test:site` (no packages to install). See `docs/TESTING.md`.
- Publishing: production https://bazeocrisy.github.io/Study-Scoop/ (from `main`), live preview https://bazeocrisy.github.io/Study-Scoop/preview/ (from `develop`). See `docs/DEPLOYMENT.md`.
- Adding a week: `docs/CONTENT-GUIDE.md`.
- Decisions: `docs/DECISIONS.md`.
