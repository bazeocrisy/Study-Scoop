# Lesson 7-1 first-time teaching pilot — independent content review

Reviewed the emitted `data/lessons/7-1.json`, author module `scripts/author/chapter7-lesson1-teaching.mjs`, coaching lookup/rendering and fraction diagram geometry on the teaching-review branch. This review is separate from the frozen `88081b8` baseline audit. Other six lessons were not accepted for rewriting. **Child understanding: UNVERIFIED. Browser behavior: not executed by this reviewer.**

## Final independent re-review — ready for owner review

**Verdict: Lesson 7-1 is ready FOR OWNER REVIEW as the single teaching sample.** This is not a claim of verified child understanding, approval of the other six lessons, or production-release approval. The reviewed emitted lesson has SHA-256 `9610ed2a833521d14805c9bbbf22d87ff207f0a0ada4597d998bacfe16b9aa5b`.

I re-read all 13 Learn It screens, all three Watch Me examples (15 step states), all 38 coached items, every multiple-choice wrong option and the numeric response classes. I exercised **137 actual feedback cases** through the coaching lookup and the real rendering functions. Every practice/checkpoint case rendered its selected explanation and model; each test case rendered the appropriate explanation/model in its post-submission question details. No coaching feedback appeared in the unsubmitted test render. All **28 teaching-card states** rendered their current text. No feed-through failures were found. This is pure view-function execution, not an interactive browser session or child observation.

**Final literal-control delta acknowledged:** the counting prompt now says “Tap each Part button below. Watch its number appear in the picture.” The renderer supplies actual `Part 1`, `Part 2`, etc. buttons below the picture and numbered count markers on the picture, so the narration matches the controls. Re-ran the full 137-case/28-card view feed-through on this final hash: zero failures.

**P1 closed — numeric repairs now respond to the visible misconception.** All seven numeric count items have selected-only, inside-line (bars), too-low, too-high and default routes where applicable. For `try.t2` (four pieces, two colored), wrong 2 now says “That number matches only the colored pieces; the whole also includes the plain pieces.” Wrong 3 says “That number matches the inside lines; count the spaces between edges instead of the lines.” Wrong 1/5 uses a specific marked-piece counting repair instead of pretending to know the child's intention. Zero with no colored pieces correctly explains that plain pieces still exist. Models emphasize a subset/first piece without disclosing the complete count prematurely; the final numbered-count help step is explicitly tagged as an answer reveal.

**P2 closed — the two reported scored repetitions now require different model/task combinations.** `test.x4` names sixths on a circle rather than repeating the guided four-part-bar naming task. `test.x6` compares three equal horizontal rows; the prior three-part practice equality diagram uses vertical columns. Its feedback models preserve the row layout. `test.x5` now uses an unequal 4:1 split rather than a mirrored/rescaled existing 1:3 or 1:2 split. I inspected these actual model relationships; changing color or uniformly scaling weights was not accepted as the repair.

**Additional literal picture mismatch closed.** The equal-true wrong branch now says “The highlighted piece matches the other pieces in width and height…” while displaying one highlighted piece. It no longer claims that multiple pieces are highlighted when only one is shown.

**First-time-teaching assumptions rechecked:** a whole and its outside edge precede parts; equal and unequal strips precede names; all five target names precede naming checks; changing partitions in Watch Me preserves the whole and actually subdivides thirds/fourths; the left/right instruction matches the vertical divider, while top/bottom halves use row geometry. Joining pairs and same-whole comparisons have model-supported steps. Counts/names/area checks have an actual reason after a correct answer. Wrong color/whole/naming/cut-count choices receive the matching visual repair. The written reflection remains explicitly self/grown-up reviewed.

**Retained scope limit:** this sample does not establish that arbitrary different-outline shapes have equal area. Its parent note says to use physical matching/rearranging before extending that idea, and the sample does not score an unmodeled different-outline inference. Incorrect-cut diagrams with five/seven/nine spaces are explicit post-error counting non-examples, not newly taught fraction names. No new blocker found within the agreed Lesson 7-1 sample scope.

