/**
 * Data Repair Script: Fix Design Status Inconsistency
 * 
 * This script fixes projects that have inconsistent status between:
 * - project.status (should be 'dne' for partial completion)
 * - project.designData.status (should be 'partial' for partial completion)
 * 
 * Issue: Projects marked as 'partial' in designData but have 'production' status
 * should be reverted to 'dne' status to stay in Design WIP section.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

// Firebase configuration (use your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDGpAHHPNzJzn5-mYHVkZzBqNzQzQzQzQz",
  authDomain: "progress-tracker-app.firebaseapp.com",
  projectId: "progress-tracker-app",
  storageBucket: "progress-tracker-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixDesignStatusInconsistency() {
  console.log('🔧 Starting Design Status Inconsistency Repair...');
  
  try {
    // Find all projects with status inconsistency
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    let fixedCount = 0;
    let checkedCount = 0;
    const issues = [];
    
    for (const docSnapshot of snapshot.docs) {
      const project = { id: docSnapshot.id, ...docSnapshot.data() };
      checkedCount++;
      
      // Check for inconsistency: designData.status is 'partial' but project.status is not 'dne'
      if (project.designData?.status === 'partial' && project.status !== 'dne') {
        console.log(`❌ Found inconsistency in project: ${project.name || project.id}`);
        console.log(`   - Current status: ${project.status}`);
        console.log(`   - Design status: ${project.designData.status}`);
        console.log(`   - hasFlowedFromPartial: ${project.designData.hasFlowedFromPartial}`);
        
        issues.push({
          id: project.id,
          name: project.name,
          currentStatus: project.status,
          designStatus: project.designData.status,
          hasFlowedFromPartial: project.designData.hasFlowedFromPartial
        });
        
        // Fix the inconsistency: revert to 'dne' status for partial completion
        const updates = {
          status: 'dne',
          progress: 25, // Reset to design phase progress
          lastModified: new Date()
        };
        
        await updateDoc(doc(db, 'projects', project.id), updates);
        
        console.log(`✅ Fixed project ${project.name || project.id}: status reverted to 'dne'`);
        fixedCount++;
      }
      
      // Also check for projects that should be in production but have wrong design status
      else if (project.status === 'production' && project.designData?.status !== 'completed') {
        console.log(`⚠️  Warning: Project ${project.name || project.id} is in production but design status is not 'completed'`);
        console.log(`   - Status: ${project.status}`);
        console.log(`   - Design status: ${project.designData?.status}`);
        
        // This might be intentional if it was a partial flow, so just log it
        issues.push({
          id: project.id,
          name: project.name,
          currentStatus: project.status,
          designStatus: project.designData?.status,
          type: 'warning'
        });
      }
    }
    
    console.log('\n📊 Repair Summary:');
    console.log(`   - Projects checked: ${checkedCount}`);
    console.log(`   - Projects fixed: ${fixedCount}`);
    console.log(`   - Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n📋 Detailed Issues:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.name || issue.id}`);
        console.log(`   Status: ${issue.currentStatus} | Design: ${issue.designStatus}`);
        if (issue.type === 'warning') {
          console.log(`   Type: Warning (manual review needed)`);
        } else {
          console.log(`   Type: Fixed (reverted to DNE)`);
        }
      });
    }
    
    console.log('\n✅ Design Status Inconsistency Repair Complete!');
    
    if (fixedCount > 0) {
      console.log('\n🔄 Next Steps:');
      console.log('1. Refresh the Design & Engineering module');
      console.log('2. Verify that partial projects now appear in WIP section');
      console.log('3. Check that completed projects remain in History section');
      console.log('4. Test the workflow to ensure no new inconsistencies occur');
    }
    
    return {
      checked: checkedCount,
      fixed: fixedCount,
      issues: issues
    };
    
  } catch (error) {
    console.error('❌ Error during repair:', error);
    throw error;
  }
}

// Run the repair if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDesignStatusInconsistency()
    .then(result => {
      console.log('\n🎉 Repair completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Repair failed:', error);
      process.exit(1);
    });
}

export { fixDesignStatusInconsistency };
