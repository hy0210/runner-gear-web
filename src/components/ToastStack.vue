<script setup>
import { useToastStore } from '../stores/toast.js';

const toast = useToastStore();
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3" aria-live="polite" aria-atomic="false">
    <div
      v-for="message in toast.messages"
      :key="message.id"
      class="toast show align-items-center border-2"
      :class="message.kind === 'error' ? 'border-dark' : 'border-secondary'"
      :role="message.kind === 'error' ? 'alert' : 'status'"
      data-test="toast"
    >
      <div class="d-flex">
        <div class="toast-body fw-medium">{{ message.text }}</div>
        <button type="button" class="btn-close me-2 m-auto" aria-label="關閉提示" data-test="toast-close" @click="toast.dismiss(message.id)"></button>
      </div>
    </div>
  </div>
</template>
