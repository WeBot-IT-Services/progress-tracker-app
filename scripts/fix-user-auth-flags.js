/**
 * Fix User Authentication Flags
 * 
 * This script checks and fixes the authentication flags for demo users
 * to resolve the password change redirect issue.
 */

// Demo users that should have proper authentication flags
const demoUsers = [
  'admin@mysteel.com',
  'sales@mysteel.com',
  'design@mysteel.com',
  'production@mysteel.com',
  'installation@mysteel.com'
];

async function fixUserAuthFlags() {
  console.log('🔧 Fixing user authentication flags...');
  
  try {
    // This script is designed to be run in the browser console
    // where Firebase is already initialized
    
    if (typeof window === 'undefined') {
      console.log('❌ This script must be run in the browser console');
      console.log('📝 Instructions:');
      console.log('1. Open https://mysteelprojecttracker.web.app');
      console.log('2. Open browser console (F12 → Console)');
      console.log('3. Copy and paste this script');
      console.log('4. Run: fixUserAuthFlags()');
      return;
    }

    // Import Firebase functions
    const { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = 
      await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get Firebase instances from the app
    const db = window.firebase?.db || (await import('/src/config/firebase.ts')).db;
    
    if (!db) {
      console.error('❌ Firebase not initialized. Please refresh the page and try again.');
      return;
    }

    console.log('🔍 Checking user documents...');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const results = [];
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const email = userData.email;
      
      // Check if this is a demo user
      if (demoUsers.includes(email)) {
        console.log(`🔍 Checking user: ${email}`);
        
        const needsUpdate = userData.passwordSet === undefined || userData.isTemporary === undefined;
        
        if (needsUpdate) {
          console.log(`🔧 Updating flags for: ${email}`);
          
          try {
            await updateDoc(doc(db, 'users', userDoc.id), {
              passwordSet: true,
              isTemporary: false,
              updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Updated: ${email}`);
            results.push({ email, status: 'updated', passwordSet: true, isTemporary: false });
          } catch (error) {
            console.error(`❌ Failed to update ${email}:`, error);
            results.push({ email, status: 'error', error: error.message });
          }
        } else {
          console.log(`✅ Already correct: ${email} (passwordSet: ${userData.passwordSet}, isTemporary: ${userData.isTemporary})`);
          results.push({ 
            email, 
            status: 'correct', 
            passwordSet: userData.passwordSet, 
            isTemporary: userData.isTemporary 
          });
        }
      }
    }
    
    // Display results
    console.log('\n🎉 User Authentication Flags Fix Complete!');
    console.log('===========================================');
    
    console.log('\n📋 Results:');
    console.log('┌─────────────────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Email                       │ Status      │ passwordSet │ isTemporary │');
    console.log('├─────────────────────────────┼─────────────┼─────────────┼─────────────┤');
    
    results.forEach(result => {
      const status = result.status === 'updated' ? '🔧 Updated' : 
                    result.status === 'correct' ? '✅ Correct' : '❌ Error';
      const passwordSet = result.passwordSet !== undefined ? result.passwordSet.toString() : 'N/A';
      const isTemporary = result.isTemporary !== undefined ? result.isTemporary.toString() : 'N/A';
      
      console.log(`│ ${result.email.padEnd(27)} │ ${status.padEnd(11)} │ ${passwordSet.padEnd(11)} │ ${isTemporary.padEnd(11)} │`);
    });
    
    console.log('└─────────────────────────────┴─────────────┴─────────────┴─────────────┘');
    
    const updatedCount = results.filter(r => r.status === 'updated').length;
    const correctCount = results.filter(r => r.status === 'correct').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`\n📊 Summary: ${updatedCount} updated, ${correctCount} already correct, ${errorCount} errors`);
    
    if (updatedCount > 0) {
      console.log('\n🔄 Please refresh the page and try logging in again.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error fixing user authentication flags:', error);
    throw error;
  }
}

// Make function available globally
if (typeof window !== 'undefined') {
  window.fixUserAuthFlags = fixUserAuthFlags;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fixUserAuthFlags, demoUsers };
}

console.log('📝 User Authentication Flags Fix Script Loaded');
console.log('💡 Run: fixUserAuthFlags() to check and fix user authentication flags');
