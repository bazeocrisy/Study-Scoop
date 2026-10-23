// Spelling opens on its menu (Learn My Words, Flashcards, Missing Letters, Listen & Spell, Practice My Misses).
// Learn My Words is the week's pattern, the words grouped by rule, and the picture study cards (DECISIONS D19).
import { html } from '../lib/html.js';
import { pictureName } from '../lib/data.js';
import { menuItems } from '../lib/activities.js';
import { menuPage, subBar, testsNote, wordPicture } from './common.js';
import { activityView } from './activity.js';

export function spellingView(ctx) {
  if (ctx.run) return activityView(ctx);
  if (ctx.page === 'learn') return learnWords(ctx);
  const sp = ctx.week.spelling;
  return menuPage(ctx, 'spelling', {
    title: 'Spelling', context: `This week's pattern: ${sp.pattern} words (${sp.words.length} words)`,
    items: menuItems('spelling'), misses: ctx.misses?.spelling, after: testsNote(ctx, 'The weekly Spelling Test'),
  });
}

function learnWords(ctx) {
  const sp = ctx.week.spelling;
  const groups = Object.keys(sp.rules).map((id) => ({
    id, label: sp.rules[id], help: sp.ruleHelp[id], words: sp.words.filter((w) => w.rule === id),
  })).filter((g) => g.words.length);
  // Study cards: the owner-approved picture cards (each shows the written word, so they are for studying only,
  // never for a spelling test; DECISIONS D13).
  const availablePictures = new Set([...(ctx.pictures?.photos || []), ...(ctx.pictures?.drawings || [])]);
  const cards = sp.words.filter((w) => availablePictures.has(pictureName(w.word)));
  return html`
    ${subBar(ctx, {
      tone: 'spelling', title: 'Learn My Words', goal: `This week's pattern: ${sp.pattern} (${sp.words.length} words)`,
      trail: [{ label: 'Spelling', href: ctx.link('spelling') }, { label: 'Learn My Words' }],
      back: [{ href: ctx.link('spelling'), label: '‹ Back to Spelling' }],
    })}
    <section aria-labelledby="h-rules">
      <h2 id="h-rules">The spelling rules</h2>
      <div class="cards rules">
        ${groups.map((g) => html`
          <section class="card rule" aria-labelledby="rule-${g.id}">
            <h3 id="rule-${g.id}">${g.label}</h3>
            ${g.help ? html`<p class="rule-help">${g.help}</p>` : ''}
            <ul class="words">
              ${g.words.map((w) => html`<li><span class="word">${w.word}</span> <span class="base">from ${w.base}</span></li>`)}
            </ul>
          </section>`)}
      </div>
    </section>

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

    <div class="stage-nav">
      <a class="btn" href="${ctx.link('spelling')}">‹ Back to Spelling</a>
      <a class="btn btn-primary" href="${ctx.actLink('spelling', 'flash')}">Next: Flashcards ›</a>
    </div>`;
}
