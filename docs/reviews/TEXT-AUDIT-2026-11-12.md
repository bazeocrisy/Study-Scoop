# Study Scoop text, grammar and accuracy audit (2026-11-12)

Owner brief: "Complete Text & Grammar Audit". Branch `feature/text-accuracy-audit`, built on the Chapter 7 branch
(`feature/chapter-7-teacher`). Production (`main`) is unchanged. This is a quality-control pass, not a redesign.

## 1. How the audit was done

Six independent reviewers worked in parallel. Each used their own scripts and read the text and the images directly.
Their full tables (every finding, with location, original text, problem, recommended correction and severity) are in
`docs/reviews/text-audit/`. A child's name was redacted from those tables.

| Review | Scope | Read |
|---|---|---|
| Grammar: weekly content and UI | 5 week files, weeks.json, homework, tests, 8 reading stories, pictures.json, index.html, all views and players, labs and game text | Most files read in full. The rest of the code went through a text filter (see `grammar-weekly-ui.md`). |
| Grammar: math lessons | 20 lesson files, practice, Chapter 7 pack, lesson index, Lesson 7-1 journey | 17,853 strings, deduplicated to 5,012 templates; every template read |
| Vocabulary meaning and source fidelity | Week data against the three available newsletter flyers (10-26, 11-02, 11-09), tests, generated practice, reading, alt text, dates | All three flyers compared word by word |
| Mathematics and answers | Chapters 5–6 lessons, practice, math tests, Chapter 7 pack, homework, Quick Math facts, the multiplication game | About 1,000 items recomputed by hand and graded with the real checker (Chapter 7 lessons: 237 items, verified earlier the same day) |
| Visual: flyers, homework, PDF, labs | 6 flyer pages, 12 worksheet images, the 4-page PDF, 2 lab grids, cone.svg, images embedded in the game and labs | Every text region enlarged and read letter by letter |
| Visual: word pictures | All 134 files in images/words | Every image viewed. 27 SVGs were checked from their markup (no rasterizer was available). |

An independent reviewer then re-checked every correction. A separate QA tester checked the changed pages in a browser.

## 2. Summary

| | Critical | Major | Minor |
|---|---|---|---|
| Findings (rows; one row can cover many repeated strings) | 6 | 58 | 190 |
| Fixed in this branch | 1 | 43 | about 60 (all homework capitals, grammar templates, wording) |
| Teacher-source, kept and reported (with a student-facing note) | 1 | 3 | 8 |
| Not fixed, owner decision or new artwork needed | 4 | 9 | the rest (style and consistency) |

Some rows overlap: the same error was found by more than one reviewer, so the counts are approximate.

## 3. Critical and Major findings and their status

