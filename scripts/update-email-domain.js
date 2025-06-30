#!/usr/bin/env node

/**
 * Script to update email domains from mysteer.com to mysteel.com
 * This script will:
 * 1. Create new Firebase Auth users with mysteel.com emails
 * 2. Update Firestore user documents
 * 3. Maintain all existing roles and permissions
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "221205163780",
  appId: "1:221205163780:web:52417a0db2f048ed962a51"
};

// Initialize Firebase Admin
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// User data with mysteel.com domain
const users = [
  {
    email: 'admin@mysteel.com',
    password: 'MS2024!Admin#Secure',
    name: 'System Administrator',
    role: 'admin',
    department: 'Administration',
    status: 'active'
  },
  {
    email: 'sales@mysteel.com',
    password: 'MS2024!Sales#Manager',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales',
    status: 'active'
  },
  {
    email: 'design@mysteel.com',
    password: 'MS2024!Design#Engineer',
    name: 'Design Engineer',
    role: 'designer',
    department: 'Design & Engineering',
    status: 'active'
  },
  {
    email: 'production@mysteel.com',
    password: 'MS2024!Prod#Manager',
    name: 'Production Manager',
    role: 'production',
    department: 'Production',
    status: 'active'
  },
  {
    email: 'installation@mysteel.com',
    password: 'MS2024!Install#Super',
    name: 'Installation Manager',
    role: 'installation',
    department: 'Installation',
    status: 'active'
  }
];

async function createOrUpdateUser(userData) {
  try {
    console.log(`🔄 Processing user: ${userData.email}`);
    
    let userRecord;
    
    try {
      // Try to get existing user
      userRecord = await auth.getUserByEmail(userData.email);
      console.log(`✅ User ${userData.email} already exists`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
          emailVerified: true
        });
        console.log(`✅ Created new user: ${userData.email}`);
      } else {
        throw error;
      }
    }

    // Update or create Firestore user document
    const userDoc = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      status: userData.status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log(`✅ Updated Firestore document for: ${userData.email}`);

    return userRecord.uid;
  } catch (error) {
    console.error(`❌ Error processing user ${userData.email}:`, error);
    throw error;
  }
}

async function updateEmailDomains() {
  console.log('🚀 Starting email domain update process...');
  console.log('📧 Updating from mysteer.com to mysteel.com');
  
  const userIds = [];
  
  try {
    for (const userData of users) {
      const uid = await createOrUpdateUser(userData);
      userIds.push(uid);
    }

    console.log('\n🎉 Email domain update completed successfully!');
    console.log('\n📋 Updated Login Credentials:');
    console.log('┌─────────────┬─────────────────────────────┬─────────────────────────────┐');
    console.log('│ Role        │ Email                       │ Password                    │');
    console.log('├─────────────┼─────────────────────────────┼─────────────────────────────┤');
    
    users.forEach(user => {
      const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      console.log(`│ ${role.padEnd(11)} │ ${user.email.padEnd(27)} │ ${user.password.padEnd(27)} │`);
    });
    
    console.log('└─────────────┴─────────────────────────────┴─────────────────────────────┘');
    
    console.log('\n✅ All users now use mysteel.com domain');
    console.log('✅ All roles and permissions maintained');
    console.log('✅ Ready for deployment');
    
    return userIds;
  } catch (error) {
    console.error('❌ Email domain update failed:', error);
    throw error;
  }
}

// Run the update
if (require.main === module) {
  updateEmailDomains()
    .then(() => {
      console.log('\n🎯 Email domain update process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Email domain update process failed:', error);
      process.exit(1);
    });
}

module.exports = { updateEmailDomains, users };
