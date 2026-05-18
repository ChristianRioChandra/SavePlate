/* eslint-disable */

'use strict'

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const fs = require('fs')
const admin = require('firebase-admin')

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../firebaseServiceAccount.json')
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Firebase service-account key not found.`)
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}
const db = admin.firestore()

const uid = process.argv[2]
if (!uid) {
  console.error('❌ Please provide a user UID. Usage: node testAccountAlert.cjs <uid>')
  process.exit(1)
}

;(async () => {
  try {
    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      console.error(`❌ User with UID ${uid} not found!`)
      process.exit(1)
    }

    console.log(`👤 Found user: ${userDoc.data().email}`)
    console.log('📝 Creating ACCOUNT_ALERT notification...')

    const notifRef = await db.collection('notifications').add({
      user_id: uid,
      type: 'ACCOUNT_ALERT',
      message: 'Notice: A new login was detected from a different device. If this was you, you can ignore this alert.',
      is_read: false,
      email_sent: false,
      related_entity_id: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`✅ Created notification: ${notifRef.id}`)
    console.log('🚀 Now you can run `node realtimeEmailer.cjs` to test the email sending!')
    process.exit(0)
  } catch (err) {
    console.error('🚨 Error:', err)
    process.exit(1)
  }
})()
