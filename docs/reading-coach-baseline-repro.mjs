// Reproduces the 7 reported Reading Coach issues on the UNMODIFIED baseline (main f24b12f).
// Run it only against that baseline, e.g.: git worktree add /tmp/baseline f24b12f && cp docs/reading-coach-baseline-repro.mjs /tmp/baseline/docs/ && (cd /tmp/baseline/docs && node reading-coach-baseline-repro.mjs)
// It relies on the baseline's page markup and scoring API, so on this branch it reports different things by design.
import { ROOT, BASE, startBrowser, startServer } from '../tests/lib/harness.js';
import { scoreReading, suggestion, tokenize, storyTokens } from '../js/lib/reading.js';
import fs from 'node:fs';

const results = [];
const report = (n, title, reproduced, detail) => { results.push({ n, title, reproduced }); console.log(`#${n} ${title}\n   reproduced: ${reproduced ? 'YES' : 'NO'}\n   ${detail}`); };

// ---- #3 (pure code): incomplete reading recommends advancing
{
  const r = scoreReading({ total: 100, stoppedAt: 10, errors: 0, seconds: 4 });
  const s = suggestion([r]);
  report(3, 'Incomplete reading can recommend advancing', r.wrr === 150 && r.finished === false && /next step|harder/i.test(s),
    `scoreReading -> wrr=${r.wrr}, finished=${r.finished}; suggestion -> "${s}"`);
}

// ---- #6 (data): evidence references that do not support their answers
{
  const idx = JSON.parse(fs.readFileSync(ROOT + '/data/reading/index.json', 'utf8'));
  const weak = [];
  const words = (t) => String(t).toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter((w) => w.length >= 4);
  for (const e of idx.stories) {
    const s = JSON.parse(fs.readFileSync(`${ROOT}/data/reading/${e.id}.json`, 'utf8'));
    const ev = (i) => s.sentences[i].toLowerCase();
    const check = (label, answerText, find) => {
      const hits = words(answerText).filter((w) => ev(find).includes(w.replace(/s$/, '')));
      if (!hits.length) weak.push(`${e.id} ${label} -> evidence sentence ${find}: "${s.sentences[find].slice(0, 60)}" shares no key word with answer "${String(answerText).slice(0, 50)}"`);
    };
    s.questions.forEach((q, i) => {
      const f = q.format || 'choice';
      const ans = f === 'choice' ? q.choices[q.answer] : f === 'blank' ? q.blank : f === 'tf' ? q.ask : q.answer;
      check(`q${i}(${f})`, ans, q.find);
    });
    for (const [k, m] of Object.entries(s.elements)) {
      const f = m.format || 'choice';
      const ans = k === 'events' ? m.order.join(' ') : f === 'blank' ? m.blank : m.answer;
      check(`map:${k}(${f})`, ans, m.find);
    }
  }
  report(6, 'Some evidence references do not support their answers', weak.length > 0, `${weak.length} weak references, e.g.:\n     - ${weak.slice(0, 6).join('\n     - ')}`);
}

// ---- Browser repros: a fake voice whose sentences never finish by themselves
const server = await startServer();
const b = await startBrowser();
const base = server.origin + BASE;
await b.initScript(`
  window.__cancels = 0; window.__spoken = [];
  class U { constructor(t) { this.text = t; } }
  window.SpeechSynthesisUtterance = U;
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => [{ lang: 'en-US', localService: true }],
    cancel() { window.__cancels++; }, speak(u) { window.__spoken.push(u.text); window.__last = u; },
  } });`);
