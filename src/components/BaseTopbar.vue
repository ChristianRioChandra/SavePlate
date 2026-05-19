<template>
  <div class="top-bar-container">
    <!-- ── Notification Popup Overlay ─────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
      <div v-if="showNotifPopup" class="notif-overlay" @click.self="showNotifPopup = false">
        <div class="notif-popup">
          <div class="notif-popup-header">
            <span class="notif-popup-title">Recent</span>
            <button class="mark-read-btn" @click="markAllAsRead">Mark All As Read</button>
          </div>
          <div class="notif-popup-list">
            <div
              v-for="notif in notificationsStore.notifications"
              :key="notif.id"
              class="notif-popup-item"
              :class="{ unread: !notif.is_read }"
              @click="handleNotifClick(notif)"
            >
              <div class="notif-item-icon"><i class="bi" :class="notif.icon"></i></div>
              <div class="notif-item-body">
                <div class="notif-item-title">{{ notif.title }}</div>
                <div class="notif-item-detail">{{ notif.message }}</div>
                <div class="notif-item-date">{{ notif.date }}, {{ notif.time }}</div>
              </div>
              <div v-if="!notif.is_read" class="notif-unread-dot"></div>
            </div>
            <div v-if="notificationsStore.notifications.length === 0" class="notif-empty">
              No new notifications
            </div>
          </div>
          <button class="notif-view-all-btn" @click="viewAllNotifications">
            View All Notification
          </button>
        </div>
      </div>
      </Transition>
    </Teleport>

    <div class="top-bar" :class="{ blurred: showNotifPopup }">
      <div class="page-title">
        <h2>{{ title }}</h2>
      </div>
      <div class="top-bar-actions">
        <div v-if="showSearch" class="search-wrapper">
          <i class="bi bi-search"></i>
          <input
            type="text"
            :placeholder="searchPlaceholder"
            :value="searchValue"
            @input="$emit('update:searchValue', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="action-icons">
          <slot name="actions">
            <div class="notif-bell-container" @click="showNotifPopup = true">
              <i class="bi bi-bell clickable" title="Notifications"></i>
              <span v-if="notificationsStore.unreadCount > 0" class="notif-badge">
                {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
              </span>
            </div>
            <i class="bi bi-gear clickable" @click="navigateToSettings" title="Settings"></i>
            <i class="bi bi-box-arrow-right clickable" @click="handleLogout" title="Logout"></i>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

const showNotifPopup = ref(false)

const markAllAsRead = () => {
  notificationsStore.markAllAsRead()
}

const handleNotifClick = async (notif: any) => {
  try {
    if (!notif.is_read && !notif.read) {
      await notificationsStore.markAsRead(notif.id)
    }
  } catch (err) {
    console.warn('Failed to mark notification as read:', err)
  }
  showNotifPopup.value = false

  const typeStr = (notif.type || '').toUpperCase()
  const msgStr = (notif.title || notif.message || notif.detail || '').toUpperCase()

  if (typeStr.includes('EXPIRY') || msgStr.includes('EXPIR')) {
    router.push('/inventory')
  } else if (typeStr.includes('DONATION') || msgStr.includes('DONAT')) {
    router.push('/donations')
  } else if (typeStr.includes('MEAL') || msgStr.includes('MEAL')) {
    router.push('/meal-plan')
  } else if (typeStr.includes('ACCOUNT') || msgStr.includes('ACCOUNT')) {
    router.push('/settings')
  } else {
    alert(`Debug - Unhandled Notification:\nType: ${notif.type}\nMessage: ${notif.title || notif.message || notif.detail}`)
  }
}

const viewAllNotifications = () => {
  showNotifPopup.value = false
  router.push('/notifications')
}

const props = withDefaults(
  defineProps<{
    title: string
    searchPlaceholder?: string
    searchValue?: string
    unreadCount?: number
    showSearch?: boolean
  }>(),
  {
    searchPlaceholder: 'Search...',
    unreadCount: 0,
    showSearch: true,
  },
)

defineEmits<{
  (e: 'open-notifications'): void
  (e: 'update:searchValue', value: string): void
}>()

const navigateToSettings = () => {
  router.push('/settings')
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.top-bar-container {
  position: sticky;
  top: 24px;
  z-index: 50;
  width: 100%;
}

.top-bar {
  background: white;
  border-radius: 36px;
  padding: 18px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.page-title h2 {
  font-size: 2.15rem;
  font-weight: 800;
}

.top-bar-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  min-width: min(100%, 420px);
  justify-content: flex-end;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 60px;
  padding: 0 18px;
  gap: 10px;
  min-width: min(100%, 360px);
  min-height: 50px;
}

.search-wrapper i {
  color: #6f89ad;
  font-size: 1.25rem;
}

.search-wrapper input {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  outline: none;
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.action-icons {
  display: flex;
  gap: 22px;
  font-size: 1.35rem;
  color: #5f7f9e;
}

.action-icons i.clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.action-icons i.clickable:hover {
  color: #2c7a4d;
}

.notif-bell-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  transform: translate(50%, -50%);
  background: linear-gradient(135deg, #ff4d4d, #e60000);
  color: white;
  font-size: 9px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  padding: 0 4.5px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid white;
  pointer-events: none;
  box-shadow: 0 3px 8px rgba(230, 0, 0, 0.35);
  font-family: 'Inter', sans-serif;
  line-height: 1;
}

/* ── Notification Popup ────────────────────────────────────────────────────── */
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(10, 28, 47, 0.35);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 80px 48px 0 0;
}

.notif-popup {
  background: #ffffff;
  border-radius: 20px;
  width: 360px;
  box-shadow: 0 20px 60px rgba(10, 28, 47, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notif-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
}

.notif-popup-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0a1c2f;
}

.mark-read-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2c7a4d;
  cursor: pointer;
}

.mark-read-btn:hover {
  text-decoration: underline;
}

.notif-popup-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px 0;
}

.notif-popup-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  transition: background 0.15s;
  cursor: pointer;
}

.notif-popup-item:hover {
  background: #f8fafc;
}

.notif-popup-item.unread {
  background: #f0f7ff;
}

.notif-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  border: 1.5px solid #c8e6c9;
}

.notif-item-body {
  flex: 1;
  min-width: 0;
}

.notif-item-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: #0a1c2f;
  margin-bottom: 2px;
}

.notif-item-detail {
  font-size: 0.78rem;
  color: #577190;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item-date {
  font-size: 0.72rem;
  color: #9aafc4;
}

.notif-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2c7a4d;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-empty {
  padding: 24px;
  text-align: center;
  color: #9aafc4;
  font-size: 0.88rem;
}

.notif-view-all-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-top: 1px solid #edf2f7;
  background: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  color: #2c7a4d;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}

.notif-view-all-btn:hover {
  background: #f0fdf4;
}

/* Blur effect */
.top-bar.blurred {
  filter: blur(2px);
  pointer-events: none;
  user-select: none;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
