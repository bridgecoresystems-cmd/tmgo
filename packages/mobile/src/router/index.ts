import { createRouter, createWebHistory } from 'vue-router'
import WelcomePage from '../pages/auth/WelcomePage.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuth } from '@/composables/useAuth'

export function roleHome(role?: string | null): string {
  if (role === 'driver') return '/cabinet/driver'
  if (role === 'client') return '/cabinet/client'
  return '/search'
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomePage,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/auth/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/auth/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'search',
          name: 'search',
          component: () => import('../pages/cargo/SearchPage.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../pages/cabinet/ProfilePage.vue'),
        },
        // ── Client cabinet ──────────────────────────────────────────
        {
          path: 'cabinet/client',
          name: 'client-dashboard',
          component: () => import('../pages/cabinet/client/DashboardPage.vue'),
          meta: { requiresAuth: true, role: 'client' },
        },
        {
          path: 'cabinet/client/orders',
          name: 'client-orders',
          component: () => import('../pages/cabinet/client/OrdersPage.vue'),
          meta: { requiresAuth: true, role: 'client' },
        },
        {
          path: 'cabinet/client/orders/create',
          name: 'client-orders-create',
          component: () => import('../pages/cabinet/client/CreateOrderPage.vue'),
          meta: { requiresAuth: true, role: 'client' },
        },
        {
          path: 'cabinet/client/orders/:id',
          name: 'client-order-detail',
          component: () => import('../pages/cabinet/client/OrderDetailPage.vue'),
          meta: { requiresAuth: true, role: 'client' },
        },
        // ── Driver cabinet ──────────────────────────────────────────
        {
          path: 'cabinet/driver',
          name: 'driver-dashboard',
          component: () => import('../pages/cabinet/driver/DashboardPage.vue'),
          meta: { requiresAuth: true, role: 'driver' },
        },
        {
          path: 'cabinet/driver/available',
          name: 'driver-available',
          component: () => import('../pages/cabinet/driver/AvailableOrdersPage.vue'),
          meta: { requiresAuth: true, role: 'driver' },
        },
        {
          path: 'cabinet/driver/bids',
          name: 'driver-bids',
          component: () => import('../pages/cabinet/driver/MyBidsPage.vue'),
          meta: { requiresAuth: true, role: 'driver' },
        },
        {
          path: 'cabinet/driver/orders/:id',
          name: 'driver-order-detail',
          component: () => import('../pages/cabinet/driver/OrderDetailPage.vue'),
          meta: { requiresAuth: true, role: 'driver' },
        },
      ],
    },
    // Search results — full screen, no tab bar
    {
      path: '/search/results',
      name: 'search-results',
      component: () => import('../pages/cargo/SearchResultsPage.vue'),
    },
  ],
})

// ── Navigation guard ──────────────────────────────────────────────────────────
let sessionChecked = false

router.beforeEach(async (to) => {
  const auth = useAuth()

  // Verify session with backend once per app start
  if (!sessionChecked) {
    sessionChecked = true
    await auth.init()
  }

  const user = auth.user.user

  // Redirect logged-in users away from welcome/login/register
  if (to.meta.guestOnly && user) {
    return roleHome(user.role)
  }

  // Redirect unauthenticated users away from protected routes
  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  // Redirect to correct cabinet if role doesn't match the route
  if (to.meta.requiresAuth && user && to.meta.role && to.meta.role !== user.role) {
    return roleHome(user.role)
  }

  // Redirect welcome page based on auth status
  if (to.path === '/' && user) {
    return roleHome(user.role)
  }
})

export default router
