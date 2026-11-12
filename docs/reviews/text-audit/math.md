# Study Scoop: math and answer-accuracy audit (Chapters 5 and 6, practice, tests, Chapter 7 pack, homework, fact games)

Read-only audit. Branch: feature/chapter-7-teacher. `npm test` was run first: 373 of 373 tests pass, so the built-in validators (answer keys, picture areas, `pictureMatch`, `target`, `areaOptions`, prose arithmetic) are clean.

On top of that, I recomputed every item by hand from its numbers and its picture model. The scratch dumpers are in `scratchpad/audit/math/`. They print each item's answer through the real `answerText`/`solution`, the array size, the grid tiles and area, and the shape's rectangles, area, bounding box and side labels. I then ran the real grader `check()` on alternate and typical wrong answers (`grader.mjs`), scanned every hint for box values (`hints.mjs`), and checked every teacher definition against the week files (`defs.py`).

**Result: no Critical errors.** Every answer key matches its numbers and its picture. Every multiple-choice item has exactly one correct option (or the intended set). Every wrong-option "why" I read is mathematically true. Every teacher definition matches the week file word for word: Distributive and Commutative (2026-10-19), Area, Square Unit and Multiply (2026-10-26 and 2026-11-02), and denominator, unit fraction, numerator and fraction (2026-11-09). No scored test has hints: lesson `test` sections, `data/tests/*.json`, the Chapter 7 test and the area vocabulary test pool all checked. The Math Vocabulary and Skill Builders tests strip hints in code. No British spellings appear in child-facing text; "practise" occurs only in code comments in js/lib/skills.js. No area answer is labeled with a length unit.

## Findings

