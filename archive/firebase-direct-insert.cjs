#!/usr/bin/env node

/**
 * Firebase Direct Insert Script
 * 
 * This script directly inserts test data to Firebase using Admin SDK
 * without requiring browser-based authentication.
 */

const admin = require('firebase-admin');

// Firebase configuration
const firebaseConfig = {
  projectId: "mysteelprojecttracker",
  // We'll use application default credentials or service account
};

// Initialize Firebase Admin SDK
let app;
try {
  // Try to use application default credentials first
  app = admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
  console.log('✅ Firebase Admin SDK initialized with default credentials');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  console.log('\n💡 Setup Instructions:');
  console.log('1. Install Firebase CLI: npm install -g firebase-tools');
  console.log('2. Login to Firebase: firebase login');
  console.log('3. Set project: firebase use mysteelprojecttracker');
  console.log('4. Run this script again');
  process.exit(1);
}

const auth = admin.auth();
const firestore = admin.firestore();

// Test users data
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
  }
];

// Create test users
async function createTestUsers() {
  console.log('👥 Creating test user accounts...');
  
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
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists: ${userData.email}`);
        
        // Update Firestore profile even if auth user exists
        try {
          await firestore.collection('users').doc(userData.uid).set({
            uid: userData.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log(`✅ Updated profile: ${userData.email}`);
        } catch (profileError) {
          console.error(`❌ Failed to update profile ${userData.email}:`, profileError.message);
        }
      } else {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }
  }
}

// Insert sample projects
async function insertSampleProjects() {
  console.log('📊 Inserting sample projects...');
  
  for (const projectData of sampleProjects) {
    try {
      const docRef = await firestore.collection('projects').add({
        ...projectData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Created project: ${projectData.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Failed to create project ${projectData.name}:`, error.message);
    }
  }
}

// Insert sample complaints
async function insertSampleComplaints() {
  console.log('📝 Inserting sample complaints...');
  
  for (const complaintData of sampleComplaints) {
    try {
      const docRef = await firestore.collection('complaints').add({
        ...complaintData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Created complaint: ${complaintData.title} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Failed to create complaint ${complaintData.title}:`, error.message);
    }
  }
}

// Verify data insertion
async function verifyData() {
  console.log('🔍 Verifying data insertion...');
  
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
    
    console.log('\n🎉 Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Data verification failed:', error.message);
  }
}

// Display login credentials
function displayCredentials() {
  console.log('\n🔑 Test Account Credentials:');
  console.log('============================');
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase().padEnd(12)} | ${user.email.padEnd(25)} | ${user.password}`);
  });
  console.log('');
}

// Main execution function
async function main() {
  console.log('🚀 Firebase Direct Insert Script');
  console.log('================================\n');
  
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--users-only')) {
      await createTestUsers();
      await verifyData();
      displayCredentials();
      return;
    }
    
    if (args.includes('--projects-only')) {
      await insertSampleProjects();
      await verifyData();
      return;
    }
    
    if (args.includes('--complaints-only')) {
      await insertSampleComplaints();
      await verifyData();
      return;
    }
    
    if (args.includes('--verify')) {
      await verifyData();
      displayCredentials();
      return;
    }
    
    // Default: Insert all data
    console.log('📋 Starting complete data insertion...\n');
    
    await createTestUsers();
    await insertSampleProjects();
    await insertSampleComplaints();
    await verifyData();
    displayCredentials();
    
    console.log('🎉 Firebase data insertion completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:5173');
    console.log('3. Login with any of the test accounts above');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTestUsers,
  insertSampleProjects,
  insertSampleComplaints,
  verifyData,
  displayCredentials
};
