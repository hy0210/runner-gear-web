import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { useAuthStore } from '../stores/auth.js';

export const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/products', name: 'products', component: () => import('../views/ProductsView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true, title: '會員登入' } },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { guestOnly: true, title: '註冊會員' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
];

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({
    history,
    routes,
    // 換頁後回到頁面頂端；上一頁、下一頁則回到原本的捲動位置
    scrollBehavior(_to, _from, savedPosition) {
      return savedPosition ?? { top: 0 };
    },
  });

  // 已登入時不需要再看到登入、註冊頁
  router.beforeEach((to) => {
    if (to.meta.guestOnly && useAuthStore().isLoggedIn) {
      return { name: 'home' };
    }
    return true;
  });

  return router;
}
