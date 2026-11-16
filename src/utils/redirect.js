// 登入後要回到的頁面。只接受站內路徑，避免被利用成開放重新導向：
// 必須以單一 / 開頭，不能是 //（其他網域），也不能含反斜線或控制字元（Tab、換行等，
// 部分瀏覽器會忽略或把它們當成 /）。
function hasUnsafeCharacter(path) {
  for (const char of path) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || char === '\\') return true;
  }
  return false;
}

export function safeRedirect(value) {
  const path = Array.isArray(value) ? value[0] : value;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || hasUnsafeCharacter(path)) {
    return '/';
  }
  return path;
}
