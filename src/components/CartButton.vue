<script setup>
import { useCartStore } from '../stores/cart.js';
import { useAuthStore } from '../stores/auth.js';
import { useRequireLogin } from '../composables/useRequireLogin.js';

const cart = useCartStore();
const auth = useAuthStore();
const requireLogin = useRequireLogin();

function openCart() {
  if (requireLogin()) cart.open();
}
</script>

<template>
  <button
    class="btn btn-outline-dark position-relative cart-button"
    type="button"
    :aria-label="auth.isLoggedIn ? `購物車，共 ${cart.totalQuantity} 件` : '購物車'"
    aria-controls="cart-offcanvas"
    :aria-expanded="cart.isOpen"
    data-test="cart-button"
    @click="openCart"
  >
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 4h2l2.5 11h10L20 7H6.5"></path>
      <circle cx="9" cy="19" r="1.5"></circle>
      <circle cx="17" cy="19" r="1.5"></circle>
    </svg>
    <span
      v-if="auth.isLoggedIn && cart.totalQuantity > 0"
      class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-dark"
      data-test="cart-count"
      aria-hidden="true"
    >{{ cart.totalQuantity }}</span>
  </button>
</template>
