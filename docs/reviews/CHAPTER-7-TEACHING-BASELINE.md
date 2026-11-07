# Chapter 7 independent teaching-quality audit

**Baseline inspected:** `88081b8` on the chapter teaching-review branch. Read-only implementation audit. **Verdict: FAIL the current first-time-learner teaching standard for all seven lessons.** Several mathematical explanations are sound, but the delivered sequence and feedback do not consistently teach a confused child how to reason about the particular picture. No child observation was performed; child understanding remains **UNVERIFIED**.

This is a fresh audit of the actual baseline. Prior mathematical/count-based reviews are not evidence for this verdict. The audit also examines the chapter resource pack, which I originally authored under an earlier specification; it does not receive an independent-author endorsement here.

## Scope and evidence method

I inspected all 42 Learn It screens, all 21 Watch Me examples, every guided/practice/test item, all six vocabulary cards, all seven guide sections and self-checks, four performance tasks, the 50-question chapter practice bank, 28-question cumulative test and 12-question optional fluency bank. I generated all 60 vocabulary activities from the actual runtime builder. Total authored/generated question inventory: **441 items**, comprising 198 multiple-choice, 151 fraction-entry, 65 numeric, 20 word-entry and seven written-review items. The item counts include Learn It checkpoints and Watch Me checks. Lesson 7-1 Watch Me examples have no embedded checks; this explains its smaller question total.

For every multiple-choice item, the attached inventory records the real correct response and **every** wrong option's real feedback. For every fraction item, I evaluated correct, numerator-error, denominator-error, reversal and equivalent-value responses; these are diagnostic classes, not an exhaustive enumeration of arbitrary integers. Numeric items were evaluated for correct and adjacent high/low answers; the shared checker and absence of item-specific `mistakes` were inspected for the remaining wrong-number class. Word-entry and written-review routing were also inspected. The inventory preserves exact prompts, model data, hints, worked/review text and runtime feedback.

Static renderer evidence supplements content inspection: rendering `7-1.learn.r1` in its correct state displays “Compare your reasoning with the explanation.” but **neither** its authored `show` explanation **nor** a Help button. This was checked with the actual `itemCard` function. I did not execute an interactive browser, review screenshots or observe a child for this audit. Every Watch Me step was inspected: no Chapter 7 step supplies a changing `step.model`, so all 21 examples keep their example-level diagram throughout the narrated steps. Test wrong feedback is held until submission; tests must not gain in-test answer hints. The required improvement concerns post-test review as well as practice feedback.

## Blocking teaching findings

### T1. Correct answers often stop teaching instead of confirming the reason

All **127 lesson multiple-choice items** have `yes: "Compare your reasoning with the explanation."` Of these, **93 are outside the lesson tests** and therefore use this as immediate practice/checkpoint feedback; the other 34 are authored test confirmations, while the test results path uses review text. Examples: `7-1.learn.r1`, `7-1.learn.r2`, `7-1.together.g3`, `7-2.watch.w1check`, `7-3.try.t20`, `7-4.learn.r2`, `7-5.try.t20`, `7-6.try.t20`, `7-7.try.t20`.

The immediate correct-state UI does not automatically show the explanation it asks the learner to compare. In `js/views/lesson.js:itemCard`, `done` disables Help, and `helpPanel` is rendered only when help was already opened. A child who guessed correctly cannot discover why that answer was correct on this route. Merely authoring `show` does not repair the delivered teaching.

**Needed:** a short, picture-specific reason visible on the correct route, including the relation being learned, not just an instruction to compare. For example, a thirds answer must connect “three equal-sized pieces together fill this one strip” with why each is a third. The teacher's exact wording can remain alongside child-facing explanation.

### T2. Fraction wrong answers receive the same generic counting instruction across different misconceptions

The actual checker in `js/lib/fractions.js:checkFraction` uses `item.retry`, or “Count the selected parts and the equal parts in one whole.” For value-policy questions it substitutes “Check the value represented by the model.” The inspected Chapter 7 fraction items provide no misconception-aware retry rules. Thus the **151 fraction-entry items** do not distinguish numerator/denominator reversal, counting leftovers, counting marks rather than spaces, using the entire multi-whole line as the denominator, resetting the numerator at one, or treating a collection as one whole when each object was defined as a whole.

