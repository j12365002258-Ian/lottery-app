<!-- lang: zh-TW -->
# 台灣威力彩幸運產生器 — 開發技術文件

## 專案目標

建立一個純前端、可離線使用的台灣威力彩號碼產生器，部署為 PWA（Progressive Web App），可安裝至手機或電腦桌面。

**威力彩規則：**
- 第一區：從 1–38 不重複選取 6 個號碼
- 第二區：從 1–8 選取 1 個號碼

**設計原則：**
- 使用密碼學級別的隨機數，確保每次抽取為統計獨立事件
- 無後端、無資料上傳，所有運算在瀏覽器本地執行
- 支援批量產生、歷史紀錄、CSV 匯出、數據統計分析

---

## 核心限制

這三條限制是不可妥協的設計紅線，所有新功能開發前必須先對照確認。

| # | 限制 | 說明 |
|---|------|------|
| 1 | **公平性優先** | 嚴禁使用有模數偏差的隨機數邏輯。所有隨機取樣必須透過 `secureRandomInt`（拒絕抽樣）實作，不得直接使用 `Math.random()` 或 `rand % n`。 |
| 2 | **零外部依賴產圖** | 圖示產生（`generate-icons.mjs`）必須維持純 Node.js 內建模組實作（`zlib`、`fs`），不引入任何需要 C++ 原生編譯的套件（如 `canvas`、`sharp`）。 |
| 3 | **離線優先** | 所有新功能必須考慮在無網路環境下的表現。外部資源（字型、API）需納入 Workbox 快取策略；新增的動態資料來源若無法快取，須提供離線降級 UI。 |

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 框架 | React 18 + Vite 8 |
| 樣式 | Tailwind CSS v4（`@tailwindcss/vite` 插件）|
| 圖示庫 | lucide-react |
| PWA | vite-plugin-pwa 1.2（workbox generateSW 模式）|
| 隨機數 | `window.crypto.getRandomValues()` |
| CSV 解析 | papaparse |

---

## 核心演算法

### 問題：模數偏差（Modulo Bias）

直觀的隨機整數寫法 `rand % n` 存在統計缺陷。

`crypto.getRandomValues()` 產生均勻分布於 `[0, 2³²)` 的整數，共 4,294,967,296 個值。當 `n` 無法整除 `2³²` 時，低編號的值會比高編號多出現一次。

**範例（n = 38）：**
```
2^32 = 4,294,967,296
4,294,967,296 mod 38 = 6
→ 0–5 比 6–37 各多出現 1 次
→ 機率差異：1 / 4,294,967,296 ≈ 0.000000023%
```
雖然差異極小，但不符合「真正均等隨機」的設計目標。

### 解法：拒絕抽樣（Rejection Sampling）

```js
const secureRandomInt = (max) => {
  // 計算 2^32 中可整除 max 的最大上界
  // 超過此上界的值一律捨棄重抽，避免低編號被多選到
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
};
```

**原理：**
- `limit` = `floor(2³² / max) × max`，是 `2³²` 以下最大的 `max` 的整數倍
- 落在 `[limit, 2³²)` 的值直接捨棄重抽
- 剩餘的 `limit` 個值可被 `max` 完全整除，每個餘數出現次數相同

**效能影響：**
- 本專案最大範圍 `n = 38`，捨棄概率 = `6 / 4,294,967,296 ≈ 0.00000014%`
- 期望重抽次數 < 1.0000001 次，效能幾乎無影響

### Fisher-Yates 洗牌算法

```js
const secureRandomSample = (min, max, count) => {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1); // 無偏差的隨機索引
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
};
```

每次洗牌都使用 `secureRandomInt`，確保 N! 種排列的出現機率完全相等。

---

## 趨勢指標（明牌模式）架構

### 資料來源

台灣彩券官方 API（從官網 JavaScript bundle 反推得出，免費、無需驗證）：

```
https://api.taiwanlottery.com/TLCAPIWeB/Lottery/SuperLotto638Result
```

