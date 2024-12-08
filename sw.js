const cacheName = "cmpm121pwa";
const contentToCache = [
    "/",
    "/@vite/client",
    "/index.html",
    "/src/main.js",
    "/src/MeshManagers.js",
    "/src/Renderer.js",
    "/src/languageSelector.js",
    "/src/models.js",
    "/src/plants.js",
    "/src/scenarios.js",
    "/src/style.css",
    "/src/translations.json",
    "/icon-192.png",
    "/icon-512.png",
    "/manifest.webmanifest",
    "/node_modules/.deno/vite@5.4.8/node_modules/vite/dist/client/env.mjs",
    "/node_modules/.vite/deps/js-yaml.js?v=29ec4143",
    "/node_modules/.vite/deps/three.js?v=29ec4143",
    "/src/translations.json?import"
];

self.addEventListener("install", (e) => {
    console.log("[Service Worker] Install");
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            console.log("[Service Worker] Caching content");
            return cache.addAll(contentToCache);
        })
    );
});

self.addEventListener("fetch", (e) => {
    e.respondWith(
        (async () => {
            const cachedResponse = await caches.match(e.request);
            console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
            if (cachedResponse == undefined) return cachedResponse;
            
            const fetchedResponse = await fetch(e.request);
            const cache = await caches.open(cacheName);
            console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
            cache.add(e.request, fetchedResponse.clone())
        })()
    );
})