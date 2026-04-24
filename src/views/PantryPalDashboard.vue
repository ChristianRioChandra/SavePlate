<template>
  <div class="dashboard-page">
    <!-- ── Notification Popup Overlay ─────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showNotifPopup" class="notif-overlay" @click.self="showNotifPopup = false">
        <div class="notif-popup">
          <div class="notif-popup-header">
            <span class="notif-popup-title">Recent</span>
            <button class="mark-read-btn" @click="markAllAsRead">Mark All As Read</button>
          </div>
          <div class="notif-popup-list">
            <div
              v-for="notif in notifications"
              :key="notif.id"
              class="notif-popup-item"
              :class="{ unread: !notif.read }"
            >
              <div class="notif-item-icon">{{ notif.icon }}</div>
              <div class="notif-item-body">
                <div class="notif-item-title">{{ notif.title }}</div>
                <div class="notif-item-detail">{{ notif.detail }}</div>
                <div class="notif-item-date">{{ notif.date }}, {{ notif.time }}</div>
              </div>
              <div v-if="!notif.read" class="notif-unread-dot"></div>
            </div>
            <div v-if="notifications.length === 0" class="notif-empty">No new notifications</div>
          </div>
          <button class="notif-view-all-btn" @click="viewAllNotifications">
            View All Notification
          </button>
        </div>
      </div>
    </Transition>

    <div class="dashboard" :class="{ blurred: showNotifPopup }">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <BaseTopbar
          title="Dashboard"
          search-placeholder="Search food, donations, meals..."
          v-model:search-value="searchQuery"
          :unread-count="unreadCount"
          @open-notifications="showNotifPopup = true"
        />

        <div class="dashboard-grid">
          <!-- Welcome Card -->
          <div class="dashboard-card welcome-card">
            <div class="welcome-name">Welcome back, Alex 👋</div>
            <div class="welcome-sub">You have 3 items expiring this week.</div>
          </div>

          <!-- Expiry Alerts -->
          <div class="dashboard-card alert-card">
            <div class="card-header">
              <i class="bi bi-exclamation-triangle"></i>
              <span>Expiry Alerts</span>
            </div>
            <div class="alert-list">
              <div class="alert-item">⚠ Bread is about to expire — 1 day left</div>
              <div class="alert-item">⚠ Milk is about to expire — 2 days left</div>
            </div>
          </div>

          <!-- Inventory Summary -->
          <div class="dashboard-card inventory-card">
            <div class="card-header">
              <i class="bi bi-box-seam"></i>
              <span>Inventory</span>
            </div>
            <div class="inventory-list">
              <div v-for="item in inventoryItems" :key="item.id" class="inventory-item">
                <div class="inv-icon">{{ item.icon }}</div>
                <div class="inv-info">
                  <div class="inv-name">{{ item.name }}</div>
                  <div class="inv-sub">{{ item.location }} · Exp: {{ item.expiry }}</div>
                </div>
                <span class="inv-tag" :class="{ warn: item.warning }">{{ item.tag }}</span>
              </div>
            </div>
            <button class="card-action-btn" @click="router.push('/inventory')">
              Manage Inventory →
            </button>
          </div>

          <!-- Meal Plan Summary -->
          <div class="dashboard-card meal-card">
            <div class="card-header">
              <i class="bi bi-calendar"></i>
              <span>This Week's Meal Plan</span>
            </div>
            <div class="meal-nav">
              <button class="meal-nav-btn"><i class="bi bi-chevron-left"></i></button>
              <span class="meal-day-title">Monday, 14 Apr</span>
              <button class="meal-nav-btn"><i class="bi bi-chevron-right"></i></button>
            </div>
            <div class="meal-slot">
              <div class="meal-slot-label">Breakfast</div>
              <div class="meal-slot-name">Cereal with Milk</div>
            </div>
            <div class="meal-slot">
              <div class="meal-slot-label">Lunch</div>
              <div class="meal-slot-empty">Not planned yet</div>
            </div>
            <div class="meal-slot">
              <div class="meal-slot-label">Dinner</div>
              <div class="meal-slot-name">Shrimp Fried Rice</div>
            </div>
            <button class="card-action-btn" @click="router.push('/meal-plan')">
              Manage Plan →
            </button>
          </div>

          <!-- Recommendations -->
          <div class="dashboard-card reco-card">
            <div class="card-header">
              <i class="bi bi-lightbulb"></i>
              <span>Try Out</span>
            </div>
            <div class="reco-label">Based on expiring items</div>
            <div class="reco-item">Rendang — uses beef, coconut milk</div>
            <div class="reco-item">Milk Pudding — uses milk, sugar</div>
          </div>

          <!-- Food Saved Progress -->
          <div class="dashboard-card progress-card">
            <div class="card-header">
              <i class="bi bi-graph-up"></i>
              <span>Food Saved This Month</span>
            </div>
            <div class="progress-wrapper">
              <div class="progress-label">
                <span>Progress</span>
                <span class="progress-value">65%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 65%"></div>
              </div>
            </div>
            <div class="progress-sub">13 of 20 items used or donated before expiry</div>
          </div>
        </div>
      </div>

      <BaseRightSidebar
        :total-items="inventoryItems.length"
        :expiring-soon="3"
        @add-food="handleAddFood"
        @donate-items="router.push('/donations')"
        @plan-meal="router.push('/meal-plan')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import BaseRightSidebar from '@/components/BaseRightSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'

