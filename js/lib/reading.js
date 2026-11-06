// Reading Coach: the data format, checks and arithmetic (no DOM, so it runs in Node tests too).
// A story is one JSON file in data/reading/, listed in data/reading/index.json. Every story is original writing.
// Nothing is stored: a reading's numbers live only while the page is open (CLAUDE.md, no student data).
//
// Levels are Study Scoop "steps" (1 = shortest and easiest). A real Lexile number is shown only when the story file
// carries one measured with the official Lexile Analyzer ("lexile": 420, "lexileChecked": "2026-11-06"); we never guess one.

export const KINDS = ['story', 'fact'];
export const TARGET_WPM = 135; // the class goal for oral reading fluency (words correct per minute)

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** The story elements the guide teaches, per kind of passage. `events` is a 3-card order question; the rest are choices. */
export const GUIDE = {
  story: [
    { id: 'characters', label: 'Characters', ask: 'Who is in the story?', tip: 'Look for names and words like he, she and they.', clues: ['who', 'name', 'he', 'she', 'they'] },
    { id: 'setting', label: 'Setting', ask: 'Where and when does it happen?', tip: 'Look for places and times.', clues: ['in', 'at', 'on', 'one day', 'morning', 'park', 'school'] },
    { id: 'problem', label: 'Problem', ask: 'What goes wrong, or what does someone want?', tip: 'Look for trouble. A problem often follows "but".', clues: ['but', 'trouble', 'stuck', 'lost', "can't", 'wanted'] },
    { id: 'events', label: 'Events', ask: 'What happens first, next and last?', tip: 'Look for order words.', clues: ['first', 'next', 'then', 'after', 'last'] },
    { id: 'solution', label: 'Solution', ask: 'How is the problem fixed?', tip: 'Look for what the characters do to fix it.', clues: ['finally', 'so', 'decided', 'fixed', 'helped'] },
    { id: 'lesson', label: 'Lesson', ask: 'What does the character learn?', tip: 'Look near the end for what someone learned.', clues: ['learned', 'always', 'never forget', 'knew'] },
  ],
  fact: [
    { id: 'mainidea', label: 'Main idea', ask: 'What is the whole passage mostly about?', tip: 'Look at the first sentences and the title.', clues: ['is', 'are', 'called', 'mostly'] },
    { id: 'detail', label: 'Detail', ask: 'What is one fact that supports the main idea?', tip: 'Look for numbers, names and "for example".', clues: ['for example', 'such as', 'also'] },
    { id: 'cause', label: 'Cause and effect', ask: 'What happens, and why?', tip: 'Look for "because", "so" and "when".', clues: ['because', 'so', 'when', 'that is why'] },
    { id: 'takeaway', label: 'Take-away', ask: 'What is the big thing to remember?', tip: 'Look at the last sentences.', clues: ['in short', 'now you know', 'remember'] },
  ],
};
export const ELEMENT_IDS = { story: GUIDE.story.map((e) => e.id), fact: GUIDE.fact.map((e) => e.id) };
export const QUESTION_TYPES = ['listen', 'order', 'cause', 'main', 'detail', 'vocab', 'infer'];
/** How a question is answered: pick one, true or false, fill in the blank, or say it and check yourself. */
export const FORMATS = ['choice', 'tf', 'blank', 'say'];
export const formatOf = (q) => q.format || 'choice';

/** A typed answer without capitals, punctuation or a leading "the/a/an", so "The Park!" matches "park". */
export const normalizeAnswer = (t) => String(t).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(the|a|an) /, '');
/** True when the two words differ by one letter added, dropped or changed. */
const oneSlip = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const rest = (x, y) => x.slice(i) === y.slice(i);
  return rest(a, b.slice(0, i) + b.slice(i + 1)) || rest(a.slice(0, i) + a.slice(i + 1), b) || a.slice(i + 1) === b.slice(i + 1);
};
/** Is what he typed one of the accepted answers? A one-letter typing slip is forgiven on words of five letters or more
 *  (this checks understanding, not spelling), so "sheltr" counts for "shelter" but "bark" does not count for "park". */
export const checkBlank = (typed, accept) => {
  const t = normalizeAnswer(typed);
  if (t === '') return false;
  return accept.some((a) => { const n = normalizeAnswer(a); return n === t || (n.length >= 5 && /^[a-z]+$/.test(n) && oneSlip(n, t)); });
};
/** "She went to the ___." with the answer put in. */
export const fillBlank = (text, word) => String(text).replace('___', word);

// ---------------------------------------------------------------- words

