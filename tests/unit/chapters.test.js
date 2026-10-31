// Chapter-first Math (DECISIONS D26): chapters own their Math content; weeks own the newsletter and recommend a chapter.
// These tests keep Chapter 5 content out of Chapter 6 screens (and the other way round) and check the registry.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHash } from '../../js/lib/router.js';
import { CHAPTER_ROLES, chapterFor, chapterLessons, chapterList, chapterMenu, chapterStatus, recommendedChapter, validateChapters } from '../../js/lib/chapters.js';
import { ACTIVITIES, activityInfo } from '../../js/lib/activities.js';
import { CH6_GUIDE } from '../../js/lib/area.js';
import { evaluate as evalExpr } from '../../js/lib/arith.js';
import { validateWeek } from '../../js/lib/validate.js';
import { mathView } from '../../js/views/math.js';
import { weekView } from '../../js/views/week.js';
import { newsletterView } from '../../js/views/newsletter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const INDEX = readJSON('data/lessons/index.json');
const WEEKS = readJSON('data/weeks.json');
const WEEK = Object.fromEntries(WEEKS.weeks.map((w) => [w.id, readJSON(`data/${w.id}.json`)]));
const AREA = readJSON('data/practice/area.json');
const clone = (o) => JSON.parse(JSON.stringify(o));

/** A page context like the app builds it: the chapter from the address; a chapter's content from its own week. */
function ctxFor(shownId, { chapterMenu: chMenu = null, page = null } = {}) {
  const chapter = chapterFor(INDEX, { ch: chMenu, act: page });
  const content = chapter?.week ? WEEK[chapter.week] : WEEK[shownId];
  return {
    week: content, shownWeek: WEEK[shownId], index: WEEKS, weekId: content.id, shownWeekId: shownId, section: 'math',
    isCurrent: shownId === WEEKS.current, today: new Date(2026, 9, 16, 12), chapter, chapterMenu: chMenu, page,
    link: (s, id = shownId) => buildHash(s, id, WEEKS.current),
    chapterLink: (id) => buildHash('math', shownId, WEEKS.current, { ch: id }),
    lessonLink: (id, stage) => buildHash('math', shownId, WEEKS.current, { lesson: id, stage }),
    actLink: (s, act) => buildHash(s, shownId, WEEKS.current, { act }),
    testLink: (kind) => buildHash('tests', shownId, WEEKS.current, { test: kind }),
    misses: {}, lessons: INDEX, pictures: { photos: [], drawings: [] },
    practice: chapter?.id === 5 ? readJSON('data/practice/math.json') : null,
    mathWords: chapter?.id === 5 ? readJSON('data/practice/math-words.json') : null,
    area: chapter?.id === 6 ? AREA : null,
  };
}

test('the chapter registry: Chapters 5 and 6, each with lessons, a week and all six activities', () => {
  assert.deepEqual(validateChapters(INDEX), []);
  assert.deepEqual(chapterList(INDEX).map((c) => [c.id, c.name, chapterLessons(INDEX, c.id).length]),
    [[5, 'Multiplication Properties and Strategies', 7], [6, 'Connect Area and Multiplication', 6]]);
  for (const c of chapterList(INDEX)) assert.deepEqual(chapterMenu(c.id).map((r) => r.role), CHAPTER_ROLES.map((r) => r.role), `Chapter ${c.id}`);
  // The validator catches a chapter with no lessons, a missing activity, and a lesson outside every chapter.
  const bad = clone(INDEX);
  bad.chapters.push({ id: 7, name: 'Next', title: 'Chapter 7: Next', summary: 'Soon.' });
  const errs = validateChapters(bad);
  assert.ok(errs.some((e) => /chapter 7: has no lessons/.test(e)));
  assert.ok(errs.some((e) => /chapter 7: its menu has no "Learn Vocabulary"/.test(e)));
  const bad2 = clone(INDEX);
  bad2.chapters = bad2.chapters.filter((c) => c.id !== 6);
  assert.ok(validateChapters(bad2).some((e) => /lesson 6-1 has no chapter/.test(e)));
});

