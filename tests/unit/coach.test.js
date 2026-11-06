// Reading Coach engine (js/lib/coach.js): item states, help tracking, retries, summaries and the exemplar's quality rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  answerText, attempted, buildItems, buildSummary, evidenceOverlap, evidenceSentences, firstAttempt, hintAt, lengthBias,
  newState, newWritten, reveal, retry, selfAssess, statusOf, submit, useHint, writtenStatus,
} from '../../js/lib/coach.js';
import { CORE_SKILLS, WRITTEN_SKILLS, checkBlank, validateCoach, validateStory } from '../../js/lib/reading.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/reading/index.json');
const EX = readJSON('data/reading/missingbook.json');
const ITEMS = buildItems(EX);
const byId = (id) => ITEMS.all.find((x) => x.id === id);
const choiceItem = byId('c4-question'); // right answer is index 2

// ---------------------------------------------------------------- one item's state

test('an unanswered item is not a mistake', () => {
  const st = newState();
  assert.equal(statusOf(st, choiceItem), 'unanswered');
  assert.equal(firstAttempt(st), null);
  assert.equal(attempted(st, choiceItem), false);
});

test('right on the first try, or right after another try with no help, is found independently', () => {
  const a = newState();
  assert.deepEqual(submit(a, choiceItem, 2), { correct: true, done: true, stage: 'main' });
  assert.equal(statusOf(a, choiceItem), 'independent');
  const b = newState();
  submit(b, choiceItem, 0);
  assert.equal(statusOf(b, choiceItem), 'practicing');
  submit(b, choiceItem, 2);
  assert.equal(statusOf(b, choiceItem), 'independent', 'a second try without help is still independent');
  // The first try stays on record separately for the parent.
  assert.deepEqual(firstAttempt(b), { correct: false, stage: 'main' });
  assert.deepEqual(firstAttempt(a), { correct: true, stage: 'main' });
});

test('graduated help: level 1 says what to look for, level 2 only points at the evidence sentences, level 3 states the answer and why', () => {
  const st = newState();
  assert.equal(useHint(st), 1);
  const h1 = hintAt(EX, choiceItem, 1), h2 = hintAt(EX, choiceItem, 2), h3 = hintAt(EX, choiceItem, 3);
  assert.equal(h1.title, 'What to look for');
  assert.ok(!JSON.stringify(h1).includes('Where did you last read it'), 'hint 1 does not give the answer away');
  assert.equal(useHint(st), 2);
  assert.deepEqual(h2.sentences.map((x) => x.i), [9]);
  assert.equal(st.revealed, false, 'pointing at the sentence is help, but only level 3 states the answer (a reveal)');
  assert.equal(useHint(st), 3);
  assert.equal(st.revealed, true);
  assert.match(h3.text, /Where did you last read it/);
  assert.match(h3.explain, /remember the car/);
  assert.equal(useHint(st), 3, 'never goes past level 3');
});

test('finished after a hint is "with help", never "independent"; a hint alone is not an attempt', () => {
  const st = newState();
  useHint(st);
  assert.equal(statusOf(st, choiceItem), 'unanswered', 'asking for a hint does not make a mistake');
  submit(st, choiceItem, 2);
  assert.equal(statusOf(st, choiceItem), 'withHelp');
});

test('seeing the answer in the answer-review area: before finishing it means "with help", after finishing it changes nothing', () => {
  const early = newState();
  reveal(early);
  assert.equal(statusOf(early, choiceItem), 'practicing', 'shown the answer but not yet answered');
  submit(early, choiceItem, 2);
  assert.equal(statusOf(early, choiceItem), 'withHelp');
  const late = newState();
  submit(late, choiceItem, 2);
  reveal(late);
  assert.equal(statusOf(late, choiceItem), 'independent');
  assert.equal(late.reviewedAfter, true);
});

test('true/false with a follow-up: the item is finished only when both parts are right', () => {
  const tf = byId('c2-ontime');
  const st = newState();
  assert.equal(submit(st, tf, true).correct, false, 'the statement is false');
  const r = submit(st, tf, false);
  assert.deepEqual([r.correct, r.done, r.stage], [true, false, 'follow']);
  assert.equal(statusOf(st, tf), 'practicing');
  assert.equal(submit(st, tf, 2).correct, false, 'a wrong correction');
  const last = submit(st, tf, 0);
  assert.deepEqual([last.correct, last.done], [true, true]);
  assert.equal(statusOf(st, tf), 'independent');
  assert.equal(answerText(tf), 'False. Corrected: Noah returned the book on time.');
});

