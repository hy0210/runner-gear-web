import axios from 'axios';
import { resolveApiBaseUrl } from '../utils/env.js';

// 全站唯一的 axios 實例。位址來自環境變數，不在程式中寫死。
export const http = axios.create({
  baseURL: `${resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)}/api/v1`,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// 把 axios 的錯誤整理成畫面可以直接使用的形式。
// message 只取後端回傳的文字或固定的預設訊息，不帶入技術細節。
export function toApiError(error) {
  const status = error?.response?.status ?? 0;
  const body = error?.response?.data;
  const message =
    typeof body?.message === 'string' && body.message
      ? body.message
      : status === 0
        ? '無法連線到伺服器，請檢查網路後再試一次'
        : '發生錯誤，請稍後再試';
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  return { status, message, errors };
}

// 由 main.js 在建立 store 與 router 之後呼叫一次。
//   getToken        取得目前的 Token（沒有登入時回傳 null）
//   onUnauthorized  帶著 Token 的請求得到 401 時呼叫（Token 過期或失效）
export function setupInterceptors(instance, { getToken, onUnauthorized }) {
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // 只處理「帶著 Token 仍被拒絕」的情況；登入時帳密錯誤的 401 交給登入頁自己顯示
      const sentToken = Boolean(error?.config?.headers?.Authorization);
      if (error?.response?.status === 401 && sentToken) {
        onUnauthorized();
      }
      return Promise.reject(error);
    },
  );
}
