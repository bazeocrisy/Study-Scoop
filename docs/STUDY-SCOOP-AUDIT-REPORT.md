# STUDY SCOOP — AUDIT REPORT (Development Assignment 001)

**Date:** 2026-10-16 · **Developer:** Claude Code · **Status:** PASS WITH ISSUES · **Scope:** read-only

**Evidence labels:** **[V]** = verified (file read, command output or GitHub API) · **[A]** = assumption · **[R]** = recommendation.
**Paths:** `repo/` = `github.com/bazeocrisy/Study-Scoop` (local clone `C:\Users\bazeocrisy\Projects\Study-Scoop`).
`zip/` = `Study_Scoop_Handoff.zip` → `study-scoop/` (read-only extract at `C:\Users\bazeocrisy\Projects\Study-Scoop-handoff-src`).

Nothing has been committed, pushed, merged, imported or deployed. GitHub Pages is untouched.

---

## 1. Executive Summary

- [V] The original handoff archive is present and complete against its own manifest. The only missing items are the two files it says still need building: `zip/css/style.css` and `zip/js/app.js`.
- [V] The GitHub repo holds governance documents only. `main` @ `3b9ce42`; `handoff/import` @ `512c369` (+`docs/HANDOFF-IMPORT.md`). Pages is disabled.
- [V] Reusable now: valid weekly JSON for two weeks, 27 word SVGs, the cone logo, the `index.html` shell, and two **working** prototypes (spelling test and vocabulary).
- [V] The prototypes hardcode the Oct 12 week, use localStorage (forbidden), and contain two grading/accuracy defects. See §5.
- [V] Privacy: the newsletter photos and the design mockups must **not** be imported as-is. See §6.
- [V] There is no source material for Math Chapters 5-1/5-2, Quick Math, or Find My Factors' "All Factor Pairs" mode. These need approved specifications before implementation.
- **Verdict:** the import can proceed safely once blockers B1–B2 are answered (holding back the two privacy items is sufficient). Feature work beyond the foundation depends on B3–B14.

## 2. Repository Inventory

### 2.1 GitHub repository [V]
| Item | Finding |
|---|---|
| Visibility / Pages | Public; `has_pages: false`; `https://bazeocrisy.github.io/Study-Scoop/` → 404 |
| Default branch | `main` @ `3b9ce42` "Track initial Study Scoop development status" |
| Dev branch | `handoff/import` @ `512c369`, one commit ahead; adds `docs/HANDOFF-IMPORT.md` only |
| Files | `README.md`, `CLAUDE.md`, `STATUS.md`, `docs/HANDOFF-IMPORT.md` (branch only) |
| Absent | Application code, assets, tests, `.gitignore`, `.github/`, license |
| Note | Two duplicate "Initialize…" commits on `main` (`3b930a2`, `b13056b`); cosmetic |

`repo/docs/HANDOFF-IMPORT.md` accurately describes the archive: every path and count it lists was checked against the archive.

### 2.2 Handoff archive (`Study_Scoop_Handoff.zip`, 605 KB, 47 files) [V]
| Category | Files | Status |
|---|---|---|
| Docs | `HANDOFF.md` (byte-identical to top-level `1_START_HERE_Handoff.md`), `CLAUDE.md`, `README.md` | Complete; some instructions superseded (§4) |
| HTML shell | `index.html` (2.5 KB): drips SVG, header, week picker, **6** tab links | Complete; renders only "Loading…" (no CSS/JS) |
| CSS / JS | `css/style.css`, `js/app.js` | **Absent**, marked "TO BUILD" |
| Weekly JSON | `data/weeks.json`, `data/2026-10-12.json`, `data/2026-10-19.json` | Valid; content validated (§5) |
| Logo | `images/cone.svg` | Complete |
| Word art | `images/words/*.svg` × 27 | No scripts/links; 10 contain text (§5) |
| Newsletter photos | `images/newsletters/2026-10-12.jpg`, `2026-10-19.jpg` (1050×1400) | No EXIF/GPS; **privacy review** (§6) |
| Prototypes | `reference/vocabulary-prototype.html` (522 lines), `reference/spelling-test-prototype.html` (254 lines) | Working, self-contained |
| Mockups | `reference/design-mockup/{Main,Spelling,Vocabulary,Multiplication,Homework,Newsletter}.dc.html`, `canvas.json` | Static; depend on missing `support.js` (§7.1) |

