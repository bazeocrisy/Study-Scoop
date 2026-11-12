// Saved progress for the Chapter 7 skill journeys (Lessons 7-2 to 7-7), in this browser only (DECISIONS D29, extended
// by the owner on 2026-11-12: "the same ... progress saving ... patterns as Lesson 7-1"). One key per lesson, no names,
// no identifiers, nothing sent anywhere. Everything read back is checked, so damaged or old data is ignored.
// A grown-up can erase a lesson's progress from its grown-up report.
export const lessonKey = (id) => `studyScoop.lesson${id}.progress`;
export const LESSON_STORE_VERSION = 1;
const MAX = 600;

export function browserStorage() {
  try { const s = globalThis.localStorage; if (!s) return null; const probe = 'studyScoop.probe'; s.setItem(probe, '1'); s.removeItem(probe); return s; } catch { return null; }
}
const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
const str = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const STATUS = ['correct', 'notyet', 'shown', 'empty', 'unanswered', 'compared'];
const FIRST = ['correct', 'notyet', 'shown'];

/** Only the fields a question keeps between visits, each with its expected type. */
function cleanItem(st) {
  if (!st || typeof st !== 'object') return null;
  const out = {};
  if (st.resp && typeof st.resp === 'object') out.resp = Object.fromEntries(Object.entries(st.resp).filter(([k, v]) => /^[\w-]{1,20}$/.test(k) && typeof v === 'string').map(([k, v]) => [k, v.slice(0, MAX)]));
  if (STATUS.includes(st.status)) out.status = st.status;
  if (FIRST.includes(st.first)) out.first = st.first;
  for (const k of ['tries', 'help', 'revision', 'comparedRevision', 'reviewedRevision', 'writingHelp']) if (isInt(st[k], 0, 10000)) out[k] = st[k];
  for (const k of ['shown', 'scaffoldAssisted', 'reviewOpened']) if (typeof st[k] === 'boolean') out[k] = st[k];
  if (Array.isArray(st.counted)) out.counted = [...new Set(st.counted.filter((n) => isInt(n, 0, 200)))];
  if (st.reviewChecks && typeof st.reviewChecks === 'object') out.reviewChecks = Object.fromEntries(Object.entries(st.reviewChecks).filter(([k, v]) => /^\w{1,20}$/.test(k) && typeof v === 'boolean'));
  const last = str(st.lastChecked, 2000); if (last !== undefined) out.lastChecked = last;
  return out;
}
function cleanStage(st, itemIds, cards) {
  if (!st || typeof st !== 'object') return null;
  const out = { i: isInt(st.i, 0, cards) ? st.i : 0, items: {}, steps: {}, seen: {}, streak: 0, submitted: st.submitted === true, warned: false, completed: st.completed === true };
  for (const [id, v] of Object.entries(st.items || {})) { const c = itemIds.has(id) && cleanItem(v); if (c) out.items[id] = c; }
  for (const [k, v] of Object.entries(st.steps || {})) if (isInt(Number(k), 0, 200) && isInt(v, 1, 50)) out.steps[k] = v;
  for (const [k, v] of Object.entries(st.seen || {})) if (isInt(Number(k), 0, 200) && v === true) out.seen[k] = true;
  if (st.retake === true) out.retake = true;
  return out;
}
function cleanHistory(h, itemKeys) {
  const out = { restarts: 0, missRounds: 0, items: {} };
  if (!h || typeof h !== 'object') return out;
  for (const k of ['restarts', 'missRounds']) if (isInt(h[k], 0, 10000)) out[k] = h[k];
  for (const [k, v] of Object.entries(h.items || {})) {
    if (!itemKeys.has(k) || !v || typeof v !== 'object') continue;
    const r = { label: str(v.label, 120) || 'Question' };
    for (const f of ['attempts', 'help', 'reveals']) r[f] = isInt(v[f], 0, 10000) ? v[f] : 0;
    if (v.countScaffold === true) r.countScaffold = true; if (v.testReview === true) r.testReview = true;
    out.items[k] = r;
  }
  const t = h.firstTest;
  if (t && isInt(t.right, 0, 100) && isInt(t.total, 1, 100) && isInt(t.pass, 0, 100) && Array.isArray(t.missed)) out.firstTest = { right: t.right, total: t.total, pass: t.pass, missed: t.missed.filter((m) => typeof m === 'string').slice(0, 100) };
  return out;
}

/** Saved progress for one lesson ({ stages: {stage: state}, history }) or null. Never throws. */
export function loadLessonProgress(lesson, stageItems, storage = browserStorage()) {
  if (!storage) return null;
  let raw; try { raw = storage.getItem(lessonKey(lesson.id)); } catch { return null; }
  if (!raw || raw.length > 400000) return null;
  let data; try { data = JSON.parse(raw); } catch { return null; }
  if (!data || typeof data !== 'object' || data.v !== LESSON_STORE_VERSION) return null;
  const stages = {}, itemKeys = new Set();
  for (const [stage, { ids, cards }] of Object.entries(stageItems)) {
    for (const id of ids) itemKeys.add(`${stage}:${id}`);
    const c = cleanStage(data.stages?.[stage], ids, cards); if (c) stages[stage] = c;
  }
  return { stages, history: cleanHistory(data.history, itemKeys) };
}
/** Saves a lesson's progress. Fails quietly (the lesson keeps working, just without saving). */
export function saveLessonProgress(lesson, stages, history, storage = browserStorage()) {
  if (!storage) return false;
  const keep = (st) => ({ i: st.i, submitted: Boolean(st.submitted), completed: Boolean(st.completed), retake: Boolean(st.retake), steps: st.steps || {}, seen: st.seen || {},
    items: Object.fromEntries(Object.entries(st.items || {}).map(([id, v]) => [id, cleanItem(v)]).filter(([, v]) => v)) });
  const data = { v: LESSON_STORE_VERSION, stages: Object.fromEntries(Object.entries(stages).map(([k, st]) => [k, keep(st)])),
    history: history ? { restarts: history.restarts || 0, missRounds: history.missRounds || 0, items: history.items || {}, firstTest: history.firstTest || null } : null };
  try { storage.setItem(lessonKey(lesson.id), JSON.stringify(data)); return true; } catch { return false; }
}
export function clearLessonProgress(lesson, storage = browserStorage()) {
  if (!storage) return false;
  try { storage.removeItem(lessonKey(lesson.id)); return true; } catch { return false; }
}
