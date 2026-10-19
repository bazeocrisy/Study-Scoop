// Skill Builders (DECISIONS D22): every question set, checked over many random draws.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_SETS, roundItem, roundParts, timesItem } from '../../js/lib/skills.js';
import { check, helpSteps, solution, validateQuiz } from '../../js/lib/lessons.js';
import { wrongFactsInText } from '../../js/lib/arith.js';
import { ACTIVITIES, missesAct, rng } from '../../js/lib/activities.js';
import { learnExamples } from '../../js/views/skills.js';
import { itemCard } from '../../js/views/lesson.js';

const SIZE = { addtest: 10, roundtest: 10, timestest: 12 };
const SEEDS = Array.from({ length: 150 }, (_, k) => k + 1);
const strings = (v, out = []) => (typeof v === 'string' ? out.push(v) : v && typeof v === 'object' ? Object.values(v).forEach((x) => strings(x, out)) : null, out);
const asText = (sol) => Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, String(v)]));

test('every Skill Builders set: the right number of questions, all valid, all different, every one accepts its own answer', () => {
  for (const seed of SEEDS) {
    const rand = rng(seed);
    for (const [act, set] of Object.entries(SKILL_SETS)) {
      const items = set.make(rand);
      assert.equal(items.length, SIZE[act] || 20, `${act} seed ${seed}`);
      assert.deepEqual(validateQuiz(items, set.pass || 1, act), [], `${act} seed ${seed}`);
      const keys = items.map((it) => `${it.prompt}|${(it.lines || []).join(' ')}`);
      assert.equal(new Set(keys).size, keys.length, `${act} seed ${seed}: a question repeats`);
      for (const it of items) {
        assert.equal(check(it, asText(solution(it))).status, 'correct', `${act} ${it.prompt}`);
        if (it.practice) assert.equal(check(it.practice, asText(solution(it.practice))).status, 'correct', `${act} practice form of ${it.prompt}`);
        for (const s of strings(it)) if (!/\[[a-z]/.test(s)) assert.deepEqual(wrongFactsInText(s), [], `${act}: "${s}"`);
      }
    }
  }
});

test('every practice question has at least two Help steps, and the answer only comes in the worked steps', () => {
  for (const seed of SEEDS.slice(0, 40)) {
    const rand = rng(seed);
    for (const [act, set] of Object.entries(SKILL_SETS)) {
      for (const it of set.make(rand)) {
        const steps = helpSteps(it.practice || it);
        assert.ok(steps.length >= 2, `${act} ${it.prompt}: ${steps.length} steps`);
        assert.equal(steps.at(-1).kind, 'show');
        const ans = String(solution(it).answer ?? '');
        for (const h of (it.practice || it).hints || []) if (ans.length > 1) assert.ok(!new RegExp(`(^|[^\\d])${ans}(?!\\d)`).test(h), `${act} ${it.prompt}: hint gives ${ans}: "${h}"`);
      }
    }
  }
});

test('rounding: the class method gives the right answer for every number, and the "9 goes up" cases', () => {
  for (const to of [10, 100]) {
    for (let n = to === 10 ? 10 : 100; n <= 999; n++) {
      const p = roundParts(n, to);
      assert.equal(p.answer, Math.floor(n / to + 0.5) * to, `${n} to the nearest ${to}`);
      assert.equal(p.carry, p.up && p.d === 9);
    }
  }
  assert.deepEqual([roundParts(897, 10).answer, roundParts(96, 10).answer, roundParts(962, 100).answer, roundParts(45, 10).answer, roundParts(250, 100).answer], [900, 100, 1000, 50, 300]);
  for (const seed of SEEDS) {
    for (const act of ['roundten', 'roundhun']) {
      const items = SKILL_SETS[act].make(rng(seed));
      assert.ok(items.filter((it) => roundParts(it.n, it.to).carry).length >= 3, `${act} seed ${seed}: at least 3 "9 goes up" questions`);
      const ups = items.filter((it) => roundParts(it.n, it.to).up).length;
      assert.ok(ups >= 6 && ups <= 14, `${act} seed ${seed}: ${ups} of 20 go up`);
    }
  }
});

test('rounding feedback says which step went wrong and never gives the rounded number', () => {
  for (const [n, to] of [[897, 10], [45, 10], [63, 10], [347, 100], [962, 100], [96, 10]]) {
    const it = { ...roundItem(n, to), id: 'r' };
    const p = roundParts(n, to);
    const right = { place: String(p.place), dir: p.up ? 'up' : 'stay', answer: String(p.answer) };
    assert.equal(check(it, right).status, 'correct');
    const tries = [
      { ...right, place: String(p.place === 0 ? 1 : 0) }, { ...right, dir: p.up ? 'stay' : 'up' },
      { ...right, answer: String(n) }, { ...right, answer: String(p.answer + 5) }, { ...right, answer: String(p.answer + to) }, { ...right, answer: String(p.answer - to) },
    ];
    for (const r of tries) {
      const out = check(it, r);
      assert.equal(out.status, 'notyet', `${n} ${JSON.stringify(r)}`);
      assert.ok(!new RegExp(`\\b${p.answer}\\b`).test(out.say), `${n}: "${out.say}" gives the answer`);
    }
    assert.match(check(it, tries[0]).say, /underline the digit in the (tens|hundreds) place/);
    assert.match(check(it, tries[1]).say, /^The arrow points to \d\./);
    assert.equal(check(it, { place: String(p.place) }).status, 'empty');
  }
  assert.match(check({ ...roundItem(897, 10), id: 'r' }, { place: '1', dir: 'up', answer: '890' }).say, /goes up to 10\. Write 0 in the tens place and add 1 to the hundreds (place|digit)/);
});

test('Mental Add: every break-apart crosses a ten, every next-ten fact crosses a ten, sums stay under 100', () => {
  for (const seed of SEEDS) {
    for (const it of SKILL_SETS.addsplit.make(rng(seed))) {
      const s = solution(it);
      assert.ok(s.t < 100, it.lines[0]);
      if (it.kind === 'split1') assert.ok(s.c + (s.b % 10) >= 10, `${it.lines[0]} does not cross a ten`);
    }
    for (const it of SKILL_SETS.addfacts.make(rng(seed))) {
      if (it.kind === 'bridge' || it.kind === 'nextten') { const [a, b] = it.answer.split(' + ').map(Number); assert.ok((a % 10) + b > 10, it.prompt); }
    }
  }
  // The child's own example: 12 + 9 = 10 + 9 + 2 = 19 + 2 = 21.
  assert.deepEqual(learnExamples('add').find((e) => e.title.includes('12 + 9')).steps.slice(1, 3), ['Add the ten first: 10 + 9 = 19.', 'Then add the ones: 19 + 2 = 21.']);
});

test('Times Tables: facts from the 2s to the 10s, never the same fact twice; Tricky Facts always has a 6, 7, 8 or 9', () => {
  for (const seed of SEEDS) {
    for (const act of ['timesall', 'timestricky', 'timestest']) {
      const facts = SKILL_SETS[act].make(rng(seed)).map((it) => it.answer.split(' × ').map(Number));
      assert.equal(new Set(facts.map((f) => [...f].sort((a, b) => a - b).join('x'))).size, facts.length, `${act} repeats a fact`);
      for (const f of facts) assert.ok(f.every((x) => x >= 2 && x <= 10), f.join('×'));
      if (act === 'timestricky') for (const f of facts) assert.ok(f.some((x) => [6, 7, 8, 9].includes(x)), f.join('×'));
    }
  }
  for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) assert.match(timesItem(a, b).show.at(-1), new RegExp(`= ${a * b}\\.$`));
});

