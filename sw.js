/**
 * Signal Lost v2 — Service Worker
 * Caches core game assets for offline play.
 */

'use strict';

const CACHE_NAME = 'signal-lost-v2-cache-v3'; // bumped for failsafe
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles-v2.css',
  '/game-v2.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Log but don't fail install if some assets are missing during dev
        console.warn('[SW] Cache addAll warning:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache, fall back to network, then cache new requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (e.g., Leaflet CDN, map tiles, WebSocket)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // For same-origin only — map tiles and CDN assets are online-only
    return;
  }

  event.respondWith(
    // Network-first for HTML: always try fresh, fall back to cache
    fetch(request)
      .then((networkResponse) => {
        // Don't cache opaque responses or errors
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        // Clone and cache the response
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // Network failed — fall back to cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // If nothing in cache either, return offline fallback
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return undefined;
        });
      })
  );
});
