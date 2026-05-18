/* eslint-disable */
import { admin, db, transporter, GMAIL_USER, LOGO_URL } from './utils/firebase-init.mjs'

function buildHtml(displayName, items, todayStr) {
  const greeting = displayName ? `Hi <strong>${displayName}</strong>,` : 'Hi there,'
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1e293b;text-transform:capitalize;">${item.meal_type}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#64748b;">${item.recipe_name || 'Generic Meal'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
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
              <a href="https://pantrypal-bit216.netlify.app" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">Open Meal Planner</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Automated daily meal reminder from PantryPal.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export const handler = async () => {
  console.log('✅ PantryPal – Daily Meal Reminder Job starting…')
  try {
    const today = new Date()
    const todayISO = today.toISOString().split('T')[0]

    const plansSnap = await db.collection('mealPlans').where('date', '==', todayISO).get()

    if (plansSnap.empty) {
      console.log('No meal plans found for today.')
      return { statusCode: 200, body: 'No meal plans for today.' }
    }

    let sent = 0, skipped = 0, failed = 0

    for (const planDoc of plansSnap.docs) {
      const uid = planDoc.data().user_id
      try {
        const userDoc = await db.collection('users').doc(uid).get()
        if (!userDoc.exists || !userDoc.data().email) continue
        const user = userDoc.data()

        if (user.email_notifications_enabled === false) {
          console.log(`  🚫 Skipped ${user.email} (notifications disabled)`)
          skipped++
          continue
        }

        const itemsSnap = await planDoc.ref.collection('mealPlanItems').get()
        if (itemsSnap.empty) continue

        const items = itemsSnap.docs.map((d) => d.data())
        await transporter.sendMail({
          from: `"PantryPal Meals" <${GMAIL_USER}>`,
          to: user.email,
          subject: `🍽️ Your Meal Plan for Today (${todayISO})`,
          text: `You have ${items.length} meals planned today. Open PantryPal for details!`,
          html: buildHtml(user.name || '', items, todayISO),
        })
        console.log(`  ✅ Sent meal reminder to ${user.email}`)
        sent++
      } catch (err) {
        console.error(`  ❌ Failed for UID ${uid}: ${err.message}`)
        failed++
      }
    }

    console.log(`✅ Done. ${sent} sent, ${skipped} skipped, ${failed} failed.`)
    return { statusCode: 200, body: `${sent} sent, ${skipped} skipped, ${failed} failed.` }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { statusCode: 500, body: err.message }
  }
}
