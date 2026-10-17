// Privacy, security and repository hygiene checks on the source files themselves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Code without its comments, so a comment that explains a rule (e.g. "no localStorage") is not a violation.
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
// Short failure messages: name the file and the matched text instead of printing the whole file.
const refute = (re, text, label) => {
  const m = re.exec(text);
  assert.ok(!m, `${label}: found ${JSON.stringify(m && m[0])}`);
};

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

const APP_FILES = ['index.html', 'css/style.css', ...walk('js')];
const PUBLISHED = ['index.html', ...walk('js'), ...walk('css'), ...walk('data'), ...walk('images'), ...walk('reference'), ...walk('docs')];

test('the app never stores anything or tracks anyone', () => {
  for (const f of APP_FILES) {
    const src = code(f);
    refute(/localStorage|sessionStorage|indexedDB|document\.cookie|serviceWorker|sendBeacon/, src, f);
    refute(/gtag|google-analytics|googletagmanager|analytics|plausible|matomo|fbq\(/i, src, f);
  }
});

test('the app makes no external requests (no external URLs, system fonts only)', () => {
  for (const f of APP_FILES) {
    const urls = (code(f).match(/https?:\/\/[^\s"'<>)]+/g) || []).filter((u) => !u.startsWith('http://www.w3.org/2000/svg'));
    assert.deepEqual(urls, [], f);
  }
  refute(/@import|@font-face/, read('css/style.css'), 'css/style.css');
});

test('index.html has a strict Content Security Policy and seven sections', () => {
  const page = read('index.html');
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(page)?.[1] || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /connect-src 'self'/);
  refute(/unsafe-inline|unsafe-eval|\*/, csp, 'CSP');
  assert.equal((page.match(/data-tab="/g) || []).length, 7);
  assert.match(page, /<html lang="en">/);
  assert.match(page, /<script type="module" src="js\/app\.js"><\/script>/);
  refute(/\son[a-z]+=/i, page, 'index.html inline event handler');
});

test('no newsletter photos, mockups or private folders are in the repository', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'images/newsletters')), 'images/newsletters must not exist');
  assert.ok(!fs.existsSync(path.join(ROOT, 'reference/design-mockup')), 'design mockups are kept private');
  for (const f of PUBLISHED) refute(/\.(jpe?g|heic|pdf)$/i, f, 'photos and scans are not published');
});

test('the app does not link to the reference prototypes or newsletter photos', () => {
  for (const f of APP_FILES) refute(/reference\/|images\/newsletters/, code(f), f);
});

test('no personal names from the original materials are published', () => {
  // See docs/DECISIONS.md D2. Fictional names in example sentences were replaced with family words.
  const NAMES = /\bChris\b|Chris's|Christopher|Bazemore|Ms\. Lee|\bMaya\b|\bJordan\b|\bSam\b/;
  for (const f of PUBLISHED.filter((p) => /\.(html|js|json|md|svg|css)$/.test(p))) {
    // These two documents record what was found and what was replaced.
    if (f === 'docs/DECISIONS.md' || f === 'docs/STUDY-SCOOP-AUDIT-REPORT.md') continue;
    refute(NAMES, read(f), f);
  }
});

test('no credentials or keys are committed', () => {
  for (const f of PUBLISHED.filter((p) => /\.(html|js|json|md|css)$/.test(p))) {
    refute(/api[_-]?key\s*[:=]|secret\s*[:=]|password\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{20,}/i, read(f), f);
  }
});
