<template>
  <header class="site-header border-bottom sticky-top">
    <nav class="navbar navbar-expand-md" aria-label="主要導覽">
      <div class="container">
        <RouterLink class="navbar-brand fw-bold" :to="{ name: 'home' }">Runner Gear 跑者裝備</RouterLink>

        <div class="d-flex align-items-center gap-2 order-md-last">
          <slot name="actions" />
          <button
            class="navbar-toggler"
            type="button"
            aria-controls="main-nav"
            :aria-expanded="isOpen"
            :aria-label="isOpen ? '關閉選單' : '開啟選單'"
            @click="isOpen = !isOpen"
          >
            <span class="navbar-toggler-icon" aria-hidden="true"></span>
          </button>
        </div>

        <div id="main-nav" class="collapse navbar-collapse" :class="{ show: isOpen }">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <RouterLink class="nav-link" exact-active-class="active fw-bold" :to="{ name: 'home' }">首頁</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" active-class="active fw-bold" :to="{ name: 'products' }">全部商品</RouterLink>
            </li>
          </ul>

          <div v-if="auth.isLoggedIn" class="d-flex align-items-center gap-2 py-2 py-md-0 me-md-2" data-test="member-area">
            <span class="text-secondary" data-test="member-name">{{ auth.user.name }}，你好</span>
            <button class="btn btn-outline-dark btn-sm" type="button" data-test="logout" @click="logout">登出</button>
          </div>
          <div v-else class="d-flex gap-2 py-2 py-md-0 me-md-2" data-test="guest-area">
            <RouterLink class="btn btn-outline-dark btn-sm flex-fill" :to="{ name: 'login' }">登入</RouterLink>
            <RouterLink class="btn btn-dark btn-sm flex-fill" :to="{ name: 'register' }">註冊</RouterLink>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

// 手機版的選單是否展開
const isOpen = ref(false);

// 換頁後自動收合選單
watch(
  () => route.fullPath,
  () => {
    isOpen.value = false;
  },
);

function logout() {
  auth.clearSession();
  isOpen.value = false;
  router.push({ name: 'home' });
}
</script>
