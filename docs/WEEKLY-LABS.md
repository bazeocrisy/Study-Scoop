# Illustrated weekly spelling and vocabulary labs

Each week's optional `labs` field names two self-contained HTML files, linked from the Spelling and Vocabulary menus. The normal Study Scoop engines remain available. Both labs keep the prototype activity types and browser audio; meaningful pictures appear in Learn and on revealed flash cards, never test prompts. Every depicted person must be Black, including background figures.

## Generate a week

Prepare the normal weekly data first. Then create `docs/weekly/<week>/lab-images.json`, following the complete Nov 9 example. It records the week, `people: "Black only"`, reviewed highlighting `patterns`, and one lowercase-word entry per spelling and vocabulary word. Each entry records reviewed `syllables` and an `illustration` with `file`, meaningful `alt` and `reviewed: true`. Syllables must concatenate to the written word. Save images as WebP under `images/words/`; square-cell sheets also need `columns`, `rows` and zero-based `index`.

Run:

```bash
node scripts/author/build-weekly-labs.mjs YYYY-MM-DD docs/weekly/YYYY-MM-DD/lab-images.json
```

The generator validates both subjects, generates `labs/<week>-spelling.html` and `labs/<week>-vocab.html`, adds the week's menu links through `week.labs`, and registers native picture overrides in `data/pictures.json`. It preserves other weekly fields, earlier weeks, Math, the current-week selection and deployment settings. Embedded pictures need no separate folder in the downloadable HTML. Weekly dates, words, counts, exact teacher definitions and sentences come from that week's data. The class's six-random-word vocabulary quiz remains distinct from the supplementary 12-word lab practice.

## Validation and release

Review every image, its meaning, all people and sheet mapping before marking it reviewed. The build publishes only labs named by a published week. Tests cover per-word mappings, exact definitions, picture-free tests, preservation of first-attempt scores across retries, escaped typed answers, bad input rejection and repeatable generation.

Run `npm test`, `npm run test:browser`, and `npm run test:site`. Hear actual audio on the child's device before declaring voice quality verified. Prepare a feature PR into develop. Production merges require owner approval under CLAUDE.md. Verify the Pages deployment before reporting a live change.

Rollback: revert the integration commit, or remove a week's `labs` field and its two generated files to withdraw that week's lab menu links. Restore the previous `pictures.illustrations` entries when withdrawing its native picture overrides.
