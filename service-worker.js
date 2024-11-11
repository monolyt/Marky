const CACHE_NAME = "marky-cache-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/assets/styles.css",
    "/assets/script.js",
    "/bookmarks.json",
    "/assets/android-chrome-192x192.png",
    "/assets/android-chrome-512x512.png",
    "/assets/favicon.ico",
    "/manifest.json"
];

// Install service worker and cache files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch from cache if available
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// Activate service worker and clean old caches
self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(keyList =>
            Promise.all(keyList.map(key => {
                if (!cacheWhitelist.includes(key)) {
                    return caches.delete(key);
                }
            }))
        )
    );
});