Concrete replay: `7-2.learn.r1` shows four selected pieces in six. Replies **5/6**, **4/7**, **6/4** and **8/12** all produce exactly “Count the selected parts and the equal parts in one whole.” Yet these require different explanations. For 8/12, the value is correct but the requested displayed partition is not; the feedback never acknowledges that distinction. `7-3.learn.r1` gives the same wording for a number line, without explaining a single interval or zero's role. `chapter.practice.p501` treats a reversal of 2/1 into 1/2 the same as an off-by-one count.

Correct fraction feedback is usually only “The model represents 4/6.” or “Yes! 2/1.” The help text normally lists denominator count, numerator count and answer; it does not consistently explain **why** those counts use different scopes or how the pictured unit creates the number.

**Needed:** picture-aware feedback families with observable evidence. If the denominator counts all intervals through two wholes, point out that **0 to 1** is the one-whole span. If the numerator counts blank pieces, explicitly distinguish the highlighted pieces from the blank pieces in that picture. A semantically correct equivalent answer rejected for partition format needs a separate explanation.

### T3. Numeric wrong-answer and help paths are high/low confirmations, not repairs

The inventory contains 65 numeric questions. Twelve are guide-only fluency answer keys; the remaining practice/test numeric questions use the shared integer checker. The diagnostic simulation records checker results for all 65, but the fluency page itself only renders its authored answer-key text. Chapter fraction items do not author targeted `mistakes` rules; a wrong integer therefore becomes “too big”/“too small” plus a general hint. Examples:

- `7-1.together.g5`: “9 is too big. Count each part once, including parts with no selection.” The child still does not know whether they counted boundary lines or pieces.
- `7-3.try.t1`: “2 is too big. Identify exactly which count the question asks for.” Its entire worked text is “The requested count is 1.” It never shows why zero is a starting boundary rather than a first traveled interval.
- `7-5.try.t1`: five complete circles are shown, but the requested denominator count is one. Feedback is “The count is 1.” Wrong 2/0 feedback repeats “Identify exactly which count the question asks for.” The core whole-versus-collection confusion remains unanswered.
- `7-7.try.t19`: wrong 11 gets “11 is too small. Identify the whole and which count is missing.” A child who excluded one selected object from the whole does not get that misconception explained.

**Needed:** explain the unit and the visible miscount, then show one action the child can take on the picture. Counts alone can be useful evidence but do not satisfy the requested teaching standard.

### T4. Learn It often states a rule before providing the first-time learner with its meaning

The three expository screens in each lesson are generally one or two assertions. Screens 2 and 3 in **every lesson** have no model. The first checkpoint may therefore ask for unfamiliar vocabulary or notation before a concrete, narrated demonstration. Detailed per-screen findings follow below.

The strongest concrete mismatch is `7-2.learn.screen1`: “A unit fraction names one equal part of a whole.” The picture is a six-sector circle with **two** sectors selected (`selected:[0,1]`). It neither isolates one sector nor explains that the displayed two-piece selection is not a unit fraction. A beginner could reasonably associate “unit fraction” with two sixths.

`7-1.learn.r1` already asks the child to choose **thirds**. None of the preceding three Learn It screens explains the names halves/thirds/fourths or the rule connecting the count in the whole to those names. Watch Me comes later and teaches fourths/sixths/eighths; it does not supply this missing explanation before the initial thirds question.

### T5. Definitions and rule repetitions substitute for picture-specific explanations in several resource routes

The resource pack has useful examples, but its typed practice uses T2/T3. Its generic “Count the equal parts…” hint is identical across circle/set/line contexts. `chapter.practice.p501`'s help says “Each whole has 1 equal parts. 2 parts are selected, so the fraction is 2/1.” This is grammatical boilerplate and omits the useful distinction: the denominator describes the **size of one counted unit**, while the numerator counts multiple whole-size units.

