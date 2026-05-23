// Service Worker for XAUUSD Trading Journal PWA
// This enables offline functionality

const CACHE_NAME = 'xauusd-journal-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      return fetch(event.request).then((networkResponse) => {
        // Don't cache non-GET requests or API calls
        if (
          event.request.method !== 'GET' ||
          event.request.url.includes('api') ||
          event.request.url.includes('localhost:')
        ) {
          return networkResponse;
        }

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Fallback for offline - return cached index.html for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Background sync for offline data (optional enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-trades') {
    // Could sync trades to a server when back online
    console.log('Syncing trades...');
  }
});

// Push notifications (optional enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/gold-icon.svg',
      badge: '/gold-icon.svg'
    });
  }
});
