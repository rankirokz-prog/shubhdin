const CACHE_NAME = 'shubhdin-v151';

// Core app files to cache immediately on install
const CORE_FILES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/astrology.html',
  '/kundli.html',
  '/premium.html',
  '/reports.html',
  '/report-catalog.js',
  /* today's verse — cached so the morning card is there on a weak
     connection, which is exactly when people open a devotional app */
  '/daily-gita.js',
  // The astrology engine. astrology.html loads these directly and dashboard.html
  // now lazy-loads them to compute the birth rashi on device. Without them in
  // the cache the offline fallback would 404 and the rashi would go missing —
  // which is the exact failure this local-first change was made to remove.
  '/astronomy.min.js',
  '/panchang-engine.js',
  '/birthdate-guard.js',
  '/nav-history.js',
  /* Localisation. These were fetched from the network on every load and were
     absent offline — on a devotional app that is opened first thing in the
     morning, often on a weak connection, that is the difference between a
     Telugu screen and a screen of humanised keys. */
  '/app-strings-loader.js',
  '/app-strings-hi.js',
  '/app-strings-en.js',
  '/ui-strings.js',
  '/panchang-terms.js',
  '/panchang-terms-bridge.js',
  '/vrat-names.js',
  '/app-langs.js',
  '/font-loader.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install — cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    /* addAll() is all-or-nothing: one 404 rejects the whole install and the
       app silently loses its entire offline cache. Cache each file on its own
       and NAME the ones that failed, so a file that never made it onto the
       server announces itself instead of being inferred from a screenshot
       three days later. */
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(CORE_FILES.map(f =>
        cache.add(f).catch(err => {
          console.error('[shubhdin sw] could not cache ' + f + ' — is it on the server?');
          return null;
        })
      ))
    )
  );
  self.skipWaiting();
});

/* The chosen language file is named at runtime (app-strings-te.js and so on),
   so it cannot sit in CORE_FILES. Cache it the first time it is fetched. */
self.addEventListener('fetch', event => {
  const u = event.request.url;
  if (/\/app-strings-[a-z]{2}\.js$/.test(u)) {
    event.respondWith(
      caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy)).catch(() => {});
        return res;
      }))
    );
  }
}, { capture: true });

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
