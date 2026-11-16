<template>
  <div class="container py-5">
    <section class="card mx-auto auth-card" aria-labelledby="register-title">
      <div class="card-body p-4">
        <h1 id="register-title" class="h3 mb-4">註冊會員</h1>
        <div v-if="formError" class="alert alert-dark" role="alert" data-test="form-error">{{ formError }}</div>
        <form novalidate @submit.prevent="onSubmit">
          <FormField id="name" v-model="form.name" label="姓名" autocomplete="name" :error="errors.name" :maxlength="50" />
          <FormField id="email" v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" :maxlength="255" />
          <FormField
            id="password"
            v-model="form.password"
            label="密碼"
            type="password"
            autocomplete="new-password"
            hint="至少 8 個字元"
            :error="errors.password"
            :maxlength="72"
          />
          <button class="btn btn-dark w-100" type="submit" :disabled="isSubmitting" data-test="submit">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            {{ isSubmitting ? '註冊中…' : '註冊' }}
          </button>
        </form>
        <p class="text-center text-secondary mt-3 mb-0">
          已經有帳號？<RouterLink :to="{ name: 'login', query: $route.query }">登入</RouterLink>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import FormField from '../components/FormField.vue';
import { useAuthForm } from '../composables/useAuthForm.js';
import { useAuthStore } from '../stores/auth.js';
import { validateEmail, validateName, validatePassword } from '../utils/validation.js';

const auth = useAuthStore();

const { form, errors, formError, isSubmitting, onSubmit } = useAuthForm({
  fields: { name: '', email: '', password: '' },
  validate: (values) => ({
    name: validateName(values.name.trim()),
    email: validateEmail(values.email.trim()),
    password: validatePassword(values.password),
  }),
  submit: (values) =>
    auth.register({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    }),
});
</script>
