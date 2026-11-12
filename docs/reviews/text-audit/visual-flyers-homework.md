# Visual proofread: flyers, homework images, PDF, lab grids, embedded images

Auditor: independent visual proofreader (read-only). Date: 2026-11-12.
Method: Every image was opened at full size. Each text region was cropped and enlarged 1.2–2x with PIL (crops are in `scratchpad/audit/vis/`) and read letter by letter. Text was compared with `data/<week>.json`, `data/homework/*.json` and `docs/weekly/*`. Running word counts on every fluency passage were recounted with a script. Every math diagram and worked example was recomputed.
Provenance caveat: the raw original photos are not in the repository. "Likely source" is an inference. It is strongest where an earlier photographed flyer uses the same teacher template (see finding 1).

## Findings

| # | Image (file + region) | Text seen | Problem | Recommended correction | Severity | Likely source |
|---|---|---|---|---|---|---|
| 1 | `images/flyers/2026-11-09-back.webp`, heading banner (top, y≈20–140) | **VOCAPULARY** | Misspelled heading (B rendered as P). The teacher's template on the photographed 10-26 and 11-02 backs reads VOCABULARY in a decorative font. That font draws the B with a flat, open-looking bowl, so a redraw/upscale probably misread it as P. The 11-09 page is a full re-render: crisp vector-like edges, and the word headings use a different slab font from the teacher's handwriting font. | Fix the heading to "VOCABULARY". Do this by editing the image text or by asking the owner for the unprocessed photo, then re-check the whole page. Until then, do not present this page as a faithful copy. | Major (child-facing misspelling of a core word on a published study sheet) | Study Scoop / owner image processing or recreation (strong evidence: the same template in the 10-26 and 11-02 photos is spelled correctly) |
| 2 | `images/flyers/2026-11-09-back.webp`, whole page | Vocab cells in a slab-serif font; Topic 7 cards re-laid out 2×2 (denominator / numerator / unit fraction / fraction) | This is a full redraw, not a crop. All other words were checked and match the teacher wording and `data/2026-11-09.json`. Because the page was redrawn, the `flyer.note` claim "Text and page content preserved; resized and compressed" is inaccurate. | Update the flyer note to say the page is a cleaned/re-rendered copy. Keep the letter-by-letter verification (done here: no other letter errors found). | Minor | Study Scoop / owner recreation |
| 3 | `images/homework/2026-11-09-clean-greater-than-one.webp`, problem 1 (example) labels under the 3/3 and 6/3 ticks | "¹3/3" and "6²/3" | The whole-number labels "1" and "2" are drawn as small raised digits touching the 3/3 and 6/3 fractions. A third grader can read them as exponents or as mixed numbers ("1 3/3", "6 2/3"). The label for 0 is placed differently (alone). The math is right (3/3 = 1, 6/3 = 2), but the label collision is confusing. | Put the whole numbers 1 and 2 on their own line, under or above the fractions, as on lines 2–6 (e.g. "1" under "3/3"), or write "3/3 = 1". | Major (misleading math label on the worked example) | Study Scoop recreation |
| 4 | `images/homework/2026-11-09-clean-greater-than-one.webp`, example answer box (right of line 1) | A short double dash "═" between the "4" box and the fraction bar | Stray mark that looks like an equals sign or a second fraction bar | Remove the stray double line | Minor | Study Scoop recreation |
| 5 | `images/homework/2026-10-26-reading.webp`, lines 10–11 | "its helps our bodies"; "Eating healthy can also give you" | Grammar errors in the passage ("it helps"; "gives"). The image was not altered here. | Leave the image as is (faithful copy). Optionally note the errors for the teacher. Do not copy them into Study Scoop's own text. | Minor | Teacher original (publisher passage) |
| 6 | Flyer backs `2026-10-26-back`, `2026-11-02-back`, `2026-11-09-back`: Trustworthy / Irritating / Distracted cells | "The ability to keep promises"; "To anger or bother"; "To prevent something from continuing as usual" | The definitions don't match the word's part of speech or meaning. Distracted is defined like "disrupt/interrupt", Irritating like the verb "irritate", and Trustworthy like a noun. The images match `data/*.json` exactly. | No image change (teacher material). Make sure Study Scoop's own learning text adds clarifications. IMAGES.md already notes a definition warning for Distracted. | Minor | Teacher original |
| 7 | All three flyer backs, banner line | "Because of Winn Dixie vocabulary" | Missing hyphen in "Winn-Dixie" (the fronts spell it with a hyphen) | None needed (teacher original). Site text uses "Winn-Dixie". | Minor | Teacher original |
| 8 | `2026-11-09-back` and `2026-11-02-back`, denominator card | "...It is the bottom part of the fraction" (no period) | Missing final period. The recreation reproduced it faithfully. | None needed | Minor | Teacher original |
| 9 | `images/flyers/2026-11-02-front.webp`, What We're Learning, last bullet | "Social Studies - American" (the next word is hidden under the QUIZZES AND TESTS header) | Text is cut off by the teacher's layout overlap. The 11-09 flyer shows the full text: "American Indians". The data already records this. | None (already handled in data) | Minor | Teacher original layout |
| 10 | `images/flyers/2026-10-26-front.webp` (learning box and quizzes box); `2026-10-26-back.webp` (right column, Melancholy/Irritating/Distracted cells) | Grey graphite or smudge marks over the text | Every word is still readable at 2x. The marks lower print quality. | Optional: light cleanup by contrast only. Do not redraw (see finding 1). | Minor | Physical paper or photo (not processing) |
| 11 | `images/homework/2026-10-26-area.webp`, bottom strip | Page number "P... 22" cut in half by the crop; tiny credit "© THE ...TEACHER 20??" illegible | The publisher credit cannot be read, and the page number is cropped | Optional: re-crop from the original photo to keep the credit legible. If it is not legible in the source, record that in docs. | Minor | Unsure (photo resolution or crop) |
| 12 | `images/homework/2026-11-02-fractions-parts.webp`, bottom-left | Item "12." numeral and "©Remedia Publications" washed out by glare (only "...cations" visible) | Item 12's number is almost invisible. The credit is illegible. | Brighten or re-crop that region, or add a text caption with the credit. Item 12 = four-fifths. | Minor | Photo glare (not recreation) |
| 13 | `images/homework/2026-11-02-fractions-identifying.webp` and `2026-11-02-reading-questions.webp`, background | Faint show-through text from another page ("...Please answer the questions on the back", passage lines; mirrored on the questions page) | Ghost text behind problems 4–9 and behind the writing lines. It is distracting but does not change any answer. | Optional: raise contrast or whiten the background | Minor | Physical paper show-through in photo |
| 14 | `images/homework/2026-10-26-questions.webp`, whole page | Heavy diagonal shadow across both questions | Text is legible, but the page prints poorly (dark band) | Optional: shadow removal or contrast adjustment | Minor | Photo lighting |
| 15 | `images/homework/2026-11-02-fractions-parts.webp`, top-right corner; `2026-11-02-reading-passage.webp`, top-left corner ("ne" of "Name" clipped) | Jagged dark wedge or clipped corner from the perspective crop | Crop artifacts; on the passage the "Name" label is clipped | Optional re-crop | Minor | Study Scoop image processing (crop/straighten) |
| 16 | `downloads/homework-2026-10-19.pdf`, pages 1–2 (body numerals) | "4ØØ", "1Ø", "1ØØ", "11Ø" | The font's slashed/dotted zero looks like Ø, which can confuse third graders reading "400" | Use a numeral font with plain zeros for print (the number-line labels already use plain zeros) | Minor | Study Scoop (generated PDF) |
| 17 | `downloads/homework-2026-10-19.pdf`, PDF page 4 header | "Page 3 Word Problems" on the 4th PDF page | The reading questions spill onto PDF page 3 with no header, so the packet's page labels don't match the physical pages. Textarea resize handles also print as small diagonal marks in the answer boxes. "Reading chart (not saved)" is web wording in print. | Keep each packet page to one sheet or relabel. Hide resize handles and "(not saved)" in print CSS. | Minor | Study Scoop (generated PDF) |

