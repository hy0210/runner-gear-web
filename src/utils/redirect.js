// 登入後要回到的頁面。只接受站內路徑，避免被利用成開放重新導向：
// 必須以單一 / 開頭，且不能是 //（其他網域）或 /\（部分瀏覽器會當成 //）。
export function safeRedirect(value) {
  const path = Array.isArray(value) ? value[0] : value;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return '/';
  }
  return path;
}
