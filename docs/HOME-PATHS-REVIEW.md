# Home paths preview

Home offers Schoolwork and Extra Learning. Schoolwork is a compact six-card chooser: Homework, Spelling, Vocabulary, Math, Newsletter and Practice Tests. Extra Learning offers Reading Practice and Skill Builders. Each landing has one Back to Home link, a compact heading, and its cards. Schoolwork also shows the selected week. There is no top subject menu, repeated opening label, duplicate newsletter shortcut or dashboard below the cards.

The existing Newsletter page retains weekly learning topics, school-test dates, announcements, assignment summaries and the original reviewed flyer. Math still recommends the selected week's chapter and keeps all chapters open. Homework still contains the received assignments and assigned reading. Extra reading remains the existing eight-passage library; this work makes no claim that a new Reading Coach is complete.

At 1366 × 768, all six Schoolwork cards fit without scrolling. On a 390 × 844 phone, the first choice starts within the upper third and five cards fit immediately. Both Extra Learning choices fit the phone viewport. Desktop uses three columns and two rows; phones use compact full-width cards.

Validation: 313 unit tests, 82 focused navigation/viewport checks against the publishable build, and 74 shared-layout checks passed. Existing functional journeys were checked, including a separate check for the system dark-mode fallback. Desktop and phone screenshots reviewed. The normal Pages workflow retains the full browser, homework, labs and chapter gates before preview publication.

Preview only; no production promotion is included. Rollback is a revert of this feature merge followed by the normal Pages rebuild. Technical checks do not establish observed child usability; the owner should try Home → Schoolwork → a subject → Back and the Extra Learning path.

Weekly Tests follows the selected newsletter's announced quizzes. It does not offer unrelated chapter reviews, even from a stored/direct test URL. November 9–13 lists spelling and ELA vocabulary only. Matching Math vocabulary can accompany an announced Math test; whole-chapter review remains in Math. A week without announcements has an explicit empty state. Question banks for unrelated Math topics are not loaded by weekly Tests.

Weekly-scope regression evidence: 321 unit tests, 47 dedicated browser checks on the publishable build, and 74 shared-layout checks passed. The new browser scope checks also run in the normal preview publishing gate. Existing functional journeys were checked, including a separate selected-week switch regression.