**Not in the archive but needed later [V]:** the class vocabulary sheet (to verify definitions), the Oct 23 "purple" word list, Unit 5 lesson material, Quick Math material, and homework packet content.

## 3. Existing Functional Components [V — code read]

| Component | Location | Works | Reuse decision [R] |
|---|---|---|---|
| Speech sequence: number → word → sentence → word; "say it slowly" never spells the word | `spelling-test-prototype.html:148-171` | Yes | Port as-is |
| Typing input with autocorrect/autocapitalize/spellcheck off | `spelling-test-prototype.html:103` | Yes | Port as-is |
| Practice mode (immediate feedback) vs test mode (results at end); retry missed words | `spelling-test-prototype.html:201-248` | Yes | Port; this is the basis of "Practice My Misses" |
| HTML-escaping of typed answers | `spelling-test-prototype.html:239` | Yes | Reuse as shared helper |
| Study cards, picture + definition + sentence + speaker | `vocabulary-prototype.html:385-399` | Yes | Port, using data not constants |
| Flash cards: flip, shuffle, meaning-first, ←/→/Space | `vocabulary-prototype.html:402-437` | Yes | Port |
| MC / True-False / Fill-in-blank with running score | `vocabulary-prototype.html:440-516` | Yes, with defects F3–F6 | Port and fix |
| Drip header SVG, palette, fonts | `index.html`, `vocabulary-prototype.html` CSS | Yes | Basis of `css/style.css` |
| Weekly data files + `weeks.json` index | `data/` | Yes | Keep format unchanged |

## 4. Missing or Incomplete Components [V]

| Area | Exists | Missing |
|---|---|---|
| App runtime | `index.html` shell | `css/style.css`, `js/app.js`, router, week loader |
| Navigation | 6 tabs ("Multiplication" label) | 7 sections: This Week, Spelling, Vocabulary, Math, Quick Math, Homework, Newsletter |
| This Week | Mockup + JSON tests/events | Countdowns, activity links |
| Spelling | Prototype | Rule-grouped list, flashcards, guided practice, print sheet, data-driven words |
| Vocabulary | Prototype | Quiz/all/math filter, scored test mode, Practice My Misses, print, data-driven questions |
| Math Chapters 5-1, 5-2 | None (only 4 property terms in `data/2026-10-19.json`) | Learn, Practice, Study Guide, Test for both lessons |
| Multiplication Mastery | Mockup + spec text | Tables 0–12 (vertical), rules, flashcards, optional timers, tests, misses, fact families |
| Find My Factors | Spec for table mode only (`zip/HANDOFF.md`) | My Table and All Factor Pairs modes |
| Quick Math | None | All six levels |
| Homework | Mockup; 3 recurring items in JSON | Weekly assignment structure, reminders |
| Newsletter | Photos; JSON holds the content | Data-rendered newsletter and archive view |
| Cross-cutting | — | Print CSS, dark mode, optional timers, keyboard/a11y, tests |

**Superseded archive instructions [V]:** `zip/HANDOFF.md` says to "publish it with GitHub Pages" and to create a repo named `study-scoop`. Both are superseded by the no-deploy-without-approval rule and the existing `Study-Scoop` repo.

## 5. Educational Content Findings

### 5.1 Data validation [V — Node script over both weeks]
- Both week files parse, and `id` matches the filename and the `weeks.json` entry. `current` = `2026-10-19`.
- Spelling (15 words per week) and test dates/events match the newsletter photos exactly (photos viewed).
- Every spelling `rule` exists in `rules`. Every spelling and vocab example sentence contains its word.
- Every vocab `fill` has exactly one `___` and differs from its `sentence`.
- Math examples are arithmetically correct: 7×1=7, 9×0=0, 6×3=18, 4×2=8 (`data/2026-10-19.json` `math.words`).
- Quiz groups: Oct 12 green = Produce, Exception, Installment, Peculiar. Oct 19 green = Employee, Fortunate, Ignorant, Melancholy. Purple = **unknown** (the handoff itself raises this as an open question).
- Spelling rules check out: -ed /t/ /d/ /ed/ classifications and -ing add/double/drop-e assignments are correct for all 30 words.
- Vocab definitions match the prototype's "exact" list. **They cannot be verified against the source sheet, because the sheet is not in the archive.**

