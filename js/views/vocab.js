import { html } from '../lib/html.js';
import { pageHead, wordPicture } from './common.js';
import { ACTIVITIES } from '../lib/activities.js';
import { activityMenu, activityView } from './activity.js';

const GROUP_LABEL = { green: 'Quiz word (green)', purple: 'Quiz word (purple)' };

export function vocabView(ctx) {
  if (ctx.run) return activityView(ctx);
  const v = ctx.week.vocab;
  return html`
    ${pageHead('Vocabulary', ctx, `${v.title} · Quiz: ${v.quiz}`)}
    <p class="card note">${v.groupsNote}${v.groupsNote.includes('purple') ? ' Only the words below have been provided; the purple words are not on this list yet.' : ''}</p>

    ${activityMenu(ctx, 'vocab', ACTIVITIES.vocab)}

    <h2 class="words-h">This week's words</h2>

    <ul class="cards vocab">
      ${v.words.map((w) => html`
        <li class="card vocab-card${w.group ? ` group-${w.group}` : ''}">
          ${wordPicture(ctx, w.word, `Picture showing what "${w.word}" means`)}
          <h3 class="vocab-word">${w.word}</h3>
          ${w.group ? html`<p class="badge badge-${w.group}">${GROUP_LABEL[w.group]}</p>` : ''}
          <p class="def">${w.def}</p>
          <p class="example"><span class="tag">In a sentence</span> ${w.sentence}</p>
        </li>`)}
    </ul>

`;
}
