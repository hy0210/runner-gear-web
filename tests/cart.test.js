import { setActivePinia, createPinia } from 'pinia';
import App from '../src/App.vue';
import CartOffcanvas from '../src/components/CartOffcanvas.vue';
import AddToCartButton from '../src/components/AddToCartButton.vue';
import { useCartStore } from '../src/stores/cart.js';
import { useAuthStore } from '../src/stores/auth.js';
import { useToastStore } from '../src/stores/toast.js';
import { fetchCart, addCartItem, updateCartItem, removeCartItem } from '../src/api/cart.js';
import { mountWithApp, flushPromises } from './helpers/mount.js';

vi.mock('../src/api/cart.js', () => ({
  fetchCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));
vi.mock('../src/api/products.js', () => ({
  fetchProducts: vi.fn().mockResolvedValue({ products: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 0 } }),
  fetchCategories: vi.fn().mockResolvedValue([]),
}));
vi.mock('../src/api/auth.js', () => ({ login: vi.fn(), register: vi.fn(), fetchMe: vi.fn() }));

const member = { id: 1, email: 'runner@example.com', name: '小跑', role: 'member' };
const shoe = { id: 7, name: '競速跑鞋', price: 3000, imageUrl: 'https://example.com/7.png' };
const sock = { id: 9, name: '五趾襪', price: 250, imageUrl: 'https://example.com/9.png' };

// 後端回傳的購物車；小計與總額都由後端計算
const cartOf = (...items) => ({
  items: items.map(([id, product, quantity, subtotal]) => ({ id, product, quantity, subtotal })),
  totalQuantity: items.reduce((sum, [, , quantity]) => sum + quantity, 0),
  totalPrice: items.reduce((sum, [, , , subtotal]) => sum + subtotal, 0),
});
const emptyCart = cartOf();
const apiError = (status, message) => ({ response: { status, data: { status: 'failed', message } } });

function login() {
  useAuthStore().setSession({ token: 'token-1', user: member });
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  vi.clearAllMocks();
  fetchCart.mockResolvedValue(emptyCart);
});

describe('#6 購物車內容一律以後端回應為準', () => {
  beforeEach(() => setActivePinia(createPinia()));

  test('加入購物車：以回應覆寫狀態', async () => {
    addCartItem.mockResolvedValue(cartOf([1, shoe, 2, 6000]));
    const cart = useCartStore();

    await cart.add(shoe.id, 1);

    expect(addCartItem).toHaveBeenCalledWith({ productId: 7, quantity: 1 });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.totalQuantity).toBe(2);
    expect(cart.totalPrice).toBe(6000);
  });

  test('調整數量與移除：以回應覆寫狀態', async () => {
    updateCartItem.mockResolvedValue(cartOf([1, shoe, 3, 9000], [2, sock, 1, 250]));
    removeCartItem.mockResolvedValue(cartOf([2, sock, 1, 250]));
    const cart = useCartStore();

    await cart.update(1, 3);
    expect(updateCartItem).toHaveBeenCalledWith(1, 3);
    expect(cart.totalPrice).toBe(9250);

    await cart.remove(1);
    expect(removeCartItem).toHaveBeenCalledWith(1);
    expect(cart.items.map((item) => item.id)).toEqual([2]);
  });

  test('操作失敗：狀態不變，錯誤往外丟給畫面處理', async () => {
    fetchCart.mockResolvedValue(cartOf([1, shoe, 2, 6000]));
    updateCartItem.mockRejectedValue(apiError(400, '單一商品數量上限為 99'));
    const cart = useCartStore();
    await cart.fetch();

    await expect(cart.update(1, 100)).rejects.toBeDefined();

    expect(cart.items[0].quantity).toBe(2);
  });

  test('重新整理：重新向 API 取得內容', async () => {
    fetchCart.mockResolvedValue(cartOf([1, shoe, 2, 6000]));
    const cart = useCartStore();

    await cart.fetch();

    expect(fetchCart).toHaveBeenCalledTimes(1);
    expect(cart.totalQuantity).toBe(2);
  });

  test('清空：回到初始狀態', async () => {
    fetchCart.mockResolvedValue(cartOf([1, shoe, 2, 6000]));
    const cart = useCartStore();
    await cart.fetch();

    cart.reset();

    expect(cart.items).toEqual([]);
    expect(cart.totalQuantity).toBe(0);
  });
});

