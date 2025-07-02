// Fix user documents structure in Firestore
// This script updates existing user documents to use UID as document ID
// Run with: node scripts/fix-user-documents.js

const { initializeApp } = require('firebase/app');
const { getFirestore, setDoc, doc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Your Firebase configuration (using your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "221205163780",
  appId: "1:221205163780:web:52417a0db2f048ed962a51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// User data for mysteel Construction
const users = [
  {
    email: 'admin@mysteel.com',
    password: 'MS2024!Admin#Secure',
    name: 'System Administrator',
    role: 'admin',
    department: 'Administration',
    status: 'active'
  },
  {
    email: 'sales@mysteel.com',
    password: 'MS2024!Sales#Manager',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales',
    status: 'active'
  },
  {
    email: 'design@mysteel.com',
    password: 'MS2024!Design#Engineer',
    name: 'Design Engineer',
    role: 'designer',
    department: 'Design & Engineering',
    status: 'active'
  },
  {
    email: 'production@mysteel.com',
    password: 'MS2024!Prod#Manager',
    name: 'Production Manager',
    role: 'production',
    department: 'Production',
    status: 'active'
  },
  {
    email: 'installation@mysteel.com',
    password: 'MS2024!Install#Super',
    name: 'Installation Supervisor',
    role: 'installation',
    department: 'Installation',
    status: 'active'
  }
];

async function fixUserDocuments() {
  console.log('🔧 Fixing user document structure in Firestore...');
  const fixedUsers = [];

  for (const userData of users) {
    try {
      console.log(`Signing in as: ${userData.email}`);
      
      // Sign in to get the Firebase Auth UID
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      console.log(`✅ Signed in successfully: ${userCredential.user.uid}`);

      // Create/Update Firestore user profile using UID as document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        status: userData.status,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      console.log(`✅ Fixed Firestore profile for: ${userData.email} (${userData.role})`);

      fixedUsers.push({
        uid: userCredential.user.uid,
        ...userData
      });

      // Sign out after fixing each user
      await auth.signOut();

    } catch (error) {
      console.error(`❌ Error fixing user ${userData.email}:`, error.message);
    }
  }

  return fixedUsers;
}

async function fixFirestore() {
  try {
    console.log('🚀 Starting Firestore user document fix...\n');

    // Fix user documents
    const fixedUsers = await fixUserDocuments();
    console.log(`\n👥 Fixed ${fixedUsers.length} user documents\n`);

    console.log('🎉 Firestore user document fix completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Fixed Users: ${fixedUsers.length}`);
    
    console.log('\n🔐 Login Credentials:');
    fixedUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.email} | ${user.password}`);
    });

    console.log('\n✅ User documents now use Firebase Auth UID as document ID');
    console.log('✅ Authentication should now work correctly with proper roles');

  } catch (error) {
    console.error('💥 Error during Firestore fix:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixFirestore();