test('Learn It pages: every sentence of arithmetic is true, and the rounding pictures match their steps', () => {
  for (const skill of ['add', 'round', 'times']) {
    for (const ex of learnExamples(skill)) {
      for (const s of strings(ex)) assert.deepEqual(wrongFactsInText(s), [], `${skill}: "${s}"`);
      if (ex.round) assert.ok(ex.steps.at(-1).endsWith(`rounds to ${roundParts(ex.round.n, ex.round.to).answer}.`));
    }
  }
});

test('Skill Builders tests: no Help during the test, a pass mark, and each skill keeps its own Practice My Misses', () => {
  for (const [act, card] of [['addtest', 'add'], ['roundtest', 'round'], ['timestest', 'times']]) {
    const set = SKILL_SETS[act];
    const items = set.make(rng(3));
    assert.ok(set.pass >= Math.ceil(items.length * 0.75) && set.pass < items.length, `${act} pass ${set.pass}`);
    for (const it of items) {
      const out = itemCard({ catchAll: 'Try again.' }, it, 'test', { items: { [it.id]: { tries: 2, status: 'notyet', say: 'x', help: 1 } } }).s;
      assert.doesNotMatch(out, /data-act="help"|help-panel|feedback/, `${act}: test shows Help`);
    }
    assert.equal(missesAct('skills', act), `${card}misses`);
  }
  const groups = ACTIVITIES.skills.filter((a) => a.misses).map((a) => a.group);
  assert.deepEqual(groups, ['skilladd', 'skillround', 'skilltimes']);
});

