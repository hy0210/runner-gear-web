<script setup>
import { ref } from 'vue';
import { useCartStore } from '../stores/cart.js';
import { useToastStore } from '../stores/toast.js';
import { useRequireLogin } from '../composables/useRequireLogin.js';
import { toApiError } from '../api/http.js';

const props = defineProps({
  product: { type: Object, required: true },
});

const cart = useCartStore();
const toast = useToastStore();
const requireLogin = useRequireLogin();
const isAdding = ref(false);

async function addToCart() {
  if (isAdding.value || !requireLogin()) return;
  isAdding.value = true;
  try {
    await cart.add(props.product.id, 1);
    toast.show(`已加入購物車：${props.product.name}`, 'success');
  } catch (error) {
    toast.show(toApiError(error).message, 'error');
  } finally {
    isAdding.value = false;
  }
}
</script>

<template>
  <button
    class="btn btn-dark btn-sm w-100 mt-2"
    type="button"
    :disabled="isAdding"
    :aria-label="`加入購物車：${product.name}`"
    @click="addToCart"
  >
    <span v-if="isAdding" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
    {{ isAdding ? '加入中…' : '加入購物車' }}
  </button>
</template>
