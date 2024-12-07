const cacheName = "cmpm121pwa-v1";
const appShellFiles = [
    "./",
    "./index.html",
    "./src/main.js",
    "./src/Renderer.js",
    "./src/MeshManagers.js",
    "./src/languageSelector.js",
    "./src/models.js",
    "./src/plants.js",
    "./src/scenarios.js",
    "./src/translations.json",
    "./src/style.css",
    "./icon-192.png",
    "./icon-512.png"
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

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key === cacheName) return;
                    return caches.delete(key);
                }),
            );
        }),
    );
});