import { resolveApiBaseUrl } from '../src/utils/env.js';

describe('#1 API 位址設定', () => {
  test('缺少 VITE_API_BASE_URL：報錯並指出變數名稱', () => {
    expect(() => resolveApiBaseUrl(undefined)).toThrow(/VITE_API_BASE_URL/);
    expect(() => resolveApiBaseUrl('   ')).toThrow(/VITE_API_BASE_URL/);
  });

  test('不是 http(s) 網址：報錯', () => {
    expect(() => resolveApiBaseUrl('not-a-url')).toThrow(/VITE_API_BASE_URL/);
    expect(() => resolveApiBaseUrl('ftp://example.com')).toThrow(/http/);
  });

  test('合法的網址：去掉結尾斜線', () => {
    expect(resolveApiBaseUrl('https://api.example.com/')).toBe('https://api.example.com');
    expect(resolveApiBaseUrl(' http://localhost:3000 ')).toBe('http://localhost:3000');
  });
});
