// Study Scoop proofreading gate (text audit, 2026-11-12). Run: npm run proofread
// Checks every child- and parent-facing string in data/ (weeks, lessons, practice, chapters, tests, homework,
// reading, pictures) for slips that the 2026-11-12 audit found: number agreement after "1", doubled words,
// British spellings, sentences that start in lower case, double spaces, unbalanced brackets, and adult jargon
// in Chapter 7 feedback. It is a safety net, not a replacement for reading the text and the images (see
// docs/PROOFREADING.md). Exit code 1 when anything is found.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILES = [
  ...fs.readdirSync(path.join(ROOT, 'data')).filter((f) => /^\d{4}-\d\d-\d\d\.json$/.test(f)).map((f) => `data/${f}`),
  ...['lessons', 'practice', 'chapters', 'tests', 'homework', 'reading'].filter((d) => fs.existsSync(path.join(ROOT, 'data', d))).flatMap((d) => fs.readdirSync(path.join(ROOT, 'data', d)).filter((f) => f.endsWith('.json')).map((f) => `data/${d}/${f}`)),
  'data/pictures.json', 'data/weeks.json',
];
// Keys that are not prose (ids, file names, answers, enum values).
const SKIP_KEYS = new Set(['id', 'src', 'file', 'kind', 'type', 'skill', 'role', 'stage', 'week', 'date', 'answerPolicy', 'asks', 'when', 'option', 'layout', 'framing', 'icon', 'href', 'url', 'labs', 'blank', 'accept', 'answer', 'unit', 'group', 'intent', 'syllables', 'alsoFits', 'pattern', 'patterns']);

export const RULES = [
  { id: 'one-plural', re: /(?<![\d./,-]|and |, )\b1 (?:(?:equal|colored|selected|plain|complete|whole|whole-size|marked|crossed|small|more|unit|half-unit) )?(parts|pieces|spaces|intervals|gaps|jumps|steps|objects|wholes|rows|squares|groups|sticks|tiles|units|strips|disks|circles|shapes|tasks|counters)\b(?! (?:of|in|to|per)\b)/, why: 'number agreement: "1" before a plural noun' },
  { id: 'one-verb', re: /\b1 (?:equal |selected |colored )?(?:part|piece|object|gap|space|interval) are\b/, why: 'verb agreement: "1 ... are"' },
  { id: 'doubled', re: /\b(the|a|an|and|to|of|is|in|it|on|for|that)\s+\1\b/i, why: 'doubled word' },
  { id: 'british', re: /\b(colour|favourite|labelled|labelling|centre|metre|practise[sd]?|organise|recognise|realise|behaviour|grey)\b/i, why: 'British spelling (use American English)' },
  { id: 'lower-start', re: /(?:^|[.!]\s+)(?!e\.g|i\.e)[a-z][a-z]+\b(?=[^.]*\s)/, why: 'sentence starts with a lower-case letter', prose: true },
  { id: 'double-space', re: /\S {2,}\S/, why: 'double space' },
  { id: 'jargon', re: /\b(positive (?:bottom )?number|positive number of|repartition|membership|inspect|displayed partition|shown partition)\b/i, why: 'adult wording in child-facing text' },
  { id: 'misspelled', re: /\b(vocapulary|recieve|seperate|definately|occured|untill|arguement|beleive|wierd|thier|alot)\b/i, why: 'common misspelling' },
];
const ALLOW_LOWER_START = /^(?:\d|[a-z]+[/=]|[a-z]\b|tract|form|ct|ed|ing|er|or|un|mis|re|dis|ex|at|in)/; // word parts, fragments
function balanced(s) { let n = 0; for (const c of s) { if (c === '(') n++; if (c === ')') n--; if (n < 0) return false; } return n === 0; }

export function proofreadText(text) {
  const out = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (!m) continue;
    // A word quoted on purpose (e.g. a note that records a corrected typo) is not a slip.
    if (r.id === 'misspelled' && new RegExp(`["“\\\\]${m[0]}["”\\\\]`).test(text)) continue;
    if (r.prose) {
      // Only flag full sentences (a capital-free label like "fresh fruits and vegetables" is the teacher's style).
      const start = text.trim();
      if (ALLOW_LOWER_START.test(start) || !/[.!?]$/.test(start) || start.split(/\s+/).length < 5) continue;
    }
    out.push({ rule: r.id, why: r.why, match: m[0] });
  }
  if (!balanced(text)) out.push({ rule: 'brackets', why: 'unbalanced parentheses', match: text.slice(0, 40) });
  return out;
}

