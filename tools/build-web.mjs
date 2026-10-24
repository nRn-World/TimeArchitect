// Assembles the runtime web app into dist/ for Capacitor (Android/iOS).
// Keeps tooling, tests and docs out of the shipped bundle.
import { cp, mkdir, rm, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = join(root, 'dist');

const FILES = ['index.html', 'styles.css', 'manifest.webmanifest', 'service-worker.js', 'LICENSE', 'THIRD_PARTY_NOTICES.md'];
const DIRS = ['src', 'assets'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of FILES) {
  await cp(join(root, file), join(dist, file));
}
for (const dir of DIRS) {
  await cp(join(root, dir), join(dist, dir), { recursive: true });
}

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  let count = 0;
  let bytes = 0;
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(full);
      count += nested.count;
      bytes += nested.bytes;
    } else {
      count += 1;
      bytes += (await stat(full)).size;
    }
  }
  return { count, bytes };
};

// Cache-bust the service worker on every build. Native shells keep the WebView
// origin's cache between APK updates, so a fixed cache name would keep serving
// the previous JavaScript after the user installs a new version.
const fingerprint = async (dir) => {
  const hash = createHash('sha256');
  const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.name === 'service-worker.js') continue;
    if (entry.isDirectory()) hash.update(await fingerprint(full));
    else hash.update(await readFile(full));
  }
  return hash.digest('hex');
};

const revision = (await fingerprint(dist)).slice(0, 12);
const swPath = join(dist, 'service-worker.js');
const sw = await readFile(swPath, 'utf8');
await writeFile(swPath, sw.replace(/const CACHE = '[^']*';/, `const CACHE = 'time-architect-${revision}';`), 'utf8');

const summary = await walk(dist);
console.log(`dist/ ready: ${summary.count} files, ${(summary.bytes / 1024).toFixed(0)} KiB, cache time-architect-${revision}`);
