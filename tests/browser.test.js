// Browser tests: headless Chrome against the site served under /Study-Scoop/ (like GitHub Pages).
// Run: npm run test:browser   (SCREENSHOTS=1 also writes docs/screenshots/assignment-002/*.png)
//      npm run test:site      (builds _site, then runs every check against the published files only)
import fs from 'node:fs';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/weeks.json');
const SECTIONS = [['week', 'This Week'], ['spelling', 'Spelling'], ['vocab', 'Vocabulary'], ['math', 'Math'],
  ['quickmath', 'Quick Math'], ['homework', 'Homework'], ['newsletter', 'Newsletter']];
const VIEWPORTS = [[360, 740], [768, 1024], [1366, 768], [1920, 1080]];
// `--site <folder>` serves a built site (scripts/build-site.js) instead of the repository, exactly as GitHub Pages would.
const siteArg = process.argv.indexOf('--site');
const SITE = siteArg > 0 ? path.resolve(process.argv[siteArg + 1] || '_site') : null;
if (SITE && !fs.existsSync(path.join(SITE, 'index.html'))) throw new Error(`No built site in ${SITE}. Run: node scripts/build-site.js`);
const SHOTS = process.env.SCREENSHOTS && !SITE ? path.join(ROOT, 'docs/screenshots/assignment-002') : null;
// "Today" is frozen at Friday, October 16, 2026 (noon, local time) so countdowns are deterministic.
const FREEZE_DATE = `(() => { const R = Date; const t = new R(2026, 9, 16, 12, 0, 0).getTime();
  class D extends R { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } }
  globalThis.Date = D; })();`;

