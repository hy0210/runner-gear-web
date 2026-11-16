// 金額顯示：NT$ 4,280
export function formatPrice(value) {
  return `NT$ ${Number(value).toLocaleString('zh-TW')}`;
}
