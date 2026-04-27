<template>
  <div class="top-bar">
    <div class="page-title">
      <h2>{{ title }}</h2>
    </div>
    <div class="top-bar-actions">
      <div class="action-icons">
        <slot name="actions">
          <!-- Bell with unread badge — matches BaseTopbar -->
          <div
            class="bell-wrap clickable"
            title="Notifications"
            @click="$emit('open-notifications')"
          >
            <i class="bi bi-bell"></i>
            <span v-if="unreadCount && unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </div>
          <i class="bi bi-gear clickable" @click="navigateToSettings" title="Settings"></i>
          <i class="bi bi-box-arrow-right clickable" @click="navigateToHome" title="Logout"></i>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps<{
  title: string
  unreadCount?: number
}>()

defineEmits<{
  (e: 'open-notifications'): void
}>()

const navigateToSettings = () => router.push('/settings')
const navigateToHome = () => router.push('/')
</script>

<style scoped>
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
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
}

.page-title h2 {
  font-size: 1.65rem;
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

.action-icons {
  display: flex;
  gap: 22px;
  font-size: 1.35rem;
  color: #5f7f9e;
  align-items: center;
}

.action-icons i.clickable,
.bell-wrap.clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.action-icons i.clickable:hover,
.bell-wrap.clickable:hover {
  color: #2c7a4d;
}

/* Badge wrapper — needed so the badge can sit relative to the bell */
.bell-wrap {
  position: relative;
  display: flex;
  align-items: center;
  color: #5f7f9e;
  font-size: 1.35rem;
}

.notif-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #e53e3e;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
}
</style>
