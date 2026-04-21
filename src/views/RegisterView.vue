<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'
import registerBackground from '@/assets/background/bg1.png'
import { registerUser } from '../services/authService'
import { isFirebaseError } from '@/utils/firebaseErrors'

const router = useRouter()

const email = ref('')
const name = ref('') // renamed from username → name (matches authService)
const password = ref('')
const confirmPassword = ref('')
const household = ref<number | ''>('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const error = ref('')
const success = ref('')
const loading = ref(false)

export interface NavItem {
  label: string
  route: string
  icon?: string // optional; if missing, uses nav-dot
}

withDefaults(
  defineProps<{
    navItems: NavItem[]
    appName?: string
  }>(),
  {
    appName: 'PantryPal',
  },
)

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  // ── Client-side validation ──────────────────────────────────────────────────
  if (!email.value || !name.value || !password.value || !confirmPassword.value) {
    error.value = 'All fields are required!'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match!'
    return
  }

  loading.value = true

  try {
    await registerUser({
      name: name.value,
      email: email.value,
      password: password.value,
      householdSize: household.value !== '' ? Number(household.value) : null,
    })

    // Show success and prompt to check email
    success.value = 'Account created! Please check your email to verify your account.'

    // Clear form
    email.value = ''
    name.value = ''
    password.value = ''
    confirmPassword.value = ''
    household.value = ''

    // Redirect to login after 2.5 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2500)
  } catch (err: unknown) {
    if (isFirebaseError(err)) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          error.value = 'An account with this email already exists.'
          break
        case 'auth/invalid-email':
          error.value = 'Please enter a valid email address.'
          break
        case 'auth/weak-password':
          error.value = 'Password is too weak. Use at least 6 characters.'
          break
        default:
          error.value = 'Registration failed. Please try again.'
      }
    } else {
      error.value = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="left">
      <div class="form-card">
        <img class="logo-image" :src="logoFull" :alt="appName" />

        <input v-model="email" type="email" placeholder="Email" :disabled="loading" />

        <!-- NAME (was username) -->
        <input v-model="name" type="text" placeholder="Full Name" :disabled="loading" />

        <!-- PASSWORD -->
        <div class="input-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            :disabled="loading"
          />
          <i
            class="fa-solid"
            :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
            @click="showPassword = !showPassword"
          ></i>
        </div>

        <!-- CONFIRM PASSWORD -->
        <div class="input-group">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm Password"
            :disabled="loading"
          />
          <i
            class="fa-solid"
            :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"
            @click="showConfirmPassword = !showConfirmPassword"
          ></i>
        </div>

        <input
          v-model="household"
          type="number"
          placeholder="Household Size (optional)"
          min="1"
          :disabled="loading"
        />

        <!-- ERROR MESSAGE -->
        <p v-if="error" class="error">{{ error }}</p>

        <!-- SUCCESS MESSAGE -->
        <p v-if="success" class="success">{{ success }}</p>

        <button @click="handleRegister" :disabled="loading">
          <span v-if="loading">Creating account...</span>
          <span v-else>Register</span>
        </button>

        <!-- LINK TO LOGIN -->
        <p class="link">
          Already have an account?
          <span @click="router.push('/login')">Login</span>
        </p>
      </div>
    </div>

    <div class="right" :style="{ backgroundImage: `url(${registerBackground})` }" aria-label="PantryPal" />
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  height: 100vh;
  background: #f1f5f9;
}

.left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-card {
  background: #ffffff;
  padding: 40px;
  border-radius: 16px;
  width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right {
  flex: 1;
  background-color: #e2e8f0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  min-height: 100vh;
}

.logo-area {
  display: flex;
  align-items: center;
  margin-bottom: 44px;
  padding-left: 6px;
}

.logo-image {
  display: block;
  width: min(100%, 175px);
  height: auto;
  padding-bottom: 25px;
}

h2 {
  margin-bottom: 20px;
}

.input-group {
  position: relative;
  width: 100%;
}

input {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border-radius: 8px;
  border: 1px solid #ddd;
  outline: none;
}

input:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.input-group input {
  padding-right: 40px;
}

input:focus {
  border-color: #22c55e;
}

.input-group i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #555;
}

.error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
}

.success {
  color: #22c55e;
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  border: none;
  border-radius: 8px;
  background: #22c55e;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #16a34a;
}

button:disabled {
  background: #86efac;
  cursor: not-allowed;
}

.link {
  margin-top: 10px;
  font-size: 14px;
}

.link span {
  color: #22c55e;
  cursor: pointer;
  font-weight: 600;
}

</style>
