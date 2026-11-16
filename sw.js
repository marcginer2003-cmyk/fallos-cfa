// Service worker: funciona sin conexión y se actualiza solo cuando hay internet
var CACHE = 'fallos-cfa-28460a162e';
var ASSETS = ['./', './index.html', './data.enc', './manifest.webmanifest', './katex/katex.min.css', './icons/apple-touch-icon.png', './icons/icon-192.png'];
self.addEventListener('message', function (e) { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('fallos-cfa-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    // Primero la red (versión más nueva); sin conexión, la copia guardada
    // no-cache: pregunta siempre al servidor si hay versión nueva (evita copias viejas de hasta 10 min)
    var stat = /\/(katex|icons)\//.test(req.url);
    var nreq = stat ? req : new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' });
    return fetch(nreq).then(function (res) {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(function () {
      return cache.match(req, { ignoreSearch: true });
    });
  }));
});
