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
// Weeks (data/weeks.json): Oct 26–30 is the current week. Checks written for Oct 19–23 (Unit 5, the "-ing" words,
// the first Winn-Dixie test) choose that week explicitly with H19(); Oct 26–30 has its own checks (H26 = no week).
const OCT19 = '2026-10-19';
const OCT26 = '2026-10-26';
/** The same address in a chosen week: "#vocab?act=learn" -> "#vocab?week=2026-10-19&act=learn" (the current week has no week=). */
const inWeek = (h, id) => {
  if (id === INDEX.current) return h;
  const [sec, q] = h.split('?');
  return `${sec}?week=${id}${q ? `&${q}` : ''}`;
};
const H19 = (h) => inWeek(h, OCT19);
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
  ...['add', 'addlearn', 'addfacts', 'addsplit', 'addtest', 'round', 'roundlearn', 'roundten', 'roundhun', 'roundtest', 'times', 'timeslearn', 'timesall', 'timestricky', 'timestest'].map((a) => `#skills?act=${a}`),
  // Homework packet (D23), in the week it was received.
  '#homework?week=2026-10-19&act=packet',
  // Topic 6: Area (Oct 26–30) and the Oct 19–23 pages kept for review.
  '#math?act=area', '#math?act=arealearn', '#math?act=areafind', '#math?act=areawords', '#math?act=areamisses',
  '#math?act=ch5', '#math?act=ch6', '#math?act=ch6review', '#math?act=avreview', '#math?act=avflash', '#math?act=avchoice', '#math?act=avtf', '#math?act=avfill', '#math?act=avmisses', '#tests?test=mathwords',
  '#spelling?week=2026-10-19&act=letters', '#tests?week=2026-10-19', '#tests?week=2026-10-19&test=math'];
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
    await check('Oct 19–23 This Week counts down to each test from Friday, Oct 16', async () => {
      await b.load(url(H19('#week')));
      const cards = await b.js('return [...document.querySelectorAll(".test")].map((c) => c.querySelector(".count").textContent + " | " + c.querySelector("h3").textContent + " | " + c.querySelector(".date").textContent);');
      eq(cards, ['In 5 days | Math Test | Wednesday, October 21', 'In 7 days | Vocabulary Quiz | Friday, October 23',
        'In 7 days | Spelling Test | Friday, October 23'], 'test cards');
      eq(await b.js('return [...document.querySelectorAll(".test .action")].map((a) => a.getAttribute("href"));'),
        ['#math', '#tests', '#vocab', '#tests', '#spelling', '#tests'].map(H19), 'study and practice-test links');
    });
    await check('Oct 26–30 (this week) This Week counts down from Monday, Oct 26: green-word quiz, spelling test, Topic 6 vocabulary test', async () => {
      // A second frozen "today" for this check only (Monday, Oct 26, 2026, 8 AM).
      const { result } = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: FREEZE_DATE.replace('new R(2026, 9, 16, 12, 0, 0)', 'new R(2026, 9, 26, 8, 0, 0)') });
      try {
        await b.load(url('#week'));
        eq(await b.js('return document.getElementById("weekSelect").value;'), OCT26, 'Oct 26 opens by default');
        const cards = await b.js('return [...document.querySelectorAll(".test")].map((c) => c.querySelector(".count").textContent + " | " + c.querySelector("h3").textContent + " | " + c.querySelector(".date").textContent);');
        eq(cards, ['In 4 days | Academic Vocabulary Quiz | Friday, October 30', 'In 4 days | Spelling Test | Friday, October 30',
          'In 8 days | Math Topic 6 Vocabulary Test | Tuesday, November 3'], 'test cards');
        eq(await b.js('return [...document.querySelectorAll(".test .action")].map((a) => a.getAttribute("href"));'),
          ['#vocab', '#tests', '#spelling', '#tests', '#math?act=area', '#tests'], 'study links (Area opens Topic 6) and practice-test links');
        expect((await b.js('return document.querySelector(".test-vocab").textContent;')).includes('Trustworthy, Constellations, Irritating, Distracted'), 'the quiz names the four green words');
        const learning = await b.js('return [...document.querySelectorAll(".learning div")].map((d) => d.querySelector("dt").textContent + " " + d.querySelector("dd").textContent);');
        eq(learning, ['Math Area', 'Reading Novel Study: Because of Winn-Dixie', 'Writing Opinion', 'Spelling -er / -or', 'ELA Pronouns', 'Science Georgia Habitats'], 'what we are learning');
        eq(await b.js('return [...document.querySelectorAll(".dates li")].map((l) => l.textContent.replace(/\\s+/g, " ").trim());'),
          ['Oct 26–30 Red Ribbon Week', 'Oct 29, 6–7 PM BOONanza', 'Nov 18 Field Trip', 'Nov 20, noon Early Release'], 'dates to know');
      } finally {
        await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: result.identifier });
      }
      await b.load(url());
      eq(await b.js('return document.querySelector(".test .count").textContent;'), 'In 14 days', 'back to the usual frozen day (Friday, Oct 16)');
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
      eq(await b.js('return location.hash;'), '#vocab?week=2026-10-19', 'hash names the earlier week');
      const W = readJSON('data/2026-10-19.json');
      eq(await b.js('return document.querySelector(".intro").textContent;'), `${W.vocab.title} · ${W.vocab.words.length} words · Quiz: ${W.vocab.quiz}`, 'Oct 19 vocabulary');
      before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-26"; s.dispatchEvent(new Event("change"));');
      await b.ready(before);
      eq(await b.js('return location.hash;'), '#vocab', 'hash back to this week (Oct 26)');
      const W26 = readJSON('data/2026-10-26.json');
      eq(await b.js('return document.querySelector(".intro").textContent;'), `${W26.vocab.title} · ${W26.vocab.words.length} words · Quiz: ${W26.vocab.quiz}`, 'Oct 26 vocabulary');
      eq(await b.js('return document.getElementById("weekLabel").textContent;'), '3rd grade · Oct 26–30', 'header label');
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
      // Unit 5 (properties) teacher's words come from the week that announced them (Oct 19), in every week.
      const U5 = readJSON('data/2026-10-19.json');
      await check(`${id}: the Unit 5 Study Guide shows the teacher's property words exactly`, async () => {
        await b.hash(inWeek('#math?act=guide', id));
        // Study Guide: each property with the teacher's definition word for word.
        // (The Associative Property has no teacher wording in the week file; it is labelled "Definition", not compared here.)
        const shown = await b.js('return [...document.querySelectorAll(".guide-prop")].filter((c) => c.querySelector(".label")?.textContent === "Teacher\'s words").map((c) => [c.querySelector("h4").textContent, c.querySelector(".def").textContent]);');
        eq([...shown].sort(), U5.math.words.map((w) => [w.word, w.def]).sort(), 'cards');
        eq(await b.js('return document.querySelectorAll(".guide-prop").length;'), 5, 'all five properties');
        expect(!(await b.js('return document.getElementById("app").textContent;')).match(/Square Unit|Nov 3/), 'no Topic 6 words or dates in the Unit 5 guide');
      });
      if (week.math && /Area/.test(week.math.title)) {
        await check(`${id}: Topic 6 Area words and examples match the data`, async () => {
          await b.hash(inWeek('#math?act=arealearn', id));
          const shown = await b.js('return [...document.querySelectorAll(".area-word")].map((c) => [c.querySelector("h3").textContent.replace(/^\\d+\\. /, ""), c.querySelector(".teacher-words .def").textContent]);');
          eq(shown, week.math.words.map((w) => [w.word, w.def]), 'the three words, teacher definitions word for word');
          // Every Area picture is a rectangle of unit squares whose count matches the numbers written beside it.
          const pics = await b.js('return [...document.querySelectorAll("#app .model-svg")].map((s) => [s.querySelectorAll(".m-tile").length, [...s.querySelectorAll(".m-side")].map((t) => Number(t.textContent))]);');
          eq(pics.map(([n]) => n), [12, 1, 12, 10, 18, 8], 'squares in each picture');
          for (const [n, sides] of pics) if (sides.length) eq(sides[0] * sides[1], n, 'side lengths multiply to the squares shown');
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
    await check('Oct 19–23 spelling study cards: the 15 approved pictures, each matched to its word, with a sentence', async () => {
      await b.load(url(H19('#spelling?act=learn')));
      await b.waitFor('[...document.querySelectorAll(".study-card img")].every((i) => i.complete && i.naturalWidth > 0)');
      const cards = await b.js('return [...document.querySelectorAll(".study-card")].map((c) => [c.querySelector("h3").textContent, c.querySelector("img").getAttribute("src"), c.querySelector("img").alt, !!c.querySelector(".sentence")]);');
      const week = readJSON('data/2026-10-19.json');
      eq(cards, week.spelling.words.map((w) => [w.word, `images/words/${w.word}.webp`, `Study card for the word "${w.word}"`, true]), 'study cards');
    });
    await check('Oct 26–30 spelling study cards: the 15 supplied pictures, one per word in the newsletter order, with its sentence', async () => {
      await b.load(url('#spelling?act=learn'));
      await b.waitFor('[...document.querySelectorAll(".study-card img")].length === 15 && [...document.querySelectorAll(".study-card img")].every((i) => i.complete && i.naturalWidth > 0)');
      const week = readJSON('data/2026-10-26.json');
      eq(week.spelling.words.map((w) => w.word), ['pitcher', 'helper', 'boxer', 'runner', 'swimmer', 'actor', 'tractor', 'shipper', 'doctor', 'bigger', 'bolder', 'conductor', 'talker', 'teacher', 'walker'], 'the newsletter list, in order');
      const cards = await b.js('return [...document.querySelectorAll(".study-card")].map((c) => [c.querySelector("h3").textContent, c.querySelector("img").getAttribute("src"), c.querySelector("img").alt, c.querySelector(".sentence")?.textContent]);');
      eq(cards, week.spelling.words.map((w) => [w.word, `images/words/${w.word}.webp`, `Study card for the word "${w.word}"`, w.sentence]), 'study cards');
      // Each picture is fitted inside its frame (never cropped or stretched), and none is tiny.
      const fit = await b.js('return [...document.querySelectorAll(".study-card img")].map((i) => [getComputedStyle(i).objectFit, Math.min(i.naturalWidth, i.naturalHeight) >= 200]);');
      expect(fit.every(([f, big]) => f === 'contain' && big), 'pictures are contained and large enough: ' + JSON.stringify(fit));
      // Words with no shorter base word (doctor, tractor) never show a made-up one.
      expect(!(await b.js('return document.getElementById("app").textContent;')).match(/from doct\b|from tract\b/), 'no made-up base words');
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
      for (const id of [OCT26, OCT19]) {
        const week = readJSON(`data/${id}.json`);
        await b.load(url(inWeek('#vocab?act=learn', id)));
        const now = await allPics(12);
        eq(now.map((x) => x[0]), week.vocab.words.map((w) => `images/words/${pictureName(w.word)}.webp`), `${id}: the approved picture of each word`);
        expect(now.every((x, k) => x[1].startsWith('Picture showing')), `${id}: alt text`);
      }
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
        // "Choose all that are right": tick exactly the listed boxes.
        if ('multi' in v) f.querySelectorAll('input[type=checkbox][name=multi]').forEach((c) => { c.checked = String(v.multi).split(',').includes(c.value); });
        for (const [k, x] of Object.entries(v)) { const el = f.querySelector('[name="' + k + '"]'); if (el && el.type !== 'radio' && el.type !== 'checkbox') el.value = String(x); }
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

    for (const id of [OCT19, OCT26]) await check(`${id}: Math > Learn the Properties: five cards, each picture matching its equation, with the teacher's words`, async () => {
      // Unit 5 stays complete in the Area week, with the same teacher's words (from Oct 19).
      await b.load(url(inWeek('#math', id)));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent);'),
        [...(id === OCT26 ? ['Topic 6: Area'] : []), 'Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide'], id === OCT26 ? 'Topic 6 first, then all of Unit 5' : 'five choices first');
      await go(`.menu-card[href="${inWeek('#math?act=learn', id)}"]`);
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
      eq(await b.js('return document.querySelector(".stage-nav .btn-primary").getAttribute("href");'), inWeek('#math?act=practice', id), 'then Practice Problems');
      await press('[data-act="card-prev"]');
      eq(await b.js('return document.getElementById("stage-h").textContent;'), 'Property 4 of 5', 'Previous Property');
      await b.js('document.querySelector(".bar-btns a.back").click();');
      await b.waitFor(`location.hash === ${JSON.stringify(inWeek('#math', id))}`);
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
    const LESSON_CHAPTERS = readJSON('data/lessons/index.json').chapters;
    /** A wrong answer for a question: another choice, or the last box one more than its right value. */
    const wrongFor = (item) => {
      const sol = solution(item);
      if (item.type === 'choice') return { choice: item.options.findIndex((o) => !o.correct) };
      if (item.type === 'multi') return { multi: String(item.options.findIndex((o) => !o.correct)) };
      const names = boxes(item);
      const last = names[names.length - 1];
      return { ...sol, [last]: Number(sol[last]) + 1 };
    };
    const stageTitle = () => b.js('return document.getElementById("stage-h")?.textContent.trim() || "";');
    const formItem = () => b.js('return document.querySelector("form[data-item]")?.dataset.item || "";');

    await check('Math > Math Lessons: choose a chapter; each chapter lists its open lessons with strategies; Start opens Learn It', async () => {
      await b.load(url('#math'));
      await go('.menu-card[href="#math?act=lessons"]');
      eq(await b.js('return [document.querySelector("#app h1").textContent, [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent)];'),
        ['Math Lessons', ['Chapter 5: Multiplication Properties and Strategies', 'Chapter 6: Connect Area and Multiplication']], 'Choose a chapter');
      for (const [ch, start] of [[5, '5-6'], [6, '6-3']]) {
        await b.hash('#math?act=lessons');
        await go(`.menu-card[href="#math?act=ch${ch}"]`);
        const list = LESSON_INDEX.filter((l) => l.chapter === ch);
        eq(await b.js('return [...document.querySelectorAll(".lesson-card .lesson-num")].map((n) => n.textContent);'), list.map((l) => l.id), `Chapter ${ch}: its lessons in order`);
        eq(await b.js('return [...document.querySelectorAll(".lesson-card .strategy")].map((n) => n.textContent.replace("Strategy", "").trim());'), list.map((l) => l.strategy), 'strategies');
        eq(await b.js('return document.querySelectorAll(".lesson-card [disabled], .lesson-card .locked").length;'), 0, 'nothing is locked');
        await go(`.lesson-card a.btn-primary[href="#math?lesson=${start}&stage=learn"]`);
        eq(await b.js('return [location.hash, document.querySelector("#app h1").textContent];'), [`#math?lesson=${start}&stage=learn`, LESSON_INDEX.find((l) => l.id === start).title], `Lesson ${start} opens`);
      }
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
        // What next: the next lesson of the same chapter; after a chapter's last lesson, its review.
        const chapter = LESSON_INDEX.filter((l) => l.chapter === meta.chapter);
        const k = chapter.findIndex((l) => l.id === meta.id);
        const primary = await b.js('return document.querySelector(".stage-nav a.btn-primary").getAttribute("href");');
        eq(primary, k < chapter.length - 1 ? lessonHash(chapter[k + 1].id, 'learn') : meta.chapter === 5 ? '#math?act=guide' : '#math?act=ch6review', 'what next');
        await go(`.stage-nav a.btn[href="#math?act=ch${meta.chapter}"]`);
        eq(await b.js('return document.querySelector("#app h1").textContent;'), LESSON_CHAPTERS.find((c) => c.id === meta.chapter).title, 'Back to Lessons (the chapter)');
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

    await check('Oct 19–23 Math > Math Vocabulary: five cards; Review My Words shows all five properties with Previous and Next', async () => {
      await b.load(url(H19('#math')));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent);'),
        ['Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide'], 'Math menu');
      await go(`.menu-card[href="${H19('#math?act=words')}"]`);
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent.trim());'),
        ['Review My Words', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses'], 'Math Vocabulary menu');
      await go(`.menu-card[href="${H19('#math?act=wreview')}"]`);
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
      await go(`.stage-nav a.btn-primary[href="${H19('#math?act=words')}"]`);
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

    await check('Oct 19–23 Tests: the Math Vocabulary practice test has no hints, keeps answers, scores, and links back to Math Vocabulary', async () => {
      await b.load(url(H19('#tests')));
      eq(await b.js('return [...document.querySelectorAll(".test-card h3")].map((h) => h.textContent);'),
        ['Math Practice Test', 'Spelling Practice Test', 'Vocabulary Practice Test', 'Math Vocabulary Practice Test'], 'four tests');
      // Oct 19–23: the property-word test helps with that week's Multiplication Properties test.
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
      eq(await b.js('return [...document.querySelectorAll(".stage-nav a")].map((a) => a.getAttribute("href"));'), ['#math?act=words', '#week', '#tests'].map(H19), 'Practice Math Vocabulary, Home, Back to Tests');
    });

    for (const id of [OCT19, OCT26]) await check(`${id}: Study Guide: Unit 5 sections (with Unit 5's own test date), lesson links, and answers that print`, async () => {
      await b.load(url(inWeek('#math?act=guide', id)));
      eq(await b.js('return [...document.querySelectorAll("#app h2")].map((h) => h.textContent.replace(/\\s+/g, " ").trim());'),
        ['Unit 5 goals', 'Part 1: Multiplication Properties (class math test: Wednesday, Oct 21)', 'Part 2: Strategies from Lessons 5-2 to 5-7 (for practice)', 'Review: words, self-check and am I ready?'], 'parts');
      eq(await b.js('return document.querySelectorAll(".guide-prop").length;'), 5, 'five properties');
      eq(await b.js('return document.querySelectorAll(".guide-table tbody tr").length;'), 6, 'six strategies');
      eq(await b.js('return document.querySelectorAll(".guide-lessons a").length;'), 7, 'seven lesson links');
      await b.media('print');
      eq(await b.js('return [getComputedStyle(document.querySelector(".answers")).display, getComputedStyle(document.querySelector(".guide-table").closest("section").querySelector(".print-only") || document.querySelector("#h-g-check").parentElement.querySelector(".print-only")).display];'), ['none', 'block'], 'answers print as a list');
      await b.media('');
    });

    console.log('Activities and practice tests (Oct 19–23, chosen explicitly; Oct 26–30 has its own checks below)');
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
      await b.load(url(H19('#vocab?act=fill')));
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
      await b.load(url(H19('#spelling?act=letters')));
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
      await b.load(url(H19('#spelling?act=listen')));
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
      await b.load(url(H19('#spelling')));
      await go(`.menu-card[href="${H19('#spelling?act=flash')}"]`);
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
      await b.waitFor(`location.hash === ${JSON.stringify(H19('#spelling'))} && !!document.querySelector(".menu-card")`);
      await b.hash(H19('#spelling?act=misses'));
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
        math: ['Topic 6: Area', 'Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide'],
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
      await go('.menu-card[href="#math?act=ch5"]');
      eq(await b.js('return [...document.querySelectorAll(".lesson-card")].map((c) => [...c.querySelectorAll(".stage-links a")].map((a) => a.textContent.trim().replace(/\\s+/g, " ")));').then((x) => x.map((l) => l.length)), [5, 5, 5, 5, 5, 5, 5], 'seven Chapter 5 lessons, five steps each');
      await go('.stage-links a[href="#math?lesson=5-1&stage=together"]');
      eq(await b.js('return [document.getElementById("stage-h").textContent, [...document.querySelectorAll(".bar-btns a")].map((a) => [a.textContent.trim(), a.getAttribute("href")])];'),
        ['Practice Together', [['‹ Back to Lessons', '#math?act=ch5'], ['Back to Math', '#math'], ['Home', '#week']]], 'Practice Together, with Back and Home');
      await b.js('document.querySelector(".bar-btns a.back").click();');
      await b.waitFor('location.hash === "#math?act=ch5"');
      await b.load(url('#math?act=ch6'));
      eq(await b.js('return [...document.querySelectorAll(".lesson-card")].map((c) => c.querySelectorAll(".stage-links a").length);'), [5, 5, 5, 5, 5, 5], 'six Chapter 6 lessons, five steps each');
      await go('.stage-links a[href="#math?lesson=6-4&stage=test"]');
      eq(await b.js('return [...document.querySelectorAll(".crumbs a")].map((a) => a.textContent.trim());'), ['Home', 'Math', 'Math Lessons', 'Chapter 6'], 'crumbs name the chapter');
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
      await b.load(url(H19('#week')));
      await go('nav.tabs a[data-tab=tests]');
      expect(await b.js('return [...document.querySelectorAll(".test-card a.btn")].every((a) => a.getBoundingClientRect().bottom <= innerHeight);'), 'every Start test button is on the first screen at 1366 x 768');
      await b.viewport(1366, 900, false);
      await b.load(url(H19('#tests')));
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
      await b.load(url(H19('#tests?test=math')));
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
      expect(await b.js(`return !!document.querySelector("[data-act=print]") && !!document.querySelector(".stage-nav a[href='${H19('#math')}']") && !!document.querySelector(".stage-nav a[href='${H19('#tests')}']");`), 'print, practise and Back to Tests');
      await press('[data-act="restart"]');
      eq([await progress(), await b.js('return document.querySelectorAll("#act-stage input:checked").length;')], ['Question 1 of 20', 0], 'a fresh test');
    });
    await check('Spelling practice test: every word exactly once, read aloud, never shown, typed answers scored', async () => {
      await b.load(url(H19('#tests?test=spelling')));
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
      await b.load(url(H19('#tests?test=vocab')));
      const items = T19.vocab.items;
      for (const [k, item] of items.entries()) {
        await answer(item, item.type === 'word' ? { text: item.answer } : solution(item));
        if (k < items.length - 1) await press('[data-act="next"]');
      }
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '16 out of 16 right (100%)', 'score');
      await b.load(url(H19('#tests?test=vocab')));
      eq([await progress(), await b.js('return document.querySelectorAll("#act-stage input:checked").length;')], ['Question 1 of 16', 0], 'refresh starts again');
    });
    await check('weeks never mix: changing the week leaves the activity, and homework shows only that week\'s work', async () => {
      await b.load(url(H19('#vocab?act=choice')));
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-12"; s.dispatchEvent(new Event("change"));');
      await b.waitFor('location.hash === "#vocab?week=2026-10-12" && document.querySelector("#app h1")?.textContent === "Vocabulary"');
      await b.hash('#homework?week=2026-10-12');
      eq(await b.js('return [...document.querySelectorAll(".hw-received strong")].map((s) => s.textContent);'),
        ['Distributive Property worksheet', 'Multiplying multiples of 10 worksheet'], 'Oct 12 received work');
      await b.hash(H19('#homework'));
      eq(await b.js('return [[...document.querySelectorAll(".hw-received strong")].map((s) => s.textContent), document.querySelector(".page-head .intro").textContent];'),
        [['Rounding to the Nearest 10 or 100 worksheet'], '1 classroom assignment was received for this week.'], 'Oct 19 received work');
      // Its practice link opens Skill Builders > Rounding, and the worksheet itself is never on the page.
      eq(await b.js('return document.querySelector(".hw-received a.action").getAttribute("href");'), H19('#skills?act=round'), 'practice link (in its own week)');
      eq(await b.js('return document.querySelectorAll("#app img, #app object, #app iframe, #app embed").length;'), 0, 'no worksheet image');
      await go('.hw-received a.action');
      eq(await b.js('return document.querySelector("h1").textContent;'), 'Rounding', 'opens the Rounding card');
    });

    await check('contrast and touch targets also hold after feedback, on a flipped and marked card, with the unanswered warning and on results', async () => {
      const states = [
        [H19('#vocab?act=truefalse'), async () => { await pickText('True'); await checkIt(); }],
        [H19('#vocab?act=fill'), async () => { await typeIn('x'); await checkIt(); await press('[data-act="help"]'); }],
        [H19('#spelling?act=letters'), async () => { await b.js('document.querySelectorAll("#act-stage input.letter").forEach((el) => { el.value = "x"; }); document.querySelector("#act-stage form").dispatchEvent(new Event("input", { bubbles: true }));'); await checkIt(); }],
        [H19('#spelling?act=flash'), async () => { await press('[data-act="flip"]'); await press('[data-mark="known"]'); }],
        [H19('#tests?test=vocab'), async () => { for (let k = 0; k < 15; k++) await press('[data-act="next"]'); await press('[data-act="submit"]'); }],
        [H19('#tests?test=math'), async () => { for (let k = 0; k < 19; k++) await press('[data-act="next"]'); await press('[data-act="submit"]'); await press('[data-act="submit"]'); }],
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


    console.log('Oct 26–30 (this week): spelling -er/-or, vocabulary green-word quiz, Topic 6 Area');
    const W26 = readJSON('data/2026-10-26.json');
    const T26 = readJSON('data/tests/2026-10-26.json');
    const AREA = readJSON('data/practice/area.json');
    const GREEN = ['Trustworthy', 'Constellations', 'Irritating', 'Distracted'];
    const SP26 = W26.spelling;
    const byNo26 = (id) => SP26.words[Number(/(\d+)$/.exec(id)[1]) - 1];

    await check('Oct 26 Spelling: Learn My Words groups the -er and -or words by rule; no made-up base words', async () => {
      await b.load(url('#spelling'));
      eq(await b.js('return document.getElementById("weekSelect").value;'), OCT26, 'Oct 26 is the default week');
      await go('.menu-card[href="#spelling?act=learn"]');
      const groups = await b.js('return [...document.querySelectorAll(".rule-group, .words")].length;');
      expect(groups > 0, 'rule groups shown');
      const text = await b.js('return document.getElementById("app").textContent;');
      for (const r of Object.values(SP26.rules)) expect(text.includes(r), `rule shown: ${r}`);
      expect(text.includes('from act') && text.includes('from conduct') && text.includes('from swim'), 'real base words are shown');
      expect(!/from doct|from tract/.test(text), 'doctor and tractor have no made-up base word');
      // Every -or word is spelled with -or, every other word with -er (the rule matches the word).
      for (const w of SP26.words) eq(w.word.endsWith('or'), /or$/.test(w.rule), `${w.word}: rule ${w.rule}`);
    });
    await check('Oct 26 Spelling Missing Letters: 20 questions, the word never shown, the -er/-or ending hidden, letters checked', async () => {
      await b.load(url('#spelling?act=letters'));
      const seen = [];
      for (let k = 0; k < 20; k++) {
        const id = await formId();
        const w = byNo26(id);
        eq(id.startsWith('ml2-'), k >= 15, 'second looks come after every word');
        const item = (k >= 15 ? lettersAgainItem : lettersItem)(w, SP26);
        seen.push(w.word);
        expect(!(await stageText()).includes(w.word), `${w.word} is not shown before it is answered`);
        expect(!(await b.js('return document.getElementById("act-stage").innerHTML;')).includes(w.word), `${w.word} is not in the page source`);
        // First look: the letter that decides -er or -or is one of the boxes.
        if (k < 15) expect(item.blanks.includes(w.word.length - 2) || item.blanks.includes(w.word.length - 3), `${w.word}: the ending is practised`);
        const sol = solution(item);
        if (k === 0) {
          await answer(item, Object.fromEntries(Object.keys(sol).map((n) => [n, 'x'])));
          await checkIt();
          expect((await actFb()).startsWith('Not yet'), 'wrong letters: Not yet');
          await press('#act-stage [data-act="help"]');
          await press('#act-stage [data-act="help"]');
          const help = await b.js('return [...document.querySelectorAll(".help-steps li")].map((l) => l.textContent).join(" | ");');
          expect(!help.includes(w.word) && !/doct|tract"/.test(help), 'Help hints never give the word or a made-up base: ' + help);
        }
        await answer(item, sol);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), `${w.word}: ${await actFb()}`);
        await nextQ();
      }
      eq([...new Set(seen.slice(0, 15))].sort(), SP26.words.map((w) => w.word).sort(), 'every word once in the first 15');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'results');
      await go(`.stage-nav a[href="#spelling?act=misses"]`);
      eq(await progress(), 'Question 1 of 1', 'Practice My Misses has the missed word');
    });
    await check('Oct 26 Listen & Spell: 20 questions; says word, sentence, word; "add the ending" only for words with a base word', async () => {
      await b.load(url('#spelling?act=listen'));
      await b.js(STUB_SPEECH);
      const kinds = [];
      for (let k = 0; k < 20; k++) {
        const id = await formId();
        const w = byNo26(id);
        kinds.push(id.slice(0, 2));
        expect(!(await stageText()).includes(w.word), `${w.word} is not on the screen`);
        if (id.startsWith('sp-')) {
          await b.js('window.__spoken = []; document.querySelector("[data-act=dictate]").click();');
          eq(await b.js('return __spoken;'), [[w.word, 0.8], [w.sentence, 0.8], [w.word, 0.8]], `${w.word}: word, sentence, word`);
        } else {
          expect(!w.whole, `${w.word}: "add the ending" needs a base word`);
          expect((await qPrompt()).includes(`"${w.base}"`), `${w.word}: names its base word`);
        }
        if (k === 1) { await typeIn(w.word.replace(/er$/, 'or').replace(/or$/, (m) => (w.word.endsWith('or') ? 'er' : m))); await checkIt(); expect((await actFb()).startsWith('Not yet'), 'the wrong ending is caught'); }
        await typeIn(` ${w.word.toUpperCase()} `);
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), `${w.word}: ${await actFb()}`);
        await nextQ();
      }
      eq([kinds.filter((x) => x === 'sp').length, kinds.filter((x) => x === 'bw').length], [15, 5], '15 spoken words, then 5 built words');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'results');
      eq(await b.js('return [...document.querySelectorAll(".stage-nav a")].map((a) => a.getAttribute("href"));'), ['#spelling?act=misses', '#week', '#spelling'], 'Practice My Misses, Home, Choose another activity');
    });
    await check('Oct 26 Flashcards: front never shows the word; back shows the word, its own drawing, rule and sentence', async () => {
      await b.load(url('#spelling?act=flash'));
      for (let k = 0; k < SP26.words.length; k++) {
        const w = SP26.words[k];
        expect(!(await b.js('return document.getElementById("act-stage").innerHTML;')).includes(w.word), `${w.word}: front`);
        await press('.flip-btn');
        await b.waitFor('[...document.querySelectorAll(".flashcard img")].every((i) => i.complete && i.naturalWidth > 0)');
        eq(await b.js('return [document.querySelector(".flash-word").textContent, document.querySelector(".flashcard img").getAttribute("src"), document.querySelector(".flash-rule").firstChild.textContent, document.querySelector(".flashcard .sentence").textContent];'),
          [w.word, `images/words/${w.word}.webp`, SP26.rules[w.rule], w.sentence], `${w.word}: back`);
        if (k < SP26.words.length - 1) await press('[data-act="card-next"]');
      }
      eq(await b.js('return document.querySelector(".stage-nav a.btn-primary").getAttribute("href");'), '#spelling', 'Done goes back to the menu');
    });
    await check('Oct 26 Spelling practice test: the 15 newsletter words, each once, read aloud, never shown, scored', async () => {
      await b.load(url('#tests?test=spelling'));
      await b.js(STUB_SPEECH);
      const asked = [];
      for (let k = 0; k < 15; k++) {
        await b.js('document.querySelector("[data-act=dictate]").click();');
        const w = await b.js('return __spoken[__spoken.length - 1][0];');
        asked.push(w);
        expect(!(await b.js('return document.getElementById("app").innerHTML;')).includes(w), `${w} is not in the page source`);
        eq(await b.js('return document.querySelectorAll("#app img, #act-stage [data-act=help], #act-stage .feedback").length;'), 0, 'no picture, Help or feedback');
        await typeIn(k === 0 ? w.replace(/(er|or)$/, (m) => (m === 'er' ? 'or' : 'er')) : w);
        if (k < 14) await press('[data-act="next"]');
      }
      eq([...asked].sort(), SP26.words.map((w) => w.word).sort(), 'all 15 words, each once');
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '14 out of 15 right (93%)', 'score');
      eq(await b.js('return document.querySelectorAll(".review li").length;'), 1, 'the missed word is reviewed');
      eq(await b.js('return [...document.querySelectorAll(".stage-nav a")].map((a) => a.getAttribute("href"));'), ['#spelling?act=misses', '#spelling', '#week', '#tests'], 'Practice My Misses, Practice Spelling, Home, Back to Tests');
    });
    await check('Oct 26 Vocabulary: 12 study cards with the teacher\'s exact words; 20 Multiple Choice, 20 True or False, 20 Fill in the Blank', async () => {
      await b.load(url('#vocab?act=learn'));
      const defs = [];
      for (let k = 0; k < 12; k++) {
        defs.push(await b.js('return [document.querySelector(".study-one .vocab-word").textContent, document.querySelector(".study-one .def").textContent];'));
        if (k < 11) await press('[data-act=card-next]');
      }
      eq(defs, W26.vocab.words.map((w) => [w.word, w.def]), 'all 12 words with the teacher\'s definitions');
      const counts = [];
      for (const act of ['choice', 'truefalse', 'fill']) { await b.load(url(`#vocab?act=${act}`)); counts.push(await progress()); }
      eq(counts, ['Question 1 of 20', 'Question 1 of 20', 'Question 1 of 20'], 'twenty each');
      // Fill in the Blank, all the way: every sentence is one of the week's, with a hint after a miss.
      await b.load(url('#vocab?act=fill'));
      for (let k = 0; k < 20; k++) {
        const pr = await qPrompt();
        const w = W26.vocab.words.find((x) => x.fill === pr || x.sentence.replace(new RegExp(x.word + '[a-z]*', 'i'), '___') === pr);
        expect(w, 'an Oct 26 sentence: ' + pr);
        if (k === 0) { await typeIn('produce' === w.word.toLowerCase() ? 'employee' : 'produce'); await checkIt(); expect((await actFb()).includes('means:'), 'a wrong word says what it means'); await press('#act-stage [data-act="help"]'); }
        await typeIn(w.word.toLowerCase());
        await checkIt();
        expect((await actFb()).startsWith('Yes!'), `${w.word}: ${await actFb()}`);
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'results');
    });
    await check('Oct 26 Vocabulary practice test: 16 questions on the four green words only, no hints, scored, reviewed', async () => {
      await b.load(url('#tests'));
      const card = await b.js('return document.querySelector(".test-vocab").textContent;');
      expect(card.includes('Trustworthy, Constellations, Irritating, and Distracted only'), 'the card names the four green words');
      await go('.test-vocab a.btn-primary');
      eq(await progress(), 'Question 1 of 16', '16 questions');
      const others = W26.vocab.words.map((w) => w.word).filter((w) => !GREEN.includes(w));
      for (const [k, item] of T26.vocab.items.entries()) {
        expect(GREEN.includes(item.word), `${item.id} is about a green word`);
        const shown = await stageText();
        for (const o of others) expect(!new RegExp(`\\b${o}\\b`, 'i').test(shown), `${item.id} never shows ${o}`);
        eq(await b.js('return document.querySelectorAll("#act-stage [data-act=help], #act-stage [data-act=hint], #act-stage .feedback").length;'), 0, 'no hints or feedback');
        await answer(item, k === 0 ? { choice: item.options.findIndex((o) => !o.correct) } : solution(item));
        if (k < 15) await press('[data-act="next"]');
      }
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '15 out of 16 right (94%)', 'score');
      expect(await b.js('return document.body.textContent.includes("You passed!");'), '13 or more passes');
      eq(await b.js('return document.querySelectorAll(".review li").length;'), 1, 'one question to look at again, with its answer');
    });
    await check('Oct 26 Test Center: the Chapter 6 Practice Test, spelling, green-word vocabulary and the Nov 3 Math Vocabulary test', async () => {
      await b.load(url('#tests'));
      eq(await b.js('return [...document.querySelectorAll(".test-card")].map((c) => [c.querySelector("h3").textContent, c.querySelector(".topic")?.textContent, c.querySelector(".facts div:first-child dt").textContent, c.querySelector(".facts div:first-child dd").textContent, c.querySelector(".facts div:last-child dd").textContent, !!c.querySelector("a.btn")]);'),
        [['Chapter 6 Practice Test', 'Chapter 6: Connect Area and Multiplication', 'Review of', 'Chapter 6 (all lessons)', '27', true],
          ['Spelling Practice Test', '-er / -or words', 'Class test', 'Friday, October 30', '15', true],
          ['Vocabulary Practice Test', 'Because of Winn-Dixie — Four Green Words', 'Class test', 'Friday, October 30', '16', true],
          ['Math Vocabulary Practice Test', 'Nov 3 words: Area, Square Unit, Multiply', 'Class test', 'Tuesday, November 3', '12', true]], 'cards');
    });
    const AV = AREA.vocab;
    const avAll = [...AV.choice, ...AV.truefalse, ...AV.fill];
    /** Answers the question on screen (choices are shuffled, so the right one is found by its text). */
    const answerOnScreen = async (item, wrong = false) => {
      if (item.type === 'choice') await pickText(item.options.find((o) => (wrong ? !o.correct : o.correct)).text);
      else if (item.type === 'word') await typeIn(wrong ? 'xyz' : item.answer);
      else await answer(item, wrong ? { answer: 999 } : solution(item));
    };
    await check('Oct 26 Math: Topic 6: Area hub, Learn Area, Mixed Practice (20) with Help and misses, Back and Home', async () => {
      await b.load(url('#math'));
      await go('.menu-card[href="#math?act=area"]');
      eq(await b.js('return [document.querySelector("#app h1").textContent, [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent.trim())];'),
        ['Topic 6: Area', ['Learn Area', 'Chapter 6 Lessons', 'Area Words', 'Mixed Practice', 'Chapter 6 Review', 'Practice My Misses']], 'the Area menu');
      expect(await b.js('return !!document.querySelector(".menu-card[href=\'#math?act=ch6\']");'), 'Chapter 6 Lessons opens the chapter');
      await go('.menu-card[href="#math?act=arealearn"]');
      eq(await b.js('return [...document.querySelectorAll(".area-word h3")].map((h) => h.textContent);'), ['1. Area', '2. Square Unit', '3. Multiply'], 'three words');
      eq(await b.js('return [...document.querySelectorAll(".bar-btns a")].map((a) => a.getAttribute("href"));'), ['#math?act=area', '#math', '#week'], 'Back to Topic 6, Back to Math, Home');
      await go('.stage-nav a.btn-primary[href="#math?act=areafind"]');
      eq(await progress(), 'Question 1 of 20', 'Mixed Practice: 20 questions');
      for (let k = 0; k < 20; k++) {
        const fid = await formId();
        const item = AREA.find.find((it) => it.id === fid);
        expect(item, 'a known Area question');
        if (k === 0) {
          await answerOnScreen(item, true); await checkIt();
          expect((await actFb()).startsWith('Not yet'), 'Not yet');
          await press('#act-stage [data-act="help"]');
          eq(await b.js('return document.querySelectorAll(".help-steps li").length;'), 1, 'Help opens one step');
        }
        await answerOnScreen(item); await checkIt();
        expect((await actFb()).startsWith('Yes'), `${item.id}: ${await actFb()}`);
        await nextQ();
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '19 out of 20 right on the first try (95%)', 'results');
      await b.hash('#math?act=area');
      eq(await b.js('return document.querySelector(".menu-card.misses .count-badge")?.textContent.replace(/\\D/g, "");'), '1', 'one miss to practise');
      await go('.menu-card[href="#math?act=areamisses"]');
      eq(await progress(), 'Question 1 of 1', 'Practice My Misses');
      await b.hash('#math?act=misses');
      eq(await progress(), 'Nothing to practice yet', 'Unit 5 practice misses stay separate');
    });
    await check('Oct 26 Area Words: Review My Words and Flashcards (8 words), three 20-question quizzes, misses of their own', async () => {
      await b.load(url('#math?act=areawords'));
      eq(await b.js('return [...document.querySelectorAll(".menu-card .mc-title")].map((t) => t.textContent.trim());'),
        ['Review My Words', 'Flashcards', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses'], 'Area Words menu');
      await go('.menu-card[href="#math?act=avreview"]');
      const cards = [];
      for (let k = 0; k < AV.words.length; k++) {
        cards.push(await b.js('const c = document.getElementById("act-stage"); return [c.querySelector(".vocab-word").textContent, c.querySelector(".teacher-words .label").textContent, c.querySelector(".def").textContent, c.querySelector(".word-tag").textContent, c.querySelectorAll(".model-svg").length];'));
        if (k < AV.words.length - 1) await press('[data-act="card-next"]');
      }
      eq(cards, AV.words.map((w) => [w.word, w.teacher ? "Teacher's words" : 'Meaning', w.def, w.teacher ? 'Nov 3 test word' : 'Chapter review word', 1]), 'every word: picture, tag and meaning');
      for (const w of ['Area', 'Square Unit', 'Multiply']) eq(cards.find((c) => c[0] === w)[2], W26.math.words.find((x) => x.word === w).def, `${w}: teacher's words exactly`);
      await b.hash('#math?act=avflash');
      expect(!(await b.js('return document.getElementById("act-stage").textContent;')).includes(AV.words[0].word + ' '), 'the front does not name the word');
      let before = await rendered();
      await b.clickAt('.flashcard');
      await afterAction(before);
      eq(await b.js('return document.querySelector(".flash-word").textContent;'), AV.words[0].word, 'a click turns the card over');
      before = await rendered(); await b.key('Enter'); await afterAction(before);
      eq(await b.js('return document.querySelectorAll(".flashcard .flash-word").length;'), 0, 'Enter turns it back');
      for (const [act, mode] of [['avchoice', 'choice'], ['avtf', 'truefalse'], ['avfill', 'fill']]) {
        await b.hash(`#math?act=${act}`);
        eq(await progress(), 'Question 1 of 20', `${act}: 20 questions`);
        for (let k = 0; k < 20; k++) {
          const fid = await formId();
          const item = AV[mode].find((it) => it.id === fid);
          expect(item, `${act}: a known question ${fid}`);
          if (k === 0 && mode === 'choice') { await answerOnScreen(item, true); await checkIt(); expect((await actFb()).startsWith('Not yet'), 'a wrong choice'); }
          await answerOnScreen(item); await checkIt();
          expect((await actFb()).startsWith('Yes'), `${item.id}: ${await actFb()}`);
          await nextQ();
        }
      }
      await b.hash('#math?act=areawords');
      eq(await b.js('return document.querySelector(".menu-card.misses .count-badge")?.textContent.replace(/\\D/g, "");'), '1', 'one word miss');
      await b.hash('#math?act=areamisses');
      eq(await progress(), 'Nothing to practice yet', 'Mixed Practice misses are kept apart');
    });
    await check('Oct 26 Chapter 6 Practice Test: 27 questions from all six lessons, no hints, a score for each lesson, review', async () => {
      await b.load(url('#tests?test=math'));
      const items = T26.math.items;
      eq(await progress(), 'Question 1 of 27', '27 questions');
      for (const [k, item] of items.entries()) {
        eq(await b.js('return document.querySelectorAll("#act-stage [data-act=help], #act-stage button[type=submit], #act-stage .feedback").length;'), 0, `no help on ${item.id}`);
        if (item.model?.type === 'grid') eq(await b.js('return document.querySelectorAll("#act-stage .g-tile").length;'), item.model.cells.join('').split('X').length - 1, `${item.id}: the picture has its tiles`);
        if (item.id === 'c9') await answer(item, { answer: 11 });   // 7 + 4: added instead of multiplied
        else await answer(item, item.type === 'word' ? { text: item.answer } : solution(item));
        if (k < items.length - 1) await press('[data-act="next"]');
      }
      await press('[data-act="submit"]');
      eq(await b.js('return document.querySelector(".summary-score").textContent;'), '26 out of 27 right (96%)', 'score');
      eq(await b.js('return [...document.querySelectorAll(".skills tr")].map((r) => r.lastElementChild.textContent);'), ['4 of 4', '4 of 4', '4 of 5', '4 of 4', '5 of 5', '5 of 5'], 'a score for each lesson');
      eq(await b.js('return [...document.querySelectorAll(".review li")].map((l) => [l.querySelector(".you").textContent, l.querySelector(".right").textContent]);'), [['Your answer: 11', 'Correct answer: 28']], 'review');
      expect(await b.js('return !!document.querySelector(".stage-nav a[href=\'#math?act=area\']");'), 'Practice goes back to Topic 6: Area');
    });
    await check('Oct 26 Nov 3 Math Vocabulary test: 12 questions on Area, Square Unit and Multiply only; a miss goes to Area Words', async () => {
      await b.load(url('#tests?test=mathwords'));
      eq(await progress(), 'Question 1 of 12', '12 questions');
      const pool = AV.test;
      for (let k = 0; k < 12; k++) {
        const p = await qPrompt();
        const item = pool.find((it) => it.prompt === p);
        expect(item && ['Area', 'Square Unit', 'Multiply'].includes(item.word), `a Nov 3 word question: ${p}`);
        eq(await b.js('return document.querySelectorAll("#act-stage [data-act=help], #act-stage .feedback").length;'), 0, 'no hints');
        const fid = await formId();
        if (item.type === 'choice') await b.js(`const f = document.querySelector('form[data-item="${fid}"]'); [...f.querySelectorAll('label.choice')].find((l) => l.textContent.trim() === ${JSON.stringify(item.options.find((o) => (k === 0 ? !o.correct : o.correct)).text)}).querySelector('input').click(); f.dispatchEvent(new Event('change', { bubbles: true }));`);
        else await b.js(`const f = document.querySelector('form[data-item="${fid}"]'); f.querySelector('input[name=text]').value = ${JSON.stringify(item.answer)}; f.dispatchEvent(new Event('input', { bubbles: true }));`);
        await press(k < 11 ? '[data-act="next"]' : '[data-act="submit"]');
      }
      eq(await b.js('return document.querySelector(".summary-score").textContent.replace(/\\s+/g, " ").trim();'), '11 out of 12 right (92%)', 'score');
      eq(await b.js('return [...document.querySelectorAll(".stage-nav a")].map((a) => a.getAttribute("href"));'), ['#math?act=avmisses', '#math?act=areawords', '#week', '#tests'], 'Practice My Misses (Area Words), Practice, Home, Back to Tests');
      await go('.stage-nav a[href="#math?act=avmisses"]');
      eq(await progress(), 'Question 1 of 1', 'the missed word is in Area Words > Practice My Misses');
    });
    await check('Oct 26 Homework: only what the newsletter says (no packet pages invented), and weeks never mix', async () => {
      await b.load(url('#homework'));
      eq(await b.js('return [document.querySelector(".page-head .intro").textContent, [...document.querySelectorAll(".hw-received strong")].length, !!document.querySelector(".packet-card")];'),
        ['No classroom worksheets have been received for this week yet.', 0, false], 'nothing received yet, no packet');
      expect((await b.js('return document.getElementById("app").textContent;')).includes('3 spelling activities'), 'the three spelling activities');
      // Switch from an Oct 26 activity to Oct 19 and back: each week keeps its own words.
      await b.load(url('#spelling?act=learn'));
      let before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-19"; s.dispatchEvent(new Event("change"));');
      await b.ready(before);
      eq(await b.js('return location.hash;'), H19('#spelling'), 'changing the week leaves the activity for that week\'s menu');
      await b.hash(H19('#spelling?act=learn'));
      const w19 = await b.js('return [...document.querySelectorAll(".words .word")].map((e) => e.textContent).sort();');
      eq(w19, W19.spelling.words.map((w) => w.word).sort(), 'Oct 19 words only');
      await b.hash(H19('#tests'));
      eq(await b.js('return document.querySelector(".test-math .topic").textContent;'), T19.math.topic, 'the Oct 19 math test');
      before = await b.js('return document.getElementById("app").dataset.ready;');
      await b.js('const s = document.getElementById("weekSelect"); s.value = "2026-10-26"; s.dispatchEvent(new Event("change"));');
      await b.ready(before);
      eq(await b.js('return [location.hash, document.querySelector(".test-math .topic").textContent];'), ['#tests', 'Topic 6: Area'], 'back to Oct 26');
      await b.hash('#math?act=area');
      await b.hash(H19('#math?act=area'));
      expect((await b.js('return document.getElementById("app").textContent;')).includes('Area is not this week'), 'an Area link in Oct 19 says Area is another week');
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
            ['underline', q.p.digits.length > Number(wrongPlace) + 1 ? '"↓" / ""' : 'none'], 'underline and arrow (the arrow is drawn, not read aloud)');
          await checkIt();
          expect((await actFb()).includes('underline the digit in the tens place'), `wrong digit: ${await actFb()}`);
          // Focus stays on the digit the child chose, never on another digit (which would hint at the answer).
          eq(await b.js('return [document.activeElement?.name, document.activeElement?.value];'), ['place', wrongPlace], 'focus on the chosen digit');
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


    console.log('Homework packet (D23)');
    const PACKET = readJSON('data/homework/2026-10-19.json');
    const PACKET_ITEMS = PACKET.pages.flatMap((pg) => pg.problems.flatMap((pr) => pr.items));
    /** Answers one packet question the way a child would (ticks, taps, types), then presses its Check Answer. */
    const packetAnswer = async (it, values) => {
      await b.js(`const f = document.querySelector('form[data-item="${it.id}"]'); const v = ${JSON.stringify(values)};
        f.querySelectorAll('input[type=checkbox]').forEach((c) => { c.checked = false; });
        for (const [k, x] of Object.entries(v)) {
          if (k === 'multi') { String(x).split(',').forEach((i) => { f.querySelector('input[type=checkbox][value="' + i + '"]').checked = true; }); continue; }
          if (k === 'choice') { f.querySelector('input[name=choice][value="' + x + '"]').click(); continue; }
          const el = f.querySelector('[name="' + k + '"]'); if (el) el.value = String(x);
        }
        f.dispatchEvent(new Event('input', { bubbles: true }));`);
      await press(`form[data-item="${it.id}"] button[type=submit]`);
    };
    const packetFb = (id) => b.js(`const e = document.querySelector('form[data-item="${id}"] .feedback.ok, form[data-item="${id}"] .feedback.notyet, form[data-item="${id}"] .feedback.compare'); if (!e) return ''; const c = e.cloneNode(true); c.querySelectorAll('.read').forEach((x) => x.remove()); return c.textContent.replace(/\\s+/g, ' ').trim();`);

    await check('Oct 19–23 Homework: do that week\'s packet on the computer, every question in order, with reasons, Help, a download and Save my work', async () => {
      // The packet received for Oct 19–23 (data/homework/index.json); the Oct 26 packet has not been received yet.
      await b.load(url(H19('#homework')));
      eq(await b.js('return [document.querySelector("#h-packet")?.textContent, document.querySelector(".packet-card a.btn-primary").getAttribute("href"), document.querySelector(".packet-card a[download]").getAttribute("href")];'),
        ["Do this week's homework on the computer", H19('#homework?act=packet'), 'downloads/homework-2026-10-19.pdf'], 'the packet card');
      // The download is a real PDF.
      eq(await b.js('const r = await fetch("downloads/homework-2026-10-19.pdf"); const t = await r.text(); return [r.status, t.slice(0, 4)];'), [200, '%PDF'], 'download');
      await go('.packet-card a.btn-primary');
      eq(await b.js('return [...document.querySelectorAll(".packet-title")].map((h) => h.textContent.replace(/\\s+/g, " ").trim());'),
        ['Page 1 Rounding to the Nearest 10 or 100', 'Page 2 Reading: The Pumpkin Patch Plan', 'Page 3 Word Problems: Multiply or Divide?'], 'pages in order');
      // Every question is on the page, except the meaning check, which waits for its written answer.
      eq(await b.js('return document.querySelectorAll("form[data-item]").length;'), PACKET_ITEMS.filter((it) => !it.after).length, 'every question on the page');
      eq(await b.js('return document.querySelectorAll(".passage-lines .pl-count").length > 10 && document.querySelector(".passage-lines li:last-child .pl-count").textContent;'), String(PACKET.pages[1].passage.text.trim().split(/\s+/).length), 'running word count');
      // A wrong choice says why; Help opens one step; then every question is answered right.
      const r1 = PACKET_ITEMS[0];
      await packetAnswer(r1, { multi: '0,1' });
      eq(await packetFb('r1'), 'Not yet 451 rounds to 500. Its tens digit is 5, so the 4 goes up. Press Help to see one step at a time.', 'why the choice is wrong');
      await press('form[data-item="r1"] [data-act="help"]');
      eq(await b.js('return document.querySelectorAll("form[data-item=r1] .help-steps li").length;'), 1, 'one Help step');
      const q1 = PACKET_ITEMS.find((it) => it.id === 'q1');
      await packetAnswer(q1, { text: 'He could not go anywhere.' });
      expect((await packetFb('q1')).startsWith('Not yet Write a little more'), `sentence check: ${await packetFb('q1')}`);
      // The equation's sign stays hidden until "I need to…" is answered, and the meaning check waits for Question 2.
      expect(!(await b.js('return document.querySelector("form[data-item=w1eq]").textContent.includes("÷");')), 'the ÷ sign is hidden at first');
      eq(await b.js('return [!!document.querySelector("form[data-item=q2check]"), !!document.querySelector(".locked")];'), [false, true], 'meaning check locked');
      for (const it of PACKET_ITEMS) {
        const sol = Object.fromEntries(Object.entries(solution(it)).map(([k, v]) => [k, String(v)]));
        await packetAnswer(it, it.type === 'sentence' ? { text: it.example } : sol);
        expect(/^(Yes!|Compare your answer Your sentence has all its parts)/.test(await packetFb(it.id)), `${it.id}: ${await packetFb(it.id)}`);
      }
      eq(await b.js('return document.querySelector(".packet-progress p strong").textContent;'), `${PACKET_ITEMS.length} of ${PACKET_ITEMS.length}`, 'all done');
      expect(await b.js('return document.querySelector("form[data-item=w1eq]").textContent.includes("÷");'), 'the ÷ sign shows once the operation is chosen');
      // Written sentences are compared, not scored as "right".
      expect(await b.js('return document.querySelector(".packet-progress").textContent.includes("right on the first try (written answers are compared");'), 'sentences not scored');
      // Save my work prints (or saves as PDF) the page with the answers; on paper the buttons and messages are gone.
      await b.js('window.__printed = 0; window.print = () => { window.__printed++; };');
      await b.js('document.querySelector(".packet-intro [data-act=print]").click();');
      eq(await b.js('return window.__printed;'), 1, 'Save my work');
      await b.media('print');
      eq(await b.js('return [getComputedStyle(document.querySelector("form[data-item=r4] .btn-row") || document.body).display, getComputedStyle(document.querySelector(".packet-intro")).display, document.querySelector("form[data-item=r4] input[name=answer]").value];'),
        ['none', 'none', '40'], 'printed with answers, without buttons');
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
      expect((await f.js('return document.querySelector(".page-head .intro").textContent;')).startsWith('Sample <b>book</b> title · '), 'title text');
      await f.hash('#vocab?act=learn');
      eq(await f.js('return [document.querySelector("#app b"), document.querySelector(".def").textContent];'),
        [null, 'a small part that shows what the whole is like <with symbols & "quotes">'], 'escaping');
    });
    await check('a week without math or pictures still works (missing pictures are hidden)', async () => {
      await f.wait(300);
      eq(await f.js('return document.querySelectorAll(".study-one .pic").length;'), 0, 'picture frames removed');
      await f.hash('#math?act=learn');
      eq(await f.js('return [document.querySelector("#act-stage h3").textContent, document.querySelector("#act-stage .teacher-words .def")?.textContent];'), ['Identity Property', 'any number multiplied by one is that number'],
        'a week without math still shows Unit 5 with the teacher\'s words from the week that announced them (Oct 19)');
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
