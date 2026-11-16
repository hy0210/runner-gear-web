// 前端的欄位檢查，規則與後端一致；通過後仍以後端的結果為準。
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (!value) return '請輸入 email';
  return EMAIL.test(value) ? '' : 'email 格式不正確';
}

export function validatePassword(value, { checkLength = true } = {}) {
  if (!value) return '請輸入密碼';
  if (!checkLength) return '';
  if (value.length < 8) return '密碼至少需要 8 個字元';
  if (value.length > 72) return '密碼長度不可超過 72 個字元';
  return '';
}

export function validateName(value) {
  if (!value) return '請輸入姓名';
  return value.length > 50 ? '姓名長度不可超過 50 個字元' : '';
}
