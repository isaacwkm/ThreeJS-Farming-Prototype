const cacheName = "cmpm121pwa-v1";
const appShellFiles = [
    "/cmpm-121-final-threejs",
    "/cmpm-121-final-threejs/index.html",
    "/cmpm-121-final-threejs/src/main.js",
    "/cmpm-121-final-threejs/src/Renderer.js",
    "/cmpm-121-final-threejs/src/MeshManagers.js",
    "/cmpm-121-final-threejs/languageSelector.js",
    "/cmpm-121-final-threejs/src/models.js",
    "/cmpm-121-final-threejs/src/plants.js",
    "/cmpm-121-final-threejs/src/scenarios.js",
    "/cmpm-121-final-threejs/src/translations.json",
    "/cmpm-121-final-threejs/src/style.css",
    "/cmpm-121-final-threejs/public/icon-192.png",
    "/cmpm-121-final-threejs/public/icon-512.png"
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

