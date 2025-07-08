// Aggressive Force Update Script
// This will clear all caches and force a complete application refresh

console.log('🚨 AGGRESSIVE FORCE UPDATE INITIATED');

async function aggressiveForceUpdate() {
  console.log('🔥 Starting aggressive cache clearing...');
  
  try {
    // 1. Clear all local storage
    localStorage.clear();
    console.log('✅ Local storage cleared');
    
    // 2. Clear all session storage
    sessionStorage.clear();
    console.log('✅ Session storage cleared');
    
    // 3. Clear all IndexedDB databases
    if ('indexedDB' in window) {
      try {
        // Get all database names and delete them
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log(`✅ Deleted IndexedDB: ${db.name}`);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not clear all IndexedDB databases:', error);
      }
    }
    
    // 4. Unregister all service workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('✅ Service worker unregistered');
        }
      } catch (error) {
        console.log('⚠️ Could not unregister service workers:', error);
      }
    }
    
    // 5. Clear all caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log(`✅ Deleted cache: ${cacheName}`);
        }
      } catch (error) {
        console.log('⚠️ Could not clear all caches:', error);
      }
    }
    
    // 6. Set force update flags
    localStorage.setItem('forceUpdate', 'true');
    localStorage.setItem('lastForceUpdate', Date.now().toString());
    
    console.log('🎯 All caches cleared successfully!');
    console.log('🔄 Forcing hard refresh in 2 seconds...');
    
    // 7. Force hard refresh
    setTimeout(() => {
      window.location.reload(true); // Hard refresh
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error during aggressive force update:', error);
    
    // Fallback: Just do a hard refresh
    console.log('🔄 Falling back to simple hard refresh...');
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  }
}

// Create a global function that can be called from browser console
window.FORCE_UPDATE = aggressiveForceUpdate;

// Also auto-run if this script is loaded
console.log('🎯 Aggressive force update ready!');
console.log('💡 Run FORCE_UPDATE() in console to force update, or wait 5 seconds for auto-update');

// Auto-run after 5 seconds
setTimeout(() => {
  console.log('⏰ Auto-running aggressive force update...');
  aggressiveForceUpdate();
}, 5000);
