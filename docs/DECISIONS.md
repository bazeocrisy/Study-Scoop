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
| D11 | Publish only an allowlisted, verified copy of the runtime files, through a GitHub Actions workflow the owner runs by hand on `main` (details below) | Product Architect (Assignment 002B) | `scripts/build-site.js`, `tests/unit/site.test.js`, `npm run test:site` |
| D12 | Light "vanilla" theme on every device: cream background, white cards, softer sprinkles, drip header kept. The site no longer follows the device's dark-mode setting; the dark palette stays in `css/style.css` as an opt-in (`<html data-theme="dark">`) that nothing switches on yet | Product Owner feedback ("too dark"), Assignment 002 review | `css/style.css`, browser contrast + "dark-mode device gets light theme" checks |
| D15 | Preview-first publishing replaces manual publishing (D11 approval step): one Pages site, production from `main` at `/Study-Scoop/`, live preview from `develop` at `/Study-Scoop/preview/`; every push to either branch tests both and republishes both. Merges into `main` still need the owner's explicit approval per pull request. The allowlist build and verifier (D11) are unchanged | Product Owner ("restore preview-first development") | `.github/workflows/pages.yml`, `docs/DEPLOYMENT.md`, `github-pages` environment branch rules (main, develop) |

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

## D11: Publishing architecture

- **Why:** "Deploy from a branch" would publish every file in the repository, including the unfinished prototypes in `reference/`, the tests and the internal documents.
- **How it builds:** `scripts/build-site.js` copies an explicit allowlist into `_site` and verifies it. The verifier checks that:
  - forbidden paths are absent
  - every reference resolves with a relative path
  - no module is unused
  - the data is valid
  - pictures contain no scripts
  - no personal names appear
- **No code transformation:** the build copies files without changing them. The site still runs as plain modules with no compile step, so D7 still holds.
- **Approval:** publishing happens only through `.github/workflows/pages.yml`, started by hand on `main` with the word `publish`. Pull requests are checked but never published. Pages must be set to Source "GitHub Actions" by the owner after release approval. See `docs/DEPLOYMENT.md`.
- **Drafts stay off the site:** a week file is published only once it is listed in `data/weeks.json`.
- **Smallest change:** to test the built site, the test server can now serve a folder other than the repository (`root` option in `tests/lib/harness.js`, `--site` in `tests/browser.test.js`). No app code changed.
