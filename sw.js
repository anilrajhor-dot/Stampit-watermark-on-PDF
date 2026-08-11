{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling1\cocoaplatform1{\fonttbl\f0\fmodern\fcharset0 Courier;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs24 \cf2 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 /* StampIt service worker \'97 offline caching */\
\
const CACHE_NAME = 'stampit-v2.2.1-cache-v1';\
\
const CORE_ASSETS = [\
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',\
  'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js',\
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',\
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',\
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',\
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'\
];\
\
self.addEventListener('install', event => \{\
  event.waitUntil(\
    caches.open(CACHE_NAME).then(cache =>\
      Promise.all(\
        CORE_ASSETS.map(url =>\
          fetch(url, \{ mode: 'no-cors' \})\
            .then(res => cache.put(url, res))\
            .catch(() => \{\})\
        )\
      )\
    ).then(() => self.skipWaiting())\
  );\
\});\
\
self.addEventListener('activate', event => \{\
  event.waitUntil(\
    caches.keys()\
      .then(names =>\
        Promise.all(\
          names\
            .filter(n => n !== CACHE_NAME)\
            .map(n => caches.delete(n))\
        )\
      )\
      .then(() => self.clients.claim())\
  );\
\});\
\
self.addEventListener('fetch', event => \{\
  const req = event.request;\
\
  if (req.method !== 'GET') return;\
\
  event.respondWith(\
    caches.match(req).then(cached => \{\
      if (cached) return cached;\
\
      return fetch(req)\
        .then(res => \{\
          const copy = res.clone();\
\
          caches.open(CACHE_NAME)\
            .then(cache => cache.put(req, copy))\
            .catch(() => \{\});\
\
          return res;\
        \})\
        .catch(() => cached);\
    \})\
  );\
\});\
}