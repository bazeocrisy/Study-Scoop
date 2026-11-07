# November 9–13 newsletter review

Source: two owner-supplied newsletter photos in this conversation. Page 1 is the vocabulary back; page 2 is the newsletter front. The printed pages omit a year; 2026 is inferred from the session date, the existing classroom archive, and Friday November 13. Text is legible; transcription confidence is high. Source photographs and their surrounding home backgrounds are not committed or published.

## Source-to-site crosswalk

| Source | Content | Destination | Confidence |
|---|---|---|---|
| Front heading | November 9–13 | `data/2026-11-09.json`: id, label; `data/weeks.json` | High; year inferred |
| Front learning | Fractions; Novel Study: Because of Winn-Dixie; Narrative and Opinion; tract/form; Adverbs; American Indians | learning | High |
| Front spelling | tractor, extract, attract, retract, distract, formed, inform, formal, uniform, misinform, traction, uninformed (in order) | spelling.words | High |
| Back top | Produce, Exception, Installment, Peculiar, Employee, Fortunate, Ignorant, Melancholy, Trustworthy, Constellations, Irritating, Distracted, with exact printed definitions | vocab.words | High |
| Both quiz notices | Friday 11/13: six randomly selected Winn-Dixie words; tract/form spelling test | tests; vocab.quiz; `data/tests/2026-11-09.json` | High |
| Back math | denominator, numerator, unit fraction, fraction and exact definitions | mathUpcoming.words; Newsletter view | High |
| Front announcements | Socksgiving 11/2–11/16; Field Trip 11/18; Early Release noon 11/20; Habitat Project due 12/9 | events | High |
| Front homework | Packet sent Monday, due Friday; Reading Log every Monday; three spelling activities with packet | homework, source newsletter | High |

All 12 vocabulary words are eligible for the six-word quiz. There is no narrower highlighted quiz-only subset on this sheet. Teacher definitions were compared against the photographs and independently reviewed. Existing November 2 definitions and vocabulary questions can be reused verbatim because this week's list is identical. The printed Distracted definition remains exactly “To prevent something from continuing as usual”; a parent note distinguishes the ordinary meaning and requests teacher confirmation. No Math test is announced.

## Supplemental learning content

Original spelling examples and root/prefix/suffix guidance are Study Scoop support, not teacher assignments. Tract/form is the teacher's pattern. Formed is form + ed; uninformed uses un- + informed. The current suffix engine studies prefixed/root words whole and now uses neutral guidance instead of falsely saying they have no shorter base. Spelling tests include all 12 words; vocabulary tests sample six distinct eligible words. Existing question engines are reused, including practice, listening, dictation and missed-question review. No physical homework packet or Reading Log has been received for this week.

November 2–6 remains current on November 6. November 9–13 is selectable as upcoming. No earlier week is changed. A future current-week switch requires a separate index update on/after November 9.

## Math curriculum gap

Chapter 7 is absent from the existing chapter library. The week does not recommend Chapter 6 for fractions, generate a new chapter, or alter existing Math chapters. Exact Topic 7 fraction definitions are available in Newsletter. The existing Math library remains open for earlier-topic review.

## Privacy and flyer

The initial photographs were withheld because they contained home backgrounds and no local source files were available. The owner subsequently supplied `Newsletter_Back.zip`, containing `Newsletter_Front.png` and `Newsletter_Back.png`, and explicitly requested hosting these improved images. Both images are page-only with no student names, grades, teacher/school identifiers, contact details or home backgrounds visible. They have been visually reviewed and converted to 1100 px-wide WebP copies with the printed text and page contents preserved. Front and back are now listed in the week’s privacy-reviewed flyer metadata and use the existing zoom, full-size and print viewer. The raw ZIP and PNG sources remain outside the public repository.

## Review and release

Six specialist reviews performed: curriculum, instruction, UI, interaction, accessibility, QA. The identified false morphology guidance and omitted text-only study cards were corrected. Repository and built-site targeted checks cover six routes at 360, 390, 768, 1024, 1366 and 1920 px, including all 12 study sentences, with no overflow, console errors or missing requests. Screenshot review covers all six widths. Static accessibility review found no introduced markup/control regression; full assistive-technology and physical-device checks are NOT VERIFIED.

Production publishing requires explicit owner sign-off. This change is prepared for a PR into develop, with no production merge. A live preview is not claimed until a deployment is confirmed. Rollback: close an unmerged PR; after an approved preview merge, revert its merge commit on develop.

Owner sign-off before production: review the new week and exceptions, check the teacher-definition note, accept the unavailable Chapter 7 lessons and review both supplied newsletter pages, confirm which week should be current, then explicitly approve the production PR.

## Image inventory

| Words | Status | Review |
|---|---|---|
| tractor | Reused existing approved 400 px WebP | Reviewed in rendered study card |
| Produce, Exception, Installment, Peculiar, Employee, Fortunate, Ignorant, Melancholy, Trustworthy, Constellations, Irritating, Distracted | 12 reused existing illustrations | Each reviewed independently; distinct, age appropriate and semantically appropriate; Distracted illustrates ordinary meaning |
| extract, attract, retract, distract, formed, inform, formal, uniform, misinform, traction, uninformed | 11 new original AI-generated illustrations, optimized to 400 px WebP | Each visually reviewed at phone-card scale; no written spelling labels, personal/contact data, or duplicates. Misinform regenerated after first scene was ambiguous |
| Newsletter front and back | Two new owner-supplied, privacy-reviewed clean pages | Page-only, readable, no personal/contact data or home background; optimized WebP copies hosted |

New images depict: juice extracted from orange; butterflies attracted to flower; turtle retracting into shell; attention distracted by puppy; children formed into circle; child informing friend about weather; formal suit at celebration; matching soccer uniforms; incorrect sunny-weather information while rain is visible; tread gripping path; child uninformed about gift contents. Learning pictures are supplementary study aids. Dictation and scored spelling tests continue to withhold pictures and written answers.

## Validation evidence

- Final unit tests: 247 passed, 0 failed.
- Allowlist build: 187 published runtime files, verified references and data, no personal names; source photos excluded.
- Full repository browser regression: 298 passed, 0 failed.
- November homework regression on repository: 220 passed.
- Targeted November 9 routes: 36 repository and 36 built-site checks passed at six widths; final art refresh checked separately.
- Six independent specialist reviews completed; findings and corrections described above.
- Physical-device, print on paper and screen-reader sessions: NOT VERIFIED.
