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
（每個批次 PR 送審前補上）
