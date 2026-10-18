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
    { id: 'misses', label: 'Practice My Misses', about: 'Practise only the questions you missed.' },
  ],
  spelling: [
    { id: 'flash', label: 'Flashcards', about: 'Flip each card, hear the word and mark the ones to practise.' },
    { id: 'letters', label: 'Missing Letters', about: 'Type the letters that are missing from each word.' },
    { id: 'listen', label: 'Hear and Spell', about: 'Listen to the word and a sentence, then type the word.' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practise only the words you missed.' },
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

// ---------------------------------------------------------------- vocabulary

/** Practice questions for one vocabulary activity, built from the week's words and teacher definitions. */
export function vocabItems(week, kind, rand = Math.random) {
  const words = week.vocab.words;
  const others = (w) => shuffle(words.filter((x) => x !== w), rand);
  const means = (w) => `${q(w.word)} means: ${w.def}.`;
  if (kind === 'choice') {
    return words.map((w, i) => (i % 2 === 0
      ? {
        id: `mc-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'meaning',
        prompt: `What does the word ${q(w.word)} mean?`,
        options: shuffle([{ text: w.def, correct: true },
          ...others(w).slice(0, 3).map((o) => ({ text: o.def, why: `That is what ${q(o.word)} means. ${means(w)}` }))], rand),
        yes: `Yes! ${means(w)}`, hints: [`Read this sentence: ${w.sentence}`], explain: means(w),
      }
      : {
        id: `mw-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'word',
        prompt: `Which word means ${q(w.def)}?`,
        options: shuffle([{ text: w.word, correct: true },
          ...others(w).slice(0, 3).map((o) => ({ text: o.word, why: `${means(o)} Look for the word that means ${q(w.def)}.` }))], rand),
        yes: `Yes! ${means(w)}`, hints: [`The word starts with the letter ${w.word[0].toUpperCase()}.`], explain: means(w),
      }));
  }
  if (kind === 'truefalse') {
    // Half the statements are true and half are false; a false one pairs the word with another word's meaning.
    const trueSet = new Set(shuffle(words, rand).slice(0, Math.ceil(words.length / 2)));
    return words.map((w) => {
      if (trueSet.has(w)) {
        return {
          id: `tf-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'tf', truth: true,
          prompt: `True or false? ${q(w.word)} means ${q(w.def)}.`,
          options: [{ text: 'True', correct: true }, { text: 'False', why: `It is true. ${means(w)}` }],
          yes: `Yes, it is true. ${means(w)}`, hints: [`Read this sentence: ${w.sentence}`], explain: `True. ${means(w)}`,
        };
      }
      const o = others(w)[0];
      return {
        id: `tf-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'tf', truth: false, other: o.word,
        prompt: `True or false? ${q(w.word)} means ${q(o.def)}.`,
        options: [{ text: 'True', why: `It is false. That is what ${q(o.word)} means. ${means(w)}` }, { text: 'False', correct: true }],
        yes: `Yes, it is false. ${means(w)}`, hints: [`Read this sentence: ${w.sentence}`], explain: `False. ${means(w)}`,
      };
    });
  }
  if (kind === 'fill') {
    const bank = words.map((w) => w.word.toLowerCase()).sort();
    return words.map((w) => ({
      id: `fill-${slug(w.word)}`, type: 'word', word: w.word, kind: 'fill',
      prompt: w.fill, answer: w.word.toLowerCase(), bank,
      yes: `Yes! ${w.fill.replace('___', w.word.toLowerCase())}`,
      retry: 'Not yet. Read the sentence again. Which word from the word bank fits?',
      hints: [`The word starts with the letter ${w.word[0].toLowerCase()}.`], explain: means(w),
    }));
  }
  return [];
}

// ---------------------------------------------------------------- spelling

/** The ending the week practises ("-ing" -> "ing"). */
const suffixOf = (sp) => String(sp.pattern).replace(/^-/, '');
const VOWEL = /[aeiou]/;

/**
 * Which letters to hide: the first vowel of the base word (or its y) and the letter that shows the spelling
 * pattern (the doubled consonant, or the first letter of the ending).
 */
export function missingLetters(entry, sp) {
  const w = entry.word.toLowerCase();
  const suffix = suffixOf(sp);
  const end = w.endsWith(suffix) ? w.length - suffix.length : w.length;
  const stem = w.slice(0, end);
  const blanks = new Set();
  const fv = [...stem].findIndex((c) => VOWEL.test(c));
  if (fv >= 0) blanks.add(fv); else if (stem.includes('y')) blanks.add(stem.indexOf('y'));
  const doubled = stem !== entry.base.toLowerCase() && end >= 2 && stem[end - 1] === stem[end - 2];
  if (doubled) blanks.add(end - 1);
  else if (end < w.length) blanks.add(end);
  return [...blanks].sort((a, b) => a - b);
}

/** The sentence with the spelling word replaced by a line (so the sentence never shows the answer). */
export function blankSentence(sentence, word) {
  return sentence.replace(new RegExp(word, 'ig'), '______');
}

function rulePhrase(sp, entry) {
  return sp.rules[entry.rule] || '';
}

// Spelling question ids are numbers (the word's place in the list), so not even the page source names the word.
const wordNo = (entry, sp) => sp.words.indexOf(entry) + 1;

export function lettersItem(entry, sp) {
  return {
    id: `ml-${wordNo(entry, sp)}`, type: 'letters', word: entry.word.toLowerCase(), blanks: missingLetters(entry, sp),
    prompt: 'Type the missing letters.', context: blankSentence(entry.sentence, entry.word),
    hints: [`This word comes from ${q(entry.base)}.`, `Remember the rule: ${rulePhrase(sp, entry)}.`],
    retry: `Not yet. Check the letters in red. Remember: ${rulePhrase(sp, entry)}.`,
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`,
  };
}

export function spellItem(entry, sp, { test = false } = {}) {
  const item = {
    id: `sp-${wordNo(entry, sp)}`, type: 'spell', answer: entry.word.toLowerCase(),
    say: [entry.word, entry.sentence, entry.word],
    prompt: 'Press "Hear the word and sentence." Then type the word you hear.',
    fallback: `${blankSentence(entry.sentence, entry.word)} (${entry.base} + ${suffixOf(sp)})`,
    retry: 'Not yet. Listen again, then check each letter.',
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`,
  };
  if (!test) item.hints = [`This word comes from ${q(entry.base)}.`, `Remember the rule: ${rulePhrase(sp, entry)}.`];
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
  const items = shuffle(sp.words, rand).map((e) => spellItem(e, sp, { test: true }));
  return {
    kind: 'spelling', title: 'Spelling Practice Test', topic: `${sp.pattern} words`, items, pass: passMark(items.length),
    coverage: `All ${items.length} words on this week's spelling list, each one once.`,
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
      count: t ? t.items.length : 0, coverage: t?.coverage || '', available: Boolean(t), reason,
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
    for (const k of ['topic', 'coverage', 'instructions']) if (typeof t[k] !== 'string' || !t[k].trim()) err(`${kind}.${k} is missing`);
    if (!Array.isArray(t.items) || !t.items.length) { err(`${kind}.items is missing`); continue; }
    for (const p of validateQuiz(t.items, t.pass ?? passMark(t.items.length), `${kind}`)) err(p);
    for (const it of t.items) if (it.hints || it.show) err(`${kind} ${it.id}: a test question cannot have hints or Show me how`);
    if (kind === 'vocab') errors.push(...vocabTestProblems(t, week).map((m) => `tests/${week.id}.json: vocab ${m}`));
  }
  return errors;
}

/** Every vocabulary test question must be about a word on this week's list and use its teacher definition exactly. */
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
    if (it.kind === 'context' && !normWord(it.prompt).includes(normWord(w.word))) out.push(`${it.id}: the sentence must use ${w.word}`);
    if (it.kind === 'word' && normWord(correct) !== normWord(w.word)) out.push(`${it.id}: the correct answer must be ${w.word}`);
    if (it.kind === 'tf') {
      const truth = it.prompt.includes(`"${w.def}"`);
      const stated = week.vocab.words.find((x) => it.prompt.includes(`"${x.def}"`));
      if (!stated) out.push(`${it.id}: a true-or-false statement must quote a teacher definition`);
      else if ((it.options.find((o) => o.correct)?.text === 'True') !== truth) out.push(`${it.id}: the answer key does not match the statement`);
    }
    if (it.type === 'word' && normWord(it.answer) !== normWord(w.word)) out.push(`${it.id}: the answer must be ${w.word}`);
  }
  for (const w of week.vocab.words) if (!used.has(w)) out.push(`no question is about ${w.word}`);
  return out;
}
