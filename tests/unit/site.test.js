// Publishing: the built site contains only approved runtime files, and the verifier catches anything unsafe.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FORBIDDEN, REPO, REQUIRED, buildSite, verifySite } from '../../scripts/build-site.js';

const made = [];
const tmp = (name) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), `ss-${name}-`)); made.push(d); return d; };
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); });
function files(dir, sub = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
    const p = sub ? `${sub}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...files(dir, p)); else out.push(p);
  }
  return out.sort();
}
const repoFiles = (dir) => files(REPO, dir);

const SITE = tmp('site');
const { copied, skipped } = buildSite(SITE);
const PUBLISHED = files(SITE);

/** A fresh copy of the built site to break on purpose. */
function brokenSite(change) {
  const dir = tmp('broken');
  fs.cpSync(SITE, dir, { recursive: true });
  change(dir);
  return verifySite(dir);
}
const put = (dir, rel, text = 'x') => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
const caught = (problems, pattern) => assert.ok(problems.some((p) => pattern.test(p)), `expected ${pattern}, got ${JSON.stringify(problems)}`);

test('the built site passes verification', () => {
  assert.deepEqual(verifySite(SITE), []);
  assert.deepEqual(skipped, []);
  assert.deepEqual([...copied].sort(), PUBLISHED);
});

test('the built site is exactly the page, styles, modules, listed weeks and pictures', () => {
  const weeks = JSON.parse(fs.readFileSync(path.join(REPO, 'data/weeks.json'), 'utf8')).weeks.map((w) => `data/${w.id}.json`);
  const expected = ['index.html', ...repoFiles('css'), ...repoFiles('js'), 'data/weeks.json', ...weeks, 'images/cone.svg',
    ...repoFiles('images/words')];
  assert.deepEqual(PUBLISHED, expected.sort());
  for (const rel of REQUIRED) assert.ok(PUBLISHED.includes(rel), `${rel} is published`);
  assert.deepEqual([...new Set(PUBLISHED.map((f) => f.split('/')[0]))].sort(), ['css', 'data', 'images', 'index.html', 'js']);
});

test('development files are absent from the built site, not merely unlinked', () => {
  for (const rel of ['reference/vocabulary-prototype.html', 'reference/spelling-test-prototype.html', 'tests/browser.test.js',
    'docs/STUDY-SCOOP-AUDIT-REPORT.md', ...FORBIDDEN]) {
    assert.ok(!fs.existsSync(path.join(SITE, rel)), `${rel} must be absent`);
  }
  // The prototypes and the audit report really exist in the repository, so their absence is the build's doing.
  for (const rel of ['reference/vocabulary-prototype.html', 'tests/browser.test.js', 'docs/STUDY-SCOOP-AUDIT-REPORT.md']) {
    assert.ok(fs.existsSync(path.join(REPO, rel)), `${rel} exists in the repository`);
  }
  for (const rel of PUBLISHED) assert.doesNotMatch(rel, /\.(md|jpe?g|png|heic|pdf|txt|mjs|cjs|ts|map|yml)$|^\.|\/\./, rel);
});

test('the build leaves out anything not on the allowlist, even inside approved folders', () => {
  const src = tmp('src');
  for (const s of ['index.html', 'css', 'js', 'data', 'images']) fs.cpSync(path.join(REPO, s), path.join(src, s), { recursive: true });
  for (const rel of ['reference/vocabulary-prototype.html', 'tests/browser.test.js', 'docs/notes.md', 'images/newsletters/2026-10-12.jpg',
    'images/words/scan.png', 'js/notes.md', 'js/.secret.js', 'css/draft.css.bak', 'data/2026-11-02.json', 'data/notes.json',
    'images/mockup.svg']) put(src, rel);
  const out = tmp('out');
  const result = buildSite(out, src);
  assert.deepEqual(files(out), PUBLISHED);
  assert.deepEqual(result.skipped.sort(), [
    'css/draft.css.bak (not on the allowlist)', 'data/2026-11-02.json (not listed in data/weeks.json)', 'data/notes.json (not on the allowlist)',
    'images/mockup.svg (not on the allowlist)', 'images/newsletters/2026-10-12.jpg (not on the allowlist)',
    'images/words/scan.png (not on the allowlist)', 'js/.secret.js (not on the allowlist)', 'js/notes.md (not on the allowlist)']);
  assert.deepEqual(verifySite(out), []);
});

test('the build refuses to empty the repository or a source folder', () => {
  for (const out of [REPO, path.dirname(REPO), path.join(REPO, 'js'), path.join(REPO, 'data', 'x')]) {
    assert.throws(() => buildSite(out), /Refusing/, out);
  }
  assert.ok(fs.existsSync(path.join(REPO, 'js/app.js')));
});

test('the verifier rejects each forbidden or unapproved file', () => {
  for (const rel of ['reference/vocabulary-prototype.html', 'reference/spelling-test-prototype.html', 'tests/browser.test.js',
    'docs/STUDY-SCOOP-AUDIT-REPORT.md', 'images/newsletters/2026-10-12.jpg', 'private/roster.json', 'local-fixtures/a.json',
    'README.md', 'package.json', '.github/workflows/pages.yml', 'images/scan.png', 'js/debug.mjs']) {
    caught(brokenSite((d) => put(d, rel)), new RegExp(`^${rel.replace(/[.]/g, '\\.')} (is not on the publishing allowlist|must not be published)`));
  }
});

test('the verifier catches missing runtime files and broken references', () => {
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'css/style.css'))), /index\.html refers to css\/style\.css, which is missing/);
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'js/views/math.js'))), /js\/app\.js refers to js\/views\/math\.js, which is missing/);
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'js/lib/html.js'))), /refers to js\/lib\/html\.js, which is missing/);
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'images/cone.svg'))), /images\/cone\.svg is required but missing/);
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'index.html'))), /index\.html is required but missing/);
  caught(brokenSite((d) => put(d, 'js/extra.js', 'export const x = 1;')), /js\/extra\.js is published but never used/);
});

test('the verifier catches paths that would break under /Study-Scoop/ or reach another site', () => {
  const edit = (d, rel, from, to) => { const f = path.join(d, rel); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(from, to)); };
  caught(brokenSite((d) => edit(d, 'index.html', 'href="css/style.css"', 'href="/css/style.css"')), /breaks under \/Study-Scoop\//);
  caught(brokenSite((d) => edit(d, 'index.html', 'src="js/app.js"', 'src="https://cdn.example.com/app.js"')), /from another site/);
  caught(brokenSite((d) => edit(d, 'js/app.js', "from './lib/html.js'", "from '../../lib/html.js'")), /outside the site/);
  caught(brokenSite((d) => edit(d, 'js/app.js', "from './lib/html.js'", "from 'html'")), /use a relative path/);
});

test('the verifier checks the weekly data and its pictures', () => {
  const weeks = JSON.parse(fs.readFileSync(path.join(SITE, 'data/weeks.json'), 'utf8'));
  const [first] = weeks.weeks;
  caught(brokenSite((d) => fs.rmSync(path.join(d, `data/${first.id}.json`))), /is listed in data\/weeks\.json but missing/);
  caught(brokenSite((d) => put(d, 'data/2026-11-02.json', '{}')), /data\/2026-11-02\.json is published but not listed/);
  caught(brokenSite((d) => put(d, 'data/weeks.json', JSON.stringify({ ...weeks, current: '2030-01-07' }))), /^data\/weeks\.json: /);
  caught(brokenSite((d) => put(d, `data/${first.id}.json`, '{"id":"x"}')), new RegExp(`^data/${first.id}\\.json: `));
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'images/words/rushed.svg'))), /names picture images\/words\/rushed\.svg, which is missing/);
  caught(brokenSite((d) => fs.rmSync(path.join(d, 'images/words'), { recursive: true })), /no vocabulary pictures were published/);
});

test('the verifier rejects pictures with scripts or outside links, and personal names', () => {
  const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  caught(brokenSite((d) => put(d, 'images/words/produce.svg', svg('<script>alert(1)</script>'))), /produce\.svg contains a script/);
  caught(brokenSite((d) => put(d, 'images/words/produce.svg', svg('<rect onload="x()"/>'))), /contains a script/);
  caught(brokenSite((d) => put(d, 'images/words/produce.svg', svg('<image href="https://example.com/a.png"/>'))), /loads something from another site/);
  caught(brokenSite((d) => {
    const f = path.join(d, 'data/weeks.json'); const w = JSON.parse(fs.readFileSync(f, 'utf8'));
    w.weeks[0].label = 'Ms. Lee week'; fs.writeFileSync(f, JSON.stringify(w));
  }), /contains the personal name "Ms\. Lee"/);
});
