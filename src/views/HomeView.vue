<script setup>
import { onMounted, ref } from 'vue';
import ProductCard from '../components/ProductCard.vue';
import StateMessage from '../components/StateMessage.vue';
import { fetchProducts } from '../api/products.js';
import { toApiError } from '../api/http.js';

const FEATURED_COUNT = 8;

const products = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await fetchProducts({ limit: FEATURED_COUNT });
    products.value = result.products;
  } catch (error) {
    errorMessage.value = toApiError(error).message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="hero">
    <div class="container py-5">
      <div class="row align-items-center g-4">
        <div class="col-md-7">
          <h1 class="display-5 fw-bold">跑得更遠，<br class="d-none d-md-inline" />從一雙合腳的鞋開始</h1>
          <p class="lead text-secondary">跑鞋、服飾、配件、補給與電子裝置，訓練到比賽需要的都在這裡。</p>
          <RouterLink class="btn btn-dark btn-lg" :to="{ name: 'products' }" data-test="hero-cta">逛逛全部商品</RouterLink>
        </div>
      </div>
    </div>
  </section>

  <section class="container pt-5" aria-labelledby="featured-title">
    <div class="d-flex align-items-baseline justify-content-between mb-4">
      <h2 id="featured-title" class="h3 mb-0">精選商品</h2>
      <RouterLink :to="{ name: 'products' }">查看全部商品</RouterLink>
    </div>

    <StateMessage v-if="isLoading" kind="loading" title="商品載入中…" />
    <StateMessage
      v-else-if="errorMessage"
      kind="error"
      title="商品載入失敗"
      :description="errorMessage"
      action-label="重試"
      @action="load"
    />
    <StateMessage v-else-if="products.length === 0" kind="empty" title="目前沒有商品" />
    <div v-else class="row row-cols-2 row-cols-md-4 g-3 g-md-4">
      <div v-for="product in products" :key="product.id" class="col">
        <ProductCard :product="product" />
      </div>
    </div>
  </section>
</template>
