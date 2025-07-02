/**
 * Browser Console Script: Fix Design Status Inconsistency
 * 
 * Run this script in the browser console while logged into the Progress Tracker app
 * to fix projects with inconsistent design status.
 * 
 * Usage:
 * 1. Open the Progress Tracker app in your browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(async function fixDesignStatusInconsistency() {
  console.log('🔧 Starting Design Status Inconsistency Repair...');
  
  try {
    // Check if Firebase is available
    if (typeof window.firebase === 'undefined' && typeof window.db === 'undefined') {
      console.error('❌ Firebase not found. Make sure you are on the Progress Tracker app page.');
      return;
    }
    
    // Get Firestore instance (try different ways it might be available)
    let db;
    if (window.db) {
      db = window.db;
    } else if (window.firebase?.firestore) {
      db = window.firebase.firestore();
    } else {
      console.error('❌ Firestore not accessible. Make sure you are logged in.');
      return;
    }
    
    console.log('✅ Connected to Firestore');
    
    // Get all projects
    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef.get();
    
    let fixedCount = 0;
    let checkedCount = 0;
    const issues = [];
    
    console.log(`📊 Checking ${snapshot.docs.length} projects...`);
    
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
        
        await docSnapshot.ref.update(updates);
        
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
      
      // Automatically refresh the page after a short delay
      console.log('\n🔄 Auto-refreshing page in 3 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    
    return {
      checked: checkedCount,
      fixed: fixedCount,
      issues: issues
    };
    
  } catch (error) {
    console.error('❌ Error during repair:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you are logged into the Progress Tracker app');
    console.log('2. Make sure you have admin permissions');
    console.log('3. Try refreshing the page and running the script again');
    throw error;
  }
})();
