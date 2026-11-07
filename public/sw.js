const CACHE_VERSION = 'v1';
const CACHE_NAME = `manpro-core-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `manpro-static-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon.svg',
    '/favicon.ico',
];

// Install: precache offline fallback and essential shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean up outdated caches and claim existing clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME && name !== STATIC_CACHE_NAME) {
                        return caches.delete(name);
                    }
                    return null;
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only process GET requests from same origin or trusted static CDNs
    if (request.method !== 'GET') {
        return;
    }

    // Never intercept auth, CSRF, PDF export, or streaming endpoints
    if (
        url.pathname.endsWith('/export-pdf') ||
        url.pathname.endsWith('/pdf-preview') ||
        url.pathname.startsWith('/sanctum')
    ) {
        return;
    }

    // 1. Navigation (HTML pages) -> Network first with offline fallback
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .catch(async () => {
                    const cache = await caches.open(CACHE_NAME);
                    const cachedOffline = await cache.match(OFFLINE_URL);
                    return cachedOffline || new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain' },
                    });
                })
        );
        return;
    }

    // 2. Inertia JSON requests -> Network first (avoid stale session or stale state)
    if (request.headers.get('X-Inertia') === 'true') {
        event.respondWith(fetch(request));
        return;
    }

    // 3. Static assets: Vite bundle, fonts, icons -> Stale While Revalidate
    const isStaticAsset =
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.match(/\.(woff2?|ttf|eot|png|jpe?g|webp|svg|ico|css|js)$/i);

    if (isStaticAsset) {
        event.respondWith(
            caches.open(STATIC_CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(request);
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
    }
});