| Location (file + item id) | Original text | Problem | Recommended correction | Severity |
|---|---|---|---|---|
| games/multiplication-mastery-8.html, Missing Number mode, fact 0×0 (`renderQuestion`/`submitAnswer`) | Shows `0 × ☐ = 0`; correct only when the child enters `f.a` (0) | When a = 0 and b = 0 every number makes the equation true, but only 0 is accepted. A child who types 7 is marked wrong. (Facts 0×b with b > 0 show `b × ☐ = 0` and are fine.) | Skip the 0×0 fact in Missing Number mode, or accept any value when the shown factor is 0. | Major |
| js/lib/skills.js `timesFamilyFind` + js/activity-player.js `find-check` (Times App "Find It") | "The answer is 12. What two numbers were multiplied?" | Only the stored pair (in either order) is accepted. With several families selected, different stored pairs give the same prompt: [2,3] gives 12 from 2×6 and from 3×4, also 18 and 24; [4,6] gives 12, 36 and 48. Selecting family 0 gives 13 prompts that all say "The answer is 0". A correct in-family answer such as 3 × 4 on the 2×6 card gets "Try again! Think about the facts you picked." Ambiguous question; the grader rejects valid answers. | Accept any pair with x × y = P where x or y is a selected family; or remove duplicate products from the deck; or give a clue in the prompt ("One number is 2"). | Major |
| data/chapters/7.json practice p502, teaching.steps[1] (line model, point = 3) | "Each complete shape is 1 whole. Count the 1 whole-size parts shown." | False for this picture. It is a number line, not shapes, and the point is 3 whole-size intervals from 0, not 1. The wording is shape-template text on a line model. | "Each interval from one whole number to the next is 1 whole. Count the 3 whole-size intervals from 0 to the point." | Major |
| data/chapters/7.json test x502, teaching.steps[1] (line, point = 2) | "Each complete shape is 1 whole. Count the 1 whole-size parts shown." | Same template error (the picture shows 2 intervals to the point). It appears in post-test explanations. | "Count the 2 whole-size intervals from 0 to the point." | Major |
| data/chapters/7.json practice p206 (answerPolicy: partition) | "The four highlighted parts are the pieces left over. Write the fraction of this whole strip that is left over." Key 4/6 | This is the only partition-policy fraction item without "Use the number of parts in one whole shown by the model as your denominator." The equal answer 2/3 is rejected with "Count the selected parts and the equal parts in one whole." | Add the standard denominator sentence, or set answerPolicy to "value". | Major |
| data/lessons/6-4.json test x1 (blanks) | `6 × 2 = [a]` / `3 × 3 = [b]` / `[p1] + [p2] = [t]` | `9 + 12 = 21` (the partial areas in the other order) is marked "2 boxes are not right yet", although the sum is true and adding in either order gives the area. The 5-x lessons accept swapped partial products. This is a scored test item. | Add `"accept": [{"p1": 9, "p2": 12}]` (merged with the other boxes). | Major |
| data/lessons/6-4.json g1, g2, t1, t3; data/lessons/6-6.json t16 | `[p1] + [p2] = [t]` (6-6: `[a2] + [b2] = [t]`) | Same as x1: reversed addends are rejected (checked with g1: 6 + 8 = 14 rejected). Practice stages. | Add the swapped `accept` entry. | Minor |
| data/lessons/6-5.json g1, g2, g4, t1–t8, t18, t19, x1, x2, x8; data/tests/2026-10-26.json and 2026-11-02.json c18 | e.g. `4 × 8 = 4 × [a] + 4 × [b] = [p] + [q] = [t]` | A fully consistent reversed split (4 × 3 + 4 × 5 = 12 + 20 = 32) is rejected. The prompt does say "Break 8 into 5 + 3", so this is defensible, but it is inconsistent with Chapter 5, which accepts either order. | Optional: accept the reversed split. | Minor |
| data/lessons/5-7.json try t4 | Hint 2: "Count by 4s three times: 4, 8, 12." | The hint states the final answer (12). | "Count by 4s three times. Say the numbers out loud." | Minor |
| data/lessons/5-1.json g2; g3. data/lessons/6-5.json t16. data/practice/math.json b6, b7, b13, b14 | "…3 × 3 = 9." (q = 9); "The right part is 5 rows of 1." (d = 1); "Multiply 4 × 7 for the second part" (b = 7); "Find 4 × 5. Then add it to 25." (a = 4); "Find 3 × 4…" (a = 4); "Find 1 × 7…" (a = 1); "Find 4 × 4…" (a = 4) | Each hint states the value to type in a box. | Ask instead: "How many columns are right of the line?"; "Find 3 × 3."; "5 and what number make 9? Multiply that by 5." | Minor |
| Decompose / open-fill hints: 5-1 g6, t1, t6, t15; 5-2 g4, t11; 5-3 g6, t10; 5-4 g6, t10, t11; 5-5 g6, t10, t15; 5-6 g6, t11; 5-7 g6, t10; math.json b4, b5, b19, b20 | e.g. "5 × 4 + 4 × 4. Then add." | The second hint gives four of the five boxes. Acceptable for open items, but it turns the item into copying. | Make the second hint a strategy only: "Write two facts that keep the 4. Then add." | Minor |
| data/lessons/5-1.json try t17, t18 (planned mistakes) | t17 {"x":4}: "Do not forget the 2 × 8. 2 and 4 make 6."; t18 {"x":3}: "There are two 7 × 3 facts. 3 and 3 make 6." | The feedback states the answer (6). | "…What do 2 and 4 make?" / "What do 3 and 3 make?" | Minor |
| js/lib/skills.js `timesHelp` (×11, other ≤ 9) | Hint: "× 11: write the digit 7 twice." | For 7 × 11 the first hint is effectively the answer (77). | Move "write the digit twice" into Show me how; make the hint "Break 11 into 10 + 1." | Minor |
| data/lessons/6-4.json learn.screens[6] ("No overlaps") and screens[7] ("Gaps and left-out parts") | Screen 6 shows a correct T split (no overlap is pictured). Screen 7: "This figure has a top part, 6 × 2 = 12, and a stem, 2 × 3 = 6…" | Screen 6 never shows an overlap. Screen 7 says "This figure" but has no picture (it means the T on screen 6). | Add an overlap non-example to screen 6 and the T model to screen 7. | Minor |
| data/lessons/6-4.json learn.screens[11], try t7; data/tests/2026-10-26.json and 2026-11-02.json c15, c23 | "Find the missing side first. Then find the area…" | In every one of these the area can be found from the labeled sides without the ? side (e.g. 7 × 2 + 3 × 3). The text implies the missing side is needed. | Put the ? on a side that the split actually uses (e.g. the height of a part), or say "the ? side is not needed for this split". | Minor |
| data/lessons/6-4.json together g5, option 2 why | "Most L shapes can be split across or up and down." | Every L made of two rectangles can be split both ways. | "Every L shape can be split across or up and down." | Minor |
| data/lessons/5-1.json test x7 | "Do 5 × 4 + 2 × 4 and 7 × 2 + 7 × 2 make the same product?" | These are sums of products, not single products. | "…make the same total?" | Minor |
| data/lessons/6-6.json together g5, option 1 why | "Max is right too: the panels together are 6 long and 4 wide." | The story never says the panels are placed side by side along their 2-unit sides. (24 is right either way: (3 × 2) × 4.) | Add "placed side by side" to the prompt, or explain with grouping. | Minor |
| data/lessons/6-5.json try t10, option 2 why | "5 + 10 + 5 + 5 — Adding sides does not find area." | 5 + 10 + 5 + 5 is not the sides of a 15 by 5 rectangle. | "Adding numbers does not find area." | Minor |
| data/chapters/7.json p201, p301, p501, p502, p505, p701, p702, x501, x502 (show/yes/explain); data/homework/2026-11-02.json s1; data/homework/2026-11-09.json m3, m5 | "1 parts are selected", "1 objects are selected", "Each whole has 1 equal parts", "The point is 1 intervals from zero", "1 of the 5 objects have dots", "Count 1 marked objects", "1 steps from zero" | Singular/plural errors in generated sentences. | Pluralize by count (as js/lib/skills.js `plural` does). | Minor |
| data/chapters/7.json p405 step; p704 wrong (tooHigh) and hint; p104 | "Count the 8 parts inside ONE outline" on a number line; "Count spaces inside the cuts" for a set of objects; "do not count boundary marks as parts" for a set; p104 says "A square is cut…" but its teaching pictures are a strip | The template wording does not match the model. | Use the line, set or square wording for each model. | Minor |
| data/chapters/7.json test x403 | "Which fraction can name one complete lantern panel?" (1/6, 6/6, 5/6) | The prompt never says the panel has six equal parts. | "A lantern panel has six equal parts. Which fraction names the complete panel?" | Minor |
| data/practice/area.json vocab.words (Square Unit, teacher; Unit Square, review) | "a square that is 1 unit tall and 1 unit wide" vs "a square whose sides are each 1 unit long" | Two cards define the same object under two names. No question pits them against each other (checked), but flashcards and Review My Words may confuse. | In the Unit Square kid text, add "It covers one square unit." | Minor |
| data/practice/area.json vocab.fill vf20 | "If tiles have gaps, some of the inside is not counted, so the ___ comes out too small." (area) | The area does not change; the count does. | "…so the area you find comes out too small." | Minor |
| data/practice/math-words.json (tf-def, meaning, fill-def) | e.g. "The Commutative Property says: 'Changing the order of the factors does not change the product.'" | Not wrong, but this differs from the teacher definition in 2026-10-19 ("the order of the factors does not matter. The product will stay the same"). The lessons show the teacher's words. | Optional: label these as Study Scoop wording, or add the teacher's sentence for Distributive and Commutative. | Minor |
| Subtraction sign: 6-1 t11, t12, x5; 6-4 learn screens[9]–[11], g6, t13, t18, x6, x9; 6-6 watch C, g4, t11, t20, x5; tests c15, c17, c23, c26; 7.json fluency f33–f35; js/lib/area.js CH6_GUIDE | "12 - 7 = 5", "731 - 268 = ?" | A hyphen is used as the minus sign; Chapter 5 uses "−". | Use "−" in child-facing text (the arith parser would need to accept it). | Minor |
| data/lessons/6-5.json t4, t5, t17, g4, x8 | Areas 112, 136, 126, 104, 128 | Products above 100. Allowed under 3.MD.7c, but beyond 3.OA.7 fluency within 100. Note only. | Optional: keep one side ≤ 10 so products stay ≤ 100 in the test. | Minor |

