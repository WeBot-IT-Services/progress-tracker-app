/**
 * Browser Console Script to Create Mysteel Users
 * 
 * Instructions:
 * 1. Open https://mysteelprojecttracker.web.app
 * 2. Open browser console (F12 → Console)
 * 3. Copy and paste this entire script
 * 4. Run: createMysteelUsers()
 */

async function createMysteelUsers() {
  console.log('🚀 Creating Mysteel Construction user accounts...');
  
  // Import Firebase functions
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js');
  const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js');
  
  // Get Firebase instances from the app
  const auth = window.firebase?.auth || (await import('/src/config/firebase.ts')).auth;
  const db = window.firebase?.db || (await import('/src/config/firebase.ts')).db;
  
  // User data with mysteel.com domain
  const users = [
    {
      email: 'admin@mysteel.com',
      password: 'MS2024!Admin#Secure',
      name: 'System Administrator',
      role: 'admin',
      department: 'Administration'
    },
    {
      email: 'sales@mysteel.com',
      password: 'MS2024!Sales#Manager',
      name: 'Sales Manager',
      role: 'sales',
      department: 'Sales'
    },
    {
      email: 'design@mysteel.com',
      password: 'MS2024!Design#Engineer',
      name: 'Design Engineer',
      role: 'designer',
      department: 'Design & Engineering'
    },
    {
      email: 'production@mysteel.com',
      password: 'MS2024!Prod#Manager',
      name: 'Production Manager',
      role: 'production',
      department: 'Production'
    },
    {
      email: 'installation@mysteel.com',
      password: 'MS2024!Install#Super',
      name: 'Installation Manager',
      role: 'installation',
      department: 'Installation'
    }
  ];

  const results = [];
  
  for (const userData of users) {
    try {
      console.log(`🔄 Creating user: ${userData.email}`);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Create Firestore user document
      const userDoc = {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      
      console.log(`✅ Created: ${userData.name} (${userData.email})`);
      results.push({ ...userData, success: true, uid: userCredential.user.uid });
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User ${userData.email} already exists`);
        results.push({ ...userData, success: true, existing: true });
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
        results.push({ ...userData, success: false, error: error.message });
      }
    }
  }
  
  // Display results
  console.log('\n🎉 Mysteel User Creation Complete!');
  console.log('=====================================');
  
  console.log('\n📋 Updated Login Credentials:');
  console.log('┌─────────────┬─────────────────────────────┬─────────────────────────────┐');
  console.log('│ Role        │ Email                       │ Password                    │');
  console.log('├─────────────┼─────────────────────────────┼─────────────────────────────┤');
  
  users.forEach(user => {
    const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const status = results.find(r => r.email === user.email)?.success ? '✅' : '❌';
    console.log(`│ ${status} ${role.padEnd(9)} │ ${user.email.padEnd(27)} │ ${user.password.padEnd(27)} │`);
  });
  
  console.log('└─────────────┴─────────────────────────────┴─────────────────────────────┘');
  
  console.log('\n🔐 All accounts now use mysteel.com domain');
  console.log('🎯 Ready to test with updated credentials!');
  
  return results;
}

// Make function available globally
window.createMysteelUsers = createMysteelUsers;

console.log('📝 Mysteel User Creation Script Loaded');
console.log('💡 Run: createMysteelUsers() to create all user accounts');