### 5.2 Hardcoded weekly information [V]
- `spelling-test-prototype.html:127-143`: the Oct 12 -ed list.
- `vocabulary-prototype.html:235-365`: definitions, sentences, inline art, and hand-written MC/TF/FIB items.
- `design-mockup/*.dc.html`: Oct 19 content baked into the markup.

### 5.3 Issues affecting instructional accuracy
| # | Finding | Evidence | Severity |
|---|---|---|---|
| F3 | True/False statements reword teacher definitions (lowercased, "means", "An"), violating the verbatim rule | `vocabulary-prototype.html:339-350` | High |
| F4 | Fill-in-blank counts a blank correct after earlier wrong tries, so 12/12 is possible with misses | `vocabulary-prototype.html:502-505` (`state.fib[k]=true` overwrites `false`) | High |
| F6 | MC correct-answer positions are fixed by hand; generated items need shuffled, de-duplicated options | `vocabulary-prototype.html:324-337` | Medium |
| F8 | 10 pictures contain text; the handoff says "Pictures must contain no text". "I promise!" (trustworthy) and "JAN/FEB/MAR $" (installment) cue the answer | `images/words/{asked,called,employee,ignorant,installment,irritating,lifted,peculiar,screamed,trustworthy}.svg` | Medium |
| F7 | 7 Oct 19 spelling words have no picture: heating, thinking, jumping, skipping, flying, dancing, amazing | `data/2026-10-19.json` | Low (needs no-picture layout) |
| N1 | Teacher definitions "Irritating — To anger or bother" and "Distracted — To prevent something from continuing as usual" are verb-style definitions for an adjective and a past-tense word. **Flag only; never edit.** | `data/*.json` | Architect review |
| N2 | FIB sentences contain article cues ("an ___" for employee, installment) | `data/*.json` `fill` | Low; acceptable in practice, review for tests |

### 5.4 Multiplication requirements evaluation
- [V] The original spec defines table mode as: for N in the 2s, **1×N, N×1, 2×(N/2), (N/2)×2**, never pairs from other tables (`zip/HANDOFF.md`, Tabs §4). The new "All Factor Pairs" mode must accept **every** positive pair, so 24 → 1×24, 2×12, 3×8, 4×6 and reverses.
- Undefined cases [V, unresolved in any source]:
  - N not in the selected table (7 in the 2s).
  - N = 0. In All Factor Pairs this has infinitely many pairs, so it must be excluded or specially handled.
  - Squares (2×2 must not be listed twice).
  - N = 1 and N = 2, where 1×N and the table pair coincide.
  - The maximum N for All Factor Pairs ([R] 1–144).
- [R] Implement factor logic as a pure function and test it exhaustively against brute force (§9).
- [V] The math terms in the Oct 19 JSON support Lessons 5-1/5-2 (distributive, commutative, identity, zero). [A] The lesson titles in the assignment come from the class textbook; only titles may be used, and all content must be original.

## 6. Privacy and Copyright Findings

| # | Item | Finding | Safe alternative [R] |
|---|---|---|---|
| P1 | `images/newsletters/*.jpg` | [V, viewed] No student names. Phone photos show household background (desk, keyboard). The Oct 12 photo shows other papers at the edges, including part of a math page and a partial handwritten mark (top right). [A] The teacher's template probably uses licensed clip art | **Do not import.** Render the Newsletter section from JSON (it already holds every field). Publish a cropped image only with owner approval |
| P2 | `reference/design-mockup/*` | [V] Header shows a first name + "3rd grade", which reads as a student profile line | Keep local/private; if imported, redact the name |
| P3 | Features conflicting with no-accounts / no-tracking | [V] localStorage: `vocabulary-prototype.html:380,520` (last tab); `spelling-test-prototype.html:236,251` (last score). Mockups: "Checkmarks save on this device" (`Homework.dc.html`), per-table "Got it / Learning" progress (`Multiplication.dc.html`), "+ Add a page" upload (`Homework.dc.html`) | Remove storage; keep state in memory for the open page only; keep the week in the URL hash; no uploads |
| P4 | Names in example sentences | [V] Ms. Lee, Sam, Maya, Jordan (`data/*.json` `fill`). [A] Fictional | Owner confirms none is a classmate or staff member |
| P5 | Owner's full name | [V] the owner's full name in `zip/HANDOFF.md` | Owner confirms before importing to `docs/original-handoff/` |
| P6 | Third-party request | [V] Google Fonts is the only external resource (`index.html:10-12`) | Self-host Baloo 2 + Atkinson Hyperlegible (both OFL) |
| P7 | Textbook content | [V] None in the archive | Titles only; original explanations and problems |
| P8 | Secrets / metadata | [V] No keys, tokens or passwords; no EXIF/GPS in the photos | — |
| P9 | Public exposure | [V] Pages serves the whole repo root, so anything committed (including `reference/`, `docs/`) becomes public | Commit only reviewed assets |

