# Weekly Content Guide

Adding a week needs **one new JSON file and one line in `data/weeks.json`**. No HTML or JavaScript changes.

## Steps (Friday newsletter)

1. Copy last week's file in `data/` to `data/YYYY-MM-DD.json`, named for that week's Monday.
2. Update `id`, `label`, `learning`, `tests`, `events`, `homework`, `spelling` and `vocab` from the approved newsletter.
3. Add the week to the **top** of `data/weeks.json` and set `"current"` to it.
4. Run `npm test`. The validator names any problem in plain English (for example "tests[1].date must be a real date").
5. Open a pull request. The owner checks every vocabulary definition against the class sheet before it is merged.

## Rules

- Vocabulary `def` is copied **word for word** from the class sheet, including capital letters. Never reword it.
- `sentence` and `fill` are ours. `fill` has exactly one `___` and differs from `sentence`. Use family words ("my aunt"), not names.
- `group` is `"green"` or `"purple"` for this week's quiz words; leave it out for review-only words.
- Test `date` is `YYYY-MM-DD`; `kind` is `math`, `vocab` or `spelling`.
- `math` is optional. Each example is `[factor, factor, product]` and the test checks the product.
- Word pictures go in `images/words/<word>.svg` (lowercase). They are optional; a missing one is simply not shown.
- **Never** add newsletter photos, homework packet scans, textbook pages or student names. The repository is public.

## Format

See `data/2026-10-19.json` for a complete example, and `docs/original-handoff/CLAUDE.md` for the original field list. The `newsletter` image field may remain but is not displayed (DECISIONS D8).
