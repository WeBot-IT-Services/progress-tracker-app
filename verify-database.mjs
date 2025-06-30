#!/usr/bin/env node

/**
 * Database Verification Script
 * 
 * This script checks what data currently exists in the Firebase database
 * and provides a status report.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

// Firebase configuration
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

// Test credentials - Production passwords
const testCredentials = [
  { email: 'admin@mysteel.com', password: 'MS2024!Admin#Secure', role: 'admin' },
  { email: 'sales@mysteel.com', password: 'MS2024!Sales#Manager', role: 'sales' },
  { email: 'design@mysteel.com', password: 'MS2024!Design#Engineer', role: 'designer' },
  { email: 'production@mysteel.com', password: 'MS2024!Prod#Manager', role: 'production' },
  { email: 'installation@mysteel.com', password: 'MS2024!Install#Super', role: 'installation' }
];

async function verifyAuthentication() {
  console.log('🔐 Verifying Authentication...');
  console.log('==============================');
  
  const results = [];
  
  for (const cred of testCredentials) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cred.email, cred.password);
      console.log(`✅ ${cred.role.toUpperCase().padEnd(12)} | ${cred.email.padEnd(25)} | Login successful`);
      results.push({ ...cred, status: 'success', uid: userCredential.user.uid });
    } catch (error) {
      console.log(`❌ ${cred.role.toUpperCase().padEnd(12)} | ${cred.email.padEnd(25)} | ${error.message}`);
      results.push({ ...cred, status: 'failed', error: error.message });
    }
  }
  
  return results;
}

async function verifyCollections() {
  console.log('\n📊 Verifying Database Collections...');
  console.log('====================================');
  
  const collections = ['users', 'projects', 'complaints', 'milestones'];
  const results = {};
  
  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      console.log(`✅ ${collectionName.padEnd(12)} | ${snapshot.size} documents`);
      results[collectionName] = { count: snapshot.size, status: 'success' };
    } catch (error) {
      console.log(`❌ ${collectionName.padEnd(12)} | Error: ${error.message}`);
      results[collectionName] = { count: 0, status: 'error', error: error.message };
    }
  }
  
  return results;
}

async function verifyProjects() {
  console.log('\n📋 Project Details...');
  console.log('=====================');
  
  try {
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    
    if (snapshot.empty) {
      console.log('⚠️ No projects found in database');
      return [];
    }
    
    const projects = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      projects.push({ id: doc.id, ...data });
      console.log(`📄 ${data.name || 'Unnamed Project'}`);
      console.log(`   Status: ${data.status || 'Unknown'} | Progress: ${data.progress || 0}%`);
      if (data.amount) {
        console.log(`   Amount: RM ${data.amount.toLocaleString()}`);
      }
      console.log('');
    });
    
    return projects;
  } catch (error) {
    console.log(`❌ Error fetching projects: ${error.message}`);
    return [];
  }
}

async function verifyComplaints() {
  console.log('\n📝 Complaint Details...');
  console.log('=======================');
  
  try {
    const snapshot = await getDocs(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')));
    
    if (snapshot.empty) {
      console.log('⚠️ No complaints found in database');
      return [];
    }
    
    const complaints = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      complaints.push({ id: doc.id, ...data });
      console.log(`📋 ${data.title || 'Untitled Complaint'}`);
      console.log(`   Status: ${data.status || 'Unknown'} | Priority: ${data.priority || 'Unknown'}`);
      console.log(`   Description: ${(data.description || '').substring(0, 60)}...`);
      console.log('');
    });
    
    return complaints;
  } catch (error) {
    console.log(`❌ Error fetching complaints: ${error.message}`);
    return [];
  }
}

async function generateReport(authResults, collectionResults, projects, complaints) {
  console.log('\n📊 DATABASE STATUS REPORT');
  console.log('=========================');
  
  // Authentication Summary
  const successfulLogins = authResults.filter(r => r.status === 'success').length;
  console.log(`🔐 Authentication: ${successfulLogins}/${authResults.length} accounts working`);
  
  // Collection Summary
  const totalDocuments = Object.values(collectionResults).reduce((sum, col) => sum + col.count, 0);
  console.log(`📊 Total Documents: ${totalDocuments}`);
  
  Object.entries(collectionResults).forEach(([name, result]) => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${status} ${name}: ${result.count} documents`);
  });
  
  // Data Quality Assessment
  console.log('\n🎯 Data Quality Assessment:');
  
  if (successfulLogins === 5) {
    console.log('✅ All test accounts are working');
  } else {
    console.log('⚠️ Some test accounts need to be created');
  }
  
  if (projects.length >= 3) {
    console.log('✅ Sufficient project data for testing');
  } else {
    console.log('⚠️ More project data needed for comprehensive testing');
  }
  
  if (complaints.length >= 2) {
    console.log('✅ Sufficient complaint data for testing');
  } else {
    console.log('⚠️ More complaint data needed for testing');
  }
  
  // Overall Status
  console.log('\n🏆 Overall Status:');
  if (successfulLogins === 5 && totalDocuments >= 10) {
    console.log('🎉 Database is ready for testing!');
    console.log('✅ All test accounts working');
    console.log('✅ Sufficient sample data available');
    console.log('✅ Ready for comprehensive application testing');
  } else if (successfulLogins >= 3 && totalDocuments >= 5) {
    console.log('⚠️ Database is partially ready');
    console.log('🔧 Some setup may be needed for full functionality');
  } else {
    console.log('❌ Database needs setup');
    console.log('🔧 Run the browser console setup commands');
  }
  
  // Next Steps
  console.log('\n📝 Recommended Next Steps:');
  if (successfulLogins < 5) {
    console.log('1. Run setupCompleteDatabase() in browser console');
  }
  if (totalDocuments < 10) {
    console.log('2. Verify sample data creation completed');
  }
  console.log('3. Test login with each account');
  console.log('4. Run enableTestingMode() for full access');
  console.log('5. Test each module functionality');
}

async function main() {
  console.log('🔍 Firebase Database Verification');
  console.log('=================================\n');
  
  try {
    // Step 1: Verify authentication
    const authResults = await verifyAuthentication();
    
    // Step 2: Verify collections
    const collectionResults = await verifyCollections();
    
    // Step 3: Get detailed project info
    const projects = await verifyProjects();
    
    // Step 4: Get detailed complaint info
    const complaints = await verifyComplaints();
    
    // Step 5: Generate comprehensive report
    await generateReport(authResults, collectionResults, projects, complaints);
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check internet connection');
    console.log('2. Verify Firebase project is accessible');
    console.log('3. Try running the browser console setup instead');
  }
}

// Handle command line execution
main().catch(console.error);
