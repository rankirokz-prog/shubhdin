const CACHE_NAME = 'shubhdin-v13';

// Core app files to cache immediately on install
const CORE_FILES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install — cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES))
  );
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML pages → NETWORK FIRST (always fresh code, cache only as offline fallback)
// - API / audio → Network only
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const req = event.request;

  // Never cache API or audio requests
  if (url.includes('/api/') || url.includes('supabase.co') || url.includes('fonts.googleapis.com')) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 503 })));
    return;
  }

  // HTML documents → network first (so updates always show)
  const isHTML = req.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/');
  if (isHTML) {
    event.respondWith(
      fetch(req).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // Other assets (icons etc.) → cache first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response.ok && req.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      });
    })
  );
});
