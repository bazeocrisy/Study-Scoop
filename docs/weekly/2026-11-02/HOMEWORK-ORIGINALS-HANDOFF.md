# November 2–6 original homework sheets — source-asset integration

## Status

**Four owner-supplied photographs are verified and locally prepared, but binary image assets are NOT committed to GitHub by this branch.** Do not claim the four originals are published. The weekly interactive practice is present; this is additive.

The accompanying owner package `Study_Scoop_Nov02_Original_Homework_Assets.zip` contains the four prepared WebP images, a printable four-page PDF, a preview HTML page and a JSON asset manifest. The ZIP is a conversation attachment, not a file in this Git repository. Obtain the ZIP from the product owner before proceeding.

## Required images

Copy the following four WebP files from the package into `images/homework/`:

1. `2026-11-02-fractions-identifying.webp` — Identifying Fractions, page 61
2. `2026-11-02-fractions-parts.webp` — Recognizing the Parts, page 63
3. `2026-11-02-reading-passage.webp` — My Favorite Author, fluency passage
4. `2026-11-02-reading-questions.webp` — My Favorite Author, comprehension questions

Images have been perspective-cropped, lightly sharpened and adjusted for contrast, without changing academic content. All four are **1000 × 1320** pixels. Preserve the exact document order.

## Register in week data

After the assets are committed and their privacy is independently checked, add the following to `data/2026-11-02.json`:

```json
"homeworkPapers": {
  "reviewed": "2026-11-04",
  "note": "Parent-supplied original worksheets. Name fields were blank. A hand-written Parent Copy note on the reading page is retained; crop/straighten/contrast only. No completed student answers.",
  "pages": [
    {"src":"images/homework/2026-11-02-fractions-identifying.webp","label":"Identifying Fractions — page 61","alt":"Original Identifying Fractions homework with shaded shapes and two draw-a-shape tasks","width":1000,"height":1320},
    {"src":"images/homework/2026-11-02-fractions-parts.webp","label":"Recognizing the Parts — page 63","alt":"Original fractions homework about parts of sets and writing numerical fractions","width":1000,"height":1320},
    {"src":"images/homework/2026-11-02-reading-passage.webp","label":"My Favorite Author — fluency passage","alt":"Original My Favorite Author reading passage with cumulative word counts and three-reading fluency chart","width":1000,"height":1320},
    {"src":"images/homework/2026-11-02-reading-questions.webp","label":"My Favorite Author — comprehension questions","alt":"Original My Favorite Author comprehension worksheet with two complete-sentence response questions","width":1000,"height":1320}
  ]
}
```

Use the true privacy review date when finally approving assets; the date above denotes initial parent-photo inspection only.

## Acceptance criteria

- All four images are included in the audited static-site allowlist and referenced by the weekly data.
- Individual **Open full size** and **Download worksheet image** links load the right original.
- **Print the homework** prints all four pages without cutting off the lower section of page 63.
- Existing on-screen math fractions and reading homework remain unchanged.
- The same week is reachable from the archive with week-specific correct images.
- View at phone (360, 390 px), tablet (768 px) and desktop (1366 px), and inspect print preview.
- Run unit tests, built-site verification, real browser tests, and confirm preview deployment.
- **Production merge requires owner approval.**

## Privacy/source caveat

The images are publicly visible if committed to this public GitHub Pages repository. The owner expressly requested publication, but the final reviewer should again verify the photographs do not contain student names, identifiers, teacher/school information or other private data.
