<script setup>
import { nextTick, ref, watch } from 'vue';
import { useCartStore, MAX_QUANTITY } from '../stores/cart.js';
import { useToastStore } from '../stores/toast.js';
import { toApiError } from '../api/http.js';
import { formatPrice } from '../utils/format.js';

const cart = useCartStore();
const toast = useToastStore();
const closeButton = ref(null);

// 開啟時把焦點移到關閉按鈕；關閉後還給購物車按鈕，方便鍵盤操作
watch(
  () => cart.isOpen,
  async (isOpen, wasOpen) => {
    await nextTick();
    if (isOpen) {
      closeButton.value?.focus();
    } else if (wasOpen) {
      document.getElementById('cart-button')?.focus();
    }
  },
);

function isPending(item) {
  return cart.pendingIds.includes(item.id);
}

// 操作失敗時只顯示提示；畫面上的資料只會由後端的回應更新，所以不會和後端不一致
async function run(task) {
  try {
    await task();
  } catch (error) {
    toast.show(toApiError(error).message, 'error');
  }
}

const changeQuantity = (item, quantity) => run(() => cart.update(item.id, quantity));
const removeItem = (item) => run(() => cart.remove(item.id));
</script>

<template>
  <div>
    <aside
      id="cart-offcanvas"
      class="offcanvas offcanvas-end cart-offcanvas"
      :class="{ show: cart.isOpen }"
      :style="{ visibility: cart.isOpen ? 'visible' : 'hidden' }"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
      @keydown.esc="cart.close()"
    >
      <div class="offcanvas-header border-bottom">
        <h2 id="cart-title" class="offcanvas-title h5">購物車（{{ cart.totalQuantity }} 件）</h2>
        <button ref="closeButton" type="button" class="btn-close" aria-label="關閉購物車" data-test="close" @click="cart.close()"></button>
      </div>

      <div class="offcanvas-body d-flex flex-column p-0">
        <p v-if="cart.items.length === 0" class="text-center text-secondary py-5 my-auto" data-test="empty">
          購物車是空的，去逛逛吧。
        </p>
        <ul v-else class="list-unstyled mb-0 px-3">
          <li v-for="item in cart.items" :key="item.id" class="d-flex gap-3 py-3 border-bottom" data-test="cart-item">
            <img class="cart-item__image rounded" :src="item.product.imageUrl" :alt="item.product.name" referrerpolicy="no-referrer" />
            <div class="flex-grow-1 d-flex flex-column gap-2 min-w-0">
              <div>
                <p class="fw-medium mb-0 text-break">{{ item.product.name }}</p>
                <p class="text-secondary small mb-0">單價 {{ formatPrice(item.product.price) }}</p>
              </div>
              <div class="d-flex align-items-center gap-2">
                <div class="input-group input-group-sm w-auto" role="group" :aria-label="`${item.product.name} 的數量`">
                  <button
                    class="btn btn-outline-dark"
                    type="button"
                    :disabled="isPending(item) || item.quantity <= 1"
                    :aria-label="`減少 ${item.product.name} 的數量`"
                    data-test="decrease"
                    @click="changeQuantity(item, item.quantity - 1)"
                  >
                    −
                  </button>
                  <span class="input-group-text bg-white fw-bold cart-item__quantity" data-test="quantity" aria-live="polite">{{ item.quantity }}</span>
                  <button
                    class="btn btn-outline-dark"
                    type="button"
                    :disabled="isPending(item) || item.quantity >= MAX_QUANTITY"
                    :aria-label="`增加 ${item.product.name} 的數量`"
                    data-test="increase"
                    @click="changeQuantity(item, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>
                <span class="ms-auto fw-bold text-nowrap" data-test="subtotal">{{ formatPrice(item.subtotal) }}</span>
              </div>
              <button
                class="btn btn-link btn-sm text-secondary p-0 align-self-start"
                type="button"
                :disabled="isPending(item)"
                :aria-label="`移除 ${item.product.name}`"
                data-test="remove"
                @click="removeItem(item)"
              >
                移除
              </button>
            </div>
          </li>
        </ul>

        <div class="mt-auto border-top p-3 d-flex flex-column gap-2">
          <div class="d-flex justify-content-between fs-5 fw-bold">
            <span>總金額</span>
            <span data-test="total">{{ formatPrice(cart.totalPrice) }}</span>
          </div>
          <p class="small text-secondary mb-0">本網站為專題作品，不提供結帳功能。</p>
          <RouterLink class="btn btn-outline-dark" :to="{ name: 'products' }" @click="cart.close()">繼續購物</RouterLink>
        </div>
      </div>
    </aside>
    <div v-if="cart.isOpen" class="offcanvas-backdrop fade show" @click="cart.close()"></div>
  </div>
</template>
