import { html } from '../lib/html.js';
import { pictureName } from '../lib/data.js';
import { comingSoon, pageHead, wordPicture } from './common.js';

export function spellingView(ctx) {
  const sp = ctx.week.spelling;
  const groups = Object.keys(sp.rules).map((id) => ({
    id, label: sp.rules[id], help: sp.ruleHelp[id], words: sp.words.filter((w) => w.rule === id),
  })).filter((g) => g.words.length);
  // Study cards: the owner-approved picture cards (each shows the written word, so they are for studying only,
  // never for a spelling test; DECISIONS D13).
  const photos = new Set(ctx.pictures?.photos || []);
  const cards = sp.words.filter((w) => photos.has(pictureName(w.word)));

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

    ${cards.length ? html`
      <section aria-labelledby="h-study">
        <h2 id="h-study">Study cards</h2>
        <p class="intro">Look at each picture, say the word, then read the sentence.</p>
        <ul class="cards study-cards">
          ${cards.map((w) => html`
            <li class="card study-card">
              ${wordPicture(ctx, w.word, `Study card for the word "${w.word}"`)}
              <h3>${w.word}</h3>
              ${w.sentence ? html`<p class="sentence">${w.sentence}</p>` : ''}
            </li>`)}
        </ul>
      </section>` : ''}

    ${comingSoon('Spelling practice', [
      'Hear each word and type it',
      'Flash cards',
      'Practice test and spelling test',
      'Practice My Misses',
      'Printable study sheet',
    ])}`;
}
