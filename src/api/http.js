import axios from 'axios';
import { resolveApiBaseUrl } from '../utils/env.js';

// 全站唯一的 axios 實例。位址來自環境變數，不在程式中寫死。
export const http = axios.create({
  baseURL: `${resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)}/api/v1`,
  // 只允許相對路徑：即使誤把完整網址傳進來，請求（與 Token）也不會送到其他網域
  allowAbsoluteUrls: false,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// 把 axios 的錯誤整理成畫面可以直接使用的形式。
// message 只取後端回傳的文字或固定的預設訊息，不帶入技術細節。
export function toApiError(error) {
  const status = error?.response?.status ?? 0;
  const body = error?.response?.data;
  let message = '發生錯誤，請稍後再試';
  if (status === 0) {
    message = '無法連線到伺服器，請檢查網路後再試一次';
  } else if (status < 500 && typeof body?.message === 'string' && body.message) {
    // 只有 4xx 才顯示後端的訊息；5xx 一律用固定文字，避免顯示伺服器內部細節
    message = body.message;
  }
  // 欄位錯誤同樣只採用 4xx，且只留下格式正確的項目
  const errors =
    status >= 400 && status < 500 && Array.isArray(body?.errors)
      ? body.errors.filter((item) => typeof item?.field === 'string' && typeof item?.message === 'string')
      : [];
  return { status, message, errors };
}

// 由 main.js 在建立 store 與 router 之後呼叫一次。
//   getToken        取得目前的 Token（沒有登入時回傳 null）
//   onUnauthorized  帶著 Token 的請求得到 401 時呼叫（Token 過期或失效）
export function setupInterceptors(instance, { getToken, onUnauthorized }) {
  instance.interceptors.request.use((config) => {
    // 登入、註冊等請求標記 skipAuth：不帶 Token
    if (config.skipAuth) {
      return config;
    }
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
      // 只在「用目前這個 Token 送出的請求」被拒絕時登出；
      // 舊 Token 的請求較晚回來時，不應清掉之後的新登入
      const sent = error?.config?.skipAuth ? null : error?.config?.headers?.Authorization;
      const current = getToken();
      if (error?.response?.status === 401 && sent && current && sent === `Bearer ${current}`) {
        onUnauthorized();
      }
      return Promise.reject(error);
    },
  );
}
