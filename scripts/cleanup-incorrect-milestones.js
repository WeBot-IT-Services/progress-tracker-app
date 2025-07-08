#!/usr/bin/env node

/**
 * Cleanup script to remove incorrect default milestones
 * This script removes milestones with titles:
 * - Material Procurement
 * - Manufacturing  
 * - Quality Control
 * 
 * And keeps only:
 * - Painting
 * - Assembly/Welding
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyBvnW_lbGMfXEf0LMJbYPfNUJlRyJEu8lY",
  authDomain: "progress-tracker-app-73a00.firebaseapp.com",
  projectId: "progress-tracker-app-73a00",
  storageBucket: "progress-tracker-app-73a00.firebasestorage.app",
  messagingSenderId: "835720331279",
  appId: "1:835720331279:web:e2c4e8d77a4a72b8b90f11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const incorrectMilestoneTitles = [
  'Material Procurement',
  'Manufacturing',
  'Quality Control'
];

async function cleanupIncorrectMilestones() {
  try {
    console.log('🧹 Starting cleanup of incorrect default milestones...');
    
    let totalDeleted = 0;
    
    for (const title of incorrectMilestoneTitles) {
      console.log(`🔍 Looking for milestones with title: "${title}"`);
      
      const q = query(
        collection(db, 'milestones'),
        where('title', '==', title),
        where('module', '==', 'production')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`   ✅ No milestones found with title: "${title}"`);
        continue;
      }
      
      console.log(`   🗑️  Found ${querySnapshot.size} milestones with title: "${title}"`);
      
      const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
        const milestoneData = docSnapshot.data();
        console.log(`   🗑️  Deleting milestone: ${milestoneData.title} (Project: ${milestoneData.projectId})`);
        await deleteDoc(doc(db, 'milestones', docSnapshot.id));
        return 1;
      });
      
      const deletedCount = await Promise.all(deletePromises);
      totalDeleted += deletedCount.length;
      
      console.log(`   ✅ Deleted ${deletedCount.length} milestones with title: "${title}"`);
    }
    
    console.log(`🎉 Cleanup completed! Total milestones deleted: ${totalDeleted}`);
    
    if (totalDeleted > 0) {
      console.log('\n📝 Note: New projects will now get the correct default milestones:');
      console.log('   - Painting');
      console.log('   - Assembly/Welding');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupIncorrectMilestones().then(() => {
  console.log('✅ Cleanup script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Cleanup script failed:', error);
  process.exit(1);
});
