// stores/notifications.ts
// ─────────────────────────────────────────────────────────────────────────────
// Real-time Firestore notification store shared by:
//   • PantryPalDashboard.vue  (popup panel + unread badge)
//   • NotificationsView.vue   (full page)
// ─────────────────────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string
  user_id: string
  type: string        // e.g. 'EXPIRY_ALERT', 'DONATION_REQUEST', ...
  message: string
  is_read: boolean
  related_entity_id: string | null
  created_at: { seconds: number; nanoseconds: number } | null
}

// ─── Icon map (type → emoji) ──────────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  EXPIRY_ALERT:        '⏰',
  MOVE_TO_DONATION:    '🎁',
  DONATION_CLAIMED:    '👤',
  DONATION_CONFIRMED:  '✅',
  DONATION_POSTED:     '📢',
  MEAL_REMINDER:       '🍽️',
  ACCOUNT_ALERT:       '🔔',
}

const TYPE_LABELS: Record<string, string> = {
  EXPIRY_ALERT:        'Expiry Alert',
  MOVE_TO_DONATION:    'Donation Suggestion',
  DONATION_CLAIMED:    'Donation Request',
  DONATION_CONFIRMED:  'Donation Confirmed',
  DONATION_POSTED:     'Donation Posted',
  MEAL_REMINDER:       'Meal Reminder',
  ACCOUNT_ALERT:       'Account Alert',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: AppNotification['created_at']): { date: string; time: string } {
  if (!ts || typeof ts.seconds !== 'number') {
    return { date: '—', time: '' }
  }
  const d = new Date(ts.seconds * 1000)
  const date = d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return { date, time }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationsStore = defineStore('notifications', () => {
  const authStore = useAuthStore()

  const rawNotifications = ref<AppNotification[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  // ── Derived UI-friendly list ──────────────────────────────────────────────
  const notifications = computed(() =>
    rawNotifications.value.map((n) => {
      const { date, time } = formatTimestamp(n.created_at)
      return {
        ...n,
        icon: TYPE_ICONS[n.type] ?? '🔔',
        title: n.message,
        typeLabel: TYPE_LABELS[n.type] ?? n.type,
        detail: n.message,
        date,
        time,
        read: n.is_read,
      }
    })
  )

  const unreadCount = computed(() => rawNotifications.value.filter((n) => !n.is_read).length)

  // ── Start real-time subscription ──────────────────────────────────────────
  function startListening() {
    const uid = authStore.user?.uid
    if (!uid) return
    if (unsubscribe) return // already subscribed

    isLoading.value = true

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', uid),
      orderBy('created_at', 'desc'),
    )

    unsubscribe = onSnapshot(
      q,
      (snap) => {
        rawNotifications.value = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppNotification, 'id'>),
        }))
        isLoading.value = false
      },
      (err) => {
        console.error('[NotificationsStore] Firestore error:', err)
        isLoading.value = false
      },
    )
  }

  // ── Stop subscription (call on component unmount or logout) ───────────────
  function stopListening() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // ── Mark one notification as read ─────────────────────────────────────────
  async function markAsRead(notifId: string) {
    await updateDoc(doc(db, 'notifications', notifId), { is_read: true })
  }

  // ── Mark all unread as read ───────────────────────────────────────────────
  async function markAllAsRead() {
    const unread = rawNotifications.value.filter((n) => !n.is_read)
    if (unread.length === 0) return
    const batch = writeBatch(db)
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { is_read: true })
    })
    await batch.commit()
  }

  // ── Delete one notification ───────────────────────────────────────────────
  async function deleteNotification(notifId: string) {
    await deleteDoc(doc(db, 'notifications', notifId))
  }

  // ── Delete a set of notifications ────────────────────────────────────────
  async function deleteMultiple(notifIds: string[]) {
    if (notifIds.length === 0) return
    const batch = writeBatch(db)
    notifIds.forEach((id) => {
      batch.delete(doc(db, 'notifications', id))
    })
    await batch.commit()
  }

  // ── Mark a set of notifications as read ──────────────────────────────────
  async function markMultipleAsRead(notifIds: string[]) {
    if (notifIds.length === 0) return
    const batch = writeBatch(db)
    notifIds.forEach((id) => {
      batch.update(doc(db, 'notifications', id), { is_read: true })
    })
    await batch.commit()
  }

  return {
    notifications,
    rawNotifications,
    unreadCount,
    isLoading,
    startListening,
    stopListening,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    markMultipleAsRead,
  }
})