let passed = 0;
const failed = [];
async function check(name, fn) {
  try { await fn(); passed++; console.log(`  ok   ${name}`); } catch (e) { failed.push(name); console.log(`  FAIL ${name}\n       ${e.message}`); }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`);
}

// Page-side helpers, injected once per page load.
const PAGE_HELPERS = `
  window.__t = {
    parse(c) { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return null;
      const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; },
    lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); },
    blend(top, under) { const a = top.a; return { r: top.r * a + under.r * (1 - a), g: top.g * a + under.g * (1 - a), b: top.b * a + under.b * (1 - a), a: 1 }; },
    bgOf(el) { const layers = [];
      for (let e = el; e; e = e.parentElement) { const c = this.parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
      let base = { r: 255, g: 255, b: 255, a: 1 };
      if (layers.length && layers[layers.length - 1].a >= 1) base = layers.pop();
      for (let i = layers.length - 1; i >= 0; i--) base = this.blend(layers[i], base);
      return base; },
    contrast(el) { const s = getComputedStyle(el); const bg = this.bgOf(el); const fg = this.blend(this.parse(s.color), bg);
      const [hi, lo] = [this.lum(fg), this.lum(bg)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); },
    textElements() { return [...document.querySelectorAll('body *')].filter((el) => {
      if (el.closest('svg, .drips, .skip, noscript')) return false;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }); },
    contrastFailures() { return this.textElements().map((el) => { const s = getComputedStyle(el);
      const size = parseFloat(s.fontSize); const bold = Number(s.fontWeight) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5; const ratio = this.contrast(el);
      return ratio + 0.01 < need ? el.tagName + '.' + el.className + ' "' + el.textContent.trim().slice(0, 30) + '" ' + ratio.toFixed(2) + ' < ' + need : null; }).filter(Boolean); },
  };`;

async function helpers(b) { await b.js(PAGE_HELPERS); }

async function main() {
  if (SITE) console.log(`Serving the built site: ${SITE}`);
  const server = await startServer({ root: SITE || ROOT });
  const b = await startBrowser();
  const url = (h = '') => `${server.origin}${BASE}${h}`;
  try {
    await b.initScript(FREEZE_DATE);
    await b.viewport(1366, 900, false);

    console.log('Routing and sections');
    await check('home page opens on This Week with no errors', async () => {
      await b.load(url());
      eq(await b.js('return document.querySelector("#app h1").textContent;'), 'This Week', 'h1');
      eq(await b.js('return location.hash;'), '', 'hash untouched on first load');
      eq(b.errors, [], 'console errors');
    });
    await check('navigation lists the seven sections in order', async () => {
      const labels = await b.js('return [...document.querySelectorAll("nav.tabs a")].map((a) => a.textContent.trim());');
      eq(labels, SECTIONS.map((s) => s[1]), 'nav labels');
      eq(await b.js('return document.querySelector("nav.tabs").getAttribute("aria-label");'), 'Sections', 'nav label');
    });
    await check('This Week counts down to each test from Friday, Oct 16', async () => {
      const cards = await b.js('return [...document.querySelectorAll(".test")].map((c) => c.querySelector(".count").textContent + " | " + c.querySelector("h3").textContent + " | " + c.querySelector(".date").textContent);');
      eq(cards, ['In 5 days | Math Test | Wednesday, October 21', 'In 7 days | Vocabulary Quiz | Friday, October 23',
        'In 7 days | Spelling Test | Friday, October 23'], 'test cards');
      eq(await b.js('return [...document.querySelectorAll(".test .action")].map((a) => a.getAttribute("href"));'),
        ['#math', '#vocab', '#spelling'], 'study links');
    });
    for (const [id, label] of SECTIONS) {
      await check(`#${id} shows ${label} with the right tab marked`, async () => {
        await b.hash(`#${id}`);
        eq(await b.js('return document.querySelector("#app h1").textContent;'), label, 'h1');
        eq(await b.js('return [...document.querySelectorAll("nav.tabs a[aria-current=page]")].map((a) => a.dataset.tab);'), [id], 'aria-current');
        eq(await b.js('return document.title;'), `${label} · Study Scoop`, 'title');
      });
    }
    await check('deep link to an earlier week opens that week', async () => {
      await b.load(url('#spelling?week=2026-10-12'));
      eq(await b.js('return document.querySelector(".intro").textContent;'), "This week's pattern: -ed (15 words)", 'pattern');
      eq(await b.js('return document.getElementById("weekSelect").value;'), '2026-10-12', 'picker');
      expect(await b.js('return !!document.querySelector(".notice");'), 'earlier-week notice shown');
      eq(await b.js('return document.querySelector("nav.tabs a[data-tab=vocab]").getAttribute("href");'), '#vocab?week=2026-10-12', 'nav keeps week');
    });
    await check('unknown section or week falls back safely and fixes the address', async () => {
      await b.load(url('#nope'));
      eq(await b.js('return [document.querySelector("#app h1").textContent, location.hash];'), ['This Week', '#week'], 'unknown section');
      await b.load(url('#math?week=2030-01-01'));
      eq(await b.js('return [document.querySelector("#app h1").textContent, location.hash, document.getElementById("weekSelect").value];'),
        ['Math', '#math', INDEX.current], 'unknown week');
    });
    await check('week picker switches the section to the chosen week and back', async () => {
      await b.load(url('#vocab'));
      let before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-12"; s.dispatchEvent(new Event("change"));');
      await b.ready(before);
      eq(await b.js('return location.hash;'), '#vocab?week=2026-10-12', 'hash');
      eq(await b.js('return [...document.querySelectorAll(".vocab-card.group-green .vocab-word")].map((e) => e.textContent);'),
        ['Produce', 'Exception', 'Installment', 'Peculiar'], 'Oct 12 green words');
      eq(await b.js('return document.getElementById("weekLabel").textContent;'), '3rd grade · Oct 12–16', 'header label');
      before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-19"; s.dispatchEvent(new Event("change"));');
      await b.ready(before);
      eq(await b.js('return location.hash;'), '#vocab', 'hash back to this week');
      eq(await b.js('return [...document.querySelectorAll(".vocab-card.group-green .vocab-word")].map((e) => e.textContent);'),
        ['Employee', 'Fortunate', 'Ignorant', 'Melancholy'], 'Oct 19 green words');
    });
    await check('the Back button returns to the previous section', async () => {
      await b.load(url('#week'));
      await b.hash('#spelling');
      const before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('history.back();');
      await b.ready(before);
      eq(await b.js('return document.querySelector("#app h1").textContent;'), 'This Week', 'after back');
    });

    console.log('Content accuracy');
    for (const { id } of INDEX.weeks) {
      const week = readJSON(`data/${id}.json`);
      await check(`${id}: every vocabulary definition on screen matches the data exactly`, async () => {
        await b.load(url(id === INDEX.current ? '#vocab' : `#vocab?week=${id}`));
        eq(await b.js('return [...document.querySelectorAll(".vocab-card .def")].map((e) => e.textContent);'),
          week.vocab.words.map((w) => w.def), 'definitions');
        eq(await b.js('return [...document.querySelectorAll(".vocab-card .vocab-word")].map((e) => e.textContent);'),
          week.vocab.words.map((w) => w.word), 'words');
      });
      await check(`${id}: every spelling word is shown once`, async () => {
        await b.hash(id === INDEX.current ? '#spelling' : `#spelling?week=${id}`);
        const shown = await b.js('return [...document.querySelectorAll(".words .word")].map((e) => e.textContent).sort();');
        eq(shown, week.spelling.words.map((w) => w.word).sort(), 'spelling words');
      });
      if (week.math) {
        await check(`${id}: math words and examples match the data`, async () => {
          await b.hash(id === INDEX.current ? '#math' : `#math?week=${id}`);
          eq(await b.js('return [...document.querySelectorAll(".math-words .def")].map((e) => e.textContent);'), week.math.words.map((w) => w.def), 'defs');
          eq(await b.js('return [...document.querySelectorAll(".math-words .fact")].map((e) => e.textContent);'),
            week.math.words.map((w) => `${w.example[0]} × ${w.example[1]} = ${w.example[2]}`), 'examples');
        });
      }
    }
    await check('all 12 word pictures load for the current week, even on a phone (for printing)', async () => {
      await b.viewport(360, 740);
      await b.load(url('#vocab'));
      await b.wait(300);
      eq(await b.js('return [...document.querySelectorAll(".vocab-card img")].filter((i) => i.complete && i.naturalWidth > 0).length;'), 12, 'loaded pictures');
      await b.viewport(1366, 900, false);
    });

    console.log('Keyboard and accessibility');
    await check('Tab order: skip link, logo, week picker, then the seven sections', async () => {
      await b.load(url('#week'));
      // fresh load: focus starts at the top of the page
      const order = [];
      for (let i = 0; i < 10; i++) {
        await b.key('Tab');
        order.push(await b.js('const e = document.activeElement; return e.id || e.dataset.tab || e.className || e.tagName;'));
      }
      eq(order, ['skip', 'brand', 'weekSelect', ...SECTIONS.map((s) => s[0])], 'focus order');
    });
    await check('keyboard focus is clearly visible', async () => {
      const o = await b.js('const s = getComputedStyle(document.activeElement); return [s.outlineStyle, parseFloat(s.outlineWidth)];');
      expect(o[0] !== 'none' && o[1] >= 2, `outline ${o}`);
    });
    await check('Enter on a section link opens it and moves focus to the content', async () => {
      await b.js('document.querySelector("nav.tabs a[data-tab=spelling]").focus();');
      const before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.key('Enter');
      await b.ready(before);
      eq(await b.js('return [document.querySelector("#app h1").textContent, document.activeElement.id];'), ['Spelling', 'app'], 'after Enter');
    });
    await check('skip link moves focus to the content without changing the section', async () => {
      await b.js('document.querySelector(".skip").focus();');
      eq(await b.js('const r = document.querySelector(".skip").getBoundingClientRect(); return r.top >= 0;'), true, 'visible when focused');
      await b.key('Enter');
      await b.wait(100);
      eq(await b.js('return [document.activeElement.id, location.hash];'), ['app', '#spelling'], 'after skip');
    });
    await check('homework checkboxes work with the keyboard and are not saved', async () => {
      await b.load(url('#homework'));
      await b.js('document.getElementById("hw-0").focus();');
      await b.key(' ');
      eq(await b.js('return document.getElementById("hw-0").checked;'), true, 'checked with Space');
      await b.hash('#week');
      await b.hash('#homework');
      eq(await b.js('return document.getElementById("hw-0").checked;'), false, 'cleared after leaving the page');
    });
    for (const [id] of SECTIONS) {
      await check(`#${id}: headings, labels, alt text and touch targets`, async () => {
        await b.load(url(`#${id}`));
        const r = await b.js(`
          const levels = [...document.querySelectorAll('#app h1, #app h2, #app h3, #app h4')].map((h) => Number(h.tagName[1]));
          const skips = levels.filter((l, i) => i && l > levels[i - 1] + 1).length;
          const unlabelled = [...document.querySelectorAll('input, select, textarea')].filter((el) =>
            !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map((el) => el.id || el.tagName);
          const noAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
          const emptyLinks = [...document.querySelectorAll('a')].filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label')).length;
          const small = [...document.querySelectorAll('nav.tabs a, #weekSelect, .brand, .action, .archive a, .checklist label')]
            .map((el) => [el, el.getBoundingClientRect()]).filter(([, rect]) => rect.width < 44 || rect.height < 44)
            .map(([el, rect]) => (el.id || el.textContent.trim().slice(0, 20)) + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height));
          return { h1: levels.filter((l) => l === 1).length, skips, unlabelled, noAlt, emptyLinks, small, lang: document.documentElement.lang };`);
        eq(r, { h1: 1, skips: 0, unlabelled: [], noAlt: 0, emptyLinks: 0, small: [], lang: 'en' }, 'structure');
      });
    }
    // The light theme is used on every device (DECISIONS D12); the dark palette is an opt-in (<html data-theme="dark">).
    const DARK = 'document.documentElement.dataset.theme = "dark";';
    for (const [name, scheme, optIn] of [['the light theme', 'light', false], ['the dark palette (opt-in)', 'light', true]]) {
      await check(`text contrast meets WCAG AA in ${name} on every section`, async () => {
        await b.media('', [{ name: 'prefers-color-scheme', value: scheme }]);
        const problems = [];
        for (const h of [...SECTIONS.map(([id]) => `#${id}`), '#vocab?week=2026-10-12']) {
          await b.load(url(h));
          if (optIn) await b.js(DARK);
          await helpers(b);
          for (const p of await b.js('return __t.contrastFailures();')) problems.push(`${h} ${p}`);
        }
        eq(problems, [], 'contrast');
      });
    }
    await check('a device set to dark mode still gets the light theme', async () => {
      await b.media('', [{ name: 'prefers-color-scheme', value: 'dark' }]);
      await b.load(url('#week'));
      eq(await b.js('return [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.querySelector(".card")).backgroundColor];'),
        ['rgb(255, 248, 236)', 'rgb(255, 255, 255)'], 'page and card colours');
    });
    await b.media('', [{ name: 'prefers-color-scheme', value: 'light' }]);

    console.log('Responsive layout');
    for (const [w, h] of VIEWPORTS) {
      await check(`${w}×${h}: no sideways scrolling and all seven sections visible`, async () => {
        await b.viewport(w, h);
        const problems = [];
        for (const [id] of SECTIONS) {
          await b.load(url(`#${id}`));
          const r = await b.js(`return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
            nav: [...document.querySelectorAll('nav.tabs a')].filter((a) => { const r = a.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).length };`);
          if (r.sw > r.cw) problems.push(`#${id} page is ${r.sw}px wide in a ${r.cw}px window`);
          if (r.nav) problems.push(`#${id} ${r.nav} section links off screen`);
        }
        eq(problems, [], 'layout');
      });
    }
    await b.viewport(1366, 900, false);

    console.log('Print');
    await check('print view hides navigation and uses outlines instead of colour fills', async () => {
      await b.load(url('#vocab'));
      await b.media('print');
      await helpers(b);
      const r = await b.js(`
        const hidden = ['.drips', 'nav.tabs', '.weekpick', '.foot', '.soon'].every((s) => getComputedStyle(document.querySelector(s)).display === 'none');
        const fills = [...document.querySelectorAll('body *')].filter((el) => {
          const c = __t.parse(getComputedStyle(el).backgroundColor); const r = el.getBoundingClientRect();
          return c && c.a > 0.1 && r.width * r.height > 5000 && __t.lum(c) < 0.85 && !el.closest('.pic');
        }).map((el) => el.tagName + '.' + el.className);
        return { hidden, fills, body: getComputedStyle(document.body).backgroundColor };`);
      eq(r, { hidden: true, fills: [], body: 'rgb(255, 255, 255)' }, 'print');
      await b.media('');
    });

    console.log('Privacy and security');
    await check('nothing is stored: no localStorage, sessionStorage, cookies or IndexedDB', async () => {
      await b.load(url('#homework'));
      const r = await b.js(`return { local: localStorage.length, session: sessionStorage.length, cookie: document.cookie,
        idb: (await indexedDB.databases()).length };`);
      eq(r, { local: 0, session: 0, cookie: '', idb: 0 }, 'storage');
    });
    await check('every request stayed on this site, none failed, no newsletter photos requested', async () => {
      const external = b.requests.filter((u) => !u.startsWith(server.origin) && !u.startsWith('data:'));
      eq(external, [], 'external requests');
      eq(b.failures, [], 'failed requests');
      eq(b.requests.filter((u) => u.includes('newsletters')), [], 'newsletter photo requests');
      eq(server.missing, [], 'missing files');
    });
    await check('no script errors or warnings during the whole run', async () => eq(b.errors, [], 'console'));

    if (SITE) {
      console.log('Published site contents');
      const status = async (rel) => (await fetch(url(rel))).status;
      await check('development files are not served (requested directly, each is "not found")', async () => {
        const paths = ['reference/vocabulary-prototype.html', 'reference/spelling-test-prototype.html', 'reference/README.md',
          'tests/browser.test.js', 'tests/fixtures/data/weeks.json', 'docs/STUDY-SCOOP-AUDIT-REPORT.md', 'docs/DECISIONS.md',
          'docs/original-handoff/HANDOFF.md', 'scripts/build-site.js', 'package.json', 'README.md', 'STATUS.md', 'CLAUDE.md',
          '.gitignore', '.github/workflows/pages.yml', 'images/newsletters/2026-10-12.jpg'];
        const served = [];
        for (const p of paths) if (await status(p) !== 404) served.push(p);
        eq(served, [], 'served development files');
      });
      await check('every published runtime file is served', async () => {
        const bad = [];
        for (const p of ['', 'index.html', 'css/style.css', 'js/app.js', 'js/views/vocab.js', 'data/weeks.json',
          `data/${INDEX.current}.json`, 'images/cone.svg', 'images/words/produce.svg']) if (await status(p) !== 200) bad.push(p);
        eq(bad, [], 'missing runtime files');
      });
    }

    if (SHOTS) {
      console.log('Screenshots');
      fs.rmSync(SHOTS, { recursive: true, force: true });
      const LIGHT = [{ name: 'prefers-color-scheme', value: 'light' }];
      await b.media('', LIGHT);
      await b.viewport(1366, 900, false);
      for (const [id] of SECTIONS) { await b.load(url(`#${id}`)); await b.shot(path.join(SHOTS, `desktop-${id}.png`)); }
      await b.viewport(768, 1024);
      await b.load(url('#week')); await b.shot(path.join(SHOTS, 'tablet-week.png'));
      await b.viewport(360, 740);
      for (const id of ['week', 'vocab', 'math']) { await b.load(url(`#${id}`)); await b.shot(path.join(SHOTS, `phone-${id}.png`)); }
      await b.viewport(1366, 900, false);
      // The opt-in dark palette (not switched on anywhere yet).
      await b.load(url('#week')); await b.js(DARK); await b.shot(path.join(SHOTS, 'desktop-dark-week.png'));
      await b.load(url('#vocab?week=2026-10-12')); await b.js(DARK); await b.shot(path.join(SHOTS, 'desktop-dark-vocab-oct12.png'));
      await b.media('print', LIGHT);
      await b.load(url('#vocab')); await b.shot(path.join(SHOTS, 'print-vocab.png'));
      await b.media('');
      console.log(`  saved to ${path.relative(ROOT, SHOTS)}`);
    }
  } finally {
    b.close();
    server.close();
  }

  console.log('Adding a week (sample third week, no code changes)');
  const fx = await startServer({ root: SITE || ROOT, overlay: {
    'data/weeks.json': 'tests/fixtures/data/weeks.json',
    'data/2026-10-26.json': 'tests/fixtures/data/2026-10-26.json',
  } });
  const f = await startBrowser();
  const furl = (h = '') => `${fx.origin}${BASE}${h}`;
  try {
    await f.initScript(FREEZE_DATE);
    await f.viewport(1366, 900, false);
    await check('a new week file plus one line in weeks.json shows up in every section', async () => {
      await f.load(furl());
      eq(await f.js('return [...document.getElementById("weekSelect").options].map((o) => o.value);'),
        ['2026-10-26', '2026-10-19', '2026-10-12'], 'week picker');
      for (const [id, label] of SECTIONS) {
        await f.hash(`#${id}`);
        eq(await f.js('return [document.querySelector("#app h1").textContent, document.querySelector(".week-of").textContent];'),
          [label, 'Sample test week <not real> & October 26–30'], `#${id}`);
      }
    });
    await check('symbols in the data are shown as text, never as page markup', async () => {
      await f.hash('#vocab');
      eq(await f.js('return [document.querySelector("#app b"), document.querySelector(".def").textContent];'),
        [null, 'a small part that shows what the whole is like <with symbols & "quotes">'], 'escaping');
      eq(await f.js('return document.querySelector(".page-head .intro").textContent;'), 'Sample <b>book</b> title · Quiz: Friday, Oct 30', 'title text');
    });
    await check('a week without math or pictures still works (missing pictures are hidden)', async () => {
      await f.wait(300);
      eq(await f.js('return document.querySelectorAll(".vocab-card .pic").length;'), 0, 'picture frames removed');
      await f.hash('#math');
      expect(await f.js('return document.body.textContent.includes("No math words are listed for this week.");'), 'no-math message');
      eq([...new Set(fx.missing)].sort(), ['/Study-Scoop/images/words/gather.svg', '/Study-Scoop/images/words/sample.svg'], 'only the two missing pictures');
      eq(f.errors, [], 'console');
    });
  } finally {
    f.close();
    fx.close();
  }

  console.log(`\n${passed} passed, ${failed.length} failed`);
  if (failed.length) { console.log(failed.map((n) => `  - ${n}`).join('\n')); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
