/* eslint-disable */
import { admin, db, transporter, GMAIL_USER, LOGO_URL } from './utils/firebase-init.mjs'

function formatDate(isoDate) {
  if (!isoDate) return 'unknown date'
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function daysUntil(isoDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate); target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function buildHtml(displayName, items) {
  const greeting = displayName ? `Hi <strong>${displayName}</strong>,` : 'Hi there,'
  const itemRows = items.map((item) => {
    const days = daysUntil(item.expiry_date)
    let urgencyColor = '#16a34a'; let urgencyLabel = `in ${days} day${days !== 1 ? 's' : ''}`
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
  }).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="PantryPal" style="display:block;margin:0 auto;height:65px;width:auto;" />
            <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">Food Expiry Notification</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              You have <strong>${items.length} item${items.length > 1 ? 's' : ''}</strong> expiring soon.
              Please consider using, sharing, or donating ${items.length > 1 ? 'them' : 'it'} before ${items.length > 1 ? 'they go' : 'it goes'} to waste.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:14px;">
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
            <div style="margin-top:28px;text-align:center;">
              <a href="https://pantrypal-bit216.netlify.app" target="_blank"
                 style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
                Manage My Pantry →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You are receiving this because you have an active PantryPal account.<br>
              This is an automated daily notification.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export const handler = async () => {
  console.log('✅ PantryPal – Daily Expiry Email Job starting…')

  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const future = new Date(today); future.setDate(today.getDate() + 3); future.setHours(23, 59, 59, 999)
    const todayISO = today.toISOString().split('T')[0]
    const futureISO = future.toISOString().split('T')[0]

    console.log(`✅ Checking items expiring between ${todayISO} and ${futureISO}…`)

    const foodSnap = await db.collection('food')
      .where('status', '==', 'available')
      .where('expiry_date', '>=', todayISO)
      .where('expiry_date', '<=', futureISO)
      .orderBy('expiry_date', 'asc')
      .get()

    if (foodSnap.empty) {
      console.log('✅ No expiring items found. No emails to send.')
      return { statusCode: 200, body: 'No expiring items.' }
    }

    const itemsByUser = {}
    foodSnap.forEach((docSnap) => {
      const data = docSnap.data()
      const uid = data.user_id
      if (!uid) return
      if (!itemsByUser[uid]) itemsByUser[uid] = []
      itemsByUser[uid].push(data)
    })

    const results = await Promise.allSettled(
      Object.entries(itemsByUser).map(async ([uid, items]) => {
        const userDoc = await db.collection('users').doc(uid).get()
        if (!userDoc.exists) throw new Error(`User not found: ${uid}`)
        const user = userDoc.data()
        if (!user.email) throw new Error(`No email for UID ${uid}`)
        if (user.email_notifications_enabled === false) {
          console.log(`  🚫 Skipped ${user.email} (notifications disabled)`)
          return { skipped: true }
        }

        const subject = items.length === 1
          ? `⚠️ "${items[0].name}" is expiring soon – PantryPal`
          : `⚠️ ${items.length} items in your pantry are expiring soon – PantryPal`

        await transporter.sendMail({
          from: `"PantryPal Alerts" <${GMAIL_USER}>`,
          to: user.email,
          subject,
          html: buildHtml(user.name || '', items),
        })

        const notifMessage = items.length === 1
          ? `"${items[0].name}" is about to expire. Use or donate it soon!`
          : `You have ${items.length} items about to expire soon. Check your inventory!`

        await db.collection('notifications').add({
          user_id: uid,
          type: 'EXPIRY_ALERT',
          message: notifMessage,
          is_read: false,
          email_sent: true,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        })

        console.log(`  ✅ Sent to ${user.email} (${items.length} item${items.length > 1 ? 's' : ''})`)
        return { sent: true }
      })
    )

    let sent = 0, skipped = 0, failed = 0
    results.forEach((r) => {
      if (r.status === 'fulfilled') r.value?.skipped ? skipped++ : sent++
      else { failed++; console.error('  ❌', r.reason?.message) }
    })
    console.log(`✅ Done. ${sent} sent, ${skipped} skipped, ${failed} failed.`)
    return { statusCode: 200, body: `${sent} sent, ${skipped} skipped, ${failed} failed.` }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { statusCode: 500, body: err.message }
  }
}
