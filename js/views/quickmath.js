import { html } from '../lib/html.js';
import { pageHead } from './common.js';

const LEVELS = ['Make 10', 'Make 20', 'Make 50', 'Make 100', 'Make the Next 10', 'Mixed Mental Math'];

// Quick Math is not built yet: one clear "Coming soon" card, with no buttons or form fields (D10).
export function quickmathView(ctx) {
  return html`
    ${pageHead('Quick Math', ctx, 'Mental math levels that teach how numbers fit together.')}
    <section class="soon" aria-labelledby="h-qm-soon">
      <div class="soon-head"><h2 id="h-qm-soon">Six levels are coming</h2><span class="soon-badge">Coming soon</span></div>
      <ol class="soon-list">${LEVELS.map((name, i) => html`<li>Level ${i + 1}: ${name}</li>`)}</ol>
      <p>Each level will have Learn, Practice, Flash cards, a Test and Practice My Misses. Timers will always be optional.</p>
    </section>`;
}
