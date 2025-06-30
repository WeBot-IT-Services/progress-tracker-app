// Service Worker for Progress Tracker App
// Provides seamless background updates without visible page refreshes

// Version-based cache names for seamless updates
const VERSION = '3.13.0';
const CACHE_NAME = `progress-tracker-v${VERSION}`;
const STATIC_CACHE_NAME = `progress-tracker-static-v${VERSION}`;
const DYNAMIC_CACHE_NAME = `progress-tracker-dynamic-v${VERSION}`;

// Update state management
let updateInProgress = false;
let newCachesReady = false;

// Files to cache immediately for comprehensive offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico',
  // Core application routes for offline access
  '/dashboard',
  '/sales',
  '/design',
  '/production',
  '/installation',
  '/tracker',
  '/complaints',
  '/settings',
  '/admin'
];

// Additional resources to cache for full offline functionality
const CACHE_PATTERNS = [
  // Static assets
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
  // API endpoints for offline data
  /\/api\//,
  // Firebase SDK files
  /firebase/,
  // React and other vendor libraries
  /react|lucide|heroicons/
];

// Install event - prepare new version in background
self.addEventListener('install', (event) => {
  console.log(`Service Worker: Installing version ${VERSION} in background...`);

  event.waitUntil(
    (async () => {
      try {
        updateInProgress = true;

        // Cache new static files in background for comprehensive offline functionality
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        console.log('Service Worker: Caching static files for offline access');
        await staticCache.addAll(STATIC_FILES);
        console.log('Service Worker: Static files cached for offline functionality');

        // Initialize dynamic cache for runtime caching
        await caches.open(DYNAMIC_CACHE_NAME);
        console.log('Service Worker: Dynamic cache initialized');

        newCachesReady = true;

        // Notify clients that update is ready (but don't force refresh)
        await notifyClientsOfBackgroundUpdate();

        // Skip waiting to activate immediately but don't force refresh
        await self.skipWaiting();

      } catch (error) {
        console.error('Service Worker: Error during installation', error);
        updateInProgress = false;
      }
    })()
  );
});

// Activate event - seamlessly take control without forcing refresh
self.addEventListener('activate', (event) => {
  console.log(`Service Worker: Activating version ${VERSION} seamlessly...`);

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches in background
        await clearAllOldCaches();

        // Take control of all clients seamlessly
        await self.clients.claim();

        // Notify clients that new version is active (no refresh needed)
        await notifyClientsOfSeamlessUpdate();

        updateInProgress = false;
        console.log(`Service Worker: Seamlessly activated version ${VERSION}`);
      } catch (error) {
        console.error('Service Worker: Error during activation', error);
        updateInProgress = false;
      }
    })()
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Firebase requests (let them go to network)
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return;
  }

  // Skip TypeScript files and Vite HMR requests (let Vite handle them)
  if (url.pathname.includes('.ts') ||
      url.pathname.includes('.tsx') ||
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@fs/') ||
      url.searchParams.has('t')) {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

// Handle fetch requests with comprehensive offline-first strategy
async function handleFetch(request) {

  try {
    // Strategy 1: Cache First (for static assets and app shell)
    if (isStaticAsset(request) || isAppShell(request)) {
      return await cacheFirst(request);
    }

    // Strategy 2: Network First with offline fallback (for API calls)
    if (isApiRequest(request)) {
      return await networkFirstWithFallback(request);
    }

    // Strategy 3: Stale While Revalidate (for dynamic content)
    if (isDynamicContent(request)) {
      return await staleWhileRevalidate(request);
    }

    // Strategy 4: Cache First for navigation requests (offline-first)
    if (request.mode === 'navigate') {
      return await navigationCacheFirst(request);
    }

    // Default: Network first with cache fallback
    return await networkFirstWithFallback(request);

  } catch (error) {
    console.error('Service Worker: Fetch error', error);

    // Comprehensive offline fallback
    return await getOfflineFallback(request);
  }
}

// Seamless Cache First strategy - serves new content when available
async function seamlessCacheFirst(request) {
  // Try new cache first if update is ready
  if (newCachesReady) {
    const newCachedResponse = await caches.match(request, { cacheName: STATIC_CACHE_NAME });
    if (newCachedResponse) {
      return newCachedResponse;
    }
  }

  // Fall back to any cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch from network and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Seamless Stale While Revalidate strategy
async function seamlessStaleWhileRevalidate(request) {
  // Try new cache first if update is ready
  let cachedResponse;
  if (newCachesReady) {
    cachedResponse = await caches.match(request, { cacheName: DYNAMIC_CACHE_NAME });
  }

  // Fall back to any cached version
  if (!cachedResponse) {
    cachedResponse = await caches.match(request);
  }

  // Always try to update in background
  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        try {
          const responseToCache = networkResponse.clone();
          const cache = await caches.open(DYNAMIC_CACHE_NAME);
          await cache.put(request, responseToCache);
        } catch (error) {
          console.warn('Service Worker: Failed to cache response', error);
        }
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached version immediately, update in background
  return cachedResponse || await networkResponsePromise;
}

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for API
function isApiRequest(request) {
  const url = new URL(request.url);
  
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('firebase') ||
         url.hostname.includes('googleapis');
}

// Check if request is for dynamic content
function isDynamicContent(request) {
  const url = new URL(request.url);
  
  return url.pathname.includes('/data/') || 
         url.searchParams.has('timestamp') ||
         request.headers.get('cache-control') === 'no-cache';
}

// Get offline fallback page
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match('/index.html');
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Create a basic offline page if index.html is not cached
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Progress Tracker - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container {
          max-width: 400px;
          padding: 2rem;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
        }
        p {
          margin: 0 0 2rem 0;
          opacity: 0.9;
        }
        button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>Progress Tracker is working offline. Your data is safe and will sync when you're back online.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

// Enhanced background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  } else if (event.tag === 'retry-failed-sync') {
    event.waitUntil(retryFailedSync());
  } else if (event.tag === 'conflict-resolution') {
    event.waitUntil(processConflictResolution());
  }
});

