const CACHE_NAME = "signal-lost-game-v53";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./overview.html",
  "./design-lab.html",
  "./design-lab-option2.html",
  "./design-lab-option3.html",
  "./design-lab-option4.html",
  "./design-flow-setup.html",
  "./design-flow-roles.html",
  "./design-flow-control.html",
  "./game.css?v=45",
  "./design-lab.css?v=2",
  "./design-lab-option2.css?v=1",
  "./design-lab-option3.css?v=1",
  "./design-lab-option4.css?v=1",
  "./design-flow.css?v=3",
  "./overview.css?v=23",
  "./app.js?v=45",
  "./design-lab.js?v=3",
  "./design-lab-option4.js?v=1",
  "./design-flow.js?v=3",
  "./overview.js?v=23",
  "./TASK_QUEUE.md",
  "./SIGNAL_LOST_GAME_GUIDE.md",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html").then((cached) => cached || caches.match("./")))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});