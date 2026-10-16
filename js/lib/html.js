// Safe HTML building: every interpolated value is escaped unless it is already trusted markup (Raw).
// Views return Raw objects; app.js writes `.s` into the page. No DOM needed, so views run in Node tests too.

export class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

export const raw = (s) => new Raw(String(s));

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

function fmt(value) {
  if (value instanceof Raw) return value.s;
  if (Array.isArray(value)) return value.map(fmt).join('');
  if (value === null || value === undefined || value === false) return '';
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += fmt(values[i]) + strings[i + 1];
  return new Raw(out);
}
