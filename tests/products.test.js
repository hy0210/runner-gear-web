import ProductsView from '../src/views/ProductsView.vue';
import { fetchProducts, fetchCategories } from '../src/api/products.js';
import { parseListQuery, buildListQuery } from '../src/utils/list-query.js';
import { mountWithApp, flushPromises } from './helpers/mount.js';

vi.mock('../src/api/products.js', () => ({
  fetchProducts: vi.fn(),
  fetchCategories: vi.fn(),
}));

const categories = [
  { id: 1, name: '跑鞋' },
  { id: 2, name: '服飾' },
];
const product = (id) => ({
  id,
  name: `商品 ${id}`,
  description: '',
  price: 100 * id,
  imageUrl: `https://example.com/${id}.png`,
  category: categories[0],
});
const result = (count, { page = 1, total = count, totalPages = 1 } = {}) => ({
  products: Array.from({ length: count }, (_, i) => product(i + 1)),
  pagination: { page, limit: 12, total, totalPages },
});

beforeEach(() => {
  fetchProducts.mockReset();
  fetchCategories.mockReset();
  fetchCategories.mockResolvedValue(categories);
  document.body.innerHTML = '';
});

describe('#4 網址查詢參數的驗證', () => {
  test('合法的參數', () => {
    expect(parseListQuery({ page: '2', categoryId: '3', keyword: ' swift ' })).toEqual({ page: 2, categoryId: 3, keyword: 'swift' });
  });

  test('不合法的值被忽略，回到預設', () => {
    expect(parseListQuery({ page: '0', categoryId: 'abc', keyword: undefined })).toEqual({ page: 1, categoryId: null, keyword: '' });
    expect(parseListQuery({ page: '-1', categoryId: '1.5' })).toEqual({ page: 1, categoryId: null, keyword: '' });
    expect(parseListQuery({ page: ['3', '9'] }).page).toBe(3);
  });

  test('關鍵字超過 50 個字元會被截斷', () => {
    expect(parseListQuery({ keyword: 'a'.repeat(80) }).keyword).toHaveLength(50);
  });

  test('預設值不寫進網址', () => {
    expect(buildListQuery({ page: 1, categoryId: null, keyword: '' })).toEqual({});
    expect(buildListQuery({ page: 2, categoryId: 3, keyword: 'x' })).toEqual({ page: '2', categoryId: '3', keyword: 'x' });
  });
});

