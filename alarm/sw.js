/*
 * Service worker: caches the app shell for offline use and focuses/opens
 * the app when a notification is tapped. It does NOT and cannot fire
 * alarms in the background — service workers are suspended by the browser
 * like any other background script, so alarm timing still depends on the
 * app being open. See the in-app "About alarm reliability" panel.
 */
const CACHE = 'wake-shell-v1';
const SHELL = ['./', './index.html', './styles.css', './logic.js', './storage.js', './i18n.js', './sounds.js', './challenges.js', './app.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
            return res;
        }).catch(() => cached))
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            for (const client of clients) if ('focus' in client) return client.focus();
            if (self.clients.openWindow) return self.clients.openWindow('./index.html');
        })
    );
});
