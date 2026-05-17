<!-- src/components/BaseSidebar.vue -->
<template>
  <aside class="sidebar">
    <div
      class="logo-area"
      @click="navigateTo('/dashboard')"
      role="button"
      tabindex="0"
      @keydown.enter.space="navigateTo('/dashboard')"
    >
      <img class="logo-image" :src="logoFull" :alt="appName" />
    </div>
    <nav class="main-nav">
      <div
        v-for="item in mainNavItems"
        :key="item.route"
        class="nav-item"
        :class="{ active: isActive(item.route) }"
        @click="navigateTo(item.route)"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span v-else class="nav-dot"></span>
        <span>{{ item.label }}</span>
      </div>
    </nav>
    <div v-if="settingsItem" class="footer-nav">
      <hr />
      <div
        class="nav-item"
        :class="{ active: isActive(settingsItem.route) }"
        @click="navigateTo(settingsItem.route)"
      >
        <i v-if="settingsItem.icon" :class="settingsItem.icon"></i>
        <span v-else class="nav-dot"></span>
        <span>{{ settingsItem.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import logoFull from '@/assets/logo/full.png'

export interface NavItem {
  label: string
  route: string
  icon?: string // optional; if missing, uses nav-dot
}

const props = withDefaults(
  defineProps<{
    navItems: NavItem[]
    appName?: string
  }>(),
  {
    appName: 'PantryPal',
  },
)

const router = useRouter()
const route = useRoute()

const mainNavItems = computed(() => props.navItems.filter((item) => item.label !== 'Settings'))
const settingsItem = computed(() => props.navItems.find((item) => item.label === 'Settings'))

const isActive = (itemRoute: string) => {
  if (itemRoute === '/') return route.path === '/'
  return route.path.startsWith(itemRoute)
}

const navigateTo = (routePath: string) => router.push(routePath)
</script>

<style scoped>
.sidebar {
  background: white;
  border-radius: 34px;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.06);
  padding: 40px 32px;
  position: sticky;
  top: 24px;
  height: calc(100vh - 48px);
  width: 280px;
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 56px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.logo-area:hover {
  opacity: 0.8;
}

.logo-image {
  display: block;
  width: min(100%, 168px);
  height: auto;
}

.main-nav {
  flex: 1;
  overflow-y: auto;
}

.footer-nav {
  margin-top: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin: 12px 0;
  border-radius: 18px;
  font-weight: 500;
  font-size: 1.05rem;
  color: #17304f;
  cursor: pointer;
  transition: 0.2s;
}

.nav-item i {
  width: 24px;
  color: #6883a8;
}

.nav-item:hover {
  background: #f5f9ff;
}

.nav-item.active {
  background: #eef6ef;
  color: #2c6e49;
}

.nav-item.active i {
  color: #2c6e49;
}

hr {
  margin: 28px 0 0;
  border-top: 1px solid #e9edf2;
}

.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border-secondary, #d1d5db);
  flex-shrink: 0;
  margin-right: 8px;
}
.nav-item.active .nav-dot {
  background: #1d9e75;
}
</style>
