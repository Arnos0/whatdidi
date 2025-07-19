// Service Worker for WhatDidiShop
// Provides offline functionality and asset caching

const CACHE_NAME = 'whatdidi-v1'
const STATIC_CACHE_NAME = 'whatdidi-static-v1'
const DYNAMIC_CACHE_NAME = 'whatdidi-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/orders',
  '/settings',
  '/manifest.json',
  '/images/retailers/bol.svg',
  '/images/retailers/coolblue.svg',
  '/images/retailers/amazon.svg',
  '/images/retailers/zalando.svg',
  '/images/retailers/mediamarkt.svg',
  '/images/retailers/albert-heijn.svg',
  '/images/retailers/hema.svg',
  '/images/retailers/decathlon.svg',
  '/images/retailers/asos.svg',
  '/images/retailers/wehkamp.svg'
]

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/',
  '/dashboard',
  '/orders',
  '/settings'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installed successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Skip API requests for real-time data
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(event)
  }
  
  // Handle static assets and pages
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update in background
          updateCache(request)
          return cachedResponse
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache error responses
            if (!response.ok) {
              return response
            }
            
            // Clone response for caching
            const responseClone = response.clone()
            
            // Cache dynamic content
            if (shouldCache(request)) {
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone)
                })
            }
            
            return response
          })
          .catch(() => {
            // Network failed, try to serve offline page
            return handleOfflineRequest(request)
          })
      })
  )
})

// Handle API requests with cache-first strategy for some endpoints
function handleApiRequest(event) {
  const { request } = event
  const url = new URL(request.url)
  
  // Cache-first for dashboard stats (can be stale)
  if (url.pathname.includes('/dashboard/stats')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Update in background
            fetch(request)
              .then(response => {
                if (response.ok) {
                  const responseClone = response.clone()
                  caches.open(DYNAMIC_CACHE_NAME)
                    .then(cache => cache.put(request, responseClone))
                }
              })
              .catch(() => {})
            
            return cachedResponse
          }
          
          // Not cached, fetch and cache
          return fetch(request)
            .then(response => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(DYNAMIC_CACHE_NAME)
                  .then(cache => cache.put(request, responseClone))
              }
              return response
            })
        })
    )
  }
}

// Update cache in background
function updateCache(request) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        const responseClone = response.clone()
        caches.open(DYNAMIC_CACHE_NAME)
          .then(cache => {
            cache.put(request, responseClone)
          })
      }
    })
    .catch(() => {
      // Ignore network errors during background updates
    })
}

// Determine if request should be cached
function shouldCache(request) {
  const url = new URL(request.url)
  
  // Cache static assets
  if (request.destination === 'image' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font') {
    return true
  }
  
  // Cache page requests
  if (request.destination === 'document') {
    return true
  }
  
  // Cache Next.js chunks
  if (url.pathname.includes('/_next/')) {
    return true
  }
  
  return false
}

// Handle offline requests
function handleOfflineRequest(request) {
  if (request.destination === 'document') {
    // Try to serve cached page or fallback
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // Check if we have this specific route cached
    return caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        // Try to serve the main app shell for SPA routes
        if (OFFLINE_ROUTES.some(route => pathname.startsWith(route))) {
          return caches.match('/')
        }
        
        // Return basic offline page
        return new Response(
          `<!DOCTYPE html>
           <html>
           <head>
             <title>Offline - WhatDidiShop</title>
             <meta charset="utf-8">
             <meta name="viewport" content="width=device-width, initial-scale=1">
             <style>
               body { 
                 font-family: system-ui, sans-serif; 
                 text-align: center; 
                 padding: 2rem;
                 background: #f8fafc;
               }
               .container {
                 max-width: 400px;
                 margin: 4rem auto;
                 padding: 2rem;
                 background: white;
                 border-radius: 8px;
                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);
               }
               h1 { color: #4f46e5; margin-bottom: 1rem; }
               p { color: #6b7280; line-height: 1.5; }
               button {
                 background: #4f46e5;
                 color: white;
                 border: none;
                 padding: 0.75rem 1.5rem;
                 border-radius: 6px;
                 cursor: pointer;
                 margin-top: 1rem;
               }
             </style>
           </head>
           <body>
             <div class="container">
               <h1>You're Offline</h1>
               <p>WhatDidiShop is currently unavailable. Please check your internet connection and try again.</p>
               <button onclick="window.location.reload()">Try Again</button>
             </div>
           </body>
           </html>`,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        )
      })
  }
  
  // For other requests, return a network error
  return new Response('Offline', { status: 503 })
}

// Background sync for queued actions
self.addEventListener('sync', event => {
  if (event.tag === 'retry-failed-requests') {
    event.waitUntil(retryFailedRequests())
  }
})

// Retry failed requests when back online
async function retryFailedRequests() {
  console.log('Service Worker: Retrying failed requests...')
  
  // This would integrate with your retry queue implementation
  // For now, just log that we're back online
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'BACK_ONLINE'
      })
    })
  })
}

// Push notification handling (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: data.tag || 'default'
      })
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  event.waitUntil(
    self.clients.openWindow('/')
  )
})