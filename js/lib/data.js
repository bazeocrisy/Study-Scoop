// Loads the weekly data with relative paths (works under /Study-Scoop/ on GitHub Pages).
// Results are cached in memory for this page visit only.

const cache = new Map();

export async function loadJSON(url, fetchImpl = globalThis.fetch) {
  if (cache.has(url)) return cache.get(url);
  const pending = (async () => {
    const res = await fetchImpl(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
    return res.json();
  })();
  cache.set(url, pending);
  pending.catch(() => cache.delete(url));
  return pending;
}

export const loadIndex = (fetchImpl) => loadJSON('data/weeks.json', fetchImpl);
export const loadWeek = (id, fetchImpl) => loadJSON(`data/${id}.json`, fetchImpl);

/** File name of a word picture in images/words/ (e.g. "Produce" -> "produce"). */
export function pictureName(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
