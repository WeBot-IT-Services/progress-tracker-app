// scripts/updateSelectedLegacyUsers.cjs
// This script updates specific legacy users by ID using a Service Account key.
// Place your service account JSON at scripts/serviceAccountKey.json

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Admin SDK with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// List of user document IDs to update
const userIds = [
  '97hvnkIxW0NV7qQr1YsIw3WVnF92',
  'HSYlGdpEe2W9lHortwDusaTkBn73',
  'KzomVHZKUeYg7KMUK8R0Zf0gQ7y2',
  'MfJruN3RXfgBmYoI9wLNcUqoJPy2',
  'NvYZndc4CShKpGJzjCQ6sZMjjzQ2',
  'x87DYdnPMENrubpeKX686eNtm5i1'
];

async function updateUsers() {
  let updatedCount = 0;
  for (const id of userIds) {
    try {
      await db.collection('users').doc(id).update({
        passwordSet: true,
        isTemporary: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✔ Updated user ${id}`);
      updatedCount++;
    } catch (err) {
      console.error(`❌ Failed to update ${id}:`, err);
    }
  }
  console.log(`\n✅ Done. Updated ${updatedCount}/${userIds.length} users.`);
}

updateUsers().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
