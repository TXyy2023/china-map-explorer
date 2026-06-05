const IMAGE_CACHE_NAME = 'china-map-explorer-image-cache-v1';
const OLD_IMAGE_CACHE_PREFIX = 'china-map-explorer-image-cache-';
const IMAGE_ASSET_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(OLD_IMAGE_CACHE_PREFIX) && key !== IMAGE_CACHE_NAME)
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !IMAGE_ASSET_RE.test(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
