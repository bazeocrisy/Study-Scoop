// Reading Coach: the word arithmetic, the story data and the views (no browser needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ELEMENT_IDS, FORMATS, GUIDE, answerKey, checkBlank, fillBlank, formatOf, normalizeAnswer, countWords, mapChoices, scoreReading, shuffled, storyPassed, storyTokens, storyWords, suggestion,
  todaysPicks, tokenize, validateReadingIndex, validateStory, wordKey,
} from '../../js/lib/reading.js';
import { buildHash, parseHash } from '../../js/lib/router.js';
import { SECTION_IDS } from '../../js/sections.js';
import { readingView } from '../../js/views/reading.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/reading/index.json');
const STORIES = INDEX.stories.map((e) => ({ e, s: readJSON(`data/reading/${e.id}.json`) }));

test('words are counted the way a reader sees them', () => {
  assert.equal(countWords('One windy morning, Dev went to the park.'), 8);
  assert.equal(countWords('  stand-by   is   one word '), 4);
  assert.equal(wordKey('"Manuscript."'), 'manuscript');
  assert.equal(wordKey("Let's"), "let's");
});

test('clue words mark the right tokens, even next to punctuation', () => {
  const t = tokenize('Finally, the kite came down safe.', 0, [{ s: 0, text: 'the kite came down safe', el: 'solution' }]);
  assert.deepEqual(t.map((x) => x.el), [null, 'solution', 'solution', 'solution', 'solution', 'solution']);
  assert.equal(t[0].key, 'finally');
  // A clue for another sentence marks nothing here.
  assert.ok(tokenize('Hello there.', 0, [{ s: 3, text: 'Hello', el: 'setting' }]).every((x) => x.el === null));
});

test('a reading becomes words read right per minute, accuracy and a finished flag', () => {
  // 100 words, 4 missed, 60 seconds: 96 right = 96 WRR, 96% accurate.
  assert.deepEqual(scoreReading({ total: 100, errors: 4, seconds: 60 }), { reached: 100, errors: 4, correct: 96, seconds: 60, wrr: 96, accuracy: 96, finished: true });
  // Stopped early at word 50 with 2 missed after 30 seconds: 48 right in half a minute is 96 a minute.
  const early = scoreReading({ total: 100, stoppedAt: 50, errors: 2, seconds: 30 });
  assert.equal(early.wrr, 96);
  assert.equal(early.finished, false);
  assert.equal(early.accuracy, 96);
  // Bad input never gives NaN or a negative number.
  const odd = scoreReading({ total: 10, stoppedAt: 99, errors: 500, seconds: 0 });
  assert.ok(odd.reached === 10 && odd.errors === 10 && odd.correct === 0 && odd.wrr === 0 && Number.isFinite(odd.accuracy));
});

test('the suggestion asks for accuracy first, then speed', () => {
  assert.match(suggestion([{ accuracy: 90, wrr: 100 }]), /95%/);
  assert.match(suggestion([{ accuracy: 97, wrr: 100 }]), /135/);
  assert.match(suggestion([{ accuracy: 97, wrr: 140 }]), /next step|harder/);
  assert.match(suggestion([]), /again/);
});

test('a story is complete at 4 of 5 questions', () => {
  assert.equal(storyPassed(4, 5), true);
  assert.equal(storyPassed(3, 5), false);
  assert.equal(storyPassed(0, 0), false);
});

test("today's picks are repeatable for a day and move on the next day", () => {
  const list = INDEX.stories.filter((s) => s.step <= 3);
  const a = todaysPicks(list, new Date(2026, 10, 6, 8));
  const b = todaysPicks(list, new Date(2026, 10, 6, 20));
  const c = todaysPicks(list, new Date(2026, 10, 7, 8));
  assert.deepEqual(a, b);
  assert.equal(a.length, 2);
  assert.notDeepEqual(a.map((x) => x.id), c.map((x) => x.id));
  assert.deepEqual(todaysPicks([], new Date()), []);
});

test('shuffles are repeatable and never hand back the original order', () => {
  const items = ['a', 'b', 'c'];
  assert.deepEqual(shuffled(items, 5), shuffled(items, 5));
  for (let seed = 0; seed < 40; seed++) assert.notDeepEqual(shuffled(items, seed), items, `seed ${seed}`);
  const m = mapChoices({ answer: 'right', wrong: ['x', 'y'] }, 3);
  assert.equal(m.choices[m.answer], 'right');
});

test('the index lists only real, well-formed stories and its word counts match the stories', () => {
  assert.deepEqual(validateReadingIndex(INDEX), []);
  assert.ok(STORIES.length >= 8);
  for (const { e, s } of STORIES) {
    assert.deepEqual(validateStory(s, e), [], e.id);
    assert.equal(e.words, storyWords(s), `${e.id} word count`);
  }
  // Steps promise a length: every story is inside its step.
  const RANGE = { 1: [80, 125], 2: [120, 165], 3: [160, 205], 4: [200, 999] };
  for (const { e } of STORIES) assert.ok(e.words >= RANGE[e.step][0] && e.words <= RANGE[e.step][1], `${e.id} is ${e.words} words`);
});

