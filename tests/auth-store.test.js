import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore, STORAGE_KEY } from '../src/stores/auth.js';

const session = { token: 'token-abc', user: { id: 1, email: 'runner@example.com', name: '小跑', role: 'member' } };

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
});

describe('#1 登入狀態的保存', () => {
  test('一開始沒有登入', () => {
    const auth = useAuthStore();

    expect(auth.isLoggedIn).toBe(false);
    expect(auth.user).toBeNull();
  });

  test('設定登入狀態：寫入 localStorage', () => {
    const auth = useAuthStore();

    auth.setSession(session);

    expect(auth.isLoggedIn).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(session);
  });

  test('重新整理（重新建立 store）：仍為登入狀態', () => {
    useAuthStore().setSession(session);
    setActivePinia(createPinia());

    const restored = useAuthStore();

    expect(restored.isLoggedIn).toBe(true);
    expect(restored.user.name).toBe('小跑');
    expect(restored.token).toBe('token-abc');
  });

  test('清除登入狀態：Token 從 localStorage 移除', () => {
    const auth = useAuthStore();
    auth.setSession(session);

    auth.clearSession();

    expect(auth.isLoggedIn).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('localStorage 的內容損毀：當成沒有登入，不會出錯', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    expect(useAuthStore().isLoggedIn).toBe(false);
  });
});
