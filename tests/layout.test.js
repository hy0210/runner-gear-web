import App from '../src/App.vue';
import AppNavbar from '../src/components/AppNavbar.vue';
import { useAuthStore } from '../src/stores/auth.js';
import { mountWithApp, flushPromises } from './helpers/mount.js';

vi.mock('../src/api/products.js', () => ({
  fetchProducts: vi.fn().mockResolvedValue({ products: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } }),
  fetchCategories: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('#2 版面使用語意標籤', () => {
  test('每個頁面都有 header、main、footer 各一', async () => {
    for (const path of ['/', '/products', '/login', '/register', '/no-such-page']) {
      const { wrapper } = await mountWithApp(App, { path });

      expect(wrapper.findAll('header')).toHaveLength(1);
      expect(wrapper.findAll('main')).toHaveLength(1);
      expect(wrapper.findAll('footer')).toHaveLength(1);
      expect(wrapper.find('header nav').exists()).toBe(true);
      wrapper.unmount();
    }
  });

  test('不存在的網址：顯示找不到頁面與回首頁的連結', async () => {
    const { wrapper } = await mountWithApp(App, { path: '/no-such-page' });

    expect(wrapper.find('main').text()).toContain('找不到這個頁面');
  });
});

describe('#2 導覽列在手機寬度可收合', () => {
  test('預設收合；點擊漢堡按鈕展開，再點一次收合', async () => {
    const { wrapper } = await mountWithApp(AppNavbar);
    const toggler = wrapper.find('.navbar-toggler');
    const menu = wrapper.find('#main-nav');

    expect(menu.classes()).not.toContain('show');
    expect(toggler.attributes('aria-expanded')).toBe('false');

    await toggler.trigger('click');
    expect(menu.classes()).toContain('show');
    expect(toggler.attributes('aria-expanded')).toBe('true');
    expect(toggler.attributes('aria-label')).toBe('關閉選單');

    await toggler.trigger('click');
    expect(menu.classes()).not.toContain('show');
  });

  test('換頁後選單自動收合', async () => {
    const { wrapper, router } = await mountWithApp(AppNavbar);
    await wrapper.find('.navbar-toggler').trigger('click');

    await router.push('/products');
    await flushPromises();

    expect(wrapper.find('#main-nav').classes()).not.toContain('show');
  });
});

describe('#2 導覽列反映登入狀態', () => {
  test('未登入：顯示登入與註冊連結', async () => {
    const { wrapper } = await mountWithApp(AppNavbar);

    const guest = wrapper.find('[data-test="guest-area"]');
    expect(guest.text()).toContain('登入');
    expect(guest.text()).toContain('註冊');
    expect(wrapper.find('[data-test="member-area"]').exists()).toBe(false);
  });

  test('已登入：顯示會員名稱與登出', async () => {
    const { wrapper, pinia } = await mountWithApp(AppNavbar);
    useAuthStore(pinia).setSession({ token: 't', user: { id: 1, name: '小跑', email: 'a@example.com', role: 'member' } });
    await flushPromises();

    expect(wrapper.find('[data-test="member-name"]').text()).toContain('小跑');
    expect(wrapper.find('[data-test="guest-area"]').exists()).toBe(false);
  });

  test('會員名稱以純文字輸出，不會被當成 HTML', async () => {
    const { wrapper, pinia } = await mountWithApp(AppNavbar);
    useAuthStore(pinia).setSession({ token: 't', user: { id: 1, name: '<img src=x onerror=alert(1)>', email: 'a@example.com', role: 'member' } });
    await flushPromises();

    expect(wrapper.find('[data-test="member-name"] img').exists()).toBe(false);
    expect(wrapper.find('[data-test="member-name"]').text()).toContain('<img src=x');
  });

  test('登出：清除登入狀態並回到首頁', async () => {
    const { wrapper, pinia, router } = await mountWithApp(AppNavbar, { path: '/products' });
    const auth = useAuthStore(pinia);
    auth.setSession({ token: 't', user: { id: 1, name: '小跑', email: 'a@example.com', role: 'member' } });
    await flushPromises();

    await wrapper.find('[data-test="logout"]').trigger('click');
    await flushPromises();

    expect(auth.isLoggedIn).toBe(false);
    expect(localStorage.length).toBe(0);
    expect(router.currentRoute.value.name).toBe('home');
  });
});