test('choosing the supporting sentence is part of an inference question', () => {
  const inf = byId('c7-careful');
  const st = newState();
  assert.equal(submit(st, inf, 1).stage, 'follow');
  assert.equal(submit(st, inf, 1).correct, false, 'a sentence that does not prove it');
  assert.equal(submit(st, inf, 0).done, true);
});

test('typed blanks: spelling slips are forgiven but a different concept is not', () => {
  const blank = byId('c1-nightly');
  for (const ok of ['bed', 'Bed.', 'the bed', ' bedtime ']) { const st = newState(); assert.equal(submit(st, blank, ok).correct, true, ok); }
  for (const bad of ['', 'breakfast', 'school', 'bad']) { const st = newState(); assert.equal(submit(st, blank, bad).correct, false, bad); }
  const friday = ['friday'];
  assert.equal(checkBlank('Fridya', friday), true, 'swapped letters');
  assert.equal(checkBlank('Frday', friday), true, 'a missing letter');
  assert.equal(checkBlank('Monday', friday), false);
  assert.equal(checkBlank('Fryday', ['friday'], ['fryday']), false, 'a rejected spelling is never accepted');
});

test('sequence: a wrong tap is a try, a right tap places the card, and the last card finishes it', () => {
  const seq = byId('c5-search');
  const st = newState();
  assert.equal(submit(st, seq, seq.order[2]).correct, false);
  assert.deepEqual(st.slots, []);
  assert.equal(statusOf(st, seq), 'practicing');
  seq.order.forEach((card, i) => { const r = submit(st, seq, card); assert.equal(r.correct, true); assert.equal(r.done, i === seq.order.length - 1); });
  assert.deepEqual(firstAttempt(st), { correct: false, stage: 'main' });
  assert.notDeepEqual(seq.display, seq.order, 'cards are shown mixed up');
});

test('retry starts another round without erasing the first one, and the first try stays on record', () => {
  const st = newState();
  submit(st, choiceItem, 0);
  useHint(st);
  submit(st, choiceItem, 2);
  assert.equal(statusOf(st, choiceItem), 'withHelp');
  retry(st);
  assert.equal(st.round, 2);
  assert.equal(statusOf(st, choiceItem), 'unanswered', 'a fresh round starts unanswered');
  assert.equal(st.history.length, 1);
  assert.equal(st.history[0].attempts.length, 2, 'the earlier tries are kept');
  assert.equal(st.history[0].helped, true);
  assert.deepEqual(firstAttempt(st), { correct: false, stage: 'main' });
  assert.equal(attempted(st, choiceItem), true, 'he has worked on it, so the activity still counts as done');
  submit(st, choiceItem, 2);
  assert.equal(statusOf(st, choiceItem), 'independent', 'right on the new round with no help');
});

test('self-checked "say it" items (passage-original) are kept out of the checked results', () => {
  const legacy = buildItems(readJSON('data/reading/stuckkite.json'));
  const say = legacy.all.find((x) => x.format === 'say');
  assert.ok(say && say.selfChecked);
  const st = newState();
  assert.equal(statusOf(st, say), 'unanswered');
  selfAssess(st, true);
  assert.equal(statusOf(st, say), 'self');
  assert.throws(() => submit(newState(), say, 'anything'), /self-checked/);
});

// ---------------------------------------------------------------- written responses

test('written responses are saved, self-assessed and parent-reviewed; they are never auto-graded', async () => {
  const w = newWritten();
  assert.equal(writtenStatus(w), 'unanswered');
  w.text = '   ';
  assert.equal(writtenStatus(w), 'unanswered', 'blank spaces are not an answer');
  w.text = 'Noah was worried because he might lose the book.';
  assert.equal(writtenStatus(w), 'draft');
  w.compared = true;
  assert.equal(writtenStatus(w), 'selfAssessed');
  w.reviewed = true;
  assert.equal(writtenStatus(w), 'reviewed');
  // The engine has no function that scores prose: a response is kept, compared with a model, and reviewed by a person.
  const exported = Object.keys(await import('../../js/lib/coach.js'));
  assert.deepEqual(exported.filter((k) => /grade|mark|match|keyword|similar/i.test(k)), [], 'no prose-grading function exists');
});

// ---------------------------------------------------------------- the parent summary