test('a page knows its chapter from its address: a chapter menu, an activity, or a lesson', () => {
  assert.equal(chapterFor(INDEX, { ch: 6 }).id, 6);
  for (const a of ['arealearn', 'areawords', 'avchoice', 'areafind', 'areamisses', 'ch6', 'ch6guide', 'ch6test']) assert.equal(chapterFor(INDEX, { act: a }).id, 6, a);
  for (const a of ['learn', 'words', 'wchoice', 'practice', 'props', 'misses', 'ch5', 'guide', 'ch5test']) assert.equal(chapterFor(INDEX, { act: a }).id, 5, a);
  assert.equal(chapterFor(INDEX, { lesson: '6-4' }).id, 6);
  assert.equal(chapterFor(INDEX, { lesson: '5-2' }).id, 5);
  assert.equal(chapterFor(INDEX, {}), null, 'Math itself is no chapter');
  assert.equal(chapterFor(INDEX, { ch: 9 }), null, 'an unknown chapter');
  // Every activity's sub-menu stays in its chapter, so Back never leads into another chapter.
  for (const a of ACTIVITIES.math) if (a.parent) assert.equal(activityInfo('math', a.parent).chapter, a.chapter, a.id);
});

// What only one chapter has. Chapter 6 links back to the Distributive Property on purpose (Lesson 6-5), so the
// markers are the other chapter's own activities, lessons and words.
const ONLY = {
  5: [/href="#math\?(?:week=[^&"]+&amp;)?act=(?:learn|words|practice|guide|ch5|ch5test|props|split|breakapart|mixed|misses|w[a-z]+)"/, /lesson=5-\d/, /Commutative/, /Identity Property/, /Zero Property/],
  6: [/href="#math\?(?:week=[^&"]+&amp;)?act=(?:arealearn|areawords|ch6|areapractice|ch6guide|ch6test|areafind|areamisses|av[a-z]+)"/, /lesson=6-\d/, /Square Unit/, /Composite Figure/, /square units/i],
};