**API 發現過程：**
1. 目標頁面 `https://www.taiwanlottery.com/lotto/result/super_lotto638` 為 Nuxt 3 SPA，靜態 HTML 無資料
2. 下載 `/_nuxt/_game_.1_0_8_06.js`，從中找到 `$("/Lottery/SuperLotto638Result", {method:"GET", params:m})`
3. 下載 `/_nuxt/entry.1_0_8_0.js`，從 `window.__NUXT__.config.public.baseURL` 取得真實後端域名

**API 參數：**

| 參數 | 說明 |
|------|------|
| `pageNum` | 頁碼（從 1 開始）|
| `pageSize` | 每頁筆數（最大 200）|
| `month` | 起始月份（YYYY-MM）|
| `endMonth` | 結束月份（YYYY-MM）|

**回傳資料結構（單期）：**

```json
{
  "period": 115000038,
  "lotteryDate": "2026-05-11T00:00:00",
  "drawNumberSize": [15, 19, 23, 26, 31, 38, 5]
}
```

`drawNumberSize` 欄位：前 6 個為第一區（排序後，1-38），最後 1 個為第二區（1-8）。

### 爬蟲設計（scraper.mjs）

- 查詢範圍：當月往前推 14 個月（約 15 個月），確保取得 ≥ 100 期
- 每月間隔 200ms 請求，避免打太快
- 結果去重後依期別排序，保留最近 100 期
- 輸出格式：`public/data/lottery_history.csv`（`Draw_ID, Date, N1-N6, Special`）
  - `Date` 欄位（2026-06 新增）：開獎日期 `YYYY-MM-DD`，取自 API 的 `lotteryDate`
- 換入真實資料只需覆蓋 CSV，欄位格式對齊即可

### 自動排程更新（Windows 工作排程器）

每週二、五 09:00 自動執行爬蟲（開獎日為週一、週四，隔天早上抓最新結果）：

| 項目 | 內容 |
|------|------|
| 工作名稱 | `LotteryDataUpdate`（工作排程器程式庫根目錄）|
| 觸發時間 | 每週二、週五 09:00；若當時關機，開機後補執行（`StartWhenAvailable`）|
| 執行內容 | `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File update-data.ps1` |
| 執行紀錄 | 附加寫入 `lottery-app/scrape.log` |

`update-data.ps1` 以 `$PSScriptRoot` 定位專案目錄（腳本內容不含中文路徑，避免 PowerShell 5.1 編碼問題），再執行 `node scraper.mjs`。

**修改方式：** `taskschd.msc` → 工作排程器程式庫 → `LotteryDataUpdate` → 「動作」分頁改路徑、「觸發程序」分頁改時間；或用 PowerShell `Set-ScheduledTask`。

### 趨勢指標演算法（useLotteryTrends.js）

**熱門度（hotness）**
- 統計最近 30 期各號碼出現次數
- 正規化至 0–100（最高頻號碼 = 100）

**遺漏值（gap）**
- 從最新一期往回掃描，找出各號碼距上次出現已過幾期
- 0 = 本期出現；數字越大 = 越久未出現

**最新一期開獎號碼（2026-06 新增）**
- `computeTrends` 回傳值新增 `latestDraw`（最新一期的 `drawId`、`date`、`zoneA`、`special`）
- UI 顯示於明牌模式展開後、免責聲明下方：期別 + 開獎日期 + 第一區 6 顆深灰球 + 紅色第二區球
- 向後相容：舊版 CSV 無 `Date` 欄位時 `date` 為 `null`，UI 自動隱藏日期

**設計紅線：** 所有指標說明絕不使用「機率」或「中獎率」字眼，僅標示「歷史統計」、「趨勢參考」。

---

## PWA 配置架構

### vite.config.js 完整設定

```js
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icons/*.png'],
  manifest: {
    name: '台灣威力彩幸運產生器',
    short_name: '威力彩',
    description: '使用加密級隨機數產生台灣威力彩號碼',
    theme_color: '#0f172a',
    background_color: '#f8fafc',
    display: 'standalone',
    orientation: 'portrait',
    id: '/',
    scope: '/',
    start_url: '/',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,csv}'],
  },
})
```

