# Study Scoop: Build Handoff

**For:** the AI assistant (or developer) finishing this site
**From:** the Product Owner, with design and content prepared in Claude
**Date:** October 16, 2026

## What you are getting

Two things come with this document:

1. **This handoff** (the full spec is below).
2. **`study-scoop.zip`**: the starter repository. Unzip it and keep the folder structure exactly as is.

```
study-scoop/
  index.html                 page shell: drips, header, week picker, tab links (done)
  css/style.css              TO BUILD
  js/app.js                  TO BUILD
  data/weeks.json            list of weeks + which one is current (done)
  data/2026-10-12.json       Oct 12–16 content (done)
  data/2026-10-19.json       Oct 19–23 content (done)  <- current week
  images/cone.svg            logo / favicon (done)
  images/words/*.svg         27 word pictures (done)
  images/newsletters/*.jpg   the two newsletter photos (done)
  reference/vocabulary-prototype.html    WORKING prototype: copy its look and logic
  reference/spelling-test-prototype.html WORKING prototype: copy its logic
  reference/design-mockup/*.dc.html      static mockups of all six tabs
  CLAUDE.md, README.md
```

## Your job

Write `css/style.css` and `js/app.js` so that `index.html` becomes the full six-tab site described below, driven entirely by the files in `data/`. Then publish it with GitHub Pages.

Open `reference/vocabulary-prototype.html` and `reference/spelling-test-prototype.html` in a browser first. They already work and already have the look the parent approved. Port them; do not redesign.

## Publish steps

1. Create a public GitHub repo named `study-scoop` (no README, it must start empty).
2. Upload everything from the unzipped folder (keep the folders).
3. Settings → Pages → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)` → Save.
4. The site will be at `https://<github-username>.github.io/study-scoop/`. Use relative paths everywhere so it works under `/study-scoop/`.

## Done means

- [ ] All six tabs work from `data/2026-10-19.json` with no changes to HTML or data.
- [ ] The week picker switches every tab to Oct 12–16 and back.
- [ ] Every vocabulary definition on screen matches the data file character for character.
- [ ] Spelling test speaks each word and its sentence; typing box has autocorrect and spellcheck off.
- [ ] Multiplication facts are written vertically; "What makes 12" in the 2s shows only 1×12, 12×1, 2×6, 6×2.
- [ ] Nothing is stored: no localStorage, cookies, logins, or analytics.
- [ ] Works on a phone, an iPad, and a Chromebook; dark mode looks right.
- [ ] Print views use outlines, not big color fills (black-and-white printer).
- [ ] Adding a third week only needs a new JSON file, a photo, and one line in `weeks.json`.

---

# Full specification

A free weekly study site for a 3rd grade class: spelling, vocabulary, multiplication, homework, and the class newsletter. Hosted on GitHub Pages from this repo. Kids and parents just open the link and practice.

## Hard rules

- **No login and nothing saved.** No accounts, no localStorage, no cookies, no analytics, no backend. Every visit starts fresh. Scores and checkmarks last only until the page is closed.
- **Vocabulary definitions are copied word for word from the class vocabulary sheet.** Never reword, "fix", or simplify a definition, including its capitalization (e.g. "favored by or involving good luck or fortune" stays lowercase). Example sentences are ours and may be written freely.
- **Everything is driven by the weekly data files.** Adding a week must never require changing HTML or JS.
- **No children's names or personal info anywhere on the site.**
- Plain static site: HTML, CSS, vanilla JS. No build step, no framework, no npm dependencies. It must work when served from GitHub Pages at `/<repo>/`, so use relative paths only.

## Weekly update workflow

Each week the parent sends photos of the newsletter (and the vocabulary sheet when it changes):

1. Save the newsletter photo as `images/newsletters/YYYY-MM-DD.jpg` (date = the Monday of that week; resize to about 1400px on the long side).
2. Create `data/YYYY-MM-DD.json` from the newsletter. Copy the previous week's file as a starting point; the vocabulary list often carries over with a different quiz group highlighted.
3. Add the week to the top of `data/weeks.json` and set `"current"` to it.
4. Add word pictures to `images/words/<word>.svg|png` when available (optional). Pictures must contain no text.
5. Have the parent check every definition against the photo before pushing.

## Data format (`data/YYYY-MM-DD.json`)

See `data/2026-10-19.json` for a complete example. Keys:

