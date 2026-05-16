// scripts/testNotif.cjs
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../firebaseServiceAccount.json');
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Service account file not found at ' + SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Get UID from command line or hardcode here
const targetUid = process.argv[2];

if (!targetUid) {
  console.log('❌ Please provide a User ID as an argument.');
  console.log('Usage: node scripts/testNotif.cjs YOUR_UID_HERE');
  process.exit(1);
}

async function sendTestNotification() {
  const notif = {
    user_id: targetUid,
    type: 'EXPIRY_ALERT',
    message: 'Testing Notification: Your Bread is about to expire in 2 days! 🍞',
    is_read: false,
    related_entity_id: 'test_item_123',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('notifications').add(notif);
    console.log('✅ Success! Test notification added with ID:', docRef.id);
    console.log('Check your PantryPal dashboard now.');
  } catch (err) {
    console.error('❌ Error adding notification:', err);
  }
}

sendTestNotification();
