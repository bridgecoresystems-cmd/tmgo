import { createRouter, createWebHistory } from 'vue-router'
import WelcomePage from '../pages/auth/WelcomePage.vue'

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
      path: '/home',
      name: 'home',
      component: () => import('../pages/HomePage.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../pages/cargo/SearchPage.vue'),
    },
    {
      path: '/search/results',
      name: 'search-results',
      component: () => import('../pages/cargo/SearchResultsPage.vue'),
    },
  ],
})

export default router
