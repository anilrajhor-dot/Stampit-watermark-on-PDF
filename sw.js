// StampIt v2.3.17 — reliable offline shell + runtime caching.
// Keep this file beside index.html on the same GitHub Pages path.

const CACHE_NAME = 'stampit-v2.3.17-cache-v1';

const APP_SHELL = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(
      APP_SHELL.map(url =>
        cache.add(url).catch(() => undefined)
      )
    );

    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Never interfere with non-GET requests.
  if (request.method !== 'GET') return;

  // Page navigation: network first, cached version if offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);

        if (response && response.ok) {
          cache.put(request, response.clone()).catch(() => undefined);
        }

        return response;

      } catch (error) {

        return (
          await cache.match(request) ||
          await cache.match('./index.html') ||
          await cache.match('./') ||
          new Response(
            'StampIt is offline and its app shell has not been cached yet.',
            {
              status: 503,
              headers: {
                'Content-Type': 'text/plain; charset=utf-8'
              }
            }
          )
        );
      }
    })());

    return;
  }

  // Other GET requests: network first, then cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(request);

      if (
        response &&
        (response.ok || response.type === 'opaque')
      ) {
        cache.put(request, response.clone()).catch(() => undefined);
      }

      return response;

    } catch (error) {

      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      throw error;
    }
  })());
});