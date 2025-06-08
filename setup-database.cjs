#!/usr/bin/env node

/**
 * Mysteel Progress Tracker - Database Setup Script
 * 
 * This script automates the creation of test user accounts and sample data
 * using Firebase Admin SDK for production-ready database initialization.
 * 
 * Usage:
 *   node setup-database.js
 *   npm run setup
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "221205163780",
  appId: "1:221205163780:web:52417a0db2f048ed962a51"
};

// Initialize Firebase Admin SDK
let app;
try {
  // Try to initialize with service account (production)
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;
    
  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId
    });
  } else {
    // Fallback to application default credentials (development)
    app = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  console.log('💡 Make sure you have proper Firebase credentials configured.');
  console.log('   For development: Run "firebase login" and "firebase use mysteelprojecttracker"');
  console.log('   For production: Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  process.exit(1);
}

const auth = admin.auth();
const firestore = admin.firestore();

// Test user accounts
const testUsers = [
  {
    uid: 'admin-user-001',
    email: 'admin@mysteel.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    department: 'Administration'
  },
  {
    uid: 'sales-user-001',
    email: 'sales@mysteel.com',
    password: 'sales123',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales'
  },
  {
    uid: 'designer-user-001',
    email: 'designer@mysteel.com',
    password: 'designer123',
    name: 'Design Engineer',
    role: 'designer',
    department: 'Design & Engineering'
  },
  {
    uid: 'production-user-001',
    email: 'production@mysteel.com',
    password: 'production123',
    name: 'Production Manager',
    role: 'production',
    department: 'Production'
  },
  {
    uid: 'installation-user-001',
    email: 'installation@mysteel.com',
    password: 'installation123',
    name: 'Installation Supervisor',
    role: 'installation',
    department: 'Installation'
  }
];

// Sample projects data
const sampleProjects = [
  {
    name: 'Mysteel Office Complex',
    description: 'Modern office building with steel framework',
    amount: 2500000,
    completionDate: '2024-12-15',
    status: 'Production',
    priority: 'high',
    progress: 65,
    createdBy: 'sales-user-001'
  },
  {
    name: 'Industrial Warehouse Project',
    description: 'Large-scale warehouse construction',
    amount: 1800000,
    completionDate: '2024-11-30',
    status: 'DNE',
    priority: 'medium',
    progress: 25,
    createdBy: 'sales-user-001'
  },
  {
    name: 'Residential Tower Development',
    description: 'High-rise residential building',
    amount: 4200000,
    completionDate: '2025-03-20',
    status: 'Installation',
    priority: 'high',
    progress: 85,
    createdBy: 'sales-user-001'
  },
  {
    name: 'Shopping Mall Renovation',
    description: 'Steel structure renovation for shopping complex',
    amount: 3100000,
    completionDate: '2024-10-10',
    status: 'Completed',
    priority: 'medium',
    progress: 100,
    createdBy: 'sales-user-001'
  },
  {
    name: 'School Building Construction',
    description: 'Educational facility with modern steel framework',
    amount: 1500000,
    completionDate: '2024-12-30',
    status: 'Production',
    priority: 'medium',
    progress: 45,
    createdBy: 'sales-user-001'
  },
  {
    name: 'Hospital Wing Extension',
    description: 'Medical facility expansion project',
    amount: 2800000,
    completionDate: '2025-02-15',
    status: 'DNE',
    priority: 'high',
    progress: 15,
    createdBy: 'sales-user-001'
  }
];

// Sample complaints data
const sampleComplaints = [
  {
    title: 'Installation Delay Issue',
    description: 'Project installation is behind schedule due to weather conditions',
    status: 'open',
    priority: 'high',
    submittedBy: 'installation-user-001'
  },
  {
    title: 'Material Quality Concern',
    description: 'Some steel materials do not meet specified quality standards',
    status: 'in-progress',
    priority: 'medium',
    submittedBy: 'production-user-001'
  },
  {
    title: 'Communication Gap',
    description: 'Lack of coordination between design and production teams',
    status: 'resolved',
    priority: 'low',
    submittedBy: 'designer-user-001'
  },
  {
    title: 'Safety Protocol Violation',
    description: 'Safety procedures not being followed at installation site',
    status: 'open',
    priority: 'high',
    submittedBy: 'installation-user-001'
  },
  {
    title: 'Design Modification Request',
    description: 'Client requested changes to original design specifications',
    status: 'in-progress',
    priority: 'medium',
    submittedBy: 'sales-user-001'
  }
];

// Utility functions
const createReadlineInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

const askQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main setup functions
async function createTestUsers() {
  console.log('👥 Creating test user accounts...');
  
  const results = [];
  
  for (const userData of testUsers) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        uid: userData.uid,
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true
      });
      
      // Create user profile in Firestore
      await firestore.collection('users').doc(userData.uid).set({
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Created user: ${userData.email}`);
      results.push({ email: userData.email, status: 'success' });
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists: ${userData.email}`);
        results.push({ email: userData.email, status: 'exists' });
      } else {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
        results.push({ email: userData.email, status: 'error', error: error.message });
      }
    }
  }
  
  return results;
}

async function seedSampleData() {
  console.log('📊 Seeding sample data...');
  
  try {
    // Create projects
    console.log('  📋 Creating sample projects...');
    for (const projectData of sampleProjects) {
      await firestore.collection('projects').add({
        ...projectData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Created ${sampleProjects.length} sample projects`);
    
    // Create complaints
    console.log('  📝 Creating sample complaints...');
    for (const complaintData of sampleComplaints) {
      await firestore.collection('complaints').add({
        ...complaintData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Created ${sampleComplaints.length} sample complaints`);
    
    console.log('🎉 Sample data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to seed sample data:', error.message);
    throw error;
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check users
    const usersSnapshot = await firestore.collection('users').get();
    console.log(`✅ Users collection: ${usersSnapshot.size} documents`);
    
    // Check projects
    const projectsSnapshot = await firestore.collection('projects').get();
    console.log(`✅ Projects collection: ${projectsSnapshot.size} documents`);
    
    // Check complaints
    const complaintsSnapshot = await firestore.collection('complaints').get();
    console.log(`✅ Complaints collection: ${complaintsSnapshot.size} documents`);
    
    console.log('🎉 Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    throw error;
  }
}

async function displayCredentials() {
  console.log('\n🔑 Test Account Credentials:');
  console.log('============================');
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase().padEnd(12)} | ${user.email.padEnd(25)} | ${user.password}`);
  });
  console.log('');
}

async function resetDatabase() {
  console.log('🧹 Resetting database...');
  
  const rl = createReadlineInterface();
  const confirm = await askQuestion(rl, '⚠️ This will delete all test data. Are you sure? (yes/no): ');
  rl.close();
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Database reset cancelled.');
    return;
  }
  
  try {
    // Delete test users
    for (const userData of testUsers) {
      try {
        await auth.deleteUser(userData.uid);
        await firestore.collection('users').doc(userData.uid).delete();
        console.log(`✅ Deleted user: ${userData.email}`);
      } catch (error) {
        console.log(`⚠️ User not found: ${userData.email}`);
      }
    }
    
    // Delete collections
    const collections = ['projects', 'complaints', 'milestones'];
    for (const collectionName of collections) {
      const snapshot = await firestore.collection(collectionName).get();
      const batch = firestore.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ Cleared collection: ${collectionName}`);
    }
    
    console.log('🎉 Database reset completed!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Mysteel Progress Tracker - Database Setup');
  console.log('===========================================\n');
  
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--reset')) {
      await resetDatabase();
      return;
    }
    
    if (args.includes('--verify')) {
      await verifySetup();
      return;
    }
    
    if (args.includes('--credentials')) {
      await displayCredentials();
      return;
    }
    
    // Default: Full setup
    console.log('📋 Starting complete database setup...\n');
    
    // Step 1: Create test users
    const userResults = await createTestUsers();
    
    // Step 2: Seed sample data
    await seedSampleData();
    
    // Step 3: Verify setup
    await verifySetup();
    
    // Step 4: Display credentials
    await displayCredentials();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:5173');
    console.log('3. Login with any of the test accounts above');
    console.log('4. Test the application functionality');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTestUsers,
  seedSampleData,
  verifySetup,
  resetDatabase,
  displayCredentials
};
