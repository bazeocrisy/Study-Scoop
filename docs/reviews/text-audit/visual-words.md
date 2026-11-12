# Visual proofread: images/words/ (134 files)

Scope: every file in `images/words/` (63 .webp, 42 .png, 27 .svg, 2 atlas .webp = 134). Raster images were viewed (contact sheets and zoomed crops in this folder's `words/` subfolder); the 12+12 atlas cells were checked against `data/pictures.json` `illustrations` alt text. SVGs could NOT be rasterized (no cairosvg / rsvg-convert; Chrome not started per instructions), so all 27 SVGs were proofread from their markup (every `<text>` element and every shape). Alt text: photos and drawings have no per-file alt in `data/pictures.json`; the page supplies generic alt ("Study card for the word …", "Picture for the word …", "Picture showing what … means", or empty in one decorative use) via `js/views/common.js wordPicture()`. Only the 24 atlas cells carry descriptive alt text. PNGs are unpublished masters (excluded by the site build); they were checked for consistency with their WebP twins.

No misspelled or garbled words were found in any image. Text transcribed: card labels (actor, amazing, asking, bigger, bolder, boxer, conductor, crashing, dancing, doctor, flying, heating, helper, jumping, landing, lifting, opening, pitcher, runner, rushing, shipper, skipping, stepping, swimmer, talker, teacher, thinking, tractor, walker, winking), "3+2=5" (teacher), "No phones / No food / Water is OK" (exception), "Month 1 / Month 2 / Month 3" (installment), "B" cap logo (pitcher); SVG text: "?" (asked, ignorant), "Dinner time!" (called), "$" (employee, installment), "JAN/FEB/MAR" (installment), "BZZZ!" (irritating), "HEAVY" (lifted), "z z" (peculiar), "GOAL!" (screamed), "I promise!" (trustworthy). Shipper box labels are illegible micro-print (not real words, not legible at any size) — acceptable.

## Findings

| Image | What is seen | Problem | Recommended correction | Severity |
|---|---|---|---|---|
| formed.webp | Four children holding hands in a circle on a playground | People rule: girl on left (light skin, straight dark hair) and boy in front (light skin, straight brown hair, back view) are not Black. Meaning (formed a circle) is fine | Regenerate/recolor so all four children are Black, keep the circle | Critical (project rule) |
| inform.webp | Girl with backpack points and tells a boy that rain is coming (speech bubble: storm cloud) | People rule: the boy on the right is white (light skin, freckles, light-brown straight hair) | Regenerate with a Black boy | Critical (project rule) |
| misinform.webp | Boy says "sunny" (sun bubble) while rain falls outside; puzzled girl | People rule: girl on right has light skin and long wavy brown hair — not Black. Meaning is good | Regenerate with a Black girl | Critical (project rule) |
| uninformed.webp | Boy knows a teddy bear is in the gift box; girl has a "?" bubble | People rule: both children are light-skinned (boy with freckles and straight brown hair) — not Black. Meaning is good | Regenerate with Black children | Critical (project rule) |
| extract.webp | Two hands squeeze an orange; juice pours into a glass | People rule: the hands are light/peach skinned (white). Meaning (extract juice) is good | Recolor the hands to a brown/dark-brown skin tone | Major |
| amazing.webp / amazing.png | Amazed boy; magician's hand with wand at top right pulls a rabbit from a hat | People rule (ambiguous): the magician's hand is a light orange-tan, clearly lighter than the boy | Darken the hand to a brown skin tone | Minor |
| conductor.webp / conductor.png | Black conductor with baton; two violinists in the foreground | People rule (ambiguous): right-hand violinist has light skin and brown wavy hair; may read as non-Black | Darken the right violinist's skin/hair to match the rule | Minor |
| uniform.webp | Three children in matching teal soccer uniforms | People rule (ambiguous): the left child is noticeably lighter (light tan) than the others | Darken the left child's skin tone | Minor |
| fortunate.webp / fortunate.png | Smiling girl in a yellow raincoat under a red umbrella in heavy rain | Meaning: definition is "favored by good luck"; the picture reads as "rainy day / umbrella", not good luck. Week sentences talk about rain STOPPING before a picnic/game | Use a picture of rain clearing over a picnic (as in the 2026-11-09 vocab atlas cell 5) or a found lost lunchbox; or reuse fortunate.svg (clover + sun) | Major |
| lab-spelling-2026-11-09.webp, cell 7 (formal) | Boy in a suit of knight's armor sits at an elegant candlelit dinner table | Meaning: armor is not formal clothing; a third grader may learn "formal = armor/knight". Alt "A knight wears formal armor at an elegant dinner" repeats the confusion | Replace with a child in a suit/tuxedo or dress at a formal dinner (formal.webp already shows this well); update alt | Major |
| lab-spelling-2026-11-09.webp, cell 9 (misinform) | Boy points away from a soccer ball; girl looks; speech bubble with red X | Meaning is weak: the X bubble and pointing do not clearly show false information being given | Make the wrong information explicit (e.g. bubble with ball pointing the wrong way while ball is visible elsewhere), or use misinform.webp after it is fixed | Minor |
| lab-spelling-2026-11-09.webp, cell 4 (distract) | Boy writing homework turns toward a handheld game console | Console is drawn with Nintendo Switch red/blue controller trade dress | Use a generic game device | Minor |
| tractor.webp / tractor.png (also atlas cell 0) | Green tractor with yellow wheels on a farm | Green/yellow livery closely resembles a real brand (John Deere) | Optional: use a non-brand color (red/blue) | Minor |
| trustworthy.webp / trustworthy.png | Boy returns a wallet to a happy woman | Shows honesty (returning a lost wallet) rather than the teacher's definition "the ability to keep promises" | Acceptable; ideally show returning a borrowed item as promised (atlas cell 8 does this) | Minor |
| employee.webp / employee.png | Cashier in a green store uniform scanning items for a child | Shows a worker but nothing about "for money" | Acceptable; optionally add pay/coins cue (atlas cell 4 does this) | Minor |
| handed.svg | Basketball with a blue arrow to the right | Does not show anyone handing something; meaning of "handed" is unclear | Draw a hand passing an object to another hand | Minor |
| hunted.svg | Owl on a branch under a night moon | No hunting action shown (no prey, no searching) | Add a searching action (e.g. owl looking down at a mouse, or child searching with a flashlight) | Minor |
| lifting.webp | Boy lifting a box; card label "lifting" | Label is cropped through the letters (bottom of every letter cut); may read as "liftinq" | Re-crop the WebP from the PNG to keep the full label, or crop the label off completely (as for actor/boxer/etc.) | Minor |
| crashing.webp, jumping.webp, opening.webp, rushing.webp, stepping.webp, winking.webp, landing.webp, amazing.webp | Card labels at the bottom edge | Descenders (g/p) of the printed label are cut off at the bottom edge | Re-crop to include the whole label or remove the label | Minor |
| All 27 SVGs | Simple flat drawings | No `<title>`/`<desc>` (alt comes from the page's generic `alt`, which is fine for `<img>`); generic page alt ("Picture for the word X") never describes what is drawn | Optional: give drawings descriptive alt text in data | Minor |
| (data, not image) data/2026-*.json "Distracted" | — | Teacher definition "To prevent something from continuing as usual" fits "disrupt" better; all distracted pictures show a child whose attention is pulled away (correct for the word). Already noted in week file `note` | No picture change; flag to Product Owner | Minor |

## Checked and OK (meaning, text, people)
- Atlas lab-vocab-2026-11-09.webp: all 12 cells match their alt text and definitions (produce, exception/elevator, installment/calendars→couch, peculiar star rock, paid employee, fortunate rain-clearing picnic, ignorant/board game, melancholy, trustworthy/watering can, constellations Big Dipper + bear, irritating mosquito, distracted by barking dog). All people Black. No text in cells.
- Atlas lab-spelling-2026-11-09.webp: cells 0-3, 5, 6, 8, 10, 11 match alt (tractor in mud, pirate extracting chest, magnet + clips, claws retracting (alt says cat; paws only — fine), ice cave formed, child informs teacher, baseball uniforms, tire traction on snow, uninformed child and bus). All people Black.
- 11-02 words: abrupt, bankrupt, bankruptcy, corrupt (referee taking coins; hand is brown), disrupt, disruptions, erupt, eruption, interrupt, rupture — meaning clear, people Black.
- attract, distract, formal, retract, traction webp — fine.
- Spelling cards (10-19, 10-26) and vocab photos not listed above — fine.
- SVG markup: all text spelled correctly; text fits its bubbles (computed from font size/anchor); faces in asked/distracted/employee/ignorant use brown skin (#8d5a3b / #c68642).

## Complete file list (134)

| File | Status |
|---|---|
| abrupt.webp | ok |
| actor.png | ok |
| actor.webp | ok |
| amazing.png | finding |
| amazing.webp | finding |
| asked.svg | ok |
| asking.png | ok |
| asking.webp | ok |
| attract.webp | ok |
| bankrupt.webp | ok |
| bankruptcy.webp | ok |
| bigger.png | ok |
| bigger.webp | ok |
| blasted.svg | ok |
| bolder.png | ok |
| bolder.webp | ok |
| boxer.png | ok |
| boxer.webp | ok |
| buzzed.svg | ok |
| called.svg | ok |
| conductor.png | finding |
| conductor.webp | finding |
| constellations.png | ok |
| constellations.svg | ok |
| constellations.webp | ok |
| corrupt.webp | ok |
| crashed.svg | ok |
| crashing.png | ok |
| crashing.webp | finding |
| dancing.png | ok |
| dancing.webp | ok |
| disrupt.webp | ok |
| disruptions.webp | ok |
| distract.webp | ok |
| distracted.png | ok |
| distracted.svg | ok |
| distracted.webp | ok |
| doctor.png | ok |
| doctor.webp | ok |
| employee.png | finding |
| employee.svg | ok |
| employee.webp | finding |
| erupt.webp | ok |
| eruption.webp | ok |
| exception.png | ok |
| exception.svg | ok |
| exception.webp | ok |
| extract.webp | finding |
| flying.png | ok |
| flying.webp | ok |
| formal.webp | ok |
| formed.webp | finding |
| fortunate.png | finding |
| fortunate.svg | ok |
| fortunate.webp | finding |
| handed.svg | finding |
| heating.png | ok |
| heating.webp | ok |
| helper.png | ok |
| helper.webp | ok |
| hunted.svg | finding |
| ignorant.png | ok |
| ignorant.svg | ok |
| ignorant.webp | ok |
| inform.webp | finding |
| installment.png | ok |
| installment.svg | ok |
| installment.webp | ok |
| interrupt.webp | ok |
| irritating.png | ok |
| irritating.svg | ok |
| irritating.webp | ok |
| jumping.png | ok |
| jumping.webp | finding |
| lab-spelling-2026-11-09.webp | finding |
| lab-vocab-2026-11-09.webp | ok |
| landed.svg | ok |
| landing.png | ok |
| landing.webp | finding |
| lifted.svg | ok |
| lifting.png | ok |
| lifting.webp | finding |
| melancholy.png | ok |
| melancholy.svg | ok |
| melancholy.webp | ok |
| misinform.webp | finding |
| opened.svg | ok |
| opening.png | ok |
| opening.webp | finding |
| peculiar.png | ok |
| peculiar.svg | ok |
| peculiar.webp | ok |
| pitcher.png | ok |
| pitcher.webp | ok |
| produce.png | ok |
| produce.svg | ok |
| produce.webp | ok |
| retract.webp | ok |
| runner.png | ok |
| runner.webp | ok |
| rupture.webp | ok |
| rushed.svg | ok |
| rushing.png | ok |
| rushing.webp | finding |
| screamed.svg | ok |
| shipper.png | ok |
| shipper.webp | ok |
| skipping.png | ok |
| skipping.webp | ok |
| stepped.svg | ok |
| stepping.png | ok |
| stepping.webp | finding |
| swimmer.png | ok |
| swimmer.webp | ok |
| talker.png | ok |
| talker.webp | ok |
| teacher.png | ok |
| teacher.webp | ok |
| thinking.png | ok |
| thinking.webp | ok |
| traction.webp | ok |
| tractor.png | finding |
| tractor.webp | finding |
| trustworthy.png | finding |
| trustworthy.svg | ok |
| trustworthy.webp | finding |
| uniform.webp | finding |
| uninformed.webp | finding |
| walker.png | ok |
| walker.webp | ok |
| washed.svg | ok |
| winked.svg | ok |
| winking.png | ok |
| winking.webp | finding |

Totals: 134 files; 29 finding; 105 ok; 0 not verified (27 SVGs verified from markup only — not rasterized, see Scope).
