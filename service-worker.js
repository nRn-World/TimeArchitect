// Offline cache for Time Architect. The game shell is cached on install,
// so the campaign is playable with no network at all.
const CACHE = 'time-architect-v1.1.0';

const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-180.png',
  'assets/brand/nrnworld-logo.webp',
  'assets/flags/gb.svg',
  'assets/flags/se.svg',
  'assets/flags/tr.svg',
  'assets/flags/es.svg',
  'assets/flags/sa.svg',
  'assets/flags/fr.svg',
  'assets/flags/jp.svg',
  'src/main.js',
  'src/game.js',
  'src/core/audio.js',
  'src/core/i18n.js',
  'src/core/input.js',
  'src/core/level.js',
  'src/core/math.js',
  'src/core/save.js',
  'src/core/sim.js',
  'src/core/solver.js',
  'src/data/levels.js',
  'src/data/locales/en.js',
  'src/data/locales/sv.js',
  'src/data/locales/tr.js',
  'src/data/locales/es.js',
  'src/data/locales/ar.js',
  'src/data/locales/fr.js',
  'src/data/locales/ja.js',
  'src/render/scene.js',
  'src/ui/screens.js',
  'src/ui/icons.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('index.html', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('index.html').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  // Network-first: a freshly installed app never boots on the previous
  // release's cached JavaScript. Offline, the precache answers instead.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('index.html')))
  );
});
