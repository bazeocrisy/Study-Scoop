// Tests: the weekly Test Center (Study Scoop practice tests for Math, Spelling and Vocabulary). DECISIONS D18.
import { html } from '../lib/html.js';
import { testCatalog } from '../lib/activities.js';
import { pageHead } from './common.js';
import { activityView, testCenter } from './activity.js';

export function testsView(ctx) {
  if (ctx.run) return activityView(ctx);
  return html`
    ${pageHead('Tests', ctx, 'Practice tests made by Study Scoop for this week. They are not your teacher\'s tests.')}
    ${ctx.testsProblem ? html`<p class="notice" role="note">The math and vocabulary practice tests for this week could not be loaded. Please try again later.</p>` : ''}
    ${testCenter(ctx, testCatalog(ctx.week, ctx.tests, ctx.mathWords))}
    <div class="card note">
      <h2>How the practice tests work</h2>
      <ul class="plain-list">
        <li>One question at a time. You can go back and change answers.</li>
        <li>No hints and no answers until you finish.</li>
        <li>At the end you see your score and the questions to look at again.</li>
        <li>Nothing is saved. Refreshing the page starts the test again.</li>
      </ul>
    </div>`;
}
