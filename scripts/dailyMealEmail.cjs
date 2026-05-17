/* eslint-disable */

'use strict'

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const fs = require('fs')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin')

// ── Logo URL ─────────────────────────────────────────────────────────────
const LOGO_URL = 'https://pantrypal-bit216.netlify.app/logo-fullwhite.png'

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.resolve(__dirname, '../firebaseServiceAccount.json')

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env')
  process.exit(1)
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Firebase service-account key not found at: ${SERVICE_ACCOUNT_PATH}`)
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
})

function buildHtml(displayName, items, todayStr) {
  const greeting = displayName ? `Hi <strong>${displayName}</strong>,` : 'Hi there,'
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1e293b;text-transform:capitalize;">${item.meal_type}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;">${item.recipe_name || 'Generic Meal'}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="PantryPal" style="display:block;margin:0 auto;height:65px;width:auto;" />
            <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">Your Meals for Today (${todayStr})</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#1e293b;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;">Here is what you have planned for today:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:14px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 12px;text-align:left;color:#64748b;">Meal</th>
                  <th style="padding:10px 12px;text-align:left;color:#64748b;">Recipe / Plan</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <div style="margin-top:28px;text-align:center;">
              <a href="https://pantrypal.app" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">Open Meal Planner</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

;(async () => {
  console.log('✅ Daily Meal Reminder Job starting…')
  try {
    const today = new Date()
    const todayISO = today.toISOString().split('T')[0]

    console.log(`✅ Finding meal plans for ${todayISO}…`)

    const plansSnap = await db.collection('mealPlans').where('date', '==', todayISO).get()

    if (plansSnap.empty) {
      console.log('No meal plans found for today. Exiting.')
      process.exit(0)
    }

    console.log(`Found ${plansSnap.size} meal plan(s) for today.`)

    let sent = 0
    let failed = 0

    for (const planDoc of plansSnap.docs) {
      const data = planDoc.data()
      const uid = data.user_id

      try {
        const userDoc = await db.collection('users').doc(uid).get()
        if (!userDoc.exists || !userDoc.data().email) continue
        const user = userDoc.data()

        if (user.email_notifications_enabled === false) {
          console.log(`  - Skipped meal reminder for ${user.email} (Notifications disabled)`)
          continue
        }

        const itemsSnap = await planDoc.ref.collection('mealPlanItems').get()
        if (itemsSnap.empty) continue

        const items = itemsSnap.docs.map((d) => d.data())
        const name = user.name || user.displayName || ''

        await transporter.sendMail({
          from: `"PantryPal Meals" <${GMAIL_USER}>`,
          to: user.email,
          subject: `🍽️ Your Meal Plan for Today (${todayISO})`,
          text: `You have ${items.length} meals planned today. Open PantryPal for details!`,
          html: buildHtml(name, items, todayISO),
        })

        console.log(`  ✅ Sent meal reminder to ${user.email}`)
        sent++
      } catch (err) {
        console.error(`  ❌ Failed to send for user ${uid}: ${err.message}`)
        failed++
      }
    }

    console.log(`✅ Done. ${sent} sent, ${failed} failed.`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
})()