CSV 已納入 `globPatterns`，Workbox 會將歷史資料快取供離線使用。

### 為什麼 purpose 必須拆分為兩個獨立項目

**錯誤寫法（`purpose: 'any maskable'`）：**
Chrome 的 PWA installability 檢查器要求每個 icon 物件的 `purpose` 只能是單一值。寫成空格分隔的字串雖然是舊版規範允許的格式，但現代瀏覽器（Chrome 113+）會將其視為無效，導致安裝條件不符。

**正確寫法：**
為同一張圖片分別建立兩個 icon 物件，`purpose` 分別設為 `'any'` 與 `'maskable'`。

| purpose | 用途 |
|---------|------|
| `any` | 一般情況下的 App 圖示（桌面、工作列）|
| `maskable` | Android 自適應圖示（Adaptive Icon），系統可裁切成任意形狀 |

---

## 技術坑洞紀錄

### PNG IDAT 損壞：deflateRaw vs deflate

#### 問題描述

第一版圖示產生腳本（`generate-icons.mjs`）使用 Node.js `zlib.deflateRaw` 壓縮 PNG 像素資料，導致圖示在瀏覽器中無法正確渲染，桌面安裝後顯示預設的文字圖示（「台」字）。

#### 根本原因

PNG 規範（RFC 2083）要求 IDAT chunk 內的壓縮資料必須是 **zlib 格式**，即：

```
[CMF byte][FLG byte][...deflate 壓縮資料...][Adler-32 checksum 4 bytes]
```

`zlib.deflateRaw` 輸出的是**裸 deflate 資料**，沒有 zlib 標頭（CMF/FLG）與 Adler-32 校驗碼，不符合 PNG 規範，導致瀏覽器解碼失敗。

#### 解法

將 `deflateRaw` 改為 `deflate`（Node.js `zlib` 模組的標準函數），它會自動加上 zlib 包裝：

```js
// 錯誤：產生裸 deflate，不含 zlib 標頭
import { deflateRaw } from 'zlib';
const compressed = await promisify(deflateRaw)(rawRows);

// 正確：產生 zlib 格式，含標頭 + Adler-32
import { deflate } from 'zlib';
const compressed = await promisify(deflate)(rawRows, { level: 9 });
```

#### 同時修正的其他問題

| 項目 | 舊版 | 新版 |
|------|------|------|
| PNG 色彩類型 | `colorType=2`（RGB，無透明）| `colorType=6`（RGBA，支援透明）|
| 圓角背景 | 角落填深色（無透明）| 角落設 `alpha=0`（真透明）|
| 掃描線寬度 | `1 + size * 3`（RGB）| `1 + size * 4`（RGBA）|

---

### Windows CSV 檔案鎖定：EBUSY 問題

#### 問題描述

`npm run dev` 流程為 `node scraper.mjs && vite`。第二次以後執行時，`scraper.mjs` 嘗試覆蓋 `public/data/lottery_history.csv` 會拋出：

```
EBUSY: resource busy or locked, open/unlink 'lottery_history.csv'
```

#### 根本原因

Windows 的 Defender 即時保護、搜尋索引服務，或 VS Code 的檔案監聽器，會在檔案寫入後短暫（或持續）持有 exclusive handle，導致後續的 `writeFileSync` / `unlinkSync` 失敗。

#### 解法

三段式寫入策略：

```js
// 1. 先寫暫存檔（不碰原始 CSV）
writeFileSync(TMP, csvContent, 'utf-8');

// 2. 嘗試標準取代
try {
  if (existsSync(OUTPUT)) unlinkSync(OUTPUT);
  renameSync(TMP, OUTPUT);
} catch (e) {
  // 3. EBUSY 時改用 cmd move /y（可繞過 Windows 檔案鎖定）
  if (e.code === 'EBUSY') {
    execSync(`cmd /c move /y "${TMP}" "${OUTPUT}"`);
  } else {
    throw e;
  }
}
```

