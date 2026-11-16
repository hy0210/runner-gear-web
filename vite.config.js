import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolveApiBaseUrl } from './src/utils/env.js';

export default defineConfig(({ mode }) => {
  // 測試不需要真的 API 位址；其他情況（開發、建置）缺少設定就直接失敗
  if (mode !== 'test') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    resolveApiBaseUrl(env.VITE_API_BASE_URL);
  }

  return {
    plugins: [vue()],
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.test.js'],
      env: { VITE_API_BASE_URL: 'http://api.test' },
    },
  };
});
