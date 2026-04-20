// stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { getUserProfile, logoutUser, type UserProfile } from '../services/authService'
import { getExpiringSoonItems, type FoodItem } from '../services/foodService'
import {
  getUnreadNotifications,
  triggerExpiryNotifications,
  type Notification,
} from '../services/notificationService'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const user = ref<User | null>(null) // Firebase Auth user object
  const profile = ref<UserProfile | null>(null) // Firestore /users/{uid} document
  const unreadNotifications = ref<Notification[]>([])
  const ready = ref(false) // true once Firebase has resolved auth state on load
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ─────────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!user.value)
  const uid = computed(() => user.value?.uid ?? null)
  const displayName = computed(() => profile.value?.name ?? user.value?.email ?? 'User')
  const unreadCount = computed(() => unreadNotifications.value.length)

  // ─── Load Profile + Notifications ────────────────────────────────────────────
  async function loadUserData(firebaseUser: User) {
    try {
      await firebaseUser.getIdToken(true)

      // Give Firestore time to establish connection on first load
      await new Promise((resolve) => setTimeout(resolve, 1500))

      profile.value = await getUserProfile(firebaseUser.uid)
      unreadNotifications.value = await getUnreadNotifications(firebaseUser.uid)

      const expiring: FoodItem[] = await getExpiringSoonItems(firebaseUser.uid, 3)
      if (expiring.length > 0) {
        await triggerExpiryNotifications(firebaseUser.uid, expiring)
        unreadNotifications.value = await getUnreadNotifications(firebaseUser.uid)
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
    }
  }

  // ─── Init Auth Listener ───────────────────────────────────────────────────────
  // Call once in App.vue. Firebase will automatically restore the session
  // on page refresh — no need for localStorage.
  function initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser
        await loadUserData(firebaseUser)
      } else {
        user.value = null
        profile.value = null
        unreadNotifications.value = []
      }
      ready.value = true // Safe to render routes now
    })
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────
  async function logout() {
    loading.value = true
    try {
      await logoutUser()
      user.value = null
      profile.value = null
      unreadNotifications.value = []
    } catch (err: unknown) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  async function refreshNotifications() {
    if (!uid.value) return
    unreadNotifications.value = await getUnreadNotifications(uid.value)
  }

  async function refreshProfile() {
    if (!uid.value) return
    profile.value = await getUserProfile(uid.value)
  }

  return {
    user,
    profile,
    unreadNotifications,
    ready,
    loading,
    error,
    isLoggedIn,
    uid,
    displayName,
    unreadCount,
    initAuthListener,
    logout,
    refreshNotifications,
    refreshProfile,
  }
})
