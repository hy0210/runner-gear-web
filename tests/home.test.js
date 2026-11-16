import HomeView from '../src/views/HomeView.vue';
import { fetchProducts } from '../src/api/products.js';
import { mountWithApp, flushPromises } from './helpers/mount.js';

vi.mock('../src/api/products.js', () => ({
  fetchProducts: vi.fn(),
  fetchCategories: vi.fn().mockResolvedValue([]),
}));

const product = (id, overrides = {}) => ({
  id,
  name: `商品 ${id}`,
  description: '說明',
  price: 1000 * id,
  imageUrl: `https://example.com/${id}.png`,
  category: { id: 1, name: '跑鞋' },
  ...overrides,
});
const page = (products) => ({ products, pagination: { page: 1, limit: 8, total: products.length, totalPages: 1 } });

beforeEach(() => {
  fetchProducts.mockReset();
  document.body.innerHTML = '';
});

describe('#3 首頁的商品一律來自 API', () => {
  test('主視覺：有標語與前往商品列表的連結', async () => {
    fetchProducts.mockResolvedValue(page([]));

    const { wrapper } = await mountWithApp(HomeView);

    expect(wrapper.find('h1').text()).toContain('跑得更遠');
    expect(wrapper.find('[data-test="hero-cta"]').attributes('href')).toBe('/products');
  });

  test('載入成功：向 API 取 8 筆，顯示商品卡（圖片、名稱、價格）', async () => {
    fetchProducts.mockResolvedValue(page([product(1), product(2), product(3)]));

    const { wrapper } = await mountWithApp(HomeView);
    const cards = wrapper.findAll('.product-card');

    expect(fetchProducts).toHaveBeenCalledWith({ limit: 8 });
    expect(cards).toHaveLength(3);
    expect(cards[0].find('[data-test="name"]').text()).toBe('商品 1');
    expect(cards[0].find('[data-test="price"]').text()).toBe('NT$ 1,000');
    expect(cards[0].find('img').attributes('src')).toBe('https://example.com/1.png');
    expect(cards[0].find('img').attributes('alt')).toBe('商品 1');
  });

  test('載入中：顯示載入指示，不顯示商品', async () => {
    let resolve;
    fetchProducts.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { wrapper } = await mountWithApp(HomeView);

    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(true);
    expect(wrapper.findAll('.product-card')).toHaveLength(0);

    resolve(page([product(1)]));
    await flushPromises();
    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(false);
  });

  test('API 失敗：顯示錯誤提示；按重試後重新載入', async () => {
    fetchProducts.mockRejectedValueOnce(new Error('Network Error'));
    fetchProducts.mockResolvedValueOnce(page([product(1)]));

    const { wrapper } = await mountWithApp(HomeView);

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="hero-cta"]').exists()).toBe(true);

    await wrapper.find('[data-test="state-action"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false);
    expect(wrapper.findAll('.product-card')).toHaveLength(1);
  });

  test('商品名稱含 HTML：以純文字顯示', async () => {
    fetchProducts.mockResolvedValue(page([product(1, { name: '<script>alert(1)</script>' })]));

    const { wrapper } = await mountWithApp(HomeView);

    expect(wrapper.find('.product-card script').exists()).toBe(false);
    expect(wrapper.find('[data-test="name"]').text()).toBe('<script>alert(1)</script>');
  });
});
