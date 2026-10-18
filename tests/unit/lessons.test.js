// The shared lesson engine: arithmetic, pictures, answer checking, scoring, validation and rendering of every stage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chainHolds, evaluate, speak, wrongFactsInText } from '../../js/lib/arith.js';
import { counts, modelFigure } from '../../js/lib/models.js';
import { STAGE_IDS, boxes, check, decompositionOf, modelEquation, readNumber, score, solution, validateLesson } from '../../js/lib/lessons.js';
import { buildHash } from '../../js/lib/router.js';
import { lessonView } from '../../js/views/lesson.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/lessons/index.json');
const LESSONS = INDEX.lessons.map((l) => readJSON(`data/lessons/${l.id}.json`));
const asText = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));

/** Every question in a lesson, with the stage it belongs to. */
function allItems(lesson) {
  const out = [];
  for (const s of lesson.learn.screens) if (s.item) out.push(['learn', s.item]);
  for (const e of lesson.watch.examples) if (e.why) out.push(['watch', e.why]);
  for (const st of ['together', 'try', 'test']) for (const it of lesson[st].items) out.push([st, it]);
  return out;
}

test('arithmetic: precedence, parentheses, "=" chains and reading aloud', () => {
  assert.equal(evaluate('5 × 3 + 1 × 3'), 18);
  assert.equal(evaluate('(5 × 3) + (1 × 3)'), 18);
  assert.equal(evaluate('10 × 3 − 1 × 3'), 27);
  assert.equal(evaluate('2 x 9 + 1 * 9'), 27);
  assert.ok(chainHolds('6 × 3 = 5 × 3 + 1 × 3 = 15 + 3 = 18'));
  assert.ok(!chainHolds('6 × 3 = 5 × 3 + 1 × 1'));
  assert.ok(!chainHolds('6 × 3'));
  assert.throws(() => evaluate('6 × '));
  assert.throws(() => evaluate('alert(1)'));
  assert.deepEqual(wrongFactsInText('So 5 × 3 = 15, and 7 × 4 = 29.'), ['7 × 4 = 29']);
  assert.deepEqual(wrongFactsInText('6 × 3 = 5 × 3 + 1 × 3 = 15 + 3 = 18'), []);
  assert.equal(speak('6 × 3 = [a] × 3 + (1 × 3)'), '6 times 3 equals blank times 3, plus 1 times 3');
  assert.doesNotMatch(speak('(5 × 3) + (1 × 3)'), /parenthes/);
});

test('reading typed answers: spaces and leading zeros are fine, words and decimals are not numbers', () => {
  assert.deepEqual(readNumber(' 18 '), { value: 18 });
  assert.deepEqual(readNumber('018'), { value: 18 });
  assert.deepEqual(readNumber(''), { empty: true });
  for (const bad of ['eighteen', '1 8', '18.0', '-3', '1e2']) assert.deepEqual(readNumber(bad), { bad: true }, bad);
});

