#!/usr/bin/env node

/**
 * Fix Employee ID Authentication Script
 * 
 * This script updates the Firebase user documents to include proper employee IDs
 * and creates the missing installation user account.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';

// Firebase configuration (same as in the app)
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

// User data with employee IDs
const usersWithEmployeeIds = [
  {
    email: 'admin@mysteel.com',
    password: 'WR2024',
    employeeId: 'A0001',
    name: 'Admin User',
    role: 'admin',
    department: 'Administration'
  },
  {
    email: 'sales@mysteel.com',
    password: 'WR2024',
    employeeId: 'S0001',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales'
  },
  {
    email: 'design@mysteel.com',
    password: 'WR2024',
    employeeId: 'D0001',
    name: 'Design Engineer',
    role: 'designer',
    department: 'Design'
  },
  {
    email: 'production@mysteel.com',
    password: 'WR2024',
    employeeId: 'P0001',
    name: 'Production Manager',
    role: 'production',
    department: 'Production'
  },
  {
    email: 'installation@mysteel.com',
    password: 'WR2024',
    employeeId: 'I0001',
    name: 'Installation Manager',
    role: 'installation',
    department: 'Installation'
  }
];

async function updateUserWithEmployeeId(userEmail, employeeId) {
  try {
    console.log(`🔍 Looking for user: ${userEmail}`);
    
    // Query users collection by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`📝 Updating user ${userEmail} with employee ID: ${employeeId}`);
      
      // Update the user document with employee ID
      await updateDoc(doc(db, 'users', userDoc.id), {
        employeeId: employeeId,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Updated ${userEmail} with employee ID: ${employeeId}`);
      return true;
    } else {
      console.log(`❌ User not found: ${userEmail}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating user ${userEmail}:`, error);
    return false;
  }
}

async function createMissingUser(userData) {
  try {
    console.log(`🔍 Creating missing user: ${userData.email}`);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;
    
    console.log(`✅ Created Firebase Auth user: ${userData.email}`);
    
    // Create Firestore user document
    await setDoc(doc(db, 'users', user.uid), {
      email: userData.email,
      employeeId: userData.employeeId,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Created Firestore document for: ${userData.email}`);
    return true;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ User already exists in Auth: ${userData.email}`);
      // Try to sign in and update Firestore document
      try {
        const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          email: userData.email,
          employeeId: userData.employeeId,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Updated Firestore document for existing user: ${userData.email}`);
        return true;
      } catch (signInError) {
        console.error(`❌ Error signing in to update user ${userData.email}:`, signInError);
        return false;
      }
    } else {
      console.error(`❌ Error creating user ${userData.email}:`, error);
      return false;
    }
  }
}

async function fixEmployeeIdAuthentication() {
  console.log('🔧 Starting Employee ID Authentication Fix...\n');
  
  let successCount = 0;
  let totalCount = usersWithEmployeeIds.length;
  
  for (const userData of usersWithEmployeeIds) {
    console.log(`\n📋 Processing: ${userData.email} (${userData.employeeId})`);
    
    // First try to update existing user
    const updated = await updateUserWithEmployeeId(userData.email, userData.employeeId);
    
    if (!updated) {
      // If user doesn't exist, create it
      const created = await createMissingUser(userData);
      if (created) successCount++;
    } else {
      successCount++;
    }
  }
  
  console.log('\n📊 EMPLOYEE ID FIX SUMMARY');
  console.log('==========================');
  console.log(`✅ Successfully processed: ${successCount}/${totalCount} users`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} users`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All users now have employee IDs!');
    console.log('\n📝 You can now login with:');
    usersWithEmployeeIds.forEach(user => {
      console.log(`   Employee ID: ${user.employeeId} | Email: ${user.email} | Password: ${user.password}`);
    });
  } else {
    console.log('\n⚠️ Some users could not be processed. Check the errors above.');
  }
}

// Run the fix
fixEmployeeIdAuthentication()
  .then(() => {
    console.log('\n✅ Employee ID authentication fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Employee ID authentication fix failed:', error);
    process.exit(1);
  });
