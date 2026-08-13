// StampIt v2.3.20
const CACHE_NAME = 'stampit-v2.3.20-cache-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      APP_SHELL.map(url =>
        cache.add(url).catch(() => undefined)
      )
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);

      if (
        response &&
        (response.ok || response.type === 'opaque')
      ) {
        const copy = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, copy))
          .catch(() => undefined);
      }

      return response;

    } catch (err) {
      const cached = await caches.match(event.request);

      return cached || caches.match('./index.html');
    }
  })());
});