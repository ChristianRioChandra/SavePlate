<!-- App.vue -->
<template>
  <SessionTimer />
  <RouterView />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import SessionTimer from '@/components/SessionTimer.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

// Start/stop the real-time notification listener based on auth state
watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      notificationsStore.startListening()
    } else {
      notificationsStore.stopListening()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
html,
body,
#app {
  width: 100%;
  min-height: 100%;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--color-background-tertiary);
}
</style>
