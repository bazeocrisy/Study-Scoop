// Renders every section for every week (including the sample week) without a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHash } from '../../js/lib/router.js';
import { esc } from '../../js/lib/html.js';
import { weekView } from '../../js/views/week.js';
import { spellingView } from '../../js/views/spelling.js';
import { vocabView } from '../../js/views/vocab.js';
import { mathView } from '../../js/views/math.js';
import { quickmathView } from '../../js/views/quickmath.js';
import { homeworkView } from '../../js/views/homework.js';
import { newsletterView } from '../../js/views/newsletter.js';
import { testsView } from '../../js/views/tests.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const VIEWS = { week: weekView, spelling: spellingView, vocab: vocabView, math: mathView,
  quickmath: quickmathView, homework: homeworkView, newsletter: newsletterView, tests: testsView };

const LESSONS = readJSON('data/lessons/index.json');
const PICTURES = readJSON('data/pictures.json');
function ctxFor(index, weekId, section, week) {
  return { week, index, weekId, section, isCurrent: weekId === index.current, today: new Date(2026, 9, 16, 12),
    link: (s, id = weekId) => buildHash(s, id, index.current),
    lessonLink: (id, stage) => buildHash('math', weekId, index.current, { lesson: id, stage }),
    actLink: (s, act) => buildHash(s, weekId, index.current, { act }),
    testLink: (kind) => buildHash('tests', weekId, index.current, { test: kind }),
    tests: weekId === '2026-10-19' ? readJSON('data/tests/2026-10-19.json') : null, misses: { vocab: 0, spelling: 0, math: 0 },
    practice: readJSON('data/practice/math.json'),
    lessons: LESSONS, pictures: PICTURES };
}

const cases = [];
const realIndex = readJSON('data/weeks.json');
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
  const out = weekView(ctxFor(realIndex, '2026-10-19', 'week', week)).s;
  assert.match(out, /In 5 days[\s\S]*Math Test[\s\S]*Wednesday, October 21/);
  assert.match(out, /In 7 days[\s\S]*Vocabulary Quiz[\s\S]*Friday, October 23/);
  const past = weekView(ctxFor(realIndex, '2026-10-12', 'week', readJSON('data/2026-10-12.json'))).s;
  assert.match(past, /Today[\s\S]*Friday, October 16/);
});

test('unfinished activities are labelled "Coming soon" and have no buttons or form fields', () => {
  const week = readJSON('data/2026-10-19.json');
  for (const section of ['quickmath']) {
    const out = VIEWS[section](ctxFor(realIndex, '2026-10-19', section, week)).s;
    assert.match(out, /Coming soon/, section);
    assert.doesNotMatch(out, /<button|<input|<select/, section);
  }
  const qm = quickmathView(ctxFor(realIndex, '2026-10-19', 'quickmath', week)).s;
  for (const name of ['Make 10', 'Make 20', 'Make 50', 'Make 100', 'Make the Next 10', 'Mixed Mental Math']) {
    assert.ok(qm.includes(name), name);
  }
});

test('Math opens on its four choices; Math Lessons links every lesson step', () => {
  const week = readJSON('data/2026-10-19.json');
  const math = mathView(ctxFor(realIndex, '2026-10-19', 'math', week)).s;
  for (const [name, act] of [['Learn the Properties', 'learn'], ['Practice Problems', 'practice'], ['Math Lessons', 'lessons'], ['Study Guide', 'guide']]) {
    assert.ok(math.includes(name), name);
    assert.ok(math.includes(`href="#math?act=${act}"`), act);
  }
  assert.match(math, /What would you like to do\?/);
  const lessons = mathView({ ...ctxFor(realIndex, '2026-10-19', 'math', week), page: 'lessons' }).s;
  for (const id of ['5-1', '5-2']) {
    for (const st of ['learn', 'watch', 'together', 'try', 'test']) assert.ok(lessons.includes(`href="#math?lesson=${id}&amp;stage=${st}"`), `${id} ${st}`);
  }
  const practice = mathView({ ...ctxFor(realIndex, '2026-10-19', 'math', week), page: 'practice' }).s;
  for (const act of ['props', 'split', 'breakapart', 'mixed', 'misses']) assert.ok(practice.includes(`href="#math?act=${act}"`), act);
});

test('Learn the Properties uses the teacher\'s exact words when the week lists them, and works without them', () => {
  const card = (weekId, i) => {
    const week = readJSON(`data/${weekId}.json`);
    const ctx = ctxFor(realIndex, weekId, 'math', week);
    ctx.run = { subject: 'math', act: 'learn', mode: 'practice', title: 'Learn the Properties', items: [], items_: {}, flash: { order: [0, 1, 2, 3], i, flipped: false, marks: {} } };
    return [week, mathView(ctx).s];
  };
  for (let i = 0; i < 4; i++) {
    const [week, out] = card('2026-10-19', i);
    const name = ['Identity', 'Zero', 'Commutative', 'Distributive'][i];
    const w = week.math.words.find((x) => x.word.startsWith(name));
    assert.ok(out.includes(`<span class="def">${esc(w.def)}</span>`), name);
    assert.doesNotMatch(out, /undefined|NaN/);
    const [, old] = card('2026-10-12', i);
    assert.ok(!old.includes("Teacher's words"), `${name} without teacher words`);
    assert.ok(old.includes(`${name} Property`), name);
  }
});

test('newsletter lists every week with working links', () => {
  const week = readJSON('data/2026-10-19.json');
  const out = newsletterView(ctxFor(realIndex, '2026-10-19', 'newsletter', week)).s;
  assert.ok(out.includes('href="#newsletter"'));
  assert.ok(out.includes('href="#newsletter?week=2026-10-12"'));
});

test('homework checkboxes are labelled', () => {
  const week = readJSON('data/2026-10-19.json');
  const out = homeworkView(ctxFor(realIndex, '2026-10-19', 'homework', week)).s;
  const inputs = [...out.matchAll(/<input type="checkbox" id="(hw-\d+)">/g)].map((m) => m[1]);
  assert.equal(inputs.length, week.homework.length);
  for (const id of inputs) assert.ok(out.includes(`<label class="hw-check" for="${id}">`), id);
});
