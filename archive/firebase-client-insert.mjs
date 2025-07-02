#!/usr/bin/env node

/**
 * Firebase Client Insert Script
 * 
 * This script uses Firebase Client SDK to insert test data directly
 * using the same configuration as the web app.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';

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

// Test users data with production credentials
const testUsers = [
  {
    uid: 'admin-user-001',
    email: 'admin@warehouseracking.my',
    password: 'WR2024!Admin#Secure',
    name: 'Admin User',
    role: 'admin',
    department: 'Administration'
  },
  {
    uid: 'sales-user-001',
    email: 'sales@warehouseracking.my',
    password: 'WR2024!Sales#Manager',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales'
  },
  {
    uid: 'designer-user-001',
    email: 'design@warehouseracking.my',
    password: 'WR2024!Design#Engineer',
    name: 'Design Engineer',
    role: 'designer',
    department: 'Design & Engineering'
  },
  {
    uid: 'production-user-001',
    email: 'production@warehouseracking.my',
    password: 'WR2024!Prod#Manager',
    name: 'Production Manager',
    role: 'production',
    department: 'Production'
  },
  {
    uid: 'installation-user-001',
    email: 'installation@warehouseracking.my',
    password: 'WR2024!Install#Super',
    name: 'Installation Supervisor',
    role: 'installation',
    department: 'Installation'
  }
];

// Sample projects data with proper status flow and data structures
const sampleProjects = [
  {
    name: 'Mysteel Office Complex',
    description: 'Modern office building with steel framework',
    amount: 2500000,
    completionDate: '2024-12-15',
    status: 'production',
    priority: 'high',
    progress: 65,
    createdBy: 'sales-user-001',
    designData: {
      status: 'completed',
      completedAt: new Date('2024-06-15'),
      lastModified: new Date('2024-06-15'),
      hasFlowedFromPartial: false
    },
    productionData: {
      assignedAt: new Date('2024-06-16'),
      lastModified: new Date('2024-08-01')
    }
  },
  {
    name: 'Industrial Warehouse Project',
    description: 'Large-scale warehouse construction',
    amount: 1800000,
    completionDate: '2024-11-30',
    status: 'dne',
    priority: 'medium',
    progress: 25,
    createdBy: 'sales-user-001',
    designData: {
      status: 'partial',
      partialCompletedAt: new Date('2024-07-10'),
      lastModified: new Date('2024-07-10'),
      hasFlowedFromPartial: false
    }
  },
  {
    name: 'Residential Tower Development',
    description: 'High-rise residential building',
    amount: 4200000,
    completionDate: '2025-03-20',
    status: 'installation',
    priority: 'high',
    progress: 85,
    createdBy: 'sales-user-001',
    designData: {
      status: 'completed',
      completedAt: new Date('2024-05-20'),
      lastModified: new Date('2024-05-20'),
      hasFlowedFromPartial: false
    },
    productionData: {
      assignedAt: new Date('2024-05-21'),
      lastModified: new Date('2024-07-15')
    },
    installationData: {
      milestoneProgress: {
        'foundation': { status: 'completed', completedAt: new Date('2024-08-01') },
        'structure': { status: 'in-progress', startedAt: new Date('2024-08-15') }
      },
      lastModified: new Date('2024-08-20')
    }
  },
  {
    name: 'Shopping Mall Renovation',
    description: 'Steel structure renovation for shopping complex',
    amount: 3100000,
    completionDate: '2024-10-10',
    status: 'completed',
    priority: 'medium',
    progress: 100,
    createdBy: 'sales-user-001',
    designData: {
      status: 'completed',
      completedAt: new Date('2024-04-10'),
      lastModified: new Date('2024-04-10'),
      hasFlowedFromPartial: false
    },
    productionData: {
      assignedAt: new Date('2024-04-11'),
      lastModified: new Date('2024-06-01')
    },
    installationData: {
      milestoneProgress: {
        'foundation': { status: 'completed', completedAt: new Date('2024-07-01') },
        'structure': { status: 'completed', completedAt: new Date('2024-08-15') },
        'finishing': { status: 'completed', completedAt: new Date('2024-09-30') }
      },
      lastModified: new Date('2024-10-01')
    }
  },
  {
    name: 'School Building Construction',
    description: 'Educational facility with modern steel framework',
    amount: 1500000,
    completionDate: '2024-12-30',
    status: 'production',
    priority: 'medium',
    progress: 45,
    createdBy: 'sales-user-001',
    designData: {
      status: 'completed',
      completedAt: new Date('2024-07-01'),
      lastModified: new Date('2024-07-01'),
      hasFlowedFromPartial: false
    },
    productionData: {
      assignedAt: new Date('2024-07-02'),
      lastModified: new Date('2024-08-15')
    }
  },
  {
    name: 'Community Center Project',
    description: 'Multi-purpose community facility',
    amount: 950000,
    completionDate: '2024-11-15',
    status: 'sales',
    priority: 'low',
    progress: 10,
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
  }
];

// Create test users
async function createTestUsers() {
  console.log('👥 Creating test user accounts...');
  
  for (const userData of testUsers) {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created user: ${userData.email} (UID: ${user.uid})`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists: ${userData.email}`);
        
        // Try to sign in and update profile
        try {
          const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
          const user = userCredential.user;
          
          // Update Firestore profile
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          console.log(`✅ Updated profile: ${userData.email}`);
        } catch (signInError) {
          console.error(`❌ Failed to sign in ${userData.email}:`, signInError.message);
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
  
  // Sign in as admin to insert projects
  try {
    await signInWithEmailAndPassword(auth, 'admin@warehouseracking.my', 'WR2024!Admin#Secure');
    console.log('🔐 Signed in as admin for project creation');
  } catch (error) {
    console.error('❌ Failed to sign in as admin:', error.message);
    return;
  }
  
  for (const projectData of sampleProjects) {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
      const docRef = await addDoc(collection(db, 'complaints'), {
        ...complaintData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`✅ Users collection: ${usersSnapshot.size} documents`);
    
    // Check projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log(`✅ Projects collection: ${projectsSnapshot.size} documents`);
    
    // Check complaints
    const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
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
  console.log('🚀 Firebase Client Insert Script');
  console.log('=================================\n');
  
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
    console.log('4. Run enableTestingMode() in browser console to access all modules');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
main().catch(console.error);
