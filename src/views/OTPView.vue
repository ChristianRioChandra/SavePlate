<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'

const router = useRouter()

const otp = ref(['', '', '', '', '', ''])
const inputs = ref<(HTMLInputElement | null)[]>([])
const error = ref('')

const timer = ref(180)
let interval: ReturnType<typeof setInterval>

// ✅ validasi tombol
const isOtpValid = computed(() => otp.value.every(d => d !== ''))

// ⏱ timer
const startTimer = () => {
  interval = setInterval(() => {
    if (timer.value > 0) timer.value--
  }, 1000)
}

// ⏱ format waktu
const formatTime = () => {
  const m = Math.floor(timer.value / 60)
  const s = timer.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 🔁 resend (UI only)
const resendOTP = () => {
  if (timer.value > 0) return

  alert('OTP resent (check console for now)')

  otp.value = ['', '', '', '', '', '']
  timer.value = 180
}

// ⌨ input
const handleInput = (index: number, e: Event) => {
  error.value = ''

  const target = e.target as HTMLInputElement
  const value = target.value

  if (!/^[0-9]$/.test(value)) {
    target.value = ''
    return
  }

  otp.value[index] = value

  if (index < 5) inputs.value[index + 1]?.focus()
}

// ⌫ backspace
const handleKeydown = (index: number, e: KeyboardEvent) => {
  if (e.key === 'Backspace' && !otp.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

// ✅ VERIFY
const verifyOTP = () => {
  error.value = ''

  const finalOTP = otp.value.join('')
  const savedOTP = localStorage.getItem('otp_code')
  const expiry = localStorage.getItem('otp_expiry')

  if (finalOTP.length !== 6) {
    error.value = 'OTP must be 6 digits!'
    return
  }

  if (!expiry || Date.now() > Number(expiry)) {
    error.value = 'OTP expired!'
    return
  }

  if (finalOTP !== savedOTP) {
    error.value = 'Wrong OTP!'
    return
  }

  // sukses
  localStorage.removeItem('otp_code')
  localStorage.removeItem('otp_expiry')

  localStorage.setItem('isLogin', 'true')

  router.push({ name: 'dashboard' })
}

// lifecycle
onMounted(() => {
  const expiry = localStorage.getItem('otp_expiry')

  if (!expiry || Date.now() > Number(expiry)) {
    error.value = 'OTP expired! Please login again.'
  }

  startTimer()
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div class="auth-container">
    <div class="form-card">

      <img class="logo-image" :src="logoFull" alt="Logo" />

      <h2>Verify OTP</h2>
      <p>Enter the 6-digit code</p>

      <!-- OTP BOX -->
      <div class="otp-box">
        <input
          v-for="(digit, index) in otp"
          :key="index"
          type="text"
          maxlength="1"
          class="otp-input"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          :ref="(el) => { inputs[index] = el as HTMLInputElement | null }"
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <!-- TIMER -->
      <p class="timer">
        Resend code in <strong>{{ formatTime() }}</strong>
      </p>

      <!-- RESEND -->
      <p
        class="resend"
        :class="{ disabled: timer > 0 }"
        @click="resendOTP"
      >
        Resend OTP
      </p>

      <button
        @click="verifyOTP"
        :disabled="!isOtpValid"
      >
        Verify
      </button>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f1f5f9;
}

.form-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  width: 350px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

.logo-image{
  width: 190px;
  margin-bottom: 15px;
}

h2 {
  margin-bottom: 5px;
}

p {
  margin-bottom: 10px;
  color: #666;
}

.otp-box {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.otp-input {
  width: 45px;
  height: 55px;
  font-size: 22px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid #ddd;
  outline: none;
}

.otp-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 5px rgba(34,197,94,0.5);
}

.timer {
  font-size: 13px;
  margin-bottom: 5px;
}

.resend {
  font-size: 14px;
  color: #22c55e;
  cursor: pointer;
  margin-bottom: 10px;
}

.resend.disabled {
  color: gray;
  cursor: not-allowed;
}

button {
  width: 100%;
  padding: 12px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
}

button:disabled {
  background: #E5E7EB;
  cursor: not-allowed;
  opacity: 0.9;
}

.error {
  color: red;
}
</style>
