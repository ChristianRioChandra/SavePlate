import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/firebase'

let unsubscribeAuth: (() => void) | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  let resolveAuth: (value: void | PromiseLike<void>) => void
  const isReady = new Promise<void>((resolve) => {
    resolveAuth = resolve
  })
  const otpVerified = ref(sessionStorage.getItem('otp_verified') === 'true')
  const twoFactorEnabled = ref(localStorage.getItem('2fa_enabled') === 'true')

  // Session Management
  const loginTime = ref(Number(localStorage.getItem('session_start')) || null)
  const lastActivityTime = ref(Date.now())

  const isLoggedIn = computed(
    () => user.value !== null && (otpVerified.value || !twoFactorEnabled.value),
  )
  const isAuthOnly = computed(() => user.value !== null)
  const is2FARequired = computed(() => twoFactorEnabled.value && !otpVerified.value)
  
  // Custom display name override for immediate UI reactivity
  const displayNameOverride = ref<string | null>(null)
  
  const userName = computed(
    () => displayNameOverride.value || user.value?.displayName || user.value?.email?.split('@')[0] || 'User',
  )

  const updateDisplayName = (name: string) => {
    displayNameOverride.value = name
  }

  const setOtpVerified = (verified: boolean) => {
    otpVerified.value = verified
    if (verified) {
      sessionStorage.setItem('otp_verified', 'true')
      // Mark session start when fully verified
      const now = Date.now()
      loginTime.value = now
      localStorage.setItem('session_start', now.toString())
    } else {
      sessionStorage.removeItem('otp_verified')
    }
  }

  const resetActivity = () => {
    lastActivityTime.value = Date.now()
  }

  const setTwoFactorEnabled = (enabled: boolean) => {
    twoFactorEnabled.value = enabled
    localStorage.setItem('2fa_enabled', enabled ? 'true' : 'false')
  }

  // Initialize auth state listener on first access
  const initAuthListener = () => {
    if (unsubscribeAuth !== null) return // Already initialized

    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false
      resolveAuth()
    })
  }

  const logout = async () => {
    try {
      await auth.signOut()
      user.value = null
      setOtpVerified(false)
      setTwoFactorEnabled(false)
      loginTime.value = null
      localStorage.removeItem('session_start')
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
    isReady,
    isLoggedIn,
    isAuthOnly,
    is2FARequired,
    otpVerified,
    setOtpVerified,
    twoFactorEnabled,
    setTwoFactorEnabled,
    loginTime,
    lastActivityTime,
    resetActivity,
    userName,
    updateDisplayName,
    logout,
  }
})
