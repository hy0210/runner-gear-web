<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProductCard from '../components/ProductCard.vue';
import PaginationNav from '../components/PaginationNav.vue';
import StateMessage from '../components/StateMessage.vue';
import { fetchCategories, fetchProducts } from '../api/products.js';
import { toApiError } from '../api/http.js';
import { buildListQuery, parseListQuery, KEYWORD_MAX_LENGTH } from '../utils/list-query.js';

const PAGE_SIZE = 12;

const route = useRoute();
const router = useRouter();

// 篩選條件與頁碼以網址為準：畫面可以被分享，重新整理也能還原
const filters = computed(() => parseListQuery(route.query));

const categories = ref([]);
const products = ref([]);
const pagination = ref({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
const isLoading = ref(true);
const errorMessage = ref('');
const keywordInput = ref(filters.value.keyword);

const hasFilters = computed(() => Boolean(filters.value.categoryId || filters.value.keyword));
const emptyTitle = computed(() =>
  filters.value.keyword ? `找不到符合「${filters.value.keyword}」的商品` : '這個分類目前沒有商品',
);

// 每次查詢的序號：連續切換條件時，較早送出的請求即使較晚回來也不會蓋掉新的結果
let latestRequest = 0;

async function loadProducts() {
  const requestId = ++latestRequest;
  const { page, categoryId, keyword } = filters.value;
  const params = { page, limit: PAGE_SIZE };
  if (categoryId) params.categoryId = categoryId;
  if (keyword) params.keyword = keyword;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await fetchProducts(params);
    if (requestId !== latestRequest) return;
    products.value = result.products;
    pagination.value = result.pagination;
  } catch (error) {
    if (requestId !== latestRequest) return;
    errorMessage.value = toApiError(error).message;
  } finally {
    if (requestId === latestRequest) {
      isLoading.value = false;
    }
  }
}

async function loadCategories() {
  try {
    categories.value = await fetchCategories();
  } catch {
    // 分類載入失敗時仍可瀏覽與搜尋全部商品，只是沒有分類按鈕
    categories.value = [];
  }
}

function linkFor(overrides) {
  return { name: 'products', query: buildListQuery({ ...filters.value, ...overrides }) };
}

function submitSearch() {
  const keyword = keywordInput.value.trim().slice(0, KEYWORD_MAX_LENGTH);
  router.push(linkFor({ keyword, page: 1 }));
}

function clearFilters() {
  router.push({ name: 'products' });
}

watch(
  filters,
  (current) => {
    keywordInput.value = current.keyword;
    loadProducts();
  },
  { deep: true },
);

onMounted(() => {
  loadCategories();
  loadProducts();
});
</script>

<template>
  <div class="container pt-4 pt-md-5">
    <h1 class="h2 mb-4">全部商品</h1>

    <div class="d-flex flex-column flex-lg-row gap-3 align-items-lg-center mb-3">
      <nav class="category-pills d-flex gap-2 flex-lg-wrap flex-grow-1 pb-1" aria-label="商品分類">
        <RouterLink
          class="btn rounded-pill"
          :class="filters.categoryId === null ? 'btn-dark' : 'btn-outline-dark'"
          :to="linkFor({ categoryId: null, page: 1 })"
          :aria-current="filters.categoryId === null ? 'true' : undefined"
          data-test="category-filter"
        >
          全部
        </RouterLink>
        <RouterLink
          v-for="category in categories"
          :key="category.id"
          class="btn rounded-pill"
          :class="filters.categoryId === category.id ? 'btn-dark' : 'btn-outline-dark'"
          :to="linkFor({ categoryId: category.id, page: 1 })"
          :aria-current="filters.categoryId === category.id ? 'true' : undefined"
          data-test="category-filter"
        >
          {{ category.name }}
        </RouterLink>
      </nav>

      <form class="d-flex gap-2" role="search" data-test="search-form" @submit.prevent="submitSearch">
        <label class="visually-hidden" for="keyword">搜尋商品名稱</label>
        <input
          id="keyword"
          v-model="keywordInput"
          class="form-control"
          type="search"
          placeholder="搜尋商品名稱"
          :maxlength="KEYWORD_MAX_LENGTH"
          data-test="keyword"
        />
        <button class="btn btn-dark flex-shrink-0" type="submit">搜尋</button>
      </form>
    </div>

    <StateMessage v-if="isLoading" kind="loading" title="商品載入中…" />
    <StateMessage
      v-else-if="errorMessage"
      kind="error"
      title="商品載入失敗"
      :description="errorMessage"
      action-label="重試"
      @action="loadProducts"
    />
    <StateMessage
      v-else-if="products.length === 0"
      kind="empty"
      :title="hasFilters ? emptyTitle : '目前沒有商品'"
      :description="hasFilters ? '試試其他關鍵字，或清除篩選條件。' : ''"
      :action-label="hasFilters ? '清除條件' : ''"
      @action="clearFilters"
    />
    <template v-else>
      <p class="text-secondary" data-test="summary">
        共 {{ pagination.total }} 件商品，第 {{ pagination.page }} / {{ pagination.totalPages }} 頁
      </p>
      <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 g-md-4 mb-4">
        <div v-for="product in products" :key="product.id" class="col">
          <ProductCard :product="product" />
        </div>
      </div>
      <PaginationNav
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :link-for="(page) => linkFor({ page })"
      />
    </template>
  </div>
</template>
