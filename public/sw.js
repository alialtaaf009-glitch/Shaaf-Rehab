const CACHE_NAME = 'shaaf-aftercare-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app_logo.png',
  '/icon-144.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching Core App Shell');
      // Cache assets individually so that if one fails, it doesn't break the entire service worker install
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`[Service Worker] Failed to pre-cache asset: ${asset}`, err);
          });
        })
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Intercept Event (Network-First falling back to Cache, with runtime caching)
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS (ignore chrome-extension schemes etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If successful, clone and cache it dynamically
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed, lookup cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the index page fails to fetch and isn't cached (or SPA routes), serve fallback root
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
