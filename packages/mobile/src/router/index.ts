import { createRouter, createWebHistory } from 'vue-router'
import WelcomePage from '../pages/auth/WelcomePage.vue'
import MainLayout from '../layouts/MainLayout.vue'

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
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/auth/RegisterPage.vue'),
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
        {
          path: 'cabinet/client',
          name: 'client-dashboard',
          component: () => import('../pages/cabinet/client/DashboardPage.vue'),
        },
        {
          path: 'cabinet/client/orders',
          name: 'client-orders',
          component: () => import('../pages/cabinet/client/OrdersPage.vue'),
        },
        {
          path: 'cabinet/client/orders/create',
          name: 'client-orders-create',
          component: () => import('../pages/cabinet/client/CreateOrderPage.vue'),
        },
        {
          path: 'cabinet/client/orders/:id',
          name: 'client-order-detail',
          component: () => import('../pages/cabinet/client/OrderDetailPage.vue'),
        },
      ]
    }
  ],
})

export default router
