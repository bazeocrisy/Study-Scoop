# Authoring scripts (development only, never published)

These scripts write Study Scoop's original Unit 5 content into `data/` (DECISIONS D20). Every number a child sees is computed
from the two factors here, and every file they write is checked again by the app's own validators before it is saved.
The build (`scripts/build-site.js`) never copies this folder to the website.

| Script | Writes | Checked by |
|---|---|---|
| `node scripts/author/build-lessons.mjs [id …]` | `data/lessons/5-3.json` … `5-7.json` from `lessons/<id>.mjs` | `validateLesson`, plus: each question accepts its own answer, has a hint (tests excepted) and Show me how |
| `node scripts/author/extend-5-1-5-2.mjs` | Try It Yourself questions 9–20 of Lessons 5-1 and 5-2 (and 5-2's "break apart the 7" screen). Questions 1–8 and the rest of both lessons are kept as written | `validateLesson` |
| `node scripts/author/extend-practice.mjs` | Practice Problems questions p13–p20, s11–s20, b11–b20, f7–f8 in `data/practice/math.json` | `validateMathPractice` (the property from each equation's numbers, every split option against its picture, every "break apart" option against the factor named) |
| `node scripts/author/math-words.mjs` | `data/practice/math-words.json` (Math Vocabulary: 20 multiple choice, 20 true or false, 20 fill in the blank) | `validateMathWords` |

All four are idempotent: running one again rewrites only what it owns. To change a question, edit the script (or the
lesson's `lessons/<id>.mjs`), run it, then run `npm test`. Hand edits to the generated JSON files are overwritten the next
time their script runs (except Lessons 5-1 and 5-2, whose hand-written parts the script leaves alone).

Content rules: original problems only (no textbook stories, names or wording), no personal names from the original
materials, third-grade wording, no division in Lesson 5-7, and the 9s strategy is the 5s fact plus the 4s fact.
