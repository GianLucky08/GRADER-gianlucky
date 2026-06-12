// Service Worker for Grader PWA
// Caches all assets for offline functionality

const CACHE_NAME = 'grader-v8';
const ASSETS_TO_CACHE = [
    '/GRADER-gianlucky/',
    '/GRADER-gianlucky/index.html',
    '/GRADER-gianlucky/style.css',
    '/GRADER-gianlucky/app.js',
    '/GRADER-gianlucky/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);
                        // Return a custom offline page or fallback
                        return new Response('Offline - No connection available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Handle background sync for future features
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Handle data synchronization here
            console.log('Background sync triggered')
        );
    }
});

// Handle push notifications for future features
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación de Grader',
        icon: 'https://via.placeholder.com/192/000000/FFFFFF?text=G',
        badge: 'https://via.placeholder.com/72/000000/FFFFFF?text=G'
    };
    
    event.waitUntil(
        self.registration.showNotification('Grader', options)
    );
});