Vocabulary multiple-choice wrong feedback repeats the definition of the word the child chose, e.g. `fv-choice-1` wrong “unit fraction” feedback is just “unit fraction: A unit fraction is ONE part of a whole. It always has a numerator of one.” It does not contrast that with the requested denominator. Word-bank fill wrong answers get “Use the whole sentence to choose the term.” True/false feedback is often a definition repetition; some context sentences are sound retrieval practice, but they do not independently teach a beginner.

The seven study-guide examples usually connect a count to the displayed model, which is stronger than the live correct path. However, they remain one-sentence worked summaries rather than detailed instruction. For example, the guide's whole-number self-check answers only “6/1.” It does not repair 1/6 or 6/6. The optional fluency answer for `f30` is “247 + 186 = 433. Work in ones, tens and hundreds; regroup when a place needs it.” A child who does not know how to regroup is not shown 7 + 6 = 13, the carried ten, or the next place. This is an answer key, not a taught fluency example.

## Lesson and question-family verdicts

“Fail” here means at least one required first-time-teaching/correct/wrong path is missing. It does not assert that every sentence in that family is poor.

| Lesson | Family / exact evidence IDs | Verdict and remaining child confusion |
|---|---|---|
| 7-1 | Names/counts: `learn.r1`, `together.g1`, `try.t1–t4`; unequal partitions `learn.r2`, `together.g2`, `try.t19` | **FAIL.** No names-before-checkpoint teaching; count-only correct paths; unequal-part feedback does not identify which pictured piece is larger or show a comparison. |
| 7-1 | Same whole/more parts: `together.g3`, related Try comparison items; different outlines `together.g4`, `try.t16–t18`; diagonals `try.t20`, `test.x4` | **FAIL.** Verbal facts without paired same-size whole diagrams, an equal-area/different-outline demonstration or a diagonal-halving demonstration. “Different outlines can cover the same area” repeats the disputed fact. |
| 7-1 | Partition construction/checking: Watch examples 1–3; `together.g6`, `test.x10` | **PARTIAL, overall FAIL.** The fold narrative and same-width/same-height reason are useful. The picture remains the finished partition on each step, so the child cannot see the fold/overlap comparison or the repair of an unequal example. Immediate MC success is generic. |
| 7-2 | Whole/numerator/denominator/unit fraction: `learn.screen1–3`, `learn.r1/r2`, `watch.w1check/w2check/w3check`, fraction Try items | **FAIL.** Unit-fraction picture conflicts with one-part wording; notation/top/bottom mapping is not concretely narrated before entry; reversal and selected-versus-leftover mistakes get identical retry text. |
| 7-2 | Missing counts/error analysis: `try.t19/t20`, `test.x6/x7/x8/x10` | **PARTIAL, overall FAIL.** Some MC wrong options name the misconception (“Many non-unit fractions have denominator four”). Numeric repairs still cannot explain the miscount. Correct MC route has no reason. |
| 7-3 | Whole interval/point naming: `learn.screen1–3`, `learn.r1/r2`, `watch.w3check`, typed guided/Try items | **FAIL.** “Count intervals” is a rule, not a narrated movement from zero across particular spaces. A tick-count denominator and wrong numerator receive the same fallback. |
| 7-3 | Boundary-versus-interval and movement: `watch.w1check/w2check`, `try.t20`, `test.x5/x7/x9/x10` | **PARTIAL, overall FAIL.** Several authored wrong choices correctly distinguish boundaries and spaces; the model does not illustrate that distinction step by step, and immediate correct MC feedback omits it. |
| 7-4 | Complete whole b/b: `learn.screen1–3`, `learn.r1/r2`, `watch.w1check/w3check`, typed Try items | **FAIL.** Full shading supports the idea, but feedback repeats the ratio/count. A child who reads 6/6 as six wholes needs each sixth assembled into one outlined whole, not “Check the value represented by the model.” |
| 7-4 | Different partitions / matched counts: `watch.w2check`, `try.t20`, `test.x6/x8` | **PARTIAL, overall FAIL.** The explanation correctly says all parts still cover the same whole. Only one of the two compared partitions is modeled in Watch Me; the relationship is asserted rather than shown. Doubling both counts needs a concrete all-parts example, not only the equality rule. |
| 7-5 | n/1 and multiple wholes: `learn.screen1–3`, `learn.r1/r2`, `watch.w1check`, typed guided/Try items | **FAIL.** “A whole piece is one part of itself” assumes the conceptual leap. The same objects are not shown under contrasting definitions of the whole. A beginner can count three visible bars and conclude denominator three; no typed retry addresses that. |
| 7-5 | Number line / whole-set confusion: `watch.w3check`, `try.t19/t20`, `test.x7/x10` | **PARTIAL, overall FAIL.** The 6/1 line example is concrete and numerically sound. Its steps list six intervals but do not explain the one-unit interval's relationship to denominator one in child language. Correct MC/no-repair numeric paths remain weak. |
| 7-6 | Fractions beyond one: `learn.screen1–3`, `learn.r1/r2`, `watch.w3check`, fraction guided/Try items | **FAIL.** The first picture is 5/4 on a two-whole line but the text only says keep interval size. It does not narrate 1/4, 2/4, 3/4, 4/4 = 1, then 5/4; a child who restarts at one gets generic counting advice. |
| 7-6 | Compare with one/other wholes and fixed units: `watch.w1check/w2check`, `try.t20`, `test.x5/x6/x8/x10` | **PARTIAL, overall FAIL.** Selected explanations are strong, e.g. “Three units contain six halves; five halves are shorter.” The same concrete grouping is not reliably delivered after correct practice answers or wrong typed entries. |
| 7-7 | Defined set/unit/multiple objects: `learn.screen1–3`, `learn.r1/r2`, `watch.w1check/w3check`, typed guided/Try | **FAIL.** The collection model is relevant, and 4/10 is worked. It does not concretely contrast one object as a whole with the whole collection; wrong denominator/leftover responses are not diagnosed. |
| 7-7 | Rearrangement, mixed shapes, unfinished objects: `watch.w2check`, `try.t20`, `test.x7/x8/x10` | **PARTIAL, overall FAIL.** Sound conceptual wrong-option feedback (“Moving objects does not change how many…”), but no before/after arrangement diagram; successful answers still omit why. |
| All seven | Written checkpoints `learn.explain` | **PARTIAL.** The baseline properly discloses that mathematical meaning is self/grown-up reviewed and supports revision. The example response and generic checklist do not diagnose a specific mathematical misconception. This route must remain ungraded and cannot establish learning by itself. |
| Resources | All `chapter.practice.*`, `chapter.test.*`, six vocabulary terms, guide sections 1–7, performance tasks 1–4, fluency `f20–f25`/`f30–f35` | **FAIL as a complete teaching package.** Practice shares weak typed repair; vocabulary is retrieval-focused; guides/performance have helpful specific answers but lack adaptive misconception repairs; fluency shows final arithmetic without regrouping teaching. These are not substitutes for a taught lesson. |

