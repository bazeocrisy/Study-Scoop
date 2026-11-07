# Teaching-quality acceptance: does it teach a first-time learner?

Owner instruction, November 2026: mathematical correctness and working pages are necessary but insufficient. Audit as teaching for a child learning the topic for the first time. A passing test suite, long explanation, high item count or complete set of stages does not establish that a child can learn from the deliverable.

## Three separate verdicts

| Evidence | What it establishes | What it cannot establish |
|---|---|---|
| Technical correctness | Arithmetic, geometry, grading, accessibility wiring, controls, isolation and published files behave as specified. | That the explanation is understandable or helpful. |
| Teaching quality | An independent reviewer examines prerequisites, demonstrations, language and every feedback path against the actual picture. | That a particular child understood or retained it. |
| Observed child usability | A real child tries the lesson without adult coaching; observations and misunderstandings are recorded. | General effectiveness from a single session. |

Record each verdict independently as PASS, FAIL, PARTIAL or NOT VERIFIED, with scope and evidence. A simulated child perspective or successful adult walkthrough is not an observed child session. Do not call a chapter ready for production when its teaching review fails.

## Required walkthrough

1. Read every teaching screen as a novice. Identify what the child must already know; teach each prerequisite before asking for it. Use short, concrete sentences with one main idea per screen. Avoid unnecessary stories or nouns that do not match the displayed object.
2. Check every demonstration. The picture must show the reasoning action: define the whole, divide it, highlight a part, count intervals, compare equal quantities, or connect a count to notation. Step changes must change the relevant picture when the explanation describes a change. A finished diagram beside folding instructions is not a folding demonstration.
3. Follow every correct-answer path. Require an immediately available explanation of WHY, tied to the displayed evidence. Confirmation or repetition of the answer alone fails. Verify that the explanation really renders; an authored solution hidden behind disabled Help is not delivered teaching.
4. Deliberately select every wrong option. Explain the specific misconception using observable evidence from this model and demonstrate the next reasoning step. Generic “read again,” “try again,” or “use the definition” is insufficient. Do not pretend to know the child's thoughts from an ambiguous response.
5. For typed answers, enumerate the meaningful error classes and their boundary cases: wrong component, inverted fraction, colored-only/complement count, lines versus spaces, wrong whole/unit, equivalent value under a partition restriction, empty and invalid input. Explain each applicable class. Document the probe set; do not claim every possible input was manually tried.
6. Check progressively stronger Help. It must demonstrate a useful next action rather than repeat the question. Show its model close to its explanation. Record assistance and answer reveals separately from later independent success. Counting scaffolds and exposed answers cannot silently earn unassisted credit.
7. Keep assessment honest. Withhold answer-bearing teaching during a scored test; after submission, make the WHY available for both correct and incorrect responses. Freshness is semantic: recoloring, renamed objects, option rotation and proportional weights that render identically do not create new mathematical tasks.
8. Scaffold written reasoning after concrete demonstrations and practice. Keep it self/parent reviewed, tied to the response revision, and never graded for meaning by keywords, grammar or sentence length.
9. Review on a real-sized phone and with keyboard controls. Check that the child can see the relevant diagram and explanation together, interpret non-color cues, revisit steps and hear the same useful explanation through read-aloud. Record actual-audio and assistive-technology limits honestly.

## Independent review and sample gate

Reviewers must disclose authorship; self-review cannot substitute for an independent verdict. An independent reviewer must state what a confused child would STILL not understand, using exact lesson/screen/item IDs and visible evidence. Ask for weaknesses, not endorsement of the author's conclusions. Preserve counterexamples and unresolved findings.

Build and fully review ONE sample lesson before expanding a new teaching pattern across the chapter. Show the owner the complete sample, its correct/wrong paths, evidence and unresolved issues. Wait for the owner's review before rewriting the remaining lessons. Other audits can continue while that review is pending. A sample approval is not a child-comprehension claim or permission to merge production.

## Evidence required before delivery

- Frozen baseline/commit and an inventory of screens, correct paths, wrong options and typed-response classes.
- Manual teaching findings and their disposition; distinguish exhaustive inventories from manually adjudicated judgments.
- Independent mathematical/geometry validation, functional unit/browser evidence and built-site checks.
- Phone/desktop screenshots of demonstrations and actual corrections, not only untouched landing pages.
- Separate technical, teaching and observed-child verdicts; remaining owner decisions and NOT VERIFIED checks.
- Exact reviewed source/preview version and a rollback plan. Production still requires explicit owner approval.

Automated checks may detect missing branches, invalid models and wiring failures. They must not award a teaching-quality pass from word counts, keywords, schema completeness or the presence of a picture.
