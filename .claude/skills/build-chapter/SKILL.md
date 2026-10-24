---
name: build-chapter
description: Build a new Study Scoop Math chapter (for example Chapter 7) from the textbook: lessons, diagrams, guided and independent practice, vocabulary center, study guide and chapter test, then audit and release.
---
# Build Chapter

Chapters own their Math content (D26). A new chapter is data plus a few registry entries; the rendering components are shared.

## 1. Read the textbook (never publish it)
- Keep the PDF outside the repository (it is public). Note the lesson order, titles, goals and vocabulary.
- Write everything in your own words with your own numbers and pictures.

## 2. Register the chapter
- `data/lessons/index.json`: add `{ "id": N, "name", "title": "Chapter N: <name>", "summary", "week": "<YYYY-MM-DD of the week whose newsletter announces it>" }` to `chapters`, and each lesson `{ "id": "N-k", "chapter": N, "title", "summary", "strategy" }` to `lessons`.
- `js/lib/activities.js` `ACTIVITIES.math`: one activity per role, each with `chapter: N` and a `role`: `vocab`, `vocabpractice`, `lessons` (id `chN`), `practice`, `guide`, `test` (id `chNtest`, `test: true`, its misses `group`). Sub-menu items get `chapter: N` and `parent`.
- `validateChapters` (js/lib/chapters.js) fails the build if a role or a lesson is missing.

## 3. Build each lesson (`data/lessons/N-k.json`)
Follow 6-1..6-6: Learn It screens with checkpoints; Watch Me (at least 2 examples, step by step); Practice Together (at least 5, with hints and Show me how); Try It Yourself (20 original items, rising difficulty); a separate 10-15 question test (no hints, no practice repeats); parent notes. Generate with a script so numbers, pictures and answers come from one source, and run `validateLesson`.

## 4. Diagrams
Use the models in js/lib/models.js and js/lib/shapes.js (arrays, grids, shapes). Answers are re-derived from the picture by the validator (`asks`, `areaBox`, `areaOptions`, `compare`). Alt text must not give the answer.

## 5. Vocabulary center, practice, guide, test
- Teacher words come from the week file, word for word; extra textbook words are labelled as review.
- 20 multiple choice, 20 true/false, 20 fill in the blank; Review My Words, Flashcards, Practice My Misses.
- A printable study guide (what to know, worked example, common mistakes, self-check with answers).
- A chapter practice test covering every lesson (not presented as the teacher's test).

## 6. Tests and audit
- Add unit tests like tests/unit/chapter6.test.js and chapter isolation markers in tests/unit/chapters.test.js; add browser checks.
- Run the specialist agents (see study-scoop-lead). Fix and re-run.

## 7. Release
Feature branch → PR to develop → PR to main. Confirm the Pages deployment for the main commit, then report.