test('the parent summary keeps checked results, help, unanswered items, self-assessment and written work apart', () => {
  const items = buildItems(EX);
  const states = Object.fromEntries(items.all.map((x) => [x.id, newState()]));
  submit(states['c4-question'], byId('c4-question'), 2);                    // independent
  submit(states['c1-nightly'], byId('c1-nightly'), 'dinner');               // practicing
  useHint(states['c3-feeling']); submit(states['c3-feeling'], byId('c3-feeling'), 2); // with help
  const written = { 'w1-worried': { ...newWritten(), text: 'Noah was worried because he might lose it.', compared: true, checks: [true, true, false] } };
  const sum = buildSummary({ story: EX, items, states, writtenStates: written, readings: [{ wrr: 80 }], activities: [{ id: 'quiz', done: true }], lookBacks: 2 });
  assert.deepEqual(sum.counts, { independent: 1, withHelp: 1, practicing: 1, unanswered: sum.total - 3 });
  assert.equal(sum.total, 16, 'two listening, six map and eight core questions are checked');
  assert.deepEqual(sum.withHelp.map((r) => r.id), ['c3-feeling']);
  assert.ok(sum.unanswered.every((r) => r.status === 'unanswered'));
  assert.deepEqual(sum.skillsToRevisit.sort(), ['Finding details', 'Story elements'].sort());
  assert.equal(sum.firstTry.tried, 3);
  assert.equal(sum.firstTry.right, 2);
  assert.equal(sum.written.find((w) => w.id === 'w1-worried').status, 'selfAssessed');
  assert.equal(sum.written.find((w) => w.id === 'w2-remember').status, 'unanswered');
  assert.equal(sum.lookBacks, 2);
  assert.equal(sum.selfAssessed.length, 0, 'the exemplar has no say-it items; written work is listed separately');

  // A passage-original say-it item is counted as self-assessed, never mixed into the checked results.
  const legacy = readJSON('data/reading/stuckkite.json');
  const li = buildItems(legacy);
  const ls = Object.fromEntries(li.all.map((x) => [x.id, newState()]));
  const sayId = li.all.find((x) => x.format === 'say').id;
  selfAssess(ls[sayId], true);
  const lsum = buildSummary({ story: legacy, items: li, states: ls });
  assert.equal(lsum.selfAssessed.length, 2);
  assert.ok(lsum.checked.every((r) => !r.selfChecked));
  assert.equal(lsum.counts.independent + lsum.counts.withHelp + lsum.counts.practicing + lsum.counts.unanswered, lsum.checked.length);
});

// ---------------------------------------------------------------- the exemplar

test('the exemplar passes validation and every other passage is untouched', () => {
  const entry = INDEX.stories.find((e) => e.id === 'missingbook');
  assert.deepEqual(validateStory(EX, entry), []);
  const others = INDEX.stories.filter((e) => e.id !== 'missingbook');
  assert.equal(others.length, 7);
  for (const e of others) assert.ok(!readJSON(`data/reading/${e.id}.json`).coach, `${e.id} keeps its original questions`);
});

test('the exemplar has eight core questions covering the required skills, in order, with mixed formats', () => {
  assert.deepEqual(ITEMS.core.map((x) => x.skill), CORE_SKILLS);
  assert.equal(ITEMS.core.length, 8);
  assert.deepEqual(ITEMS.written.map((x) => x.skill), WRITTEN_SKILLS);
  const formats = new Set(ITEMS.all.map((x) => x.format));
  for (const f of ['choice', 'tf', 'blank', 'sequence']) assert.ok(formats.has(f), f);
  assert.ok(ITEMS.core.some((x) => x.format === 'blank'), 'a typed blank among the core questions');
  assert.ok(ITEMS.core.some((x) => x.follow?.kind === 'correction'), 'a true/false that asks him to correct the false statement');
  assert.ok(ITEMS.core.some((x) => x.follow?.kind === 'evidence'), 'a question that asks for supporting evidence');
  assert.equal(ITEMS.core.find((x) => x.skill === 'inference').follow.kind, 'evidence', 'the inference is supported by a chosen sentence');
});

test('no two exemplar items test the same fact (the story map and the questions do not repeat each other)', () => {
  const facts = [...ITEMS.all, ...ITEMS.written].map((x) => x.fact);
  assert.equal(new Set(facts).size, facts.length, `duplicate facts: ${facts.filter((f, i) => facts.indexOf(f) !== i)}`);
  assert.equal(facts.length, 19);
  // Seen another way: no two different items share a question or a statement.
  const asks = [...ITEMS.all, ...ITEMS.written].map((x) => x.ask.toLowerCase());
  assert.equal(new Set(asks).size, asks.length);
});

