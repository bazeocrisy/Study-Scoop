// Makes small WebP copies of the owner-approved study-card PNGs for the website (DECISIONS D13, D14, D16).
// The 640x640 PNG originals stay in the repository unchanged and are never published.
// Run: node scripts/make-webp.mjs   (needs Chrome or Edge, like the browser tests)
import fs from 'node:fs';
import path from 'node:path';
import { REPO } from './build-site.js';
import { startBrowser } from '../tests/lib/harness.js';

const DIR = path.join(REPO, 'images/words');
const SIZE = 400;      // shown at most ~320 CSS px wide; 400 px stays sharp on most screens
const QUALITY = 0.8;

const b = await startBrowser();
try {
  await b.send('Page.navigate', { url: 'about:blank' });
  for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.png')).sort()) {
    const src = `data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`;
    // Trim to the picture's main panel: the approved cards sit on a cream margin, and some include a sliver of a
    // neighbouring panel at the edge. The widest block of picture between background-coloured gaps is kept
    // (nothing is redrawn), then scaled so its longer side is SIZE pixels.
    const data = await b.js(`
      const img = new Image(); img.src = ${JSON.stringify(src)}; await img.decode();
      const W = img.naturalWidth, H = img.naturalHeight;
      const s = document.createElement('canvas'); s.width = W; s.height = H;
      const sg = s.getContext('2d'); sg.drawImage(img, 0, 0);
      const px = sg.getImageData(0, 0, W, H).data;
      const at = (x, y) => (y * W + x) * 4;
      const bg = [px[at(2, 2)], px[at(2, 2) + 1], px[at(2, 2) + 2]];
      const isBg = (x, y) => { const i = at(x, y); return Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) < 36; };
      const widest = (n, has) => { let best = [0, n - 1], start = -1;
        for (let k = 0; k <= n; k++) { const on = k < n && has(k);
          if (on && start < 0) start = k;
          if (!on && start >= 0) { if (k - 1 - start > best[1] - best[0] || best[1] - best[0] === n - 1) best = [start, k - 1]; start = -1; } }
        return best; };
      const colHas = (x, y0, y1) => { let c = 0; for (let y = y0; y <= y1; y++) if (!isBg(x, y)) c++; return c > (y1 - y0 + 1) * 0.04; };
      const rowHas = (y, x0, x1) => { let c = 0; for (let x = x0; x <= x1; x++) if (!isBg(x, y)) c++; return c > (x1 - x0 + 1) * 0.04; };
      let [x0, x1] = widest(W, (x) => colHas(x, 0, H - 1));
      const [y0, y1] = widest(H, (y) => rowHas(y, x0, x1));
      [x0, x1] = widest(W, (x) => colHas(x, y0, y1));
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1, k = ${SIZE} / Math.max(cw, ch);
      const c = document.createElement('canvas'); c.width = Math.round(cw * k); c.height = Math.round(ch * k);
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(s, x0, y0, cw, ch, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', ${QUALITY});`);
    if (!data.startsWith('data:image/webp')) throw new Error(`${f}: this browser cannot write WebP`);
    const out = path.join(DIR, f.replace(/\.png$/, '.webp'));
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
    console.log(`${path.basename(out)}  ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
} finally {
  b.close();
}
writePictureList();

/** data/pictures.json: which word pictures exist, so pages never ask for a missing file (DECISIONS D16). */
export function writePictureList() {
  const names = (ext) => fs.readdirSync(DIR).filter((n) => n.endsWith(ext)).map((n) => n.slice(0, -ext.length)).sort();
  const list = { photos: names('.webp'), drawings: names('.svg') };
  fs.writeFileSync(path.join(REPO, 'data/pictures.json'), `${JSON.stringify(list, null, 2)}\n`);
  console.log(`data/pictures.json: ${list.photos.length} study cards, ${list.drawings.length} drawings`);
}
