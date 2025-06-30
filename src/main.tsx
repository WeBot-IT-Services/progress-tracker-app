import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeOfflineStorage } from './services/offlineStorage'
import { initSyncService } from './services/syncService'
import './utils/consoleHelpers'
import './utils/securityTester'
import './utils/setupDatabase'
import './utils/testingMode'
import './utils/systemCheck'

// Enhanced cache clearing with forced refresh
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✅ All caches cleared');

    // Also clear localStorage and sessionStorage for complete refresh
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Storage cleared');
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
}

// Show subtle notification for seamless updates
function showSeamlessUpdateNotification(payload: any) {
  // Create a subtle, non-intrusive notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>
      <div>
        <div style="font-weight: 600;">App Updated</div>
        <div style="font-size: 12px; opacity: 0.9;">Version ${payload.version} is now active</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Force hard refresh with cache busting (kept for emergency use)
function forceHardRefresh() {
  const url = new URL(window.location.href);
  url.searchParams.set('v', Date.now().toString());
  url.searchParams.set('cache-bust', 'true');
  window.location.replace(url.toString());
}

// Enhanced Service Worker registration with forced updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('🚀 Initializing Service Worker with forced updates...');

      // Unregister existing service workers for clean slate
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      console.log('🧹 Unregistered old service workers');

      // Clear all caches for fresh start
      await clearAllCaches();

      // Register new service worker with no cache
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none', // Always fetch fresh service worker
        scope: '/' // Ensure full scope coverage
      });

      console.log('✅ Service Worker registered:', registration);

      // Seamless update detection
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found - preparing seamless update...');
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log(`🔄 Service Worker state: ${newWorker.state}`);

            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New version available - activate seamlessly
                console.log('🔄 New version detected - activating seamlessly...');

                // Skip waiting to activate immediately (no refresh)
                newWorker.postMessage({ type: 'SKIP_WAITING' });

                // No force refresh - let service worker handle seamlessly
                console.log('✅ Seamless update activated');
              } else {
                // First install
                console.log('✅ Service Worker installed for first time');
              }
            }
          });
        }
      });

      // Check for updates periodically (less frequent for seamless updates)
      setInterval(() => {
        registration.update();
      }, 60000); // Check every 60 seconds

    } catch (registrationError) {
      console.error('❌ Service Worker registration failed:', registrationError);
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
        // Update is prepared in background - no action needed
        break;

      case 'SW_SEAMLESS_UPDATE_COMPLETE':
        console.log('✅ Seamless update complete:', payload);
        // New version is now active - no refresh needed
        // Optionally show a subtle notification
        showSeamlessUpdateNotification(payload);
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
