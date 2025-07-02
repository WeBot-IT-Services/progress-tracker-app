// Script to populate Firestore with initial data for mysteel Construction
// Run this script after clearing Firestore data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBOqKHgOGKJOGKJOGKJOGKJOGKJOGKJOGK",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// User data to create
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

// Sample complaints data
const complaints = [
  {
    title: 'Delayed Installation Schedule',
    description: 'Installation team arrived 2 days late, causing project delays',
    customerName: 'ABC Manufacturing Sdn Bhd',
    projectId: '', // Will be filled after projects are created
    status: 'open',
    priority: 'high',
    department: 'installation',
    createdBy: 'sales@mysteel.com'
  },
  {
    title: 'Design Specification Issue',
    description: 'Racking dimensions do not match warehouse specifications',
    customerName: 'XYZ Logistics Sdn Bhd',
    projectId: '', // Will be filled after projects are created
    status: 'in-progress',
    priority: 'medium',
    department: 'designer',
    createdBy: 'design@mysteel.com'
  },
  {
    title: 'Quality Control Concern',
    description: 'Some welding joints show signs of poor quality',
    customerName: 'DEF Storage Solutions',
    projectId: '', // Will be filled after projects are created
    status: 'resolved',
    priority: 'high',
    department: 'production',
    createdBy: 'production@mysteel.com'
  }
];

async function populateFirestore() {
  console.log('🚀 Starting Firestore population for mysteel Construction...');
  
  try {
    // 1. Create Firebase Auth users and Firestore user profiles
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of users) {
      try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        );
        
        // Create Firestore user profile
        const userDoc = await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          status: userData.status,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        
        createdUsers.push({
          id: userDoc.id,
          uid: userCredential.user.uid,
          ...userData
        });
        
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
    
    // 2. Create projects
    console.log('📋 Creating projects...');
    const createdProjects = [];
    
    for (const projectData of projects) {
      try {
        const projectDoc = await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        createdProjects.push({
          id: projectDoc.id,
          ...projectData
        });
        
        console.log(`✅ Created project: ${projectData.name} (${projectData.status})`);
      } catch (error) {
        console.error(`❌ Error creating project ${projectData.name}:`, error.message);
      }
    }
    
    // 3. Create complaints (link to projects)
    console.log('📝 Creating complaints...');
    
    for (let i = 0; i < complaints.length; i++) {
      try {
        const complaintData = {
          ...complaints[i],
          projectId: createdProjects[i]?.id || createdProjects[0]?.id, // Link to a project
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const complaintDoc = await addDoc(collection(db, 'complaints'), complaintData);
        
        console.log(`✅ Created complaint: ${complaintData.title} (${complaintData.department})`);
      } catch (error) {
        console.error(`❌ Error creating complaint:`, error.message);
      }
    }
    
    console.log('🎉 Firestore population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Projects: ${createdProjects.length}`);
    console.log(`   - Complaints: ${complaints.length}`);
    
  } catch (error) {
    console.error('💥 Error during Firestore population:', error);
  }
}

// Run the population script
populateFirestore();
