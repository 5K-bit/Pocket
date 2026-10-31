'use strict';
// Increment the version when changing the offline shell or cache behavior.
const CACHE = 'obeos-pocket-shell-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('obeos-pocket-shell-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

// Prefer newest deployed assets, but keep the launchpad usable while offline.
// This cache never stores links on other domains, requests with non-GET methods,
// or failed responses. A failed navigation falls back to the locally cached shell.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(request);
      if (fresh.ok && fresh.type === 'basic') await cache.put(request, fresh.clone());
      return fresh;
    } catch {
      return await cache.match(request) || (request.mode === 'navigate' ? await cache.match('./index.html') : undefined) || Response.error();
    }
  })());
});
