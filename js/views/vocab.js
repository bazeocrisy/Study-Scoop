// Vocabulary opens on its menu (Learn My Words, Multiple Choice, True or False, Fill in the Blank, Practice My Misses).
// Learn My Words shows one study card at a time (DECISIONS D19); the teacher's definitions are used exactly.
import { html } from '../lib/html.js';
import { menuItems } from '../lib/activities.js';
import { menuPage, testsNote } from './common.js';
import { activityView } from './activity.js';

export function vocabView(ctx) {
  if (ctx.run) return activityView(ctx);
  const v = ctx.week.vocab;
  return menuPage(ctx, 'vocab', {
    title: 'Vocabulary', context: `${v.title} · ${v.words.length} words · Quiz: ${v.quiz}`,
    items: menuItems('vocab'), misses: ctx.misses?.vocab,
    after: html`<p class="hint menu-foot">${v.groupsNote}${v.groupsNote.includes('purple') ? ` Only the ${v.words.length} words here have been provided; the purple words are not on this list yet.` : ''}</p>
      ${testsNote(ctx, 'The weekly Vocabulary Test')}`,
  });
}
