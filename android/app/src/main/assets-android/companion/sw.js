/* Shore Companion: keeps the page shell for offline start. API calls always go to the TV. */
var SHELL = 'shore-companion-v1', FILES = ['/', '/app.css', '/app.js', '/manifest.webmanifest', '/icon-192.png', '/manrope.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== SHELL; }).map(function (k) { return caches.delete(k); })); })); });
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.indexOf('/api/') === 0) return;
  e.respondWith(fetch(e.request).then(function (r) { var copy = r.clone(); caches.open(SHELL).then(function (c) { c.put(e.request, copy); }); return r; })
    .catch(function () { return caches.match(e.request); }));
});
