<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const showWarning = ref(false)
const timeRemaining = ref(0)
let timerInterval: number | null = null

// Constants (in milliseconds)
const INACTIVITY_TIMEOUT = 40 * 60 * 1000 // 40 minutes
const WARNING_THRESHOLD = 35 * 60 * 1000 // Show warning after 35 minutes of inactivity
const ABSOLUTE_TIMEOUT = 12 * 60 * 60 * 1000 // 12 hours

const checkSession = () => {
  if (!authStore.isLoggedIn || !authStore.loginTime) return

  const now = Date.now()
  const inactiveDuration = now - authStore.lastActivityTime
  const absoluteDuration = now - authStore.loginTime

  // 1. Check Absolute Expiration
  if (absoluteDuration >= ABSOLUTE_TIMEOUT) {
    handleLogout('Your session has expired (12h limit). Please log in again.')
    return
  }

  // 2. Check Inactivity
  if (inactiveDuration >= INACTIVITY_TIMEOUT) {
    handleLogout('You have been logged out due to inactivity.')
    return
  }

  // 3. Check for Warning
  if (inactiveDuration >= WARNING_THRESHOLD) {
    showWarning.value = true
    timeRemaining.value = Math.ceil((INACTIVITY_TIMEOUT - inactiveDuration) / 1000)
  } else {
    showWarning.value = false
  }
}

const handleLogout = (message: string) => {
  authStore.logout()
  alert(message)
  router.push('/login')
  showWarning.value = false
}

const stayLoggedIn = () => {
  authStore.resetActivity()
  showWarning.value = false
}

// Activity Listeners
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
const handleUserActivity = () => {
  authStore.resetActivity()
}

onMounted(() => {
  // Check every second
  timerInterval = window.setInterval(checkSession, 1000)

  // Add event listeners
  activityEvents.forEach(event => {
    window.addEventListener(event, handleUserActivity)
  })
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  
  // Remove event listeners
  activityEvents.forEach(event => {
    window.removeEventListener(event, handleUserActivity)
  })
})

const formattedTimeRemaining = computed(() => {
  const mins = Math.floor(timeRemaining.value / 60)
  const secs = timeRemaining.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})
</script>

<template>
  <Transition name="fade">
    <div v-if="showWarning" class="session-warning-overlay">
      <div class="warning-card">
        <div class="warning-icon">
          <i class="bi bi-clock-history"></i>
        </div>
        <h3>Session Expiring</h3>
        <p>You have been inactive for a while. You will be logged out automatically in:</p>
        <div class="countdown">{{ formattedTimeRemaining }}</div>
        <div class="actions">
          <button class="logout-btn" @click="handleLogout('Logged out manually.')">Logout Now</button>
          <button class="stay-btn" @click="stayLoggedIn">Stay Logged In</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.session-warning-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 28, 47, 0.4);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.warning-card {
  background: white;
  padding: 34px;
  border-radius: 32px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.warning-icon {
  font-size: 3.5rem;
  color: #f59e0b;
  margin-bottom: 16px;
}

h3 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0a1c2f;
  margin-bottom: 12px;
}

p {
  color: #577190;
  line-height: 1.6;
  margin-bottom: 24px;
}

.countdown {
  font-size: 3rem;
  font-weight: 900;
  color: #1f5e3a;
  margin-bottom: 30px;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  gap: 12px;
}

button {
  flex: 1;
  padding: 16px;
  border-radius: 18px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.logout-btn {
  background: #f1f5fb;
  color: #577190;
}

.logout-btn:hover {
  background: #e2e8f0;
}

.stay-btn {
  background: #2c7a4d;
  color: white;
  box-shadow: 0 10px 20px rgba(44, 122, 77, 0.2);
}

.stay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(44, 122, 77, 0.25);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
