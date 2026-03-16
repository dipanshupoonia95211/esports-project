// ============================================================
//  E-SPORTS MANAGER — SERVICE WORKER
//  Enables PWA install + offline support
// ============================================================

const CACHE_NAME    = 'esports-mgr-v1';
const OFFLINE_PAGE  = '/index.html';

// Files to cache for offline use
const CACHE_FILES = [
    '/',
    '/index.html',
    '/players.html',
    '/teams.html',
    '/tournaments.html',
    '/matches.html',
    '/leaderboard.html',
    '/position.html',
    '/admin-login.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// ── INSTALL: cache all files ─────────────────────────────
self.addEventListener('install', event => {
    console.log('[SW] Installing…');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching files');
            return cache.addAll(CACHE_FILES);
        }).then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: clean old caches ───────────────────────────
self.addEventListener('activate', event => {
    console.log('[SW] Activating…');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: serve from cache, fallback to network ─────────
self.addEventListener('fetch', event => {
    // Skip API calls — always fetch live
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('/admin/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // Cache new pages dynamically
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(OFFLINE_PAGE));
        })
    );
});