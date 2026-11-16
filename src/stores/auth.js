import { defineStore } from 'pinia';
import { fetchMe, login as loginRequest, register as registerRequest } from '../api/auth.js';

const STORAGE_KEY = 'runner-gear.session';

// localStorage 在少數情況下不可用（例如被瀏覽器設定封鎖），讀寫失敗時當成沒有登入
function readSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (parsed && typeof parsed.token === 'string' && parsed.user) {
      return parsed;
    }
  } catch {
    // 內容損毀時忽略
  }
  return { token: null, user: null };
}

function writeSession(session) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 無法寫入時，登入狀態只維持到重新整理之前
  }
}

// 登入狀態。Token 存在 localStorage，重新整理後仍維持登入。
export const useAuthStore = defineStore('auth', {
  state: () => readSession(),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      writeSession({ token, user });
    },
    // 登出或 Token 失效時呼叫：清除 Token 與會員資料（購物車由 App 依登入狀態一併清空）
    clearSession() {
      this.token = null;
      this.user = null;
      writeSession(null);
    },
    async login(credentials) {
      this.setSession(await loginRequest(credentials));
    },
    async register(profile) {
      this.setSession(await registerRequest(profile));
    },
    // 重新整理後向後端確認 Token 仍有效，並更新會員資料。
    // Token 已失效時，後端回 401，由 axios 攔截器清除登入狀態。
    async verifySession() {
      if (!this.token) return;
      const user = await fetchMe();
      this.setSession({ token: this.token, user });
    },
  },
});

export { STORAGE_KEY };
