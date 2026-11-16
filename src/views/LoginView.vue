<template>
  <div class="container py-5">
    <section class="card mx-auto auth-card" aria-labelledby="login-title">
      <div class="card-body p-4">
        <h1 id="login-title" class="h3 mb-4">會員登入</h1>
        <div v-if="formError" class="alert alert-dark" role="alert" data-test="form-error">{{ formError }}</div>
        <form novalidate @submit.prevent="onSubmit">
          <FormField id="email" v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" :maxlength="255" />
          <FormField id="password" v-model="form.password" label="密碼" type="password" autocomplete="current-password" :error="errors.password" :maxlength="72" />
          <button class="btn btn-dark w-100" type="submit" :disabled="isSubmitting" data-test="submit">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            {{ isSubmitting ? '登入中…' : '登入' }}
          </button>
        </form>
        <p class="text-center text-secondary mt-3 mb-0">
          還沒有帳號？<RouterLink :to="{ name: 'register', query: $route.query }">註冊</RouterLink>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import FormField from '../components/FormField.vue';
import { useAuthForm } from '../composables/useAuthForm.js';
import { useAuthStore } from '../stores/auth.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

const auth = useAuthStore();

const { form, errors, formError, isSubmitting, onSubmit } = useAuthForm({
  fields: { email: '', password: '' },
  validate: (values) => ({
    email: validateEmail(values.email.trim()),
    // 登入時只檢查有沒有填，不檢查長度，避免透露密碼規則以外的資訊
    password: validatePassword(values.password, { checkLength: false }),
  }),
  submit: (values) => auth.login({ email: values.email.trim().toLowerCase(), password: values.password }),
});
</script>