test('pictures are drawn from their numbers: every dot, square and plate is counted', () => {
  const dots = (svg) => (svg.match(/<circle class="m-dot/g) || []).length;
  const ofPart = (svg, p) => (svg.match(new RegExp(`class="m-(?:dot|tile) m-${p}"`, 'g')) || []).length;
  for (const [rows, cols] of [[6, 3], [7, 4], [3, 9], [1, 1], [12, 12]]) {
    const svg = modelFigure({ type: 'array', rows, cols }).s;
    assert.equal(dots(svg), rows * cols, `${rows} × ${cols}`);
    for (const cut of [{ by: 'rows', at: 1 }, { by: 'cols', at: 1 }]) {
      if ((cut.by === 'rows' ? rows : cols) < 2) continue;
      const m = { type: 'array', rows, cols, cut };
      const s = modelFigure(m).s;
      const c = counts(m);
      assert.equal(ofPart(s, 'a'), c.a);
      assert.equal(ofPart(s, 'b'), c.b);
      assert.equal(c.a + c.b, rows * cols);
      assert.ok(chainHolds(`${modelEquation(m)} = ${rows * cols}`), modelEquation(m));
    }
  }
  const tiles = modelFigure({ type: 'array', style: 'tiles', rows: 5, cols: 7, cut: { by: 'cols', at: 4 }, sideLabels: true }).s;
  assert.equal(ofPart(tiles, 'a'), 20);
  assert.equal(ofPart(tiles, 'b'), 15);
  const plates = modelFigure({ type: 'plates', plates: 7, each: 1 }).s;
  assert.equal((plates.match(/class="m-plate"/g) || []).length, 7);
  assert.equal(dots(plates), 7);
  assert.equal(dots(modelFigure({ type: 'plates', plates: 9, each: 0 }).s), 0);
  // Pictures never use style attributes (the Content Security Policy blocks them) and always have a text alternative.
  for (const s of [tiles, plates]) { assert.doesNotMatch(s, /style=/); assert.match(s, /role="img" aria-label="[^"]+"/); }
});

test('open decompositions: any valid cut, either factor, facts turned around or not; nothing else', () => {
  const ok = [[5, 3, 1, 3], [1, 3, 5, 3], [4, 3, 2, 3], [3, 3, 3, 3], [6, 2, 6, 1], [6, 1, 6, 2], [3, 5, 3, 1], [2, 6, 1, 6]];
  for (const v of ok) assert.ok(decompositionOf(6, 3, ...v), v.join(','));
  const bad = [[6, 3, 0, 3], [5, 3, 1, 1], [4, 3, 1, 3], [5, 2, 1, 1], [9, 2, 9, 1], [6, 3, 6, 3]];
  for (const v of bad) assert.equal(decompositionOf(6, 3, ...v), null, v.join(','));
  const item = { type: 'decompose', fact: [6, 3], answer: { p: 5, q: 3, r: 1, s: 3, t: 18 } };
  const say = (p, q, r, s, t) => check(item, asText({ p, q, r, s, t }));
  assert.deepEqual(say(5, 3, 1, 3, 18), { status: 'correct', say: 'Yes! 15 + 3 = 18.' });
  assert.equal(say(3, 5, 3, 1, 18).say, 'Yes! You can also write it 5 × 3 + 1 × 3.');
  assert.equal(say(5, 3, 1, 3, 15).say, 'You found the first part! Now add the second part.');
  assert.equal(say(4, 3, 1, 3, 15).say, '4 and 1 make 5. We need 6.');
  assert.equal(say(6, 3, 0, 3, 18).status, 'notyet');
  assert.equal(check(item, { p: '5', q: '3' }).status, 'empty');
});

test('every lesson is valid and every question accepts its own answer', () => {
  assert.deepEqual(INDEX.lessons.map((l) => l.id), ['5-1', '5-2']);
  for (const lesson of LESSONS) {
    assert.deepEqual(validateLesson(lesson, lesson.id), [], lesson.id);
    for (const [, item] of allItems(lesson)) {
      const r = check(item, asText(solution(item)), lesson);
      assert.equal(r.status, 'correct', `${lesson.id} ${item.id}`);
      assert.match(r.say, /^Yes!/, `${lesson.id} ${item.id}: a correct answer starts with "Yes!"`);
      // An empty answer is never counted as a try.
      if (item.type !== 'choice') assert.equal(check(item, {}, lesson).status, 'empty', `${lesson.id} ${item.id}`);
    }
  }
});

test('teacher definitions in lessons are word for word the teacher\'s (from the week data)', () => {
  const week = readJSON('data/2026-10-19.json');
  for (const lesson of LESSONS) {
    for (const t of lesson.teacher) {
      assert.equal(t.def, week.math.words.find((w) => w.word === t.term).def, `${lesson.id} ${t.term}`);
    }
  }
  // The naming question uses the teacher's fill sentence exactly.
  const x1 = LESSONS[0].test.items.find((i) => i.id === 'x1');
  assert.equal(x1.prompt, week.math.words.find((w) => w.word === 'Distributive Property').fill);
});

test('Lesson 5-1 shows Examples A, B and C, each picture matching its equation', () => {
  const [a, b, c] = LESSONS[0].watch.examples;
  const last = (e) => e.steps.find((s) => s.pictured); // the step that writes what the picture shows
  assert.equal(last(a).eq, '6 × 3 = 5 × 3 + 1 × 3 = 15 + 3 = 18');
  assert.equal(last(b).eq, '6 × 3 = 4 × 3 + 2 × 3 = 12 + 6 = 18');
  assert.equal(last(c).eq, '6 × 3 = 6 × 2 + 6 × 1 = 12 + 6 = 18');
  assert.deepEqual([a.model.cut, b.model.cut, c.model.cut], [{ by: 'rows', at: 5 }, { by: 'rows', at: 4 }, { by: 'cols', at: 2 }]);
  for (const e of [a, b, c]) assert.ok(last(e).eq.startsWith(modelEquation(e.model)));
});

test('wrong answers get the message written for that mistake; anything else gets the lesson\'s general hint', () => {
  const l = LESSONS[0];
  const g4 = l.together.items.find((i) => i.id === 'g4');
  assert.equal(check(g4, { a: '5', b: '2' }, l).say, '5 + 2 is 7 rows. The picture has 6. Count the rows below the line.');
  // The picture shows the cut under row 5, so another true split (4 + 2) is not what the picture shows.
  assert.equal(check(g4, { a: '4', b: '2' }, l).status, 'notyet');
  const g5 = LESSONS[1].together.items.find((i) => i.id === 'g5');
  assert.equal(check(g5, { answer: '16' }, LESSONS[1]).say, "That's only double 8. Add 8 once more.");
  assert.equal(check(g5, { answer: '50' }, LESSONS[1]).say, LESSONS[1].catchAll);
  const t4 = LESSONS[1].try.items.find((i) => i.id === 't4');
  assert.equal(check(t4, { choice: String(t4.options.findIndex((o) => o.text === '2 × 7 + 2 × 7')) }, LESSONS[1]).say, "That's 4 groups of 7. 3 is 2 and 1.");
});

test('scoring counts only correct answers, and the pass mark is honoured', () => {
  const items = LESSONS[0].test.items;
  const all = Object.fromEntries(items.map((it) => [it.id, { status: 'correct' }]));
  assert.deepEqual({ ...score(items, all, 7), missed: [] }, { right: 8, total: 8, passed: true, missed: [] });
  const two = { ...all, x2: { status: 'notyet' }, x5: { status: 'notyet' } };
  const s = score(items, two, 7);
  assert.deepEqual([s.right, s.passed, s.missed.map((i) => i.id)], [6, false, ['x2', 'x5']]);
  assert.equal(score(items, {}, 7).right, 0);
});

const ctx = (lesson, stage, lessonState) => ({
  lesson, stage, lessonState, isCurrent: true, weekId: '2026-10-19',
  link: (s) => buildHash(s, '2026-10-19', '2026-10-19'),
  lessonLink: (id, st) => buildHash('math', '2026-10-19', '2026-10-19', { lesson: id, stage: st }),
});

test('every stage of every lesson renders: one h1, no missing values, labelled answer boxes', () => {
  for (const lesson of LESSONS) {
    for (const stage of STAGE_IDS) {
      const out = lessonView(ctx(lesson, stage)).s;
      assert.equal((out.match(/<h1[\s>]/g) || []).length, 1, `${lesson.id} ${stage}`);
      assert.doesNotMatch(out, /undefined|\bnull\b|NaN|\[object /, `${lesson.id} ${stage}`);
      for (const m of out.matchAll(/<input class="box[^>]*>/g)) assert.match(m[0], /aria-label="[^"]+"/, m[0]);
      assert.doesNotMatch(out, /style="|parenthes/i, `${lesson.id} ${stage}`);
      const levels = [...out.matchAll(/<h([1-6])[\s>]/g)].map((x) => Number(x[1]));
      levels.forEach((l, i) => i && assert.ok(l <= levels[i - 1] + 1, `${lesson.id} ${stage}: h${l} after h${levels[i - 1]}`));
    }
  }
});

test('the test never shows hints, feedback or answers before it is finished', () => {
  for (const lesson of LESSONS) {
    lesson.test.items.forEach((item, i) => {
      // Even with a typed answer and tries recorded, nothing is revealed in test mode.
      const st = { i, items: { [item.id]: { resp: asText(solution(item)), status: 'correct', say: 'Yes!', tries: 3, hints: 2, shown: true } }, steps: {} };
      const out = lessonView(ctx(lesson, 'test', st)).s;
      assert.doesNotMatch(out, /data-act="(?:hint|show)"|class="feedback (?:ok|notyet)"|class="showme"|Not yet/, `${lesson.id} ${item.id}`);
      for (const o of item.options || []) if (o.why) assert.ok(!out.includes(o.why), `${lesson.id} ${item.id} leaks a why message`);
      for (const s of item.show || []) assert.ok(!out.includes(s), `${lesson.id} ${item.id} leaks the worked answer`);
    });
  }
});

test('Try It Yourself hides hints until the second miss; Practice Together offers them right away', () => {
  const l = LESSONS[0];
  const t1 = l.try.items[0];
  const once = lessonView(ctx(l, 'try', { i: 0, items: { [t1.id]: { tries: 1, status: 'notyet', say: 'x' } }, steps: {} })).s;
  assert.doesNotMatch(once, /data-act="hint"/);
  const twice = lessonView(ctx(l, 'try', { i: 0, items: { [t1.id]: { tries: 2, status: 'notyet', say: 'x' } }, steps: {} })).s;
  assert.match(twice, /data-act="hint"/);
  assert.match(twice, /data-act="show"/);
  assert.match(lessonView(ctx(l, 'together', { i: 0, items: {}, steps: {} })).s, /data-act="hint"/);
});

test('every question has a way to get unstuck before the test (hints and Show me how)', () => {
  for (const lesson of LESSONS) {
    for (const stage of ['together', 'try']) {
      for (const item of lesson[stage].items) {
        if (item.type !== 'choice') assert.ok(item.hints?.length, `${lesson.id} ${item.id} needs hints`);
        assert.ok(boxes(item).length || item.type === 'choice');
      }
    }
  }
});

test('a wrong answer marks its box for screen readers (aria-invalid is real markup, not escaped text)', () => {
  const l = LESSONS[0];
  const g4 = l.together.items.find((i) => i.id === 'g4');
  const out = lessonView(ctx(l, 'together', { i: 3, items: { g4: { resp: { a: '5', b: '2' }, status: 'notyet', say: 'x', tries: 1, wrong: check(g4, { a: '5', b: '2' }, l).wrong } }, steps: {} })).s;
  assert.match(out, /name="b"[^>]*aria-invalid="true"/);
  assert.doesNotMatch(out, /name="a"[^>]*aria-invalid/, 'the right box is not marked');
  assert.doesNotMatch(out, /&quot;true&quot;/);
  assert.ok(g4);
});

test('review fixes: strict boxes, square facts, prose sums, picture settings, read-aloud words', () => {
  const l = LESSONS[0];
  // ENG-1 / CUR-1: partial products are checked, not just the total.
  const x5 = l.test.items.find((i) => i.id === 'x5');
  assert.equal(check(x5, { p: '9', q: '9', t: '18' }, l).status, 'notyet');
  assert.equal(check(x5, { p: '18', q: '0', t: '18' }, l).status, 'notyet');
  assert.equal(check(x5, { p: '12', q: '6', t: '18' }, l).status, 'correct');
  // An "open" item accepts every valid way (5-2 g4: 3 = 2 + 1 or 1 + 2) and marks only what needs another look.
  const g4 = LESSONS[1].together.items.find((i) => i.id === 'g4');
  assert.equal(check(g4, { a: '1', b: '2', t: '12' }, LESSONS[1]).status, 'correct');
  assert.deepEqual(check(g4, { a: '1', b: '2', t: '13' }, LESSONS[1]).wrong, ['t']);
  // ENG-2: a square fact decomposed either way is right.
  for (const v of [[4, 1, 4, 3], [1, 4, 3, 4]]) assert.ok(decompositionOf(4, 4, ...v)?.inOrder, v.join(','));
  // QA-1 / A11Y-4: right facts, wrong total -> only the total box is marked.
  const t1 = l.try.items.find((i) => i.id === 't1');
  assert.deepEqual(check(t1, { p: '5', q: '4', r: '4', s: '4', t: '35' }, l).wrong, ['t']);
  // A11Y-11: empty boxes are marked so the child can find them.
  assert.deepEqual(check(t1, { p: '5', q: '4', r: '', s: '4', t: '' }, l).wrong, ['r', 't']);
  // ENG-3: sums in hints, messages and Show me how steps are checked.
  const broken = JSON.parse(JSON.stringify(l));
  broken.try.items[0].show = ['20 + 16 = 37.'];
  assert.ok(validateLesson(broken, '5-1').some((p) => p.includes('20 + 16 = 37')));
  // ENG-4: picture settings are validated.
  const pics = JSON.parse(JSON.stringify(l));
  pics.try.items.find((i) => i.id === 't5').models[0].labels = '<b>';
  assert.ok(validateLesson(pics, '5-1').some((p) => p.includes('labels must be')));
  assert.doesNotMatch(modelFigure({ type: 'array', rows: '3"><script>', cols: 2 }).s, /<script/);
  // A11Y-1, A11Y-9: read-aloud keeps words whole and says brackets and blanks.
  assert.equal(speak('Fill in the boxes. Example A'), 'Fill in the boxes. Example A');
  assert.equal(speak('with ( ) around'), 'with brackets around');
  assert.equal(speak('uses the ___.'), 'uses the blank.');
});

test('question pictures never say the answer', () => {
  for (const lesson of LESSONS) {
    for (const [, item] of allItems(lesson)) {
      if (item.type !== 'number' || !item.model) continue;
      const label = /aria-label="([^"]+)"/.exec(modelFigure(item.model).s)[1];
      assert.ok(!new RegExp(`\\b${solution(item).answer}\\b`).test(label), `${lesson.id} ${item.id}: "${label}"`);
    }
  }
});

test('a wrong answer key or a false allowed alternative is caught by the validator', () => {
  const bad = JSON.parse(JSON.stringify(LESSONS[0]));
  bad.together.items.find((i) => i.id === 'g1').answer.t = 29;
  assert.ok(validateLesson(bad, '5-1').some((p) => p.includes('does not make')));
  const alt = JSON.parse(JSON.stringify(LESSONS[0]));
  alt.try.items.find((i) => i.id === 't4').accept.push({ p: 20, q: 15, t: 35 });
  assert.ok(validateLesson(alt, '5-1').some((p) => p.includes('does not make')));
});

test('"Read to me" buttons are named with their visible words first (WCAG 2.5.3)', () => {
  for (const lesson of LESSONS) {
    for (const stage of STAGE_IDS) {
      for (const m of lessonView(ctx(lesson, stage)).s.matchAll(/data-act="read"[^>]*aria-label="([^"]+)"/g)) assert.match(m[1], /^Read to me\b/, m[1]);
    }
  }
});

test('the stepper marks only stages opened during this visit as done', () => {
  const l = LESSONS[0];
  const done = (visited) => [...lessonView({ ...ctx(l, 'try', { i: 0, items: {}, steps: {} }), lessonVisited: new Set(visited) }).s
    .matchAll(/<li class="done"><a href="[^"]*stage=(\w+)/g)].map((m) => m[1]);
  assert.deepEqual(done([]), []);
  assert.deepEqual(done(['learn', 'try']), ['learn']);
});
