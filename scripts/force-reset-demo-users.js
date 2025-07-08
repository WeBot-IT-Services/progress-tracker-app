#!/usr/bin/env node

/**
 * Force Reset Demo Users Script
 * 
 * This script uses Firebase Admin SDK to forcefully delete and recreate demo users
 * without needing to know their current passwords.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
// Note: You'll need to download the service account key from Firebase Console
// and place it in the scripts directory as 'firebase-admin-key.json'
try {
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'firebase-admin-key.json'), 'utf8')
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'mysteelprojecttracker'
  });
  
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK');
  console.error('Please download the service account key from Firebase Console:');
  console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.error('2. Click "Generate new private key"');
  console.error('3. Save the file as "scripts/firebase-admin-key.json"');
  console.error('');
  console.error('Falling back to client SDK method...');
  
  // Fall back to the client SDK approach
  await fallbackClientMethod();
  process.exit(0);
}

const auth = admin.auth();
const db = admin.firestore();

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
 * Force delete users using Admin SDK
 */
async function forceDeleteUsers() {
  console.log('🗑️  Force deleting existing demo users...');
  
  for (const demoUser of DEMO_USERS) {
    try {
      // Get user by email
      const userRecord = await auth.getUserByEmail(demoUser.email);
      
      console.log(`  🗑️  Deleting ${demoUser.email} (UID: ${userRecord.uid})`);
      
      // Delete Firestore document
      try {
        await db.collection('users').doc(userRecord.uid).delete();
        console.log(`    ✅ Deleted Firestore document`);
      } catch (firestoreError) {
        console.log(`    ⚠️  No Firestore document found`);
      }
      
      // Delete Firebase Auth user
      await auth.deleteUser(userRecord.uid);
      console.log(`    ✅ Deleted Firebase Auth user`);
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`    ℹ️  User ${demoUser.email} doesn't exist`);
      } else {
        console.log(`    ❌ Error deleting ${demoUser.email}:`, error.message);
      }
    }
  }
}

/**
 * Create demo users using Admin SDK
 */
async function createDemoUsers() {
  console.log('👥 Creating demo users...');
  
  for (const demoUser of DEMO_USERS) {
    try {
      console.log(`  🔐 Creating ${demoUser.email}`);
      
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: demoUser.email,
        password: demoUser.password,
        displayName: demoUser.name,
        emailVerified: true
      });
      
      console.log(`    ✅ Created Firebase Auth user (UID: ${userRecord.uid})`);
      
      // Create Firestore document
      const userData = {
        email: demoUser.email,
        employeeId: demoUser.employeeId,
        name: demoUser.name,
        role: demoUser.role,
        department: demoUser.department,
        status: 'active',
        passwordSet: true,
        isTemporary: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(userRecord.uid).set(userData);
      console.log(`    ✅ Created Firestore document`);
      
    } catch (error) {
      console.error(`    ❌ Error creating ${demoUser.email}:`, error.message);
    }
  }
}

/**
 * Verify demo users
 */
async function verifyDemoUsers() {
  console.log('🔍 Verifying demo users...');
  
  for (const demoUser of DEMO_USERS) {
    try {
      const userRecord = await auth.getUserByEmail(demoUser.email);
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`  ✅ ${demoUser.email} - Auth: OK, Firestore: OK, Role: ${userData.role}, Employee ID: ${userData.employeeId}`);
      } else {
        console.log(`  ❌ ${demoUser.email} - Auth: OK, Firestore: MISSING`);
      }
    } catch (error) {
      console.log(`  ❌ ${demoUser.email} - Auth: FAILED (${error.message})`);
    }
  }
}

/**
 * Fallback method using client SDK
 */
async function fallbackClientMethod() {
  console.log('🔄 Using fallback client SDK method...');
  console.log('');
  console.log('Manual steps required:');
  console.log('1. Go to Firebase Console > Authentication > Users');
  console.log('2. Manually delete these users if they exist:');
  
  DEMO_USERS.forEach(user => {
    console.log(`   - ${user.email}`);
  });
  
  console.log('');
  console.log('3. Then run: npm run setup:demo-users');
  console.log('');
  console.log('Or set up Firebase Admin SDK by downloading the service account key.');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Force Reset Demo Users Script');
  console.log('==================================');
  
  try {
    await forceDeleteUsers();
    console.log('');
    
    await createDemoUsers();
    console.log('');
    
    await verifyDemoUsers();
    console.log('');
    
    console.log('✅ Demo users force reset completed successfully!');
    console.log('');
    console.log('🎯 You can now use the Quick Demo Access buttons in the app:');
    DEMO_USERS.forEach(user => {
      const icons = { admin: '👑', sales: '💼', designer: '🎨', production: '🏭', installation: '🔧' };
      console.log(`   ${icons[user.role]} ${user.name} (${user.employeeId}) - ${user.email}`);
    });
    console.log('');
    console.log('   Password for all demo users: WR2024');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
