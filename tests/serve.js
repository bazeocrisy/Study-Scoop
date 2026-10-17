// Local preview: serves the site at http://127.0.0.1:<port>/Study-Scoop/ (the same path GitHub Pages uses).
// The site loads JSON with fetch, so it must be served; opening index.html as a file will not work.
import { startServer, BASE } from './lib/harness.js';

const server = await startServer();
console.log(`Study Scoop preview: ${server.origin}${BASE}  (Ctrl+C to stop)`);