| Location | Original | Problem | Correction | Severity | Status |
|---|---|---|---|---|---|
| All 5 week files, Distracted `def` | "To prevent something from continuing as usual" | Teacher definition describes "interrupt", not "distracted". The 10-12, 10-19 and 10-26 weeks had no note. | Teacher wording kept; plain-words note added to every week | Critical | Teacher source; note added |
| chapters/7.json practice items 24 and 28, test item 16 (14 strings) | "Each whole has 1 equal parts. 2 parts are selected, so the fraction is 2/1." | Agreement; makes no sense | "Each shape is 1 whole. 2 wholes are selected, so the fraction is 2/1." (template) | Critical | Fixed |
| images/words formed, inform, misinform, uninformed (.webp) | Non-Black children | Breaks the owner's picture rule | Regenerate, or stop publishing. These files are **not shown** on any page (the 11-09 lab atlas pictures take priority) but are published | Critical | Owner decision |
| Trustworthy, Irritating `def` (5 weeks) | "The ability to keep promises", "To anger or bother" | Noun or verb definition for an adjective | Plain-words note added | Major | Teacher source; note added |
| homework 11-09 (4 strings) | "1 steps from zero" | Agreement | "1 step" | Major | Fixed |
| homework 11-02 | "1 of the 5 objects have dots" / "Count 1 marked objects" | Agreement | "has a dot" / "1 marked object" | Major | Fixed |
| homework 11-02 (34 strings) | "two-fifths means 2 parts out of 5." | Sentence starts in lower case | Capitalized | Major | Fixed |
| tests 10-26, 11-02 c22 | "Which find the area of the picture?" | Missing noun, and it does not say there can be more than one answer | "Which expressions find the area of the picture? Choose all that apply." | Major | Fixed |
| js/views/skills.js | "practise" | British spelling | "practice" | Major | Fixed |
| Multiplication game | "1 rows. 1 squares in each row." | Plurals | Singular for 1 | Major | Fixed |
| Multiplication game, Missing Number | 0 × ☐ = 0 accepts only 0 | Any number is correct | Any whole number accepted | Major | Fixed |
| Times App "Find It" | Only the stored pair accepted (12 = 3 × 4 rejected on a 2 × 6 card) | Correct answers marked wrong | Every true fact from the chosen families accepted (the live handler and the test use one function) | Major | Fixed |
| 6-4 x1 (and g1, g2, t1, t3; 6-6 t16) | 9 + 12 = 21 marked wrong | Correct order-swapped answer rejected | Either order accepted | Major | Fixed |
| chapters/7.json p502, x502 | "Count the 1 whole-size parts shown" (number line, point at 3) | False for the picture | "The space from 0 to 1 is 1 whole. Count the whole jumps from 0 to the point." | Major | Fixed |
| chapters/7.json p206 | 2/3 rejected (key 4/6) with no instruction | Unfair | Prompt now says to use the equal parts shown | Major | Fixed |
| reading raindelay, umpire | "makes the rules clear in a game" | Wrong meaning | "watches the game and decides if each play follows the rules" | Major | Fixed |
| reading busybees | "a sweet juice from flowers called nectar" | Misplaced modifier | "From the flowers, they drink a sweet juice called nectar." | Major | Fixed |
| reading leafcolor, cause | Evidence sentence says "food"; only "green"/"chlorophyll" accepted | Child marked wrong for copying the evidence | "food" accepted | Major | Fixed |
| 10-26 Topic 6 test (week file, test note, Test Center) | "Math Topic 6 Vocabulary Test" | The 11-02 flyer calls it the Topic 6 Area Test | "Math Topic 6 Area Test (study the vocabulary words)"; Math Vocabulary card "Helps with class test" | Major | Fixed |
| tests 10-26 v16 | "I was distracted when the class was interrupted." | Teaches the mismatched meaning | "I was distracted from my reading when a dog barked outside." | Major | Fixed |
| Fill in the blank word bank | "peculiar" could also fit melancholy and irritating sentences | Two right answers; the child is told one "does not fit" | `alsoFits`: such words never share a bank (tested) | Major | Fixed |
| 11-09 spelling lab, "formal" | Knight in armor at a dinner | Teaches the wrong meaning | Cell replaced with the reviewed tuxedo picture; alt text updated | Major | Fixed |
| images/flyers/2026-11-09-back.webp | "VOCAPULARY" | Misspelled heading in the owner-supplied clean image (earlier weeks' template spells it correctly) | Letter repaired to "VOCABULARY"; only that letter changed; re-inspected | Major | Fixed (please confirm) |
| images/homework/2026-11-09-clean-greater-than-one.webp | "1" and "2" touch 3/3 and 6/3 | Reads like exponents or mixed numbers | Re-letter the worked example | Major | Owner decision (owner-supplied recreation) |
| extract.webp | Light-skinned hands | Picture rule | Regenerate (not shown on any page; the 11-09 atlas is used) | Major | Owner decision |
| fortunate.webp | Girl under an umbrella in the rain | Reads as "rainy day", not good luck | Regenerate | Major | Owner decision (needs new artwork) |
| Chapter 7 templates (zero denominator, equivalent fraction, written-answer notes, "inspect", "membership", "repartitioned", "highlighted point", 7-4 and 7-5 garbled lines, 7-3 agreement, 7-1 "joined in pairs" prompt and hint) | e.g. "Count the visible equal parts for a positive bottom number." | Adult, garbled or misleading | Plain child-sized wording in the generator (`chapter7-release.mjs`, `chapter7-resources.mjs`) | Major (about 20 rows) | Fixed |
| Lesson index, 7 summaries | "make and recognize…" | Lower case shown as a sentence | Capitalized | Major | Fixed |
| math-words.json choice 10–14 | `Which property says: "…".` | Question without a question mark | `Which property says this? "…"` | Major | Fixed |
| 6-4 t6, 6-5 learn screen 6 | "a part that has no area in her work"; "multiplying the original dimensions" | Confusing or adult | Reworded | Major | Fixed |
| 7-1 and 7-4 yes/no questions | Option "The colors alone decide whether the pieces are equal." | Not a yes/no answer | Kept: a deliberate misconception distractor beside both Yes and No | Major | Not changed (design) |
| Area words | "Square Unit" (teacher) vs "unit square" (glossary) | Two names for one idea | Needs an owner or teacher choice | Major | Owner decision |

The Minor rows (style, serial commas, curly versus straight quotes, periods outside quotation marks, ISO dates in lab
notes, photo smudges and glare on flyers, cut-off labels on 9 word cards, generic alt text, brand look-alikes in pictures)
are listed with their status "open" in `docs/reviews/text-audit/`. None changes a meaning or an answer.

## 4. Teacher-source issues (kept; reported to the owner)
- **Distracted, Trustworthy, Irritating definitions:** each has a plain-words note.
- **Melancholy:** defined as a noun, while Study Scoop's sentences use it as an adjective.
- **Constellations:** a plural word with a singular definition.
- **Installment:** the definition describes a payment plan, not one payment.
- **Flyer typography:** "Winn Dixie" has no hyphen; the denominator definition has no final period; lower-case definitions.
- **"12 units":** written instead of square units on the 10-26 Draw the Area sheet (Study Scoop already says square units).
- **Healthy Eating passage:** "its helps".
- **Quiz word list:** the same 12 words are listed for both the 11/6 and 11/13 quizzes (please confirm with the teacher).

## 5. Could not be verified
- **10-12 and 10-19 weeks:** no flyer images in the repository, so spelling lists, definitions, groups and events could not be compared.
- **Raw photos:** the original photos are not in the repository, so the origin of an image error is inferred, not proven.
- **Homework originals:** the 10-12 and 10-19 worksheets are private; the 11-09 sheets could only be compared with the owner-supplied recreation.
- **10-26 Area sheet:** the tiny publisher credit is unreadable at the available resolution.
- **SVG pictures:** read from their markup, not rendered.

## 6. Prevention
- `npm run proofread` (`scripts/proofread.mjs`), also run by `npm test`. It covers every data file, the vocabulary entries and notes, and the text in the site code, game and labs, and it must report 0 Study Scoop findings.
- `docs/PROOFREADING.md` sets out the full procedure, including visual verification of every published image with words and the handling of teacher originals.
- The `update-week` and `build-chapter` skills now require the gate.
- The "Study Scoop Weekly Manager" plugin was not available in this session, so its requirements were restated from the brief.

## 7. Tests
See the pull request for the final run. Unit tests (380, including the gate and `tests/unit/text-audit.test.js`) pass.
