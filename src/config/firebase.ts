 import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace with your actual Firebase config or use environment variables
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "221205163780",
  appId: "1:221205163780:web:52417a0db2f048ed962a51",
  measurementId: "G-4DKCVC0G2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure for development environment
if (import.meta.env.DEV) {
  try {
    // Development-specific Firebase configuration
    console.log('🔧 Firebase initialized for development environment');

    // Add custom headers for CORS handling
    if (typeof window !== 'undefined') {
      // Override fetch to add proper headers for Firebase requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init = {}) {
        // Only modify Firebase API requests
        if (typeof input === 'string' && input.includes('googleapis.com')) {
          init.headers = {
            ...init.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          };
        }
        return originalFetch.call(this, input, init);
      };
    }
  } catch (error) {
    console.warn('Firebase development setup warning:', error);
  }
}

export default app;
