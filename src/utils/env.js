// 檢查並整理 API 位址設定。缺少或格式不對時直接報錯，避免建置出連不到後端的網站。
export function resolveApiBaseUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new Error('缺少環境變數 VITE_API_BASE_URL（後端 API 的網址）');
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('VITE_API_BASE_URL 必須是完整的網址，例如 https://example.com');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_API_BASE_URL 只接受 http 或 https 網址');
  }

  // 去掉結尾斜線，之後統一接上 /api/v1
  return raw.replace(/\/+$/, '');
}
