<template>
  <div class="top-bar">
    <div class="page-title">
      <h2>{{ title }}</h2>
    </div>
    <div class="top-bar-actions">
      <div class="search-wrapper">
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
          <div class="notif-bell-container">
            <i
              class="bi bi-bell clickable"
              title="Notifications"
              @click="$emit('open-notifications')"
            ></i>
            <span v-if="unreadCount && unreadCount > 0" class="notif-badge">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </div>
          <i class="bi bi-gear clickable" @click="navigateToSettings" title="Settings"></i>
          <i class="bi bi-box-arrow-right clickable" @click="handleLogout" title="Logout"></i>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

defineProps<{
  title: string
  searchPlaceholder?: string
  searchValue?: string
  unreadCount?: number
}>()

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
 .top-bar {
  position: sticky;
  top: 24px;
  z-index: 50;
  background: white;
  border-radius: 36px;
  padding: 18px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
}

.page-title h2 {
  font-size: 1.55rem;
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
  display: flex;
  align-items: center;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #dc2626;
  color: white;
  font-size: 10px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  pointer-events: none;
}
</style>
