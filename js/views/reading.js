// Reading: a library of original stories and fact passages (DECISIONS D27). Each opens the Reading Coach, which
// reads to him, lets him tap any word, and times his own reading. Nothing is stored or sent anywhere.
import { html } from '../lib/html.js';
import { todaysPicks } from '../lib/reading.js';
import { ICONS, crumbs, subBar } from './common.js';

const KIND = { story: 'Story', fact: 'Fact' };
const metaLine = (e) => `${e.words} words · ${e.lexile ? `${e.lexile}L · ` : ''}${KIND[e.kind]} · ${e.topic}`;

function storyCard(ctx, e, { start = false } = {}) {
  return html`<li><a class="menu-card rd-card" href="${ctx.actLink('reading', e.id)}">
    <span class="mc-icon">${ICONS.book}</span>
    <span class="mc-text">${start ? html`<span class="start-here">Start here</span>` : ''}<span class="mc-title">${e.title}</span>
      <span class="mc-about"><span class="rd-meta">${metaLine(e)}</span></span></span>
    <span class="mc-go" aria-hidden="true">›</span>
  </a></li>`;
}

/** The library: two picks for today, then every story grouped by step (shortest first). */
function libraryView(ctx) {
  const { index } = ctx.reading;
  const picks = todaysPicks(index.stories.filter((s) => s.step <= 3), ctx.today);
  return html`
    <div class="page-head section-head menu-head subject-reading">
      ${crumbs(ctx, [{ label: 'Reading Practice' }])}
      <h1 tabindex="-1">Reading Practice</h1>

      <p class="intro">Extra passages for reading and understanding. Listen, tap an unfamiliar word, read it yourself, then use the Story Guide and questions to explain what it means.</p>
    </div>
    <section class="menu subject-reading" aria-labelledby="h-today">
      <h2 id="h-today" class="ask">Today's reading</h2>
      <ul class="menu-grid count-${picks.length}">${picks.map((e) => storyCard(ctx, e))}</ul>
      <p class="hint menu-foot">Pick one. A story is "just right" when you read at least 95 words out of every 100 correctly.</p>
    </section>
    ${index.steps.map((st) => {
      const list = index.stories.filter((s) => s.step === st.n);
      return list.length ? html`
        <section class="menu subject-reading" aria-labelledby="h-step-${st.n}">
          <h2 id="h-step-${st.n}" class="ask">${st.label}</h2>
          <p class="hint">${st.about}</p>
          <ul class="menu-grid count-${list.length}">${list.map((e, k) => storyCard(ctx, e, { start: st.n === 1 && k === 0 }))}</ul>
        </section>` : '';
    })}
    <section class="card rd-tips" aria-labelledby="h-tips">
      <h2 id="h-tips">Tips for grown-ups</h2>
      <ul>
        <li>Read for about 20 minutes a day at the same time each day.</li>
        <li>Have your reader finish the Story Guide and the questions. Understanding matters as much as speed.</li>
        <li>On "Your turn", you tap the words that were missed. The page works out words read right per minute.</li>
        <li>Nothing is saved when the page closes. Write the numbers on paper if you want to keep them.</li>
      </ul>
    </section>`;
}

/** One story: the title bar and the place the Reading Coach (js/reading-player.js) fills in. */
function storyView(ctx) {
  const { story, entry } = ctx.reading;
  return html`
    ${subBar(ctx, {
      tone: 'reading', title: story.title, eyebrow: `${ctx.reading.index.steps[story.step - 1].label} · ${KIND[story.kind]}`,
      goal: metaLine(entry),
      trail: [{ label: 'Reading', href: ctx.link('reading') }, { label: story.title }],
      back: [{ label: 'All stories', href: ctx.link('reading') }],
    })}
    <section class="rd" id="rd" aria-label="Reading Coach" data-story="${story.id}">
      <p class="loading">Getting your story ready…</p>
      <noscript><p class="card">The Reading Coach needs JavaScript turned on.</p></noscript>
    </section>`;
}

export function readingView(ctx) {
  return ctx.reading.story ? storyView(ctx) : libraryView(ctx);
}
