# 資安檢查清單與紀錄

## 流程上的檢查
| 時機 | 檢查 |
|---|---|
| 寫 spec | issue 必填「安全考量」，否則不得標 `spec:ready` |
| 每次 push / PR（CI） | gitleaks、`npm audit --audit-level=high`、ESLint（含 `vue/no-v-html` 與 eslint-plugin-security） |
| GitHub 內建 | Secret scanning、push protection、Dependabot alerts、CodeQL（由使用者開啟） |
| 每個批次 PR 送審前 | 簡化檢查、程式審查，再做獨立資安審查；結果記在本文件與 PR 留言 |
| 繳交前 | 線上實測：未登入無法使用購物車、登出後 Token 已清除、畫面資料全部來自 API |

## 前端安全需求
- 全站不使用 `v-html`。商品名稱、描述、會員名稱等後端資料一律以 `{{ }}` 輸出；圖片以 `:src` 綁定，不把後端的值拼進 HTML 或 CSS 字串。（管理員帳號是公開的，商品欄位可能被寫入任意內容。）
- Token 只存在 localStorage，以 `Authorization` 標頭送出；不寫入 cookie、不放在網址。
- 帶著 Token 的請求得到 401 時，由 axios 攔截器統一清除登入狀態並導向登入頁。
- 不保存密碼；表單送出後清空密碼欄位。
- 錯誤提示只顯示後端回傳的訊息或固定文字，不顯示技術細節。
- 網址上的查詢參數先驗證再使用（頁碼為正整數、關鍵字有長度上限）。
- 購物車金額不在前端計算，直接顯示後端回傳的值。
- `.env` 不進版本庫；`VITE_` 開頭的變數會被打包進前端，只能放非機密的值。

## 已知風險
- Token 存在 localStorage，若網站出現 XSS 漏洞即可被讀取。對策：禁用 `v-html`、不載入第三方 script、Token 有期限。
- 商品圖片來自外部的佔位圖服務，該服務失效時圖片無法顯示（不影響功能）。

## 各批次審查紀錄

### 批次 5｜`feat/fe-catalog`（#1、#2、#3、#4）｜2026/11/16
審查方式：獨立審查（唯讀），範圍為分支相對 `main` 的全部變更；執行 lint、測試與建置，檢查建置產物，並對 axios 攔截器與查詢參數驗證做行為實測。
結論：**沒有「必改」**；4 項「建議改」、4 項「可不改」。

| 編號 | 發現 | 判定 | 處理 |
|---|---|---|---|
| 1 | axios 實例接受完整網址，若日後誤把外部網址傳入，Token 會被送到其他網域 | 建議改 | ✅ 已修：`allowAbsoluteUrls: false`，並加測試 |
| 2 | 帶著舊 Token 登入失敗時也會觸發自動登出 | 建議改 | ➡️ 批次 6：登入、註冊請求明確不帶 Token（已寫入 #5） |
| 3 | 登入後的 `redirect` 參數目前只寫入、尚未讀取；讀取時必須驗證 | 建議改 | ➡️ 批次 6：只接受站內路徑（已寫入 #5） |
| 4 | 沒有 CSP 與其他安全標頭 | 建議改 | ➡️ 批次 7：以 Amplify 的 `customHttp.yml` 設定（已寫入 #7） |
| 5 | 商品圖片可指向任意外部主機（非 XSS，只會讓瀏覽器向該主機發出請求） | 可不改 | ✅ 已加 `referrerpolicy="no-referrer"` |
| 6 | 後端若在 5xx 回應放入內部訊息，前端會原樣顯示 | 可不改 | ✅ 已修：5xx 一律顯示固定文字，並加測試 |
| 7 | GitHub Actions 以主版本標籤引用，未釘 commit SHA | 可不改 | 不改（與後端一致） |
| 8 | `.claude/settings.json` 的拒絕清單未涵蓋所有 `.env.*` 檔名 | 可不改 | 由使用者決定是否加嚴 |

已檢查且無問題：沒有 `v-html`、`innerHTML`、動態 `:href`／`:style`，後端資料與網址上的關鍵字都以文字輸出；Token 只在 `stores/auth.js` 讀寫、只放在 Authorization 標頭，不出現在網址或記錄；查詢參數的各種不合法寫法都回到預設值；建置產物沒有 source map、第三方 script 或字型；相依套件全部來自 npm registry；CI 權限最小且無注入面；外部連結有 `rel="noopener noreferrer"`。