test('every story teaches every element of its kind, with a clue sentence that exists', () => {
  assert.deepEqual(ELEMENT_IDS.story, ['characters', 'setting', 'problem', 'events', 'solution', 'lesson']);
  assert.deepEqual(ELEMENT_IDS.fact, ['mainidea', 'detail', 'cause', 'takeaway']);
  for (const { s } of STORIES) {
    for (const id of ELEMENT_IDS[s.kind]) {
      assert.ok(s.clues.some((c) => c.el === id), `${s.id} has clue words for ${id}`);
      assert.ok(s.sentences[s.elements[id].find], `${s.id} ${id} points at a sentence`);
    }
    // Clue words reach real words on the page.
    const marked = storyTokens(s).flat().filter((t) => t.el);
    assert.ok(marked.length >= ELEMENT_IDS[s.kind].length, `${s.id} highlights clue words`);
  }
  for (const kind of ['story', 'fact']) for (const g of GUIDE[kind]) assert.ok(g.label && g.ask && g.tip && g.clues.length, `${kind} ${g.id}`);
});

test('multiple choice has one right answer, spread across the positions (so "always the first" cannot be learned)', () => {
  const where = [0, 0, 0];
  for (const { s } of STORIES) for (const q of s.questions.filter((x) => formatOf(x) === 'choice')) { assert.equal(q.choices.length, 3); where[q.answer]++; }
  const all = where[0] + where[1] + where[2];
  assert.ok(all >= 16, 'there are multiple choice questions');
  for (const w of where) assert.ok(w / all > 0.2 && w / all < 0.5, `answer positions ${where}`);
});

test('every passage mixes the ways of answering: choose, true or false, fill in the blank, say it', () => {
  assert.deepEqual(FORMATS, ['choice', 'tf', 'blank', 'say']);
  for (const { s } of STORIES) {
    const used = new Set(s.questions.map(formatOf));
    for (const f of FORMATS) assert.ok(used.has(f), `${s.id} has a ${f} question`);
    // Fill in the blank: exactly one ___ and the answer is accepted.
    for (const q of s.questions.filter((x) => formatOf(x) === 'blank')) {
      assert.equal(q.ask.split('___').length, 2, `${s.id}: ${q.ask}`);
      assert.ok(checkBlank(q.blank, q.accept), `${s.id}: ${q.blank}`);
    }
    // The story map also varies: not every element is multiple choice.
    const mapFormats = new Set(ELEMENT_IDS[s.kind].filter((id) => id !== 'events').map((id) => formatOf(s.elements[id])));
    assert.ok(mapFormats.size >= 2, `${s.id} map uses ${[...mapFormats]}`);
  }
});

test('typed answers ignore capitals, punctuation and a leading the/a/an, but not wrong words', () => {
  assert.equal(normalizeAnswer('  The Park! '), 'park');
  assert.equal(checkBlank('PARK', ['park']), true);
  assert.equal(checkBlank('a coat.', ['coat', 'jacket']), true);
  assert.equal(checkBlank('50,000', ['thousand', '50,000']), true);
  assert.equal(checkBlank('', ['park']), false);
  assert.equal(checkBlank('parking', ['park']), false);
  // One-letter typing slips are forgiven on longer words only.
  assert.equal(checkBlank('sheltr', ['shelter']), true);
  assert.equal(checkBlank('shelterr', ['shelter']), true);
  assert.equal(checkBlank('shalter', ['shelter']), true);
  assert.equal(checkBlank('shltr', ['shelter']), false);
  assert.equal(checkBlank('bark', ['park']), false);
  assert.equal(checkBlank('beach', ['park']), false);
  assert.equal(fillBlank('She went to the ___.', 'park'), 'She went to the park.');
});

test('no official-looking Lexile appears unless it was measured and dated', () => {
  for (const { e, s } of STORIES) {
    assert.equal(e.lexile, undefined, `${e.id}: no Lexile has been measured yet`);
    assert.equal(s.lexile, undefined);
  }
  const bad = { ...INDEX, stories: [{ ...INDEX.stories[0], lexile: 420 }, ...INDEX.stories.slice(1)] };
  assert.match(validateReadingIndex(bad).join(' '), /Lexile needs a whole number and the date/);
  const ok = { ...INDEX, stories: [{ ...INDEX.stories[0], lexile: 420, lexileChecked: '2026-11-06' }, ...INDEX.stories.slice(1)] };
  assert.deepEqual(validateReadingIndex(ok), []);
});

