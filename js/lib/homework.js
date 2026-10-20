// Homework packets (DECISIONS D23): Study Scoop's own version of a week's homework, with the same kinds of problems
// in the same order, to do on the computer and to download. Pure, no DOM. The class worksheets themselves are never
// published (the repository is public); every problem, number and story here is Study Scoop's own.

import { validateQuiz } from './lessons.js';

/** Every question in a packet, in order, each knowing its page and problem number. */
export function packetItems(packet) {
  return (packet?.pages || []).flatMap((pg) => pg.problems.flatMap((pr) => pr.items.map((it) => ({ ...it, page: pg.id, n: pr.n }))));
}

/** The reading passage cut into lines, each with the running word count a grown-up uses to score a read. */
export function passageLines(text, perLine = 11) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  for (let k = 0; k < words.length; k += perLine) lines.push({ text: words.slice(k, k + perLine).join(' '), count: Math.min(k + perLine, words.length) });
  return lines;
}

/** Plain-English problems with a packet file; an empty list means it is safe to show. */
export function validatePacket(packet, weekId) {
  const errors = [];
  const err = (m) => errors.push(`homework/${weekId}.json: ${m}`);
  if (!packet || typeof packet !== 'object') return [`homework/${weekId}.json must be an object`];
  if (packet.week !== weekId) err(`"week" must be ${weekId}`);
  if (typeof packet.title !== 'string' || !packet.title.trim()) err('"title" is missing');
  if (!Array.isArray(packet.pages) || !packet.pages.length) return [...errors, `homework/${weekId}.json: "pages" must list at least one page`];
  const pageIds = new Set();
  packet.pages.forEach((pg, i) => {
    if (!/^[a-z]+$/.test(pg?.id || '') || pageIds.has(pg.id)) err(`pages[${i}].id must be a different lowercase word`);
    pageIds.add(pg?.id);
    if (typeof pg?.title !== 'string' || !pg.title.trim()) err(`pages[${i}].title is missing`);
    if (!Array.isArray(pg?.problems) || !pg.problems.length) err(`pages[${i}] has no problems`);
    else pg.problems.forEach((pr, k) => {
      if (pr.n !== k + 1) err(`pages[${i}].problems[${k}].n must be ${k + 1}`);
      if (!Array.isArray(pr.items) || !pr.items.length) err(`pages[${i}].problems[${k}] has no questions`);
    });
    if (pg?.passage && (typeof pg.passage.text !== 'string' || pg.passage.text.split(/\s+/).length < 40)) err(`pages[${i}].passage needs a story of at least 40 words`);
  });
  return [...errors, ...validateQuiz(packetItems(packet), 1, `homework/${weekId}.json`)];
}
