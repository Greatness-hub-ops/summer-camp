/* Summer Camp Rally tracker service worker: caches the app shell so it opens instantly and works offline.
   Data is never cached here; the page keeps its own copy of the last loaded data. */
var VERSION = 'camp-shell-v7';
var SHELL = ["./", "./index.html", "./config.js", "./manifest.json", "./patch.png", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./fonts/accent-italic.woff2", "./fonts/display-700.woff2", "./fonts/display-800.woff2", "./fonts/text-400.woff2", "./fonts/text-500.woff2", "./fonts/text-600.woff2", "./fonts/text-700.woff2"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;                               // writes always go to the network
  if (url.hostname.indexOf('script.google') >= 0 || url.hostname.indexOf('googleusercontent') >= 0) return;  // live data
  if (url.hostname.indexOf('fonts.g') >= 0) {                           // fonts: cache, then update in the background
    e.respondWith(caches.open('camp-fonts').then(function (c) {
      return c.match(e.request).then(function (hit) {
        var net = fetch(e.request).then(function (res) { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  if (url.origin === location.origin) {                                 // app shell: serve from cache at once, refresh it in the background
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request).then(function (res) { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(function () { return hit || c.match('./index.html'); });
        return hit || net;
      });
    }));
  }
});
