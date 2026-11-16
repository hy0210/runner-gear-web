<script setup>
import { watch } from 'vue';
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';
import CartButton from './components/CartButton.vue';
import CartOffcanvas from './components/CartOffcanvas.vue';
import ToastStack from './components/ToastStack.vue';
import { useAuthStore } from './stores/auth.js';
import { useCartStore } from './stores/cart.js';

const auth = useAuthStore();
const cart = useCartStore();

// 購物車跟著登入狀態：登入（含重新整理後仍登入）時向後端取得，登出或 Token 失效時清空
watch(
  () => auth.token,
  (token) => {
    if (token) {
      cart.fetch().catch(() => {});
    } else {
      cart.reset();
    }
  },
  { immediate: true },
);
</script>

<template>
  <AppNavbar>
    <template #actions>
      <CartButton />
    </template>
  </AppNavbar>
  <main>
    <RouterView />
  </main>
  <AppFooter />
  <CartOffcanvas />
  <ToastStack />
</template>
