const CACHE_NAME = 'pulsepoint-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // We only intercept GET requests for general app assets
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If the fetch is successful, we know the user is connected
        return response;
      })
      .catch(error => {
        // Network is down, let's broadcast offline state to all tabs
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NETWORK_STATUS',
              online: false
            });
          });
        });

        // Serve from cache if found
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        });
      })
  );
});

// Support status polling check from clients
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
