<!-- App.vue -->
<template>
  <SessionTimer />
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import SessionTimer from '@/components/SessionTimer.vue'
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
