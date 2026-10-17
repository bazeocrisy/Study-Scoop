import { html } from '../lib/html.js';
import { comingSoon, pageHead } from './common.js';

const LEVELS = ['Make 10', 'Make 20', 'Make 50', 'Make 100', 'Make the Next 10', 'Mixed Mental Math'];
const ACTIVITIES = ['Learn', 'Practice', 'Flash cards', 'Timed challenge (optional)', 'Test', 'Practice My Misses'];

export function quickmathView(ctx) {
  return html`
    ${pageHead('Quick Math', ctx, 'Mental math levels that teach how numbers fit together.')}
    <div class="cards">
      ${LEVELS.map((name, i) => comingSoon(`Level ${i + 1}: ${name}`, ACTIVITIES))}
    </div>`;
}
