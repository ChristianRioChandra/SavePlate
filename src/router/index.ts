// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import PantryPalDashboard from '../views/PantryPalDashboard.vue'
import ManageInventory from '../views/ManageInventory.vue'
import PantryPalDonationListing from '../views/PantryPalDonationListing.vue'
import PantryPalWeeklyMealPlan from '../views/PantryPalWeeklyMealPlan.vue'
import Settings from '../views/SettingsView.vue'

// ─── Routes ───────────────────────────────────────────────────────────────────
// meta.requiresAuth: true  → redirect to /login if not logged in
// meta.guestOnly: true     → redirect to / if already logged in (e.g. login page)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: PantryPalDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/donations',
      name: 'donations',
      component: PantryPalDonationListing,
      meta: { requiresAuth: true },
    },
    {
      path: '/meal-plan',
      name: 'meal-plan',
      component: PantryPalWeeklyMealPlan,
      meta: { requiresAuth: true },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: ManageInventory,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { requiresAuth: true },
    },
    // analytics — add component when ready
    // {
    //   path: '/analytics',
    //   name: 'analytics',
    //   component: () => import('../views/AnalyticsView.vue'),
    //   meta: { requiresAuth: true },
    // },
  ],
})

// ─── Navigation Guard ─────────────────────────────────────────────────────────

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Wait for Firebase to finish resolving the auth state before routing.
  // This prevents the flash-redirect to /login on every page refresh
  // while Firebase is still checking if a session exists.
  if (!authStore.ready) {
    await new Promise<void>((resolve) => {
      const unsubscribe = authStore.$subscribe(() => {
        if (authStore.ready) {
          unsubscribe()
          resolve()
        }
      })
    })
  }

  const isLoggedIn = authStore.isLoggedIn

  // Route requires login but user is not logged in → go to /login
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'login' })
  }

  // Route is guest-only (login/register) but user is already logged in → go to dashboard
  if (to.meta.guestOnly && isLoggedIn) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
