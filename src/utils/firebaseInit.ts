import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "221205163780",
  appId: "1:221205163780:web:52417a0db2f048ed962a51",
  measurementId: "G-4DKCVC0G2F"
};

// Initialize Firebase with error handling
let app: any;
let auth: any;
let db: any;
let storage: any;

export const initializeFirebase = async () => {
  try {
    console.log('🔥 Initializing Firebase...');
    
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Test connection
    await testFirebaseConnection();
    
    console.log('✅ Firebase initialized successfully!');
    return { app, auth, db, storage };
    
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error);
    
    // Handle specific CORS errors
    if (error.message?.includes('CORS') || error.message?.includes('access control')) {
      console.log('🔧 CORS issue detected. Trying alternative initialization...');
      return await initializeFirebaseWithCORSFix();
    }
    
    throw error;
  }
};

// Alternative initialization for CORS issues
const initializeFirebaseWithCORSFix = async () => {
  try {
    console.log('🔧 Attempting CORS-friendly Firebase initialization...');
    
    // Initialize with minimal configuration
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Disable network temporarily to avoid CORS issues during init
    await disableNetwork(db);
    
    // Re-enable network after a short delay
    setTimeout(async () => {
      try {
        await enableNetwork(db);
        console.log('🌐 Firebase network re-enabled');
      } catch (error) {
        console.warn('⚠️ Network re-enable warning:', error);
      }
    }, 1000);
    
    console.log('✅ Firebase initialized with CORS workaround!');
    return { app, auth, db, storage };
    
  } catch (error) {
    console.error('❌ CORS workaround failed:', error);
    throw error;
  }
};

// Test Firebase connection
const testFirebaseConnection = async () => {
  try {
    // Simple auth state check
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        unsubscribe();
        resolve(true);
      });
    });
  } catch (error) {
    console.warn('⚠️ Firebase connection test warning:', error);
    return false;
  }
};

// Retry mechanism for Firebase operations
export const withRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Export initialized services
export const getFirebaseServices = () => {
  if (!app || !auth || !db || !storage) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return { app, auth, db, storage };
};

// Auto-initialize in development
if (typeof window !== 'undefined') {
  initializeFirebase().catch(error => {
    console.error('Auto-initialization failed:', error);
    
    // Provide user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 400px;
      font-family: Arial, sans-serif;
    `;
    errorDiv.innerHTML = `
      <strong>🔥 Firebase Connection Issue</strong><br>
      <small>CORS error detected. Please refresh the page or check console for details.</small>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  });
}
