// Checks the weekly data format (see docs/CONTENT-GUIDE.md). Used by the app when a week loads
// and by the automated tests. Returns a list of plain-English problems; an empty list means valid.

import { parseISODate } from './dates.js';

const TEST_KINDS = ['math', 'vocab', 'spelling'];
const GROUPS = ['green', 'purple'];
const HOMEWORK_SOURCES = ['received', 'newsletter'];
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const blanks = (s) => String(s).split('___').length - 1;

export function validateIndex(index) {
  const errors = [];
  if (!isObj(index)) return ['weeks.json must be an object'];
  if (!Array.isArray(index.weeks) || index.weeks.length === 0) return ['weeks.json: "weeks" must list at least one week'];
  const ids = new Set();
  index.weeks.forEach((w, i) => {
    if (!isObj(w) || !parseISODate(w.id)) errors.push(`weeks.json: weeks[${i}].id must be a date like 2026-10-19`);
    else if (ids.has(w.id)) errors.push(`weeks.json: ${w.id} is listed twice`);
    else ids.add(w.id);
    if (!isObj(w) || !isText(w.label)) errors.push(`weeks.json: weeks[${i}].label is missing`);
    if (i > 0 && isObj(w) && isObj(index.weeks[i - 1]) && !(w.id < index.weeks[i - 1].id)) {
      errors.push('weeks.json: weeks must be listed newest first');
    }
  });
  if (!ids.has(index.current)) errors.push('weeks.json: "current" must be one of the listed weeks');
  return errors;
}

export function validateWeek(week, expectedId) {
  const errors = [];
  const err = (msg) => errors.push(`${expectedId || 'week'}: ${msg}`);
  if (!isObj(week)) return [`${expectedId}: week file must be an object`];

  if (week.id !== expectedId) err(`"id" is ${JSON.stringify(week.id)}, expected ${JSON.stringify(expectedId)}`);
  if (!isText(week.label)) err('"label" is missing');
  if (week.newsletter !== undefined && typeof week.newsletter !== 'string') err('"newsletter" must be text when present');

  // The Math chapter the class is studying this week (D26): This Week recommends it; the Math library stays open.
  if (week.mathChapter !== undefined && !(Number.isInteger(week.mathChapter) && week.mathChapter > 0)) err('"mathChapter" must be a chapter number');
  // The original newsletter flyer (D26): published only after a privacy review, one image per printed page.
  if (week.flyer !== undefined) validateFlyer(week.flyer, week.id, err);
  if (week.homeworkPapers !== undefined) validateFlyer(week.homeworkPapers, week.id, err, 'homeworkPapers', 'homework');

  if (!Array.isArray(week.learning)) err('"learning" must be a list');
  else week.learning.forEach((row, i) => {
    if (!Array.isArray(row) || row.length !== 2 || !isText(row[0]) || !isText(row[1])) err(`learning[${i}] must be ["Subject", "Topic"]`);
  });

  if (!Array.isArray(week.tests)) err('"tests" must be a list');
  else week.tests.forEach((t, i) => {
    if (!isObj(t)) return err(`tests[${i}] must be an object`);
    if (!parseISODate(t.date)) err(`tests[${i}].date must be a real date like 2026-10-23`);
    if (!TEST_KINDS.includes(t.kind)) err(`tests[${i}].kind must be one of ${TEST_KINDS.join(', ')}`);
    if (!isText(t.title)) err(`tests[${i}].title is missing`);
    if (t.detail !== undefined && typeof t.detail !== 'string') err(`tests[${i}].detail must be text`);
  });

  if (!Array.isArray(week.events)) err('"events" must be a list');
  else week.events.forEach((e, i) => {
    if (!isObj(e) || !isText(e.date) || !isText(e.text)) err(`events[${i}] needs "date" and "text"`);
  });

  if (!Array.isArray(week.homework)) err('"homework" must be a list');
  else week.homework.forEach((h, i) => {
    if (!isObj(h) || !isText(h.title) || !isText(h.due)) return err(`homework[${i}] needs "title" and "due"`);
    // Where it came from (DECISIONS D18): only work actually received may be marked "received".
    if (!HOMEWORK_SOURCES.includes(h.source)) err(`homework[${i}].source must be one of ${HOMEWORK_SOURCES.join(', ')}`);
    for (const k of ['subject', 'description', 'status']) if (h[k] !== undefined && !isText(h[k])) err(`homework[${i}].${k} must be text`);
    if (h.practice !== undefined) {
      const p = h.practice;
      if (!isObj(p) || !isText(p.label) || [p.lesson, p.test, p.section].filter(Boolean).length !== 1) err(`homework[${i}].practice needs a label and one of lesson, test or section`);
      // A section link may name an activity or a skill card in it (e.g. Skill Builders > Rounding).
      else if (p.act !== undefined && (!p.section || !/^[a-z]+$/.test(p.act))) err(`homework[${i}].practice.act needs a section and a lowercase activity name`);
    }
  });

  validateSpelling(week.spelling, err);
  validateVocab(week.vocab, err);
  if (week.math !== undefined) validateMath(week.math, err);
  return errors;
}