describe('#4 可依分類與關鍵字瀏覽並分頁', () => {
  test('開啟列表頁：載入分類與第 1 頁商品', async () => {
    fetchProducts.mockResolvedValue(result(12, { total: 35, totalPages: 3 }));

    const { wrapper } = await mountWithApp(ProductsView, { path: '/products' });

    expect(fetchProducts).toHaveBeenCalledWith({ page: 1, limit: 12 });
    expect(wrapper.findAll('.product-card')).toHaveLength(12);
    expect(wrapper.find('[data-test="summary"]').text()).toContain('35');
    expect(wrapper.findAll('[data-test="category-filter"]').map((n) => n.text())).toEqual(['全部', '跑鞋', '服飾']);
    expect(wrapper.findAll('[data-test="page"]')).toHaveLength(3);
  });

  test('選擇分類：重新查詢並回到第 1 頁，網址同步更新', async () => {
    fetchProducts.mockResolvedValue(result(5));
    const { wrapper, router } = await mountWithApp(ProductsView, { path: '/products?page=2' });

    await wrapper.findAll('[data-test="category-filter"]')[2].trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({ categoryId: '2' });
    expect(fetchProducts).toHaveBeenLastCalledWith({ page: 1, limit: 12, categoryId: 2 });
    expect(wrapper.findAll('[data-test="category-filter"]')[2].attributes('aria-current')).toBe('true');
  });

  test('輸入關鍵字搜尋：重新查詢並回到第 1 頁，保留分類', async () => {
    fetchProducts.mockResolvedValue(result(2));
    const { wrapper, router } = await mountWithApp(ProductsView, { path: '/products?categoryId=1&page=3' });

    await wrapper.find('[data-test="keyword"]').setValue('  Swift ');
    await wrapper.find('[data-test="search-form"]').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({ categoryId: '1', keyword: 'Swift' });
    expect(fetchProducts).toHaveBeenLastCalledWith({ page: 1, limit: 12, categoryId: 1, keyword: 'Swift' });
  });

  test('切換頁碼：顯示該頁，並保留分類與關鍵字', async () => {
    fetchProducts.mockResolvedValue(result(12, { total: 30, totalPages: 3 }));
    const { wrapper, router } = await mountWithApp(ProductsView, { path: '/products?categoryId=1&keyword=run' });

    await wrapper.findAll('[data-test="page"]')[1].trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({ categoryId: '1', keyword: 'run', page: '2' });
    expect(fetchProducts).toHaveBeenLastCalledWith({ page: 2, limit: 12, categoryId: 1, keyword: 'run' });
  });

  test('直接開啟帶參數的網址（等同重新整理）：還原篩選條件與頁碼', async () => {
    fetchProducts.mockResolvedValue(result(3, { page: 2, total: 15, totalPages: 2 }));

    const { wrapper } = await mountWithApp(ProductsView, { path: '/products?categoryId=2&keyword=dry&page=2' });

    expect(fetchProducts).toHaveBeenCalledWith({ page: 2, limit: 12, categoryId: 2, keyword: 'dry' });
    expect(wrapper.find('[data-test="keyword"]').element.value).toBe('dry');
    expect(wrapper.findAll('[data-test="category-filter"]')[2].attributes('aria-current')).toBe('true');
    expect(wrapper.find('[data-test="page"][aria-current="page"]').text()).toBe('2');
  });

  test('網址參數不合法：不會把不合法的值送給 API', async () => {
    fetchProducts.mockResolvedValue(result(1));

    await mountWithApp(ProductsView, { path: '/products?page=abc&categoryId=-5' });

    expect(fetchProducts).toHaveBeenCalledWith({ page: 1, limit: 12 });
  });
});

describe('#4 三種狀態都有明確回饋', () => {
  test('載入中：顯示載入指示', async () => {
    let resolve;
    fetchProducts.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { wrapper } = await mountWithApp(ProductsView, { path: '/products' });

    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(true);
    resolve(result(1));
    await flushPromises();
    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(false);
  });

  test('查無結果：顯示提示，可一鍵清除條件', async () => {
    fetchProducts.mockResolvedValueOnce(result(0));
    fetchProducts.mockResolvedValueOnce(result(4));
    const { wrapper, router } = await mountWithApp(ProductsView, { path: '/products?keyword=xyz&categoryId=1' });

    expect(wrapper.find('[data-test="state-empty"]').text()).toContain('xyz');

    await wrapper.find('[data-test="state-action"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({});
    expect(wrapper.findAll('.product-card')).toHaveLength(4);
  });

  test('API 失敗：顯示錯誤提示；按重試後重新載入', async () => {
    fetchProducts.mockRejectedValueOnce({ response: { status: 500, data: { status: 'error', message: '伺服器發生錯誤，請稍後再試' } } });
    fetchProducts.mockResolvedValueOnce(result(2));
    const { wrapper } = await mountWithApp(ProductsView, { path: '/products' });

    expect(wrapper.find('[data-test="state-error"]').text()).toContain('伺服器發生錯誤');

    await wrapper.find('[data-test="state-action"]').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.product-card')).toHaveLength(2);
  });

  test('連續切換條件時，只顯示最後一次查詢的結果', async () => {
    const pending = [];
    fetchProducts.mockImplementation(() => new Promise((resolve) => { pending.push(resolve); }));
    const { wrapper, router } = await mountWithApp(ProductsView, { path: '/products' });

    await router.push('/products?categoryId=2');
    await flushPromises();
    pending[1](result(1));
    await flushPromises();
    pending[0](result(9));
    await flushPromises();

    expect(wrapper.findAll('.product-card')).toHaveLength(1);
  });
});