## Every expository teaching screen: individual findings

The following table covers all 21 plain Learn It screens. The other 21 Learn It screens are `r1`, `r2` and `explain` in each lesson and are covered by the family table plus the complete diagnostic response inventory.

| Exact screen | Exact text or defining quote | Verdict / what is still missing |
|---|---|---|
| 7-1.learn.screen1 | “A whole can be divided in different ways.” | **FAIL:** one finished four-part bar; no whole identified in words, no second way, no meaning of “part.” |
| 7-1.learn.screen2 | “Equal parts have equal area, even when their shapes look different.” | **FAIL:** no pictured equal/unequal comparison or different-outline example. |
| 7-1.learn.screen3 | “More equal parts of the same whole make each part smaller.” | **FAIL:** no paired matching wholes to demonstrate why. |
| 7-2.learn.screen1 | “A unit fraction names one equal part of a whole.” | **FAIL:** circle highlights two of six pieces. |
| 7-2.learn.screen2 | “The denominator counts all equal parts in that whole; the numerator counts selected parts.” | **FAIL:** no picture or fraction notation linking each count to a location. |
| 7-2.learn.screen3 | “The numerator counts the selected parts, not the parts left over.” | **FAIL:** no actual selected/leftover contrast. |
| 7-3.learn.screen1 | “One whole is the distance from zero to one.” | **PARTIAL:** relevant line, no highlighted one-whole span or explanation of interval. |
| 7-3.learn.screen2 | “Equal intervals represent equal unit fractions.” | **FAIL:** neither “interval” nor one step's unit-fraction meaning is demonstrated. |
| 7-3.learn.screen3 | “Count intervals from zero to locate a fraction.” | **FAIL:** repeats an instruction without doing it in a picture. |
| 7-4.learn.screen1 | “Every equal part together makes one whole.” | **PARTIAL:** correct complete shaded bar; no narration of how its six pieces fill one outside outline. |
| 7-4.learn.screen2 | “Different denominators can name the same whole.” | **FAIL:** no two partitions side by side; b/b assertion lacks a novice example. |
| 7-4.learn.screen3 | “The point at one can also be named with a fraction.” | **FAIL:** no line, no fraction label, no visual bridge. |
| 7-5.learn.screen1 | “A whole piece is one part of itself.” | **FAIL:** three bars are pictured without an explicit boundary/brace identifying each as a whole. |
| 7-5.learn.screen2 | “A whole number can be written with denominator one.” | **FAIL:** lacks a concrete numerator/denominator mapping and why denominator counts one per unit. |
| 7-5.learn.screen3 | “Decide whether each object is one whole or whether the entire set is the whole.” | **FAIL:** this is the required decision, not instruction in how the question defines it; no contrasting examples. |
| 7-6.learn.screen1 | “Keep the same interval size across all whole units.” | **FAIL:** 5/4 line is present, but no narrated count through 4/4 into the next unit. |
| 7-6.learn.screen2 | “A numerator larger than the denominator means more than one whole.” | **FAIL:** numerical rule precedes a displayed grouping of one whole plus extra pieces. |
| 7-6.learn.screen3 | “Compare the numerator with the denominator to decide whether the value is below, at or above one.” | **FAIL:** repeats the rule, not a specific comparison with a picture. |
| 7-7.learn.screen1 | “The entire collection is one whole set.” | **PARTIAL:** set of five with one selected supports the idea, but no visual whole-set boundary or distinction from one object as a whole. |
| 7-7.learn.screen2 | “Each single object is one equal counting part of the set.” | **FAIL:** no explicit contrast between equal counting units and equal physical areas. |
| 7-7.learn.screen3 | “The selected objects need not be next to each other.” | **FAIL:** no before/after picture or preserved count. |

