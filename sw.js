const CACHE_NAME = 'family-travel-v1';

// Files to cache for offline use
const urlsToCache = [
  'family-travel-integrated.html',
  'manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static assets, network-first for Apps Script API
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always go to network for the Google Apps Script API (live data)
  if (url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ ok: false, error: 'You are offline. Trip data unavailable.' }),
          { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Cache-first for everything else (HTML, fonts, manifest)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('family-travel-integrated.html'))
  );
});
