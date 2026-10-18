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
  ['quickmath', 'Quick Math'], ['homework', 'Homework'], ['newsletter', 'Newsletter'], ['tests', 'Tests']];
const VIEWPORTS = [[360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]];
const L51 = readJSON('data/lessons/5-1.json');
const L52 = readJSON('data/lessons/5-2.json');
const LESSON_STAGES = ['learn', 'watch', 'together', 'try', 'test', 'parent'];
const lessonHash = (id, stage) => `#math?lesson=${id}&stage=${stage}`;
const LESSON_ROUTES = ['5-1', '5-2'].flatMap((id) => LESSON_STAGES.map((s) => lessonHash(id, s)));
// Activities and practice tests (Assignment 005), plus an earlier week's homework and Test Center.
const ACTIVITY_ROUTES = ['#vocab?act=learn', '#spelling?act=learn', '#math?act=learn', '#math?act=practice', '#math?act=split', '#math?act=props', '#math?act=breakapart', '#math?act=mixed',
  '#math?act=lessons', '#math?act=guide', '#vocab?act=choice', '#vocab?act=truefalse', '#vocab?act=fill', '#vocab?act=misses',
  '#spelling?act=flash', '#spelling?act=letters', '#spelling?act=listen', '#spelling?act=misses',
  '#tests?test=math', '#tests?test=spelling', '#tests?test=vocab', '#tests?week=2026-10-12', '#homework?week=2026-10-12'];
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
    await check('navigation lists the eight sections in order', async () => {
      const labels = await b.js('return [...document.querySelectorAll("nav.tabs a")].map((a) => a.textContent.trim());');
      eq(labels, SECTIONS.map((s) => s[1]), 'nav labels');
      eq(await b.js('return document.querySelector("nav.tabs").getAttribute("aria-label");'), 'Sections', 'nav label');
    });
    await check('This Week counts down to each test from Friday, Oct 16', async () => {
      const cards = await b.js('return [...document.querySelectorAll(".test")].map((c) => c.querySelector(".count").textContent + " | " + c.querySelector("h3").textContent + " | " + c.querySelector(".date").textContent);');
      eq(cards, ['In 5 days | Math Test | Wednesday, October 21', 'In 7 days | Vocabulary Quiz | Friday, October 23',
        'In 7 days | Spelling Test | Friday, October 23'], 'test cards');
      eq(await b.js('return [...document.querySelectorAll(".test .action")].map((a) => a.getAttribute("href"));'),
        ['#math', '#tests', '#vocab', '#tests', '#spelling', '#tests'], 'study and practice-test links');
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
      eq(await b.js('return document.querySelector(".intro").textContent;'), "This week's pattern: -ed words (15 words)", 'pattern');
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
      const W12 = readJSON('data/2026-10-12.json');
      eq(await b.js('return document.querySelector(".intro").textContent;'), `${W12.vocab.title} · ${W12.vocab.words.length} words · Quiz: ${W12.vocab.quiz}`, 'Oct 12 vocabulary');
      eq(await b.js('return document.getElementById("weekLabel").textContent;'), '3rd grade · Oct 12–16', 'header label');
      before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-19"; s.dispatchEvent(new Event("change"));');
      await b.ready(before);
      eq(await b.js('return location.hash;'), '#vocab', 'hash back to this week');
      const W = readJSON('data/2026-10-19.json');
      eq(await b.js('return document.querySelector(".intro").textContent;'), `${W.vocab.title} · ${W.vocab.words.length} words · Quiz: ${W.vocab.quiz}`, 'Oct 19 vocabulary');
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
        await b.load(url(id === INDEX.current ? '#vocab?act=learn' : `#vocab?week=${id}&act=learn`));
        const defs = [], words = [];
        for (let k = 0; k < week.vocab.words.length; k++) {
          defs.push(await b.js('return document.querySelector(".study-one .def").textContent;'));
          words.push(await b.js('return document.querySelector(".study-one .vocab-word").textContent;'));
          if (k < week.vocab.words.length - 1) await b.js('document.querySelector("[data-act=card-next]").click();');
        }
        eq(defs, week.vocab.words.map((w) => w.def), 'definitions');
        eq(words, week.vocab.words.map((w) => w.word), 'words');
      });
      await check(`${id}: every spelling word is shown once`, async () => {
        await b.hash(id === INDEX.current ? '#spelling?act=learn' : `#spelling?week=${id}&act=learn`);
        const shown = await b.js('return [...document.querySelectorAll(".words .word")].map((e) => e.textContent).sort();');
        eq(shown, week.spelling.words.map((w) => w.word).sort(), 'spelling words');
      });
      if (week.math) {
        await check(`${id}: math words and examples match the data`, async () => {
          await b.hash(id === INDEX.current ? '#math?act=guide' : `#math?week=${id}&act=guide`);
          // Study Guide: each property with the teacher's definition word for word.
          const shown = await b.js('return [...document.querySelectorAll(".guide-prop")].map((c) => [c.querySelector("h3").textContent, c.querySelector(".def").textContent]);');
          eq([...shown].sort(), week.math.words.map((w) => [w.word, w.def]).sort(), 'cards');
        });
      }
    }
    await check('all 15 spelling study pictures load in Learn My Words, even on a phone (for printing)', async () => {
      await b.viewport(360, 740);
      await b.load(url('#spelling?act=learn'));
      await b.wait(300);
      eq(await b.js('return [...document.querySelectorAll(".study-card img")].filter((i) => i.complete && i.naturalWidth > 0).length;'), 15, 'loaded pictures');
      await b.viewport(1366, 900, false);
    });

    console.log('Keyboard and accessibility');
    await check('Tab order: skip link, logo, week picker, then the eight sections', async () => {
      await b.load(url('#week'));
      // fresh load: focus starts at the top of the page
      const order = [];
      for (let i = 0; i < 3 + SECTIONS.length; i++) {
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
    for (const route of [...SECTIONS.map(([id]) => `#${id}`), ...LESSON_ROUTES, ...ACTIVITY_ROUTES]) {
      await check(`${route}: headings, labels, alt text and touch targets`, async () => {
        await b.load(url(route));
        const r = await b.js(`
          const levels = [...document.querySelectorAll('#app h1, #app h2, #app h3, #app h4')].map((h) => Number(h.tagName[1]));
          const skips = levels.filter((l, i) => i && l > levels[i - 1] + 1).length;
          const unlabelled = [...document.querySelectorAll('input, select, textarea')].filter((el) =>
            !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map((el) => el.id || el.tagName);
          const noAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
          const emptyLinks = [...document.querySelectorAll('a')].filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label')).length;
          const small = [...document.querySelectorAll('nav.tabs a, #weekSelect, .brand, .action, .btn, .read, .choice, .box, .stepper a, .archive a, .checklist label, .bank-word, .hw-check')]
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
        for (const h of [...SECTIONS.map(([id]) => `#${id}`), '#vocab?week=2026-10-12', ...LESSON_ROUTES, ...ACTIVITY_ROUTES]) {
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
        for (const route of [...SECTIONS.map(([id]) => `#${id}`), ...LESSON_ROUTES, ...ACTIVITY_ROUTES]) {
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
      await b.load(url('#math?act=guide'));
      await b.media('print');
      await helpers(b);
      const r = await b.js(`
        const hidden = ['.drips', 'nav.tabs', '.weekpick', '.foot', '.bar-btns', '.crumbs', '.stage-nav'].every((s) => getComputedStyle(document.querySelector(s)).display === 'none');
        const fills = [...document.querySelectorAll('body *')].filter((el) => {
          const c = __t.parse(getComputedStyle(el).backgroundColor); const r = el.getBoundingClientRect();
          return c && c.a > 0.1 && r.width * r.height > 5000 && __t.lum(c) < 0.85 && !el.closest('.pic');
        }).map((el) => el.tagName + '.' + el.className);
        return { hidden, fills, body: getComputedStyle(document.body).backgroundColor };`);
      await b.media('');
      eq(r, { hidden: true, fills: [], body: 'rgb(255, 255, 255)' }, 'print');
    });

    console.log('Pictures');
    await check('spelling study cards: the 15 approved pictures, each matched to its word, with a sentence', async () => {
      await b.load(url('#spelling?act=learn'));
      await b.waitFor('[...document.querySelectorAll(".study-card img")].every((i) => i.complete && i.naturalWidth > 0)');
      const cards = await b.js('return [...document.querySelectorAll(".study-card")].map((c) => [c.querySelector("h3").textContent, c.querySelector("img").getAttribute("src"), c.querySelector("img").alt, !!c.querySelector(".sentence")]);');
      const week = readJSON('data/2026-10-19.json');
      eq(cards, week.spelling.words.map((w) => [w.word, `images/words/${w.word}.webp`, `Study card for the word "${w.word}"`, true]), 'study cards');
    });
    await check('vocabulary: the approved illustrations, this week and in an earlier week with the same words', async () => {
      // Learn My Words shows one card at a time: collect each card's picture.
      const allPics = async (n) => {
        const out = [];
        for (let k = 0; k < n; k++) {
          await b.waitFor('[...document.querySelectorAll(".study-one img")].every((i) => i.complete && i.naturalWidth > 0)');
          out.push(await b.js('const i = document.querySelector(".study-one img"); return [i.getAttribute("src"), i.alt];'));
          if (k < n - 1) await b.js('document.querySelector("[data-act=card-next]").click();');
        }
        return out;
      };
      const week = readJSON('data/2026-10-19.json');
      await b.load(url('#vocab?act=learn'));
      const now = await allPics(12);
      eq(now.map((x) => x[0]), week.vocab.words.map((w) => `images/words/${pictureName(w.word)}.webp`), 'this week');
      expect(now.every((x) => x[1].startsWith('Picture showing')), 'alt text');
      await b.load(url('#vocab?week=2026-10-12&act=learn'));
      // The same picture rule in every week: the approved illustration when one exists, otherwise the drawing.
      const pics = readJSON('data/pictures.json');
      eq((await allPics(12)).map((x) => x[0]),
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
    /** Follows a link the way a child would (a click), and waits for the new page. */
    const go = async (selector) => {
      const before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js(`document.querySelector(${JSON.stringify(selector)}).click();`);
      await b.ready(before);
    };
    const checkAnswer = (item) => press(`form[data-item="${item.id}"] button[type=submit]`);
    const solve = async (item) => { await answer(item, solution(item)); await checkAnswer(item); };
    const fb = () => b.js('return document.querySelector("#lesson-stage .feedback:not(.info)")?.textContent.replace(/\\s+/g, " ").trim() || "";');

    await check('Math > Learn the Properties: four cards, each picture matching its equation, with the teacher\'s words', async () => {
      await b.load(url('#math'));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent);'),
        ['Learn the Properties', 'Practice Problems', 'Math Lessons', 'Study Guide'], 'four choices first');
      await go('.menu-card[href="#math?act=learn"]');
      const W = readJSON('data/2026-10-19.json');
      const seen = [];
      for (let k = 0; k < 4; k++) {
        seen.push(await b.js(`const c = document.querySelector('#act-stage');
          return [c.querySelector('h3').textContent, c.querySelector('.def')?.textContent, c.querySelector('.kid-words').textContent.replace('In other words', ''),
            c.querySelector('.fact').textContent, c.querySelectorAll('.m-plate').length, c.querySelectorAll('circle.m-dot').length,
            [...c.querySelectorAll('.model-svg')].map((s) => s.querySelectorAll('.m-dot, .m-star').length),
            c.querySelectorAll('.prop-learn:not(.second-ex) .pic-card .m-dot.m-a').length, c.querySelectorAll('.prop-learn:not(.second-ex) .pic-card .m-dot.m-b').length,
            c.querySelectorAll('.second-ex .pic-card .m-dot.m-a').length, c.querySelectorAll('.second-ex .pic-card .m-dot.m-b').length,
            c.querySelector('.second-ex .fact')?.textContent];`));
        if (k < 3) await press('[data-act="card-next"]');
      }
      const def = (n) => W.math.words.find((w) => w.word.startsWith(n)).def;
      eq(seen.map((s) => s.slice(0, 4)), [
        ['Identity Property', def('Identity'), 'Any number multiplied by 1 stays the same.', '7 × 1 = 7'],
        ['Zero Property', def('Zero'), 'Any number multiplied by 0 equals 0.', '9 × 0 = 0'],
        ['Commutative Property', def('Commutative'), 'Changing the order of the factors does not change the product.', '4 × 2 = 2 × 4 = 8'],
        ['Distributive Property', def('Distributive'), 'You can break apart a factor, multiply the smaller parts, and add their products.', '6 × 3 = (5 × 3) + (1 × 3)']], 'words and equations');
      eq([seen[0][4], seen[0][5]], [7, 7], 'identity: 7 groups of 1');
      eq([seen[1][4], seen[1][5]], [9, 0], 'zero: 9 empty groups');
      eq(seen[2][6], [8, 8], 'commutative: 4 rows of 2 and 2 rows of 4');
      eq([seen[3][7], seen[3][8]], [15, 3], "distributive leads with the teacher's example: 5 rows of 3 and 1 row of 3");
      eq([seen[3][9], seen[3][10], seen[3][11]], [21, 21, '6 × 7 = (3 × 7) + (3 × 7)'], 'second example: 3 rows of 7 and 3 rows of 7');
      eq(seen[0][9] + seen[1][9] + seen[2][9], 0, 'only the Distributive card has a second example');
      eq(await b.js('return document.querySelector(".stage-nav .btn-primary").getAttribute("href");'), '#math?act=practice', 'then Practice Problems');
      await press('[data-act="card-prev"]');
      eq(await b.js('return document.getElementById("stage-h").textContent;'), 'Property 3 of 4', 'Previous Property');
      await b.js('document.querySelector(".bar-btns a.back").click();');
      await b.waitFor('location.hash === "#math"');
      // On a menu, Home is the first step of the crumbs.
      await b.js('document.querySelector(".crumbs a").click();');
      await b.waitFor('document.querySelector("#app h1")?.textContent === "This Week"');
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

    console.log('Activities and practice tests');
    const W19 = readJSON('data/2026-10-19.json');
    const T19 = readJSON('data/tests/2026-10-19.json');
    const DEF = new Map(W19.vocab.words.map((w) => [w.word, w.def]));
    const SP = new Map(W19.spelling.words.map((w) => [w.word, w]));
    const formId = () => b.js('return document.querySelector("#act-stage form[data-item]")?.dataset.item || null;');
    const actFb = () => b.js('return document.querySelector("#act-stage .feedback:not(.info)")?.textContent.replace(/\\s+/g, " ").trim() || "";');
    // The question as written on screen (a blank's hidden "blank" word for screen readers is left out).
    const qPrompt = () => b.js('const p = document.querySelector("#act-stage form[data-item]").querySelector(".prompt, legend")?.cloneNode(true); p?.querySelectorAll(".sr-only").forEach((x) => x.remove()); return (p?.textContent || "").trim();');
    const optionTexts = () => b.js('return [...document.querySelectorAll("#act-stage .choice > span")].map((s) => s.textContent);');
    const pickText = async (text) => {
      const i = (await optionTexts()).indexOf(text);
      expect(i >= 0, 'option ' + text);
      await b.js('document.querySelectorAll("#act-stage input[name=choice]")[' + i + '].click();');
    };
    const typeIn = (text, name = 'text') => b.js('const el = document.querySelector(\'#act-stage input[name="' + name + '"]\'); el.value = ' + JSON.stringify(text) + '; el.dispatchEvent(new Event("input", { bubbles: true }));');
    const checkIt = () => press('#act-stage button[type=submit]');
    const nextQ = () => press('#act-stage [data-act="next"]');
    const progress = () => b.js('return document.querySelector("#act-stage #stage-h")?.textContent;');
    const stageText = () => b.js('return document.getElementById("act-stage").textContent;');
    // Speech is replaced by a recorder, so the test hears exactly what would be said (and nothing is spoken).
    const STUB_SPEECH = 'window.__spoken = []; speechSynthesis.speak = (u) => { __spoken.push([u.text, Math.round(u.rate * 10) / 10]); setTimeout(() => u.onend && u.onend(), 0); };';
    /** The right answer to a generated vocabulary question, worked out from the teacher's definitions. */
    const vocabAnswer = (p) => {
      let m = /^What does the word "(.+)" mean\?$/.exec(p); if (m) return DEF.get(m[1]);
      m = /^Which word means "(.+)"\?$/.exec(p); if (m) return [...DEF].find(([, d]) => d === m[1])[0];
      m = /^True or false\? "(.+)" means "(.+)"\.$/.exec(p); if (m) return DEF.get(m[1]) === m[2] ? 'True' : 'False';
      throw new Error('unknown prompt ' + p);
    };

    await check('Vocabulary Multiple Choice: one right answer per question, feedback, results and Practice My Misses', async () => {
      await b.load(url('#vocab?act=choice'));
      eq(await b.js('return document.querySelector("#app h1").textContent;'), 'Multiple Choice', 'title');
      const seen = new Set();
      for (let k = 0; k < W19.vocab.words.length; k++) {
        eq(await progress(), 'Question ' + (k + 1) + ' of 12', 'progress');
        const p = await qPrompt();
        const right = vocabAnswer(p);
        const opts = await optionTexts();
        eq([opts.length, opts.filter((o) => o === right).length], [4, 1], p + ': four options, exactly one right');
        seen.add(p);
        if (k === 0) {
          await pickText(opts.find((o) => o !== right));
          await checkIt();
          expect((await actFb()).startsWith('Not yet'), 'a wrong choice says Not yet');
          eq(await b.js('return document.querySelector("#act-stage [data-act=next]").disabled;'), true, 'cannot go on before answering');
        }
        await pickText(right);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), 'right answer: ' + await actFb());
        await nextQ();
      }
      eq(seen.size, 12, 'every word asked once');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '11 out of 12 right on the first try', 'summary');
      eq(await b.js('return document.querySelectorAll(".review li").length;'), 1, 'one question to look at again');
      await b.hash('#vocab?act=misses');
      eq(await progress(), 'Question 1 of 1', 'Practice My Misses has the missed question');
      await pickText(vocabAnswer(await qPrompt()));
      await checkIt();
      await nextQ();
      await b.hash('#vocab');
      eq(await b.js('return document.querySelector(".menu-card.misses .count-badge");'), null, 'a miss answered right is removed');
    });
    await check('Vocabulary True or False: half true and half false, explanations after a wrong answer', async () => {
      await b.load(url('#vocab?act=truefalse'));
      const truth = [];
      for (let k = 0; k < 12; k++) {
        const right = vocabAnswer(await qPrompt());
        truth.push(right);
        if (k < 2) {
          await pickText(right === 'True' ? 'False' : 'True');
          await checkIt();
          const said = await actFb();
          expect(said.includes(right === 'True' ? 'It is true.' : 'It is false.') && said.includes('means:'), 'explanation: ' + said);
        }
        await pickText(right);
        await checkIt();
        await nextQ();
      }
      eq([truth.filter((t) => t === 'True').length, truth.filter((t) => t === 'False').length], [6, 6], 'balanced');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '10 out of 12 right on the first try', 'summary');
    });
    await check('Vocabulary Fill in the Blank: capitals and spaces are ignored, the word bank fills the box, no spell-check', async () => {
      await b.load(url('#vocab?act=fill'));
      eq(await b.js('const i = document.querySelector("#act-stage input[name=text]"); return [i.spellcheck, i.getAttribute("autocorrect"), i.labels[0].textContent];'),
        [false, 'off', 'Type the missing word'], 'answer box');
      for (let k = 0; k < 12; k++) {
        const p = await qPrompt();
        const w = W19.vocab.words.find((x) => x.fill === p);
        expect(w, 'sentence is one of the week\'s: ' + p);
        expect(!p.toLowerCase().includes(w.word.toLowerCase()), 'the sentence does not show its answer');
        if (k === 0) { await typeIn('melancoly'); await checkIt(); expect((await actFb()).startsWith('Not yet'), 'a wrong word'); }
        if (k === 1) await b.js('[...document.querySelectorAll("#act-stage .bank-word")].find((x) => x.dataset.word === ' + JSON.stringify(w.word.toLowerCase()) + ').click();');
        else await typeIn('  ' + w.word.toUpperCase() + ' ');
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), w.word + ': ' + await actFb());
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '11 out of 12 right on the first try', 'summary');
    });
    const { lettersItem, spellItem } = await import('../js/lib/activities.js');
    await check('Spelling Missing Letters: the word is never shown, wrong letters are marked, right letters are accepted', async () => {
      await b.load(url('#spelling?act=letters'));
      for (let k = 0; k < 15; k++) {
        const id = await formId();
        const w = W19.spelling.words[Number(id.slice(3)) - 1];
        const item = lettersItem(w, W19.spelling);
        expect(!(await stageText()).includes(w.word), w.word + ' is not shown before it is answered');
        eq(await b.js('return document.querySelectorAll("#act-stage img").length;'), 0, 'no picture (it would show the word)');
        const sol = solution(item);
        if (k === 0) {
          await answer(item, Object.fromEntries(Object.keys(sol).map((n) => [n, 'x'])));
          await checkIt();
          eq(await b.js('return document.querySelectorAll("#act-stage input[aria-invalid=true]").length;'), Object.keys(sol).length, 'wrong letters marked');
        }
        await answer(item, Object.fromEntries(Object.entries(sol).map(([n, v]) => [n, v.toUpperCase()])));
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), w.word + ': ' + await actFb());
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '14 out of 15 right on the first try', 'summary');
    });
    await check('Spelling Hear and Spell: says the word, the sentence and the word again; replay; typed answers checked', async () => {
      await b.load(url('#spelling?act=listen'));
      await b.js(STUB_SPEECH);
      eq(await b.js('return [document.querySelector(".dictate").hidden, document.querySelector(".dictate-fallback").hidden];'), [false, true], 'sound buttons shown');
      const id = await formId();
      const w = W19.spelling.words[Number(id.slice(3)) - 1];
      expect(!(await stageText()).includes(w.word), 'the word is not on the screen');
      await b.js('document.querySelector("[data-act=dictate]").click();');
      await b.js('document.querySelector("[data-act=say-word]").click();');
      eq(await b.js('return __spoken;'), [[w.word, 0.8], [w.sentence, 0.8], [w.word, 0.8], [w.word, 0.8]], 'spoken');
      await typeIn(w.word.slice(0, -1) + 'x');
      await checkIt();
      expect((await actFb()).startsWith('Not yet'), 'a misspelling is caught');
      await typeIn(' ' + w.word[0].toUpperCase() + w.word.slice(1) + ' ');
      await checkIt();
      expect((await actFb()).startsWith('Yes!'), 'right spelling accepted');
    });
    await check('Spelling Hear and Spell without sound: a written clue appears instead, and a sound failure shows it too', async () => {
      await b.load(url('#spelling?act=listen'));
      await b.js('speechSynthesis.speak = (u) => setTimeout(() => u.onerror && u.onerror({ error: "synthesis-failed" }), 0);');
      await b.js('document.querySelector("[data-act=dictate]").click();');
      await b.waitFor('!document.querySelector(".dictate-fallback").hidden');
      await b.waitFor('document.getElementById("live").textContent.includes("Sound is not working")');
      await b.js('Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });');
      await b.hash('#spelling');
      await b.hash('#spelling?act=listen');
      const r = await b.js('return [document.querySelector(".dictate").hidden, document.querySelector(".dictate-fallback").hidden, document.querySelector(".dictate-fallback").textContent, document.querySelector("#act-stage form").dataset.item];');
      eq([r[0], r[1]], [true, false], 'clue shown instead of sound buttons');
      const w = W19.spelling.words[Number(r[3].slice(3)) - 1].word;
      expect(!r[2].includes(w) && !new RegExp('\\b' + SP.get(w).base + '\\b').test(r[2]) && r[2].includes('grown-up'), 'the clue gives the sentence, never the word or its base word: ' + r[2]);
      await b.load(url('#spelling?act=listen'));
      await b.js('document.querySelector("[data-act=no-sound]").click();');
      eq(await b.js('return [document.querySelector(".dictate-fallback").hidden, document.activeElement.className];'), [false, 'dictate-fallback'], '"I can\'t hear it" shows the clue and moves focus to it');
      await press('#act-stage [data-act="next"]:not([disabled]), #act-stage button[type=submit]');
      eq(await b.js('return document.querySelector(".dictate-fallback").hidden;'), false, 'the clue stays for the rest of the activity');
    });
    await check('Spelling Flashcards: flip, next, shuffle and marks (a word to practise goes to Practice My Misses)', async () => {
      await b.load(url('#spelling'));
      await go('.menu-card[href="#spelling?act=flash"]');
      const w0 = W19.spelling.words[0];
      // Front: base word + ending and the sentence with a blank; never the word itself (not even in the page source).
      eq(await b.js('return [document.querySelector(".flashcard").tagName, document.querySelector(".flash-clue").textContent, document.querySelectorAll(".flashcard img, .flashcard .flash-word").length];'),
        ['BUTTON', 'Which word fits?', 0], 'front: a clue, no picture and no word');
      expect(!new RegExp('\\b' + w0.base + '\\b', 'i').test(await b.js('return document.querySelector(".flashcard").textContent + document.querySelector(".flashcard").getAttribute("aria-label");')), 'the front does not name the base word either');
      expect(!(await b.js('return document.getElementById("act-stage").innerHTML;')).includes(w0.word), 'the front never contains the word');
      // A real click on the card turns it over, and focus stays on the card.
      let before = await rendered();
      await b.clickAt('.flashcard');
      await afterAction(before);
      eq(await b.js('return [document.querySelector(".flash-word").textContent, document.querySelectorAll(".flashcard img").length, document.querySelector(".flashcard .sentence").textContent, document.activeElement.classList.contains("flashcard")];'),
        [w0.word, 1, w0.sentence, true], 'back: word, picture and sentence; focus on the card');
      eq(await b.js('return document.querySelector(".flashcard").getAttribute("aria-label").split(". ")[0];'), 'Back of the card: ' + w0.word, 'the focused card is named by its new side (no second announcement)');
      // Enter and Space turn it over again.
      before = await rendered();
      await b.key('Enter');
      await afterAction(before);
      eq(await b.js('return document.querySelectorAll(".flashcard .flash-clue").length;'), 1, 'Enter: front again');
      before = await rendered();
      await b.key(' ');
      await afterAction(before);
      eq(await b.js('return document.querySelectorAll(".flashcard .flash-word").length;'), 1, 'Space: back again');
      await press('.flip-btn');
      eq(await b.js('return [document.querySelectorAll(".flashcard .flash-clue").length, document.activeElement.textContent];'), [1, 'Flip Card'], 'the Flip Card button works too');
      before = await rendered();
      await b.key('Enter');
      await afterAction(before);
      eq(await b.js('return [document.querySelectorAll(".flashcard .flash-word").length, document.activeElement.textContent];'), [1, 'Flip Card'], 'Enter on Flip Card turns the card over');
      before = await rendered();
      await b.key(' ');
      await afterAction(before);
      eq(await b.js('return document.querySelectorAll(".flashcard .flash-clue").length;'), 1, 'Space on Flip Card turns it back');
      expect(await b.js('const x = document.querySelector(".flip-btn"); const s = getComputedStyle(x); return s.color !== s.backgroundColor;'), 'the button text is readable');
      await press('[data-act="card-next"]');
      eq(await progress(), 'Card 2 of 15', 'next card');
      eq(await b.js('return document.querySelectorAll("[data-mark]").length;'), 0, 'marks wait until the card is turned over');
      await press('.flip-btn');
      await press('[data-mark="again"]');
      eq(await b.js('return document.querySelector(".tally").textContent.includes("To practice: 1");'), true, 'tally');
      await press('[data-act="shuffle"]');
      eq([await progress(), await b.js('return document.querySelector("[data-act=card-prev]").disabled;')], ['Card 1 of 15', true], 'shuffled, back to card 1');
      await b.js('document.querySelector(".bar-btns a.back").click();');
      await b.waitFor('location.hash === "#spelling" && !!document.querySelector(".menu-card")');
      await b.hash('#spelling?act=misses');
      expect(await b.js('return [...document.querySelectorAll("#act-stage form")].length === 1;'), 'Practice My Misses runs');
    });
    await check('Practice My Misses always matches the menu: opened empty, or left half done, it picks up new misses', async () => {
      await b.load(url('#vocab?act=misses'));
      eq(await progress(), 'Nothing to practice yet', 'empty at first');
      const missOne = async () => {
        const right = vocabAnswer(await qPrompt());
        await pickText(right === 'True' ? 'False' : 'True');
        await checkIt();
        await pickText(right);
        await checkIt();
        await nextQ();
      };
      await b.hash('#vocab?act=truefalse');
      await missOne();
      await b.hash('#vocab');
      eq(await b.js('return document.querySelector(".menu-card.misses .count-badge").textContent;'), '1 to practice', 'the menu counts 1 miss');
      await b.hash('#vocab?act=misses');
      eq(await progress(), 'Question 1 of 1', 'the miss is there');
      await pickText(vocabAnswer(await qPrompt()) === 'True' ? 'False' : 'True');
      await checkIt();
      await b.hash('#vocab?act=truefalse');
      await missOne();
      await b.hash('#vocab?act=misses');
      eq(await progress(), 'Question 1 of 2', 'the new miss joins the run in progress');
    });
    await check('every subject opens on its menu, and every choice has Back to the menu and Home', async () => {
      const MENUS = {
        spelling: ['Learn My Words', 'Flashcards', 'Missing Letters', 'Listen & Spell', 'Practice My Misses'],
        vocab: ['Learn My Words', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses'],
        math: ['Learn the Properties', 'Practice Problems', 'Math Lessons', 'Study Guide'],
      };
      const NAME = { spelling: 'Spelling', vocab: 'Vocabulary', math: 'Math' };
      for (const [subject, labels] of Object.entries(MENUS)) {
        await b.load(url('#week'));
        await b.js(`document.querySelector('nav.tabs a[data-tab="${subject}"]').click();`);
        await b.waitFor(`location.hash === "#${subject}" && document.querySelector("#app h1")?.textContent === ${JSON.stringify(NAME[subject])}`);
        eq(await b.js('return [document.querySelector(".ask").textContent, [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.firstChild.textContent.trim())];'),
          ['What would you like to do?', labels], subject + ' menu');
        // The choices are on the first screen, even on a small laptop (no scrolling to find them).
        expect(await b.js('return document.querySelector(".menu-card").getBoundingClientRect().bottom < innerHeight;'), subject + ': first choice visible without scrolling');
        await b.viewport(1366, 768, false);
        expect(await b.js('return [...document.querySelectorAll(".menu-card")].every((c) => c.getBoundingClientRect().bottom <= innerHeight);'), subject + ': every choice on the first screen at 1366 x 768');
        await b.viewport(1366, 900, false);
        expect(!(await b.js('return !!document.querySelector(".words, .vocab-card, .property, .study-card");')), subject + ': no long content on the menu');
        const hrefs = await b.js('return [...document.querySelectorAll(".menu-card")].map((a) => a.getAttribute("href"));');
        for (const [k, href] of hrefs.entries()) {
          await b.hash(href);
          eq(await b.js('return document.querySelector("#app h1").textContent;'), labels[k], href + ' title');
          eq(await b.js('return [...document.querySelectorAll(".crumbs li")].map((l) => l.textContent.trim());'), ['Home', NAME[subject], labels[k]], href + ' crumbs');
          eq(await b.js('return [...document.querySelectorAll(".bar-btns a")].map((a) => [a.textContent.trim(), a.getAttribute("href")]);'),
            [[`‹ Back to ${NAME[subject]}`, `#${subject}`], ['Home', '#week']], href + ' Back and Home');
        }
      }
      await b.js('document.querySelector(".bar-btns a.home").click();');
      await b.waitFor('document.querySelector("#app h1")?.textContent === "This Week" && location.hash === "#week"');
      // Browser Back returns to the menu, then Forward to Home again.
      let before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('history.back();');
      await b.ready(before);
      eq(await b.js('return location.hash;'), '#math?act=guide', 'browser Back');
      before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('history.forward();');
      await b.ready(before);
      eq(await b.js('return location.hash;'), '#week', 'browser Forward');
    });
    await check('Math > Practice Problems > Match the Split Array: from the menu, right and wrong answers, hint, Show me how, results, misses', async () => {
      const PRACTICE = readJSON('data/practice/math.json');
      const ITEM = new Map(Object.values(PRACTICE.sets).flat().map((it) => [it.id, it]));
      await b.load(url('#math'));
      await go('.menu-card[href="#math?act=practice"]');
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.firstChild.textContent.trim());'),
        ['Identify the Property', 'Match the Split Array', 'Break Apart a Factor', 'Mixed Practice', 'Practice My Misses'], 'kinds of problems');
      await go('.menu-card[href="#math?act=split"]');
      eq(await b.js('return [...document.querySelectorAll(".crumbs li")].map((l) => l.textContent.trim());'), ['Home', 'Math', 'Practice Problems', 'Match the Split Array'], 'crumbs');
      eq(await b.js('return [...document.querySelectorAll(".bar-btns a")].map((a) => a.getAttribute("href"));'), ['#math?act=practice', '#math', '#week'], 'Back to Practice Problems, Back to Math, Home');
      for (let k = 0; k < PRACTICE.sets.split.length; k++) {
        eq(await progress(), `Question ${k + 1} of ${PRACTICE.sets.split.length}`, 'progress');
        const item = ITEM.get(await formId());
        // The picture on the screen is the picture of the answer key: count its two parts.
        const [a, bb] = await b.js('return [document.querySelectorAll("#act-stage .m-dot.m-a").length, document.querySelectorAll("#act-stage .m-dot.m-b").length];');
        const right = item.options.find((o) => o.correct).text;
        const [p, q, r, s] = right.match(/\d+/g).map(Number);
        eq([a, bb], [p * q, r * s], item.id + ': the picture matches ' + right);
        if (k === 1) {
          await pickText(item.options.find((o) => !o.correct).text);
          await checkIt();
          expect((await actFb()).startsWith('Not yet'), 'a wrong choice');
          await press('#act-stage [data-act="hint"]');
          expect(await b.js('return !!document.querySelector("#act-stage .hints li");'), 'a hint');
          await pickText(item.options.filter((o) => !o.correct)[1].text);
          await checkIt();
          await press('#act-stage [data-act="show"]');
          expect((await b.js('return document.querySelector("#act-stage .showme").textContent;')).includes(right), 'Show me how ends with the answer');
        } else {
          await pickText(right);
          await checkIt();
          expect((await actFb()).startsWith('Yes!'), item.id + ': ' + await actFb());
        }
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '9 out of 10 right on the first try', 'summary');
      eq(await b.js('return [...document.querySelectorAll(".end-nav a, .end-nav button")].map((x) => x.textContent.trim());'),
        ['Try again', 'Practice My Misses', 'Home', 'Choose another activity'], 'what next');
      await go('.end-nav a[href="#math?act=misses"]');
      eq(await progress(), 'Question 1 of 1', 'the missed problem');
      await b.hash('#math?act=practice');
      eq(await b.js('return document.querySelector(".menu-card.misses .count-badge").textContent;'), '1 to practice', 'misses counted on the menu');
    });
    await check('phones: the week picker is hidden only inside activities, tests and lessons; Home shows its icon and the word', async () => {
      await b.viewport(390, 844, true);
      const shown = () => b.js('return getComputedStyle(document.querySelector(".weekpick")).display !== "none";');
      for (const h of ['#week', '#spelling', '#math', '#math?act=practice', '#spelling?act=learn', '#tests']) {
        await b.load(url(h));
        expect(await shown(), h + ': week picker shown');
      }
      for (const h of ['#spelling?act=flash', '#math?act=split', '#tests?test=spelling', '#math?lesson=5-1&stage=together']) {
        await b.load(url(h + '&week=2026-10-12'.replace(/^&/, h.includes('?') ? '&' : '?')));
        expect(!(await shown()), h + ': week picker hidden');
        eq(await b.js('const a = document.querySelector(".bar-btns a.home"); return [a.textContent.trim(), getComputedStyle(a.querySelector("span")).display !== "none", !!a.querySelector("svg"), a.getAttribute("href")];'),
          ['Home', true, true, '#week?week=2026-10-12'], h + ': Home with icon and word, keeping the week');
      }
      await b.viewport(1366, 900, false);
    });
    await check('Math > Math Lessons: both lessons with every step; a lesson has Back to Lessons, Back to Math and Home', async () => {
      await b.load(url('#math'));
      await go('.menu-card[href="#math?act=lessons"]');
      eq(await b.js('return [...document.querySelectorAll(".lesson-card")].map((c) => [...c.querySelectorAll(".stage-links a")].map((a) => a.textContent.trim().replace(/\\s+/g, " ")));').then((x) => x.map((l) => l.length)), [5, 5], 'five steps each');
      await go('.stage-links a[href="#math?lesson=5-1&stage=together"]');
      eq(await b.js('return [document.getElementById("stage-h").textContent, [...document.querySelectorAll(".bar-btns a")].map((a) => [a.textContent.trim(), a.getAttribute("href")])];'),
        ['Practice Together', [['‹ Back to Lessons', '#math?act=lessons'], ['Back to Math', '#math'], ['Home', '#week']]], 'Practice Together, with Back and Home');
      await b.js('document.querySelector(".bar-btns a.back").click();');
      await b.waitFor('location.hash === "#math?act=lessons"');
    });
    await check('leaving an unfinished test asks first; the answers are kept', async () => {
      await b.load(url('#tests'));
      await go('a.btn[href="#tests?test=vocab"]');
      // Nothing answered yet: Home just goes home.
      await b.js('document.querySelector(".bar-btns a.home").click();');
      await b.waitFor('location.hash === "#week"');
      await b.hash('#tests?test=vocab');
      const first = T19.vocab.items[0];
      await answer(first, solution(first));
      await b.js('document.querySelector(".skip").click();');
      eq(await b.js('return [!!document.getElementById("leave-dialog"), location.hash];'), [false, "#tests?test=vocab"], "Skip to main content is not leaving");
      await b.js('document.querySelector(".bar-btns a.home").click();');
      eq(await b.js('const d = document.getElementById("leave-dialog"); return [!!d?.open, document.activeElement.textContent, location.hash];'), [true, 'Keep working', '#tests?test=vocab'], 'asks first');
      await b.js('document.querySelector("[data-choice=stay]").click();');
      eq(await b.js('return [!!document.getElementById("leave-dialog"), location.hash];'), [false, '#tests?test=vocab'], 'Keep working stays');
      await b.js('document.querySelector("nav.tabs a[data-tab=math]").click();');
      await b.js('document.querySelector("[data-choice=go]").click();');
      await b.waitFor('location.hash === "#math"');
      await b.hash('#tests?test=vocab');
      eq(await b.js('return document.querySelector("#act-stage input[name=choice]:checked")?.value;'), String(solution(first).choice), 'the answer is kept');
    });
    await check('Test Center: three practice tests this week; an earlier week shows only the tests that exist', async () => {
      await b.viewport(1366, 768, false);
      await b.load(url('#week'));
      await go('nav.tabs a[data-tab=tests]');
      expect(await b.js('return [...document.querySelectorAll(".test-card a.btn")].every((a) => a.getBoundingClientRect().bottom <= innerHeight);'), 'every Start test button is on the first screen at 1366 x 768');
      await b.viewport(1366, 900, false);
      await b.load(url('#tests'));
      eq(await b.js('return [...document.querySelectorAll(".test-card")].map((c) => [c.querySelector("h3").textContent, c.querySelector(".facts div:last-child dd")?.textContent, !!c.querySelector("a.btn")]);'),
        [['Math Practice Test', '20', true], ['Spelling Practice Test', '15', true], ['Vocabulary Practice Test', '16', true]], 'cards');
      expect((await b.js('return document.querySelector(".test-vocab").textContent;')).includes('purple words'), 'vocabulary coverage names the missing purple words');
      await b.hash('#tests?week=2026-10-12');
      eq(await b.js('return [...document.querySelectorAll(".test-card")].map((c) => [!!c.querySelector("a.btn"), !!c.querySelector(".unavailable")]);'),
        [[false, true], [true, false], [false, true]], 'Oct 12: only the spelling test can start');
      await b.hash('#tests?week=2026-10-12&test=math');
      eq(await b.js('return location.hash;'), '#tests?week=2026-10-12', 'a test that does not exist goes back to the Test Center');
    });
    await check('Math practice test: no hints or answers, answers kept when moving around, unanswered warning, score, review, restart', async () => {
      await b.load(url('#tests?test=math'));
      const items = T19.math.items;
      for (const [k, item] of items.entries()) {
        eq(await b.js('return [...document.querySelectorAll("#act-stage [data-act=hint], #act-stage [data-act=show], #act-stage button[type=submit], #act-stage .feedback")].length;'), 0, 'no help or feedback on ' + item.id);
        if (item.id === 'm2') await answer(item, { answer: 6 });
        else if (item.id !== 'm17') await answer(item, solution(item));
        if (k === 0) {
          await press('[data-act="next"]');
          await press('[data-act="back"]');
          eq(await b.js('return document.querySelector("#act-stage input[name=choice]:checked")?.value;'), String(solution(item).choice), 'answer kept after Back');
        }
        if (k < items.length - 1) await press('[data-act="next"]');
      }
      await b.js('document.querySelector("[data-act=submit]").click();');
      await b.waitFor('document.getElementById("live").textContent.includes("no answer")');
      eq(await b.js('return [document.querySelector("[data-act=submit]").textContent, document.activeElement.id, [...document.querySelectorAll("[data-act=goto]")].map((x) => [x.textContent, x.getAttribute("aria-label")])];'),
        ['Finish anyway', 'test-warning', [['17', 'Go to question 17']]], 'unanswered warning');
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '18 out of 20', 'score');
      expect(await b.js('return document.body.textContent.includes("You passed!");'), '16 or more passes');
      eq(await b.js('return [...document.querySelectorAll(".review li")].map((l) => [l.querySelector(".qnum").textContent, l.querySelector(".you").textContent, l.querySelector(".right").textContent]);'),
        [['Question 2', 'Your answer: 6', 'Correct answer: 0'], ['Question 17', 'Your answer: No answer', 'Correct answer: 7 × 7 = 5 × 7 + 2 × 7 = 49']], 'review');
      eq(await b.js('return [...document.querySelectorAll(".skills tr")].map((r) => r.lastElementChild.textContent);'), ['4 of 4', '2 of 3', '7 of 7', '5 of 6'], 'score per skill');
      expect(await b.js('return !!document.querySelector("[data-act=print]") && !!document.querySelector(".stage-nav a[href=\'#math\']") && !!document.querySelector(".stage-nav a[href=\'#tests\']");'), 'print, practise and Back to Tests');
      await press('[data-act="restart"]');
      eq([await progress(), await b.js('return document.querySelectorAll("#act-stage input:checked").length;')], ['Question 1 of 20', 0], 'a fresh test');
    });
    await check('Spelling practice test: every word exactly once, read aloud, never shown, typed answers scored', async () => {
      await b.load(url('#tests?test=spelling'));
      await b.js(STUB_SPEECH);
      const asked = [];
      for (let k = 0; k < 15; k++) {
        eq(await formId(), 'q' + (k + 1), 'test question ids are positions');
        await b.js('document.querySelector("[data-act=dictate]").click();');
        const w = await b.js('return __spoken[__spoken.length - 1][0];');
        expect(!(await b.js('return document.getElementById("app").innerHTML;')).includes(w), w + ' is not even in the page source');
        asked.push(w);
        expect(!(await b.js('return document.getElementById("app").textContent;')).includes(w), w + ' is never on the screen');
        eq(await b.js('return [document.querySelectorAll("#app img").length, document.querySelectorAll("#act-stage [data-act=hint], #act-stage .feedback").length];'), [0, 0], 'no picture, hint or feedback');
        await typeIn(k === 3 ? w.toUpperCase() : k === 5 ? w + '.' : w);
        if (k < 14) await press('[data-act="next"]');
      }
      eq([...asked].sort(), [...SP.keys()].sort(), 'all 15 words, each once');
      eq(await b.js('return __spoken.length;'), 45, 'word, sentence, word for each');
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '15 out of 15', 'score');
    });
    await check('Vocabulary practice test: all 12 words covered, scored without hints, and refreshing starts again', async () => {
      await b.load(url('#tests?test=vocab'));
      const items = T19.vocab.items;
      for (const [k, item] of items.entries()) {
        await answer(item, item.type === 'word' ? { text: item.answer } : solution(item));
        if (k < items.length - 1) await press('[data-act="next"]');
      }
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '16 out of 16', 'score');
      await b.load(url('#tests?test=vocab'));
      eq([await progress(), await b.js('return document.querySelectorAll("#act-stage input:checked").length;')], ['Question 1 of 16', 0], 'refresh starts again');
    });
    await check('weeks never mix: changing the week leaves the activity, and homework shows only that week\'s work', async () => {
      await b.load(url('#vocab?act=choice'));
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-12"; s.dispatchEvent(new Event("change"));');
      await b.waitFor('location.hash === "#vocab?week=2026-10-12" && document.querySelector("#app h1")?.textContent === "Vocabulary"');
      await b.hash('#homework?week=2026-10-12');
      eq(await b.js('return [...document.querySelectorAll(".hw-received strong")].map((s) => s.textContent);'),
        ['Distributive Property worksheet', 'Multiplying multiples of 10 worksheet'], 'Oct 12 received work');
      await b.hash('#homework');
      eq(await b.js('return [document.querySelectorAll(".hw-received").length, document.querySelector(".page-head .intro").textContent];'),
        [0, 'No classroom worksheets have been received for this week yet.'], 'Oct 19 has none received');
    });

    await check('contrast and touch targets also hold after feedback, on a flipped and marked card, with the unanswered warning and on results', async () => {
      const states = [
        ['#vocab?act=truefalse', async () => { await pickText('True'); await checkIt(); }],
        ['#vocab?act=fill', async () => { await typeIn('x'); await checkIt(); await press('[data-act="hint"]'); }],
        ['#spelling?act=letters', async () => { await b.js('document.querySelectorAll("#act-stage input.letter").forEach((el) => { el.value = "x"; }); document.querySelector("#act-stage form").dispatchEvent(new Event("input", { bubbles: true }));'); await checkIt(); }],
        ['#spelling?act=flash', async () => { await press('[data-act="flip"]'); await press('[data-mark="known"]'); }],
        ['#tests?test=vocab', async () => { for (let k = 0; k < 15; k++) await press('[data-act="next"]'); await press('[data-act="submit"]'); }],
        ['#tests?test=math', async () => { for (let k = 0; k < 19; k++) await press('[data-act="next"]'); await press('[data-act="submit"]'); await press('[data-act="submit"]'); }],
      ];
      const problems = [];
      for (const [route, act] of states) {
        await b.load(url(route));
        await act();
        await helpers(b);
        for (const p of await b.js('return __t.contrastFailures();')) problems.push(route + ' ' + p);
        for (const p of await b.js('return [...document.querySelectorAll(".btn, .choice, .box, .bank-word, .read")].map((el) => [el, el.getBoundingClientRect()]).filter(([, r]) => (r.width || r.height) && (r.width < 44 || r.height < 44)).map(([el, r]) => (el.textContent.trim().slice(0, 20) || el.name) + " " + Math.round(r.width) + "x" + Math.round(r.height));')) problems.push(route + ' small: ' + p);
      }
      eq(problems, [], 'contrast and targets in these states');
    });
    await check('printed test results show the score and review, without buttons', async () => {
      await b.load(url('#tests?test=vocab'));
      for (let k = 0; k < 15; k++) await press('[data-act="next"]');
      await press('[data-act="submit"]');
      await press('[data-act="submit"]');
      await b.media('print');
      const r = await b.js('return [getComputedStyle(document.querySelector(".summary-score")).display, getComputedStyle(document.querySelector(".print-only")).display, [...document.querySelectorAll("#act-stage .btn")].every((x) => getComputedStyle(x).display === "none")];');
      await b.media('');
      eq(r, ['block', 'block', true], 'print');
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
      expect((await f.js('return document.querySelector(".page-head .intro").textContent;')).startsWith('Sample <b>book</b> title · '), 'title text');
      await f.hash('#vocab?act=learn');
      eq(await f.js('return [document.querySelector("#app b"), document.querySelector(".def").textContent];'),
        [null, 'a small part that shows what the whole is like <with symbols & "quotes">'], 'escaping');
    });
    await check('a week without math or pictures still works (missing pictures are hidden)', async () => {
      await f.wait(300);
      eq(await f.js('return document.querySelectorAll(".study-one .pic").length;'), 0, 'picture frames removed');
      await f.hash('#math?act=learn');
      eq(await f.js('return [document.querySelector("#act-stage h3").textContent, document.body.textContent.includes("Teacher\'s words")];'), ['Identity Property', false], 'properties without teacher words');
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