test('chapter isolation: no Chapter 6 page shows Chapter 5 activities or words, and no Chapter 5 page shows Chapter 6', () => {
  const pages = {
    5: [{ chapterMenu: 5 }, { page: 'words' }, { page: 'practice' }, { page: 'ch5' }, { page: 'guide' }],
    6: [{ chapterMenu: 6 }, { page: 'arealearn' }, { page: 'areawords' }, { page: 'areapractice' }, { page: 'ch6' }, { page: 'ch6guide' }],
  };
  for (const shown of Object.keys(WEEK)) {
    for (const ch of [5, 6]) {
      for (const p of pages[ch]) {
        const out = mathView(ctxFor(shown, p)).s;
        const label = `${shown} Chapter ${ch} ${JSON.stringify(p)}`;
        assert.equal((out.match(/<h1[\s>]/g) || []).length, 1, `${label}: one h1`);
        assert.doesNotMatch(out, /undefined|\bnull\b|NaN|\[object /, `${label}: no missing values`);
        if (!p.chapterMenu) assert.match(out, new RegExp(`href="#math\\?(?:week=[^&"]+&amp;)?ch=${ch}"`), `${label}: Back to Chapter ${ch}`);
        for (const re of ONLY[ch === 5 ? 6 : 5]) assert.doesNotMatch(out, re, `${label} shows ${re}`);
      }
    }
  }
});

test('the chosen week never changes a chapter\'s content: Chapter 6 in the Oct 12 week is the same Chapter 6', () => {
  const strip = (s) => s.replace(/\?week=[^"&]+&amp;/g, '?').replace(/\?week=[^"]+"/g, '"').replace(/<p class="week-of">[^<]*<\/p>/g, '')
    .replace(/<p class="notice"[^]*?<\/p>/g, '');
  for (const p of [{ chapterMenu: 6 }, { page: 'areawords' }, { page: 'ch6guide' }, { chapterMenu: 5 }, { page: 'guide' }]) {
    const a = strip(mathView(ctxFor('2026-10-26', p)).s).replace(/Currently studying|Available for review|Coming up: open any time/g, '');
    const b = strip(mathView(ctxFor('2026-10-12', p)).s).replace(/Currently studying|Available for review|Coming up: open any time/g, '');
    assert.equal(a, b, JSON.stringify(p));
  }
});

test('the week recommends its chapter; the Math library keeps every chapter open', () => {
  assert.deepEqual(Object.values(WEEK).map((w) => [w.id, recommendedChapter(w, INDEX)?.id]), [['2026-11-02', 6], ['2026-10-26', 6], ['2026-10-19', 5], ['2026-10-12', 5]]);
  const c5 = chapterList(INDEX)[0], c6 = chapterList(INDEX)[1];
  assert.deepEqual([chapterStatus(c5, WEEK['2026-10-26']), chapterStatus(c6, WEEK['2026-10-26'])], ['Available for review', 'Currently studying']);
  assert.deepEqual([chapterStatus(c5, WEEK['2026-10-19']), chapterStatus(c6, WEEK['2026-10-19'])], ['Currently studying', 'Coming up: open any time']);
  for (const id of Object.keys(WEEK)) {
    const out = mathView(ctxFor(id)).s;
    for (const c of [5, 6]) assert.match(out, new RegExp(`href="#math\\?(?:week=${id}&amp;)?ch=${c}"`), `${id}: Chapter ${c} is open`);
  }
  // This Week: a Math card with shortcuts into the week's chapter only.
  for (const [id, ch] of [['2026-10-26', 6], ['2026-10-19', 5]]) {
    const ctx = { ...ctxFor(id), section: 'week', week: WEEK[id] };
    const out = weekView(ctx).s;
    const card = out.slice(out.indexOf('class="card math-week"'), out.indexOf('</section>', out.indexOf('class="card math-week"')));
    assert.match(card, new RegExp(`Math this week: Chapter ${ch}`));
    for (const role of ['vocab', 'lessons', 'practice', 'guide']) {
      const act = chapterMenu(ch).find((r) => r.role === role).act.id;
      assert.ok(card.includes(`act=${act}"`), `${id}: ${role} shortcut`);
    }
    for (const re of ONLY[ch === 5 ? 6 : 5]) assert.doesNotMatch(card, re, `${id}: the card never opens the other chapter`);
    // The button shows only when the week has a reviewed flyer (Oct 26); other weeks have none to show.
    if (WEEK[id].flyer) assert.match(out, /View Original Newsletter/); else assert.doesNotMatch(out, /View Original Newsletter/);
  }
});

test('the Chapter 6 Study Guide: every equation and self-check answer is worked out again', () => {
  for (const s of CH6_GUIDE.sections) if (s.eq) {
    const [l, r] = s.eq.split('=').map((x) => x.trim());
    assert.equal(evalExpr(l), evalExpr(r), s.eq);
  }
  const [l, r] = CH6_GUIDE.example.eq.split('=');
  assert.equal(evalExpr(l), evalExpr(r));
  assert.equal(CH6_GUIDE.steps.length, 7, 'read, find, picture, equation, calculate, label, check');
  for (const c of CH6_GUIDE.check) if (c.eq) {
    assert.equal(evalExpr(c.eq), c.value, c.q);
    assert.ok(c.a.includes(String(c.value)), `${c.q}: the answer states ${c.value}`);
  }
  const out = mathView(ctxFor('2026-10-26', { page: 'ch6guide' })).s;
  for (const w of WEEK['2026-10-26'].math.words) assert.ok(out.includes(w.def.replace(/'/g, '&#39;')), `teacher's words: ${w.word}`);
  for (const h of ['What area means', 'No gaps and no overlaps', 'Multiply the length and the width', 'Composite figures', 'Distributive Property', 'Common mistakes', 'Self-check', 'Show the answers']) assert.ok(out.includes(h), h);
});

test('the original newsletter: shown only when the week lists a privacy-reviewed flyer, otherwise a clear note', () => {
  const f = WEEK['2026-10-26'].flyer;
  assert.ok(f.reviewed && f.pages.length === 2);
  for (const pg of f.pages) assert.ok(fs.existsSync(path.join(ROOT, pg.src)), pg.src);
  const page = (id) => newsletterView({ ...ctxFor(id), section: 'newsletter', week: WEEK[id], weekId: id }).s;
  const now = page('2026-10-26');
  for (const pg of f.pages) assert.ok(now.includes(`src="${pg.src}"`), pg.src);
  assert.match(now, /data-act="zoom"/);
  assert.match(now, /data-act="print"/);
  for (const id of ['2026-10-19', '2026-10-12']) {
    const old = page(id);
    assert.match(old, /is not available on Study Scoop/, id);
    assert.doesNotMatch(old, /images\/flyers|images\/newsletters/, `${id}: never another week's flyer, never a raw photo`);
  }
  // The validator: a flyer needs its review date and images under images/flyers named for its own week.
  const w = clone(WEEK['2026-10-26']);
  delete w.flyer.reviewed;
  assert.ok(validateWeek(w, w.id).some((e) => /flyer\.reviewed/.test(e)));
  const w2 = clone(WEEK['2026-10-26']);
  w2.flyer.pages[0].src = 'images/flyers/2026-10-19-front.webp';
  assert.ok(validateWeek(w2, w2.id).some((e) => /flyer\.pages\[0\]\.src/.test(e)));
});