const router = useRouter()

// ─── Notification popup ───────────────────────────────────────────────────────
const showNotifPopup = ref(false)

interface NotifItem {
  id: number
  icon: string
  title: string
  type: string
  detail: string
  date: string
  time: string
  read: boolean
}

const notifications = ref<NotifItem[]>([
  {
    id: 1,
    icon: '🥛',
    title: 'Milk about to Expire',
    type: 'Expiry Notification',
    detail: 'Milk about to Expire',
    date: '31 March 2026',
    time: '09:30 AM',
    read: false,
  },
  {
    id: 2,
    icon: '🍞',
    title: 'Bread about to Expire',
    type: 'Expiry Notification',
    detail: 'Bread is expiring in 1 day. Use or donate it.',
    date: '31 March 2026',
    time: '08:00 AM',
    read: true,
  },
])

const unreadCount = ref(notifications.value.filter((n) => !n.read).length)

function markAllAsRead() {
  notifications.value.forEach((n) => (n.read = true))
  unreadCount.value = 0
}

function viewAllNotifications() {
  showNotifPopup.value = false
  router.push('/notifications')
}

interface InventoryItem {
  id: number
  icon: string
  name: string
  location: string
  expiry: string
  tag: string
  warning?: boolean
}

const searchQuery = ref('')

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const inventoryItems = ref<InventoryItem[]>([
  {
    id: 1,
    icon: '🥛',
    name: 'UltraMilk · 500ml Original',
    location: 'Fridge',
    expiry: '6 Apr 2026',
    tag: '2d left',
    warning: true,
  },
  {
    id: 2,
    icon: '🍳',
    name: 'Shrimp Fried Rice',
    location: 'Freezer',
    expiry: '20 Apr 2026',
    tag: 'Fresh',
  },
  {
    id: 3,
    icon: '🍗',
    name: 'Chicken Nuggets',
    location: 'Freezer',
    expiry: '25 Apr 2026',
    tag: 'Fresh',
  },
])

function handleAddFood() {
  router.push('/inventory?action=add')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.bi {
  -webkit-text-stroke: 1.1px currentColor;
}

.dashboard-page {
  background: #eef2f8;
  font-family: 'Inter', sans-serif;
  color: #0a1c2f;
  min-height: 100vh;
  padding: 24px 20px;
}

.dashboard {
  max-width: 1760px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr) clamp(232px, 18vw, 276px);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

/* ---------- SIDEBAR ---------- */
.sidebar {
  background: white;
  border-radius: 34px;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.06);
  padding: 34px 24px 26px;
  position: sticky;
  top: 24px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 44px;
  padding-left: 6px;
}

