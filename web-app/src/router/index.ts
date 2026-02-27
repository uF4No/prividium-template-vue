import { createRouter, createWebHistory } from 'vue-router';
import { usePrividium } from '../composables/usePrividium';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      name: 'main',
      component: () => import('../views/MainView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
});

// TODO: TEMP - auth guard disabled for UI review
router.beforeEach((_to, _from, next) => {
  return next();
});

export default router;
