// Interactive Chapter 7 (D29): stand-alone lesson pages linked from Math > Chapter 7.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INTERACTIVE_7 } from '../../js/views/math.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');

test('every Interactive Chapter 7 card opens a lesson page that exists', () => {
  assert.deepEqual(INTERACTIVE_7.map((l) => l.id), ['7-1', '7-2']);
  for (const l of INTERACTIVE_7) assert.ok(fs.existsSync(path.join(REPO, `interactive/${l.id}.html`)), l.id);
});

test('Chapter 7 shows the Interactive Chapter 7 cards; other chapters do not', () => {
  const src = read('js/views/math.js');
  assert.match(src, /\$\{id === 7 \? interactiveChapter7\(\) : ''\}/);
});

for (const id of ['7-1', '7-2']) {
  test(`interactive/${id}.html is self-contained, original and private`, () => {
    // The SVG namespace is an identifier, not a request.
    const t = read(`interactive/${id}.html`).replaceAll('http://www.w3.org/2000/svg', 'SVG_NS');
    assert.match(t, new RegExp(`<title>Lesson ${id} `));
    // No outside requests: no external scripts, styles, images or fetches.
    assert.doesNotMatch(t, /<script[^>]+src=|<link[^>]+href=|https?:\/\/|fetch\(/i);
    // No personal names (D2) and none of the textbook's story characters.
    assert.doesNotMatch(t, /\bChris\b|Christopher|Bazemore|Ms\. Lee|\bMaya\b|\bJordan\b|\bSam\b/);
    assert.doesNotMatch(t, /\b(Arun|Kelly|Paul|Wendy|Carrie|Rubi)\b|McGraw|Math is…/);
    // Progress stays in this browser only, under the lesson's own key; no name field.
    assert.match(t, /localStorage/);
    assert.doesNotMatch(t, /placeholder:"Type your name"/);
    // A way back to the chapter.
    assert.match(t, /href:"\.\.\/index\.html#math\?ch=7"/);
  });
}
