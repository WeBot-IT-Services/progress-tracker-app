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
  }
}

// Initialize console helpers
export const initConsoleHelpers = () => {
  if (typeof window !== 'undefined') {
    window.createTestUsers = createAllTestUsers;
    window.showLoginCredentials = displayLoginCredentials;
    window.seedData = seedFirebaseData;
    window.testAccounts = testUsers;
    window.setupCompleteDatabase = setupCompleteDatabase;
    window.verifyDatabase = verifyDatabaseSetup;

    console.log('🔧 Development Console Helpers Loaded!');
    console.log('=====================================');
    console.log('Available commands:');
    console.log('• setupCompleteDatabase() - 🚀 ONE-CLICK COMPLETE SETUP (RECOMMENDED)');
    console.log('• verifyDatabase() - Check if database is properly set up');
    console.log('• createTestUsers() - Create test user accounts for all roles');
    console.log('• seedData() - Add sample data to all modules');
    console.log('• showLoginCredentials() - Display login credentials for test accounts');
    console.log('• testAccounts - View test account details');
    console.log('');
    console.log('🚀 QUICK START (One Command):');
    console.log('==============================');
    console.log('Run: setupCompleteDatabase()');
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
