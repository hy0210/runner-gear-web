import { defineStore } from 'pinia';

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
    clearSession() {
      this.token = null;
      this.user = null;
      writeSession(null);
    },
  },
});

export { STORAGE_KEY };