Detailed view-function evidence is retained privately; the repository teaching tests exercise the same public rendering interface. The historical first-review findings below remain for traceability and are superseded by this final re-review.

## Initial review verdict — findings now closed

**Material improvement; two corrections/rechecks requested before accepting the sample's complete paths.** The lesson is substantially closer to a first-time teaching sequence, and it should be the single owner-reviewed sample before further lesson rewriting.

### Improvements independently verified

- Thirteen Learn It screens start with a complete strip and outside boundary, introduce a part, compare equal and unequal shares, then teach names for halves/thirds/fourths/sixths/eighths before naming questions.
- The previous unit/name-before-teaching gap is closed for Lesson 7-1. A separate row-halves example supplies a second valid partition without assuming a child already understands arbitrary different-outline equal areas.
- Every Watch Me example changes its `step.model`. The thirds-to-sixths sequence retains the same outside whole and subdivides the highlighted third into two sixths. The fourths-to-eighths sequence similarly subdivides the highlighted quarter-circle into two eighths. These are geometrically meaningful transformations rather than simple recoloring.
- Watch example 1's ambiguous “across the middle” wording was corrected to a vertical line making a left half and right half; the later top/bottom halves step remains a distinct example.
- I enumerated all **38 coached question items**. Every multiple-choice wrong option maps to its own authored teaching response; no empty/mismatched option lookup was found after deterministic rotation.
- Correct feedback now gives an actual reason, for example the name family says “These are fourths because 4 equal pieces together make one whole.” Rendering the real correct item state confirms both the reason and its model are visible. The baseline's invisible “Compare…” explanation problem is closed for the pilot route.
- The unequal-area family identifies the wider piece at the same height and relates that to covered area. Color-only errors are explicitly rejected without implying that color changes size. Whole-versus-colored-piece errors include the uncolored pieces in the whole.
- The optional written reflection remains after concrete instruction and checks, with explicit child/grown-up review rather than automatic mathematical grading.

## Earlier findings — now closed by the final re-review above

### P1 — numeric wrong responses still share one undifferentiated instruction

All seven numeric count items (`learn.r1`, `together.g2`, `try.t1/t2/t3`, `test.x1/x2`) contain one `teaching.wrong` entry, with no response condition:

> “Count the spaces, not the dividing lines; start at the highlighted piece.”

The lookup returns that same response for any wrong number. This is a visual counting instruction, but it does not explain the likely selected-only error or distinguish it from a boundary count. Concrete case: `try.t2` shows four equal pieces, with two colored. Wrong **2** can be the count of colored pieces. The response does not say that the two uncolored pieces also belong to the complete strip. A child can repeat the same interpretation after the feedback.

Requested: selected-only response, dividing-line count and general miscount paths should each explain their visible evidence. Where a number could have multiple causes, use “If you counted…” rather than claim to know the child's reasoning. Avoid revealing the answer before the appropriate Help step; a useful first repair can identify that uncolored areas still count without immediately supplying the final count. The test route should deliver the explanation only after submission.

The numeric **correct** responses are stronger: they connect the full whole with matching widths/heights or matching circle sectors. Those should be retained.

### P2 — scored freshness needs semantic rather than color/weight-signature review

Potential repetitions sent to the independent QA reviewer:

- `test.x4`: name the equal pieces in a four-part bar, selected `[1,3]`; `together.g5`: name the equal pieces in a four-part bar, selected `[2]`. Both ask for the name of **all** pieces; the selected positions do not change the task. A different wrong-option denominator also does not create a fresh mathematical task.
- `test.x6`: equal-area three-part bar with weights `[2,2,2]`; `try.t10`: equal-area three-part bar with weights `[1,1,1]`. The renderer normalizes widths by total weight, so these are the same geometry, not two different pictures.

