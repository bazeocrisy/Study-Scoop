// Builds the publishable website from an explicit allowlist, then verifies it (docs/DEPLOYMENT.md, DECISIONS D11).
// Only student-facing runtime files are copied. Prototypes, tests, docs and anything not listed below never reach the site.
// Run: node scripts/build-site.js [outDir]   (default _site; exits 1 if verification finds a problem)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateIndex, validateWeek } from '../js/lib/validate.js';
import { validateLesson, validateLessonIndex } from '../js/lib/lessons.js';
import { validateTests } from '../js/lib/activities.js';
import { pictureName } from '../js/lib/data.js';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The only files that may be published. A path must match one pattern exactly. */
export const ALLOW = [
  /^index\.html$/,
  /^css\/[a-z0-9-]+\.css$/,
  /^js\/(?:(?:lib|views)\/)?[a-z0-9-]+\.js$/,
  /^data\/(?:weeks|pictures|\d{4}-\d{2}-\d{2})\.json$/,
  /^data\/lessons\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/,
  /^data\/tests\/(?:index|\d{4}-\d{2}-\d{2})\.json$/,
  /^images\/cone\.svg$/,
  /^images\/words\/[a-z0-9-]+\.(?:svg|webp)$/,
  /^fonts\/[a-z0-9-]+\.woff2$/,
];
/** Where the build looks. Nothing outside these is ever read. */
const SOURCES = ['index.html', 'css', 'js', 'data', 'images', 'fonts'];
/** Runtime files the site cannot work without. */
export const REQUIRED = ['index.html', 'css/style.css', 'js/app.js', 'data/weeks.json', 'images/cone.svg'];
/** Named so a check proves they are absent (the allowlist already excludes them). */
export const FORBIDDEN = [
  'reference', 'reference/vocabulary-prototype.html', 'reference/spelling-test-prototype.html',
  'tests', 'tests/browser.test.js', 'docs', 'docs/STUDY-SCOOP-AUDIT-REPORT.md', 'docs/original-handoff',
  'images/newsletters', 'private', 'local-fixtures', 'scripts', '.github', '.git', 'node_modules',
  'package.json', 'README.md', 'STATUS.md', 'CLAUDE.md', '.gitignore',
];
// Personal names from the original materials (DECISIONS D2). None may be published.
const NAMES = /\bChris\b|Chris's|Christopher|Bazemore|Ms\. Lee|\bMaya\b|\bJordan\b|\bSam\b/;

const isAllowed = (rel) => ALLOW.some((re) => re.test(rel));

function walk(root, dir = '') {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  if (!fs.statSync(full).isDirectory()) return [dir];
  const out = [];
  for (const e of fs.readdirSync(full, { withFileTypes: true })) out.push(...walk(root, dir ? `${dir}/${e.name}` : e.name));
  return out;
}

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** Copies allowed files from `src` into a fresh `out`. Returns what was copied and what was left out (and why). */
export function buildSite(out, src = REPO) {
  out = path.resolve(out);
  // The output folder is deleted first, so never let it be the repository, a source folder or anything above them.
  const inside = (a, b) => a === b || a.startsWith(b + path.sep);
  if (inside(path.resolve(src), out) || SOURCES.some((s) => inside(out, path.resolve(src, s)))) {
    throw new Error(`Refusing to build into ${out}`);
  }
  fs.rmSync(out, { recursive: true, force: true });
  const listed = new Set(readJSON(path.join(src, 'data/weeks.json')).weeks.map((w) => `data/${w.id}.json`));
  const lessonIndex = path.join(src, 'data/lessons/index.json');
  const lessons = new Set(fs.existsSync(lessonIndex) ? readJSON(lessonIndex).lessons.map((l) => `data/lessons/${l.id}.json`) : []);
  const testIndex = path.join(src, 'data/tests/index.json');
  const testWeeks = new Set(fs.existsSync(testIndex) ? readJSON(testIndex).weeks.filter((id) => listed.has(`data/${id}.json`)).map((id) => `data/tests/${id}.json`) : []);
  const copied = [], skipped = [];
  for (const rel of SOURCES.flatMap((s) => walk(src, s))) {
    let why = null;
    if (!isAllowed(rel)) why = 'not on the allowlist';
    else if (/^data\/\d/.test(rel) && !listed.has(rel)) why = 'not listed in data/weeks.json';
    else if (/^data\/lessons\/(?!index\.json$)/.test(rel) && !lessons.has(rel)) why = 'not listed in data/lessons/index.json';
    else if (/^data\/tests\/(?!index\.json$)/.test(rel) && !testWeeks.has(rel)) why = 'not listed in data/tests/index.json (or its week is not published)';
    if (why) { skipped.push(`${rel} (${why})`); continue; }
    fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
    fs.copyFileSync(path.join(src, rel), path.join(out, rel));
    copied.push(rel);
  }
  return { copied, skipped };
}

