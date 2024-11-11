const CACHE_NAME = "marky-cache-v1";
const BASE_URL = "/Marky"; // Base URL for your hosted app
const urlsToCache = [
    `${BASE_URL}/`,
    `${BASE_URL}/index.html`,
    `${BASE_URL}/assets/styles.css`,
    `${BASE_URL}/assets/script.js`,
    `${BASE_URL}/bookmarks.json`,
    `${BASE_URL}/assets/android-chrome-192x192.png`,
    `${BASE_URL}/assets/android-chrome-512x512.png`,
    `${BASE_URL}/assets/favicon.ico`,
    `${BASE_URL}/manifest.json`
];

// Install event - caching resources
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell and content');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Optional: activate SW immediately
    );
});

// Fetch event - serving cached resources when offline
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return; // Ignore non-GET requests

    console.log(`[Service Worker] Fetching: ${event.request.url}`);
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;

                return fetch(event.request)
                    .then(networkResponse => {
                        if (!networkResponse || !networkResponse.ok) {
                            return networkResponse; // Skip caching failed responses
                        }

                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match(`${BASE_URL}/index.html`); // Offline fallback
                        }
                    });
            })
    );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (!cacheWhitelist.includes(key)) {
                    console.log(`[Service Worker] Deleting old cache: ${key}`);
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});
