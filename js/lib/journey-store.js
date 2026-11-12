// Lesson 7-1 progress, saved in this browser only (DECISIONS D29). This is the one place in Study Scoop that
// uses browser storage. One key, no names, no identifiers, nothing sent anywhere. A grown-up can erase it from
// the Lesson 7-1 Grown-up Summary. Everything read back is checked, so damaged or old data is ignored.
import { CARDS, JOURNEY_IDS, ALL_CARDS } from './partition-journey.js';

export const STORE_KEY = 'studyScoop.lesson7-1.progress';
// Version 2: the I Do / We Do / You Do lesson (2026-11-12). Older saved progress is ignored and the lesson starts fresh.
export const STORE_VERSION = 2;
const MAX_TEXT = 600;

/** The browser's localStorage, or null when it is unavailable or blocked (private windows, settings). */
export function browserStorage() {
  try { const s = globalThis.localStorage; if (!s) return null; const probe = `${STORE_KEY}.probe`; s.setItem(probe, '1'); s.removeItem(probe); return s; } catch { return null; }
}

const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
const str = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const bool = (v) => (typeof v === 'boolean' ? v : undefined);
const cardIndex = new Map(ALL_CARDS.map((c) => [c.id, c]));

function cleanLines(lines, card) {
  if (!Array.isArray(lines) || !card?.task) return undefined;
  const ids = new Set(card.task.points.map((p) => p.id));
  return lines.filter((l) => Array.isArray(l) && l.length === 2 && l.every((id) => typeof id === 'string' && ids.has(id)) && l[0] !== l[1]).slice(0, 40).map((l) => [l[0], l[1]]);
}
const cleanIndexes = (v, max) => (Array.isArray(v) ? [...new Set(v.filter((n) => isInt(n, 0, max)))] : undefined);

/** Only the fields the journey uses, each with its expected type. */
function cleanUi(ui, card) {
  if (!ui || typeof ui !== 'object') return null;
  const out = {};
  const lines = cleanLines(ui.lines, card); if (lines) out.lines = lines;
  if (Array.isArray(ui.choice) && card?.options) { const ok = new Set(card.options.map((o, i) => (card.type === 'area' ? o.value : String(i)))); out.choice = [...new Set(ui.choice.filter((v) => ok.has(v)))]; }
  for (const k of ['num', 'name', 'say', 'lastKey', 'solvedKey']) { const v = str(ui[k], k === 'say' ? 500 : 4000); if (v !== undefined) out[k] = v; }
  for (const k of ['ok', 'checked', 'compared', 'units', 'solo']) { const v = bool(ui[k]); if (v !== undefined) out[k] = v; }
  const counted = cleanIndexes(ui.counted, (card?.figure?.regions.length || 0) - 1); if (counted) out.counted = counted;
  const shown = cleanIndexes(ui.shown, (card?.grid?.pieces.length || 0) - 1); if (shown) out.shown = shown;
  if (isInt(ui.parts, 2, 8)) out.parts = ui.parts;
  if (isInt(ui.step, 0, 50)) out.step = ui.step;
  if (typeof ui.text === 'string') out.text = ui.text.slice(0, MAX_TEXT);
  if (ui.review && typeof ui.review === 'object') out.review = Object.fromEntries(Object.entries(ui.review).filter(([k, v]) => /^\d$/.test(k) && typeof v === 'boolean'));
  if (ui.help && typeof ui.help === 'object' && isInt(ui.help.level, 0, 3)) out.help = { open: false, level: ui.help.level, step: isInt(ui.help.step, 0, 50) ? ui.help.step : 0 };
  return out;
}
function cleanRecord(r, id) {
  if (!r || typeof r !== 'object') return null;
  const n = (v, hi) => (isInt(v, 0, hi) ? v : 0);
  return { id, attempts: n(r.attempts, 10000), first: ['correct', 'helped', 'wrong'].includes(r.first) ? r.first : null, correct: r.correct === true,
    help: n(r.help, 3), helpBeforeCorrect: n(r.helpBeforeCorrect, 3), viewed: r.viewed === true, written: r.written === true, reviewed: r.reviewed === true, relearn: r.relearn === true, wrongStreak: n(r.wrongStreak, 10000) };
}

/** Returns saved progress ({ stage, at, ui, records }) or null. Never throws. */
export function loadProgress(storage = browserStorage()) {
  if (!storage) return null;
  let raw;
  try { raw = storage.getItem(STORE_KEY); } catch { return null; }
  if (!raw || raw.length > 200000) return null;
  let data;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data || data.v !== STORE_VERSION || typeof data !== 'object') return null;
  const at = {};
  for (const id of JOURNEY_IDS) if (isInt(data.at?.[id], 0, CARDS[id].length - 1)) at[id] = data.at[id];
  const ui = {}, records = {};
  for (const [id, v] of Object.entries(data.ui || {})) { const card = cardIndex.get(id); const u = card && cleanUi(v, card); if (u) ui[id] = u; }
  for (const [id, v] of Object.entries(data.records || {})) { const r = cardIndex.has(id) && cleanRecord(v, id); if (r) records[id] = r; }
  const stage = JOURNEY_IDS.includes(data.stage) || data.stage === 'parent' ? data.stage : null;
  return { stage, at, ui, records };
}

/** Saves the journey. Fails quietly (the lesson keeps working, just without saving). Returns true when saved. */
export function saveProgress(state, storage = browserStorage()) {
  if (!storage) return false;
  const ui = {};
  for (const [id, v] of Object.entries(state.ui || {})) { const u = cleanUi(v, cardIndex.get(id)); if (u && Object.keys(u).length) ui[id] = u; }
  const data = { v: STORE_VERSION, stage: state.stage || null, at: state.at || {}, ui, records: state.records || {} };
  try { storage.setItem(STORE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}

/** Erases saved Lesson 7-1 progress (Grown-up Summary > Reset). */
export function clearProgress(storage = browserStorage()) {
  if (!storage) return false;
  try { storage.removeItem(STORE_KEY); return true; } catch { return false; }
}
