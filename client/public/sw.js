const CACHE_NAME = 'eduproctor-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  // In a real production app, Vite's build process or Workbox would inject the hashed asset URLs here.
  // For this MVP, we cache the root so it's accessible offline if refreshed.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  // Ignore API requests
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Optionally cache new successful responses here
        return networkResponse;
      }).catch(() => {
        // If offline and trying to navigate to a page, serve the index.html fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
