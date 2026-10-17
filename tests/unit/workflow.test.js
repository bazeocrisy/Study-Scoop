// Publishing workflow: production from main, preview from develop, both tested before either is published (DECISIONS D15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO } from '../../scripts/build-site.js';

const YML = fs.readFileSync(path.join(REPO, '.github/workflows/pages.yml'), 'utf8').replace(/\r\n/g, '\n');
/** The text of one job, from its key to the next top-level job. */
const job = (name) => {
  const m = YML.match(new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  [a-z-]+:\\n|$)`));
  assert.ok(m, `job ${name} exists`);
  return m[1];
};
/** Asserts each pattern appears in the text, in this order. */
const inOrder = (text, patterns) => {
  let at = -1;
  for (const p of patterns) {
    const i = text.slice(at + 1).search(p);
    assert.ok(i >= 0, `${p} appears after position ${at}`);
    at += 1 + i;
  }
};

test('pushes to main and develop publish; pull requests only check', () => {
  assert.match(YML, /\non:\n  pull_request:\n  push:\n    branches: \[main, develop\]\n  workflow_dispatch:\n/);
  assert.match(YML, /\npermissions: \{\}\n/);
  assert.match(job('check'), /if: github\.event_name == 'pull_request'/);
  assert.match(job('build'), /if: github\.event_name != 'pull_request'/);
  assert.doesNotMatch(job('check'), /upload-pages-artifact|deploy-pages|pages: write/);
  assert.match(job('deploy'), /needs: build/);
  assert.match(job('deploy'), /name: github-pages/);
});

test('production is built from main and the preview from develop, each with its own tests and allowlist', () => {
  inOrder(job('build'), [
    /ref: main\n\s+path: main\n/, /ref: develop\n\s+path: develop\n/,
    /working-directory: main\n\s+run: npm test\n/, /working-directory: develop\n\s+run: npm test\n/,
    /run: node main\/scripts\/build-site\.js "\$GITHUB_WORKSPACE\/_site"\n/,
    /run: node develop\/scripts\/build-site\.js "\$GITHUB_WORKSPACE\/_preview"\n/,
    /working-directory: main\n\s+run: node tests\/browser\.test\.js --site "\$GITHUB_WORKSPACE\/_site"\n/,
    /working-directory: develop\n\s+run: node tests\/browser\.test\.js --site "\$GITHUB_WORKSPACE\/_preview"\n/,
    /mv "\$GITHUB_WORKSPACE\/_preview" "\$GITHUB_WORKSPACE\/_site\/preview"\n/,
    /test -f "\$GITHUB_WORKSPACE\/_site\/index\.html" && test -f "\$GITHUB_WORKSPACE\/_site\/preview\/index\.html"/,
    /upload-pages-artifact@[0-9a-f]{40} .*\n\s+with:\n\s+path: _site\n/,
  ]);
});

test('pull requests run every test and the allowlist build', () => {
  inOrder(job('check'), [/run: npm test\n/, /run: npm run test:browser\n/, /run: node scripts\/build-site\.js _site\n/,
    /run: node tests\/browser\.test\.js --site _site\n/]);
});

test('actions are pinned, credentials are not kept, and only deploy may write to Pages', () => {
  const uses = [...YML.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
  assert.ok(uses.length >= 6);
  for (const u of uses) assert.match(u, /^actions\/[a-z-]+@[0-9a-f]{40}$/, u);
  assert.equal((YML.match(/persist-credentials: false/g) || []).length, (YML.match(/actions\/checkout@/g) || []).length);
  assert.equal((YML.match(/pages: write/g) || []).length, 1);
  assert.match(job('deploy'), /pages: write/);
  assert.doesNotMatch(YML.replace(/^#.*$/gm, ''), /merge|contents: write|secrets\./i); // never merges or writes to the repository
});