// Enhanced background sync with detailed status
async function doBackgroundSync() {
  try {
    console.log('Service Worker: Starting background sync');

    // Notify clients that sync is starting
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_START',
        payload: {
          action: 'sync',
          timestamp: Date.now()
        }
      });
    });

    // Perform the actual sync (this would typically involve IndexedDB operations)
    await performOfflineSync();

    // Notify clients that sync completed
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        payload: {
          action: 'sync_completed',
          timestamp: Date.now()
        }
      });
    });

    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);

    // Notify clients of sync failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_FAILED',
        payload: {
          action: 'sync_failed',
          error: error.message,
          timestamp: Date.now()
        }
      });
    });
  }
}

// Retry failed sync operations
async function retryFailedSync() {
  try {
    console.log('Service Worker: Retrying failed sync operations');

    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'RETRY_FAILED_SYNC',
        payload: {
          action: 'retry_failed',
          timestamp: Date.now()
        }
      });
    });
  } catch (error) {
    console.error('Service Worker: Retry failed sync error', error);
  }
}

// Process conflict resolution
async function processConflictResolution() {
  try {
    console.log('Service Worker: Processing conflict resolution');

    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PROCESS_CONFLICTS',
        payload: {
          action: 'process_conflicts',
          timestamp: Date.now()
        }
      });
    });
  } catch (error) {
    console.error('Service Worker: Conflict resolution error', error);
  }
}

// Perform offline sync operations
async function performOfflineSync() {
  // This function would typically:
  // 1. Open IndexedDB
  // 2. Get pending sync operations
  // 3. Attempt to sync with server
  // 4. Handle conflicts
  // 5. Update sync status

  // For now, we'll delegate to the main thread
  console.log('Service Worker: Delegating sync to main thread');
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    await cache.addAll(urls);
    console.log('Service Worker: URLs cached', urls);
  } catch (error) {
    console.error('Service Worker: Error caching URLs', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName || DYNAMIC_CACHE_NAME);
    console.log('Service Worker: Cache cleared', cacheName);
  } catch (error) {
    console.error('Service Worker: Error clearing cache', error);
  }
}

// Enhanced cache management functions
async function clearAllOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, CACHE_NAME];

    const oldCaches = cacheNames.filter(name =>
      !currentCaches.includes(name) &&
      (name.includes('progress-tracker') || name.includes('workbox'))
    );

    if (oldCaches.length > 0) {
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log('Service Worker: Cleared old caches', oldCaches);
    }
  } catch (error) {
    console.error('Service Worker: Error clearing old caches', error);
  }
}

// Notify clients about background update preparation
async function notifyClientsOfBackgroundUpdate() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_BACKGROUND_UPDATE_READY',
        payload: {
          version: VERSION,
          timestamp: Date.now(),
          action: 'background_update_prepared'
        }
      });
    });
    console.log('Service Worker: Notified clients of background update');
  } catch (error) {
    console.error('Service Worker: Error notifying clients of background update', error);
  }
}

// Notify clients that seamless update is complete
async function notifyClientsOfSeamlessUpdate() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });

    if (clients.length > 0) {
      console.log(`Service Worker: Notifying ${clients.length} clients of seamless update`);

      clients.forEach(client => {
        client.postMessage({
          type: 'SW_SEAMLESS_UPDATE_COMPLETE',
          payload: {
            version: VERSION,
            timestamp: Date.now(),
            reason: 'seamless_update_activated'
          }
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Error notifying clients of seamless update', error);
  }
}

// Enhanced caching strategy helper functions
function isAppShell(request) {
  const url = new URL(request.url);
  return url.pathname === '/' ||
         url.pathname === '/index.html' ||
         STATIC_FILES.includes(url.pathname);
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Network failed for cache-first request', error);
    throw error;
  }
}

async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Network failed, trying cache', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(error => {
    console.warn('Service Worker: Background revalidation failed', error);
  });

  return cachedResponse || networkResponsePromise;
}

async function navigationCacheFirst(request) {
  // Try to serve cached app shell for navigation requests
  const cachedResponse = await caches.match('/');
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    return await getOfflineFallback(request);
  }
}

async function getOfflineFallback(request) {
  // Enhanced offline fallback based on request type
  if (request.mode === 'navigate') {
    // Try to serve cached app shell
    const appShell = await caches.match('/');
    if (appShell) {
      return appShell;
    }
  }

  // Return offline page
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Progress Tracker</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
          font-weight: 600;
        }
        p {
          margin: 0 0 2rem 0;
          font-size: 1.1rem;
          opacity: 0.9;
          line-height: 1.5;
        }
        button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }
        button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>Progress Tracker is working offline. Your data is safe and will sync when you're back online.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

// Periodic cleanup (reduced frequency)
setInterval(() => {
  clearAllOldCaches();
}, 6 * 60 * 60 * 1000); // Run every 6 hours
