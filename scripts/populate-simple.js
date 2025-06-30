// Simplified Node.js script using Firebase Web SDK
// This doesn't require service account key, but has limitations
// Run with: node scripts/populate-simple.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Your Firebase configuration (using your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "221205163780",
  appId: "1:221205163780:web:52417a0db2f048ed962a51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// User data for Mysteel Construction
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
    name: 'Installation Supervisor',
    role: 'installation',
    department: 'Installation',
    status: 'active'
  }
];

// Sample projects data
const projects = [
  {
    name: 'Warehouse Racking System - KL',
    description: 'Complete warehouse racking solution for Kuala Lumpur facility',
    amount: 150000,
    completionDate: '2025-03-15',
    status: 'sales',
    progress: 10,
    createdBy: 'sales@mysteel.com'
  },
  {
    name: 'Industrial Storage - Johor',
    description: 'Heavy-duty industrial storage system for manufacturing plant',
    amount: 280000,
    completionDate: '2025-04-20',
    status: 'dne',
    progress: 25,
    createdBy: 'sales@mysteel.com'
  },
  {
    name: 'Cold Storage Racking - Penang',
    description: 'Specialized cold storage racking system with temperature resistance',
    amount: 320000,
    completionDate: '2025-02-28',
    status: 'production',
    progress: 60,
    createdBy: 'sales@mysteel.com'
  },
  {
    name: 'Automated Storage - Selangor',
    description: 'Automated storage and retrieval system integration',
    amount: 450000,
    completionDate: '2025-05-10',
    status: 'installation',
    progress: 85,
    createdBy: 'sales@mysteel.com'
  },
  {
    name: 'Retail Display System - Melaka',
    description: 'Custom retail display and storage solution',
    amount: 95000,
    completionDate: '2024-12-15',
    status: 'completed',
    progress: 100,
    createdBy: 'sales@mysteel.com'
  }
];

async function createUsers() {
  console.log('🔥 Creating Firebase Auth users and Firestore profiles...');
  const createdUsers = [];

  for (const userData of users) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      console.log(`✅ Firebase Auth user created: ${userCredential.user.uid}`);

      // Create Firestore user profile using UID as document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        status: userData.status,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      console.log(`✅ Firestore profile created with UID: ${userCredential.user.uid}`);

      createdUsers.push({
        uid: userCredential.user.uid,
        ...userData
      });

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function createProjects() {
  console.log('📋 Creating sample projects...');
  const createdProjects = [];

  for (const projectData of projects) {
    try {
      const projectDoc = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Created project: ${projectData.name} (${projectData.status})`);
      
      createdProjects.push({
        id: projectDoc.id,
        ...projectData
      });

    } catch (error) {
      console.error(`❌ Error creating project ${projectData.name}:`, error.message);
    }
  }

  return createdProjects;
}

async function createComplaints(createdProjects, createdUsers) {
  console.log('📝 Creating sample complaints...');
  
  const complaints = [
    {
      title: 'Delayed Installation Schedule',
      description: 'Installation team arrived 2 days late, causing project delays',
      customerName: 'ABC Manufacturing Sdn Bhd',
      projectId: createdProjects[3]?.id || '',
      status: 'open',
      priority: 'high',
      department: 'installation',
      createdBy: createdUsers.find(u => u.role === 'sales')?.uid || ''
    },
    {
      title: 'Design Specification Issue',
      description: 'Racking dimensions do not match warehouse specifications',
      customerName: 'XYZ Logistics Sdn Bhd',
      projectId: createdProjects[1]?.id || '',
      status: 'in-progress',
      priority: 'medium',
      department: 'designer',
      createdBy: createdUsers.find(u => u.role === 'designer')?.uid || ''
    },
    {
      title: 'Quality Control Concern',
      description: 'Some welding joints show signs of poor quality',
      customerName: 'DEF Storage Solutions',
      projectId: createdProjects[2]?.id || '',
      status: 'resolved',
      priority: 'high',
      department: 'production',
      createdBy: createdUsers.find(u => u.role === 'production')?.uid || ''
    }
  ];

  for (const complaintData of complaints) {
    try {
      await addDoc(collection(db, 'complaints'), {
        ...complaintData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Created complaint: ${complaintData.title} (${complaintData.department})`);

    } catch (error) {
      console.error(`❌ Error creating complaint:`, error.message);
    }
  }
}

async function populateFirestore() {
  try {
    console.log('🚀 Starting Firestore population for mysteel Construction...\n');

    // 1. Create users
    const createdUsers = await createUsers();
    console.log(`\n👥 Created ${createdUsers.length} users\n`);

    // 2. Create projects
    const createdProjects = await createProjects();
    console.log(`\n📋 Created ${createdProjects.length} projects\n`);

    // 3. Create complaints
    await createComplaints(createdProjects, createdUsers);
    console.log(`\n📝 Created sample complaints\n`);

    console.log('🎉 Firestore population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Projects: ${createdProjects.length}`);
    console.log(`   - Complaints: 3`);
    
    console.log('\n🔐 Login Credentials:');
    createdUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.email} | ${user.password}`);
    });

  } catch (error) {
    console.error('💥 Error during Firestore population:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
populateFirestore();
