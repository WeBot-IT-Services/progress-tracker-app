import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext';
import { initializeOfflineStorage } from './services/offlineStorage'
import { initSyncService } from './services/syncService'
// Security tester removed for production

// Enhanced cache clearing with forced refresh
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✅ All caches cleared');

    // Preserve version tracking when clearing storage
    const lastNotifiedVersion = localStorage.getItem('lastNotifiedVersion');
    
    // Clear localStorage and sessionStorage for complete refresh
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore version tracking
    if (lastNotifiedVersion) {
      localStorage.setItem('lastNotifiedVersion', lastNotifiedVersion);
    }
    
    console.log('✅ Storage cleared (version tracking preserved)');
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
}

// Force hard refresh with cache busting (kept for emergency use)
function forceHardRefresh() {
  const url = new URL(window.location.href);
  url.searchParams.set('v', Date.now().toString());
  url.searchParams.set('cache-bust', 'true');
  window.location.replace(url.toString());
}

// Simplified Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('🚀 Registering Service Worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
        scope: '/'
      });

      console.log('✅ Service Worker registered successfully');

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New version available');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });

  // Enhanced service worker message handling with sync support
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
      case 'BACKGROUND_SYNC':
        // Trigger sync when service worker requests it
        window.dispatchEvent(new CustomEvent('sw-background-sync', { detail: payload }));
        break;

      case 'BACKGROUND_SYNC_START':
        console.log('🔄 Background sync started:', payload);
        window.dispatchEvent(new CustomEvent('sync-status-changed', {
          detail: { type: 'sync-start', payload }
        }));
        break;

      case 'BACKGROUND_SYNC_COMPLETE':
        console.log('✅ Background sync completed:', payload);
        window.dispatchEvent(new CustomEvent('sync-status-changed', {
          detail: { type: 'sync-complete', payload }
        }));
        break;

      case 'BACKGROUND_SYNC_FAILED':
        console.log('❌ Background sync failed:', payload);
        window.dispatchEvent(new CustomEvent('sync-status-changed', {
          detail: { type: 'sync-failed', payload }
        }));
        break;

      case 'RETRY_FAILED_SYNC':
        console.log('🔄 Retrying failed sync:', payload);
        window.dispatchEvent(new CustomEvent('sync-status-changed', {
          detail: { type: 'retry-sync', payload }
        }));
        break;

      case 'PROCESS_CONFLICTS':
        console.log('⚠️ Processing conflicts:', payload);
        window.dispatchEvent(new CustomEvent('sync-status-changed', {
          detail: { type: 'process-conflicts', payload }
        }));
        break;

      case 'SW_BACKGROUND_UPDATE_READY':
        console.log('🔄 Background update ready:', payload);
        // Update is prepared in background - auto-update will handle it silently
        break;

      case 'SW_SEAMLESS_UPDATE_COMPLETE':
        console.log('✅ Seamless update complete:', payload);
        // New version is now active - no user notification needed
        console.log(`📱 Now running version ${payload.version || 'latest'}`);
        break;

      default:
        console.log('📨 Service Worker message:', type, payload);
    }
  });
}

// Initialize offline storage and sync services
const initializeOfflineSupport = async () => {
  try {
    console.log('🔧 Initializing offline support...');

    // Initialize sync service (which includes offline storage initialization)
    await initSyncService();
    console.log('✅ Offline support initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize offline support:', error);

    // In development, try to reset and reinitialize
    if (import.meta.env.DEV) {
      console.log('🔄 Attempting to reset offline storage in development mode...');
      try {
        const { resetDatabase } = await import('./services/offlineStorage');
        await resetDatabase();
        await initSyncService();
        console.log('✅ Offline support reset and reinitialized successfully');
      } catch (resetError) {
        console.error('❌ Failed to reset offline support:', resetError);
      }
    }
  }
};

// Initialize offline support
initializeOfflineSupport();

// Initialize automatic version checking (completely silent)
console.log('🔄 Initializing automatic version checking...');
// The version check service is automatically initialized when imported

// Re-enable StrictMode after fixing context issues
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
