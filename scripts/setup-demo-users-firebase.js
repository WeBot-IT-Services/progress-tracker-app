#!/usr/bin/env node

/**
 * Firebase Demo Users Setup Script
 * 
 * This script will:
 * 1. Clean up existing demo users from Firebase Auth and Firestore
 * 2. Create fresh demo users in Firebase Authentication
 * 3. Create corresponding user documents in Firestore
 * 4. Verify the setup is working correctly
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
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
  {
    employeeId: 'A0001',
    email: 'admin@mysteel.com',
    password: 'WR2024',
    name: 'Demo Administrator',
    role: 'admin',
    department: 'Administration'
  },
  {
    employeeId: 'S0001',
    email: 'sales@mysteel.com',
    password: 'WR2024',
    name: 'Demo Sales Manager',
    role: 'sales',
    department: 'Sales'
  },
  {
    employeeId: 'D0001',
    email: 'design@mysteel.com',
    password: 'WR2024',
    name: 'Demo Design Engineer',
    role: 'designer',
    department: 'Design'
  },
  {
    employeeId: 'P0001',
    email: 'production@mysteel.com',
    password: 'WR2024',
    name: 'Demo Production Manager',
    role: 'production',
    department: 'Production'
  },
  {
    employeeId: 'I0001',
    email: 'installation@mysteel.com',
    password: 'WR2024',
    name: 'Demo Installation Manager',
    role: 'installation',
    department: 'Installation'
  }
];

/**
 * Clean up existing demo users by finding them via Firestore
 */
async function cleanupExistingUsers() {
  console.log('🧹 Cleaning up existing demo users...');

  for (const demoUser of DEMO_USERS) {
    try {
      // Find user by employee ID in Firestore
      const usersQuery = query(
        collection(db, 'users'),
        where('employeeId', '==', demoUser.employeeId)
      );
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;

        console.log(`  🗑️  Found existing user: ${userData.email} (${demoUser.employeeId})`);

        // Delete Firestore document
        await deleteDoc(doc(db, 'users', userId));
        console.log(`    ✅ Deleted Firestore document for ${userData.email}`);

        // Try to delete from Firebase Auth (this might fail if we can't authenticate)
        try {
          // Try multiple possible passwords
          const possiblePasswords = ['WR2024', 'demo123', 'password123'];
          let userCredential = null;

          for (const password of possiblePasswords) {
            try {
              userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
              break;
            } catch (e) {
              // Continue to next password
            }
          }

          if (userCredential) {
            await deleteUser(userCredential.user);
            console.log(`    ✅ Deleted Firebase Auth user: ${userData.email}`);
            await signOut(auth);
          } else {
            console.log(`    ⚠️  Could not authenticate ${userData.email} for deletion, will recreate`);
          }
        } catch (authError) {
          console.log(`    ⚠️  Could not delete Firebase Auth user ${userData.email}:`, authError.message);
        }
      } else {
        console.log(`    ℹ️  No existing user found for ${demoUser.employeeId}`);
      }

    } catch (error) {
      console.log(`    ⚠️  Error cleaning up ${demoUser.employeeId}:`, error.message);
    }
  }

  // Sign out after cleanup
  try {
    await signOut(auth);
  } catch (error) {
    // Ignore sign out errors
  }
}

/**
 * Create or update demo users in Firebase Auth and Firestore
 */
async function createDemoUsers() {
  console.log('👥 Creating/updating demo users...');

  for (const demoUser of DEMO_USERS) {
    try {
      console.log(`  🔐 Processing user: ${demoUser.email}`);

      let user = null;
      let isNewUser = false;

      // Try to create new user first
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          demoUser.email,
          demoUser.password
        );
        user = userCredential.user;
        isNewUser = true;
        console.log(`    ✅ Created new Firebase Auth user: ${demoUser.email} (UID: ${user.uid})`);
      } catch (createError) {
        if (createError.code === 'auth/email-already-in-use') {
          console.log(`    ℹ️  User ${demoUser.email} already exists, will update...`);

          // Try to sign in with various possible passwords to get the user
          const possiblePasswords = ['WR2024', 'demo123', 'password123'];
          let signedIn = false;

          for (const password of possiblePasswords) {
            try {
              const userCredential = await signInWithEmailAndPassword(auth, demoUser.email, password);
              user = userCredential.user;
              signedIn = true;
              console.log(`    ✅ Signed in to existing user: ${demoUser.email}`);

              // Update password to the correct one
              if (password !== demoUser.password) {
                await updatePassword(user, demoUser.password);
                console.log(`    ✅ Updated password for ${demoUser.email}`);
              }
              break;
            } catch (signInError) {
              // Continue to next password
            }
          }

          if (!signedIn) {
            console.log(`    ❌ Could not sign in to ${demoUser.email} with any known password`);
            continue;
          }
        } else {
          throw createError;
        }
      }

      if (user) {
        // Create or update Firestore user document
        const userData = {
          email: demoUser.email,
          employeeId: demoUser.employeeId,
          name: demoUser.name,
          role: demoUser.role,
          department: demoUser.department,
          status: 'active',
          passwordSet: true,
          isTemporary: false,
          createdAt: isNewUser ? serverTimestamp() : undefined,
          updatedAt: serverTimestamp()
        };

        // Remove undefined fields
        Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

        await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
        console.log(`    ✅ ${isNewUser ? 'Created' : 'Updated'} Firestore document for ${demoUser.email}`);

        // Sign out after processing each user
        await signOut(auth);
      }

    } catch (error) {
      console.error(`    ❌ Error processing user ${demoUser.email}:`, error.message);
    }
  }
}

/**
 * Verify demo users are working
 */
async function verifyDemoUsers() {
  console.log('🔍 Verifying demo users...');
  
  for (const demoUser of DEMO_USERS) {
    try {
      // Test Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, demoUser.email, demoUser.password);
      const user = userCredential.user;
      
      // Check Firestore document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`  ✅ ${demoUser.email} - Auth: OK, Firestore: OK, Role: ${userData.role}, Employee ID: ${userData.employeeId}`);
      } else {
        console.log(`  ❌ ${demoUser.email} - Auth: OK, Firestore: MISSING`);
      }
      
      await signOut(auth);
      
    } catch (error) {
      console.log(`  ❌ ${demoUser.email} - Auth: FAILED (${error.message})`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Firebase Demo Users Setup Script');
  console.log('=====================================');
  
  try {
    // Step 1: Cleanup existing users
    await cleanupExistingUsers();
    console.log('');
    
    // Step 2: Create new demo users
    await createDemoUsers();
    console.log('');
    
    // Step 3: Verify setup
    await verifyDemoUsers();
    console.log('');
    
    console.log('✅ Demo users setup completed successfully!');
    console.log('');
    console.log('🎯 You can now use the Quick Demo Access buttons in the app:');
    console.log('   👑 Admin (A0001) - admin@mysteel.com');
    console.log('   💼 Sales (S0001) - sales@mysteel.com');
    console.log('   🎨 Design (D0001) - design@mysteel.com');
    console.log('   🏭 Production (P0001) - production@mysteel.com');
    console.log('   🔧 Installation (I0001) - installation@mysteel.com');
    console.log('');
    console.log('   Password for all demo users: WR2024');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
main().catch(console.error);
