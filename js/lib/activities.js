// Weekly practice activities and Study Scoop practice tests (pure, no DOM). DECISIONS D18.
// Vocabulary and spelling questions are built from the week's verified data (teacher definitions are used
// exactly as written); the math and vocabulary tests are authored in data/tests/<week>.json and checked here.

import { decompositionOf, normWord, validateQuiz } from './lessons.js';
import { pictureName } from './data.js';
import { PROPERTIES, hasPropertyWords } from './mathlearn.js';
import { areaVocabTest, isAreaWeek } from './area.js';

// Each subject opens on a menu of these (menu-first navigation, DECISIONS D19). `page` marks a page to read
// (no questions); `parent` puts an activity on a second menu (Math > Practice Problems).
export const ACTIVITIES = {
  spelling: [
    { id: 'learn', label: 'Learn My Words', about: 'See this week\'s words, pictures and spelling rules.', icon: 'book', page: true },
    { id: 'flash', label: 'Flashcards', about: 'Tap a card to turn it over and see the word.', icon: 'cards' },
    { id: 'letters', label: 'Missing Letters', about: 'Hear a word, then type the missing letters.', icon: 'puzzle' },
    { id: 'listen', label: 'Listen & Spell', about: 'Hear a word and a sentence, then type the word. At the end, add the ending yourself.', icon: 'ear' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the words you missed.', icon: 'redo' },
  ],
  vocab: [
    { id: 'learn', label: 'Learn My Words', about: 'See each word, its picture, what it means and a sentence.', icon: 'book' },
    { id: 'choice', label: 'Multiple Choice', about: 'Pick the right meaning or the right word.', icon: 'choice' },
    { id: 'truefalse', label: 'True or False', about: 'Read a sentence about a word. Is it true?', icon: 'truefalse' },
    { id: 'fill', label: 'Fill in the Blank', about: 'Type the word that fits the sentence.', icon: 'pencil' },
    { id: 'misses', label: 'Practice My Misses', about: 'Practice only the questions you missed.', icon: 'redo' },
  ],
  // Math is chapter-first (D26): Math opens on Choose Your Chapter, and every chapter's menu has the same six roles
  // (CHAPTER_ROLES). Each entry names its chapter; its content comes from that chapter's own data and teacher week.
  math: [
    // Chapter 5: Multiplication Properties and Strategies.
    { id: 'learn', chapter: 5, role: 'vocab', label: 'Learn the Properties', about: 'Meet the five multiplication properties, one at a time, with the teacher\'s words.', icon: 'book', start: true },
    { id: 'words', chapter: 5, role: 'vocabpractice', label: 'Math Vocabulary', about: 'Review My Words, Multiple Choice, True or False, Fill in the Blank and Practice My Misses.', icon: 'cards', page: true },
    { id: 'ch5', chapter: 5, role: 'lessons', label: 'Chapter 5 Lessons', about: 'Lessons 5-1 to 5-7: Learn It, Watch Me, Practice Together, Try It Yourself and a test.', icon: 'steps', page: true },
    { id: 'practice', chapter: 5, role: 'practice', label: 'Practice Problems', about: 'Properties, split arrays and breaking apart a factor, with hints.', icon: 'pencil', page: true },
    { id: 'guide', chapter: 5, role: 'guide', label: 'Chapter 5 Study Guide', about: 'The five properties and the strategies for 3, 4, 6, 7, 8 and 9, ready to print.', icon: 'list', page: true },
    { id: 'ch5test', chapter: 5, role: 'test', label: 'Chapter 5 Practice Test', about: 'Questions from the whole chapter. No hints until the end.', icon: 'choice', test: true, group: 'math' },
    { id: 'props', chapter: 5, label: 'Identify the Property', about: 'Look at a fact. Which property does it show?', icon: 'choice', parent: 'practice' },
    { id: 'split', chapter: 5, label: 'Match the Split Array', about: 'A line splits an array. Pick the matching facts.', icon: 'grid', parent: 'practice' },
    { id: 'breakapart', chapter: 5, label: 'Break Apart a Factor', about: 'Break a fact into two easier facts.', icon: 'puzzle', parent: 'practice' },
    { id: 'mixed', chapter: 5, label: 'Mixed Practice', about: 'A mix of properties, arrays and breaking apart.', icon: 'mix', parent: 'practice' },
    { id: 'misses', chapter: 5, label: 'Practice My Misses', about: 'Practice only the problems you missed.', icon: 'redo', parent: 'practice', misses: true },
    // Chapter 5 vocabulary: the five property words. Its misses are kept apart from the practice problems' misses.
    { id: 'wreview', chapter: 5, label: 'Review My Words', about: 'One property at a time: what it means, an example and a picture.', icon: 'book', parent: 'words', group: 'mathwords' },
    { id: 'wchoice', chapter: 5, label: 'Multiple Choice', about: 'Pick the right property, meaning or equation.', icon: 'choice', parent: 'words', group: 'mathwords' },
    { id: 'wtf', chapter: 5, label: 'True or False', about: 'Read a sentence about a property. Is it true?', icon: 'truefalse', parent: 'words', group: 'mathwords' },
    { id: 'wfill', chapter: 5, label: 'Fill in the Blank', about: 'Type the property word that fits.', icon: 'pencil', parent: 'words', group: 'mathwords' },
    { id: 'wmisses', chapter: 5, label: 'Practice My Misses', about: 'Practice only the word questions you missed.', icon: 'redo', parent: 'words', group: 'mathwords', misses: true },
    // Chapter 6: Connect Area and Multiplication.
    { id: 'arealearn', chapter: 6, role: 'vocab', label: 'Learn the Area Words', about: 'The teacher\'s three Nov 3 words, with pictures and worked examples.', icon: 'book', page: true, start: true },
    { id: 'areawords', chapter: 6, role: 'vocabpractice', label: 'Area Words', about: 'Review, flashcards and quizzes for the Nov 3 words and the chapter review words.', icon: 'cards', page: true },
    { id: 'ch6', chapter: 6, role: 'lessons', label: 'Chapter 6 Lessons', about: 'Lessons 6-1 to 6-6: Learn It, Watch Me, Practice Together, Try It Yourself and a test.', icon: 'grid', page: true },
    { id: 'areapractice', chapter: 6, role: 'practice', label: 'Area Practice Problems', about: 'Count square units, multiply length × width, and solve story problems, with hints.', icon: 'pencil', page: true },
    { id: 'ch6guide', chapter: 6, role: 'guide', label: 'Chapter 6 Study Guide', about: 'Area from tiling to story problems: examples, mistakes to avoid and a self-check, ready to print.', icon: 'list', page: true },
    { id: 'ch6test', chapter: 6, role: 'test', label: 'Chapter 6 Practice Test', about: '27 questions from all six lessons. No hints until the end.', icon: 'choice', test: true, group: 'area' },
    { id: 'areafind', chapter: 6, label: 'Mixed Practice', about: 'Count square units, multiply length × width, and solve story problems.', icon: 'pencil', parent: 'areapractice', group: 'area' },
    { id: 'areamisses', chapter: 6, label: 'Practice My Misses', about: 'Practice only the area problems you missed (practice and the chapter test).', icon: 'redo', parent: 'areapractice', group: 'area', misses: true },
    // Chapter 6 vocabulary: its own misses, apart from the area problems.
    { id: 'avreview', chapter: 6, label: 'Review My Words', about: 'One word at a time: what it means, a picture and an example.', icon: 'book', parent: 'areawords', group: 'areavocab' },
    { id: 'avflash', chapter: 6, label: 'Flashcards', about: 'See the meaning and picture, say the word, then turn the card over.', icon: 'cards', parent: 'areawords', group: 'areavocab' },
    { id: 'avchoice', chapter: 6, label: 'Multiple Choice', about: 'Pick the right meaning or the right word.', icon: 'choice', parent: 'areawords', group: 'areavocab' },
    { id: 'avtf', chapter: 6, label: 'True or False', about: 'Read a sentence about a word. Is it true?', icon: 'truefalse', parent: 'areawords', group: 'areavocab' },
    { id: 'avfill', chapter: 6, label: 'Fill in the Blank', about: 'Type the word that fits the sentence.', icon: 'pencil', parent: 'areawords', group: 'areavocab' },
    { id: 'avmisses', chapter: 6, label: 'Practice My Misses', about: 'Practice only the word questions you missed.', icon: 'redo', parent: 'areawords', group: 'areavocab', misses: true },
    // Earlier addresses keep working: they open the page that replaced them.
    { id: 'lessons', label: 'Choose Your Chapter', about: 'Every Math chapter.', icon: 'steps', page: true, alias: true },
    { id: 'area', chapter: 6, label: 'Chapter 6', about: 'The Chapter 6 menu.', icon: 'grid', page: true, alias: true },
    { id: 'ch6review', chapter: 6, label: 'Chapter 6 Study Guide', about: 'The Chapter 6 Study Guide.', icon: 'list', page: true, alias: 'ch6guide' },
  ],
  // Skill Builders (DECISIONS D22): one card per skill. Each card has its own menu: Learn, practice sets,
  // Practice My Misses (its own list of misses) and a test. Questions are made fresh each time (js/lib/skills.js).
  skills: [
    { id: 'add', label: 'Mental Add', about: 'Make 10, get to the next ten, and break numbers apart to add in your head.', icon: 'puzzle', page: true },
    { id: 'round', label: 'Rounding', about: 'Round to the nearest 10 and 100: underline, arrow, go up or stay.', icon: 'steps', page: true },
    { id: 'times', label: 'Times Tables', about: 'Multiplication facts from the 2s to the 10s, fast and right.', icon: 'grid', page: true },
    { id: 'addlearn', label: 'Learn It', about: 'See how to make 10 and break numbers apart.', icon: 'book', parent: 'add', page: true, start: true },
    { id: 'addfacts', label: 'Quick Facts', about: 'Make 10, 10 plus a number, and getting to the next ten.', icon: 'cards', parent: 'add', group: 'skilladd' },
    { id: 'addsplit', label: 'Break It Apart', about: 'Break a number into tens and ones, then add.', icon: 'puzzle', parent: 'add', group: 'skilladd' },
    { id: 'addmisses', label: 'Practice My Misses', about: 'Practice only the problems you missed.', icon: 'redo', parent: 'add', group: 'skilladd', misses: true },
    { id: 'addtest', label: 'Mental Add Test', about: '10 questions. No help until the end.', icon: 'list', parent: 'add', group: 'skilladd', test: true },
    { id: 'roundlearn', label: 'Learn It', about: 'Underline, arrow, go up or stay, and when a 9 goes up.', icon: 'book', parent: 'round', page: true, start: true },
    { id: 'roundten', label: 'Nearest 10', about: 'Round numbers to the nearest 10.', icon: 'pencil', parent: 'round', group: 'skillround' },
    { id: 'roundhun', label: 'Nearest 100', about: 'Round numbers to the nearest 100.', icon: 'pencil', parent: 'round', group: 'skillround' },
    { id: 'roundmisses', label: 'Practice My Misses', about: 'Practice only the numbers you missed.', icon: 'redo', parent: 'round', group: 'skillround', misses: true },
    { id: 'roundtest', label: 'Rounding Test', about: '10 questions. No help until the end.', icon: 'list', parent: 'round', group: 'skillround', test: true },
    { id: 'timeslearn', label: 'Learn It', about: 'A way to find every fact from one you know.', icon: 'book', parent: 'times', page: true, start: true },
    { id: 'timesall', label: 'All Facts', about: 'Facts from the 2s to the 10s.', icon: 'cards', parent: 'times', group: 'skilltimes' },
    { id: 'timestricky', label: 'Tricky Facts', about: 'Facts with a 6, 7, 8 or 9.', icon: 'mix', parent: 'times', group: 'skilltimes' },
    { id: 'timesmisses', label: 'Practice My Misses', about: 'Practice only the facts you missed.', icon: 'redo', parent: 'times', group: 'skilltimes', misses: true },
    { id: 'timestest', label: 'Times Tables Test', about: '12 facts. No help until the end.', icon: 'list', parent: 'times', group: 'skilltimes', test: true },
  ],
  // Homework (D23): this week's packet, Study Scoop's own version, to do on the computer.
  homework: [
    { id: 'packet', label: 'Do This Week\'s Homework', about: 'Every page of this week\'s packet, with Check, Help and a download.', icon: 'pencil', group: 'homework' },
  ],
};
for (const a of [...ACTIVITIES.spelling, ...ACTIVITIES.vocab]) if (a.id === 'misses') a.misses = true;
export const activityInfo = (subject, id) => ACTIVITIES[subject]?.find((a) => a.id === id) || null;
/** Which list of misses an activity adds to: Math Vocabulary keeps its own ('mathwords'); others use the subject. */
export const missGroup = (subject, id) => activityInfo(subject, id)?.group || subject;
/** The Practice My Misses activity for a list of misses. */
export const missesAct = (subject, id) => {
  const group = missGroup(subject, id);
  return (ACTIVITIES[subject] || []).find((a) => a.misses && (a.group || subject) === group)?.id || 'misses';
};
export const isMissesAct = (id) => /misses$/.test(String(id || ''));
/** The Skill Builders card an activity belongs to (Mental Add, Rounding, Times Tables). */
export const skillCard = (id) => { const a = activityInfo('skills', id); return a?.parent ? activityInfo('skills', a.parent) : a; };
export const activityLabel = (subject, id) => activityInfo(subject, id)?.label || '';
/** The choices on a menu: the subject's own menu, or a second menu such as Math > Practice Problems. */
export const menuItems = (subject, parent = null) => (ACTIVITIES[subject] || []).filter((a) => (a.parent || null) === parent);

export const TEST_KINDS = ['math', 'spelling', 'vocab', 'mathwords'];
export const SUBJECT = { math: 'Math', spelling: 'Spelling', vocab: 'Vocabulary', mathwords: 'Math Vocabulary', skills: 'Skill Builders', homework: 'Homework' };
/** The section a test's subject belongs to ("Practice Math Vocabulary" goes to Math > Math Vocabulary). */
export const TEST_HOME = { math: ['math', null], spelling: ['spelling', null], vocab: ['vocab', null], mathwords: ['math', 'words'] };

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

/** Shuffles each round of an activity on its own: every word comes once before any word comes again. */
export function shuffleRounds(list, rand = Math.random) {
  return [...shuffle(list.filter((it) => !it.round), rand), ...shuffle(list.filter((it) => it.round), rand)];
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

/** Each practice activity has this many questions when the week has enough words (Assignment: 20 per activity). */
export const ACTIVITY_SIZE = 20;

/** The two multiple-choice questions a word can have: pick its meaning, or pick the word for a meaning. */
function choiceFor(w, kind, others, rand) {
  if (kind === 'meaning') {
    return {
      id: `mc-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'meaning',
      prompt: `What does the word ${q(w.word)} mean?`,
      // A wrong pick says only what the chosen meaning belongs to, so the second try is still the child's own.
      options: shuffle([{ text: w.def, correct: true },
        ...others(w).slice(0, 3).map((o) => ({ text: o.def, why: `That is what ${q(o.word)} means. Try again.` }))], rand),
      yes: `Yes! ${means(w)}`, explain: means(w),
    };
  }
  return {
    id: `mw-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'word',
    prompt: `Which word means ${q(w.def)}?`,
    options: shuffle([{ text: w.word, correct: true },
      ...others(w).slice(0, 3).map((o) => ({ text: o.word, why: `${means(o)} Try again.` }))], rand),
    yes: `Yes! ${means(w)}`, explain: means(w),
  };
}

/** A true-or-false statement about a word: its own meaning (true) or another word's meaning (false). */
function tfFor(w, truth, others) {
  if (truth) {
    return {
      id: `tf-${slug(w.word)}`, type: 'choice', word: w.word, kind: 'tf', truth: true,
      prompt: `True or false? ${q(w.word)} means ${q(w.def)}.`,
      options: [{ text: 'True', correct: true }, { text: 'False', why: `It is true. ${means(w)}` }],
      yes: `Yes, it is true. ${means(w)}`, explain: `True. ${means(w)}`,
    };
  }
  const o = others(w)[0];
  return {
    id: `tf-${slug(w.word)}-x`, type: 'choice', word: w.word, kind: 'tf', truth: false, other: o.word,
    prompt: `True or false? ${q(w.word)} means ${q(o.def)}.`,
    options: [{ text: 'True', why: `It is false. That is what ${q(o.word)} means. ${means(w)}` }, { text: 'False', correct: true }],
    yes: `Yes, it is false. ${means(w)}`, explain: `False. ${means(w)}`,
  };
}

/** The form of a word written in its example sentence ("installments" for Installment), or null. */
const formIn = (w) => new RegExp(`\\b${w.word}[a-z]*`, 'i').exec(w.sentence)?.[0].toLowerCase() || null;

/**
 * Practice questions for one vocabulary activity, built from the week's words and teacher definitions.
 * Each activity has 20 questions (when the week has at least 10 words): every word once, then words again in the
 * other form (the other kind of multiple-choice question, the other true-or-false statement, the example sentence
 * as a second fill-in sentence). Teacher definitions are used exactly; no word or definition is invented.
 */
export function vocabItems(week, kind, rand = Math.random) {
  const words = week.vocab.words;
  const others = (w) => shuffle(words.filter((x) => x !== w), rand);
  const size = Math.min(ACTIVITY_SIZE, words.length * 2);
  if (kind === 'choice') {
    const first = words.map((w, i) => choiceFor(w, i % 2 === 0 ? 'meaning' : 'word', others, rand));
    const again = words.map((w, i) => choiceFor(w, i % 2 === 0 ? 'word' : 'meaning', others, rand));
    return [...first, ...again.map((it) => ({ ...it, round: 2 }))].slice(0, size).map((it) => vocabPractice(it, words.find((w) => w.word === it.word)));
  }
  if (kind === 'truefalse') {
    // Half the statements are true and half are false; a false one pairs the word with another word's meaning.
    // The second round says the opposite about some words, keeping the whole activity half true.
    const trueSet = new Set(shuffle(words, rand).slice(0, Math.ceil(words.length / 2)));
    const first = words.map((w) => tfFor(w, trueSet.has(w), others));
    const extra = size - first.length;
    const flipTrue = shuffle(words.filter((w) => !trueSet.has(w)), rand).slice(0, Math.ceil(extra / 2));
    const flipFalse = shuffle(words.filter((w) => trueSet.has(w)), rand).slice(0, extra - flipTrue.length);
    const again = [...flipTrue.map((w) => tfFor(w, true, others)), ...flipFalse.map((w) => tfFor(w, false, others))].map((it) => ({ ...it, round: 2 }));
    return [...first, ...again].map((it) => vocabPractice(it, words.find((w) => w.word === it.word)));
  }
  if (kind === 'fill') {
    // A short word bank (the answer and three other words of the week) keeps the choice manageable.
    const bankFor = (w, form) => [form, ...others(w).slice(0, 3).map((x) => x.word.toLowerCase())].sort();
    // Choosing another word from the bank says what that word means, so the child sees why it does not fit.
    const whyNot = (bank, w) => Object.fromEntries(bank.filter((b) => b !== w.word.toLowerCase()).map((b) => {
      const x = words.find((o) => o.word.toLowerCase() === b);
      return [b, x ? `${means(x)} That does not fit this sentence.` : 'That word does not fit this sentence.'];
    }));
    const first = words.map((w, _, __, bank = bankFor(w, w.word.toLowerCase())) => vocabPractice({
      id: `fill-${slug(w.word)}`, type: 'word', word: w.word, kind: 'fill',
      prompt: w.fill, answer: w.word.toLowerCase(), bank, wrongWords: whyNot(bank, w),
      yes: `Yes! ${w.fill.replace('___', w.word.toLowerCase())}`,
      retry: 'Read the sentence again. Which word from the word bank fits?',
      explain: means(w),
    }, w));
    // Second sentences: the word's example sentence with the word taken out (the word exactly as written there).
    const again = words.filter((w) => formIn(w) === w.word.toLowerCase()).slice(0, size - first.length).map((w, _, __, bank = bankFor(w, w.word.toLowerCase())) => ({
      id: `fill2-${slug(w.word)}`, type: 'word', word: w.word, kind: 'fill', round: 2,
      prompt: blankSentence(w.sentence, w.word).replace(/_{3,}/, '___'), answer: w.word.toLowerCase(), bank, wrongWords: whyNot(bank, w),
      hints: [`Which word means ${q(w.def)}?`], show: [means(w), `So the answer is ${q(w.word.toLowerCase())}.`],
      yes: `Yes! ${w.sentence}`, retry: 'Read the sentence again. Which word from the word bank fits?', explain: means(w),
    }));
    return [...first, ...again];
  }
  return [];
}

// ---------------------------------------------------------------- spelling

/** The ending the week practices ("-ing" -> "ing"). */
const suffixOf = (sp, entry) => entry && /(?:^|-)or$/.test(entry.rule) ? 'or' : entry && /(?:^|-)er$/.test(entry.rule) ? 'er' : String(sp.pattern).replace(/^-/, '');
const VOWEL = /[aeiou]/;
/** A word with a shorter base word (helper from help); "doctor" has none (`whole: true` in the week file). */
export const hasBase = (entry) => !entry.whole && typeof entry.base === 'string' && entry.base.trim() !== '';
const baseOf = (entry) => (hasBase(entry) ? entry.base.toLowerCase() : null);

/**
 * Which letters to hide: the first vowel of the base word (or its y) and the letter that shows the spelling
 * pattern (the doubled consonant, or the first letter of the ending). Two hidden letters are never side by side.
 */
export function missingLetters(entry, sp) {
  const w = entry.word.toLowerCase();
  const suffix = suffixOf(sp, entry);
  const end = w.endsWith(suffix) ? w.length - suffix.length : w.length;
  const stem = w.slice(0, end);
  const blanks = [];
  const fv = [...stem].findIndex((c) => VOWEL.test(c));
  if (fv >= 0) blanks.push(fv); else if (stem.includes('y')) blanks.push(stem.indexOf('y'));
  const doubled = hasBase(entry) && stem !== baseOf(entry) && end >= 2 && stem[end - 1] === stem[end - 2];
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
  const w = entry.word.toLowerCase(), b = baseOf(entry);
  // The rule comes before it is used, and an example that is this very word is left out (it would give the word away early).
  const example = help && !new RegExp(`\\b${w}\\b`, 'i').test(help) ? [`Example: ${help}.`] : [];
  if (!b) return ['This word is not made from a shorter base word.', `${rulePhrase(sp, entry)}.`, ...example, `So the word is ${q(entry.word)}.`];
  const stem = w.slice(0, w.length - suffixOf(sp, entry).length);
  const change = stem === b ? '' : stem === b + b.slice(-1) ? `Double the last letter: ${b} becomes ${stem}.`
    : b.endsWith('e') && stem === b.slice(0, -1) ? `Drop the e: ${b} becomes ${stem}.` : '';
  return [`Start with ${q(entry.base)} and the ending ${q(suffixOf(sp, entry))}.`, `${rulePhrase(sp, entry)}.`, ...example,
    ...(change ? [change] : []), `So the word is ${q(entry.word)}.`];
}

// Practice question ids are numbers (the word's place in the list), so the page source never names the word.
const wordNo = (entry, sp) => sp.words.indexOf(entry) + 1;

/** The second hint: the base word, or (for a word with none) where its tricky ending is. */
const baseHint = (entry) => (hasBase(entry) ? `This word comes from ${q(entry.base)}.`
  : 'This word is not made from a shorter word. Its last sound is like "er". Which letters spell it in this word?');

export function lettersItem(entry, sp) {
  return {
    id: `ml-${wordNo(entry, sp)}`, n: wordNo(entry, sp), type: 'letters', word: entry.word.toLowerCase(), blanks: missingLetters(entry, sp),
    prompt: 'Listen to the word. Type the missing letters.', context: blankSentence(entry.sentence, entry.word), say: [entry.word, entry.sentence],
    hints: [ruleQuestion(sp), baseHint(entry)],
    retry: `Check the boxes with a dashed border. Remember: ${rulePhrase(sp, entry)}.`,
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`, show: spellSteps(entry, sp),
  };
}

export function spellItem(entry, sp, { test = false, id } = {}) {
  const item = {
    id: id || `sp-${wordNo(entry, sp)}`, n: wordNo(entry, sp), type: 'spell', answer: entry.word.toLowerCase(), ...(hasBase(entry) ? { base: entry.base } : {}),
    say: [entry.word, entry.sentence, entry.word],
    prompt: 'Listen to the word and the sentence. Then type the word.',
    // Without sound, a grown-up reads the word: the screen never gives the spelling (or the base word) away.
    fallback: `Have a grown-up say the word for you. The sentence is: ${blankSentence(entry.sentence, entry.word)}`,
    retry: 'Listen again, then check each letter.',
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`,
  };
  if (!test) Object.assign(item, { hints: [ruleQuestion(sp), baseHint(entry)], show: spellSteps(entry, sp) });
  return item;
}

/** Words to practise a second time: the ones whose spelling changes before the ending first (doubled letter,
 *  dropped e), then the rest in list order. */
function secondRound(sp, n) {
  const changes = (e) => hasBase(e) && e.word.toLowerCase().slice(0, e.word.length - suffixOf(sp, e).length) !== baseOf(e);
  // "Add the ending" needs a base word, so words without one (doctor) are never picked for a second round.
  const withBase = sp.words.filter(hasBase);
  return [...withBase.filter(changes), ...withBase.filter((e) => !changes(e))].slice(0, n);
}

/** Missing Letters, second look: other letters of the same word are hidden (every other letter of the base part),
 *  so the child has to remember more of the word. Never two blanks side by side; never the same blanks as the first look. */
export function lettersAgainItem(entry, sp) {
  const first = lettersItem(entry, sp);
  const w = first.word;
  const end = w.endsWith(suffixOf(sp, entry)) ? w.length - suffixOf(sp, entry).length : w.length;
  let blanks = [];
  for (let k = 1; k < end && blanks.length < 3; k += 2) blanks.push(k);
  if (JSON.stringify(blanks) === JSON.stringify(first.blanks)) blanks = blanks.map((k) => k - 1).filter((k) => k >= 0);
  return { ...first, id: `ml2-${first.n}`, round: 2, blanks, prompt: 'Second look! Listen to the word. Type the missing letters.' };
}

/** Listen & Spell, build it: the base word is given, the child adds the ending with the right rule and types the word. */
export function buildItem(entry, sp) {
  const n = wordNo(entry, sp);
  const ending = suffixOf(sp, entry);
  return {
    id: `bw-${n}`, n, round: 2, type: 'word', blank: false, answer: entry.word.toLowerCase(),
    prompt: `Add the ending -${ending} to the word "${entry.base.toLowerCase()}". Type the new word.`,
    hints: [ruleQuestion(sp), `Say the new word out loud. Does the spelling of "${entry.base.toLowerCase()}" change?`],
    show: spellSteps(entry, sp), retry: `Check the spelling rule: ${rulePhrase(sp, entry)}.`,
    yes: `Yes! ${entry.word}.`, explain: `${entry.word}: ${rulePhrase(sp, entry)}.`,
  };
}

/** Each spelling activity: every word once, then 5 words again in a new way (20 questions for a 15-word list). */
export function spellingItems(week, kind) {
  const sp = week.spelling;
  const extra = Math.max(0, Math.min(sp.words.length, ACTIVITY_SIZE - sp.words.length));
  if (kind === 'letters') return [...sp.words.map((e) => lettersItem(e, sp)), ...secondRound(sp, extra).map((e) => lettersAgainItem(e, sp))];
  if (kind === 'listen') return [...sp.words.map((e) => spellItem(e, sp)), ...secondRound(sp, extra).map((e) => buildItem(e, sp))];
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

/** A test from data/tests/<week>.json (math or vocab), the generated spelling test, or the Math Vocabulary test
 *  (from data/practice/math-words.json). Null when there is none. */
export function testFor(kind, week, tests, rand, mathWords = null, area = null) {
  if (kind === 'spelling') return week.spelling?.words?.length ? spellingTest(week, rand) : null;
  // In the Area week the Math Vocabulary test is the Nov 3 vocabulary test (Area, Square Unit, Multiply).
  if (kind === 'mathwords' && isAreaWeek(week)) return area?.vocab ? areaVocabTest(area, rand) : null;
  if (kind === 'mathwords') return mathWords ? mathWordsTest(mathWords, rand) : null;
  const t = tests?.[kind];
  return t ? { kind, title: `${SUBJECT[kind]} Practice Test`, ...t, pass: t.pass ?? passMark(t.items.length) } : null;
}

/** The Test Center cards for a week: what each test covers, when the class test is, and if it can start.
 *  The Math Vocabulary test has no class test of its own: its card names the week's math test as the one it helps with. */
export function testCatalog(week, tests, mathWords = null, area = null) {
  return TEST_KINDS.map((kind) => {
    const related = kind === 'mathwords';
    // The Math Vocabulary test is about the Unit 5 property words: it helps with the week's math test only when
    // that test is the properties test (not, say, the Topic 6 Area vocabulary test).
    const areaWeek = isAreaWeek(week);
    const chapterReview = kind === 'math' && areaWeek;
    const sched = (related && !hasPropertyWords(week) && !areaWeek) || chapterReview ? null : week.tests.find((t) => t.kind === (related ? 'math' : kind)) || null;
    const t = testFor(kind, week, tests, () => 0, mathWords, area);
    let reason = '';
    if (!t) reason = related ? 'The Math Vocabulary questions could not be loaded. Please try again later.'
      : sched ? 'A Study Scoop practice test for this topic has not been written yet.' : `No ${SUBJECT[kind].toLowerCase()} test is listed for this week.`;
    return {
      kind, subject: SUBJECT[kind], title: t?.title || `${SUBJECT[kind]} Practice Test`,
      topic: t?.topic || sched?.detail || '', date: sched?.date || null, classTest: sched?.title || null,
      // Area week: the Math Vocabulary test is for the Nov 3 class vocabulary test, and the Math test is a chapter review.
      dateLabel: related ? (areaWeek ? 'Class test' : hasPropertyWords(week) ? 'Helps with math test' : 'Review of') : chapterReview ? 'Review of' : 'Class test',
      review: chapterReview ? 'Chapter 6 (all lessons)' : related && !hasPropertyWords(week) && !areaWeek ? 'Unit 5 (properties)' : '',
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
      // An Area week's math test is about Area only; a properties test never uses the Area skills.
      if (kind === 'math' && AREA_SKILLS.includes(it.skill) !== isAreaWeek(week)) err(`math ${it.id}: skill ${it.skill} does not match this week's math topic`);
    }
    // A Chapter 6 test covers every lesson of the chapter.
    if (kind === 'math' && isAreaWeek(week)) for (const k of AREA_SKILLS) if (!t.items.some((it) => it.skill === k)) err(`math: no question from ${SKILL_LABEL[k]}`);
    if (kind === 'vocab') errors.push(...vocabTestProblems(t, week).map((m) => `tests/${week.id}.json: vocab ${m}`));
  }
  return errors;
}

/** The groups a math test score is shown in on the results screen. */
export const MATH_SKILLS = ['names', 'facts', 'arrays', 'breaking', 'l61', 'l62', 'l63', 'l64', 'l65', 'l66'];
export const SKILL_LABEL = { names: 'Naming the properties', facts: 'Times 1, times 0 and turn-around facts', arrays: 'Rows, columns and split arrays', breaking: 'Breaking apart facts',
  l61: 'Lesson 6-1: Understand area', l62: 'Lesson 6-2: Count unit squares', l63: 'Lesson 6-3: Multiply length × width',
  l64: 'Lesson 6-4: Composite figures', l65: 'Lesson 6-5: Split a side (Distributive Property)', l66: 'Lesson 6-6: Area problems' };
const AREA_SKILLS = ['l61', 'l62', 'l63', 'l64', 'l65', 'l66'];

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
  const quizWords = Array.isArray(week.vocab.quizWords) && week.vocab.quizWords.length
    ? week.vocab.words.filter((w) => week.vocab.quizWords.some((q) => normWord(q) === normWord(w.word)))
    : week.vocab.words;
  for (const w of quizWords) if (!used.has(w)) out.push(`no question is about ${w.word}`);
  return out;
}

// ---------------------------------------------------------------- math practice (Math > Practice Problems)
// The questions are authored in data/practice/math.json (original problems, not the textbook's) and checked here.
// They belong to the topic, not to one week, like the lessons.

export const PROPERTY_NAMES = ['Identity', 'Zero', 'Commutative', 'Associative', 'Distributive'];
/** The sets a practice activity draws from. Mixed Practice takes the same number from every set (5 × 4 = 20). */
export const PRACTICE_SETS = { props: ['props'], split: ['split'], breakapart: ['breakapart'], mixed: ['props', 'split', 'breakapart', 'facts'] };
export const MIXED_EACH = 5;

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

/** "(2 × 3) × 4" -> { a: 2, b: 3, c: 4, first: true }; "2 × (3 × 4)" -> { …, first: false }; otherwise null. */
function grouped(s) {
  const t = String(s).trim();
  let m = /^\(\s*(\d+)\s*×\s*(\d+)\s*\)\s*×\s*(\d+)$/.exec(t);
  if (m) return { a: Number(m[1]), b: Number(m[2]), c: Number(m[3]), first: true };
  m = /^(\d+)\s*×\s*\(\s*(\d+)\s*×\s*(\d+)\s*\)$/.exec(t);
  if (m) return { a: Number(m[1]), b: Number(m[2]), c: Number(m[3]), first: false };
  return null;
}

/**
 * The one property an equation shows, worked out from its numbers: "6 × 1 = 6" is Identity, "0 × 8 = 0" Zero,
 * "3 × 6 = 6 × 3" Commutative, "(2 × 3) × 4 = 2 × (3 × 4)" Associative (same three factors in the same order,
 * only the grouping moves; no 0 or 1, so it cannot also be Identity or Zero), "8 × 4 = (5 × 4) + (3 × 4)"
 * Distributive. Null when it is false, unclear, or shows more than one (1 × 0, or a turn-around with a 1 or a 0),
 * so such a question can never be published.
 */
export function propertyOf(eq) {
  const sides = String(eq).split('=').map((s) => s.trim());
  if (sides.length !== 2) return null;
  const g1 = grouped(sides[0]), g2 = grouped(sides[1]);
  if (g1 || g2) {
    const ok = g1 && g2 && g1.first !== g2.first && g1.a === g2.a && g1.b === g2.b && g1.c === g2.c && Math.min(g1.a, g1.b, g1.c) > 1;
    return ok ? 'Associative' : null;
  }
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
        // Four different property names (of the five), and one of them is the property the equation shows.
        const names = (it.options || []).map((o) => o.text);
        if (names.length !== 4 || new Set(names).size !== 4 || names.some((n) => !PROPERTY_NAMES.map((x) => `${x} Property`).includes(n))) err(`${where}: the choices must be four different property names`);
        else if (p && !names.includes(`${p} Property`)) err(`${where}: the choices must include the ${p} Property`);
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

// ---------------------------------------------------------------- Math Vocabulary (Math > Math Vocabulary)
// The five multiplication properties: Review My Words (cards), Multiple Choice, True or False, Fill in the Blank,
// Practice My Misses, and the Math Vocabulary practice test. Questions are authored in data/practice/math-words.json
// and checked here: every property is worked out again from each equation's numbers, and every definition is the
// property's own line from Learn the Properties (js/lib/mathlearn.js).

export const WORD_MODES = { wchoice: 'choice', wtf: 'truefalse', wfill: 'fill' };
const PKEYS = PROPERTIES.map((p) => p.key);
const pname = (k) => PROPERTIES.find((p) => p.key === k)?.name;
const pkid = (k) => PROPERTIES.find((p) => p.key === k)?.kid;
const shortName = (k) => pname(k)?.replace(' Property', '');
const keyOfName = (name) => PROPERTIES.find((p) => p.name === name || p.name === `${name} Property`)?.key || null;
const keyOfEq = (eq) => keyOfName(propertyOf(eq) || '');

/** Problems with data/practice/math-words.json; an empty list means it is safe to show. */
export function validateMathWords(bank) {
  const errors = [];
  const err = (m) => errors.push(`practice/math-words.json: ${m}`);
  if (!bank || typeof bank !== 'object') return ['practice/math-words.json must be an object'];
  for (const mode of Object.values(WORD_MODES)) {
    const list = bank[mode];
    if (!Array.isArray(list) || list.length < 20) { err(`${mode} needs at least 20 questions`); continue; }
    errors.push(...validateQuiz(list, 1, `practice/math-words.json ${mode}`));
    for (const k of PKEYS) if (list.filter((it) => it.prop === k).length < 3) err(`${mode}: needs at least 3 questions about the ${pname(k)}`);
    if (new Set(list.map((it) => normWord(it.prompt))).size !== list.length) err(`${mode}: two questions are the same`);
    for (const it of list) {
      const where = `${mode} ${it.id}`;
      if (!PKEYS.includes(it.prop)) { err(`${where}: "prop" must be one of ${PKEYS.join(', ')}`); continue; }
      if (!Array.isArray(it.hints) || !it.hints.length) err(`${where}: needs at least one hint`);
      if (!Array.isArray(it.show) || !it.show.length) err(`${where}: needs Show me how steps`);
      if (typeof it.explain !== 'string' || !it.explain.trim()) err(`${where}: needs an explanation for the results`);
      const correct = it.options?.find((o) => o.correct)?.text;
      const wrong = (it.options || []).filter((o) => !o.correct).map((o) => o.text);
      if (it.eq !== undefined && !String(it.prompt).includes(it.eq)) err(`${where}: the question must show ${it.eq}`);
      switch (it.kind) {
        case 'eq':
        case 'fill-eq':
          if (keyOfEq(it.eq) !== it.prop) err(`${where}: "${it.eq}" shows ${propertyOf(it.eq) || 'no single property'}, not the ${pname(it.prop)}`);
          if (it.kind === 'eq' && correct !== pname(it.prop)) err(`${where}: the key must be the ${pname(it.prop)}`);
          if (it.kind === 'eq' && wrong.some((w) => !keyOfName(w) || keyOfName(w) === it.prop)) err(`${where}: every wrong choice must be another property`);
          break;
        case 'meaning':
          if (!it.prompt.includes(pname(it.prop))) err(`${where}: the question must name the ${pname(it.prop)}`);
          if (correct !== pkid(it.prop)) err(`${where}: the key must be the ${pname(it.prop)}'s own definition`);
          if (wrong.some((w) => !PKEYS.some((k) => k !== it.prop && pkid(k) === w))) err(`${where}: every wrong choice must be another property's definition`);
          break;
        case 'name':
          if (!it.prompt.includes(pkid(it.prop))) err(`${where}: the question must quote the ${pname(it.prop)}'s definition`);
          if (correct !== pname(it.prop)) err(`${where}: the key must be the ${pname(it.prop)}`);
          if (wrong.some((w) => !keyOfName(w) || keyOfName(w) === it.prop)) err(`${where}: every wrong choice must be another property`);
          break;
        case 'which-eq':
          if (keyOfEq(correct || '') !== it.prop) err(`${where}: the keyed equation must show the ${pname(it.prop)}`);
          for (const w of wrong) {
            const k = keyOfEq(w);
            if (!k) err(`${where}: "${w}" must show exactly one property`);
            else if (k === it.prop) err(`${where}: "${w}" also shows the ${pname(it.prop)}`);
          }
          break;
        case 'tf-eq': {
          const real = keyOfEq(it.eq);
          if (!real || real !== it.prop) err(`${where}: "${it.eq}" shows ${propertyOf(it.eq) || 'no single property'}, so "prop" must say so`);
          if (!it.prompt.includes(`shows the ${pname(it.said)}`)) err(`${where}: the statement must name the ${pname(it.said)}`);
          if ((real === it.said) !== it.truth) err(`${where}: "truth" does not match the equation`);
          if ((correct === 'True') !== Boolean(it.truth)) err(`${where}: the answer key does not match the statement`);
          break;
        }
        case 'tf-def':
          if (!it.prompt.includes(`The ${pname(it.said)} says`) || !it.prompt.includes(pkid(it.defOf) || '???')) err(`${where}: the statement must name a property and quote a definition`);
          if ((it.said === it.defOf) !== it.truth) err(`${where}: "truth" does not match the definition`);
          if ((correct === 'True') !== Boolean(it.truth)) err(`${where}: the answer key does not match the statement`);
          break;
        case 'fill-def':
          if (PKEYS.some((k) => normWord(it.prompt).includes(shortName(k).toLowerCase()))) err(`${where}: the sentence must not name a property`);
          break;
        default: err(`${where}: unknown kind ${JSON.stringify(it.kind)}`);
      }
      if (it.type === 'word') {
        if (normWord(it.answer) !== shortName(it.prop).toLowerCase()) err(`${where}: the answer must be ${shortName(it.prop).toLowerCase()}`);
        if (JSON.stringify([...(it.bank || [])].sort()) !== JSON.stringify(PKEYS.map((k) => shortName(k).toLowerCase()).sort())) err(`${where}: the word bank must be the five property words`);
      }
    }
  }
  // The practice test's own pool: two per property in each mode, checked like the practice questions, and never
  // the same as a practice question.
  const pool = bank.test;
  if (!Array.isArray(pool)) err('test (the practice test questions) is missing');
  else {
    errors.push(...validateQuiz(pool, 1, 'practice/math-words.json test'));
    const practicePrompts = new Set(Object.values(WORD_MODES).flatMap((m) => (bank[m] || []).map((it) => normWord(it.prompt))));
    for (const it of pool) {
      const where = `test ${it.id}`;
      if (practicePrompts.has(normWord(it.prompt))) err(`${where}: the same question is in practice`);
      if (!Object.values(WORD_MODES).includes(it.mode)) err(`${where}: "mode" must be choice, truefalse or fill`);
      if (it.eq !== undefined && keyOfEq(it.eq) !== it.prop) err(`${where}: "${it.eq}" shows ${propertyOf(it.eq) || 'no single property'}, not the ${pname(it.prop)}`);
      const correct = it.options?.find((o) => o.correct)?.text;
      if (it.kind === 'eq' && correct !== pname(it.prop)) err(`${where}: the key must be the ${pname(it.prop)}`);
      if (it.kind === 'tf-eq' && ((it.said === it.prop) !== it.truth || (correct === 'True') !== Boolean(it.truth))) err(`${where}: the answer key does not match the statement`);
      if (it.type === 'word' && normWord(it.answer) !== shortName(it.prop).toLowerCase()) err(`${where}: the answer must be ${shortName(it.prop).toLowerCase()}`);
    }
    for (const k of PKEYS) for (const mode of Object.values(WORD_MODES)) {
      if (pool.filter((it) => it.prop === k && it.mode === mode).length < 2) err(`test: needs 2 ${mode} questions about the ${pname(k)}`);
    }
  }
  const tf = bank.truefalse || [];
  const trues = tf.filter((it) => it.truth).length;
  if (Math.abs(trues * 2 - tf.length) > 2) err(`truefalse: about half must be true (${trues} of ${tf.length} are)`);
  return errors;
}

/** Practice questions for one Math Vocabulary activity (shuffled; True/False options stay in order). */
export function mathWordItems(bank, act, rand = Math.random) {
  const list = bank?.[WORD_MODES[act]] || [];
  return shuffle(list, rand).map((it) => (it.type === 'choice' && it.options.length > 2 ? { ...it, options: shuffle(it.options, rand) }
    : it.type === 'word' ? { ...it, wrongWords: propertyWhyNot(it) } : it));
}

/** A property word that does not fit says what that property is, so the child can compare it with the equation. */
function propertyWhyNot(it) {
  const right = normWord(it.answer);
  return Object.fromEntries(PROPERTIES.flatMap((p) => {
    const word = normWord(shortName(p.key));
    if (word === right) return [];
    const why = `The ${p.name}: ${p.kid} Does ${it.eq ? it.eq : 'this'} show that?`;
    return [[word, why], [`${word} property`, why]];
  }));
}

/** The Math Vocabulary practice test: 15 questions, 5 of each mode, every property in every mode, no hints. */
export function mathWordsTest(bank, rand = Math.random) {
  if (!bank) return null;
  // One question per property in each mode, picked at random from the test's own pool (never a practice question),
  // so taking the test again gives a different set.
  const picked = [];
  for (const k of PKEYS) {
    for (const mode of Object.values(WORD_MODES)) {
      const choices = (bank.test || []).filter((it) => it.prop === k && it.mode === mode);
      if (choices.length) picked.push(choices[Math.floor(rand() * choices.length)]);
    }
  }
  const items = shuffle(picked.filter(Boolean), rand).map((it, i) => {
    const { hints, show, ...rest } = it; // tests never show hints or Show me how
    return { ...rest, id: `q${i + 1}`, ...(rest.type === 'choice' && rest.options.length > 2 ? { options: shuffle(rest.options, rand) } : {}) };
  });
  return {
    kind: 'mathwords', title: 'Math Vocabulary Practice Test', topic: 'The five multiplication properties', items, pass: passMark(items.length),
    coverage: `${items.length} questions: multiple choice, true or false and fill in the blank about the Identity, Zero, Commutative, Associative and Distributive Properties.`,
    note: 'A Study Scoop practice test about the property words. It helps with the Multiplication Properties math test.',
    instructions: 'Answer each question. There are no hints during the test. You will see your score and the answers at the end.',
  };
}
