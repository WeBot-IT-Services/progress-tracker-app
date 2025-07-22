#!/usr/bin/env node

/**
 * Clean up old users and create fresh user accounts
 */

const admin = require('firebase-admin');
const { getDefaultPassword } = require('../src/config/defaults.ts');

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

async function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function cleanupOldUsers() {
  console.log('🗑️ Cleaning up old users...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    
    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Deleted ${usersSnapshot.docs.length} old users`);
  } catch (error) {
    console.error('❌ Error cleaning up users:', error);
  }
}

async function createNewUsers() {
  console.log('👥 Creating new user accounts...');
  
  const defaultPassword = 'WR2024';
  const hashedPassword = await hashPassword(defaultPassword);
  
  const users = [
    {
      employeeId: 'A0001',
      name: 'Admin User',
      email: 'admin@mysteel.com',
      role: 'admin',
      department: 'Administration',
      status: 'active',
      passwordHash: hashedPassword,
      passwordSet: true,
      isTemporary: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      employeeId: 'S0001',
      name: 'Sales Manager',
      email: 'sales@mysteel.com',
      role: 'sales',
      department: 'Sales',
      status: 'active',
      passwordHash: hashedPassword,
      passwordSet: true,
      isTemporary: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      employeeId: 'D0001',
      name: 'Design Lead',
      email: 'design@mysteel.com',
      role: 'designer',
      department: 'Design',
      status: 'active',
      passwordHash: hashedPassword,
      passwordSet: true,
      isTemporary: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      employeeId: 'P0001',
      name: 'Production Manager',
      email: 'production@mysteel.com',
      role: 'production',
      department: 'Production',
      status: 'active',
      passwordHash: hashedPassword,
      passwordSet: true,
      isTemporary: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      employeeId: 'I0001',
      name: 'Installation Lead',
      email: 'installation@mysteel.com',
      role: 'installation',
      department: 'Installation',
      status: 'active',
      passwordHash: hashedPassword,
      passwordSet: true,
      isTemporary: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  try {
    const batch = db.batch();
    
    users.forEach(user => {
      const userRef = db.collection('users').doc(user.employeeId);
      batch.set(userRef, user);
    });
    
    await batch.commit();
    console.log(`✅ Created ${users.length} new users`);
    
    console.log('\n👥 User Accounts Created:');
    users.forEach(user => {
      console.log(`   ${user.employeeId} - ${user.name} (${user.role}) - Password: ${defaultPassword}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  }
}

async function main() {
  console.log('🚀 Starting User Cleanup and Setup');
  console.log('===================================');
  
  await cleanupOldUsers();
  await createNewUsers();
  
  console.log('\n✅ User cleanup and setup completed!');
  console.log('\n📋 Login Credentials:');
  console.log('Employee ID: A0001 | Password: WR2024 | Role: Admin');
  console.log('Employee ID: S0001 | Password: WR2024 | Role: Sales');
  console.log('Employee ID: D0001 | Password: WR2024 | Role: Designer');
  console.log('Employee ID: P0001 | Password: WR2024 | Role: Production');
  console.log('Employee ID: I0001 | Password: WR2024 | Role: Installation');
  
  process.exit(0);
}

main().catch(console.error);
