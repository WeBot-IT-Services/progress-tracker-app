#!/usr/bin/env node

/**
 * Standalone script to clean up orphaned milestones
 * Run this script to remove milestones that reference deleted projects
 * 
 * Usage: node scripts/cleanup-orphaned-milestones.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  query,
  where 
} = require('firebase/firestore');

// Firebase configuration (you may need to update this with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your src/config/firebase.ts configuration
};

async function cleanupOrphanedMilestones() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('📊 Fetching all milestones...');
    const milestonesSnapshot = await getDocs(collection(db, 'milestones'));
    const milestones = milestonesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${milestones.length} total milestones`);

    console.log('📊 Fetching all projects...');
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const existingProjectIds = new Set(projectsSnapshot.docs.map(doc => doc.id));

    console.log(`Found ${existingProjectIds.size} existing projects`);

    // Find orphaned milestones
    const orphanedMilestones = milestones.filter(milestone => 
      milestone.projectId && !existingProjectIds.has(milestone.projectId)
    );

    console.log(`\n🔍 Found ${orphanedMilestones.length} orphaned milestones:`);
    
    if (orphanedMilestones.length === 0) {
      console.log('✅ No orphaned milestones found. Database is clean!');
      return;
    }

    // Display orphaned milestones
    orphanedMilestones.forEach((milestone, index) => {
      console.log(`${index + 1}. Milestone: "${milestone.title}" (ID: ${milestone.id})`);
      console.log(`   Project ID: ${milestone.projectId} (MISSING)`);
      console.log(`   Status: ${milestone.status || 'unknown'}`);
      console.log(`   Module: ${milestone.module || 'unknown'}`);
      console.log('');
    });

    // Confirm deletion
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question(`\n⚠️  Do you want to delete these ${orphanedMilestones.length} orphaned milestones? (yes/no): `, resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Cleanup cancelled by user.');
      return;
    }

    console.log('\n🗑️  Deleting orphaned milestones...');
    let deleted = 0;
    let errors = 0;

    for (const milestone of orphanedMilestones) {
      try {
        await deleteDoc(doc(db, 'milestones', milestone.id));
        console.log(`✅ Deleted: ${milestone.title} (${milestone.id})`);
        deleted++;
      } catch (error) {
        console.error(`❌ Failed to delete ${milestone.id}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`✅ Successfully deleted: ${deleted} milestones`);
    console.log(`❌ Errors: ${errors} milestones`);
    console.log(`🎉 Cleanup completed!`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupOrphanedMilestones()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOrphanedMilestones };
