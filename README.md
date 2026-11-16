# Runner Gear 跑者裝備（前端）

跑步裝備店的電商網站前端：瀏覽與搜尋跑鞋、服飾、配件，會員註冊登入後可以使用購物車（加入、調整數量、移除）。六角學院單人專題「前後端整合主題電商平台」。

## 線上網址

| 項目 | 網址 |
|---|---|
| 前端網站 | 待 Amplify 建立後補上 |
| 後端 API Base URL | <https://d1461t9n4hr1h9.cloudfront.net> |
| API 文件（Swagger UI） | <https://d1461t9n4hr1h9.cloudfront.net/api-docs> |
| 後端 Repo | [`hy0210/runner-gear-api`](https://github.com/hy0210/runner-gear-api) |

### 測試帳號

| 角色 | Email | 密碼 |
|---|---|---|
| 一般會員 | `member@runnergear.test` | `m1e2m3b4e5r6` |

也可以在網站上自行註冊新帳號。前端不提供後台頁面；管理員帳號與商品管理 API 見後端 README。

## 功能

- 首頁：主視覺與精選商品（8 件）
- 商品列表：依分類篩選、關鍵字搜尋、分頁
- 會員：註冊、登入、登出；重新整理後保持登入
- 購物車：加入、調整數量（1–99）、移除；金額由後端計算，未登入時引導到登入頁
- 不含結帳與訂單（需求範圍外）

## 技術

- Vue 3（Composition API、`<script setup>`）、Vue Router、Pinia、Vite
- axios（所有 API 請求經過 `src/api/http.js`）
- Bootstrap 5（只用 CSS）
- 測試：Vitest、Vue Test Utils；檢查：ESLint
- 部署：AWS Amplify Hosting（`amplify.yml` 建置設定、`customHttp.yml` 安全標頭）

## 本機啟動

需要 Node.js 24，以及在本機或線上執行中的後端。

```bash
npm ci
cp .env.example .env    # 填入 VITE_API_BASE_URL，例如 http://localhost:3000
npm run dev             # http://localhost:5173
```

後端的 `CORS_ORIGINS` 需要包含 `http://localhost:5173`。

## 環境變數

| 變數 | 必填 | 說明 |
|---|---|---|
| `VITE_API_BASE_URL` | 是 | 後端 API 的網址，不含結尾斜線與 `/api/v1`。未設定時開發與建置都會失敗並指出變數名稱 |

這個值會被打包進前端程式，所以只能放公開的 API 網址，不能放任何機密。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發伺服器 |
| `npm run lint` | ESLint 檢查 |
| `npm test` | 執行測試 |
| `npm run build` | 正式建置（輸出到 `dist`，需要 `VITE_API_BASE_URL`） |

## 部署

部署在 AWS Amplify Hosting，`main` 有新的合併時自動建置。主控台的設定步驟見 [`docs/deploy.md`](docs/deploy.md)。

## 文件

- [`docs/requirements.md`](docs/requirements.md)：需求與評分標準
- [`docs/PROGRESS.md`](docs/PROGRESS.md)：開發進度
- [`docs/decisions.md`](docs/decisions.md)：技術決策紀錄
- [`docs/security.md`](docs/security.md)：資安需求與審查紀錄
