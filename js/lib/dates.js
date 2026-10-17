// Calendar dates as plain YYYY-MM-DD strings. Day counts use UTC arithmetic on the calendar date,
// so they are the same in every time zone and across daylight-saving changes.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];

/** Returns {y, m, d} for a real calendar date written as YYYY-MM-DD, otherwise null. */
export function parseISODate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text));
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return { y, m, d };
}

/** Whole days from the local calendar date of `now` to the date `iso` (negative when it has passed). */
export function daysUntil(iso, now) {
  const p = parseISODate(iso);
  if (!p) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(p.y, p.m - 1, p.d) - today) / 86400000);
}

export function countdownLabel(days) {
  if (days === null) return '';
  if (days < 0) return 'Finished';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

/** "Wednesday, October 21" */
export function formatLongDate(iso) {
  const p = parseISODate(iso);
  if (!p) return String(iso);
  const weekday = WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  return `${weekday}, ${MONTHS[p.m - 1]} ${p.d}`;
}
