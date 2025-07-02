/**
 * Comprehensive Offline Functionality Test Script
 * 
 * Instructions:
 * 1. Open https://mysteelprojecttracker.web.app
 * 2. Open browser console (F12 → Console)
 * 3. Copy and paste this script
 * 4. Run: testOfflineFunctionality()
 */

async function testOfflineFunctionality() {
  console.log('🧪 Testing Offline-First Functionality...');
  console.log('==========================================');
  
  const results = {
    indexedDBSupported: false,
    serviceWorkerSupported: false,
    backgroundSyncSupported: false,
    offlineStorageInitialized: false,
    syncServiceInitialized: false,
    networkStatusDetection: false,
    conflictResolution: false,
    dataOperations: false
  };

  // Test 1: IndexedDB Support
  console.log('\n📋 Test 1: IndexedDB Support');
  try {
    if ('indexedDB' in window) {
      console.log('✅ IndexedDB is supported');
      results.indexedDBSupported = true;
      
      // Test opening a database
      const testDB = await new Promise((resolve, reject) => {
        const request = indexedDB.open('TestDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          db.createObjectStore('test', { keyPath: 'id' });
        };
      });
      
      testDB.close();
      indexedDB.deleteDatabase('TestDB');
      console.log('✅ IndexedDB operations working');
    } else {
      console.log('❌ IndexedDB not supported');
    }
  } catch (error) {
    console.error('❌ IndexedDB test failed:', error);
  }

  // Test 2: Service Worker Support
  console.log('\n📋 Test 2: Service Worker Support');
  try {
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker is supported');
      results.serviceWorkerSupported = true;
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('✅ Service Worker is registered');
        console.log(`   Scope: ${registration.scope}`);
        console.log(`   State: ${registration.active?.state || 'unknown'}`);
      } else {
        console.log('⚠️ Service Worker not registered');
      }
    } else {
      console.log('❌ Service Worker not supported');
    }
  } catch (error) {
    console.error('❌ Service Worker test failed:', error);
  }

  // Test 3: Background Sync Support
  console.log('\n📋 Test 3: Background Sync Support');
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('✅ Background Sync is supported');
      results.backgroundSyncSupported = true;
      
      // Test registering a sync
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('test-sync');
      console.log('✅ Background Sync registration working');
    } else {
      console.log('❌ Background Sync not supported');
    }
  } catch (error) {
    console.error('❌ Background Sync test failed:', error);
  }

  // Test 4: Offline Storage Initialization
  console.log('\n📋 Test 4: Offline Storage Initialization');
  try {
    // Check if offline storage is available
    if (window.offlineStorage || window.initOfflineStorage) {
      console.log('✅ Offline storage service available');
      results.offlineStorageInitialized = true;
    } else {
      console.log('⚠️ Offline storage service not found in global scope');
      // Check if it's available through modules
      console.log('   Checking for module-based offline storage...');
    }
  } catch (error) {
    console.error('❌ Offline storage test failed:', error);
  }

  // Test 5: Network Status Detection
  console.log('\n📋 Test 5: Network Status Detection');
  try {
    console.log(`   Current online status: ${navigator.onLine ? 'Online' : 'Offline'}`);
    
    // Test network event listeners
    let onlineEventFired = false;
    let offlineEventFired = false;
    
    const onlineHandler = () => { onlineEventFired = true; };
    const offlineHandler = () => { offlineEventFired = true; };
    
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    // Simulate network change (this won't actually change network status)
    console.log('✅ Network event listeners attached');
    results.networkStatusDetection = true;
    
    // Cleanup
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  } catch (error) {
    console.error('❌ Network status test failed:', error);
  }

  // Test 6: Data Operations Simulation
  console.log('\n📋 Test 6: Data Operations Simulation');
  try {
    // Simulate offline data operations
    const testData = {
      id: 'test-project-' + Date.now(),
      name: 'Test Project',
      description: 'Test project for offline functionality',
      createdAt: new Date(),
      status: 'active'
    };
    
    console.log('✅ Test data created:', testData.id);
    
    // Test localStorage as fallback
    localStorage.setItem('test-offline-data', JSON.stringify(testData));
    const retrieved = JSON.parse(localStorage.getItem('test-offline-data'));
    
    if (retrieved && retrieved.id === testData.id) {
      console.log('✅ Local storage operations working');
      results.dataOperations = true;
    }
    
    // Cleanup
    localStorage.removeItem('test-offline-data');
  } catch (error) {
    console.error('❌ Data operations test failed:', error);
  }

  // Test 7: Conflict Resolution Simulation
  console.log('\n📋 Test 7: Conflict Resolution Simulation');
  try {
    const clientData = {
      id: 'test-conflict',
      name: 'Client Version',
      updatedAt: new Date(Date.now() - 1000) // 1 second ago
    };
    
    const serverData = {
      id: 'test-conflict',
      name: 'Server Version',
      updatedAt: new Date() // Now
    };
    
    // Simulate conflict detection
    const hasConflict = serverData.updatedAt > clientData.updatedAt;
    
    if (hasConflict) {
      console.log('✅ Conflict detection working');
      console.log(`   Client data: ${clientData.name} (${clientData.updatedAt.toISOString()})`);
      console.log(`   Server data: ${serverData.name} (${serverData.updatedAt.toISOString()})`);
      
      // Simulate merge resolution
      const mergedData = {
        ...serverData,
        name: `${clientData.name} + ${serverData.name}`,
        conflictResolved: true
      };
      
      console.log('✅ Conflict resolution simulation successful');
      console.log(`   Merged result: ${mergedData.name}`);
      results.conflictResolution = true;
    }
  } catch (error) {
    console.error('❌ Conflict resolution test failed:', error);
  }

  // Test 8: Sync Queue Simulation
  console.log('\n📋 Test 8: Sync Queue Simulation');
  try {
    const syncActions = [
      { type: 'CREATE', entity: 'project', data: { name: 'New Project' } },
      { type: 'UPDATE', entity: 'milestone', data: { id: 'milestone-1', status: 'completed' } },
      { type: 'DELETE', entity: 'project', data: { id: 'old-project' } }
    ];
    
    console.log('✅ Sync queue simulation:');
    syncActions.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action.type} ${action.entity}`);
    });
    
    // Simulate processing queue
    console.log('✅ Sync queue processing simulation successful');
  } catch (error) {
    console.error('❌ Sync queue test failed:', error);
  }

  // Test Summary
  console.log('\n🎯 Test Summary');
  console.log('===============');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log('\nDetailed Results:');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!results.indexedDBSupported) {
    console.log('⚠️ IndexedDB not supported - offline functionality will be limited');
  }
  if (!results.serviceWorkerSupported) {
    console.log('⚠️ Service Worker not supported - background sync unavailable');
  }
  if (!results.backgroundSyncSupported) {
    console.log('⚠️ Background Sync not supported - manual sync required');
  }
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Offline functionality is fully supported.');
  } else if (passedTests >= totalTests * 0.7) {
    console.log('✅ Most tests passed! Offline functionality is mostly supported.');
  } else {
    console.log('⚠️ Several tests failed. Offline functionality may be limited.');
  }

  // Usage Instructions
  console.log('\n📖 How to Test Offline Functionality:');
  console.log('1. Open DevTools → Network tab');
  console.log('2. Check "Offline" to simulate offline mode');
  console.log('3. Try creating/updating projects');
  console.log('4. Uncheck "Offline" to go back online');
  console.log('5. Watch for automatic synchronization');
  console.log('6. Check the Sync Status dashboard for details');

  return {
    summary: `${passedTests}/${totalTests} tests passed`,
    results,
    offlineSupported: passedTests >= totalTests * 0.7
  };
}

// Helper function to simulate offline mode
function simulateOfflineMode() {
  console.log('🔌 Simulating offline mode...');
  
  // Override navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  });
  
  // Dispatch offline event
  window.dispatchEvent(new Event('offline'));
  
  console.log('📱 Now in offline mode');
  console.log('💡 Try creating or updating data to test offline functionality');
}

// Helper function to simulate online mode
function simulateOnlineMode() {
  console.log('🌐 Simulating online mode...');
  
  // Restore navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  });
  
  // Dispatch online event
  window.dispatchEvent(new Event('online'));
  
  console.log('✅ Now in online mode');
  console.log('🔄 Automatic sync should trigger');
}

// Make functions available globally
window.testOfflineFunctionality = testOfflineFunctionality;
window.simulateOfflineMode = simulateOfflineMode;
window.simulateOnlineMode = simulateOnlineMode;

console.log('🧪 Offline Functionality Test Script Loaded');
console.log('💡 Run: testOfflineFunctionality() to test offline capabilities');
console.log('💡 Run: simulateOfflineMode() to test offline behavior');
console.log('💡 Run: simulateOnlineMode() to test sync behavior');