const app = (expr) => b.js(expr);
const click = async (sel) => { await b.clickAt(sel); await b.wait(120); };
const text = () => b.js('return document.querySelector("#rd .rd-stage")?.innerText || "";');
try {
  // ---- #1 typed answers disappear when switching steps
  await b.load(base + '#reading?act=missingbook');
  await click('[data-act="go"][data-step="quiz"]');
  await app(`const i = document.querySelector('.rd-blank'); i.focus(); i.value = 'desk'; i.dispatchEvent(new Event('input', { bubbles: true }));`);
  const before = await app(`return document.querySelector('.rd-blank').value;`);
  await click('[data-act="go"][data-step="guide"]');
  await click('[data-act="go"][data-step="quiz"]');
  const after = await app(`return document.querySelector('.rd-blank').value;`);
  report(1, 'Unchecked typed answers disappear when switching steps', before === 'desk' && after === '', `typed "${before}", after leaving and returning the box holds "${after}"`);

  // ---- #2 timed reading includes time spent on another step
  await b.load(base + '#reading?act=missingbook');
  await click('[data-act="go"][data-step="turn"]');
  await click('[data-act="turn-start"]');
  await click('[data-act="go"][data-step="guide"]');
  await b.wait(3200);                                         // reader is NOT on the reading step for 3.2 s
  await click('[data-act="go"][data-step="turn"]');
  const shown = await app(`return document.getElementById('rd-timer')?.textContent || '(no timer)';`);
  const running = await app(`return !!document.querySelector('[data-act="turn-done"]');`);
  report(2, 'Timed reading includes time spent on another step', running && /^0:0[3-9]/.test(shown),
    `timer started, reader left for ~3.2 s, came back: timer still running and shows "${shown}" (should not count time away)`);

  // ---- #4 self-marking "I got it" counts as right on the first try
  await b.load(base + '#reading?act=missingbook');
  await click('[data-act="go"][data-step="quiz"]');
  await click('[data-act="say-show"]');
  await click('[data-act="say-grade"][data-ok="1"]');
  await click('[data-act="go"][data-step="done"]');
  const done = await text();
  report(4, 'Self-marking counts as "right on the first try"', /Questions: 1 of 5 right on the first try/.test(done),
    `after only tapping "I got it" on a say-it question: "${(done.match(/Questions:[^\n]*/) || [''])[0]}"`);

  // ---- #5 results suggest retrying but there is no retry flow
  const hasRetryText = /try the questions once more/i.test(done);
  const retryControls = await app(`return [...document.querySelectorAll('#rd-stage [data-act]')].map(b => b.dataset.act + ':' + b.textContent.trim());`);
  await click('[data-act="go"][data-step="turn"]');
  await click('[data-act="turn-start"]'); await b.wait(300); await click('[data-act="turn-done"]'); await click('[data-act="turn-save"]');
  const saved = await app(`return document.querySelectorAll('.rd-chart li').length;`);
  await click('[data-act="go"][data-step="done"]');
  await click('[data-act="restart"]');
  await click('[data-act="go"][data-step="turn"]');
  const afterRestart = await app(`return document.querySelectorAll('.rd-chart li').length;`);
  report(5, 'Results suggest retrying questions, but there is no retry flow', hasRetryText && !retryControls.some((c) => /retry|again/i.test(c) && !/restart/.test(c)) && saved === 1 && afterRestart === 0,
    `text suggests retrying: ${hasRetryText}; controls on the page: ${JSON.stringify(retryControls)}; the only way to "try again" is "Read this one again" (restart), which also erased the saved timed reading (${saved} reading before, ${afterRestart} after)`);

  // ---- #7 tapping a word during read-along cancels playback without resetting the display
  await b.load(base + '#reading?act=missingbook');
  await click('[data-act="go"][data-step="along"]');
  await click('[data-act="play-along"]');
  await app(`window.__last.onboundary && window.__last.onboundary({ name: 'word', charIndex: 0 });`);
  const labelBefore = await app(`return document.querySelector('[data-act="play-along"]').textContent.trim();`);
  const cancelsBefore = await app('return window.__cancels;');
  await click('.rd-w[data-n="5"]');
  const labelAfter = await app(`return document.querySelector('[data-act="play-along"]').textContent.trim();`);
  const stillLit = await app(`return document.querySelectorAll('.rd-w.now, .rd-sent.now').length;`);
  const cancelsAfter = await app('return window.__cancels;');
  report(7, 'Tapping a word during read-along cancels playback without resetting its display', cancelsAfter > cancelsBefore && labelAfter === 'Stop' && stillLit > 0,
    `button before tap: "${labelBefore}"; speech cancelled by the tap: ${cancelsAfter > cancelsBefore}; button after tap: "${labelAfter}"; highlighted words/sentence still lit: ${stillLit}`);
} finally {
  b.close(); server.close();
}
console.log(`\nSummary: ${results.filter((r) => r.reproduced).length} of 7 reproduced (${results.map((r) => '#' + r.n + (r.reproduced ? ' yes' : ' NO')).join(', ')})`);
