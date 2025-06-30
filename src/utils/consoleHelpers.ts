// Console helpers for development and testing
import { createAllTestUsers, displayLoginCredentials, testUsers } from './createTestUsers';
import { seedFirebaseData } from './seedData';
import { setupCompleteDatabase, verifyDatabaseSetup } from './setupDatabase';

// Make functions available globally in development
declare global {
  interface Window {
    createTestUsers: () => Promise<void>;
    showLoginCredentials: () => void;
    seedData: () => Promise<void>;
    testAccounts: typeof testUsers;
    setupCompleteDatabase: () => Promise<void>;
    verifyDatabase: () => Promise<void>;
    clearAllData: () => Promise<void>;
    debugAuth: () => Promise<void>;
  }
}

// Clear all cached data and force fresh start
const clearAllData = async () => {
  try {
    console.log('🧹 Clearing all cached data...');

    // Clear IndexedDB
    const { clearAuthData } = await import('../services/offlineStorage');
    await clearAuthData();

    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    console.log('✅ All cached data cleared!');
    console.log('🔄 Please refresh the page for a fresh start.');

    if (confirm('All cached data cleared! Refresh the page now?')) {
      window.location.reload();
    }
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
};

// Debug authentication state
const debugAuth = async () => {
  try {
    console.log('🔍 Debugging authentication state...');

    // Check offline storage
    const { getAuthData } = await import('../services/offlineStorage');
    const offlineUser = await getAuthData();
    console.log('📱 Offline user data:', offlineUser);

    // Check localStorage
    const localAuthUser = localStorage.getItem('localAuth_currentUser');
    console.log('🔐 Local auth user:', localAuthUser ? JSON.parse(localAuthUser) : null);

    // Check Firebase auth
    const { auth } = await import('../config/firebase');
    console.log('🔥 Firebase auth user:', auth.currentUser);

    // Check current context
    console.log('🎯 Current window location:', window.location.href);

  } catch (error) {
    console.error('❌ Error debugging auth:', error);
  }
};

// Initialize console helpers
export const initConsoleHelpers = () => {
  if (typeof window !== 'undefined') {
    window.createTestUsers = createAllTestUsers;
    window.showLoginCredentials = displayLoginCredentials;
    window.seedData = seedFirebaseData;
    window.testAccounts = testUsers;
    window.setupCompleteDatabase = setupCompleteDatabase;
    window.verifyDatabase = verifyDatabaseSetup;
    window.clearAllData = clearAllData;
    window.debugAuth = debugAuth;

    console.log('🔧 Development Console Helpers Loaded!');
    console.log('=====================================');
    console.log('Available commands:');
    console.log('• setupCompleteDatabase() - 🚀 ONE-CLICK COMPLETE SETUP (RECOMMENDED)');
    console.log('• verifyDatabase() - Check if database is properly set up');
    console.log('• createTestUsers() - Create test user accounts for all roles');
    console.log('• seedData() - Add sample data to all modules');
    console.log('• showLoginCredentials() - Display login credentials for test accounts');
    console.log('• testAccounts - View test account details');
    console.log('• clearAllData() - 🧹 Clear all cached data and force fresh start');
    console.log('• debugAuth() - 🔍 Debug current authentication state');
    console.log('');
    console.log('🚀 QUICK START (One Command):');
    console.log('==============================');
    console.log('Run: setupCompleteDatabase()');
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('===================');
    console.log('If you see wrong user roles or only 3 modules:');
    console.log('1. Run: clearAllData() - Clear all cached data');
    console.log('2. Run: debugAuth() - Check authentication state');
    console.log('3. Refresh page and login again');
    console.log('');
    console.log('📝 Manual Setup (Step by Step):');
    console.log('===============================');
    console.log('1. Run: createTestUsers()');
    console.log('2. Run: seedData()');
    console.log('3. Run: showLoginCredentials()');
    console.log('4. Use the displayed credentials to test different user roles');
  }
};

// Auto-initialize in development
if (import.meta.env.DEV) {
  initConsoleHelpers();
}