- `id`, `label`, `newsletter` (image path)
- `learning`: `[["Math", "Properties of Multiplication / Area"], ...]`
- `tests`: `{date: "YYYY-MM-DD", kind: "math"|"vocab"|"spelling", title, detail}`; the home page counts down to these
- `events`: `{date: "Oct 29", text}`
- `homework`: `{title, due}`
- `spelling`: `pattern`, `rules` (id → label), `ruleHelp` (id → example), `words`: `{word, base, rule, sentence, img?}`
  - `rule` groups the words on the Spelling tab (e.g. -ing: `add`, `double`, `drop-e`; -ed: `t`, `d`, `ed` sounds)
  - `img` = file name in `images/words/` without extension, when the picture is shared with another word (e.g. `rushing` uses `rushed`)
- `vocab`: `title`, `quiz`, `groupsNote`, `words`: `{word, def, sentence, fill, group?}`
  - `group`: `"green"` or `"purple"` marks words on this week's quiz; words without a group are review only
  - `fill`: a fill-in-the-blank sentence with `___` where the word goes (must differ from `sentence`)
- `math` (optional): `title`, `test`, `words`: `{word, def, example: [a, b, product], fill}`

## Tabs (hash routes, one page app in `index.html` + `js/app.js`)

1. **This Week** `#week`: countdown cards for each test, homework summary, what the class is learning, newsletter preview.
2. **Spelling** `#spelling`: words grouped by rule with the rule explained; say-it-and-type-it practice test using `speechSynthesis` (number, word, sentence, word; a "say it slowly" button that never spells the word out); practice mode with feedback after each word vs. test mode with results at the end; "practice missed words"; printable sheet (print CSS). Typing input must have autocorrect, autocapitalize and spellcheck off.
3. **Vocabulary** `#vocab`: filter (quiz words / all reading words / math words); modes Study cards (picture, word, exact definition, example sentence, speaker button), Flash Cards (one at a time, flip, shuffle, meaning-first option), Multiple Choice, True or False, Fill in the Blank (word bank), Print. Quizzes check each answer immediately and keep a running score. Generate questions from the data.
4. **Multiplication** `#math`: pick a table 0–12; one plain-language rule per table (2s = "double it", 10s = "put a 0 on the end", 9s = "times 10, then take one group away", etc.); the table's facts written **vertically**; "What makes N?" fact families — for N in the 2s table that means 1×N, N×1, 2×(N/2), (N/2)×2 only, never factor pairs from other tables (12 in the 2s = 1×12, 12×1, 2×6, 6×2, not 3×4); vertical fact practice; this week's property words with dot-array pictures (commutative 4×2 = 2×4, distributive 6×3 = 5×3 + 1×3); area as a grid of squares.
5. **Homework** `#homework`: the week's homework list with checkboxes (not saved), the spelling activity choices, links to the practice tools.
6. **Newsletter** `#newsletter`: the newsletter photo (tap to enlarge), key dates, what the class is learning, and the list of past weeks.

A week picker in the header switches every tab to a past week.

## Look: ice cream drip

Match `reference/vocabulary-prototype.html` and the mockup in `reference/design-mockup/` (open the `.dc.html` files in a browser to view them roughly; the vocabulary prototype is the real reference for colors and components).

- Blue-raspberry and mint drips across the top (`index.html` already has the SVG), ice cream cone logo (`images/cone.svg`), faint colored sprinkles in the page background.
- Colors (light): background `#e8f4fd`, cards `#fffdf7`, ink/chocolate `#3d2517`, muted `#7a5e4c`, lines `#e2cfbd`, mint `#5ccfae`, berry `#3d8ef0`, word blue `#1f6fd1`, cone `#e8b46a`, quiz-group green `#1f8a4c`, purple `#7b4fd6`. Provide a dark theme via `prefers-color-scheme` (chocolate background `#1d130d`, cards `#2a1c14`, ink `#f8ecde`).
- Fonts: Baloo 2 (headings, 800) and Atkinson Hyperlegible (body), from Google Fonts.
- Big touch targets (44px+), large type for 8-year-olds, works on phones and Chromebooks.
- Printables must be black-and-white printer friendly: outlines, no large solid color fills.

## Reference files

- `reference/vocabulary-prototype.html`: working vocabulary page (study cards with pictures and sentences, flash cards, MC / TF / fill-in-the-blank, drip theme). Port its logic and look.
- `reference/spelling-test-prototype.html`: working say-and-type spelling test. Port its logic.
- `reference/design-mockup/`: static mockups of all six tabs.

The prototypes use localStorage for small conveniences; the real site must not.

## Status

Done: `index.html` shell (drips, header, week picker, tab links), weekly data for Oct 12–16 and Oct 19–23, word pictures, newsletter photos, cone icon.

Still to build: `css/style.css` and `js/app.js` (all six tabs). Then enable GitHub Pages (Settings → Pages → deploy from `main`, root).

Open question: the Oct 19–23 quiz covers "green and purple words" but only the green words (Employee, Fortunate, Ignorant, Melancholy) are known. Ask the parent which words are purple.