`cmd /c move /y` 使用 Windows `MoveFileExW` + `MOVEFILE_REPLACE_EXISTING`，可在檔案被其他程序開啟的情況下完成取代。

---

## 檔案結構

```
lottery-app/
├── public/
│   ├── data/
│   │   └── lottery_history.csv     # 100 期真實開獎資料（由 scraper 自動產生）
│   └── icons/
│       ├── icon-192.png            # PWA 圖示 192×192 RGBA
│       └── icon-512.png            # PWA 圖示 512×512 RGBA
├── src/
│   ├── hooks/
│   │   └── useLotteryTrends.js     # fetch CSV → 計算熱門度 & 遺漏值
│   ├── PowerLotteryApp.jsx         # 主元件（含 TrendsSection）
│   ├── App.jsx                     # 進入點，掛載 PowerLotteryApp
│   ├── main.jsx
│   └── index.css                   # Tailwind CSS 匯入
├── scraper.mjs                     # 威力彩歷史資料爬蟲（Node.js ES Module）
├── update-data.ps1                 # 排程器入口：執行 scraper 並寫入 scrape.log
├── scrape.log                      # 排程執行紀錄（自動產生）
├── generate-icons.mjs              # PNG 圖示產生腳本（純 Node.js）
├── vite.config.js                  # Vite + Tailwind + PWA 設定
├── index.html                      # PWA meta tags + Apple touch icon
└── CLAUDE.md                       # 本文件
```

---

## 開發指令

```bash
# 開發模式：自動抓取最新開獎資料，再啟動 localhost
npm run dev

# 只更新歷史資料（不啟動伺服器）
npm run scrape

# 更新資料 + 正式 Build（部署前使用）
npm run scrape:build

# 預覽正式 Build（必須用此指令測試 PWA 安裝）
npm run preview

# 重新產生 PWA 圖示
node generate-icons.mjs
```

> **注意：** PWA 安裝功能只在 `npm run preview`（或部署到 HTTPS 伺服器）後才能使用，`npm run dev` 不啟動 Service Worker。

> **注意：** `npm run dev` 內建爬蟲，需要網路連線才能啟動。離線環境請改用 `vite` 直接啟動（舊資料仍可正常顯示）。

---

## 後續計畫

### 已完成

- [x] 核心選號功能（第一區 1-38 取 6，第二區 1-8 取 1）
- [x] 拒絕抽樣消除模數偏差
- [x] Fisher-Yates 洗牌演算法
- [x] 批量產生（最多 999 組）
- [x] 自訂球池包牌模式（聰明自選組合）：手動圈選候選號池，從中以 `secureSampleFromPool`（Fisher-Yates + 拒絕抽樣）抽出第一區 6 顆、第二區 1 顆；結果與批量產生共用同一 `history`，支援歷史紀錄、localStorage 持久化與 CSV 匯出
- [x] 動畫效果（滾動顯示）
- [x] 歷史紀錄（localStorage 持久化）
- [x] 統計分析（冷熱門、平均總和、連號率）
- [x] CSV 匯出
- [x] 複製到剪貼簿
- [x] PWA 安裝（桌面 + 手機）
- [x] Service Worker 離線快取（Workbox）
- [x] 自製純 Node.js PNG 編碼器（修正 IDAT 格式）
- [x] 明牌模式：台灣彩券官方 API 爬蟲（scraper.mjs）
- [x] 趨勢指標 UI：熱門度（近 30 期頻率）+ 遺漏值（距上次出現期數）
- [x] npm run dev 自動更新資料後啟動伺服器
- [x] 明牌模式顯示最新一期開獎號碼（含開獎日期）
- [x] Windows 工作排程器 `LotteryDataUpdate`：每週二、五 09:00 自動執行爬蟲更新資料

### 待辦

- [ ] 加入開獎日倒數計時（週一、週四）
- [ ] 加入分享功能（Web Share API）
- [ ] 深色模式支援
- [ ] 加入 iOS Safari 啟動畫面（apple-touch-startup-image）
- [ ] 部署至 GitHub Pages 或 Cloudflare Pages（HTTPS，正式 PWA）