test('every exemplar item has evidence sentences, a first hint and an explanation; hints never contain the answer', () => {
  for (const it of [...ITEMS.all, ...ITEMS.written]) {
    assert.ok(it.evidence.length > 0, `${it.id} has evidence`);
    assert.ok(evidenceSentences(EX, it).every((e) => e.text), `${it.id} evidence sentences exist`);
    assert.ok(it.hint.length > 10, `${it.id} has a hint`);
    if (it.group !== 'written') assert.ok(it.explain && it.explain.length > 20, `${it.id} explains its answer`);
  }
  // Hint 1 must not hand over the answer (checked for the short, typed or chosen answers).
  for (const it of ITEMS.all.filter((x) => x.format === 'blank')) assert.ok(!it.hint.toLowerCase().includes(String(it.blank).toLowerCase()), `${it.id} hint gives the word away`);
  for (const it of ITEMS.all.filter((x) => x.format === 'choice')) assert.ok(!it.hint.toLowerCase().includes(it.choices[it.right].toLowerCase()), `${it.id} hint gives the choice away`);
});

test('exemplar evidence supports the answers (typed words appear in the evidence; chosen proofs are evidence sentences)', () => {
  for (const it of ITEMS.all.filter((x) => x.format === 'blank')) {
    const text = it.evidence.map((i) => EX.sentences[i].toLowerCase()).join(' ');
    assert.ok(it.accept.some((a) => text.includes(a.toLowerCase())), `${it.id}: "${it.blank}" is in its evidence`);
  }
  for (const it of ITEMS.all.filter((x) => x.follow?.kind === 'evidence')) {
    assert.ok(it.evidence.some((i) => EX.sentences[i] === it.follow.choices[it.follow.right]), `${it.id}: the proof is one of its evidence sentences`);
  }
  // Items whose answer shares no word with the evidence are listed for a person to check (inference or synonyms); all are known.
  const review = ITEMS.all.filter((x) => !evidenceOverlap(EX, x).ok).map((x) => x.id).sort();
  assert.deepEqual(review, ['c1-nightly', 'c3-feeling', 'm-characters'], 'bedtime/bed, relieved/thankful (an inference from the hug) and mother/mom are the only synonym cases');
});

test('exemplar questions that ask "where and when" give both in every choice', () => {
  const setting = byId('m-setting');
  assert.match(setting.ask, /where and when/i);
  for (const c of setting.choices) assert.match(c, /^(At|In) .+, on /, `"${c}" names a place and a time`);
});

test('exemplar choices: the right answer is not usually the longest, and not usually the most detailed', () => {
  const lb = lengthBias(ITEMS.all);
  assert.equal(lb.n, 12);
  assert.ok(lb.longestRate <= 0.34, `the right choice is the longest ${lb.longest} of ${lb.n} times`);
  assert.ok(lb.shortest / lb.n <= 0.34, `the right choice is the shortest ${lb.shortest} of ${lb.n} times`);
  assert.deepEqual(lb.bigGap, [], 'no right answer is 1.5 times longer than every wrong one');
  const where = [0, 0, 0];
  for (const it of ITEMS.all) { if (it.format === 'choice') where[it.right]++; if (it.follow) where[it.follow.right]++; }
  assert.deepEqual(where, [4, 4, 4], 'right answers are spread evenly over the three positions');
});

test('exemplar written prompts have starters with a blank, a model and a checklist', () => {
  assert.equal(ITEMS.written.length, 3);
  const starters = ITEMS.written.flatMap((w) => w.starters);
  assert.ok(starters.includes('Noah was worried because ___.'));
  assert.ok(starters.includes('Remembering where he last read helped because ___.'));
  assert.ok(starters.includes('First ___, then ___, and finally ___.'));
  for (const w of ITEMS.written) { assert.ok(w.model.length > 40); assert.ok(w.checklist.length >= 3); }
});