// Teacher-source text is reported separately and never auto-fixed (CLAUDE.md: do not silently change originals).
const TEACHER = (file, p) => /^data\/\d{4}-/.test(file) && /(vocab\.words\.\d+\.def|spelling\.words|mathUpcoming\.words\.\d+\.def|announcements)/.test(p);

// Text inside code and pages (buttons, labels, feedback, game and lab text): string literals with at least two
// words, checked with the rules that do not depend on sentence structure.
const CODE_RULES = new Set(['one-plural', 'one-verb', 'doubled', 'british', 'misspelled', 'jargon']);
export const CODE_FILES = () => [
  ...fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
  ...['lib', 'views'].flatMap((d) => fs.readdirSync(path.join(ROOT, 'js', d)).filter((f) => f.endsWith('.js')).map((f) => `js/${d}/${f}`)),
  'index.html', ...fs.readdirSync(path.join(ROOT, 'games')).map((f) => `games/${f}`), ...fs.readdirSync(path.join(ROOT, 'labs')).map((f) => `labs/${f}`),
];
export function proofreadCode(files = CODE_FILES()) {
  const findings = [];
  for (const file of files) {
    // Images and developer comments are not student text.
    const text = fs.readFileSync(path.resolve(ROOT, file), 'utf8').replace(/data:[a-z]+\/[\w+.-]+;base64,[A-Za-z0-9+/=]+/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[\s;{}(,])\/\/[^\n]*/g, '$1');
    for (const m of text.matchAll(/'([^'\n]{8,}?)'|"([^"\n]{8,}?)"|`([^`]{8,}?)`|>([^<>{}\n]{8,})</g)) {
      const str = (m[1] ?? m[2] ?? m[3] ?? m[4]).replace(/\$\{[^}]*\}/g, 'N');
      if (!/[a-z]{2,} [a-z]{2,}/i.test(str) || /^[\w.#\[\]=:"' -]*$/.test(str) && !/ (?:the|a|to|and) /.test(str)) continue;
      for (const f of proofreadText(str)) if (CODE_RULES.has(f.rule)) findings.push({ file, path: `offset ${m.index}`, ...f, text: str.slice(0, 160), source: 'study-scoop' });
    }
  }
  return findings;
}

export function proofreadFiles(files = FILES) {
  const findings = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));
    const walk = (x, p) => {
      if (typeof x === 'string') {
        if (x.length < 3 || /^(images|data|labs|https?):/.test(x) || /^[\w./-]+\.(webp|png|svg|pdf|html)$/.test(x)) return;
        for (const f of proofreadText(x)) findings.push({ file, path: p, ...f, text: x.slice(0, 160), source: TEACHER(file, p) ? 'teacher' : 'study-scoop' });
        return;
      }
      if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${p}.${i}`));
      // A plain list of words (a spelling list) is not prose; objects inside "words" (vocabulary entries) are checked.
      if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!SKIP_KEYS.has(k) && !(k === 'words' && Array.isArray(v) && v.every((w) => typeof w === 'string'))) walk(v, p ? `${p}.${k}` : k);
    };
    walk(data, '');
  }
  return findings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = [...proofreadFiles(), ...proofreadCode()];
  const ours = f.filter((x) => x.source === 'study-scoop'), teacher = f.filter((x) => x.source === 'teacher');
  for (const x of ours) console.log(`${x.file} ${x.path}: [${x.rule}] ${x.why}: "${x.match}" in "${x.text}"`);
  if (teacher.length) console.log(`\nTeacher-source text (report to the owner; never change silently): ${teacher.length} note(s).`);
  for (const x of teacher) console.log(`  ${x.file} ${x.path}: [${x.rule}] "${x.text}"`);
  console.log(`\nProofreading gate: ${FILES.length} data files and ${CODE_FILES().length} code/page files, ${ours.length} Study Scoop finding(s).`);
  process.exit(ours.length ? 1 : 0);
}
