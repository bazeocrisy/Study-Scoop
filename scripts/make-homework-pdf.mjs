// Prints each listed week's homework packet page to downloads/homework-<week>.pdf (DECISIONS D23).
// The PDF is printed from Study Scoop's own page, so it only ever contains Study Scoop's problems (never a scan).
// Run after changing a packet:  CHROME_PATH=... npm run homework-pdf
import fs from 'node:fs';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from '../tests/lib/harness.js';

const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/homework/index.json'), 'utf8')).weeks;
const current = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/weeks.json'), 'utf8')).current;
const server = await startServer();
const b = await startBrowser();
try {
  fs.mkdirSync(path.join(ROOT, 'downloads'), { recursive: true });
  for (const id of list) {
    const hash = id === current ? '#homework?act=packet' : `#homework?week=${id}&act=packet`;
    await b.load(`${server.origin}${BASE}${hash}`);
    await b.waitFor('!!document.querySelector(".packet-page")');
    await b.js('document.title = "Study Scoop homework packet";');
    const r = await b.send('Page.printToPDF', { paperWidth: 8.5, paperHeight: 11, marginTop: 0.5, marginBottom: 0.5, marginLeft: 0.5, marginRight: 0.5, printBackground: false, preferCSSPageSize: false });
    const rel = `downloads/homework-${id}.pdf`;
    fs.writeFileSync(path.join(ROOT, rel), Buffer.from(r.result.data, 'base64'));
    // The packet names its download, so the Homework page offers it.
    const file = path.join(ROOT, `data/homework/${id}.json`);
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes(`"download": "${rel}"`)) fs.writeFileSync(file, text.replace(/("about": "[^"]*",)/, `$1\n  "download": "${rel}",`));
    console.log(`wrote ${rel}`);
  }
} finally {
  await b.close?.();
  await server.close?.();
  process.exit(0);
}
