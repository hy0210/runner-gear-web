<script setup>
// 一個表單欄位：label、輸入框與欄位旁的錯誤訊息
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  maxlength: { type: Number, default: undefined },
});

const model = defineModel({ type: String, default: '' });
</script>

<template>
  <div class="mb-3">
    <label class="form-label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="form-control"
      :class="{ 'is-invalid': error }"
      :type="type"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      :data-test="id"
    />
    <div v-if="error" :id="`${id}-error`" class="invalid-feedback d-block fw-bold" :data-test="`${id}-error`">{{ error }}</div>
    <div v-else-if="hint" :id="`${id}-hint`" class="form-text">{{ hint }}</div>
  </div>
</template>
