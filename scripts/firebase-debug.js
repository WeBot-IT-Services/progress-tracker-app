// Firebase Authentication and Storage Debug Script
// This script helps debug and fix authentication and storage permission issues

console.log('🔧 Firebase Debug & Fix Script Starting...');

// Check if we're running in the browser
if (typeof window === 'undefined') {
  console.error('❌ This script must be run in a browser environment');
  process.exit(1);
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y",
  authDomain: "mysteelprojecttracker.firebaseapp.com",
  projectId: "mysteelprojecttracker",
  storageBucket: "mysteelprojecttracker.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Import Firebase modules dynamically
async function initializeFirebase() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, signInWithEmailAndPassword, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
    const { getFirestore, doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const storage = getStorage(app);
    const db = getFirestore(app);

    console.log('✅ Firebase initialized successfully');

    return { auth, storage, db, signInWithEmailAndPassword, onAuthStateChanged, ref, uploadBytes, getDownloadURL, doc, getDoc, setDoc };
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
}

// Test credentials
const testCredentials = [
  { email: 'admin@mysteel.com', password: 'MS2024!Admin#Super', role: 'admin' },
  { email: 'sales@mysteel.com', password: 'MS2024!Sales#Super', role: 'sales' },
  { email: 'design@mysteel.com', password: 'MS2024!Design#Super', role: 'designer' },
  { email: 'production@mysteel.com', password: 'MS2024!Prod#Super', role: 'production' },
  { email: 'installation@mysteel.com', password: 'MS2024!Install#Super', role: 'installation' }
];

// Main debug function
async function runDebug() {
  try {
    const firebase = await initializeFirebase();
    const { auth, storage, db, signInWithEmailAndPassword, ref, uploadBytes, getDownloadURL, doc, getDoc, setDoc } = firebase;

    console.log('🔍 Starting authentication tests...');

    // Test each credential
    for (const cred of testCredentials) {
      try {
        console.log(`\n🔐 Testing login for ${cred.email}...`);
        
        const userCredential = await signInWithEmailAndPassword(auth, cred.email, cred.password);
        const user = userCredential.user;
        
        console.log(`✅ Login successful for ${cred.email}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        
        // Check/create user document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log(`📝 Creating user document for ${cred.email}...`);
          await setDoc(userDocRef, {
            uid: user.uid,
            email: cred.email,
            name: cred.role.charAt(0).toUpperCase() + cred.role.slice(1) + ' User',
            role: cred.role,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`✅ User document created for ${cred.email}`);
        } else {
          console.log(`📄 User document exists for ${cred.email}:`, userDoc.data());
        }
        
        // Test storage upload
        console.log(`📤 Testing storage upload for ${cred.email}...`);
        
        // Create a test file
        const testData = new Blob(['Test file content'], { type: 'text/plain' });
        const testPath = `test/${user.uid}/${Date.now()}_test.txt`;
        const storageRef = ref(storage, testPath);
        
        try {
          const snapshot = await uploadBytes(storageRef, testData);
          const downloadURL = await getDownloadURL(snapshot.ref);
          console.log(`✅ Storage upload successful for ${cred.email}`);
          console.log(`   Path: ${testPath}`);
          console.log(`   URL: ${downloadURL}`);
        } catch (storageError) {
          console.error(`❌ Storage upload failed for ${cred.email}:`, storageError);
        }
        
        // Sign out
        await auth.signOut();
        console.log(`🔓 Signed out ${cred.email}`);
        
      } catch (authError) {
        console.error(`❌ Authentication failed for ${cred.email}:`, authError);
      }
    }
    
    console.log('\n✅ Debug test complete!');
    
    // Instructions for fixing the issue
    console.log('\n📋 NEXT STEPS TO FIX THE ISSUE:');
    console.log('1. Make sure you\'re logged in with a valid Firebase account');
    console.log('2. Try logging in with: admin@mysteel.com / MS2024!Admin#Super');
    console.log('3. Clear browser cache and cookies for your domain');
    console.log('4. Disable any ad blockers or security extensions');
    console.log('5. Check the browser console for any CORS or security errors');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug script
if (typeof window !== 'undefined') {
  // We're in a browser environment
  window.runFirebaseDebug = runDebug;
  console.log('🔧 Firebase debug script loaded. Run window.runFirebaseDebug() to start.');
} else {
  // We're in Node.js environment
  runDebug();
}

export { runDebug };