### Verified correct (no finding)
- **11-09 front**: every word read: 12 spelling words in order (tractor ... uninformed), learning list, 11/13 quizzes ("BOWD" is the teacher's own abbreviation, also on the 11-02 photo), announcements 11/2–11/16, 11/18, 11/20 noon, 12/9, homework paragraph. No letter errors. Matches `data/2026-11-09.json`.
- **11-09 back**: all 12 Winn-Dixie words and definitions and all 4 Topic 7 definitions match `data/*.json` word for word, apart from finding 1.
- **11-02 front/back, 10-26 front/back** (photos): spelling lists (10 and 15 words, in order), dates (11/3 Area Test, 11/6 quizzes, 10/30 quizzes, BOONanza 10/29 6–7pm, events) and Topic 6/7 vocabulary match the data.
- **10-26 Area Homework**: all 12 areas recomputed (28, 72, 8, 81, 14, 56, 18, 20, 42, 2, 40, 6). The joke code 18-28 / 56-40-8-18-6-72-18 decodes to "AN IMPASTA", which is consistent. Worked example 4×7=28 sq cm is correct.
- **10-26 Draw the Area**: example 6 un × 2 un = 12 square units is correct. Targets 12/16/18/36/15/24 match the data.
- **10-26 Healthy Eating passage**: all 16 running counts recounted (11 ... 180), all correct.
- **11-02 My Favorite Author passage**: all 16 running counts (12 ... 196) correct. The question text matches the release notes.
- **11-02 Identifying Fractions / Recognizing the Parts**: worked examples 1/3, 2/5 and 3/4 are correct.
- **11-09 Greater Than 1**: tick spacing measured in pixels. The X positions are 4/3, 6/4, 5/2, 8/5, 9/5 and 5/3, matching the `data/homework/2026-11-09.json` answers.
- **11-09 Missing Fraction**: the missing values 2/3, 2/6, 1/2, 4/5, 1/4 and 5/8 match the data. Tick positions are evenly spaced.
- **11-09 Cherries fluency**: all 16 running counts (10 ... 175) recounted and correct; the 175 total matches the data. **Cherries comprehension**: both prompts match the data.
- **PDF 10-19**: the Pumpkin Patch running counts (11 ... 153) are correct. Rounding items have unique correct answers. Number-line dots measured: 47 sits at 0.4 of the 45–50 interval and 525 at the midpoint of 500–550, both correct. The word problems (24÷4, 5×7) are well formed.
- **Lab grids** (`lab-spelling-2026-11-09.webp`, `lab-vocab-2026-11-09.webp`, 3×4 cells each): no letters, words or pseudo-text anywhere. They contain only symbols ("i", "?", red X, arrows, coins, a handshake). Minor non-text notes: the distract cell shows a game console with Nintendo-Switch-like colouring, and coins carry "X" marks. The copies embedded in `labs/2026-11-09-*.html` are byte-identical (MD5) to these files.
- **`images/cone.svg`**: no `<text>` elements; shapes only.

### Informational (outside the text-proofreading scope; not counted as findings)
- `games/multiplication-mastery-8.html` embeds two JPEG photos of a real child: an identifiable face, a "GA" team logo on the cap and jersey, and a field sign reading "200". The page text names the child. DECISIONS **D28** records this as an explicit Product Owner exception, so it is not reported as a defect. The visible text in the photos is limited to "GA", "200" and a partly hidden jersey number. Whether the hidden number is #21 (the header's "#21") cannot be confirmed from the image.

## Images inspected (22 raster sources + 1 PDF + 1 SVG)
1. images/flyers/2026-10-26-front.webp
2. images/flyers/2026-10-26-back.webp
3. images/flyers/2026-11-02-front.webp
4. images/flyers/2026-11-02-back.webp
5. images/flyers/2026-11-09-front.webp
6. images/flyers/2026-11-09-back.webp
7. images/homework/2026-10-26-area.webp
8. images/homework/2026-10-26-draw.webp
9. images/homework/2026-10-26-reading.webp
10. images/homework/2026-10-26-questions.webp
11. images/homework/2026-11-02-fractions-identifying.webp
12. images/homework/2026-11-02-fractions-parts.webp
13. images/homework/2026-11-02-reading-passage.webp
14. images/homework/2026-11-02-reading-questions.webp
15. images/homework/2026-11-09-clean-greater-than-one.webp
16. images/homework/2026-11-09-clean-missing-fraction.webp
17. images/homework/2026-11-09-clean-cherries-fluency.webp
18. images/homework/2026-11-09-clean-cherries-comprehension.webp
19. images/words/lab-spelling-2026-11-09.webp (+ identical data URI in labs/2026-11-09-spelling.html)
20. images/words/lab-vocab-2026-11-09.webp (+ identical data URI in labs/2026-11-09-vocab.html)
21–22. games/multiplication-mastery-8.html data-URI JPEGs (640×960 portrait, 595×900 batting-cage photo)
23. downloads/homework-2026-10-19.pdf (4 pages, rendered with pdftoppm at 90 and 300 dpi)
24. images/cone.svg

## Not verified / limits
- The raw original photos are not in the repo. Whether findings 1–4 came from Study Scoop or from the owner's pre-cleaned images ("Newsletter_Back.zip", the "recreated PDF") cannot be proven. Finding 1 is inferred from the teacher template in the two older photos.
- Tiny publisher credit on the 10-26 Area sheet: illegible at the available resolution.
- Individual `images/words/*.webp/png/svg` word cards were out of scope and not inspected.
