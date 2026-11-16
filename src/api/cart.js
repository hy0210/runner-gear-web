import { http } from './http.js';

// 每支購物車 API 都回傳最新的完整購物車：{ items, totalQuantity, totalPrice }
export async function fetchCart() {
  const { data } = await http.get('/cart');
  return data.data.cart;
}

export async function addCartItem({ productId, quantity }) {
  const { data } = await http.post('/cart/items', { productId, quantity });
  return data.data.cart;
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await http.patch(`/cart/items/${encodeURIComponent(itemId)}`, { quantity });
  return data.data.cart;
}

export async function removeCartItem(itemId) {
  const { data } = await http.delete(`/cart/items/${encodeURIComponent(itemId)}`);
  return data.data.cart;
}