### Outside math scope (for the lead)
- games/multiplication-mastery-8.html embeds a photo described as "[child name] II in his GA cap and jersey" and is titled "[child name] #21". It also saves quiz sessions in `localStorage` ("Scores are saved only in this browser"). In a public repository this may conflict with CLAUDE.md (no identifiable student information; the only approved persistent data is Lesson 7-1 progress, D29). Recommend a privacy review.

## Items verified per file
Each number is the count of question objects (items with a type and prompt) whose answer, options and explanations I checked. Non-item teaching text (learn screens, watch steps, parent notes, guides) was also read and its arithmetic checked.

| File | Items |
|---|---|
| data/lessons/5-1.json | 40 |
| data/lessons/5-2.json | 38 |
| data/lessons/5-3.json | 39 |
| data/lessons/5-4.json | 40 |
| data/lessons/5-5.json | 40 |
| data/lessons/5-6.json | 40 |
| data/lessons/5-7.json | 39 |
| data/lessons/6-1.json | 41 |
| data/lessons/6-2.json | 40 |
| data/lessons/6-3.json | 40 |
| data/lessons/6-4.json | 41 |
| data/lessons/6-5.json | 40 |
| data/lessons/6-6.json | 41 |
| data/practice/math.json | 68 |
| data/practice/area.json | 124 (20 find, 20 words, 60 vocab practice, 24 vocab test pool) + 8 word cards |
| data/practice/math-words.json | 90 |
| data/tests/2026-10-19.json | 20 math (16 vocab not audited) |
| data/tests/2026-10-26.json | 27 math (identical to 2026-11-02) |
| data/tests/2026-11-02.json | 27 math |
| data/tests/2026-11-09.json | 0 math (vocab only) |
| data/chapters/7.json | 90 (50 practice, 28 test, 12 fluency) + 6 vocabulary entries, 8 guide self-checks, 4 performance examples |
| data/homework/2026-10-19.json | 15 math (rounding and word problems) |
| data/homework/2026-11-02.json | 26 math (fractions) |
| data/homework/2026-11-09.json | 12 math (fractions on number lines) |
| games/multiplication-mastery-8.html | all 117 facts (0–8 × 0–12), quiz, missing-number, two-box, build-boxes and sticks logic |
| js/lib/skills.js (Skill Builders / Quick Facts / times) | `timesHelp` checked for every a, b in 0–12 (169 facts, all arithmetic in hints and Show me how true); rounding `roundParts` checked for every n from 10 to 9999 (to 10 and to 100); 300 random builds of every SKILL_SET passed `validateQuiz` with their own answers accepted |
| **Total** | **≈1,000 items, plus generated fact sets** |

## Could not verify
- Rendered appearance of the pictures (SVG output, colors, label placement), printouts, and audio. I verified the picture data (cells, rects, rows and cols, cut position, unknown side coordinates, fraction parts, selections and points) but did not view the pages in a browser, as instructed.
- Chapter 7 `teaching` models: wiring was validated by the suite. I read every teaching sentence (de-duplicated) but did not cross-check every `counted` index list against its text, beyond the scan that found the p502/x502/p405/p704 mismatches.
- Homework fraction pictures (`fraction`, `fractionLine`) are drawn from the same n/d as the key, so they cannot disagree; I did not view them rendered. Homework word-problem story text sits outside the item objects; I checked the equations against the numbers in the hints and show steps.
- That the Skill Builders tests hide hints on screen. `timesTest` and `roundTest` items keep `hints`/`show` in data; the code comment says the test page never shows them. Not confirmed in a browser.
- ELA vocabulary test items in data/tests/*.json: outside math scope.
