# Week of November 9–13: visual text review (proofreading gate)

Recorded during the 2026-11-12 text and accuracy audit (`docs/reviews/TEXT-AUDIT-2026-11-12.md`).

| Image | Text read (enlarged crops, letter by letter) | Result |
|---|---|---|
| images/flyers/2026-11-09-front.webp | Heading, dates, the five learning topics, the 12 spelling words in order, quiz and test lines, the four announcements and their dates, homework text | Matches `data/2026-11-09.json`. No letter errors. |
| images/flyers/2026-11-09-back.webp | Heading; the 12 vocabulary words and definitions; quiz line; the four Topic 7 math definitions | The heading in the owner-supplied clean image read **VOCAPULARY**. It was repaired to **VOCABULARY**: only the P was changed, using the letter's own bowl (pixels x 622–669, y 42–127). The final file was inspected again at 1× and at 4×. Definitions match the week file word for word. Teacher-source points, kept and reported: the "Winn Dixie" spelling has no hyphen; the denominator definition has no final period; the Distracted, Irritating and Trustworthy definitions do not fit the word's part of speech (each has a plain-words note in the week file). |
| images/words/lab-spelling-2026-11-09.webp | Grid of 12 pictures, no words | Cell 7 ("formal") showed a knight in armor, which teaches the wrong meaning. It now shows the existing reviewed tuxedo picture (`images/words/formal.webp`). Inspected again after the change. |
| images/words/lab-vocab-2026-11-09.webp | Grid of 12 pictures, no words | No stray text. Every cell matches its alt text. |
| images/homework/2026-11-09-clean-greater-than-one.webp | Worked example labels | **Corrected 2026-11-13 (forensic audit, owner request).** The whole-number labels 1 and 2 touched the 3/3 and 6/3 labels and could read like "¹3/3" or "6²/3". The example row's whole numbers 0, 1 and 2 now sit on their own row above the line at their ticks (glyphs copied from line 3 of the same page), the fractions below are untouched, and the stray double dash under the example's 4 box was removed. Saved lossless; the answers 4/3, 6/4, 5/2, 8/5, 9/5 and 5/3 are unchanged. |
| images/homework/2026-11-09-clean-*.webp (other three) | Passage, running counts, questions, number-line labels and boxes | Match `data/homework/2026-11-09.json`. |
