<template>
  <div
    class="text-center py-5"
    :data-test="`state-${kind}`"
    :role="kind === 'error' ? 'alert' : 'status'"
    aria-live="polite"
  >
    <div v-if="kind === 'loading'" class="spinner-border text-secondary mb-3" aria-hidden="true"></div>
    <p class="fw-bold mb-1">{{ title }}</p>
    <p v-if="description" class="text-secondary mb-3">{{ description }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="btn"
      :class="kind === 'error' ? 'btn-dark' : 'btn-outline-dark'"
      data-test="state-action"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
// 載入中、查無結果、發生錯誤時的共用提示區塊。
defineProps({
  // loading | empty | error
  kind: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
});

defineEmits(['action']);
</script>
