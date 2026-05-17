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

const targetEmail = 'intel.celeron.05@gmail.com'

;(async () => {
  try {
    const usersSnap = await db.collection('users').where('email', '==', targetEmail).get()
    if (usersSnap.empty) {
      console.error(`❌ User with email ${targetEmail} not found!`)
      process.exit(1)
    }

    const userDoc = usersSnap.docs[0]
    const uid = userDoc.id
    console.log(`👤 Found user UID: ${uid} for ${targetEmail}`)

    //Create all in-app notifications
    const types = [
      { type: 'EXPIRY_ALERT', msg: 'Your Milk is expiring soon.' },
      { type: 'MOVE_TO_DONATION', msg: 'You have 3 items that can be donated.' },
      { type: 'DONATION_CLAIMED', msg: 'Someone requested your apples.' },
      { type: 'DONATION_CONFIRMED', msg: 'Your donation request for bread was confirmed!' },
      { type: 'DONATION_POSTED', msg: 'A new donation is available near you.' },
      { type: 'MEAL_REMINDER', msg: 'Reminder: Pasta is planned for dinner.' },
      { type: 'ACCOUNT_ALERT', msg: 'New login from an unrecognized device.' }
    ]

    console.log('📝 Creating in-app notifications...')
    const batch = db.batch()
    for (const t of types) {
      const ref = db.collection('notifications').doc()
      batch.set(ref, {
        user_id: uid,
        type: t.type,
        message: t.msg,
        is_read: false,
        email_sent: false,
        related_entity_id: null,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    await batch.commit()
    console.log('✅ Created all in-app notifications.')

    // Mock data for dailyEmail.cjs (Food expiring in 2 days)
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + 2)
    const futureISO = futureDate.toISOString().split('T')[0]

    console.log(`Creating expiring food mock (expires: ${futureISO})...`)
    await db.collection('food').add({
      user_id: uid,
      food_type: 'Dairy',
      name: 'Test Milk (Expiring)',
      quantity: 1,
      unit: 'gallon',
      expiry_date: futureISO,
      type: 'fridge',
      status: 'available',
      quantity_level: 'full',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    })

    //Mock data for dailyMealEmail.cjs (Meal plan for today)
    const todayISO = today.toISOString().split('T')[0]
    console.log(`🍽️ Creating meal plan mock for today (${todayISO})...`)
    const planRef = await db.collection('mealPlans').add({
      user_id: uid,
      date: todayISO,
      description: 'Test Meal Plan',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    })

    await db.collection('mealPlans').doc(planRef.id).collection('mealPlanItems').add({
      food_id: 'dummy_food_id',
      meal_plan_id: planRef.id,
      meal_date: todayISO,
      meal_type: 'dinner',
      reserved_quantity: 1,
      recipe_name: 'Test Pasta Dinner'
    })

    console.log('🎉 All mock data seeded successfully!')
    process.exit(0)
  } catch (err) {
    console.error('🚨 Error:', err)
    process.exit(1)
  }
})()
