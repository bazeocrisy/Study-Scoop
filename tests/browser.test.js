// Browser tests: headless Chrome against the site served under /Study-Scoop/ (like GitHub Pages).
// Run: npm run test:browser   (SCREENSHOTS=1 also writes docs/screenshots/assignment-002/*.png)
//      npm run test:site      (builds _site, then runs every check against the published files only)
import fs from 'node:fs';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';
import { boxes, solution } from '../js/lib/lessons.js';
import { pictureName } from '../js/lib/data.js';

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/weeks.json');
const SECTIONS = [['week', 'This Week'], ['spelling', 'Spelling'], ['vocab', 'Vocabulary'], ['math', 'Math'],
  ['quickmath', 'Quick Math'], ['homework', 'Homework'], ['newsletter', 'Newsletter']];
const VIEWPORTS = [[360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]];
const L51 = readJSON('data/lessons/5-1.json');
const L52 = readJSON('data/lessons/5-2.json');
const LESSON_STAGES = ['learn', 'watch', 'together', 'try', 'test', 'parent'];
const lessonHash = (id, stage) => `#math?lesson=${id}&stage=${stage}`;
const LESSON_ROUTES = ['5-1', '5-2'].flatMap((id) => LESSON_STAGES.map((s) => lessonHash(id, s)));
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
          // Each card: the teacher's definition word for word, and an example that shows its property.
          const shown = await b.js('return [...document.querySelectorAll(".math-words .property")].map((c) => [c.querySelector("h3").textContent, c.querySelector(".def").textContent, c.querySelector(".fact").textContent]);');
          const want = week.math.words.map((w) => {
            const [x, y, p] = w.example;
            return [w.word, w.def, /commutative/i.test(w.word) ? `${x} × ${y} = ${y} × ${x} = ${p}` : `${x} × ${y} = ${p}`];
          });
          eq([...shown].sort(), [...want].sort(), 'cards');
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
    for (const route of [...SECTIONS.map(([id]) => `#${id}`), ...LESSON_ROUTES]) {
      await check(`${route}: headings, labels, alt text and touch targets`, async () => {
        await b.load(url(route));
        const r = await b.js(`
          const levels = [...document.querySelectorAll('#app h1, #app h2, #app h3, #app h4')].map((h) => Number(h.tagName[1]));
          const skips = levels.filter((l, i) => i && l > levels[i - 1] + 1).length;
          const unlabelled = [...document.querySelectorAll('input, select, textarea')].filter((el) =>
            !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map((el) => el.id || el.tagName);
          const noAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
          const emptyLinks = [...document.querySelectorAll('a')].filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label')).length;
          const small = [...document.querySelectorAll('nav.tabs a, #weekSelect, .brand, .action, .btn, .read, .choice, .box, .stepper a, .archive a, .checklist label')]
            .map((el) => [el, el.getBoundingClientRect()]).filter(([, rect]) => (rect.width || rect.height) && (rect.width < 44 || rect.height < 44))
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
        for (const h of [...SECTIONS.map(([id]) => `#${id}`), '#vocab?week=2026-10-12', ...LESSON_ROUTES]) {
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
        ['rgb(251, 244, 233)', 'rgb(255, 255, 255)'], 'page and card colours');
    });
    await b.media('', [{ name: 'prefers-color-scheme', value: 'light' }]);

    console.log('Responsive layout');
    for (const [w, h] of VIEWPORTS) {
      await check(`${w}×${h}: no sideways scrolling, nothing past the edge, all seven sections and every lesson screen`, async () => {
        await b.viewport(w, h);
        const problems = [];
        for (const route of [...SECTIONS.map(([id]) => `#${id}`), ...LESSON_ROUTES]) {
          await b.load(url(route));
          const r = await b.js(`return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
            nav: [...document.querySelectorAll('nav.tabs a')].filter((a) => { const r = a.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).length,
            past: [...document.querySelectorAll('#app *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).length };`);
          if (r.sw > r.cw) problems.push(`${route} page is ${r.sw}px wide in a ${r.cw}px window`);
          if (r.nav) problems.push(`${route} ${r.nav} section links off screen`);
          if (r.past) problems.push(`${route} ${r.past} elements past the edge`);
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

    console.log('Pictures');
    await check('spelling study cards: the 15 approved pictures, each matched to its word, with a sentence', async () => {
      await b.load(url('#spelling'));
      await b.waitFor('[...document.querySelectorAll(".study-card img")].every((i) => i.complete && i.naturalWidth > 0)');
      const cards = await b.js('return [...document.querySelectorAll(".study-card")].map((c) => [c.querySelector("h3").textContent, c.querySelector("img").getAttribute("src"), c.querySelector("img").alt, !!c.querySelector(".sentence")]);');
      const week = readJSON('data/2026-10-19.json');
      eq(cards, week.spelling.words.map((w) => [w.word, `images/words/${w.word}.webp`, `Study card for the word "${w.word}"`, true]), 'study cards');
    });
    await check('vocabulary: the approved illustrations, this week and in an earlier week with the same words', async () => {
      await b.load(url('#vocab'));
      await b.waitFor('[...document.querySelectorAll(".vocab-card img")].every((i) => i.complete && i.naturalWidth > 0)');
      const week = readJSON('data/2026-10-19.json');
      eq(await b.js('return [...document.querySelectorAll(".vocab-card img")].map((i) => i.getAttribute("src"));'),
        week.vocab.words.map((w) => `images/words/${pictureName(w.word)}.webp`), 'this week');
      expect((await b.js('return [...document.querySelectorAll(".vocab-card img")].map((i) => i.alt);')).every((a) => a.startsWith('Picture showing')), 'alt text');
      await b.hash('#vocab?week=2026-10-12');
      await b.waitFor('[...document.querySelectorAll(".vocab-card img")].every((i) => i.complete && i.naturalWidth > 0)');
      // The same picture rule in every week: the approved illustration when one exists, otherwise the drawing.
      const pics = readJSON('data/pictures.json');
      eq(await b.js('return [...document.querySelectorAll(".vocab-card img")].map((i) => i.getAttribute("src"));'),
        readJSON('data/2026-10-12.json').vocab.words.map((w) => { const n = pictureName(w.word); return `images/words/${n}.${pics.photos.includes(n) ? 'webp' : 'svg'}`; }),
        'earlier week');
    });

    console.log('Math page and lessons');
    const rendered = () => b.js('return document.getElementById("app").dataset.rendered || "0";');
    const afterAction = async (before) => b.waitFor(`(document.getElementById("app").dataset.rendered || "0") !== ${JSON.stringify(before)}`);
    /** Fills a question's boxes (or picks a choice) with the given values, as typing would. */
    const answer = async (item, values) => {
      await b.js(`const f = document.querySelector('form[data-item="${item.id}"]'); const v = ${JSON.stringify(values)};
        if ('choice' in v) f.querySelector('input[name=choice][value="' + v.choice + '"]').click();
        for (const [k, x] of Object.entries(v)) { const el = f.querySelector('[name="' + k + '"]'); if (el && el.type !== 'radio') el.value = String(x); }
        f.dispatchEvent(new Event('input', { bubbles: true }));`);
    };
    const press = async (selector) => {
      const before = await rendered();
      await b.js(`document.querySelector(${JSON.stringify(selector)}).click();`);
      await afterAction(before);
    };
    const checkAnswer = (item) => press(`form[data-item="${item.id}"] button[type=submit]`);
    const solve = async (item) => { await answer(item, solution(item)); await checkAnswer(item); };
    const fb = () => b.js('return document.querySelector("#lesson-stage .feedback:not(.info)")?.textContent.replace(/\\s+/g, " ").trim() || "";');

    await check('Math page: four properties explained with pictures that match their numbers, and both lessons', async () => {
      await b.load(url('#math'));
      const r = await b.js(`const card = (n) => [...document.querySelectorAll('.property')].find((c) => c.querySelector('h3').textContent.includes(n));
        const dots = (c, cls = '') => c.querySelectorAll('circle.m-dot' + cls).length;
        return {
          identity: [card('Identity').querySelectorAll('.m-plate').length, dots(card('Identity'))],
          zero: [card('Zero').querySelectorAll('.m-plate').length, dots(card('Zero')), !!card('Zero').querySelector('.m-none')],
          commutative: [...card('Commutative').querySelectorAll('svg')].map((s) => s.querySelectorAll('.m-dot, .m-star').length),
          examples: [...card('Distributive').querySelectorAll('.ex')].map((e) => [e.querySelectorAll('.m-dot.m-a').length, e.querySelectorAll('.m-dot.m-b').length,
            [...e.querySelectorAll('.equation')].map((q) => q.textContent.replace(/\\s+/g, ' ').trim())]),
          lessons: [...document.querySelectorAll('.lesson-card a.btn')].map((a) => a.getAttribute('href')),
        };`);
      eq(r.identity, [7, 7], '7 groups of 1');
      eq(r.zero, [9, 0, true], '9 empty plates and no plates');
      eq(r.commutative, [8, 8], '4 rows of 2 and 2 rows of 4');
      eq(r.examples, [
        [15, 3, ['6 × 3 = 5 × 3 + 1 × 3', '15 + 3 = 18']],
        [12, 6, ['6 × 3 = 4 × 3 + 2 × 3', '12 + 6 = 18']],
        [12, 6, ['6 × 3 = 6 × 2 + 6 × 1', '12 + 6 = 18']]], 'Examples A, B and C');
      eq(r.lessons, ['#math?lesson=5-1&stage=learn', '#math?lesson=5-2&stage=learn'], 'lesson links');
    });
    await check('lesson addresses: unknown lessons go back to Math, unknown stages open Learn It, the stepper marks the stage', async () => {
      await b.load(url('#math?lesson=9-9&stage=watch'));
      eq(await b.js('return [location.hash, document.querySelector("#app h1").textContent];'), ['#math', 'Math'], 'unknown lesson');
      await b.load(url('#math?lesson=5-1&stage=nope'));
      eq(await b.js('return [location.hash, document.querySelector("#app h1").textContent, document.title];'),
        ['#math?lesson=5-1&stage=learn', L51.title, `Learn It · Lesson 5-1: ${L51.title} · Study Scoop`], 'unknown stage');
      eq(await b.js('return [...document.querySelectorAll(".stepper a[aria-current=step]")].map((a) => a.textContent.trim());'), ['1 Learn It'], 'stepper');
      eq(await b.js('return document.querySelector("nav.tabs a[aria-current=page]").dataset.tab;'), 'math', 'Math tab stays marked');
    });
    await check('keyboard: type a wrong answer and press Enter, then fix it (Learn It, Ready? question)', async () => {
      await b.load(url(lessonHash('5-1', 'learn')));
      const r1 = L51.learn.screens[0].item;
      await b.js(`document.querySelector('form[data-item="${r1.id}"] input').focus();`);
      await b.type('8');
      let before = await rendered();
      await b.key('Enter');
      await afterAction(before);
      eq(await fb(), 'Not yet 5 + 3 is 8. Count the dots: 5 rows of 3.', 'specific feedback for 8');
      eq(await b.js('const e = document.activeElement; return [e.name, e.value, e.getAttribute("aria-invalid")];'), ['answer', '8', 'true'], 'focus stays on the answer, which is kept');
      await b.waitFor('document.getElementById("live").textContent.includes("5 + 3 is 8")');
      expect(await b.js('return document.querySelector("[data-act=next]").disabled;'), 'Next waits for a right answer');
      await b.js('document.activeElement.select();');
      await b.type('15');
      before = await rendered();
      await b.key('Enter');
      await afterAction(before);
      eq(await fb(), 'Yes! 5 rows of 3 is 15.', 'correct');
      eq(await b.js('const e = document.activeElement; return [e.dataset.act, e.disabled];'), ['next', false], 'focus moves to Next');
    });
    await check('an empty or unreadable answer is not counted as a try', async () => {
      await b.load(url(lessonHash('5-1', 'learn')));
      const r1 = L51.learn.screens[0].item;
      await checkAnswer(r1);
      eq(await b.js('return document.querySelector("#lesson-stage .feedback").textContent.trim();'), 'Type a number first.', 'empty');
      await answer(r1, { answer: 'fifteen' });
      await checkAnswer(r1);
      eq(await b.js('return document.querySelector("#lesson-stage .feedback").textContent.trim();'), 'Use only the digits 0 to 9.', 'not a number');
      await checkAnswer(r1);
      eq(await b.js('return !!document.querySelector("[data-act=show]");'), false, 'no "Show me how" after empty tries');
    });
    await check('Watch Me: step by step, then a "why" question; Examples A, B and C; the takeaway at the end', async () => {
      await b.load(url(lessonHash('5-1', 'watch')));
      for (const [k, ex] of L51.watch.examples.entries()) {
        eq(await b.js('return document.querySelector("#lesson-stage h3").textContent;'), ex.title, `example ${k + 1} title`);
        for (let s = 1; s < ex.steps.length; s++) await press('[data-act="step-next"]');
        eq(await b.js('return document.querySelector(".progress:not(.stage-title .progress)")?.textContent || [...document.querySelectorAll(".progress")].pop().textContent;'),
          `Step ${ex.steps.length} of ${ex.steps.length}`, 'all steps shown');
        // A11Y-21: each new step is announced to screen readers.
        await b.waitFor(`document.querySelector('#live').textContent.startsWith('Step ${ex.steps.length} of ${ex.steps.length}. ')`);
        const eqs = await b.js('return [...document.querySelectorAll(".steps .eq")].map((e) => e.textContent);');
        expect(eqs.includes(ex.steps.find((s) => s.pictured).eq), `${ex.title} shows its equation`);
        // A wrong "why" choice explains; the right one unlocks the next example.
        const wrong = ex.why.options.findIndex((o) => !o.correct);
        await answer(ex.why, { choice: wrong });
        await checkAnswer(ex.why);
        eq(await fb(), `Not yet ${ex.why.options[wrong].why}`, 'why feedback');
        await solve(ex.why);
        expect((await fb()).startsWith('Yes!'), 'why answered');
        if (k < L51.watch.examples.length - 1) await press('[data-act="next"]');
      }
      eq(await b.js('return document.querySelector(".takeaway")?.textContent;'), L51.watch.takeaway, 'takeaway');
      eq(await b.js('return document.querySelector(".stage-nav a.btn-primary").getAttribute("href");'), lessonHash('5-1', 'together'), 'on to Practice Together');
    });
    await check('Practice Together: hints, mistake-specific feedback, "Show me how" after two misses, 3-in-a-row, own cut', async () => {
      await b.load(url(lessonHash('5-1', 'together')));
      const [g1, ...rest] = L51.together.items;
      await press('[data-act="hint"]');
      await press('[data-act="hint"]');
      eq(await b.js('return [...document.querySelectorAll(".hints li")].map((l) => l.textContent);'), g1.hints, 'both hints');
      expect(await b.js('return document.querySelector("[data-act=hint]").disabled;'), 'no more hints');
      await answer(g1, { t: 20 }); await checkAnswer(g1);
      eq(await fb(), 'Not yet You found the first part! Now add the second part.', 'stopped at the first part');
      expect(!(await b.js('return !!document.querySelector("[data-act=show]");')), 'no Show me how after one miss');
      await answer(g1, { t: 11 }); await checkAnswer(g1);
      eq(await fb(), 'Not yet 7 × 4 means 7 groups of 4, not 7 + 4. Add the two products.', 'added the factors');
      await press('[data-act="show"]');
      eq(await b.js('return [document.querySelector("input[name=t]").value, [...document.querySelectorAll(".showme li")].length, document.querySelector("[data-act=next]").disabled];'),
        ['28', g1.show.length, false], 'Show me how fills in the answer and explains');
      await press('[data-act="next"]');
      for (const item of rest.slice(0, 3)) { await solve(item); expect((await fb()).startsWith('Yes!'), item.id); await press('[data-act="next"]'); }
      // Three right on the first try in a row: the child may move on.
      expect(await b.js('return document.body.textContent.includes("3 in a row!");'), '3 in a row');
      const g5 = rest[3];
      await solve(g5);
      await press('[data-act="next"]');
      const g6 = rest[4];
      await answer(g6, { p: 6, q: 2, r: 1, s: 6, t: 18 });
      await checkAnswer(g6);
      eq(await fb(), 'Yes! You can also write it 6 × 2 + 6 × 1.', 'a turned-around fact is accepted');
      await b.load(url(lessonHash('5-1', 'together')));
      eq(await b.js('return [document.querySelector(".stage-title .progress").textContent, !!document.querySelector(".feedback:not(.info)")];'), ['Question 1 of 6', false], 'reload starts again (nothing saved)');
    });
    await check('Try It Yourself: hints only after the second miss; results count first tries and list what to look at again', async () => {
      await b.load(url(lessonHash('5-1', 'try')));
      const [t1, ...rest] = L51.try.items;
      expect(!(await b.js('return !!document.querySelector("[data-act=hint]");')), 'no hint before trying');
      await answer(t1, { p: 1, q: 1, r: 1, s: 1, t: 2 }); await checkAnswer(t1);
      expect(!(await b.js('return !!document.querySelector("[data-act=hint]");')), 'no hint after one miss');
      await answer(t1, { p: 9, q: 2, r: 9, s: 3, t: 45 }); await checkAnswer(t1);
      expect(await b.js('return !!document.querySelector("[data-act=hint]") && !!document.querySelector("[data-act=show]");'), 'hint and Show me how after two misses');
      await press('[data-act="show"]');
      await press('[data-act="next"]');
      for (const item of rest) { await solve(item); expect((await fb()).startsWith('Yes!'), item.id); await press('[data-act="next"]'); }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '7 out of 8 right on the first try', 'score');
      expect(await b.js('return document.body.textContent.includes("You are ready for the test.");'), 'pass message at 7 of 8');
      eq(await b.js('return [...document.querySelectorAll(".review li .right")].map((e) => e.textContent);'),
        ['Answer: 9 × 4 = 5 × 4 + 4 × 4 = 36'], 'missed list');
    });
    await check('Test: no hints or feedback, a warning for unanswered questions, a correct score and review', async () => {
      await b.load(url(lessonHash('5-1', 'test')));
      const items = L51.test.items;
      for (const [k, item] of items.entries()) {
        eq(await b.js('return [...document.querySelectorAll("#lesson-stage [data-act=hint], #lesson-stage [data-act=show], #lesson-stage button[type=submit]")].length;'), 0, `no help on ${item.id}`);
        expect(!(await b.js(`return ${JSON.stringify(item.show || [])}.some((s) => document.body.textContent.includes(s));`)), `${item.id} does not reveal its worked answer`);
        if (item.id === 'x2') await answer(item, { b: 2, t: 28 });          // wrong
        else if (item.id !== 'x8') await answer(item, solution(item));      // x8 is left blank
        if (k < items.length - 1) await press('[data-act="next"]');
      }
      await b.js('document.querySelector("[data-act=submit]").click();');
      await b.waitFor('document.getElementById("live").textContent.includes("no answer")');
      eq(await b.js('return [document.querySelector("[data-act=submit]").textContent, document.activeElement.id, [...document.querySelectorAll("[data-act=goto]")].map((x) => x.textContent)];'),
        ['Finish anyway', 'test-warning', ['Go to question 8']], 'unanswered warning, shown and focused');
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '6 out of 8', 'score');
      expect(await b.js('return document.body.textContent.includes("Not yet. 7 or more right means you passed.");'), 'not passed at 6');
      eq(await b.js('return [...document.querySelectorAll(".review li")].map((l) => [l.querySelector(".you").textContent, l.querySelector(".right").textContent]);'),
        [['Your answer: 2, 28', 'Correct answer: 8 × 4 = 5 × 4 + 3 × 4 = 32'], ['Your answer: No answer', 'Correct answer: 54']], 'review');
      await press('[data-act="restart"]');
      eq(await b.js('return document.querySelector(".stage-title .progress").textContent;'), 'Question 1 of 8', 'take it again');
    });
    await check('Lesson 5-2 end to end: the 3s strategy, its mistakes, and a perfect test', async () => {
      await b.load(url(lessonHash('5-2', 'together')));
      const g = L52.together.items;
      for (const item of g.slice(0, 4)) { await solve(item); await press('[data-act="next"]'); }
      await answer(g[4], { answer: 16 }); await checkAnswer(g[4]);
      eq(await fb(), "Not yet That's only double 8. Add 8 once more.", 'forgot once more');
      await answer(g[4], { answer: 9 }); await checkAnswer(g[4]);
      eq(await fb(), `Not yet ${L52.catchAll}`, 'anything else gets the strategy');
      await b.load(url(lessonHash('5-2', 'test')));
      for (const [k, item] of L52.test.items.entries()) { await answer(item, solution(item)); if (k < L52.test.items.length - 1) await press('[data-act="next"]'); }
      await press('[data-act="submit"]');
      eq(await b.js('return [document.querySelector(".summary-score").textContent, document.body.textContent.includes("You passed!")];'), ['8 out of 8', true], 'perfect score');
    });
    await check('the tricycle table checks every row', async () => {
      await b.load(url(lessonHash('5-2', 'try')));
      const items = L52.try.items;
      for (const item of items.slice(0, 4)) { await solve(item); await press('[data-act="next"]'); }
      const table = items[4];
      await answer(table, { ...solution(table), r1c2: 17 }); await checkAnswer(table);
      eq(await b.js('return [...document.querySelectorAll(".table-item input[aria-invalid=true]")].map((i) => i.name);'), ['r1c2'], 'only the wrong cell is marked');
      await solve(table);
      expect((await fb()).startsWith('Yes!'), 'table correct');
    });
    await check('Parent Guide and "Read to me" text', async () => {
      await b.load(url(lessonHash('5-1', 'parent')));
      eq(await b.js('return [...document.querySelectorAll(".parent-guide h3")].map((h) => h.textContent);'), [...L51.parent.sections.map((s) => s.heading), 'About "Read to me"'], 'sections');
      await b.load(url(lessonHash('5-1', 'together')));
      const says = await b.js('return [...document.querySelectorAll("[data-act=read]")].map((x) => x.dataset.say);');
      expect(says.length && says.every((s) => s && !/parenthes|[×=]/.test(s)), `read-aloud text is spoken words: ${says.join(' / ')}`);
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
      // Pictures come from data/pictures.json, so a word without a picture never causes a request for a missing file.
      eq([...new Set(fx.missing)], [], 'no requests for missing files');
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
