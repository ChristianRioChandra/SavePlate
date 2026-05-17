// services/notificationService.ts
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { FoodItem } from './foodService'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const NotificationType = {
  EXPIRY_ALERT: 'EXPIRY_ALERT',
  MOVE_TO_DONATION: 'MOVE_TO_DONATION',
  DONATION_CLAIMED: 'DONATION_CLAIMED',
  DONATION_CONFIRMED: 'DONATION_CONFIRMED',
  DONATION_POSTED: 'DONATION_POSTED',
  MEAL_REMINDER: 'MEAL_REMINDER',
  ACCOUNT_ALERT: 'ACCOUNT_ALERT',
} as const

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateNotificationPayload {
  type: NotificationTypeValue
  message: string
  relatedEntityId?: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationTypeValue
  message: string
  is_read: boolean
  related_entity_id: string | null
  created_at: unknown // Firestore Timestamp
}

const NOTIF_COL = 'notifications'

// ─── Create Notification ──────────────────────────────────────────────────────

export async function createNotification(
  uid: string,
  { type, message, relatedEntityId = null }: CreateNotificationPayload
): Promise<void> {
  await addDoc(collection(db, NOTIF_COL), {
    user_id: uid,
    type,
    message,
    is_read: false,
    email_sent: false,
    related_entity_id: relatedEntityId,
    created_at: serverTimestamp(),
  })
}

// ─── Get All Notifications ────────────────────────────────────────────────────

export async function getUserNotifications(uid: string): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIF_COL),
    where('user_id', '==', uid),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
}

// ─── Get Unread Notifications ─────────────────────────────────────────────────

export async function getUnreadNotifications(uid: string): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIF_COL),
    where('user_id', '==', uid),
    where('is_read', '==', false),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
}

// ─── Mark as Read ─────────────────────────────────────────────────────────────

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, NOTIF_COL, notificationId), { is_read: true })
}

// ─── Mark All as Read ─────────────────────────────────────────────────────────

export async function markAllNotificationsAsRead(uid: string): Promise<void> {
  const unread = await getUnreadNotifications(uid)
  await Promise.all(unread.map(n => markNotificationAsRead(n.id)))
}

// ─── Trigger Expiry Notifications ────────────────────────────────────────────

export async function triggerExpiryNotifications(
  uid: string,
  expiringSoonItems: FoodItem[]
): Promise<void> {
  await Promise.all(
    expiringSoonItems.map(item =>
      createNotification(uid, {
        type: NotificationType.EXPIRY_ALERT,
        message: `"${item.name}" is expiring soon on ${item.expiryDate}. Consider using or donating it.`,
        relatedEntityId: item.id,
      })
    )
  )
}
