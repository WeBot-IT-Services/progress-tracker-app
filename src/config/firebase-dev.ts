import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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

  // Connect to Firebase emulators in development mode (if available)
  if (isDevelopmentMode && import.meta.env.VITE_USE_EMULATORS === 'true') {
    try {
      connectAuthEmulator(auth, "http://localhost:9099");
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, "localhost", 9199);
      console.log('🔧 Connected to Firebase emulators');
    } catch (error) {
      console.log('⚠️ Firebase emulators not available, using production services');
    }
  }

  if (isDevelopmentMode) {
    console.log('🔥 Firebase initialized successfully');
    console.log('🌐 Project ID:', firebaseConfig.projectId);
    console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.log('🔄 Falling back to local development mode');
}

// Export Firebase services
export { auth, db, storage };

// Development environment configuration
if (isDevelopmentMode && typeof window !== 'undefined') {
  // Enable global testing mode function
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

  // Development function to deploy dev-friendly Firestore rules
  (window as any).deployDevRules = async () => {
    console.log('📋 To deploy development-friendly Firestore rules:');
    console.log('1. Run: firebase deploy --only firestore:rules --project mysteelprojecttracker');
    console.log('2. Or update rules in Firebase Console');
    console.log('⚠️  WARNING: Dev rules are permissive - only use in development!');
  };

  // Add function to test Firestore connectivity
  (window as any).testFirestoreConnection = async () => {
    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      console.log('🔄 Testing Firestore connection...');
      
      // Try to read a small amount of data from users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const snapshot = await getDocs(q);
      
      console.log('✅ Firestore connection successful!');
      console.log(`📊 Users collection accessible, ${snapshot.size} documents found`);
      return true;
    } catch (error) {
      console.error('❌ Firestore connection failed:', error);
      console.log('🔧 Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify Firebase configuration');
      console.log('3. Check Firestore security rules');
      console.log('4. Run deployDevRules() to deploy development-friendly rules');
      return false;
    }
  };

  // Debug utilities removed during codebase cleanup
  // These functions are no longer available:
  // - verifyExistingData (from firestoreDataViewer)
  // - debugProject (from debugProject)

  (window as any).verifyExistingData = () => {
    console.warn('⚠️ verifyExistingData utility was removed during codebase cleanup');
    return { error: 'Debug utility not available' };
  };

  (window as any).debugProject = () => {
    console.warn('⚠️ debugProject utility was removed during codebase cleanup');
    return { error: 'Debug utility not available' };
  };

  // Only show development functions info if console is open or explicitly requested
  if (localStorage.getItem('showDevFunctions') === 'true') {
    console.log('🔧 Development mode enabled');
    console.log('🧪 Development functions available:');
    console.log('  - enableTestingMode() - Bypass authentication');
    console.log('  - disableTestingMode() - Re-enable authentication');
    console.log('  - testFirestoreConnection() - Test database connectivity');
    console.log('  - deployDevRules() - Show instructions for dev-friendly rules');
    console.log('  - verifyExistingData() - View existing Firestore data (READ-ONLY)');
    console.log('  - debugProject(projectId?) - Debug specific project or all projects');
  }
}

export default app;
