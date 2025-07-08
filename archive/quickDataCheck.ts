/**
 * Quick Data Check Utility
 * Simple tool to quickly check what data exists in Firestore
 */

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const quickDataCheck = async () => {
  console.log('🔍 Quick Firestore Data Check');
  console.log('=' .repeat(40));

  try {
    // Check projects
    console.log('\n📊 PROJECTS:');
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log(`Total projects: ${projectsSnapshot.size}`);
    
    if (projectsSnapshot.size > 0) {
      projectsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}: ${data.projectName || 'No name'} (${data.status || 'No status'})`);
      });
    } else {
      console.log('  No projects found');
    }

    // Check milestones
    console.log('\n🎯 MILESTONES:');
    const milestonesSnapshot = await getDocs(collection(db, 'milestones'));
    console.log(`Total milestones: ${milestonesSnapshot.size}`);
    
    if (milestonesSnapshot.size > 0) {
      milestonesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}: ${data.title || 'No title'} (Project: ${data.projectId || 'No project'})`);
      });
    } else {
      console.log('  No milestones found');
    }

    // Check complaints
    console.log('\n📝 COMPLAINTS:');
    const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
    console.log(`Total complaints: ${complaintsSnapshot.size}`);
    
    if (complaintsSnapshot.size > 0) {
      complaintsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}: ${data.title || 'No title'} (${data.status || 'No status'})`);
      });
    } else {
      console.log('  No complaints found');
    }

    // Check users
    console.log('\n👥 USERS:');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Total users: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size > 0) {
      usersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}: ${data.email || 'No email'} (${data.role || 'No role'})`);
      });
    } else {
      console.log('  No users found');
    }

    console.log('\n✅ Quick data check completed');
    
    return {
      projects: projectsSnapshot.size,
      milestones: milestonesSnapshot.size,
      complaints: complaintsSnapshot.size,
      users: usersSnapshot.size
    };

  } catch (error) {
    console.error('❌ Quick data check failed:', error);
    return { error: error.message };
  }
};

// Make it available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).quickDataCheck = quickDataCheck;
}
