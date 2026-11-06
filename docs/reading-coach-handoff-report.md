# Reading Coach: comprehension exemplar. Handoff report for independent review

Prepared by Claude Code (programmer) for ChatGPT/Codex (architect and independent reviewer) and the Product Owner.
**Nothing in this report has been independently verified by ChatGPT/Codex.** Every result below is what the programmer observed. No merge or deployment was performed.

## 1. Baseline and final commits

| | SHA |
|---|---|
| Baseline `main` (production, Reading Coach from PR #28) | `f24b12f0914aaf4e742b30d1d407c16bbed88e61` |
| `develop` at the time (preview; left untouched) | `52a3ae5c3f58c075ce9993911ee907df8f9f2e0e` |
| Code, tests, data and screenshots commit | `f6e6e48890d1affa0f9cd129186ecef6e29ca8b4` |
| Branch head (adds this report and the decision record) | see the draft PR head; the report cannot contain its own commit id |

Existing work preserved: everything on `main` and `develop`. The branch starts from `main`, so `develop`'s own unmerged work (Spelling Study Cards, the chapter-test misses fix, the received-homework record, the Assignment 008 log) is neither included nor disturbed. Times Tables variants, Chapter 6 data, PR #24 and all deployment settings (`.github/workflows`) are untouched.

## 2. Branch and draft pull request

- Branch: `feature/reading-comprehension-exemplar`
- Draft PR: https://github.com/bazeocrisy/Study-Scoop/pull/31 (base `main`, **draft**, not merged)

## 3. What changed and why

The goal is progress from finding facts to elements, causes, inferences, evidence and summarizing, with less moment-to-moment direction from a parent. Adding questions was not the goal, so the work is a shared engine plus one fully worked exemplar, "The Missing Library Book". The other seven passages keep their original questions.

**Engine (`js/lib/coach.js`, new, pure logic with no DOM).** One item model serves every passage. A passage may carry a `coach` block (the exemplar); the other seven passages' `questions` and `elements` are converted into the same items, so they gain hints, help tracking and the parent summary with no content change. It provides: five answer states, graduated hints, help and reveal tracking, first-try history, retry rounds that keep history, bounded-answer matching, written-response states, the parent summary and two quality warning signals (answer-length bias, evidence overlap).

**Player (`js/reading-player.js`, rebuilt).** Recommended path with optional activities labelled in words; distinct "Next sentence" and "Next activity" controls; "Look back at the story" in Story map, Questions and Writing; hints and statuses on every question; retry; an optional Writing step; a pause-aware optional timer; the printable parent summary; and a warning before leaving.

**Exemplar content (`data/reading/missingbook.json`).** 2 listening items, a 6-item story map, 8 core questions in the required order (explicit detail, explicit detail, story element, story element, sequence, cause and effect, inference with supporting evidence, supported summary) and 3 optional written prompts. Section 6 lists every question, answer, accepted response and evidence reference.

**Other files.** `js/lib/reading.js` (scoring fixes, validation of the new block, evidence lists), `js/lib/leave-guard.js` (new), `js/app.js` (leave warning), `css/style.css`, `tests/lib/harness.js` (answers the browser's "Leave site?" prompt so tests are not blocked), `package.json` (the new browser suite is added to `test:browser` and `test:site`), the generator `scripts/author/reading-stories.mjs`, and `docs/DECISIONS.md` (D28).

## 4. Requirement-by-requirement checklist

Status key: **Done** = implemented and covered by an automated check named in section 5. **Partly** and **Not done** state what is missing.

### Scope and workflow
| Requirement | Status | Evidence |
|---|---|---|
| Voice, microphone, AI tutoring out of scope | Done | None added; browser read-aloud voice (already shipped) unchanged |
| Named feature branch; main untouched; PR #24 not merged; no deployment changes; no publish to main/develop | Done | Only the feature branch was pushed; `.github/` unchanged |
| Draft PR; approval left as the final step | Done | Section 2 and section 10 |
| Do not reconcile Times Tables or Chapter 6; keep PR #24 out of scope | Done | Not touched |
| First deliverable is one exemplar; other seven preserved; library not expanded | Done | Seven passages differ from baseline only in 11 evidence values (see issue 6); browser test answers every question of all seven |

### Reading experience
| Requirement | Status | Evidence |
|---|---|---|
| Keep multiple choice, true/false, blank, sequencing, answer explanations, story maps, optional activities, accessibility, optional timers, clue colours only in answer review | Done | Browser checks: "recommended path...", "Check answers stays available...", exemplar `explain` text shown on completion and in hint 3 |
| Clear recommended path without forcing every activity | Done | Browser: recommended path text; every step opens |
| "Next sentence" vs "Next activity" unmistakably different | Done | Browser: different container, label, colour and size |
| "Look back at the story" within Story Map and Questions | Done | Also in Writing; per question and per step |
| Opening the passage preserves answers, position and activity state; looking back is not failure | Done | Browser: no redraw, same page position (within 2 px scroll, 0 px question movement), typing intact, not counted as help |

### Question design (exemplar)
| Requirement | Status | Evidence |
|---|---|---|
| Eight core questions in the specified skill order | Done | Unit: `CORE_SKILLS` order; validator enforces it |
| Multiple choice, true/false and typed blanks across the set | Done | Unit and browser |
| Do not repeat a fact across Story Map and Questions | Done | 19 items, 19 distinct `fact` tags (validator and unit test). **Judgement call:** the story map "story arc" item and core question 5 (search order) both involve the search, at different grain; see section 8 |
| Three optional written prompts (cause or motivation, solution with evidence, summary) with sentence starters | Done | Unit and browser; the three starters from the brief are used verbatim |
| Blanks with a bounded answer separate from short responses | Done | Blanks are checked; written responses are never checked |
| A short response has a real text field | Done | Browser: 3 `<textarea>` fields with labels. The exemplar has no "say it, then show a good answer" item |
| No keyword or similarity grading of explanations; keep the response, show a model and checklist, label it self-assessed or parent-reviewed; no paid AI | Done | Unit: the engine exports no prose-grading function; statuses `selfAssessed` and `reviewed`; no network use |

### Question quality
| Requirement | Status | Evidence |
|---|---|---|
| Answerable from the passage, evidence for every answer, several sentences where one is insufficient | Done (exemplar and the evidence references of all eight) | Unit: evidence exists for every item of every passage; typed answers appear in their evidence; a sequence cites at least as many sentences as steps |
| Correct choices not consistently longer or more detailed | Done for the exemplar; **not done for the other seven** | Exemplar: right answer longest 2 of 12, shortest 3 of 12, none 1.5x longer than both wrong ones, and right answers fall 4/4/4 over the three positions. Other seven: longest 20 of 28 (71%), left as is by instruction (section 8) |
| Plausible but demonstrably incorrect distractors; no ambiguous questions | Done by author review only | Not independently validated; needs reviewer judgement (section 8) |
| True/false sometimes asks him to correct the false statement or choose supporting evidence | Done | Core question 2 (correction); questions 7 and 8 (evidence) |
| Questions and answers match ("where and when" gives both) | Done | Unit: every setting choice names a place and a time |
| Forgive reasonable spelling errors without accepting a different concept | Done, with a stated rule | One-letter slip or swapped neighbours forgiven on answers of 5+ letters; short answers must be exact so "bed" is never "bad"; a `reject` list blocks confusable concepts. Tested both ways |

### Hints, answers, feedback
| Requirement | Status | Evidence |
|---|---|---|
| Graduated help: look for, where, then answer; never the answer at first mistake | Done | Browser: a mistake opens no hint. Hint 1 never contains the answer; hint 2 points at the evidence sentence(s), which for an explicit-detail question can contain the answer's words (that is what "point to the sentence" means); only hint 3 states the answer and why |
| Answer-review area kept; no parent password or lock | Done | Browser: zero password fields; Check answers is a normal activity |
| Track help and answer reveals so later completion is not "independent" | Done | Unit and browser: seeing the answer before finishing makes it "with help"; after finishing changes nothing |
| Encouraging, accurate feedback in the specified words | Done | "You found it independently." / "You found it after a hint." / "Let's look for the clue together." / "Not answered yet." |
| Distinguish unanswered, independent, with help, still practicing, self-assessed or needs parent review | Done | Unit statuses; browser statuses |
| Unanswered never shown as wrong; self-assessed never combined with checked answers | Done | Browser: no "wrong" styling before any answer; summary lists them apart |
| First-attempt accuracy is not the main child-facing measure but is preserved for parent review | Done | Child-facing text counts found/hint/practicing; the printable summary has a "First try" column for the parent |
| Practice for missed questions or a new attempt without erasing readings or other work; original history kept | Done | Browser: retry keeps the timed reading, finished answers and the first try; unit: history kept. **Partly:** the per-round attempt list is held in memory but the summary shows only "(practiced again)" and the first try, not every round |
| Completion separate from performance; "Story complete" must not imply skipped activities | Done | Summary lists each activity as Done / Started / Not started; the phrase "Story complete" is gone (browser asserts it) |

### State and scoring fixes (each reproduced before the fix)
See section 5.2.

### Parent summary, privacy, leaving
| Requirement | Status | Evidence |
|---|---|---|
| Readable, printable summary with passage, activities, checked results, help, unanswered, written responses with review status, skills to revisit, timed readings | Done | Browser: content checks; print media hides the page chrome |
| Memory only: no localStorage, accounts, analytics, databases, transmission, persistence | Done | Browser: `localStorage`, `sessionStorage` and cookies all empty; the existing static test that forbids storage APIs passes |
| Explain that leaving or reloading clears work; warn before navigation that would discard it | Done | On-page notice; in-app links and the address bar ask first; a real browser "Leave site?" prompt appears only when there is work |

## 5. Verification

### 5.1 Commands and actual results (final tree)
All commands were run from the repository root on branch `feature/reading-comprehension-exemplar`.

| Command | What it ran | Actual result |
|---|---|---|
| `npm test` | all unit tests (`node --test "tests/unit/*.test.js"`), including `tests/unit/coach.test.js` (25 tests) and `tests/unit/reading.test.js` | **260 tests, 260 pass, 0 fail** |
| `npm run test:browser` | `tests/browser.test.js` (existing, whole site) then `tests/homework-nov02.browser.js` then the new `tests/reading.browser.js` | **297 passed, 0 failed**; **220** November homework checks passed; **29** Reading checks passed |
| `npm run test:site` | builds and verifies `_site`, then the same three suites against the built site | build verified (approved files only, references resolve, data valid, no personal names); **299 passed, 0 failed**; **220** homework checks passed; **29** Reading checks passed |
| `npm run test:all` | all of the above in one run | **exit code 0** |

Order of events, so the numbers are not overstated: the single `npm run test:all` run above was made on the final code and data. Afterwards I changed only the wording of two test assertion messages (the hint-2 wording corrected in section 4) and re-ran `npm test` (260 of 260) and `node tests/reading.browser.js` (29 checks passed). Adding this report and the decision record does not change any code or data. The two existing browser suites (`tests/browser.test.js`, `tests/homework-nov02.browser.js`) were not modified by this work and pass unchanged. The only shared test file changed is `tests/lib/harness.js` (it now accepts the browser's "Leave site?" prompt).

The new browser suite (`tests/reading.browser.js`) has 29 checks that drive the page with real mouse clicks, typed text and keys through the Chrome DevTools protocol. It covers: the recommended path; Next sentence versus Next activity; unanswered versus wrong; every format (typed blank, choice, true/false with correction, evidence, sequence); accepted equivalents and rejected wrong answers; graduated hints; help and reveal tracking; look back (answers, typing, position and focus preserved; not counted as help); drafts across activities; written responses; the timer (leaving, hiding, resuming); incomplete, too-short and assisted readings; the read-along tap; self-assessment kept apart; all seven other passages answered in every format; the parent summary and print; leaving warnings and a real browser "Leave site?" prompt; keyboard use and focus; accessible names; six viewport widths; and the other nine sections still opening without errors.

### 5.2 The seven reported issues: before and after
"Before" is output from `docs/reading-coach-baseline-repro.mjs` run against the unmodified baseline `f24b12f` (it needs that commit's code to run). "After" is the named check on the final tree.

| # | Reported issue | Before (baseline `f24b12f`, observed) | After (check) |
|---|---|---|---|
| 1 | Unchecked typed answers disappear when switching steps | Typed "desk", left and returned: box held "" | Browser: "typed answers survive switching activities..." and "looking back preserves... typing" |
| 2 | Timed reading includes time on another step | Timer running; after about 3.2 s away it showed "0:03" | Browser: "the timer pauses when he leaves the activity..." (away 2.4 s, recorded 1 to 2 s) |
| 3 | Incomplete reading recommends advancing | `scoreReading({total:100, stoppedAt:10, errors:0, seconds:4})` gave 150 words/min and "Try a story from the next step" | Unit: `an incomplete, implausibly short or assisted reading never recommends moving on`; browser: incomplete, too-short and assisted readings |
| 4 | Self-marking counts as "right on the first try" | After only tapping "I got it": "Questions: 1 of 5 right on the first try" | Browser: say-it items are self-checked, listed apart, "Found independently: 0" |
| 5 | Results suggest retrying but there is no retry flow | Only control was "Read this one again", which also erased the saved timed reading | Browser: retry keeps readings, finished work and the first try |
| 6 | Some evidence references do not support answers | Heuristic flagged 11; manual review found five real defects (Pip characters, Pip "why the coat", leaf main idea, leaf cause, Rain Delay order) and the rest were false alarms; I also widened single-sentence evidence for three orders, two main-idea items and one cause item | Unit: evidence checks over all eight passages; seven passages changed in exactly 11 evidence values and nothing else (checked by diffing each file against the baseline) |
| 7 | Tapping a word during read-along cancels playback without resetting the display | Button still read "Stop"; 2 words or sentences stayed lit | Browser: "tapping a word during read-along stops the voice AND resets..." |

Baseline repro output (verbatim):

```
#3 Incomplete reading can recommend advancing
   reproduced: YES
   scoreReading -> wrr=150, finished=false; suggestion -> "Fast and accurate! Try a story from the next step."
#6 Some evidence references do not support their answers
   reproduced: YES
   11 weak references, e.g.:
     - pip q3(choice) -> evidence sentence 6: "She took off her coat and wrapped it around Pip." shares no key word with answer "Pip was wet and cold"
     - pip map:characters(blank) -> evidence sentence 4: "Then a girl named Tia saw her." shares no key word with answer "puppy"
     - busybees q0(choice) -> evidence sentence 0: "Honey bees are small insects that live in big groups called " shares no key word with answer "A colony"
     - missingbook map:characters(blank) -> evidence sentence 8: "He told his mom the truth." shares no key word with answer "mom"
     - leafcolor map:mainidea(say) -> evidence sentence 2: "Why does this happen?" shares no key word with answer "Why leaves change color in the fall."
     - leafcolor map:cause(blank) -> evidence sentence 7: "There is less sunlight, so the tree stops making food." shares no key word with answer "green"
#1 Unchecked typed answers disappear when switching steps
   reproduced: YES
   typed "desk", after leaving and returning the box holds ""
#2 Timed reading includes time spent on another step
   reproduced: YES
   timer started, reader left for ~3.2 s, came back: timer still running and shows "0:03" (should not count time away)
#4 Self-marking counts as "right on the first try"
   reproduced: YES
   after only tapping "I got it" on a say-it question: "Questions: 1 of 5 right on the first try"
#5 Results suggest retrying questions, but there is no retry flow
   reproduced: YES
   text suggests retrying: true; controls on the page: ["go:Check the answers","restart:Read this one again"]; the only way to "try again" is "Read this one again" (restart), which also erased the saved timed reading (1 reading before, 0 after)
#7 Tapping a word during read-along cancels playback without resetting its display
   reproduced: YES
   button before tap: "Stop"; speech cancelled by the tap: true; button after tap: "Stop"; highlighted words/sentence still lit: 2

Summary: 7 of 7 reproduced (#3 yes, #6 yes, #1 yes, #2 yes, #4 yes, #5 yes, #7 yes)
```

### 5.3 Simulated versus physical devices
Phone, tablet and desktop checks (360, 390, 768, 1024, 1366, 1920 px wide) use headless Chrome's emulated viewport and touch. **They are simulated.** No physical iPhone Safari or Chromebook Chrome test was performed. No audio was heard: speech uses test doubles in the automated checks.

## 6. Exemplar: questions, answers, acceptable responses, evidence

Evidence is written as sentence numbers S1 to S16. "Right answer" for a blank is the completed sentence. Hint 1 (what to look for), the explanation and the written-prompt models are in `data/reading/missingbook.json`.

Passage sentences (S1 to S16):
- S1: Noah loved his new library book about sharks.
- S2: He read it every night before bed.
- S3: On Friday, the book was due back at the library.
- S4: Noah looked on his shelf, but the book was not there.
- S5: First, he looked under his bed and behind his desk.
- S6: Then he even checked his backpack twice.
- S7: The book was lost!
- S8: Noah felt worried because he did not want to lose a library book.
- S9: He told his mom the truth.
- S10: "Let's think," she said. "Where did you last read it?"
- S11: Noah remembered reading in the car on the way home from his cousin's house.
- S12: Next, his mom walked out to the car and looked in the back seat.
- S13: There was the shark book, tucked beside the seat.
- S14: Noah smiled and gave his mom a big hug.
- S15: He returned the book on time.
- S16: He learned to keep his books in the same place every night.

### Listening (text hidden)

| # | Skill | Format | Question | Right answer | Also accepted / notes | Evidence |
|---|---|---|---|---|---|---|
| 1 | listen | multiple choice | What was Noah's library book about? | Sharks |  | S1 |
| 2 | listen | true/false | True or false: Noah found his book on his shelf. | False |  | S4 |

### Story map

| # | Skill | Format | Question | Right answer | Also accepted / notes | Evidence |
|---|---|---|---|---|---|---|
| 1 | element | typed blank | The other main character, besides Noah, is his ___. | The other main character, besides Noah, is his mom. | typed: mom, mother, mum, mommy (case, punctuation, "the/a/an" ignored; one-letter slip forgiven on words of 5+ letters) | S9, S10 |
| 2 | element | multiple choice | Where and when does most of this story happen? | In Noah's room and in the car, on the Friday the book was due |  | S3, S4, S5, S12 |
| 3 | element | multiple choice | What problem does Noah have? | He cannot find his library book, and it is due |  | S3, S4, S7 |
| 4 | sequence | sequence | Put these big moments of the story in order. | 1. Noah cannot find his library book  2. Noah's mom helps him think about where he read it last  3. Noah returns the book on time | tap cards in this order | S4, S10, S15 |
| 5 | element | multiple choice | How was the problem solved? | Noah and his mom looked in the car and found the book |  | S11, S12, S13 |
| 6 | element | typed blank | Noah learned to keep his books in the ___ place every night. | Noah learned to keep his books in the same place every night. | typed: same (case, punctuation, "the/a/an" ignored; one-letter slip forgiven on words of 5+ letters) | S16 |

### Eight core questions

| # | Skill | Format | Question | Right answer | Also accepted / notes | Evidence |
|---|---|---|---|---|---|---|
| 1 | detail | typed blank | Noah read his new book every night before ___. | Noah read his new book every night before bed. | typed: bed, bedtime (case, punctuation, "the/a/an" ignored; one-letter slip forgiven on words of 5+ letters) | S2 |
| 2 | detail | true/false | True or false: Noah returned the book late. | False. Corrected: Noah returned the book on time. | then: "Which sentence fixes the false statement?" -> Noah returned the book on time. | S3, S15 |
| 3 | element | multiple choice | How did Noah feel after the book was found? | Relieved and thankful |  | S13, S14 |
| 4 | element | multiple choice | What question did Noah's mom ask that helped him? | Where did you last read it? |  | S10 |
| 5 | sequence | sequence | Put the places Noah and his mom looked in order, first to last. | 1. Under his bed and behind his desk  2. In his backpack  3. In the back seat of the car | tap cards in this order | S5, S6, S12 |
| 6 | cause | multiple choice | Why did Noah's mom look in the car? | Noah remembered reading there on the drive |  | S11, S12 |
| 7 | inference | multiple choice | What can you tell about Noah from the way he searched for the book? | He is careful with library books (proof: Then he even checked his backpack twice.) | then: "Which sentence from the story best supports your answer?" -> Then he even checked his backpack twice. | S5, S6 |
| 8 | summary | multiple choice | Which is the best summary of the story? | Noah loses his library book, tells his mom, and they find it in the car, so he returns it on time. (proof: There was the shark book, tucked beside the seat.) | then: "Which sentence from the story best supports the ending of the summary?" -> There was the shark book, tucked beside the seat. | S4, S9, S13, S15 |

### Optional written responses (real text field, self-assessed, never auto-graded)

1. **Why was Noah worried when he could not find the book? Write your answer in your own words.**
   - Starter: Noah was worried because ___.
   - Model: Noah was worried because he did not want to lose a library book, and the book was due back on Friday.
   - Checklist: (I said why Noah felt worried (he did not want to lose a library book).) (I used a detail from the story, such as the book being due on Friday.) (My answer makes sense by itself and is in my own words.)
   - Evidence: S3, S7, S8
2. **How did remembering where he last read the book help Noah solve the problem? Use what the story says.**
   - Starter: Remembering where he last read helped because ___.
   - Model: Remembering where he last read helped because Noah remembered the car ride home, so his mom looked in the back seat and found the shark book tucked beside the seat.
   - Checklist: (I explained how the memory helped (it showed where to look).) (I used evidence from the story (the car, the back seat, or where the book was found).) (I told what happened next (the book was found).)
   - Evidence: S10, S11, S12, S13
3. **Tell what happened in the story, in order, from beginning to end.**
   - Starter: First ___, then ___, and finally ___.
   - Model: First Noah could not find his library book, then he told his mom and remembered reading in the car, and finally they found the book and he returned it on time.
   - Checklist: (I told the beginning, middle and end in order.) (I included the problem and how it was solved.) (I left out small details and used my own words.)
   - Evidence: S4, S9, S11, S13, S15

## 7. Screenshots

In `docs/screenshots/reading-comprehension/` (desktop 1280 px unless named phone, which is a simulated 390 px):
`questions-unanswered.png` (all eight questions, nothing marked wrong), `help-three-levels.png` (a mistake, then hints 1 to 3 and the status change), `look-back-open.png` (the story open under a question with typing kept), `written-response.png` (text field, starter, model, self-check checklist, "Self-assessed" label), `parent-summary.png` (the printable summary), `phone-questions.png`, `phone-summary.png`.

## 8. Known limitations, judgement calls and checks that still need a real device or a person

**Where I challenged or interpreted the brief**
1. *Story map versus questions.* The map keeps all six element items, so repeating a fact was avoided by giving every item its own fact tag (19 distinct). Two items overlap in subject, not in fact: the map's "story arc" ordering and core question 5 (search order). A reviewer may prefer to drop one.
2. *Passage-original "say it" items* have no text field. The brief's rule (a short response needs a real field) is met in the exemplar; the other seven keep their original items, now labelled self-checked and kept out of the scores. They need rewriting when the design is applied to them.
3. *Spelling forgiveness* is deliberately limited to answers of five letters or more.
4. I changed seven other passages' evidence references (11 values, nothing else) because issue 6 asks for them to be fixed. If that exceeds "preserve the other seven", the change is isolated in one generator edit and easy to revert.
5. Answer positions of the other passages' multiple-choice story-map items are now seeded by passage, so the right answer to, say, every Setting question is not in the same place. This changes only the display order of choices.

**Not done or not validated**
- **Answer-length bias remains in the other seven passages** (right answer longest 20 of 28 times, 71%), by instruction. An automated length check is a warning signal, not proof of quality.
- **Distractor quality, ambiguity and educational value need a human reviewer.** I wrote and self-reviewed them; nobody else has.
- Evidence heuristic: it flags items whose answer shares no word with the evidence. The remaining flags (3 in the exemplar, 1 in each of five others) were reviewed and are synonyms, inference or false statements; this is a rough filter, not proof of support.
- No physical iPhone Safari or Chromebook Chrome test; no audio heard; **no educational validation with a child**. Voice quality and word highlighting on real devices are unverified.
- The new browser suite is added to the `test:browser` and `test:site` scripts, so the repository job runs it. The built-site CI steps call explicit commands in `.github/workflows/pages.yml`, which I did not edit (deployment settings are out of scope), so those steps do not yet run it.
- Session work is memory only by design. A cancelled "leave?" from the Back button restores the address but leaves one extra history entry.
- A timed reading with an implausible duration is labelled "Not shown" for pace; the thresholds (5 s minimum, 250 words a minute maximum) are my choice and need the Owner's judgement.
- The summary shows only the first try and "practiced again" per retried question, not every round.

## 9. This file
`docs/reading-coach-handoff-report.md` in the branch; a copy was also given to the Product Owner.

## 10. Production approval request (concise)
Nothing was merged or deployed. Requested of the Product Owner, in this order:
1. Have the reviewer read sections 4, 6 and 8, and the exemplar's distractors in particular.
2. Try "The Missing Library Book" on the child's real device and report what you see and hear (voice, highlighting, the timer, typing on a tablet keyboard, printing the summary).
3. Decide the open judgement calls in section 8 (items 1, 4 and the timer thresholds).
4. If satisfied, approve marking the draft PR ready and merging into `main`. Production would then show the improved exemplar and the shared fixes; the other seven passages would gain hints, help tracking and the summary with their questions unchanged.
Not requested: changing `develop`, PR #24, Times Tables, Chapter 6 or deployment settings.


## Appendix: answer-length check across all eight passages (warning signal only, not proof of quality)

| Passage | Choice sets | Right answer is the longest | Right answer is the shortest | Right answer at least 1.5x longer than both wrong ones |
|---|---|---|---|---|
| stuckkite | 4 | 2 (50%) | 0 | 2 |
| pip | 4 | 2 (50%) | 2 | 1 |
| busybees | 4 | 4 (100%) | 0 | 1 |
| missingbook (exemplar) | 12 | 2 (17%) | 3 | 0 |
| leafcolor | 4 | 3 (75%) | 0 | 2 |
| lemonade | 4 | 4 (100%) | 0 | 4 |
| octopus | 4 | 2 (50%) | 1 | 2 |
| raindelay | 4 | 3 (75%) | 0 | 3 |

TOTAL choice sets 40; right answer is the longest 22 (55%); shortest 6; at least 1.5x longer than both wrong 15
OTHER SEVEN: 20 of 28 (71%) longest