## 7. Technical Architecture Recommendations

### 7.1 Missing `support.js` [V — investigated]
- Every `.dc.html` loads `<script src="./support.js">` (line 6). The file is not in the archive, and no copy exists in the extracted handoff.
- The files use `<x-dc>`, `<helmet>` and a `text/x-dc` script with `class Component extends DCLogic { renderVals() { return {}; } }`. This is the runtime of the design-canvas tool that produced them (`canvas.json`, title "Help Study Hub").
- Each component's logic is empty, and all content is static inline-styled markup (59 `style=` attributes in `Main.dc.html`). Without `support.js` a browser still shows the content and styles, only without canvas layout. This matches the handoff's note that the mockups can be viewed "roughly".
- **Conclusion:** this is not a dependency of the application. Do not recreate it. Treat the mockups as visual reference only.

### 7.2 Weekly data-loading architecture [R]
1. On start, fetch `data/weeks.json` (relative path), then fetch `data/<id>.json` for the selected week. Keep the original file format unchanged.
2. Selected week = `?week=<id>` in the URL hash, else `weeks.json.current`. No storage, and links can be shared.
3. Routes: `#<section>[/<sub>]` for the 7 sections; the week picker re-renders the current section.
4. One in-memory store; every view is a pure render function of `(week, route)`.
5. Validate the week file on load (same rules as the automated test). If invalid or missing, show a friendly message instead of a blank page.
6. Static content (`data/math/unit5.json`, `data/quickmath/levels.json`) is loaded the same way and is independent of the week.
7. Plain ES modules, with no build step and no dependencies. The logic in `js/lib/` stays DOM-free so it can be unit-tested in Node.
8. Escape all data before inserting it into HTML (fixes F5: `vocabulary-prototype.html:386-392,454-456`).

### 7.3 Test reuse [V]
`Projects/Word-Workshop` uses `node --test "tests/unit/*.test.mjs"` plus `node tests/browser.test.mjs` (headless Chrome), with **no** npm dependencies (`package.json`). Node v26.5.0 is installed. [R] Reuse this pattern.

## 8. Proposed Repository Structure [R]

```
Study-Scoop/
  index.html                  original shell → 7 sections
  css/style.css, css/print.css
  js/app.js                   router + week loader
  js/lib/                     pure logic: escape, shuffle, grading, factors, quickmath, questions, validate
  js/views/                   week, spelling, vocab, math, quickmath, homework, newsletter
  data/weeks.json             unchanged format
  data/YYYY-MM-DD.json        unchanged format
  data/math/unit5.json        after content approval
  data/quickmath/levels.json  after spec approval
  images/cone.svg, images/words/
  images/newsletters/         owner-approved images only
  fonts/                      if self-hosting is approved
  reference/                  original prototypes, verbatim, not linked from the site
  docs/                       HANDOFF-IMPORT.md, original-handoff/, CONTENT-GUIDE.md, DECISIONS.md, TESTING.md
  tests/unit/*.test.mjs, tests/browser.test.mjs
  package.json                scripts only, no dependencies
  .gitignore                  private/, local-fixtures/, tests/output/
```
Private, review-pending material (newsletter photos, vocabulary sheet, mockups) stays outside the repo or in a git-ignored `private/` folder.

## 9. Testing and Validation Strategy [R]

