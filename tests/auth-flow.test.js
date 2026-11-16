import { setActivePinia, createPinia } from 'pinia';
import LoginView from '../src/views/LoginView.vue';
import RegisterView from '../src/views/RegisterView.vue';
import { useAuthStore } from '../src/stores/auth.js';
import { safeRedirect } from '../src/utils/redirect.js';
import { login, register, fetchMe } from '../src/api/auth.js';
import { mountWithApp, flushPromises } from './helpers/mount.js';

vi.mock('../src/api/auth.js', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));
vi.mock('../src/api/cart.js', () => ({
  fetchCart: vi.fn().mockResolvedValue({ items: [], totalQuantity: 0, totalPrice: 0 }),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

const user = { id: 1, email: 'runner@example.com', name: '小跑', role: 'member' };
const apiError = (status, message, errors) => ({ response: { status, data: { status: 'failed', message, errors } } });

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('#5 登入後的導向只接受站內路徑', () => {
  test.each([
    ['/products?categoryId=1', '/products?categoryId=1'],
    ['/', '/'],
    [undefined, '/'],
    ['', '/'],
    ['//evil.example.com', '/'],
    ['/\\evil.example.com', '/'],
    ['/\t/evil.example.com', '/'],
    ['/\n/evil.example.com', '/'],
    ['/products\\..\\x', '/'],
    ['https://evil.example.com', '/'],
    ['javascript:alert(1)', '/'],
    [['/products', '/x'], '/products'],
  ])('redirect=%j → %s', (value, expected) => {
    expect(safeRedirect(value)).toBe(expected);
  });
});

describe('#5 會員可登入，狀態在重新整理後保留', () => {
  test('登入成功：儲存 Token 與會員資料，導向原本要前往的頁面', async () => {
    login.mockResolvedValue({ user, token: 'token-1' });
    const { wrapper, router, pinia } = await mountWithApp(LoginView, { path: '/login?redirect=/products%3Fpage%3D2' });

    await wrapper.find('[data-test="email"]').setValue(' Runner@Example.com ');
    await wrapper.find('[data-test="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(login).toHaveBeenCalledWith({ email: 'runner@example.com', password: 'password123' });
    expect(useAuthStore(pinia).token).toBe('token-1');
    expect(useAuthStore(pinia).user.name).toBe('小跑');
    // 商品列表頁是延遲載入的，等導向完成
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/products?page=2'));
  });

  test('redirect 指向外部網址：一律回首頁', async () => {
    login.mockResolvedValue({ user, token: 'token-1' });
    const { wrapper, router } = await mountWithApp(LoginView, { path: '/login?redirect=//evil.example.com' });

    await wrapper.find('[data-test="email"]').setValue('runner@example.com');
    await wrapper.find('[data-test="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  test('重新整理：仍為登入狀態，並向 /auth/me 確認 Token', async () => {
    fetchMe.mockResolvedValue({ ...user, name: '改過名的小跑' });
    useAuthStore(createPinia()).setSession({ token: 'token-1', user });
    const pinia = createPinia();
    setActivePinia(pinia);
    const auth = useAuthStore(pinia);

    await auth.verifySession();

    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(auth.isLoggedIn).toBe(true);
    expect(auth.user.name).toBe('改過名的小跑');
  });

  test('確認期間使用者登出：不會把會員資料寫回', async () => {
    let resolve;
    fetchMe.mockReturnValue(new Promise((r) => { resolve = r; }));
    useAuthStore(createPinia()).setSession({ token: 'token-1', user });
    const pinia = createPinia();
    setActivePinia(pinia);
    const auth = useAuthStore(pinia);

    const pending = auth.verifySession();
    auth.clearSession();
    resolve(user);
    await pending;

    expect(auth.user).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  test('確認期間改登入另一個帳號：不會把舊帳號的資料配給新 Token', async () => {
    let resolve;
    fetchMe.mockReturnValue(new Promise((r) => { resolve = r; }));
    useAuthStore(createPinia()).setSession({ token: 'token-a', user });
    const pinia = createPinia();
    setActivePinia(pinia);
    const auth = useAuthStore(pinia);
    const other = { ...user, id: 2, name: '另一位' };

    const pending = auth.verifySession();
    auth.setSession({ token: 'token-b', user: other });
    resolve(user);
    await pending;

    expect(auth.token).toBe('token-b');
    expect(auth.user.name).toBe('另一位');
  });

  test('沒有登入時不需要確認 Token', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    await useAuthStore(pinia).verifySession();

    expect(fetchMe).not.toHaveBeenCalled();
  });

  test('已登入時開啟登入或註冊頁：導向首頁', async () => {
    useAuthStore(createPinia()).setSession({ token: 'token-1', user });

    const login = await mountWithApp(LoginView, { path: '/login' });
    const signup = await mountWithApp(RegisterView, { path: '/register' });

    expect(login.router.currentRoute.value.name).toBe('home');
    expect(signup.router.currentRoute.value.name).toBe('home');
  });
});

describe('#5 會員可註冊', () => {
  test('註冊成功：直接成為登入狀態並回到首頁', async () => {
    register.mockResolvedValue({ user, token: 'token-2' });
    const { wrapper, router, pinia } = await mountWithApp(RegisterView, { path: '/register' });

    await wrapper.find('[data-test="name"]').setValue(' 小跑 ');
    await wrapper.find('[data-test="email"]').setValue('runner@example.com');
    await wrapper.find('[data-test="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(register).toHaveBeenCalledWith({ name: '小跑', email: 'runner@example.com', password: 'password123' });
    expect(useAuthStore(pinia).token).toBe('token-2');
    expect(router.currentRoute.value.name).toBe('home');
  });
});

describe('#5 表單錯誤有明確提示', () => {
  test('欄位不合法：在欄位旁提示，不呼叫 API', async () => {
    const { wrapper } = await mountWithApp(RegisterView, { path: '/register' });

    await wrapper.find('[data-test="email"]').setValue('not-an-email');
    await wrapper.find('[data-test="password"]').setValue('1234567');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(register).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="name-error"]').text()).toContain('姓名');
    expect(wrapper.find('[data-test="email-error"]').text()).toContain('email');
    expect(wrapper.find('[data-test="password-error"]').text()).toContain('8');
    expect(wrapper.find('[data-test="email"]').attributes('aria-invalid')).toBe('true');
  });

  test('帳密錯誤（401）：顯示後端訊息，清空密碼，不觸發登出', async () => {
    login.mockRejectedValue(apiError(401, 'email 或密碼錯誤'));
    const { wrapper, router } = await mountWithApp(LoginView, { path: '/login' });

    await wrapper.find('[data-test="email"]').setValue('runner@example.com');
    await wrapper.find('[data-test="password"]').setValue('wrong-password');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[data-test="form-error"]').text()).toBe('email 或密碼錯誤');
    expect(wrapper.find('[data-test="password"]').element.value).toBe('');
    expect(router.currentRoute.value.name).toBe('login');
  });

  test('email 已註冊（409）：顯示後端訊息，清空密碼', async () => {
    register.mockRejectedValue(apiError(409, '這個 email 已經註冊過'));
    const { wrapper } = await mountWithApp(RegisterView, { path: '/register' });

    await wrapper.find('[data-test="name"]').setValue('小跑');
    await wrapper.find('[data-test="email"]').setValue('runner@example.com');
    await wrapper.find('[data-test="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[data-test="form-error"]').text()).toBe('這個 email 已經註冊過');
    expect(wrapper.find('[data-test="password"]').element.value).toBe('');
  });

  test('後端回傳欄位錯誤（400）：顯示在對應的欄位旁', async () => {
    register.mockRejectedValue(apiError(400, '輸入資料有誤', [{ field: 'email', message: 'email 格式不正確' }]));
    const { wrapper } = await mountWithApp(RegisterView, { path: '/register' });

    await wrapper.find('[data-test="name"]').setValue('小跑');
    await wrapper.find('[data-test="email"]').setValue('a@b.co');
    await wrapper.find('[data-test="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[data-test="email-error"]').text()).toBe('email 格式不正確');
  });

  test('送出中：按鈕停用，避免重複送出', async () => {
    let resolve;
    login.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { wrapper } = await mountWithApp(LoginView, { path: '/login' });

    await wrapper.find('[data-test="email"]').setValue('runner@example.com');
    await wrapper.find('[data-test="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await wrapper.find('form').trigger('submit');

    expect(login).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeDefined();
    resolve({ user, token: 't' });
    await flushPromises();
  });
});
