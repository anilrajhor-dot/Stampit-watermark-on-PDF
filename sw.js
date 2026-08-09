/* ==================================================================
   StampIt service worker — offline caching after first successful load
   ==================================================================
   This file must sit in the SAME FOLDER as index.html (e.g. both at
   your GitHub Pages repo root, or both inside the same subfolder). It
   is registered by index.html itself and is entirely optional: if you
   don't upload this file, StampIt still works exactly as before, it
   just needs an internet connection on every visit instead of only
   the first one.

   What this does:
   - On first visit (online), it caches the app's core libraries
     (pdf-lib, pdf.js, fontkit, JSZip) and the page itself.
   - On every later visit, cached files are served instantly and the
     network is only used to fetch anything not yet cached (like a
     newly-used Indian-language font).
   - Your documents are never touched by this file — it only caches
     the app's own code/libraries/fonts, never anything you upload.

   Bump CACHE_NAME below (e.g. 'stampit-v2-cache-v2') if you ever want
   to force everyone's cached copy to refresh.
   ================================================================== */

const CACHE_NAME = 'stampit-v2-cache-v1';

// Known library URLs, precached on install so the app can launch
// offline even before the person has triggered any of these paths.
const CORE_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache each asset independently so one failed fetch (e.g. a
      // flaky connection on first install) doesn't abort the rest.
      return Promise.all(CORE_ASSETS.map(url =>
        fetch(url, { mode: 'no-cors' })
          .then(res => cache.put(url, res))
          .catch(() => { /* will simply be fetched from network next time */ })
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Cache-first, falling back to network, and quietly caching whatever
// the network returns for next time. If both cache and network fail
// (fully offline and never-before-seen resource), the request just
// fails naturally rather than throwing something confusing.
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