test('audit fixes: test balance, question ids, ten-plus reasons, rounding reasons, strategy factor, 1,000', async () => {
  const { explainNumber, readNumber } = await import('../../js/lib/lessons.js');
  for (const seed of SEEDS) {
    // The Rounding Test: each half has a "9 goes up", and at least 2 "stay the same" answers.
    const items = SKILL_SETS.roundtest.make(rng(seed));
    for (const to of [10, 100]) {
      const half = items.filter((it) => it.to === to).map((it) => roundParts(it.n, it.to));
      assert.equal(half.length, 5);
      assert.equal(half.filter((p) => p.carry).length, 1, `seed ${seed} nearest ${to}: one "9 goes up"`);
      assert.ok(half.filter((p) => !p.up).length >= 2, `seed ${seed} nearest ${to}: at least 2 stay the same`);
    }
    // Ids name the question, so the same question always has the same id (Practice My Misses never mixes them up).
    for (const set of Object.values(SKILL_SETS)) for (const it of set.make(rng(seed))) {
      assert.match(it.id, /^[a-z0-9-]+$/);
      if (it.practice) assert.match(it.practice.id, /^(af|as|round|times)-/);
    }
  }
  assert.equal(roundItem(345, 10).id, 'round-345-10');
  assert.notEqual(roundItem(345, 10).id, roundItem(345, 100).id);
  assert.equal(explainNumber({ type: 'number', answer: '10 + 6', prompt: '10 + 6 = ?' }, 6), 'You forgot to add the 10. Adding 10 gives one more ten.');
  // Rounding: the reason names the step that went wrong.
  const r = (n, to, x) => check({ ...roundItem(n, to) }, { place: String(roundParts(n, to).place), dir: roundParts(n, to).up ? 'up' : 'stay', answer: String(x) }).say;
  assert.equal(r(43, 10, 30), 'Staying the same means the 4 does not change.');
  assert.equal(r(45, 10, 60), 'Going up means the 4 becomes 1 more.');
  assert.equal(r(684, 100, 600), 'Going up means the 6 becomes 1 more.');
  assert.equal(r(505, 10, 610), 'The digits to the left of the underlined digit stay the same.');
  assert.match(r(97, 10, 90), /write 1 in the hundreds place/);
  assert.match(r(897, 10, 800), /add 1 to the hundreds digit/);
  // Times: a 10, 2 or 5 is used first.
  assert.match(timesItem(9, 2).hints[0], /double/);
  assert.match(timesItem(7, 10).hints[0], /tens/);
  assert.match(timesItem(9, 5).hints[0], /Count by 5s/);
  assert.equal(readNumber('1,000').value, 1000);
  // The make-10 hints never list the pair.
  for (let a = 1; a <= 9; a++) for (const it of SKILL_SETS.addfacts.make(rng(a)).filter((x) => x.kind === 'make10')) assert.ok(!/and 9, 2 and 8/.test(it.hints.join(' ')));
  // Learn It examples use the same strategy as the practice Help.
  for (const ex of learnExamples('times').filter((e) => e.steps && /Example/.test(e.title))) {
    const [a, b] = ex.title.match(/\d+/g).map(Number);
    assert.equal(ex.steps[0], timesItem(a, b).hints[0], ex.title);
  }
});
