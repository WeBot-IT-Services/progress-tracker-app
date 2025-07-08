// scripts/updateLegacyUsers.js
// This script sets passwordSet:true and isTemporary:false for all @mysteel.com users.

const admin = require('firebase-admin');

// Initialize the Admin SDK. By default it uses GOOGLE_APPLICATION_CREDENTIALS env var or ADC.
admin.initializeApp({
  credential: admin.credential.applicationDefault()
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
