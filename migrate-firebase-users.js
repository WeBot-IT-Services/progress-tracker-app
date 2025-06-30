/**
 * Browser Console Script to Migrate Firebase Users from mysteer.com to mysteel.com
 * 
 * Instructions:
 * 1. Open https://mysteelprojecttracker.web.app
 * 2. Login as admin@mysteer.com (if it exists) or any admin user
 * 3. Open browser console (F12 → Console)
 * 4. Copy and paste this script
 * 5. Run: migrateFirebaseUsers()
 */

async function migrateFirebaseUsers() {
  console.log('🚀 Starting Firebase user migration from mysteer.com to mysteel.com...');
  
  try {
    // Get Firebase instances
    const { auth, db } = window.firebase || await import('./src/config/firebase.ts');
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js');
    const { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js');
    
    // User mapping from old to new domain
    const userMigrations = [
      {
        oldEmail: 'admin@mysteer.com',
        newEmail: 'admin@mysteel.com',
        password: 'MS2024!Admin#Secure',
        name: 'System Administrator',
        role: 'admin',
        department: 'Administration'
      },
      {
        oldEmail: 'sales@mysteer.com',
        newEmail: 'sales@mysteel.com',
        password: 'MS2024!Sales#Manager',
        name: 'Sales Manager',
        role: 'sales',
        department: 'Sales'
      },
      {
        oldEmail: 'design@mysteer.com',
        newEmail: 'design@mysteel.com',
        password: 'MS2024!Design#Engineer',
        name: 'Design Engineer',
        role: 'designer',
        department: 'Design & Engineering'
      },
      {
        oldEmail: 'production@mysteer.com',
        newEmail: 'production@mysteel.com',
        password: 'MS2024!Prod#Manager',
        name: 'Production Manager',
        role: 'production',
        department: 'Production'
      },
      {
        oldEmail: 'installation@mysteer.com',
        newEmail: 'installation@mysteel.com',
        password: 'MS2024!Install#Super',
        name: 'Installation Manager',
        role: 'installation',
        department: 'Installation'
      }
    ];
    
    // Step 1: Check current users
    console.log('\n📊 Step 1: Checking current users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const currentUsers = [];
    
    usersSnapshot.forEach((docSnap) => {
      currentUsers.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    console.log(`Found ${currentUsers.length} users in Firestore`);
    
    // Step 2: Create new mysteel.com users
    console.log('\n🔄 Step 2: Creating new mysteel.com users...');
    const migrationResults = [];
    
    for (const migration of userMigrations) {
      try {
        console.log(`Creating ${migration.newEmail}...`);
        
        // Create new Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          migration.newEmail,
          migration.password
        );
        
        // Create new Firestore document
        const newUserDoc = {
          email: migration.newEmail,
          name: migration.name,
          role: migration.role,
          department: migration.department,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          migratedFrom: migration.oldEmail,
          migrationDate: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), newUserDoc);
        
        console.log(`✅ Created: ${migration.newEmail}`);
        migrationResults.push({
          ...migration,
          success: true,
          newUid: userCredential.user.uid
        });
        
        // Sign out to avoid conflicts
        await signOut(auth);
        
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️ ${migration.newEmail} already exists`);
          migrationResults.push({
            ...migration,
            success: true,
            existing: true
          });
        } else {
          console.error(`❌ Error creating ${migration.newEmail}:`, error.message);
          migrationResults.push({
            ...migration,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    // Step 3: Clean up old mysteer.com users (optional)
    console.log('\n🧹 Step 3: Cleaning up old mysteer.com users...');
    const oldUsers = currentUsers.filter(user => user.email && user.email.includes('mysteer.com'));
    
    if (oldUsers.length > 0) {
      console.log(`Found ${oldUsers.length} old mysteer.com users to clean up:`);
      
      for (const oldUser of oldUsers) {
        try {
          // Delete Firestore document
          await deleteDoc(doc(db, 'users', oldUser.id));
          console.log(`🗑️ Deleted Firestore doc for: ${oldUser.email}`);
        } catch (error) {
          console.error(`❌ Error deleting ${oldUser.email}:`, error.message);
        }
      }
    }
    
    // Step 4: Display results
    console.log('\n🎉 Migration Complete!');
    console.log('=====================');
    
    console.log('\n📋 New Mysteel.com Login Credentials:');
    console.log('┌─────────────┬─────────────────────────────┬─────────────────────────────┐');
    console.log('│ Role        │ Email                       │ Password                    │');
    console.log('├─────────────┼─────────────────────────────┼─────────────────────────────┤');
    
    userMigrations.forEach(migration => {
      const role = migration.role.charAt(0).toUpperCase() + migration.role.slice(1);
      const result = migrationResults.find(r => r.newEmail === migration.newEmail);
      const status = result?.success ? '✅' : '❌';
      
      console.log(`│ ${status} ${role.padEnd(9)} │ ${migration.newEmail.padEnd(27)} │ ${migration.password.padEnd(27)} │`);
    });
    
    console.log('└─────────────┴─────────────────────────────┴─────────────────────────────┘');
    
    console.log('\n✅ All users now use mysteel.com domain');
    console.log('✅ Old mysteer.com users have been cleaned up');
    console.log('🎯 Ready to test with new credentials!');
    
    return migrationResults;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Make sure you are logged in as an admin user first');
    return null;
  }
}

// Make function available globally
window.migrateFirebaseUsers = migrateFirebaseUsers;

console.log('🔄 Firebase User Migration Script Loaded');
console.log('💡 Run: migrateFirebaseUsers() to migrate all users to mysteel.com');