## Every Watch Me example: individual verdicts

| Exact example | Evidence and verdict |
|---|---|
| 7-1.watch.example1 | “The four full-height sections have equal widths, so their areas are equal.” **PARTIAL:** a genuine reason; static final diagram does not show the fold or compare pieces. |
| 7-1.watch.example2 | “Joining each pair of neighboring sections would make three larger equal areas.” **PARTIAL:** useful transfer; no picture of the joined pairs or explanation of same total whole. |
| 7-1.watch.example3 | “All eight parts cover the same area; the number of pieces alone would not prove this if the folds were unequal.” **PARTIAL:** identifies the issue, but the finished eight-sector circle does not demonstrate matching fold areas or an unequal non-example. |
| 7-2.watch.example1 | “The denominator counts every equal part in this one whole.” **FAIL novice standard:** does not finish with this picture's denominator or a labeled fraction linking bottom number to whole. |
| 7-2.watch.example2 | “The numerator counts the selected equal parts of the whole.” **FAIL:** says the rule, not the pictured selected/blank count contrast. |
| 7-2.watch.example3 | “There are 6 equal parts… There is 1 selected part… The fraction is 1/6.” **PARTIAL:** concrete counts; no simple explanation of why numerator counts one type and denominator counts the entire whole. |
| 7-3.watch.example1 | “Count equal intervals in the distance from zero to one.” **FAIL:** does not point out the actual two spaces against three boundary ticks. |
| 7-3.watch.example2 | “Start at zero, then count the first interval only after moving to the next tick.” **PARTIAL:** useful specific correction; no visual movement/count sequence. |
| 7-3.watch.example3 | “The point is 1 interval from zero… The fraction is 1/6.” **PARTIAL:** correctly names the point; does not show why the starting mark is not a traveled piece. |
| 7-4.watch.example1 | “There are 2 selected parts… The fraction is 2/2.” **PARTIAL:** stops before explaining that those parts fill one outlined unit; key 2/2 = 1 connection is implicit. |
| 7-4.watch.example2 | “All parts of each whole together represent one, regardless of the number of equal parts.” **PARTIAL:** correct reason, but only one of the compared whole partitions is rendered. |
| 7-4.watch.example3 | “There are 6 selected parts… The fraction is 6/6.” **PARTIAL:** repeats count-to-ratio; still needs whole-filling relationship explicitly drawn/narrated. |
| 7-5.watch.example1 | “Each counted part is one complete whole… There are 3 selected whole pieces… 3/1.” **PARTIAL:** clearest link in the lesson; needs what the one refers to visibly distinguished from total collection. |
| 7-5.watch.example2 | “The total counts 3 whole pieces, not one part of a collection.” **PARTIAL:** identifies the misconception, but no contrasting same-object whole-set model. |
| 7-5.watch.example3 | “The point is 6 intervals from zero… 6/1.” **PARTIAL:** relevant whole-unit line; does not explicitly connect one whole-size step with the denominator and six such steps with numerator. |
| 7-6.watch.example1 | “Counting 1 unit part gives fewer than the 2 parts in one whole, so 1/2 is less than one.” **PARTIAL:** real causal explanation, but no model for this example. |
| 7-6.watch.example2 | “The whole-unit length and fractional interval size stay fixed across the line.” **PARTIAL:** correct repair, no wrong-size versus fixed-size contrasting picture. |
| 7-6.watch.example3 | “The point is 10 intervals from zero… 10/6.” **PARTIAL:** does not group first six into one whole, then remaining four; novice may keep counting without understanding beyond-one value. |
| 7-7.watch.example1 | “The whole is the entire collection, so count every object.” **PARTIAL:** valid scoped count, but does not explicitly show all ten included while four selected are a subset. |
| 7-7.watch.example2 | “A fraction of a set depends on counts within the defined whole, not the objects’ positions.” **PARTIAL:** reason is correct, but no before/after rearrangement demonstrating conserved counts. |
| 7-7.watch.example3 | “There are 10 equal counting parts… There are 4 selected parts… 4/10.” **PARTIAL:** useful nonadjacent selection, but no contrast with excluded blank objects or why collection denominator differs from shape areas. |

