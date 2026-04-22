const CACHE_NAME = 'senior-shield-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network (Network-first strategy for dynamic data, cache fallback)
      return fetch(event.request).catch(() => response);
    })
  );
});
