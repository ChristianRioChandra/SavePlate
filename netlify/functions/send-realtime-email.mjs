/* eslint-disable */
import { db, transporter, GMAIL_USER, LOGO_URL } from './utils/firebase-init.mjs'

function buildHtml(title, message, userEmail) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
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
              <a href="https://pantrypal-bit216.netlify.app" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">View in App</a>
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
</body></html>`
}

export const handler = async () => {
  console.log('✅ PantryPal – Realtime Emailer Job starting…')
  try {
    const snap = await db.collection('notifications')
      .where('email_sent', '==', false)
      .where('type', 'in', ['DONATION_CLAIMED', 'ACCOUNT_ALERT'])
      .get()

    if (snap.empty) {
      console.log('✅ No unsent real-time notifications found.')
      return { statusCode: 200, body: 'No pending notifications.' }
    }

    console.log(` Found ${snap.size} notification(s) to process.`)
    let sent = 0, failed = 0

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
          console.log(`  Skipped ${data.type} for UID ${uid} (notifications disabled)`)
          await doc.ref.update({ email_sent: true })
          continue
        }

        let subject = 'PantryPal Notification'
        let title = 'Notification'
        if (data.type === 'DONATION_CLAIMED') { subject = '🎉 Someone Requested Your Food!'; title = 'Donation Request' }
        else if (data.type === 'ACCOUNT_ALERT') { subject = '⚠️ Security Alert for PantryPal'; title = 'Account Alert' }

        await transporter.sendMail({
          from: `"PantryPal Alerts" <${GMAIL_USER}>`,
          to: user.email,
          subject,
          text: data.message,
          html: buildHtml(title, data.message, user.email),
        })

        await doc.ref.update({ email_sent: true })
        console.log(`  ✅ Sent ${data.type} to ${user.email}`)
        sent++
      } catch (err) {
        console.error(`  ❌ Failed for doc ${doc.id}: ${err.message}`)
        failed++
      }
    }

    console.log(`✅ Done. ${sent} sent, ${failed} failed.`)
    return { statusCode: 200, body: `${sent} sent, ${failed} failed.` }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { statusCode: 500, body: err.message }
  }
}
