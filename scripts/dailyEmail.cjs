/* eslint-disable */

'use strict'

// ── 0. Bootstrap ─────────────────────────────────────────────────────────────
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const fs = require('fs')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin')

// ── Logo URL ──────────────────────────────────────────────────────────────────
const LOGO_URL = 'https://pantrypal-bit216.netlify.app/logo-fullwhite.png'

// ── 1. Validate environment variables ────────────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.resolve(__dirname, '../firebaseServiceAccount.json')

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error(
    '❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env\n' +
      '   Add them to your .env file and try again.'
  )
  process.exit(1)
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `❌ Firebase service-account key not found at: ${SERVICE_ACCOUNT_PATH}\n` +
      '   Download it from Firebase Console → Project Settings → Service accounts\n' +
      '   and save it as firebaseServiceAccount.json in the project root.'
  )
  process.exit(1)
}

// ── 2. Initialise Firebase Admin ─────────────────────────────────────────────
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ── 3. Configure nodemailer (Gmail SMTP / TLS) ───────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
})

// ── 4. Helpers ────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string (e.g. '2026-05-19') to a human-readable form.
 */
function formatDate(isoDate) {
  if (!isoDate) return 'unknown date'
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Calculate how many days until a given ISO date.
 */
function daysUntil(isoDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

/**
 * Build a plain-text email body for one user's expiring items.
 */
function buildEmailText(displayName, items) {
  const greeting = displayName ? `Hi ${displayName},` : 'Hi there,'
  const itemLines = items
    .map((item) => {
      const days = daysUntil(item.expiry_date)
      const urgency = days === 0 ? '⚠️  TODAY' : days === 1 ? '⚠️  TOMORROW' : `📅 in ${days} days`
      return `  • ${item.name}  (${item.quantity} ${item.unit})  –  ${urgency}  [expires ${formatDate(item.expiry_date)}]`
    })
    .join('\n')

  return `${greeting}

PantryPal has detected ${items.length} food item${items.length > 1 ? 's' : ''} in your pantry that ${items.length > 1 ? 'are' : 'is'} about to expire:

${itemLines}

Please consider using, sharing, or donating these items before they go to waste.
You can log in to PantryPal to manage your inventory at any time.

Stay fresh!
The PantryPal Team
`
}

/**
 * Build an HTML email body for one user's expiring items.
 */
function buildEmailHtml(displayName, items, logoUrl) {
  const greeting = displayName ? `Hi <strong>${displayName}</strong>,` : 'Hi there,'
  const itemRows = items
    .map((item) => {
      const days = daysUntil(item.expiry_date)
      let urgencyColor = '#16a34a'   // green – 3 days
      let urgencyLabel = `in ${days} day${days !== 1 ? 's' : ''}`
      if (days <= 0) { urgencyColor = '#dc2626'; urgencyLabel = 'TODAY' }
      else if (days === 1) { urgencyColor = '#ea580c'; urgencyLabel = 'TOMORROW' }
      else if (days === 2) { urgencyColor = '#d97706'; urgencyLabel = 'in 2 days' }

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1e293b;">${item.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;">${item.quantity} ${item.unit}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;">${formatDate(item.expiry_date)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
            <span style="background:${urgencyColor};color:#fff;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;">${urgencyLabel}</span>
          </td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
            <img src="${logoUrl}" alt="PantryPal" style="display:block;margin:0 auto;height:65px;width:auto;" />
            <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">Food Expiry Notification</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              You have <strong>${items.length} item${items.length > 1 ? 's' : ''}</strong> in your pantry that
              ${items.length > 1 ? 'are' : 'is'} expiring soon. Please consider using, sharing, or donating
              ${items.length > 1 ? 'them' : 'it'} before ${items.length > 1 ? 'they go' : 'it goes'} to waste.
            </p>

            <!-- Items table -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:14px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;">Item</th>
                  <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;">Qty</th>
                  <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;">Expires</th>
                  <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;">Status</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- CTA -->
            <div style="margin-top:28px;text-align:center;">
              <a href="https://pantrypal.app" target="_blank"
                 style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;
                        text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
                Manage My Pantry →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You are receiving this email because you have an active PantryPal account.<br>
              This is an automated daily notification sent from ${GMAIL_USER}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── 5. Main routine ───────────────────────────────────────────────────────────
;(async () => {
  console.log('✅ PantryPal – Daily Expiry Email Job starting…\n')

  try {

    // Calculate the date window: today → today + 3 days (ISO strings)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const future = new Date(today)
    future.setDate(today.getDate() + 3)
    future.setHours(23, 59, 59, 999)

    const todayISO = today.toISOString().split('T')[0]   // 'YYYY-MM-DD'
    const futureISO = future.toISOString().split('T')[0]

    console.log(`✅  Checking for items expiring between ${todayISO} and ${futureISO}…`)


    // Query the 'food' collection
    //      Matching documents: status=available AND expiry_date in [today, future]

    const foodSnap = await db
      .collection('food')
      .where('status', '==', 'available')
      .where('expiry_date', '>=', todayISO)
      .where('expiry_date', '<=', futureISO)
      .orderBy('expiry_date', 'asc')
      .get()

    if (foodSnap.empty) {
      console.log('✅  No expiring items found today. No emails to send.')
      process.exit(0)
    }

    console.log(`   Found ${foodSnap.size} expiring item(s) across all users.\n`)


    // Group items by user_id

    /** @type {Record<string, Array<admin.firestore.DocumentData>>} */
    const itemsByUser = {}
    foodSnap.forEach((docSnap) => {
      const data = docSnap.data()
      const uid = data.user_id
      if (!uid) {
        console.warn(`  ⚠️  Food doc ${docSnap.id} has no user_id — skipping.`)
        return
      }
      if (!itemsByUser[uid]) itemsByUser[uid] = []
      itemsByUser[uid].push(data)
    })

    const uniqueUsers = Object.keys(itemsByUser)
    console.log(`👥  Sending notifications to ${uniqueUsers.length} user(s)…\n`)


    // For each user: fetch profile, build email, send
    const results = await Promise.allSettled(
      uniqueUsers.map(async (uid) => {
        // Fetch user profile
        const userDoc = await db.collection('users').doc(uid).get()
        if (!userDoc.exists) {
          throw new Error(`User profile not found for UID ${uid}`)
        }
        const user = userDoc.data()
        const email = user.email
        const name = user.name || user.displayName || ''

        if (!email) {
          throw new Error(`No email address for UID ${uid}`)
        }

        const items = itemsByUser[uid]

        if (user.email_notifications_enabled === false) {
          console.log(`  🚫  Skipped email for ${email} (Notifications disabled)`)
          return { uid, email, count: items.length, skipped: true }
        }
        const subject =
          items.length === 1
            ? `⚠️ "${items[0].name}" is expiring soon – PantryPal`
            : `⚠️ ${items.length} items in your pantry are expiring soon – PantryPal`

        //  Send Email
        await transporter.sendMail({
          from: `"PantryPal Alerts" <${GMAIL_USER}>`,
          to: email,
          subject,
          text: buildEmailText(name, items),
          html: buildEmailHtml(name, items, LOGO_URL),
        })

        // Create In-App Notification
        const notifMessage = items.length === 1
          ? `"${items[0].name}" is about to expire. Use or donate it soon!`
          : `You have ${items.length} items about to expire soon. Check your inventory!`

        await db.collection('notifications').add({
          user_id: uid,
          type: 'EXPIRY_ALERT',
          message: notifMessage,
          is_read: false,
          related_entity_id: items.length === 1 ? (items[0].id || null) : null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        })

        console.log(`  ✅   Sent to ${email} + In-app notification created (${items.length} item${items.length > 1 ? 's' : ''})`)
        return { uid, email, count: items.length }
      })
    )


    // Print summary
    console.log('\n─────────────────────────────')
    let successCount = 0
    let skippedCount = 0
    let failCount = 0
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          skippedCount++
        } else {
          successCount++
        }
      } else {
        failCount++
        console.error(`  ❌  Failed: ${result.reason?.message ?? result.reason}`)
      }
    })
    console.log(`✅  Done. ${successCount} email(s) sent, ${skippedCount} skipped, ${failCount} failed.`)
  } catch (err) {
    console.error('❌  Unexpected error:', err)
    process.exit(1)
  }
})()
