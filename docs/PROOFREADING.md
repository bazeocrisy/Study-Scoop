# Proofreading gate (required before publishing)

Every new or changed newsletter, vocabulary set, math lesson, worksheet, lab and generated image passes this gate before it is
proposed for publication. It was added after the 2026-11-12 text and accuracy audit (`docs/reviews/TEXT-AUDIT-2026-11-12.md`).
The Study Scoop Weekly Manager plugin was not available in the session that wrote this file, so its visual-proofreading
requirements are restated here from the owner's audit brief; if the plugin's checklist differs, follow the stricter of the two.

## 1. Automatic text check
- `npm run proofread` (also part of `npm test`, `tests/unit/proofread.test.js`). It must report **0 Study Scoop findings**.
- It catches number agreement after "1" ("1 parts", "1 steps", "1 equal piece are"), doubled words, British spellings,
  sentences that start in lower case, double spaces, unbalanced brackets, known misspellings and adult jargon in child text.
- It is a safety net. It does not replace reading the text.

## 2. Read every new string
- Read the deduplicated text (templates once each), in American English, at a third-grade reading level: short sentences,
  everyday words ("bottom number", "equal parts", "spaces"), academic terms kept and explained.
- Check meaning, not only grammar. Every definition matches its word and part of speech. Every example sentence shows the
  meaning. Every question has one clear right answer. Every hint and feedback sentence is true for its own picture.
  Instructions match the actual buttons and interactions.
- Generated content: edit the generator (`scripts/author/...`), regenerate, then reread. Never hand-edit generated JSON.

## 3. Visual text verification (every image that contains words or numbers)
- Open the final file that will be published (not the source). Crop and enlarge each text region 2–3× and read it
  letter by letter: headings, decorative lettering, labels, numbers, fractions, dates.
- AI-cleaned or AI-generated images can change letters ("VOCAPULARY" for "VOCABULARY"). Compare every word with the
  teacher's original photo and with the week file.
- Diagrams: labels in the right place (no number touching a fraction so that it reads like an exponent), no stray marks.
- Word pictures: they show the meaning; every person shown is Black (owner rule); no brand logos; nothing cut off.
- After any correction, inspect the final rendered image again.
- Record what was checked in `docs/weekly/<week>/REVIEW.md` (image, text read, result). Unreadable text is reported as
  "not verified", never assumed correct.

## 4. Teacher originals
- Newsletter wording, teacher definitions, spelling lists and worksheets are the teacher's. Never change them silently.
- If the original has an error, keep it and add a student-facing note (for example the "In everyday words…" notes on
  Trustworthy, Irritating and Distracted). Report it to the owner.
- Fix only Study Scoop errors (transcription, generated text, generated or cleaned images), after confirming the intended meaning.

## 5. Sign-off
- An independent reviewer rereads the corrected material.
- Run the unit, browser and site tests, and look at the changed pages.
