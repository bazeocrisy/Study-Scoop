import { html } from '../lib/html.js';
import { comingSoon, pageHead } from './common.js';

const ACTIVITIES = ['Learn', 'Practice', 'Study Guide', 'Test'];

export function mathView(ctx) {
  const m = ctx.week.math;
  return html`
    ${pageHead('Math', ctx)}

    <section aria-labelledby="h-math-words">
      <h2 id="h-math-words">${m ? m.title : "This week's math words"}</h2>
      ${m ? html`
        <p class="intro">Test: ${m.test}</p>
        <ul class="cards math-words">
          ${m.words.map((w) => html`
            <li class="card">
              <h3>${w.word}</h3>
              <p class="def">${w.def}</p>
              <p class="example"><span class="tag">Example</span> <span class="fact">${w.example[0]} × ${w.example[1]} = ${w.example[2]}</span></p>
            </li>`)}
        </ul>` : html`<p class="card">No math words are listed for this week.</p>`}
    </section>

    <h2 class="group-title">Math Chapters</h2>
    <div class="cards">
      ${comingSoon('Lesson 5-1: Understand the Distributive Property', ACTIVITIES, { level: 3 })}
      ${comingSoon('Lesson 5-2: Use Properties to Multiply by 3', ACTIVITIES, { level: 3 })}
    </div>

    <h2 class="group-title">Multiplication</h2>
    <div class="cards">
      ${comingSoon('Multiplication Mastery', [
        'Tables 0 to 12, written the up-and-down way',
        'Flash cards and practice questions',
        'Optional timers',
        'Multiplication tests',
        'Practice My Misses',
        'Factor families',
      ], { level: 3 })}
      ${comingSoon('Find My Factors', [
        'My Table: factor pairs from the table you pick',
        'All Factor Pairs: every pair of whole numbers that makes the product',
      ], { level: 3 })}
    </div>`;
}
