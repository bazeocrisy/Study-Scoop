# Reference prototypes (development only)

These are the original working prototypes from the Study Scoop handoff. They are kept so their
look and logic can be ported. They are **not** part of the site and nothing in the app links to them.

- `vocabulary-prototype.html`: study cards, flash cards, multiple choice, true/false, fill in the blank
- `spelling-test-prototype.html`: say-it-and-type-it spelling test

They are preserved as received except for the name review recorded in `docs/DECISIONS.md` (D2).
Known differences from the site's rules, to be fixed when porting, not here:

- They save small conveniences in `localStorage`. The site must not.
- They load Google Fonts. The site uses system fonts.
- Their words and questions are hardcoded to the week of Oct 12. The site reads `data/`.
