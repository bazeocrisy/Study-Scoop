# Study Scoop: Decisions Log

Decisions that shape the code or content, newest last. Each lists who decided it and where it is enforced.

| # | Decision | Decided by | Enforced in |
|---|---|---|---|
| D1 | Import only reviewed original files; newsletter photos and design mockups stay out of the public repo | Product Architect (Assignment 002) | `.gitignore`, `tests/unit/static.test.js` |
| D2 | Name review before public import (details below) | Developer, per Architect instruction "review potentially identifying example names" | `tests/unit/static.test.js` |
| D3 | System fonts only; no external font or other third-party requests | Product Architect | CSP in `index.html`, static + browser tests |
| D4 | Nothing is stored: no localStorage, cookies, accounts, analytics. Checkmarks and choices last only while the page is open | Original hard rule + Architect | static + browser tests |
| D5 | Keep the existing weekly JSON format; the current week is set by hand in `data/weeks.json` | Product Architect | `js/lib/validate.js`, `tests/unit/data.test.js` |
| D6 | Routes are `#<section>` with `?week=YYYY-MM-DD` for earlier weeks, so links can be shared and nothing is saved | Developer (audit §7.2, approved with Assignment 002) | `js/lib/router.js`, `tests/unit/lib.test.js` |
| D7 | Plain ES modules, no build step, no runtime dependencies; dev-only test scripts in `package.json` with no packages | Product Architect (B10) | `package.json` |
| D8 | The Newsletter section is built from the weekly JSON, not from photos. The `newsletter` image field stays allowed in the data format but is not displayed | Developer, following D1 | `js/views/newsletter.js` |
| D9 | All data is escaped before it is shown (a `<` or `&` in the data is shown as text). A strict Content Security Policy blocks inline scripts and other sites | Developer | `js/lib/html.js`, `index.html`, tests |
| D10 | Unfinished activities show a "Coming soon" panel with no buttons or form fields, so nothing looks usable that isn't | Product Architect ("placeholders for unfinished activities") | `tests/unit/views.test.js` |

## D2: Name review (exact substitutions)

Teacher definitions were **not** changed. Only our own example sentences, prototype titles and the handoff byline were edited, before the files entered git history.

| File | Original | Now |
|---|---|---|
| `data/2026-10-12.json`, `data/2026-10-19.json`, `reference/vocabulary-prototype.html` | "Ms. Lee is an ___ at the bank…" | "My aunt is an ___ at the bank…" |
| same | "Before he read the book, Sam was ___…" | "Before he read the book, my brother was ___…" |
| same | "After her best friend moved away, Maya felt…" | "After her best friend moved away, my sister felt…" |
| same | "Jordan always does what he says…" | "My neighbor always does what he says…" |
| `reference/vocabulary-prototype.html` | title and heading "Chris's Vocabulary Practice" | "Vocabulary Practice" |
| `reference/spelling-test-prototype.html` | title and heading "Chris's -ed Spelling Test" | "-ed Spelling Test" |
| `docs/original-handoff/HANDOFF.md` | "From: [owner's full name]" | "From: the Product Owner" |

The replacements keep each sentence's grammar and its article ("an ___" still precedes *employee*), so a future quiz built on them behaves the same.
