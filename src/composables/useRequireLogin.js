import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useToastStore } from '../stores/toast.js';

// 需要登入的操作：未登入時提示並導向登入頁，登入後回到目前的頁面。
// 回傳 true 代表已登入，可以繼續。
export function useRequireLogin() {
  const auth = useAuthStore();
  const toast = useToastStore();
  const route = useRoute();
  const router = useRouter();

  return function requireLogin() {
    if (auth.isLoggedIn) return true;
    toast.show('請先登入會員，才能使用購物車', 'info');
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return false;
  };
}
