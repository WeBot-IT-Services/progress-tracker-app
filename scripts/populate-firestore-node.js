// Node.js script to populate Firestore with mysteel Construction data
// Run with: node scripts/populate-firestore-node.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate new private key
const serviceAccount = require('./serviceAccountKey.json'); // You need to add this file

const app = initializeApp({
  credential: cert(serviceAccount),
  // Add your project ID here
  projectId: 'your-project-id'
});

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
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true
      });

      console.log(`✅ Firebase Auth user created: ${userRecord.uid}`);

      // Create Firestore user profile
      const userDoc = await db.collection('users').add({
        uid: userRecord.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        status: userData.status,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      });

      console.log(`✅ Firestore profile created: ${userDoc.id}`);

      createdUsers.push({
        id: userDoc.id,
        uid: userRecord.uid,
        ...userData
      });

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
      
      // If user already exists, try to get the existing user
      if (error.code === 'auth/email-already-exists') {
        try {
          const existingUser = await auth.getUserByEmail(userData.email);
          console.log(`ℹ️  User ${userData.email} already exists with UID: ${existingUser.uid}`);
          
          // Still create Firestore profile if it doesn't exist
          const userDoc = await db.collection('users').add({
            uid: existingUser.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            department: userData.department,
            status: userData.status,
            createdAt: Timestamp.now(),
            lastLogin: Timestamp.now()
          });

          createdUsers.push({
            id: userDoc.id,
            uid: existingUser.uid,
            ...userData
          });
        } catch (existingError) {
          console.error(`❌ Error handling existing user:`, existingError.message);
        }
      }
    }
  }

  return createdUsers;
}

async function createProjects() {
  console.log('📋 Creating sample projects...');
  const createdProjects = [];

  for (const projectData of projects) {
    try {
      const projectDoc = await db.collection('projects').add({
        ...projectData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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
      const complaintDoc = await db.collection('complaints').add({
        ...complaintData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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
