// Browser tests: headless Chrome against the site served under /Study-Scoop/ (like GitHub Pages).
// Run: npm run test:browser   (SCREENSHOTS=1 also writes docs/screenshots/assignment-002/*.png)
//      npm run test:site      (builds _site, then runs every check against the published files only)
import fs from 'node:fs';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';
import { boxes, helpSteps, solution } from '../js/lib/lessons.js';
import { pictureName } from '../js/lib/data.js';
import { roundParts } from '../js/lib/rounding.js';

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/weeks.json');
const SECTIONS = [['week', 'This Week'], ['spelling', 'Spelling'], ['vocab', 'Vocabulary'], ['math', 'Math'],
  ['skills', 'Skill Builders'], ['homework', 'Homework'], ['newsletter', 'Newsletter'], ['tests', 'Tests']];
const VIEWPORTS = [[360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]];
const L51 = readJSON('data/lessons/5-1.json');
const L52 = readJSON('data/lessons/5-2.json');
const LESSON_STAGES = ['learn', 'watch', 'together', 'try', 'test', 'parent'];
const lessonHash = (id, stage) => `#math?lesson=${id}&stage=${stage}`;
const LESSON_ROUTES = readJSON('data/lessons/index.json').lessons.map((l) => l.id).flatMap((id) => LESSON_STAGES.map((s) => lessonHash(id, s)));
// Activities and practice tests (Assignment 005), plus an earlier week's homework and Test Center.
const ACTIVITY_ROUTES = ['#vocab?act=learn', '#spelling?act=learn', '#math?act=learn', '#math?act=practice', '#math?act=split', '#math?act=props', '#math?act=breakapart', '#math?act=mixed',
  '#math?act=lessons', '#math?act=guide', '#vocab?act=choice', '#vocab?act=truefalse', '#vocab?act=fill', '#vocab?act=misses',
  '#spelling?act=flash', '#spelling?act=letters', '#spelling?act=listen', '#spelling?act=misses',
  '#tests?test=math', '#tests?test=spelling', '#tests?test=vocab', '#tests?week=2026-10-12', '#homework?week=2026-10-12',
  '#math?act=words', '#math?act=wreview', '#math?act=wchoice', '#math?act=wtf', '#math?act=wfill', '#math?act=wmisses', '#tests?test=mathwords', '#tests',
  // Skill Builders (D22): every menu, Learn It page, practice set and test.
  ...['add', 'addlearn', 'addfacts', 'addsplit', 'addtest', 'round', 'roundlearn', 'roundten', 'roundhun', 'roundtest', 'times', 'timeslearn', 'timesall', 'timestricky', 'timestest'].map((a) => `#skills?act=${a}`)];
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
          // (The Associative Property has no teacher wording in the week file; it is labelled "Definition", not compared here.)
          const shown = await b.js('return [...document.querySelectorAll(".guide-prop")].filter((c) => c.querySelector(".label")?.textContent === "Teacher\'s words").map((c) => [c.querySelector("h4").textContent, c.querySelector(".def").textContent]);');
          eq([...shown].sort(), week.math.words.map((w) => [w.word, w.def]).sort(), 'cards');
          eq(await b.js('return document.querySelectorAll(".guide-prop").length;'), 5, 'all five properties');
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
      eq(await b.js('return [document.querySelector("#app h1").textContent, document.activeElement === document.querySelector("#app h1")];'), ['Spelling', true], 'after Enter: focus on the page heading');
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
    const fb = () => b.js('const e = document.querySelector("#lesson-stage .feedback:not(.info)"); if (!e) return ""; const c = e.cloneNode(true); c.querySelectorAll(".read").forEach((x) => x.remove()); return c.textContent.replace(/\\s+/g, " ").trim();');

    await check('Math > Learn the Properties: five cards, each picture matching its equation, with the teacher\'s words', async () => {
      await b.load(url('#math'));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent);'),
        ['Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide'], 'five choices first');
      await go('.menu-card[href="#math?act=learn"]');
      const W = readJSON('data/2026-10-19.json');
      const seen = [];
      for (let k = 0; k < 5; k++) {
        seen.push(await b.js(`const c = document.querySelector('#act-stage');
          return [c.querySelector('h3').textContent, c.querySelector('.def')?.textContent, c.querySelector('.kid-words')?.textContent.replace('In other words', '') ?? '',
            c.querySelector('.fact').textContent, c.querySelectorAll('.m-plate').length, c.querySelectorAll('circle.m-dot').length,
            [...c.querySelectorAll('.model-svg')].map((s) => s.querySelectorAll('.m-dot, .m-star').length),
            c.querySelectorAll('.prop-learn:not(.second-ex) .pic-card .m-dot.m-a').length, c.querySelectorAll('.prop-learn:not(.second-ex) .pic-card .m-dot.m-b').length,
            c.querySelectorAll('.second-ex .pic-card .m-dot.m-a').length, c.querySelectorAll('.second-ex .pic-card .m-dot.m-b').length,
            c.querySelector('.second-ex .fact')?.textContent];`));
        if (k < 4) await press('[data-act="card-next"]');
      }
      const def = (n) => W.math.words.find((w) => w.word.startsWith(n)).def;
      eq(seen.map((s) => s.slice(0, 4)), [
        ['Identity Property', def('Identity'), 'Any number multiplied by 1 stays the same.', '7 × 1 = 7'],
        ['Zero Property', def('Zero'), 'Any number multiplied by 0 equals 0.', '9 × 0 = 0'],
        ['Commutative Property', def('Commutative'), 'Changing the order of the factors does not change the product.', '4 × 2 = 2 × 4 = 8'],
        ['Associative Property', 'Changing the grouping of three or more factors does not change the product.', 'You can move the ( ) to multiply a different pair first. The answer stays the same.', '(2 × 3) × 4 = 2 × (3 × 4)'],
        ['Distributive Property', def('Distributive'), 'You can break apart a factor, multiply the smaller parts, and add their products.', '6 × 3 = (5 × 3) + (1 × 3)']], 'words and equations');
      eq([seen[0][4], seen[0][5]], [7, 7], 'identity: 7 groups of 1');
      eq([seen[1][4], seen[1][5]], [9, 0], 'zero: 9 empty groups');
      eq(seen[2][6], [8, 8], 'commutative: 4 rows of 2 and 2 rows of 4');
      eq(seen[3][6], [24, 24], 'associative: (2 × 3) × 4 as 6 rows of 4, and 2 × (3 × 4) as 2 rows of 12');
      eq([seen[4][7], seen[4][8]], [15, 3], "distributive leads with the teacher's example: 5 rows of 3 and 1 row of 3");
      eq([seen[4][9], seen[4][10], seen[4][11]], [21, 21, '6 × 7 = (3 × 7) + (3 × 7)'], 'second example: 3 rows of 7 and 3 rows of 7');
      eq(seen[0][9] + seen[1][9] + seen[2][9] + seen[3][9], 0, 'only the Distributive card has a second example');
      eq(await b.js('return document.querySelector(".stage-nav .btn-primary").getAttribute("href");'), '#math?act=practice', 'then Practice Problems');
      await press('[data-act="card-prev"]');
      eq(await b.js('return document.getElementById("stage-h").textContent;'), 'Property 4 of 5', 'Previous Property');
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
      eq(await fb(), 'Not yet 5 + 3 is 8. Count the dots: 5 rows of 3. Press Help to see one step at a time.', 'specific feedback for 8');
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
      eq(await b.js('return !!document.querySelector("[data-act=help]");'), false, 'no Help after empty tries');
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
        eq(await fb(), `Not yet ${ex.why.options[wrong].why} Press Help to see one step at a time.`, 'why feedback');
        await solve(ex.why);
        expect((await fb()).startsWith('Yes!'), 'why answered');
        if (k < L51.watch.examples.length - 1) await press('[data-act="next"]');
      }
      eq(await b.js('return document.querySelector(".takeaway")?.textContent;'), L51.watch.takeaway, 'takeaway');
      eq(await b.js('return document.querySelector(".stage-nav a.btn-primary").getAttribute("href");'), lessonHash('5-1', 'together'), 'on to Practice Together');
    });
    await check('Practice Together: why-wrong feedback, Help one step at a time after a miss, 3-in-a-row, own cut', async () => {
      await b.load(url(lessonHash('5-1', 'together')));
      const [g1, ...rest] = L51.together.items;
      const steps = helpSteps(g1);
      expect(!(await b.js('return !!document.querySelector("[data-act=help], [data-act=hint], [data-act=show]");')), 'no Help before an answer');
      await answer(g1, { t: 20 }); await checkAnswer(g1);
      eq(await fb(), 'Not yet You found the first part! Now add the second part. Press Help to see one step at a time.', 'stopped at the first part');
      eq(await b.js('return document.querySelector("[data-act=help]").textContent.trim();'), 'Help', 'Help after one miss');
      await press('[data-act="help"]');
      eq(await b.js('return [...document.querySelectorAll(".help-steps li")].map((l) => l.textContent);'), [steps[0].text], 'one step at a time');
      eq(await b.js('return document.querySelector("[data-act=help]").textContent.trim();'), 'Next step', 'Next step');
      // The step just opened is on the screen, highlighted, and keyboard focus stays on Next step.
      eq(await b.js('const li = document.querySelector(".help-steps li:last-child"); const r = li.getBoundingClientRect(); return [r.top >= 0 && r.bottom <= innerHeight, li.className, document.activeElement?.dataset.act];'),
        [true, 'is-new', 'help'], 'new step visible, highlighted, focus on Next step');
      expect(!(await b.js('return document.body.textContent.includes("Press Help to see one step at a time");')), 'the press-Help reminder goes once Help is open');
      await b.waitFor(`document.querySelector('#live').textContent.startsWith('Step 1 of ${steps.length}. ')`);
      await press('[data-act="help"]');
      eq(await b.js('return [...document.querySelectorAll(".help-steps li")].length;'), 2, 'two steps open');
      eq(await b.js('return document.querySelector("input[name=t]").value;'), '20', 'Help does not fill in the answer early');
      await answer(g1, { t: 11 }); await checkAnswer(g1);
      eq(await fb(), 'Not yet 7 × 4 means 7 groups of 4, not 7 + 4. Add the two products.', 'added the factors');
      for (let k = 2; k < steps.length; k++) await press('[data-act="help"]');
      eq(await b.js('return [document.querySelector("input[name=t]").value, [...document.querySelectorAll(".help-steps li")].length, document.querySelector("[data-act=next]").disabled, !!document.querySelector("[data-act=help]")];'),
        ['28', steps.length, false, false], 'the last Help step fills in the answer and explains');
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
    await check('Try It Yourself: Help after a miss; results count first tries and list what to look at again', async () => {
      await b.load(url(lessonHash('5-1', 'try')));
      const [t1, ...rest] = L51.try.items;
      const wrong = t1.options.filter((o) => !o.correct).map((o) => t1.options.indexOf(o));
      expect(!(await b.js('return !!document.querySelector("[data-act=help]");')), 'no Help before trying');
      await answer(t1, { choice: wrong[0] }); await checkAnswer(t1);
      expect((await fb()).includes(t1.options[wrong[0]].why), 'the wrong choice is explained');
      expect(await b.js('return !!document.querySelector("[data-act=help]") && !document.querySelector("[data-act=hint], [data-act=show]");'), 'Help (and no old buttons) after one miss');
      for (let k = 0; k < helpSteps(t1).length; k++) await press('[data-act="help"]');
      await press('[data-act="next"]');
      for (const item of rest) { await solve(item); expect((await fb()).startsWith('Yes!'), item.id); await press('[data-act="next"]'); }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'score');
      eq(await b.js('return document.querySelector(".score-facts").textContent.replace(/\\s+/g, " ").trim();'), 'Answered: 20 of 20 · Missed: 1', 'answered and missed');
      expect(await b.js('return document.body.textContent.includes("You are ready for the test.");'), 'pass message at 19 of 20');
      eq(await b.js('return [...document.querySelectorAll(".review li .right")].map((e) => e.textContent);'),
        [`Correct answer: ${t1.options.find((o) => o.correct).text}`], 'missed list');
      expect(await b.js('return document.querySelector(".review li .explain")?.textContent.includes("6 × 4 = 24");'), 'the missed question is explained');
    });
    await check('Test: no hints or feedback, a warning for unanswered questions, a correct score and review', async () => {
      await b.load(url(lessonHash('5-1', 'test')));
      const items = L51.test.items;
      for (const [k, item] of items.entries()) {
        eq(await b.js('return [...document.querySelectorAll("#lesson-stage [data-act=help], #lesson-stage [data-act=hint], #lesson-stage [data-act=show], #lesson-stage button[type=submit]")].length;'), 0, `no help on ${item.id}`);
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
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '6 out of 8 right (75%)', 'score');
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
      eq(await fb(), "Not yet That's only double 8. Add 8 once more. Press Help to see one step at a time.", 'forgot once more');
      await answer(g[4], { answer: 9 }); await checkAnswer(g[4]);
      eq(await fb(), `Not yet 9 is too small. ${g[4].hints?.[0] || L52.catchAll}`, 'anything else says why it is wrong, then a first hint');
      await b.load(url(lessonHash('5-2', 'test')));
      for (const [k, item] of L52.test.items.entries()) { await answer(item, solution(item)); if (k < L52.test.items.length - 1) await press('[data-act="next"]'); }
      await press('[data-act="submit"]');
      eq(await b.js('return [document.querySelector(".summary-score").textContent, document.body.textContent.includes("You passed!")];'), ['8 out of 8 right (100%)', true], 'perfect score');
    });
    await check('the tricycle table checks every row', async () => {
      await b.load(url(lessonHash('5-2', 'try')));
      const items = L52.try.items;
      const at = items.findIndex((it) => it.type === 'table');
      for (const item of items.slice(0, at)) { await solve(item); await press('[data-act="next"]'); }
      const table = items[at];
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

    console.log('Unit 5: seven lessons, Math Vocabulary, results and misses (D20)');
    const MW = readJSON('data/practice/math-words.json');
    const LESSON_INDEX = readJSON('data/lessons/index.json').lessons;
    /** A wrong answer for a question: another choice, or the last box one more than its right value. */
    const wrongFor = (item) => {
      const sol = solution(item);
      if (item.type === 'choice') return { choice: item.options.findIndex((o) => !o.correct) };
      const names = boxes(item);
      const last = names[names.length - 1];
      return { ...sol, [last]: Number(sol[last]) + 1 };
    };
    const stageTitle = () => b.js('return document.getElementById("stage-h")?.textContent.trim() || "";');
    const formItem = () => b.js('return document.querySelector("form[data-item]")?.dataset.item || "";');

    await check('Math > Math Lessons: seven open lessons, each card names its strategy, Start opens Learn It', async () => {
      await b.load(url('#math'));
      await go('.menu-card[href="#math?act=lessons"]');
      eq(await b.js('return document.querySelector("#app h1").textContent;'), 'Math Lessons', 'h1');
      eq(await b.js('return [...document.querySelectorAll(".lesson-card .lesson-num")].map((n) => n.textContent);'), LESSON_INDEX.map((l) => l.id), 'seven lessons in order');
      eq(await b.js('return [...document.querySelectorAll(".lesson-card .strategy")].map((n) => n.textContent.replace("Strategy", "").trim());'), LESSON_INDEX.map((l) => l.strategy), 'strategies');
      eq(await b.js('return document.querySelectorAll(".lesson-card [disabled], .lesson-card .locked").length;'), 0, 'nothing is locked');
      await go('.lesson-card a.btn-primary[href="#math?lesson=5-6&stage=learn"]');
      eq(await b.js('return [location.hash, document.querySelector("#app h1").textContent];'), ['#math?lesson=5-6&stage=learn', LESSON_INDEX[5].title], 'Lesson 5-6 opens');
    });

    for (const meta of LESSON_INDEX) {
      const L = readJSON(`data/lessons/${meta.id}.json`);
      await check(`Lesson ${meta.id} end to end: Learn It, Watch Me, Practice Together, Try It Yourself (20) with misses, Test`, async () => {
        await b.load(url(lessonHash(meta.id, 'learn')));
        // Learn It: answer each check, then go on.
        for (const [k, s] of L.learn.screens.entries()) {
          if (s.item) { await solve(s.item); expect((await fb()).startsWith('Yes!'), `${s.item.id}: ${await fb()}`); }
          if (k < L.learn.screens.length - 1) await press('[data-act="next"]');
        }
        await go('.stage-nav a.btn-primary[href$="stage=watch"]');
        // Watch Me: every step, one at a time, then the "why" question.
        for (const [k, ex] of L.watch.examples.entries()) {
          for (let s = 1; s < ex.steps.length; s++) await press('[data-act="step-next"]');
          eq(await b.js('return document.querySelectorAll(".steps li").length;'), ex.steps.length, `${ex.title}: all steps shown`);
          if (ex.why) await solve(ex.why);
          if (k < L.watch.examples.length - 1) await press('[data-act="next"]');
        }
        await go('.stage-nav a.btn-primary[href$="stage=together"]');
        // Practice Together: a wrong answer is explained, Help opens one step, then the right answer.
        for (const [k, item] of L.together.items.entries()) {
          if (k === 0) {
            await answer(item, wrongFor(item)); await checkAnswer(item);
            expect((await fb()).startsWith('Not yet '), `${item.id}: why it is wrong`);
            await press(`form[data-item="${item.id}"] [data-act="help"]`);
            eq(await b.js('return document.querySelectorAll(".help-steps li").length;'), 1, `${item.id}: one Help step`);
          }
          await solve(item);
          expect((await fb()).startsWith('Yes!'), `${item.id}: ${await fb()}`);
          if (k < L.together.items.length - 1) await press('[data-act="next"]');
        }
        await go('.stage-nav a.btn-primary[href$="stage=try"]');
        // Try It Yourself: 20 questions; the first two are missed on the first try.
        eq(await b.js('return document.querySelector(".stage-title .progress").textContent;'), 'Question 1 of 20', '20 questions');
        for (const [k, item] of L.try.items.entries()) {
          eq(await formItem(), item.id, `question ${k + 1}`);
          if (k < 2) {
            await answer(item, wrongFor(item));
            await checkAnswer(item);
            expect((await fb()).startsWith('Not yet'), `${item.id}: wrong answer gets "Not yet" (${await fb()})`);
          }
          await solve(item);
          expect((await fb()).startsWith('Yes!'), `${item.id}: ${await fb()}`);
          await press('[data-act="next"]');
        }
        eq(await stageTitle(), 'Try It Yourself: your results', 'results');
        eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), '18 out of 20 right on the first try (90%)', 'score');
        eq(await b.js('return document.querySelector(".score-facts").textContent.replace(/\\s+/g, " ").trim();'), 'Answered: 20 of 20 · Missed: 2', 'answered and missed');
        eq(await b.js('return document.querySelectorAll(".review li").length;'), 2, 'the two missed questions are explained');
        expect(await b.js('return [...document.querySelectorAll(".stage-nav a")].some((a) => a.textContent.includes("Back to Lessons")) && !!document.querySelector(".stage-nav a.btn .ico, .stage-nav a[href=\'#week\']");'), 'Back to Lessons and Home');
        // Practice My Misses: the two missed questions again, then back to the results.
        await press('[data-act="misses"]');
        eq(await b.js('return [document.getElementById("stage-h").textContent, document.querySelector(".stage-title .progress").textContent];'), ['Practice My Misses', 'Question 1 of 2'], 'misses round');
        for (const item of L.try.items.slice(0, 2)) {
          eq(await formItem(), item.id, 'a missed question');
          await solve(item);
          await press('[data-act="next"]');
        }
        eq(await stageTitle(), 'Practice My Misses: how you did', 'misses summary');
        eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), '2 out of 2 right on the first try (100%)', 'misses score');
        await press('[data-act="misses-exit"]');
        eq(await stageTitle(), 'Try It Yourself: your results', 'back to results');
        // Test Your Knowledge: no hints, every answer right, then the next lesson.
        await go('.stage-nav a.btn-primary[href$="stage=test"]');
        eq(await b.js('return document.querySelectorAll("[data-act=help], [data-act=hint], [data-act=show]").length;'), 0, 'no hints in the test');
        for (const [k, item] of L.test.items.entries()) {
          await answer(item, solution(item));
          await press(k < L.test.items.length - 1 ? '[data-act="next"]' : '[data-act="submit"]');
        }
        eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), `${L.test.items.length} out of ${L.test.items.length} right (100%)`, 'test score');
        const k = LESSON_INDEX.findIndex((l) => l.id === meta.id);
        const primary = await b.js('return document.querySelector(".stage-nav a.btn-primary").getAttribute("href");');
        eq(primary, k < LESSON_INDEX.length - 1 ? lessonHash(LESSON_INDEX[k + 1].id, 'learn') : '#math?act=guide', 'what next');
        await go('.stage-nav a.btn[href="#math?act=lessons"]');
        eq(await b.js('return document.querySelector("#app h1").textContent;'), 'Math Lessons', 'Back to Lessons');
      });
    }

    await check('Lesson test: a missed question goes to Practice My Misses with Help, and Home works from the results', async () => {
      await b.load(url(lessonHash('5-4', 'test')));
      const L = readJSON('data/lessons/5-4.json');
      for (const [k, item] of L.test.items.entries()) {
        await answer(item, k === 0 ? wrongFor(item) : solution(item));
        await press(k < L.test.items.length - 1 ? '[data-act="next"]' : '[data-act="submit"]');
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), '7 out of 8 right (88%)', 'score with percent');
      await press('[data-act="misses"]');
      const item = L.test.items[0];
      eq(await formItem(), item.id, 'the missed test question');
      await answer(item, wrongFor(item)); await checkAnswer(item);
      await answer(item, { ...wrongFor(item), ...(item.type === 'choice' ? { choice: item.options.findLastIndex((o) => !o.correct) } : {}) });
      const n = boxes(item);
      if (item.type !== 'choice') await answer(item, { ...solution(item), [n[n.length - 1]]: Number(solution(item)[n[n.length - 1]]) + 2 });
      await checkAnswer(item);
      for (let k = 0; k < helpSteps(item).length; k++) await press(`form[data-item="${item.id}"] [data-act="help"]`);
      expect(await b.js('return document.querySelectorAll(".help-steps li").length;') >= 2, 'Help explains it step by step');
      await press('[data-act="next"]');
      eq(await stageTitle(), 'Practice My Misses: how you did', 'summary');
      await press('[data-act="misses-exit"]');
      await go('.stage-nav a.btn[href="#week"]');
      eq(await b.js('return document.querySelector("#app h1").textContent;'), 'This Week', 'Home');
    });

    await check('Math > Math Vocabulary: five cards; Review My Words shows all five properties with Previous and Next', async () => {
      await b.load(url('#math'));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent);'),
        ['Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide'], 'Math menu');
      await go('.menu-card[href="#math?act=words"]');
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent.trim());'),
        ['Review My Words', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses'], 'Math Vocabulary menu');
      await go('.menu-card[href="#math?act=wreview"]');
      const W = readJSON('data/2026-10-19.json');
      const seen = [];
      for (let k = 0; k < 5; k++) {
        seen.push(await b.js(`const c = document.querySelector('#act-stage');
          return [c.querySelector('h3').textContent, c.querySelector('.teacher-words .label').textContent, c.querySelector('.def').textContent,
            [...c.querySelectorAll('.model-svg')].map((s) => s.querySelectorAll('.m-dot, .m-star, .m-tile').length), !!c.querySelector('.read')];`));
        if (k < 4) await press('[data-act="card-next"]');
      }
      const def = (n) => W.math.words.find((w) => w.word.startsWith(n))?.def;
      eq(seen.map((s) => s.slice(0, 3)), [
        ['Identity Property', "Teacher's words", def('Identity')], ['Zero Property', "Teacher's words", def('Zero')],
        ['Commutative Property', "Teacher's words", def('Commutative')],
        ['Associative Property', 'Definition', 'Changing the grouping of three or more factors does not change the product.'],
        ['Distributive Property', "Teacher's words", def('Distributive')]], 'names and definitions');
      eq(seen[3][3], [24, 24], 'Associative: two groupings, 24 dots each');
      expect(seen.every((s) => s[4]), 'Read to me on every card');
      await press('[data-act="card-prev"]');
      eq(await stageTitle(), 'Word 4 of 5', 'Previous');
      await press('[data-act="card-next"]');
      await go('.stage-nav a.btn-primary[href="#math?act=words"]');
      eq(await b.js('return document.querySelector("#app h1").textContent;'), 'Math Vocabulary', 'Done goes back to the menu');
    });

    const allWordItems = [...MW.choice, ...MW.truefalse, ...MW.fill, ...MW.test];
    const wordAnswer = (item) => (item.type === 'word' ? { text: item.answer } : { choice: item.options.findIndex((o) => o.correct) });
    /** Answers a whole Math Vocabulary activity (the order is shuffled, so each question is looked up by its id). */
    // In-page navigation (b.hash): misses live in memory for the visit, so a reload would rightly clear them.
    const runWords = async (act, missFirst) => {
      await b.hash(`#math?act=${act}`);
      eq(await b.js('return document.querySelector(".stage-title h2").textContent;'), 'Question 1 of 20', `${act}: 20 questions`);
      for (let k = 0; k < 20; k++) {
        const id = await formItem();
        const item = allWordItems.find((i) => i.id === id);
        // The page shuffles choices, so the right choice is found on the page by its text.
        if (item.type === 'choice') {
          const want = item.options.find((o) => (k < missFirst ? !o.correct : o.correct)).text;
          await b.js(`const f = document.querySelector('form[data-item="${id}"]'); [...f.querySelectorAll('label.choice')].find((l) => l.textContent.trim() === ${JSON.stringify(want)}).querySelector('input').click();`);
        } else await answer(item, { text: k < missFirst ? 'commutativity' : item.answer });
        await checkAnswer(item);
        if (k < missFirst) {
          expect((await b.js('return document.querySelector("#act-stage .feedback")?.textContent || "";')).includes('Not yet'), `${id}: Not yet`);
          if (item.type === 'choice') {
            const right = item.options.find((o) => o.correct).text;
            await b.js(`const f = document.querySelector('form[data-item="${id}"]'); [...f.querySelectorAll('label.choice')].find((l) => l.textContent.trim() === ${JSON.stringify(right)}).querySelector('input').click();`);
          } else await answer(item, { text: item.answer });
          await checkAnswer(item);
        }
        expect((await b.js('return document.querySelector("#act-stage .feedback")?.textContent || "";')).includes('Yes'), `${id}: right`);
        await press('[data-act="next"]');
      }
      return b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();');
    };

    await check('Math Vocabulary quizzes: 20 questions each, scored with a percentage; a miss goes to its own Practice My Misses', async () => {
      await b.load(url('#math?act=words'));
      eq(await runWords('wchoice', 1), '19 out of 20 right on the first try (95%)', 'Multiple Choice');
      expect(await b.js('return !!document.querySelector(".stage-nav a[href=\'#math?act=wmisses\']");'), 'Practice My Misses link');
      eq(await runWords('wtf', 0), '20 out of 20 right on the first try (100%)', 'True or False');
      eq(await runWords('wfill', 2), '18 out of 20 right on the first try (90%)', 'Fill in the Blank');
      await b.hash('#math?act=words');
      eq(await b.js('return document.querySelector(".menu-card.misses .count-badge")?.textContent.replace(/\\D/g, "");'), '3', 'three word misses');
      await go('.menu-card[href="#math?act=wmisses"]');
      eq(await b.js('return document.querySelector(".stage-title h2").textContent;'), 'Question 1 of 3', 'misses run');
      // Math Practice Problems keep their own misses (none were made there).
      await b.hash('#math?act=misses');
      eq(await b.js('return document.querySelector(".stage-title h2").textContent;'), 'Nothing to practice yet', 'practice problems misses are separate');
    });

    await check('Math Practice Problems, Spelling and Vocabulary: every activity has 20 questions', async () => {
      const routes = ['#math?act=props', '#math?act=split', '#math?act=breakapart', '#math?act=mixed', '#spelling?act=letters', '#spelling?act=listen',
        '#vocab?act=choice', '#vocab?act=truefalse', '#vocab?act=fill', '#spelling?week=2026-10-12&act=letters', '#vocab?week=2026-10-12&act=fill'];
      const got = [];
      for (const r of routes) { await b.load(url(r)); got.push(await b.js('return document.querySelector(".stage-title h2").textContent;')); }
      eq(got, routes.map(() => 'Question 1 of 20'), 'twenty each');
    });

    await check('Tests: the Math Vocabulary practice test has no hints, keeps answers, scores, and links back to Math Vocabulary', async () => {
      await b.load(url('#tests'));
      eq(await b.js('return [...document.querySelectorAll(".test-card h3")].map((h) => h.textContent);'),
        ['Math Practice Test', 'Spelling Practice Test', 'Vocabulary Practice Test', 'Math Vocabulary Practice Test'], 'four tests');
      eq(await b.js('return document.querySelector(".test-mathwords dt").textContent;'), 'Helps with math test', 'not called a class test');
      await go('.test-mathwords a.btn-primary');
      eq(await b.js('return document.querySelector(".stage-title h2").textContent;'), 'Question 1 of 15', '15 questions');
      for (let k = 0; k < 15; k++) {
        eq(await b.js('return document.querySelectorAll("#act-stage [data-act=help], #act-stage [data-act=hint], #act-stage [data-act=show], #act-stage .feedback").length;'), 0, 'no hints or feedback');
        const prompt = await b.js('const p = document.querySelector("#act-stage form[data-item]").querySelector(".prompt, legend")?.cloneNode(true); p?.querySelectorAll(".sr-only").forEach((x) => x.remove()); return (p?.textContent || "").trim();');
        const item = allWordItems.find((i) => i.prompt === prompt);
        expect(item, `found the question "${prompt}"`);
        const id = await formItem();
        if (item.type === 'choice') {
          const right = item.options.find((o) => o.correct).text;
          await b.js(`const f = document.querySelector('form[data-item="${id}"]'); [...f.querySelectorAll('label.choice')].find((l) => l.textContent.trim() === ${JSON.stringify(right)}).querySelector('input').click(); f.dispatchEvent(new Event('change', { bubbles: true }));`);
        } else {
          await b.js(`const f = document.querySelector('form[data-item="${id}"]'); f.querySelector('input[name=text]').value = ${JSON.stringify(item.answer)}; f.dispatchEvent(new Event('input', { bubbles: true }));`);
        }
        await press(k < 14 ? '[data-act="next"]' : '[data-act="submit"]');
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), '15 out of 15 right (100%)', 'score');
      eq(await b.js('return [...document.querySelectorAll(".stage-nav a")].map((a) => a.getAttribute("href"));'), ['#math?act=words', '#week', '#tests'], 'Practice Math Vocabulary, Home, Back to Tests');
    });

    await check('Study Guide: Unit 5 sections, lesson links, and answers that print', async () => {
      await b.load(url('#math?act=guide'));
      eq(await b.js('return [...document.querySelectorAll("#app h2")].map((h) => h.textContent.replace(/\\s+/g, " ").trim());'),
        ['Unit 5 goals', 'Part 1: Multiplication Properties (class math test: Wednesday, Oct 21)', 'Part 2: Strategies from Lessons 5-2 to 5-7 (for practice)', 'Review: words, self-check and am I ready?'], 'parts');
      eq(await b.js('return document.querySelectorAll(".guide-prop").length;'), 5, 'five properties');
      eq(await b.js('return document.querySelectorAll(".guide-table tbody tr").length;'), 6, 'six strategies');
      eq(await b.js('return document.querySelectorAll(".guide-lessons a").length;'), 7, 'seven lesson links');
      await b.media('print');
      eq(await b.js('return [getComputedStyle(document.querySelector(".answers")).display, getComputedStyle(document.querySelector(".guide-table").closest("section").querySelector(".print-only") || document.querySelector("#h-g-check").parentElement.querySelector(".print-only")).display];'), ['none', 'block'], 'answers print as a list');
      await b.media('');
    });

    console.log('Activities and practice tests');
    const W19 = readJSON('data/2026-10-19.json');
    const T19 = readJSON('data/tests/2026-10-19.json');
    const DEF = new Map(W19.vocab.words.map((w) => [w.word, w.def]));
    const SP = new Map(W19.spelling.words.map((w) => [w.word, w]));
    const formId = () => b.js('return document.querySelector("#act-stage form[data-item]")?.dataset.item || null;');
    const actFb = () => b.js('const e = document.querySelector("#act-stage .feedback:not(.info)"); if (!e) return ""; const c = e.cloneNode(true); c.querySelectorAll(".read").forEach((x) => x.remove()); return c.textContent.replace(/\\s+/g, " ").trim();');
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
      for (let k = 0; k < 20; k++) {
        eq(await progress(), 'Question ' + (k + 1) + ' of 20', 'progress');
        const p = await qPrompt();
        const right = vocabAnswer(p);
        const opts = await optionTexts();
        eq([opts.length, opts.filter((o) => o === right).length], [4, 1], p + ': four options, exactly one right');
        seen.add(p);
        if (k === 0) {
          // The last wrong option, so focus on the first option would be a mistake.
          await pickText(opts.filter((o) => o !== right).pop());
          await checkIt();
          expect((await actFb()).startsWith('Not yet'), 'a wrong choice says Not yet');
          eq(await b.js('const e = document.activeElement; return [e.name, e.checked];'), ['choice', true], 'focus returns to the choice the child picked');
          eq(await b.js('return document.querySelector("#act-stage [data-act=next]").disabled;'), true, 'cannot go on before answering');
        }
        await pickText(right);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), 'right answer: ' + await actFb());
        await nextQ();
      }
      eq(seen.size, 20, 'twenty different questions');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'summary');
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
      for (let k = 0; k < 20; k++) {
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
      eq([truth.filter((t) => t === 'True').length, truth.filter((t) => t === 'False').length], [10, 10], 'balanced');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '18 out of 20 right on the first try (90%)', 'summary');
    });
    await check('Vocabulary Fill in the Blank: capitals and spaces are ignored, the word bank fills the box, no spell-check', async () => {
      await b.load(url('#vocab?act=fill'));
      eq(await b.js('const i = document.querySelector("#act-stage input[name=text]"); return [i.spellcheck, i.getAttribute("autocorrect"), i.labels[0].textContent];'),
        [false, 'off', 'Type the missing word'], 'answer box');
      for (let k = 0; k < 20; k++) {
        const p = await qPrompt();
        // A teacher fill-in sentence, or (second round) the word's example sentence with the word taken out.
        const w = W19.vocab.words.find((x) => x.fill === p || x.sentence.replace(new RegExp(x.word + '[a-z]*', 'i'), '___') === p);
        expect(w, 'sentence is one of the week\'s: ' + p);
        expect(!p.toLowerCase().includes(w.word.toLowerCase()), 'the sentence does not show its answer');
        if (k === 0) { await typeIn('melancoly'); await checkIt(); expect((await actFb()).startsWith('Not yet'), 'a wrong word'); }
        if (k === 1) await b.js('[...document.querySelectorAll("#act-stage .bank-word")].find((x) => x.dataset.word === ' + JSON.stringify(w.word.toLowerCase()) + ').click();');
        else await typeIn('  ' + w.word.toUpperCase() + ' ');
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), w.word + ': ' + await actFb());
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'summary');
    });
    const { lettersItem, lettersAgainItem, spellItem } = await import('../js/lib/activities.js');
    await check('Spelling Missing Letters: the word is never shown, wrong letters are marked, right letters are accepted', async () => {
      await b.load(url('#spelling?act=letters'));
      for (let k = 0; k < 20; k++) {
        const id = await formId();
        const w = W19.spelling.words[Number(/(\d+)$/.exec(id)[1]) - 1];
        // Every word once first; then five words again with other letters hidden (a second look).
        eq(id.startsWith('ml2-'), k >= 15, 'second looks come after every word');
        const item = (k >= 15 ? lettersAgainItem : lettersItem)(w, W19.spelling);
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
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'summary');
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
    await check('on a phone, the answer box does not move while a word is read aloud', async () => {
      // 360 px: the long label wraps onto two lines there, so height matters as well as width.
      await b.viewport(360, 740, true);
      await b.load(url('#spelling?act=listen'));
      await b.js('window.__u = []; speechSynthesis.speak = (u) => { __u.push(u); };');
      const top = () => b.js('return Math.round(document.querySelector("#act-stage input[name=text]").getBoundingClientRect().top + scrollY);');
      const before = await top();
      await b.js('document.querySelector("[data-act=dictate]").click();');
      eq([await b.js('return document.querySelector("[data-act=dictate] .read-label").textContent;'), await top()], ['Stop', before], 'while speaking: Stop, and the box stays put');
      await b.js('__u[__u.length - 1].onend();');
      eq([await b.js('return document.querySelector("[data-act=dictate] .read-label").textContent;'), await top()], ['Hear the word and sentence', before], 'after speaking');
      await b.viewport(1366, 900, false);
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
        math: ['Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide'],
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
      eq(await b.js('return [location.hash, document.activeElement.tagName];'), ['#math?act=guide', 'H1'], 'browser Back (focus on the heading)');
      before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('history.forward();');
      await b.ready(before);
      eq(await b.js('return [location.hash, document.activeElement.tagName, document.activeElement.textContent];'), ['#week', 'H1', 'This Week'], 'browser Forward (focus on the heading)');
    });
    await check('Math > Practice Problems > Match the Split Array: from the menu, right and wrong answers, Help step by step, results, misses', async () => {
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
          expect((await actFb()).includes(item.options.find((o) => !o.correct).why), 'the wrong choice says why');
          await press('#act-stage [data-act="help"]');
          eq(await b.js('return document.querySelectorAll("#act-stage .help-steps li").length;'), 1, 'one Help step');
          await pickText(item.options.filter((o) => !o.correct)[1].text);
          await checkIt();
          const n = helpSteps(item).length;
          for (let h = 1; h < n; h++) await press('#act-stage [data-act="help"]');
          expect((await b.js('return document.querySelector("#act-stage .help-panel").textContent;')).includes(right), 'the last Help step ends with the answer');
        } else {
          await pickText(right);
          await checkIt();
          expect((await actFb()).startsWith('Yes!'), item.id + ': ' + await actFb());
        }
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'summary');
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
      eq(await b.js('return [...document.querySelectorAll(".lesson-card")].map((c) => [...c.querySelectorAll(".stage-links a")].map((a) => a.textContent.trim().replace(/\\s+/g, " ")));').then((x) => x.map((l) => l.length)), [5, 5, 5, 5, 5, 5, 5], 'seven lessons, five steps each');
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
        [['Math Practice Test', '20', true], ['Spelling Practice Test', '15', true], ['Vocabulary Practice Test', '16', true], ['Math Vocabulary Practice Test', '15', true]], 'cards');
      expect((await b.js('return document.querySelector(".test-vocab").textContent;')).includes('purple words'), 'vocabulary coverage names the missing purple words');
      await b.hash('#tests?week=2026-10-12');
      eq(await b.js('return [...document.querySelectorAll(".test-card")].map((c) => [!!c.querySelector("a.btn"), !!c.querySelector(".unavailable")]);'),
        [[false, true], [true, false], [false, true], [true, false]], 'Oct 12: the spelling test and the Math Vocabulary test (not tied to a week) can start');
      await b.hash('#tests?week=2026-10-12&test=math');
      eq(await b.js('return location.hash;'), '#tests?week=2026-10-12', 'a test that does not exist goes back to the Test Center');
    });
    await check('Math practice test: no hints or answers, answers kept when moving around, unanswered warning, score, review, restart', async () => {
      await b.load(url('#tests?test=math'));
      const items = T19.math.items;
      for (const [k, item] of items.entries()) {
        eq(await b.js('return [...document.querySelectorAll("#act-stage [data-act=help], #act-stage [data-act=hint], #act-stage [data-act=show], #act-stage button[type=submit], #act-stage .feedback")].length;'), 0, 'no help or feedback on ' + item.id);
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
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '18 out of 20 right (90%)', 'score');
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
        eq(await b.js('return [document.querySelectorAll("#app img").length, document.querySelectorAll("#act-stage [data-act=help], #act-stage [data-act=hint], #act-stage .feedback").length];'), [0, 0], 'no picture, hint or feedback');
        await typeIn(k === 3 ? w.toUpperCase() : k === 5 ? w + '.' : w);
        if (k < 14) await press('[data-act="next"]');
      }
      eq([...asked].sort(), [...SP.keys()].sort(), 'all 15 words, each once');
      eq(await b.js('return __spoken.length;'), 45, 'word, sentence, word for each');
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '15 out of 15 right (100%)', 'score');
    });
    await check('Vocabulary practice test: all 12 words covered, scored without hints, and refreshing starts again', async () => {
      await b.load(url('#tests?test=vocab'));
      const items = T19.vocab.items;
      for (const [k, item] of items.entries()) {
        await answer(item, item.type === 'word' ? { text: item.answer } : solution(item));
        if (k < items.length - 1) await press('[data-act="next"]');
      }
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '16 out of 16 right (100%)', 'score');
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
        ['#vocab?act=fill', async () => { await typeIn('x'); await checkIt(); await press('[data-act="help"]'); }],
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


    console.log('Skill Builders (D22)');
    /** What is on the screen for the current Skill Builders question, and the right answer worked out from it. */
    const skillQ = async () => {
      const q = await b.js(`const f = document.querySelector('#act-stage form[data-item]'); if (!f) return null;
        const line = f.querySelector('.eqline'); const p = f.querySelector('.prompt, .round-step, legend');
        return { id: f.dataset.item, prompt: (f.querySelector('.prompt')?.textContent || '').trim(), round: !!f.querySelector('.round-digits'),
          names: [...f.querySelectorAll('input.box')].map((i) => i.name), line: line ? line.textContent.replace(/\\s+/g, ' ').trim() : '',
          fact: (f.querySelector('.eqline span[id^="q-"]')?.textContent || '').trim() };`);
      if (!q) return null;
      const nums = (t) => (t.match(/\d+/g) || []).map(Number);
      if (q.round) {
        const [n, to] = nums(q.prompt);
        const p = roundParts(n, to);
        return { ...q, n, to, right: { place: String(p.place), dir: p.up ? 'up' : 'stay', answer: String(p.answer) }, p };
      }
      if (q.names.length === 1 && q.names[0] === 'answer') {
        const t = q.fact || q.prompt;
        let v;
        if (/^Round /.test(q.prompt)) { const [n, to] = nums(q.prompt); v = roundParts(n, to).answer; } else if (/make 10/.test(t)) v = 10 - nums(t)[0];
        else if (/×/.test(t)) { const [a, c] = nums(t); v = a * c; } else { const [a, c] = nums(t); v = a + c; }
        return { ...q, right: { answer: String(v) } };
      }
      const [A, B] = nums(q.line);
      if (q.names.join() === 'x') return { ...q, right: { x: String(10 - A) } };
      if (q.names.join() === 'a,b,c,t') { const o = A % 10; return { ...q, right: { a: String(o), b: String(A - o + B), c: String(o), t: String(A + B) } }; }
      const ao = A % 10, bo = B % 10;
      return { ...q, right: { a: String(ao), b: String(bo), c: String(A - ao + B - bo), d: String(ao + bo), t: String(A + B) } };
    };
    /** Types or taps an answer into the current question (rounding radios are tapped, boxes are typed). */
    const skillFill = (values) => b.js(`const f = document.querySelector('#act-stage form[data-item]'); const v = ${JSON.stringify(values)};
      for (const [k, x] of Object.entries(v)) { const r = f.querySelector('input[type=radio][name="' + k + '"][value="' + x + '"]'); if (r) r.click(); else { const el = f.querySelector('input.box[name="' + k + '"]'); if (el) el.value = x; } }
      f.dispatchEvent(new Event('input', { bubbles: true }));`);

    await check('Skill Builders: three skill cards; each opens its own menu with Learn It, practice, Practice My Misses and a test', async () => {
      await b.load(url('#skills'));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.firstChild.textContent.trim());'), ['Mental Add', 'Rounding', 'Times Tables'], 'skill cards');
      for (const [card, labels] of [['add', ['Learn It', 'Quick Facts', 'Break It Apart', 'Practice My Misses', 'Mental Add Test']],
        ['round', ['Learn It', 'Nearest 10', 'Nearest 100', 'Practice My Misses', 'Rounding Test']],
        ['times', ['Learn It', 'All Facts', 'Tricky Facts', 'Practice My Misses', 'Times Tables Test']]]) {
        await b.load(url('#skills'));
        await go(`.menu-card[href="#skills?act=${card}"]`);
        eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.firstChild.textContent.trim());'), labels, `${card} menu`);
        eq(await b.js('return [...document.querySelectorAll(".crumbs li")].map((l) => l.textContent.trim());'), ['Home', 'Skill Builders', labels.at(-1).replace(' Test', '').replace('Mental Add', 'Mental Add')], `${card} crumbs`);
        await go(`.menu-card[href="#skills?act=${card}learn"]`);
        expect((await b.js('return document.querySelector("h1").textContent;')).endsWith(': Learn It'), `${card} Learn It`);
        expect(await b.js('return document.querySelectorAll(".skill-ex").length;') >= 4, `${card} examples`);
        expect(await b.js('return !!document.querySelector(".stage-nav a.btn-primary[href*=act]");'), `${card}: Start practice link`);
      }
      // The rounding pictures underline the digit in the place and put the arrow on the digit to its right.
      await b.load(url('#skills?act=roundlearn'));
      eq(await b.js('return [...document.querySelectorAll(".round-pic")].slice(0, 4).map((p) => [p.querySelector(".is-under").textContent, p.querySelector(".is-arrow").textContent]);'),
        [['4', '5'], ['6', '3'], ['3', '4'], ['9', '7']], '45, 63, 347, 897');
    });

    await check('Rounding > Nearest 10: tap a digit to underline it, the arrow appears, each wrong step says why, Help step by step, 20 questions, results and misses', async () => {
      await b.load(url('#skills?act=roundten'));
      for (let k = 0; k < 20; k++) {
        eq(await progress(), `Question ${k + 1} of 20`, 'progress');
        const q = await skillQ();
        expect(q.round, 'a rounding question');
        if (k === 0) {
          const wrongPlace = String(q.p.place === 0 ? 1 : 0);
          await skillFill({ ...q.right, place: wrongPlace });
          // The tapped digit is underlined and the arrow sits on the digit to its right.
          eq(await b.js(`const l = document.querySelector('#act-stage label[for="' + document.querySelector('input[name=place]:checked').id + '"]');
            const next = l.nextElementSibling?.nextElementSibling; return [getComputedStyle(l).textDecorationLine, next ? getComputedStyle(next, '::before').content : 'none'];`),
            ['underline', q.p.digits.length > Number(wrongPlace) + 1 ? '"↓"' : 'none'], 'underline and arrow');
          await checkIt();
          expect((await actFb()).includes('underline the digit in the tens place'), `wrong digit: ${await actFb()}`);
          await press('#act-stage [data-act="help"]');
          eq(await b.js('return document.querySelectorAll("#act-stage .help-steps li").length;'), 1, 'one Help step');
          await skillFill({ ...q.right, dir: q.p.up ? 'stay' : 'up' });
          await checkIt();
          expect((await actFb()).startsWith(`Not yet The arrow points to ${q.p.next}.`), `wrong direction: ${await actFb()}`);
          await skillFill({ ...q.right, answer: String(q.n) });
          await checkIt();
          expect((await actFb()).includes('ends in 0'), `not rounded: ${await actFb()}`);
          await skillFill(q.right);
        } else await skillFill(q.right);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), `${q.prompt}: ${await actFb()}`);
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'score');
      await go('#act-stage a.btn[href="#skills?act=roundmisses"]');
      eq(await progress(), 'Question 1 of 1', 'the missed number is in Practice My Misses');
      expect(await skillQ().then((q) => q.round), 'still with the underline-and-arrow method');
    });

    await check('Mental Add > Break It Apart and Quick Facts: 20 questions each, a lost ten is explained, Help step by step', async () => {
      await b.load(url('#skills?act=addsplit'));
      for (let k = 0; k < 20; k++) {
        const q = await skillQ();
        if (k === 0) {
          await skillFill({ ...q.right, t: String(Number(q.right.t) - 10) });
          await checkIt();
          expect(/ten/.test(await actFb()) && (await actFb()).startsWith('Not yet'), `lost a ten: ${await actFb()}`);
          expect(!(await actFb()).includes(q.right.t), 'the reason does not give the answer');
          await press('#act-stage [data-act="help"]');
          await press('#act-stage [data-act="help"]');
          eq(await b.js('return document.querySelectorAll("#act-stage .help-steps li").length;'), 2, 'two Help steps');
        }
        await skillFill(q.right);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), `${q.line}: ${await actFb()}`);
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'Break It Apart score');
      await b.load(url('#skills?act=addfacts'));
      for (let k = 0; k < 20; k++) {
        const q = await skillQ();
        await skillFill(q.right);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), `${q.prompt || q.fact || q.line}: ${await actFb()}`);
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '20 out of 20 right on the first try (100%)', 'Quick Facts score');
    });

    await check('Skill Builders tests: no Help or feedback during the test, a score, Back to the skill, and the miss goes to its Practice My Misses with Help', async () => {
      for (const [act, n, card, label] of [['timestest', 12, 'times', 'Times Tables'], ['roundtest', 10, 'round', 'Rounding'], ['addtest', 10, 'add', 'Mental Add']]) {
        await b.load(url(`#skills?act=${act}`));
        for (let k = 0; k < n; k++) {
          eq(await progress(), `Question ${k + 1} of ${n}`, `${act} progress`);
          eq(await b.js('return document.querySelectorAll("#act-stage [data-act=help], #act-stage .feedback, #act-stage button[type=submit]").length;'), 0, `${act}: no Help or feedback`);
          const q = await skillQ();
          await skillFill(k === 0 ? { answer: String(Number(q.right.answer) + 1) } : q.right);
          await press(k < n - 1 ? '#act-stage [data-act="next"]' : '#act-stage [data-act="submit"]');
        }
        eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), `${n - 1} out of ${n} right (${Math.round(((n - 1) / n) * 100)}%)`, `${act} score`);
        expect(await b.js(`return !!document.querySelector('.stage-nav a.btn-primary[href="#skills?act=${card}"]');`), `${act}: Back to ${label}`);
        await go(`#act-stage a.btn[href="#skills?act=${card}misses"]`);
        eq(await progress(), 'Question 1 of 1', `${act}: the missed question is in Practice My Misses`);
        const q = await skillQ();
        await skillFill(q.round ? { ...q.right, answer: String(Number(q.right.answer) + q.to) } : Object.fromEntries(Object.entries(q.right).map(([k2, v]) => [k2, String(Number(v) + 1)])));
        await checkIt();
        expect(await b.js('return !!document.querySelector("#act-stage [data-act=help]");'), `${act}: Help in Practice My Misses`);
      }
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