/** The words of a passage, exactly as a reader sees them (hyphenated words count once). */
export const passageText = (story) => (story.sentences || []).join(' ');
export const countWords = (text) => String(text).split(/\s+/).filter(Boolean).length;
export const storyWords = (story) => countWords(passageText(story));
/** A word without punctuation or capitals, for looking up its card ("manuscript." -> "manuscript"). */
export const wordKey = (text) => String(text).toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '').replace(/’/g, "'");

/**
 * Splits one sentence into word tokens. `clues` are [{ s, text, el }]; a clue marks the first place its `text` appears in
 * sentence number `s`. A word is part of a clue when it falls inside that text.
 */
export function tokenize(sentence, sIndex = 0, clues = []) {
  const ranges = clues.filter((c) => c.s === sIndex).map((c) => {
    const start = sentence.indexOf(c.text);
    return start < 0 ? null : { start, end: start + c.text.length, el: c.el };
  }).filter(Boolean);
  const out = [];
  for (const m of sentence.matchAll(/\S+/g)) {
    const start = m.index, end = start + m[0].length;
    // Punctuation around a word ("safe.", "\"Let's") does not decide whether it is inside a clue.
    const lead = /^[^A-Za-z0-9]*/.exec(m[0])[0].length, trail = /[^A-Za-z0-9]*$/.exec(m[0])[0].length;
    const hit = ranges.find((r) => start + lead >= r.start && end - trail <= r.end);
    out.push({ text: m[0], key: wordKey(m[0]), start, end, el: hit ? hit.el : null });
  }
  return out;
}

/** All tokens of a story with their place: `n` counts words across the whole passage (0-based). */
export function storyTokens(story) {
  let n = 0;
  return (story.sentences || []).map((s, si) => tokenize(s, si, story.clues || []).map((t) => ({ ...t, s: si, n: n++ })));
}

// ---------------------------------------------------------------- scoring a reading

/**
 * Turns one timed reading into the numbers on the class chart.
 * `total` words in the passage; `stoppedAt` how many words he reached (all of them when he finished); `errors` words missed;
 * `seconds` how long it took. WRR (words read right per minute) = (words reached − errors) ÷ minutes.
 */
export function scoreReading({ total, stoppedAt = total, errors = 0, seconds }) {
  const reached = Math.max(0, Math.min(total, Math.round(stoppedAt)));
  const wrong = Math.max(0, Math.min(reached, Math.round(errors)));
  const correct = reached - wrong;
  const secs = Math.max(1, Number(seconds) || 0);
  return {
    reached, errors: wrong, correct, seconds: secs,
    wrr: Math.round((correct / secs) * 60),
    accuracy: reached ? Math.round((correct / reached) * 100) : 0,
    finished: reached >= total,
  };
}

/** What to practise next, in plain words, from the readings and the words he tapped. */
export function suggestion(readings, tapped = []) {
  const last = readings[readings.length - 1];
  if (!last) return 'Read the story again, one sentence at a time.';
  if (last.accuracy < 95) return 'Slow down and read it again. Aim for 95% right before you speed up.';
  if (last.wrr < TARGET_WPM) return `Great accuracy! Read it once more to get faster. The class goal is ${TARGET_WPM} words a minute.`;
  return tapped.length ? 'Fast and accurate! Review your tapped words, then try a harder step.' : 'Fast and accurate! Try a story from the next step.';
}

/** A story is complete when he gets at least 4 of 5 questions right (or 80% of however many there are). */
export const storyPassed = (right, total) => total > 0 && right / total >= 0.8;

// ---------------------------------------------------------------- the answer key

/** Every answer for one passage, for the Answers step at the very end (never shown while he is thinking). */
export function answerKey(story) {
  const map = GUIDE[story.kind].map((g) => {
    const e = story.elements[g.id];
    const f = formatOf(e);
    return {
      id: g.id, label: g.label, find: e.find, format: g.id === 'events' ? 'order' : f,
      ask: f === 'blank' ? e.text : g.ask,
      answer: g.id === 'events' ? e.order : f === 'blank' ? fillBlank(e.text, e.blank) : e.answer,
    };
  });
  const questions = story.questions.map((q) => {
    const f = formatOf(q);
    return {
      type: q.type, format: f, ask: q.ask, find: q.find,
      answer: f === 'choice' ? q.choices[q.answer] : f === 'tf' ? (q.answer ? 'True' : 'False') : f === 'blank' ? fillBlank(q.ask, q.blank) : q.answer,
    };
  });
  return { map, questions };
}

// ---------------------------------------------------------------- picking and order

/** Two stories for today, the same all day: rotates through the list by the calendar day. */
export function todaysPicks(stories, date = new Date(), count = 2) {
  if (!stories.length) return [];
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const n = Math.min(count, stories.length);
  return Array.from({ length: n }, (_, k) => stories[(day * n + k) % stories.length]);
}