.logo-icon {
  background: #2c7a4d;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.logo-text {
  font-weight: 800;
  font-size: 1.55rem;
  letter-spacing: -0.5px;
  color: #1e3a2f;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin: 8px 0;
  border-radius: 22px;
  font-weight: 500;
  font-size: 0.98rem;
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

/* ---------- MAIN CONTENT ---------- */
.main-content {
  min-width: 0;
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
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
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

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.dashboard-card {
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(31, 47, 62, 0.04);
  border: 1px solid #e8eef7;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1e3a2f;
}

.card-header i {
  color: #2c7a4d;
  font-size: 1.3rem;
}

.welcome-name {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-sub {
  color: #577190;
  font-size: 0.95rem;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  background: #fef3c7;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #92400e;
  border-left: 4px solid #f59e0b;
}

.inventory-list {
  margin-bottom: 16px;
}

.inventory-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #edf2f7;
}

.inv-icon {
  width: 40px;
  height: 40px;
  background: #f3f6fb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.inv-info {
  flex: 1;
}

.inv-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.inv-sub {
  font-size: 0.8rem;
  color: #6883a8;
}

.inv-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  background: #dcfce7;
  color: #166534;
  font-weight: 600;
}

.inv-tag.warn {
  background: #fef3c7;
  color: #92400e;
}

.card-action-btn {
  width: 100%;
  background: #f3f6fb;
  border: none;
  padding: 12px;
  border-radius: 40px;
  font-weight: 600;
  color: #2c3e4e;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 8px;
}

.card-action-btn:hover {
  background: #e2e8f0;
}

.meal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.meal-nav-btn {
  background: none;
  border: 1px solid #e2e8f0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  color: #5f7f9e;
}

.meal-day-title {
  font-weight: 600;
}

.meal-slot {
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}

.meal-slot-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7e95b0;
  margin-bottom: 4px;
}

.meal-slot-name {
  font-weight: 500;
}

.meal-slot-empty {
  color: #9aafc4;
  font-style: italic;
}

.reco-label {
  font-size: 0.8rem;
  color: #7e95b0;
  margin-bottom: 12px;
}

.reco-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 8px;
  font-weight: 500;
}

.progress-wrapper {
  margin: 16px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.progress-value {
  color: #2c7a4d;
  font-weight: 700;
}

.progress-bar {
  height: 12px;
  background: #e6edf5;
  border-radius: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2c7a4d;
  border-radius: 20px;
}

.progress-sub {
  font-size: 0.8rem;
  color: #6883a8;
  margin-top: 8px;
}

/* ---------- RIGHT SIDEBAR ---------- */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: sticky;
  top: 24px;
}

.right-box {
  background: white;
  border-radius: 28px;
  padding: 20px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.right-btn {
  background: #f3f6fb;
  border: none;
  padding: 13px 16px;
  border-radius: 40px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e4e;
}

.right-btn:hover {
  background: #e2e8f0;
}

.right-btn i {
  width: 20px;
  color: #2c7a4d;
}

.selection-count {
  background: #eef2ff;
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 0.82rem;
  font-weight: 600;
  align-self: flex-start;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .warning {
  color: #d97706;
}

/* ── Notification Popup ────────────────────────────────────────────────────── */
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
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

/* Blur the dashboard content when popup is open */
.dashboard.blurred {
  filter: blur(2px);
  pointer-events: none;
  user-select: none;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1120px) {
  .dashboard {
    grid-template-columns: 232px minmax(0, 1fr);
  }
  .right-sidebar {
    grid-column: 1 / -1;
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 920px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .sidebar,
  .right-sidebar {
    position: static;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
