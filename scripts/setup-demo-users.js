#!/usr/bin/env node

/**
 * Setup Demo Users for Employee ID Authentication
 * 
 * This script creates demo users with proper employee IDs and password hashes
 * for testing the new authentication system without Firebase Auth.
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc
} = require('firebase/firestore');

// Firebase configuration (you may need to update this with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your src/config/firebase.ts configuration
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Simple password hashing function (matches the one in passwordUtils.ts)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Use SHA-256 for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Demo users configuration
const demoUsers = [
  {
    employeeId: 'A0001',
    name: 'Admin User',
    role: 'admin',
    department: 'Administration'
  },
  {
    employeeId: 'S0001',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales'
  },
  {
    employeeId: 'D0001',
    name: 'Design Lead',
    role: 'designer',
    department: 'Design'
  },
  {
    employeeId: 'P0001',
    name: 'Production Manager',
    role: 'production',
    department: 'Production'
  },
  {
    employeeId: 'I0001',
    name: 'Installation Lead',
    role: 'installation',
    department: 'Installation'
  }
];

async function setupDemoUsers() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('🔐 Generating password hash for "WR2024"...');
    const passwordHash = await hashPassword('WR2024');
    console.log(`Password hash: ${passwordHash}`);

    console.log('\n👥 Setting up demo users...');
    
    for (const demoUser of demoUsers) {
      console.log(`\n📝 Processing ${demoUser.name} (${demoUser.employeeId})...`);
      
      // Check if user already exists
      const userRef = doc(db, 'users', demoUser.employeeId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const existingData = userDoc.data();
        console.log(`   ✅ User already exists`);
        console.log(`   📊 Current data:`, {
          name: existingData.name,
          role: existingData.role,
          status: existingData.status,
          passwordSet: existingData.passwordSet,
          hasPasswordHash: !!existingData.passwordHash
        });
        
        // Update password hash if missing or different
        if (!existingData.passwordHash || existingData.passwordHash !== passwordHash) {
          console.log(`   🔄 Updating password hash...`);
          await setDoc(userRef, {
            ...existingData,
            passwordHash,
            passwordSet: true,
            updatedAt: new Date()
          }, { merge: true });
          console.log(`   ✅ Password hash updated`);
        }
      } else {
        console.log(`   🆕 Creating new user...`);
        
        const userData = {
          employeeId: demoUser.employeeId,
          name: demoUser.name,
          role: demoUser.role,
          department: demoUser.department,
          status: 'active',
          passwordHash,
          passwordSet: true,
          isTemporary: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(userRef, userData);
        console.log(`   ✅ User created successfully`);
      }
    }

    console.log('\n🔍 Verifying demo users...');
    
    for (const demoUser of demoUsers) {
      const userRef = doc(db, 'users', demoUser.employeeId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const isValid = data.passwordHash === passwordHash && 
                       data.status === 'active' && 
                       data.passwordSet === true;
        
        console.log(`   ${isValid ? '✅' : '❌'} ${demoUser.employeeId}: ${data.name} - ${isValid ? 'Ready' : 'Issues detected'}`);
        
        if (!isValid) {
          console.log(`      Issues:`, {
            passwordHashMatch: data.passwordHash === passwordHash,
            isActive: data.status === 'active',
            passwordSet: data.passwordSet === true
          });
        }
      } else {
        console.log(`   ❌ ${demoUser.employeeId}: Not found`);
      }
    }

    console.log('\n🎉 Demo user setup completed!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('==========================');
    demoUsers.forEach(user => {
      console.log(`Employee ID: ${user.employeeId} | Password: WR2024 | Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error setting up demo users:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDemoUsers()
    .then(() => {
      console.log('\n✨ Setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDemoUsers, hashPassword };