// Local references in the page, stylesheets and modules. Each must resolve inside the site.
const htmlRefs = (text) => [...text.matchAll(/\s(?:src|href)="([^"]*)"/g)].map((m) => m[1]);
const cssRefs = (text) => [...text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]);
const jsRefs = (text) => [...text.matchAll(/(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/gm)]
  .map((m) => m[1] || m[2]);

/** Returns plain-English problems with a built site folder; an empty list means it is safe to publish. */
export function verifySite(dir) {
  const problems = [];
  const files = walk(dir);
  const has = (rel) => fs.existsSync(path.join(dir, rel));
  const read = (rel) => fs.readFileSync(path.join(dir, rel), 'utf8');

  for (const rel of files) if (!isAllowed(rel)) problems.push(`${rel} is not on the publishing allowlist`);
  for (const rel of FORBIDDEN) if (has(rel)) problems.push(`${rel} must not be published`);
  for (const rel of REQUIRED) if (!has(rel)) problems.push(`${rel} is required but missing`);
  if (problems.length && !has('index.html')) return problems;

  // Follow every reference from index.html; each must exist, be relative, and stay inside the site.
  const used = new Set(['index.html']);
  const queue = ['index.html'];
  while (queue.length) {
    const from = queue.shift();
    if (!has(from)) continue;
    const text = read(from);
    const refs = from.endsWith('.html') ? htmlRefs(text) : from.endsWith('.css') ? cssRefs(text) : jsRefs(text);
    for (const ref of refs) {
      if (ref.startsWith('#') || ref.startsWith('data:')) continue;
      if (/^[a-z]+:|^\/\//i.test(ref)) { problems.push(`${from} loads ${ref} from another site`); continue; }
      if (ref.startsWith('/')) { problems.push(`${from} uses ${ref}, which breaks under /Study-Scoop/; use a relative path`); continue; }
      if (from.endsWith('.js') && !ref.startsWith('.')) { problems.push(`${from} imports ${ref}; use a relative path`); continue; }
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), ref.split(/[?#]/)[0]));
      if (target.startsWith('..')) { problems.push(`${from} refers to ${ref}, outside the site`); continue; }
      if (!has(target)) { problems.push(`${from} refers to ${target}, which is missing`); continue; }
      if (!used.has(target)) { used.add(target); if (/\.(css|js)$/.test(target)) queue.push(target); }
    }
  }
  for (const rel of files) if (/\.(css|js)$/.test(rel) && !used.has(rel)) problems.push(`${rel} is published but never used`);

  // Weekly data: valid, listed, complete, and every picture it names exists.
  if (has('data/weeks.json')) {
    const index = readJSON(path.join(dir, 'data/weeks.json'));
    problems.push(...validateIndex(index).map((p) => `data/weeks.json: ${p}`));
    const listed = new Set((index.weeks || []).map((w) => `data/${w.id}.json`));
    let vocabPictures = 0;
    for (const rel of files) if (/^data\/\d/.test(rel) && !listed.has(rel)) problems.push(`${rel} is published but not listed in data/weeks.json`);
    for (const w of index.weeks || []) {
      const rel = `data/${w.id}.json`;
      if (!has(rel)) { problems.push(`${rel} is listed in data/weeks.json but missing`); continue; }
      const week = readJSON(path.join(dir, rel));
      problems.push(...validateWeek(week, w.id).map((p) => `${rel}: ${p}`));
      for (const w of week.spelling?.words || []) {
        if (w.img && !has(`images/words/${w.img}.svg`)) problems.push(`${rel} names picture images/words/${w.img}.svg, which is missing`);
      }
      vocabPictures += (week.vocab?.words || []).filter((w) => has(`images/words/${pictureName(w.word)}.svg`)).length;
    }
    // Vocabulary pictures are optional per word (a missing one is hidden), but a site with none means the images were left out.
    if (!vocabPictures) problems.push('no vocabulary pictures were published');
  }

  // Lessons: the index is valid, every listed lesson is published and passes the lesson checks (its math included),
  // and nothing unlisted is published (a draft lesson stays off the site, like a draft week).
  if (has('data/lessons/index.json')) {
    const lessonIndex = readJSON(path.join(dir, 'data/lessons/index.json'));
    problems.push(...validateLessonIndex(lessonIndex));
    const ids = new Set((lessonIndex.lessons || []).map((l) => l.id));
    for (const rel of files.filter((f) => /^data\/lessons\/(?!index\.json$)/.test(f))) {
      if (!ids.has(rel.slice('data/lessons/'.length, -'.json'.length))) problems.push(`${rel} is published but not listed in data/lessons/index.json`);
    }
    for (const id of ids) {
      const rel = `data/lessons/${id}.json`;
      if (!has(rel)) { problems.push(`${rel} is listed in data/lessons/index.json but missing`); continue; }
      problems.push(...validateLesson(readJSON(path.join(dir, rel)), id).map((p) => `${rel}: ${p}`));
    }
  }
  // Practice tests: each listed week's tests are published, belong to a published week, and pass every check
  // (answer keys, pictures, teacher definitions). Nothing unlisted is published.
  if (has('data/tests/index.json')) {
    const weeks = readJSON(path.join(dir, 'data/tests/index.json')).weeks;
    if (!Array.isArray(weeks)) problems.push('data/tests/index.json: "weeks" must be a list');
    for (const rel of files.filter((f) => /^data\/tests\/(?!index\.json$)/.test(f))) {
      if (!(weeks || []).includes(rel.slice('data/tests/'.length, -'.json'.length))) problems.push(`${rel} is published but not listed in data/tests/index.json`);
    }
    for (const id of weeks || []) {
      const rel = `data/tests/${id}.json`;
      if (!has(rel)) { problems.push(`${rel} is listed in data/tests/index.json but missing`); continue; }
      if (!has(`data/${id}.json`)) { problems.push(`${rel} is for a week that is not published`); continue; }
      problems.push(...validateTests(readJSON(path.join(dir, rel)), readJSON(path.join(dir, `data/${id}.json`))));
    }
  }
  // The picture list must match the published pictures exactly (pages use it so they never ask for a missing file).
  if (has('data/pictures.json')) {
    const list = readJSON(path.join(dir, 'data/pictures.json'));
    const names = (ext) => files.filter((f) => f.startsWith('images/words/') && f.endsWith(ext))
      .map((f) => f.slice('images/words/'.length, -ext.length)).sort();
    if (JSON.stringify(list.photos) !== JSON.stringify(names('.webp'))) problems.push('data/pictures.json: "photos" does not match the published .webp pictures');
    if (JSON.stringify(list.drawings) !== JSON.stringify(names('.svg'))) problems.push('data/pictures.json: "drawings" does not match the published .svg pictures');
  }

  // Pictures may not run scripts or load anything; no published text may contain personal names.
  for (const rel of files.filter((f) => f.endsWith('.svg'))) {
    const text = read(rel);
    if (/<script|\son[a-z]+\s*=|<foreignObject/i.test(text)) problems.push(`${rel} contains a script`);
    if (/(?:href|src)\s*=\s*["'](?:https?:)?\/\//i.test(text)) problems.push(`${rel} loads something from another site`);
  }
  for (const rel of files.filter((f) => /\.(html|css|js|json|svg)$/.test(f))) {
    const m = NAMES.exec(read(rel));
    if (m) problems.push(`${rel} contains the personal name ${JSON.stringify(m[0])}`);
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const out = path.resolve(process.argv[2] || path.join(REPO, '_site'));
  const { copied, skipped } = buildSite(out);
  console.log(`Built ${path.relative(REPO, out) || out}: ${copied.length} files published, ${skipped.length} left out.`);
  for (const s of skipped) console.log(`  left out: ${s}`);
  const problems = verifySite(out);
  if (problems.length) {
    console.log(`\nNOT SAFE TO PUBLISH (${problems.length} problem${problems.length > 1 ? 's' : ''}):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log('Verified: only approved files, every reference resolves, data valid, no personal names.');
}
