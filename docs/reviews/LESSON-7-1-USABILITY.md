# Lesson 7-1 independent interface and accessibility review

Reviewer: independent AI reviewer; did not author application code. Review against the assignment and repository UI, accessibility, and browser reviewer instructions. Initial base: `710fb45`; review concerns the working feature delta, not a claim about production.

## Executed browser observations

Used headless Chromium with the repository CDP harness, actual pointer activation, and viewport emulation. At 360, 390, 768, 1024, 1366 and 1920 px the initial lab has no horizontal document overflow and exactly one `h1`. Standard mode, check, reset, hint and reveal buttons measure at least 48 px high. Reviewed the actual 390 px full-page screenshot.

Walked every initial Learn It step for all eight construction shapes, followed by an empty check and a successful construction using actual point clicks. All eight correct constructions were accepted; empty constructions received an explanatory retry message. No browser errors were recorded in that walkthrough. This is an adult-style reviewer walkthrough, not observed child usability.

## Findings sent to author

1. At 360 px SVG endpoint targets measure 35.76 px wide; at 390 px 39.36 px wide. Below the assignment's 44 px requirement. Request an equivalent set of large HTML endpoint controls, avoiding overlapping touch regions on dense square marks.
2. Moving to the final Learn It step tries to focus the newly disabled Next button; focus falls to `body`. Same issue at the initial Previous boundary. Request focus on a useful enabled control or teaching heading.
3. Initial task wording reads “Divide this triangle: fourths into 4 equal parts.” Request a shape-only task name.
4. Native gray lab buttons differ from the site's rounded cream/purple theme. Request scoped established styling.
5. When expanded, the lab and underlying shared Learn It screen remain visible together. Request clear one-primary-task presentation.
6. SVG accessible description initially reports only the number of drawn lines. It does not describe which points are joined. Request an accessible list of drawn connections and point mappings, without disclosing an answer in Test Me.
7. The initial final triangle demonstration lacks a visible label showing one-fourth on each resulting triangle. Request final teaching-region labels and visible area reasoning.

Final dispositions and executed retest evidence follow below.

## Limits

Actual student comprehension, physical Chromebook/phone operation, audible speech, screen-reader output, physical printing, and long-term retention are NOT VERIFIED. Browser emulation does not establish physical-device or assistive-technology conformance. The separate regression suite results are recorded by the implementation lead/browser test agent.

## Final retest and disposition

The seven interface findings above are fixed and were rechecked in Chromium. Equivalent native construction-point buttons measure at least 44 × 44 px at all six widths; small SVG marks remain an optional equivalent target. Keyboard Enter and Space create a real divider through the native buttons. The SVG accessible description names marked points and actual drawn connections. Selection uses pressed state and a visible label, with more than color alone. Correct/incorrect feedback is a status region and receives focus. End-of-demonstration focus now lands on the lab heading rather than the body.

At every reviewed width the expanded lab hides the underlying lesson screen, while preserving the main lesson navigation and chapter breadcrumbs. The task sentence now names the shape naturally. The final triangle teaching diagram contains four colored regions with a visible `1/4` label in each. Existing cream/purple styling is retained; selected controls are visibly distinct. Reviewed the stored screenshots at all six widths, not only DOM measurements.

Executed the complete eight-construction Learn It walkthrough again after the focus fix. Every final step retained meaningful focus, and every empty and valid Practice It path still behaved correctly. Also walked all three teaching steps for each of five reasoning tasks, all **13 answer choices** in their Practice It paths, and the new Test Me stimulus for each. Correct answers explain the specific picture; wrong choices provide a relevant correction. No browser errors occurred. Blank reasoning checks now request a selection without counting a mathematical error.

Caught two additional mathematical presentation defects during this independent interface review: overlapping diamond tiles and rectangular cells described as unit squares. These were sent to the independent mathematical reviewer and author; the final diagrams use a shared-edge diamond lattice and actual square grid cells. Inspected the corrected rendered diagrams, including fresh four-tile and unequal-area Test Me variants. Detailed area validation belongs to the independent mathematical report.

Executed a fresh scalene-triangle Test Me path after practice help/reveal: the task's geometry and title change, no hint/reveal controls appear, and the first successful test check records an independent *new transfer problem*. The earlier practice hint/reveal remains separately visible in the parent summary after reset and route navigation. A retry on the same assessed problem does not reset its first-attempt history. Independently verified that the shared scored lesson test route renders no lab at all.

Additional actual teaching/correction screenshots: [triangle teaching at 390 px](images/partition-lab-triangle-teaching-390.png) and [retry feedback at 390 px](images/partition-lab-retry-390.png).

**Verdict:** PASS for the reviewed rendered interface, keyboard paths, simulated sizes, feedback, and assistance-history presentation. This is a scoped independent UI/accessibility review, not full WCAG certification. Curriculum and mathematical verdicts are recorded separately; observed child usability remains NOT VERIFIED.

## Addendum: progressive help beside each question

Independently reviewed the later requested question-help change in actual Chromium. For **all 13 lab tasks**, exercised keyboard activation of the question `?`, Hint, every Show Steps preview, explicit Show Answer, reset, and the Test Me `?`. The construction previews use between two and eight incremental steps; they stop before the complete construction. Reasoning previews introduce the whole and comparison/counting method before the conclusion. The reveal flag remains false through Hint/Show Steps and becomes true only after explicit Show Answer.

For each task, the student's existing drawn divider or selected radio answer was identical before and after the entire help sequence. Hint, visual-step and reveal histories were recorded separately and retained after reset. Opening help places keyboard focus on its visible heading. Test Me `?` explains independent work and offers no hints, preview steps or worked-answer controls. No JavaScript errors occurred in this 13-task walkthrough.

On the shared lesson, checked that a guided question offers `? Hint` before the first checked answer and progresses through `? Show Steps` to `? Show Answer`. Typed an original reflection response, then opened its three help levels. All three preserve the exact response and focus the help panel; the final level shows a human-reviewed sample rather than claiming to grade the student's explanation. The original reflection instructions remain visible.

Reviewed the help layout at 390 and 1024 px: no horizontal overflow, help heading visible after opening, and help buttons at least 44 × 44 px. Screenshots: [390 px](images/partition-lab-question-help-390.png), [1024 px](images/partition-lab-question-help-1024.png).

Addendum verdict: PASS for the reviewed progressive-help interaction and layout. Earlier limits concerning physical devices, assistive technology and observed child understanding still apply.

Additional 390 px evidence preserves a student-drawn divider above the help panel: [partial construction help](images/partition-lab-question-help-own-work-390.png), then [explicit Show Answer](images/partition-lab-question-answer-own-work-390.png). The original drawing remains a single midpoint-to-midpoint divider; the revealed worked solution appears separately below it.
