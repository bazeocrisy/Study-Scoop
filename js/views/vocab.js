import { html } from '../lib/html.js';
import { pictureName } from '../lib/data.js';
import { comingSoon, pageHead } from './common.js';

const GROUP_LABEL = { green: 'Quiz word (green)', purple: 'Quiz word (purple)' };

export function vocabView(ctx) {
  const v = ctx.week.vocab;
  return html`
    ${pageHead('Vocabulary', ctx, `${v.title} · Quiz: ${v.quiz}`)}
    <p class="card note">${v.groupsNote}</p>

    <ul class="cards vocab">
      ${v.words.map((w) => html`
        <li class="card vocab-card${w.group ? ` group-${w.group}` : ''}">
          <span class="pic"><img src="images/words/${pictureName(w.word)}.svg" alt="" width="160" height="110" data-optional></span>
          <h2 class="vocab-word">${w.word}</h2>
          ${w.group ? html`<p class="badge badge-${w.group}">${GROUP_LABEL[w.group]}</p>` : ''}
          <p class="def">${w.def}</p>
          <p class="example"><span class="tag">In a sentence</span> ${w.sentence}</p>
        </li>`)}
    </ul>

    ${comingSoon('Vocabulary practice', [
      'Flash cards',
      'Matching',
      'Multiple choice',
      'Fill in the blank',
      'Vocabulary test',
      'Practice My Misses',
      'Printable study sheet',
    ])}`;
}