| Area | Automated (deterministic) | Manual |
|---|---|---|
| Data | Schema and consistency checks from §5.1 run on every week file; a fixture third week renders every section with no code change | Owner checks definitions against the sheet each week |
| Math | Exhaustive 0–12 × 0–12; every generated question recomputed independently; vertical layout factors/product | Architect reviews lesson text |
| Factors | All Factor Pairs = brute force for N 1–144 (both orders when equations are asked for; e.g. 1×24 and 3×8 accepted); My Table per table × N per approved rules; squares not duplicated; 0/1 as ruled | — |
| Quick Math | Seeded generators; answer and range checks per level | Child try-out |
| Spelling | Normalisation (case/whitespace only, no fuzzy accept); test mode reveals nothing before the end; misses list exact | Speech on Chromebook, iPad, phone |
| Vocabulary | On-screen definition equals JSON character for character (owner-approved golden snapshot); MC options unique with one correct; FIB scored on first attempt | — |
| Timers | Fake clock: off by default; start/pause/stop; no effect on scoring unless chosen | — |
| Layout | 360×740, 768×1024, 1366×768, 1920×1080: no horizontal scroll; targets ≥ 44 px | Real phone, iPad, Chromebook |
| Accessibility | Keyboard-only completion of every activity; visible focus; labels; `aria-live` feedback; computed contrast in both themes | Screen-reader pass per section |
| Print | Print-media emulation: no large solid fills, nav hidden | Black-and-white printout |
| Privacy | After a full walkthrough: no localStorage, sessionStorage, cookie or IndexedDB writes; only same-origin requests (+ fonts if kept); repo scan for keys, analytics and storage APIs | Owner reviews content before merge |
| Regression | Full suite on every PR; prototype behaviours captured as tests before porting | — |

## 10. Risk Register

| Level | # | Risk | Evidence | Mitigation |
|---|---|---|---|---|
| Critical | R1 | Newsletter photos or mockups imported to the public repo, exposing household or student-identifying details | §6 P1, P2 | Hold back; owner decision B1/B2 |
| Critical | R2 | Following the archive's "publish with GitHub Pages" step exposes unreviewed content | `zip/HANDOFF.md` "Publish steps" | Superseded (B13); Pages only with owner approval |
| High | R3 | Vocabulary definitions shown incorrectly (unverifiable without the sheet; T/F rewording) | §5.1, F3 | B4; verbatim golden-snapshot test |
| High | R4 | Inflated or incorrect scores | F4, F6 | Fix on port; grading tests |
| High | R5 | Valid factor pairs rejected, or wrong pairs in My Table | §5.4 | B6 rulings; exhaustive tests |
| High | R6 | Persistent storage carried over from prototypes | §6 P3 | Remove; privacy test |
| High | R7 | Math Chapters / Quick Math built without an approved spec, producing inaccurate or textbook-copied content | §4 | B7, B8 before P7/P8 |
| Medium | R8 | Picture text cues quiz answers | F8 | B5 |
| Medium | R9 | Oct 23 purple words unknown, so quiz filter is incomplete | §5.1 | B3 |
| Medium | R10 | Speech voices vary or are missing on some devices | `spelling-test-prototype.html:148-154` | Fallback message (exists); device testing |
| Medium | R11 | Countdown dates wrong across timezones | `tests[].date` strings | Parse as local dates; tests |
| Medium | R12 | Unescaped data breaks the page | F5 | Escape helper; test |
| Medium | R13 | Third-party font request | P6 | B11 |
| Low | R14 | Missing pictures for 7 words | F7 | No-picture layout |
| Low | R15 | Mockups don't render as designed (`support.js`) | §7.1 | Reference only |
| Low | R16 | Duplicated art (inline `ART` vs files), duplicate START_HERE doc, duplicate commits | `vocabulary-prototype.html:266-320` | Use files; ignore duplicates |

## 11. Recommended Implementation Sequence

Each step is one PR on a feature branch, followed by Architect review and owner approval.

1. **Assignment 002: import + foundation + baseline tests** (§14)
2. Spelling port (data-driven, rule groups, flashcards, print, misses)
3. Vocabulary port (fix F3–F6, filters, test mode, misses, print)
4. This Week, Homework, Newsletter (data-rendered) + archive
5. Multiplication Mastery + Find My Factors (after B6)
6. Math Chapters 5-1, 5-2 (after B7 and approved lesson content)
7. Quick Math, six levels (after B8)
8. Hardening, real-device testing, rollback plan, release candidate → owner decides on Pages

## 12. Unresolved Blockers

