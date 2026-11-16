import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toApiError } from '../api/http.js';
import { safeRedirect } from '../utils/redirect.js';

// 登入與註冊表單共用的流程：
// 送出前檢查欄位 → 呼叫 API → 成功時導向原本要去的頁面；失敗時顯示後端訊息並清空密碼。
export function useAuthForm({ fields, validate, submit }) {
  const route = useRoute();
  const router = useRouter();

  const form = reactive({ ...fields });
  const errors = reactive(Object.fromEntries(Object.keys(fields).map((key) => [key, ''])));
  const formError = ref('');
  const isSubmitting = ref(false);

  function setErrors(next) {
    for (const key of Object.keys(errors)) {
      // eslint-disable-next-line security/detect-object-injection -- key 來自固定的欄位清單
      errors[key] = next[key] ?? '';
    }
  }

  async function onSubmit() {
    if (isSubmitting.value) return;
    formError.value = '';
    const found = validate(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    isSubmitting.value = true;
    try {
      await submit(form);
      await router.replace(safeRedirect(route.query.redirect));
    } catch (error) {
      const { message, errors: fieldErrors } = toApiError(error);
      const mapped = {};
      for (const item of fieldErrors) {
        if (item.field in errors) mapped[item.field] = item.message;
      }
      setErrors(mapped);
      formError.value = message;
    } finally {
      // 密碼不留在畫面與記憶體中
      if ('password' in form) form.password = '';
      isSubmitting.value = false;
    }
  }

  return { form, errors, formError, isSubmitting, onSubmit };
}
