// Firebase Connection Diagnostic Tool
// Run this in your browser console to diagnose Firebase connection issues

async function runFirebaseDiagnostics() {
  console.log('🔍 Running Firebase Connection Diagnostics...');
  console.log('='.repeat(50));
  
  const results = {
    config: null,
    auth: null,
    firestore: null,
    connectivity: null,
    rules: null
  };
  
  try {
    // Check 1: Firebase Configuration
    console.log('1️⃣ Checking Firebase Configuration...');
    try {
      const { auth, db } = await import('../config/firebase');
      results.config = '✅ Firebase config loaded successfully';
      console.log('✅ Firebase config loaded successfully');
      
      // Check auth state
      if (auth) {
        console.log('🔐 Auth service initialized');
        console.log('👤 Current user:', auth.currentUser?.email || 'Not authenticated');
        results.auth = auth.currentUser ? '✅ User authenticated' : '⚠️ No authenticated user';
      } else {
        results.auth = '❌ Auth service not initialized';
      }
      
      // Check Firestore
      if (db) {
        console.log('🗄️ Firestore service initialized');
        results.firestore = '✅ Firestore initialized';
      } else {
        results.firestore = '❌ Firestore not initialized';
      }
      
    } catch (error) {
      results.config = `❌ Config error: ${error.message}`;
      console.error('❌ Firebase config error:', error);
    }
    
    // Check 2: Network connectivity to Firebase
    console.log('\n2️⃣ Checking Network Connectivity...');
    try {
      const response = await fetch('https://firebase.googleapis.com/v1beta1/projects/mysteelprojecttracker', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        results.connectivity = '✅ Can reach Firebase services';
        console.log('✅ Can reach Firebase services');
      } else {
        results.connectivity = `⚠️ Firebase responded with status: ${response.status}`;
        console.log(`⚠️ Firebase responded with status: ${response.status}`);
      }
    } catch (error) {
      results.connectivity = `❌ Network error: ${error.message}`;
      console.error('❌ Network connectivity error:', error);
    }
    
    // Check 3: Test Firestore Access
    console.log('\n3️⃣ Testing Firestore Access...');
    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      if (db) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        const snapshot = await getDocs(q);
        
        results.rules = `✅ Firestore accessible - ${snapshot.size} documents found`;
        console.log(`✅ Firestore accessible - ${snapshot.size} documents found`);
      } else {
        results.rules = '❌ Firestore not available';
      }
    } catch (error) {
      results.rules = `❌ Firestore access denied: ${error.message}`;
      console.error('❌ Firestore access error:', error);
      
      if (error.code === 'permission-denied') {
        console.log('💡 This looks like a security rules issue!');
        console.log('🔧 Try running: deployDevRules() to deploy development-friendly rules');
      }
    }
    
    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    console.log('Configuration:', results.config);
    console.log('Authentication:', results.auth);
    console.log('Firestore Init:', results.firestore);
    console.log('Network:', results.connectivity);
    console.log('Rules/Access:', results.rules);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    if (results.rules && results.rules.includes('permission-denied')) {
      console.log('🔧 Deploy development-friendly rules:');
      console.log('   Run: ./deploy-dev-rules.sh');
      console.log('   Or: deployDevRules() for instructions');
    }
    
    if (results.auth && results.auth.includes('No authenticated user')) {
      console.log('👤 Enable testing mode:');
      console.log('   Run: enableTestingMode()');
    }
    
    if (results.connectivity && results.connectivity.includes('Network error')) {
      console.log('🌐 Check your internet connection and Firebase config');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error: error.message };
  }
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  (window as any).runFirebaseDiagnostics = runFirebaseDiagnostics;
  console.log('🔍 Firebase diagnostic tool loaded!');
  console.log('📞 Run: runFirebaseDiagnostics()');
}

export default runFirebaseDiagnostics;
