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

// Global notification listener tied to auth state
watch(() => authStore.user?.uid, (newUid) => {
  if (newUid) {
    notificationsStore.startListening()
  } else {
    notificationsStore.stopListening()
  }
}, { immediate: true })
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
