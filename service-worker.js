const cacheName = "cmpm121pwa-v1";
const appShellFiles = [
    "/project",
    "/project/index.html",
    "/project/src/main.js",
    "/project/src/Renderer.js",
    "/project/src/MeshManagers.js",
    "/project/src/languageSelector.js",
    "/project/src/models.js",
    "/project/src/plants.js",
    "/project/src/scenarios.js",
    "/project/src/translations.json",
    "/project/src/style.css",
    "/project/public/icon-192.png",
    "/project/public/icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log("opened cache");
            return cache.addAll(appShellFiles);
        })
    );
})

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
})