### 批次 6｜`feat/fe-member-cart`（#5、#6）｜2026/11/16
審查方式：獨立審查（唯讀），範圍為分支相對 `feat/fe-catalog` 的全部變更；執行 lint、測試與建置，並在暫存環境以 jsdom 與 vue-router 實測登入後導向、Token 處理與購物車的行為。
結論：**沒有「必改」**；3 項「建議改」已修完、3 項「可不改」。批次 5 要求本批處理的兩項（登入、註冊不帶舊 Token；登入後只導向站內路徑）確認已完成。

| 編號 | 發現 | 判定 | 處理 |
|---|---|---|---|
| 1 | 啟動時確認 Token 的期間若使用者登出或換帳號，回應會把舊的會員資料寫回 | 建議改 | ✅ 已修：回應回來時 Token 已改變就不採用，並加測試 |
| 2 | 舊 Token 的請求較晚得到 401 時，會把之後的新登入清掉 | 建議改 | ✅ 已修：只有用目前的 Token 送出的請求被拒絕才登出，並加測試 |
| 3 | 5xx 回應裡的欄位錯誤仍會顯示在表單旁 | 建議改 | ✅ 已修：欄位錯誤只採用 4xx 且格式正確的項目，並加測試 |
| 4 | 導向路徑的檢查沒擋 Tab、換行、反斜線（實測仍停留在本站，沒有實際風險） | 可不改 | ✅ 已加強：含控制字元或反斜線一律回首頁 |
| 5 | 登出瞬間仍在路上的購物車回應會短暫寫回記憶體（畫面不顯示，換帳號後立即覆蓋） | 可不改 | 不改 |
| 6 | 購物車關閉後焦點沒有回到按鈕（無障礙） | 可不改 | ✅ 已修 |

已檢查且無問題：登入與註冊以 `skipAuth` 送出、失敗的 401 不會登出；所有導向都經過 vue-router，沒有 `window.location`；Token 不會送到其他網域、不出現在網址或記錄；登出或 Token 失效時清除 localStorage 與購物車；沒有 `v-html` 或 `innerHTML`，商品名稱、會員名稱、錯誤訊息與 Toast 都以文字輸出；密碼每次送出後清空、不寫入 store 或 localStorage；購物車金額與件數直接採用後端的值，數量限制與後端一致，處理中會停用按鈕。

### 批次 7｜`feat/fe-release`（#7）｜2026/11/16
審查方式：獨立審查（唯讀），範圍為分支相對 `feat/fe-member-cart` 的全部變更，並檢查正式建置的 `dist/index.html`、CSS 與 `src` 的圖片與 style 綁定是否會被 CSP 擋下。另以正式建置加上 `customHttp.yml` 的標頭在本機跑完整流程（未登入導向、登入、加入購物車、調整、重新整理、登出），Console 沒有 CSP 錯誤。
結論：**沒有「必改」**；2 項「建議改」已修完。批次 5 第 4 項（缺少 CSP 與安全標頭）確認已完成。

| 編號 | 發現 | 判定 | 處理 |
|---|---|---|---|
| 1 | 部署文件沒有提醒 `CORS_ORIGINS` 不可用 `*`、正式環境不需要 localhost | 建議改 | ✅ 已補在部署步驟 |
| 2 | 部署文件沒有提到不需開啟 PR 預覽（公開 Repo 的外部 PR 可能觸發建置） | 建議改 | ✅ 已補在部署步驟 |

已檢查且無問題：CSP 沒有 `unsafe-inline`／`unsafe-eval`，建置產物沒有 inline script 或 style；`connect-src` 只允許同來源與後端網域；Bootstrap CSS 的 `data:` 圖示由 `img-src` 允許；`object-src 'none'`、`base-uri 'self'`、`form-action 'self'`、`frame-ancestors 'none'` 都有設定；HSTS、nosniff、`X-Frame-Options: DENY`、Referrer-Policy 套用到所有回應；SPA rewrite 只把沒有副檔名的路徑交給 `index.html`，且只部署 `dist`；`amplify.yml` 以 `npm ci` 安裝、沒有寫死任何值；README 與部署文件沒有機密（測試帳號是專題要求公開的）。
