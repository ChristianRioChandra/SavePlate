<!-- App.vue -->
<template>
  <!-- Show nothing until Firebase has resolved the auth state.
       This prevents a flash of the wrong page on refresh. -->
  <div v-if="!authStore.ready" class="app-loading">
    <span>Loading...</span>
  </div>

  <RouterView v-else />
</template>

<script setup lang="ts">
// import manageInventory from './views/ManageInventory.vue' // Adjust path as needed
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()

// Start listening to Firebase auth state as soon as the app mounts.
// This runs onAuthStateChanged once — it keeps watching for the entire
// lifetime of the app, so login/logout/refresh all stay in sync automatically.
onMounted(() => {
  authStore.initAuthListener()
})

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

onAuthStateChanged(auth, (user) => {
  console.log('Current user:', user)
})
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

.app-loading {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #888;
}
</style>
