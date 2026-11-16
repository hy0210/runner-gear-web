import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

export const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/products', name: 'products', component: () => import('../views/ProductsView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
];

export function createAppRouter(history = createWebHistory()) {
  return createRouter({
    history,
    routes,
    // 換頁後回到頁面頂端；上一頁、下一頁則回到原本的捲動位置
    scrollBehavior(_to, _from, savedPosition) {
      return savedPosition ?? { top: 0 };
    },
  });
}
