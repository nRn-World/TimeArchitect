// Minimal static file server for local development of Time Architect.
// No dependencies. Serves the repository root on http://127.0.0.1:4173.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 4173;
const host = process.env.HOST && process.env.HOST !== '0' ? process.env.HOST : '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    let target = filePath;
    let info = await stat(target).catch(() => null);
    if (info && info.isDirectory()) {
      target = join(target, 'index.html');
      info = await stat(target).catch(() => null);
    }
    if (!info) {
      // Single page app fallback for navigation requests only.
      if ((req.headers.accept || '').includes('text/html')) {
        target = join(root, 'index.html');
        info = await stat(target).catch(() => null);
      }
    }
    if (!info) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    createReadStream(target).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Server error');
    console.error(error);
  }
});

server.listen(port, host, () => {
  console.log(`Time Architect dev server: http://${host}:${port}`);
});
