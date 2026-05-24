// Service Worker for XAUUSD Trading Journal PWA
// Increment version to force update: v2 -> v3 -> etc.

const CACHE_NAME = "xauusd-journal-v3";

// Core files that must be cached (these don't have hashes)
const CORE_ASSETS = ["/", "/index.html", "/manifest.json", "/gold-icon.svg"];

// Install event - cache core assets, discover dynamic assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache core static files
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // Force activation
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that isn't the current one
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - network-first strategy for assets, cache-first for core
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip API calls
  if (url.pathname.includes("api") || url.host.includes("localhost")) {
    return;
  }

  // For assets (JS/CSS with hashes), use stale-while-revalidate
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached version immediately if available
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              // Update cache with fresh version
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed - cached version already returned
            return null;
          });

        // Return cached or wait for network
        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // For core files (index.html, etc), use network-first
  if (CORE_ASSETS.includes(url.pathname) || url.pathname === "/") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Update cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // Last resort - cached index.html
            if (event.request.mode === "navigate") {
              return caches.match("/");
            }
          });
        }),
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    }),
  );
});

// Background sync for offline data (optional enhancement)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-trades") {
    // Could sync trades to a server when back online
    console.log("Syncing trades...");
  }
});

// Push notifications (optional enhancement)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/gold-icon.svg",
      badge: "/gold-icon.svg",
    });
  }
});
