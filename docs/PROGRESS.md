# 進度

## 目前狀態
- 里程碑：M3 版面、商品、會員與購物車（批次 5、6 待審）
- 進行中的分支與 issue：`feat/fe-member-cart`（#5、#6）已完成並送審；批次 5（PR #9）待審
- 下一步：批次 7 `feat/fe-release`（#7 部署設定與 README、#8 線上驗收），需要後端已上線與 Amplify
- 等使用者處理：
  1. 依序合併 PR #9、批次 6 的 PR（Create a merge commit，不要 squash）
  2. 前端 Repo 的 `main` 保護規則（必要檢查：`lint-test-build`、`security-scan`）
  3. 後端部署（`runner-gear-api` 的 `docs/deploy.md`），提供 CloudFront 網域與兩組測試帳號
  4. 建立 Amplify 並連結本 Repo（步驟會在批次 7 提供）

## 批次總覽
| 批次 | 分支 | 里程碑 | issue | 狀態 |
|---|---|---|---|---|
| 5 | `feat/fe-catalog` | M3 | #1 專案初始化、#2 版面、#3 首頁、#4 商品列表 | 待審（PR 已開） |
| 6 | `feat/fe-member-cart` | M3 | #5 註冊登入與 auth store、#6 購物車 | 待審（PR 已開） |
| 7 | `feat/fe-release` | M4 部署與驗收 | #7 部署設定與 README、#8 線上驗收 | 未開始 |

後端批次 1–4 已完成，見 `hy0210/runner-gear-api` 的 `docs/PROGRESS.md`。
設計稿（wireframe）：<https://claude.ai/artifact/QWoQ1d3H8EVxjaJT2kd4Lp>

## 線上環境
- 前端 URL：之後補（Amplify）
- API Base URL：之後補（CloudFront 網域）
- API 文件網址：之後補（`<API Base URL>/api-docs`）

## 繳交與退回紀錄
| 日期 | 評分者回饋 | 對應修正 issue |
|---|---|---|
| （尚未繳交） | | |