test('validateCoach names what is wrong', () => {
  const clone = () => JSON.parse(JSON.stringify(EX));
  const msg = (mutate) => { const c = clone(); mutate(c); return validateCoach(c, 'x').join(' | '); };
  assert.match(msg((c) => { c.coach.core[0].evidence = []; }), /evidence must list/);
  assert.match(msg((c) => { c.coach.core[1].fact = c.coach.core[0].fact; }), /tested twice/);
  assert.match(msg((c) => { c.coach.core[0].blank = 'zebra'; c.coach.core[0].accept = ['zebra']; }), /must appear in its evidence/);
  assert.match(msg((c) => { c.coach.core[2].skill = 'cause'; }), /skill must be element/);
  assert.match(msg((c) => { c.coach.core.pop(); }), /exactly 8 questions/);
  assert.match(msg((c) => { c.coach.core[1].follow = undefined; c.coach.core[6].follow = undefined; }), /correct the false statement|supports his answer/);
  assert.match(msg((c) => { c.coach.core[6].follow.choices[0] = 'A sentence that is not in the story.'; }), /must be a sentence of the passage/);
  assert.match(msg((c) => { c.coach.written[0].starters = ['No blank here']; }), /starters/);
  assert.match(msg((c) => { c.coach.written[1].checklist = ['one']; }), /checklist/);
  assert.match(msg((c) => { c.coach.core[3].explain = ''; }), /explain/);
});

// ---------------------------------------------------------------- evidence in every passage (reported issue 6)

const ALL = INDEX.stories.map((e) => ({ e, s: readJSON(`data/reading/${e.id}.json`) }));

test('every passage\'s evidence references exist, and a typed answer always appears in its evidence sentences', () => {
  for (const { e, s } of ALL) {
    const it = buildItems(s);
    for (const x of it.all) {
      assert.ok(x.evidence.length > 0 && x.evidence.every((i) => Number.isInteger(i) && s.sentences[i]), `${e.id} ${x.id}: evidence sentences exist`);
      if (x.format === 'blank') {
        const text = x.evidence.map((i) => s.sentences[i].toLowerCase()).join(' ');
        assert.ok(x.accept.some((a) => text.includes(String(a).toLowerCase())), `${e.id} ${x.id}: "${x.blank}" is not in evidence S${x.evidence.map((i) => i + 1)}`);
      }
      if (x.format === 'sequence') assert.ok(x.evidence.length >= x.order.length, `${e.id} ${x.id}: a sequence of ${x.order.length} steps cites ${x.evidence.length} sentence(s)`);
    }
  }
});

test('the evidence heuristic flags only the cases a person has reviewed and found fine (a new miss needs a human look)', () => {
  // colony/colonies, maple/maples and "ink" (too short for the word filter) are the same word; "cookies" and "two hours" are false
  // statements whose evidence says what is true instead; the exemplar's three are synonyms or an inference (see its test above).
  const REVIEWED = { busybees: ['q0'], leafcolor: ['q3'], lemonade: ['q1'], octopus: ['q5'], raindelay: ['q4'], missingbook: ['c1-nightly', 'c3-feeling', 'm-characters'] };
  for (const { e, s } of ALL) {
    const miss = buildItems(s).all.filter((x) => !evidenceOverlap(s, x).ok).map((x) => x.id).sort();
    assert.deepEqual(miss, (REVIEWED[e.id] || []).slice().sort(), `${e.id} has an evidence reference nobody has reviewed`);
  }
});

test('a reference may cite several sentences when one is not enough, in the passages that have not been rewritten too', () => {
  const pip = buildItems(readJSON('data/reading/pip.json'));
  assert.deepEqual(pip.map.find((x) => x.id === 'm-characters').evidence, [0, 4], 'Pip is the puppy (S1) and Tia is the girl (S5)');
  assert.deepEqual(pip.all.find((x) => x.id === 'q3').evidence, [2, 3, 6], 'wet and cold comes from the rain (S3) and the dry place (S4), as well as the coat (S7)');
  const leaf = buildItems(readJSON('data/reading/leafcolor.json'));
  assert.deepEqual(leaf.map.find((x) => x.id === 'm-mainidea').evidence, [0, 1, 2]);
  assert.deepEqual(buildItems(readJSON('data/reading/raindelay.json')).map.find((x) => x.id === 'm-events').evidence.length, 6);
  // The validator accepts a list but not an empty list, a repeat or a sentence that is not there.
  const entry = INDEX.stories.find((x) => x.id === 'pip');
  const bad = (f) => { const c = readJSON('data/reading/pip.json'); c.elements.characters.find = f; return validateStory(c, entry).join(' '); };
  assert.equal(bad([0, 4]), '');
  assert.match(bad([]), /sentence number, or a list/);
  assert.match(bad([4, 4]), /sentence number, or a list/);
  assert.match(bad([0, 99]), /sentence number, or a list/);
});
