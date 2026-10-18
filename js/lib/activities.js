// Weekly practice activities and Study Scoop practice tests (pure, no DOM). DECISIONS D18.
// Vocabulary and spelling questions are built from the week's verified data (teacher definitions are used
// exactly as written); the math and vocabulary tests are authored in data/tests/<week>.json and checked here.

import { decompositionOf, normWord, validateQuiz } from './lessons.js';
import { pictureName } from './data.js';

// Each subject opens on a menu of these (menu-first navigation, DECISIONS D19). `page` marks a page to read
// (no questions); `parent` puts an activity on a second menu (Math > Practice Problems).
export const ACTIVITIES = {
  spelling: [
    { id: 'learn', label: 'Learn My Words', about: 'See this week\'s words, pictures and spelling rules.', icon: 'book', page: true },
    { id: 'flash', label: 'Flashcards', about: 'Tap a card to turn it over and see the word.', icon: 'cards' },
    { id: 'letters', label: 'Missing Letters', about: 'Hear a word, then type the missing letters.', icon: 'puzzle' },
    { id: 'listen', label: 'Listen & Spell', about: 'Hear a word and a sentence, then type the word.', icon: 'ear' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the words you missed.', icon: 'redo' },
  ],
  vocab: [
    { id: 'learn', label: 'Learn My Words', about: 'See each word, its picture, what it means and a sentence.', icon: 'book' },
    { id: 'choice', label: 'Multiple Choice', about: 'Pick the right meaning or the right word.', icon: 'choice' },
    { id: 'truefalse', label: 'True or False', about: 'Read a sentence about a word. Is it true?', icon: 'truefalse' },
    { id: 'fill', label: 'Fill in the Blank', about: 'Type the word that fits the sentence.', icon: 'pencil' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the questions you missed.', icon: 'redo' },
  ],
  math: [
    { id: 'learn', label: 'Learn the Properties', about: 'Meet the four multiplication properties, one at a time.', icon: 'book', start: true },
    { id: 'practice', label: 'Practice Problems', about: 'Answer problems. Get a hint when you need one.', icon: 'pencil', page: true },
    { id: 'lessons', label: 'Math Lessons', about: 'Lessons 5-1 and 5-2, step by step.', icon: 'steps', page: true },
    { id: 'guide', label: 'Study Guide', about: 'A short review for the Multiplication Properties test.', icon: 'list', page: true },
    { id: 'props', label: 'Identify the Property', about: 'Look at a fact. Which property does it show?', icon: 'choice', parent: 'practice' },
    { id: 'split', label: 'Match the Split Array', about: 'A line splits an array. Pick the matching facts.', icon: 'grid', parent: 'practice' },
    { id: 'breakapart', label: 'Break Apart a Factor', about: 'Break a fact into two easier facts.', icon: 'puzzle', parent: 'practice' },
    { id: 'mixed', label: 'Mixed Practice', about: 'A mix of all four properties and arrays.', icon: 'mix', parent: 'practice' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the problems you missed.', icon: 'redo', parent: 'practice' },
  ],
};
export const activityInfo = (subject, id) => ACTIVITIES[subject]?.find((a) => a.id === id) || null;
export const activityLabel = (subject, id) => activityInfo(subject, id)?.label || '';
/** The choices on a menu: the subject's own menu, or a second menu such as Math > Practice Problems. */
export const menuItems = (subject, parent = null) => (ACTIVITIES[subject] || []).filter((a) => (a.parent || null) === parent);

export const TEST_KINDS = ['math', 'spelling', 'vocab'];
export const SUBJECT = { math: 'Math', spelling: 'Spelling', vocab: 'Vocabulary' };

/** A small seeded random number generator, so a shuffle can be repeated in tests. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rand = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const slug = (w) => pictureName(w);
const q = (s) => `"${s}"`;

/** The sentence with the word (and its forms, e.g. "installments") replaced by a line, so it never shows the answer. */
export function blankSentence(sentence, word) {
  return sentence.replace(new RegExp(`${word}[a-z]*`, 'ig'), '______');
}

// ---------------------------------------------------------------- vocabulary

const means = (w) => `${q(w.word)} means: ${w.def}.`;

/**
 * The practice form of a vocabulary question: a hint that points back to the word's sentence (never the answer),
 * and "Show me how" steps that teach the meaning. Used for practice questions and for missed test questions.
 */
export function vocabPractice(item, w) {
  const hint = item.kind === 'word' || item.kind === 'fill'
    ? `Read this sentence and think which word fits: ${blankSentence(w.sentence, w.word)}`
    : `Read this sentence: ${w.sentence}`;
  const answer = item.type === 'word' ? item.answer : item.options.find((o) => o.correct).text;
  return { ...item, hints: [hint], show: [means(w), `So the answer is ${q(answer)}.`] };
}

/** Practice questions for one vocabulary activity, built from the week's words and teacher definitions. */
export function vocabItems(week, kind, rand = Math.random) {
  const words = week.vocab.words;
  const others = (w) => shuffle(words.filter((x) => x !== w), rand);
  if (kind === 'choice') {
    return words.map((w, i) => vocabPractice(i % 2 === 0
      ? {
        id: `mc-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'meaning',
        prompt: `What does the word ${q(w.word)} mean?`,
        // A wrong pick says only what the chosen meaning belongs to, so the second try is still the child's own.
        options: shuffle([{ text: w.def, correct: true },
          ...others(w).slice(0, 3).map((o) => ({ text: o.def, why: `That is what ${q(o.word)} means. Try again.` }))], rand),
        yes: `Yes! ${means(w)}`, explain: means(w),
      }
      : {
        id: `mw-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'word',
        prompt: `Which word means ${q(w.def)}?`,
        options: shuffle([{ text: w.word, correct: true },
          ...others(w).slice(0, 3).map((o) => ({ text: o.word, why: `${means(o)} Try again.` }))], rand),
        yes: `Yes! ${means(w)}`, explain: means(w),
      }, w));
  }
  if (kind === 'truefalse') {
    // Half the statements are true and half are false; a false one pairs the word with another word's meaning.
    const trueSet = new Set(shuffle(words, rand).slice(0, Math.ceil(words.length / 2)));
    return words.map((w) => {
      if (trueSet.has(w)) {
        return vocabPractice({
          id: `tf-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'tf', truth: true,
          prompt: `True or false? ${q(w.word)} means ${q(w.def)}.`,
          options: [{ text: 'True', correct: true }, { text: 'False', why: `It is true. ${means(w)}` }],
          yes: `Yes, it is true. ${means(w)}`, explain: `True. ${means(w)}`,
        }, w);
      }
      const o = others(w)[0];
      return vocabPractice({
        id: `tf-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'tf', truth: false, other: o.word,
        prompt: `True or false? ${q(w.word)} means ${q(o.def)}.`,
        options: [{ text: 'True', why: `It is false. That is what ${q(o.word)} means. ${means(w)}` }, { text: 'False', correct: true }],
        yes: `Yes, it is false. ${means(w)}`, explain: `False. ${means(w)}`,
      }, w);
    });
  }
  if (kind === 'fill') {
    // A short word bank (the answer and three other words of the week) keeps the choice manageable.
    return words.map((w) => vocabPractice({
      id: `fill-${slug(w.word)}`, type: 'word', word: w.word, kind: 'fill',
      prompt: w.fill, answer: w.word.toLowerCase(),
      bank: [w, ...others(w).slice(0, 3)].map((x) => x.word.toLowerCase()).sort(),
      yes: `Yes! ${w.fill.replace('___', w.word.toLowerCase())}`,
      retry: 'Read the sentence again. Which word from the word bank fits?',
      explain: means(w),
    }, w));
  }
  return [];
}

// ---------------------------------------------------------------- spelling

/** The ending the week practices ("-ing" -> "ing"). */
const suffixOf = (sp) => String(sp.pattern).replace(/^-/, '');
const VOWEL = /[aeiou]/;

/**
 * Which letters to hide: the first vowel of the base word (or its y) and the letter that shows the spelling
 * pattern (the doubled consonant, or the first letter of the ending). Two hidden letters are never side by side.
 */
export function missingLetters(entry, sp) {
  const w = entry.word.toLowerCase();
  const suffix = suffixOf(sp);
  const end = w.endsWith(suffix) ? w.length - suffix.length : w.length;
  const stem = w.slice(0, end);
  const blanks = [];
  const fv = [...stem].findIndex((c) => VOWEL.test(c));
  if (fv >= 0) blanks.push(fv); else if (stem.includes('y')) blanks.push(stem.indexOf('y'));
  const doubled = stem !== entry.base.toLowerCase() && end >= 2 && stem[end - 1] === stem[end - 2];
  const pattern = doubled ? end - 1 : end < w.length ? end : -1;
  if (pattern >= 0 && !blanks.some((b) => Math.abs(b - pattern) <= 1)) blanks.push(pattern);
  return blanks.sort((a, b) => a - b);
}

const rulePhrase = (sp, entry) => sp.rules[entry.rule] || '';
/** The light hint: which rule? (The base word, a stronger hint, comes second.) */
const ruleQuestion = (sp) => `Which rule does this word follow: ${Object.values(sp.rules).map(q).join(' or ')}?`;
/** "Show me how" for a spelling word: base word, rule, word. */
function spellSteps(entry, sp) {
  const help = sp.ruleHelp?.[entry.rule];
  const w = entry.word.toLowerCase(), b = entry.base.toLowerCase();
  const stem = w.slice(0, w.length - suffixOf(sp).length);
  const change = stem === b ? '' : stem === b + b.slice(-1) ? `Double the last letter: ${b} becomes ${stem}.`
    : b.endsWith('e') && stem === b.slice(0, -1) ? `Drop the e: ${b} becomes ${stem}.` : '';
  return [`Start with ${q(entry.base)} and the ending ${q(suffixOf(sp))}.`, ...(change ? [change] : []),
    `${rulePhrase(sp, entry)}.`, ...(help ? [`Example: ${help}.`] : []), `So the word is ${q(entry.word)}.`];
}

// Practice question ids are numbers (the word's place in the list), so the page source never names the word.
const wordNo = (entry, sp) => sp.words.indexOf(entry) + 1;

export function lettersItem(entry, sp) {
  return {
    id: `ml-${wordNo(entry, sp)}`, n: wordNo(entry, sp), type: 'letters', word: entry.word.toLowerCase(), blanks: missingLetters(entry, sp),
    prompt: 'Listen to the word. Type the missing letters.', context: blankSentence(entry.sentence, entry.word), say: [entry.word, entry.sentence],
    hints: [ruleQuestion(sp), `This word comes from ${q(entry.base)}.`],
    retry: `Check the boxes with a dashed border. Remember: ${rulePhrase(sp, entry)}.`,
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`, show: spellSteps(entry, sp),
  };
}

export function spellItem(entry, sp, { test = false, id } = {}) {
  const item = {
    id: id || `sp-${wordNo(entry, sp)}`, n: wordNo(entry, sp), type: 'spell', answer: entry.word.toLowerCase(), base: entry.base,
    say: [entry.word, entry.sentence, entry.word],
    prompt: 'Listen to the word and the sentence. Then type the word.',
    // Without sound, a grown-up reads the word: the screen never gives the spelling (or the base word) away.
    fallback: `Have a grown-up say the word for you. The sentence is: ${blankSentence(entry.sentence, entry.word)}`,
    retry: 'Listen again, then check each letter.',
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`,
  };
  if (!test) Object.assign(item, { hints: [ruleQuestion(sp), `This word comes from ${q(entry.base)}.`], show: spellSteps(entry, sp) });
  return item;
}

export function spellingItems(week, kind) {
  const sp = week.spelling;
  if (kind === 'letters') return sp.words.map((e) => lettersItem(e, sp));
  if (kind === 'listen') return sp.words.map((e) => spellItem(e, sp));
  return [];
}

// ---------------------------------------------------------------- tests

const passMark = (n) => Math.ceil(n * 0.8);

/** The spelling test: every word on the week's list exactly once, in a shuffled order, read aloud. */
export function spellingTest(week, rand = Math.random) {
  const sp = week.spelling;
  // Test question ids are the question's position, so nothing in the page links a question to its word.
  const items = shuffle(sp.words, rand).map((e, k) => spellItem(e, sp, { test: true, id: `q${k + 1}` }));
  return {
    kind: 'spelling', title: 'Spelling Practice Test', topic: `${sp.pattern} words`, items, pass: passMark(items.length),
    coverage: `All ${items.length} spelling words, each one once.`,
    note: 'Each word is read aloud by the device. If there is no sound, a grown-up reads each word and its sentence.',
    instructions: 'Press "Hear the word and sentence" for each question. Type the word. You will see your score at the end.',
  };
}

/** A test from data/tests/<week>.json (math or vocab), or the generated spelling test. Null when there is none. */
export function testFor(kind, week, tests, rand) {
  if (kind === 'spelling') return week.spelling?.words?.length ? spellingTest(week, rand) : null;
  const t = tests?.[kind];
  return t ? { kind, title: `${SUBJECT[kind]} Practice Test`, ...t, pass: t.pass ?? passMark(t.items.length) } : null;
}

/** The three Test Center cards for a week: what each test covers, when the class test is, and if it can start. */
export function testCatalog(week, tests) {
  return TEST_KINDS.map((kind) => {
    const sched = week.tests.find((t) => t.kind === kind) || null;
    const t = testFor(kind, week, tests, () => 0);
    let reason = '';
    if (!t) reason = sched ? 'A Study Scoop practice test for this topic has not been written yet.' : `No ${SUBJECT[kind].toLowerCase()} test is listed for this week.`;
    return {
      kind, subject: SUBJECT[kind], title: `${SUBJECT[kind]} Practice Test`,
      topic: t?.topic || sched?.detail || '', date: sched?.date || null, classTest: sched?.title || null,
      count: t ? t.items.length : 0, coverage: t?.coverage || '', note: t?.note || '', available: Boolean(t), reason,
    };
  });
}

/** Problems with data/tests/<week>.json; an empty list means it is safe to show. */
export function validateTests(tests, week) {
  const errors = [];
  const err = (m) => errors.push(`tests/${week?.id}.json: ${m}`);
  if (!tests || typeof tests !== 'object') return [`tests/${week?.id}.json must be an object`];
  if (tests.id !== week?.id) err(`"id" must be ${week?.id}`);
  if (!Array.isArray(week?.vocab?.words) || !Array.isArray(week?.tests)) return [...errors, `tests/${week?.id}.json: its week file is not valid, so the tests cannot be checked`];
  for (const kind of Object.keys(tests).filter((k) => k !== 'id')) {
    if (!['math', 'vocab'].includes(kind)) { err(`unknown test "${kind}"`); continue; }
    const t = tests[kind];
    for (const k of ['topic', 'coverage', 'note', 'instructions']) if (typeof t[k] !== 'string' || !t[k].trim()) err(`${kind}.${k} is missing`);
    if (!Array.isArray(t.items) || !t.items.length) { err(`${kind}.items is missing`); continue; }
    for (const p of validateQuiz(t.items, t.pass ?? passMark(t.items.length), `${kind}`)) err(p);
    for (const it of t.items) {
      if (it.hints || it.show) err(`${kind} ${it.id}: a test question cannot have hints or Show me how`);
      if (typeof it.explain !== 'string' || !it.explain.trim()) err(`${kind} ${it.id}: needs an explanation for the results`);
      if (kind === 'math' && !MATH_SKILLS.includes(it.skill)) err(`math ${it.id}: skill must be one of ${MATH_SKILLS.join(', ')}`);
    }
    if (kind === 'vocab') errors.push(...vocabTestProblems(t, week).map((m) => `tests/${week.id}.json: vocab ${m}`));
  }
  return errors;
}

/** The groups a math test score is shown in on the results screen. */
export const MATH_SKILLS = ['names', 'facts', 'arrays', 'breaking'];
export const SKILL_LABEL = { names: 'Naming the properties', facts: 'Times 1, times 0 and turn-around facts', arrays: 'Rows, columns and split arrays', breaking: 'Breaking apart facts' };

/** Every vocabulary test question must be about its own word on this week's list and use the teacher definition exactly. */
function vocabTestProblems(t, week) {
  const out = [];
  const byWord = new Map(week.vocab.words.map((w) => [normWord(w.word), w]));
  const used = new Set();
  for (const it of t.items) {
    const w = byWord.get(normWord(it.word));
    if (!w) { out.push(`${it.id}: "${it.word}" is not on this week's list`); continue; }
    used.add(w);
    const correct = it.options?.find((o) => o.correct)?.text;
    if (it.kind === 'meaning' || it.kind === 'context') {
      if (correct !== w.def) out.push(`${it.id}: the correct answer must be the teacher's definition of ${w.word}`);
      for (const o of it.options || []) if (!o.correct && o.text === w.def) out.push(`${it.id}: a wrong option is the right definition`);
    }
    if (it.kind === 'meaning' && !it.prompt.includes(`"${w.word}"`)) out.push(`${it.id}: the question must name ${w.word}`);
    if (it.kind === 'meaning' || it.kind === 'tf') {
      for (const x of week.vocab.words) if (x !== w && it.prompt.includes(`"${x.word}"`)) out.push(`${it.id}: the question also names ${x.word}`);
    }
    if (it.kind === 'word' && !it.prompt.includes(`"${w.def}"`)) out.push(`${it.id}: the question must quote the definition of ${w.word}`);
    if (it.kind === 'context' && !normWord(it.prompt).includes(normWord(w.word))) out.push(`${it.id}: the sentence must use ${w.word}`);
    if (it.kind === 'word' && normWord(correct) !== normWord(w.word)) out.push(`${it.id}: the correct answer must be ${w.word}`);
    if (it.kind === 'tf') {
      const truth = it.prompt.includes(`"${w.def}"`);
      const stated = week.vocab.words.find((x) => it.prompt.includes(`"${x.def}"`));
      if (!it.prompt.startsWith(`True or false? "${w.word}" means`)) out.push(`${it.id}: the statement must be about ${w.word}`);
      if (!stated) out.push(`${it.id}: a true-or-false statement must quote a teacher definition`);
      else if ((it.options.find((o) => o.correct)?.text === 'True') !== truth) out.push(`${it.id}: the answer key does not match the statement`);
    }
    if (it.type === 'word' && normWord(it.answer) !== normWord(w.word)) out.push(`${it.id}: the answer must be ${w.word}`);
  }
  for (const w of week.vocab.words) if (!used.has(w)) out.push(`no question is about ${w.word}`);
  return out;
}

// ---------------------------------------------------------------- math practice (Math > Practice Problems)
// The questions are authored in data/practice/math.json (original problems, not the textbook's) and checked here.
// They belong to the topic, not to one week, like the lessons.

export const PROPERTY_NAMES = ['Identity', 'Zero', 'Commutative', 'Distributive'];
/** The sets a practice activity draws from. Mixed Practice takes a few from every set. */
export const PRACTICE_SETS = { props: ['props'], split: ['split'], breakapart: ['breakapart'], mixed: ['props', 'split', 'breakapart', 'facts'] };
const MIXED_EACH = 3;

/** The questions for one Math practice activity: easy to hard in its written order; Mixed Practice is shuffled. */
export function mathItems(practice, act, rand = Math.random) {
  const sets = PRACTICE_SETS[act];
  if (!sets || !practice?.sets) return [];
  if (act !== 'mixed') return [...(practice.sets[act] || [])];
  return shuffle(sets.flatMap((s) => shuffle(practice.sets[s] || [], rand).slice(0, MIXED_EACH)), rand);
}

const FACT = String.raw`\(?\s*(\d+)\s*×\s*(\d+)\s*\)?`;
const oneFact = (s) => { const m = new RegExp(`^${FACT}$`).exec(s.trim()); return m ? [Number(m[1]), Number(m[2])] : null; };
/** "(5 × 4) + (3 × 4)" -> [5, 4, 3, 4]; null when the text is not two facts added. */
export function twoFacts(s) {
  const m = new RegExp(String.raw`^${FACT}\s*\+\s*${FACT}$`).exec(String(s).trim());
  return m ? m.slice(1, 5).map(Number) : null;
}

/**
 * The one property an equation shows, worked out from its numbers: "6 × 1 = 6" is Identity, "0 × 8 = 0" Zero,
 * "3 × 6 = 6 × 3" Commutative, "8 × 4 = (5 × 4) + (3 × 4)" Distributive. Null when it is false, unclear, or
 * shows more than one (1 × 0, or a turn-around with a 1 or a 0), so such a question can never be published.
 */
export function propertyOf(eq) {
  const sides = String(eq).split('=').map((s) => s.trim());
  if (sides.length !== 2) return null;
  const left = oneFact(sides[0]);
  if (!left) return null;
  const [a, b] = left;
  const found = [];
  if (/^\d+$/.test(sides[1])) {
    if (a * b !== Number(sides[1])) return null;
    if (a === 1 || b === 1) found.push('Identity');
    if (a === 0 || b === 0) found.push('Zero');
  }
  const turned = oneFact(sides[1]);
  if (turned && turned[0] === b && turned[1] === a && a !== b && Math.min(a, b) > 1) found.push('Commutative');
  const split = twoFacts(sides[1]);
  if (split && decompositionOf(a, b, ...split)) found.push('Distributive');
  return found.length === 1 ? found[0] : null;
}

/** Which factor of a × b an option such as "(3 × 2) + (3 × 5)" breaks apart: a set of 'first' and/or 'second'. */
export function splitsOf(a, b, option) {
  const f = twoFacts(option);
  const out = new Set();
  if (!f) return out;
  const [p, q, r, s] = f;
  for (const [K, other, which] of [[b, a, 'first'], [a, b, 'second']]) {
    const f1 = p === K ? q : q === K ? p : null;
    const f2 = r === K ? s : s === K ? r : null;
    if (f1 !== null && f2 !== null && f1 >= 1 && f2 >= 1 && f1 + f2 === other) out.add(which);
  }
  return out;
}

/** Problems with data/practice/math.json; an empty list means it is safe to show. */
export function validateMathPractice(practice) {
  const errors = [];
  const err = (m) => errors.push(`practice/math.json: ${m}`);
  if (!practice || typeof practice !== 'object' || !practice.sets) return ['practice/math.json: "sets" is missing'];
  const sets = ['props', 'split', 'breakapart', 'facts'];
  for (const k of Object.keys(practice.sets)) if (!sets.includes(k)) err(`unknown set "${k}"`);
  const all = [];
  for (const k of sets) {
    const list = practice.sets[k];
    if (!Array.isArray(list) || list.length < 6) { err(`${k} needs at least 6 questions`); continue; }
    all.push(...list);
    for (const it of list) {
      const where = `${k} ${it.id}`;
      if (!Array.isArray(it.hints) || !it.hints.length) err(`${where}: needs at least one hint`);
      if (!Array.isArray(it.show) || !it.show.length) err(`${where}: needs Show me how steps`);
      if (typeof it.explain !== 'string' || !it.explain.trim()) err(`${where}: needs an explanation for the results`);
      const correct = it.options?.find((o) => o.correct)?.text;
      if (k === 'props') {
        // The answer key is checked against the equation's own numbers.
        const p = propertyOf(it.eq);
        if (!p) err(`${where}: "${it.eq}" must show exactly one property`);
        if (!String(it.prompt).includes(it.eq)) err(`${where}: the question must show ${it.eq}`);
        if (JSON.stringify((it.options || []).map((o) => o.text).sort()) !== JSON.stringify(PROPERTY_NAMES.map((n) => `${n} Property`).sort())) err(`${where}: the choices must be the four properties`);
        if (p && correct !== `${p} Property`) err(`${where}: "${it.eq}" shows the ${p} Property, but the key says ${correct}`);
        const pair = it.model?.type === 'pair' ? it.model : null;
        if (pair && `${pair.left.rows} × ${pair.left.cols} = ${pair.right.rows} × ${pair.right.cols}` !== it.eq) err(`${where}: the picture does not show ${it.eq}`);
      }
      // A wrong choice that says it "also makes N" must really make N.
      for (const o of it.options || []) {
        const said = /also makes (\d+)/.exec(o.why || '');
        const f = said && twoFacts(o.text);
        if (said && (!f || f[0] * f[1] + f[2] * f[3] !== Number(said[1]))) err(`${where}: option "${o.text}" does not make ${said[1]}`);
      }
      // "A student wrote … What went wrong?": the quoted work must really be wrong, so "It is correct" can never be the key,
      // and the keyed fix must make the work true ("The second part should be 3 × 3").
      if (it.quotesMistake) {
        const m = /wrote (\d+) × (\d+) = (.+?)\. What went wrong\?$/.exec(it.prompt || '');
        const parts = m && twoFacts(m[3]);
        if (!parts) err(`${where}: a "what went wrong" question must quote a × b = (c × d) + (e × f)`);
        else {
          const want = Number(m[1]) * Number(m[2]);
          if (parts[0] * parts[1] + parts[2] * parts[3] === want) err(`${where}: the quoted work is not wrong`);
          if (/^Nothing/.test(correct || '')) err(`${where}: the key says the wrong work is correct`);
          const fix = /^The (first|second) part should be (\d+) × (\d+)\.$/.exec(correct || '');
          if (fix) {
            const fixed = [...parts];
            fixed.splice(fix[1] === 'first' ? 0 : 2, 2, Number(fix[2]), Number(fix[3]));
            if (fixed[0] * fixed[1] + fixed[2] * fixed[3] !== want) err(`${where}: the keyed fix does not make ${m[1]} × ${m[2]}`);
          }
        }
      }
      if (k === 'split' && !it.pictureMatch) err(`${where}: a split-array question must be checked against its picture (pictureMatch)`);
      if (k === 'breakapart' && it.type === 'choice' && it.split) {
        // "Break apart the 7 in 3 × 7": only options that break apart that factor are right.
        const [a, b] = it.fact || [];
        if (!(a > 1 && b > 1 && a !== b)) err(`${where}: fact must be two different numbers above 1`);
        for (const o of it.options || []) {
          const s = splitsOf(a, b, o.text);
          const ok = it.split === 'any' ? s.size > 0 : s.has(it.split);
          if (!twoFacts(o.text)) err(`${where}: option "${o.text}" must be two facts like (3 × 2) + (3 × 5)`);
          else if (ok !== Boolean(o.correct)) err(`${where}: option "${o.text}" is ${o.correct ? 'marked right but does not' : 'marked wrong but does'} break apart ${it.split === 'first' ? a : it.split === 'second' ? b : 'a factor'} correctly`);
        }
      }
    }
  }
  errors.push(...validateQuiz(all, 1, 'practice/math.json'));
  return errors;
}
