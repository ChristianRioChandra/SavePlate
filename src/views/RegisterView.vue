<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logo from '../assets/logo.svg'

const router = useRouter()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const household = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const error = ref('')

const handleRegister = () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'The password does not match!'
    return
  }

  // when user register succesfulky
  alert('Register Succesfully!')

  // redirect to login
  router.push('/login')
}
</script>

<template>
  <div class="auth-container">

    <div class="left">
      <div class="form-card">

        <img :src="logo" alt="logo" class="logo" />

        <h2>Register</h2>

        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="username" type="text" placeholder="Username" />

        <!-- PASSWORD -->
        <div class="input-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
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
          />
          <i
            class="fa-solid"
            :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"
            @click="showConfirmPassword = !showConfirmPassword"
          ></i>
        </div>

        <input v-model="household" type="number" placeholder="Household Size" />

        <!-- ERROR MESSAGE -->
        <p v-if="error" class="error">{{ error }}</p>

        <button @click="handleRegister">Register</button>

        <!-- LINK TO LOGIN -->
        <p class="link">
          Already have an account?
          <span @click="router.push('/login')">Login</span>
        </p>

      </div>
    </div>

    <div class="right">
      <div>
        <h3>Welcome to PantryPal</h3>
        <p>Manage your food and reduce waste easily.</p>
      </div>
    </div>

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
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e2e8f0;
  text-align: center;
  padding: 40px;
}

.logo {
  width: 60px;
  margin-bottom: 10px;
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

.input-group input {
  padding-right: 40px;
}

input:focus {
  border-color: #22c55e;
}

/* ICON FONT AWESOME */
.input-group i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #555;
}

/* ERROR */
.error {
  color: red;
  font-size: 12px;
  margin-top: 5px;
}

/* BUTTON */
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
}

button:hover {
  background: #16a34a;
}

/* LINK */
.link {
  margin-top: 10px;
  font-size: 14px;
}

.link span {
  color: #22c55e;
  cursor: pointer;
  font-weight: 600;
}

.right h3 {
  font-size: 24px;
}

.right p {
  color: #555;
}
</style>
