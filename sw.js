const CACHE = "prad-en-v1-gh-power-v3";
const PRECACHE = ["/power/", "/power/favicon.svg", "/power/apple-touch-icon.png", "/power/icon-192.png", "/power/icon-512.png", "/power/qr.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/power/api/") || url.pathname.startsWith("/power/__grok/")) return;

  if (url.pathname.startsWith("/power/game/") || url.pathname.startsWith("/power/icon") || url.pathname.startsWith("/power/splash") || url.pathname === "/power/favicon.svg" || url.pathname === "/power/apple-touch-icon.png") {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.mode !== "navigate") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/power/"))),
  );
});
