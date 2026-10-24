// Renders every section for every week (including the sample week) without a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHash } from '../../js/lib/router.js';
import { chapterFor } from '../../js/lib/chapters.js';
import { esc } from '../../js/lib/html.js';
import { weekView } from '../../js/views/week.js';
import { spellingView } from '../../js/views/spelling.js';
import { vocabView } from '../../js/views/vocab.js';
import { mathView } from '../../js/views/math.js';
import { skillsView } from '../../js/views/skills.js';
import { homeworkView } from '../../js/views/homework.js';
import { newsletterView } from '../../js/views/newsletter.js';
import { testsView } from '../../js/views/tests.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const VIEWS = { week: weekView, spelling: spellingView, vocab: vocabView, math: mathView,
  skills: skillsView, homework: homeworkView, newsletter: newsletterView, tests: testsView };

const LESSONS = readJSON('data/lessons/index.json');
const PICTURES = readJSON('data/pictures.json');
function ctxFor(index, weekId, section, week) {
  return { week, index, weekId, section, isCurrent: weekId === index.current, today: new Date(2026, 9, 16, 12),
    link: (s, id = weekId) => buildHash(s, id, index.current),
    lessonLink: (id, stage) => buildHash('math', weekId, index.current, { lesson: id, stage }),
    actLink: (s, act) => buildHash(s, weekId, index.current, { act }),
    chapterLink: (id) => buildHash('math', weekId, index.current, { ch: id }),
    testLink: (kind) => buildHash('tests', weekId, index.current, { test: kind }),
    tests: weekId === '2026-10-19' ? readJSON('data/tests/2026-10-19.json') : null, misses: { vocab: 0, spelling: 0, math: 0 },
    practice: readJSON('data/practice/math.json'),
    lessons: LESSONS, pictures: PICTURES };
}

const cases = [];
const realIndex = readJSON('data/weeks.json');
const historicalIndex = { ...realIndex, current: '2026-10-19' }; // Explicit Oct 19 route assertions.
for (const { id } of realIndex.weeks) cases.push([realIndex, id, readJSON(`data/${id}.json`)]);
const fixtureIndex = readJSON('tests/fixtures/data/weeks.json');
cases.push([fixtureIndex, '2026-10-26', readJSON('tests/fixtures/data/2026-10-26.json')]);

