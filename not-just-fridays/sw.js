/* Not Just Fridays service worker: keeps the game available offline once it has been opened. */
var VERSION = 'njf-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('njf-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var fonts = url.hostname.indexOf('fonts.g') >= 0;
  var mine = url.origin === location.origin && url.pathname.indexOf('/not-just-fridays/') >= 0;
  if (!fonts && !mine) return;
  var name = fonts ? 'njf-fonts' : VERSION;
  e.respondWith(caches.open(name).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; })
        .catch(function () { return hit || c.match('./index.html'); });
      return hit || net;
    });
  }));
});
