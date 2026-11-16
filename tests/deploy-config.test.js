// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 測試從專案根目錄執行
// eslint-disable-next-line security/detect-non-literal-fs-filename -- 讀取專案內固定的設定檔
const read = (name) => readFileSync(join(process.cwd(), name), 'utf8');

describe('#7 Amplify 的建置設定', () => {
  test('建置使用 Node 24、npm ci，產物在 dist', () => {
    const spec = read('amplify.yml');

    expect(spec).toMatch(/nvm use 24/);
    expect(spec).toMatch(/npm ci/);
    expect(spec).toMatch(/npm run build/);
    expect(spec).toMatch(/baseDirectory: dist/);
  });
});

describe('#7 安全標頭', () => {
  const headers = read('customHttp.yml');
  const csp = headers.match(/Content-Security-Policy'\s*\n\s*value: "([^"]+)"/)[1];

  test('script 只允許同來源，不允許 inline 或 eval', () => {
    expect(csp).toMatch(/script-src 'self'(;|$)/);
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  test('API 請求只允許自己的後端', () => {
    expect(csp).toMatch(/connect-src 'self' https:\/\/[a-z0-9]+\.cloudfront\.net(;|$)/);
  });

  test('禁止被其他網站嵌入，並有其他基本的安全標頭', () => {
    expect(csp).toMatch(/frame-ancestors 'none'/);
    for (const name of ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options']) {
      expect(headers).toContain(`key: '${name}'`);
    }
  });
});

describe('#7 README 涵蓋繳交要求的項目', () => {
  const readme = read('README.md');

  test.each([
    ['主題', /跑步裝備/],
    ['線上網址', /前端網站/],
    ['後端與 API 文件', /api-docs/],
    ['技術', /Vue 3/],
    ['本機啟動', /本機啟動/],
    ['環境變數', /`VITE_API_BASE_URL`/],
    ['測試帳號', /一般會員/],
    ['測試方式', /npm test/],
  ])('包含「%s」', (_label, pattern) => {
    expect(readme).toMatch(pattern);
  });
});
