import { html } from '../lib/html.js';
import { comingSoon, pageHead } from './common.js';

export function spellingView(ctx) {
  const sp = ctx.week.spelling;
  const groups = Object.keys(sp.rules).map((id) => ({
    id, label: sp.rules[id], help: sp.ruleHelp[id], words: sp.words.filter((w) => w.rule === id),
  })).filter((g) => g.words.length);

  return html`
    ${pageHead('Spelling', ctx, `This week's pattern: ${sp.pattern} (${sp.words.length} words)`)}

    <div class="cards rules">
      ${groups.map((g) => html`
        <section class="card rule" aria-labelledby="rule-${g.id}">
          <h2 id="rule-${g.id}">${g.label}</h2>
          ${g.help ? html`<p class="rule-help">${g.help}</p>` : ''}
          <ul class="words">
            ${g.words.map((w) => html`<li><span class="word">${w.word}</span> <span class="base">from ${w.base}</span></li>`)}
          </ul>
        </section>`)}
    </div>

    ${comingSoon('Spelling practice', [
      'Hear each word and type it',
      'Flash cards',
      'Practice test and spelling test',
      'Practice My Misses',
      'Printable study sheet',
    ])}`;
}
