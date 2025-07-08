// scripts/updateLegacyUsers.cjs
// This CommonJS script sets passwordSet:true and isTemporary:false for all @mysteel.com users.

const admin = require('firebase-admin');
// Use service account key to ensure correct Firebase project
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Admin SDK with service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function updateLegacyUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const email = data.email;
    if (typeof email === 'string' && email.toLowerCase().endsWith('@mysteel.com')) {
      await usersRef.doc(doc.id).update({
        passwordSet: true,
        isTemporary: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✔ Updated ${email}`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Done. Total legacy users updated: ${updatedCount}`);
}

updateLegacyUsers().catch(err => {
  console.error('❌ Error updating legacy users:', err);
  process.exit(1);
});
