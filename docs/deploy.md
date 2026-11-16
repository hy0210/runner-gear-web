# 部署（AWS Amplify Hosting）

前端部署在 Amplify Hosting。建置設定在 `amplify.yml`，安全標頭在 `customHttp.yml`，兩者都在 Repo 裡；主控台只需要設定環境變數與 SPA rewrite。

## 前置條件

- 後端已上線：<https://d1461t9n4hr1h9.cloudfront.net>
- 這個 Repo 的 `main` 已包含 `amplify.yml` 與 `customHttp.yml`

## 一、建立 Amplify App

1. AWS 主控台 → 搜尋 **AWS Amplify** → **Create new app**（或 **Deploy an app**）。
2. 選 **GitHub** → **Next**，依提示授權 GitHub。授權範圍選 **Only select repositories**，只勾 `runner-gear-web`。
3. Repository 選 `hy0210/runner-gear-web`，Branch 選 `main` → **Next**。
4. **App settings**：
   - App name：`runner-gear-web`
   - Build settings：會自動偵測到 Repo 裡的 `amplify.yml`，不用修改。
   - 展開 **Advanced settings** → **Environment variables** → **Add new**：
     - Key：`VITE_API_BASE_URL`
     - Value：`https://d1461t9n4hr1h9.cloudfront.net`（結尾不加斜線，也不加 `/api/v1`）
   - Service role：保留預設（建立新的角色）。
   - 不需要開啟 **Previews**（PR 預覽）。這個 Repo 是公開的，開啟後外部的 PR 也可能觸發建置。
5. **Next** → **Save and deploy**。等 Provision → Build → Deploy 全部變綠。
6. 記下 App 首頁顯示的網址，格式是 `https://main.xxxxxxxx.amplifyapp.com`。

> 建置失敗而且 log 出現「缺少環境變數 VITE_API_BASE_URL」，表示第 4 步的環境變數沒設定。到 **Hosting → Environment variables** 補上後，在 main 分支頁面按 **Redeploy this version**。

## 二、設定 SPA rewrite

讓直接開啟或重新整理 `/products`、`/login` 時不會出現 404。

1. 左側選單 **Hosting → Rewrites and redirects** → **Manage redirects**。
2. 切到 **Open text editor**（JSON），整段換成：

   ```json
   [
     {
       "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
       "target": "/index.html",
       "status": "200",
       "condition": null
     }
   ]
   ```

3. **Save**。這條規則把沒有副檔名的路徑交給 `index.html`，`.js`、`.css` 等靜態檔案照常回傳。

## 三、確認安全標頭

`customHttp.yml` 會自動套用，並覆寫主控台 **Hosting → Custom headers** 的設定，所以主控台那裡不用填。

確認方式：開啟前端網址 → 瀏覽器開發者工具 → **Network** → 點第一個文件請求 → **Response Headers** 應該看到 `content-security-policy`、`strict-transport-security`、`x-content-type-options`、`x-frame-options`、`referrer-policy`。

> 後端網址改變時，要同時修改 `customHttp.yml` 的 `connect-src` 與 Amplify 的 `VITE_API_BASE_URL`，否則瀏覽器會擋下 API 請求。

## 四、讓後端允許前端網址（CORS）

在 EC2 上：

```bash
cd ~/runner-gear-api
nano .env      # CORS_ORIGINS 加上前端網址，多個以逗號分隔，不加結尾斜線
               # 例：CORS_ORIGINS=https://main.xxxxxxxx.amplifyapp.com
docker compose up -d
docker compose ps   # api 為 running (healthy)
```

`CORS_ORIGINS` 只填 Amplify 的完整網址（https、不加結尾斜線），不要用 `*`；正式環境也不需要 `http://localhost:5173`。

## 五、上線後檢查

1. 開啟前端網址，首頁出現商品。
2. 直接在網址列輸入 `<前端網址>/products` 並重新整理，頁面正常（不是 404）。
3. 用測試帳號登入、加入購物車、調整數量、重新整理，購物車內容不變。
4. 開發者工具的 **Console** 沒有 CSP（`Refused to ...`）或 CORS 錯誤。

## 之後的更新

合併到 `main` 後 Amplify 會自動建置並部署，不需要手動操作。
