// Validates every real week file and the sample fixture week, plus the picture files they point to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateIndex, validateWeek } from '../../js/lib/validate.js';
import { pictureName } from '../../js/lib/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const pictures = new Set(fs.readdirSync(path.join(ROOT, 'images/words')).filter((f) => f.endsWith('.svg')).map((f) => f.replace(/\.svg$/, '')));

for (const dir of ['data', 'tests/fixtures/data']) {
  const index = readJSON(`${dir}/weeks.json`);

  test(`${dir}/weeks.json is valid`, () => {
    assert.deepEqual(validateIndex(index), []);
  });

  for (const { id } of index.weeks) {
    const file = fs.existsSync(path.join(ROOT, dir, `${id}.json`)) ? `${dir}/${id}.json` : `data/${id}.json`;
    test(`${file} is valid`, () => {
      assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} is listed in weeks.json but missing`);
      assert.deepEqual(validateWeek(readJSON(file), id), []);
    });
  }
}

test('every week file in data/ is listed in weeks.json', () => {
  const listed = new Set(readJSON('data/weeks.json').weeks.map((w) => w.id));
  const files = fs.readdirSync(path.join(ROOT, 'data')).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
  for (const f of files) assert.ok(listed.has(f.replace('.json', '')), `${f} is not listed in data/weeks.json`);
});

test('spelling pictures named with "img" exist', () => {
  for (const { id } of readJSON('data/weeks.json').weeks) {
    for (const w of readJSON(`data/${id}.json`).spelling.words) {
      if (w.img) assert.ok(pictures.has(w.img), `${id}: picture "${w.img}" for "${w.word}" is missing`);
    }
  }
});

test('every vocabulary word in the real weeks has a picture', (t) => {
  // Pictures are optional (the page hides a missing one), but the current data has them all.
  for (const { id } of readJSON('data/weeks.json').weeks) {
    for (const w of readJSON(`data/${id}.json`).vocab.words) {
      assert.ok(pictures.has(pictureName(w.word)), `${id}: no picture for vocabulary word "${w.word}"`);
    }
  }
  t.diagnostic(`${pictures.size} word pictures available`);
});

test('word pictures are plain drawings (no scripts, links or external references)', () => {
  for (const name of pictures) {
    const svg = fs.readFileSync(path.join(ROOT, 'images/words', `${name}.svg`), 'utf8');
    assert.doesNotMatch(svg, /<script|\son[a-z]+=|href=|<foreignObject|url\(\s*['"]?https?:/i, `${name}.svg`);
  }
});

test('study-card PNGs are valid square images named for a listed spelling or vocabulary word', () => {
  // Owner-approved study cards (DECISIONS D13, D14). Kept in the repository, not published until a feature uses them.
  const words = new Set(readJSON('data/weeks.json').weeks.flatMap(({ id }) => {
    const week = readJSON(`data/${id}.json`);
    return [...week.spelling.words.map((w) => w.word), ...week.vocab.words.map((w) => pictureName(w.word))];
  }));
  for (const f of fs.readdirSync(path.join(ROOT, 'images/words')).filter((n) => n.endsWith('.png'))) {
    const b = fs.readFileSync(path.join(ROOT, 'images/words', f));
    assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${f} is a PNG`);
    assert.equal(b.subarray(12, 16).toString('latin1'), 'IHDR', `${f} header`);
    const [w, h] = [b.readUInt32BE(16), b.readUInt32BE(20)];
    assert.ok(w === h && w >= 256, `${f} is ${w}x${h}; expected a square of at least 256 px`);
    assert.match(f, /^[a-z0-9-]+\.png$/, `${f} name`);
    assert.ok(words.has(f.slice(0, -4)), `${f} is not a spelling or vocabulary word in any listed week`);
  }
});

test('math examples in every week are correct', () => {
  for (const { id } of readJSON('data/weeks.json').weeks) {
    const m = readJSON(`data/${id}.json`).math;
    for (const w of m?.words || []) assert.equal(w.example[0] * w.example[1], w.example[2], `${id}: ${w.word}`);
  }
});

test('teacher definitions in the data match the approved list exactly', () => {
  // Definitions are copied word for word from the class vocabulary sheet; any change must be deliberate.
  const APPROVED = {
    Produce: 'Fresh fruits and vegetables',
    Exception: 'A case where a rule does not apply',
    Installment: 'When money is paid over a length of time',
    Peculiar: 'Strange or unusual',
    Employee: 'Someone who works for money',
    Fortunate: 'favored by or involving good luck or fortune',
    Ignorant: 'lacking knowledge or awareness in general',
    Melancholy: 'A sad or gloomy condition',
    Trustworthy: 'The ability to keep promises',
    Constellations: 'A group of stars in the night sky that make up a picture or a pattern',
    Irritating: 'To anger or bother',
    Distracted: 'To prevent something from continuing as usual',
  };
  for (const id of ['2026-10-12', '2026-10-19']) {
    const words = readJSON(`data/${id}.json`).vocab.words;
    assert.equal(words.length, Object.keys(APPROVED).length, id);
    for (const w of words) assert.equal(w.def, APPROVED[w.word], `${id}: ${w.word}`);
  }
});
