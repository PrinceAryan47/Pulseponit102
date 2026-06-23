/**
 * PulsePoint Advanced Service Worker
 * Implements an advanced offline caching strategy (Stale-While-Revalidate, Navigation Fallback, Precaching)
 * to ensure that the entire application, static resources, and client-side routes are fully accessible offline.
 */

const CACHE_NAME = 'pulsepoint-sw-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json'
];

// 1. Install Event: Pre-cache the main application shells and assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing & caching app shell assets');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Claim clients and delete old cache scopes
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating & cleaning up old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting obsolete cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: check if request is a static asset we want to cache
function isStaticAsset(url, request) {
  const urlObj = new URL(url);
  
  // Skip browser extensions, chrome-extension, firestore calls, auth, or third party APIs
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return false;
  if (urlObj.hostname.includes('firestore.googleapis.com')) return false;
  if (urlObj.hostname.includes('identitytoolkit.googleapis.com')) return false;
  if (urlObj.hostname.includes('firebase')) return false;
  if (urlObj.pathname.startsWith('/api/')) return false;

  // Intercept self-hosted files, assets, bundle files, images, icons, manifest
  const path = urlObj.pathname;
  return (
    urlObj.origin === self.location.origin ||
    path.includes('/assets/') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path.endsWith('.json') ||
    urlObj.hostname.includes('fonts.googleapis.com') ||
    urlObj.hostname.includes('fonts.gstatic.com')
  );
}

// 3. Fetch Event: Catch requests, handle offline navigation fallbacks, and update assets dynamically
self.addEventListener('fetch', event => {
  // We only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = event.request.url;

  // 3a. Handle Navigation Requests (Client-side Page Route Navigation e.g., /hospitals, /doctors)
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Dynamically cache a copy of successfully loaded HTML pages
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Navigation failed or offline. Serving cached index.html...');
          
          // Broadcast offline event to all clients
          broadcastOffline();

          // Fallback to caching container's primary template / index.html
          return caches.match('/index.html')
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/');
            });
        })
    );
    return;
  }

  // 3b. Serve Static Assets and UI bundles with Stale-While-Revalidate caching strategy
  if (isStaticAsset(requestUrl, event.request)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Prepare network fetch promise to refresh cache in background
        const networkFetch = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(err => {
            console.log(`[Service Worker] Background fetch failed for ${requestUrl}:`, err);
            broadcastOffline();
            // Return cached response if it exists, otherwise pass error down
            if (cachedResponse) return cachedResponse;
            throw err;
          });

        // Return cached resource immediately if hit, otherwise wait on the network
        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // 3c. Default behavior: Network-first
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(error => {
        broadcastOffline();
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        });
      })
  );
});

// Broadcast offline network status to all linked Web Client interfaces
function broadcastOffline() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: false
      });
    });
  });
}

// Support status polling check and sync messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_STATUS') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NETWORK_STATUS',
          online: navigator.onLine
        });
      });
    });
  }
});
