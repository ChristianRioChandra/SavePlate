<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'
import loginBackground from '@/assets/background/bg1.png'
import { loginUser } from '../services/authService'
import { isFirebaseError } from '@/utils/firebaseErrors'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
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

const handleLogin = async () => {
  error.value = ''

  // Basic validation
  if (!email.value || !password.value) {
    error.value = 'Email and password are required!'
    return
  }

  loading.value = true

  try {
    const user = await loginUser(email.value, password.value)

    // Optional: warn user if email is not yet verified
    if (!user.emailVerified) {
      error.value = 'Please verify your email before logging in.'
      loading.value = false
      return
    }

    router.push({ name: 'dashboard' })
  } catch (err: unknown) {
    if (isFirebaseError(err)) {
      // Map Firebase error codes to friendly messages
      switch (err.code) {
        case 'auth/user-not-found':
          error.value = 'No account found with this email.'
          break
        case 'auth/wrong-password':
          error.value = 'Incorrect password. Please try again.'
          break
        case 'auth/invalid-email':
          error.value = 'Please enter a valid email address.'
          break
        case 'auth/invalid-credential':
          error.value = 'Invalid email or password.'
          break
        case 'auth/too-many-requests':
          error.value = 'Too many failed attempts. Please try again later.'
          break
        default:
          error.value = 'Login failed. Please try again.'
      }
    } else {
      loading.value = false
      error.value = 'An unexpected error occurred. Please try again.'
    }
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="left">
      <div class="form-card">
        <img class="logo-image" :src="logoFull" :alt="appName" />



        <!-- EMAIL (changed from username to email for Firebase) -->
        <input v-model="email" type="email" placeholder="Email" :disabled="loading" />

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

        <!-- ERROR -->
        <p v-if="error" class="error">{{ error }}</p>

        <!-- LOGIN BUTTON -->
        <button @click="handleLogin" :disabled="loading">
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>

        <!-- LINK TO REGISTER -->
        <p class="link">
          Don't have an account?
          <span @click="router.push('/register')">Register</span>
        </p>
      </div>
    </div>

    <div class="right" :style="{ backgroundImage: `url(${loginBackground})` }" aria-label="PantryPal" />
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
  color: red;
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
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
