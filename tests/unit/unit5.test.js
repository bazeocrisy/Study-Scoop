// Unit 5 build (DECISIONS D20): seven lessons with 20 practice questions each, Math Vocabulary for five properties,
// in-lesson Practice My Misses and the results screens. Content is checked as data, then every new screen is rendered.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wrongFactsInText } from '../../js/lib/arith.js';
import { check, decompositionOf, solution, validateLesson } from '../../js/lib/lessons.js';
import { WORD_MODES, mathWordItems, mathWordsTest, propertyOf, rng, testCatalog, validateMathWords } from '../../js/lib/activities.js';
import { PROPERTIES } from '../../js/lib/mathlearn.js';
import { buildHash } from '../../js/lib/router.js';
import { mathView } from '../../js/views/math.js';
import { testsView } from '../../js/views/tests.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/lessons/index.json');
const LESSONS = INDEX.lessons.map((l) => readJSON(`data/lessons/${l.id}.json`));
const MW = readJSON('data/practice/math-words.json');
const W19 = readJSON('data/2026-10-19.json');
const WEEKS = readJSON('data/weeks.json');
const asText = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
const norm = (t) => String(t).replace(/\s+/g, ' ').trim().toLowerCase();

function ctxFor(extra = {}) {
  const weekId = '2026-10-19';
  return {
    week: W19, index: WEEKS, weekId, section: 'math', isCurrent: true, today: new Date(2026, 9, 18, 12),
    link: (s, id = weekId) => buildHash(s, id, WEEKS.current),
    lessonLink: (id, stage) => buildHash('math', weekId, WEEKS.current, { lesson: id, stage }),
    actLink: (s, act) => buildHash(s, weekId, WEEKS.current, { act }),
    testLink: (kind) => buildHash('tests', weekId, WEEKS.current, { test: kind }),
    tests: readJSON('data/tests/2026-10-19.json'), misses: { vocab: 0, spelling: 0, math: 0, mathwords: 2 },
    practice: readJSON('data/practice/math.json'), mathWords: MW, lessons: INDEX, pictures: { photos: [], drawings: [] }, ...extra,
  };
}
const clean = (out, label) => {
  assert.equal((out.match(/<h1[\s>]/g) || []).length, 1, `${label}: one h1`);
  assert.doesNotMatch(out, /undefined|\bnull\b|NaN|\[object /, `${label}: no missing values`);
};

test('Math Lessons lists seven lessons, each open, each naming its strategy', () => {
  assert.deepEqual(INDEX.lessons.map((l) => l.id), ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6', '5-7']);
  for (const l of INDEX.lessons) assert.ok(l.title && l.summary && l.strategy, l.id);
  const out = mathView(ctxFor({ page: 'lessons' })).s;
  clean(out, 'lessons menu');
  for (const l of INDEX.lessons) {
    assert.ok(out.includes(`Lesson ${l.id}: ${l.title.replace(/'/g, '&#39;')}`), l.id);
    assert.ok(out.includes(`href="#math?lesson=${l.id}&amp;stage=learn"`), `${l.id} can be started`);
  }
  assert.doesNotMatch(out, /locked|disabled/i, 'no lesson is locked');
});

test('every lesson: 20 different practice questions, each with hints, Show me how and an answer it accepts', () => {
  for (const lesson of LESSONS) {
    assert.deepEqual(validateLesson(lesson, lesson.id), [], lesson.id);
    const items = lesson.try.items;
    assert.equal(items.length, 20, `${lesson.id} Try It Yourself has 20 questions`);
    assert.equal(new Set(items.map((i) => i.id)).size, 20, `${lesson.id}: ids`);
    // Twenty meaningful questions: no question (prompt + equation + numbers) is repeated.
    const keys = items.map((i) => norm(`${i.prompt} ${(i.lines || []).join(' ')} ${(i.fact || []).join('x')} ${JSON.stringify(i.model || i.models || '')} ${JSON.stringify(i.rows || '')}`));
    assert.equal(new Set(keys).size, 20, `${lesson.id}: a question is repeated`);
    assert.ok(lesson.try.pass >= 14 && lesson.try.pass <= 20, `${lesson.id} pass mark`);
    for (const it of [...items, ...lesson.together.items]) {
      assert.ok(it.hints?.length, `${lesson.id} ${it.id}: needs a hint`);
      assert.ok(it.show?.length, `${lesson.id} ${it.id}: needs Show me how`);
      // A useful hint teaches something: never just "try again" or "think harder".
      for (const h of it.hints) assert.doesNotMatch(h, /^(try again|think harder|remember your (multiplication )?facts)\.?$/i, `${lesson.id} ${it.id}: "${h}"`);
      assert.equal(check(it, asText(solution(it)), lesson).status, 'correct', `${lesson.id} ${it.id}`);
    }
    for (const it of lesson.test.items) assert.equal(it.hints, undefined, `${lesson.id} ${it.id}: no hints in a test`);
    assert.ok(lesson.together.items.length >= 5, `${lesson.id}: Practice Together`);
    assert.ok(lesson.watch.examples.length >= 2, `${lesson.id}: Watch Me`);
    assert.ok(lesson.learn.screens.some((s) => s.model), `${lesson.id}: Learn It has a picture`);
  }
});

test('lesson strategies are the unit\'s: each lesson teaches its own factor split, and a correct split is never refused', () => {
  const byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  const text = (l) => JSON.stringify(l);
  assert.match(text(byId['5-2']), /3 × 7 = 3 × 5 \+ 3 × 2/, '5-2 also breaks apart the other factor');
  assert.match(text(byId['5-3']), /4 × 9 = 2 × 9 \+ 2 × 9 = 18 \+ 18 = 36/);
  assert.match(text(byId['5-4']), /6 × 7 = 5 × 7 \+ 1 × 7 = 35 \+ 7 = 42/);
  assert.match(text(byId['5-4']), /6 × 7 = 3 × 7 \+ 3 × 7 = 21 \+ 21 = 42/);
  assert.match(text(byId['5-5']), /8 × 7 = 4 × 7 \+ 4 × 7 = 28 \+ 28 = 56/);
  assert.match(text(byId['5-5']), /8 × 7 = 5 × 7 \+ 3 × 7 = 35 \+ 21 = 56/);
  assert.match(text(byId['5-6']), /7 × 6 = 5 × 6 \+ 2 × 6 = 30 \+ 12 = 42/);
  assert.match(text(byId['5-6']), /9 × 6 = 5 × 6 \+ 4 × 6 = 30 \+ 24 = 54/);
  // No division in the problem-solving lesson.
  for (const st of ['learn', 'watch', 'together', 'try', 'test']) assert.doesNotMatch(JSON.stringify(byId['5-7'][st]), /÷|divide|division/i, st);
  // Open decompositions: every correct way of breaking apart either factor is accepted for every fact used.
  for (const lesson of LESSONS) {
    for (const it of [...lesson.together.items, ...lesson.try.items, ...lesson.test.items].filter((i) => i.type === 'decompose')) {
      const [a, b] = it.fact;
      for (const [K, other] of [[b, a], [a, b]]) {
        for (let c = 1; c < other; c++) {
          const r = check(it, asText({ p: c, q: K, r: other - c, s: K, t: a * b }), lesson);
          assert.equal(r.status, 'correct', `${lesson.id} ${it.id}: ${c} × ${K} + ${other - c} × ${K}`);
        }
      }
      // An incorrect equation is never marked correct.
      assert.equal(check(it, asText({ p: 5, q: b, r: 1, s: b, t: 6 * b }), lesson).status === 'correct', a === 6, `${lesson.id} ${it.id}: wrong parts`);
    }
  }
  assert.ok(decompositionOf(9, 6, 5, 6, 4, 6) && !decompositionOf(9, 6, 5, 6, 5, 6));
});

test('lesson content is original: no textbook story names, no textbook page titles', () => {
  // Names and settings from the printed lessons (kept out of Study Scoop's own problems).
  const BOOK = /\b(Rocco|Yazmin|James|Wyatt|Otto|Caitlyn|Doris|Moustafa|Jane|Zara|Tyler|Luis|Turner|Oscar|Paul|Roger|Brittany|Jonathan|Tobias|Dustin|Carley|Alex|Lula|Tony|Grace|Ava|Kyla|Finn|Sawyer|Braxton|Kofi|Kelly|Denise)\b/;
  for (const lesson of LESSONS) {
    for (const s of JSON.stringify(lesson).match(/"[^"]*"/g)) assert.doesNotMatch(s, BOOK, `${lesson.id}: ${s}`);
    assert.doesNotMatch(JSON.stringify(lesson), /Be Curious|Math is\.\.\.|On My Own|Extend Your Thinking|STEM Connection/, lesson.id);
  }
});

test('all written arithmetic in lessons and Math Vocabulary is true', () => {
  const all = (v, out = []) => (typeof v === 'string' ? out.push(v) : v && typeof v === 'object' ? Object.values(v).forEach((x) => all(x, out)) : null, out);
  for (const lesson of LESSONS) {
    const scanned = JSON.parse(JSON.stringify(lesson, (k, v) => (v && typeof v === 'object' && v.quotesMistake ? { ...v, prompt: '' } : v)));
    for (const s of all(scanned)) if (!/\[[a-z]/.test(s)) assert.deepEqual(wrongFactsInText(s), [], `${lesson.id}: ${s}`);
  }
  for (const s of all(MW)) assert.deepEqual(wrongFactsInText(s), [], s);
});

test('Math Vocabulary: five properties, 20 questions in each mode, every key worked out again', () => {
  assert.deepEqual(validateMathWords(MW), []);
  for (const mode of Object.values(WORD_MODES)) {
    assert.equal(MW[mode].length, 20, mode);
    for (const p of PROPERTIES) assert.ok(MW[mode].filter((it) => it.prop === p.key).length >= 3, `${mode} ${p.key}`);
    for (const it of MW[mode]) assert.equal(check(it, asText(solution(it))).status, 'correct', it.id);
  }
  for (const act of Object.keys(WORD_MODES)) assert.equal(mathWordItems(MW, act, rng(4)).length, 20, act);
  // The validator catches a wrong key, a wrong property, and a statement whose truth is flipped.
  const broken = (fn) => { const b = JSON.parse(JSON.stringify(MW)); fn(b); return validateMathWords(b); };
  assert.ok(broken((b) => { b.choice[0].eq = '6 × 2 = 2 × 6'; b.choice[0].prompt = 'Which property does 6 × 2 = 2 × 6 show?'; }).length);
  assert.ok(broken((b) => { b.truefalse[0].truth = !b.truefalse[0].truth; }).some((p) => /truth/.test(p)));
  assert.ok(broken((b) => { b.fill[0].answer = 'zero'; }).length);
  assert.ok(broken((b) => { b.choice = b.choice.slice(0, 19); }).some((p) => /at least 20/.test(p)));
});

test('Commutative and Associative are told apart by their numbers, never confused', () => {
  assert.equal(propertyOf('3 × 7 = 7 × 3'), 'Commutative');
  assert.equal(propertyOf('(2 × 3) × 4 = 2 × (3 × 4)'), 'Associative');
  assert.equal(propertyOf('(2 × 3) × 4 = (3 × 2) × 4'), null, 'turning inside the ( ) is not the Associative Property');
  assert.equal(propertyOf('(2 × 3) × 4 = 4 × (2 × 3)'), null, 'moving a group to the other side is not the Associative Property');
  assert.equal(propertyOf('(1 × 3) × 4 = 1 × (3 × 4)'), null, 'a factor of 1 would also be Identity');
  const assocItems = Object.values(WORD_MODES).flatMap((m) => MW[m]).filter((it) => it.prop === 'associative' && it.eq);
  for (const it of assocItems) assert.equal(propertyOf(it.eq), 'Associative', it.id);
  const tfMix = MW.truefalse.filter((it) => it.kind === 'tf-eq' && ['commutative', 'associative'].includes(it.said) && it.said !== it.prop);
  assert.ok(tfMix.length >= 2, 'true-or-false practises the Commutative/Associative mix-up');
  for (const it of tfMix) assert.equal(it.options.find((o) => o.correct).text, 'False');
});

test('the Math Vocabulary practice test: 15 questions, every property in every mode, no hints', () => {
  const t = mathWordsTest(MW, rng(9));
  assert.equal(t.items.length, 15);
  assert.equal(t.pass, 12);
  for (const it of t.items) { assert.equal(it.hints, undefined); assert.equal(it.show, undefined); assert.ok(it.explain); }
  const modes = { choice: 0, word: 0, tf: 0 };
  for (const it of t.items) modes[it.type === 'word' ? 'word' : it.kind.startsWith('tf') ? 'tf' : 'choice']++;
  assert.deepEqual(modes, { choice: 5, word: 5, tf: 5 });
  for (const p of PROPERTIES) assert.equal(t.items.filter((it) => it.prop === p.key).length, 3, p.key);
  assert.deepEqual(new Set(t.items.map((i) => i.id)).size, 15);
});

test('Math > Math Vocabulary menu and Review My Words render for every property', () => {
  const menu = mathView(ctxFor({ page: 'words' })).s;
  clean(menu, 'words menu');
  for (const act of ['wreview', 'wchoice', 'wtf', 'wfill', 'wmisses']) assert.ok(menu.includes(`href="#math?act=${act}"`), act);
  assert.match(menu, /count-badge">2/, 'the misses badge counts Math Vocabulary misses');
  const top = mathView(ctxFor()).s;
  assert.deepEqual([...top.matchAll(/class="mc-title">([^<]+)/g)].map((m) => m[1].trim()), ['Learn the Properties', 'Math Vocabulary', 'Practice Problems', 'Math Lessons', 'Study Guide']);
  for (let i = 0; i < PROPERTIES.length; i++) {
    const run = { subject: 'math', act: 'wreview', mode: 'practice', title: 'Review My Words', goal: '', items: [], items_: {}, flash: { order: [0, 1, 2, 3, 4], i, flipped: false, marks: {} } };
    const out = mathView(ctxFor({ run })).s;
    clean(out, `review ${i}`);
    assert.ok(out.includes(PROPERTIES[i].name), PROPERTIES[i].name);
    assert.match(out, /Read to me/);
    assert.match(out, i === PROPERTIES.length - 1 ? /Done: choose a quiz/ : /data-act="card-next"/);
    if (i) assert.match(out, /data-act="card-prev"/);
  }
});

test('the Study Guide covers the unit: goals, five properties, strategies, patterns, mix-ups, review questions', () => {
  const out = mathView(ctxFor({ page: 'guide' })).s;
  clean(out, 'study guide');
  for (const s of ['Unit 5 goals', 'The five properties', 'Associative Property', 'Multiply by 3, 4, 6, 7, 8 and 9', 'Fact patterns', 'Do not mix these up', 'Check yourself', 'Print the study guide']) assert.ok(out.includes(s), s);
  // The class test date is shown only for the Multiplication Properties part.
  assert.match(out, /Part 1: Multiplication Properties.*class math test/s);
  assert.match(out, /Part 2: Strategies from Lessons 5-2 to 5-7 <span class="part-note">\(for practice\)/);
  for (const l of INDEX.lessons) assert.ok(out.includes(`href="#math?lesson=${l.id}&amp;stage=learn"`), l.id);
});

test('Tests: the Test Center has four practice tests, and the Math Vocabulary card is not called a class test', () => {
  const out = testsView({ ...ctxFor(), section: 'tests' }).s;
  clean(out, 'test center');
  for (const t of ['Math Practice Test', 'Spelling Practice Test', 'Vocabulary Practice Test', 'Math Vocabulary Practice Test']) assert.ok(out.includes(t), t);
  assert.ok(out.includes('href="#tests?test=mathwords"'));
  assert.equal(testCatalog(W19, ctxFor().tests, MW).find((c) => c.kind === 'mathwords').classTest, 'Math Test');
});

test('every lesson stage and every results screen renders, with Practice My Misses, Back to Lessons and Home', async () => {
  const { lessonView } = await import('../../js/views/lesson.js');
  for (const lesson of LESSONS) {
    const view = (stage, lessonState) => lessonView(ctxFor({ lesson, stage, lessonState, lessonVisited: new Set() })).s;
    for (const stage of ['learn', 'watch', 'together', 'try', 'test', 'parent']) clean(view(stage, { i: 0, items: {}, steps: {} }), `${lesson.id} ${stage}`);
    // Try It Yourself results: 18 right on the first try, 2 missed.
    const items = {};
    lesson.try.items.forEach((it, k) => { items[it.id] = { first: k < 18 ? 'correct' : 'notyet', status: 'correct', resp: {} }; });
    const sum = view('try', { i: 20, items, steps: {} });
    clean(sum, `${lesson.id} try results`);
    assert.match(sum, /18 out of 20 right on the first try <span class="pct">\(90%\)/, lesson.id);
    assert.match(sum, /Answered: 20 of 20/);
    assert.match(sum, /data-act="misses">Practice My Misses <span aria-hidden="true">\(2\)<\/span><span class="sr-only">: 2 questions/);
    assert.match(sum, /Back to Lessons/);
    assert.match(sum, /<span>Home<\/span>/);
    assert.match(sum, /What next\?/);
    // The misses round, its first question and its summary.
    const ids = lesson.try.items.slice(18).map((it) => it.id);
    const round = view('try', { i: 20, items, steps: {}, misses: { ids, i: 0, items: {}, done: false } });
    clean(round, `${lesson.id} misses round`);
    assert.match(round, /Practice My Misses.*Question 1 of 2/s);
    assert.match(round, /Check Answer/);
    const done = view('try', { i: 20, items, steps: {}, misses: { ids, i: 1, items: { [ids[0]]: { first: 'correct' }, [ids[1]]: { first: 'notyet' } }, done: true } });
    clean(done, `${lesson.id} misses summary`);
    assert.match(done, /Practice these again <span aria-hidden="true">\(1\)/);
    // Test results: a passing score names the next lesson; the last lesson points to the Study Guide.
    const testItems = Object.fromEntries(lesson.test.items.map((it) => [it.id, { status: 'correct', resp: Object.fromEntries(Object.entries(solution(it)).map(([k, v]) => [k, String(v)])) }]));
    const res = view('test', { i: 0, items: testItems, steps: {}, submitted: true });
    clean(res, `${lesson.id} test results`);
    assert.match(res, /8 out of 8 right <span class="pct">\(100%\)/);
    const k = INDEX.lessons.findIndex((l) => l.id === lesson.id);
    if (k < INDEX.lessons.length - 1) assert.ok(res.includes(`Next: Lesson ${INDEX.lessons[k + 1].id}`), lesson.id);
    else assert.ok(res.includes('href="#math?act=guide"') && res.includes('href="#tests?test=math"'), 'last lesson: Study Guide and Math Practice Test');
  }
});

test('the Math Vocabulary test never repeats a practice question, and a new attempt can pick different questions', () => {
  const practice = new Set(Object.values(WORD_MODES).flatMap((m) => MW[m].map((it) => it.prompt)));
  const sets = new Set();
  for (let seed = 1; seed <= 8; seed++) {
    const t = mathWordsTest(MW, rng(seed));
    for (const it of t.items) assert.ok(!practice.has(it.prompt), it.prompt);
    sets.add(t.items.map((i) => i.prompt).sort().join('|'));
  }
  assert.ok(sets.size > 1, 'different attempts can have different questions');
  const b = JSON.parse(JSON.stringify(MW));
  b.test[0].prompt = MW.choice[0].prompt;
  assert.ok(validateMathWords(b).some((p) => /same question is in practice/.test(p)));
});

test('Watch Me: every "the answer is N" and "both ways make N" in an example names that example\'s own product', async () => {
  const { evaluate } = await import('../../js/lib/arith.js');
  for (const lesson of LESSONS) {
    for (const ex of lesson.watch.examples) {
      const last = [...ex.steps].reverse().find((s) => s.eq && /=/.test(s.eq));
      if (!last) continue;
      const product = evaluate(last.eq.split('=').pop());
      for (const m of JSON.stringify(ex).matchAll(/(?:answer is|ways make|same) (\d+)\b/g)) assert.equal(Number(m[1]), product, `${lesson.id} ${ex.title}: "${m[0]}"`);
    }
  }
});

test('Learn It: each warm-up answer is used again in the lesson\'s teaching screens', async () => {
  const { evaluate } = await import('../../js/lib/arith.js');
  for (const lesson of LESSONS.filter((l) => ['5-3', '5-4', '5-5', '5-6'].includes(l.id))) {
    const screens = lesson.learn.screens;
    const teaching = JSON.stringify(screens.filter((s) => !s.item));
    for (const s of screens.filter((x) => x.item && /^r\d$/.test(x.item.id))) {
      const value = evaluate(s.item.answer);
      assert.match(teaching, new RegExp(`\\b${value}\\b`), `${lesson.id} ${s.item.id}: warm-up answer ${value} is not used in the teaching screens`);
    }
  }
});

test('worked examples stay off the printed lessons\' own worked examples', () => {
  // The textbook works these exact facts in these lessons; Study Scoop's teaching screens (Learn It, Watch Me,
  // Practice Together) use other facts so the child meets the book's examples fresh in class.
  const BOOK_WORKED = { '5-3': [/14 \+ 14 = 28/], '5-5': [/24 \+ 24/, /8 × 6/, /5 × 9 \+ 3 × 9/, /3 × 4 \+ 3 × 4/] };
  for (const lesson of LESSONS) {
    const teaching = JSON.stringify([lesson.learn, lesson.watch, lesson.together, lesson.glossary]);
    for (const re of BOOK_WORKED[lesson.id] || []) assert.doesNotMatch(teaching, re, lesson.id);
  }
});
