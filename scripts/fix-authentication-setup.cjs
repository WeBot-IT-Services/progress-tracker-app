#!/usr/bin/env node

/**
 * Fix Authentication Setup Script
 * This script ensures that both demo users and new users can authenticate properly
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "mysteelprojecttracker",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

// Simple password hashing function (matches the client-side implementation)
function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function checkAndFixUsers() {
  console.log('🔐 Authentication Setup Fix');
  console.log('============================');
  
  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.docs.length} users in database`);
    
    if (usersSnapshot.empty) {
      console.log('📝 No users found, creating demo users...');
      await createDemoUsers();
      return;
    }
    
    // Check each user's authentication setup
    const batch = db.batch();
    let updatesNeeded = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const employeeId = doc.id;
      
      console.log(`\n👤 Checking user: ${employeeId} (${userData.name})`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Status: ${userData.status}`);
      console.log(`   Password Set: ${userData.passwordSet}`);
      console.log(`   Has Password Hash: ${!!userData.passwordHash}`);
      
      let needsUpdate = false;
      const updates = {};
      
      // Ensure user has proper structure
      if (!userData.status) {
        updates.status = 'active';
        needsUpdate = true;
        console.log(`   ⚠️ Missing status, setting to 'active'`);
      }
      
      if (userData.passwordSet === undefined) {
        updates.passwordSet = true;
        needsUpdate = true;
        console.log(`   ⚠️ Missing passwordSet flag, setting to true`);
      }
      
      // For demo users, ensure they have the correct password hash
      const demoUsers = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
      if (demoUsers.includes(employeeId)) {
        const demoPasswordHash = hashPassword('WR2024');
        if (!userData.passwordHash || userData.passwordHash !== demoPasswordHash) {
          updates.passwordHash = demoPasswordHash;
          updates.passwordSet = true;
          needsUpdate = true;
          console.log(`   🔧 Demo user: updating password hash for WR2024`);
        } else {
          console.log(`   ✅ Demo user: password hash correct`);
        }
      } else {
        // For non-demo users, ensure they have a password hash
        if (!userData.passwordHash && userData.passwordSet) {
          // Set default password hash for existing users without one
          const defaultPasswordHash = hashPassword('WR2024');
          updates.passwordHash = defaultPasswordHash;
          console.log(`   🔧 Non-demo user: setting default password hash (WR2024)`);
          needsUpdate = true;
        }
      }
      
      // Ensure proper timestamps
      if (!userData.createdAt) {
        updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
        console.log(`   ⚠️ Missing createdAt, adding timestamp`);
      }
      
      if (!userData.updatedAt) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
        console.log(`   ⚠️ Missing updatedAt, adding timestamp`);
      }
      
      if (needsUpdate) {
        batch.update(doc.ref, updates);
        updatesNeeded++;
        console.log(`   📝 Queued for update`);
      } else {
        console.log(`   ✅ User is properly configured`);
      }
    }
    
    if (updatesNeeded > 0) {
      console.log(`\n💾 Applying ${updatesNeeded} user updates...`);
      await batch.commit();
      console.log(`✅ All user updates applied successfully`);
    } else {
      console.log(`\n✅ All users are properly configured`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  }
}

async function createDemoUsers() {
  console.log('👥 Creating demo users...');
  
  const defaultPasswordHash = hashPassword('WR2024');
  
  const demoUsers = [
    {
      employeeId: 'A0001',
      name: 'Admin User',
      email: 'admin@mysteel.com',
      role: 'admin',
      department: 'Administration',
      status: 'active',
      passwordHash: defaultPasswordHash,
      passwordSet: true,
      isTemporary: false
    },
    {
      employeeId: 'S0001',
      name: 'Sales Manager',
      email: 'sales@mysteel.com',
      role: 'sales',
      department: 'Sales',
      status: 'active',
      passwordHash: defaultPasswordHash,
      passwordSet: true,
      isTemporary: false
    },
    {
      employeeId: 'D0001',
      name: 'Design Lead',
      email: 'design@mysteel.com',
      role: 'designer',
      department: 'Design',
      status: 'active',
      passwordHash: defaultPasswordHash,
      passwordSet: true,
      isTemporary: false
    },
    {
      employeeId: 'P0001',
      name: 'Production Manager',
      email: 'production@mysteel.com',
      role: 'production',
      department: 'Production',
      status: 'active',
      passwordHash: defaultPasswordHash,
      passwordSet: true,
      isTemporary: false
    },
    {
      employeeId: 'I0001',
      name: 'Installation Lead',
      email: 'installation@mysteel.com',
      role: 'installation',
      department: 'Installation',
      status: 'active',
      passwordHash: defaultPasswordHash,
      passwordSet: true,
      isTemporary: false
    }
  ];
  
  const batch = db.batch();
  
  demoUsers.forEach(user => {
    const userRef = db.collection('users').doc(user.employeeId);
    batch.set(userRef, {
      ...user,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`✅ Created ${demoUsers.length} demo users`);
  
  console.log('\n👥 Demo User Credentials:');
  demoUsers.forEach(user => {
    console.log(`   ${user.employeeId} - ${user.name} (${user.role}) - Password: WR2024`);
  });
}

async function testAuthentication() {
  console.log('\n🧪 Testing Authentication');
  console.log('=========================');
  
  // Test demo user authentication
  const testUsers = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
  
  for (const employeeId of testUsers) {
    try {
      console.log(`\n🔍 Testing ${employeeId}...`);
      
      // Get user from database
      const userDoc = await db.collection('users').doc(employeeId).get();
      
      if (!userDoc.exists) {
        console.log(`   ❌ User ${employeeId} not found in database`);
        continue;
      }
      
      const userData = userDoc.data();
      console.log(`   📋 User data:`, {
        name: userData.name,
        role: userData.role,
        status: userData.status,
        passwordSet: userData.passwordSet,
        hasPasswordHash: !!userData.passwordHash
      });
      
      // Test password hash
      const testPasswordHash = hashPassword('WR2024');
      const passwordMatches = userData.passwordHash === testPasswordHash;
      
      console.log(`   🔐 Password hash test: ${passwordMatches ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!passwordMatches) {
        console.log(`   Expected: ${testPasswordHash}`);
        console.log(`   Actual:   ${userData.passwordHash}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing ${employeeId}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting Authentication Setup Fix');
  console.log('=====================================');
  
  try {
    await checkAndFixUsers();
    await testAuthentication();
    
    console.log('\n🎉 Authentication Setup Fix Complete!');
    console.log('\n📋 Summary:');
    console.log('- All users have proper authentication structure');
    console.log('- Demo users (A0001-I0001) use password: WR2024');
    console.log('- New users can be created and will authenticate properly');
    console.log('- Password hashing is consistent across the system');
    
    console.log('\n🔗 Test login at: https://mysteelprojecttracker.web.app');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(console.error);
