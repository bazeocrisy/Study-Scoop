# Study Scoop — Original Handoff Import

Source: `Study_Scoop_Handoff.zip` (received October 16, 2026). This document records its original build requirements; the original archive is retained separately pending transfer of its full assets.

## Original repository layout

```
study-scoop/
  index.html
  css/style.css               TO BUILD
  js/app.js                   TO BUILD
  data/weeks.json
  data/2026-10-12.json
  data/2026-10-19.json
  images/cone.svg
  images/words/*.svg          27 word illustrations
  images/newsletters/*.jpg   2 newsletter photos (NOT imported to public repo)
  reference/vocabulary-prototype.html
  reference/spelling-test-prototype.html
  reference/design-mockup/*.dc.html
  CLAUDE.md
  README.md
```

## Original intent

A free static weekly learning website for a third-grade class, hosted on GitHub Pages with no sign-in, cookies, localStorage, analytics, backend, framework, build step or dependencies. Every week is driven by JSON rather than hardcoded changes to HTML/JS. Parent reviews definitions word for word before publication.

### Six original tabs
1. **This Week** — test countdowns, topics, homework summary and newsletter preview.
2. **Spelling** — grouped rules, text-to-speech and typing, practice/test modes, misses, printable.
3. **Vocabulary** — exact definitions, study cards, flash cards, MCQ, true/false, fill-in-the-blank and print.
4. **Multiplication** — 0–12 tables in vertical form, rule explanations, vertical practice, fact families, multiplication properties and arrays/area.
5. **Homework** — checklist and practice links.
6. **Newsletter** — photo, event dates, learning topics and past weeks.

### Original correctness constraints
- Vocabulary definitions shown must match the teacher-supplied data exactly; example sentences may be original.
- Spelling speech should say the word and example sentence, with autocorrect/spellcheck disabled in typing controls.
- "What makes N" **selected-table mode** restricts answer choices to the chosen table's relevant fact family; for 12 in the 2s: 1×12, 12×1, 2×6, 6×2.
- Print CSS minimizes dark/color-filled backgrounds.
- Mobile, iPad and Chromebook usability; dark mode.
- A new week should require only JSON, optional picture additions and a weeks.json update.

## Decisions approved after the original handoff

Product owner: user. Product architect, UX/instructional design, technical instructions, and implementation audits: ChatGPT. Developer: Claude Code when used.

Expand the site to seven primary areas: This Week, Spelling, Vocabulary, Math, Quick Math, Homework, Newsletter. Math contains Chapter/Unit 5 Lessons 5-1 and 5-2, Multiplication Mastery, vertical problems, optional timers, flashcards and Find My Factors. Find My Factors will distinguish "My Table" from "All Factor Pairs." Quick Math includes Make 10, 20, 50, 100, Next 10, and Mixed Mental Math. All learning sections remain unlocked.

Friday newsletters and Monday homework are supplied to ChatGPT by the owner for preparation and approval; no in-app content administration is required.

## Import status / caution

This Markdown is an overview of the handoff, **not the complete original archive**. The archive includes source code, 27 SVG drawings, prototypes, mockups, two JSON weekly datasets and newsletter photos which are not yet present in GitHub. Do not treat this branch as a working website.

Public repository: do not add unreviewed classroom newsletter images, personal student information or textbook scans. Publishing remains owner-approved only.

## Import status (Assignment 002)

Imported on `feature/foundation`, unchanged except the name review in `docs/DECISIONS.md` (D2):
`index.html` (since updated for seven sections), `data/weeks.json`, `data/2026-10-12.json`, `data/2026-10-19.json`, `images/cone.svg`, `images/words/*.svg` (27), `reference/vocabulary-prototype.html`, `reference/spelling-test-prototype.html`, and the original `HANDOFF.md`, `CLAUDE.md`, `README.md` under `docs/original-handoff/`.

**Held back, kept private:** `images/newsletters/*.jpg` (privacy) and `reference/design-mockup/*` (contains a first name; shows out-of-scope features). Not imported: the duplicate `1_START_HERE_Handoff.md`.

The original handoff instruction to publish with GitHub Pages is superseded: publishing needs Product Owner approval.
