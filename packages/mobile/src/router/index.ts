import { createRouter, createWebHistory } from 'vue-router'
import WelcomePage from '../pages/auth/WelcomePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomePage
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../pages/HomePage.vue')
    }
  ]
})

export default router
