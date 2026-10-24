---
name: update-week
description: Add a new Study Scoop week from the class newsletter: spelling, ELA vocabulary, homework, tests, the recommended Math chapter and the privacy-reviewed original flyer, then audit and release.
---
# Update Week

Weeks own the newsletter, spelling, ELA vocabulary, homework, school-test dates and the recommended chapter (D26).

## 1. Read the newsletter
Extract: learning topics, spelling pattern and words (in order), vocabulary words with the teacher's exact definitions (and which are on the quiz), tests and dates, announcements, homework, and the Math topic.

## 2. Write `data/YYYY-MM-DD.json`
- Copy definitions word for word. Mark quiz words (group). Set `mathChapter` to the chapter the class is studying.
- Add the week to `data/weeks.json` (newest first) and set `current` only when it is that week.
- Never edit or delete earlier weeks.

## 3. Pictures
Reuse approved word pictures (data/pictures.json). New supplied pictures: crop out printed words, save 400 px WebP in images/words, check each picture matches its word.

## 4. Practice and tests
20 per spelling and vocabulary activity; spelling test of all words; vocabulary practice test on the quiz words only (`data/tests/<week>.json`). Dictation never shows the picture or the word.

## 5. Original flyer (privacy first)
- Keep raw photos in images/newsletters (git-ignored, never published).
- Inspect for student names, grades, teacher or school names, emails, phone numbers and home backgrounds. If anything private is present, do not publish: report it or prepare a redacted copy for approval.
- Crop and straighten to the page, save `images/flyers/<week>-<page>.webp` (about 1000 px wide, text readable), and add `"flyer": { "reviewed": "<date>", "pages": [{ "src", "label", "alt", "width", "height" }] }` to the week file. The build publishes only reviewed flyers.

## 6. Test, audit, release
`npm test`, browser suites on repository and built site, specialist review (study-scoop-lead), then PRs develop → main and confirm the Pages deployment.