for (const [index, id, week] of cases) {
  for (const [section, view] of Object.entries(VIEWS)) {
    test(`${id} ${section} renders`, () => {
      const out = view(ctxFor(index, id, section, week)).s;
      assert.equal((out.match(/<h1[\s>]/g) || []).length, 1, 'exactly one h1');
      assert.ok(out.includes(esc(week.label)), 'shows the week label');
      assert.doesNotMatch(out, /undefined|\bnull\b|NaN|\[object /, 'no missing values');
      assert.doesNotMatch(out, /<b>book<\/b>|<not real>/, 'data is escaped, never treated as markup');
      assert.doesNotMatch(out, /images\/newsletters|https?:\/\//, 'no newsletter photos or external links');
      assert.equal(out.includes('You are looking at an earlier week'), id !== index.current);
      // Headings never skip a level.
      const levels = [...out.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
      levels.forEach((l, i) => i && assert.ok(l <= levels[i - 1] + 1, `heading h${l} after h${levels[i - 1]}`));
    });
  }

  test(`${id} vocabulary opens on its menu; Learn My Words shows every teacher definition exactly (escaped)`, () => {
    const menu = vocabView(ctxFor(index, id, 'vocab', week)).s;
    for (const w of week.vocab.words) assert.ok(!menu.includes(esc(w.def)), `the menu comes first: ${w.word}`);
    for (const name of ['Learn My Words', 'Multiple Choice', 'True or False', 'Fill in the Blank', 'Practice My Misses']) assert.ok(menu.includes(name), name);
    week.vocab.words.forEach((w, i) => {
      const ctx = { ...ctxFor(index, id, 'vocab', week) };
      ctx.run = { subject: 'vocab', act: 'learn', mode: 'practice', title: 'Learn My Words', items: [], items_: {}, flash: { order: week.vocab.words.map((_, k) => k), i, flipped: false, marks: {} } };
      assert.ok(vocabView(ctx).s.includes(`<span class="def">${esc(w.def)}</span>`), w.word);
    });
  });

  test(`${id} spelling opens on its menu; Learn My Words lists every word once, under its rule`, () => {
    const menu = spellingView(ctxFor(index, id, 'spelling', week)).s;
    for (const name of ['Learn My Words', 'Flashcards', 'Missing Letters', 'Listen &amp; Spell', 'Practice My Misses']) assert.ok(menu.includes(name), name);
    assert.ok(!menu.includes('<span class="word">'), 'the word list is not on the menu');
    const out = spellingView({ ...ctxFor(index, id, 'spelling', week), page: 'learn' }).s;
    for (const w of week.spelling.words) {
      assert.equal(out.split(`<span class="word">${esc(w.word)}</span>`).length - 1, 1, w.word);
    }
  });
}

test('This Week counts down to each test from a fixed date', () => {
  const week = readJSON('data/2026-10-19.json');
  const out = weekView(ctxFor(historicalIndex, '2026-10-19', 'week', week)).s;
  assert.match(out, /In 5 days[\s\S]*Math Test[\s\S]*Wednesday, October 21/);
  assert.match(out, /In 7 days[\s\S]*Vocabulary Quiz[\s\S]*Friday, October 23/);
  const past = weekView(ctxFor(historicalIndex, '2026-10-12', 'week', readJSON('data/2026-10-12.json'))).s;
  assert.match(past, /Today[\s\S]*Friday, October 16/);
});

test('Skill Builders opens on three skill cards, each with Learn It, practice, Practice My Misses and a test', () => {
  const week = readJSON('data/2026-10-19.json');
  const ctx = ctxFor(historicalIndex, '2026-10-19', 'skills', week);
  const home = skillsView(ctx).s;
  for (const name of ['Mental Add', 'Rounding', 'Times Tables']) assert.ok(home.includes(name), name);
  assert.doesNotMatch(home, /Coming soon|<input|<select/);
  for (const [card, acts] of [['add', ['addlearn', 'addfacts', 'addsplit', 'addmisses', 'addtest']], ['round', ['roundlearn', 'roundten', 'roundhun', 'roundmisses', 'roundtest']], ['times', ['timeslearn', 'timespick', 'timesall', 'timestricky', 'timesmisses', 'timestest']]]) {
    const menu = skillsView({ ...ctx, page: card }).s;
    for (const a of acts) assert.match(menu, new RegExp(`act=${a}\\b`), `${card} menu links ${a}`);
    const learn = skillsView({ ...ctx, page: `${card}learn` }).s;
    assert.match(learn, /<h1[^>]*>[^<]+: Learn It</, `${card} Learn It`);
    assert.doesNotMatch(learn, /undefined|NaN|\[object /);
  }
  const pick = skillsView({ ...ctx, page: 'timespick' }).s;
  assert.match(pick, /<h1[^>]*>Pick My Facts</);
  for (let n = 1; n <= 12; n++) assert.match(pick, new RegExp(`data-fact="${n}"`), `fact ${n}`);
  for (const m of ['flash', 'find', 'quiz']) assert.match(pick, new RegExp(`data-mode="${m}"`), m);
  assert.doesNotMatch(pick, /undefined|NaN|\[object /);
});

test('Math opens on Choose Your Chapter; each chapter opens its own six activities and lists only its own lessons (D26)', () => {
  const week = readJSON('data/2026-10-19.json');
  const at = (extra) => { const c = ctxFor(historicalIndex, '2026-10-19', 'math', week); const x = { ...c, ...extra }; x.chapter = chapterFor(LESSONS, { ch: x.chapterMenu || null, act: x.page || null }); return x; };
  const math = mathView(at({})).s;
  assert.match(math, /Choose Your Chapter/);
  assert.ok(math.includes('href="#math?ch=5"') && math.includes('href="#math?ch=6"'), 'both chapter cards');
  assert.ok(math.includes('Chapter 5: Multiplication Properties and Strategies') && math.includes('Chapter 6: Connect Area and Multiplication'));
  // No Chapter 5 activity or lesson is listed on the chooser.
  assert.doesNotMatch(math, /href="#math\?(act|lesson)=/, 'the chooser lists chapters only');
  // Oct 19: the class is on Chapter 5; Chapter 6 is coming up. Oct 26: Chapter 6 now, Chapter 5 for review.
  assert.match(math, /Currently studying<\/span>\s*<span class="mc-title">Chapter 5/);
  const w26 = readJSON('data/2026-10-26.json');
  const m26 = mathView({ ...ctxFor(realIndex, '2026-10-26', 'math', w26), chapter: null }).s;
  assert.match(m26, /Available for review<\/span>\s*<span class="mc-title">Chapter 5/);
  assert.match(m26, /Currently studying<\/span>\s*<span class="mc-title">Chapter 6/);
  const acts = { 5: ['learn', 'words', 'ch5', 'practice', 'guide', 'ch5test'], 6: ['arealearn', 'areawords', 'ch6', 'areapractice', 'ch6guide', 'ch6test'] };
  for (const ch of [5, 6]) {
    const out = mathView(at({ chapterMenu: ch })).s;
    for (const a of acts[ch]) assert.ok(out.includes(`href="#math?act=${a}"`), `Chapter ${ch}: ${a}`);
    for (const a of acts[ch === 5 ? 6 : 5]) assert.ok(!out.includes(`href="#math?act=${a}"`), `Chapter ${ch} never links ${a}`);
    for (const l of ['Learn Vocabulary', 'Vocabulary Practice', 'Math Lessons', 'Practice Problems', 'Study Guide', 'Chapter Test']) assert.ok(out.includes(l), `Chapter ${ch}: ${l}`);
    const lessons = mathView(at({ page: `ch${ch}` })).s;
    for (const l of LESSONS.lessons) {
      for (const st of ['learn', 'watch', 'together', 'try', 'test']) assert.equal(lessons.includes(`href="#math?lesson=${l.id}&amp;stage=${st}"`), l.chapter === ch, `${l.id} ${st} in Chapter ${ch} Lessons`);
    }
    assert.ok(lessons.includes(`href="#math?ch=${ch}"`), 'Back to Chapter');
  }
  const practice = mathView(at({ page: 'practice' })).s;
  for (const act of ['props', 'split', 'breakapart', 'mixed', 'misses']) assert.ok(practice.includes(`href="#math?act=${act}"`), act);
  assert.match(practice, /Home<\/a><\/li><li><a href="#math">Math<\/a><\/li><li><a href="#math\?ch=5">Chapter 5<\/a><\/li><li><span aria-current="page">Practice Problems/, 'Home > Math > Chapter 5 > Practice Problems');
});

test('Learn the Properties uses the teacher\'s exact words when the week lists them, and works without them', () => {
  const card = (weekId, i) => {
    const week = readJSON(`data/${weekId}.json`);
    const ctx = ctxFor(historicalIndex, weekId, 'math', week);
    ctx.run = { subject: 'math', act: 'learn', mode: 'practice', title: 'Learn the Properties', items: [], items_: {}, flash: { order: [0, 1, 2, 3, 4], i, flipped: false, marks: {} } };
    return [week, mathView(ctx).s];
  };
  for (let i = 0; i < 5; i++) {
    const [week, out] = card('2026-10-19', i);
    const name = ['Identity', 'Zero', 'Commutative', 'Associative', 'Distributive'][i];
    const w = week.math.words.find((x) => x.word.startsWith(name));
    if (w) assert.ok(out.includes(`<span class="label">${esc("Teacher's words")}</span><span class="def">${esc(w.def)}</span>`), name);
    // The Associative Property is not in the week file: its definition is shown as a definition, never as the teacher's words.
    else assert.ok(out.includes('<span class="label">Definition</span>') && !out.includes(esc("Teacher's words")), name);
    assert.doesNotMatch(out, /undefined|NaN/);
    const [, old] = card('2026-10-12', i);
    assert.ok(!old.includes(esc("Teacher's words")) && !old.includes("Teacher's words"), `${name} without teacher words`);
    assert.ok(old.includes(`${name} Property`), name);
    // A later topic (Oct 26: Area) still shows Unit 5's teacher words: the app passes the week that announced them.
    const later = readJSON('data/2026-10-26.json');
    const lctx = ctxFor(realIndex, '2026-10-26', 'math', later);
    lctx.unit5Week = week;
    lctx.run = { subject: 'math', act: 'learn', mode: 'practice', title: 'Learn the Properties', items: [], items_: {}, flash: { order: [0, 1, 2, 3, 4], i, flipped: false, marks: {} } };
    const lout = mathView(lctx).s;
    if (w) assert.ok(lout.includes(`<span class="label">${esc("Teacher's words")}</span><span class="def">${esc(w.def)}</span>`), `${name} in the Area week`);
    assert.ok(!/Square Unit|unit squares/.test(lout), `${name}: no Area words on a property card`);
  }
});

test('newsletter lists every week with working links', () => {
  const week = readJSON('data/2026-10-19.json');
  const out = newsletterView(ctxFor(historicalIndex, '2026-10-19', 'newsletter', week)).s;
  assert.ok(out.includes('href="#newsletter"'));
  assert.ok(out.includes('href="#newsletter?week=2026-10-12"'));
});

test('homework checkboxes are labelled', () => {
  const week = readJSON('data/2026-10-19.json');
  const out = homeworkView(ctxFor(historicalIndex, '2026-10-19', 'homework', week)).s;
  const inputs = [...out.matchAll(/<input type="checkbox" id="(hw-\d+)">/g)].map((m) => m[1]);
  assert.equal(inputs.length, week.homework.length);
  for (const id of inputs) assert.ok(out.includes(`<label class="hw-check" for="${id}">`), id);
});