describe('#6 加入購物車的按鈕', () => {
  test('已登入：呼叫 API，並顯示成功的提示', async () => {
    addCartItem.mockResolvedValue(cartOf([1, shoe, 1, 3000]));
    const { wrapper, pinia } = await mountWithApp(AddToCartButton, { path: '/products', props: { product: shoe } });
    login();

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(addCartItem).toHaveBeenCalledWith({ productId: 7, quantity: 1 });
    expect(useToastStore(pinia).messages.at(-1)).toMatchObject({ kind: 'success', text: '已加入購物車：競速跑鞋' });
  });

  test('送出中：按鈕停用，避免重複加入', async () => {
    let resolve;
    addCartItem.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { wrapper } = await mountWithApp(AddToCartButton, { path: '/products', props: { product: shoe } });
    login();

    await wrapper.find('button').trigger('click');
    await wrapper.find('button').trigger('click');

    expect(addCartItem).toHaveBeenCalledTimes(1);
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    resolve(cartOf([1, shoe, 1, 3000]));
    await flushPromises();
  });

  test('加入失敗：顯示後端的訊息', async () => {
    addCartItem.mockRejectedValue(apiError(404, '找不到這個商品'));
    const { wrapper, pinia } = await mountWithApp(AddToCartButton, { path: '/products', props: { product: shoe } });
    login();

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(useToastStore(pinia).messages.at(-1)).toMatchObject({ kind: 'error', text: '找不到這個商品' });
  });

  test('未登入：不呼叫 API，導向登入頁並帶上原本的頁面', async () => {
    const { wrapper, router, pinia } = await mountWithApp(AddToCartButton, {
      path: '/products?categoryId=2',
      props: { product: shoe },
    });

    await wrapper.find('button').trigger('click');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));

    expect(addCartItem).not.toHaveBeenCalled();
    expect(router.currentRoute.value.query.redirect).toBe('/products?categoryId=2');
    expect(useToastStore(pinia).messages.at(-1).text).toContain('請先登入');
  });
});

describe('#6 購物車 Offcanvas', () => {
  async function openCart(cart) {
    fetchCart.mockResolvedValue(cart);
    const mounted = await mountWithApp(CartOffcanvas, { path: '/' });
    login();
    const store = useCartStore(mounted.pinia);
    await store.fetch();
    store.open();
    await flushPromises();
    return { ...mounted, store };
  }

  test('顯示項目、數量、小計與總金額（都是後端回傳的值）', async () => {
    // 刻意讓後端的小計與「單價 × 數量」不同，確認畫面沒有自己計算
    const { wrapper } = await openCart(cartOf([1, shoe, 2, 5999], [2, sock, 1, 250]));

    expect(wrapper.find('[role="dialog"]').classes()).toContain('show');
    const rows = wrapper.findAll('[data-test="cart-item"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('競速跑鞋');
    expect(rows[0].find('[data-test="quantity"]').text()).toBe('2');
    expect(rows[0].find('[data-test="subtotal"]').text()).toBe('NT$ 5,999');
    expect(wrapper.find('[data-test="total"]').text()).toBe('NT$ 6,249');
  });

  test('增加、減少數量與移除：呼叫對應的 API 並以回應更新畫面', async () => {
    updateCartItem.mockResolvedValueOnce(cartOf([1, shoe, 3, 9000]));
    updateCartItem.mockResolvedValueOnce(cartOf([1, shoe, 2, 6000]));
    removeCartItem.mockResolvedValueOnce(emptyCart);
    const { wrapper } = await openCart(cartOf([1, shoe, 2, 6000]));

    await wrapper.find('[data-test="increase"]').trigger('click');
    await flushPromises();
    expect(updateCartItem).toHaveBeenLastCalledWith(1, 3);
    expect(wrapper.find('[data-test="quantity"]').text()).toBe('3');

    await wrapper.find('[data-test="decrease"]').trigger('click');
    await flushPromises();
    expect(updateCartItem).toHaveBeenLastCalledWith(1, 2);

    await wrapper.find('[data-test="remove"]').trigger('click');
    await flushPromises();
    expect(removeCartItem).toHaveBeenCalledWith(1);
    expect(wrapper.find('[data-test="empty"]').exists()).toBe(true);
  });

  test('數量為 1 時不能再減少；為 99 時不能再增加', async () => {
    const { wrapper } = await openCart(cartOf([1, shoe, 1, 3000], [2, sock, 99, 24750]));
    const rows = wrapper.findAll('[data-test="cart-item"]');

    expect(rows[0].find('[data-test="decrease"]').attributes('disabled')).toBeDefined();
    expect(rows[1].find('[data-test="increase"]').attributes('disabled')).toBeDefined();
  });

  test('操作失敗：顯示提示，畫面維持後端的資料', async () => {
    updateCartItem.mockRejectedValue(apiError(400, '單一商品數量上限為 99'));
    const { wrapper, pinia } = await openCart(cartOf([1, shoe, 2, 6000]));

    await wrapper.find('[data-test="increase"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="quantity"]').text()).toBe('2');
    expect(useToastStore(pinia).messages.at(-1)).toMatchObject({ kind: 'error', text: '單一商品數量上限為 99' });
  });

  test('關閉：按關閉按鈕、點背景或按 Esc', async () => {
    const { wrapper, store } = await openCart(emptyCart);

    await wrapper.find('[data-test="close"]').trigger('click');
    expect(store.isOpen).toBe(false);

    store.open();
    await flushPromises();
    await wrapper.find('.offcanvas-backdrop').trigger('click');
    expect(store.isOpen).toBe(false);

    store.open();
    await flushPromises();
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' });
    expect(store.isOpen).toBe(false);
  });

  test('商品名稱含 HTML：以純文字顯示', async () => {
    const { wrapper } = await openCart(cartOf([1, { ...shoe, name: '<img src=x onerror=alert(1)>' }, 1, 3000]));

    expect(wrapper.find('[data-test="cart-item"] img[src="x"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="cart-item"]').text()).toContain('<img src=x');
  });
});

