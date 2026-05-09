import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/firebase'

let unsubscribeAuth: (() => void) | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  const isLoggedIn = computed(() => user.value !== null)
  const userName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || 'User')

  // Initialize auth state listener on first access
  const initAuthListener = () => {
    if (unsubscribeAuth !== null) return // Already initialized

    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false

      // Update localStorage for router guard compatibility
      if (firebaseUser) {
        localStorage.setItem('isLogin', 'true')
      } else {
        localStorage.removeItem('isLogin')
      }
    })
  }

  const logout = async () => {
    try {
      await auth.signOut()
      user.value = null
      localStorage.removeItem('isLogin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Initialize on store creation
  initAuthListener()

  return {
    user,
    isLoading,
    isLoggedIn,
    userName,
    logout
  }
})
