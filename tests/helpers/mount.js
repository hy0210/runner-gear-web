import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { createAppRouter } from '../../src/router/index.js';

// 以真正的 router（記憶體 history）與 pinia 掛載元件，回傳 wrapper、router 與 pinia。
export async function mountWithApp(component, { path = '/', props, slots } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createAppRouter(createMemoryHistory());
  router.push(path);
  await router.isReady();

  const wrapper = mount(component, {
    props,
    slots,
    global: { plugins: [pinia, router] },
    attachTo: document.body,
  });
  await flushPromises();
  return { wrapper, router, pinia };
}

export { flushPromises };
