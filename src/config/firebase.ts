import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables or fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mysteelprojecttracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mysteelprojecttracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "221205163780",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:221205163780:web:52417a0db2f048ed962a51",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4DKCVC0G2F"
};

// Development mode flag
export const isDevelopmentMode = import.meta.env.DEV;
export const useLocalAuth = isDevelopmentMode && import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

// Initialize Firebase
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.log('🔄 Falling back to local development mode');
}

// Export Firebase services
export { auth, db, storage };

// Development environment configuration
if (isDevelopmentMode) {
  console.log('🔧 Development mode enabled');

  // Enable global testing mode function
  if (typeof window !== 'undefined') {
    (window as any).enableTestingMode = () => {
      console.log('🧪 Testing mode enabled - bypassing authentication');
      localStorage.setItem('testingMode', 'true');
      localStorage.setItem('currentUser', JSON.stringify({
        uid: 'test-admin-001',
        email: 'admin@warehouseracking.my',
        role: 'admin',
        name: 'Test Admin User'
      }));
      window.location.reload();
    };

    (window as any).disableTestingMode = () => {
      console.log('🔒 Testing mode disabled');
      localStorage.removeItem('testingMode');
      localStorage.removeItem('currentUser');
      window.location.reload();
    };

    // Add data integrity checker function
    (window as any).checkDataIntegrity = async () => {
      console.log('🔍 Starting data integrity check...');
      try {
        const { DataIntegrityChecker } = await import('../utils/dataIntegrityChecker');
        const checker = new DataIntegrityChecker();
        const results = await checker.performFullIntegrityCheck();

        console.log('\n🎯 DATA INTEGRITY CHECK COMPLETED');
        console.log('Results available in browser console and returned object');
        return results;
      } catch (error) {
        console.error('❌ Data integrity check failed:', error);
        return { error: error.message };
      }
    };

    // Add data verification function (READ-ONLY)
    (window as any).verifyExistingData = async () => {
      try {
        const { verifyExistingData } = await import('../utils/firestoreDataViewer');
        return await verifyExistingData();
      } catch (error) {
        console.error('❌ Data verification failed:', error);
        return { error: error.message };
      }
    };

    // Add quick data check function
    (window as any).quickDataCheck = async () => {
      try {
        const { quickDataCheck } = await import('../utils/quickDataCheck');
        return await quickDataCheck();
      } catch (error) {
        console.error('❌ Quick data check failed:', error);
        return { error: error.message };
      }
    };

    // Add data seeding functions
    (window as any).seedTestData = async () => {
      try {
        const { seedTestData } = await import('../utils/dataSeed');
        return await seedTestData();
      } catch (error) {
        console.error('❌ Data seeding failed:', error);
        return { error: error.message };
      }
    };

    console.log('🧪 Development functions available:');
    console.log('  - enableTestingMode() - Bypass authentication');
    console.log('  - disableTestingMode() - Re-enable authentication');
    console.log('  - verifyExistingData() - View existing Firestore data (READ-ONLY)');
    console.log('  - quickDataCheck() - Quick overview of Firestore data');
    console.log('  - seedTestData() - Create sample data for testing');
    console.log('  - checkDataIntegrity() - Run comprehensive data audit and repair');
  }
}

export default app;
