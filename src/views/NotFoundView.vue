<template>
  <div class="container py-5 text-center">
    <h1 class="h3">找不到這個頁面</h1>
    <p class="text-secondary">網址可能有誤，或頁面已經移除。</p>
    <RouterLink class="btn btn-dark" :to="{ name: 'home' }">回首頁</RouterLink>
  </div>
</template>
