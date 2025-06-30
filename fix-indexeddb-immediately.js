/**
 * Immediate IndexedDB Fix Script
 * 
 * This script provides immediate fixes for the IndexedDB NotFoundError issues.
 * Run this in the browser console to force database recreation and fix schema issues.
 */

console.log('🔧 IndexedDB Immediate Fix Script');
console.log('==================================');

// Immediate fix function
async function fixIndexedDBImmediately() {
  console.log('🚀 Starting immediate IndexedDB fix...');
  
  try {
    // Step 1: Check if the fix functions are available
    if (typeof window.forceRecreateDatabase === 'function') {
      console.log('✅ Fix functions available, proceeding with database recreation...');
      await window.forceRecreateDatabase();
    } else {
      console.log('⚠️ Fix functions not available, using manual approach...');
      
      // Manual database deletion
      const dbName = 'ProgressTrackerDB';
      
      return new Promise((resolve, reject) => {
        console.log(`🗑️ Manually deleting database: ${dbName}`);
        
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        
        deleteRequest.onerror = () => {
          console.error('❌ Failed to delete database:', deleteRequest.error);
          reject(deleteRequest.error);
        };
        
        deleteRequest.onsuccess = () => {
          console.log('✅ Database deleted successfully');
          console.log('🔄 Please refresh the page to recreate the database with correct schema');
          resolve();
        };
        
        deleteRequest.onblocked = () => {
          console.warn('⚠️ Database deletion blocked');
          console.log('💡 Please close all other tabs with this application and try again');
          resolve();
        };
      });
    }
    
    console.log('🎉 IndexedDB fix completed successfully!');
    console.log('💡 The application should now work without IndexedDB errors');
    
  } catch (error) {
    console.error('❌ IndexedDB fix failed:', error);
    console.log('🔄 Manual steps to fix:');
    console.log('1. Open Browser DevTools (F12)');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Find IndexedDB section');
    console.log('4. Delete "ProgressTrackerDB" database');
    console.log('5. Refresh the page');
  }
}

// Quick diagnostic function
async function diagnoseIndexedDBIssues() {
  console.log('🔍 Diagnosing IndexedDB issues...');
  
  try {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.error('❌ IndexedDB not supported in this browser');
      return;
    }
    
    console.log('✅ IndexedDB is supported');
    
    // Try to open the database
    const dbName = 'ProgressTrackerDB';
    const request = indexedDB.open(dbName);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log(`✅ Database "${dbName}" opened successfully`);
      console.log(`📊 Database version: ${db.version}`);
      console.log(`📋 Object stores: ${Array.from(db.objectStoreNames).join(', ')}`);
      
      // Check sync queue store specifically
      if (db.objectStoreNames.contains('syncQueue')) {
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        
        console.log(`📋 SyncQueue indexes: ${Array.from(store.indexNames).join(', ')}`);
        
        // Check for the problematic status index
        try {
          const statusIndex = store.index('status');
          console.log('✅ Status index found in syncQueue');
        } catch (error) {
          console.error('❌ Status index missing in syncQueue:', error);
          console.log('🔧 This is the cause of the NotFoundError - database needs recreation');
        }
      } else {
        console.error('❌ syncQueue store not found');
      }
      
      db.close();
    };
    
    request.onerror = (event) => {
      console.error('❌ Failed to open database:', event.target.error);
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Step-by-step fix guide
function showFixGuide() {
  console.log('📋 Step-by-Step Fix Guide');
  console.log('=========================');
  console.log('');
  console.log('🎯 Problem: IndexedDB NotFoundError for missing indexes');
  console.log('');
  console.log('🔧 Solution Options:');
  console.log('');
  console.log('Option 1 - Automatic Fix:');
  console.log('  1. Run: fixIndexedDBImmediately()');
  console.log('  2. Wait for completion message');
  console.log('  3. Refresh the page');
  console.log('');
  console.log('Option 2 - Manual Fix:');
  console.log('  1. Open Browser DevTools (F12)');
  console.log('  2. Go to Application tab (Chrome) or Storage tab (Firefox)');
  console.log('  3. Find IndexedDB in the left sidebar');
  console.log('  4. Right-click on "ProgressTrackerDB"');
  console.log('  5. Select "Delete database"');
  console.log('  6. Refresh the page');
  console.log('');
  console.log('Option 3 - Clear All Data:');
  console.log('  1. Go to browser settings');
  console.log('  2. Clear browsing data');
  console.log('  3. Select "Cookies and other site data"');
  console.log('  4. Clear data for this site only');
  console.log('  5. Refresh the page');
  console.log('');
  console.log('💡 After any option, the database will be recreated with the correct schema');
}

// Export functions to window for easy access
window.fixIndexedDBImmediately = fixIndexedDBImmediately;
window.diagnoseIndexedDBIssues = diagnoseIndexedDBIssues;
window.showFixGuide = showFixGuide;

// Auto-run diagnostic
console.log('🔍 Running automatic diagnostic...');
diagnoseIndexedDBIssues();

console.log('');
console.log('💡 Available functions:');
console.log('  • fixIndexedDBImmediately() - Fix the issue automatically');
console.log('  • diagnoseIndexedDBIssues() - Check what\'s wrong');
console.log('  • showFixGuide() - Show step-by-step manual fix guide');
console.log('');
console.log('🚀 Quick fix: Run fixIndexedDBImmediately() now!');

// Show a prominent fix button in console
console.log('');
console.log('🔴 CLICK TO FIX: Run this command now:');
console.log('%cfixIndexedDBImmediately()', 'background: #ff4444; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;');
console.log('');
