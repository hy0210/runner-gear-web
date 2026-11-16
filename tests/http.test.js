import axios from 'axios';
import { http, setupInterceptors, toApiError } from '../src/api/http.js';

// 以自訂 adapter 取代真正的網路請求，並記錄送出的設定
function createInstance({ status = 200, data = {} } = {}) {
  const sent = [];
  const instance = axios.create({
    baseURL: 'http://api.test/api/v1',
    adapter: async (config) => {
      sent.push(config);
      const response = { data, status, statusText: '', headers: {}, config };
      if (status >= 400) {
        const error = new Error('Request failed');
        error.config = config;
        error.response = response;
        throw error;
      }
      return response;
    },
  });
  return { instance, sent };
}

describe('#1 所有請求透過同一個 axios 實例', () => {
  test('位址來自環境變數，並接上 /api/v1', () => {
    expect(http.defaults.baseURL).toBe('http://api.test/api/v1');
  });

  test('只接受相對路徑：完整網址不會把請求送到其他網域', () => {
    expect(http.defaults.allowAbsoluteUrls).toBe(false);
    expect(http.getUri({ url: 'https://evil.example/steal' })).toMatch(/^http:\/\/api\.test\/api\/v1\//);
    expect(http.getUri({ url: '//evil.example/steal' })).toMatch(/^http:\/\/api\.test\/api\/v1\//);
  });

  test('已登入時發出請求：自動帶上 Authorization', async () => {
    const { instance, sent } = createInstance();
    setupInterceptors(instance, { getToken: () => 'token-123', onUnauthorized: vi.fn() });

    await instance.get('/cart');

    expect(sent[0].headers.Authorization).toBe('Bearer token-123');
  });

  test('未登入時發出請求：不帶 Authorization', async () => {
    const { instance, sent } = createInstance();
    setupInterceptors(instance, { getToken: () => null, onUnauthorized: vi.fn() });

    await instance.get('/products');

    expect(sent[0].headers.Authorization).toBeUndefined();
  });

  test('帶著 Token 的請求得到 401：觸發登出處理', async () => {
    const onUnauthorized = vi.fn();
    const { instance } = createInstance({ status: 401, data: { status: 'failed', message: '請先登入' } });
    setupInterceptors(instance, { getToken: () => 'expired-token', onUnauthorized });

    await expect(instance.get('/cart')).rejects.toBeDefined();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('沒有 Token 的請求得到 401（例如登入時帳密錯誤）：不觸發登出處理', async () => {
    const onUnauthorized = vi.fn();
    const { instance } = createInstance({ status: 401, data: { status: 'failed', message: 'email 或密碼錯誤' } });
    setupInterceptors(instance, { getToken: () => null, onUnauthorized });

    await expect(instance.post('/auth/login', {})).rejects.toBeDefined();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  test('其他錯誤（403、500）：不觸發登出處理', async () => {
    const onUnauthorized = vi.fn();
    const { instance } = createInstance({ status: 403 });
    setupInterceptors(instance, { getToken: () => 'token', onUnauthorized });

    await expect(instance.get('/admin/products')).rejects.toBeDefined();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('#1 錯誤訊息整理', () => {
  test('使用後端回傳的訊息與欄位錯誤', () => {
    const result = toApiError({
      response: { status: 400, data: { status: 'failed', message: '輸入資料有誤', errors: [{ field: 'email', message: 'x' }] } },
    });

    expect(result).toEqual({ status: 400, message: '輸入資料有誤', errors: [{ field: 'email', message: 'x' }] });
  });

  test('連不上伺服器：使用固定的提示，不帶入技術細節', () => {
    const result = toApiError(new Error('Network Error at http://internal:3000'));

    expect(result.status).toBe(0);
    expect(result.message).not.toMatch(/internal|Network Error/);
  });

  test('伺服器錯誤（5xx）：一律使用固定文字，不顯示後端的訊息', () => {
    const result = toApiError({ response: { status: 500, data: { message: 'QueryFailedError at /app/src/a.js:1' } } });

    expect(result.message).toBe('發生錯誤，請稍後再試');
  });

  test('後端沒有回傳訊息：使用預設訊息', () => {
    expect(toApiError({ response: { status: 500, data: '<html>' } }).message).toBe('發生錯誤，請稍後再試');
  });
});
