// Weekly practice activities and Study Scoop practice tests (pure, no DOM). DECISIONS D18.
// Vocabulary and spelling questions are built from the week's verified data (teacher definitions are used
// exactly as written); the math and vocabulary tests are authored in data/tests/<week>.json and checked here.

import { normWord, validateQuiz } from './lessons.js';
import { pictureName } from './data.js';

export const ACTIVITIES = {
  vocab: [
    { id: 'cards', label: 'Study Cards', about: 'See each word, its picture, what it means and a sentence.' },
    { id: 'choice', label: 'Multiple Choice', about: 'Pick the meaning that matches the word, or the word that matches the meaning.' },
    { id: 'truefalse', label: 'True or False', about: 'Decide if a sentence about a word is true.' },
    { id: 'fill', label: 'Fill in the Blank', about: 'Type the word that fits the sentence.' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the questions you missed.' },
  ],
  spelling: [
    { id: 'flash', label: 'Flashcards', about: 'Flip each card, hear the word and mark the words to practice.' },
    { id: 'letters', label: 'Missing Letters', about: 'Hear the word, then type the letters that are missing.' },
    { id: 'listen', label: 'Hear and Spell', about: 'Listen to the word and a sentence, then type the word.' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the words you missed.' },
  ],
};
export const activityLabel = (subject, id) => ACTIVITIES[subject]?.find((a) => a.id === id)?.label || '';

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
