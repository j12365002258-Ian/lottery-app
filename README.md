# 台灣威力彩幸運產生器

純前端、可離線使用的台灣威力彩號碼產生器（PWA，可安裝到手機或電腦桌面）。

- 第一區 1–38 取 6、第二區 1–8 取 1，使用 `crypto.getRandomValues()` + 拒絕抽樣 + Fisher-Yates，無模數偏差
- 批量產生（最多 999 組）、自訂球池包牌、歷史紀錄（localStorage）、CSV 匯出、統計分析
- 明牌模式：以台灣彩券官方近 100 期開獎資料計算熱門度與遺漏值（僅為歷史統計，不代表未來結果）

## 快速啟動（Windows）

雙擊上層資料夾的 `啟動 威力彩.bat`，會自動更新開獎資料、建置並開啟：

```
http://localhost:41738/lottery-app/
```

## 開發指令

```bash
npm run dev           # 抓最新開獎資料後啟動開發伺服器
npm run scrape        # 只更新 public/data/lottery_history.csv
npm run scrape:build  # 更新資料 + 正式 build
npm run preview       # 預覽正式 build（測試 PWA 安裝用）
npm run lint          # ESLint
```

依賴安裝請加 `--legacy-peer-deps`（與 CI 相同）：`npm install --legacy-peer-deps`

## 部署

`.github/workflows/update-data.yml` 每週二、五 09:00（台北時間）自動抓資料、build 並發布到 GitHub Pages（`/lottery-app/`）。

技術細節、設計紅線與踩坑紀錄請見 [CLAUDE.md](CLAUDE.md)。
