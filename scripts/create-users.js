// User Creation Script for Firebase Auth
// This script creates the necessary user accounts in Firebase Auth

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // You'll need to download this

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mysteelprojecttracker.firebaseio.com'
});

const auth = admin.auth();
const firestore = admin.firestore();

// User accounts to create
const users = [
  {
    email: 'admin@mysteel.com',
    password: 'MS2024!Admin#Super',
    role: 'admin',
    name: 'Admin User',
    employeeId: 'EMP001'
  },
  {
    email: 'sales@mysteel.com',
    password: 'MS2024!Sales#Super',
    role: 'sales',
    name: 'Sales Manager',
    employeeId: 'EMP002'
  },
  {
    email: 'design@mysteel.com',
    password: 'MS2024!Design#Super',
    role: 'designer',
    name: 'Design Engineer',
    employeeId: 'EMP003'
  },
  {
    email: 'production@mysteel.com',
    password: 'MS2024!Prod#Super',
    role: 'production',
    name: 'Production Manager',
    employeeId: 'EMP004'
  },
  {
    email: 'installation@mysteel.com',
    password: 'MS2024!Install#Super',
    role: 'installation',
    name: 'Installation Supervisor',
    employeeId: 'EMP005'
  }
];

async function createUsers() {
  console.log('🔧 Creating Firebase Auth users...');
  
  for (const userData of users) {
    try {
      console.log(`\n📝 Creating user: ${userData.email}`);
      
      // Create user in Firebase Auth
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
          emailVerified: true
        });
        console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  User already exists in Firebase Auth: ${userData.email}`);
          userRecord = await auth.getUserByEmail(userData.email);
        } else {
          throw error;
        }
      }
      
      // Create user document in Firestore
      const userDoc = {
        uid: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        employeeId: userData.employeeId,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await firestore.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
      console.log(`✅ Created/Updated Firestore user document for: ${userData.email}`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('\n✅ User creation process complete!');
  console.log('\n🔐 Login credentials:');
  users.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
}

// Run the script
createUsers().then(() => {
  console.log('\n🎉 All done! Users have been created in Firebase Auth and Firestore.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error during user creation:', error);
  process.exit(1);
});

module.exports = { createUsers };
