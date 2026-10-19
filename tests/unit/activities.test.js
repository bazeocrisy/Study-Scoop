// Spelling and vocabulary activities, the Test Center and the practice tests (DECISIONS D18).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVITIES, blankSentence, lettersItem, missingLetters, rng, shuffle, spellItem, spellingItems, spellingTest,
  testCatalog, testFor, validateTests, vocabItems } from '../../js/lib/activities.js';
import { answerText, check, solution, validateQuiz } from '../../js/lib/lessons.js';
import { validateWeek } from '../../js/lib/validate.js';
import { activityInner } from '../../js/views/activity.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const WEEKS = readJSON('data/weeks.json').weeks.map((w) => readJSON(`data/${w.id}.json`));
const W19 = readJSON('data/2026-10-19.json');
const T19 = readJSON('data/tests/2026-10-19.json');
const asText = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));

test('every generated practice question in every week is valid and accepts its own answer', () => {
  for (const week of WEEKS) {
    for (const kind of ['choice', 'truefalse', 'fill']) {
      for (let seed = 1; seed <= 5; seed++) {
        const items = vocabItems(week, kind, rng(seed));
        assert.deepEqual(validateQuiz(items, 1, `${week.id} ${kind}`), []);
        for (const it of items) assert.equal(check(it, asText(solution(it))).status, 'correct', it.id);
      }
    }
    for (const kind of ['letters', 'listen']) {
      const items = spellingItems(week, kind);
      // 20 questions: every word once, then 5 words again in a new way (no word is invented).
      assert.equal(items.length, 20);
      assert.equal(new Set(items.map((i) => i.id)).size, 20);
      assert.deepEqual([...new Set(items.map((i) => i.n))].length, week.spelling.words.length);
      assert.deepEqual(validateQuiz(items, 1, `${week.id} ${kind}`), []);
      for (const it of items) {
        assert.equal(check(it, asText(solution(it))).status, 'correct', it.id);
        assert.ok(it.hints?.length && it.show?.length, `${it.id} has hints and Show me how`);
      }
    }
    for (const kind of ['choice', 'truefalse', 'fill']) {
      const items = vocabItems(week, kind, rng(2));
      assert.equal(items.length, 20, `${week.id} ${kind}`);
      assert.equal(new Set(items.map((i) => i.id)).size, 20, `${week.id} ${kind}: no question twice`);
      assert.equal(new Set(items.map((i) => i.prompt)).size, 20, `${week.id} ${kind}: no prompt twice`);
      for (const it of items) assert.ok(it.hints?.length && it.show?.length, `${it.id} has hints and Show me how`);
    }
  }
});

test('multiple choice: the right answer is the teacher definition (or the word), and every wrong option is another word', () => {
  for (const seed of [1, 2, 3]) {
    for (const it of vocabItems(W19, 'choice', rng(seed))) {
      const w = W19.vocab.words.find((x) => x.word === it.word);
      const right = it.options.filter((o) => o.correct);
      assert.equal(right.length, 1);
      assert.equal(right[0].text, it.kind === 'meaning' ? w.def : w.word);
      const pool = it.kind === 'meaning' ? W19.vocab.words.map((x) => x.def) : W19.vocab.words.map((x) => x.word);
      assert.equal(new Set(it.options.map((o) => o.text)).size, 4, 'four different options');
      for (const o of it.options) assert.ok(pool.includes(o.text), o.text);
    }
  }
});

test('true or false: half true, half false, and each answer key matches its statement', () => {
  const items = vocabItems(W19, 'truefalse', rng(7));
  assert.equal(items.filter((i) => i.truth).length, 10);
  for (const it of items) {
    const w = W19.vocab.words.find((x) => x.word === it.word);
    const statesOwn = it.prompt.includes(`"${w.def}"`);
    assert.equal(statesOwn, it.truth, it.prompt);
    assert.equal(it.options.find((o) => o.correct).text, it.truth ? 'True' : 'False');
  }
});

test('fill in the blank ignores capitals, extra spaces and a full stop, and rejects a wrong word', () => {
  const it = vocabItems(W19, 'fill', rng(1)).find((i) => i.word === 'Produce');
  assert.equal(check(it, { text: '  PRODUCE ' }).status, 'correct');
  assert.equal(check(it, { text: 'produce.' }).status, 'correct');
  assert.equal(it.bank.length, 4);
  assert.ok(it.bank.includes('produce'));
  assert.equal(check(it, { text: 'produc' }).status, 'notyet');
  assert.equal(check(it, { text: '   ' }).status, 'empty');
});

