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

  if (isDevelopmentMode) {
    console.log('🔥 Firebase initialized successfully');
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

  // Add function to run comprehensive Firebase diagnostics
  (window as any).runFirebaseDiagnostics = async () => {
    try {
      const { default: runFirebaseDiagnostics } = await import('../utils/firebaseDiagnostics');
      return await runFirebaseDiagnostics();
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      return { error: error.message };
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
    console.log('  - runFirebaseDiagnostics() - Run comprehensive Firebase diagnostics');
    console.log('  - verifyExistingData() - View existing Firestore data (READ-ONLY)');
    console.log('  - debugProject(projectId?) - Debug specific project or all projects');
  }
}

export default app;
