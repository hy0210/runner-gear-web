import { defineStore } from 'pinia';
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from '../api/cart.js';

export const MAX_QUANTITY = 99;

const emptyState = () => ({ items: [], totalQuantity: 0, totalPrice: 0 });

// 購物車狀態。所有操作都以後端回傳的完整購物車覆寫，前端不自行累加或計算金額。
export const useCartStore = defineStore('cart', {
  state: () => ({
    ...emptyState(),
    isOpen: false,
    // 正在處理中的購物車項目 id，用來停用按鈕、避免重複送出
    pendingIds: [],
  }),
  actions: {
    apply(cart) {
      this.items = cart.items;
      this.totalQuantity = cart.totalQuantity;
      this.totalPrice = cart.totalPrice;
    },
    async fetch() {
      this.apply(await fetchCart());
    },
    async add(productId, quantity = 1) {
      this.apply(await addCartItem({ productId, quantity }));
    },
    async update(itemId, quantity) {
      await this.withPending(itemId, async () => this.apply(await updateCartItem(itemId, quantity)));
    },
    async remove(itemId) {
      await this.withPending(itemId, async () => this.apply(await removeCartItem(itemId)));
    },
    async withPending(itemId, task) {
      this.pendingIds.push(itemId);
      try {
        await task();
      } finally {
        this.pendingIds = this.pendingIds.filter((id) => id !== itemId);
      }
    },
    reset() {
      Object.assign(this, emptyState(), { isOpen: false, pendingIds: [] });
    },
    open() {
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
  },
});