test('missing letters hide the first vowel and the pattern letter, and never show the word', () => {
  const sp = W19.spelling;
  const shown = (word) => {
    const e = sp.words.find((w) => w.word === word);
    const b = missingLetters(e, sp);
    return [...word].map((c, k) => (b.includes(k) ? '_' : c)).join('');
  };
  assert.equal(shown('heating'), 'h_at_ng');
  assert.equal(shown('skipping'), 'sk_p_ing');   // the doubled letter
  assert.equal(shown('dancing'), 'd_nc_ng');
  assert.equal(shown('flying'), 'fl_ing');     // never two blanks side by side
  for (const e of sp.words) {
    const it = lettersItem(e, sp);
    assert.ok(it.blanks.length >= 1);
    assert.ok(!it.context.toLowerCase().includes(e.word));
    assert.equal(check(it, asText(solution(it))).status, 'correct');
    assert.equal(answerText(it), e.word);
  }
  assert.equal(blankSentence('Mom is Heating soup.', 'heating'), 'Mom is ______ soup.');
  // Second look: other letters of the same word, never side by side, never the first look's letters.
  const again = spellingItems(W19, 'letters').slice(15);
  assert.deepEqual(again.map((it) => [...it.word].map((c, k) => (it.blanks.includes(k) ? '_' : c)).join('')),
    ['s_i_ping', 'd_n_ing', 'a_a_ing', 's_e_ping', 'h_a_ing']);
  for (const it of again) {
    assert.ok(it.blanks.every((b, k) => k === 0 || b - it.blanks[k - 1] > 1), it.id);
    assert.notDeepEqual(it.blanks, lettersItem(W19.spelling.words[it.n - 1], W19.spelling).blanks);
  }
  // Build it: the base word is given and the child adds the ending (the doubled and dropped-e words come first).
  const build = spellingItems(W19, 'listen').slice(15);
  assert.deepEqual(build.map((it) => it.answer), ['skipping', 'dancing', 'amazing', 'stepping', 'heating']);
  for (const it of build) assert.ok(!it.prompt.toLowerCase().includes(it.answer), it.id);
});

test('dictation says the word, the sentence and the word; nothing on screen gives the spelling away', () => {
  for (const week of WEEKS) {
    for (const e of week.spelling.words) {
      const it = spellItem(e, week.spelling, { test: true });
      assert.deepEqual(it.say, [e.word, e.sentence, e.word]);
      assert.equal(it.hints, undefined, 'no hints in a test');
      for (const k of ['prompt', 'fallback']) assert.ok(!it[k].toLowerCase().includes(e.word.toLowerCase()), `${e.word} ${k}`);
      assert.ok(!new RegExp(`\\b${e.base}\\b`, 'i').test(it.fallback), `${e.word}: the no-sound clue does not name the base word`);
      assert.equal(check(it, { text: e.word.toUpperCase() }).status, 'correct');
    }
  }
});

test('the spelling test asks every word on the list exactly once, in a shuffled order', () => {
  for (const week of WEEKS) {
    const t = spellingTest(week, rng(3));
    assert.deepEqual(t.items.map((i) => i.answer).sort(), week.spelling.words.map((w) => w.word.toLowerCase()).sort());
    assert.equal(t.pass, Math.ceil(t.items.length * 0.8));
  }
  const a = spellingTest(W19, rng(1)).items.map((i) => i.answer);
  const b = spellingTest(W19, rng(2)).items.map((i) => i.answer);
  assert.notDeepEqual(a, b, 'different attempts can have different orders');
});

test('the authored practice tests are valid: every answer key, picture, decomposition and teacher definition', () => {
  assert.deepEqual(validateTests(T19, W19), []);
  assert.equal(T19.math.items.length, 20);
  assert.equal(T19.vocab.items.length, 16);
  for (const it of [...T19.math.items, ...T19.vocab.items]) {
    assert.equal(check(it, asText(solution(it))).status, 'correct', it.id);
    assert.ok(it.explain, `${it.id} explains its answer for the results review`);
  }
  // Every vocabulary word is tested; the purple words (not provided) are named as missing.
  assert.deepEqual([...new Set(T19.vocab.items.map((i) => i.word))].sort(), W19.vocab.words.map((w) => w.word).sort());
  assert.match(T19.vocab.note, /purple words/);
});

