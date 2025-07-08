#!/usr/bin/env node

/**
 * Check Demo Users Script
 * 
 * This script checks the current state of demo users in Firebase
 * and provides guidance on what needs to be fixed.
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Demo users configuration
const DEMO_USERS = [
  { employeeId: 'A0001', email: 'admin@mysteel.com', role: 'admin' },
  { employeeId: 'S0001', email: 'sales@mysteel.com', role: 'sales' },
  { employeeId: 'D0001', email: 'design@mysteel.com', role: 'designer' },
  { employeeId: 'P0001', email: 'production@mysteel.com', role: 'production' },
  { employeeId: 'I0001', email: 'installation@mysteel.com', role: 'installation' }
];

/**
 * Check Firebase Authentication
 */
async function checkFirebaseAuth() {
  console.log('🔐 Checking Firebase Authentication...');
  
  const results = [];
  
  for (const demoUser of DEMO_USERS) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, demoUser.email, 'WR2024');
      results.push({
        ...demoUser,
        authStatus: 'OK',
        uid: userCredential.user.uid,
        authError: null
      });
      console.log(`  ✅ ${demoUser.email} - Authentication OK`);
      await signOut(auth);
    } catch (error) {
      results.push({
        ...demoUser,
        authStatus: 'FAILED',
        uid: null,
        authError: error.code
      });
      console.log(`  ❌ ${demoUser.email} - Authentication FAILED (${error.code})`);
    }
  }
  
  return results;
}

/**
 * Check Firestore Documents
 */
async function checkFirestoreDocuments() {
  console.log('📄 Checking Firestore user documents...');
  
  const results = [];
  
  for (const demoUser of DEMO_USERS) {
    try {
      const usersQuery = query(
        collection(db, 'users'), 
        where('employeeId', '==', demoUser.employeeId)
      );
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        results.push({
          ...demoUser,
          firestoreStatus: 'OK',
          firestoreData: userData,
          documentId: userDoc.id
        });
        console.log(`  ✅ ${demoUser.employeeId} - Firestore document OK (Role: ${userData.role})`);
      } else {
        results.push({
          ...demoUser,
          firestoreStatus: 'MISSING',
          firestoreData: null,
          documentId: null
        });
        console.log(`  ❌ ${demoUser.employeeId} - Firestore document MISSING`);
      }
    } catch (error) {
      results.push({
        ...demoUser,
        firestoreStatus: 'ERROR',
        firestoreData: null,
        documentId: null,
        firestoreError: error.message
      });
      console.log(`  ❌ ${demoUser.employeeId} - Firestore ERROR (${error.message})`);
    }
  }
  
  return results;
}

/**
 * Generate recommendations
 */
function generateRecommendations(authResults, firestoreResults) {
  console.log('💡 Recommendations:');
  console.log('==================');
  
  const authFailed = authResults.filter(r => r.authStatus === 'FAILED');
  const firestoreMissing = firestoreResults.filter(r => r.firestoreStatus === 'MISSING');
  
  if (authFailed.length === 0 && firestoreMissing.length === 0) {
    console.log('✅ All demo users are properly configured!');
    console.log('   You can use the Quick Demo Access buttons in the app.');
    return;
  }
  
  if (authFailed.length > 0) {
    console.log('🔐 Firebase Authentication Issues:');
    authFailed.forEach(user => {
      if (user.authError === 'auth/user-not-found') {
        console.log(`   - ${user.email}: User doesn't exist - needs to be created`);
      } else if (user.authError === 'auth/invalid-credential') {
        console.log(`   - ${user.email}: Wrong password - needs password reset or recreation`);
      } else {
        console.log(`   - ${user.email}: ${user.authError}`);
      }
    });
    console.log('');
  }
  
  if (firestoreMissing.length > 0) {
    console.log('📄 Firestore Document Issues:');
    firestoreMissing.forEach(user => {
      console.log(`   - ${user.employeeId}: Missing user document in Firestore`);
    });
    console.log('');
  }
  
  console.log('🛠️  Recommended Actions:');
  
  if (authFailed.length > 0) {
    console.log('1. Delete existing problematic users from Firebase Console:');
    console.log('   - Go to Firebase Console > Authentication > Users');
    authFailed.forEach(user => {
      console.log(`   - Delete: ${user.email}`);
    });
    console.log('');
  }
  
  if (firestoreMissing.length > 0) {
    console.log('2. Clean up orphaned Firestore documents:');
    console.log('   - Go to Firebase Console > Firestore Database > users collection');
    firestoreMissing.forEach(user => {
      console.log(`   - Delete any documents with employeeId: ${user.employeeId}`);
    });
    console.log('');
  }
  
  console.log('3. Run the setup script to recreate demo users:');
  console.log('   npm run setup:demo-users');
  console.log('');
  
  console.log('4. If issues persist, follow the manual setup guide:');
  console.log('   See: MANUAL_DEMO_USERS_SETUP.md');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Demo Users Status Check');
  console.log('==========================');
  console.log('');
  
  try {
    const authResults = await checkFirebaseAuth();
    console.log('');
    
    const firestoreResults = await checkFirestoreDocuments();
    console.log('');
    
    generateRecommendations(authResults, firestoreResults);
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
