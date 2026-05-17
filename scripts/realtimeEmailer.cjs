/* eslint-disable */

'use strict'

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const fs = require('fs')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin')

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

function buildHtml(title, message, userEmail) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="PantryPal" style="display:block;margin:0 auto;height:65px;width:auto;" />
            <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">${title}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 24px;font-size:16px;color:#1e293b;line-height:1.6;">${message}</p>
            <div style="text-align:center;margin-top:20px;">
              <a href="https://pantrypal.app" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">View in App</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
            Sent to ${userEmail}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

;(async () => {
  console.log('✅ Realtime Emailer Job starting…')
  try {
    const snap = await db
      .collection('notifications')
      .where('email_sent', '==', false)
      .where('type', 'in', ['DONATION_CLAIMED', 'ACCOUNT_ALERT'])
      .get()

    if (snap.empty) {
      console.log('✅ No unsent real-time notifications found.')
      process.exit(0)
    }

    console.log(` Found ${snap.size} notification(s) to send emails for.`)

    let sent = 0
    let failed = 0

    for (const doc of snap.docs) {
      const data = doc.data()
      const uid = data.user_id

      try {
        const userDoc = await db.collection('users').doc(uid).get()
        if (!userDoc.exists || !userDoc.data().email) {
          throw new Error(`User/Email not found for UID ${uid}`)
        }

        const user = userDoc.data()
        if (user.email_notifications_enabled === false) {
          console.log(`  Skipped ${data.type} for UID ${uid} (Notifications disabled)`)
          await doc.ref.update({ email_sent: true })
          continue
        }

        const email = user.email
        let subject = 'PantryPal Notification'
        let title = 'Notification'

        if (data.type === 'DONATION_CLAIMED') {
          subject = '🎉 Someone Requested Your Food! 🎉'
          title = 'Donation Request'
        } else if (data.type === 'ACCOUNT_ALERT') {
          subject = '⚠️ Security Alert for PantryPal ⚠️'
          title = 'Account Alert'
        }

        await transporter.sendMail({
          from: `"PantryPal Alerts" <${GMAIL_USER}>`,
          to: email,
          subject,
          text: data.message,
          html: buildHtml(title, data.message, email),
        })

        await doc.ref.update({ email_sent: true })
        console.log(`  ✅ Sent ${data.type} to ${email}`)
        sent++
      } catch (err) {
        console.error(`  ❌ Failed to send for doc ${doc.id}: ${err.message}`)
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
