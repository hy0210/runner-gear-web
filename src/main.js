import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/main.css';
import App from './App.vue';
import { createAppRouter } from './router/index.js';
import { http, setupInterceptors } from './api/http.js';
import { useAuthStore } from './stores/auth.js';

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter();

app.use(pinia);
app.use(router);

const auth = useAuthStore(pinia);

setupInterceptors(http, {
  getToken: () => auth.token,
  // Token 過期或失效：清除登入狀態，帶著原本的頁面導向登入頁
  onUnauthorized: () => {
    auth.clearSession();
    const current = router.currentRoute.value;
    if (current.name !== 'login') {
      router.push({ name: 'login', query: { redirect: current.fullPath } });
    }
  },
});

app.mount('#app');
