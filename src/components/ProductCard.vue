<script setup>
import { formatPrice } from '../utils/format.js';

defineProps({
  product: { type: Object, required: true },
});
</script>

<template>
  <article class="card product-card h-100">
    <!-- 圖片網址來自後端：只用屬性綁定，不拼接到 HTML 或 CSS；不送出來源頁網址 -->
    <img class="product-card__image card-img-top" :src="product.imageUrl" :alt="product.name" loading="lazy" referrerpolicy="no-referrer" />
    <div class="card-body d-flex flex-column gap-1">
      <span v-if="product.category" class="text-secondary small" data-test="category">{{ product.category.name }}</span>
      <h3 class="card-title h6 mb-0" data-test="name">{{ product.name }}</h3>
      <p class="fw-bold mb-0 mt-auto pt-2" data-test="price">{{ formatPrice(product.price) }}</p>
      <slot name="actions" :product="product" />
    </div>
  </article>
</template>