## Resource-content inventory and verdicts

- **Vocabulary — denominator:** the six-part bar and “A strip divided into six equal parts has denominator 6” are consistent. **PARTIAL:** no visible six-to-bottom-number mapping. **Numerator:** eight-part bar with three selected is consistent. **PARTIAL:** same missing top-number mapping. **Unit fraction:** one selected fourth is consistent; stronger than the contradictory lesson 7-2 opener. **PARTIAL:** no contrasted 2/4 non-unit example. **Fraction:** two selected thirds with 2/3 is coherent. **PARTIAL:** a concrete labeled mapping is needed. **Partition:** picture is an already partitioned four-part bar. **PARTIAL:** no cutting action/non-example. **Fraction tiles:** three selected thirds show a whole. **PARTIAL:** no separated pieces being placed together, so the tool's use is asserted.
- **Generated vocabulary choice (20), true/false (20), fill (20): FAIL teaching standard.** Useful retrieval variations, but wrong paths give another definition or generic sentence-selection advice. They do not show the contrast between numerator and denominator on one specific model. Exact runtime IDs/quotes are retained in the private diagnostic inventory.
- **Guide sections 1–7: PARTIAL, suitable concise review only.** Their picture/text pairs and common-mistake headings are useful. Most “fixes” restate the rule, such as “Check that all pieces have equal area,” “Read the definition of the whole,” or “Only count intervals in one whole.” A novice still needs the actual comparison/count/whole-identification demonstration. The one-sentence answers 6/1 and 7/12 do not diagnose reversal or omitted objects.
- **Chapter practice families:** partition recognition (`p101–p106`), naming/counts (`p201–p206`), unit number line (`p301–p306`), one whole (`p401–p406`), whole numbers (`p501–p506`), beyond-one (`p601–p606`), sets (`p701–p706`) and true/false (`p81–p88`). **All FAIL completeness under this standard:** some MC explanations identify errors, but typed families share T2/T3. Simple yes/ratio confirmations omit teaching on correct paths. Explicit true/false reasons such as `p86` (“Three thirds reach one whole; the fourth interval goes beyond one”) are good material to preserve.
- **Cumulative test x101–x704 (28, four per skill): PARTIAL post-test review.** The explanations are generally relevant and some comparisons are strong, e.g. x604 counts twelve thirds for four wholes. Scored tests should keep in-test feedback hidden. After submission the explanation should reconnect with the picture and the learner's specific mistake, rather than merely present a final ratio or count.
- **Performance tasks 1–4: PARTIAL.** Original, ungraded, sound model responses: 3/8 selection, 6/6 whole, 7/4 beyond one, 2/5 set. This is appropriate application/self-comparison; it does not supply a confused child with intermediate steps or diagnose why an incorrect explanation fails.
- **Fluency f20–f25 (doubling) and f30–f35 (three-digit operations): FAIL as teaching; answer-key practice only.** Doubles get an addition identity, which is useful but no grouped model. Three-digit examples provide no actual place-value regrouping work. These should remain optional and separate from fraction mastery.

