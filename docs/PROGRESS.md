# 進度

## 目前狀態
- 里程碑：M4 部署與驗收（批次 5、6、7 已合併）
- 進行中的分支與 issue：無進行中的分支；#8 線上驗收要等 Amplify 上線
- 下一步：建立 Amplify、設定 SPA rewrite，接著做 #8 線上驗收，並把前端網址補進兩份 README（同時把 `tests/deploy-config.test.js` 的線上網址檢查改成要求「前端網站」那一列有 `https://` 網址）
- 等使用者處理：
  1. 前端 Repo 的 `main` 保護規則（必要檢查：`lint-test-build`、`security-scan`）
  2. 依部署步驟建立 Amplify、設定 SPA rewrite，提供前端網址
  3. 在 EC2 的 `.env` 把前端網址加進 `CORS_ORIGINS`，執行 `docker compose up -d`

## 批次總覽
| 批次 | 分支 | 里程碑 | issue | 狀態 |
|---|---|---|---|---|
| 5 | `feat/fe-catalog` | M3 | #1 專案初始化、#2 版面、#3 首頁、#4 商品列表 | ✅ 已合併（PR #11） |
| 6 | `feat/fe-member-cart` | M3 | #5 註冊登入與 auth store、#6 購物車 | ✅ 已合併（PR #12） |
| 7 | `feat/fe-release` | M4 部署與驗收 | #7 部署設定與 README、#8 線上驗收 | #7 ✅ 已合併（PR #13）；#8 等 Amplify |

後端批次 1–4 已完成，見 `hy0210/runner-gear-api` 的 `docs/PROGRESS.md`。

## 線上環境
- 前端 URL：之後補（Amplify）
- API Base URL：https://d1461t9n4hr1h9.cloudfront.net
- API 文件網址：https://d1461t9n4hr1h9.cloudfront.net/api-docs

## 繳交與退回紀錄
| 日期 | 評分者回饋 | 對應修正 issue |
|---|---|---|
| （尚未繳交） | | |
