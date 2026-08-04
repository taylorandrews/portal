// Sabbatical 2026 guide — offline app shell.
// Goal: the guide opens and shows the last-known plan even with no signal.
// Live data (/api/) and cross-origin APIs (weather, map tiles) always hit the
// network so nothing goes stale while online.
const CACHE = "sabbatical-v1";
const SHELL = [
  "./",
  "index.html",
  "leaflet.js",
  "leaflet.css",
  "manifest.webmanifest",
  "data/schedule.json",
  "data/route_segments.geojson",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Live portal API: never cache, never fall back — always current or fail.
  if (url.pathname.startsWith("/api/")) return;

  // Cross-origin (weather, map tiles): straight to network.
  if (url.origin !== self.location.origin) return;

  // Same-origin app shell: serve from cache fast, refresh in the background.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