function validateFlyer(f, id, report, field = 'flyer', folder = 'flyers') {
  const err = (message) => report(message.replace(/flyer/g, field));
  if (!isObj(f)) return err('"flyer" must be an object');
  if (!parseISODate(f.reviewed)) err('flyer.reviewed must be the date of its privacy review, like 2026-10-23');
  if (!Array.isArray(f.pages) || !f.pages.length) return err('flyer.pages must list the flyer images');
  f.pages.forEach((pg, i) => {
    const at = `flyer.pages[${i}]`;
    if (!isObj(pg)) return err(`${at} must be an object`);
    if (typeof pg.src !== 'string' || !new RegExp(`^images/${folder}/${id}-[a-z]+\\.webp$`).test(pg.src)) err(`${at}.src must be images/${folder}/${id}-<page>.webp`);
    for (const k of ['label', 'alt']) if (!isText(pg[k])) err(`${at}.${k} is missing`);
    for (const k of ['width', 'height']) if (!Number.isInteger(pg[k]) || pg[k] < 400) err(`${at}.${k} must be the image size in pixels`);
  });
}

function validateSpelling(sp, err) {
  if (!isObj(sp)) return err('"spelling" is missing');
  if (!isText(sp.pattern)) err('spelling.pattern is missing');
  if (!isObj(sp.rules) || Object.keys(sp.rules).length === 0) return err('spelling.rules is missing');
  if (!isObj(sp.ruleHelp)) err('spelling.ruleHelp is missing');
  for (const id of Object.keys(sp.rules)) {
    if (!isText(sp.rules[id])) err(`spelling.rules.${id} is empty`);
    if (isObj(sp.ruleHelp) && !isText(sp.ruleHelp[id])) err(`spelling.ruleHelp.${id} is missing`);
  }
  if (!Array.isArray(sp.words) || sp.words.length === 0) return err('spelling.words must list at least one word');
  const seen = new Set();
  sp.words.forEach((w, i) => {
    const at = `spelling.words[${i}]`;
    if (!isObj(w) || !isText(w.word)) return err(`${at}.word is missing`);
    if (seen.has(w.word.toLowerCase())) err(`${at}: "${w.word}" is listed twice`);
    seen.add(w.word.toLowerCase());
    if (w.word !== w.word.trim() || /\s/.test(w.word)) err(`${at}: "${w.word}" must be one word with no spaces`);
    // A word with no shorter base word ("doctor") says so with whole: true instead of a made-up base.
    if (w.whole === true) { if (w.base !== undefined) err(`${at}: a whole word has no base`); } else if (!isText(w.base)) err(`${at}.base is missing`);
    if (!(w.rule in sp.rules)) err(`${at}: rule "${w.rule}" is not in spelling.rules`);
    if (!isText(w.sentence)) err(`${at}.sentence is missing`);
    else if (!w.sentence.toLowerCase().includes(w.word.toLowerCase())) err(`${at}: the sentence must use "${w.word}"`);
    if (w.img !== undefined && !/^[a-z0-9-]+$/.test(w.img)) err(`${at}.img must be a picture name like "rushed"`);
  });
}

function validateVocab(v, err) {
  if (!isObj(v)) return err('"vocab" is missing');
  for (const k of ['title', 'quiz', 'groupsNote']) if (!isText(v[k])) err(`vocab.${k} is missing`);
  if (!Array.isArray(v.words) || v.words.length === 0) return err('vocab.words must list at least one word');
  const seen = new Set();
  v.words.forEach((w, i) => {
    const at = `vocab.words[${i}]`;
    if (!isObj(w) || !isText(w.word)) return err(`${at}.word is missing`);
    if (seen.has(w.word.toLowerCase())) err(`${at}: "${w.word}" is listed twice`);
    seen.add(w.word.toLowerCase());
    if (!isText(w.def)) err(`${at}.def is missing`);
    // Practice questions use other words' meanings as wrong answers, so no two meanings may be the same.
    else if (v.words.slice(0, i).some((x) => isObj(x) && String(x.def).trim().toLowerCase() === w.def.trim().toLowerCase())) err(`${at}: "${w.word}" has the same meaning as another word`);
    if (!isText(w.sentence)) err(`${at}.sentence is missing`);
    else if (!w.sentence.toLowerCase().includes(w.word.toLowerCase())) err(`${at}: the sentence must use "${w.word}"`);
    if (!isText(w.fill)) err(`${at}.fill is missing`);
    else {
      if (blanks(w.fill) !== 1) err(`${at}.fill must have exactly one ___`);
      if (w.fill === w.sentence) err(`${at}.fill must be different from the sentence`);
    }
    if (w.group !== undefined && !GROUPS.includes(w.group)) err(`${at}.group must be "green" or "purple"`);
  });
}

function validateMath(m, err) {
  if (!isObj(m)) return err('"math" must be an object when present');
  if (!isText(m.title)) err('math.title is missing');
  if (!isText(m.test)) err('math.test is missing');
  if (!Array.isArray(m.words)) return err('math.words must be a list');
  m.words.forEach((w, i) => {
    const at = `math.words[${i}]`;
    if (!isObj(w) || !isText(w.word) || !isText(w.def)) return err(`${at} needs "word" and "def"`);
    const ex = w.example;
    if (!Array.isArray(ex) || ex.length !== 3 || !ex.every((n) => Number.isInteger(n) && n >= 0)) {
      err(`${at}.example must be [factor, factor, product] with whole numbers`);
    } else if (ex[0] * ex[1] !== ex[2]) {
      err(`${at}.example is wrong: ${ex[0]} × ${ex[1]} is ${ex[0] * ex[1]}, not ${ex[2]}`);
    }
    if (!isText(w.fill) || blanks(w.fill) !== 1) err(`${at}.fill must have exactly one ___`);
  });
}