/** A repeatable shuffle (so tests can predict it). Never returns the original order when there is more than one item. */
export function shuffled(items, seed = 7) {
  const out = items.slice();
  let a = seed >>> 0;
  const next = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
  for (let tries = 0; tries < 5; tries++) {
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    if (out.length < 2 || out.some((v, i) => v !== items[i])) break;
  }
  return out;
}

/** The answer choices of a map question in a repeatable order, with the right one's position. */
export function mapChoices(el, seed = 3) {
  const all = [el.answer, ...el.wrong];
  const choices = shuffled(all, seed);
  return { choices, answer: choices.indexOf(el.answer) };
}

// ---------------------------------------------------------------- checking the data

export function validateReadingIndex(index) {
  const errors = [];
  if (!isObj(index)) return ['reading/index.json must be an object'];
  if (!Array.isArray(index.steps) || !index.steps.length) errors.push('reading/index.json: "steps" must list the steps');
  else index.steps.forEach((s, i) => {
    if (s.n !== i + 1) errors.push(`reading/index.json: steps[${i}].n must be ${i + 1}`);
    if (!isText(s.label) || !isText(s.about)) errors.push(`reading/index.json: steps[${i}] needs a label and an about`);
  });
  if (!Array.isArray(index.stories) || !index.stories.length) return [...errors, 'reading/index.json: "stories" must list at least one story'];
  const ids = new Set();
  index.stories.forEach((s, i) => {
    const w = `reading/index.json: stories[${i}]`;
    if (!isObj(s)) return errors.push(`${w} must be an object`);
    if (!/^[a-z][a-z0-9]*$/.test(s.id || '')) errors.push(`${w}.id must be lowercase letters and digits (it is used in the address)`);
    else if (ids.has(s.id)) errors.push(`${w}: ${s.id} is listed twice`);
    else ids.add(s.id);
    if (!isText(s.title)) errors.push(`${w}.title is missing`);
    if (!KINDS.includes(s.kind)) errors.push(`${w}.kind must be story or fact`);
    if (!Number.isInteger(s.step) || s.step < 1 || s.step > (index.steps?.length || 0)) errors.push(`${w}.step must be one of the listed steps`);
    if (!isText(s.topic)) errors.push(`${w}.topic is missing`);
    if (!Number.isInteger(s.words) || s.words < 1) errors.push(`${w}.words must be the word count`);
    if (s.lexile !== undefined && !(Number.isInteger(s.lexile) && s.lexile > 0 && isText(s.lexileChecked))) {
      errors.push(`${w}: a Lexile needs a whole number and the date it was measured ("lexileChecked")`);
    }
  });
  return errors;
}

