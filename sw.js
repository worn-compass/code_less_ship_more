const CACHE_NAME = 'cursor-guide-v1';

const ASSETS = [
  './cursor-guide.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-167.png',
  './icon-152.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Lora:ital,wght@0,400;1,400&display=swap'
];

// Install: cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets reliably; Google Fonts may fail offline — that's ok
      return cache.addAll([
        './cursor-guide.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
        './icon-180.png',
        './icon-167.png',
        './icon-152.png'
      ]).then(() => {
        // Best-effort cache Google Fonts
        return cache.addAll([
          'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Lora:ital,wght@0,400;1,400&display=swap'
        ]).catch(() => {});
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local assets, network-first for fonts
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cache-first strategy for same-origin and font requests
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses for future offline use
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If network fails and nothing cached, return the main HTML as fallback
        if (event.request.destination === 'document') {
          return caches.match('./cursor-guide.html');
        }
      });
    })
  );
});
