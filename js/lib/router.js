// Hash routes: "#<section>" for this week, "#<section>?week=YYYY-MM-DD" for another week.
// The week lives in the address (not in storage), so links can be shared and nothing is saved.

export const DEFAULT_SECTION = 'week';

/** Reads a location hash. `known` is false when the section name was not recognised. */
export function parseHash(hash, sectionIds) {
  const text = String(hash || '').replace(/^#/, '');
  const q = text.indexOf('?');
  const name = q === -1 ? text : text.slice(0, q);
  const params = new URLSearchParams(q === -1 ? '' : text.slice(q + 1));
  const known = name === '' || sectionIds.includes(name);
  return {
    section: name && sectionIds.includes(name) ? name : DEFAULT_SECTION,
    week: params.get('week') || null,
    known,
  };
}

/** The canonical hash for a section and week. The current week is left out of the address. */
export function buildHash(section, weekId, currentWeekId) {
  return weekId && weekId !== currentWeekId ? `#${section}?week=${encodeURIComponent(weekId)}` : `#${section}`;
}

/** The week to show: the requested one when it is listed, otherwise the current week. */
export function resolveWeek(requested, index) {
  return requested && index.weeks.some((w) => w.id === requested) ? requested : index.current;
}
