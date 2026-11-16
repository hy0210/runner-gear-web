<template>
  <nav v-if="totalPages > 1" aria-label="分頁">
    <ul class="pagination justify-content-center flex-wrap gap-1 mb-0">
      <li class="page-item" :class="{ disabled: page <= 1 }">
        <RouterLink v-if="page > 1" class="page-link" :to="linkFor(page - 1)" data-test="prev">上一頁</RouterLink>
        <span v-else class="page-link" aria-disabled="true">上一頁</span>
      </li>
      <li v-for="number in pages" :key="number" class="page-item" :class="{ active: number === page }">
        <RouterLink
          class="page-link"
          :to="linkFor(number)"
          :aria-current="number === page ? 'page' : undefined"
          :aria-label="`第 ${number} 頁`"
          data-test="page"
        >
          {{ number }}
        </RouterLink>
      </li>
      <li class="page-item" :class="{ disabled: page >= totalPages }">
        <RouterLink v-if="page < totalPages" class="page-link" :to="linkFor(page + 1)" data-test="next">下一頁</RouterLink>
        <span v-else class="page-link" aria-disabled="true">下一頁</span>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  // 傳入頁碼，回傳該頁的路由位置
  linkFor: { type: Function, required: true },
});

const pages = computed(() => Array.from({ length: props.totalPages }, (_, index) => index + 1));
</script>
