// Test harness: static server under /Study-Scoop/ (like GitHub Pages) + headless Chrome/Edge over CDP.
// Adapted from the Word Workshop harness. No dependencies (Node 22+ for the built-in WebSocket).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BASE = '/Study-Scoop/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.png': 'image/png' };

/** `overlay` maps a path under BASE (e.g. "data/weeks.json") to a file that replaces it. */
export async function startServer({ overlay = {} } = {}) {
  const missing = [];
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (!url.startsWith(BASE)) { missing.push(url); res.writeHead(404).end(); return; }
    const rel = url.slice(BASE.length) || 'index.html';
    let file = overlay[rel] ? path.join(ROOT, overlay[rel]) : path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { missing.push(url); res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, missing, close: () => server.close() };
}

export async function startBrowser() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const exe = candidates.find((p) => fs.existsSync(p));
  if (!exe) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-chrome-'));
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let port;
  for (let i = 0; i < 150 && !port; i++) {
    await new Promise((r) => setTimeout(r, 100));
    try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { /* not ready */ }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  const requests = [];   // every URL the page asked for
  const failures = [];   // HTTP errors and network failures
  const urlById = new Map();
  let loadWaiters = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    const p = msg.params;
    if (msg.method === 'Page.loadEventFired') { loadWaiters.forEach((r) => r()); loadWaiters = []; }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && (p.type === 'error' || p.type === 'warning')) {
      errors.push(`console.${p.type}: ${p.args.map((a) => a.value || a.description).join(' ')}`);
    }
    if (msg.method === 'Log.entryAdded' && p.entry.level === 'error' && p.entry.source !== 'network') errors.push(`log: ${p.entry.text}`);
    if (msg.method === 'Network.requestWillBeSent') { requests.push(p.request.url); urlById.set(p.requestId, p.request.url); }
    if (msg.method === 'Network.responseReceived' && p.response.status >= 400) failures.push(`${p.response.status} ${p.response.url}`);
    if (msg.method === 'Network.loadingFailed' && !p.canceled) failures.push(`failed ${urlById.get(p.requestId)} ${p.errorText}`);
  });
  const send = (method, params = {}) => {
    const id = ++nextId;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((r) => pending.set(id, r));
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  const b = {
    errors, requests, failures, send,
    async js(expr) {
      const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
      if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'evaluate failed');
      return r.result.result.value;
    },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    /** Wait until the app has finished rendering (main#app gets data-ready). */
    async ready(previous) {
      for (let i = 0; i < 100; i++) {
        const v = await b.js('return document.getElementById("app")?.dataset.ready || "";');
        if (v && v !== previous) return v;
        await b.wait(50);
      }
      throw new Error('app did not finish rendering');
    },
    /** A fresh page load (via about:blank, so a hash-only change still reloads and focus starts at the top). */
    async load(url) {
      for (const target of ['about:blank', url]) {
        const loaded = new Promise((r) => { loadWaiters.push(r); setTimeout(r, 10000); });
        await send('Page.navigate', { url: target });
        await loaded;
      }
      return b.ready();
    },
    /** Change the hash (a same-page navigation) and wait for the new render. */
    async hash(h) {
      const before = await b.js('return document.getElementById("app").dataset.ready || "";');
      await b.js(`location.hash = ${JSON.stringify(h)};`);
      return b.ready(before);
    },
    async initScript(source) { await send('Page.addScriptToEvaluateOnNewDocument', { source }); },
    async viewport(width, height, mobile = width < 1024) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    },
    async media(type = '', features = []) { await send('Emulation.setEmulatedMedia', { media: type, features }); },
    async shot(file) {
      const m = await b.js('return { w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight };');
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: m.w, height: Math.min(m.h, 8000), scale: 1 } });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    },
    async key(key, shift = false) {
      const vk = { Tab: 9, Enter: 13, ' ': 32 }[key] || 0;
      const mods = shift ? 8 : 0;
      const text = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined;
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: vk, modifiers: mods, text });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: vk, modifiers: mods });
    },
    close() {
      try { ws.send(JSON.stringify({ id: ++nextId, method: 'Browser.close' })); } catch { /* ignore */ }
      try { ws.close(); } catch { /* ignore */ }
      try {
        if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
        else proc.kill();
      } catch { /* ignore */ }
    },
  };
  return b;
}