test('the validator catches wrong answer keys, mismatched split arrays and changed definitions', () => {
  const broken = (change) => { const t = JSON.parse(JSON.stringify(T19)); change(t); return validateTests(t, W19); };
  const caught = (problems, re) => assert.ok(problems.some((p) => re.test(p)), JSON.stringify(problems));
  caught(broken((t) => { t.math.items.find((i) => i.id === 'm5').answer = '10'; }), /prompt says 9 × 1 but the answer is 10/);
  // A wrong option that names the same two facts as the picture (turned around) would be a second right answer.
  caught(broken((t) => { t.math.items.find((i) => i.id === 'm10').options[0].text = '(4 × 5) + (4 × 2)'; }), /also matches the picture/);
  caught(broken((t) => { t.math.items.find((i) => i.id === 'm11').model.cut.at = 4; }), /picture/);
  caught(broken((t) => { t.math.items.find((i) => i.id === 'm15').answer.t = 41; }), /does not make/);
  caught(broken((t) => { for (const o of t.vocab.items.find((i) => i.kind === 'tf').options) { o.correct = !o.correct; o.why = o.why || 'x'; } }), /answer key does not match/);
  caught(broken((t) => { t.vocab.items.find((i) => i.type === 'word').prompt = 'The farmer sells fresh produce like ___.'; }), /shows the answer/);
  caught(broken((t) => { t.vocab.items = t.vocab.items.filter((i) => i.word !== 'Trustworthy'); }), /no question is about Trustworthy/);
  caught(broken((t) => { t.vocab.items[0].hints = ['x']; }), /cannot have hints/);
  caught(validateTests({ ...T19, id: '2026-10-12' }, W19), /"id" must be/);
  caught(broken((t) => { t.math.items.find((i) => i.id === 'm7').model.rows = 5; }), /the picture has 5 rows, but the answer is 4/);
  caught(broken((t) => { t.math.items.find((i) => i.id === 'm9').model.cols = 7; }), /the picture shows 3 × 7, but the target is 3 × 8/);
  caught(broken((t) => { t.vocab.items.find((i) => i.kind === 'tf').word = 'Produce'; }), /must be about Produce/);
  caught(broken((t) => { const it = t.vocab.items.find((i) => i.kind === 'meaning'); it.prompt = 'What does the word "Peculiar" mean?'; }), /must name/);
  caught(broken((t) => { t.math.items[0].skill = 'other'; }), /skill must be one of/);
});

test('Test Center: four cards per week, and no test is offered without its questions', () => {
  const MW = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/practice/math-words.json'), 'utf8'));
  const cards = testCatalog(W19, T19, MW);
  assert.deepEqual(cards.map((c) => [c.kind, c.available, c.count, c.date]),
    [['math', true, 20, '2026-10-21'], ['spelling', true, 15, '2026-10-23'], ['vocab', true, 16, '2026-10-23'], ['mathwords', true, 15, '2026-10-21']]);
  // The Math Vocabulary card never claims to be a class test of its own.
  assert.match(cards[3].dateLabel, /Helps with/);
  assert.equal(testCatalog(W19, T19, null)[3].available, false);
  const old = testCatalog(WEEKS.find((w) => w.id === '2026-10-12'), null, MW);
  assert.deepEqual(old.map((c) => c.available), [false, true, false, true]);
  for (const c of old.filter((x) => !x.available)) assert.ok(c.reason);
  assert.equal(testFor('math', W19, null), null);
});

test('homework: only work actually received is marked received, with no worksheet file published', () => {
  for (const week of WEEKS) {
    assert.deepEqual(validateWeek(week, week.id), []);
    for (const h of week.homework) assert.ok(['received', 'newsletter'].includes(h.source), h.title);
  }
  const bad = JSON.parse(JSON.stringify(W19));
  bad.homework[0].source = 'guessed';
  assert.ok(validateWeek(bad, W19.id).some((p) => /source must be one of/.test(p)));
  const twins = JSON.parse(JSON.stringify(W19));
  twins.vocab.words[1].def = twins.vocab.words[0].def;
  assert.ok(validateWeek(twins, W19.id).some((p) => /same meaning as another word/.test(p)));
});

test('activity screens render without missing values, and tests never show hints, feedback or spelling words', () => {
  const ctx = (run) => ({ week: W19, weekId: W19.id, run, link: (s) => `#${s}`, actLink: (s, a) => `#${s}?act=${a}`, testLink: (k) => `#tests?test=${k}`, pictures: { photos: [], drawings: [] } });
  for (const subject of ['vocab', 'spelling']) {
    for (const a of ACTIVITIES[subject]) {
      const items = a.id === 'misses' || a.id === 'cards' || a.id === 'flash' ? [] : subject === 'vocab' ? vocabItems(W19, a.id, rng(1)) : spellingItems(W19, a.id);
      const run = { subject, act: a.id, mode: 'practice', title: a.label, items, items_: {}, i: 0, flash: { order: [0, 1, 2], i: 0, flipped: false, marks: {} } };
      assert.doesNotMatch(activityInner(ctx(run)).s, /undefined|\bnull\b|NaN|\[object /, `${subject} ${a.id}`);
    }
  }
  for (const kind of ['math', 'spelling', 'vocab']) {
    const t = testFor(kind, W19, T19, rng(1));
    t.items.forEach((item, i) => {
      const out = activityInner(ctx({ ...t, subject: kind, act: kind, mode: 'test', items_: {}, i })).s;
      assert.doesNotMatch(out, /data-act="(?:hint|show)"|class="feedback|button type="submit"/, `${kind} ${item.id}`);
      if (item.type === 'spell') assert.ok(!out.toLowerCase().includes(item.answer), `${item.answer} is not in the page source`);
    });
  }
});

test('shuffle keeps every item exactly once', () => {
  const list = Array.from({ length: 30 }, (_, i) => i);
  assert.deepEqual(shuffle(list, rng(9)).sort((a, b) => a - b), list);
});
