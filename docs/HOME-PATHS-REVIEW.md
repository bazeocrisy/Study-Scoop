# Home paths preview

Home now separates Schoolwork from Extra Learning. Schoolwork opens the existing weekly overview, with direct cards for Homework (including assigned reading), Spelling, Vocabulary, Math, Newsletter and Practice Tests. Extra Learning opens Reading Practice and Skill Builders. Reading Practice contains the existing eight original passages with their existing listening, word help, reading and comprehension features. This change does not establish a separate Reading Coach as completed.

The inventory found assigned reading in weekly homework and extra passages in data/reading. All existing activity URLs remain available. The brand and Home buttons now return to the two-path Home. Breadcrumbs name the relevant path; week selection survives navigation. No learning data, audio controls, illustrations, answer checking or privacy behavior changes.

Preview only. No production release is authorized by this change. Review Home, Schoolwork, Extra Learning and one activity from each path on desktop and phone before publishing. Rollback: revert the feature commit and rebuild using the normal Pages workflow.

Validation: 313 unit tests passed. 44 focused browser checks passed on source and publishable build, covering both paths, existing Reading/Chapter 7/assigned-comprehension links, week preservation and overflow at 360, 768 and 1366 pixels. Generated desktop and phone screenshots for review. Full regression status is recorded in the delivery message.
