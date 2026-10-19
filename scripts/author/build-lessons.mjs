// Writes data/lessons/<id>.json from the authoring files in scripts/author/lessons/ and checks each with the
// lesson engine's own validator. Development only (not published). Run: node scripts/author/build-lessons.mjs [id...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { check, solution, validateLesson } from '../../js/lib/lessons.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'scripts/author/lessons');
const wanted = process.argv.slice(2);
const ids = fs.readdirSync(SRC).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''))
  .filter((id) => !wanted.length || wanted.includes(id)).sort();

let bad = 0;
for (const id of ids) {
  const lesson = (await import(pathToFileURL(path.join(SRC, `${id}.mjs`)).href)).default;
  const problems = validateLesson(lesson, id);
  const asText = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
  for (const st of ['together', 'try', 'test']) {
    for (const it of lesson[st].items) {
      if (check(it, asText(solution(it)), lesson).status !== 'correct') problems.push(`${st} ${it.id}: own answer not accepted`);
      if (st !== 'test' && !(it.hints?.length)) problems.push(`${st} ${it.id}: needs a hint`);
      if (!(it.show?.length)) problems.push(`${st} ${it.id}: needs Show me how`);
    }
  }
  if (problems.length) { bad++; console.error(`✗ ${id}\n  ${problems.join('\n  ')}`); continue; }
  fs.writeFileSync(path.join(ROOT, `data/lessons/${id}.json`), `${JSON.stringify(lesson, null, 2)}\n`);
  console.log(`✓ ${id}: learn ${lesson.learn.screens.length}, watch ${lesson.watch.examples.length}, together ${lesson.together.items.length}, try ${lesson.try.items.length}, test ${lesson.test.items.length}`);
}
process.exit(bad ? 1 : 0);
