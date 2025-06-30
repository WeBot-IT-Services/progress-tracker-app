// Cleanup script to remove existing data before repopulating
// Run with: node scripts/cleanup-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { getAuth, deleteUser } = require('firebase/auth');

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

async function cleanupCollection(collectionName) {
  console.log(`🧹 Cleaning up ${collectionName} collection...`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = [];
    
    querySnapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${deletePromises.length} documents from ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error cleaning up ${collectionName}:`, error.message);
  }
}

async function cleanupFirestore() {
  try {
    console.log('🚀 Starting Firestore cleanup...\n');

    // Clean up collections
    await cleanupCollection('users');
    await cleanupCollection('projects');
    await cleanupCollection('complaints');

    console.log('\n🎉 Firestore cleanup completed successfully!');
    console.log('\n📝 Note: Firebase Auth users need to be deleted manually from Firebase Console');
    console.log('   Go to: https://console.firebase.google.com/project/mysteelprojecttracker/authentication/users');

  } catch (error) {
    console.error('💥 Error during Firestore cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupFirestore();
