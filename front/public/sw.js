const VERSION = 'travseeker-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('travseeker-') && key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put('/', copy)); return response; }).catch(() => caches.match('/')));
    return;
  }
  const url = new URL(event.request.url);
  const isAsset = url.origin === self.location.origin && /\.(?:js|css|png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname);
  const isDestinationApi = url.pathname.startsWith('/api/destinos/') && !url.pathname.includes('/reviews');
  if (isAsset || isDestinationApi) event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { if (response.ok) caches.open(VERSION).then((cache) => cache.put(event.request, response.clone())); return response; })));
});
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_DESTINATION') return;
  event.waitUntil(caches.open(VERSION).then(async (cache) => {
    const results = await Promise.allSettled(event.data.urls.map(async (url) => { const response = await fetch(url); if (response.ok) await cache.put(url, response); }));
    const ok = results.some((result) => result.status === 'fulfilled');
    event.ports[0]?.postMessage({ ok });
  }));
});