These need fresh scored tasks/model relationships or an explicit reviewed reason for repetition; an exact-JSON duplicate guard cannot establish freshness here.

## Owner sample acceptance boundary

Review the complete Lesson 7-1 learner journey, including each correct and wrong branch and post-test explanation. This teaching pilot is not evidence that Lessons 7-2 through 7-7 already meet the new standard. Do not generalize approval to those lessons or claim that a child understood the material without actual observation.

Detailed diagnostic path data is retained privately. The public audit script can reproduce the authored baseline inventory from the frozen source. These reviews were performed by AI specialist agents; they are not a human educator sign-off or an observed child study.


## Technical evidence and its limits

The independent instructional review is separate from functional QA. Automated checks confirm that the authored reason/model is dispatched and rendered; they do not award a semantic teaching pass by word count or picture presence.

- The final full unit suite passes 299 tests. The focused teaching checks cover all 38 coached items and numeric response classes.
- The focused browser suite covers 151 correct/wrong DOM-render paths and real learner-control flows, including bottom-of-phone Check/Help/Next step and Try again. Fresh repository and allowlisted-output runs pass.
- The mobile accessibility suite exercises keyboard/reduced-motion controls, geometric counting markers, answer gating and focus. Real voice output and real screen-reader use remain NOT VERIFIED.
- UI review inspected 96 focused states across six widths. Actual pointer clicks near the viewport bottom exposed additional bugs missed by full-page screenshots: lost focus, offscreen explanations and an offscreen restored stimulus. Those were fixed and regression checks added.
- The general Lesson 7-1 journey, revision-linked reflection and assistance-history regressions remain in place. The full unit/build/browser CI gates must pass for the exact release commit before its preview is described as live.
- Lesson 7-2 through 7-7 JSON and the chapter resource pack remain byte-identical to the original baseline. Their teaching failures remain open. Weekly content/labs, earlier chapter data and current-week selection are unchanged.

## Owner review: one sample before expansion

Open Lesson 7-1 in the preview and check these concrete paths:

1. Learn It begins with one uncut strip, then a divided strip, before naming the parts. Try the Part buttons and watch their numbers appear in the picture.
2. In Try It Yourself, the three-part naming question has wrong choices **fourths** and **whole pieces**. Try both, then **thirds**; each response should show a reason and its supporting picture.
3. In Watch Me, advance the steps: the whole actually becomes halves, thirds/sixths or fourths/eighths. The top/bottom-halves example keeps the same outside whole.
4. After a wrong answer, use Help and Try again. The explanation should appear without hunting down the page; Try again should bring the original picture and response back together.
5. Submit the ten-question practice test. Every correct and incorrect question has an expandable visual reason after submission; teaching answers are withheld during the test.
6. Try the written reflection and revise it. Comparison and review belong to that version of the response, and the computer never claims to grade its mathematical meaning.

For a real child trial, observe without supplying the next step. Ask the child to explain why three equal shares are called thirds and why two unequal shares are not halves. Later, use a different picture to check transfer/retention. Record confusion as well as success, without publishing identifying information. This trial has NOT been performed by the agents.

The decision now is whether this sample's simplicity and teaching pattern match the owner's intent. Approval of the sample authorizes the next redesign phase only; it is not approval of the remaining lessons, proof of retention, or production-release approval.

## Actual phone-viewport evidence

These screenshots are synthetic app walkthroughs at 390 × 844, with no textbook footage or identifying records. The pointer controls were placed near the viewport bottom before clicking, and no manual scrolling occurred after the action. The final eight-case viewport audit is closed: both the current diagram and its reason appear automatically, and Try again restores the original picture and response together. This is responsive-browser evidence, not a physical-device or child-learning certification.

[Wrong-answer correction](images/lesson-7-1-correction-mobile.png) · [Next teaching step](images/lesson-7-1-help-step-mobile.png) · [Try again](images/lesson-7-1-try-again-mobile.png)
