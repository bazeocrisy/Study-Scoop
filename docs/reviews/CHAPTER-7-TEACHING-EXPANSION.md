# Chapter 7 teaching expansion after owner sample approval

## Scope and authorization

The owner approved the Lesson 7-1 preview and requested the other lessons use the same teaching pattern, plus a reusable chapter-plugin update. This work starts from develop `35a260513987ba9c6a52e4f18746ee0e27a35a84` (PR #35). Lesson 7-1 is the approved reference. The authorized expansion covers Lessons 7-2 through 7-7 and chapter-owned vocabulary, practice, study guide and test review. Production is not approved.

The earlier baseline audit remains historical evidence of the original chapter's teaching failures. The pilot report describes the approved sample, not the completed expansion. This report records the expansion's actual evidence separately.

## Teaching contract

Follow `../TEACHING-QUALITY-ACCEPTANCE.md` and `../VISUAL-TEACHING-PATTERN.md`: establish the whole/unit, show concrete reasoning before symbols, demonstrate changing models, explain correct answers with visible evidence, repair each wrong choice and meaningful typed error class, and preserve honest assessment and assistance history. A schema or browser path pass does not award a teaching-quality verdict.

## Review independence

Six AI specialists participate. The curriculum reviewer authors 7-2 through 7-4; the instructional reviewer authors 7-5 through 7-7; the accessibility reviewer authors chapter resources; the interaction reviewer implements shared runtime support. UI and QA reviewers author no lesson/resource content and independently inspect the new content; content authors also cross-review material they did not author. These are AI reviews, not a human educator sign-off or a child study.

## Evidence and verdicts

Independent AI teaching review supports owner review of Lessons 7-2 through 7-7 and the revised chapter resources. The approved 7-1 data is unchanged. This is a teaching-source and rendered-path review, not proof of a child's comprehension.

Technical evidence at the content freeze: 308 unit tests pass; the allowlist builder validates 207 public runtime files; the general repository browser suite passes 347 checks, November homework 220, weekly labs 80, and shared layout 79. The general suites were run during review; the exact frozen commit must additionally pass the final repository/built-site chapter suites and full PR CI. Exact CI, Pages, reviewed commit, and published-byte verification are recorded on the feature pull request before delivery. The release gate cannot be satisfied by this report alone.

A separate arithmetic pass validates 4,082 nested mathematical diagrams and recomputes 127 fraction keys from selected-part or interval counts, with no errors. It does not grade the meaning of prose. Both authoring generators reproduce all eight reviewed content files byte for byte.

Observed child comprehension, transfer and retention remain NOT VERIFIED. A responsive browser simulation is not a physical device, actual audio, screen reader or printed-page check.

## What changed and what was reviewed

The six revised lessons have 63 Learn screens, 75 worked Watch states, and 237 objective teaching items (including the nine Watch checkpoints in 7-5 through 7-7). Each lesson retains six guided questions, twenty Try questions, ten separate test questions and one self/parent-reviewed reflection. The chapter pack retains six vocabulary terms, fifty mixed practice questions, twenty generated questions per vocabulary mode, a seven-section guide, twenty-eight cumulative questions, four ungraded performance tasks and twelve separately labelled fluency items. The four teacher definitions remain verbatim.

Correct practice answers now deliver an immediate model-specific WHY. Wrong choices and meaningful typed error classes have concrete repairs. Number lines display a 0-to-1 whole bracket and counted intervals; beyond-one counts continue through whole-number boundaries. Large collections of whole shapes use readable two-column grids. Learn/Watch and feedback can retain both figures when a comparison needs them. Tests withhold teaching until submission and provide visual review for every correct or wrong answer. The natural “any fraction equal to one” value-policy example remains fair to equivalent answers, alongside explicit partition-policy questions.

The independent UI reviewer authored no lesson/resource content. Their manual sequence review covered every Learn/Watch sequence through source text/model pairs and 138 phone screenshots. They adjudicated the generated correct/wrong reasoning through 24 lesson authoring families at the main review, with the final narrow value/freshness deltas independently reviewed afterwards. The frozen six-lesson inventory contains 1,065 wrong-feedback nodes; this is family-level semantic review, not a claim that a human individually read every generated node. They inspected 114 actual pointer Check/Help states across nineteen representative families at 360 and 390 px, plus 72 lesson screenshots across six widths. Resource review covered every authored practice/test item and worked example through the resource families and explicit exceptions; 198 actual guide/vocabulary disclosure-opening states had no horizontal overflow against document client width. Print emulation exposes closed worked steps. Longer post-test review pages require ordinary scrolling.

Cross-review of 7-2 through 7-4 exercised 75 teaching cards, 826 valid feedback probes and 391 Help renders, including the final value-policy restoration. Cross-review of 7-5 through 7-7 exercised 857 feedback renders and 407 Help nodes, independently checking 1,656 nested models. These delivery counts support, rather than replace, the reviewers' source/model judgments. Automated full-inventory response probes and browser checks verify dispatched text, models, grading, focus and answer withholding; they do not award a semantic pass from schema fields, keywords or a picture's presence.

Meaningful typed probes include switched counts, wrong numerator/denominator, colored versus plain counts, ticks versus intervals, restarting a count after one, changing the whole, equivalent values under partition restrictions, zero denominators and zero numerators, blanks and malformed input. Arbitrary infinite input space was not manually tried. The value example explicitly checks 1/1, 2/2, 8/8, 0/4, 0/0 and unequal-count fractions.

## Findings closed before preview

- Fixed static or mismatched demonstrations, missing paired Learn/Watch models, denominator explanations that erased the original selected group/point, and generic or incorrect numeric repairs.
- Repaired numerator feedback that told children to count plain pieces, and whole-count feedback that treated interior pieces as separate wholes.
- Replaced grammatical vocabulary giveaways with grammatical false mathematical claims and matching examples/non-examples. Written fractions now bridge pictures to the top/bottom number roles.
- Enlarged and staggered dense interval labels. Replaced tall whole stacks whose count labels shrank to 4–6 px with grids; the largest eight-whole examples render count labels about 13 px on tested phones.
- Fixed guide overflow caused by intrinsic SVG widths, supplied keyboard-sized disclosure targets, and exposed closed worked steps for print. The original UI overflow probe used innerWidth and missed a mobile layout-viewport expansion; strict clientWidth checks caught and closed the issue.
- Replaced retrieval questions that repeated previously solved training examples. The cumulative test also avoids exact retrieval tasks used in the lesson tests; new tasks include counting remaining intervals, changing the numerator without repartitioning, and explaining why different subdivisions reach the same whole. QA canonical triage is manually adjudicated by objective: naming sixth-size pieces is not the same task as writing a selected fraction, and a later lesson's prerequisite is not automatically an earlier test leak.
- Preserved assistance/reveal history across retries, first-attempt results, response-revision review, and the natural whole-value policy. No storage or external service was introduced.

[Whole-count explanation](images/chapter7-whole-grid-mobile.png) · [Wrong-answer line correction](images/chapter7-line-correction-mobile.png) · [Paired reference](images/chapter7-paired-reference-mobile.png)

These are synthetic app screenshots, without textbook footage or identifying records.

## Frozen content identifiers

- `data/lessons/7-1.json`: `f74b69f27c18491f9a4eae2c797e3eba45cbf8c08b8e7911fd23dcc06392a3c7`
- `data/lessons/7-2.json`: `57009dece93e8702d6aa51ede274857c19f324793261a7f7ffd857c555f756b9`
- `data/lessons/7-3.json`: `c089aafcd98314c2879c394c06629958037129fd1e7f1755f4855170410f9e1b`
- `data/lessons/7-4.json`: `f2b46dfb88c4febd74283c3b3a298f9cca4cebe06cc84c63b892fa3cd07eb864`
- `data/lessons/7-5.json`: `fce7d8b93458dc2ac14862355977b5cc93cae07a81df9a6d79bc54e46515e26e`
- `data/lessons/7-6.json`: `04028a51202aa6092835bad4aeb5879f68727348241cc620e5e2f11f92f64778`
- `data/lessons/7-7.json`: `3a9ae71331856606d595a384ab658f35785049e34f902d3e152d55db5f4fe450`
- `data/chapters/7.json`: `66187595c0f412cd17132ffc861dfbffeb7a7532e5ddd1df85794c3f99e390f0`

## Future chapter workflow

The private Study Scoop Weekly Manager plugin was updated to version 0.4.1, release `pluginrel_6aef073d83c0819184fd66adec60cbb7`. All 13 saved source files matched readback. The new reusable visual-teaching reference applies to future Math chapters and resources; sample approval is recorded and honored without re-requesting the same gate. Plugin identity, private audience, presentation, and all newsletter workflow bytes are preserved. Saved instructions are verified; fresh-chat host behavior and learning effectiveness are not thereby verified.

## Release and rollback

Feature branch `feature/chapter7-teaching-expansion` targets develop. Preserve the production main ref, prior chapters, approved 7-1 data, weekly files and labs. Confirm successful Pages publication and compare deployed preview bytes before describing the expansion as live. Production requires a separate explicit owner approval. Roll back this expansion by reverting its eventual squash merge on develop through a reviewed PR; do not rewrite main or branch history.