describe('#6 購物車與登入狀態同步', () => {
  test('登入後：自動取得購物車，導覽列顯示件數', async () => {
    fetchCart.mockResolvedValue(cartOf([1, shoe, 2, 6000], [2, sock, 3, 750]));
    const { wrapper } = await mountWithApp(App, { path: '/' });

    login();
    await flushPromises();

    expect(fetchCart).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-test="cart-count"]').text()).toBe('5');
  });

  test('登出：清除 Token、會員資料與購物車狀態，回到首頁', async () => {
    fetchCart.mockResolvedValue(cartOf([1, shoe, 2, 6000]));
    const { wrapper, pinia, router } = await mountWithApp(App, { path: '/products' });
    login();
    await flushPromises();

    await wrapper.find('[data-test="logout"]').trigger('click');
    await flushPromises();

    expect(useAuthStore(pinia).isLoggedIn).toBe(false);
    expect(localStorage.length).toBe(0);
    expect(useCartStore(pinia).items).toEqual([]);
    expect(wrapper.find('[data-test="cart-count"]').exists()).toBe(false);
    expect(router.currentRoute.value.name).toBe('home');
  });

  test('未登入點購物車按鈕：導向登入頁', async () => {
    const { wrapper, router } = await mountWithApp(App, { path: '/products' });

    await wrapper.find('[data-test="cart-button"]').trigger('click');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));

    expect(router.currentRoute.value.query.redirect).toBe('/products');
  });

  test('關閉購物車後，焦點回到購物車按鈕', async () => {
    const { wrapper, pinia } = await mountWithApp(App, { path: '/' });
    login();
    await flushPromises();

    await wrapper.find('[data-test="cart-button"]').trigger('click');
    await flushPromises();
    expect(document.activeElement.getAttribute('data-test')).toBe('close');

    useCartStore(pinia).close();
    await flushPromises();
    expect(document.activeElement.getAttribute('data-test')).toBe('cart-button');
  });

  test('提示訊息顯示在畫面上，並可手動關閉', async () => {
    const { wrapper, pinia } = await mountWithApp(App, { path: '/' });

    useToastStore(pinia).show('已加入購物車：競速跑鞋');
    await flushPromises();
    expect(wrapper.find('[data-test="toast"]').text()).toContain('已加入購物車');

    await wrapper.find('[data-test="toast-close"]').trigger('click');
    expect(wrapper.find('[data-test="toast"]').exists()).toBe(false);
  });
});