test('validateStory names what is wrong in plain English', () => {
  const { e, s } = STORIES[0];
  const clone = () => JSON.parse(JSON.stringify(s));
  const msg = (mutate) => { const c = clone(); mutate(c); return validateStory(c, e).join(' | '); };
  assert.match(msg((c) => { c.sentences.push('An extra sentence changes the count.'); }), /index says \d+ words/);
  assert.match(msg((c) => { c.clues[0].text = 'not in the sentence'; }), /is not in sentence/);
  assert.match(msg((c) => { c.clues = c.clues.filter((x) => x.el !== 'problem'); }), /no clue words are marked for problem/);
  assert.match(msg((c) => { c.words.zebra = { say: 'ZEE-bra', means: 'an animal', example: 'A zebra ran.' }; }), /"zebra" is not in the passage/);
  const choiceAt = (c) => c.questions.findIndex((q) => formatOf(q) === 'choice' && q.type !== 'listen');
  assert.match(msg((c) => { const q = c.questions[choiceAt(c)]; q.choices[1] = q.choices[0]; }), /choices must all differ/);
  assert.match(msg((c) => { c.questions[choiceAt(c)].answer = 5; }), /answer must be 0, 1 or 2/);
  assert.match(msg((c) => { const q = c.questions.find((x) => formatOf(x) === 'blank'); q.ask = 'No blank here'; }), /exactly one ___ blank/);
  assert.match(msg((c) => { const q = c.questions.find((x) => formatOf(x) === 'blank'); q.accept = ['something else']; }), /"accept" must list the accepted answers/);
  assert.match(msg((c) => { c.questions.find((x) => formatOf(x) === 'tf').answer = 'yes'; }), /must be true or false/);
  assert.match(msg((c) => { c.questions = c.questions.filter((q) => formatOf(q) !== 'say'); }), /needs at least one say question/);
  assert.match(msg((c) => { c.questions = c.questions.filter((q) => q.type !== 'listen'); }), /two listening questions/);
  assert.match(msg((c) => { delete c.elements.solution; }), /elements.solution is missing/);
});

test('the Reading address opens a story by name and keeps the week', () => {
  assert.ok(SECTION_IDS.includes('reading'));
  assert.equal(parseHash('#reading', SECTION_IDS).act, null);
  assert.equal(parseHash('#reading?act=stuckkite', SECTION_IDS).act, 'stuckkite');
  assert.equal(parseHash('#reading?act=../x', SECTION_IDS).act, null);
  assert.equal(buildHash('reading', '2026-11-02', '2026-11-02', { act: 'pip' }), '#reading?act=pip');
});

const ctxFor = (story = null) => ({
  index: { current: '2026-11-02', weeks: [] }, week: { label: 'Week of Nov 2' }, isCurrent: true, section: 'reading', today: new Date(2026, 10, 6, 12),
  link: (s) => buildHash(s, '2026-11-02', '2026-11-02'),
  actLink: (s, act) => buildHash(s, '2026-11-02', '2026-11-02', { act }),
  reading: { index: INDEX, story, entry: story ? INDEX.stories.find((x) => x.id === story.id) : null },
});

test('the library shows today\'s two picks, every step and each story\'s word count', () => {
  const out = readingView(ctxFor()).s;
  assert.match(out, /<h1[^>]*>Reading<\/h1>/);
  assert.match(out, /Today's reading/);
  for (const { e } of STORIES) assert.ok(out.includes(`href="#reading?act=${e.id}"`), `${e.id} has a link`);
  for (const { e } of STORIES) assert.ok(out.includes(`${e.words} words`), `${e.id} shows ${e.words} words`);
  for (const st of INDEX.steps) assert.ok(out.includes(st.label));
  assert.match(out, /Start here/);
  assert.doesNotMatch(out, /\d+L ·/, 'no Lexile is shown until one is measured');
});

test('a story page has its title bar, a way back and the place the Reading Coach fills in', () => {
  const { s } = STORIES[0];
  const out = readingView(ctxFor(s)).s;
  assert.match(out, new RegExp(`<h1[^>]*>${s.title}</h1>`));
  assert.match(out, /id="rd"/);
  assert.match(out, /href="#reading"/);
  assert.match(out, new RegExp(`${storyWords(s)} words`));
});

test('the answer key lists every map answer and every question\'s right answer, whatever its format', () => {
  for (const { s } of STORIES) {
    const key = answerKey(s);
    assert.deepEqual(key.map.map((m) => m.id), ELEMENT_IDS[s.kind], s.id);
    for (const m of key.map) assert.ok(Array.isArray(m.answer) ? m.answer.length === 3 : m.answer.length > 3, `${s.id} ${m.id}`);
    assert.equal(key.questions.length, s.questions.length);
    s.questions.forEach((q, i) => {
      const f = formatOf(q), a = key.questions[i].answer;
      if (f === 'choice') assert.equal(a, q.choices[q.answer]);
      else if (f === 'tf') assert.equal(a, q.answer ? 'True' : 'False');
      else if (f === 'blank') { assert.ok(a.includes(q.blank) && !a.includes('___'), `${s.id} q${i}: ${a}`); }
      else assert.equal(a, q.answer);
    });
  }
});

test('clue colours stay out of the reading steps: they appear only in the Answers step, and only when he asks', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/reading-player.js'), 'utf8');
  const asks = [...src.matchAll(/passage\(\{[^}]*reveal: /g)];
  assert.equal(asks.length, 1, 'exactly one place asks for the clue colours');
  assert.match(src.slice(src.indexOf('function answersView')), /passage\(\{ reveal: S\.keyClues \}\)/);
  assert.ok(!/clueSwitch|data-act="clues"/.test(src), 'no switch turns the colours on while reading');
});