/** Checks one story file against its entry in the index. Returns plain-English problems. */
export function validateStory(story, entry) {
  const errors = [];
  const w = `reading/${entry?.id || '?'}.json`;
  if (!isObj(story)) return [`${w} must be an object`];
  if (story.id !== entry?.id) errors.push(`${w}: id must be "${entry?.id}"`);
  for (const k of ['title', 'kind', 'topic']) if (story[k] !== entry?.[k]) errors.push(`${w}: ${k} must match the index ("${entry?.[k]}")`);
  if (story.step !== entry?.step) errors.push(`${w}: step must match the index`);
  if (story.lexile !== entry?.lexile) errors.push(`${w}: lexile must match the index`);
  if (!KINDS.includes(story.kind)) return [...errors, `${w}: kind must be story or fact`];
  if (!Array.isArray(story.sentences) || story.sentences.length < 4 || !story.sentences.every(isText)) {
    return [...errors, `${w}: "sentences" must list at least four sentences`];
  }
  if (storyWords(story) !== entry.words) errors.push(`${w}: the index says ${entry.words} words but the story has ${storyWords(story)}`);

  // Clue words: each must appear in its sentence, and name an element of this kind.
  const ids = ELEMENT_IDS[story.kind];
  (story.clues || []).forEach((c, i) => {
    if (!Number.isInteger(c.s) || !story.sentences[c.s]) errors.push(`${w}: clues[${i}].s must be a sentence number`);
    else if (!isText(c.text) || !story.sentences[c.s].includes(c.text)) errors.push(`${w}: clues[${i}] "${c.text}" is not in sentence ${c.s}`);
    if (!ids.includes(c.el)) errors.push(`${w}: clues[${i}].el must be one of ${ids.join(', ')}`);
  });
  for (const id of ids) if (!(story.clues || []).some((c) => c.el === id)) errors.push(`${w}: no clue words are marked for ${id}`);

  // Hard words: a tap-a-word card needs how to say it and a kid-friendly meaning. The word must be in the story.
  const present = new Set(storyTokens(story).flat().map((t) => t.key));
  if (!isObj(story.words) || !Object.keys(story.words).length) errors.push(`${w}: "words" must list the hard words`);
  for (const [k, v] of Object.entries(story.words || {})) {
    if (k !== k.toLowerCase()) errors.push(`${w}: word "${k}" must be lowercase`);
    if (!present.has(k)) errors.push(`${w}: word "${k}" is not in the passage`);
    if (!isObj(v) || !isText(v.say) || !isText(v.means) || !isText(v.example)) errors.push(`${w}: word "${k}" needs say, means and example`);
  }

  // The map: one question per element (each answered by choosing, filling in a blank, or saying it), with a sentence to
  // look at when he misses it.
  const el = story.elements;
  const blankProblems = (x, at) => {
    if (!isText(x.text) || String(x.text).split('___').length !== 2) errors.push(`${at}: "text" needs exactly one ___ blank`);
    if (!isText(x.blank)) errors.push(`${at}: "blank" (the missing word) is missing`);
    else if (!Array.isArray(x.accept) || !checkBlank(x.blank, x.accept)) errors.push(`${at}: "accept" must list the accepted answers, including the blank word`);
  };
  const formatsUsed = new Set();
  if (!isObj(el)) errors.push(`${w}: "elements" is missing`);
  else for (const id of ids) {
    const e = el[id], at = `${w}: elements.${id}`;
    if (!isObj(e)) { errors.push(`${at} is missing`); continue; }
    if (!Number.isInteger(e.find) || !story.sentences[e.find]) errors.push(`${at}.find must be a sentence number`);
    if (id === 'events') {
      formatsUsed.add('order');
      if (!Array.isArray(e.order) || e.order.length !== 3 || !e.order.every(isText)) errors.push(`${at}.order must be three events in order`);
      continue;
    }
    const f = formatOf(e);
    formatsUsed.add(f);
    if (!['choice', 'blank', 'say'].includes(f)) { errors.push(`${at}.format must be choice, blank or say`); continue; }
    if (!isText(e.answer)) errors.push(`${at}.answer is missing`);
    if (f === 'choice') {
      if (!Array.isArray(e.wrong) || e.wrong.length !== 2 || !e.wrong.every(isText)) errors.push(`${at}.wrong must be two wrong choices`);
      else if ([e.answer, ...e.wrong].some((c, i, a) => a.indexOf(c) !== i)) errors.push(`${at}: the choices must all differ`);
    } else if (f === 'blank') blankProblems(e, at);
  }

  // Questions: listening ones before reading, at least five after. Every question has one right answer.
  const qs = story.questions;
  if (!Array.isArray(qs)) return [...errors, `${w}: "questions" is missing`];
  qs.forEach((q, i) => {
    const at = `${w}: questions[${i}]`, f = formatOf(q);
    formatsUsed.add(f);
    if (!QUESTION_TYPES.includes(q.type)) errors.push(`${at}.type must be one of ${QUESTION_TYPES.join(', ')}`);
    if (!isText(q.ask)) errors.push(`${at}.ask is missing`);
    if (!FORMATS.includes(f)) { errors.push(`${at}.format must be one of ${FORMATS.join(', ')}`); return; }
    if (f === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length !== 3 || !q.choices.every(isText)) errors.push(`${at}.choices must be three choices`);
      else if (new Set(q.choices).size !== 3) errors.push(`${at}: the choices must all differ`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 2) errors.push(`${at}.answer must be 0, 1 or 2`);
    } else if (f === 'tf') {
      if (typeof q.answer !== 'boolean') errors.push(`${at}.answer must be true or false`);
    } else if (f === 'blank') {
      blankProblems({ ...q, text: q.ask }, at);
    } else if (!isText(q.answer)) errors.push(`${at}.answer (a model answer to check against) is missing`);
    if (!Number.isInteger(q.find) || !story.sentences[q.find]) errors.push(`${at}.find must be a sentence number`);
  });
  if (qs.filter((q) => q.type === 'listen').length < 2) errors.push(`${w}: at least two listening questions are needed`);
  if (qs.filter((q) => q.type !== 'listen').length < 5) errors.push(`${w}: at least five questions after reading are needed`);
  // He has to think, so every passage mixes the ways of answering.
  for (const f of ['blank', 'tf', 'say']) if (!qs.some((q) => formatOf(q) === f)) errors.push(`${w}: needs at least one ${f} question`);
  return errors;
}