## What the Lesson 7-1 sample must demonstrate before wider rewriting

This is an audit acceptance checklist, not authorization to rewrite all seven lessons. The user's requested sequence is **one Lesson 7-1 sample, owner review, then any broader rewrite**.

1. Establish one whole with a familiar strip or sheet, and visibly distinguish the whole outline from a piece.
2. Teach equal shares with one equal and one unequal partition of the **same-sized** whole. Identify the specific wide/narrow pieces and explain a usable check such as matching/covering or equal unit-square areas.
3. Teach halves/thirds/fourths with a narrated count-to-name link before asking for a name. Explain why “three pieces” alone is insufficient when they are unequal.
4. Demonstrate a second valid partition and the difference between equal area and matching outline. If diagonals are assessed, show why the two triangle areas match before the first such question.
5. Give a correct-answer reason that names the particular picture and the underlying relation; it must actually be visible. A guessed correct answer must still be teachable.
6. Give distinct wrong-answer repairs for counting boundary lines, naming from the wrong part count, accepting unequal shares, assuming same outline is required, and comparing parts from different-sized wholes. Explain one observed misconception at a time.
7. Make the first hint point to evidence in the current picture without giving the final name away. Later help should demonstrate the comparison or action, not just reveal a number.
8. Retain ungraded written explanation/self-review; do not label a form-complete sentence as mathematical mastery.
9. Review the sample's full Learn → Watch → guided/practice → correct/wrong → review journey with the owner. **Actual child comprehension remains UNVERIFIED until observed.**


## Evidence scope

The complete response inventories are retained privately alongside the review. They contain every authored/generated item and response probe, but their mechanical flags are triage, not a semantic teaching-quality certificate. The baseline remains reproducible from commit `88081b8346b2389df5c93aae5493da7af4dff4d1`. Owner-supplied mobile footage was reviewed privately and is not published. The revised Lesson 7-1 sample and its final review are tracked separately; this baseline FAIL verdict is not overwritten by sample improvements.


## Reproduce the diagnostic inventory independently

The inventory script accepts a separate frozen worktree. It records the actual Git commit and whether that worktree is dirty; flags remain unadjudicated triage.

```sh
git worktree add --detach /tmp/study-scoop-teaching-baseline 88081b8346b2389df5c93aae5493da7af4dff4d1
node scripts/audit-chapter7-teaching.mjs --root /tmp/study-scoop-teaching-baseline --out /tmp/study-scoop-teaching-evidence
```

Expected baseline inventory: 441 items and 1,202 diagnostic probes. Some probes deliberately test valid equivalent responses; acceptance of those is not a grading bug. Written explanations use the self/parent-review runtime, not the generic sentence checker. Read the [pilot review](CHAPTER-7-TEACHING-PILOT-71.md) separately. The baseline teaching failure is not erased by a successful technical run or one improved lesson.
