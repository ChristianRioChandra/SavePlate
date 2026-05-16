import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import landingPageView from '../views/landingPageView.vue'
import PantryPalDashboard from '../views/PantryPalDashboard.vue'
import ManageInventory from '../views/ManageInventory.vue'
import PantryPalDonationListing from '../views/PantryPalDonationListing.vue'
import PantryPalWeeklyMealPlan from '../views/PantryPalWeeklyMealPlan.vue'
import Settings from '../views/Settings.vue'
import Analytics from '../views/AnalyticsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/otp',
      name: 'otp',
      component: () => import('../views/OTPView.vue'),
    },

    {
      path: '/',
      name: 'landing',
      component: landingPageView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: PantryPalDashboard,
    },
    {
      path: '/donations',
      name: 'donations',
      component: PantryPalDonationListing,
    },
    {
      path: '/meal-plan',
      name: 'meal-plan',
      component: PantryPalWeeklyMealPlan,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: ManageInventory,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
    // analytics
    {
      path: '/analytics',
      name: 'analytics',
      component: Analytics,
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

import { useAuthStore } from '@/stores/auth'

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.isReady

  // Define route groups
  const publicPages = ['login', 'register', 'landing']
  const isPublicPage = publicPages.includes(to.name as string) || to.path === '/'
  const isOtpPage = to.name === 'otp'

// to:
router.beforeEach((to) => {
  const isLogin = localStorage.getItem('isLogin')
  const hasOTP = localStorage.getItem('otp_code')

  // route public
  const publicPages = ['landing', 'login', 'register']

  if (!isLogin && !publicPages.includes(to.name as string)) {
    return '/login'
  }

  if (to.name === 'otp' && !hasOTP) {
    return '/login'
  }

  if (
    isLogin &&
    (to.name === 'login' || to.name === 'register')
  ) {
    return '/dashboard'
  }

  // 2. Authenticated but 2FA required -> redirect to OTP (unless already on OTP or public)
  if (authStore.isAuthOnly && authStore.is2FARequired && !isOtpPage && !isPublicPage) {
    return '/otp'
  }

  // 3. Already logged in and verified -> prevent going back to login/register/otp
  if (authStore.isLoggedIn && (isPublicPage || isOtpPage) && to.name !== 'landing') {
    if (to.name !== 'landing') {
        return '/dashboard'
    }
  }
})
export default router