| # | Decision | Who | Recommendation | Blocks |
|---|---|---|---|---|
| B1 | Newsletter photos: never / cropped / as-is | Owner | Never as-is; render from JSON | Import of photos |
| B2 | Mockups: private / redacted / public | Owner | Private | Import of mockups |
| B3 | Oct 23 purple words | Owner | Leave unmarked until known | Step 3 |
| B4 | Vocabulary sheet photo for verification (kept out of repo) | Owner | — | Step 3 sign-off |
| B5 | Keep word pictures with text? | Owner + Architect | Hide pictures in scored tests | Step 3 |
| B6 | Find My Factors rules (§5.4 cases, max N) | Architect | All Factor Pairs N 1–144 | Step 5 |
| B7 | Lesson 5-1/5-2 objectives (owner's words, no scans); "Topic 5" vs "Unit 5" | Owner + Architect | "Topic 5" (newsletter wording) | Step 6 |
| B8 | Quick Math spec (ranges, "Make the Next 10" meaning, strategies, test format) | Architect | — | Step 7 |
| B9 | Zero storage confirmed; misses list lasts only while the page is open | Architect | Confirm | All |
| B10 | Approve multi-file ES modules + dev-only test scripts | Architect | Approve | Assignment 002 |
| B11 | Google Fonts vs self-hosted | Architect | Self-host | Assignment 002 (optional) |
| B12 | Example-sentence names are fictional | Owner | — | Import of data |
| B13 | Archive's Pages instruction superseded | Owner | Yes | — |
| B14 | Current week: manual `current` field vs automatic by date | Architect | Manual | Assignment 002 |

## 13. Final Readiness Assessment

**PASS WITH ISSUES.**
- Ready to import the safe files and build the foundation once B10, B12 and B14 are answered. B1/B2 are satisfied by holding those items back.
- Not ready for feature work in Math Chapters, Quick Math or Find My Factors (B6–B8).
- Not ready for release or Pages (no app code yet; R1/R2).

## 14. Proposed Development Assignment 002 (not started)

**Title:** Safe import, data-driven foundation, 7-section navigation, baseline tests.
**Branch:** `feature/foundation` from `handoff/import`. PR to `handoff/import` (or `main`, as the Architect directs). No merge or deploy.

**In scope**
1. **Commit A, verbatim import (no edits):** `index.html`, `data/weeks.json`, `data/2026-10-12.json`, `data/2026-10-19.json`, `images/cone.svg`, `images/words/*.svg` (27), `reference/vocabulary-prototype.html`, `reference/spelling-test-prototype.html`. Original `HANDOFF.md`, `CLAUDE.md`, `README.md` go to `docs/original-handoff/` (pending P5).
2. **Commit B, foundation:**
   - `index.html` navigation → 7 sections (This Week, Spelling, Vocabulary, Math, Quick Math, Homework, Newsletter).
   - Hash router and week loader per §7.2, with the week picker and in-memory state only.
   - `css/style.css` with design tokens and the base layout taken from the vocabulary prototype; dark mode; print base; 44 px targets.
   - Each section shows real week data where it already exists (e.g. This Week tests/events/learning, Newsletter text). Unbuilt sections show a clear "coming soon" panel, not fake content.
   - Shared helpers: `escape`, `shuffle`, `validateWeek`.
3. **Commit C, baseline tests (no dependencies):**
   - Data validation (§5.1 rules).
   - Router/week-switch unit tests.
   - Browser tests: all 7 sections reachable by click and keyboard; week picker changes every section; no horizontal scroll at 4 viewports; no storage/cookie writes; same-origin requests only.
   - A fixture third week that loads with no code changes.
4. `STATUS.md`, `docs/HANDOFF-IMPORT.md` (imported vs held back), `docs/TESTING.md`.

**Out of scope:** porting spelling/vocab activities, math/factor/Quick Math logic, newsletter photos, mockups, font self-hosting (unless B11 is approved), GitHub Pages.

**Acceptance criteria:** prototypes byte-identical to the archive; all tests pass; no localStorage, cookies or third-party requests other than fonts; 7 sections keyboard-navigable; evidence (test output + screenshots) in the PR.

---

### Files reviewed
`repo/`: `README.md`, `CLAUDE.md`, `STATUS.md`, `docs/HANDOFF-IMPORT.md`, git log/branches, GitHub repo + Pages API.
`zip/`: `1_START_HERE_Handoff.md`, `HANDOFF.md`, `CLAUDE.md`, `README.md`, `index.html`, `data/weeks.json`, `data/2026-10-12.json`, `data/2026-10-19.json`, `images/cone.svg`, `images/words/*.svg` (27, scanned for text/scripts), `images/newsletters/*.jpg` (viewed; metadata checked), `reference/spelling-test-prototype.html` (script read in full), `reference/vocabulary-prototype.html` (script read in full; markup scanned), `reference/design-mockup/*.dc.html` (text and runtime scanned), `canvas.json`.
Reuse check: `Projects/Word-Workshop/package.json`, `tests/`.
